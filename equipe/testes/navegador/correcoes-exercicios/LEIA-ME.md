# Teste no Chrome real — Correções de exercícios incluídas (1.12.291)

Abre o `professor.html` verdadeiro do pacote 1.12.291 dentro de um iframe (como a casca do aplicativo faz), em tela de toque
(390×844 a 2×), e confere com **toque de verdade** (`Input.dispatchTouchEvent` do DevTools) as três correções de exercícios que
estavam à parte no site e que o pacote junta ao 1.12.288. Usa o mesmo executor do teste das janelas como página
(`../janelas-pagina`: `cdp.js`, `semente.js`, `servidor.py`, `dialogo.html`). Não usa Firebase, não usa a casca do aplicativo e
**não substitui o teste no celular** (nem no iPhone/Safari).

## O pedido e a causa
Pedido do Tiago (19/11): "quando eu instalo [um pacote novo], está desinstalando as que já estão lá, por exemplo a dos
exercícios". Ele tem razão. Um pacote completo (`.agenda.json` com as quatro páginas) **substitui as páginas inteiras**. Os
pacotes completos de 1.12.273 a 1.12.288 foram feitos sem as correções 01 (Catálogo de exercícios unificado), 02 (Baixar catálogo)
e 03 (Duplicatas e exclusão no catálogo); instalar qualquer um deles retira as três (o aplicativo avisa "Revisar restauração" e
os três blocos voltam ao que eram). O pacote 1.12.291 é o 1.12.288 com as três já aplicadas; os próximos pacotes completos devem
partir dele (versão a partir de 1.12.292, sequência a partir de 398).

## O que o pacote muda
Só `professor.html`, só três blocos, e cada bloco inteiro é trocado pelo texto da correção:
| Correção | Bloco | O que faz |
|---|---|---|
| 01 Catálogo unificado | `ap-workout-instructions` | uma lista só (exercícios do app e os seus), aba "Seus exercícios" escondida, "Salvar também no catálogo" |
| 02 Baixar catálogo | `ap-workout-export` | botão "Baixar catálogo": TXT com todos os exercícios, agrupados |
| 03 Duplicatas e exclusão | `ap-workout-corrections` | um cartão por exercício equivalente, favorito do grupo, "Excluir do catálogo" |

O gerador é `tools/gerar-correcoes-exercicios-1.12.291.cjs` (mesmo algoritmo do aplicativo: `findBlocks`, conferência do SHA-256
"antes", troca do bloco; o histórico e a numeração saem como o aplicativo os deixaria ao instalar as três uma a uma: 288 → 291,
sequência 394 → 397).

## Como rodar
Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 e `google-chrome` no PATH (ou `CHROME=/caminho`).
1. Os quatro arquivos de entrada estão na raiz da `main` (o 1.12.288 e as correções 01, 02 e 03). Monte as páginas:
   ```
   mkdir -p www saida
   node preparar.cjs <1.12.288.agenda.json> <01.agenda.json> <02.agenda.json> <03.agenda.json> www
   ```
   Gera `prof-291.html` (o do pacote), `prof-288.html`, `prof-sem03.html` (288 + 01 + 02, para provar o que a 03 muda) e
   `dialogo.html`. O gerador recusa qualquer arquivo cujo SHA-256 não seja o da `main`.
2. Suba o servidor e rode: `python3 ../janelas-pagina/servidor.py www saida 8791 &` e
   `PORTA=8791 SAIDA=saida node catalogo.js prof-291.html prof-sem03.html`.
3. **Regressão** com os executores do teste das janelas (todos com `PORTA=8791`, a partir de `../janelas-pagina`):
   ```
   node paridade.js prof-288.html prof-291.html 390x844          # esperado: 0 diferenças nas 38 janelas, 10 configurações
   node extras.js prof-291.html current dark                     # esperado: 19/19
   node geometria.js prof-291.html - 390x844 current dark        # esperado: 33 páginas, 0 falhas
   node estresse.js prof-291.html current dark                   # esperado: as 33 janelas ok
   node matriz.js prof-291.html - catalogo,workoutExerciseDialog,workoutPlanDialog 390x844 current dark   # esperado: vazou 0/24
   ```

