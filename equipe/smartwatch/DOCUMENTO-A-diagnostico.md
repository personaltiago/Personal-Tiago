# Documento A — Diagnóstico da arquitetura atual (Fase 0 · Smartwatch)

- **Data:** 25/11/2026.
- **Base auditada:** `main` em `a47c38a`, com conteúdo 1.12.315/421 e APK 1.212.
- **Pedido:** especificação "Plataforma completa para Smartwatch", seções 12 (Fase 0) e 17, enviada pelo Tiago em 25/11/2026.
- **Escopo:** só leitura. Nada foi alterado no app, no Firebase, no site, nas chaves nem nos dados de alunos.

Cada afirmação traz o arquivo onde foi conferida. Onde não houve como conferir, o texto diz isso.

---

## 0. O que foi lido e o que ficou de fora

### Lido

- `CLAUDE.md`, `equipe/ESTADO.md`, `equipe/REGRAS.md` e `equipe/canonico/` (manifesto e status dos pacotes).
- **Código Android oficial:** `AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip`, SHA-256 `e926ee9b417566153a41f4cb56a58b1f4b443ec5303782bff67f61eb0b0e24aa`.
  - Apesar do nome, é a fonte do APK 1.212. É o ZIP que `android-apk.yml` compila.
  - O `AgendaPersonal_AndroidStudio.zip` da raiz é antigo (versão 1.117) e nenhum fluxo o usa.
