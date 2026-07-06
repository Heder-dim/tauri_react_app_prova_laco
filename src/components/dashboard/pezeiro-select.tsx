import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Avatar from "../ui/avatar";

export interface PezeiroOption {
  id: number;
  nome: string;
  hc: number;
  iniciais: string;
}

export interface PezeiroSelectProps {
  pezeiros: PezeiroOption[];
  selecionadoId: number | null;
  onSelect: (id: number) => void;
}

export default function PezeiroSelect({
  pezeiros,
  selecionadoId,
  onSelect,
}: PezeiroSelectProps) {
  const [aberto, setAberto] = useState(false);
  const selecionado = pezeiros.find((p) => p.id === selecionadoId) ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
      >
        {selecionado ? (
          <div className="flex items-center gap-2.5">
            <Avatar initials={selecionado.iniciais} />
            <span className="text-sm font-semibold text-slate-900">
              {selecionado.nome}
            </span>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
              HC {selecionado.hc.toFixed(1).replace(".", ",")}
            </span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">
            {pezeiros.length === 0 ? "Nenhum pezeiro disponível" : "Selecione um pezeiro"}
          </span>
        )}
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <ul className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {pezeiros.length === 0 && (
              <li className="px-2.5 py-2 text-sm text-slate-400">
                Todos os pezeiros já foram pareados com esse cabeceiro
              </li>
            )}
            {pezeiros.map((pezeiro) => (
              <li key={pezeiro.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(pezeiro.id);
                    setAberto(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50 ${
                    pezeiro.id === selecionadoId ? "bg-blue-50" : ""
                  }`}
                >
                  <Avatar initials={pezeiro.iniciais} />
                  <span className="text-sm font-semibold text-slate-900">
                    {pezeiro.nome}
                  </span>
                  <span className="ml-auto rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    HC {pezeiro.hc.toFixed(1).replace(".", ",")}
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
