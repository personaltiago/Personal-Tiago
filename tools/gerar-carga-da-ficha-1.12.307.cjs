'use strict';

// Gera o pacote 1.12.307 / 413 (sem assinatura) a partir do 1.12.306 / 412 da main (SHA-256 conferido).
// Pedido: Tiago, 23/11/2026 17:41, com 3 fotos da tabela de séries: "Não tá atualizando os pesos". Às ~17:50 escolheu
// "Atualizar a ficha" (ao finalizar o treino, a carga da ficha passa a ser a última usada, e muda também no app do aluno) e
// disse que os treinos são registrados "Os dois" (ele, no app do professor, e o aluno, no app dele).
//
// Antes: a coluna Carga sempre começava com a carga da ficha; o peso usado ficava só no histórico e nunca voltava para a ficha.
// Agora (só o professor.html, em dois blocos novos; nada antigo muda):
//  - ap-workout-series-loads (logo depois do script das técnicas, antes do publicador da área do aluno, que guarda a função na
//    hora em que carrega): a carga da ficha aceita um valor por série separado por "/", como as repetições "12/10/8". Com o
//    número exato de séries ("20/22/24" em 3 séries), cada série recebe o seu valor na tabela do professor e no app do aluno.
//    Qualquer outro texto continua valendo para todas as séries, como antes.
//  - ap-workout-load-update (fim da página): a ficha recebe as cargas do treino completo mais recente de cada exercício comum:
//      * ao finalizar o treino no app do professor;
//      * ao abrir a ficha do aluno: treinos do professor já gravados e os que o aluno fez no app dele (lidos pelo mesmo
//        APWorkoutSync da tela de evolução, no máximo a cada 10 min por aluno; sem internet, usa os já recebidos).
//    Proteções: só exercício comum (técnica, bi-set e cardio ficam como estão); só treino com todas as séries da ficha e carga
//    numérica em todas; carga em texto ("Peso corporal") não vira número; dia com treino em andamento não muda; mudar a carga à
//    mão no editor grava a hora e treino mais antigo não sobrescreve. Exercício ainda sem essa marca: vale treino do professor
//    feito com a ficha igual à de hoje, ou treino do aluno depois desta atualização (marcador do aparelho
//    agendaWorkoutLoadsSince_v1).
// Não muda: descanso, cronômetros, alarmes, notificações, login, financeiro, mascotes, o app do aluno e o Firebase além do envio
// da ficha que qualquer alteração já faz.
//
// Uso: node tools/gerar-carga-da-ficha-1.12.307.cjs [pacote-1.12.306.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.307';
const sequence = 413;
const title = 'Carga da ficha atualizada pelo treino';
const summary = 'A ficha passa a guardar a carga do último treino completo de cada exercício, feito com você ou pelo aluno no app dele. O app do aluno recebe as cargas novas.';
const notesText = 'Carga da ficha atualizada pelo treino.\n\n'
  + 'Antes, a coluna Carga sempre começava com a carga da ficha, e o peso usado no treino ficava só no histórico.\n\n'
  + 'Agora, quando um exercício é feito com todas as séries e carga em todas, a ficha passa a ter essas cargas:\n'
  + '- ao finalizar o treino no seu app;\n'
  + '- ao abrir a ficha do aluno, com os treinos que ele fez sozinho no app dele (precisa de internet para buscar os novos).\n\n'
  + 'Se a carga for igual em todas as séries, a ficha mostra um número só (ex.: 22). Se mudar de uma série para outra, mostra uma '
  + 'carga por série separada por barra (ex.: 20/22/22), e cada série da tabela e do app do aluno recebe a sua. Você também pode '
  + 'escrever assim no editor.\n\n'
  + 'O que não é trocado sozinho: exercícios com técnica, bi-set e cardio; carga escrita em texto, como "Peso corporal"; treino '
  + 'incompleto; e o dia que está com treino em andamento. Se você mudar a carga à mão, ela vale até o próximo treino feito '
  + 'depois disso.\n\n'
  + 'Treinos antigos: vale o último treino feito com você em que a ficha estava igual à de hoje. Treinos que o aluno fez sozinho '
  + 'contam a partir desta atualização.\n\n'
  + 'O que não muda: descanso, cronômetros, alarmes, notificações, login, financeiro, mascotes e o aplicativo do aluno.\n\n'
  + 'Inclui tudo do 1.12.306 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.306-Arquivar-Sem-Pagamento-Para-Assinar.agenda.json';
