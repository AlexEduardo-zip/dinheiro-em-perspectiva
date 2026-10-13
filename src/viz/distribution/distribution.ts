import { entityById, facts } from "../../data";
import { bottomHalfMaxShare, estimateTop1 } from "../../lib/concentration";
import { formatApprox, formatCompact, formatLong, formatNumber, formatPeople } from "../../lib/format";
import { estimateMeanPosition, estimateQuartiles } from "../../lib/wealth-model";
import { INK, NAVY, RED, RED_INK } from "../colors";
import type { Visualization } from "../types";

/**
 * Distribuição (ADR-026, ADR-029, ADR-031, ADR-033): como o patrimônio está distribuído e como seria se fosse dividido por igual.
 *  1. "Toda a riqueza do país, hoje": valor absoluto (estimativa) e uma barra dividida no adulto do meio, com 77 bolinhas
 *     de cada lado (1 bolinha = 1 milhão de pessoas): apertadas à esquerda, espaçadas à direita.
 *  2. "E se fosse igual para todos?": cada adulto teria a MÉDIA; quantos teriam mais e quantos teriam menos, com um
 *     gráfico na mesma escala do gráfico da fila (1 px = R$ 500) e traços do patrimônio de hoje em alguns pontos da fila.
 * Textos curtos: o gráfico fala por si (ADR-033, docs/LINGUAGEM.md). Os cortes e o ponto da média na fila são ESTIMATIVA
 * (lib/wealth-model.ts); o que é certo: pelo menos 50% dos adultos teriam mais. Sem escala log (ADR-007).
 */

const BRL_PER_PX = 500; // 1 px de altura = R$ 500 (mesma escala do gráfico da fila no 1% mais rico)
const AXIS_H = 64; // faixa do eixo no alto (px): rótulos e a faixa "teriam mais / teriam menos"
const PEOPLE_PER_DOT = 1_000_000; // cada bolinha = 1 milhão de pessoas
const DOT_PITCH = 5.6; // espaço mínimo por bolinha na grade apertada da esquerda (bolinha de 5 px)
const BAR_MIN_H = 150; // altura mínima da barra (px): ela é bem alta para as bolinhas respirarem
const pct = (f: number, d = 1) => (f * 100).toLocaleString("pt-BR", { maximumFractionDigits: d });

