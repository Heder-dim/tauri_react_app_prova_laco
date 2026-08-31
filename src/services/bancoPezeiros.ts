import { invoke } from "@tauri-apps/api/core";

export interface BancoPezeiroDb {
  id: number;
  nome: string;
  hc: number;
}

export function listarBancoPezeiros(): Promise<BancoPezeiroDb[]> {
  return invoke("listar_banco_pezeiros");
}

export function criarBancoPezeiro(nome: string, hc: number): Promise<BancoPezeiroDb> {
  return invoke("criar_banco_pezeiro", { nome, hc });
}

export function atualizarBancoPezeiro(id: number, nome: string, hc: number): Promise<void> {
  return invoke("atualizar_banco_pezeiro", { id, nome, hc });
}

export function deletarBancoPezeiro(id: number): Promise<void> {
  return invoke("deletar_banco_pezeiro", { id });
}
