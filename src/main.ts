import "./styles.css";
import { sourceById, validateData, wealthEntities } from "./data";
import type { Entity } from "./data/types";
import { formatCompact, formatFull } from "./lib/format";
import { visualizations } from "./viz/registry";
import { shareText } from "./lib/percentil";

if (import.meta.env.DEV) {
  const problems = validateData();
  if (problems.length) console.warn("Problemas nos dados:\n" + problems.join("\n"));
}

// Painel de calibração (esforço do zoom, deslize): só com ?calibrar na URL; o app público usa os padrões.
if (new URLSearchParams(location.search).has("calibrar")) {
  import("./calibrate").then((m) => m.mountCalibration());
}

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <header class="top">
    <h1>Dinheiro em Perspectiva</h1>
    <nav id="tabs" aria-label="Visualizações"></nav>
  </header>
  <main>
    <p id="question" class="question"></p>
    <section id="viz" aria-live="polite"></section>
  </main>
  <aside id="detail" class="detail" hidden></aside>
  <footer>Os números vêm de fontes e anos diferentes.</footer>
`;

const tabs = app.querySelector<HTMLElement>("#tabs")!;
const vizEl = app.querySelector<HTMLElement>("#viz")!;
const questionEl = app.querySelector<HTMLElement>("#question")!;
const detail = app.querySelector<HTMLElement>("#detail")!;

function showDetail(e: Entity | null) {
  if (!e) { detail.hidden = true; return; }
  const src = sourceById(e.sourceId);
  detail.hidden = false;
  detail.innerHTML = `
    <button class="close" aria-label="Fechar">×</button>
    <h2></h2>
    <p class="value"></p>
    <p class="meta"></p>
    <p class="caveat"></p>
    <p class="summary"></p>
    <ul class="holdings"></ul>`;
  detail.querySelector("h2")!.textContent = e.label;
  detail.querySelector(".value")!.textContent = `${formatCompact(e.valueBRL)} (${formatFull(e.valueBRL)})`;
  detail.querySelector(".meta")!.textContent = `Fonte: ${src?.name ?? e.sourceId} (${src?.reference ?? e.year}).`;
  detail.querySelector(".caveat")!.textContent = e.caveat ?? "";
  detail.querySelector(".summary")!.textContent = [e.summary, shareText(e)].filter(Boolean).join(" ");
  const list = detail.querySelector(".holdings")!;
  for (const h of e.holdings ?? []) {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = [h.company, h.stake, h.listed === false ? "fora da bolsa" : ""].filter(Boolean).join(" · ");
    li.append(strong);
    if (h.note) li.append(document.createTextNode(` — ${h.note}`));
    list.append(li);
  }
  detail.querySelector(".close")!.addEventListener("click", () => showDetail(null));
}

let cleanup: (() => void) | undefined;

const ALIASES: Record<string, string> = { escada: "distribuicao" };

function select(id: string) {
  id = ALIASES[id] ?? id;
  cleanup?.();
  cleanup = undefined;
  showDetail(null);
  const viz = visualizations.find((v) => v.id === id && v.status === "ready") ?? visualizations.find((v) => v.status === "ready")!;
  history.replaceState(null, "", `#${viz.id}`);
  for (const b of tabs.querySelectorAll("button")) b.setAttribute("aria-current", String(b.dataset.id === viz.id));
  questionEl.textContent = viz.question;
  cleanup = viz.mount?.(vizEl, { entities: wealthEntities(), onSelect: showDetail });
}

for (const v of visualizations) {
  const b = document.createElement("button");
  b.textContent = v.title;
  b.dataset.id = v.id;
  b.disabled = v.status !== "ready";
  if (b.disabled) b.title = "Em breve";
  b.addEventListener("click", () => select(v.id));
  tabs.append(b);
}

select(location.hash.slice(1));
window.addEventListener("hashchange", () => select(location.hash.slice(1)));
