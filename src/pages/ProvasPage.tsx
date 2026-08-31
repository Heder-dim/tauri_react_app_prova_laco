import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/page-header";
import ConfirmDialog from "../components/ui/confirm-dialog";
import ProvaForm, { type NovaProva } from "../components/provas/prova-form";
import ProvaCard, { type Prova } from "../components/provas/prova-card";
import { criarProva, deletarProva, listarProvas } from "../services/provas";

export default function ProvasPage() {
  const navigate = useNavigate();
  const [provas, setProvas] = useState<Prova[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [provaParaExcluir, setProvaParaExcluir] = useState<Prova | null>(null);

  useEffect(() => {
    carregarProvas();
  }, []);

  async function carregarProvas() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarProvas();
      setProvas(dados);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar as provas.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleAdd({ nome, data, categoria, bateria, bateriaNu, limiteInscricao }: NovaProva) {
    try {
      const novaProva = await criarProva({ nome, data, categoria, bateria, bateriaNu, limiteInscricao });
      setProvas((prev) => [novaProva, ...prev]);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível criar a prova.");
    }
  }

  function handleAcessar(id: number) {
    navigate(`/provas/${id}/dashboard`);
  }

  async function handleConfirmarExclusao() {
    if (!provaParaExcluir) return;
    try {
      await deletarProva(provaParaExcluir.id);
      setProvas((prev) => prev.filter((p) => p.id !== provaParaExcluir.id));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível excluir a prova.");
    } finally {
      setProvaParaExcluir(null);
    }
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Provas"
        subtitle="Crie e acesse as provas do sistema"
      />

      <div className="space-y-5 p-6 lg:p-10">
        <ProvaForm onAdd={handleAdd} />

        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando provas...</p>
          </div>
        ) : provas.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Nenhuma prova criada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {provas.map((prova) => (
              <ProvaCard
                key={prova.id}
                prova={prova}
                onAcessar={handleAcessar}
                onDeletar={() => setProvaParaExcluir(prova)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={provaParaExcluir !== null}
        title={`Excluir "${provaParaExcluir?.nome}"?`}
        description="Essa ação não pode ser desfeita. Todos os dados relacionados a essa prova serão perdidos."
        confirmLabel="Excluir"
        onConfirm={handleConfirmarExclusao}
        onCancel={() => setProvaParaExcluir(null)}
      />
    </div>
  );
}