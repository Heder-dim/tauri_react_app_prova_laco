use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dupla {
    pub id: i64,
    pub id_cabeceiro: i64,
    pub id_pezeiro: i64,
    pub numero_bateria: Option<i64>,
    pub inscricao: Option<i64>,
    pub hc_soma: Option<f64>,
    pub bois_nu: i64,
    pub boi_1: Option<f64>,
    pub boi_2: Option<f64>,
    pub boi_3: Option<f64>,
    pub boi_4: Option<f64>,
    pub boi_5: Option<f64>,
    pub boi_6: Option<f64>,
    pub parcial: Option<f64>,
    pub boi_final: Option<f64>,
    pub media: Option<f64>,
    pub para_ganhar: Option<f64>,
    pub ganhador: bool,
    /// Se essa dupla foi formada pelo botão "Sortear Duplas" (true) ou manualmente (false).
    pub sorteada: bool,
}

/// Mesma coisa que `Dupla`, mas já vem com nome/HC do cabeceiro e do pezeiro (via JOIN),
/// pra não precisar de queries extras no front-end pra montar a tabela.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplaDetalhada {
    pub id: i64,
    pub id_cabeceiro: i64,
    pub cabeceiro_nome: String,
    pub hc_cabeceiro: f64,
    pub id_pezeiro: i64,
    pub pezeiro_nome: String,
    pub hc_pezeiro: f64,
    pub numero_bateria: Option<i64>,
    pub inscricao: Option<i64>,
    pub hc_soma: Option<f64>,
    pub bois_nu: i64,
    pub boi_1: Option<f64>,
    pub boi_2: Option<f64>,
    pub boi_3: Option<f64>,
    pub boi_4: Option<f64>,
    pub boi_5: Option<f64>,
    pub boi_6: Option<f64>,
    pub parcial: Option<f64>,
    pub boi_final: Option<f64>,
    pub media: Option<f64>,
    pub para_ganhar: Option<f64>,
    pub ganhador: bool,
    pub sorteada: bool,
}