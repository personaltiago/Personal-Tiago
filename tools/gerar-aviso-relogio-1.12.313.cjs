'use strict';

// Gera o pacote 1.12.313 / 419 (sem assinatura) a partir do 1.12.312 / 418 assinado (referência; SHA-256 conferido).
// Pedido: Tiago, 24/11/2026 15:17 ("Vamos começar a trabalhar nesse projeto", com print do cartão Smartwatch mostrando "Conexão
// Wear OS indisponível") e 15:54 ("os alunos não tem [...] nem tem onde registra o relógio nada igual ao meu [...] avalie para
// ver se está funcionando e se não tiver funcionando eu quero que você faça [funcionar] para vários modelos"). Na pergunta do app
// escolheu "Avisos em qualquer relógio (Recomendado)": "Mi Band, Redmi, Amazfit, Galaxy… recebem o fim do descanso pelo app da
// marca. Mexe no aviso do descanso." Respondeu também "Não tenho relógio".
// Precisa do Android 1.212 (AvisosRelogio: ponte getWatchNoticeVersion/getWatchNoticeStatus/setWatchNoticeEnabled/
// scheduleWatchNotice/cancelWatchNotice/testWatchNotice/openWatchNoticeSettings).
// Agora (dois blocos novos, iguais nas duas telas, antes de </body>):
//  - ap-aviso-relogio-css: o visual da tela Smartwatch (chave, estados) e a regra que esconde o ícone "Enviar treino ao
//    smartwatch" (Wear OS) enquanto não houver relógio Wear OS com o app do Agenda Personal conectado.
//  - ap-aviso-relogio: acompanha o descanso (professor: state.workoutRest; aluno: restUntil do treino) e, com o aviso ligado no
//    Android 1.212, marca no Android o aviso do fim do descanso; desmarca se o descanso for parado antes do fim. Abre a tela
//    Smartwatch: no professor, pelo cartão que já existe em Mais (o toque passa a abrir esta tela); no aluno, por uma linha nova
//    "Smartwatch" no Perfil, antes de Pet. Expõe window.APAvisoRelogio (estado, abrir, fechar, sincronizar).
// Não muda: o descanso, o som do fim do descanso, o cartão da tela bloqueada, cronômetros, alarmes, despertador, o aviso de
// cadastro, o app Wear OS e a tela "Conexão Wear OS" (continua acessível pela tela nova), treinos, agenda, financeiro, login e
// mascotes. Só lê o descanso.
//
// Uso: node tools/gerar-aviso-relogio-1.12.313.cjs [pacote-1.12.312.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.313';
const sequence = 419;
const title = 'Aviso no relógio';
const summary = 'O relógio vibra quando o descanso acaba, com qualquer relógio que mostre as notificações do celular. Cartão Smartwatch para professor e aluno. Precisa do app Android 1.212.';
const notesText = 'Aviso no relógio.\n\n'
  + 'Quando o descanso acaba, o celular manda um aviso curto, sem som, e o relógio vibra. Funciona com os relógios que mostram as '
  + 'notificações do celular, como Mi Band, Redmi Watch, Amazfit, Galaxy Watch, Huawei e Garmin, pelo app da marca (Mi Fitness, '
  + 'Zepp, Galaxy Wearable, Huawei Saúde, Garmin Connect).\n\n'
  + 'O aviso começa desligado. Para ligar: Mais > Smartwatch, no professor, ou Perfil > Smartwatch, no aluno. Lá estão o passo a '
  + 'passo por marca de relógio, o botão Testar no relógio (o aviso de teste chega em 10 segundos; bloqueie a tela) e os ajustes '
  + 'do aviso.\n\n'
  + 'Vale para o descanso do professor e para o do aluno. Se o descanso for parado antes do fim, o aviso é cancelado.\n\n'
  + 'Precisa do app Android 1.212 ou mais novo. No navegador e no iPhone, o celular pausa o app com a tela apagada; por isso, '
  + 'lá, a tela Smartwatch explica que o aviso funciona no app Android.\n\n'
  + 'O ícone de enviar o treino ao relógio Wear OS só aparece quando houver um relógio Wear OS com o app do Agenda Personal '
  + 'conectado. O app desse relógio ainda não está disponível para instalar; a Conexão Wear OS continua na tela Smartwatch.\n\n'
  + 'O que não muda: o descanso, o som do fim do descanso, o cartão da tela bloqueada, os cronômetros, o despertador, o aviso de '
  + 'cadastro, treinos, agenda, financeiro, login e mascotes.\n\n'
  + 'Inclui tudo do 1.12.312 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.312-Aviso-Cadastro-Local-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '8c5eb7b4bdf100456069eba71352737d62978547c2111d323940a56c27c8fabb';
