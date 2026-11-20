# CLAUDE.md — regras permanentes para trabalhar no Agenda Personal

Valem para Claude Code, ChatGPT e qualquer colaborador, em **toda** tarefa neste repositório. Se algo aqui conflitar com um pedido,
pare e pergunte ao Tiago antes de seguir. Detalhes e motivos: `equipe/REGRAS.md`, `equipe/ESTADO.md` e `equipe/canonico/LEIA-ME.md`.

## 1. Antes de alterar qualquer coisa
1. Busque o estado atual do GitHub, não o do seu clone: `git fetch origin` e confira o HEAD da `main`
   (`gh api repos/personaltiago/Personal-Tiago/commits/main`). O cache local pode estar atrasado; confira pela API.
2. Leia `equipe/ESTADO.md`, `equipe/REGRAS.md`, `equipe/canonico/INVENTARIO.md` e os PRs abertos relacionados ao assunto.
3. Descubra o **canônico**: `equipe/canonico/manifesto.json` → `canonico` (o último pacote completo **assinado e instalado**).
   Confira o SHA-256 do arquivo. Veja em `equipe/canonico/status-pacotes.json` o que está só proposto, aprovado, assinado,
   publicado, instalado ou validado. Cada estado tem evidência própria.
4. **Nunca** parta de um pacote só porque ele está na raiz da `main`, tem o maior número ou o nome parece certo. A raiz guarda uploads
   antigos, e já houve arquivo com nome de uma versão e conteúdo de outra (o `…1.12.284…` contém o 1.12.285).
5. Liste as dependências e os riscos de regressão do que vai mudar: blocos `ap-*` tocados, área do `UpdateAreaPatch`, componentes
   compartilhados (`UpdateAreaPatch.SHARED`) e correções da `main` que mexem nos mesmos blocos.

## 2. Como entregar uma mudança de conteúdo
1. **Prefira correção por área** (`agenda-patch/2`, o `UpdateAreaPatch` do app): uma por funcionalidade, montada sobre o canônico.
   Cada mudança leva o SHA-256 "antes" (o do bloco no canônico) e o "depois". O app recusa conflito, garante idempotência ("Esta
   correção já está presente.") e permite desinstalar só aquela correção.
2. Se mudar um componente compartilhado (`ap-feedback-css`, `ap-feedback-model`, `ap-workout-audio`…), mude **as duas cópias**
   (aluno e professor) para o **mesmo** texto, na mesma correção.
3. Só faça **pacote completo** quando a mudança não couber em correção por área. Monte-o **exclusivamente a partir do canônico**
   (ou do posterior assinado que o Tiago indicar), com versão e sequência novas (sequência = número da versão + 106, maior que todas
   as já usadas). Nunca reutilize uma versão: confira na raiz da `main`, nos PRs e em `status-pacotes.json`.
4. Para todo pacote completo, escreva `equipe/canonico/alteracoes-autorizadas/<versão>.json`: base (canônico + SHA-256), pedido do
   Tiago, cada bloco alterado (antes/depois), remoções e reversões. Quem aprova é o Tiago, pelo merge ou pelo upload na `main`.
5. **Nunca sobrescreva em silêncio** uma alteração incompatível. Se o bloco no canônico não for o que a sua mudança espera, refaça a
   mudança sobre o conteúdo atual e explique ao Tiago o que muda.
6. Uma funcionalidade por correção/PR. Não junte mudanças independentes sem motivo escrito.

## 3. Testes obrigatórios antes de entregar
Rode da raiz e anexe o resultado ao PR:
```
node equipe/testes/regressao/verificar-pacote.cjs --modo pr <arquivo.agenda.json>
node equipe/testes/regressao/testar-verificador.cjs
python3 -I equipe/testes/regressao/mecanismo-real.py --candidato <arquivo.agenda.json>
python3 -I equipe/testes/testes-oficiais-android.py <pacote-completo.agenda.json>
python3 -I equipe/testes/verificar_funcionalidades.py
```
E o teste no Chrome da funcionalidade (equipe/testes/navegador/…) quando ela for visível. O CI (`verificar-regressao.yml`) roda os
quatro primeiros em todo PR. O fluxo de assinatura roda o verificador (modo assinatura) **antes** de assinar e não assina se reprovar.
Teste em Xiaomi ou iPhone/Safari só conta quando feito no aparelho: nunca declare validação em aparelho sem ter testado nele.

## 4. Depois de cada alteração
1. Atualize `equipe/ESTADO.md`: o que mudou, dependências, testes e resultados, versão/sequência, SHA-256 e como instalar e reverter.
2. Quando o Tiago **instalar** um pacote posterior ao canônico e confirmar, abra um PR que atualiza `status-pacotes.json` (canônico
   novo + evidência) e regenere `node equipe/canonico/gerar-manifesto.cjs` e `node equipe/canonico/relatorio.cjs`.
3. Pacote novo na cadeia: acrescente-o em `CADEIA` de `equipe/canonico/gerar-manifesto.cjs`, com o SHA-256 conferido.

## 5. Proibido sem pedido específico e aprovação do Tiago
- Mexer em descanso do treino, cronômetros, alarmes, notificações da tela bloqueada, Firebase, dados de alunos, financeiro, login,
  mascotes ou chaves e segredos de assinatura.
- Fazer merge, assinar, publicar, distribuir, gerar APK ou subir arquivo na `main`. Trabalhe em branch `claude/<assunto>` e PR em rascunho.
- Apagar ou "voltar" blocos `ap-*` sem listar no PR o que se perde.
- Pôr dados de alunos, backups ou o link da sessão do Claude em commits, PRs ou arquivos (o repositório é público).
