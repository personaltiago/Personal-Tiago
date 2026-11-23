'use strict';

// Gera o pacote 1.12.306 / 412 (sem assinatura) a partir do 1.12.305 / 411 da main (SHA-256 conferido).
// Pedido: Tiago, 23/11/2026 07:13: "cada pessoa [que] não paga a mensalidade tem que ser arquivada automaticamente; o lembrete de
// pagamento tem que ser mandado ainda". Às ~07:30 escolheu "Automático com tolerância" e "5 dias".
//
// Antes: só existia o arquivar manual ("Arquivar por atraso" no Financeiro e Arquivar no perfil).
// Agora (só o professor.html, em dois blocos novos; nada antigo muda):
//  - Ao abrir o app e ao voltar para ele (6 s depois, para a sincronização da conta trazer pagamentos feitos em outro aparelho),
//    o aluno com financeiro ativo e mensalidade vencida há 5 dias ou mais é arquivado como no Arquivar de sempre (archived:true,
//    archiveReason 'payment-auto'): sai da agenda, o despertador das aulas para, os treinos são bloqueados no app do aluno ao
//    sincronizar e a cobrança continua (a lista de cobrança do Android não muda).
//  - Aparece uma janela com quem foi arquivado e um Desfazer por aluno. Desfazer (ou reativar em Alunos → Arquivados) marca
//    reactivatedAt e mantém o aluno ativo até o pagamento ser registrado (o vencimento muda) — não é arquivado de novo pela mesma
//    mensalidade.
//  - Primeira vez (marcador do aparelho agendaAutoArchive_v1): quem já tinha 5 dias ou mais de atraso antes da atualização NÃO é
//    arquivado sozinho; a janela mostra a lista com "Arquivar estes N alunos". Fechou, não pergunta de novo (dá para arquivar pelo
//    Financeiro). Evita bloquear de uma vez quem pagou e não foi registrado.
//  - Não roda no contexto do aluno, durante a restauração de backup, com backup restaurado ainda não reunido com a conta, nem com o
//    app em segundo plano.
// Não muda: login, treinos, avaliações, descanso, cronômetros, notificações, sons, mascotes, o app do aluno e o Firebase além do
// bloqueio que o arquivar já fazia.
//
// Uso: node tools/gerar-arquivar-sem-pagamento-1.12.306.cjs [pacote-1.12.305.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const TOLERANCE_DAYS = 5; // escolha do Tiago (23/11/2026)
const version = '1.12.306';
const sequence = 412;
const title = 'Arquivar sozinho quem não paga';
const summary = 'Aluno com a mensalidade vencida há 5 dias, sem pagamento registrado, é arquivado sozinho. Você vê quem foi arquivado e pode desfazer. A cobrança continua.';
const notesText = 'Arquivar sozinho quem não paga.\n\n'
  + 'Ao abrir o aplicativo, e ao voltar para ele, o aluno com o financeiro ativo e a mensalidade vencida há ' + TOLERANCE_DAYS + ' dias ou mais, '
  + 'sem pagamento registrado, é arquivado sozinho. Exemplo: venceu dia 10, é arquivado a partir do dia 15.\n\n'
  + 'É o mesmo Arquivar de sempre: o aluno sai da agenda e dos horários, o despertador das aulas dele para e os treinos ficam bloqueados '
  + 'no app do aluno ao sincronizar. A cobrança continua no Financeiro e o lembrete de cobrança não muda.\n\n'
  + 'Aparece uma janela com quem foi arquivado e um Desfazer para cada aluno. Desfazer, ou reativar em Alunos → Arquivados, deixa o '
  + 'aluno ativo até você registrar o pagamento: ele não é arquivado de novo pela mesma mensalidade.\n\n'
  + 'Na primeira vez, quem já estava com ' + TOLERANCE_DAYS + ' dias ou mais de atraso antes desta atualização não é arquivado sozinho: '
  + 'a janela mostra a lista e você escolhe "Arquivar estes alunos". Se fechar, eles continuam ativos e dá para arquivar pelo Financeiro.\n\n'
  + 'Quando o aluno pagar: registre o pagamento no Financeiro e reative em Alunos → Arquivados.\n\n'
  + 'Nada é apagado e cada arquivamento fica no Histórico.\n\n'
  + 'O que não muda: login, treinos, avaliações, descanso, cronômetros, sons, mascotes e o aplicativo do aluno.\n\n'
  + 'Inclui tudo do 1.12.305 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.305-Arquivado-Fora-Da-Agenda-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '691fbef2510b36ec9b1437c3728429d990378562fc1c32c1fc32a8f93928c536';
