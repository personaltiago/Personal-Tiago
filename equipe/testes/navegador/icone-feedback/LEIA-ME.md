# Teste no Chrome real — Ícone do feedback personalizável (1.12.294)

Abre a página do aluno verdadeira do pacote 1.12.294 (o `index.html` de dentro do `.agenda.json`) no Chrome, em tela de toque, e confere
com **toque e teclado de verdade** (`Input.dispatchTouchEvent` e `Input.dispatchKeyEvent` do DevTools) a linha nova **"Ícone do feedback"**
em **Meu perfil**, o painel com as 19 opções e o botão do topo da tela inicial, que passa a mostrar o ícone escolhido. Também confere que
a tela do professor (`professor.html`, que recebe o mesmo estilo por regra do aplicativo) não muda. Usa o mesmo executor do teste das
janelas como página (`../janelas-pagina`: `cdp.js`, `semente.js`, `servidor.py`, `dialogo.html`) e a biblioteca do teste do sino
(`../sininho-feedback`). Não usa Firebase, não usa a casca do aplicativo e **não substitui o teste no celular** (nem no iPhone/Safari).

## O pedido, e o que mudou do 293 para o 294
Tiago (19/11, 20:22, ditado, com dois prints): depois de ver o botão do feedback no topo ("ficou muito bom"), quer que o aluno possa
**personalizar esse ícone**: o ícone que o Claude fez (o balão do 292) continua sendo o **padrão**, todo mundo começa com ele, e a
pessoa pode **escolher entre todos os outros** (print 2, uma grade de 18 ícones). A leitura adotada: 19 opções (o padrão + os 18), escolha
**do próprio aluno**, em **Meu perfil**, guardada **neste aparelho**, por conta. Uma escolha do professor para todos os alunos exigiria
gravar no Firebase (regra do projeto: só com autorização) e **não foi feita**.

**O 293 estava errado e foi descartado (Tiago, 22:12, ditado):** os prints eram ilustrações roxas, "só ilustrativas", e o 293 as usou
como arte final (imagens WebP fixas, inclusive no padrão). O botão ficava roxo e maior que o sino e o WhatsApp mesmo com o app em rosa.
O pedido certo: **os ícones acompanham a cor do aplicativo que a pessoa escolheu** e **têm o tamanho dos ícones vizinhos**. No 294:
- o **padrão é o balão do 292, o mesmo caminho SVG, sem mudar um ponto**; quem não escolhe nada vê exatamente o do 292;
- os outros 18 são **desenhos novos, vetoriais, de uma cor só** (`tools/icones-feedback-294/desenhar.py` gera `icones.json`);
- todos usam `currentColor`: a cor de destaque do aluno, a mesma do sino e do WhatsApp, em qualquer tema, no escuro e no claro;
- todos têm o tamanho do balão do 292 no topo (SVG de 27 px no botão de 44×44, que o estilo do 292 já define) e a mesma massa visual.

Na mesma hora do pedido (20:23) ele pediu que as atualizações que já estão no GitHub **não se percam** quando este pacote for instalado,
para não ter de reinstalar o aplicativo. O pacote é completo e cumulativo, e isso é conferido com o código Java real do aplicativo.

## O que o pacote muda
Só dois arquivos, três blocos, e cada bloco é trocado inteiro:
| Arquivo | Bloco | O que muda |
|---|---|---|
| `index.html` | `ap-feedback-student` (script) | a lista dos 19 caminhos SVG, leitura e gravação da escolha, troca do desenho do botão do topo, linha e painel em Meu perfil |
| `index.html` | `ap-feedback-css` (estilo) | 18 regras novas no fim (linha, painel, grade, anel e marca de visto); **nenhuma toca o botão do topo** |
| `professor.html` | `ap-feedback-css` (estilo) | **as mesmas 18 regras**, sem nenhum efeito (componente compartilhado, como no 292) |

`avaliacoes.html`, `cadastro.html`, dados, Firebase, o aviso do pet, a janela "Como foi hoje?", descanso, cronômetros, alarmes e
notificações da tela bloqueada **não são tocados**. Versão 1.12.294, sequência 400 (292 = 398, mais 2, porque o 293 foi descartado).

## O que a aluna vê e faz
- Sem escolha, o botão do topo é o **balão do 292**. Escolhido outro, **só muda o caminho do desenho** dentro do mesmo botão (mesmo
  SVG de 27 px, mesma cor, mesmo número de pendentes e mesmo rótulo "Feedback do treino, N pendentes").
