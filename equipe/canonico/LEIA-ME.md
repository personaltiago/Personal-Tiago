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
| `manifesto.json` | **Gerado.** O canônico (versão, sequência, arquivo, SHA-256), o hash de cada bloco `<script id>`/`<style id>` dele por página e área (mais `#fora-dos-blocos`, o resto da página), o histórico de hashes de cada bloco na cadeia até o canônico, as funcionalidades com identificador estável, versão, blocos e dependências, e cada correção por área da `main` com a situação no canônico. |
| `status-pacotes.json` | **Escrito à mão, com evidência.** Os seis estados de cada pacote (proposto, aprovado, assinado, publicado, instalado, validado) e qual é o canônico. |
| `alteracoes-autorizadas/<versão>.json` | O que um pacote completo posterior ao canônico pode mudar (blocos antes/depois, remoções, reversões), por pedido de quem e aprovado como. |
| `INVENTARIO.md` | **Gerado.** Incorporado / evoluído / ausente / conflito por funcionalidade, correção, PR e área; paridade aluno/professor; Raposinha. |
| `gerar-manifesto.cjs`, `relatorio.cjs`, `lib.cjs` | Geradores (`--conferir` só confere; o CI usa assim). As regras de área e a lista `SHARED` vêm do `UpdateAreaPatch.java` do ZIP oficial. |

## Testes (`equipe/testes/regressao/`)
- `verificar-pacote.cjs`: o verificador. Modo `pr` (estrito: toda mudança precisa estar autorizada) e modo `assinatura` (no fluxo de
  assinatura: mudança nova vira aviso, mas pacote antigo, remoção, reversão, correção perdida, paridade quebrada, conflito e
  divergência de sequência reprovam).
- `testar-verificador.cjs`: 27 casos com regressões propositais montadas do canônico de verdade; cada um tem de ser reprovado pelo
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

## Limites conhecidos
- Bloqueio de merge só existe se o job `regressao` for marcado como verificação obrigatória na regra da `main` (hoje a regra
  "Proteger main" só impede apagar a branch e push forçado). Sem isso, o vermelho só avisa.
- O verificador compara blocos com id e o resto da página como um todo; não entende o significado do código. Uma mudança autorizada
  pode ter defeito funcional: para isso servem os testes de cada funcionalidade e o aparelho.
- A situação "evoluída" no verificador rápido segue só a cadeia de correções da `main`; a classificação autoritativa é a do Java.
