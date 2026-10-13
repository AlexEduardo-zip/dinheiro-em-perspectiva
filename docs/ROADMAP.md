# Roadmap

## Fase 0 — Fundação (concluída)

- [x] Projeto Vite + TypeScript estrito, build estático, testes
- [x] Dados do .md estruturados (25 entidades, 6 fatos, 9 fontes) com validação de integridade
- [x] `lib/format` (pt-BR) e `lib/scale` com testes
- [x] Shell mobile-first: abas, hash routing, bottom sheet de detalhe
- [x] Contrato de visualização + registry
- [x] Visualização: Em anos de salário (colunas de anos, marcos de tempo, 12 salários por ano)
- [x] Visualização: Pilhas de notas (altura real, largura real, notas uma a uma, volume; espessura estimada)
- [x] Visualização: Desfile (altura real, zoom cansativo, referências de altura, posições telescópicas)
- [x] Visualização: Distribuição (antes "Escada": "toda a riqueza" e cenário ideal de divisão igual, com quantos teriam mais e menos; substitui "100 pessoas") e 1% mais rico (barras 1% × 99%, cartões e, no fim, a fila em escala real com a barra do 1% crescendo para baixo e contador de telas) e 1% mais rico (estimativa em números absolutos, só texto e cartões)
- [x] Visualização: Pixel a pixel (1 px = 1 salário mínimo, marchas 1× a 10 mil×, marcos, HUD)
- [x] Visualização: Sobrepostos (círculos concêntricos, salário mínimo ao centro, legenda por círculos inteiros na tela)
- [x] Documentação

## Fase 1 — Núcleo de exploração

Objetivo: ter 3 formas bem diferentes para comparar e decidir quais continuam.

1. **Pixel a pixel**: v1 pronta; falta calibrar no celular (deslize, marchas) e decidir se o URL guarda a posição (`#pixel-scroll?sm=252`).
2. **Escada e 1% mais rico**: v1 prontas (ADR-020). A população adulta (IBGE 2022) já está em `facts.json`; próximo: milionários como "1 em N adultos" e decis se aparecerem na base.
3. **Pilhas de notas**: v1 pronta; a **espessura da nota (0,11 mm) é estimada**: medir uma pilha real ou achar fonte oficial.


## Fase 2 — Personalização e narrativa

- "Onde eu me encaixo": usuário informa o patrimônio (campo numérico, cálculo local) e vê seu círculo, pixel e posição relativa às entidades. Nada é enviado nem salvo.
- Modo narrativo: roteiro guiado de 8 a 10 passos ("Você: R$ 22 mil → ... → Saverin"), rolagem vertical com cartões.
- Razões geradas em runtime (ex.: "490 mil vezes") com texto automático.
- Lista acessível (tabela) de cada viz.

## Fase 3 — Publicação

- Estado na URL, imagem Open Graph, `navigator.share`, captura da viz como imagem.
- PWA: ícones, service worker, offline.
- Deploy automatizado (GitHub Pages ou Cloudflare Pages) via CI com `typecheck`, `test`, `build`.
- Página "Sobre os dados" com todas as ressalvas do .md e a lista de fontes (a seção 11 do .md já é a base).
- Revisão de acessibilidade e teste em dispositivos reais.

## Fase 4 — Atualização de dados

- Processo para nova edição do .md (anual, ou quando sair lista Forbes/UBS nova).
- Avaliar script que gere `entities.json` a partir de uma tabela estruturada no .md, se a manutenção manual ficar propensa a erro (ver [DECISOES.md](DECISOES.md), ADR-003).
- Preencher lacunas (MEI, médio empresário) se o painel da Receita permitir coleta documentada.

## Perguntas em aberto

0. **Calibrar o esforço do zoom** (ADR-012) no celular: painel `?calibrar` e roteiro em [CALIBRACAO.md](CALIBRACAO.md). ~160 cliques de roda, ~32 s segurando "−" e pinça com expoente 0,4 são palpites até haver teste em aparelho real.
0. **Cortes de 25% e 75% reais** (ADR-024): hoje são estimativa de modelo (≈ R$ 6,7 mil e ≈ R$ 76 mil); se aparecer fonte com os percentis do Brasil (UBS Databook, ou WID com a mesma mediana), trocar o modelo pelo dado.
0. **Casa própria / composição do patrimônio do brasileiro médio:** o .md não tem o dado. Pesquisar fonte (UBS, IBGE, Banco Central) e acrescentar à base antes de afirmar na legenda.

1. **Marchas do pixel a pixel** (ADR-013): cinco marchas manuais são suficientes ou é melhor outra forma de acelerar? Escala base decidida: 1 px = 1 salário mínimo (ADR-010).
2. **Como tratar unidades diferentes na mesma tela?** (família vs adulto vs conta): legenda, badge no círculo, ou filtro por unidade?
3. ~~"100 pessoas" com dado incompleto~~: resolvido (ADR-020): a grade foi substituída; só se usa o que a base sustenta e as estimativas ficam explícitas.
4. **Tom editorial:** puramente descritivo, ou com contexto comparativo (PIB, orçamentos públicos)? Posição atual: descritivo.
5. **Nomes de pessoas físicas:** dados da Forbes são públicos e amplamente divulgados; revisar se queremos nomes ou apenas "o 1º, o 2º…" na versão publicada.
6. ~~Nota de R$ 100 vs R$ 200 e 12 vs 13 salários~~: decidido (R$ 100, ADR-018; 12 salários, ADR-019).
7. **Biblioteca de gráficos:** manter DOM/SVG/Canvas puros ou adotar d3 (módulos pontuais: `d3-hierarchy`, `d3-scale`) para packing/escalas?
8. **Nome do produto e domínio.** "Dinheiro em Perspectiva" é provisório.

## Definição de pronto (qualquer entrega)

`npm run typecheck`, `npm test` e `npm run build` passam; testado em 360×640 e 390×844; nenhuma escala comprime a diferença (sem log); dados citam fonte/ano/ressalva; docs atualizadas.
