'use strict';

// Gera o pacote 1.12.316 / 422 (sem assinatura) a partir do 1.12.315 / 421 (referência assinada; SHA-256 conferido).
// Pedido: Tiago, 25/11/2026 18:59 (print de "Treino em andamento": "antigamente aqui [...] aparecia [o ícone] de relógio
// smartwatch [...] agora nem aparece mais e colocar a opção lá no mais na smartwatch ativar e desativar") e 21:06 ("lá no mais do
// smartwatch tem que ter opção quero smartwatch não quero smartwatch [...] quando eu colocar quero smartwatch na hora que iniciar o
// treino [tem que] ter o símbolozinho do smartwatch me dê coisas [...] realista de conseguir jogar no smartwatch por enquanto e aí
// você pode fazer").
// Por que pacote completo: só os blocos ap-aviso-relogio e ap-aviso-relogio-css mudam, mas eles não estão na lista da área
// "relogio" do UpdateAreaPatch (só ap-watch-model, ap-watch-ui, ap-watch-history e ap-watch-teacher); a correção por área seria
// recusada pelo app.
// Agora (os dois blocos, com o mesmo texto nas duas telas):
//  1. A chave da tela Smartwatch passa a ser "Usar smartwatch" (liga e desliga o aviso no Android, como antes).
//  2. Com ela ligada, o ícone do relógio volta ao treino (professor: "Treino em andamento"; aluno: tela do exercício). Sem relógio
//     Wear OS com o app do Agenda Personal, o toque no ícone abre um painel: o que vai para o relógio, "Mandar ao relógio" e
//     "Ajustes do smartwatch". Com Wear OS pronto, o ícone faz o envio de antes.
//  3. O aviso do fim do descanso traz o próximo passo: série, repetições e carga (ou o próximo exercício, ou "Todas as séries
//     feitas").
//  4. Ao iniciar o treino, o relógio recebe o primeiro exercício (um aviso, 5 s depois).
//  5. Textos: tira o "sem som" (o Android 1.213 tem som); o cartão do Mais e a linha do Perfil mostram Ligado/Desligado; marca
//     nova "Colmi, Pubu Wear ou Da Fit" no passo a passo.
//  6. Esc e o voltar do Android fecham só a tela Smartwatch (antes, o voltar mexia na tela de baixo e ela ficava aberta).
// Usa só a ponte do Android 1.212 (scheduleWatchNotice com horário próximo para os avisos "agora"). Não muda: o descanso, o som do
// fim do descanso, o cartão da tela bloqueada, cronômetros, alarmes, despertador, o app Wear OS, treinos, agenda, financeiro, login
// e mascotes. Só lê o treino e o descanso.
//
// Uso: node tools/gerar-smartwatch-no-treino-1.12.316.cjs [pacote-1.12.315.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const anterior = require('./gerar-aviso-relogio-1.12.313.cjs');

const version = '1.12.316';
const sequence = 422;
const title = 'Smartwatch no treino';
const summary = 'Chave Usar smartwatch em Mais > Smartwatch. Ligada, o ícone do relógio volta ao treino e o relógio recebe o exercício e a próxima série no fim do descanso.';
const notesText = 'Smartwatch no treino.\n\n'
  + 'Em Mais > Smartwatch (professor) ou Perfil > Smartwatch (aluno), a chave agora se chama Usar smartwatch. O cartão mostra se '
  + 'está ligado ou desligado.\n\n'
  + 'Com o smartwatch ligado:\n'
  + '- o ícone do relógio volta ao treino (Treino em andamento, no professor; tela do exercício, no aluno). Tocar nele mostra o '
  + 'que vai para o relógio e o botão Mandar ao relógio;\n'
  + '- ao iniciar o treino, o relógio recebe o primeiro exercício;\n'
  + '- no fim de cada descanso, o relógio vibra com a próxima série: exercício, número da série, repetições e carga. Quando o '
  + 'exercício acaba, mostra o próximo; no fim, avisa que todas as séries foram feitas.\n\n'
  + 'Funciona com os relógios que mostram as notificações do celular (Mi Band, Redmi Watch, Amazfit, Galaxy Watch, Huawei, Garmin, '
  + 'Colmi e outros), pelo app da marca. Marcar séries e mudar a carga continuam no celular: esses relógios só mostram avisos.\n\n'
  + 'Precisa do app Android 1.212 ou mais novo; com o 1.213 o aviso tem som, e alguns relógios só repassam assim. No navegador e no '
  + 'iPhone, a tela Smartwatch explica que funciona no app Android.\n\n'
  + 'O que não muda: o descanso, o som do fim do descanso, o cartão da tela bloqueada, os cronômetros, o despertador, treinos, '
  + 'agenda, financeiro, login e mascotes.\n\n'
  + 'Inclui tudo do 1.12.315 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.315-Criar-Treino-Manual-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '8eafe5b7637350a1cb51c9b144fe74242990a80181ab6b9ffe012b730d3a165c';
