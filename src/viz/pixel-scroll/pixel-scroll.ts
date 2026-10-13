import { salarioMinimo } from "../../data";
import type { Entity } from "../../data/types";
import { formatCompact, formatNumber } from "../../lib/format";
import { pixelsFor } from "../../lib/scale";
import { shareText } from "../../lib/percentil";
import { BG, entityColor, INK, MUTED, PILL_BG } from "../colors";
import { tuning } from "../tuning";
import type { Visualization } from "../types";

/**
 * Pixel a pixel: cada QUADRADINHO é 1 salário mínimo (R$ 1.621) (ADR-010, ADR-011, ADR-014, ADR-015).
 * A grade ocupa ~90% da largura: com C colunas, cada linha vale C salários mínimos e mede C px de altura
 * (passo de C px = quadrado + espaço de 2 px). Como linhas e colunas têm o mesmo número, 1 px de altura
 * vale SEMPRE 1 salário mínimo, qualquer que seja a largura da tela: C = round(√(0,9 × largura)).
 * O mundo é desenhado SEMPRE em 1:1: nunca há zoom nem compressão. A "marcha" só multiplica a velocidade
 * do arrasto (ADR-013). Um cursor fixo marca "você está aqui": acima dele, o já percorrido (forte);
 * abaixo, o que falta (fraco).
 */

const GEARS = [1, 10, 100, 1_000, 10_000];
const GEAR_LABEL = ["1×", "10×", "100×", "1 mil×", "10 mil×"];
const CURSOR_FRAC = 0.35; // posição vertical do cursor no palco (deixa mais espaço para o que vem)
const GAP = 2; // espaço entre quadrados (px)
const GRID_FRAC = 0.9; // fração da largura ocupada pela grade
const LABEL_GAP = 28; // altura mínima entre rótulos (duas linhas)
const KEY_PX = 60; // pixels de arrasto por seta
const NEXT_COUNT = 4;
const LEVELS = 8; // marcas a cada 10^2 ... 10^8 salários mínimos
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** "1 salário", "13,9 salários". */
const quadrados = (n: number) => `${formatNumber(n)} ${n < 2 ? "salário" : "salários"}`;
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

