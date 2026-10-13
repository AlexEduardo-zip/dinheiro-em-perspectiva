# Visualizações

> **Textos enxutos (ADR-033):** na tela, cada aba tem só uma frase de apoio e os números; as explicações longas e as ressalvas descritas abaixo ficam neste documento e nos blocos recolhidos "Como calculamos", não mais no meio da leitura.

> **Cores (ADR-032, ADR-034):** tema claro com **tons quentes para a classe trabalhadora** (do adulto do meio ao dono de cartório, uma cor para cada um) e **azuis para os mais ricos** (uma cor para cada um). Onde este documento fala em laranja, verde ou azul-turquesa para os grupos, leia isso; o 1% e as barras de metade usam vermelho pastel contra azul. Tabelas em [LINGUAGEM.md](LINGUAGEM.md).

> **Nomes das abas (ADR-031):** o que este documento chama de *Sobrepostos* é a aba **Círculos**; *Desfile* é **Alturas**; *Em anos de salário* é **Anos de trabalho**. "Adulto mediano" aparece na tela como **adulto do meio**. Os termos técnicos que ficam neste documento (mediana, percentil, modelo lognormal...) **não aparecem na tela**: veja [LINGUAGEM.md](LINGUAGEM.md).

Cada visualização responde a **uma pergunta**. Nenhuma é "a certa": a ideia é explorar alternativas e ficar com as que funcionam no celular.

| # | id | Nome | Pergunta | Status |
|---|---|---|---|---|
| 1 | `pixel-scroll` | Pixel a pixel | Quanto dá para rolar até a fortuna de um bilionário (1 px = 1 salário mínimo)? | **pronta (v1)** |
| 2 | `sobrepostos` | Sobrepostos | Quantos salários mínimos cabem em cada patrimônio? | **pronta (v1)** |
| 3 | `distribuicao` | Distribuição | E se todo o patrimônio fosse dividido por igual? | **pronta (v1)** (antes "Escada"; substitui "100 pessoas") |
| 3b | `top1` | 1% mais rico | Quanto o 1% mais rico tem, comparado a todo o resto? | **pronta (v1)**: números absolutos, barras 1% × 99% e, no fim, a fila em escala real |
| 4 | `paradinha` | Desfile | Qual a altura de cada um se riqueza fosse altura? | **pronta (v1)** |
| 5 | `notas` | Pilhas de notas | Que altura teria uma pilha de notas de R$ 100 do tamanho de cada patrimônio? | **pronta (v1)** |
| 6 | `tempo` | Em anos de salário | Quantos anos de trabalho, ganhando 1 salário mínimo, para juntar cada patrimônio? | **pronta (v1)** |

Ideias ainda não promovidas a item: treemap de "quem tem o quê" por grupo; mapa de calor de quadrados aninhados; linha do tempo de uma vida de poupança; "meu lugar na fila" (usuário informa o patrimônio e vê onde se encaixa).

## O problema central: escala

Menor valor plotável: R$ 22,5 mil. Maior: R$ 162,9 bi. Razão ≈ **7,2 milhões**.

- Em escala linear com o maior ocupando 300 px, o menor teria 0,00004 px. Invisível.
- **Isso é o resultado**, não um defeito, mas precisa ser entregue de forma que o usuário perceba (zoom, rolagem, animação) em vez de ver "nada".
- **Escala logarítmica não é usada** (ADR-007): ela resolve a legibilidade ao custo de esconder a diferença real, que é o objetivo do app. A resposta é zoom, rolagem e comparação com referências físicas.

Técnicas por tipo de viz:

| Técnica | Onde | Observação |
|---|---|---|
| Área proporcional | sobrepostos | raio ∝ √(v/v₀). Nunca raio proporcional ao valor (exagera ao quadrado) |
| Zoom contínuo e cansativo | sobrepostos, desfile, pilhas, anos | pinça, roda ou botões; ganhos em `viz/tuning.ts` (ADR-012) |
| Barras relativas ao maior | escada | cada passo recalcula as barras contra a maior; a régua encolhe de verdade |
| Rolagem virtual | pixel-scroll | ver abaixo |
| Zoom por etapas | pixel-scroll, notas | cada etapa muda a unidade e é avisada |

## 1. Pixel a pixel (`pixel-scroll`)

