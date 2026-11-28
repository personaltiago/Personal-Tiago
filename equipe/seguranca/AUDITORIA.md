# Segurança — Agenda Personal

Revisão de 28/11/2026. Base consultada: `main` em `a5cbe9d1c89b38cb8509cb5dc0ea3aaa5fe96b62`; servidor web em `chatgpt/app-web`, `7a0df1bd4496f5ff06cbd3a08ca41ac3a2470e4c`. Pedido: corrigir os problemas do relatório de segurança. Alterações propostas em branches e PRs em rascunho; nenhuma publicação, assinatura, migração ou acesso a dados reais.

## Resultado e limite

O cadastro passa a validar entradas, limitar mensagens a textos conhecidos e aplicar CSP com hashes dos scripts reais. As regras propostas bloqueiam leitura entre alunos, autoaprovação e alteração de perfil/professor. Há testes no emulador real do Firestore, navegador com Firebase simulado, proteção opcional de backups exportados e CI sem segredos.

**As regras publicadas NÃO foram verificadas nem alteradas.** O console do projeto redirecionou para a autenticação Google. Uma regra local aprovada no emulador não demonstra o estado de produção. Antes de publicar, comparar a política existente e identificar coleções/fluxos fora deste inventário.

## Os 12 riscos do guia

| Risco | Evidência / tratamento | Situação residual |
|---|---|---|
| Segredos no frontend | Chaves Firebase são configuração pública; scanner procura credenciais de alta confiança sem imprimir valores | Scanner não prova ausência de segredo; histórico Git, ZIP/APK completos e IAM não auditados integralmente |
| Entradas sem validação | Validador do cadastro + allowlist de campos/tipos/tamanhos nas regras; backend web já limita corpos e schemas | Formato de nascimento nas regras não substitui validação completa de data; demais telas exigem revisão contínua |
| SQL injection | Não há SQL nos fluxos de cadastro/Firestore/Worker examinados | Sem teste de serviços não inventariados |
| Prompt injection | Não identificado processamento por LLM nesses fluxos | Não aplicável ao escopo examinado, sem garantia sobre integrações futuras |
| XSS | Cadastro usa textContent, valida nome e impõe CSP por hash; injeção inline bloqueada no Chromium | Não certifica todas as telas importadas; style-src inline preservado por compatibilidade |
| IDOR/BOLA | Regras novas e matriz de permissões; servidor deriva UID do token, mantém schemas restritos | Regras reais pendentes; IAM/Admin SDK ignora regras de clientes |
| SSRF | Worker usa destinos fixos Firebase e recusa redirecionamentos nas chamadas com credenciais | Downloader de APK oficial e outros caminhos devem manter allowlists; não testado por carga externa |
| Senhas / backups | Cadastro não grava senha no Firestore nem exibe SDK errors; ferramenta AES-GCM para JSON exportado | Não criptografa retroativamente localStorage, IndexedDB, R2 ou cópias antigas; Auth exige configuração operacional |
| DoS/DDoS | Limites de corpo já existentes; Worker proposto com rate limit por conta/escopo | Fallback vale por isolate; binding nativo/edge e quotas precisam de configuração. Firebase lookup ocorre antes da limitação por conta |
| Rotas administrativas | UID fixo do professor, testes negativos em APIs e funções | MFA, recuperação de conta, IAM e proteção efetiva de branches não verificados nesta sessão |
| Bots | Tratamento de excesso de tentativas e adaptador de rate limit na API | CAPTCHA/App Check e proteção pré-autenticação não ativados; dependem de registro/configuração e compatibilidade dos clientes |
| Mensagens de erro | Cadastro usa catálogo seguro; Worker retorna erro genérico com identificador e log sem corpo/token/stack | Cobertura dos componentes alterados, sem afirmar ausência de todos os erros sensíveis no aplicativo |

## Componentes preservados

Nenhum `.agenda.json`, cronômetro, descanso, alarme, treino, financeiro, mascote, chave de assinatura ou APK foi alterado. O workflow de assinatura automática permanece como estava: um pacote na raiz da main ainda pode disparar assinatura. CODEOWNERS identifica revisores, mas só bloqueia alterações se as regras do GitHub exigirem revisão.

O manifesto Android examinado já declara `allowBackup=false` e `usesCleartextTraffic=false`; isso não equivale a criptografia de backups exportados, nem a teste de um APK instalado. O servidor web foi lido integralmente por acesso direto ao fonte, incluindo o arquivo de aproximadamente 11 MB que a integração não retornava.

## Evidências e operação

Consulte [TESTES.md](TESTES.md), [MATRIZ-DE-PERMISSOES.md](MATRIZ-DE-PERMISSOES.md), [OPERACAO.md](OPERACAO.md), [LGPD.md](LGPD.md) e [CHECKLIST.md](CHECKLIST.md). Não é possível dar uma nota defensável à segurança dos dados em produção sem concluir as pendências de acesso/configuração.

Fontes primárias: [regras por campo](https://firebase.google.com/docs/firestore/security/rules-fields), [emulador Firestore](https://firebase.google.com/docs/firestore/security/test-rules-emulator), [política de senhas](https://firebase.google.com/docs/auth/web/password-auth), [App Check web](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider), [rate limiting Workers](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [direitos dos titulares — ANPD](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares).
