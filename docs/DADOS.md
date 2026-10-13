# Dados

## Fonte de verdade

[patrimonio-brasil-2026.md](../patrimonio-brasil-2026.md) (versão 2, 12/10/2026) é a base de conhecimento humana, com fontes e ressalvas. Os JSON em `src/data/` são **derivados** dele, escritos à mão e curados. Quando houver conflito, o .md vence; corrija o JSON.

O .md avisa: *"Não somar nem cruzar números de fontes diferentes sem checar a ressalva."* Esta aplicação herda essa regra.

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/data/entities.json` | Valores plotáveis. Cada um é um ponto nas visualizações |
| `src/data/facts.json` | Contexto numérico (contagens, %): 255 bilionários, 386 mil milionários, salário mínimo etc. Alimenta textos e a viz "100 pessoas" |
| `src/data/sources.json` | Fontes com nome, URL e referência temporal |
| `src/data/types.ts` | Esquema TypeScript |

## Esquema de `Entity`

| Campo | Significado |
|---|---|
| `id` | slug único |
| `label` | nome exibido |
| `group` | `topo`, `acionistas`, `alta-renda`, `ocupacoes`, `geral` (define a cor) |
| `kind` | `individual`, `average`, `median`, `aggregate` |
| `measure` | `wealth` ou `income` |
| `unit` | `pessoa`, `familia`, `adulto`, `conta`, `grupo` |
| `valueBRL` | valor central em reais |
| `rangeBRL` | faixa quando a fonte dá intervalo ou há versões divergentes (o valor central deve estar dentro) |
| `year` | ano de **referência do dado**, não da publicação |
| `sourceId` | chave em `sources.json` |
| `confidence` | `alta`, `media-alta`, `media`, `baixa` (herdada da tabela da seção 1 do .md) |
| `caveat` | ressalva curta para o usuário; **obrigatória** se `confidence != "alta"` |
| `mdSection` | seção do .md onde o dado está, para rastreio |
| `summary` | opcional: uma frase de contexto exibida na legenda |
| `holdings` | opcional: empresas/bancos por trás da fortuna (`company`, `stake`, `ticker`, `listed`, `note`) |

## Conteúdo atual (34 entidades de patrimônio)

- **Topo (Forbes Brasil 2026):** Saverin, Safra, Lemann, Esteves, F. Moreira Salles, P. Moreira Salles, piso do top 10, bilionário médio, soma do top 10, soma dos 255.
- **Acionistas (Economatica):** Moll, Mateus, Barsi. Confiança média: levantamento sem data confirmada.
- **Alta renda:** conta private média (Anbima 2022).
- **Ocupações (Receita, IRPF 2026):** cartório, Judiciário, MP, diplomata, atleta, dirigente industrial, produtor agropecuário.
- **Geral:** família média, declarante médio, adulto médio, adulto mediano.

## Regras de comparabilidade

### Políticos por cargo (TSE, grupo `politicos`)

Média do patrimônio **declarado ao TSE** pelos **eleitos** (situação "eleito", sem suplentes; sem presidente e vice-presidente), somando os bens de cada um: **2022** (eleições gerais) governador, vice-governador, senador (os 27 eleitos em 2022, metade do Senado), deputado federal, estadual e distrital; **2024** (municipais) prefeito, vice-prefeito e vereador. Cálculo do projeto sobre os arquivos abertos `consulta_cand` + `bem_candidato` (`cdn.tse.jus.br`), junto por `SQ_CANDIDATO`; eleito sem bem declarado entra com zero. Confiança "media" (não é publicado pelo TSE como média; bens declarados pelo valor de compra). A mediana está em cada `caveat`, porque poucos muito ricos puxam a média (ex.: um vereador declarou R$ 2,4 bi, provável erro de digitação, e o vereador médio fica em R$ 360 mil contra mediana de R$ 92 mil).

| Cargo | Ano | Eleitos | Média | Mediana |
|---|---|---|---|---|
| Vereador | 2024 | 58.153 | R$ 360 mil | R$ 92 mil |
| Vice-prefeito | 2024 | 5.529 | R$ 1,13 mi | R$ 250 mil |
| Deputado distrital | 2022 | 24 | R$ 1,18 mi | R$ 475 mil |
| Prefeito | 2024 | 5.529 | R$ 1,75 mi | R$ 460 mil |
| Deputado estadual | 2022 | 1.035 | R$ 2,11 mi | R$ 780 mil |
| Deputado federal | 2022 | 513 | R$ 3,06 mi | R$ 1,02 mi |
| Senador | 2022 | 27 | R$ 5,24 mi | R$ 1,15 mi |
| Vice-governador | 2022 | 27 | R$ 16,26 mi | R$ 1,29 mi |
| Governador | 2022 | 27 | R$ 16,34 mi | R$ 2,03 mi |

Os dados brutos não estão no repositório (são grandes); para refazer, baixe os quatro .zip de `https://cdn.tse.jus.br/estatistica/sead/odsele/{consulta_cand,bem_candidato}/*_{2022,2024}.zip`.

