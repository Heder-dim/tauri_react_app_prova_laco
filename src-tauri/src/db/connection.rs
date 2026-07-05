use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

/// Wrapper em torno da conexão SQLite, guardado como estado gerenciado pelo Tauri.
/// O Mutex garante acesso exclusivo — comandos concorrentes esperam a vez.
pub struct DbConnection(pub Mutex<Connection>);

const SCHEMA: &str = include_str!("../../database/schema.sql");

/// Abre (ou cria) o banco de dados no diretório de dados do app e aplica o schema.
/// Como o schema usa `CREATE TABLE IF NOT EXISTS`, rodar isso toda vez que o app abre é seguro.
pub fn init_db(app: &AppHandle) -> Result<Connection, Box<dyn std::error::Error>> {
    let app_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("laco.db");
    let conn = Connection::open(db_path)?;

    // Necessário em toda conexão SQLite — por padrão as FKs vêm desligadas.
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    conn.execute_batch(SCHEMA)?;

    Ok(conn)
}