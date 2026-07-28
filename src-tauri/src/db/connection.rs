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

    // Migrações leves pra bancos criados antes de cada coluna existir — precisam rodar
    // ANTES do schema.sql, porque o schema já tem índices/consultas que dependem dessas
    // colunas existirem. Como `CREATE TABLE IF NOT EXISTS` não altera tabelas já existentes,
    // sem isso um banco antigo travaria ao tentar criar um índice numa coluna inexistente.
    // Ignora o erro se a coluna já existir (ou se a tabela ainda nem existir, num banco novo).
    let _ = conn.execute("ALTER TABLE duplas ADD COLUMN boi_6 REAL", []);
    let _ = conn.execute(
        "ALTER TABLE provas ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Aberta'",
        [],
    );
    let _ = conn.execute("ALTER TABLE duplas ADD COLUMN inscricao INTEGER", []);
    let _ = conn.execute("ALTER TABLE cabeceiros ADD COLUMN numero_bateria INTEGER", []);
    let _ = conn.execute("ALTER TABLE pezeiros ADD COLUMN numero_bateria INTEGER", []);
    let _ = conn.execute("ALTER TABLE provas ADD COLUMN limite_inscricao INTEGER", []);
    let _ = conn.execute(
        "ALTER TABLE duplas ADD COLUMN sorteada INTEGER NOT NULL DEFAULT 0",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE duplas ADD COLUMN eliminada INTEGER NOT NULL DEFAULT 0",
        [],
    );

    conn.execute_batch(SCHEMA)?;

    // Migração de dados: copia o valor antigo de cabeceiros.numero_bateria/pezeiros.numero_bateria
    // (relacionamento 1:1) pras tabelas novas cabeceiro_baterias/pezeiro_baterias (relacionamento N:N).
    // Precisa rodar DEPOIS do schema, porque as tabelas novas só existem a partir daqui.
    // INSERT OR IGNORE torna isso seguro de rodar toda vez que o app abre (não duplica).
    conn.execute_batch(
        "INSERT OR IGNORE INTO cabeceiro_baterias (id_cabeceiro, numero_bateria)
         SELECT id, numero_bateria FROM cabeceiros WHERE numero_bateria IS NOT NULL;

         INSERT OR IGNORE INTO pezeiro_baterias (id_pezeiro, numero_bateria)
         SELECT id, numero_bateria FROM pezeiros WHERE numero_bateria IS NOT NULL;",
    )?;

    Ok(conn)
}