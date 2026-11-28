(function(){
 'use strict';let pending;
 window.APloadFirebase=function(){
  if(window.APWebFirebase)return Promise.resolve(window.APWebFirebase);
  if(!pending)pending=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='/app/firebase.js';
   script.onload=()=>{script.remove();window.APWebFirebase?resolve(window.APWebFirebase):reject(Error('AP-SDK-INIT'))};
   script.onerror=()=>{script.remove();reject(Error('AP-SDK-LOAD'))};
   document.head.appendChild(script);
  }).catch(error=>{pending=null;throw error});
  return pending;
 };
})();
