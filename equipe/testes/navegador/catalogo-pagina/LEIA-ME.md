# Teste no Chrome real — Catálogo como página e página de trás parada (1.12.287)

Abre o `professor.html` verdadeiro do pacote dentro de um iframe (como a casca do aplicativo faz), em tela de toque
(390×844 a 2×), e usa **toque de verdade** (`Input.dispatchTouchEvent` do DevTools, não rolagem por script) para medir se a
**página de trás** se mexe quando o dedo arrasta numa janela aberta: no fundo, no título, no meio do cartão e nos limites da
rolagem do cartão (topo e fim). Não usa Firebase, não usa a casca do aplicativo e **não substitui o teste no celular**
(nem no iPhone/Safari).

## O defeito do 1.12.286 e a correção do 1.12.287
Pedido do Tiago (19/11, vídeo do Catálogo de exercícios): a janela parecia estar "por cima de outra página", e arrastar o dedo
mexia a página de trás. Causa: as 38 janelas (`.dialog`) compartilham o mesmo componente e **nenhuma** contém a rolagem; um
gesto no fundo, no título ou no limite do cartão passa para o documento de trás (encadeamento de rolagem). No Catálogo isso
aparecia mais, porque ele abria como cartão de cantos arredondados, com uma faixa da página de trás visível no topo.

O 1.12.287 acrescenta cinco regras de CSS no `professor.html`, num bloco `<style id="dialog-scroll-lock-catalog-page">`
logo antes de `<style id="previous-page-navigation">`:

1. `@media(hover:none),(pointer:coarse){body.dialog-open{overflow:hidden}}` — trava o corpo só em tela de toque;
2. `.dialog,.dialog>.sheet{overscroll-behavior:contain}` — o gesto não passa do cartão para a página (as 38 janelas);
3. `#workoutCatalogDialog.dialog.open{padding:0!important}`;
4. `#workoutCatalogDialog.dialog.open>.sheet{width:100%;height:100%!important;max-height:none!important;border-width:0;border-radius:0;box-shadow:none;padding-top:calc(18px + env(safe-area-inset-top));padding-bottom:calc(92px + env(safe-area-inset-bottom))}` — o Catálogo ocupa a tela inteira, como página;
5. só no Performance Pro (sem barra Voltar/Painel): `padding-bottom:calc(22px + env(safe-area-inset-bottom))`.

`touch-action` **não** é usado de propósito: no WebKit o valor `none` se propaga pelos elementos roláveis e poderia travar a
rolagem do cartão no iPhone, onde este teste não consegue verificar.

Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 e `google-chrome` no PATH (ou `CHROME=/caminho`).
Pillow só para `compor.py`.

## Como rodar
1. Monte as pastas e tire o `professor.html` dos dois pacotes (o 1.12.286 e o 1.12.287):
   ```
   mkdir -p www saida
   cp dialogo.html dialogo-pai.html www/
   for v in 286 287; do node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));fs.writeFileSync('www/prof-'+process.argv[2]+'.html',p.files['professor.html'])" <pacote-$v.agenda.json> $v; done
   ```
2. Suba o servidor: `python3 servidor.py www saida 8787 &`. Outra porta: `PORTA=8788` nos comandos abaixo e como terceiro
   argumento do servidor. As capturas vão para `./saida` (ou `SAIDA=/caminho`).
3. **Vazamento de rolagem** (`matriz.js`): `node matriz.js <pagina> <css|-> <lista> [LxA] [tema] [modo]`.
   - `lista`: ids separados por vírgula; `catalogo` abre pelo `openWorkoutCatalog()`; `*` = as 38 janelas.
   - `tema`: `current|neon|metal|pro|deep`; `modo`: `dark|light`.
   - Para cada janela faz gestos de verdade (fundo, título, meio, limite do topo, limite do fim) e confere que o `scrollY` da
     página **não muda** e que o cartão **continua rolando**. Fecha com `TOTAL vazou X/N; cartão-não-rolou Y`.
   - `[PULOU]` na coluna "abrir" (por exemplo 400→354) é comportamento antigo, igual no 1.12.286: ao abrir uma janela a
     barra de baixo some e a página reacomoda a posição. Não é do bloco novo.
   ```
   node matriz.js prof-287.html - '*' 390x844 current dark       # esperado: vazou 0/N
   node matriz.js prof-286.html - '*' 390x844 current dark       # contraste: vaza em todas as janelas
   HOST=dialogo-pai.html node matriz.js prof-287.html - catalogo # app dentro de outra página rolável (como no iPhone)
   ./rodar-temas.sh dark prof-287.html; ./rodar-temas.sh light prof-287.html   # 5 temas × 5 janelas
   ```
