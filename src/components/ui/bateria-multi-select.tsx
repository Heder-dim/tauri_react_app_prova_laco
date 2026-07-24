import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface BateriaMultiSelectProps {
  /** Baterias que o competidor pertence atualmente */
  baterias: number[];
  /** Quantas baterias a prova tem no total (provas.bateria_nu) */
  totalBaterias: number;
  onChange: (novasBaterias: number[]) => void;
  /** Nome do competidor, só pra acessibilidade (aria-label) */
  nomeCompetidor: string;
}

export default function BateriaMultiSelect({
  baterias,
  totalBaterias,
  onChange,
  nomeCompetidor,
}: BateriaMultiSelectProps) {
  const [aberto, setAberto] = useState(false);

  function toggleBateria(n: number) {
    const novas = baterias.includes(n)
      ? baterias.filter((b) => b !== n)
      : [...baterias, n].sort((a, b) => a - b);
    onChange(novas);
  }

  const resumo = baterias.length === 0 ? "Sem bateria" : baterias.join(", ");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        aria-label={`Baterias de ${nomeCompetidor}`}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
      >
        {resumo}
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <>
          {/* Fecha o popover ao clicar fora */}
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 z-20 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Baterias
            </p>
            <ul className="space-y-0.5">
              {Array.from({ length: totalBaterias }, (_, i) => i + 1).map((n) => (
                <li key={n}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={baterias.includes(n)}
                      onChange={() => toggleBateria(n)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                    Bateria {n}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