- **Meu perfil → "Ícone do feedback"** (logo depois de "Configurações"): toque abre um painel com as 19 opções e a frase "Escolhido: <nome>".
  O ícone da linha é o escolhido, no tamanho (27 px) e na cor dos ícones das outras linhas. Cada opção é um quadrado de 52 px com o
  desenho de 28 px na cor de destaque sobre um fundo bem escuro (nos dois modos: o roxo, a cor mais escura do app, só passa de 3:1 sobre
  fundo escuro, e no claro amarelo, laranja, verde e ciano sumiriam sobre um quadrado claro). O escolhido ganha borda e fundo na cor de
  destaque e uma marca de visto escura com anel. Tocar vale na hora e grava.
- A escolha vale por conta e por aparelho (`agenda_demo_feedback_icon`, pelo mesmo armazenamento das outras preferências do aluno).
  Valor estranho ou ícone que não existe mais cai no padrão; se o aparelho recusar gravar (disco cheio) a tela avisa "Não foi possível
  guardar o ícone neste aparelho." e não troca nada. Não há imagem, então não há o que falhar ao carregar.

## Como rodar
Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 com Pillow e `google-chrome` no PATH (ou `CHROME=/caminho`).
1. Monte as páginas (o 1.12.292 é achado na raiz da `main` ou refeito pelo gerador a partir do histórico, sempre conferido pelo SHA-256).
   Trabalhe numa pasta **fora do repositório** (ou apague `www` e `saida` no fim): as páginas têm milhões de caracteres e as capturas
   são imagens, nada disso deve ser commitado.
   ```
   mkdir -p www saida
   node <repositório>/equipe/testes/navegador/icone-feedback/preparar.cjs www     # ou: … preparar.cjs www <pacote-1.12.292.agenda.json>
   ```
   Gera `index-291.html`, `index-292.html`, `index-294.html`, `professor-292.html`, `professor-294.html` e `dialogo.html`.
2. Suba o servidor: `python3 ../janelas-pagina/servidor.py www saida 8790 &`
3. Rode (todos com `PORTA=8790`; `SAIDA=saida` onde há capturas):
   ```
   node funcional.js index-294.html index-292.html                          # esperado: 129 ok, 0 com falha
   node professor.js professor-292.html professor-294.html                  # esperado: 17 ok, 0 com falha
   PARALELO=2 node mutantes.cjs www index-294.html index-292.html           # esperado: 33 de 33 defeitos pegos (SO=id1,id2 roda só alguns)
   node capturas.js index-294.html index-292.html && python3 montagem.py saida saida/montagem   # imagens para olhar a olho
   ```
   Regressão do que já existia (os executores do 292, de `../sininho-feedback`, contra a página nova):
   ```
   node ../sininho-feedback/funcional.js index-294.html index-291.html      # esperado: 149 ok, 0 com falha
   node ../sininho-feedback/geometria.js index-294.html index-291.html      # 324 casos (escuro)
   MODOS=claro LARGURAS=320,412 node ../sininho-feedback/geometria.js index-294.html index-291.html   # 108 casos (claro)
   ```
4. **Regressão da tela do professor** com os executores do teste das janelas (a partir de `../janelas-pagina`, com `PORTA=8790`):
   ```
   node paridade.js professor-292.html professor-294.html 390x844            # esperado: 38 janelas, 10 configurações, 0 diferenças
   TOQUE=0 node paridade.js professor-292.html professor-294.html 390x844    # o mesmo, como computador com mouse
   ```

