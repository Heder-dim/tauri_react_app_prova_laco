/** Valor "castigo" usado pela planilha original quando a dupla ainda não tem resultado
 * válido (1º tempo vazio/0, Boi Final não lançado, ou eliminada) — joga pro fim do ranking
 * sem precisar de um filtro à parte em todo lugar que soma/compara médias. */
 export const MEDIA_INCOMPLETA = 120;

 export interface DuplaParaCalculoParaGanhar {
   bois: number;
   media: number;
   eliminada: boolean;
 }
 
 /**
  * Menor média entre as duplas que já têm resultado válido (não incompleta, media !== 120)
  * e não foram eliminadas. Equivale ao $R$2 da planilha original — representa a média do
  * líder atual. Uma dupla incompleta ou eliminada não pode "puxar a régua" pra baixo pras
  * demais, já que ela mesma está fora da disputa.
  */
 export function calcularMenorMedia(duplas: DuplaParaCalculoParaGanhar[]): number | null {
   const medias = duplas
     .filter((d) => !d.eliminada && d.media !== MEDIA_INCOMPLETA)
     .map((d) => d.media);
   return medias.length > 0 ? Math.min(...medias) : null;
 }
 
 /**
  * Soma bruta dos tempos de boi que essa dupla corre (trata tempo ainda não lançado como 0
  * — igual ao "H4+I4+J4+K4" da planilha, onde célula vazia soma como zero). É diferente do
  * "Parcial" mostrado na tela, que agora é uma MÉDIA e só existe quando todos os bois estão
  * preenchidos — o Para Ganhar sempre usou essa soma bruta internamente, nunca a coluna Parcial.
  */
 export function calcularSomaTempos(tempos: (number | null)[], bois: number): number {
   return tempos.slice(0, bois).reduce((soma: number, t) => soma + (t ?? 0), 0);
 }
 
 /**
  * true quando a dupla ainda não lançou NENHUM tempo de boi (nem o primeiro) — ou seja,
  * ainda nem começou a competir. Nesse caso o Para Ganhar não deve mostrar uma projeção
  * (que seria enganosa, como se a dupla já tivesse "zerado" todos os bois), e sim 0.
  */
 export function nenhumTempoLancado(tempos: (number | null)[], bois: number): boolean {
   return tempos.slice(0, bois).every((t) => t === null);
 }
 
 /**
  * Réplica da fórmula da planilha original:
  * =SE(G4=1;2*($R$2-0,01)-H4;SE(G4=2;3*($R$2-0,01)-(H4+I4);...))
  *
  * Generalizada pra qualquer quantidade de bois (a planilha só previa até 4):
  *   paraGanhar = (bois + 1) * (menorMedia - 0,01) - somaTempos
  *
  * Representa quanto tempo (ou menos) a dupla precisa fazer no boi final pra
  * empatar/superar a média de quem está liderando a prova agora.
  *
  * `somaTempos` deve vir de `calcularSomaTempos` — NÃO é o campo "Parcial" da dupla.
  */
 export function calcularParaGanhar(bois: number, somaTempos: number, menorMedia: number | null): number {
   if (menorMedia === null || bois < 1) return 0;
   return (bois + 1) * (menorMedia - 0.01) - somaTempos;
 }