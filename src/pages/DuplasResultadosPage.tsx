import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Shuffle } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import DuplasResultadosTable, {
  type DuplaResultadoRow,
} from "../components/duplas-resultados/duplas-resultados-table";
import LiderProvaCard from "../components/duplas-resultados/lider-prova-card";
// import RegraBoisPanelEditavel from "../components/duplas-resultados/regra-bois-panel";
import { sortearInscricoes } from "../lib/sorteio";
import { calcularMenorMedia, calcularParaGanhar } from "../lib/para-ganhar";
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
    idCabeceiro: d.id_cabeceiro,
    idPezeiro: d.id_pezeiro,
    cabeceiroNome: d.cabeceiro_nome,
    hcCabeceiro: d.hc_cabeceiro,
    pezeiroIniciais: iniciaisDoNome(d.pezeiro_nome),
    pezeiroNome: d.pezeiro_nome,
    hcPez: d.hc_pezeiro,
    hcDupla: d.hc_soma ?? d.hc_cabeceiro + d.hc_pezeiro,
    bois: d.bois_nu,
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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [intervaloTexto, setIntervaloTexto] = useState("3");
  const [sorteandoInscricao, setSorteandoInscricao] = useState(false);

  useEffect(() => {
    carregarDuplas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProvaNum]);

  /** "Para Ganhar" recalculado ao vivo — muda sempre que a média de qualquer dupla muda */
  const duplasComParaGanhar = useMemo(() => {
    const menorMedia = calcularMenorMedia(duplas);
    return duplas.map((d) => ({
      ...d,
      paraGanhar: calcularParaGanhar(d.bois, d.parcial, menorMedia),
    }));
  }, [duplas]);

  /** Dupla líder da prova no momento — quem tem a menor média entre quem já tem resultado */
  const lider = useMemo(() => {
    const candidatas = duplas.filter((d) => d.media > 0);
    if (candidatas.length === 0) return null;
    return candidatas.reduce((melhor, atual) => (atual.media < melhor.media ? atual : melhor));
  }, [duplas]);

  async function carregarDuplas() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarDuplasPorProva(idProvaNum);
      const ordenados = [...dados].sort((a, b) => (a.inscricao ?? 0) - (b.inscricao ?? 0));
      setDuplas(ordenados.map((d, i) => paraLinhaDupla(d, i + 1)));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar as duplas.");
    } finally {
      setCarregando(false);
    }
  }

  /**
   * Sorteia uma nova ordem de inscrição pra todas as duplas já formadas, tentando
   * respeitar o intervalo mínimo entre corridas do mesmo cabeceiro/pezeiro.
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
      const novaOrdem = sortearInscricoes(
        duplas.map((d) => ({ id: d.id, idCabeceiro: d.idCabeceiro, idPezeiro: d.idPezeiro })),
        intervalo
      );

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
   * Chamado pela DuplasResultadosTable sempre que um tempo ou o Boi Final é editado.
   * Compara com o estado anterior pra persistir só as linhas que de fato mudaram.
   */
  function handleDuplasChange(atualizado: DuplaResultadoRow[]) {
    // A tabela só espalha (`{...dupla, ...}`) os objetos originais — o campo extra `id`
    // sobrevive em tempo de execução mesmo não fazendo parte do tipo DuplaResultadoRow.
    const comId = atualizado as DuplaComId[];
    const anterior = duplas;
    setDuplas(comId);

    comId.forEach((dupla, i) => {
      const original = anterior[i];
      if (!original) return;

      const mudou =
        original.boiFinal !== dupla.boiFinal ||
        original.parcial !== dupla.parcial ||
        original.media !== dupla.media ||
        original.tempos.some((t, idx) => t !== dupla.tempos[idx]);

      if (!mudou) return;

      // Recalcula o Para Ganhar com a média mais atual (incluindo a mudança que acabou de acontecer)
      const menorMediaAtual = calcularMenorMedia(comId);
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
    });
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Duplas e Resultados"
        subtitle="Todas as duplas registradas, de todos os cabeceiros"
        action={
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700">
            <Download size={16} />
            Exportar PDF
          </button>
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
                Reembaralha a ordem de inscrição de todas as duplas, respeitando o intervalo
                sempre que possível.
              </p>
            </div>

            <div className="flex flex-col gap-5 lg:flex-row">
              <DuplasResultadosTable duplas={duplasComParaGanhar} onDuplasChange={handleDuplasChange} />
              <LiderProvaCard lider={lider} />
              {/* <RegraBoisPanelEditavel /> */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}