const TARGET_NAME = 'AgendaPersonal-1.12.306-Arquivar-Sem-Pagamento-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// ---------------------------------------------------------------------------------------------------------------------------------
const CSS = '#apAutoArchiveDialog>.sheet{max-width:560px}'
  + '#apAutoArchiveDialog [hidden]{display:none!important}'
  + '#apAutoArchiveDialog section{margin:0 0 14px}'
  + '#apAutoArchiveDialog h4{margin:18px 0 6px;font-size:.98rem;color:var(--text)}'
  + '.ap-auto-archive-text{margin:0 0 12px;color:var(--muted);font-size:.92rem;line-height:1.45}'
  + '.ap-auto-archive-list{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:8px}'
  + '.ap-auto-archive-list li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--panel2)}'
  + '.ap-auto-archive-list li>span{display:grid;gap:3px;min-width:0}'
  + '.ap-auto-archive-list strong{font-size:1rem;line-height:1.25;overflow-wrap:anywhere}'
  + '.ap-auto-archive-list small{color:var(--red);font-size:.82rem;line-height:1.3}'
  + '.ap-auto-archive-list .btn{flex:none;min-height:40px;padding:0 14px;white-space:nowrap}'
  + '.ap-auto-archive-actions{display:grid;gap:8px;margin-top:4px}'
  // No celular, abre como página inteira, igual às outras janelas do app (as mesmas regras do bloco dialog-scroll-lock-pages, 1.12.288).
  + '@media(hover:none),(pointer:coarse){'
  + '#apAutoArchiveDialog.dialog.open{padding:0 env(safe-area-inset-right) 0 env(safe-area-inset-left)!important}'
  + '#apAutoArchiveDialog.dialog.open>.sheet{width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;border-width:0!important;border-radius:0!important;box-shadow:none!important;padding-top:calc(18px + env(safe-area-inset-top))!important;padding-bottom:calc(92px + env(safe-area-inset-bottom))!important}'
  + 'html[data-agenda-design=pro-tl] #apAutoArchiveDialog.dialog.open>.sheet{padding-bottom:calc(22px + env(safe-area-inset-bottom))!important}'
  + '}';

