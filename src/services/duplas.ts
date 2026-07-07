import { invoke } from "@tauri-apps/api/core";

export interface DuplaDb {
  id: number;
  id_cabeceiro: number;
  id_pezeiro: number;
  numero_bateria: number | null;
  hc_soma: number | null;
  bois_nu: number;
  boi_1: number | null;
  boi_2: number | null;
  boi_3: number | null;
  boi_4: number | null;
  boi_5: number | null;
  boi_6: number | null;
  parcial: number | null;
  boi_final: number | null;
  media: number | null;
  para_ganhar: number | null;
  ganhador: boolean;
}

/** Mesma coisa que DuplaDb, mas já com nome/HC do cabeceiro e do pezeiro (vem de JOIN no backend) */
export interface DuplaDetalhadaDb extends DuplaDb {
  cabeceiro_nome: string;
  hc_cabeceiro: number;
  pezeiro_nome: string;
  hc_pezeiro: number;
}

export interface NovaDuplaDb {
  idCabeceiro: number;
  idPezeiro: number;
  numeroBateria?: number | null;
  hcSoma: number;
  boisNu: number;
}

export function criarDupla(nova: NovaDuplaDb): Promise<DuplaDb> {
  return invoke("criar_dupla", {
    idCabeceiro: nova.idCabeceiro,
    idPezeiro: nova.idPezeiro,
    numeroBateria: nova.numeroBateria ?? null,
    hcSoma: nova.hcSoma,
    boisNu: nova.boisNu,
  });
}

export function listarDuplasPorCabeceiro(idCabeceiro: number): Promise<DuplaDetalhadaDb[]> {
  return invoke("listar_duplas_por_cabeceiro", { idCabeceiro });
}

export function listarDuplasPorProva(idProva: number): Promise<DuplaDetalhadaDb[]> {
  return invoke("listar_duplas_por_prova", { idProva });
}

export interface AtualizarDuplaDb {
  id: number;
  boi1: number | null;
  boi2: number | null;
  boi3: number | null;
  boi4: number | null;
  boi5: number | null;
  boi6: number | null;
  parcial: number | null;
  boiFinal: number | null;
  media: number | null;
  paraGanhar: number | null;
}

export function atualizarDupla(dados: AtualizarDuplaDb): Promise<void> {
  return invoke("atualizar_dupla", {
    id: dados.id,
    boi1: dados.boi1,
    boi2: dados.boi2,
    boi3: dados.boi3,
    boi4: dados.boi4,
    boi5: dados.boi5,
    boi6: dados.boi6,
    parcial: dados.parcial,
    boiFinal: dados.boiFinal,
    media: dados.media,
    paraGanhar: dados.paraGanhar,
  });
}

export function deletarDupla(id: number): Promise<void> {
  return invoke("deletar_dupla", { id });
}

// ---- Conversão entre o formato do banco (boi_1..boi_5) e o array `tempos` usado nas tabelas ----

export function boisParaTempos(dupla: DuplaDb): (number | null)[] {
  return [dupla.boi_1, dupla.boi_2, dupla.boi_3, dupla.boi_4, dupla.boi_5, dupla.boi_6];
}

export function temposParaBois(tempos: (number | null)[]) {
  return {
    boi1: tempos[0] ?? null,
    boi2: tempos[1] ?? null,
    boi3: tempos[2] ?? null,
    boi4: tempos[3] ?? null,
    boi5: tempos[4] ?? null,
    boi6: tempos[5] ?? null,
  };
}