Inspiração direta do site de referência. **1 quadradinho = 1 salário mínimo (R$ 1.621,00)** (ADR-014, ADR-015). A grade ocupa **~90% da largura da tela** e o número de colunas é `C = round(√(0,9 × largura))` (18 em 390 px, 21 em 500 px). O passo de linha e de coluna é `C` px (quadrado de `C − 2` px + vão de 2 px), então cada linha vale `C` salários mínimos e mede `C` px: **1 px de altura vale sempre 1 salário mínimo**, em qualquer largura, e a distância total é a mesma da faixa contínua original. O usuário rola e passa por marcos. A unidade vem de `SALARIO_MINIMO_BRL` em `lib/scale.ts` (mesmo valor de `facts.json`), então trocar o salário mínimo atualiza a escala inteira.

**Por que o salário mínimo e não R$ 1:** a 1 px = R$ 1, a fortuna de Saverin seria 1,6×10¹¹ px, impossível. Com 1 px = R$ 1.621 a escala fica **1.621 vezes menor**, e o primeiro passo da rolagem já é "um mês de trabalho no piso". Cada pixel é uma unidade que o usuário entende.

**O que cada valor vira (1 px = R$ 1.621; tela de celular ≈ 800 px):**

| Entidade | Pixels | Telas |
|---|---|---|
| Adulto mediano (R$ 22,5 mil) | ≈ 14 | 0,02 (cabe num dedo) |
| Adulto médio (R$ 150 mil) | ≈ 93 | 0,1 |
| Declarante médio do IR (R$ 409 mil) | ≈ 252 | 0,3 |
| Família média (R$ 570,5 mil) | ≈ 352 | 0,4 |
| Dirigente industrial (R$ 1,66 mi) | ≈ 1.024 | 1,3 |
| Titular de cartório (R$ 3,28 mi) | ≈ 2.023 | 2,5 |
| Conta private média (R$ 12,4 mi) | ≈ 7.650 | 9,6 |
| Bilionário médio (R$ 7,3 bi) | ≈ 4,5 milhões | 5.600 |
| André Esteves (R$ 66,1 bi) | ≈ 40,8 milhões | 51.000 |
| Eduardo Saverin (R$ 162,9 bi) | ≈ 100,5 milhões | 125.600 |

(Valores calculados a partir das entidades; a viz deve calculá-los em runtime com `pixelsFor`.)

**O efeito dramático:** a primeira metade da jornada é curtíssima (o mediano está a 14 px do início, a menos que um dedo), e depois a rolagem se torna interminável. O contraste entre "quase nada" e "mais de cem mil telas" é a mensagem.

**Limite técnico:** navegadores quebram acima de ~33 milhões de px de altura (menos em alguns mobiles; `MAX_SAFE_SCROLL_PX` usa 10 milhões). Com 1 px = 1 salário mínimo, tudo até **≈ R$ 16,2 bi** (10 milhões de px) caberia em rolagem nativa, mas isso deixa de fora Saverin (100,5 mi px), Safra (80,6 mi), Lemann (63,8 mi), Esteves (40,8 mi) e os Moreira Salles (31 e 28,7 mi). Seguimos precisando de **rolagem virtual** para o topo, só que com um fator de 3 a 10 em vez de milhões.

**Direção: vertical** (ADR-011). A horizontal conflita com o gesto de voltar das bordas no iOS/Android, mostra metade do dinheiro por tela e foge da convenção do polegar e do site de referência.

