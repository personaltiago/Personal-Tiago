(function(global){
 'use strict';
 const SERVER='https://agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site',TEACHER='R2EmnDVcvMWt7TjPxOP6DjW1VOn1',KINDS=['pause','rest','cardio'],MAX=8*1024*1024,DB='agenda_workout_audio_v1';
 const CHOICE_KINDS=['rest','cardio'];
 const optionSlots=kind=>CHOICE_KINDS.includes(kind)?[2,3,4,5].map(number=>kind+'-'+number):[];
 const EXTRA_SLOTS=CHOICE_KINDS.flatMap(optionSlots);
 let databasePromise=null,owner='',epoch=0,entries={},catalog={},loaded=false,loading=null,busy=false,again=false,error='',blocked=false,context=null,source=null,previewKind='',playRequest=0,previewTimer=null,lastSync=0;
 let extraSounds=null,studentChoices={},previewChoice='';
 const selectionVersions={},listeners=new Set();
 function accounts(){try{return global.APaccounts||global.parent?.APaccounts}catch(_){return null}}
 function identity(){const a=accounts();if(a?.isTeacher?.()===true)return {uid:TEACHER,role:'teacher',key:'teacher:'+TEACHER};const c=a?.context?.()||global.__AP_STUDENT_CONTEXT;return c?.role==='student'&&c.storageId&&c.area?.enabled!==false?{uid:c.storageId,role:'student',key:'student:'+c.storageId}:null}
 function studentRole(){return (accounts()?.context?.()||global.__AP_STUDENT_CONTEXT)?.role==='student'}
 function current(key,version){return identity()?.key===key&&epoch===version}
 function status(){return {owner,busy,error,preview:previewKind,previewChoice,kinds:Object.fromEntries(KINDS.map(kind=>{const e=entries[kind],remote=catalog[kind];return[kind,{name:e?.custom?e.name:remote?.custom?remote.name:'Sinal padrão',custom:e?.custom===true,pending:e?.pending===true,conflict:e?.conflict===true,available:!!remote,revision:remote?.revision||null,error:e?.error||''}]}))}}
 function extraAvailable(entry){
  return !!entry?.custom&&(!extraSounds||extraSounds[entry.kind]?.revision===entry.revision);
 }
 function options(kind){
  const selected=studentChoices[kind], originals=catalog[kind]||entries[kind];
  return {
   supported:!!extraSounds, blocked, role:identity()?.role||'',
   original:originals?.custom?originals.name:'',
   selected:!selected?'auto':extraAvailable(selected)?selected.kind:'default',
   removed:!!selected?.custom&&!extraAvailable(selected),
   extra:blocked?[]:optionSlots(kind).map(slot=>{
    const entry=extraSounds?extraSounds[slot]:selected?.kind===slot?selected:null;
    return entry?.custom?{slot,name:entry.name,revision:entry.revision}:null;
   }).filter(Boolean)
  };
 }
 function changed(){const s=status();for(const fn of listeners)try{fn(s)}catch(_){}}
 function database(){
  if(databasePromise)return databasePromise;
  databasePromise=new Promise((resolve,reject)=>{
   if(!global.indexedDB)return reject(Error('O armazenamento dos áudios não está disponível.'));
   const r=global.indexedDB.open(DB,1);let settled=false;const timeout=setTimeout(()=>fail(),8000);
   function fail(){if(settled)return;settled=true;clearTimeout(timeout);reject(Error('Não foi possível abrir os áudios salvos.'))}
   r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('records'))r.result.createObjectStore('records')};r.onerror=r.onblocked=fail;
   r.onsuccess=()=>{const db=r.result;if(settled){db.close();return}settled=true;clearTimeout(timeout);db.onversionchange=()=>{db.close();databasePromise=null};resolve(db)};
  }).catch(e=>{databasePromise=null;throw e});return databasePromise;
 }
 async function stored(mode,operation){const db=await database();return new Promise((resolve,reject)=>{try{let value;const tx=db.transaction('records',mode),r=operation(tx.objectStore('records'));r.onsuccess=()=>{value=r.result};tx.oncomplete=()=>resolve(value);tx.onerror=tx.onabort=()=>reject(Error('Não foi possível guardar o áudio. A cópia anterior foi mantida.'))}catch(_){reject(Error('Não foi possível guardar o áudio. A cópia anterior foi mantida.'))}})}
 const diskKey=(key,kind)=>key+':'+kind;
 const read=(key,kind)=>stored('readonly',store=>store.get(diskKey(key,kind)));
 const write=(key,kind,value)=>stored('readwrite',store=>store.put(value,diskKey(key,kind)));
 async function replace(key,kind,expectedRevision,value){
  const db=await database();return new Promise((resolve,reject)=>{
   try{let replaced=false;const tx=db.transaction('records','readwrite'),store=tx.objectStore('records'),request=store.get(diskKey(key,kind));
    request.onsuccess=()=>{if((request.result?.revision||null)===(expectedRevision||null)){store.put(value,diskKey(key,kind));replaced=true}};
    tx.oncomplete=()=>resolve(replaced);tx.onerror=tx.onabort=()=>reject(Error('Não foi possível guardar o áudio. A cópia anterior foi mantida.'));
   }catch(_){reject(Error('Não foi possível guardar o áudio. A cópia anterior foi mantida.'))}
  });
 }
 function revision(v){return typeof v==='string'&&/^[A-Za-z0-9_-]{16,100}$/.test(v)}
 function validEntry(e,kind){return e===null||e&&e.kind===kind&&e.professorId===TEACHER&&revision(e.revision)&&typeof e.custom==='boolean'&&typeof e.name==='string'&&e.name.length<=100&&Number.isSafeInteger(e.bytes)&&e.bytes>=0&&e.bytes<=MAX&&(e.custom?e.bytes>0&&/^audio\/[a-z0-9.+_-]+$/i.test(e.type||'')&&/^[a-f0-9]{64}$/.test(e.sha256||''):e.bytes===0&&e.sha256==='')}
 function validCatalog(v){return v&&v.version===1&&v.professorId===TEACHER&&v.sounds&&Object.keys(v.sounds).length===KINDS.length&&KINDS.every(k=>Object.hasOwn(v.sounds,k)&&validEntry(v.sounds[k],k))}
 function validExtras(value){
  return value&&Object.keys(value).length===EXTRA_SLOTS.length&&EXTRA_SLOTS.every(slot=>Object.hasOwn(value,slot)&&validEntry(value[slot],slot));
 }
 function applyCatalog(value){
  catalog=value.sounds;
  extraSounds=validExtras(value.extraSounds)?value.extraSounds:null;
 }
 function catalogRecord(){
  return {version:1,professorId:TEACHER,sounds:catalog,...(extraSounds?{extraSounds}:{})};
 }
 function validLocal(e,kind){return e&&validEntry(e,kind)&&e.data instanceof ArrayBuffer&&e.data.byteLength===e.bytes&&typeof e.pending==='boolean'}
 async function ensure(){
  const id=identity();if(!id){if(owner){epoch++;owner='';entries={};catalog={};extraSounds=null;studentChoices={};loaded=false;loading=null;stop();changed()}return null}
  if(owner===id.key&&loaded)return id;
  if(owner===id.key&&loading){await loading;return identity()?.key===id.key?id:null}
  epoch++;owner=id.key;entries={};catalog={};extraSounds=null;studentChoices={};loaded=false;error='';blocked=false;stop();const version=epoch;
  loading=(async()=>{
   const saved=await Promise.all([...KINDS,'catalog','access',...CHOICE_KINDS.map(kind=>kind+'-choice')].map(k=>read(id.key,k)));
   if(!current(id.key,version))return;
   for(let i=0;i<KINDS.length;i++)if(validLocal(saved[i],KINDS[i]))entries[KINDS[i]]=saved[i];
   if(validCatalog(saved[3]))applyCatalog(saved[3]);
   for(const [index,kind] of CHOICE_KINDS.entries()){
    const selected=saved[5+index];
    if(selected?.kind==='default'||optionSlots(kind).includes(selected?.kind)&&validLocal(selected,selected.kind))studentChoices[kind]=selected;
   }
   blocked=saved[4]?.denied===true;loaded=true;changed();
  })().catch(()=>{if(current(id.key,version)){loaded=true;error='Não foi possível ler os áudios salvos neste aparelho.';changed()}}).finally(()=>{if(current(id.key,version))loading=null});
  await loading;return current(id.key,version)?id:null;
 }
 async function api(path,options={},key=owner,version=epoch){
  if(!current(key,version))throw Error('A conta foi alterada.');
  const token=await accounts().getPhotoToken();if(!current(key,version))throw Error('A conta foi alterada.');
  const response=await fetch(SERVER+path,{...options,headers:{...options.headers,Authorization:'Bearer '+token},cache:'no-store',signal:global.AbortSignal?.timeout?.(60000)});
  if(!current(key,version))throw Error('A conta foi alterada.');
  if(!response.ok){let message;try{message=(await response.json()).error}catch(_){}const e=Error(message||'Não foi possível sincronizar os áudios agora.');e.status=response.status;throw e}return response;
 }
 const sha=async bytes=>[...new Uint8Array(await global.crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
 function audio(){if(context&&context.state!=='closed')return context;const C=global.AudioContext||global.webkitAudioContext;if(!C)throw Error('A reprodução de áudio não está disponível.');context=new C();return context}
 function prime(){try{audio().resume()?.catch?.(()=>{})}catch(_){}}
 async function decode(bytes){try{const buffer=await audio().decodeAudioData(bytes.slice(0));if(!buffer||!Number.isFinite(buffer.duration)||buffer.duration<=0)throw Error();return buffer}catch(_){throw Error('Não foi possível reproduzir este arquivo. Escolha outro áudio.')}}
 function stop(){playRequest++;clearTimeout(previewTimer);previewTimer=null;const old=source;source=null;previewKind='';previewChoice='';if(old){old.onended=null;try{old.stop()}catch(_){}try{old.disconnect()}catch(_){}}changed()}
 function stopPreview(){if(previewKind)stop()}
 function soundEnabled(){try{return typeof global.prefs!=='function'||global.prefs().sound!==false}catch(_){return true}}
 async function play(kind,preview=false,option){
  if(!KINDS.includes(kind))return false;
  const id=identity();if(!id||!preview&&id.role!=='student'||!preview&&!soundEnabled())return false;
  prime();await ensure();if(identity()?.key!==id.key||blocked)return false;
  stop();const request=playRequest,key=id.key,version=epoch;
  try{
   if(request!==playRequest||identity()?.key!==key)return false;
   const selected=id.role==='student'?studentChoices[kind]:null;
   let entry=selected?extraAvailable(selected)?selected:null:entries[kind];
   if(preview&&option!==undefined){
    entry=option==='default'?null:option==='auto'?entries[kind]:await loadOption(kind,option,key,version);
   }
   if(request!==playRequest||!current(key,version))return false;
   if(!entry?.custom){if(kind!=='pause')global.APCardio?.beep?.();return false}
   const ctx=audio();await ctx.resume();const buffer=await decode(entry.data);if(request!==playRequest||!current(key,version))return false;
   const next=ctx.createBufferSource();next.buffer=buffer;next.connect(ctx.destination);source=next;previewKind=preview?kind:'';previewChoice=preview?option||'':'';
   next.onended=()=>{if(source===next){source=null;previewKind='';previewChoice='';clearTimeout(previewTimer);previewTimer=null;try{next.disconnect()}catch(_){}changed()}};next.start();
   if(preview)previewTimer=setTimeout(stop,15000);changed();return true;
  }catch(e){if(identity()?.key!==key||request!==playRequest)return false;if(!preview&&kind!=='pause')global.APCardio?.beep?.();if(preview)throw e;return false}
 }
 function fileType(file){const type=String(file.type||'').split(';')[0].toLowerCase();if(/^audio\/[a-z0-9.+_-]+$/.test(type))return type;if(type&&type!=='application/octet-stream')return '';const ext=String(file.name||'').split('.').pop().toLowerCase();return {mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',oga:'audio/ogg',opus:'audio/ogg',m4a:'audio/mp4',aac:'audio/aac',flac:'audio/flac',webm:'audio/webm'}[ext]||''}
 function bytesOf(file){if(typeof file.arrayBuffer==='function')return file.arrayBuffer();return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=r.onabort=()=>reject(Error('Não foi possível ler este áudio.'));r.readAsArrayBuffer(file)})}
 async function prepareAudio(file){
  if(!file)return {type:'',name:'Sinal padrão',data:new ArrayBuffer(0),hash:''};
  const type=fileType(file),name=String(file.name||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,100)||'Áudio do treino';
  if(!type||!Number.isFinite(file.size)||file.size<=0||file.size>MAX)throw Error('Escolha um arquivo de áudio de até 8 MB.');
  const data=await bytesOf(file);
  if(!(data instanceof ArrayBuffer)||data.byteLength!==file.size)throw Error('Não foi possível ler este áudio.');
  await decode(data);
  return {type,name,data,hash:await sha(data)};
 }
 async function save(kind,file){
  if(!KINDS.includes(kind))throw Error('Este áudio não é compartilhado.');prime();const id=await ensure();if(id?.role!=='teacher')throw Error('Entre como professor para escolher os áudios.');
  const version=epoch,selection=(selectionVersions[kind]||0)+1;selectionVersions[kind]=selection;
  const {type,name,data,hash}=await prepareAudio(file);
  if(!current(id.key,version)||selectionVersions[kind]!==selection)throw Error('A seleção do áudio foi alterada.');
  const previous=entries[kind],predecessors=previous?.pending?[previous.revision,...(previous.predecessors||[])].slice(0,8):[];
  const entry={kind,professorId:TEACHER,revision:global.crypto.randomUUID(),custom:!!file,name,type,bytes:data.byteLength,sha256:hash,updatedAt:new Date().toISOString(),data,pending:true,baseRevision:catalog[kind]?.revision||null,baseKnown:Object.hasOwn(catalog,kind),predecessors,conflict:false,error:''};
  await write(id.key,kind,entry);if(!current(id.key,version))return false;entries[kind]=entry;changed();pump();return true;
 }
 async function fetchCatalog(key,version){const value=await(await api('/api/workout-audio?choices=1',{},key,version)).json();if(!validCatalog(value))throw Error('A configuração de áudio recebida é inválida.');if(!current(key,version))throw Error('A conta foi alterada.');await write(key,'catalog',value);await write(key,'access',{denied:false});if(!current(key,version))throw Error('A conta foi alterada.');applyCatalog(value);blocked=false;lastSync=Date.now();return value}
 async function downloadAudio(entry,key,version){
  const response=await api('/api/workout-audio/'+entry.kind+'?revision='+encodeURIComponent(entry.revision),{},key,version);
  if(Number(response.headers.get('Content-Length')||0)>MAX)throw Error('O áudio recebido ultrapassa o limite.');
  const data=await response.arrayBuffer();
  if(data.byteLength!==entry.bytes||data.byteLength>MAX||await sha(data)!==entry.sha256)throw Error('O áudio recebido está incompleto. Tente novamente.');
  return data;
 }
 async function loadOption(kind,slot,key,version){
  if(!optionSlots(kind).includes(slot))throw Error('Escolha um áudio da lista.');
  const selected=studentChoices[kind];
  if(selected?.kind===slot&&extraAvailable(selected))return selected;
  const entry=extraSounds?.[slot];
  if(!entry?.custom)throw Error('Este áudio já saiu da lista. Atualize as opções.');
  return {...entry,data:await downloadAudio(entry,key,version),pending:false};
 }
 async function chooseOption(kind,option){
  if(!CHOICE_KINDS.includes(kind))throw Error('Tipo de aviso inválido.');
  prime();
  const id=await ensure();
  if(id?.role!=='student'||blocked)throw Error('Entre na sua conta de aluno para escolher o som.');
  const version=epoch,selection=(selectionVersions[kind]||0)+1;
  selectionVersions[kind]=selection;
  const entry=option==='auto'?null:option==='default'?{kind:'default'}:await loadOption(kind,option,id.key,version);
  if(entry?.custom)await decode(entry.data);
  if(!current(id.key,version)||selectionVersions[kind]!==selection)throw Error('A seleção do áudio foi alterada.');
  if(entry?.custom&&!extraAvailable(entry))throw Error('Este áudio já saiu da lista. Atualize as opções.');
  await write(id.key,kind+'-choice',entry);
  if(!current(id.key,version)||selectionVersions[kind]!==selection)return false;
  studentChoices[kind]=entry;stopPreview();changed();return true;
 }
 async function extraTeacher(){
  prime();
  const id=await ensure();
  if(id?.role!=='teacher')throw Error('Entre como professor para gerenciar as opções de áudio.');
  const version=epoch;
  await fetchCatalog(id.key,version);
  if(!extraSounds)throw Error('O serviço de opções de áudio ainda não está disponível.');
  return {key:id.key,version};
 }
 async function changeOption(slot,track,key,version){
  const baseRevision=extraSounds[slot]?.revision||null,mutationId=global.crypto.randomUUID();
  const suffix=track?'?'+new URLSearchParams({mutationId,name:track.name,...(baseRevision?{baseRevision}:{})}):'/default';
  const body=track?track.data:JSON.stringify({baseRevision,mutationId});
  const response=await api('/api/workout-audio/'+slot+suffix,{method:'POST',headers:{'Content-Type':track?track.type:'application/json'},body},key,version);
  const {saved,entry}=await response.json();
  if(!saved||!validEntry(entry,slot)||entry?.revision!==mutationId||entry.sha256!==(track?.hash||''))throw Error('A alteração do áudio não foi confirmada.');
  if(!current(key,version))throw Error('A conta foi alterada.');
  extraSounds[slot]=entry;
  changed();
 }
 async function addOptions(kind,files){
  const slots=optionSlots(kind);
  if(!slots.length||!files.length)return {sent:0,failed:[]};
  const {key,version}=await extraTeacher();
  const sent=[],failed=[];
  for(const file of files){
   if(!current(key,version))throw Error('A conta foi alterada.');
   try{
    const track=await prepareAudio(file);
    // A retry after an interrupted confirmation should reuse the existing option.
    if(slots.some(slot=>extraSounds[slot]?.custom&&extraSounds[slot].sha256===track.hash&&extraSounds[slot].name===track.name)){sent.push(track.name);continue}
    const slot=slots.find(slot=>!extraSounds[slot]?.custom);
    if(!slot)throw Error('As quatro opções adicionais já estão em uso.');
    await changeOption(slot,track,key,version);
    sent.push(track.name);
   }catch(e){
    failed.push({name:file.name||'Áudio',message:e.message});
    if(e.status===409)await fetchCatalog(key,version);
   }
  }
  if(!current(key,version))throw Error('A conta foi alterada.');
  await write(key,'catalog',catalogRecord());
  return {sent:sent.length,failed};
 }
 async function removeOption(kind,slot,revision){
  if(!optionSlots(kind).includes(slot))throw Error('Escolha um áudio da lista.');
  const {key,version}=await extraTeacher();
  if(!extraSounds[slot]?.custom||extraSounds[slot].revision!==revision)throw Error('Esta opção mudou. Confira a lista atual.');
  await changeOption(slot,null,key,version);
  if(!current(key,version))throw Error('A conta foi alterada.');
  await write(key,'catalog',catalogRecord());
 }
 async function send(kind,key,version){
  let entry=entries[kind];if(!entry?.pending||entry.conflict)return;
  if(!entry.baseKnown||entry.predecessors?.includes(catalog[kind]?.revision)){const previous=entry;entry={...entry,baseRevision:catalog[kind]?.revision||null,baseKnown:true};if(!await replace(key,kind,previous.revision,entry))return;if(!current(key,version)||entries[kind]!==previous)return;entries[kind]=entry}
  const query=new URLSearchParams({mutationId:entry.revision,name:entry.name,...(entry.baseRevision?{baseRevision:entry.baseRevision}:{})});
  const options=entry.custom?{method:'POST',headers:{'Content-Type':entry.type},body:entry.data}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mutationId:entry.revision,baseRevision:entry.baseRevision})};
  try{
   const result=await(await api('/api/workout-audio/'+kind+(entry.custom?'?'+query:'/default'),options,key,version)).json();
   if(!result.saved||!validEntry(result.entry,kind)||result.entry.revision!==entry.revision||result.entry.sha256!==entry.sha256||result.entry.custom!==entry.custom)throw Error('O envio do áudio não foi confirmado.');
   if(!current(key,version))return;catalog[kind]=result.entry;await write(key,'catalog',catalogRecord());if(!current(key,version))return;
   if(entries[kind]===entry){const next={...entry,...result.entry,pending:false,error:'',conflict:false};if(await replace(key,kind,entry.revision,next)&&current(key,version)&&entries[kind]===entry)entries[kind]=next}
   else if(entries[kind]?.pending&&entries[kind].baseRevision===entry.baseRevision){const previous=entries[kind],next={...previous,baseRevision:entry.revision,baseKnown:true};if(await replace(key,kind,previous.revision,next)&&current(key,version)&&entries[kind]===previous)entries[kind]=next}
  }catch(e){
   if(current(key,version)&&entries[kind]===entry){const next={...entry,error:e.message||'Aguardando envio com conexão.',conflict:e.status===409};if(await replace(key,kind,entry.revision,next)&&current(key,version)&&entries[kind]===entry)entries[kind]=next}throw e;
  }finally{if(current(key,version))changed()}
 }
 async function receive(kind,key,version){
  const remote=catalog[kind],old=entries[kind];if(!remote){if(old?.custom||old?.pending){const next={kind,professorId:TEACHER,revision:'implicit_default_000000001',custom:false,name:'Sinal padrão',type:'',bytes:0,sha256:'',data:new ArrayBuffer(0),pending:false};if(await replace(key,kind,old.revision,next)&&current(key,version)&&entries[kind]===old)entries[kind]=next}return}
  if(old?.revision===remote.revision&&old.sha256===remote.sha256)return;
  let data=new ArrayBuffer(0);
  if(remote.custom){
   if(old?.custom&&old.sha256===remote.sha256)data=old.data;
   else data=await downloadAudio(remote,key,version);
  }
  if(!current(key,version))return;const next={...remote,data,pending:false};if(await replace(key,kind,old?.revision||null,next)&&current(key,version)&&entries[kind]===old)entries[kind]=next;
 }
 async function pump(){
  const id=await ensure();if(!id||global.navigator?.onLine===false)return;
  if(id.role==='teacher'&&!global.document.getElementById('restSoundInput'))return;
  if(busy){again=true;return}busy=true;again=false;error='';changed();const version=epoch,key=id.key;
  try{
   const local=await Promise.all(KINDS.map(kind=>read(key,kind)));if(!current(key,version))return;
   for(let n=0;n<KINDS.length;n++)if(validLocal(local[n],KINDS[n]))entries[KINDS[n]]=local[n];
   await fetchCatalog(key,version);for(const kind of KINDS){if(!current(key,version))return;if(id.role==='teacher'&&entries[kind]?.pending)await send(kind,key,version);if(!entries[kind]?.pending)await receive(kind,key,version)}if(current(key,version)){error='';changed()}
  }
  catch(e){if(current(key,version)){if(e.status===403&&id.role==='student'){blocked=true;stop();try{await write(key,'access',{denied:true})}catch(_){}}error=e.status===403?'Seu acesso aos áudios precisa ser liberado pelo professor.':e.message||'Aguardando conexão para sincronizar os áudios.';changed()}}
  finally{busy=false;if(again&&identity())setTimeout(pump,500);changed()}
 }
 async function retry(kind){
  if(!KINDS.includes(kind))return;const id=await ensure();if(id?.role!=='teacher')return;const version=epoch;await fetchCatalog(id.key,version);if(!current(id.key,version))return false;const old=entries[kind];if(!old)return false;
  const next={...old,pending:true,baseRevision:catalog[kind]?.revision||null,baseKnown:true,conflict:false,error:'',revision:old.pending?old.revision:global.crypto.randomUUID()};if(!await replace(id.key,kind,old.revision,next)||!current(id.key,version))return false;entries[kind]=next;changed();return pump();
 }
 async function localFile(kind){await ensure();const e=entries[kind];return e?.custom?{name:e.name,type:e.type,size:e.bytes,arrayBuffer:async()=>e.data.slice(0)}:null}
 function accountChanged(){epoch++;owner='';entries={};catalog={};extraSounds=null;studentChoices={};loaded=false;loading=null;lastSync=0;stop();changed();ensure().then(pump)}
 global.APWorkoutAudio=Object.freeze({KINDS,MAX,status,ready:ensure,isStudent:studentRole,prime,play,stop,stopPreview,save,reset:kind=>save(kind,null),retry,localFile,options,chooseOption,addOptions,removeOption,sync:pump,subscribe(fn){listeners.add(fn);fn(status());return()=>listeners.delete(fn)}});
 global.addEventListener('ap-account-changed',accountChanged);try{if(global.parent!==global)global.parent.addEventListener('ap-account-changed',accountChanged)}catch(_){}
 global.addEventListener('ap-student-ready',()=>ensure().then(pump));global.addEventListener('online',pump);global.addEventListener('pagehide',stop);
 global.document.addEventListener('pointerdown',()=>{if(identity()?.role==='student')prime()},{passive:true});
 global.document.addEventListener('visibilitychange',()=>{if(global.document.hidden)stopPreview();else if(Date.now()-lastSync>60000)pump()});
 setInterval(()=>{if(!global.document.hidden&&Date.now()-lastSync>300000)pump()},30000);
 if(global.document.readyState==='loading')global.document.addEventListener('DOMContentLoaded',()=>ensure().then(pump),{once:true});else ensure().then(pump);
})(window);
