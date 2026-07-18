import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import StatBox from "../components/ui/stat-box";
import PezeiroForm, { type NovoPezeiro } from "../components/pezeiros/pezeiro-form";
import PezeirosList, { type Pezeiro } from "../components/pezeiros/pezeiros-list";
import ImportarEmMassaModal, {
  type LinhaImportada,
} from "../components/ui/importar-em-massa-modal";
import { criarPezeiro, deletarPezeiro, listarPezeirosPorProva } from "../services/pezeiros";

export default function PezeirosPage() {
  const { idProva } = useParams<{ idProva: string }>();
  const idProvaNum = Number(idProva);

  const [pezeiros, setPezeiros] = useState<Pezeiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [importarAberto, setImportarAberto] = useState(false);

  useEffect(() => {
    carregarPezeiros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProvaNum]);

  async function carregarPezeiros() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarPezeirosPorProva(idProvaNum);
      setPezeiros(dados);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar os pezeiros.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleAdd({ nome, hc }: NovoPezeiro) {
    try {
      const novoPezeiro = await criarPezeiro(nome, hc, idProvaNum);
      setPezeiros((prev) => [...prev, novoPezeiro]);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível cadastrar o pezeiro.");
    }
  }

  async function handleRemove(id: number) {
    try {
      await deletarPezeiro(id);
      setPezeiros((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível remover o pezeiro.");
    }
  }

  async function handleImportarEmMassa(linhas: LinhaImportada[]) {
    const novosPezeiros: Pezeiro[] = [];
    for (const linha of linhas) {
      const novo = await criarPezeiro(linha.nome, linha.hc, idProvaNum);
      novosPezeiros.push(novo);
    }
    setPezeiros((prev) => [...prev, ...novosPezeiros]);
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Pezeiros"
        subtitle="Cadastre e gerencie os pezeiros do sistema"
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
            <PezeiroForm onAdd={handleAdd} />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Resumo
            </p>
            <StatBox value={pezeiros.length} label="Pezeiros" tone="blue" />
          </div>
        </div>

        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {erro}
          </div>
        )}

        {/* Linha 2 — Lista de pezeiros cadastrados */}
        {carregando ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando pezeiros...</p>
          </div>
        ) : (
          <PezeirosList pezeiros={pezeiros} onRemove={handleRemove} />
        )}
      </div>

      <ImportarEmMassaModal
        open={importarAberto}
        titulo="Importar Pezeiros em Massa"
        onImportar={handleImportarEmMassa}
        onClose={() => setImportarAberto(false)}
      />
    </div>
  );
}