import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Dices, UserPlus, BarChart3, Users } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import StepBadge from "../components/ui/step-badge";
import StatBox from "../components/ui/stat-box";
import DuplasTable, { type DuplaRow } from "../components/dashboard/duplas-table";
import DuplasPorPezeiroTable, {
  type DuplaPorPezeiroRow,
} from "../components/dashboard/duplas-por-pezeiro-table";
import CabeceiroSelect, { type CabeceiroOption } from "../components/dashboard/cabeceiro-select";
import PezeiroSelect, { type PezeiroOption } from "../components/dashboard/pezeiro-select";
import ConfirmDialog from "../components/ui/confirm-dialog";
// import RegraBoisPanel from "../components/dashboard/regra-bois-panel";
import { calcularBoisNu } from "../lib/regras-bois";
import { sortearBalanceado } from "../lib/sorteio";
import { type ProvaDb, buscarProva } from "../services/provas";
import { type CabeceiroDb, listarCabeceirosPorProva } from "../services/cabeceiros";
import { type PezeiroDb, listarPezeirosPorProva } from "../services/pezeiros";
import {
  criarDupla,
  atualizarDupla,
  deletarDupla,
  listarDuplasPorCabeceiro,
  listarDuplasPorPezeiro,
  listarDuplasPorProva,
  type DuplaDetalhadaDb,
  boisParaTempos,
  temposParaBois,
} from "../services/duplas";

type Modo = "cabeceiro" | "pezeiro";

/**
 * Representação única de uma dupla, guardando os dois lados (cabeceiro e pezeiro)
 * independente do modo — permite que a mesma lógica de formar/sortear/editar sirva
 * pros dois fluxos, só trocando qual tabela é usada pra exibir.
 */
interface DuplaGenerica {
  id: number;
  numero: number;
  inscricao: number;
  idCabeceiro: number;
  cabeceiroIniciais: string;
  cabeceiroNome: string;
  hcCabeceiro: number;
  idPezeiro: number;
  pezeiroIniciais: string;
  pezeiroNome: string;
  hcPezeiro: number;
  hcDupla: number;
  bois: number;
  sorteada: boolean;
  eliminada: boolean;
  tempos: (number | null)[];
  parcial: number;
  boiFinal: number;
  media: number;
  paraGanhar: number;
}