## O que `catalogo.js` confere (51 verificações)
1. **Presença** das três correções e página sem erro.
2. **Catálogo unificado (01):** exercícios do app e pessoais juntos, a aba "Seus exercícios" não abre, nota nova, busca por nome,
   Favoritos, caixa "Salvar também no catálogo".
3. **Baixar catálogo (02):** com a ponte do Android (um arquivo, texto simples, nome datado, aviso), o conteúdo (BOM, total igual
   ao do catálogo, uma linha por exercício, origem, campos alterados, "como fazer", link do vídeo, grupos em ordem alfabética com
   "Sem grupo muscular" por último), sem a ponte (download comum de um TXT) e com falha do Android (aviso de erro, nenhum arquivo).
4. **Geometria:** o Catálogo continua uma página inteira (1.12.288); a fileira Favoritos / Exercícios do app / Baixar catálogo cabe
   numa linha, os textos não cortam e cada peça tem 44 px ou mais de altura, no escuro e no claro (capturas em `SAIDA`).
5. **Duplicatas e exclusão (03):** um cartão por exercício equivalente; favorito do grupo; cancelar a pergunta não exclui; confirmar
   exclui o grupo e avisa; é exclusão "suave" (o cadastro pessoal continua guardado com `catalogRemoved`, o do aplicativo vira marca de
   removido); alunos, aulas, fichas, histórico, execuções e pagamentos ficam **exatamente** como estavam; a ficha continua ligada ao
   exercício excluído e ainda enxerga o vídeo dele; o TXT não traz os excluídos; "Apagar exercício" do editor usa a exclusão nova;
   nada volta ao fechar e abrir a página.
6. **Contraste:** na página sem a 03 o mesmo exercício aparece em dois cartões (o teste enxerga a diferença).

## Resultados registrados (Chrome 153 headless emulando tela de toque, 19/11/2026)
- **`catalogo.js`:** 51 de 51; nenhum erro de página.
- **Paridade 1.12.288 → 1.12.291:** 38 janelas × 10 configurações (5 temas × claro/escuro): **0 diferenças** (nem as permitidas).
- **Extras:** 19/19. **Geometria:** 38 janelas, 33 de página, 0 falhas. **Conteúdo longo:** 33/33. **Vazamento de rolagem**
  (Catálogo, Exercício e Ficha, 24 gestos): 0/24.
- **Teste com o código Java real do aplicativo** (`equipe/testes/correcoes-exercicios.java.py`): 89 verificações. O pacote 291 é
  igual, byte a byte nos três blocos, ao que o aplicativo produz instalando 01, 02 e 03 em sequência; o 288 sobre as três é
  "Revisar restauração" e retira as três; o 291 sobre qualquer estado parcial dá o aviso certo.
- **Teste automático do pacote** (`equipe/testes/correcoes-exercicios.smoke.cjs`): 29 verificações, 0 falhas. Pegou 18 de 18
  variações sabotadas do próprio gerador (sequência, versão, ordem do histórico, limite de 20, `ownsChanges`, correção repetida,
  conflito, bloco que fecha antes da hora, escopo, integridade, ordem, base, assinatura, título e resumo, correção ignorada, SHA-256
  da base, sobrescrever arquivo).
- **Testes oficiais do Android** (`tests/verify_*.cjs`, 18 arquivos) com as páginas do 291: 18 de 18, o mesmo resultado da base
  1.12.269 e do 1.12.288.

## Limites
Não é celular. Chrome (Blink) com toque simulado, não o WebView do Android real nem o Safari do iPhone, e sem teclado na tela.
A ponte do Android (`saveBase64File`) e o `confirm()` são simulados dentro da página: o que o teste prova é que a página chama a
ponte com um arquivo texto correto; **receber e gravar o arquivo no Xiaomi não foi testado**. O aviso (toast) da tela do Catálogo
só aparece acima da barra Voltar/Painel quando a tela vem de dentro de uma função do painel (`body.function-view`, como no uso
real); abrir o Catálogo direto pelo script, como o teste faz, deixa o aviso atrás da barra. É um comportamento do 1.12.288
(idêntico com ou sem as correções), por isso o teste lê o texto do aviso em vez de depender de enxergá-lo.