**Implementação (v1, `src/viz/pixel-scroll/pixel-scroll.ts`):**
- **Canvas fixo** com posição `pos` em pixels de dinheiro (= salários mínimos). Sem rolagem nativa da página: o conteúdo seria impossível (100 milhões de px). Só se desenha a janela visível.
- **O desenho é sempre 1:1** (nenhum zoom, nenhuma compressão). Uma **grade de quadradinhos** (10 por linha) colorida por grupo (a cor do próximo marco) mostra o caminho; a imagem cresce em linhas, não em densidade. **Acima do cursor** (linha branca fixa, "você está aqui") os quadrados são o já percorrido, em cor forte, e **abaixo** o que falta, em cor fraca. Em velocidade alta os quadrados viram uma faixa contínua (anti-strobe): em movimento rápido, quadrados de 10 px pulariam mais de um por quadro.
- **Régua:** a cada 100, 1.000 ... 10⁸ salários mínimos, uma linha fina no vão logo abaixo da linha de quadrados que completa aquele número, com o valor exato no canto esquerdo. Marcas somem quando a velocidade as faria "piscar" (anti-strobe: o nível só aparece se a velocidade for menor que ~30% do seu espaçamento).
- **Marcos** (salário mínimo, mediano, médio, declarante, família, ocupações, private, Moll, Mateus, ... Saverin): o **quadrado que completa o valor** é contornado de branco (desenhado por cima de tudo) e uma **bolha de duas linhas** (nome; valor e quadrados) aparece na mesma linha da grade, do lado que não cobre o quadrado, ligada a ele por uma linha fina. Bolhas que colidiriam na vertical (28 px) são descartadas e ficam só na lista.
- **HUD** no topo: valor em R$ sob o cursor, quadrados percorridos e % do caminho até Saverin.
- **Próximos marcos** (altura fixa, 4 itens): nome, valor, pixels, e "faltam N px · ≈ M telas de arrasto na marcha atual". Tocar abre o painel de detalhe.
- **Entradas:** arrastar com um dedo/mouse (1:1 vezes a marcha) com **deslize** ao soltar (velocidade das últimas 100 ms, amortecimento de 320 ms); roda do mouse; teclado (↑/↓, Page Up/Down, espaço, Home).
- **Marchas (ADR-013):** 1× (padrão, escala real), 10×, 100×, 1 mil×, 10 mil×. A marcha multiplica **só a velocidade** do arrasto; o desenho continua 1:1 e a nota na tela diz "Marcha N×: cada pixel de arrasto anda N pixels de dinheiro". A 1× chegar a Saverin exige ~125 mil telas de arrasto; a 10 mil× são ~10 mil pixels de arrasto (~18 deslizes de tela cheia).
- Botão **Início** volta a zero. Não há botão de "pular para o bilionário" de propósito (mesma lógica do ADR-012).

**Anti-flicker:** palco e lista de altura fixa (o canvas só é recriado se o tamanho mudar), `dt` do quadro limitado a [0, 50] ms, DOM do HUD atualizado só quando o texto muda, lista de marcos reconstruída só quando o conjunto muda (textos atualizados no máximo a cada ~90 ms).

**Riscos / a validar no celular:** calibrar o deslize (320 ms) e o tamanho das marchas; legibilidade do HUD sobre a faixa; rótulos de marcos muito próximos (ex.: Judiciário e MP a 18 px um do outro) são descartados pelo anti-colisão e ficam só na lista; o salário mínimo muda todo ano (rótulo da escala deve citar 2026).

## 2. Sobrepostos (`sobrepostos`) — implementada

Todos os círculos **compartilham o centro**; no meio está **meio salário mínimo (R$ 810,50)** e o salário mínimo inteiro (R$ 1.621) é o anel seguinte. A área é proporcional ao valor, então o raio de cada um é `√(valor / 810,50)` vezes o raio do círculo central: o adulto mediano tem 5,3×, o declarante médio 22,5×, Saverin **~14.177×**. Sem compressão (ADR-007). Percurso total ≈ 9,6 unidades de log-zoom (ADR-012).

**Como se usa:** afastar (pinça, roda do mouse, botões **+/−** ou teclado) revela os círculos maiores, um a um, até o de Saverin caber na tela. **É cansativo de propósito** (ADR-012): um clique de roda vale 0,06 de 9,6, ou seja ~160 cliques; segurar "−" leva ~32 s; a pinça rende `ratio^0,4`. Não há controle deslizante (seria um atalho). Em seu lugar há um **medidor** com o *alcance da tela* ("R$ 661,2 mil · 35%"): o valor cujo círculo acabou de caber na tela e o progresso do caminho. Todos os ganhos ficam em constantes no topo de `concentric.ts` (`WHEEL_GAIN`, `KEY_STEP`, `BUTTON_TAP`, `HOLD_SPEED`, `PINCH_EXPONENT`). Toque numa faixa seleciona o menor círculo que a contém e abre o painel de detalhe.

**Zoom fluido:** a câmera guarda o zoom atual e o desejado (`target`) e a cada quadro percorre uma fração do caminho (amortecimento exponencial, constante de 110 ms, independente da taxa de quadros). Roda, setas/+/−, botões e "ir até o círculo" usam o amortecimento (constante 150 ms); a pinça é direta. Com `prefers-reduced-motion` o zoom é instantâneo. Teclado: setas ↑/↓ e +/−, Home e End nos extremos. O tempo entre quadros (`dt`) é limitado a [0, 50] ms: um `dt` negativo (timestamp do `requestAnimationFrame` anterior ao `performance.now()`) fazia o zoom fugir do alvo e tremer.

