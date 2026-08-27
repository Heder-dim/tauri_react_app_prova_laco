import * as XLSX from "xlsx";
import type { DuplaResultadoRow } from "../components/duplas-resultados/duplas-resultados-table";
import { salvarArquivo } from "./salvar-arquivo";
import { MEDIA_INCOMPLETA } from "./para-ganhar";

/**
 * Gera a planilha de "Duplas e Resultados" (aba com os 3 melhores resultados + aba
 * com a tabela completa) e abre o diálogo nativo pra salvar no disco. Os valores vão
 * como números de verdade, não texto formatado, pra dar pra ordenar/filtrar/somar
 * direto no Excel. Retorna `false` se o usuário cancelar o diálogo.
 */
export async function exportarDuplasResultadosXlsx(
  duplas: DuplaResultadoRow[],
  nomeProva?: string
): Promise<boolean> {
  const wb = XLSX.utils.book_new();

  // ---- Aba: Melhores Resultados ----
  const comResultado = duplas
    .filter((d) => !d.eliminada && d.media !== MEDIA_INCOMPLETA)
    .sort((a, b) => a.media - b.media);
  const top3 = comResultado.slice(0, 3);
  const posicoes = ["1º", "2º", "3º"];

  const linhasTop3 = [
    ["Posição", "Cabeceiro", "Pezeiro", "Média"],
    ...top3.map((d, i) => [posicoes[i], d.cabeceiroNome, d.pezeiroNome, d.media]),
  ];
  const abaTop3 = XLSX.utils.aoa_to_sheet(linhasTop3);
  abaTop3["!cols"] = [{ wch: 10 }, { wch: 22 }, { wch: 22 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, abaTop3, "Melhores Resultados");

  // ---- Aba: Todas as Duplas ----
  const cabecalho = [
    "#",
    "Bateria",
    "Inscrição",
    "Cabeceiro",
    "HC Cabeceiro",
    "Pezeiro",
    "HC Pezeiro",
    "HC Dupla",
    "Bois",
    "1º Boi",
    "2º Boi",
    "3º Boi",
    "4º Boi",
    "5º Boi",
    "6º Boi",
    "Parcial",
    "Boi Final",
    "Média",
    "Para Ganhar",
    "Status",
  ];

  const linhas = duplas.map((d) => [
    d.numero,
    d.numeroBateria,
    d.inscricao,
    d.cabeceiroNome,
    d.hcCabeceiro,
    d.pezeiroNome,
    d.hcPez,
    d.hcDupla,
    d.bois,
    ...Array.from({ length: 6 }, (_, i) => d.tempos[i] ?? null),
    d.parcial,
    d.boiFinal,
    d.media,
    d.paraGanhar,
    d.eliminada ? "Eliminada" : "",
  ]);

  const abaDuplas = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);

  // Larguras de coluna, pra não ficar tudo espremido
  abaDuplas["!cols"] = [
    { wch: 5 },
    { wch: 8 },
    { wch: 9 },
    { wch: 20 },
    { wch: 11 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 6 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 11 },
  ];

  XLSX.utils.book_append_sheet(wb, abaDuplas, "Duplas e Resultados");

  const nomeArquivo = nomeProva
    ? `duplas-e-resultados-${nomeProva.toLowerCase().replace(/\s+/g, "-")}.xlsx`
    : "duplas-e-resultados.xlsx";

  const bytes = new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }));

  return salvarArquivo(bytes, { nomeArquivo, extensao: "xlsx", nomeFiltro: "Excel" });
}