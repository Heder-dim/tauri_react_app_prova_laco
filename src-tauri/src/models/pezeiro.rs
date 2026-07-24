use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pezeiro {
    pub id: i64,
    pub nome: String,
    pub hc: f64,
    pub id_prova: i64,
    /// Baterias que esse pezeiro pertence (pode estar em mais de uma). Vazio = sem bateria.
    pub baterias: Vec<i64>,
}