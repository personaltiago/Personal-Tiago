'use strict';

// Gera o pacote 1.12.311 / 417 (sem assinatura) a partir do 1.12.310 / 416 da main (SHA-256 conferido).
// Pedido: Tiago, 24/11/2026 10:05, com print da tela bloqueada sem aviso e do sininho com "1": quando um aluno se cadastrar,
// avisar fora do app, na tela bloqueada, "para agilizar". Na pergunta do app escolheu "Push com Firebase (Recomendado)",
// autorizando o gatilho e guardar o endereço do celular dele no Firebase. Fase 3 de 3:
//  1. funções do Firebase (firebase/functions: avisoNovoCadastro, registrarAparelho, testarAviso);
//  2. Android 1.211 (PushAvisos: canal "Cadastros de alunos", ponte getPushStatus/getPushToken/refreshPushToken/
//     openPushSettings/takePushOpen e os eventos ap-push-token e ap-push-open);
//  3. este conteúdo.
// Agora (blocos novos, antes de </body>):
//  - index.html, ap-push-avisos: no app do professor (Android 1.211 ou mais novo), liga o aviso no celular, guarda o endereço
//    pela função registrarAparelho (de novo só quando o endereço muda ou passa uma semana) e, quando o Tiago toca no aviso,
//    abre "Alunos para aprovar". Expõe window.APPushAvisos (estado, testar, ajustar) para o cartão do professor.
//    No app do aluno, no navegador e no APK antigo não faz nada.
//  - professor.html, ap-push-avisos-teacher: cartão "Aviso de novo cadastro" em Sons e alertas, logo abaixo do Despertador,
//    com o estado, o botão Testar (função testarAviso) e o toque no cartão abrindo o canal no Android.
// Não muda: o despertador, os sons, o descanso do treino, cronômetros, alarmes, notificações que já existem, o cadastro do
// aluno, as regras do Firestore, login, financeiro, treinos e mascotes. Nenhum bloco existente é alterado.
//
// Uso: node tools/gerar-aviso-cadastro-1.12.311.cjs [pacote-1.12.310.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.311';
const sequence = 417;
const title = 'Aviso de novo cadastro na tela bloqueada';
const summary = 'Quando um aluno se cadastra, o celular do professor mostra "Novo cadastro" na tela bloqueada, mesmo com o app fechado. Precisa do app Android 1.211.';
const notesText = 'Aviso de novo cadastro na tela bloqueada.\n\n'
  + 'Quando um aluno se cadastra pelo link, o seu celular mostra "Novo cadastro: <primeiro nome> se cadastrou. Toque para '
  + 'aprovar." na tela bloqueada, mesmo com o app fechado. O toque abre a lista Alunos para aprovar.\n\n'
  + 'Em Mais > Sons e alertas, o cartão "Aviso de novo cadastro" mostra se o aviso está ligado neste celular. O botão Testar '
  + 'manda um aviso de teste. Tocar no cartão abre o ajuste do aviso no Android (som e tela de bloqueio).\n\n'
  + 'Precisa do app Android 1.211 ou mais novo. No app antigo o cartão pede a atualização e nada mais muda.\n\n'
  + 'O que não muda: o despertador, os sons, o descanso do treino, os cronômetros, as notificações que já existem, o cadastro '
  + 'do aluno, treinos, agenda, financeiro, login e mascotes.\n\n'
  + 'Inclui tudo do 1.12.310 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.310-Sons-E-Alertas-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '8a60b5d5c6cde7c0cc944de0a06675f3a278c0fcbe6df0348193bd0d5d75ff19';
