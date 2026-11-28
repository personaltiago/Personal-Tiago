import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';

const source = await readFile(new URL('../app/student-evolution-report.js', import.meta.url), 'utf8');
const env = {}; vm.runInNewContext(source, env);
const {report, series, number} = env.APEvolutionReport;
const plain = value => JSON.parse(JSON.stringify(value));
const workout = {id:'plan~monday', exercises: Array.from({length:8}, (_,i)=>({id:'exercise-'+i,name:'Exercício '+(i+1)}))};
const record = (id, loads, extra={}) => ({exerciseId:id,name:workout.exercises.find(e=>e.id===id)?.name || 'Anterior',loads,done:loads.map(()=>true),targets:loads.map(()=>'10'),...extra});
const session = (n, records, extra={}) => ({id:workout.id,source:'teacher',teacherRecordId:'session-'+n,finishedAt:n*86400000,exerciseRecords:records,...extra});
const history=[session(1,[record('exercise-0',[10,15]),record('exercise-1',[null,0]),record('exercise-2',['9,4']),record('exercise-3',[50],{done:[false]})]),session(2,[record('exercise-0',[10,20])]),session(3,[record('exercise-0',[10,15])]),session(4,[record('exercise-0',[null,null])])];
const copy=JSON.stringify({workout,history});
let data=report(workout,history),first=data.current[0];
assert.equal(data.current.length,8,'every prescribed exercise appears, not just six or the logged subset');
assert.equal(data.current[7].entries.length,0,'unlogged prescriptions are present without invented values');
assert.deepEqual(plain(first.points.map(e=>e.value)),[15,20,15],'maximum completed-series load is explicit and reflects later-series changes');
assert.deepEqual(plain(first.points.map(e=>e.delta)),[null,5,-5]);
assert.equal(first.net,0);assert.equal(first.rise.delta,5);assert.equal(first.fall.delta,-5,'a return to baseline retains both directions');
assert.equal(first.points[1].sets[1].loadDelta,5);assert.equal(first.points[2].sets[1].loadDelta,-5,'individual series retain increases and decreases');
assert.equal(first.filtered.length,4);assert.equal(first.filtered[3].value,null,'missing sessions are retained in the detail');
assert.equal(data.current[1].first.value,0,'recorded zero remains distinct from null');
assert.equal(data.current[1].entries[0].sets[0].load,null);
assert.equal(data.current[2].first.value,9.4,'decimal comma loads remain exact');
assert.equal(data.current[3].points.length,0,'uncompleted series do not determine the load');
assert.equal(JSON.stringify({workout,history}),copy,'the report never changes stored prescriptions or history');
data=report(workout,[...history,session(5,[record('exercise-0',[999])],{id:'plan~tuesday'})]);
assert.equal(data.current[0].last.value,15,'other days never contaminate the selected workout');
data=report(workout,history,{start:2*86400000});first=data.current[0];
assert.deepEqual(plain(first.points.map(e=>e.value)),[20,15]);assert.equal(first.net,-5);
assert.equal(first.first.delta,5,'the first point in a period compares against the prior real session');
assert.equal(first.first.previous.when,86400000);
assert.equal(data.current[7].points.length,0,'a period filter never removes a prescribed exercise');
const duplicate={id:workout.id,exercises:[{id:'one',name:'Remada'},{id:'two',name:'Remada'}]};
data=report(duplicate,[session(1,[{...record('two',[30]),name:'Remada'},{...record('one',[10]),name:'Remada'}])]);
assert.deepEqual(plain(data.current.map(e=>e.first.value)),[10,30],'duplicate names use exercise IDs after reordering');
data=report(duplicate,[session(1,[{...record('',[10]),name:'Remada'},{...record('',[30]),name:'Remada'}])]);
assert(data.current.every(e=>!e.points.length));assert.equal(data.retired.length,2,'ambiguous legacy records stay separate instead of borrowing identity');
assert.deepEqual(plain(data.retired.map(e=>e.first.value)),[10,30]);
data=report({id:workout.id,exercises:[{id:'new',name:'Anterior'}]},[session(1,[record('old',[12])])]);
assert.equal(data.current[0].points.length,0);assert.equal(data.retired[0].first.value,12,'explicitly different IDs retain separate histories');
data=report(workout,[session(1,[record('exercise-0',[10])]),session(1,[record('exercise-0',[15])],{source:'app',teacherRecordId:null,startedAt:123})]);
assert.equal(data.current[0].points.length,2);assert.deepEqual(plain(data.current[0].points.map(e=>e.source).sort()),['app','teacher']);
data=report(workout,[session(1,[record('exercise-0',[10,12],{targets:['8','7'],rounds:[2,4],units:['reps','seconds']})])],{tab:'repeticoes'});
assert.equal(data.current[0].first.value,8,'seconds are not counted as repetitions');
assert.deepEqual(plain(data.current[0].entries[0].sets.map(s=>[s.round,s.unit])),[[2,'reps'],[4,'seconds']]);
data=report(workout,[session(1,[record('exercise-0',[10,20])]),session(2,[record('exercise-0',[15,20])])]);
assert.equal(data.current[0].points[1].delta,0);assert.equal(data.current[0].points[1].sets[0].loadDelta,5,'a series increase is still visible when the session maximum stays unchanged');
for(const input of [null,undefined,'',' ',false,'-2','Infinity',NaN])assert.equal(number(input),null);
assert.equal(number('0'),0);assert.equal(number('9.4 kg'),9.4);assert.equal(series({loads:[null],done:[true],targets:['12']})[0].load,null);

if(process.env.AGENDA_HOSTED_CANDIDATE && process.env.AGENDA_EVOLUTION_REPORT_BASE){
 const base=JSON.parse(await readFile(process.env.AGENDA_EVOLUTION_REPORT_BASE,'utf8')),candidate=JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE,'utf8'));
 const script=(html,id)=>html.match(new RegExp('<script\\b[^>]*\\bid="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
 const codec={};vm.runInNewContext(script(base.files['index.html'],'ap-mascot-asset-codec'),codec);
 const packed=html=>script(html,'ap-progress-sync-source');
 const unpack=html=>gunzipSync(codec.APMascotAssetCodec.decode(packed(html))).toString();
 assert.equal(unpack(candidate.files['index.html']),unpack(base.files['index.html'])+'\n'+source,'all prior synchronization, auth and gaze modules remain exact');
 const css=await readFile(new URL('../app/student-evolution-report.css',import.meta.url),'utf8');
 for(const [name,html]of Object.entries(base.files)){
  let expected=html;
  let actual=candidate.files[name];
  if(name==='index.html'){
   expected=expected.replace(packed(expected),packed(actual)).replace('let evTab="cargas",evPeriod="3m"','let evTab="cargas",evPeriod="all"');
   const block='<style id="ap-evolution-report-css">'+css+'</style>';
   assert(actual.includes(block));actual=actual.replace(block,'');
  }
  assert.equal(actual,expected.replaceAll(base.version,candidate.version),'unrelated source bytes preserved in '+name);
 }
}
console.log('PASS: all eight exercises; empty and outside-period rows; max completed-series load; +5/-5 despite net zero; null/zero/decimals; per-date, per-source, per-set details; ID matching, legacy ambiguity and reordering; selected-workout isolation; period boundaries; repetitions/time; read-only model and strict four-page release fidelity.');
