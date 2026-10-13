# Decisões

Formato: contexto, decisão, consequências, alternativas. Novas decisões entram no fim, numeradas.

## ADR-001 — Vite + TypeScript sem framework de UI

**Contexto:** a aplicação é essencialmente desenho (SVG/Canvas) e algumas peças de UI (abas, painel). O público usa celulares modestos.
**Decisão:** Vite, TypeScript estrito, DOM puro.
**Consequências:** bundle de ~5 KB gzip, zero dependências de runtime. Mais código manual para UI de estado (a fronteira `Visualization.mount` limita o dano). Se o estado de UI crescer, migrar a **shell** para Preact sem tocar nas visualizações.
**Alternativas:** React/Next (bundle e complexidade sem benefício); Svelte (bom candidato, mas mais uma toolchain); HTML+JS sem build (perde tipagem e testes).

## ADR-002 — Dados como JSON curado à mão, derivados do .md

**Contexto:** o .md é prosa com tabelas e ressalvas; tem lacunas deliberadas e divergências.
**Decisão:** curar `entities.json`/`facts.json`/`sources.json` manualmente, com `mdSection` para rastreio e `validateData()` para integridade.
**Consequências:** nenhum parser frágil de Markdown; a curadoria exige julgamento (qual valor usar em divergências), o que é desejável. Risco de desvio entre .md e JSON, mitigado pelo `mdSection` e pela regra "o .md vence".
**Alternativas:** parsear o .md em build (frágil: tabelas misturam texto, negrito e notas); banco/CMS (excesso).

## ADR-003 — Tabela estruturada no .md é uma possibilidade futura, não agora

Se a edição anual do .md virar rotina, vale incluir um bloco de dados (YAML/JSON) no próprio .md e gerar o JSON no build. Adiado até haver segunda edição que mostre a dor.

## ADR-004 — Visualizações isoladas atrás de um contrato

**Decisão:** cada viz exporta `Visualization` e só recebe `VizContext`; a shell cuida de abas, roteamento e painel de detalhe.
**Consequências:** fácil experimentar e descartar alternativas (objetivo explícito do projeto); consistência do painel de fonte/ressalva em todas.
**Alternativas:** páginas separadas (duplica shell e dados); uma viz monolítica com modos (dificulta isolar desempenho).

## ADR-005 — Patrimônio e renda separados por tipo

`measure: "wealth" | "income"`. Renda só entra como régua na viz "Em anos de salário". Motivo: o próprio .md destaca que salário mede renda, não patrimônio; misturar destrói a credibilidade.

## ADR-006 — Não inventar dado onde há lacuna

Classes A a D, MEI e empresários de pequeno/médio porte não têm patrimônio publicado. A UI mostra "sem dado público". Estimativas próprias só entram se a metodologia for documentada e rotulada como tal (como os "cálculos próprios" já marcados no .md).

## ADR-007 — Escala por área, sem escala logarítmica

Raio proporcional exagera ao quadrado; usamos área proporcional. **A escala logarítmica foi removida** (decisão do dono do projeto): o objetivo é demonstrar visualmente a diferença real de tamanho, e a compressão log esconde exatamente isso. Onde o tamanho real não cabe na tela, a viz oferece zoom e rolagem (Círculos: zoom contínuo de 1× a 256×).
**Consequência:** a razão de ~7 milhões entre o menor e o maior gera círculos de dezenas de milhares de pixels a 256×; as vizs precisam desenhar só o visível e centralizar círculos mais largos que a tela. Único desvio: pontos menores que 1,5 px são desenhados com 1,5 px para não sumirem (avisado na tela).

## ADR-008 — Base relativa e hash routing

`base: "./"` e `#id` na URL: o build roda em qualquer subpasta de host estático e não exige configuração de rewrite no servidor.

## ADR-009 — Tema escuro único por ora

Escolhido por contraste das cores de grupo e OLED. Tema claro é opcional futuro (tokens já em `:root`).

## ADR-010 — Escala do pixel-scroll: 1 pixel = 1 salário mínimo (R$ 1.621,00)

**Contexto:** a referência usa 1 pixel = 1 dólar, o que no Brasil exigiria 1,6×10¹¹ px para a maior fortuna.
**Decisão:** 1 px = 1 salário mínimo de 2026 (`SALARIO_MINIMO_BRL = 1621` em `lib/scale.ts`, igual ao de `facts.json`). Pedido do dono do projeto.
**Consequências:** o mediano fica a ~14 px e Saverin a ~100,5 milhões de px: o contraste é preservado e a unidade é compreensível. Ainda é preciso rolagem virtual para as maiores fortunas (acima de ~R$ 16 bi). A escala envelhece quando o salário mínimo mudar: o rótulo deve citar "2026"; trocar o valor atualiza tudo, e os dados em R$ não mudam.
**Alternativas:** 1 px = R$ 1 (inviável); 1 px = R$ 1.000 (arredondado, mas sem significado social).

## ADR-011 — Pixel a pixel rola na vertical

