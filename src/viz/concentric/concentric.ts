import { meioSalarioMinimo, salarioMinimo } from "../../data";
import type { Entity } from "../../data/types";
import { formatCompact, formatSM } from "../../lib/format";
import { BG, entityColor, INK, isWorkingClass, RED } from "../colors";
import { createEntityLegend } from "../legend";
import type { Visualization } from "../types";
import { bindZoomControls, createPinch, createZoomCamera } from "../zoom";

const MARGIN = 18; // folga entre o círculo "completo" e a borda do palco (cabe o rótulo no topo)
const MIN_LEGEND_R = 4; // abaixo disso o círculo é um ponto: não vale legenda
const LABEL_GAP = 16; // espaço vertical mínimo entre rótulos desenhados sobre a imagem
const HUGE_R = 4000; // acima disso não desenhamos (evita arcos de milhões de px)
const INITIAL_BASE_RADIUS = 30;
// Legenda com histerese: entra quando está folgadamente inteiro, sai só depois de passar da borda (evita piscar).
const LEGEND_ENTER_PAD = 4;
const LEGEND_EXIT_PAD = 6;

/**
 * Círculos concêntricos: todos compartilham o centro, com ÁREA proporcional ao valor e meio salário
 * mínimo no meio. Afastar (zoom out) revela os maiores, até o bilionário que ocupa a tela.
 * Sem compressão (ADR-007): o zoom é contínuo e a razão entre áreas é a real. O esforço do zoom (ADR-012)
 * e a câmera suave estão em ../zoom.ts; a legenda detalhada (empresas, fonte) em ../legend.ts.
 * Legenda: lista os círculos que estão INTEIROS na tela (e grandes o bastante para serem vistos).
 */
