import { landmarks } from "../../data/landmarks";
import { formatCompact, formatLength, formatNumber, formatVolume } from "../../lib/format";
import {
  NOTE_LENGTH_M,
  NOTE_THICKNESS_M,
  NOTE_VALUE_BRL,
  notesFor,
  OLYMPIC_POOL_M3,
  PARADE_AVG_HEIGHT_M,
  stackHeightM,
  stackVolumeM3,
} from "../../lib/scale";
import { type DrawArgs, type HeightConfig, mountHeightViz } from "../height-engine";
import { INK } from "../colors";
import type { Visualization } from "../types";

/** A cédula de R$ 100 é azul-turquesa (Banco Central); aqui usamos um azul bem claro, neutro, da paleta do site. */
const NOTE_COLOR = "#BCD0EE"; // azul-acinzentado bem claro: a nota é neutra; a tampa na cor do grupo diz de quem é
const NOTE_COLOR_DARK = "#9BB4DA";
const MIN_NOTE_PX = 2; // a partir daqui cada nota vira uma linha visível na pilha

/**
 * Pilha de notas: uma torre de cédulas de R$ 100 por patrimônio. Altura = nº de notas × espessura da nota
 * (0,11 mm, estimativa não oficial: ver lib/scale.ts) e LARGURA verdadeira (15,6 cm = comprimento da nota),
 * então as torres altas viram agulhas finas (diferente do Desfile, de largura fixa). Ao aproximar até a
 * nota ter 2 px aparecem as notas uma a uma. Motor compartilhado: ../height-engine.ts. ADR-018.
 */
export function drawStack(g: CanvasRenderingContext2D, { cx, gy, hpx, wpx, ppm, color, selected }: DrawArgs) {
  const top = Math.max(gy - hpx, -4);
  const w = Math.max(wpx, 1.5);
  const left = cx - w / 2;
  g.fillStyle = NOTE_COLOR;
  g.fillRect(left, top, w, gy - top);
  // lado direito mais escuro: dá volume
  if (w > 6) {
    g.fillStyle = NOTE_COLOR_DARK;
    g.fillRect(left + w * 0.86, top, w * 0.14, gy - top);
  }
  // notas uma a uma, quando cada uma tem pelo menos MIN_NOTE_PX
  const notePx = NOTE_THICKNESS_M * ppm;
  if (notePx >= MIN_NOTE_PX) {
    g.fillStyle = "rgba(31,42,61,0.22)";
    const a = Math.min((notePx - MIN_NOTE_PX) / 2, 1);
    g.globalAlpha = a;
    for (let y = gy - notePx; y > Math.max(top, -1); y -= notePx) g.fillRect(left, Math.round(y), w, 1);
    g.globalAlpha = 1;
  }
  // tampa na cor do grupo (liga a pilha à legenda e às outras visualizações)
  if (gy - hpx >= -2) {
    g.fillStyle = color;
    g.fillRect(left, top - 2, w, Math.max(2, Math.min(4, hpx * 0.04)));
  }
  if (selected) {
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    g.strokeRect(left - 2, top - 2, w + 4, gy - top + 4);
  }
}

export const notes: Visualization = {
  id: "notas",
  title: "Pilhas de notas",
  question: "Que altura teria uma pilha de notas de R$ 100 de cada patrimônio?",
  status: "ready",
  mount(el, ctx) {
    const cfg: HeightConfig = {
      className: "par stk",
      figures: (entities) =>
        entities
          .filter((e) => e.kind !== "aggregate")
          .sort((a, b) => a.valueBRL - b.valueBRL)
          .map((e) => ({ e, hm: stackHeightM(e.valueBRL) })),
      landmarks: [{ label: "Pessoa", meters: PARADE_AVG_HEIGHT_M }, ...landmarks],
      noteText:
        `Notas de R$ ${NOTE_VALUE_BRL} empilhadas até somar o patrimônio. Cada nota tem 0,11 mm (valor estimado). ` +
        "Arraste para o lado; mexa no zoom.",
      ariaLabel: "Pilhas de notas. Setas para cima e para baixo dão zoom; setas para os lados andam pela fila.",
      meterAria: "Quanto já foi afastado",
      legendAria: "Pilhas inteiras na tela",
      emptyText: "Nenhuma pilha inteira na tela. Mexa no zoom ou arraste para o lado.",
      widthPx: (ppm) => NOTE_LENGTH_M * ppm,
      minSpacing: 84, // o rótulo "124 mil notas" é largo
      // começa mostrando uma pessoa (1,70 m) em 30% do quadro: as primeiras pilhas ficam pequenas e as altas pedem zoom
      initialPpm: (frameH) => (frameH * 0.3) / PARADE_AVG_HEIGHT_M,
      // máximo: cada nota com 3 px (dá para contar as notas)
      maxPpm: () => 3 / NOTE_THICKNESS_M,
      draw: drawStack,
      line2: (f) => `${formatNumber(notesFor(f.e.valueBRL))} ${notesFor(f.e.valueBRL) < 2 ? "nota" : "notas"}`,
      legendValue: (f) => `${formatLength(f.hm)} · ${formatNumber(notesFor(f.e.valueBRL))} notas`,
      legendExtra: (f) => {
        const people = f.hm / PARADE_AVG_HEIGHT_M;
        const v = stackVolumeM3(f.e.valueBRL);
        const pools = v / OLYMPIC_POOL_M3;
        return [
          people >= 1
            ? `${formatNumber(people)} ${people < 2 ? "vez" : "vezes"} a altura de uma pessoa.`
            : `${Math.round(people * 100)}% da altura de uma pessoa.`,
          `Volume: ${formatVolume(v)}` + (pools >= 0.05 ? ` (≈ ${pools < 10 ? pools.toFixed(1).replace(".", ",") : Math.round(pools)} ${pools < 1.5 ? "piscina olímpica" : "piscinas olímpicas"})` : ""),
        ];
      },
    };
    return mountHeightViz(el, ctx, cfg);
  },
};
