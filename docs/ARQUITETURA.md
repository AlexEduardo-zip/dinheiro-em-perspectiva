# Arquitetura

## Stack

| Camada | Escolha | Motivo (detalhes em [DECISOES.md](DECISOES.md)) |
|---|---|---|
| Build/dev | Vite 5 | Dev server rápido, build estático, expõe na rede para teste em celular |
| Linguagem | TypeScript estrito | Os dados têm esquema rígido; erros de unidade custam credibilidade |
| UI | DOM puro + SVG/Canvas, sem framework | Bundle mínimo (hoje ~5 KB gz), o trabalho pesado é desenho, não estado de UI |
| Dados | JSON estático importado no build | Sem backend; tree-shaking e tipagem |
| Testes | Vitest | Mesma toolchain do Vite; testa o que é puro (formatação, escalas, dados) |
| Hospedagem alvo | Qualquer host estático (GitHub Pages, Netlify, Cloudflare Pages) | `base: "./"` evita configurar subpasta |

Se a complexidade de UI crescer (muitas telas com estado), reavaliar Preact (3 KB) em vez de reescrever: a fronteira `Visualization.mount` já isola cada viz.

## Estrutura

```
src/
  main.ts            shell: monta abas, roteia por hash (#sobrepostos), painel de detalhe
  styles.css         tokens (cores por grupo), mobile-first, bottom sheet
  data/
    types.ts         Entity, Fact, Source (esquema oficial)
    entities.json    valores plotáveis (patrimônio, com fonte/ano/confiança)
    facts.json       contexto (contagens, percentuais), não plotado como patrimônio
    sources.json     fontes citáveis
    index.ts         loaders tipados, wealthEntities(), validateData()
  lib/
    format.ts        R$ compacto/longo/completo, "490 mil vezes" (pt-BR)
    concentration.ts estimativa do 1% (adultos × média × fatia) e teto da metade mais pobre
    wealth-model.ts  modelo lognormal + Pareto que estima cortes de percentil e onde a média cai na fila
    scale.ts         raio por área, pixels por valor, limites de scroll
    lib.test.ts      testes
  viz/
    types.ts         contrato Visualization / VizContext
    registry.ts      lista de visualizações (ready | planned)
    zoom.ts          câmera de zoom suave + esforço (ZOOM_EFFORT) + botões/roda/teclado/pinça
    legend.ts        legenda de entidades (empresas, fonte, expansão) com diff por id
    height-engine.ts motor de "altura real" (zoom, arrastar, referências, legenda) para Desfile e Pilhas
    distribution/    Distribuição (toda a riqueza + cenário ideal de divisão igual; antes "Escada")
    fila-chart.ts    gráfico vertical da fila em escala real (fim da aba 1% mais rico)
    top1/            1% × 99% em números absolutos
    concentric/      círculos sobrepostos, salário mínimo ao centro, legenda dinâmica
```

## Fluxo

```
entities.json ──► data/index.ts ──► main.ts ──► viz.mount(el, ctx) ──► DOM/SVG/Canvas
                       │                │
                  validateData()   showDetail(entity)  ◄── ctx.onSelect(entity)
```

1. `main.ts` lê o hash da URL, escolhe a visualização `ready` correspondente (ou a primeira) e chama `mount`.
2. A visualização recebe **só** `VizContext` (entidades + callback). Não importa dados nem a shell. Isso permite testar e reaproveitar.
3. Ao selecionar um elemento, ela chama `ctx.onSelect(entity)`; a shell mostra o painel com valor exato, fonte, ano, confiança e ressalva. **Nenhuma viz reimplementa o painel.**
4. `mount` devolve uma função de limpeza (desconectar `ResizeObserver`, cancelar `requestAnimationFrame`, remover listeners). A shell a chama ao trocar de aba.

## Contrato de uma visualização

```ts
interface Visualization {
  id: string;            // slug, vira o hash da URL
  title: string;         // texto da aba (curto)
  question: string;      // pergunta que ela responde; exibida sob as abas
  status: "ready" | "planned";
  mount?: (el: HTMLElement, ctx: VizContext) => () => void;
}
```

Regras para toda viz:

- Redesenhar ao redimensionar/rotacionar (`ResizeObserver` no `el`).
- Alvos de toque de pelo menos 44 px (ver [MOBILE.md](MOBILE.md)); nada depende de hover.
- Texto alternativo: `role`/`aria-label` nos elementos selecionáveis; navegação por teclado.
- Rotular qualquer escala não linear **dentro** da viz.
- Respeitar `prefers-reduced-motion`.
- Usar `lib/format` para todo valor monetário e `lib/scale` para geometria. Nunca formatar dinheiro à mão.

## Como adicionar uma visualização

1. Criar `src/viz/<id>/<id>.ts` exportando um `Visualization` com `status: "ready"`.
2. Em `src/viz/registry.ts`, trocar a entrada `planned("<id>", ...)` pela importada (mantenha a posição no menu).
3. Se precisar de lógica pura (layout, escala), colocar em `lib/` com teste em `lib.test.ts` (ou arquivo de teste próprio).
4. Atualizar o status em [VISUALIZACOES.md](VISUALIZACOES.md) e o [ROADMAP.md](ROADMAP.md).

## Canvas vs SVG vs DOM

- **SVG:** até algumas centenas de elementos interativos (desfile). Acessível e simples.
- **Canvas 2D:** milhares a milhões de marcas (grade de pixels, pixel-scroll). Lembrar do `devicePixelRatio` e de desenhar só o que está visível.
- **DOM:** texto, abas, painéis.
- WebGL só se o Canvas 2D medido não bastar (improvável).

## Qualidade

- `npm run typecheck` e `npm test` devem passar antes de qualquer entrega.
- `validateData()` roda nos testes e avisa no console em dev. Regras: ids únicos, fonte existente, valor positivo, valor dentro da faixa, confiança diferente de "alta" exige `caveat`.
