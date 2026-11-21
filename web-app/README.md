# Agenda Personal — distribuição e aplicativo web

## Recuperação 1.12.225

Restaura as correções de tema do aluno, feedback decimal e sincronização da execução a partir da base 1.12.224 de PDF/RIR. Abrir Evolução busca os registros atuais do professor. O formulário e o cartão preservam 9,4/9.4 e apresentam a avaliação do professor antes da resposta do aluno. O símbolo do cartão, o controle de recursos, os pets e as sessões parciais existentes são mantidos.

A preparação `scripts/prepare-student-recovery.mjs` exige o SHA-256 da base 224 e modifica módulos delimitados. `tests/student-session-recovery.mjs` reproduz as falhas antigas antes de verificar a correção, os limites de conta/gravação e a preservação dos demais módulos. O mesmo teste executa a importação real de sete dias, incluindo RIR, carga, descanso e instruções. O JSON completo tem 25.093.771 bytes, abaixo do limite de 24 MiB. A publicação usa o pacote imutável 215, confirmado no manifesto ativo antes da implantação, com verificação de tamanho e SHA-256 e proteção contra uma publicação concorrente mais recente.

Para enviar treinos já salvos: aplicar a 225 no telefone do professor e usar Mais → Sincronizar → Sincronizar agora; depois reabrir o portal do aluno e acessar Evolução. Nenhum treino é criado retroativamente a partir da prescrição. Os resultados reais dependem de o registro ter sido salvo e estar vinculado à conta correta.

Na versão 1.12.180, a evolução tem uma única implementação de renderização. O código anterior que montava o relatório para depois substituí-lo foi removido; seleção, cálculo e apresentação permanecem separados. `app/student-evolution-shell.js` governa navegação e cabeçalho, `student-evolution.js` governa seleção e mídia e `student-evolution-report.js` governa os dados e a apresentação. `student-progress-runtime.js` preserva sincronização e tema sem substituir o renderizador. Um único arquivo `student-evolution.css` reúne os estilos da área, incluindo controles e estado da sincronização.

O pacote consolidado é produzido por `scripts/prepare-consolidated-release.mjs` a partir da cópia imutável e verificada da 1.12.179. Ele substitui os módulos existentes e remove as implementações antigas da evolução. A preparação não percorre novamente a cadeia de remendos das versões anteriores. Formato, bridge, esquema de dados e APIs de conta permanecem iguais.

Nos ursos, a mudança da 1.12.180 é delimitada: o registro da expressão passa a considerar os dois olhos e o nariz, evitando o deslocamento do focinho entre pelagens. A expressão de bravo das pelagens coloridas vem da arte da própria cor e idade; a transferência fica limitada às feições, preservando o contorno, a pose e a pata do desenho original. O motor adaptado consulta esse preparador compartilhado para a textura de bravo; sua geometria, movimento e entrada permanecem iguais. Foram conferidas 48 combinações de fase, pose e cor, inclusive gestos e deslocamento real dos olhos no renderizador Canvas. Isso não substitui verificação em aparelhos físicos ou WebGL. As 42 variantes que já usavam a geometria adaptada continuam usando-a; esta consolidação não as converte nas malhas autorais R14.

O mesmo serviço entrega as atualizações Android e o cliente web instalável em `/app/`. A origem permanece fixa; as APIs autenticadas de fichas, fotos e evolução mantêm as permissões existentes.

Na versão 1.12.167, o cartão de feedback presencial apresenta a avaliação do professor antes da intensidade e do comentário do aluno. O campo de esforço aceita vírgula ou ponto decimal entre 1 e 10, por exemplo `9,4` e `9.4`; o valor é armazenado como número e preservado na sincronização e no recebimento pelo aluno. As validações do cliente e da API aceitam números finitos nessa faixa e continuam recusando textos e valores fora dela. A exibição do feedback usa vírgula decimal. Fontes em `app/feedback-model.js` e `app/feedback-card.js`, incorporadas ao pacote de quatro telas por `scripts/prepare-feedback-effort.py`. `tests/feedback-client.mjs` testa a função real de finalização, normalização e ordem do cartão; `tests/feedback.mjs` cobre o percurso pelo servidor.

Na versão 1.12.166, tocar no bichinho faz a expressão de bravo sem acionar a aproximação. Apenas tocar no cenário chama o mascote para a frente; deslizar no pet continua fazendo carinho. O toque simples e os toques repetidos no pet respondem imediatamente com a mesma expressão, inclusive no acesso pelo teclado. A entrada dura 240 ms; a volta começa 1,4 s depois do toque e dura 1 s. A escala mantém a origem no canto superior esquerdo durante a ida e a volta, evitando o salto causado pela remoção do CSS de aproximação. Toques repetidos no cenário renovam o prazo sem deixar o pet preso. O fechamento dos olhos do urso filhote e adolescente cobre a esclera completa antes de recompor a pelagem, preservando o adulto e as expressões de bravo. O módulo compartilhado `app/mascot-closeup.js` é incorporado ao pacote de quatro telas por `scripts/prepare-mascot-closeup.py`; Android e iPhone recebem o mesmo código. Casa, troca de conta e ocultação do app cancelam a aproximação. Não altera registros, compras ou dados da conta.

## Publicar conteúdo

