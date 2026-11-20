# Teste no Chrome real — Ícone do feedback personalizável (1.12.293)

Abre a página do aluno verdadeira do pacote 1.12.293 (o `index.html` de dentro do `.agenda.json`) no Chrome, em tela de toque, e confere
com **toque e teclado de verdade** (`Input.dispatchTouchEvent` e `Input.dispatchKeyEvent` do DevTools) a linha nova **"Ícone do feedback"**
em **Meu perfil**, o painel com as 19 opções e o botão do topo da tela inicial, que passa a mostrar o ícone escolhido. Também confere que
a tela do professor (`professor.html`, que recebe o mesmo estilo por regra do aplicativo) não muda. Usa o mesmo executor do teste das
janelas como página (`../janelas-pagina`: `cdp.js`, `semente.js`, `servidor.py`, `dialogo.html`) e a biblioteca do teste do sino
(`../sininho-feedback`). Não usa Firebase, não usa a casca do aplicativo e **não substitui o teste no celular** (nem no iPhone/Safari).

## O pedido
Tiago (19/11, 20:22, ditado, com dois prints): depois de ver o botão do feedback no topo ("ficou muito bom"), quer que o aluno possa
**personalizar esse ícone**: o selo roxo redondo (print 1) continua sendo o **padrão**, todo mundo começa com ele, e a pessoa pode
**escolher entre todos os outros** (print 2, uma grade de 18 ícones). A leitura adotada: 19 opções (o padrão + os 18), escolha **do
próprio aluno**, em **Meu perfil**, guardada **neste aparelho**, por conta. Uma escolha do professor para todos os alunos exigiria gravar
no Firebase (regra do projeto: só com autorização) e **não foi feita**.

Na mesma hora (20:23) ele pediu que as atualizações que já estão no GitHub **não se percam** quando este pacote for instalado, para não
ter de reinstalar o aplicativo. O pacote é completo e cumulativo, e isso é conferido com o código Java real do aplicativo (abaixo).

## O que o pacote muda
Só dois arquivos, três blocos, e cada bloco é trocado inteiro:
| Arquivo | Bloco | O que muda |
|---|---|---|
| `index.html` | `ap-feedback-student` (script) | os 19 ícones (WebP 160×160 embutidos), leitura e gravação da escolha, desenho no botão do topo, linha e painel em Meu perfil |
| `index.html` | `ap-feedback-css` (estilo) | 22 regras novas no fim (botão do topo com imagem, linha, painel, grade, anel e marca de visto) |
| `professor.html` | `ap-feedback-css` (estilo) | **as mesmas 22 regras**, sem nenhum efeito (mesmo motivo do 292: componente compartilhado) |

`avaliacoes.html`, `cadastro.html`, dados, Firebase, o aviso do pet, a janela "Como foi hoje?", descanso, cronômetros, alarmes e
notificações da tela bloqueada **não são tocados**. Versão 1.12.293, sequência 399.

## O que a aluna vê e faz
- Sem escolha, o botão do topo é o **selo redondo roxo** (40 px dentro do botão de 44×44, o mesmo tamanho de toque do 292); os outros 18
  são blocos de cantos arredondados (38 px). O número de pendentes e o rótulo "Feedback do treino, N pendentes" são os do 292.
- **Meu perfil → "Ícone do feedback"** (logo depois de "Configurações"): toque abre um painel com as 19 opções e a frase "Escolhido: <nome>".
  Tocar num ícone grava e já troca o botão do topo; o anel na cor de destaque e a marca de visto mostram qual está escolhido.
- A escolha vale por conta e por aparelho (`agenda_demo_feedback_icon`, pelo mesmo armazenamento das outras preferências do aluno).
  Valor estranho ou ícone que não existe mais cai no padrão; se o aparelho recusar gravar (disco cheio) a tela avisa "Não foi possível
  guardar o ícone neste aparelho." e não troca nada; se a imagem não carregar, volta o balão simples do 292.

## Como rodar
Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 com Pillow e `google-chrome` no PATH (ou `CHROME=/caminho`).
1. Monte as páginas (o 1.12.292 é achado na raiz da `main` ou refeito pelo gerador a partir do histórico, sempre conferido pelo SHA-256).
   Trabalhe numa pasta **fora do repositório** (ou apague `www` e `saida` no fim): as páginas têm milhões de caracteres e as capturas
   são imagens, nada disso deve ser commitado.
   ```
   mkdir -p www saida
   node <repositório>/equipe/testes/navegador/icone-feedback/preparar.cjs www     # ou: … preparar.cjs www <pacote-1.12.292.agenda.json>
   ```
   Gera `index-291.html`, `index-292.html`, `index-293.html`, `professor-292.html`, `professor-293.html` e `dialogo.html`.
