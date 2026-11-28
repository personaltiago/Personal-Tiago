# Implantação e reversão

## Estado atual

Somente código proposto. As regras atuais do Firebase não foram obtidas: console exigiu login. Nenhuma conta real foi usada para testar permissões. Não executar testes de carga, criar contas ou apagar dados em produção como substituto do emulador.

## Firebase

1. Entrar no projeto `agenda-personal-bdb58` com sua conta autorizada; nunca enviar senha, token ou chave em chat, commit ou PR.
2. Conferir e salvar privadamente as regras publicadas e o inventário de coleções. Comparar com `firebase/firestore.rules`; investigar caminhos legítimos ausentes antes de adotar o deny-by-default.
3. Executar os testes isolados de `TESTES.md`. Usar contas exclusivamente de teste em homologação para cadastro, login pendente/aprovado, aprovação, foto, treino e notificações.
4. Registrar a decisão de publicar e o diff das regras. O runner de testes usa somente o projeto demo em localhost; `firebase/publicar.sh` continua publicando apenas funções, não as regras.
5. Após publicação autorizada, conferir a versão ativa e os mesmos fluxos em homologação. Guardar evidência sem dados de alunos. Reversão: restaurar a versão anterior das regras no console, após avaliar se ela reabre acesso indevido.

Verificar em Authentication: política de senha para novas contas (sem bloquear senhas antigas no login), proteção contra enumeração, domínios autorizados, provedores necessários, quotas e recuperação de conta. Configurar MFA na conta proprietária Google/GitHub e revisar IAM/segredos fora do repositório.

App Check/CAPTCHA precisa de registro dos clientes web e Android, chave pública de site e análise das métricas antes de enforcement. Ativar enforcement sem atualizar todos os clientes pode bloquear alunos legítimos. Não foi adicionada chave fictícia nem bypass. Limites de custo/alertas não são um teto automático de cobrança; configurar quotas aplicáveis e proteção de borda.

## Web e GitHub

O PR web é separado e aponta para `chatgpt/app-web`; contém instruções de rate limit e seus limites de cobertura. Não foi publicado no Sites. Exportar/construir e validar o artefato antes de uma futura publicação; preservar a revisão anterior para retorno.

No GitHub, conferir regras efetivas, bypass e revisões obrigatórias; exigir os checks de regressão e segurança e revisão do proprietário para arquivos sensíveis. CODEOWNERS sozinho não impõe aprovação. O novo CI não recebe chave de assinatura, não publica e não executa código de PR com `pull_request_target`. O mecanismo de assinatura automática não foi modificado. Mudar esse processo exige decisão específica, documentada, sobre publicação/assinatura.

## Backups e incidentes

`backup-seguro.html` protege um JSON exportado com AES-256-GCM, PBKDF2-SHA256/600000, salt de 16 bytes e IV de 12 bytes novos. Só funciona em contexto seguro; processa localmente e não grava senha. Senha perdida impede recuperação. A restauração cria novamente JSON legível, importado pelo fluxo existente. Verificar restauração com dados de teste antes de depender da ferramenta. Não apaga cópias nem altera backups existentes.

Em incidente: preservar evidências com acesso restrito, identificar origem/escopo, revogar sessões e credenciais afetadas quando aplicável, conter acessos e avaliar obrigações de comunicação com apoio jurídico. Não publicar dados pessoais no relatório do repositório. Não rotacionar API key pública ou apagar contas indiscriminadamente como medida sem diagnóstico.