**Contexto:** perguntou-se se a rolagem horizontal funcionaria.
**Decisão:** vertical. Motivos: (1) arrastar a partir da borda lateral dispara "voltar" no iOS e no Android, e uma rolagem longa o acionaria o tempo todo; (2) o polegar, a roda do mouse e o site de referência são verticais; (3) a tela em retrato tem ~800 px no eixo vertical contra ~390 no horizontal, então cada tela cobre o dobro de dinheiro (Saverin: ~125 mil telas contra ~257 mil); (4) uma régua vertical com o "odômetro" fixo no alto lê-se como altura, o que reforça a metáfora de distância.
**Consequências:** o protótipo não precisa de modo horizontal. Em paisagem a viz continua vertical. Se um teste com usuários mostrar preferência contrária, reabrir.
**Alternativas:** horizontal ou configurável (descartado: dobra a superfície de teste sem ganho claro).

## ADR-012 — Zoom dos Sobrepostos: início em meio salário mínimo e esforço deliberado

> Atualização: os ganhos agora vivem em `src/viz/tuning.ts` (valores vivos), ajustáveis ao vivo no celular com `?calibrar` (docs/CALIBRACAO.md).

**Contexto:** o percurso de salário mínimo até Saverin (≈ 10 mil vezes no raio) era curto demais para transmitir a distância, e o controle deslizante permitia pular tudo em um gesto. Também havia piscadas na tela.
**Decisão:** (1) o círculo central passa a ser **meio salário mínimo (R$ 810,50)**, ampliando o percurso para ≈ 14.177× no raio; (2) o zoom é **intencionalmente trabalhoso**: ganhos pequenos por roda/tecla/botão/pinça e **sem controle deslizante**, com um medidor de alcance e progresso no lugar; (3) correções de flicker (legenda de altura fixa, histerese, fade de rótulos, dt não negativo).
**Consequências:** um atalho para pular ao topo não existe de propósito. O toque num item da legenda só leva a círculos que já estão inteiros na tela (ajuste curto). Quem precisar de acessibilidade tem teclado (setas, Home, End). Os ganhos ficam em constantes únicas e podem ser reajustados após testes com usuários reais.
**Alternativas:** manter o controle deslizante (descartado: contradiz a intenção); escala log no zoom (descartado: ADR-007); R$ 1.000 como centro (descartado: meio salário mínimo mantém o vínculo com a unidade do pixel a pixel).

## ADR-013 — Pixel a pixel: desenho sempre 1:1, "marchas" só multiplicam a velocidade

**Contexto:** a 1 px = 1 salário mínimo, Saverin está a ~100 milhões de pixels (~125 mil telas). Rolar isso 1:1 é inviável, mas comprimir o desenho (zoom) trairia o objetivo (ADR-007).
**Decisão:** canvas com rolagem virtual; o mundo é desenhado 1:1 em qualquer marcha. Cinco **marchas** (1×, 10×, 100×, 1 mil×, 10 mil×) multiplicam quantos pixels de dinheiro passam por pixel de arrasto, sempre anunciadas na tela. Padrão 1× (escala real). Sem atalho para "pular ao bilionário".
**Consequências:** a distância continua sendo vivida (nos extremos ela vira velocidade, não tamanho); quem quiser a escala real pode ficar em 1×. A marcha máxima (10 mil×) ainda exige dezenas de deslizes para chegar a Saverin.
**Alternativas:** zoom do desenho (descartado: ADR-007); aceleração automática por velocidade do dedo (descartada: imprevisível, difícil de anunciar); botão de marcos (descartado: tira o esforço).

## ADR-014 — Pixel a pixel: quadradinhos, 10 por linha

**Contexto:** a faixa contínua de 1 px por salário mínimo não deixava claro que cada pixel é uma unidade, e crescia só em comprimento.
**Decisão:** cada **quadrado** (8 px + 2 px de espaço) é 1 salário mínimo, em **linhas de 10**. A linha mede 10 px e vale 10 salários mínimos, então a relação 1 px de altura = 1 salário mínimo (ADR-010) e todas as distâncias ficam idênticas; as marcas de 10, 100, 1.000... caem exatamente nas bordas das linhas. Em velocidade alta a grade cede a uma faixa contínua (anti-strobe).
**Consequências:** a imagem cresce em linhas, não em densidade; é possível contar quadrados à vista nos primeiros marcos (o mediano tem 13,9 quadrados). Rótulos ocupam 26 px (duas linhas), então mais marcos próximos são omitidos do desenho (continuam na lista). A largura da grade é fixa (100 px), com ~160 px restantes para rótulos em telas de 390 px.
**Alternativas:** mais colunas (20+) ou colunas variáveis por largura (descartado: quebra o alinhamento 1 px = 1 salário mínimo e deixa pouco espaço para rótulos); quadrados menores (ilegíveis no celular).

## ADR-015 — Grade em ~90% da largura, com colunas = passo em pixels

**Contexto:** com 10 colunas a grade ocupava só ~25% da largura (ADR-014).
**Decisão:** a grade ocupa ~90% da largura. O número de colunas é `C = round(√(0,9 × largura))` e o passo de linha e coluna é `C` px, de modo que 1 px de altura continua valendo exatamente 1 salário mínimo (ADR-010) e a dificuldade do percurso não muda. Rótulos de marcos viram bolhas sobre a grade (não há mais coluna lateral); a régua vira linhas finas com o valor no canto.
**Consequências:** os quadrados ficam maiores (16 px em 390 px) e a imagem cresce em linhas mais largas e mais legíveis. As marcas de 10, 100... deixam de cair exatamente nas bordas das linhas (C não divide 10); a régua usa a linha de quadrados que completa o número. Em rotação ou redimensionamento, C muda e o desenho se refaz sem alterar a posição.
**Alternativas:** C fixo em 10 com quadrados de 28 px (descartado: 3× mais difícil que o aprovado); mais colunas com passo de 10 px (descartado: 3× mais fácil e quadrados pequenos).

