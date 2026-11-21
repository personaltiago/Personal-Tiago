# Central de atualizações web

Capturas da interface em Chromium. O painel usou o código real do app e o arquivo assinado 1.12.298/404. A autorização, os eventos de transporte e o manifesto foram simulados em um servidor local. A versão ativa da sessão de teste era 1.12.294/400. O cenário não escreve no servidor de produção.

| Cenário | Resultado esperado e observado |
| --- | --- |
| [Arquivo inválido](01-arquivo-invalido.jpg) | A leitura sinaliza JSON incompleto. |
| [Assinatura inválida](02-assinatura-invalida.jpg) | O painel recusa o pacote antes do envio. |
| [Conexão interrompida](03-queda-25.jpg) | A barra permanece em 25%, com 4.799.973 de 19.199.889 bytes. |
| [Confirmação e recibo](05-recibo.jpg) | Chega a 100% após a leitura do manifesto compatível. O recibo mostra arquivo, versão no servidor e versão ativa no aparelho. |

O [registro das asserções](estados.json) inclui também o envio sem tamanho conhecido, a resposta com manifesto divergente e a tentativa que confirma sem repetir o POST. O tempo exibido é o horário local do aparelho.

Execute `node tests/publication-states.mjs` para repetir os cenários com o painel de produção e WebCrypto. Com Playwright e Chromium disponíveis, execute `AGENDA_EVIDENCE=./capturas node tests/publication-progress.mjs` para repetir o fluxo no navegador e gerar os prints novamente.
