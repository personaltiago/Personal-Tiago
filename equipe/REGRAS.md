# Agenda Personal — REGRAS da equipe (Tiago, ChatGPT, Claude)

**Versão:** proposta de 13/11/2026, escrita pelo Claude para revisão do ChatGPT e aprovação do Tiago. Só vale depois do merge aprovado pelo Tiago.

Classificação:
- **[V]** verificado no código, nos workflows ou em testes;
- **[A]** aprovado expressamente pelo Tiago;
- **[H]** hipótese ou ainda não confirmado.

---

## 1. Proteção da `main`

1. **Só o Tiago faz merge na `main`** [A] (condição aceita pelo ChatGPT e pelo Claude em 13/11). Nenhum assistente envia commits direto na `main`.
2. **O Tiago liga a proteção no GitHub** (Settings → Branches → regra para `main`) [H, ainda não ligado]:
   - exigir Pull Request antes do merge;
   - exigir que os testes automáticos passem (seção 5), quando o workflow existir;
   - bloquear push forçado e exclusão da branch.
3. Exceções existentes hoje, que precisam ser corrigidas [V]:
   - O workflow `simular-descanso.yml` grava resultados na `main` (commit automático do autor "simulacao-agenda"). **Correção proposta:** guardar os resultados como **artifact** e rodar a simulação só em branches e PRs.
   - O Tiago envia arquivos pelo site ("Add files via upload") direto na `main`. **Proposta:** enviar para uma branch e abrir PR. Se o upload direto continuar, que seja só o ZIP aprovado.

---

## 2. Branches e Pull Requests

| Branch | Quem usa | Para quê |
|---|---|---|
| `main` | só o Tiago, por merge | versão aprovada |
| `chatgpt/<assunto>` | ChatGPT (ou o Claude publicando em nome dele, identificado no commit) | trabalho do ChatGPT |
| `claude/<assunto>` | Claude | trabalho do Claude |

Fluxo:
1. Cada tarefa começa numa branch nova, criada a partir da `main` atual.
2. O autor escreve o relatório em `equipe/relatorios/AAAA-MM-DD-<autor>-<assunto>.md` (modelo na seção 8).
3. Abre-se um PR para a `main` [V]. O Claude **não consegue** abrir PR (sem login na API do GitHub). O ChatGPT recebeu 403 ao escrever em 13/11. Por enquanto, **o Tiago abre os PRs** pelo site.
4. O outro assistente revisa e escreve em `equipe/revisoes/PR-<n>-<revisor>.md`.
5. O Tiago testa no aparelho quando a mudança mexer em algo visível, e só então faz o merge.
6. Um PR trata **um assunto só**. Nada de "aproveitei e também mudei…".
7. **Proibido:** apagar arquivos ou blocos `ap-*`, ou voltar um módulo inteiro para uma versão antiga, sem listar no PR o que se perde. Foi assim que as opções de áudio sumiram na 1.199 [V].

---

## 3. Assinatura segura