## O que cada executor confere
- **`funcional.js` (129 verificações, toque e teclado de verdade; compara com a página do 292 onde o resultado tem de ser igual):**
  A) sem escolha: o botão do topo tem **o mesmo caminho SVG do 292** (byte a byte), 27×27 dentro de 44×44, `fill` = `currentColor`, mesmos
     retângulos do 292 e HTML do botão idêntico (só `data-icon` difere); as medidas do WhatsApp (24 px) e do sino (29 px) servem de régua;
  B) uma linha e um painel, logo depois de "Configurações"; o ícone da linha tem 27 px e a cor das linhas vizinhas;
  C) abrir e fechar (toque e teclado), foco no painel, `aria-expanded`, 19 rádios do mesmo grupo na ordem do manifesto, só o padrão
     marcado, nomes e desenhos iguais ao manifesto, `fill-rule="evenodd"`, quadrados de 52 px com desenho de 28 px, nenhuma imagem;
  D) **cada uma das 19 escolhas** com toque de verdade: botão do topo (desenho), gravação com a chave certa da conta, rádio marcado,
     status, ícone da linha, evento `ap-feedback-icon-changed` e rótulo/número do botão, **mais o tamanho**: 27 px no botão, caixa do
     desenho de 18 a 21 de largura e de altura (de 24), centro a no máximo 0,8/0,9 do centro do balão do 292, massa de 40% a 115% da do
     balão, no máximo 8% do desenho escondido pelo selo do número, lado maior de 90% a 125% do ícone do WhatsApp e centro na altura do
     WhatsApp (1,5 px) e do sino (2,5 px); imprime a tabela dos 19;
  E) a escolha sobrevive a fechar e abrir o aplicativo (página recarregada) · F) é por conta: sem aluno logado a linha some, e outra
     conta não herda a escolha · G) sem pendência o topo continua igual ao do 292;
  H) nada é baixado nem desenhado como imagem (sem recursos de rede, sem `<img>`, sem dados de imagem embutidos) · I) falha ao gravar
     avisa e não troca nada · J) valores gravados estranhos (vazio, `__proto__`, HTML, 5.000 caracteres, ícone inexistente…) caem no
     padrão sem erro;
  K) a rotina do Perfil recria a linha sem duplicar · L) teclado: setas trocam a escolha, Enter abre, foco visível (no modo claro com
     amarelo também: contorno de pelo menos 3:1 com o painel);
  M) painel do Perfil em **9 cores** (as 8 do aplicativo e o tema preto) × claro/escuro: texto ≥ 4,5:1, linha com as cores das vizinhas,
     marca de visto de 18 px, quadradinho escuro e **desenho com pelo menos 3:1 sobre ele, também no marcado** (medido nos pixels da captura);
  **S) COR:** em cada cor, no escuro e no claro, a cor do desenho do botão do topo é **igual** à do WhatsApp e à do sino ao lado e igual à
     cor de destaque do app; o ícone da linha e **os 19 desenhos da grade** têm a cor dos ícones das outras linhas do Perfil; mais três
     cores livres do seletor de cor (`#7a5cff`, `#1b3a8a`, `#e6ff3d`);
  O) a janela "Como foi hoje?" segue igual · R) com "reduzir movimento" do sistema ligado a rolagem ao abrir o painel deixa de ser suave;
  Q) larguras 320 a 430 (e letra grande): grade sem estouro, alvos de toque ≥ 48 px, espaço entre eles ≥ 8 px, nada fora da tela;
  Z) nenhum erro de JavaScript.
- **`professor.js` (17 verificações):** abre o `professor.html` do 292 e o do 294 com o mesmo estado de exemplo: o estilo do feedback do
  294 é o do 292 mais as 18 regras novas; nenhuma regra nova alcança elemento algum (nem com a janela de feedback do professor aberta);
  todos os elementos têm o **mesmo estilo calculado completo e o mesmo retângulo**; nenhum elemento do botão, da linha ou do painel existe;
  nenhum erro. Controles: duas aberturas do 292 dão o mesmo resumo e uma mudança de 1 px na margem da barra de topo muda o resumo.
- **`mutantes.cjs` ("teste do teste"):** estraga a página do 294 de **33 jeitos**, um de cada vez, e roda `funcional.js` com `PARAR=1`;
  cada defeito precisa fazer o teste falhar. Comportamento (15: sem desenho, padrão errado ou diferente do 292, chave sem conta, leitura
  sem conta, linha no fim da lista, Perfil sem recriar a linha, linha sempre visível, falha de gravação silenciosa, rádios fora do grupo,
  sem evento, botão do topo sem atualizar, painel sem foco, status sem nome, rolagem ignorando "reduzir movimento"); **cor (4:** topo,
  linha e grade pintados de roxo fixo, grade branca); **tamanho (6:** botão do topo de 34 px, ícone miúdo, ícone concentrado sob o
  número, ícone leve demais, ícone deslocado para o canto, alvos de 36 px); forma e leitura (8: sem `evenodd`, `[hidden]`, sem marca
  de visto, marca de 24 px, texto da descrição apagado, marcado com 40% de tinta, quadrado claro no modo claro, foco claro apagado).
  Alguns mutantes também alteram o manifesto para que as verificações de tamanho e de centro sejam exercitadas.
- **`capturas.js` + `montagem.py`:** imagens para olhar a olho (nada é conferido ali): antes (292) e depois, o Perfil fechado e aberto,
  **o ícone padrão em cada uma das 9 cores, escuro e claro, ao lado do WhatsApp e do sino**, **os 19 desenhos no topo**, o painel em
  quatro cores, 320 px e a janela do feedback aberta pelo botão.

