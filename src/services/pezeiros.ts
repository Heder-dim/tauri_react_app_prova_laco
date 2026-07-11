import { invoke } from "@tauri-apps/api/core";

export interface PezeiroDb {
  id: number;
  nome: string;
  hc: number;
  id_prova: number;
}

export function criarPezeiro(nome: string, hc: number, idProva: number): Promise<PezeiroDb> {
  return invoke("criar_pezeiro", { nome, hc, idProva });
}

export function listarPezeirosPorProva(idProva: number): Promise<PezeiroDb[]> {
  return invoke("listar_pezeiros_por_prova", { idProva });
}

export function deletarPezeiro(id: number): Promise<void> {
  return invoke("deletar_pezeiro", { id });
}