**Anti-flicker (causas e correções):** (1) a legenda tinha altura variável, então o palco mudava de tamanho a cada item que entrava ou saía e o canvas era redimensionado (atribuir `canvas.width` limpa o desenho): agora a legenda tem altura fixa (38%) e o canvas só é redimensionado se o tamanho mudou; (2) itens entravam e saíam da legenda oscilando na borda: agora há **histerese** (entra com folga de 4 px, sai só 6 px depois de cruzar a borda); (3) rótulos sobre a imagem aparecem e somem com **fade** nas bordas; (4) `scrollIntoView` rolava a página inteira: agora rola só a legenda; (5) removida a animação de entrada dos itens.

**Legenda:** aparece uma lista abaixo do palco só com os círculos que estão **inteiros na tela** (raio ≤ metade da menor dimensão, com margem) **e** grandes o bastante para serem vistos (raio ≥ 4 px). Entram e saem conforme o zoom. Cada item mostra valor em R$ e em salários mínimos ("13,9 SM"), e uma segunda linha com **as empresas por trás da fortuna** (ex.: "Itaú Unibanco (ITUB4) · Itaúsa (ITSA4) · CBMM") ou, quando não há empresa, uma frase de contexto. Ao tocar, o zoom **desliza até aquele círculo** e o item **expande**: contexto, cada empresa com participação, ticker e observação (ex.: "capital fechado", "cotas de sócio só negociáveis a valor contábil"), mais fonte, ano, confiança e ressalva. A legenda já traz tudo isso, então o painel inferior só abre ao tocar num anel que não está na lista. A lista é atualizada por diff (itens que permanecem não são recriados). Sobre a imagem também há rótulos no topo de cada anel, descartando os que colidiriam (mínimo de 16 px entre rótulos); quem foi descartado continua na lista.

**Detalhes técnicos:** Canvas 2D em escala do `devicePixelRatio` (limitado a 2,5); redesenho sob demanda por `requestAnimationFrame`; círculos com raio > 4.000 px viram um preenchimento do palco inteiro (evita arcos de milhões de pixels). O zoom é uma variável contínua em log do raio do círculo central, só como parâmetro da câmera: os valores nunca são comprimidos. O salário mínimo é uma entidade `kind: "reference"`, `measure: "income"` (régua, ADR-005), gerada em `data/index.ts` a partir de `facts.json`.

**Limitações:** valores muito próximos (Judiciário R$ 2,93 mi, MP R$ 2,9 mi, cartório R$ 3,28 mi) geram anéis a menos de 1 px um do outro: ficam na legenda, mas não se distinguem no desenho; os círculos de cima ficam sobre os de baixo (os menores nunca são cobertos). Não há pan: o centro é fixo por design.

## 3. Distribuição (`distribuicao`, antes "Escada"; ADR-020, ADR-021, ADR-025, ADR-026)

O nome mudou de "Escada" para **Distribuição** (links antigos com `#escada` continuam funcionando por um apelido em `main.ts`). As **barras horizontais** ("linhas") da aba foram removidas e o **gráfico em escala real** ganhou um irmão: o **cenário ideal**. Conteúdo, de cima para baixo:

