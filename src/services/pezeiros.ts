import { invoke } from "@tauri-apps/api/core";

export interface PezeiroDb {
  /** Id da participação nessa prova — é o que duplas/baterias referenciam */
  id: number;
  nome: string;
  hc: number;
  id_prova: number;
  /** Quem esse pezeiro é no banco global — nome/hc sempre vêm de lá */
  id_banco_pezeiro: number;
  baterias: number[];
}

/** "Cadastro rápido": cria no banco global E já registra na prova, num passo só */
export function criarPezeiro(nome: string, hc: number, idProva: number): Promise<PezeiroDb> {
  return invoke("criar_pezeiro", { nome, hc, idProva });
}

/** Registra na prova um pezeiro que já existe no banco global */
export function adicionarPezeiroAProva(
  idBancoPezeiro: number,
  idProva: number
): Promise<PezeiroDb> {
  return invoke("adicionar_pezeiro_a_prova", { idBancoPezeiro, idProva });
}

export function listarPezeirosPorProva(idProva: number): Promise<PezeiroDb[]> {
  return invoke("listar_pezeiros_por_prova", { idProva });
}

export function atualizarBateriasPezeiro(id: number, baterias: number[]): Promise<void> {
  return invoke("atualizar_baterias_pezeiro", { id, baterias });
}

/** Remove o pezeiro DESSA prova — a pessoa continua no banco global, disponível pra outras */
export function deletarPezeiro(id: number): Promise<void> {
  return invoke("deletar_pezeiro", { id });
}