use crate::db::DbConnection;
use crate::models::BancoCabeceiro;
use rusqlite::params;
use tauri::State;

/// Lista todo o banco global de cabeceiros — não filtra por prova nenhuma.
#[tauri::command]
pub fn listar_banco_cabeceiros(db: State<DbConnection>) -> Result<Vec<BancoCabeceiro>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, nome, hc FROM banco_cabeceiros ORDER BY nome")
        .map_err(|e| e.to_string())?;

    let cabeceiros = stmt
        .query_map([], |row| {
            Ok(BancoCabeceiro {
                id: row.get(0)?,
                nome: row.get(1)?,
                hc: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(cabeceiros)
}

/// Cria um cabeceiro direto no banco global, sem vínculo com nenhuma prova.
#[tauri::command]
pub fn criar_banco_cabeceiro(
    nome: String,
    hc: f64,
    db: State<DbConnection>,
) -> Result<BancoCabeceiro, String> {
    if nome.trim().is_empty() {
        return Err("O nome do cabeceiro não pode ser vazio.".into());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO banco_cabeceiros (nome, hc) VALUES (?1, ?2)",
        params![nome, hc],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(BancoCabeceiro { id, nome, hc })
}

/// Atualiza nome/HC de um cabeceiro no banco — reflete em todas as provas onde ele já
/// está registrado, já que elas só guardam uma referência (`id_banco_cabeceiro`), não uma cópia.
#[tauri::command]
pub fn atualizar_banco_cabeceiro(
    id: i64,
    nome: String,
    hc: f64,
    db: State<DbConnection>,
) -> Result<(), String> {
    if nome.trim().is_empty() {
        return Err("O nome do cabeceiro não pode ser vazio.".into());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE banco_cabeceiros SET nome = ?1, hc = ?2, updated_at = datetime('now') WHERE id = ?3",
        params![nome, hc, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Exclui um cabeceiro do banco global. Bloqueado se ele já estiver registrado em
/// alguma prova (protege o histórico — pra remover de verdade, precisa tirá-lo de
/// cada prova primeiro).
#[tauri::command]
pub fn deletar_banco_cabeceiro(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let quantidade_provas: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM cabeceiros WHERE id_banco_cabeceiro = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if quantidade_provas > 0 {
        return Err(format!(
            "Esse cabeceiro já está registrado em {quantidade_provas} prova(s). Remova-o de cada prova antes de excluir do banco."
        ));
    }

    conn.execute("DELETE FROM banco_cabeceiros WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