const TARGET_NAME = 'AgendaPersonal-1.12.316-Smartwatch-No-Treino-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// Mesmo texto nas duas telas.
const CSS = String.raw`
/* Smartwatch (1.12.313; 1.12.316: ícone no treino com "Usar smartwatch" ligado). O ícone aparece com o smartwatch ligado ou com
   relógio Wear OS e o app do Agenda Personal conectados. */
html:not([data-ap-wear-os="pronto"]):not([data-ap-relogio="ligado"]) .ap-watch-send-icon{display:none!important}
html:not([data-ap-wear-os="pronto"]):not([data-ap-relogio="ligado"]) #exerciseScreen .ex-header-title.ap-watch-title{display:block}
.ap-relogio{--ac-panel:var(--ac-raised,#15191d)}
.ap-relogio .ap-relogio-chave{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0;cursor:pointer}
.ap-relogio .ap-relogio-chave strong{display:block;font-size:16px;line-height:1.3}
.ap-relogio .ap-relogio-chave small{display:block;font-size:13px;line-height:1.35;opacity:.75}
.ap-relogio input[role="switch"]{appearance:none;-webkit-appearance:none;flex:none;position:relative;box-sizing:border-box;width:52px;height:32px;margin:0;border-radius:999px;border:1px solid var(--ac-line,#4c5543);background:var(--ac-field,#111419);cursor:pointer;transition:background-color .18s,border-color .18s}
.ap-relogio input[role="switch"]::before{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:var(--ac-text,#f1f4f6);opacity:.55;transition:transform .18s,opacity .18s}
.ap-relogio input[role="switch"]:checked{background:var(--ac-accent,#b4ff24);border-color:var(--ac-accent,#b4ff24)}
.ap-relogio input[role="switch"]:checked::before{transform:translateX(20px);background:var(--ac-panel,#15191d);opacity:1}
.ap-relogio input[role="switch"]:focus-visible{outline:2px solid var(--ac-accent,#b4ff24);outline-offset:3px}
.ap-relogio input[role="switch"]:disabled{opacity:.45;cursor:not-allowed}
.ap-relogio [data-relogio-estado]{margin:12px 0 0;font-size:14px}
.ap-relogio [data-nivel="atencao"]{color:var(--ac-warn,#ffc46b)}
.ap-relogio .ap-watch-actions[hidden]{display:none}
.ap-relogio [data-relogio-passo]{margin:10px 0 0}
.ap-relogio button:disabled{opacity:.45;cursor:not-allowed}
.ap-relogio .ap-relogio-previa{margin:14px 0 0;padding:12px 14px;border:1px solid var(--ac-line,#4c5543);border-radius:14px;background:var(--ac-field,#111419)}
.ap-relogio .ap-relogio-previa small{display:block;margin:0 0 4px;font-size:12px;line-height:1.35;opacity:.7}
.ap-relogio .ap-relogio-previa small:empty{display:none}
.ap-relogio .ap-relogio-previa strong{display:block;font-size:15px;line-height:1.4;font-weight:600;overflow-wrap:anywhere}
.ap-relogio-rapido [data-relogio-estado]{margin:10px 0 0}
.ap-relogio-rapido .ap-watch-actions button{flex:1 1 calc(50% - 5px)}
.ap-relogio-rapido .ap-watch-actions button:first-child{flex-basis:100%}
#profileScreen .profile-option>.ap-relogio-icone{display:inline-grid;place-items:center;flex:none}
#profileScreen .profile-option>.ap-relogio-icone svg{width:27px;height:27px;color:var(--prof-accent);flex:none}
@media (prefers-reduced-motion:reduce){.ap-relogio input[role="switch"],.ap-relogio input[role="switch"]::before{transition:none}}
`;

