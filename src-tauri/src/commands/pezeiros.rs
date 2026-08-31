use crate::db::DbConnection;
use crate::models::Pezeiro;
use rusqlite::params;
use std::collections::HashMap;
use tauri::State;

fn inserir_participacao(
    conn: &rusqlite::Connection,
    id_banco_pezeiro: i64,
    id_prova: i64,
    nome: &str,
    hc: f64,
) -> Result<(i64, Vec<i64>), String> {
    let usa_bateria: i64 = conn
        .query_row(
            "SELECT bateria FROM provas WHERE id = ?1",
            params![id_prova],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO pezeiros (nome, hc, id_prova, id_banco_pezeiro) VALUES (?1, ?2, ?3, ?4)",
        params![nome, hc, id_prova, id_banco_pezeiro],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            "Esse pezeiro já está cadastrado nessa prova.".to_string()
        } else {
            e.to_string()
        }
    })?;

    let id = conn.last_insert_rowid();

    let baterias: Vec<i64> = if usa_bateria != 0 {
        conn.execute(
            "INSERT INTO pezeiro_baterias (id_pezeiro, numero_bateria) VALUES (?1, 1)",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        vec![1]
    } else {
        vec![]
    };

    Ok((id, baterias))
}

/// "Cadastro rápido": cria um pezeiro novo direto no banco global E já registra ele
/// nessa prova, num passo só. Usado quando a pessoa ainda não existe no banco.
#[tauri::command]
pub fn criar_pezeiro(
    nome: String,
    hc: f64,
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Pezeiro, String> {
    if nome.trim().is_empty() {
        return Err("O nome do pezeiro não pode ser vazio.".into());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO banco_pezeiros (nome, hc) VALUES (?1, ?2)",
        params![nome, hc],
    )
    .map_err(|e| e.to_string())?;
    let id_banco_pezeiro = conn.last_insert_rowid();

    let (id, baterias) = inserir_participacao(&conn, id_banco_pezeiro, id_prova, &nome, hc)?;

    Ok(Pezeiro {
        id,
        nome,
        hc,
        id_prova,
        id_banco_pezeiro,
        baterias,
    })
}

/// Registra nessa prova um pezeiro que JÁ EXISTE no banco global (selecionado pelo usuário).
#[tauri::command]
pub fn adicionar_pezeiro_a_prova(
    id_banco_pezeiro: i64,
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Pezeiro, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let (nome, hc): (String, f64) = conn
        .query_row(
            "SELECT nome, hc FROM banco_pezeiros WHERE id = ?1",
            params![id_banco_pezeiro],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| e.to_string())?;

    let (id, baterias) = inserir_participacao(&conn, id_banco_pezeiro, id_prova, &nome, hc)?;

    Ok(Pezeiro {
        id,
        nome,
        hc,
        id_prova,
        id_banco_pezeiro,
        baterias,
    })
}

/// Lista os pezeiros de uma prova específica — nome/HC sempre vêm do banco global (JOIN),
/// já com as baterias de cada um.
#[tauri::command]
pub fn listar_pezeiros_por_prova(
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Vec<Pezeiro>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT p.id, bp.nome, bp.hc, p.id_prova, p.id_banco_pezeiro
             FROM pezeiros p
             JOIN banco_pezeiros bp ON bp.id = p.id_banco_pezeiro
             WHERE p.id_prova = ?1
             ORDER BY bp.nome",
        )
        .map_err(|e| e.to_string())?;

    let mut pezeiros = stmt
        .query_map(params![id_prova], |row| {
            Ok(Pezeiro {
                id: row.get(0)?,
                nome: row.get(1)?,
                hc: row.get(2)?,
                id_prova: row.get(3)?,
                id_banco_pezeiro: row.get(4)?,
                baterias: Vec::new(),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Busca todas as baterias de uma vez (evita N+1 query) e agrupa por id_pezeiro.
    let mut stmt_baterias = conn
        .prepare(
            "SELECT pb.id_pezeiro, pb.numero_bateria
             FROM pezeiro_baterias pb
             JOIN pezeiros p ON p.id = pb.id_pezeiro
             WHERE p.id_prova = ?1
             ORDER BY pb.numero_bateria",
        )
        .map_err(|e| e.to_string())?;

    let mut baterias_por_pezeiro: HashMap<i64, Vec<i64>> = HashMap::new();
    let linhas = stmt_baterias
        .query_map(params![id_prova], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|e| e.to_string())?;

    for linha in linhas {
        let (id_pezeiro, numero_bateria) = linha.map_err(|e| e.to_string())?;
        baterias_por_pezeiro
            .entry(id_pezeiro)
            .or_default()
            .push(numero_bateria);
    }

    for pezeiro in &mut pezeiros {
        if let Some(baterias) = baterias_por_pezeiro.remove(&pezeiro.id) {
            pezeiro.baterias = baterias;
        }
    }

    Ok(pezeiros)
}

/// Substitui o conjunto de baterias de um pezeiro pelo informado (apaga as antigas e insere as novas).
#[tauri::command]
pub fn atualizar_baterias_pezeiro(
    id: i64,
    baterias: Vec<i64>,
    db: State<DbConnection>,
) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute(
        "DELETE FROM pezeiro_baterias WHERE id_pezeiro = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    for numero_bateria in &baterias {
        tx.execute(
            "INSERT INTO pezeiro_baterias (id_pezeiro, numero_bateria) VALUES (?1, ?2)",
            params![id, numero_bateria],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.execute(
        "UPDATE pezeiros SET updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

/// Remove o pezeiro DESSA prova (apaga só a participação — o registro dele no banco
/// global continua existindo, disponível pra outras provas).
#[tauri::command]
pub fn deletar_pezeiro(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM pezeiros WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}