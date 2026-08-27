import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import StatBox from "../components/ui/stat-box";
import AdicionarDoBanco from "../components/ui/adicionar-do-banco";
import PezeiroForm, { type NovoPezeiro } from "../components/pezeiros/pezeiro-form";
import PezeirosList, { type Pezeiro } from "../components/pezeiros/pezeiros-list";
import ImportarEmMassaModal, {
  type LinhaImportada,
} from "../components/ui/importar-em-massa-modal";
import {
  adicionarPezeiroAProva,
  atualizarBateriasPezeiro,
  criarPezeiro,
  deletarPezeiro,
  listarPezeirosPorProva,
} from "../services/pezeiros";
import { listarBancoPezeiros, type BancoPezeiroDb } from "../services/bancoPezeiros";
import { buscarProva } from "../services/provas";

export default function PezeirosPage() {
  const { idProva } = useParams<{ idProva: string }>();
  const idProvaNum = Number(idProva);

  const [pezeiros, setPezeiros] = useState<Pezeiro[]>([]);
  const [bancoPezeiros, setBancoPezeiros] = useState<BancoPezeiroDb[]>([]);
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
        listarPezeirosPorProva(idProvaNum),
        buscarProva(idProvaNum),
        listarBancoPezeiros(),
      ]);
      setPezeiros(dados);
      setBateriaNu(prova.bateria ? prova.bateria_nu : null);
      setBancoPezeiros(banco);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar os pezeiros.");
    } finally {
      setCarregando(false);
    }
  }

  /** Quem do banco ainda não está registrado nessa prova */
  const opcoesBanco = bancoPezeiros.filter(
    (b) => !pezeiros.some((p) => p.id_banco_pezeiro === b.id)
  );

  async function handleAdicionarDoBanco(idBancoPezeiro: number) {
    try {
      const novo = await adicionarPezeiroAProva(idBancoPezeiro, idProvaNum);
      setPezeiros((prev) => [...prev, novo]);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível adicionar o pezeiro.");
    }
  }

  /** Cadastro rápido: cria alguém novo no banco global e já registra nessa prova */
  async function handleAdd({ nome, hc }: NovoPezeiro) {
    try {
      const novoPezeiro = await criarPezeiro(nome, hc, idProvaNum);
      setPezeiros((prev) => [...prev, novoPezeiro]);
      setBancoPezeiros((prev) => [
        ...prev,
        { id: novoPezeiro.id_banco_pezeiro, nome: novoPezeiro.nome, hc: novoPezeiro.hc },
      ]);
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível cadastrar o pezeiro.");
    }
  }

  /** Remove só a participação nessa prova — a pessoa continua no banco global */
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
    setBancoPezeiros((prev) => [
      ...prev,
      ...novosPezeiros.map((p) => ({ id: p.id_banco_pezeiro, nome: p.nome, hc: p.hc })),
    ]);
  }

  async function handleAlterarBaterias(id: number, baterias: number[]) {
    try {
      await atualizarBateriasPezeiro(id, baterias);
      setPezeiros((prev) => prev.map((p) => (p.id === id ? { ...p, baterias } : p)));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível atualizar as baterias.");
    }
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Pezeiros"
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
              titulo="Adicionar do Banco de Pezeiros"
              opcoes={opcoesBanco}
              onAdicionar={handleAdicionarDoBanco}
            />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Resumo
            </p>
            <StatBox value={pezeiros.length} label="Nessa prova" tone="blue" />
          </div>
        </div>

        {/* Linha 2 — Cadastro rápido, pra quem ainda não existe no banco */}
        <PezeiroForm onAdd={handleAdd} />

        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {erro}
          </div>
        )}

        {/* Linha 3 — Lista de pezeiros dessa prova */}
        {carregando ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando pezeiros...</p>
          </div>
        ) : (
          <PezeirosList
            pezeiros={pezeiros}
            onRemove={handleRemove}
            bateriaNu={bateriaNu}
            onAlterarBaterias={handleAlterarBaterias}
          />
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