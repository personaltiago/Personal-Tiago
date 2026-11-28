(function(){
 'use strict';
 const NAMES=['index.html','professor.html','avaliacoes.html','cadastro.html'],MAX=24*1024*1024,APP='com.tiagolima.agendapersonal',DB='agenda-personal-web-v1';
 const $=id=>document.getElementById(id),app=$('agendaApp');let current=null,pending=null,latest=null,busy=null,db=null,lastError='',manifestCheckedAt=null,focusBefore=null,channel=null,dialogType='updates',loaded=false,installing=false;
 const text=(id,s)=>{const n=$(id);if(n)n.textContent=s},escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const failure=message=>{const e=Error(message);e.appMessage=true;throw e};
 const explain=e=>e?.appMessage?e.message:/Quota|storage|armazenamento/i.test(e?.message||'')?'Não foi possível salvar neste navegador. Confira o espaço livre e as permissões de armazenamento.':/Timeout|Abort/.test(e?.name||'')?'A conexão demorou. Tente novamente.':'Não foi possível concluir. Confira sua conexão e tente novamente.';
 function validBundle(b){if(!b||b.format!==1||b.appId!==APP||b.bridgeVersion!==3||b.dataSchema!==4||!Number.isSafeInteger(b.sequence)||b.sequence<99||!/^\d+\.\d+\.\d+$/.test(b.version||'')||Object.keys(b.files||{}).length!==4||NAMES.some(n=>typeof b.files[n]!=='string'||!b.files[n].includes('</html>')||n!=='cadastro.html'&&!b.files[n].includes('data-agenda-ready')||b.files[n].includes('window.__agendaNativeReleaseToken'+'=')))failure('O arquivo de atualização não é compatível.');return b}
 function validManifest(m){if(!m?.available)return null;if(m.appId!==APP||m.format!==1||m.bridgeVersion!==3||m.dataSchema!==4||!Number.isSafeInteger(m.sequence)||m.sequence<99||!/^\d+\.\d+\.\d+$/.test(m.version||'')||!Number.isSafeInteger(m.size)||m.size<1||m.size>MAX||!/^[a-f0-9]{64}$/.test(m.sha256||'')||!/^\/api\/bundle\/[a-f0-9-]{36}$/.test(m.bundlePath||''))failure('O servidor informou uma atualização incompatível.');return m}
 function connect(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>{q.result.createObjectStore('releases',{keyPath:'id'});q.result.createObjectStore('meta')};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('Não foi possível acessar o armazenamento deste navegador.'));q.onblocked=()=>reject(Error('Feche as outras abas do Agenda Personal e tente novamente.'))})}
 function get(store,key){return new Promise((resolve,reject)=>{const tx=db.transaction(store),q=tx.objectStore(store).get(key);q.onsuccess=()=>{try{const value=q.result||null;if(store==='releases'&&value&&!value.bundle)value.bundle=validBundle(JSON.parse(value.raw));resolve(value)}catch(e){reject(e)}};q.onerror=()=>reject(q.error)})}
 function save(record,activate){return new Promise((resolve,reject)=>{const tx=db.transaction(['releases','meta'],'readwrite'),records=tx.objectStore('releases'),meta=tx.objectStore('meta');records.put({id:record.id,raw:record.raw,sequence:record.bundle.sequence});let active=null,staged=null,reads=0;const done=()=>{if(++reads!==2)return;const pointer={id:record.id,sequence:record.bundle.sequence};let keep;
  if(activate){if(!active||active.sequence<=pointer.sequence)meta.put(pointer,'active');if(staged&&staged.sequence<=pointer.sequence)meta.delete('pending');keep=new Set([active?.id,pointer.id,staged&&staged.sequence>pointer.sequence?staged.id:null])}
  else{if(!staged||staged.sequence<=pointer.sequence){meta.put(pointer,'pending');staged=pointer}keep=new Set([active?.id,staged?.id])}
  const keys=records.getAllKeys();keys.onsuccess=()=>{for(const key of keys.result)if(!keep.has(key))records.delete(key)};
 };const a=meta.get('active'),p=meta.get('pending');a.onsuccess=()=>{active=a.result;done()};p.onsuccess=()=>{staged=p.result;done()};tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(Error('Não foi possível salvar a atualização. Libere espaço no aparelho e tente novamente.'))})}
 function appWindow(){return app.contentWindow}
 function canInstall(){try{
  const w=appWindow();if(!w?.APaccounts||w.APWebPlatform?.idle?.()!==true||w.APupdates?.canInstall?.()===false)return false;
  const frame=w.document.getElementById('apPreviewTeacher');if(frame?.hasAttribute('srcdoc')&&frame.getClientRects().length&&frame.contentWindow?.APWebPlatform?.idle?.()!==true)return false;
  return true;
 }catch(_){return false}}
 function pendingIsCurrent(){return !!(manifestCheckedAt && latest && pending && latest.sequence === pending.bundle.sequence && latest.sha256 === pending.id)}
 function autoApply(){if(pendingIsCurrent()&&!busy&&!installing&&loaded&&pending&&!document.hidden&&!$('webDialog').open&&canInstall())apply()}

 function teacher(){try{return appWindow()?.APaccounts?.isTeacher()===true}catch(_){return false}}
 function status(){return {installedVersion:current?.bundle.version||'',installedSequence:current?.bundle.sequence||0,manifest:manifestCheckedAt?latest:null}}
 function refresh(){text('webInstalledVersion',current?'v'+current.bundle.version:'');const show=pendingIsCurrent()&&!!pending&&pending.bundle.sequence>(current?.bundle.sequence||0);$('updateBanner').hidden=!show;text('updateBannerText',show?'Versão '+pending.bundle.version+' disponível.':'');try{appWindow()?.APWebPlatform?.refresh()}catch(_){}if($('webDialog').open&&dialogType==='updates')renderUpdates()}
 function page(name){if(!NAMES.includes(name)||!current)failure('Tela indisponível.');let html=current.bundle.files[name];if(name==='professor.html')html=html.replace(/<script[^>]*id=["']ap-teacher-sync["'][^>]*>[\s\S]*?<\/script>/i,'').replace(/<style[^>]*id=["']ap-teacher-sync-style["'][^>]*>[\s\S]*?<\/style>/i,'');
  if(name==='professor.html'&&!html.includes('data-agenda-registration-notices')&&html.includes('teacher:e})})();')){
   html=html.replace(/<script data-agenda-registration>[\s\S]*?<\/script>/, registration => registration
    .replace('teacher:e})})();','teacher:e,registrationSdk:A})})();')
    .replace(/(function T\(\)\{)(\s*const list=c\(['"]registrationContactsList['"]\);)/,
     '$1\n document.dispatchEvent(new Event("ap-registration-contacts-change"));$2'));
   html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/app/registration-notices.css"></head>');
   html=html.replace(/<\/body>/i,'<script data-agenda-registration-notices src="/app/registration-notices.js"></script></body>');
  }
  // This adapter also supports releases published before web support existed.
  html=html.replace(/function openUpdates\(\)\s*\{/,'function openUpdates(){if(window.APWebPlatform)return APWebPlatform.openUpdates();').replace(/function openAppUpdates\(\)\s*\{/,'function openAppUpdates(){if(window.APWebPlatform)return APWebPlatform.openUpdates();');
  html=html.replace(/window\.Android\?\.(getUpdateStatus|getPublishableUpdate|applyPublishedUpdate)/g,'(window.Android||window.APWebPlatform)?.$1').replace(/\bAndroid\.(getUpdateStatus|getPublishableUpdate|applyPublishedUpdate)\(/g,'(window.Android||window.APWebPlatform).$1(');
  if(name==='index.html'){
   html=html.replace(/(<script\b[^>]*\bid=["']ap-distribution-controls["'][^>]*>[\s\S]*?<\/script>)/i, '$1<script src="/app/publication-panel.js"></script>');
   for(const [id,file]of [['ap-firebase-loader','firebase-loader.js'],['ap-login-session','login-session.js']])
    html=html.replace(new RegExp('<script\\b[^>]*\\bid=["\']'+id+'["\'][^>]*>[\\s\\S]*?<\\/script>','i'),'<script id="'+id+'" src="/app/'+file+'"></script>');
  }
  const head='<base href="'+location.origin+'/app/"><script src="/app/platform.js"></script>';
  if(!/<head(?:\s[^>]*)?>/i.test(html))failure('Esta versão não contém uma tela web válida.');return html.replace(/<head(?:\s[^>]*)?>/i,headTag=>headTag+head);
 }
 function show(record){current=record;loaded=false;app.srcdoc=page('index.html');app.hidden=false;$('launch').hidden=true;refresh()}
 function progress(loaded,total){const p=Math.min(100,Math.round(loaded/total*100));$('launchProgress').hidden=false;$('launchProgress').value=p;text('launchStatus','Recebendo o aplicativo: '+(loaded/1048576).toFixed(1).replace('.',',')+' de '+(total/1048576).toFixed(1).replace('.',',')+' MB');text('dialogStatus','Recebendo atualização: '+p+'%.')}
 async function download(m){const response=await fetch(m.bundlePath,{cache:'no-store',signal:globalThis.AbortSignal?.timeout?.(120000)});if(!response.ok)failure('Não foi possível baixar a atualização. Tente novamente.');let bytes;
  if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX||size>m.size){await reader.cancel();failure('A atualização ultrapassou o tamanho informado.')}chunks.push(value);progress(size,m.size)}bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}}
  else bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length!==m.size)failure('O download ficou incompleto. Tente novamente.');const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==m.sha256)failure('A atualização não passou na verificação. Tente novamente.');
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes),bundle=validBundle(JSON.parse(raw));if(bundle.sequence!==m.sequence||bundle.version!==m.version)failure('A versão recebida não corresponde à publicação.');return {id:hash,raw,bundle};
 }
 async function check(){if(busy)return busy;busy=(async()=>{lastError='';manifestCheckedAt=null;text('dialogStatus','Consultando atualização…');try{const r=await fetch('/api/manifest',{cache:'no-store',signal:globalThis.AbortSignal?.timeout?.(15000)});if(!r.ok)failure('O serviço de atualizações está indisponível.');latest=validManifest(await r.json());manifestCheckedAt=new Date();if(!latest){if(!current)failure('Nenhuma versão foi publicada. Na conta do professor no Android, abra Atualizações → Publicar para os alunos e envie o arquivo .agenda.json recebido.');return}
   if(current && latest.sequence===current.bundle.sequence && latest.sha256!==current.id)failure('A versão em uso e o servidor têm a mesma sequência, mas arquivos diferentes. Confira a publicação.');
   if(latest.sequence<=(current?.bundle.sequence||0)||(pending && pending.bundle.sequence===latest.sequence && pending.id===latest.sha256))return;
   const record=await download(latest);await save(record,!current);if(!current)show(record);else{pending=record;channel?.postMessage({type:'release-ready',id:record.id});setTimeout(autoApply,1000)}
  }catch(e){lastError=explain(e);if(!current)throw e}finally{busy=null;refresh()}})();return busy}
 async function apply(){if(!pending||installing||busy)return;if(!pendingIsCurrent()){lastError='Consulte o servidor novamente para confirmar a versão antes de instalar.';renderUpdates();return;}if(!canInstall()){lastError='Finalize o treino e feche as telas de edição antes de atualizar.';renderUpdates();return}try{installing=true;await save(pending,true);const record=pending;pending=null;$('webDialog').close();show(record)}catch(e){lastError=explain(e);renderUpdates()}finally{installing=false}}
 function close(){if($('webDialog').open)$('webDialog').close();focusBefore?.focus()}
 function openDialog(title,type){focusBefore=document.activeElement;dialogType=type;text('webDialogTitle',title);if(!$('webDialog').open)$('webDialog').showModal()}
 let installPrompt = null;
 let appInstalled = false;

 function isInstalledApp() {
  return appInstalled || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
 }

 function updateInstallButtons() {
  const installed = isInstalledApp();
  $('installHelp').hidden = installed;
  const dialogButton = $('webInstall');
  if (dialogButton) dialogButton.hidden = installed;
  const retryButton = $('webPromptInstall');
  if (retryButton) retryButton.hidden = installed || !installPrompt;
 }

 function showInstallHelp() {
  openDialog('Instalar Agenda Personal', 'install');
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  $('webDialogBody').innerHTML = ios
   ? '<p>No Safari do iPhone:</p><ol><li>Toque em <strong>Compartilhar</strong>.</li><li>Escolha <strong>Adicionar à Tela de Início</strong>.</li><li>Se aparecer, mantenha <strong>Abrir como App da Web</strong> ativado e toque em <strong>Adicionar</strong>.</li></ol>'
   : '<p>Se o link abriu dentro do WhatsApp ou de outro app, abra esta página no <strong>Chrome</strong>.</p><p>Se a confirmação ainda estiver indisponível, use <strong>⋮ → Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p><button id="webPromptInstall" type="button" hidden>Instalar app</button>';
  const retryButton = $('webPromptInstall');
  if (retryButton) retryButton.onclick = install;
  updateInstallButtons();
 }

 async function install() {
  if (isInstalledApp()) return;
  if (!installPrompt) {
   showInstallHelp();
   return;
  }

  const prompt = installPrompt;
  installPrompt = null;
  updateInstallButtons();
  try {
   const { outcome } = await prompt.prompt();
   if (outcome === 'accepted' && $('webDialog').open && dialogType === 'install') close();
  } catch (_) {
   if (!isInstalledApp()) showInstallHelp();
  }
 }

 window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  if (isInstalledApp()) return;
  installPrompt = event;
  updateInstallButtons();
 });
 window.addEventListener('appinstalled', () => {
  appInstalled = true;
  installPrompt = null;
  if ($('webDialog').open && dialogType === 'install') close();
  updateInstallButtons();
 });
 function renderUpdates(){const newer=pendingIsCurrent()&&pending&&pending.bundle.sequence>(current?.bundle.sequence||0),blocked=newer&&!canInstall();$('webDialogBody').innerHTML='<p class="web-version">Versão em uso neste aparelho: '+escape(current?.bundle.version||'—')+'</p><p>Publicação consultada no servidor: '+escape(manifestCheckedAt ? latest?.version||'nenhuma publicada' : 'sem confirmação nesta consulta')+'</p><p>'+(newer?'Versão '+escape(pending.bundle.version)+' pronta para instalar.':latest&&latest.sequence>(current?.bundle.sequence||0)?'Há uma publicação disponível. Consulte novamente para concluir o download.':'Esta é a mesma publicação enviada pelo professor para Android e iPhone.')+'</p><p id="dialogStatus" role="status" data-error="'+!!lastError+'">'+escape(lastError||(blocked?'Finalize o treino e feche as telas de edição antes de atualizar.':busy?'Recebendo atualização…':''))+'</p><div class="dialog-actions"><button id="webCheck" type="button" '+(busy?'disabled':'')+'>Verificar atualização</button>'+(newer?'<button id="webApply" type="button" '+(blocked?'disabled':'')+'>Instalar versão '+escape(pending.bundle.version)+'</button>':'')+(teacher()?'<button id="webPublish" type="button">Publicar para os alunos</button>':'')+'<button id="webInstall" type="button">Instalar app</button></div><p class="muted">Atualizar mantém os registros salvos neste navegador. O login e a sincronização precisam de conexão.</p>';$('webCheck').onclick=()=>check().catch(()=>{});if($('webApply'))$('webApply').onclick=apply;if($('webPublish'))$('webPublish').onclick=()=>{close();appWindow()?.APupdates?.openPublisher()};$('webInstall').onclick=install;updateInstallButtons()}
 function openUpdates(){openDialog('Atualizações','updates');renderUpdates();return true}
 window.APWebHost=Object.freeze({page,status,publishable:()=>current?.raw||'',openUpdates,check,canInstall,accountChanged(){if($('webDialog').open&&dialogType==='updates')renderUpdates();setTimeout(autoApply,1000)}});
 $('webDialogClose').onclick=close;$('webDialog').addEventListener('click',e=>{if(e.target===$('webDialog')){const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close()}});$('installHelp').onclick=install;updateInstallButtons();$('updateBannerOpen').onclick=openUpdates;
 app.addEventListener('load',()=>{loaded=true;refresh();setTimeout(autoApply,1500)});
 async function start(){try{if(!window.indexedDB)failure('Este navegador não oferece o armazenamento necessário. Atualize o Safari e tente novamente.');try{const key='ap_web_storage_probe';localStorage.setItem(key,'1');localStorage.removeItem(key)}catch(_){failure('O navegador não permite salvar dados. Ative o armazenamento para usar o aplicativo.');}if(!crypto.subtle)failure('Abra este aplicativo por uma conexão HTTPS segura.');db=await connect();const active=await get('meta','active');if(active){const r=await get('releases',active.id);if(r){validBundle(r.bundle);show(r)}}const staged=await get('meta','pending');if(staged){const r=await get('releases',staged.id);if(r&&r.bundle.sequence>(current?.bundle.sequence||0)){validBundle(r.bundle);pending=r;refresh()}}
   try{channel=new BroadcastChannel('agenda-personal-web-updates');channel.onmessage=async e=>{if(e.data?.type==='release-ready'){const r=await get('releases',e.data.id);if(r&&r.bundle.sequence>(current?.bundle.sequence||0)){pending=r;refresh();setTimeout(autoApply,1000)}}}}catch(_){}
   if('serviceWorker'in navigator)navigator.serviceWorker.register('/app/sw.js',{scope:'/app/',updateViaCache:'none'}).catch(()=>{});navigator.storage?.persist?.().catch(()=>{});await check();
  }catch(e){lastError=explain(e);if(!current){text('launchStatus',lastError);$('launchProgress').hidden=true;$('launchRetry').hidden=false;text('launchHint','Os registros existentes não foram apagados.')}}}
 $('launchRetry').onclick=()=>{if(db){$('launchRetry').hidden=true;check().catch(e=>{text('launchStatus',e.message);$('launchRetry').hidden=false})}else location.reload()};
 setInterval(()=>{if(!document.hidden&&current){check().catch(()=>{});autoApply()}},30000);
 addEventListener('online',()=>check().catch(()=>{}));document.addEventListener('visibilitychange',()=>{if(!document.hidden&&current)check().catch(()=>{})});start();
})();
