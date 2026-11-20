'use strict';
// Capturas para olhar a olho (nada é conferido aqui): o topo do Início com o 1.12.294 e o 1.12.295, sem feedback pendente e com 2.
// uso: PORTA=8790 SAIDA=saida node capturas.js <index-295.html> <index-294.html>
const {abrir, cenario, sleep} = require('../sininho-feedback/aluno.js');
const [, , nova, antiga] = process.argv;
(async () => {
  for (const [pagina, nome] of [[antiga, '294'], [nova, '295']]) {
    const c = await abrir(pagina);
    for (const [pend, rot] of [[0, 'sem-pendencia'], [2, 'com-2']]) {
      await cenario(c, {nome: 'Silvana Souza'}, {pendentes: pend, respondidos: 1});
      await c.evaluate('scrollTo(0,0),true'); await sleep(300);
      await c.captura(nome + '-' + rot + '.png');
    }
    c.close();
  }
})().catch(e => { console.error(e); process.exit(3); });
