(function(){
 'use strict';
 let host=null;for(let w=window,i=0;i<5;i++){try{if(w.APWebHost){host=w.APWebHost;break}if(w.parent===w)break;w=w.parent}catch(_){break}}
 if(!host)return;
 const stablePetCamera=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 // Keep Android absent: browser camera, PDF, video and audio fallbacks stay active.
 const originalFetch=window.fetch.bind(window),pages=['index.html','professor.html','avaliacoes.html','cadastro.html'];
 window.fetch=function(input,init){const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,document.baseURI),name=url.pathname.split('/').pop(),method=init?.method||(input instanceof Request?input.method:'GET');if(method==='GET'&&url.origin===new URL(document.baseURI).origin&&url.pathname==='/app/'+name&&pages.includes(name))return Promise.resolve(new Response(host.page(name),{headers:{'Content-Type':'text/html;charset=utf-8'}}));return originalFetch(input,init)};
 window.APWebPlatform=Object.freeze({idle,stablePetCamera,openUpdates:()=>host.openUpdates(),getUpdateStatus:()=>JSON.stringify(host.status()),getPublishableUpdate:()=>host.publishable(),applyPublishedUpdate:()=>host.check(),refresh(){dispatchEvent(new CustomEvent('ap-update-status',{detail:host.status()}));window.APupdates?.refreshNotice?.()}});
 function idle(){
  if(document.readyState==='loading'||document.visibilityState==='hidden')return false;
  if(document.activeElement?.matches('input,textarea,select,[contenteditable="true"]'))return false;
  if(document.querySelector('dialog[open],.dialog.open,#apUpdatePublisher:not([hidden])'))return false;
  const assess=document.getElementById('apPreviewAssess');if(assess?.hasAttribute('srcdoc')&&getComputedStyle(assess).display!=='none'&&assess.getClientRects().length)return false;
  try{if(window.__AP_STUDENT_CONTEXT?.role==='student'&&typeof exStore==='function'&&Object.keys(exStore().active||{}).length)return false;if(typeof state!=='undefined'&&(Object.values(state.workoutDrafts||{}).some(d=>d?.active===true)||state.workoutRest?.endAt>Date.now()))return false}catch(_){return false}
  const login=document.getElementById('login');if(login?.getClientRects().length&&[...login.querySelectorAll('input')].some(n=>n.value))return false;
  return true;
 }
 async function loadTeacherSync(){
  if(window.APTeacherSync||typeof state==='undefined'||typeof DB_KEY==='undefined'||DB_KEY!=='agendaPersonalTL_v1')return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='/app/teacher-sync.css';document.head.appendChild(css);
  for(const name of ['teacher-sync-model.js','teacher-sync-preferences.js','teacher-sync.js'])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/app/'+name;script.onload=resolve;script.onerror=reject;document.body.appendChild(script)});
 }
 const refresh=()=>{APWebPlatform.refresh();host.accountChanged()};addEventListener('ap-account-changed',refresh);addEventListener('ap-student-ready',refresh);
 document.addEventListener('DOMContentLoaded',()=>{
  // Existing fallback guidance is made explicit for the iPhone version.
  const settings=document.getElementById('screen-settings');if(settings){const n=document.createElement('p');n.className='teacher-text-setting';n.textContent='No iPhone e na web, mantenha o aplicativo aberto para ouvir os avisos dos cronômetros. Alarmes com a tela bloqueada e toques do Android não estão disponíveis nesta versão.';settings.querySelector('.module-heading')?.after(n)}
  const google=document.querySelector('button.google');if(google?.getAttribute('onclick')?.includes('será ativado')){if(google.previousElementSibling?.classList.contains('divider'))google.previousElementSibling.style.setProperty('display','none','important');google.style.setProperty('display','none','important')}
  document.querySelectorAll('input:not([type=checkbox]):not([type=radio]),select,textarea').forEach(n=>{if(parseFloat(getComputedStyle(n).fontSize)<16)n.style.fontSize='16px'});
  refresh();loadTeacherSync().catch(()=>{const box=document.getElementById('screen-dashboard');if(box){const p=document.createElement('p');p.textContent='Não foi possível carregar a sincronização. Reabra com conexão para trazer sua agenda.';box.prepend(p)}});
 },{once:true});
 addEventListener('pagehide',()=>host.accountChanged());
})();
