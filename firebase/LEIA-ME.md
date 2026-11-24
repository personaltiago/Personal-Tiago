# Avisos no celular do professor (Firebase)

Pedido do Tiago (24/11/2026): quando um aluno se cadastrar, avisar na tela bloqueada, mesmo com o app fechado. Na pergunta do app ele
escolheu "Push com Firebase", que inclui:

- o plano Blaze, com o cartão dele;
- este gatilho;
- guardar no Firebase o endereço de push do celular dele.

## O que tem aqui

Grupo de funções `avisos`, em `functions/`, com Node 22, firebase-functions 7 e firebase-admin 14:

| Função | Tipo | Região | O que faz |
|---|---|---|---|
| `avisoNovoCadastro` | gatilho do Firestore (`usuarios/{uid}` criado) | a do banco (`publicar.sh` descobre) | Se o documento novo for um aluno à espera de aprovação (`perfil: 'aluno'`, `ativo: false`, `professorId` do Tiago), manda "Novo cadastro" e "Fulana se cadastrou. Toque para aprovar." para os aparelhos do professor. |
| `registrarAparelho` | chamada do app | `southamerica-east1` | Recebe o endereço de push do celular. Só aceita a conta do professor. |
| `testarAviso` | chamada do app | `southamerica-east1` | Manda um aviso de teste para os aparelhos do professor. Serve para o botão "Testar aviso". |

**Como o aviso aparece:**
- Só o primeiro nome do aluno vai para a notificação.
- Usa o canal `cadastros` do app Android, a partir do APK 1.211.
- Tem prioridade alta e visibilidade "privada": se o celular estiver configurado para esconder conteúdo sensível, a tela bloqueada esconde o texto.

**Onde os dados ficam:**
- Os endereços de push ficam em `avisosAparelhos/{professor}/aparelhos/{sha256 do endereço}`, com o endereço, a plataforma, a versão do app e a data.
- Só as funções gravam e leem ali.
- Endereço que o Firebase diz que não existe mais é apagado sozinho.

**O que não muda:**
- as regras do Firestore;
- os documentos dos alunos, que só são lidos no gatilho;
- outras funções do projeto, porque o deploy usa só o grupo `avisos`.

## Publicar (uma vez, e de novo quando estas funções mudarem)

Pré-requisito: o projeto `agenda-personal-bdb58` precisa estar no plano Blaze.

1. Abra o console do Firebase no Chrome, em "versão para computador", e entre no projeto.
2. Abra o Cloud Shell pelo menu da direita. Ele já entra logado na conta dona do projeto.
3. Cole o comando abaixo:

```
git clone --depth 1 --filter=blob:none --sparse https://github.com/personaltiago/Personal-Tiago.git ap && cd ap && git sparse-checkout set firebase && bash firebase/publicar.sh
```

O `publicar.sh` faz quatro coisas:
1. Descobre a região do banco, porque o gatilho precisa ficar nela.
2. Liga a API do Firebase Cloud Messaging.
3. Instala as bibliotecas.
4. Publica com `firebase deploy --only functions:avisos --force`. O `--force` aceita a limpeza automática das imagens antigas, que evita custo de armazenamento.

Na primeira vez, o Firebase pode pedir para aguardar alguns minutos enquanto libera as permissões. Nesse caso, rode o mesmo comando de novo.

## Custo esperado

- **Push (Firebase Cloud Messaging):** gratuito.
- **Funções:** 2 milhões de execuções gratuitas por mês. Um cadastro gera uma execução, e cada vez que o app registra o aparelho gera outra.
- **Armazenamento das imagens:** 500 MB gratuitos, e a limpeza automática fica ligada.
- **Total:** R$ 0 esperado. Recomendação: alerta de orçamento de R$ 10 no Google Cloud.

## Remover

No Cloud Shell:

```
npx -y firebase-tools@latest functions:delete avisoNovoCadastro registrarAparelho testarAviso --project agenda-personal-bdb58 --force
```

## Testes

`npm test`, dentro de `functions/`, roda sem rede: as regras do aviso, o envio com Firebase de mentira, a limpeza de endereços inválidos, a recusa de quem não é o professor e as três funções como o Firebase as enxerga. O CI roda isso em todo PR que muda `firebase/`.
