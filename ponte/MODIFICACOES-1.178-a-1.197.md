# Agenda Personal — todas as modificações desta sessão (Android 1.178 → 1.197)

**Ponto de partida:** ZIP `AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip` com **Android 1.178 / conteúdo 1.12.215**, mais os pacotes de atualização que o Tiago já tinha instalado (até **1.12.255**, sequência 361).
**Ponto de chegada:** **Android 1.197 / conteúdo 1.12.267** (sequência 373).
**Fora deste documento:** a parte do descanso na tela bloqueada (`AlarmScheduler.java` e `LessonTimerOverlayService.java`), a pedido do Tiago.

O código de cada mudança está na pasta `ponte/codigo/` deste repositório:

| Arquivo | O que tem |
|---|---|
| `codigo/android-1.178-para-1.197.patch` | Diferença completa do Java (sem os dois arquivos do descanso). Aplica com `patch -p1` dentro de `app/src/main/java`. |
| `codigo/telas/*.js` / `*.css` | Os blocos novos das telas, exatamente como estão no 1.197. |
| `codigo/telas/professor-index-trechos-alterados.diff.txt` | Os trechos alterados dentro do script principal de `professor.html` e `index.html` (as imagens embutidas aparecem como `<DATA nKB>`). |
| `codigo/remover-urso-galo.cjs` + `codigo/verify_pets_removed.cjs` | O script que removeu o urso e o galo e o teste que confere a remoção. |

---

## Como o conteúdo é organizado (vale para tudo abaixo)

- As quatro telas (`index.html`, `professor.html`, `avaliacoes.html`, `cadastro.html`) ficam consolidadas em **um arquivo só**: `web/native-release.agenda.json`, no campo `files`. Na compilação, `tools/prepare_assets.cjs` escreve as telas em `app/src/main/assets/`.
- **Toda edição de tela** foi feita por script (Python/Node), lendo o JSON, trocando um trecho **que aparece uma única vez** e gravando com a mesma serialização (`ensure_ascii=False`, `separators=(',',':')`). Depois de cada edição: `python3 tools/refresh_release.py` (recalcula os hashes) e `python3 tests/run_all.py` (todos os testes).
- **A cada versão nova** muda o número em 7 lugares:
  - `app/build.gradle` (`versionCode` / `versionName`);
  - `LEIA-ME.txt`;
  - `package.json` e `package-lock.json`;
  - `release.json` (`androidVersion`, `versionCode`, `contentVersion`, `sequence`);
  - `tools/check_release.cjs`;
  - quando o conteúdo muda, também `UpdateManager.java` (`BASE_VERSION` / `BASE_SEQUENCE`) e `version` / `sequence` / `notes` dentro do `native-release.agenda.json`.
- O ZIP para o GitHub é gerado por `python3 tools/package_github.py <saída>.zip`, sempre com o nome fixo `AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip`.

---

## 1. Atualizações já instaladas viraram a base do APK

**Problema:** o APK 1.178 levava o conteúdo 1.12.215. As atualizações que o Tiago já tinha subido (pet do aluno 1.12.229, descanso automático 1.12.238, ficha recolhível 253, 1.12.255…) só existiam como pacotes `.agenda.json` separados.

**O que foi feito:**
- O conteúdo 1.12.255 virou a base do APK. A partir daí, cada versão de conteúdo foi gerada por cima dele.
- **Limite de tamanho de pacote: 24 MB → 32 MB**, porque o pacote completo passou de 24 MB. Mudou em:
  - `UpdateManager.MAX_BYTES`;
  - `UpdateDownloads.LIMIT`;
  - `UpdateExport.LIMIT`;
  - `UpdateManifest` (validação de `size`);
  - `tools/sign_update.cjs`.
- **Regra "base nova vence uma vez"** (`UpdateManager`): na primeira abertura depois de instalar um APK com base mais nova, se o conteúdo guardado no aparelho for de sequência menor que `BASE_SEQUENCE`, ele é descartado **uma vez** e o app usa o conteúdo do APK. A marca fica em `preferences` com a chave `"baseSeen" + BASE_SEQUENCE`. Os dados dos alunos não são tocados.

