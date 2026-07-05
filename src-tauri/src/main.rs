// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Se seu `npm run tauri init` já gerou um main.rs, funda este conteúdo com o que já existe
// (mantendo o `#![cfg_attr(...)]` do topo, se houver).

mod commands;
mod db;
mod models;

use db::DbConnection;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            let conn = db::init_db(app_handle)?;
            app.manage(DbConnection(std::sync::Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::provas::criar_prova,
            commands::provas::listar_provas,
            commands::provas::deletar_prova,
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar a aplicação Tauri");
}