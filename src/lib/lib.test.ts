import { describe, expect, it } from "vitest";
import { meioSalarioMinimo, salarioMinimo, validateData, wealthEntities } from "../data";
import { formatApprox, formatCompact, formatLength, formatLong, formatSM, formatTimes, formatVolume, formatYears, formatYearsLong } from "./format";
import { bottomHalfMaxShare, estimateTop1 } from "./concentration";
import { estimateMeanPosition, estimateQuartiles, fitWealthModel, normalCdf, normalInv } from "./wealth-model";
import { notesFor, yearsOfMinimumWage, paradeHeightM, pixelsFor, stackHeightM, stackVolumeM3, SALARIO_MINIMO_BRL, viewportsFor } from "./scale";

describe("format", () => {
  it("compacta valores", () => {
    expect(formatCompact(162_900_000_000)).toBe("R$ 162,9 bi");
    expect(formatCompact(409_000)).toBe("R$ 409 mil");
    expect(formatCompact(810.5).replace(/ /g, " ")).toBe("R$ 810,50"); // Intl usa espaço não separável
    expect(formatCompact(1621).replace(/ /g, " ")).toBe("R$ 1.621");
    expect(formatCompact(1_860_000_000_000)).toBe("R$ 1,9 tri");
  });
  it("formata por extenso com plural", () => {
    expect(formatLong(1_700_000)).toBe("R$ 1,7 milhão");
    expect(formatLong(66_100_000_000)).toBe("R$ 66,1 bilhões");
  });
  it("salários mínimos", () => {
    expect(formatSM(22_500, 1621)).toBe("13,9 salários mínimos");
    expect(formatSM(409_000, 1621)).toBe("252 salários mínimos");
    expect(formatSM(1621, 1621)).toBe("1 salário mínimo");
    expect(formatSM(162_900_000_000, 1621)).toBe("100,5 mi salários mínimos");
  });
  it("estimativas arredondadas (2 algarismos)", () => {
    expect(formatApprox(6682.11)).toBe("R$ 6,7 mil");
    expect(formatApprox(75508)).toBe("R$ 76 mil");
    expect(formatApprox(7_395_000)).toBe("R$ 7,4 mi");
  });
  it("razões", () => {
    expect(formatTimes(490_000)).toBe("490 mil vezes");
    expect(formatTimes(4)).toBe("4 vezes");
  });
});

describe("desfile", () => {
  it("a média mede 1,70 m e a altura é proporcional", () => {
    expect(paradeHeightM(150_000, 150_000)).toBeCloseTo(1.7, 10);
    expect(paradeHeightM(22_500, 150_000)).toBeCloseTo(0.255, 10);
    expect(paradeHeightM(162_900_000_000, 150_000)).toBeCloseTo(1_846_200, 0);
  });
  it("formata comprimentos", () => {
    expect(formatLength(0.25)).toBe("25 cm");
    expect(formatLength(4.6)).toBe("4,6 m");
    expect(formatLength(330)).toBe("330 m");
    expect(formatLength(9_000)).toBe("9 km");
    expect(formatLength(82_700)).toBe("83 km");
    expect(formatLength(1_846_200)).toBe("1.846 km");
  });
});

describe("pilhas de notas", () => {
  it("conta notas e altura", () => {
    expect(notesFor(1_000_000)).toBe(10_000);
    expect(stackHeightM(1_000_000)).toBeCloseTo(1.1, 10);
    expect(stackHeightM(162_900_000_000)).toBeCloseTo(179_190, 0);
  });
  it("volume de R$ 1 bi e de Saverin", () => {
    expect(stackVolumeM3(1_000_000_000)).toBeCloseTo(12.012, 3);
    expect(stackVolumeM3(162_900_000_000)).toBeCloseTo(1956.9, 0);
  });
  it("formata volumes", () => {
    expect(formatVolume(0.00027)).toBe("0,3 litro");
    expect(formatVolume(0.012)).toBe("12 litros");
    expect(formatVolume(12.012)).toBe("12 m³");
    expect(formatVolume(1956.9)).toBe("1.957 m³");
  });
});

describe("anos de salário", () => {
  it("calcula anos com 12 salários mínimos por ano", () => {
    expect(yearsOfMinimumWage(19_452)).toBeCloseTo(1, 10);
    expect(yearsOfMinimumWage(150_000)).toBeCloseTo(7.71, 2);
    expect(yearsOfMinimumWage(162_900_000_000)).toBeCloseTo(8_374_000, -3);
  });
  it("formata durações", () => {
    expect(formatYears(0.5)).toBe("6 meses");
    expect(formatYears(1.2)).toBe("1,2 ano");
    expect(formatYears(7.7)).toBe("7,7 anos");
    expect(formatYears(169.4)).toBe("169 anos");
    expect(formatYears(483_000)).toBe("483 mil anos");
    expect(formatYears(8_374_000)).toBe("8,4 mi anos");
    expect(formatYearsLong(8_374_000)).toBe("8,4 milhões de anos");
  });
});

