import { useEffect, useState } from "react";
import Avatar from "../ui/avatar";
import LiveBadge from "../ui/live-badge";

export interface DuplaPorPezeiroRow {
  numero: number;
  inscricao: number;
  cabeceiroIniciais: string;
  cabeceiroNome: string;
  hcCabeceiro: number;
  hcDupla: number;
  bois: number;
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

export interface DuplasPorPezeiroTableProps {
  pezeiroNome: string;
  hcPezeiro: number;
  duplas: DuplaPorPezeiroRow[];
  aoVivo?: boolean;
  /** Chamado sempre que um tempo ou o Boi Final é editado, já com os valores recalculados */
  onDuplasChange?: (duplas: DuplaPorPezeiroRow[]) => void;
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
function recalcularParcialEMedia(dupla: DuplaPorPezeiroRow): DuplaPorPezeiroRow {
  const temposValidos = dupla.tempos.filter((t): t is number => t !== null);

  const parcial = temposValidos.reduce((soma, t) => soma + t, 0);

  const valoresParaMedia = [...temposValidos, dupla.boiFinal];
  const media =
    valoresParaMedia.reduce((soma, t) => soma + t, 0) / valoresParaMedia.length;

  return { ...dupla, parcial, media };
}

export default function DuplasPorPezeiroTable({
  pezeiroNome,
  hcPezeiro,
  duplas: duplasIniciais,
  aoVivo = true,
  onDuplasChange,
}: DuplasPorPezeiroTableProps) {
  const [duplas, setDuplas] = useState<DuplaPorPezeiroRow[]>(duplasIniciais);

  // Guarda o texto exatamente como foi digitado em cada campo, pra não perder a vírgula/ponto ao reformatar.
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

  // Ressincroniza sempre que o array recebido via prop mudar de fato (pezeiro trocado, dupla nova formada).
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
            Duplas do Pezeiro:{" "}
            <span className="text-blue-600">{pezeiroNome}</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            HC Pezeiro:{" "}
            <span className="font-semibold text-blue-600">
              {hcPezeiro.toFixed(1).replace(".", ",")}
            </span>{" "}
            · {duplas.length} duplas
          </p>
        </div>
        {aoVivo && <LiveBadge />}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="border-collapse table-fixed text-sm" style={{ width: 1144 }}>
          <colgroup>
            <col style={{ width: 40 }} /> {/* # */}
            <col style={{ width: 64 }} /> {/* Inscrição */}
            <col style={{ width: 160 }} /> {/* Cabeceiro */}
            <col style={{ width: 70 }} /> {/* HC Cabeceiro */}
            <col style={{ width: 70 }} /> {/* HC Dupla */}
            <col style={{ width: 56 }} /> {/* Bois */}
            <col style={{ width: 64 }} /> {/* 1º Boi */}
            <col style={{ width: 64 }} /> {/* 2º Boi */}
            <col style={{ width: 64 }} /> {/* 3º Boi */}
            <col style={{ width: 64 }} /> {/* 4º Boi */}
            <col style={{ width: 64 }} /> {/* 5º Boi */}
            <col style={{ width: 64 }} /> {/* 6º Boi */}
            <col style={{ width: 70 }} /> {/* Parcial */}
            <col style={{ width: 70 }} /> {/* Boi Final */}
            <col style={{ width: 70 }} /> {/* Média */}
            <col style={{ width: 90 }} /> {/* Para Ganhar */}
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
                Cabeceiro
              </th>
              <th rowSpan={2} className="border-b border-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-500">
                HC Cabeceiro
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
                <td className="px-2 py-3 font-semibold text-slate-700">
                  {dupla.inscricao}
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar initials={dupla.cabeceiroIniciais} />
                    <span className="font-semibold text-slate-900">
                      {dupla.cabeceiroNome}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-3">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    {dupla.hcCabeceiro.toFixed(1).replace(".", ",")}
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
                        aria-label={`Tempo do ${tempoIndex + 1}º boi — ${dupla.cabeceiroNome}`}
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
                    aria-label={`Boi Final — ${dupla.cabeceiroNome}`}
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
