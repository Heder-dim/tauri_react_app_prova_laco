import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";

export interface NovoPezeiro {
  nome: string;
  hc: number;
}

export interface PezeiroFormProps {
  onAdd: (pezeiro: NovoPezeiro) => void;
}

/** Converte texto (aceita vírgula ou ponto) em número, ou null se vazio/inválido */
function parseHcInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

export default function PezeiroForm({ onAdd }: PezeiroFormProps) {
  const [nome, setNome] = useState("");
  const [hcTexto, setHcTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nomeAparado = nome.trim();
    const hc = parseHcInput(hcTexto);

    if (!nomeAparado) {
      setErro("Informe o nome do pezeiro.");
      return;
    }
    if (hc === null) {
      setErro("Informe um H.C. válido.");
      return;
    }

    onAdd({ nome: nomeAparado, hc });
    setNome("");
    setHcTexto("");
    setErro(null);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <UserPlus size={15} />
        </span>
        <h2 className="font-bold text-slate-900">Cadastrar Pezeiro</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="pezeiro-nome" className="mb-1.5 block text-xs text-slate-500">
            Nome
          </label>
          <input
            id="pezeiro-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Carlos Mendes"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="sm:w-32">
          <label htmlFor="pezeiro-hc" className="mb-1.5 block text-xs text-slate-500">
            H.C.
          </label>
          <input
            id="pezeiro-hc"
            type="text"
            inputMode="decimal"
            value={hcTexto}
            onChange={(e) => setHcTexto(e.target.value)}
            placeholder="Ex: 2,5"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700"
        >
          <UserPlus size={16} />
          Cadastrar
        </button>
      </form>

      {erro && <p className="mt-2.5 text-xs font-medium text-red-500">{erro}</p>}
    </div>
  );
}
