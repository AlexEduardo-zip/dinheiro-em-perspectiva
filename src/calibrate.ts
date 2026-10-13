import { DEFAULTS, loadTuning, resetTuning, saveTuning, tuning, type Tuning } from "./viz/tuning";

/**
 * Painel de calibração, só com ?calibrar na URL. Mexe nos parâmetros de sensação ao vivo (sem recarregar),
 * mostra estimativas de esforço e FPS, guarda no aparelho e copia os valores para virarem o padrão.
 * Percurso de referência: ~9,6 unidades de log-zoom (Sobrepostos); o Desfile e as Pilhas têm ~14 a ~16.
 */

const RANGE = 9.6;

interface Knob {
  key: keyof Tuning;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Estimativa legível do esforço com o valor atual. */
  hint: (v: number) => string;
  fmt?: (v: number) => string;
}

const fmtNum = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

const KNOBS: Knob[] = [
  {
    key: "pinchExponent", label: "Pinça (celular)", min: 0.1, max: 1.5, step: 0.05,
    hint: (v) => `dobrar a distância dos dedos rende ${fmtNum(v * Math.LN2)}; ≈ ${fmtNum(RANGE / (v * Math.LN2))} pinças até o fim`,
  },
  {
    key: "buttonTap", label: "Toque em + / −", min: 0.01, max: 0.3, step: 0.005,
    hint: (v) => `≈ ${fmtNum(RANGE / v)} toques até o fim`,
  },
  {
    key: "holdSpeed", label: "Segurar + / −", min: 0.0001, max: 0.002, step: 0.0001,
    hint: (v) => `≈ ${fmtNum(RANGE / (v * 1000))} s segurando até o fim`,
    fmt: (v) => `${(v * 1000).toFixed(2)} /s`,
  },
  {
    key: "zoomSmoothMs", label: "Suavidade do zoom (ms)", min: 40, max: 400, step: 10,
    hint: (v) => (v < 80 ? "seco, responde na hora" : v > 250 ? "muito macio, pode parecer atrasado" : "macio"),
  },
  {
    key: "panSmoothMs", label: "Suavidade ao arrastar/rolar (ms)", min: 40, max: 300, step: 10,
    hint: (v) => (v < 70 ? "seco" : v > 200 ? "muito macio" : "macio"),
  },
  {
    key: "flingMs", label: "Deslize ao soltar o dedo (ms)", min: 100, max: 800, step: 20,
    hint: (v) => `o conteúdo continua andando ≈ ${fmtNum((v * 3) / 1000)} s depois de soltar`,
  },
  {
    key: "wheelGain", label: "Roda do mouse (desktop)", min: 0.0001, max: 0.003, step: 0.0001,
    hint: (v) => `1 clique de roda = ${fmtNum(v * 100)}; ≈ ${fmtNum(RANGE / (v * 100))} cliques até o fim`,
    fmt: (v) => v.toFixed(4),
  },
  {
    key: "keyStep", label: "Teclas ↑ ↓ (desktop)", min: 0.002, max: 0.1, step: 0.001,
    hint: (v) => `≈ ${fmtNum(RANGE / v)} repetições até o fim`,
    fmt: (v) => v.toFixed(3),
  },
];

export function mountCalibration(): void {
  loadTuning();

  const btn = document.createElement("button");
  btn.className = "cal-fab";
  btn.textContent = "⚙";
  btn.setAttribute("aria-label", "Calibrar sensação (esforço do zoom, deslize)");
  const panel = document.createElement("section");
  panel.className = "cal-panel";
  panel.hidden = true;
  document.body.append(btn, panel);

  const sliders = new Map<keyof Tuning, { input: HTMLInputElement; val: HTMLElement; hint: HTMLElement; knob: Knob }>();
  panel.innerHTML = `
    <header><strong>Calibração</strong><span class="cal-fps">-- fps</span><button class="cal-close" aria-label="Fechar">×</button></header>
    <p class="cal-help">Mexa, volte à visualização e teste. Os valores ficam salvos neste aparelho. Quando gostar, toque em "Copiar" e me mande o texto.</p>
    <div class="cal-knobs"></div>
    <footer>
      <button class="cal-reset">Restaurar padrão</button>
      <button class="cal-copy">Copiar valores</button>
    </footer>
    <pre class="cal-out" hidden></pre>`;
  const knobsEl = panel.querySelector<HTMLElement>(".cal-knobs")!;

  for (const k of KNOBS) {
    const row = document.createElement("label");
    row.className = "cal-row";
    row.innerHTML = `<span class="cal-label"></span><span class="cal-val"></span><input type="range" /><span class="cal-hint"></span>`;
    row.querySelector<HTMLElement>(".cal-label")!.textContent = k.label;
    const input = row.querySelector<HTMLInputElement>("input")!;
    input.min = String(k.min);
    input.max = String(k.max);
    input.step = String(k.step);
    const val = row.querySelector<HTMLElement>(".cal-val")!;
    const hint = row.querySelector<HTMLElement>(".cal-hint")!;
    input.addEventListener("input", () => {
      tuning[k.key] = Number(input.value);
      saveTuning();
      refresh();
    });
    knobsEl.append(row);
    sliders.set(k.key, { input, val, hint, knob: k });
  }

  function refresh() {
    for (const [key, s] of sliders) {
      const v = tuning[key];
      s.input.value = String(v);
      s.val.textContent = s.knob.fmt ? s.knob.fmt(v) : String(v);
      s.hint.textContent = s.knob.hint(v) + (v !== DEFAULTS[key] ? `  (padrão ${s.knob.fmt ? s.knob.fmt(DEFAULTS[key]) : DEFAULTS[key]})` : "");
    }
  }

  const out = panel.querySelector<HTMLElement>(".cal-out")!;
  panel.querySelector(".cal-reset")!.addEventListener("click", () => { resetTuning(); refresh(); out.hidden = true; });
  panel.querySelector(".cal-copy")!.addEventListener("click", async () => {
    const text =
      `Calibração (${new Date().toLocaleDateString("pt-BR")}, ${navigator.userAgent.slice(0, 80)}, tela ${window.innerWidth}×${window.innerHeight}, dpr ${window.devicePixelRatio})\n` +
      JSON.stringify(tuning, null, 2);
    out.textContent = text;
    out.hidden = false;
    try {
      await navigator.clipboard.writeText(text);
      (panel.querySelector(".cal-copy") as HTMLElement).textContent = "Copiado ✓";
      setTimeout(() => ((panel.querySelector(".cal-copy") as HTMLElement).textContent = "Copiar valores"), 1500);
    } catch {
      // sem permissão de clipboard (http no celular): o texto já está visível para copiar à mão
    }
  });
  const toggle = (open: boolean) => { panel.hidden = !open; btn.hidden = open; };
  btn.addEventListener("click", () => toggle(true));
  panel.querySelector(".cal-close")!.addEventListener("click", () => toggle(false));

  // FPS: média do último segundo
  const fpsEl = panel.querySelector<HTMLElement>(".cal-fps")!;
  let frames = 0, t0 = performance.now();
  const loop = (now: number) => {
    frames++;
    if (now - t0 >= 1000) {
      fpsEl.textContent = `${Math.round((frames * 1000) / (now - t0))} fps`;
      frames = 0;
      t0 = now;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  refresh();
}