export const concentric: Visualization = {
  id: "sobrepostos",
  title: "Círculos",
  question: "Quantos salários mínimos cabem em cada patrimônio?",
  status: "ready",
  mount(el, ctx) {
    // Ordem crescente. ratio = raio relativo ao do círculo central (área ∝ valor → raiz do quociente).
    const base = meioSalarioMinimo.valueBRL;
    const items = [meioSalarioMinimo, salarioMinimo, ...ctx.entities.filter((e) => e.kind !== "aggregate")]
      .sort((a, b) => a.valueBRL - b.valueBRL)
      .map((e) => ({ e, ratio: Math.sqrt(e.valueBRL / base) }));
    const maxRatio = items[items.length - 1]!.ratio;

    el.className = "conc";
    el.innerHTML = `
      <div class="toolbar conc-bar">
        <button data-act="in" aria-label="Aproximar">+</button>
        <div class="conc-meter" role="progressbar" aria-label="Quanto já foi afastado" aria-valuemin="0" aria-valuemax="100">
          <div class="conc-meter-text"></div>
          <div class="conc-meter-track"><div class="conc-meter-fill"></div></div>
        </div>
        <button data-act="out" aria-label="Afastar">−</button>
      </div>
      <div class="conc-stage"><canvas></canvas></div>
      <ul class="conc-legend" aria-label="Círculos inteiros na tela"></ul>
      <p class="viz-note"></p>`;
    const bar = el.querySelector<HTMLElement>(".conc-bar")!;
    const meter = bar.querySelector<HTMLElement>(".conc-meter")!;
    const meterText = bar.querySelector<HTMLElement>(".conc-meter-text")!;
    const meterFill = bar.querySelector<HTMLElement>(".conc-meter-fill")!;
    const stage = el.querySelector<HTMLElement>(".conc-stage")!;
    const canvas = el.querySelector<HTMLCanvasElement>("canvas")!;
    const legendEl = el.querySelector<HTMLUListElement>(".conc-legend")!;
    const note = el.querySelector<HTMLElement>(".viz-note")!;
    const g = canvas.getContext("2d")!;
    note.textContent =
      "Cada círculo é um patrimônio (a área é proporcional ao valor). Tons quentes: classe trabalhadora. Azuis: mais ricos. Afaste para ver os maiores.";

    let W = 0, H = 0;
    let selectedId: string | null = null;
    const inLegend = new Set<string>(); // membros atuais da legenda (histerese)
    let meterKey = "";

    const half = () => Math.max(Math.min(W, H) / 2 - MARGIN, 20);
    /** Limites do zoom: círculo central enchendo a tela ... maior círculo inteiro na tela. */
    const bounds = () => ({ lo: Math.log(half() / maxRatio), hi: Math.log(half()) });
    const cam = createZoomCamera({ initial: Math.log(INITIAL_BASE_RADIUS), bounds, onFrame: () => draw() });
    const pinch = createPinch(cam);

    const legend = createEntityLegend({
      container: legendEl,
      valueText: (e) => `${formatCompact(e.valueBRL)} · ${formatSM(e.valueBRL, salarioMinimo.valueBRL)}`,
      onPick: (e) => { select(e, false); flyTo(e); },
      emptyText: "Nenhum círculo inteiro na tela. Aproxime ou afaste.",
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = stage.clientWidth, h = stage.clientHeight;
      // Atribuir canvas.width limpa o desenho (pisca): só mexe se o tamanho realmente mudou.
      if (w !== W || h !== H || canvas.width !== Math.round(w * dpr)) {
        W = w;
        H = h;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      cam.reclamp();
      draw();
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const rBase = Math.exp(cam.value);
      updateMeter();

      // Maiores primeiro, para os menores ficarem por cima.
      for (let i = items.length - 1; i >= 0; i--) {
        const { e, ratio } = items[i]!;
        const r = rBase * ratio;
        if (r < 0.3) continue;
        const color = entityColor(e);
        g.fillStyle = color;
        if (r > HUGE_R) continue; // círculo enorme: a borda está fora da tela e o preenchimento só sujaria o fundo
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.globalAlpha = isWorkingClass(e) ? 0.06 : 0.025; // tons quentes (classe trabalhadora) mais presentes
        g.fill();
        g.globalAlpha = 1;
        g.lineWidth = e.id === selectedId ? 3 : isWorkingClass(e) ? 2.5 : 1.5;
        g.strokeStyle = e.id === selectedId ? INK : color;
        g.stroke();
      }
      // marca do centro: o círculo central some quando muito afastado, mas o centro continua indicado
      g.fillStyle = RED;
      g.beginPath();
      g.arc(cx, cy, 1.5, 0, Math.PI * 2);
      g.fill();

      // Quem está INTEIRO na tela e grande o bastante para ser visto.
      const h = half();
      // Histerese: quem já está na legenda só sai ao passar bem da borda; quem não está só entra folgado.
      const visible = items.filter(({ e, ratio }) => {
        const r = rBase * ratio;
        const was = inLegend.has(e.id);
        const ok = was
          ? r >= MIN_LEGEND_R - 1.5 && r <= h + LEGEND_EXIT_PAD
          : r >= MIN_LEGEND_R + 1 && r <= h - LEGEND_ENTER_PAD;
        if (ok) inLegend.add(e.id);
        else inLegend.delete(e.id);
        return ok;
      });

      // Rótulos sobre a imagem, do maior ao menor, descartando os que colidiriam na vertical.
      g.font = "600 11px system-ui, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "alphabetic";
      g.lineJoin = "round";
      g.lineWidth = 3;
      let lastY = -Infinity; // do maior (mais alto na tela) ao menor: y só aumenta
      for (let i = visible.length - 1; i >= 0; i--) {
        const { e, ratio } = visible[i]!;
        const y = cy - rBase * ratio - 5;
        if (y - lastY < LABEL_GAP) continue;
        lastY = y;
        const text = `${e.label} · ${formatCompact(e.valueBRL)}`;
        // fade nas bordas (muito pequeno / quase saindo da tela): rótulos surgem e somem suavemente
        const r = rBase * ratio;
        g.globalAlpha = Math.max(0, Math.min(1, (r - 3) / 8, (h + 8 - r) / 14));
        g.strokeStyle = BG;
        g.strokeText(text, cx, y);
        g.fillStyle = INK;
        g.fillText(text, cx, y);
        g.globalAlpha = 1;
      }

      legend.update(visible.map((v) => v.e).reverse(), selectedId); // maior primeiro
    }

    /** Medidor: progresso do caminho e "alcance" = o valor cujo círculo acabou de caber na tela. */
    function updateMeter() {
      const { lo, hi } = bounds();
      const pct = Math.round(((hi - cam.value) / (hi - lo)) * 100);
      const reach = base * Math.pow(half() / Math.exp(cam.value), 2);
      const key = `${pct}|${Math.round(reach)}`;
      if (key === meterKey) return;
      meterKey = key;
      meterText.textContent = `Na tela cabe até ${formatCompact(reach)} · ${pct}%`;
      meterFill.style.width = `${pct}%`;
      meter.setAttribute("aria-valuenow", String(pct));
    }

    /**
     * A legenda expandida já traz fonte e ressalva; o painel inferior só abre quando o item NÃO está
     * na legenda (ex.: toque num anel que não está inteiro na tela), para não cobrir a lista.
     */
    function select(e: Entity | null, allowSheet = true) {
      selectedId = e?.id ?? null;
      ctx.onSelect(e && allowSheet && !legend.has(e.id) ? e : null);
      cam.kick();
      if (e) legend.scrollTo(e.id);
    }

    /** Leva o zoom (suavemente) até o círculo caber na tela. */
    function flyTo(e: Entity) {
      cam.setTarget(Math.log((half() * 0.86) / Math.sqrt(e.valueBRL / base)));
    }

    // --- Entradas: botões, roda e teclado (../zoom.ts), pinça e toque ---
    bindZoomControls(cam, { canvas, bar, ariaLabel: "Círculos. Use as setas para cima e para baixo para dar zoom." });

    const pointers = new Map<number, { x: number; y: number }>();
    let tap: { x: number; y: number; ok: boolean } | null = null;
    const pinchDist = () => {
      const [a, b] = [...pointers.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    canvas.addEventListener("pointerdown", (ev) => {
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size === 1) tap = { x: ev.clientX, y: ev.clientY, ok: true };
      else { tap = null; pinch.start(pinchDist()); }
    });
    canvas.addEventListener("pointermove", (ev) => {
      if (!pointers.has(ev.pointerId)) return;
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (tap && Math.hypot(ev.clientX - tap.x, ev.clientY - tap.y) > 8) tap.ok = false;
      if (pointers.size === 2) pinch.move(pinchDist());
    });
    const end = (ev: PointerEvent, cancelled: boolean) => {
      pointers.delete(ev.pointerId);
      if (pointers.size < 2) pinch.end();
      if (tap?.ok && !cancelled && pointers.size === 0) {
        const r = canvas.getBoundingClientRect();
        pick(ev.clientX - r.left, ev.clientY - r.top);
      }
      if (pointers.size === 0) tap = null;
    };
    canvas.addEventListener("pointerup", (ev) => end(ev, false));
    canvas.addEventListener("pointercancel", (ev) => end(ev, true));

    /** O toque seleciona o menor círculo que contém o ponto (a "faixa" em que o dedo está). */
    function pick(x: number, y: number) {
      const d = Math.hypot(x - W / 2, y - H / 2);
      const rBase = Math.exp(cam.value);
      const hit = items.find(({ ratio }) => rBase * ratio >= d);
      select(hit ? hit.e : null);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    return () => {
      cam.destroy();
      ro.disconnect();
      el.className = "";
      el.replaceChildren();
    };
  },
};
