import assert from 'node:assert/strict';
import {createHandler} from '../worker/index.js';
class Bucket{map=new Map();count=0;async get(k){const i=this.map.get(k);return i?{etag:i.etag,json:async()=>JSON.parse(i.value)}:null}async put(k,value,{onlyIf}={}){const old=this.map.get(k);if(onlyIf?.etagMatches&&old?.etag!==onlyIf.etagMatches||onlyIf instanceof Headers&&onlyIf.get('If-None-Match')==='*'&&old)return null;this.map.set(k,{etag:String(++this.count),value});return {etag:String(this.count)}}}
const teacher='R2EmnDVcvMWt7TjPxOP6DjW1VOn1',env={BUCKET:new Bucket()};let allowed=true,owner=teacher,disabled=false,identity='alice';
const handler=createHandler(async(url,options)=>{
 if(url.includes('accounts:lookup')){const token=JSON.parse(options.body).idToken;return Response.json({users:[{localId:token.startsWith('teacher')?teacher:identity,disabled}]})}
 assert.ok(url.endsWith('/usuarios/'+identity));assert.ok(options.headers.Authorization.startsWith('Bearer student'));
 return Response.json({fields:{ativo:{booleanValue:allowed},perfil:{stringValue:'aluno'},professorId:{stringValue:owner}}});
});
const jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,192,0,17,8,0,1,0,1,3,1,17,0,2,17,1,3,17,1,255,217]).toString('base64');
const req=(path,data,who='student')=>new Request('https://service.test'+path,{method:'POST',headers:{Authorization:'Bearer '+who+'a'.repeat(40),'Content-Type':'application/json',Origin:'https://appassets.androidplatform.net'},body:JSON.stringify(data)});
const upload=(photo=jpeg,mutationId='a'.repeat(32))=>handler(req('/api/student-photo',{photo,mutationId}),env);
assert.equal((await handler(new Request('https://service.test/api/student-photos',{method:'POST'}),env)).status,401);
assert.equal((await handler(req('/api/student-photos',{students:[]}),env)).status,403);
allowed=false;assert.equal((await upload()).status,403);allowed=true;owner='other';assert.equal((await upload()).status,403);owner=teacher;disabled=true;assert.equal((await upload()).status,403);disabled=false;
assert.equal((await upload('data:image/svg+xml;base64,PHN2Zz4=')).status,422);
assert.equal((await handler(req('/api/student-photo',{photo:jpeg,mutationId:'a'.repeat(32),uid:'bob'}),env)).status,422);
assert.equal(env.BUCKET.map.size,0);
assert.equal((await upload()).status,201);assert.equal(env.BUCKET.map.size,1);
assert.equal((await upload()).status,200,'duplicate retries are idempotent');
const list=async(revision='')=>handler(req('/api/student-photos',{students:[{uid:'alice',revision},{uid:'bob',revision:''}]},'teacher'),env);
let response=await list();assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://appassets.androidplatform.net');let result=await response.json();assert.equal(result.photos.length,1);assert.equal(result.photos[0].uid,'alice');assert.equal(result.photos[0].photo,jpeg);
assert.deepEqual((await (await list('a'.repeat(32))).json()).photos,[],'unchanged photos are not downloaded again');
identity='bob';assert.equal((await upload(jpeg,'b'.repeat(32))).status,201);assert.equal(env.BUCKET.map.size,2);identity='alice';
assert.equal((await upload('','c'.repeat(32))).status,201);result=await (await list('a'.repeat(32))).json();assert.equal(result.photos.find(x=>x.uid==='alice').photo,'','removal is an explicit tombstone');
assert.equal((await handler(req('/api/student-photo',{photo:jpeg,mutationId:'a'.repeat(32)},'teacher'),env)).status,403);
assert.equal((await handler(new Request('https://service.test/student-photos/v1/alice.json'),env)).status,404,'no public photo URL');
console.log('PASS: authenticated upload owner, approved teacher relationship, disabled/unapproved/wrong teacher rejection, no spoofed UID/SVG, teacher-only reads, private storage, idempotency, changed-only responses, tombstones and Android CORS. Firebase/R2 simulated.');
