# Agenda Personal — análise técnica do Claude para a colaboração com o ChatGPT

**Data:** 13/11/2026
**Repositório:** `personaltiago/Personal-Tiago` (público), branch `main`
**Nesta análise:** nada foi alterado no repositório. Nenhuma branch foi criada, nada foi publicado e nenhuma chave foi tocada.

**Transparência:** mais cedo hoje, antes desta missão e com autorização do Tiago, o Claude enviou commits direto na `main`:
- os ZIPs das versões Android 1.197, 1.200 a 1.204;
- a pasta `ponte/`;
- a pasta `simulacao/` e o workflow `simular-descanso.yml`.

Esses commits aparecem no histórico com o autor "Claude". O workflow de simulação também faz commits automáticos, com o autor "simulacao-agenda".

Legenda: **[V]** = verificado diretamente · **[H]** = hipótese, ainda não comprovada.

---

## 1. O que o Claude consegue acessar

| Item | Estado |
|---|---|
| Clonar e ler o repositório (git, via proxy da sessão) | **[V]** |
| Histórico de commits (últimos 50) | **[V]** |
| Ler a API pública do GitHub sem login (repositório, releases, execuções do Actions, PRs) | **[V]**, com limite de cerca de 60 consultas por hora |
| Ler os **logs** do Actions e baixar **artifacts** | **Não.** A API exige login. Só vejo o status de cada passo. |
| Ver os segredos do repositório (`ANDROID_KEYSTORE_*`) | **Não**, e não deve ver. |

---

## 2. Estrutura do aplicativo [V]

**O código-fonte não fica solto no repositório.** O projeto Android inteiro fica dentro do arquivo:

```
AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip   (≈13 MB, 157 arquivos)
```

Versão atual na `main`: **Android 1.204**, conteúdo **1.12.268**, sequência 374.

Dentro do ZIP:

- `app/src/main/java/com/tiagolima/agendapersonal/`, o código Java:
  - `MainActivity` (WebView + ponte `@JavascriptInterface`, objeto `Android`);
  - `AlarmScheduler`, `AlarmReceiver`, `AlarmStore`, `WorkoutRestAlarmService` (alarmes e descanso);
  - `LessonTimerOverlayService` (cartão do descanso e faixa flutuante);
  - `UpdateManager`, `UpdateAreaPatch`, `UpdatePackageTrust`, `UpdatePackageSignature` (atualizações);
  - `NativeStore`, `NativeMirror` (armazenamento no telefone);
  - `LocalPages`, entre outras.
- `web/native-release.agenda.json`: as 4 telas (`index.html`, `professor.html`, `cadastro.html`, `avaliacoes.html`) num arquivo só. Os módulos são blocos `<script id="ap-...">` e `<style id="ap-...">`. Na compilação, `tools/prepare_assets.cjs` grava as telas em `app/src/main/assets/`.
- `app/src/main/assets/update-catalog.js`: a "Conferência de atualizações" (áreas e pets).
- `tools/`:
  - `refresh_release.py` (recalcula os hashes);
  - `check_release.cjs` (confere as versões);
  - `package_github.py` (gera o ZIP);
  - `sign_update.cjs` (assina pacotes);
  - `verify_apk.py`.
- `tests/run_all.py`: roda todos os testes. São Node, Python e Java (javac com stubs, sem Android) e Playwright/Chromium para as telas.

**Sistema de atualizações `.agenda.json`** [V]
- **Formatos:**
  - `agenda-patch/1` e `agenda-patch/2`: troca blocos por `id`, com hashes `before`/`after` em SHA-256. O `/2` acrescenta `module`.
  - O release completo traz `version`, `sequence`, `files` e `modularUpdates`.
- **Assinatura:** o campo `agendaSignature` é verificado com a mesma chave que assina o APK (`UpdatePackageTrust`). Desde a 1.194, um pacote **sem assinatura** só é aceito quando o professor escolhe o arquivo à mão e confirma uma janela. Os downloads pelo servidor continuam exigindo assinatura.
- **Base embutida:** `BASE_VERSION` / `BASE_SEQUENCE` em `UpdateManager`. A regra `baseSeen<seq>` descarta uma vez o conteúdo local mais antigo que a base do APK.

