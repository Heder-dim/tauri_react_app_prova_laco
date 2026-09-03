import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Ban, Dices, Trash2 } from "lucide-react";
import Avatar from "../ui/avatar";
import LiveBadge from "../ui/live-badge";
import ConfirmDialog from "../ui/confirm-dialog";
import {
  MEDIA_INCOMPLETA,
  calcularMenorMedia,
  calcularSomaTempos,
  calcularParaGanhar,
  nenhumTempoLancado,
} from "../../lib/para-ganhar";

export interface DuplaResultadoRow {
  numero: number;
  inscricao: number;
  /** null quando a prova não usa baterias, ou quando a dupla ainda não foi organizada em nenhuma */
  numeroBateria: number | null;
  cabeceiroNome: string;
  hcCabeceiro: number;
  pezeiroIniciais: string;
  pezeiroNome: string;
  hcPez: number;
  hcDupla: number;
  bois: number;
  /** true se a dupla foi formada pelo botão "Sortear Duplas"; false se foi manual */
  sorteada: boolean;
  /** true se a dupla foi eliminada (errou um boi) — digitar "sat" ou "erro" num tempo marca automaticamente */
  eliminada: boolean;
  /** Tempos do 1º ao 6º boi, em segundos. `null` = ainda não corrido. */
  tempos: (number | null)[];
  /** Calculado automaticamente — média dos tempos de boi, só quando TODOS os bois da dupla
   * já foram lançados; `null` enquanto estiver incompleta (bate com a planilha original). */
  parcial: number | null;
  /** Editável — campo independente. `null` = ainda não lançado. */
  boiFinal: number | null;
  /** Calculado automaticamente. Vale 120 (valor "castigo" da planilha original) quando a
   * dupla está incompleta (1º tempo vazio/0, ou Boi Final ainda não lançado). */
  media: number;
  /** Calculado automaticamente — recalculado pra TODAS as duplas sempre que qualquer uma
   * delas muda, já que depende da menor média entre todas (o líder da prova). */
  paraGanhar: number;
}

export interface DuplasResultadosTableProps {
  duplas: DuplaResultadoRow[];
  aoVivo?: boolean;
  /** Chamado sempre que um tempo ou o Boi Final é editado, já com os valores recalculados */
  onDuplasChange?: (duplas: DuplaResultadoRow[]) => void;
  /** Chamado quando o usuário confirma uma nova inscrição pra uma dupla (ao sair do campo ou apertar Enter) */
  onInscricaoChange?: (duplaIndex: number, novaInscricao: number) => void;
  /** Chamado quando o usuário confirma a exclusão de uma dupla (o índice na lista atual) */
  onDeletar?: (duplaIndex: number) => void;
}

function formatTempo(valor: number | null) {
  if (valor === null) return "–";
  return valor.toFixed(3).replace(".", ",");
}

/** Converte o texto digitado (aceita vírgula ou ponto) em número, ou null se vazio/inválido */
function parseTempoInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Recalcula Parcial e Média, replicando a planilha original:
 * - Parcial = MÉDIA dos tempos de boi (não soma!), e só existe quando TODOS os bois
 *   dessa dupla já foram lançados — senão fica `null`.
 * - Média = 120 (valor "castigo") se o 1º tempo estiver vazio/0, se o Boi Final ainda
 *   não foi lançado, ou se a dupla estiver eliminada. Senão, é a média dos tempos
 *   lançados (ignorando os ainda vazios, igual a MÉDIA() do Excel) + o Boi Final.
 */
function recalcularParcialEMedia(dupla: DuplaResultadoRow): DuplaResultadoRow {
  const temposRelevantes = dupla.tempos.slice(0, dupla.bois);
  const todosPreenchidos = temposRelevantes.every((t) => t !== null);

  const parcial = todosPreenchidos
    ? (temposRelevantes as number[]).reduce((soma, t) => soma + t, 0) / dupla.bois
    : null;

  const primeiroTempo = dupla.tempos[0];
  const primeiroTempoValido = primeiroTempo !== null && primeiroTempo !== 0;

  let media: number;
  if (!primeiroTempoValido || dupla.boiFinal === null || dupla.eliminada) {
    media = MEDIA_INCOMPLETA;
  } else {
    const temposLancados = temposRelevantes.filter((t): t is number => t !== null);
    const valoresParaMedia = [...temposLancados, dupla.boiFinal];
    media = valoresParaMedia.reduce((soma, t) => soma + t, 0) / valoresParaMedia.length;
  }

  return { ...dupla, parcial, media };
}

