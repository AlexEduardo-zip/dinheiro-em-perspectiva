import { entityById, facts } from "../../data";
import { estimateTop1 } from "../../lib/concentration";
import { formatCompact, formatLong, formatNumber, formatPeople } from "../../lib/format";
import { filaChart } from "../fila-chart";
import type { Visualization } from "../types";

/**
 * 1% mais rico: o número absoluto de pessoas e de dinheiro do 1% de cima contra todo o resto. ESTIMATIVA PRÓPRIA que
 * combina fontes de anos diferentes (ADR-020): adultos (IBGE, Censo 2022), média por adulto (UBS), fatia do 1% mais
 * rico (Credit Suisse, 2021) e bilionários (Forbes 2026). Ordem (ADR-025): destaque, duas barras alinhadas ("Quantas
 * pessoas" e "Quanto dinheiro", ADR-030), cartões, bilionários, "Como calculamos" e, no FIM, a fila em escala real.
 * Textos curtos (ADR-033): os gráficos mostram a conclusão.
 */

const pct = (n: number, d = 1) => n.toLocaleString("pt-BR", { maximumFractionDigits: d });

export const top1: Visualization = {
  id: "top1",
  title: "1% mais rico",
  question: "Quanto o 1% mais rico tem, comparado a todo o resto?",
  status: "ready",
  mount(el) {
    const adultsFact = facts.find((f) => f.id === "adultos-18")!;
    const shareFact = facts.find((f) => f.id === "top1-share")!;
    const billFact = facts.find((f) => f.id === "bilionarios-qtd")!;
    const mean = entityById("adulto-medio")!;
    const adults = adultsFact.value;
    const est = estimateTop1({ adults, meanWealth: mean.valueBRL, top1SharePct: shareFact.value });
    const topPeoplePct = 100 * (est.topPeople / adults); // 1
    const rich = entityById("bilionarios-total")!;
    const richShare = rich.valueBRL / est.totalWealth;
    const ratio = Math.round(est.topEqualsRestPeople);
    const fila = filaChart();

    el.className = "t1";
    el.innerHTML = `
      <p class="t1-kicker">Estimativa</p>

      <section class="t1-hero">
        <div class="t1-hero-n">${formatPeople(est.topPeople)}</div>
        <p>É o <strong>1% mais rico</strong>. Têm <strong>${formatLong(est.topWealth)}</strong>: <strong>quase metade</strong> (${pct(shareFact.value)}%) de toda a riqueza.</p>
      </section>

      <section class="t1-chart" aria-label="Comparação entre o 1% mais rico e os outros 99%, em pessoas e em dinheiro">
        <div class="t1-rowlabel">Quantas pessoas</div>
        <div class="t1-bar"><i class="t1-top" style="width:${topPeoplePct}%"></i><i class="t1-rest"></i></div>
        <div class="t1-nums"><span class="t1-n-top"><i class="t1-chip t1-chip-a"></i>${formatPeople(est.topPeople)}</span><span class="t1-n-rest"><i class="t1-chip t1-chip-b"></i>${formatPeople(est.restPeople)}</span></div>

        <div class="t1-rowlabel t1-row2">Quanto dinheiro</div>
        <div class="t1-bar"><i class="t1-top" style="width:${shareFact.value}%"></i><i class="t1-rest"></i></div>
        <div class="t1-nums"><span class="t1-n-top"><i class="t1-chip t1-chip-a"></i>${formatLong(est.topWealth)}</span><span class="t1-n-rest"><i class="t1-chip t1-chip-b"></i>${formatLong(est.restWealth)}</span></div>
      </section>

      <section class="t1-cards">
        <article class="t1-card top">
          <h3>1% mais rico</h3>
          <div class="t1-sum">${formatCompact(est.topMean)}</div>
          <p>em média, cada um</p>
        </article>
        <article class="t1-card rest">
          <h3>Os outros 99%</h3>
          <div class="t1-sum">${formatCompact(est.restMean)}</div>
          <p>em média, cada um</p>
        </article>
      </section>

      <p class="t1-ratio">Uma pessoa do 1% tem, em média, o que <strong>${ratio} pessoas</strong> dos outros 99% têm juntas.</p>

      <section class="t1-bil">
        <p><strong>${formatNumber(billFact.value)} bilionários</strong> somam <strong>${formatLong(rich.valueBRL)}</strong>: cerca de <strong>${pct(richShare * 100)}%</strong> de toda a riqueza.</p>
      </section>

      <details class="t1-how">
        <summary>Como calculamos</summary>
        <p class="t1-warn">Riqueza total = ${formatNumber(adults)} adultos (IBGE) × ${formatCompact(mean.valueBRL)} de média (UBS) = ${formatLong(est.totalWealth)}. O 1% tem ${pct(shareFact.value)}% dela (Credit Suisse, 2021). Valores aproximados: as fontes são de anos diferentes.</p>
      </details>

      ${fila.html}`;

    const detach = fila.attach(el);

    return () => {
      detach();
      el.className = "";
      el.replaceChildren();
    };
  },
};
