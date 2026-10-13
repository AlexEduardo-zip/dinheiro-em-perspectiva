import { describe, expect, it } from "vitest";
import { entityById, salarioMinimo, meioSalarioMinimo, wealthEntities } from "../data";
import { entityColor, isWorkingClass, RICH_COLORS, WORKING_CLASS_MAX_BRL, WORKING_COLORS } from "./colors";

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
/** Distância entre cores no espaço RGB (0 a ~441). Não é perceptual, mas pega vizinhas parecidas demais. */
const dist = (a: string, b: string) => {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
};

const all = [meioSalarioMinimo, salarioMinimo, ...wealthEntities().filter((e) => e.kind !== "aggregate")].sort((a, b) => a.valueBRL - b.valueBRL);

describe("paleta por pessoa/grupo (ADR-034)", () => {
  it("o limite da classe trabalhadora é o dono de cartório", () => {
    expect(WORKING_CLASS_MAX_BRL).toBe(entityById("cartorio")!.valueBRL);
    expect(isWorkingClass(entityById("cartorio")!)).toBe(true);
    expect(isWorkingClass(entityById("private-conta")!)).toBe(false);
  });

  it("quem é da classe trabalhadora tem tom quente e os mais ricos têm tom de azul", () => {
    for (const e of all) {
      const [r, , b] = rgb(entityColor(e));
      if (isWorkingClass(e)) expect(r, `${e.id} deveria ser quente (vermelho > azul)`).toBeGreaterThan(b);
      else expect(b, `${e.id} deveria ser azul (azul > vermelho)`).toBeGreaterThan(r);
    }
  });

  it("toda pessoa/grupo tem uma cor própria na paleta certa (nenhuma sem cor ao entrar uma nova)", () => {
    for (const e of all) {
      const table = isWorkingClass(e) ? WORKING_COLORS : RICH_COLORS;
      expect(table[e.id], `sem cor para ${e.id}`).toBeTruthy();
    }
  });

  it("cores de vizinhos na escala de riqueza são bem diferentes entre si", () => {
    for (let i = 1; i < all.length; i++) {
      const a = all[i - 1]!;
      const b = all[i]!;
      if (isWorkingClass(a) !== isWorkingClass(b)) continue; // a passagem quente → azul já contrasta
      expect(dist(entityColor(a), entityColor(b)), `${a.id} × ${b.id}`).toBeGreaterThan(55);
    }
  });

  it("não há duas cores iguais dentro da mesma paleta", () => {
    for (const table of [WORKING_COLORS, RICH_COLORS]) {
      const v = Object.values(table);
      expect(new Set(v).size).toBe(v.length);
    }
  });
});