/**
 * Recalcula o "Para Ganhar" de TODAS as duplas da lista, replicando a fórmula da planilha:
 *   paraGanhar = (bois + 1) * (menorMedia - 0,01) - somaTempos
 *
 * Precisa rodar sobre a lista inteira (não só a dupla que mudou) porque `menorMedia`
 * representa a média do líder da prova — editar o tempo de UMA dupla pode mudar quem
 * lidera, o que muda o "Para Ganhar" de TODAS as outras.
 */
function recalcularParaGanharDeTodas(lista: DuplaResultadoRow[]): DuplaResultadoRow[] {
  const menorMedia = calcularMenorMedia(
    lista.map((d) => ({ bois: d.bois, media: d.media, eliminada: d.eliminada }))
  );

  return lista.map((dupla) => {
    // Dupla que ainda não correu nenhum boi mostra "0" em vez de um alvo calculado —
    // evita exibir um número grande e confuso antes da dupla sequer começar a competir.
    if (nenhumTempoLancado(dupla.tempos, dupla.bois)) {
      return { ...dupla, paraGanhar: 0 };
    }
    const somaTempos = calcularSomaTempos(dupla.tempos, dupla.bois);
    const paraGanhar = calcularParaGanhar(dupla.bois, somaTempos, menorMedia);
    return { ...dupla, paraGanhar };
  });
}

