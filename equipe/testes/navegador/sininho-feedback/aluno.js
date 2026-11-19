'use strict';
// Biblioteca dos testes do sino do feedback (1.12.292): abre a página do aluno verdadeira no Chrome (a de dentro do pacote, sem Firebase
// e sem a casca do aplicativo), com o executor de DevTools do teste das janelas (../janelas-pagina/cdp.js).
const fs = require('node:fs'), path = require('node:path');
const {launch, sleep, BASE, SAIDA} = require('../janelas-pagina/cdp.js');
const PAGINA = fs.readFileSync(path.join(__dirname, 'pagina.js'), 'utf8');
// Se o teste parar no meio (erro ou PARAR=1), nenhum Chrome fica aberto para trás.
const abertos = new Set();
process.on('exit', () => { for (const c of abertos) { try { c.close(); } catch (e) {} } });

// Abre `pagina` (arquivo servido pelo servidor.py), espera o aplicativo do aluno ficar pronto e instala window.__t (pagina.js).
// `antes`: código executado em todo documento novo, antes de qualquer script da página.
async function abrir(pagina, {w = 390, h = 844, dpr = 2, antes = ''} = {}) {
  const c = await launch({w, h, dpr});
  abertos.add(c);
  const fechar = c.close;
  c.close = () => { abertos.delete(c); fechar(); };
  if (antes) await c.send('Page.addScriptToEvaluateOnNewDocument', {source: antes});
  await c.navigate(BASE + '/' + pagina);
  let pronto = false;
  for (let i = 0; i < 120 && !pronto; i++) {
    pronto = await c.evaluate("document.readyState==='complete'&&typeof route==='function'&&typeof APFeedbackModel==='object'").catch(() => false);
    if (!pronto) await sleep(150);
  }
  if (!pronto) { c.close(); throw new Error('A página do aluno não ficou pronta: ' + pagina); }
  await c.evaluate(PAGINA);
  // Chama window.__t.<função>(...argumentos) e devolve o resultado (JSON).
  c.t = async (fn, ...args) => {
    const v = await c.evaluate('JSON.stringify(window.__t.' + fn + '(' + args.map(a => JSON.stringify(a)).join(',') + '))');
    return v === undefined ? undefined : JSON.parse(v);
  };
  c.viewport = async (largura, altura, escala = 2) => {
    await c.send('Emulation.setDeviceMetricsOverride', {width: largura, height: altura, deviceScaleFactor: escala, mobile: true});
    await sleep(250);
  };
  // Toque de verdade (DevTools) no centro do elemento `seletor`.
  c.tocar = async seletor => {
    const p = JSON.parse(await c.evaluate("(()=>{const e=document.querySelector(" + JSON.stringify(seletor) + ");if(!e)return 'null';const b=e.getBoundingClientRect();return JSON.stringify({x:b.left+b.width/2,y:b.top+b.height/2})})()"));
    if (!p) throw new Error('Elemento não encontrado para tocar: ' + seletor);
    await c.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [p]});
    await sleep(60);
    await c.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await sleep(350);
    return p;
  };
  // Grava a imagem e, ao lado, um .json com onde o topo da tela estava (para a montagem recortar sem número chutado).
  c.captura = async nome => {
    fs.mkdirSync(SAIDA, {recursive: true});
    await c.shot(path.join(SAIDA, nome));
    try { const m = await c.t('medir'); fs.writeFileSync(path.join(SAIDA, nome.replace(/\.png$/, '.json')), JSON.stringify({largura: m.largura, topo: m.topo, h1: m.h1, acoes: m.acoes, diaria: m.diaria})); } catch (e) {}
  };
  return c;
}

// Entra como aluno, semeia o feedback e espera a página assentar.
async function cenario(c, entrada, semente) {
  await c.t('entrar', entrada || {});
  await sleep(Number(process.env.ESPERA_ENTRAR || 350));
  if (semente) { await c.t('semear', semente); await sleep(Number(process.env.ESPERA_SEMEAR || 200)); }
}

// Contador simples de verificações: cada uma imprime OK/FALHA e o resumo no fim.
function suite(nome) {
  let ok = 0, bad = 0;
  const t = (descricao, condicao, detalhe) => {
    if (condicao) { ok++; console.log('OK   ' + descricao); return true; }
    bad++;
    console.log('FALHA ' + descricao + (detalhe !== undefined ? ' -> ' + (typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe)) : ''));
    if (process.env.PARAR === '1') { console.log('(parado na primeira falha: PARAR=1)'); process.exit(1); } // usado por mutantes.cjs
    return false;
  };
  const fim = () => { console.log('\n' + nome + ': ' + ok + ' ok, ' + bad + ' com falha'); return bad; };
  return {t, fim, total: () => ok + bad};
}

const contraste = (a, b) => {
  const lum = hex => { const c = [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const rgbHex = css => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(css); return m ? '#' + [1, 2, 3].map(i => Number(m[i]).toString(16).padStart(2, '0')).join('') : null; };

module.exports = {abrir, cenario, suite, contraste, rgbHex, sleep, BASE, SAIDA};