- **Telas do app:** pacote 1.12.315, com `index.html` (aluno) e `professor.html` (professor).
- **Site dos alunos (ChatGPT Sites):** instantâneo da publicação 44, de 20/11/2026, no branch `chatgpt/app-web` (PR #29).
  - Arquivos: `web-app/worker/index.js`, `web/sw.js`, `web/boot.js`, `web/platform.js` e `web/manifest.webmanifest`.
- **Firebase:** pasta `firebase/`, com as funções `avisos`.
- **Repositório público** `agenda-personal-distribuicao`.

### Não foi possível auditar

1. **Regras de segurança do Firestore.** Não estão no repositório: não há `firestore.rules`. Sem elas, não dá para afirmar o que o servidor deixa cada aluno ler ou gravar.
2. **Versão atual do ChatGPT Sites.** Só existe o instantâneo de 20/11. Mudanças feitas depois pelo ChatGPT não estão no GitHub.
3. **Relógios físicos.** Nenhum estava disponível ("Não tenho relógio", 24/11/2026). Nada deste documento foi testado em relógio.
4. **Plano do Firebase (Spark ou Blaze).** Não consta no repositório.
   - O `firebase/LEIA-ME.md` diz que as funções exigem o plano Blaze.
   - O histórico registra que elas nunca foram publicadas.

---

## 1. Visão geral

São cinco peças:

1. **App Android, versão 1.212.** Usado pelo professor e pelos alunos com Android. É um WebView com uma ponte nativa que tem 82 métodos `@JavascriptInterface` (`MainActivity.java`).
2. **Telas.** São 4 arquivos HTML (aluno, professor, avaliações e cadastro). Chegam num pacote `.agenda.json` assinado.
3. **Firebase**, projeto `agenda-personal-bdb58`. Usa só login (Auth) e banco (Firestore).
4. **Site dos alunos (PWA)** no ChatGPT Sites. Roda num Cloudflare Worker com armazenamento R2. É o que os alunos com iPhone e navegador usam.
5. **GitHub.** Guarda o código e os testes, assina os pacotes e publica o APK nas Releases. O repositório público tem as páginas de instalação e de cadastro.

**Relógio Wear OS:** o app existe no código (`wear/`), mas nunca foi distribuído (ver seção 8).

---

## 2. Tecnologias e dependências

| Peça | Tecnologia | Onde |
|---|---|---|
| App do celular (`:app`) | Java 17, Android SDK 35 (mínimo 26), WebView + ponte | `app/build.gradle`, `MainActivity.java` |
| Dependências do celular | `androidx.core`; `play-services-wearable` 20.0.1; Credential Manager + `googleid` (login Google); ML Kit OCR (comprovante); `exifinterface` | `app/build.gradle` |
| App do relógio (`:wear`) | Java 17, telas em Views (sem Compose), SharedPreferences, `wear-ongoing`, Data Layer | `wear/build.gradle` |
| Código comum celular ↔ relógio | contrato do treino e relógio interno | `watch-common/` |
| Telas | HTML + JavaScript num pacote assinado | raiz da `main` |
| Firebase nas telas | SDK JavaScript (gstatic): `firebase-app`, `firebase-auth`, `firebase-firestore`. O `index.html` carrega; o `professor.html` usa o mesmo SDK (por exemplo, `updateDoc(…, 'ativo', true)` para aprovar aluno) | pacote 1.12.315 |
| Site dos alunos | Cloudflare Worker + R2 (`BUCKET`); PWA em `/app/` com service worker | `web-app/` (PR #29) |
| Automação | GitHub Actions: APK, assinatura, regressão, emulador | `.github/workflows/` |

**Kotlin, Compose, Room e DataStore**, pedidos na especificação (3.1), não existem no projeto. Hoje o código é todo Java. Adotá-los muda o build e é uma decisão (ver seção 13).

---

## 3. Autenticação

- **Android, login Google:**
  - O app nativo pega o token Google pelo Credential Manager (`GoogleSignInManager.java`).
  - A tela entra no Firebase Auth do projeto `agenda-personal-bdb58` com `signInWithCredential(GoogleAuthProvider.credential(token))` (`index.html`).
- **E-mail e senha:** `signInWithEmailAndPassword` (`index.html`). Na web e no iPhone é o único acesso, porque o botão Google fica oculto (`platform.js`).
- **Vínculo e aprovação do aluno:** o documento `usuarios/{uid}` tem `perfil`, `professorId` e `ativo`. O aluno só entra se `perfil` for `aluno`, `professorId` for o do professor e `ativo` for `true` (`index.html`).
- **Relógio:** não faz login.
  - O celular guarda o dono da sessão (`setWatchAccount(uid)`).
  - Quando a conta muda, o celular manda ao relógio um pacote `revoked`, que apaga o treino (`WatchBridge.account`).

---

## 4. Firebase: o que o código usa

| Caminho | Conteúdo | Grava | Lê |
|---|---|---|---|
| `usuarios/{uid}` | `perfil`, `professorId`, `ativo` | cadastro e professor | aluno e professor |
| `usuarios/{uid}/treinos/atual` | `{version: 2, professorId, studentId, studentUid, payload, updatedAt}`; `payload` é a área do aluno em JSON | app do professor | aluno, em tempo real (`onSnapshot`) |

- **Alunos à espera:** o professor consulta `usuarios` filtrando `professorId` igual ao dele, `perfil == 'aluno'` e `ativo == false` (`ap-aviso-cadastro`).
- **Funções** (`firebase/functions`, grupo `avisos`): escritas e nunca publicadas.
- **Regras de segurança:** não estão versionadas (ver seção 0).

---

## 5. Dados de alunos e treinos

### Agenda do professor

- É o objeto `state`, salvo no aparelho na chave `agendaPersonalTL_v1`.
- Uma cópia sincroniza no Sites (`/api/teacher-agenda`, com revisões no R2).

### Ficha (`state.workoutPlans[]`)

- **Ficha:** `id`, `studentId`, `name`, `goal`, `level`, `startDate`, `endDate`, `organization` (`sequence` ou `week`), `visibility`, `autoArchive`, `notes`, `days[]`.
- **Dia:** `id`, `name`, `weekday`, `notes`, `exercises[]`.
- **Exercício:** `id`, `catalogId`, `name`, séries, repetições, carga, descanso e observações.
- **Cardio:** `category: 'Cardio'` e `durationSeconds`.
- **Bi-set:** grupos dentro do dia.

### Área do aluno (`makeArea`, em `professor.html`)

É o que vai ao Firestore:

- **Perfil:** nome, e-mail, telefone, nascimento, gênero, tipo, foto (até 200 KB) e objetivo.
- **Treinos:** fichas visíveis, com seus dias e exercícios. Cada exercício tem `rows[{reps, load, rest}]` (descanso de 0 a 1800 s), cardio e a descrição da execução.

### Execuções do aluno

- Ficam no aparelho do aluno (`exStore()`, no `localStorage`).
- São enviadas ao Sites por `/api/student-workout` e gravadas no R2 em `student-workouts/v1/{uid}/…`.
- O professor as lê por `/api/student-workouts`. A evolução vem de `/api/student-evolution`.

### Catálogo oficial de exercícios

- Fica no app do professor (`workoutCatalogItem(s)`, ids `app-ex-…`).
- Já tem bloqueio: "Exercício bloqueado pelas regras do projeto" (`workoutCatalogBlocked`).
- O nome que chega ao aluno e ao relógio sai da ficha, que aponta para o catálogo. Nenhuma peça de relógio cria ou renomeia exercício.

---

## 6. Descanso, cronômetros e alarmes (áreas protegidas)

| Peça | Como funciona hoje | Onde |
|---|---|---|
| Descanso do professor | `state.workoutRest` com o fim em `endAt`, mais um alarme nativo com a tela bloqueada | `professor.html`; `AlarmScheduler.startWorkoutRest`; `WorkoutRestAlarmService.java` |
| Descanso do aluno | só na página: `restUntil = agora + descanso × 1000`, salvo no aparelho; a tela recalcula pelo horário | `index.html` (`toggleRestTimer`) |
| Ponte nativa do descanso do aluno | `startStudentRest` e `cancelStudentRest` existem no APK, mas as telas da cadeia não os chamam (0 ocorrências no 1.12.315); existe uma correção separada | `MainActivity.java`; `AlarmScheduler.startStudentRest`; `assinar-descanso-aluno.yml` |
| Aviso no relógio (1.12.313 + APK 1.212) | só lê `restUntil` e `workoutRest`; marca a notificação "Fim do descanso" com alarme próprio; o relógio que espelha as notificações do celular Android recebe | bloco `ap-aviso-relogio`; `AvisosRelogio.java` |
| Aulas e agenda | sobreposição do cronômetro e alarmes da agenda | `LessonTimerOverlayService.java`, `AlarmScheduler.java`, `AlarmReceiver.java` |
| Web e iPhone | sem alarme com a tela bloqueada; o site orienta manter o app aberto | `web/platform.js` |

---

## 7. Atualização e distribuição

### Conteúdo (telas)

- Os pacotes `.agenda.json` são assinados no GitHub (`assinar-atualizacoes-agenda.yml`), depois de passar por `conferir-antes-de-assinar.sh`.
- O app confere a assinatura (`UpdatePackageSignature.java`) e instala pelo "Revisar atualização".
- As correções por área usam o `UpdateAreaPatch.java`.

### Alunos

- O professor publica pelo app ("Publicar para os alunos" → `/api/publish` no Sites).
- Isso alimenta a web e o "Baixar atualização" dos alunos.

### APK

- O `android-apk.yml` compila só o `:app` do ZIP oficial e publica nas Releases. O botão de instalação usa a release marcada como "latest".
- As páginas de instalação e de cadastro ficam no repositório público, pelo GitHub Pages.

### Relógio

- **Nenhum fluxo gera nem distribui o APK do relógio.**
- O PR #56, em rascunho, compilou o `:wear` como teste (execução 45476212756). Não publicou nada.

---

## 8. O que já existe de smartwatch

| Recurso | Estado | Onde |
|---|---|---|
| App Wear OS (`wear/`, versão 1.170) | pronto no código; nunca instalado num relógio | `WatchActivity`, `WorkoutService`, `WatchStore` |
| Receber o treino do celular | sim, pelo Data Layer (`/agenda/v1/workout`) | `WatchDataService`, `WatchTransfer` |
| Treinar sem conexão depois de receber | sim | `WatchActivity` |
| Séries em ordem, descanso automático, vibração no fim, pausar, retomar e encerrar | sim | `WorkoutClock`, `WorkoutService` |
| Tela apagada ou app em segundo plano | serviço em primeiro plano com Ongoing Activity | `WorkoutService` |
| Reinício do relógio | volta com o treino pausado (usa `BOOT_COUNT`) | `WatchStore.clock` |
| Bi-set | sim (rodadas pareadas) | `ap-watch-model` (`APWatchModel.packet`) |
| Registrar carga e repetições feitas | **não**: só conta séries e duração | `WatchStore.finish` |
| Desfazer série ou voltar exercício | **não** | `WatchActivity` |
| Funcionar sem celular Android | **não**: `standalone=false`; só recebe treino de um celular Android pareado | manifesto do `wear` |
| Celular iPhone | **não** (ver seção 10) | — |
| Ponte no celular (`WatchBridge`) | envia o treino, recebe a confirmação, guarda até 100 resultados e revoga ao sair da conta | `WatchBridge.java` |
| Blocos nas telas | `ap-watch-model` (monta o pacote), `ap-watch-ui` (enviar, estado, parear), `ap-watch-history` (resultados no histórico local), `ap-watch-teacher` (cartão Smartwatch), `ap-aviso-relogio` (aviso) | pacote 1.12.315 |
| Resultado do treino no relógio | fica no celular; **não vai** ao Firestore nem ao Sites (nenhuma chamada encontrada) | `WatchBridge.receive`, `ap-watch-history` |

---

## 9. Especificação × código: o que já atende e o que falta

| Item da especificação | Situação no app Wear OS atual |
|---|---|
| 6 · Treino sem internet | **atende**, depois que o treino chega ao relógio |
| 6 · Fila de sincronização sem duplicar | **parcial**: cada envio tem token único, mas o resultado não sai do celular |
| 7.1 · Tela inicial com treinos disponíveis | **parcial**: um treino por vez, enviado pelo celular |
| 7.2 · Exercício, série, repetições e carga | **atende** |
| 7.2 · Descanso previsto e próximo exercício na tela | **falta** |
| 7.3 · Concluir série e iniciar o descanso | **atende** |
| 7.3 · Desfazer série | **falta** |
| 7.4 · Contagem pelo horário de término, vibração, pausar e retomar | **atende** |
| 7.4 · Ajustar o descanso | **falta** |
| 7.4 · Notificação de término | **falta**: hoje só vibra |
| 7.5 · Navegar entre exercícios | **falta**: a sequência é fixa |
| 7.6 · Resumo | **parcial**: séries e duração, sem cargas e repetições |
| 9 · Sem credenciais e com o mínimo de dados no relógio | **atende**: sem contatos, fotos nem senha |
| 9 · Proteger os dados guardados no relógio | **falta**: SharedPreferences sem criptografia, com dados só do treino |
| 13 · Teste em relógio físico | **nenhum** |

---

## 10. Viabilidade por plataforma (provisória, sem teste físico)

| Plataforma e modelos | App próprio? | Caminho | Condição ou custo | Classificação provisória |
|---|---|---|---|---|
| Wear OS com celular Android (Galaxy Watch 4 ou mais novo, Pixel Watch, Xiaomi Watch 2 e 2 Pro) | sim | o app `wear/` que já existe | distribuição pela Google Play (conta de desenvolvedor) ou instalação manual por ADB | completa possível, **não testada** |
| Wear OS com iPhone | não | — | os Galaxy Watch com Wear OS não pareiam com iPhone; poucas marcas prometem iPhone, e nosso app não tem lado iOS | não compatível |
| Apple Watch | só com app nativo (Swift/watchOS) | app novo | Apple Developer Program (US$ 99/ano), Xcode no Mac e App Store | completa possível, **custo alto**; alternativa menor na seção 13 |
| Huawei (GT e FIT, HarmonyOS lite) | sim, limitado | DevEco Studio / ArkTS, AppGallery | conta Huawei com verificação de identidade; em alguns modelos a loja do relógio não funciona pareado com iPhone; GT 2 e 2e não instalam apps | a avaliar |
| Amazfit (Zepp OS) | sim (mini-apps) | não avaliado | — | a avaliar |
| Garmin (Connect IQ) | sim | não avaliado | — | a avaliar |
| Xiaomi Smart Band e Redmi Watch | não confirmado | notificação do celular | — | apenas notificações (Android, desde o 1.12.313) |

---

## 11. Pontos seguros de integração

1. **Contrato `watch-common`** (`WatchContract` v1): evoluir para v2 só com campos opcionais (carga e repetições feitas, descanso previsto). O relógio antigo continua lendo.
2. **Fonte do treino:**
   - A área do aluno já usa o mesmo formato do relógio (`rows[{reps, load, rest}]`).
   - O pacote é montado como o `APWatchModel.packet` já faz: a partir da área (aluno) ou de `state.workoutPlans` (professor).
3. **Blocos `ap-watch-*`** nas duas telas: são isolados e ficam fora das áreas protegidas.
4. **Resultados:** gravar num lugar novo, sem tocar no que existe. Depende de uma decisão (seção 13, item 3).
5. **Não tocar** em `AlarmReceiver`, `AlarmScheduler`, `AlarmStore`, `AlarmStatus`, `AudioSettings`, `BootReceiver`, `WorkoutRestAlarmService`, `LessonTimerOverlay*`, `AvisosCadastro` e `AvisosRelogio`. O teste `verify_avisos_relogio.py` já confere o SHA-256 de vários deles.

---

## 12. Riscos de regressão

- **Pacote e assinatura:** o relógio precisa do mesmo nome de pacote e da mesma chave do celular (Data Layer). Trocar quebra o relógio e as atualizações do APK.
- **Fluxo do APK oficial:** ele gera só o `:app`. Pôr o `:wear` nele arrisca o APK do celular. O relógio precisa de um fluxo separado.
- **Kotlin e Compose:** o projeto é todo Java. Adicionar Kotlin muda o build de todos os módulos.
- **Firestore:** qualquer coleção ou regra nova é mudança no Firebase, proibida sem autorização.
- **Sites:** só muda pelo ChatGPT, e aqui não há teste automático dele.
- **Blocos duplicados:** os `ap-watch-*` do aluno e do professor precisam continuar iguais.

---

## 13. Decisões que dependem do Tiago (antes da Fase 1)

1. **Distribuição do app Wear OS.** Duas opções:
   - Google Play: conta de desenvolvedor com taxa única. O valor deve ser conferido na hora de criar.
   - Instalação manual por ADB: técnica, ruim para aluno.
2. **Apple Watch.** Três opções:
   - (a) App nativo: US$ 99/ano, Mac (ou Mac na nuvem) e revisão da App Store.
   - (b) Só o aviso "Fim do descanso" no relógio, por notificação do site instalado na Tela de Início. Precisa de um servidor que dispare na hora. O ChatGPT Sites não tem agendador, então o servidor seria o Firebase no plano Blaze ou um serviço grátis à parte.
   - (c) Não fazer agora.
3. **Onde guardar o resultado do relógio:**
   - no Firestore, o que exige regra nova (mudança no Firebase);
   - ou no Sites, pela rota de execuções que já existe (`/api/student-workout`).
4. **Relógios para teste.** A especificação exige teste físico por modelo, e hoje não há nenhum relógio. Sem isso, nada sai de "não testada".
5. **Regras do Firestore.** Exportar do console para versionar e auditar.
6. **Linguagem.** Manter Java no que já existe ou migrar para Kotlin e Compose.

---

## 14. Recomendação técnica (com confiança)

1. **Primeiro, Wear OS com Android.** É o melhor retorno pelo menor custo: o app existe, e faltam distribuição, as lacunas da seção 9 e teste físico.
   - Confiança alta no caminho técnico.
   - Confiança média no prazo, que depende de um relógio para teste.
2. **Depois, Apple Watch,** com decisão entre nativo e só aviso. O nativo é a parte mais cara do projeto.
3. **Huawei, Amazfit e Garmin** só depois de saber quantos alunos usam cada marca.

---

## 15. Evidências

- `main`: `a47c38a73f411aeb53c94ab2dfc82426c85c67b1`.
- ZIP oficial do Android: SHA-256 `e926ee9b417566153a41f4cb56a58b1f4b443ec5303782bff67f61eb0b0e24aa`.
- Pacote 1.12.315 proposto: SHA-256 `8eafe5b7637350a1cb51c9b144fe74242990a80181ab6b9ffe012b730d3a165c`.
- Compilação de teste do `:wear` (PR #56): execução 45476212756.
- Site: instantâneo da publicação 44 do ChatGPT Sites, commit de origem `7702aa6a32cd83fc5e751450bc545a4d754bc9ee` (PR #29).
