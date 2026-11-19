'use strict';
// Matriz de vazamento de rolagem com toque real.
// uso: node matriz.js <pagina.html> <css|-> <lista-de-janelas> [LxA] [design] [modo]
//   lista: ids separados por vírgula; "catalogo" abre pelo openWorkoutCatalog(); "*" = todas as .dialog
const fs = require('node:fs');
const {launch, sleep, BASE, SAIDA} = require('./cdp.js');
const APP = process.argv[2] || 'prof-286.html';
const CSS = process.argv[3] && process.argv[3] !== '-' ? fs.readFileSync(process.argv[3], 'utf8') : '';
const LISTA = process.argv[4] || 'catalogo,workoutRestDialog,studentPhoneDialog';
const [W_, H_] = (process.argv[5] || '390x844').split('x').map(Number);
const DESIGN = process.argv[6] || 'current';
const MODO = process.argv[7] || 'dark';
const DESIGN_ID = {current: null, neon: 'neon-tl', metal: 'metal-tl', pro: 'pro-tl', deep: 'deep-tl'}[DESIGN];
(async () => {
  const c = await launch({w: W_, h: H_, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  const resumo = [], detalhes = [];
  let totalVaz = 0, totalG = 0, falhasRolagemCartao = 0;
  try {
    const HOST = process.env.HOST || 'dialogo.html';
    const url = BASE + '/' + HOST + '?app=' + APP;
    await c.navigate(url); await sleep(300);
    await c.evaluate(DESIGN_ID ? `localStorage.setItem('agendaPersonalTL_design_v1', JSON.stringify({version:1,id:${JSON.stringify(DESIGN_ID)}}))` : `localStorage.removeItem('agendaPersonalTL_design_v1')`);
    await c.navigate(url);
    for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
    await sleep(2000);
    if (MODO === 'light' || MODO === 'dark') { await ev(`return W.AgendaAppearance.setMode(${JSON.stringify(MODO)})`); await sleep(700); }
    if (CSS) await ev(`const s=D.createElement('style');s.id='css-candidato';s.textContent=${JSON.stringify(CSS)};D.head.appendChild(s);`);
    const ids = LISTA === '*' ? await ev(`return [...D.querySelectorAll('.dialog')].map(d=>d.id)`) : LISTA.split(',');
    for (const id of ids) {
      await ev(`W.closeDialog && [...D.querySelectorAll('.dialog.open')].forEach(d=>W.closeDialog(d.id));`);
      await ev(`W.showScreen('more');`); await sleep(350);
      await ev(`W.scrollTo(0,400);`); await sleep(200);
      const antes = await ev(`return Math.round(W.scrollY)`);
      const realId = id === 'catalogo' ? 'workoutCatalogDialog' : id;
      await ev(id === 'catalogo' ? `W.openWorkoutCatalog();` : `W.openDialog(${JSON.stringify(realId)});`); await sleep(450);
      const durante = await ev(`return Math.round(W.scrollY)`);
      const g = await ev(`
        const d=D.getElementById(${JSON.stringify(realId)}), sh=d.querySelector('.sheet'), hd=d.querySelector('.sheet-head')||sh.firstElementChild;
        const b=e=>{const r=e.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom)}};
        return {open:d.classList.contains('open'), sheet:b(sh), head:b(hd), max:sh.scrollHeight-sh.clientHeight, vh:W.innerHeight};`);
      if (!g.open) { resumo.push(`${realId}: NÃO ABRIU`); continue; }
      const meas = async () => { const m = await ev(`const sh=D.getElementById(${JSON.stringify(realId)}).querySelector('.sheet');return {y:Math.round(W.scrollY),s:Math.round(sh.scrollTop)}`); m.y = m.y + 100000 * (await c.evaluate('Math.round(window.scrollY)')); return m; };
      const yBar = g.vh - 40; // faixa da barra Voltar/Painel (fica por cima)
      const pts = [];
      if (g.sheet.top > 24) pts.push(['fundo', 195, Math.max(6, Math.min(g.sheet.top - 10, 60))]);
      pts.push(['título', 150, Math.round((g.head.top + g.head.bottom) / 2)]);
      pts.push(['meio', 195, Math.round((Math.max(g.sheet.top, 0) + Math.min(g.sheet.bottom, g.vh - 90)) / 2)]);
      let vaz = 0, n = 0; const lin = [];
      for (const [nome, x, y] of pts) {
        for (const [dn, dy] of [['↓', 140], ['↑', -140], ['↓', 140]]) {
          const a = await meas(); await c.swipe(x, y, dy); const d = await meas(); n++;
          if (d.y !== a.y) { vaz++; lin.push(`${nome}${dn} ${a.y}→${d.y}`); }
        }
      }
      // limites do cartão rolável: no topo arrastando p/ baixo; no fim arrastando p/ cima
      let rolouCartao = 'n/a';
      if (g.max > 40) {
        await ev(`D.getElementById(${JSON.stringify(realId)}).querySelector('.sheet').scrollTop=0`); await sleep(150);
        let a = await meas(); await c.swipe(195, Math.round((g.sheet.top + g.sheet.bottom) / 2 + 60), 160); let d = await meas(); n++;
        if (d.y !== a.y) { vaz++; lin.push(`limite-topo↓ ${a.y}→${d.y}`); }
        await c.swipe(195, Math.round((g.sheet.top + g.sheet.bottom) / 2 + 60), -300); d = await meas();   // rola o cartão de verdade
        rolouCartao = (d.s > 100 || d.s >= g.max - 2) ? 'sim(' + d.s + '/' + g.max + ')' : 'NÃO(' + d.s + '/' + g.max + ')'; if (!(d.s > 100 || d.s >= g.max - 2)) falhasRolagemCartao++;
        await ev(`const sh=D.getElementById(${JSON.stringify(realId)}).querySelector('.sheet');sh.scrollTop=sh.scrollHeight`); await sleep(150);
        a = await meas(); await c.swipe(195, Math.round((g.sheet.top + g.sheet.bottom) / 2), -160); d = await meas(); n++;
        if (d.y !== a.y) { vaz++; lin.push(`limite-fim↑ ${a.y}→${d.y}`); }
      }
      await ev(`W.closeDialog(${JSON.stringify(realId)});`); await sleep(250);
      const depois = await ev(`return {y:Math.round(W.scrollY),cls:D.body.className}`);
      totalVaz += vaz; totalG += n;
      resumo.push(`${realId.padEnd(26)} top=${String(g.sheet.top).padStart(3)} h=${String(g.sheet.bottom - g.sheet.top).padStart(3)} rolável=${g.max > 40 ? 'sim' : 'não'} cartão-rola=${rolouCartao} vazou ${vaz}/${n}  abrir: ${antes}→${durante}${antes !== durante ? ' [PULOU]' : ''} fechar: ${antes}→${depois.y}${depois.cls.includes('dialog-open') ? ' [BODY AINDA dialog-open]' : ''}`);
      if (lin.length) detalhes.push('   ' + realId + ': ' + lin.join(' | '));
    }
    console.log(resumo.join('\n')); if (detalhes.length) console.log(detalhes.join('\n'));
    console.log(`TOTAL vazou ${totalVaz}/${totalG}; cartão-não-rolou ${falhasRolagemCartao}`);
    const errs = c.logs.filter(l => /ERRO-PAGINA/.test(l)); if (errs.length) console.log('ERROS', errs.slice(0, 3).join(' | '));
  } finally { c.close(); }
  process.exit(0);
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
