use crate::db::DbConnection;
use crate::models::Pezeiro;
use rusqlite::params;
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

    conn.execute(
        "INSERT INTO pezeiros (nome, hc, id_prova) VALUES (?1, ?2, ?3)",
        params![nome, hc, id_prova],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Pezeiro { id, nome, hc, id_prova })
}

#[tauri::command]
pub fn listar_pezeiros_por_prova(
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Vec<Pezeiro>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, nome, hc, id_prova FROM pezeiros WHERE id_prova = ?1 ORDER BY nome")
        .map_err(|e| e.to_string())?;

    let pezeiros = stmt
        .query_map(params![id_prova], |row| {
            Ok(Pezeiro {
                id: row.get(0)?,
                nome: row.get(1)?,
                hc: row.get(2)?,
                id_prova: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(pezeiros)
}

#[tauri::command]
pub fn deletar_pezeiro(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM pezeiros WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
