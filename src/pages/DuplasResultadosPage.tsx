import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download } from "lucide-react";
import PageHeader from "../components/layout/page-header";
import DuplasResultadosTable, {
  type DuplaResultadoRow,
} from "../components/duplas-resultados/duplas-resultados-table";
// import RegraBoisPanelEditavel from "../components/duplas-resultados/regra-bois-panel";
import {
  atualizarDupla,
  boisParaTempos,
  listarDuplasPorProva,
  temposParaBois,
  type DuplaDetalhadaDb,
} from "../services/duplas";

/** Dupla com o id real do banco — usado só nesta página pra persistir edições */
interface DuplaComId extends DuplaResultadoRow {
  id: number;
}

function iniciaisDoNome(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function paraLinhaDupla(d: DuplaDetalhadaDb, numero: number): DuplaComId {
  return {
    id: d.id,
    numero,
    cabeceiroNome: d.cabeceiro_nome,
    hcCabeceiro: d.hc_cabeceiro,
    pezeiroIniciais: iniciaisDoNome(d.pezeiro_nome),
    pezeiroNome: d.pezeiro_nome,
    hcPez: d.hc_pezeiro,
    hcDupla: d.hc_soma ?? d.hc_cabeceiro + d.hc_pezeiro,
    bois: d.bois_nu,
    tempos: boisParaTempos(d),
    parcial: d.parcial ?? 0,
    boiFinal: d.boi_final ?? 0,
    media: d.media ?? 0,
    paraGanhar: d.para_ganhar ?? 0,
  };
}

export default function DuplasResultadosPage() {
  const { idProva } = useParams<{ idProva: string }>();
  const idProvaNum = Number(idProva);

  const [duplas, setDuplas] = useState<DuplaComId[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarDuplas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProvaNum]);

  async function carregarDuplas() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarDuplasPorProva(idProvaNum);
      setDuplas(dados.map((d, i) => paraLinhaDupla(d, i + 1)));
    } catch (e) {
      setErro(typeof e === "string" ? e : "Não foi possível carregar as duplas.");
    } finally {
      setCarregando(false);
    }
  }

  /**
   * Chamado pela DuplasResultadosTable sempre que um tempo ou o Boi Final é editado.
   * Compara com o estado anterior pra persistir só as linhas que de fato mudaram.
   */
  function handleDuplasChange(atualizado: DuplaResultadoRow[]) {
    // A tabela só espalha (`{...dupla, ...}`) os objetos originais — o campo extra `id`
    // sobrevive em tempo de execução mesmo não fazendo parte do tipo DuplaResultadoRow.
    const comId = atualizado as DuplaComId[];
    const anterior = duplas;
    setDuplas(comId);

    comId.forEach((dupla, i) => {
      const original = anterior[i];
      if (!original) return;

      const mudou =
        original.boiFinal !== dupla.boiFinal ||
        original.parcial !== dupla.parcial ||
        original.media !== dupla.media ||
        original.tempos.some((t, idx) => t !== dupla.tempos[idx]);

      if (!mudou) return;

      const { boi1, boi2, boi3, boi4, boi5, boi6 } = temposParaBois(dupla.tempos);
      atualizarDupla({
        id: dupla.id,
        boi1,
        boi2,
        boi3,
        boi4,
        boi5,
        boi6,
        parcial: dupla.parcial,
        boiFinal: dupla.boiFinal,
        media: dupla.media,
        paraGanhar: dupla.paraGanhar,
      }).catch((e) => {
        setErro(typeof e === "string" ? e : "Não foi possível salvar a alteração.");
      });
    });
  }

  return (
    <div className="-m-6 min-h-screen bg-slate-50 lg:-m-10">
      <PageHeader
        title="Duplas e Resultados"
        subtitle="Todas as duplas registradas, de todos os cabeceiros"
        action={
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700">
            <Download size={16} />
            Exportar PDF
          </button>
        }
      />

      <div className="space-y-5 p-6 lg:p-10">
        {erro && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Carregando duplas...</p>
          </div>
        ) : duplas.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Nenhuma dupla formada nessa prova ainda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row">
            <DuplasResultadosTable duplas={duplas} onDuplasChange={handleDuplasChange} />
            {/* <RegraBoisPanelEditavel /> */}
          </div>
        )}
      </div>
    </div>
  );
}