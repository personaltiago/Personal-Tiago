(function(){'use strict';
 if(window.APNativeStore)return;
 const KEY='agendaPersonalTL_v1',DELAY=400,RETRY=3000;
 let root;try{root=window.top;void root.document}catch(_){root=window}
 const S=root.__apNS||(root.__apNS={active:false,value:null,dirty:false,failed:false,broken:false,timer:0,ready:false,writes:0});
 const bridge=()=>{try{const a=window.Android||window.parent.Android||root.Android;return a&&typeof a.nsActive==='function'&&typeof a.nsWrite==='function'?a:null}catch(_){return null}};
 const proto=Storage.prototype,orig={get:proto.getItem,set:proto.setItem,rem:proto.removeItem,clr:proto.clear};
 const mine=t=>{try{return t===window.localStorage}catch(_){return false}};
 function init(){
  if(S.ready)return;S.ready=true;
  const a=bridge();if(!a)return;
  try{if(a.nsActive()===true){S.active=true;const v=a.nsRead();
   if(typeof v==='string'&&v.length>1)S.value=v;else{S.broken=true;S.value=null}}}catch(_){S.active=true;S.broken=true}
 }
 function frames(w,out,depth){try{out.push(w);if(depth>4)return out;for(let i=0;i<w.frames.length;i++)frames(w.frames[i],out,depth+1)}catch(_){}return out}
 function emit(v){try{for(const w of frames(root,[],0)){if(w===window)continue;try{w.dispatchEvent(new w.StorageEvent('storage',{key:KEY,oldValue:null,newValue:v,storageArea:w.localStorage,url:location.href}))}catch(_){}}}catch(_){}}
 function flush(){
  clearTimeout(S.timer);S.timer=0;
  if(!S.active||!S.dirty||S.broken)return true;
  const a=bridge();if(!a){S.failed=true;return false}
  let ok=false;try{ok=a.nsWrite(S.value)===true}catch(_){}
  if(ok){S.dirty=false;S.failed=false;S.writes++;return true}
  S.failed=true;S.timer=setTimeout(flush,RETRY);return false
 }
 function schedule(){clearTimeout(S.timer);S.timer=setTimeout(flush,DELAY)}
 function quota(){try{return new DOMException('Não foi possível salvar no armazenamento do telefone.','QuotaExceededError')}catch(_){const e=new Error('QuotaExceededError');e.name='QuotaExceededError';return e}}
 proto.getItem=function(k){init();if(k===KEY&&S.active&&!S.broken&&mine(this))return S.value;return orig.get.apply(this,arguments)};
 proto.setItem=function(k,v){init();
  if(k===KEY&&S.active&&mine(this)){
   if(S.broken||(S.failed&&S.dirty))throw quota();
   const s=String(v);if(s===S.value)return;S.value=s;S.dirty=true;schedule();emit(s);return}
  return orig.set.apply(this,arguments)};
 proto.removeItem=function(k){init();
  if(k===KEY&&S.active&&mine(this)){S.value=null;S.dirty=false;clearTimeout(S.timer);return}
  return orig.rem.apply(this,arguments)};
 proto.clear=function(){init();if(S.active&&mine(this)){S.value=null;S.dirty=false;clearTimeout(S.timer)}return orig.clr.apply(this,arguments)};
 const rawGet=()=>{try{return orig.get.call(window.localStorage,KEY)}catch(_){return null}};
 const hash=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16)};
 function status(){init();const a=bridge();
  if(!a||typeof a.getMirrorVersion!=='function'||a.getMirrorVersion()<2)return{available:false};
  let info={};try{info=JSON.parse(a.nsInfo())}catch(_){}
  return{available:true,active:!!S.active,broken:!!S.broken,failed:!!S.failed,pending:!!S.dirty,length:S.active?(S.value||'').length:(rawGet()||'').length,
   savedAt:info.savedAt||0,source:info.source||'',reserve:!!info.reserve}}
 function activate(){init();const a=bridge();
  if(!a||a.getMirrorVersion()<2)return{ok:false,error:'indisponivel'};
  if(S.active)return{ok:false,error:'ja-ativo'};
  const v=rawGet();if(typeof v!=='string'||v.length<2)return{ok:false,error:'sem-dados'};
  let r;try{r=JSON.parse(a.nsActivate(v))}catch(_){return{ok:false,error:'erro'}}
  if(!r.ok)return r;
  let back='';try{back=a.nsRead()}catch(_){}
  if(back!==v||r.hash!==hash(v)){try{a.nsDeactivate()}catch(_){}return{ok:false,error:'verificacao'}}
  S.active=true;S.broken=false;S.failed=false;S.dirty=false;S.value=v;
  try{orig.rem.call(window.localStorage,KEY)}catch(_){}
  return{ok:true,length:v.length}}
 function deactivate(){init();const a=bridge();
  if(!a||!S.active)return{ok:false,error:'inativo'};
  if(S.broken)return{ok:false,error:'danificado'};
  if(!flush())return{ok:false,error:'gravacao'};
  const v=S.value;if(typeof v!=='string')return{ok:false,error:'sem-dados'};
  try{orig.set.call(window.localStorage,KEY,v)}catch(_){try{orig.rem.call(window.localStorage,KEY)}catch(__){}return{ok:false,error:'quota'}}
  if(rawGet()!==v){try{orig.rem.call(window.localStorage,KEY)}catch(_){}return{ok:false,error:'verificacao'}}
  let off=false;try{off=a.nsDeactivate()===true}catch(_){}
  if(!off){try{orig.rem.call(window.localStorage,KEY)}catch(_){}return{ok:false,error:'modo'}}
  S.active=false;S.value=null;S.dirty=false;return{ok:true,length:v.length}}
 addEventListener('pagehide',()=>{try{flush()}catch(_){}});
 addEventListener('beforeunload',()=>{try{flush()}catch(_){}});
 document.addEventListener('visibilitychange',()=>{try{if(document.hidden)flush()}catch(_){}});
 window.APNativeStore=Object.freeze({status,activate,deactivate,flush,hash});
})();