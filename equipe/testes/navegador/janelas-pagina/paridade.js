'use strict';
// Paridade entre duas páginas REAIS (a anterior e a nova): estilo computado + geometria de todas as janelas abertas, 5 temas × claro/escuro.
// uso: node paridade.js <pagina-antes.html> <pagina-depois.html> [LxA]      (env TOQUE=0: aparelho sem toque, como o computador com mouse)
// env IGNORAR=<regex de nome de propriedade>: propriedades que de propósito mudam em todas as janelas e não alteram o desenho
//   (a contenção da rolagem, 'overscroll-behavior'); são contadas à parte, nunca somem do relatório.
// Esperado para o 1.12.288:
//  - contra o 1.12.287, com toque: as 5 janelas mantidas e o Catálogo: nenhuma diferença; as outras 32 de página: só tamanho, borda, canto,
//    sombra e espaço do cartão (e a geometria que decorre disso); cores, fundos, fontes e o resto da página (barra, topo, corpo): nenhuma;
//  - contra o 1.12.286 (a versão em uso), sem toque (mouse), IGNORAR='^overscroll-behavior': nenhuma diferença em nenhuma das 38 janelas
//    (o 1.12.287 já mudava o Catálogo também para mouse; o 288 não, por isso o mouse se compara com o 286);
//  - contra o 1.12.286, com toque, IGNORAR='^overscroll-behavior': as 5 mantidas sem diferença.
const {launch, sleep, BASE} = require('./cdp.js');
const {paginas, fora} = require('./classes.js');
const A = process.argv[2], B = process.argv[3];
const [W_, H_] = (process.argv[4] || '390x844').split('x').map(Number);
const TOQUE = process.env.TOQUE !== '0';
const IGNORAR = process.env.IGNORAR ? new RegExp(process.env.IGNORAR) : null;
const ignoradas = new Map();
const DESIGNS = [['current', null], ['neon', 'neon-tl'], ['metal', 'metal-tl'], ['pro', 'pro-tl'], ['deep', 'deep-tl']];
const SNAP = `
  const out={};
  for (const d of D.querySelectorAll('.dialog')) {
    [...D.querySelectorAll('.dialog.open')].forEach(x=>W.closeDialog(x.id));
    W.openDialog(d.id);
    const sh=d.querySelector(':scope>.sheet'), head=sh.querySelector('.sheet-head,.color-panel-header')||sh.firstElementChild, cl=sh.querySelector('.close'), fld=sh.querySelector('input,select,textarea,button:not(.close)');
    const rec={};
    const grab=(nome,el)=>{ if(!el) return; const cs=W.getComputedStyle(el), o={}; for (let i=0;i<cs.length;i++){const p=cs[i]; o[p]=cs.getPropertyValue(p);} const r=el.getBoundingClientRect(); o['@rect']=[Math.round(r.left*10)/10,Math.round(r.top*10)/10,Math.round(r.width*10)/10,Math.round(r.height*10)/10].join(','); rec[nome]=o; };
    grab('dialog',d); grab('sheet',sh); grab('head',head); grab('close',cl); grab('campo',fld);
    const bar=D.querySelector('.panel-return-bar'); grab('barra',bar); grab('topbar',D.querySelector('.topbar')); grab('main',D.querySelector('main'));
    out[d.id]=rec;
    W.closeDialog(d.id);
  }
  return out;`;