```java
String seenKey = "baseSeen" + BASE_SEQUENCE;
boolean newerBase = !preferences.getBoolean(seenKey, false);
if (newerBase) preferences.edit().putBoolean(seenKey, true).commit();
if (newerBase && stored.release.optInt("sequence", 0) < BASE_SEQUENCE) { new AtomicFile(activeFile).delete(); storedRelease = null; return null; }
```

---

## 2. Armazenamento — etapa 1: cópia de segurança nativa + medidor de espaço

**Problema:** toda a agenda fica no `localStorage` do WebView, que tem limite de cerca de 5 MB. Perto do limite, as alterações deixavam de salvar sem aviso.

**O que foi feito:**
- **Java — `NativeMirror.java` (novo):** grava uma cópia da chave `agendaPersonalTL_v1` em `filesDir/mirror/<chave>.json`, com hash FNV-1a para só regravar quando muda.
- **Ponte (`MainActivity.Bridge`):** `getMirrorVersion()`, `mirrorSave`, `mirrorSaveForce`, `mirrorInfo` e `mirrorRead`.
- **Tela — `ap-native-mirror` (professor.html):** a cada alteração, espera 2,5 s e manda a cópia para o Android; também confere a cada 60 s. Código: `codigo/telas/ap-native-mirror.js`.
- **Tela — `ap-storage-meter` (professor.html):** cartão **Armazenamento** no menu Mais, com:
  - a barra de uso sobre o limite de 5 MB e o detalhamento por parte (treinos finalizados, fichas, alunos e fotos, histórico…);
  - alertas em 70 % e 90 %;
  - o estado da cópia no telefone;
  - o ícone `menu-storage` em `ap-more-menu-glyphs` / `ap-more-organization`.

  Código: `codigo/telas/ap-storage-meter.js`.
- **Tela — `ap-save-guard` (nas 4 telas):** se uma gravação falhar por falta de espaço (`QuotaExceededError`), aparece uma faixa vermelha: "Não foi possível salvar a última alteração… faça um backup". Código: `codigo/telas/ap-save-guard.js`.

---

## 3. Armazenamento — etapa 2: "Guardar a agenda no telefone"

**Problema:** mesmo com a cópia, o limite de 5 MB continuava valendo.

**O que foi feito:**
- **Java — `NativeStore.java` (novo):** a agenda passa a morar num arquivo do aparelho, em `filesDir/nstore/`:
  - `main.json` e `.prev`: o arquivo atual e a versão anterior;
  - `.meta` e `reserve.json`: o controle e a reserva;
  - `mode`: liga ou desliga o armazenamento no telefone.

  A gravação é atômica. Fica **desligado** até o Tiago tocar em **"Guardar a agenda no telefone"** no cartão Armazenamento.
- **Ponte:** `nsActive`, `nsRead`, `nsWrite`, `nsActivate`, `nsDeactivate` e `nsInfo`.
- **Tela — `ap-native-store` (nas 4 telas, é o primeiro script):**
  - Com o modo ligado, troca `Storage.prototype.getItem/setItem/removeItem` **só para a chave `agendaPersonalTL_v1`**: a leitura vem do arquivo nativo e a gravação vai para lá, com espera de 400 ms.
  - Avisa as outras telas abertas com eventos `storage`.
  - Se a gravação falhar, lança `QuotaExceededError` para o `ap-save-guard` avisar.

  Código: `codigo/telas/ap-native-store.js`.
- **Atenção:** uma versão antiga do app (por exemplo, a 1.178) **não sabe ler** esse arquivo. Com o modo ligado, voltar para ela faz a agenda parecer vazia. Os dados não se perdem.

---

## 4. Emblema do app no lugar do logo (cabeçalho e cartão do perfil)

**Pedido:** o símbolo do próprio Agenda Personal fixo, sem opção de trocar por foto, com a parte verde acompanhando a cor do tema.

