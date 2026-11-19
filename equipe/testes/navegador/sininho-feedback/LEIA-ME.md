# Teste no Chrome real — Sino do feedback no topo do aluno (1.12.292)

Abre a página do aluno verdadeira do pacote 1.12.292 (o `index.html` de dentro do `.agenda.json`) no Chrome, em tela de toque, e confere
com **toque de verdade** (`Input.dispatchTouchEvent` do DevTools) o botão novo do topo da tela inicial: um balão com o número de feedbacks
pendentes (1, 2, 3…) que abre direto a janela "Como foi hoje?", sem entrar no pet. Também confere que a tela do professor
(`professor.html`, que recebe o mesmo estilo por regra do aplicativo) não muda. Usa o mesmo executor do teste das janelas como página
(`../janelas-pagina`: `cdp.js`, `semente.js`, `servidor.py`, `dialogo.html`). Não usa Firebase, não usa a casca do aplicativo e **não
substitui o teste no celular** (nem no iPhone/Safari).

## O pedido
Tiago (19/11, 18:14, ditado, com um print do pet e uma foto do Início da aluna Jéssica no iPhone): o feedback pendente só aparece embaixo,
dentro do pet, e muita gente não vê; ele quer **no topo do Início, "como se fosse o sininho, mas o próprio do feedback", com o número
1, 2, 3**, em vez de a aluna ter de entrar no pet. A leitura adotada: um botão só do feedback, ao lado do sino de notificações, com o
número de pendentes; tocar abre a janela do feedback direto.

## O que o pacote muda
Só dois arquivos, três blocos de componente, e cada bloco é trocado inteiro:
| Arquivo | Bloco | O que muda |
|---|---|---|
| `index.html` | `ap-feedback-student` (script) | `f()` passa a chamar `feedbackBell(e)`; funções novas `feedbackBellInk` e `feedbackBell` |
| `index.html` | `ap-feedback-css` (estilo) | 8 regras novas no fim (botão, número, escondido, espaço do topo) |
| `professor.html` | `ap-feedback-css` (estilo) | **as mesmas 8 regras**, sem nenhum efeito (ver abaixo) |

`avaliacoes.html`, `cadastro.html`, dados, Firebase, o aviso do pet, a lista do feedback, descanso, cronômetros, alarmes e notificações
da tela bloqueada **não são tocados**. O pacote é completo e cumulativo: inclui o 1.12.291 (as três correções de exercícios) e deve
ser instalado no lugar dele; versão 1.12.292, sequência 398.

**Por que o `professor.html` também muda.** `ap-feedback-css` está na lista de componentes compartilhados do aplicativo
(`UpdateAreaPatch.SHARED`): o aplicativo só aceita uma correção desse componente se o aluno e o professor receberem o **mesmo** texto
("O componente X precisa da mesma correção no aluno e no professor"). As regras novas só valem dentro da tela inicial do aluno
(`.student-home …`, `.ap-feedback-bell`, `#apFeedbackBellCount`), que não existe na página do professor: o `professor.html` do 291 não
tem nenhuma ocorrência de `student-home`, `home-header` ou `--home-accent`.

## O que o botão faz
- Aparece só com **conta de aluno** e **pelo menos um feedback pendente**; some quando a resposta é enviada e confirmada. Sem pendência
  o topo é exatamente o de antes (medido: 324 de 324 casos do escuro e 108 de 108 do claro idênticos ao 1.12.291).
- O número é o do aviso do pet (`APFeedbackSync.pending()`, o mesmo limite de exibição de 7).
- Posição: entre o grupo do WhatsApp e o sino de notificações. Ícone de balão (não um segundo sino, para não confundir). Mesmo tamanho
  de toque do sino (44×44) e rótulo "Feedback do treino, N pendente(s)".
- Cor: a de destaque que o aluno escolheu; o número é branco, e só fica escuro quando o branco teria contraste menor que 3:1.
- Os ícones ficam 4 px afastados (e não os 13 px de sempre) **só enquanto o botão aparece**, para "Olá, Nome!" continuar numa linha;
  se mesmo assim não couber, os ícones descem para a linha de baixo, sem cortar o nome no meio da palavra.

