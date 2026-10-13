/**
 * Contas de concentração (ADR-020). São ESTIMATIVAS PRÓPRIAS que combinam fontes de anos diferentes
 * (adultos: IBGE 2022; média e mediana: UBS; fatia do 1% mais rico: Credit Suisse 2021). O .md manda não
 * cruzar fontes sem ressalva: por isso a tela mostra cada passo da conta e o aviso.
 */

export interface Top1Input {
  /** Adultos (18+) no Brasil. */
  adults: number;
  /** Patrimônio médio por adulto (R$). */
  meanWealth: number;
  /** Fatia da riqueza do 1% mais rico (%, ex.: 49,3). */
  top1SharePct: number;
  /** Fração de pessoas do topo (padrão 1%). */
  topFraction?: number;
}

export interface Top1Estimate {
  topPeople: number;
  restPeople: number;
  totalWealth: number;
  topWealth: number;
  restWealth: number;
  /** Patrimônio médio de uma pessoa do topo / do resto (R$). */
  topMean: number;
  restMean: number;
  /** Quantas pessoas do resto somam o que 1 pessoa do topo tem (média contra média). */
  topEqualsRestPeople: number;
}

export function estimateTop1({ adults, meanWealth, top1SharePct, topFraction = 0.01 }: Top1Input): Top1Estimate {
  const topPeople = adults * topFraction;
  const restPeople = adults - topPeople;
  const totalWealth = adults * meanWealth;
  const topWealth = totalWealth * (top1SharePct / 100);
  const restWealth = totalWealth - topWealth;
  const topMean = topWealth / topPeople;
  const restMean = restWealth / restPeople;
  return { topPeople, restPeople, totalWealth, topWealth, restWealth, topMean, restMean, topEqualsRestPeople: topMean / restMean };
}

/**
 * Teto da fatia da metade MAIS POBRE na riqueza total: cada pessoa dessa metade tem no máximo a mediana, então
 * ela soma no máximo (adultos/2 × mediana); a riqueza total é adultos × média. Logo fatia ≤ 0,5 × mediana / média,
 * e a metade mais rica tem pelo menos o resto. Só usa mediana e média (mesma fonte, UBS).
 */
export function bottomHalfMaxShare(median: number, mean: number): number {
  return (0.5 * median) / mean;
}
