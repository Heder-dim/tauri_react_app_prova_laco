import { Calendar, Trash2, ArrowRight } from "lucide-react";

export interface Prova {
  id: string;
  nome: string;
  data: string; // ISO (YYYY-MM-DD)
}

export interface ProvaCardProps {
  prova: Prova;
  onAcessar: (id: string) => void;
  onDeletar: (id: string) => void;
}

/** Formata "YYYY-MM-DD" como "05 de julho de 2026", sem problema de fuso horário */
function formatarData(dataIso: string) {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

export default function ProvaCard({ prova, onAcessar, onDeletar }: ProvaCardProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Calendar size={17} />
        </span>
        <h3 className="font-bold text-slate-900">{prova.nome}</h3>
      </div>
      <p className="mb-5 pl-11 text-xs text-slate-500">{formatarData(prova.data)}</p>

      <div className="mt-auto flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Excluir ${prova.nome}`}
          onClick={() => onDeletar(prova.id)}
          className="flex items-center cursor-pointer justify-center rounded-xl border border-slate-200 p-2.5 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => onAcessar(prova.id)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700"
        >
          Acessar
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
