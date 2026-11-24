'use strict';

// Gera o pacote 1.12.312 / 418 (sem assinatura) a partir do 1.12.311 / 417 da main (SHA-256 conferido).
// Pedido: Tiago, 24/11/2026 10:05 (aviso de cadastro "na tela bloqueada" para agilizar). Às 11:32 ele mudou o plano: "não faz
// sentido eu precisar lá dessa parte. Era só o próprio aplicativo notificar" e "é só ele jogar na tela a notificação". Na pergunta
// do app escolheu "Sim, do meu jeito (Recomendado)", que dizia: "O app mostra a notificação quando o sininho recebe um cadastro,
// sem Blaze e sem console. Funciona com o app aberto ou em segundo plano, mas não se o Xiaomi tiver fechado o app".
// Precisa do Android 1.211 (AvisosCadastro: ponte getNoticeVersion/getNoticeStatus/showRegistrationNotice/openNoticeSettings/
// takeNoticeOpen e o evento ap-notice-open).
// Agora:
//  - index.html: sai ap-push-avisos (do 1.12.311: registrava o celular nas funções do Firebase para o push, que ficou guardado)
//    e entra ap-aviso-cadastro, no mesmo lugar: no app do professor com o Android 1.211, acompanha os cadastros à espera de
//    aprovação (a mesma consulta do sininho, no mesmo Firebase do app) e, quando chega um novo com o app em segundo plano ou a tela
//    bloqueada, pede ao Android para mostrar "Novo cadastro: <primeiro nome> se cadastrou. Toque para aprovar.". O toque abre
//    "Alunos para aprovar". Expõe window.APAvisoCadastro (estado, testar, ajustar) para o cartão do professor.
//  - professor.html: sai ap-push-avisos-teacher e entra ap-aviso-cadastro-teacher, no mesmo lugar: o mesmo cartão "Aviso de novo
//    cadastro" em Sons e alertas, com o estado do aviso local, o Testar (mostra um aviso de teste no próprio celular) e o ajuste.
// Não muda: o sininho, o despertador, os sons, o descanso do treino, cronômetros, alarmes, notificações que já existem, o cadastro
// do aluno, regras e dados do Firestore (só lê, como o sininho), login, financeiro, treinos e mascotes.
//
// Uso: node tools/gerar-aviso-local-1.12.312.cjs [pacote-1.12.311.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const anterior = require('./gerar-aviso-cadastro-1.12.311.cjs');

const version = '1.12.312';
const sequence = 418;
const title = 'Aviso de novo cadastro na tela';
const summary = 'Quando um aluno se cadastra, o app mostra "Novo cadastro" na tela, com o app aberto ou em segundo plano. Precisa do app Android 1.211.';
const notesText = 'Aviso de novo cadastro na tela.\n\n'
  + 'Quando um aluno se cadastra pelo link e o app está em segundo plano ou a tela está bloqueada, o seu celular mostra '
  + '"Novo cadastro: <primeiro nome> se cadastrou. Toque para aprovar.", igual ao despertador. O toque abre a lista Alunos para '
  + 'aprovar. Com o app na tela, o sininho continua mostrando o cadastro, como hoje.\n\n'
  + 'Se o celular fechar o app, não há aviso: o cadastro aparece quando você abrir. No Xiaomi, deixar a bateria do app em '
  + '"Sem restrições" mantém o aviso funcionando por mais tempo.\n\n'
  + 'Em Mais > Sons e alertas, o cartão "Aviso de novo cadastro" mostra se o aviso está ligado. O botão Testar mostra um aviso '
  + 'de teste. Tocar no cartão abre o ajuste do aviso no Android (som e tela de bloqueio).\n\n'
  + 'Precisa do app Android 1.211 ou mais novo. No app antigo o cartão pede a atualização e nada mais muda.\n\n'
  + 'O que não muda: o sininho, o despertador, os sons, o descanso do treino, os cronômetros, as notificações que já existem, '
  + 'o cadastro do aluno, treinos, agenda, financeiro, login e mascotes.\n\n'
  + 'Inclui tudo do 1.12.311 e deve ser instalado no lugar dele (ou do 1.12.310).';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.311-Aviso-Cadastro-Para-Assinar.agenda.json';
