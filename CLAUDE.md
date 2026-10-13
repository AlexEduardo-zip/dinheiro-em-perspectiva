# CLAUDE.md

Aplicação web mobile-first que visualiza patrimônio no Brasil. Leia [README.md](README.md) e [docs/](docs/) antes de mudanças grandes.

## Comandos

- `npm run dev` | `npm run build` | `npm run typecheck` | `npm test`

## Regras do projeto

- Fonte de verdade dos dados: `patrimonio-brasil-2026.md`. JSON em `src/data/` é derivado; em conflito, o .md vence.
- **Nunca** misturar patrimônio e renda; **nunca** inventar dado para lacunas (classes A–D, MEI, médio empresário).
- Todo valor tem `sourceId`, `year`, `confidence`; `confidence != "alta"` exige `caveat`. Rode `npm test` após editar dados.
- Dinheiro sempre via `src/lib/format.ts`; geometria via `src/lib/scale.ts`. Razões entre valores calculadas em runtime, nunca digitadas.
- **Proibido escala logarítmica ou qualquer compressão** (ADR-007): a diferença real de tamanho é o ponto do projeto. Use zoom/rolagem para o que não cabe na tela.
- Visualizações seguem o contrato de `src/viz/types.ts`, registradas em `src/viz/registry.ts`. Sem hover como requisito, alvos de toque ≥ 44 px, sem dependências de runtime sem justificar em `docs/DECISOES.md`.
- Textos de interface em português do Brasil, **simples, objetivos e curtos** (uma frase de apoio por tela; sem parágrafos de ressalva; o gráfico fala por si): siga docs/LINGUAGEM.md (sem jargão, sem siglas, frases curtas, explicações longas só em blocos recolhíveis).
- Cores: tema claro, tons pastel sem neon; **tons quentes (uma cor por pessoa) para a classe trabalhadora, até o dono de cartório; azuis (uma cor por pessoa) para os mais ricos**; cores em `src/viz/colors.ts` (+ variáveis em `src/styles.css`); entrada nova nos dados precisa de cor (o teste cobra); regras em docs/LINGUAGEM.md.
- Ao concluir mudança: typecheck, test, build passando e docs atualizadas.
