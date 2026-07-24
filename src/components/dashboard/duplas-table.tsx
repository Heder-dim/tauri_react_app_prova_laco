import { useEffect, useRef, useState } from "react";
import { Dices, Trash2 } from "lucide-react";
import Avatar from "../ui/avatar";
import LiveBadge from "../ui/live-badge";

export interface DuplaRow {
  numero: number;
  inscricao: number;
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
  /** Editável — campo independente, não é mais calculado a partir de `tempos` */
  boiFinal: number;
  /** Calculado automaticamente a partir de `tempos` */
  media: number;
  /** Ainda estático — depende da comparação com as outras duplas (regra de ranking não definida) */
  paraGanhar: number;
}

export interface DuplasTableProps {
  cabeceiroNome: string;
  hcCabeceiro: number;
  duplas: DuplaRow[];
  aoVivo?: boolean;
  /** Chamado sempre que um tempo ou o Boi Final é editado, já com os valores recalculados */
  onDuplasChange?: (duplas: DuplaRow[]) => void;
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

/** Recalcula Parcial (soma dos tempos 1-5) e Média (tempos 1-5 + Boi Final) */
function recalcularParcialEMedia(dupla: DuplaRow): DuplaRow {
  const temposValidos = dupla.tempos.filter((t): t is number => t !== null);

  const parcial = temposValidos.reduce((soma, t) => soma + t, 0);

  const valoresParaMedia = [...temposValidos, dupla.boiFinal];
  const media =
    valoresParaMedia.reduce((soma, t) => soma + t, 0) / valoresParaMedia.length;

  return { ...dupla, parcial, media };
}

export default function DuplasTable({
  cabeceiroNome,
  hcCabeceiro,
  duplas: duplasIniciais,
  aoVivo = true,
  onDuplasChange,
  onDeletar,
}: DuplasTableProps) {
  const [duplas, setDuplas] = useState<DuplaRow[]>(duplasIniciais);

  // Guarda o texto exatamente como foi digitado em cada campo (chave: "tempo-<duplaIndex>-<tempoIndex>" ou "boiFinal-<duplaIndex>"),
  // pra não perder a vírgula/ponto ao reformatar o número a cada tecla.
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

  // Marca que a próxima mudança de prop é só o "eco" de uma edição que a própria tabela acabou
  // de mandar pra página (via onDuplasChange) — nesse caso NÃO deve resetar rawInputs, senão
  // qualquer tecla digitada (vírgula, ponto, zero à esquerda) seria apagada assim que a página
  // devolvesse o valor recalculado.
  const ecoDaPropriaEdicaoRef = useRef(false);

  // Ressincroniza sempre que o array recebido via prop mudar de fato — necessário porque
  // o estado interno existe pra permitir edição local, mas não pode "ficar preso" nos dados
  // iniciais quando o cabeceiro selecionado muda ou uma nova dupla é formada na página — MAS
  // só quando a mudança vem de fora (não é eco da nossa própria digitação).
  useEffect(() => {
    if (ecoDaPropriaEdicaoRef.current) {
      ecoDaPropriaEdicaoRef.current = false;
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

        const novosTempos = [...dupla.tempos];
        novosTempos[tempoIndex] = parseTempoInput(rawValue);

        // Editar um tempo recalcula Parcial (tempos 1-5) e Média (tempos 1-5 + Boi Final)
        return recalcularParcialEMedia({ ...dupla, tempos: novosTempos });
      });

      ecoDaPropriaEdicaoRef.current = true;
      onDuplasChange?.(atualizado);
      return atualizado;
    });
  }

  /** Edição do Boi Final — campo independente dos tempos, mas entra no cálculo da Média */
  function handleBoiFinalChange(duplaIndex: number, rawValue: string) {
    setRawInputs((prev) => ({ ...prev, [`boiFinal-${duplaIndex}`]: rawValue }));

    setDuplas((prev) => {
      const atualizado = prev.map((dupla, i) => {
        if (i !== duplaIndex) return dupla;
        const novoBoiFinal = parseTempoInput(rawValue) ?? 0;
        return recalcularParcialEMedia({ ...dupla, boiFinal: novoBoiFinal });
      });

      ecoDaPropriaEdicaoRef.current = true;
      onDuplasChange?.(atualizado);
      return atualizado;
    });
  }

  /** Valor mostrado no input: prioriza o texto bruto digitado; cai pro valor formatado quando ainda não foi mexido */
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

  return (
    <div className="min-w-0 flex-1 rounded-2xl bg-white p-5 shadow-sm">
      {/* Cabeçalho do card */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900">
            Duplas do Cabeceiro:{" "}
            <span className="text-blue-600">{cabeceiroNome}</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            HC Cabeceiro:{" "}
            <span className="font-semibold text-blue-600">
              {hcCabeceiro.toFixed(1).replace(".", ",")}
            </span>{" "}
            · {duplas.length} duplas
          </p>
        </div>
        {aoVivo && <LiveBadge />}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="border-collapse table-fixed text-sm" style={{ width: 1194 }}>
          {/* Larguras: # / Inscrição / Pezeiro / HC Pez. / HC Dupla / Bois / 1º-6º Boi / Parcial / Boi Final / Média / Para Ganhar / Ações */}
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 160 }} />
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
            <col style={{ width: 50 }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                #
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                Inscrição
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
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                <span className="sr-only">Ações</span>
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
                <td className="px-2 py-3 font-semibold text-slate-700">
                  {dupla.inscricao}
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

                {/* Boi Final — editável */}
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
                <td className="px-2 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onDeletar?.(duplaIndex)}
                    aria-label={`Excluir dupla — ${dupla.pezeiroNome}`}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}