export default function DuplasResultadosTable({
  duplas: duplasIniciais,
  aoVivo = true,
  onDuplasChange,
  onInscricaoChange,
  onDeletar,
}: DuplasResultadosTableProps) {
  const [duplas, setDuplas] = useState<DuplaResultadoRow[]>(duplasIniciais);

  // Guarda o texto exatamente como foi digitado em cada campo, pra não perder a vírgula/ponto ao reformatar.
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

  // Conta quantas edições a própria tabela mandou pra página (via onDuplasChange) e ainda não
  // "voltaram" como prop. Cada onDuplasChange incrementa; cada mudança de prop correspondente
  // decrementa e pula o resync. Precisa ser um CONTADOR (não um booleano) porque digitar rápido
  // ("s", "sa", "sat") gera vários ciclos de ida-e-volta em sequência — um booleano só consegue
  // "lembrar" de ignorar um retorno, fazendo os seguintes resetar o campo no meio da digitação.
  const ecosPendentesRef = useRef(0);

  // Ressincroniza sempre que o array recebido via prop mudar de fato — necessário porque
  // o estado interno existe pra permitir edição local, mas não pode "ficar preso" nos dados
  // iniciais quando a página recarrega, sorteia inscrição, ou edita uma dupla — MAS só quando
  // a mudança vem de fora (não é eco da nossa própria digitação).
  useEffect(() => {
    if (ecosPendentesRef.current > 0) {
      ecosPendentesRef.current -= 1;
      return;
    }
    setDuplas(duplasIniciais);
    setRawInputs({});
  }, [duplasIniciais]);

  function handleTempoChange(duplaIndex: number, tempoIndex: number, rawValue: string) {
    setRawInputs((prev) => ({ ...prev, [`tempo-${duplaIndex}-${tempoIndex}`]: rawValue }));

    setDuplas((prev) => {
      const atualizado = prev.map((dupla, i) => {
        if (i !== duplaIndex) return dupla;

        const textoLimpo = rawValue.trim().toLowerCase();
        const ehMarcaDeEliminacao = textoLimpo === "sat" || textoLimpo === "erro";

        const novosTempos = [...dupla.tempos];
        novosTempos[tempoIndex] = parseTempoInput(rawValue);

        const duplaRecalculada = recalcularParcialEMedia({ ...dupla, tempos: novosTempos });
        return ehMarcaDeEliminacao ? { ...duplaRecalculada, eliminada: true } : duplaRecalculada;
      });

      const comParaGanharAtualizado = recalcularParaGanharDeTodas(atualizado);
      ecosPendentesRef.current += 1;
      onDuplasChange?.(comParaGanharAtualizado);
      return comParaGanharAtualizado;
    });
  }

  /** Desfaz (ou refaz) a marcação de eliminada — botão no badge "ELIMINADA" da linha */
  function handleToggleEliminada(duplaIndex: number) {
    setDuplas((prev) => {
      const atualizado = prev.map((dupla, i) =>
        i === duplaIndex
          ? recalcularParcialEMedia({ ...dupla, eliminada: !dupla.eliminada })
          : dupla
      );
      const comParaGanharAtualizado = recalcularParaGanharDeTodas(atualizado);
      ecosPendentesRef.current += 1;
      onDuplasChange?.(comParaGanharAtualizado);
      return comParaGanharAtualizado;
    });
  }

  // O clique no badge "ELIMINADA" pede confirmação antes de desfazer — evita clique acidental
  // apagando o registro de que a dupla errou o boi.
  const [duplaParaDesmarcar, setDuplaParaDesmarcar] = useState<number | null>(null);

  function handleSolicitarDesmarcarEliminada(duplaIndex: number) {
    setDuplaParaDesmarcar(duplaIndex);
  }

  function handleConfirmarDesmarcarEliminada() {
    if (duplaParaDesmarcar !== null) handleToggleEliminada(duplaParaDesmarcar);
    setDuplaParaDesmarcar(null);
  }

  /** Igual aos tempos normais, "sat"/"erro" aqui também marca a dupla como eliminada. */
  function handleBoiFinalChange(duplaIndex: number, rawValue: string) {
    setRawInputs((prev) => ({ ...prev, [`boiFinal-${duplaIndex}`]: rawValue }));

    setDuplas((prev) => {
      const atualizado = prev.map((dupla, i) => {
        if (i !== duplaIndex) return dupla;

        const textoLimpo = rawValue.trim().toLowerCase();
        const ehMarcaDeEliminacao = textoLimpo === "sat" || textoLimpo === "erro";

        const novoBoiFinal = parseTempoInput(rawValue);
        const duplaRecalculada = recalcularParcialEMedia({ ...dupla, boiFinal: novoBoiFinal });
        return ehMarcaDeEliminacao ? { ...duplaRecalculada, eliminada: true } : duplaRecalculada;
      });

      const comParaGanharAtualizado = recalcularParaGanharDeTodas(atualizado);
      ecosPendentesRef.current += 1;
      onDuplasChange?.(comParaGanharAtualizado);
      return comParaGanharAtualizado;
    });
  }

  /** Só atualiza o texto digitado — a mudança de verdade só acontece ao confirmar (blur/Enter),
   * já que editar a inscrição desloca todas as outras duplas (operação mais "pesada"). */
  function handleInscricaoInputChange(duplaIndex: number, rawValue: string) {
    setRawInputs((prev) => ({ ...prev, [`inscricao-${duplaIndex}`]: rawValue }));
  }

  function limparRawInscricao(duplaIndex: number) {
    setRawInputs((prev) => {
      const copia = { ...prev };
      delete copia[`inscricao-${duplaIndex}`];
      return copia;
    });
  }

  function handleInscricaoCommit(duplaIndex: number) {
    const raw = rawInputs[`inscricao-${duplaIndex}`];
    if (raw === undefined) return; // nada foi digitado, não há o que confirmar

    const novaInscricao = Number(raw.trim());
    if (!raw.trim() || Number.isNaN(novaInscricao) || novaInscricao < 1) {
      limparRawInscricao(duplaIndex); // valor inválido — descarta e volta a mostrar o original
      return;
    }

    limparRawInscricao(duplaIndex);
    onInscricaoChange?.(duplaIndex, Math.trunc(novaInscricao));
  }

  /** Valor mostrado no input: se foi marcado como eliminação ("sat"/"erro"), trava nesse texto
   * (maiúsculo); senão prioriza o texto bruto digitado; cai pro valor formatado quando ainda não
   * foi mexido. */
  function tempoInputValue(duplaIndex: number, tempoIndex: number, tempo: number | null) {
    const raw = rawInputs[`tempo-${duplaIndex}-${tempoIndex}`];
    if (raw !== undefined) {
      const textoLimpo = raw.trim().toLowerCase();
      if (textoLimpo === "sat" || textoLimpo === "erro") return textoLimpo.toUpperCase();
      return raw;
    }
    return tempo !== null ? tempo.toString().replace(".", ",") : "";
  }

  /** Mesma lógica de tempoInputValue: trava em "SAT"/"ERRO" se foi essa a marca de eliminação */
  function boiFinalInputValue(duplaIndex: number, boiFinal: number | null) {
    const raw = rawInputs[`boiFinal-${duplaIndex}`];
    if (raw !== undefined) {
      const textoLimpo = raw.trim().toLowerCase();
      if (textoLimpo === "sat" || textoLimpo === "erro") return textoLimpo.toUpperCase();
      return raw;
    }
    return boiFinal !== null ? boiFinal.toString().replace(".", ",") : "";
  }

  function inscricaoInputValue(duplaIndex: number, inscricao: number) {
    const raw = rawInputs[`inscricao-${duplaIndex}`];
    if (raw !== undefined) return raw;
    return String(inscricao);
  }

  // Ordenação por Parcial ou Média — só reordena a EXIBIÇÃO (uma lista de índices), sem tocar
  // no array `duplas` de verdade, já que os handlers de edição/exclusão/inscrição dependem do
  // índice original pra saber qual dupla foi mexida.
  const [ordenacao, setOrdenacao] = useState<{ campo: "parcial" | "media"; direcao: "asc" | "desc" } | null>(
    null
  );

  function handleOrdenar(campo: "parcial" | "media") {
    setOrdenacao((prev) => {
      if (!prev || prev.campo !== campo) return { campo, direcao: "asc" };
      return { campo, direcao: prev.direcao === "asc" ? "desc" : "asc" };
    });
  }

  const indicesExibidos = useMemo(() => {
    const indices = duplas.map((_, i) => i);
    if (!ordenacao) return indices;
    const sinal = ordenacao.direcao === "asc" ? 1 : -1;
    return indices.sort((a, b) => {
      const valorA = duplas[a][ordenacao.campo];
      const valorB = duplas[b][ordenacao.campo];
      if (valorA === null && valorB === null) return 0;
      if (valorA === null) return 1; // duplas incompletas (parcial null) sempre por último
      if (valorB === null) return -1;
      return (valorA - valorB) * sinal;
    });
  }, [duplas, ordenacao]);

  function IconeOrdenacao({ campo }: { campo: "parcial" | "media" }) {
    if (ordenacao?.campo !== campo) return null;
    return ordenacao.direcao === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  }

  // Arrastar com o mouse pra rolar a tabela horizontalmente (tipo "clicar e puxar"), sem precisar
  // mirar na barra de scroll. Só ativa se o clique começar fora de um campo editável — senão
  // atrapalharia o clique normal em inputs/botões.
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const arrastoRef = useRef<{ startX: number; scrollLeftInicial: number } | null>(null);
  const [arrastando, setArrastando] = useState(false);

  function handleMouseDownArrastar(e: React.MouseEvent<HTMLDivElement>) {
    const alvo = e.target as HTMLElement;
    if (alvo.closest("input, button, a, select, textarea")) return;
    if (!scrollContainerRef.current) return;

    arrastoRef.current = { startX: e.pageX, scrollLeftInicial: scrollContainerRef.current.scrollLeft };
    setArrastando(true);
  }

  useEffect(() => {
    if (!arrastando) return;

    function handleMouseMove(e: MouseEvent) {
      if (!arrastoRef.current || !scrollContainerRef.current) return;
      const delta = e.pageX - arrastoRef.current.startX;
      scrollContainerRef.current.scrollLeft = arrastoRef.current.scrollLeftInicial - delta;
    }

    function handleMouseUp() {
      arrastoRef.current = null;
      setArrastando(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [arrastando]);

  return (
    <div className="min-w-0 flex-1 rounded-2xl bg-white p-5 shadow-sm">
      {/* Cabeçalho do card */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Duplas e Resultados</h2>
          <p className="mt-0.5 text-xs text-slate-500">{duplas.length} duplas</p>
        </div>
        {aoVivo && <LiveBadge />}
      </div>

      {/* Tabela */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDownArrastar}
        className={`overflow-x-auto ${arrastando ? "cursor-grabbing select-none" : "cursor-grab"}`}
      >
        <table className="w-full border-collapse table-fixed text-xs">
          {/* Larguras em %: # / Status / Bateria / Inscrição / Cabeceiro / HC Cabeceiro / Pezeiro / HC Pez. / HC Dupla / Bois / 1º-6º Boi / Parcial / Boi Final / Média / Para Ganhar / Ações — soma = 100% */}
          <colgroup>
            <col style={{ width: "2.5%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "4.5%" }} />
            <col style={{ width: "4.5%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "4.5%" }} />
            <col style={{ width: "4.5%" }} />
            <col style={{ width: "3%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5.5%" }} />
            <col style={{ width: "3%" }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                #
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                <span className="sr-only">Status</span>
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                Bateria
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                Inscrição
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                Cabeceiro
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                HC Cabeceiro
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                Pezeiro
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                HC Pez.
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                HC Dupla
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                Bois
              </th>
              <th colSpan={6} className="border-b border-slate-100 bg-slate-50 px-1 py-1.5 text-center text-[10px] font-semibold text-slate-500">
                Tempo de Cada Boi (seg.)
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => handleOrdenar("parcial")}
                  className="flex items-center gap-1 transition-colors hover:text-slate-700"
                >
                  Parcial
                  <IconeOrdenacao campo="parcial" />
                </button>
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                Boi Final
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => handleOrdenar("media")}
                  className="flex items-center gap-1 transition-colors hover:text-slate-700"
                >
                  Média
                  <IconeOrdenacao campo="media" />
                </button>
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                Para Ganhar
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-500">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
            <tr>
              {["1º Boi", "2º Boi", "3º Boi", "4º Boi", "5º Boi", "6º Boi"].map((label) => (
                <th
                  key={label}
                  className="border-b border-slate-100 bg-slate-50 px-1 py-1 text-center text-[10px] font-medium text-slate-400"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indicesExibidos.map((duplaIndex) => {
              const dupla = duplas[duplaIndex];
              return (
              <tr
                key={dupla.numero}
                className={`border-b border-slate-50 last:border-0 ${dupla.eliminada ? "bg-red-50/60" : ""}`}
              >
                <td className="px-1.5 py-2 text-slate-400">
                  {String(dupla.numero).padStart(2, "0")}
                </td>
                <td className="px-1.5 py-2">
                  {dupla.eliminada && (
                    <button
                      type="button"
                      onClick={() => handleSolicitarDesmarcarEliminada(duplaIndex)}
                      aria-label="Dupla eliminada — clique para desfazer"
                      title="Dupla eliminada — clique para desfazer"
                      className="flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600 transition-colors hover:bg-red-200"
                    >
                      <Ban size={10} />
                      ELIMINADA
                    </button>
                  )}
                </td>
                <td className="px-1.5 py-2">
                  {dupla.numeroBateria !== null ? (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {dupla.numeroBateria}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">–</span>
                  )}
                </td>
                <td className="box-border px-1 py-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inscricaoInputValue(duplaIndex, dupla.inscricao)}
                    disabled={dupla.eliminada}
                    aria-label={`Inscrição — ${dupla.cabeceiroNome} & ${dupla.pezeiroNome}`}
                    onChange={(e) => handleInscricaoInputChange(duplaIndex, e.target.value)}
                    onBlur={() => handleInscricaoCommit(duplaIndex)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="box-border w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-center font-semibold text-slate-700 outline-none transition-colors cursor-text hover:bg-slate-50 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  />
                </td>
                <td className="px-1.5 py-2">
                  <span className="font-semibold text-blue-600">{dupla.cabeceiroNome}</span>
                </td>
                <td className="px-1.5 py-2">
                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                    {dupla.hcCabeceiro.toFixed(1).replace(".", ",")}
                  </span>
                </td>
                <td className="px-1.5 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar initials={dupla.pezeiroIniciais} />
                    <span className="font-semibold text-slate-900">
                      {dupla.pezeiroNome}
                    </span>
                    {dupla.sorteada && (
                      <span
                        aria-label="Dupla formada por sorteio"
                        title="Dupla formada por sorteio"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600"
                      >
                        <Dices size={12} />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-1.5 py-2">
                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                    {dupla.hcPez.toFixed(1).replace(".", ",")}
                  </span>
                </td>
                <td className="px-1.5 py-2">
                  <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600">
                    {dupla.hcDupla.toFixed(1).replace(".", ",")}
                  </span>
                </td>
                <td className="px-1.5 py-2 text-slate-700">{dupla.bois}</td>

                {/* Tempos editáveis — só habilitados até a quantidade de bois da dupla, e nunca se a dupla estiver eliminada */}
                {dupla.tempos.map((tempo, tempoIndex) => {
                  const habilitado = tempoIndex < dupla.bois && !dupla.eliminada;
                  return (
                    <td key={tempoIndex} className="box-border px-0.5 py-1.5 text-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={tempoInputValue(duplaIndex, tempoIndex, tempo)}
                        placeholder="–"
                        disabled={!habilitado}
                        aria-label={`Tempo do ${tempoIndex + 1}º boi — ${dupla.pezeiroNome}`}
                        onChange={(e) => handleTempoChange(duplaIndex, tempoIndex, e.target.value)}
                        className={`box-border w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-center outline-none transition-colors placeholder:text-slate-300 ${
                          habilitado
                            ? "cursor-text hover:bg-slate-50 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            : "cursor-not-allowed opacity-40"
                        } ${
                          tempoIndex === 1 && tempo !== null
                            ? "font-semibold text-green-600"
                            : "text-slate-700"
                        }`}
                      />
                    </td>
                  );
                })}

                <td className="px-1.5 py-2 text-slate-700">
                  {formatTempo(dupla.parcial)}
                </td>

                {/* Boi Final — editável, independente dos tempos, exceto se a dupla estiver eliminada */}
                <td className="box-border px-1 py-1.5">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={boiFinalInputValue(duplaIndex, dupla.boiFinal)}
                    disabled={dupla.eliminada}
                    aria-label={`Boi Final — ${dupla.pezeiroNome}`}
                    onChange={(e) => handleBoiFinalChange(duplaIndex, e.target.value)}
                    className="box-border w-full rounded-md border border-transparent bg-green-50 px-1.5 py-1 text-center font-semibold text-green-600 outline-none transition-colors cursor-text hover:bg-green-100 focus:border-green-300 focus:bg-white focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-green-50"
                  />
                </td>

                <td className="px-1.5 py-2 text-slate-700">
                  {formatTempo(dupla.media)}
                </td>
                <td className="px-1.5 py-2">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    {formatTempo(dupla.paraGanhar)}
                  </span>
                </td>
                <td className="px-1.5 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onDeletar?.(duplaIndex)}
                    aria-label={`Excluir dupla — ${dupla.cabeceiroNome} & ${dupla.pezeiroNome}`}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={duplaParaDesmarcar !== null}
        title="Desfazer eliminação dessa dupla?"
        description="Os campos voltam a ficar editáveis normalmente."
        confirmLabel="Desfazer"
        onConfirm={handleConfirmarDesmarcarEliminada}
        onCancel={() => setDuplaParaDesmarcar(null)}
      />
    </div>
  );
}