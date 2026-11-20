# Proteção contra regressões de conteúdo (issues #22 e #23) — Claude — 20/11/2026

**Branch / base:** `claude/protecao-regressao`, a partir da `main` em `7a41338`. Nenhuma página do app muda; nenhum pacote novo.

**Pedido do Tiago (20/11 11:59):** executar juntas as issues #22 (consolidar pós-1.12.294 e bloquear regressões de exercícios) e #23 (regra permanente: atualizações modulares sem sobrescrever correções), com testes reais e CI, sem merge, assinatura definitiva, publicação ou APK.

**Causa do problema:** pacote completo troca as quatro páginas inteiras; os completos 1.12.273–1.12.288 foram montados sem as correções 01/02/03 e as retiravam. O app não impede: um pacote mais novo que traga um bloco antigo entra como "Revisar atualização" (provado: seção E do teste Java). Só um pacote **mais antigo** gera o aviso "Revisar restauração".

**Arquivos:**
- `CLAUDE.md` (raiz): regras permanentes e imperativas.
- `equipe/canonico/`: `manifesto.json` (gerado: canônico, hashes por bloco/área, histórico, funcionalidades com id/versão/dependências, correções da main), `status-pacotes.json` (seis estados com evidência), `alteracoes-autorizadas/1.12.295.json`, `INVENTARIO.md` (gerado), `gerar-manifesto.cjs`, `relatorio.cjs`, `lib.cjs`, `LEIA-ME.md`.
- `equipe/testes/regressao/`: `verificar-pacote.cjs`, `testar-verificador.cjs`, `mecanismo-real.py`, `java/RegressaoBase.java` (ferramentas extraídas do teste do 1.12.294, sem mudar a lógica), `java/RegressaoHarness.java`.
- `equipe/testes/{arquivos-da-main,pacote-291,pacote-292}.cjs`, `equipe/testes/testes-oficiais-android.py`, `tools/gerar-correcoes-exercicios-1.12.291.cjs`, `tools/gerar-sininho-feedback-1.12.292.cjs`: trazidos dos PRs #19–#21 sem mudança, para refazer o 291 e o 292 pelo SHA-256.
- `.github/workflows/verificar-regressao.yml` (novo, em todo PR) e `.github/workflows/assinar-atualizacoes-agenda.yml` (+1 passo, antes de decodificar a chave: roda o verificador no modo assinatura; segredos e passos de assinatura intactos).
- `equipe/ESTADO.md`: seção 0 com o resultado.

**O que se perde:** nada no app. Efeito novo: depois do merge, subir na `main` um pacote completo antigo, uma correção em conflito ou um pacote que reverte/remove blocos do canônico **não é mais assinado** (o log diz por quê). Isso vale também para reenviar os uploads antigos da raiz (1.12.255–1.12.288, Raposinha, Ficha recolhível 253).

**Verificado [V]:** ver `equipe/ESTADO.md` seção 0 e o corpo do PR (verificador, 27/27 casos propositais, Java 158/157, Chrome 51/51 do catálogo, Android 18/18 no 294 e no 295, CI do PR e PR de teste regressivo vermelho).

**Hipóteses [H]:** a classificação "evoluída" do verificador rápido segue só a cadeia de correções da main; a autoritativa é a do Java. Não testado em Xiaomi nem iPhone/Safari.

**Áreas de risco tocadas:** atualizações (só o fluxo de assinatura, com um passo de leitura antes). Não tocadas: descanso, cronômetros, alarmes, notificações, Firebase, dados de alunos, financeiro, login, mascotes, chaves.

**Como reverter:** fechar o PR; depois de juntado, `git revert` do merge num novo PR (o passo extra sai do fluxo de assinatura).