1. **"Toda a riqueza do país, hoje"** (ADR-029): mostra o **valor absoluto de toda a fortuna**, "≈ **R$ 23,2 trilhões**" (154,3 milhões de adultos × R$ 150 mil de patrimônio médio, estimativa; R$ 26,2 tri se a média for R$ 170 mil), e uma barra dividida no adulto mediano (seta "▼ adulto mediano"): **antes** (metade mais pobre) = **até 7,5%, ≈ R$ 1,7 tri**; **depois** (metade mais rica) = **pelo menos 92,5%, ≈ R$ 21,4 tri**. Dentro da barra há **77 bolinhas de cada lado**, **cada uma = 1 milhão de pessoas** (a metade de 154,3 milhões é ≈ 77,2 milhões): à **esquerda** elas ficam **apertadas** dentro dos 7,5% da barra, em colunas que preenchem a altura toda (espaço igual entre as linhas, sem sobra solitária); à **direita**, **espaçadas** em uma grade larga (7 linhas) pelos 92,5%. A barra tem no mínimo 150 px de altura (antes 64 px) e a bolinha mede 5 px; o tamanho é o mesmo nos dois lados, para a diferença de espaçamento ser a informação; a barra cresce em altura quando o lado esquerdo precisa de mais linhas (tela estreita). Conta rigorosa só com mediana e média do UBS: 0,5 × 22,5 mil ÷ 150 mil = 7,5% (faixas do UBS: 5,9% a 8,3%). Código: `lib/concentration.ts` (`bottomHalfMaxShare`, `estimateTop1`) e o layout em `viz/distribution/distribution.ts` (`layoutDots`, recalculado quando a largura muda).
2. **Cenário ideal: o patrimônio dividido por igual**. Se toda a riqueza fosse repartida entre os 154,3 milhões de adultos, **cada brasileiro teria R$ 150 mil** (o patrimônio médio). Dois cartões deixam claro **quantos teriam mais e quantos teriam menos**:
   - **Teriam MAIS**: ≈ **131,8 milhões de adultos (cerca de 85%)**, os que hoje têm menos de R$ 150 mil. **Com certeza pelo menos 77,2 milhões** (todos abaixo do adulto mediano).
   - **Teriam MENOS**: ≈ **22,5 milhões (cerca de 15%)**, os que hoje têm mais de R$ 150 mil; inclui os 1,5 milhão do 1% mais rico, que cairiam de R$ 7,4 mi para R$ 150 mil em média.
3. **O gráfico do cenário ideal** é uma cópia do gráfico da fila (mesma escala, 1 px = R$ 500, eixo no alto, varas penduradas) com: a **parede azul** (altura de R$ 150 mil = 300 px, "Cenário ideal: todos com R$ 150 mil"); uma **faixa no eixo** ("teriam mais" em verde até 85% da fila e "menos" em laranja depois); e **varas** do patrimônio de hoje em outros **marcos**: 25% (≈ R$ 6,7 mil), **50% adulto mediano** (R$ 22,5 mil), 75% (≈ R$ 76 mil), o **patrimônio médio (R$ 150 mil) em ≈ 85% da fila** (a vara termina exatamente na parede) e 95% (≈ R$ 390 mil, passa da parede). **Sem linhas horizontais de régua** (as tracejadas só continuam no gráfico do 1% mais rico). Antes do ponto da média a vara é mais curta que a parede (teriam mais); depois passa dela (teriam menos).

**O que é certo e o que é estimativa:** o único fato rigoroso é "pelo menos metade dos adultos teria mais" (todos abaixo da mediana, que é menor que a média). O ponto da média na fila (≈ **85%**, faixa 84% a 86% ao mudar o ponto de emenda do modelo), os cortes de 25%, 75% e 95% e as contagens de 131,8 e 22,5 milhões vêm do **modelo** (corpo lognormal + cauda de Pareto, ajustado à mediana, à média e aos 49,3% do 1%; `lib/wealth-model.ts`: `estimateQuartiles`, `estimateMeanPosition`, `percentileAtValue`), com o aviso na tela. Não entram dívidas, imóveis nem inflação: é o patrimônio líquido médio dividido por igual.

Mudança de arquivos: `src/viz/ladder/` virou `src/viz/distribution/`; o gráfico vertical em escala real segue em `viz/fila-chart.ts` (fim da aba 1% mais rico).

## 3b. 1% mais rico (`top1`) — implementada (ADR-020, ADR-021, ADR-025)

O número absoluto de pessoas e de dinheiro do 1% de cima contra o resto. É uma **estimativa própria** que combina quatro fontes de anos diferentes; a tela mostra o passo a passo e os avisos:

| Passo | Valor | Fonte |
|---|---|---|
| Adultos (18+) | 154.346.198 | IBGE, Censo 2022 (SIDRA 9514) |
| Riqueza total = adultos × média de R$ 150 mil | ≈ **R$ 23,2 trilhões** (R$ 26,2 tri se a média for R$ 170 mil) | UBS (média) |
| Fatia do 1% mais rico | **49,3%** | Credit Suisse, 2021 |
| **1% mais rico** | **1,5 milhão de pessoas · R$ 11,4 tri · R$ 7,4 mi por pessoa** | cálculo |
| **Outros 99%** | **152,8 milhões de pessoas · R$ 11,7 tri · R$ 76,8 mil por pessoa** | cálculo |
| Uma pessoa do topo = | **96 pessoas do resto** (média contra média) | cálculo |
| 255 bilionários (R$ 1,86 tri) | ≈ **8%** da riqueza estimada; 1 em cada 605 mil adultos | Forbes 2026 |

