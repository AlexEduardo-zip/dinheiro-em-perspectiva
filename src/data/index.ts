import entitiesJson from "./entities.json";
import factsJson from "./facts.json";
import sourcesJson from "./sources.json";
import type { Entity, Fact, Source } from "./types";

export const entities = entitiesJson as Entity[];
export const facts = factsJson as Fact[];
export const sources = sourcesJson as Source[];

export const sourceById = (id: string): Source | undefined => sources.find((s) => s.id === id);
export const entityById = (id: string): Entity | undefined => entities.find((e) => e.id === id);

/** Entidades de patrimônio, maiores primeiro. Renda nunca entra aqui (regra do projeto). */
export function wealthEntities(): Entity[] {
  return entities.filter((e) => e.measure === "wealth").sort((a, b) => b.valueBRL - a.valueBRL);
}

/** Checa integridade dos dados; usado nos testes e no dev. Retorna lista de problemas. */
export function validateData(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const e of entities) {
    if (ids.has(e.id)) problems.push(`id duplicado: ${e.id}`);
    ids.add(e.id);
    if (!sourceById(e.sourceId)) problems.push(`${e.id}: fonte inexistente (${e.sourceId})`);
    if (!(e.valueBRL > 0)) problems.push(`${e.id}: valor inválido`);
    if (e.confidence !== "alta" && !e.caveat) problems.push(`${e.id}: confiança ${e.confidence} exige caveat`);
    if (e.rangeBRL && (e.valueBRL < e.rangeBRL[0] || e.valueBRL > e.rangeBRL[1]))
      problems.push(`${e.id}: valor fora da faixa`);
  }
  for (const f of facts) if (!sourceById(f.sourceId)) problems.push(`fato ${f.id}: fonte inexistente`);
  return problems;
}

/**
 * Salário mínimo como entidade de REFERÊNCIA (régua), não de patrimônio: measure "income" mantém
 * wealthEntities() limpo (ADR-005). Valor vem de facts.json; teste garante que bate com SALARIO_MINIMO_BRL.
 */
const smFact = facts.find((f) => f.id === "salario-minimo")!;
export const salarioMinimo: Entity = {
  id: "salario-minimo",
  label: "1 salário mínimo",
  group: "geral",
  kind: "reference",
  measure: "income",
  unit: "pessoa",
  valueBRL: smFact.value,
  year: smFact.year,
  sourceId: smFact.sourceId,
  confidence: "media",
  caveat: "É uma medida de comparação (renda do mês), não um patrimônio.",
  mdSection: "8",
  summary: "O piso do salário mensal em 2026.",
};

/** Meio salário mínimo: o círculo central dos Sobrepostos (deixa o zoom mais amplo; ADR-012). */
export const meioSalarioMinimo: Entity = {
  ...salarioMinimo,
  id: "meio-salario-minimo",
  label: "½ salário mínimo",
  valueBRL: salarioMinimo.valueBRL / 2,
  summary: "Metade de um salário mínimo.",
};
