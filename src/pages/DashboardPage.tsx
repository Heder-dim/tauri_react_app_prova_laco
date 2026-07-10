import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Dices, UserPlus, BarChart3 } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import StepBadge from "../components/ui/step-badge";
import StatBox from "../components/ui/stat-box";
import DuplasTable, { type DuplaRow } from "../components/dashboard/duplas-table";
import CabeceiroSelect from "../components/dashboard/cabeceiro-select";
import PezeiroSelect, { type PezeiroOption } from "../components/dashboard/pezeiro-select";
// import RegraBoisPanel from "../components/dashboard/regra-bois-panel";
import { calcularBoisNu } from "../lib/regras-bois";
import { sortearBalanceado } from "../lib/sorteio";
import { type ProvaDb, buscarProva } from "../services/provas";
import { type CabeceiroDb, listarCabeceirosPorProva } from "../services/cabeceiros";
import { type PezeiroDb, listarPezeirosPorProva } from "../services/pezeiros";
import {
  criarDupla,
  atualizarDupla,
  listarDuplasPorCabeceiro,
  listarDuplasPorProva,
  type DuplaDetalhadaDb,
  boisParaTempos,
  temposParaBois,
} from "../services/duplas";

/** Dupla com o id real do banco + id do pezeiro — usado só nesta página pra persistir edições */
interface DuplaComId extends DuplaRow {
  id: number;
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
    idPezeiro: d.id_pezeiro,
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

export default function DashboardPage() {
  const { idProva } = useParams<{ idProva: string }>();
  const idProvaNum = Number(idProva);

  const [prova, setProva] = useState<ProvaDb | null>(null);
  const [cabeceiros, setCabeceiros] = useState<CabeceiroDb[]>([]);
  const [pezeiros, setPezeiros] = useState<PezeiroDb[]>([]);
  const [carregandoBase, setCarregandoBase] = useState(true);

  const [cabeceiroSelecionadoId, setCabeceiroSelecionadoId] = useState<number | null>(null);
  const [pezeiroSelecionadoId, setPezeiroSelecionadoId] = useState<number | null>(null);
  const [boisNuTexto, setBoisNuTexto] = useState("");
  const [quantidadeSorteio, setQuantidadeSorteio] = useState("");
  const [sorteando, setSorteando] = useState(false);

  const [duplas, setDuplas] = useState<DuplaComId[]>([]);
  const [carregandoDuplas, setCarregandoDuplas] = useState(false);

  // Estado "da prova inteira" (não só do cabeceiro selecionado) — usado pro sorteio balanceado
  // e pra saber a próxima inscrição livre, sem precisar rebuscar do banco a cada sorteio.
  const [corridasPorPezeiro, setCorridasPorPezeiro] = useState<Record<number, number>>({});
  const [proximaInscricaoDisponivel, setProximaInscricaoDisponivel] = useState(1);

  const [erro, setErro] = useState<string | null>(null);

  // Carrega a prova, cabeceiros, pezeiros e um retrato das duplas da prova inteira ao montar
  useEffect(() => {
    async function carregarBase() {
      setCarregandoBase(true);
      setErro(null);
      try {
        const [provaDb, cabeceirosDb, pezeirosDb, duplasDaProva] = await Promise.all([
          buscarProva(idProvaNum),
          listarCabeceirosPorProva(idProvaNum),
          listarPezeirosPorProva(idProvaNum),
          listarDuplasPorProva(idProvaNum),
        ]);
        setProva(provaDb);
        setCabeceiros(cabeceirosDb);
        setPezeiros(pezeirosDb);
        setCabeceiroSelecionadoId(cabeceirosDb[0]?.id ?? null);

        const contagem: Record<number, number> = {};
        let maiorInscricao = 0;
        for (const d of duplasDaProva) {
          contagem[d.id_pezeiro] = (contagem[d.id_pezeiro] ?? 0) + 1;
          maiorInscricao = Math.max(maiorInscricao, d.inscricao ?? 0);
        }
        setCorridasPorPezeiro(contagem);
        setProximaInscricaoDisponivel(maiorInscricao + 1);
      } catch (e) {
        setErro(typeof e === "string" ? e : "Não foi possível carregar os dados da prova.");
      } finally {
        setCarregandoBase(false);
      }
    }
    carregarBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProvaNum]);

  // Carrega as duplas sempre que o cabeceiro selecionado mudar
  useEffect(() => {
    if (cabeceiroSelecionadoId === null) {
      setDuplas([]);
      return;
    }

    async function carregarDuplas() {
      setCarregandoDuplas(true);
      setErro(null);
      try {
        const dados = await listarDuplasPorCabeceiro(cabeceiroSelecionadoId!);
        setDuplas(dados.map((d, i) => paraLinhaDupla(d, i + 1)));
      } catch (e) {
        setErro(typeof e === "string" ? e : "Não foi possível carregar as duplas.");
      } finally {
        setCarregandoDuplas(false);
      }
    }
    carregarDuplas();
  }, [cabeceiroSelecionadoId]);

  const cabeceiroSelecionado = useMemo(
    () => cabeceiros.find((c) => c.id === cabeceiroSelecionadoId) ?? null,
    [cabeceiros, cabeceiroSelecionadoId]
  );

  const categoriaAberta = prova?.categoria === "Aberta";

  const pezeirosDisponiveis: PezeiroOption[] = useMemo(() => {
    return pezeiros
      .filter((p) => !duplas.some((d) => d.idPezeiro === p.id))
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        hc: p.hc,
        iniciais: iniciaisDoNome(p.nome),
        corridas: corridasPorPezeiro[p.id] ?? 0,
      }));
  }, [pezeiros, duplas, corridasPorPezeiro]);

  // Sugere a quantidade de bois (pela regra) sempre que a dupla escolhida mudar.
  // Quando a categoria é "Aberta", o usuário ainda pode sobrescrever esse valor antes de formar a dupla.
  useEffect(() => {
    if (!cabeceiroSelecionado || pezeiroSelecionadoId === null) {
      setBoisNuTexto("");
      return;
    }
    const pezeiro = pezeiros.find((p) => p.id === pezeiroSelecionadoId);
    if (!pezeiro) return;

    const hcSoma = cabeceiroSelecionado.hc + pezeiro.hc;
    setBoisNuTexto(String(calcularBoisNu(hcSoma)));
  }, [cabeceiroSelecionado, pezeiroSelecionadoId, pezeiros]);

  function handleSelecionarCabeceiro(id: number) {
    setCabeceiroSelecionadoId(id);
    setPezeiroSelecionadoId(null); // troca de cabeceiro invalida o pezeiro selecionado
  }

  async function handleFormarDupla() {
    if (!cabeceiroSelecionado || pezeiroSelecionadoId === null) return;

    const pezeiro = pezeiros.find((p) => p.id === pezeiroSelecionadoId);
    if (!pezeiro) return;

    const hcSoma = cabeceiroSelecionado.hc + pezeiro.hc;
    let boisNu = calcularBoisNu(hcSoma);

    if (categoriaAberta) {
      const boisNuDigitado = Number(boisNuTexto);
      if (!boisNuTexto.trim() || Number.isNaN(boisNuDigitado) || boisNuDigitado < 1 || boisNuDigitado > 6) {
        setErro("Informe uma quantidade de bois válida (1 a 6).");
        return;
      }
      boisNu = boisNuDigitado;
    }

    try {
      const nova = await criarDupla({
        idCabeceiro: cabeceiroSelecionado.id,
        idPezeiro: pezeiro.id,
        inscricao: proximaInscricaoDisponivel,
        hcSoma,
        boisNu,
      });

      const novaLinha: DuplaComId = {
        id: nova.id,
        numero: duplas.length + 1,
        inscricao: nova.inscricao ?? proximaInscricaoDisponivel,
        idPezeiro: pezeiro.id,
        pezeiroIniciais: iniciaisDoNome(pezeiro.nome),
        pezeiroNome: pezeiro.nome,
        hcPez: pezeiro.hc,
        hcDupla: nova.hc_soma ?? cabeceiroSelecionado.hc + pezeiro.hc,
        bois: nova.bois_nu,
        tempos: boisParaTempos(nova),
        parcial: nova.parcial ?? 0,
        boiFinal: nova.boi_final ?? 0,
        media: nova.media ?? 0,
        paraGanhar: nova.para_ganhar ?? 0,
      };

      setDuplas((prev) => [...prev, novaLinha]);
      setCorridasPorPezeiro((prev) => ({
        ...prev,
        [pezeiro.id]: (prev[pezeiro.id] ?? 0) + 1,
      }));
      setProximaInscricaoDisponivel((prev) => prev + 1);
      setPezeiroSelecionadoId(null);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível formar a dupla.");
    }
  }

  /**
   * Sorteia `quantidade` pezeiros (ainda não pareados com o cabeceiro selecionado),
   * priorizando quem já correu menos na prova inteira — evita que um pezeiro acumule
   * muito mais duplas que os outros. A inscrição só incrementa a partir da última usada.
   */
  async function handleSortearDuplas() {
    if (!cabeceiroSelecionado) return;

    const quantidade = Number(quantidadeSorteio);
    if (!quantidadeSorteio.trim() || Number.isNaN(quantidade) || quantidade < 1) {
      setErro("Informe uma quantidade válida para o sorteio.");
      return;
    }

    const sorteados = sortearBalanceado(
      pezeirosDisponiveis,
      quantidade,
      (p) => p.corridas ?? 0
    );
    if (sorteados.length === 0) {
      setErro("Não há pezeiros disponíveis para sortear.");
      return;
    }

    setSorteando(true);
    setErro(null);
    try {
      let proximaInscricao = proximaInscricaoDisponivel;
      const novasLinhas: DuplaComId[] = [];
      const novasCorridas: Record<number, number> = {};

      for (const pezeiro of sorteados) {
        const hcSoma = cabeceiroSelecionado.hc + pezeiro.hc;
        const boisNu = calcularBoisNu(hcSoma);

        const nova = await criarDupla({
          idCabeceiro: cabeceiroSelecionado.id,
          idPezeiro: pezeiro.id,
          inscricao: proximaInscricao,
          hcSoma,
          boisNu,
        });

        novasLinhas.push({
          id: nova.id,
          numero: duplas.length + novasLinhas.length + 1,
          inscricao: nova.inscricao ?? proximaInscricao,
          idPezeiro: pezeiro.id,
          pezeiroIniciais: pezeiro.iniciais,
          pezeiroNome: pezeiro.nome,
          hcPez: pezeiro.hc,
          hcDupla: nova.hc_soma ?? hcSoma,
          bois: nova.bois_nu,
          tempos: boisParaTempos(nova),
          parcial: nova.parcial ?? 0,
          boiFinal: nova.boi_final ?? 0,
          media: nova.media ?? 0,
          paraGanhar: nova.para_ganhar ?? 0,
        });

        novasCorridas[pezeiro.id] = (novasCorridas[pezeiro.id] ?? 0) + 1;
        proximaInscricao += 1;
      }

      setDuplas((prev) => [...prev, ...novasLinhas]);
      setCorridasPorPezeiro((prev) => {
        const atualizado = { ...prev };
        for (const [id, incremento] of Object.entries(novasCorridas)) {
          atualizado[Number(id)] = (atualizado[Number(id)] ?? 0) + incremento;
        }
        return atualizado;
      });
      setProximaInscricaoDisponivel(proximaInscricao);
      setQuantidadeSorteio("");
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível sortear as duplas.");
    } finally {
      setSorteando(false);
    }
  }

  /**
   * Chamado pela DuplasTable sempre que um tempo ou o Boi Final é editado.
   * Compara com o estado anterior pra persistir só as linhas que de fato mudaram.
   */
  function handleDuplasChange(atualizado: DuplaRow[]) {
    // A DuplasTable só espalha (`{...dupla, ...}`) os objetos originais — os campos extras
    // (id, idPezeiro) sobrevivem em tempo de execução mesmo não fazendo parte do tipo DuplaRow.
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
        paraGanhar: dupla.paraGanhar,
      }).catch((e) => {
        setErro(typeof e === "string" ? e : "Não foi possível salvar a alteração.");
      });
    });
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Dashboard"
        subtitle="Selecione um cabeceiro para montar as duplas com todos os pezeiros"
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

        {carregandoBase ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando cabeceiros e pezeiros...</p>
          </div>
        ) : cabeceiros.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">
              Nenhum cabeceiro cadastrado nessa prova ainda. Cadastre um em "Cabeceiros" pra
              começar.
            </p>
          </div>
        ) : (
          <>
            {/* Linha 1 — Seleção de cabeceiro / dupla / resumo */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Card 1 — Selecionar Cabeceiro */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5">
                  <StepBadge>1</StepBadge>
                  <h2 className="font-bold text-slate-900">Selecionar Cabeceiro</h2>
                </div>

                <p className="mb-2 text-xs text-slate-500">Cabeceiro ativo</p>
                <CabeceiroSelect
                  cabeceiros={cabeceiros}
                  selecionadoId={cabeceiroSelecionadoId}
                  onSelect={handleSelecionarCabeceiro}
                />
              </div>

              {/* Card 2 — Escolher Dupla */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5">
                  <StepBadge>2</StepBadge>
                  <h2 className="font-bold text-slate-900">Escolher Dupla</h2>
                </div>

                <p className="mb-2 text-xs text-slate-500">
                  Selecione manualmente ou sorteie
                </p>
                <PezeiroSelect
                  pezeiros={pezeirosDisponiveis}
                  selecionadoId={pezeiroSelecionadoId}
                  onSelect={setPezeiroSelecionadoId}
                />

                <div className="mt-2.5">
                  <label htmlFor="bois-nu" className="mb-1.5 block text-xs text-slate-500">
                    Qtd. de Bois{" "}
                    {!categoriaAberta && (
                      <span className="text-slate-400">(definida pela regra de HC)</span>
                    )}
                  </label>
                  <input
                    id="bois-nu"
                    type="text"
                    inputMode="numeric"
                    value={boisNuTexto}
                    onChange={(e) => setBoisNuTexto(e.target.value)}
                    disabled={!categoriaAberta}
                    placeholder="—"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:text-slate-400"
                  />
                </div>

                <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleFormarDupla}
                    disabled={!cabeceiroSelecionado || pezeiroSelecionadoId === null}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    <UserPlus size={16} />
                    Formar Dupla
                  </button>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <label htmlFor="qtd-sorteio" className="mb-1.5 block text-xs text-slate-500">
                    Sortear parceiros (quantidade)
                  </label>
                  <div className="flex gap-2.5">
                    <input
                      id="qtd-sorteio"
                      type="text"
                      inputMode="numeric"
                      value={quantidadeSorteio}
                      onChange={(e) => setQuantidadeSorteio(e.target.value)}
                      placeholder="Ex: 5"
                      className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={handleSortearDuplas}
                      disabled={!cabeceiroSelecionado || sorteando || !quantidadeSorteio.trim()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      <Dices size={16} />
                      {sorteando ? "Sorteando..." : "Sortear Duplas"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3 — Resumo do Cabeceiro */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <BarChart3 size={15} />
                  </span>
                  <h2 className="font-bold text-slate-900">Resumo do Cabeceiro</h2>
                </div>

                <div className="flex gap-2.5">
                  <StatBox value={pezeiros.length} label="Pezeiros" tone="blue" />
                  <StatBox value={duplas.length} label="Duplas" tone="purple" />
                  <StatBox
                    value={duplas.reduce((soma, d) => soma + d.bois, 0)}
                    label="Total Bois"
                    tone="green"
                  />
                </div>
              </div>
            </div>

            {/* Linha 2 — Tabela de duplas + regra de bois */}
            <div className="flex flex-col gap-5 lg:flex-row">
              {carregandoDuplas ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl bg-white p-10 text-sm text-slate-400 shadow-sm">
                  Carregando duplas...
                </div>
              ) : cabeceiroSelecionado ? (
                <DuplasTable
                  cabeceiroNome={cabeceiroSelecionado.nome}
                  hcCabeceiro={cabeceiroSelecionado.hc}
                  duplas={duplas}
                  onDuplasChange={handleDuplasChange}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl bg-white p-10 text-sm text-slate-400 shadow-sm">
                  Selecione um cabeceiro para ver as duplas formadas.
                </div>
              )}
              {/* <RegraBoisPanel /> */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}