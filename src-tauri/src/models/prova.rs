use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prova {
    pub id: i64,
    pub nome: String,
    pub data: String, // ISO 8601 (YYYY-MM-DD)
    pub bateria: bool,
    pub bateria_nu: Option<i64>,
    pub categoria: String, // "Aberta" ou "Soma"
    /// Limite de inscrições por competidor nessa prova. None = sem limite.
    pub limite_inscricao: Option<i64>,
}