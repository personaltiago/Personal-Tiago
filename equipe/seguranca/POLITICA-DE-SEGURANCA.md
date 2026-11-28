# Política de manutenção de segurança

Mudanças devem partir do estado atual do repositório e permanecer revisáveis em PR. Preservar funcionalidades e testes existentes; nunca colocar dados de alunos, backups reais ou credenciais no repositório público. Reportar suspeitas em contato privado com o responsável, sem abrir issue contendo dados sensíveis.

Autorização deve existir no servidor e nas regras, usando identidade verificada e vínculo, nunca apenas botão oculto ou parâmetro enviado pelo cliente. Limitar campos, tamanhos e tipos; dados exibidos como texto devem usar APIs seguras. Não registrar senha, token, foto, corpo de requisição nem stack com valores pessoais em logs públicos.

Antes de alterar permissões, executar testes negativos entre duas contas sintéticas e confirmar os fluxos legítimos. O CI não acessa produção e não possui segredos de assinatura. Aplicar correções em etapas: código, teste, revisão, implantação autorizada e validação; registrar separadamente cada estado.

Revisar dependências, IAM, regras e configurações em cada mudança relevante e após alerta de fornecedor. Scanner automático não substitui revisão de código, configurações, histórico ou artefatos binários. Não declarar conformidade LGPD, invulnerabilidade, teste em aparelho ou teste em produção sem evidência correspondente.
