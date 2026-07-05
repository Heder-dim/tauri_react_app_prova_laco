import { Download } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import DuplasResultadosTable, {
  type DuplaResultadoRow,
} from "../components/duplas-resultados/duplas-resultados-table";
import RegraBoisPanelEditavel from "../components/duplas-resultados/regra-bois-panel";

// Dados de exemplo — substituir pela consulta real (SQLite) quando a lógica for implementada
const DUPLAS_EXEMPLO: DuplaResultadoRow[] = [
  {
    numero: 1,
    cabeceiroNome: "João Vaqueiro",
    hcCabeceiro: 2.0,
    pezeiroIniciais: "CM",
    pezeiroNome: "Carlos Mendes",
    hcPez: 2.5,
    hcDupla: 4.5,
    bois: 2,
    tempos: [9.234, 8.876, null, null, null],
    parcial: 18.11,
    boiFinal: 8.876,
    media: 9.056,
    paraGanhar: 6.986,
  },
  {
    numero: 2,
    cabeceiroNome: "João Vaqueiro",
    hcCabeceiro: 2.0,
    pezeiroIniciais: "RL",
    pezeiroNome: "Rafael Lima",
    hcPez: 3.0,
    hcDupla: 5.0,
    bois: 2,
    tempos: [10.123, 9.876, null, null, null],
    parcial: 19.999,
    boiFinal: 9.876,
    media: 9.999,
    paraGanhar: 6.986,
  },
  {
    numero: 3,
    cabeceiroNome: "Pedro Alves",
    hcCabeceiro: 3.5,
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

export default function DuplasResultadosPage() {
  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Duplas e Resultados"
        subtitle="Todas as duplas registradas, de todos os cabeceiros"
        action={
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700">
            <Download size={16} />
            Exportar PDF
          </button>
        }
      />

      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:p-10">
        <DuplasResultadosTable duplas={DUPLAS_EXEMPLO} />
        <RegraBoisPanelEditavel />
      </div>
    </div>
  );
}
