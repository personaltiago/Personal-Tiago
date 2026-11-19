'use strict';
// Geometria das 38 janelas abertas (openDialog sem dados) conforme a classificação PÁGINA / FORA.
// uso: node geometria.js <pagina.html> <css|-> [LxA] [design] [modo]   (env SHOT=prefixo)
const fs = require('node:fs');
const {launch, sleep, BASE, SAIDA} = require('./cdp.js');
const APP = process.argv[2], CSS = process.argv[3] && process.argv[3] !== '-' ? fs.readFileSync(process.argv[3], 'utf8') : '';
const [W_, H_] = (process.argv[4] || '390x844').split('x').map(Number);
const DESIGN = process.argv[5] || 'current', MODO = process.argv[6] || 'dark';
const DESIGN_ID = {current: null, neon: 'neon-tl', metal: 'metal-tl', pro: 'pro-tl', deep: 'deep-tl'}[DESIGN];
const CL = require('./classes.js'); // {paginas, fora}: vem do gerador do pacote
(async () => {
  const c = await launch({w: W_, h: H_, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  try {
    const url = BASE + '/dialogo.html?app=' + APP;
    await c.navigate(url); await sleep(300);
    await c.evaluate(DESIGN_ID ? `localStorage.setItem('agendaPersonalTL_design_v1', JSON.stringify({version:1,id:${JSON.stringify(DESIGN_ID)}}))` : `localStorage.removeItem('agendaPersonalTL_design_v1')`);
    await c.navigate(url);
    for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
    await sleep(1800);
    await ev(`return W.AgendaAppearance.setMode(${JSON.stringify(MODO)})`); await sleep(600);
    if (CSS) await ev(`const s=D.createElement('style');s.id='css-candidato';s.textContent=${JSON.stringify(CSS)};D.head.appendChild(s);`);
    const ids = await ev(`return [...D.querySelectorAll('.dialog')].map(d=>d.id)`);
    const linhas = [], falhas = [];
    for (const id of ids) {
      await ev(`[...D.querySelectorAll('.dialog.open')].forEach(d=>W.closeDialog(d.id));W.showScreen('more');`); await sleep(200);
      await ev(`W.openDialog(${JSON.stringify(id)});`); await sleep(350);
      const r = await ev(`
        const d=D.getElementById(${JSON.stringify(id)}), sh=d.querySelector(':scope>.sheet'), cs=W.getComputedStyle(sh), b=sh.getBoundingClientRect();
        const bar=D.querySelector('.panel-return-bar'), vis=bar&&W.getComputedStyle(bar).display!=='none';
        const hd=sh.querySelector('.sheet-head,.color-panel-header,.workout-video-head')||sh.firstElementChild, hb=hd.getBoundingClientRect();
        return {open:d.classList.contains('open'),top:Math.round(b.top),left:Math.round(b.left),right:Math.round(b.right),bottom:Math.round(b.bottom),vw:W.innerWidth,vh:W.innerHeight,
          radius:cs.borderTopLeftRadius,border:cs.borderTopWidth+'/'+cs.borderLeftWidth,shadow:cs.boxShadow==='none'?'none':'sim',pt:cs.paddingTop,pb:cs.paddingBottom,
          max:sh.scrollHeight-sh.clientHeight,barTop:vis?Math.round(bar.getBoundingClientRect().top):null,headTop:Math.round(hb.top),dlgPad:W.getComputedStyle(d).padding,bodyOv:W.getComputedStyle(D.body).overflowY};`);
      const eh = CL.paginas.includes(id) ? 'PÁGINA' : 'fora  ';
      let ok = true, motivo = '';
      if (!r.open) { ok = false; motivo = 'NÃO ABRIU'; }
      else if (CL.paginas.includes(id)) {
        if (!(r.top === 0 && r.left === 0 && r.right === r.vw && r.bottom === r.vh && r.radius === '0px' && r.border === '0px/0px' && r.shadow === 'none')) { ok = false; motivo = 'não é página inteira'; }
      }
      linhas.push(`${eh} ${id.padEnd(30)} ${r.open ? `rect=${r.left},${r.top} → ${r.right},${r.bottom} (tela ${r.vw}×${r.vh}) raio=${r.radius} borda=${r.border} sombra=${r.shadow} pt=${r.pt} pb=${r.pb} rolagem=${r.max} título.top=${r.headTop} barra=${r.barTop} corpo=${r.bodyOv}` : 'NÃO ABRIU'}${ok ? '' : '   <<< ' + motivo}`);
      if (!ok) falhas.push(id + ': ' + motivo);
      if (process.env.SHOT) { fs.mkdirSync(SAIDA + '/g', {recursive: true}); await c.shot(`${SAIDA}/g/${process.env.SHOT}-${DESIGN}-${MODO}-${id}.png`); }
    }
    console.log(linhas.join('\n'));
    console.log(`\nTOTAL: ${ids.length} janelas; PÁGINA esperadas ${CL.paginas.length}; falhas ${falhas.length}${falhas.length ? ' → ' + falhas.join(' | ') : ''}`);
    const errs = c.logs.filter(l => /ERRO-PAGINA/.test(l)); if (errs.length) console.log('ERROS', errs.slice(0, 3).join(' | '));
  } finally { c.close(); }
  process.exit(0);
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
