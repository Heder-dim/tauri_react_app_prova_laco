export interface DuplaParaCalculoParaGanhar {
  bois: number;
  parcial: number;
  media: number;
  eliminada: boolean;
}

/**
 * Menor média entre as duplas que já têm resultado registrado (média > 0) e não foram
 * eliminadas. Equivale ao $R$2 da planilha original — representa a média do líder atual.
 * Uma dupla eliminada não pode "puxar a régua" pra baixo pras demais, já que ela mesma
 * está fora da disputa.
 */
export function calcularMenorMedia(duplas: DuplaParaCalculoParaGanhar[]): number | null {
  const medias = duplas.filter((d) => d.media > 0 && !d.eliminada).map((d) => d.media);
  return medias.length > 0 ? Math.min(...medias) : null;
}

/**
 * Réplica da fórmula da planilha original:
 * =SE(G4=1;2*($R$2-0,01)-H4;SE(G4=2;3*($R$2-0,01)-(H4+I4);...))
 *
 * Generalizada pra qualquer quantidade de bois (a planilha só previa até 4):
 *   paraGanhar = (bois + 1) * (menorMedia - 0,01) - parcial
 *
 * Representa quanto tempo (ou menos) a dupla precisa fazer no boi final pra
 * empatar/superar a média de quem está liderando a prova agora.
 */
export function calcularParaGanhar(bois: number, parcial: number, menorMedia: number | null): number {
  if (menorMedia === null || bois < 1) return 0;
  return (bois + 1) * (menorMedia - 0.01) - parcial;
}