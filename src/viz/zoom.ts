/**
 * Câmera de zoom compartilhada (Sobrepostos, Desfile). O valor é o LOGARITMO de uma escala (px por unidade);
 * isso é só parâmetro da câmera: os dados nunca são comprimidos (ADR-007). Afastar = diminuir o valor.
 *
 * Fluidez: o valor atual persegue o alvo com amortecimento exponencial, independente da taxa de quadros.
 * Esforço (ADR-012): de propósito é cansativo percorrer a escala inteira; os valores ficam em ./tuning.ts.
 */

import { tuning } from "./tuning";

export interface ZoomEffort {
  /** log-zoom por pixel de deltaY: um clique de roda (100) vale 0,06. */
  wheelGain: number;
  /** por repetição de tecla (setas, +/−). */
  keyStep: number;
  /** um toque nos botões +/−. */
  buttonTap: number;
  /** por ms segurando + ou −. */
  holdSpeed: number;
  /** pinça: ratio^expoente (dobrar a distância dos dedos vale 0,28). */
  pinchExponent: number;
}

/** Esforço atual: é o objeto vivo de ./tuning (valores padrão e calibração em ?calibrar). */
export const ZOOM_EFFORT: ZoomEffort = tuning;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface ZoomCamera {
  /** Zoom atual (já amortecido): use este para desenhar. */
  readonly value: number;
  /** Zoom desejado. */
  readonly target: number;
  /** Define o alvo (limitado aos limites). `instant` pula o amortecimento (pinça: o dedo já suaviza). */
  setTarget(v: number, instant?: boolean): void;
  /** Garante um quadro (ex.: para redesenhar uma seleção). */
  kick(): void;
  /** Reaplica os limites (depois de um resize). */
  reclamp(): void;
  setHold(dir: -1 | 0 | 1): void;
  destroy(): void;
}

export function createZoomCamera(o: {
  initial: number;
  bounds: () => { lo: number; hi: number };
  onFrame: () => void;
  effort?: ZoomEffort;
}): ZoomCamera {
  const effort = o.effort ?? ZOOM_EFFORT;
  let value = o.initial;
  let target = value;
  let raf = 0;
  let lastT = -1;
  let hold: -1 | 0 | 1 = 0;
  const clamp = (v: number) => {
    const { lo, hi } = o.bounds();
    return Math.min(Math.max(v, lo), hi);
  };

  function kick() {
    if (raf) return;
    lastT = -1; // o primeiro quadro define a referência: timestamps de rAF e performance.now() divergem
    raf = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    raf = 0;
    // dt nunca negativo nem enorme (aba em segundo plano): negativo faria o zoom fugir do alvo
    const dt = lastT < 0 ? 16 : Math.max(0, Math.min(now - lastT, 50));
    lastT = now;
    if (hold) target = clamp(target + hold * dt * effort.holdSpeed);
    const diff = target - value;
    value = Math.abs(diff) < 0.0004 ? target : value + diff * (1 - Math.exp(-dt / tuning.zoomSmoothMs));
    o.onFrame();
    if (hold || value !== target) raf = requestAnimationFrame(tick);
  }

  return {
    get value() { return value; },
    get target() { return target; },
    setTarget(v, instant = false) {
      target = clamp(v);
      if (instant || reducedMotion()) value = target;
      kick();
    },
    kick,
    reclamp() { value = clamp(value); target = clamp(target); },
    setHold(dir) { hold = dir; if (dir) kick(); },
    destroy() { cancelAnimationFrame(raf); raf = 0; hold = 0; },
  };
}

/**
 * Liga botões [data-act="in"|"out"] (toque = passo curto; segurar = contínuo), roda do mouse e teclado.
 * `wheelFirst` pode consumir a roda antes (ex.: pan horizontal no Desfile): retorne true se tratou.
 */
export function bindZoomControls(
  cam: ZoomCamera,
  o: {
    canvas: HTMLCanvasElement;
    bar: HTMLElement;
    ariaLabel: string;
    effort?: ZoomEffort;
    wheelFirst?: (ev: WheelEvent) => boolean;
    keyFirst?: (ev: KeyboardEvent) => boolean;
  },
) {
  const effort = o.effort ?? ZOOM_EFFORT;

  for (const [act, dir] of [["in", 1], ["out", -1]] as const) {
    const btn = o.bar.querySelector<HTMLButtonElement>(`[data-act="${act}"]`);
    if (!btn) continue;
    btn.addEventListener("pointerdown", (ev) => {
      btn.setPointerCapture(ev.pointerId);
      cam.setTarget(cam.target + dir * effort.buttonTap);
      cam.setHold(dir);
    });
    const release = () => cam.setHold(0);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); cam.setTarget(cam.target + dir * effort.buttonTap); }
    });
  }

  o.canvas.tabIndex = 0;
  o.canvas.setAttribute("aria-label", o.ariaLabel);
  o.canvas.addEventListener("keydown", (ev) => {
    if (o.keyFirst?.(ev)) { ev.preventDefault(); return; }
    const k = ev.key;
    if (k === "ArrowUp" || k === "+" || k === "=") cam.setTarget(cam.target + effort.keyStep);
    else if (k === "ArrowDown" || k === "-" || k === "_") cam.setTarget(cam.target - effort.keyStep);
    else if (k === "Home") cam.setTarget(Infinity);
    else if (k === "End") cam.setTarget(-Infinity);
    else return;
    ev.preventDefault();
  });

  o.canvas.addEventListener(
    "wheel",
    (ev) => {
      ev.preventDefault();
      if (o.wheelFirst?.(ev)) return;
      const unit = ev.deltaMode === 1 ? 16 : 1;
      // acumula em target: vários eventos rápidos somam e a câmera desliza até o total
      cam.setTarget(cam.target - ev.deltaY * unit * effort.wheelGain);
    },
    { passive: false },
  );
}

/** Pinça (dois dedos): chame start/move com a distância entre os dedos. */
export function createPinch(cam: ZoomCamera, effort: ZoomEffort = ZOOM_EFFORT) {
  let ref: { dist: number; value: number } | null = null;
  return {
    start(dist: number) { ref = { dist, value: cam.target }; },
    move(dist: number) {
      if (ref && ref.dist > 0) cam.setTarget(ref.value + effort.pinchExponent * Math.log(dist / ref.dist), true);
    },
    end() { ref = null; },
    get active() { return ref !== null; },
  };
}
