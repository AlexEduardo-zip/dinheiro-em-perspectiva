import { describe, expect, it } from "vitest";
import { entities, entityById } from "../data";
import { adultShareBelow, shareText } from "./percentil";

describe("percentual de adultos abaixo de cada patrimônio", () => {
  it("o adulto mediano fica em 50% e o texto é próprio", () => {
    expect(adultShareBelow(entityById("adulto-mediano")!.valueBRL)).toBeCloseTo(0.5, 2);
    expect(shareText(entityById("adulto-mediano")!)).toContain("metade");
  });
  it("cresce com o patrimônio e some para agregados e famílias", () => {
    const list = entities.filter((e) => shareText(e) && e.id !== "adulto-mediano").sort((a, b) => a.valueBRL - b.valueBRL);
    let prev = 0;
    for (const e of list) {
      const p = adultShareBelow(e.valueBRL);
      expect(p, e.id).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
    expect(shareText(entityById("top10-total")!)).toBeNull();
    expect(shareText(entityById("familia-media")!)).toBeNull();
  });
});