const SOURCE_SHA256 = 'e9c603aef95c53349efe402c13549c40e3ad4f1b5548c87e1ae5b5ee9082845e';
const TARGET_NAME = 'AgendaPersonal-1.12.307-Carga-Da-Ficha-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// ---------------------------------------------------------------------------------------------------------------------------------
// Bloco 1: carga por série na prescrição (todas as telas e o publicador da área do aluno passam por workoutTechniqueRoundPrescription).
const SERIES_JS = String.raw`(function(root){
 'use strict';
 // 1.12.307: carga por série na ficha, separada por "/" (como as repetições "12/10/8"). Só vale com o número exato de séries;
 // qualquer outro texto ("25kg", "20 22", "Peso corporal") continua valendo para todas as séries, como antes.
 function number(value){
  const m=String(value??'').trim().match(/^(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:kg)?$/i);if(!m)return null;
  const n=Number(m[1].replace(',','.'));return Number.isFinite(n)&&n<=1000?n:null;
 }
 function split(value,total){
  if(typeof value!=='string'||!Number.isInteger(total)||total<2||total>100)return null;
  const parts=value.split('/').map(part=>part.trim());if(parts.length!==total)return null;
  return parts.every(part=>number(part)!==null)?parts:null;
 }
 const format=n=>String(Math.round(n*100)/100).replace('.',',');
 const base=root.workoutTechniqueRoundPrescription;
 if(typeof base==='function')root.workoutTechniqueRoundPrescription=function(ex,round,total=Number(ex?.sets)){
  const prescribed=base.apply(this,arguments);
  if(!ex||root.workoutTechniquePrescription?.(ex))return prescribed;
  const loads=split(ex.load,Number(total));
  if(!loads||!Number.isInteger(round)||round<1||round>loads.length)return prescribed;
  return prescribed?{...prescribed,load:loads[round-1],explicitLoad:true}:{reps:String(ex.reps??''),load:loads[round-1],explicitLoad:true};
 };
 root.APSeriesLoads=Object.freeze({number,split,format});
})(window);`;

