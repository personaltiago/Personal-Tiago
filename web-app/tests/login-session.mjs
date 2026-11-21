import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import * as idb from 'fake-indexeddb';
const {IDBFactory}=idb;

const sdk=await readFile(new URL('../web/firebase.js',import.meta.url),'utf8');
const session=await readFile(new URL('../web/login-session.js',import.meta.url),'utf8');
const key='agenda_remember_login_v1',uid='remembered-student',email='student@example.test';
const password='test-password-never-store',now=Math.floor(Date.now()/1000);
const token=['test',Buffer.from(JSON.stringify({sub:uid,iat:now,exp:now+3600,auth_time:now})).toString('base64url'),'signature'].join('.');
const requests={signins:0,lookups:0};let revoked=false;
class Storage{
 constructor(){this.values=new Map()}
 get length(){return this.values.size}key(i){return [...this.values.keys()][i]??null}
 getItem(k){return this.values.get(String(k))??null}setItem(k,v){this.values.set(String(k),String(v))}removeItem(k){this.values.delete(String(k))}
}
function open({database=new IDBFactory(),local=new Storage(),temporary=new Storage(),denyLocal=false,lateInput=false}={}){
 const timers=new Set(),listeners=new Map();let input=lateInput?null:{checked:false};
 const scope={...Object.fromEntries(Object.entries(idb).filter(([name])=>name.startsWith('IDB'))),
  console,URL,URLSearchParams,Response,Request,Headers,TextEncoder,TextDecoder,atob,btoa,
  crypto:webcrypto,structuredClone,indexedDB:database,sessionStorage:temporary,
  navigator:{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'},
  location:{href:'about:srcdoc',protocol:'about:'},top:{},parent:{},
  document:{readyState:'loading',getElementById:id=>id==='remember'?input:null,
   addEventListener:(name,fn)=>listeners.set(name,fn)},
  addEventListener(){},removeEventListener(){},
  setTimeout(fn,delay,...args){const t=setTimeout(fn,delay,...args);t.unref();timers.add(t);return t},
  clearTimeout, setInterval(fn,delay){const t=setInterval(fn,delay);t.unref();timers.add(t);return t},clearInterval,
  async fetch(url,init){
   const path=String(url);assert.match(path,/^https:\/\/(identitytoolkit|securetoken)\.googleapis\.com\//);
   let data;
   if(path.includes('accounts:signInWithPassword')){
    requests.signins++;const body=JSON.parse(init.body);assert.equal(body.email,email);assert.equal(body.password,password);
    data={localId:uid,email,idToken:token,refreshToken:'test-refresh-token',expiresIn:'3600',registered:true};
   }else if(path.includes('accounts:lookup')){
    requests.lookups++;if(revoked)return new Response(JSON.stringify({error:{message:'USER_DISABLED'}}),{status:400});
    data={users:[{localId:uid,email,emailVerified:true,createdAt:String(Date.now()),lastLoginAt:String(Date.now()),providerUserInfo:[{providerId:'password',email,rawId:email}]}]};
   }else throw Error('Unexpected mocked auth endpoint: '+path);
   return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
  }
 };
 Object.defineProperty(scope,'localStorage',{get(){if(denyLocal)throw Error('blocked');return local}});
 scope.window=scope;scope.self=scope;
 vm.createContext(scope);vm.runInContext(sdk,scope);vm.runInContext(session,scope);
 const [apps,authModule]=scope.APWebFirebase,app=apps.initializeApp({apiKey:'test-api-key',authDomain:'example.test',projectId:'test-project',appId:'test-app'});
 const api={...authModule,auth:authModule.getAuth(app)};
 return {scope,api,local,temporary,database,
  ready:()=>api.auth.authStateReady(),
  mounted(){input={checked:false};listeners.get('DOMContentLoaded')?.();return input},
  close(){for(const t of timers){clearTimeout(t);clearInterval(t)}}};
}

// Real Firebase Auth SDK and real persistence drivers; only its REST transport
// is mocked. Independent VM instances represent a closed/reopened iPhone app.
let shared={database:new IDBFactory(),local:new Storage()};
let first=open(shared);await first.ready();
await first.scope.APLoginSession.configure(first.api,true);
await first.api.signInWithEmailAndPassword(first.api.auth,email,password);
assert.equal(first.api.auth.currentUser.uid,uid);assert.equal(first.local.getItem(key),'true');
assert.equal([...first.local.values.keys()].some(k=>k.startsWith('firebase:authUser:')),false,'remembered user must use IndexedDB first');
assert.equal([...first.local.values.values()].some(v=>v.includes(password)),false);
first.close();
let reopened=open({...shared,lateInput:true});await reopened.ready();
assert.equal(reopened.api.auth.currentUser.uid,uid);assert.equal(requests.signins,1,'reopening must not submit credentials again');
assert.equal(reopened.mounted().checked,true,'restore checkbox even when the script runs before the input exists');
await reopened.api.signOut(reopened.api.auth);reopened.close();
let afterLogout=open(shared);await afterLogout.ready();assert.equal(afterLogout.api.auth.currentUser,null);afterLogout.close();

// Existing releases used localStorage first. Reading that same Firebase user
// with the new SDK migrates it to IndexedDB without collecting credentials.
first=open(shared);await first.ready();
await first.api.setPersistence(first.api.auth,first.api.browserLocalPersistence);
await first.api.signInWithEmailAndPassword(first.api.auth,email,password);
assert([...shared.local.values.keys()].some(k=>k.startsWith('firebase:authUser:')));first.close();
const signinsBeforeMigration=requests.signins;
reopened=open(shared);await reopened.ready();assert.equal(reopened.api.auth.currentUser.uid,uid);
assert.equal(requests.signins,signinsBeforeMigration);
assert.equal([...shared.local.values.keys()].some(k=>k.startsWith('firebase:authUser:')),false);
await reopened.api.signOut(reopened.api.auth);reopened.close();

// Without remember, refresh in the current tab works; closing the tab clears
// its sessionStorage and must require a new login.
const temporary=new Storage();first=open({...shared,temporary});await first.ready();
await first.scope.APLoginSession.configure(first.api,false);
await first.api.signInWithEmailAndPassword(first.api.auth,email,password);first.close();
reopened=open({...shared,temporary});await reopened.ready();assert.equal(reopened.api.auth.currentUser.uid,uid);reopened.close();
afterLogout=open(shared);await afterLogout.ready();assert.equal(afterLogout.api.auth.currentUser,null);afterLogout.close();

// Safari storage fallback: IndexedDB unavailable still permits supported local
// persistence. If both are blocked, fail clearly instead of silently using RAM.
shared={database:null,local:new Storage()};first=open(shared);await first.ready();
await first.scope.APLoginSession.configure(first.api,true);await first.api.signInWithEmailAndPassword(first.api.auth,email,password);first.close();
reopened=open(shared);await reopened.ready();assert.equal(reopened.api.auth.currentUser.uid,uid);reopened.close();
revoked=true;afterLogout=open(shared);await afterLogout.ready();assert.equal(afterLogout.api.auth.currentUser,null,'server-revoked access must not be restored');afterLogout.close();revoked=false;
const blocked=open({database:null,denyLocal:true});await blocked.ready();
await assert.rejects(blocked.scope.APLoginSession.configure(blocked.api,true),/Não foi possível manter/);blocked.close();
console.log('PASS: actual web Firebase SDK; remembered student restored across fresh iframe/app instances without resending credentials; checkbox restored; explicit logout; session-only close vs reload; local fallback; blocked storage; revoked user. Auth REST is mocked, no production account accessed.');