**Ordem da página (a página rola, sem gestos):**
1. **Destaque** com o número absoluto de pessoas: "**1,5 milhão de pessoas**", 1 em cada 100 adultos, com **R$ 11,4 tri: quase metade (49,3%) de toda a riqueza**.
2. **Gráfico unificado de duas barras** (ADR-030): "**Quantas pessoas**" (1% laranja × 99% verde) e "**Quanto dinheiro**" (49,3% × 50,7%), alinhadas. **A legenda de cada barra fica logo embaixo e são os próprios números**, com a cor ao lado: "1,5 milhão de pessoas" e "152,8 milhões de pessoas" sob a barra de pessoas; "R$ 11,4 trilhões" e "R$ 11,7 trilhões" sob a de dinheiro. Sem a faixa ampliada que ligava as duas barras e sem a linha de legenda separada (que repetia os números).
3. Dois **cartões** (1% mais rico × outros 99%: pessoas, dinheiro total, média por pessoa) e a frase "uma pessoa do 1% tem tanto quanto 96 pessoas do resto" (sem as bolinhas, removidas no ADR-021).
4. **Bilionários** e **"Como calculamos"** (`<details>`).
5. **No fim: a fila em escala real** (`viz/fila-chart.ts`, movida da Escada no ADR-025), descrita a seguir.

### A fila em escala real (gráfico vertical, fim da aba 1% mais rico)

**Eixo x no alto** (adultos do mais pobre ao mais rico, **adulto mediano em 50%, no meio**) e barras que **crescem para baixo**, em **escala linear de 1 pixel = R$ 500, sem limite de altura**. Três **varas** penduradas no eixo mostram o patrimônio de quem está em **25%, 50% e 75%** da fila (ponto e valor na ponta) e a **barra laranja** à direita é o **1% mais rico**: R$ 7,4 mi em média = ~14.800 px = **cerca de 17,5 telas de celular** (a contagem usa a altura da janela do aparelho), sem corte: a página rola. Réguas tracejadas em R$ 50 mil, 100 mil, 250 mil, 500 mil, 1 mi... 7 mi. **Contador de telas** fixo embaixo enquanto a barra está à vista ("Barra do 1%: 2,8 de 17,5 telas · já passou de R$ 1,2 mi"), que some quando a barra termina. No fim: na mesma escala a barra dos 255 bilionários teria ~17,3 mil telas (987 vezes esta) e a de Saverin ~386 mil telas.

**Os cortes de 25% e de 75% são ESTIMATIVA DE MODELO, não dado** (a base e as buscas não têm esses valores): corpo lognormal com mediana de R$ 22,5 mil e, acima do percentil 90, cauda de Pareto; os dois parâmetros (σ ≈ 1,8; α ≈ 1,24) são ajustados para reproduzir a **média de R$ 150 mil** e a **fatia de 49,3% do 1%**. Resultado: **25% ≈ R$ 6,7 mil** (faixa R$ 5,8 a 6,9 mil) e **75% ≈ R$ 76 mil** (faixa R$ 74 a 87 mil; a faixa vem de mover a emenda corpo/cauda do percentil 80 ao 95). Sanidade: o modelo dá ~2,7% da riqueza à metade mais pobre, abaixo do teto rigoroso de 7,5% (e perto dos 2% do WID). Código: `lib/wealth-model.ts` (`fitWealthModel`, `estimateQuartiles`, testado); valores com 2 algarismos e "≈" (`formatApprox`), explicados em "Como estimamos os cortes de 25% e 75%".

**Honestidade (ADR-006, ADR-020):** é ordem de grandeza. Fontes de 2021, 2022 e 2025 e métodos diferentes; a fatia de 49,3% pode ter mudado; "adulto" no UBS pode não ser igual a 18+ do IBGE; os valores por pessoa são médias dentro de cada grupo (no 1% de cima a média é puxada por poucos de fortuna enorme).

## 4. Desfile (`paradinha`) — implementada

