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

    // Se a prova usa baterias, todo pezeiro novo já nasce na bateria 1 por padrão
    // (o usuário pode trocar depois pelo dropdown de bateria na lista).
    let usa_bateria: i64 = conn
        .query_row(
            "SELECT bateria FROM provas WHERE id = ?1",
            params![id_prova],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let numero_bateria: Option<i64> = if usa_bateria != 0 { Some(1) } else { None };

    conn.execute(
        "INSERT INTO pezeiros (nome, hc, id_prova, numero_bateria) VALUES (?1, ?2, ?3, ?4)",
        params![nome, hc, id_prova, numero_bateria],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Pezeiro {
        id,
        nome,
        hc,
        id_prova,
        numero_bateria,
    })
}

#[tauri::command]
pub fn listar_pezeiros_por_prova(
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Vec<Pezeiro>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, nome, hc, id_prova, numero_bateria FROM pezeiros WHERE id_prova = ?1 ORDER BY nome",
        )
        .map_err(|e| e.to_string())?;

    let pezeiros = stmt
        .query_map(params![id_prova], |row| {
            Ok(Pezeiro {
                id: row.get(0)?,
                nome: row.get(1)?,
                hc: row.get(2)?,
                id_prova: row.get(3)?,
                numero_bateria: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(pezeiros)
}

/// Atribui (ou remove, se `numero_bateria` for None) a bateria de um pezeiro.
#[tauri::command]
pub fn atualizar_bateria_pezeiro(
    id: i64,
    numero_bateria: Option<i64>,
    db: State<DbConnection>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE pezeiros SET numero_bateria = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![numero_bateria, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn deletar_pezeiro(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM pezeiros WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}