const TARGET_NAME = 'AgendaPersonal-1.12.311-Aviso-Cadastro-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// index.html: liga, registra, testa e abre a aprovação. Só no app do professor com o Android 1.211 ou mais novo.
const STUDENT_JS = String.raw`(function(){
'use strict';
// Aviso "Novo cadastro" na tela bloqueada (1.12.311, pedido do Tiago em 24/11/2026; precisa do Android 1.211).
const FUNCOES='https://southamerica-east1-agenda-personal-bdb58.cloudfunctions.net/';
const MARCA='apPushAparelho:',SEMANA=6048e5;
let registro=null,teste=null,erro='';
const nativo=()=>{try{const a=window.Android;return a&&typeof a.getPushVersion==='function'&&a.getPushVersion()>=1?a:null}catch(e){return null}};
const contas=()=>window.APaccounts;
const conta=()=>{try{return contas()?.isTeacher?.()===true&&contas().teacherUid?.()||''}catch(e){return ''}};
function lerNativo(){const a=nativo();if(!a)return null;try{const s=JSON.parse(a.getPushStatus()||'{}');return s&&typeof s==='object'?s:{}}catch(e){return {erro:'estado-indisponivel'}}}
// Marca do endereço (não o endereço): só para saber se mudou desde o último registro.
function marca(t){let h=0x811c9dc5;for(let i=0;i<t.length;i++)h=Math.imul(h^t.charCodeAt(i),16777619)>>>0;return h.toString(16).padStart(8,'0')+'.'+t.length}
async function chamar(nome,data){
 const token=await contas().getPhotoToken();let r;
 try{r=await fetch(FUNCOES+nome,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({data:data||{}}),cache:'no-store',signal:globalThis.AbortSignal?.timeout?.(20000)})}
 catch(e){throw Error('Sem conexão com o Firebase. Confira a internet e tente de novo.')}
 let corpo=null;try{corpo=await r.json()}catch(e){}
 if(r.status===404)throw Error('O aviso ainda não foi ligado no Firebase: falta publicar as funções.');
 const s=corpo?.error?.status||'';
 if(!r.ok||s)throw Error(s==='PERMISSION_DENIED'||s==='UNAUTHENTICATED'?'Só a conta do professor pode ligar o aviso.':'O Firebase não respondeu ('+(s||r.status)+'). Tente de novo.');
 return corpo?.result??null;
}
async function registrar(forcar){
 const a=nativo(),uid=conta();if(!a||!uid)return false;
 const token=String(a.getPushToken()||'');if(!token)return false;
 const m=marca(token);let salvo=null;try{salvo=JSON.parse(localStorage.getItem(MARCA+uid)||'null')}catch(e){}
 if(!forcar&&salvo?.marca===m&&Date.now()-Number(salvo.em||0)<SEMANA)return true;
 await chamar('registrarAparelho',{token,versaoApp:String(lerNativo()?.app||'')});
 try{localStorage.setItem(MARCA+uid,JSON.stringify({marca:m,em:Date.now()}))}catch(e){}
 return true;
}
function avisar(){try{document.getElementById('apPreviewTeacher')?.contentWindow?.dispatchEvent(new Event('ap-push-status'))}catch(e){}}
function sincronizar(forcar){
 if(registro)return registro;
 registro=registrar(forcar===true).then(ok=>{erro='';return ok},e=>{erro=e?.message||'Não foi possível ligar o aviso.';return false}).finally(()=>{registro=null;avisar()});
 return registro;
}
function ligar(){const a=nativo();if(!a||!conta())return;try{a.refreshPushToken()}catch(e){}try{if(a.getPushToken())sincronizar()}catch(e){}}
function abrirAprovacao(){
 try{window.APopenTeacher?.()}catch(e){}
 const abrir=()=>{try{const w=document.getElementById('apPreviewTeacher')?.contentWindow;if(typeof w?.openStudentApprovals==='function'){w.openStudentApprovals();return true}}catch(e){}return false};
 if(!abrir())window.addEventListener('ap-teacher-ready',abrir,{once:true});
}
// O Android guarda o toque no aviso até o app do professor estar pronto.
function verAbertura(){const a=nativo();if(!a||!conta())return;let tipo='';try{tipo=String(a.takePushOpen()||'')}catch(e){}if(tipo==='cadastro')abrirAprovacao()}
function estado(){
 if(!window.Android)return {nivel:'oculto'};
 const s=lerNativo();
 if(!s)return {nivel:'indisponivel',rotulo:'Precisa do app 1.211',texto:'O aviso na tela bloqueada funciona no app Android 1.211 ou mais novo. Atualize o app para ligar.',ajustar:false,testar:false};
 if(s.configurado===false)return {nivel:'indisponivel',rotulo:'Indisponível neste app',texto:'Este app foi gerado sem a configuração do Firebase. Instale o app oficial mais recente.',ajustar:false,testar:false};
 if(s.permissao===false)return {nivel:'atencao',rotulo:'Notificações desligadas',texto:'As notificações do Agenda Personal estão desligadas neste celular. Toque no cartão para ligar.',ajustar:true,testar:false};
 if(s.canal==='desligado')return {nivel:'atencao',rotulo:'Desligado',texto:'O aviso de cadastro está desligado neste celular. Toque no cartão para ligar.',ajustar:true,testar:false};
 if(!s.token)return s.erro&&s.erro!=='sem-configuracao'?{nivel:'atencao',rotulo:'Sem conexão',texto:'Não foi possível ligar o aviso agora. Confira a internet e abra esta tela de novo.',ajustar:true,testar:false}:{nivel:'aguarde',rotulo:'Ligando…',texto:'Ligando o aviso neste celular.',ajustar:true,testar:false};
 if(erro)return {nivel:'atencao',rotulo:'Não ligado',texto:erro,ajustar:true,testar:true};
 if(s.telaBloqueada===false)return {nivel:'atencao',rotulo:'Fora da tela bloqueada',texto:'O aviso chega, mas não aparece na tela bloqueada. Toque no cartão e permita mostrar na tela de bloqueio.',ajustar:true,testar:true};
 if(s.canal==='silencioso')return {nivel:'atencao',rotulo:'Silencioso',texto:'O aviso chega sem som. Toque no cartão para ligar o som.',ajustar:true,testar:true};
 return {nivel:'ok',rotulo:'Ligado',texto:'Chega na tela bloqueada quando um aluno se cadastra, mesmo com o app fechado. O toque abre Alunos para aprovar.',ajustar:true,testar:true};
}
function testar(){
 if(teste)return teste;
 teste=(async()=>{
  if(!lerNativo()?.token)throw Error('O aviso ainda não está ligado neste celular.');
  await registrar(true);erro='';
  const r=await chamar('testarAviso',{});
  if(!(Number(r?.enviados)>0))throw Error(Number(r?.aparelhos)>0?'O Firebase não entregou ao celular. Abra o app de novo e teste outra vez.':'Nenhum celular com o aviso ligado.');
  return 'Aviso de teste enviado. Ele aparece em poucos segundos e fica na tela bloqueada até você abrir.';
 })().finally(()=>{teste=null;avisar()});
 return teste;
}
function ajustar(){try{nativo()?.openPushSettings()}catch(e){}}
window.APPushAvisos=Object.freeze({estado,testar,ajustar});
window.addEventListener('ap-teacher-ready',()=>{ligar();verAbertura()});
window.addEventListener('ap-push-token',()=>sincronizar());
window.addEventListener('ap-push-open',verAbertura);
window.addEventListener('ap-account-changed',()=>{erro='';avisar()});
})();`;