"Parade of dwarfs" de Jan Pen (1971): cada figura tem **altura proporcional ao patrimônio**, com a pessoa de patrimônio médio (R$ 150 mil, UBS) medindo **1,70 m**: `altura = valor / 150 mil × 1,70 m`. Em escala real (sem log, ADR-007): o adulto mediano tem **26 cm**, o declarante médio 4,6 m, a conta private média 141 m, o bilionário médio 83 km e Eduardo Saverin **1.846 km**.

**Como se usa:** as figuras seguem em ordem crescente, lado a lado, sobre um chão. **Arrastar para o lado** (ou setas ←/→, Shift+roda) percorre o desfile, com deslize ao soltar. **Afastar** (pinça, roda, botões +/− ou setas ↑/↓) revela as mais altas; é **cansativo de propósito** (a mesma câmera e os mesmos ganhos dos Sobrepostos, ADR-012, em `viz/zoom.ts`). Um medidor mostra "A tela mostra até X de altura · N%".

**Referências de altura** (linhas tracejadas): Cristo Redentor 38 m, Torre Eiffel 330 m, Burj Khalifa 828 m, Monte Everest 8.849 m, avião em voo de cruzeiro 11 km, limite do espaço 100 km e Estação Espacial Internacional 400 km. Essas medidas **não vêm do .md**: ficam em `data/landmarks.ts` como conhecimento geral (ver DADOS.md).

**Posições "telescópicas":** figuras que viraram poeira (< ~2 px de altura) ficam coladas (3 px) e as que aparecem ganham o espaçamento cheio (58 px), de modo que ao afastar o zoom as figuras altas surgem perto da tela, não longe à direita. Muda só a posição horizontal; as alturas continuam exatamente proporcionais.

**Legenda:** as figuras **inteiras na tela** (altura útil e horizontal), com histerese, via `viz/legend.ts` (a mesma dos Sobrepostos): altura, valor, empresas por trás da fortuna e, ao tocar, expandida com fonte e ressalva; tocar leva o zoom e o desfile até a figura. Tocar numa figura fora da legenda abre o painel de detalhe.

**Honestidade (ADR-017):** não é uma fila de pessoas reais nem percentis (não há decis na base); são os grupos e nomes que a base tem, em ordem. A nota na tela diz isso.

**Limitações:** figuras de valores muito próximos (Judiciário, MP, cartório) ficam quase iguais em altura; a figura de 26 cm é pequena demais para detalhes de silhueta; só se desenha o que está na tela, mas todas as ~22 figuras são recalculadas a cada quadro (barato).

## 5. Pilhas de notas (`notas`) — implementada

Uma torre de **notas de R$ 100** para cada patrimônio, uma sobre a outra. `altura = (valor / 100) × 0,11 mm`. Exemplos: R$ 1 milhão são 10 mil notas, **1,1 m**; o adulto mediano, 225 notas, **2 cm**; o declarante médio, 4,1 mil notas, **45 cm**; a conta private média, 124 mil notas, **14 m**; Eduardo Saverin, 1,6 bilhão de notas, **179 km** (mais alta que o limite do espaço, 100 km, e menos que a ISS, 400 km).

**Diferenças do Desfile** (que usa o mesmo motor, `viz/height-engine.ts`): (1) a **largura é verdadeira** (15,6 cm = o comprimento da nota), então as torres altas viram agulhas finas e as baixas, blocos largos ao aproximar; (2) ao aproximar até cada nota ter **3 px** aparecem as **notas uma a uma** (linhas); (3) a cor é a da cédula de R$ 100 (**azul-turquesa**, Banco Central), com uma tampa na cor do grupo que liga a pilha às outras visualizações; (4) o segundo rótulo é o **número de notas**; (5) a linha tracejada **"Pessoa · 1,7 m"** compara a pilha com uma pessoa; (6) a legenda expandida mostra a altura em "vezes uma pessoa", o **volume** (litros ou m³, e quantas piscinas olímpicas de 2.500 m³: o de Saverin é ~1.957 m³, cerca de 0,8 piscina) e a contagem de notas.