A entrega 1.12.162 também está vinculada à publicação de infraestrutura para ficar disponível diretamente em **Baixar atualização**. O Worker reconstrói uma cópia exata do arquivo aprovado a partir de um pacote imutável existente, confere SHA-256 e tamanho e grava somente o novo pacote e o ponteiro público de versão. A troca usa a condição de ETag: uma publicação mais recente, inclusive concorrente, é preservada. Fonte ausente ou alterada conserva a versão anterior. As APIs autenticadas e os dados de contas não são modificados por esse caminho. O teste `node tests/hosted-release.mjs` cobre o contrato; `AGENDA_HOSTED_BASE` e `AGENDA_HOSTED_CANDIDATE` permitem conferir os arquivos completos antes da entrega.

No Android, use a conta do professor em **Atualizações → Publicar para os alunos**. Envie o arquivo `.agenda.json`. Essa publicação alimenta Android e web. Instalar um JSON somente no próprio aparelho não o publica para outros usuários. Se ainda não houver publicação, o cliente web informa o procedimento necessário.

O cliente web verifica o manifesto, o tamanho, SHA-256, a versão e as quatro telas do mesmo pacote. O original permanece intacto para publicação/exportação. Adaptações de ambiente são inseridas somente nos documentos exibidos pelo navegador. Nenhum objeto `Android` é simulado; câmera, arquivos, vídeos e áudio continuam usando os caminhos web existentes.

## Instalação no iPhone

Abra `/app/` no Safari, use **Compartilhar → Adicionar à Tela de Início** e entre na mesma conta. Use o ícone instalado de forma consistente: Safari e o app instalado podem manter armazenamentos diferentes. Os dados locais de um Android não são transferidos automaticamente; somente os dados já sincronizados são recuperados pela conta.

A interface pode reabrir sem rede depois do primeiro carregamento. Login, novos vídeos e sincronização precisam de conexão. O service worker guarda apenas o carregador público e módulos públicos do Firebase, sem armazenar respostas autenticadas, fichas ou fotos. O pacote validado fica no IndexedDB separado dos registros existentes. Atualizações são preparadas sem recarregar uma sessão e exigem confirmação; a instalação é bloqueada durante treino ativo. Falhas de download, checksum ou armazenamento preservam a versão anterior. Apenas versões de conteúdo são removidas na limpeza do cache; localStorage não é restaurado nem apagado.

Alarmes em segundo plano, toques do sistema Android e OCR de comprovantes não são fornecidos na web. A tela de configurações orienta a manter a página aberta para ouvir cronômetros. O botão Google da referência ainda era um aviso de recurso futuro; ele fica oculto na versão web, mantendo o acesso existente por e-mail e senha.

## Código e verificação

Fontes do cliente em `web/`; o ícone é o PNG original do Android. `scripts/update-web-assets.mjs` incorpora esses arquivos no Worker. `bash scripts/build.sh` recompõe o artefato de publicação; `node scripts/validate-artifact.mjs` valida o ESM final.

Testes das APIs: `node tests/updates.mjs`, `node tests/photos.mjs`, `node tests/workouts.mjs` e `node tests/web-routes.mjs`. O teste de navegador usa Playwright do projeto Android vizinho e pode receber `AGENDA_WEB_BUNDLE` e `AGENDA_CHROMIUM`; ele simula Firebase/rede externa e usa IndexedDB/Service Worker reais no Chromium. Não substitui teste em Safari/iPhone físico.

O repositório e o público existentes de Sites são mantidos. A publicação de infraestrutura segue o fluxo Sites, separada das publicações normais de conteúdo pelo aplicativo.

## Feedbacks online e presenciais

O professor consulta `/api/feedback-inbox` com `uid` e `includeOnline: true`. A paginação percorre primeiro os pedidos presenciais e depois os recibos imutáveis já existentes em `student-workouts/`. O cursor `online:` identifica a segunda etapa. Não são criados registros duplicados nem um segundo formulário para o aluno online. IDs online incluem a conta e a chave da execução; a interface associa o nome e a foto pelo UID vinculado, nunca pelo nome. Clientes anteriores continuam usando a consulta presencial sem a opção.

O pedido presencial aceita `teacherEvaluation` com a observação final (até 4000 caracteres) e esforço de 1 a 10 ou nulo. Essa avaliação vai para o aluno e acompanha sua resposta, sem copiar notas privadas por exercício. Pedidos e respostas confirmados continuam imutáveis.

A configuração de publicação informada pelo proprietário é baseada no contrato. O cliente novo envia `publicationBasis: "contract"`, sem solicitar um aceite por feedback. O servidor preserva o campo histórico `allowPublish` dos clientes anteriores; não converte uma escolha antiga em novo consentimento. A imagem e o texto ficam disponíveis ao professor conforme essa configuração e não há postagem automática.

Teste específico: `node tests/feedback.mjs` verifica autenticação, vínculo ativo, isolamento por conta, avaliação do professor, resposta única, compatibilidade anterior, política contratual, feedback online histórico e paginação.

## Evolução registrada pelo professor

O endpoint autenticado `POST /api/student-evolution` consulta a cópia sincronizada da agenda e retorna somente execuções do cadastro vinculado ao UID autenticado. Paginação usa a mesma revisão de origem em todas as páginas. Notas privadas, prescrições e registros de outros alunos ficam fora da resposta. Campos ausentes continuam ausentes; séries por tempo não viram repetições. A data do treino, inclusive lançamentos retroativos, prevalece sobre a data de salvamento.

A versão 1.12.162 agenda o envio após uma execução ser salva e apresenta a evolução recebida em cache separado, preservando sessões, cargas e mascote locais. A preferência de tema também governa a tela de treino quando o rosa é o padrão. As atualizações não apagam preferências nem sessões em andamento.