## ADR-016 — 100 pessoas só com o que a base sustenta (SUBSTITUÍDO pelo ADR-020: a grade foi removida)

**Contexto:** o .md tem a fatia do 1% mais rico (49,3%, Credit Suisse 2021) e média/mediana do UBS, mas não tem decis/quintis nem a população adulta, e proíbe cruzar fontes diferentes sem ressalva.
**Decisão:** três leituras separadas (Pessoas, Riqueza, Média × mediana), cada uma com uma única fonte, sem modelar distribuição e sem combinar Credit Suisse com UBS. Números absolutos sem denominador (255 bilionários etc.) ficam fora da grade, em um bloco de contexto.
**Consequências:** a viz é honesta mas limitada: só 1% × 99%. Quando houver população adulta (IBGE ou UBS) dá para acrescentar "N em 100" para milionários e bilionários; quando houver decis, a grade pode mostrar a distribuição inteira.
**Alternativas:** modelar uma distribuição (ex.: lognormal) que reproduzisse média, mediana e 49,3% (descartado: seria estimativa própria disfarçada de dado; ADR-006); usar população adulta de memória (descartado: sem fonte na base).

## ADR-017 — Desfile: altura real, câmera e legenda compartilhadas, posições telescópicas

**Contexto:** o Desfile precisa mostrar a razão de ~7 milhões entre a figura de 26 cm e a de 1.846 km sem comprimir (ADR-007), com o mesmo esforço de zoom já aprovado (ADR-012).
**Decisão:** (1) altura = valor / média × 1,70 m, em escala real; (2) o zoom (câmera suave, esforço, roda/teclas/botões/pinça) e a legenda detalhada foram **extraídos** para `viz/zoom.ts` e `viz/legend.ts` e os Sobrepostos migraram para eles (comportamento preservado); (3) as posições horizontais são "telescópicas" (poeira colada, figuras visíveis espaçadas) para as figuras altas aparecerem ao afastar; (4) referências de altura reais (Cristo Redentor ao ISS) em `data/landmarks.ts`, fora do .md; (5) o texto avisa que não é uma fila de pessoas reais.
**Consequências:** uma única fonte de verdade para o esforço do zoom (constantes em `ZOOM_EFFORT`) e para o painel de empresas/fonte; toda nova viz de zoom reaproveita. As referências de altura são conhecimento geral e precisam de checagem antes de publicar.
**Alternativas:** escala log nas alturas (descartada: ADR-007); rolagem horizontal de ~22 figuras sem compactar (descartada: as altas ficariam longe da tela ao afastar); copiar o código do zoom (descartado: duplicaria constantes e bugs corrigidos, como o dt negativo).

## ADR-018 — Pilhas de notas e o motor de altura compartilhado

**Contexto:** as Pilhas de notas e o Desfile são "figuras em ordem crescente com altura real"; os dois precisam do mesmo zoom cansativo, arrastar, referências e legenda.
**Decisão:** (1) extrair o motor de `parade.ts` para `viz/height-engine.ts` (`mountHeightViz` + `HeightConfig`); o Desfile e as Pilhas viram configurações finas (desenho da figura, rótulos, largura, zoom inicial/máximo, linhas extras na legenda); (2) as pilhas usam a nota de **R$ 100**, **largura verdadeira** de 15,6 cm e **espessura estimada de 0,11 mm** (`NOTE_THICKNESS_M`), com o aviso na tela, porque o Banco Central não publica a espessura; (3) o zoom inicial só é calculado depois da primeira medição do palco (antes ele usava uma altura provisória e começava mais afastado do que o desenhado); (4) `minSpacing` por viz para rótulos largos.
**Consequências:** nova visualização de altura = ~60 linhas de configuração. A espessura é a premissa mais frágil do app: está isolada em uma constante e citada em todos os textos. As alturas absolutas das pilhas são tão boas quanto essa estimativa; as razões entre pilhas, não.
**Alternativas:** notas de R$ 200 (mais altas em valor: pilhas menores, mas notas menos comuns na imaginação do público); espessura de outra fonte (nenhuma oficial encontrada); duplicar o código do Desfile (descartado).

## ADR-019 — Em anos de salário: o motor de altura com unidade "ano"

**Decisão:** a última visualização planejada usa `height-engine.ts` (ADR-018) com a unidade em anos: o motor ganhou `formatUnit` e `meterText`; as referências viram marcos de tempo (`timeLandmarks`); a coluna tem marcas de 1, 10, 100... anos. A conta é `valor / (salário mínimo × 12)` (13º e férias fora: conta simples; resolve a pergunta 6 do roadmap).
**Consequências:** com isso as seis visualizações planejadas estão prontas e quatro delas (Sobrepostos, Desfile, Pilhas, Anos) compartilham zoom e legenda. A premissa "guardar tudo" é explícita e irrealista, para não induzir a leitura de que alguém poderia de fato chegar lá.
**Alternativas:** 13 salários por ano (descartada: complica o texto sem mudar a mensagem); incluir inflação/juros (descartada: exigiria premissas fora da base e esconderia a escala).

## ADR-020 — Escada e "1% mais rico" no lugar de "100 pessoas" (a forma foi revista no ADR-021)