2. Suba o servidor: `python3 ../janelas-pagina/servidor.py www saida 8790 &`
3. Rode (todos com `PORTA=8790`; `SAIDA=saida` onde há capturas):
   ```
   node funcional.js index-293.html index-292.html                          # esperado: 98 ok, 0 com falha
   node professor.js professor-292.html professor-293.html                  # esperado: 17 ok, 0 com falha
   node mutantes.cjs www index-293.html index-292.html                      # esperado: 21 de 21 defeitos pegos
   node capturas.js index-293.html index-292.html && python3 montagem.py saida saida/montagem   # imagens para olhar a olho
   ```
   Regressão do que já existia (os executores do 292, de `../sininho-feedback`, contra a página nova):
   ```
   node ../sininho-feedback/funcional.js index-293.html index-291.html      # esperado: 149 ok, 0 com falha
   node ../sininho-feedback/geometria.js index-293.html index-291.html      # 324 casos (escuro)
   MODOS=claro LARGURAS=320,390,430 FONTES=pequena,grande node ../sininho-feedback/geometria.js index-293.html index-291.html   # 108 casos (claro)
   ```
4. **Regressão da tela do professor** com os executores do teste das janelas (a partir de `../janelas-pagina`, com `PORTA=8790`):
   ```
   node paridade.js professor-292.html professor-293.html 390x844            # esperado: 38 janelas, 10 configurações, 0 diferenças
   TOQUE=0 node paridade.js professor-292.html professor-293.html 390x844    # o mesmo, como computador com mouse
   ```

## O que cada executor confere
- **`funcional.js` (98 verificações, toque e teclado de verdade; compara com a página do 292 onde o resultado tem de ser igual):**
  A) sem escolha: selo redondo, 40 px no botão 44×44, imagem de 160×160 igual ao arquivo do repositório, decorativa; o botão sem a
     imagem é idêntico ao do 292; topo, cartão do Início, lista e mascote idênticos;
  B) uma linha e um painel, logo depois de "Configurações"; o resto do Perfil igual; a linha tem as cores das vizinhas;
  C) abrir e fechar (toque e teclado), foco no painel, `aria-expanded`, 19 opções na ordem do manifesto, todas do mesmo grupo de rádio,
     nomes e imagens iguais aos arquivos, só o padrão marcado e o status "Escolhido: Padrão";
  D) **cada uma das 19 escolhas** com toque de verdade: botão do topo (ícone, classe, imagem, 40/38 px dentro de 44×44), gravação com a
     chave certa da conta, rádio marcado, status, ícone da linha, evento `ap-feedback-icon-changed` e rótulo/número do botão;
  E) a escolha sobrevive a fechar e abrir o aplicativo (página recarregada) · F) é por conta: sem aluno logado a linha some, e outra
     conta não herda a escolha · G) sem pendência o topo continua igual ao do 292;
  H) imagem que não carrega devolve o balão do 292 · I) falha ao gravar avisa e não troca nada · J) 12 valores gravados estranhos
     (vazio, `__proto__`, HTML, 5.000 caracteres, ícone inexistente…) caem no padrão sem erro;
  K) a rotina do Perfil recria a linha sem duplicar · L) teclado: setas trocam a escolha, Enter abre, foco visível;
  M) cores e contraste em 5 acentos × claro/escuro (texto ≥ 4,5:1, linha com as cores das vizinhas, anel e marca de visto presentes,
     folga do anel medida nos pixels da captura);
  N) o código acrescentado não usa rede, timers, notificações, som nem armazenamento próprio · O) a janela "Como foi hoje?" segue igual
     (abre, fecha, devolve o foco, interface pública congelada);
  R) com "reduzir movimento" do sistema ligado a rolagem ao abrir o painel deixa de ser suave;
  Q) larguras 320, 360, 390 e 430 (e letra grande): grade sem estouro, alvos de toque ≥ 48 px, nada fora da tela;
  Z) nenhum erro de JavaScript.
- **`professor.js` (17 verificações):** abre o `professor.html` do 292 e o do 293 com o mesmo estado de exemplo: o estilo do feedback do
  293 é o do 292 mais as regras novas; nenhuma regra nova alcança elemento algum (nem com a janela de feedback do professor aberta); todos
  os elementos têm o **mesmo estilo calculado completo e o mesmo retângulo**; nenhum elemento do botão, da linha ou do painel existe; nenhum
  erro. Controles: duas aberturas do 292 dão o mesmo resumo e uma mudança de 1 px na margem da barra de topo muda o resumo.
