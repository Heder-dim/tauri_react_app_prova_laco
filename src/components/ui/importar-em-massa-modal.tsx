import { useState } from "react";
import { X, ClipboardPaste } from "lucide-react";

export interface LinhaImportada {
  nome: string;
  hc: number;
}

interface LinhaEditavel {
  nomeTexto: string;
  hcTexto: string;
}

export interface ImportarEmMassaModalProps {
  open: boolean;
  titulo: string;
  /** Recebe as linhas já validadas (nome preenchido, HC numérico) e faz a criação de fato */
  onImportar: (linhas: LinhaImportada[]) => Promise<void>;
  onClose: () => void;
}

function parseHc(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

/** Separa o texto colado (do Excel: colunas separadas por tab) em linhas de nome + HC */
function parseTextoColado(texto: string): LinhaEditavel[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0)
    .map((linha) => {
      const partes = linha.split("\t");
      if (partes.length >= 2) {
        return { nomeTexto: partes[0].trim(), hcTexto: partes[1].trim() };
      }
      // Fallback pra quando não vem com tab (ex: espaços) — pega o último número da linha
      const match = linha.match(/^(.*\S)\s+([\d.,]+)\s*$/);
      if (match) {
        return { nomeTexto: match[1].trim(), hcTexto: match[2].trim() };
      }
      return { nomeTexto: linha, hcTexto: "" };
    });
}

export default function ImportarEmMassaModal({
  open,
  titulo,
  onImportar,
  onClose,
}: ImportarEmMassaModalProps) {
  const [texto, setTexto] = useState("");
  const [linhas, setLinhas] = useState<LinhaEditavel[]>([]);
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!open) return null;

  function handleFechar() {
    setTexto("");
    setLinhas([]);
    setErro(null);
    onClose();
  }

  function handleProcessar() {
    const processadas = parseTextoColado(texto);
    if (processadas.length === 0) {
      setErro("Cole ao menos uma linha com nome e HC.");
      return;
    }
    setLinhas(processadas);
    setErro(null);
  }

  function handleRemoverLinha(index: number) {
    setLinhas((prev) => prev.filter((_, i) => i !== index));
  }

  function handleEditarLinha(index: number, campo: "nomeTexto" | "hcTexto", valor: string) {
    setLinhas((prev) => prev.map((l, i) => (i === index ? { ...l, [campo]: valor } : l)));
  }

  async function handleImportar() {
    const validas: LinhaImportada[] = [];
    for (const linha of linhas) {
      const nome = linha.nomeTexto.trim();
      const hc = parseHc(linha.hcTexto);
      if (!nome || hc === null) {
        setErro("Corrija as linhas com nome ou HC inválido antes de importar.");
        return;
      }
      validas.push({ nome, hc });
    }

    setImportando(true);
    setErro(null);
    try {
      await onImportar(validas);
      handleFechar();
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível importar.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ClipboardPaste size={15} />
            </span>
            <h2 className="font-bold text-slate-900">{titulo}</h2>
          </div>
          <button
            type="button"
            onClick={handleFechar}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {linhas.length === 0 ? (
            <>
              <p className="mb-2 text-xs text-slate-500">
                Selecione as colunas Nome e HC na sua planilha, copie (Ctrl+C) e cole aqui:
              </p>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={10}
                placeholder={"João Vaqueiro\t2,0\nCarlos Mendes\t2,5"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_100px_32px] gap-2 px-1 text-xs font-semibold text-slate-500">
                <span>Nome</span>
                <span>HC</span>
                <span />
              </div>
              {linhas.map((linha, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_32px] gap-2">
                  <input
                    value={linha.nomeTexto}
                    onChange={(e) => handleEditarLinha(i, "nomeTexto", e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    value={linha.hcTexto}
                    onChange={(e) => handleEditarLinha(i, "hcTexto", e.target.value)}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoverLinha(i)}
                    aria-label="Remover linha"
                    className="flex items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {erro && <p className="mt-3 text-xs font-medium text-red-500">{erro}</p>}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 p-5">
          {linhas.length === 0 ? (
            <button
              type="button"
              onClick={handleProcessar}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700"
            >
              Processar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setLinhas([])}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleImportar}
                disabled={importando}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200"
              >
                {importando ? "Importando..." : `Importar ${linhas.length}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
