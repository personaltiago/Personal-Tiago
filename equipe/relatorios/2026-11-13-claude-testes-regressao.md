# Testes de regressão (presença de funcionalidades) — Claude — 13/11/2026

**Branch:** `claude/testes-regressao`, criada a partir da `main` em `644febf` (merge do PR #2)
**Pedido do Tiago:** criar o inventário das funcionalidades exigidas, um teste automático de presença, o registro das duas regressões conhecidas e este relatório. Nada do aplicativo foi alterado.

Legenda:
- **[V]** verificado;
- **[A]** aprovado pelo Tiago;
- **[H]** hipótese.

## Arquivos criados (nenhum arquivo existente foi alterado)

| Arquivo | O que é |
|---|---|
| `equipe/funcionalidades-exigidas.json` | O inventário. É a referência do que não pode sumir. |
| `equipe/testes/verificar_funcionalidades.py` | O teste. Lê o ZIP **sem extrair e sem alterar nada** e confere o inventário. |
| `equipe/testes/testar_verificador.py` | O autoteste. Cria cópias **modificadas** do ZIP numa pasta temporária nova e confere se o teste reprova o que deve reprovar. |
| `equipe/relatorios/2026-11-13-claude-testes-regressao.md` | Este relatório |

**Não alterado [V]:**
- o ZIP (SHA-256 `1c18f93a…8f6ec6f`, o mesmo da `main`);
- APKs, HTML, JavaScript, Java, workflows e chaves.

## O inventário (`funcionalidades-exigidas.json`)

Foi gerado a partir do ZIP da `main`: **Android 1.204 / conteúdo 1.12.268 / sequência 374** [V].

- **Blocos com id de cada tela, com o número de ocorrências** (o teste reprova se houver menos):
  - `index.html`: 121 ids;
  - `professor.html`: 133;
  - `avaliacoes.html`: 24;
  - `cadastro.html`: 14.

  Aqui entram todos os blocos de financeiro (`ap-finance-*`, `ap-pix-receipt*`, `ap-billing-model`), fichas (`ap-workout-*`, `ap-cardio-*`), pets (`ap-student-mascot*`, `ap-mascot-*`), atualizações (`ap-release-center`, `ap-update-safety`, `ap-modular-*`), armazenamento (`ap-native-store`, `ap-native-mirror`, `ap-storage-meter`, `ap-save-guard`) e sons e descanso (`ap-timer-compatibility`, `ap-rest-floating`, `ap-workout-audio`, `ap-workout-audio-settings`).
- **Marcadores**, ou seja, funções e textos que precisam existir. Cada um foi conferido presente na 1.204 [V].
  - **Descanso:** `saveWorkoutRest`, `openWorkoutRest`, `cancelNativeWorkoutRest`, `startTeacherSeriesRest`, `completeWorkoutSeriesCheck`, `APTimerCompatibility`, `Android.startWorkoutRest`.
  - **Fichas:** `downloadSelectedWorkout`, "Frequência de treinos".
  - **Professor:** `renderTrainerProfile`, `updateTrainerPhotoPreview`, `studentInitials`, `trainer-photo-initials`, "Remover foto", `APprepareTeacherDocument`.
  - **Histórico:** o limite de 200.
  - **Backup:** `APFullBackupCore`, "Criar e salvar backup", "Restaurar os dados conferidos".
  - **Pets:** escolha de capivara, gato e lobo; a migração de urso e galo para gato; `APMascotAssetCodec`.
  - **Aluno:** `toggleExerciseSet`, `APStudentModel`.
  - **Avaliações:** os três mascotes originais e as fontes do PDF.
- **Java:**
  - as 48 classes de `app/src/main/java/com/tiagolima/agendapersonal/`;
  - os **70 métodos da ponte** (`@JavascriptInterface`) da `MainActivity`, entre eles `startWorkoutRest`, `startStudentRest`, `cancelWorkoutRest`, `nsRead`, `nsWrite`, `nsActivate`, `mirrorSave` e `getTimerOverlayStatus`.
- **Atualizações:** os módulos `pets/gato`, `pets/lobo` e `pets/capivara` em `UpdateAreaPatch`, e os mesmos pets em `update-catalog.js`.
- **Arquivos obrigatórios:**
  - `update-catalog.js`;
  - `student_workout_rest.js`;
  - o som do fim do descanso;
  - o layout `notification_rest_countdown.xml`;
  - `native-release.agenda.json`;
  - `tests/run_all.py`;
  - `tools/check_release.cjs`.

## Regressões conhecidas registradas (não reprovam a 1.204)

| id | O que é | Presente até | Ausente desde | Pendência |
|---|---|---|---|---|
| `audio-opcoes-treino` | Bloco `ap-workout-audio-options-ui` em `professor.html` (vários áudios e volume) | 1.197 / 1.12.267 | 1.199 / 1.12.268 | ESTADO 4.1 |
| `audio-opcoes-treino-aluno` | O mesmo bloco em `index.html` (**achado novo nesta tarefa [V]**: o módulo também existia na tela do aluno na 1.197) | 1.197 | 1.199 | ESTADO 4.1 |
| `guardar-agenda-telefone` | Texto/botão "Guardar a agenda no telefone" em `professor.html` | 1.197 | 1.199 | ESTADO 4.2 |
| `guardar-agenda-telefone-ativacao` | A chamada `nsActivate` na tela. O método nativo `nsActivate` continua exigido na ponte. | 1.197 | 1.199 | ESTADO 4.2 |

Comportamento:
- Uma ausência conhecida **não reprova**.
- Se ela voltar, o teste **avisa** para movê-la para os exigidos.
- Com `--estrito`, isso também reprova, para forçar a atualização do inventário.

## Testes executados e resultados [V]

1. **Verificador na `main` atual** (`python3 equipe/testes/verificar_funcionalidades.py`):
   - Android 1.204 / 1.12.268 / 374;
   - **455 itens exigidos presentes**, 4 ausências conhecidas ausentes conforme documentado;
   - **APROVADO**: 0 falhas, 0 avisos, código de saída 0.
2. **Autoteste** (`python3 equipe/testes/testar_verificador.py`): **9/9 casos corretos.**
   1. A 1.204 sem modificação é aprovada.
   2. O bloco `ap-finance-wallet` removido → reprova.
   3. `function saveWorkoutRest` removida → reprova.
   4. A migração urso/galo → gato removida → reprova.
   5. O método da ponte `startWorkoutRest` removido do Java → reprova.
   6. A classe `NativeStore.java` removida → reprova.
   7. O pet "lobo" removido de `update-catalog.js` → reprova.
   8. `ap-workout-audio-options-ui` reaparecendo → aprova **com aviso** de "parece RESTAURADA".
   9. O mesmo caso com `--estrito` → reprova.
3. **Verificador no ZIP antigo 1.197** (conferência cruzada, não faz parte do repositório):
   - as **4 ausências aparecem como "VOLTOU A EXISTIR"**, o que confirma que o registro das regressões está certo;
   - **1 falha**: `ap-workout-audio-settings` não existe na 1.197.

   Esse resultado é correto: o bloco antigo de ajustes de áudio foi **trocado** pelas opções novas na 1.197, e a 1.199 fez a troca inversa. Isso mostra que **restaurar as opções de áudio vai exigir uma decisão sobre `ap-workout-audio-settings`**. Ou os dois convivem, ou o inventário é atualizado no mesmo PR.

## Limitações [H]

- O teste confere **presença**, não **funcionamento**. Um bloco pode existir e estar quebrado. O funcionamento continua coberto por `tests/run_all.py` (que passou na 1.204), pela simulação no emulador e pela validação no aparelho.
- Marcadores de texto podem dar falso positivo, se o texto continuar presente em outro lugar, ou falso negativo, se a função for só renomeada.
- O teste **ainda não roda sozinho** em PR. Para isso é preciso um workflow de testes, que fica para um PR próprio, com aprovação do Tiago, sem mexer nos workflows de assinatura.
- Blocos **novos** (fora do inventário) só geram aviso. Eles entram no inventário pelo PR que os cria.

## Como reverter

Esta branch só acrescenta arquivos em `equipe/`. Para reverter, basta fechar o PR sem merge ou, depois do merge, fazer `git revert` do merge. O app não é afetado em nenhum caso.

## Próximo passo sugerido

1. Revisão cruzada do ChatGPT neste PR.
2. Num PR próprio: um workflow `testes-regressao.yml` que roda em `pull_request` e executa `verificar_funcionalidades.py`, `testar_verificador.py`, `tests/run_all.py` e `tools/check_release.cjs`. Ele **não faz commits** e **não usa segredos**.
