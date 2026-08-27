use serde::{Deserialize, Serialize};

/// Representa a PARTICIPAÇÃO de um pezeiro numa prova. `nome`/`hc` são sempre os valores
/// atuais do banco global (via JOIN com banco_pezeiros) — nunca a coluna obsoleta que
/// ainda existe na tabela `pezeiros` por compatibilidade.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pezeiro {
    /// Id da participação (linha em `pezeiros`) — é o que `duplas`/baterias referenciam.
    pub id: i64,
    pub nome: String,
    pub hc: f64,
    pub id_prova: i64,
    /// Quem esse pezeiro é no banco global — de lá vêm nome/hc.
    pub id_banco_pezeiro: i64,
    /// Baterias que esse pezeiro pertence (pode estar em mais de uma). Vazio = sem bateria.
    pub baterias: Vec<i64>,
}