## Como rodar
Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 e `google-chrome` no PATH (ou `CHROME=/caminho`).
1. Monte as páginas (o 1.12.291 é achado na raiz da `main` ou refeito pelo gerador a partir do histórico, sempre conferido pelo SHA-256).
   Trabalhe numa pasta **fora do repositório** (ou apague `www` e `saida` no fim): as páginas têm milhões de caracteres e as capturas
   são imagens, nada disso deve ser commitado.
   ```
   mkdir -p www saida
   node <repositório>/equipe/testes/navegador/sininho-feedback/preparar.cjs www     # ou: … preparar.cjs www <pacote-1.12.291.agenda.json>
   ```
   (os comandos abaixo, `node funcional.js …`, valem a partir da pasta do `preparar.cjs`, com `www` e `saida` apontando para a pasta de trabalho)
   Gera `index-291.html`, `index-292.html`, `professor-291.html`, `professor-292.html` e `dialogo.html`.
2. Suba o servidor: `python3 ../janelas-pagina/servidor.py www saida 8790 &`
3. Rode (todos com `PORTA=8790`; `SAIDA=saida` onde há capturas):
   ```
   node funcional.js index-292.html index-291.html                                              # esperado: 149 ok, 0 com falha
   node geometria.js index-292.html index-291.html                                              # 324 casos (escuro), 0 defeitos
   MODOS=claro LARGURAS=320,390,430 FONTES=pequena,grande node geometria.js index-292.html index-291.html   # 108 casos (claro), 0 defeitos
   node professor.js professor-291.html professor-292.html                                      # esperado: 17 ok, 0 com falha
   node mutantes.cjs www index-292.html index-291.html                                          # esperado: 10 de 10 defeitos pegos
   node capturas.js index-292.html index-291.html && python3 montagem.py saida saida/montagem   # imagens para olhar a olho
   ```
4. **Regressão da tela do professor** com os executores do teste das janelas (a partir de `../janelas-pagina`, com `PORTA=8790`):
   ```
   node paridade.js professor-291.html professor-292.html 390x844            # esperado: 38 janelas, 10 configurações, 0 diferenças
   TOQUE=0 node paridade.js professor-291.html professor-292.html 390x844    # o mesmo, como computador com mouse
   ```

## O que cada executor confere
- **`funcional.js` (149 verificações, toque de verdade):**
  A) sem pendência (e sem nenhum feedback) o topo é o de sempre, só os três ícones e sem a classe do sino;
  B) com 1, 2, 3, 5 e 7 pendentes: sino visível, número, rótulo e título certos ("1 pendente" no singular), posição (grupo, feedback,
     notificações, perfil), 44×44, topo com a classe do layout;
  C) atualiza ao vivo e some sozinho quando a última pendência é respondida;
  D) toque no sino abre a janela direto, já no pedido pendente mais recente, sem entrar no pet; foco; Voltar fecha só a janela;
  E) responder: o número cai de 2 para 1 quando o servidor confirma e a janela fecha sozinha como antes; tocar de novo abre o pedido que
     sobrou; responder o último faz o sino sumir; envio recusado: a resposta fica guardada no aparelho (fila) e o sino continua com 1,
     como o aviso do pet;
  F) sem conta, visualização do aluno pelo professor, outra conta e área do aluno desligada: não há sino;
  G) cor: o fundo do número, o balão e o acento do tema são a mesma cor; número legível (contraste ≥ 3:1) nos cinco temas e em cinco cores
     livres, no escuro e no claro; branco como o do sino de notificações, e escuro só quando a cor é clara demais para o branco;
  H) tudo o que não é o sino é igual ao 1.12.291 (topo sem o sino, aviso do pet, lista da janela, contagens), nos dois gêneros e nos dois modos;
  I) nenhum erro de JavaScript.
- **`geometria.js`:** larguras 320, 360, 375, 390, 412 e 430, nove nomes (de "Ana" a "Maximiliano"), três tamanhos de letra, com e sem o
  ícone do grupo. Em cada caso: nome nunca partido no meio da palavra, nada fora da tela, sem sobreposição, sem estouro horizontal,
  sino 44×44 e número com 19 px de altura; sem pendência o topo mede **o mesmo** que o do 1.12.291.
- **`professor.js` (17 verificações):** abre o `professor.html` do 291 e o do 292 com o mesmo estado de exemplo: o estilo do feedback do
  292 é o do 291 mais 8 regras; nenhuma regra nova alcança elemento algum (nem com a janela de feedback do professor aberta); os 4.428
  elementos têm o **mesmo estilo calculado completo e o mesmo retângulo**; nenhum elemento do sino existe; nenhum erro. Controles: duas
  aberturas do 291 dão o mesmo resumo (a ordem das propriedades que o Chrome lista muda de uma abertura para outra e o resumo a ignora) e
  uma mudança de 1 px na margem da barra de topo muda o resumo.