**Contexto:** o dono do projeto pediu para trocar "100 pessoas" por um gráfico que **cresça com o patrimônio** e mostre quanto está concentrado depois do adulto mediano, e para criar uma visualização mais clara do 1% mais rico contra o resto, **em números absolutos**.
**Decisão:** (1) **Escada**: barras que crescem a cada passo da rolagem, com a barra do adulto mediano como régua que encolhe de verdade; o passo final traz a conta rigorosa do teto da metade mais pobre (7,5% = 0,5 × mediana ÷ média, só UBS). (2) **1% mais rico**: números absolutos por **estimativa própria** (adultos IBGE 2022 × média UBS × fatia 49,3% do Credit Suisse 2021), com o passo a passo e os avisos na tela. (3) Novo fato `adultos-18` e nova fonte `ibge-censo-2022` (obtidos pela API SIDRA). (4) a viz e o código de "100 pessoas" foram removidos.
**Consequências:** agora o app mostra "R$ 11,4 trilhões para 1,5 milhão de pessoas contra R$ 11,7 trilhões para 152,8 milhões" em vez de só percentuais, ao custo de misturar fontes. O ADR-006 permite estimativa própria rotulada e documentada; a regra do .md de não cruzar fontes foi tratada com a seção "Como calculamos" e os avisos. A conta do teto de 7,5% é independente da estimativa do 1%.
**Alternativas:** manter 100 pessoas só com percentuais (descartada: não mostra o absoluto pedido); curva de Lorenz modelada (descartada: inventaria uma distribuição que a base não tem); usar população total em vez de adultos (descartada: a média do UBS é por adulto).

## ADR-021 — Escada estática e 1% mais rico só com números

**Contexto:** depois de ver as primeiras versões, o dono do projeto pediu: (1) no 1% mais rico, remover a comparação de bolinhas e o gráfico do meio, mantendo o número absoluto de pessoas do 1%; (2) a Escada como **gráfico horizontal, sem rolagem**, apenas apontando para a mediana e mostrando o que está antes e depois, com o depois concentrando a riqueza.
**Decisão:** (1) o 1% mais rico virou texto e cartões, com o "1,5 milhão de pessoas" em destaque (as duas barras, a faixa e as 96 bolinhas saíram; interpretei "o gráfico do meio" como o bloco de gráficos central, incluindo as barras de pessoas e dinheiro: se a intenção era remover só a faixa, as barras podem voltar); (2) a Escada virou um gráfico estático: barra de toda a riqueza dividida no adulto mediano (até 7,5% antes, pelo menos 92,5% depois) e barras lineares antes e depois contra a maior; o código de rolagem passo a passo foi removido.
**Consequências:** as duas telas ficaram mais simples e sem estado; a Escada cabe numa tela de celular. O "antes" do adulto mediano só aparece como a metade mais pobre (não há patamares abaixo da mediana na base).
**Alternativas:** manter as barras do 1% (descartada pelo pedido); posicionar os patamares numa eixo de percentis (descartada: a base não tem os percentis dos grupos).

## ADR-022 — Gráfico da fila na Escada (taco de hóquei com três trechos)

**Contexto:** pedido: acrescentar à Escada um gráfico com o mediano no meio, na horizontal (quantidade de pessoas), e o patrimônio crescendo muito para o final à direita.
**Decisão:** eixo x = adultos em fila (0 a 100%), mediano em 50%; eixo y = patrimônio médio do trecho, linear. Três barras, as únicas que a base sustenta: 50% mais pobres (até a mediana), 49% do meio (média mínima estimada = riqueza que sobra ÷ 49% das pessoas) e 1% do topo (média estimada); bilionários como seta fora da escala, com o fator de altura escrito. Nenhuma curva interpolada.
**Consequências:** a mensagem (colado no chão e dispara no fim) aparece sem inventar dados; o custo é que dois dos três valores são estimativas que misturam UBS, Credit Suisse 2021 e IBGE (avisado na tela). A seta dos bilionários é uma quebra de eixo explícita e rotulada, não compressão silenciosa (ADR-007).
**Alternativas:** curva de Lorenz modelada (descartada: inventaria a forma); eixo y logarítmico (descartado: ADR-007); mais trechos (descartado: sem dados confiáveis por percentil).

## ADR-023 — Quartis na Escada sem inventar os cortes (SUBSTITUÍDO pelo ADR-024: os quartis rotulados saíram)

**Contexto:** pedido: acrescentar o 2º e o 3º quartis ao gráfico da fila. A base só tem a mediana (o corte do 2º quartil, 50%) e a média; não há o corte de 25% nem o de 75% (busca na web também não achou: só medianas e fatias de grupos de fontes divergentes).
**Decisão:** marcar as divisas de 25%, 50% e 75% e rotular os quatro quartis, com cada um mostrando só o que se prova: 1º e 2º ≤ mediana; 3º entre a mediana e 4 × média (R$ 600 mil, `percentileUpperBound`); 4º ≥ o corte de 75% e com o 1% do topo. Aviso explícito de que os cortes exatos não existem na base.
**Consequências:** o gráfico mostra a estrutura de quartis sem números falsos; o 3º quartil aparece como uma faixa possível (mediana a R$ 600 mil), larga porque os dados não permitem mais. O limite de R$ 600 mil assume patrimônio não negativo (o UBS mede patrimônio líquido, que pode ser negativo).
**Alternativas:** usar os dados do World Inequality Database / howpoorami (descartada por ora: dá o 1% mais rico em 39,5%, em conflito com o 49,3% do Credit Suisse que o app usa; se o dono quiser, vira uma decisão de fonte); interpolar uma curva (descartada: ADR-006).