const SOURCE_SHA256 = 'e5613f6e85648b3b355eb3fd2c4196613a3d95e509b6369c79447f9e2c2240c7';
const TARGET_NAME = 'AgendaPersonal-1.12.312-Aviso-Cadastro-Local-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// index.html: acompanha os cadastros (como o sininho) e pede ao Android para mostrar o aviso. Só no app do professor com o 1.211.
const STUDENT_JS = String.raw`(function(){
'use strict';
// Aviso "Novo cadastro" na tela (1.12.312; pedido do Tiago em 24/11/2026: "é só ele jogar na tela a notificação"; Android 1.211).
// Só lê os cadastros à espera de aprovação, com a mesma consulta do sininho; não grava nada no Firebase.
const VISTOS='apAvisoCadastroVistos:',LIMITE=300,ERRO='Não foi possível acompanhar os cadastros agora.';
let sdk=null,parar=null,ouvindo='',ligando=false,erro='';
const nativo=()=>{try{const a=window.Android;return a&&typeof a.getNoticeVersion==='function'&&a.getNoticeVersion()>=1?a:null}catch(e){return null}};
const contas=()=>window.APaccounts;
const conta=()=>{try{return contas()?.isTeacher?.()===true&&contas().teacherUid?.()||''}catch(e){return ''}};
function lerNativo(){const a=nativo();if(!a)return null;try{const s=JSON.parse(a.getNoticeStatus()||'{}');return s&&typeof s==='object'?s:{}}catch(e){return {erro:'estado-indisponivel'}}}
// Só o primeiro nome vai para a tela bloqueada, cortado por letra (sem partir emoji).
function primeiroNome(nome){return Array.from(String(nome??'').trim().split(/\s+/)[0]||'').filter(c=>c>=' '&&c!=='\u007f').slice(0,40).join('')}
function lerVistos(uid){try{const v=JSON.parse(localStorage.getItem(VISTOS+uid)||'null');return Array.isArray(v)?v.filter(x=>typeof x==='string'):null}catch(e){return null}}
function guardarVistos(uid,lista){try{localStorage.setItem(VISTOS+uid,JSON.stringify(lista.slice(-LIMITE)))}catch(e){}}
function avisar(){try{document.getElementById('apPreviewTeacher')?.contentWindow?.dispatchEvent(new Event('ap-aviso-status'))}catch(e){}}
function receber(uid,docs){
 const a=nativo();if(!a||uid!==conta())return;
 const vistos=lerVistos(uid);
 // Primeira vez neste aparelho: quem já esperava aprovação não vira aviso (o sininho mostra).
 if(vistos===null){guardarVistos(uid,docs.map(d=>d.id));return}
 const conhecidos=new Set(vistos),novos=docs.filter(d=>!conhecidos.has(d.id));
 if(!novos.length)return;
 guardarVistos(uid,vistos.concat(novos.map(d=>d.id)));
 if(!document.hidden)return; // com o app na tela, o sininho já mostra
 for(const d of novos){
  let nome='';try{nome=primeiroNome(d.data()?.nome)}catch(e){}
  try{a.showRegistrationNotice(JSON.stringify({tipo:'cadastro',titulo:'Novo cadastro',texto:(nome?nome+' se cadastrou':'Um aluno se cadastrou')+'. Toque para aprovar.',aluno:d.id}))}catch(e){}
 }
}
function pararDeOuvir(){try{parar?.()}catch(e){}parar=null;ouvindo=''}
function ouvir(){
 const uid=conta();
 if(!sdk||!uid||sdk.auth.currentUser?.uid!==uid){pararDeOuvir();return}
 if(parar&&ouvindo===uid)return;
 pararDeOuvir();ouvindo=uid;
 const consulta=sdk.query(sdk.collection(sdk.db,'usuarios'),sdk.where('professorId','==',uid),sdk.where('perfil','==','aluno'),sdk.where('ativo','==',false));
 parar=sdk.onSnapshot(consulta,f=>{erro='';receber(uid,f.docs);avisar()},()=>{pararDeOuvir();erro=ERRO;avisar()});
}
async function ligar(){
 if(ligando||!nativo()||!conta())return;
 ligando=true;
 try{
  if(!sdk){sdk=await contas().registrationSdk();sdk.onAuthStateChanged(sdk.auth,ouvir)}
  ouvir();
 }catch(e){erro=ERRO;avisar()}
 finally{ligando=false}
}
function abrirAprovacao(){
 try{window.APopenTeacher?.()}catch(e){}
 const abrir=()=>{try{const w=document.getElementById('apPreviewTeacher')?.contentWindow;if(typeof w?.openStudentApprovals==='function'){w.openStudentApprovals();return true}}catch(e){}return false};
 if(!abrir())window.addEventListener('ap-teacher-ready',abrir,{once:true});
}
// O Android guarda o toque no aviso até o app do professor estar pronto.
function verAbertura(){const a=nativo();if(!a||!conta())return;let tipo='';try{tipo=String(a.takeNoticeOpen()||'')}catch(e){}if(tipo==='cadastro')abrirAprovacao()}
function estado(){
 if(!window.Android)return {nivel:'oculto'};
 const s=lerNativo();
 if(!s)return {nivel:'indisponivel',rotulo:'Precisa do app 1.211',texto:'O aviso na tela precisa do app Android 1.211 ou mais novo. Atualize o app para ligar.',ajustar:false,testar:false};
 if(s.permissao===false)return {nivel:'atencao',rotulo:'Notificações desligadas',texto:'As notificações do Agenda Personal estão desligadas neste celular. Toque no cartão para ligar.',ajustar:true,testar:false};
 if(s.canal==='desligado')return {nivel:'atencao',rotulo:'Desligado',texto:'O aviso de cadastro está desligado neste celular. Toque no cartão para ligar.',ajustar:true,testar:false};
 if(erro)return {nivel:'atencao',rotulo:'Sem conexão',texto:erro+' Confira a internet e abra o app de novo.',ajustar:true,testar:true};
 if(s.telaBloqueada===false)return {nivel:'atencao',rotulo:'Fora da tela bloqueada',texto:'O aviso aparece, mas não na tela bloqueada. Toque no cartão e permita mostrar na tela de bloqueio.',ajustar:true,testar:true};
 if(s.canal==='silencioso')return {nivel:'atencao',rotulo:'Silencioso',texto:'O aviso aparece sem som. Toque no cartão para ligar o som.',ajustar:true,testar:true};
 return {nivel:'ok',rotulo:'Ligado',texto:'Avisa na tela quando um aluno se cadastra, com o app aberto ou em segundo plano. Se o celular fechar o app, o cadastro aparece ao abrir. No Xiaomi, deixe a bateria do app em "Sem restrições".',ajustar:true,testar:true};
}
function testar(){
 const a=nativo();let ok=false;
 try{ok=!!a&&a.showRegistrationNotice(JSON.stringify({tipo:'teste',titulo:'Teste do aviso',texto:'Assim chega o aviso de um cadastro novo.'}))===true}catch(e){}
 return ok?Promise.resolve('Aviso de teste mostrado. Bloqueie a tela: ele fica lá até você abrir.'):Promise.reject(Error(a?'O Android não mostrou o aviso. Confira as notificações do app.':'O aviso precisa do app Android 1.211.'));
}
function ajustar(){try{nativo()?.openNoticeSettings()}catch(e){}}
window.APAvisoCadastro=Object.freeze({estado,testar,ajustar});
window.addEventListener('ap-teacher-ready',()=>{ligar();verAbertura()});
window.addEventListener('ap-notice-open',verAbertura);
window.addEventListener('ap-account-changed',()=>{pararDeOuvir();erro='';avisar()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&conta())ligar()});
window.addEventListener('online',()=>{if(conta())ligar()});
})();`;