**O que foi feito:**
- `professor.html`: `<img ... alt="Logo TL">` (422 KB embutidos) e `.more-identity-logo` viraram `<span class="ap-app-symbol" role="img" aria-label="Agenda Personal">`. O script `ap-shared-brand-logo` foi removido. Todas as regras de tema `.brand img` passaram a valer também para `.brand .ap-app-symbol`.
- **`ap-app-symbol-css`** (index e professor) desenha o emblema a partir da **imagem original**. O script de recolorir pinta **só a parte verde** com a cor do tema, num `canvas`, lendo a cor com `getComputedStyle`. No estilo `deep-tl`, usa a média de `--ac-deep-purple-upper/mid`, para ficar no mesmo roxo dos ícones.
- **`ap-app-symbol-enforce`** (index): `APprepareTeacherDocument` injeta o emblema também no painel do professor aberto por dentro do index.
- **`ap-brand-logo-cleanup`** (index): apaga o logo antigo salvo em `ap_professor_marca_159_professor_teste` (campo `logo`).
- **`ap-prof-setup-script`** (index): saiu a opção de enviar logo. O texto mudou de "Personalizar nome, foto e logo" para "Personalizar nome e foto".

Código: `codigo/telas/ap-app-symbol-*.css`, `ap-app-symbol-enforce.js` e `ap-brand-logo-cleanup.js`.

---

## 5. Histórico com limite de 200 movimentações (Android 1.189)

**Problema:** `state.history` só crescia e ocupava espaço.

**O que foi feito (`professor.html`, script principal):**

```js
d.history = Array.isArray(d.history) ? d.history.slice(0,200) : [];   // ao carregar
function save(){ if(Array.isArray(state.history)&&state.history.length>200) state.history.length=200; localStorage.setItem(DB_KEY, JSON.stringify(state)); ... }
```

Teste: `tests/verify_history_limit.cjs`.

---

## 6. Vistoria e redução de peso (Android 1.190)

- **Fontes do PDF de evolução** (`WORKOUT_REPORT_FONTS`, DejaVu Sans normal e negrito): ficou só o conjunto latino, conferido glifo a glifo com fontTools e pixel a pixel no PDF. Todos os acentos, o ç e os símbolos usados continuam lá. Saíram alfabetos que o app não usa (árabe, hebraico, tailandês…). Isso tirou cerca de 520 KB.
- **Removidos do APK, porque não eram usados:**
  - `app/src/main/assets/icon.png` (logo TL roxo, 461 KB). Também saiu de `LocalPages.java`, na lista de arquivos permitidos.
  - `app/src/main/res/drawable-nodpi/app_icon.png`, que era duplicado. O ícone do app continua nos `mipmap`.
- **Mascotes da Avaliação:** foram reduzidos e **depois restaurados ao original** (1.193), a pedido. Hoje são idênticos ao 1.12.255.
- Teste: `tests/verify_size_reductions.cjs`.

---

## 7. Foto do professor: só a dele, sem foto mostra as iniciais (Android 1.191)

**Pedido:** tirar a foto de exemplo do professor. Sem foto, mostrar as iniciais do nome.

**O que foi feito (`professor.html`):**
- Saiu a foto de exemplo `.trainer-reference-photo`, uma imagem de 254 KB embutida no CSS.
- Classes novas `.trainer-photo-empty` (fundo em gradiente do tema) e `.trainer-photo-initials` (iniciais em `--ac-accent`).
- `renderTrainerProfile()` e `updateTrainerPhotoPreview()` mostram `studentInitials(nome)` quando não há foto. A prévia atualiza enquanto o nome é digitado.
- O botão "Usar foto do painel" virou **"Remover foto"**.

---

## 8. Mascotes da Avaliação de volta ao original (Android 1.193 / conteúdo 1.12.266)

A redução do item 6 foi desfeita. Os três blocos de imagem de `avaliacoes.html` foram copiados de volta do pacote anterior:
- o seletor `.report-logo,.tl-mark{`;
- `.hero-figure.male`;
- `.hero-figure.female`.

`avaliacoes.html` voltou a ser idêntico ao 1.12.255, com exceção dos scripts `ap-native-store` e `ap-save-guard`.

---

## 9. Pacote sem assinatura com confirmação (Android 1.194)

**Pedido:** poder instalar `.agenda.json` sem assinatura, mas só quando o próprio professor escolhe o arquivo.

