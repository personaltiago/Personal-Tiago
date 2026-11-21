(function(scope){
 'use strict';
 const KEY='agenda_remember_login_v1',restored=new WeakSet();
 function storage(name){try{const s=scope[name],key=KEY+'_probe';s.setItem(key,'1');s.removeItem(key);return true}catch(_){return false}}
 function indexedStorage(){return new Promise(resolve=>{
  let db,settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);db?.close();resolve(ok)};
  const timer=setTimeout(()=>finish(false),2500);
  try{
   const request=scope.indexedDB.open('agenda-login-storage-v1',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('probe');
   request.onerror=request.onblocked=()=>finish(false);
   request.onsuccess=()=>{db=request.result;if(settled){db.close();return}db.onversionchange=()=>db.close();
    try{const tx=db.transaction('probe','readwrite'),store=tx.objectStore('probe'),key=Date.now()+'-'+Math.random();
     store.put(1,key);store.delete(key);tx.oncomplete=()=>finish(true);tx.onerror=tx.onabort=()=>finish(false);
    }catch(_){finish(false)}
   };
  }catch(_){finish(false)}
 })}
 function restoreChoice(){const input=document.getElementById('remember');if(!input||restored.has(input))return;
  try{input.checked=scope.localStorage.getItem(KEY)==='true'}catch(_){}restored.add(input);
 }
 scope.APLoginSession=Object.freeze({
  async configure(api,remember){
   if(typeof api.setPersistence!=='function')throw Error('Atualize o aplicativo para salvar sua sessão de acesso.');
   const candidates=remember?[
    ...api.indexedDBLocalPersistence&&await indexedStorage()?[api.indexedDBLocalPersistence]:[],
    ...storage('localStorage')?[api.browserLocalPersistence]:[]
   ]:storage('sessionStorage')?[api.browserSessionPersistence]:[];
   let saved=false;
   for(const candidate of candidates.filter(Boolean))try{await api.setPersistence(api.auth,candidate);saved=true;break}catch(_){}
   if(!saved)throw Error(remember?'Não foi possível manter o acesso salvo neste navegador. Permita o armazenamento do site e tente novamente.':'Não foi possível iniciar uma sessão neste navegador. Permita o armazenamento do site e tente novamente.');
   try{scope.localStorage.setItem(KEY,String(remember))}catch(_){}
  },restoreChoice
 });
 restoreChoice();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restoreChoice,{once:true});
})(globalThis);