function iniciaisDoNome(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function paraDuplaGenerica(d: DuplaDetalhadaDb, numero: number): DuplaGenerica {
  return {
    id: d.id,
    numero,
    inscricao: d.inscricao ?? 0,
    idCabeceiro: d.id_cabeceiro,
    cabeceiroIniciais: iniciaisDoNome(d.cabeceiro_nome),
    cabeceiroNome: d.cabeceiro_nome,
    hcCabeceiro: d.hc_cabeceiro,
    idPezeiro: d.id_pezeiro,
    pezeiroIniciais: iniciaisDoNome(d.pezeiro_nome),
    pezeiroNome: d.pezeiro_nome,
    hcPezeiro: d.hc_pezeiro,
    hcDupla: d.hc_soma ?? d.hc_cabeceiro + d.hc_pezeiro,
    bois: d.bois_nu,
    sorteada: d.sorteada,
    eliminada: d.eliminada,
    tempos: boisParaTempos(d),
    parcial: d.parcial ?? 0,
    boiFinal: d.boi_final ?? 0,
    media: d.media ?? 0,
    paraGanhar: d.para_ganhar ?? 0,
  };
}

/** Recorta a DuplaGenerica pros campos que a DuplasTable (modo Cabeceiro) espera */
function paraDuplaRow(d: DuplaGenerica): DuplaRow {
  return {
    numero: d.numero,
    inscricao: d.inscricao,
    pezeiroIniciais: d.pezeiroIniciais,
    pezeiroNome: d.pezeiroNome,
    hcPez: d.hcPezeiro,
    hcDupla: d.hcDupla,
    bois: d.bois,
    sorteada: d.sorteada,
    eliminada: d.eliminada,
    tempos: d.tempos,
    parcial: d.parcial,
    boiFinal: d.boiFinal,
    media: d.media,
    paraGanhar: d.paraGanhar,
    // Campo "invisível" pro tipo, mas sobrevive em tempo de execução (a tabela só espalha os objetos).
    // Usado em handleDuplasChange pra saber qual dupla no banco foi editada.
    ...({ id: d.id } as unknown as {}),
  };
}

/** Recorta a DuplaGenerica pros campos que a DuplasPorPezeiroTable (modo Pezeiro) espera */
function paraDuplaPorPezeiroRow(d: DuplaGenerica): DuplaPorPezeiroRow {
  return {
    numero: d.numero,
    inscricao: d.inscricao,
    cabeceiroIniciais: d.cabeceiroIniciais,
    cabeceiroNome: d.cabeceiroNome,
    hcCabeceiro: d.hcCabeceiro,
    hcDupla: d.hcDupla,
    bois: d.bois,
    sorteada: d.sorteada,
    eliminada: d.eliminada,
    tempos: d.tempos,
    parcial: d.parcial,
    boiFinal: d.boiFinal,
    media: d.media,
    paraGanhar: d.paraGanhar,
    ...({ id: d.id } as unknown as {}),
  };
}

export default function DashboardPage() {
  const { idProva } = useParams<{ idProva: string }>();
  const idProvaNum = Number(idProva);

  const [modo, setModo] = useState<Modo>("cabeceiro");

  const [prova, setProva] = useState<ProvaDb | null>(null);
  const [cabeceiros, setCabeceiros] = useState<CabeceiroDb[]>([]);
  const [pezeiros, setPezeiros] = useState<PezeiroDb[]>([]);
  const [carregandoBase, setCarregandoBase] = useState(true);

  // Bateria selecionada na tela — só relevante quando a prova usa baterias (prova.bateria === true)
  const [bateriaAtiva, setBateriaAtiva] = useState<number | null>(null);

  // Id da entidade "fixa" na tela (o cabeceiro selecionado, no modo Cabeceiro; o pezeiro, no modo Pezeiro)
  const [entidadeFixaId, setEntidadeFixaId] = useState<number | null>(null);
  // Id do "parceiro" escolhido manualmente (pezeiro no modo Cabeceiro; cabeceiro no modo Pezeiro)
  const [parceiroId, setParceiroId] = useState<number | null>(null);

  const [boisNuTexto, setBoisNuTexto] = useState("");
  const [quantidadeSorteio, setQuantidadeSorteio] = useState("");
  const [sorteando, setSorteando] = useState(false);

  const [duplas, setDuplas] = useState<DuplaGenerica[]>([]);
  const [carregandoDuplas, setCarregandoDuplas] = useState(false);
  const [duplaParaExcluir, setDuplaParaExcluir] = useState<DuplaGenerica | null>(null);

  // Estado "da prova inteira" — usado pro sorteio balanceado e pra saber a próxima inscrição livre.
  const [corridasPorCabeceiro, setCorridasPorCabeceiro] = useState<Record<number, number>>({});
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

        const bateriaInicial = provaDb.bateria ? 1 : null;
        setBateriaAtiva(bateriaInicial);

        const cabeceirosDaBateria = bateriaInicial
          ? cabeceirosDb.filter((c) => c.baterias.includes(bateriaInicial))
          : cabeceirosDb;
        setEntidadeFixaId(cabeceirosDaBateria[0]?.id ?? null);

        const porCabeceiro: Record<number, number> = {};
        const porPezeiro: Record<number, number> = {};
        let maiorInscricao = 0;
        for (const d of duplasDaProva) {
          porCabeceiro[d.id_cabeceiro] = (porCabeceiro[d.id_cabeceiro] ?? 0) + 1;
          porPezeiro[d.id_pezeiro] = (porPezeiro[d.id_pezeiro] ?? 0) + 1;
          maiorInscricao = Math.max(maiorInscricao, d.inscricao ?? 0);
        }
        setCorridasPorCabeceiro(porCabeceiro);
        setCorridasPorPezeiro(porPezeiro);
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

  // Carrega as duplas da entidade fixa sempre que ela OU o modo mudar
  useEffect(() => {
    if (entidadeFixaId === null) {
      setDuplas([]);
      return;
    }

    async function carregarDuplas() {
      setCarregandoDuplas(true);
      setErro(null);
      try {
        const dados =
          modo === "cabeceiro"
            ? await listarDuplasPorCabeceiro(entidadeFixaId!)
            : await listarDuplasPorPezeiro(entidadeFixaId!);
        const ordenados = [...dados].sort((a, b) => (a.inscricao ?? 0) - (b.inscricao ?? 0));
        setDuplas(ordenados.map((d, i) => paraDuplaGenerica(d, i + 1)));
      } catch (e) {
        setErro(typeof e === "string" ? e : "Não foi possível carregar as duplas.");
      } finally {
        setCarregandoDuplas(false);
      }
    }
    carregarDuplas();
  }, [entidadeFixaId, modo]);

  /** A entidade fixa da tela, seja ela um cabeceiro ou um pezeiro, com formato comum {id, nome, hc} */
  const entidadeFixa = useMemo(() => {
    if (entidadeFixaId === null) return null;
    if (modo === "cabeceiro") return cabeceiros.find((c) => c.id === entidadeFixaId) ?? null;
    return pezeiros.find((p) => p.id === entidadeFixaId) ?? null;
  }, [modo, entidadeFixaId, cabeceiros, pezeiros]);

  // Opções pro dropdown do Card 1 (escolher a entidade fixa) — todos os cabeceiros ou todos os pezeiros,
  // filtrados pela bateria ativa quando a prova usa baterias.
  const cabeceirosParaSelecionar: CabeceiroOption[] = useMemo(
    () =>
      cabeceiros
        .filter((c) => bateriaAtiva === null || c.baterias.includes(bateriaAtiva))
        .map((c) => ({ id: c.id, nome: c.nome, hc: c.hc, corridas: corridasPorCabeceiro[c.id] ?? 0 })),
    [cabeceiros, corridasPorCabeceiro, bateriaAtiva]
  );
  const pezeirosParaSelecionar: PezeiroOption[] = useMemo(
    () =>
      pezeiros
        .filter((p) => bateriaAtiva === null || p.baterias.includes(bateriaAtiva))
        .map((p) => ({
          id: p.id,
          nome: p.nome,
          hc: p.hc,
          iniciais: iniciaisDoNome(p.nome),
          corridas: corridasPorPezeiro[p.id] ?? 0,
        })),
    [pezeiros, corridasPorPezeiro, bateriaAtiva]
  );

  // Opções pro dropdown do Card 2 (escolher o parceiro) — filtra quem já está pareado com a entidade
  // fixa, quem não pertence à bateria ativa (quando a prova usa baterias), e quem já atingiu o
  // limite de inscrições da prova (quando houver um definido).
  const cabeceirosDisponiveis: CabeceiroOption[] = useMemo(() => {
    return cabeceiros
      .filter((c) => bateriaAtiva === null || c.baterias.includes(bateriaAtiva))
      .filter((c) => !duplas.some((d) => d.idCabeceiro === c.id))
      .filter(
        (c) =>
          !prova?.limite_inscricao || (corridasPorCabeceiro[c.id] ?? 0) < prova.limite_inscricao
      )
      .map((c) => ({ id: c.id, nome: c.nome, hc: c.hc, corridas: corridasPorCabeceiro[c.id] ?? 0 }));
  }, [cabeceiros, duplas, corridasPorCabeceiro, bateriaAtiva, prova]);

  const pezeirosDisponiveis: PezeiroOption[] = useMemo(() => {
    return pezeiros
      .filter((p) => bateriaAtiva === null || p.baterias.includes(bateriaAtiva))
      .filter((p) => !duplas.some((d) => d.idPezeiro === p.id))
      .filter(
        (p) => !prova?.limite_inscricao || (corridasPorPezeiro[p.id] ?? 0) < prova.limite_inscricao
      )
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        hc: p.hc,
        iniciais: iniciaisDoNome(p.nome),
        corridas: corridasPorPezeiro[p.id] ?? 0,
      }));
  }, [pezeiros, duplas, corridasPorPezeiro, bateriaAtiva, prova]);

  // Sugere a quantidade de bois (pela regra) sempre que a dupla escolhida mudar.
  useEffect(() => {
    if (!entidadeFixa || parceiroId === null) {
      setBoisNuTexto("");
      return;
    }
    const parceiro =
      modo === "cabeceiro" ? pezeiros.find((p) => p.id === parceiroId) : cabeceiros.find((c) => c.id === parceiroId);
    if (!parceiro) return;

    const hcSoma = entidadeFixa.hc + parceiro.hc;
    setBoisNuTexto(String(calcularBoisNu(hcSoma)));
  }, [entidadeFixa, parceiroId, modo, pezeiros, cabeceiros]);

  function handleTrocarModo(novoModo: Modo) {
    setModo(novoModo);
    const lista = novoModo === "cabeceiro" ? cabeceiros : pezeiros;
    const daBateria = lista.filter((item) => bateriaAtiva === null || item.baterias.includes(bateriaAtiva));
    setEntidadeFixaId(daBateria[0]?.id ?? null);
    setParceiroId(null);
  }

  function handleTrocarBateria(novaBateria: number) {
    setBateriaAtiva(novaBateria);
    const lista = modo === "cabeceiro" ? cabeceiros : pezeiros;
    const daBateria = lista.filter((item) => item.baterias.includes(novaBateria));
    setEntidadeFixaId(daBateria[0]?.id ?? null);
    setParceiroId(null);
  }

  function handleSelecionarEntidadeFixa(id: number) {
    setEntidadeFixaId(id);
    setParceiroId(null); // troca invalida o parceiro selecionado
  }

  async function handleFormarDupla() {
    if (!entidadeFixa || parceiroId === null) return;

    const parceiro =
      modo === "cabeceiro" ? pezeiros.find((p) => p.id === parceiroId) : cabeceiros.find((c) => c.id === parceiroId);
    if (!parceiro) return;

    const hcSoma = entidadeFixa.hc + parceiro.hc;

    const boisNuDigitado = Number(boisNuTexto);
    if (!boisNuTexto.trim() || Number.isNaN(boisNuDigitado) || boisNuDigitado < 1 || boisNuDigitado > 6) {
      setErro("Informe uma quantidade de bois válida (1 a 6).");
      return;
    }
    const boisNu = boisNuDigitado;

    const idCabeceiro = modo === "cabeceiro" ? entidadeFixa.id : parceiro.id;
    const idPezeiro = modo === "cabeceiro" ? parceiro.id : entidadeFixa.id;

    if (prova?.limite_inscricao) {
      if ((corridasPorCabeceiro[idCabeceiro] ?? 0) >= prova.limite_inscricao) {
        setErro(`Esse cabeceiro já atingiu o limite de ${prova.limite_inscricao} inscrições.`);
        return;
      }
      if ((corridasPorPezeiro[idPezeiro] ?? 0) >= prova.limite_inscricao) {
        setErro(`Esse pezeiro já atingiu o limite de ${prova.limite_inscricao} inscrições.`);
        return;
      }
    }

    try {
      const nova = await criarDupla({
        idCabeceiro,
        idPezeiro,
        numeroBateria: bateriaAtiva,
        inscricao: proximaInscricaoDisponivel,
        hcSoma,
        boisNu,
        sorteada: false,
      });

      const cabeceiroEnvolvido = modo === "cabeceiro" ? entidadeFixa : parceiro;
      const pezeiroEnvolvido = modo === "cabeceiro" ? parceiro : entidadeFixa;

      const novaLinha: DuplaGenerica = {
        id: nova.id,
        numero: duplas.length + 1,
        inscricao: nova.inscricao ?? proximaInscricaoDisponivel,
        idCabeceiro,
        cabeceiroIniciais: iniciaisDoNome(cabeceiroEnvolvido.nome),
        cabeceiroNome: cabeceiroEnvolvido.nome,
        hcCabeceiro: cabeceiroEnvolvido.hc,
        idPezeiro,
        pezeiroIniciais: iniciaisDoNome(pezeiroEnvolvido.nome),
        pezeiroNome: pezeiroEnvolvido.nome,
        hcPezeiro: pezeiroEnvolvido.hc,
        hcDupla: nova.hc_soma ?? hcSoma,
        bois: nova.bois_nu,
        sorteada: false,
        eliminada: false,
        tempos: boisParaTempos(nova),
        parcial: nova.parcial ?? 0,
        boiFinal: nova.boi_final ?? 0,
        media: nova.media ?? 0,
        paraGanhar: nova.para_ganhar ?? 0,
      };

      setDuplas((prev) => [...prev, novaLinha]);
      setCorridasPorCabeceiro((prev) => ({ ...prev, [idCabeceiro]: (prev[idCabeceiro] ?? 0) + 1 }));
      setCorridasPorPezeiro((prev) => ({ ...prev, [idPezeiro]: (prev[idPezeiro] ?? 0) + 1 }));
      setProximaInscricaoDisponivel((prev) => prev + 1);
      setParceiroId(null);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível formar a dupla.");
    }
  }

  /**
   * Sorteia `quantidade` parceiros (pezeiros no modo Cabeceiro; cabeceiros no modo Pezeiro),
   * priorizando quem já correu menos na prova inteira. A inscrição só incrementa a partir da última usada.
   */
  async function handleSortearDuplas() {
    if (!entidadeFixa) return;

    const quantidade = Number(quantidadeSorteio);
    if (!quantidadeSorteio.trim() || Number.isNaN(quantidade) || quantidade < 1) {
      setErro("Informe uma quantidade válida para o sorteio.");
      return;
    }

    const opcoesParceiro = modo === "cabeceiro" ? pezeirosDisponiveis : cabeceirosDisponiveis;

    const sorteados = sortearBalanceado(opcoesParceiro, quantidade, (p) => p.corridas ?? 0);
    if (sorteados.length === 0) {
      setErro(
        modo === "cabeceiro"
          ? "Não há pezeiros disponíveis para sortear."
          : "Não há cabeceiros disponíveis para sortear."
      );
      return;
    }

    setSorteando(true);
    setErro(null);
    try {
      let proximaInscricao = proximaInscricaoDisponivel;
      const novasLinhas: DuplaGenerica[] = [];
      const novasCorridasCabeceiro: Record<number, number> = {};
      const novasCorridasPezeiro: Record<number, number> = {};

      for (const parceiro of sorteados) {
        const hcSoma = entidadeFixa.hc + parceiro.hc;
        const boisNu = calcularBoisNu(hcSoma);

        const idCabeceiro = modo === "cabeceiro" ? entidadeFixa.id : parceiro.id;
        const idPezeiro = modo === "cabeceiro" ? parceiro.id : entidadeFixa.id;

        const nova = await criarDupla({
          idCabeceiro,
          idPezeiro,
          numeroBateria: bateriaAtiva,
          inscricao: proximaInscricao,
          hcSoma,
          boisNu,
          sorteada: true,
        });

        const cabeceiroEnvolvido = modo === "cabeceiro" ? entidadeFixa : parceiro;
        const pezeiroEnvolvido = modo === "cabeceiro" ? parceiro : entidadeFixa;

        novasLinhas.push({
          id: nova.id,
          numero: duplas.length + novasLinhas.length + 1,
          inscricao: nova.inscricao ?? proximaInscricao,
          idCabeceiro,
          cabeceiroIniciais: iniciaisDoNome(cabeceiroEnvolvido.nome),
          cabeceiroNome: cabeceiroEnvolvido.nome,
          hcCabeceiro: cabeceiroEnvolvido.hc,
          idPezeiro,
          pezeiroIniciais: iniciaisDoNome(pezeiroEnvolvido.nome),
          pezeiroNome: pezeiroEnvolvido.nome,
          hcPezeiro: pezeiroEnvolvido.hc,
          hcDupla: nova.hc_soma ?? hcSoma,
          bois: nova.bois_nu,
          sorteada: true,
          eliminada: false,
          tempos: boisParaTempos(nova),
          parcial: nova.parcial ?? 0,
          boiFinal: nova.boi_final ?? 0,
          media: nova.media ?? 0,
          paraGanhar: nova.para_ganhar ?? 0,
        });

        novasCorridasCabeceiro[idCabeceiro] = (novasCorridasCabeceiro[idCabeceiro] ?? 0) + 1;
        novasCorridasPezeiro[idPezeiro] = (novasCorridasPezeiro[idPezeiro] ?? 0) + 1;
        proximaInscricao += 1;
      }

      setDuplas((prev) => [...prev, ...novasLinhas]);
      setCorridasPorCabeceiro((prev) => {
        const atualizado = { ...prev };
        for (const [id, inc] of Object.entries(novasCorridasCabeceiro)) {
          atualizado[Number(id)] = (atualizado[Number(id)] ?? 0) + inc;
        }
        return atualizado;
      });
      setCorridasPorPezeiro((prev) => {
        const atualizado = { ...prev };
        for (const [id, inc] of Object.entries(novasCorridasPezeiro)) {
          atualizado[Number(id)] = (atualizado[Number(id)] ?? 0) + inc;
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

  /** Compartilhado pelas duas tabelas — o `id` sobrevive em tempo de execução mesmo fora do tipo declarado */
  function handleDuplasChange(atualizado: (DuplaRow | DuplaPorPezeiroRow)[]) {
    const comId = atualizado as unknown as Array<{
      id: number;
      tempos: (number | null)[];
      boiFinal: number;
      parcial: number;
      media: number;
      eliminada: boolean;
    }>;

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
          eliminada: novo.eliminada,
        };
      });

      for (const dupla of novoEstado) {
        const original = prev.find((d) => d.id === dupla.id);
        if (!original) continue;

        const mudou =
          original.boiFinal !== dupla.boiFinal ||
          original.parcial !== dupla.parcial ||
          original.media !== dupla.media ||
          original.eliminada !== dupla.eliminada ||
          original.tempos.some((t, idx) => t !== dupla.tempos[idx]);

        if (!mudou) continue;

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
          eliminada: dupla.eliminada,
        }).catch((e) => {
          setErro(typeof e === "string" ? e : "Não foi possível salvar a alteração.");
        });
      }

      return novoEstado;
    });
  }

  function handleSolicitarExclusao(duplaIndex: number) {
    const dupla = duplas[duplaIndex];
    if (!dupla) return;
    setDuplaParaExcluir(dupla);
  }

  async function handleConfirmarExclusao() {
    if (!duplaParaExcluir) return;

    try {
      await deletarDupla(duplaParaExcluir.id);

      setDuplas((prev) => prev.filter((d) => d.id !== duplaParaExcluir.id));

      // Ajusta as contagens de corridas — a dupla excluída não conta mais pra ninguém
      setCorridasPorCabeceiro((prev) => ({
        ...prev,
        [duplaParaExcluir.idCabeceiro]: Math.max(0, (prev[duplaParaExcluir.idCabeceiro] ?? 1) - 1),
      }));
      setCorridasPorPezeiro((prev) => ({
        ...prev,
        [duplaParaExcluir.idPezeiro]: Math.max(0, (prev[duplaParaExcluir.idPezeiro] ?? 1) - 1),
      }));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível excluir a dupla.");
    } finally {
      setDuplaParaExcluir(null);
    }
  }

  const tituloParceiro = modo === "cabeceiro" ? "Pezeiro" : "Cabeceiro";
  const tituloFixo = modo === "cabeceiro" ? "Cabeceiro" : "Pezeiro";

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Dashboard"
        subtitle="Selecione um cabeceiro ou pezeiro para montar as duplas"
        action={
          <button className="flex items-center cursor-pointer gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700">
            <Download size={16} />
            Exportar PDF
          </button>
        }
      />

      <div className="space-y-5 p-6 lg:p-10">
        {/* Toggle de modo */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => handleTrocarModo("cabeceiro")}
            className={`flex items-center cursor-pointer gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              modo === "cabeceiro" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Users size={16} />
            Ver por Cabeceiro
          </button>
          <button
            type="button"
            onClick={() => handleTrocarModo("pezeiro")}
            className={`flex items-center cursor-pointer gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              modo === "pezeiro" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Users size={16} />
            Ver por Pezeiro
          </button>
        </div>

        {prova?.bateria && prova.bateria_nu && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Bateria
            </span>
            {Array.from({ length: prova.bateria_nu }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleTrocarBateria(n)}
                className={`rounded-lg cursor-pointer px-3 py-1.5 text-sm font-semibold transition-colors ${
                  bateriaAtiva === n
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-500 shadow-sm hover:bg-slate-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">{erro}</div>
        )}

        {carregandoBase ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando cabeceiros e pezeiros...</p>
          </div>
        ) : cabeceiros.length === 0 || pezeiros.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">
              Cadastre pelo menos um cabeceiro e um pezeiro nessa prova pra começar.
            </p>
          </div>
        ) : (
          <>
            {/* Linha 1 — Seleção / dupla / resumo */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Card 1 — Selecionar entidade fixa */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5">
                  <StepBadge>1</StepBadge>
                  <h2 className="font-bold text-slate-900">Selecionar {tituloFixo}</h2>
                </div>

                <p className="mb-2 text-xs text-slate-500">{tituloFixo} ativo</p>
                {modo === "cabeceiro" ? (
                  <CabeceiroSelect
                    cabeceiros={cabeceirosParaSelecionar}
                    selecionadoId={entidadeFixaId}
                    onSelect={handleSelecionarEntidadeFixa}
                  />
                ) : (
                  <PezeiroSelect
                    pezeiros={pezeirosParaSelecionar}
                    selecionadoId={entidadeFixaId}
                    onSelect={handleSelecionarEntidadeFixa}
                  />
                )}
              </div>

              {/* Card 2 — Escolher Dupla */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5">
                  <StepBadge>2</StepBadge>
                  <h2 className="font-bold text-slate-900">Escolher Dupla</h2>
                </div>

                <p className="mb-2 text-xs text-slate-500">Selecione manualmente ou sorteie</p>
                {modo === "cabeceiro" ? (
                  <PezeiroSelect
                    pezeiros={pezeirosDisponiveis}
                    selecionadoId={parceiroId}
                    onSelect={setParceiroId}
                  />
                ) : (
                  <CabeceiroSelect
                    cabeceiros={cabeceirosDisponiveis}
                    selecionadoId={parceiroId}
                    onSelect={setParceiroId}
                  />
                )}

                <div className="mt-2.5">
                  <label htmlFor="bois-nu" className="mb-1.5 block text-xs text-slate-500">
                    Qtd. de Bois{" "}
                    <span className="text-slate-400">(sugestão pela regra de HC — pode editar)</span>
                  </label>
                  <input
                    id="bois-nu"
                    type="text"
                    inputMode="numeric"
                    value={boisNuTexto}
                    onChange={(e) => setBoisNuTexto(e.target.value)}
                    placeholder="—"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleFormarDupla}
                    disabled={!entidadeFixa || parceiroId === null}
                    className="flex flex-1 items-center cursor-pointer justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    <UserPlus size={16} />
                    Formar Dupla
                  </button>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <label htmlFor="qtd-sorteio" className="mb-1.5 block text-xs text-slate-500">
                    Sortear {tituloParceiro.toLowerCase()}s (quantidade)
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
                      disabled={!entidadeFixa || sorteando || !quantidadeSorteio.trim()}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-500 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      <Dices size={16} />
                      {sorteando ? "Sorteando..." : "Sortear Duplas"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3 — Resumo */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <BarChart3 size={15} />
                  </span>
                  <h2 className="font-bold text-slate-900">Resumo do {tituloFixo}</h2>
                </div>

                <div className="flex gap-2.5">
                  <StatBox
                    value={modo === "cabeceiro" ? pezeirosParaSelecionar.length : cabeceirosParaSelecionar.length}
                    label={tituloParceiro + "s"}
                    tone="blue"
                  />
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
              ) : entidadeFixa && modo === "cabeceiro" ? (
                <DuplasTable
                  cabeceiroNome={entidadeFixa.nome}
                  hcCabeceiro={entidadeFixa.hc}
                  duplas={duplas.map(paraDuplaRow)}
                  onDuplasChange={handleDuplasChange}
                  onDeletar={handleSolicitarExclusao}
                />
              ) : entidadeFixa && modo === "pezeiro" ? (
                <DuplasPorPezeiroTable
                  pezeiroNome={entidadeFixa.nome}
                  hcPezeiro={entidadeFixa.hc}
                  duplas={duplas.map(paraDuplaPorPezeiroRow)}
                  onDuplasChange={handleDuplasChange}
                  onDeletar={handleSolicitarExclusao}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl bg-white p-10 text-sm text-slate-400 shadow-sm">
                  Selecione um {tituloFixo.toLowerCase()} para ver as duplas formadas.
                </div>
              )}
              {/* <RegraBoisPanel /> */}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={duplaParaExcluir !== null}
        title={
          duplaParaExcluir
            ? `Excluir dupla "${duplaParaExcluir.cabeceiroNome} & ${duplaParaExcluir.pezeiroNome}"?`
            : ""
        }
        description="Essa ação não pode ser desfeita. Os tempos e resultados dessa dupla serão perdidos."
        confirmLabel="Excluir"
        onConfirm={handleConfirmarExclusao}
        onCancel={() => setDuplaParaExcluir(null)}
      />
    </div>
  );
}