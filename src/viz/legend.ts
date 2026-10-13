import { sourceById } from "../data";
import type { Entity, Holding } from "../data/types";
import { shareText } from "../lib/percentil";
import { entityColor } from "./colors";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function holdingLine(h: Holding): string {
  const parts = [h.company];
  if (h.stake) parts.push(h.stake);
  if (h.listed === false) parts.push("fora da bolsa");
  return parts.join(" · ");
}

/**
 * Legenda de entidades (Sobrepostos, Desfile): lista com diff por id (itens que permanecem não são
 * recriados: sem reanimar, sem perder o scroll). Recolhido: nome, valor e as empresas por trás da fortuna.
 * Selecionado: expande com contexto, empresas (participação, observação), fonte, confiança e ressalva.
 */
export function createEntityLegend(o: {
  container: HTMLUListElement;
  /** Texto do valor à direita (ex.: "R$ 1,6 mi · 975 SM"). */
  valueText: (e: Entity) => string;
  onPick: (e: Entity) => void;
  emptyText: string;
  /** Linhas extras mostradas só no item expandido (ex.: "Volume: 12 litros"). */
  extraLines?: (e: Entity) => string[];
}) {
  const rows = new Map<string, HTMLLIElement>();
  let selectedId: string | null = null;
  let emptyRow: HTMLLIElement | null = null;

  function fillRow(li: HTMLLIElement, e: Entity) {
    const selected = e.id === selectedId;
    li.dataset.sel = String(selected);
    const b = document.createElement("button");
    b.setAttribute("aria-pressed", String(selected));
    b.setAttribute("aria-expanded", String(selected));

    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = entityColor(e);
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = e.label;
    const val = document.createElement("span");
    val.className = "val";
    val.textContent = o.valueText(e);
    b.append(sw, name, val);

    const more = document.createElement("span");
    more.className = "more";
    if (selected) {
      if (e.summary) {
        const p = document.createElement("span");
        p.className = "summary";
        p.textContent = e.summary;
        more.append(p);
      }
      const share = shareText(e);
      if (share) {
        const s = document.createElement("span");
        s.className = "holding";
        s.textContent = share;
        more.append(s);
      }
      for (const h of e.holdings ?? []) {
        const d = document.createElement("span");
        d.className = "holding";
        const t = document.createElement("strong");
        t.textContent = holdingLine(h);
        d.append(t);
        more.append(d);
      }
      for (const line of o.extraLines?.(e) ?? []) {
        const x = document.createElement("span");
        x.className = "holding";
        x.textContent = line;
        more.append(x);
      }
      const src = sourceById(e.sourceId);
      const meta = document.createElement("span");
      meta.className = "source";
      meta.textContent =
        `Fonte: ${src?.name ?? e.sourceId} (${src?.reference ?? e.year}).`;
      more.append(meta);
    } else if (e.holdings?.length) {
      more.className = "more chips";
      more.textContent = e.holdings.map((h) => h.company + "").join(" · ");
    } else if (e.summary) {
      more.className = "more clamp";
      more.textContent = e.summary;
    }
    if (more.childNodes.length) b.append(more);

    b.addEventListener("click", () => o.onPick(e));
    li.replaceChildren(b);
  }

  return {
    /** `list` já na ordem de exibição. */
    update(list: Entity[], selected: string | null) {
      selectedId = selected;
      const ids = new Set(list.map((e) => e.id));
      for (const [id, li] of rows) if (!ids.has(id)) { li.remove(); rows.delete(id); }
      list.forEach((e, i) => {
        let li = rows.get(e.id);
        const sel = e.id === selectedId;
        if (!li) {
          li = document.createElement("li");
          li.className = "conc-item";
          rows.set(e.id, li);
          fillRow(li, e);
        } else if (li.dataset.sel !== String(sel)) fillRow(li, e);
        if (o.container.children[i] !== li) o.container.insertBefore(li, o.container.children[i] ?? null);
      });
      if (list.length === 0) {
        if (!emptyRow) {
          emptyRow = document.createElement("li");
          emptyRow.className = "conc-empty";
          emptyRow.textContent = o.emptyText;
        }
        if (!emptyRow.isConnected) o.container.append(emptyRow);
      } else emptyRow?.remove();
    },
    has: (id: string) => rows.has(id),
    /** Rola só a própria legenda (scrollIntoView rolaria a página inteira e faria a tela pular). */
    scrollTo(id: string) {
      requestAnimationFrame(() => {
        const li = rows.get(id);
        if (li) o.container.scrollTo({ top: Math.max(li.offsetTop - 4, 0), behavior: reducedMotion() ? "auto" : "smooth" });
      });
    },
  };
}