// professor.html: o mesmo cartão do 1.12.311 em Sons e alertas, ligado ao aviso local.
const TEACHER_JS = String.raw`(function(){
'use strict';
// Cartão "Aviso de novo cadastro" (1.12.312). Quem acompanha os cadastros e mostra o aviso é o ap-aviso-cadastro do app principal.
const tela=document.getElementById('screen-settings'),despertador=tela?.querySelector('.alarm-tools');
if(!despertador||document.getElementById('apAvisoCard'))return;
const avisos=()=>{try{return window.parent.APAvisoCadastro||null}catch(e){return null}};
const cartao=document.createElement('section');
cartao.className='sound-choice-group';cartao.id='apAvisoCard';cartao.hidden=true;cartao.style.margin='0 0 10px';
cartao.setAttribute('aria-label','Aviso de novo cadastro');
cartao.innerHTML='<div class="sound-preview-row"><button class="sound-button" type="button" id="apAvisoAdjust"><strong>Aviso de novo cadastro</strong><span id="apAvisoLabel">Verificando…</span></button><button class="btn sound-preview-button" type="button" id="apAvisoTest">Testar</button></div><p class="sound-preview-help" id="apAvisoHelp"></p><p class="sound-preview-help" id="apAvisoStatus" role="status" aria-live="polite" hidden></p>';
despertador.after(cartao);
const $=id=>document.getElementById(id);
let mensagem='',falha=false,enviando=false;
function mostrar(){
 const a=avisos();let e=null;
 try{e=a?.estado()}catch(x){e={nivel:'atencao',rotulo:'Indisponível',texto:'Não foi possível ler o estado do aviso.',ajustar:false,testar:false}}
 if(!e||e.nivel==='oculto'){cartao.hidden=true;return}
 cartao.hidden=false;
 $('apAvisoLabel').textContent=e.rotulo;
 $('apAvisoHelp').textContent=e.texto;
 $('apAvisoHelp').style.color=e.nivel==='atencao'||e.nivel==='indisponivel'?'var(--amber)':'';
 $('apAvisoAdjust').disabled=!e.ajustar;
 const testar=$('apAvisoTest');
 testar.hidden=e.nivel==='indisponivel';
 testar.disabled=enviando||!e.testar;
 testar.style.opacity=!enviando&&!e.testar?'.45':'';
 testar.textContent=enviando?'Enviando…':'Testar';
 $('apAvisoStatus').hidden=!mensagem;
 $('apAvisoStatus').textContent=mensagem;
 $('apAvisoStatus').style.color=falha?'var(--amber)':'';
}
$('apAvisoAdjust').onclick=()=>{try{avisos()?.ajustar()}catch(e){}};
$('apAvisoTest').onclick=async()=>{
 const a=avisos();if(!a||enviando)return;
 enviando=true;mensagem='';falha=false;mostrar();
 try{mensagem=await a.testar();falha=false}catch(e){mensagem=e?.message||'Não foi possível testar.';falha=true}
 enviando=false;mostrar();
};
window.addEventListener('ap-aviso-status',mostrar);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&tela.classList.contains('active'))mostrar()});
if(window.MutationObserver)new MutationObserver(()=>{if(tela.classList.contains('active')){if(!enviando){mensagem='';falha=false}mostrar()}}).observe(tela,{attributes:true,attributeFilter:['class']});
mostrar();
})();`;

