use serde::{Deserialize, Serialize};

/// Um competidor no banco global de pezeiros — independente de qualquer prova.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BancoPezeiro {
    pub id: i64,
    pub nome: String,
    pub hc: f64,
}
