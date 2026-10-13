import { entityById } from "../../data";
import { formatCompact, formatLength } from "../../lib/format";
import { PARADE_AVG_HEIGHT_M, paradeHeightM } from "../../lib/scale";
import { type DrawArgs, type HeightConfig, mountHeightViz } from "../height-engine";
import { INK } from "../colors";
import type { Visualization } from "../types";

const FIG_W = 24; // largura máxima de uma figura (px): todas "andam" lado a lado com a mesma largura

/** Uma figura em pé sobre o chão: cabeça, tronco e pernas; larguras fixas (a altura é o dado). */
function drawPerson(g: CanvasRenderingContext2D, { cx, gy, hpx, color, selected }: DrawArgs) {
  const w = Math.min(FIG_W, Math.max(1.5, hpx * 0.42));
  g.globalAlpha = 0.92;
  g.fillStyle = color;
  if (hpx < 8) {
    g.fillRect(cx - w / 2, gy - Math.max(hpx, 1.5), w, Math.max(hpx, 1.5));
  } else {
    const top = gy - hpx;
    const headD = Math.min(hpx * 0.13, w * 0.7);
    const bodyTop = top + headD + 1.5;
    const bodyW = w * 0.82;
    const legsTop = gy - hpx * 0.36;
    if (top >= -2) {
      g.beginPath();
      g.arc(cx, top + headD / 2, headD / 2, 0, Math.PI * 2);
      g.fill();
    }
    const bt = Math.max(bodyTop, -4);
    g.fillRect(cx - bodyW / 2, bt, bodyW, Math.max(legsTop - bt, 0));
    const legW = hpx > 24 ? bodyW * 0.44 : bodyW;
    g.fillRect(cx - bodyW / 2, legsTop, legW, gy - legsTop);
    if (hpx > 24) g.fillRect(cx + bodyW / 2 - legW, legsTop, legW, gy - legsTop);
  }
  g.globalAlpha = 1;
  if (selected) {
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    const top = Math.max(gy - hpx, -4);
    g.strokeRect(cx - w / 2 - 2, top - 2, w + 4, gy - top + 4);
  }
}

/**
 * Desfile (Jan Pen, 1971): cada figura tem ALTURA proporcional ao patrimônio, e a pessoa de patrimônio
 * médio (R$ 150 mil, UBS) mede 1,70 m. As figuras seguem em ordem crescente, lado a lado, sobre o chão.
 * Sem compressão (ADR-007): para ver as gigantes é preciso afastar o zoom, que é cansativo de propósito
 * (ADR-012). O motor (zoom, arrastar, referências, legenda) é compartilhado com as Pilhas de notas:
 * ../height-engine.ts. ADR-017.
 * Honestidade: não é uma fila de pessoas reais nem percentis; são os grupos e nomes que a base tem.
 */
export const parade: Visualization = {
  id: "paradinha",
  title: "Alturas",
  question: "Como seria a altura de cada um, se o dinheiro virasse altura?",
  status: "ready",
  mount(el, ctx) {
    const mean = entityById("adulto-medio")!.valueBRL;
    const cfg: HeightConfig = {
      className: "par",
      figures: (entities) =>
        entities
          .filter((e) => e.kind !== "aggregate")
          .sort((a, b) => a.valueBRL - b.valueBRL)
          .map((e) => ({ e, hm: paradeHeightM(e.valueBRL, mean) })),
      noteText:
        `A altura é proporcional ao patrimônio: o adulto médio (${formatCompact(mean)}) mede ${String(PARADE_AVG_HEIGHT_M).replace(".", ",")} m. ` +
        "Arraste para o lado; afaste o zoom para ver os mais altos.",
      ariaLabel: "Figuras com altura proporcional ao patrimônio. Setas para cima e para baixo dão zoom; setas para os lados andam pela fila.",
      meterAria: "Quanto já foi afastado",
      legendAria: "Figuras inteiras na tela",
      emptyText: "Nenhuma figura inteira na tela. Mexa no zoom ou arraste para o lado.",
      widthPx: () => FIG_W,
      initialPpm: (frameH) => (frameH * 0.5) / PARADE_AVG_HEIGHT_M,
      maxPpm: (frameH) => (frameH * 0.9) / PARADE_AVG_HEIGHT_M,
      draw: drawPerson,
      line2: (f) => formatCompact(f.e.valueBRL),
      legendValue: (f) => `${formatLength(f.hm)} · ${formatCompact(f.e.valueBRL)}`,
    };
    return mountHeightViz(el, ctx, cfg);
  },
};