**Arquivos soltos na raiz** [V]
- pacotes `.agenda.json` (alguns já assinados, outros "para assinar");
- ZIPs antigos (`AgendaPersonal_AndroidStudio.zip`, `AgendaPersonal_v1_4_AndroidStudio.zip`);
- a página web/PWA (`cadastro-aluno.html`, `instalar.html`, `manifest.webmanifest`, `service-worker.js`, ícones);
- as pastas `ponte/`, `simulacao/`, `github/` (cópia de workflows) e `AgendaPersonal-TESTE/`.

---

## 3. GitHub Actions e assinatura [V]

| Workflow | Quando roda | O que faz |
|---|---|---|
| `android-apk.yml` "Gerar e publicar APK" | **Só manual** (Run workflow) | Extrai o ZIP, compila com Gradle 8.9 / Java 17, assina com `apksigner` usando os segredos `ANDROID_KEYSTORE_BASE64`, `_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD`, e publica um **Release** `android-<versão>-conteudo-<conteúdo>-<run>` com o APK. O `versionCode` vem do CI. |
| `assinar-atualizacoes-agenda.yml` | Push na `main` que mexe em `*.agenda.json` da raiz, ou manual | Assina o pacote com a mesma chave (`sign_update.cjs`) e entrega como **artifact** (não grava no repositório). |
| `assinar-descanso-aluno.yml` / `assinar-ficha-recolhivel.yml` | Push no próprio arquivo, ou manual | Assinam um pacote específico e entregam como artifact. |
| `simular-descanso.yml` (feito pelo Claude) | Push em `simulacao/*.java`, `*.sh` ou `rodar-agora.txt`, ou manual | Compila em modo debug, liga um **emulador Android 14**, inicia um descanso, bloqueia a tela, tira print e **grava o resultado na `main`** em `simulacao/resultado/`. |

**Riscos** [V]
- **Assinatura automática:** qualquer `*.agenda.json` enviado à `main` é assinado sozinho.
- **Workflows que gravam na `main`:** `simular-descanso.yml` grava na `main`, e `android-apk.yml` tem permissão `contents: write` para criar releases.

---

## 4. O que o Claude consegue fazer no GitHub

| Ação | Estado |
|---|---|
| Criar branch e enviar commits (`git push`) | **[V]**. O teste `git push --dry-run` para `claude/teste-colaboracao` foi aceito. A branch **não** foi criada de verdade, para cumprir a regra desta análise. Também já enviei commits reais na `main` hoje. |
| Modificar arquivos (inclusive o projeto dentro do ZIP) e rodar os testes do projeto localmente | **[V]** |
| Disparar workflows por push (os que têm gatilho de push) | **[V]** |
| Ler status de execuções e releases | **[V]**, pela API pública |
| **Abrir Pull Request, comentar, aprovar** | **Não.** Não tenho login na API; o `gh` desta sessão não autentica. |
| Apertar "Run workflow" (workflow_dispatch) | **Não**, pelo mesmo motivo. |
| Ler logs e baixar artifacts (APK, pacotes assinados) | **Não** |
| Compilar o APK aqui | **Não.** A rede da sessão bloqueia o kit do Android (Google/Maven). A compilação real só acontece no GitHub Actions. |
| Emulador Android aqui | **Não** (sem KVM). Só pelo `simular-descanso.yml` no GitHub. |
| Testar no aparelho Xiaomi real | **Não.** Só pelos prints e vídeos do Tiago. |

**Outras limitações**
- Cada sessão do Claude é temporária: o contexto vem do repositório e do que o Tiago repassa.
- **[H]** Não sei se o ChatGPT consegue `git push`, abrir PRs ou ler logs. Isso precisa ser confirmado do lado dele.

---

## 5. Proposta de colaboração com o GitHub como centro

### 5.1 Problema principal: o código dentro de um ZIP
Um PR que troca o ZIP mostra só "arquivo binário alterado", e ninguém consegue revisar a diferença. **Proposta:**
1. Colocar o projeto **descompactado** numa pasta do repositório, por exemplo `app-fonte/`, numa branch própria e por PR.
2. Um workflow gera o ZIP a partir dessa pasta, para manter o fluxo atual do APK.

Até isso existir, cada mudança precisa vir com um **patch em texto** ao lado do ZIP.

### 5.2 Branches
- `main`: só o que o Tiago aprovou.
- `chatgpt/<assunto>` e `claude/<assunto>`: o trabalho de cada assistente.
- Nunca enviar direto na `main`, nem mesmo a simulação. Proposta: mudar o `simular-descanso.yml` para gravar o resultado na própria branch do teste.

