# Teste no Chrome real — Janelas como página (1.12.288)

Abre o `professor.html` verdadeiro do pacote dentro de um iframe (como a casca do aplicativo faz), em tela de toque
(390×844 a 2×), abre as 38 janelas (`.dialog`) e confere, com **toque de verdade** (`Input.dispatchTouchEvent` do DevTools,
não rolagem por script), que 33 delas ocupam a tela inteira como uma página, que as 5 restantes não mudaram e que a página
de trás não se mexe com o dedo. Não usa Firebase, não usa a casca do aplicativo e **não substitui o teste no celular** (nem
no iPhone/Safari).

## O pedido e a solução
Pedido do Tiago (19/11, vídeo): a janela parecia estar "por cima de outra página"; ao arrastar o dedo, a página de trás também
se mexia. O 1.12.287 resolveu isso só no Catálogo de exercícios; o 1.12.288 estende a apresentação como página às demais
janelas e já inclui o 287 (o 288 é o único pacote a subir).

O pacote muda só o `professor.html`, e só CSS: um bloco `<style id="dialog-scroll-lock-pages">` logo antes de
`<style id="previous-page-navigation">`, no lugar do bloco do 287 (`dialog-scroll-lock-catalog-page`):

1. `@media(hover:none),(pointer:coarse){body.dialog-open{overflow:hidden}}` — trava o corpo, só em tela de toque.
2. `.dialog,.dialog>.sheet{overscroll-behavior:contain}` — o gesto não passa do cartão para a página (as 38 janelas, qualquer
   ponteiro; não muda o desenho).
3. Só em tela de toque, nas 33 janelas de página (`P` = `:is(#waitlistEditor,#colorPanelDialog,…)`):
   `P.dialog.open{padding:0 env(safe-area-inset-right) 0 env(safe-area-inset-left)!important}` — o espaço lateral do recorte da
   tela (tela deitada com entalhe) fica no contêiner, não no cartão.
4. `P.dialog.open>.sheet{width:100%;max-width:none;height:100%;max-height:none;border-width:0;border-radius:0;box-shadow:none;
   padding-top:calc(18px + env(safe-area-inset-top));padding-bottom:calc(92px + env(safe-area-inset-bottom))}` — tudo com
   `!important`: já existem regras `!important` mais específicas no arquivo (`.trainer-crop-sheet{max-width:480px!important}`,
   `#colorPanelDialog>.color-panel-sheet{…max-height…!important}`, `.dialog-open .dialog>.sheet{max-height:…!important}`, a tela
   larga do painel de cores e as regras do Performance Pro); as de `id` vencem por especificidade.
5. Só no Performance Pro (sem barra Voltar/Painel): `padding-bottom:calc(22px + env(safe-area-inset-bottom))`.

`touch-action` **não** é usado de propósito: no WebKit o valor `none` se propaga pelos elementos roláveis e poderia travar a
rolagem do cartão no iPhone, onde este teste não consegue verificar.

**Mouse.** Nada disso vale em computador com mouse: as janelas continuam como cartão. Diferença em relação ao 1.12.287: lá o
Catálogo virava página também com mouse; no 288 tudo fica no toque, então no mouse o 288 é igual ao 286 (versão em uso).

### Quais janelas viraram página (33) e quais ficam (5)
Viraram página: `waitlistEditor`, `colorPanelDialog`, `trainerPhotoCropDialog`, `trainerProfileDialog`, `lessonDialog`,
`studentLessonsDialog`, `studentProfileDialog`, `workoutPdfImportDialog`, `workoutPlanDialog`, `workoutDayEditDialog`,
`workoutTechniquesDialog`, `workoutTechniqueDetailDialog`, `workoutTechniqueEditorDialog`, `workoutExerciseDialog`,
`workoutCatalogDialog`, `workoutAudienceDialog`, `workoutExecutionDialog`, `workoutHistoryDialog`, `workoutFeedbackDialog`,
`studentPhotoDialog`, `studentLocationDialog`, `studentPhoneDialog`, `studentTypeDialog`, `studentDialog`, `rescheduleDialog`,
`workoutBisetPartnerDialog`, `workoutBisetEditorDialog`, `registrationLinkDialog`, `studentAreaDialog`,
`studentAreaConnectionDialog`, `financeReceiptDialog`, `financeReceiptViewDialog`, `studentEvolutionDialog` (esta última é criada
por script).

