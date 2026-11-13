# Agenda Personal — ESTADO

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

1. Voltar ou não as **opções de áudio do treino** (seção 4.1). É uma regressão confirmada, sem restauração automática.
2. Voltar ou não o botão **"Guardar a agenda no telefone"** (seção 4.2). Também é uma regressão confirmada, sem restauração automática.
3. Descanso: aceitar a piscada (1.204) ou testar a atualização a cada 5 s (seção 5).
4. Aprovar ou não as **propostas** de `REGRAS.md`: assinatura manual, simulação sem commit na `main`, teste de presença e proteção da `main`. **Nenhum workflow foi alterado.**
5. Disponibilizar o código descompactado e provar que gera o mesmo app que o ZIP.
6. Permissão de escrita da integração do ChatGPT (HTTP 403 em 13/11).