const JS = String.raw`(function(){
 'use strict';
 // 1.12.306: arquiva sozinho quem passou ${TOLERANCE_DAYS} dias do vencimento sem pagamento registrado (pedido do Tiago, 23/11/2026).
 // É o Arquivar de sempre (archived:true): sai da agenda, o despertador das aulas para, os treinos são bloqueados no app do aluno ao
 // sincronizar e a cobrança continua. Nada é apagado.
 const TOLERANCE=${TOLERANCE_DAYS},DELAY=6000,REASON='payment-auto',KEY='agendaAutoArchive_v1',ID='apAutoArchiveDialog';
 let timer=0,autoRows=[],backlogRows=[],backlogShown=false;
 const today=()=>iso(new Date());
 function plusDays(date,days){const d=parseDate(date);d.setDate(d.getDate()+days);return iso(d)}
 // Marcador deste aparelho: o dia em que o arquivamento automático passou a valer.
 function config(){
  let c=null;try{c=JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){}
  if(!c||typeof c!=='object'||!validWorkoutDate(c.since)){c={since:today(),backlogAsked:false};remember(c)}
  return c;
 }
 function remember(c){try{localStorage.setItem(KEY,JSON.stringify(c))}catch(_){}}
 const late=s=>-daysUntil(s.dueDate);
 // Reativado (Desfazer ou Alunos → Arquivados) no dia do vencimento ou depois: fica ativo até o pagamento ser registrado.
 function keptActive(s){if(!s.reactivatedAt)return false;const at=new Date(s.reactivatedAt);return !isNaN(at.getTime())&&iso(at)>=s.dueDate}
 function overdue(){return state.students.filter(s=>s&&s.archived!==true&&s.financeEnabled===true&&validWorkoutDate(s.dueDate)&&late(s)>=TOLERANCE&&!keptActive(s))}
 const row=s=>({id:s.id,name:s.name||'Aluno',dueDate:s.dueDate,late:late(s)});
 function studentContext(){try{return !!window.parent?.__AP_STUDENT_CONTEXT}catch(_){return false}}
 // Backup restaurado e ainda não reunido com a conta: os dados podem ser antigos (pagamentos depois do backup não estão lá).
 function restoredPending(){try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('agenda_backup_restored_pending_sync_v1_')&&localStorage.getItem(k)==='true')return true}}catch(_){}return false}
 function paused(){return document.hidden||globalThis.APBackupRestoring===true||studentContext()||restoredPending()}
 // Automático só para quem completou os ${TOLERANCE_DAYS} dias depois do marcador; quem já estava atrasado antes vai para a lista de decisão.
 function split(c){const list=overdue();return {auto:list.filter(s=>plusDays(s.dueDate,TOLERANCE)>c.since),backlog:list.filter(s=>plusDays(s.dueDate,TOLERANCE)<=c.since)}}
 // Uma gravação só para todos: ou arquiva todos, ou nenhum.
 function archive(list,text){
  if(!list.length)return true;
  const at=new Date().toISOString(),ids=new Set(list.map(s=>s.id));
  const students=state.students.map(s=>ids.has(s.id)?{...s,archived:true,archivedAt:at,archiveReason:REASON,archiveDueDate:s.dueDate}:s);
  const history=[...list.map(s=>({id:id(),at,text:text+' · '+s.name+' · mensalidade vencida em '+fmtDate(s.dueDate)+' ('+late(s)+' dias sem pagamento)'})),...state.history];
  try{localStorage.setItem(DB_KEY,JSON.stringify({...state,students,history}))}catch(_){toast('Não foi possível arquivar por falta de pagamento. Nada foi alterado.',6500);return false}
  state.students=students;state.history=history;
  renderAll();if(currentProfileStudentId&&ids.has(currentProfileStudentId))renderStudentProfile();
  syncNativeAlarms();
  return true;
 }
 function item(r,action){return '<li><span><strong>'+hesc(r.name)+'</strong><small>Venceu em '+r.dueDate.slice(8,10)+'/'+r.dueDate.slice(5,7)+' · '+r.late+(r.late===1?' dia':' dias')+' de atraso</small></span>'+action+'</li>'}
 function dialog(){
  let d=document.getElementById(ID);if(d)return d;
  d=document.createElement('div');d.id=ID;d.className='dialog';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','apAutoArchiveTitle');
  d.innerHTML='<div class="sheet"><div class="sheet-head"><h3 id="apAutoArchiveTitle"></h3><button class="close" type="button" data-auto-archive="close" aria-label="Fechar">×</button></div>'
   +'<section data-part="auto"><p class="ap-auto-archive-text">Mensalidade vencida há '+TOLERANCE+' dias ou mais, sem pagamento registrado.</p><ul class="ap-auto-archive-list" data-list="auto"></ul>'
   +'<p class="ap-auto-archive-text">Arquivado, o aluno sai da agenda e os treinos ficam bloqueados no app dele. A cobrança continua no Financeiro. Quando pagar, registre o pagamento e reative em Alunos → Arquivados.</p></section>'
   +'<section data-part="backlog"><h4>Já estavam atrasados</h4><p class="ap-auto-archive-text">O arquivamento automático começa agora. Estes alunos já tinham '+TOLERANCE+' dias ou mais de atraso antes da atualização. Se fechar, eles continuam ativos e dá para arquivar pelo Financeiro.</p><ul class="ap-auto-archive-list" data-list="backlog"></ul>'
   +'<div class="ap-auto-archive-actions"><button class="btn danger full" type="button" data-auto-archive="archive-backlog"></button></div></section>'
   +'<div class="ap-auto-archive-actions"><button class="btn primary full" type="button" data-auto-archive="close" data-role="ack">Entendi</button><button class="btn ghost full" type="button" data-auto-archive="finance">Ver no Financeiro</button></div></div>';
  d.addEventListener('click',event=>{
   const b=event.target.closest('[data-auto-archive]');if(!b)return;const action=b.dataset.autoArchive;
   if(action==='close')closeDialog(ID);
   else if(action==='finance'){closeDialog(ID);showScreen('finance');setFinanceView('overdue')}
   else if(action==='undo')undo(b.dataset.studentId);
   else if(action==='archive-backlog')archiveBacklog();
  });
  // Fechou (×, Fechar, voltar do Android ou outra tela): o aviso foi visto e a lista antiga não é perguntada de novo.
  new MutationObserver(()=>{if(d.classList.contains('open'))return;autoRows=[];if(backlogShown&&backlogRows.length){const c=config();c.backlogAsked=true;remember(c)}backlogRows=[]}).observe(d,{attributes:true,attributeFilter:['class']});
  document.body.appendChild(d);return d;
 }
 function render(){
  autoRows=autoRows.filter(r=>studentById(r.id)?.archived===true);
  backlogRows=backlogRows.filter(r=>{const s=studentById(r.id);return !!s&&s.archived!==true});
  const d=dialog();
  d.querySelector('[data-part="auto"]').hidden=!autoRows.length;
  d.querySelector('[data-part="backlog"]').hidden=!backlogRows.length;
  d.querySelector('[data-list="auto"]').innerHTML=autoRows.map(r=>item(r,'<button class="btn ghost" type="button" data-auto-archive="undo" data-student-id="'+hesc(r.id)+'">Desfazer</button>')).join('');
  d.querySelector('[data-list="backlog"]').innerHTML=backlogRows.map(r=>item(r,'')).join('');
  d.querySelector('[data-auto-archive="archive-backlog"]').textContent=backlogRows.length===1?'Arquivar este aluno':'Arquivar estes '+backlogRows.length+' alunos';
  d.querySelector('#apAutoArchiveTitle').textContent=autoRows.length?(autoRows.length===1?'Aluno arquivado por falta de pagamento':autoRows.length+' alunos arquivados por falta de pagamento'):'Mensalidades atrasadas';
  d.querySelector('[data-part="backlog"] h4').hidden=!autoRows.length;
  const ack=d.querySelector('[data-role="ack"]');ack.textContent=backlogRows.length?'Agora não':'Entendi';ack.className='btn '+(backlogRows.length?'ghost':'primary')+' full';
  return autoRows.length+backlogRows.length;
 }
 function run(){
  clearTimeout(timer);timer=0;
  try{
   if(paused())return {auto:[],backlog:[]};
   const c=config(),groups=split(c),auto=groups.auto,backlog=c.backlogAsked||backlogShown?[]:groups.backlog;
   const rows=auto.map(row);
   if(auto.length&&!archive(auto,'Aluno arquivado automaticamente'))return {auto:[],backlog:[]};
   for(const r of rows)if(!autoRows.some(x=>x.id===r.id))autoRows.push(r);
   if(backlog.length){backlogRows=backlog.map(row);backlogShown=true}
   if((rows.length||backlog.length)&&render())openDialog(ID);
   return {auto:rows.map(r=>r.id),backlog:backlog.map(s=>s.id)};
  }catch(problem){return {auto:[],backlog:[],error:String(problem&&problem.message||problem)}}
 }
 function archiveBacklog(){
  const ids=new Set(backlogRows.map(r=>r.id)),list=overdue().filter(s=>ids.has(s.id));
  if(!list.length){backlogRows=[];if(!render())closeDialog(ID);return}
  const rows=list.map(row);
  if(!archive(list,'Aluno arquivado por falta de pagamento (já estava atrasado)'))return;
  const c=config();c.backlogAsked=true;remember(c);
  backlogRows=[];for(const r of rows)if(!autoRows.some(x=>x.id===r.id))autoRows.push(r);
  if(!render())closeDialog(ID);
 }
 function undo(sid){
  const s=studentById(sid);if(!s||s.archived!==true||s.archiveReason!==REASON){toast('Este aluno não está mais arquivado por falta de pagamento.');autoRows=autoRows.filter(r=>r.id!==sid);if(!render())closeDialog(ID);return}
  if(!confirm('Reativar '+s.name+'?\n\nEle volta para a agenda e os treinos são liberados ao sincronizar. Não será arquivado de novo por esta mensalidade. A cobrança continua.'))return;
  const next={...s,archived:false,archivedAt:'',archiveReason:'',archiveDueDate:'',reactivatedAt:new Date().toISOString()};
  if(!commitWorkoutChange({students:state.students.map(x=>x.id===sid?next:x)},'Arquivamento automático desfeito · '+s.name))return;
  renderAll();if(currentProfileStudentId===sid)renderStudentProfile();syncNativeAlarms();
  autoRows=autoRows.filter(r=>r.id!==sid);if(!render())closeDialog(ID);
  toast('Aluno reativado. A liberação dos treinos será sincronizada.');
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(run,DELAY)}
 // Ao voltar para o app (e quando a conta do professor é carregada), confere de novo.
 const refreshBefore=refreshAgendaState;
 refreshAgendaState=function(){const result=refreshBefore.apply(this,arguments);schedule();return result};
 window.APAutoArchive=Object.freeze({run,schedule,tolerance:TOLERANCE,pending:()=>split(config()).auto.map(s=>s.id)});
 schedule();
})();`;