## ADR-024 — Escada: cortes de 25% e 75% por modelo, barra do 1% sem limite e crescendo para baixo (o gráfico vertical mudou de aba no ADR-025)

**Contexto:** o resultado do ADR-023 (quatro quartis rotulados, com faixas de valores possíveis) ficou ruim para o dono do projeto. Ele queria **apenas o patrimônio dos cortes de 25% e de 75%**, que não se viam no gráfico por causa do crescimento do 1%; pediu a barra "Toda a riqueza do país" acima, a barra do 1% **sem limite de tamanho, crescendo para baixo**, com rolagem e contagem de telas.
**Decisão:** (1) a base não tem os cortes e as buscas não os acharam (o WID/howpoorami usa mediana R$ 52 mil e média R$ 229 mil, incompatíveis com o app); então **estimar por modelo**, documentado e rotulado (lognormal + cauda de Pareto ajustados à mediana, à média e aos 49,3% do 1%; ADR-006 permite estimativa própria com método explícito), com faixa de incerteza e arredondamento a 2 algarismos; (2) "Toda a riqueza do país" passa para o alto; (3) a fila vira um gráfico vertical em escala real (1 px = R$ 500) com o eixo x no alto, varas para 25/50/75% e a barra do 1% sem teto (~17,5 telas), com **contador de telas**; os bilionários e Saverin entram como texto em telas, não como barras; (4) remover `middleMeanAtLeast` e `percentileUpperBound` (sem uso) e as barras de média por trecho.
**Consequências:** os valores de 25% e 75% (≈ R$ 6,7 mil e ≈ R$ 76 mil) são plausíveis mas **não são dado oficial** e dependem da forma assumida para a distribuição; mudar o ponto de emenda os move pouco (75%: R$ 74 a 87 mil). A página fica muito longa (17,5 telas) de propósito, no espírito do ADR-012. As "telas" dependem do aparelho (altura da janela).
**Alternativas:** manter só limites rigorosos (descartada pelo dono: não mostra valor); trocar a fonte para o WID (descartada: conflita com UBS e Credit Suisse e mudaria o 1% mais rico); eixo y logarítmico (descartada: ADR-007).

## ADR-025 — Gráfico vertical da fila vai para a aba 1% mais rico; barras 1% × 99% voltam

**Contexto:** o dono do projeto pediu para (1) mover o gráfico vertical que cresce para baixo (ADR-024) da Escada para o **fim da aba 1% mais rico** e (2) **voltar o gráfico que mostra a quantidade de riqueza do 1% e dos 99%**, deixando claro que 1% das pessoas (1,5 milhão) tem quase metade da riqueza total.
**Decisão:** (1) o gráfico vertical foi extraído para `viz/fila-chart.ts` (HTML + contador de telas, reaproveitável) e é a última seção do 1% mais rico; a Escada voltou a uma tela (toda a riqueza, barras horizontais, "Como sabemos", link para o 1%); (2) as duas barras alinhadas (pessoas e dinheiro) com a faixa de ligação voltam à aba 1% mais rico, logo depois do destaque, que agora diz "quase metade (49,3%)"; as bolinhas de equivalência continuam removidas (ADR-021).
**Consequências:** a aba 1% mais rico fica longa (~19 telas contando a fila em escala real), mas em ordem crescente de esforço: número, barras, cartões, fila. A Escada fica leve. A interpretação de "o gráfico do meio" do ADR-021 estava errada: o dono queria as barras 1% × 99%; só as bolinhas e (opcionalmente) a faixa estavam em questão.
**Alternativas:** deixar o gráfico vertical na Escada (descartada pelo pedido); duplicar o código em duas abas (descartada: módulo compartilhado).

## ADR-026 — "Escada" vira "Distribuição" e ganha o cenário ideal (divisão igual)

**Contexto:** o dono do projeto pediu: trocar o nome de Escada para Distribuição; acrescentar outros marcos como o patrimônio médio; remover as linhas horizontais da aba; e acrescentar uma cópia do gráfico anterior como **cenário ideal**, em que todo o patrimônio é dividido por todos, mostrando quanto cada brasileiro teria e **quantos teriam mais e quantos menos**.
**Decisão:** (1) id e título passam a `distribuicao` / "Distribuição" (apelido `escada → distribuicao` em `main.ts`); (2) as barras horizontais saem e o gráfico do cenário ideal não tem régua horizontal; (3) o cenário ideal é uma cópia do gráfico da fila na mesma escala (1 px = R$ 500): uma **parede** de R$ 150 mil (a média) e **varas** do patrimônio de hoje em marcos da fila (25%, 50% = adulto mediano, 75%, o ponto onde hoje = média, e 95%); (4) o ponto em que o patrimônio de hoje cruza a média na fila vem do modelo (`estimateMeanPosition`): ≈ 85% (84% a 86%), logo ≈ 131,8 milhões teriam mais e ≈ 22,5 milhões teriam menos, com a certeza rigorosa de pelo menos 77,2 milhões a ganhar; (5) `percentileAtValue` e `estimateMeanPosition` entram em `lib/wealth-model.ts` com testes.
**Consequências:** a aba responde "e se fosse igual?" com números absolutos e marcos, mas a maior parte é estimativa de modelo, escrita na tela. O marco "patrimônio médio" fica em ≈ 85% da fila, o que mostra que a média é um valor que só ~15% dos adultos superam. Interpretei "o gráfico anterior" como o gráfico vertical da fila (escala real) e "linhas horizontais" como as barras horizontais da aba; se a intenção era outra, é uma troca pequena.
**Alternativas:** repetir o gráfico com o 1% crescendo para baixo também no cenário ideal (descartada: no cenário ideal não existe 1% de fortuna enorme); contar quem ganha e quem perde só com o fato rigoroso (descartada: o dono quer ver quantos a mais, e a estimativa está rotulada).

