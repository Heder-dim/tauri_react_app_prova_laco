import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export interface SalvarArquivoOpcoes {
  nomeArquivo: string;
  extensao: string;
  nomeFiltro: string;
}

/**
 * Abre o diálogo nativo "Salvar como" do sistema operacional e grava os bytes no
 * caminho escolhido.
 *
 * Necessário porque o mecanismo de download "estilo navegador" (blob + <a download>,
 * usado por padrão pelo jsPDF/`doc.save()` e pelo SheetJS/`XLSX.writeFile()`) não
 * funciona de forma confiável dentro do WebView do Tauri — por isso os exportadores
 * geram só os bytes em memória e pedem pra essa função escrever o arquivo de verdade.
 *
 * Retorna `false` se o usuário cancelar o diálogo (nesse caso nada é escrito).
 */
export async function salvarArquivo(
  bytes: Uint8Array,
  opcoes: SalvarArquivoOpcoes
): Promise<boolean> {
  const caminho = await save({
    defaultPath: opcoes.nomeArquivo,
    filters: [{ name: opcoes.nomeFiltro, extensions: [opcoes.extensao] }],
  });

  if (!caminho) return false; // usuário cancelou o diálogo

  await writeFile(caminho, bytes);
  return true;
}
