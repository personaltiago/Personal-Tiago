import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const source=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
const digest=async bytes=>Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
const originalSpec=JSON.parse(source.match(/^const HOSTED_RELEASE=(.*);$/m)[1]);
const bundle=(version,sequence,text='')=>({format:1,appId:'com.tiagolima.agendapersonal',bridgeVersion:3,dataSchema:4,version,sequence,files:Object.fromEntries(['index.html','professor.html','avaliacoes.html','cadastro.html'].map(name=>[name,'<html><head></head><body>'+text+'<script data-agenda-ready></script></body></html>']))});
let base=Buffer.from(JSON.stringify(bundle('1.12.111',217))),candidate=Buffer.from(JSON.stringify(bundle(originalSpec.manifest.version,originalSpec.manifest.sequence,'<button>Recado</button>'))),spec;
const integer=n=>{const b=Buffer.alloc(8);b.writeBigUInt64LE(BigInt(Math.abs(n)));if(n<0)b[7]|=128;return b};
if(process.env.AGENDA_HOSTED_BASE&&process.env.AGENDA_HOSTED_CANDIDATE){
 base=await readFile(process.env.AGENDA_HOSTED_BASE);candidate=await readFile(process.env.AGENDA_HOSTED_CANDIDATE);spec=originalSpec;
}else{
 const control=Buffer.concat([integer(base.length),integer(candidate.length-base.length),integer(0)]),diff=Buffer.alloc(base.length);
 for(let i=0;i<base.length;i++)diff[i]=(candidate[i]-base[i])&255;
 const extra=candidate.subarray(base.length);
 spec={manifest:{...originalSpec.manifest,size:candidate.length,sha256:await digest(candidate)},base:{...originalSpec.base,size:base.length,sha256:await digest(base)},patch:{controlBytes:control.length,diffBytes:diff.length,extraBytes:extra.length,gzip:gzipSync(Buffer.concat([control,diff,extra])).toString('base64')}};
}
const moduleSource=source.replace(/^const HOSTED_RELEASE=.*;$/m,()=> 'const HOSTED_RELEASE='+JSON.stringify(spec)+';');
const {createHandler}=await import('data:text/javascript;base64,'+Buffer.from(moduleSource).toString('base64'));
class Bucket{
 map=new Map();counter=0;writes=[];race=false;
 async get(key){const item=this.map.get(key);if(!item)return null;return {...item,body:item.bytes,async json(){return JSON.parse(new TextDecoder().decode(item.bytes))}}}
 async put(key,value,options={}){
  if(key==='release/current.json'&&this.race){this.race=false;this.seed(key,JSON.stringify({...spec.manifest,sequence:spec.manifest.sequence+1,version:'9.0.0'}))}
  const previous=this.map.get(key),condition=options.onlyIf;
  if(condition?.etagMatches&&condition.etagMatches!==previous?.etag||condition instanceof Headers&&condition.get('If-None-Match')==='*'&&previous)return null;
  this.writes.push(key);return this.seed(key,value);
 }
 seed(key,value){const bytes=typeof value==='string'?Buffer.from(value):value,etag=String(++this.counter);this.map.set(key,{bytes,size:bytes.byteLength,etag,httpEtag:'"'+etag+'"'});return {etag}}
 async delete(key){this.map.delete(key)}
}
let authCalls=0;
const api=createHandler(async(_,options)=>{authCalls++;const token=JSON.parse(options.body).idToken;return Response.json({users:[{localId:token.startsWith('teacher')?'R2EmnDVcvMWt7TjPxOP6DjW1VOn1':'student'}]})});
const origin='https://updates.example.test',get=p=>new Request(origin+p),head='release/current.json',targetKey='bundles/'+spec.manifest.bundlePath.split('/').pop()+'.json';
function environment(){const bucket=new Bucket();bucket.seed(spec.base.key,base);bucket.seed(head,JSON.stringify({...spec.manifest,version:'1.12.111',sequence:217}));bucket.seed('teacher-agenda/v1/private.json','private fixture');return {BUCKET:bucket}}
const env=environment(),manifest=await api(get('/api/manifest'),env);assert.equal(manifest.status,200);assert.deepEqual(await manifest.json(),spec.manifest);
assert.equal(manifest.headers.get('Cache-Control'),'no-store');assert.equal(env.BUCKET.map.get('teacher-agenda/v1/private.json').bytes.toString(),'private fixture');
const download=await api(get(spec.manifest.bundlePath),env),received=Buffer.from(await download.arrayBuffer());assert.equal(download.status,200);assert.equal(Number(download.headers.get('Content-Length')),candidate.length);assert.equal(await digest(received),spec.manifest.sha256);assert.deepEqual(received,candidate);
assert.deepEqual(env.BUCKET.writes,[targetKey,head]);await api(get('/api/manifest'),env);assert.equal(env.BUCKET.writes.length,2,'repeat check never republishes');
assert.equal((await api(new Request(origin+'/api/publish',{method:'POST'}),env)).status,401);assert.equal(authCalls,0,'deployment release does not weaken publisher authentication');
const submit=(content,token)=>new Request(origin+'/api/publish',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token+'a'.repeat(40)},body:JSON.stringify(content)});
assert.equal((await api(submit(bundle('9.0.0',spec.manifest.sequence+1),'student'),env)).status,403);
assert.equal((await api(submit(bundle('1.0.0',spec.manifest.sequence-1),'teacher'),env)).status,409);
assert.equal((await api(submit(bundle('9.0.0',spec.manifest.sequence+1),'teacher'),env)).status,201);
assert.equal((await (await api(get('/api/manifest'),env)).json()).sequence,spec.manifest.sequence+1,'a newer normal app publication remains current');
const missing=environment();missing.BUCKET.map.delete(spec.base.key);assert.equal((await (await api(get('/api/manifest'),missing)).json()).sequence,217);assert.deepEqual(missing.BUCKET.writes,[]);
const damaged=environment();damaged.BUCKET.seed(spec.base.key,Buffer.from('corrupt'));const log=console.error;console.error=()=>{};try{assert.equal((await (await api(get('/api/manifest'),damaged)).json()).sequence,217);assert.deepEqual(damaged.BUCKET.writes,[])}finally{console.error=log}
const race=environment();race.BUCKET.race=true;assert.equal((await (await api(get('/api/manifest'),race)).json()).sequence,spec.manifest.sequence+1,'conditional update preserves a concurrent newer release');
console.log('PASS: exact source-approved release and SHA-256 download; idempotent publication; account records untouched; authenticated normal publication; newer and concurrent releases preserved; missing/corrupt source safely retains previous release. '+(process.env.AGENDA_HOSTED_BASE?'Full delivered artifact exercised.':'Compact deterministic fixture exercised.'));
