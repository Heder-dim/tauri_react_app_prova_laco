use crate::db::DbConnection;
use crate::models::Cabeceiro;
use rusqlite::params;
use std::collections::HashMap;
use tauri::State;

#[tauri::command]
pub fn criar_cabeceiro(
    nome: String,
    hc: f64,
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Cabeceiro, String> {
    if nome.trim().is_empty() {
        return Err("O nome do cabeceiro não pode ser vazio.".into());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Se a prova usa baterias, todo cabeceiro novo já nasce na bateria 1 por padrão
    // (o usuário pode ajustar depois pelo popover de baterias na lista).
    let usa_bateria: i64 = conn
        .query_row(
            "SELECT bateria FROM provas WHERE id = ?1",
            params![id_prova],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO cabeceiros (nome, hc, id_prova) VALUES (?1, ?2, ?3)",
        params![nome, hc, id_prova],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let baterias: Vec<i64> = if usa_bateria != 0 {
        conn.execute(
            "INSERT INTO cabeceiro_baterias (id_cabeceiro, numero_bateria) VALUES (?1, 1)",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        vec![1]
    } else {
        vec![]
    };

    Ok(Cabeceiro {
        id,
        nome,
        hc,
        id_prova,
        baterias,
    })
}

/// Lista os cabeceiros de uma prova específica, já com as baterias de cada um.
#[tauri::command]
pub fn listar_cabeceiros_por_prova(
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Vec<Cabeceiro>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, nome, hc, id_prova FROM cabeceiros WHERE id_prova = ?1 ORDER BY nome")
        .map_err(|e| e.to_string())?;

    let mut cabeceiros = stmt
        .query_map(params![id_prova], |row| {
            Ok(Cabeceiro {
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

    // Busca todas as baterias de uma vez (evita N+1 query) e agrupa por id_cabeceiro.
    let mut stmt_baterias = conn
        .prepare(
            "SELECT cb.id_cabeceiro, cb.numero_bateria
             FROM cabeceiro_baterias cb
             JOIN cabeceiros c ON c.id = cb.id_cabeceiro
             WHERE c.id_prova = ?1
             ORDER BY cb.numero_bateria",
        )
        .map_err(|e| e.to_string())?;

    let mut baterias_por_cabeceiro: HashMap<i64, Vec<i64>> = HashMap::new();
    let linhas = stmt_baterias
        .query_map(params![id_prova], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|e| e.to_string())?;

    for linha in linhas {
        let (id_cabeceiro, numero_bateria) = linha.map_err(|e| e.to_string())?;
        baterias_por_cabeceiro
            .entry(id_cabeceiro)
            .or_default()
            .push(numero_bateria);
    }

    for cabeceiro in &mut cabeceiros {
        if let Some(baterias) = baterias_por_cabeceiro.remove(&cabeceiro.id) {
            cabeceiro.baterias = baterias;
        }
    }

    Ok(cabeceiros)
}

/// Substitui o conjunto de baterias de um cabeceiro pelo informado (apaga as antigas e insere as novas).
#[tauri::command]
pub fn atualizar_baterias_cabeceiro(
    id: i64,
    baterias: Vec<i64>,
    db: State<DbConnection>,
) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute(
        "DELETE FROM cabeceiro_baterias WHERE id_cabeceiro = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    for numero_bateria in &baterias {
        tx.execute(
            "INSERT INTO cabeceiro_baterias (id_cabeceiro, numero_bateria) VALUES (?1, ?2)",
            params![id, numero_bateria],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.execute(
        "UPDATE cabeceiros SET updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn deletar_cabeceiro(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM cabeceiros WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}