'use strict';
// Paisagem com recorte de tela (notch): confere se o conteúdo das janelas-página invade a área do recorte.
// uso: node paisagem.js <pagina.html> <css|-> [LxA] [esq,dir,topo,base] [design] [modo]
const fs = require('node:fs');
const {launch, sleep, BASE, SAIDA} = require('./cdp.js');
const APP = process.argv[2], CSS = process.argv[3] && process.argv[3] !== '-' ? fs.readFileSync(process.argv[3], 'utf8') : '';
const [W_, H_] = (process.argv[4] || '844x390').split('x').map(Number);
const [L, R, T, B] = (process.argv[5] || '47,47,0,21').split(',').map(Number);
const DESIGN = process.argv[6] || 'current', MODO = process.argv[7] || 'dark';
const DESIGN_ID = {current: null, neon: 'neon-tl', metal: 'metal-tl', pro: 'pro-tl', deep: 'deep-tl'}[DESIGN];
const JANELAS = (process.env.JANELAS || 'studentDialog,workoutCatalogDialog,studentPhoneDialog,colorPanelDialog,workoutPlanDialog,lessonDialog,financeReceiptDialog,workoutRestDialog,workoutDayDialog').split(',');
(async () => {
  const c = await launch({w: W_, h: H_, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  try {
    let r = await c.send('Emulation.setSafeAreaInsetsOverride', {insets: {left: L, right: R, top: T, bottom: B}}).catch(e => ({erro: e.message}));
    if (r && r.erro) console.log('setSafeAreaInsetsOverride não disponível:', r.erro);
    const url = BASE + '/dialogo.html?app=' + APP;
    await c.navigate(url); await sleep(300);
    await c.evaluate(DESIGN_ID ? `localStorage.setItem('agendaPersonalTL_design_v1', JSON.stringify({version:1,id:${JSON.stringify(DESIGN_ID)}}))` : `localStorage.removeItem('agendaPersonalTL_design_v1')`);
    await c.navigate(url);
    for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
    await sleep(1800);
    await ev(`return W.AgendaAppearance.setMode(${JSON.stringify(MODO)})`); await sleep(600);
    if (CSS) await ev(`const s=D.createElement('style');s.id='css-candidato';s.textContent=${JSON.stringify(CSS)};D.head.appendChild(s);`);
    const insets = await ev(`const p=D.createElement('div');p.style.cssText='position:fixed;left:env(safe-area-inset-left);top:env(safe-area-inset-top);right:env(safe-area-inset-right);bottom:env(safe-area-inset-bottom);visibility:hidden';D.body.appendChild(p);const b=p.getBoundingClientRect();const o={left:Math.round(b.left),top:Math.round(b.top),right:Math.round(W.innerWidth-b.right),bottom:Math.round(W.innerHeight-b.bottom)};p.remove();return o`);
    console.log('insets vistos pela página:', JSON.stringify(insets), ' tela', W_ + 'x' + H_);
    for (const id of JANELAS) {
      await ev(`[...D.querySelectorAll('.dialog.open')].forEach(d=>W.closeDialog(d.id));W.showScreen('more');`); await sleep(200);
      await ev(`W.openDialog(${JSON.stringify(id)});`); await sleep(350);
      const m = await ev(`
        const d=D.getElementById(${JSON.stringify(id)}), sh=d.querySelector(':scope>.sheet'), b=sh.getBoundingClientRect(), cs=W.getComputedStyle(sh);
        // elementos visíveis com texto/controle: menor x e maior x ocupados por conteúdo
        let minX=1e9,maxX=-1e9,n=0, culprit='';
        for(const e of sh.querySelectorAll('h1,h2,h3,h4,p,label,span,button,input,select,textarea,a,strong,small,li')){
          const r=e.getBoundingClientRect(); if(r.width<2||r.height<2) continue; const st=W.getComputedStyle(e); if(st.visibility==='hidden'||st.display==='none') continue;
          if(r.bottom<0||r.top>W.innerHeight) continue; n++;
          if(r.left<minX){minX=r.left;culprit=e.tagName+'#'+(e.id||'')+'.'+(e.className&&e.className.baseVal===undefined?String(e.className).slice(0,30):'')}
          if(r.right>maxX) maxX=r.right;
        }
        return {sheet:[Math.round(b.left),Math.round(b.right)],padL:cs.paddingLeft,padR:cs.paddingRight,minX:Math.round(minX),maxX:Math.round(maxX),vw:W.innerWidth,n,culprit,dialogPad:W.getComputedStyle(d).padding};`);
      const invade = m.minX < L || m.maxX > m.vw - R;
      console.log(`${id.padEnd(24)} cartão x=${m.sheet[0]}..${m.sheet[1]} padL=${m.padL} padR=${m.padR} conteúdo x=${m.minX}..${m.maxX} (zona segura ${L}..${m.vw - R}) ${invade ? '<<< INVADE O RECORTE' : 'ok'} [${m.culprit.slice(0, 50)}] dialogPad=${m.dialogPad}`);
      if (process.env.SHOT) { fs.mkdirSync(SAIDA + '/p', {recursive: true}); await c.shot(`${SAIDA}/p/${process.env.SHOT}-${id}.png`); }
    }
    const errs = c.logs.filter(l => /ERRO-PAGINA/.test(l)); if (errs.length) console.log('ERROS', errs.slice(0, 3).join(' | '));
  } finally { c.close(); }
  process.exit(0);
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
