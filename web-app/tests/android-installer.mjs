import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../dist/server/index.js',import.meta.url));
const {createHandler}=await import('data:text/javascript;base64,'+source.toString('base64'));
const records=new Map();
let writes=0;
const env={BUCKET:{
 async get(key){
  const item=records.get(key);
  return item&&{etag:item.etag,json:async()=>JSON.parse(item.value)};
 },
 async put(key,value,{onlyIf}){
  const item=records.get(key);
  if(onlyIf?.etagMatches&&onlyIf.etagMatches!==item?.etag||onlyIf instanceof Headers&&item)return null;
  records.set(key,{value,etag:String(++writes)});
  return {etag:String(writes)};
 }
}};
let githubChecks=0;
let offline=false;
const fetcher=async (url,options)=>{
 if(url.startsWith('https://identitytoolkit.googleapis.com/')){
  const {idToken}=JSON.parse(options.body);
  return Response.json({users:[{localId:idToken.startsWith('teacher')?'R2EmnDVcvMWt7TjPxOP6DjW1VOn1':'student'}]});
 }
 assert.equal(url,'https://api.github.com/repos/personaltiago/Personal-Tiago/releases/latest');
 githubChecks++;
 return offline?new Response(null,{status:503}):Response.json(release);
};
const api=createHandler(fetcher);
const hash='a'.repeat(64), other='b'.repeat(64);
function official(version,digest){
 const tag='android-'+version+'-conteudo-1.12.215-42';
 return {tag_name:tag,draft:false,prerelease:false,assets:[{
  name:'AgendaPersonal-Android.apk',state:'uploaded',size:63200133,digest:'sha256:'+digest,
  browser_download_url:'https://github.com/personaltiago/Personal-Tiago/releases/download/'+tag+'/AgendaPersonal-Android.apk'
 }]};
}
let release=official('1.171',hash);
const url='https://test.example/api/android-installer';
const get=(handler=api)=>handler(new Request(url),env);
const post=(sha256,role)=>api(new Request(url,{method:'POST',headers:{'Content-Type':'application/json',
 ...(role?{Authorization:'Bearer '+role.padEnd(48,'x')}:{})},body:JSON.stringify({sha256})}),env);
offline=true;
assert.deepEqual(await (await get()).json(),{available:false});
offline=false;
assert.equal((await post(hash)).status,401);
assert.equal((await post(hash,'student')).status,403);
assert.equal((await post(other,'teacher')).status,422);
assert.equal(records.size,0);
const attempts=await Promise.all([post(hash,'teacher'),post(hash,'teacher')]);
assert.deepEqual(attempts.map(x=>x.status).sort(),[200,201]);
assert.equal(writes,1);
assert.equal((await (await get()).json()).version,'1.171');
assert.deepEqual([...records.keys()],['android-installer/current.json']);
release=official('1.170',other);
assert.equal((await post(other,'teacher')).status,409);
release=official('1.172',other);
release.assets[0].browser_download_url='https://unrelated.example/file.apk';
assert.equal((await post(other,'teacher')).status,422);
release=official('1.172',other);
assert.equal((await post(other,'teacher')).status,201);
assert.equal((await (await get()).json()).sha256,other);
assert.equal(writes,2);
release=official('1.173','c'.repeat(64));
const automatic=createHandler(fetcher),before=githubChecks;
const responses=await Promise.all([get(automatic),get(automatic),get(automatic)]);
for(const response of responses)assert.equal((await response.json()).version,'1.173');
assert.equal(githubChecks,before+1);
assert.equal(writes,3);
release=official('1.174','d'.repeat(64));
assert.equal((await (await get(automatic)).json()).version,'1.173');
assert.equal(githubChecks,before+1);
release.assets[0].digest=null;
assert.equal((await (await get(createHandler(fetcher))).json()).version,'1.173');
release=official('1.172',other);
assert.equal((await (await get(createHandler(fetcher))).json()).version,'1.173');
offline=true;
assert.equal((await (await get(createHandler(fetcher))).json()).version,'1.173');
assert.equal(writes,3);
console.log('PASS: automatic lookup, concurrent requests, official digest and URL, fallback, version ordering and legacy teacher publication.');
