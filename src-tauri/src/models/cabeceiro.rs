use serde::{Deserialize, Serialize};

/// Representa a PARTICIPAÇÃO de um cabeceiro numa prova. `nome`/`hc` são sempre os valores
/// atuais do banco global (via JOIN com banco_cabeceiros) — nunca a coluna obsoleta que
/// ainda existe na tabela `cabeceiros` por compatibilidade.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cabeceiro {
    /// Id da participação (linha em `cabeceiros`) — é o que `duplas`/baterias referenciam.
    pub id: i64,
    pub nome: String,
    pub hc: f64,
    pub id_prova: i64,
    /// Quem esse cabeceiro é no banco global — de lá vêm nome/hc.
    pub id_banco_cabeceiro: i64,
    /// Baterias que esse cabeceiro pertence (pode estar em mais de uma). Vazio = sem bateria.
    pub baterias: Vec<i64>,
}