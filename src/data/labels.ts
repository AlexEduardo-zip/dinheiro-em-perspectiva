import type { Confidence } from "./types";

/** Texto para o leitor (os valores internos não têm acento nem espaço). */
export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  alta: "alta",
  "media-alta": "boa",
  media: "média",
  baixa: "baixa",
};
