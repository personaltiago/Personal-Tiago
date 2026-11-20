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

## Revisão independente (20/11 12:47) e correções

1. **Regressão disfarçada passava antes de assinar [V, corrigido].** Uma correção por área com a `ap-workout-corrections` do 1.12.288 + um comentário (hash novo) passava no verificador do modo assinatura, porque a reversão só era reconhecida por hash antigo exato. Agora: (a) o verificador avalia o **estado resultante** e trata os blocos das correções presentes na referência como **protegidos**: qualquer mudança neles, de qualquer conteúdo, exige autorização expressa de continuação; (b) a conferência antes de assinar também roda o **mecanismo real** (`conferir-antes-de-assinar.sh`), que pega a perda pela classificação do app. Casos permanentes: verificador (2 casos da revisão + "só um espaço") e Java (seção F).
2. **Complemento "Feedback somente no topo" (main `3ab3556`) fora da referência [V, corrigido].** A referência passou a ser o último passo **assinado** da cadeia (pacote completo ou complemento): 1.12.295 + complemento = 1.12.296/402 no aparelho. Testes: o app aplica o complemento sobre o 295 e o recusa sobre o 294; pacote 1.12.296/402 com as páginas do 295 é reprovado (sequência e perda do complemento); 1.12.297 montado do 295 também (perda); mudança no bloco do complemento sem autorização também; arquivo novo na raiz fora do manifesto reprova o CI (`conferir-raiz.cjs`). Instalação não foi registrada (sem confirmação do Tiago).
3. **Outros fluxos de assinatura [V, corrigido].** `assinar-ficha-recolhivel.yml` e `assinar-descanso-aluno.yml` rodam a mesma conferência antes da chave. O conteúdo embutido da ficha é reprovado (conflito em `ap-workout-export` e `-css`): o fluxo não assina mais. O do descanso passa (já presente: idempotente); conteúdo e comportamento do descanso não mudaram. `android-apk.yml` (APK) não é coberto e está documentado.
4. **Verificação obrigatória [documentado].** Passo a passo em `equipe/canonico/LEIA-ME.md`; nenhuma regra do repositório foi alterada.

Achado ao testar: o complemento retira do 295 o redirecionamento do toque no pet para o feedback, que o 295 do Claude não tinha tirado. Ele também retira a limpeza, sem recarregar a página, do que um pacote anterior deixou no cartão do pet; o app recarrega a página ao instalar, então o efeito esperado é nenhum [H]. No teste do 295 no Chrome, a página da referência passa em 24 de 25: só falha essa limpeza.
