import { invoke } from "@tauri-apps/api/core";

export interface ProvaDb {
  id: number;
  nome: string;
  data: string;
  bateria: boolean;
  bateria_nu: number | null;
}

export interface NovaProvaDb {
  nome: string;
  data: string;
  bateria: boolean;
  bateriaNu?: number | null;
}

/**
 * Cria uma prova no banco.
 * Nota: o Tauri converte automaticamente os nomes dos argumentos de camelCase (JS)
 * para snake_case (Rust) — por isso `bateriaNu` aqui vira `bateria_nu` no comando.
 */
export function criarProva(nova: NovaProvaDb): Promise<ProvaDb> {
  return invoke("criar_prova", {
    nome: nova.nome,
    data: nova.data,
    bateria: nova.bateria,
    bateriaNu: nova.bateriaNu ?? null,
  });
}

export function listarProvas(): Promise<ProvaDb[]> {
  return invoke("listar_provas");
}

export function deletarProva(id: number): Promise<void> {
  return invoke("deletar_prova", { id });
}