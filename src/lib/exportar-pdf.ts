import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DuplaResultadoRow } from "../components/duplas-resultados/duplas-resultados-table";
import { salvarArquivo } from "./salvar-arquivo";

function formatTempo(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return "–";
  return valor.toFixed(3).replace(".", ",");
}

function formatHc(valor: number) {
  return valor.toFixed(1).replace(".", ",");
}

/**
 * Gera o PDF de "Duplas e Resultados" (resumo com os 3 melhores resultados + tabela
 * completa, igual à exibida na tela) e abre o diálogo nativo pra salvar no disco.
 * Retorna `false` se o usuário cancelar o diálogo.
 */
export async function exportarDuplasResultadosPdf(
  duplas: DuplaResultadoRow[],
  nomeProva?: string
): Promise<boolean> {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const dataGeracao = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("Duplas e Resultados", 40, 40);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `${nomeProva ? nomeProva + " · " : ""}Gerado em ${dataGeracao}`,
    40,
    58
  );

  let y = 80;

  // ---- Top 3 melhores resultados (menor média, entre quem já tem resultado) ----
  const comResultado = duplas.filter((d) => d.media > 0).sort((a, b) => a.media - b.media);
  const top3 = comResultado.slice(0, 3);

  if (top3.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Melhores Resultados", 40, y);
    y += 14;

    const posicoes = ["1º", "2º", "3º"];

    autoTable(doc, {
      startY: y,
      head: [["Posição", "Cabeceiro", "Pezeiro", "Média"]],
      body: top3.map((d, i) => [posicoes[i], d.cabeceiroNome, d.pezeiroNome, formatTempo(d.media)]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 40, right: 40 },
      tableWidth: 400,
    });

    // @ts-expect-error — lastAutoTable é injetado pelo plugin em tempo de execução, sem tipos
    y = doc.lastAutoTable.finalY + 24;
  }

  // ---- Tabela completa, igual à exibida na tela ----
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Todas as Duplas", 40, y);

  const cabecalho = [
    "#",
    "Bateria",
    "Insc.",
    "Cabeceiro",
    "HC Cab.",
    "Pezeiro",
    "HC Pez.",
    "HC Dupla",
    "Bois",
    "1º",
    "2º",
    "3º",
    "4º",
    "5º",
    "6º",
    "Parcial",
    "Boi Final",
    "Média",
    "Para Ganhar",
  ];

  const corpo = duplas.map((d) => [
    String(d.numero).padStart(2, "0"),
    d.numeroBateria !== null ? String(d.numeroBateria) : "–",
    String(d.inscricao),
    d.cabeceiroNome,
    formatHc(d.hcCabeceiro),
    d.pezeiroNome,
    formatHc(d.hcPez),
    formatHc(d.hcDupla),
    String(d.bois),
    ...Array.from({ length: 6 }, (_, i) => formatTempo(d.tempos[i])),
    formatTempo(d.parcial),
    formatTempo(d.boiFinal),
    formatTempo(d.media),
    formatTempo(d.paraGanhar),
  ]);

  autoTable(doc, {
    startY: y + 6,
    head: [cabecalho],
    body: corpo,
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 20, right: 20 },
  });

  const nomeArquivo = nomeProva
    ? `duplas-e-resultados-${nomeProva.toLowerCase().replace(/\s+/g, "-")}.pdf`
    : "duplas-e-resultados.pdf";

  const bytes = new Uint8Array(doc.output("arraybuffer"));

  return salvarArquivo(bytes, { nomeArquivo, extensao: "pdf", nomeFiltro: "PDF" });
}