import { invoke } from "@tauri-apps/api/core";

export interface CabeceiroDb {
  /** Id da participação nessa prova — é o que duplas/baterias referenciam */
  id: number;
  nome: string;
  hc: number;
  id_prova: number;
  /** Quem esse cabeceiro é no banco global — nome/hc sempre vêm de lá */
  id_banco_cabeceiro: number;
  baterias: number[];
}

/** "Cadastro rápido": cria no banco global E já registra na prova, num passo só */
export function criarCabeceiro(nome: string, hc: number, idProva: number): Promise<CabeceiroDb> {
  return invoke("criar_cabeceiro", { nome, hc, idProva });
}

/** Registra na prova um cabeceiro que já existe no banco global */
export function adicionarCabeceiroAProva(
  idBancoCabeceiro: number,
  idProva: number
): Promise<CabeceiroDb> {
  return invoke("adicionar_cabeceiro_a_prova", { idBancoCabeceiro, idProva });
}

export function listarCabeceirosPorProva(idProva: number): Promise<CabeceiroDb[]> {
  return invoke("listar_cabeceiros_por_prova", { idProva });
}

export function atualizarBateriasCabeceiro(id: number, baterias: number[]): Promise<void> {
  return invoke("atualizar_baterias_cabeceiro", { id, baterias });
}

/** Remove o cabeceiro DESSA prova — a pessoa continua no banco global, disponível pra outras */
export function deletarCabeceiro(id: number): Promise<void> {
  return invoke("deletar_cabeceiro", { id });
}