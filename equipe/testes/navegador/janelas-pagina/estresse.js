'use strict';
// Conteúdo longo nas janelas de página: com a janela cheia de coisas, dá para rolar até o fim e o último item fica livre da barra Voltar?
// Com toque de verdade: arrastar além do começo/fim não move a página de trás, e a janela não ganha rolagem lateral.
// uso: node estresse.js <pagina.html> [design] [modo] [LxA]      env JANELAS=id1,id2 (padrão: as 33 janelas de página)
const {launch, sleep, BASE} = require('./cdp.js');
const {paginas} = require('./classes.js');
const APP = process.argv[2] || 'prof-288.html';
const DESIGN = process.argv[3] || 'current', MODO = process.argv[4] || 'dark';
const [W_, H_] = (process.argv[5] || '390x844').split('x').map(Number);
const DESIGN_ID = {current: null, neon: 'neon-tl', metal: 'metal-tl', pro: 'pro-tl', deep: 'deep-tl'}[DESIGN];
const JANELAS = process.env.JANELAS ? process.env.JANELAS.split(',') : paginas;
// Folga mínima exigida entre o último item e a barra Voltar (ou o rodapé da tela, quando a barra some): 92px de espaço − 63px da barra = 29px
// (22px no Performance Pro). A régua é um pouco mais branda para absorver arredondamento.
const FOLGA_MIN = DESIGN === 'pro' ? 18 : 24;
(async () => {
  const c = await launch({w: W_, h: H_, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  const url = BASE + '/dialogo.html?app=' + APP;
  const linhas = []; let falhas = 0;
  try {
    await c.navigate(url); await sleep(300);
    await c.evaluate(DESIGN_ID ? `localStorage.setItem('agendaPersonalTL_design_v1', JSON.stringify({version:1,id:${JSON.stringify(DESIGN_ID)}}))` : `localStorage.removeItem('agendaPersonalTL_design_v1')`);
    await c.navigate(url);
    for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
    await sleep(1800);
    await ev(`return W.AgendaAppearance.setMode(${JSON.stringify(MODO)})`); await sleep(500);
    await ev(`W.showScreen('more');`); await sleep(300);
    const toque = await c.evaluate(`matchMedia('(hover:none),(pointer:coarse)').matches`);
    if (!toque) { console.log('FALHA: o aparelho emulado não tem toque'); process.exit(2); }
    for (const id of JANELAS) {
      await ev(`[...D.querySelectorAll('.dialog.open')].forEach(x=>W.closeDialog(x.id));W.scrollTo(0,0);`); await sleep(120);
      await ev(`W.openDialog(${JSON.stringify(id)});return 1`); await sleep(380);
      // 1) o que rola nessa janela: o cartão ou um filho dele (o de maior área com overflow-y auto/scroll)
      const prep = await ev(`
        const d=D.getElementById(${JSON.stringify(id)}), sh=d.querySelector(':scope>.sheet');
        const cand=[sh,...sh.querySelectorAll('*')].filter(e=>{const o=W.getComputedStyle(e).overflowY;return (o==='auto'||o==='scroll')&&e.clientHeight>0});
        cand.sort((a,b)=>b.clientHeight*b.clientWidth-a.clientHeight*a.clientWidth);
        const sc=cand[0]||sh;
        const antes={ch:sc.clientHeight,sh:sc.scrollHeight,filho:sc!==sh};
        const sub=D.createElement('div');sub.setAttribute('data-estresse','1');sub.style.cssText='height:2600px;flex:none;background:repeating-linear-gradient(0deg,#8884 0 1px,transparent 1px 40px)';
        const fim=D.createElement('button');fim.type='button';fim.id='__fim';fim.textContent='último item';fim.style.cssText='display:block;flex:none;width:100%;height:44px;margin:0';
        sc.appendChild(sub);sc.appendChild(fim);
        sc.setAttribute('data-estresse-rolagem','1');
        return {antes,sel:(sc===sh?'.sheet':sc.tagName.toLowerCase()+(sc.id?'#'+sc.id:'')+'.'+String(sc.className).trim().split(/\\s+/).slice(0,2).join('.'))};`);
      // 2) até o fim, com o dedo (arrasto para cima, várias vezes) e medir folga do último item
      const alvo = await ev(`const sc=D.querySelector('[data-estresse-rolagem]');const r=sc.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+Math.min(r.height-30,r.height*0.7)),h:Math.round(r.height)}`);
      const y0 = await ev(`return Math.round(W.scrollY)`);
      // um arrasto de verdade para provar que a janela rola com o dedo; depois pula direto para o fim (o Catálogo tem milhares de pixels)
      await c.swipe(alvo.x, Math.min(H_ - 120, alvo.y), -Math.min(560, alvo.h - 60));
      const rolouComODedo = await ev(`return Math.round(D.querySelector('[data-estresse-rolagem]').scrollTop)`);
      await ev(`const sc=D.querySelector('[data-estresse-rolagem]');sc.scrollTop=sc.scrollHeight;return 1`); await sleep(200);
      const fim = await ev(`const sc=D.querySelector('[data-estresse-rolagem]'),f=D.getElementById('__fim'),r=f.getBoundingClientRect(),bar=D.querySelector('.panel-return-bar'),barVis=!!bar&&W.getComputedStyle(bar).display!=='none'&&!bar.hidden;
        const topo=barVis?Math.round(bar.getBoundingClientRect().top):W.innerHeight;
        const cx=Math.round(r.left+r.width/2),cy=Math.round(r.top+r.height/2),el=D.elementFromPoint(cx,cy);
        return {fim:Math.round(sc.scrollTop+sc.clientHeight),total:sc.scrollHeight,noFim:Math.abs(sc.scrollHeight-sc.clientHeight-sc.scrollTop)<=2,bottom:Math.round(r.bottom),topo,barVis,folga:topo-Math.round(r.bottom),visivel:r.top>=0,tocavel:el===f,y:Math.round(W.scrollY)}`);
      // 3) arrastar para cima além do fim: nada se mexe atrás; arrastar para baixo até o começo e além: idem
      const antesLixo = await ev(`return Math.round(W.scrollY)`);
      await c.swipe(alvo.x, Math.min(H_ - 120, alvo.y), -420);
      const dFim = await ev(`return {y:Math.round(W.scrollY),trava:D.body.classList.contains('dialog-open')&&W.getComputedStyle(D.body).overflowY==='hidden'}`);
      await ev(`const sc=D.querySelector('[data-estresse-rolagem]');sc.scrollTop=0;return 1`); await sleep(200);
      await c.swipe(alvo.x, Math.min(H_ - 200, alvo.y), 400);
      const dTopo = await ev(`const sc=D.querySelector('[data-estresse-rolagem]');return {y:Math.round(W.scrollY),s:Math.round(sc.scrollTop)}`);
      const lateral = await ev(`const sc=D.querySelector('[data-estresse-rolagem]'),sh=D.getElementById(${JSON.stringify(id)}).querySelector(':scope>.sheet');return {sc:sc.scrollWidth-sc.clientWidth,sh:sh.scrollWidth-sh.clientWidth,doc:D.documentElement.scrollWidth-W.innerWidth}`);
      const erros = [];
      if (rolouComODedo < 30) erros.push('um arrasto não rolou a janela (' + rolouComODedo + 'px)');
      if (!fim.noFim) erros.push('não chegou ao fim (' + fim.fim + '/' + fim.total + ')');
      if (fim.folga < FOLGA_MIN) erros.push('último item a ' + fim.folga + 'px da barra (mín ' + FOLGA_MIN + ')');
      if (!fim.visivel) erros.push('último item fora da tela');
      if (!fim.tocavel) erros.push('último item coberto por outra coisa');
      if (fim.y !== y0 || dFim.y !== y0 || dTopo.y !== y0) erros.push(`página de trás andou ${y0}→${fim.y}/${dFim.y}/${dTopo.y}`);
      if (!dFim.trava) erros.push('corpo destravado');
      if (dTopo.s > 2) erros.push('não voltou ao começo (' + dTopo.s + ')');
      if (lateral.sc > 1 || lateral.sh > 1 || lateral.doc > 1) erros.push('rolagem lateral ' + JSON.stringify(lateral));
      if (erros.length) falhas++;
      linhas.push(`${erros.length ? 'FALHA' : 'OK   '} ${id.padEnd(30)} rola=${prep.sel.slice(0, 34).padEnd(34)} folga=${String(fim.folga).padStart(3)}px barra=${fim.barVis ? 'sim' : 'não'}${erros.length ? '  ← ' + erros.join('; ') : ''}`);
      await ev(`const e=D.querySelector('[data-estresse-rolagem]');if(e){e.removeAttribute('data-estresse-rolagem');D.querySelectorAll('[data-estresse]').forEach(x=>x.remove());const f=D.getElementById('__fim');f&&f.remove();}[...D.querySelectorAll('.dialog.open')].forEach(x=>W.closeDialog(x.id));`);
    }
    console.log(`# estresse: ${APP} · tema ${DESIGN} · ${MODO} · ${W_}x${H_} · folga mínima ${FOLGA_MIN}px · ${JANELAS.length} janelas`);
    console.log(linhas.join('\n'));
    console.log(falhas ? `\n${falhas} janela(s) com falha` : `\nas ${JANELAS.length} janelas: ok`);
    const errs = c.logs.filter(l => /ERRO-PAGINA/.test(l)); console.log(errs.length ? 'ERROS: ' + [...new Set(errs)].slice(0, 3).join(' | ') : 'sem erros de página');
    process.exitCode = falhas ? 1 : 0;
  } finally { c.close(); }
  process.exit(process.exitCode || 0);
})().catch(e => { console.log('FALHA', e.message, e.stack); process.exit(1); });
