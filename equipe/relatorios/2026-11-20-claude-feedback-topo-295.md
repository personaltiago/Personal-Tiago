# Feedback pelo ícone do topo (1.12.295) — Claude — 20/11/2026

**Branch / versão:** `claude/feedback-topo` (empilhada na `claude/icone-feedback`, PR #21) / pacote **1.12.295**, sequência **401**, sem assinatura. Parte do 1.12.294 que está na `main` (commit `f7ea686`, SHA-256 `2bf38cc5…30e9`). O pacote não está no repo.

**Pedido do Tiago (20/11, 11:38, ditado, duas fotos do celular da aluna Silvana com o 1.12.294 instalado):** o ícone do feedback não aparecia no topo do Início e o feedback continuava "atrelado ao pet" (botão "Seus feedbacks" na janela do pet). "Quero que suma daí e que o ícone apareça lá em cima e a pessoa entra por lá." A escolha do ícone em Meu perfil funcionou.

**Causa [V]:** não era falha de instalação. Desde o 1.12.292 o botão do topo só existia com feedback **pendente** (`show = uid && count > 0`), e a Silvana estava sem pendência. Reproduzido no Chrome com a página do 294: sem pendência não há botão; com pendência o pet ganha o aviso vermelho e a janela do pet o botão "Seus feedbacks". Decisão do 292 (minha), não pedida por ele.

**O que muda (só `index.html`, só o script `ap-feedback-student`; estilo e `professor.html` idênticos ao 294):**
- O botão do topo existe **sempre** para o aluno logado (mesmo critério `APFeedbackSync.uid()`: visualização pelo professor e cadastro por link continuam sem). Número só com pendência (`hidden` no número). Rótulo "Feedback do treino" ou "Feedback do treino, N pendente(s)". Tocar abre a janela "Como foi hoje?" (pendente mais recente, ou a lista, ou "Nenhum feedback solicitado").
- Sai do pet: aviso vermelho no cartão, troca da fala, botão "Seus feedbacks"/"Dê seu feedback" na janela do pet; sai também o cartão do Início que aparecia com o pet escondido. O que um aparelho tiver na tela do pacote anterior é limpo.
- Texto do painel "Ícone do feedback": "Este ícone fica no topo do Início. Toque nele para ver e enviar seus feedbacks do treino."
- Não muda: recompensas do pet, janela, envio, fila, `APFeedbackSync`, Firebase, estilo, professor, avaliações, cadastro, descanso, cronômetros, alarmes, notificações.

**Bloco:** `ap-feedback-student` `716376db…2121` (294) → `cf666ed2…2cd3`. `index.html` 2.402.965 → 2.401.881 caracteres. Pacote SHA-256 `031b8a55010063925bc37d213ebe74d818d4c5249981f2d273a57f4ef1e20185`, notas 1.152, resumo 186.

**Custo conhecido:** o topo do aluno fica sempre com quatro ícones (WhatsApp, feedback, sino, foto) a 4 px; com nome comprido, letra grande e tela estreita o "Olá, Nome!" pode ir para mais linhas ou os ícones descerem (o mesmo arranjo que o 292/294 já tinham com pendência, medido em 324 + 108 combinações sem nome partido, sobreposição ou estouro). O estilo não mudou, então a geometria com o botão é a do 294; não rodei a matriz de novo.

**Verificado [V]** (Chrome 153 headless, Java 21, Node 22; sem celular):
- `equipe/testes/navegador/feedback-topo/funcional.js`: **25/25** na página do 295 (sem pendência o botão aparece sem número, 44×44 com desenho de 27 px, mesma cor do WhatsApp, ordem no topo; toque abre a janela com a lista; sem nenhum feedback abre com "Nenhum feedback solicitado"; 1 e 3 pendentes com número e rótulo; pet sem aviso, fala intacta, sem "Seus feedbacks", sem cartão no Início, sobras do pacote anterior limpas; ícone escolhido vale sem pendência; sem aluno e fora do papel de aluno não aparece; nenhum erro de JavaScript). **Controle:** a mesma bateria na página do 294 falha em 18 (reproduz o que o Tiago viu).
- Regressão com as baterias anteriores: `sininho-feedback/funcional.js` 115/149 e `icone-feedback/funcional.js` 124/129 na página do 295; **todas as falhas são as mudanças pedidas** (botão sem pendência, cartão/botão do pet ausentes, novo texto do painel); nenhuma outra.
- Código Java real do aplicativo (`equipe/testes/feedback-topo.java.py` + `FeedbackTopoHarness.java`): **88 verificações**; retenção das 10 correções da `main` igual à do 294 (9 mantidas, Raposinha em conflito como sempre); "Revisar atualização" sobre o 294, o 292 e o 288; "Revisar restauração" ao voltar ao 294; reimportar é ignorado.
- Testes oficiais do Android: **18/18** com as páginas do 295.

**Não testado:** Xiaomi, iPhone, servidor real, pet de verdade (o teste usa um cartão e uma janela do pet com os mesmos ids do aplicativo e chama `APFeedbackStudent.decorate()`).

**Como reverter:** Central de atualizações → ⋮ → "Restaurar versão anterior" (volta ao 294). Nenhum dado de aluno é afetado.