// Bloco 2: a ficha recebe as cargas do treino completo mais recente.
const UPDATE_JS = String.raw`(function(){
 'use strict';
 // 1.12.307: a ficha guarda a carga do último treino completo de cada exercício comum (pedido do Tiago, 23/11/2026:
 // "Atualizar a ficha"; os treinos são registrados por ele e pelo aluno).
 const SL=window.APSeriesLoads,KEY='agendaWorkoutLoadsSince_v1',WAIT=600000;if(!SL)return;
 const fetched=new Map(),busy=new Set();
 const at=value=>{const d=new Date(value);return value!==null&&value!==undefined&&value!==''&&!isNaN(d.getTime())?d.toISOString():''};
 // Dia em que esta atualização passou a valer neste aparelho: treino do aluno anterior a isso não muda a ficha.
 function since(){
  let value='';try{value=localStorage.getItem(KEY)||''}catch(_){}
  if(!at(value)){value=new Date().toISOString();try{localStorage.setItem(KEY,value)}catch(_){}}
  return value;
 }
 since();
 function host(){try{return window.parent&&window.parent!==window?window.parent:window}catch(_){return window}}
 function paused(){try{if(host().__AP_STUDENT_CONTEXT||window.__AP_STUDENT_CONTEXT)return true}catch(_){}return globalThis.APBackupRestoring===true}
 const plain=value=>String(value??'').trim();
 function regular(day,ex){return !!ex&&!window.workoutTechniquePrescription?.(ex)&&!window.APCardio?.is?.(ex)&&!(window.workoutBisetGroups?.(day)||[]).some(g=>g?.exerciseIds?.includes(ex.id))}
 function seriesCount(ex){const n=Number(ex?.sets);return Number.isInteger(n)&&n>=1&&n<=100?n:0}
 // Carga escrita em texto ("Peso corporal", "Elástico") não vira número.
 const numericPrescription=ex=>plain(ex.load)===''||/\d/.test(plain(ex.load));
 function written(ex,loads){
  const unit=(/\s*kg\s*$/i.exec(plain(ex.load))||[''])[0];
  return loads.every(value=>value===loads[0])?SL.format(loads[0])+unit:loads.map(SL.format).join('/');
 }
 function teacherSessions(studentId){
  const out=[];
  for(const record of state.workoutExecutions||[]){
   if(!record||record.studentId!==studentId||!Array.isArray(record.exercises))continue;
   const when=at(record.finishedAt||record.recordedAt);if(!when)continue;
   const entries=new Map();
   for(const ex of record.exercises){
    if(!ex||ex.biset||!ex.exerciseId||!Array.isArray(ex.performedSets))continue;
    const rounds=new Map();
    for(const row of ex.performedSets){const round=Number(row?.round);if(row&&row.done!==false&&Number.isInteger(round)&&round>=1&&round<=100)rounds.set(round,SL.number(row.load))}
    if(rounds.size)entries.set(ex.exerciseId,{rounds,total:rounds.size,prescribedLoad:typeof ex.prescribed?.load==='string'?ex.prescribed.load:null});
   }
   if(entries.size)out.push({at:when,source:'professor',entries});
  }
  return out;
 }
 function studentSessions(records){
  const out=[];
  for(const record of Array.isArray(records)?records:[]){
   const when=at(record?.finishedAt);if(!when||!Array.isArray(record.exerciseRecords))continue;
   const entries=new Map();
   for(const ex of record.exerciseRecords){
    if(!ex||!ex.exerciseId||!Array.isArray(ex.done)||!Array.isArray(ex.loads)||!ex.done.every(done=>done===true))continue;
    entries.set(ex.exerciseId,{rounds:new Map(ex.done.map((_,i)=>[i+1,SL.number(ex.loads[i])])),total:ex.done.length,prescribedLoad:null});
   }
   if(entries.size)out.push({at:when,source:'aluno',entries});
  }
  return out;
 }
 // Uma gravação para todas as fichas do aluno; devolve o que mudou de carga.
 function apply(studentId,sessions){
  if(paused()||!studentId||!sessions.length)return [];
  const start=since(),changed=[];let touched=false;
  const plans=state.workoutPlans.map(plan=>{
   if(plan.studentId!==studentId||workoutPlanArchived(plan))return plan;
   let planTouched=false;
   const days=plan.days.map(day=>{
    if(workoutRunning(plan,day))return day;
    let dayTouched=false;
    const exercises=day.exercises.map(ex=>{
     if(!regular(day,ex)||!numericPrescription(ex))return ex;
     const total=seriesCount(ex),stamp=plain(ex.loadsUpdatedAt);if(!total)return ex;
     let best=null;
     for(const session of sessions){
      if(session.at<=stamp||best&&session.at<=best.at)continue;
      const entry=session.entries.get(ex.id);if(!entry||entry.total!==total)continue;
      // Ainda sem marca: treino do professor só se a ficha estava igual à de hoje; treino do aluno só depois desta atualização.
      if(!stamp&&(session.source==='professor'?plain(entry.prescribedLoad)!==plain(ex.load):session.at<start))continue;
      const loads=Array.from({length:total},(_,i)=>entry.rounds.get(i+1));
      if(loads.some(value=>value===null||value===undefined)||loads.every(value=>value===0))continue;
      best={at:session.at,source:session.source,loads};
     }
     if(!best)return ex;
     const load=written(ex,best.loads);dayTouched=true;
     if(load!==plain(ex.load))changed.push({name:ex.name,load,source:best.source,at:best.at});
     return {...ex,load,loadsUpdatedAt:best.at,loadsSource:best.source};
    });
    if(!dayTouched)return day;planTouched=true;return {...day,exercises};
   });
   if(!planTouched)return plan;touched=true;return {...plan,days};
  });
  if(!touched)return [];
  const name=studentById(studentId)?.name||'Aluno';
  const text=changed.length?('Cargas da ficha atualizadas · '+name+' · '+changed.map(c=>c.name+' '+c.load).join('; ')).slice(0,400):'';
  return commitWorkoutChange({workoutPlans:plans},text)?changed:[];
 }
 const list=changed=>changed.slice(0,3).map(c=>c.name+' '+c.load).join('; ')+(changed.length>3?' e mais '+(changed.length-3):'');
 // Abrir a ficha do aluno: treinos do professor já gravados e, com a conta do professor, os que o aluno fez no app dele.
 async function syncStudent(studentId){
  if(!studentId||busy.has(studentId)||paused())return [];
  busy.add(studentId);
  try{
   const student=studentById(studentId),uid=plain(student?.firebaseUid),parent=host();
   let records=[];
   try{
    if(uid&&parent.APaccounts?.isTeacher?.()===true&&typeof parent.APloadWorkoutSync==='function'){
     const sync=await parent.APloadWorkoutSync();
     if(Date.now()-(fetched.get(uid)||0)>=WAIT){fetched.set(uid,Date.now());try{await sync.refresh(uid)}catch(_){}}
     records=sync.records(uid)||[];
    }
   }catch(_){}
   // Uma gravação só: treinos do professor deste aparelho e os do aluno (sem internet, os já recebidos).
   if(!studentById(studentId)||uid&&plain(studentById(studentId).firebaseUid)!==uid)return [];
   const changed=apply(studentId,[...teacherSessions(studentId),...studentSessions(records)]);
   if(changed.length)toast('Ficha de '+(student?.name||'aluno')+' atualizada com o último treino: '+list(changed)+'.',6500);
   return changed;
  }catch(problem){console.warn('Cargas da ficha não atualizadas.',problem);return []}
  finally{busy.delete(studentId)}
 }
 // Finalizar o treino no app do professor.
 const finish=saveWorkoutExecution;
 saveWorkoutExecution=function(event){
  const before=state.workoutExecutions[0],result=finish.apply(this,arguments),record=state.workoutExecutions[0];
  if(record&&record!==before&&!paused()){
   let changed=[];try{changed=apply(record.studentId,teacherSessions(record.studentId))}catch(problem){console.warn('Cargas da ficha não atualizadas.',problem)}
   if(changed.length)toast('Treino finalizado. Ficha atualizada com as cargas de hoje: '+list(changed)+'.',6500);
  }
  return result;
 };
 const open=openWorkoutStudent;
 openWorkoutStudent=function(studentId){const result=open.apply(this,arguments);setTimeout(()=>syncStudent(studentId),0);return result};
 // Carga mudada à mão no editor: vale até o próximo treino feito depois disso.
 const form=workoutExerciseFormValue;
 workoutExerciseFormValue=function(){
  const value=form.apply(this,arguments);if(!value||workoutExerciseMode==='catalog')return value;
  const plan=workoutPlanById(document.getElementById('workoutExercisePlanId')?.value),day=plan?.days.find(d=>d.id===document.getElementById('workoutExerciseDayId')?.value),ex=day?.exercises.find(e=>e.id===document.getElementById('workoutExerciseEditId')?.value);
  if(ex&&plain(value.load)!==plain(ex.load)){value.loadsUpdatedAt=new Date().toISOString();value.loadsSource='manual'}
  return value;
 };
 window.APWorkoutLoads=Object.freeze({apply,syncStudent,teacherSessions,studentSessions,since});
})();`;

