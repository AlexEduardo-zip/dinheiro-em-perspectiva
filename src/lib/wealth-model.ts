/**
 * Modelo estatístico para ESTIMAR cortes de percentil que a base não tem (25% e 75%). ADR-024.
 *
 * Distribuição por percentil p (0 a 1):
 *  - corpo (p ≤ splice): lognormal com a MEDIANA dada e desvio σ;  Q(p) = mediana × exp(σ · z(p))
 *  - cauda (p > splice): Pareto com índice α;                      Q(p) = t × ((1 − splice) / (1 − p))^(1/α), t = Q(splice)
 * Os dois parâmetros (σ, α) são calibrados para reproduzir a MÉDIA por adulto e a fatia do 1% mais rico. Não é dado
 * oficial: é uma estimativa que mistura UBS (mediana e média) e Credit Suisse 2021 (fatia do 1%). A tela diz isso.
 * Teste de sanidade: a metade mais pobre sai com ~2,7% da riqueza, dentro do teto rigoroso de 7,5% (e perto dos 2% do WID).
 */

/** Distribuição normal acumulada (Abramowitz–Stegun 26.2.17, erro < 1e-7). */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/** Inversa da normal acumulada, por bisseção. */
export function normalInv(p: number): number {
  let lo = -8, hi = 8;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (normalCdf(m) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export interface WealthModel {
  sigma: number;
  alpha: number;
  splice: number;
  /** Patrimônio no ponto de emenda (R$). */
  threshold: number;
  /** Patrimônio no percentil p (R$). */
  quantile: (p: number) => number;
  /** Média e fatia do 1% que o modelo reproduz (para conferir contra os alvos). */
  mean: number;
  top1Share: number;
  /** Fatia da riqueza da metade mais pobre segundo o modelo. */
  bottomHalfShare: number;
}

interface FitInput {
  median: number;
  mean: number;
  /** Fatia do 1% mais rico, em % (ex.: 49,3). */
  top1SharePct: number;
  /** Percentil onde o corpo lognormal vira cauda de Pareto (padrão 0,9). */
  splice?: number;
}

export function fitWealthModel({ median, mean, top1SharePct, splice = 0.9 }: FitInput): WealthModel {
  const zs = normalInv(splice);
  const q = 1 - splice;
  const stats = (sigma: number, alpha: number) => {
    const t = median * Math.exp(sigma * zs);
    const k = 1 - 1 / alpha;
    const body = median * Math.exp((sigma * sigma) / 2) * normalCdf(zs - sigma);
    const m = body + (t * q) / k; // ∫ de 0 a 1 de Q(p)
    const top1 = (t * Math.pow(q, 1 / alpha) * Math.pow(0.01, k)) / k; // ∫ de 0,99 a 1
    const bottom = median * Math.exp((sigma * sigma) / 2) * normalCdf(-sigma); // ∫ de 0 a 0,5
    return { t, mean: m, top1Share: top1 / m, bottomHalfShare: bottom / m };
  };
  // para cada σ, o α que casa a média (a média diminui quando α aumenta); depois o σ que casa a fatia do 1%
  const alphaForMean = (sigma: number) => {
    let lo = 1.02, hi = 40;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (stats(sigma, mid).mean > mean) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  let best: { sigma: number; alpha: number; err: number } | null = null;
  for (let sigma = 0.5; sigma <= 3.5; sigma += 0.01) {
    const alpha = alphaForMean(sigma);
    if (alpha <= 1.03) continue; // média infinita: fora do domínio
    const err = Math.abs(stats(sigma, alpha).top1Share * 100 - top1SharePct);
    if (!best || err < best.err) best = { sigma, alpha, err };
  }
  if (!best) throw new Error("fitWealthModel: sem solução para estes alvos");
  const { sigma, alpha } = best;
  const s = stats(sigma, alpha);
  const quantile = (p: number) =>
    p <= splice ? median * Math.exp(sigma * normalInv(p)) : s.t * Math.pow(q / (1 - p), 1 / alpha);
  return { sigma, alpha, splice, threshold: s.t, quantile, mean: s.mean, top1Share: s.top1Share, bottomHalfShare: s.bottomHalfShare };
}

/** P25 e P75 estimados, com a faixa que aparece ao mudar o ponto de emenda entre o corpo e a cauda. */
export function estimateQuartiles(input: Omit<FitInput, "splice">) {
  const splices = [0.8, 0.85, 0.9, 0.95];
  const fits = splices.map((s) => fitWealthModel({ ...input, splice: s }));
  const central = fits[splices.indexOf(0.9)]!;
  const range = (p: number) => {
    const v = fits.map((f) => f.quantile(p));
    return [Math.min(...v), Math.max(...v)] as [number, number];
  };
  return {
    model: central,
    p25: central.quantile(0.25),
    p75: central.quantile(0.75),
    p25Range: range(0.25),
    p75Range: range(0.75),
  };
}

/** Percentil (0 a 1) em que o patrimônio do modelo atinge `value`: fração dos adultos que tem MENOS que `value`. */
export function percentileAtValue(model: WealthModel, value: number): number {
  let lo = 0.0001, hi = 0.99999;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (model.quantile(mid) < value) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Onde, na fila de adultos, o patrimônio de hoje cruza a MÉDIA: quem está antes tem menos que a média (teria mais numa
 * divisão igual) e quem está depois tem mais (teria menos). Estimativa de modelo (ADR-026), com a faixa de incerteza
 * ao mover o ponto de emenda corpo/cauda. Certeza rigorosa: pelo menos 50% (quem está abaixo da mediana) tem menos que a média.
 */
export function estimateMeanPosition(input: Omit<FitInput, "splice">) {
  const splices = [0.8, 0.85, 0.9, 0.95];
  const fits = splices.map((s) => fitWealthModel({ ...input, splice: s }));
  const central = fits[splices.indexOf(0.9)]!;
  const ps = fits.map((f) => percentileAtValue(f, input.mean));
  return {
    model: central,
    /** Fração dos adultos com patrimônio abaixo da média. */
    belowMean: percentileAtValue(central, input.mean),
    belowMeanRange: [Math.min(...ps), Math.max(...ps)] as [number, number],
    /** Patrimônio no percentil 95 (central e faixa). */
    p95: central.quantile(0.95),
    p95Range: [Math.min(...fits.map((f) => f.quantile(0.95))), Math.max(...fits.map((f) => f.quantile(0.95)))] as [number, number],
  };
}
