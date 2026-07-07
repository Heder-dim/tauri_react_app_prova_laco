use crate::db::DbConnection;
use crate::models::{Dupla, DuplaDetalhada};
use rusqlite::params;
use tauri::State;

fn map_dupla_detalhada(row: &rusqlite::Row) -> rusqlite::Result<DuplaDetalhada> {
    Ok(DuplaDetalhada {
        id: row.get(0)?,
        id_cabeceiro: row.get(1)?,
        cabeceiro_nome: row.get(2)?,
        hc_cabeceiro: row.get(3)?,
        id_pezeiro: row.get(4)?,
        pezeiro_nome: row.get(5)?,
        hc_pezeiro: row.get(6)?,
        numero_bateria: row.get(7)?,
        hc_soma: row.get(8)?,
        bois_nu: row.get(9)?,
        boi_1: row.get(10)?,
        boi_2: row.get(11)?,
        boi_3: row.get(12)?,
        boi_4: row.get(13)?,
        boi_5: row.get(14)?,
        boi_6: row.get(15)?,
        parcial: row.get(16)?,
        boi_final: row.get(17)?,
        media: row.get(18)?,
        para_ganhar: row.get(19)?,
        ganhador: row.get::<_, i64>(20)? != 0,
    })
}

const SELECT_DUPLA_DETALHADA: &str = "
    SELECT
        duplas.id, duplas.id_cabeceiro, cabeceiros.nome, cabeceiros.hc,
        duplas.id_pezeiro, pezeiros.nome, pezeiros.hc,
        duplas.numero_bateria, duplas.hc_soma, duplas.bois_nu,
        duplas.boi_1, duplas.boi_2, duplas.boi_3, duplas.boi_4, duplas.boi_5, duplas.boi_6,
        duplas.parcial, duplas.boi_final, duplas.media, duplas.para_ganhar, duplas.ganhador
    FROM duplas
    JOIN cabeceiros ON cabeceiros.id = duplas.id_cabeceiro
    JOIN pezeiros   ON pezeiros.id   = duplas.id_pezeiro
";

#[tauri::command]
pub fn criar_dupla(
    id_cabeceiro: i64,
    id_pezeiro: i64,
    numero_bateria: Option<i64>,
    hc_soma: f64,
    bois_nu: i64,
    db: State<DbConnection>,
) -> Result<Dupla, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO duplas (id_cabeceiro, id_pezeiro, numero_bateria, hc_soma, bois_nu)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id_cabeceiro, id_pezeiro, numero_bateria, hc_soma, bois_nu],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Dupla {
        id,
        id_cabeceiro,
        id_pezeiro,
        numero_bateria,
        hc_soma: Some(hc_soma),
        bois_nu,
        boi_1: None,
        boi_2: None,
        boi_3: None,
        boi_4: None,
        boi_5: None,
        boi_6: None,
        parcial: None,
        boi_final: None,
        media: None,
        para_ganhar: None,
        ganhador: false,
    })
}

/// Usado na tela de Dashboard — duplas de um cabeceiro específico.
#[tauri::command]
pub fn listar_duplas_por_cabeceiro(
    id_cabeceiro: i64,
    db: State<DbConnection>,
) -> Result<Vec<DuplaDetalhada>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let sql = format!("{SELECT_DUPLA_DETALHADA} WHERE duplas.id_cabeceiro = ?1 ORDER BY duplas.id");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let duplas = stmt
        .query_map(params![id_cabeceiro], map_dupla_detalhada)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(duplas)
}

/// Usado na tela de Duplas e Resultados — todas as duplas de todos os cabeceiros de uma prova.
#[tauri::command]
pub fn listar_duplas_por_prova(
    id_prova: i64,
    db: State<DbConnection>,
) -> Result<Vec<DuplaDetalhada>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let sql =
        format!("{SELECT_DUPLA_DETALHADA} WHERE cabeceiros.id_prova = ?1 ORDER BY duplas.id");
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let duplas = stmt
        .query_map(params![id_prova], map_dupla_detalhada)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(duplas)
}

/// Atualiza os campos calculados/editáveis de uma dupla (tempos, boi final, parcial, média, para ganhar).
/// O front-end já manda tudo pronto — o backend só persiste.
#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn atualizar_dupla(
    id: i64,
    boi_1: Option<f64>,
    boi_2: Option<f64>,
    boi_3: Option<f64>,
    boi_4: Option<f64>,
    boi_5: Option<f64>,
    boi_6: Option<f64>,
    parcial: Option<f64>,
    boi_final: Option<f64>,
    media: Option<f64>,
    para_ganhar: Option<f64>,
    db: State<DbConnection>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE duplas SET
            boi_1 = ?1, boi_2 = ?2, boi_3 = ?3, boi_4 = ?4, boi_5 = ?5, boi_6 = ?6,
            parcial = ?7, boi_final = ?8, media = ?9, para_ganhar = ?10,
            updated_at = datetime('now')
         WHERE id = ?11",
        params![
            boi_1, boi_2, boi_3, boi_4, boi_5, boi_6, parcial, boi_final, media, para_ganhar, id
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn deletar_dupla(id: i64, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM duplas WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}