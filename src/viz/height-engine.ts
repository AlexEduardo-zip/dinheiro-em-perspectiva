import { landmarks as defaultLandmarks } from "../data/landmarks";
import type { Entity } from "../data/types";
import { formatLength } from "../lib/format";
import { BG, entityColor, GROUND as GROUND_COLOR, INK, LINE, MUTED } from "./colors";
import { createEntityLegend } from "./legend";
import type { VizContext } from "./types";
import { tuning } from "./tuning";
import { bindZoomControls, createPinch, createZoomCamera } from "./zoom";

/**
 * Motor das visualizações de ALTURA REAL (Desfile, Pilhas de notas): figuras em ordem crescente sobre um
 * chão, altura exatamente proporcional ao valor (ADR-007), zoom suave e cansativo (../zoom.ts, ADR-012),
 * arrastar para o lado com deslize, referências de altura, legenda das figuras inteiras na tela e painel
 * de detalhe. Cada visualização só define COMO desenhar uma figura e quais textos mostrar (HeightConfig).
 */

export interface HeightFigure {
  e: Entity;
  /** Altura real na unidade da visualização (metros no Desfile e nas Pilhas; anos em "Em anos de salário"). */
  hm: number;
}

export interface DrawArgs {
  cx: number;
  /** y do chão. */
  gy: number;
  /** Altura em px (pode passar da tela). */
  hpx: number;
  /** Largura em px da figura neste zoom (ver HeightConfig.widthPx). */
  wpx: number;
  /** Pixels por metro. */
  ppm: number;
  color: string;
  selected: boolean;
}

export interface HeightConfig {
  /** Figuras em ordem crescente de altura. */
  figures: (entities: Entity[]) => HeightFigure[];
  /** Linhas tracejadas de referência, na MESMA unidade das figuras (padrão: data/landmarks.ts, em metros). */
  landmarks?: { label: string; meters: number }[];
  /** Formata um valor da unidade (padrão: comprimento em m/km). */
  formatUnit?: (v: number) => string;
  /** Texto do medidor, dado o alcance já formatado e a porcentagem. */
  meterText?: (reach: string, pct: number) => string;
  noteText: string;
  ariaLabel: string;
  meterAria: string;
  legendAria: string;
  emptyText: string;
  className: string;
  /** Largura (px) da figura neste zoom. Define também o espaçamento mínimo entre figuras. */
  widthPx: (ppm: number) => number;
  /** Zoom inicial (px por metro), dado o alto útil do quadro. */
  initialPpm: (frameH: number) => number;
  /** Espaçamento mínimo entre figuras visíveis (px); padrão 58. Aumente se o rótulo for largo. */
  minSpacing?: number;
  /** Zoom máximo (px por metro). */
  maxPpm: (frameH: number) => number;
  draw: (g: CanvasRenderingContext2D, a: DrawArgs) => void;
  /** Segunda linha do rótulo (acima da figura). */
  line2: (f: HeightFigure) => string;
  /** Texto à direita na legenda. */
  legendValue: (f: HeightFigure) => string;
  /** Linhas extras na legenda expandida. */
  legendExtra?: (f: HeightFigure) => string[];
}

const DEFAULT_SPACING = 72; // distância horizontal mínima entre figuras visíveis (px)
const DUST_GAP = 3; // distância entre figuras que viraram "poeira" (menores que ~2 px de altura)
const GROUND = 26; // faixa do chão embaixo (px)
const TOP_PAD = 36; // espaço no alto para os rótulos (px)
const LABEL_H = 11;
const MIN_LEGEND_H = 10; // abaixo disso a figura é um risco: não vale legenda
const LEGEND_ENTER_PAD = 6;
const LEGEND_EXIT_PAD = 8;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

