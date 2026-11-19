# Sino do feedback no topo do aluno (1.12.292) — Claude — 19/11/2026

**Branch / commit / versão:** `claude/sininho-feedback` (empilhada na `claude/correcoes-exercicios`, PR #19) / pacote **1.12.292**, sequência **398**, sem assinatura (a assinatura é do fluxo do GitHub, que só o Tiago aciona). O pacote não está no repo.

**Pedido do Tiago (19/11, 18:14, ditado, com um print do pet e uma foto do Início da Jéssica no iPhone):** o feedback pendente aparece só embaixo, dentro do pet, e muita gente não vê; ele quer no topo do Início "como se fosse o sininho, mas o próprio do feedback", com o número 1, 2, 3.

**Leitura adotada [H, ~85%]:** um botão só do feedback, ao lado do sino de notificações, com o número de pendentes; tocar abre a janela do feedback direto. O pedido é ditado e tem frases soltas ("em vez de nós ficar lá"); a leitura foi dita ao Tiago antes de construir. O aviso vermelho dentro do pet **continua como estava** (tirar seria outra decisão dele).

**Decisões de desenho:**
- Ícone de **balão**, não um segundo sino: dois sinos lado a lado se confundem.
- O botão existe **só com feedback pendente** e conta de aluno; sem pendência o topo é o de antes, medido idêntico.
- Número = o do aviso do pet (`APFeedbackSync.pending()`, o mesmo limite de exibição de 7). O histórico dos já respondidos fica na janela, como antes.
- Cor de destaque do aluno; número branco como o do sino de notificações, escuro só quando o branco ficaria abaixo de 3:1.
- **Espaço dos ícones:** de 13 px para 4 px, só enquanto o botão aparece. Com 8 px, "Olá, Jéssica!" passava para duas linhas (a foto do Tiago é essa tela); com 4 px o nome fica igual ao de hoje em 217 de 324 combinações (eram 165). Quando não cabe, os ícones descem para a linha de baixo, sem cortar o nome.

**Arquivos (neste PR, só ferramentas e testes; nenhum `.agenda.json` na raiz):**
- `tools/gerar-sininho-feedback-1.12.292.cjs` — gerador (parte do 291, SHA-256 `7153e570…9fa0`).
- `equipe/testes/pacote-291.cjs` — acha (ou refaz) o 291, sempre conferido pelo SHA-256.
- `equipe/testes/sininho-feedback.smoke.cjs` — teste automático do pacote (35 verificações).
- `equipe/testes/sininho-feedback.java.py` + `equipe/testes/java/SininhoFeedbackHarness.java` — teste com o código Java real do aplicativo (58).
- `equipe/testes/navegador/sininho-feedback/` — Chrome real (funcional 149, geometria 324 + 108, professor 17, mutantes 10), `preparar.cjs`, `capturas.js`, `montagem.py` e LEIA-ME.

**O que o pacote muda (só dois arquivos, três blocos, cada bloco trocado inteiro):**
| Arquivo | Bloco | Antes (SHA-256 do texto) | Depois |
|---|---|---|---|
| `index.html` | `ap-feedback-student` | `fc36fe70…ede` | `0730944c…3760` |
| `index.html` | `ap-feedback-css` | `d441d2ff…36f1` | `e0407658…7376` |
| `professor.html` | `ap-feedback-css` | `d441d2ff…36f1` | `e0407658…7376` (mesmo texto) |
`index.html` 2.372.807 → 2.375.350 caracteres (+2.543); `professor.html` 4.730.648 → 4.731.583 (+935); `avaliacoes.html`, `cadastro.html` e `modularUpdates` idênticos. Pacote: 19.167.758 bytes, **SHA-256 `82f41147ea8b47609483817506756ed1c1560c0dc7c718eed83b8e0224e687fb`**, duas gerações idênticas.

**Achado importante (componente compartilhado) [V]:** `ap-feedback-css` está em `UpdateAreaPatch.SHARED` do aplicativo, que só aceita a correção se o aluno e o professor receberem o **mesmo** texto. Por isso o `professor.html` também muda (mesmas 8 regras). Elas só valem dentro da tela inicial do aluno (`.student-home …`, `.ap-feedback-bell`, `#apFeedbackBellCount`), que não existe no professor: o `professor.html` do 291 tem zero ocorrências de `student-home`, `home-header` e `--home-accent`. Conferido no Chrome (abaixo). Foi descoberto no meio do trabalho e o gerador, o teste automático e o teste Java foram refeitos para esse invariante.

**Numeração:** 291 (seq 397) + 1 = **1.12.292 (seq 398)**; sequência = número da versão + 106. O pacote é completo e cumulativo: **inclui o 291** (as três correções de exercícios) e deve ser instalado **no lugar dele**. O próximo pacote completo parte do 292 (versão a partir de 1.12.293, sequência a partir de 399).

**Verificado [V]** (Chrome 153 headless, Java 21, Node 22 no ambiente do Claude; sem celular):
- **Chrome real, toque de verdade** (página do aluno verdadeira do pacote): `funcional.js` **149/149** (sem pendência = topo de sempre; 1, 2, 3, 5 e 7 pendentes; atualiza ao vivo; toque abre a janela direto no pedido mais recente; foco, Voltar do sistema e `back()`; responder derruba o número só quando o servidor confirma, e envio recusado o mantém; sem conta, visualização pelo professor, troca de conta e área desligada: sem sino; contraste do número nos cinco temas e em cores livres, escuro e claro; tudo o que não é o sino igual ao 291; nenhum erro de JavaScript).
- **Matriz de geometria** (6 larguras de 320 a 430, 9 nomes, 3 tamanhos de letra, com e sem o ícone do grupo): escuro **324 casos**, claro **108 casos**: nome partido 0, fora da tela 0, sobreposição 0, estouro 0, tamanho errado 0; sem pendência **432 de 432** idênticos ao 291. Custo do desenho: ícones descem em 25 de 324; o nome fica com mais linhas que no 291 em 82 (nomes de 8 letras ou mais, com o grupo, letra grande, tela estreita).
- **Tela do professor** (`professor.js` + paridade das janelas): 4.428 elementos com o mesmo estilo calculado completo e o mesmo retângulo, as 8 regras novas não alcançam nenhum elemento, sem sino, sem erro: **17/17**; paridade 291 × 292 das 38 janelas em 10 configurações: **0 diferenças**, com toque e com mouse; controle: com um fundo injetado de propósito, o mesmo teste acusa as 38.
- **Teste do teste:** 10 defeitos propositais na página do 292, todos pegos pelo `funcional.js`. Um 11º (tirar a guarda `t.uid()`) não pode ser pego: é equivalente (`pending()` já devolve vazio sem conta; objeto congelado). A guarda fica como segurança.
- **Teste automático** (`sininho-feedback.smoke.cjs`): **35/35** (estilo, invariante compartilhado, contraste contra a referência WCAG em 256 cinzas + 400 cores ao acaso + fronteira, gerador, sabotagens).
- **Código Java real do aplicativo:** **58 verificações**. O pacote é igual, byte a byte nas duas páginas, à correção por área que o aplicativo aplicaria (`UpdateAreaPatch.apply/inverse`); a regra do componente compartilhado recusa o estilo só no aluno; `UpdateManager` real: 291 → 292 é "Revisar atualização", 292 → 291 é "Revisar restauração", correção por área instala e a repetida é ignorada; 4 pacotes sabotados recusados.
- **Testes oficiais do Android** (`tests/verify_*.cjs`, 18): **18/18** com as páginas do 292 (e 18/18 com as do 291, como base).

**Achados fora do escopo (não mexi) [V]:**
- Modo claro: "0 exercícios / 0 técnicas" no cartão "Treino ainda não disponibilizado" tem contraste baixo (já era assim).
- O número do sino de notificações é branco sobre qualquer cor de destaque (rosa 3,86:1, azul 3,37:1). O do feedback segue o mesmo desenho para os dois ficarem iguais lado a lado.

**Aprovado [A]:** nada ainda. Falta a aprovação do Tiago (e o teste no aparelho).

**Hipóteses [H]:**
- Como o pacote chega ao app web dos alunos (o iPhone da Jéssica) o ambiente do Claude não alcança (são sites da conta do ChatGPT dele). Se for pelo mesmo caminho dos pacotes anteriores, vale igual (~70%; não verificado).
- Safari/iPhone: o estilo usa `flex-wrap`, `gap` e `display: contents`, todos aceitos no iOS 14.5 ou mais novo; o pet inteiro não aparece no teste. Não testado em aparelho (~85% de que renderiza como no Chrome).
- A leitura do pedido (botão extra, aviso do pet mantido) está certa em ~85%.

**Áreas de risco tocadas:** feedback do aluno (só a tela; nenhum dado, resposta, envio, fila, Firebase ou lista foi alterado), atualizações (pacote completo e componente compartilhado `ap-feedback-css`). **Não tocadas:** descanso do treino, cronômetros, alarmes, notificações da tela bloqueada, alunos, treinos, agenda, financeiro, avaliações, sincronização.

**Como reverter:** Central de atualizações → ⋮ → "Restaurar versão anterior", ou reimportar o 1.12.291 (o aplicativo avisa "Revisar restauração"; o sino sai e as três correções de exercícios ficam). Nenhum dado de aluno é afetado por nenhuma das duas. Neste PR basta fechar.
