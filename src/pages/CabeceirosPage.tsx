import { useState } from "react";
import PageHeader from "../components/layout/page-header";
import StatBox from "../components/ui/stat-box";
import CabeceiroForm, { type NovoCabeceiro } from "../components/cabeceiros/cabeceiro-form";
import CabeceirosList, { type Cabeceiro } from "../components/cabeceiros/cabeceiros-list";

// Dados de exemplo — substituir pela consulta real (SQLite) quando a lógica for implementada
const CABECEIROS_EXEMPLO: Cabeceiro[] = [
  { id: "1", nome: "João Vaqueiro", hc: 2.0 },
  { id: "2", nome: "Pedro Alves", hc: 3.5 },
  { id: "3", nome: "Antônio Silva", hc: 1.5 },
];

export default function CabeceirosPage() {
  const [cabeceiros, setCabeceiros] = useState<Cabeceiro[]>(CABECEIROS_EXEMPLO);

  function handleAdd({ nome, hc }: NovoCabeceiro) {
    setCabeceiros((prev) => [...prev, { id: crypto.randomUUID(), nome, hc }]);
  }

  function handleRemove(id: string) {
    setCabeceiros((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Cabeceiros"
        subtitle="Cadastre e gerencie os cabeceiros do sistema"
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

        {/* Linha 2 — Lista de cabeceiros cadastrados */}
        <CabeceirosList cabeceiros={cabeceiros} onRemove={handleRemove} />
      </div>
    </div>
  );
}
