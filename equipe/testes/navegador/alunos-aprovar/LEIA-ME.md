# Teste no Chrome real — Alunos para aprovar (1.12.283)

Abre o `professor.html` verdadeiro do pacote dentro de um iframe, com um Firestore **simulado** (alunos Ana e Bruno
aguardando, Carla aprovada e fora da agenda, Diego aprovado e na agenda, Elisa na agenda mas sem aprovação e Fabio de
outro professor), e confere 66 itens: cartão no Mais (lugar, texto, ícone), Cadastro por link só com os cinco links,
janela Alunos para aprovar (título, ícones, atalhos ocultos), quem aparece na lista e com qual status, aprovação
(uma gravação, a mesma de antes), cartão que fica como "Na agenda" até atualizar, contador do sininho, "Excluir da lista"
sem tocar no Firebase, lista vazia, fechar e reabrir e o Voltar do sistema. Não usa o Firebase real e **não substitui o
teste no celular**.

Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 e `google-chrome` no PATH.

## Como rodar
1. Tire o `professor.html` do pacote e monte a pasta de páginas:
   ```
   mkdir -p www saida
   cp cenario.html www/
   node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));fs.writeFileSync('www/prof-283.html',p.files['professor.html'])" <pacote.agenda.json>
   ```
   (Para ver o cenário reprovar no 1.12.282, salve o `professor.html` dele como `www/prof-282.html` e abra com
   `&app=prof-282.html`: ele falha em "versão carregada: 282 (antigo)" e termina com falhas e código de saída 1.)
2. Suba o servidor: `python3 servidor.py www saida 8773 &`
3. Rode o cenário completo (termina com `AUDIT RESUMO ok=66 falhas=0` e código de saída 0):
   ```
   node cdp.js "http://127.0.0.1:8773/cenario.html?mode=func" --w 390 --h 844 --timeout 150
   node cdp.js "http://127.0.0.1:8773/cenario.html?mode=func" --w 320 --h 640 --timeout 150
   node cdp.js "http://127.0.0.1:8773/cenario.html?mode=func&theme=metal" --w 390 --h 844 --timeout 150
   node cdp.js "http://127.0.0.1:8773/cenario.html?mode=func&theme=deep" --w 390 --h 844 --timeout 150
   ```
4. Capturas de tela: `?mode=shot&view=mais|links|approvals|approved|empty` (e `&theme=metal|deep`), por exemplo
   ```
   node cdp.js "http://127.0.0.1:8773/cenario.html?mode=shot&view=approvals" --w 390 --h 844 --dpr 2 --end SHOT --shot saida/aprovar.png
   ```

Cada verificação imprime uma linha `AUDIT OK …` ou `AUDIT FALHA …`; erros de JavaScript da página saem como `ERRO-PAGINA`.
O ruído de rede do Chrome no sandbox (update.googleapis.com e similares) é inofensivo.
