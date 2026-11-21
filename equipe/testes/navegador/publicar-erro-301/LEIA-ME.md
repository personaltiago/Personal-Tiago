# Teste da barra do "Publicar para os alunos" (1.12.301)

`barra-publicar-chrome.cjs`: abre o `index.html` do 1.12.300 e do 1.12.301 no Chrome (servidos em `http://127.0.0.1:8798/300-index.html` e `301-index.html`), põe a marcação real do painel (`apPublishProgress…`, tirada do próprio index.html) e chama a função real que desenha a barra (`c` do bloco `ap-distribution-controls`, exposta só na cópia de teste) na mesma ordem em que a publicação chama.

Resultado em 21/11/2026 (Chrome do ambiente do Claude):

| Situação | 1.12.300 | 1.12.301 |
|---|---|---|
| Queda da conexão em 25% (erro do envio e depois o erro final) | "100% do envio", barra 100, 18,3 de 18,3 MB | **"Parou em 25%", barra 25, 4,6 de 18,3 MB** |
| Arquivo enviado, servidor não confirma | "100% do envio", barra 100 | **"Enviado, sem confirmação", barra 99** |
| Falha antes do envio | "—" | "—" (igual) |
| Sucesso | "Publicação concluída", 100% | igual |

Não testado: o envio real a um servidor, nem no aparelho.
