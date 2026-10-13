/**
 * Parâmetros de "sensação" (esforço do zoom, suavização, deslize). Valores vivos e mutáveis: o painel
 * de calibração (?calibrar) altera este objeto e as visualizações o leem a cada uso. Os PADRÕES abaixo
 * são o que vai para produção; ajuste-os depois de calibrar num celular real (docs/CALIBRACAO.md).
 */
export interface Tuning {
  /** log-zoom por pixel de deltaY da roda: um clique de roda (100) = 100 × wheelGain. */
  wheelGain: number;
  /** log-zoom por repetição de tecla (setas, +/−). */
  keyStep: number;
  /** log-zoom por toque nos botões +/−. */
  buttonTap: number;
  /** log-zoom por ms segurando + ou −. */
  holdSpeed: number;
  /** pinça: ratio^expoente. */
  pinchExponent: number;
  /** ms: amortecimento do zoom (maior = mais macio). */
  zoomSmoothMs: number;
  /** ms: amortecimento de pan/roda/teclas. */
  panSmoothMs: number;
  /** ms: duração do deslize depois de soltar o dedo (maior = desliza mais longe). */
  flingMs: number;
}

export const DEFAULTS: Readonly<Tuning> = {
  wheelGain: 0.0006,
  keyStep: 0.015,
  buttonTap: 0.05,
  holdSpeed: 0.0003,
  pinchExponent: 0.4,
  zoomSmoothMs: 150,
  panSmoothMs: 110,
  flingMs: 320,
};

export const tuning: Tuning = { ...DEFAULTS };

const KEY = "dp-tuning";

/** Lê valores salvos (só usado com ?calibrar; o app público sempre usa DEFAULTS). */
export function loadTuning(): void {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<Tuning>;
    for (const k of Object.keys(DEFAULTS) as (keyof Tuning)[]) {
      const v = saved[k];
      if (typeof v === "number" && Number.isFinite(v)) tuning[k] = v;
    }
  } catch {
    /* armazenamento indisponível: segue com os padrões */
  }
}

export function saveTuning(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tuning));
  } catch {
    /* ignora */
  }
}

export function resetTuning(): void {
  Object.assign(tuning, DEFAULTS);
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