export const pixelScroll: Visualization = {
  id: "pixel-scroll",
  title: "Pixel a pixel",
  question: "Quanto dá para rolar até a fortuna de um bilionário?",
  status: "ready",
  mount(el, ctx) {
    const items = [salarioMinimo, ...ctx.entities.filter((e) => e.kind !== "aggregate")]
      .sort((a, b) => a.valueBRL - b.valueBRL)
      .map((e) => ({ e, px: pixelsFor(e.valueBRL) }));
    const last = items[items.length - 1]!;
    const maxPos = last.px + 400; // pequeno respiro depois do último marco

    el.className = "conc pix";
    el.innerHTML = `
      <div class="toolbar conc-bar pix-bar">
        ${GEARS.map((k, i) => `<button data-gear="${i}" aria-pressed="${i === 0}">${GEAR_LABEL[i]}</button>`).join("")}
        <button data-act="home" aria-label="Voltar ao início">Início</button>
      </div>
      <div class="conc-stage">
        <canvas></canvas>
        <div class="pix-hud" aria-live="off"><div class="big"></div><div class="sub"></div></div>
      </div>
      <ul class="conc-legend pix-next" aria-label="Próximos marcos"></ul>
      <p class="viz-note"></p>`;
    const bar = el.querySelector<HTMLElement>(".pix-bar")!;
    const stage = el.querySelector<HTMLElement>(".conc-stage")!;
    const canvas = el.querySelector<HTMLCanvasElement>("canvas")!;
    const hudBig = el.querySelector<HTMLElement>(".pix-hud .big")!;
    const hudSub = el.querySelector<HTMLElement>(".pix-hud .sub")!;
    const list = el.querySelector<HTMLUListElement>(".pix-next")!;
    const note = el.querySelector<HTMLElement>(".viz-note")!;
    const g = canvas.getContext("2d")!;

    let W = 0, H = 0;
    // Layout da grade (recalculado no resize). P = C (passo = colunas) mantém 1 px de altura = 1 salário mínimo.
    let C = 18; // colunas = salários mínimos por linha
    let P = 18; // passo (px) de coluna e de linha
    let SQ = 16; // lado do quadrado
    let GRID_W = 322;
    let X0 = 18;
    function layout() {
      C = Math.min(Math.max(Math.round(Math.sqrt(W * GRID_FRAC)), 8), 30);
      P = C;
      SQ = P - GAP;
      GRID_W = C * P - GAP;
      X0 = Math.round((W - GRID_W) / 2);
    }
    let pos = 0; // posição em pixels de dinheiro (= salários mínimos) sob o cursor
    let target = 0;
    let tau = tuning.panSmoothMs;
    let gear = 0;
    let raf = 0;
    let lastT = -1;
    let lastDrawPos = 0;
    let lastHud = "";
    let lastListAt = 0;
    const k = () => GEARS[gear]!;
    const cursorY = () => H * CURSOR_FRAC;

    function setNote() {
      note.textContent =
        gear === 0
          ? "Cada quadradinho é 1 salário. Tons quentes: classe trabalhadora. Azuis: mais ricos. Arraste para cima."
          : `Velocidade ${GEAR_LABEL[gear]}: cada arrasto anda ${formatNumber(k())} vezes mais.`;
    }

    // ---- câmera ----
    const clampPos = (v: number) => Math.min(Math.max(v, 0), maxPos);
    function setTarget(v: number, instant = false, t = tuning.panSmoothMs) {
      target = clampPos(v);
      tau = t;
      if (instant || reducedMotion()) pos = target;
      kick();
    }
    function kick() {
      if (raf) return;
      lastT = -1;
      raf = requestAnimationFrame(tick);
    }
    function tick(now: number) {
      raf = 0;
      const dt = lastT < 0 ? 16 : Math.max(0, Math.min(now - lastT, 50));
      lastT = now;
      const diff = target - pos;
      pos = Math.abs(diff) < 0.02 ? target : pos + diff * (1 - Math.exp(-dt / tau));
      draw(now);
      if (pos !== target) raf = requestAnimationFrame(tick);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = stage.clientWidth, h = stage.clientHeight;
      if (w !== W || h !== H || canvas.width !== Math.round(w * dpr)) {
        W = w;
        H = h;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      layout();
      setNote();
      draw(performance.now());
    }

    // ---- desenho ----
    function fit(text: string, avail: number): string {
      if (g.measureText(text).width <= avail) return text;
      let t = text;
      while (t.length > 4 && g.measureText(t + "…").width > avail) t = t.slice(0, -1);
      return t + "…";
    }

    /** Bolha de texto legível sobre os quadrados. */
    function pill(x: number, y: number, w: number, h: number, color: string) {
      g.fillStyle = PILL_BG;
      g.beginPath();
      g.roundRect(x, y, w, h, 6);
      g.fill();
      g.strokeStyle = color;
      g.globalAlpha = 0.85;
      g.lineWidth = 1;
      g.stroke();
      g.globalAlpha = 1;
    }

    function draw(now: number) {
      g.clearRect(0, 0, W, H);
      const cy = cursorY();
      const yOf = (world: number) => cy + (world - pos);
      const top = pos - cy, bot = pos + (H - cy);
      // quadrados que passaram por quadro: mede a velocidade para apagar o que faria "strobe"
      const step = Math.abs(pos - lastDrawPos);
      lastDrawPos = pos;
      const fade = (spacing: number) => clamp01(1 - (step / spacing - 0.3) / 0.7);

      // Grade de quadrados: cada um é 1 salário mínimo; C por linha; cor do grupo do próximo marco.
      // sqA = quanto os quadrados aparecem; em velocidade alta eles viram uma faixa contínua (anti-strobe).
      const sqA = fade(P);
      const bandA = 1 - sqA;
      const firstRow = Math.max(Math.floor(top / C), 0);
      const lastRow = Math.min(Math.floor(bot / C), Math.floor(last.px / C));
      if (sqA > 0) {
        let seg = 0;
        while (seg < items.length - 1 && items[seg]!.px <= firstRow * C) seg++;
        for (let r = firstRow; r <= lastRow; r++) {
          const y = Math.round(yOf(r * C));
          for (let c = 0; c < C; c++) {
            const idx = r * C + c;
            if (idx >= last.px) break;
            while (seg < items.length - 1 && items[seg]!.px <= idx) seg++;
            g.globalAlpha = sqA * (idx < pos ? 0.95 : 0.45);
            g.fillStyle = entityColor(items[seg]!.e);
            g.fillRect(X0 + c * P, y, SQ, SQ);
          }
        }
        g.globalAlpha = 1;
      }
      if (bandA > 0) {
        let prev = 0;
        for (const { e, px } of items) {
          const y0 = Math.max(yOf(prev), -2), y1 = Math.min(yOf(px), H + 2);
          if (y1 > y0) {
            g.fillStyle = entityColor(e);
            const yc = Math.min(Math.max(cy, y0), y1);
            if (yc > y0) { g.globalAlpha = bandA * 0.8; g.fillRect(X0, y0, GRID_W, yc - y0); }
            if (y1 > yc) { g.globalAlpha = bandA * 0.42; g.fillRect(X0, yc, GRID_W, y1 - yc); }
          }
          prev = px;
        }
        g.globalAlpha = 1;
      }

      // régua: a cada 10^L salários mínimos (L >= 2), uma linha fina no vão logo abaixo da linha de quadrados
      // que completa aquele número (cada marca no seu nível mais alto); o rótulo fica no canto esquerdo.
      g.font = "11px system-ui, sans-serif";
      g.textAlign = "left";
      g.textBaseline = "alphabetic";
      g.lineJoin = "round";
      g.lineWidth = 3;
      for (let L = LEVELS; L >= 2; L--) {
        const s10 = 10 ** L;
        const a = fade(s10);
        if (a <= 0) continue;
        for (let w = Math.ceil(Math.max(top, 0) / s10) * s10 || s10; w <= bot + C && w <= maxPos; w += s10) {
          if (L < LEVELS && w % (s10 * 10) === 0) continue;
          const row = Math.floor((w - 1) / C);
          const y = Math.round(yOf((row + 1) * C)) - 1;
          if (y < -12 || y > H + 12) continue;
          g.globalAlpha = a * (L === 2 ? 0.3 : 0.65);
          g.fillStyle = INK;
          g.fillRect(X0, y, GRID_W, 1);
          g.globalAlpha = a;
          const text = w.toLocaleString("pt-BR");
          g.strokeStyle = BG;
          g.strokeText(text, X0 + 3, y - 3);
          g.fillStyle = INK;
          g.fillText(text, X0 + 3, y - 3);
        }
      }
      g.globalAlpha = 1;

      // marcos: quadrado destacado (o que completa o valor) e bolha de duas linhas na mesma linha da grade
      let lastLabelY = -Infinity;
      const outlines: [number, number][] = []; // contornos desenhados por último: nenhum marco some sob uma bolha
      for (const { e, px } of items) {
        const idx = Math.max(Math.ceil(px) - 1, 0);
        const row = Math.floor(idx / C);
        const rowY = Math.round(yOf(row * C));
        const y = rowY + SQ / 2;
        if (y < -16 || y > H + 16) continue;
        const color = entityColor(e);
        const mx = X0 + (idx % C) * P;
        outlines.push([mx, rowY]);
        if (y - lastLabelY < LABEL_GAP) continue;
        lastLabelY = y;
        const avail = GRID_W * 0.62 - 10;
        g.font = "600 11px system-ui, sans-serif";
        const name = fit(e.label, avail);
        const nameW = g.measureText(name).width;
        g.font = "11px system-ui, sans-serif";
        const sub = fit(`${formatCompact(e.valueBRL)} · ${quadrados(px)}`, avail);
        const w = Math.max(nameW, g.measureText(sub).width) + 12;
        const h = 26;
        // lado da bolha: o que não cobre o quadrado marcado
        const rightX = X0 + GRID_W - w - 2, leftX = X0 + 2;
        const useRight = mx + SQ + 8 <= rightX || mx - 8 < leftX + w;
        const px0 = useRight ? rightX : leftX;
        const py0 = y - h / 2;
        g.fillStyle = color;
        g.globalAlpha = 0.7;
        if (useRight) g.fillRect(mx + SQ + 2, Math.round(y) - 0.5, Math.max(px0 - (mx + SQ + 2), 0), 1);
        else g.fillRect(px0 + w, Math.round(y) - 0.5, Math.max(mx - 2 - (px0 + w), 0), 1);
        g.globalAlpha = 1;
        pill(px0, py0, w, h, color);
        g.textAlign = "left";
        g.textBaseline = "alphabetic";
        g.fillStyle = INK;
        g.font = "600 11px system-ui, sans-serif";
        g.fillText(name, px0 + 6, py0 + 11);
        g.fillStyle = MUTED;
        g.font = "11px system-ui, sans-serif";
        g.fillText(sub, px0 + 6, py0 + 22);
      }

      g.strokeStyle = INK;
      g.lineWidth = 1.5;
      for (const [mx, rowY] of outlines) g.strokeRect(mx - 1.5, rowY - 1.5, SQ + 3, SQ + 3);

      // cursor
      g.fillStyle = INK;
      g.globalAlpha = 0.9;
      g.fillRect(0, Math.round(cy) - 0.5, W, 1);
      g.beginPath();
      g.moveTo(0, cy - 6);
      g.lineTo(9, cy);
      g.lineTo(0, cy + 6);
      g.fill();
      g.globalAlpha = 1;

      updateHud();
      if (now - lastListAt > 90 || pos === target) { lastListAt = now; updateNext(); }
    }

    function updateHud() {
      const pct = (pos / last.px) * 100;
      const big = formatCompact(pos * salarioMinimo.valueBRL);
      const sub = `${Math.floor(pos).toLocaleString("pt-BR")} salários · ${pct < 1 ? pct.toFixed(3).replace(".", ",") : pct.toFixed(1).replace(".", ",")}% do caminho até ${last.e.label}`;
      const key = big + "|" + sub;
      if (key === lastHud) return;
      lastHud = key;
      hudBig.textContent = big;
      hudSub.textContent = sub;
    }

    // ---- próximos marcos ----
    const rows = new Map<string, { li: HTMLLIElement; more: HTMLElement }>();
    let nextKey = "";
    function updateNext() {
      const ahead = items.filter((m) => m.px > pos + 0.5).slice(0, NEXT_COUNT);
      const key = ahead.map((m) => m.e.id).join(",");
      if (key !== nextKey) {
        nextKey = key;
        rows.clear();
        list.replaceChildren();
        if (ahead.length === 0) {
          const li = document.createElement("li");
          li.className = "conc-empty";
          li.textContent = `Fim do caminho: ${last.e.label}, ${formatCompact(last.e.valueBRL)}.`;
          list.append(li);
        }
        for (const { e } of ahead) {
          const li = document.createElement("li");
          const b = document.createElement("button");
          const sw = document.createElement("span");
          sw.className = "swatch";
          sw.style.background = entityColor(e);
          const name = document.createElement("span");
          name.className = "name";
          name.textContent = e.label;
          const val = document.createElement("span");
          val.className = "val";
          val.textContent = `${formatCompact(e.valueBRL)} · ${quadrados(pixelsFor(e.valueBRL))}`;
          const more = document.createElement("span");
          more.className = "more";
          b.append(sw, name, val, more);
          b.addEventListener("click", () => ctx.onSelect(e));
          li.append(b);
          list.append(li);
          rows.set(e.id, { li, more });
        }
      }
      for (const { e, px } of ahead) {
        const dist = px - pos;
        const share = shareText(e);
        rows.get(e.id)!.more.textContent = `faltam ${quadrados(dist)}` + (share ? ` · ${share}` : "");
      }
    }

    // ---- entradas ----
    function setGear(i: number) {
      gear = i;
      for (const b of bar.querySelectorAll<HTMLButtonElement>("[data-gear]")) b.setAttribute("aria-pressed", String(Number(b.dataset.gear) === i));
      setNote();
      updateNext();
    }
    bar.addEventListener("click", (ev) => {
      const b = (ev.target as HTMLElement).closest("button");
      if (!b) return;
      if (b.dataset.gear !== undefined) setGear(Number(b.dataset.gear));
      else if (b.dataset.act === "home") setTarget(0, false, 220);
    });

    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Cada quadradinho é um salário mínimo. Use as setas para andar e Home para voltar ao início.");
    canvas.addEventListener("keydown", (ev) => {
      const unit = k();
      switch (ev.key) {
        case "ArrowDown": setTarget(target + KEY_PX * unit); break;
        case "ArrowUp": setTarget(target - KEY_PX * unit); break;
        case "PageDown": case " ": setTarget(target + H * 0.9 * unit); break;
        case "PageUp": setTarget(target - H * 0.9 * unit); break;
        case "Home": setTarget(0, false, 220); break;
        default: return;
      }
      ev.preventDefault();
    });

    canvas.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();
        const unit = ev.deltaMode === 1 ? 16 : 1;
        setTarget(target + ev.deltaY * unit * k());
      },
      { passive: false },
    );

    // Arrasto de um dedo/mouse: acompanha 1:1 (vezes a marcha) e, ao soltar, desliza com a velocidade final.
    let drag: { id: number; y: number; startY: number; startX: number; moved: boolean; samples: { t: number; y: number }[] } | null = null;
    canvas.addEventListener("pointerdown", (ev) => {
      if (drag) return;
      canvas.setPointerCapture(ev.pointerId);
      drag = { id: ev.pointerId, y: ev.clientY, startY: ev.clientY, startX: ev.clientX, moved: false, samples: [{ t: ev.timeStamp, y: ev.clientY }] };
      target = pos; // interrompe qualquer deslize em andamento
    });
    canvas.addEventListener("pointermove", (ev) => {
      if (!drag || ev.pointerId !== drag.id) return;
      if (Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) > 6) drag.moved = true;
      if (!drag.moved) return;
      setTarget(pos - (ev.clientY - drag.y) * k(), true);
      drag.y = ev.clientY;
      drag.samples.push({ t: ev.timeStamp, y: ev.clientY });
      while (drag.samples.length > 2 && ev.timeStamp - drag.samples[0]!.t > 100) drag.samples.shift();
    });
    const endDrag = (ev: PointerEvent, cancelled: boolean) => {
      if (!drag || ev.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.moved) {
        if (!cancelled) tapAt(ev.clientY - canvas.getBoundingClientRect().top);
        return;
      }
      const a = d.samples[0]!, b = d.samples[d.samples.length - 1]!;
      const dt = b.t - a.t;
      if (dt > 0 && ev.timeStamp - b.t < 80) {
        const v = (b.y - a.y) / dt; // px de tela por ms (positivo = dedo descendo)
        setTarget(pos - v * k() * tuning.flingMs, false, tuning.flingMs);
      }
    };
    canvas.addEventListener("pointerup", (ev) => endDrag(ev, false));
    canvas.addEventListener("pointercancel", (ev) => endDrag(ev, true));

    /** Toque (sem arrasto): seleciona o marco mais próximo da linha tocada (até 14 px). */
    function tapAt(y: number) {
      let best: Entity | null = null, bestD = 16;
      for (const { e, px } of items) {
        const row = Math.floor(Math.max(Math.ceil(px) - 1, 0) / C);
        const d = Math.abs(cursorY() + (row * C - pos) + SQ / 2 - y);
        if (d < bestD) { bestD = d; best = e; }
      }
      ctx.onSelect(best);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    setNote();
    resize();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.className = "";
      el.replaceChildren();
    };
  },
};
