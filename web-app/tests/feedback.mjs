import assert from 'node:assert/strict';
import {createHandler} from '../worker/index.js';
class Bucket{
 map=new Map();serial=0;race=0;
 async get(k){const v=this.map.get(k);return v?{etag:v.etag,json:async()=>JSON.parse(v.body)}:null}
 async put(k,body,{onlyIf}={}){const old=this.map.get(k);if(onlyIf instanceof Headers&&onlyIf.get('If-None-Match')==='*'&&old)return null;if(onlyIf?.etagMatches&&onlyIf.etagMatches!==old?.etag)return null;if(this.race&&onlyIf?.etagMatches){this.race--;return null}const etag=String(++this.serial);this.map.set(k,{body,etag});return {etag}}
 async list({prefix,limit,cursor=''}){const keys=[...this.map.keys()].filter(k=>k.startsWith(prefix)).sort(),n=Number(cursor||0);return {objects:keys.slice(n,n+limit).map(key=>({key})),truncated:n+limit<keys.length,cursor:String(n+limit)}}
}
const teacher='R2EmnDVcvMWt7TjPxOP6DjW1VOn1',env={BUCKET:new Bucket()};let active=true,professor=teacher,disabled=false;
const handler=createHandler(async(url,opts)=>{if(url.includes('accounts:lookup')){const token=JSON.parse(opts.body).idToken;return Response.json({users:[{localId:token.startsWith('teacher')?teacher:token.startsWith('bob')?'bob':'alice',disabled}]})}return Response.json({fields:{perfil:{stringValue:'aluno'},ativo:{booleanValue:active},professorId:{stringValue:professor}}})});
const req=(path,data,who='teacher')=>new Request('https://service.test'+path,{method:'POST',headers:{Authorization:'Bearer '+who+'a'.repeat(40),'Content-Type':'application/json',Origin:'https://appassets.androidplatform.net'},body:JSON.stringify(data)}),send=(path,data,who)=>handler(req(path,data,who),env);
const session=(id='fb_s1',uid='alice')=>({id,uid,studentId:'student-one',studentName:'Aluno <img src=x>',planName:'Ficha A',dayName:'Pernas',startedAt:Date.now()-3600000,finishedAt:Date.now()-1000});
let savedSession=session();const payload={id:savedSession.id,intensity:'Intensa',comment:'Treino bom.\nCarga bem ajustada.',allowPublish:true,mutationId:'mutation-one'};
assert.equal((await handler(new Request('https://service.test/api/feedback-request',{method:'POST'}),env)).status,401);
assert.equal((await send('/api/feedback-request',{session:savedSession},'alice')).status,403);
for(const flag of ['inactive','other-professor','disabled']){active=flag!=='inactive';professor=flag==='other-professor'?'other':teacher;disabled=flag==='disabled';assert.equal((await send('/api/feedback-request',{session:savedSession})).status,403)}active=true;professor=teacher;disabled=false;
assert.equal((await send('/api/feedback-request',{session:{...savedSession,uid:'../alice'}})).status,422);
assert.equal((await send('/api/feedback-request',{session:{...savedSession,finishedAt:savedSession.startedAt-1}})).status,422);
assert.equal((await send('/api/feedback-request',{session:savedSession})).status,201);assert.equal((await send('/api/feedback-request',{session:savedSession})).status,200);assert.equal(env.BUCKET.map.size,1);
assert.equal((await send('/api/feedback-request',{session:{...savedSession,studentId:'wrong'}})).status,409);
let response=await send('/api/feedback-inbox',{cursor:null},'alice'),inbox=await response.json();assert.equal(inbox.items.length,1);assert.equal(inbox.uid,'alice');assert.equal(inbox.items[0].durationSeconds,Math.floor((savedSession.finishedAt-savedSession.startedAt)/1000));assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://appassets.androidplatform.net');
assert.equal((await send('/api/feedback-inbox',{uid:'bob'},'alice')).status,422);assert.equal((await (await send('/api/feedback-inbox',{},'bob')).json()).items.length,0);
assert.equal((await send('/api/feedback-submit',payload,'bob')).status,404);assert.equal((await send('/api/feedback-submit',{...payload,intensity:'invented'},'alice')).status,422);assert.equal((await send('/api/feedback-submit',{...payload,allowPublish:'true'},'alice')).status,422);assert.equal((await send('/api/feedback-submit',{...payload,uid:'bob'},'alice')).status,422);
env.BUCKET.race=1;assert.equal((await send('/api/feedback-submit',payload,'alice')).status,201);
const first=await (await send('/api/feedback-inbox',{uid:'alice'})).json();assert.equal(first.items[0].response.comment,payload.comment);assert.equal(first.items[0].response.allowPublish,true);
const duplicate=await send('/api/feedback-submit',{...payload,comment:'replaced',mutationId:'other'},'alice');assert.equal(duplicate.status,200);assert.equal((await duplicate.json()).item.response.comment,payload.comment,'duplicate/retry never overwrites the received response');
assert.equal((await send('/api/feedback-request',{session:savedSession})).status,200);assert.equal((await (await send('/api/feedback-inbox',{uid:'alice'})).json()).items[0].response.comment,payload.comment,'teacher retry preserves the response');
for(let i=0;i<51;i++)await send('/api/feedback-request',{session:session('page-'+i)});const page1=await (await send('/api/feedback-inbox',{},'alice')).json(),page2=await (await send('/api/feedback-inbox',{cursor:page1.cursor},'alice')).json();assert.equal(page1.items.length,50);assert.equal(page2.items.length,2);assert.equal(page2.cursor,null);
// A teacher's final evaluation travels intact, independently of the student's own response.
const assessed={...session('fb_assessed'),teacherEvaluation:{note:'Execução controlada.\nAjustei a carga.',effort:9.4}};
assert.equal((await send('/api/feedback-request',{session:assessed})).status,201);
assert.equal((await send('/api/feedback-request',{session:assessed})).status,200,'nested evaluation survives an idempotent retry');
assert.equal((await send('/api/feedback-request',{session:{...assessed,teacherEvaluation:{note:'Changed',effort:7}}})).status,409);
assert.equal((await send('/api/feedback-request',{session:{...session('invalid-eval'),teacherEvaluation:{note:'x',effort:11}}})).status,422);
for(const effort of [0, 0.9, 10.1, '9.4', '9,4', true])assert.equal((await send('/api/feedback-request',{session:{...session('invalid-decimal-'+String(effort).replace(/\W/g,'')),teacherEvaluation:{note:'',effort}}})).status,422);
const own=await (await send('/api/feedback-inbox',{},'alice')).json();assert.deepEqual(own.items.find(r=>r.id==='fb_assessed')?.teacherEvaluation,assessed.teacherEvaluation);
const contract={id:assessed.id,intensity:'Moderada',comment:'Minha própria avaliação.',publicationBasis:'contract',mutationId:'contract-one'};
assert.equal((await send('/api/feedback-submit',contract,'alice')).status,201);
const contractReceipt=await (await send('/api/feedback-submit',contract,'alice')).json();assert.deepEqual(contractReceipt.item.teacherEvaluation,assessed.teacherEvaluation);assert.equal(contractReceipt.item.response.publicationBasis,'contract');assert.equal(contractReceipt.item.response.allowPublish,undefined,'contract policy never fabricates an individual opt-in');
// Online feedbacks reuse existing immutable workout receipts; no backfill writes or extra questionnaire.
const workout={id:'online-p~d',startedAt:Date.now()-600000,finishedAt:Date.now()-1000,incomplete:false,workoutName:'Treino online',intensity:'Moderada',comment:'Feedback original online.',exerciseRecords:[{name:'Supino',loads:[12],done:[true],reps:'12'}]};
assert.equal((await send('/api/student-workout',{workout},'alice')).status,201);assert.equal((await send('/api/student-workout',{workout},'bob')).status,201);
const before=env.BUCKET.map.size;let cursor=null,all=[];do{const page=await (await send('/api/feedback-inbox',{uid:'alice',includeOnline:true,cursor})).json();all.push(...page.items);cursor=page.cursor}while(cursor);
const online=all.filter(r=>r.source==='online');assert.equal(online.length,1);assert.equal(online[0].response.comment,workout.comment);assert.equal(online[0].response.intensity,workout.intensity);assert.equal(online[0].response.allowPublish,undefined);assert.equal(env.BUCKET.map.size,before,'reading historical online feedback never creates duplicate records');
const bobOnline=await (await send('/api/feedback-inbox',{uid:'bob',includeOnline:true,cursor:'online:'})).json();assert.notEqual(bobOnline.items[0].id,online[0].id,'identical workout keys on different accounts cannot collide');
const studentStart=await (await send('/api/feedback-inbox',{includeOnline:true},'alice')).json();
assert.equal(studentStart.uid,'alice');
const studentOnline=await (await send('/api/feedback-inbox',{includeOnline:true,cursor:'online:'},'alice')).json();
assert.equal(studentOnline.items.length,1);
assert.equal(studentOnline.items[0].id,online[0].id,'student and teacher resolve the same immutable workout receipt');
assert.equal(studentOnline.items[0].response.comment,workout.comment);
assert.ok(studentOnline.items.every(item=>item.uid==='alice'),'online receipts belong to the authenticated student');
assert.equal((await send('/api/feedback-inbox',{uid:'bob',includeOnline:true,cursor:'online:'},'alice')).status,422,'student cannot choose another account');
assert.equal((await send('/api/feedback-submit',{...contract,id:online[0].id},'alice')).status,404,'online feedback is not an unanswered presencial request');
assert.equal((await send('/api/student-workout',{workout:{...workout,comment:'Replacement'}},'alice')).status,200);
assert.equal((await (await send('/api/feedback-inbox',{uid:'alice',includeOnline:true,cursor:'online:'})).json()).items[0].response.comment,workout.comment,'immutable original feedback retained');
for(let i=0;i<51;i++)await send('/api/student-workout',{workout:{...workout,startedAt:workout.startedAt-i-1}},'alice');
let pagedCursor=null,paged=[];do{const page=await (await send('/api/feedback-inbox',{uid:'alice',includeOnline:true,cursor:pagedCursor})).json();paged.push(...page.items);pagedCursor=page.cursor}while(pagedCursor);assert.equal(paged.filter(r=>r.source==='online').length,52);assert.equal(new Set(paged.map(r=>r.id)).size,paged.length,'pagination across presencial and online streams returns each receipt once');
let ownCursor=null,ownItems=[];do{const page=await (await send('/api/feedback-inbox',{includeOnline:true,cursor:ownCursor},'alice')).json();ownItems.push(...page.items);ownCursor=page.cursor}while(ownCursor);
assert.deepEqual(ownItems.map(item=>item.id),paged.map(item=>item.id),'student reads the same complete paginated history of their own account');
active=false;assert.equal((await send('/api/feedback-inbox',{},'alice')).status,403);assert.equal((await send('/api/feedback-submit',payload,'alice')).status,403);active=true;
assert.equal((await handler(new Request('https://service.test/workout-feedback/v1/'+teacher+'/alice/fb_s1.json'),env)).status,404);
console.log('PASS: teacher-only request, approved/active binding, own student inbox, no forged UID or public record; per-session immutability, first response wins, conditional-write race retry, legacy opt-in preserved, contract policy without fabricated opt-in, teacher assessment, existing online feedback receipts, owner-scoped IDs and pagination. Firebase/R2 simulated.');
