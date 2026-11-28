# Verificação reproduzível — 28/11/2026

Sem alunos reais, credenciais de produção ou carga contra o serviço publicado.

| Verificação | Resultado local |
|---|---|
| `node --test equipe/seguranca/testes/*.test.cjs` | 7/7: entradas, erros, backup autêntico/adulterado, scanner |
| `node tools/atualizar-csp-cadastro.cjs --conferir` | Hashes dos scripts reais conferem |
| `node tools/verificar-segredos.cjs` | 113 arquivos de texto disponíveis na execução final; zero achados de alta confiança. Checkout esparso; não constitui auditoria de todo histórico/binários |
| `npm ci --ignore-scripts --prefix firebase/security` e `npm test --prefix firebase/security` | 11/11 grupos no emulador Firestore real, projeto `demo-agenda-personal-security`, porta local 8089, Java 21 |
| `npm ci --ignore-scripts --prefix firebase/functions` e `npm test --prefix firebase/functions` | 9/9 testes dos avisos e chamadas restritas ao professor |
| `NODE_PATH="$PWD/firebase/security/node_modules" node equipe/seguranca/testes/navegador.cjs` | Chromium: cadastro válido/inválido, erro redigido, limpeza da senha, CSP, viewport 390px, minutas e backup baixado/restaurado byte a byte |

Para navegador: após instalar dependências, executar `firebase/security/node_modules/.bin/playwright install chromium`. `CHROME_PATH` permite executável explícito. Na validação local foi usado Chromium headless em `/tmp/chromium`; o CI instala o Chromium do Playwright. SDK Firebase é substituído por módulos sintéticos por interceptação de rede; qualquer outra chamada externa faz o teste falhar.

As recusas PERMISSION_DENIED no log do emulador são esperadas nos testes negativos. O runner usa o emulador oficial 1.22.0, com SHA-256 fixado conforme o manifesto publicado no Firebase CLI 15.37.0, bind em 127.0.0.1 e projeto demo. Não instala o CLI nem suas dependências de publicação/servidor: a árvore npm dos testes ficou sem alertas no audit. A configuração não modifica `firebase/firebase.json` nem publica funções/regras. npm das funções rodou localmente no Node 24 com aviso de engine 22; CI usa Node 22 para esse job.

`npm audit` nas funções e no projeto de testes: zero alertas na revisão. SDK do cadastro atualizado de 10.12.5 para 13.4.0. Os testes usam override fixado de `@grpc/grpc-js` 1.14.7 para corrigir alertas do cliente Node, validado contra o emulador. Isso não significa que todo aviso de auditoria seria explorável no navegador.

Os testes oficiais de pacote/APK não foram atribuídos a esta alteração: nenhum pacote, HTML embutido, código Android ou versão de conteúdo mudou. Não foi feito teste em Xiaomi, iPhone/Safari ou produção. A verificação de regressão existente continua no CI; a lista de testes web consta no PR e relatório próprios.
