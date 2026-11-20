# Testes do 1.12.299 e do 1.12.300 (mensalidade corrigida, IMC por idade, pagamentos repetidos)

Rodados em 20/11/2026 no Chrome 153.0.8010.12 do ambiente do Claude (playwright-core 1.63.0 com `/usr/bin/google-chrome`), páginas tiradas dos pacotes 1.12.298 (controle) e 1.12.299 e servidas em `http://127.0.0.1:8799/` (`python3 -m http.server`) como `298-professor.html`, `299-professor.html`, `298-avaliacoes.html` e `299-avaliacoes.html`. Os scripts têm caminhos fixos do ambiente (`/tmp/pwc`, `/tmp/t299/pag`); ajuste antes de rodar.

| Teste | O que prova | 1.12.298 | 1.12.299 |
|---|---|---|---|
| `financeiro-vm.cjs <pacote>` | modelos do Recebido e dos resultados + bloco novo num vm: pergunta, cancelar não grava, confirmar marca `replaces`, soma 500 (não 950), aluno só vê o que vale, 3ª correção, outro vencimento e "sem quitar" não perguntam | — | passa |
| `financeiro-chrome.cjs 298\|299` | tela real do professor: quitar 450, editar o aluno (vencimento de volta, valor 500), quitar de novo; cancelar; confirmar; quitar o mês seguinte; recarregar | Recebido **R$ 950,00** (reproduz o achado) | **R$ 500,00**; 450 guardado "Substituído … fora das somas"; marca sobrevive ao mês seguinte e ao recarregar |
| `imc-tela-chrome.cjs` | Meta 3 na tela para 7 casos (70/65/60/59/30 anos e sem idade) | sempre faixa adulta | 60+ usa 22–27; abaixo de 60 e sem idade: texto idêntico ao 298 |
| `imc-pdf-chrome.cjs` | texto do relatório (PDF) 298 x 299, 45 e 70 anos | — | 45 anos: só a frase nova do método; 70 anos: "peso adequado (60 anos ou mais)", "56,3–69,1 kg para IMC 22–27" |

Limite: o cartão de compartilhar não foi aberto no teste (não aparece no DOM pelo clique de teste); a mudança nele é uma linha (`bmiCategory(info.bmi, info.data?.age)`), conferida por leitura e pela checagem de sintaxe.

## 1.12.300 (= 1.12.299 + quadro "Vencimentos com pagamento repetido" + mensagem do Pix ao cancelar)

| Teste | 1.12.299 | 1.12.300 |
|---|---|---|
| `repetidos-chrome.cjs 299\|300` — dados já gravados: Ana com R$ 450 e R$ 500 no vencimento 05/11, Bruno com R$ 300 e R$ 50 "sem quitar" | Recebido R$ 1.300,00, sem quadro | quadro só com a Ana (R$ 950,00); cancelar não muda nada; "Manter este" no R$ 500 → Recebido **R$ 850,00**, quadro some, R$ 450 no histórico como substituído; igual depois de recarregar |
| `financeiro-chrome.cjs 300` e `financeiro-vm.cjs` | — | mesmos resultados do 1.12.299 |

Verificador (PR e assinatura) com `alteracoes-autorizadas/1.12.300.json`: aprovado. Mecanismo real: 159 verificações. Testes oficiais do Android: 18/18.
Não testado: a mensagem do comprovante Pix ao cancelar (exige o fluxo de leitura de comprovante; conferida por leitura), modo claro do quadro, Xiaomi e iPhone.
