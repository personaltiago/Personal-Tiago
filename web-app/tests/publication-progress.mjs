import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {createHandler} from '../worker/index.js';

const require = createRequire(import.meta.url), {chromium} = require('playwright');
import {signedFixture} from './publication-fixture.mjs';
const raw = await signedFixture();
const signed = JSON.parse(raw), newer = {available:true, format:1, appId:signed.appId, bridgeVersion:3, dataSchema:4,
  version:signed.version, sequence:signed.sequence, size:raw.length, sha256:createHash('sha256').update(raw).digest('hex'),
  bundlePath:'/api/bundle/11111111-1111-4111-8111-111111111111',publishedAt:'2026-11-20T19:34:47Z'};
// A local fixture for the already active release. No published file or R2 bucket is changed.
const before = Buffer.from(JSON.stringify({...signed, version:'1.12.294', sequence:400}));
const older = {...newer, version:'1.12.294', sequence:400, size:before.length, sha256:createHash('sha256').update(before).digest('hex')};
let manifest = older;
const api = createHandler(), server = http.createServer(async(req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    if(url.pathname==='/api/manifest') {res.setHeader('Content-Type','application/json'); return res.end(JSON.stringify(manifest));}
    if(url.pathname===older.bundlePath) return res.end(manifest===older ? before : raw);
    const response = await api(new Request(url),{});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  } catch(error) {res.writeHead(500);res.end(error.message);}
});
await new Promise((resolve,reject) => { server.on('error',reject); server.listen(0,'127.0.0.1',resolve); });
const origin = 'http://127.0.0.1:'+server.address().port, browser = await chromium.launch({executablePath:process.env.AGENDA_CHROMIUM,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
  const context = await browser.newContext({viewport:{width:412,height:915},isMobile:true,serviceWorkers:'block'});
  await context.route('**/*', route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  const page = await context.newPage(); await page.goto(origin+'/app/');
  const frame = page.frameLocator('#agendaApp'), body = frame.locator('body');
  await frame.locator('#login').waitFor({state:'attached'});
  await body.evaluate(async () => {
    if(document.readyState==='loading') await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));
    window.APaccounts = {...APaccounts,isTeacher:()=>true,getPublicationToken:async()=>'fixture'};
    APupdates.openPublisher();
  });
  async function select(data) { await frame.locator('#apPublishFile').setInputFiles({name:'teste.agenda.json',mimeType:'application/json',buffer:data}); }
  async function state(expected) { await frame.locator(`#apPublishProgress[data-state="${expected}"]`).waitFor(); }
  async function capture(name) { if(process.env.AGENDA_EVIDENCE) { await mkdir(process.env.AGENDA_EVIDENCE,{recursive:true});await page.screenshot({path:process.env.AGENDA_EVIDENCE+'/'+name+'.png'}); } }
  const text = id => frame.locator('#'+id).textContent();
  await select(Buffer.from('{')); await state('error'); assert.match(await text('apPublishStatus'),/JSON válido/); await capture('01-arquivo-invalido');
  console.log('PASS arquivo inválido: leitura informa erro, botão permite nova seleção');
  const damaged = JSON.parse(raw); damaged.agendaSignature=(damaged.agendaSignature[0]==='A'?'B':'A')+damaged.agendaSignature.slice(1);
  await select(Buffer.from(JSON.stringify(damaged))); await state('error'); assert.match(await text('apPublishStatus'),/assinatura não corresponde/); assert(!/100/.test(await text('apPublishProgressPercent'))); await capture('02-assinatura-invalida');
  console.log('PASS assinatura RSA inválida recusada antes do envio');
  await select(raw); await state('ready');
  await body.evaluate((_, expected) => {
    window.mode = 'drop'; window.calls = 0; window.stateAtEnd = '';
    class LocalTransport {
      constructor(){this.upload={};}
      open(){} setRequestHeader(){}
      send(bytes){
        window.calls++;
        this.upload.onprogress({lengthComputable:true,loaded:Math.ceil(bytes.byteLength/4),total:bytes.byteLength});
        if(mode==='drop'){this.onerror();return;}
        if(mode==='unknown'){this.upload.onprogress({lengthComputable:false,loaded:20,total:0});this.onerror();return;}
        this.upload.onload(); stateAtEnd=document.getElementById('apPublishProgressPercent').textContent;
        this.responseText=JSON.stringify({published:true,manifest:expected});this.status=201;this.onload();
      }
    }
    window.XMLHttpRequest=LocalTransport;
  },newer);
  const send = () => frame.locator('#apPublishSend').click();
  await send(); await state('error'); assert.equal(await text('apPublishProgressPercent'),'25%'); assert.match(await text('apPublishProgressTitle'),/Enviando/); assert.equal(await text('apPublishSend'),'Tentar de novo'); await capture('03-queda-25');
  console.log('PASS queda com 25%: medição preservada e etapa Enviando em erro');
  await body.evaluate(()=>{mode='unknown';}); await send(); await state('error'); assert.equal(await text('apPublishProgressPercent'),'');assert.equal(await frame.locator('#apPublishProgressBar').getAttribute('value'),null);
  console.log('PASS total desconhecido: barra indeterminada');
  await body.evaluate(()=>{mode='success';}); await send(); await state('error'); assert(!/100/.test(await text('apPublishProgressPercent'))); assert.match(await text('apPublishProgressTitle'),/Confirmando/); assert.match(await text('apPublishStatus'),/manifesto/);
  console.log('PASS envio completo com manifesto divergente: sem 100% ou recibo');
  const calls = await body.evaluate(()=>window.calls); manifest = newer;
  await send(); await state('done'); assert.equal(await text('apPublishProgressPercent'),'100%'); assert.equal(await body.evaluate(()=>window.stateAtEnd),''); assert.equal(await body.evaluate(()=>window.calls),calls);
  assert.match(await text('apPublishReceipt'),/Arquivo enviado: 1.12.298/); assert.match(await text('apPublishReceipt'),/Disponível no servidor: 1.12.298/); assert.match(await text('apPublishReceipt'),/Em uso neste aparelho: 1.12.294/); assert.match(await text('apPublishReceipt'),/Publicado: .*2026/);
  await frame.locator('#apPublishReceipt').scrollIntoViewIfNeeded(); await capture('04-confirmado-recibo');
  console.log('PASS nova tentativa com publicação confirmada: zero reenvios e recibo com três fontes');
  await frame.locator('#apPublishClose').click(); await body.evaluate(()=>APupdates.openPublisher()); await select(raw); await state('ready');
  await send(); await state('done');assert.equal(await body.evaluate(()=>window.calls),calls+1);
  console.log('PASS publicação completa confirmada por POST e GET sem cache');
} finally {await browser.close(); await new Promise(resolve=>server.close(resolve));}
