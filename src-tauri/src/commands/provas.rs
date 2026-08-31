use crate::db::DbConnection;
use crate::models::Prova;
use rusqlite::params;
use tauri::State;

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn criar_prova(
    nome: String,
    data: String,
    bateria: bool,
    bateria_nu: Option<i64>,
    categoria: String,
    limite_inscricao: Option<i64>,
    db: State<DbConnection>,
) -> Result<Prova, String> {
    if nome.trim().is_empty() {
        return Err("O nome da prova não pode ser vazio.".into());
    }
    if bateria && bateria_nu.is_none() {
        return Err("Informe a quantidade de baterias.".into());
    }
    if categoria != "Aberta" && categoria != "Soma" {
        return Err("Categoria deve ser \"Aberta\" ou \"Soma\".".into());
    }
    if let Some(limite) = limite_inscricao {
        if limite < 1 {
            return Err("O limite de inscrições precisa ser maior que zero.".into());
        }
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO provas (nome, data, bateria, bateria_nu, categoria, limite_inscricao)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![nome, data, bateria as i64, bateria_nu, categoria, limite_inscricao],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Prova {
        id,
        nome,
        data,
        bateria,
        bateria_nu,
        categoria,
        limite_inscricao,
    })
}

#[tauri::command]
pub fn buscar_prova(id: i64, db: State<DbConnection>) -> Result<Prova, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, nome, data, bateria, bateria_nu, categoria, limite_inscricao FROM provas WHERE id = ?1",
        params![id],
        |row| {
            Ok(Prova {
                id: row.get(0)?,
                nome: row.get(1)?,
                data: row.get(2)?,
                bateria: row.get::<_, i64>(3)? != 0,
                bateria_nu: row.get(4)?,
                categoria: row.get(5)?,
                limite_inscricao: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn listar_provas(db: State<DbConnection>) -> Result<Vec<Prova>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, nome, data, bateria, bateria_nu, categoria, limite_inscricao
             FROM provas ORDER BY data DESC",
        )
        .map_err(|e| e.to_string())?;

    let provas = stmt
        .query_map([], |row| {
            Ok(Prova {
                id: row.get(0)?,
                nome: row.get(1)?,
                data: row.get(2)?,
                bateria: row.get::<_, i64>(3)? != 0,
                bateria_nu: row.get(4)?,
                categoria: row.get(5)?,
                limite_inscricao: row.get(6)?,
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