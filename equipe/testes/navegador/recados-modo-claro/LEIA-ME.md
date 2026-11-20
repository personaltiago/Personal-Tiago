# Teste no Chrome real — Recados do dia no modo claro (1.12.286)

Abre o `professor.html` verdadeiro do pacote dentro de um iframe e confere o cartão **Recados do dia** do Painel (o que
aparece no lugar do mascote quando ele está desligado). O cartão é montado como o módulo do mascote faz (classes
`home-card ap-teacher-mascot ap-habitat ap-recado-only`, fundo sem imagem e o bloco `.ap-mascot-recados` com título e texto).
Não usa Firebase, não usa a casca do aplicativo e **não substitui o teste no celular**.

O defeito do 1.12.285: o cartão tinha fundo escuro fixo (`#191b1f`) e o texto seguia o tema; no modo claro o texto ficava
escuro sobre o fundo escuro (contraste 1,06 : 1). O 1.12.286 acrescenta duas regras de CSS só para o modo claro
(`html[data-agenda-color-mode="light"]`), com as cores do tema (`--ac-surface`, `--ac-accent-border`, `--ac-text`,
`--ac-accent`). O modo escuro não muda.

Precisa de Node 22 ou mais novo (usa o `WebSocket` embutido), Python 3 e `google-chrome` no PATH.

## Como rodar
1. Tire o `professor.html` dos dois pacotes (o 1.12.285 e o 1.12.286) e monte a pasta de páginas:
   ```
   mkdir -p www saida
   cp cenario.html www/
   for v in 285 286; do node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));fs.writeFileSync('www/prof-'+process.argv[2]+'.html',p.files['professor.html'])" <pacote-$v.agenda.json> $v; done
   ```
2. Suba o servidor: `python3 servidor.py www saida 8786 &`
3. Contraste (cada execução termina com `AUDIT RESUMO ok=… falhas=0` e código de saída 0). Parâmetros do cenário:
   `app` (página), `mode=light|dark`, `design=current|neon|metal|pro|deep`, `preset=none|purple-white|purple-black|custom`
   (`custom` usa `primary`, `secondary`, `background`), `view=check|toggle|shot|dump`.
   ```
   node cdp.js "http://127.0.0.1:8786/cenario.html?app=prof-286.html&mode=light&design=current&view=check" --w 390 --h 844
   node cdp.js "http://127.0.0.1:8786/cenario.html?app=prof-286.html&mode=dark&design=deep&view=check" --w 320 --h 640
   ```
   Esperado no `prof-286.html`: `ok=7` no claro e `ok=8` no escuro (texto e título com pelo menos 4,5 : 1; no escuro o cartão
   segue `#191b1f`), nos cinco temas e nos dois tamanhos. No `prof-285.html` o claro **falha** em "texto do recado com contraste
   mínimo de 4,5:1" (razão 1,06 a 1,07) nos cinco temas, e o escuro passa: é a prova de que o teste enxerga o defeito.
4. Alternar o modo na mesma tela (claro → escuro → claro; o cartão acompanha na hora e volta igual): `view=toggle`, 11 verificações.
5. Temas claros personalizados (`preset=custom`, por exemplo `&primary=%23f5d90a&secondary=%23ffffff&background=%23ffffff`):
   o título usa `--ac-accent`, que o aplicativo garante com pelo menos 4,75 : 1 sobre o fundo; foram conferidos amarelo, rosa,
   verde-água, azul, preto, limão e cinza-médio (título de 4,86 a 18,41 : 1, texto de 13,96 a 18,27 : 1).
6. Nada mais mudou na tela: rode `view=dump` com a página antiga e com a nova, nas mesmas condições, e compare
   ```
   node cdp.js "http://127.0.0.1:8786/cenario.html?app=prof-285.html&mode=light&design=current&view=dump" > saida/antes.txt
   node cdp.js "http://127.0.0.1:8786/cenario.html?app=prof-286.html&mode=light&design=current&view=dump" > saida/depois.txt
   node comparar-estilos.cjs saida/antes.txt saida/depois.txt
   ```
   Esperado: no claro, 2 elementos diferentes (o cartão e o título); no escuro, 0 (de 3.900 a 11.700 elementos, conforme o tema).
   Duas execuções da MESMA página dão 0 diferenças (as propriedades são comparadas em ordem alfabética).
7. Capturas: `view=shot` com `--dpr 2 --end SHOT --shot saida/arquivo.png`.

O `cdp.js` pede uma porta livre ao sistema, então várias execuções podem rodar em paralelo (a versão anterior sorteava a porta
e, em paralelo, duas execuções podiam cair na mesma janela). O ruído de rede do Chrome no sandbox (update.googleapis.com e
similares) é inofensivo.
