import { useState, type FormEvent } from "react";
import { CalendarPlus } from "lucide-react";

export interface NovaProva {
  nome: string;
  data: string; // formato ISO (YYYY-MM-DD), vindo do <input type="date">
}

export interface ProvaFormProps {
  onAdd: (prova: NovaProva) => void;
}

export default function ProvaForm({ onAdd }: ProvaFormProps) {
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nomeAparado = nome.trim();

    if (!nomeAparado) {
      setErro("Informe o nome da prova.");
      return;
    }
    if (!data) {
      setErro("Informe a data da prova.");
      return;
    }

    onAdd({ nome: nomeAparado, data });
    setNome("");
    setData("");
    setErro(null);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <CalendarPlus size={15} />
        </span>
        <h2 className="font-bold text-slate-900">Criar Prova</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="prova-nome" className="mb-1.5 block text-xs text-slate-500">
            Nome
          </label>
          <input
            id="prova-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: 1ª Prova de Laço"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="sm:w-48">
          <label htmlFor="prova-data" className="mb-1.5 block text-xs text-slate-500">
            Data
          </label>
          <input
            id="prova-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700"
        >
          <CalendarPlus size={16} />
          Criar Prova
        </button>
      </form>

      {erro && <p className="mt-2.5 text-xs font-medium text-red-500">{erro}</p>}
    </div>
  );
}
