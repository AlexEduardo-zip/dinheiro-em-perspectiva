# Linguagem e estilo

O site deve ser **objetivo e simples**: frases curtas, palavras do dia a dia, uma ideia por frase. Explicações longas ficam em blocos recolhíveis ("Como calculamos"), nunca no meio da leitura.

## Regras

0. **Pouco texto: o gráfico fala por si** (ADR-033). Cada tela tem um título, no máximo uma frase de apoio e os números. Sem parágrafos de ressalva: quem quiser a conta abre "Como calculamos", que fica recolhido e curto (2 a 3 linhas). Estimativas são marcadas só com "≈" ou "Estimativa" e deixam o leitor tirar as conclusões óbvias do desenho.

1. **Uma frase, uma ideia.** Se passar de ~25 palavras, divida.
2. **Diga o que o número significa**, não só o número: "49,3%: quase metade de toda a riqueza".
3. **Sem jargão.** Veja a tabela abaixo. Se um termo técnico for inevitável, explique na primeira vez e use a versão simples nas outras.
4. **A mesma palavra para a mesma coisa** em toda a tela e na legenda ("quadradinho", "adulto do meio").
5. **Estimativas dizem que são estimativas**, em poucas palavras ("≈", "estimativa", "valor aproximado"), com o cálculo em "Como calculamos".
6. **Letra mínima de 12 px** em texto de tela; rótulos de canvas de 11 px ou mais.
7. **Sem nome de arquivo, sigla ou código** na tela (nada de "patrimonio-brasil-2026.md", "ADR-xx", "SM", códigos de ações).

## Troque estes termos

| Evite | Use |
|---|---|
| mediana, adulto mediano | **adulto do meio** (a pessoa do meio da fila: metade tem menos, metade tem mais) |
| conta private banking, private | **investidor rico (média)**; "private banking" só entre aspas, uma vez, na explicação |
| Titular de cartório | Dono de cartório |
| Membro do Judiciário / do Ministério Público | Juiz e afins / Promotor e procurador |
| Dirigente/diretor de empresa industrial | Diretor de indústria |
| Produtor agropecuário | Produtor rural |
| Declarante médio do IR | Quem declara IR (média) |
| Atleta e desportista | Atleta |
| SM | salário mínimo |
| holding | empresa que controla / empresa da família |
| capital fechado, listada em bolsa | fora da bolsa / na bolsa |
| ticker (ITUB4...) | não mostrar |
| quartil, percentil, P25, P75 | "25% da fila", "75% da fila" |
| teto, piso | no máximo, no mínimo |
| cenário ideal | "E se fosse igual para todos?" |
| varas, hastes | traços |
| marcha | velocidade |
| modelo lognormal / Pareto / ponto de emenda | "uma fórmula matemática que respeita três números" |
| ordem de grandeza | valor aproximado |
| patrimônio líquido | patrimônio (dinheiro e bens, menos dívidas) |
| escala linear, alcance da tela | "na tela cabe até" |
| confiança media-alta | confiança boa |

## Nomes das abas

| Antes | Agora |
|---|---|
| Sobrepostos | **Círculos** |
| Desfile | **Alturas** |
| Em anos de salário | **Anos de trabalho** |
| Pixel a pixel, Distribuição, 1% mais rico, Pilhas de notas | iguais |

Os endereços (`#sobrepostos`, `#paradinha`, `#tempo`) não mudaram, para os links antigos continuarem funcionando.

## Estilo e cores (ADR-032, ADR-034)

- **Tema claro e limpo**: fundo branco-azulado (`#F6F7FA`), cartões brancos com borda fina, texto azul-acinzentado escuro (`#1F2A3D`), cinza só para apoio. Nada de brilho, sombra forte ou efeito neon.
- **Tons pastel** que não cansam a vista, em duas famílias:
  - **Tons quentes = classe trabalhadora**, do adulto do meio até o **dono de cartório** (inclusive): 13 cores de vermelho, rosa, coral, laranja, amarelo, mostarda, pêssego, vinho e tijolo.
  - **Azuis = os mais ricos**, do investidor rico a Eduardo Saverin: 12 azuis (celeste, royal, ciano, índigo, pervinca, marinho...).
- **Uma cor para cada pessoa/grupo**, não por categoria: em gráficos com muitas cores, as cores de vizinhos na escala de riqueza alternam entre claro e escuro e entre tons, para a separação ser fácil de ver. O teste `src/viz/colors.test.ts` exige distância mínima entre vizinhos e não aceita uma entrada nova sem cor.
- **Vermelho forte = o adulto do meio** (`#D9505C`). **Barras "metade mais pobre / mais rica" e "99% / 1%"** continuam em vermelho pastel contra azul (azul-marinho no 1%); **"teriam mais"** = vermelho, **"teriam menos"** = azul-marinho.
- Nas duas primeiras abas (Pixel a pixel e Círculos) a classe trabalhadora tem mais presença (traço mais grosso, mais preenchimento, quadradinhos mais fortes) e a frase de apoio diz: "Tons quentes: classe trabalhadora. Azuis: mais ricos."
- **Texto nunca em cor pastel** sobre fundo claro (contraste fraco): use o texto escuro. As cores pastel são só preenchimentos e traços.
- Um destaque grande por tela (o número principal), o resto em cartões ou barras. Legenda **junto** do gráfico; os números servem de legenda (com o quadradinho de cor).
- Nenhum texto abaixo de 12 px no HTML; rótulos de canvas de 11 px ou mais.
- As cores ficam em **`src/viz/colors.ts`** (por pessoa/grupo, para o canvas e a legenda) e nas variáveis CSS de `src/styles.css` (:root: neutros, vermelho e azul de apoio). Ao incluir uma pessoa/grupo novo nos dados, dê uma cor em `WORKING_COLORS` (até R$ 3,28 mi) ou `RICH_COLORS` (acima).
