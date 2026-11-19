# Teste no Chrome real — Excluídos da lista (1.12.285)

Abre o `professor.html` verdadeiro do pacote dentro de um iframe, com um Firestore **simulado** (alunos Ana e Bruno
aguardando, Carla aprovada e fora da agenda, Diego aprovado e na agenda, Elisa na agenda mas sem aprovação e Fabio de
outro professor). Tem dois cenários:

- `mode=func` — as 76 verificações do 1.12.284 (cartões no Mais, Cadastro por link, Alunos para aprovar sem o Excluir,
  Lista de alunos com o Excluir da lista, aprovação, sininho, Voltar, ×). Servem de regressão: precisam seguir passando.
- `mode=excl` — o que é novo no 1.12.285, a partir de exclusões **já guardadas na agenda**, como as que o Excluir da lista
  do Contatos antigo deixou no celular:
  - `hidden=all` (43 verificações) reproduz o celular do Tiago em 19/11: os cinco cadastros do professor estão excluídos
    da lista. A Lista de alunos mostra "Nenhum aluno na lista." e, logo abaixo, o bloco dos excluídos já aberto, com os
    cinco nomes, a situação de cada um, "Voltar para a lista" em cada cartão e "Voltar todos para a lista". Depois:
    Alunos para aprovar sem o bloco; devolver Bruno (cartão volta com aprovar e excluir, marca sai do mapa e do
    armazenamento, uma sincronização da agenda, nada gravado no Firebase, sininho passa a contar 1); Ocultar e Mostrar
    excluídos; devolver Carla; Voltar todos; excluir de novo com a confirmação que agora diz que dá para voltar; Atualizar
    lista mantém o bloco aberto e abrir a lista de novo o recomeça fechado; armazenamento cheio (nada muda e a tela
    avisa); depois volta a funcionar.
  - `hidden=some` (13 verificações): Bruno e Carla excluídos, mais uma marca de outro professor e uma de cadastro que o
    Firebase não devolve (nenhuma das duas vira cartão e as duas continuam no mapa). Bloco fechado no fim da lista,
    botão "Mostrar excluídos (2)" de 44 px, abrir, Voltar todos, e Alunos para aprovar sem o bloco.

Não usa o Firebase real e **não substitui o teste no celular**.

Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 e `google-chrome` no PATH.

## Como rodar
1. Tire o `professor.html` do pacote e monte a pasta de páginas:
   ```
   mkdir -p www saida
   cp cenario.html www/
   node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));fs.writeFileSync('www/prof-285.html',p.files['professor.html'])" <pacote.agenda.json>
   ```
   (Para ver o cenário novo reprovar no 1.12.284, salve o `professor.html` dele como `www/prof-284.html` e abra com
   `&app=prof-284.html`: falha em "versão carregada: anterior" e não encontra o bloco dos excluídos. Com `hidden=all`
   ele ainda mostra "Nenhum aluno na lista.", que é exatamente o que o celular mostrava.)
2. Suba o servidor: `python3 servidor.py www saida 8785 &`
3. Rode os cenários (cada um termina com `AUDIT RESUMO ok=… falhas=0` e código de saída 0):
   ```
   node cdp.js "http://127.0.0.1:8785/cenario.html?mode=func" --w 390 --h 844 --timeout 200
   node cdp.js "http://127.0.0.1:8785/cenario.html?mode=excl&hidden=all" --w 390 --h 844 --timeout 200
   node cdp.js "http://127.0.0.1:8785/cenario.html?mode=excl&hidden=some" --w 390 --h 844 --timeout 200
   ```
   e as mesmas três com `--w 320 --h 640`, com `&theme=metal` e com `&theme=deep` (390×844): `ok=76`, `ok=43`, `ok=13`.
4. Capturas de tela: `?mode=shot&view=excl-all&hidden=all` (o estado do celular do Tiago), `view=excl-closed&hidden=some`
   (bloco fechado, no fim da lista), `view=excl-open&hidden=some` (bloco aberto) e `view=confirm` (confirmação do Excluir),
   com `&theme=metal|deep` se quiser, por exemplo
   ```
   node cdp.js "http://127.0.0.1:8785/cenario.html?mode=shot&view=excl-all&hidden=all" --w 390 --h 844 --dpr 2 --end SHOT --shot saida/todos-escondidos.png
   ```

Cada verificação imprime uma linha `AUDIT OK …` ou `AUDIT FALHA …`; erros de JavaScript da página saem como `ERRO-PAGINA`.
O ruído de rede do Chrome no sandbox (update.googleapis.com e similares) é inofensivo.