**Fontes e honestidade (ADR-018):** o tamanho da nota (**156 × 70 mm**) e a cor vêm da cartilha da Segunda Família do Real do Banco Central. **A espessura de 0,11 mm é uma estimativa não oficial** (o Banco Central não a publica; o número vem de exercícios escolares e blogs, de baixa autoridade) e **todas as alturas dependem dela**: a tela e o texto avisam "espessura estimada". Para trocar, mude `NOTE_THICKNESS_M` em `lib/scale.ts` (ideal: medir uma pilha real de 100 notas com paquímetro e dividir por 100). Uma mudança de 10% na espessura muda todas as alturas e volumes em 10%, mas não a proporção entre as pilhas.

**Zoom e esforço:** o mesmo dos outros (ADR-012). Percurso: de 3 px por nota (R$ 100 ≈ 0,33 mm na tela) até a pilha de Saverin inteira (179 km): razão de ~10 milhões entre a menor e a maior escala.

**Limitações:** a nota de R$ 100 é a maior que a maioria carrega; a de R$ 200 (mais alta em valor) encurtaria as pilhas à metade: escolha documentada, não neutra. Valores próximos (Judiciário, MP, cartório) geram pilhas quase iguais. O volume é o da pilha compacta, sem espaço vazio entre as notas.

## 6. Em anos de salário (`tempo`) — implementada

Uma **coluna de anos de trabalho** para cada patrimônio: `anos = valor / (R$ 1.621 × 12)`, ou seja, quanto tempo levaria para juntar aquele dinheiro **ganhando 1 salário mínimo por mês e guardando tudo** (sem gastar, sem juros, sem inflação, sem aumento). **É irrealista de propósito**: o texto da tela diz isso; serve para dar noção de tamanho. Decisão: **12 salários por ano**, sem 13º nem férias (conta simples; com o 13º os anos cairiam ~7,7%, e as razões entre colunas não mudam).

**Valores:** adulto mediano ≈ 1,2 ano; adulto médio 7,7 anos; declarante médio 21 anos; produtor agropecuário 81 anos; titular de cartório 169 anos; conta private média 637 anos; bilionário médio ~375 mil anos; **Eduardo Saverin ≈ 8,4 milhões de anos**.

**Mesmo motor das pilhas e do Desfile** (`viz/height-engine.ts`, ADR-019): coluna de largura fixa, zoom suave e cansativo, arrastar para o lado, legenda das colunas inteiras na tela. Diferenças: a unidade é **ano** (`formatUnit`, `meterText`: "A tela mostra até 45 anos de trabalho · 12%"); a coluna tem **marcas a cada 1, 10, 100... anos** (cada nível aparece quando o espaçamento passa de 5 px; perto do zoom máximo dá para contar os anos nas colunas baixas); as **referências tracejadas são marcos de tempo** (`timeLandmarks`): uma carreira de 35 anos, chegada dos portugueses (1500, há 526 anos), início da era cristã, Pirâmide de Quéops (~4.500), fim da última Era do Gelo (~11.700), primeiros Homo sapiens (~300 mil), primeiras ferramentas de pedra (~2,6 milhões) e separação entre humanos e chimpanzés (~6,5 milhões de anos). Saverin passa até desse último. Essas datas são **aproximadas e de conhecimento geral, não do .md**; a carreira de 35 anos é suposição de comparação.

**Desempenho (ADR-028):** as marcas de 1, 10, 100... anos só são calculadas para os níveis cujo espaçamento está entre 5 px e a altura do palco, e cada nível é desenhado em um único traçado. Um teste (`viz/years/perf.test.ts`) conta as operações de desenho por quadro em todos os zooms, de 1e-7 a 1e5 px por ano, com orçamento de 1.500 para as 22 colunas.

**Legenda expandida:** "Para juntar R$ X com 1 salário mínimo por mês, guardando tudo: N anos", quantas carreiras de 35 anos são, e "teria sido preciso começar no ano 1500" (ou "há 8,4 milhões de anos" quando passa do ano 0).

**É o único lugar onde a renda aparece** (ADR-005): o salário mínimo é régua (unidade de tempo), nunca ponto comparado ao patrimônio.

## Critérios para promover uma viz a "pronta"

1. Responde à sua pergunta sem texto explicativo longo.
2. Funciona em 360×640 e em 390×844, retrato, com toque.
3. Nenhuma escala comprime a diferença (sem log); o que não cabe na tela é alcançado por zoom ou rolagem.
4. Seleção abre o painel de detalhe com fonte/ano/ressalva.
5. 60 fps percebidos em celular de entrada (ver [MOBILE.md](MOBILE.md)).
6. Cálculos puros testados em `lib/`.
