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

export interface DuplaParaSorteioInscricao {
  id: number;
  idCabeceiro: number;
  idPezeiro: number;
}

/**
 * Sorteia uma nova ordem de inscrição (1, 2, 3...) pra um conjunto de duplas já formadas,
 * tentando garantir que cada cabeceiro e cada pezeiro tenham pelo menos `intervaloMinimo`
 * posições de distância entre uma corrida e a próxima — sempre que for possível.
 *
 * A cada posição, sorteia aleatoriamente entre as duplas "elegíveis" (cujo cabeceiro E
 * pezeiro já esperaram o suficiente). Se ninguém for elegível naquela posição, relaxa a
 * regra e sorteia entre as duplas que deixam o menor "aperto" possível (best effort).
 *
 * Retorna um Map de id da dupla -> nova inscrição.
 */
export function sortearInscricoes(
  duplas: DuplaParaSorteioInscricao[],
  intervaloMinimo: number
): Map<number, number> {
  const pendentes = sortearDistintos(duplas, duplas.length); // embaralha a ordem inicial
  const posicaoFinal = new Map<number, number>();
  const ultimaPosicaoCabeceiro: Record<number, number> = {};
  const ultimaPosicaoPezeiro: Record<number, number> = {};

  let posicao = 1;

  function distancia(mapa: Record<number, number>, id: number) {
    return mapa[id] !== undefined ? posicao - mapa[id] : Infinity;
  }

  while (pendentes.length > 0) {
    const elegiveis = pendentes.filter(
      (d) =>
        distancia(ultimaPosicaoCabeceiro, d.idCabeceiro) >= intervaloMinimo &&
        distancia(ultimaPosicaoPezeiro, d.idPezeiro) >= intervaloMinimo
    );

    let candidatos = elegiveis;

    if (candidatos.length === 0) {
      // Ninguém satisfaz o intervalo pedido nessa posição — relaxa pra quem deixa o
      // menor "aperto" possível (maximiza a menor distância entre cabeceiro/pezeiro).
      let melhorPontuacao = -Infinity;
      for (const d of pendentes) {
        const pontuacao = Math.min(
          distancia(ultimaPosicaoCabeceiro, d.idCabeceiro),
          distancia(ultimaPosicaoPezeiro, d.idPezeiro)
        );
        if (pontuacao > melhorPontuacao) melhorPontuacao = pontuacao;
      }
      candidatos = pendentes.filter(
        (d) =>
          Math.min(
            distancia(ultimaPosicaoCabeceiro, d.idCabeceiro),
            distancia(ultimaPosicaoPezeiro, d.idPezeiro)
          ) === melhorPontuacao
      );
    }

    const [escolhida] = sortearDistintos(candidatos, 1);
    pendentes.splice(pendentes.indexOf(escolhida), 1);

    posicaoFinal.set(escolhida.id, posicao);
    ultimaPosicaoCabeceiro[escolhida.idCabeceiro] = posicao;
    ultimaPosicaoPezeiro[escolhida.idPezeiro] = posicao;
    posicao += 1;
  }

  return posicaoFinal;
}