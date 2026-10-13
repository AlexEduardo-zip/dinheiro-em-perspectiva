import { entityById, facts } from "../data";
import { estimateTop1 } from "../lib/concentration";
import { formatApprox, formatCompact, formatNumber, formatPeople } from "../lib/format";
import { estimateQuartiles } from "../lib/wealth-model";
import { RED, RED_INK } from "./colors";

/**
 * "A fila em escala real" (ADR-024, ADR-025): gráfico VERTICAL. O eixo x fica no alto (adultos do mais pobre ao mais
 * rico, adulto mediano em 50%) e as barras CRESCEM PARA BAIXO, em escala linear de 1 px = R$ 500, sem limite de altura:
 * a barra do 1% mais rico tem dezenas de milhares de px, a página rola e um contador mostra por quantas telas já se
 * passou. Varas para os cortes de 25%, 50% e 75% (25% e 75% são ESTIMATIVA de modelo: ver lib/wealth-model.ts).
 * Hoje vive no fim da aba "1% mais rico". Devolve o HTML e uma função que liga o contador de telas.
 */

const BRL_PER_PX = 500; // 1 px de altura = R$ 500
const AXIS_H = 52; // altura da faixa do eixo x no alto do gráfico (px)
const TICKS = [50_000, 100_000, 250_000, 500_000, 1e6, 2e6, 3e6, 4e6, 5e6, 6e6, 7e6];

export function filaChart(): { html: string; attach: (root: HTMLElement) => () => void } {
  const median = entityById("adulto-mediano")!;
  const mean = entityById("adulto-medio")!;
  const adults = facts.find((f) => f.id === "adultos-18")!.value;
  const topShare = facts.find((f) => f.id === "top1-share")!.value;
  const bilMean = entityById("bilionarios-media")!;
  const saverin = entityById("saverin")!;
  const est = estimateTop1({ adults, meanWealth: mean.valueBRL, top1SharePct: topShare });
  const qs = estimateQuartiles({ median: median.valueBRL, mean: mean.valueBRL, top1SharePct: topShare });

  const barPx = est.topMean / BRL_PER_PX; // altura da barra do 1% (px): sem limite
  const plotH = AXIS_H + barPx + 90;
  const h = (v: number) => v / BRL_PER_PX;

  // varas (cortes de 25%, 50% e 75%) penduradas no eixo, com o valor na ponta
  const stick = (leftPct: number, value: number, title: string, color: string, estimate: boolean) => `
      <div class="esc-stick" style="left:${leftPct}%;top:${AXIS_H}px;height:${Math.max(h(value), 2)}px;background:${color}"><i style="background:${color}"></i></div>
      <div class="esc-stick-label" style="left:${leftPct}%;top:${AXIS_H + Math.max(h(value), 2) + 8}px"><span>${title}</span><b>${estimate ? "≈ " + formatApprox(value) : formatCompact(value)}</b></div>`;
  const ticks = TICKS.map((v) => `<div class="esc-tick" style="top:${AXIS_H + h(v)}px"><span>${formatCompact(v)}</span></div>`).join("");

  const html = `
      <section class="esc-tall" aria-label="Adultos em fila, do mais pobre ao mais rico, com barras que crescem para baixo">
        <div class="esc-split-title">A fila em escala real</div>
        <p class="esc-hint">Cada <b>pixel</b> de altura vale <b>${formatCompact(BRL_PER_PX)}</b>. A barra azul-marinho é o 1% mais rico e <b>não tem limite</b>: role para baixo. (25% e 75%: estimativas.)</p>
        <div class="esc-plot" style="height:${plotH}px">
          <div class="esc-axis" style="height:${AXIS_H}px">
            <span class="esc-ax-l">← mais pobre</span><span class="esc-ax-r">mais rico →</span>
            <span class="esc-ax-t" style="left:25%">25%</span><span class="esc-ax-t esc-ax-med" style="left:50%">50%</span><span class="esc-ax-t" style="left:75%">75%</span>
          </div>
          <div class="esc-base" style="top:${AXIS_H}px"></div>
          ${ticks}
          ${stick(25, qs.p25, "25% da fila", RED, true)}
          ${stick(50, median.valueBRL, "adulto do meio", RED_INK, false)}
          ${stick(75, qs.p75, "75% da fila", RED, true)}
          <div class="esc-top1" style="top:${AXIS_H}px;height:${barPx}px"></div>
          <div class="esc-top1-label" style="top:${AXIS_H + h(qs.p75) + 70}px"><b>1% mais rico</b><span>${formatPeople(est.topPeople)}</span><span>${formatCompact(est.topMean)} em média</span></div>
          <div class="esc-top1-end" style="top:${AXIS_H + barPx + 6}px">fim da barra: ${formatCompact(est.topMean)}</div>
        </div>
        <p class="esc-end"></p>
      </section>`;

  function attach(root: HTMLElement): () => void {
    const plot = root.querySelector<HTMLElement>(".esc-plot")!;
    const endEl = root.querySelector<HTMLElement>(".esc-end")!;

    // contador de telas: fixo na tela enquanto a barra do 1% está à vista
    const counter = document.createElement("div");
    counter.className = "esc-counter";
    counter.hidden = true;
    counter.setAttribute("aria-hidden", "true");
    document.body.append(counter);

    let ticking = false;
    function update() {
      ticking = false;
      const vh = window.innerHeight;
      const r = plot.getBoundingClientRect();
      const baseY = r.top + AXIS_H;
      const seen = Math.min(Math.max(vh - baseY, 0), barPx); // px da barra já passados pela borda de baixo
      counter.hidden = !(r.bottom > 0 && baseY < vh) || seen >= barPx; // some quando a barra do 1% termina
      counter.textContent = `Barra do 1%: ${formatNumber(seen / vh)} de ${formatNumber(barPx / vh)} telas · já passou de ${formatCompact(seen * BRL_PER_PX)}`;
      const screensOf = (v: number) => formatNumber(h(v) / vh);
      endEl.innerHTML =
        `Na mesma escala, a barra dos <b>255 bilionários</b> (${formatCompact(bilMean.valueBRL)} em média) teria cerca de <b>${screensOf(bilMean.valueBRL)} telas</b>; a de ${saverin.label}, cerca de <b>${screensOf(saverin.valueBRL)} telas</b>.`;
    }
    const schedule = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      counter.remove();
    };
  }

  return { html, attach };
}
