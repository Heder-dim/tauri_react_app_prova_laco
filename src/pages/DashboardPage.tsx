import { ChevronDown, Download, Dices, UserPlus, BarChart3 } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import StepBadge from "../components/ui/step-badge";
import StatBox from "../components/ui/stat-box";
import DuplasTable, { type DuplaRow } from "../components/dashboard/duplas-table";
// import RegraBoisPanel from "../components/dashboard/regra-bois-panel";

// Dados de exemplo — substituir pela consulta real (SQLite) quando a lógica for implementada
const DUPLAS_EXEMPLO: DuplaRow[] = [
  {
    numero: 1,
    pezeiroIniciais: "CM",
    pezeiroNome: "Carlos Mendes",
    hcPez: 2.5,
    hcDupla: 4.5,
    bois: 2,
    tempos: [9.234, 8.876, null, null, null],
    parcial: 18.11,
    boiFinal: 8.876,
    media: 9.234,
    paraGanhar: 6.986,
  },
  {
    numero: 2,
    pezeiroIniciais: "RL",
    pezeiroNome: "Rafael Lima",
    hcPez: 3.0,
    hcDupla: 5.0,
    bois: 2,
    tempos: [10.123, 9.876, null, null, null],
    parcial: 19.999,
    boiFinal: 9.876,
    media: 10.123,
    paraGanhar: 6.986,
  },
  {
    numero: 3,
    pezeiroIniciais: "MS",
    pezeiroNome: "Marcos Souza",
    hcPez: 2.0,
    hcDupla: 4.0,
    bois: 1,
    tempos: [8.543, null, null, null, null],
    parcial: 8.543,
    boiFinal: 8.543,
    media: 8.543,
    paraGanhar: 6.986,
  },
];

export default function DashboardPage() {
  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Dashboard"
        subtitle="Selecione um cabeceiro para montar as duplas com todos os pezeiros"
        action={
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700">
            <Download size={16} />
            Exportar PDF
          </button>
        }
      />

      <div className="space-y-5 p-6 lg:p-10">
        {/* Linha 1 — Seleção de cabeceiro / dupla / resumo */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Card 1 — Selecionar Cabeceiro */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <StepBadge>1</StepBadge>
              <h2 className="font-bold text-slate-900">Selecionar Cabeceiro</h2>
            </div>

            <p className="mb-2 text-xs text-slate-500">Cabeceiro ativo</p>
            <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  JV
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  João Vaqueiro
                </span>
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                  HC 2,0
                </span>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Card 2 — Escolher Dupla */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <StepBadge>2</StepBadge>
              <h2 className="font-bold text-slate-900">Escolher Dupla</h2>
            </div>

            <p className="mb-3 text-xs text-slate-500">
              Selecione manualmente ou sorteie
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50">
                <UserPlus size={16} />
                Selecionar Pezeiro
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700">
                <Dices size={16} />
                Sortear Duplas
              </button>
            </div>
          </div>

          {/* Card 3 — Resumo do Cabeceiro */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <BarChart3 size={15} />
              </span>
              <h2 className="font-bold text-slate-900">Resumo do Cabeceiro</h2>
            </div>

            <div className="flex gap-2.5">
              <StatBox value={10} label="Pezeiros" tone="blue" />
              <StatBox value={10} label="Duplas" tone="purple" />
              <StatBox value={40} label="Total Bois" tone="green" />
            </div>
          </div>
        </div>

        {/* Linha 2 — Tabela de duplas + regra de bois */}
        <div className="flex flex-col gap-5 lg:flex-row">
          <DuplasTable
            cabeceiroNome="João Vaqueiro"
            hcCabeceiro={2.0}
            duplas={DUPLAS_EXEMPLO}
          />
          {/* <RegraBoisPanel /> */}
        </div>
      </div>
    </div>
  );
}