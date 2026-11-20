'use strict';
// Cenários extras com o CSS candidato: destrava ao fechar, janelas empilhadas, rolagem interna, toques, pai rolável.
const fs = require('node:fs');
const {launch, sleep, BASE, SAIDA} = require('./cdp.js');
const APP = process.argv[2] || 'prof-286.html';
const CSS = process.argv[3] && process.argv[3] !== '-' ? fs.readFileSync(process.argv[3], 'utf8') : '';
(async () => {
  const c = await launch({w: 390, h: 844, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  const url = BASE + '/dialogo.html?app=' + APP;
  const res = [];
  const check = (nome, cond, det) => { res.push((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (det ? '  — ' + det : '')); };
  try {
    await c.navigate(url);
    for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
    await sleep(2000);
    if (CSS) await ev(`const s=D.createElement('style');s.id='css-candidato';s.textContent=${JSON.stringify(CSS)};D.head.appendChild(s);`);
    const y = () => ev(`return Math.round(W.scrollY)`);
    const meas = id => ev(`const sh=D.getElementById(${JSON.stringify(id)}).querySelector('.sheet');return {y:Math.round(W.scrollY),s:Math.round(sh.scrollTop)}`);
    await ev(`W.showScreen('more');`); await sleep(400);
    // 1) destrava ao fechar: a página volta a rolar com o dedo
    await ev(`W.scrollTo(0,0)`); await sleep(200);
    await ev(`W.openWorkoutCatalog();`); await sleep(400);
    check('1a. com o Catálogo aberto o corpo está travado (overflow hidden)', await ev(`return W.getComputedStyle(D.body).overflowY`) === 'hidden');
    await ev(`W.closeDialog('workoutCatalogDialog');`); await sleep(300);
    check('1b. fechado: body sem dialog-open e sem trava', await ev(`return !D.body.classList.contains('dialog-open') && W.getComputedStyle(D.body).overflowY!=='hidden'`));
    const y0 = await y(); await c.swipe(195, 600, -220); const y1 = await y();
    check('1c. fechado: arrastar o dedo na página rola de novo', y1 > y0 + 100, y0 + '→' + y1);
    // 2) janelas empilhadas: Catálogo por cima de outra janela (como ao escolher exercício para o treino)
    await ev(`W.scrollTo(0,300)`); await sleep(200);
    await ev(`W.openDialog('workoutRestDialog');`); await sleep(300);
    await ev(`W.openWorkoutCatalog(true);`); await sleep(500);
    const geo = await ev(`const d=D.getElementById('workoutCatalogDialog'),b=d.querySelector('.sheet').getBoundingClientRect();return {top:Math.round(b.top),h:Math.round(b.height),z:W.getComputedStyle(d).zIndex,pz:W.getComputedStyle(D.getElementById('workoutRestDialog')).zIndex,stack:W.dialogStack?W.dialogStack.map(e=>e.id):null}`);
    check('2a. Catálogo empilhado: página inteira e por cima da outra janela', geo.top === 0 && geo.h === 844 && Number(geo.z) > Number(geo.pz), JSON.stringify(geo));
    const a = await meas('workoutCatalogDialog'); await c.swipe(195, 300, 150); const b = await meas('workoutCatalogDialog'); await c.swipe(195, 300, -150); const c2 = await meas('workoutCatalogDialog');
    check('2b. empilhado: o fundo não anda e o cartão rola', a.y === b.y && b.y === c2.y && (b.s !== a.s || c2.s !== b.s), JSON.stringify([a, b, c2]));
    await ev(`W.closeDialog('workoutCatalogDialog');`); await sleep(300);
    check('2c. fechou só o Catálogo: a outra janela continua aberta e o corpo continua travado', await ev(`return D.getElementById('workoutRestDialog').classList.contains('open') && D.body.classList.contains('dialog-open') && W.getComputedStyle(D.body).overflowY==='hidden'`));
    await ev(`W.closeDialog('workoutRestDialog');`); await sleep(300);
    const yy = await y();
    check('2d. fechou tudo: destravou e voltou para a posição de antes', yy === 300 && await ev(`return !D.body.classList.contains('dialog-open')`), 'scrollY=' + yy);
    // 3) rolagem interna do painel de cores (cartão com overflow hidden e rolagem em um filho)
    await ev(`W.openDialog('colorPanelDialog');`); await sleep(500);
    const cp = await ev(`const s=D.querySelector('#colorPanelDialog .color-panel-scroll'); if(!s) return null; const r=s.getBoundingClientRect(); return {top:Math.round(r.top),h:Math.round(r.height),max:s.scrollHeight-s.clientHeight,y:Math.round(W.scrollY)}`);
    if (!cp) check('3. painel de cores: rolagem interna', false, 'não achei .color-panel-scroll');
    else {
      const before = await ev(`return Math.round(D.querySelector('#colorPanelDialog .color-panel-scroll').scrollTop)`);
      await c.swipe(195, cp.top + Math.round(cp.h / 2), -200);
      const after = await ev(`return {s:Math.round(D.querySelector('#colorPanelDialog .color-panel-scroll').scrollTop), y:Math.round(W.scrollY)}`);
      check('3. painel de cores: a rolagem interna funciona e o fundo não anda', cp.max < 60 || (after.s > before + 50 && after.y === cp.y), `max=${cp.max} scroll ${before}→${after.s} fundo ${cp.y}→${after.y}`);
    }
    await ev(`W.closeDialog('colorPanelDialog');`); await sleep(300);
    // 4) toques: botão do Catálogo e campo de busca continuam respondendo
    await ev(`W.openWorkoutCatalog();`); await sleep(500);
    const fav = await ev(`const b=[...D.querySelectorAll('#workoutCatalogDialog button')].find(x=>/^\\s*Favoritos\\s*$/.test(x.textContent)); if(!b) return null; const r=b.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),cls:b.className,pr:b.getAttribute('aria-pressed')}`);
    if (!fav) check('4a. toque em Favoritos', false, 'botão não encontrado'); else {
      await c.swipe(fav.x, fav.y, 0, {steps: 1});
      const after = await ev(`const b=[...D.querySelectorAll('#workoutCatalogDialog button')].find(x=>/^\\s*Favoritos\\s*$/.test(x.textContent)); return {cls:b.className,pr:b.getAttribute('aria-pressed'),tab:W.workoutCatalogTab}`);
      check('4a. toque em Favoritos muda a aba do Catálogo', after.tab === 'favorites' || after.cls !== fav.cls || after.pr !== fav.pr, JSON.stringify({antes: fav, depois: after}));
    }
    const sx = await ev(`const r=D.getElementById('workoutCatalogSearch').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}`);
    await c.swipe(sx.x, sx.y, 0, {steps: 1}); await sleep(200);
    check('4b. toque no campo de busca dá foco', await ev(`return D.activeElement&&D.activeElement.id==='workoutCatalogSearch'`));
    await ev(`D.activeElement&&D.activeElement.blur&&D.activeElement.blur();W.closeDialog('workoutCatalogDialog');`); await sleep(300);
    console.log(res.join('\n'));
    const errs = c.logs.filter(l => /ERRO-PAGINA/.test(l)); console.log(errs.length ? 'ERROS: ' + errs.slice(0, 3).join(' | ') : 'sem erros de página');
  } finally { c.close(); }
  process.exit(0);
})().catch(e => { console.log('FALHA', e.message, e.stack); process.exit(1); });