const TARGET_NAME = 'AgendaPersonal-1.12.313-Aviso-No-Relogio-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// Mesmo texto nas duas telas.
const CSS = String.raw`
/* Smartwatch: aviso no relógio (1.12.313). O ícone Wear OS só aparece com relógio Wear OS e o app do Agenda Personal conectados. */
html:not([data-ap-wear-os="pronto"]) .ap-watch-send-icon{display:none!important}
html:not([data-ap-wear-os="pronto"]) #exerciseScreen .ex-header-title.ap-watch-title{display:block}
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
#profileScreen .profile-option>.ap-relogio-icone{display:inline-grid;place-items:center;flex:none}
#profileScreen .profile-option>.ap-relogio-icone svg{width:27px;height:27px;color:var(--prof-accent);flex:none}
@media (prefers-reduced-motion:reduce){.ap-relogio input[role="switch"],.ap-relogio input[role="switch"]::before{transition:none}}
`;

const JS = String.raw`(function(){
'use strict';
// Smartwatch: aviso no relógio quando o descanso acaba (1.12.313). Pedido do Tiago em 24/11/2026: "faça funcionar para vários
// modelos"; escolheu "Avisos em qualquer relógio". O app da marca do relógio (Mi Fitness, Zepp, Galaxy Wearable, Huawei Saúde,
// Garmin Connect, Wear OS) repassa a notificação do celular. Precisa do Android 1.212 (AvisosRelogio). Mesmo bloco nas duas telas.
// Só lê o descanso (state.workoutRest no professor; restUntil do treino no aluno): não muda descanso, som, alarme nem cronômetro.
if(window.APAvisoRelogio)return;
const professor=!!document.getElementById('screen-more'),aluno=!professor&&!!document.getElementById('profileScreen');
if(!professor&&!aluno)return;
const CHAVE=professor?'professor':'aluno',PAPEL=professor?'teacher':'student',ID='apAvisoRelogio',MARCA='apRelogioMarca';
// Mesmo traço dos ícones do Perfil (profileSymbol): 2.
const ICONE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="6" width="14" height="12" rx="3"/><path d="m8 6 1-4h6l1 4m-8 12 1 4h6l1-4m-4-9v3l2 1m5-3h1"/></svg>';
const MARCAS=[
 ['xiaomi','Xiaomi, Redmi ou Mi Band','No app Mi Fitness (ou Zepp Life, nas Mi Band mais antigas), entre no relógio, abra as notificações de apps e ligue o Agenda Personal.'],
 ['amazfit','Amazfit','No app Zepp, entre no relógio, abra os alertas de notificação de apps e ligue o Agenda Personal.'],
 ['samsung','Samsung Galaxy Watch','No app Galaxy Wearable, abra as notificações do relógio e ligue o Agenda Personal.'],
 ['huawei','Huawei ou Honor','No app Huawei Saúde (ou Honor Health), entre no relógio, abra as notificações e ligue o Agenda Personal.'],
 ['garmin','Garmin','No app Garmin Connect, entre no relógio, abra Notificações e alertas e permita as notificações de apps.'],
 ['wearos','Pixel Watch ou outro Wear OS','Os avisos do celular já aparecem no relógio. No app Pixel Watch ou Wear OS, confira se o Agenda Personal não está bloqueado.'],
 ['apple','Apple Watch','O Apple Watch só recebe notificações de iPhone. Com celular Android, ele não recebe o aviso.'],
 ['outro','Outra marca','No app do relógio, procure as notificações de apps e ligue o Agenda Personal.']
];
const HTML='<header class="ap-watch-setup-heading"><h2 id="apRelogioTitulo" tabindex="-1">Smartwatch</h2><button type="button" data-relogio-fechar aria-label="Fechar Smartwatch">×</button></header>'
 +'<p class="ap-watch-help">O relógio vibra quando o descanso acaba. Funciona com os relógios que mostram as notificações do celular, como Mi Band, Redmi Watch, Amazfit, Galaxy Watch, Huawei e Garmin.</p>'
 +'<section class="ap-watch-connection"><label class="ap-relogio-chave" for="apRelogioLigar"><span><strong>Avisar no relógio</strong><small>Quando o descanso acabar</small></span><input id="apRelogioLigar" type="checkbox" role="switch" data-relogio-ligar></label><p data-relogio-estado role="status" aria-live="polite"></p></section>'
 +'<div class="ap-watch-actions" data-relogio-acoes><button type="button" data-relogio-testar>Testar no relógio</button><button type="button" data-relogio-ajustes>Ajustes do aviso</button></div>'
 +'<p data-relogio-retorno class="ap-watch-help" role="status" aria-live="polite" hidden></p>'
 +'<h3>Como ligar no seu relógio</h3><label for="apRelogioMarca">Marca do relógio</label><select id="apRelogioMarca"></select><p data-relogio-passo></p>'
 +'<p class="ap-watch-help">Os nomes dos menus mudam conforme a versão do app da marca. Se o teste não chegar, bloqueie a tela do celular e teste de novo: alguns apps só repassam avisos com a tela apagada.</p>'
 +'<section class="ap-watch-requirements" data-relogio-wearos-secao><h3>Relógio Wear OS com app próprio</h3><p>Para Galaxy Watch 4 ou mais novo, Pixel Watch e Xiaomi Watch 2 existe também um app de relógio, com a lista de séries no pulso. Ele ainda não está disponível para instalar.</p><button type="button" data-relogio-wearos>Conexão Wear OS</button></section>'
 +'<div class="ap-watch-actions"><button type="button" data-relogio-fechar>Fechar</button></div>';
const android=()=>{try{return window.Android||window.parent?.Android||null}catch(e){return null}};
const ponte=()=>{const a=android();try{return a&&typeof a.getWatchNoticeVersion==='function'&&a.getWatchNoticeVersion()>=1?a:null}catch(e){return null}};
function lerEstado(){const a=ponte();if(!a)return null;try{const s=JSON.parse(a.getWatchNoticeStatus()||'{}');return s&&typeof s==='object'?s:{erro:'estado'}}catch(e){return {erro:'estado'}}}

// Descanso em andamento nesta tela: {fim, texto} ou null. Só leitura.
function descansoProfessor(){
 try{
  const r=typeof state==='object'&&state?state.workoutRest:null;
  if(!r||!Number.isFinite(r.endAt))return null;
  return {fim:r.endAt,texto:[r.student,r.exercise].filter(x=>typeof x==='string'&&x.trim()).join(' · ')};
 }catch(e){return null}
}
function descansoAluno(){
 try{
  if(window.__AP_STUDENT_CONTEXT?.role!=='student'||typeof exStore!=='function')return null;
  let melhor=null;
  for(const [id,s] of Object.entries(exStore().active||{})){const fim=Number(s?.restUntil);if(Number.isFinite(fim)&&fim>0&&(!melhor||fim>melhor.fim))melhor={id,s,fim}}
  if(!melhor)return null;
  let nome='';
  try{
   const auto=melhor.s.apAutoRestSeries,lista=exercisesFor(melhor.id);
   const indice=auto&&auto.deadline===melhor.fim?auto.exercise:exActiveId===melhor.id?exIndex:-1;
   nome=typeof lista?.[indice]?.name==='string'?lista[indice].name:'';
  }catch(e){}
  return {fim:melhor.fim,texto:nome};
 }catch(e){return null}
}
const descanso=professor?descansoProfessor:descansoAluno;

// Marca no Android o aviso do fim do descanso e desmarca quando o descanso é parado antes do fim.
let ligadoCache=null,lidoEm=0,marcado=null,recusado='',inicio=true;
function ligado(forcar){const agora=Date.now();if(forcar||ligadoCache===null||agora-lidoEm>10000){lidoEm=agora;const s=lerEstado();ligadoCache=!!(s&&s.ativo===true)}return ligadoCache}
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
}

// Estado para a tela Smartwatch.
function estado(){
 if(!android())return {nivel:'web',ligado:false,pode:false,texto:'O aviso no relógio funciona no aplicativo Android. Pelo navegador, o celular pausa o app com a tela apagada e o aviso não sai na hora.'};
 const s=lerEstado();
 if(!s)return {nivel:'atualizar',ligado:false,pode:false,texto:'Atualize o aplicativo Android para a versão 1.212 ou mais nova para usar o aviso no relógio.'};
 if(s.erro)return {nivel:'atencao',ligado:false,pode:true,texto:'Não foi possível ler o estado do aviso agora.'};
 const ligado=s.ativo===true;
 if(!ligado)return {nivel:'desligado',ligado,pode:true,texto:'Desligado. Ligue para o relógio vibrar no fim de cada descanso.'};
 if(s.permissao===false)return {nivel:'atencao',ligado,pode:true,texto:'As notificações do Agenda Personal estão bloqueadas neste celular. Toque em Ajustes do aviso para liberar.'};
 if(s.canal==='desligado')return {nivel:'atencao',ligado,pode:true,texto:'O aviso está desligado nos ajustes do Android. Toque em Ajustes do aviso para ligar.'};
 if(s.canal==='silencioso')return {nivel:'atencao',ligado,pode:true,texto:'O aviso está silencioso no Android, e alguns relógios não vibram assim. Toque em Ajustes do aviso.'};
 if(s.exato===false)return {nivel:'atencao',ligado,pode:true,texto:'Ligado. Sem a permissão Alarmes e lembretes, o aviso pode atrasar.'};
 return {nivel:'ok',ligado,pode:true,texto:'Ligado. No fim de cada descanso, o celular manda um aviso curto, sem som, e o relógio vibra.'};
}

let dialogo=null,relogio=0,retorno='',falhou=false;
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
function mostrar(){
 const d=dialogo;if(!d)return;
 const e=estado(),chave=d.querySelector('[data-relogio-ligar]'),st=d.querySelector('[data-relogio-estado]'),r=d.querySelector('[data-relogio-retorno]');
 chave.checked=!!e.ligado;chave.disabled=!e.pode;
 st.textContent=e.texto;st.dataset.nivel=e.nivel;
 d.querySelector('[data-relogio-acoes]').hidden=!e.pode;
 r.hidden=!retorno;r.textContent=retorno;r.dataset.nivel=falhou?'atencao':'ok';
}
function fechar(){clearInterval(relogio);relogio=0;const d=dialogo;dialogo=null;if(d){try{d.close()}catch(e){}d.remove()}try{wearOs()}catch(e){}}
function abrir(){
 fechar();retorno='';falhou=false;
 const d=document.createElement('dialog');d.id=ID;d.className='ap-watch-dialog ap-relogio';d.setAttribute('aria-labelledby','apRelogioTitulo');
 d.innerHTML=HTML;tema(d);
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
 for(const b of d.querySelectorAll('[data-relogio-fechar]'))b.onclick=fechar;
 d.addEventListener('cancel',ev=>{ev.preventDefault();fechar()});
 document.body.append(d);dialogo=d;mostrar();
 try{d.showModal()}catch(e){d.setAttribute('open','')}
 d.querySelector('h2').focus({preventScroll:true});d.scrollTop=0;
 relogio=setInterval(mostrar,2500);
}

// Professor: o cartão Smartwatch que já existe em Mais passa a abrir esta tela.
function cartaoProfessor(){
 if(!professor)return;
 const card=document.getElementById('moreSmartwatch');if(!card)return;
 card.setAttribute('aria-controls',ID);card.setAttribute('aria-haspopup','dialog');
 const texto=card.querySelector('.more-function-copy small');if(texto)texto.textContent='Aviso no relógio ao fim do descanso.';
 card.onclick=()=>abrir();
}
// Aluno: linha "Smartwatch" no Perfil, antes de Pet.
function linhaAluno(){
 if(!aluno)return;
 const lista=document.querySelector('#profileScreen .profile-options');if(!lista)return;
 let b=document.getElementById('apProfileRelogio');
 if(!b){
  b=document.createElement('button');b.id='apProfileRelogio';b.type='button';b.className='profile-option';
  b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls',ID);
  b.innerHTML='<span class="ap-relogio-icone">'+ICONE+'</span><div><strong>Smartwatch</strong><small>Aviso no relógio ao fim do descanso</small></div><span class="profile-chevron" data-profile-icon="chevron"></span>';
  b.onclick=()=>abrir();
  const antes=document.getElementById('apProfilePet')||document.getElementById('apProfileUpdates');
  if(antes&&antes.parentElement===lista)lista.insertBefore(b,antes);else lista.append(b);
 }
 const seta=b.querySelector('[data-profile-icon="chevron"]');
 if(seta&&!seta.firstChild&&typeof profileSymbol==='function')seta.innerHTML=profileSymbol('chevron');
}
// Ícone Wear OS: só com relógio Wear OS conectado e com o app do Agenda Personal (o app do relógio ainda não é distribuído).
function wearOs(){
 let pronto=false;
 try{const a=android();if(typeof a?.getWatchStatus==='function'){const c=JSON.parse(a.getWatchStatus()||'{}').connection;pronto=c?.state==='checked'&&Array.isArray(c.nodes)&&Array.isArray(c.appNodes)&&c.nodes.some(n=>c.appNodes.includes(n?.id))}}catch(e){}
 document.documentElement.dataset.apWearOs=pronto?'pronto':'ausente';
}

window.APAvisoRelogio=Object.freeze({estado,abrir,fechar,sincronizar:()=>sincronizar(true)});
if(aluno&&typeof profileRender==='function'){const original=profileRender;profileRender=function(...a){const r=original.apply(this,a);try{linhaAluno()}catch(e){}return r}}
addEventListener('ap-student-ready',()=>{try{linhaAluno()}catch(e){}});
addEventListener('ap-account-changed',()=>{fechar();marcado=null;inicio=true;try{linhaAluno()}catch(e){}});
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

// Antes do último </body> (o index.html também tem "</body>" dentro de textos de janelas abertas pelo app).
function inserir(html, pagina) {
  const fim = html.lastIndexOf('</body>');
  assert.ok(fim > 0 && /^<\/body>\s*<\/html>\s*$/.test(html.slice(fim)), 'O fim da página não é </body></html>: ' + pagina);
  for (const novo of ['ap-aviso-relogio', 'APAvisoRelogio', 'apProfileRelogio', 'data-ap-wear-os'])
    assert.equal(count(html, novo), 0, novo + ' já existe no 1.12.312 (' + pagina + ')');
  return html.slice(0, fim) + CSS_BLOCK + JS_BLOCK + html.slice(fim);
}
function editStudent(html) {
  for (const needed of ['id="profileScreen"', '<div class="profile-options" aria-label="Opções da conta">',
    '<button id="apProfilePet" type="button" class="profile-option"', 'function profileSymbol(name){', 'chevron:',
    'function exStore(){', 'function exercisesFor(id){', 'let exActiveId="A",exIndex=0,', 'function toggleRestTimer(){',
    's.restUntil=now+exercisesFor(exActiveId)[exIndex].rest*1e3', 'session.restUntil = deadline;',
    'session.apAutoRestSeries = {deadline, exercise, series};', 'window.__AP_STUDENT_CONTEXT', '#profileScreen{--prof-accent:',
    '#profileScreen.profile-light{', 'class="ap-watch-send-icon"', 'e.classList.add("ap-watch-title")',
    '#exerciseScreen .ex-header-title.ap-watch-title{display:grid;', '.ex-header-title{flex:1;min-width:0}',
    'window.APWatchUI=Object.freeze({send:n,results:c,setup:s,close:r})', '.ap-watch-dialog{box-sizing:border-box;'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.312 (index.html): ' + needed);
  assert.equal(count(html, 'id="screen-more"'), 0, 'index.html não pode ter #screen-more (o bloco decide a tela por ele)');
  return inserir(html, 'index.html');
}
function editProfessor(html) {
  for (const needed of ['id="screen-more"', "card.id='moreSmartwatch'", "card.onclick=()=>APWatchUI.setup('teacher')",
    '<span class="more-function-copy"><strong>Smartwatch</strong><small>Conexão e treinos no relógio.</small></span>',
    "d.workoutRest=d.workoutRest&&typeof d.workoutRest==='object'&&Number.isFinite(d.workoutRest.endAt)?d.workoutRest:null;",
    "student:studentById(p.studentId)?.name||'Aluno',exercise:ex.name,seconds,endAt:Date.now()+seconds*1000",
    "exercise:'Bi-set '+(groups(day).indexOf(g)+1)+' · descanso após B'", 'function stopWorkoutRest(){',
    'class=\\"ap-watch-send-icon\\"', 'window.APWatchUI=Object.freeze({send,results,setup,close});',
    "root.style.setProperty('--ac-'+key,value)", "root.dataset.agendaColorMode=p.light?'light':'dark'", '--amber:'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.312 (professor.html): ' + needed);
  assert.equal(count(html, 'id="profileScreen"'), 0, 'professor.html não pode ter #profileScreen');
  return inserir(html, 'professor.html');
}
function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.312');
  assert.equal(source.sequence, 418);
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
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.312 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}
if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}
module.exports = {makeUpdate, loadSource, editStudent, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME, CSS, JS};
