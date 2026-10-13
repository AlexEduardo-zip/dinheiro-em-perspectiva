import { describe, expect, it } from "vitest";
import { wealthEntities } from "../../data";
import { yearsOfMinimumWage } from "../../lib/scale";
import { drawPillar } from "./years";

/** Contexto 2D falso que só conta as chamadas (mede o trabalho por quadro sem navegador). */
function countingCtx() {
  const calls: Record<string, number> = {};
  const g = new Proxy({} as Record<string, unknown>, {
    get(_t, k: string) {
      return () => {
        calls[k] = (calls[k] ?? 0) + 1;
      };
    },
    set() {
      return true;
    },
  });
  return { g: g as unknown as CanvasRenderingContext2D, total: () => Object.values(calls).reduce((a, b) => a + b, 0) };
}

describe("desempenho das colunas (Em anos de salário), ADR-028", () => {
  const years = wealthEntities()
    .filter((e) => e.kind !== "aggregate")
    .map((e) => yearsOfMinimumWage(e.valueBRL));

  it("o custo por quadro fica limitado em qualquer zoom (de 1e-7 a 1e5 px por ano)", () => {
    let worst = 0;
    let worstPpm = 0;
    for (let exp = -7; exp <= 5; exp += 0.25) {
      const ppm = 10 ** exp;
      const c = countingCtx();
      for (const y of years) drawPillar(c.g, { cx: 100, gy: 180, hpx: y * ppm, wpx: 22, ppm, color: "#fff", selected: false });
      if (c.total() > worst) {
        worst = c.total();
        worstPpm = ppm;
      }
    }
    // antes da correção: ~32.000.000 no zoom mais afastado; hoje: poucas centenas
    expect(worst, `pior zoom: ${worstPpm} px/ano`).toBeLessThan(1500);
  });
});