const JS = String.raw`(function(){
'use strict';
// Smartwatch: o relógio recebe o treino pelas notificações do celular (1.12.313; 1.12.316: chave "Usar smartwatch", ícone no
// treino, primeiro exercício ao iniciar e a próxima série no fim do descanso). Pedidos do Tiago em 24 e 25/11/2026. O app da
// marca do relógio (Mi Fitness, Zepp, Galaxy Wearable, Huawei Saúde, Garmin Connect, Pubu Wear, Wear OS) repassa a notificação.
// Precisa do Android 1.212 (AvisosRelogio). Mesmo bloco nas duas telas.
// Só lê o treino e o descanso (state.workoutRest e workoutDrafts no professor; restUntil e done do treino no aluno): não muda
// descanso, som, alarme, cronômetro nem registro de série.
if(window.APAvisoRelogio)return;
const professor=!!document.getElementById('screen-more'),aluno=!professor&&!!document.getElementById('profileScreen');
if(!professor&&!aluno)return;
const CHAVE=professor?'professor':'aluno',PAPEL=professor?'teacher':'student',ID='apAvisoRelogio',MARCA='apRelogioMarca',INICIO='apRelogioInicio.'+CHAVE;
// Os avisos "agora" (início do treino e Mandar ao relógio) saem 5 s depois: dá tempo de apagar a tela, e há apps de relógio que só
// repassam assim.
const ATRASO=5000;
// Mesmo traço dos ícones do Perfil (profileSymbol): 2.
const ICONE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="6" width="14" height="12" rx="3"/><path d="m8 6 1-4h6l1 4m-8 12 1 4h6l1-4m-4-9v3l2 1m5-3h1"/></svg>';
const MARCAS=[
 ['xiaomi','Xiaomi, Redmi ou Mi Band','No app Mi Fitness (ou Zepp Life, nas Mi Band mais antigas), entre no relógio, abra as notificações de apps e ligue o Agenda Personal.'],
 ['pubu','Colmi, Pubu Wear ou Da Fit','No app do relógio (Pubu Wear, Da Fit ou parecido), abra Notificação de mensagem, deixe ligada e, em Outro software, ligue o Agenda Personal.'],
 ['amazfit','Amazfit','No app Zepp, entre no relógio, abra os alertas de notificação de apps e ligue o Agenda Personal.'],
 ['samsung','Samsung Galaxy Watch','No app Galaxy Wearable, abra as notificações do relógio e ligue o Agenda Personal.'],
 ['huawei','Huawei ou Honor','No app Huawei Saúde (ou Honor Health), entre no relógio, abra as notificações e ligue o Agenda Personal.'],
 ['garmin','Garmin','No app Garmin Connect, entre no relógio, abra Notificações e alertas e permita as notificações de apps.'],
 ['wearos','Pixel Watch ou outro Wear OS','Os avisos do celular já aparecem no relógio. No app Pixel Watch ou Wear OS, confira se o Agenda Personal não está bloqueado.'],
 ['apple','Apple Watch','O Apple Watch só recebe notificações de iPhone. Com celular Android, ele não recebe o aviso.'],
 ['outro','Outra marca','No app do relógio, procure as notificações de apps e ligue o Agenda Personal.']
];
const FECHO='<header class="ap-watch-setup-heading"><h2 id="apRelogioTitulo" tabindex="-1">Smartwatch</h2><button type="button" data-relogio-fechar aria-label="Fechar Smartwatch">×</button></header>';
const HTML=FECHO
 +'<p class="ap-watch-help">Com o smartwatch ligado, o ícone do relógio aparece no treino, o relógio recebe o primeiro exercício quando o treino começa e vibra no fim de cada descanso com a próxima série. Funciona com os relógios que mostram as notificações do celular, como Mi Band, Redmi Watch, Amazfit, Galaxy Watch, Huawei, Garmin e Colmi.</p>'
 +'<section class="ap-watch-connection"><label class="ap-relogio-chave" for="apRelogioLigar"><span><strong>Usar smartwatch</strong><small>Ícone no treino e avisos no relógio</small></span><input id="apRelogioLigar" type="checkbox" role="switch" data-relogio-ligar></label><p data-relogio-estado role="status" aria-live="polite"></p></section>'
 +'<div class="ap-watch-actions" data-relogio-acoes><button type="button" data-relogio-testar>Testar no relógio</button><button type="button" data-relogio-ajustes>Ajustes do aviso</button></div>'
 +'<p data-relogio-retorno class="ap-watch-help" role="status" aria-live="polite" hidden></p>'
 +'<h3>Como ligar no seu relógio</h3><label for="apRelogioMarca">Marca do relógio</label><select id="apRelogioMarca"></select><p data-relogio-passo></p>'
 +'<p class="ap-watch-help">Os nomes dos menus mudam conforme a versão do app da marca. Se o teste não chegar, bloqueie a tela do celular e teste de novo: alguns apps só repassam avisos com a tela apagada.</p>'
 +'<p class="ap-watch-help">Marcar a série e mudar a carga continuam no celular: esses relógios só mostram avisos.</p>'
 +'<section class="ap-watch-requirements" data-relogio-wearos-secao><h3>Relógio Wear OS com app próprio</h3><p>Para Galaxy Watch 4 ou mais novo, Pixel Watch e Xiaomi Watch 2 existe também um app de relógio, com a lista de séries no pulso. Ele ainda não está disponível para instalar.</p><button type="button" data-relogio-wearos>Conexão Wear OS</button></section>'
 +'<div class="ap-watch-actions"><button type="button" data-relogio-fechar>Fechar</button></div>';
// Painel do ícone do relógio no treino.
const HTML_RAPIDO=FECHO
 +'<p data-relogio-estado role="status" aria-live="polite"></p>'
 +'<div class="ap-relogio-previa"><small data-relogio-previa-rotulo></small><strong data-relogio-previa></strong></div>'
 +'<div class="ap-watch-actions"><button type="button" data-relogio-agora>Mandar ao relógio</button><button type="button" data-relogio-tela>Ajustes</button><button type="button" data-relogio-fechar>Fechar</button></div>'
 +'<p data-relogio-retorno class="ap-watch-help" role="status" aria-live="polite" hidden></p>'
 +'<p data-relogio-nota class="ap-watch-help"></p>';
const android=()=>{try{return window.Android||window.parent?.Android||null}catch(e){return null}};
const ponte=()=>{const a=android();try{return a&&typeof a.getWatchNoticeVersion==='function'&&a.getWatchNoticeVersion()>=1?a:null}catch(e){return null}};
function lerEstado(){const a=ponte();if(!a)return null;try{const s=JSON.parse(a.getWatchNoticeStatus()||'{}');return s&&typeof s==='object'?s:{erro:'estado'}}catch(e){return {erro:'estado'}}}

// Textos curtos para o relógio. O Android corta o texto em 120 caracteres; aqui o nome mais longo é encurtado antes.
function junta(partes){
 const p=partes.map(x=>String(x??'').replace(/\s+/g,' ').trim()).filter(Boolean);
 let t=p.join(' · ');if(t.length<=120)return t;
 const i=p.reduce((m,x,k)=>x.length>p[m].length?k:m,0);
 p[i]=p[i].slice(0,Math.max(8,p[i].length-(t.length-120)-1)).trimEnd()+'…';
 t=p.join(' · ');return t.length<=120?t:t.slice(0,119).trimEnd()+'…';
}
const vazio=s=>!s||s==='—'||s==='-';
const kg=v=>{const s=String(v??'').trim();return vazio(s)?'':/^\d+(?:[.,]\d+)?$/.test(s)?s+' kg':s};
const reps=v=>{const s=String(v??'').trim();return vazio(s)?'':/^\d+(?:\s*(?:-|–|a)\s*\d+)?$/.test(s)?s+' reps':s};
const cardio=ex=>{try{return typeof window.APCardio?.is==='function'?window.APCardio.is(ex)===true:ex?.category==='Cardio'}catch(e){return false}};
function minutos(ex){let s=NaN;try{s=Number(window.APCardio?.duration?.(ex))}catch(e){}if(!Number.isFinite(s)||s<=0)s=Number(ex?.durationSeconds);return !Number.isFinite(s)||s<=0?'':s<60?Math.round(s)+' s':Math.round(s/60)+' min'}
// Unidades do treino (exercício sozinho ou bi-set). passo(u) = {feito} ou {feito:false, comecou, texto:[nome, série, reps, carga]}.
function seguinte(us,passo,atual,nome){
 const p=passo(us[atual]);if(!p.feito)return junta([nome,...p.texto]);
 for(let k=1;k<us.length;k++){const q=passo(us[(atual+k)%us.length]);if(!q.feito)return junta([nome,'Próximo: '+q.texto[0],...q.texto.slice(1)])}
 return junta([nome,'Todas as séries feitas. Finalize o treino.']);
}
function emCurso(us,passo,nome,tela){
 if(!us.length)return '';
 if(tela>=0&&!passo(us[tela]).feito)return seguinte(us,passo,tela,nome);
 let primeiro=-1;
 for(let k=0;k<us.length;k++){const p=passo(us[k]);if(p.feito)continue;if(p.comecou)return seguinte(us,passo,k,nome);if(primeiro<0)primeiro=k}
 return seguinte(us,passo,primeiro<0?0:primeiro,nome);
}

// Professor: ficha, rascunho das séries (workoutDrafts) e prescrição por série (técnicas).
function profContexto(p,d){
 if(!p||!d||!Array.isArray(d.exercises)||!d.exercises.length)return null;
 let nome='';try{nome=typeof studentById==='function'?studentById(p.studentId)?.name||'':''}catch(e){}
 return {p,d,rasc:state.workoutDrafts?.[workoutDraftKey(p.id,d.id)]||{},nome};
}
function profAchar(planId,dayId){const p=(state.workoutPlans||[]).find(x=>x.id===planId);return profContexto(p,p?.days?.find(x=>x.id===dayId))}
function profUnidades(d){
 let gs=[];try{gs=typeof window.workoutBisetGroups==='function'?window.workoutBisetGroups(d)||[]:[]}catch(e){}
 const vistos=new Set();
 return d.exercises.flatMap(ex=>{const g=gs.find(g=>g.exerciseIds.includes(ex.id));if(!g)return [{ex}];if(vistos.has(g.id))return [];vistos.add(g.id);return [{g,n:gs.indexOf(g)+1}]});
}
function profSeries(ex){
 const t=window.workoutTechniquePrescription?.(ex),n=t?t.rows.reduce((s,r)=>s+r.sets,0):Number(ex.sets);
 if(!Number.isInteger(n)||n<1||n>100)return [];
 return Array.from({length:n},(_,i)=>{const r=window.workoutTechniqueRoundPrescription?.(ex,i+1);return {reps:String(r?.reps||ex.reps||''),load:String(r?.load||ex.load||'')}});
}
function profPasso(c,u){
 if(u.g){
  const A=c.d.exercises.find(e=>e.id===u.g.exerciseIds[0]),B=c.d.exercises.find(e=>e.id===u.g.exerciseIds[1]),n=Number(u.g.rounds)||0;
  const rodadas=c.rasc.bisets?.[u.g.id]?.rounds,k=Array.isArray(rodadas)?rodadas.filter(x=>x&&x.B).length:0;
  if(!n||k>=n)return {feito:true};
  return {feito:false,comecou:k>0||!!rodadas?.[0]?.A,texto:['Bi-set '+u.n,A&&B?A.name+' + '+B.name:'','rodada '+(k+1)+' de '+n]};
 }
 const ex=u.ex,v=c.rasc.values?.[ex.id]||{};
 if(cardio(ex))return v.done===true?{feito:true}:{feito:false,comecou:false,texto:[ex.name,minutos(ex)]};
 const linhas=profSeries(ex);
 if(v.done===true&&!v.series)return {feito:true};
 if(!linhas.length)return v.done===true?{feito:true}:{feito:false,comecou:false,texto:[ex.name]};
 const s=v.series||{};let k=0;while(k<linhas.length&&s[k+1]?.done===true)k++;
 if(k>=linhas.length)return {feito:true};
 const e=s[k+1]||{};
 return {feito:false,comecou:k>0,texto:[ex.name,'série '+(k+1)+' de '+linhas.length,reps(linhas[k].reps),kg(e.load!==undefined?e.load:linhas[k].load)]};
}
function profIndice(us,exId,bisetId){const i=us.findIndex(u=>u.g?u.g.id===bisetId||u.g.exerciseIds.includes(exId):u.ex.id===exId);return i<0?0:i}
// Treino ativo mais recente: {p, d, dr, t}.
function profAtivos(soIniciados){
 let melhor=null;
 for(const p of state.workoutPlans||[])for(const d of p.days||[]){
  const dr=state.workoutDrafts?.[workoutDraftKey(p.id,d.id)];if(!dr)continue;
  const ativo=dr.active===true||!soIniciados&&dr.active!==false&&Object.keys(dr.values||{}).length>0,t=Number(dr.startedAt)||0;
  if(ativo&&(soIniciados?Number.isFinite(Number(dr.startedAt)):true)&&(!melhor||t>melhor.t))melhor={p,d,dr,t};
 }
 return melhor;
}
function proximoProfessor(r){
 const c=profAchar(r.planId,r.dayId);if(!c)return '';
 const us=profUnidades(c.d),passo=u=>profPasso(c,u);
 return seguinte(us,passo,profIndice(us,r.exerciseId,r.bisetId),r.student||c.nome);
}
function agoraProfessor(){
 let c=null;
 try{const p=currentWorkoutPlan(),d=currentWorkoutDay();if(p&&d&&workoutRunning(p,d))c=profContexto(p,d)}catch(e){}
 if(!c){const a=profAtivos(false);c=a&&profContexto(a.p,a.d)}
 if(!c)return '';
 return emCurso(profUnidades(c.d),u=>profPasso(c,u),c.nome,-1);
}
function inicioProfessor(){
 const a=profAtivos(true),c=a&&profContexto(a.p,a.d);if(!c)return null;
 return {id:'p|'+(a.dr.sessionId||a.t),em:a.t,texto:emCurso(profUnidades(c.d),u=>profPasso(c,u),c.nome,-1)};
}

// Aluno: o treino em andamento (exStore().active), séries feitas (done) e cargas da série (exLoads).
function aluUnidades(lista){
 const vistos=new Set();let n=0;
 return lista.flatMap((ex,i)=>{
  if(vistos.has(i))return [];
  const j=ex?.paired;
  if(Number.isInteger(j)&&j!==i&&lista[j]&&!vistos.has(j)){const a=ex.pairOwner||!lista[j].pairOwner&&i<j?i:j,b=a===i?j:i;vistos.add(i);vistos.add(j);return [{a,b,n:++n}]}
  vistos.add(i);return [{i}];
 });
}
function aluPasso(c,u){
 const feitas=k=>{const d=c.s?.done?.[k];return Array.isArray(d)?d:[]};
 if(u.a!==undefined){
  const A=c.lista[u.a],B=c.lista[u.b],n=Math.min(Number(A?.sets)||0,Number(B?.sets)||0);if(!n)return {feito:true};
  const dA=feitas(u.a),dB=feitas(u.b);let k=0;while(k<n&&dA[k]===true&&dB[k]===true)k++;
  if(k>=n)return {feito:true};
  return {feito:false,comecou:k>0||dA[0]===true,texto:['Bi-set',A.name+' + '+B.name,'rodada '+(k+1)+' de '+n]};
 }
 const ex=c.lista[u.i];if(!ex)return {feito:true};
 const n=Number(ex.sets)||0,d=feitas(u.i);
 if(cardio(ex))return d.length&&d.every(x=>x===true)?{feito:true}:{feito:false,comecou:false,texto:[ex.name,minutos(ex)]};
 if(!n)return {feito:true};
 let k=0;while(k<n&&d[k]===true)k++;if(k>=n)return {feito:true};
 let cargas=[];try{cargas=typeof exLoads==='function'?exLoads(c.s,c.id,u.i,n)||[]:[]}catch(e){}
 return {feito:false,comecou:k>0,texto:[ex.name,'série '+(k+1)+' de '+n,reps(ex.rows?.[k]?.reps??ex.reps),kg(cargas[k]??ex.rows?.[k]?.load)]};
}
function aluIndice(us,i){return us.findIndex(u=>u.i===i||u.a===i||u.b===i)}
function aluContexto(id,s){let lista=[];try{lista=exercisesFor(id)||[]}catch(e){}return lista.length?{id,s,lista}:null}
function alunoAtivo(){return window.__AP_STUDENT_CONTEXT?.role==='student'&&typeof exStore==='function'}
function proximoAluno(m){
 const c=aluContexto(m.id,m.s);if(!c)return '';
 const auto=m.s.apAutoRestSeries,us=aluUnidades(c.lista);
 const i=auto&&auto.deadline===m.fim?auto.exercise:exActiveId===m.id?exIndex:Number.isInteger(m.s.lastExercise)?m.s.lastExercise:0;
 const k=aluIndice(us,i);return seguinte(us,u=>aluPasso(c,u),k<0?0:k,'');
}
function agoraAluno(){
 if(!alunoAtivo())return '';
 const ativos=exStore().active||{};let id=typeof exActiveId==='string'&&ativos[exActiveId]?exActiveId:'',t=-1;
 if(!id)for(const [k,s] of Object.entries(ativos)){const x=Number(s?.startedAt)||0;if(x>t){t=x;id=k}}
 const c=id&&aluContexto(id,ativos[id]);if(!c)return '';
 const us=aluUnidades(c.lista);
 return emCurso(us,u=>aluPasso(c,u),'',id===exActiveId&&Number.isInteger(exIndex)?aluIndice(us,exIndex):-1);
}
function inicioAluno(){
 if(!alunoAtivo())return null;
 let melhor=null;
 for(const [id,s] of Object.entries(exStore().active||{})){const t=Number(s?.startedAt);if(Number.isFinite(t)&&(!melhor||t>melhor.t))melhor={id,s,t}}
 const c=melhor&&aluContexto(melhor.id,melhor.s);if(!c)return null;
 return {id:'a|'+melhor.id+'|'+melhor.t,em:melhor.t,texto:emCurso(aluUnidades(c.lista),u=>aluPasso(c,u),'',-1)};
}

// Descanso em andamento nesta tela: {fim, texto} ou null. Só leitura.
function descansoProfessor(){
 try{
  const r=typeof state==='object'&&state?state.workoutRest:null;
  if(!r||!Number.isFinite(r.endAt))return null;
  let texto='';try{texto=proximoProfessor(r)}catch(e){}
  return {fim:r.endAt,texto:texto||[r.student,r.exercise].filter(x=>typeof x==='string'&&x.trim()).join(' · ')};
 }catch(e){return null}
}
function descansoAluno(){
 try{
  if(!alunoAtivo())return null;
  let melhor=null;
  for(const [id,s] of Object.entries(exStore().active||{})){const fim=Number(s?.restUntil);if(Number.isFinite(fim)&&fim>0&&(!melhor||fim>melhor.fim))melhor={id,s,fim}}
  if(!melhor)return null;
  let texto='';try{texto=proximoAluno(melhor)}catch(e){}
  if(!texto){
   try{
    const auto=melhor.s.apAutoRestSeries,lista=exercisesFor(melhor.id);
    const indice=auto&&auto.deadline===melhor.fim?auto.exercise:exActiveId===melhor.id?exIndex:-1;
    texto=typeof lista?.[indice]?.name==='string'?lista[indice].name:'';
   }catch(e){}
  }
  return {fim:melhor.fim,texto};
 }catch(e){return null}
}
const descanso=professor?descansoProfessor:descansoAluno;
function textoAgora(){try{return professor?agoraProfessor():agoraAluno()}catch(e){return ''}}
const emDescanso=()=>{const r=descanso();return !!r&&r.fim>Date.now()};

// Marca no Android o aviso do fim do descanso e desmarca quando o descanso é parado antes do fim.
let ligadoCache=null,lidoEm=0,marcado=null,recusado='',inicio=true,avisado='';
function ligado(forcar){
 const agora=Date.now();
 if(forcar||ligadoCache===null||agora-lidoEm>10000){lidoEm=agora;const s=lerEstado();ligadoCache=!!(s&&s.ativo===true);document.documentElement.dataset.apRelogio=ligadoCache?'ligado':'desligado';try{rotulos()}catch(e){}}
 return ligadoCache;
}
// Ao iniciar o treino, o relógio recebe o primeiro exercício (uma vez por treino).
function avisarInicio(a,agora){
 let t=null;try{t=professor?inicioProfessor():inicioAluno()}catch(e){}
 if(!t||!t.texto||t.id===avisado||agora-t.em>60000||t.em-agora>5000)return;
 avisado=t.id;
 let salvo='';try{salvo=localStorage.getItem(INICIO)||''}catch(e){}
 if(salvo===t.id)return;
 try{localStorage.setItem(INICIO,t.id)}catch(e){}
 try{a.scheduleWatchNotice(CHAVE,agora+ATRASO,JSON.stringify({titulo:'Treino iniciado',texto:t.texto}))}catch(e){}
}
function sincronizar(forcar){
 const a=ponte();if(!a)return;
 const agora=Date.now(),r=descanso(),chave=r?r.fim+'|'+r.texto:'';
 // Ao abrir sem descanso em andamento, tira um aviso que tenha ficado marcado.
 if(inicio){inicio=false;if(!r||r.fim<=agora){try{a.cancelWatchNotice(CHAVE)}catch(e){}}}
 if(!ligado(forcar)){marcado=null;return}
 if(r&&r.fim>agora+800){
  if(marcado?.chave===chave||(recusado===chave&&!forcar))return;
  let ok=false;
  try{ok=a.scheduleWatchNotice(CHAVE,r.fim,JSON.stringify({titulo:'Fim do descanso',texto:r.texto||'Volte para o treino.'}))===true}catch(e){}
  if(ok){marcado={chave,fim:r.fim};recusado=''}else{recusado=chave;lidoEm=0}
  return;
 }
 // Nos 3 últimos segundos o descanso está acabando sozinho: o aviso fica.
 if(marcado&&marcado.chave!==chave){if(marcado.fim>agora+3000){try{a.cancelWatchNotice(CHAVE)}catch(e){}}marcado=null}
 avisarInicio(a,agora);
}

// Estado para a tela Smartwatch.
function estado(){
 if(!android())return {nivel:'web',ligado:false,pode:false,texto:'O smartwatch funciona no aplicativo Android. Pelo navegador, o celular pausa o app com a tela apagada e o aviso não sai na hora.'};
 const s=lerEstado();
 if(!s)return {nivel:'atualizar',ligado:false,pode:false,texto:'Atualize o aplicativo Android para a versão 1.212 ou mais nova para usar o smartwatch.'};
 if(s.erro)return {nivel:'atencao',ligado:false,pode:true,texto:'Não foi possível ler o estado do smartwatch agora.'};
 const ligado=s.ativo===true;
 if(!ligado)return {nivel:'desligado',ligado,pode:true,texto:'Desligado. Ligue para ver o ícone do relógio no treino e receber os avisos.'};
 if(s.permissao===false)return {nivel:'atencao',ligado,pode:true,texto:'As notificações do Agenda Personal estão bloqueadas neste celular. Toque em Ajustes do aviso para liberar.'};
 if(s.canal==='desligado')return {nivel:'atencao',ligado,pode:true,texto:'O aviso está desligado nos ajustes do Android. Toque em Ajustes do aviso para ligar.'};
 if(s.canal==='silencioso')return {nivel:'atencao',ligado,pode:true,texto:'O aviso está silencioso no Android, e alguns relógios não vibram assim. Toque em Ajustes do aviso.'};
 if(s.exato===false)return {nivel:'atencao',ligado,pode:true,texto:'Ligado. Sem a permissão Alarmes e lembretes, o aviso pode atrasar.'};
 const m=/^1\.(\d+)$/.exec(String(s.app||'')),antigo=!!m&&Number(m[1])<213;
 const semSom=antigo?' Neste app o aviso sai sem som; se não chegar no relógio, atualize o app Android.':'';
 return {nivel:'ok',ligado,pode:true,texto:'Ligado. O relógio recebe o primeiro exercício ao iniciar o treino e a próxima série no fim de cada descanso.'+semSom,curto:'Smartwatch ligado.'+semSom};
}

let dialogo=null,modo='',relogio=0,retorno='',falhou=false,estadoGuardado=null,estadoEm=0;
// No professor, a tela segue o tema do app (--ac-*); no aluno, as cores do Perfil (cor do tema e modo claro).
function tema(d){
 if(!aluno)return;
 const tela=document.getElementById('profileScreen');let cor='';
 try{cor=getComputedStyle(tela).getPropertyValue('--prof-accent').trim()}catch(e){}
 const claro=!!tela?.classList.contains('profile-light');
 const v=claro?{panel:'#ffffff',line:'#c9d6de',text:'#1e3040',field:'#ecf4f8',warn:'#8a5a00'}:{panel:'#071b26',line:'#29404d',text:'#f7f9fb',field:'#05131c',warn:'#ffc46b'};
 for(const k in v)d.style.setProperty('--ac-'+k,v[k]);
 d.style.setProperty('--ac-accent',/^#[0-9a-f]{3,8}$/i.test(cor)?cor:'#00d98d');
 d.dataset.claro=String(claro);
}
function mostrarRetorno(d){const r=d.querySelector('[data-relogio-retorno]');r.hidden=!retorno;r.textContent=retorno;r.dataset.nivel=falhou?'atencao':'ok'}
function mostrar(){
 const d=dialogo;if(!d)return;
 if(modo==='rapido')return mostrarRapido();
 const e=estado(),chave=d.querySelector('[data-relogio-ligar]'),st=d.querySelector('[data-relogio-estado]');
 chave.checked=!!e.ligado;chave.disabled=!e.pode;
 st.textContent=e.texto;st.dataset.nivel=e.nivel;
 d.querySelector('[data-relogio-acoes]').hidden=!e.pode;
 mostrarRetorno(d);
}
// Na tela, número e unidade não se separam na quebra de linha ("85 kg"); o relógio recebe o texto com espaço comum.
const tela=t=>String(t).replace(/(\d) (kg|reps|min|s)(?=$| )/g,'$1\u00a0$2');
const contagem=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function mostrarRapido(){
 const d=dialogo;if(!d)return;
 const agora=Date.now();if(!estadoGuardado||agora-estadoEm>3000){estadoGuardado=estado();estadoEm=agora}
 const e=estadoGuardado,st=d.querySelector('[data-relogio-estado]'),rot=d.querySelector('[data-relogio-previa-rotulo]'),pv=d.querySelector('[data-relogio-previa]'),b=d.querySelector('[data-relogio-agora]'),nota=d.querySelector('[data-relogio-nota]');
 st.textContent=e.curto||e.texto;st.dataset.nivel=e.nivel;
 const r=descanso();
 if(r&&r.fim>agora){
  rot.textContent='No fim do descanso, em '+contagem(r.fim-agora);pv.textContent=tela(r.texto||'Volte para o treino.');b.disabled=true;
  nota.textContent='Durante o descanso, o relógio já vai receber o aviso do fim com a próxima série.';
 }else{
  const t=textoAgora();
  rot.textContent=t?'Exercício agora':'';pv.textContent=t?tela(t):'Inicie o treino para mandar o exercício ao relógio.';b.disabled=!t||!e.ligado||!e.pode;
  nota.textContent='O aviso chega em 5 segundos. Se não chegar com a tela do celular acesa, bloqueie a tela: alguns apps de relógio só repassam assim.';
 }
 mostrarRetorno(d);
}
function mandarAgora(){
 const a=ponte(),t=textoAgora();let ok=false;
 if(a&&t&&!emDescanso()){try{ok=a.scheduleWatchNotice(CHAVE,Date.now()+ATRASO,JSON.stringify({titulo:'Agora no treino',texto:t}))===true}catch(e){}}
 falhou=!ok;retorno=ok?'Mandado. Em 5 segundos chega no relógio.':'O Android não aceitou. Em Ajustes do smartwatch, confira se ele está ligado e se as notificações estão liberadas.';
 mostrar();
}
function fechar(){clearInterval(relogio);relogio=0;modo='';const d=dialogo;dialogo=null;if(d){try{d.close()}catch(e){}d.remove()}try{wearOs()}catch(e){}}
function montar(html,classe){
 fechar();retorno='';falhou=false;estadoGuardado=null;
 const d=document.createElement('dialog');d.id=ID;d.className='ap-watch-dialog ap-relogio'+(classe?' '+classe:'');d.setAttribute('aria-labelledby','apRelogioTitulo');
 d.innerHTML=html;tema(d);
 for(const b of d.querySelectorAll('[data-relogio-fechar]'))b.onclick=fechar;
 d.addEventListener('cancel',ev=>{ev.preventDefault();fechar()});
 // Esc fecha só esta tela: sem isto, o Esc da página fecharia também o treino aberto embaixo.
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();fechar()}});
 return d;
}
function exibir(d,intervalo){
 document.body.append(d);dialogo=d;mostrar();
 try{d.showModal()}catch(e){d.setAttribute('open','')}
 d.querySelector('h2').focus({preventScroll:true});d.scrollTop=0;
 relogio=setInterval(mostrar,intervalo);
}
function abrir(){
 const d=montar(HTML,'');modo='tela';
 const sel=d.querySelector('#apRelogioMarca'),passo=d.querySelector('[data-relogio-passo]');
 for(const [id,nome] of MARCAS){const o=document.createElement('option');o.value=id;o.textContent=nome;sel.append(o)}
 let salva='';try{salva=localStorage.getItem(MARCA)||''}catch(e){}
 if(MARCAS.some(m=>m[0]===salva))sel.value=salva;
 const explicar=()=>{passo.textContent=(MARCAS.find(m=>m[0]===sel.value)||MARCAS[0])[2]};
 sel.onchange=()=>{try{localStorage.setItem(MARCA,sel.value)}catch(e){}explicar()};explicar();
 const chave=d.querySelector('[data-relogio-ligar]');
 chave.onchange=()=>{
  const a=ponte();let ok=false;try{ok=!!a&&a.setWatchNoticeEnabled(chave.checked)===true}catch(e){}
  retorno=ok?'':'Não foi possível salvar. Tente de novo.';falhou=!ok;sincronizar(true);mostrar();
 };
 d.querySelector('[data-relogio-testar]').onclick=()=>{
  const a=ponte();let ok=false;try{ok=!!a&&a.testWatchNotice()===true}catch(e){}
  falhou=!ok;retorno=ok?'Bloqueie a tela do celular agora. Em 10 segundos chega o aviso de teste no relógio.':'O Android não aceitou o teste. Confira as notificações do app em Ajustes do aviso.';mostrar();
 };
 d.querySelector('[data-relogio-ajustes]').onclick=()=>{try{ponte()?.openWatchNoticeSettings()}catch(e){}};
 d.querySelector('[data-relogio-wearos-secao]').hidden=typeof window.APWatchUI?.setup!=='function';
 d.querySelector('[data-relogio-wearos]').onclick=()=>{fechar();try{window.APWatchUI.setup(PAPEL)}catch(e){}};
 exibir(d,2500);
}
function abrirRapido(){
 const d=montar(HTML_RAPIDO,'ap-relogio-rapido');modo='rapido';
 d.querySelector('[data-relogio-agora]').onclick=mandarAgora;
 d.querySelector('[data-relogio-tela]').onclick=()=>abrir();
 exibir(d,1000);
}

// Rótulo do cartão (professor, Mais) e da linha (aluno, Perfil): ligado ou desligado.
function rotulos(){
 const t=!android()?'Funciona no app Android.':!ponte()?'Atualize o app Android.':ligadoCache===true?'Ligado. Treino e descanso no relógio.':ligadoCache===false?'Desligado. Toque para ligar.':'Treino e descanso no relógio.';
 const alvo=professor?document.querySelector('#moreSmartwatch .more-function-copy small'):document.querySelector('#apProfileRelogio small');
 if(alvo&&alvo.textContent!==t)alvo.textContent=t;
}
// Professor: o cartão Smartwatch que já existe em Mais abre esta tela.
function cartaoProfessor(){
 if(!professor)return;
 const card=document.getElementById('moreSmartwatch');if(!card)return;
 card.setAttribute('aria-controls',ID);card.setAttribute('aria-haspopup','dialog');
 card.onclick=()=>abrir();
 rotulos();
}
// Aluno: linha "Smartwatch" no Perfil, antes de Pet.
function linhaAluno(){
 if(!aluno)return;
 const lista=document.querySelector('#profileScreen .profile-options');if(!lista)return;
 let b=document.getElementById('apProfileRelogio');
 if(!b){
  b=document.createElement('button');b.id='apProfileRelogio';b.type='button';b.className='profile-option';
  b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls',ID);
  b.innerHTML='<span class="ap-relogio-icone">'+ICONE+'</span><div><strong>Smartwatch</strong><small>Treino e descanso no relógio.</small></div><span class="profile-chevron" data-profile-icon="chevron"></span>';
  b.onclick=()=>abrir();
  const antes=document.getElementById('apProfilePet')||document.getElementById('apProfileUpdates');
  if(antes&&antes.parentElement===lista)lista.insertBefore(b,antes);else lista.append(b);
 }
 const seta=b.querySelector('[data-profile-icon="chevron"]');
 if(seta&&!seta.firstChild&&typeof profileSymbol==='function')seta.innerHTML=profileSymbol('chevron');
 rotulos();
}
// Ícone Wear OS: o envio do treino ao app do relógio só com relógio Wear OS conectado e com o app do Agenda Personal.
function wearOs(){
 let pronto=false;
 try{const a=android();if(typeof a?.getWatchStatus==='function'){const c=JSON.parse(a.getWatchStatus()||'{}').connection;pronto=c?.state==='checked'&&Array.isArray(c.nodes)&&Array.isArray(c.appNodes)&&c.nodes.some(n=>c.appNodes.includes(n?.id))}}catch(e){}
 document.documentElement.dataset.apWearOs=pronto?'pronto':'ausente';
}
// Sem Wear OS pronto, o toque no ícone do relógio abre o painel em vez do envio ao app Wear OS (que não chegaria).
document.addEventListener('click',ev=>{
 const b=ev.target?.closest?.('.ap-watch-send-icon');if(!b||document.documentElement.dataset.apWearOs==='pronto')return;
 ev.preventDefault();ev.stopImmediatePropagation();abrirRapido();
},true);

// Voltar do Android com esta tela aberta: fecha só ela (antes, o voltar mexia na tela de baixo e esta ficava aberta).
try{if(typeof window.handleAgendaSystemBack==='function'){const voltar=window.handleAgendaSystemBack;window.handleAgendaSystemBack=function(...a){if(dialogo){fechar();return true}return voltar.apply(this,a)}}}catch(e){}
window.APAvisoRelogio=Object.freeze({estado,abrir,fechar,rapido:abrirRapido,sincronizar:()=>sincronizar(true),previa:()=>({descanso:descanso(),agora:textoAgora()})});
if(aluno&&typeof profileRender==='function'){const original=profileRender;profileRender=function(...a){const r=original.apply(this,a);try{linhaAluno()}catch(e){}return r}}
addEventListener('ap-student-ready',()=>{try{linhaAluno()}catch(e){}});
addEventListener('ap-account-changed',()=>{fechar();marcado=null;inicio=true;avisado='';try{linhaAluno()}catch(e){}});
addEventListener('pagehide',fechar);
document.addEventListener('visibilitychange',()=>{if(ponte())sincronizar(false);if(!document.hidden){try{wearOs()}catch(e){}}});
try{cartaoProfessor()}catch(e){}
try{linhaAluno()}catch(e){}
try{wearOs()}catch(e){}
setTimeout(()=>{try{wearOs()}catch(e){}},4000);
if(ponte()){sincronizar(false);setInterval(()=>sincronizar(false),1500)}
})();`;

