# Agenda Personal web

Instantâneo da publicação 44 do ChatGPT Sites, commit de origem
`7702aa6a32cd83fc5e751450bc545a4d754bc9ee`. Os arquivos de código da origem
foram copiados sem modificações. O manifesto em `web/manifest.webmanifest` foi
extraído do Worker publicado e corresponde ao arquivo servido em
`/app/manifest.webmanifest`.

## Infraestrutura e conteúdo

O endereço `agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site` é
gerado pelo ChatGPT Sites. `scripts/build.sh` reúne os arquivos web no
Worker, compõe `dist/server/index.js` e inclui a configuração de hospedagem
de `.openai/hosting.json`. É esse artefato que o Sites hospeda. A configuração
aponta para o projeto e para o vínculo R2 `BUCKET`; a conta, as credenciais
e os objetos do bucket continuam na infraestrutura do Sites.

O conteúdo instalado pelo cliente web vem de uma publicação separada da
infraestrutura. Em 20/11/2026, às 22h53 em Cuiabá, `GET /api/manifest`
anunciava **1.12.298 / 404**. A versão estava registrada desde 15h34min47
no mesmo fuso. `published/AgendaPersonal-1.12.298-Assinado.agenda.json.gz`
guarda o pacote publicado com compressão gzip sem perdas. Após descompactar com

    gzip -dk published/AgendaPersonal-1.12.298-Assinado.agenda.json.gz

o JSON contém os quatro HTML servidos pelo carregador e corresponde exatamente ao
tamanho e ao SHA-256 anunciados pelo manifesto:

    1aae419daff2f1d175833b7e3b97d90a2bdf814302d07218011c3b99e5fec2eb

A sessão web auditada renderizou 1.12.294 e manteve 1.12.295 pronta para
instalação. O GitHub registrava 1.12.300 / 406 como referência assinada;
a origem pública anuncia a versão efetivamente publicada no serviço do app.

As credenciais da origem Git do Sites são temporárias e ficam na plataforma.
A autenticação em produção usa credenciais de sessão obtidas pelo cliente.
Os únicos valores Firebase copiados são a configuração pública e os
identificadores já presentes na aplicação. O arquivo assinado inclui uma
assinatura pública, sem a chave privada usada para assinar. Os registros
operacionais do bucket e as evidências históricas de QA em `docs/qa/`
ficam fora deste instantâneo de código.

Este diretório serve para revisão e construção local. A versão do Sites
continua sendo publicada pelo seu fluxo próprio.
