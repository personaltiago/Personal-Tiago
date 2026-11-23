# Agenda Personal — ESTADO

## 0. Atualização de 20/11/2026 (Claude, issues #22 e #23; PR #25 em rascunho, revisão de 20/11 12:47 aplicada) — vale acima das seções antigas

**23/11, 9h (Claude): 1.12.306/412 — arquivar sozinho quem não paga (PR, proposto); 1.12.305 assinado.**
- **1.12.305 assinado:** o Tiago respondeu "Pode juntar" (~07:30). PR #45 juntado pelo Claude depois do CI verde, merge `301cb37`.
  - Execução 45166321377: "Conferir regressão antes de assinar" e "Assinar e verificar com a chave oficial" ok; artefato 14813604551; pré-lançamento `conteudo-45166321377-1`.
  - Arquivo assinado com SHA-256 `398902bc…`; sem a assinatura, idêntico ao proposto. O "latest" continua `android-1.210-…`.
  - Link mandado ao Tiago às 07:36. Instalação ainda não confirmada: o canônico continua 1.12.304.
  - **Referência agora 1.12.305/411; próxima versão livre 1.12.306/412** (CLAUDE.md atualizado).
- **Pedido do 1.12.306:** Tiago, 07:13: "cada pessoa [que] não paga a mensalidade tem que ser arquivada automaticamente; o lembrete de pagamento tem que ser mandado ainda". Às ~07:30 escolheu "Automático com tolerância" e "5 dias".
- Antes não existia arquivamento automático do aluno: só "Arquivar por atraso" (Financeiro) e Arquivar (perfil).
- Gerador `tools/gerar-arquivar-sem-pagamento-1.12.306.cjs`, a partir do 1.12.305. SHA-256 `e9c603aef95c53349efe402c13549c40e3ad4f1b5548c87e1ae5b5ee9082845e`.
- Só `professor.html`, em dois blocos novos antes de `</body>`: `ap-finance-auto-archive-css` e `ap-finance-auto-archive`. Fora dos blocos entram só as marcas deles (conferido).
- Como funciona:
  - **Regra:** 6 s depois de abrir o app e de voltar para ele, quem tem financeiro ativo e mensalidade vencida há 5 dias ou mais é arquivado (venceu dia 10 → arquivado a partir do dia 15). É o Arquivar de sempre (`archived:true`, `archiveReason:'payment-auto'`), numa gravação só e com registro no Histórico.
  - **Efeitos:** o aluno sai da agenda e o despertador das aulas dele para (1.12.305). Os treinos são bloqueados no app do aluno pelo mesmo envio do Arquivar manual. A cobrança continua: ele fica no Financeiro e o lembrete de cobrança não muda.
  - **Aviso e Desfazer:** uma janela (página inteira no celular, como as outras) lista quem foi arquivado, com Desfazer por aluno.
  - **Sem rearquivar:** Desfazer e o Reativar de sempre gravam `reactivatedAt`. Com isso o aluno fica ativo até o vencimento mudar, ou seja, até o pagamento ser registrado.
  - **Primeira vez neste aparelho** (marcador `agendaAutoArchive_v1` no localStorage): quem já tinha 5 dias ou mais de atraso não é arquivado sozinho. A janela mostra a lista com "Arquivar estes N alunos"; "Agora não", Voltar ou × fecham sem arquivar e não perguntam de novo.
  - **Pausas:** não roda com o app em segundo plano, durante a restauração de backup, com backup restaurado ainda não reunido com a conta, nem no contexto do aluno.
- Dependências: `refreshAgendaState` (embrulhado), `daysUntil`, `validWorkoutDate`, `commitWorkoutChange`, `syncNativeAlarms`, `openDialog`/`closeDialog`, `setFinanceView`, `hesc`, e o publicador `data-ap-student-area` (embrulha `renderAll`) para o bloqueio no Firebase. O gerador confere todas no 1.12.305.
- Riscos e limites:
  - Com dois aparelhos, um pagamento registrado no outro só chega pela sincronização da conta. Os 6 s de espera reduzem o risco, mas não o eliminam; a janela com Desfazer é a rede de segurança.
  - Lembrete de cobrança: o app avisa antes e no dia do vencimento. Não há lembrete repetido depois do vencimento, nem antes nem agora.
  - Não há chave para desligar no app; para desligar, é uma atualização.
- Testes:
  - verificador (modo pr): aprovado (2 blocos novos e as marcas fora dos blocos, autorizados);
  - teste do verificador: 45/45;
  - mecanismo real: aprovado;
  - testes oficiais: 18/18;
  - funcionalidades: aprovado (os 2 avisos antigos de "guardar a agenda no telefone");
  - conferência antes de assinar: aprovada; raiz: 33 arquivos classificados;
  - Chrome (`equipe/testes/navegador/arquivar-306/`, dados fictícios, toque de celular): 30/30. Cobre o 1º dia com a lista de atrasados e "Arquivar estes 2 alunos"; Voltar = não arquivar; no dia seguinte, quem completa 5 dias é arquivado sem toque, com o despertador sem a aula dele, a cobrança mantida e a área do aluno com `enabled:false`; Desfazer sem rearquivar; pagamento registrado; as pausas; voltar para o app; o aviso como página inteira, nos modos escuro e claro; e o 1.12.305 sem nada disso.
  - Sem teste em aparelho.
- Instalar: depois de assinado, importar na Central (inclui tudo do 1.12.305). Reverter: Central → Restaurar versão anterior. O que já foi arquivado continua arquivado; reative em Alunos → Arquivados.