// professor.html: o cartão em Sons e alertas, logo abaixo do Despertador (fora das abas Professor/Alunos dos sons).
const TEACHER_JS = String.raw`(function(){
'use strict';
// Cartão "Aviso de novo cadastro" (1.12.311). Quem liga, registra e testa é o ap-push-avisos do app principal.
const tela=document.getElementById('screen-settings'),despertador=tela?.querySelector('.alarm-tools');
if(!despertador||document.getElementById('apPushCard'))return;
const avisos=()=>{try{return window.parent.APPushAvisos||null}catch(e){return null}};
const cartao=document.createElement('section');
cartao.className='sound-choice-group';cartao.id='apPushCard';cartao.hidden=true;cartao.style.margin='0 0 10px';
cartao.setAttribute('aria-label','Aviso de novo cadastro');
cartao.innerHTML='<div class="sound-preview-row"><button class="sound-button" type="button" id="apPushAdjust"><strong>Aviso de novo cadastro</strong><span id="apPushLabel">Verificando…</span></button><button class="btn sound-preview-button" type="button" id="apPushTest">Testar</button></div><p class="sound-preview-help" id="apPushHelp"></p><p class="sound-preview-help" id="apPushStatus" role="status" aria-live="polite" hidden></p>';
despertador.after(cartao);
const $=id=>document.getElementById(id);
let mensagem='',falha=false,enviando=false;
function mostrar(){
 const a=avisos();let e=null;
 try{e=a?.estado()}catch(x){e={nivel:'atencao',rotulo:'Indisponível',texto:'Não foi possível ler o estado do aviso.',ajustar:false,testar:false}}
 if(!e||e.nivel==='oculto'){cartao.hidden=true;return}
 cartao.hidden=false;
 $('apPushLabel').textContent=e.rotulo;
 $('apPushHelp').textContent=e.texto;
 $('apPushHelp').style.color=e.nivel==='atencao'||e.nivel==='indisponivel'?'var(--amber)':'';
 $('apPushAdjust').disabled=!e.ajustar;
 const testar=$('apPushTest');
 testar.hidden=e.nivel==='indisponivel';
 testar.disabled=enviando||!e.testar;
 testar.style.opacity=!enviando&&!e.testar?'.45':'';
 testar.textContent=enviando?'Enviando…':'Testar';
 $('apPushStatus').hidden=!mensagem;
 $('apPushStatus').textContent=mensagem;
 $('apPushStatus').style.color=falha?'var(--amber)':'';
}
$('apPushAdjust').onclick=()=>{try{avisos()?.ajustar()}catch(e){}};
$('apPushTest').onclick=async()=>{
 const a=avisos();if(!a||enviando)return;
 enviando=true;mensagem='';falha=false;mostrar();
 try{mensagem=await a.testar();falha=false}catch(e){mensagem=e?.message||'Não foi possível testar.';falha=true}
 enviando=false;mostrar();
};
window.addEventListener('ap-push-status',mostrar);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&tela.classList.contains('active'))mostrar()});
if(window.MutationObserver)new MutationObserver(()=>{if(tela.classList.contains('active')){if(!enviando){mensagem='';falha=false}mostrar()}}).observe(tela,{attributes:true,attributeFilter:['class']});
mostrar();
})();`;

