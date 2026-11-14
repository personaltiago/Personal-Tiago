# Armazenamento no telefone — ChatGPT — 2026-11-14

Branch `chatgpt/modo-telefone`, base `818736e5065ee43ba936fb1f77bff6eac889089b`. O ZIP da main nesse commit declara Android 1.206, conteúdo 1.12.268 e sequência 374. O pedido citava Android 1.204 para a mesma versão de conteúdo. Foi usada a fonte atual da main, com a numeração original.

## Pedido do Tiago

Corrigir a recuperação da agenda no modo telefone antes de devolver o botão que ativa esse modo. Detalhar o grupo “Preferências e outros” em Mais → Armazenamento.

## Diff em texto

- `web/native-release.agenda.json` dentro do ZIP mudou somente em `professor.html`. Os quatro blocos editados foram `ap-native-store`, o núcleo `APFullBackupCore`, a interface que chama `renderStore`/`storeToggle` e `ap-storage-meter`.
- O núcleo captura a agenda diretamente do modo ativo. Durante a aplicação e o rollback no modo telefone, a ponte existente grava, relê e confirma o arquivo principal antes da limpeza do journal. Uma falha mantém a cópia anterior até a recuperação ser confirmada. A cópia no telefone é atualizada após a conclusão do procedimento.
- A interface oferece ativação com confirmação. A volta ao modo antigo mantém a regra existente de 5 MB. A linha de preferências abre uma lista das 10 maiores entradas, em tamanho decrescente, com nomes amigáveis e tamanhos.
- `release.json` atualiza hashes do inventário de fontes. `tests/verify_native_store.cjs` e `tests/verify_storage_meter.cjs` cobrem os novos caminhos. `tests/verify_update_center.cjs` atualiza o hash esperado de `professor.html`.
- `equipe/funcionalidades-exigidas.json` e os dois scripts verificadores da equipe promovem os dois requisitos e testam que sua remoção reprova.

Nenhuma perda observada. A área de risco é armazenamento e backup.

## Verificado [V]

No ZIP original, a restauração indicava sucesso, mas uma reabertura antes da gravação adiada lia a agenda anterior do modo telefone. A mesma reprodução com a mudança reabriu com a agenda do backup. Os testes usaram dados fictícios, com IndexedDB e ponte Android simulados nos cenários integrados do JavaScript.

| Caso | Resultado |
| --- | --- |
| Modo antigo, restauração e reabertura | Agenda do backup em ambas. |
| Ativação e reabertura | Agenda anterior à migração preservada em ambas. |
| Modo telefone, restauração e reabertura | Agenda do backup em ambas, inclusive reabrindo imediatamente. |
| Falha simulada durante a restauração | Agenda, preferências e anexo anteriores voltaram nos dois modos. |
| Limpeza depois da restauração | Journal vazio. O tamanho medido só variou pelos dados restaurados. |
| Volta ao modo antigo | Abaixo de 5 MB voltou com a agenda intacta. Acima de 5 MB preservou o modo telefone e a agenda. |
| “Cópia no telefone” | Atualizada nos dois modos antes e depois da reabertura. |
| Descanso, alarmes e tela bloqueada | Diff sem alterações nos arquivos nativos ou scripts dessas funções. |

`equipe/testes/verificar_funcionalidades.py` passou com 457 itens, zero falhas e zero avisos. `equipe/testes/testar_verificador.py` passou 18 de 18 casos. `tests/run_all.py` passou, incluindo Chromium headless e as verificações de `NativeStore` e `NativeMirror`.

## Aprovado [A]

Tiago aprovou devolver o controle após corrigir a recuperação e passar `guardar-agenda-telefone` e `guardar-agenda-telefone-ativacao` de ausências conhecidas a requisitos obrigatórios.

## Hipóteses [H]

A reabertura foi validada no ambiente de teste. O comportamento em um Xiaomi físico e durante interrupção abrupta do processo Android ainda depende de validação em aparelho.

## Reversão

A referência anterior é `818736e5065ee43ba936fb1f77bff6eac889089b`, que já lê o arquivo do `NativeStore`. Se a mudança vier a ser integrada e precisar de reversão, reverter o merge em outro PR e seguir a distribuição normal de um build instalável por cima. Na validação futura em dispositivo, usar uma agenda fictícia e exportar e conferir um backup fora do aparelho antes da instalação. A pessoa que realiza o teste deve conferir, no resumo do backup e após reabrir o app, o número de alunos e treinos fictícios e a agenda reaberta.
