import { entityById, facts } from "../data";
import type { Entity } from "../data/types";
import { estimateQuartiles, percentileAtValue } from "./wealth-model";

let model: ReturnType<typeof estimateQuartiles>["model"] | null = null;

function getModel() {
  if (!model) {
    const median = entityById("adulto-mediano")!.valueBRL;
    const mean = entityById("adulto-medio")!.valueBRL;
    const top1SharePct = facts.find((f) => f.id === "top1-share")!.value;
    model = estimateQuartiles({ median, mean, top1SharePct }).model;
  }
  return model;
}

/** Fração (0 a 1) dos adultos com patrimônio menor que `value`, pelo modelo (estimativa, ADR-026). */
export const adultShareBelow = (value: number) => percentileAtValue(getModel(), value);

const pct = (p: number) => {
  const v = p * 100;
  if (v >= 99.99) return "mais de 99,99%";
  const d = v >= 99 ? 2 : v >= 10 ? 0 : 1;
  return `≈ ${v.toFixed(d).replace(".", ",")}%`;
};

/** "Mais que ≈ 62% dos adultos", só para patrimônio de pessoa (não família, agregado ou referência). */
export function shareText(e: Pick<Entity, "id" | "measure" | "kind" | "unit" | "valueBRL">): string | null {
  if (e.measure !== "wealth" || e.kind === "aggregate" || (e.unit !== "pessoa" && e.unit !== "adulto")) return null;
  if (e.id === "adulto-mediano") return "É o adulto do meio: metade tem menos, metade tem mais";
  return `Tem mais que ${pct(adultShareBelow(e.valueBRL))} dos adultos`;
}
