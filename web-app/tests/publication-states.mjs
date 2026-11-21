// Exercise the production panel with the real signed release and WebCrypto. Only DOM, transport and account access are simulated.
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {signedFixture} from './publication-fixture.mjs';
const raw = await signedFixture(), signed = JSON.parse(raw), entries = new Map(), captures = {};
const remote = {available:true,version:signed.version,sequence:signed.sequence,sha256:createHash('sha256').update(raw).digest('hex'),size:raw.length,publishedAt:'2026-11-20T19:34:47Z'};
let mode='drop', available={...remote,version:'1.12.295',sequence:401}, calls=0, selected, lastTransferText, manifestChecks=0;
class Element {
  constructor(){this.children=[];this.dataset={};this.hidden=false;this.textContent='';}
  set id(id){entries.set(id,this);} set innerHTML(html){for(const m of html.matchAll(/\bid="([^"]+)"/g)) new Element().id=m[1];}
  append(node){this.children.push(node);} get childElementCount(){return this.children.length;}
  replaceChildren(){this.children=[];} removeAttribute(name){delete this[name];} focus(){} remove(){} click(){selected=true;}
}
const doc={getElementById:id=>entries.get(id),createElement:()=>new Element(),head:new Element(),body:new Element(),activeElement:new Element()};
const element = id=>entries.get(id), state = () => element('apPublishProgress').dataset.state;
class Reader {
  readAsArrayBuffer(file){this.onprogress({loaded:file.size,total:file.size,lengthComputable:true});this.result=file.data;this.onload();this.onloadend();} abort(){}
}
class Transport {
  constructor(){this.upload={};} open(method,url){assert.equal(url,'/api/publish');} setRequestHeader(){}
  send(bytes){
    assert.equal(bytes.byteLength,raw.length);calls++;
    this.upload.onprogress({lengthComputable:true,loaded:Math.ceil(bytes.byteLength/4),total:bytes.byteLength});
    if(mode==='drop'){this.onerror();return;}
    if(mode==='unknown'){this.upload.onprogress({lengthComputable:false,loaded:1,total:0});this.onerror();return;}
    this.upload.onload(); lastTransferText=element('apPublishProgressPercent').textContent;
    this.status=201;this.responseText=JSON.stringify({published:true,manifest:remote});this.onload();
  }
}
const platform={getPublishableUpdate:()=>raw.toString(),getUpdateStatus:()=>JSON.stringify({installedVersion:'1.12.294',installedSequence:400})};
const context={APaccounts:{isTeacher:()=>true,getPublicationToken:async()=>'teste'},APWebPlatform:platform,APupdates:{closePublisher:()=>true,canInstall:()=>false},
  document:doc,crypto:webcrypto,TextEncoder,TextDecoder,Blob,Uint8Array,ArrayBuffer,DataView,Intl,Date,atob,setTimeout,clearTimeout,XMLHttpRequest:Transport,FileReader:Reader,Event,AbortSignal,
  fetch:async(url,options)=>{assert.match(url,/^\/api\/manifest\?verify=\d+$/);assert.equal(options.cache,'no-store');manifestChecks++;return {ok:true,json:async()=>available};},addEventListener(){},dispatchEvent(){}};
context.window=context;vm.runInNewContext(await readFile(new URL('../web/publication-panel.js',import.meta.url),'utf8'),context);
function capture(name){const read=id=>element('apPublish'+id).textContent;captures[name]={stage:state(),title:read('ProgressTitle'),percent:read('ProgressPercent'),value:element('apPublishProgressBar').value??null,bytes:read('ProgressDetails'),eta:read('ProgressEta'),status:read('Status'),button:read('Send'),receipt:element('apPublishReceipt').children.map(n=>n.textContent)};}
function checkPanel(){assert.equal(context.APupdates.openPublisher(),true);element('apPublishNotes').value='';}
async function select(data){const file={size:data.length,data:new Uint8Array(data).buffer,name:'fixture.agenda.json'};await element('apPublishFile').onchange({target:{files:[file]}});}
const send=()=>element('apPublishSend').onclick();
checkPanel();await select(Buffer.from('{'));assert.equal(state(),'error');assert.match(element('apPublishStatus').textContent,/JSON válido/);await send();assert(selected);capture('arquivo-invalido');
const damaged={...signed,agendaSignature:(signed.agendaSignature[0]==='A'?'B':'A')+signed.agendaSignature.slice(1)};
await select(Buffer.from(JSON.stringify(damaged)));assert.equal(state(),'error');assert.match(element('apPublishStatus').textContent,/assinatura não corresponde/);assert.equal(calls,0);capture('assinatura-invalida');
await select(raw);assert.equal(state(),'ready');await send();assert.equal(state(),'error');assert.equal(element('apPublishProgressPercent').textContent,'25%');assert.equal(calls,1);capture('queda-25');
mode='unknown';await send();assert.equal(state(),'error');assert.equal(element('apPublishProgressBar').value,undefined);assert.equal(calls,2);capture('sem-total');
mode='success';await send();assert.equal(state(),'error');assert.equal(lastTransferText,'');assert.match(element('apPublishProgressTitle').textContent,/Confirmando/);assert.equal(calls,3);capture('manifesto-divergente');
available=remote;await send();assert.equal(state(),'done');assert.equal(element('apPublishProgressBar').value,100);assert.equal(calls,3);capture('recibo');
assert(captures.recibo.receipt.includes('Arquivo enviado: 1.12.298 · sequência 404'));
assert(captures.recibo.receipt.includes('Em uso neste aparelho: 1.12.294 · sequência 400'));
assert(captures.recibo.receipt.includes('Disponível no servidor: 1.12.298 · sequência 404'));
await select(raw);await send();assert.equal(state(),'done');assert.equal(calls,4);assert.equal(manifestChecks,5);
if(process.env.AGENDA_EVIDENCE){await mkdir(process.env.AGENDA_EVIDENCE,{recursive:true});await writeFile(process.env.AGENDA_EVIDENCE+'/estados.json',JSON.stringify(captures,null,2)+'\n');}
console.log('PASS: JSON inválido, assinatura incorreta, queda 25%, total desconhecido, manifesto divergente, retry sem duplicar, sucesso e recibo.');
