'use strict';
// Executa uma página de teste no Chrome de verdade (tempo real, com quadros de animação) via DevTools.
// uso: node cdp.js "<url>" [--shot arquivo.png] [--w 390] [--h 844] [--dpr 2] [--timeout 150] [--end RESUMO|SHOT]
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const args = process.argv.slice(2);
const url = args[0];
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const W = +opt('w', 390), H = +opt('h', 844), DPR = +opt('dpr', 1), TIMEOUT = +opt('timeout', 150) * 1000;
const shot = opt('shot', ''), END = opt('end', 'RESUMO');
const net = require('node:net');
// porta livre pedida ao sistema (evita que duas execuções em paralelo escolham a mesma porta e acabem na mesma janela)
const freePort = () => new Promise((resolve, reject) => { const s = net.createServer(); s.on('error', reject); s.listen(0, '127.0.0.1', () => { const {port} = s.address(); s.close(() => resolve(port)); }); });
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
let chrome = null, port = 0;
const getJson = u => new Promise((res, rej) => http.get(u, r => { let b = ''; r.on('data', d => b += d); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on('error', rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let done = false;
const finish = code => { if (done) return; done = true; try { chrome.kill('SIGKILL'); } catch (e) {} try { fs.rmSync(prof, {recursive: true, force: true}); } catch (e) {} process.exit(code); };
setTimeout(() => { console.log('TEMPO ESGOTADO sem ' + END); finish(2); }, TIMEOUT);

(async () => {
  port = await freePort();
  chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--remote-allow-origins=*',
    '--remote-debugging-port=' + port, '--user-data-dir=' + prof, '--window-size=' + W + ',' + H, 'about:blank'], {stdio: 'ignore'});
  let target = null;
  for (let i = 0; i < 100 && !target; i++) {
    try { target = (await getJson('http://127.0.0.1:' + port + '/json/list')).find(t => t.type === 'page'); } catch (e) {}
    if (!target) await sleep(100);
  }
  if (!target) { console.log('Chrome não abriu'); return finish(3); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, {res, rej}); ws.send(JSON.stringify({id: i, method, params})); });
  let bad = 0;
  ws.onmessage = async ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === 'Runtime.consoleAPICalled') {
      const text = m.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' ');
      if (text.startsWith('AUDIT ')) {
        console.log(text);
        if (/FALHA|EXCECAO/.test(text)) bad++;
        if (text.includes(END)) {
          if (shot) { await sleep(400); const r = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(shot, Buffer.from(r.data, 'base64')); }
          finish(bad ? 1 : 0);
        }
      }
    } else if (m.method === 'Runtime.exceptionThrown') {
      console.log('ERRO-PAGINA ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    }
  };
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: DPR, mobile: true});
  await send('Page.navigate', {url});
})().catch(e => { console.log('FALHA-CDP', e.message); finish(4); });
