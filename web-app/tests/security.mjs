import assert from 'node:assert/strict';
import {createHandler} from '../worker/index.js';
const TEACHER='R2EmnDVcvMWt7TjPxOP6DjW1VOn1';
const request=(path,{who='teacher',method='POST',data={}}={})=>new Request('https://service.test'+path,{
 method,headers:{...(who?{Authorization:'Bearer '+who+'a'.repeat(40)}:{}),'Content-Type':'application/json',Origin:'https://untrusted.example.invalid'},...(method==='POST'?{body:JSON.stringify(data)}:{})
});
const fetcher=async(url,options)=>{
 assert.ok(['identitytoolkit.googleapis.com','firestore.googleapis.com'].includes(new URL(url).hostname));
 assert.equal(options.redirect,'error','verified credentials never follow redirects');
 if(url.includes('accounts:lookup'))return Response.json({users:[{localId:JSON.parse(options.body).idToken.startsWith('teacher')?TEACHER:JSON.parse(options.body).idToken.startsWith('bob')?'bob':'alice'}]});
 return Response.json({fields:{ativo:{booleanValue:true},perfil:{stringValue:'aluno'},professorId:{stringValue:TEACHER}}});
};
const bucket={async get(){return null;},async put(){throw Error('unexpected business write in security test');}};
const h=createHandler(fetcher),env={BUCKET:bucket};
const protectedRoutes=[['/api/publish','POST'],['/api/android-installer','POST'],['/api/teacher-agenda','GET'],['/api/teacher-agenda','POST'],['/api/student-photo','POST'],['/api/student-photos','POST'],['/api/student-workout','POST'],['/api/student-workouts','POST'],['/api/student-evolution','POST'],['/api/feedback-request','POST'],['/api/feedback-inbox','POST'],['/api/feedback-submit','POST'],['/api/workout-audio','GET'],['/api/workout-audio/rest','POST'],['/api/workout-audio/rest','GET']];
for(const [path,method]of protectedRoutes)assert.equal((await h(request(path,{who:null,method}),env)).status,401,path);
for(const path of ['/api/publish','/api/android-installer','/api/teacher-agenda','/api/student-photos','/api/student-workouts','/api/feedback-request','/api/workout-audio/rest'])assert.equal((await h(request(path,{who:'alice'}),env)).status,403,path);
for(const path of ['/student-photos/v1/alice.json','/teacher-agenda/v1/private.json','/feedback/v1/alice.json'])assert.equal((await h(request(path,{who:null,method:'GET'}),env)).status,404);
let response=await h(request('/api/teacher-agenda',{method:'GET'}),env);
assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
assert.match(response.headers.get('Content-Security-Policy'),/object-src 'none'/);
assert.match(response.headers.get('Cache-Control'),/no-store/);

// Both handlers share the same bounded fallback while running in one isolate.
const local={BUCKET:bucket},handlers=[createHandler(fetcher),createHandler(fetcher)],originalNow=Date.now;
try{
 let now=originalNow();Date.now=()=>now;
 const requests=Array.from({length:100},(_,i)=>handlers[i%2](request('/api/student-photo',{who:'alice'}),local));
 const results=await Promise.all(requests);
 assert.equal(results.filter(r=>r.status===422).length,90);
 assert.equal(results.filter(r=>r.status===429).length,10);
 assert.equal(results.find(r=>r.status===429).headers.get('Retry-After'),'60');
 assert.equal((await handlers[0](request('/api/student-photo',{who:'bob'}),local)).status,422,'accounts have distinct budgets');
 assert.equal((await handlers[0](request('/api/student-evolution',{who:'alice'}),local)).status,200,'writes do not consume read budget');
 now+=60001;assert.equal((await handlers[0](request('/api/student-photo',{who:'alice'}),local)).status,422,'window expires');
 const publication={BUCKET:bucket};for(let i=0;i<12;i++)assert.equal((await h(request('/api/publish'),publication)).status,422);
 assert.equal((await h(request('/api/publish'),publication)).status,429);
}finally{Date.now=originalNow;}

const keys=[],native={BUCKET:bucket,AP_RATE_WRITE:{async limit({key}){keys.push(key);return {success:keys.length<2};}}};
assert.equal((await h(request('/api/student-photo',{who:'alice'}),native)).status,422);
assert.equal((await h(request('/api/student-photo',{who:'alice'}),native)).status,429);
assert.deepEqual(keys,['alice','alice'],'binding receives only the verified UID');
assert.equal((await h(request('/api/student-photo',{who:null}),native)).status,401);assert.equal(keys.length,2);
const logs=[],originalError=console.error;
try{
 console.error=value=>logs.push(value);
 const failure=createHandler(async()=>{throw Error('INTERNAL_CANARY_SECRET');});
 response=await failure(request('/api/teacher-agenda',{method:'GET'}),{BUCKET:bucket});
 assert.equal(response.status,503);const text=await response.text();assert.ok(!text.includes('CANARY'));assert.match(JSON.parse(text).requestId,/^[a-f0-9-]{36}$/);
 assert.equal(logs.length,1);assert.deepEqual(Object.keys(JSON.parse(logs[0])).sort(),['event','requestId']);assert.ok(!logs[0].includes('CANARY'));
 logs.length=0;let lookups=0;
 const releaseFailure={BUCKET:{async get(){if(++lookups===2)throw Error('INTERNAL_CANARY_RELEASE_SECRET');return null;}}};
 response=await h(request('/api/manifest',{who:null,method:'GET'}),releaseFailure);
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{available:false});
 assert.equal(logs.length,1);assert.equal(JSON.parse(logs[0]).event,'hosted_release_install_failed');assert.ok(!logs[0].includes('CANARY'));
}finally{console.error=originalError;}
console.log('PASS: 15 protected routes, role denials, private URLs, headers, fixed upstream hosts/no redirects, rate limits/concurrency/scopes/expiry/native binding and redacted errors. Synthetic Firebase/R2 only; fallback is isolate-local.');
