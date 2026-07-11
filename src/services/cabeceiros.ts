import { invoke } from "@tauri-apps/api/core";

export interface CabeceiroDb {
  id: number;
  nome: string;
  hc: number;
  id_prova: number;
}

export function criarCabeceiro(nome: string, hc: number, idProva: number): Promise<CabeceiroDb> {
  return invoke("criar_cabeceiro", { nome, hc, idProva });
}

export function listarCabeceirosPorProva(idProva: number): Promise<CabeceiroDb[]> {
  return invoke("listar_cabeceiros_por_prova", { idProva });
}

export function deletarCabeceiro(id: number): Promise<void> {
  return invoke("deletar_cabeceiro", { id });
}
