import { FileDown, ListChecks, X } from "lucide-react";

export interface ExportarPdfModalProps {
  open: boolean;
  onExportarTodas: () => void;
  onExportarComTempo: () => void;
  onClose: () => void;
}

export default function ExportarPdfModal({
  open,
  onExportarTodas,
  onExportarComTempo,
  onClose,
}: ExportarPdfModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <FileDown size={15} />
            </span>
            <h2 className="font-bold text-slate-900">Exportar PDF</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 cursor-pointer text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 p-5">
          <button
            type="button"
            onClick={onExportarTodas}
            className="flex items-center gap-3 cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FileDown size={16} className="shrink-0 text-blue-600" />
            <span>
              Exportar todas as inscrições
              <span className="block text-xs font-normal text-slate-400">
                Todas as duplas da prova, na ordem de inscrição
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onExportarComTempo}
            className="flex items-center gap-3 cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ListChecks size={16} className="shrink-0 text-blue-600" />
            <span>
              Exportar só com tempo registrado
              <span className="block text-xs font-normal text-slate-400">
                Só quem já correu, ordenado da melhor pra pior média
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-1 rounded-xl px-4 py-2.5 cursor-pointer text-center text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