Situação atual [V]:
- O APK é assinado no workflow `android-apk.yml`, que só roda manualmente, com os segredos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD`.
- Os pacotes `.agenda.json` são assinados com a **mesma chave** por:
  - `assinar-atualizacoes-agenda.yml`: **automático** em push na `main` com `*.agenda.json` na raiz;
  - `assinar-descanso-aluno.yml` e `assinar-ficha-recolhivel.yml`: rodam quando o próprio arquivo muda.

Regras:
1. **Nenhum assistente mexe nos segredos, na chave, no keystore ou nos workflows de assinatura** sem um pedido expresso do Tiago naquele PR.
2. **Nenhum `.agenda.json` na raiz da `main`** sem revisão. Um pacote ali é assinado sozinho [V].
3. **Correção proposta [H, a aprovar]:**
   - a assinatura só roda pelo botão (`workflow_dispatch`);
   - só para arquivos da pasta `para-assinar/`;
   - e só depois que o pacote tiver sido revisado por PR.
4. **Pacote sem assinatura:** só por importação manual, com confirmação do professor [A] e [V]. Os aparelhos dos alunos recusam pacote sem assinatura [V].
5. Nenhum assistente publica APK, release ou pacote assinado. **Quem publica é o Tiago.**

---

## 4. Privacidade

1. O repositório é **público** e vira **site** (GitHub Pages) [V]. Tudo o que estiver na `main` pode ser visto por qualquer pessoa.
2. **Nunca** colocar no repositório, em nenhuma branch:
   - backups (`AgendaPersonal_Backup_*.json`);
   - dados, fotos ou comprovantes de alunos;
   - prints com nomes, e-mails ou telefones;
   - PDFs de avaliação.
3. Prints e testes usam só dados fictícios ("Aluno Simulação").
4. Backups do Tiago são tratados só na conversa e devolvidos a ele, nunca enviados ao GitHub.
5. Ao revisar um PR, o revisor confere se entrou algum dado pessoal.

---

## 5. Testes de regressão

O que já existe dentro do ZIP [V]:
- `tests/run_all.py`: passou inteiro na 1.204 em 13/11/2026;
- `tools/check_release.cjs`: confere versões e arquivos;
- `simular-descanso.yml`: emulador Android 14, descanso com a tela bloqueada, dois cenários.

Regras:
1. **Todo PR que mexe no app** informa o resultado de `tests/run_all.py` e de `tools/check_release.cjs`.
2. **Workflow de testes em todo PR (proposta [H]):** extrai o ZIP (ou usa `app-fonte/`, quando existir) e roda:
   - `run_all.py`;
   - `check_release.cjs`;
   - `gradle :app:assembleDebug`.

   Se falhar, o PR fica bloqueado.
3. **Áreas sensíveis.** Mudanças em qualquer uma destas exigem teste específico e validação no aparelho pelo Tiago:

   | Área | Arquivos e blocos | Teste mínimo |
   |---|---|---|
   | Cronômetros e descanso | `LessonTimerOverlayService`, `AlarmScheduler`, `ap-timer-compatibility`, `ap-rest-floating`, `ap-workout-audio*` | `simular-descanso.yml` + teste no Xiaomi com a tela bloqueada |
   | Alarmes | `AlarmScheduler`, `AlarmReceiver`, `WorkoutRestAlarmService`, `AlarmStore` | Com "Alarmes e lembretes" ligado e desligado |
   | Fichas de treino | `ap-workout-*`, `ap-cardio-*` | `reps_by_series`, `drag_reorder` + exportar TXT |
   | Financeiro | `ap-billing-model`, `ap-finance-*`, `ap-pix-receipt*` | `finance` |
   | Pets | `ap-student-mascot*`, `ap-mascot-*`, tabelas em `cadastro.html` | `pets_removed` + capivara, gato e lobo desenhados iguais antes e depois |
   | Atualizações | `UpdateManager`, `UpdateAreaPatch`, `UpdatePackageTrust`, `update-catalog.js` | `update_*`, `native_updates`, `recovery_updates`, `update_center` |
   | Armazenamento e backup | `NativeStore`, `NativeMirror`, `ap-native-store`, `ap-save-guard`, backup | `native_store`, `native_mirror`, `save_guard`, `storage_meter` |

4. **Inventário de blocos (proposta [H]):** uma lista dos ids `ap-*` de cada tela, com hash. Um bloco que some ou muda precisa ser justificado no PR.
5. O que o emulador não reproduz (Xiaomi/HyperOS) é sempre classificado como **[H]** até o Tiago confirmar no aparelho.

---

## 6. Reversão

1. Todo PR descreve **como reverter**: qual versão anterior e qual commit.
2. As versões publicadas ficam nos **Releases** do GitHub (`android-<versão>-conteudo-<conteúdo>-<execução>`) [V]. Para voltar, basta instalar o APK do release anterior. Não é preciso mexer no código.
3. No código: `git revert` do merge do PR, num novo PR. Nunca reescrever o histórico da `main`.
4. **Cuidado com os dados:** voltar para uma versão sem `NativeStore` (por exemplo a 1.178), quando "Guardar a agenda no telefone" foi ativado, faz a agenda parecer vazia [V pelo código]. Antes de voltar versões antigas, fazer backup.
5. Os pacotes de conteúdo (`sequence`) não podem diminuir. A regra `baseSeen<seq>` do `UpdateManager` descarta uma vez o conteúdo local mais antigo que a base [V].

---

## 7. Preservação do ZIP atual

1. `AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip` continua sendo a **fonte oficial** do APK. O `android-apk.yml` compila a partir dele [V] [A].
2. O nome do arquivo não muda [A].
3. O código descompactado (`app-fonte/`) entra **numa branch e por PR**. Só substitui o ZIP como fonte depois de um workflow provar que compilar a partir dele gera o mesmo resultado. A comparação é pela lista de arquivos e pelos hashes das telas e do Java.
4. Todo PR que troca o ZIP precisa trazer, ao lado, a **diferença em texto** (patch ou lista de blocos alterados). Sem isso, a revisão é impossível.
5. Os ZIPs antigos (`AgendaPersonal_AndroidStudio.zip`, `AgendaPersonal_v1_4_AndroidStudio.zip`, `AgendaPersonal-TESTE/`) **não são apagados** sem decisão do Tiago.

---

## 8. Modelo de relatório (obrigatório em toda mudança)

```
# <assunto> — <autor> — <data>
Branch / commit / versão:
Pedido do Tiago:
Arquivos e blocos alterados:
O que se perde (se algo):
Verificado [V]: testes, simulação, prints
Aprovado [A]:
Hipóteses [H]:
Áreas de risco tocadas: cronômetros | alarmes | fichas | financeiro | pets | atualizações | armazenamento
Como reverter:
```