Ficam como estavam (regra do projeto: não mexer em descanso, cronômetros, alarmes nem notificações sem pedido específico):
`workoutStudentDialog` (Ficha de treino: já era uma página), `workoutDayDialog` (Exercícios: o treino em andamento),
`workoutRestDialog` (Intervalo), `workoutBisetDialog` (Execução do bi-set), `workoutVideoDialog` (Vídeo do exercício: tamanho
calculado pelo aplicativo). Elas só ganham o item 1 e o 2, ou seja, a página de trás parada.

A lista vem do gerador (`tools/gerar-janelas-pagina-1.12.288.cjs`, `PAGE_WINDOWS` e `KEPT_WINDOWS`) e é lida por `classes.js`;
o teste automático (`equipe/testes/janelas-pagina.smoke.cjs`) confere as duas listas contra as 38 janelas do arquivo.

Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 e `google-chrome` no PATH (ou `CHROME=/caminho`).
Pillow só para `folha.py`.

## Como rodar
1. Monte as pastas e tire o `professor.html` dos três pacotes (286 em uso, 287 e 288):
   ```
   mkdir -p www saida
   cp dialogo.html dialogo-pai.html www/
   for v in 286 287 288; do node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));fs.writeFileSync('www/prof-'+process.argv[2]+'.html',p.files['professor.html'])" <pacote-$v.agenda.json> $v; done
   ```
   O pacote 287 se regenera do 286 com `tools/gerar-catalogo-pagina-1.12.287.cjs`, e o 288 do 287 com
   `tools/gerar-janelas-pagina-1.12.288.cjs`.
2. Suba o servidor: `python3 servidor.py www saida 8787 &`. Outra porta: `PORTA=8788` nos comandos abaixo e como terceiro
   argumento do servidor. As capturas vão para `./saida` (ou `SAIDA=/caminho`).
3. **Vazamento de rolagem** (`matriz.js`): `node matriz.js <pagina> <css|-> '*' [LxA] [tema] [modo]` — 6 gestos de verdade por
   janela (fundo, título, meio, topo e fim do cartão); confere que o `scrollY` da página **não muda** e que o cartão **continua
   rolando**. Fecha com `TOTAL vazou X/N`. Leva uns 6 minutos. `[PULOU]` na coluna "abrir" (400→354) é comportamento antigo,
   igual no 286: ao abrir uma janela a barra de baixo some e a página reacomoda a posição.
   ```
   node matriz.js prof-288.html - '*' 390x844 current dark        # esperado: vazou 0/255
   node matriz.js prof-288.html - '*' 390x844 pro light           # esperado: vazou 0/255
   ```
4. **Geometria** (`geometria.js`): `node geometria.js <pagina> - [LxA] [tema] [modo]`. As 33 de página: topo 0, esquerda 0,
   direita = largura, base = altura, sem raio, borda nem sombra, e × no lugar; as 5 mantidas iguais ao 286.
   `SHOT=prefixo` grava uma imagem por janela.
5. **Tela deitada com entalhe** (`paisagem.js`): `JANELAS=<ids> node paisagem.js <pagina> - 844x390 47,47,0,21 [tema] [modo]`.
   Confere que o conteúdo não entra na faixa do recorte (zona segura 47..797). Padrão: 9 janelas; todas as 33 com
   `JANELAS=$(node -e "console.log(require('./classes.js').paginas.join(','))")`.
6. **Paridade** (`paridade.js`): `node paridade.js <antes> <depois> [LxA]`; `TOQUE=0` simula computador com mouse;
   `IGNORAR='^overscroll-behavior'` conta à parte a contenção da rolagem. Compara o estilo computado e a geometria de janela,
   cartão, título, ×, primeiro campo, barra, topo e `main`, nos 5 temas × claro/escuro.
   ```
   node paridade.js prof-287.html prof-288.html 390x844                        # toque: só o permitido nas 32 de página
   TOQUE=0 IGNORAR='^overscroll-behavior' node paridade.js prof-286.html prof-288.html 390x844    # mouse: nenhuma diferença
   TOQUE=0 IGNORAR='^overscroll-behavior' node paridade.js prof-286.html prof-288.html 1280x800
   IGNORAR='^overscroll-behavior' node paridade.js prof-286.html prof-288.html 390x844            # toque: as 5 mantidas sem diferença
   ```
