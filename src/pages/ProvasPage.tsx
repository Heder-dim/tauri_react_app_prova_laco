import { useState } from "react";
import PageHeader from "../components/layout/page-header";
import ConfirmDialog from "../components/ui/confirm-dialog";
import ProvaForm, { type NovaProva } from "../components/provas/prova-form";
import ProvaCard, { type Prova } from "../components/provas/prova-card";

// Dados de exemplo — substituir pela consulta real (SQLite) quando a lógica for implementada
const PROVAS_EXEMPLO: Prova[] = [
  { id: "1", nome: "1ª Prova de Laço", data: "2026-07-12" },
  { id: "2", nome: "2ª Prova de Laço", data: "2026-08-02" },
  { id: "3", nome: "Copa Regional", data: "2026-08-20" },
];

export default function ProvasPage() {
  const [provas, setProvas] = useState<Prova[]>(PROVAS_EXEMPLO);
  const [provaParaExcluir, setProvaParaExcluir] = useState<Prova | null>(null);

  function handleAdd({ nome, data }: NovaProva) {
    setProvas((prev) => [...prev, { id: crypto.randomUUID(), nome, data }]);
  }

  function handleAcessar(id: string) {
    // TODO: navegar para a tela de detalhes da prova assim que ela existir
    console.log("Acessar prova", id);

  }

  function handleConfirmarExclusao() {
    if (!provaParaExcluir) return;
    setProvas((prev) => prev.filter((p) => p.id !== provaParaExcluir.id));
    setProvaParaExcluir(null);
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Provas"
        subtitle="Crie e acesse as provas do sistema"
      />

      <div className="space-y-5 p-6 lg:p-10">
        <ProvaForm onAdd={handleAdd} />

        {provas.length === 0 ? (
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
