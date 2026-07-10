/** Sorteia `quantidade` itens distintos de uma lista, sem repetir. Se a lista for menor
 * que a quantidade pedida, retorna todos os itens disponíveis (sorteados, sem repetir). */
export function sortearDistintos<T>(lista: T[], quantidade: number): T[] {
  const copia = [...lista];
  const sorteados: T[] = [];
  const n = Math.min(quantidade, copia.length);

  for (let i = 0; i < n; i++) {
    const indice = Math.floor(Math.random() * copia.length);
    sorteados.push(copia[indice]);
    copia.splice(indice, 1);
  }

  return sorteados;
}

/**
 * Sorteia `quantidade` itens distintos, priorizando quem tem MENOS corridas até agora —
 * evita que um competidor acumule muito mais duplas que os outros. O sorteio aleatório
 * só decide entre "empatados" (mesma quantidade de corridas); quem correu menos sempre
 * vem antes de quem correu mais.
 */
export function sortearBalanceado<T>(
  itens: T[],
  quantidade: number,
  contarCorridas: (item: T) => number
): T[] {
  const porContagem = new Map<number, T[]>();
  for (const item of itens) {
    const contagem = contarCorridas(item);
    const grupo = porContagem.get(contagem) ?? [];
    grupo.push(item);
    porContagem.set(contagem, grupo);
  }

  const contagensOrdenadas = [...porContagem.keys()].sort((a, b) => a - b);

  const resultado: T[] = [];
  for (const contagem of contagensOrdenadas) {
    if (resultado.length >= quantidade) break;
    const grupo = porContagem.get(contagem)!;
    const faltam = quantidade - resultado.length;
    resultado.push(...sortearDistintos(grupo, faltam));
  }

  return resultado;
}