## ADR-027 — Remoção da aba Círculos

**Contexto:** a visualização "Círculos" (círculos lado a lado, com zoom) era a viz de prova da fundação. Com os "Sobrepostos" (mesmos círculos, centro comum, salário mínimo no meio, legenda detalhada) ela ficou redundante.
**Decisão:** remover a aba, o código (`src/viz/circles/`), o CSS das bolhas e do zoom por botões, e `radiusByArea` (com seu teste), que só ela usava. O princípio de "área proporcional, nunca raio" segue valendo e está implementado nos Sobrepostos (`raio ∝ √(valor)`).
**Consequências:** o menu fica com 7 abas (Pixel a pixel, Sobrepostos, Distribuição, 1% mais rico, Desfile, Pilhas de notas, Em anos de salário). Quem tinha o link `#circulos` cai na primeira aba (o app já usa a primeira visualização pronta quando o id não existe).
**Alternativas:** manter a aba (descartada pelo pedido).

## ADR-028 — Desempenho da aba "Em anos de salário": só desenhar o que é visível

**Contexto:** a aba travava ao mexer no zoom, mais ao afastar (a pessoa suspeitou da quantidade de artefatos desenhados).
**Causa (medida):** o código das marcas de ano percorria todos os níveis de 1 ano para cima, inclusive os de espaçamento minúsculo (0,00002 px com o zoom mais afastado), e cada nível iterava até o número de marcas da coluna: **~32 milhões de operações de desenho por quadro** com as 22 colunas (contra ~3 mil no zoom normal), por causa de `last = min(hpx/espaçamento, ...)` sem descartar níveis invisíveis. A medição foi feita executando `drawPillar` contra um contexto 2D falso que conta as chamadas, em 9 níveis de zoom.
**Decisão:** (1) `drawPillar` só percorre os níveis com espaçamento entre 5 px e a altura do palco e desenha cada nível em um único `beginPath/rect/fill`; (2) as linhas tracejadas de referência do motor de altura (`height-engine.ts`) passam a ser UM traço com `setLineDash` em vez de ~45 retângulos cada; (3) testes de desempenho com orçamento de operações por quadro em todos os zooms para as colunas (Anos) e as pilhas (Notas); as outras visualizações de altura já eram limitadas pela tela.
**Consequências:** o custo por quadro fica limitado (centenas de operações) em qualquer zoom; os testes impedem a regressão. Não medimos tempo real em aparelho (só contagem de operações); a calibração no celular (`?calibrar` mostra o FPS) confirma.
**Alternativas:** reduzir a taxa de quadros (descartada: esconderia o problema); desenhar tudo em um canvas offscreen em cache (desnecessário depois da correção).

## ADR-029 — "Toda a riqueza do país": valor absoluto e bolinhas de 1 milhão de pessoas

**Contexto:** pedido para melhorar a seção "Toda a riqueza do país, hoje": mostrar o valor absoluto de toda a fortuna e um esquema de bolinhas com as pessoas de cada lado do adulto mediano (77 bolinhas, cada uma 1 milhão de pessoas), apertadas à esquerda e espaçadas à direita.
**Decisão:** (1) o valor absoluto é a estimativa já usada no 1% mais rico: adultos (IBGE 2022) × média (UBS) = ≈ R$ 23,2 trilhões, com o teto de 7,5% (≈ R$ 1,7 tri) e o piso de 92,5% (≈ R$ 21,4 tri) em valores; (2) as bolinhas têm o mesmo tamanho (4 px) nos dois lados e ficam dentro dos segmentos da barra (7,5% e 92,5% da largura): a esquerda numa grade compacta (passo de 4,6 px), a direita numa grade de 4 linhas; assim o espaçamento transmite a diferença de riqueza por pessoa; (3) 77 é o arredondamento de 77,2 milhões por lado; a legenda diz "≈".
**Consequências:** a ideia "muita gente, pouca riqueza" vs "muita gente, muita riqueza" fica visível sem texto; a barra pode ficar mais alta em telas estreitas (a grade apertada precisa de linhas). O valor absoluto é estimativa (rotulada).
**Alternativas:** bolinhas fora da barra (descartada: o aperto só se vê se elas estão dentro do pedaço de riqueza); bolinhas de tamanhos diferentes (descartada: confundiria com quantidade de pessoas).

## ADR-030 — 1% mais rico: gráfico unificado, com a legenda sendo os números