**O que foi feito (`UpdateManager.importUri` + `confirmUnsigned`):**
- Se `UpdatePackageTrust.verify` lançar `UpdatePackageSignature.Invalid`, o pacote fica marcado como `unsigned`.
- Antes da revisão, abre a janela **"Pacote sem assinatura"**:
  - **"Continuar mesmo assim"** segue para a "Revisar atualização" normal;
  - **"Cancelar"** chama `cancelReview(...)`.
- O download pelo servidor (`downloadConfirmed`) **continua exigindo assinatura**, e os aparelhos dos alunos não aceitam pacote sem assinatura.

Teste: `tests/verify_update_import_review.py` cobre cancelar e continuar. O código está no `.patch`.

---

## 10. Urso (panda) e Galo removidos (Android 1.195 / conteúdo 1.12.267)

**O que foi feito** (script `codigo/remover-urso-galo.cjs`; ele lê o codec de arquivos temporários, então ajuste os caminhos antes de reutilizar):
- **`cadastro.html`:**
  - Removidos os blocos `ap-approved-bear-assets`, `ap-bear-face-reaction-assets`, `ap-bear-young-face-assets` e `ap-chick-face-assets`.
  - Nas tabelas `ap-mascot-reaction/affection/image/coat/pose-assets` (gzip + base85 com `APMascotAssetCodec`), apagadas só as chaves `panda` e `rooster`. Capivara, gato e lobo continuam **byte a byte iguais**.
- **`index.html`, `ap-student-mascot-model`:**
  - Saíram da escolha `{id:"panda"}` e `{id:"rooster"}`, as pelagens, as poses e as cores de bônus dos dois.
  - Também saíram `pose-panda-play` e `pose-panda-rest` da lista antiga.
  - **Migração:** `(s.species==="panda"||s.species==="rooster")&&(s.species="kitten")`. Quem tinha um deles vira **gato**, mantendo nome, XP, moedas, casas e itens.
- **Lista de atualizações:** saíram as 10 entradas `urso-*` de `modularUpdates`.
- **Texto da versão incluída** (`UpdateManager.showInstalledDetails`): atualizado.
- O código de programação do urso no `ap-mascot-gesture-runtime` **ficou**. Ele não faz mais nada sem as imagens, e mexer nele arriscaria quebrar os outros pets.
- **Conferido:** 192 combinações de capivara, gato e lobo desenhadas antes e depois, todas iguais. Teste: `tests/verify_pets_removed.cjs`.

---

## 11. Simulação no GitHub (só no repositório, não vai no APK)

- `.github/workflows/simular-descanso.yml` + `simulacao/rodar.sh` + `simulacao/LockScreenRestSimulation.java`.
- Roda sozinho quando a pasta `simulacao/` muda, ou pelo botão Run workflow.
- O que faz:
  1. Compila o ZIP do repositório em modo de teste.
  2. Liga um Android 14 no emulador.
  3. Abre o app e chama `window.Android.startWorkoutRest`.
  4. Bloqueia a tela e tira print.
  5. Grava o relatório em `simulacao/resultado/`.
- Serve para testar outras coisas: basta trocar o Java da simulação.

---

## Versões, uma por linha

| Android | Conteúdo | Mudança |
|---|---|---|
| 1.179–1.188 | 1.12.256–1.12.26x | base 1.12.255 no APK, limite de 32 MB, cópia nativa, medidor de espaço, proteção de gravação, "Guardar a agenda no telefone", emblema do app |
| 1.189 | — | histórico com limite de 200 |
| 1.190 | — | vistoria: fontes do PDF, imagens sem uso removidas |
| 1.191 | 1.12.265 | foto do professor com iniciais |
| 1.192 | 1.12.265 | (descanso — fora deste documento) |
| 1.193 | 1.12.266 | mascotes da Avaliação de volta ao original |
| 1.194 | 1.12.266 | pacote sem assinatura com confirmação |
| 1.195 | 1.12.267 | urso e galo removidos |
| 1.196–1.197 | 1.12.267 | (descanso — fora deste documento) |

> A divisão exata das versões entre 1.179 e 1.188 é aproximada: o registro detalhado dessa fase não ficou disponível. O conteúdo de cada mudança acima está conferido no código.
