# Fonte canônica e proteção contra regressões (issues #22 e #23)

## Por que existe
Um pacote completo (`.agenda.json`, formato 1) troca as quatro páginas inteiras. Os pacotes 1.12.273 a 1.12.288 foram feitos sem as
correções por área 01 (Catálogo unificado), 02 (Baixar catálogo) e 03 (Duplicatas e exclusão) que já estavam no site; instalar
qualquer um deles as retirava. O app não impede isso: um pacote **mais novo** que traga um bloco antigo é instalado como "Revisar
atualização", sem aviso (provado no teste com o código real, seção E de `RegressaoHarness`). A proteção, portanto, tem de ficar
**antes** do aparelho: no PR e antes da assinatura.

## O que há aqui
| Arquivo | O que é |
|---|---|
| `manifesto.json` | **Gerado.** A REFERÊNCIA (último passo assinado da cadeia: hoje o pacote completo 1.12.301/407; próxima versão livre 1.12.302/408), o canônico instalado (1.12.294), o hash de cada bloco `<script id>`/`<style id>` da referência por página e área (mais `#fora-dos-blocos`, o resto da página), o histórico de hashes de cada bloco na cadeia até o canônico, as funcionalidades com identificador estável, versão, blocos e dependências, e cada correção por área da `main` com a situação no canônico. |
| `status-pacotes.json` | **Escrito à mão, com evidência.** Os seis estados de cada pacote (proposto, aprovado, assinado, publicado, instalado, validado) e qual é o canônico. |
| `alteracoes-autorizadas/<versão ou id>.json` (ou `<arquivo>.autorizacao.json` ao lado do pacote) | O que um pacote completo ou uma correção pode mudar em relação à referência (blocos antes/depois, remoções, reversões, continuação de bloco protegido), por pedido de quem e aprovado como. `1.12.295.json` é o registro histórico da autorização do 295 (feito contra o 294). |
| `INVENTARIO.md` | **Gerado.** Incorporado / evoluído / ausente / conflito por funcionalidade, correção, PR e área; paridade aluno/professor; Raposinha. |
| `conferir-raiz.cjs` | Acusa arquivo da raiz da `main` fora do manifesto (envio novo ainda não classificado) ou com SHA-256 diferente. |
| `gerar-manifesto.cjs`, `relatorio.cjs`, `lib.cjs` | Geradores (`--conferir` só confere; o CI usa assim). As regras de área e a lista `SHARED` vêm do `UpdateAreaPatch.java` do ZIP oficial. |

## Testes (`equipe/testes/regressao/`)
- `verificar-pacote.cjs`: o verificador. Modo `pr` (estrito: toda mudança precisa estar autorizada) e modo `assinatura` (no fluxo de
  assinatura: mudança nova vira aviso, mas pacote antigo, remoção, reversão, correção perdida, paridade quebrada, conflito e
  divergência de sequência reprovam).
- `testar-verificador.cjs`: 40 casos (10 controles + 30 regressões, inclusive a 03 do 1.12.288 com um comentário e a perda do complemento) com regressões propositais montadas do canônico de verdade; cada um tem de ser reprovado pelo
  motivo certo, e os controles bons têm de passar.
- `mecanismo-real.py` + `java/RegressaoHarness.java`: compila o `UpdateManager`/`UpdateAreaPatch` do ZIP e instala o candidato, pela
  janela de revisão de verdade, sobre 1.12.288, 1.12.288 + correções da main, 1.12.291, 1.12.292 e o canônico; confere 01/02/03,
  reversão, idempotência, conflito, hash divergente, paridade, o aviso de restauração de um pacote antigo e a sensibilidade do teste.

## Fluxo
1. Mudança nova → correção por área sobre o canônico (preferido) ou pacote completo sobre o canônico + `alteracoes-autorizadas/`.
2. PR em rascunho → CI `verificar-regressao.yml`.
3. Tiago aprova e sobe o arquivo na raiz da `main` → `assinar-atualizacoes-agenda.yml` roda o verificador (modo assinatura) **antes**
   de assinar; se reprovar, nada é assinado e o log diz por quê.
4. Tiago instala e confirma → PR que muda o canônico em `status-pacotes.json` e regenera o manifesto e o inventário.

## Caminhos que produzem conteúdo assinado (mapeados em 20/11)
| Fluxo | Dispara | Antes de assinar |
|---|---|---|
| `assinar-atualizacoes-agenda.yml` | push na `main` com `*.agenda.json` na raiz; botão | `conferir-antes-de-assinar.sh` (verificador + mecanismo real) |
| `assinar-ficha-recolhivel.yml` | mudança no próprio arquivo do fluxo; botão | idem. O conteúdo embutido (Ficha recolhível antiga) é **reprovado** (conflito): o fluxo não assina mais. Retirar o fluxo é decisão do Tiago. |
| `assinar-descanso-aluno.yml` | mudança no próprio arquivo do fluxo; botão | idem. O conteúdo embutido (Descanso automático) já está na referência: passa como idempotente. Conteúdo e comportamento do descanso não mudaram. |
| `android-apk.yml` | só pelo botão | **não coberto**: assina o APK (não é pacote de conteúdo); o conteúdo embutido no APK é o 1.12.269 do ZIP. Um APK novo não troca a atualização ativa no aparelho [H, pelo código; sem teste em aparelho]. Gerar APK continua só com aprovação do Tiago. |

## Como tornar o teste obrigatório na `main` (só o Tiago, pelo site)
1. GitHub → repositório → **Settings → Rules → Rulesets → "Proteger main"** (já existe; hoje só bloqueia apagar e push forçado).
2. **Add rule → "Require status checks to pass"** → em "Status checks that are required" adicione **`regressao`** (o nome do job de
   "Verificar regressão do conteúdo"; ele só aparece na lista depois de ter rodado uma vez, o que já aconteceu no PR #25).
3. Marque **"Require branches to be up to date before merging"** (o manifesto precisa ter visto a `main` atual).
4. Para o teste valer em todo merge, marque também **"Require a pull request before merging"**. Atenção: com isso, **"Add files via
   upload" direto na `main` deixa de funcionar** para todos (inclusive o Tiago), a não ser que ele se coloque na lista de exceções
   (**Bypass list**). Recomendação: manter o upload direto de pacotes (a barreira nele é a conferência antes de assinar) e exigir PR
   só se ele quiser parar de subir pelo site.
5. Salvar com **Enforcement status: Active**. Conferir com: `gh api repos/personaltiago/Personal-Tiago/rulesets/27377643`.

## Limites conhecidos
- Bloqueio de merge só existe depois dos passos acima. Sem eles, o vermelho só avisa; o upload direto na `main` só é barrado na
  hora de assinar.
- Mudança num bloco protegido com autorização passa: a autorização é a aprovação expressa (quem pode subir na `main` pode escrevê-la).
- O verificador compara blocos com id e o resto da página como um todo; não entende o significado do código. Uma mudança autorizada
  pode ter defeito funcional: para isso servem os testes de cada funcionalidade e o aparelho.
- A situação "evoluída" no verificador rápido segue só a cadeia de correções da `main`; a classificação autoritativa é a do Java.
