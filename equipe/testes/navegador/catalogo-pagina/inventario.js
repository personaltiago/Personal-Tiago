'use strict';
const {launch, sleep, BASE, SAIDA} = require('./cdp.js');
(async () => {
  const c = await launch({w: 390, h: 844, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  try {
    await c.navigate(BASE + '/dialogo.html?app=' + (process.argv[2] || 'prof-287.html'));
    for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
    await sleep(1500);
    const rows = await ev(`
      return [...D.querySelectorAll('.dialog')].map(d=>{
        const cs=W.getComputedStyle(d), sh=d.querySelector(':scope>.sheet')||d.firstElementChild, ss=W.getComputedStyle(sh);
        return [d.id, d.className, cs.backgroundColor, cs.pointerEvents, cs.alignItems, cs.zIndex, sh.className, ss.overflowY, ss.maxHeight, ss.borderRadius.split(' ')[0], ss.backgroundColor.slice(0,24), (d.getAttribute('onclick')||'')?'onclick':'' , d.children.length].join(' | ');
      });`);
    console.log(rows.join('\n'));
    // quem fecha ao tocar no fundo? procurar listeners/handlers conhecidos no código
    const bg = await ev(`return W.document.documentElement.outerHTML.includes("e.target===d")||W.document.documentElement.outerHTML.includes("event.target===dialog")`);
    console.log('tem handler de toque no fundo?', bg);
  } finally { c.close(); }
  process.exit(0);
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