const SERIES_BLOCK = '<script id="ap-workout-series-loads">' + SERIES_JS + '\n</script>';
const UPDATE_BLOCK = '<script id="ap-workout-load-update">' + UPDATE_JS + '\n</script>\n';
const TECHNIQUES_OPEN = '<script data-agenda-techniques>';
const PUBLISHER = '<script data-ap-student-area';

function editProfessor(html) {
  for (const id of ['ap-workout-series-loads', 'ap-workout-load-update', 'APSeriesLoads', 'APWorkoutLoads', 'agendaWorkoutLoadsSince_v1'])
    assert.equal(count(html, id), 0, id + ' já existe no 1.12.306');
  assert.equal(count(html, TECHNIQUES_OPEN), 1, 'O script das técnicas não aparece uma única vez');
  assert.equal(count(html, PUBLISHER), 1, 'O publicador da área do aluno não aparece uma única vez');
  assert.equal(count(html, '</body>'), 1, 'O fim da página do professor não aparece uma única vez');
  // Dependências: precisam existir no 1.12.306, com estes nomes.
  for (const needed of ['window.workoutTechniqueRoundPrescription=function(ex,round,total=Number(ex?.sets)){', 'window.workoutTechniquePrescription=ex=>prescription(ex);',
    'function saveWorkoutExecution(event){', 'function openWorkoutStudent(', 'function workoutExerciseFormValue(){', 'function commitWorkoutChange(changes,text=\'\',renderDay=true){',
    'function workoutRunning(plan,day){', 'function workoutPlanArchived(', 'function studentById(', 'function workoutPlanById(', 'window.workoutBisetGroups=',
    'prescription:window.workoutTechniqueRoundPrescription};', "workoutCatalogPicking=false,workoutExerciseMode='day';", 'prescribed:{sets:ex.sets||\'\',reps:ex.reps||\'\',load:ex.load||\'\',rest:ex.rest||\'\'},performedSets'])
    assert.equal(count(html, needed), 1, 'Dependência ausente ou repetida no 1.12.306: ' + needed);
  const techniquesEnd = html.indexOf('</script>', html.indexOf(TECHNIQUES_OPEN)) + '</script>'.length;
  assert.ok(techniquesEnd < html.indexOf(PUBLISHER), 'O bloco de carga por série precisa vir antes do publicador da área do aluno');
  assert.ok(html.indexOf('window.workoutTechniqueRoundPrescription=function') < techniquesEnd, 'A prescrição por série precisa estar no script das técnicas');
  let out = html.slice(0, techniquesEnd) + SERIES_BLOCK + html.slice(techniquesEnd);
  out = out.replace('</body>', () => UPDATE_BLOCK + '</body>');
  return out;
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.306');
  assert.equal(source.sequence, 412);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notesText.length <= 4000, 'notas: ' + notesText.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'professor.html': editProfessor(original.files['professor.html'])};
  return {...original, files, version, sequence, notes: notesText, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.306 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME};
