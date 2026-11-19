'use strict';
// Capturas antes/depois do Catálogo (mesmo estado, mesma tela) para o Tiago.
const {launch, sleep, BASE, SAIDA} = require('./cdp.js');
const fs = require('node:fs');
(async () => {
  const out = SAIDA + '/cap'; fs.mkdirSync(out, {recursive: true});
  for (const [app, tag] of [['prof-286.html', 'antes'], ['prof-287.html', 'depois']]) {
    const c = await launch({w: 390, h: 844, dpr: 2});
    const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
    try {
      await c.navigate(BASE + '/dialogo.html?app=' + app);
      for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
      await sleep(2000);
      await ev(`W.showScreen('more');`); await sleep(500);
      await ev(`W.scrollTo(0,400);`); await sleep(300);
      await c.shot(`${out}/${tag}-0-mais.png`);
      await ev(`W.openWorkoutCatalog();`); await sleep(600);
      await c.shot(`${out}/${tag}-1-aberto.png`);
      const y0 = await ev(`return Math.round(W.scrollY)`);
      await c.swipe(150, 38, 150);   // dedo no título, arrastando para baixo
      const y1 = await ev(`return Math.round(W.scrollY)`);
      await c.shot(`${out}/${tag}-2-arrastou.png`);
      console.log(tag, 'página de trás: scrollY', y0, '→', y1);
    } finally { c.close(); }
  }
  process.exit(0);
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
