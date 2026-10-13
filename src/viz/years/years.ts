import { timeLandmarks } from "../../data/landmarks";
import { formatCompact, formatNumber, formatYears, formatYearsLong } from "../../lib/format";
import { CAREER_YEARS, REFERENCE_YEAR, SALARIES_PER_YEAR, SALARIO_MINIMO_BRL, yearsOfMinimumWage } from "../../lib/scale";
import { type DrawArgs, type HeightConfig, mountHeightViz } from "../height-engine";
import type { Visualization } from "../types";

const PILLAR_W = 22; // largura fixa da coluna (px)
const MIN_TICK_PX = 5; // a partir daqui cada marca (1, 10, 100... anos) aparece na coluna
const LEVELS = 8; // marcas de 10^0 a 10^8 anos

/**
 * Coluna de anos de trabalho: altura = anos para juntar o patrimônio recebendo 1 salário mínimo por mês e
 * guardando tudo. Marcas na coluna a cada 1, 10, 100... anos (cada uma quando tem ≥ 5 px), então perto
 * do zoom máximo dá para contar os anos. As referências são marcos históricos "há tantos anos"
 * (data/landmarks.ts: carreira, 1500, pirâmide, primeiros humanos...). Motor: ../height-engine.ts. ADR-019.
 */
export function drawPillar(g: CanvasRenderingContext2D, { cx, gy, hpx, ppm, color, selected }: DrawArgs) {
  const w = PILLAR_W;
  const left = cx - w / 2;
  const top = Math.max(gy - hpx, -4);
  g.globalAlpha = 0.88;
  g.fillStyle = color;
  g.fillRect(left, top, w, gy - top);
  g.globalAlpha = 1;
  g.fillStyle = "rgba(31,42,61,0.16)";
  g.fillRect(left + w * 0.8, top, w * 0.2, gy - top);

  // Marcas de 1, 10, 100... anos. DESEMPENHO (ADR-028): só os níveis cujo espaçamento cabe na tela e é visível
  // (entre MIN_TICK_PX e a altura do palco). Antes todos os níveis de 1 ano para cima eram percorridos mesmo com
  // espaçamento de 0,00002 px, o que dava ~32 milhões de operações por quadro no zoom mais afastado.
  if (ppm > 0 && Number.isFinite(ppm)) {
    const minLevel = Math.max(0, Math.ceil(Math.log10(MIN_TICK_PX / ppm))); // primeiro nível com espaçamento >= MIN_TICK_PX
    const topLevel = Math.min(LEVELS, Math.floor(Math.log10(gy / ppm))); // último com espaçamento <= altura do palco
    g.fillStyle = "#1F2A3D";
    for (let L = minLevel; L <= topLevel; L++) {
      const spacing = 10 ** L * ppm;
      const fade = Math.min((spacing - MIN_TICK_PX) / 6, 1);
      if (fade <= 0) continue;
      g.globalAlpha = fade * (0.25 + 0.08 * L);
      const thick = L === topLevel ? 2 : 1;
      // no máximo o que aparece na tela (gy/espaçamento) e o que existe na coluna (hpx/espaçamento)
      const count = Math.min(Math.floor(hpx / spacing), Math.floor(gy / spacing) + 1);
      g.beginPath(); // um único traçado por nível (uma chamada de preenchimento em vez de uma por marca)
      for (let k = 1; k <= count; k++) {
        if (L < topLevel && k % 10 === 0) continue; // essa marca é desenhada pelo nível de cima
        const y = Math.round(gy - k * spacing);
        if (y < -2) break;
        g.rect(left, y, w, thick);
      }
      g.fill();
    }
  }
  g.globalAlpha = 1;
  if (selected) {
    g.strokeStyle = "#1F2A3D";
    g.lineWidth = 1.5;
    g.strokeRect(left - 2, top - 2, w + 4, gy - top + 4);
  }
}

export const years: Visualization = {
  id: "tempo",
  title: "Anos de trabalho",
  question: "Quantos anos de salário mínimo para juntar cada patrimônio?",
  status: "ready",
  mount(el, ctx) {
    const cfg: HeightConfig = {
      className: "par yrs",
      figures: (entities) =>
        entities
          .filter((e) => e.kind !== "aggregate")
          .sort((a, b) => a.valueBRL - b.valueBRL)
          .map((e) => ({ e, hm: yearsOfMinimumWage(e.valueBRL) })),
      landmarks: timeLandmarks,
      formatUnit: formatYears,
      meterText: (reach, pct) => `A tela mostra até ${reach} de trabalho · ${pct}%`,
      noteText:
        `Anos para juntar cada patrimônio ganhando 1 salário mínimo (${formatCompact(SALARIO_MINIMO_BRL)}) por mês e guardando tudo. As linhas tracejadas marcam fatos de tantos anos atrás.`,
      ariaLabel: "Colunas de anos de trabalho. Setas para cima e para baixo dão zoom; setas para os lados andam pela fila.",
      meterAria: "Quanto já foi afastado",
      legendAria: "Colunas inteiras na tela",
      emptyText: "Nenhuma coluna inteira na tela. Mexa no zoom ou arraste para o lado.",
      minSpacing: 88, // o rótulo "483 mil anos" é largo
      widthPx: () => PILLAR_W,
      // começa mostrando ~45 anos no quadro: uma carreira inteira cabe e as colunas maiores pedem zoom
      initialPpm: (frameH) => frameH / 45,
      // máximo: ~9 anos no quadro (dá para contar os anos nas colunas mais baixas)
      maxPpm: (frameH) => (frameH * 0.9) / 8,
      draw: drawPillar,
      line2: (f) => formatCompact(f.e.valueBRL),
      legendValue: (f) => `${formatYears(f.hm)} · ${formatCompact(f.e.valueBRL)}`,
      legendExtra: (f) => {
        const y = f.hm;
        const careers = y / CAREER_YEARS;
        return [
          careers >= 2
            ? `São ${formatNumber(careers)} carreiras de ${CAREER_YEARS} anos, uma depois da outra.`
            : `${Math.round(careers * 100)}% de uma carreira de ${CAREER_YEARS} anos.`,
          y < REFERENCE_YEAR
            ? `Teria sido preciso começar no ano ${Math.round(REFERENCE_YEAR - y)}.`
            : `Teria sido preciso começar há ${formatYearsLong(y)}.`,
        ];
      },
    };
    return mountHeightViz(el, ctx, cfg);
  },
};
