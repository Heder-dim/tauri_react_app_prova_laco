use crate::db::DbConnection;
use crate::models::Prova;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn criar_prova(
    nome: String,
    data: String,
    bateria: bool,
    bateria_nu: Option<i64>,
    db: State<DbConnection>,
) -> Result<Prova, String> {
    if nome.trim().is_empty() {
        return Err("O nome da prova não pode ser vazio.".into());
    }
    if bateria && bateria_nu.is_none() {
        return Err("Informe a quantidade de baterias.".into());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO provas (nome, data, bateria, bateria_nu) VALUES (?1, ?2, ?3, ?4)",
        params![nome, data, bateria as i64, bateria_nu],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Prova {
        id,
        nome,
        data,
        bateria,
        bateria_nu,
    })
}

#[tauri::command]
pub fn listar_provas(db: State<DbConnection>) -> Result<Vec<Prova>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, nome, data, bateria, bateria_nu FROM provas ORDER BY data DESC")
        .map_err(|e| e.to_string())?;

    let provas = stmt
        .query_map([], |row| {
            Ok(Prova {
                id: row.get(0)?,
                nome: row.get(1)?,
                data: row.get(2)?,
                bateria: row.get::<_, i64>(3)? != 0,
                bateria_nu: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(provas)
}

#[tauri::command]
pub fn deletar_prova(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM provas WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}