**23/11, 8h (Claude): 1.12.305/411 — aluno arquivado sai da agenda (PR, proposto).**
- Pedido (Tiago, 07:06, com fotos): uma aluna arquivada continuava na Semana (segunda 17:55). "Quando eu arquivo, ele deixa de ser aluno."
- Causa: arquivar (manual ou "Marcar em atraso e arquivar") só marca `student.archived`. As aulas dele, inclusive as fixas, continuavam valendo em tudo que gera as aulas do dia.
- Decisão do Tiago sobre as áreas protegidas (07:13): o despertador e o lembrete das aulas do aluno arquivado param; o lembrete de cobrança continua ("se a pessoa pagar, aí eu desarquivo").
- Gerador `tools/gerar-arquivado-fora-da-agenda-1.12.305.cjs`, a partir do 1.12.304 (referência). SHA-256 `691fbef2510b36ec9b1437c3728429d990378562fc1c32c1fc32a8f93928c536`.
- O que muda (só `professor.html`; nada é apagado):
  - `#fora-dos-blocos`: `occurrences()` (Hoje, Semana, Painel, reposições) e `blockingOccurrencesOnDate()` (Horários livres, conflito) pulam a aula de aluno arquivado, menos a marcada como realizada (histórico).
  - `candidateConflict()` ignora o horário de aluno arquivado, que fica livre para outro aluno.
  - `syncNativeAlarms()` deixa de mandar ao Android as aulas de aluno arquivado. A cobrança (`students`) e os treinos (`workoutStudents`) enviados não mudam.
  - `ap-student-archive`: a mensagem de Arquivar diz que o aluno sai da agenda. Ao reativar, o app avisa se algum horário dele foi ocupado. Arquivar e reativar reenviam os avisos ao Android na hora (antes o despertador só seria atualizado ao abrir Hoje, Semana ou Configurações).
  - Não muda: `isOccurrence()` e o cronômetro da aula, descanso, notificações da tela bloqueada, Firebase, login, financeiro e o app do aluno. `automaticAvailabilityDefaults()` (janela padrão dos horários automáticos) ficou igual de propósito.
- Dependências: `ap-student-archive` (bloco do arquivar) e funções da agenda fora dos blocos; o lado Android (`AlarmScheduler.synchronize`) cancela os planos das aulas que saem da lista e mantém os cronômetros em andamento (conferido no código do APK 1.210, sem mudança nele).
- Testes:
  - verificador (modo pr): aprovado;
  - teste do verificador: 45/45;
  - mecanismo real: 210 verificações;
  - testes oficiais: 18/18;
  - funcionalidades: aprovado (2 avisos antigos de "guardar a agenda no telefone", que existe: seção 4.2 desatualizada, nada a ver com esta mudança);
  - conferência antes de assinar: aprovada; raiz: 32 arquivos classificados;
  - Chrome (`equipe/testes/navegador/arquivado-305/`, dados fictícios): 20/20. No 1.12.304 o defeito aparece; no 1.12.305 a aluna arquivada some de Hoje, Semana, Painel e Horários livres, a aula realizada fica no histórico, nada é apagado, o despertador dela sai e a cobrança fica, e reativar traz tudo de volta.
  - Sem teste em aparelho.
- Fora deste pacote: **arquivar automaticamente quem não paga não existe hoje** (só o botão manual "Marcar em atraso e arquivar" do Financeiro). Ficou para o Tiago decidir se quer e com qual regra.
- Instalar: depois de assinado, importar na Central (inclui tudo do 1.12.304). Reverter: Central → Restaurar versão anterior.

**22/11, 15h50 (Claude): Raposinha retirada da raiz (pedido do Tiago, 15:49) + 1.12.304 publicado para os alunos.**
- O Tiago publicou o 1.12.304 para os alunos manualmente ("Já foi publicado… eu publiquei manualmente", 15:47, sem print).
- `AgendaPersonal-Pets-Raposinha.agenda.json` saiu da raiz e foi movida, byte a byte (SHA-256 `84b0ede8…`), para `equipe/testes/regressao/casos/`.
  - Motivo: o arquivo não é só a Raposinha. Ele troca os 4 blocos dos mascotes (`ap-student-mascot-model`, `-art`, `ap-mascot-homes`, `ap-mascot-home-assets`) por cópias antigas, com o Galo e as 5 cores dele.
  - Hoje o app recusa a correção inteira por conflito em `ap-student-mascot-model`.
  - Fora da raiz ela não é assinada (o fluxo só lê `*.agenda.json` da raiz) e continua servindo de caso de conflito nos testes.
- Ferramentas: `arquivos-da-main.cjs` também procura em `casos/`; o relatório anota a retirada; `conferir-raiz.cjs` conta os arquivos que estão de fato na raiz (31). O manifesto não mudou (SHA-256 `977f9906…`).
- Testes: teste do verificador 44/44 (a Raposinha continua reprovada por CONFLITO); mecanismo real 211 verificações; funcionalidades aprovado; INVENTARIO confere.
- Nada mudou no app nem nos mascotes. Reverter: mover o arquivo de volta para a raiz.

**22/11, 15h30 (Claude): 1.12.304 instalado — canônico passa a 1.12.304.** O Tiago confirmou "Deu certo" às 15:30, depois do link do 1.12.304 assinado (execução 45046266345, artefato 14762824563, pré-lançamento `conteudo-45046266345-1`, SHA-256 do assinado `30384d8f…`), sem print. Os 1.12.302 e 1.12.303 não foram instalados separadamente (o 1.12.304 inclui os dois). Publicação para os alunos: não confirmada (o aluno da foto das 12:41 estava na 1.12.300). Achado para depois: em Mais, "Sons e alertas" e "Configurações" agora abrem a mesma tela (despertador e sons).

**22/11, 13h (Claude): 1.12.304/410 — ícones do Perfil do aluno (PR); 1.12.303 assinado.**
- **1.12.303 assinado:** PR #41 juntado pelo Claude a pedido do Tiago ("pode juntar as duas atualizações numa só", 12:45), merge `20e9af1`. Execução 45045674146, artefato 14763437112, pré-lançamento `conteudo-45045674146-1`, arquivo assinado com SHA-256 `11d169aa…`. O "latest" continua `android-1.210-…`. **Referência agora 1.12.303/409; próxima versão livre 1.12.304/410.** O Tiago vai instalar direto o 1.12.304, que inclui o 303 e o 302; o canônico continua 1.12.301.
- **1.12.304** (foto do Tiago, 12:41: Perfil do aluno com itens sem ícone). Gerador `tools/gerar-icones-perfil-aluno-1.12.304.cjs`, a partir do 1.12.303. SHA-256 `6bc7982e6e4b8daf4e32345d6cc287edf7ed9dbcbda81eb30ad59a21ea2cd1ef`.
  - Causa: "Sons do treino", "Pet" e "Atualizações" tinham um `<svg>` solto num `<span>` sem tamanho; na linha flex do menu ele encolhia a 0×0.
  - Correção: os três passam a `data-profile-icon` (`sound`, `pet` e `update`), com desenhos novos no `profileSymbol`, contorno e traço 2 como os outros. Ficam com 27×27 e a cor do tema, também no modo claro.
  - Só o `index.html` muda, fora dos blocos. Autorização em `alteracoes-autorizadas/1.12.304.json`.
  - Na foto, o aluno ainda vê "Nova versão 1.12.300 disponível": para os alunos, a última versão publicada é a 1.12.300.