const OLD_STUDENT_BLOCK = '<script id="ap-push-avisos">' + anterior.STUDENT_JS + '\n</script>\n';
const OLD_TEACHER_BLOCK = '<script id="ap-push-avisos-teacher">' + anterior.TEACHER_JS + '\n</script>\n';
const STUDENT_BLOCK = '<script id="ap-aviso-cadastro">' + STUDENT_JS + '\n</script>\n';
const TEACHER_BLOCK = '<script id="ap-aviso-cadastro-teacher">' + TEACHER_JS + '\n</script>\n';

function editStudent(html) {
  assert.equal(count(html, OLD_STUDENT_BLOCK), 1, 'ap-push-avisos do 1.12.311 não aparece uma única vez (ou mudou)');
  assert.equal(count(html, 'ap-aviso-cadastro'), 0, 'ap-aviso-cadastro já existe no 1.12.311');
  for (const needed of ['teacherUid:()=>A()?s.uid:null', 'registrationSdk:async()=>{await I();if(!A())throw Error("Entre com a conta do professor.");return r;}',
    'window.APopenTeacher=async function(){', '<iframe id="apPreviewTeacher" title="Painel do professor"></iframe>',
    'window.dispatchEvent(new Event("ap-teacher-ready"))', 'window.dispatchEvent(new Event("ap-account-changed"))'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.311 (index.html): ' + needed);
  const out = html.replace(OLD_STUDENT_BLOCK, () => STUDENT_BLOCK);
  assert.equal(count(out, 'APPushAvisos'), 0, 'Sobrou referência ao push no index.html');
  return out;
}

function editProfessor(html) {
  assert.equal(count(html, OLD_TEACHER_BLOCK), 1, 'ap-push-avisos-teacher do 1.12.311 não aparece uma única vez (ou mudou)');
  assert.equal(count(html, 'apAvisoCard'), 0, 'apAvisoCard já existe no 1.12.311');
  for (const needed of ['<section id="screen-settings" class="screen">', '<div class="alarm-tools"><button id="alarmSettingsButton"',
    'window.openStudentApprovals=openStudentApprovals;', 'function openStudentApprovals() {', '--amber:',
    // A consulta do sininho que este aviso repete (mesmo Firebase do app, mesmos filtros)
    "sdk.where('professorId', '==', teacherUid),", "sdk.where('perfil', '==', 'aluno'),", "sdk.where('ativo', '==', false));"])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.311 (professor.html): ' + needed);
  const out = html.replace(OLD_TEACHER_BLOCK, () => TEACHER_BLOCK);
  assert.equal(count(out, 'APPushAvisos') + count(out, 'apPushCard'), 0, 'Sobrou referência ao push no professor.html');
  return out;
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.311');
  assert.equal(source.sequence, 417);
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
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.311 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editStudent, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME, STUDENT_JS, TEACHER_JS};
