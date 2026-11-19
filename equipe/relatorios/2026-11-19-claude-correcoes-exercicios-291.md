# Correções de exercícios incluídas no pacote completo (1.12.291) — Claude — 19/11/2026

**Branch / commit / versão:** `claude/correcoes-exercicios` (empilhada na `claude/janelas-como-pagina`, PR #18) / pacote **1.12.291**, sequência **397**, sem assinatura (a assinatura é do fluxo do GitHub, que só o Tiago aciona). O pacote não está no repositório: é gerado por `tools/gerar-correcoes-exercicios-1.12.291.cjs` e entregue ao Tiago para subir na raiz da `main` com o nome exato.

**Pedido do Tiago (19/11, 12:08):** "verificar todas as atualizações que estão lá no site e gerar um APK com todas elas já embutidas, porque quando eu instalo está desinstalando as que já estão lá, por exemplo a dos exercícios".

**Causa [V]:** um pacote completo (`.agenda.json` com as quatro páginas) **substitui as páginas inteiras**. Os pacotes completos 1.12.273 a 1.12.288 foram feitos sem as correções 01 (Catálogo unificado), 02 (Baixar catálogo) e 03 (Duplicatas e exclusão). Instalar qualquer um retira as três. O código Java real do aplicativo mostra: 288 sobre as três = "Revisar restauração", e os três blocos de `professor.html` voltam ao que eram.

**Decisão: pacote consolidado, não APK.**
- O pedido (as correções ficarem) se resolve com **um pacote completo que já as contenha**. Foi o que se fez.
- Um APK instalado por cima não apaga as atualizações já instaladas (`files/updates/active.json` não é limpo na troca de APK), então não resolveria nada [H: ~85%; o código do aplicativo apoia, mas não foi testado em aparelho]. Além disso, o APK só pode ser compilado e assinado pelo fluxo do GitHub (sem SDK do Android no ambiente de trabalho do Claude), e `tools/check_release.cjs` fixa 1.207 / 207 / 1.12.269 / 375.
- Se o Tiago ainda quiser um APK, é tarefa à parte e depende de aprovação.

**Arquivos e blocos alterados (neste PR, só ferramentas e testes; nenhum `.agenda.json` na raiz):**
- `tools/gerar-correcoes-exercicios-1.12.291.cjs` — gerador.
- `equipe/testes/correcoes-exercicios.smoke.cjs` — teste automático do pacote (29 verificações, 18 mutantes do gerador, todos pegos).
- `equipe/testes/correcoes-exercicios.java.py` + `equipe/testes/java/CorrecoesExerciciosHarness.java` — teste com o código Java real do aplicativo (89 verificações).
- `equipe/testes/navegador/correcoes-exercicios/` — teste no Chrome real (51 verificações) e LEIA-ME.

**O que o pacote muda:** só `professor.html`, só os blocos `ap-workout-instructions` (01), `ap-workout-export` (02) e `ap-workout-corrections` (03), trocados inteiros pelo texto das correções. `index.html`, `avaliacoes.html`, `cadastro.html`, dados, Firebase, descanso, cronômetros, alarmes e notificações: não mudam. O histórico de correções ganha três registros (03, 02, 01), como o aplicativo gravaria ao instalar uma a uma.

**Numeração:** o aplicativo soma 1 à versão e 1 à sequência por correção instalada. Três correções sobre o 1.12.288 (seq 394) dão **1.12.291 (seq 397)**. Usar exatamente esse número evita "Revisar restauração" em qualquer aparelho que já tenha uma, duas ou as três instaladas por arquivo (com as três e conteúdo igual, o aviso é "já está instalado"). **Os próximos pacotes completos devem partir deste: versão a partir de 1.12.292, sequência a partir de 398.** Não importar o 1.12.288: o 291 o substitui.

**O que se perde (se algo):** nada. Quem já instalou alguma das três por arquivo não perde nada (conteúdo idêntico). Raposinha (outra correção do site) **não** está incluída: conflita com o conteúdo atual e está ausente de todos os pacotes; precisa de decisão do Tiago.

**Verificado [V]** (Chrome 153 headless e Java 21 no ambiente do Claude; sem celular):
- Código Java real do aplicativo: 89 verificações; o 291 é igual ao que o aplicativo produz instalando 01, 02 e 03; 4 variantes sabotadas do pacote são recusadas.
- Chrome real, toque de verdade: 51/51 (unificação, TXT com ponte, sem ponte e com falha, geometria no escuro e no claro, duplicatas, exclusão que preserva alunos, fichas, histórico, vídeo e vínculo, persistência ao reabrir).
- Regressão no Chrome (288 × 291): 0 diferenças nas 38 janelas em 10 configurações; extras 19/19; geometria 0 falhas; conteúdo longo 33/33; vazamento de rolagem 0/24.
- Testes oficiais do Android (`tests/verify_*.cjs`, 18): 18/18 com as páginas do 291, igual à base e ao 288.

**Aprovado [A]:** nada ainda. Falta a aprovação do Tiago (e o teste no aparelho).

**Hipóteses [H]:**
- A versão "1.12.288" que o Tiago viu às 11:29 era provavelmente o 286 mais as correções 01 e 02 (~75%; não confirmado).
- Instalar o 291 no Xiaomi segue o mesmo caminho dos pacotes anteriores (Central de atualizações), mas o 291 não foi instalado em aparelho nenhum.
- Receber e gravar o TXT do "Baixar catálogo" no Xiaomi não foi testado (a ponte `saveBase64File` foi simulada).

**Áreas de risco tocadas:** fichas e armazenamento (o catálogo de exercícios e a exclusão "suave" `catalogRemoved`; alunos, fichas, histórico, execuções e pagamentos não mudam, conferido no teste), atualizações (pacote completo e histórico de correções). Cronômetros, alarmes, descanso, notificações, financeiro e pets: não tocados.

**Como reverter:** reimportar o 1.12.288 na Central de atualizações (o app avisa "Revisar restauração", e as três correções saem), ou instalar um pacote posterior que não as tenha. Os dados dos alunos não são afetados por nenhuma das duas. Neste PR basta não fazer o merge.