7. **Conteúdo longo** (`estresse.js`): `node estresse.js <pagina> [tema] [modo] [LxA]`. Em cada janela de página acrescenta
   2600 px de conteúdo e um último item, arrasta com o dedo, pula para o fim e confere: folga entre o último item e a barra
   Voltar/Painel (29 px; 22 px no Performance Pro, que não tem barra), último item tocável, arrasto além do fim e do começo
   sem mexer a página de trás, corpo continua travado e nenhuma rolagem lateral.
8. **Cenários extras** (`extras.js`): `node extras.js <pagina> [tema] [modo]`. Abrir e fechar destrava e devolve a página ao
   ponto de antes; página sobre página; Finalizar treino (página) por cima de Exercícios (mantida); Vídeo (mantido, em cartão)
   por cima do Catálogo (página); aviso (toast) visível por cima da janela de página; painel de cores e Catálogo rolam por
   dentro; toque no campo, no × e no Voltar da barra.
9. **Capturas** (`realista.js` + `semente.js`): `SO=<ids> FIM=0 node realista.js <pagina> - <prefixo> [LxA] [tema] [modo]` abre
   as janelas com dados de exemplo (alunos, aulas, ficha de treino inventados) e grava `saida/r/<prefixo>-<tema>-<modo>-<id>.png`.
   `python3 folha.py saida.png <colunas> <largura> arquivo[:rótulo] ...` monta a folha de comparação.

`dialogo.html` simula só o que a janela de cadastro por link precisa do Firebase (`onAuthStateChanged`); "Alunos para aprovar"
e "Lista de alunos" consultam o Firestore e, neste cenário, mostram a mensagem de erro de conexão: não é defeito do pacote.

## Resultados registrados (Chrome 153 headless emulando tela de toque, 19/11/2026)
- **Vazamento, 38 janelas, 390×844:** 1.12.288: **0 de 255 gestos vazam** no Atual/escuro e **0 de 255** no Performance
  Pro/claro; o cartão continua rolando onde tem rolagem. O 1.12.286, com este mesmo script: 288 de 330 gestos vazavam, nas 38
  janelas.
- **Geometria:** 40 combinações (5 temas × claro/escuro em 390×844; e os 5 temas, escuro, em 320×568, 360×640, 412×915,
  600×960, 844×390 e 1024×768): **0 falhas** nas 38 janelas (33 de página, 5 mantidas).
- **Tela deitada com entalhe (47 px de cada lado):** as 33 janelas de página com o conteúdo dentro da zona segura, no
  Atual/escuro e no Performance Pro/claro.
- **Paridade, 287→288, toque:** Catálogo e as 5 mantidas sem nenhuma diferença; as outras 32 de página só mudam tamanho, borda,
  canto, sombra e espaço do cartão; **0 diferenças de cor/fundo/fonte**. **286→288, mouse (390 e 1280):** 0 diferenças nas 38
  janelas (fora a contenção da rolagem, contada à parte). **286→288, toque:** as 5 mantidas sem diferença; as 33 de página só
  com o permitido; 0 diferenças de cor.
- **Conteúdo longo:** 33/33 no Atual/escuro (folga 29 px), 33/33 no Performance Pro/claro (22 px) e 33/33 no Roxo Neon/claro em
  360×640 (29 px).
- **Extras:** 19/19 no Atual/escuro, no Performance Pro/claro e no Metal 3D/escuro.
- **Teste automático do pacote** (`equipe/testes/janelas-pagina.smoke.cjs`): 85 verificações (25 de conferência e 60 sabotagens
  do CSS que o teste precisa pegar), 0 falhas. **Teste oficial do Android** (`tests/verify_registration_link.cjs`) com os
  arquivos do 288: passou.

## Limites
Não é celular. Chrome (Blink) com toque simulado, não o WebView do Android real nem o Safari do iPhone, e sem teclado na tela.
Em tablet com toque as janelas também viram página inteira. As janelas nativas (`<dialog>`: Nova despesa, Feedback do
professor, Sincronização, backup e recuperação, espaço usado, relógio, compartilhar imagem) e as janelas do `index.html` e do
`avaliacoes.html` não foram tocadas. "Exercícios" (treino em andamento) continua com cara de janela, por regra do projeto. O
Painel de cores deixa de mostrar a página de trás enquanto está aberto. Em tela deitada com entalhe sobram faixas escuras nas
laterais.
