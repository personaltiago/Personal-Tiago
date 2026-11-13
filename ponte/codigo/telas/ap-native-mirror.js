(function(){'use strict';
 if(window.APNativeMirror)return;
 const KEY='agendaPersonalTL_v1',DELAY=2500,TICK=60000;
 const bridge=()=>{try{const a=window.Android||window.parent&&window.parent.Android;return a&&typeof a.mirrorSave==='function'&&typeof a.mirrorInfo==='function'?a:null}catch(_){return null}};
 const hash=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16)};
 const local=()=>{try{return localStorage.getItem(KEY)}catch(_){return null}};
 let timer=0,busy=false,refused=false,failed=false;
 function info(){const a=bridge();if(!a)return{available:false};try{return Object.assign({available:true},JSON.parse(a.mirrorInfo(KEY)))}catch(_){return{available:true,exists:false,error:true}}}
 function save(force){const a=bridge(),v=local();if(!a||!v||v.length<2||busy)return false;busy=true;
  try{const i=info();if(i.exists&&i.hash===hash(v)&&i.length===v.length){refused=false;failed=false;return true}
   const ok=(force&&typeof a.mirrorSaveForce==='function'?a.mirrorSaveForce(KEY,v):a.mirrorSave(KEY,v))===true;
   if(ok){refused=false;failed=false}else{const j=info();refused=!!(j.exists&&j.length>20000&&v.length<j.length/2);failed=!refused}
   return ok}catch(_){failed=true;return false}finally{busy=false}}
 function flush(){clearTimeout(timer);timer=0;return save(false)}
 function schedule(){if(!bridge())return;clearTimeout(timer);timer=setTimeout(flush,DELAY)}
 try{const proto=Storage.prototype,original=proto.setItem;proto.setItem=function(k,v){const r=original.apply(this,arguments);if(k===KEY){try{if(this===window.localStorage)schedule()}catch(_){}}return r};}catch(_){}
 function check(){if(document.hidden)return;try{const v=local(),i=info();if(!i.available||!v)return;if(!i.exists||i.hash!==hash(v))schedule()}catch(_){}}
 function status(){const i=info(),v=local();if(!i.available)return{available:false};
  return{available:true,exists:!!i.exists,savedAt:i.savedAt||0,length:i.length||0,bytes:i.bytes||0,damaged:!!i.damaged,
   inSync:!!(i.exists&&v&&i.hash===hash(v)&&i.length===v.length),refused,failed}}
 function now(){return save(true)}
 addEventListener('pagehide',()=>{try{flush()}catch(_){}});
 document.addEventListener('visibilitychange',()=>{try{document.hidden?flush():check()}catch(_){}});
 setTimeout(check,4000);setInterval(check,TICK);
 window.APNativeMirror=Object.freeze({status,flush,now,hash});
})();