const STUDENT_BLOCK = '<script id="ap-push-avisos">' + STUDENT_JS + '\n</script>\n';
const TEACHER_BLOCK = '<script id="ap-push-avisos-teacher">' + TEACHER_JS + '\n</script>\n';

function editStudent(html) {
  assert.equal(count(html, 'ap-push-avisos'), 0, 'ap-push-avisos já existe no 1.12.310');
  assert.equal(count(html, 'APPushAvisos'), 0, 'APPushAvisos já existe no 1.12.310');
  // Dependências conferidas no 1.12.310 (contas, painel do professor e a lista de aprovação)
  for (const needed of ['teacherUid:()=>A()?s.uid:null', 'getPhotoToken:O', 'return r.auth.currentUser.getIdToken(false)}',
    'window.APopenTeacher=async function(){', '<iframe id="apPreviewTeacher" title="Painel do professor"></iframe>',
    'window.dispatchEvent(new Event("ap-teacher-ready"))', 'window.dispatchEvent(new Event("ap-account-changed"))'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.310 (index.html): ' + needed);
  const end = html.lastIndexOf('</body>');
  assert.ok(end > 0 && /^<\/body>\s*<\/html>\s*$/.test(html.slice(end)), 'O fim da página do aluno não é </body></html>');
  return html.slice(0, end) + STUDENT_BLOCK + html.slice(end);
}

function editProfessor(html) {
  assert.equal(count(html, 'ap-push-avisos'), 0, 'ap-push-avisos-teacher já existe no 1.12.310');
  assert.equal(count(html, 'apPushCard'), 0, 'apPushCard já existe no 1.12.310');
  assert.equal(count(html, '</body>'), 1, 'O fim da página do professor não aparece uma única vez');
  for (const needed of ['<section id="screen-settings" class="screen">', '<div class="alarm-tools"><button id="alarmSettingsButton"',
    'window.openStudentApprovals=openStudentApprovals;', 'function openStudentApprovals() {', '.sound-choice-group',
    '.sound-preview-row{display:flex', '.sound-preview-help{color:var(--muted)', '--amber:'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.310 (professor.html): ' + needed);
  assert.equal(count(html, 'class="alarm-tools"'), 1, 'Mais de um Despertador na página: rever a âncora do cartão');
  return html.replace('</body>', () => TEACHER_BLOCK + '</body>');
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.310');
  assert.equal(source.sequence, 416);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notesText.length <= 4000, 'notas: ' + notesText.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'index.html': editStudent(original.files['index.html']), 'professor.html': editProfessor(original.files['professor.html'])};
  return {...original, files, version, sequence, notes: notesText, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.310 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editStudent, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME, STUDENT_JS, TEACHER_JS};
