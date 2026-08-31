use crate::db::DbConnection;
use crate::models::BancoPezeiro;
use rusqlite::params;
use tauri::State;

/// Lista todo o banco global de pezeiros — não filtra por prova nenhuma.
#[tauri::command]
pub fn listar_banco_pezeiros(db: State<DbConnection>) -> Result<Vec<BancoPezeiro>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, nome, hc FROM banco_pezeiros ORDER BY nome")
        .map_err(|e| e.to_string())?;

    let pezeiros = stmt
        .query_map([], |row| {
            Ok(BancoPezeiro {
                id: row.get(0)?,
                nome: row.get(1)?,
                hc: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(pezeiros)
}

/// Cria um pezeiro direto no banco global, sem vínculo com nenhuma prova.
#[tauri::command]
pub fn criar_banco_pezeiro(
    nome: String,
    hc: f64,
    db: State<DbConnection>,
) -> Result<BancoPezeiro, String> {
    if nome.trim().is_empty() {
        return Err("O nome do pezeiro não pode ser vazio.".into());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO banco_pezeiros (nome, hc) VALUES (?1, ?2)",
        params![nome, hc],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(BancoPezeiro { id, nome, hc })
}

/// Atualiza nome/HC de um pezeiro no banco — reflete em todas as provas onde ele já
/// está registrado, já que elas só guardam uma referência (`id_banco_pezeiro`), não uma cópia.
#[tauri::command]
pub fn atualizar_banco_pezeiro(
    id: i64,
    nome: String,
    hc: f64,
    db: State<DbConnection>,
) -> Result<(), String> {
    if nome.trim().is_empty() {
        return Err("O nome do pezeiro não pode ser vazio.".into());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE banco_pezeiros SET nome = ?1, hc = ?2, updated_at = datetime('now') WHERE id = ?3",
        params![nome, hc, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Exclui um pezeiro do banco global. Bloqueado se ele já estiver registrado em
/// alguma prova (protege o histórico — pra remover de verdade, precisa tirá-lo de
/// cada prova primeiro).
#[tauri::command]
pub fn deletar_banco_pezeiro(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let quantidade_provas: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pezeiros WHERE id_banco_pezeiro = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if quantidade_provas > 0 {
        return Err(format!(
            "Esse pezeiro já está registrado em {quantidade_provas} prova(s). Remova-o de cada prova antes de excluir do banco."
        ));
    }

    conn.execute("DELETE FROM banco_pezeiros WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
