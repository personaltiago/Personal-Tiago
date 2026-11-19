'use strict';
// Catálogo como página: geometria + captura em cada design/modo.
// uso: node pagina.js <pagina.html> <css|-> <prefixo-das-capturas> [LxA]
const fs = require('node:fs');
const {launch, sleep, BASE, SAIDA} = require('./cdp.js');
const APP = process.argv[2] || 'prof-286.html';
const CSS = process.argv[3] && process.argv[3] !== '-' ? fs.readFileSync(process.argv[3], 'utf8') : '';
const PREF = process.argv[4] || 'pg';
const [W_, H_] = (process.argv[5] || '390x844').split('x').map(Number);
const DESIGNS_ALL = [["current", null], ["neon", "neon-tl"], ["metal", "metal-tl"], ["pro", "pro-tl"], ["deep", "deep-tl"]];
const DESIGNS = process.env.ONLY ? DESIGNS_ALL.filter(d => process.env.ONLY.split(",").includes(d[0])) : DESIGNS_ALL;
(async () => {
  const c = await launch({w: W_, h: H_, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  const url = BASE + '/dialogo.html?app=' + APP;
  fs.mkdirSync(SAIDA + '/pg', {recursive: true});
  try {
    for (const [nome, id] of DESIGNS) {
      for (const modo of ['dark', 'light']) {
        await c.navigate(url); await sleep(200);
        await c.evaluate(id ? `localStorage.setItem('agendaPersonalTL_design_v1', JSON.stringify({version:1,id:${JSON.stringify(id)}}))` : `localStorage.removeItem('agendaPersonalTL_design_v1')`);
        await c.navigate(url);
        for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
        await sleep(1800);
        await ev(`return W.AgendaAppearance.setMode(${JSON.stringify(modo)})`); await sleep(600);
        if (CSS) await ev(`const s=D.createElement('style');s.id='css-candidato';s.textContent=${JSON.stringify(CSS)};D.head.appendChild(s);`);
        await ev(`W.showScreen('more');`); await sleep(300);
        await ev(`W.scrollTo(0,400);`); await sleep(200);
        await ev(`W.openWorkoutCatalog();`); await sleep(450);
        const r = await ev(`
          const d=D.getElementById('workoutCatalogDialog'), sh=d.querySelector('.sheet'), cs=W.getComputedStyle(sh), b=sh.getBoundingClientRect();
          const bar=D.querySelector('.panel-return-bar'), bb=bar?bar.getBoundingClientRect():null, vis=bar&&W.getComputedStyle(bar).display!=='none';
          const head=sh.querySelector('.sheet-head').getBoundingClientRect(), x=sh.querySelector('.close').getBoundingClientRect();
          return {top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),right:Math.round(b.right),vh:W.innerHeight,vw:W.innerWidth,radius:cs.borderRadius,border:cs.borderTopWidth+'/'+cs.borderLeftWidth,shadow:cs.boxShadow,barTop:vis?Math.round(bb.top):null,titleTop:Math.round(head.top),closeTop:Math.round(x.top),closeRight:Math.round(x.right),coarse:W.matchMedia('(pointer:coarse)').matches,bodyOverflow:W.getComputedStyle(D.body).overflowY,sheetOverflow:cs.overflowY,scrollMax:sh.scrollHeight-sh.clientHeight};`);
        await c.shot(`${SAIDA}/pg/${PREF}-${nome}-${modo}-topo.png`);
        // fim da lista: o último item precisa ficar acima da barra Voltar/Painel
        await ev(`const sh=D.getElementById('workoutCatalogDialog').querySelector('.sheet');sh.scrollTop=sh.scrollHeight;`); await sleep(300);
        const f = await ev(`
          const d=D.getElementById('workoutCatalogDialog'), sh=d.querySelector('.sheet'), mais=D.getElementById('workoutCatalogMore');
          const ult=mais&&mais.getBoundingClientRect().height>0?mais.getBoundingClientRect().bottom:0;
          const bar=D.querySelector('.panel-return-bar'), vis=bar&&W.getComputedStyle(bar).display!=='none';
          return {ultimoBottom:Math.round(ult), barTop: vis?Math.round(bar.getBoundingClientRect().top):null, vh:W.innerHeight, sc:Math.round(sh.scrollTop)};`);
        await c.shot(`${SAIDA}/pg/${PREF}-${nome}-${modo}-fim.png`);
        const okTopo = r.top === 0 && r.left === 0 && r.right === r.vw && r.radius.startsWith('0px');
        const livre = f.barTop === null ? f.vh - f.ultimoBottom : f.barTop - f.ultimoBottom;
        console.log(`${nome.padEnd(8)} ${modo.padEnd(5)} topo=${r.top} L=${r.left} R=${r.right}/${r.vw} B=${r.bottom}/${r.vh} raio=${r.radius.split(' ')[0]} borda=${r.border} sombra=${r.shadow === 'none' ? 'none' : 'AINDA'} barra=${r.barTop} título.top=${r.titleTop} ×.top=${r.closeTop} ×.dir=${r.closeRight} fim: 'Mostrar mais' bottom=${f.ultimoBottom} folga=${livre}px  coarse=${r.coarse} body.overflow=${r.bodyOverflow}${okTopo ? '' : '  <<< NÃO É PÁGINA'}`);
      }
    }
  } finally { c.close(); }
  process.exit(0);
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
