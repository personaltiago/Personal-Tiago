# Teste no Chrome real — Lista de alunos (1.12.284)

Abre o `professor.html` verdadeiro do pacote dentro de um iframe, com um Firestore **simulado** (alunos Ana e Bruno
aguardando, Carla aprovada e fora da agenda, Diego aprovado e na agenda, Elisa na agenda mas sem aprovação e Fabio de
outro professor), e confere 76 itens: os dois cartões no Mais (lugar, ordem, texto, ícone, tamanho, subtítulo em uma
linha), Cadastro por link igual ao do 1.12.283, a janela Alunos para aprovar **sem** o botão Excluir da lista, a janela
Lista de alunos com os cinco cadastros e os cinco botões Excluir da lista, aprovação nas duas janelas (uma gravação, a
mesma de antes), cancelar e confirmar a exclusão (só esconde: nenhuma gravação no Firebase, mapa local salvo), lista
vazia por modo, sininho depois da lista (volta para Alunos para aprovar), caminho do menu "Alunos e convites", Voltar do
sistema nos dois modos, botão × e a volta para a janela de links. Não usa o Firebase real e **não substitui o teste no
celular**.

Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 e `google-chrome` no PATH.

## Como rodar
1. Tire o `professor.html` do pacote e monte a pasta de páginas:
   ```
   mkdir -p www saida
   cp cenario.html www/
   node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));fs.writeFileSync('www/prof-284.html',p.files['professor.html'])" <pacote.agenda.json>
   ```
   (Para ver o cenário reprovar no 1.12.283, salve o `professor.html` dele como `www/prof-283.html` e abra com
   `&app=prof-283.html`: ele falha em "versão carregada: anterior", mostra os botões Excluir dentro de Alunos para
   aprovar, não tem o cartão Lista de alunos e termina com falhas e código de saída 1.)
2. Suba o servidor: `python3 servidor.py www saida 8784 &`
3. Rode o cenário completo (termina com `AUDIT RESUMO ok=76 falhas=0` e código de saída 0):
   ```
   node cdp.js "http://127.0.0.1:8784/cenario.html?mode=func" --w 390 --h 844 --timeout 150
   node cdp.js "http://127.0.0.1:8784/cenario.html?mode=func" --w 320 --h 640 --timeout 150
   node cdp.js "http://127.0.0.1:8784/cenario.html?mode=func&theme=metal" --w 390 --h 844 --timeout 150
   node cdp.js "http://127.0.0.1:8784/cenario.html?mode=func&theme=deep" --w 390 --h 844 --timeout 150
   ```
4. Capturas de tela: `?mode=shot&view=mais|cards|approvals|list|confirm|links|empty` (e `&theme=metal|deep`), por exemplo
   ```
   node cdp.js "http://127.0.0.1:8784/cenario.html?mode=shot&view=list" --w 390 --h 844 --dpr 2 --end SHOT --shot saida/lista.png
   ```

Cada verificação imprime uma linha `AUDIT OK …` ou `AUDIT FALHA …`; erros de JavaScript da página saem como `ERRO-PAGINA`.
O ruído de rede do Chrome no sandbox (update.googleapis.com e similares) é inofensivo.
