# Revisão de segurança web — 28/11/2026

Base: `chatgpt/app-web` em `7a0df1bd4496f5ff06cbd3a08ca41ac3a2470e4c`. Proposta em PR rascunho contra a própria branch web; sem publicação no Sites, sem alteração de conteúdo assinado, sem dados reais.

## Alterações

O Worker preserva os schemas, a identidade obtida do Firebase e o vínculo/aprovação dos alunos. Chamadas Firebase com credenciais passam a rejeitar redirects. Erros inesperados retornam 503 genérico e identificador; log contém somente evento e identificador, sem exception, token, stack ou corpo. Respostas recebem Referrer-Policy, Permissions-Policy e CSP mínima contra objetos/base externa/embutimento não autorizado, preservando o host ChatGPT. Essa CSP mínima não equivale à prevenção de todo XSS nas telas importadas.

Rate limit após autenticação/autorização: 12 publicações, 90 escritas ou 180 leituras por conta/60 s. Upload de foto/treino conta como escrita; consultas POST são classificadas explicitamente como leitura. 429 inclui Retry-After: 60. Dois handlers no mesmo isolate compartilham o fallback, com máximo de 5000 chaves, expiração e verificação síncrona para evitar corrida. Nenhum contador, IP ou token é persistido no R2; não muda snapshots, áudios ou dados de alunos.

O fallback é **local ao isolate**. Uma nova instância pode ter orçamento próprio. O código aceita bindings `AP_RATE_PUBLICATION`, `AP_RATE_WRITE` e `AP_RATE_READ`; cada um recebe somente UID verificado e usa a API nativa `limit({key})`. Essa API é aproximada e por localização Cloudflare, não um limite global estrito. É necessário confirmar suporte do provedor/hospedagem antes de configurar. Sem bindings, somente o fallback atua; não declarar proteção distribuída implantada.

SDK Firebase 10.14.1 → 13.4.0, fflate 0.8.2 → 0.8.3, override Node `@grpc/grpc-js` 1.14.7. O audit inicial tinha 12 entradas (5 altas e 7 moderadas, incluindo dependências transitivas); após atualização, zero. Isso não demonstra que todos os alertas eram exploráveis no navegador: gRPC/undici também afetam caminhos Node. Bundle `web/firebase.js` e cópia embutida no Worker reconstruídos; arquivo de lock e verificação da versão no build atualizados. Não foi modificada a política de sessão do cliente.

Os testes antigos `updates` e `hosted-release` importavam o Worker com import relativo por data URL, que não resolve `aquarium.js`; agora usam o artefato autocontido construído, como o teste do instalador. O cenário longo de publicação atravessa explicitamente uma janela de 60 s; o novo teste de segurança cobre o bloqueio real sem desativá-lo.

## Validação

- `npm ci --ignore-scripts`, `npm audit`, `npm run build`, `npm run validate`.
- `security.mjs`: 15 rotas privadas sem sessão, negativa de papéis, URLs privadas, headers, destinos fixos/sem redirect, 100 requisições concorrentes/90 permitidas à validação e 10 limitadas, separação por conta/escopo, expiração, binding nativo simulado e erros sem canário secreto.
- `login-session`, `web-routes`, `registration-notices`, `teacher-agenda`, `photos`, `workouts`, `feedback`, `student-evolution`, `workout-audio`, `workout-audio-options`, `updates`, `hosted-release`, `android-installer`: fluxos existentes com Firebase/R2 simulados. Ver resultado final no PR.
- CI novo sem segredos, permissões de leitura, ações fixadas por SHA; nenhum deploy ou assinatura.

## Ativação e pendências

Para ambiente compatível com Wrangler, declarar três bindings `ratelimits`, com namespaces numéricos **livres e distintos** na conta, períodos 60 e limites 12/90/180 correspondentes. Não copiar namespaces já usados por outro Worker, pois compartilham contadores por localização. Fonte: [Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

Proteção de borda antes da autenticação, CAPTCHA/App Check, quotas, Firebase Auth, regras publicadas, IAM e MFA continuam dependendo das configurações externas. `accounts:lookup` acontece antes do limiter por conta; requisições anônimas/credenciais falsas exigem proteção de infraestrutura para reduzir custo/abuso. Não acrescentar limitação por IP confiando em headers forjáveis.

Nenhuma chave de site CAPTCHA foi inventada. Antes de publicar: homologar com regras e contas de teste, validar login/sessão persistente nos aparelhos suportados e capacidade dos bindings no provedor. Preservar versão anterior do Sites para retorno. Reter snapshots históricos é comportamento existente; apagar versões exige política de retenção, não foi feito automaticamente.

A fundação de regras Firestore, minutas de privacidade, backups protegidos e documentação geral está em PR separado contra main. Este PR não depende de afirmar que essas regras foram implantadas.
