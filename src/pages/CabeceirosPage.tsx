import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import StatBox from "../components/ui/stat-box";
import AdicionarDoBanco from "../components/ui/adicionar-do-banco";
import CabeceiroForm, { type NovoCabeceiro } from "../components/cabeceiros/cabeceiro-form";
import CabeceirosList, { type Cabeceiro } from "../components/cabeceiros/cabeceiros-list";
import ImportarEmMassaModal, {
  type LinhaImportada,
} from "../components/ui/importar-em-massa-modal";
import {
  adicionarCabeceiroAProva,
  atualizarBateriasCabeceiro,
  criarCabeceiro,
  deletarCabeceiro,
  listarCabeceirosPorProva,
} from "../services/cabeceiros";
import { listarBancoCabeceiros, type BancoCabeceiroDb } from "../services/bancoCabeceiros";
import { buscarProva } from "../services/provas";

export default function CabeceirosPage() {
  const { idProva } = useParams<{ idProva: string }>();
  const idProvaNum = Number(idProva);

  const [cabeceiros, setCabeceiros] = useState<Cabeceiro[]>([]);
  const [bancoCabeceiros, setBancoCabeceiros] = useState<BancoCabeceiroDb[]>([]);
  const [bateriaNu, setBateriaNu] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [importarAberto, setImportarAberto] = useState(false);

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProvaNum]);

  async function carregarTudo() {
    setCarregando(true);
    setErro(null);
    try {
      const [dados, prova, banco] = await Promise.all([
        listarCabeceirosPorProva(idProvaNum),
        buscarProva(idProvaNum),
        listarBancoCabeceiros(),
      ]);
      setCabeceiros(dados);
      setBateriaNu(prova.bateria ? prova.bateria_nu : null);
      setBancoCabeceiros(banco);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar os cabeceiros.");
    } finally {
      setCarregando(false);
    }
  }

  /** Quem do banco ainda não está registrado nessa prova */
  const opcoesBanco = bancoCabeceiros.filter(
    (b) => !cabeceiros.some((c) => c.id_banco_cabeceiro === b.id)
  );

  async function handleAdicionarDoBanco(idBancoCabeceiro: number) {
    try {
      const novo = await adicionarCabeceiroAProva(idBancoCabeceiro, idProvaNum);
      setCabeceiros((prev) => [...prev, novo]);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível adicionar o cabeceiro.");
    }
  }

  /** Cadastro rápido: cria alguém novo no banco global e já registra nessa prova */
  async function handleAdd({ nome, hc }: NovoCabeceiro) {
    try {
      const novoCabeceiro = await criarCabeceiro(nome, hc, idProvaNum);
      setCabeceiros((prev) => [...prev, novoCabeceiro]);
      setBancoCabeceiros((prev) => [
        ...prev,
        { id: novoCabeceiro.id_banco_cabeceiro, nome: novoCabeceiro.nome, hc: novoCabeceiro.hc },
      ]);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível cadastrar o cabeceiro.");
    }
  }

  /** Remove só a participação nessa prova — a pessoa continua no banco global */
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
    setBancoCabeceiros((prev) => [
      ...prev,
      ...novosCabeceiros.map((c) => ({ id: c.id_banco_cabeceiro, nome: c.nome, hc: c.hc })),
    ]);
  }

  async function handleAlterarBaterias(id: number, baterias: number[]) {
    try {
      await atualizarBateriasCabeceiro(id, baterias);
      setCabeceiros((prev) => prev.map((c) => (c.id === id ? { ...c, baterias } : c)));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível atualizar as baterias.");
    }
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Cabeceiros"
        subtitle="Quem está registrado nessa prova — puxado do banco global de competidores"
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
        {/* Linha 1 — Adicionar do banco + resumo */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AdicionarDoBanco
              titulo="Adicionar do Banco de Cabeceiros"
              opcoes={opcoesBanco}
              onAdicionar={handleAdicionarDoBanco}
            />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Resumo
            </p>
            <StatBox value={cabeceiros.length} label="Nessa prova" tone="blue" />
          </div>
        </div>

        {/* Linha 2 — Cadastro rápido, pra quem ainda não existe no banco */}
        <CabeceiroForm onAdd={handleAdd} />

        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {erro}
          </div>
        )}

        {/* Linha 3 — Lista de cabeceiros dessa prova */}
        {carregando ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando cabeceiros...</p>
          </div>
        ) : (
          <CabeceirosList
            cabeceiros={cabeceiros}
            onRemove={handleRemove}
            bateriaNu={bateriaNu}
            onAlterarBaterias={handleAlterarBaterias}
          />
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