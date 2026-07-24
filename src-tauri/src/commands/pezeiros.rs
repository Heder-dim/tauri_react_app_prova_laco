use crate::db::DbConnection;
use crate::models::Pezeiro;
use rusqlite::params;
use std::collections::HashMap;
use tauri::State;

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

    // Se a prova usa baterias, todo pezeiro novo já nasce na bateria 1 por padrão
    // (o usuário pode ajustar depois pelo popover de baterias na lista).
    let usa_bateria: i64 = conn
        .query_row(
            "SELECT bateria FROM provas WHERE id = ?1",
            params![id_prova],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO pezeiros (nome, hc, id_prova) VALUES (?1, ?2, ?3)",
        params![nome, hc, id_prova],
    )
    .map_err(|e| e.to_string())?;

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

    Ok(Pezeiro {
        id,
        nome,
        hc,
        id_prova,
        baterias,
    })
}

/// Lista os pezeiros de uma prova específica, já com as baterias de cada um.
#[tauri::command]
pub fn listar_pezeiros_por_prova(
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Vec<Pezeiro>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, nome, hc, id_prova FROM pezeiros WHERE id_prova = ?1 ORDER BY nome")
        .map_err(|e| e.to_string())?;

    let mut pezeiros = stmt
        .query_map(params![id_prova], |row| {
            Ok(Pezeiro {
                id: row.get(0)?,
                nome: row.get(1)?,
                hc: row.get(2)?,
                id_prova: row.get(3)?,
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

#[tauri::command]
pub fn deletar_pezeiro(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM pezeiros WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}