/** Esquema dos dados. Documentado em docs/DADOS.md. */

/** O que o número representa. Define se pode entrar em comparações lado a lado. */
export type Kind =
  | "individual" // uma pessoa/família nomeada (ex.: Forbes)
  | "average" // média de um grupo
  | "median" // mediana de um grupo
  | "aggregate" // soma de um grupo (ex.: fortuna dos 255 bilionários)
  | "reference"; // régua de comparação, não patrimônio (ex.: salário mínimo)

/** wealth = patrimônio (estoque). income = renda (fluxo). Nunca misturar na mesma escala. */
export type Measure = "wealth" | "income";

/** Unidade estatística do valor: muda a comparabilidade. */
export type Unit = "pessoa" | "familia" | "adulto" | "conta" | "grupo";

export type Confidence = "alta" | "media-alta" | "media" | "baixa";

export type GroupId =
  | "topo" // bilionários e banqueiros
  | "acionistas" // grandes acionistas B3
  | "alta-renda" // private banking, milionários
  | "ocupacoes" // patrimônio médio por ocupação (Receita)
  | "politicos" // patrimônio médio declarado dos eleitos, por cargo (TSE)
  | "geral"; // médias e medianas nacionais

export interface Source {
  id: string;
  name: string;
  url?: string;
  /** Ano-base ou data de referência, como publicado. */
  reference: string;
}

/** Empresa/banco de onde vem (ou em que está) o patrimônio. Fonte: patrimonio-brasil-2026.md, seções 2 e 3.1. */
export interface Holding {
  company: string;
  /** Participação, como publicada (inclui a data/fonte quando relevante). */
  stake?: string;
  /** Código de negociação. NÃO consta no .md: conhecimento geral, conferir antes de publicar (ver docs/DADOS.md). */
  ticker?: string;
  /** true = ações negociadas em bolsa; false = capital fechado; ausente = o .md não diz. */
  listed?: boolean;
  note?: string;
}

export interface Entity {
  id: string;
  label: string;
  group: GroupId;
  kind: Kind;
  measure: Measure;
  unit: Unit;
  /** Valor em reais (R$). */
  valueBRL: number;
  /** Faixa quando a fonte dá intervalo ou há versões divergentes. */
  rangeBRL?: [number, number];
  /** Ano de referência do dado (não da publicação). */
  year: number;
  sourceId: string;
  confidence: Confidence;
  /** Ressalva curta exibível ao usuário. Obrigatória quando confidence != "alta". */
  caveat?: string;
  /** Seção correspondente em patrimonio-brasil-2026.md. */
  mdSection: string;
  /** Uma frase de contexto exibida na legenda (quem é / o que o número mede). */
  summary?: string;
  /** Bancos/empresas/ações por trás da fortuna. */
  holdings?: Holding[];
}

/** Fatos de contexto (contagens, percentuais), não plotados como patrimônio. */
export interface Fact {
  id: string;
  label: string;
  value: number;
  unit: "pessoas" | "percentual" | "brl" | "razao";
  year: number;
  sourceId: string;
  caveat?: string;
}
