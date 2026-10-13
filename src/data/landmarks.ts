/**
 * Alturas de referência para o Desfile. NÃO vêm do patrimonio-brasil-2026.md: são medidas conhecidas de
 * conhecimento geral, usadas só como régua visual (ver docs/DADOS.md). Valores arredondados.
 */
export interface Landmark {
  id: string;
  label: string;
  /** Altura em metros. */
  meters: number;
}

export const landmarks: Landmark[] = [
  { id: "cristo", label: "Cristo Redentor", meters: 38 },
  { id: "eiffel", label: "Torre Eiffel", meters: 330 },
  { id: "burj", label: "Burj Khalifa", meters: 828 },
  { id: "everest", label: "Monte Everest", meters: 8_849 },
  { id: "aviao", label: "Avião em voo de cruzeiro", meters: 11_000 },
  { id: "karman", label: "Limite do espaço", meters: 100_000 },
  { id: "iss", label: "Estação Espacial Internacional", meters: 400_000 },
];

/**
 * Marcos de tempo para "Em anos de salário": quantos anos atrás (a partir de 2026). Datas aproximadas e
 * de conhecimento geral, NÃO do .md; a carreira de 35 anos é uma suposição de comparação.
 */
export const timeLandmarks: { label: string; meters: number }[] = [
  { label: "Uma carreira", meters: 35 },
  { label: "Chegada dos portugueses (1500)", meters: 526 },
  { label: "Início da era cristã", meters: 2_026 },
  { label: "Pirâmide de Quéops", meters: 4_500 },
  { label: "Fim da última Era do Gelo", meters: 11_700 },
  { label: "Primeiros Homo sapiens", meters: 300_000 },
  { label: "Primeiras ferramentas de pedra", meters: 2_600_000 },
  { label: "Separação de humanos e chimpanzés", meters: 6_500_000 },
];