## Resultados registrados (Chrome 153.0.8010.12 headless emulando tela de toque, Node 22.23.4, Java 21, 19/11/2026)
- **`funcional.js`:** 129 de 129, nenhum erro de página. Contraste do desenho sobre o quadradinho (normal / marcado), do escuro ao claro:
  rosa 4,76/4,51 · vermelho 4,92/4,58 · laranja 8,33/7,25 · amarelo 12,88/10,51 · verde 9,89/8,34 · ciano 9,58/8,09 · azul 5,44/4,87 ·
  roxo **3,27/3,10** (o mais baixo; passa de 3:1, que é o mínimo para elementos de interface, e fica abaixo de 4,5:1).
- **`funcional.js` do 292 (sino) contra a página do 294:** 149 de 149.
- **`professor.js`:** 17 de 17. **Paridade 292 × 294 do professor (`paridade.js`):** 38 janelas em 10 configurações (5 temas × claro/escuro),
  0 diferenças, com toque e com mouse.
- **`mutantes.cjs`:** 33 de 33 pegos, cada um pelo motivo certo.
- **`geometria.js`, escuro (324 casos com o botão):** nome partido 0, ícone fora da tela 0, sobreposição 0, estouro 0, tamanho errado 0.
  Os ícones descem para a linha de baixo em 25 de 324; o nome fica com mais linhas que no 291 em 82, igual em 217. Sem pendência: 324 de
  324 iguais ao 291. **Claro (108 casos, larguras 320 e 412):** os mesmos zeros; ícones embaixo em 21, mais linhas em 30, igual em 57; sem
  pendência 108 de 108 iguais. São os mesmos números do 292: o ícone novo não muda a geometria do topo.
- **Teste automático do pacote** (`equipe/testes/icone-feedback.smoke.cjs`): 72 verificações, 0 falhas (pacote e escopo, os 19 caminhos
  com SHA-256, caixa de cada um dentro da grade, nenhuma cor própria, varredura do código novo contra uma lista de usos proibidos,
  invariantes do estilo, gerador, sabotagens do pacote, do código e do estilo).
- **Teste com o código Java real do aplicativo** (`equipe/testes/icone-feedback.java.py`): 149 verificações. O pacote é igual, byte a byte
  nas duas páginas, à correção por área que o aplicativo aplica (`UpdateAreaPatch.apply/inverse`; o app a numera 1.12.293 porque soma 1 à
  instalada, o pacote completo é 1.12.294 de propósito); a regra do componente compartilhado recusa o estilo só no aluno; o
  `UpdateManager` real dá "Revisar atualização" sobre o 288, o 291, o 292 e sobre um aparelho com as correções da `main`, e "Revisar
  restauração" ao voltar ao 292. **Retenção:** das 10 correções por área da `main`, 8 estão presentes no 294, 1 (Ficha recolhível 253)
  foi continuada pela correção 02 e 1 (Raposinha) conflita desde o 288; **nenhuma que estava presente se perde**.
- **Testes oficiais do Android** (`equipe/testes/testes-oficiais-android.py`, os 18 `tests/verify_*.cjs`) com as páginas do 294: 18 de 18.

## Limites
- Não cobre iPhone/Safari nem o WebView do Xiaomi, o servidor real do feedback (a rede é simulada) e a forma como a atualização chega
  ao app web dos alunos. O pet precisa do aplicativo inteiro e não aparece neste teste; o aviso do pet não foi alterado.
- A escolha é **só do aparelho**: se a aluna trocar de celular ou limpar os dados do navegador, volta ao padrão. Guardar na conta
  (Firebase) exigiria gravar dados de aluno e não foi feito sem autorização.
- **Contraste de cores claras sobre fundo claro:** no modo claro o amarelo, o ciano e o cinza do tema preto ficam pouco contrastados sobre
  o fundo claro da página no WhatsApp, no sino e nas linhas do Perfil, e o botão novo segue a mesma cor (é o que "acompanhar a cor do
  app" significa). Os quadradinhos do painel são escuros justamente para não herdar esse limite. É uma característica do app, não do ícone.
- Os 18 desenhos são originais, feitos para este pacote no estilo do balão do 292. As ilustrações roxas que o Tiago mandou foram a
  referência de **quais temas** ter na grade, não a arte final. O selo roxo do primeiro print (balão com linhas, joinha e cinco estrelas)
  **não é uma opção**: tem detalhe demais para 27 px; "Joinha" e "Três estrelas" cobrem partes dele.
