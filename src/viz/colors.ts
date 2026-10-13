import type { Entity, GroupId } from "../data/types";

/**
 * Paleta única (ADR-032, ADR-034): fundo claro e limpo, tons PASTEL, sem neon.
 *
 * Significado:
 *  - TONS QUENTES (vermelho, rosa, coral, laranja, amarelo...) = a CLASSE TRABALHADORA, que vai do adulto do meio até o
 *    dono de cartório (inclusive). O vermelho forte fica com o adulto do meio.
 *  - AZUIS (celeste, royal, ciano, índigo, marinho...) = os mais ricos, do investidor rico até Eduardo Saverin.
 * Cada pessoa/grupo tem a SUA cor, e as cores de vizinhos na escala de riqueza alternam em claro/escuro e em tom, para
 * a separação ser fácil de ver mesmo com 13 cores quentes e 12 azuis (colors.test.ts confere a distância entre vizinhos).
 * Os mesmos valores de grupo estão como variáveis em styles.css (:root); o canvas não lê variáveis CSS.
 */

/** Cor "genérica" por grupo (usada em CSS e como reserva para entidades novas sem cor própria). */
export const GROUP_COLOR: Record<GroupId, string> = {
  geral: "#E2737D",
  ocupacoes: "#E59A3C",
  politicos: "#8E5A6B",
  "alta-renda": "#5E8DD8",
  acionistas: "#3F6FBF",
  topo: "#2B4A80",
};

/** Limite da classe trabalhadora: patrimônio médio do dono de cartório (R$ 3,28 mi), o último do grupo. */
export const WORKING_CLASS_MAX_BRL = 3_280_000;
export const isWorkingClass = (e: Pick<Entity, "valueBRL">) => e.valueBRL <= WORKING_CLASS_MAX_BRL;

/** Classe trabalhadora: 13 tons quentes, em ordem crescente de patrimônio. */
export const WORKING_COLORS: Record<string, string> = {
  "meio-salario-minimo": "#F4B1B7", // rosa claro
  "salario-minimo": "#E8808A", // rosa
  "adulto-mediano": "#D9505C", // vermelho (o adulto do meio)
  "adulto-medio": "#F6C77A", // âmbar claro
  "declarante-medio": "#D97B4F", // coral escuro
  "familia-media": "#F2DA6E", // amarelo
  agro: "#C45C3E", // tijolo
  "dirigente-industria": "#F0A0BB", // rosa-chiclete
  atleta: "#E59A3C", // laranja
  diplomata: "#A9485A", // vinho
  mp: "#F7BC93", // pêssego
  judiciario: "#D6A93E", // mostarda
  cartorio: "#C9524A", // vermelho-tijolo
  vereador: "#9C5B3B", // eleitos (TSE)
  "vice-prefeito": "#D86A8C", // eleitos (TSE)
  "deputado-distrital": "#F2C14E", // eleitos (TSE)
  prefeito: "#8E5A6B", // eleitos (TSE)
  "deputado-estadual": "#F2A9A0", // eleitos (TSE)
  "deputado-federal": "#F5CBA7", // eleitos (TSE)
};

/** Os mais ricos: 12 tons de azul, em ordem crescente de patrimônio. */
export const RICH_COLORS: Record<string, string> = {
  "private-conta": "#A9CCF2", // celeste
  barsi: "#3F6FBF", // azul royal
  mateus: "#7DBBD8", // azul-aço claro
  "bilionarios-media": "#2B4A80", // marinho
  moll: "#7C8FE0", // pervinca forte
  "top10-piso": "#B9D8EE", // azul bebê
  "p-salles": "#5C61C9", // índigo
  "fm-salles": "#8ED3E8", // ciano claro
  esteves: "#355E9E", // azul forte
  lemann: "#B8CDEB", // azul-acinzentado claro
  safra: "#1F3A6E", // marinho profundo
  saverin: "#4A80B5", // azul-aço
  senador: "#5E7CC4", // eleitos (TSE)
  governador: "#B7C4F2", // eleitos (TSE)
  "vice-governador": "#3A7CA5", // eleitos (TSE)
};

/** Cor própria da pessoa/grupo (ou a do grupo, se não houver). */
export function entityColor(e: Pick<Entity, "id" | "group">): string {
  return WORKING_COLORS[e.id] ?? RICH_COLORS[e.id] ?? GROUP_COLOR[e.group];
}

export const RED = "#E2737D";
export const RED_INK = "#B8434F"; // vermelho escuro, para destaques finos e textos
export const BLUE = "#5B87D3"; // azul "dos mais ricos" nas barras de metade/1%
export const NAVY = "#2B4A80";

/** Texto e linhas no canvas (fundo branco). */
export const INK = "#1F2A3D";
export const MUTED = "#667085";
export const LINE = "#98A2B3";
export const GROUND = "#E9EDF4";
/** Fundo dos rótulos (halo) e das etiquetas sobre o desenho. */
export const BG = "#FFFFFF";
export const PILL_BG = "rgba(255,255,255,0.94)";
