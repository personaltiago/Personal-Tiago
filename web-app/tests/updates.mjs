import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
const {createHandler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
class Bucket{
 map=new Map();counter=0;
 async get(key){const item=this.map.get(key);if(!item)return null;return {...item,body:item.bytes,async json(){return JSON.parse(new TextDecoder().decode(item.bytes))}};}
 async put(key,value,options={}){const current=this.map.get(key),condition=options.onlyIf;
  if(condition?.etagMatches&&current?.etag!==condition.etagMatches||condition instanceof Headers&&condition.get('If-None-Match')==='*'&&current)return null;
  const bytes=typeof value==='string'?new TextEncoder().encode(value):value,etag=String(++this.counter);this.map.set(key,{bytes,size:bytes.byteLength,etag,httpEtag:'"'+etag+'"'});return {etag};
 }
 async delete(key){this.map.delete(key)}
}
const teacher='R2EmnDVcvMWt7TjPxOP6DjW1VOn1',env={BUCKET:new Bucket()};let calls=0;
const api=createHandler(async(url,options)=>{calls++;assert.ok(url.startsWith('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='));const token=JSON.parse(options.body).idToken;return Response.json(token.startsWith('teacher')?{users:[{localId:teacher}]}:token.startsWith('student')?{users:[{localId:'student'}]}:token.startsWith('disabled')?{users:[{localId:teacher,disabled:true}]}:{error:'INVALID_ID_TOKEN'},{status:token.startsWith('invalid')?400:200});});
const url='https://updates.example.test',get=path=>new Request(url+path);
const bundle=sequence=>({format:1,appId:'com.tiagolima.agendapersonal',bridgeVersion:3,dataSchema:4,sequence,version:'1.11.'+sequence,files:Object.fromEntries(['index.html','professor.html','avaliacoes.html','cadastro.html'].map(name=>[name,'<html><head></head><body><script data-agenda-ready></script></body></html>']))});
const post=(content,token='teacher')=>new Request(url+'/api/publish',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token+'a'.repeat(40),'Origin':'https://appassets.androidplatform.net','X-Release-Notes':encodeURIComponent('Correções de séries e vídeo')},body:typeof content==='string'?content:JSON.stringify(content)});
assert.deepEqual(await (await api(get('/api/manifest'),env)).json(),{available:false});
assert.equal((await api(new Request(url+'/api/publish',{method:'POST'}),env)).status,401);assert.equal(calls,0);
assert.equal((await api(post(bundle(99),'student'),env)).status,403);assert.equal((await api(post(bundle(99),'invalid'),env)).status,401);assert.equal((await api(post(bundle(99),'disabled'),env)).status,403);assert.equal(env.BUCKET.map.size,0);
const bad=bundle(99);bad.files['../evil.html']='unsafe';assert.equal((await api(post(bad),env)).status,422);
const injected=bundle(99);injected.files['index.html']+='<script>window.__agendaNativeReleaseToken="snapshot"</script>';assert.equal((await api(post(injected),env)).status,422);
const result=await api(post(bundle(99)),env);assert.equal(result.status,201);assert.equal(result.headers.get('Access-Control-Allow-Origin'),'https://appassets.androidplatform.net');
const published=await result.json(),manifest=(await api(get('/api/manifest'),env));assert.equal(manifest.headers.get('Cache-Control'),'no-store');assert.equal((await manifest.json()).sequence,99);
const bytes=await (await api(get(published.manifest.bundlePath),env)).arrayBuffer();assert.equal(bytes.byteLength,published.manifest.size);
assert.equal(Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex'),published.manifest.sha256);
assert.equal((await (await api(post(bundle(99)),env)).json()).alreadyPublished,true);
const conflict=bundle(99);conflict.files['index.html']+='different';assert.equal((await api(post(conflict),env)).status,409);assert.equal((await api(post(bundle(98)),env)).status,422);
const race=await Promise.all([api(post(bundle(100)),env),api(post(bundle(101)),env)]);assert.ok(race.every(r=>[201,409].includes(r.status)));assert.equal((await (await api(get('/api/manifest'),env)).json()).sequence,101);
const preflight=await api(new Request(url+'/api/publish',{method:'OPTIONS',headers:{Origin:'https://appassets.androidplatform.net'}}),env);assert.equal(preflight.status,204);assert.ok(preflight.headers.get('Access-Control-Allow-Headers').includes('Authorization'));
assert.equal((await api(new Request(url+'/api/manifest',{headers:{Origin:'https://evil.test'}}),env)).headers.get('Access-Control-Allow-Origin'),null);
assert.equal((await api(post('x'.repeat(24*1024*1024+1)),env)).status,413);
console.log('PASS: teacher verification, denied student/disabled/invalid tokens, complete bundle, no native snapshots, size limits, atomic monotonic publication, duplicate retry, anonymous manifest/download, SHA-256 and Android CORS. Firebase/R2 simulated.');
