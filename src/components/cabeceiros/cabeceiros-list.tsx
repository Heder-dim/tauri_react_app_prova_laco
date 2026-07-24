import { useState } from "react";
import { Check, Pencil, Trash2, Users, X } from "lucide-react";
import Avatar from "../ui/avatar";
import BateriaMultiSelect from "../ui/bateria-multi-select";

export interface Cabeceiro {
  id: number;
  nome: string;
  hc: number;
  baterias: number[];
}

export interface CabeceirosListProps {
  cabeceiros: Cabeceiro[];
  onRemove: (id: number) => void;
  /** Chamado ao confirmar a edição de nome/HC de um cabeceiro */
  onEditar?: (id: number, nome: string, hc: number) => void;
  /** Quantidade total de baterias da prova — se null/0, a prova não usa baterias e o seletor some */
  bateriaNu?: number | null;
  onAlterarBaterias?: (id: number, baterias: number[]) => void;
}

function iniciaisDoNome(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export default function CabeceirosList({
  cabeceiros,
  onRemove,
  onEditar,
  bateriaNu,
  onAlterarBaterias,
}: CabeceirosListProps) {
  const mostrarBateria = Boolean(bateriaNu && bateriaNu > 0 && onAlterarBaterias);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [hcEditadoTexto, setHcEditadoTexto] = useState("");
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  function handleIniciarEdicao(cabeceiro: Cabeceiro) {
    setEditandoId(cabeceiro.id);
    setNomeEditado(cabeceiro.nome);
    setHcEditadoTexto(cabeceiro.hc.toString().replace(".", ","));
    setErroEdicao(null);
  }

  function handleCancelarEdicao() {
    setEditandoId(null);
    setErroEdicao(null);
  }

  function handleSalvarEdicao(id: number) {
    const nome = nomeEditado.trim();
    if (!nome) {
      setErroEdicao("Informe o nome.");
      return;
    }
    const hc = Number(hcEditadoTexto.replace(",", "."));
    if (hcEditadoTexto.trim() === "" || Number.isNaN(hc)) {
      setErroEdicao("Informe um HC válido.");
      return;
    }

    onEditar?.(id, nome, hc);
    setEditandoId(null);
    setErroEdicao(null);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Users size={15} />
        </span>
        <h2 className="font-bold text-slate-900">
          Cabeceiros Cadastrados{" "}
          <span className="font-normal text-slate-400">({cabeceiros.length})</span>
        </h2>
      </div>

      {cabeceiros.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          Nenhum cabeceiro cadastrado ainda.
        </p>
      ) : (
        <ul className="divide-y divide-slate-50">
          {cabeceiros.map((cabeceiro) => {
            const editando = editandoId === cabeceiro.id;

            return (
              <li key={cabeceiro.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-3">
                    <Avatar initials={iniciaisDoNome(cabeceiro.nome)} size="md" />

                    {editando ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          value={nomeEditado}
                          onChange={(e) => setNomeEditado(e.target.value)}
                          aria-label="Nome"
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          value={hcEditadoTexto}
                          onChange={(e) => setHcEditadoTexto(e.target.value)}
                          aria-label="HC"
                          className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-900">
                          {cabeceiro.nome}
                        </span>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                          HC {cabeceiro.hc.toFixed(1).replace(".", ",")}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!editando && mostrarBateria && (
                      <BateriaMultiSelect
                        baterias={cabeceiro.baterias}
                        totalBaterias={bateriaNu ?? 0}
                        onChange={(novasBaterias) => onAlterarBaterias!(cabeceiro.id, novasBaterias)}
                        nomeCompetidor={cabeceiro.nome}
                      />
                    )}

                    {editando ? (
                      <>
                        <button
                          type="button"
                          aria-label="Salvar"
                          onClick={() => handleSalvarEdicao(cabeceiro.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Cancelar"
                          onClick={handleCancelarEdicao}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-label={`Editar ${cabeceiro.nome}`}
                          onClick={() => handleIniciarEdicao(cabeceiro)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-blue-600"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Remover ${cabeceiro.nome}`}
                          onClick={() => onRemove(cabeceiro.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editando && erroEdicao && (
                  <p className="mt-1.5 pl-11 text-xs font-medium text-red-500">{erroEdicao}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}