### 5.3 Pull Requests (adaptado às limitações do Claude)
- Quem tem acesso à API (o ChatGPT, se puder, ou o Tiago) abre o PR a partir da branch.
- O Claude revisa lendo a branch e grava a revisão como **arquivo** no repositório. O Tiago pode colar o resumo no PR.
- Só o **Tiago** faz o merge na `main`.

### 5.4 Relatórios no repositório (seção 6) e testes automáticos em todo PR (seção 7).

---

## 6. Registro de relatórios técnicos

```
equipe/
  ESTADO.md            # versão aprovada atual (Android/conteúdo/sequência), funcionalidades aprovadas, pendências
  REGRAS.md            # o que nunca pode mudar (assinatura, nomes de arquivo, fluxo do APK, preferências do Tiago)
  relatorios/
    2026-11-13-claude-analise-inicial.md
    AAAA-MM-DD-<autor>-<assunto>.md
  revisoes/
    PR-<n>-<revisor>.md
```

Modelo de relatório (curto e obrigatório em toda mudança):
```
# <assunto> — <autor> — <data>
Branch / versão: ...
Pedido do Tiago: ...
O que mudou (arquivos e blocos ap-...): ...
Verificado [V]: testes rodados, simulação, prints
Hipóteses [H]: ...
Risco de regressão: cronômetros | alarmes | fichas | financeiro | pets | atualizações | armazenamento
Como reverter: ...
```

---

## 7. Como impedir regressões

1. **Workflow de testes em todo PR** (proposta, ainda não existe). Ele extrai o ZIP ou usa `app-fonte/` e roda:
   - `tests/run_all.py` (hoje passa com o código da 1.204 [V]);
   - `tools/check_release.cjs`;
   - `gradle assembleDebug`.

   Se falhar, o PR não entra.
2. **Proteção da `main`** (o Tiago liga em Settings → Branches): exigir PR e exigir que os testes passem.
3. **Testes por área de risco.** Os que já existem estão no `run_all.py` [V]. As lacunas são **[H]**, a serem confirmadas.

   | Área | Testes que já existem [V] | Lacunas [H] |
   |---|---|---|
   | Cronômetros e descanso | `simular-descanso.yml`, no emulador | Rodar em todo PR que mexa em `AlarmScheduler` ou `LessonTimerOverlayService`. Prints guardados como referência. |
   | Alarmes | testes Java de agendamento; `soundIssue` | Caso "Alarmes e lembretes" desligado (a simulação já cobre) |
   | Fichas de treino | — | Exportar TXT, ficha recolhível, histórico |
   | Financeiro | — | Mensalidades, carteira, Pix |
   | Pets | `verify_pets_removed` (só capivara, gato e lobo) | Desenho idêntico antes e depois (já foi feito à mão em 192 combinações) |
   | Atualizações | `verify_update_import_review`, `verify_update_menu` e testes de assinatura | — |
   | Armazenamento | `verify_native_store`, `native_mirror`, `history_limit` | — |

4. **Inventário de blocos.** Uma lista dos ids `ap-*` de cada tela, com hash, para que a remoção acidental de um bloco seja detectada no PR.
5. **Regra de ouro:** nenhuma mudança troca um bloco inteiro "voltando a uma versão antiga" sem listar o que se perde. Exemplo: a 1.199 voltou os sons do treino à 1.178 e com isso tirou as opções de áudio.

---

## 8. Primeiro teste seguro de colaboração

Sem tocar no app, no APK, na `main` nem nas chaves:

1. O **Claude** cria a branch `claude/teste-colaboracao` com um único arquivo: `equipe/relatorios/2026-11-13-claude-analise-inicial.md` (este documento).
2. O **ChatGPT** lê essa branch e responde num arquivo próprio, `equipe/relatorios/2026-11-13-chatgpt-resposta.md`, na branch `chatgpt/teste-colaboracao`. Na resposta ele confirma:
   - se consegue fazer push;
   - se consegue abrir PR;
   - se consegue ler logs do Actions.
3. Quem puder abre um **PR** da branch do ChatGPT para a do Claude (não para a `main`). O Claude lê e escreve a revisão em `equipe/revisoes/`.
4. O **Tiago** confere que a `main` ficou intocada e fecha o PR sem merge.

Isso comprova leitura cruzada, escrita em branch, PR e revisão, com risco zero para o app. Basta o Tiago autorizar o passo 1.

**Atenção:** o workflow `assinar-atualizacoes-agenda.yml` roda com qualquer `*.agenda.json` na raiz da **`main`**. Nenhum teste deve colocar `.agenda.json` na raiz.