- Testes:
  - verificador (modo pr): aprovado;
  - teste do verificador: 45/45;
  - mecanismo real: 210 verificações;
  - testes oficiais: 18/18;
  - funcionalidades: aprovado;
  - conferência antes de assinar: aprovada;
  - Chrome (`equipe/testes/navegador/icones-perfil-304/`): 7/7 (no 1.12.303 os três ficam 0×0; no 1.12.304, 27×27 na cor do tema, também no modo claro).
  - Sem teste em aparelho.
- Instalar: o Tiago instala só o 1.12.304 (inclui 303 e 302). Reverter: Central → Restaurar versão anterior.

**22/11, 13h (Claude): 1.12.303/409 — Tamanho das letras e Feedback com cartões próprios (PR); 1.12.302 assinado; proteção dos testes corrigida.**
- **1.12.302 assinado:** PR #40 juntado pelo Claude a pedido do Tiago ("pode juntar", 12:04), merge `2d00cb4`. Execução 45041744787: conferência aprovada, "Assinado e conferido", artefato 14761878109, pré-lançamento `conteudo-45041744787-1`, arquivo assinado com SHA-256 `7cc16b50…`. O "latest" continua `android-1.210-…` (primeiro uso real do link direto do #39). Instalação: o Tiago descreveu o cartão em Configurações (12:20), mas **não confirmou**; o canônico continua 1.12.301. **Referência agora 1.12.302/408; próxima versão livre 1.12.303/409.**
- **1.12.303** (pedido do Tiago, 12:20: "tudo fica separado"). Gerador `tools/gerar-cartoes-separados-1.12.303.cjs`, a partir do 1.12.302. SHA-256 `b865827a6bd69c9408067e02622f25124dbdcce9d3c9e767ae3cf00bb46791b4`.
  - Mudanças, só no professor:
    - Mais → Aparência e preferências ganha os cartões "Tamanho das letras" (depois de Painel de cores) e "Feedback" (depois de Configurações), cada um com tela própria.
    - Configurações fica só com despertador e sons.
    - Os controles são os mesmos, com os mesmos ids e as mesmas chaves de gravação; nada precisa ser configurado de novo.
    - Ícones novos `menu-text` e `menu-feedback` nos três desenhos do menu (`ap-more-menu-glyphs`, metal e deep).
  - Blocos: `ap-more-menu-glyphs`, `ap-more-organization`, `ap-feedback-name` e `#fora-dos-blocos` do professor. Autorização em `alteracoes-autorizadas/1.12.303.json`.
  - O Mais pede dois toques, como em todos os cartões: o primeiro destaca, o segundo abre.
- **Proteção dos testes (achado ao mudar a referência para o 1.12.302):**
  - O manifesto e o harness Java só reconheciam uma correção como "evoluída" se OUTRA CORREÇÃO a continuasse. O 1.12.302, um pacote completo autorizado, continuou o `ap-feedback-student`, e os dois complementos de feedback viraram "conflito". Com isso, o bloco **deixava de ser protegido**: uma mudança sem autorização passava. O recibo do Pix já estava "conflito" na `main` pelo mesmo motivo (dois caminhos, 1.12.299 e 1.12.300, e a busca só seguia o primeiro).
  - Agora a linha segue todos os caminhos e aceita as alterações autorizadas dos pacotes já assinados (até a referência). Isso vale em `gerar-manifesto.cjs`, `RegressaoBase.java`/`RegressaoHarness.java` e `mecanismo-real.py`.
  - Resultado: Pix e os dois complementos de feedback ficam "evoluída" e protegidos. A Raposinha continua "conflito".
  - `testar-verificador.cjs`: a trava antiga ("bloco da referência mudou depois do 295 + complementos") virou conferência de que os complementos continuam vivos. O "Feedback online" reimportado passa a ser reprovado por CONFLITO (o app recusa; nada a assinar).
- Testes do 1.12.303:
  - verificador (modo pr): aprovado;
  - teste do verificador: 45/45;
  - mecanismo real: **210** verificações (11 correções acompanhadas; eram 8). Sem candidato, a referência dá 211;
  - testes oficiais: 18/18;
  - funcionalidades: aprovado (2 avisos já conhecidos);
  - conferência antes de assinar: aprovada;
  - Chrome (`equipe/testes/navegador/cartoes-separados-303/`): 11/11 (cartões, ícones, telas, Voltar, gravação, acabamento 3D, escolhas antigas mantidas).
  - Sem teste em aparelho.
- Instalar: juntar o PR → assinatura → link direto → importar na Central. Reverter: Central → Restaurar versão anterior (volta ao 1.12.302).

