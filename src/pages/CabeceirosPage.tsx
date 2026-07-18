import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import StatBox from "../components/ui/stat-box";
import CabeceiroForm, { type NovoCabeceiro } from "../components/cabeceiros/cabeceiro-form";
import CabeceirosList, { type Cabeceiro } from "../components/cabeceiros/cabeceiros-list";
import ImportarEmMassaModal, {
  type LinhaImportada,
} from "../components/ui/importar-em-massa-modal";
import { criarCabeceiro, deletarCabeceiro, listarCabeceirosPorProva } from "../services/cabeceiros";

export default function CabeceirosPage() {
  const { idProva } = useParams<{ idProva: string }>();
  const idProvaNum = Number(idProva);

  const [cabeceiros, setCabeceiros] = useState<Cabeceiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [importarAberto, setImportarAberto] = useState(false);

  useEffect(() => {
    carregarCabeceiros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProvaNum]);

  async function carregarCabeceiros() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarCabeceirosPorProva(idProvaNum);
      setCabeceiros(dados);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar os cabeceiros.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleAdd({ nome, hc }: NovoCabeceiro) {
    try {
      const novoCabeceiro = await criarCabeceiro(nome, hc, idProvaNum);
      setCabeceiros((prev) => [...prev, novoCabeceiro]);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível cadastrar o cabeceiro.");
    }
  }

  async function handleRemove(id: number) {
    try {
      await deletarCabeceiro(id);
      setCabeceiros((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível remover o cabeceiro.");
    }
  }

  async function handleImportarEmMassa(linhas: LinhaImportada[]) {
    const novosCabeceiros: Cabeceiro[] = [];
    for (const linha of linhas) {
      const novo = await criarCabeceiro(linha.nome, linha.hc, idProvaNum);
      novosCabeceiros.push(novo);
    }
    setCabeceiros((prev) => [...prev, ...novosCabeceiros]);
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Cabeceiros"
        subtitle="Cadastre e gerencie os cabeceiros do sistema"
        action={
          <button
            type="button"
            onClick={() => setImportarAberto(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-500 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
          >
            <UploadCloud size={16} />
            Importar em Massa
          </button>
        }
      />

      <div className="space-y-5 p-6 lg:p-10">
        {/* Linha 1 — Formulário de cadastro + resumo */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CabeceiroForm onAdd={handleAdd} />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Resumo
            </p>
            <StatBox value={cabeceiros.length} label="Cabeceiros" tone="blue" />
          </div>
        </div>

        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {erro}
          </div>
        )}

        {/* Linha 2 — Lista de cabeceiros cadastrados */}
        {carregando ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando cabeceiros...</p>
          </div>
        ) : (
          <CabeceirosList cabeceiros={cabeceiros} onRemove={handleRemove} />
        )}
      </div>

      <ImportarEmMassaModal
        open={importarAberto}
        titulo="Importar Cabeceiros em Massa"
        onImportar={handleImportarEmMassa}
        onClose={() => setImportarAberto(false)}
      />
    </div>
  );
}