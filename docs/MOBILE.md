# Mobile

Uso principal: celular em retrato, toque, conexão variável. Esta página é o checklist para qualquer tela nova.

Para ajustar o esforço do zoom e o deslize num aparelho real, veja [CALIBRACAO.md](CALIBRACAO.md).

## Alvos de teste

| Perfil | Viewport | Observação |
|---|---|---|
| Android de entrada | 360×640 | pior caso de CPU e largura |
| iPhone padrão | 390×844 | notch / safe-area, Safari |
| iPhone SE | 375×667 | altura curta, barra do Safari consome espaço |
| Tablet / desktop | ≥ 720 px | layout centralizado, painel de detalhe lateral |

Testar com `npm run dev` + celular na mesma rede, e no emulador do DevTools com **throttling de CPU 4×**.

## Já feito na fundação

- `<meta viewport>` com `viewport-fit=cover`; `safe-area-inset-*` no cabeçalho e no painel inferior.
- Abas rolam na horizontal (sem quebra de linha), alvos ≥ 44 px, scrollbar oculta.
- Painel de detalhe como **bottom sheet** no celular (≤ 50% da altura) e cartão flutuante no desktop (≥ 720 px).
- `touch-action: manipulation` no SVG (remove atraso de toque e zoom por duplo toque sem bloquear a rolagem).
- Alvo de toque mínimo (círculo transparente de raio 22 px) mesmo para marcas de 1 px.
- `prefers-reduced-motion` respeitado; `-webkit-text-size-adjust` fixo; `tap-highlight` desativado.
- Tema escuro por padrão (`color-scheme: dark`): economiza bateria em OLED e favorece a leitura de marcas coloridas.

## Regras para visualizações

1. **Nada depende de hover.** Tudo que aparece no hover aparece no toque (painel de detalhe).
2. **Altura:** usar `100dvh` (não `100vh`) para telas cheias; a barra de endereço do mobile muda `vh`.
3. **Canvas nítido:** dimensionar por `devicePixelRatio` (limitar a 2 ou 3 para não estourar memória) e redimensionar via `ResizeObserver`.
4. **Gestos:** usar `pointer events`. Áreas com pinça sobre conteúdo rolável usam `touch-action: pan-y` para manter a rolagem vertical nativa quando a viz trata a pinça; nos palcos de zoom (Sobrepostos, Desfile, Pilhas, Anos) o canvas usa `touch-action: none`. Se a viz captura o arraste vertical (pixel-scroll), declarar `touch-action: none` **só nela** e oferecer saída clara (botão de menu fixo), para o usuário não ficar preso.
5. **Palco com gestos próprios** (Sobrepostos): `touch-action: none` só no canvas; a altura é `100dvh − 190 px` e o palco **não pode mudar de tamanho** durante o uso (legenda de altura fixa), senão o canvas é recriado e a tela pisca. Alternativas à pinça: botões +/− (segurar = contínuo) e teclado.
6. **Rolagem longa:** nunca criar elementos com altura > `MAX_SAFE_SCROLL_PX` (`lib/scale.ts`); usar rolagem virtual.
7. **Desenhar só o visível:** em Canvas, recortar por janela; em SVG, não passar de algumas centenas de nós.
8. **Texto legível:** mínimo 12 px em rótulos, 16 px em corpo; contraste ≥ 4,5:1.
9. **Orientação:** retrato é primário; paisagem deve ao menos não quebrar.
10. **Haptics opcionais** (`navigator.vibrate`) ao cruzar marcos no pixel-scroll, desligável e ausente no iOS Safari; não depender.

## Orçamento de desempenho

| Métrica | Meta |
|---|---|
| JS inicial (gzip) | ≤ 100 KB (hoje ≈ 5 KB) |
| Dados | ≤ 30 KB (hoje ≈ 4 KB) |
| Dependências de runtime | zero ou justificada em [DECISOES.md](DECISOES.md) |
| LCP em 4G lento | < 2,5 s |
| Quadros | ≥ 50 fps em Android de entrada durante interação |
| Memória do canvas | ≤ ~50 MB (cuidado com DPR 3 em tela cheia) |

## Compartilhamento

O caso de uso típico é abrir um link recebido. Por isso: rota por hash (`#sobrepostos`) já funciona; **fase futura:** estado na URL (`#pixel-scroll?sm=252`), imagem Open Graph, `navigator.share` e captura da viz como imagem.

## PWA / offline (fase futura)

`manifest.webmanifest` já existe (nome, cores, `display: standalone`). Faltam ícones e um service worker simples (cache do build). Decisão adiada para não adicionar complexidade antes das visualizações.

## Acessibilidade

- Elementos selecionáveis têm `role="button"`, `tabindex` e `aria-label` com valor formatado; Enter/Espaço selecionam.
- A viz é um desenho; a **alternativa textual** é a tabela de entidades (planejada: link "ver como lista" em cada viz).
- Não usar apenas cor para diferenciar grupos (planejado: rótulos/legenda).
- Idioma `pt-BR` no `<html>`; números formatados com `Intl` pt-BR.
