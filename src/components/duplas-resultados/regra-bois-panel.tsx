import { useState } from "react";
import { Target } from "lucide-react";
import type { RegraBoi } from "../dashboard/regra-bois-panel";

const DEFAULT_REGRAS: RegraBoi[] = [
  { faixa: "HC 2,0 a 3,3", regra: "1 boi + 1 final" },
  { faixa: "HC 3,4 a 5,5", regra: "2 bois + 1 final" },
  { faixa: "HC 5,6 a 7,5", regra: "3 bois + 1 final" },
  { faixa: "HC 7,6 a 9,5", regra: "4 bois + 1 final" },
  { faixa: "HC 9,6 a 11,5", regra: "5 bois + 1 final" },
  { faixa: "HC 12,0 a 14,5", regra: "6 bois + 1 final" },
];

export interface RegraBoisPanelEditavelProps {
  regras?: RegraBoi[];
  /** Chamado sempre que uma faixa é editada, já com a lista atualizada */
  onChange?: (regras: RegraBoi[]) => void;
}

export default function RegraBoisPanelEditavel({
  regras: regrasIniciais = DEFAULT_REGRAS,
  onChange,
}: RegraBoisPanelEditavelProps) {
  const [regras, setRegras] = useState<RegraBoi[]>(regrasIniciais);

  function handleFaixaChange(index: number, valor: string) {
    setRegras((prev) => {
      const atualizado = prev.map((regra, i) =>
        i === index ? { ...regra, faixa: valor } : regra
      );
      onChange?.(atualizado);
      return atualizado;
    });
  }

  return (
    <div className="w-full shrink-0 rounded-2xl bg-white p-5 shadow-sm lg:w-80">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Target size={15} />
        </span>
        <h2 className="font-bold text-slate-900">Regra de Qtd. de Bois</h2>
      </div>

      <ul className="space-y-2">
        {regras.map((regra, index) => (
          <li
            key={index}
            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1.5"
          >
            <input
              type="text"
              value={regra.faixa}
              onChange={(e) => handleFaixaChange(index, e.target.value)}
              aria-label={`Faixa da regra ${index + 1}`}
              className="w-32 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-semibold text-slate-800 outline-none transition-colors hover:bg-white focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <span className="whitespace-nowrap px-1 text-xs font-medium text-slate-500">
              {regra.regra}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
