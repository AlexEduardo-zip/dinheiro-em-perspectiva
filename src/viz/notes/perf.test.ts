import { describe, expect, it } from "vitest";
import { wealthEntities } from "../../data";
import { NOTE_LENGTH_M, stackHeightM } from "../../lib/scale";
import { drawStack } from "./notes";

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

describe("desempenho das pilhas de notas (ADR-028)", () => {
  const heights = wealthEntities()
    .filter((e) => e.kind !== "aggregate")
    .map((e) => stackHeightM(e.valueBRL));

  it("o custo por quadro fica limitado em qualquer zoom (de 1e-5 px/m até 3 px por nota)", () => {
    let worst = 0;
    let worstPpm = 0;
    const maxPpm = 3 / 0.00011;
    for (let exp = -5; exp <= Math.log10(maxPpm); exp += 0.25) {
      const ppm = 10 ** exp;
      const c = countingCtx();
      for (const hm of heights) drawStack(c.g, { cx: 100, gy: 180, hpx: hm * ppm, wpx: NOTE_LENGTH_M * ppm, ppm, color: "#fff", selected: false });
      if (c.total() > worst) {
        worst = c.total();
        worstPpm = ppm;
      }
    }
    expect(worst, `pior zoom: ${worstPpm} px/m`).toBeLessThan(3000);
  });
});
