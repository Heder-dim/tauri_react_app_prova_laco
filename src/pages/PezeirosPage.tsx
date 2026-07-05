import { useState } from "react";
import PageHeader from "../components/layout/page-header";
import StatBox from "../components/ui/stat-box";
import PezeiroForm, { type NovoPezeiro } from "../components/pezeiros/pezeiro-form";
import PezeirosList, { type Pezeiro } from "../components/pezeiros/pezeiros-list";

// Dados de exemplo — substituir pela consulta real (SQLite) quando a lógica for implementada
const PEZEIROS_EXEMPLO: Pezeiro[] = [
  { id: "1", nome: "Carlos Mendes", hc: 2.5 },
  { id: "2", nome: "Rafael Lima", hc: 3.0 },
  { id: "3", nome: "Marcos Souza", hc: 2.0 },
];

export default function PezeirosPage() {
  const [pezeiros, setPezeiros] = useState<Pezeiro[]>(PEZEIROS_EXEMPLO);

  function handleAdd({ nome, hc }: NovoPezeiro) {
    setPezeiros((prev) => [...prev, { id: crypto.randomUUID(), nome, hc }]);
  }

  function handleRemove(id: string) {
    setPezeiros((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Pezeiros"
        subtitle="Cadastre e gerencie os pezeiros do sistema"
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

        {/* Linha 2 — Lista de pezeiros cadastrados */}
        <PezeirosList pezeiros={pezeiros} onRemove={handleRemove} />
      </div>
    </div>
  );
}
