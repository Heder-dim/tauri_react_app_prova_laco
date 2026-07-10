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
            commands::provas::buscar_prova,
            commands::provas::deletar_prova,
            commands::cabeceiros::criar_cabeceiro,
            commands::cabeceiros::listar_cabeceiros_por_prova,
            commands::cabeceiros::deletar_cabeceiro,
            commands::pezeiros::criar_pezeiro,
            commands::pezeiros::listar_pezeiros_por_prova,
            commands::pezeiros::deletar_pezeiro,
            commands::duplas::criar_dupla,
            commands::duplas::listar_duplas_por_cabeceiro,
            commands::duplas::listar_duplas_por_pezeiro,
            commands::duplas::listar_duplas_por_prova,
            commands::duplas::atualizar_dupla,
            commands::duplas::deletar_dupla,
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar a aplicação Tauri");
}