- **`mutantes.cjs` ("teste do teste"):** estraga a página do 292 de dez jeitos, um de cada vez (sem chamada, aparece com zero, topo sem a
  classe, sino no fim da fila, sem clique, clique com o evento, número a mais, rótulo no plural, número sempre branco, falta a regra
  `[hidden]`) e roda `funcional.js` com `PARAR=1`; cada defeito precisa fazer o teste falhar.
- **`paridade.js` (do teste das janelas):** 38 janelas do professor × 5 temas × claro/escuro, estilo calculado e geometria.
- **`capturas.js` + `montagem.py`:** imagens para olhar a olho (nada é conferido ali).

## Resultados registrados (Chrome 153.0.8010.12 headless emulando tela de toque, Node 22.23.4, 19/11/2026)
- **`funcional.js`:** 149 de 149, nenhum erro de página.
- **`geometria.js`, escuro (324 casos com sino):** nome partido 0, ícone fora da tela 0, sobreposição 0, estouro 0, tamanho errado 0.
  Os ícones descem para a linha de baixo em **25 de 324** (nomes longos em tela estreita); o nome fica com **mais linhas** que no 291 em
  **82**, igual em **217**. Sem pendência: **324 de 324** iguais ao 291.
- **`geometria.js`, claro (108 casos):** os mesmos zeros; ícones embaixo em 17, mais linhas em 26, igual em 65; sem pendência 108 de 108 iguais.
- **`professor.js`:** 17 de 17. **Paridade 291 × 292 do professor:** 0 diferenças nas 38 janelas em 10 configurações, com toque e com mouse;
  com um fundo injetado de propósito no estilo compartilhado o mesmo teste acusa as 38 (o teste enxerga).
- **`mutantes.cjs`:** 10 de 10 pegos. Um 11º defeito, tirar `!!t.uid()&&` de `const show=!!t.uid()&&count>0`, **não é pego e não pode ser**:
  é equivalente, porque `APFeedbackSync.pending()` já devolve vazio sem conta (`visible()` = conta ? lista : []) e o objeto é congelado;
  a guarda fica como segurança, caso `pending()` mude um dia.
- **Teste automático do pacote** (`equipe/testes/sininho-feedback.smoke.cjs`): 35 verificações, 0 falhas (inclui as regras do estilo, o
  invariante do componente compartilhado, o contraste do número contra a referência WCAG em 256 cinzas, 400 cores ao acaso e a fronteira,
  e sabotagens do código novo, do estilo e do gerador).
- **Teste com o código Java real do aplicativo** (`equipe/testes/sininho-feedback.java.py`): 58 verificações. O pacote é igual, byte a
  byte nas duas páginas, à correção por área que o aplicativo aplica (`UpdateAreaPatch.apply/inverse`); a regra do componente
  compartilhado recusa o estilo só no aluno; o `UpdateManager` real dá "Revisar atualização" do 291 para o 292 e "Revisar restauração"
  do 292 para o 291. 4 pacotes sabotados (professor igual ao do 291, `avaliacoes.html` alterada, numeração errada, cópias do estilo
  diferentes) são recusados.
- **Testes oficiais do Android** (`tests/verify_*.cjs`, 18 arquivos) com as páginas do 292: 18 de 18 (e 18 de 18 com as do 291, como base).

## Limites
- **Pet:** o cartão do pet precisa do aplicativo inteiro e não aparece neste teste; no lugar fica a barra do feedback que a página
  desenha quando o pet não está na tela. O aviso do pet não foi alterado (a comparação com o 291 confere o texto e a contagem).
- Não cobre iPhone/Safari nem o WebView do Xiaomi, o servidor real do feedback (a rede é simulada) e a forma como a atualização chega ao
  app web dos alunos.
- **O que o desenho custa:** com o botão, o "Olá, Nome!" passa para duas linhas em 82 dos 324 casos (nomes de 8 letras ou mais, com o
  ícone do grupo, letra grande e tela estreita); os ícones descem em 25. Nunca corta o nome nem sai da tela.
- **Contraste do número:** o do sino novo segue o do sino de notificações (branco; escuro só em cor clara). Medido: branco sobre o rosa
  3,86:1, sobre o azul 3,37:1, sobre o vermelho 4,00:1 e sobre o roxo 5,61:1; escuro sobre o verde 9,93:1 e sobre o preto 9,82:1. O
  limite do teste é 3:1 (componente de interface); para texto pequeno o recomendado seria 4,5:1. Escolher sempre a tinta de maior
  contraste deixaria o número do feedback escuro onde o do sino de notificações é branco, e os dois ficam lado a lado.