**Contexto:** pedido: unificar; manter o gráfico "Quantas pessoas"; fazer de "1,5 milhão de pessoas" e "152,8 milhões de pessoas" a legenda; tirar o gráfico intermediário ampliado; ficar só "Quantas pessoas" com legenda e "Quanto dinheiro" com a legenda como já estava.
**Decisão:** duas barras alinhadas, cada uma com os dois números embaixo como legenda (com o quadradinho de cor ao lado); remover a faixa de ligação (SVG) e a linha de legenda separada, redundante.
**Consequências:** o gráfico fica mais curto e sem repetição: as cores se explicam nos próprios números. A relação "1% das pessoas = quase metade do dinheiro" continua legível pelo alinhamento das barras e pelo destaque no topo.
**Alternativas:** manter a faixa (descartada pelo pedido).

## ADR-031 — Revisão geral de linguagem e estilo: simples e objetivo

**Contexto:** o site usava termos difíceis ("conta private banking", "mediana", "quartil", "modelo lognormal", "holding", códigos de ações) e explicações longas. O pedido foi tornar tudo mais objetivo e simples, trocando nomes como "conta private banking" por algo como "investidor rico", sempre que necessário.
**Decisão:** (1) renomear grupos e profissões nos dados (ex.: "Investidor rico (média)", "Dono de cartório", "Juiz e afins", "Promotor e procurador", "Diretor de indústria", "Produtor rural", "Quem declara IR (média)", "Adulto do meio" no lugar de "mediano") e reescrever resumos e avisos em frases curtas; (2) renomear abas (Círculos, Alturas, Anos de trabalho) mantendo os endereços; (3) reescrever os textos de todas as telas, tirando jargão (quartil, percentil, teto, marcha, cenário ideal, varas) e mantendo as contas em blocos recolhíveis "Como calculamos"; (4) mostrar "salários mínimos" por extenso, esconder códigos de ações e "capital fechado" (agora "fora da bolsa"), mostrar a confiança como "alta / boa / média / baixa"; (5) letra mínima de 12 px nos textos e 11 px nos rótulos de gráficos, com mais espaço entre rótulos; (6) novo guia docs/LINGUAGEM.md e regra no CLAUDE.md.
**Consequências:** a leitura fica mais rápida; os termos técnicos continuam apenas na documentação para quem mantém o código. Perde-se um pouco de precisão em alguns rótulos ("Juiz e afins" abrange todos os membros do Judiciário na fonte). Os nomes dos arquivos e das funções (`concentric`, `parade`, `years`) não mudaram.
**Alternativas:** manter os nomes técnicos e só encurtar frases (descartada: o pedido era trocar nomes difíceis); trocar também os endereços das abas (descartada: quebraria links).

## ADR-032 — Paleta clara em vermelho, azul e branco (tons pastel)

**Contexto:** o tema escuro com verde-água, laranja, rosa e roxo era vibrante e cansava a vista. O pedido: preferir branco, vermelho e azul; **vermelho = os mais pobres**; tons pastel; em gráficos com muitas cores, cores que contrastem bem; sem neon; visual mais limpo.
**Decisão:** (1) **tema claro** (fundo `#F6F7FA`, cartões brancos, texto `#1F2A3D`); (2) **vermelho pastel `#E58A91`** para os adultos comuns/mais pobres e **azuis de luminosidade crescente** para os mais ricos (`#8DB2E6` → `#5E8DD8` → `#3F6FBF` → `#2B4A80`), de modo que 5 grupos fiquem distinguíveis; (3) nas barras de metade e de 1%/99%: vermelho contra azul (azul-marinho no 1%); em "teriam mais / menos": vermelho / azul-marinho; (4) texto sobre fundo claro nunca em cor pastel (usa texto escuro ou o vermelho `#B8434F` / azul-marinho); (5) sem brilho nem sombra de texto; contornos de seleção em tinta escura em vez de branco; (6) pilha de notas em azul-acinzentado claro neutro, com a tampa na cor do grupo; (7) círculos fora da tela deixam de pintar o fundo; (8) paleta definida em dois lugares sincronizados (`styles.css` e `viz/colors.ts`).
**Consequências:** leitura mais calma e consistente: a cor diz "quem" (vermelho pobre, azul rico). A cor deixa de distinguir por tipo (acionista, bilionário) e passa a indicar posição na escala de riqueza; entre os azuis a diferença é de luminosidade, o que ajuda a separar mas pede legenda. O contraste dos tons mais claros contra branco é menor (azul claro, vermelho pastel): por isso eles são só preenchimentos e nunca texto.
**Alternativas:** manter o tema escuro com tons pastel (descartada: "branco" foi pedido como cor preferida); paleta por tipo de grupo com vários matizes (descartada: o pedido era vermelho, azul e branco).

## ADR-033 — Mais vermelho para a classe trabalhadora e textos enxutos

