# Calibração no celular

Os números de "sensação" (quanto esforço dá chegar às grandes fortunas, quanto o conteúdo desliza, quão macio é o zoom) foram palpites feitos sem celular em mãos. Este roteiro serve para trocá-los por valores testados em aparelho real.

## Como abrir no celular

1. Celular e computador na **mesma rede Wi-Fi**.
2. No computador: `npm run dev` (já mostra os endereços "Network").
3. No celular, abra `http://<IP-do-computador>:5173/?calibrar` (ex.: `http://192.168.18.138:5173/?calibrar`). O `?calibrar` liga o painel.
4. Se não abrir: o Firewall do Windows pode estar bloqueando a porta 5173 (libere a rede privada para o Node.js) ou o celular está em outra sub-rede (dados móveis, rede de visitantes, VPN).

O botão **⚙** (canto inferior direito) abre o painel. Feche o painel para testar; os valores valem na hora (sem recarregar) e **ficam salvos no aparelho**. Sem `?calibrar` o app usa os padrões do código e nunca lê o que foi salvo.

## O que cada controle faz

| Controle | Afeta | Mira |
|---|---|---|
| Pinça | Sobrepostos, Desfile, Pilhas, Anos | pinças até o fim do percurso (o painel estima) |
| Toque em + / − | idem | toques até o fim |
| Segurar + / − | idem | segundos segurando até o fim |
| Suavidade do zoom | idem | macio sem parecer atrasado |
| Suavidade ao arrastar/rolar | Pixel a pixel, Desfile, Pilhas, Anos | idem |
| Deslize ao soltar o dedo | Pixel a pixel, Desfile, Pilhas, Anos | quanto o conteúdo continua andando |
| Roda do mouse / Teclas | só desktop | cliques de roda e repetições até o fim |

O percurso de referência é de ~9,6 unidades de zoom nos Sobrepostos (as estimativas do painel usam isso); o Desfile, as Pilhas e os Anos têm percursos maiores (~14 a ~16), então pedem proporcionalmente mais gestos com os mesmos valores.

## Roteiro de teste (10 a 15 minutos)

Anote o que sentiu em cada passo; "cansativo de propósito" é meta (ADR-012), "cansativo demais" não.

1. **Sobrepostos:** só com a pinça, quantas pinças até o círculo de Saverin caber? Aceitável: algumas dezenas. Muito mais que ~60: está difícil demais.
2. **Sobrepostos:** segure "−". Quanto tempo até o fim? Entre 20 e 40 s parece o intervalo "cansativo mas possível".
3. **Desfile:** arraste de lado e solte: o deslize parece natural, longo demais ou curto demais? Pare no meio do deslize com o dedo: ele para na hora?
4. **Pixel a pixel (marcha 1×):** arraste e solte. O deslize é previsível? Teste as marchas 10×, 100×, 1 mil×, 10 mil×: alguma é inútil ou rápida demais?
5. **Pilhas de notas:** aproxime ao máximo (as notas uma a uma aparecem?). Afaste até a pilha de Saverin (179 km).
6. **Distribuição e 1% mais rico:** na Distribuição, as bolinhas (apertadas à esquerda, espaçadas à direita) e o valor total ficam claros? E o cenário ideal (parede azul, varas e os cartões "teriam mais / menos")? No 1% mais rico, as duas barras (pessoas e dinheiro) ficam claras? No fim da aba, o gráfico vertical é legível (varas de 25/50/75% e a barra do 1%) e o contador de telas aparece e some no lugar certo? Rolar ~15 a 17 telas é cansativo demais ou na medida?
7. **FPS** (mostrado no painel): fica perto de 60 durante o zoom e o deslize, principalmente em **Em anos de salário** afastando ao máximo (antes travava, ADR-028)? Anote o modelo do celular.
8. **Toque:** os alvos (botões, itens da legenda, marcos) são fáceis de acertar com o polegar? Algum fica sob o polegar quando a folha de detalhe abre?
9. **Rotação:** gire o celular em cada visualização e veja se nada quebra.

## Devolvendo os valores

Em "Copiar valores", o painel copia (ou mostra, se o navegador bloquear a área de transferência em HTTP) um texto assim:

```
Calibração (12/10/2026, <navegador>, tela 390×844, dpr 3)
{ "wheelGain": 0.0006, "keyStep": 0.015, ... }
```

Cole esse texto na conversa, junto com as anotações do roteiro. Os valores viram os `DEFAULTS` em `src/viz/tuning.ts` (um único lugar) e o ADR-012 é atualizado com a data e o aparelho.

## Observação sobre o ambiente de teste

O celular carrega as visualizações do servidor de desenvolvimento (Vite), então o desempenho pode ser um pouco pior que o do build final (`npm run build` + `npm run preview`). Se o FPS estiver baixo, repita o teste com `npm run preview -- --host`.
