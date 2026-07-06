import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Avatar from "../ui/avatar";

export interface CabeceiroOption {
  id: number;
  nome: string;
  hc: number;
}

export interface CabeceiroSelectProps {
  cabeceiros: CabeceiroOption[];
  selecionadoId: number | null;
  onSelect: (id: number) => void;
}

function iniciaisDoNome(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export default function CabeceiroSelect({
  cabeceiros,
  selecionadoId,
  onSelect,
}: CabeceiroSelectProps) {
  const [aberto, setAberto] = useState(false);
  const selecionado = cabeceiros.find((c) => c.id === selecionadoId) ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
      >
        {selecionado ? (
          <div className="flex items-center gap-2.5">
            <Avatar initials={iniciaisDoNome(selecionado.nome)} />
            <span className="text-sm font-semibold text-slate-900">
              {selecionado.nome}
            </span>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
              HC {selecionado.hc.toFixed(1).replace(".", ",")}
            </span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">Selecione um cabeceiro</span>
        )}
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <>
          {/* Fecha o dropdown ao clicar fora */}
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <ul className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {cabeceiros.length === 0 && (
              <li className="px-2.5 py-2 text-sm text-slate-400">
                Nenhum cabeceiro cadastrado
              </li>
            )}
            {cabeceiros.map((cabeceiro) => (
              <li key={cabeceiro.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(cabeceiro.id);
                    setAberto(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50 ${
                    cabeceiro.id === selecionadoId ? "bg-blue-50" : ""
                  }`}
                >
                  <Avatar initials={iniciaisDoNome(cabeceiro.nome)} />
                  <span className="text-sm font-semibold text-slate-900">
                    {cabeceiro.nome}
                  </span>
                  <span className="ml-auto rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    HC {cabeceiro.hc.toFixed(1).replace(".", ",")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}