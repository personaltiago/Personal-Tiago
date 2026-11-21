import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {IDBFactory} from 'fake-indexeddb';
import {createHandler} from '../worker/index.js';

const teacher='R2EmnDVcvMWt7TjPxOP6DjW1VOn1';
const legacy=new Uint8Array([1,4,9]);
const prefix='/api/workout-audio';
const metadata=new Map();
let etag=0;
const bucket={
 async head(key){return metadata.get(key)||null;},
 async get(key,{range}={}){
  const object=await this.head(key);
  return object?{...object,body:new Blob([object.data.slice(range?.offset||0)]).stream()}:null;
 },
 async put(key,value,{onlyIf,customMetadata}={}){
  const previous=metadata.get(key);
  if(onlyIf instanceof Headers&&onlyIf.get('If-None-Match')==='*'&&previous)return null;
  if(onlyIf?.etagMatches&&previous?.etag!==onlyIf.etagMatches)return null;
  const data=new Uint8Array(value),entry={data,size:data.byteLength,etag:String(++etag),customMetadata};
  metadata.set(key,entry);
  return entry;
 }
};
let active=true;
const handler=createHandler(async (url,options)=>{
 if(url.includes('accounts:lookup')){
  const token=JSON.parse(options.body).idToken;
  const localId=token.startsWith('teacher')?teacher:token.startsWith('other')?'other':'student';
  return Response.json({users:[{localId}]});
 }
 return Response.json({fields:{ativo:{booleanValue:active},perfil:{stringValue:'aluno'},professorId:{stringValue:teacher}}});
});
const req=(who,path,options={})=>handler(new Request('https://test.invalid'+path,{
 ...options,headers:{...options.headers,Authorization:'Bearer '+who+'a'.repeat(40)}
}),{BUCKET:bucket});
async function sendOriginal(){
 const response=await req('teacher',prefix+'/rest?mutationId=existing_000000000001&name=original.wav',{
  method:'POST',headers:{'Content-Type':'audio/wav'},body:legacy
 });
 assert.equal(response.status,201);
}
let source=await readFile(new URL('../app/workout-audio.js',import.meta.url),'utf8');
if(process.env.AGENDA_AUDIO_CANDIDATE){
 const bundle=JSON.parse(await readFile(process.env.AGENDA_AUDIO_CANDIDATE,'utf8'));
 assert.equal(bundle.version,'1.12.231');
 const scripts=html=>html.match(/<script id="ap-workout-audio">([\s\S]*?)<\/script>/)[1];
 assert.equal(source,scripts(bundle.files['index.html']));
 assert.equal(source,scripts(bundle.files['professor.html']));
 assert.match(bundle.files['index.html'],/id="apStudentAudioOpen"/);
 assert.match(bundle.files['professor.html'],/id="apSharedAudio-rest"/);
 assert.match(bundle.files['professor.html'],/id="apSharedAudio-cardio"/);
 assert.match(bundle.files['index.html'],/APWorkoutAudio.play\('cardio'\)/);
}
function client(who,indexedDB=new IDBFactory(),online=true){
 const role=who==='teacher'?'teacher':'student',played=[],requests=[];
 const document={readyState:'loading',hidden:false,addEventListener(){},getElementById:id=>id==='restSoundInput'?{}:null};
 const host={
  document,indexedDB,crypto,ArrayBuffer,URLSearchParams,setTimeout,clearTimeout,setInterval(){},addEventListener(){},
  navigator:{onLine:online},
  APaccounts:{isTeacher:()=>role==='teacher',context:()=>({role,storageId:who,area:{enabled:true}}),getPhotoToken:async()=>who+'a'.repeat(40)},
  APCardio:{beep:()=>played.push('beep')},
  AudioContext:class {
   destination={}; async resume(){}
   async decodeAudioData(buffer){return {duration:1,sample:new Uint8Array(buffer)[0]};}
   createBufferSource(){return {connect(){},disconnect(){},start(){played.push(this.buffer.sample);},stop(){}};}
  },
  fetch:async (url,options)=>{
   if(!host.navigator.onLine)throw Error('offline');
   requests.push([new URL(url).pathname,new URL(url).search,options.method||'GET']);
   return req(who,new URL(url).pathname+new URL(url).search,options);
  }
 };
 host.window=host;host.parent=host;
 vm.runInNewContext(source,host);
 return {audio:host.APWorkoutAudio,played,requests,indexedDB,host};
}
const file=(name,sample)=>({name,type:'audio/wav',size:3,arrayBuffer:async()=>new Uint8Array([sample,4,9]).buffer});
const plain=value=>JSON.parse(JSON.stringify(value));
await sendOriginal();

