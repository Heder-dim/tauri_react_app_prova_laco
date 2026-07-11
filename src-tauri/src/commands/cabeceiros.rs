use crate::db::DbConnection;
use crate::models::Cabeceiro;
use rusqlite::params;
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

    conn.execute(
        "INSERT INTO cabeceiros (nome, hc, id_prova) VALUES (?1, ?2, ?3)",
        params![nome, hc, id_prova],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Cabeceiro { id, nome, hc, id_prova })
}

/// Lista os cabeceiros de uma prova específica — é isso que implementa o "filtro por id da prova".
#[tauri::command]
pub fn listar_cabeceiros_por_prova(
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Vec<Cabeceiro>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, nome, hc, id_prova FROM cabeceiros WHERE id_prova = ?1 ORDER BY nome")
        .map_err(|e| e.to_string())?;

    let cabeceiros = stmt
        .query_map(params![id_prova], |row| {
            Ok(Cabeceiro {
                id: row.get(0)?,
                nome: row.get(1)?,
                hc: row.get(2)?,
                id_prova: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(cabeceiros)
}

#[tauri::command]
pub fn deletar_cabeceiro(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM cabeceiros WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
