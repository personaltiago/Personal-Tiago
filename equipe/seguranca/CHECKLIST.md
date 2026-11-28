# Encerramento da auditoria

## Implementado / verificado localmente

- [x] Validação do cadastro e erros seguros.
- [x] CSP com hashes e bloqueio de script inline injetado no Chromium.
- [x] Regras de autorização versionadas e testes negativos no emulador Firestore.
- [x] Testes dos avisos existentes preservados.
- [x] Ferramenta opcional para proteger/restaurar JSON exportado.
- [x] Scanner de credenciais de alta confiança sem imprimir valores.
- [x] CI sem segredos e documentação de permissões/rollback.
- [x] Minutas de privacidade/termos identificadas como tal.
- [x] API web analisada integralmente; proposta em PR separado.

## Necessário para encerrar em produção

- [ ] Obter regras publicadas, comparar e validar coleções não inventariadas.
- [ ] Aprovar e aplicar correções após homologação; conferir versão ativa.
- [ ] Conferir Auth, IAM, MFA, quotas e proteção contra enumeração.
- [ ] Registrar/configurar App Check ou proteção antiabuso compatível nos clientes.
- [ ] Configurar rate limit de infraestrutura / proteção antes da autenticação.
- [ ] Exigir checks e revisão de proprietário nas regras efetivas do GitHub.
- [ ] Decidir se a assinatura automática deve ganhar etapa manual; não alterada neste trabalho.
- [ ] Confirmar controlador/contato, bases legais, retenção, menores e fornecedores.
- [ ] Completar procedimento de acesso/exclusão abrangendo nuvem, históricos e backups.
- [ ] Validar direitos de uso das imagens e condições comerciais aplicáveis.
- [ ] Auditar APK instalado, histórico de segredos, todas as telas e acessibilidade completa se incluídos no escopo final.

Não converter pendências em concluído apenas porque o código foi mesclado. Registrar PR, revisão, implantação e evidência de teste separadamente.
