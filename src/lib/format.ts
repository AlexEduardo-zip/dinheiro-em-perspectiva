const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const brl2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const dec = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Nomes dos números em pt-BR: bilhão = 10^9, trilhão = 10^12. */
const STEPS: [number, string, string][] = [
  [1e12, "tri", "trilhão"],
  [1e9, "bi", "bilhão"],
  [1e6, "mi", "milhão"],
  [1e3, "mil", "mil"],
];

/** R$ 162,9 bi · R$ 409 mil · R$ 850. Para rótulos curtos (mobile). */
export function formatCompact(value: number): string {
  // R$ 1.621, não "R$ 1,6 mil"; centavos só quando existem (R$ 810,50)
  if (Math.abs(value) < 10_000) return Number.isInteger(value) ? brl.format(value) : brl2.format(value);
  for (const [size, short] of STEPS) {
    if (Math.abs(value) >= size) return `R$ ${dec.format(value / size)} ${short}`;
  }
  return brl.format(value);
}

/** R$ 162,9 bilhões · R$ 1,7 milhão. Para texto corrido. */
export function formatLong(value: number): string {
  for (const [size, , long] of STEPS) {
    if (Math.abs(value) >= size) {
      const n = value / size;
      const plural = long === "mil" || Math.abs(n) < 2 ? long : long.replace("ão", "ões");
      return `R$ ${dec.format(n)} ${plural}`;
    }
  }
  return brl.format(value);
}

/** Valor exato: R$ 162.900.000.000. */
export function formatFull(value: number): string {
  return brl.format(value);
}

/** "490 mil vezes", "4 vezes", "1,5 vez". */
export function formatTimes(ratio: number): string {
  if (ratio >= 1e6) return `${dec.format(ratio / 1e6)} ${ratio < 1.95e6 ? "milhão" : "milhões"} de vezes`;
  if (ratio >= 1e3) return `${dec.format(ratio / 1e3)} mil vezes`;
  if (ratio >= 2) return `${dec.format(ratio)} vezes`;
  return `${dec.format(ratio)} vez`;
}

/** Número compacto sem moeda: 13,9 · 252 · 4,5 mi. */
function compactNumber(n: number): string {
  if (Math.abs(n) < 100) return dec.format(n);
  if (Math.abs(n) < 1000) return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
  for (const [size, short] of STEPS) {
    if (Math.abs(n) >= size) return `${dec.format(n / size)} ${short}`;
  }
  return dec.format(n);
}

/** Número compacto sem moeda (pixels, telas): 14 · 252 · 4,5 mi. */
export function formatNumber(n: number): string {
  return compactNumber(n);
}

/** Valor em salários mínimos, por extenso: "13,9 salários mínimos", "1 salário mínimo". */
export function formatSM(value: number, salarioMinimo: number): string {
  const n = value / salarioMinimo;
  return `${compactNumber(n)} ${n < 1.95 ? "salário mínimo" : "salários mínimos"}`;
}

/** Comprimento em português: "25 cm", "4,6 m", "330 m", "83 km", "1.846 km". */
export function formatLength(m: number): string {
  if (m < 1) return `${Math.round(m * 100)} cm`;
  if (m < 10) return `${dec.format(m)} m`;
  if (m < 1000) return `${Math.round(m)} m`;
  const km = m / 1000;
  if (km < 10) return `${dec.format(km)} km`;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(km)} km`;
}

/** Volume: "0,3 litro", "12 litros", "12 m³", "1.957 m³". */
export function formatVolume(m3: number): string {
  if (m3 < 1) {
    const l = m3 * 1000;
    return l < 10 ? `${dec.format(l)} ${l < 2 ? "litro" : "litros"}` : `${Math.round(l).toLocaleString("pt-BR")} litros`;
  }
  return m3 < 100 ? `${dec.format(m3)} m³` : `${Math.round(m3).toLocaleString("pt-BR")} m³`;
}

/** Duração curta (rótulos): "8 meses", "7,7 anos", "169 anos", "483 mil anos", "8,4 mi anos". */
export function formatYears(y: number): string {
  if (y < 1) {
    const m = Math.max(Math.round(y * 12), 1);
    return `${m} ${m < 2 ? "mês" : "meses"}`;
  }
  if (y < 1.95) return `${dec.format(y)} ano`;
  if (y < 100) return `${dec.format(y)} anos`;
  if (y < 1000) return `${Math.round(y)} anos`;
  if (y < 1e6) return `${dec.format(y / 1000)} mil anos`;
  return `${dec.format(y / 1e6)} mi anos`;
}

/** Duração por extenso (texto corrido): "8,4 milhões de anos". */
export function formatYearsLong(y: number): string {
  if (y < 1e6) return formatYears(y);
  const n = y / 1e6;
  return `${dec.format(n)} ${n < 1.95 ? "milhão" : "milhões"} de anos`;
}

/** Quantidade de pessoas em texto: "1,5 milhão de pessoas", "152,8 milhões de pessoas", "255 pessoas". */
export function formatPeople(n: number): string {
  if (n >= 1e6) {
    const m = n / 1e6;
    return `${dec.format(m)} ${m < 1.95 ? "milhão" : "milhões"} de pessoas`;
  }
  if (n >= 1000) return `${dec.format(n / 1000)} mil pessoas`;
  return `${Math.round(n)} ${n < 2 ? "pessoa" : "pessoas"}`;
}

/**
 * Valor de ESTIMATIVA: 2 algarismos significativos e sem centavos ("R$ 6,7 mil", "R$ 76 mil", "R$ 7,4 mi").
 * Estimativa não deve parecer exata (R$ 6.682,11 passaria precisão que o modelo não tem).
 */
export function formatApprox(value: number): string {
  const v = Number(value.toPrecision(2));
  if (v >= 1_000 && v < 10_000) return `R$ ${dec.format(v / 1000)} mil`;
  return formatCompact(v);
}