const BLOCKS = '<style id="ap-finance-auto-archive-css">' + CSS + '</style>\n'
  + '<script id="ap-finance-auto-archive">' + JS + '\n</script>\n';

function editProfessor(html) {
  assert.equal(count(html, '</body>'), 1, 'O fim da página do professor não aparece uma única vez');
  for (const id of ['ap-finance-auto-archive-css', 'ap-finance-auto-archive', 'apAutoArchiveDialog', 'agendaAutoArchive_v1'])
    assert.equal(count(html, id), 0, id + ' já existe no 1.12.305');
  // Dependências do bloco novo: precisam existir no 1.12.305, com estes nomes.
  for (const needed of ['function refreshAgendaState(){', 'function daysUntil(dateStr){', 'function validWorkoutDate(value){',
    'function commitWorkoutChange(changes,', 'function syncNativeAlarms(){', 'function openDialog(id){', 'function closeDialog(id){',
    'function setFinanceView(', 'function hesc(', 'function toggleStudentArchive(sid){'])
    assert.equal(count(html, needed), 1, 'Dependência ausente ou repetida no 1.12.305: ' + needed);
  // Reativar (Alunos → Arquivados) grava reactivatedAt: é o que mantém o aluno ativo até o pagamento ser registrado.
  assert.equal(count(html, 'next.reactivatedAt=new Date().toISOString()'), 1, 'Reativar não grava mais reactivatedAt');
  return html.replace('</body>', () => BLOCKS + '</body>');
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.305');
  assert.equal(source.sequence, 411);
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
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.305 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME, TOLERANCE_DAYS};