4. **Catálogo como página** (`pagina.js`): `node pagina.js <pagina> - <prefixo> [LxA]` (`ONLY=current,pro` limita os temas).
   Em cada tema e modo confere topo 0, esquerda 0, direita = largura, base = altura, sem raio, borda nem sombra, botão × na
   mesma posição, e que o fim da lista fica acima da barra Voltar/Painel (folga de 29 px; 22 px no Performance Pro, que não
   tem a barra). Grava `saida/pg/<prefixo>-<tema>-<modo>-topo.png` e `-fim.png`.
5. **Paridade** (`paridade.js`): `node paridade.js prof-286.html prof-287.html`. Abre as 38 janelas nas duas páginas e compara o
   estilo computado e a geometria de janela, cartão, título, ×, primeiro campo, barra, topo e `main`, nos 5 temas × claro/escuro
   (10 casos). Esperado: 37 janelas com **uma única** diferença (`overscroll-behavior`); o Catálogo só com as propriedades da
   apresentação como página; "Diferenças fora do Catálogo que não são overscroll-behavior: nenhuma".
6. **Cenários extras** (`extras.js`): `node extras.js prof-287.html`. Trava no Catálogo aberto; destrava ao fechar e a página volta
   a rolar; Catálogo empilhado sobre outra janela (fica por cima, página inteira, fundo parado, cartão rola); fechar só o
   Catálogo mantém a outra janela e a trava; fechar tudo devolve a posição de antes; painel de cores (rolagem interna num
   filho) rola sem mexer o fundo; toque em Favoritos e no campo de busca continua respondendo. No 1.12.286 os de trava falham.
7. **Antes e depois** (`capturas.js`): `node capturas.js` (precisa de `prof-286.html` e `prof-287.html` em `www/`). Abre o Catálogo
   a partir do Mais, arrasta o dedo no título (como no vídeo) e mostra o `scrollY` da página de trás antes e depois. `python3
   compor.py` monta as duas imagens de evidência (precisa também de `pagina.js ... final` para a folha dos 5 temas).
8. `inventario.js` lista as janelas (id, classes, cartão, rolagem, raio) e confirma que não há toque no fundo para fechar.

## Resultados registrados (Chrome 153 headless emulando tela de toque, 19/11/2026)
Resumo desta execução (pacotes 1.12.286 e 1.12.287, geradas as páginas como no passo 1):
- **38 janelas, tema Atual, escuro, 390×844:** 1.12.287: **0 de 327 gestos vazam** (0 das 38 janelas) e o cartão continua rolando onde tem rolagem; 1.12.286: **288 de 330 gestos vazam, nas 38 janelas** (o teste enxerga o defeito).
- **5 temas × claro/escuro** (Catálogo, descanso, aula, vídeo, painel de cores): 0 vazamentos nas 10 combinações (406 gestos).
- **Geometria:** topo 0, esquerda 0, direita e base iguais à tela, sem raio, borda ou sombra, nos 5 temas, claro e escuro, em
  390×844; e no Atual e no Pro em 320×568, 360×640, 412×915 e 844×390 (paisagem).
- **Paridade:** 37 janelas só ganham `overscroll-behavior`; o Catálogo muda 49 propriedades, todas da apresentação como página;
  barra, topo e `main` idênticos.
- **Extras:** 10/10 no 1.12.287; no 1.12.286 falham as quatro de trava (1a, 2a, 2b, 2c).

## Limites
Não é celular. Chrome (Blink) com toque simulado, não o WebView do Android real nem o Safari do iPhone. O Safari só entende
`overscroll-behavior` a partir do iOS 16, e o efeito da trava do corpo (`overflow:hidden`) no iPhone também não foi
verificado aqui: no iPhone pode haver diferença. Não cobre teclado aberto sobre a janela, nem tela larga com mouse (a trava
vale só para `hover:none` ou `pointer:coarse`). O Catálogo vira página inteira também no modo de escolha de exercício (aberto a partir do treino).
O ruído de rede do Chrome no sandbox (update.googleapis.com e similares) é inofensivo.