**22/11, 12h (Claude): 1.12.302/408 — Nome nos feedbacks (PR em rascunho; o pacote vai junto no PR, fluxo novo do #39).**
- Pedido do Tiago (11:31) e aprovação (11:36). Gerador `tools/gerar-nome-feedbacks-1.12.302.cjs`, a partir do 1.12.301 (SHA-256 `daf5e60f…`). Pacote `AgendaPersonal-1.12.302-Nome-Feedbacks-Para-Assinar.agenda.json`, SHA-256 `bb04ce6f59279e02d06dfd02c2c3ace762ca78f1bfaea4d0fa1e11b0036d59e1`.
- O que muda: Configurações ganha "Nome nos feedbacks" (até 40 letras, em `state.trainerProfile.feedbackName`). O rodapé do cartão de feedback vira "<nome> · Acompanhamento de treino." (vazio = Agenda Personal, igual a hoje). O nome vai ao aluno em `area.trainer.feedbackName`, dentro do `payload` que já é enviado, sem mudar regra nem coleção do Firebase. Salvar chama `save()`, que já reenvia as áreas.
- Blocos: `ap-feedback-card` (as duas páginas, texto idêntico), `ap-feedback-student`, `ap-feedback-teacher`, `#fora-dos-blocos` do professor (tela Configurações e `data-ap-student-model`) e dois blocos novos, `ap-feedback-name-css` e `ap-feedback-name`. Autorização: `alteracoes-autorizadas/1.12.302.json`. Classificado na cadeia como proposto. A referência continua 1.12.301 até a assinatura.
- Compatibilidade: aluno com pacote antigo aceita a área nova e ignora o campo (testado com o `assertArea` do 1.12.301). Sem nome, o cartão sai idêntico ao do 1.12.301, pixel a pixel.
- **Brecha corrigida nos testes:** um pacote já classificado na cadeia, mas proposto depois da referência (não assinado), caía no atalho de "reassinatura" e pulava a conferência, no verificador e no mecanismo real. Agora o atalho só vale até a referência. Novo caso em `testar-verificador.cjs`: reprova com o código antigo e passa com o novo.
- Testes: verificador (modo pr) aprovado; teste do verificador 45/45; mecanismo real 169 verificações; testes oficiais 18/18; funcionalidades aprovado (2 avisos: "guardar agenda no telefone" parece restaurada, o que confere com o print do Tiago); conferência antes de assinar aprovada; Chrome (`equipe/testes/navegador/nome-feedbacks-302/`) 25/25. Sem teste em aparelho.
- Instalar: o Tiago junta o PR → a assinatura roda → link direto (pré-lançamento) → importar na Central. Reverter: Central → Restaurar versão anterior (volta ao 1.12.301). O nome salvo fica guardado e é ignorado pelo 1.12.301.

**22/11, 11h (Claude): link direto do arquivo assinado (PR em rascunho, só workflow) + arrumação de PRs e correção deste arquivo.**
- `assinar-atualizacoes-agenda.yml` ganha o job `link-direto` (depois de `assinar`, sem acesso à chave, `contents: write` só nele): cria um **pré-lançamento** `conteudo-<execução>-<tentativa>` com o(s) `…-Assinado.agenda.json` e escreve o link direto no resumo da execução. Assim o Tiago baixa o `.json` no celular sem abrir ZIP. Nada mais muda: verificação antes de assinar, assinatura e artefato continuam iguais.
- Risco tratado: o site (`worker/index.js`, `officialInstaller`) e o app (`AndroidInstaller.java`) leem `releases/latest` e só aceitam tag `android-*`. Pré-lançamento nunca é "latest" (e vai com `--latest=false`); mesmo assim, o job confere o `latest` depois e, se não for `android-*`, apaga o pré-lançamento e falha.
- Testes: `actionlint` sem avisos; simulação do passo com `gh` falso (latest `android-*` → cria e escreve o link; latest outro → apaga e falha; pacote completo e correção por área nas notas com versão e SHA-256). Sem execução real: a primeira assinatura depois do merge é o teste.
- Reverter: remover o job `link-direto` e o `outputs` do job `assinar`; os pré-lançamentos podem ser apagados sem efeito no app.
- Arrumação (21/11, aprovada pelo Tiago): PRs #10–#24 fechados (versões já na cadeia), #4–#8 fechados (mural e modo telefone antigo, nunca integrados), #1 fechado; #28 juntado (`fadb7ac`). PR #32 juntado na `chatgpt/app-web` e site republicado (versão 45; `sw.js` público com cache `agenda-personal-web-shell-v9`, conferido 22/11).
- **Correção das seções 4.2 e 9:** "Guardar a agenda no telefone" **não está perdido**: o Tiago mostrou no app (22/11, 10:56) "Modo telefone ativo · 505 KB… Cópia no telefone: OK". As opções de áudio (4.1) não foram reconferidas no aparelho.

**21/11, 18h40: 1.12.301 instalada (canônico)**, por confirmação do Tiago (18:37), sem print. PR #32 do ChatGPT (barra e recibo do app web) revisado pelo Claude: testes do PR passam (8 + 7 cenários no Chrome); só vale no app web (precisa de `APWebPlatform`), não muda o Android; juntar o PR não publica o site (a publicação do chatgpt.site é feita pelo ChatGPT).

**21/11, 18h20: 1.12.301 subida (`ee472a7`) e assinada (execução 44942130415, artefato 14721852272); PR #36 juntado com a aprovação do Tiago. Referência agora 1.12.301/407; próxima versão livre 1.12.302/408.** A conferência antes de assinar aprovou com aviso (a autorização do 1.12.301 ainda não estava na main; o bloco não é protegido). Instalação ainda não confirmada.

**21/11, 15h40: 1.12.300 validada por relato do Tiago** ("os testes no Android e no iPhone… foi feito, deu certo", 15:38). Sem prints nem detalhe por função; registrado assim em `status-pacotes.json`. APK 1.210 instalado e validado pelo Tiago (13:27: "Ocultar" enquanto carrega, "Fechar" no erro).

**21/11, 14h (Claude): 1.12.301/407 — Publicar para os alunos não vai a 100% no erro (PR em rascunho).** APK 1.210 instalado e validado pelo Tiago (13:27: "Ocultar" enquanto carrega, "Fechar" no erro). Pacote completo a partir do 1.12.300 (o bloco `ap-distribution-controls` não está em nenhuma área do UpdateAreaPatch), mudando só esse bloco: no erro, a barra usa o último progresso real ("Parou em X%" ou "Enviado, sem confirmação"), nunca 100%. Testes: Chrome 300 x 301 (queda em 25%: 100% → "Parou em 25%"), verificador PR/assinatura aprovado com `alteracoes-autorizadas/1.12.301.json`, mecanismo real 169, oficiais 18/18. Gerador `tools/gerar-publicar-erro-1.12.301.cjs`. Para assinar: juntar este PR (a autorização precisa estar na main) e o Tiago sobe o arquivo.

**21/11, 13h15 (Claude): APK 1.210 em PR — botão "Fechar" no fim.** APK 1.209 (PR #33) gerado, publicado (Release `android-1.209-conteudo-1.12.269-44927980408`) e instalado; barra validada no Xiaomi (prints 13:08: sem assinatura → 48% vermelha; 1.12.300 reimportada → 55% "já está instalado"). Pedido do Tiago (13:10): no fim o botão diz "Ocultar" e devia dizer "Fechar". 1.210: "Ocultar" enquanto a importação continua, "Fechar" quando concluiu ou deu erro; e a linha "Etapa N de 4" deixa de ficar vazia no erro. Só `UpdateProgress` + teste + versão.

**21/11, 13h: 1.12.300 registrada como INSTALADA (canônico).** Evidência: print "Versão instalada: 1.12.300" (11:27) e confirmação do Tiago ("Sim", 13:03); publicada para Android/iPhone/navegador pelo app (prints 11:25–11:26). Funções novas da 300 ainda não validadas no aparelho. Com isso, reassinar 1.12.294 ou 1.12.295 passa a ser reprovado (volta). PR #33 (APK 1.209, textos claros) juntado (`8ccd826`); APK 1.209 ainda não gerado.

**21/11, 12h (Claude): APK 1.208 publicado e instalado; barra validada no Xiaomi; correção de cor em 1.209 (PR em rascunho).** O Tiago rodou "Gerar e publicar APK" (execução 44921837164, Release `android-1.208-conteudo-1.12.269-44921837164`) e instalou. Teste no aparelho com um arquivo sem assinatura (21/11 12:13): a barra parou em 48% em "Conferindo a assinatura", vermelha, "Nada foi instalado" e o motivo certo. Defeito visto no print: os textos da janela herdavam a cor escura do tema e quase não apareciam (e "Etapa 2 de 4" sumiu). Correção no **Android 1.209**: cores claras explícitas nos textos (`UpdateProgress`), teste com a verificação das cores; nada mais muda. PR #31 (ChatGPT, outra barra também numerada 1.208) fechado sem merge por decisão do Tiago.

**21/11, manhã (Claude): barra de progresso na importação do APK — PR em rascunho, APK NÃO gerado.** ZIP oficial atualizado para **Android 1.208** (conteúdo embutido continua 1.12.269): classe nova `UpdateProgress` (janela com barra: leitura 0–40% pelos bytes, conferência 42–60%, instalação 70–90%, 100% só quando a nova versão abre e confirma; erro ou cancelamento para onde estava, em vermelho, "Nada foi instalado"; "Ocultar" fecha só a janela) chamada pelo `UpdateManager` (importUri, revisão, confirmação, snapshotAndApply, pageReady, recuperações). Nada da validação, assinatura ou instalação mudou. Teste novo `tests/verify_update_progress.py` (48 verificações; reprovou duas quebras de propósito) + suíte nativa inteira do ZIP aprovada; workflow novo `compilar-apk-teste.yml` compila com o SDK real em PR, sem chave e sem publicar. Para virar APK: o Tiago aprova, junta o PR e roda "Gerar e publicar APK Agenda Personal" (esse fluxo publica). Detalhes: `equipe/relatorios/2026-11-21-claude-barra-importacao-apk.md`.

**Atualização de 20/11, 21h (Claude), `main` em `39c35e1`:** o Tiago subiu o **1.12.299/405** (`0f06f40`, assinado 44839477648) e o **1.12.300/406** (`39c35e1`, assinado 44849098710, artefato 14684233109), os dois gerados pelo Claude (PR #28) e idênticos byte a byte. **Referência agora: 1.12.300/406; próxima versão livre 1.12.301/407.** Instalação não confirmada (canônico instalado segue 1.12.294). Os testes passam a seguir a referência do manifesto (teste do teste e Java não fixam mais versões); Java: 170 verificações com o 1.12.300 como referência.

**Atualização de 20/11 à noite (Claude, depois da avaliação do ChatGPT), `main` em `9a86cc9`:**
- Dois arquivos novos na main, **não gerados pelo Claude**: a correção por área **"Feedback online e compartilhamento"** (`b7aa787`, SHA-256 `2bd0403e…c9a6`, assinada 44794359438; muda `ap-feedback-sync` e `ap-feedback-student` sobre o "Feedback somente no topo") e o pacote completo **1.12.298 / 404 "Feedback consolidado"** (`9a86cc9`, SHA-256 `602b204b…7973`, assinado 44797870274), com páginas idênticas a 295 + os dois complementos.
- **Referência agora: 1.12.298 / 404. Próxima versão livre para pacote completo: 1.12.299 / 405.** O "Feedback somente no topo" reimportado sobre a referência dá conflito (já continuado), o que é correto. Canônico instalado continua 1.12.294 (a foto com 1.12.297 é indício, não confirmação de instalação).
- **Erro do executor dos testes oficiais (achado do ChatGPT, confirmado):** 10 dos 18 testes liam `web/native-release.agenda.json` (1.12.269) e não o pacote; os "18/18" anteriores valiam só para 8 testes. Corrigido (`c4e233f`): 18/18 reais no 298 e na referência; o mutante do limite de histórico (200→201) agora reprova.
- **Achados de conteúdo ainda não corrigidos (precisam de 1.12.299+ aprovado pelo Tiago):** (a) IMC na avaliação ignora a idade (`weightReferenceStatus` usa só 18,5/25; idoso 67 kg/1,60 m = 26,2 aparece acima, pela referência do Ministério da Saúde para ≥60 anos, 22–27, é adequado); (b) "Recebido" do financeiro soma todos os pagamentos do mês sem juntar os do mesmo aluno e vencimento (deduplica só pelo id): dois registros para o mesmo vencimento somam os dois (fluxo de tela não reproduzido); (c) a importação nativa do Android mostra só texto, sem barra de progresso.

**Conteúdo (pacotes `.agenda.json`), conferido pela API e pelos SHA-256 em 20/11, `main` em `3ab3556`:**
- **Canônico instalado: 1.12.294 / 400** (SHA-256 `2bf38cc5…30e9`; upload `f7ea686`; assinado 44707518866; instalado no aparelho do Tiago, relato com fotos de 20/11 11:38; validado só em parte).
- **1.12.295 / 401** (Feedback pelo ícone do topo, PR #24): upload `7a41338`, assinado 44769018803 (artefato 14646008941). **Não instalado** (sem confirmação).
- **"Feedback somente no topo"** (`AgendaPersonal-Feedback-Somente-No-Topo-Para-Assinar.agenda.json`, correção por área, SHA-256 `17894274…252d`): upload `3ab3556` (20/11 12:34; não foi gerada pelo Claude), assinada 44774714035 (artefato 14648119398). **Depende do 1.12.295** (o app a recusa sobre o 1.12.294). Completa o 295: retira o toque no pet que ainda abria o feedback e o acompanhamento da janela do pet (o 295 do Claude não tinha tirado esse toque). **Não instalada** (sem confirmação).
- **Referência (o que nenhuma atualização nova pode perder): 1.12.295 + "Feedback somente no topo"**, que o app numera **1.12.296 / 402** ao instalar a correção. **Próxima versão livre para pacote completo: 1.12.297 / 403.** Um 1.12.296/402 completo seria recusado (sequência igual à da referência).
- Inventário (passos, funcionalidades, correções, PRs, paridade por área, Raposinha): `equipe/canonico/INVENTARIO.md` (gerado).
- **Correções da main na referência:** 01, 02, 03, Apagar exercício (as duas), Pix sem anexos, Sininho de cadastro, Sons do treino e "Feedback somente no topo" **presentes**; Ficha recolhível 253 **evoluída**; **Raposinha em conflito** (feita sobre o modelo de mascotes do 1.12.255, que ainda citava o Galo; nunca esteve em pacote completo; nada alterado nos mascotes; decisão do Tiago).
- A seção 4.2 abaixo está desatualizada para o conteúdo: "Guardar a agenda no telefone" e `nsActivate` existem no `professor.html` desde o 1.12.273.

**Proteção (no PR #25, ainda não na main):** `CLAUDE.md`; `equipe/canonico/` (referência e canônico, hashes, histórico, funcionalidades, estados, autorizações, conferência da raiz); `equipe/testes/regressao/` (verificador, 40 casos propositais, mecanismo real em Java, `conferir-antes-de-assinar.sh`); CI `verificar-regressao.yml` em todo PR; os **três** fluxos de assinatura de conteúdo rodam a conferência (verificador + mecanismo real) antes de ler a chave. `android-apk.yml` (APK) não é coberto.

**Correções da revisão independente (20/11 12:47):** (1) mudar o bloco de uma correção protegida passa a exigir autorização, qualquer que seja o conteúdo novo — a 03 do 1.12.288 com um comentário é reprovada pelo verificador e pelo mecanismo real, e o mecanismo real roda também antes de assinar; (2) referência inclui o complemento e o protege; envio novo na raiz fora do manifesto reprova o CI; (3) a conferência cobre `assinar-ficha-recolhivel.yml` (o conteúdo dele é reprovado: conflito) e `assinar-descanso-aluno.yml` (passa: já presente; descanso intacto); (4) passos para tornar `regressao` obrigatório em `equipe/canonico/LEIA-ME.md`.

**Limite:** o ruleset "Proteger main" (27377643) só bloqueia apagar a branch e push forçado. **Não há verificação obrigatória** até o Tiago configurar (LEIA-ME). Não testado em Xiaomi nem iPhone/Safari.

---

**Atualizado em:** 13/11/2026, pelo Claude, para revisão do ChatGPT e aprovação do Tiago.
**Fonte:** `main` em `b10f0ddf060d73c367f30f305e881dd6bc423b60`, arquivo `AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip`, extraído numa pasta temporária, sem alterar o original.

Classificação:
- **[V]** verificado no código ou em testes;
- **[A]** aprovado expressamente pelo Tiago;
- **[H]** hipótese ou comportamento ainda não confirmado.

---

## 1. Versão atual na `main`

| Item | Valor | Classe |
|---|---|---|
| Android (`versionName`) | **1.204**. O `versionCode` local é 204; no APK publicado, o CI usa o número da execução. | [V] |
| Conteúdo (`native-release.agenda.json`) | **1.12.268** | [V] |
| Sequência | **374**, com `BASE_VERSION = "1.12.268"` e `BASE_SEQUENCE = 374` em `UpdateManager` | [V] |
| Conferência `tools/check_release.cjs` | "Android 1.204 / conteúdo 1.12.268 / sequência 374" | [V] |
| `tests/run_all.py` | **Passou inteiro** (código de saída 0) em 13/11/2026, nesta extração | [V] |
| Último APK publicado | Release `android-1.204-conteudo-1.12.268-43475026488`, de 13/11 às 17:41 UTC, a partir de `b10f0dd` | [V] (API pública) |
| Instalado no celular do Tiago | 1.204 | [H]. Não confirmado depois da última publicação. |

Quantidade de blocos `ap-*` por tela [V]:
- `index.html`: 122 blocos com id;
- `professor.html`: 133;
- `avaliacoes.html`: 24;
- `cadastro.html`: 14.

---

## 2. Funcionalidades existentes (presentes no código) [V]

A lista vem dos blocos `ap-*` de cada tela. **Estar no código não significa ter sido validado no aparelho.**

- **Professor:**
  - agenda semanal compacta, disponibilidade, conflitos e lista de espera;
  - prioridade de aulas;
  - fichas de treino com correções, instruções, séries anteriores, séries por tempo e cardio;
  - exportar a ficha em TXT; ficha recolhível; atalho de treino ativo;
  - vídeos externos, com aviso de vídeo duplicado;
  - arquivo de alunos; acompanhamento; feedback; progresso do aluno;
  - aparência e tamanho de texto;
  - menu Mais organizado;
  - cartão Armazenamento, cópia nativa e proteção de gravação;
  - relógio (smartwatch).
- **Aluno:**
  - área do aluno, treinos, vídeo embutido e finalização;
  - recuperação de sessão;
  - áudio do treino do aluno;
  - notificações; mensagem do dia; acesso; identidade;
  - avaliações na tela inicial;
  - mensalidade do aluno;
  - pet do aluno e do professor.
- **Financeiro:** modelo de cobrança, carteira, resultados financeiros, recibo e comprovante Pix.
- **Pets:**
  - Capivara, Gato e Lobo;
  - casas, carinho, reações e o pet do professor.
- **Atualizações:**
  - Conferência de atualizações, com áreas e módulos;
  - pacotes `.agenda.json` assinados;
  - importação com revisão e download da versão em uso;
  - proteção de atualização (`ap-update-safety`).
- **Cadastro:** link de cadastro, fotos e capa.
- **Avaliações:** PDF e relatórios, e integração com a agenda.
- **Sons e temporizadores:**
  - compatibilidade do cronômetro (`ap-timer-compatibility`);
  - som do cardio; prévia de sons;
  - faixa flutuante do descanso;
  - ajustes de áudio do treino no modelo antigo (`ap-workout-audio-settings`).

---

## 3. Funcionalidades aprovadas pelo Tiago

As duas colunas são independentes:
- **"Aprovado"** registra que o Tiago aprovou a funcionalidade numa versão anterior [A].
- **"Na 1.204"** registra o que foi conferido **nesta** versão, no código ou em teste automático [V], ou o que ainda não foi conferido [H].

Nenhuma linha está validada **no aparelho** na 1.204; isso continua [H] até o Tiago confirmar.

| Funcionalidade | Aprovado (versão) | Na 1.204, código e testes | Na 1.204, aparelho |
|---|---|---|---|
| Urso (panda) e Galo removidos dos pets. Quem tinha um deles vira gato, com XP, moedas e compras mantidos. | [A] 1.195 | [V] teste `pets_removed` (26 verificações) passou | [H] |
| Conferência de atualizações: Pets só com Gato, Lobo e Capivara | [A] 1.203 | [V] `UpdateAreaPatch.MODULES` só tem gato, lobo e capivara; `update-catalog.js` não tem urso, galo, peixe nem raposa | [H] |
| Mascotes de fundo de Avaliações com a imagem original | [A] 1.193 | [V] teste `size_reductions` confere as dimensões originais | [H] |
| Emblema fixo do app, com a cor do tema e sem upload de logo | [A] 1.18x | [V] teste `app_symbol` (21) passou | [H] |
| Foto do professor só a dele; sem foto, as iniciais | [A] 1.191 | [V] `trainer-photo-initials` e "Remover foto" presentes no `professor.html` (sem teste dedicado) | [H] |
| Histórico limitado a 200 | [A] 1.189 | [V] teste `history_limit` passou | [H] |
| `.agenda.json` sem assinatura só por importação manual, com confirmação | [A] 1.194 | [V] teste `update_import_review` (196) passou | [H] |
| Descanso na tela bloqueada aparecendo | [A] 1.201 ("Vc e top parabéns") | [V] o cartão da 1.204 é o mesmo da 1.201 (`restTitle` em `LessonTimerOverlayService`) | [H] (sem print da 1.204); a piscada continua pendente |

---

## 4. Regressões confirmadas

### 4.1 Áudios do treino (opções de áudio) — perdidos na 1.199 e por isso também na 1.204 [V]
> **Atualização de 22/11/2026: no app atual as opções existem.** Prints do Tiago (11:26): Configurações tem Som do início da pausa, do fim do cardio, do descanso do treino, antes e no fim da aula, cada um com Ouvir, Escolher áudio, Toques do celular ou Usar som padrão e Enviar aos alunos. Não aparece controle de volume. O texto abaixo é o histórico da 1.204.
- **Na 1.197:** existia o bloco `ap-workout-audio-options-ui` em `professor.html`, com escolha de vários áudios e volume (chave `agenda_workout_audio_v1`).
- **Na 1.199** (feita pelo ChatGPT, a partir da 1.197):
  - o bloco foi **removido**;
  - `ap-workout-audio` voltou ao formato da 1.178, e o bloco antigo `ap-workout-audio-settings` voltou;
  - o `beep(volume)` do `index.html` também voltou.
- **Na 1.204**, conferido agora: `ap-workout-audio-options-ui` **não existe**, só o `ap-workout-audio-options-css` sobrou, e `ap-workout-audio-settings` existe.
- A remoção não foi motivada por um erro encontrado. Foi uma tentativa de voltar ao estado da 1.178 para recuperar o descanso na tela bloqueada [V]. Conferido: o módulo de áudio não chama a parte Android do descanso.
- **Pendência confirmada.** **Não será restaurada automaticamente**: só volta por PR próprio, com aprovação do Tiago.
- Até lá, o teste de presença (REGRAS, seção 5.2) registra esse bloco como **ausência conhecida**.

### 4.2 "Guardar a agenda no telefone" — ativação desligada na 1.199 e na 1.204 [V]
> **Atualização de 22/11/2026: resolvido no app atual.** Print do Tiago (10:56): "Modo telefone ativo · 505 KB na agenda. Tudo salvo no arquivo do telefone" e "Cópia no telefone: OK". `verificar_funcionalidades.py` também avisa que a regressão parece restaurada. O texto abaixo é o histórico da 1.204.
- O botão de ativar o armazenamento principal no telefone não aparece mais. O texto "Guardar a agenda no telefone" não existe no `professor.html` da 1.204.
- A **leitura** de quem já ativou continua [V] (`ap-native-store` presente, teste `native_store` passou).
- Não foi aprovado pelo Tiago. Foi uma decisão da 1.199 [H sobre o motivo].
- **Pendência confirmada.** **Não será restaurada automaticamente**: só volta por PR próprio, com aprovação do Tiago. Até lá, o teste de presença registra o controle como **ausência conhecida**.

---

## 5. Descanso na tela bloqueada (Xiaomi do Tiago)

Os resultados no **aparelho real** vêm de prints e vídeos do Tiago. Os do **emulador**, do workflow `simular-descanso.yml` (Android 14 puro).

| Versão | Cartão | Aparelho: aparece bloqueado | Aparelho: conta | Aparelho: pisca | Emulador |
|---|---|---|---|---|---|
| 1.177 | Tempo no título, republicado a cada 1 s | **Sim** (print de 11/11, "Descanso do treino · 0:45") | Sim | Sim ("piscando", nas palavras do Tiago) | — |
| 1.178 (ChatGPT) | Layout próprio (`notification_rest_countdown`) com Chronometer, sem republicar | **Não** | — | Não | — |
| 1.192–1.196 | Igual ao da 1.178. O agendamento passou a aceitar o descanso sem "Alarmes e lembretes". | **Não** (vídeo de 13/11: aparece no topo com o app aberto, some na tela bloqueada) | — | — | — |
| 1.197 | Mesmo layout, em canal novo de importância ALTA (`..._v2`) | Não testado no aparelho | — | — | Aparece [V] |
| 1.198–1.199 (ChatGPT) | Serviço e agendamento iguais aos da 1.178 | Não testado no aparelho [H] | — | — | — |
| 1.200 | Título com o tempo, a cada 1 s (estilo 1.177) + descanso sem "Alarmes e lembretes" | — | — | — | Aparece nos 2 cenários [V] |
| 1.201 | Igual à 1.200 + hora do início ao lado | **Sim** (print às 10:54) | Sim | **Sim** | Aparece [V] |
| 1.202 | Cartão padrão com o cronômetro do sistema (`setUsesChronometer`) | Sim | **Não** (ficou parado) | Não | Aparece [V] |
| 1.203 | Layout da 1.178 de novo | **Não** (print às 11:31) | — | — | — |
| **1.204 (atual)** | Igual à 1.201 | Sim [H, sem novo print] | Sim [H] | Sim [H] | — |

Conclusões:
- **[V]** Nesse Xiaomi, o cartão com layout próprio não aparece na tela bloqueada.
- **[V]** O cartão padrão aparece.
- **[V]** O cronômetro automático do Android não anda na tela bloqueada desse Xiaomi.
- **[H]** Não há, até agora, um jeito comprovado de ter "aparece + conta + não pisca" nesse aparelho.
- Opção ainda não testada [H]: atualizar a cada 5 s e de 1 em 1 nos últimos 10 s.

---

## 6. Assinatura automática de `.agenda.json` [V]

- O workflow `assinar-atualizacoes-agenda.yml` roda **sozinho** em qualquer push na `main` que mexa em `*.agenda.json` **na raiz**. Ele assina com a mesma chave do APK e entrega o pacote como artifact.
- **Ocorrido [V]:** em 13/11 às 17:30 UTC, o envio de `AgendaPersonal-Testar-Enviar-Sons-Treino-para-assinar.agenda.json` gerou a execução `43473421869` ("Assinar atualizações", sucesso).
- **Risco:** um pacote não revisado vira um pacote assinado, que os aparelhos aceitam sem aviso.
- **Proposta de correção:** em `REGRAS.md`. Ainda não foi aplicada.

---

## 7. Privacidade e publicação de dados pessoais

- **[V]** O repositório é **público**, e o workflow "pages build and deployment" publica a `main` como site. Todo arquivo na `main` fica acessível na internet.
- **[V]** Busca feita em 13/11/2026 nos arquivos de texto da `main` (`firebase_<id>`, listas `"students":[{`, e-mails @gmail/@hotmail/@outlook): **nenhum dado de aluno encontrado**. O único resultado foi o nome "AgendaPersonal_Backup", que aparece no código do pacote 1.12.255.
- **[H]** As imagens não foram conferidas uma a uma. São capa, fundo, ícones e prints da simulação feitos com "Aluno Simulação".
- **[V]** Backups reais do Tiago contêm nomes, fotos e dados de alunos. **Nunca** podem ir para o repositório.

---

## 8. O que ainda precisa de validação

| Área | O que validar | Testes automáticos hoje [V] | Classe |
|---|---|---|---|
| Professor | Fichas (correções, séries, cardio, exportar TXT, recolher), agenda e lista de espera, acompanhamento e feedback | `agenda`, `availability`, `reps_by_series`, `drag_reorder`, `panel_link`, `pdf_roundtrip` | [H] no aparelho |
| Aluno | Iniciar e finalizar treino, descanso automático do aluno (`startStudentRest`), áudios do aluno, notificações, mensalidade | nenhum específico | [H] |
| Cronômetros e alarmes | Descanso do professor, alarme do fim do descanso, aula, faixa flutuante, permissão "Alarmes e lembretes" | só `simular-descanso.yml` (emulador, 2 cenários) | [H] no aparelho |
| Financeiro | Mensalidades, carteira, resultados, Pix e comprovantes | `finance` | [H] no aparelho |
| Pets | Capivara, Gato e Lobo em todas as fases, poses e pelagens; pet do professor; migração do urso e do galo para gato | `pets_removed` (26) | [H] no aparelho |
| Atualizações | Importar assinado e sem assinatura, download pelo servidor, base nova (`baseSeen374`), Conferência | `update_*` (menu, downloads, signatures, memory, import_review), `native_updates`, `recovery_updates`, `update_center` | [V] em teste; [H] no aparelho |
| Armazenamento | Cópia nativa, medidor, quem já ativou "Guardar no telefone" | `native_store`, `native_mirror`, `storage_meter`, `save_guard` | [H] no aparelho |
| Backup | Restaurar o backup limpo (sem urso e galo) de 13/11 | nenhum | [H] |

---

## 9. Pendências (decisão do Tiago)

1. ~~Voltar ou não as opções de áudio do treino~~ — existem no app atual (22/11, prints do Tiago); só o controle de volume não aparece.
2. ~~Voltar ou não o botão "Guardar a agenda no telefone"~~ — resolvido no app atual (22/11, print do Tiago: modo telefone ativo e cópia no telefone OK).
3. Descanso: aceitar a piscada (1.204) ou testar a atualização a cada 5 s (seção 5).
4. Aprovar ou não as **propostas** de `REGRAS.md`: assinatura manual, simulação sem commit na `main`, teste de presença e proteção da `main`. **Nenhum workflow foi alterado.**
5. Disponibilizar o código descompactado e provar que gera o mesmo app que o ZIP.
6. Permissão de escrita da integração do ChatGPT (HTTP 403 em 13/11).