**Contexto:** pedido: (1) dar mais vermelho a quem é da classe trabalhadora, principalmente nas duas primeiras abas; (2) revisar as explicações: sem tantos detalhes e ressalvas, deixando o usuário tirar as conclusões óbvias dos gráficos.
**Decisão:** (1) o grupo "geral" (adultos e famílias comuns, quem declara IR, o salário mínimo) é a **classe trabalhadora**: vermelho pastel um pouco mais forte (`#E2737D`); em **Pixel a pixel** os quadradinhos ainda por percorrer ficam mais visíveis (45% em vez de 26%) e em **Círculos** os círculos vermelhos têm traço de 2,5 px e preenchimento de 12% (os azuis ficam finos, 3%); as duas abas ganham a frase "Vermelho: pessoas comuns. Azul: mais ricos."; (2) textos cortados em todas as abas: notas de uma frase, cartões só com o número, "Como calculamos" recolhido em 1 a 2 linhas (Distribuição e 1% mais rico), blocos longos de ressalva removidos (fila em escala real, cenário "e se fosse igual?", bilionários); a legenda expandida mostra só resumo curto, empresas e fonte (sem "confiança" nem observações); resumos dos dados encurtados.
**Consequências:** leitura mais rápida e visual. Perde-se explicação do método na tela: as contas e as ressalvas continuam em docs/ (DADOS.md, VISUALIZACOES.md) e nos campos de dados; as ressalvas de cada número aparecem só na ficha de detalhe (ao tocar num item que não está na legenda). Estimativas continuam marcadas por "≈" e "Estimativa". Classificar "geral" como classe trabalhadora é uma simplificação: inclui quem declara IR (média de R$ 409 mil), que tem renda mais alta que a média dos trabalhadores.
**Alternativas:** vermelho também nas profissões bem pagas (descartada: borraria a diferença entre trabalho comum e alta renda); remover os avisos de estimativa (descartada: manter o mínimo de honestidade com "≈" e "Estimativa").

## ADR-034 — Tons quentes para a classe trabalhadora e azuis variados para os mais ricos

**Contexto:** a paleta por grupo (um vermelho, um azul claro, um azul médio...) dava poucas cores para separar as muitas pessoas e grupos dos gráficos. O pedido: considerar **classe trabalhadora até o dono de cartório**, com **tons mais quentes (não só vermelho)**, e querer **mais contraste**; o mesmo vale para o **azul dos mais ricos**.
**Decisão:** (1) a cor deixa de ser por grupo e passa a ser **por pessoa/grupo** (`entityColor`): **13 tons quentes** para ½ salário mínimo, salário mínimo, adulto do meio, adulto médio, quem declara IR, família média, produtor rural, diretor de indústria, atleta, diplomata, promotor e procurador, juiz e afins e dono de cartório; **12 azuis** para investidor rico, os acionistas, bilionários e banqueiros; (2) o limite da classe trabalhadora é o patrimônio do dono de cartório (R$ 3,28 mi, `isWorkingClass`); (3) as cores de vizinhos na escala de riqueza alternam claro/escuro e tom, e um teste (`colors.test.ts`) exige distância mínima entre vizinhos, tom quente para a classe trabalhadora, azul para os ricos e cor para toda entrada nova (o teste já pegou um par parecido demais); (4) o vermelho forte fica com o adulto do meio; as barras de metade e 1%/99% seguem em vermelho contra azul; (5) em Círculos os anéis quentes têm traço mais grosso e preenchimento leve, e as duas primeiras abas dizem "Tons quentes: classe trabalhadora. Azuis: mais ricos."
**Consequências:** muito mais contraste entre vizinhos (os gráficos de altura, anos e círculos ficam multicoloridos). A cor deixa de dizer só "quem é de que grupo" e passa a dizer "posição na escala", com uma legenda de swatches ao lado dos nomes. Duas cores pastel claras (rosa claro do ½ salário mínimo, azul bebê) ficam fracas contra o branco, mas só em itens pequenos. "Classe trabalhadora até o dono de cartório" é uma classificação do projeto, não da fonte de dados: inclui profissões bem pagas (juiz, diplomata, dono de cartório).
**Alternativas:** manter 5 cores por grupo (descartada: contraste insuficiente entre as 13 entradas); uma rampa contínua de vermelho a amarelo (descartada: vizinhas parecidas demais).

## ADR-035 — Patrimônio de políticos por cargo, calculado dos dados abertos do TSE

**Contexto:** pedido de incluir o patrimônio médio de políticos por cargo, exceto presidente. A busca na web não achou médias por cargo prontas (só casos isolados), mas o TSE publica os bens declarados de cada candidato.
**Decisão:** calcular a média dos **eleitos** por cargo (2022: governador, vice, senador, deputados; 2024: prefeito, vice, vereador), 9 novas entidades no grupo `politicos`, fontes `tse-2022` e `tse-2024`, confiança "media", mediana no `caveat`. Cores novas em `colors.ts` (6 quentes, 3 azuis), pelo mesmo critério de valor (até R$ 3,28 mi = quente).
**Consequências:** a média é muito puxada por poucos milionários (governador: média R$ 16 mi, mediana R$ 2 mi), e o valor declarado costuma ser o de compra. Pela regra de valor, vereador a deputado federal caem na "classe trabalhadora" das cores, o que é só a regra do projeto. Suplentes e senadores de 2018 ficam de fora; eleições de 2026 ainda não entram.
**Alternativas:** usar a mediana como valor principal (descartada: o pedido é "médio" e as demais entidades são médias; a mediana fica no texto).

## ADR-036 — Percentual de adultos abaixo de cada patrimônio

**Contexto:** pedido de mostrar a porcentagem de pessoas em cada patamar, quando fosse fácil.
**Decisão:** reaproveitar o modelo de distribuição (ADR-026) para mostrar "Tem mais que ≈ X% dos adultos" nas legendas, na ficha e no Pixel a pixel. Sem busca nem cálculo novos de dados; renda (ex.: quem ganha 1 salário mínimo) não entra, por não misturar com patrimônio.
**Consequências:** o valor é estimativa (marcado com "≈"); acima de 99,99% aparece "mais de 99,99%".