const sender=client('teacher');
await sender.audio.sync();
assert.equal(sender.audio.options('rest').original,'original.wav');
assert.deepEqual(plain(await sender.audio.addOptions('rest',[file('toque-a.wav',2),file('toque-b.wav',3)])),{sent:2,failed:[]});
assert.deepEqual(plain(await sender.audio.addOptions('cardio',[file('cardio.wav',5)])),{sent:1,failed:[]});
assert.deepEqual(plain(await sender.audio.addOptions('rest',[file('toque-a.wav',2)])),{sent:1,failed:[]},'an interrupted confirmation can be retried without a duplicate');
const legacyView=await (await req('student',prefix)).json();
assert.equal(legacyView.sounds.rest.revision,'existing_000000000001');
assert.equal(legacyView.extraSounds,undefined);
assert.equal(metadata.size,4);

const student=client('student');
await student.audio.sync();
assert.equal(student.requests.filter(([url])=>url.startsWith(prefix+'/rest-')).length,0,'the catalog is read without downloading unselected options');
assert.deepEqual(plain(student.audio.options('rest').extra.map(item=>item.name)),['toque-a.wav','toque-b.wav']);
assert.equal(await student.audio.play('rest'),true);
assert.deepEqual(student.played,[1]);
await student.audio.play('rest',true,'rest-3');
assert.equal(student.played.at(-1),3);
student.audio.stopPreview();
assert.equal(student.audio.options('rest').selected,'auto','preview never changes the selection');
assert.equal(await student.audio.chooseOption('rest','rest-2'),true);
assert.equal(await student.audio.chooseOption('cardio','cardio-2'),true);
await student.audio.play('rest');
await student.audio.play('cardio');
assert.deepEqual(student.played.slice(-2),[2,5]);
assert.equal(await student.audio.play('pause'),false);
await assert.rejects(student.audio.chooseOption('rest','cardio-2'),/Escolha um áudio da lista/);
await assert.rejects(student.audio.addOptions('rest',[file('impostor.wav',9)]),/Entre como professor/);
assert.equal((await req('student',prefix+'/rest-4?mutationId=impostor_000000000001&name=bad.wav',{method:'POST',headers:{'Content-Type':'audio/wav'},body:legacy})).status,403);
assert.equal((await req('teacher',prefix+'/pause-2?mutationId=impostor_000000000001&name=bad.wav',{method:'POST',headers:{'Content-Type':'audio/wav'},body:legacy})).status,422);

const offline=client('student',student.indexedDB,false);
await offline.audio.ready();
await offline.audio.play('rest');
await offline.audio.play('cardio');
assert.deepEqual(offline.played,[2,5]);
assert.equal(offline.requests.length,0);
const other=client('other',student.indexedDB,false);
await other.audio.ready();
assert.equal(other.audio.options('rest').selected,'auto');
assert.equal(await other.audio.play('rest'),false);
assert.deepEqual(other.played,['beep']);

const removed=sender.audio.options('rest').extra[0];
await sender.audio.removeOption('rest',removed.slot,removed.revision);
assert.equal(sender.audio.options('rest').extra.length,1);
await student.audio.sync();
assert.equal(student.audio.options('rest').removed,true);
await student.audio.play('rest');
assert.equal(student.played.at(-1),'beep');
await sender.audio.addOptions('rest',[file('novo.wav',6),file('outra.wav',7),file('último.wav',8)]);
assert.equal(sender.audio.options('rest').extra.length,4);
const full=await sender.audio.addOptions('rest',[file('excedente.wav',9)]);
assert.equal(full.sent,0);
assert.match(full.failed[0].message,/quatro opções/);
await student.audio.sync();
assert.equal(student.audio.options('rest').removed,true,'a reused slot does not play the new file without student selection');
await student.audio.chooseOption('rest','rest-2');
await student.audio.play('rest');
assert.equal(student.played.at(-1),6);
await student.audio.chooseOption('rest','default');
await student.audio.play('rest');
assert.equal(student.played.at(-1),'beep');
await student.audio.play('cardio');
assert.equal(student.played.at(-1),5,'changes to rest do not change cardio');

active=false;
await student.audio.sync();
assert.equal(student.audio.options('cardio').blocked,true);
assert.equal(await student.audio.play('cardio'),false);
for(const c of [sender,student,offline,other])c.audio.stop();
console.log('PASS: batch upload, old audio compatibility, offline choices per account and event, independent preview, removal/reuse, capacity and authorization.');
