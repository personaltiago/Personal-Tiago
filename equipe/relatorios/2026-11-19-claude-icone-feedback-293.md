# Ícone do feedback personalizável (1.12.293) — Claude — 19/11/2026

**Branch / commit / versão:** `claude/icone-feedback` (empilhada na `claude/sininho-feedback`, PR #20) / pacote **1.12.293**, sequência **399**, sem assinatura (a assinatura é do fluxo do GitHub, que só o Tiago aciona). O pacote não está no repo.

**Pedido do Tiago (19/11, 20:22 e 20:23, ditado, com dois prints):** depois de ver o botão do feedback no topo ("ficou muito bom"), ele quer **personalizar o ícone**: o selo roxo redondo (print 1) fica como **padrão**, todo mundo começa com ele, e a pessoa pode **escolher entre todos os outros** (print 2, uma grade de 18 ícones). Na mesma hora: as atualizações que já estão no GitHub devem **ficar** quando este pacote for instalado, "senão vai ficar excluindo e eu vou ter que ficar instalando".

**Leitura adotada [H, ~75%]:** 19 opções (o padrão + os 18), escolha **do próprio aluno**, em **Meu perfil**, guardada **neste aparelho**, por conta. A frase "na base de lá no mais" é ambígua: "Mais" é a aba do professor, não existe no aplicativo do aluno. Uma escolha do professor valendo para todos os alunos exigiria **gravar no Firebase**, o que a regra do projeto só permite com autorização; **não foi feito**. Se for isso que ele queria, é um pacote à parte e depende dele.

**Decisões de desenho:**
- **Padrão = o selo redondo** do print 1 (40 px dentro do botão de 44×44); os outros 18 são blocos de cantos arredondados (38 px). Tamanho de toque, número de pendentes, rótulo e posição são os do 292.
- **Onde:** Meu perfil → nova linha "Ícone do feedback", logo depois de "Configurações". Tocar abre um painel com as 19 opções e a frase "Escolhido: <nome>". Tocar num ícone grava e já troca o botão do topo; anel na cor de destaque e marca de visto mostram o escolhido.
- **Onde fica guardado:** só no aparelho, pelo mesmo armazenamento das outras opções do aluno (`APstudentStorage`, chave `agenda_demo_feedback_icon`, separada por conta). Nada vai para o Firebase, o professor não vê, e em outro celular começa no padrão.
- **Imagens:** 19 WebP de 160×160 embutidos na página (data URI), sem arquivo externo nem rede. Se a imagem não carregar, o botão volta ao balão simples do 292.
- **Acessibilidade:** 19 botões de rádio nativos num grupo (setas trocam, Enter abre), rótulo com o nome de cada ícone, status com `aria-live`, foco visível, e a rolagem ao abrir o painel respeita "reduzir movimento" do sistema.
- **Valor estranho** gravado no aparelho (vazio, ícone que não existe, `__proto__`, HTML, 5.000 caracteres) cai no padrão sem erro. **Disco cheio:** avisa "Não foi possível guardar o ícone neste aparelho." e não troca nada.

**Arquivos (neste PR, só ferramentas e testes; nenhum `.agenda.json` na raiz):**
- `tools/gerar-icone-feedback-1.12.293.cjs` — gerador (parte do 292, SHA-256 `82f41147…87fb`, conferido). `tools/icones-feedback-293/` — os 19 WebP + `manifest.json` (ordem, ids e nomes).
- `equipe/testes/pacote-292.cjs` — acha (ou refaz) o 292, sempre conferido pelo SHA-256. `equipe/testes/arquivos-da-main.cjs` — acha os arquivos da `main` pelo nome e SHA-256.
- `equipe/testes/icone-feedback.smoke.cjs` — teste automático do pacote (52 verificações).
- `equipe/testes/icone-feedback.java.py` + `equipe/testes/java/IconeFeedbackHarness.java` — teste com o código Java real do aplicativo (149), incluindo a conferência de que **nada da `main` se perde**.
- `equipe/testes/testes-oficiais-android.py` — roda os 18 `tests/verify_*.cjs` com as páginas de um pacote.
- `equipe/testes/navegador/icone-feedback/` — Chrome real (funcional 98, professor 17, mutantes 21), `preparar.cjs`, `capturas.js`, `montagem.py` e LEIA-ME.

**O que o pacote muda (só dois arquivos, três blocos, cada bloco trocado inteiro):**
| Arquivo | Bloco | Antes (SHA-256 do texto) | Depois |
|---|---|---|---|
| `index.html` | `ap-feedback-student` | `0730944c…3760` | `4da2dacf…9f66` |
| `index.html` | `ap-feedback-css` | `e0407658…7376` | `86eb7c58…3e62` |
| `professor.html` | `ap-feedback-css` | `e0407658…7376` | `86eb7c58…3e62` (mesmo texto) |
`index.html` 2.375.350 → 2.491.815 caracteres (+116.465, quase tudo são as 19 imagens); `professor.html` 4.731.583 → 4.734.047 (+2.464); `avaliacoes.html`, `cadastro.html` e `modularUpdates` idênticos. Pacote: 19.287.567 bytes (limite 24 MiB), **SHA-256 `dfd7c085…2698`**, `notes` 2.286 caracteres, `update.summary` 176.

**Componente compartilhado [V]:** como no 292, `ap-feedback-css` está em `UpdateAreaPatch.SHARED`: o aplicativo só aceita a correção se o aluno e o professor receberem o **mesmo** texto. Por isso o `professor.html` ganha as mesmas 22 regras, todas começando por `.student-home`, `#profileScreen`, `#apFeedbackIcon…` ou `.ap-fbicon-…`, que não existem na tela do professor. O script novo **não** entra no professor.

**Numeração:** 292 (seq 398) + 1 = **1.12.293 (seq 399)**; sequência = número da versão + 106. O pacote é completo e cumulativo: instala **no lugar** do 288, do 291 ou do 292. O próximo pacote completo parte deste: **1.12.294 / sequência 400 ou mais**.

**Atualizações da `main` mantidas [V]** (pedido das 20:23). O pacote completo sobrescreve as 4 páginas, então uma correção por área da `main` só sobrevive se o texto dela já estiver na página. Conferido com o `UpdateAreaPatch` real do aplicativo, para cada uma das 10 correções por área que estão na raiz da `main` (status no 293):
| Correção | Status no 1.12.293 |
|---|---|
| 01 Catálogo unificado · 02 Baixar catálogo · 03 Corrigir duplicatas (as três do 291) | presente |
| Apagar exercício do catálogo (assinada e não assinada) | presente |
| Histórico mensal de pagamentos sem anexos (Pix) | presente |
| Sininho de cadastros pendentes do professor | presente |
| Testar e enviar sons do treino | presente |
| Ficha selecionada recolhível (253) | **evoluída**: um bloco foi continuado pela correção 02 (`ap-workout-export`) e as 189 linhas dela continuam na página |
| **Raposinha (3 fases)** | **conflito**, fora do pacote (abaixo) |
Resultado: **"correções da main mantidas antes do 293 e perdidas por ele: 0"**; simulando um aparelho no 288 que instalou as 3 correções de exercícios, o 293 não desfaz nenhuma.

**Raposinha fica de fora [V]:** o aplicativo a recusa com "Conflito em `ap-student-mascot-model`" (o bloco dos mascotes mudou) e ela também não tem o bloco do cadastro. **Nunca esteve** no 288, no 291 nem no 292, então instalar o 293 não a remove de lugar nenhum. Para entrar, a correção precisa ser **adaptada ao conteúdo atual** (outra tarefa; decisão do Tiago).

**Verificado [V]** (Chrome 153 headless, Java 21, Node 22 no ambiente do Claude; sem celular):
- **Chrome real, toque e teclado de verdade** (página do aluno verdadeira do pacote): `funcional.js` **98/98**: padrão correto; linha e painel no lugar certo; **cada uma das 19 escolhas** com toque (botão do topo, chave gravada por conta, rádio, status, linha, evento, tamanhos 40/38 em 44×44); persistência depois de recarregar; isolamento por conta; imagem quebrada; disco cheio; 12 valores estranhos; recriação do Perfil sem duplicar; teclado; contraste e anel em 5 acentos × claro/escuro (inclui a folga do anel medida nos pixels pintados); larguras 320, 360, 390 e 430 e letra grande (alvos de toque ≥ 48 px, sem estouro); "reduzir movimento"; nenhum erro de JavaScript.
- **Os 149 testes do 292 contra a página do 293:** **149/149**. O topo, a janela "Como foi hoje?" e o fluxo do feedback seguem como no 292; o botão do 293, sem a imagem e as classes `ap-fbicon-*`, é idêntico ao do 292.
- **Matriz de geometria do topo** (6 larguras de 320 a 430, 9 nomes, 3 tamanhos de letra, com e sem o ícone do grupo): escuro **324 casos**, claro **108**: nome partido 0, fora da tela 0, sobreposição 0, estouro 0, tamanho errado 0; **sem pendência 432 de 432 idênticos ao 291**. Os números são os mesmos do 292 (ícones embaixo em 25 de 324 e 17 de 108): o ícone novo não muda a geometria.
- **Tela do professor** (`professor.js` + paridade das janelas): mesmo estilo calculado completo e mesmo retângulo em todos os elementos, as regras novas não alcançam nenhum, sem elemento do ícone, sem erro: **17/17**; paridade 292 × 293 das **38 janelas em 10 configurações, 0 diferenças**, com toque e com mouse.
- **Teste do teste:** **21 defeitos propositais** na página do 293, todos pegos pelo `funcional.js`, cada um pelo motivo certo. Um 22º (tirar `panel&&(panel.hidden=!0)` do tratador de troca de conta) **não pode ser pego**: é equivalente, porque `feedbackIconSync()` já fecha o painel sem aluno logado.
- **Teste automático** (`icone-feedback.smoke.cjs`): **52/52** (pacote, escopo, as 19 imagens com leitura do cabeçalho WebP, varredura do código novo contra uma lista de usos proibidos, invariantes do estilo, gerador e sabotagens).
- **Código Java real do aplicativo:** **149 verificações**: o pacote é igual, byte a byte nas duas páginas, à correção por área que o aplicativo aplicaria (`UpdateAreaPatch.apply/inverse`); a regra do componente compartilhado recusa o estilo só no aluno e a cópia do professor diferente da do aluno; o `UpdateManager` real dá "Revisar atualização" ao instalar o 293 sobre o 288, o 291, o 292 e sobre um aparelho que já recebeu as correções da `main`, e "Revisar restauração" ao voltar do 293 para o 292; importar o 293 de novo é ignorado ("já está instalado"); e a tabela de retenção acima.
- **Testes oficiais do Android** (`tests/verify_*.cjs`, 18): **18/18** com as páginas do 293.

**Achados fora do escopo (não mexi) [V]:**
- Em Meu perfil, as linhas **Sons do treino, Pet e Atualizações** aparecem **sem ícone** no meu teste (o SVG delas mede 0×0) e o texto começa mais à esquerda que o das outras linhas. Não sei se acontece no celular do Tiago ou só no ambiente de teste.
- Herdado do 292: o número do botão do feedback tem borda escura fixa (`#0a151e`), que no modo claro aparece como um anel escuro em volta do número. Não alterei.

**Aprovado [A]:** nada ainda. Falta a aprovação do Tiago (e o teste no aparelho).

**Hipóteses [H]:**
- Como o pacote chega ao app web dos alunos (o iPhone da Jéssica) o ambiente do Claude não alcança (são sites da conta do ChatGPT dele). Se for pelo mesmo caminho dos pacotes anteriores, vale igual (~70%; não verificado).
- **iPhone/Safari:** as imagens são WebP, que o Safari só lê a partir do iOS 14. Em iOS mais antigo a imagem não carrega e o botão cai no balão simples do 292 (a regra está testada com imagem quebrada, mas não no Safari). Não testado em aparelho (~85% de que renderiza como no Chrome em iOS 14 ou mais novo).
- A leitura do pedido (escolha do aluno, em Meu perfil, no aparelho) está certa em ~75%.

**Áreas de risco tocadas:** feedback do aluno (só o desenho do botão do topo e a tela de escolha; nenhum dado, resposta, envio, fila, Firebase ou lista foi alterado), Meu perfil (uma linha e um painel novos), atualizações (pacote completo e componente compartilhado `ap-feedback-css`). **Não tocadas:** descanso do treino, cronômetros, alarmes, notificações da tela bloqueada, alunos, treinos, agenda, financeiro, avaliações, sincronização.

**Como reverter:** Central de atualizações → ⋮ → "Restaurar versão anterior", ou reimportar o 1.12.292 (o aplicativo avisa "Revisar restauração"; o ícone volta ao balão simples e tudo o mais fica). A escolha gravada no aparelho fica guardada sem efeito. Nenhum dado de aluno é afetado. Neste PR basta fechar.
