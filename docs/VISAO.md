# Visão

## Propósito

Números como "R$ 162,9 bilhões" e "R$ 22,5 mil" são ambos só dígitos na tela; o cérebro não sente a razão de **7 milhões de vezes** entre eles. A aplicação transforma essa razão em experiência física (rolar, comparar tamanhos, contar pessoas) para que a escala fique intuitiva.

## Referência

[1 Pixel Wealth](https://flpms.github.io/1-pixel-wealth/): cada pixel representa uma unidade de dinheiro e o usuário rola a página por distâncias enormes até chegar ao patrimônio de grandes fortunas. A força está na **vivência do tempo e do esforço de rolagem**. Este projeto mantém essa ideia como uma das visualizações, e acrescenta outras que respondem perguntas diferentes (ver [VISUALIZACOES.md](VISUALIZACOES.md)).

## Público

- Pessoas comuns no celular (uso principal: abrir link compartilhado, explorar por 1 a 3 minutos).
- Educadores e jornalistas que queiram um recurso visual citável (por isso cada número carrega fonte, ano e ressalva).

## Princípios

1. **Honestidade antes de impacto.** Cada número mostra fonte, ano de referência e confiança. Divergências entre fontes (ex.: R$ 409 mil vs R$ 326,9 mil) aparecem como ressalva, não são escondidas.
2. **Patrimônio não é renda.** Só patrimônio entra nas escalas comparadas. Salários e renda ficam em contexto separado ([DADOS.md](DADOS.md#patrimônio-vs-renda)).
3. **Não misturar unidades.** Pessoa, família, adulto, conta e grupo têm comparabilidade diferente. A interface sinaliza quando a comparação cruza unidades.
4. **Sem compressão de escala.** O objetivo é mostrar a diferença real de tamanho, então não há escala logarítmica nem qualquer outra que esconda a razão entre os valores. Quando o tamanho real não cabe na tela, a resposta é zoom e rolagem, não compressão. Qualquer exceção futura precisa ser rotulada na tela e registrada em [DECISOES.md](DECISOES.md).
5. **Mobile primeiro.** Toque, rolagem com o polegar, tela vertical, conexão ruim. Desktop é adaptação, não o contrário.
6. **Estático e leve.** Sem backend, sem conta, sem rastreamento. Funciona offline depois do primeiro carregamento (fase futura).
7. **Tom neutro.** Mostra a distribuição, não faz juízo moral nem recomendação política. O impacto vem dos números.

## O que não é

- Não é calculadora de patrimônio pessoal nem armazena dados do usuário (o recurso "onde eu me encaixo" calcula tudo no aparelho, sem enviar nada).
- Não é fonte primária: reproduz o que o `patrimonio-brasil-2026.md` compilou, que por sua vez cita Forbes, UBS, Receita Federal, B3/CVM etc.
- Não estima patrimônio de grupos sem dado confiável (classes A a D, MEI, pequenos e médios empresários). Essas lacunas são tratadas explicitamente ([DADOS.md](DADOS.md#lacunas-conhecidas)).

## Perguntas de produto em aberto

Ver [ROADMAP.md](ROADMAP.md#perguntas-em-aberto).
