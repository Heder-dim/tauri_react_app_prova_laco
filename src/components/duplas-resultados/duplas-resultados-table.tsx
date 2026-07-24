import { useEffect, useState } from "react";
import { Dices } from "lucide-react";
import Avatar from "../ui/avatar";
import LiveBadge from "../ui/live-badge";

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
  /** Tempos do 1º ao 6º boi, em segundos. `null` = ainda não corrido. */
  tempos: (number | null)[];
  /** Calculado automaticamente a partir de `tempos` (soma) */
  parcial: number;
  /** Editável — campo independente, não é calculado a partir de `tempos` */
  boiFinal: number;
  /** Calculado automaticamente a partir de `tempos` + `boiFinal` */
  media: number;
  /** Ainda estático — depende da comparação com as outras duplas (regra de ranking não definida) */
  paraGanhar: number;
}

export interface DuplasResultadosTableProps {
  duplas: DuplaResultadoRow[];
  aoVivo?: boolean;
  /** Chamado sempre que um tempo ou o Boi Final é editado, já com os valores recalculados */
  onDuplasChange?: (duplas: DuplaResultadoRow[]) => void;
  /** Chamado quando o usuário confirma uma nova inscrição pra uma dupla (ao sair do campo ou apertar Enter) */
  onInscricaoChange?: (duplaIndex: number, novaInscricao: number) => void;
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

/** Recalcula Parcial (soma dos tempos 1-5) e Média (tempos 1-5 + Boi Final) */
function recalcularParcialEMedia(dupla: DuplaResultadoRow): DuplaResultadoRow {
  const temposValidos = dupla.tempos.filter((t): t is number => t !== null);

  const parcial = temposValidos.reduce((soma, t) => soma + t, 0);

  const valoresParaMedia = [...temposValidos, dupla.boiFinal];
  const media =
    valoresParaMedia.reduce((soma, t) => soma + t, 0) / valoresParaMedia.length;

  return { ...dupla, parcial, media };
}

export default function DuplasResultadosTable({
  duplas: duplasIniciais,
  aoVivo = true,
  onDuplasChange,
  onInscricaoChange,
}: DuplasResultadosTableProps) {
  const [duplas, setDuplas] = useState<DuplaResultadoRow[]>(duplasIniciais);

  // Guarda o texto exatamente como foi digitado em cada campo, pra não perder a vírgula/ponto ao reformatar.
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

  // Ressincroniza sempre que o array recebido via prop mudar de fato — necessário porque
  // o estado interno existe pra permitir edição local, mas não pode "ficar preso" nos dados
  // iniciais quando a página recarrega, sorteia inscrição, ou edita uma dupla.
  useEffect(() => {
    setDuplas(duplasIniciais);
    setRawInputs({});
  }, [duplasIniciais]);

  function handleTempoChange(duplaIndex: number, tempoIndex: number, rawValue: string) {
    setRawInputs((prev) => ({ ...prev, [`tempo-${duplaIndex}-${tempoIndex}`]: rawValue }));

    setDuplas((prev) => {
      const atualizado = prev.map((dupla, i) => {
        if (i !== duplaIndex) return dupla;

        const novosTempos = [...dupla.tempos];
        novosTempos[tempoIndex] = parseTempoInput(rawValue);

        return recalcularParcialEMedia({ ...dupla, tempos: novosTempos });
      });

      onDuplasChange?.(atualizado);
      return atualizado;
    });
  }

  function handleBoiFinalChange(duplaIndex: number, rawValue: string) {
    setRawInputs((prev) => ({ ...prev, [`boiFinal-${duplaIndex}`]: rawValue }));

    setDuplas((prev) => {
      const atualizado = prev.map((dupla, i) => {
        if (i !== duplaIndex) return dupla;
        const novoBoiFinal = parseTempoInput(rawValue) ?? 0;
        return recalcularParcialEMedia({ ...dupla, boiFinal: novoBoiFinal });
      });

      onDuplasChange?.(atualizado);
      return atualizado;
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

  function tempoInputValue(duplaIndex: number, tempoIndex: number, tempo: number | null) {
    const raw = rawInputs[`tempo-${duplaIndex}-${tempoIndex}`];
    if (raw !== undefined) return raw;
    return tempo !== null ? tempo.toString().replace(".", ",") : "";
  }

  function boiFinalInputValue(duplaIndex: number, boiFinal: number) {
    const raw = rawInputs[`boiFinal-${duplaIndex}`];
    if (raw !== undefined) return raw;
    return boiFinal.toString().replace(".", ",");
  }

  function inscricaoInputValue(duplaIndex: number, inscricao: number) {
    const raw = rawInputs[`inscricao-${duplaIndex}`];
    if (raw !== undefined) return raw;
    return String(inscricao);
  }

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
      <div className="overflow-x-auto">
        <table className="border-collapse table-fixed text-sm" style={{ width: 1244 }}>
          {/* Larguras: # / Bateria / Inscrição / Cabeceiro / HC Cabeceiro / Pezeiro / HC Pez. / HC Dupla / Bois / 1º-6º Boi / Parcial / Boi Final / Média / Para Ganhar */}
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 56 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 90 }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                #
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Bateria
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Inscrição
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Cabeceiro
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                HC Cabeceiro
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Pezeiro
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                HC Pez.
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                HC Dupla
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Bois
              </th>
              <th colSpan={6} className="border-b border-slate-100 bg-slate-50 px-2 py-1.5 text-center text-xs font-semibold text-slate-500">
                Tempo de Cada Boi (seg.)
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Parcial
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Boi Final
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Média
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Para Ganhar
              </th>
            </tr>
            <tr>
              {["1º Boi", "2º Boi", "3º Boi", "4º Boi", "5º Boi", "6º Boi"].map((label) => (
                <th
                  key={label}
                  className="border-b border-slate-100 bg-slate-50 px-2 py-1.5 text-center text-xs font-medium text-slate-400"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {duplas.map((dupla, duplaIndex) => (
              <tr key={dupla.numero} className="border-b border-slate-50 last:border-0">
                <td className="px-2 py-3 text-slate-400">
                  {String(dupla.numero).padStart(2, "0")}
                </td>
                <td className="px-2 py-3">
                  {dupla.numeroBateria !== null ? (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {dupla.numeroBateria}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">–</span>
                  )}
                </td>
                <td className="box-border px-1 py-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inscricaoInputValue(duplaIndex, dupla.inscricao)}
                    aria-label={`Inscrição — ${dupla.cabeceiroNome} & ${dupla.pezeiroNome}`}
                    onChange={(e) => handleInscricaoInputChange(duplaIndex, e.target.value)}
                    onBlur={() => handleInscricaoCommit(duplaIndex)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="box-border w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-center font-semibold text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </td>
                <td className="px-2 py-3">
                  <span className="font-semibold text-blue-600">{dupla.cabeceiroNome}</span>
                </td>
                <td className="px-2 py-3">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    {dupla.hcCabeceiro.toFixed(1).replace(".", ",")}
                  </span>
                </td>
                <td className="px-2 py-3">
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
                <td className="px-2 py-3">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    {dupla.hcPez.toFixed(1).replace(".", ",")}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-600">
                    {dupla.hcDupla.toFixed(1).replace(".", ",")}
                  </span>
                </td>
                <td className="px-2 py-3 text-slate-700">{dupla.bois}</td>

                {/* Tempos editáveis — só habilitados até a quantidade de bois da dupla */}
                {dupla.tempos.map((tempo, tempoIndex) => {
                  const habilitado = tempoIndex < dupla.bois;
                  return (
                    <td key={tempoIndex} className="box-border px-1 py-2 text-center">
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
                            ? "hover:bg-slate-50 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
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

                <td className="px-2 py-3 text-slate-700">
                  {formatTempo(dupla.parcial)}
                </td>

                {/* Boi Final — editável, independente dos tempos */}
                <td className="box-border px-1 py-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={boiFinalInputValue(duplaIndex, dupla.boiFinal)}
                    aria-label={`Boi Final — ${dupla.pezeiroNome}`}
                    onChange={(e) => handleBoiFinalChange(duplaIndex, e.target.value)}
                    className="box-border w-full rounded-md border border-transparent bg-green-50 px-1.5 py-1 text-center font-semibold text-green-600 outline-none transition-colors hover:bg-green-100 focus:border-green-300 focus:bg-white focus:ring-2 focus:ring-green-100"
                  />
                </td>

                <td className="px-2 py-3 text-slate-700">
                  {formatTempo(dupla.media)}
                </td>
                <td className="px-2 py-3">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {formatTempo(dupla.paraGanhar)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}