/**
 * Escalas visuais. SEM escala logarítmica: o objetivo do projeto é mostrar a diferença real de tamanho
 * (ADR-007). Os valores vão de ~R$ 20 mil a ~R$ 163 bi (razão ~7 milhões),
 * e a resposta a isso é zoom/rolagem, não compressão. Ver docs/VISUALIZACOES.md.
 */

/** Salário mínimo de 2026 em reais (igual a facts.json). Unidade-base do pixel-scroll: 1 px = 1 SM (ADR-010). */
export const SALARIO_MINIMO_BRL = 1621;

/**
 * Pixels para representar `value` quando 1 pixel = `brlPerPixel` reais (padrão: 1 salário mínimo).
 * Base do "scroll de pixels" (ver docs/VISUALIZACOES.md, viz #1).
 */
export function pixelsFor(value: number, brlPerPixel: number = SALARIO_MINIMO_BRL): number {
  return value / brlPerPixel;
}

/**
 * Altura máxima segura de um elemento rolável. Navegadores falham acima de ~33,5 milhões de px
 * (Chrome/Safari) e menos em alguns mobiles; usamos folga. Acima disso é preciso scroll VIRTUAL.
 */
export const MAX_SAFE_SCROLL_PX = 10_000_000;

/** Quantas "telas" (viewports) de rolagem um valor ocupa, dada a escala. */
export function viewportsFor(value: number, viewportHeightPx: number, brlPerPixel: number = SALARIO_MINIMO_BRL): number {
  return pixelsFor(value, brlPerPixel) / viewportHeightPx;
}

/** Altura (m) da pessoa de patrimônio médio no Desfile: convenção de Jan Pen (1971), adulto brasileiro ≈ 1,70 m. */
export const PARADE_AVG_HEIGHT_M = 1.7;

/** Altura de uma figura do Desfile: proporcional ao patrimônio, com a média (meanValue) medindo 1,70 m. */
export function paradeHeightM(value: number, meanValue: number): number {
  return (value / meanValue) * PARADE_AVG_HEIGHT_M;
}

// ---- Pilhas de notas (ADR-018) ----
/** Valor de face da nota usada nas pilhas (R$ 100). */
export const NOTE_VALUE_BRL = 100;
/** Comprimento e altura da cédula de R$ 100 (Banco Central, cartilha da Segunda Família do Real: 156 mm × 70 mm). */
export const NOTE_LENGTH_M = 0.156;
export const NOTE_WIDTH_M = 0.07;
/**
 * Espessura de UMA nota: 0,11 mm. ESTIMATIVA NÃO OFICIAL (o Banco Central não publica a espessura; o valor
 * vem de exercícios escolares e blogs, de baixa autoridade). Meça uma pilha real com paquímetro para trocar.
 */
export const NOTE_THICKNESS_M = 0.00011;
/** Piscina olímpica (50 m × 25 m × 2 m): 2.500 m³. */
export const OLYMPIC_POOL_M3 = 2_500;

export const notesFor = (valueBRL: number) => valueBRL / NOTE_VALUE_BRL;
/** Altura (m) de uma pilha de notas de R$ 100 que soma `valueBRL`. */
export const stackHeightM = (valueBRL: number) => notesFor(valueBRL) * NOTE_THICKNESS_M;
/** Volume (m³) da pilha: área da nota × altura. */
export const stackVolumeM3 = (valueBRL: number) => notesFor(valueBRL) * NOTE_LENGTH_M * NOTE_WIDTH_M * NOTE_THICKNESS_M;

// ---- Em anos de salário (ADR-019) ----
/** Salários recebidos por ano: 12 meses de salário mínimo (sem 13º nem férias: conta simples e conservadora). */
export const SALARIES_PER_YEAR = 12;
/** Ano de referência dos dados (patrimonio-brasil-2026.md): serve para dizer "começando em tal ano". */
export const REFERENCE_YEAR = 2026;
/** Carreira típica usada só como régua de comparação (suposição, não dado da base). */
export const CAREER_YEARS = 35;

/**
 * Anos de trabalho para juntar `valueBRL` recebendo 1 salário mínimo por mês e GUARDANDO TUDO, sem gastar,
 * sem juros, sem inflação e sem aumento. Irrealista de propósito: só dá noção de tamanho.
 */
export function yearsOfMinimumWage(valueBRL: number): number {
  return valueBRL / (SALARIO_MINIMO_BRL * SALARIES_PER_YEAR);
}