- **`mutantes.cjs` ("teste do teste"):** estraga a página do 293 de 21 jeitos, um de cada vez (sem desenho no botão, padrão errado, selo
  sem a classe redonda, chave sem conta, leitura sem conta, linha no fim da lista, Perfil sem recriar a linha, linha sempre visível, sem
  balão de reserva, falha de gravação silenciosa, rádios fora do grupo, sem evento, botão do topo sem atualizar, painel sem foco, status
  sem nome, rolagem ignorando "reduzir movimento" e cinco defeitos de estilo: `[hidden]`, imagem de 30 px, alvos de 36 px, sem marca de
  visto, texto da descrição com contraste baixo) e roda `funcional.js` com `PARAR=1`; cada defeito precisa fazer o teste falhar.
- **`capturas.js` + `montagem.py`:** imagens para olhar a olho (nada é conferido ali): antes (292) e depois, o Perfil fechado e aberto,
  seis escolhas no topo, modo claro, 320 px e a janela do feedback aberta pelo botão.

## Resultados registrados (Chrome 153.0.8010.12 headless emulando tela de toque, Node 22.23.4, 19/11/2026)
- **`funcional.js`:** 98 de 98, nenhum erro de página.
- **`funcional.js` do 292 contra a página do 293:** 149 de 149 (o topo, a janela e o fluxo do feedback seguem como no 292).
- **`professor.js`:** 17 de 17.
- **`mutantes.cjs`:** 21 de 21 pegos, cada um pelo motivo certo (a primeira falha de cada um aponta o comportamento estragado). Um 22º
  defeito, tirar `panel&&(panel.hidden=!0);` do tratador de troca de conta, **não é pego e não pode ser**: é equivalente, porque
  `feedbackIconSync()` (chamado logo depois por `feedbackIconRow`) já fecha o painel quando não há aluno logado.
- **`geometria.js` do 292 contra a página do 293, escuro (324 casos com o botão):** nome partido 0, ícone fora da tela 0, sobreposição 0,
  estouro 0, tamanho errado 0. Os ícones descem para a linha de baixo em **25 de 324**; o nome fica com **mais linhas** que no 291 em **82**,
  igual em **217**. Sem pendência: **324 de 324** iguais ao 291. São os mesmos números do 292: o ícone novo não muda a geometria do topo.
- **`geometria.js`, claro (108 casos):** os mesmos zeros; ícones embaixo em 17, mais linhas em 26, igual em 65; sem pendência 108 de 108 iguais.
- **Paridade 292 × 293 do professor (`paridade.js`):** 38 janelas em 10 configurações (5 temas × claro/escuro), 0 diferenças, com toque e
  com mouse.
- **Teste automático do pacote** (`equipe/testes/icone-feedback.smoke.cjs`): 52 verificações, 0 falhas (pacote e escopo, as 19 imagens com
  leitura do cabeçalho WebP, varredura do código novo contra uma lista de usos proibidos, invariantes do estilo, gerador e sabotagens).
- **Teste com o código Java real do aplicativo** (`equipe/testes/icone-feedback.java.py`): 149 verificações. O pacote é igual, byte a byte
  nas duas páginas, à correção por área que o aplicativo aplica (`UpdateAreaPatch.apply/inverse`); a regra do componente compartilhado
  recusa o estilo só no aluno; o `UpdateManager` real dá "Revisar atualização" sobre o 288, o 291, o 292 e sobre um aparelho com as
  correções da `main`, e "Revisar restauração" ao voltar ao 292. **Retenção:** das 10 correções por área da `main`, 8 estão presentes no
  293, 1 (Ficha recolhível 253) foi continuada pela correção 02 e 1 (Raposinha) conflita desde o 288; **nenhuma que estava presente se perde**.
- **Testes oficiais do Android** (`equipe/testes/testes-oficiais-android.py`, os 18 `tests/verify_*.cjs`) com as páginas do 293: 18 de 18.
## Limites
- Não cobre iPhone/Safari nem o WebView do Xiaomi, o servidor real do feedback (a rede é simulada) e a forma como a atualização chega
  ao app web dos alunos. O pet precisa do aplicativo inteiro e não aparece neste teste; o aviso do pet não foi alterado.
- A escolha é **só do aparelho**: se a aluna trocar de celular ou limpar os dados do navegador, volta ao padrão. Guardar na conta
  (Firebase) exigiria gravar dados de aluno e não foi feito sem autorização.
- Os desenhos são as imagens que o Tiago mandou (recortadas e reduzidas para 160×160); a qualidade segue a delas.
