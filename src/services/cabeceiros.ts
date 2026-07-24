import { invoke } from "@tauri-apps/api/core";

export interface CabeceiroDb {
  id: number;
  nome: string;
  hc: number;
  id_prova: number;
  baterias: number[];
}

export function criarCabeceiro(nome: string, hc: number, idProva: number): Promise<CabeceiroDb> {
  return invoke("criar_cabeceiro", { nome, hc, idProva });
}

export function listarCabeceirosPorProva(idProva: number): Promise<CabeceiroDb[]> {
  return invoke("listar_cabeceiros_por_prova", { idProva });
}

export function atualizarBateriasCabeceiro(id: number, baterias: number[]): Promise<void> {
  return invoke("atualizar_baterias_cabeceiro", { id, baterias });
}

export function deletarCabeceiro(id: number): Promise<void> {
  return invoke("deletar_cabeceiro", { id });
}