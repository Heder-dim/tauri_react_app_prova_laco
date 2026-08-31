use serde::{Deserialize, Serialize};

/// Um competidor no banco global de cabeceiros — independente de qualquer prova.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BancoCabeceiro {
    pub id: i64,
    pub nome: String,
    pub hc: f64,
}
