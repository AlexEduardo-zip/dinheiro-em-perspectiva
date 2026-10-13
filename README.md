# Dinheiro em Perspectiva

Aplicação web **mobile-first** que torna palpável a distância entre o patrimônio de um brasileiro mediano e o de um bilionário. Inspirada em [1 Pixel Wealth](https://flpms.github.io/1-pixel-wealth/), mas com dados brasileiros de [patrimonio-brasil-2026.md](patrimonio-brasil-2026.md) e **várias formas de visualização** a explorar (pixels, círculos sobrepostos, distribuição do patrimônio, 1% mais rico, desfile, pilhas de notas, anos de salário).

> **Estado atual: as visualizações planejadas estão prontas** (Pixel a pixel, Círculos, Distribuição, 1% mais rico, Alturas, Pilhas de notas e Anos de trabalho), com dados estruturados e testes. Faltam calibração em celulares reais, publicação e a fase 2 (personalização). Ver [docs/ROADMAP.md](docs/ROADMAP.md) e [docs/VISUALIZACOES.md](docs/VISUALIZACOES.md).

## Rodando

Requer Node 20+.

```bash
npm install
npm run dev        # servidor local, acessível na rede (teste no celular pelo IP exibido)
npm test           # vitest: formatação, escalas, integridade dos dados
npm run typecheck
npm run build      # gera dist/ estático (base relativa: funciona em qualquer subpasta)
```

Para testar no celular, ligue o aparelho na mesma rede Wi-Fi e abra o endereço "Network" que o `npm run dev` imprime.

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/VISAO.md](docs/VISAO.md) | Propósito, público, princípios, o que a aplicação **não** é |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Stack, estrutura de pastas, contrato das visualizações, como adicionar uma |
| [docs/DADOS.md](docs/DADOS.md) | Esquema, regras de comparabilidade, como o .md vira JSON, como atualizar |
| [docs/VISUALIZACOES.md](docs/VISUALIZACOES.md) | Catálogo das formas de visualização, problema de escala, especificação de cada uma |
| [docs/MOBILE.md](docs/MOBILE.md) | Requisitos e técnicas para funcionar bem em celulares |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fases, critérios de pronto, perguntas em aberto |
| [docs/LINGUAGEM.md](docs/LINGUAGEM.md) | Regras de linguagem simples, glossário de termos a evitar e nomes das abas |
| [docs/CALIBRACAO.md](docs/CALIBRACAO.md) | Como calibrar esforço do zoom e deslize num celular real (painel `?calibrar`) |
| [docs/DECISOES.md](docs/DECISOES.md) | Registro de decisões técnicas (ADRs) e alternativas descartadas |
| [CLAUDE.md](CLAUDE.md) | Orientações para agentes de IA trabalhando no repositório |

## Estrutura

```
patrimonio-brasil-2026.md   fonte de verdade humana (base de conhecimento)
src/data/                   dados estruturados derivados do .md + tipos
src/lib/                    formatação pt-BR e escalas (puro, testado)
src/viz/                    uma pasta por visualização + registry.ts
src/main.ts, styles.css     shell: abas, painel de detalhe, roteamento por hash
docs/                       documentação
```
