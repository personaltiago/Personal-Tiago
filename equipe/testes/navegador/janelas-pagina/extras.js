'use strict';
// Cenários extras na página REAL (janelas empilhadas, destravar ao fechar, rolagem interna, avisos, toques) com toque de verdade.
// uso: node extras.js <pagina.html> [design] [modo]
const {launch, sleep, BASE} = require('./cdp.js');
const {estado} = require('./semente.js');
const APP = process.argv[2] || 'prof-288.html';
const DESIGN = process.argv[3] || 'current', MODO = process.argv[4] || 'dark';
const DESIGN_ID = {current: null, neon: 'neon-tl', metal: 'metal-tl', pro: 'pro-tl', deep: 'deep-tl'}[DESIGN];
const FICHA = `W.showScreen('workouts');W.openWorkoutStudent('s1');W.selectWorkoutPlan('p1');`;
(async () => {
  const c = await launch({w: 390, h: 844, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  const url = BASE + '/dialogo.html?app=' + APP;
  const res = []; let falhas = 0;
  const check = (nome, cond, det) => { if (!cond) falhas++; res.push((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (det ? '  — ' + det : '')); };
  const y = () => ev(`return Math.round(W.scrollY)`);
  const sc = id => ev(`const sh=D.getElementById(${JSON.stringify(id)}).querySelector(':scope>.sheet');return Math.round(sh.scrollTop)`);
  const rect = id => ev(`const d=D.getElementById(${JSON.stringify(id)}),b=d.querySelector(':scope>.sheet').getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),right:Math.round(b.right),z:Number(W.getComputedStyle(d).zIndex),open:d.classList.contains('open')}`);
  const fechaTudo = async () => { await ev(`[...D.querySelectorAll('.dialog.open')].forEach(d=>W.closeDialog(d.id));`); await sleep(300); };
  const cheia = r => r.top === 0 && r.left === 0 && r.right === 390 && r.bottom === 844;
  try {
    await c.navigate(url); await sleep(300);
    await c.evaluate(`localStorage.setItem('agendaPersonalTL_v1', ${JSON.stringify(JSON.stringify(estado()))});` + (DESIGN_ID ? `localStorage.setItem('agendaPersonalTL_design_v1', JSON.stringify({version:1,id:${JSON.stringify(DESIGN_ID)}}))` : `localStorage.removeItem('agendaPersonalTL_design_v1')`));
    await c.navigate(url);
    for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
    await sleep(2200);
    await ev(`return W.AgendaAppearance.setMode(${JSON.stringify(MODO)})`); await sleep(500);
    res.push(`# tema ${DESIGN}, modo ${MODO}`);
    // 1) destrava ao fechar e devolve a página ao ponto de antes
    await ev(`W.showScreen('more');`); await sleep(400);
    await ev(`W.scrollTo(0,300)`); await sleep(250);
    const y0 = await y();
    await ev(`W.openDialog('studentDialog');`); await sleep(450);
    check('1a. janela de página aberta: página parada, corpo travado (dialog-open, overflow hidden) e janela em página inteira', await ev(`return D.body.classList.contains('dialog-open') && W.getComputedStyle(D.body).overflowY==='hidden'`) && cheia(await rect('studentDialog')));
    await ev(`W.closeDialog('studentDialog');`); await sleep(350);
    const y1 = await y();
    check('1b. fechada: destravou (sem dialog-open, sem overflow hidden) e a página voltou ao ponto de antes', await ev(`return !D.body.classList.contains('dialog-open') && W.getComputedStyle(D.body).overflowY!=='hidden'`) && y1 === y0, `scrollY ${y0}→${y1}`);
    await c.swipe(195, 600, -220); const y2 = await y();
    check('1c. fechada: arrastar o dedo na página volta a rolar', y2 > y1 + 100, y1 + '→' + y2);
    // 2) página sobre página: Perfil do aluno → editar WhatsApp
    await ev(`W.scrollTo(0,300)`); await sleep(200);
    await ev(`W.openStudentProfile('s1')`); await sleep(500);
    await ev(`W.openStudentPhoneEditor()`); await sleep(500);
    const top2 = await rect('studentPhoneDialog'), low2 = await rect('studentProfileDialog');
    check('2a. página sobre página: as duas em página inteira, a de cima com z-index maior', cheia(top2) && cheia(low2) && top2.z > low2.z, JSON.stringify({top: top2.z, low: low2.z}));
    const p0 = await y(), s0 = await sc('studentProfileDialog'); await c.swipe(195, 400, 160); await c.swipe(195, 400, -200);
    const p1 = await y(), s1 = await sc('studentProfileDialog');
    check('2b. arrastando na de cima, nem a página de trás nem a janela coberta se mexem', p0 === p1 && s0 === s1, `página ${p0}→${p1}, janela coberta ${s0}→${s1}`);
    await ev(`W.closeDialog('studentPhoneDialog');`); await sleep(350);
    check('2c. fechou só a de cima: o Perfil do aluno continua aberto e o corpo continua travado', await ev(`return D.getElementById('studentProfileDialog').classList.contains('open') && D.body.classList.contains('dialog-open') && W.getComputedStyle(D.body).overflowY==='hidden'`));
    await ev(`W.closeDialog('studentProfileDialog');`); await sleep(350);
    const y3 = await y();
    check('2d. fechou tudo: destravou e voltou ao ponto de antes', await ev(`return !D.body.classList.contains('dialog-open')`) && y3 === 300, 'scrollY=' + y3);
    // 3) página sobre janela mantida: Exercícios (treino em andamento) → Finalizar treino
    await fechaTudo();
    await ev(`${FICHA}W.eval("state.workoutDrafts={...state.workoutDrafts,'p1|d1':{active:true,sessionId:'sx1',startedAt:Date.now()-900000,values:{e1:{done:true,sets:'4',reps:'8',load:'40'}}}}");W.openWorkoutDay('d1');return 1`); await sleep(700);
    check('3-pre. treino em andamento semeado: Finalizar treino pode abrir', await ev(`return W.eval("workoutRunning(currentWorkoutPlan(),currentWorkoutDay())&&completedWorkoutExercises(currentWorkoutPlan(),currentWorkoutDay()).length===1")`));
    const dia0 = await rect('workoutDayDialog');
    await ev(`W.openWorkoutExecution();return 1`); await sleep(600);
    const exe = await rect('workoutExecutionDialog'), dia1 = await rect('workoutDayDialog');
    check('3a. Finalizar treino (página) por cima de Exercícios (mantida): página inteira e z-index maior; Exercícios não mudou de lugar', cheia(exe) && exe.z > dia1.z && JSON.stringify(dia0) === JSON.stringify(dia1), JSON.stringify({exe, dia0, dia1}));
    const q0 = await y(); await c.swipe(195, 420, 150); await c.swipe(195, 420, -150); const q1 = await y();
    check('3b. arrastando em Finalizar treino a página de trás não se mexe', q0 === q1, q0 + '→' + q1);
    await ev(`W.closeDialog('workoutExecutionDialog');`); await sleep(400);
    const dia2 = await rect('workoutDayDialog');
    check('3c. fechou Finalizar treino: Exercícios continua aberto, no mesmo lugar, e o corpo continua travado', dia2.open && JSON.stringify(dia2) === JSON.stringify(dia0) && await ev(`return W.getComputedStyle(D.body).overflowY==='hidden'`), JSON.stringify(dia2));
    await fechaTudo();
    // 4) janela mantida por cima de página: o vídeo (lightbox) sobre o Catálogo
    await ev(`${FICHA}W.openWorkoutCatalog();return 1`); await sleep(600);
    const cat = await rect('workoutCatalogDialog');
    await ev(`W.openDialog('workoutVideoDialog');return 1`); await sleep(500);
    const vid = await rect('workoutVideoDialog'), cat2 = await rect('workoutCatalogDialog');
    const fundoVideo = await ev(`return W.getComputedStyle(D.getElementById('workoutVideoDialog')).backgroundColor`);
    check('4a. Vídeo (mantido, em cartão) por cima do Catálogo (página): continua em cartão, acima, com o fundo escuro dele', cheia(cat) && cheia(cat2) && !cheia(vid) && vid.z > cat2.z && !/rgba?\(0, 0, 0, 0\)|transparent/.test(fundoVideo), JSON.stringify({vid, fundoVideo}));
    const v0 = await y(), cs0 = await sc('workoutCatalogDialog'); await c.swipe(195, 120, 150); await c.swipe(195, 120, -150);
    check('4b. arrastando no fundo do vídeo, nem a página de trás nem o Catálogo se mexem', v0 === await y() && cs0 === await sc('workoutCatalogDialog'));
    await fechaTudo();
    // 5) o aviso (toast) continua visível por cima da janela de página
    await ev(`W.showScreen('more');W.openDialog('studentDialog');return 1`); await sleep(450);
    await ev(`W.toast('Aviso de teste', 6000);return 1`); await sleep(500);
    const toast = await ev(`const t=D.getElementById('toast');t.style.pointerEvents='auto';const r=t.getBoundingClientRect(),cx=Math.round(r.left+r.width/2),cy=Math.round(r.top+r.height/2),top=D.elementFromPoint(cx,cy);const bar=D.querySelector('.panel-return-bar'),vis=bar&&W.getComputedStyle(bar).display!=='none';return {show:t.classList.contains('show'),op:W.getComputedStyle(t).opacity,coberto:!(top===t||t.contains(top)),bottom:Math.round(r.bottom),barTop:vis?Math.round(bar.getBoundingClientRect().top):null,topo:top?top.tagName+'#'+top.id+'.'+String(top.className).slice(0,30):null,pe:'ligado-so-no-teste'}`);
    check('5. o aviso aparece por cima da janela de página, sem ficar coberto nem atrás da barra', toast.show && toast.op === '1' && !toast.coberto && (toast.barTop === null || toast.bottom <= toast.barTop), JSON.stringify(toast));
    await fechaTudo();
    // 6) rolagem interna: painel de cores (filho com a rolagem) e Catálogo (cartão com a rolagem)
    await ev(`W.showScreen('more');W.openDialog('colorPanelDialog');return 1`); await sleep(500);
    const cp = await ev(`const s=D.querySelector('#colorPanelDialog .color-panel-scroll'); if(!s) return null; const r=s.getBoundingClientRect(); return {top:Math.round(r.top),h:Math.round(r.height),max:s.scrollHeight-s.clientHeight,y:Math.round(W.scrollY),s:Math.round(s.scrollTop)}`);
    if (!cp) check('6a. painel de cores: rolagem interna', false, 'não achei .color-panel-scroll');
    else {
      await c.swipe(195, cp.top + Math.round(cp.h / 2), -220);
      const af = await ev(`const s=D.querySelector('#colorPanelDialog .color-panel-scroll');return {s:Math.round(s.scrollTop),y:Math.round(W.scrollY)}`);
      check('6a. painel de cores (página): a rolagem interna funciona e o fundo não anda', af.s > cp.s + 50 && af.y === cp.y, `max=${cp.max} rolagem ${cp.s}→${af.s} fundo ${cp.y}→${af.y}`);
    }
    await fechaTudo();
    await ev(`${FICHA}W.openWorkoutCatalog();return 1`); await sleep(700);
    const cr = await ev(`const sh=D.querySelector('#workoutCatalogDialog>.sheet');return {max:sh.scrollHeight-sh.clientHeight,y:Math.round(W.scrollY),s:Math.round(sh.scrollTop)}`);
    await c.swipe(195, 500, -260);
    const cr2 = await ev(`const sh=D.querySelector('#workoutCatalogDialog>.sheet');return {s:Math.round(sh.scrollTop),y:Math.round(W.scrollY)}`);
    check('6b. Catálogo (página): o cartão rola com o dedo e o fundo não anda', cr.max < 80 || (cr2.s > cr.s + 80 && cr2.y === cr.y), `max=${cr.max} rolagem ${cr.s}→${cr2.s} fundo ${cr.y}→${cr2.y}`);
    await fechaTudo();
    // 7) toques: campo de texto, botão × e barra Voltar
    await ev(`W.showScreen('more');W.openDialog('studentDialog');return 1`); await sleep(450);
    const campo = await ev(`const e=D.getElementById('studentName')||D.querySelector('#studentDialog input[type=text],#studentDialog input:not([type])');const r=e.getBoundingClientRect();return {id:e.id,x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}`);
    await c.swipe(campo.x, campo.y, 0, {steps: 1}); await sleep(250);
    check('7a. toque no campo de texto da janela de página dá foco', await ev(`return D.activeElement&&D.activeElement.id===${JSON.stringify(campo.id)}`), JSON.stringify(campo));
    await ev(`D.activeElement&&D.activeElement.blur&&D.activeElement.blur();`);
    const xb = await ev(`const r=D.querySelector('#studentDialog .close').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}`);
    await c.swipe(xb.x, xb.y, 0, {steps: 1}); await sleep(450);
    check('7b. toque no × fecha a janela de página', await ev(`return !D.getElementById('studentDialog').classList.contains('open')`), JSON.stringify(xb));
    await ev(`W.openDialog('studentDialog');return 1`); await sleep(450);
    const vb = await ev(`const bar=D.querySelector('.panel-return-bar');if(!bar||W.getComputedStyle(bar).display==='none')return null;const b=bar.querySelector('button');const r=b.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),txt:b.textContent.trim().slice(0,20),el:b.contains(D.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+r.height/2)))}`);
    if (!vb) check('7c. barra Voltar sobre a janela de página', DESIGN === 'pro', 'a barra não aparece (esperado no Performance Pro)');
    else {
      await c.swipe(vb.x, vb.y, 0, {steps: 1}); await sleep(500);
      check('7c. toque no Voltar da barra (por cima da página) fecha a janela', vb.el && await ev(`return !D.querySelector('.dialog.open')`), JSON.stringify(vb));
    }
    await fechaTudo();
    console.log(res.join('\n'));
    console.log(falhas ? `\n${falhas} FALHA(S)` : '\ntodos os cenários extras passaram');
    const errs = c.logs.filter(l => /ERRO-PAGINA/.test(l)); console.log(errs.length ? 'ERROS: ' + [...new Set(errs)].slice(0, 3).join(' | ') : 'sem erros de página');
    process.exitCode = falhas ? 1 : 0;
  } finally { c.close(); }
  process.exit(process.exitCode || 0);
})().catch(e => { console.log('FALHA', e.message, e.stack); process.exit(1); });
