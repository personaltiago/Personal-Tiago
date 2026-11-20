# Ícone do feedback personalizável (1.12.294) — Claude — 19/11/2026

**Branch / commit / versão:** `claude/icone-feedback` (empilhada na `claude/sininho-feedback`, PR #21) / pacote **1.12.294**, sequência **400**, sem assinatura (a assinatura é do fluxo do GitHub, que só o Tiago aciona). O pacote não está no repo. **Este relatório substitui o do 1.12.293, que foi descartado (abaixo).**

**Pedido do Tiago (19/11, 20:22 e 20:23, ditado, com dois prints):** depois de ver o botão do feedback no topo ("ficou muito bom"), ele quer **personalizar o ícone**: o ícone que o Claude fez (o balão do 292) fica como **padrão**, todo mundo começa com ele, e a pessoa pode **escolher entre todos os outros** (print 2, uma grade de 18 ícones). Na mesma hora: as atualizações que já estão no GitHub devem **ficar** quando este pacote for instalado, "senão vai ficar excluindo e eu vou ter que ficar instalando".

**O erro do 1.12.293 e a correção (Tiago, 22:12, ditado):** os prints eram ilustrações roxas, "só ilustrativas": a cor tem de **acompanhar a cor do aplicativo que a pessoa escolher**, inclusive no padrão, e o tamanho tem de **ficar adequado entre os ícones vizinhos**. O 293 tratou a arte roxa como arte final: 19 imagens WebP fixas, o botão do topo roxo e maior que o WhatsApp e o sino mesmo com o app em rosa. O erro foi meu: li "ícone" como "essa imagem" em vez de "esse desenho, na cor do app". O 293 **não chegou à `main`** (conferido antes de entregar: último commit `4bfa7eb`, nenhum `AgendaPersonal-1.12.293-*` na raiz) e deve ser **descartado**; o 294 o substitui por inteiro, sem imagens.

**Leitura adotada [H, ~75%]:** 19 opções (o padrão + 18), escolha **do próprio aluno**, em **Meu perfil**, guardada **neste aparelho**, por conta. A frase "na base de lá no mais" é ambígua: "Mais" é a aba do professor, não existe no aplicativo do aluno. Uma escolha do professor valendo para todos os alunos exigiria **gravar no Firebase**, o que a regra do projeto só permite com autorização; **não foi feito**.

**Decisões de desenho:**
- **Cor:** todos os desenhos usam `currentColor`, herdado da cor de destaque do aluno: as 8 cores do aplicativo, o seletor de cor livre e o tema preto, no escuro e no claro. É a **mesma cor do WhatsApp e do sino** ao lado (a cor do desenho do botão é conferida igual à deles, em 9 cores × 2 modos, mais três cores livres). Nenhum desenho tem cor própria.
- **Tamanho:** o botão do topo continua o do 292 (44×44, desenho SVG de 27 px, entre o WhatsApp de 24 px e o sino de 29 px). O padrão é o **mesmo caminho SVG do 292, byte a byte**: quem não escolhe nada vê exatamente o do 292. Os outros 18 foram desenhados na mesma grade de 24, com a mesma massa visual; o teste mede, para cada um dos 19 no topo: caixa de 18 a 21 de largura e de altura, centro a menos de 0,8/0,9 do centro do balão, 40% a 115% da massa do balão, no máximo 8% do desenho coberto pelo número de pendentes, lado maior entre 90% e 125% do WhatsApp, centro na altura do WhatsApp e do sino.
- **Os 18 desenhos:** vetoriais, sólidos, de uma cor, detalhes vazados (`fill-rule="evenodd"`), feitos para este pacote (`tools/icones-feedback-294/desenhar.py` → `icones.json`, conferido por SHA-256 na página): Balão, Balão com estrela, Conversa, Prancheta, Carinha feliz, Joinha, Três estrelas, Anotação, Coração, Gostei e não gostei, Aspas, Carta com estrela, Megafone, Estrela com visto, Selo aprovado, Três carinhas, Balão com visto, Documento e lápis. Os prints foram a referência de **quais temas** ter na grade, não a arte.
- **Painel (Meu perfil → "Ícone do feedback", logo depois de "Configurações"):** 19 botões de rádio nativos num grupo, quadrados de 52 px com o desenho de 28 px na cor de destaque **sobre um fundo bem escuro nos dois modos** (o roxo, a cor mais escura do app, só passa de 3:1 sobre fundo escuro; no claro, amarelo, laranja, verde e ciano sumiriam sobre um quadrado claro). O escolhido ganha borda e fundo de 10% na cor de destaque e marca de visto escura de 18 px com anel. Tocar vale na hora e grava. Setas trocam, Enter abre, foco visível, `aria-live` no "Escolhido: <nome>", e a rolagem ao abrir respeita "reduzir movimento".
- **Onde fica guardado:** só no aparelho (`APstudentStorage`, chave `agenda_demo_feedback_icon`, por conta). Nada vai para o Firebase, o professor não vê, outro celular começa no padrão. Valor estranho (vazio, ícone inexistente, `__proto__`, HTML, 5.000 caracteres) cai no padrão; disco cheio avisa "Não foi possível guardar o ícone neste aparelho." e não troca nada.
- **Não incluído de propósito:** o selo roxo do primeiro print (balão com linhas, joinha e cinco estrelas) não é opção nem padrão: tem detalhe demais para 27 px. "Joinha" e "Três estrelas" cobrem partes dele. Se o Tiago o quiser, é um desenho à parte e menos legível no topo.

**Arquivos (neste PR, só ferramentas e testes; nenhum `.agenda.json` na raiz):**
- `tools/gerar-icone-feedback-1.12.294.cjs` — gerador (parte do 292, SHA-256 `82f41147…87fb`, conferido). `tools/icones-feedback-294/` — `icones.json` (ordem, ids, nomes, `d` e SHA-256 de cada desenho), `kit.py` e `desenhar.py` (geometria), `folha.py` (folha de contato). O diretório `tools/icones-feedback-293/` (19 WebP) foi removido.
- `equipe/testes/pacote-292.cjs`, `equipe/testes/arquivos-da-main.cjs` — acham (ou refazem) o 292 e os arquivos da `main`, sempre conferidos por SHA-256.
- `equipe/testes/icone-feedback.smoke.cjs` — teste automático do pacote (72 verificações).
- `equipe/testes/icone-feedback.java.py` + `equipe/testes/java/IconeFeedbackHarness.java` — teste com o código Java real do aplicativo (149), incluindo a conferência de que **nada da `main` se perde**.
- `equipe/testes/testes-oficiais-android.py` — roda os 18 `tests/verify_*.cjs` com as páginas de um pacote (sem alteração).
- `equipe/testes/navegador/icone-feedback/` — Chrome real (funcional 129, professor 17, mutantes 33), `preparar.cjs`, `capturas.js`, `montagem.py` e LEIA-ME.

**O que o pacote muda (só dois arquivos, três blocos, cada bloco trocado inteiro):**
| Arquivo | Bloco | Antes (SHA-256 do texto) | Depois |
|---|---|---|---|
| `index.html` | `ap-feedback-student` | `0730944c…3760` | `716376db…2121` |
| `index.html` | `ap-feedback-css` | `e0407658…7376` | `583bd4ee…aad5` |
| `professor.html` | `ap-feedback-css` | `e0407658…7376` | `583bd4ee…aad5` (mesmo texto) |
`index.html` 2.375.350 → 2.402.965 caracteres (+27.615; a maior parte são os 19 caminhos SVG, 19.718 caracteres); `professor.html` 4.731.583 → 4.733.970 (+2.387); `avaliacoes.html`, `cadastro.html` e `modularUpdates` idênticos. Pacote: 19.198.984 bytes (limite 24 MiB; o 293 tinha 19.287.567), **SHA-256 `2bf38cc59b48a663e00da9faf8d2feb7ca48ae186ff833500c0a0e68fea230e9`**, `notes` 2.618 caracteres, `update.summary` 186. Regenerado a partir da árvore versionada e conferido **byte a byte** contra o pacote testado.

**Componente compartilhado [V]:** como no 292, `ap-feedback-css` está em `UpdateAreaPatch.SHARED`: o aplicativo só aceita a correção se o aluno e o professor receberem o **mesmo** texto. Por isso o `professor.html` ganha as mesmas 18 regras, todas começando por `.student-home`, `#profileScreen`, `#apFeedbackIcon…` ou `.ap-fbicon-…`, que não existem na tela do professor, e **nenhuma toca o botão do topo** (o 292 já o estiliza). O script novo **não** entra no professor.

**Numeração:** 292 (seq 398) → **1.12.294 (seq 400)**. O 1.12.293 (seq 399) foi descartado e o número não será reaproveitado; sequência = número da versão + 106. O pacote é completo e cumulativo: instala **no lugar** do 288, do 291 ou do 292. O próximo pacote completo parte deste: **1.12.295 / sequência 401 ou mais**. (Uma correção por área aplicada pelo aplicativo sobre o 292 sai numerada 1.12.293/399, porque o app soma 1 à versão instalada; o conteúdo é idêntico ao do pacote e o app trata a importação de conteúdo idêntico como "já está instalado".)

**Atualizações da `main` mantidas [V]** (pedido das 20:23). O pacote completo sobrescreve as 4 páginas, então uma correção por área da `main` só sobrevive se o texto dela já estiver na página. Conferido com o `UpdateAreaPatch` real do aplicativo, para cada uma das 10 correções por área que estão na raiz da `main` (status no 294):
| Correção | Status no 1.12.294 |
|---|---|
| 01 Catálogo unificado · 02 Baixar catálogo · 03 Corrigir duplicatas (as três do 291) | presente |
| Apagar exercício do catálogo (assinada e não assinada) | presente |
| Histórico mensal de pagamentos sem anexos (Pix) | presente |
| Sininho de cadastros pendentes do professor | presente |
| Testar e enviar sons do treino | presente |
| Ficha selecionada recolhível (253) | **evoluída**: um bloco foi continuado pela correção 02 (`ap-workout-export`) e as 189 linhas dela continuam na página |
| **Raposinha (3 fases)** | **conflito**, fora do pacote (abaixo) |
Resultado: **8 presentes, 1 evoluída, 1 conflito; "correções da main mantidas antes do 294 e perdidas por ele: 0"**; simulando um aparelho no 288 que instalou as 3 correções de exercícios, o 294 não desfaz nenhuma.

**Raposinha fica de fora [V]:** o aplicativo a recusa com "Conflito em `ap-student-mascot-model`" (o bloco dos mascotes mudou) e ela também não tem o bloco do cadastro. **Nunca esteve** no 288, no 291 nem no 292, então instalar o 294 não a remove de lugar nenhum. Para entrar, a correção precisa ser **adaptada ao conteúdo atual** (outra tarefa; decisão do Tiago).

**Verificado [V]** (Chrome 153.0.8010.12 headless emulando tela de toque, Java 21, Node 22.23.4, no ambiente do Claude; sem celular):
- **Chrome real, toque e teclado de verdade** (página do aluno verdadeira do pacote): `funcional.js` **129/129**: padrão igual ao do 292 byte a byte; linha e painel no lugar certo; **cada uma das 19 escolhas** com toque (desenho do topo, chave gravada por conta, rádio, status, linha, evento, e as medidas de tamanho acima); persistência depois de recarregar; isolamento por conta; disco cheio; valores estranhos; recriação do Perfil sem duplicar; teclado; **cor em 9 cores × claro/escuro (e 3 cores livres): topo = WhatsApp = sino = cor do app; linha e 19 desenhos da grade = cor das linhas vizinhas**; larguras 320 a 430 e letra grande (alvos de toque ≥ 48 px, sem estouro); "reduzir movimento"; nenhum erro de JavaScript.
- **Contraste do desenho sobre o quadradinho** (medido nos pixels; normal / marcado): rosa 4,76/4,51 · vermelho 4,92/4,58 · laranja 8,33/7,25 · amarelo 12,88/10,51 · verde 9,89/8,34 · ciano 9,58/8,09 · azul 5,44/4,87 · roxo **3,27/3,10**. O roxo é o mais baixo: passa de 3:1 (mínimo para elementos de interface) e **fica abaixo de 4,5:1**.
- **Os 149 testes do 292 (sino) contra a página do 294:** **149/149**. O topo, a janela "Como foi hoje?" e o fluxo do feedback seguem como no 292.
- **Matriz de geometria do topo** (larguras de 320 a 430, 9 nomes, 3 tamanhos de letra, com e sem o ícone do grupo): escuro **324 casos**, claro **108** (larguras 320 e 412): nome partido 0, fora da tela 0, sobreposição 0, estouro 0, tamanho errado 0; **sem pendência 324/324 e 108/108 idênticos ao 291**. Números iguais aos do 292 (nome com mais linhas que no 291 em 82 e 30, igual em 217 e 57; ícones na linha de baixo em 25 de 324 e 21 de 108; a mesma matriz do claro, rodada também no 292, deu exatamente 21, 30, 57 e 108/108): o ícone novo não muda a geometria.
- **Tela do professor** (`professor.js` + paridade das janelas): mesmo estilo calculado completo e mesmo retângulo em todos os elementos, as regras novas não alcançam nenhum, sem elemento do ícone, sem erro: **17/17**; paridade 292 × 294 das **38 janelas em 10 configurações (5 temas × claro/escuro), 0 diferenças**, com toque e com mouse.
- **Teste do teste:** **33 defeitos propositais** na página do 294 (15 de comportamento, 4 de cor, 6 de tamanho, 8 de forma e leitura), todos pegos pelo `funcional.js`, cada um pelo motivo certo.
- **Teste automático** (`icone-feedback.smoke.cjs`): **72/72** (pacote e escopo; os 19 caminhos com SHA-256 e a caixa de cada um dentro da grade; nenhuma cor própria; varredura do código novo contra uma lista de usos proibidos; invariantes do estilo; gerador; sabotagens do pacote, do código e do estilo, inclusive cor fixa, tamanho errado e manifesto adulterado).
- **Código Java real do aplicativo:** **149 verificações**: o pacote é igual, byte a byte nas duas páginas, à correção por área que o aplicativo aplicaria (`UpdateAreaPatch.apply/inverse`); a regra do componente compartilhado recusa o estilo só no aluno e a cópia do professor diferente da do aluno; o `UpdateManager` real dá "Revisar atualização" ao instalar o 294 sobre o 288, o 291, o 292 e sobre um aparelho que já recebeu as correções da `main`, e "Revisar restauração" ao voltar do 294 para o 292; importar o 294 de novo é ignorado ("já está instalado"); e a tabela de retenção acima.
- **Testes oficiais do Android** (`tests/verify_*.cjs`, 18): **18/18** com as páginas do 294.
- **Conferência visual** (montagens do `montagem.py`, olhadas uma a uma): padrão antes/depois; 19 desenhos no topo ao lado do WhatsApp e do sino; as 9 cores em escuro e claro; painel em 4 cores; Perfil; 320 px.

**Achados fora do escopo (não mexi):**
- [V] Em Meu perfil, as linhas **Sons do treino, Pet e Atualizações** apareceram **sem ícone** no meu teste do 293 (o SVG delas media 0×0). **Não reexaminei neste pacote** e não sei se acontece no celular do Tiago ou só no ambiente de teste.
- [V] Herdado do 292: o número do botão do feedback tem borda escura fixa (`#0a151e`), que no modo claro aparece como um anel escuro em volta do número; as iniciais do avatar ficam escuras sobre fundo escuro no meu ambiente de teste (igual no 292).
- [V] **Cores claras sobre fundo claro:** no modo claro, amarelo, ciano e o cinza do tema preto ficam pouco contrastados com o fundo da página no WhatsApp, no sino e nas linhas do Perfil (visível nas montagens; não medi). O botão novo segue a mesma cor, que é o que "acompanhar a cor do app" significa. Os quadradinhos do painel são escuros para não herdar o limite. É característica do aplicativo, não do ícone.

**Aprovado [A]:** nada ainda. Falta a aprovação do Tiago (e o teste no aparelho).

**Hipóteses [H]:**
- A leitura do pedido (escolha do aluno, em Meu perfil, no aparelho) está certa em ~75%.
- "Três carinhas" foi desenhada em triângulo (não em fila, que ficava pequena e coberta pelo número) e é visualmente mais leve que os outros; "Conversa" tem a composição espelhada para não ter o rabo do balão sob o número. Escolhas de desenho, não requisitos.
- Como o pacote chega ao app web dos alunos (o iPhone da Jéssica) o ambiente do Claude não alcança (são sites da conta do ChatGPT dele). Se for pelo mesmo caminho dos pacotes anteriores, vale igual (~70%; não verificado).
- **iPhone/Safari:** sem imagens, o risco do 293 (WebP) deixou de existir; SVG com `currentColor` e `fill-rule="evenodd"` é suportado por todos os navegadores atuais (~92% de que renderiza como no Chrome). Não testado em aparelho, nem no WebView do Xiaomi.

**Áreas de risco tocadas:** feedback do aluno (só o desenho do botão do topo e a tela de escolha; nenhum dado, resposta, envio, fila, Firebase ou lista foi alterado), Meu perfil (uma linha e um painel novos), atualizações (pacote completo e componente compartilhado `ap-feedback-css`). **Não tocadas:** descanso do treino, cronômetros, alarmes, notificações da tela bloqueada, alunos, treinos, agenda, financeiro, avaliações, sincronização.

**Como reverter:** Central de atualizações → ⋮ → "Restaurar versão anterior", ou reimportar o 1.12.292 (o aplicativo avisa "Revisar restauração"; o ícone volta ao balão simples e tudo o mais fica). A escolha gravada no aparelho fica guardada sem efeito. Nenhum dado de aluno é afetado. Neste PR basta fechar.
