'use strict';
// Paridade entre duas páginas REAIS (a anterior e a nova): estilo computado + geometria de todas as janelas abertas, 5 temas × claro/escuro.
// uso: node paridade.js <pagina-antes.html> <pagina-depois.html> [LxA]
const {launch, sleep, BASE, SAIDA} = require('./cdp.js');
const A = process.argv[2], B = process.argv[3];
const [W_, H_] = (process.argv[4] || '390x844').split('x').map(Number);
const DESIGNS = [['current', null], ['neon', 'neon-tl'], ['metal', 'metal-tl'], ['pro', 'pro-tl'], ['deep', 'deep-tl']];
const SNAP = `
  const out={};
  for (const d of D.querySelectorAll('.dialog')) {
    [...D.querySelectorAll('.dialog.open')].forEach(x=>W.closeDialog(x.id));
    W.openDialog(d.id);
    const sh=d.querySelector(':scope>.sheet'), head=sh.querySelector('.sheet-head')||sh.firstElementChild, cl=sh.querySelector('.close'), fld=sh.querySelector('input,select,textarea,button:not(.close)');
    const rec={};
    const grab=(nome,el)=>{ if(!el) return; const cs=W.getComputedStyle(el), o={}; for (let i=0;i<cs.length;i++){const p=cs[i]; o[p]=cs.getPropertyValue(p);} const r=el.getBoundingClientRect(); o['@rect']=[Math.round(r.left*10)/10,Math.round(r.top*10)/10,Math.round(r.width*10)/10,Math.round(r.height*10)/10].join(','); rec[nome]=o; };
    grab('dialog',d); grab('sheet',sh); grab('head',head); grab('close',cl); grab('campo',fld);
    const bar=D.querySelector('.panel-return-bar'); grab('barra',bar); grab('topbar',D.querySelector('.topbar')); grab('main',D.querySelector('main'));
    out[d.id]=rec;
    W.closeDialog(d.id);
  }
  return out;`;
(async () => {
  const c = await launch({w: W_, h: H_, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  const snapshot = async (app, id, modo) => {
    const url = BASE + '/dialogo.html?app=' + app;
    await c.navigate(url); await sleep(200);
    await c.evaluate(id ? `localStorage.setItem('agendaPersonalTL_design_v1', JSON.stringify({version:1,id:${JSON.stringify(id)}}))` : `localStorage.removeItem('agendaPersonalTL_design_v1')`);
    await c.navigate(url);
    for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
    await sleep(1800);
    await ev(`return W.AgendaAppearance.setMode(${JSON.stringify(modo)})`); await sleep(500);
    await ev(`W.showScreen('more');`); await sleep(300);
    return ev(SNAP);
  };
  const difs = new Map();
  try {
    for (const [nome, id] of DESIGNS) for (const modo of ['dark', 'light']) {
      const antes = await snapshot(A, id, modo), depois = await snapshot(B, id, modo), cfg = nome + '/' + modo;
      for (const idd of Object.keys(antes)) for (const el of Object.keys(antes[idd])) {
        const a = antes[idd][el], b = (depois[idd] || {})[el] || {};
        for (const p of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[p] !== b[p]) {
          const k = `${idd}|${el}|${p}`; if (!difs.has(k)) difs.set(k, {cfgs: new Set(), ex: `${String(a[p]).slice(0, 40)} → ${String(b[p]).slice(0, 40)}`}); difs.get(k).cfgs.add(cfg);
        }
      }
      process.stdout.write(cfg + ' ok; ');
    }
    console.log('\n--- diferenças (janela|elemento|propriedade) ---');
    const porJanela = new Map();
    for (const [k, v] of difs) { const [idd, el, p] = k.split('|'); const g = porJanela.get(idd) || []; g.push(`${el}.${p} [${v.cfgs.size}/10] ${v.ex}`); porJanela.set(idd, g); }
    const soOverscroll = [], outras = [];
    for (const [idd, lst] of porJanela) { if (lst.every(x => /overscroll-behavior/.test(x))) soOverscroll.push(idd); else outras.push([idd, lst]); }
    const totalJanelas = 38;
    console.log(`Janelas cuja ÚNICA diferença é overscroll-behavior: ${soOverscroll.length}; sem nenhuma diferença: ${totalJanelas - porJanela.size}`);
    for (const [idd, lst] of outras) { console.log(idd + ': ' + lst.filter(x => !/overscroll-behavior/.test(x)).length + ' propriedades'); for (const x of lst.filter(x => !/overscroll-behavior/.test(x))) console.log('   ' + x); }
    const fora = [...difs.keys()].filter(k => /^(workoutCatalogDialog)\|/.test(k) === false && !/\|(dialog|sheet|head|close|campo)\|overscroll-behavior/.test(k));
    console.log('Diferenças fora do Catálogo que não são overscroll-behavior das janelas:', fora.length ? fora.join('; ') : 'nenhuma');
  } finally { c.close(); }
  process.exit(0);
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
