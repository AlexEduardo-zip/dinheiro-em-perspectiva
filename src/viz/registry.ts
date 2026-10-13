import { notes } from "./notes/notes";
import { parade } from "./parade/parade";
import { pixelScroll } from "./pixel-scroll/pixel-scroll";
import { distribution } from "./distribution/distribution";
import { top1 } from "./top1/top1";
import { years } from "./years/years";
import { concentric } from "./concentric/concentric";
import type { Visualization } from "./types";

/**
 * Registro único. Adicionar uma visualização = criar a pasta em src/viz/<id>/ e incluir aqui.
 * Visualizações com status "planned" aparecem desabilitadas no menu (hoje todas estão prontas); detalhes em docs/VISUALIZACOES.md.
 */
export const visualizations: Visualization[] = [
  pixelScroll,
  concentric,
  distribution,
  top1,
  parade,
  notes,
  years,
];
