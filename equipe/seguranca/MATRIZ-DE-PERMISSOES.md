# Matriz proposta — clientes Firestore

Professor: UID `R2EmnDVcvMWt7TjPxOP6DjW1VOn1`. Vínculo exige `perfil=aluno` e `professorId` desse professor. Aprovação exige `ativo=true`. Sem autenticação: nenhum acesso.

| Recurso / ação | Aluno pendente | Aluno aprovado | Professor |
|---|---|---|---|
| Ler próprio perfil, inclusive inexistente | Sim | Sim | Sim |
| Ler perfil de outro aluno | Não | Não | Apenas vinculado |
| Listar perfis | Não | Não | Query filtrada por perfil e professorId |
| Criar próprio cadastro | Apenas perfil aluno, inativo, campos permitidos e e-mail do token | Igual | Próprio documento e alunos vinculados |
| Alterar cadastro existente | Apenas fotoCadastro própria | Não | Próprio documento / aluno que mantém vínculo |
| Aprovar ou mudar privilégios | Não | Não | Apenas aluno vinculado |
| Apagar perfil | Não | Não | Apenas aluno vinculado, nunca próprio perfil |
| Ler treino atual próprio | Não | Sim | Aluno vinculado |
| Gravar treino atual | Não | Não | Aluno aprovado e vinculado; schema restrito |
| Apagar treino | Não | Não | Aluno vinculado |
| Tokens de push | Não | Não | Não via SDK cliente; funções Admin SDK controladas por IAM |
| Outras coleções / subcoleções | Não | Não | Não |

As regras são deny-by-default. A leitura do status pendente é necessária para login/cadastro. A função administrativa precisa continuar verificando o UID, pois o Admin SDK não está submetido a esta matriz. A API web tem R2 e autorização próprias, testadas no PR web; publicar regras não protege automaticamente esse servidor.
