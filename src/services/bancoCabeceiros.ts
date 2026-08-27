import { invoke } from "@tauri-apps/api/core";

export interface BancoCabeceiroDb {
  id: number;
  nome: string;
  hc: number;
}

export function listarBancoCabeceiros(): Promise<BancoCabeceiroDb[]> {
  return invoke("listar_banco_cabeceiros");
}

export function criarBancoCabeceiro(nome: string, hc: number): Promise<BancoCabeceiroDb> {
  return invoke("criar_banco_cabeceiro", { nome, hc });
}

export function atualizarBancoCabeceiro(id: number, nome: string, hc: number): Promise<void> {
  return invoke("atualizar_banco_cabeceiro", { id, nome, hc });
}

export function deletarBancoCabeceiro(id: number): Promise<void> {
  return invoke("deletar_banco_cabeceiro", { id });
}
