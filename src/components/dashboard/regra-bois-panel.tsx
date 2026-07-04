import { Target } from "lucide-react";

export interface RegraBoi {
  faixa: string;
  regra: string;
}

const DEFAULT_REGRAS: RegraBoi[] = [
  { faixa: "HC 2,0 a 3,3", regra: "1 boi + 1 final" },
  { faixa: "HC 3,4 a 5,5", regra: "2 bois + 1 final" },
  { faixa: "HC 5,6 a 7,5", regra: "3 bois + 1 final" },
  { faixa: "HC 7,6 a 9,5", regra: "4 bois + 1 final" },
  { faixa: "HC 9,6 a 11,5", regra: "5 bois + 1 final" },
  { faixa: "HC 12,0 a 14,5", regra: "6 bois + 1 final" },
];

export interface RegraBoisPanelProps {
  regras?: RegraBoi[];
}

export default function RegraBoisPanel({ regras = DEFAULT_REGRAS }: RegraBoisPanelProps) {
  return (
    <div className="w-full shrink-0 rounded-2xl bg-white p-5 shadow-sm lg:w-80">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Target size={15} />
        </span>
        <h2 className="font-bold text-slate-900">Regra de Qtd. de Bois</h2>
      </div>

      <ul className="space-y-2">
        {regras.map(({ faixa, regra }) => (
          <li
            key={faixa}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
          >
            <span className="text-sm font-semibold text-slate-800">{faixa}</span>
            <span className="text-xs font-medium text-slate-500">{regra}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
