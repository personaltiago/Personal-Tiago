'use strict';
// Pequena biblioteca de DevTools para testes no Chrome real (toque simulado de verdade).
const {spawn} = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), http = require('node:http'), net = require('node:net');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise((resolve, reject) => { const s = net.createServer(); s.on('error', reject); s.listen(0, '127.0.0.1', () => { const {port} = s.address(); s.close(() => resolve(port)); }); });
const getJson = u => new Promise((res, rej) => http.get(u, r => { let b = ''; r.on('data', d => b += d); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on('error', rej));
// mouse: true simula computador com mouse (ponteiro fino e com hover); o Chrome sem cabeça não tem ponteiro e responderia hover:none.
async function launch({w = 390, h = 844, dpr = 2, touch = true, mobile = touch, mouse = false} = {}) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
  const port = await freePort();
  const chrome = spawn(process.env.CHROME || 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--remote-allow-origins=*',
    '--remote-debugging-port=' + port, ...(mouse ? ['--blink-settings=primaryPointerType=4,primaryHoverType=2,availablePointerTypes=4,availableHoverTypes=2'] : []), '--user-data-dir=' + prof, '--window-size=' + w + ',' + h, 'about:blank'], {stdio: 'ignore'});
  let target = null;
  for (let i = 0; i < 100 && !target; i++) {
    try { target = (await getJson('http://127.0.0.1:' + port + '/json/list')).find(t => t.type === 'page'); } catch (e) {}
    if (!target) await sleep(100);
  }
  if (!target) { chrome.kill('SIGKILL'); throw new Error('Chrome não abriu'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pend = new Map(); const logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' '));
    else if (m.method === 'Runtime.exceptionThrown') logs.push('ERRO-PAGINA ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  };
  await new Promise(r => ws.onopen = r);
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, {res, rej}); ws.send(JSON.stringify({id: i, method, params})); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {width: w, height: h, deviceScaleFactor: dpr, mobile});
  if (touch) await send('Emulation.setTouchEmulationEnabled', {enabled: true, maxTouchPoints: 5});
  const evaluate = async (expression, awaitPromise = true) => {
    const r = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise});
    if (r.exceptionDetails) throw new Error('avaliação falhou: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  // gesto de rolagem por toque de verdade (DevTools Input.dispatchTouchEvent): o dedo sai de (x, y) e anda dy pixels.
  // dy < 0: dedo sobe (a lista anda para baixo); dy > 0: dedo desce. Para antes de soltar, para não ter inércia.
  const swipe = async (x, y, dy, {steps = 14, stepMs = 16} = {}) => {
    await send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
    for (let i = 1; i <= steps; i++) { await send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y + dy * i / steps}]}); await sleep(stepMs); }
    await sleep(180);
    await send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await sleep(450);
  };
  const shot = async file => { const r = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); };
  const close = () => { try { ws.close(); } catch (e) {} try { chrome.kill('SIGKILL'); } catch (e) {} try { fs.rmSync(prof, {recursive: true, force: true}); } catch (e) {} };
  return {send, evaluate, swipe, shot, close, logs, navigate: url => send('Page.navigate', {url}), sleep};
}
// Endereço do servidor local (servidor.py) e pasta das capturas: mudam com PORTA e SAIDA.
const BASE = 'http://127.0.0.1:' + (process.env.PORTA || 8787);
const SAIDA = path.resolve(process.env.SAIDA || 'saida');
module.exports = {launch, sleep, BASE, SAIDA};