const CSS_BLOCK = '<style id="ap-aviso-relogio-css">' + CSS + '</style>\n';
const JS_BLOCK = '<script id="ap-aviso-relogio">' + JS + '\n</script>\n';
const CSS_ANTES = '<style id="ap-aviso-relogio-css">' + anterior.CSS + '</style>\n';
const JS_ANTES = '<script id="ap-aviso-relogio">' + anterior.JS + '\n</script>\n';

// Troca os dois blocos do 1.12.313 (que o 1.12.315 ainda tem, iguais) pelos novos.
function trocar(html, pagina) {
  assert.equal(count(html, CSS_ANTES), 1, 'Bloco ap-aviso-relogio-css do 1.12.313 não encontrado exatamente uma vez: ' + pagina);
  assert.equal(count(html, JS_ANTES), 1, 'Bloco ap-aviso-relogio do 1.12.313 não encontrado exatamente uma vez: ' + pagina);
  assert.equal(count(html, 'id="ap-aviso-relogio'), 2, 'Há outra cópia dos blocos do relógio: ' + pagina);
  assert.equal(count(html, 'data-ap-relogio'), 0, 'data-ap-relogio já existe no 1.12.315 (' + pagina + ')');
  return html.replace(CSS_ANTES, () => CSS_BLOCK).replace(JS_ANTES, () => JS_BLOCK);
}
function editStudent(html) {
  for (const needed of ['function exStore(){', 'function exercisesFor(id){', 'let exActiveId="A",exIndex=0,',
    'session.apAutoRestSeries = {deadline, exercise, series};', 'exLoads=function(e,t,o,n){', 'pair:r.pair,video:r.video,rows:t(r.rows),index:n',
    'paired:o>=0?o:null,pairOwner:r.pairOwner', 'class="ap-watch-send-icon"', 'e.classList.add("ap-watch-title")',
    'store.active[id]={startedAt:Date.now(),loads:{},done:{},lastExercise:null,id:id}', 'APCardio=Object.freeze({'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.315 (index.html): ' + needed);
  assert.equal(count(html, 'id="screen-more"'), 0, 'index.html não pode ter #screen-more (o bloco decide a tela por ele)');
  return trocar(html, 'index.html');
}
function editProfessor(html) {
  for (const needed of ['id="screen-more"', "card.id='moreSmartwatch'", '<span class="more-function-copy"><strong>Smartwatch</strong>',
    'function workoutDraftKey(planId,dayId){return planId+\'|\'+dayId}', 'function workoutRunning(plan,day){',
    'function currentWorkoutPlan(){', 'function currentWorkoutDay(){', 'window.workoutBisetGroups=',
    'window.workoutTechniqueRoundPrescription=function(ex,round,total=Number(ex?.sets)){', 'window.workoutTechniquePrescription=ex=>prescription(ex);',
    "student:studentById(p.studentId)?.name||'Aluno',exercise:ex.name,seconds,endAt:Date.now()+seconds*1000",
    "exercise:'Bi-set '+(groups(day).indexOf(g)+1)+' · descanso após B'", 'const pending={...j.pending};delete pending[part];',
    "active:true,sessionId:restart||!old?.sessionId?id():old.sessionId,startedAt:restart||!old?.startedAt?Date.now():old.startedAt",
    "series[ctx.round]={round:ctx.round,done:true,reps,", 'onclick=\\"APsendTeacherWatchWorkout()\\" type=\\"button\\" class=\\"ap-watch-send-icon\\"',
    "values[ex.id]={...values[ex.id],done:true,sets:'1',reps:seconds+' s',load:'',series:{1:row}};", 'APCardio=Object.freeze({'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.315 (professor.html): ' + needed);
  assert.equal(count(html, 'id="profileScreen"'), 0, 'professor.html não pode ter #profileScreen');
  return trocar(html, 'professor.html');
}
function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.315');
  assert.equal(source.sequence, 421);
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
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.315 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}
if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}
module.exports = {makeUpdate, loadSource, editStudent, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME, CSS, JS};