export function mountHeightViz(el: HTMLElement, ctx: VizContext, cfg: HeightConfig): () => void {
  const fmt = cfg.formatUnit ?? formatLength;
  const SPACING = cfg.minSpacing ?? DEFAULT_SPACING;
  const figs = cfg.figures(ctx.entities);
  const maxM = figs[figs.length - 1]!.hm;
  const lmList = cfg.landmarks ?? defaultLandmarks;

  /**
   * Posições horizontais "telescópicas": figuras que já viraram poeira (< ~2 px de altura) ficam coladas
   * (DUST_GAP) e as que aparecem ganham espaço (largura da figura + folga, no mínimo SPACING), de modo que
   * ao afastar o zoom as figuras altas surgem perto da tela em vez de ficarem distantes à direita. É só
   * posição horizontal: as alturas continuam exatamente proporcionais (ADR-007).
   */
  function layout(ppm: number) {
    const full = Math.max(cfg.widthPx(ppm) + 14, SPACING);
    const xs: number[] = [];
    let x = 0;
    for (const f of figs) {
      const t = clamp01((f.hm * ppm - 2) / 24);
      const gap = DUST_GAP + (full - DUST_GAP) * t;
      xs.push(x + gap / 2);
      x += gap;
    }
    return { xs, total: x, full };
  }
  let xs: number[] = [];
  let total = figs.length * SPACING;
  let fullGap = SPACING;

  el.className = `conc ${cfg.className}`;
  el.innerHTML = `
    <div class="toolbar conc-bar">
      <button data-act="in" aria-label="Aproximar">+</button>
      <div class="conc-meter" role="progressbar" aria-label="${cfg.meterAria}" aria-valuemin="0" aria-valuemax="100">
        <div class="conc-meter-text"></div>
        <div class="conc-meter-track"><div class="conc-meter-fill"></div></div>
      </div>
      <button data-act="out" aria-label="Afastar">−</button>
    </div>
    <div class="conc-stage"><canvas></canvas></div>
    <ul class="conc-legend" aria-label="${cfg.legendAria}"></ul>
    <p class="viz-note"></p>`;
  const bar = el.querySelector<HTMLElement>(".conc-bar")!;
  const meter = bar.querySelector<HTMLElement>(".conc-meter")!;
  const meterText = bar.querySelector<HTMLElement>(".conc-meter-text")!;
  const meterFill = bar.querySelector<HTMLElement>(".conc-meter-fill")!;
  const stage = el.querySelector<HTMLElement>(".conc-stage")!;
  const canvas = el.querySelector<HTMLCanvasElement>("canvas")!;
  const legendEl = el.querySelector<HTMLUListElement>(".conc-legend")!;
  el.querySelector<HTMLElement>(".viz-note")!.textContent = cfg.noteText;
  const g = canvas.getContext("2d")!;

  let W = 0, H = 0;
  let selectedId: string | null = null;
  const inLegend = new Set<string>();
  let meterKey = "";
  let sized = false; // o zoom inicial só pode ser calculado depois da primeira medição do palco

  const groundY = () => H - GROUND;
  const frameH = () => Math.max(groundY() - TOP_PAD, 40); // altura útil para uma figura inteira
  /** Zoom = log de px por metro. hi: o limite da config. lo: a figura mais alta cabe inteira. */
  const bounds = () => ({ lo: Math.log((frameH() * 0.96) / maxM), hi: Math.log(cfg.maxPpm(frameH())) });
  const cam = createZoomCamera({ initial: Math.log(cfg.initialPpm(frameH())), bounds, onFrame: () => draw() });
  const pinch = createPinch(cam);

  const figById = (id: string) => figs.find((f) => f.e.id === id)!;
  const legend = createEntityLegend({
    container: legendEl,
    valueText: (e) => cfg.legendValue(figById(e.id)),
    extraLines: cfg.legendExtra ? (e) => cfg.legendExtra!(figById(e.id)) : undefined,
    onPick: (e) => { select(e, false); flyTo(e); },
    emptyText: cfg.emptyText,
  });

  // ---- pan horizontal (arrasto/teclas/roda lateral), com deslize ----
  let pan = 0, panTarget = 0, panTau = tuning.panSmoothMs, panRaf = 0, panLast = -1;
  const maxPan = () => Math.max(total - W, 0);
  const clampPan = (v: number) => Math.min(Math.max(v, 0), maxPan());
  function setPan(v: number, instant = false, tau = tuning.panSmoothMs) {
    panTarget = clampPan(v);
    panTau = tau;
    if (instant || reducedMotion()) pan = panTarget;
    panKick();
  }
  function panKick() {
    if (panRaf) return;
    panLast = -1;
    panRaf = requestAnimationFrame(panTick);
  }
  function panTick(now: number) {
    panRaf = 0;
    const dt = panLast < 0 ? 16 : Math.max(0, Math.min(now - panLast, 50));
    panLast = now;
    const diff = panTarget - pan;
    pan = Math.abs(diff) < 0.05 ? panTarget : pan + diff * (1 - Math.exp(-dt / panTau));
    draw();
    if (pan !== panTarget) panRaf = requestAnimationFrame(panTick);
  }

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
    if (!sized && w > 0 && h > 0) {
      sized = true;
      cam.setTarget(Math.log(cfg.initialPpm(frameH())), true); // antes disso frameH() não era a altura real
    }
    cam.reclamp();
    pan = clampPan(pan);
    panTarget = clampPan(panTarget);
    draw();
  }

  function label(cx: number, baseline: number, line1: string, line2: string, alpha: number, color: string) {
    g.globalAlpha = alpha;
    g.textAlign = "center";
    g.lineWidth = 3;
    g.strokeStyle = BG;
    g.font = "600 11px system-ui, sans-serif";
    g.strokeText(line1, cx, baseline - LABEL_H);
    g.fillStyle = INK;
    g.fillText(line1, cx, baseline - LABEL_H);
    g.font = "11px system-ui, sans-serif";
    g.strokeText(line2, cx, baseline);
    g.fillStyle = MUTED;
    g.fillText(line2, cx, baseline);
    g.globalAlpha = 1;
  }

  function draw() {
    g.clearRect(0, 0, W, H);
    const gy = groundY();
    const ppm = Math.exp(cam.value); // px por metro
    updateMeter(ppm);
    ({ xs, total, full: fullGap } = layout(ppm));
    pan = clampPan(pan);
    panTarget = clampPan(panTarget);
    g.lineJoin = "round";
    g.textBaseline = "alphabetic";
    const wpx = cfg.widthPx(ppm);

    // referências de altura (atrás das figuras), sem colidir na vertical
    g.font = "11px system-ui, sans-serif";
    g.textAlign = "right";
    let lastLmY = Infinity; // de baixo para cima: y só diminui
    const lmLabels: { y: number; text: string; a: number }[] = []; // rótulos por cima das figuras
    for (const lm of [...lmList].sort((a, b) => a.meters - b.meters)) {
      const y = gy - lm.meters * ppm;
      if (y < 10 || y > gy - 6) continue;
      const a = clamp01(Math.min((y - 10) / 14, (gy - 6 - y) / 14));
      g.globalAlpha = a * 0.5;
      // linha tracejada em UMA chamada (antes eram ~45 retângulos por referência, a cada quadro)
      g.strokeStyle = LINE;
      g.lineWidth = 1;
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(0, Math.round(y) + 0.5);
      g.lineTo(W, Math.round(y) + 0.5);
      g.stroke();
      g.setLineDash([]);
      if (lastLmY - y < 13) { g.globalAlpha = 1; continue; }
      lastLmY = y;
      lmLabels.push({ y, text: `${lm.label} · ${fmt(lm.meters)}`, a });
      g.globalAlpha = 1;
    }

    // chão
    g.fillStyle = GROUND_COLOR;
    g.fillRect(0, gy, W, GROUND);
    g.fillStyle = LINE;
    g.fillRect(0, gy, W, 2);

    // figuras
    const fh = frameH();
    const visible: HeightFigure[] = [];
    for (let i = 0; i < figs.length; i++) {
      const f = figs[i]!;
      const cx = xs[i]! - pan;
      if (cx < -wpx / 2 - 4 || cx > W + wpx / 2 + 4) continue;
      const hpx = f.hm * ppm;
      const color = entityColor(f.e);
      cfg.draw(g, { cx, gy, hpx, wpx, ppm, color, selected: f.e.id === selectedId });

      // legenda: figura INTEIRA na tela (altura útil e horizontal) e grande o bastante, com histerese
      const was = inLegend.has(f.e.id);
      const xOk = cx >= 12 && cx <= W - 12;
      const ok = xOk && (was
        ? hpx >= MIN_LEGEND_H - 2 && hpx <= fh + LEGEND_EXIT_PAD
        : hpx >= MIN_LEGEND_H + 1 && hpx <= fh - LEGEND_ENTER_PAD);
      if (ok) { inLegend.add(f.e.id); visible.push(f); } else inLegend.delete(f.e.id);

      // rótulo: altura e segunda linha acima da figura (ou colado ao topo se passar da tela)
      if (hpx >= 10 && cx > 14 && cx < W - 14) {
        const tall = gy - hpx < TOP_PAD - 4;
        const baseline = tall ? TOP_PAD - 8 : gy - hpx - 5;
        const arrow = tall ? "↑ " : "";
        const a = clamp01(Math.min((hpx - 10) / 12, 1));
        label(Math.min(Math.max(cx, 34), W - 34), baseline, `${arrow}${fmt(f.hm)}`, cfg.line2(f), a, color); // dentro da tela
      }
    }

    g.font = "11px system-ui, sans-serif";
    g.textAlign = "right";
    g.lineWidth = 3;
    for (const l of lmLabels) {
      g.globalAlpha = l.a;
      g.strokeStyle = BG;
      g.strokeText(l.text, W - 4, l.y - 3);
      g.fillStyle = MUTED;
      g.fillText(l.text, W - 4, l.y - 3);
    }
    g.globalAlpha = 1;

    legend.update(visible.map((v) => v.e).reverse(), selectedId); // maior primeiro
  }

  /** Medidor: quanto da escala já foi percorrida e "a tela mostra até": a altura que cabe no quadro. */
  function updateMeter(ppm: number) {
    const { lo, hi } = bounds();
    const pct = Math.round(((hi - cam.value) / (hi - lo)) * 100);
    const reach = frameH() / ppm;
    const key = `${pct}|${Math.round(reach * 100)}`;
    if (key === meterKey) return;
    meterKey = key;
    meterText.textContent = cfg.meterText ? cfg.meterText(fmt(reach), pct) : `A tela mostra até ${fmt(reach)} de altura · ${pct}%`;
    meterFill.style.width = `${pct}%`;
    meter.setAttribute("aria-valuenow", String(pct));
  }

  /** A legenda expandida já traz fonte e ressalva; o painel só abre quando a figura não está nela. */
  function select(e: Entity | null, allowSheet = true) {
    selectedId = e?.id ?? null;
    ctx.onSelect(e && allowSheet && !legend.has(e.id) ? e : null);
    cam.kick();
    if (e) legend.scrollTo(e.id);
  }

  /** Leva (suavemente) o zoom e a fila até a figura ficar inteira e centralizada. */
  function flyTo(e: Entity) {
    const i = figs.findIndex((x) => x.e.id === e.id);
    const f = figs[i]!;
    const targetLog = Math.min(Math.max(Math.log((frameH() * 0.8) / f.hm), bounds().lo), bounds().hi);
    cam.setTarget(targetLog);
    // posição da figura no zoom de DESTINO (o layout depende do zoom)
    const dest = layout(Math.exp(targetLog));
    total = Math.max(total, dest.total);
    setPan(dest.xs[i]! - W / 2);
  }

  // --- Entradas: botões, roda e teclado (zoom em ./zoom.ts); roda lateral/Shift e setas ←/→ deslocam ---
  bindZoomControls(cam, {
    canvas,
    bar,
    ariaLabel: cfg.ariaLabel,
    wheelFirst: (ev) => {
      if (ev.shiftKey || Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
        setPan(panTarget + (ev.deltaX || ev.deltaY));
        return true;
      }
      return false;
    },
    keyFirst: (ev) => {
      if (ev.key === "ArrowRight") { setPan(panTarget + 80); return true; }
      if (ev.key === "ArrowLeft") { setPan(panTarget - 80); return true; }
      return false;
    },
  });

  // Um dedo: arrastar para os lados (com deslize) ou tocar numa figura. Dois dedos: pinça (zoom).
  const pointers = new Map<number, { x: number; y: number }>();
  let drag: { id: number; x: number; startX: number; startY: number; moved: boolean; samples: { t: number; x: number }[] } | null = null;
  const pinchDist = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  canvas.addEventListener("pointerdown", (ev) => {
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 1) {
      drag = { id: ev.pointerId, x: ev.clientX, startX: ev.clientX, startY: ev.clientY, moved: false, samples: [{ t: ev.timeStamp, x: ev.clientX }] };
      panTarget = pan; // interrompe deslize em andamento
    } else {
      drag = null;
      pinch.start(pinchDist());
    }
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!pointers.has(ev.pointerId)) return;
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 2) { pinch.move(pinchDist()); return; }
    if (!drag || ev.pointerId !== drag.id) return;
    if (Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) > 6) drag.moved = true;
    if (!drag.moved) return;
    setPan(pan - (ev.clientX - drag.x), true);
    drag.x = ev.clientX;
    drag.samples.push({ t: ev.timeStamp, x: ev.clientX });
    while (drag.samples.length > 2 && ev.timeStamp - drag.samples[0]!.t > 100) drag.samples.shift();
  });
  const end = (ev: PointerEvent, cancelled: boolean) => {
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinch.end();
    const d = drag;
    if (!d || ev.pointerId !== d.id) return;
    drag = null;
    if (!d.moved) {
      if (!cancelled) tapAt(ev.clientX - canvas.getBoundingClientRect().left);
      return;
    }
    const a = d.samples[0]!, b = d.samples[d.samples.length - 1]!;
    const dt = b.t - a.t;
    if (dt > 0 && ev.timeStamp - b.t < 80) setPan(pan - ((b.x - a.x) / dt) * tuning.flingMs, false, tuning.flingMs);
  };
  canvas.addEventListener("pointerup", (ev) => end(ev, false));
  canvas.addEventListener("pointercancel", (ev) => end(ev, true));

  /** Toque: seleciona a figura da coluna tocada (metade do espaço até a vizinha, no máximo meio passo). */
  function tapAt(x: number) {
    const i = xs.findIndex((fx, k) => {
      const next = xs[k + 1];
      const half = Math.max(Math.min(next !== undefined ? (next - fx) / 2 : fullGap / 2, fullGap / 2), 4);
      return Math.abs(fx - pan - x) <= half;
    });
    select(i >= 0 ? figs[i]!.e : null);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  return () => {
    cam.destroy();
    cancelAnimationFrame(panRaf);
    ro.disconnect();
    el.className = "";
    el.replaceChildren();
  };
}