// O que pode mudar nas janelas de página (o resto, principalmente cor, fundo, fonte, é proibido)
const GEOM = /^(width|height|inline-size|block-size|min-width|min-height|perspective-origin|transform-origin|@rect)$/;
const PERMITIDO = {
  sheet: /^(width|max-width|height|max-height|min-height|inline-size|block-size|max-inline-size|max-block-size|border-(top|right|bottom|left)-width|border-(block|inline)-(start|end)-width|border-(top|bottom)-(left|right)-radius|border-(start|end)-(start|end)-radius|box-shadow|padding-(top|bottom|block-start|block-end)|perspective-origin|transform-origin|@rect)$/,
  dialog: /^(padding-(top|bottom|left|right|block-start|block-end|inline-start|inline-end)|perspective-origin|transform-origin|@rect)$/,
  head: GEOM, close: GEOM, campo: GEOM, barra: /^$/, topbar: /^$/, main: /^$/
};
(async () => {
  const c = await launch({w: W_, h: H_, dpr: 2, touch: TOQUE, mobile: TOQUE, mouse: !TOQUE});
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
  let janelas = 0;
  try {
    const toque = await c.evaluate(`matchMedia('(hover:none),(pointer:coarse)').matches`);
    console.log(`aparelho: ${TOQUE ? 'com toque' : 'sem toque'}; (hover:none),(pointer:coarse) = ${toque}; tela ${W_}x${H_}`);
    if (toque !== TOQUE) { console.log('FALHA: o aparelho emulado não é o pedido'); process.exit(2); }
    for (const [nome, id] of DESIGNS) for (const modo of ['dark', 'light']) {
      const antes = await snapshot(A, id, modo), depois = await snapshot(B, id, modo), cfg = nome + '/' + modo;
      janelas = Object.keys(antes).length;
      for (const idd of Object.keys(antes)) for (const el of Object.keys(antes[idd])) {
        const a = antes[idd][el], b = (depois[idd] || {})[el] || {};
        for (const p of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[p] !== b[p]) {
          if (IGNORAR && IGNORAR.test(p)) { const kk = el + '.' + p; ignoradas.set(kk, (ignoradas.get(kk) || 0) + 1); continue; }
          const k = `${idd}|${el}|${p}`; if (!difs.has(k)) difs.set(k, {cfgs: new Set(), ex: `${String(a[p]).slice(0, 44)} → ${String(b[p]).slice(0, 44)}`}); difs.get(k).cfgs.add(cfg);
        }
      }
      process.stdout.write(cfg + ' ok; ');
    }
    console.log(`\n${janelas} janelas comparadas em 10 configurações (5 temas × claro/escuro)`);
    const porJanela = new Map();
    for (const [k, v] of difs) { const [idd, el, p] = k.split('|'); const g = porJanela.get(idd) || []; g.push({el, p, n: v.cfgs.size, ex: v.ex}); porJanela.set(idd, g); }
    let proibidas = 0;
    const semDif = [], soPermitidas = [];
    for (const id of [...paginas, ...fora]) {
      const lst = porJanela.get(id) || [];
      if (!lst.length) { semDif.push(id); continue; }
      const ruins = fora.includes(id) || !TOQUE ? lst : lst.filter(x => !(PERMITIDO[x.el] || /^$/).test(x.p));
      if (ruins.length) { proibidas += ruins.length; console.log(`${fora.includes(id) ? 'MANTIDA' : 'PÁGINA '} ${id}: ${ruins.length} diferença(s) proibida(s)`); for (const x of ruins.slice(0, 12)) console.log(`     ${x.el}.${x.p} [${x.n}/10] ${x.ex}`); }
      else soPermitidas.push(id);
    }
    console.log(`\nsem nenhuma diferença: ${semDif.length} (${semDif.join(', ') || '—'})`);
    console.log(`só diferenças permitidas (tamanho/borda/canto/sombra/espaço do cartão e a geometria que decorre): ${soPermitidas.length}`);
    console.log(`diferenças PROIBIDAS (cor, fundo, fonte, janelas mantidas, barra/topo/corpo; ou qualquer uma sem toque): ${proibidas}`);
    // a lista das propriedades de cor/fundo que NÃO mudaram, para constar: conta quantas propriedades visuais foram comparadas
    const cores = [...difs.keys()].filter(k => /\|(background|color|border-[a-z]+-color|outline-color|fill|stroke|text-decoration-color|caret-color|accent-color)/.test(k.split('|').slice(2).join('|')));
    if (ignoradas.size) console.log(`ignoradas de propósito (IGNORAR=${process.env.IGNORAR}): ${[...ignoradas].map(([k, n]) => k + ' ×' + n).join('; ')}`);
    console.log(`diferenças em propriedades de cor/fundo: ${cores.length}${cores.length ? ' → ' + cores.slice(0, 8).join('; ') : ''}`);
    process.exitCode = proibidas || cores.length ? 1 : 0;
  } finally { c.close(); }
  process.exit(process.exitCode || 0);
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