describe("concentração", () => {
  const est = estimateTop1({ adults: 154_346_198, meanWealth: 150_000, top1SharePct: 49.3 });
  it("pessoas e riqueza do 1% e dos outros 99%", () => {
    expect(est.topPeople).toBeCloseTo(1_543_462, 0);
    expect(est.totalWealth).toBeCloseTo(23_151_929_700_000, -3);
    expect(est.topWealth + est.restWealth).toBeCloseTo(est.totalWealth, 0);
    expect(est.topWealth / est.totalWealth).toBeCloseTo(0.493, 6);
  });
  it("média por pessoa: 49,3 e 50,7/99 vezes a média", () => {
    expect(est.topMean).toBeCloseTo(49.3 * 150_000, -2);
    expect(est.restMean).toBeCloseTo((50.7 / 99) * 100 * 150_000 / 100 * 1, -2);
    expect(est.topEqualsRestPeople).toBeCloseTo(49.3 / (50.7 / 99), 6);
  });
  it("teto da metade mais pobre", () => {
    expect(bottomHalfMaxShare(22_500, 150_000)).toBeCloseTo(0.075, 10);
    expect(bottomHalfMaxShare(20_000, 170_000)).toBeCloseTo(0.0588, 3);
    expect(bottomHalfMaxShare(25_000, 150_000)).toBeCloseTo(0.0833, 3);
  });
});

describe("modelo de riqueza (P25 e P75 estimados)", () => {
  it("normal: acumulada e inversa", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalInv(0.975)).toBeCloseTo(1.96, 2);
  });
  it("reproduz mediana, média e fatia do 1%", () => {
    const m = fitWealthModel({ median: 22_500, mean: 150_000, top1SharePct: 49.3 });
    expect(m.quantile(0.5)).toBeCloseTo(22_500, 0);
    expect(m.mean).toBeCloseTo(150_000, -2);
    expect(m.top1Share * 100).toBeCloseTo(49.3, 0);
  });
  it("a metade mais pobre fica abaixo do teto rigoroso de 7,5%", () => {
    const m = fitWealthModel({ median: 22_500, mean: 150_000, top1SharePct: 49.3 });
    expect(m.bottomHalfShare).toBeLessThan(bottomHalfMaxShare(22_500, 150_000));
  });
  it("P25 e P75 estimados: ordem de grandeza estável entre pontos de emenda", () => {
    const q = estimateQuartiles({ median: 22_500, mean: 150_000, top1SharePct: 49.3 });
    expect(q.p25).toBeGreaterThan(5_000);
    expect(q.p25).toBeLessThan(8_000);
    expect(q.p75).toBeGreaterThan(70_000);
    expect(q.p75).toBeLessThan(90_000);
    expect(q.p25).toBeLessThan(22_500);
    expect(q.p75).toBeGreaterThan(22_500);
    expect(q.p75Range[0]).toBeLessThanOrEqual(q.p75);
    expect(q.p75Range[1]).toBeGreaterThanOrEqual(q.p75);
  });
});

describe("posição da média na fila (cenário ideal)", () => {
  const r = estimateMeanPosition({ median: 22_500, mean: 150_000, top1SharePct: 49.3 });
  it("a maioria dos adultos tem menos que a média, e pelo menos a metade com certeza", () => {
    expect(r.belowMean).toBeGreaterThan(0.5);
    expect(r.belowMean).toBeGreaterThan(0.8);
    expect(r.belowMean).toBeLessThan(0.9);
  });
  it("a faixa contém o valor central", () => {
    expect(r.belowMeanRange[0]).toBeLessThanOrEqual(r.belowMean);
    expect(r.belowMeanRange[1]).toBeGreaterThanOrEqual(r.belowMean);
  });
  it("o patrimônio no percentil encontrado é a média", () => {
    expect(r.model.quantile(r.belowMean)).toBeCloseTo(150_000, -2);
  });
  it("P95 fica acima da média", () => {
    expect(r.p95).toBeGreaterThan(150_000);
  });
});


describe("pixel = salário mínimo", () => {
  it("1 px por salário mínimo", () => {
    expect(pixelsFor(SALARIO_MINIMO_BRL)).toBe(1);
    expect(Math.round(pixelsFor(22_500))).toBe(14);
    expect(Math.round(pixelsFor(162_900_000_000))).toBe(100_493_523);
  });
  it("telas de rolagem", () => {
    expect(viewportsFor(162_900_000_000, 800)).toBeCloseTo(125_617, 0);
  });
});

describe("dados", () => {
  it("passam na validação de integridade", () => {
    expect(validateData()).toEqual([]);
  });
  it("salário mínimo de referência bate com a constante e não vira patrimônio", () => {
    expect(salarioMinimo.valueBRL).toBe(SALARIO_MINIMO_BRL);
    expect(wealthEntities().some((e) => e.id === salarioMinimo.id)).toBe(false);
  });
  it("meio salário mínimo é exatamente metade", () => {
    expect(meioSalarioMinimo.valueBRL * 2).toBe(salarioMinimo.valueBRL);
  });
  it("wealthEntities vem ordenado e sem renda", () => {
    const list = wealthEntities();
    expect(list.every((e) => e.measure === "wealth")).toBe(true);
    for (let i = 1; i < list.length; i++) expect(list[i - 1]!.valueBRL).toBeGreaterThanOrEqual(list[i]!.valueBRL);
  });
});
