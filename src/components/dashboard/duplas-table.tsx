import { useState } from "react";
import Avatar from "../ui/avatar";
import LiveBadge from "../ui/live-badge";

export interface DuplaRow {
  numero: number;
  pezeiroIniciais: string;
  pezeiroNome: string;
  hcPez: number;
  hcDupla: number;
  bois: number;
  /** Tempos do 1º ao 5º boi, em segundos. `null` = ainda não corrido. */
  tempos: (number | null)[];
  /** Calculado automaticamente a partir de `tempos` (soma) */
  parcial: number;
  /** Editável — inicialmente calculado a partir de `tempos` (último tempo preenchido), mas pode ser sobrescrito manualmente */
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

/** Recalcula Parcial, Média e Boi Final (auto) a partir dos tempos da dupla */
function recalcularDeTempos(dupla: DuplaRow): DuplaRow {
  const temposValidos = dupla.tempos.filter((t): t is number => t !== null);

  const parcial = temposValidos.reduce((soma, t) => soma + t, 0);
  const media = temposValidos.length > 0 ? parcial / temposValidos.length : 0;

  let boiFinal = 0;
  for (let i = dupla.tempos.length - 1; i >= 0; i--) {
    if (dupla.tempos[i] !== null) {
      boiFinal = dupla.tempos[i] as number;
      break;
    }
  }

  return { ...dupla, parcial, media, boiFinal };
}

export default function DuplasTable({
  cabeceiroNome,
  hcCabeceiro,
  duplas: duplasIniciais,
  aoVivo = true,
  onDuplasChange,
}: DuplasTableProps) {
  const [duplas, setDuplas] = useState<DuplaRow[]>(duplasIniciais);

  function handleTempoChange(duplaIndex: number, tempoIndex: number, rawValue: string) {
    setDuplas((prev) => {
      const atualizado = prev.map((dupla, i) => {
        if (i !== duplaIndex) return dupla;

        const novosTempos = [...dupla.tempos];
        novosTempos[tempoIndex] = parseTempoInput(rawValue);

        // Editar um tempo recalcula Parcial, Média e Boi Final automaticamente
        return recalcularDeTempos({ ...dupla, tempos: novosTempos });
      });

      onDuplasChange?.(atualizado);
      return atualizado;
    });
  }

  /** Edição manual do Boi Final — sobrescreve o valor calculado, sem mexer em Parcial/Média */
  function handleBoiFinalChange(duplaIndex: number, rawValue: string) {
    setDuplas((prev) => {
      const atualizado = prev.map((dupla, i) => {
        if (i !== duplaIndex) return dupla;
        return { ...dupla, boiFinal: parseTempoInput(rawValue) ?? 0 };
      });

      onDuplasChange?.(atualizado);
      return atualizado;
    });
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
        <table className="border-collapse table-fixed text-sm" style={{ width: 1016 }}>
          <colgroup>
            <col style={{ width: 40 }} /> {/* # */}
            <col style={{ width: 160 }} /> {/* Pezeiro */}
            <col style={{ width: 70 }} /> {/* HC Pez. */}
            <col style={{ width: 70 }} /> {/* HC Dupla */}
            <col style={{ width: 56 }} /> {/* Bois */}
            <col style={{ width: 64 }} /> {/* 1º Boi */}
            <col style={{ width: 64 }} /> {/* 2º Boi */}
            <col style={{ width: 64 }} /> {/* 3º Boi */}
            <col style={{ width: 64 }} /> {/* 4º Boi */}
            <col style={{ width: 64 }} /> {/* 5º Boi */}
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
              <th colSpan={5} className="border-b border-slate-100 bg-slate-50 px-2 py-1.5 text-center text-xs font-semibold text-slate-500">
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
              {["1º Boi", "2º Boi", "3º Boi", "4º Boi", "5º Boi"].map((label) => (
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
                  <div className="flex items-center gap-2">
                    <Avatar initials={dupla.pezeiroIniciais} />
                    <span className="font-semibold text-slate-900">
                      {dupla.pezeiroNome}
                    </span>
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

                {/* Tempos editáveis */}
                {dupla.tempos.map((tempo, tempoIndex) => (
                  <td key={tempoIndex} className="box-border px-1 py-2 text-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={tempo !== null ? tempo.toString().replace(".", ",") : ""}
                      placeholder="–"
                      aria-label={`Tempo do ${tempoIndex + 1}º boi — ${dupla.pezeiroNome}`}
                      onChange={(e) => handleTempoChange(duplaIndex, tempoIndex, e.target.value)}
                      className={`box-border w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-center outline-none transition-colors placeholder:text-slate-300 hover:bg-slate-50 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 ${
                        tempoIndex === 1 && tempo !== null
                          ? "font-semibold text-green-600"
                          : "text-slate-700"
                      }`}
                    />
                  </td>
                ))}

                <td className="px-2 py-3 text-slate-700">
                  {formatTempo(dupla.parcial)}
                </td>

                {/* Boi Final — editável */}
                <td className="box-border px-1 py-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={dupla.boiFinal.toString().replace(".", ",")}
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