export const distribution: Visualization = {
  id: "distribuicao",
  title: "Distribuição",
  question: "E se todo o patrimônio fosse dividido por igual?",
  status: "ready",
  mount(el) {
    const median = entityById("adulto-mediano")!;
    const mean = entityById("adulto-medio")!;
    const adults = facts.find((f) => f.id === "adultos-18")!.value;
    const topShare = facts.find((f) => f.id === "top1-share")!.value;

    const low = bottomHalfMaxShare(median.valueBRL, mean.valueBRL);
    const qs = estimateQuartiles({ median: median.valueBRL, mean: mean.valueBRL, top1SharePct: topShare });
    const mp = estimateMeanPosition({ median: median.valueBRL, mean: mean.valueBRL, top1SharePct: topShare });
    const est = estimateTop1({ adults, meanWealth: mean.valueBRL, top1SharePct: topShare });
    const totalWealth = est.totalWealth; // adultos × média (estimativa)
    const dots = Math.round(adults / 2 / PEOPLE_PER_DOT); // 77 bolinhas de cada lado do adulto do meio

    const more = mp.belowMean; // fração que teria MAIS (hoje tem menos que a média)
    const less = 1 - more; // fração que teria MENOS
    const h = (v: number) => v / BRL_PER_PX;
    const wallPx = h(mean.valueBRL); // altura da "parede" de "todos iguais"
    const p95Px = h(mp.p95);
    const plotH = AXIS_H + p95Px + 80;

    // traços pendurados no eixo, com o valor na ponta; x em % da fila
    const stick = (xPct: number, value: number, title: string, color: string, estimate: boolean, shift = 0) => `
      <div class="esc-stick" style="left:${xPct}%;top:${AXIS_H}px;height:${Math.max(h(value), 2)}px;background:${color}"><i style="background:${color}"></i></div>
      <div class="esc-stick-label" style="left:${xPct}%;margin-left:${shift}px;top:${AXIS_H + Math.max(h(value), 2) + 8}px"><span>${title}</span><b>${estimate ? "≈ " + formatApprox(value) : formatCompact(value)}</b></div>`;

    el.className = "esc dst";
    el.innerHTML = `
      <p class="esc-lead">Adultos em fila, do mais pobre ao mais rico. A pessoa do meio tem <strong>${formatCompact(median.valueBRL)}</strong>; a média é <strong>${formatCompact(mean.valueBRL)}</strong>.</p>

      <section class="esc-split" aria-label="Toda a riqueza do país dividida no adulto do meio">
        <div class="esc-split-title">Toda a riqueza do país, hoje</div>
        <div class="dst-total"><b>≈ ${formatLong(totalWealth)}</b></div>
        <div class="esc-pointer" style="left:${low * 100}%"><span>▼ adulto do meio</span></div>
        <div class="esc-wbar dst-dotbar" role="img" aria-label="Antes do adulto do meio: no máximo ${pct(low)}% da riqueza, com ${dots} milhões de pessoas apertadas. Depois: pelo menos ${pct(1 - low)}%, com ${dots} milhões de pessoas espaçadas.">
          <div class="esc-before" style="width:${low * 100}%"><div class="dst-dots dst-dots-l"></div></div>
          <div class="esc-after"><div class="dst-dots dst-dots-r"></div></div>
        </div>
        <p class="dst-dotkey"><i class="dst-dot dst-dot-key"></i> = 1 milhão de pessoas</p>
        <div class="esc-shares">
          <div class="esc-s-before"><b>até ${pct(low)}%</b><em>≈ ${formatLong(totalWealth * low)}</em><span>Metade mais pobre</span></div>
          <div class="esc-s-after"><b>pelo menos ${pct(1 - low)}%</b><em>≈ ${formatLong(totalWealth * (1 - low))}</em><span>Metade mais rica</span></div>
        </div>
      </section>

      <section class="dst-ideal" aria-label="E se a riqueza fosse dividida por igual?">
        <div class="esc-split-title">E se fosse igual para todos?</div>
        <p class="dst-lead">Cada adulto teria <strong>${formatCompact(mean.valueBRL)}</strong>.</p>

        <div class="dst-cards">
          <article class="dst-card more">
            <h3>Teriam mais</h3>
            <div class="dst-n">≈ ${formatPeople(more * adults)}</div>
            <p>${pct(more, 0)}% dos adultos</p>
          </article>
          <article class="dst-card less">
            <h3>Teriam menos</h3>
            <div class="dst-n">≈ ${formatPeople(less * adults)}</div>
            <p>${pct(less, 0)}% dos adultos</p>
          </article>
        </div>

        <p class="dst-hint">Cada pixel de altura vale <b>${formatCompact(BRL_PER_PX)}</b>. A parede azul é o "todos iguais". Os traços são o que cada ponto da fila tem hoje.</p>

        <div class="esc-plot" style="height:${plotH}px">
          <div class="esc-axis" style="height:${AXIS_H}px">
            <span class="esc-ax-l">← mais pobre</span><span class="esc-ax-r">mais rico →</span>
            <span class="esc-ax-t" style="left:25%">25%</span><span class="esc-ax-t esc-ax-med" style="left:50%">50%</span><span class="esc-ax-t" style="left:75%">75%</span><span class="esc-ax-t esc-ax-mean" style="left:${more * 100}%">${pct(more, 0)}%</span><span class="esc-ax-t" style="left:95%">95%</span>
            <div class="dst-zone"><i class="dst-zone-more" style="width:${more * 100}%">teriam mais</i><i class="dst-zone-less">menos</i></div>
          </div>
          <div class="esc-base" style="top:${AXIS_H}px"></div>
          <div class="dst-wall" style="top:${AXIS_H}px;height:${wallPx}px"><span>Todos iguais: ${formatCompact(mean.valueBRL)}</span></div>
          ${stick(25, qs.p25, "25% da fila", RED, true)}
          ${stick(50, median.valueBRL, "adulto do meio", RED_INK, false)}
          ${stick(75, qs.p75, "75% da fila", RED, true, -14)}
          ${stick(more * 100, mean.valueBRL, "média", INK, false, -22)}
          ${stick(95, mp.p95, "95% da fila", NAVY, true, -22)}
        </div>
      </section>

      <details class="esc-how">
        <summary>Como calculamos</summary>
        <p class="esc-note">Riqueza total = ${formatNumber(adults)} adultos (IBGE) × ${formatCompact(mean.valueBRL)} de média (UBS). Pelo menos ${formatPeople(adults / 2)} teriam mais, porque estão abaixo do adulto do meio. Os valores de 25%, 75%, 95% e o ponto da média (${pct(more, 0)}% da fila) são estimativas.</p>
      </details>
      <a class="esc-link" href="#top1">Ver o 1% mais rico →</a>`;

    // ---- bolinhas: 77 de cada lado; esquerda apertada (grade compacta), direita espaçada (grade larga) ----
    const bar = el.querySelector<HTMLElement>(".dst-dotbar")!;
    const dotsL = el.querySelector<HTMLElement>(".dst-dots-l")!;
    const dotsR = el.querySelector<HTMLElement>(".dst-dots-r")!;
    const mk = () => {
      const f = document.createDocumentFragment();
      for (let i = 0; i < dots; i++) {
        const d = document.createElement("i");
        d.className = "dst-dot";
        f.append(d);
      }
      return f;
    };
    dotsL.append(mk());
    dotsR.append(mk());
    function layoutDots() {
      const barW = bar.clientWidth;
      const segL = Math.max(barW * low, DOT_PITCH);
      // Esquerda: a grade preenche a altura toda da barra (distribuição uniforme), continuando apertada na largura.
      const fit = Math.max(1, Math.floor(segL / DOT_PITCH));
      let H = BAR_MIN_H;
      let colsL = Math.max(1, Math.min(fit, Math.round(Math.sqrt((dots * segL) / H))));
      let rowsL = Math.ceil(dots / colsL);
      if (rowsL * DOT_PITCH + 16 > H) {
        // trecho muito estreito: a barra cresce o necessário para caber a grade
        colsL = fit;
        rowsL = Math.ceil(dots / colsL);
        H = Math.round(rowsL * DOT_PITCH + 16);
      }
      bar.style.height = `${H}px`;
      dotsL.style.gridTemplateColumns = `repeat(${colsL}, 1fr)`;
      dotsL.style.gridTemplateRows = `repeat(${rowsL}, 1fr)`;
      dotsL.style.gridAutoFlow = "column"; // enche coluna por coluna: sem "sobra" solitária numa última linha
      const rowsR = 7;
      dotsR.style.gridTemplateColumns = `repeat(${Math.ceil(dots / rowsR)}, 1fr)`;
      dotsR.style.gridTemplateRows = `repeat(${rowsR}, 1fr)`;
    }
    const ro = new ResizeObserver(layoutDots);
    ro.observe(bar);
    layoutDots();

    return () => {
      ro.disconnect();
      el.className = "";
      el.replaceChildren();
    };
  },
};
