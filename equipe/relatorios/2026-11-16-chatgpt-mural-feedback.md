# Mural da turma — ChatGPT — 16/11/2026

| Item | Registro |
|---|---|
| Branch | `chatgpt/mural-feedback-turma`, baseada em `4b4cca2e` |
| Fonte pretendida | `AgendaPersonal-1.12.276-Links-Cadastro-Instalacao-Para-Assinar.agenda.json` |
| Referência verificada | `index.html` da 1.12.275. A aplicação no pacote integral 1.12.276 e na versão web publicada fica para a revisão. |
| Versão gerada para teste | `1.12.277`, sequência `383` |
| Pedido do Tiago [A] | Abrir uma prévia editável com **Visível para sua turma**, publicar por escolha do aluno e aceitar curtidas e comentários da turma. |

## Implementação

- `ponte/codigo/gerar-mural.cjs` integra o JS e o CSS de `ponte/codigo/telas/ap-mural-student.*` ao `index.html`. Os pontos de entrada são o comprovante do feedback presencial, o histórico de treino no app e a tela inicial do aluno.
- O feedback do treino presencial continua sendo enviado pelo fluxo privado atual. O comprovante fica aberto após a confirmação e dá acesso à prévia. O histórico do treino feito no app usa o comentário já salvo nele.
- A publicação contém o texto confirmado, o ID e o nome do autor, o horário e o estado de visibilidade. Alunos podem curtir, comentar e remover o que escreveram. O professor pode moderar pelo menu **Mais**.
- `firebase/mural-da-turma.rules` propõe a validação do vínculo e da aprovação em `usuarios/{uid}`. A turma corresponde aos alunos do professor configurado no app. As regras verificam a autoria e limitam o formato dos documentos.
- `equipe/testes/mural-firestore.test.cjs` tem cenários de emulador para leitura, escrita, revogação do acesso, autoria, reações e moderação.

## Verificação

- **Passou [V]**. Análise de sintaxe dos scripts alterados e do gerador. Reconstrução byte a byte da página original ao retirar as alterações. As mudanças ficam nos blocos `ap-student-accounts`, `ap-feedback-student`, na parte de histórico de `ap-student-finish-control` e na adição do mural. A rotina de finalização e descanso conserva os bytes da referência.
- **Passou [V]**. Simulação do feedback privado e confirmação do comprovante, histórico e troca de conta, edição, cancelamento, publicação explícita, conteúdo tratado como texto, curtida, comentário, moderação e bloqueio da interface diante de cache ou acesso negado.
- **Pendente [H]**. Execução no emulador do Firestore, verificação das regras efetivas e teste com Android e iPhone. `tests/run_all.py` e `tools/check_release.cjs` dependem do checkout do código Android correspondente à versão em uso e ainda precisam rodar. A validação feita aqui usou JavaScript com dados fictícios.

## Como revisar

Na raiz da branch, gere os arquivos de teste em um diretório temporário.

```sh
teste_mural=$(mktemp -d)
base_mural=AgendaPersonal-1.12.276-Links-Cadastro-Instalacao-Para-Assinar.agenda.json
node ponte/codigo/gerar-mural.cjs "$base_mural" "$teste_mural/index.html"
node ponte/codigo/gerar-mural.cjs "$base_mural" "$teste_mural/Mural-Teste.agenda.json"
```

Execute a suíte do Firestore em um emulador local com Node.js e Java compatíveis com o Firebase CLI.

```sh
printf '%s\n' '{"emulators":{"firestore":{"host":"127.0.0.1","port":8080},"ui":{"enabled":false}}}' > "$teste_mural/firebase.json"
npm install --prefix "$teste_mural" --no-save firebase @firebase/rules-unit-testing firebase-tools
NODE_PATH="$teste_mural/node_modules" "$teste_mural/node_modules/.bin/firebase" emulators:exec --config "$teste_mural/firebase.json" --only firestore --project demo-agenda-mural "node --test equipe/testes/mural-firestore.test.cjs"
```

A suíte monta uma política isolada com as funções `professorUid()` e `isProfessor()`. Antes de liberar, confira se as regras aplicadas ao ambiente de teste mantêm `usuarios/{uid}.ativo` e `professorId` sob controle do professor e se outros blocos `match` alcançam `muralTurmas`. Reproduza com duas contas fictícias aprovadas, uma conta pendente e o professor. Confira o comprovante, o histórico, a curtida e a troca de conta no Android e no iPhone.

**Risco e reversão**. A mudança acrescenta leitura e escrita no Firestore enquanto o mural está aberto. Na etapa atual, descarte o pacote de teste e volte à base 1.12.276. Para produção, a avaliação das regras e do procedimento de desativação deve vir antes da publicação.
