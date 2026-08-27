import { useState } from "react";
import { Search, UserPlus } from "lucide-react";

export interface OpcaoBanco {
  id: number;
  nome: string;
  hc: number;
}

export interface AdicionarDoBancoProps {
  titulo: string;
  /** Já filtradas pela página — normalmente excluindo quem já está nessa prova */
  opcoes: OpcaoBanco[];
  onAdicionar: (idBanco: number) => void;
}

export default function AdicionarDoBanco({ titulo, opcoes, onAdicionar }: AdicionarDoBancoProps) {
  const [busca, setBusca] = useState("");

  const filtradas = opcoes.filter((o) =>
    o.nome.toLowerCase().includes(busca.trim().toLowerCase())
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Search size={15} />
        </span>
        <h2 className="font-bold text-slate-900">{titulo}</h2>
      </div>

      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar pelo nome..."
        className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />

      {opcoes.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          Ninguém disponível — ou o banco está vazio, ou todo mundo já está nessa prova.
        </p>
      ) : filtradas.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          Nenhum resultado pra "{busca}".
        </p>
      ) : (
        <ul className="max-h-64 divide-y divide-slate-50 overflow-y-auto">
          {filtradas.map((opcao) => (
            <li key={opcao.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{opcao.nome}</span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                  HC {opcao.hc.toFixed(1).replace(".", ",")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onAdicionar(opcao.id)}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-blue-500 px-2.5 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
              >
                <UserPlus size={13} />
                Adicionar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
