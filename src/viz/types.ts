import type { Entity } from "../data/types";

/** Tudo que uma visualização recebe. Ela não importa dados diretamente: facilita testar e trocar. */
export interface VizContext {
  /** Entidades de patrimônio, maiores primeiro. */
  entities: Entity[];
  /** Chamado ao tocar/selecionar uma entidade; a shell mostra o painel de detalhe (fonte, ressalva). */
  onSelect: (entity: Entity | null) => void;
}

/** Contrato de toda visualização. Ver docs/ARQUITETURA.md. */
export interface Visualization {
  id: string;
  title: string;
  /** Uma frase: a pergunta que esta visualização responde. */
  question: string;
  /** planned = aparece desabilitada no menu, sem código. */
  status: "ready" | "planned";
  /** Monta no elemento e devolve a função de limpeza (remover listeners, observers, rAF). */
  mount?: (el: HTMLElement, ctx: VizContext) => () => void;
}
