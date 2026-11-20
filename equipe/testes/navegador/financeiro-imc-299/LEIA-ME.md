# Testes do 1.12.299 (mensalidade corrigida e IMC por idade)

Rodados em 20/11/2026 no Chrome 153.0.8010.12 do ambiente do Claude (playwright-core 1.63.0 com `/usr/bin/google-chrome`), páginas tiradas dos pacotes 1.12.298 (controle) e 1.12.299 e servidas em `http://127.0.0.1:8799/` (`python3 -m http.server`) como `298-professor.html`, `299-professor.html`, `298-avaliacoes.html` e `299-avaliacoes.html`. Os scripts têm caminhos fixos do ambiente (`/tmp/pwc`, `/tmp/t299/pag`); ajuste antes de rodar.

| Teste | O que prova | 1.12.298 | 1.12.299 |
|---|---|---|---|
| `financeiro-vm.cjs <pacote>` | modelos do Recebido e dos resultados + bloco novo num vm: pergunta, cancelar não grava, confirmar marca `replaces`, soma 500 (não 950), aluno só vê o que vale, 3ª correção, outro vencimento e "sem quitar" não perguntam | — | passa |
| `financeiro-chrome.cjs 298\|299` | tela real do professor: quitar 450, editar o aluno (vencimento de volta, valor 500), quitar de novo; cancelar; confirmar; quitar o mês seguinte; recarregar | Recebido **R$ 950,00** (reproduz o achado) | **R$ 500,00**; 450 guardado "Substituído … fora das somas"; marca sobrevive ao mês seguinte e ao recarregar |
| `imc-tela-chrome.cjs` | Meta 3 na tela para 7 casos (70/65/60/59/30 anos e sem idade) | sempre faixa adulta | 60+ usa 22–27; abaixo de 60 e sem idade: texto idêntico ao 298 |
| `imc-pdf-chrome.cjs` | texto do relatório (PDF) 298 x 299, 45 e 70 anos | — | 45 anos: só a frase nova do método; 70 anos: "peso adequado (60 anos ou mais)", "56,3–69,1 kg para IMC 22–27" |

Limite: o cartão de compartilhar não foi aberto no teste (não aparece no DOM pelo clique de teste); a mudança nele é uma linha (`bmiCategory(info.bmi, info.data?.age)`), conferida por leitura e pela checagem de sintaxe.
