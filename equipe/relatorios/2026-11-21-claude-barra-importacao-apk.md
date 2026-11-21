# Barra de progresso na importação do APK — 21/11/2026 (Claude)

Pedido do Tiago (20/11 15:28 e 21/11 08:04, "Pode fazer"): ao importar a atualização ele não sabia quando terminava.

## O que muda (ZIP oficial, Android 1.207 → 1.208)
- `UpdateProgress.java` (novo): janela "Importando atualização" no formato da barra do Publicar (pedido do Tiago, 21/11 11:27: "quase igual àquela… pode ser da cor do perfil"): nome da etapa à esquerda, porcentagem à direita, barra grossa arredondada no verde dos ícones desta janela (#568900), "X de Y MB", "Etapa N de 4" e estimativa de tempo restante na leitura:
  1. Lendo o arquivo — 0 a 40% pelos bytes lidos (tamanho via `OpenableColumns.SIZE`; sem tamanho, barra indeterminada sem porcentagem);
  2. Conferindo o arquivo / a assinatura / montando — 42, 48, 55%; aguardando sua confirmação — 60% (a janela sai da frente da revisão);
  3. Copiando os dados — 70%; guardando a versão anterior — 80%; abrindo a nova versão — 90%;
  4. Concluído — **100% só no `pageReady`** (a nova versão abriu e confirmou); fecha sozinha em 4 s.
  - Erro ou cancelamento: a barra para onde estava (nunca 100%), fica vermelha (#E46A6A), título "Nada foi instalado", "Parou em: <etapa>" e a mensagem.
  - "Ocultar" fecha só a janela; o resultado final (concluído ou erro) reaparece.
- `UpdateManager.java`: chamadas à barra em `importUri`, `reviewUpdate` (antes da revisão), `confirmReview`, `cancelReview`, `snapshotAndApply`, `pageReady` (aplicada), recuperações de `openPage`/`pageFinished` e `destroy`. Leitura com `readLimited` + contador. **Validação, assinatura, limites (32 MiB), revisão, cópia dos dados e recuperação não mudaram.**
- Versão: `build.gradle` (versionName 1.208, versionCode padrão 208; no GitHub continua 1000 + número da execução), `release.json`, `package.json`, `package-lock.json`, `tools/check_release.cjs`, `LEIA-ME.txt`; inventário regenerado com `tools/refresh_release.py` (158 arquivos).
- Testes: `tests/verify_update_progress.py` (novo, no `run_all.py`) e registrador `UpdateProgress` em `tests/verify_native_updates.py` (os testes nativos compilam o `UpdateManager` com Android de mentira).
- `.github/workflows/compilar-apk-teste.yml` (novo): em PR que muda o ZIP, roda `tests/run_all.py` e compila `:app:assembleDebug` com o SDK real. Sem a chave, sem Release, sem publicar; o APK de teste não instala por cima do app.

## Não muda
Conteúdo das telas (continua 1.12.269 embutido; o instalado vem das atualizações), descanso, cronômetros, alarmes, notificações, Firebase, login, dados, mascotes, chave de assinatura, applicationId. A barra do "Publicar para os alunos" é do conteúdo (`ap-distribution-controls`, index.html) e fica para uma correção de conteúdo separada.

## Testes (21/11)
- `tests/verify_update_progress.py`: classe real 36 verificações (inclui MB, estimativa de tempo e cores); fluxo real do UpdateManager 13 verificações (revisão, cancelar → 60%, arquivo inválido ≤ 42%, instalação 70→80→90 e 100% só depois do pageReady, conteúdo já instalado → erro). Quebras de propósito reprovadas: erro mostrando 100% e cancelamento sem parar a barra.
- `tests/run_all.py` do ZIP inteiro: aprovado.
- Repositório: `testar-verificador` 44/44; mecanismo real 170 verificações com o ZIP novo; testes oficiais 18/18 (1.12.300); `testar_verificador.py` 16/16; `verificar_funcionalidades.py` aprovado; manifesto e raiz conferem.
- Compilação com o SDK real: no CI do PR (`compilar-apk-teste.yml`).
- **Não testado em aparelho** (Xiaomi): a aparência real da janela, cores e tempo só se confirmam instalando.

## Como instalar e reverter
Depois da aprovação e do merge, o Tiago roda "Gerar e publicar APK Agenda Personal" (gera com a chave existente e publica o Release). Instala por cima (mesma chave, versionCode maior). Para reverter: rodar o mesmo fluxo a partir do ZIP anterior (SHA-256 `93fdae46…a9cc`) gera um APK com versionCode ainda maior e o código antigo.
