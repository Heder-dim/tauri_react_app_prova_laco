import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, FileSpreadsheet, Shuffle } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import DuplasResultadosTable, {
  type DuplaResultadoRow,
} from "../components/duplas-resultados/duplas-resultados-table";
import LiderProvaCard from "../components/duplas-resultados/lider-prova-card";
// import RegraBoisPanelEditavel from "../components/duplas-resultados/regra-bois-panel";
import { sortearInscricoes } from "../lib/sorteio";
import { calcularMenorMedia, calcularParaGanhar } from "../lib/para-ganhar";
import { exportarDuplasResultadosPdf } from "../lib/exportar-pdf";
import { exportarDuplasResultadosXlsx } from "../lib/exportar-xlsx";
import { type ProvaDb, buscarProva } from "../services/provas";
import {
  atualizarDupla,
  atualizarInscricao,
  boisParaTempos,
  listarDuplasPorProva,
  temposParaBois,
  type DuplaDetalhadaDb,
} from "../services/duplas";

/** Dupla com o id real do banco e os ids de cabeceiro/pezeiro — usado só nesta página */
interface DuplaComId extends DuplaResultadoRow {
  id: number;
  idCabeceiro: number;
  idPezeiro: number;
}

function iniciaisDoNome(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function paraLinhaDupla(d: DuplaDetalhadaDb, numero: number): DuplaComId {
  return {
    id: d.id,
    numero,
    inscricao: d.inscricao ?? 0,
    numeroBateria: d.numero_bateria,
    idCabeceiro: d.id_cabeceiro,
    idPezeiro: d.id_pezeiro,
    cabeceiroNome: d.cabeceiro_nome,
    hcCabeceiro: d.hc_cabeceiro,
    pezeiroIniciais: iniciaisDoNome(d.pezeiro_nome),
    pezeiroNome: d.pezeiro_nome,
    hcPez: d.hc_pezeiro,
    hcDupla: d.hc_soma ?? d.hc_cabeceiro + d.hc_pezeiro,
    bois: d.bois_nu,
    sorteada: d.sorteada,
    tempos: boisParaTempos(d),
    parcial: d.parcial ?? 0,
    boiFinal: d.boi_final ?? 0,
    media: d.media ?? 0,
    paraGanhar: d.para_ganhar ?? 0,
  };
}

export default function DuplasResultadosPage() {
  const { idProva } = useParams<{ idProva: string }>();
  const idProvaNum = Number(idProva);

  const [duplas, setDuplas] = useState<DuplaComId[]>([]);
  const [prova, setProva] = useState<ProvaDb | null>(null);
  const [filtroBateria, setFiltroBateria] = useState<number | null>(null); // null = todas as baterias
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [intervaloTexto, setIntervaloTexto] = useState("3");
  const [sorteandoInscricao, setSorteandoInscricao] = useState(false);

  useEffect(() => {
    carregarDuplas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProvaNum]);

  /** "Para Ganhar" recalculado ao vivo — muda sempre que a média de qualquer dupla muda.
   * Sempre calculado sobre TODAS as duplas da prova, mesmo com filtro de bateria ativo. */
  const duplasComParaGanhar = useMemo(() => {
    const menorMedia = calcularMenorMedia(duplas);
    return duplas.map((d) => ({
      ...d,
      paraGanhar: calcularParaGanhar(d.bois, d.parcial, menorMedia),
    }));
  }, [duplas]);

  /** O que a tabela realmente exibe — filtrado pela bateria selecionada, se houver */
  const duplasExibidas = useMemo(() => {
    if (filtroBateria === null) return duplasComParaGanhar;
    return duplasComParaGanhar.filter((d) => d.numeroBateria === filtroBateria);
  }, [duplasComParaGanhar, filtroBateria]);

  /** Dupla líder da prova no momento — quem tem a menor média entre quem já tem resultado.
   * Sempre considera a prova inteira, mesmo com filtro de bateria ativo. */
  const lider = useMemo(() => {
    const candidatas = duplas.filter((d) => d.media > 0);
    if (candidatas.length === 0) return null;
    return candidatas.reduce((melhor, atual) => (atual.media < melhor.media ? atual : melhor));
  }, [duplas]);

  async function carregarDuplas() {
    setCarregando(true);
    setErro(null);
    try {
      const [dados, prova] = await Promise.all([
        listarDuplasPorProva(idProvaNum),
        buscarProva(idProvaNum),
      ]);
      const ordenados = [...dados].sort((a, b) => (a.inscricao ?? 0) - (b.inscricao ?? 0));
      setDuplas(ordenados.map((d, i) => paraLinhaDupla(d, i + 1)));
      setProva(prova);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar as duplas.");
    } finally {
      setCarregando(false);
    }
  }

  /**
   * Sorteia uma nova ordem de inscrição pra todas as duplas já formadas, tentando
   * respeitar o intervalo mínimo entre corridas do mesmo cabeceiro/pezeiro.
   *
   * Quando a prova usa baterias, cada bateria vira um bloco contínuo de inscrições
   * (bateria 1 = 1..N1, bateria 2 = N1+1..N1+N2, ...) — o sorteio roda separadamente
   * dentro de cada bateria, e só depois os blocos são concatenados na ordem numérica.
   * Duplas sem bateria definida (numeroBateria null) formam um bloco à parte, por último.
   */
  async function handleSortearInscricao() {
    const intervalo = Number(intervaloTexto);
    if (!intervaloTexto.trim() || Number.isNaN(intervalo) || intervalo < 0) {
      setErro("Informe um intervalo válido.");
      return;
    }
    if (duplas.length === 0) return;

    setSorteandoInscricao(true);
    setErro(null);
    try {
      const usaBaterias = prova?.bateria === true;
      let novaOrdem = new Map<number, number>();

      if (usaBaterias) {
        const gruposPorBateria = new Map<number | null, DuplaComId[]>();
        for (const d of duplas) {
          const grupo = gruposPorBateria.get(d.numeroBateria) ?? [];
          grupo.push(d);
          gruposPorBateria.set(d.numeroBateria, grupo);
        }

        // Ordena as baterias numericamente; quem não tem bateria definida vai por último
        const chavesOrdenadas = [...gruposPorBateria.keys()].sort((a, b) => {
          if (a === null) return 1;
          if (b === null) return -1;
          return a - b;
        });

        let offset = 0;
        for (const chave of chavesOrdenadas) {
          const grupo = gruposPorBateria.get(chave)!;
          const ordemDoGrupo = sortearInscricoes(
            grupo.map((d) => ({ id: d.id, idCabeceiro: d.idCabeceiro, idPezeiro: d.idPezeiro })),
            intervalo
          );
          for (const [id, posicao] of ordemDoGrupo) {
            novaOrdem.set(id, posicao + offset);
          }
          offset += grupo.length;
        }
      } else {
        novaOrdem = sortearInscricoes(
          duplas.map((d) => ({ id: d.id, idCabeceiro: d.idCabeceiro, idPezeiro: d.idPezeiro })),
          intervalo
        );
      }

      // Persiste cada inscrição nova no banco
      await Promise.all(
        duplas.map((d) => {
          const novaInscricao = novaOrdem.get(d.id);
          if (novaInscricao === undefined) return Promise.resolve();
          return atualizarInscricao(d.id, novaInscricao);
        })
      );

      // Atualiza o estado local já reordenado pela nova inscrição, renumerando o #
      const atualizado = duplas
        .map((d) => ({ ...d, inscricao: novaOrdem.get(d.id) ?? d.inscricao }))
        .sort((a, b) => a.inscricao - b.inscricao)
        .map((d, i) => ({ ...d, numero: i + 1 }));

      setDuplas(atualizado);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível sortear a inscrição.");
    } finally {
      setSorteandoInscricao(false);
    }
  }

  /**
   * Move uma dupla para uma nova inscrição.
   * Se a inscrição já existir, as demais são deslocadas (+1).
   *
   * Exemplo:
   * 1 -> 200
   * 200 vira 201, 201 vira 202, etc.
   */
  async function handleInscricaoChange(duplaIndex: number, novaInscricao: number) {
    // `duplaIndex` vem da tabela, que pode estar mostrando só um subconjunto filtrado por
    // bateria — por isso busca em `duplasExibidas` (o que a tabela realmente tem), não em `duplas`.
    const duplaMovida = duplasExibidas[duplaIndex];
    if (!duplaMovida) return;

    const inscricaoAntiga = duplaMovida.inscricao;
    if (inscricaoAntiga === novaInscricao) return;

    // Clona a lista atual
    let atualizadas = [...duplas];

    if (novaInscricao > inscricaoAntiga) {
      // Move para frente: 1 -> 200
      // Desloca [200..fim] +1
      atualizadas = atualizadas.map((d) => {
        if (d.id === duplaMovida.id) return d;

        if (d.inscricao >= novaInscricao) {
          return { ...d, inscricao: d.inscricao + 1 };
        }

        return d;
      });
    } else {
      // Move para trás: 200 -> 1
      // Desloca [1..199] +1 pra abrir espaço na posição 1 (e liberar a antiga posição 200)
      atualizadas = atualizadas.map((d) => {
        if (d.id === duplaMovida.id) return d;

        if (d.inscricao >= novaInscricao && d.inscricao < inscricaoAntiga) {
          return { ...d, inscricao: d.inscricao + 1 };
        }

        return d;
      });
    }

    // Aplica a nova inscrição na dupla movida
    atualizadas = atualizadas.map((d) =>
      d.id === duplaMovida.id ? { ...d, inscricao: novaInscricao } : d
    );

    // Reordena e renumera
    atualizadas = atualizadas
      .sort((a, b) => a.inscricao - b.inscricao)
      .map((d, i) => ({ ...d, numero: i + 1 }));

    // Atualiza UI imediatamente
    setDuplas(atualizadas);

    try {
      /**
       * Evita conflito de UNIQUE:
       * primeiro move tudo para um intervalo temporário alto,
       * depois grava os valores finais.
       */
      await Promise.all(
        atualizadas.map((d) => atualizarInscricao(d.id, d.inscricao + 10000))
      );

      await Promise.all(
        atualizadas.map((d) => atualizarInscricao(d.id, d.inscricao))
      );
    } catch (e) {
      setErro(
        typeof e === "string"
          ? e
          : "Não foi possível atualizar as inscrições."
      );

      // Recarrega do banco em caso de erro
      await carregarDuplas();
    }
  }

  /**
   * Chamado pela DuplasResultadosTable sempre que um tempo ou o Boi Final é editado.
   * Casa por `id` (não por posição) porque a tabela pode estar recebendo só um
   * subconjunto filtrado por bateria — a posição na tabela não corresponde à posição
   * no estado completo da página.
   */
  function handleDuplasChange(atualizado: DuplaResultadoRow[]) {
    const comId = atualizado as DuplaComId[];

    setDuplas((prev) => {
      const porId = new Map(comId.map((d) => [d.id, d]));

      const novoEstado = prev.map((dupla) => {
        const novo = porId.get(dupla.id);
        if (!novo) return dupla;
        return {
          ...dupla,
          tempos: novo.tempos,
          boiFinal: novo.boiFinal,
          parcial: novo.parcial,
          media: novo.media,
        };
      });

      for (const dupla of novoEstado) {
        const original = prev.find((d) => d.id === dupla.id);
        if (!original) continue;

        const mudou =
          original.boiFinal !== dupla.boiFinal ||
          original.parcial !== dupla.parcial ||
          original.media !== dupla.media ||
          original.tempos.some((t, idx) => t !== dupla.tempos[idx]);

        if (!mudou) continue;

        // Recalcula o Para Ganhar com a média mais atual (incluindo a mudança que acabou de acontecer)
        const menorMediaAtual = calcularMenorMedia(novoEstado);
        const paraGanharAtualizado = calcularParaGanhar(dupla.bois, dupla.parcial, menorMediaAtual);

        const { boi1, boi2, boi3, boi4, boi5, boi6 } = temposParaBois(dupla.tempos);
        atualizarDupla({
          id: dupla.id,
          boi1,
          boi2,
          boi3,
          boi4,
          boi5,
          boi6,
          parcial: dupla.parcial,
          boiFinal: dupla.boiFinal,
          media: dupla.media,
          paraGanhar: paraGanharAtualizado,
        }).catch((e) => {
          setErro(typeof e === "string" ? e : "Não foi possível salvar a alteração.");
        });
      }

      return novoEstado;
    });
  }

  async function handleExportarPdf() {
    try {
      await exportarDuplasResultadosPdf(duplasExibidas, prova?.nome);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível exportar o PDF.");
    }
  }

  async function handleExportarXlsx() {
    try {
      await exportarDuplasResultadosXlsx(duplasExibidas, prova?.nome);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível exportar o XLSX.");
    }
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Duplas e Resultados"
        subtitle="Todas as duplas registradas, de todos os cabeceiros"
        action={
          <div className="flex gap-2.5">
            <button
              onClick={handleExportarXlsx}
              className="flex items-center gap-2 rounded-xl border border-blue-500 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              <FileSpreadsheet size={16} />
              Exportar XLSX
            </button>
            <button
              onClick={handleExportarPdf}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700"
            >
              <Download size={16} />
              Exportar PDF
            </button>
          </div>
        }
      />

      <div className="space-y-5 p-6 lg:p-10">
        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando duplas...</p>
          </div>
        ) : duplas.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Nenhuma dupla formada nessa prova ainda.</p>
          </div>
        ) : (
          <>
            {prova?.bateria && prova.bateria_nu && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Bateria
                </span>
                <button
                  type="button"
                  onClick={() => setFiltroBateria(null)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    filtroBateria === null
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-500 shadow-sm hover:bg-slate-50"
                  }`}
                >
                  Todas
                </button>
                {Array.from({ length: prova.bateria_nu }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFiltroBateria(n)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                      filtroBateria === n
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-500 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <div>
                <label htmlFor="intervalo" className="mb-1.5 block text-xs text-slate-500">
                  Intervalo mínimo entre corridas
                </label>
                <input
                  id="intervalo"
                  type="text"
                  inputMode="numeric"
                  value={intervaloTexto}
                  onChange={(e) => setIntervaloTexto(e.target.value)}
                  placeholder="Ex: 3"
                  className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={handleSortearInscricao}
                disabled={sorteandoInscricao || !intervaloTexto.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                <Shuffle size={16} />
                {sorteandoInscricao ? "Sorteando..." : "Sortear Inscrição"}
              </button>
              <p className="text-xs text-slate-400">
                {prova?.bateria
                  ? "Reembaralha a ordem de inscrição de cada bateria separadamente (cada uma vira um bloco contínuo), respeitando o intervalo sempre que possível."
                  : "Reembaralha a ordem de inscrição de todas as duplas, respeitando o intervalo sempre que possível."}
              </p>
            </div>

            <div className="flex flex-col gap-5 lg:flex-row">
              <DuplasResultadosTable
                duplas={duplasExibidas}
                onDuplasChange={handleDuplasChange}
                onInscricaoChange={handleInscricaoChange}
              />
              <LiderProvaCard lider={lider} />
              {/* <RegraBoisPanelEditavel /> */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}