import { Trophy } from "lucide-react";
import Avatar from "../ui/avatar";

export interface LiderProva {
  cabeceiroNome: string;
  pezeiroNome: string;
  pezeiroIniciais: string;
  media: number;
  inscricao: number;
}

export interface LiderProvaCardProps {
  lider: LiderProva | null;
}

function formatTempo(valor: number) {
  return valor.toFixed(3).replace(".", ",");
}

export default function LiderProvaCard({ lider }: LiderProvaCardProps) {
  return (
    <div className="w-full shrink-0 rounded-2xl bg-white p-5 shadow-sm lg:w-80">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Trophy size={15} />
        </span>
        <h2 className="font-bold text-slate-900">Líder da Prova</h2>
      </div>

      {lider === null ? (
        <p className="text-sm text-slate-400">
          Nenhuma dupla com resultado registrado ainda.
        </p>
      ) : (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
          <Avatar initials={lider.pezeiroIniciais} size="md" tone="amber" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {lider.cabeceiroNome} <span className="text-slate-400">&</span> {lider.pezeiroNome}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Inscrição {lider.inscricao} · Média{" "}
              <span className="font-semibold text-amber-600">{formatTempo(lider.media)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
