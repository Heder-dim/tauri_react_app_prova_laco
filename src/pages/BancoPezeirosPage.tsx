import { useEffect, useState } from "react";
import PageHeader from "../components/layout/page-header";
import StatBox from "../components/ui/stat-box";
import PezeiroForm, { type NovoPezeiro } from "../components/pezeiros/pezeiro-form";
import BancoPezeirosList, {
  type BancoPezeiro,
} from "../components/banco-pezeiros/banco-pezeiros-list";
import {
  atualizarBancoPezeiro,
  criarBancoPezeiro,
  deletarBancoPezeiro,
  listarBancoPezeiros,
} from "../services/bancoPezeiros";

export default function BancoPezeirosPage() {
  const [pezeiros, setPezeiros] = useState<BancoPezeiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarPezeiros();
  }, []);

  async function carregarPezeiros() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarBancoPezeiros();
      setPezeiros(dados);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar o banco de pezeiros.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleAdd({ nome, hc }: NovoPezeiro) {
    try {
      const novoPezeiro = await criarBancoPezeiro(nome, hc);
      setPezeiros((prev) =>
        [...prev, novoPezeiro].sort((a, b) => a.nome.localeCompare(b.nome))
      );
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível cadastrar o pezeiro.");
    }
  }

  async function handleEditar(id: number, nome: string, hc: number) {
    try {
      await atualizarBancoPezeiro(id, nome, hc);
      setPezeiros((prev) => prev.map((p) => (p.id === id ? { ...p, nome, hc } : p)));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível editar o pezeiro.");
    }
  }

  // Lançado de volta pra BancoPezeirosList, que mostra o erro específico (ex: "está em
  // uso") direto na linha da pessoa, em vez de num aviso genérico no topo da página.
  async function handleRemove(id: number) {
    await deletarBancoPezeiro(id);
    setPezeiros((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Banco de Pezeiros"
        subtitle="Cadastro global — os mesmos competidores ficam disponíveis em qualquer prova"
      />

      <div className="space-y-5 p-6 lg:p-10">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PezeiroForm onAdd={handleAdd} />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Resumo
            </p>
            <StatBox value={pezeiros.length} label="No banco" tone="blue" />
          </div>
        </div>

        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando banco de pezeiros...</p>
          </div>
        ) : (
          <BancoPezeirosList
            pezeiros={pezeiros}
            onRemove={handleRemove}
            onEditar={handleEditar}
          />
        )}
      </div>
    </div>
  );
}
