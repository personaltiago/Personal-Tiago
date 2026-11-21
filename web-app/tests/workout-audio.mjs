import assert from 'node:assert/strict';
import {createHandler} from '../worker/index.js';
const TEACHER='R2EmnDVcvMWt7TjPxOP6DjW1VOn1';
class Bucket{
 map=new Map();counter=0;
 async head(key){const v=this.map.get(key);return v?{...v,size:v.bytes.length}:null}
 async get(key,{range}={}){const v=await this.head(key);return v?{...v,body:new Blob([v.bytes.slice(range?.offset||0)]).stream(),arrayBuffer:async()=>v.bytes.slice(range?.offset||0).buffer}:null}
 async put(key,body,{onlyIf,customMetadata,httpMetadata}={}){const bytes=new Uint8Array(body),etag=await digest(bytes),old=this.map.get(key);if(onlyIf?.etagMatches&&old?.etag!==onlyIf.etagMatches||onlyIf instanceof Headers&&onlyIf.get('If-None-Match')==='*'&&old)return null;const v={bytes,etag,customMetadata,httpMetadata};this.map.set(key,v);return v}
}
const digest=async bytes=>Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
const env={BUCKET:new Bucket()};let active=true,owner=TEACHER,disabled=false;
const handler=createHandler(async(url,options)=>url.includes('accounts:lookup')?Response.json({users:[{localId:JSON.parse(options.body).idToken.startsWith('teacher')?TEACHER:'student-1',disabled}]}):Response.json({fields:{ativo:{booleanValue:active},perfil:{stringValue:'aluno'},professorId:{stringValue:owner}}}));
const origin='https://appassets.androidplatform.net',token=who=>'Bearer '+who+'a'.repeat(40);
const request=(path,{who='teacher',method='GET',body,headers={}}={})=>new Request('https://service.test'+path,{method,headers:{Authorization:token(who),Origin:origin,...headers},...(body!==undefined?{body}:{})});
const upload=(kind='rest',revision='upload_0000000000000001',base=null,bytes=new Uint8Array([82,73,70,70,1,2,3]),who='teacher',name='Descanso.wav')=>handler(request('/api/workout-audio/'+kind+'?'+new URLSearchParams({mutationId:revision,name,...(base?{baseRevision:base}:{})}),{method:'POST',who,body:bytes,headers:{'Content-Type':'audio/wav'}}),env);
const manifest=async(who='student')=>handler(request('/api/workout-audio',{who}),env);
assert.equal((await handler(new Request('https://service.test/api/workout-audio'),env)).status,401);
assert.equal((await upload('rest','upload_0000000000000001',null,undefined,'student')).status,403);
active=false;assert.equal((await manifest()).status,403);active=true;owner='another-teacher';assert.equal((await manifest()).status,403);owner=TEACHER;disabled=true;assert.equal((await manifest()).status,403);disabled=false;
assert.deepEqual((await(await manifest()).json()).sounds,{pause:null,rest:null,cardio:null});
for(const kind of ['lesson','timer','start','finish'])assert.equal((await upload(kind)).status,422);
let response=await upload();assert.equal(response.status,201);const first=(await response.json()).entry;assert.equal(first.kind,'rest');assert.equal(first.professorId,TEACHER);
assert.equal(first.sha256,await digest(new Uint8Array([82,73,70,70,1,2,3])));assert.equal(env.BUCKET.map.size,1);
assert.equal((await upload()).status,200,'idempotent retry');assert.equal((await upload('rest','upload_0000000000000001',null,new Uint8Array([3]))).status,409);
response=await manifest();assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal((await response.json()).sounds.rest.revision,first.revision);
const download=revision=>handler(request('/api/workout-audio/rest?revision='+revision,{who:'student'}),env);
response=await download(first.revision);assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'audio/wav');assert.equal(response.headers.get('Content-Length'),'7');assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[82,73,70,70,1,2,3],'private envelope is removed');
active=false;assert.equal((await download(first.revision)).status,403);active=true;
assert.equal((await upload('rest','upload_0000000000000002')).status,409,'stale writer cannot overwrite current file');
const parallel=await Promise.all(['2','3'].map(n=>upload('rest','upload_000000000000000'+n,first.revision)));assert.deepEqual(parallel.map(r=>r.status).sort(),[201,409]);
assert.equal(env.BUCKET.map.size,1,'overwrites do not accumulate old audio blobs');
const current=(await(await manifest('teacher')).json()).sounds.rest;
assert.equal((await download(first.revision)).status,409,'stale downloads cannot receive mismatched bytes');
assert.equal((await upload('rest','upload_0000000000000004',current.revision,new Uint8Array())).status,422);
assert.equal((await upload('rest','upload_0000000000000004',current.revision,new Uint8Array(8*1024*1024+1))).status,413);
const reset=()=>handler(request('/api/workout-audio/rest/default',{method:'POST',body:JSON.stringify({baseRevision:current.revision,mutationId:'default_000000000000001'}),headers:{'Content-Type':'application/json'}}),env);
response=await reset();assert.equal(response.status,201);assert.equal((await response.json()).entry.custom,false);assert.equal((await reset()).status,200);assert.equal(env.BUCKET.map.size,1);assert.equal((await download(current.revision)).status,409);
for(const kind of ['pause','cardio'])assert.equal((await upload(kind,'upload_'+kind+'_0000000000000001')).status,201);
assert.equal(env.BUCKET.map.size,3);const catalog=(await(await manifest()).json()).sounds;assert.equal(catalog.pause.custom,true);assert.equal(catalog.rest.custom,false);assert.equal(catalog.cardio.custom,true);
const sameId='identical_000000000000001',identical=await Promise.all([upload('pause',sameId,catalog.pause.revision),upload('pause',sameId,catalog.pause.revision)]);assert.deepEqual(identical.map(x=>x.status).sort(),[200,201],'identical concurrent retries receive the same confirmed revision');assert.equal(env.BUCKET.map.size,3);
console.log('PASS: authenticated teacher upload, approved-student downloads, three-kind allowlist, no lesson/start/end cues, size/type bounds, exact bytes/hash, private cache/CORS, atomic concurrent writes, idempotency, revision checks, defaults and at most three stored objects. Firebase/R2 simulated.');
