import { useEffect, useState } from "react";
import PageHeader from "../components/layout/page-header";
import StatBox from "../components/ui/stat-box";
import CabeceiroForm, { type NovoCabeceiro } from "../components/cabeceiros/cabeceiro-form";
import BancoCabeceirosList, {
  type BancoCabeceiro,
} from "../components/banco-cabeceiros/banco-cabeceiros-list";
import {
  atualizarBancoCabeceiro,
  criarBancoCabeceiro,
  deletarBancoCabeceiro,
  listarBancoCabeceiros,
} from "../services/bancoCabeceiros";

export default function BancoCabeceirosPage() {
  const [cabeceiros, setCabeceiros] = useState<BancoCabeceiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarCabeceiros();
  }, []);

  async function carregarCabeceiros() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarBancoCabeceiros();
      setCabeceiros(dados);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar o banco de cabeceiros.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleAdd({ nome, hc }: NovoCabeceiro) {
    try {
      const novoCabeceiro = await criarBancoCabeceiro(nome, hc);
      setCabeceiros((prev) =>
        [...prev, novoCabeceiro].sort((a, b) => a.nome.localeCompare(b.nome))
      );
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível cadastrar o cabeceiro.");
    }
  }

  async function handleEditar(id: number, nome: string, hc: number) {
    try {
      await atualizarBancoCabeceiro(id, nome, hc);
      setCabeceiros((prev) => prev.map((c) => (c.id === id ? { ...c, nome, hc } : c)));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível editar o cabeceiro.");
    }
  }

  // Lançado de volta pra BancoCabeceirosList, que mostra o erro específico (ex: "está em
  // uso") direto na linha da pessoa, em vez de num aviso genérico no topo da página.
  async function handleRemove(id: number) {
    await deletarBancoCabeceiro(id);
    setCabeceiros((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Banco de Cabeceiros"
        subtitle="Cadastro global — os mesmos competidores ficam disponíveis em qualquer prova"
      />

      <div className="space-y-5 p-6 lg:p-10">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CabeceiroForm onAdd={handleAdd} />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Resumo
            </p>
            <StatBox value={cabeceiros.length} label="No banco" tone="blue" />
          </div>
        </div>

        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando banco de cabeceiros...</p>
          </div>
        ) : (
          <BancoCabeceirosList
            cabeceiros={cabeceiros}
            onRemove={handleRemove}
            onEditar={handleEditar}
          />
        )}
      </div>
    </div>
  );
}