### Percentual de adultos abaixo (`lib/percentil.ts`)

Na legenda, na ficha de detalhe e na lista do Pixel a pixel, cada patrimônio de pessoa mostra "Tem mais que ≈ X% dos adultos". É a mesma estimativa por modelo do ADR-026 (mediana, média e parcela do 1%), então vale a margem de erro das estimativas: o adulto mediano é 50% por definição. Ficam de fora famílias, contas, grupos e agregados. Não há percentual de "quem recebe só 1 salário mínimo": é renda, que o projeto não mistura com patrimônio.

### Patrimônio vs renda
Salários (Glassdoor, Michael Page, CAGED), rendimento do trabalho (IBGE) e renda por classe (Tendências, FGV) medem **fluxo**, patrimônio mede **estoque**. `measure: "income"` existe no esquema, mas `wealthEntities()` os exclui e nenhuma viz de patrimônio os mistura. A viz "Em anos de salário" é o único lugar onde renda aparece, como **régua** (quanto tempo de trabalho), nunca como ponto comparável.

### Unidades
Valores de `familia`, `conta` e `adulto` não são equivalentes. Regras:
- O painel de detalhe mostra a unidade.
- Visualizações que cruzam unidades (ex.: círculo de família ao lado de adulto) devem sinalizar na legenda. Decisão pendente de UX: ver [ROADMAP](ROADMAP.md#perguntas-em-aberto).

### Declarantes de IR vs adulto geral
O patrimônio do declarante (R$ 409 mil) **não** é comparável diretamente ao do adulto médio do UBS (R$ 150–170 mil): o primeiro exclui quem não declara (eleva a média) e usa custo de aquisição (reduz). Ambos aparecem, com ressalva.

### Empresas por trás das fortunas (`holdings`)
Origem: seções 2 e 3.1 do .md (Safra, BTG, Itaú/Itaúsa/CBMM, Rede D'Or, Grupo Mateus, AB InBev/3G, Meta). Participações são citadas como no .md, com data (ex.: Esteves 29,5% da BTG Pactual Holding em jan/2024; Moreira Salles 13% e 11,6% do Itaú após 2022). Regras: `listed: false` só onde o .md diz (Safra: "não é listado em bolsa"); **`ticker` NÃO consta no .md** (ITUB4, ITSA4, BPAC11, RDOR3, GMAT3, META vêm de conhecimento geral): conferir na B3/CVM antes de publicar. AB InBev, 3G Capital e CBMM ficam sem ticker e sem `listed` porque o .md não informa.

**Lacuna: casa própria.** O .md não traz composição do patrimônio (imóvel, poupança, etc.) nem taxa de casa própria. Por isso o adulto médio e o mediano mostram só "a base não detalha a composição (casa própria, poupança, etc.)". Para exibir "equivale a uma casa" é preciso incluir uma fonte (ex.: composição da riqueza no relatório do UBS ou dados do IBGE/Censo sobre moradia própria) em `sources.json`, sem estimativa própria sem rotular (ADR-006).

### Alturas de referência (Desfile)
`src/data/landmarks.ts` guarda alturas conhecidas (Cristo Redentor 38 m, Torre Eiffel 330 m, Burj Khalifa 828 m, Monte Everest 8.849 m, avião em cruzeiro 11 km, limite do espaço 100 km, ISS 400 km). **Não vêm do .md**: são conhecimento geral usado como régua visual, arredondadas; conferir antes de publicar. A altura de 1,70 m para o adulto médio é a convenção do Desfile de Pen, não um dado da base.

### Marcos de tempo (Em anos de salário)
`timeLandmarks` em `src/data/landmarks.ts`: carreira de 35 anos (suposição), 1500, era cristã, Pirâmide de Quéops, fim da Era do Gelo, primeiros Homo sapiens, primeiras ferramentas de pedra e separação entre humanos e chimpanzés. **Não vêm do .md**: datas aproximadas de conhecimento geral; conferir antes de publicar. A conta usa 12 salários mínimos por ano e o ano de referência 2026.

### Notas de R$ 100 (Pilhas de notas)
Tamanho **156 mm × 70 mm** e cor azul-turquesa: Banco Central, cartilha da Segunda Família do Real (`sources.json`, id `bcb-cartilha-2a-familia`). **Espessura de 0,11 mm: estimativa não oficial** (o Banco Central não publica; vem de exercícios e blogs). Piscina olímpica = 2.500 m³ (50 × 25 × 2 m). Constantes em `lib/scale.ts`; confira a espessura medindo uma pilha real antes de publicar.

### Estimativas próprias de concentração (1% mais rico)
`lib/concentration.ts` combina: adultos 18+ (**IBGE, Censo 2022**, soma das idades de 18 a 100+ na tabela 9514 do SIDRA: 154.346.198; fato `adultos-18`), média por adulto (UBS, R$ 150 mil; faixa até R$ 170 mil) e fatia do 1% mais rico (**Credit Suisse 2021**, 49,3%). Resultado: riqueza total ≈ R$ 23,2 tri, 1% = R$ 11,4 tri para 1,5 mi de pessoas (R$ 7,4 mi cada) e 99% = R$ 11,7 tri para 152,8 mi (R$ 76,8 mil cada). **É ordem de grandeza**: quatro fontes, três anos, definições de "adulto" que podem diferir (ADR-006: estimativa própria só com método documentado e rótulo). A população 18+ de 2022 não é a de 2026. O teto da metade mais pobre (7,5%) usa só média e mediana do UBS (mesma fonte).

### Estimativa por modelo dos cortes de 25% e 75% (Escada)
`lib/wealth-model.ts` ajusta corpo lognormal (mediana R$ 22,5 mil) + cauda de Pareto (acima do percentil 90) à **média de R$ 150 mil** e aos **49,3% do 1% mais rico**, e devolve patrimônio por percentil: **25% ≈ R$ 6,7 mil** e **75% ≈ R$ 76 mil**. Não é dado oficial; é consistente com os dados do app (a metade mais pobre sai com ~2,7% da riqueza, abaixo do teto de 7,5%). Fontes: UBS (mediana e média), Credit Suisse 2021 (1%). A alternativa WID/howpoorami (mediana R$ 52 mil, média R$ 229 mil, 1% = 39,5%) não foi usada por ser incompatível com as demais fontes do app.

### Cenário ideal: onde a média cai na fila
`estimateMeanPosition` (`lib/wealth-model.ts`) acha, no modelo, o percentil em que o patrimônio de hoje chega à média de R$ 150 mil: ≈ **85%** (faixa 84% a 86%). Quem está antes teria mais numa divisão igual (≈ 131,8 mi de adultos), quem está depois teria menos (≈ 22,5 mi). A única parte rigorosa é que pelo menos 50% (os abaixo da mediana) teriam mais. Estimativa; ver ADR-026.

### Referência (salário mínimo)
`kind: "reference"` é uma régua, não patrimônio. O salário mínimo (R$ 1.621, `facts.json`) vira a entidade `salarioMinimo` em `data/index.ts`, com `measure: "income"`, e **não** entra em `wealthEntities()`. É o centro dos Sobrepostos e a unidade do pixel a pixel. Um teste garante que bate com `SALARIO_MINIMO_BRL`.

### Agregados
`kind: "aggregate"` (soma dos 255, soma do top 10) servem para proporções (parte do PIB, fatia do total) e para a viz de pilhas. Não entram nos Sobrepostos.

### Datas
Os anos vão de 2021 a 2026. Sempre mostrar `year` e `sources.reference`. Forbes Brasil (R$, base 30/06/2026) não se compara com Forbes global (US$, março/2026).

## Lacunas conhecidas

O .md registra que **não há** patrimônio médio publicado para: MEI, pequeno e médio empresário, classes A, B, C e D. Decisão do projeto: **não inventar**. A UI deve mostrar essas lacunas como "sem dado público" (e apontar o painel da Receita), em vez de preencher com estimativa. Se no futuro o painel da Receita for consultado e os valores forem coletados manualmente, entram como novas entidades com `sourceId` próprio.

## Divergências tratadas

| Item | Versões | Valor usado | Como aparece |
|---|---|---|---|
| Patrimônio médio do declarante | R$ 326,9 mil / R$ 409 mil | R$ 409 mil | `rangeBRL` + caveat |
| Cartório | R$ 2,8 mi / R$ 3,28 mi | R$ 3,28 mi | caveat |
| Milionários (UBS) | 433 mil / 386 mil | 386 mil | caveat em `facts` |
| Adulto médio | R$ 150 mil / R$ 170 mil | R$ 150 mil | `rangeBRL` |
| Adulto mediano | R$ 20 mil a R$ 25 mil | R$ 22,5 mil (ponto médio) | `rangeBRL` + caveat |

## Cálculos próprios (vindos do .md)

- Bilionário médio: R$ 1,86 tri / 255 ≈ R$ 7,3 bi.
- Conta private média: R$ 1,9 tri / 153,1 mil ≈ R$ 12,4 mi.
- Razões da seção 9: banqueiro médio (R$ 73 bi) vs adulto médio ≈ 490 mil vezes; bilionário médio vs adulto mediano ≈ 324 mil vezes. As razões na UI devem ser **calculadas em runtime** a partir das entidades (não digitadas), para nunca divergirem dos dados.

## Como atualizar

1. Atualize o `patrimonio-brasil-2026.md` (ou o substituto da edição seguinte), com fonte e ressalva.
2. Reflita em `entities.json`/`facts.json`/`sources.json`. Mantenha `mdSection`.
3. `npm test` (roda `validateData`).
4. Se a edição mudar o ano-base, revise textos fixos da UI que citem "2026".

## Ideias de dados futuros

Painel da Receita filtrado por ocupação "empresário"; salário mínimo histórico para a viz de tempo; PIB como referência (a fortuna dos bilionários é 14,6% dele). Todo dado novo passa pelo mesmo esquema.
