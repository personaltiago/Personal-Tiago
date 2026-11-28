(()=>{/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Jp=()=>{};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Wp=function(r){let e=[],t=0;for(let n=0;n<r.length;n++){let s=r.charCodeAt(n);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&n+1<r.length&&(r.charCodeAt(n+1)&64512)===56320?(s=65536+((s&1023)<<10)+(r.charCodeAt(++n)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},jy=function(r){let e=[],t=0,n=0;for(;t<r.length;){let s=r[t++];if(s<128)e[n++]=String.fromCharCode(s);else if(s>191&&s<224){let i=r[t++];e[n++]=String.fromCharCode((s&31)<<6|i&63)}else if(s>239&&s<365){let i=r[t++],a=r[t++],u=r[t++],c=((s&7)<<18|(i&63)<<12|(a&63)<<6|u&63)-65536;e[n++]=String.fromCharCode(55296+(c>>10)),e[n++]=String.fromCharCode(56320+(c&1023))}else{let i=r[t++],a=r[t++];e[n++]=String.fromCharCode((s&15)<<12|(i&63)<<6|a&63)}}return e.join("")},Qp={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(r,e){if(!Array.isArray(r))throw Error("encodeByteArray takes an array as a parameter");this.init_();let t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let s=0;s<r.length;s+=3){let i=r[s],a=s+1<r.length,u=a?r[s+1]:0,c=s+2<r.length,l=c?r[s+2]:0,h=i>>2,d=(i&3)<<4|u>>4,p=(u&15)<<2|l>>6,E=l&63;c||(E=64,a||(p=64)),n.push(t[h],t[d],t[p],t[E])}return n.join("")},encodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(r):this.encodeByteArray(Wp(r),e)},decodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(r):jy(this.decodeStringToByteArray(r,e))},decodeStringToByteArray(r,e){this.init_();let t=e?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let s=0;s<r.length;){let i=t[r.charAt(s++)],u=s<r.length?t[r.charAt(s)]:0;++s;let l=s<r.length?t[r.charAt(s)]:64;++s;let d=s<r.length?t[r.charAt(s)]:64;if(++s,i==null||u==null||l==null||d==null)throw new Kc;let p=i<<2|u>>4;if(n.push(p),l!==64){let E=u<<4&240|l>>2;if(n.push(E),d!==64){let y=l<<6&192|d;n.push(y)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let r=0;r<this.ENCODED_VALS.length;r++)this.byteToCharMap_[r]=this.ENCODED_VALS.charAt(r),this.charToByteMap_[this.byteToCharMap_[r]]=r,this.byteToCharMapWebSafe_[r]=this.ENCODED_VALS_WEBSAFE.charAt(r),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[r]]=r,r>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(r)]=r,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(r)]=r)}}},Kc=class extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}},Ky=function(r){let e=Wp(r);return Qp.encodeByteArray(e,!0)},pi=function(r){return Ky(r).replace(/\./g,"")},eo=function(r){try{return Qp.decodeString(r,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $p(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Jy=()=>$p().__FIREBASE_DEFAULTS__,zy=()=>{if(typeof process>"u"||typeof process.env>"u")return;let r=process.env.__FIREBASE_DEFAULTS__;if(r)return JSON.parse(r)},Wy=()=>{if(typeof document>"u")return;let r;try{r=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}let e=r&&eo(r[1]);return e&&JSON.parse(e)},to=()=>{try{return Jp()||Jy()||zy()||Wy()}catch(r){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${r}`);return}},zc=r=>{var e,t;return(t=(e=to())==null?void 0:e.emulatorHosts)==null?void 0:t[r]},Yp=r=>{let e=zc(r);if(!e)return;let t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);let n=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),n]:[e.substring(0,t),n]},Wc=()=>{var r;return(r=to())==null?void 0:r.config},Qc=r=>{var e;return(e=to())==null?void 0:e[`_${r}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Xr=class{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,n))}}};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xp(r,e){if(r.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');let t={alg:"none",type:"JWT"},n=e||"demo-project",s=r.iat||0,i=r.sub||r.user_id;if(!i)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");let a={iss:`https://securetoken.google.com/${n}`,aud:n,iat:s,exp:s+3600,auth_time:s,sub:i,user_id:i,firebase:{sign_in_provider:"custom",identities:{}},...r};return[pi(JSON.stringify(t)),pi(JSON.stringify(a)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Me(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Zp(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(Me())}function Qy(){var e;let r=(e=to())==null?void 0:e.forceEnvironment;if(r==="node")return!0;if(r==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function eC(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function tC(){let r=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof r=="object"&&r.id!==void 0}function nC(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function rC(){let r=Me();return r.indexOf("MSIE ")>=0||r.indexOf("Trident/")>=0}function sC(){return!Qy()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function $c(){try{return typeof indexedDB=="object"}catch{return!1}}function iC(){return new Promise((r,e)=>{try{let t=!0,n="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(n);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(n),r(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var i;e(((i=s.error)==null?void 0:i.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var $y="FirebaseError",pt=class r extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name=$y,Object.setPrototypeOf(this,r.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,an.prototype.create)}},an=class{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){let n=t[0]||{},s=`${this.service}/${e}`,i=this.errors[e],a=i?Yy(i,n):"Error",u=`${this.serviceName}: ${a} (${s}).`;return new pt(s,u,n)}};function Yy(r,e){try{let t=0,n="";for(;t<r.length;){let s=r.indexOf("{$",t);if(s===-1){n+=r.substring(t);break}let i=r.indexOf("}",s+2);if(i===-1){n+=r.substring(t);break}let a=r.substring(s+2,i),u=e[a];n+=r.substring(t,s)+(u!=null?String(u):`<${a}?>`),t=i+1}return n}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function aC(r){for(let e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}function Pt(r,e){if(r===e)return!0;let t=Object.keys(r),n=Object.keys(e);for(let s of t){if(!n.includes(s))return!1;let i=r[s],a=e[s];if(zp(i)&&zp(a)){if(!Pt(i,a))return!1}else if(i!==a)return!1}for(let s of n)if(!t.includes(s))return!1;return!0}function zp(r){return r!==null&&typeof r=="object"}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zr(r){let e=[];for(let[t,n]of Object.entries(r))Array.isArray(n)?n.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(n));return e.length?"&"+e.join("&"):""}function es(r){let e={};return r.replace(/^\?/,"").split("&").forEach(n=>{if(n){let[s,i]=n.split("=");e[decodeURIComponent(s)]=decodeURIComponent(i)}}),e}function ts(r){let e=r.indexOf("?");if(!e)return"";let t=r.indexOf("#",e);return r.substring(e,t>0?t:void 0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function oC(r,e){let t=new Jc(r,e);return t.subscribe.bind(t)}var Jc=class{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(n=>{this.error(n)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,n){let s;if(e===void 0&&t===void 0&&n===void 0)throw new Error("Missing Observer.");Xy(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:n},s.next===void 0&&(s.next=jc),s.error===void 0&&(s.error=jc),s.complete===void 0&&(s.complete=jc);let i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),i}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(n){typeof console<"u"&&console.error&&console.error(n)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}};function Xy(r,e){if(typeof r!="object"||r===null)return!1;for(let t of e)if(t in r&&typeof r[t]=="function")return!0;return!1}function jc(){}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var QA=14400*1e3;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function we(r){return r&&r._delegate?r._delegate:r}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ur(r){try{return(r.startsWith("http://")||r.startsWith("https://")?new URL(r).hostname:r).endsWith(".cloudworkstations.dev")}catch{return!1}}async function no(r){return(await fetch(r,{credentials:"include"})).ok}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var wt=class{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var cr="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Yc=class{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){let t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){let n=new Xr;if(this.instancesDeferred.set(t,n),this.isInitialized(t)||this.shouldAutoInitialize())try{let s=this.getOrInitializeService({instanceIdentifier:t});s&&n.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){let t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),n=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(s){if(n)return null;throw s}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(ew(e))try{this.getOrInitializeService({instanceIdentifier:cr})}catch{}for(let[t,n]of this.instancesDeferred.entries()){let s=this.normalizeInstanceIdentifier(t);try{let i=this.getOrInitializeService({instanceIdentifier:s});n.resolve(i)}catch{}}}}clearInstance(e=cr){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){let e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=cr){return this.instances.has(e)}getOptions(e=cr){return this.instancesOptions.get(e)||{}}initialize(e={}){let{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);let s=this.getOrInitializeService({instanceIdentifier:n,options:t});for(let[i,a]of this.instancesDeferred.entries()){let u=this.normalizeInstanceIdentifier(i);n===u&&a.resolve(s)}return s}onInit(e,t){let n=this.normalizeInstanceIdentifier(t),s=this.onInitCallbacks.get(n)??new Set;s.add(e),this.onInitCallbacks.set(n,s);let i=this.instances.get(n);return i&&e(i,n),()=>{s.delete(e)}}invokeOnInitCallbacks(e,t){let n=this.onInitCallbacks.get(t);if(n)for(let s of n)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:Zy(e),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch{}return n||null}normalizeInstanceIdentifier(e=cr){return this.component?this.component.multipleInstances?e:cr:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}};function Zy(r){return r===cr?void 0:r}function ew(r){return r.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ro=class{constructor(e){this.name=e,this.providers=new Map}addComponent(e){let t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);let t=new Yc(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var tw=[],oe;(function(r){r[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT"})(oe||(oe={}));var nw={debug:oe.DEBUG,verbose:oe.VERBOSE,info:oe.INFO,warn:oe.WARN,error:oe.ERROR,silent:oe.SILENT},rw=oe.INFO,sw={[oe.DEBUG]:"log",[oe.VERBOSE]:"log",[oe.INFO]:"info",[oe.WARN]:"warn",[oe.ERROR]:"error"},iw=(r,e,...t)=>{if(e<r.logLevel)return;let n=new Date().toISOString(),s=sw[e];if(s)console[s](`[${n}]  ${r.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)},Pn=class{constructor(e){this.name=e,this._logLevel=rw,this._logHandler=iw,this._userLogHandler=null,tw.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in oe))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?nw[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,oe.DEBUG,...e),this._logHandler(this,oe.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,oe.VERBOSE,...e),this._logHandler(this,oe.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,oe.INFO,...e),this._logHandler(this,oe.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,oe.WARN,...e),this._logHandler(this,oe.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,oe.ERROR,...e),this._logHandler(this,oe.ERROR,...e)}};var aw=(r,e)=>e.some(t=>r instanceof t),uC,cC;function ow(){return uC||(uC=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function uw(){return cC||(cC=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}var lC=new WeakMap,Zc=new WeakMap,BC=new WeakMap,Xc=new WeakMap,tl=new WeakMap;function cw(r){let e=new Promise((t,n)=>{let s=()=>{r.removeEventListener("success",i),r.removeEventListener("error",a)},i=()=>{t(Gt(r.result)),s()},a=()=>{n(r.error),s()};r.addEventListener("success",i),r.addEventListener("error",a)});return e.then(t=>{t instanceof IDBCursor&&lC.set(t,r)}).catch(()=>{}),tl.set(e,r),e}function lw(r){if(Zc.has(r))return;let e=new Promise((t,n)=>{let s=()=>{r.removeEventListener("complete",i),r.removeEventListener("error",a),r.removeEventListener("abort",a)},i=()=>{t(),s()},a=()=>{n(r.error||new DOMException("AbortError","AbortError")),s()};r.addEventListener("complete",i),r.addEventListener("error",a),r.addEventListener("abort",a)});Zc.set(r,e)}var el={get(r,e,t){if(r instanceof IDBTransaction){if(e==="done")return Zc.get(r);if(e==="objectStoreNames")return r.objectStoreNames||BC.get(r);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return Gt(r[e])},set(r,e,t){return r[e]=t,!0},has(r,e){return r instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in r}};function hC(r){el=r(el)}function Bw(r){return r===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){let n=r.call(so(this),e,...t);return BC.set(n,e.sort?e.sort():[e]),Gt(n)}:uw().includes(r)?function(...e){return r.apply(so(this),e),Gt(lC.get(this))}:function(...e){return Gt(r.apply(so(this),e))}}function hw(r){return typeof r=="function"?Bw(r):(r instanceof IDBTransaction&&lw(r),aw(r,ow())?new Proxy(r,el):r)}function Gt(r){if(r instanceof IDBRequest)return cw(r);if(Xc.has(r))return Xc.get(r);let e=hw(r);return e!==r&&(Xc.set(r,e),tl.set(e,r)),e}var so=r=>tl.get(r);function dC(r,e,{blocked:t,upgrade:n,blocking:s,terminated:i}={}){let a=indexedDB.open(r,e),u=Gt(a);return n&&a.addEventListener("upgradeneeded",c=>{n(Gt(a.result),c.oldVersion,c.newVersion,Gt(a.transaction),c)}),t&&a.addEventListener("blocked",c=>t(c.oldVersion,c.newVersion,c)),u.then(c=>{i&&c.addEventListener("close",()=>i()),s&&c.addEventListener("versionchange",l=>s(l.oldVersion,l.newVersion,l))}).catch(()=>{}),u}var fw=["get","getKey","getAll","getAllKeys","count"],dw=["put","add","delete","clear"],nl=new Map;function fC(r,e){if(!(r instanceof IDBDatabase&&!(e in r)&&typeof e=="string"))return;if(nl.get(e))return nl.get(e);let t=e.replace(/FromIndex$/,""),n=e!==t,s=dw.includes(t);if(!(t in(n?IDBIndex:IDBObjectStore).prototype)||!(s||fw.includes(t)))return;let i=async function(a,...u){let c=this.transaction(a,s?"readwrite":"readonly"),l=c.store;return n&&(l=l.index(u.shift())),(await Promise.all([l[t](...u),s&&c.done]))[0]};return nl.set(e,i),i}hC(r=>({...r,get:(e,t,n)=>fC(e,t)||r.get(e,t,n),has:(e,t)=>!!fC(e,t)||r.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var sl=class{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(pw(t)){let n=t.getImmediate();return`${n.library}/${n.version}`}else return null}).filter(t=>t).join(" ")}};function pw(r){let e=r.getComponent();return(e==null?void 0:e.type)==="VERSION"}var il="@firebase/app",pC="0.16.7";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ut=new Pn("@firebase/app"),Cw="@firebase/app-compat",gw="@firebase/analytics-compat",mw="@firebase/analytics",Ew="@firebase/app-check-compat",_w="@firebase/app-check",yw="@firebase/auth",ww="@firebase/auth-compat",Dw="@firebase/crashlytics",Iw="@firebase/database",Tw="@firebase/data-connect",Aw="@firebase/database-compat",bw="@firebase/functions",vw="@firebase/functions-compat",Rw="@firebase/installations",Sw="@firebase/installations-compat",Pw="@firebase/messaging",Nw="@firebase/messaging-compat",Ow="@firebase/performance",xw="@firebase/performance-compat",Fw="@firebase/remote-config",Lw="@firebase/remote-config-compat",kw="@firebase/storage",Vw="@firebase/storage-compat",Mw="@firebase/firestore",Gw="@firebase/ai",Uw="@firebase/firestore-compat",Hw="firebase",qw="13.4.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var al="[DEFAULT]",jw={[il]:"fire-core",[Cw]:"fire-core-compat",[mw]:"fire-analytics",[gw]:"fire-analytics-compat",[_w]:"fire-app-check",[Ew]:"fire-app-check-compat",[yw]:"fire-auth",[ww]:"fire-auth-compat",[Dw]:"fire-cls",[Iw]:"fire-rtdb",[Tw]:"fire-data-connect",[Aw]:"fire-rtdb-compat",[bw]:"fire-fn",[vw]:"fire-fn-compat",[Rw]:"fire-iid",[Sw]:"fire-iid-compat",[Pw]:"fire-fcm",[Nw]:"fire-fcm-compat",[Ow]:"fire-perf",[xw]:"fire-perf-compat",[Fw]:"fire-rc",[Lw]:"fire-rc-compat",[kw]:"fire-gcs",[Vw]:"fire-gcs-compat",[Mw]:"fire-fst",[Uw]:"fire-fst-compat",[Gw]:"fire-vertex","fire-js":"fire-js",[Hw]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ci=new Map,Kw=new Map,ol=new Map;function CC(r,e){try{r.container.addComponent(e)}catch(t){Ut.debug(`Component ${e.name} failed to register with FirebaseApp ${r.name}`,t)}}function Nn(r){let e=r.name;if(ol.has(e))return Ut.debug(`There were multiple attempts to register component ${e}.`),!1;ol.set(e,r);for(let t of Ci.values())CC(t,r);for(let t of Kw.values())CC(t,r);return!0}function mi(r,e){let t=r.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),r.container.getProvider(e)}function Ct(r){return r==null?!1:r.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Jw={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},on=new an("app","Firebase",Jw);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ul=class{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new wt("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw on.create("app-deleted",{appName:this._name})}};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var On=qw;function hl(r,e={}){let t=r;typeof e!="object"&&(e={name:e});let n={name:al,automaticDataCollectionEnabled:!0,...e},s=n.name;if(typeof s!="string"||!s)throw on.create("bad-app-name",{appName:String(s)});if(t||(t=Wc()),!t)throw on.create("no-options");let i=Ci.get(s);if(i)if(Pt(t,i.options)){if(Pt(n,i.config))return i;throw on.create("duplicate-app",{appName:s,mismatchedParam:"config",oldValue:JSON.stringify(i.config),newValue:JSON.stringify(n)})}else throw on.create("duplicate-app",{appName:s,mismatchedParam:"options",oldValue:JSON.stringify(i.options),newValue:JSON.stringify(t)});let a=new ro(s);for(let c of ol.values())a.addComponent(c);let u=new ul(t,n,a);return Ci.set(s,u),u}function ao(r=al){let e=Ci.get(r);if(!e&&r===al&&Wc())return hl();if(!e)throw on.create("no-app",{appName:r});return e}function _C(){return Array.from(Ci.values())}function Nt(r,e,t){let n=jw[r]??r;t&&(n+=`-${t}`);let s=n.match(/\s|\//),i=e.match(/\s|\//);if(s||i){let a=[`Unable to register library "${n}" with version "${e}":`];s&&a.push(`library name "${n}" contains illegal characters (whitespace or "/")`),s&&i&&a.push("and"),i&&a.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Ut.warn(a.join(" "));return}Nn(new wt(`${n}-version`,()=>({library:n,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var zw="firebase-heartbeat-database",Ww=1,gi="firebase-heartbeat-store",rl=null;function yC(){return rl||(rl=dC(zw,Ww,{upgrade:(r,e)=>{switch(e){case 0:try{r.createObjectStore(gi)}catch(t){console.warn(t)}}}}).catch(r=>{throw on.create("idb-open",{originalErrorMessage:r.message})})),rl}async function Qw(r){try{let t=(await yC()).transaction(gi),n=await t.objectStore(gi).get(wC(r));return await t.done,n}catch(e){if(e instanceof pt)Ut.warn(e.message);else{let t=on.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Ut.warn(t.message)}}}async function gC(r,e){try{let n=(await yC()).transaction(gi,"readwrite");await n.objectStore(gi).put(e,wC(r)),await n.done}catch(t){if(t instanceof pt)Ut.warn(t.message);else{let n=on.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Ut.warn(n.message)}}}function wC(r){return`${r.name}!${r.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var $w=1024,Yw=30,cl=class{constructor(e){this.container=e,this._heartbeatsCache=null;let t=this.container.getProvider("app").getImmediate();this._storage=new ll(t),this._heartbeatsCachePromise=this._storage.read().then(n=>(this._heartbeatsCache=n,n))}async triggerHeartbeat(){var e,t;try{let s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=mC();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(a=>a.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:s}),this._heartbeatsCache.heartbeats.length>Yw){let a=Zw(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(n){Ut.warn(n)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";let t=mC(),{heartbeatsToSend:n,unsentEntries:s}=Xw(this._heartbeatsCache.heartbeats),i=pi(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(t){return Ut.warn(t),""}}};function mC(){return new Date().toISOString().substring(0,10)}function Xw(r,e=$w){let t=[],n=r.slice();for(let s of r){let i=t.find(a=>a.agent===s.agent);if(i){if(i.dates.push(s.date),EC(t)>e){i.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),EC(t)>e){t.pop();break}n=n.slice(1)}return{heartbeatsToSend:t,unsentEntries:n}}var ll=class{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return $c()?iC().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){let t=await Qw(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){let n=await this.read();return gC(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){let n=await this.read();return gC(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}else return}};function EC(r){return pi(JSON.stringify({version:2,heartbeats:r})).length}function Zw(r){if(r.length===0)return-1;let e=0,t=r[0].date;for(let n=1;n<r.length;n++)r[n].date<t&&(t=r[n].date,e=n);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eD(r){Nn(new wt("platform-logger",e=>new sl(e),"PRIVATE")),Nn(new wt("heartbeat",e=>new cl(e),"PRIVATE")),Nt(il,pC,r),Nt(il,pC,"esm2020"),Nt("fire-js","")}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Bl="firebase-js-sdk-policy",tD=["https://www.googletagmanager.com/gtag/js","https://apis.google.com/js/api.js","https://www.google.com/recaptcha/api.js","https://www.google.com/recaptcha/enterprise.js"],io,DC=!1;function IC(r){if(!tD.some(t=>r.startsWith(t)&&(r.length===t.length||r.charAt(t.length)==="?")))throw new TypeError(`Firebase: Refusing to load untrusted script URL: ${r}`);return r}function nD(){if(io===void 0){io=null;let r=typeof window<"u"?window.trustedTypes:void 0;if(r!=null&&r.createPolicy)try{io=r.createPolicy(Bl,{createScriptURL:IC})}catch{DC=!0}}return io}function TC(r,e){IC(e);let t=nD();if(t){r.src=t.createScriptURL(e);return}try{r.src=e}catch(n){throw DC&&Ut.error(`Unable to load ${e} because this page requires Trusted Types for scripts but does not allow the "${Bl}" Trusted Types policy. To fix this, add "${Bl}" to the trusted-types directive of the page's Content-Security-Policy.`),n}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */eD("");var rD="firebase",sD="13.4.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Nt(rD,sD,"app");/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function JC(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}var zC=JC,WC=new an("auth","Firebase",JC());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var po=new Pn("@firebase/auth");function uo(r,...e){po.logLevel<=oe.WARN&&po.warn(`Auth (${On}): ${r}`,...e)}function co(r,...e){po.logLevel<=oe.ERROR&&po.error(`Auth (${On}): ${r}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ot(r,...e){throw kl(r,...e)}function qt(r,...e){return kl(r,...e)}function Ll(r,e,t){let n={...zC(),[e]:t};return new an("auth","Firebase",n).create(e,{appName:r.name})}function Ln(r){return Ll(r,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function kl(r,...e){if(typeof r!="string"){let t=e[0],n=[...e.slice(1)];return n[0]&&(n[0].appName=r.name),r._errorFactory.create(t,...n)}return WC.create(r,...e)}function W(r,e,...t){if(!r)throw kl(e,...t)}function Ht(r){let e="INTERNAL ASSERTION FAILED: "+r;throw co(e),new Error(e)}function cn(r,e){r||Ht(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ml(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.href)||""}function iD(){return AC()==="http:"||AC()==="https:"}function AC(){var r;return typeof self<"u"&&((r=self.location)==null?void 0:r.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function aD(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(iD()||tC()||"connection"in navigator)?navigator.onLine:!0}function oD(){if(typeof navigator>"u")return null;let r=navigator;return r.languages&&r.languages[0]||r.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var lr=class{constructor(e,t){this.shortDelay=e,this.longDelay=t,cn(t>e,"Short delay should be less than long delay!"),this.isMobile=Zp()||nC()}get(){return aD()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vl(r,e){cn(r.emulator,"Emulator should always be set here");let{url:t}=r.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Co=class{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;Ht("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;Ht("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;Ht("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var uD={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var cD=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],lD=new lr(3e4,6e4);function Fe(r,e){return r.tenantId&&!e.tenantId?{...e,tenantId:r.tenantId}:e}async function We(r,e,t,n,s={}){return QC(r,s,async()=>{let i={},a={};n&&(e==="GET"?a=n:i={body:JSON.stringify(n)});let u=Zr({...a,key:r.config.apiKey}).slice(1),c=await r._getAdditionalHeaders();c["Content-Type"]="application/json",r.languageCode&&(c["X-Firebase-Locale"]=r.languageCode);let l={method:e,headers:c,...i};return eC()||(l.referrerPolicy="strict-origin-when-cross-origin"),r.emulatorConfig&&ur(r.emulatorConfig.host)&&(l.credentials="include"),Co.fetch()(await $C(r,r.config.apiHost,t,u),l)})}async function QC(r,e,t){r._canInitEmulator=!1;let n={...uD,...e};try{let s=new El(r),i=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();let a=await i.json();if("needConfirmation"in a)throw _i(r,"account-exists-with-different-credential",a);if(i.ok&&!("errorMessage"in a))return a;{let u=i.ok?a.errorMessage:a.error.message,[c,l]=u.split(" : ");if(c==="FEDERATED_USER_ID_ALREADY_LINKED")throw _i(r,"credential-already-in-use",a);if(c==="EMAIL_EXISTS")throw _i(r,"email-already-in-use",a);if(c==="USER_DISABLED")throw _i(r,"user-disabled",a);let h=n[c]||c.toLowerCase().replace(/[_\s]+/g,"-");if(l)throw Ll(r,h,l);Ot(r,h)}}catch(s){if(s instanceof pt)throw s;Ot(r,"network-request-failed",{message:String(s)})}}async function Cr(r,e,t,n,s={}){let i=await We(r,e,t,n,s);return"mfaPendingCredential"in i&&Ot(r,"multi-factor-auth-required",{_serverResponse:i}),i}async function $C(r,e,t,n){let s=`${e}${t}?${n}`,i=r,a=i.config.emulator?Vl(r.config,s):`${r.config.apiScheme}://${s}`;return cD.includes(t)&&(await i._persistenceManagerAvailable,i._getPersistenceType()==="COOKIE")?i._getPersistence()._getFinalTarget(a).toString():a}function BD(r){switch(r){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}var El=class{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,n)=>{this.timer=setTimeout(()=>n(qt(this.auth,"network-request-failed")),lD.get())})}};function _i(r,e,t){let n={appName:r.name};t.email&&(n.email=t.email),t.phoneNumber&&(n.phoneNumber=t.phoneNumber);let s=qt(r,e,n);return s.customData._tokenResponse=t,s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bC(r){return r!==void 0&&r.enterprise!==void 0}var go=class{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(let t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return BD(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function YC(r,e){return We(r,"GET","/v2/recaptchaConfig",Fe(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function hD(r,e){return We(r,"POST","/v1/accounts:delete",e)}async function mo(r,e){return We(r,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function yi(r){if(r)try{let e=new Date(Number(r));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function XC(r,e=!1){let t=we(r),n=await t.getIdToken(e),s=Ml(n);W(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");let i=typeof s.firebase=="object"?s.firebase:void 0,a=i==null?void 0:i.sign_in_provider;return{claims:s,token:n,authTime:yi(fl(s.auth_time)),issuedAtTime:yi(fl(s.iat)),expirationTime:yi(fl(s.exp)),signInProvider:a||null,signInSecondFactor:(i==null?void 0:i.sign_in_second_factor)||null}}function fl(r){return Number(r)*1e3}function Ml(r){let[e,t,n]=r.split(".");if(e===void 0||t===void 0||n===void 0)return co("JWT malformed, contained fewer than 3 sections"),null;try{let s=eo(t);return s?JSON.parse(s):(co("Failed to decode base64 JWT payload"),null)}catch(s){return co("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function vC(r){let e=Ml(r);return W(e,"internal-error"),W(typeof e.exp<"u","internal-error"),W(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ai(r,e,t=!1){if(t)return e;try{return await e}catch(n){throw ZC(n)&&r.auth.currentUser===r&&await r.auth.signOut(),n}}function ZC(r){return r instanceof pt?r.code==="auth/user-disabled"||r.code==="auth/user-token-expired":!1}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var _l=class{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){let t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;let n=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,n)}}schedule(e=!1){if(!this.isRunning)return;let t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var bi=class{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=yi(this.lastLoginAt),this.creationTime=yi(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Eo(r){var d;let e=r.auth,t=await r.getIdToken(),n=await Ai(r,mo(e,{idToken:t}));W(n==null?void 0:n.users.length,e,"internal-error");let s=n.users[0];r._notifyReloadListener(s);let i=(d=s.providerUserInfo)!=null&&d.length?tg(s.providerUserInfo):[],a=fD(r.providerData,i),u=r.isAnonymous,c=!(r.email&&s.passwordHash)&&!(a!=null&&a.length),l=u?c:!1,h={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:a,metadata:new bi(s.createdAt,s.lastLoginAt),isAnonymous:l};Object.assign(r,h)}async function eg(r){let e=we(r);await Eo(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function fD(r,e){return[...r.filter(n=>!e.some(s=>s.providerId===n.providerId)),...e]}function tg(r){return r.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function dD(r,e){let t=await QC(r,{},async()=>{let n=Zr({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:i}=r.config,a=await $C(r,s,"/v1/token",`key=${i}`),u=await r._getAdditionalHeaders();u["Content-Type"]="application/x-www-form-urlencoded";let c={method:"POST",headers:u,body:n};return r.emulatorConfig&&ur(r.emulatorConfig.host)&&(c.credentials="include"),Co.fetch()(a,c)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function pD(r,e){return We(r,"POST","/v2/accounts:revokeToken",Fe(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var wi=class r{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e5}updateFromServerResponse(e){W(e.idToken,"internal-error"),W(typeof e.idToken<"u","internal-error"),W(typeof e.refreshToken<"u","internal-error");let t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):vC(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){W(e.length!==0,"internal-error");let t=vC(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(W(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){let{accessToken:n,refreshToken:s,expiresIn:i}=await dD(e,t);this.updateTokensAndExpiration(n,s,Number(i))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+n*1e3}static fromJSON(e,t){let{refreshToken:n,accessToken:s,expirationTime:i}=t,a=new r;return n&&(W(typeof n=="string","internal-error",{appName:e}),a.refreshToken=n),s&&(W(typeof s=="string","internal-error",{appName:e}),a.accessToken=s),i&&(W(typeof i=="number","internal-error",{appName:e}),a.expirationTime=i),a}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new r,this.toJSON())}_performRefresh(){return Ht("not implemented")}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xn(r,e){W(typeof r=="string"||typeof r>"u","internal-error",{appName:e})}var Fn=class r{constructor({uid:e,auth:t,stsTokenManager:n,...s}){this.providerId="firebase",this.proactiveRefresh=new _l(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=s.displayName||null,this.email=s.email||null,this.emailVerified=s.emailVerified||!1,this.phoneNumber=s.phoneNumber||null,this.photoURL=s.photoURL||null,this.isAnonymous=s.isAnonymous||!1,this.tenantId=s.tenantId||null,this.providerData=s.providerData?[...s.providerData]:[],this.metadata=new bi(s.createdAt||void 0,s.lastLoginAt||void 0)}async getIdToken(e){let t=await Ai(this,this.stsTokenManager.getToken(this.auth,e));return W(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return XC(this,e)}reload(){return eg(this)}_assign(e){this!==e&&(W(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){let t=new r({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){W(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await Eo(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(Ct(this.auth.app))return Promise.reject(Ln(this.auth));let e=await this.getIdToken();return await Ai(this,hD(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){let n=t.displayName??void 0,s=t.email??void 0,i=t.phoneNumber??void 0,a=t.photoURL??void 0,u=t.tenantId??void 0,c=t._redirectEventId??void 0,l=t.createdAt??void 0,h=t.lastLoginAt??void 0,{uid:d,emailVerified:p,isAnonymous:E,providerData:y,stsTokenManager:S}=t;W(d&&S,e,"internal-error");let F=wi.fromJSON(this.name,S);W(typeof d=="string",e,"internal-error"),xn(n,e.name),xn(s,e.name),W(typeof p=="boolean",e,"internal-error"),W(typeof E=="boolean",e,"internal-error"),xn(i,e.name),xn(a,e.name),xn(u,e.name),xn(c,e.name),xn(l,e.name),xn(h,e.name);let U=new r({uid:d,auth:e,email:s,emailVerified:p,displayName:n,isAnonymous:E,photoURL:a,phoneNumber:i,tenantId:u,stsTokenManager:F,createdAt:l,lastLoginAt:h});return y&&Array.isArray(y)&&(U.providerData=y.map(z=>({...z}))),c&&(U._redirectEventId=c),U}static async _fromIdTokenResponse(e,t,n=!1){let s=new wi;s.updateFromServerResponse(t);let i=new r({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:n});return await Eo(i),i}static async _fromGetAccountInfoResponse(e,t,n){let s=t.users[0];W(s.localId!==void 0,"internal-error");let i=s.providerUserInfo!==void 0?tg(s.providerUserInfo):[],a=!(s.email&&s.passwordHash)&&!(i!=null&&i.length),u=new wi;u.updateFromIdToken(n);let c=new r({uid:s.localId,auth:e,stsTokenManager:u,isAnonymous:a}),l={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:i,metadata:new bi(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(i!=null&&i.length)};return Object.assign(c,l),c}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var RC=new Map;function un(r){cn(r instanceof Function,"Expected a class definition");let e=RC.get(r);return e?(cn(e instanceof r,"Instance stored in cache mismatched with class"),e):(e=new r,RC.set(r,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var _o=class{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){let t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}};_o.type="NONE";var yl=_o;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lo(r,e,t){return`firebase:${r}:${e}:${t}`}var Di=class r{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;let{config:s,name:i}=this.auth;this.fullUserKey=lo(this.userKey,s.apiKey,i),this.fullPersistenceKey=lo("persistence",s.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t);try{this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}catch{}}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){let e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){let t=await mo(this.auth,{idToken:e}).catch(()=>{});return t?Fn._fromGetAccountInfoResponse(this.auth,t,e):null}return Fn._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;let t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){try{this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}catch{}}static async create(e,t,n="authUser"){if(!t.length)return new r(un(yl),e,n);let s=lo(n,e.config.apiKey,e.name),i=null,a=null,u=new Set;for(let p of t){let E=null;try{E=await p._get(s)}catch{u.add(p);continue}try{if(E){let y;if(typeof E=="string"){let S=await mo(e,{idToken:E}).catch(()=>{});if(!S)break;y=await Fn._fromGetAccountInfoResponse(e,S,E)}else y=Fn._fromJSON(e,E);i=y,a=p;break}}catch{}}let c=(await Promise.all(t.map(async p=>{try{if(await p._isAvailable())return p;p._lastProbeTimedOut&&u.add(p)}catch{return}}))).filter(p=>p),l=c[0]||un(yl),h=null;a&&i&&(a!==l&&(h=i),l=a);let d=c.filter(p=>p._shouldAllowMigration);return!l._shouldAllowMigration||!d.length?new r(l,e,n):(l=d[0],h&&await l._set(s,h.toJSON()),await Promise.all(t.map(async p=>{if(p!==l&&!u.has(p))try{await p._remove(s)}catch{}})),new r(l,e,n))}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function SC(r){let e=r.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(ig(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(ng(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(og(e))return"Blackberry";if(ug(e))return"Webos";if(rg(e))return"Safari";if((e.includes("chrome/")||sg(e))&&!e.includes("edge/"))return"Chrome";if(ag(e))return"Android";{let t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,n=r.match(t);if((n==null?void 0:n.length)===2)return n[1]}return"Other"}function ng(r=Me()){return/firefox\//i.test(r)}function rg(r=Me()){let e=r.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function sg(r=Me()){return/crios\//i.test(r)}function ig(r=Me()){return/iemobile/i.test(r)}function ag(r=Me()){return/android/i.test(r)}function og(r=Me()){return/blackberry/i.test(r)}function ug(r=Me()){return/webos/i.test(r)}function Gl(r=Me()){return/iphone|ipad|ipod/i.test(r)||/macintosh/i.test(r)&&/mobile/i.test(r)}function CD(r=Me()){var e;return Gl(r)&&!!((e=window.navigator)!=null&&e.standalone)}function gD(){return rC()&&document.documentMode===10}function cg(r=Me()){return Gl(r)||ag(r)||ug(r)||og(r)||/windows phone/i.test(r)||ig(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lg(r,e=[]){let t;switch(r){case"Browser":t=SC(Me());break;case"Worker":t=`${SC(Me())}-${r}`;break;default:t=r}let n=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${On}/${n}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var wl=class{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){let n=i=>new Promise((a,u)=>{try{let c=e(i);a(c)}catch(c){u(c)}});n.onAbort=t,this.queue.push(n);let s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;let t=[];try{for(let n of this.queue)await n(e),n.onAbort&&t.push(n.onAbort)}catch(n){t.reverse();for(let s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:n==null?void 0:n.message})}}};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function mD(r,e={}){return We(r,"GET","/v2/passwordPolicy",Fe(r,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ED=6,Dl=class{constructor(e){var n;let t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??ED,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((n=e.allowedNonAlphanumericCharacters)==null?void 0:n.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){let t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){let n=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let n;for(let s=0;s<e.length;s++)n=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,n>="a"&&n<="z",n>="A"&&n<="Z",n>="0"&&n<="9",this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,s,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=n)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Il=class{constructor(e,t,n,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new yo(this),this.idTokenSubscription=new yo(this),this.beforeStateQueue=new wl(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=WC,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion,this._persistenceManagerAvailable=new Promise(i=>this._resolvePersistenceManagerAvailable=i)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=un(t)),this._initializationPromise=this.queue(async()=>{var n,s,i;if(!this._deleted){try{this.persistenceManager=await Di.create(this,e)}catch(a){uo(`Failed to initialize persistence: ${a}`),this.persistenceManager=await Di.create(this,[])}finally{(n=this._resolvePersistenceManagerAvailable)==null||n.call(this)}if(!this._deleted){if((s=this._popupRedirectResolver)!=null&&s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}try{await this.initializeCurrentUser(t)}catch(a){uo(`Failed to initialize current user: ${a}`)}this.lastNotifiedUid=((i=this.currentUser)==null?void 0:i.uid)||null,!this._deleted&&(this._isInitialized=!0)}}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;let e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{let t=await mo(this,{idToken:e}),n=await Fn._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var i;if(Ct(this.app)){let a=this.app.settings.authIdToken;return a?new Promise(u=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(a).then(u,u))}):this.directlySetCurrentUser(null)}let t=await this.assertedPersistence.getCurrentUser(),n=t,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();let a=(i=this.redirectUser)==null?void 0:i._redirectEventId,u=n==null?void 0:n._redirectEventId,c=await this.tryRedirectSignIn(e);(!a||a===u)&&(c!=null&&c.user)&&(n=c.user,s=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(n)}catch(a){n=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(a))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return W(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Eo(e)}catch(t){if(ZC(t))return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=oD()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(Ct(this.app))return Promise.reject(Ln(this));let t=e?we(e):null;return t&&W(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&W(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return Ct(this.app)?Promise.reject(Ln(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return Ct(this.app)?Promise.reject(Ln(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(un(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();let t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){let e=await mD(this),t=new Dl(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new an("auth","Firebase",e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{let n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){let t=await this.currentUser.getIdToken(),n={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(n.tenantId=this.tenantId),await pD(this,n)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){let n=await this.getOrInitRedirectPersistenceManager(t);return e===null?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){let t=e&&un(e)||this._popupRedirectResolver;W(t,this,"argument-error"),this.redirectPersistenceManager=await Di.create(this,[un(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,n;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((n=this.redirectUser)==null?void 0:n._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);let e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,s){if(this._deleted)return()=>{};let i=typeof t=="function"?t:t.next.bind(t),a=!1,u=this._isInitialized?Promise.resolve():this._initializationPromise;if(W(u,this,"internal-error"),u.then(()=>{a||i(this.currentUser)}).catch(c=>{if(!a)if(typeof t!="function"&&t.error)t.error(c);else if(n)n(c);else throw c}),typeof t=="function"){let c=e.addObserver(t,n,s);return()=>{a=!0,c()}}else{let c=e.addObserver(t);return()=>{a=!0,c()}}}async directlySetCurrentUser(e){if(this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,this.persistenceManager)try{e?await this.persistenceManager.setCurrentUser(e):await this.persistenceManager.removeCurrentUser()}catch(t){let n=(t==null?void 0:t.message)||String(t),s=Ll(this,"internal-error",`An internal AuthError has occurred: ${n}`);throw s.customData={originalError:t},s}}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return W(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=lg(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var s;let e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);let t=await((s=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:s.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);let n=await this._getAppCheckToken();return n&&(e["X-Firebase-AppCheck"]=n),e}async _getAppCheckToken(){var t;if(Ct(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;let e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&uo(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}};function ln(r){return we(r)}var yo=class{constructor(e){this.auth=e,this.observer=null,this.addObserver=oC(t=>this.observer=t)}get next(){return W(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Vo={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function _D(r){Vo=r}function Bg(r){return Vo.loadJS(r)}function yD(){return Vo.recaptchaEnterpriseScript}function wD(){return Vo.gapiScript}function hg(r){return`__${r}${Math.floor(Math.random()*1e6)}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Tl=class{constructor(){this.enterprise=new Al}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}},Al=class{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var DD="recaptcha-enterprise",Ii="NO_RECAPTCHA",PC="onFirebaseAuthREInstanceReady",vi=class r{constructor(e){this.type=DD,this.auth=ln(e)}async verify(e="verify",t=!1){async function n(i){if(!t){if(i.tenantId==null&&i._agentRecaptchaConfig!=null)return i._agentRecaptchaConfig.siteKey;if(i.tenantId!=null&&i._tenantRecaptchaConfigs[i.tenantId]!==void 0)return i._tenantRecaptchaConfigs[i.tenantId].siteKey}return new Promise(async(a,u)=>{YC(i,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(c=>{if(c.recaptchaKey===void 0)u(new Error("recaptcha Enterprise site key undefined"));else{let l=new go(c);return i.tenantId==null?i._agentRecaptchaConfig=l:i._tenantRecaptchaConfigs[i.tenantId]=l,a(l.siteKey)}}).catch(c=>{u(c)})})}function s(i,a,u){let c=window.grecaptcha;bC(c)?c.enterprise.ready(()=>{c.enterprise.execute(i,{action:e}).then(l=>{a(l)}).catch(()=>{a(Ii)})}):u(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?new Tl().execute("siteKey",{action:"verify"}):new Promise((i,a)=>{n(this.auth).then(async u=>{if(!t&&bC(window.grecaptcha)&&r.scriptInjectionDeferred)await r.scriptInjectionDeferred.promise,s(u,i,a);else{if(typeof window>"u"){a(new Error("RecaptchaVerifier is only supported in browser"));return}let c=yD();c.length!==0&&(c+=u+`&onload=${PC}`),r.scriptInjectionDeferred=new Xr,window[PC]=()=>{var l;(l=r.scriptInjectionDeferred)==null||l.resolve()},Bg(c).then(()=>{var l;return(l=r.scriptInjectionDeferred)==null?void 0:l.promise}).then(()=>{s(u,i,a)}).catch(l=>{a(l)})}}).catch(u=>{a(u)})})}};vi.scriptInjectionDeferred=null;async function Ei(r,e,t,n=!1,s=!1){let i=new vi(r),a;if(s)a=Ii;else try{a=await i.verify(t)}catch{a=await i.verify(t,!0)}let u={...e};if(t==="mfaSmsEnrollment"||t==="mfaSmsSignIn"){if("phoneEnrollmentInfo"in u){let c=u.phoneEnrollmentInfo.phoneNumber,l=u.phoneEnrollmentInfo.recaptchaToken;Object.assign(u,{phoneEnrollmentInfo:{phoneNumber:c,recaptchaToken:l,captchaResponse:a,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in u){let c=u.phoneSignInInfo.recaptchaToken;Object.assign(u,{phoneSignInInfo:{recaptchaToken:c,captchaResponse:a,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return u}return n?Object.assign(u,{captchaResp:a}):Object.assign(u,{captchaResponse:a}),Object.assign(u,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(u,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),u}async function ns(r,e,t,n,s){var i,a;if(s==="EMAIL_PASSWORD_PROVIDER")if((i=r._getRecaptchaConfig())!=null&&i.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){let u=await Ei(r,e,t,t==="getOobCode");return n(r,u)}else return n(r,e).catch(async u=>{if(u.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);let c=await Ei(r,e,t,t==="getOobCode");return n(r,c)}else return Promise.reject(u)});else if(s==="PHONE_PROVIDER")if((a=r._getRecaptchaConfig())!=null&&a.isProviderEnabled("PHONE_PROVIDER")){let u=await Ei(r,e,t);return n(r,u).catch(async c=>{var l;if(((l=r._getRecaptchaConfig())==null?void 0:l.getProviderEnforcementState("PHONE_PROVIDER"))==="AUDIT"&&(c.code==="auth/missing-recaptcha-token"||c.code==="auth/invalid-app-credential")){console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${t} flow.`);let h=await Ei(r,e,t,!1,!0);return n(r,h)}return Promise.reject(c)})}else{let u=await Ei(r,e,t,!1,!0);return n(r,u)}else return Promise.reject(s+" provider is not supported.")}async function ID(r){let e=ln(r),t=await YC(e,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}),n=new go(t);e.tenantId==null?e._agentRecaptchaConfig=n:e._tenantRecaptchaConfigs[e.tenantId]=n,n.isAnyProviderEnabled()&&new vi(e).verify().catch(()=>{})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mo(r,e){let t=mi(r,"auth");if(t.isInitialized()){let s=t.getImmediate(),i=t.getOptions();if(Pt(i,e??{}))return s;Ot(s,"already-initialized")}return t.initialize({options:e})}function TD(r,e){let t=(e==null?void 0:e.persistence)||[],n=(Array.isArray(t)?t:[t]).map(un);e!=null&&e.errorMap&&r._updateErrorMap(e.errorMap),r._initializeWithPersistence(n,e==null?void 0:e.popupRedirectResolver)}function fg(r,e,t){let n=ln(r);W(/^https?:\/\//.test(e),n,"invalid-emulator-scheme");let s=!!(t!=null&&t.disableWarnings),i=dg(e),{host:a,port:u}=AD(e),c=u===null?"":`:${u}`,l={url:`${i}//${a}${c}/`},h=Object.freeze({host:a,port:u,protocol:i.replace(":",""),options:Object.freeze({disableWarnings:s})});if(!n._canInitEmulator){W(n.config.emulator&&n.emulatorConfig,n,"emulator-config-failed"),W(Pt(l,n.config.emulator)&&Pt(h,n.emulatorConfig),n,"emulator-config-failed");return}n.config.emulator=l,n.emulatorConfig=h,n.settings.appVerificationDisabledForTesting=!0,ur(a)?no(`${i}//${a}${c}`):s||bD()}function dg(r){let e=r.indexOf(":");return e<0?"":r.substr(0,e+1)}function AD(r){let e=dg(r),t=/(\/\/)?([^?#/]+)/.exec(r.substr(e.length));if(!t)return{host:"",port:null};let n=t[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(n);if(s){let i=s[1];return{host:i,port:NC(n.substr(i.length+1))}}else{let[i,a]=n.split(":");return{host:i,port:NC(a)}}}function NC(r){if(!r)return null;let e=Number(r);return isNaN(e)?null:e}function bD(){function r(){let e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",r):r())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Br=class{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return Ht("not implemented")}_getIdTokenResponse(e){return Ht("not implemented")}_linkToIdToken(e,t){return Ht("not implemented")}_getReauthenticationResolver(e){return Ht("not implemented")}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function vD(r,e){return We(r,"POST","/v1/accounts:signUp",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function RD(r,e){return Cr(r,"POST","/v1/accounts:signInWithPassword",Fe(r,e))}async function SD(r,e){return We(r,"POST","/v1/accounts:sendOobCode",Fe(r,e))}async function PD(r,e){return SD(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ND(r,e){return Cr(r,"POST","/v1/accounts:signInWithEmailLink",Fe(r,e))}async function OD(r,e){return Cr(r,"POST","/v1/accounts:signInWithEmailLink",Fe(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ri=class r extends Br{constructor(e,t,n,s=null){super("password",n),this._email=e,this._password=t,this._tenantId=s}static _fromEmailAndPassword(e,t){return new r(e,t,"password")}static _fromEmailAndCode(e,t,n=null){return new r(e,t,"emailLink",n)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){let t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":let t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return ns(e,t,"signInWithPassword",RD,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return ND(e,{email:this._email,oobCode:this._password});default:Ot(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":let n={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return ns(e,n,"signUpPassword",vD,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return OD(e,{idToken:t,email:this._email,oobCode:this._password});default:Ot(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function rs(r,e){return Cr(r,"POST","/v1/accounts:signInWithIdp",Fe(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var xD="http://localhost",hr=class r extends Br{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){let t=new r(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):Ot("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){let t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:s,...i}=t;if(!n||!s)return null;let a=new r(n,s);return a.idToken=i.idToken||void 0,a.accessToken=i.accessToken||void 0,a.secret=i.secret,a.nonce=i.nonce,a.pendingToken=i.pendingToken||null,a}_getIdTokenResponse(e){let t=this.buildRequest();return rs(e,t)}_linkToIdToken(e,t){let n=this.buildRequest();return n.idToken=t,rs(e,n)}_getReauthenticationResolver(e){let t=this.buildRequest();return t.autoCreate=!1,rs(e,t)}buildRequest(){let e={requestUri:xD,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{let t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=Zr(t)}return e}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function OC(r,e){return We(r,"POST","/v1/accounts:sendVerificationCode",Fe(r,e))}async function FD(r,e){return Cr(r,"POST","/v1/accounts:signInWithPhoneNumber",Fe(r,e))}async function LD(r,e){let t=await Cr(r,"POST","/v1/accounts:signInWithPhoneNumber",Fe(r,e));if(t.temporaryProof)throw _i(r,"account-exists-with-different-credential",t);return t}var kD={USER_NOT_FOUND:"user-not-found"};async function VD(r,e){let t={...e,operation:"REAUTH"};return Cr(r,"POST","/v1/accounts:signInWithPhoneNumber",Fe(r,t),kD)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Si=class r extends Br{constructor(e){super("phone","phone"),this.params=e}static _fromVerification(e,t){return new r({verificationId:e,verificationCode:t})}static _fromTokenResponse(e,t){return new r({phoneNumber:e,temporaryProof:t})}_getIdTokenResponse(e){return FD(e,this._makeVerificationRequest())}_linkToIdToken(e,t){return LD(e,{idToken:t,...this._makeVerificationRequest()})}_getReauthenticationResolver(e){return VD(e,this._makeVerificationRequest())}_makeVerificationRequest(){let{temporaryProof:e,phoneNumber:t,verificationId:n,verificationCode:s}=this.params;return e&&t?{temporaryProof:e,phoneNumber:t}:{sessionInfo:n,code:s}}toJSON(){let e={providerId:this.providerId};return this.params.phoneNumber&&(e.phoneNumber=this.params.phoneNumber),this.params.temporaryProof&&(e.temporaryProof=this.params.temporaryProof),this.params.verificationCode&&(e.verificationCode=this.params.verificationCode),this.params.verificationId&&(e.verificationId=this.params.verificationId),e}static fromJSON(e){typeof e=="string"&&(e=JSON.parse(e));let{verificationId:t,verificationCode:n,phoneNumber:s,temporaryProof:i}=e;return!n&&!t&&!s&&!i?null:new r({verificationId:t,verificationCode:n,phoneNumber:s,temporaryProof:i})}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function MD(r){switch(r){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function GD(r){let e=es(ts(r)).link,t=e?es(ts(e)).deep_link_id:null,n=es(ts(r)).deep_link_id;return(n?es(ts(n)).link:null)||n||t||e||r}var wo=class r{constructor(e){let t=es(ts(e)),n=t.apiKey??null,s=t.oobCode??null,i=MD(t.mode??null);W(n&&s&&i,"argument-error"),this.apiKey=n,this.operation=i,this.code=s,this.continueUrl=t.continueUrl??null,this.languageCode=t.lang??null,this.tenantId=t.tenantId??null}static parseLink(e){let t=GD(e);try{return new r(t)}catch{return null}}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var fr=class r{constructor(){this.providerId=r.PROVIDER_ID}static credential(e,t){return Ri._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){let n=wo.parseLink(t);return W(n,"argument-error"),Ri._fromEmailAndCode(e,n.code,n.tenantId)}};fr.PROVIDER_ID="password";fr.EMAIL_PASSWORD_SIGN_IN_METHOD="password";fr.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Do=class{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var dr=class extends Do{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Pi=class r extends dr{constructor(){super("facebook.com")}static credential(e){return hr._fromParams({providerId:r.PROVIDER_ID,signInMethod:r.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return r.credentialFromTaggedObject(e)}static credentialFromError(e){return r.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return r.credential(e.oauthAccessToken)}catch{return null}}};Pi.FACEBOOK_SIGN_IN_METHOD="facebook.com";Pi.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ni=class r extends dr{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return hr._fromParams({providerId:r.PROVIDER_ID,signInMethod:r.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return r.credentialFromTaggedObject(e)}static credentialFromError(e){return r.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;let{oauthIdToken:t,oauthAccessToken:n}=e;if(!t&&!n)return null;try{return r.credential(t,n)}catch{return null}}};Ni.GOOGLE_SIGN_IN_METHOD="google.com";Ni.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Oi=class r extends dr{constructor(){super("github.com")}static credential(e){return hr._fromParams({providerId:r.PROVIDER_ID,signInMethod:r.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return r.credentialFromTaggedObject(e)}static credentialFromError(e){return r.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return r.credential(e.oauthAccessToken)}catch{return null}}};Oi.GITHUB_SIGN_IN_METHOD="github.com";Oi.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var xi=class r extends dr{constructor(){super("twitter.com")}static credential(e,t){return hr._fromParams({providerId:r.PROVIDER_ID,signInMethod:r.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return r.credentialFromTaggedObject(e)}static credentialFromError(e){return r.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;let{oauthAccessToken:t,oauthTokenSecret:n}=e;if(!t||!n)return null;try{return r.credential(t,n)}catch{return null}}};xi.TWITTER_SIGN_IN_METHOD="twitter.com";xi.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Fi=class r{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,n,s=!1){let i=await Fn._fromIdTokenResponse(e,n,s),a=xC(n);return new r({user:i,providerId:a,_tokenResponse:n,operationType:t})}static async _forOperation(e,t,n){await e._updateTokensIfNecessary(n,!0);let s=xC(n);return new r({user:e,providerId:s,_tokenResponse:n,operationType:t})}};function xC(r){return r.providerId?r.providerId:"phoneNumber"in r?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var bl=class r extends pt{constructor(e,t,n,s){super(t.code,t.message),this.operationType=n,this.user=s,Object.setPrototypeOf(this,r.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:n}}static _fromErrorAndOperation(e,t,n,s){return new r(e,t,n,s)}};function pg(r,e,t,n){return(e==="reauthenticate"?t._getReauthenticationResolver(r):t._getIdTokenResponse(r)).catch(i=>{throw i.code==="auth/multi-factor-auth-required"?bl._fromErrorAndOperation(r,i,e,n):i})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function UD(r,e,t=!1){let n=await Ai(r,e._linkToIdToken(r.auth,await r.getIdToken()),t);return Fi._forOperation(r,"link",n)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function HD(r,e,t=!1){let{auth:n}=r;if(Ct(n.app))return Promise.reject(Ln(n));let s="reauthenticate";try{let i=await Ai(r,pg(n,s,e,r),t);W(i.idToken,n,"internal-error");let a=Ml(i.idToken);W(a,n,"internal-error");let{sub:u}=a;return W(r.uid===u,n,"user-mismatch"),Fi._forOperation(r,s,i)}catch(i){throw(i==null?void 0:i.code)==="auth/user-not-found"&&Ot(n,"user-mismatch"),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Cg(r,e,t=!1){if(Ct(r.app))return Promise.reject(Ln(r));let n="signIn",s=await pg(r,n,e),i=await Fi._fromIdTokenResponse(r,n,s);return t||await r._updateCurrentUser(i.user),i}async function gg(r,e){return Cg(ln(r),e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qD(r,e,t){var n;W(((n=t.url)==null?void 0:n.length)>0,r,"invalid-continue-uri"),W(typeof t.dynamicLinkDomain>"u"||t.dynamicLinkDomain.length>0,r,"invalid-dynamic-link-domain"),W(typeof t.linkDomain>"u"||t.linkDomain.length>0,r,"invalid-hosting-link-domain"),e.continueUrl=t.url,e.dynamicLinkDomain=t.dynamicLinkDomain,e.linkDomain=t.linkDomain,e.canHandleCodeInApp=t.handleCodeInApp,t.iOS&&(W(t.iOS.bundleId.length>0,r,"missing-ios-bundle-id"),e.iOSBundleId=t.iOS.bundleId),t.android&&(W(t.android.packageName.length>0,r,"missing-android-pkg-name"),e.androidInstallApp=t.android.installApp,e.androidMinimumVersionCode=t.android.minimumVersion,e.androidPackageName=t.android.packageName)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function jD(r){let e=ln(r);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function Ul(r,e,t){let n=ln(r),s={requestType:"PASSWORD_RESET",email:e,clientType:"CLIENT_TYPE_WEB"};t&&qD(n,s,t),await ns(n,s,"getOobCode",PD,"EMAIL_PASSWORD_PROVIDER")}function Hl(r,e,t){return Ct(r.app)?Promise.reject(Ln(r)):gg(we(r),fr.credential(e,t)).catch(async n=>{throw n.code==="auth/password-does-not-meet-requirements"&&jD(r),n})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ql(r,e){return we(r).setPersistence(e)}function mg(r,e,t,n){return we(r).onIdTokenChanged(e,t,n)}function Eg(r,e,t){return we(r).beforeAuthStateChanged(e,t)}function jl(r,e,t,n){return we(r).onAuthStateChanged(e,t,n)}function Kl(r){return we(r).signOut()}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function FC(r,e){return We(r,"POST","/v2/accounts/mfaEnrollment:start",Fe(r,e))}function KD(r,e){return We(r,"POST","/v2/accounts/mfaEnrollment:finalize",Fe(r,e))}function JD(r,e){return We(r,"POST","/v2/accounts/mfaEnrollment:start",Fe(r,e))}function zD(r,e){return We(r,"POST","/v2/accounts/mfaEnrollment:finalize",Fe(r,e))}var Io="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var To=class{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Io,"1"),this.storage.removeItem(Io),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){let t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var WD=1e3,QD=10,Ao=class extends To{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=cg(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(let t of Object.keys(this.listeners)){let n=this.storage.getItem(t),s=this.localCache[t];n!==s&&e(t,s,n)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((a,u,c)=>{this.notifyListeners(a,c)});return}let n=e.key;t?this.detachListener():this.stopPolling();let s=()=>{let a=this.storage.getItem(n);!t&&this.localCache[n]===a||this.notifyListeners(n,a)},i=this.storage.getItem(n);gD()&&i!==e.newValue&&e.newValue!==e.oldValue?setTimeout(s,QD):s()}notifyListeners(e,t){this.localCache[e]=t;let n=this.listeners[e];if(n)for(let s of Array.from(n))s(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:n}),!0)})},WD)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){let t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}};Ao.type="LOCAL";var Vi=Ao;/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var $D=1e3;function dl(r){var n;let e=r.replace(/[\\^$.*+?()[\]{}|]/g,"\\$&"),t=RegExp(`${e}=([^;]+)`);return((n=document.cookie.match(t))==null?void 0:n[1])??null}function pl(r){return`${window.location.protocol==="http:"?"__dev_":"__HOST-"}FIREBASE_${r.split(":")[3]}`}var vl=class{constructor(){this.type="COOKIE",this.listenerUnsubscribes=new Map}_getFinalTarget(e){if(typeof window===void 0)return e;let t=new URL(`${window.location.origin}/__cookies__`);return t.searchParams.set("finalTarget",e),t}async _isAvailable(){return typeof isSecureContext=="boolean"&&!isSecureContext||typeof navigator>"u"||typeof document>"u"?!1:navigator.cookieEnabled??!0}async _set(e,t){}async _get(e){if(!this._isAvailable())return null;let t=pl(e);if(window.cookieStore){let n=await window.cookieStore.get(t);return n==null?void 0:n.value}return dl(t)}async _remove(e){if(!this._isAvailable()||!await this._get(e))return;let n=pl(e);document.cookie=`${n}=;Max-Age=34560000;Partitioned;Secure;SameSite=Strict;Path=/;Priority=High`,await fetch("/__cookies__",{method:"DELETE"}).catch(()=>{})}_addListener(e,t){if(!this._isAvailable())return;let n=pl(e);if(window.cookieStore){let u=(l=>{let h=l.changed.find(p=>p.name===n);h&&t(h.value),l.deleted.find(p=>p.name===n)&&t(null)}),c=()=>window.cookieStore.removeEventListener("change",u);return this.listenerUnsubscribes.set(t,c),window.cookieStore.addEventListener("change",u)}let s=dl(n),i=setInterval(()=>{let u=dl(n);u!==s&&(t(u),s=u)},$D),a=()=>clearInterval(i);this.listenerUnsubscribes.set(t,a)}_removeListener(e,t){let n=this.listenerUnsubscribes.get(t);n&&(n(),this.listenerUnsubscribes.delete(t))}};vl.type="COOKIE";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var bo=class extends To{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}};bo.type="SESSION";var ss=bo;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function YD(r){return Promise.all(r.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var vo=class r{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){let t=this.receivers.find(s=>s.isListeningto(e));if(t)return t;let n=new r(e);return this.receivers.push(n),n}isListeningto(e){return this.eventTarget===e}async handleEvent(e){let t=e,{eventId:n,eventType:s,data:i}=t.data,a=this.handlersMap[s];if(!(a!=null&&a.size))return;t.ports[0].postMessage({status:"ack",eventId:n,eventType:s});let u=Array.from(a).map(async l=>l(t.origin,i)),c=await YD(u);t.ports[0].postMessage({status:"done",eventId:n,eventType:s,response:c})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}};vo.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jl(r="",e=10){let t="";for(let n=0;n<e;n++)t+=Math.floor(Math.random()*10);return r+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Rl=class{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){let s=typeof MessageChannel<"u"?new MessageChannel:null;if(!s)throw new Error("connection_unavailable");let i,a;return new Promise((u,c)=>{let l=Jl("",20);s.port1.start();let h=setTimeout(()=>{c(new Error("unsupported_event"))},n);a={messageChannel:s,onMessage(d){let p=d;if(p.data.eventId===l)switch(p.data.status){case"ack":clearTimeout(h),i=setTimeout(()=>{c(new Error("timeout"))},3e3);break;case"done":clearTimeout(i),u(p.data.response);break;default:clearTimeout(h),clearTimeout(i),c(new Error("invalid_response"));break}}},this.handlers.add(a),s.port1.addEventListener("message",a.onMessage),this.target.postMessage({eventType:e,eventId:l,data:t},[s.port2])}).finally(()=>{a&&this.removeMessageHandler(a)})}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jt(){return window}function XD(r){jt().location.href=r}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _g(){return typeof jt().WorkerGlobalScope<"u"&&typeof jt().importScripts=="function"}async function ZD(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function eI(){var r;return((r=navigator==null?void 0:navigator.serviceWorker)==null?void 0:r.controller)||null}function tI(){return _g()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var yg="firebaseLocalStorageDb",nI=1,Ro="firebaseLocalStorage",wg="fbase_key",rI=800,sI=3,LC=800,Go=2500,Ti="DB_TIMEOUT",pr=class{constructor(e){this.request=e}toPromise(e=Go){return new Promise((t,n)=>{let s=!1,i=setTimeout(()=>{var a;if(!s){s=!0;try{(a=this.request.transaction)==null||a.abort()}catch{}n(new Error(Ti))}},e);this.request.addEventListener("success",()=>{s||(s=!0,clearTimeout(i),t(this.request.result))}),this.request.addEventListener("error",()=>{s||(s=!0,clearTimeout(i),n(this.request.error))})})}};function Uo(r,e){return r.transaction([Ro],e?"readwrite":"readonly").objectStore(Ro)}function iI(){let r=indexedDB.deleteDatabase(yg);return new pr(r).toPromise()}function Dg(){let r=indexedDB.open(yg,nI);return new Promise((e,t)=>{let n=!1,s=setTimeout(()=>{n||(n=!0,t(new Error(Ti)))},Go);r.addEventListener("error",()=>{n||(n=!0,clearTimeout(s),t(r.error))}),r.addEventListener("upgradeneeded",()=>{let i=r.result;try{i.createObjectStore(Ro,{keyPath:wg})}catch(a){n||(n=!0,clearTimeout(s),t(a))}}),r.addEventListener("success",async()=>{let i=r.result;if(n){i.close();return}if(clearTimeout(s),i.objectStoreNames.contains(Ro))n=!0,e(i);else{i.close();try{await iI();let a=await Dg();n=!0,e(a)}catch(a){n||(n=!0,t(a))}}})})}async function kC(r,e,t,n=Go){let s=Uo(r,!0).put({[wg]:e,value:t});return new pr(s).toPromise(n)}async function aI(r,e){let t=Uo(r,!1).get(e),n=await new pr(t).toPromise();return n===void 0?null:n.value}function VC(r,e,t=Go){let n=Uo(r,!0).delete(e);return new pr(n).toPromise(t)}var So=class{registerLifecycleListeners(){typeof window<"u"&&typeof window.addEventListener=="function"&&(window.addEventListener("pagehide",this.onPageHide),window.addEventListener("pageshow",this.onPageShow))}unregisterLifecycleListeners(){typeof window<"u"&&typeof window.removeEventListener=="function"&&(window.removeEventListener("pagehide",this.onPageHide),window.removeEventListener("pageshow",this.onPageShow))}constructor(){this.type="LOCAL",this.dbPromise=null,this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.isClosing=!1,this.pendingWrites=0,this._lastProbeTimedOut=!1,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this.onPageHide=()=>{this.isClosing=!0,this.stopPolling(),this.dbPromise&&(this.dbPromise.then(e=>e.close()).catch(()=>{}),this.dbPromise=null)},this.onPageShow=()=>{this.isClosing&&(this.isClosing=!1,Object.keys(this.listeners).length>0&&this.startPolling())},this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){if(this.dbPromise)return this.dbPromise;let e=Dg();return this.dbPromise=e,e.catch(()=>{this.dbPromise===e&&(this.dbPromise=null)}),e}async _withRetries(e){let t=0;for(;;){let n,s=null;try{let i=this._openDb();return s=this.dbPromise,n=await i,await e(n)}catch(i){if(n)n.close(),s&&this.dbPromise===s&&(this.dbPromise=null);else if(this.dbPromise&&this.dbPromise===s){let u=this.dbPromise;this.dbPromise=null;try{(await u).close()}catch{}}if(i instanceof Error&&i.message===Ti||t++>sI)throw i}}}async initializeServiceWorkerMessaging(){return _g()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=vo._getInstance(tI()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,n;if(this.activeServiceWorker=await ZD(),!this.activeServiceWorker)return;this.sender=new Rl(this.activeServiceWorker);let e=await this.sender._send("ping",{},800);e&&(t=e[0])!=null&&t.fulfilled&&(n=e[0])!=null&&n.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||eI()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){this._lastProbeTimedOut=!1;try{return indexedDB?(await this._withRetries(async e=>{await kC(e,Io,"1",LC),await VC(e,Io,LC)}),!0):!1}catch(e){this._lastProbeTimedOut=e instanceof Error&&e.message===Ti}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>kC(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){try{let t=await this._withRetries(n=>aI(n,e));return this.localCache[e]=t,t}catch(t){if(t instanceof Error&&t.message===Ti&&this.localCache[e]!=null)return this.localCache[e];throw t}}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>VC(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){if(this.isClosing)return[];try{let e=await this._withRetries(s=>{let i=Uo(s,!1).getAll();return new pr(i).toPromise()});if(this.isClosing)return[];if(!e)return[];if(this.pendingWrites!==0)return[];let t=[],n=new Set;if(e.length!==0)for(let{fbase_key:s,value:i}of e)n.add(s),JSON.stringify(this.localCache[s])!==JSON.stringify(i)&&(this.notifyListeners(s,i),t.push(s));for(let s of Object.keys(this.localCache))this.localCache[s]&&!n.has(s)&&(this.notifyListeners(s,null),t.push(s));return t}catch(e){return this.isClosing||uo(`Firebase Auth cross-tab polling failed with error: ${e}`),[]}}notifyListeners(e,t){this.localCache[e]=t;let n=this.listeners[e];if(n)for(let s of Array.from(n))s(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),rI)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.startPolling(),this.registerLifecycleListeners()),this.listeners[e]||(this.listeners[e]=new Set,e in this.localCache||this._get(e).catch(()=>{})),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.stopPolling(),this.unregisterLifecycleListeners())}};So.type="LOCAL";var Mi=So;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function MC(r,e){return We(r,"POST","/v2/accounts/mfaSignIn:start",Fe(r,e))}function oI(r,e){return We(r,"POST","/v2/accounts/mfaSignIn:finalize",Fe(r,e))}function uI(r,e){return We(r,"POST","/v2/accounts/mfaSignIn:finalize",Fe(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var yb=hg("rcb"),wb=new lr(3e4,6e4);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Bo="recaptcha";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function cI(r,e,t){var n;if(!r._getRecaptchaConfig())try{await ID(r)}catch{console.log("Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.")}try{let s;if(typeof e=="string"?s={phoneNumber:e}:s=e,"session"in s){let i=s.session;if("phoneNumber"in s){W(i.type==="enroll",r,"internal-error");let a={idToken:i.credential,phoneEnrollmentInfo:{phoneNumber:s.phoneNumber,clientType:"CLIENT_TYPE_WEB"}};return(await ns(r,a,"mfaSmsEnrollment",async(h,d)=>{if(d.phoneEnrollmentInfo.captchaResponse===Ii){W((t==null?void 0:t.type)===Bo,h,"argument-error");let p=await Cl(h,d,t);return FC(h,p)}return FC(h,d)},"PHONE_PROVIDER").catch(h=>Promise.reject(h))).phoneSessionInfo.sessionInfo}else{W(i.type==="signin",r,"internal-error");let a=((n=s.multiFactorHint)==null?void 0:n.uid)||s.multiFactorUid;W(a,r,"missing-multi-factor-info");let u={mfaPendingCredential:i.credential,mfaEnrollmentId:a,phoneSignInInfo:{clientType:"CLIENT_TYPE_WEB"}};return(await ns(r,u,"mfaSmsSignIn",async(d,p)=>{if(p.phoneSignInInfo.captchaResponse===Ii){W((t==null?void 0:t.type)===Bo,d,"argument-error");let E=await Cl(d,p,t);return MC(d,E)}return MC(d,p)},"PHONE_PROVIDER").catch(d=>Promise.reject(d))).phoneResponseInfo.sessionInfo}}else{let i={phoneNumber:s.phoneNumber,clientType:"CLIENT_TYPE_WEB"};return(await ns(r,i,"sendVerificationCode",async(l,h)=>{if(h.captchaResponse===Ii){W((t==null?void 0:t.type)===Bo,l,"argument-error");let d=await Cl(l,h,t);return OC(l,d)}return OC(l,h)},"PHONE_PROVIDER").catch(l=>Promise.reject(l))).sessionInfo}}finally{t==null||t._reset()}}async function Cl(r,e,t){W(t.type===Bo,r,"argument-error");let n=await t.verify();W(typeof n=="string",r,"argument-error");let s={...e};if("phoneEnrollmentInfo"in s){let i=s.phoneEnrollmentInfo.phoneNumber,a=s.phoneEnrollmentInfo.captchaResponse,u=s.phoneEnrollmentInfo.clientType,c=s.phoneEnrollmentInfo.recaptchaVersion;return Object.assign(s,{phoneEnrollmentInfo:{phoneNumber:i,recaptchaToken:n,captchaResponse:a,clientType:u,recaptchaVersion:c}}),s}else if("phoneSignInInfo"in s){let i=s.phoneSignInInfo.captchaResponse,a=s.phoneSignInInfo.clientType,u=s.phoneSignInInfo.recaptchaVersion;return Object.assign(s,{phoneSignInInfo:{recaptchaToken:n,captchaResponse:i,clientType:a,recaptchaVersion:u}}),s}else return Object.assign(s,{recaptchaToken:n}),s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Li=class r{constructor(e){this.providerId=r.PROVIDER_ID,this.auth=ln(e)}verifyPhoneNumber(e,t){return cI(this.auth,e,we(t))}static credential(e,t){return Si._fromVerification(e,t)}static credentialFromResult(e){let t=e;return r.credentialFromTaggedObject(t)}static credentialFromError(e){return r.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;let{phoneNumber:t,temporaryProof:n}=e;return t&&n?Si._fromTokenResponse(t,n):null}};Li.PROVIDER_ID="phone";Li.PHONE_SIGN_IN_METHOD="phone";/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lI(r,e){return e?un(e):(W(r._popupRedirectResolver,r,"argument-error"),r._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ki=class extends Br{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return rs(e,this._buildIdpRequest())}_linkToIdToken(e,t){return rs(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return rs(e,this._buildIdpRequest())}_buildIdpRequest(e){let t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}};function BI(r){return Cg(r.auth,new ki(r),r.bypassAuthState)}function hI(r){let{auth:e,user:t}=r;return W(t,e,"internal-error"),HD(t,new ki(r),r.bypassAuthState)}async function fI(r){let{auth:e,user:t}=r;return W(t,e,"internal-error"),UD(t,new ki(r),r.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Po=class{constructor(e,t,n,s,i=!1){this.auth=e,this.resolver=n,this.user=s,this.bypassAuthState=i,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{if(this.eventManager=await this.resolver._initialize(this.auth),!this.pendingPromise||(await this.onExecution(),!this.pendingPromise))return;this.eventManager.registerConsumer(this)}catch(n){this.pendingPromise&&this.reject(n)}})}async onAuthEvent(e){if(!this.pendingPromise)return;let{urlResponse:t,sessionId:n,postBody:s,tenantId:i,error:a,type:u}=e;if(a){this.reject(a);return}let c={auth:this.auth,requestUri:t,sessionId:n,tenantId:i||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(u)(c))}catch(l){this.reject(l)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return BI;case"linkViaPopup":case"linkViaRedirect":return fI;case"reauthViaPopup":case"reauthViaRedirect":return hI;default:Ot(this.auth,"internal-error")}}resolve(e){cn(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){cn(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var dI=new lr(2e3,1e4);var Sl=class r extends Po{constructor(e,t,n,s,i){super(e,t,s,i),this.provider=n,this.authWindow=null,this.pollId=null,r.currentPopupAction&&r.currentPopupAction.cancel(),r.currentPopupAction=this}async executeNotNull(){let e=await this.execute();return W(e,this.auth,"internal-error"),e}async onExecution(){cn(this.filter.length===1,"Popup operations only handle one event");let e=Jl();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(qt(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(qt(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,r.currentPopupAction=null}pollUserCancellation(){let e=()=>{var t,n;if((n=(t=this.authWindow)==null?void 0:t.window)!=null&&n.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(qt(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,dI.get())};e()}};Sl.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var pI="pendingRedirect",ho=new Map,Pl=class extends Po{constructor(e,t,n=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,n),this.eventId=null}async execute(){let e=ho.get(this.auth._key());if(!e){try{let n=await CI(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(n)}catch(t){e=()=>Promise.reject(t)}ho.set(this.auth._key(),e)}return this.bypassAuthState||ho.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){let t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}};async function CI(r,e){let t=EI(e),n=mI(r);if(!await n._isAvailable())return!1;let s=await n._get(t)==="true";return await n._remove(t),s}function gI(r,e){ho.set(r._key(),e)}function mI(r){return un(r._redirectPersistence)}function EI(r){return lo(pI,r.config.apiKey,r.name)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _I(r,e,t=!1){if(Ct(r.app))return Promise.reject(Ln(r));let n=ln(r),s=lI(n,e),a=await new Pl(n,s,t).execute();return a&&!t&&(delete a.user._redirectEventId,await n._persistUserIfCurrent(a.user),await n._setRedirectUser(null,e)),a}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var yI=600*1e3,Nl=class{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!wI(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var n;if(e.error&&!Ig(e)){let s=((n=e.error.code)==null?void 0:n.split("auth/")[1])||"internal-error";t.onError(qt(this.auth,s))}else t.onAuthEvent(e)}isEventForConsumer(e,t){let n=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=yI&&this.cachedEventUids.clear(),this.cachedEventUids.has(GC(e))}saveEventToCache(e){this.cachedEventUids.add(GC(e)),this.lastProcessedEventTime=Date.now()}};function GC(r){return[r.type,r.eventId,r.sessionId,r.tenantId].filter(e=>e).join("-")}function Ig({type:r,error:e}){return r==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function wI(r){switch(r.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Ig(r);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function DI(r,e={}){return We(r,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var II=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,TI=/^https?/;async function AI(r){if(r.config.emulator)return;let{authorizedDomains:e}=await DI(r);for(let t of e)try{if(bI(t))return}catch{}Ot(r,"unauthorized-domain")}function bI(r){let e=ml(),{protocol:t,hostname:n}=new URL(e);if(r.startsWith("chrome-extension://")){let a=new URL(r);return a.hostname===""&&n===""?t==="chrome-extension:"&&r.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&a.hostname===n}if(!TI.test(t))return!1;if(II.test(r))return n===r;let s=r.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(n)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var vI=new lr(3e4,6e4);function UC(){let r=jt().___jsl;if(r!=null&&r.H){for(let e of Object.keys(r.H))if(r.H[e].r=r.H[e].r||[],r.H[e].L=r.H[e].L||[],r.H[e].r=[...r.H[e].L],r.CP)for(let t=0;t<r.CP.length;t++)r.CP[t]=null}}function RI(r){return new Promise((e,t)=>{var s,i,a;function n(){UC(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{UC(),t(qt(r,"network-request-failed"))},timeout:vI.get()})}if((i=(s=jt().gapi)==null?void 0:s.iframes)!=null&&i.Iframe)e(gapi.iframes.getContext());else if((a=jt().gapi)!=null&&a.load)n();else{let u=hg("iframefcb");return jt()[u]=()=>{gapi.load?n():t(qt(r,"network-request-failed"))},Bg(`${wD()}?onload=${u}`).catch(c=>t(c))}}).catch(e=>{throw fo=null,e})}var fo=null;function SI(r){return fo=fo||RI(r),fo}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var PI=new lr(5e3,15e3),NI="__/auth/iframe",OI="emulator/auth/iframe",xI={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},FI=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function LI(r){let e=r.config;W(e.authDomain,r,"auth-domain-config-required");let t=e.emulator?Vl(e,OI):`https://${r.config.authDomain}/${NI}`,n={apiKey:e.apiKey,appName:r.name,v:On},s=FI.get(r.config.apiHost);s&&(n.eid=s);let i=r._getFrameworks();return i.length&&(n.fw=i.join(",")),`${t}?${Zr(n).slice(1)}`}async function kI(r){let e=await SI(r),t=jt().gapi;return W(t,r,"internal-error"),e.open({where:document.body,url:LI(r),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:xI,dontclear:!0},n=>new Promise(async(s,i)=>{await n.restyle({setHideOnLeave:!1});let a=qt(r,"network-request-failed"),u=jt().setTimeout(()=>{i(a)},PI.get());function c(){jt().clearTimeout(u),s(n)}n.ping(c).then(c,()=>{i(a)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var VI={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},MI=500,GI=600,UI="_blank",HI="http://localhost",No=class{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}};function qI(r,e,t,n=MI,s=GI){let i=Math.max((window.screen.availHeight-s)/2,0).toString(),a=Math.max((window.screen.availWidth-n)/2,0).toString(),u="",c={...VI,width:n.toString(),height:s.toString(),top:i,left:a},l=Me().toLowerCase();t&&(u=sg(l)?UI:t),ng(l)&&(e=e||HI,c.scrollbars="yes");let h=Object.entries(c).reduce((p,[E,y])=>`${p}${E}=${y},`,"");if(CD(l)&&u!=="_self")return jI(e||"",u),new No(null);let d=window.open(e||"",u,h);W(d,r,"popup-blocked");try{d.focus()}catch{}return new No(d)}function jI(r,e){let t=document.createElement("a");t.href=r,t.target=e;let n=document.createEvent("MouseEvent");n.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(n)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var KI="__/auth/handler",JI="emulator/auth/handler",zI=encodeURIComponent("fac");async function HC(r,e,t,n,s,i){W(r.config.authDomain,r,"auth-domain-config-required"),W(r.config.apiKey,r,"invalid-api-key");let a={apiKey:r.config.apiKey,appName:r.name,authType:t,redirectUrl:n,v:On,eventId:s};if(e instanceof Do){e.setDefaultLanguage(r.languageCode),a.providerId=e.providerId||"",aC(e.getCustomParameters())||(a.customParameters=JSON.stringify(e.getCustomParameters()));for(let[h,d]of Object.entries(i||{}))a[h]=d}if(e instanceof dr){let h=e.getScopes().filter(d=>d!=="");h.length>0&&(a.scopes=h.join(","))}r.tenantId&&(a.tid=r.tenantId);let u=a;for(let h of Object.keys(u))u[h]===void 0&&delete u[h];let c=await r._getAppCheckToken(),l=c?`#${zI}=${encodeURIComponent(c)}`:"";return`${WI(r)}?${Zr(u).slice(1)}${l}`}function WI({config:r}){return r.emulator?Vl(r,JI):`https://${r.authDomain}/${KI}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var gl="webStorageSupport",Ol=class{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=ss,this._completeRedirectFn=_I,this._overrideRedirectResult=gI}async _openPopup(e,t,n,s){var a;cn((a=this.eventManagers[e._key()])==null?void 0:a.manager,"_initialize() not called before _openPopup()");let i=await HC(e,t,n,ml(),s);return qI(e,i,Jl())}async _openRedirect(e,t,n,s){await this._originValidation(e);let i=await HC(e,t,n,ml(),s);return XD(i),new Promise(()=>{})}_initialize(e){let t=e._key();if(this.eventManagers[t]){let{manager:s,promise:i}=this.eventManagers[t];return s?Promise.resolve(s):(cn(i,"If manager is not set, promise should be"),i)}let n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){let t=await kI(e),n=new Nl(e);return t.register("authEvent",s=>(W(s==null?void 0:s.authEvent,e,"invalid-auth-event"),{status:n.onEvent(s.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(gl,{type:gl},s=>{var a;let i=(a=s==null?void 0:s[0])==null?void 0:a[gl];i!==void 0&&t(!!i),Ot(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){let t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=AI(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return cg()||rg()||Gl()}},Tg=Ol,Oo=class{constructor(e){this.factorId=e}_process(e,t,n){switch(t.type){case"enroll":return this._finalizeEnroll(e,t.credential,n);case"signin":return this._finalizeSignIn(e,t.credential);default:return Ht("unexpected MultiFactorSessionType")}}},xl=class r extends Oo{constructor(e){super("phone"),this.credential=e}static _fromCredential(e){return new r(e)}_finalizeEnroll(e,t,n){return KD(e,{idToken:t,displayName:n,phoneVerificationInfo:this.credential._makeVerificationRequest()})}_finalizeSignIn(e,t){return oI(e,{mfaPendingCredential:t,phoneVerificationInfo:this.credential._makeVerificationRequest()})}},xo=class{constructor(){}static assertion(e){return xl._fromCredential(e)}};xo.FACTOR_ID="phone";var Fo=class{static assertionForEnrollment(e,t){return Lo._fromSecret(e,t)}static assertionForSignIn(e,t){return Lo._fromEnrollmentId(e,t)}static async generateSecret(e){var s;let t=e;W(typeof((s=t.user)==null?void 0:s.auth)<"u","internal-error");let n=await JD(t.user.auth,{idToken:t.credential,totpEnrollmentInfo:{}});return ko._fromStartTotpMfaEnrollmentResponse(n,t.user.auth)}};Fo.FACTOR_ID="totp";var Lo=class r extends Oo{constructor(e,t,n){super("totp"),this.otp=e,this.enrollmentId=t,this.secret=n}static _fromSecret(e,t){return new r(t,void 0,e)}static _fromEnrollmentId(e,t){return new r(t,e)}async _finalizeEnroll(e,t,n){return W(typeof this.secret<"u",e,"argument-error"),zD(e,{idToken:t,displayName:n,totpVerificationInfo:this.secret._makeTotpVerificationInfo(this.otp)})}async _finalizeSignIn(e,t){W(this.enrollmentId!==void 0&&this.otp!==void 0,e,"argument-error");let n={verificationCode:this.otp};return uI(e,{mfaPendingCredential:t,mfaEnrollmentId:this.enrollmentId,totpVerificationInfo:n})}},ko=class r{constructor(e,t,n,s,i,a,u){this.sessionInfo=a,this.auth=u,this.secretKey=e,this.hashingAlgorithm=t,this.codeLength=n,this.codeIntervalSeconds=s,this.enrollmentCompletionDeadline=i}static _fromStartTotpMfaEnrollmentResponse(e,t){return new r(e.totpSessionInfo.sharedSecretKey,e.totpSessionInfo.hashingAlgorithm,e.totpSessionInfo.verificationCodeLength,e.totpSessionInfo.periodSec,new Date(e.totpSessionInfo.finalizeEnrollmentTime).toUTCString(),e.totpSessionInfo.sessionInfo,t)}_makeTotpVerificationInfo(e){return{sessionInfo:this.sessionInfo,verificationCode:e}}generateQrCodeUrl(e,t){var s;let n=!1;return(oo(e)||oo(t))&&(n=!0),n&&(oo(e)&&(e=((s=this.auth.currentUser)==null?void 0:s.email)||"unknownuser"),oo(t)&&(t=this.auth.name)),`otpauth://totp/${t}:${e}?secret=${this.secretKey}&issuer=${t}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`}};function oo(r){return typeof r>"u"||(r==null?void 0:r.length)===0}var qC="@firebase/auth",jC="1.13.11";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Fl=class{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;let t=this.auth.onIdTokenChanged(n=>{e((n==null?void 0:n.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();let t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){W(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function QI(r){switch(r){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function $I(r){Nn(new wt("auth",(e,{options:t})=>{let n=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),i=e.getProvider("app-check-internal"),{apiKey:a,authDomain:u}=n.options;W(a&&!a.includes(":"),"invalid-api-key",{appName:n.name});let c={apiKey:a,authDomain:u,clientPlatform:r,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:lg(r)},l=new Il(n,s,i,c);return TD(l,t),l},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,n)=>{e.getProvider("auth-internal").initialize()})),Nn(new wt("auth-internal",e=>{let t=ln(e.getProvider("auth").getImmediate());return(n=>new Fl(n))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Nt(qC,jC,QI(r)),Nt(qC,jC,"esm2020")}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function YI(){var r;return((r=document.getElementsByTagName("head"))==null?void 0:r[0])??document}function XI(r){return new Promise((e,t)=>{let n=document.createElement("script");try{TC(n,r)}catch(s){t(s);return}n.onload=e,n.onerror=s=>{let i=qt("internal-error");i.customData=s,t(i)},n.type="text/javascript",n.charset="UTF-8",YI().appendChild(n)})}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ZI=300,eT=Qc("authIdTokenMaxAge")||ZI,KC=null,tT=r=>async e=>{let t=e&&await e.getIdTokenResult(),n=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(n&&n>eT)return;let s=t==null?void 0:t.token;KC!==s&&(KC=s,await fetch(r,{method:s?"POST":"DELETE",headers:s?{Authorization:`Bearer ${s}`}:{}}))};function zl(r=ao()){let e=mi(r,"auth");if(e.isInitialized())return e.getImmediate();let t=Mo(r,{popupRedirectResolver:Tg,persistence:[Mi,Vi,ss]}),n=Qc("authTokenSyncURL");if(n&&typeof isSecureContext=="boolean"&&isSecureContext){let i=new URL(n,location.origin);if(location.origin===i.origin){let a=tT(i.toString());Eg(t,a,()=>a(t.currentUser)),mg(t,u=>a(u))}}let s=zc("auth");return s&&fg(t,`http://${s}`),t}_D({loadJS:XI,gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});$I("Browser");var Ag=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},bg={};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Bn,Wl;(function(){var r;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(A,_){function D(){}D.prototype=_.prototype,A.F=_.prototype,A.prototype=new D,A.prototype.constructor=A,A.D=function(v,T,P){for(var w=Array(arguments.length-2),ot=2;ot<arguments.length;ot++)w[ot-2]=arguments[ot];return _.prototype[T].apply(v,w)}}function t(){this.blockSize=-1}function n(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(n,t),n.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(A,_,D){D||(D=0);let v=Array(16);if(typeof _=="string")for(var T=0;T<16;++T)v[T]=_.charCodeAt(D++)|_.charCodeAt(D++)<<8|_.charCodeAt(D++)<<16|_.charCodeAt(D++)<<24;else for(T=0;T<16;++T)v[T]=_[D++]|_[D++]<<8|_[D++]<<16|_[D++]<<24;_=A.g[0],D=A.g[1],T=A.g[2];let P=A.g[3],w;w=_+(P^D&(T^P))+v[0]+3614090360&4294967295,_=D+(w<<7&4294967295|w>>>25),w=P+(T^_&(D^T))+v[1]+3905402710&4294967295,P=_+(w<<12&4294967295|w>>>20),w=T+(D^P&(_^D))+v[2]+606105819&4294967295,T=P+(w<<17&4294967295|w>>>15),w=D+(_^T&(P^_))+v[3]+3250441966&4294967295,D=T+(w<<22&4294967295|w>>>10),w=_+(P^D&(T^P))+v[4]+4118548399&4294967295,_=D+(w<<7&4294967295|w>>>25),w=P+(T^_&(D^T))+v[5]+1200080426&4294967295,P=_+(w<<12&4294967295|w>>>20),w=T+(D^P&(_^D))+v[6]+2821735955&4294967295,T=P+(w<<17&4294967295|w>>>15),w=D+(_^T&(P^_))+v[7]+4249261313&4294967295,D=T+(w<<22&4294967295|w>>>10),w=_+(P^D&(T^P))+v[8]+1770035416&4294967295,_=D+(w<<7&4294967295|w>>>25),w=P+(T^_&(D^T))+v[9]+2336552879&4294967295,P=_+(w<<12&4294967295|w>>>20),w=T+(D^P&(_^D))+v[10]+4294925233&4294967295,T=P+(w<<17&4294967295|w>>>15),w=D+(_^T&(P^_))+v[11]+2304563134&4294967295,D=T+(w<<22&4294967295|w>>>10),w=_+(P^D&(T^P))+v[12]+1804603682&4294967295,_=D+(w<<7&4294967295|w>>>25),w=P+(T^_&(D^T))+v[13]+4254626195&4294967295,P=_+(w<<12&4294967295|w>>>20),w=T+(D^P&(_^D))+v[14]+2792965006&4294967295,T=P+(w<<17&4294967295|w>>>15),w=D+(_^T&(P^_))+v[15]+1236535329&4294967295,D=T+(w<<22&4294967295|w>>>10),w=_+(T^P&(D^T))+v[1]+4129170786&4294967295,_=D+(w<<5&4294967295|w>>>27),w=P+(D^T&(_^D))+v[6]+3225465664&4294967295,P=_+(w<<9&4294967295|w>>>23),w=T+(_^D&(P^_))+v[11]+643717713&4294967295,T=P+(w<<14&4294967295|w>>>18),w=D+(P^_&(T^P))+v[0]+3921069994&4294967295,D=T+(w<<20&4294967295|w>>>12),w=_+(T^P&(D^T))+v[5]+3593408605&4294967295,_=D+(w<<5&4294967295|w>>>27),w=P+(D^T&(_^D))+v[10]+38016083&4294967295,P=_+(w<<9&4294967295|w>>>23),w=T+(_^D&(P^_))+v[15]+3634488961&4294967295,T=P+(w<<14&4294967295|w>>>18),w=D+(P^_&(T^P))+v[4]+3889429448&4294967295,D=T+(w<<20&4294967295|w>>>12),w=_+(T^P&(D^T))+v[9]+568446438&4294967295,_=D+(w<<5&4294967295|w>>>27),w=P+(D^T&(_^D))+v[14]+3275163606&4294967295,P=_+(w<<9&4294967295|w>>>23),w=T+(_^D&(P^_))+v[3]+4107603335&4294967295,T=P+(w<<14&4294967295|w>>>18),w=D+(P^_&(T^P))+v[8]+1163531501&4294967295,D=T+(w<<20&4294967295|w>>>12),w=_+(T^P&(D^T))+v[13]+2850285829&4294967295,_=D+(w<<5&4294967295|w>>>27),w=P+(D^T&(_^D))+v[2]+4243563512&4294967295,P=_+(w<<9&4294967295|w>>>23),w=T+(_^D&(P^_))+v[7]+1735328473&4294967295,T=P+(w<<14&4294967295|w>>>18),w=D+(P^_&(T^P))+v[12]+2368359562&4294967295,D=T+(w<<20&4294967295|w>>>12),w=_+(D^T^P)+v[5]+4294588738&4294967295,_=D+(w<<4&4294967295|w>>>28),w=P+(_^D^T)+v[8]+2272392833&4294967295,P=_+(w<<11&4294967295|w>>>21),w=T+(P^_^D)+v[11]+1839030562&4294967295,T=P+(w<<16&4294967295|w>>>16),w=D+(T^P^_)+v[14]+4259657740&4294967295,D=T+(w<<23&4294967295|w>>>9),w=_+(D^T^P)+v[1]+2763975236&4294967295,_=D+(w<<4&4294967295|w>>>28),w=P+(_^D^T)+v[4]+1272893353&4294967295,P=_+(w<<11&4294967295|w>>>21),w=T+(P^_^D)+v[7]+4139469664&4294967295,T=P+(w<<16&4294967295|w>>>16),w=D+(T^P^_)+v[10]+3200236656&4294967295,D=T+(w<<23&4294967295|w>>>9),w=_+(D^T^P)+v[13]+681279174&4294967295,_=D+(w<<4&4294967295|w>>>28),w=P+(_^D^T)+v[0]+3936430074&4294967295,P=_+(w<<11&4294967295|w>>>21),w=T+(P^_^D)+v[3]+3572445317&4294967295,T=P+(w<<16&4294967295|w>>>16),w=D+(T^P^_)+v[6]+76029189&4294967295,D=T+(w<<23&4294967295|w>>>9),w=_+(D^T^P)+v[9]+3654602809&4294967295,_=D+(w<<4&4294967295|w>>>28),w=P+(_^D^T)+v[12]+3873151461&4294967295,P=_+(w<<11&4294967295|w>>>21),w=T+(P^_^D)+v[15]+530742520&4294967295,T=P+(w<<16&4294967295|w>>>16),w=D+(T^P^_)+v[2]+3299628645&4294967295,D=T+(w<<23&4294967295|w>>>9),w=_+(T^(D|~P))+v[0]+4096336452&4294967295,_=D+(w<<6&4294967295|w>>>26),w=P+(D^(_|~T))+v[7]+1126891415&4294967295,P=_+(w<<10&4294967295|w>>>22),w=T+(_^(P|~D))+v[14]+2878612391&4294967295,T=P+(w<<15&4294967295|w>>>17),w=D+(P^(T|~_))+v[5]+4237533241&4294967295,D=T+(w<<21&4294967295|w>>>11),w=_+(T^(D|~P))+v[12]+1700485571&4294967295,_=D+(w<<6&4294967295|w>>>26),w=P+(D^(_|~T))+v[3]+2399980690&4294967295,P=_+(w<<10&4294967295|w>>>22),w=T+(_^(P|~D))+v[10]+4293915773&4294967295,T=P+(w<<15&4294967295|w>>>17),w=D+(P^(T|~_))+v[1]+2240044497&4294967295,D=T+(w<<21&4294967295|w>>>11),w=_+(T^(D|~P))+v[8]+1873313359&4294967295,_=D+(w<<6&4294967295|w>>>26),w=P+(D^(_|~T))+v[15]+4264355552&4294967295,P=_+(w<<10&4294967295|w>>>22),w=T+(_^(P|~D))+v[6]+2734768916&4294967295,T=P+(w<<15&4294967295|w>>>17),w=D+(P^(T|~_))+v[13]+1309151649&4294967295,D=T+(w<<21&4294967295|w>>>11),w=_+(T^(D|~P))+v[4]+4149444226&4294967295,_=D+(w<<6&4294967295|w>>>26),w=P+(D^(_|~T))+v[11]+3174756917&4294967295,P=_+(w<<10&4294967295|w>>>22),w=T+(_^(P|~D))+v[2]+718787259&4294967295,T=P+(w<<15&4294967295|w>>>17),w=D+(P^(T|~_))+v[9]+3951481745&4294967295,A.g[0]=A.g[0]+_&4294967295,A.g[1]=A.g[1]+(T+(w<<21&4294967295|w>>>11))&4294967295,A.g[2]=A.g[2]+T&4294967295,A.g[3]=A.g[3]+P&4294967295}n.prototype.v=function(A,_){_===void 0&&(_=A.length);let D=_-this.blockSize,v=this.C,T=this.h,P=0;for(;P<_;){if(T==0)for(;P<=D;)s(this,A,P),P+=this.blockSize;if(typeof A=="string"){for(;P<_;)if(v[T++]=A.charCodeAt(P++),T==this.blockSize){s(this,v),T=0;break}}else for(;P<_;)if(v[T++]=A[P++],T==this.blockSize){s(this,v),T=0;break}}this.h=T,this.o+=_},n.prototype.A=function(){var A=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);A[0]=128;for(var _=1;_<A.length-8;++_)A[_]=0;_=this.o*8;for(var D=A.length-8;D<A.length;++D)A[D]=_&255,_/=256;for(this.v(A),A=Array(16),_=0,D=0;D<4;++D)for(let v=0;v<32;v+=8)A[_++]=this.g[D]>>>v&255;return A};function i(A,_){var D=u;return Object.prototype.hasOwnProperty.call(D,A)?D[A]:D[A]=_(A)}function a(A,_){this.h=_;let D=[],v=!0;for(let T=A.length-1;T>=0;T--){let P=A[T]|0;v&&P==_||(D[T]=P,v=!1)}this.g=D}var u={};function c(A){return-128<=A&&A<128?i(A,function(_){return new a([_|0],_<0?-1:0)}):new a([A|0],A<0?-1:0)}function l(A){if(isNaN(A)||!isFinite(A))return d;if(A<0)return F(l(-A));let _=[],D=1;for(let v=0;A>=D;v++)_[v]=A/D|0,D*=4294967296;return new a(_,0)}function h(A,_){if(A.length==0)throw Error("number format error: empty string");if(_=_||10,_<2||36<_)throw Error("radix out of range: "+_);if(A.charAt(0)=="-")return F(h(A.substring(1),_));if(A.indexOf("-")>=0)throw Error('number format error: interior "-" character');let D=l(Math.pow(_,8)),v=d;for(let P=0;P<A.length;P+=8){var T=Math.min(8,A.length-P);let w=parseInt(A.substring(P,P+T),_);T<8?(T=l(Math.pow(_,T)),v=v.j(T).add(l(w))):(v=v.j(D),v=v.add(l(w)))}return v}var d=c(0),p=c(1),E=c(16777216);r=a.prototype,r.m=function(){if(S(this))return-F(this).m();let A=0,_=1;for(let D=0;D<this.g.length;D++){let v=this.i(D);A+=(v>=0?v:4294967296+v)*_,_*=4294967296}return A},r.toString=function(A){if(A=A||10,A<2||36<A)throw Error("radix out of range: "+A);if(y(this))return"0";if(S(this))return"-"+F(this).toString(A);let _=l(Math.pow(A,6));var D=this;let v="";for(;;){let T=me(D,_).g;D=U(D,T.j(_));let P=((D.g.length>0?D.g[0]:D.h)>>>0).toString(A);if(D=T,y(D))return P+v;for(;P.length<6;)P="0"+P;v=P+v}},r.i=function(A){return A<0?0:A<this.g.length?this.g[A]:this.h};function y(A){if(A.h!=0)return!1;for(let _=0;_<A.g.length;_++)if(A.g[_]!=0)return!1;return!0}function S(A){return A.h==-1}r.l=function(A){return A=U(this,A),S(A)?-1:y(A)?0:1};function F(A){let _=A.g.length,D=[];for(let v=0;v<_;v++)D[v]=~A.g[v];return new a(D,~A.h).add(p)}r.abs=function(){return S(this)?F(this):this},r.add=function(A){let _=Math.max(this.g.length,A.g.length),D=[],v=0;for(let T=0;T<=_;T++){let P=v+(this.i(T)&65535)+(A.i(T)&65535),w=(P>>>16)+(this.i(T)>>>16)+(A.i(T)>>>16);v=w>>>16,P&=65535,w&=65535,D[T]=w<<16|P}return new a(D,D[D.length-1]&-2147483648?-1:0)};function U(A,_){return A.add(F(_))}r.j=function(A){if(y(this)||y(A))return d;if(S(this))return S(A)?F(this).j(F(A)):F(F(this).j(A));if(S(A))return F(this.j(F(A)));if(this.l(E)<0&&A.l(E)<0)return l(this.m()*A.m());let _=this.g.length+A.g.length,D=[];for(var v=0;v<2*_;v++)D[v]=0;for(v=0;v<this.g.length;v++)for(let T=0;T<A.g.length;T++){let P=this.i(v)>>>16,w=this.i(v)&65535,ot=A.i(T)>>>16,nr=A.i(T)&65535;D[2*v+2*T]+=w*nr,z(D,2*v+2*T),D[2*v+2*T+1]+=P*nr,z(D,2*v+2*T+1),D[2*v+2*T+1]+=w*ot,z(D,2*v+2*T+1),D[2*v+2*T+2]+=P*ot,z(D,2*v+2*T+2)}for(A=0;A<_;A++)D[A]=D[2*A+1]<<16|D[2*A];for(A=_;A<2*_;A++)D[A]=0;return new a(D,0)};function z(A,_){for(;(A[_]&65535)!=A[_];)A[_+1]+=A[_]>>>16,A[_]&=65535,_++}function re(A,_){this.g=A,this.h=_}function me(A,_){if(y(_))throw Error("division by zero");if(y(A))return new re(d,d);if(S(A))return _=me(F(A),_),new re(F(_.g),F(_.h));if(S(_))return _=me(A,F(_)),new re(F(_.g),_.h);if(A.g.length>30){if(S(A)||S(_))throw Error("slowDivide_ only works with positive integers.");for(var D=p,v=_;v.l(A)<=0;)D=ye(D),v=ye(v);var T=Ee(D,1),P=Ee(v,1);for(v=Ee(v,2),D=Ee(D,2);!y(v);){var w=P.add(v);w.l(A)<=0&&(T=T.add(D),P=w),v=Ee(v,1),D=Ee(D,1)}return _=U(A,T.j(_)),new re(T,_)}for(T=d;A.l(_)>=0;){for(D=Math.max(1,Math.floor(A.m()/_.m())),v=Math.ceil(Math.log(D)/Math.LN2),v=v<=48?1:Math.pow(2,v-48),P=l(D),w=P.j(_);S(w)||w.l(A)>0;)D-=v,P=l(D),w=P.j(_);y(P)&&(P=p),T=T.add(P),A=U(A,w)}return new re(T,A)}r.B=function(A){return me(this,A).h},r.and=function(A){let _=Math.max(this.g.length,A.g.length),D=[];for(let v=0;v<_;v++)D[v]=this.i(v)&A.i(v);return new a(D,this.h&A.h)},r.or=function(A){let _=Math.max(this.g.length,A.g.length),D=[];for(let v=0;v<_;v++)D[v]=this.i(v)|A.i(v);return new a(D,this.h|A.h)},r.xor=function(A){let _=Math.max(this.g.length,A.g.length),D=[];for(let v=0;v<_;v++)D[v]=this.i(v)^A.i(v);return new a(D,this.h^A.h)};function ye(A){let _=A.g.length+1,D=[];for(let v=0;v<_;v++)D[v]=A.i(v)<<1|A.i(v-1)>>>31;return new a(D,A.h)}function Ee(A,_){let D=_>>5;_%=32;let v=A.g.length-D,T=[];for(let P=0;P<v;P++)T[P]=_>0?A.i(P+D)>>>_|A.i(P+D+1)<<32-_:A.i(P+D);return new a(T,A.h)}n.prototype.digest=n.prototype.A,n.prototype.reset=n.prototype.u,n.prototype.update=n.prototype.v,Wl=bg.Md5=n,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.B,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=l,a.fromString=h,Bn=bg.Integer=a}).apply(typeof Ag<"u"?Ag:typeof self<"u"?self:typeof window<"u"?window:{});function Ge(r,e,t,n){if(t==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?r!==e||!n:!e.has(r))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?n:t==="a"?n.call(r):n?n.value:e.get(r)}var Ho=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},hn={};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Ql,nT,is,$l,Gi,qo,Yl,Xl,Zl;(function(){var r,e=Object.defineProperty;function t(o){o=[typeof globalThis=="object"&&globalThis,o,typeof window=="object"&&window,typeof self=="object"&&self,typeof Ho=="object"&&Ho];for(var B=0;B<o.length;++B){var f=o[B];if(f&&f.Math==Math)return f}throw Error("Cannot find global object")}var n=t(this);function s(o,B){if(B)e:{var f=n;o=o.split(".");for(var C=0;C<o.length-1;C++){var R=o[C];if(!(R in f))break e;f=f[R]}o=o[o.length-1],C=f[o],B=B(C),B!=C&&B!=null&&e(f,o,{configurable:!0,writable:!0,value:B})}}s("Symbol.dispose",function(o){return o||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(o){return o||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(o){return o||function(B){var f=[],C;for(C in B)Object.prototype.hasOwnProperty.call(B,C)&&f.push([C,B[C]]);return f}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},a=this||self;function u(o){var B=typeof o;return B=="object"&&o!=null||B=="function"}function c(o,B,f){return o.call.apply(o.bind,arguments)}function l(o,B,f){return l=c,l.apply(null,arguments)}function h(o,B){var f=Array.prototype.slice.call(arguments,1);return function(){var C=f.slice();return C.push.apply(C,arguments),o.apply(this,C)}}function d(o,B){function f(){}f.prototype=B.prototype,o.Z=B.prototype,o.prototype=new f,o.prototype.constructor=o,o.Ob=function(C,R,N){for(var j=Array(arguments.length-2),se=2;se<arguments.length;se++)j[se-2]=arguments[se];return B.prototype[R].apply(C,j)}}var p=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?o=>o&&AsyncContext.Snapshot.wrap(o):o=>o;function E(o){let B=o.length;if(B>0){let f=Array(B);for(let C=0;C<B;C++)f[C]=o[C];return f}return[]}function y(o,B){for(let C=1;C<arguments.length;C++){let R=arguments[C];var f=typeof R;if(f=f!="object"?f:R?Array.isArray(R)?"array":f:"null",f=="array"||f=="object"&&typeof R.length=="number"){f=o.length||0;let N=R.length||0;o.length=f+N;for(let j=0;j<N;j++)o[f+j]=R[j]}else o.push(R)}}class S{constructor(B,f){this.i=B,this.j=f,this.h=0,this.g=null}get(){let B;return this.h>0?(this.h--,B=this.g,this.g=B.next,B.next=null):B=this.i(),B}}function F(o){a.setTimeout(()=>{throw o},0)}function U(){var o=A;let B=null;return o.g&&(B=o.g,o.g=o.g.next,o.g||(o.h=null),B.next=null),B}class z{constructor(){this.h=this.g=null}add(B,f){let C=re.get();C.set(B,f),this.h?this.h.next=C:this.g=C,this.h=C}}var re=new S(()=>new me,o=>o.reset());class me{constructor(){this.next=this.g=this.h=null}set(B,f){this.h=B,this.g=f,this.next=null}reset(){this.next=this.g=this.h=null}}let ye,Ee=!1,A=new z,_=()=>{let o=Promise.resolve(void 0);ye=()=>{o.then(D)}};function D(){for(var o;o=U();){try{o.h.call(o.g)}catch(f){F(f)}var B=re;B.j(o),B.h<100&&(B.h++,o.next=B.g,B.g=o)}Ee=!1}function v(){this.u=this.u,this.C=this.C}v.prototype.u=!1,v.prototype.dispose=function(){this.u||(this.u=!0,this.N())},v.prototype[Symbol.dispose]=function(){this.dispose()},v.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function T(o,B){this.type=o,this.g=this.target=B,this.defaultPrevented=!1}T.prototype.h=function(){this.defaultPrevented=!0};var P=(function(){if(!a.addEventListener||!Object.defineProperty)return!1;var o=!1,B=Object.defineProperty({},"passive",{get:function(){o=!0}});try{let f=()=>{};a.addEventListener("test",f,B),a.removeEventListener("test",f,B)}catch{}return o})();function w(o){return/^[\s\xa0]*$/.test(o)}function ot(o,B){T.call(this,o?o.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,o&&this.init(o,B)}d(ot,T),ot.prototype.init=function(o,B){let f=this.type=o.type,C=o.changedTouches&&o.changedTouches.length?o.changedTouches[0]:null;this.target=o.target||o.srcElement,this.g=B,B=o.relatedTarget,B||(f=="mouseover"?B=o.fromElement:f=="mouseout"&&(B=o.toElement)),this.relatedTarget=B,C?(this.clientX=C.clientX!==void 0?C.clientX:C.pageX,this.clientY=C.clientY!==void 0?C.clientY:C.pageY,this.screenX=C.screenX||0,this.screenY=C.screenY||0):(this.clientX=o.clientX!==void 0?o.clientX:o.pageX,this.clientY=o.clientY!==void 0?o.clientY:o.pageY,this.screenX=o.screenX||0,this.screenY=o.screenY||0),this.button=o.button,this.key=o.key||"",this.ctrlKey=o.ctrlKey,this.altKey=o.altKey,this.shiftKey=o.shiftKey,this.metaKey=o.metaKey,this.pointerId=o.pointerId||0,this.pointerType=o.pointerType,this.state=o.state,this.i=o,o.defaultPrevented&&ot.Z.h.call(this)},ot.prototype.h=function(){ot.Z.h.call(this);let o=this.i;o.preventDefault?o.preventDefault():o.returnValue=!1};var nr="closure_listenable_"+(Math.random()*1e6|0),hy=0;function fy(o,B,f,C,R){this.listener=o,this.proxy=null,this.src=B,this.type=f,this.capture=!!C,this.ha=R,this.key=++hy,this.da=this.fa=!1}function Va(o){o.da=!0,o.listener=null,o.proxy=null,o.src=null,o.ha=null}function Ma(o,B,f){for(let C in o)B.call(f,o[C],C,o)}function dy(o,B){for(let f in o)B.call(void 0,o[f],f,o)}function Kd(o){let B={};for(let f in o)B[f]=o[f];return B}let Jd="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function zd(o,B){let f,C;for(let R=1;R<arguments.length;R++){C=arguments[R];for(f in C)o[f]=C[f];for(let N=0;N<Jd.length;N++)f=Jd[N],Object.prototype.hasOwnProperty.call(C,f)&&(o[f]=C[f])}}function Ga(o){this.src=o,this.g={},this.h=0}Ga.prototype.add=function(o,B,f,C,R){let N=o.toString();o=this.g[N],o||(o=this.g[N]=[],this.h++);let j=wc(o,B,C,R);return j>-1?(B=o[j],f||(B.fa=!1)):(B=new fy(B,this.src,N,!!C,R),B.fa=f,o.push(B)),B};function yc(o,B){let f=B.type;if(f in o.g){var C=o.g[f],R=Array.prototype.indexOf.call(C,B,void 0),N;(N=R>=0)&&Array.prototype.splice.call(C,R,1),N&&(Va(B),o.g[f].length==0&&(delete o.g[f],o.h--))}}function wc(o,B,f,C){for(let R=0;R<o.length;++R){let N=o[R];if(!N.da&&N.listener==B&&N.capture==!!f&&N.ha==C)return R}return-1}var Dc="closure_lm_"+(Math.random()*1e6|0),Ic={};function Wd(o,B,f,C,R){if(Array.isArray(B)){for(let N=0;N<B.length;N++)Wd(o,B[N],f,C,R);return null}return f=Yd(f),o&&o[nr]?o.J(B,f,u(C)?!!C.capture:!1,R):py(o,B,f,!1,C,R)}function py(o,B,f,C,R,N){if(!B)throw Error("Invalid event type");let j=u(R)?!!R.capture:!!R,se=Ac(o);if(se||(o[Dc]=se=new Ga(o)),f=se.add(B,f,C,j,N),f.proxy)return f;if(C=Cy(),f.proxy=C,C.src=o,C.listener=f,o.addEventListener)P||(R=j),R===void 0&&(R=!1),o.addEventListener(B.toString(),C,R);else if(o.attachEvent)o.attachEvent($d(B.toString()),C);else if(o.addListener&&o.removeListener)o.addListener(C);else throw Error("addEventListener and attachEvent are unavailable.");return f}function Cy(){function o(f){return B.call(o.src,o.listener,f)}let B=gy;return o}function Qd(o,B,f,C,R){if(Array.isArray(B))for(var N=0;N<B.length;N++)Qd(o,B[N],f,C,R);else C=u(C)?!!C.capture:!!C,f=Yd(f),o&&o[nr]?(o=o.i,N=String(B).toString(),N in o.g&&(B=o.g[N],f=wc(B,f,C,R),f>-1&&(Va(B[f]),Array.prototype.splice.call(B,f,1),B.length==0&&(delete o.g[N],o.h--)))):o&&(o=Ac(o))&&(B=o.g[B.toString()],o=-1,B&&(o=wc(B,f,C,R)),(f=o>-1?B[o]:null)&&Tc(f))}function Tc(o){if(typeof o!="number"&&o&&!o.da){var B=o.src;if(B&&B[nr])yc(B.i,o);else{var f=o.type,C=o.proxy;B.removeEventListener?B.removeEventListener(f,C,o.capture):B.detachEvent?B.detachEvent($d(f),C):B.addListener&&B.removeListener&&B.removeListener(C),(f=Ac(B))?(yc(f,o),f.h==0&&(f.src=null,B[Dc]=null)):Va(o)}}}function $d(o){return o in Ic?Ic[o]:Ic[o]="on"+o}function gy(o,B){if(o.da)o=!0;else{B=new ot(B,this);let f=o.listener,C=o.ha||o.src;o.fa&&Tc(o),o=f.call(C,B)}return o}function Ac(o){return o=o[Dc],o instanceof Ga?o:null}var bc="__closure_events_fn_"+(Math.random()*1e9>>>0);function Yd(o){return typeof o=="function"?o:(o[bc]||(o[bc]=function(B){return o.handleEvent(B)}),o[bc])}function Xe(){v.call(this),this.i=new Ga(this),this.M=this,this.G=null}d(Xe,v),Xe.prototype[nr]=!0,Xe.prototype.removeEventListener=function(o,B,f,C){Qd(this,o,B,f,C)};function nt(o,B){var f,C=o.G;if(C)for(f=[];C;C=C.G)f.push(C);if(o=o.M,C=B.type||B,typeof B=="string")B=new T(B,o);else if(B instanceof T)B.target=B.target||o;else{var R=B;B=new T(C,o),zd(B,R)}R=!0;let N,j;if(f)for(j=f.length-1;j>=0;j--)N=B.g=f[j],R=Ua(N,C,!0,B)&&R;if(N=B.g=o,R=Ua(N,C,!0,B)&&R,R=Ua(N,C,!1,B)&&R,f)for(j=0;j<f.length;j++)N=B.g=f[j],R=Ua(N,C,!1,B)&&R}Xe.prototype.N=function(){if(Xe.Z.N.call(this),this.i){var o=this.i;for(let B in o.g){let f=o.g[B];for(let C=0;C<f.length;C++)Va(f[C]);delete o.g[B],o.h--}}this.G=null},Xe.prototype.J=function(o,B,f,C){return this.i.add(String(o),B,!1,f,C)},Xe.prototype.K=function(o,B,f,C){return this.i.add(String(o),B,!0,f,C)};function Ua(o,B,f,C){if(B=o.i.g[String(B)],!B)return!0;B=B.concat();let R=!0;for(let N=0;N<B.length;++N){let j=B[N];if(j&&!j.da&&j.capture==f){let se=j.listener,xe=j.ha||j.src;j.fa&&yc(o.i,j),R=se.call(xe,C)!==!1&&R}}return R&&!C.defaultPrevented}function my(o,B){if(typeof o!="function")if(o&&typeof o.handleEvent=="function")o=l(o.handleEvent,o);else throw Error("Invalid listener argument");return Number(B)>2147483647?-1:a.setTimeout(o,B||0)}function Xd(o){o.g=my(()=>{o.g=null,o.i&&(o.i=!1,Xd(o))},o.l);let B=o.h;o.h=null,o.m.apply(null,B)}class Ey extends v{constructor(B,f){super(),this.m=B,this.l=f,this.h=null,this.i=!1,this.g=null}j(B){this.h=arguments,this.g?this.i=!0:Xd(this)}N(){super.N(),this.g&&(a.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Zs(o){v.call(this),this.h=o,this.g={}}d(Zs,v);var Zd=[];function ep(o){Ma(o.g,function(B,f){this.g.hasOwnProperty(f)&&Tc(B)},o),o.g={}}Zs.prototype.N=function(){Zs.Z.N.call(this),ep(this)},Zs.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var vc=a.JSON.stringify,_y=a.JSON.parse,yy=class{stringify(o){return a.JSON.stringify(o,void 0)}parse(o){return a.JSON.parse(o,void 0)}};function tp(){}function np(){}var ei={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Rc(){T.call(this,"d")}d(Rc,T);function Sc(){T.call(this,"c")}d(Sc,T);var rr={},rp=null;function Ha(){return rp=rp||new Xe}rr.Ia="serverreachability";function sp(o){T.call(this,rr.Ia,o)}d(sp,T);function ti(o){let B=Ha();nt(B,new sp(B))}rr.STAT_EVENT="statevent";function ip(o,B){T.call(this,rr.STAT_EVENT,o),this.stat=B}d(ip,T);function rt(o){let B=Ha();nt(B,new ip(B,o))}rr.Ja="timingevent";function ap(o,B){T.call(this,rr.Ja,o),this.size=B}d(ap,T);function ni(o,B){if(typeof o!="function")throw Error("Fn must not be null and must be a function");return a.setTimeout(function(){o()},B)}function ri(){this.g=!0}ri.prototype.ua=function(){this.g=!1};function wy(o,B,f,C,R,N){o.info(function(){if(o.g)if(N){var j="",se=N.split("&");for(let de=0;de<se.length;de++){var xe=se[de].split("=");if(xe.length>1){let Ve=xe[0];xe=xe[1];let Mt=Ve.split("_");j=Mt.length>=2&&Mt[1]=="type"?j+(Ve+"="+xe+"&"):j+(Ve+"=redacted&")}}}else j=null;else j=N;return"XMLHTTP REQ ("+C+") [attempt "+R+"]: "+B+`
`+f+`
`+j})}function Dy(o,B,f,C,R,N,j){o.info(function(){return"XMLHTTP RESP ("+C+") [ attempt "+R+"]: "+B+`
`+f+`
`+N+" "+j})}function Qr(o,B,f,C){o.info(function(){return"XMLHTTP TEXT ("+B+"): "+Ty(o,f)+(C?" "+C:"")})}function Iy(o,B){o.info(function(){return"TIMEOUT: "+B})}ri.prototype.info=function(){};function Ty(o,B){if(!o.g)return B;if(!B)return null;try{let N=JSON.parse(B);if(N){for(o=0;o<N.length;o++)if(Array.isArray(N[o])){var f=N[o];if(!(f.length<2)){var C=f[1];if(Array.isArray(C)&&!(C.length<1)){var R=C[0];if(R!="noop"&&R!="stop"&&R!="close")for(let j=1;j<C.length;j++)C[j]=""}}}}return vc(N)}catch{return B}}var qa={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},op={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},up;function Pc(){}d(Pc,tp),Pc.prototype.g=function(){return new XMLHttpRequest},up=new Pc;function si(o){return encodeURIComponent(String(o))}function Ay(o){var B=1;o=o.split(":");let f=[];for(;B>0&&o.length;)f.push(o.shift()),B--;return o.length&&f.push(o.join(":")),f}function Tn(o,B,f,C){this.j=o,this.i=B,this.l=f,this.S=C||1,this.V=new Zs(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new cp}function cp(){this.i=null,this.g="",this.h=!1}var lp={},Nc={};function Oc(o,B,f){o.M=1,o.A=Ka(Vt(B)),o.u=f,o.R=!0,Bp(o,null)}function Bp(o,B){o.F=Date.now(),ja(o),o.B=Vt(o.A);var f=o.B,C=o.S;Array.isArray(C)||(C=[String(C)]),Ip(f.i,"t",C),o.C=0,f=o.j.L,o.h=new cp,o.g=Hp(o.j,f?B:null,!o.u),o.P>0&&(o.O=new Ey(l(o.Y,o,o.g),o.P)),B=o.V,f=o.g,C=o.ba;var R="readystatechange";Array.isArray(R)||(R&&(Zd[0]=R.toString()),R=Zd);for(let N=0;N<R.length;N++){let j=Wd(f,R[N],C||B.handleEvent,!1,B.h||B);if(!j)break;B.g[j.key]=j}B=o.J?Kd(o.J):{},o.u?(o.v||(o.v="POST"),B["Content-Type"]="application/x-www-form-urlencoded",o.g.ea(o.B,o.v,o.u,B)):(o.v="GET",o.g.ea(o.B,o.v,null,B)),ti(),wy(o.i,o.v,o.B,o.l,o.S,o.u)}Tn.prototype.ba=function(o){o=o.target;let B=this.O;B&&vn(o)==3?B.j():this.Y(o)},Tn.prototype.Y=function(o){try{if(o==this.g)e:{let se=vn(this.g),xe=this.g.ya(),de=this.g.ca();if(!(se<3)&&(se!=3||this.g&&(this.h.h||this.g.la()||Pp(this.g)))){this.K||se!=4||xe==7||(xe==8||de<=0?ti(3):ti(2)),xc(this);var B=this.g.ca();this.X=B;var f=by(this);if(this.o=B==200,Dy(this.i,this.v,this.B,this.l,this.S,se,B),this.o){if(this.U&&!this.L){t:{if(this.g){var C,R=this.g;if((C=R.g?R.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!w(C)){var N=C;break t}}N=null}if(o=N)Qr(this.i,this.l,o,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Fc(this,o);else{this.o=!1,this.m=3,rt(12),sr(this),ii(this);break e}}if(this.R){o=!0;let Ve;for(;!this.K&&this.C<f.length;)if(Ve=vy(this,f),Ve==Nc){se==4&&(this.m=4,rt(14),o=!1),Qr(this.i,this.l,null,"[Incomplete Response]");break}else if(Ve==lp){this.m=4,rt(15),Qr(this.i,this.l,f,"[Invalid Chunk]"),o=!1;break}else Qr(this.i,this.l,Ve,null),Fc(this,Ve);if(hp(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),se!=4||f.length!=0||this.h.h||(this.m=1,rt(16),o=!1),this.o=this.o&&o,!o)Qr(this.i,this.l,f,"[Invalid Chunked Response]"),sr(this),ii(this);else if(f.length>0&&!this.W){this.W=!0;var j=this.j;j.g==this&&j.aa&&!j.P&&(j.j.info("Great, no buffering proxy detected. Bytes received: "+f.length),Hc(j),j.P=!0,rt(11))}}else Qr(this.i,this.l,f,null),Fc(this,f);se==4&&sr(this),this.o&&!this.K&&(se==4?Vp(this.j,this):(this.o=!1,ja(this)))}else Hy(this.g),B==400&&f.indexOf("Unknown SID")>0?(this.m=3,rt(12)):(this.m=0,rt(13)),sr(this),ii(this)}}}catch{}finally{}};function by(o){if(!hp(o))return o.g.la();let B=Pp(o.g);if(B==="")return"";let f="",C=B.length,R=vn(o.g)==4;if(!o.h.i){if(typeof TextDecoder>"u")return sr(o),ii(o),"";o.h.i=new a.TextDecoder}for(let N=0;N<C;N++)o.h.h=!0,f+=o.h.i.decode(B[N],{stream:!(R&&N==C-1)});return B.length=0,o.h.g+=f,o.C=0,o.h.g}function hp(o){return o.g?o.v=="GET"&&o.M!=2&&o.j.Aa:!1}function vy(o,B){var f=o.C,C=B.indexOf(`
`,f);return C==-1?Nc:(f=Number(B.substring(f,C)),isNaN(f)?lp:(C+=1,C+f>B.length?Nc:(B=B.slice(C,C+f),o.C=C+f,B)))}Tn.prototype.cancel=function(){this.K=!0,sr(this)};function ja(o){o.T=Date.now()+o.H,fp(o,o.H)}function fp(o,B){if(o.D!=null)throw Error("WatchDog timer not null");o.D=ni(l(o.aa,o),B)}function xc(o){o.D&&(a.clearTimeout(o.D),o.D=null)}Tn.prototype.aa=function(){this.D=null;let o=Date.now();o-this.T>=0?(Iy(this.i,this.B),this.M!=2&&(ti(),rt(17)),sr(this),this.m=2,ii(this)):fp(this,this.T-o)};function ii(o){o.j.I==0||o.K||Vp(o.j,o)}function sr(o){xc(o);var B=o.O;B&&typeof B.dispose=="function"&&B.dispose(),o.O=null,ep(o.V),o.g&&(B=o.g,o.g=null,B.abort(),B.dispose())}function Fc(o,B){try{var f=o.j;if(f.I!=0&&(f.g==o||Lc(f.h,o))){if(!o.L&&Lc(f.h,o)&&f.I==3){try{var C=f.Ba.g.parse(B)}catch{C=null}if(Array.isArray(C)&&C.length==3){var R=C;if(R[0]==0){e:if(!f.v){if(f.g)if(f.g.F+3e3<o.F)Ya(f),Qa(f);else break e;Uc(f),rt(18)}}else f.xa=R[1],0<f.xa-f.K&&R[2]<37500&&f.F&&f.A==0&&!f.C&&(f.C=ni(l(f.Va,f),6e3));Cp(f.h)<=1&&f.ta&&(f.ta=void 0)}else ar(f,11)}else if((o.L||f.g==o)&&Ya(f),!w(B))for(R=f.Ba.g.parse(B),B=0;B<R.length;B++){let de=R[B],Ve=de[0];if(!(Ve<=f.K))if(f.K=Ve,de=de[1],f.I==2)if(de[0]=="c"){f.M=de[1],f.ba=de[2];let Mt=de[3];Mt!=null&&(f.ka=Mt,f.j.info("VER="+f.ka));let or=de[4];or!=null&&(f.za=or,f.j.info("SVER="+f.za));let Rn=de[5];Rn!=null&&typeof Rn=="number"&&Rn>0&&(C=1.5*Rn,f.O=C,f.j.info("backChannelRequestTimeoutMs_="+C)),C=f;let Sn=o.g;if(Sn){let Za=Sn.g?Sn.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Za){var N=C.h;N.g||Za.indexOf("spdy")==-1&&Za.indexOf("quic")==-1&&Za.indexOf("h2")==-1||(N.j=N.l,N.g=new Set,N.h&&(kc(N,N.h),N.h=null))}if(C.G){let qc=Sn.g?Sn.g.getResponseHeader("X-HTTP-Session-Id"):null;qc&&(C.wa=qc,_e(C.J,C.G,qc))}}f.I=3,f.l&&f.l.ra(),f.aa&&(f.T=Date.now()-o.F,f.j.info("Handshake RTT: "+f.T+"ms")),C=f;var j=o;if(C.na=Up(C,C.L?C.ba:null,C.W),j.L){gp(C.h,j);var se=j,xe=C.O;xe&&(se.H=xe),se.D&&(xc(se),ja(se)),C.g=j}else Lp(C);f.i.length>0&&$a(f)}else de[0]!="stop"&&de[0]!="close"||ar(f,7);else f.I==3&&(de[0]=="stop"||de[0]=="close"?de[0]=="stop"?ar(f,7):Gc(f):de[0]!="noop"&&f.l&&f.l.qa(de),f.A=0)}}ti(4)}catch{}}var Ry=class{constructor(o,B){this.g=o,this.map=B}};function dp(o){this.l=o||10,a.PerformanceNavigationTiming?(o=a.performance.getEntriesByType("navigation"),o=o.length>0&&(o[0].nextHopProtocol=="hq"||o[0].nextHopProtocol=="h2")):o=!!(a.chrome&&a.chrome.loadTimes&&a.chrome.loadTimes()&&a.chrome.loadTimes().wasFetchedViaSpdy),this.j=o?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function pp(o){return o.h?!0:o.g?o.g.size>=o.j:!1}function Cp(o){return o.h?1:o.g?o.g.size:0}function Lc(o,B){return o.h?o.h==B:o.g?o.g.has(B):!1}function kc(o,B){o.g?o.g.add(B):o.h=B}function gp(o,B){o.h&&o.h==B?o.h=null:o.g&&o.g.has(B)&&o.g.delete(B)}dp.prototype.cancel=function(){if(this.i=mp(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(let o of this.g.values())o.cancel();this.g.clear()}};function mp(o){if(o.h!=null)return o.i.concat(o.h.G);if(o.g!=null&&o.g.size!==0){let B=o.i;for(let f of o.g.values())B=B.concat(f.G);return B}return E(o.i)}var Ep=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Sy(o,B){if(o){o=o.split("&");for(let f=0;f<o.length;f++){let C=o[f].indexOf("="),R,N=null;C>=0?(R=o[f].substring(0,C),N=o[f].substring(C+1)):R=o[f],B(R,N?decodeURIComponent(N.replace(/\+/g," ")):"")}}}function An(o){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let B;o instanceof An?(this.l=o.l,ai(this,o.j),this.o=o.o,this.g=o.g,oi(this,o.u),this.h=o.h,Vc(this,Tp(o.i)),this.m=o.m):o&&(B=String(o).match(Ep))?(this.l=!1,ai(this,B[1]||"",!0),this.o=ui(B[2]||""),this.g=ui(B[3]||"",!0),oi(this,B[4]),this.h=ui(B[5]||"",!0),Vc(this,B[6]||"",!0),this.m=ui(B[7]||"")):(this.l=!1,this.i=new li(null,this.l))}An.prototype.toString=function(){let o=[];var B=this.j;B&&o.push(ci(B,_p,!0),":");var f=this.g;return(f||B=="file")&&(o.push("//"),(B=this.o)&&o.push(ci(B,_p,!0),"@"),o.push(si(f).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),f=this.u,f!=null&&o.push(":",String(f))),(f=this.h)&&(this.g&&f.charAt(0)!="/"&&o.push("/"),o.push(ci(f,f.charAt(0)=="/"?Oy:Ny,!0))),(f=this.i.toString())&&o.push("?",f),(f=this.m)&&o.push("#",ci(f,Fy)),o.join("")},An.prototype.resolve=function(o){let B=Vt(this),f=!!o.j;f?ai(B,o.j):f=!!o.o,f?B.o=o.o:f=!!o.g,f?B.g=o.g:f=o.u!=null;var C=o.h;if(f)oi(B,o.u);else if(f=!!o.h){if(C.charAt(0)!="/")if(this.g&&!this.h)C="/"+C;else{var R=B.h.lastIndexOf("/");R!=-1&&(C=B.h.slice(0,R+1)+C)}if(R=C,R==".."||R==".")C="";else if(R.indexOf("./")!=-1||R.indexOf("/.")!=-1){C=R.lastIndexOf("/",0)==0,R=R.split("/");let N=[];for(let j=0;j<R.length;){let se=R[j++];se=="."?C&&j==R.length&&N.push(""):se==".."?((N.length>1||N.length==1&&N[0]!="")&&N.pop(),C&&j==R.length&&N.push("")):(N.push(se),C=!0)}C=N.join("/")}else C=R}return f?B.h=C:f=o.i.toString()!=="",f?Vc(B,Tp(o.i)):f=!!o.m,f&&(B.m=o.m),B};function Vt(o){return new An(o)}function ai(o,B,f){o.j=f?ui(B,!0):B,o.j&&(o.j=o.j.replace(/:$/,""))}function oi(o,B){if(B){if(B=Number(B),isNaN(B)||B<0)throw Error("Bad port number "+B);o.u=B}else o.u=null}function Vc(o,B,f){B instanceof li?(o.i=B,Ly(o.i,o.l)):(f||(B=ci(B,xy)),o.i=new li(B,o.l))}function _e(o,B,f){o.i.set(B,f)}function Ka(o){return _e(o,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),o}function ui(o,B){return o?B?decodeURI(o.replace(/%25/g,"%2525")):decodeURIComponent(o):""}function ci(o,B,f){return typeof o=="string"?(o=encodeURI(o).replace(B,Py),f&&(o=o.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),o):null}function Py(o){return o=o.charCodeAt(0),"%"+(o>>4&15).toString(16)+(o&15).toString(16)}var _p=/[#\/\?@]/g,Ny=/[#\?:]/g,Oy=/[#\?]/g,xy=/[#\?@]/g,Fy=/#/g;function li(o,B){this.h=this.g=null,this.i=o||null,this.j=!!B}function ir(o){o.g||(o.g=new Map,o.h=0,o.i&&Sy(o.i,function(B,f){o.add(decodeURIComponent(B.replace(/\+/g," ")),f)}))}r=li.prototype,r.add=function(o,B){ir(this),this.i=null,o=$r(this,o);let f=this.g.get(o);return f||this.g.set(o,f=[]),f.push(B),this.h+=1,this};function yp(o,B){ir(o),B=$r(o,B),o.g.has(B)&&(o.i=null,o.h-=o.g.get(B).length,o.g.delete(B))}function wp(o,B){return ir(o),B=$r(o,B),o.g.has(B)}r.forEach=function(o,B){ir(this),this.g.forEach(function(f,C){f.forEach(function(R){o.call(B,R,C,this)},this)},this)};function Dp(o,B){ir(o);let f=[];if(typeof B=="string")wp(o,B)&&(f=f.concat(o.g.get($r(o,B))));else for(o=Array.from(o.g.values()),B=0;B<o.length;B++)f=f.concat(o[B]);return f}r.set=function(o,B){return ir(this),this.i=null,o=$r(this,o),wp(this,o)&&(this.h-=this.g.get(o).length),this.g.set(o,[B]),this.h+=1,this},r.get=function(o,B){return o?(o=Dp(this,o),o.length>0?String(o[0]):B):B};function Ip(o,B,f){yp(o,B),f.length>0&&(o.i=null,o.g.set($r(o,B),E(f)),o.h+=f.length)}r.toString=function(){if(this.i)return this.i;if(!this.g)return"";let o=[],B=Array.from(this.g.keys());for(let C=0;C<B.length;C++){var f=B[C];let R=si(f);f=Dp(this,f);for(let N=0;N<f.length;N++){let j=R;f[N]!==""&&(j+="="+si(f[N])),o.push(j)}}return this.i=o.join("&")};function Tp(o){let B=new li;return B.i=o.i,o.g&&(B.g=new Map(o.g),B.h=o.h),B}function $r(o,B){return B=String(B),o.j&&(B=B.toLowerCase()),B}function Ly(o,B){B&&!o.j&&(ir(o),o.i=null,o.g.forEach(function(f,C){let R=C.toLowerCase();C!=R&&(yp(this,C),Ip(this,R,f))},o)),o.j=B}function ky(o,B){let f=new ri;if(a.Image){let C=new Image;C.onload=h(bn,f,"TestLoadImage: loaded",!0,B,C),C.onerror=h(bn,f,"TestLoadImage: error",!1,B,C),C.onabort=h(bn,f,"TestLoadImage: abort",!1,B,C),C.ontimeout=h(bn,f,"TestLoadImage: timeout",!1,B,C),a.setTimeout(function(){C.ontimeout&&C.ontimeout()},1e4),C.src=o}else B(!1)}function Vy(o,B){let f=new ri,C=new AbortController,R=setTimeout(()=>{C.abort(),bn(f,"TestPingServer: timeout",!1,B)},1e4);fetch(o,{signal:C.signal}).then(N=>{clearTimeout(R),N.ok?bn(f,"TestPingServer: ok",!0,B):bn(f,"TestPingServer: server error",!1,B)}).catch(()=>{clearTimeout(R),bn(f,"TestPingServer: error",!1,B)})}function bn(o,B,f,C,R){try{R&&(R.onload=null,R.onerror=null,R.onabort=null,R.ontimeout=null),C(f)}catch{}}function My(){this.g=new yy}function Ja(o){this.i=o.Sb||null,this.h=o.ab||!1}d(Ja,tp),Ja.prototype.g=function(){return new za(this.i,this.h)};function za(o,B){Xe.call(this),this.H=o,this.o=B,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}d(za,Xe),r=za.prototype,r.open=function(o,B){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=o,this.D=B,this.readyState=1,hi(this)},r.send=function(o){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;let B={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};o&&(B.body=o),(this.H||a).fetch(new Request(this.D,B)).then(this.Pa.bind(this),this.ga.bind(this))},r.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,Bi(this)),this.readyState=0},r.Pa=function(o){if(this.g&&(this.l=o,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=o.headers,this.readyState=2,hi(this)),this.g&&(this.readyState=3,hi(this),this.g)))if(this.responseType==="arraybuffer")o.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof a.ReadableStream<"u"&&"body"in o){if(this.j=o.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Ap(this)}else o.text().then(this.Oa.bind(this),this.ga.bind(this))};function Ap(o){o.j.read().then(o.Ma.bind(o)).catch(o.ga.bind(o))}r.Ma=function(o){if(this.g){if(this.o&&o.value)this.response.push(o.value);else if(!this.o){var B=o.value?o.value:new Uint8Array(0);(B=this.B.decode(B,{stream:!o.done}))&&(this.response=this.responseText+=B)}o.done?Bi(this):hi(this),this.readyState==3&&Ap(this)}},r.Oa=function(o){this.g&&(this.response=this.responseText=o,Bi(this))},r.Na=function(o){this.g&&(this.response=o,Bi(this))},r.ga=function(){this.g&&Bi(this)};function Bi(o){o.readyState=4,o.l=null,o.j=null,o.B=null,hi(o)}r.setRequestHeader=function(o,B){this.A.append(o,B)},r.getResponseHeader=function(o){return this.h&&this.h.get(o.toLowerCase())||""},r.getAllResponseHeaders=function(){if(!this.h)return"";let o=[],B=this.h.entries();for(var f=B.next();!f.done;)f=f.value,o.push(f[0]+": "+f[1]),f=B.next();return o.join(`\r
`)};function hi(o){o.onreadystatechange&&o.onreadystatechange.call(o)}Object.defineProperty(za.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(o){this.m=o?"include":"same-origin"}});function bp(o){let B="";return Ma(o,function(f,C){B+=C,B+=":",B+=f,B+=`\r
`}),B}function Mc(o,B,f){e:{for(C in f){var C=!1;break e}C=!0}C||(f=bp(f),typeof o=="string"?f!=null&&si(f):_e(o,B,f))}function Ae(o){Xe.call(this),this.headers=new Map,this.L=o||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}d(Ae,Xe);var Gy=/^https?$/i,Uy=["POST","PUT"];r=Ae.prototype,r.Fa=function(o){this.H=o},r.ea=function(o,B,f,C){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+o);B=B?B.toUpperCase():"GET",this.D=o,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():up.g(),this.g.onreadystatechange=p(l(this.Ca,this));try{this.B=!0,this.g.open(B,String(o),!0),this.B=!1}catch(N){vp(this,N);return}if(o=f||"",f=new Map(this.headers),C)if(Object.getPrototypeOf(C)===Object.prototype)for(var R in C)f.set(R,C[R]);else if(typeof C.keys=="function"&&typeof C.get=="function")for(let N of C.keys())f.set(N,C.get(N));else throw Error("Unknown input type for opt_headers: "+String(C));C=Array.from(f.keys()).find(N=>N.toLowerCase()=="content-type"),R=a.FormData&&o instanceof a.FormData,!(Array.prototype.indexOf.call(Uy,B,void 0)>=0)||C||R||f.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(let[N,j]of f)this.g.setRequestHeader(N,j);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(o),this.v=!1}catch(N){vp(this,N)}};function vp(o,B){o.h=!1,o.g&&(o.j=!0,o.g.abort(),o.j=!1),o.l=B,o.o=5,Rp(o),Wa(o)}function Rp(o){o.A||(o.A=!0,nt(o,"complete"),nt(o,"error"))}r.abort=function(o){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=o||7,nt(this,"complete"),nt(this,"abort"),Wa(this))},r.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Wa(this,!0)),Ae.Z.N.call(this)},r.Ca=function(){this.u||(this.B||this.v||this.j?Sp(this):this.Xa())},r.Xa=function(){Sp(this)};function Sp(o){if(o.h&&typeof i<"u"){if(o.v&&vn(o)==4)setTimeout(o.Ca.bind(o),0);else if(nt(o,"readystatechange"),vn(o)==4){o.h=!1;try{let N=o.ca();e:switch(N){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var B=!0;break e;default:B=!1}var f;if(!(f=B)){var C;if(C=N===0){let j=String(o.D).match(Ep)[1]||null;!j&&a.self&&a.self.location&&(j=a.self.location.protocol.slice(0,-1)),C=!Gy.test(j?j.toLowerCase():"")}f=C}if(f)nt(o,"complete"),nt(o,"success");else{o.o=6;try{var R=vn(o)>2?o.g.statusText:""}catch{R=""}o.l=R+" ["+o.ca()+"]",Rp(o)}}finally{Wa(o)}}}}function Wa(o,B){if(o.g){o.m&&(clearTimeout(o.m),o.m=null);let f=o.g;o.g=null,B||nt(o,"ready");try{f.onreadystatechange=null}catch{}}}r.isActive=function(){return!!this.g};function vn(o){return o.g?o.g.readyState:0}r.ca=function(){try{return vn(this)>2?this.g.status:-1}catch{return-1}},r.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},r.La=function(o){if(this.g){var B=this.g.responseText;return o&&B.indexOf(o)==0&&(B=B.substring(o.length)),_y(B)}};function Pp(o){try{if(!o.g)return null;if("response"in o.g)return o.g.response;switch(o.F){case"":case"text":return o.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in o.g)return o.g.mozResponseArrayBuffer}return null}catch{return null}}function Hy(o){let B={};o=(o.g&&vn(o)>=2&&o.g.getAllResponseHeaders()||"").split(`\r
`);for(let C=0;C<o.length;C++){if(w(o[C]))continue;var f=Ay(o[C]);let R=f[0];if(f=f[1],typeof f!="string")continue;f=f.trim();let N=B[R]||[];B[R]=N,N.push(f)}dy(B,function(C){return C.join(", ")})}r.ya=function(){return this.o},r.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function fi(o,B,f){return f&&f.internalChannelParams&&f.internalChannelParams[o]||B}function Np(o){this.za=0,this.i=[],this.j=new ri,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=fi("failFast",!1,o),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=fi("baseRetryDelayMs",5e3,o),this.Za=fi("retryDelaySeedMs",1e4,o),this.Ta=fi("forwardChannelMaxRetries",2,o),this.va=fi("forwardChannelRequestTimeoutMs",2e4,o),this.ma=o&&o.xmlHttpFactory||void 0,this.Ua=o&&o.Rb||void 0,this.Aa=o&&o.useFetchStreams||!1,this.O=void 0,this.L=o&&o.supportsCrossDomainXhr||!1,this.M="",this.h=new dp(o&&o.concurrentRequestLimit),this.Ba=new My,this.S=o&&o.fastHandshake||!1,this.R=o&&o.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=o&&o.Pb||!1,o&&o.ua&&this.j.ua(),o&&o.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&o&&o.detectBufferingProxy||!1,this.ia=void 0,o&&o.longPollingTimeout&&o.longPollingTimeout>0&&(this.ia=o.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}r=Np.prototype,r.ka=8,r.I=1,r.connect=function(o,B,f,C){rt(0),this.W=o,this.H=B||{},f&&C!==void 0&&(this.H.OSID=f,this.H.OAID=C),this.F=this.X,this.J=Up(this,null,this.W),$a(this)};function Gc(o){if(Op(o),o.I==3){var B=o.V++,f=Vt(o.J);if(_e(f,"SID",o.M),_e(f,"RID",B),_e(f,"TYPE","terminate"),di(o,f),B=new Tn(o,o.j,B),B.M=2,B.A=Ka(Vt(f)),f=!1,a.navigator&&a.navigator.sendBeacon)try{f=a.navigator.sendBeacon(B.A.toString(),"")}catch{}!f&&a.Image&&(new Image().src=B.A,f=!0),f||(B.g=Hp(B.j,null),B.g.ea(B.A)),B.F=Date.now(),ja(B)}Gp(o)}function Qa(o){o.g&&(Hc(o),o.g.cancel(),o.g=null)}function Op(o){Qa(o),o.v&&(a.clearTimeout(o.v),o.v=null),Ya(o),o.h.cancel(),o.m&&(typeof o.m=="number"&&a.clearTimeout(o.m),o.m=null)}function $a(o){if(!pp(o.h)&&!o.m){o.m=!0;var B=o.Ea;ye||_(),Ee||(ye(),Ee=!0),A.add(B,o),o.D=0}}function qy(o,B){return Cp(o.h)>=o.h.j-(o.m?1:0)?!1:o.m?(o.i=B.G.concat(o.i),!0):o.I==1||o.I==2||o.D>=(o.Sa?0:o.Ta)?!1:(o.m=ni(l(o.Ea,o,B),Mp(o,o.D)),o.D++,!0)}r.Ea=function(o){if(this.m)if(this.m=null,this.I==1){if(!o){this.V=Math.floor(Math.random()*1e5),o=this.V++;let R=new Tn(this,this.j,o),N=this.o;if(this.U&&(N?(N=Kd(N),zd(N,this.U)):N=this.U),this.u!==null||this.R||(R.J=N,N=null),this.S)e:{for(var B=0,f=0;f<this.i.length;f++){t:{var C=this.i[f];if("__data__"in C.map&&(C=C.map.__data__,typeof C=="string")){C=C.length;break t}C=void 0}if(C===void 0)break;if(B+=C,B>4096){B=f;break e}if(B===4096||f===this.i.length-1){B=f+1;break e}}B=1e3}else B=1e3;B=Fp(this,R,B),f=Vt(this.J),_e(f,"RID",o),_e(f,"CVER",22),this.G&&_e(f,"X-HTTP-Session-Id",this.G),di(this,f),N&&(this.R?B="headers="+si(bp(N))+"&"+B:this.u&&Mc(f,this.u,N)),kc(this.h,R),this.Ra&&_e(f,"TYPE","init"),this.S?(_e(f,"$req",B),_e(f,"SID","null"),R.U=!0,Oc(R,f,null)):Oc(R,f,B),this.I=2}}else this.I==3&&(o?xp(this,o):this.i.length==0||pp(this.h)||xp(this))};function xp(o,B){var f;B?f=B.l:f=o.V++;let C=Vt(o.J);_e(C,"SID",o.M),_e(C,"RID",f),_e(C,"AID",o.K),di(o,C),o.u&&o.o&&Mc(C,o.u,o.o),f=new Tn(o,o.j,f,o.D+1),o.u===null&&(f.J=o.o),B&&(o.i=B.G.concat(o.i)),B=Fp(o,f,1e3),f.H=Math.round(o.va*.5)+Math.round(o.va*.5*Math.random()),kc(o.h,f),Oc(f,C,B)}function di(o,B){o.H&&Ma(o.H,function(f,C){_e(B,C,f)}),o.l&&Ma({},function(f,C){_e(B,C,f)})}function Fp(o,B,f){f=Math.min(o.i.length,f);let C=o.l?l(o.l.Ka,o.l,o):null;e:{var R=o.i;let se=-1;for(;;){let xe=["count="+f];se==-1?f>0?(se=R[0].g,xe.push("ofs="+se)):se=0:xe.push("ofs="+se);let de=!0;for(let Ve=0;Ve<f;Ve++){var N=R[Ve].g;let Mt=R[Ve].map;if(N-=se,N<0)se=Math.max(0,R[Ve].g-100),de=!1;else try{N="req"+N+"_"||"";try{var j=Mt instanceof Map?Mt:Object.entries(Mt);for(let[or,Rn]of j){let Sn=Rn;u(Rn)&&(Sn=vc(Rn)),xe.push(N+or+"="+encodeURIComponent(Sn))}}catch(or){throw xe.push(N+"type="+encodeURIComponent("_badmap")),or}}catch{C&&C(Mt)}}if(de){j=xe.join("&");break e}}j=void 0}return o=o.i.splice(0,f),B.G=o,j}function Lp(o){if(!o.g&&!o.v){o.Y=1;var B=o.Da;ye||_(),Ee||(ye(),Ee=!0),A.add(B,o),o.A=0}}function Uc(o){return o.g||o.v||o.A>=3?!1:(o.Y++,o.v=ni(l(o.Da,o),Mp(o,o.A)),o.A++,!0)}r.Da=function(){if(this.v=null,kp(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var o=4*this.T;this.j.info("BP detection timer enabled: "+o),this.B=ni(l(this.Wa,this),o)}},r.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,rt(10),Qa(this),kp(this))};function Hc(o){o.B!=null&&(a.clearTimeout(o.B),o.B=null)}function kp(o){o.g=new Tn(o,o.j,"rpc",o.Y),o.u===null&&(o.g.J=o.o),o.g.P=0;var B=Vt(o.na);_e(B,"RID","rpc"),_e(B,"SID",o.M),_e(B,"AID",o.K),_e(B,"CI",o.F?"0":"1"),!o.F&&o.ia&&_e(B,"TO",o.ia),_e(B,"TYPE","xmlhttp"),di(o,B),o.u&&o.o&&Mc(B,o.u,o.o),o.O&&(o.g.H=o.O);var f=o.g;o=o.ba,f.M=1,f.A=Ka(Vt(B)),f.u=null,f.R=!0,Bp(f,o)}r.Va=function(){this.C!=null&&(this.C=null,Qa(this),Uc(this),rt(19))};function Ya(o){o.C!=null&&(a.clearTimeout(o.C),o.C=null)}function Vp(o,B){var f=null;if(o.g==B){Ya(o),Hc(o),o.g=null;var C=2}else if(Lc(o.h,B))f=B.G,gp(o.h,B),C=1;else return;if(o.I!=0){if(B.o)if(C==1){f=B.u?B.u.length:0,B=Date.now()-B.F;var R=o.D;C=Ha(),nt(C,new ap(C,f)),$a(o)}else Lp(o);else if(R=B.m,R==3||R==0&&B.X>0||!(C==1&&qy(o,B)||C==2&&Uc(o)))switch(f&&f.length>0&&(B=o.h,B.i=B.i.concat(f)),R){case 1:ar(o,5);break;case 4:ar(o,10);break;case 3:ar(o,6);break;default:ar(o,2)}}}function Mp(o,B){let f=o.Qa+Math.floor(Math.random()*o.Za);return o.isActive()||(f*=2),f*B}function ar(o,B){if(o.j.info("Error code "+B),B==2){var f=l(o.bb,o),C=o.Ua;let R=!C;C=new An(C||"//www.google.com/images/cleardot.gif"),a.location&&a.location.protocol=="http"||ai(C,"https"),Ka(C),R?ky(C.toString(),f):Vy(C.toString(),f)}else rt(2);o.I=0,o.l&&o.l.pa(B),Gp(o),Op(o)}r.bb=function(o){o?(this.j.info("Successfully pinged google.com"),rt(2)):(this.j.info("Failed to ping google.com"),rt(1))};function Gp(o){if(o.I=0,o.ja=[],o.l){let B=mp(o.h);(B.length!=0||o.i.length!=0)&&(y(o.ja,B),y(o.ja,o.i),o.h.i.length=0,E(o.i),o.i.length=0),o.l.oa()}}function Up(o,B,f){var C=f instanceof An?Vt(f):new An(f);if(C.g!="")B&&(C.g=B+"."+C.g),oi(C,C.u);else{var R=a.location;C=R.protocol,B=B?B+"."+R.hostname:R.hostname,R=+R.port;let N=new An(null);C&&ai(N,C),B&&(N.g=B),R&&oi(N,R),f&&(N.h=f),C=N}return f=o.G,B=o.wa,f&&B&&_e(C,f,B),_e(C,"VER",o.ka),di(o,C),C}function Hp(o,B,f){if(B&&!o.L)throw Error("Can't create secondary domain capable XhrIo object.");return B=o.Aa&&!o.ma?new Ae(new Ja({ab:f})):new Ae(o.ma),B.Fa(o.L),B}r.isActive=function(){return!!this.l&&this.l.isActive(this)};function qp(){}r=qp.prototype,r.ra=function(){},r.qa=function(){},r.pa=function(){},r.oa=function(){},r.isActive=function(){return!0},r.Ka=function(){};function Xa(){}Xa.prototype.g=function(o,B){return new dt(o,B)};function dt(o,B){Xe.call(this),this.g=new Np(B),this.l=o,this.h=B&&B.messageUrlParams||null,o=B&&B.messageHeaders||null,B&&B.clientProtocolHeaderRequired&&(o?o["X-Client-Protocol"]="webchannel":o={"X-Client-Protocol":"webchannel"}),this.g.o=o,o=B&&B.initMessageHeaders||null,B&&B.messageContentType&&(o?o["X-WebChannel-Content-Type"]=B.messageContentType:o={"X-WebChannel-Content-Type":B.messageContentType}),B&&B.sa&&(o?o["X-WebChannel-Client-Profile"]=B.sa:o={"X-WebChannel-Client-Profile":B.sa}),this.g.U=o,(o=B&&B.Qb)&&!w(o)&&(this.g.u=o),this.A=B&&B.supportsCrossDomainXhr||!1,this.v=B&&B.sendRawJson||!1,(B=B&&B.httpSessionIdParam)&&!w(B)&&(this.g.G=B,o=this.h,o!==null&&B in o&&(o=this.h,B in o&&delete o[B])),this.j=new Yr(this)}d(dt,Xe),dt.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},dt.prototype.close=function(){Gc(this.g)},dt.prototype.o=function(o){var B=this.g;if(typeof o=="string"){var f={};f.__data__=o,o=f}else this.v&&(f={},f.__data__=vc(o),o=f);B.i.push(new Ry(B.Ya++,o)),B.I==3&&$a(B)},dt.prototype.N=function(){this.g.l=null,delete this.j,Gc(this.g),delete this.g,dt.Z.N.call(this)};function jp(o){Rc.call(this),o.__headers__&&(this.headers=o.__headers__,this.statusCode=o.__status__,delete o.__headers__,delete o.__status__);var B=o.__sm__;if(B){e:{for(let f in B){o=f;break e}o=void 0}(this.i=o)&&(o=this.i,B=B!==null&&o in B?B[o]:void 0),this.data=B}else this.data=o}d(jp,Rc);function Kp(){Sc.call(this),this.status=1}d(Kp,Sc);function Yr(o){this.g=o}d(Yr,qp),Yr.prototype.ra=function(){nt(this.g,"a")},Yr.prototype.qa=function(o){nt(this.g,new jp(o))},Yr.prototype.pa=function(o){nt(this.g,new Kp)},Yr.prototype.oa=function(){nt(this.g,"b")},Xa.prototype.createWebChannel=Xa.prototype.g,dt.prototype.send=dt.prototype.o,dt.prototype.open=dt.prototype.m,dt.prototype.close=dt.prototype.close,Zl=hn.createWebChannelTransport=function(){return new Xa},Xl=hn.getStatEventTarget=function(){return Ha()},Yl=hn.Event=rr,qo=hn.Stat={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},qa.NO_ERROR=0,qa.TIMEOUT=8,qa.HTTP_ERROR=6,Gi=hn.ErrorCode=qa,op.COMPLETE="complete",$l=hn.EventType=op,np.EventType=ei,ei.OPEN="a",ei.CLOSE="b",ei.ERROR="c",ei.MESSAGE="d",Xe.prototype.listen=Xe.prototype.J,is=hn.WebChannel=np,nT=hn.FetchXmlHttpFactory=Ja,Ae.prototype.listenOnce=Ae.prototype.K,Ae.prototype.getLastError=Ae.prototype.Ha,Ae.prototype.getLastErrorCode=Ae.prototype.ya,Ae.prototype.getStatus=Ae.prototype.ca,Ae.prototype.getResponseJson=Ae.prototype.La,Ae.prototype.getResponseText=Ae.prototype.la,Ae.prototype.send=Ae.prototype.ea,Ae.prototype.setWithCredentials=Ae.prototype.Fa,Ql=hn.XhrIo=Ae}).apply(typeof Ho<"u"?Ho:typeof self<"u"?self:typeof window<"u"?window:{});/*!
* re2js
* RE2JS is the JavaScript port of RE2, a regular expression engine that provides linear time matching
*
* @version v2.10.0
* @author Oleksii Vasyliev
* @homepage https://github.com/le0pard/re2js#readme
* @repository [object Object]
* @license MIT
*/var L=class mr{static FOLD_CASE=1;static LITERAL=2;static CLASS_NL=4;static DOT_NL=8;static ONE_LINE=16;static NON_GREEDY=32;static PERL_X=64;static UNICODE_GROUPS=128;static WAS_DOLLAR=256;static LOOKBEHIND=512;static MATCH_NL=mr.CLASS_NL|mr.DOT_NL;static PERL=mr.CLASS_NL|mr.ONE_LINE|mr.PERL_X|mr.UNICODE_GROUPS;static POSIX=0;static UNANCHORED=0;static ANCHOR_START=1;static ANCHOR_BOTH=2},Qe={CASE_INSENSITIVE:1,DOTALL:2,MULTILINE:4,DISABLE_UNICODE_GROUPS:8,LONGEST_MATCH:16,LOOKBEHINDS:512},ji=128,sB=new Int32Array(ji),iB=new Int32Array(ji),jo=65535;for(let r=0;r<ji;r++)r>=97&&r<=122?sB[r]=r-32:sB[r]=r,r>=65&&r<=90?iB[r]=r+32:iB[r]=r;var k=class{static CODES=Object.freeze({"\x07":7,"\b":8,"	":9,"\n":10,"\v":11,"\f":12,"\r":13," ":32,'"':34,$:36,"&":38,"'":39,"(":40,")":41,"*":42,"+":43,"-":45,".":46,0:48,1:49,2:50,3:51,4:52,5:53,6:54,7:55,8:56,9:57,":":58,"<":60,">":62,"?":63,A:65,B:66,C:67,F:70,P:80,Q:81,U:85,Z:90,"[":91,"\\":92,"]":93,"^":94,_:95,"`":96,a:97,b:98,f:102,i:105,m:109,n:110,r:114,s:115,t:116,v:118,x:120,z:122,"{":123,"|":124,"}":125});static toUpperCase(r){if(r<ji)return sB[r];let e=String.fromCodePoint(r).toUpperCase(),t=e.codePointAt(0)>jo?2:1;if(e.length>t)return r;let n=String.fromCodePoint(e.codePointAt(0)).toLowerCase(),s=n.codePointAt(0)>jo?2:1;return n.length>s||n.codePointAt(0)!==r?r:e.codePointAt(0)}static toLowerCase(r){if(r<ji)return iB[r];let e=String.fromCodePoint(r).toLowerCase(),t=e.codePointAt(0)>jo?2:1;if(e.length>t)return r;let n=String.fromCodePoint(e.codePointAt(0)).toUpperCase(),s=n.codePointAt(0)>jo?2:1;return n.length>s||n.codePointAt(0)!==r?r:e.codePointAt(0)}},g=class{constructor(r,e=!1){this.data=r,this.isStride1=e,this.SIZE=e?2:3}getLo(r){return this.data[r*this.SIZE]}getHi(r){return this.data[r*this.SIZE+1]}getStride(r){return this.isStride1?1:this.data[r*this.SIZE+2]}get length(){return this.data.length/this.SIZE}},rT="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-",rm=new Uint8Array(256);for(let r=0;r<64;r++)rm[rT.charCodeAt(r)]=r;var sm=r=>{let e=[],t=0,n=0;for(let s=0;s<r.length;s++){let i=rm[r.charCodeAt(s)];t|=(i&31)<<n,(i&32)===0?(e.push(t),t=0,n=0):n+=5}return e},m=(r,e)=>{let t=sm(r),n=e?t.length/2:t.length/3,s=new Uint32Array(n*3),i=0,a=0;for(let u=0;u<n;u++)i+=t[a++],s[u*3]=i,i+=t[a++],s[u*3+1]=i,s[u*3+2]=e?1:t[a++];return s},sT=r=>{let e=sm(r),t=new Map,n=0;for(let s=0;s<e.length;s+=2){n+=e[s];let i=e[s+1],a=i>>>1^-(i&1);t.set(n,n+a)}return t},Ko=class{constructor(r){this.initializer=r,this.cache=new Map}has(r){return Object.hasOwn(this.initializer,r)}get(r){if(this.cache.has(r))return this.cache.get(r);let e=this.has(r)?this.initializer[r]():null;return this.cache.set(r,e),e}},gt=class{static _CASE_ORBIT=null;static get CASE_ORBIT(){return this._CASE_ORBIT||(this._CASE_ORBIT=sT("rCgCIgCY+rQI4QiCuuBLgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCCgCBgCBgCBgCBgCBgCBgCB+7OB-BB-BB-BB-BB-BBskQB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BC-BB-BB-BB-BB-BB-BB-BByHBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBDCBBBCBBBCBBCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBxHBCBBBCBBBCBBB3SBmMBkNBCBBBCBBB8MBCBBB6MB6MBCBBC+EB0MB2MBCBBB6MB+MBiGBmNBiNBCBBBmKBikzCBmNBqNBkIBsNBCBBBCBBBCBBB0NBCBBB0NDCBBB0NBCBBByNByNBCBBBCBBB2NBCBBDCBBCwDFCBCBDBCBCBDBCBCBDBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBB9EBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCCBCBDBCBBBhGBvDBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBjICCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBH2iVBCBBBlKBwiVB+jVB+jVBCBBBlMBqEBuEBCBBBCBBBCBBBCBBBCBBB+hVB4hVB8hVBjNB7MC5MB5MCzMC1MB+0yCE5MB20yCC9MBu2yCBwyyCBo0yCChNBlNBo0yCBu-UBi0yCDlNC6-UBpNDrNIu+UDzNCm0yCBzNE0yyCBzNBpEBxNBxNBtEG1NLqxyCBkxyCnFoFrBCBBBCBBDCBBEkIBkIBkICoHHsCCqCBqCBqCCgEC+DB+DBmkOBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCC+BBgCBgCBgCBgCBgCBgCBgCBgCBrCBpCBpCBpCBmjOB-BB8BB-BB-BBgEB-BB-BByBBqgOBsDB-BBtwBB-BB-BB-BBsBBgDBCB-BB-BB-BBeB-BB-BB61OB-BB-BB-DB9DB9DBQB7DBmCE9CBrDBPBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBrFB-EBOBnHB3FB-FCCBBBNBCBBCjIBjIBjIBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgFBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB8kMB-BB6kMB-BB-BB-BB-BB-BB-BB-BB-BB-BBokMB-BB-BBkkMBkkMB-BB-BB-BB-BB-BB-BB-BB4jMB-BB-BB-BB-BB-BB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EB-EBCBBBCBoiMBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBJCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBeBCBBBCBBBCBBBCBBBCBBBCBBBCBBBdBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBCgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDL-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-C64CgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOBgmOCgmOGgmODg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FBg8FDg8FBg8FBg8FhVg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBg9rCBQBQBQBQBQBQDPBPBPBPBPBPjkC7mMB5mMBnmMBjmMBCBlmMB3lMBpiMBk8kCBCBBG-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FB-7FD-7FB-7FB-7F6FoglCEsuHRwjlCyDCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCB0DBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBG1DD97OCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQDPBPBPBPBPBPDQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQDPBPBPBPBPBPEQCQCQCQCPCPCPCPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPB0EB0EBsFBsFBsFBsFBoGBoGBgIBgIBgHBgHB8HB8HDQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQBQBQBQBQBQBQBPBPBPBPBPBPBPBPBQBQCSFPBPBzEBzEBRCxnOFSFrFBrFBrFBrFBREQBQClkOFPBPBnGBnGFQBQCljOCODPBPB-GB-GBNHSF-HB-HB7HB7HBRqJ53OE9tQBrmQH4Bc3BSgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBgBBfBfBfBfBfBfBfBfBfBfBfBfBfBfBfBfECBByZ0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BB0BBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzBBzB34BgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDBgDB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CB-CBCBBBt-UBruHBt+UB1iVBviVBCBBBCBBBCBBB3hVB5-UB9hVB7hVCCBBCCBBI9jVB9jVBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBICBBBCBBECBBN-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOB-lOC-lOG-lOzoeCBBBCBBBCBBBCBBBCBBBCBl8kCBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBTCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBnECBBBCBBBCBBBCBBBCBBBCBBBCBBDCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBKCBBBCBBBnglCBCBBBCBBBCBBBCBBBCBBECBBBvyyCDCBBBCBBBgDCCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBn0yCB90yCB10yCBh0yCBn0yCCjxyCBzyyCBpxyCBg6BBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBB-CBl0yCBvjlCBCBBBCBBBt2yCBCBBBCBBBCBBBCBBBCBBBCBBBCBBBCBBBhkzCZCBB9a-5Bd-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCB-8rCm6TCBB7gBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCH-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BmlBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvChDwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCBwCFvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvCBvC1DuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCCuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCBuCCuCBuCBuCBuCBuCBuCBuCCuCBuCCtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCCtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCBtCCtCBtCBtCBtCBtCBtCBtCCtCBtCk2BgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEBgEO-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-DB-D+CgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCL-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-B74CgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BhrVgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCBgCB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BB-BhB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BB2BD1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BB1BtxekCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBkCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjCBjC")),this._CASE_ORBIT}static _Print=null;static get Print(){return this._Print||(this._Print=new g(m("hB9CBjBLBCpWBDFBFGBCCCBSBCsMBClBBDxBBDCBC2BBJaBFFBSVBC-FBCvBBD6BBDkDBP6BBDwBBDOBCbBDCCBJBGfBIqCBCgFBCHBDBBDVBCGBCEEBCBDIBDBBDDBJFFBCCBDBDYBDCBCFBFBBDVBCGBCBBCBBCBBDCCBDBFBBDCBEIIBCBCIIBPBLCBCIBCCBCVBCGBCBBCEBDJBCCBCCBDQQBCBDLBIGBCCBCHBDBBDVBCGBCBBCEBDIBDBBDCBICBFBBCEBDRBLBBCFBECBCDBEBBCCCBEEBEEBBBELBFEBECBCDBDHHPUBGMBCCBCWBCPBDIBCCBCDBIBBCCBCBBDDBDJBIVBCCBCWBCJBCEBDIBCCBCDBIBBGCBCDBDJBCCBNMBCCBCyBBCCBCFBFPBDZBCCBCRBEXBCIBCDDBFBEFFBEBCCCBGBHJBDCBN5BBFcBmBBBCCCBDBCXBCCCBVBDEBCCCBFBCJBDDBhBnCBCjBBFmBBCjBBCOBCMBmBlGBCGGD4LBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBDfBEZBH1CBDFBD-TBCbBE4CBIVBKXBKTBNMBCCBCBBN9CBDJBHJBHNBCKBH4CBIqBBGlCBLeBCLBFLBFEEBoBBDEBMrBBFZBHKBE9BBDgCBCcBDKBHJBHNBDtBBDLBVsCBClFBJ7BBEOBE9BBGqBBDKBJqBBG1QBDFBDlBBDFBDHBCGCBdBD0BBCOBCNBDFBCSBDCBCIBSXBJuBBSBBDaBCMBEhBBPgBBQrEBF5UBXKBWz4BBD9LBGsBBCGGD3BBIBBPXBKGBCGBCGBCGBCGBCGBCGBCGBC9DBjBZBC4CBN1GBbPBC+BBC1CBDmDBGqBBC9CBC1CBKvBBCszcBE2BBK7KBV3FBJ8GBV7BBEJBH3BBJlCBJLBHzDBMdBEtCBCKBFgBBC2BBKNBDJBDmDBZbBLFBDFBDFBKGBCGBC7BBF9DBDJBHj9KBNWBFwBBloItLBDpDBnBGBNEBGZBCEBCCCBCCBCCBoUBhBpBBHyBBCSBCDBFEBCmEBF9FBEFBDFBDFBDCBEGBCGBOBBDLBCZBCSBCBBCOBDNBjB6DBGCBFsBBE3CBCMBEwBwBBsBBjEcBEwBBQbBFjBBKdBGqBBGdBCkBBFNBrB9EBDJBHjBBFjBBFnBBJzBBMLBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBCnCBJIBxBSBCBBGgBBEaBGaBnB3BBFTBDxBBCBBGHBCCBCcBDCBFJBIIBI-BBhBmBBFLBK1BBEcBDaBGZBIDBNGBxCoCB4ByBBOyBBItBBJJBHlBBEcBJBBxGeBCpBBCCBDBBRFBJIBiBtBBJpBBXZBnBbBVWBKtCBFjBBK9BBCEBOYBIJBH0BBCRBJmBBK-CBCTBMRBCuBB-BGBCCCBCBCOBCKBH6BBGJBHDBCHBDBBDVBCGBCBBCEBCJBDBBDCBDHHGGBDGBEEBMJBCDDClBBCJBCDDCDBCJBCBBJBBe7CBCEBfnCBJJBnF1BBDlBBjBkCBMJBHMBU5BBHJBHTBdaBDOBFWB6F7BBlDyCBNHBDDDBGBCBBCdBCBBDLBKJBnCHBDtBBDKBcnCBJyCBOoCBIJB3CHB5ChBBPJBHIBCsBBCNBLcBEfBDVBCNBqCGBCBBCrBBECCBCCBHBJJBHFBCBBCkBBCBBCFBIJBHrBBFJB3HYBIQBCoBBEcB2CQQBwBBO6cBnDuDBCEBMjGBtyCiDBOvhBBRVBL68DBGmSB61G5BBn2B4RBIeBCJBFwCBCJBHdBDFBLlCBLJBCGBCUBGSBxN5BBnG6CBGYBDYBtBqCBF4BBIQBhCEBMGBK1mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBDDBh7D8HBEzNBHWBQQBQtBBDWBKzDB9B1HBLmBBDpCBJvDBWlCB7DTBNTBN2CBKYBoE0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBD9VBQEBCOBxiBeBHFB2GGBCQBDGBCBBCEBG9BBiBxDxDBrBBENBDJBFBBhKeBS5BBGxOxOBoBB3GqBBFhGhGBdBCVBJBBhHGBCDBCBBCOBCkGBDPBqBrCBFJBFBByYjCBtC8BBjGDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBBvIrBBFjDBNOBDOBCOBCkBBLtFB5BcBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBCmDBmgB-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIBnkzVvHB",!1))),this._Print}static CATEGORIES=new Ko({C:()=>new g(m("AfBgDgBBOrWrWBHHBCBICCVuMuMnBBBzBBBE4B4BBGBcDBHQBXhGhGxBBB8BBBmDNB8BBByBBBQddBCCMEBhBGBsCiFiFJBBDBBXIICCBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBPMMBEB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKMMBDBbEByBPBDBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBjoIBvLBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCB-FCBHBBHBBHBBECBIIIBLBDBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIB-BGGBLBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMBxhBPBXJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBF-6DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBrCHBxDUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIlkzVBxHvw-FB",!1)),Cc:()=>new g(m("AfgDgB",!0)),Cf:()=>new g(m("tFzqBzqBBEBXhGhGyBhMhMBxCxCs5D9-B9-BBDBbEByBEBCJBw03B6H6HBBBimEQQj7IPBhjiBDBwmFHBn0rYffB+CB",!1)),Cn:()=>new g(m("4bBBHDBICCVuMuMnBBBzBBBE4B4BBGBcDBHKBvI9B9BBmDmDBMB8BBByBBBQddBCCMEBjBEBuHJJBDDBXXICCBBBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBbFB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKmDmDNBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBDBvzIBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCC-FCBHBBHBBHBBECBIIIBIBGBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIBlCJBCBBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMB3iBJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBJ76DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBjGUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIm8yVBCdBhD-DBxHvw-BB---BBB---BBB",!1)),Co:()=>new g(m("gg4B-nGh4hc9--BD9--B",!0)),Cs:()=>new g(m("gg2B--B",!0)),L:()=>new g(m("hCZBHZBwBLLFGGBVBCeBCpOBFLBPEBICCiEEBCBBDDBCHHCCBCCCBSBCyCBCqEBJlFBClBBDHHBnBBoCaBFDBuBqBBkBBBCiDBCQQBIIBLLBBBDRRCdBe4CBMZZBfBKBBFGGBUBFKKEYYBXBIKBGXBCGBRpBB7B1BBETTIJBQPBFHBDBBDVBCGBCEEBCBERROBBCCBPBBLJJBEBFBBDVBCGBCBBCBBCBBgBDBCUUBBBRIBCCBCVBCGBCBBCEBETTQBBYMMBGBDBBDVBCGBCBBCEBEffBCCBBBQSSCFBECBCDBEBBCCCBEEBEEBBBELBX1B1BBGBCCBCWBCPBEbbBBBCBBDBBfFFBGBCCBCWBCJBCEBEffBBBCBBQBBSIBCCBCoBBDRRGCBJCBZFBGRBEXBCIBCDDBFB7BvBBCBBNGB7BBBCCCBDBCXBCCCBIBCBBKDDBDBCWWBCBhBgCgCBGBCjBBcEB0DqBBVRRBEBFDBEEEBIIBBBFMBNSSBkBBCGGDqBBCsKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPBR1CBDFBErTBDQBCZBGqCBHHBIRBOSBPRBPMBCCBQzBBkBFFkC4CBIEBDhBBCGGBkCBLeByBdBDEBMrBBFZB3BWBK0BBzC+C+CBtBBSHB3BdBOBBLrBBbjBBqBCBLjBBDKBGqBBDCBqBDBCFBCBBEGGB+FBhC1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGB1DOORMBmDFFDJBCEEBDBHGCBCBCKBDDBGEBF1B1BB8zC8zCBjHBHDBEBBNlBBCGGD3BBIRRBVBKGBCGBCGBCGBCGBCGBCGBCGBxC2O2OBrBrBBDBGBBF1CBHCBC5CBCDBGqBBC9CBSfBxBPBhQ-tGBhCs0VBkCtBBDsIBEPBLBBVuBBReBDlCByBIBDmDBDxCBVQBCCBCDBCWBezBBPxBB-BFBECCBMMBaBLWBacBIuBBdRRBDBCJBLEBCoBBYCBCHBVWBEEEBwBBCEEBDDBDBDCCZCBDKBICBNFBDFBDFBKGBCGBCqBBCNBHyDBej9KBNWBFwBBloItLBDpDBnBGBNEBGCCBIBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBlBZBHZBM4CBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmMcBEwBBwBfBOTBCHBHlBBLdBDjBBFHBxB9EBTjBBFjBBFnBBJzBBNKBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCQQBCBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4ByBBOyBBOjBBnBbBKWB7HpBBHBBRFB5BcBLJJBUBrBRBvBUBcWBN0BB6BBBDOOBrBBhBYBbjBBeDDJiBBENNBuBBPDBWCCkBRBCYBUBBgCGBCCCBCBCOBCJBIuBBnBHBDBBDVBCGBCBBCEBETTNEBfJBCDDClBBCaaCtBtBBzBBTDBVCBfvBBVBBC5F5FBtBBqBDBlBvBBV8B8BBpBBOoCoCBZBmBGB6FrBB1D-BBgBHBDDDBGBCBBCXBQCC-CHBDmBBRCCdLLBmBBIWWMtBBUTTBnCBoGgBBgBIBCkBBSyByBBcBxDGBCBBClBBWaaBEBCBBCfBPYYBqBBlISBQCCBLBChBB9DwCwCB4cBnHjGBtyCgDBQvhBBSFBa68DBGmSB61GdBj3B4RBIeBSuCBSdBTvBBRDBgBUBGSBxNsBB0G-BBhBYBDYBtBqCBGjCjCBLBhCBBCPPBNNB0mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBn7F0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BeBHFBmI9BBzEsBBLGBRiKiKBcBTrBBlPbBlHdBDwGwGBdBCCBCBBCGBDEBKBBhHGBCDBCBBCOBCkGB8BjCBI1lB1lBBCBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQBlqE-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),LC:()=>new g(m("hCZBHZB7BLLBVBCeBCiGBCDBFvGBDZBhGDBDBBECBCHHCCBCCCBSBCyCBCqEBJlFBClBBKoBB44ClBBCGGDqBBDCBhV1CBDFBjkCKBGqBBDCBhCrBBgCMBChBBmD1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGBmIFFDJBCEEBDBHGCBCBCFBFDDBCBGEBF1B1BB8zC8zCB6DBDmDBHDBEBBNlBBCGGzoetBBTbBnEtCBCWBEDBCsCBZBBE2Z2ZBpBBGIBIvCBh6TGBNEBqgBZBHZBmlBvCBhDjBBFjBB1DKBCOBCGBCBBCKBCOBCGBCBBk2ByBBOyBB+CVBLVB74C-BBhrV-BBhBYBDYBtpZ0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BJBCTBHFB2uCjCB",!1)),Ll:()=>new g(m("hDZB7BqBqBBWBCHBC2BCBQCBuBCDECBBBDCCDEEBFFDEEBBBDDDCCCDCCBCCDEECDDBDDBBBHGDCOCBSCBDDCEEC4BCBFBDDDBCCFICBjCBDZBiGCCEEEBBBTccBhBBCBBECBCWCBDBCGDB0B0BBuBBCgBCK0BCDMCBgDCxBoBBo6CqBBDCB5XFBjkCIBC2D2DBqBBgCMBChBBnD0ECBHBCgDCBHBJFBLHBJHBJFBLHBJHBJNBDHBJHBJHBJEBCBBHEEBBBCBBJDBDBBJHBLCBCBBzIEEBEEcKFDBBJDBF2B2Bs1CvBBCEEBGCFCCBCCBEBGiDCBIICFFNlBBCGG0oesBCUaCoEMCBBBC+BCBGBCCCDICFCCDCCBBBCSCGGGCMCFCCDOCbEE2ZqBBGIBIvCBh6TGBNEBqhBZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBnqZZBbGBCRBbZBbDBCCCBFBCKBbZBbZBbZBbZBbZBbZBbZBbZBbbBdYBCFBbYBCFBbYBCFBbYBCFBbYBCFBC15B15BBIBCTBHFB4vChBB",!1)),Lm:()=>new g(m("wVRBFLBPEBICCmEGG-OnHnHlFBBuIBBFgBgBKEEhFoFoF1mBgEgE2R72B72BsDkTkTxOFBvF+BBOjBjBBjBByVOORMBg-CBByHgGgG2OsBsBBDBGiDiDB+C+CBBB34bjnBjnBBEBvIzDzDdBB6DIBxCYYpDDBEBB2OXXqEtDtDWBBoDDBKngVngVuBBBh-BFBCpBBCIB0sBhBhB2K04D04DnrTDB9PCBpBBBnRMBhCBBCPPB9-P9-PBCBCGBCBByhM9BBqGGBud0Q0QsSAB",!1)),Lo:()=>new g(m("qFQQhIFFBCBxGBB7ZaBFDBuBfBCJBkBBBCiDBCZZBLLBBBDRRCdBe4CBMZZBfBWVBrBYBIKBGXBCGBRoBB8B1BBETTIJBROBFHBDBBDVBCGBCEEBCBERROBBCCBPBBLJJBEBFBBDVBCGBCBBCBBCBBgBDBCUUBBBRIBCCBCVBCGBCBBCEBETTQBBYMMBGBDBBDVBCGBCBBCEBEffBCCBBBQSSCFBECBCDBEBBCCCBEEBEEBBBELBX1B1BBGBCCBCWBCPBEbbBBBCBBDBBfFFBGBCCBCWBCJBCEBEffBBBCBBQBBSIBCCBCoBBDRRGCBJCBZFBGRBEXBCIBCDDBFB7BvBBCBBNFB8BBBCCCBDBCXBCCCBIBCBBKDDBDBYDBhBgCgCBGBCjBBcEB0DqBBVRRBEBFDBEEEBIIBBBFMBNyDyDBnKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPByDrTBDQBCZBGqCBHHBIRBOSBPRBPMBCCBQzBBpBkCkCBhBBC0BBIEBDhBBCGGBkCBLeByBdBDEBMrBBFZB3BWBK0BBxFuBBSHB3BdBOBBLrBBbjBBqBCBLdByDDBCFBCBBE7hB7hBBCB4-C3BBZWBKGBCGBCGBCGBCGBCGBCGBCGBoR2B2BF1CBJCCB4CBFGGBpBBC9CBSfBxBPBhQ-tGBhC0wUBC2jBBkCnBBJrIBFPBLBBjCyByBBkCBqFoDoDEGBCCBCDBCWBezBBPxBB-BFBECCBMMBaBLWBacBIuBBuBEBDIBLEBCoBBYCBCHBVPBCFBEEEBwBBCEEBDDBDBDCCZBBEKBIPPBEBDFBDFBKGBCGByEiBBej9KBNWBFwBBloItLBDpDBkCCCBIBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBqDJBCsBBDeBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmMcBEwBBwBfBOTBCHBHlBBLdBDjBBFHBhEtCBjDnBBJzBB9CzBBN2JBKVBLHB5EFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCQQBCBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4FjBBnBDBCxJxJBoBBHBBRCBCBB5BcBLJJBUBrBRBvBUBcWBN0BB6BBBDOOBrBBhBYBbjBBeDDJiBBENNBuBBPDBWCCkBRBCYBUBBgCGBCCCBCBCOBCJBIuBBnBHBDBBDVBCGBCBBCEBETTNEBfJBCDDClBBCaaCtBtBBzBBTDBVCBfvBBVBBC5F5FBtBBqBDBlBvBBV8B8BBpBBOoCoCBZBmBGB6FrBB0GHBDDDBGBCBBCXBQCC-CHBDmBBRCCdLLBmBBIWWMtBBUTTBnCBoGgBBgBIBCkBBSyByBBcBxDGBCBBClBBWaaBEBCBBCfBPYYBnBBCBBlISBQCCBLBChBB9DwCwCB4cBnHjGBtyCgDBQvhBBSFBa68DBGmSB61GdBj3B4RBIeBSuCBSdBTvBB0BUBGSB0NnBB2MqCBGwFwFB0mHBqBfBiDyDBuwIiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBxzI2P2PBrBBiBiKiKBcBTrBBlPaBmHdBDwGwGBdBCCBCBBCGBDEBKiHiHBFBCDBCBBCOBCkGB8pBDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQBlqE-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Lt:()=>new g(m("lOGDnB2sH2sHBGBJHBJHBNQQwBAB",!1)),Lu:()=>new g(m("hCZBmDWBCGBiB2BCDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIJDCMCDQCDDDCCBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBDDBBBEWCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBpCDBNDBNDBNEBMDBnIFFECBDCBDEEBDBHGCBCBDDBLBBG+B+B9zCvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoqZZBbZBbZBbCCBGDBDDBCBCHBbZBbBBCDBDHBCGBcBBCDBCEBCEEBFBcZBbZBbZBbZBbZBbZBfYBiBYBiBYBiBYBiBYBiB2pE2pEBgBB",!1)),M:()=>new g(m("gYvDB0IGBoIsBBCCCBCCBCCpCKBxBUBRmDmDBFBDFBDBBCDBkBffBZB8CKB7BIBKZZBCBCIBCCBCEBsBCB8BIBrBXBCgBB3BCBCRBCGBLBBeCB5BCCBFBDBBDCBKLLBbbDCB5BCCBDBFBBDCBEffBEEMCB5BCCBGBCCBCCBVBBXFBCCB5BCCBFBDBBDCBICBLBBf8B8BBDBECBCDBKpBpBBDB4BCCBFBCCBCDBIBBMBBeCB5BCCBFBCCBCDBIBBMBBQNNBCB4BBBCGBCCBCDBKLLBeeBBBnCFFBEBCCCBGBTBB+BDDBFBNHBjDDDBHBMGBqCBBcECFBByBTBCBBGKBCjBBKlDlDBSBYDBFCBCCBDGBEDBOLBCLLBCBgWCBzdDBdCBeBBfBBhCfBKuBuBBBBC2D2DBjBjB3DLBFLB8GEB6BJBCcBDxBxBBsBBDLBVEBwBQBnBIBNCBfMB5BNBxBTB5ECBCUBFHHDCBnG-BBxWgBB--CCBuEhDhDBeBrRFBqDBB1udDBCJBhBBBxCBBxIEEFYYBDBF0C0CBzBzBBQBbRBOnBnBBGBaMBtBDBwBNBlBkCkCBMBNJJBuBuBBBBzBCCBBBDBBGBBCqBqBBDBGBBtHHBCBBx5TiXiXBOBRPBuejHjH2EEBn0BCBCBBGDBpBCBFmFmFB+R+RBCBiCEB+JBBuCFBnCKByBDB7DCB2BOBqBDDBLLBCBuBKBI+B+BBBBlBNBRBBtBNNBBBxBNBJDBCBB9CLBHDD+ELBWDB4BBBCGBDBBDCBKLLBDDBFBEEBkCIBCDDCDBCEBCPPBzCzCBQBYyCyCBSBsHGBDIBcBBzCQBrDMBmDOBhIOB2HFBCBBDDBCCCBuEuEBFBDGBEddBIBpBGBCDBJKKBJBvBPBnGHBoGHBCHBzCVBCNB7DFBECCBCCBFBCjCjCBDBCBBCEB8KDBKBBCxBxBBFBEEBYmnFmnFHOBpmLRBhuCEB8BGB5gBCCB1BBIDByCMMBslTslTBizEizEBsBBDWB-QEBEFBJHBDGBfDB1ECB89B2BBFxBBJPPXEBCOBxqBGBCQBDGBCBBCEBlDhFhFBFB4L+B+BBCB9PDB-HBB0HDDIBBG7O7OBFBuDGB29lYvHB",!1)),Mc:()=>new g(m("joC4B4BDCBJDBCBBzBBB7BCBHBBDBBLsBsB7BCBjC7B7BBBBJCCB2B2BB7B7BCHHBDDBLLnDBBCBBECBCCBLqBqBBBB+BDB+BBB7BCCBDBDBBCBBKBBdPPB7B7BBBBGCBCCBLrBrBBsCsCBBBHHBTBBrKBBgCsFsFBFFHDDBaaBLLBBBDGBWBBDFBDLLBBB5zBffiEIIBGBCBB7KDBDCBFBBCFBhHBB7BCCKCCBJJBEByExBxBGCCBDBCBB+BffFBBD9B9BDCBCEEBxBxBBGBJBBsFWW35EBB0-dBBD5C5CBzBzBBOBvEBBwBxBxBBFFBDDBBBvDBBDBBZuBuBCuDuDDBBGuHuHBCCBCCBCC0gZCCgEuBuBBBBFBB0DZZB8B8BxBCBKBBO+C+CBBBEBBCrFrFBBBgBBB7BBBCDBDBBDCBKLLB1C1CBBBIDDCDBCBBCmDmDBBBJBBErDrDBBBHCCBCBDuHuHBBBHDBDyDyDBBBJBBCuDuDCBBHoDoDCBBFmImIBBBK4H4HBEBCBBFDDCvEvEBBBJDBF1C1CeBB-BqGqGECCoGPPrDIID2G2GBDBFBBC-K-KBNNxBBBJBBCpvQpvQBBBlxD2BBpDBB0rYBBHFB",!1)),Me:()=>new g(m("okBBB1xF-wB-wBBCBCCBsshBCB",!1)),Mn:()=>new g(m("gYvDB0IEBqIsBBCCCBCCBCCpCKBxBUBRmDmDBFBDFBDBBCDBkBffBZB8CKB7BIBKZZBCBCIBCCBCEBsBCB8BIBrBXBCfB4BCCFHBFEEBFBLBBe7B7BFDBJVVBbbDBB6BFFBFFBDDBBBEffBEEMBB6BFFBDBCBBFVVBXXBEBC7B7BDCCBCBJIIBMMBff+BNNzBEE4BCCBBBGCBCDBIBBMBBe7B7BDHHGBBVBBdBB6BBBFDBJVVBeepCIIBBBC7C7CDGBNHBjDDDBHBMGBqCBBcEC4BNBCEBCBBGKBCjBBKnDnDBCBCFBCBBDBBaBBFCBRDBODDBHHQgWgWBBBzdCBeBBfBBfBBhCBBCGBJDDBJBKuBuBBBBC2D2DBjBjB3DCBFBBKHHBBB8GBBD7B7BCGBCCCDHBHJBDxBxBBMBCeBDLBVDBxBCCBDBCGGpBIBNBBhBDBDBBCCB5BCCBEECCB7BHBDBB5ECBCMBCGBFHHEBBnG-BBxWMBFEEBKB--CCBuEhDhDBeBrRDBsDBB1udFFBIBhBBBxCBBxIEEFaaBGG4EBBbRBOnBnBBGBaKBvBCBxBDDBCBDBBoBkCkCBEBDBBDBBNJJwB0B0BCCBDBBGBBCrBrBBJJvHDDFx5Tx5TiXPBRPBuejHjH2EEBn0BCBCBBGDBpBCBFmFmFB+R+RBCBiCEB+JBBuCFBnCKByBDB8D3B3BBNBqBDDBLLBBByBDBDBBI+B+BBBBlBEBCHB-BNNB1B1BBHBLDBDgDgDBBBDCCBHHD+E+EEHBWBB6BBBEmBmBBFBEEBnCFBOECPBB2CHBDCBCYY1CFBCFFBCCBvHvHBCBHBBCBBcBB2CHBDCCBrDrDCDDBEBCmDmDCDDBCBCEBkIIBCBBhIBBCFFxEDBDBBFhBhBBIBpBFBDDBJKKBEBDCBvBMBCBBnGCCBBBCqGqGBFBCFBCzCzCBUBDGBCBBCBB7DFBECCBCCBFBCpCpCBEEC8K8KBMMB1B1BBDBGCCYmnFmnFHOBpmLLBECBhuCEB8BGB5gBgCgCBCByC5lT5lTBizEizEBsBBDWBhRCBSHBDGBfDB1ECB89B2BBFxBBJPPXEBCOBxqBGBCQBDGBCBBCEBlDhFhFBFB4L+B+BBCB9PDB-HBB0HDDIBBG7O7OBFBuDGB29lYvHB",!1)),N:()=>new g(m("wBJB5DBBGDDBBBitBJBnEJBnGJB9MJB3DJBFFBtDJB3DJB3DJBDFBvDMB0DJBJGBoDJBpDGBISBuDJBhDJB3DJBnCTBtIJBnCJBwWTBybCBwHJBHJBXJBtJJBhEKBmFJBHJB3FJB3CJBnEJBHJB3gBEEBEBHJBnGyBBDEB3W7BBvCVB3TdBqrBqYqYaIBPCB4KDBrEJBfHBCOBhBJBoBOBh7cJB9FJBhKFB7EJBnBJBnGJBXJB3CJB3MJB34UJBuPsBBN4BBSBB2KaBlBDBeJJnEEBrGJBvdHBaGBoBIBsCEBXFBhFBBDPBDtBBhCIB1BBBfCBsCEBpDHBZHBqBGBrKFBxBJBHJB3IeB-EJBrBDBxDGBnEdBhEJB9BJBxEJBITB8HJB3KJB3DJB3LJBnDJBHTBtCLBlNSB+CJB3UJB3CcBkHJBnCJB3BJBnLJBnDUBshBuDBimPJBnpCJB3CJBnEJBCGBvQJBnIWB+KCB6nXJBnuBTBNTBtDYB2iBxBBhqCJBnNJB3PJB4HJBtWIBhEJB4Y6BBCCBCDBtCsBBCOBjeMBk3CJB",!1)),Nd:()=>new g(m("wBJnxBJnEJnGJ9MJ3DJ3DJ3DJ3DJ3DJ3DJ3DJ3DJ3DJhDJ3DJnCJ3IJnCJn6BJnBJtJJhEJnFJHJ3FJ3CJnEJHJnuiBJnVJnBJnGJXJ3CJ3MJ34UJnsBJnkCJHJ9YJhEJ9BJxEJ3IJ3KJ3DJ3LJnDJHTtCJnNJnDJ3UJ3CJ3HJnCJ3BJnLJ3uQJnpCJ3CJnEJ3QJ37XJ12CxBhqCJnNJ3PJ4HJ2aJ30EJ",!0)),Nl:()=>new g(m("u3FCBwzCiBBDDB-zDaaBHBPCBs1dJBxyW0BBtOJJnEEBrhIuDBm8SCB",!1)),No:()=>new g(m("yFBBGDDBBB2pCFB5LFB5DCBmEGB6GGBSIByNJB2hBTB0jBJBhP20B20BEFBHJBnGPBqB3W3WB6BBvCVB3TdBqrB1kB1kBBCBrEJBfHBCOBhBJBoBOBxrdFBymWsBBiCDBSBB2KaBlBDB1pBHBaGBoBIBsCEBXFBhFBBDPBDtBBhCIB1BBBfCBsCEBpDHBZHBqBGBrKFBhLeB-EJBrBDBxDGBnETB8LTBmqBBBvNIBobSB0aUBn8SGB-YWBqhZTBNTBtDYBvqFIBid6BBCCBCDBtCsBBCOBjeMB",!1)),P:()=>new g(m("hBCBCFBCDBLBBEBBbCBCccCkBkBGEELBBEEE-VJJzOFBqBBB0BCCDDDtBBBVBBCBBOCCBBBrCDBnDsBsBBMBqHCB3BOBgBmImIBLLtE5D5D6DnMnMNwLwL7CLLBpFpFBNBCmBmBBCBoCrCrCBDBFBBwDFBsFlTlTBHB4EuTuTtBBBvCCBoCBB+ECBCCBmBKB6JBB5GBBhEGBCFBhFBBLGBdCB9DDB8BEB-BBBhCHBM9Z9ZBWBJTBCMBCLBfBBPBB6TDBeBB+hBNBwCBBgBJB0MVBgCDBhBBB8XDBCBBxDwEwEBtBBCfBDLBkNCBFJBDLBRNNjD7C7CjgdBBuICBkDLL0DFB9LDB3CBBpBCBCyByBBwBwBiDMBRBB9DDB-DBBRBB6HzqUzqUBxGxGBIBXiBBCNBCFFCBB2ECBCFBCDBLBBEBBbCBCccCCCBFB7MCB9UxBxB-MoXoXoGgBgBxIIBnBxDxDBFBjCGB6CDByO-J-JjBlElEBDBtBDB+FGBuDBBCDB-DDBxBBBwCDBFOOCCB5CFBsDrJrJBCCBzDzDBDBLBBCpDpD7HWBqDCBdMBtCjEjEBBB9HpIpIBBB8E9C9CBGB0CCBCEB+CJB4GgDgDBDBrBBBmUBBrCMBwFxjBxjBBDB97CBB8zOBBmEiCiCBDBJpRpRBBBoJDBoK9lT9lTovHEB07C-a-aBAB",!1)),Pc:()=>new g(m("-Cg-Hg-HBUU-u3BBBZCBwHAB",!1)),Pd:()=>new g(m("tB9qB9qB0BiyDiyDmgBqgCqgCBEBiwDDDgBBBFdd-NUUwDxszBxszBBmBmBLqFqFhzD-J-J",!1)),Pe:()=>new g(m("pB0B0BgB+1D+1DC-6B-6BqtC4B4BQ7T7TCff-hBMCxChBhBCGC1MUChCCCiBmhBmhBCECtBGCtNICEGCDBB-ozB6G6GeOCESSCCCrF0B0BgBGD",!1)),Pf:()=>new g(m("7F+6H+6HEddpuDCCFDDQEE",!1)),Pi:()=>new g(m("rFt7Ht7HDBBDaapuDCCFDDQEE",!1)),Po:()=>new g(m("hBCBCCBDECBLLBEEBcclCGGPBBI-V-VJzOzOBEBqB3B3BDDDtBBBVBBCBBOCCBBBrCDBnDsBsBBMBqHCB3BOBgBmImIBLLtE5D5D6DnMnMNwLwL7CLLBpFpFBNBCxDxDrCEBFBBwDFBsFlTlTBHBmY9D9DBBBoCBB+ECBCCBmBFBCDB6JBB5GBBhEGBCFBhFBBLGBdCB9DDB8BEB-BBBhCHBMjajaBJJBGBJIBDDBDCBEKBCCCBIB7kDDBCBBxDwEwEBFFBBBDDDBHBCBBCDDBLLBDBCJBDDBCCCBLBDCBtNCB6B+F+FjgdBBuICBkDLL0DFB9LDB3CBBpBCBCyByBBwBwBiDMBRBB9DDB-DBBRBB6HlxUlxUBFBDXXVBBDDBECBCDBICBHCCB2E2EBBBCCBDECBLLBEEBcclBDDB7M7MBBB9UxBxB-MoXoXoGgBgBxIIBnBxDxDBFBjCGB6CDB0ZlElEBDBtBDB+FGBuDBBCDB-DDBxBBBwCDBFOOCCB5CFBsDrJrJBCCBzDzDBDBLBBCpDpD7HWBqDCBdMBtCjEjEBBB9HpIpIBBB8E9C9CBGB0CCBCEB+CJB4GgDgDBDBrBBBmUBBrCMBwFxjBxjBBDB97CBB8zOBBmEiCiCBDBJpRpRBBBoJDBoK9lT9lTovHEB07C-a-aBAB",!1)),Ps:()=>new g(m("oBzBzBgB-1D-1DC-6B-6B-rCEEnB4B4BQ7T7TCff-hBMCxChBhBCGC1MUChCCCiBmhBmhBCECaTTCECtNICEGCDipzBipzB4GeeCMCESSCCCrFzBzBgBEEDAB",!1)),S:()=>new g(m("kBHHRCBgBCCcCCkBEBCBBDCCBCBDEEfgBgBrODBNNBGGBCCCBPB2DPPBxDxDsErIrIBBB3DCBDDDBvGvGLUUB4H4HIBBpEqLqLBHHB2H2H-DjEjEBGBlEwGwGqBmGmGiGCBQCCBBBDFBVECmEHBCFBCBBGDBmGBBxXJB0WuLuLlL+E+EBgBBiLJBKIBhiBCCBBBMCBOCBOCBOBBmCOOoBCBOCBUhBB-BBBCDBCBBLCCBBBGFBCECFMMBFFBDBGDBC7B7BBFFB2LBFcBD+HBXKByCtCBXnTBtBwBBDeBLyMBX+BBFfBD1LBDpEBmHFBmLBBvBZBC4CBN1GBbPBFOOBNNWBBHBB8CBB0HBBFJBhBlBBKRRBdBMdBJQQBeBLmBBQ-JBhuG-BBx0V2BB6RWBKBBoDBB+EDBLDB+RCBiHPPB+9T+9TpEgBBuLPBhCBB3BHBtBDBjDCCBBBD7E7EHRRBBBgBCCcCCiEGBCGBOBB6JIB6BQBDCBCMBEwBwBBrBB7zBBBwSmWmWBiKiKBGBnjC2kC2kCBbBr6SDBG3qU3qUk7DvHBLCBEzNBHWBQQBgDzDB9B1HBLmBBD7BBGCBXBBIdBF8BBWhCBE7F7FB1CBrbaagBaagBaagBaagBaa9B-PB4BDBzBHBCNBCBBp2BwNwNttCEE+DiOiOBvIvIBqBBFjDBNOBDOBCOBCkBBYgFB5BcBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBC7CBLAB",!1)),Sc:()=>new g(m("kB+D+DBCBqnB8D8DzPBBzPBBI2H2HoImSmS8sClmClmCBgBB37hBkuVkuVtD7E7E8GBBEBB3-HDB-4wBxtCxtC",!1)),Sk:()=>new g(m("+CCCoCHHFEEqQDBNNBGGBCCCBPB2DPPBjoBjoB15FCCBBBMCBOCBOCBOBB9kEBBkzdWBKBBoDBBxePPBniUniUBPB8bCCjF4g9B4g9BBDB",!1)),Sm:()=>new g(m("rBRRBBB+BCCuBFFmBgBgB-XwQwQBBB8xGOOoBCBOCBsEoBoBBDBHlClCBDBGBBFGDIgBgBBDDCgBgBBqIBhBBB7CffBXBpBFB2OKK3BHBwDxKxKBDBDeBLPBhIiEBX+BBFfBDhIBxBUBDFB9+zB5Z5ZCCBlFRRBBB+BCCkEHHBCBitDBBhrwBx+Bx+BagBgBagBgBagBgBagBgBat5Ft5FB-uC-uCBHB",!1)),So:()=>new g(m("mFDDFCCyerIrIBgEgEBvGvGLUUB4H4HkQ2L2LjEFBClElEwGqBqBoMCBQCCBBBDFBVECmEHBCFBCBBGDBmGBBxXJB0WzWzW+EhBBiLJBKIBksBBBCDBCBBLCCBHHBEBCECFMMBPPCBBC7B7BBKKBDBDDBCBBCBBCGBCeBDBBCCCBdBtIHBFTBDGBDwCBCdBanBBHnCBXKByCtCBX2FBCIBC1BBJuDBC3HBtBrBBhC-HBhQvBBWBBHmBBDpEBmHFBmLBBvBZBC4CBN1GBbPBFOOBNNWBBHBBxKBBFJBhBlBBKRRBdBMdBJQQBeBLmBBQ-JBhuG-BBx0V2BBibDBLBBC+R+RBBBqqUPBuLPBhCBB3BHBuBCBlPEEFBBOBB6JIB6BQBDCBCMBEwBwBBrBB7zBBBwSpgBpgBBGBnjC2kC2kCBGBFQBr6SDBG3qU3qUk7DvHBLCBEzNBHWBQPBhDzDB9B1HBLmBBD7BBGCBXBBIdBF8BBWhCBE7F7FB1CBqlB-PB4BDBzBHBCNBCBBp2B96C96CiEyWyWBqBBFjDBNOBDOBCOBCkBBYgFB5BcBOrBBFIBIBBPFB7E6HBG4WBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBB-B3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBC7CBLAB",!1)),Z:()=>new g(m("gBgEgEgvFgsCgsCBJBeBBGwBwBh9DAB",!1)),Zl:()=>new g(m("ohIA",!0)),Zp:()=>new g(m("phIA",!0)),Zs:()=>new g(m("gBgEgEgvFgsCgsCBJBlBwBwBh9DAB",!1)),ASCII_Hex_Digit:()=>new g(m("wBJIFbF",!0)),Alphabetic:()=>new g(m("hCZBHZBwBLLFGGBVBCeBCpOBFLBPEBICC3CeeBQBCBBDDBCHHCCBCCCBSBCyCBCqEBJlFBClBBDHHBnBBoBNBCCCBCCBCCJaBFDBeKBG3BBCGBPlDBCHBFHBFCBLCBDRRBuBBOkDBZgBBKBBFGGBWBDSBUYBIKBGXBCGBIJJBoBBLLBEGBHrCBCPBCCBFOBOSBCHBDBBDVBCGBCEEBCBEHBDBBDBBCJJFBBCEBNBBLFFBBBCFBFBBDVBCGBCBBCBBCBBFEBFBBDBBFIIBCBCSSBEBMCBCIBCCBCVBCGBCBBCEBEIBCCBCBBEQQBCBWDBFCBCHBDBBDVBCGBCBBCEBEHBDBBDBBKBBFBBCEBORRBCCBEBECBCDBEBBCCCBEEBEEBBBELBFEBECBCCBEHHpBMBCCBCWBCPBEHBCCBCCBJBBCCBCBBDDBdDBCHBCCBCWBCJBCEBEHBCCBCCBJBBGCBCDBOCBNMBCCBCoBBDHBCCBCCBCGGBCBIEBXFBCCBCRBEXBCIBCDDBFBJFBCCCBGBTBBO5BBGGBH0B0BBECBDBCXBCCCBRBCCBDEBCHHPDBhBgCgCBGBCjBBFSBFPBCjBBkC2BBCDDBDBR-BBLDBDlBBCGGDqBBCsKBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBmBPBR1CBDFBErTBDQBCZBGqCBEKBITBMUBNTBNMBCCBCBBNzBBDSBPFFkC4CBIqBBGlCBLeBCLBFIBYdBDEBMrBBFZB3BbBF+BBDTBzBYYBMMBBByBzBBCOBCHB0BpBBDDBLrBBCKBP2BBXCBLjBBDKBGqBBDCBqBDBCFBCBBEGGB+FBUhBBM1IBDFBDlBBDFBDHBCGCBdBD0BBCGBCEEBBBCGBEDBDFBFMBGCBCGB1DOORMBmDFFDJBCEEBDBHGCBCBCKBDDBGEBFSSBnBBuZzBB34BkHBHDBEBBNlBBCGGD3BBIRRBVBKGBCGBCGBCGBCGBCGBCGBCGBCfBwB2O2OBBBaIBIEBDEBF1CBHCBC5CBCDBGqBBC9CBSfBxBPBhQ-tGBhCs0VBkCtBBDsIBEPBLBBVuBBGHBEwDBoBIBDmDBDxCBVUBCgBBZzBBNjCBCtBtBBEBECCBBBLgBBGiBBOcBEyBBCLBQRRBOBLEBC2BBKNBTWBEkCBCCCZCBDPBDDBMFBDFBDFBKGBCGBCqBBCNBH6DBWj9KBNWBFwBBloItLBDpDBnBGBNEBGLBCMBCEBCCCBCCBCCBqDBiBqLBT-BBD1BBpBLB1DEBCmEBlBZBHZBM4CBEFBDFBDFBDCBkBLBCZBCSBCBBCOBDNBjB6DBmC0BBsIcBEwBBwBfBOdBGqBBGdBDjBBFHBCEBrB9EBTjBBFjBBFnBBJzBBNKBCOBCGBCBBCKBCOBCGBCBBEzBBN2JBKVBLHBZFBCpBBCIBmCFBDCCBqBBCBBEDDBVBLWBKeBiCSBCBBLVBLZBHZBnB3BBHBBhCDBCBBGHBCCBCcBrBcBEcBkBHBCbBc1BBLVBLSBORBvDoCB4ByBBOyBBOnBBjBbBEGGBVB7HpBBCBBEBBRFBzBCBEcBLJJBUBrBRBvBUBcWBKlCBsBEBL4BBKOOBXBYyBBSDBJiBBEKKB+BBCDBKBBLCCkBRBChBBDHHBCB-BGBCCCBCBCOBCJBI4BBYDBCHBDBBDVBCGBCBBCEBEHBDBBDBBEHHGGBdJBCDDClBBCJBCDDCDBCBBECCtBhCBCCBCDBVCBfhCBDBBC5F5FB0BBDGBaFBjB+BBCEE8B1BBDoCoCBZBDNBWGB6F4BBoD-BBgBHBDDDBGBCBBCdBCBBDBBDDB+CHBDtBBDFBCCCBccBxBBDJBSnCBGTTBnCBoDHB5CgBBgBIBCsBBCGBCyByBBcBDVBCNBqCGBCBBCrBBECCBCCBBBCDDBZZBEBCBBCkBBCBBCDBCYYBqBBlIWBKQBCoBBECBwDwCwCB4cBnDuDBSjGBtyCgDBQvhBBSFBa68DBGmSB61GuBBy2B4RBIeBSuCBSdBTvBBRDBgBUBGSBxNsBB0G-BBhBYBDYBtBqCBF4BBIQBhCBBCNNBFBK1mHBqBfBiDyDB+vIDBCGBCBBCiJBQeeBBBDPPBCBJrMBloCqDBGMBEIBIJBFi7Fi7FBzCBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDYBCYBCeBCYBCeBCYBCeBCYBCeBCYBCHB15BeBHFB2GGBCQBDGBCBBCEBG9BBiBxDxDBrBBLGBRiKiKBcBTrBBlPbBlHdBDwGwGBdBCVBJBBhHGBCDBCBBCOBCkGB8BjCBEEE1lBDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1TZBHZBHZB3zD-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Dash:()=>new g(m("tB9qB9qB0BiyDiyDmgBqgCqgCBEB+BoBoBQnMnMlgDDDgBBBFdd-NUUwDxszBxszBBmBmBLqFqFhzD-J-J",!1)),Emoji:()=>new g(m("jBHHGJBwDFFu8HNN5GXX7CFBQBBwLBBNnFnFaKBFCBoGoHoHBLLK7B7BBCBCEBKGDBDDFDDCBBDIEBJJBBBGCCGLBMBBDCCBCCTDDBTTBEBCCCBEEBGGDBBFBBMBBGBBDGGBECBVVBGGBEBCDBDFFDDDBEBCDDCCCHEEHLLBQQDFFCFFBBBCMMBxBxBBBBKeP1LBBwOCBUBB0BFF7mBNN6SCCrrvDrGrGhFBBNBBPDDBIBsCZBCBBYVVDIBWBBvFhBBDvDBDBBCCBDyCBDCBCmIBC+BBMFBCXBIBBDHBNDDBCBDFFBOOBDDJBBKGGBBBNCBJCBDCCFHHEHHB0CBxBlCBGHBDDBEJBECCBEEDJBkHLBF8I8IBtBBCJBC4FBxDMBEKBE4BBCFFBOBDLBFJB",!1)),Emoji_Component:()=>new g(m("jBHHGJB0+H2G2Gsp3B3+8B3+8BBYB8PEBxtBDBtzhY-CB",!1)),Emoji_Modifier:()=>new g(m("7-8DE",!0)),Emoji_Modifier_Base:()=>new g(m("9wJ8G8GRDB4jzD9B9BBBBDDDBBB2DBBDKBWSBEFFBBBCCBICCZqGqGBFFWFFBvFvFBBBEEB0CRRBBBKMMgSDDJHBHKKBIBDCB5B+B+BBCCBCCSCBCMBmHCBrBIB",!1)),Emoji_Presentation:()=>new g(m("64IBBuGDBEDDqQBBWBBzBLBsBUUOJJBSSBGGBJJGWWIBBCFFDIIFBBdkBkBCFFBBBC+B+BBBBZPP8aBB0BFFvlxDrGrG-FDDBIBsCZBCZZVDDBDBCCBWBBvFgBBNIBClCBCVBNqBBFEBNQBEEEBlCBCCCB5FBD+BBODBCXBTbbBOO3C0CBxBlCBHEEBBBDDBEDBMBBIIBkHLBF8I8IBtBBCJBC4FBxDMBEKBE4BBCFFBOBDLBFJB",!1)),Extended_Pictographic:()=>new g(m("pFFFu8HNN5GXX7CFBQBBwLBBNnFnFaKBFCBoGoHoHBLLK7B7BBCBCEBKGDBDDFDDCBBDIEBJJBBBGCCGLBMBBDCCBCCTDDBTTBEBCCCBEEBGGDBBFBBMBBGBBDGGBECBVVBGGBEBCDBDFFDDDBEBCDDCCCHEEHLLBQQDFFCFFBBBCMMBxBxBBBBKeP1LBBwOCBUBB0BFF7mBNN6SCCrrvDoBoBBCBlDLBQBBQPPBmBmBBIBxDBBNBBPDDBIBU3BBcOBLVVDIBCDBKWBH7FBDvDBDBBCCBDyCBDCBCDBG9HBC+BBMFBCXBIBBDHBNDDBCBDFFBOOBDDJBBKGGBBBNCBJCBDCCFHHEHHB0CBxBlCBGHBDQBECCBEBDMB7GlBBNDB5BHBLFBpBHBfBBNDBDNBKmBBNuBBCJBC4FB5CHBPxEBhI9fB",!1)),Hex_Digit:()=>new g(m("wBJIFbFq1-BJIFbF",!0)),Lowercase:()=>new g(m("hDZBwBLLFlBlBBWBCHBC2BCBQCBuBCDECBBBDCCDEEBFFDEEBBBDDDCCCDCCBCCDEECDDBDDBBBHGDCOCBSCBDDCEEC4BCBFBDDDBCCFICBjCBDiBBIBBfEBhDsBsBCEEDDBTccBhBBCBBECBCWCBDBCGDB0B0BBuBBCgBCK0BCDMCBgDCxBoBBo6CqBBCDB5XFBjkCIBC2D2DB+FBiC0ECBHBCgDCBHBJFBLHBJHBJFBLHBJHBJNBDHBJHBJHBJEBCBBHEEBBBCBBJDBDBBJHBLCBCBB6DOORMBuDEEBEEcKFDBBJDBFiBiBBOBFsasaBYBn6BvBBCEEBGCFCCBCCBGBEiDCBIICFFNlBBCGG0oesBCUaCBBBmEMCBBBC8BCBIBCCCDICFCCDCCBBBCSCGGGCMCFCCDOCWDBCCCBBB2ZqBBCNBHvCBh6TGBNEBqhBZBumBnBBpEjBB8EKBCOBCGBCBBkODDBBBCpBBCIBmoByBB+DVB75CfBhsVfB8BYBnqZZBbGBCRBbZBbDBCCCBFBCKBbZBbZBbZBbZBbZBbZBbZBbZBbbBdYBCFBbYBCFBbYBCFBbYBCFBbYBCFBC15B15BBIBCTBHFBmI9BB1lChBB",!1)),Math:()=>new g(m("rBRRBBBgBeeCuBuBFmBmBgB5W5WBBBDbbBDDBBBwQCBuwGccBBBMEEOPPBCBWEBMEBiCMBFEEBFFBDBTFFDJBCDDBEBHEEBDDBCCBBBCFBENBClClCBWBCFBCBBFBBFfBCHHBPPBqIBJDBVBB7CffBZBCZZMGB+NBBNJBFFBFBBDBBEEBPCCDFBMHBGBB6BCCeDBKCBxK-BBhI-PBxBUBDFB9+zB4Z4ZBEBCjFjFRCBeCCeCCkEHHBCBitDBBhrwBwoBwoBBzCBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBDxBBhwFDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBB-uCIB",!1)),Quotation_Mark:()=>new g(m("iBFFkEQQ96HHBaBBowDqOqOBCBOCBixzBDB+FFF7CBB",!1)),Terminal_Punctuation:()=>new g(m("hBLLCMMBEE-ZJJiQ6B6BpCPPCCB1FsBsBBJBCsHsHB3B3BBEBCHBgBmImIB1nB1nBBtFtFFFB4JBB2YHBmY9D9DBBBoCBB+ECBEoBoBBCBDBB7JBBjLDBjFBBLBBCCBeCB8FEB-BBBldYYBKKBBBwlDCBzJOOFLLCBBEBBtNBB8ndBBuICBkHEB-LBB3CBBgD4E4EBBB0ECBgERRB6H6HnxUDDB6B6BBBBCDBqFLLCMMBEEiCDD7hBxBxBnkBoGoG3JBB5EFBlCFB6CDB5dEBtBDB+FGBxDDBgECBiEBBHRRB5C5CBDBtDrJrJB2D2DBBBNBBnLDBEOBqDBB6HCBmQCC8HBB4CBBFBB-MCBuBmUmUBrCrCBspBspBBDB6vRBBmEiCiCBBBLqRqRBoJoJBnwTnwTovHDB",!1)),Uppercase:()=>new g(m("hCZBmDWBCGBiB2BCDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIJDCMCDQCDDDCCBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBDDBBBEWCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBpCDBNDBNDBNEBMDBnIFFECBDCBDEEBDBHGCBCBDDBLBBGbbBOBUzZzZBYBx5BvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoqZZBbZBbZBbCCBGDBDDBCBCHBbZBbBBCDBDHBCGBcBBCDBCEBCEEBFBcZBbZBbZBbZBbZBbZBfYBiBYBiBYBiBYBiBYBiB2pE2pEBgBBvgCZBHZBHZB",!1)),White_Space:()=>new g(m("JEBTlDlDbgvFgvFgsCKBeBBGwBwBh9DAB",!1))});static SCRIPTS=new Ko({Adlam:()=>new g(m("go6DrCFJFB",!0)),Ahom:()=>new g(m("g4lCaDOFW",!0)),Anatolian_Hieroglyphs:()=>new g(m("ggxCmS",!0)),Arabic:()=>new g(m("gwBEBCFBCNBCCBCfBCJBMZBCrDBChBBxCvBBxHhBBGqCBCcBxy8BtPBDvEBhBPBxDEBCmEBk7DeBkCFBJIBiBFBh43BDBCaBCBBCDDCJBCDBCCCHFFCECBBBCBBCDDCICBCCDDBCGBCDBCDBCCCBIBCQBGCBCEBCQB1BBB",!1)),Armenian:()=>new g(m("xpBlBDxBDCks9BE",!0)),Avestan:()=>new g(m("g4iC1BEG",!0)),Balinese:()=>new g(m("g4GsCCxB",!0)),Bamum:()=>new g(m("g1pB3CpowB4R",!0)),Bassa_Vah:()=>new g(m("w26CdDF",!0)),Batak:()=>new g(m("g+GzBJD",!0)),Bengali:()=>new g(m("gsCDBCHBDBBDVBCGBCEEBCBDIBDBBDDBJFFBCCBDBDYB",!1)),Beria_Erfe:()=>new g(m("g17CYDY",!0)),Bhaiksuki:()=>new g(m("ggnCICsBCNLc",!0)),Bopomofo:()=>new g(m("qXB6wLqBxDf",!0)),Brahmi:()=>new g(m("ggkCtCFjBKA",!0)),Braille:()=>new g(m("ggK-H",!0)),Buginese:()=>new g(m("gwGbDB",!0)),Buhid:()=>new g(m("g6FT",!0)),Canadian_Aboriginal:()=>new g(m("ggF-TxRlC7tgCP",!0)),Carian:()=>new g(m("g1gCwB",!0)),Caucasian_Albanian:()=>new g(m("wphCzBMA",!0)),Chakma:()=>new g(m("gokC0BCR",!0)),Cham:()=>new g(m("gwqB2BKNDJDD",!0)),Cherokee:()=>new g(m("g9E1CDFz7lBvC",!0)),Chorasmian:()=>new g(m("w9jCb",!0)),Common:()=>new g(m("AgCBbFBbuBBCOBCEBYgBgBiOmBBGEBDTB1DKKHCC+THHPEEhB9E9ElQiEiEB6mB6mB2MDBjJwvBwvBBBBoCBBsGBBCumBumBOIIBCBCFBCCBDmYmYBKBD2CBCKBEKBCOBShBB-BlBBCCBDFBCaBCQBqBCBF5UBXKBW-cBhIzTBDpEBhQ9CBzMUBCCCBXBQHBFDB8CBBE7C7CB0E0EBOBhBlBBKxBxBB+BBgBwCBwB5C5CBmFBhuG-BBhoWhBBnDCBmFJB1HhFhFsMPPBzuUzuUBxGxGBIBXiBBCSBCDB0ECCBeBbFBbKBLuBuBBhChCBFBCGBLEBjICBFsBBEIBxCMB0BsBBlHaBltuBDB96D8HBEzNBHWBQQBgDzDB9B1HBLmBBD9BBEQBJBBIdBF8BB2GTBNTBN2CBKYBoE0CBCmCBCBBDDDBDDBCBCLBCCCBFBCgCBCDBDHBCGBCbBCDBCEBCEEBFBCzKBDjJBDxBByjFjCBtC8BBjWrBBFjDBNOBDOBCOBCkBBLtFB5BZBCBBOrBBFIBIBBPFB7E4eBEQBEMBE5GBHLBFQQBKBF3BBJJBHnBBJdBDLBFBBPIBoB3KBJNBDMBEKBE4BBCFFBOBDLBFJBIyEBCmDBnghYffB+CB",!1)),Coptic:()=>new g(m("ifNxkKzDGG",!0)),Cuneiform:()=>new g(m("ggoC5cnDuDCEMjG",!0)),Cypriot:()=>new g(m("ggiCFBDCCBqBBCBBEDD",!1)),Cypro_Minoan:()=>new g(m("w8rCiD",!0)),Cyrillic:()=>new g(m("ggBkEBDoFBx6FKBhFtCtCojEfBhie-CBv8VBBhw4B9BBiBAB",!1)),Deseret:()=>new g(m("gghCvC",!0)),Devanagari:()=>new g(m("goCwCFODZh7nBfhwcJ",!0)),Dives_Akuru:()=>new g(m("gomCGBDDDBGBCBBCdBCBBDLBKJB",!1)),Dogra:()=>new g(m("ggmC7B",!0)),Duployan:()=>new g(m("ggvDqDGMEIIJDD",!0)),Egyptian_Hieroglyphs:()=>new g(m("ggsC1iBL68D",!0)),Elbasan:()=>new g(m("gohCnB",!0)),Elymaic:()=>new g(m("g-jCW",!0)),Ethiopic:()=>new g(m("gwEoCBCDBDGBCCCBCBDoBBCDBDgBBCDBDGBCCCBCBDOBC4BBCDBDiCBDfBEZBnvGWBKGBCGBCGBCGBCGBCGBCGBCGBjpfFBDFBDFBKGBCGBylvCGBCDBCBBCOB",!1)),Garay:()=>new g(m("gqjClBEcJB",!0)),Georgian:()=>new g(m("glElBBCGGDqBBCDBx8CqBBDCBhiElBBCGG",!1)),Glagolitic:()=>new g(m("ggL-Ch9sDGCQDGCBCE",!0)),Gothic:()=>new g(m("w5gCa",!0)),Grantha:()=>new g(m("g4kCDBCHBDBBDVBCGBCBBCEBDIBDBBDCBDHHGGBDGBEEB",!1)),Greek:()=>new g(m("wbDBCCBDDBCFFCCCBBBCCCBSBC+BBPPBnpGEBzBEBFEB1ChKhKBUBDFBDlBBDFBDHBCGCBdBD0BBCOBCNBDFBCSBDCBCIBoJ-xiB-xiB7uVuCBSgj0Bgj0BBkCB",!1)),Gujarati:()=>new g(m("h0CCBCIBCCBCVBCGBCBBCEBDJBCCBCCBDQQBCBDLBIGB",!1)),Gunjala_Gondi:()=>new g(m("grnCFCBCkBCBCFIJ",!0)),Gurmukhi:()=>new g(m("hwCCBCFBFBBDVBCGBCBBCBBCBBDCCBDBFBBDCBEIIBCBCIIBPB",!1)),Gurung_Khema:()=>new g(m("go4C5B",!0)),Han:()=>new g(m("g0LZBC4CBN1GBwBCCaIBPDBle-tGBhC-vUBhoWtLBDpDBpodBBNGBqgkB-2pBBhB9oEBDt0FBDwpHBQtTBjtC9QBjvBq6EBGppIB",!1)),Hangul:()=>new g(m("goE-HvxHBiI9CyDeiCei3dckUj9KNWFwBl9JeEFDFDFDC",!0)),Hanifi_Rohingya:()=>new g(m("gojCnBJJ",!0)),Hanunoo:()=>new g(m("g5FU",!0)),Hatran:()=>new g(m("gniCSCBGE",!0)),Hebrew:()=>new g(m("xsB2BBJaBFFBpp9BZBCEBCCCBCCBCCBIB",!1)),Hiragana:()=>new g(m("hiM1CBHCBi7-C+IBTeeBBBulQAB",!1)),Imperial_Aramaic:()=>new g(m("giiCVCI",!0)),Inherited:()=>new g(m("gYvDB2IBBlOKBbhXhXBCB8qEtBBDLBlPCBCMBCGBFHHEBBnG-BBtQBBjGgBB65DDBsDBBmrzBPBRNBwejHjH7iEl+uBl+uBBsBBDWBhRCBSHBDGBfDBz6rYvHB",!1)),Inscriptional_Pahlavi:()=>new g(m("g7iCSGH",!0)),Inscriptional_Parthian:()=>new g(m("g6iCVDH",!0)),Javanese:()=>new g(m("gsqBtCDJFB",!0)),Kaithi:()=>new g(m("gkkCiCLA",!0)),Kannada:()=>new g(m("gkDMCCCWCJCEDICCCDIBGCCDDJCC",!0)),Katakana:()=>new g(m("hlM5CBDCBxHPBxGuBBC3CBvgzBJBCsBBzisBDBCGBCBBCgJgJBBBzBPPBCB",!1)),Kawi:()=>new g(m("g4nCQCoBEc",!0)),Kayah_Li:()=>new g(m("goqBtBCA",!0)),Kharoshthi:()=>new g(m("gwiCDCBGHCCCcDCFJII",!0)),Khitan_Small_Script:()=>new g(m("k-7C84G84GB0OBqBAB",!1)),Khmer:()=>new g(m("g8F9CDJHJnPf",!0)),Khojki:()=>new g(m("gwkCRCuB",!0)),Khudawadi:()=>new g(m("w1kC6BGJ",!0)),Kirat_Rai:()=>new g(m("gq7C5B",!0)),Lao:()=>new g(m("h0DBBCCCBDBCXBCCCBVBDEBCCCBFBCJBDDB",!1)),Latin:()=>new g(m("hCZBHZBwBQQGWBCeBCgOBoBEB8wGlBBHwBBGDBGMBClCBiC-HByLOORMBuEBBHccSoBB42CfBj1elDBExCBVOBxZqBBCIBCDB38TGB7gBZBHZBmhCFBCpBBCIBm61BeBHFB",!1)),Lepcha:()=>new g(m("ggH3BEOEC",!0)),Limbu:()=>new g(m("goGeBCLBFLBFEEBKB",!1)),Linear_A:()=>new g(m("gwhC2JKVLH",!0)),Linear_B:()=>new g(m("gggCLCZCSCBCODNjB6D",!0)),Lisu:()=>new g(m("wmpBvBx1eA",!0)),Lycian:()=>new g(m("g0gCc",!0)),Lydian:()=>new g(m("gpiCZGA",!0)),Mahajani:()=>new g(m("wqkCmB",!0)),Makasar:()=>new g(m("g3nCY",!0)),Malayalam:()=>new g(m("goDMCCCyBCCCFFPDZ",!0)),Mandaic:()=>new g(m("giCbDA",!0)),Manichaean:()=>new g(m("g2iCmBFL",!0)),Marchen:()=>new g(m("wjnCfDVCN",!0)),Masaram_Gondi:()=>new g(m("gonCGBCBBCrBBECCBCCBHBJJB",!1)),Medefaidrin:()=>new g(m("gy7C6C",!0)),Meetei_Mayek:()=>new g(m("g3qBWqGtBDJ",!0)),Mende_Kikakui:()=>new g(m("gg6DkGDP",!0)),Meroitic_Cursive:()=>new g(m("gtiCXFTDtB",!0)),Meroitic_Hieroglyphs:()=>new g(m("gsiCf",!0)),Miao:()=>new g(m("g47CqCF4BIQ",!0)),Modi:()=>new g(m("gwlCkCMJ",!0)),Mongolian:()=>new g(m("ggGBBDCCBSBH4CBIqBB2t-BMB",!1)),Mro:()=>new g(m("gy6CeCJFB",!0)),Multani:()=>new g(m("g0kCGBCCCBCBCOBCKB",!1)),Myanmar:()=>new g(m("ggE-EhqmBeiDfxibT",!0)),Nabataean:()=>new g(m("gkiCeJI",!0)),Nag_Mundari:()=>new g(m("wm5DpB",!0)),Nandinagari:()=>new g(m("gtmCHDtBDK",!0)),New_Tai_Lue:()=>new g(m("gsGrBFZHKEB",!0)),Newa:()=>new g(m("gglC7CCE",!0)),Nko:()=>new g(m("g+B6BDC",!0)),Nushu:()=>new g(m("h-7CvsQvsQBqMB",!1)),Nyiakeng_Puachue_Hmong:()=>new g(m("go4DsBENDJFB",!0)),Ogham:()=>new g(m("g0Fc",!0)),Ol_Chiki:()=>new g(m("wiHvB",!0)),Ol_Onal:()=>new g(m("wu5DqBFA",!0)),Old_Hungarian:()=>new g(m("gkjCyBOyBIF",!0)),Old_Italic:()=>new g(m("g4gCjBKC",!0)),Old_North_Arabian:()=>new g(m("g0iCf",!0)),Old_Permic:()=>new g(m("w6gCqB",!0)),Old_Persian:()=>new g(m("g9gCjBFN",!0)),Old_Sogdian:()=>new g(m("g4jCnB",!0)),Old_South_Arabian:()=>new g(m("gziCf",!0)),Old_Turkic:()=>new g(m("ggjCoC",!0)),Old_Uyghur:()=>new g(m("w7jCZ",!0)),Oriya:()=>new g(m("h4CCCHDBDVCGCBCEDIDBDCICFBCEDR",!0)),Osage:()=>new g(m("wlhCjBFjB",!0)),Osmanya:()=>new g(m("gkhCdDJ",!0)),Pahawh_Hmong:()=>new g(m("g46ClCLJCGCUGS",!0)),Palmyrene:()=>new g(m("gjiCf",!0)),Pau_Cin_Hau:()=>new g(m("g2mC4B",!0)),Phags_Pa:()=>new g(m("giqB3B",!0)),Phoenician:()=>new g(m("goiCbEA",!0)),Psalter_Pahlavi:()=>new g(m("g8iCRIDNG",!0)),Rejang:()=>new g(m("wpqBjBMA",!0)),Runic:()=>new g(m("g1FqCEK",!0)),Samaritan:()=>new g(m("ggCtBDO",!0)),Saurashtra:()=>new g(m("gkqBlCJL",!0)),Sharada:()=>new g(m("gskC-ChsCH",!0)),Shavian:()=>new g(m("wihCvB",!0)),Siddham:()=>new g(m("gslC1BDlB",!0)),Sidetic:()=>new g(m("gqiCZ",!0)),SignWriting:()=>new g(m("gg2DrUQECO",!0)),Sinhala:()=>new g(m("hsDCBCRBEXBCIBCDDBFBEFFBEBCCCBGBHJBDCBt-gCTB",!1)),Sogdian:()=>new g(m("w5jCpB",!0)),Sora_Sompeng:()=>new g(m("wmkCYIJ",!0)),Soyombo:()=>new g(m("wymCyC",!0)),Sundanese:()=>new g(m("g8G-BhIH",!0)),Sunuwar:()=>new g(m("g+mChBPJ",!0)),Syloti_Nagri:()=>new g(m("ggqBsB",!0)),Syriac:()=>new g(m("g4BNC7BDCxIK",!0)),Tagalog:()=>new g(m("g4FVKA",!0)),Tagbanwa:()=>new g(m("g7FMCCCB",!0)),Tai_Le:()=>new g(m("wqGdDE",!0)),Tai_Tham:()=>new g(m("gxG+BCcDKHJHN",!0)),Tai_Viet:()=>new g(m("g0qBiCZE",!0)),Tai_Yo:()=>new g(m("g25DeCVJB",!0)),Takri:()=>new g(m("g0lC5BHJ",!0)),Tamil:()=>new g(m("i8CBBCFBECBCDBEBBCCCBEEBEEBBBELBFEBECBCDBDHHPUBm+kCxBBOAB",!1)),Tangsa:()=>new g(m("wz6CuCCJ",!0)),Tangut:()=>new g(m("g-7CgBgBB+3GBhQeBiDyDB",!1)),Telugu:()=>new g(m("ggDMCCCWCPDICCCDIBCCCBDDDJII",!0)),Thaana:()=>new g(m("g8BxB",!0)),Thai:()=>new g(m("hwD5BGb",!0)),Tibetan:()=>new g(m("g4DnCCjBFmBCjBCOCGFB",!0)),Tifinagh:()=>new g(m("wpL3BIBPA",!0)),Tirhuta:()=>new g(m("gklCnCJJ",!0)),Todhri:()=>new g(m("guhCzB",!0)),Tolong_Siki:()=>new g(m("wtnCrBFJ",!0)),Toto:()=>new g(m("w04De",!0)),Tulu_Tigalari:()=>new g(m("g8kCJBCDDClBBCJBCDDCDBCJBCBBJBB",!1)),Ugaritic:()=>new g(m("g8gCdCA",!0)),Unknown:()=>new g(m("4bBBHDBICCVuMuMnBBBzBBBE4B4BBGBcDBHKBvI9B9BBmDmDBMB8BBByBBBQddBCCMEBjBEBuHJJBDDBXXICCBBBFBBKBBDBBFHBCDBDGGBaaBEEHDBDBBXIIDGDBCCGDBDBBECBCGBFCCBFBSJBEKKEXXIDDGBBLIEBCCBNBFBBNGBIEEJBBDBBXIIDGGBKKBDDBEEBFBEDBDGGBTTBIBDHHBBBEFFBBBDCCDCBDCBECBNDBGCBEFFBCCBEBCNBWEBOEEYRRBKKEFFBFBDEEDBBFBBLGBXEEYLLGBBKEEFGBDEBEFFBLLELBOEE0BEEHDBRBBbEETCBZKKCBBICBCDBHCCJFBLBBELB7BDBekBBDCCGZZCYYBGGCIILBBFfBpClBlBBCBoBlBlBQOOBjBBnGCCBDBCBB6LFFBIICFFBqBqBFBBiBFFBIICFFBQQ6BFFBkCkCBhBhBBBBbFB3CBBHBB+UCB6CGBXIBZIBVLBOEEDLB-CBBLFBLFBbFB6CGBsBEBnCJBgBNNBCBNDBCCBrBBBGKBtBDBbFBMCB-BBBiCeeBMMBEBLFBPBBvBBBNTBuCnFnFBGB9BCBQCB-BEBsBBBMHBsBEB3QBBHBBnBBBHBBJGCgBBB2BQQPBBHUUBEEKmDmDNBBcOOBBBjBNBiBOBtEDB7UVBMUB14BBB-LEBuBCCBDBCBB5BGBDNBZIBI4BI-DhBBb6C6CBKB3GZBxC3C3CBoDoDBDBsB-C-C3CIBxBuzcuzcBBB4BIB9KTB5FHB+GTB9BCBLFB5BHBnCHBNFB1DKBfCBvCMMBCBiB4B4BBHBPBBLBBoDXBdJBHBBHBBHIBIII9BDB-DBBLFBl9KLBYDByBjoIBvLBBrDlBBILBGEBbGGCGDrUfBrBFB0BUUFDBGoEoEBCC-FCBHBBHBBHBBECBIIIBIBGBBNbbUDDQBBPhBB8DEBEDBuBCB5COOBBBCuBBvBhEBeCByBOBdDBlBIBfEBsBEBfmBmBBCBPpBB-EBBLFBlBDBlBDBpBHB1BKBNQQIDDMQQIDDBBB1BLB4JIBXJBJXBHrBrBKkCBHBBCtBtBDCBCBBYpCpCBGBKvBBUDDBDBiBCBcEBclBB5BDBVBBzBDDBDBJEEeBBEDBLGBKGBhCfBoBDBNIB3BCBeBBcEBbGBFLBIvCBqC2BB0BMB0BGBvBHBLFBnBCBeHBDvGBgBrBrBEBBDPBHHBKgBBvBHBrBVBblBBdTBYIBvCDBlBIBlCJBCBBaGBLFB2BTTBGBoBIBhDVVBJBTwBwBB8BBICCFQQMFB8BEBLFBFJJBDDBXXIDDGLLBDDBEEBCCBEBCEBIBBICBGKBLCCBCCnBLLCBBCFFLDDBGBDcB9CGGBcBpCHBLlFB3BBBnBhBBmCKBLFBOSB7BFBLFBVbBcBBQDBY4FB9BjDB0CLBJBBCBBJDDfDDBNNBHBLlCBJBBvBBBMaBpCHB0CMBqCGBL1CBJ3CBjBNBLFBKuBuBPJBeCBhBBBXPPBnCBIDDtBCBCDDKHBLFBHDDmBDDHGBLFBtBDBL1HBaGBSqBqBBBBe0CBCOBzBMB8clDBwDGGBJBlGryCBkDMB3iBJB88DEBoS41GB7Bl2BB6RGBgBLLBCByCLLBEBfBBHJBnCJBLIIWEBUvNB7BlGB8CEBaBBarBBsCDB6BGBS-BBGKBIIB3mHoBBhBgDB0D8vIBFIIDkJkJBNBCcBEBBCNBFHBtMjoCBsDEBOCBKGBLBBJ76DB+HCB1NFBYOBSOBvBBBYIB1D7BB3HJBoBBBjGUBnC5DBVLBVLB4CIBamEB2CoCoCDBBCBBDBBFNNCIIiCFFBJJIddFGGCCBI1K1KBlJlJB-V-VBNBGQQBuiBBgBFBH0GBISSBIIDGGBDB-BgBBCvDBuBCBPBBLDBD-JBgBQB7BEBCvOBrB1GBsBDBC-FBgBXXBGBD-GBIFFDQQmGBBRoBBtCDBLDBDwYBlCrCB+BhGBFccDCCBCCLFFCCCBEBCDBCECEDDCBBCICDCCBFFIKFCLLSEBEGGSzBBDtIBtBDBlDLBQBBQQQmBJBvF3BBeMBtBDBKGBDNBH5EB6eCBSCBOCB7GFBNDBCOBNDB5BHBLFBpBHBfBBNDBDNBKmBB5KHBPBBOCBMCB6BCCBCBRBBNDBLGB0EoDoDBjgBBh3pBfB-oEBBv0FBBypHOBvThtCB-QhvBBs6EEBrpIm8yVBCdBhD-DBxHvw-FB",!1)),Vai:()=>new g(m("gopBrJ",!0)),Vithkuqi:()=>new g(m("wrhCKCOCGCBCKCOCGCB",!0)),Wancho:()=>new g(m("g24D5BGA",!0)),Warang_Citi:()=>new g(m("glmCyCNA",!0)),Yezidi:()=>new g(m("g0jCpBCCDB",!0)),Yi:()=>new g(m("ggoBskBE2B",!0)),Zanabazar_Square:()=>new g(m("gwmCnC",!0))});static FOLD_CATEGORIES=new Ko({L:()=>new g(m("laA",!0)),LC:()=>new g(m("laA",!0)),Ll:()=>new g(m("hCZBmDWBCGBiBuBCEECDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIBBCBBCBBCOCDQCDBBCCCBBBC4BCIBBCBBDCCBCBCGC3HrBrBCEEJHHCCBCCCBCCBPBCIBkBJJCUCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBZHBJHBJHBJEBMEBMDBNEBMEBqJEEBHHxC9zC9zCBuBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoyehBB",!1)),Lt:()=>new g(m("kOCCBCCBCClBCCtsHHBJHBJHBMQQwBAB",!1)),Lu:()=>new g(m("hDZB7BqBqBBWBCHBCuBCEECDOCDsBCDECBBBDCCDEEGDDECBDDDCCCDFFDEECDDECCGBBCBBCBBCOCBSCDBBCEECkBCEQCJDDBCCFICBEBCBBCCCBEEBCCBCBCEBDCCBDDIDDCBBEFBGLLBnFnFsBCCEEEBBBvBDBCdBCBBECBCWCBDBCGD1BvBBCgBCK0BCDMCBgDCyBlBBq6CqBBDCB5XFBjkCIBCvHvHERRzD0ECGGGC8CCBHBJFBLHBJHBJFBMGCJHBJNBzBBBNSSBPPBEEpL2B2Bs1CvBBCEEBGCHDDLiDCJCCFNNBkBBCGG0oesBCUaCoEMCE8BCLCCDICFFFCBBDSCMOCFCCDOCb9a9advCBi8UZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBvyehBB",!1)),M:()=>new g(m("5cgBgBlgHAB",!1)),Mn:()=>new g(m("5cgBgBlgHAB",!1)),Emoji:()=>new g(m("8mJA",!0)),Extended_Pictographic:()=>new g(m("8mJA",!0)),Lowercase:()=>new g(m("hCZBmDWBCGBiBuBCEECDOCDuBCBECEBBCCCBCCBBBDDBCBBCCBEBBCBBCECBCCDCCBCCBBBCCCBEEIBBCBBCBBCOCDQCDBBCCCBBBC4BCIBBCBBDCCBCBCGCiJCCEJJHCCBBBCCCBCCBPBCIBkBJJCUCGDDCBBDyBBxBgBCK2BCBMCD+CCDlBBq6ClBBCGGzW1CB0kCHHBpBBDCBhK0ECKgDCKHBJFBLHBJHBJFBMGCJHBZHBJHBJHBJEBMEBMDBNEBMEBqJEEBHHuBPBUzZzZBYBx5BvBBxBCCBBBDGCBCBCDDJCBCgDCJCCFuqeuqeCqBCUaCoEMCE8BCLECBICFCCDCCEUCBDBCEBCOCBCBCCCBQCZs5Vs5VBYBmmBnBBpEjBB9EKBCOBCGBCBBr3ByBB+EVB75CfBhsVfBhCYBoyehBB",!1)),Math:()=>new g(m("ycGDCHHFMMDDDCHHFAB",!1)),Uppercase:()=>new g(m("hDZB7BqBqBBWBCHBCuBCEECDOCDsBCDECBBBDCCDEEGDDECBDDDCCCDFFDEECDDECCGBBCBBCBBCOCBSCDBBCEECkBCEQCJDDBCCFICBEBCBBCCCBEEBCCBCBCEBDCCBDDIDDCBBEFBGLLBnFnFsBCCEEEBBBvBDBCdBCBBECBCWCBDBCGD1BvBBCgBCK0BCDMCBgDCyBlBBq6CqBBDCB5XFBjkCIBCvHvHERRzD0ECGGGC8CCBHBJFBLHBJHBJFBMGCJHBJNBzBBBNSSBPPBEEpLiBiBBOBFsasaBYBn6BvBBCEEBGCHDDLiDCJCCFNNBkBBCGG0oesBCUaCoEMCE8BCLCCDICFFFCBBDSCMOCFCCDOCb9a9advCBi8UZBumBnBBpEjBB8EKBCOBCGBCBBk4ByBB+DVB75CfBhsVfB8BYBvyehBB",!1))});static FOLD_SCRIPT=new Ko({Common:()=>new g(m("8cgBgB",!1)),Greek:()=>new g(m("1FwUwU",!1)),Inherited:()=>new g(m("5cgBgBlgHAB",!1))})},J=class ct{static MAX_RUNE=1114111;static RUNE_ERROR=65533;static isUnsearchable(e){return e===ct.RUNE_ERROR||e>=ct.MIN_HIGH_SURROGATE&&e<=ct.MAX_LOW_SURROGATE}static MAX_ASCII=127;static MAX_LATIN1=255;static MAX_BMP=65535;static MIN_FOLD=65;static MAX_FOLD=125251;static MIN_HIGH_SURROGATE=55296;static MAX_HIGH_SURROGATE=56319;static MIN_LOW_SURROGATE=56320;static MAX_LOW_SURROGATE=57343;static MIN_SUPPLEMENTARY_CODE_POINT=65536;static is32(e,t){let n=0,s=e.length;for(;n<s;){let i=n+Math.floor((s-n)/2),a=e.getLo(i),u=e.getHi(i);if(a<=t&&t<=u){let c=e.getStride(i);return(t-a)%c===0}t<a?s=i:n=i+1}return!1}static is(e,t){if(t<=ct.MAX_LATIN1){for(let n=0;n<e.length;n++){if(t>e.getHi(n))continue;let s=e.getLo(n);if(t<s)return!1;let i=e.getStride(n);return(t-s)%i===0}return!1}return e.length>0&&t>=e.getLo(0)&&ct.is32(e,t)}static isPrint(e){return e<=ct.MAX_LATIN1?e>=32&&e<ct.MAX_ASCII||e>=161&&e!==173:ct.is(gt.Print,e)}static simpleFold(e){if(gt.CASE_ORBIT.has(e))return gt.CASE_ORBIT.get(e);if(e<=ct.MAX_ASCII){let t=k.toLowerCase(e);return t!==e?t:k.toUpperCase(e)}return e}static equalsIgnoreCase(e,t){if(e===t)return!0;if(e<0||t<0)return!1;if(e<=ct.MAX_ASCII&&t<=ct.MAX_ASCII)return 65<=e&&e<=90&&(e|=32),65<=t&&t<=90&&(t|=32),e===t;for(let n=ct.simpleFold(e);n!==e;n=ct.simpleFold(n))if(n===t)return!0;return!1}},Ki=class extends Error{constructor(r){super(r),this.name="RE2JSException"}},Ce=class extends Ki{constructor(r,e=null){let t=`error parsing regexp: ${r}`;e&&(t+=`: \`${e}\``),super(t),this.name="RE2JSSyntaxException",this.message=t,this.error=r,this.input=e}getDescription(){return this.error}getPattern(){return this.input}},qi=class extends Ki{constructor(r){super(r),this.name="RE2JSCompileException"}},ut=class extends Ki{constructor(r){super(r),this.name="RE2JSGroupException"}},im=class extends Ki{constructor(r){super(r),this.name="RE2JSFlagsException"}},Yo=class extends Ki{constructor(r){super(r),this.name="RE2JSInternalException"}},uB=256,am=new Uint8Array(uB);for(let r=0;r<uB;r++)am[r]=97<=r&&r<=122||65<=r&&r<=90||48<=r&&r<=57||r===95?1:0;var eB=null,tB=null,H=class Ue{static METACHARACTERS="\\.+*?()|[]{}^$";static EMPTY_BEGIN_LINE=1;static EMPTY_END_LINE=2;static EMPTY_BEGIN_TEXT=4;static EMPTY_END_TEXT=8;static EMPTY_WORD_BOUNDARY=16;static EMPTY_NO_WORD_BOUNDARY=32;static EMPTY_ALL=-1;static emptyInts(){return[]}static isString(e){return typeof e=="string"||Object.prototype.toString.call(e)==="[object String]"}static typeName(e){return e===null||typeof e!="object"&&typeof e!="function"?e===null?"null":typeof e:Object.prototype.toString.call(e).slice(8,-1)}static checkPattern(e){if(!Ue.isString(e))throw new TypeError(`The pattern must be a string, not ${Ue.typeName(e)} (RE2JS.translateRegExp() converts a RegExp)`)}static checkInput(e){if(!Ue.isString(e)&&!Ue.isByteArray(e))throw new TypeError(`The input must be a string or a byte array (Uint8Array or number[]), not ${Ue.typeName(e)}`)}static checkFlags(e){let t=Qe.MULTILINE|Qe.DOTALL|Qe.CASE_INSENSITIVE|Qe.DISABLE_UNICODE_GROUPS|Qe.LONGEST_MATCH|Qe.LOOKBEHINDS;if(!Number.isInteger(e)||(e&~t)!==0)throw new im("Flags should only be a combination of MULTILINE, DOTALL, CASE_INSENSITIVE, DISABLE_UNICODE_GROUPS, LONGEST_MATCH, LOOKBEHINDS")}static isByteArray(e){return Array.isArray(e)||Object.prototype.toString.call(e)==="[object Uint8Array]"}static isalnum(e){return k.CODES[0]<=e&&e<=k.CODES[9]||k.CODES.a<=e&&e<=k.CODES.z||k.CODES.A<=e&&e<=k.CODES.Z}static unhex(e){return k.CODES[0]<=e&&e<=k.CODES[9]?e-k.CODES[0]:k.CODES.a<=e&&e<=k.CODES.f?e-k.CODES.a+10:k.CODES.A<=e&&e<=k.CODES.F?e-k.CODES.A+10:-1}static escapeRune(e){let t="";if(J.isPrint(e))Ue.METACHARACTERS.indexOf(String.fromCodePoint(e))>=0&&(t+="\\"),t+=String.fromCodePoint(e);else switch(e){case k.CODES['"']:t+='\\"';break;case k.CODES["\\"]:t+="\\\\";break;case k.CODES["	"]:t+="\\t";break;case k.CODES[`
`]:t+="\\n";break;case k.CODES["\r"]:t+="\\r";break;case k.CODES["\b"]:t+="\\b";break;case k.CODES["\f"]:t+="\\f";break;default:{let n=e.toString(16);e<256?(t+="\\x",n.length===1&&(t+="0"),t+=n):t+=`\\x{${n}}`;break}}return t}static stringToRunes(e){let t=String(e),n=[],s=0;for(;s<t.length;){let i=t.codePointAt(s);n.push(i),s+=i>J.MAX_BMP?2:1}return new Int32Array(n)}static runeToString(e){return String.fromCodePoint(e)}static isWordRune(e){return e<uB?am[e]===1:!1}static emptyOpContext(e,t){let n=0;return e<0&&(n|=Ue.EMPTY_BEGIN_TEXT|Ue.EMPTY_BEGIN_LINE),e===10&&(n|=Ue.EMPTY_BEGIN_LINE),t<0&&(n|=Ue.EMPTY_END_TEXT|Ue.EMPTY_END_LINE),t===10&&(n|=Ue.EMPTY_END_LINE),Ue.isWordRune(e)!==Ue.isWordRune(t)?n|=Ue.EMPTY_WORD_BOUNDARY:n|=Ue.EMPTY_NO_WORD_BOUNDARY,n}static quoteMeta(e){return e.split("").map(t=>Ue.METACHARACTERS.indexOf(t)>=0?`\\${t}`:t).join("")}static charCount(e){return e>J.MAX_BMP?2:1}static toArray(e){let t=e.length,n=new Array(t);for(let s=0;s<t;s++)n[s]=e[s];return n}static stringToUtf8ByteArray(e){if(globalThis.TextEncoder)return eB||(eB=new TextEncoder),eB.encode(e);{let t=[],n=0;for(let s=0;s<e.length;s++){let i=e.charCodeAt(s);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=i&63|128):(i&64512)===J.MIN_HIGH_SURROGATE&&s+1<e.length&&(e.charCodeAt(s+1)&64512)===J.MIN_LOW_SURROGATE?(i=J.MIN_SUPPLEMENTARY_CODE_POINT+((i&1023)<<10)+(e.charCodeAt(++s)&1023),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=i&63|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=i&63|128)}return t}}static utf8ByteArrayToString(e){if(globalThis.TextDecoder){tB||(tB=new TextDecoder("utf-8"));let t=e instanceof Uint8Array?e:new Uint8Array(e);return tB.decode(t)}else{let t=[],n=0,s=0;for(;n<e.length;){let i=e[n++];if(i<128)t[s++]=String.fromCharCode(i);else if(i>191&&i<224){let a=e[n++];t[s++]=String.fromCharCode((i&31)<<6|a&63)}else if(i>239&&i<365){let a=e[n++],u=e[n++],c=e[n++],l=((i&7)<<18|(a&63)<<12|(u&63)<<6|c&63)-J.MIN_SUPPLEMENTARY_CODE_POINT;t[s++]=String.fromCharCode(J.MIN_HIGH_SURROGATE+(l>>10)),t[s++]=String.fromCharCode(J.MIN_LOW_SURROGATE+(l&1023))}else{let a=e[n++],u=e[n++];t[s++]=String.fromCharCode((i&15)<<12|(a&63)<<6|u&63)}}return t.join("")}}},om=(r=[],e=0)=>{let t=Object.create(null);for(let n=0;n<r.length;n++){let s=r[n],i=e+n;t[s]=i,t[i]=s}return Object.freeze(t)},wr=class aB{static Encoding=om(["UTF_16","UTF_8"]);getEncoding(){throw Error("not implemented")}asCharSequence(){throw Error("not implemented")}asBytes(){throw Error("not implemented")}length(){throw Error("not implemented")}isUTF8Encoding(){return this.getEncoding()===aB.Encoding.UTF_8}isUTF16Encoding(){return this.getEncoding()===aB.Encoding.UTF_16}},vg=class extends wr{constructor(r=null){super(),this.bytes=r}getEncoding(){return wr.Encoding.UTF_8}asCharSequence(){return H.utf8ByteArrayToString(this.bytes)}asBytes(){return this.bytes}length(){return this.bytes.length}},iT=class extends wr{constructor(r=null){super(),this.charSequence=r}getEncoding(){return wr.Encoding.UTF_16}asCharSequence(){return this.charSequence}asBytes(){return H.stringToUtf8ByteArray(this.charSequence.toString())}length(){return this.charSequence.length}},yr=class{static utf16(r){return H.checkInput(r),new iT(r)}static utf8(r){return H.isByteArray(r)?new vg(r):new vg(H.stringToUtf8ByteArray(r))}},st=class{static EOF(){return-8}constructor(){this.start=0,this.end=0}canCheckPrefix(){return!0}endPos(){return this.end-this.start}hasString(){return!1}hasAnyString(){return!1}prefixLength(){return 0}},aT=class as extends st{static RUNE_ERROR_STEP=J.RUNE_ERROR<<3|1;constructor(e,t=0,n=e.length){super(),this.bytes=e,this.start=t,this.end=n}hasString(e,t){let n=e.bytes;if(n.length===0)return!0;let s=this.indexOf(this.bytes,n,this.start+t);return s!==-1&&s<=this.end-n.length}hasAnyString(e,t){return e.automaton8().searchUTF8(this.bytes,this.start+t,this.end)}step(e){if(e+=this.start,e>=this.end)return st.EOF();let t=this.bytes[e]&255;if(t<128)return t<<3|1;let n,s,i=128,a=191;if(t>=194&&t<=223)n=2,s=t&31;else if(t>=224&&t<=239)n=3,s=t&15,t===224?i=160:t===237&&(a=159);else if(t>=240&&t<=244)n=4,s=t&7,t===240?i=144:t===244&&(a=143);else return as.RUNE_ERROR_STEP;if(e+n>this.end)return as.RUNE_ERROR_STEP;let u=this.bytes[e+1]&255;if(u<i||u>a)return as.RUNE_ERROR_STEP;if(s=s<<6|u&63,n>2){let c=this.bytes[e+2]&255;if((c&192)!==128)return as.RUNE_ERROR_STEP;if(s=s<<6|c&63,n>3){let l=this.bytes[e+3]&255;if((l&192)!==128)return as.RUNE_ERROR_STEP;s=s<<6|l&63}}return s<<3|n}index(e,t){t+=this.start;let n=this.indexOf(this.bytes,e.prefixUTF8,t);return n<0?n:n-t}context(e){e+=this.start;let t=-1;if(e>this.start&&e<=this.end){let s=e-1;if(t=this.bytes[s--],t>=128){let i=e-4;for(i<this.start&&(i=this.start);s>=i&&(this.bytes[s]&192)===128;)s--;s<this.start&&(s=this.start);let a=this.step(s-this.start);t=s+(a&7)===e?a>>3:J.RUNE_ERROR}}let n=e<this.end?this.step(e-this.start)>>3:-1;return H.emptyOpContext(t,n)}indexOf(e,t,n=0){let s=t.length;if(s===0)return n<=this.end?n:-1;let i=t[0],a=this.end-s,u=typeof e.indexOf=="function",c=n;for(;c<=a;){if(u){if(c=e.indexOf(i,c),c===-1||c>a)return-1}else{for(;c<=a&&e[c]!==i;)c++;if(c>a)return-1}let l=!0;for(let h=1;h<s;h++)if(e[c+h]!==t[h]){l=!1;break}if(l)return c;c++}return-1}prefixLength(e){return e.prefixUTF8.length}},oT=class extends st{constructor(r,e=0,t=r.length){super(),this.charSequence=r,this.start=e,this.end=t}hasString(r,e){let t=this.charSequence.indexOf(r.str,this.start+e);return t!==-1&&t<=this.end-r.str.length}hasAnyString(r,e){return r.automaton16().searchUTF16(this.charSequence,this.start+e,this.end)}step(r){if(r+=this.start,r>=this.end)return st.EOF();let e=this.charSequence.charCodeAt(r);if(e<J.MIN_HIGH_SURROGATE||e>J.MAX_HIGH_SURROGATE||r+1>=this.end)return e<<3|1;let t=this.charSequence.charCodeAt(r+1);return t>=J.MIN_LOW_SURROGATE&&t<=J.MAX_LOW_SURROGATE?(e-J.MIN_HIGH_SURROGATE)*1024+(t-J.MIN_LOW_SURROGATE)+J.MIN_SUPPLEMENTARY_CODE_POINT<<3|2:e<<3|1}index(r,e){e+=this.start;let t=this.charSequence.indexOf(r.prefix,e);return t<0||t>this.end-r.prefix.length?-1:t-e}context(r){r+=this.start;let e=r>this.start&&r<=this.end?this.charSequence.charCodeAt(r-1):-1,t=r<this.end?this.charSequence.charCodeAt(r):-1;return H.emptyOpContext(e,t)}prefixLength(r){return r.prefix.length}},pe=class{static fromUTF8(r,e=0,t=r.length){return new aT(r,e,t)}static fromUTF16(r,e=0,t=void 0){return H.checkInput(r),new oT(r,e,t??r.length)}},Rg=class um{static MAX_REPLACER_ARGS=65535;static quoteReplacement(e,t=!1){return t?e.indexOf("\\")<0&&e.indexOf("$")<0?e:e.split("").map(n=>{let s=n.codePointAt(0);return s===k.CODES["\\"]||s===k.CODES.$?`\\${n}`:n}).join(""):e.indexOf("$")<0?e:e.split("").map(n=>n.codePointAt(0)===k.CODES.$?"$$":n).join("")}constructor(e,t){if(e===null)throw new Error("pattern is null");this.patternInput=e;let n=this.patternInput.re2();this.patternGroupCount=n.numberOfCapturingGroups(),this.groups=[],this.namedGroups=n.namedGroups,this.hasNamedGroups=Object.keys(this.namedGroups).length>0,this.numberOfInstructions=n.numberOfInstructions(),this.lookbehindState=null,t instanceof wr?this.resetMatcherInput(t):H.isByteArray(t)?this.resetMatcherInput(yr.utf8(t)):this.resetMatcherInput(yr.utf16(t))}pattern(){return this.patternInput}reset(){return this.matcherInputLength=this.matcherInput.length(),this.appendPos=0,this.hasMatch=!1,this.hasGroups=!1,this.anchorFlag=0,this}resetMatcherInput(e){if(e===null)throw new Error("input is null");return e instanceof wr||(H.isByteArray(e)?e=yr.utf8(e):e=yr.utf16(e)),this.matcherInput=e,this.lookbehindState!==null?this.lookbehindState.reset():this.lookbehindState=this.patternInput.re2().createLookbehindState(),this.reset(),this}start(e=0){if(typeof e=="string"){let t=this.namedGroups[e];if(!Number.isFinite(t))throw new ut(`group '${e}' not found`);e=t}return this.loadGroup(e),this.groups[2*e]}end(e=0){if(typeof e=="string"){let t=this.namedGroups[e];if(!Number.isFinite(t))throw new ut(`group '${e}' not found`);e=t}return this.loadGroup(e),this.groups[2*e+1]}programSize(){return this.numberOfInstructions}group(e=0){if(typeof e=="string"){let s=this.namedGroups[e];if(!Number.isFinite(s))throw new ut(`group '${e}' not found`);e=s}let t=this.start(e),n=this.end(e);return t<0&&n<0?null:this.substring(t,n)}getNamedGroups(){if(!this.hasMatch)throw new ut("perhaps no match attempted");let e=Object.create(null);for(let t of Object.keys(this.namedGroups))e[t]=this.group(t);return e}groupCount(){return this.patternGroupCount}loadGroup(e){if(!Number.isInteger(e)||e<0||e>this.patternGroupCount)throw new ut(`Group index out of bounds: ${e}`);if(!this.hasMatch)throw new ut("perhaps no match attempted");if(e===0||this.hasGroups)return;let t=this.matcherInputLength,n=this.patternInput.re2().matchMachineInput(this.matcherInput,this.groups[0],t,this.anchorFlag,1+this.patternGroupCount,this.lookbehindState);if(!n[0])throw new ut("inconsistency in matching group data");this.groups=n[1],this.hasGroups=!0}matches(){return this.genMatch(0,L.ANCHOR_BOTH)}lookingAt(){return this.genMatch(0,L.ANCHOR_START)}find(e=null){if(e!==null){if(!Number.isInteger(e)||e<0||e>this.matcherInputLength)throw new ut(`start index out of bounds: ${e}`);return this.reset(),this.genMatch(e,0)}if(e=0,this.hasMatch&&(e=this.groups[1],this.groups[0]===this.groups[1])){let t=(this.matcherInput.isUTF16Encoding()?pe.fromUTF16(this.matcherInput.asCharSequence(),0,this.matcherInputLength):pe.fromUTF8(this.matcherInput.asBytes(),0,this.matcherInputLength)).step(e);t<0?e++:e+=t&7}return this.genMatch(e,L.UNANCHORED)}genMatch(e,t){let n=this.patternInput.re2().matchMachineInput(this.matcherInput,e,this.matcherInputLength,t,1,this.lookbehindState);return n[0]?(this.groups=n[1],this.hasMatch=!0,this.hasGroups=this.patternGroupCount===0,this.anchorFlag=t,!0):(this.hasMatch=!1,!1)}substring(e,t){return this.matcherInput.isUTF8Encoding()?H.utf8ByteArrayToString(this.matcherInput.asBytes().slice(e,t)):this.matcherInput.asCharSequence().substring(e,t).toString()}inputLength(){return this.matcherInputLength}appendReplacement(e,t=!1){let n="",s=this.start(),i=this.end();return this.appendPos<s&&(n+=this.substring(this.appendPos,s)),this.appendPos=i,n+=t?this.appendReplacementInternalJava(e):this.appendReplacementInternalJs(e),n}appendReplacementInternalJava(e){let t="",n=0,s=e.length,i=0;for(;i<s;){let a=e.codePointAt(i);if(a===k.CODES["\\"]){if(n<i&&(t+=e.substring(n,i)),i++,i>=s)throw new ut("character to be escaped is missing");n=i,i++;continue}if(a===k.CODES.$){if(n<i&&(t+=e.substring(n,i)),i+1>=s)throw new ut("Illegal group reference: group index is missing");let u=e.codePointAt(i+1);if(k.CODES[0]<=u&&u<=k.CODES[9]){let c=u-k.CODES[0],l=i+2;for(;l<s;l++){let d=e.codePointAt(l);if(d<k.CODES[0]||d>k.CODES[9]||c*10+d-k.CODES[0]>this.patternGroupCount)break;c=c*10+d-k.CODES[0]}if(c>this.patternGroupCount)throw new ut(`n > number of groups: ${c}`);let h=this.group(c);h!==null&&(t+=h),i=l,n=i}else if(u===k.CODES["{"]){let c=i+2;for(;c<s&&e.codePointAt(c)!==k.CODES["}"];)c++;if(c>=s)throw new ut("named capture group is missing trailing '}'");let l=e.substring(i+2,c),h=this.group(l);h!==null&&(t+=h),i=c+1,n=i}else throw new ut("Illegal group reference");continue}i++}return n<s&&(t+=e.substring(n,s)),t}appendReplacementInternalJs(e){let t=a=>a>=48&&a<=57,n=this.patternGroupCount,s="",i=0;for(;i<e.length;){let a=e.indexOf("$",i);if(a<0)break;s+=e.substring(i,a),i=a;let u=e.charCodeAt(i+1);if(u===k.CODES.$)s+="$",i+=2;else if(u===k.CODES["&"])s+=this.group(0),i+=2;else if(u===k.CODES["`"])s+=this.substring(0,this.start(0)),i+=2;else if(u===k.CODES["'"])s+=this.substring(this.end(0),this.matcherInputLength),i+=2;else if(t(u)){let c=1,l=u-48,h=e.charCodeAt(i+2);if(t(h)&&l*10+h-48<=n&&(c=2,l=l*10+h-48),l>=1&&l<=n){let d=this.group(l);d!==null&&(s+=d)}else s+=e.substring(i,i+1+c);i+=1+c}else if(u===k.CODES["<"]&&this.hasNamedGroups){let c=e.indexOf(">",i+2);if(c<0)s+="$<",i+=2;else{let l=e.substring(i+2,c);if(Object.hasOwn(this.namedGroups,l)){let h=this.group(l);h!==null&&(s+=h)}i=c+1}}else s+="$",i+=1}return s+e.substring(i)}appendTail(){return this.substring(this.appendPos,this.matcherInputLength)}replaceAll(e,t=!1){return this.replace(e,!0,t)}replaceFirst(e,t=!1){return this.replace(e,!1,t)}replace(e,t=!0,n=!1){let s="";this.reset();let i=typeof e=="function",a=null;if(i){if(this.groupCount()>=um.MAX_REPLACER_ARGS)throw new ut("Too many capture groups to safely invoke replacer function");a=this.matcherInput.isUTF8Encoding()?this.matcherInput.asBytes():this.matcherInput.asCharSequence()}for(;this.find()&&(s+=i?this.appendReplacementFunc(e,a):this.appendReplacement(e,n),!!t););return s+=this.appendTail(),s}appendReplacementFunc(e,t){let n="",s=this.start(),i=this.end();this.appendPos<s&&(n+=this.substring(this.appendPos,s)),this.appendPos=i;let a=this.matchArray();return a.push(s,t),this.hasNamedGroups&&a.push(this.namedGroupsObject()),n+=String(e(...a)),n}matchArray(){let e=[this.group(0)];for(let t=1;t<=this.patternGroupCount;t++){let n=this.group(t);e.push(n===null?void 0:n)}return e}namedGroupsObject(){if(!this.hasNamedGroups)return;let e=this.getNamedGroups();for(let t in e)e[t]===null&&(e[t]=void 0);return e}},O=class He{static ALT=1;static ALT_MATCH=2;static CAPTURE=3;static EMPTY_WIDTH=4;static FAIL=5;static MATCH=6;static NOP=7;static RUNE=8;static RUNE1=9;static RUNE_ANY=10;static RUNE_ANY_NOT_NL=11;static LB_WRITE=12;static LB_CHECK=13;static isRuneOp(e){return He.RUNE<=e&&e<=He.RUNE_ANY_NOT_NL}static escapeRunes(e){let t='"';for(let n of e)t+=H.escapeRune(n);return t+='"',t}constructor(e){this.op=e,this.out=0,this.arg=0,this.runes=new Int32Array(0),this.next=null}matchRune(e){if(this.runes.length===1){let a=this.runes[0];return(this.arg&L.FOLD_CASE)!==0?J.equalsIgnoreCase(a,e):e===a}let t=this.runes.length;if(t===0)return!1;if(t===2||t===4||t===6||t===8){for(let a=0;a<t;a+=2){if(e<this.runes[a])return!1;if(e<=this.runes[a+1])return!0}return!1}let n=0,s=t>>1;for(;s>1;){let a=s>>1;n+=this.runes[n+a<<1]<=e?a:0,s-=a}n+=this.runes[n<<1]<=e?1:0;let i=n-1;return i>=0&&e<=this.runes[i<<1|1]}matchRunePos(e){if(this.runes.length===1){let a=this.runes[0];return(this.arg&L.FOLD_CASE)!==0?J.equalsIgnoreCase(a,e)?0:-1:e===a?0:-1}let t=this.runes.length;if(t===0)return-1;if(t===2||t===4||t===6||t===8){for(let a=0;a<t;a+=2){if(e<this.runes[a])return-1;if(e<=this.runes[a+1])return Math.floor(a/2)}return-1}let n=0,s=t>>1;for(;s>1;){let a=s>>1;n+=this.runes[n+a<<1]<=e?a:0,s-=a}n+=this.runes[n<<1]<=e?1:0;let i=n-1;return i>=0&&e<=this.runes[i<<1|1]?i:-1}toString(){switch(this.op){case He.ALT:return`alt -> ${this.out}, ${this.arg}`;case He.ALT_MATCH:return`altmatch -> ${this.out}, ${this.arg}`;case He.CAPTURE:return`cap ${this.arg} -> ${this.out}`;case He.EMPTY_WIDTH:return`empty ${this.arg} -> ${this.out}`;case He.MATCH:return`match${this.arg!==0?` ${this.arg}`:""}`;case He.FAIL:return"fail";case He.NOP:return`nop -> ${this.out}`;case He.LB_WRITE:return`lbwrite ${this.arg} -> ${this.out}`;case He.LB_CHECK:return`lbcheck ${this.arg} -> ${this.out}`;case He.RUNE:return this.runes===null?"rune <null>":["rune ",He.escapeRunes(this.runes),(this.arg&L.FOLD_CASE)!==0?"/i":""," -> ",this.out].join("");case He.RUNE1:return`rune1 ${He.escapeRunes(this.runes)} -> ${this.out}`;case He.RUNE_ANY:return`any -> ${this.out}`;case He.RUNE_ANY_NOT_NL:return`anynotnl -> ${this.out}`;default:throw new Error("unhandled case in Inst.toString")}}},Sg=class cm{constructor(e){this.sparse=new Int32Array(e),this.densePcs=new Int32Array(e),this.denseCaps=null,this.size=0,this.ncap=0,this.mainThreads=0}static INITIAL_THREADS=32;init(e){this.ncap=e;let t=Math.min(this.densePcs.length,cm.INITIAL_THREADS)*e;(!this.denseCaps||this.denseCaps.length<t)&&(this.denseCaps=new Int32Array(t))}growCaps(e){let t=this.densePcs.length*this.ncap,n=new Int32Array(Math.min(t,Math.max(e,2*this.denseCaps.length)));n.set(this.denseCaps),this.denseCaps=n}contains(e){let t=this.sparse[e];return t<this.size&&this.densePcs[t]===e}isEmpty(){return this.size===0}add(e){let t=this.size++;return this.sparse[e]=t,this.densePcs[t]=e,t}clear(){this.size=0,this.mainThreads=0}toString(){let e="{";for(let t=0;t<this.size;t++)t!==0&&(e+=", "),e+=this.densePcs[t];return e+="}",e}},uT=class{constructor(r){this.pos=-1,this.pcs=new Int32Array(r.numInst()),this.size=0,this.lbTable=new Int32Array(r.numLb+1)}reset(){this.pos=-1,this.size=0}},lm=class Bm{static fromRE2(e){let t=new Bm;return t.prog=e.prog,t.re2=e,t.q0=new Sg(t.prog.numInst()),t.q1=new Sg(t.prog.numInst()),t.addStack=new Int32Array(2*(t.prog.numInst()+1)),t.matched=!1,t.matchcap=new Int32Array(t.prog.numCap<2?2:t.prog.numCap),t.ncap=0,t}constructor(){this.prog=null,this.re2=null,this.q0=null,this.q1=null,this.addStack=null,this.matched=!1,this.matchcap=null,this.ncap=0,this.lbTable=null}init(e){this.ncap=e,e>this.matchcap.length?this.matchcap=new Int32Array(e).fill(-1):this.matchcap.fill(-1),this.q0.init(e),this.q1.init(e),this.prog.numLb>0&&((!this.lbTable||this.lbTable.length<this.prog.numLb+1)&&(this.lbTable=new Int32Array(this.prog.numLb+1)),this.lbTable.fill(-1))}submatches(){return this.ncap===0?H.emptyInts():H.toArray(this.matchcap.subarray(0,this.ncap))}match(e,t,n,s=null){let i=this.re2.cond;if(i===H.EMPTY_ALL||(n===L.ANCHOR_START||n===L.ANCHOR_BOTH)&&t!==0)return!1;this.matched=!1,this.matchcap.fill(-1);let a=this.prog.numLb>0,u=t,c=t,l=!1;a&&(s!==null&&s.pos>=0&&s.pos<=t?(c=s.pos,l=!0):c=0);let h=a&&s!==null,d=this.q0,p=this.q1,E=e.step(c),y=E>>3,S=E&7,F=-1,U=0;E!==st.EOF()&&(E=e.step(c+S),F=E>>3,U=E&7);let z;for(c===0?z=H.emptyOpContext(-1,y):z=e.context(c),a&&(l?this.restoreLookbehinds(s,d,z):this.spawnLookbehinds(d,c,z));;){if(d.mainThreads===0){if((i&H.EMPTY_BEGIN_TEXT)!==0&&c!==0||(n===L.ANCHOR_START||n===L.ANCHOR_BOTH)&&c!==0||this.matched)break;if(this.prog.numLb===0&&d.isEmpty()&&this.re2.prefix.length!==0&&F!==this.re2.prefixRune&&e.canCheckPrefix()){let ye=e.index(this.re2,c);if(ye<0)break;c+=ye,E=e.step(c),y=E>>3,S=E&7,E=e.step(c+S),F=E>>3,U=E&7,z=e.context(c)}}c>=u&&(h&&(this.saveLookbehinds(s,d,c),h=!1),!this.matched&&(c===0||n===L.UNANCHORED)&&(this.ncap>0&&(this.matchcap[0]=c),this.add(d,this.prog.start,c,this.matchcap,0,z)));let re=c+S;if(z=e.context(re),this.step(d,p,c,re,y,z,n,c===e.endPos()),S===0||this.ncap===0&&this.matched)break;c+=S,y=F,S=U,y!==-1&&(E=e.step(c+S),F=E>>3,U=E&7);let me=d;d=p,p=me}return d.clear(),p.clear(),this.matched}matchSet(e,t,n){let s=this.re2.cond;if(s===H.EMPTY_ALL)return[];if((n===L.ANCHOR_START||n===L.ANCHOR_BOTH)&&t!==0)return[];let i=this.prog.numLb>0?0:t,a=t,u=this.q0,c=this.q1,l=e.step(i),h=l>>3,d=l&7,p=-1,E=0;l!==st.EOF()&&(l=e.step(i+d),p=l>>3,E=l&7);let y=i===0?H.emptyOpContext(-1,h):e.context(i),S=new Set;for(this.prog.numLb>0&&this.spawnLookbehinds(u,i,y);!(u.mainThreads===0&&((s&H.EMPTY_BEGIN_TEXT)!==0&&i!==0||(n===L.ANCHOR_START||n===L.ANCHOR_BOTH)&&i!==0));){(i===0||n===L.UNANCHORED)&&i>=a&&this.add(u,this.prog.start,i,this.matchcap,0,y);let F=i+d;y=e.context(F);for(let z=0;z<u.size;z++){let re=u.densePcs[z],me=this.prog.inst[re],ye=z*this.ncap,Ee=!1;switch(me.op){case O.MATCH:if(n===L.ANCHOR_BOTH&&i!==e.endPos())break;S.add(me.arg);break;case O.RUNE:Ee=me.matchRune(h);break;case O.RUNE1:Ee=h===me.runes[0];break;case O.RUNE_ANY:Ee=!0;break;case O.RUNE_ANY_NOT_NL:Ee=h!==10;break;default:continue}Ee&&this.add(c,me.out,F,u.denseCaps,ye,y)}if(u.clear(),d===0)break;i+=d,h=p,d=E,h!==-1&&(l=e.step(i+d),p=l>>3,E=l&7);let U=u;u=c,c=U}return c.clear(),Array.from(S).sort((F,U)=>F-U)}step(e,t,n,s,i,a,u,c){let l=this.re2.longest;for(let h=0;h<e.size;h++){let d=e.densePcs[h],p=h*this.ncap;if(l&&this.matched&&this.ncap>0&&this.matchcap[0]<e.denseCaps[p])continue;let E=this.prog.inst[d],y=!1;switch(E.op){case O.MATCH:if(u===L.ANCHOR_BOTH&&!c)break;if(this.ncap>0&&(!l||!this.matched||this.matchcap[1]<n)){e.denseCaps[p+1]=n;for(let S=0;S<this.ncap;S++)this.matchcap[S]=e.denseCaps[p+S]}l||(e.size=0),this.matched=!0;break;case O.RUNE:y=E.matchRune(i);break;case O.RUNE1:y=i===E.runes[0];break;case O.RUNE_ANY:y=!0;break;case O.RUNE_ANY_NOT_NL:y=i!==10;break;default:continue}y&&this.add(t,E.out,s,e.denseCaps,p,a)}e.clear()}spawnLookbehinds(e,t,n){for(let s=0;s<this.prog.lbStarts.length;s++)this.add(e,this.prog.lbStarts[s],t,this.matchcap,0,n)}restoreLookbehinds(e,t,n){this.lbTable.set(e.lbTable);for(let s=0;s<e.size;s++)this.add(t,e.pcs[s],e.pos,this.matchcap,0,n)}saveLookbehinds(e,t,n){let s=0;for(let i=0;i<t.size;i++){let a=t.densePcs[i];this.prog.lbInst[a]===1&&O.isRuneOp(this.prog.inst[a].op)&&(e.pcs[s++]=a)}e.size=s,e.pos=n,e.lbTable.set(this.lbTable)}add(e,t,n,s,i,a){let u=this.addStack,c=0;for(;;){for(;t!==0&&!e.contains(t);){let h=e.add(t),d=this.prog.inst[t];switch(d.op){case O.FAIL:t=0;break;case O.ALT:case O.ALT_MATCH:u[c++]=d.arg,u[c++]=0,t=d.out;break;case O.EMPTY_WIDTH:t=(d.arg&~a)===0?d.out:0;break;case O.NOP:t=d.out;break;case O.CAPTURE:d.arg<this.ncap&&(u[c++]=-d.arg-1,u[c++]=s[i+d.arg],s[i+d.arg]=n),t=d.out;break;case O.LB_WRITE:this.lbTable[Math.abs(d.arg)]=n,t=d.out;break;case O.LB_CHECK:d.arg>0?t=this.lbTable[d.arg]===n?d.out:0:t=this.lbTable[-d.arg]!==n?d.out:0;break;case O.MATCH:case O.RUNE:case O.RUNE1:case O.RUNE_ANY:case O.RUNE_ANY_NOT_NL:if(this.prog.lbInst[t]===0&&e.mainThreads++,this.ncap>0){let p=h*this.ncap;p+this.ncap>e.denseCaps.length&&e.growCaps(p+this.ncap);for(let E=0;E<this.ncap;E++)e.denseCaps[p+E]=s[i+E]}t=0;break;default:throw new Yo("unhandled")}}if(c===0)return;c-=2;let l=u[c];l<0?(s[i-l-1]=u[c+1],t=0):t=l}}},cT=(r,e,t)=>{let n=-2128831035;for(let s=0;s<r.length;s++)n^=r[s],n=Math.imul(n,16777619);n^=e,n=Math.imul(n,16777619);for(let s=0;s<t.length;s++)n^=t[s],n=Math.imul(n,16777619);return n},Pg=(r,e)=>{if(r.length!==e.length)return!1;for(let t=0;t<r.length;t++)if(r[t]!==e[t])return!1;return!0},Ng=(r,e,t,n)=>r.flag===t&&Pg(r.nfaStates,e)&&Pg(r.matchIDs,n),nB=[],Ui=-1,Jo=class{constructor(r,e,t){this.nfaStates=r,this.flag=e,this.isMatch=(e&cB.FLAG_MATCH)!==0,this.matchIDs=t,this.next=null,this.nextAnchored=null}},cB=class qe{static FLAG_EMPTY_MASK=255;static FLAG_MATCH=256;static FLAG_LAST_WORD=512;static FLAG_NEED_SHIFT=16;static STATE_OVERHEAD=150;static ARRAY_OVERHEAD=40;static ELEMENT_SIZE=8;static TABLE_OVERHEAD=48;static PROGRESS_PER_STATE=10;constructor(e,t=8388608){this.prog=e,this.maxMem=t,this.stateCache=new Map,this.stateCount=0,this.startStates=new Map,this.failed=!1;for(let n=0;n<e.numInst();n++){let s=e.getInst(n).op;if(s===O.LB_WRITE||s===O.LB_CHECK){this.failed=!0;break}}this.computeRuneClasses(),this.stateBudget=t,this.memBudget=t}computeRuneClasses(){let e=new Set,t=(s,i)=>{e.add(s),e.add(i+1)};for(let s=0;s<this.prog.numInst();s++){let i=this.prog.getInst(s);switch(i.op){case O.RUNE:case O.RUNE1:if(i.runes.length===1){if(t(i.runes[0],i.runes[0]),(i.arg&L.FOLD_CASE)!==0)for(let a=J.simpleFold(i.runes[0]);a!==i.runes[0];a=J.simpleFold(a))t(a,a)}else for(let a=0;a<i.runes.length;a+=2)t(i.runes[a],i.runes[a+1]);break;case O.RUNE_ANY_NOT_NL:t(10,10);break;case O.EMPTY_WIDTH:(i.arg&(H.EMPTY_BEGIN_LINE|H.EMPTY_END_LINE))!==0&&t(10,10),(i.arg&(H.EMPTY_WORD_BOUNDARY|H.EMPTY_NO_WORD_BOUNDARY))!==0&&(t(48,57),t(65,90),t(95,95),t(97,122))}}e.delete(0),this.classBounds=Int32Array.from(e).sort(),this.numClasses=this.classBounds.length+1;let n=new Int32Array(J.MAX_LATIN1+1);for(let s=0;s<=J.MAX_LATIN1;s++)n[s]=this.searchClass(s);this.latin1Class=n}runeClass(e){return e<=J.MAX_LATIN1?this.latin1Class[e]:this.searchClass(e)}searchClass(e){let t=this.classBounds,n=0,s=t.length;for(;n<s;){let i=n+s>>1;t[i]<=e?n=i+1:s=i}return n}closure(e,t){let n=new Set,s=Array.from(e),i=0;for(;s.length>0;){let a=s.pop();if(a===0||n.has(a))continue;n.add(a);let u=this.prog.getInst(a);switch(u.op){case O.ALT:case O.ALT_MATCH:s.push(u.out),s.push(u.arg);break;case O.NOP:case O.CAPTURE:s.push(u.out);break;case O.EMPTY_WIDTH:i|=u.arg,(u.arg&~t)===0&&s.push(u.out)}}return{pcs:Array.from(n).sort((a,u)=>a-u),needflags:i}}getState(e,t,n){let s=cT(e,t,n),i=this.stateCache.get(s);if(i instanceof Jo){if(Ng(i,e,t,n))return i}else if(i!==void 0){for(let c=0;c<i.length;c++)if(Ng(i[c],e,t,n))return i[c]}let a=qe.stateCost(e,n);if(this.memBudget<a)return null;this.memBudget-=a;let u=new Jo(e,t,n);return i===void 0?this.stateCache.set(s,u):i instanceof Jo?this.stateCache.set(s,[i,u]):i.push(u),this.stateCount++,u}static stateCost(e,t){let n=t.length===0?0:qe.ARRAY_OVERHEAD+qe.ELEMENT_SIZE*t.length;return qe.STATE_OVERHEAD+qe.ELEMENT_SIZE*e.length+n}*cachedStates(){for(let e of this.stateCache.values())e instanceof Jo?yield e:yield*e}makeState(e,t,n){let s=this.closure(e,t&qe.FLAG_EMPTY_MASK),i=t;return s.needflags===0&&(i&=qe.FLAG_MATCH),i|=s.needflags<<qe.FLAG_NEED_SHIFT,this.getState(s.pcs,i,n)}allocTable(e,t){let n=this.numClasses+1,s=qe.TABLE_OVERHEAD+qe.ELEMENT_SIZE*n;if(this.memBudget<s)return null;this.memBudget-=s;let i=new Array(n).fill(null);return t===L.UNANCHORED?e.next=i:e.nextAnchored=i,i}clearCache(){this.stateCache.clear(),this.stateCount=0,this.startStates.clear(),this.memBudget=this.stateBudget}resetCache(e){return this.clearCache(),this.getState(e.nfaStates,e.flag,e.matchIDs)}step(e,t,n,s){let i=s===L.UNANCHORED?e.next:e.nextAnchored;if(i!==null){let z=i[t];if(z!==null)return z}else if(i=this.allocTable(e,s),i===null)return null;let a=e.flag>>>qe.FLAG_NEED_SHIFT,u=e.flag&qe.FLAG_EMPTY_MASK,c=u,l=0;n===10&&(c|=H.EMPTY_END_LINE,l|=H.EMPTY_BEGIN_LINE),n===Ui&&(c|=H.EMPTY_END_LINE|H.EMPTY_END_TEXT);let h=(e.flag&qe.FLAG_LAST_WORD)!==0,d=n!==Ui&&H.isWordRune(n);c|=d===h?H.EMPTY_NO_WORD_BOUNDARY:H.EMPTY_WORD_BOUNDARY;let p=e.nfaStates;(c&~u&a)!==0&&(p=this.closure(p,c).pcs);let E=[],y=!1,S=nB;for(let z=0;z<p.length;z++){let re=this.prog.getInst(p[z]);re.op===O.MATCH?(y||(y=!0,S=[]),S.push(re.arg)):n!==Ui&&O.isRuneOp(re.op)&&re.matchRune(n)&&E.push(re.out)}S.length>1&&S.sort((z,re)=>z-re),s===L.UNANCHORED&&n!==Ui&&E.push(this.prog.start);let F=l;y&&(F|=qe.FLAG_MATCH),d&&(F|=qe.FLAG_LAST_WORD);let U=this.makeState(E,F,S);return U===null?null:(i[t]=U,U)}start(e,t){let n=e.context(t),s;if((n&H.EMPTY_BEGIN_TEXT)!==0)s=H.EMPTY_BEGIN_TEXT|H.EMPTY_BEGIN_LINE;else if((n&H.EMPTY_BEGIN_LINE)!==0)s=H.EMPTY_BEGIN_LINE;else{let a=e.step(t),u=a>=0&&H.isWordRune(a>>3);s=(n&H.EMPTY_WORD_BOUNDARY)!==0!==u?qe.FLAG_LAST_WORD:0}let i=this.startStates.get(s);if(i===void 0){if(i=this.makeState([this.prog.start],s,nB),i===null&&(this.clearCache(),i=this.makeState([this.prog.start],s,nB),i===null))return null;this.startStates.set(s,i)}return i}stepOrReset(e,t,n,s,i,a){let u=this.step(e,t,n,s);if(u!==null)return u;if(a.resetPos>=0&&i-a.resetPos<qe.PROGRESS_PER_STATE*this.stateCount)return null;a.resetPos=i;let c=this.resetCache(e);return c===null?null:(u=this.step(c,t,n,s),u)}run(e,t,n,s,i){let a=e.endPos(),u=this.latin1Class,c=n===L.UNANCHORED,l={resetPos:-1},h=t;for(;h<a;){let d=e.step(h),p=d>>3,E=d&7;if(E===0)break;let y=p<=J.MAX_LATIN1?u[p]:this.runeClass(p),S=c&&s.next!==null?s.next[y]:null;if(S===null&&(S=this.stepOrReset(s,y,p,n,h,l),S===null))return null;if(s=S,s.isMatch&&i(s,!1))return!0;if(!c&&s.nfaStates.length===0)return!1;h+=E}return s=this.stepOrReset(s,this.numClasses,Ui,n,h,l),s===null?null:s.isMatch&&i(s,!0)}match(e,t,n){if(this.failed)return null;if((n===L.ANCHOR_START||n===L.ANCHOR_BOTH)&&t!==0)return!1;let s=this.start(e,t);return s===null?null:this.run(e,t,n,s,(i,a)=>n!==L.ANCHOR_BOTH||a)}matchSet(e,t,n){if(this.failed)return null;if((n===L.ANCHOR_START||n===L.ANCHOR_BOTH)&&t!==0)return[];let s=this.start(e,t);if(s===null)return null;let i=new Set,a=(u,c)=>{if(n!==L.ANCHOR_BOTH||c)for(let l=0;l<u.matchIDs.length;l++)i.add(u.matchIDs[l]);return!1};return this.run(e,t,n,s,a)===null?null:Array.from(i).sort((u,c)=>u-c)}},lT=32,BT=500,rB=256,hT=262144,fT=class{constructor(){this.end=0,this.cap=new Int32Array(0),this.matchcap=new Int32Array(0),this.ncap=0,this.jobPc=new Int32Array(rB),this.jobArg=new Uint8Array(rB),this.jobPos=new Int32Array(rB),this.jobLen=0,this.visited=new Uint32Array(0)}reset(r,e,t){this.end=e,this.jobLen=0,this.ncap=t;let n=r.numInst()*(e+1)+lT-1>>>5;this.visited.length<n?this.visited=new Uint32Array(n):this.visited.fill(0,0,n),this.cap.length<t?this.cap=new Int32Array(t).fill(-1):this.cap.fill(-1,0,t),this.matchcap.length<t?this.matchcap=new Int32Array(t).fill(-1):this.matchcap.fill(-1,0,t)}shouldVisit(r,e){let t=r*(this.end+1)+e,n=t>>>5,s=1<<(t&31);return(this.visited[n]&s)!==0?!1:(this.visited[n]|=s,!0)}push(r,e,t,n){if(r.prog.getInst(e).op!==O.FAIL&&(n||this.shouldVisit(e,t))){if(this.jobLen>=this.jobPc.length){let s=this.jobPc.length*2,i=new Int32Array(s);i.set(this.jobPc),this.jobPc=i;let a=new Uint8Array(s);a.set(this.jobArg),this.jobArg=a;let u=new Int32Array(s);u.set(this.jobPos),this.jobPos=u}this.jobPc[this.jobLen]=e,this.jobArg[this.jobLen]=n?1:0,this.jobPos[this.jobLen]=t,this.jobLen++}}tryBacktrack(r,e,t,n,s){let i=r.longest;for(this.push(r,t,n,!1);this.jobLen>0;){this.jobLen--;let a=this.jobPc[this.jobLen],u=this.jobArg[this.jobLen]===1,c=this.jobPos[this.jobLen],l=!0;for(;!(!l&&!this.shouldVisit(a,c));){l=!1;let h=r.prog.getInst(a);switch(h.op){case O.FAIL:break;case O.ALT:if(u){u=!1,a=h.arg;continue}else{this.push(r,a,c,!0),a=h.out;continue}case O.ALT_MATCH:{let d=r.prog.getInst(h.out);if(O.isRuneOp(d.op)){this.push(r,h.arg,c,!1),a=h.arg,c=this.end;continue}this.push(r,h.out,this.end,!1),a=h.out;continue}case O.RUNE:{let d=e.step(c);if(d===st.EOF()||!h.matchRune(d>>3))break;c+=d&7,a=h.out;continue}case O.RUNE1:{let d=e.step(c);if(d===st.EOF()||d>>3!==h.runes[0])break;c+=d&7,a=h.out;continue}case O.RUNE_ANY_NOT_NL:{let d=e.step(c);if(d===st.EOF()||d>>3===10)break;c+=d&7,a=h.out;continue}case O.RUNE_ANY:{let d=e.step(c);if(d===st.EOF())break;c+=d&7,a=h.out;continue}case O.CAPTURE:if(u){this.cap[h.arg]=c;break}else{h.arg<this.ncap&&(this.push(r,a,this.cap[h.arg],!0),this.cap[h.arg]=c),a=h.out;continue}case O.EMPTY_WIDTH:{let d=e.context(c);if((h.arg&~d)!==0)break;a=h.out;continue}case O.NOP:a=h.out;continue;case O.MATCH:{if(s===L.ANCHOR_BOTH&&c!==this.end)break;if(this.ncap===0)return!0;this.ncap>1&&(this.cap[1]=c);let d=this.matchcap[1];if((d===-1||i&&c>0&&c>d)&&this.matchcap.set(this.cap),!i||c===this.end)return!0;break}case O.LB_WRITE:case O.LB_CHECK:throw new Yo("Backtracker cannot evaluate Lookbehind instructions");default:throw new Yo("bad inst")}break}}return i&&this.matchcap.length>1&&this.matchcap[1]>=0}},zo=[],Wo=class hm{static shouldBacktrack(e){return e.numInst()<=BT}static maxBitStateLen(e){return hm.shouldBacktrack(e)?Math.floor(hT/e.numInst()):0}static execute(e,t,n,s,i){let a=e.cond;if(a===H.EMPTY_ALL||(s===L.ANCHOR_START||s===L.ANCHOR_BOTH)&&n!==0||(a&H.EMPTY_BEGIN_TEXT)!==0&&n!==0)return null;let u=zo.length>0?zo.pop():new fT,c=t.endPos();u.reset(e.prog,c,i);let l=!1;if((a&H.EMPTY_BEGIN_TEXT)!==0||s===L.ANCHOR_START||s===L.ANCHOR_BOTH)u.ncap>0&&(u.cap[0]=n),u.tryBacktrack(e,t,e.prog.start,n,s)&&(l=!0);else{let d=-1;for(;n<=c&&d!==0;n+=d){if(e.prefix.length>0){let E=t.index(e,n);if(E<0)break;n+=E}if(u.ncap>0&&(u.cap[0]=n),u.tryBacktrack(e,t,e.prog.start,n,s)){l=!0;break}let p=t.step(n);d=p===st.EOF()?0:p&7}}if(!l)return zo.push(u),null;let h=i===0?[]:H.toArray(u.matchcap.subarray(0,i));return zo.push(u),h}},Og=class{constructor(r){this.sparse=new Uint32Array(r),this.dense=new Uint32Array(r),this.size=0,this.nextIndex=0}empty(){return this.nextIndex>=this.size}next(){return this.dense[this.nextIndex++]}clear(){this.size=0,this.nextIndex=0}contains(r){return r<this.sparse.length&&this.sparse[r]<this.size&&this.dense[this.sparse[r]]===r}insert(r){this.contains(r)||this.insertNew(r)}insertNew(r){r>=this.sparse.length||(this.sparse[r]=this.size,this.dense[this.size]=r,this.size++)}},dT=(r,e,t,n)=>{let s=r.length,i=e.length,a=0,u=0,c=[],l=[],h=!0,d=-1,p=E=>{let y=E?r:e,S=E?a:u,F=E?t:n;return d>0&&y[S]<=c[d]?!1:(c.push(y[S],y[S+1]),E?a+=2:u+=2,d+=2,l.push(F),!0)};for(;a<s||u<i;)if(u>=i?h=p(!0):a>=s||e[u]<r[a]?h=p(!1):h=p(!0),!h)return null;return{merged:c,next:l}},pT=class{constructor(r){this.start=r.start,this.numCap=r.numCap,this.inst=new Array(r.inst.length);for(let e=0;e<r.inst.length;e++){let t=r.inst[e],n=new O(t.op);n.out=t.out,n.arg=t.arg,n.runes=t.runes?new Int32Array(t.runes):new Int32Array(0),n.next=null,this.inst[e]=n}}},CT=r=>{let e=new pT(r);for(let t=0;t<e.inst.length;t++){let n=e.inst[t];if(n.op!==O.ALT&&n.op!==O.ALT_MATCH)continue;let s="out",i="arg",a=e.inst[n[i]];if(a.op!==O.ALT&&a.op!==O.ALT_MATCH&&(s="arg",i="out",a=e.inst[n[i]],a.op!==O.ALT&&a.op!==O.ALT_MATCH))continue;let u=e.inst[n[s]];if(u.op===O.ALT||u.op===O.ALT_MATCH)continue;let c="out",l="arg",h=!1;a.out===t?h=!0:a.arg===t&&(h=!0,c="arg",l="out"),h&&(a[c]=n[s]),n[s]===a[c]&&(n[i]=a[l])}return e},gT=r=>{if(r.inst.length>=1e3)return null;let e=new Og(r.inst.length),t=new Og(r.inst.length),n=new Array(r.inst.length),s=new Array(r.inst.length).fill(!1),i=a=>{let u=!0,c=r.inst[a];if(t.contains(a))return!0;switch(t.insert(a),c.op){case O.ALT:case O.ALT_MATCH:{u=i(c.out)&&i(c.arg);let l=s[c.out],h=s[c.arg];if(l&&h)return!1;if(h){let y=c.out;c.out=c.arg,c.arg=y;let S=l;l=h,h=S}l&&(s[a]=!0,c.op=O.ALT_MATCH);let d=n[c.out]||[],p=n[c.arg]||[],E=dT(d,p,c.out,c.arg);if(!E)return!1;n[a]=new Int32Array(E.merged),c.next=new Uint32Array(E.next);break}case O.CAPTURE:case O.EMPTY_WIDTH:case O.NOP:u=i(c.out),s[a]=s[c.out],n[a]=n[c.out]?new Int32Array(n[c.out]):new Int32Array(0),c.next=new Uint32Array(Math.floor(n[a].length/2)+1).fill(c.out);break;case O.MATCH:case O.FAIL:s[a]=c.op===O.MATCH;break;case O.RUNE:{if(s[a]=!1,c.next&&c.next.length>0)break;if(e.insert(c.out),!c.runes||c.runes.length===0){n[a]=new Int32Array(0),c.next=new Uint32Array([c.out]);break}let l=[];if(c.runes.length===1&&(c.arg&L.FOLD_CASE)!==0){let h=c.runes[0];l.push(h,h);for(let d=J.simpleFold(h);d!==h;d=J.simpleFold(d))l.push(d,d);l.sort((d,p)=>d-p)}else for(let h=0;h<c.runes.length;h++)l.push(c.runes[h]);n[a]=new Int32Array(l),c.next=new Uint32Array(Math.floor(l.length/2)+1).fill(c.out),c.op=O.RUNE;break}case O.RUNE1:{if(s[a]=!1,c.next&&c.next.length>0)break;e.insert(c.out);let l=[];if((c.arg&L.FOLD_CASE)!==0){let h=c.runes[0];l.push(h,h);for(let d=J.simpleFold(h);d!==h;d=J.simpleFold(d))l.push(d,d);l.sort((d,p)=>d-p)}else l.push(c.runes[0],c.runes[0]);n[a]=new Int32Array(l),c.next=new Uint32Array(Math.floor(l.length/2)+1).fill(c.out),c.op=O.RUNE;break}case O.RUNE_ANY:if(s[a]=!1,c.next&&c.next.length>0)break;e.insert(c.out),n[a]=new Int32Array([0,J.MAX_RUNE]),c.next=new Uint32Array([c.out]);break;case O.RUNE_ANY_NOT_NL:if(s[a]=!1,c.next&&c.next.length>0)break;e.insert(c.out),n[a]=new Int32Array([0,9,11,J.MAX_RUNE]),c.next=new Uint32Array(Math.floor(n[a].length/2)+1).fill(c.out)}return u};for(e.clear(),e.insert(r.start);!e.empty();)if(t.clear(),!i(e.next()))return null;for(let a=0;a<r.inst.length;a++)n[a]&&(r.inst[a].runes=n[a]);return r},mT=(r,e)=>{for(let t=0;t<e.inst.length;t++){let n=e.inst[t];switch(n.op){case O.ALT:case O.ALT_MATCH:case O.RUNE:break;case O.CAPTURE:case O.EMPTY_WIDTH:case O.NOP:case O.MATCH:case O.FAIL:r.inst[t].next=null;break;case O.RUNE1:case O.RUNE_ANY:case O.RUNE_ANY_NOT_NL:r.inst[t].next=null,r.inst[t].op=n.op,r.inst[t].runes=n.runes?new Int32Array(n.runes):new Int32Array(0)}}},xg=class fm{static compile(e){if(e.start===0||e.numLb>0)return null;let t=e.inst[e.start];if(t.op!==O.EMPTY_WIDTH||(t.arg&H.EMPTY_BEGIN_TEXT)===0)return null;let n=!1;for(let i=0;i<e.inst.length;i++)if(e.inst[i].op===O.ALT||e.inst[i].op===O.ALT_MATCH){n=!0;break}for(let i=0;i<e.inst.length;i++){let a=e.inst[i],u=e.inst[a.out].op;switch(a.op){case O.ALT:case O.ALT_MATCH:if(u===O.MATCH||e.inst[a.arg].op===O.MATCH)return null;break;case O.EMPTY_WIDTH:if(u===O.MATCH){if((a.arg&H.EMPTY_END_TEXT)===H.EMPTY_END_TEXT)continue;return null}break;default:if(u===O.MATCH&&n)return null}}let s=CT(e);return s=gT(s),s!==null&&mT(s,e),s}static next(e,t){let n=e.matchRunePos(t);return n>=0?e.next[n]:e.op===O.ALT_MATCH?e.out:0}static execute(e,t,n,s,i){let a=e.onepass;if(!a)return null;let u=new Int32Array(i).fill(-1),c=!1,l=t.step(n),h=l>>3,d=l&7,p=st.EOF(),E=-1,y=0;l!==st.EOF()&&(p=t.step(n+d),p!==st.EOF()&&(E=p>>3,y=p&7));let S=n===0?H.emptyOpContext(-1,h):t.context(n),F=a.start,U;for(;;){switch(U=a.inst[F],F=U.out,U.op){case O.MATCH:return s===L.ANCHOR_BOTH&&n!==t.endPos()?null:(c=!0,u.length>0&&(u[0]=0,u[1]=n),i===0?[]:H.toArray(u));case O.RUNE:if(!U.matchRune(h))return null;break;case O.RUNE1:if(h!==U.runes[0])return null;break;case O.RUNE_ANY:break;case O.RUNE_ANY_NOT_NL:if(h===10)return null;break;case O.ALT:case O.ALT_MATCH:F=fm.next(U,h);continue;case O.FAIL:return null;case O.NOP:continue;case O.EMPTY_WIDTH:if((U.arg&~S)!==0)return null;continue;case O.CAPTURE:U.arg<u.length&&(u[U.arg]=n);continue;default:throw new Yo("bad inst")}if(d===0)break;S=H.emptyOpContext(h,E),n+=d,h=E,d=y,h!==-1&&(p=t.step(n+d),p!==st.EOF()?(E=p>>3,y=p&7):(E=-1,y=0))}return c?i===0?[]:H.toArray(u):null}},I=class Z{static Op=om(["NO_MATCH","EMPTY_MATCH","LITERAL","CHAR_CLASS","ANY_CHAR_NOT_NL","ANY_CHAR","BEGIN_LINE","END_LINE","BEGIN_TEXT","END_TEXT","WORD_BOUNDARY","NO_WORD_BOUNDARY","CAPTURE","STAR","PLUS","QUEST","REPEAT","CONCAT","ALTERNATE","PLB","NLB","LEFT_PAREN","VERTICAL_BAR"]);static isPseudoOp(e){return e>=Z.Op.LEFT_PAREN}static emptySubs(){return[]}static quoteIfHyphen(e){return e===k.CODES["-"]?"\\":""}static fromRegexp(e){let t=new Z(e.op);return t.flags=e.flags,t.subs=e.subs,t.runes=e.runes,t.cap=e.cap,t.min=e.min,t.max=e.max,t.name=e.name,t.namedGroups=e.namedGroups,t.lb=e.lb,t}constructor(e){this.op=e,this.flags=0,this.subs=Z.emptySubs(),this.runes=new Int32Array(0),this.min=0,this.max=0,this.cap=0,this.name=null,this.namedGroups=Object.create(null),this.lb=0}reinit(){this.flags=0,this.subs=Z.emptySubs(),this.runes=new Int32Array(0),this.cap=0,this.min=0,this.max=0,this.name=null,this.namedGroups=Object.create(null),this.lb=0}toString(){return this.appendTo()}appendTo(){let e="";switch(this.op){case Z.Op.NO_MATCH:e+="[^\\x00-\\x{10FFFF}]";break;case Z.Op.EMPTY_MATCH:e+="(?:)";break;case Z.Op.STAR:case Z.Op.PLUS:case Z.Op.QUEST:case Z.Op.REPEAT:{let t=this.subs[0];switch(t.op>Z.Op.CAPTURE||t.op===Z.Op.LITERAL&&t.runes.length>1?e+=`(?:${t.appendTo()})`:e+=t.appendTo(),this.op){case Z.Op.STAR:e+="*";break;case Z.Op.PLUS:e+="+";break;case Z.Op.QUEST:e+="?";break;case Z.Op.REPEAT:e+=`{${this.min}`,this.min!==this.max&&(e+=",",this.max>=0&&(e+=this.max)),e+="}"}(this.flags&L.NON_GREEDY)!==0&&(e+="?");break}case Z.Op.CONCAT:for(let t of this.subs)t.op===Z.Op.ALTERNATE?e+=`(?:${t.appendTo()})`:e+=t.appendTo();break;case Z.Op.ALTERNATE:{let t="";for(let n of this.subs)e+=t,t="|",e+=n.appendTo();break}case Z.Op.LITERAL:(this.flags&L.FOLD_CASE)!==0&&(e+="(?i:");for(let t of this.runes)e+=H.escapeRune(t);(this.flags&L.FOLD_CASE)!==0&&(e+=")");break;case Z.Op.ANY_CHAR_NOT_NL:e+="(?-s:.)";break;case Z.Op.ANY_CHAR:e+="(?s:.)";break;case Z.Op.PLB:e+=`(?<=${this.subs[0].appendTo()})`;break;case Z.Op.NLB:e+=`(?<!${this.subs[0].appendTo()})`;break;case Z.Op.CAPTURE:this.name===null||this.name.length===0?e+="(":e+=`(?P<${this.name}>`,this.subs[0].op!==Z.Op.EMPTY_MATCH&&(e+=this.subs[0].appendTo()),e+=")";break;case Z.Op.BEGIN_TEXT:e+="\\A";break;case Z.Op.END_TEXT:(this.flags&L.WAS_DOLLAR)!==0?e+="(?-m:$)":e+="\\z";break;case Z.Op.BEGIN_LINE:e+="^";break;case Z.Op.END_LINE:e+="$";break;case Z.Op.WORD_BOUNDARY:e+="\\b";break;case Z.Op.NO_WORD_BOUNDARY:e+="\\B";break;case Z.Op.CHAR_CLASS:if(this.runes.length%2!==0){e+="[invalid char class]";break}if(e+="[",this.runes.length===0)e+="^\\x00-\\x{10FFFF}";else if(this.runes[0]===0&&this.runes[this.runes.length-1]===J.MAX_RUNE){e+="^";for(let t=1;t<this.runes.length-1;t+=2){let n=this.runes[t]+1,s=this.runes[t+1]-1;e+=Z.quoteIfHyphen(n),e+=H.escapeRune(n),n!==s&&(e+="-",e+=Z.quoteIfHyphen(s),e+=H.escapeRune(s))}}else for(let t=0;t<this.runes.length;t+=2){let n=this.runes[t],s=this.runes[t+1];e+=Z.quoteIfHyphen(n),e+=H.escapeRune(n),n!==s&&(e+="-",e+=Z.quoteIfHyphen(s),e+=H.escapeRune(s))}e+="]";break;default:e+=this.op}return e}maxCap(){let e=0;if(this.op===Z.Op.CAPTURE&&(e=this.cap),this.subs!==null)for(let t of this.subs){let n=t.maxCap();e<n&&(e=n)}return e}equals(e){if(!(e!==null&&e instanceof Z)||this.op!==e.op)return!1;switch(this.op){case Z.Op.END_TEXT:if((this.flags&L.WAS_DOLLAR)!==(e.flags&L.WAS_DOLLAR))return!1;break;case Z.Op.LITERAL:case Z.Op.CHAR_CLASS:if((this.flags&L.FOLD_CASE)!==(e.flags&L.FOLD_CASE))return!1;if(this.runes===null&&e.runes===null)break;if(this.runes===null||e.runes===null||this.runes.length!==e.runes.length)return!1;for(let t=0;t<this.runes.length;t++)if(this.runes[t]!==e.runes[t])return!1;break;case Z.Op.ALTERNATE:case Z.Op.CONCAT:if(this.subs.length!==e.subs.length)return!1;for(let t=0;t<this.subs.length;++t)if(!this.subs[t].equals(e.subs[t]))return!1;break;case Z.Op.STAR:case Z.Op.PLUS:case Z.Op.QUEST:if((this.flags&L.NON_GREEDY)!==(e.flags&L.NON_GREEDY)||!this.subs[0].equals(e.subs[0]))return!1;break;case Z.Op.REPEAT:if((this.flags&L.NON_GREEDY)!==(e.flags&L.NON_GREEDY)||this.min!==e.min||this.max!==e.max||!this.subs[0].equals(e.subs[0]))return!1;break;case Z.Op.CAPTURE:if(this.cap!==e.cap||(this.name===null?e.name!==null:this.name!==e.name)||!this.subs[0].equals(e.subs[0]))return!1;break;case Z.Op.PLB:case Z.Op.NLB:if(this.lb!==e.lb||!this.subs[0].equals(e.subs[0]))return!1}return!0}},lB=class{static walk(r,e){let t=[],n=r,s;for(;;){if(n.subs.length===0)s=e.leaf(n);else{let i=e.enter(n);if(i.result===void 0){t.push({re:n,state:i,i:0}),n=n.subs[0];continue}s=i.result}for(;;){if(t.length===0)return s;let i=t[t.length-1];if(e.child(i.re,i.state,s,i.i),i.i++,i.state.result===void 0&&i.i<i.re.subs.length){n=i.re.subs[i.i];break}t.pop(),s=i.state.result!==void 0?i.state.result:e.leave(i.re,i.state)}}}},Fg=class{constructor(r,e){let t=new Map,n=[0],s=[0],i=[0],a=[0];for(let y of r){let S=0;for(let F=0;F<y.length;F++){let U=S*e+y[F],z=t.get(U);z===void 0&&(z=n.length,t.set(U,z),n.push(S),s.push(y[F]),i.push(i[S]+1),a.push(0)),S=z}a[S]=1}let u=n.length,c=new Int32Array(u-1);for(let y=1;y<u;y++)c[y-1]=y;c.sort((y,S)=>n[y]-n[S]||s[y]-s[S]);let l=new Int32Array(u+1);for(let y=1;y<u;y++)l[n[y]+1]++;for(let y=0;y<u;y++)l[y+1]+=l[y];let h=new Int32Array(u-1);for(let y=0;y<c.length;y++)h[y]=s[c[y]];this.childStart=l,this.childUnit=h,this.childNode=c;let d=new Int32Array(u);for(let y=0;y<u;y++)d[y]=y;d.sort((y,S)=>i[y]-i[S]);let p=new Int32Array(u),E=Uint8Array.from(a);for(let y=1;y<u;y++){let S=d[y],F=n[S];if(F!==0){let U=p[F],z=this.next(U,s[S]);for(;z<0&&U!==0;)U=p[U],z=this.next(U,s[S]);p[S]=z>=0?z:0}E[S]|=E[p[S]]}this.fail=p,this.match=E}next(r,e){let t=this.childStart[r],n=this.childStart[r+1],s=this.childUnit;for(;t<n;){let i=t+n>>1,a=s[i];if(a===e)return this.childNode[i];a<e?t=i+1:n=i}return-1}advance(r,e){for(;;){let t=this.next(r,e);if(t>=0)return t;if(r===0)return 0;r=this.fail[r]}}searchUTF16(r,e,t){let n=0;for(let s=e;s<t;s++)if(n=this.advance(n,r.charCodeAt(s)),this.match[n]===1)return!0;return!1}searchUTF8(r,e,t){let n=0;for(let s=e;s<t;s++)if(n=this.advance(n,r[s]),this.match[n]===1)return!0;return!1}},ie=class os{static Type={NONE:0,EXACT:1,AND:2,OR:3};static MAX_SCANS=32;static MAX_AC_UNITS=1<<18;constructor(e){this.type=e,this.subs=[],this.str="",this.bytes=null,this.cost=e===os.Type.EXACT?1:0,this.allExact=!1,this.ac16=null,this.ac8=null}automaton16(){if(this.ac16===null){let e=this.subs.map(t=>{let n=new Array(t.str.length);for(let s=0;s<t.str.length;s++)n[s]=t.str.charCodeAt(s);return n});this.ac16=new Fg(e,65536)}return this.ac16}automaton8(){return this.ac8===null&&(this.ac8=new Fg(this.subs.map(e=>e.bytes),256)),this.ac8}eval(e,t){switch(this.type){case os.Type.NONE:return!0;case os.Type.EXACT:return e.hasString(this,t);case os.Type.AND:for(let n=0;n<this.subs.length;n++)if(!this.subs[n].eval(e,t))return!1;return!0;case os.Type.OR:if(this.allExact)return e.hasAnyString(this,t);for(let n=0;n<this.subs.length;n++)if(this.subs[n].eval(e,t))return!0;return!1;default:return!0}}},ET=class us{static build(e){return e?lB.walk(e,us.WALKER):new ie(ie.Type.NONE)}static WALKER={leaf:e=>us.leaf(e),enter:e=>us.enter(e),child:(e,t,n)=>us.child(e,t,n),leave:(e,t)=>us.leave(e,t)};static leaf(e){if(e.op!==I.Op.LITERAL)return new ie(ie.Type.NONE);if(e.runes.length===0||(e.flags&L.FOLD_CASE)!==0)return new ie(ie.Type.NONE);let t="";for(let s=0;s<e.runes.length;s++){if(J.isUnsearchable(e.runes[s]))return new ie(ie.Type.NONE);t+=String.fromCodePoint(e.runes[s])}let n=new ie(ie.Type.EXACT);return n.str=t,n.bytes=H.stringToUtf8ByteArray(n.str),n}static enter(e){switch(e.op){case I.Op.CAPTURE:case I.Op.PLUS:return{sub:null};case I.Op.REPEAT:return e.min>=1?{sub:null}:{result:new ie(ie.Type.NONE)};case I.Op.CONCAT:return{pf:new ie(ie.Type.AND),subs:[]};case I.Op.ALTERNATE:return{pf:new ie(ie.Type.OR),subs:[]};default:return{result:new ie(ie.Type.NONE)}}}static child(e,t,n){if(t.subs===void 0){t.sub=n;return}if(t.pf.type===ie.Type.AND){if(n.type===ie.Type.NONE)return;if(n.type===ie.Type.AND){for(let s=0;s<n.subs.length;s++)t.subs.push(n.subs[s]);return}t.subs.push(n);return}if(n.type===ie.Type.NONE){t.result=new ie(ie.Type.NONE);return}if(n.type===ie.Type.OR){for(let s=0;s<n.subs.length;s++)t.subs.push(n.subs[s]);return}t.subs.push(n)}static leave(e,t){if(t.subs===void 0)return t.sub;let n=t.pf,s=new Set,i=[];for(let l of t.subs){if(l.type===ie.Type.EXACT){if(s.has(l.str))continue;s.add(l.str)}i.push(l)}if(n.type===ie.Type.AND){let l=[],h=0;for(let d of i)h+d.cost>ie.MAX_SCANS||(l.push(d),h+=d.cost);return l.length===0?new ie(ie.Type.NONE):l.length===1?l[0]:(n.subs=l,n.cost=h,n)}if(i.length===0)return new ie(ie.Type.NONE);if(i.length===1)return i[0];n.subs=i;let a=!0,u=0,c=0;for(let l of i)l.type!==ie.Type.EXACT?a=!1:c+=l.bytes.length,u+=l.cost;return a?c>ie.MAX_AC_UNITS?new ie(ie.Type.NONE):(n.allExact=!0,n.cost=1,n):u>ie.MAX_SCANS?new ie(ie.Type.NONE):(n.cost=u,n)}},Dt=class{constructor(r=0,e=0){this.head=r,this.tail=e}},_T=class{constructor(){this.inst=[],this.start=0,this.numCap=2,this.lbStarts=[],this.numLb=0,this.lbInst=null}getInst(r){return this.inst[r]}numInst(){return this.inst.length}addInst(r){this.inst.push(new O(r))}markLookbehindInsts(){let r=new Uint8Array(this.inst.length),e=this.lbStarts.slice();for(;e.length>0;){let t=e.pop();if(t===0||r[t]===1)continue;r[t]=1;let n=this.inst[t];switch(n.op){case O.ALT:case O.ALT_MATCH:e.push(n.out,n.arg);break;case O.MATCH:case O.FAIL:break;default:e.push(n.out)}}this.lbInst=r}skipNop(r){let e=this.inst[r];for(;e.op===O.NOP||e.op===O.CAPTURE;)e=this.inst[r],r=e.out;return e}prefix(){let r="",e=this.skipNop(this.start);if(!O.isRuneOp(e.op)||e.runes.length!==1)return[e.op===O.MATCH,r];for(;O.isRuneOp(e.op)&&e.runes.length===1&&(e.arg&L.FOLD_CASE)===0&&!J.isUnsearchable(e.runes[0]);)r+=String.fromCodePoint(e.runes[0]),e=this.skipNop(e.out);return[e.op===O.MATCH,r]}startCond(){let r=0,e=this.start;e:for(;;){let t=this.inst[e];switch(t.op){case O.EMPTY_WIDTH:r|=t.arg;break;case O.FAIL:return-1;case O.CAPTURE:case O.NOP:break;default:break e}e=t.out}return r}patch(r,e){let t=r.head;for(;t!==0;){let n=this.inst[t>>1];(t&1)===0?(t=n.out,n.out=e):(t=n.arg,n.arg=e)}}append(r,e){if(r.head===0)return e;if(e.head===0)return r;let t=this.inst[r.tail>>1];return(r.tail&1)===0?t.out=e.head:t.arg=e.head,new Dt(r.head,e.tail)}toString(){let r="";for(let e=0;e<this.inst.length;e++){let t=r.length;r+=e,e===this.start&&(r+="*"),r+="        ".substring(r.length-t),r+=this.inst[e],r+=`
`}return r}},yT=new Int32Array([0,k.CODES[`
`]-1,k.CODES[`
`]+1,J.MAX_RUNE]),Lg=new Int32Array([0,J.MAX_RUNE]),Qo=class{constructor(r=0,e=new Dt,t=!1){this.i=r,this.out=e,this.nullable=t}},dm=class oB{static compileRegexp(e){let t=new oB,n=t.compile(e);return t.prog.patch(n.out,t.newInst(O.MATCH).i),t.prog.start=n.i,t.prog.markLookbehindInsts(),t.prog}static compileSet(e){let t=new oB;if(e.length===0)return t.prog.start=t.newInst(O.FAIL).i,t.prog.markLookbehindInsts(),t.prog;let n=[];for(let i=0;i<e.length;i++){t.lbOffset=t.prog.numLb;let a=t.compile(e[i]),u=t.newInst(O.MATCH);t.prog.getInst(u.i).arg=i,t.prog.patch(a.out,u.i),n.push(a.i)}let s=n[0];for(let i=1;i<n.length;i++){let a=t.newInst(O.ALT),u=t.prog.getInst(a.i);u.out=s,u.arg=n[i],s=a.i}return t.prog.start=s,t.prog.markLookbehindInsts(),t.prog}constructor(){this.prog=new _T,this.newInst(O.FAIL),this.lbOffset=0,this.runeCache=new Map,this.walker={leaf:e=>this.leaf(e),enter:e=>this.enter(e),child:(e,t,n)=>this.child(e,t,n),leave:(e,t)=>this.leave(e,t)}}newInst(e){return this.prog.addInst(e),new Qo(this.prog.numInst()-1,new Dt,!0)}nop(){let e=this.newInst(O.NOP);return e.out=new Dt(e.i<<1,e.i<<1),e}fail(){return new Qo}cap(e){let t=this.newInst(O.CAPTURE);return t.out=new Dt(t.i<<1,t.i<<1),this.prog.getInst(t.i).arg=e,this.prog.numCap<e+1&&(this.prog.numCap=e+1),t}cat(e,t){return e.i===0||t.i===0?(this.prog.patch(e.out,0),this.prog.patch(t.out,0),this.fail()):(this.prog.patch(e.out,t.i),new Qo(e.i,t.out,e.nullable&&t.nullable))}alt(e,t){if(e.i===0)return t;if(t.i===0)return e;let n=this.newInst(O.ALT),s=this.prog.getInst(n.i);return s.out=e.i,s.arg=t.i,n.out=this.prog.append(e.out,t.out),n.nullable=e.nullable||t.nullable,n}loop(e,t){let n=this.newInst(O.ALT),s=this.prog.getInst(n.i);return t?(s.arg=e.i,n.out=new Dt(n.i<<1,n.i<<1)):(s.out=e.i,n.out=new Dt(n.i<<1|1,n.i<<1|1)),this.prog.patch(e.out,n.i),n}quest(e,t){if(e.i===0)return this.nop();let n=this.newInst(O.ALT),s=this.prog.getInst(n.i);return t?(s.arg=e.i,n.out=new Dt(n.i<<1,n.i<<1)):(s.out=e.i,n.out=new Dt(n.i<<1|1,n.i<<1|1)),n.out=this.prog.append(n.out,e.out),n}star(e,t){return e.i===0?this.nop():e.nullable?this.quest(this.plus(e,t),t):this.loop(e,t)}plus(e,t){return e.i===0?this.fail():new Qo(e.i,this.loop(e,t).out,e.nullable)}empty(e){let t=this.newInst(O.EMPTY_WIDTH);return this.prog.getInst(t.i).arg=e,t.out=new Dt(t.i<<1,t.i<<1),t}rune(e,t){let n=this.newInst(O.RUNE);n.nullable=!1;let s=this.prog.getInst(n.i);return s.runes=e,t&=L.FOLD_CASE,(e.length!==1||J.simpleFold(e[0])===e[0])&&(t&=~L.FOLD_CASE),s.arg=t,n.out=new Dt(n.i<<1,n.i<<1),(t&L.FOLD_CASE)===0&&e.length===1||e.length===2&&e[0]===e[1]?s.op=O.RUNE1:e.length===2&&e[0]===0&&e[1]===J.MAX_RUNE?s.op=O.RUNE_ANY:e.length===4&&e[0]===0&&e[1]===k.CODES[`
`]-1&&e[2]===k.CODES[`
`]+1&&e[3]===J.MAX_RUNE&&(s.op=O.RUNE_ANY_NOT_NL),n}lookBehind(e,t){let n=Math.sign(t)*(Math.abs(t)+this.lbOffset),s=this.newInst(O.LB_WRITE);this.prog.getInst(s.i).arg=n;let i=this.rune(Lg,0),a=this.star(i,!0),u=this.cat(a,e);this.prog.patch(u.out,s.i);let c=this.newInst(O.LB_CHECK);return this.prog.getInst(c.i).arg=n,this.prog.lbStarts.push(u.i),Math.abs(n)>this.prog.numLb&&(this.prog.numLb=Math.abs(n)),c.out=new Dt(c.i<<1,c.i<<1),c}compile(e){return lB.walk(e,this.walker)}leaf(e){switch(e.op){case I.Op.NO_MATCH:return this.fail();case I.Op.EMPTY_MATCH:return this.nop();case I.Op.LITERAL:{if(e.runes.length===0)return this.nop();let t=null;for(let n of e.runes){let s=this.runeCache.get(n);s===void 0&&(s=new Int32Array([n]),this.runeCache.set(n,s));let i=this.rune(s,e.flags);t=t===null?i:this.cat(t,i)}return t}case I.Op.CHAR_CLASS:return this.rune(e.runes,e.flags);case I.Op.ANY_CHAR_NOT_NL:return this.rune(yT,0);case I.Op.ANY_CHAR:return this.rune(Lg,0);case I.Op.BEGIN_LINE:return this.empty(H.EMPTY_BEGIN_LINE);case I.Op.END_LINE:return this.empty(H.EMPTY_END_LINE);case I.Op.BEGIN_TEXT:return this.empty(H.EMPTY_BEGIN_TEXT);case I.Op.END_TEXT:return this.empty(H.EMPTY_END_TEXT);case I.Op.WORD_BOUNDARY:return this.empty(H.EMPTY_WORD_BOUNDARY);case I.Op.NO_WORD_BOUNDARY:return this.empty(H.EMPTY_NO_WORD_BOUNDARY);case I.Op.CONCAT:case I.Op.ALTERNATE:return this.nop();default:throw new qi("regexp: unhandled case in compile")}}enter(e){switch(e.op){case I.Op.PLB:case I.Op.NLB:case I.Op.STAR:case I.Op.PLUS:case I.Op.QUEST:return{sub:null};case I.Op.CAPTURE:return{bra:this.cap(e.cap<<1),sub:null};case I.Op.CONCAT:case I.Op.ALTERNATE:return{f:null};default:throw new qi("regexp: unhandled case in compile")}}child(e,t,n){e.op===I.Op.CONCAT?t.f=t.f===null?n:this.cat(t.f,n):e.op===I.Op.ALTERNATE?t.f=t.f===null?n:this.alt(t.f,n):t.sub=n}leave(e,t){switch(e.op){case I.Op.PLB:case I.Op.NLB:return this.lookBehind(t.sub,e.lb);case I.Op.CAPTURE:{let n=this.cap(e.cap<<1|1);return this.cat(this.cat(t.bra,t.sub),n)}case I.Op.STAR:return this.star(t.sub,(e.flags&L.NON_GREEDY)!==0);case I.Op.PLUS:return this.plus(t.sub,(e.flags&L.NON_GREEDY)!==0);case I.Op.QUEST:return this.quest(t.sub,(e.flags&L.NON_GREEDY)!==0);case I.Op.CONCAT:case I.Op.ALTERNATE:return t.f;default:throw new qi("regexp: unhandled case in compile")}}},pm=class Ze{static simplify(e){return e===null?null:lB.walk(e,Ze.WALKER)}static WALKER={leaf:e=>Ze.leaf(e),enter:e=>Ze.enter(e),child:(e,t,n,s)=>Ze.child(e,t,n,s),leave:(e,t)=>Ze.leave(e,t)};static leaf(e){if(e.op===I.Op.CHAR_CLASS){if(e.runes===null)return e;if(e.runes.length===0)return new I(I.Op.NO_MATCH);if(e.runes.length===2&&e.runes[0]===0&&e.runes[1]===J.MAX_RUNE)return new I(I.Op.ANY_CHAR);if(e.runes.length===4&&e.runes[0]===0&&e.runes[1]===k.CODES[`
`]-1&&e.runes[2]===k.CODES[`
`]+1&&e.runes[3]===J.MAX_RUNE)return new I(I.Op.ANY_CHAR_NOT_NL)}return e}static enter(e){switch(e.op){case I.Op.PLB:case I.Op.NLB:case I.Op.CAPTURE:case I.Op.STAR:case I.Op.PLUS:case I.Op.QUEST:return{sub:null};case I.Op.CONCAT:case I.Op.ALTERNATE:return{subs:[],changed:!1};case I.Op.REPEAT:return e.min===0&&e.max===0?{result:new I(I.Op.EMPTY_MATCH)}:{sub:null};default:return{result:e}}}static child(e,t,n,s){if(t.subs===void 0){t.sub=n;return}if(n!==e.subs[s]&&(t.changed=!0),e.op===I.Op.CONCAT){if(n.op===I.Op.NO_MATCH){t.result=new I(I.Op.NO_MATCH);return}if(n.op===I.Op.EMPTY_MATCH){t.changed=!0;return}if(n.op===I.Op.CONCAT){t.changed=!0;for(let i=0;i<n.subs.length;i++)t.subs.push(n.subs[i]);return}}else{if(n.op===I.Op.NO_MATCH){t.changed=!0;return}if(n.op===I.Op.ALTERNATE){t.changed=!0;for(let i=0;i<n.subs.length;i++)t.subs.push(n.subs[i]);return}}t.subs.push(n)}static leave(e,t){switch(e.op){case I.Op.PLB:case I.Op.NLB:case I.Op.CAPTURE:{let n=t.sub;if(n!==e.subs[0]){let s=I.fromRegexp(e);return s.runes=new Int32Array(0),s.subs=[n],s}return e}case I.Op.CONCAT:case I.Op.ALTERNATE:if(t.changed){let n=t.subs;if(n.length===0)return new I(e.op===I.Op.CONCAT?I.Op.EMPTY_MATCH:I.Op.NO_MATCH);if(n.length===1)return n[0];let s=I.fromRegexp(e);return s.runes=new Int32Array(0),s.subs=n,s}return e;case I.Op.STAR:case I.Op.PLUS:case I.Op.QUEST:return Ze.simplify1(e.op,e.flags,t.sub,e);case I.Op.REPEAT:return Ze.simplifyRepeat(e,t.sub);default:return e}}static simplifyRepeat(e,t){if(e.max===-1){if(e.min===0)return Ze.simplify1(I.Op.STAR,e.flags,t,null);if(e.min===1)return Ze.simplify1(I.Op.PLUS,e.flags,t,null);let s=[];for(let i=0;i<e.min-1;i++)s.push(t);return s.push(Ze.simplify1(I.Op.PLUS,e.flags,t,null)),Ze.concat(s)}if(e.min===1&&e.max===1)return t;let n=null;if(e.min>0){n=[];for(let s=0;s<e.min;s++)n.push(t)}if(e.max>e.min){let s=Ze.simplify1(I.Op.QUEST,e.flags,t,null);for(let i=e.min+1;i<e.max;i++)s=Ze.simplify1(I.Op.QUEST,e.flags,Ze.concat([t,s]),null);if(n===null)return s;n.push(s)}return n!==null?Ze.concat(n):new I(I.Op.NO_MATCH)}static concat(e){let t=[];for(let s=0;s<e.length;s++){let i=e[s];if(i.op===I.Op.NO_MATCH)return new I(I.Op.NO_MATCH);if(i.op!==I.Op.EMPTY_MATCH){if(i.op===I.Op.CONCAT){for(let a=0;a<i.subs.length;a++)t.push(i.subs[a]);continue}t.push(i)}}if(t.length===0)return new I(I.Op.EMPTY_MATCH);if(t.length===1)return t[0];let n=new I(I.Op.CONCAT);return n.subs=t,n}static simplify1(e,t,n,s){if(n.op===I.Op.EMPTY_MATCH)return n;if(n.op===I.Op.NO_MATCH)return e===I.Op.PLUS?n:new I(I.Op.EMPTY_MATCH);if(e===n.op&&(t&L.NON_GREEDY)===(n.flags&L.NON_GREEDY))return n;if(s!==null&&s.op===e&&(s.flags&L.NON_GREEDY)===(t&L.NON_GREEDY)&&n===s.subs[0])return s;let i=new I(e);return i.flags=t,i.subs=[n],i}},le=class{constructor(r,e){this.sign=r,this.cls=e}},kg=[48,57],Vg=[9,10,12,13,32,32],Mg=[48,57,65,90,95,95,97,122],Gg=new Map([["\\d",new le(1,kg)],["\\D",new le(-1,kg)],["\\s",new le(1,Vg)],["\\S",new le(-1,Vg)],["\\w",new le(1,Mg)],["\\W",new le(-1,Mg)]]),Ug=[48,57,65,90,97,122],Hg=[65,90,97,122],qg=[0,127],jg=[9,9,32,32],Kg=[0,31,127,127],Jg=[48,57],zg=[33,126],Wg=[97,122],Qg=[32,126],$g=[33,47,58,64,91,96,123,126],Yg=[9,13,32,32],Xg=[65,90],Zg=[48,57,65,90,95,95,97,122],em=[48,57,65,70,97,102],tm=new Map([["[:alnum:]",new le(1,Ug)],["[:^alnum:]",new le(-1,Ug)],["[:alpha:]",new le(1,Hg)],["[:^alpha:]",new le(-1,Hg)],["[:ascii:]",new le(1,qg)],["[:^ascii:]",new le(-1,qg)],["[:blank:]",new le(1,jg)],["[:^blank:]",new le(-1,jg)],["[:cntrl:]",new le(1,Kg)],["[:^cntrl:]",new le(-1,Kg)],["[:digit:]",new le(1,Jg)],["[:^digit:]",new le(-1,Jg)],["[:graph:]",new le(1,zg)],["[:^graph:]",new le(-1,zg)],["[:lower:]",new le(1,Wg)],["[:^lower:]",new le(-1,Wg)],["[:print:]",new le(1,Qg)],["[:^print:]",new le(-1,Qg)],["[:punct:]",new le(1,$g)],["[:^punct:]",new le(-1,$g)],["[:space:]",new le(1,Yg)],["[:^space:]",new le(-1,Yg)],["[:upper:]",new le(1,Xg)],["[:^upper:]",new le(-1,Xg)],["[:word:]",new le(1,Zg)],["[:^word:]",new le(-1,Zg)],["[:xdigit:]",new le(1,em)],["[:^xdigit:]",new le(-1,em)]]),gr=class $o{static charClassToString(e,t){let n="[";for(let s=0;s<t;s+=2){s>0&&(n+=" ");let i=e[s],a=e[s+1];i===a?n+=`0x${i.toString(16)}`:n+=`0x${i.toString(16)}-0x${a.toString(16)}`}return n+="]",n}static sortRanges(e,t){let n=t>>1,s=new Array(n);for(let a=0;a<n;a++)s[a]=a;s.sort((a,u)=>e[2*a]-e[2*u]||e[2*u+1]-e[2*a+1]);let i=e.slice(0,t);for(let a=0;a<n;a++)e[2*a]=i[2*s[a]],e[2*a+1]=i[2*s[a]+1]}constructor(e=H.emptyInts()){this.r=e,this.len=e.length}toArray(){return this.r instanceof Int32Array?this.len===this.r.length?this.r:this.r.subarray(0,this.len):new Int32Array(this.len===this.r.length?this.r:this.r.slice(0,this.len))}toGrowableArray(){return Array.isArray(this.r)?(this.r.length=this.len,this.r):Array.from(this.r.subarray(0,this.len))}cleanClass(){if(this.len<4)return this;$o.sortRanges(this.r,this.len);let e=2;for(let t=2;t<this.len;t+=2){let n=this.r[t],s=this.r[t+1];if(n<=this.r[e-1]+1){s>this.r[e-1]&&(this.r[e-1]=s);continue}this.r[e]=n,this.r[e+1]=s,e+=2}return this.len=e,this}appendLiteral(e,t){return(t&L.FOLD_CASE)!==0?this.appendFoldedRange(e,e):this.appendRange(e,e)}appendRange(e,t){if(this.len>0){for(let n=2;n<=4;n+=2)if(this.len>=n){let s=this.r[this.len-n],i=this.r[this.len-n+1];if(e<=i+1&&s<=t+1)return e<s&&(this.r[this.len-n]=e),t>i&&(this.r[this.len-n+1]=t),this}}return this.r[this.len++]=e,this.r[this.len++]=t,this}appendFoldedRange(e,t){if(e<=J.MIN_FOLD&&t>=J.MAX_FOLD)return this.appendRange(e,t);if(t<J.MIN_FOLD||e>J.MAX_FOLD)return this.appendRange(e,t);e<J.MIN_FOLD&&(this.appendRange(e,J.MIN_FOLD-1),e=J.MIN_FOLD),t>J.MAX_FOLD&&(this.appendRange(J.MAX_FOLD+1,t),t=J.MAX_FOLD);for(let n=e;n<=t;n++){this.appendRange(n,n);for(let s=J.simpleFold(n);s!==n;s=J.simpleFold(s))this.appendRange(s,s)}return this}appendClass(e){for(let t=0;t<e.length;t+=2)this.appendRange(e[t],e[t+1]);return this}appendFoldedClass(e){for(let t=0;t<e.length;t+=2)this.appendFoldedRange(e[t],e[t+1]);return this}appendNegatedClass(e){let t=0;for(let n=0;n<e.length;n+=2){let s=e[n],i=e[n+1];t<=s-1&&this.appendRange(t,s-1),t=i+1}return t<=J.MAX_RUNE&&this.appendRange(t,J.MAX_RUNE),this}appendTable(e){for(let t=0;t<e.length;++t){let n=e.getLo(t),s=e.getHi(t),i=e.getStride(t);if(i===1){this.appendRange(n,s);continue}for(let a=n;a<=s;a+=i)this.appendRange(a,a)}return this}appendNegatedTable(e){let t=0;for(let n=0;n<e.length;++n){let s=e.getLo(n),i=e.getHi(n),a=e.getStride(n);if(a===1){t<=s-1&&this.appendRange(t,s-1),t=i+1;continue}for(let u=s;u<=i;u+=a)t<=u-1&&this.appendRange(t,u-1),t=u+1}return t<=J.MAX_RUNE&&this.appendRange(t,J.MAX_RUNE),this}appendTableWithSign(e,t){return t<0?this.appendNegatedTable(e):this.appendTable(e)}negateClass(){let e=0,t=0;for(let n=0;n<this.len;n+=2){let s=this.r[n],i=this.r[n+1];e<=s-1&&(this.r[t]=e,this.r[t+1]=s-1,t+=2),e=i+1}return this.len=t,e<=J.MAX_RUNE&&(this.r[this.len++]=e,this.r[this.len++]=J.MAX_RUNE),this}appendClassWithSign(e,t){return t<0?this.appendNegatedClass(e):this.appendClass(e)}appendGroup(e,t){let n=e.cls;return t&&(n=new $o().appendFoldedClass(n).cleanClass().toArray()),this.appendClassWithSign(n,e.sign)}toString(){return $o.charClassToString(this.r,this.len)}},wT=class{constructor(r){this.str=r,this.position=0}pos(){return this.position}rewindTo(r){this.position=r}more(){return this.position<this.str.length}peek(){return this.str.codePointAt(this.position)}skip(r){this.position+=r}skipString(r){this.position+=r.length}pop(){let r=this.str.codePointAt(this.position);return this.position+=H.charCount(r),r}lookingAt(r){return this.str.startsWith(r,this.position)}rest(){return this.str.substring(this.position)}from(r){return this.str.substring(r,this.position)}toString(){return this.rest()}},Hi=class Q{static ERR_INTERNAL_ERROR="regexp/syntax: internal error";static ERR_INVALID_CHAR_RANGE="invalid character class range";static ERR_INVALID_ESCAPE="invalid escape sequence";static ERR_INVALID_NAMED_CAPTURE="invalid named capture";static ERR_INVALID_PERL_OP="invalid or unsupported Perl syntax";static ERR_INVALID_REPEAT_OP="invalid nested repetition operator";static ERR_INVALID_REPEAT_SIZE="invalid repeat count";static ERR_MISSING_BRACKET="missing closing ]";static ERR_MISSING_PAREN="missing closing )";static ERR_MISSING_REPEAT_ARGUMENT="missing argument to repetition operator";static ERR_TRAILING_BACKSLASH="trailing backslash at end of expression";static ERR_DUPLICATE_NAMED_CAPTURE="duplicate capture group name";static ERR_UNEXPECTED_PAREN="unexpected )";static ERR_NESTING_DEPTH="expression nests too deeply";static ERR_LARGE="expression too large";static ERR_INVALID_CAPTURE_IN_LOOKBEHIND="invalid capture in lookbehind";static MAX_HEIGHT=1e3;static MAX_SIZE=1398101;static MAX_RUNES=33554432;static ANY_TABLE=new g(new Uint32Array([0,J.MAX_RUNE,1]));static ASCII_TABLE=new g(new Uint32Array([0,127,1]));static ASCII_FOLD_TABLE=new g(new Uint32Array([0,127,1,383,383,1,8490,8490,1]));static unicodeTable(e){return e==="Any"?{tab:Q.ANY_TABLE,fold:Q.ANY_TABLE,sign:1}:e==="Ascii"?{tab:Q.ASCII_TABLE,fold:Q.ASCII_FOLD_TABLE,sign:1}:e==="Assigned"?{tab:gt.CATEGORIES.get("Cn"),fold:gt.CATEGORIES.get("Cn"),sign:-1}:e==="Lc"?{tab:gt.CATEGORIES.get("LC"),fold:gt.FOLD_CATEGORIES.get("LC"),sign:1}:gt.CATEGORIES.has(e)?{tab:gt.CATEGORIES.get(e),fold:gt.FOLD_CATEGORIES.get(e),sign:1}:gt.SCRIPTS.has(e)?{tab:gt.SCRIPTS.get(e),fold:gt.FOLD_SCRIPT.get(e),sign:1}:null}static minFoldRune(e){if(e<J.MIN_FOLD||e>J.MAX_FOLD)return e;let t=e,n=e;for(e=J.simpleFold(e);e!==n;e=J.simpleFold(e))t>e&&(t=e);return t}static leadingRegexp(e){if(e.op===I.Op.EMPTY_MATCH)return null;if(e.op===I.Op.CONCAT&&e.subs.length>0){let t=e.subs[0];return t.op===I.Op.EMPTY_MATCH?null:t}return e}static literalRegexp(e,t){let n=new I(I.Op.LITERAL);return n.flags=t,n.runes=H.stringToRunes(e),n}static parse(e,t){return new Q(e,t).parseInternal()}static parseRepeat(e){let t=e.pos();if(!e.more()||!e.lookingAt("{"))return-1;e.skip(1);let n=Q.parseInt(e);if(n===-1||!e.more())return-1;let s;if(!e.lookingAt(","))s=n;else{if(e.skip(1),!e.more())return-1;if(e.lookingAt("}"))s=-1;else if((s=Q.parseInt(e))===-1)return-1}if(!e.more()||!e.lookingAt("}"))return-1;if(e.skip(1),n<0||n>1e3||s===-2||s>1e3||s>=0&&n>s)throw new Ce(Q.ERR_INVALID_REPEAT_SIZE,e.from(t));return n<<16|s&J.MAX_BMP}static isValidCaptureName(e){if(e.length===0)return!1;for(let t=0;t<e.length;t++){let n=e.codePointAt(t);if(n!==k.CODES._&&!H.isalnum(n))return!1}return!0}static parseInt(e){let t=e.pos();for(;e.more()&&e.peek()>=k.CODES[0]&&e.peek()<=k.CODES[9];)e.skip(1);let n=e.from(t);return n.length===0||n.length>1&&n.codePointAt(0)===k.CODES[0]?-1:n.length>8?-2:parseInt(n,10)}static isCharClass(e){return e.op===I.Op.LITERAL&&e.runes.length===1||e.op===I.Op.CHAR_CLASS||e.op===I.Op.ANY_CHAR_NOT_NL||e.op===I.Op.ANY_CHAR}static matchRune(e,t){switch(e.op){case I.Op.LITERAL:return e.runes.length===1&&e.runes[0]===t;case I.Op.CHAR_CLASS:for(let n=0;n<e.runes.length;n+=2)if(e.runes[n]<=t&&t<=e.runes[n+1])return!0;return!1;case I.Op.ANY_CHAR_NOT_NL:return t!==k.CODES[`
`];case I.Op.ANY_CHAR:return!0}return!1}static mergeCharClass(e,t){switch(e.op){case I.Op.ANY_CHAR:break;case I.Op.ANY_CHAR_NOT_NL:Q.matchRune(t,k.CODES[`
`])&&(e.op=I.Op.ANY_CHAR);break;case I.Op.CHAR_CLASS:{let n=new gr(Array.isArray(e.runes)?e.runes:Array.from(e.runes));t.op===I.Op.LITERAL?n.appendLiteral(t.runes[0],t.flags):n.appendClass(t.runes),e.runes=n.toGrowableArray();break}case I.Op.LITERAL:if(t.runes[0]===e.runes[0]&&t.flags===e.flags)break;e.op=I.Op.CHAR_CLASS,e.runes=new gr().appendLiteral(e.runes[0],e.flags).appendLiteral(t.runes[0],t.flags).toGrowableArray()}}static parseEscape(e){let t=e.pos();if(e.skip(1),!e.more())throw new Ce(Q.ERR_TRAILING_BACKSLASH);let n=e.pop();e:switch(n){case k.CODES[1]:case k.CODES[2]:case k.CODES[3]:case k.CODES[4]:case k.CODES[5]:case k.CODES[6]:case k.CODES[7]:if(!e.more()||e.peek()<k.CODES[0]||e.peek()>k.CODES[7])break;case k.CODES[0]:{let s=n-k.CODES[0];for(let i=1;i<3&&!(!e.more()||e.peek()<k.CODES[0]||e.peek()>k.CODES[7]);i++)s=s*8+e.peek()-k.CODES[0],e.skip(1);return s}case k.CODES.x:{if(!e.more())break;if(n=e.pop(),n===k.CODES["{"]){let a=0,u=0;for(;;){if(!e.more())break e;if(n=e.pop(),n===k.CODES["}"])break;let c=H.unhex(n);if(c<0||(u=u*16+c,u>J.MAX_RUNE))break e;a++}if(a===0)break e;return u}let s=H.unhex(n);if(!e.more())break;n=e.pop();let i=H.unhex(n);if(s<0||i<0)break;return s*16+i}case k.CODES.a:return k.CODES["\x07"];case k.CODES.f:return k.CODES["\f"];case k.CODES.n:return k.CODES[`
`];case k.CODES.r:return k.CODES["\r"];case k.CODES.t:return k.CODES["	"];case k.CODES.v:return k.CODES["\v"];default:if(n<=J.MAX_ASCII&&!H.isalnum(n))return n}throw new Ce(Q.ERR_INVALID_ESCAPE,e.from(t))}static parseClassChar(e,t){if(!e.more())throw new Ce(Q.ERR_MISSING_BRACKET,e.from(t));return e.lookingAt("\\")?Q.parseEscape(e):e.pop()}static hasCapture(e){if(e===null)return!1;if(e.op===I.Op.CAPTURE)return!0;if(e.subs){for(let t of e.subs)if(Q.hasCapture(t))return!0}return!1}constructor(e,t=0){this.wholeRegexp=e,this.flags=t,this.numCap=0,this.namedGroups=Object.create(null),this.stack=[],this.free=null,this.numRegexp=0,this.numRunes=0,this.repeats=0,this.height=null,this.size=null,this.nlb=0}newRegexp(e){let t=this.free;return t!==null&&t.subs!==null&&t.subs.length>0?(this.free=t.subs[0],t.reinit(),t.op=e):(t=new I(e),this.numRegexp+=1),t}reuse(e){this.height!==null&&this.height.has(e)&&this.height.delete(e),e.subs!==null&&e.subs.length>0&&(e.subs[0]=this.free),this.free=e}checkLimits(e){if(this.numRunes>Q.MAX_RUNES)throw new Ce(Q.ERR_LARGE);this.checkSize(e),this.checkHeight(e)}checkSize(e){if(this.size===null){if(this.repeats===0&&(this.repeats=1),e.op===I.Op.REPEAT){let t=e.max;t===-1&&(t=e.min),t<=0&&(t=1),t>Math.floor(Q.MAX_SIZE/this.repeats)?this.repeats=Q.MAX_SIZE:this.repeats*=t}if(this.numRegexp<Math.floor(Q.MAX_SIZE/this.repeats))return;this.size=new Map;for(let t of this.stack)this.checkSize(t)}if(this.calcSize(e,!0)>Q.MAX_SIZE)throw new Ce(Q.ERR_LARGE)}calcSize(e,t=!1){if(!t&&this.size!==null&&this.size.has(e))return this.size.get(e);let n=0;switch(e.op){case I.Op.LITERAL:n=e.runes.length;break;case I.Op.PLB:case I.Op.NLB:case I.Op.CAPTURE:case I.Op.STAR:n=2+this.calcSize(e.subs[0]);break;case I.Op.PLUS:case I.Op.QUEST:n=1+this.calcSize(e.subs[0]);break;case I.Op.CONCAT:for(let s of e.subs)n=n+this.calcSize(s);break;case I.Op.ALTERNATE:for(let s of e.subs)n=n+this.calcSize(s);e.subs.length>1&&(n=n+e.subs.length-1);break;case I.Op.REPEAT:{let s=this.calcSize(e.subs[0]);if(e.max===-1){e.min===0?n=2+s:n=1+e.min*s;break}n=e.max*s+(e.max-e.min);break}}return n=Math.max(1,n),this.size===null&&(this.size=new Map),this.size.set(e,n),n}checkHeight(e){if(!(this.numRegexp<Q.MAX_HEIGHT)){if(this.height===null){this.height=new Map;for(let t of this.stack)this.checkHeight(t)}if(this.calcHeight(e,!0)>Q.MAX_HEIGHT)throw new Ce(Q.ERR_NESTING_DEPTH)}}calcHeight(e,t=!1){if(!t&&this.height!==null&&this.height.has(e))return this.height.get(e);let n=1;for(let s of e.subs){let i=this.calcHeight(s);n<1+i&&(n=1+i)}return this.height===null&&(this.height=new Map),this.height.set(e,n),n}pop(){return this.stack.pop()}popToPseudo(){let e=this.stack.length,t=e;for(;t>0&&!I.isPseudoOp(this.stack[t-1].op);)t--;return this.stack.splice(t,e-t)}push(e){if(this.numRunes+=e.runes.length,e.op===I.Op.CHAR_CLASS&&e.runes.length===2&&e.runes[0]===e.runes[1]){if(this.maybeConcat(e.runes[0],this.flags&~L.FOLD_CASE))return null;e.op=I.Op.LITERAL,e.runes=[e.runes[0]],e.flags=this.flags&~L.FOLD_CASE}else if(e.op===I.Op.CHAR_CLASS&&e.runes.length===4&&e.runes[0]===e.runes[1]&&e.runes[2]===e.runes[3]&&J.simpleFold(e.runes[0])===e.runes[2]&&J.simpleFold(e.runes[2])===e.runes[0]||e.op===I.Op.CHAR_CLASS&&e.runes.length===2&&e.runes[0]+1===e.runes[1]&&J.simpleFold(e.runes[0])===e.runes[1]&&J.simpleFold(e.runes[1])===e.runes[0]){if(this.maybeConcat(e.runes[0],this.flags|L.FOLD_CASE))return null;e.op=I.Op.LITERAL,e.runes=[e.runes[0]],e.flags=this.flags|L.FOLD_CASE}else this.maybeConcat(-1,0);return this.stack.push(e),this.checkLimits(e),e}maybeConcat(e,t){let n=this.stack.length;if(n<2)return!1;let s=this.stack[n-1],i=this.stack[n-2];if(s.op!==I.Op.LITERAL||i.op!==I.Op.LITERAL||(s.flags&L.FOLD_CASE)!==(i.flags&L.FOLD_CASE))return!1;Array.isArray(i.runes)||(i.runes=Array.from(i.runes));for(let a=0;a<s.runes.length;a++)i.runes.push(s.runes[a]);return e>=0?(s.runes=[e],s.flags=t,!0):(this.pop(),this.reuse(s),!1)}newLiteral(e,t){let n=this.newRegexp(I.Op.LITERAL);return n.flags=t,(t&L.FOLD_CASE)!==0&&(e=Q.minFoldRune(e)),n.runes=[e],n}literal(e){this.push(this.newLiteral(e,this.flags))}op(e){let t=this.newRegexp(e);return t.flags=this.flags,this.push(t)}repeat(e,t,n,s,i,a){let u=this.flags;if((u&L.PERL_X)!==0&&(i.more()&&i.lookingAt("?")&&(i.skip(1),u^=L.NON_GREEDY),a!==-1))throw new Ce(Q.ERR_INVALID_REPEAT_OP,i.from(a));let c=this.stack.length;if(c===0)throw new Ce(Q.ERR_MISSING_REPEAT_ARGUMENT,i.from(s));let l=this.stack[c-1];if(I.isPseudoOp(l.op))throw new Ce(Q.ERR_MISSING_REPEAT_ARGUMENT,i.from(s));let h=this.newRegexp(e);if(h.min=t,h.max=n,h.flags=u,h.subs=[l],this.stack[c-1]=h,this.checkLimits(h),e===I.Op.REPEAT&&(t>=2||n>=2)&&!this.repeatIsValid(h,1e3))throw new Ce(Q.ERR_INVALID_REPEAT_SIZE,i.from(s))}repeatIsValid(e,t){if(e.op===I.Op.REPEAT){let n=e.max;if(n===0)return!0;if(n<0&&(n=e.min),n>t)return!1;n>0&&(t=Math.trunc(t/n))}for(let n of e.subs)if(!this.repeatIsValid(n,t))return!1;return!0}concat(){this.maybeConcat(-1,0);let e=this.popToPseudo();return e.length===0?this.push(this.newRegexp(I.Op.EMPTY_MATCH)):this.push(this.collapse(e,I.Op.CONCAT))}alternate(){let e=this.popToPseudo();return e.length>0&&this.cleanAlt(e[e.length-1]),e.length===0?this.push(this.newRegexp(I.Op.NO_MATCH)):this.push(this.collapse(e,I.Op.ALTERNATE))}cleanAlt(e){e.op===I.Op.CHAR_CLASS&&(e.runes=new gr(Array.from(e.runes)).cleanClass().toArray(),e.runes.length===2&&e.runes[0]===0&&e.runes[1]===J.MAX_RUNE?(e.runes=new Int32Array(0),e.op=I.Op.ANY_CHAR):e.runes.length===4&&e.runes[0]===0&&e.runes[1]===k.CODES[`
`]-1&&e.runes[2]===k.CODES[`
`]+1&&e.runes[3]===J.MAX_RUNE&&(e.runes=new Int32Array(0),e.op=I.Op.ANY_CHAR_NOT_NL))}collapse(e,t){if(e.length===1)return e[0];let n=0;for(let u of e)n+=u.op===t?u.subs.length:1;let s=new Array(n).fill(null),i=0;for(let u of e)if(u.op===t){for(let c=0;c<u.subs.length;c++)s[i++]=u.subs[c];this.reuse(u)}else s[i++]=u;let a=this.newRegexp(t);if(a.subs=s,t===I.Op.ALTERNATE&&(a.subs=this.factor(a.subs),a.subs.length===1)){let u=a;a=a.subs[0],this.reuse(u)}return a}factor(e){if(e.length<2)return e;let t=0,n=e.length,s=0,i=null,a=0,u=0,c=0;for(let h=0;h<=n;h++){let d=null,p=0,E=0;if(h<n){let y=e[t+h];if(y.op===I.Op.CONCAT&&y.subs.length>0&&(y=y.subs[0]),y.op===I.Op.LITERAL&&(d=y.runes,p=y.runes.length,E=y.flags&L.FOLD_CASE),E===u){let S=0;for(;S<a&&S<p&&i[S]===d[S];)S++;if(S>0){a=S;continue}}}if(h!==c)if(h===c+1)e[s++]=e[t+c];else{let y=this.newRegexp(I.Op.LITERAL);y.flags=u,y.runes=i.slice(0,a);for(let U=c;U<h;U++)e[t+U]=this.removeLeadingString(e[t+U],a),this.checkLimits(e[t+U]);let S=this.collapse(e.slice(t+c,t+h),I.Op.ALTERNATE),F=this.newRegexp(I.Op.CONCAT);F.subs=[y,S],e[s++]=F}c=h,i=d,a=p,u=E}n=s,t=0,c=0,s=0;let l=null;for(let h=0;h<=n;h++){let d=null;if(!(h<n&&(d=Q.leadingRegexp(e[t+h]),l!==null&&l.equals(d)&&(Q.isCharClass(l)||l.op===I.Op.REPEAT&&l.min===l.max&&Q.isCharClass(l.subs[0]))))){if(h!==c)if(h===c+1)e[s++]=e[t+c];else{let p=l;for(let S=c;S<h;S++){let F=S!==c;e[t+S]=this.removeLeadingRegexp(e[t+S],F),this.checkLimits(e[t+S])}let E=this.collapse(e.slice(t+c,t+h),I.Op.ALTERNATE),y=this.newRegexp(I.Op.CONCAT);y.subs=[p,E],e[s++]=y}c=h,l=d}}n=s,t=0,c=0,s=0;for(let h=0;h<=n;h++)if(!(h<n&&Q.isCharClass(e[t+h]))){if(h!==c)if(h===c+1)e[s++]=e[t+c];else{let d=c;for(let E=c+1;E<h;E++){let y=e[t+d],S=e[t+E];(y.op<S.op||y.op===S.op&&(y.runes!==null?y.runes.length:0)<(S.runes!==null?S.runes.length:0))&&(d=E)}let p=e[t+c];e[t+c]=e[t+d],e[t+d]=p;for(let E=c+1;E<h;E++)Q.mergeCharClass(e[t+c],e[t+E]),this.reuse(e[t+E]);this.cleanAlt(e[t+c]),e[s++]=e[t+c]}h<n&&(e[s++]=e[t+h]),c=h+1}n=s,t=0,c=0,s=0;for(let h=0;h<n;++h)h+1<n&&e[t+h].op===I.Op.EMPTY_MATCH&&e[t+h+1].op===I.Op.EMPTY_MATCH||(e[s++]=e[t+h]);return n=s,t=0,e.slice(t,n)}removeLeadingString(e,t){if(e.op===I.Op.CONCAT&&e.subs.length>0){let n=this.removeLeadingString(e.subs[0],t);if(e.subs[0]=n,n.op===I.Op.EMPTY_MATCH)switch(this.reuse(n),e.subs.length){case 0:case 1:e.op=I.Op.EMPTY_MATCH,e.subs=I.emptySubs();break;case 2:{let s=e;e=e.subs[1],this.reuse(s);break}default:e.subs=e.subs.slice(1,e.subs.length)}return e}return e.op===I.Op.LITERAL&&(e.runes=e.runes.slice(t,e.runes.length),e.runes.length===0&&(e.op=I.Op.EMPTY_MATCH)),e}removeLeadingRegexp(e,t){if(e.op===I.Op.CONCAT&&e.subs.length>0){switch(t&&this.reuse(e.subs[0]),e.subs=e.subs.slice(1,e.subs.length),e.subs.length){case 0:e.op=I.Op.EMPTY_MATCH,e.subs=I.emptySubs();break;case 1:{let n=e;e=e.subs[0],this.reuse(n);break}}return e}return t&&this.reuse(e),this.newRegexp(I.Op.EMPTY_MATCH)}parseInternal(){if((this.flags&L.LITERAL)!==0)return Q.literalRegexp(this.wholeRegexp,this.flags);let e=-1,t=-1,n=-1,s=new wT(this.wholeRegexp);for(;s.more();){let i=-1;e:switch(s.peek()){case k.CODES["("]:if((this.flags&L.LOOKBEHIND)!==0){if(s.lookingAt("(?<=")){this.parsePosLookBehind(),s.skip(4);break}if(s.lookingAt("(?<!")){this.parseNegLookBehind(),s.skip(4);break}}if((this.flags&L.PERL_X)!==0&&s.lookingAt("(?")){this.parsePerlFlags(s);break}this.op(I.Op.LEFT_PAREN).cap=++this.numCap,s.skip(1);break;case k.CODES["|"]:this.parseVerticalBar(),s.skip(1);break;case k.CODES[")"]:this.parseRightParen(),s.skip(1);break;case k.CODES["^"]:(this.flags&L.ONE_LINE)!==0?this.op(I.Op.BEGIN_TEXT):this.op(I.Op.BEGIN_LINE),s.skip(1);break;case k.CODES.$:(this.flags&L.ONE_LINE)!==0?this.op(I.Op.END_TEXT).flags|=L.WAS_DOLLAR:this.op(I.Op.END_LINE),s.skip(1);break;case k.CODES["."]:(this.flags&L.DOT_NL)!==0?this.op(I.Op.ANY_CHAR):this.op(I.Op.ANY_CHAR_NOT_NL),s.skip(1);break;case k.CODES["["]:this.parseClass(s);break;case k.CODES["*"]:case k.CODES["+"]:case k.CODES["?"]:{i=s.pos();let a=null;switch(s.pop()){case k.CODES["*"]:a=I.Op.STAR;break;case k.CODES["+"]:a=I.Op.PLUS;break;case k.CODES["?"]:a=I.Op.QUEST}this.repeat(a,t,n,i,s,e);break}case k.CODES["{"]:{let a=s.pos(),u=Q.parseRepeat(s);if(u<0){s.rewindTo(a),this.literal(s.pop());break}i=a,t=u>>16,n=(u&J.MAX_BMP)<<16>>16,this.repeat(I.Op.REPEAT,t,n,i,s,e);break}case k.CODES["\\"]:{let a=s.pos();if(s.skip(1),(this.flags&L.PERL_X)!==0&&s.more())switch(s.pop()){case k.CODES.A:this.op(I.Op.BEGIN_TEXT);break e;case k.CODES.b:this.op(I.Op.WORD_BOUNDARY);break e;case k.CODES.B:this.op(I.Op.NO_WORD_BOUNDARY);break e;case k.CODES.C:throw new Ce(Q.ERR_INVALID_ESCAPE,"\\C");case k.CODES.Q:{let l=s.rest(),h=l.indexOf("\\E");h>=0?(l=l.substring(0,h),s.skipString(l),s.skipString("\\E")):s.skipString(l);let d=0;for(;d<l.length;){let p=l.codePointAt(d);this.literal(p),d+=H.charCount(p)}break e}case k.CODES.z:this.op(I.Op.END_TEXT);break e;default:s.rewindTo(a)}else s.rewindTo(a);let u=this.newRegexp(I.Op.CHAR_CLASS);if(u.flags=this.flags,s.lookingAt("\\p")||s.lookingAt("\\P")){let l=new gr;if(this.parseUnicodeClass(s,l)){u.runes=l.toArray(),this.push(u);break e}}let c=new gr;if(this.parsePerlClassEscape(s,c)){u.runes=c.toArray(),this.push(u);break e}s.rewindTo(a),this.reuse(u),this.literal(Q.parseEscape(s));break}default:this.literal(s.pop())}e=i}if(this.concat(),this.swapVerticalBar()&&this.pop(),this.alternate(),this.stack.length!==1)throw new Ce(Q.ERR_MISSING_PAREN,this.wholeRegexp);return this.stack[0].namedGroups=this.namedGroups,this.stack[0]}parsePerlFlags(e){let t=e.pos(),n=e.rest();if(n.startsWith("(?P<")||n.startsWith("(?<")){let u=n.charAt(2)==="P"?4:3,c=n.indexOf(">");if(c<0)throw new Ce(Q.ERR_INVALID_NAMED_CAPTURE,n);let l=n.substring(u,c);if(e.skipString(l),e.skip(u+1),!Q.isValidCaptureName(l))throw new Ce(Q.ERR_INVALID_NAMED_CAPTURE,n.substring(0,c+1));let h=this.op(I.Op.LEFT_PAREN);if(h.cap=++this.numCap,this.namedGroups[l])throw new Ce(Q.ERR_DUPLICATE_NAMED_CAPTURE,l);this.namedGroups[l]=this.numCap,h.name=l;return}e.skip(2);let s=this.flags,i=1,a=!1;e:for(;e.more();){let u=e.pop();switch(u){case k.CODES.i:s|=L.FOLD_CASE,a=!0;break;case k.CODES.m:s&=~L.ONE_LINE,a=!0;break;case k.CODES.s:s|=L.DOT_NL,a=!0;break;case k.CODES.U:s|=L.NON_GREEDY,a=!0;break;case k.CODES["-"]:if(i<0)break e;i=-1,s=~s,a=!1;break;case k.CODES[":"]:case k.CODES[")"]:if(i<0){if(!a)break e;s=~s}u===k.CODES[":"]&&this.op(I.Op.LEFT_PAREN),this.flags=s;return;default:break e}}throw new Ce(Q.ERR_INVALID_PERL_OP,e.from(t))}parsePosLookBehind(){let e=this.newRegexp(I.Op.LEFT_PAREN);return e.flags=this.flags,e.lb=++this.nlb,this.push(e)}parseNegLookBehind(){let e=this.newRegexp(I.Op.LEFT_PAREN);return e.flags=this.flags,e.lb=-++this.nlb,this.push(e)}parseVerticalBar(){this.concat(),this.swapVerticalBar()||this.op(I.Op.VERTICAL_BAR)}swapVerticalBar(){let e=this.stack.length;if(e>=3&&this.stack[e-2].op===I.Op.VERTICAL_BAR&&Q.isCharClass(this.stack[e-1])&&Q.isCharClass(this.stack[e-3])){let t=this.stack[e-1],n=this.stack[e-3];if(t.op>n.op){let s=n;n=t,t=s,this.stack[e-3]=n}return Q.mergeCharClass(n,t),this.reuse(t),this.pop(),!0}if(e>=2){let t=this.stack[e-1],n=this.stack[e-2];if(n.op===I.Op.VERTICAL_BAR)return e>=3&&this.cleanAlt(this.stack[e-3]),this.stack[e-2]=t,this.stack[e-1]=n,!0}return!1}parseRightParen(){if(this.concat(),this.swapVerticalBar()&&this.pop(),this.alternate(),this.stack.length<2)throw new Ce(Q.ERR_UNEXPECTED_PAREN,this.wholeRegexp);let e=this.pop(),t=this.pop();if(t.op!==I.Op.LEFT_PAREN)throw new Ce(Q.ERR_UNEXPECTED_PAREN,this.wholeRegexp);if(this.flags=t.flags,t.lb!==0){if(Q.hasCapture(e))throw new Ce(Q.ERR_INVALID_CAPTURE_IN_LOOKBEHIND,this.wholeRegexp);t.lb>0?t.op=I.Op.PLB:t.op=I.Op.NLB,t.subs=[e],this.push(t);return}t.cap===0?this.push(e):(t.op=I.Op.CAPTURE,t.subs=[e],this.push(t))}parsePerlClassEscape(e,t){let n=e.pos();if((this.flags&L.PERL_X)===0||!e.more()||e.pop()!==k.CODES["\\"]||!e.more())return!1;e.pop();let s=e.from(n),i=Gg.has(s)?Gg.get(s):null;return i===null?!1:(t.appendGroup(i,(this.flags&L.FOLD_CASE)!==0),!0)}parseNamedClass(e,t){let n=e.rest(),s=n.indexOf(":]");if(s<0)return!1;let i=n.substring(0,s+2);e.skipString(i);let a=tm.has(i)?tm.get(i):null;if(a===null)throw new Ce(Q.ERR_INVALID_CHAR_RANGE,i);return t.appendGroup(a,(this.flags&L.FOLD_CASE)!==0),!0}parseUnicodeClass(e,t){let n=e.pos();if((this.flags&L.UNICODE_GROUPS)===0||!e.lookingAt("\\p")&&!e.lookingAt("\\P"))return!1;e.skip(1);let s=1,i=e.pop();if(i===k.CODES.P&&(s=-1),!e.more())throw e.rewindTo(n),new Ce(Q.ERR_INVALID_CHAR_RANGE,e.rest());i=e.pop();let a;if(i!==k.CODES["{"])a=H.runeToString(i);else{let h=e.rest(),d=h.indexOf("}");if(d<0)throw e.rewindTo(n),new Ce(Q.ERR_INVALID_CHAR_RANGE,e.rest());a=h.substring(0,d),e.skipString(a),e.skip(1)}a.length!==0&&a.codePointAt(0)===k.CODES["^"]&&(s=0-s,a=a.substring(1));let u=Q.unicodeTable(a);if(u===null)throw new Ce(Q.ERR_INVALID_CHAR_RANGE,e.from(n));u.sign<0&&(s=0-s);let c=u.tab,l=u.fold;if((this.flags&L.FOLD_CASE)===0||l===null)t.appendTableWithSign(c,s);else{let h=new gr().appendTable(c).appendTable(l).cleanClass().toArray();t.appendClassWithSign(Array.from(h),s)}return!0}parseClass(e){let t=e.pos();e.skip(1);let n=this.newRegexp(I.Op.CHAR_CLASS);n.flags=this.flags;let s=new gr,i=1;e.more()&&e.lookingAt("^")&&(i=-1,e.skip(1),(this.flags&L.CLASS_NL)===0&&s.appendRange(k.CODES[`
`],k.CODES[`
`]));let a=!0;for(;!e.more()||e.peek()!==k.CODES["]"]||a;){if(e.more()&&e.lookingAt("-")&&(this.flags&L.PERL_X)===0&&!a){let h=e.rest();if(h==="-"||!h.startsWith("-]"))throw e.rewindTo(t),new Ce(Q.ERR_INVALID_CHAR_RANGE,e.rest())}a=!1;let u=e.pos();if(e.lookingAt("[:")){if(this.parseNamedClass(e,s))continue;e.rewindTo(u)}if(this.parseUnicodeClass(e,s)||this.parsePerlClassEscape(e,s))continue;e.rewindTo(u);let c=Q.parseClassChar(e,t),l=c;if(e.more()&&e.lookingAt("-")){if(e.skip(1),e.more()&&e.lookingAt("]"))e.skip(-1);else if(l=Q.parseClassChar(e,t),l<c)throw new Ce(Q.ERR_INVALID_CHAR_RANGE,e.from(u))}(this.flags&L.FOLD_CASE)===0?s.appendRange(c,l):s.appendFoldedRange(c,l)}e.skip(1),s.cleanClass(),i<0&&s.negateClass(),n.runes=s.toArray(),this.push(n)}},DT=class Er{static initTest(e){let t=Er.compile(e),n=new Er(t.expr,t.prog,t.numSubexp,t.longest);return n.cond=t.cond,n.prefix=t.prefix,n.prefixUTF8=t.prefixUTF8,n.prefixComplete=t.prefixComplete,n.prefixRune=t.prefixRune,n.prefilter=t.prefilter,n.namedGroups=t.namedGroups,n}static compile(e){return Er.compileImpl(e,L.PERL,!1)}static compilePOSIX(e){return Er.compileImpl(e,L.POSIX,!0)}static compileImpl(e,t,n){let s=Hi.parse(e,t),i=s.maxCap(),a=s.namedGroups;s=pm.simplify(s);let u=ET.build(s),c=dm.compileRegexp(s),l=new Er(e,c,i,n);l.prefilter=u.type===ie.Type.NONE?null:u;let[h,d]=c.prefix();return l.prefixComplete=h,l.prefix=d,l.prefixUTF8=H.stringToUtf8ByteArray(l.prefix),l.prefix.length>0&&(l.prefixRune=l.prefix.codePointAt(0)),l.namedGroups=a,l}static match(e,t){return Er.compile(e).match(t)}constructor(e,t,n=0,s=0){this.expr=e,this.prog=t,this.numSubexp=n,this.longest=s,this.cond=t.startCond(),this.prefix=null,this.prefixUTF8=null,this.prefixComplete=!1,this.prefixRune=0,this.namedGroups=Object.create(null),this.machinePool=[],this.lazyDFA=null,this.onepass=xg.compile(this.prog),this.prefilter=null}get dfa(){return this.lazyDFA===null&&(this.lazyDFA=new cB(this.prog)),this.lazyDFA}matchPrefixComplete(e,t,n,s){if((n===L.ANCHOR_START||n===L.ANCHOR_BOTH)&&t!==0)return null;let i=-1,a=-1,u=e.prefixLength(this);if(n===L.UNANCHORED){let c=e.index(this,t);if(c<0)return null;i=t+c,a=i+u}else if(n===L.ANCHOR_BOTH){if(e.endPos()!==u||e.index(this,0)!==0)return null;i=0,a=u}else if(n===L.ANCHOR_START){if(e.index(this,0)!==0)return null;i=0,a=u}if(i<0)return null;if(s>0){let c=new Int32Array(s).fill(-1);return c[0]=i,c[1]=a,Array.from(c)}return[]}createLookbehindState(){return this.prog.numLb>0?new uT(this.prog):null}executeEngine(e,t,n,s,i=null){if(this.prefixComplete&&(s===0||this.numSubexp===0))return this.matchPrefixComplete(e,t,n,s);if(this.prefilter!==null&&n===L.UNANCHORED&&!this.prefilter.eval(e,t))return null;if(this.onepass!==null)return xg.execute(this,e,t,n,s);if(s>0)return this.prog.numLb===0&&e.endPos()<=Wo.maxBitStateLen(this.prog)?Wo.execute(this,e,t,n,s):this.doExecuteNFA(e,t,n,s,i);if(this.prog.numLb===0){let a=this.dfa.match(e,t,n);if(a!==null)return a?[]:null;if(e.endPos()<=Wo.maxBitStateLen(this.prog))return Wo.execute(this,e,t,n,s)}return this.doExecuteNFA(e,t,n,s,i)}numberOfCapturingGroups(){return this.numSubexp}numberOfInstructions(){return this.prog.numInst()}get(){return this.machinePool.length>0?this.machinePool.pop():null}reset(){this.machinePool.length=0}put(e){this.machinePool.push(e)}toString(){return this.expr}doExecuteNFA(e,t,n,s,i=null){let a=this.get();a||(a=lm.fromRE2(this)),a.init(s);let u=a.match(e,t,n,i)?a.submatches():null;return this.put(a),u}match(e){return this.executeEngine(pe.fromUTF16(e),0,L.UNANCHORED,0)!==null}matchWithGroup(e,t,n,s,i,a=null){return e instanceof wr||(H.isByteArray(e)?e=yr.utf8(e):e=yr.utf16(e)),this.matchMachineInput(e,t,n,s,i,a)}matchMachineInput(e,t,n,s,i,a=null){if(t>n)return[!1,null];let u=e.isUTF16Encoding()?pe.fromUTF16(e.asCharSequence(),0,n):pe.fromUTF8(e.asBytes(),0,n),c=this.executeEngine(u,t,s,2*i,a);return c===null?[!1,null]:[!0,c]}matchUTF8(e){return this.executeEngine(pe.fromUTF8(e),0,L.UNANCHORED,0)!==null}replaceAll(e,t){return this.replaceAllFunc(e,()=>t,2*e.length+1)}replaceFirst(e,t){return this.replaceAllFunc(e,()=>t,1)}replaceAllFunc(e,t,n){let s=0,i=0,a="",u=pe.fromUTF16(e),c=this.createLookbehindState(),l=0;for(;i<=e.length;){let h=this.executeEngine(u,i,L.UNANCHORED,2,c);if(h===null||h.length===0)break;a+=e.substring(s,h[0]),(h[1]>s||h[0]===0)&&(a+=t(e.substring(h[0],h[1])),l++),s=h[1];let d=u.step(i)&7;if(i+d>h[1]?i+=d:i+1>h[1]?i++:i=h[1],l>=n)break}return a+=e.substring(s),a}pad(e){if(e===null)return null;let t=(1+this.numSubexp)*2;if(e.length<t){let n=new Array(t).fill(-1);for(let s=0;s<e.length;s++)n[s]=e[s];e=n}return e}allMatches(e,t,n=s=>s){let s=[],i=e.endPos();t<0&&(t=i+1);let a=0,u=0,c=-1,l=this.createLookbehindState();for(;u<t&&a<=i;){let h=this.executeEngine(e,a,L.UNANCHORED,this.prog.numCap,l);if(h===null||h.length===0)break;let d=!0;if(h[1]===a){h[0]===c&&(d=!1);let p=e.step(a);p<0?a=i+1:a+=p&7}else a=h[1];c=h[1],d&&(s.push(n(this.pad(h))),u++)}return s}findUTF8(e){let t=this.executeEngine(pe.fromUTF8(e),0,L.UNANCHORED,2);return t===null?null:e.slice(t[0],t[1])}findUTF8Index(e){let t=this.executeEngine(pe.fromUTF8(e),0,L.UNANCHORED,2);return t===null?null:t.slice(0,2)}find(e){let t=this.executeEngine(pe.fromUTF16(e),0,L.UNANCHORED,2);return t===null?"":e.substring(t[0],t[1])}findIndex(e){return this.executeEngine(pe.fromUTF16(e),0,L.UNANCHORED,2)}findUTF8Submatch(e){let t=this.executeEngine(pe.fromUTF8(e),0,L.UNANCHORED,this.prog.numCap);if(t===null)return null;let n=new Array(1+this.numSubexp).fill(null);for(let s=0;s<n.length;s++)2*s<t.length&&t[2*s]>=0&&(n[s]=e.slice(t[2*s],t[2*s+1]));return n}findUTF8SubmatchIndex(e){return this.pad(this.executeEngine(pe.fromUTF8(e),0,L.UNANCHORED,this.prog.numCap))}findSubmatch(e){let t=this.executeEngine(pe.fromUTF16(e),0,L.UNANCHORED,this.prog.numCap);if(t===null)return null;let n=new Array(1+this.numSubexp).fill(null);for(let s=0;s<n.length;s++)2*s<t.length&&t[2*s]>=0&&(n[s]=e.substring(t[2*s],t[2*s+1]));return n}findSubmatchIndex(e){return this.pad(this.executeEngine(pe.fromUTF16(e),0,L.UNANCHORED,this.prog.numCap))}findAllUTF8(e,t){let n=this.allMatches(pe.fromUTF8(e),t,s=>e.slice(s[0],s[1]));return n.length===0?null:n}findAllUTF8Index(e,t){let n=this.allMatches(pe.fromUTF8(e),t,s=>s.slice(0,2));return n.length===0?null:n}findAll(e,t){let n=this.allMatches(pe.fromUTF16(e),t,s=>e.substring(s[0],s[1]));return n.length===0?null:n}findAllIndex(e,t){let n=this.allMatches(pe.fromUTF16(e),t,s=>s.slice(0,2));return n.length===0?null:n}findAllUTF8Submatch(e,t){let n=this.allMatches(pe.fromUTF8(e),t,s=>{let i=new Array(s.length/2|0).fill(null);for(let a=0;a<i.length;a++)s[2*a]>=0&&(i[a]=e.slice(s[2*a],s[2*a+1]));return i});return n.length===0?null:n}findAllUTF8SubmatchIndex(e,t){let n=this.allMatches(pe.fromUTF8(e),t);return n.length===0?null:n}findAllSubmatch(e,t){let n=this.allMatches(pe.fromUTF16(e),t,s=>{let i=new Array(s.length/2|0).fill(null);for(let a=0;a<i.length;a++)s[2*a]>=0&&(i[a]=e.substring(s[2*a],s[2*a+1]));return i});return n.length===0?null:n}findAllSubmatchIndex(e,t){let n=this.allMatches(pe.fromUTF16(e),t);return n.length===0?null:n}},Fv=class _r{static UNANCHORED=L.UNANCHORED;static ANCHOR_START=L.ANCHOR_START;static ANCHOR_BOTH=L.ANCHOR_BOTH;constructor(e=_r.UNANCHORED,t=0,n=8388608){if(![_r.UNANCHORED,_r.ANCHOR_START,_r.ANCHOR_BOTH].includes(e))throw new im("The anchor should be RE2Set.UNANCHORED, RE2Set.ANCHOR_START or RE2Set.ANCHOR_BOTH");H.checkFlags(t),this.anchor=e,this.jsFlags=t,this.maxMem=n;let s=L.PERL;(t&Qe.DISABLE_UNICODE_GROUPS)!==0&&(s&=~L.UNICODE_GROUPS),(t&Qe.LOOKBEHINDS)!==0&&(s|=L.LOOKBEHIND),this.re2Flags=s,this.regexps=[],this.prog=null,this.dfa=null,this.dummyRe2=null}add(e){if(this.prog)throw new qi("Cannot add patterns after compile");H.checkPattern(e);let t=e;(this.jsFlags&Qe.CASE_INSENSITIVE)!==0&&(t=`(?i)${t}`),(this.jsFlags&Qe.DOTALL)!==0&&(t=`(?s)${t}`),(this.jsFlags&Qe.MULTILINE)!==0&&(t=`(?m)${t}`);let n=Hi.parse(t,this.re2Flags);return this.regexps.push(pm.simplify(n)),this.regexps.length-1}compile(){if(this.prog)return;let e=dm.compileSet(this.regexps);if(e.numInst()>Hi.MAX_SIZE)throw new qi(`${Hi.ERR_LARGE}: the set compiles to ${e.numInst()} instructions, more than ${Hi.MAX_SIZE}`);this.prog=e,this.dfa=new cB(this.prog,this.maxMem),this.dummyRe2={prog:this.prog,cond:this.prog.startCond(),prefix:"",prefixRune:0,longest:!1}}match(e){this.prog||this.compile();let t=H.isByteArray(e)?pe.fromUTF8(e):pe.fromUTF16(e),n=L.UNANCHORED;this.anchor===_r.ANCHOR_START?n=L.ANCHOR_START:this.anchor===_r.ANCHOR_BOTH&&(n=L.ANCHOR_BOTH);let s=this.dfa.matchSet(t,0,n);if(s!==null)return s;let i=lm.fromRE2(this.dummyRe2);return i.init(0),i.matchSet(t,0,n)}},IT=class cs{static isHexadecimal(e){return"0"<=e&&e<="9"||"A"<=e&&e<="F"||"a"<=e&&e<="f"}static translate(e){let t="";if(Object.prototype.toString.call(e)==="[object RegExp]"&&(e.ignoreCase&&(t+="i"),e.multiline&&(t+="m"),e.dotAll&&(t+="s"),e=e.source),typeof e!="string")return e;let n="",s=!1,i=e.length;i===0&&(n="(?:)",s=!0);let a=!1,u=0;for(;u<i;){let l=e[u];if(l==="\\"){if(u+1<i)switch(l=e[u+1],l){case"\\":n+="\\\\",u+=2;continue;case"c":if(u+2<i){let p=e[u+2].charCodeAt(0);if(p>=65&&p<=90||p>=97&&p<=122){let E=p%32;n+="\\x",n+=(E>>4).toString(16).toUpperCase(),n+=(E&15).toString(16).toUpperCase(),u+=3,s=!0;continue}}n+="c",u+=2,s=!0;continue;case"u":if(u+2<i){if(e[u+2]==="{"){let p=u+3,E=!1,y=!1;for(;p<i;){let S=e[p];if(S==="}"){y=!0;break}if(!cs.isHexadecimal(S))break;E=!0,p++}if(y&&E){n+="\\x",u+=2,s=!0;continue}}else if(u+5<i){let p=!0;for(let E=0;E<4;E++)if(!cs.isHexadecimal(e[u+2+E])){p=!1;break}if(p){n+="\\x{"+e.substring(u+2,u+6)+"}",u+=6,s=!0;continue}}}n+="u",u+=2,s=!0;continue;case"x":{let p=!1;if(u+2<i&&e[u+2]==="{"){let E=u+3,y=!1,S=!1;for(;E<i;){let F=e[E];if(F==="}"){S=!0;break}if(!cs.isHexadecimal(F))break;y=!0,E++}S&&y&&(p=!0)}else u+3<i&&cs.isHexadecimal(e[u+2])&&cs.isHexadecimal(e[u+3])&&(p=!0);p?(n+="\\x",u+=2):(n+="x",u+=2,s=!0);continue}case"n":case"r":case"t":case"a":case"f":case"v":case"d":case"D":case"s":case"S":case"w":case"W":case"b":case"B":case"p":case"P":case"A":case"z":case"Q":case"E":case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":n+="\\"+l,u+=2;continue;default:{let p=e.codePointAt(u+1);if(p>=48&&p<=57||p>=65&&p<=90||p>=97&&p<=122){let E=H.charCount(p);n+=e.substring(u+1,u+1+E),u+=E+1,s=!0}else{n+="\\";let E=H.charCount(p);n+=e.substring(u+1,u+1+E),u+=E+1}continue}}}else if(l==="/"){n+="\\/",u+=1,s=!0;continue}else if(l==="["){if(!a&&e[u+1]==="]"){n+="[^\\x00-\\x{10FFFF}]",u+=2,s=!0;continue}if(!a&&e[u+1]==="^"&&e[u+2]==="]"){n+="[\\x00-\\x{10FFFF}]",u+=3,s=!0;continue}a=!0}else if(l==="]")a=!1;else if(!a&&l==="("&&u+2<i&&e[u+1]==="?"&&e[u+2]==="<"&&u+3<i&&!"=!>)".includes(e[u+3])){n+="(?P<",u+=3,s=!0;continue}let h=e.codePointAt(u),d=H.charCount(h);n+=e.substring(u,u+d),u+=d}let c=s?n:e;return t.length>0?`(?${t})${c}`:c}},nm=(r,e)=>{let t=r.matchArray();return t.index=r.start(0),t.input=e,t.groups=r.namedGroupsObject(),t},Xo=class Kt{static CASE_INSENSITIVE=Qe.CASE_INSENSITIVE;static DOTALL=Qe.DOTALL;static MULTILINE=Qe.MULTILINE;static DISABLE_UNICODE_GROUPS=Qe.DISABLE_UNICODE_GROUPS;static LONGEST_MATCH=Qe.LONGEST_MATCH;static LOOKBEHINDS=Qe.LOOKBEHINDS;static quote(e){return H.quoteMeta(e)}static quoteReplacement(e,t=!1){return Rg.quoteReplacement(e,t)}static translateRegExp(e){return IT.translate(e)}static compile(e,t=0){H.checkPattern(e),H.checkFlags(t);let n=e;(t&Kt.CASE_INSENSITIVE)!==0&&(n=`(?i)${n}`),(t&Kt.DOTALL)!==0&&(n=`(?s)${n}`),(t&Kt.MULTILINE)!==0&&(n=`(?m)${n}`);let s=L.PERL;(t&Kt.DISABLE_UNICODE_GROUPS)!==0&&(s&=~L.UNICODE_GROUPS),(t&Kt.LOOKBEHINDS)!==0&&(s|=L.LOOKBEHIND);let i=new Kt(e,t);return i.re2Input=DT.compileImpl(n,s,(t&Kt.LONGEST_MATCH)!==0),i}static matches(e,t){return Kt.compile(e).testExact(t)}static initTest(e,t,n){if(e==null)throw new Error("pattern is null");if(n==null)throw new Error("re2 is null");let s=new Kt(e,t);return s.re2Input=n,s}constructor(e,t){this.patternInput=e,this.flagsInput=t,this.re2Input=null}reset(){this.re2Input.reset()}flags(){return this.flagsInput}pattern(){return this.patternInput}re2(){return this.re2Input}matches(e){return this.testExact(e)}matcher(e){return H.isByteArray(e)&&(e=yr.utf8(e)),new Rg(this,e)}test(e){return H.isByteArray(e)?this.re2Input.matchUTF8(e):this.re2Input.match(e)}testExact(e){let t=H.isByteArray(e)?pe.fromUTF8(e):pe.fromUTF16(e);return this.re2Input.executeEngine(t,0,L.ANCHOR_BOTH,0)!==null}exec(e){let t=this.matcher(e);return t.find()?nm(t,e):null}split(e,t=0){let n=this.matcher(e),s=[],i=0,a=0;for(;n.find();){if(a===0&&n.end()===0){a=n.end();continue}if(t>0&&s.length===t-1)break;if(a===n.start()){if(t===0){i+=1,a=n.end();continue}}else for(;i>0;)s.push(""),i-=1;s.push(n.substring(a,n.start())),a=n.end()}if(t===0&&a!==n.inputLength()){for(;i>0;)s.push(""),i-=1;s.push(n.substring(a,n.inputLength()))}return(t!==0||s.length===0&&!(a===n.inputLength()&&a>0))&&s.push(n.substring(a,n.inputLength())),s}*matchAll(e){let t=this.matcher(e);for(;t.find();)yield nm(t,e)}toString(){return this.patternInput}programSize(){return this.re2Input.numberOfInstructions()}groupCount(){return this.re2Input.numberOfCapturingGroups()}namedGroups(){return this.re2Input.namedGroups}equals(e){return this===e?!0:e===null||this.constructor!==e.constructor?!1:this.flagsInput===e.flagsInput&&this.patternInput===e.patternInput}};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Qs="13.3.0";function tE(r){Qs=r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var vr=new Pn("@firebase/firestore");function ls(){return vr.logLevel}function K(r,...e){if(vr.logLevel<=oe.DEBUG){let t=e.map(hd);vr.debug(`Firestore (${Qs}): ${r}`,...t)}}function mn(r,...e){if(vr.logLevel<=oe.ERROR){let t=e.map(hd);vr.error(`Firestore (${Qs}): ${r}`,...t)}}function bt(r,...e){if(vr.logLevel<=oe.WARN){let t=e.map(hd);vr.warn(`Firestore (${Qs}): ${r}`,...t)}}function hd(r){if(typeof r=="string")return r;try{return(function(t){return JSON.stringify(t)})(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Y(r,e,t){let n="Unexpected state";typeof e=="string"?n=e:t=e,nE(r,n,t)}function nE(r,e,t){let n=`FIRESTORE (${Qs}) INTERNAL ASSERTION FAILED: ${e} (ID: ${r.toString(16)})`;if(t!==void 0)try{n+=" CONTEXT: "+JSON.stringify(t)}catch{n+=" CONTEXT: "+t}throw mn(n),new Error(n)}function $(r,e,t,n){let s="Unexpected state";typeof t=="string"?s=t:n=t,r||nE(e,s,n)}function ne(r,e){return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function TT(r){let e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(r);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let n=0;n<r;n++)t[n]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var _s=class{static newId(){let e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516),n="";for(;n.length<20;){let s=TT(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<t&&(n+=e.charAt(s[i]%62))}return n}};function ae(r,e){return r<e?-1:r>e?1:0}function ta(r,e){let t=Math.min(r.length,e.length);for(let n=0;n<t;n++){let s=r.charAt(n),i=e.charAt(n);if(s!==i)return BB(s)===BB(i)?ae(s,i):BB(s)?1:-1}return ae(r.length,e.length)}var AT=55296,bT=57343;function BB(r){let e=r.charCodeAt(0);return e>=AT&&e<=bT}function ys(r,e,t){return r.length===e.length&&r.every(((n,s)=>t(n,e[s])))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Te=class r{constructor(e,t){this.comparator=e,this.root=t||$t.EMPTY}insert(e,t){return new r(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,$t.BLACK,null,null))}remove(e){return new r(this.comparator,this.root.remove(e,this.comparator).copy(null,null,$t.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){let n=this.comparator(e,t.key);if(n===0)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){let s=this.comparator(e,n.key);if(s===0)return t+n.left.size;s<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal(((t,n)=>(e(t,n),!1)))}toString(){let e=[];return this.inorderTraversal(((t,n)=>(e.push(`${t}:${n}`),!1))),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new ps(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new ps(this.root,e,this.comparator,!1)}getReverseIterator(){return new ps(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new ps(this.root,e,this.comparator,!0)}},ps=class{constructor(e,t,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?n(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop(),t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;let e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}},$t=class r{constructor(e,t,n,s,i){this.key=e,this.value=t,this.color=n??r.RED,this.left=s??r.EMPTY,this.right=i??r.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,s,i){return new r(e??this.key,t??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let s=this,i=n(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,n),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return r.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return r.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){let e=this.copy(null,null,r.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){let e=this.copy(null,null,r.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){let e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){let e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw Y(43730,{key:this.key,value:this.value});if(this.right.isRed())throw Y(14113,{key:this.key,value:this.value});let e=this.left.check();if(e!==this.right.check())throw Y(27949);return e+(this.isRed()?0:1)}};$t.EMPTY=null,$t.RED=!0,$t.BLACK=!1;$t.EMPTY=new class{constructor(){this.size=0}get key(){throw Y(57766)}get value(){throw Y(16141)}get color(){throw Y(16727)}get left(){throw Y(29726)}get right(){throw Y(36894)}copy(e,t,n,s,i){return this}insert(e,t,n){return new $t(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ke=class r{constructor(e){this.comparator=e,this.data=new Te(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal(((t,n)=>(e(t),!1)))}forEachInRange(e,t){let n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){let s=n.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let n;for(n=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){let t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new cu(this.data.getIterator())}getIteratorFrom(e){return new cu(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach((n=>{t=t.add(n)})),t}isEqual(e){if(!(e instanceof r)||this.size!==e.size)return!1;let t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){let s=t.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){let e=[];return this.forEach((t=>{e.push(t)})),e}toString(){let e=[];return this.forEach((t=>e.push(t))),"SortedSet("+e.toString()+")"}copy(e){let t=new r(this.comparator);return t.data=e,t}},cu=class{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var V={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"},q=class extends pt{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Jt="__name__",lu=class r{constructor(e,t,n){t===void 0?t=0:t>e.length&&Y(637,{offset:t,range:e.length}),n===void 0?n=e.length-t:n>e.length-t&&Y(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return r.comparator(this,e)===0}child(e){let t=this.segments.slice(this.offset,this.limit());return e instanceof r?e.forEach((n=>{t.push(n)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){let n=Math.min(e.length,t.length);for(let s=0;s<n;s++){let i=r.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return ae(e.length,t.length)}static compareSegments(e,t){let n=r.isNumericId(e),s=r.isNumericId(t);return n&&!s?-1:!n&&s?1:n&&s?r.extractNumericId(e).compare(r.extractNumericId(t)):ta(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Bn.fromString(e.substring(4,e.length-2))}},he=class r extends lu{construct(e,t,n){return new r(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toStringWithLeadingSlash(){return`/${this.canonicalString()}`}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){let t=[];for(let n of e){if(n.indexOf("//")>=0)throw new q(V.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter((s=>s.length>0)))}return new r(t)}static emptyPath(){return new r([])}},vT=/^[_a-zA-Z][_a-zA-Z0-9]*$/,Bt=class Bs extends lu{construct(e,t,n){return new Bs(e,t,n)}static isValidIdentifier(e){return vT.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),Bs.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Jt}static keyField(){return new Bs([Jt])}static fromServerFormat(e){let t=[],n="",s=0,i=()=>{if(n.length===0)throw new q(V.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""},a=!1;for(;s<e.length;){let u=e[s];if(u==="\\"){if(s+1===e.length)throw new q(V.INVALID_ARGUMENT,"Path has trailing escape character: "+e);let c=e[s+1];if(c!=="\\"&&c!=="."&&c!=="`")throw new q(V.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=c,s+=2}else u==="`"?(a=!a,s++):u!=="."||a?(n+=u,s++):(i(),s++)}if(i(),a)throw new q(V.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new Bs(t)}static emptyPath(){return new Bs([])}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var At=class r{constructor(e){this.fields=e,e.sort(Bt.comparator)}static empty(){return new r([])}unionWith(e){let t=new ke(Bt.comparator);for(let n of this.fields)t=t.add(n);for(let n of e)t=t.add(n);return new r(t.toArray())}covers(e){for(let t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return ys(this.fields,e.fields,((t,n)=>t.isEqual(n)))}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rr(r){let e=0;for(let t in r)Object.prototype.hasOwnProperty.call(r,t)&&e++;return e}function er(r,e){for(let t in r)Object.prototype.hasOwnProperty.call(r,t)&&e(t,r[t])}function rE(r,e){let t=[];for(let n in r)Object.prototype.hasOwnProperty.call(r,n)&&t.push(e(r[n],n,r));return t}function sE(r){for(let e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var X=class r{constructor(e){this.path=e}static fromPath(e){return new r(he.fromString(e))}static fromName(e){return new r(he.fromString(e).popFirst(5))}static empty(){return new r(he.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&he.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return he.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new r(new he(e.slice()))}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function iE(r,e,t){if(!t)throw new q(V.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${e}.`)}function aE(r,e,t,n){if(e===!0&&n===!0)throw new q(V.INVALID_ARGUMENT,`${r} and ${t} cannot be used together.`)}function Cm(r){if(!X.isDocumentKey(r))throw new q(V.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function gm(r){if(X.isDocumentKey(r))throw new q(V.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function va(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function Ra(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{let e=(function(n){return n.constructor?n.constructor.name:null})(r);return e?`a custom ${e} object`:"an object"}}return typeof r=="function"?"a function":Y(12329,{type:typeof r})}function yt(r,e){if("_delegate"in r&&(r=r._delegate),!(r instanceof e)){if(e.name===r.constructor.name)throw new q(V.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{let t=Ra(r);throw new q(V.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return r}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Re(r,e){let t={typeString:r};return e&&(t.value=e),t}function Sa(r,e){if(!va(r))throw new q(V.INVALID_ARGUMENT,"JSON must be an object");let t;for(let n in e)if(e[n]){let s=e[n].typeString,i="value"in e[n]?{value:e[n].value}:void 0,a=e[n].optional;if(!(n in r)){if(a)continue;t=`JSON missing required field: '${n}'`;break}let u=r[n];if(s&&typeof u!==s){t=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&u!==i.value){t=`Expected '${n}' field to equal '${i.value}'`;break}}if(t)throw new q(V.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var mm=-62135596800,Em=1e6,Ie=class r{static now(){return r.fromMillis(Date.now())}static fromDate(e){return r.fromMillis(e.getTime())}static fromMillis(e){let t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*Em);return new r(t,n)}static fromInstant(e){if(!e||typeof e.t!="bigint")throw new q(V.INVALID_ARGUMENT,"Invalid Temporal.Instant object provided.");return r._fromEpochNanoseconds(e.t)}static _fromEpochNanoseconds(e){let t,n;if(e>=0n)t=Number(e/1000000000n),n=Number(e%1000000000n);else{let s=e%1000000000n;s===0n?(t=Number(e/1000000000n),n=0):(t=Number(e/1000000000n-1n),n=Number(s+1000000000n))}return new r(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new q(V.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new q(V.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<mm)throw new q(V.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new q(V.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Em}toInstant(){if(typeof Temporal>"u"||!Temporal.Instant)throw new q(V.FAILED_PRECONDITION,"The Temporal object is not available in the current environment.");let e=1000000000n*BigInt(this.seconds)+BigInt(this.nanoseconds);return Temporal.Instant.__PRIVATE_fromEpochNanoseconds(e)}_compareTo(e){return this.seconds===e.seconds?ae(this.nanoseconds,e.nanoseconds):ae(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:r._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Sa(e,r._jsonSchema))return new r(e.seconds,e.nanoseconds)}valueOf(){let e=this.seconds-mm;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}};Ie._jsonSchemaVersion="firestore/timestamp/1.0",Ie._jsonSchema={type:Re("string",Ie._jsonSchemaVersion),seconds:Re("number"),nanoseconds:Re("number")};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Bu=class extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var De=class r{constructor(e){this.binaryString=e}static fromBase64String(e){let t=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new Bu("Invalid base64 string: "+i):i}})(e);return new r(t)}static fromUint8Array(e){let t=(function(s){let i="";for(let a=0;a<s.length;++a)i+=String.fromCharCode(s[a]);return i})(e);return new r(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){let n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return ae(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}};De.EMPTY_BYTE_STRING=new De("");var RT=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function En(r){if($(!!r,39018),typeof r=="string"){let e=0,t=RT.exec(r);if($(!!t,46558,{timestamp:r}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}let n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:e}}return{seconds:ge(r.seconds),nanos:ge(r.nanos)}}function ge(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function xt(r){return typeof r=="string"?De.fromBase64String(r):De.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var oE="server_timestamp",uE="__type__",cE="__previous_value__",lE="__local_write_time__";function sc(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[uE])==null?void 0:n.stringValue)===oE}function Pa(r){let e=r.mapValue.fields[cE];return sc(e)?Pa(e):e}function ws(r){let e=En(r.mapValue.fields[lE].timestampValue);return new Ie(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var EB=class{constructor(e,t,n,s,i,a,u,c,l,h,d,p,E){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=a,this.autoDetectLongPolling=u,this.longPollingOptions=c,this.useFetchStreams=l,this.isUsingEmulator=h,this.apiKey=d,this._customHeaders=p,this.grpcFlowControlWindow=E}},hu="(default)",na=class r{constructor(e,t){this.projectId=e,this.database=t||hu}static empty(){return new r("","")}get isDefaultDatabase(){return this.database===hu}isEqual(e){return e instanceof r&&e.projectId===this.projectId&&e.database===this.database}};function BE(r,e){if(!Object.prototype.hasOwnProperty.apply(r.options,["projectId"]))throw new q(V.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new na(r.options.projectId,e)}/**
 * Copyright 2021 M.Vokhmentsev
 *
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var be=class r{constructor(){this.exponent=0,this.i=0n,this.o=0n,this.u=new Array(4).fill(0n),this.l=new Array(6).fill(0n),this.h=new Array(6).fill(0n),this.T=new Array(6).fill(0n),this.P=new Array(12).fill(0n)}static I(e,t){let n=new r;return n.parse(e,t),n}parse(e,t){t+=e.length-1,this.exponent=0,this.i=0n,this.o=0n;let n=this.T,s=this.R(e,n);if(s==0&&this.isEmpty(n)||(t+=s)<r.A)return;if(t>r.V)return void(this.exponent=Number(r.m));let i=this.p(t,n);this.S(t,i,n)}R(e,t){for(let i=0;i<6;i++)t[i]=0n;let n=0;for(;n<e.length&&e[n]==0;)n+=1;if(n==e.length)return 0;let s=-n;if(e.length-n>r.v){let i=e[r.v]>=5,a=new Array(r.v).fill(0);for(let u=0;u<r.v;u++)a[u]=e[u+n];i&&(s+=this.D(a)),e=a,n=0}for(let i=e.length-1;i>=n;i--)t[0]|=BigInt(e[i])<<32n,this.C(t);return s}C(e){let t=e.length;for(let n=0;n<t;n++){let s=e[n]%10n;e[n]=e[n]/10n,n+1<t&&(e[n+1]+=s<<32n)}}isEmpty(e){for(let t=0;t<e.length;t++)if(e[t]!=0n)return!1;return!0}D(e){for(let t=e.length-1;t>=0;t--){if(e[t]!=9)return e[t]=e[t]+1,0;e[t]=0}return e[0]=1,1}p(e,t){let n=t[0]<<31n|t[1]>>1n,s=Number(n)/r.F;return Math.floor(Number(e)*r.O+this.log2(s))}log2(e){return r.M*Math.log(e)}S(e,t,n){let s=this.u;this.N(-t,s);let i=this.P;this.B(n,s,i),this.L(i),BigInt(s[0])!=BigInt(-e)&&this.L(i),t+=this.$(i),(t+=r.U)<=0||(t+=this.k(i),BigInt(t)>=r.m?this.exponent=Number(r.m):(this.exponent=Number(t),this.i=(i[0]<<32n)+i[1]&0xffffffffffffffffn,this.o=(i[2]<<32n)+i[3]&0xffffffffffffffffn))}N(e,t){if(e==0)return void this.q(r.K[0],t);let n=r.K;e<0&&(e=-e,n=r.W);let s=r.G,i=32,a=!0;for(;e>0;)e>=s&&(a?(this.q(n[i],t),a=!1):this.j(t,n[i],t),e-=s),i-=1,s*=.5}q(e,t){for(let n=0;n<t.length;n++)t[n]=e[n]}j(e,t,n){this.H(e,t,this.P);let s=this.J(this.P);this.Y(this.P,n),n[0]=e[0]+t[0]+BigInt(s)}H(e,t,n){for(let s=0;s<n.length;s++)n[s]=0n;this.Z(e,this.l),this.Z(t,this.h);for(let s=5;s>=0;s--)for(let i=5;i>=0;i--){let a=this.l[s]*this.h[i];n[i+s+1]=n[i+s+1]+(a&r.X)&0xffffffffffffffffn,n[i+s]=n[i+s]+(a>>32n)&0xffffffffffffffffn}for(let s=11;s>=1;s--)n[s-1]=n[s-1]+(n[s]>>32n)&0xffffffffffffffffn,n[s]&=r.X}J(e){let t=0;for(;this.ee(e);)this.L(e),t-=1;return t}ee(e){if(e[0]<0x19999999n)return!0;if(e[0]>0x19999999n)return!1;for(let t=1;t<e.length;t++){if(e[t]<0x99999999n)return!0;if(e[t]>0x99999999n)return!1}return!1}B(e,t,n){for(let a=0;a<n.length;a++)n[a]=0n;let s=this.h;this.Z(t,s);let i=e.length;for(let a=i-1;a>=0;a--)for(let u=i-1;u>=0;u--){let c=e[a]*s[u];n[u+a+1]=n[u+a+1]+(c&r.X)&0xffffffffffffffffn,n[u+a]=n[u+a]+(c>>32n)&0xffffffffffffffffn}for(let a=11;a>=1;a--)n[a-1]=n[a-1]+(n[a]>>32n)&0xffffffffffffffffn,n[a]&=r.X}L(e){let t=e.length-1;e[0]&=r.X,e[t]*=10n;for(let n=t-1;n>=0;n--)e[n]=10n*e[n]+(e[n+1]>>32n)&0xffffffffffffffffn,e[n+1]&=r.X}$(e){let t=31-r.te(e[0]);return t!=0&&this.ne(e,t),t}k(e){return this.re(e,5,100n),this.re(e,4,0x80000000n),(e[0]&r.ie<<1n)!=0n?(this.ne(e,1),1):0}Y(e,t){t[1]=(e[0]<<32n)+e[1],t[2]=(e[2]<<32n)+e[3],t[3]=(e[4]<<32n)+e[5]}Z(e,t){t[0]=e[1]>>32n,t[1]=e[1]&r.X,t[2]=e[2]>>32n,t[3]=e[2]&r.X,t[4]=e[3]>>32n,t[5]=e[3]&r.X}ne(e,t){let n=e.length-1,s=BigInt(32-Math.abs(t));if(t>0){let i=BigInt(t);for(let a=n+1-1;a>=1;a--)e[a]=e[a]>>i|e[a-1]<<s&r.X;e[0]=e[0]>>i}else if(t<0){let i=BigInt(-t);e[0]=0xffffffffffffffffn&(e[0]<<i|e[1]>>s);for(let a=1;a<n;a++)e[a]=0xffffffffffffffffn&(e[a]<<i&r.X|e[a+1]>>s);e[n]=e[n]<<i&r.X}}re(e,t,n){let s=t;e[s]=e[s]+n&0xffffffffffffffffn;for(let i=s+1-1;i>=1&&(e[i]&r.ie)!=0n;i--)e[i]&=r.X,e[i-1]+=1n}static te(e){let t=Number(e>>32n);return t==0?32+Math.clz32(Number(BigInt.asUintN(32,e))):Math.clz32(t)}};/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var je,Cs,_B,su,iu,Wi;be.v=59,be.V=646456993,be.A=-646457032,be.F=0xccccccccccccd00,be.se=0x8000000000000000n,be.G=2147483648,be.X=0x00000000ffffffffn,be.ie=0xffffffff00000000n,be.O=Math.log(10)/Math.log(2),be.M=1/Math.log(2),be.U=2147483647,be.m=0xffffffffn,be.K=[[1n,0x1999999999999999n,0x9999999999999999n,0x999999999999999an],[1n,0x3333333333333333n,0x3333333333333333n,0x3333333333333334n],[1n,0x6666666666666666n,0x6666666666666666n,0x6666666666666667n],[2n,0x28f5c28f5c28f5c2n,0x8f5c28f5c28f5c28n,0xf5c28f5c28f5c290n],[3n,0x4189374bc6a7ef9dn,0xb22d0e5604189374n,0xbc6a7ef9db22d0e6n],[5n,0xa7c5ac471b478423n,0x0fcf80dc33721d53n,0xcddd6e04c0592104n],[10n,0x6df37f675ef6eadfn,0x5ab9a2072d44268dn,0x97df837e6748956en],[20n,0x2f394219248446ban,0xa23d2ec729af3d61n,0x0607aa0167dd94cbn],[39n,0x571cbec554b60dbbn,0xd5f64baf0506840dn,0x451db70d5904029bn],[78n,0x1da48ce468e7c702n,0x6520247d3556476dn,0x1469caf6db224cfan],[155n,0x2252f0e5b39769dcn,0x9ae2eea30ca3ade0n,0xeeaa3c08dfe84e30n],[309n,0x2e055c9a3f6ba793n,0x16583a816eb60a59n,0x22c4b0826cf1ebf7n],[617n,0x52bb45e9cf23f17fn,0x7688c07606e50364n,0xb34479aa9d449a57n],[1234n,0x1abc81c8ff5f846cn,0x8f5e3c9853e38c97n,0x45060097f3bf9296n],[2467n,0x1bec53b510daa7b4n,0x48369ed77dbb0eb1n,0x3b05587b2187b41en],[4933n,0x1e75063a5ba91326n,0x8abfb8e460016ae3n,0x28008702d29e8a3cn],[9865n,0x243c5d8bb5c5fa55n,0x40c6d248c5881915n,0x4c0fd99fd5befc22n],[19729n,0x334a5570c3f4ef3cn,0xa13c36c43f979c90n,0xda7ac473555fb7a8n],[39457n,0x66c304445dd98f3bn,0xa8c293a20e47a41bn,0x4c5b03dc12604964n],[78914n,0x293ffbf5fb028cc4n,0x89d3e5ff44238406n,0x369a339e1bfe8c9bn],[157827n,0x427792fbb68e5d20n,0x7b297cd9fc154b62n,0xf09142114aa9a20cn],[315653n,0xac92bc65ad5c08fcn,0x00beeb115a566c19n,0x4ba882d8a4622437n],[631306n,0x745581440f92e80en,0x4da822cf7f896f41n,0x509d598678164ecdn],[1262612n,0x34dd99b4c69523a5n,0x64bc2e8f0d8b1044n,0xb03b1c96da5dd349n],[2525223n,0x6d2bbea9d6d25a08n,0xa0a4606a88e96b70n,0x182063bbc2fe8520n],[5050446n,0x2e8e47d63bfdd6e3n,0x2b55fa8976eaa3e9n,0x1a6b9d3086412a73n],[10100891n,0x54aa68efa1d719dfn,0xd8505806612c5c8fn,0xad068837fee8b43an],[20201782n,0x1c00464ccb7bae77n,0x9e3877784c77982cn,0xd94af3b61717404fn],[40403563n,0x1ea099c8be2b6cd0n,0x8bfb6d539fa50466n,0x6d3bc37e69a84218n],[80807125n,0x24a457f466ce8d18n,0xf2c8f3b81bc6bb59n,0xa78c757692e02d49n],[161614249n,0x347256677aba6b53n,0x3fbf90d30611a67cn,0x1e039d87e0bdb32bn],[323228497n,0x6b727daf0fd3432an,0x71f71121f9e4200fn,0x8fcd9942d486c10cn],[646456994n,0x2d18e84484d91f78n,0x4079bfe7829dec6fn,0x21551643e365abc6n]],be.W=[[1n,0x1999999999999999n,0x9999999999999999n,0x999999999999999an],[0n,0x8000000000000000n,0x0000000000000000n,0x0000000000000000n],[0n,0x4000000000000000n,0x0000000000000000n,0x0000000000000001n],[-1n,0xa000000000000000n,0x0000000000000000n,0x0000000000000000n],[-2n,0x6400000000000000n,0x0000000000000000n,0x0000000000000000n],[-4n,0x2710000000000000n,0x0000000000000000n,0x0000000000000001n],[-9n,0x3b9aca0000000000n,0x0000000000000000n,0x0000000000000001n],[-19n,0x8ac7230489e80000n,0x0000000000000000n,0x0000000000000000n],[-38n,0x4b3b4ca85a86c47an,0x098a224000000000n,0x0000000000000001n],[-77n,0xdd15fe86affad912n,0x49ef0eb713f39eben,0xaa987b6e6fd2a002n],[-154n,0xbeeefb584aff8603n,0xaafb550ffacfd8fan,0x5ca47e4f88d45371n],[-308n,0x8e679c2f5e44ff8fn,0x570f09eaa7ea7648n,0x5961db50c6d2b888n],[-616n,0x4f371b3399fc2ab0n,0x8170041c9feb05aan,0xc7c343447c75bcf6n],[-1233n,0xf51e928179013fd3n,0xde4bd12cde4d985cn,0x4a573ca6f94bff14n],[-2466n,0xeab388127bccaff7n,0x1667639142b9fbaen,0x775ec9995e1039fbn],[-4932n,0xd72cb2a95c7ef6ccn,0xe81bf1e825ba7515n,0xc2feb521d6cb5dcdn],[-9864n,0xb4dc1be6604502dcn,0xd491079b8eef6535n,0x578d3965d24de84dn],[-19728n,0x7fc6447bee60ea43n,0x2548da5c8b125b27n,0x5f42d1142f41d349n],[-39456n,0x3fc65180f88af8fbn,0x6a6915f383349413n,0x063c3708b6ceb291n],[-78913n,0x9ee0197c8dcd55bfn,0x2b2b9b942c38f4a2n,0x0f8ba634e9c706aen],[-157826n,0x629963a25b8b2d79n,0xd00b9d2286f70876n,0xe97004700c3644fcn],[-315652n,0x25f9cc308ceef4f3n,0x40f19543911a4546n,0xa2cd389452cfc366n],[-631305n,0x385597b0d47e76b8n,0x1b9f67e103bf2329n,0xc3119848595985f7n],[-1262611n,0x7bf795d276c12f66n,0x66a61d62a446659an,0xa1a4d73bebf093d5n],[-2525222n,0x3c07d96ab1ed7799n,0xcb7355c22cc05ac0n,0x4ffc0ab73b1f6a49n],[-5050445n,0x8cc4cd8c3edefb9an,0x6c8ff86a90a97e0cn,0x166cfddbf98b71bfn],[-10100890n,0x4d67d81cc88e1228n,0x1d7cfb06666b79b3n,0x7b916728aaa4e70dn],[-20201781n,0xea0c55494e7a552dn,0xb88cb9484bb86c61n,0x8d44893c610bb7dfn],[-40403562n,0xd5fa8c821ec0c24an,0xa80e46e764e0f8b0n,0xa7276bfa432fac7en],[-80807124n,0xb2dae307426f6791n,0xc970b82f58b12918n,0x0472592f7f39190en],[-161614248n,0x7cf51edd8a15f1c9n,0x656dab3498f8e697n,0x12daa2a80e53c807n],[-323228496n,0x3cfe609ab5883c50n,0xbec8b5d22b198871n,0xe18477703b4622b4n],[-646456993n,0x9152447b9d7cda9an,0x3b4d3f6110d77aadn,0xfa81bad1c394adb4n]];var fe=class r{constructor(e,t,n,s){this.negative=e,this._e=t,this.i=n,this.o=s}exponent(){return this._e-be.U}oe(){return this._e===0&&this.i===0n&&this.o===0n}ae(){return this._e===Ge(r,je,"f",Cs)&&this.i===0n&&this.o===0n}isNaN(){return this._e===Ge(r,je,"f",Cs)&&!(this.i===0n&&this.o===0n)}compareTo(e){if(this.isNaN())return e.isNaN()?0:1;if(e.isNaN())return-1;let t,n;if(this.negative){if(!e.negative)return-1;t=1,n=-1}else{if(e.negative)return 1;t=-1,n=1}return this._e<e._e?t:this._e>e._e?n:this.i<e.i?t:this.i>e.i?n:this.o<e.o?t:this.o>e.o?n:0}debug(){return(this.negative?"+":"-")+Ge(r,je,"m",_B).call(r,this.i)+Ge(r,je,"m",_B).call(r,this.o)+"*2^"+this.exponent()}static fromNumber(e){if(isNaN(e))return r.NaN;if(!isFinite(e))return e<0?r.ue:r.ce;if(e===0)return Math.sign(1/e)>0?r.le:r.Ee;let t=new DataView(new ArrayBuffer(8));t.setFloat64(0,e);let n=t.getBigUint64(0),s=BigInt.asUintN(64,n<<12n),i=2047&Number(n>>52n);if(i===0){let a=be.te(s);s=a<63?s<<BigInt(a+1):0n,i=-a}return new r(e<0,Ge(r,je,"m",Wi).call(r,i-1023),s,0n)}static fromString(e){if(e==="NaN")return r.NaN;if(e==="-Infinity")return r.ue;if(e==="Infinity"||e==="+Infinity")return r.ce;let t=new Array(e.length).fill(0),n=0,s=0,i=0,a=!1;for(e[n]==="-"?(a=!0,n++):e[n]==="+"&&n++;Ge(r,je,"m",su).call(r,e,n);)t[s++]=Ge(r,je,"m",iu).call(r,e,n++);if(e[n]==="."){let c=++n;for(;Ge(r,je,"m",su).call(r,e,n);)t[s++]=Ge(r,je,"m",iu).call(r,e,n++);i=c-n}if(e[n]==="e"||e[n]==="E"){let c=0;n++;let l=1;e[n]==="-"?(l=-1,n++):e[n]==="+"&&n++;let h=n;for(;Ge(r,je,"m",su).call(r,e,n);)if(c=10*c+Ge(r,je,"m",iu).call(r,e,n++),n-h>9)throw new Error("Exponent too large "+e);if(n===h)throw new Error("Invalid number "+e);i+=c*l}if(s===0||n!==e.length)throw new Error("Invalid number "+e);let u=be.I(t.slice(0,s),i);return new r(a,u.exponent,u.i,u.o)}};je=fe,_B=function(e){return e.toString(16).padStart(16,"0")},su=function(e,t){let n=e.codePointAt(t);return n!==void 0&&n>=48&&n<=57},iu=function(e,t){return e.codePointAt(t)-48},Wi=function(e){return e+be.U},Cs={value:Number(be.m)},fe.le=new fe(!1,0,0n,0n),fe.Ee=new fe(!0,0,0n,0n),fe.NaN=new fe(!1,Ge(fe,je,"f",Cs),1n<<63n,0n),fe.ue=new fe(!0,Ge(fe,je,"f",Cs),0n,0n),fe.ce=new fe(!1,Ge(fe,je,"f",Cs),0n,0n),new fe(!0,Ge(fe,je,"m",Wi).call(fe,63),0n,0n),new fe(!1,Ge(fe,je,"m",Wi).call(fe,0),0n,0n),new fe(!0,Ge(fe,je,"m",Wi).call(fe,0),0n,0n);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var fd=-1;function ic(r){return r==null}function Ds(r){return r===0&&1/r==-1/0}function ST(r){return typeof r=="number"&&Number.isInteger(r)&&!Ds(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}function yB(r){return typeof r=="string"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ac="__type__",oc="__vector__",Sr="value",PT="server_timestamp",dd="__min__",Na="__max__",zt="__regex__",Is="pattern",Ts="options",Pr="__oid__",tr="__int__",_n="__decimal128__",fn="__request_timestamp__",ra="seconds",sa="increment",As="__binary__",bs={nullValue:"NULL_VALUE"},Zo={mapValue:{fields:{__type__:{stringValue:Na}}}},yR={mapValue:{fields:{[ac]:{stringValue:oc},[Sr]:{arrayValue:{}}}}},wR={mapValue:{fields:{[dd]:{nullValue:"NULL_VALUE"}}}},DR={mapValue:{fields:{[Na]:{nullValue:"NULL_VALUE"}}}},IR={mapValue:{fields:{[Pr]:{stringValue:""}}}},TR={mapValue:{fields:{[fn]:{mapValue:{fields:{[ra]:{integerValue:0},[sa]:{integerValue:0}}}}}}},AR={mapValue:{fields:{[zt]:{mapValue:{fields:{[Is]:{stringValue:""},[Ts]:{stringValue:""}}}}}}},ce,It;(It=ce||(ce={})).he="regexValue",It.Te="bsonObjectIdValue",It.Pe="int32Value",It.Ie="decimal128Value",It.Re="bsonTimestampValue",It.Ae="bsonBinaryValue",It.Ve="minKeyValue",It.de="maxKeyValue",It.fe="maxValue",It.me="vectorValue",It.pe="serverTimestampValue",It.ge="regularMapValue";var _m={[oc]:ce.me,[Na]:ce.fe,[PT]:ce.pe},hE={[zt]:ce.he,[Pr]:ce.Te,[tr]:ce.Pe,[_n]:ce.Ie,[fn]:ce.Re,[As]:ce.Ae,[dd]:ce.Ve,[Na]:ce.de},NT=new Set(Object.values(hE)),ht={booleanValue:!0},Je={booleanValue:!1};function Oe(r){if("nullValue"in r)return 0;if("booleanValue"in r)return 2;if("integerValue"in r||"doubleValue"in r)return 3;if("timestampValue"in r)return 4;if("stringValue"in r)return 7;if("bytesValue"in r)return 8;if("referenceValue"in r)return 9;if("geoPointValue"in r)return 11;if("arrayValue"in r)return 13;if(!("mapValue"in r))return Y(28295,{value:r});switch(Cd(r)){case ce.pe:return 6;case ce.fe:return 9007199254740991;case ce.me:return 14;case ce.he:return 12;case ce.Te:return 10;case ce.Pe:case ce.Ie:return 3;case ce.Re:return 5;case ce.Ae:return 8;case ce.Ve:return 1;case ce.de:return 16;default:return 15}}function vt(r,e,t){if(r===e)return!0;let n=Oe(r);if(n!==Oe(e))return!1;switch(n){case 0:case 9007199254740991:case 16:case 1:return!0;case 2:return r.booleanValue===e.booleanValue;case 6:return ws(r).isEqual(ws(e));case 4:return(function(i,a){if(typeof i.timestampValue=="string"&&typeof a.timestampValue=="string"&&i.timestampValue.length===a.timestampValue.length)return i.timestampValue===a.timestampValue;let u=En(i.timestampValue),c=En(a.timestampValue);return u.seconds===c.seconds&&u.nanos===c.nanos})(r,e);case 7:return r.stringValue===e.stringValue;case 8:return(function(i,a){return CE(i,a)===0})(r,e);case 9:return r.referenceValue===e.referenceValue;case 11:return(function(i,a){return ge(i.geoPointValue.latitude)===ge(a.geoPointValue.latitude)&&ge(i.geoPointValue.longitude)===ge(a.geoPointValue.longitude)})(r,e);case 3:return(function(i,a,u){if(Rt(i)&&Rt(a))return dE(i,a)===0;if("integerValue"in i&&"integerValue"in a||qn(i)&&qn(a))return aa(i)===aa(a);let c,l;if("doubleValue"in i&&"doubleValue"in a)c=ge(i.doubleValue),l=ge(a.doubleValue);else{if(!(u!=null&&u.ye))return!1;c=ge(i.integerValue??i.doubleValue),l=ge(a.integerValue??a.doubleValue)}return c===l?!!(u!=null&&u.we)||Ds(c)===Ds(l):!!(u===void 0||u.be)&&isNaN(c)&&isNaN(l)})(r,e,t);case 13:return ys(r.arrayValue.values||[],e.arrayValue.values||[],((s,i)=>vt(s,i,t)));case 14:case 15:return(function(i,a,u){let c=i.mapValue.fields||{},l=a.mapValue.fields||{};if(Rr(c)!==Rr(l))return!1;for(let h in c)if(c.hasOwnProperty(h)&&(l[h]===void 0||!vt(c[h],l[h],u)))return!1;return!0})(r,e,t);case 5:return pE(r,e)===0;case 12:return gE(r,e)===0;case 10:return mE(r,e)===0;default:return Y(52216,{left:r})}}function ia(r,e){return(r.values||[]).find((t=>vt(t,e)))!==void 0}function ft(r,e){if(r===e)return 0;let t=Oe(r),n=Oe(e);if(t!==n)return ae(t,n);switch(t){case 0:case 1:case 16:case 9007199254740991:return 0;case 2:return ae(r.booleanValue,e.booleanValue);case 3:return oa(r,e);case 4:return wm(r.timestampValue,e.timestampValue);case 6:return wm(ws(r),ws(e));case 7:return ta(r.stringValue,e.stringValue);case 8:return CE(r,e);case 9:return(function(i,a){let u=i.split("/"),c=a.split("/");for(let l=0;l<u.length&&l<c.length;l++){let h=ae(u[l],c[l]);if(h!==0)return h}return ae(u.length,c.length)})(r.referenceValue,e.referenceValue);case 11:return(function(i,a){let u=ae(ge(i.latitude),ge(a.latitude));return u!==0?u:ae(ge(i.longitude),ge(a.longitude))})(r.geoPointValue,e.geoPointValue);case 13:return Dm(r.arrayValue,e.arrayValue);case 14:return(function(i,a){var p,E,y,S;let u=i.fields||{},c=a.fields||{},l=(p=u[Sr])==null?void 0:p.arrayValue,h=(E=c[Sr])==null?void 0:E.arrayValue,d=ae(((y=l==null?void 0:l.values)==null?void 0:y.length)||0,((S=h==null?void 0:h.values)==null?void 0:S.length)||0);return d!==0?d:Dm(l,h)})(r.mapValue,e.mapValue);case 15:return(function(i,a){if(i===Zo.mapValue&&a===Zo.mapValue)return 0;if(i===Zo.mapValue)return 1;if(a===Zo.mapValue)return-1;let u=i.fields||{},c=Object.keys(u),l=a.fields||{},h=Object.keys(l);c.sort(),h.sort();for(let d=0;d<c.length&&d<h.length;++d){let p=ta(c[d],h[d]);if(p!==0)return p;let E=ft(u[c[d]],l[h[d]]);if(E!==0)return E}return ae(c.length,h.length)})(r.mapValue,e.mapValue);case 5:return pE(r,e);case 12:return gE(r,e);case 10:return mE(r,e);default:throw Y(23264,{Se:t})}}function aa(r){let e;return e=qn(r)?r.mapValue.fields[tr].integerValue:r.integerValue||r.doubleValue,ge(e)}function fE(r){return r.mapValue.fields[_n].stringValue}function oa(r,e){if(Rt(r)||Rt(e))return dE(r,e);let t=aa(r),n=aa(e);return isNaN(t)?isNaN(n)?0:-1:isNaN(n)?1:ae(t,n)}function dE(r,e){let t=ym(r),n=ym(e);return t.oe()&&n.oe()?0:t.isNaN()?n.isNaN()?0:-1:n.isNaN()?1:t.compareTo(n)}function ym(r){return Rt(r)?fe.fromString(fE(r)):fe.fromNumber(aa(r))}function wm(r,e){if(typeof r=="string"&&typeof e=="string"&&r.length===e.length)return ae(r,e);let t=En(r),n=En(e),s=ae(t.seconds,n.seconds);return s!==0?s:ae(t.nanos,n.nanos)}function Dm(r,e){let t=r.values||[],n=e.values||[];for(let s=0;s<t.length&&s<n.length;++s){let i=ft(t[s],n[s]);if(i!==void 0&&i!==0)return i}return ae(t.length,n.length)}function pE(r,e){var u,c,l,h,d,p,E,y,S,F,U,z;let t=(l=(c=(u=r.mapValue.fields)==null?void 0:u[fn].mapValue)==null?void 0:c.fields)==null?void 0:l[ra],n=(p=(d=(h=e.mapValue.fields)==null?void 0:h[fn].mapValue)==null?void 0:d.fields)==null?void 0:p[ra],s=(S=(y=(E=r.mapValue.fields)==null?void 0:E[fn].mapValue)==null?void 0:y.fields)==null?void 0:S[sa],i=(z=(U=(F=e.mapValue.fields)==null?void 0:F[fn].mapValue)==null?void 0:U.fields)==null?void 0:z[sa],a=oa(t,n);return a!==0?a:oa(s,i)}function Im(r){var u;if("bytesValue"in r)return{subtype:0,bytes:xt(r.bytesValue)};let e=(u=r.mapValue)==null?void 0:u.fields,t=e==null?void 0:e[As],n=t==null?void 0:t.bytesValue;if(!n)throw new Error("Received incorrect value for BsonBinaryData");let s=xt(n).toUint8Array();if(s.length===0)throw new Error("Received empty bytesValue for BsonBinaryData");let i=s[0],a=s.slice(1);return{subtype:i,bytes:De.fromUint8Array(a)}}function CE(r,e){let t=Im(r),n=Im(e);return t.subtype!==n.subtype?t.subtype<n.subtype?-1:1:t.bytes.compareTo(n.bytes)}function gE(r,e){var l,h,d,p,E,y,S,F,U,z,re,me,ye,Ee,A,_;let t=r.mapValue.fields,n=((p=(d=(h=(l=t==null?void 0:t[zt])==null?void 0:l.mapValue)==null?void 0:h.fields)==null?void 0:d[Is])==null?void 0:p.stringValue)??"",s=((F=(S=(y=(E=t==null?void 0:t[zt])==null?void 0:E.mapValue)==null?void 0:y.fields)==null?void 0:S[Ts])==null?void 0:F.stringValue)??"",i=e.mapValue.fields,a=((me=(re=(z=(U=i==null?void 0:i[zt])==null?void 0:U.mapValue)==null?void 0:z.fields)==null?void 0:re[Is])==null?void 0:me.stringValue)??"",u=((_=(A=(Ee=(ye=i==null?void 0:i[zt])==null?void 0:ye.mapValue)==null?void 0:Ee.fields)==null?void 0:A[Ts])==null?void 0:_.stringValue)??"",c=ta(n,a);return c!==0?c:ae(s,u)}function mE(r,e){var t,n,s,i;return ta(((n=(t=r.mapValue.fields)==null?void 0:t[Pr])==null?void 0:n.stringValue)??"",((i=(s=e.mapValue.fields)==null?void 0:s[Pr])==null?void 0:i.stringValue)??"")}function vs(r){return wB(r)}function wB(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?(function(t){let n=En(t);return`time(${n.seconds},${n.nanos})`})(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?(function(t){return xt(t).toBase64()})(r.bytesValue):"referenceValue"in r?(function(t){return X.fromName(t).toString()})(r.referenceValue):"geoPointValue"in r?(function(t){return`geo(${t.latitude},${t.longitude})`})(r.geoPointValue):"arrayValue"in r?(function(t){let n="[",s=!0;for(let i of t.values||[])s?s=!1:n+=",",n+=wB(i);return n+"]"})(r.arrayValue):"mapValue"in r?(function(t){let n=Object.keys(t.fields||{}).sort(),s="{",i=!0;for(let a of n)i?i=!1:s+=",",s+=`${a}:${wB(t.fields[a])}`;return s+"}"})(r.mapValue):Y(61005,{value:r})}function fu(r){switch(Oe(r)){case 0:case 2:return 4;case 3:return Rt(r)?16:8;case 4:case 11:return 16;case 6:let e=Pa(r);return e?16+fu(e):16;case 7:return 2*r.stringValue.length;case 8:return"bytesValue"in r?xt(r.bytesValue).approximateByteSize():Tm(r.mapValue);case 9:return r.referenceValue.length;case 13:return(function(n){return(n.values||[]).reduce(((s,i)=>s+fu(i)),0)})(r.arrayValue);case 14:case 15:case 12:case 10:case 5:case 1:case 16:return Tm(r.mapValue);default:throw Y(13486,{value:r})}}function Tm(r){let e=0;return er(r.fields,((t,n)=>{e+=t.length+fu(n)})),e}function pd(r,e){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${e.path.canonicalString()}`}}function Wt(r){return!!r&&"integerValue"in r}function Qt(r){return!!r&&"doubleValue"in r}function Rt(r){var t;if(!((t=r.mapValue)!=null&&t.fields))return!1;let e=r.mapValue.fields;return Rr(e)===1&&e[_n]&&!!e[_n].stringValue}function qn(r){var t,n;if(!((t=r.mapValue)!=null&&t.fields))return!1;let e=r.mapValue.fields;return Rr(e)===1&&((n=e[tr])==null?void 0:n.integerValue)!==void 0}function yn(r){return Wt(r)||Qt(r)||!!r&&qn(r)||!!r&&Rt(r)}function Rs(r){return!!r&&"arrayValue"in r}function Et(r){return!!r&&"nullValue"in r}function ze(r){return!(!Qt(r)||!isNaN(Number(r.doubleValue)))||!(!Rt(r)||fE(r)!=="NaN")}function Ar(r){return!!r&&"mapValue"in r}function Cd(r){var n,s;if(!((n=r.mapValue)!=null&&n.fields))return ce.ge;let e=r.mapValue.fields,t=(s=e[ac])==null?void 0:s.stringValue;if(t&&_m[t])return _m[t];if(Rr(e)===1){let i=Object.keys(e);return hE[i[0]]??ce.ge}return ce.ge}function DB(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[ac])==null?void 0:n.stringValue)===oc}function IB(r){var e,t;return(t=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[Sr])==null?void 0:t.arrayValue}function Qi(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){let e={mapValue:{fields:{}}};return er(r.mapValue.fields,((t,n)=>e.mapValue.fields[t]=Qi(n))),e}if(r.arrayValue){let e={arrayValue:{values:[]}};for(let t=0;t<(r.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=Qi(r.arrayValue.values[t]);return e}return{...r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var it=class r{constructor(e){this.value=e}static empty(){return new r({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!Ar(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=Qi(t)}setAll(e){let t=Bt.emptyPath(),n={},s=[];e.forEach(((a,u)=>{if(!t.isImmediateParentOf(u)){let c=this.getFieldsMap(t);this.applyChanges(c,n,s),n={},s=[],t=u.popLast()}a?n[u.lastSegment()]=Qi(a):s.push(u.lastSegment())}));let i=this.getFieldsMap(t);this.applyChanges(i,n,s)}delete(e){let t=this.field(e.popLast());Ar(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return vt(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let s=t.mapValue.fields[e.get(n)];Ar(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,n){er(t,((s,i)=>e[s]=i));for(let s of n)delete e[s]}clone(){return new r(Qi(this.value))}};function EE(r){let e=[];return er(r.fields,((t,n)=>{let s=new Bt([t]);if(Ar(n)&&!(function(a){return NT.has(Cd(a))})(n)){let i=EE(n.mapValue).fields;if(i.length===0)e.push(s);else for(let a of i)e.push(s.child(a))}else e.push(s)})),new At(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gd(r,e){if(r.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Ds(e)?"-0":e}}function gs(r){return{integerValue:""+r}}function uc(r,e,t){return ST(e)?gs(e):gd(r,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ss=class{constructor(){this._=void 0}};function OT(r,e,t){return r instanceof Nr?(function(s,i){let a={fields:{[uE]:{stringValue:oE},[lE]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&sc(i)&&(i=Pa(i)),i&&(a.fields[cE]=i),{mapValue:a}})(t,e):r instanceof Or?yE(r,e):r instanceof xr?wE(r,e):r instanceof Fr?(function(s,i){let a=_E(s,i),u=Am(a)+Am(s.xe);return Rt(a)||Rt(s.xe)?{mapValue:{fields:{[_n]:{stringValue:u.toString()}}}}:qn(a)?Qt(s.xe)?{doubleValue:u}:Wt(s.xe)?{integerValue:u.toString()}:{mapValue:{fields:{[tr]:gs(u)}}}:Wt(a)&&(Wt(s.xe)||qn(s.xe))?gs(u):gd(s.serializer,u)})(r,e):r instanceof Ps?(function(s,i){return!yn(i)||ze(s.xe)?s.xe:ze(i)?i:oa(s.xe,i)<0?s.xe:i})(r,e):r instanceof Ns?(function(s,i){return!yn(i)||ze(s.xe)?s.xe:ze(i)?i:oa(s.xe,i)>0?s.xe:i})(r,e):void 0}function xT(r,e,t){return r instanceof Or?yE(r,e):r instanceof xr?wE(r,e):t}function _E(r,e){return r instanceof Fr?yn(e)?e:{integerValue:0}:null}var Nr=class extends Ss{},Or=class extends Ss{constructor(e){super(),this.elements=e}};function yE(r,e){let t=DE(e);for(let n of r.elements)t.some((s=>vt(s,n)))||t.push(n);return{arrayValue:{values:t}}}var xr=class extends Ss{constructor(e){super(),this.elements=e}};function wE(r,e){let t=DE(e);for(let n of r.elements)t=t.filter((s=>!vt(s,n)));return{arrayValue:{values:t}}}var ua=class extends Ss{constructor(e,t){super(),this.serializer=e,this.xe=t}},Fr=class extends ua{},Ps=class extends ua{},Ns=class extends ua{};function Am(r){return Wt(r)?ge(r.integerValue):Qt(r)?ge(r.doubleValue):qn(r)?ge(r.mapValue.fields[tr].integerValue):Rt(r)?parseFloat(r.mapValue.fields[_n].stringValue):0}function DE(r){return Rs(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var TB=class{constructor(e,t){this.field=e,this.transform=t}};function FT(r,e){return r.field.isEqual(e.field)&&(function(n,s){return n instanceof Or&&s instanceof Or||n instanceof xr&&s instanceof xr?ys(n.elements,s.elements,vt):n instanceof Fr&&s instanceof Fr||n instanceof Ps&&s instanceof Ps||n instanceof Ns&&s instanceof Ns?vt(n.xe,s.xe):n instanceof Nr&&s instanceof Nr})(r.transform,e.transform)}var AB=class{constructor(e,t){this.version=e,this.transformResults=t}},dn=class r{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new r}static exists(e){return new r(void 0,e)}static updateTime(e){return new r(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}};function au(r,e){return r.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(r.updateTime):r.exists===void 0||r.exists===e.isFoundDocument()}var Os=class{};function IE(r,e){if(!r.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return r.isNoDocument()?new ca(r.key,dn.none()):new Lr(r.key,r.data,dn.none());{let t=r.data,n=it.empty(),s=new ke(Bt.comparator);for(let i of e.fields)if(!s.has(i)){let a=t.field(i);a===null&&i.length>1&&(i=i.popLast(),a=t.field(i)),a===null?n.delete(i):n.set(i,a),s=s.add(i)}return new en(r.key,n,new At(s.toArray()),dn.none())}}function LT(r,e,t){r instanceof Lr?(function(s,i,a){let u=s.value.clone(),c=vm(s.fieldTransforms,i,a.transformResults);u.setAll(c),i.convertToFoundDocument(a.version,u).setHasCommittedMutations()})(r,e,t):r instanceof en?(function(s,i,a){if(!au(s.precondition,i))return void i.convertToUnknownDocument(a.version);let u=vm(s.fieldTransforms,i,a.transformResults),c=i.data;c.setAll(TE(s)),c.setAll(u),i.convertToFoundDocument(a.version,c).setHasCommittedMutations()})(r,e,t):(function(s,i,a){i.convertToNoDocument(a.version).setHasCommittedMutations()})(0,e,t)}function $i(r,e,t,n){return r instanceof Lr?(function(i,a,u,c){if(!au(i.precondition,a))return u;let l=i.value.clone(),h=Rm(i.fieldTransforms,c,a);return l.setAll(h),a.convertToFoundDocument(a.version,l).setHasLocalMutations(),null})(r,e,t,n):r instanceof en?(function(i,a,u,c){if(!au(i.precondition,a))return u;let l=Rm(i.fieldTransforms,c,a),h=a.data;return h.setAll(TE(i)),h.setAll(l),a.convertToFoundDocument(a.version,h).setHasLocalMutations(),u===null?null:u.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((d=>d.field)))})(r,e,t,n):(function(i,a,u){return au(i.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):u})(r,e,t)}function kT(r,e){let t=null;for(let n of r.fieldTransforms){let s=e.data.field(n.field),i=_E(n.transform,s||null);i!=null&&(t===null&&(t=it.empty()),t.set(n.field,i))}return t||null}function bm(r,e){return r.type===e.type&&!!r.key.isEqual(e.key)&&!!r.precondition.isEqual(e.precondition)&&!!(function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&ys(n,s,((i,a)=>FT(i,a)))})(r.fieldTransforms,e.fieldTransforms)&&(r.type===0?r.value.isEqual(e.value):r.type!==1||r.data.isEqual(e.data)&&r.fieldMask.isEqual(e.fieldMask))}var Lr=class extends Os{constructor(e,t,n,s=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}},en=class extends Os{constructor(e,t,n,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}};function TE(r){let e=new Map;return r.fieldMask.fields.forEach((t=>{if(!t.isEmpty()){let n=r.data.field(t);e.set(t,n)}})),e}function vm(r,e,t){let n=new Map;$(r.length===t.length,32656,{ve:t.length,De:r.length});for(let s=0;s<t.length;s++){let i=r[s],a=i.transform,u=e.data.field(i.field);n.set(i.field,xT(a,u,t[s]))}return n}function Rm(r,e,t){let n=new Map;for(let s of r){let i=s.transform,a=t.data.field(s.field);n.set(s.field,OT(i,a,e))}return n}var ca=class extends Os{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}},bB=class extends Os{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var kr=class{constructor(e,t){this.position=e,this.inclusive=t}};function Sm(r,e,t){let n=0;for(let s=0;s<r.position.length;s++){let i=e[s],a=r.position[s];if(i.field.isKeyField()?n=X.comparator(X.fromName(a.referenceValue),t.key):n=ft(a,t.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function Pm(r,e){if(r===null)return e===null;if(e===null||r.inclusive!==e.inclusive||r.position.length!==e.position.length)return!1;for(let t=0;t<r.position.length;t++)if(!vt(r.position[t],e.position[t]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var du=class{},ve=class r extends du{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,n):new RB(e,t,n):t==="array-contains"?new NB(e,n):t==="in"?new OB(e,n):t==="not-in"?new xB(e,n):t==="array-contains-any"?new FB(e,n):new r(e,t,n)}static createKeyFieldInFilter(e,t,n){return t==="in"?new SB(e,n):new PB(e,n)}matches(e){let t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(ft(t,this.value)):t!==null&&Oe(this.value)===Oe(t)&&this.matchesComparison(ft(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return Y(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}},St=class r extends du{constructor(e,t){super(),this.filters=e,this.op=t,this.Ce=null}static create(e,t){return new r(e,t)}matches(e){return AE(this)?this.filters.find((t=>!t.matches(e)))===void 0:this.filters.find((t=>t.matches(e)))!==void 0}getFlattenedFilters(){return this.Ce!==null||(this.Ce=this.filters.reduce(((e,t)=>e.concat(t.getFlattenedFilters())),[])),this.Ce}getFilters(){return Object.assign([],this.filters)}};function AE(r){return r.op==="and"}function bE(r){return VT(r)&&AE(r)}function VT(r){for(let e of r.filters)if(e instanceof St)return!1;return!0}function vB(r){if(r instanceof ve)return r.field.canonicalString()+r.op.toString()+vs(r.value);if(bE(r))return r.filters.map((e=>vB(e))).join(",");{let e=r.filters.map((t=>vB(t))).join(",");return`${r.op}(${e})`}}function vE(r,e){return r instanceof ve?(function(n,s){return s instanceof ve&&n.op===s.op&&n.field.isEqual(s.field)&&vt(n.value,s.value)})(r,e):r instanceof St?(function(n,s){return s instanceof St&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce(((i,a,u)=>i&&vE(a,s.filters[u])),!0):!1})(r,e):void Y(19439)}function RE(r){return r instanceof ve?(function(t){return`${t.field.canonicalString()} ${t.op} ${vs(t.value)}`})(r):r instanceof St?(function(t){return t.op.toString()+" {"+t.getFilters().map(RE).join(" ,")+"}"})(r):"Filter"}var RB=class extends ve{constructor(e,t,n){super(e,t,n),this.key=X.fromName(n.referenceValue)}matches(e){let t=X.comparator(e.key,this.key);return this.matchesComparison(t)}},SB=class extends ve{constructor(e,t){super(e,"in",t),this.keys=SE("in",t)}matches(e){return this.keys.some((t=>t.isEqual(e.key)))}},PB=class extends ve{constructor(e,t){super(e,"not-in",t),this.keys=SE("not-in",t)}matches(e){return!this.keys.some((t=>t.isEqual(e.key)))}};function SE(r,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map((n=>X.fromName(n.referenceValue)))}var NB=class extends ve{constructor(e,t){super(e,"array-contains",t)}matches(e){let t=e.data.field(this.field);return Rs(t)&&ia(t.arrayValue,this.value)}},OB=class extends ve{constructor(e,t){super(e,"in",t)}matches(e){let t=e.data.field(this.field);return t!==null&&ia(this.value.arrayValue,t)}},xB=class extends ve{constructor(e,t){super(e,"not-in",t)}matches(e){if(ia(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;let t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!ia(this.value.arrayValue,t)}},FB=class extends ve{constructor(e,t){super(e,"array-contains-any",t)}matches(e){let t=e.data.field(this.field);return!(!Rs(t)||!t.arrayValue.values)&&t.arrayValue.values.some((n=>ia(this.value.arrayValue,n)))}};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Vr=class{constructor(e,t="asc"){this.field=e,this.dir=t}};function MT(r,e){return r.dir===e.dir&&r.field.isEqual(e.field)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var te=class r{static fromTimestamp(e){return new r(e)}static min(){return new r(new Ie(0,0))}static max(){return new r(new Ie(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var kt=class r{constructor(e,t,n,s,i,a,u){this.key=e,this.documentType=t,this.version=n,this.readTime=s,this.createTime=i,this.data=a,this.documentState=u}static newInvalidDocument(e){return new r(e,0,te.min(),te.min(),te.min(),it.empty(),0)}static newFoundDocument(e,t,n,s){return new r(e,1,t,te.min(),n,s,0)}static newNoDocument(e,t){return new r(e,2,t,te.min(),te.min(),it.empty(),0)}static newUnknownDocument(e,t){return new r(e,3,t,te.min(),te.min(),it.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(te.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=it.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=it.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=te.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof r&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new r(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var la=-1,pu=class{constructor(e,t,n,s){this.indexId=e,this.collectionGroup=t,this.fields=n,this.indexState=s}};pu.UNKNOWN_ID=-1;function GT(r,e){let t=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=te.fromTimestamp(n===1e9?new Ie(t+1,0):new Ie(t,n));return new Mr(s,X.empty(),e)}function UT(r){return new Mr(r.readTime,r.key,la)}var Mr=class r{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new r(te.min(),X.empty(),la)}static max(){return new r(te.max(),X.empty(),la)}};function HT(r,e){let t=r.readTime.compareTo(e.readTime);return t!==0?t:(t=X.comparator(r.documentKey,e.documentKey),t!==0?t:ae(r.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var LB=class{constructor(e,t=null,n=[],s=[],i=null,a=null,u=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=a,this.endAt=u,this.Fe=null}};function Nm(r,e=null,t=[],n=[],s=null,i=null,a=null){return new LB(r,e,t,n,s,i,a)}function PE(r){let e=ne(r);if(e.Fe===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map((n=>vB(n))).join(","),t+="|ob:",t+=e.orderBy.map((n=>(function(i){return i.field.canonicalString()+i.dir})(n))).join(","),ic(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map((n=>vs(n))).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map((n=>vs(n))).join(",")),e.Fe=t}return e.Fe}function NE(r,e){if(r.limit!==e.limit||r.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<r.orderBy.length;t++)if(!MT(r.orderBy[t],e.orderBy[t]))return!1;if(r.filters.length!==e.filters.length)return!1;for(let t=0;t<r.filters.length;t++)if(!vE(r.filters[t],e.filters[t]))return!1;return r.collectionGroup===e.collectionGroup&&!!r.path.isEqual(e.path)&&!!Pm(r.startAt,e.startAt)&&Pm(r.endAt,e.endAt)}function Dr(r){return!!r.isCorePipeline}function OE(r){return!!r.path&&X.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Gr=class{constructor(e,t=null,n=[],s=[],i=null,a="F",u=null,c=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=a,this.startAt=u,this.endAt=c,this.Oe=null,this.Me=null,this.Ne=null,this.startAt,this.endAt}};function qT(r,e,t,n,s,i,a,u){return new Gr(r,e,t,n,s,i,a,u)}function Oa(r){return new Gr(r)}function Om(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function jT(r){return X.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function md(r){return r.collectionGroup!==null}function ms(r){let e=ne(r);if(e.Oe===null){e.Oe=[];let t=new Set;for(let i of e.explicitOrderBy)e.Oe.push(i),t.add(i.field.canonicalString());let n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(a){let u=new ke(Bt.comparator);return a.filters.forEach((c=>{c.getFlattenedFilters().forEach((l=>{l.isInequality()&&(u=u.add(l.field))}))})),u})(e).forEach((i=>{t.has(i.canonicalString())||i.isKeyField()||e.Oe.push(new Vr(i,n))})),t.has(Bt.keyField().canonicalString())||e.Oe.push(new Vr(Bt.keyField(),n))}return e.Oe}function Yt(r){let e=ne(r);return e.Me||(e.Me=KT(e,ms(r))),e.Me}function KT(r,e){if(r.limitType==="F")return Nm(r.path,r.collectionGroup,e,r.filters,r.limit,r.startAt,r.endAt);{e=e.map((s=>{let i=s.dir==="desc"?"asc":"desc";return new Vr(s.field,i)}));let t=r.endAt?new kr(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new kr(r.startAt.position,r.startAt.inclusive):null;return Nm(r.path,r.collectionGroup,e,r.filters,r.limit,t,n)}}function cc(r,e){let t=r.filters.concat([e]);return new Gr(r.path,r.collectionGroup,r.explicitOrderBy.slice(),t,r.limit,r.limitType,r.startAt,r.endAt)}function Cu(r,e,t){return new Gr(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),e,t,r.startAt,r.endAt)}function JT(r,e){return NE(Yt(r),Yt(e))&&r.limitType===e.limitType}function Yi(r){return`Query(target=${(function(t){let n=t.path.canonicalString();return t.collectionGroup!==null&&(n+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(n+=`, filters: [${t.filters.map((s=>RE(s))).join(", ")}]`),ic(t.limit)||(n+=", limit: "+t.limit),t.orderBy.length>0&&(n+=`, orderBy: [${t.orderBy.map((s=>(function(a){return`${a.field.canonicalString()} (${a.dir})`})(s))).join(", ")}]`),t.startAt&&(n+=", startAt: ",n+=t.startAt.inclusive?"b:":"a:",n+=t.startAt.position.map((s=>vs(s))).join(",")),t.endAt&&(n+=", endAt: ",n+=t.endAt.inclusive?"a:":"b:",n+=t.endAt.position.map((s=>vs(s))).join(",")),`Target(${n})`})(Yt(r))}; limitType=${r.limitType})`}function lc(r,e){return e.isFoundDocument()&&(function(n,s){let i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):X.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)})(r,e)&&(function(n,s){for(let i of ms(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0})(r,e)&&(function(n,s){for(let i of n.filters)if(!i.matches(s))return!1;return!0})(r,e)&&(function(n,s){return!(n.startAt&&!(function(a,u,c){let l=Sm(a,u,c);return a.inclusive?l<=0:l<0})(n.startAt,ms(n),s)||n.endAt&&!(function(a,u,c){let l=Sm(a,u,c);return a.inclusive?l>=0:l>0})(n.endAt,ms(n),s))})(r,e)}function Ed(r){return(e,t)=>{let n=!1;for(let s of ms(r)){let i=zT(s,e,t);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function zT(r,e,t){let n=r.field.isKeyField()?X.comparator(e.key,t.key):(function(i,a,u){let c=a.data.field(i),l=u.data.field(i);return c!==null&&l!==null?ft(c,l):Y(42886)})(r.field,e,t);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return Y(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var kB=class{constructor(e,t){this.count=e,this.unchangedNames=t}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Pe,Be;function WT(r){switch(r){case V.OK:return Y(64938);case V.CANCELLED:case V.UNKNOWN:case V.DEADLINE_EXCEEDED:case V.RESOURCE_EXHAUSTED:case V.INTERNAL:case V.UNAVAILABLE:case V.UNAUTHENTICATED:return!1;case V.INVALID_ARGUMENT:case V.NOT_FOUND:case V.ALREADY_EXISTS:case V.PERMISSION_DENIED:case V.FAILED_PRECONDITION:case V.ABORTED:case V.OUT_OF_RANGE:case V.UNIMPLEMENTED:case V.DATA_LOSS:return!0;default:return Y(15467,{code:r})}}function xE(r){if(r===void 0)return mn("GRPC error has no .code"),V.UNKNOWN;switch(r){case Pe.OK:return V.OK;case Pe.CANCELLED:return V.CANCELLED;case Pe.UNKNOWN:return V.UNKNOWN;case Pe.DEADLINE_EXCEEDED:return V.DEADLINE_EXCEEDED;case Pe.RESOURCE_EXHAUSTED:return V.RESOURCE_EXHAUSTED;case Pe.INTERNAL:return V.INTERNAL;case Pe.UNAVAILABLE:return V.UNAVAILABLE;case Pe.UNAUTHENTICATED:return V.UNAUTHENTICATED;case Pe.INVALID_ARGUMENT:return V.INVALID_ARGUMENT;case Pe.NOT_FOUND:return V.NOT_FOUND;case Pe.ALREADY_EXISTS:return V.ALREADY_EXISTS;case Pe.PERMISSION_DENIED:return V.PERMISSION_DENIED;case Pe.FAILED_PRECONDITION:return V.FAILED_PRECONDITION;case Pe.ABORTED:return V.ABORTED;case Pe.OUT_OF_RANGE:return V.OUT_OF_RANGE;case Pe.UNIMPLEMENTED:return V.UNIMPLEMENTED;case Pe.DATA_LOSS:return V.DATA_LOSS;default:return Y(39323,{code:r})}}(Be=Pe||(Pe={}))[Be.OK=0]="OK",Be[Be.CANCELLED=1]="CANCELLED",Be[Be.UNKNOWN=2]="UNKNOWN",Be[Be.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Be[Be.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Be[Be.NOT_FOUND=5]="NOT_FOUND",Be[Be.ALREADY_EXISTS=6]="ALREADY_EXISTS",Be[Be.PERMISSION_DENIED=7]="PERMISSION_DENIED",Be[Be.UNAUTHENTICATED=16]="UNAUTHENTICATED",Be[Be.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Be[Be.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Be[Be.ABORTED=10]="ABORTED",Be[Be.OUT_OF_RANGE=11]="OUT_OF_RANGE",Be[Be.UNIMPLEMENTED=12]="UNIMPLEMENTED",Be[Be.INTERNAL=13]="INTERNAL",Be[Be.UNAVAILABLE=14]="UNAVAILABLE",Be[Be.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var wn=class{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){let t=this.mapKeyFn(e),n=this.inner[t];if(n!==void 0){for(let[s,i]of n)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){let n=this.mapKeyFn(e),s=this.inner[n];if(s===void 0)return this.inner[n]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){let t=this.mapKeyFn(e),n=this.inner[t];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],e))return n.length===1?delete this.inner[t]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(e){er(this.inner,((t,n)=>{for(let[s,i]of n)e(s,i)}))}isEmpty(){return sE(this.inner)}size(){return this.innerSize}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var QT=new Te(X.comparator);function lt(){return QT}var FE=new Te(X.comparator);function hs(...r){let e=FE;for(let t of r)e=e.insert(t.key,t);return e}function LE(r){let e=FE;return r.forEach(((t,n)=>e=e.insert(t,n.overlayedDocument))),e}function kn(){return Xi()}function kE(){return Xi()}function Xi(){return new wn((r=>r.toString()),((r,e)=>r.isEqual(e)))}var $T=new Te(X.comparator),YT=new ke(X.comparator);function ue(...r){let e=YT;for(let t of r)e=e.add(t);return e}var XT=new ke(ae);function ZT(){return XT}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var hB=null;/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function e0(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var t0=new Bn([4294967295,4294967295],0);function xm(r){let e=e0().encode(r),t=new Wl;return t.update(e),new Uint8Array(t.digest())}function Fm(r){let e=new DataView(r.buffer),t=e.getUint32(0,!0),n=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new Bn([t,n],0),new Bn([s,i],0)]}var VB=class r{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new Ir(`Invalid padding: ${t}`);if(n<0)throw new Ir(`Invalid hash count: ${n}`);if(e.length>0&&this.hashCount===0)throw new Ir(`Invalid hash count: ${n}`);if(e.length===0&&t!==0)throw new Ir(`Invalid padding when bitmap length is 0: ${t}`);this.Be=8*e.length-t,this.Le=Bn.fromNumber(this.Be)}$e(e,t,n){let s=e.add(t.multiply(Bn.fromNumber(n)));return s.compare(t0)===1&&(s=new Bn([s.getBits(0),s.getBits(1)],0)),s.modulo(this.Le).toNumber()}Ue(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.Be===0)return!1;let t=xm(e),[n,s]=Fm(t);for(let i=0;i<this.hashCount;i++){let a=this.$e(n,s,i);if(!this.Ue(a))return!1}return!0}static create(e,t,n){let s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),a=new r(i,s,t);return n.forEach((u=>a.insert(u))),a}insert(e){if(this.Be===0)return;let t=xm(e),[n,s]=Fm(t);for(let i=0;i<this.hashCount;i++){let a=this.$e(n,s,i);this.ke(a)}}ke(e){let t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}},Ir=class extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ba=class r{constructor(e,t,n,s,i,a){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=s,this.augmentedDocumentUpdates=i,this.resolvedLimboDocuments=a}static createSynthesizedRemoteEventForCurrentChange(e,t,n){let s=new Map;return s.set(e,ha.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new r(te.min(),s,new Te(ae),lt(),lt(),ue())}},ha=class r{constructor(e,t,n,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new r(n,t,ue(),ue(),ue())}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Es=class{constructor(e,t,n,s){this.Qe=e,this.removedTargetIds=t,this.key=n,this.qe=s}},gu=class{constructor(e,t){this.targetId=e,this.Ke=t}},mu=class{constructor(e,t,n=De.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=s}},Eu=class{constructor(e){this.targetId=e,this.We=0,this.Ge=Lm(),this.je=De.EMPTY_BYTE_STRING,this.ze=!1,this.He=!0}get current(){return this.ze}get resumeToken(){return this.je}get Je(){return this.We!==0}get Ye(){return this.He}Ze(e){e.approximateByteSize()>0&&(this.He=!0,this.je=e)}Xe(){let e=ue(),t=ue(),n=ue();return this.Ge.forEach(((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:n=n.add(s);break;default:Y(38017,{changeType:i})}})),new ha(this.je,this.ze,e,t,n)}et(){this.He=!1,this.Ge=Lm()}tt(e,t){this.He=!0,this.Ge=this.Ge.insert(e,t)}nt(e){this.He=!0,this.Ge=this.Ge.remove(e)}rt(){this.We+=1}it(){this.We-=1,$(this.We>=0,3241,{We:this.We,targetId:this.targetId})}st(){this.He=!0,this.ze=!0}},Ji="WatchChangeAggregator",MB=class{constructor(e){this._t=e,this.ot=new Map,this.ut=lt(),this.ct=eu(),this.lt=lt(),this.Et=eu(),this.ht=new Te(ae)}Tt(e){for(let t of e.Qe)e.qe&&e.qe.isFoundDocument()?this.Pt(t,e.qe):this.It(t,e.key,e.qe);for(let t of e.removedTargetIds)this.It(t,e.key,e.qe)}Rt(e){this.forEachTarget(e,(t=>{let n=this.ot.get(t);if(n)switch(e.state){case 0:this.At(t)&&n.Ze(e.resumeToken);break;case 1:n.it(),n.Je||n.et(),n.Ze(e.resumeToken);break;case 2:n.it(),n.Je||this.removeTarget(t);break;case 3:this.At(t)&&(n.st(),n.Ze(e.resumeToken));break;case 4:this.At(t)&&(this.Vt(t),n.Ze(e.resumeToken));break;default:Y(56790,{state:e.state})}else K(Ji,`handleTargetChange received targetChange for untracked target ID (${t}) with state (${e.state})`)}))}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ot.forEach(((n,s)=>{this.At(s)&&t(s)}))}dt(e){var t;return Dr(e)?e.getPipelineSourceType()==="documents"&&((t=e.getPipelineDocuments())==null?void 0:t.length)===1:OE(e)}ft(e){let t=e.targetId,n=e.Ke.count,s=this.gt(t);if(s){let i=s.target;if(this.dt(i))if(n===0){let a=new X(Dr(i)?he.fromString(i.getPipelineDocuments()[0]):i.path);this.It(t,a,kt.newNoDocument(a,te.min()))}else $(n===1,20013,"Single document existence filter with count: "+n);else{let a=this.yt(t);if(a!==n){let u=this.wt(e),c=u?this.bt(u,e,a):1;if(c!==0){this.Vt(t);let l=c===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.ht=this.ht.insert(t,l)}hB==null||hB.St((function(h,d,p,E,y){var U,z,re;let S={localCacheCount:h,existenceFilterCount:d.count,databaseId:p.database,projectId:p.projectId},F=d.unchangedNames;return F&&(S.bloomFilter={applied:y===0,hashCount:(F==null?void 0:F.hashCount)??0,bitmapLength:((z=(U=F==null?void 0:F.bits)==null?void 0:U.bitmap)==null?void 0:z.length)??0,padding:((re=F==null?void 0:F.bits)==null?void 0:re.padding)??0,mightContain:me=>(E==null?void 0:E.mightContain(me))??!1}),S})(a,e.Ke,this._t.xt(),u,c))}}}}wt(e){let t=e.Ke.unchangedNames;if(!t||!t.bits)return null;let{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=t,a,u;try{a=xt(n).toUint8Array()}catch(c){if(c instanceof Bu)return bt("Decoding the base64 bloom filter in existence filter failed ("+c.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw c}try{u=new VB(a,s,i)}catch(c){return bt(c instanceof Ir?"BloomFilter error: ":"Applying bloom filter failed: ",c),null}return u.Be===0?null:u}bt(e,t,n){return t.Ke.count===n-this.vt(e,t.targetId)?0:2}vt(e,t){let n=this._t.getRemoteKeysForTarget(t),s=0;return n.forEach((i=>{let a=this._t.xt(),u=`projects/${a.projectId}/databases/${a.database}/documents/${i.path.canonicalString()}`;e.mightContain(u)||(this.It(t,i,null),s++)})),s}Dt(e){let t=new Map;this.ot.forEach(((i,a)=>{let u=this.gt(a);if(u){if(i.current&&this.dt(u.target)){let c=Dr(u.target)?he.fromString(u.target.getPipelineDocuments()[0]):u.target.path,l=new X(c);this.Ct(l).has(a)||this.Ft(a,l)||this.It(a,l,kt.newNoDocument(l,e))}i.Ye&&(t.set(a,i.Xe()),i.et())}}));let n=ue();this.Et.forEach(((i,a)=>{let u=!0;a.forEachWhile((c=>{let l=this.gt(c);return!l||l.purpose==="TargetPurposeLimboResolution"||(u=!1,!1)})),u&&(n=n.add(i))})),this.ut.forEach(((i,a)=>a.setReadTime(e))),this.lt.forEach(((i,a)=>a.setReadTime(e)));let s=new Ba(e,t,this.ht,this.ut,this.lt,n);return this.ut=lt(),this.ct=eu(),this.lt=lt(),this.Et=eu(),this.ht=new Te(ae),s}Pt(e,t){let n=this.ot.get(e);if(!n||!this.At(e))return void K(Ji,`addDocumentToTarget received document for unknown inactive target (${e})`);let s=this.Ft(e,t.key)?2:0;n.tt(t.key,s),Dr(this.gt(e).target)&&this.gt(e).target.getPipelineFlavor()!=="exact"?this.lt=this.lt.insert(t.key,t):this.ut=this.ut.insert(t.key,t),this.ct=this.ct.insert(t.key,this.Ct(t.key).add(e)),this.Et=this.Et.insert(t.key,this.Ot(t.key).add(e))}It(e,t,n){let s=this.ot.get(e);s&&this.At(e)?(this.Ft(e,t)?s.tt(t,1):s.nt(t),this.Et=this.Et.insert(t,this.Ot(t).delete(e)),this.Et=this.Et.insert(t,this.Ot(t).add(e)),n&&(Dr(this.gt(e).target)&&this.gt(e).target.getPipelineFlavor()!=="exact"?this.lt=this.lt.insert(t,n):this.ut=this.ut.insert(t,n))):K(Ji,`removeDocumentFromTarget received document for unknown or inactive target (${e})`)}removeTarget(e){this.ot.delete(e)}yt(e){let t=this.ot.get(e);if(!t)return 0;let n=t.Xe();return this._t.getRemoteKeysForTarget(e).size+n.addedDocuments.size-n.removedDocuments.size}rt(e){let t=this.ot.get(e);t||(K(Ji,`recordPendingTargetRequest set up tracking for target ID ${e}`),t=new Eu(e),this.ot.set(e,t)),t.rt()}Ot(e){let t=this.Et.get(e);return t||(t=new ke(ae),this.Et=this.Et.insert(e,t)),t}Ct(e){let t=this.ct.get(e);return t||(t=new ke(ae),this.ct=this.ct.insert(e,t)),t}At(e){let t=this.gt(e)!==null;return t||K(Ji,"Detected inactive target",e),t}gt(e){let t=this.ot.get(e);return t===void 0||t.Je?null:this._t.Mt(e)}Vt(e){this.ot.set(e,new Eu(e)),this._t.getRemoteKeysForTarget(e).forEach((t=>{this.It(e,t,null)}))}Ft(e,t){return this._t.getRemoteKeysForTarget(e).has(t)}};function eu(){return new Te(X.comparator)}function Lm(){return new Te(X.comparator)}var n0={asc:"ASCENDING",desc:"DESCENDING"},r0={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},s0={and:"AND",or:"OR"},GB=class{constructor(e,t){this.databaseId=e,this.useProto3Json=t}};function UB(r,e){return r.useProto3Json||ic(e)?e:{value:e}}function Zi(r,e){return r.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function _d(r){let e=En(r);return new Ie(e.seconds,e.nanos)}function HB(r,e){return r.useProto3Json?e.toBase64():e.toUint8Array()}function ou(r,e){return Zi(r,e.toTimestamp())}function Xt(r){return $(!!r,49232),te.fromTimestamp(_d(r))}function yd(r,e){return qB(r,e).canonicalString()}function qB(r,e){let t=(function(s){return new he(["projects",s.projectId,"databases",s.database])})(r).child("documents");return e===void 0?t:t.child(e)}function VE(r){let e=he.fromString(r);return $(qE(e),10190,{key:e.toString()}),e}function _u(r,e){return yd(r.databaseId,e.path)}function fB(r,e){let t=VE(e);if(t.get(1)!==r.databaseId.projectId)throw new q(V.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+r.databaseId.projectId);if(t.get(3)!==r.databaseId.database)throw new q(V.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+r.databaseId.database);return new X(GE(t))}function ME(r,e){return yd(r.databaseId,e)}function i0(r){let e=VE(r);return e.length===4?he.emptyPath():GE(e)}function jB(r){return new he(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function GE(r){return $(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function km(r,e,t){return{name:_u(r,e),fields:t.value.mapValue.fields}}function a0(r,e){let t;if("targetChange"in e){e.targetChange;let n=(function(l){return l==="NO_CHANGE"?0:l==="ADD"?1:l==="REMOVE"?2:l==="CURRENT"?3:l==="RESET"?4:Y(39313,{state:l})})(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=(function(l,h){return l.useProto3Json?($(h===void 0||typeof h=="string",58123),De.fromBase64String(h||"")):($(h===void 0||h instanceof Buffer||h instanceof Uint8Array,16193),De.fromUint8Array(h||new Uint8Array))})(r,e.targetChange.resumeToken),a=e.targetChange.cause,u=a&&(function(l){let h=l.code===void 0?V.UNKNOWN:xE(l.code);return new q(h,l.message||"")})(a);t=new mu(n,s,i,u||null)}else if("documentChange"in e){e.documentChange;let n=e.documentChange;n.document,n.document.name,n.document.updateTime;let s=fB(r,n.document.name),i=Xt(n.document.updateTime),a=n.document.createTime?Xt(n.document.createTime):te.min(),u=new it({mapValue:{fields:n.document.fields}}),c=kt.newFoundDocument(s,i,a,u),l=n.targetIds||[],h=n.removedTargetIds||[];t=new Es(l,h,c.key,c)}else if("documentDelete"in e){e.documentDelete;let n=e.documentDelete;n.document;let s=fB(r,n.document),i=n.readTime?Xt(n.readTime):te.min(),a=kt.newNoDocument(s,i),u=n.removedTargetIds||[];t=new Es([],u,a.key,a)}else if("documentRemove"in e){e.documentRemove;let n=e.documentRemove;n.document;let s=fB(r,n.document),i=n.removedTargetIds||[];t=new Es([],i,s,null)}else{if(!("filter"in e))return Y(11601,{Nt:e});{e.filter;let n=e.filter;n.targetId;let{count:s=0,unchangedNames:i}=n,a=new kB(s,i),u=n.targetId;t=new gu(u,a)}}return t}function o0(r,e){let t;if(e instanceof Lr)t={update:km(r,e.key,e.value)};else if(e instanceof ca)t={delete:_u(r,e.key)};else if(e instanceof en)t={update:km(r,e.key,e.data),updateMask:g0(e.fieldMask)};else{if(!(e instanceof bB))return Y(16599,{Bt:e.type});t={verify:_u(r,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map((n=>(function(i,a){let u=a.transform;if(u instanceof Nr)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(u instanceof Or)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:u.elements}};if(u instanceof xr)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:u.elements}};if(u instanceof Fr)return{fieldPath:a.field.canonicalString(),increment:u.xe};if(u instanceof Ps)return{fieldPath:a.field.canonicalString(),minimum:u.xe};if(u instanceof Ns)return{fieldPath:a.field.canonicalString(),maximum:u.xe};throw Y(20930,{transform:a.transform})})(0,n)))),e.precondition.isNone||(t.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:ou(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:Y(27497)})(r,e.precondition)),t}function u0(r,e){return r&&r.length>0?($(e!==void 0,14353),r.map((t=>(function(s,i){let a=s.updateTime?Xt(s.updateTime):Xt(i);return a.isEqual(te.min())&&(a=Xt(i)),new AB(a,s.transformResults||[])})(t,e)))):[]}function c0(r,e){return{documents:[ME(r,e.path)]}}function l0(r,e){let t={structuredQuery:{}},n=e.path,s;e.collectionGroup!==null?(s=n,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=n.popLast(),t.structuredQuery.from=[{collectionId:n.lastSegment()}]),t.parent=ME(r,s);let i=(function(l){if(l.length!==0)return HE(St.create(l,"and"))})(e.filters);i&&(t.structuredQuery.where=i);let a=(function(l){if(l.length!==0)return l.map((h=>(function(p){return{field:fs(p.field),direction:d0(p.dir)}})(h)))})(e.orderBy);a&&(t.structuredQuery.orderBy=a);let u=UB(r,e.limit);return u!==null&&(t.structuredQuery.limit=u),e.startAt&&(t.structuredQuery.startAt=(function(l){return{before:l.inclusive,values:l.position}})(e.startAt)),e.endAt&&(t.structuredQuery.endAt=(function(l){return{before:!l.inclusive,values:l.position}})(e.endAt)),{Lt:t,parent:s}}function B0(r){let e=i0(r.parent),t=r.structuredQuery,n=t.from?t.from.length:0,s=null;if(n>0){$(n===1,65062);let h=t.from[0];h.allDescendants?s=h.collectionId:e=e.child(h.collectionId)}let i=[];t.where&&(i=(function(d){let p=UE(d);return p instanceof St&&bE(p)?p.getFilters():[p]})(t.where));let a=[];t.orderBy&&(a=(function(d){return d.map((p=>(function(y){return new Vr(ds(y.field),(function(F){switch(F){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(y.direction))})(p)))})(t.orderBy));let u=null;t.limit&&(u=(function(d){let p;return p=typeof d=="object"?d.value:d,ic(p)?null:p})(t.limit));let c=null;t.startAt&&(c=(function(d){let p=!!d.before,E=d.values||[];return new kr(E,p)})(t.startAt));let l=null;return t.endAt&&(l=(function(d){let p=!d.before,E=d.values||[];return new kr(E,p)})(t.endAt)),qT(e,s,a,i,u,"F",c,l)}function h0(r,e){let t=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return Y(28987,{purpose:s})}})(e.purpose);return t==null?null:{"goog-listen-tags":t}}function f0(r,e){return{structuredPipeline:{pipeline:{stages:e.stages.map((t=>t._toProto(r)))}}}}function UE(r){return r.unaryFilter!==void 0?(function(t){switch(t.unaryFilter.op){case"IS_NAN":let n=ds(t.unaryFilter.field);return ve.create(n,"==",{doubleValue:NaN});case"IS_NULL":let s=ds(t.unaryFilter.field);return ve.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":let i=ds(t.unaryFilter.field);return ve.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":let a=ds(t.unaryFilter.field);return ve.create(a,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return Y(61313);default:return Y(60726)}})(r):r.fieldFilter!==void 0?(function(t){return ve.create(ds(t.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return Y(58110);default:return Y(50506)}})(t.fieldFilter.op),t.fieldFilter.value)})(r):r.compositeFilter!==void 0?(function(t){return St.create(t.compositeFilter.filters.map((n=>UE(n))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return Y(1026)}})(t.compositeFilter.op))})(r):Y(30097,{filter:r})}function d0(r){return n0[r]}function p0(r){return r0[r]}function C0(r){return s0[r]}function fs(r){return{fieldPath:r.canonicalString()}}function ds(r){return Bt.fromServerFormat(r.fieldPath)}function HE(r){return r instanceof ve?(function(t){if(t.op==="=="){if(ze(t.value))return{unaryFilter:{field:fs(t.field),op:"IS_NAN"}};if(Et(t.value))return{unaryFilter:{field:fs(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(ze(t.value))return{unaryFilter:{field:fs(t.field),op:"IS_NOT_NAN"}};if(Et(t.value))return{unaryFilter:{field:fs(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:fs(t.field),op:p0(t.op),value:t.value}}})(r):r instanceof St?(function(t){let n=t.getFilters().map((s=>HE(s)));return n.length===1?n[0]:{compositeFilter:{op:C0(t.op),filters:n}}})(r):Y(54877,{filter:r})}function g0(r){let e=[];return r.fields.forEach((t=>e.push(t.canonicalString()))),{fieldPaths:e}}function qE(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}function jE(r){return!!r&&typeof r._toProto=="function"&&r._protoValueType==="ProtoValue"}function fa(r,e){let t={fields:{}};return e.forEach(((n,s)=>{if(typeof s!="string")throw new Error(`Cannot encode map with non-string key: ${s}`);t.fields[s]=n._toProto(r)})),{mapValue:t}}function yu(r){return{stringValue:r}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bc(r){return new GB(r,!0)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var xs=class{constructor(e){this.value=e}isEqual(e){return this.value===e.value}};/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Fs=class{constructor(e,t){if(this.seconds=e,this.increment=t,!Number.isInteger(e)||e<0||e>4294967295)throw new Error("BsonTimestamp 'seconds' must be in the range of a 32-bit unsigned integer (0-4294967295).");if(!Number.isInteger(t)||t<0||t>4294967295)throw new Error("BsonTimestamp 'increment' must be in the range of a 32-bit unsigned integer (0-4294967295).")}isEqual(e){return this.seconds===e.seconds&&this.increment===e.increment}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Zt=class r{constructor(e,t=0){if(this.subtype=t,!Number.isInteger(t)||t<0||t>255)throw new q(V.INVALID_ARGUMENT,"The subtype for Bytes must be a value in the inclusive [0, 255] range.");this._byteString=e}static fromBase64String(e,t=0){try{return new r(De.fromBase64String(e),t)}catch(n){throw new q(V.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+n)}}static fromUint8Array(e,t=0){return new r(De.fromUint8Array(e),t)}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}get data(){return this.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+", subtype: "+this.subtype+")"}isEqual(e){return this.subtype===e.subtype&&this._byteString.isEqual(e._byteString)}toJSON(){let e={type:r._jsonSchemaVersion,bytes:this.toBase64()};return this.subtype!==0&&(e.subtype=this.subtype),e}static fromJSON(e){if(Sa(e,r._jsonSchema)){let t=e.subtype??0;return r.fromBase64String(e.bytes,t)}}};Zt._jsonSchemaVersion="firestore/bytes/1.0",Zt._jsonSchema={type:Re("string",Zt._jsonSchemaVersion),bytes:Re("string"),subtype:{...Re("number"),optional:!0}};/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ls=class{constructor(e){this.stringValue=e,this.value=fe.fromString(e)}isEqual(e){return!(!this.value.oe()||!e.value.oe())||this.value.compareTo(e.value)===0}toJSON(){return{Ut:{stringValue:this.stringValue}}}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ur=class{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new q(V.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new Bt(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}};function KE(){return new Ur(Jt)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Hr=class{constructor(e){this._methodName=e}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var pn=class r{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new q(V.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new q(V.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return ae(this._lat,e._lat)||ae(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:r._jsonSchemaVersion}}static fromJSON(e){if(Sa(e,r._jsonSchema))return new r(e.latitude,e.longitude)}};pn._jsonSchemaVersion="firestore/geoPoint/1.0",pn._jsonSchema={type:Re("string",pn._jsonSchemaVersion),latitude:Re("number"),longitude:Re("number")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ks=class{constructor(e){this.value=e}isEqual(e){return this.value===e.value}};/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var qr=class r{constructor(){this.type="MaxKey"}static instance(){return r.MAX_KEY_VALUE_INSTANCE||(r.MAX_KEY_VALUE_INSTANCE=new r),r.MAX_KEY_VALUE_INSTANCE}};qr.MAX_KEY_VALUE_INSTANCE=null;/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var jr=class r{constructor(){this.type="MinKey"}static instance(){return r.MIN_KEY_VALUE_INSTANCE||(r.MIN_KEY_VALUE_INSTANCE=new r),r.MIN_KEY_VALUE_INSTANCE}};jr.MIN_KEY_VALUE_INSTANCE=null;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ke=class{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}};Ke.UNAUTHENTICATED=new Ke(null),Ke.GOOGLE_CREDENTIALS=new Ke("google-credentials-uid"),Ke.FIRST_PARTY=new Ke("first-party-uid"),Ke.MOCK_USER=new Ke("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Lt=class{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var wu=class{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}},Du=class{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(Ke.UNAUTHENTICATED)))}shutdown(){}},KB=class{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable((()=>t(this.token.user)))}shutdown(){this.changeListener=null}},Iu=class{constructor(e){this.kt=e,this.currentUser=Ke.UNAUTHENTICATED,this.Qt=0,this.forceRefresh=!1,this.auth=null}start(e,t){$(this.qt===void 0,42304);let n=this.Qt,s=c=>this.Qt!==n?(n=this.Qt,t(c)):Promise.resolve(),i=new Lt;this.qt=()=>{this.Qt++,this.currentUser=this.Kt(),i.resolve(),i=new Lt,e.enqueueRetryable((()=>s(this.currentUser)))};let a=()=>{let c=i;e.enqueueRetryable((async()=>{await c.promise,await s(this.currentUser)}))},u=c=>{K("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=c,this.qt&&(this.auth.addAuthTokenListener(this.qt),a())};this.kt.onInit((c=>u(c))),setTimeout((()=>{if(!this.auth){let c=this.kt.getImmediate({optional:!0});c?u(c):(K("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new Lt)}}),0),a()}getToken(){let e=this.Qt,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((n=>this.Qt!==e?(K("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?($(typeof n.accessToken=="string",31837,{Wt:n}),new wu(n.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.qt&&this.auth.removeAuthTokenListener(this.qt),this.qt=void 0}Kt(){let e=this.auth&&this.auth.getUid();return $(e===null||typeof e=="string",2055,{Gt:e}),new Ke(e)}},JB=class{constructor(e,t,n){this.jt=e,this.zt=t,this.Ht=n,this.type="FirstParty",this.user=Ke.FIRST_PARTY,this.Jt=new Map}Yt(){return this.Ht?this.Ht():null}get headers(){this.Jt.set("X-Goog-AuthUser",this.jt);let e=this.Yt();return e&&this.Jt.set("Authorization",e),this.zt&&this.Jt.set("X-Goog-Iam-Authorization-Token",this.zt),this.Jt}},zB=class{constructor(e,t,n){this.jt=e,this.zt=t,this.Ht=n}getToken(){return Promise.resolve(new JB(this.jt,this.zt,this.Ht))}start(e,t){e.enqueueRetryable((()=>t(Ke.FIRST_PARTY)))}shutdown(){}invalidateToken(){}},Tu=class{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}},Au=class{constructor(e,t){this.Zt=t,this.forceRefresh=!1,this.appCheck=null,this.Xt=null,this.en=null,Ct(e)&&e.settings.appCheckToken&&(this.en=e.settings.appCheckToken)}start(e,t){$(this.qt===void 0,3512);let n=i=>{i.error!=null&&K("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);let a=i.token!==this.Xt;return this.Xt=i.token,K("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?t(i.token):Promise.resolve()};this.qt=i=>{e.enqueueRetryable((()=>n(i)))};let s=i=>{K("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.qt&&this.appCheck.addTokenListener(this.qt)};this.Zt.onInit((i=>s(i))),setTimeout((()=>{if(!this.appCheck){let i=this.Zt.getImmediate({optional:!0});i?s(i):K("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.en)return Promise.resolve(new Tu(this.en));let e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?($(typeof t.token=="string",44558,{tokenResult:t}),this.Xt=t.token,new Tu(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.qt&&this.appCheck.removeTokenListener(this.qt),this.qt=void 0}};function JE(r){let e={};return r.timeoutSeconds!==void 0&&(e.timeoutSeconds=r.timeoutSeconds),e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var WB=class{tn(e){}shutdown(){}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Vm="ConnectivityMonitor",bu=class{constructor(){this.nn=()=>this.rn(),this.sn=()=>this._n(),this.an=[],this.un()}tn(e){this.an.push(e)}shutdown(){window.removeEventListener("online",this.nn),window.removeEventListener("offline",this.sn)}un(){window.addEventListener("online",this.nn),window.addEventListener("offline",this.sn)}rn(){K(Vm,"Network connectivity changed: AVAILABLE");for(let e of this.an)e(0)}_n(){K(Vm,"Network connectivity changed: UNAVAILABLE");for(let e of this.an)e(1)}static cn(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var tu=null;function QB(){return tu===null?tu=(function(){return 268435456+Math.round(2147483648*Math.random())})():tu++,"0x"+tu.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var dB="RestConnection",m0={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"},$B=class{get En(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;let t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.hn=t+"://"+e.host,this.Tn=`projects/${n}/databases/${s}`,this.Pn=this.databaseId.database===hu?`project_id=${n}`:`project_id=${n}&database_id=${s}`}In(e,t,n,s,i){let a=QB(),u=this.Rn(e,t.toUriEncodedString());K(dB,`Sending RPC '${e}' ${a}:`,u,n);let c={"google-cloud-resource-prefix":this.Tn,"x-goog-request-params":this.Pn};this.An(c,s,i);let{host:l}=new URL(u),h=ur(l);return this.Vn(e,u,c,n,h).then((d=>(K(dB,`Received RPC '${e}' ${a}: `,d),d)),(d=>{throw bt(dB,`RPC '${e}' ${a} failed with error: `,d,"url: ",u,"request:",n),d}))}dn(e,t,n,s,i,a){return this.In(e,t,n,s,i)}An(e,t,n){if(e["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+Qs})(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach(((s,i)=>e[i]=s)),n&&n.headers.forEach(((s,i)=>e[i]=s)),this.databaseInfo._customHeaders)for(let s of Object.keys(this.databaseInfo._customHeaders))e[s]=this.databaseInfo._customHeaders[s]}Rn(e,t){let n=m0[e],s=`${this.hn}/v1/${t}:${n}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var YB=class{constructor(e){this.fn=e.fn,this.mn=e.mn}pn(e){this.gn=e}yn(e){this.wn=e}bn(e){this.Sn=e}onMessage(e){this.xn=e}close(){this.mn()}send(e){this.fn(e)}vn(){this.gn()}Dn(){this.wn()}Cn(e){this.Sn(e)}Fn(e){this.xn(e)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var et="WebChannelConnection",zi=(r,e,t)=>{r.listen(e,(n=>{try{t(n)}catch(s){setTimeout((()=>{throw s}),0)}}))},vu=class r extends $B{constructor(e){super(e),this.On=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}static Mn(){if(!r.Nn){let e=Xl();zi(e,Yl.STAT_EVENT,(t=>{t.stat===qo.PROXY?K(et,"STAT_EVENT: detected buffering proxy"):t.stat===qo.NOPROXY&&K(et,"STAT_EVENT: detected no buffering proxy")})),r.Nn=!0}}Vn(e,t,n,s,i){let a=QB();return new Promise(((u,c)=>{let l=new Ql;l.setWithCredentials(!0),l.listenOnce($l.COMPLETE,(()=>{try{switch(l.getLastErrorCode()){case Gi.NO_ERROR:let d=l.getResponseJson();K(et,`XHR for RPC '${e}' ${a} received:`,JSON.stringify(d)),u(d);break;case Gi.TIMEOUT:K(et,`RPC '${e}' ${a} timed out`),c(new q(V.DEADLINE_EXCEEDED,"Request time out"));break;case Gi.HTTP_ERROR:let p=l.getStatus();if(K(et,`RPC '${e}' ${a} failed with status:`,p,"response text:",l.getResponseText()),p>0){let E=l.getResponseJson();Array.isArray(E)&&(E=E[0]);let y=E==null?void 0:E.error;if(y&&y.status&&y.message){let S=(function(U){let z=U.toLowerCase().replace(/_/g,"-");return Object.values(V).indexOf(z)>=0?z:V.UNKNOWN})(y.status);c(new q(S,y.message))}else c(new q(V.UNKNOWN,"Server responded with status "+l.getStatus()))}else c(new q(V.UNAVAILABLE,"Connection failed."));break;default:Y(9055,{Bn:e,streamId:a,Ln:l.getLastErrorCode(),$n:l.getLastError()})}}finally{K(et,`RPC '${e}' ${a} completed.`)}}));let h=JSON.stringify(s);K(et,`RPC '${e}' ${a} sending request:`,s),l.send(t,"POST",h,n,15)}))}Un(e,t,n){let s=QB(),i=[this.hn,"/","google.firestore.v1.Firestore","/",e,"/channel"],a=this.createWebChannelTransport(),u={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},c=this.longPollingOptions.timeoutSeconds;c!==void 0&&(u.longPollingTimeout=Math.round(1e3*c)),this.useFetchStreams&&(u.useFetchStreams=!0),this.An(u.initMessageHeaders,t,n),u.encodeInitMessageHeaders=!0;let l=i.join("");K(et,`Creating RPC '${e}' stream ${s}: ${l}`,u);let h=a.createWebChannel(l,u);this.kn(h);let d=!1,p=!1,E=new YB({fn:y=>{p?K(et,`Not sending because RPC '${e}' stream ${s} is closed:`,y):(d||(K(et,`Opening RPC '${e}' stream ${s} transport.`),h.open(),d=!0),K(et,`RPC '${e}' stream ${s} sending:`,y),h.send(y))},mn:()=>h.close()});return zi(h,is.EventType.OPEN,(()=>{p||(K(et,`RPC '${e}' stream ${s} transport opened.`),E.vn())})),zi(h,is.EventType.CLOSE,(()=>{p||(p=!0,K(et,`RPC '${e}' stream ${s} transport closed`),E.Cn(),this.Qn(h))})),zi(h,is.EventType.ERROR,(y=>{p||(p=!0,bt(et,`RPC '${e}' stream ${s} transport errored. Name:`,y.name,"Message:",y.message),E.Cn(new q(V.UNAVAILABLE,"The operation could not be completed")))})),zi(h,is.EventType.MESSAGE,(y=>{var S;if(!p){let F=y.data[0];$(!!F,16349);let U=F,z=(U==null?void 0:U.error)||((S=U[0])==null?void 0:S.error);if(z){K(et,`RPC '${e}' stream ${s} received error:`,z);let re=z.status,me=(function(A){let _=Pe[A];if(_!==void 0)return xE(_)})(re),ye=z.message;re==="NOT_FOUND"&&ye.includes("database")&&ye.includes("does not exist")&&ye.includes(this.databaseId.database)&&bt(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),me===void 0&&(me=V.INTERNAL,ye="Unknown error status: "+re+" with message "+z.message),p=!0,E.Cn(new q(me,ye)),h.close()}else K(et,`RPC '${e}' stream ${s} received:`,F),E.Fn(F)}})),r.Mn(),setTimeout((()=>{E.Dn()}),0),E}terminate(){this.On.forEach((e=>e.close())),this.On=[]}kn(e){this.On.push(e)}Qn(e){this.On=this.On.filter((t=>t===e))}An(e,t,n){super.An(e,t,n),this.databaseInfo.apiKey&&(e["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return Zl()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function E0(r){return new vu(r)}vu.Nn=!1;var Ru=class{constructor(e,t,n=1e3,s=1.5,i=6e4){this.qn=e,this.timerId=t,this.Kn=n,this.Wn=s,this.Gn=i,this.jn=0,this.zn=null,this.Hn=Date.now(),this.reset()}reset(){this.jn=0}Jn(){this.jn=this.Gn}Yn(e){this.cancel();let t=Math.floor(this.jn+this.Zn()),n=Math.max(0,Date.now()-this.Hn),s=Math.max(0,t-n);s>0&&K("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.jn} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.zn=this.qn.enqueueAfterDelay(this.timerId,s,(()=>(this.Hn=Date.now(),e()))),this.jn*=this.Wn,this.jn<this.Kn&&(this.jn=this.Kn),this.jn>this.Gn&&(this.jn=this.Gn)}Xn(){this.zn!==null&&(this.zn.skipDelay(),this.zn=null)}cancel(){this.zn!==null&&(this.zn.cancel(),this.zn=null)}Zn(){return(Math.random()-.5)*this.jn}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Mm="PersistentStream",Su=class{constructor(e,t,n,s,i,a,u,c){this.qn=e,this.er=n,this.tr=s,this.connection=i,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=u,this.listener=c,this.state=0,this.nr=0,this.rr=null,this.ir=null,this.stream=null,this.sr=0,this._r=new Ru(e,t)}ar(){return this.state===1||this.state===5||this.ur()}ur(){return this.state===2||this.state===3}start(){this.sr=0,this.state!==4?this.auth():this.cr()}async stop(){this.ar()&&await this.close(0)}lr(){this.state=0,this._r.reset()}Er(){this.ur()&&this.rr===null&&(this.rr=this.qn.enqueueAfterDelay(this.er,6e4,(()=>this.hr())))}Tr(e){this.Pr(),this.stream.send(e)}async hr(){if(this.ur())return this.close(0)}Pr(){this.rr&&(this.rr.cancel(),this.rr=null)}Ir(){this.ir&&(this.ir.cancel(),this.ir=null)}async close(e,t){this.Pr(),this.Ir(),this._r.cancel(),this.nr++,e!==4?this._r.reset():t&&t.code===V.RESOURCE_EXHAUSTED?(mn(t.toString()),mn("Using maximum backoff delay to prevent overloading the backend."),this._r.Jn()):t&&t.code===V.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.Rr(),this.stream.close(),this.stream=null),this.state=e,await this.listener.bn(t)}Rr(){}auth(){this.state=1;let e=this.Ar(this.nr),t=this.nr;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([n,s])=>{this.nr===t&&this.Vr(n,s)}),(n=>{e((()=>{let s=new q(V.UNKNOWN,"Fetching auth token failed: "+n.message);return this.dr(s)}))}))}Vr(e,t){let n=this.Ar(this.nr);this.stream=this.mr(e,t),this.stream.pn((()=>{n((()=>this.listener.pn()))})),this.stream.yn((()=>{n((()=>(this.state=2,this.ir=this.qn.enqueueAfterDelay(this.tr,1e4,(()=>(this.ur()&&(this.state=3),Promise.resolve()))),this.listener.yn())))})),this.stream.bn((s=>{n((()=>this.dr(s)))})),this.stream.onMessage((s=>{n((()=>++this.sr==1?this.pr(s):this.onNext(s)))}))}cr(){this.state=5,this._r.Yn((async()=>{this.state=0,this.start()}))}dr(e){return K(Mm,`close with error: ${e}`),this.stream=null,this.close(4,e)}Ar(e){return t=>{this.qn.enqueueAndForget((()=>this.nr===e?t():(K(Mm,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}},XB=class extends Su{constructor(e,t,n,s,i,a){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,s,a),this.serializer=i}mr(e,t){return this.connection.Un("Listen",e,t)}pr(e){return this.onNext(e)}onNext(e){this._r.reset();let t=a0(this.serializer,e),n=(function(i){if(!("targetChange"in i))return te.min();let a=i.targetChange;return a.targetIds&&a.targetIds.length?te.min():a.readTime?Xt(a.readTime):te.min()})(e);return this.listener.gr(t,n)}yr(e){let t={};t.database=jB(this.serializer),t.addTarget=(function(i,a){let u,c=a.target;if(u=Dr(c)?{pipelineQuery:f0(i,c)}:OE(c)?{documents:c0(i,c)}:{query:l0(i,c).Lt},u.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){u.resumeToken=HB(i,a.resumeToken);let l=UB(i,a.expectedCount);l!==null&&(u.expectedCount=l)}else if(a.snapshotVersion.compareTo(te.min())>0){u.readTime=Zi(i,a.snapshotVersion.toTimestamp());let l=UB(i,a.expectedCount);l!==null&&(u.expectedCount=l)}return u})(this.serializer,e);let n=h0(this.serializer,e);n&&(t.labels=n),this.Tr(t)}wr(e){let t={};t.database=jB(this.serializer),t.removeTarget=e,this.Tr(t)}},ZB=class extends Su{constructor(e,t,n,s,i,a){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,s,a),this.serializer=i}get br(){return this.sr>0}start(){this.lastStreamToken=void 0,super.start()}Rr(){this.br&&this.Sr([])}mr(e,t){return this.connection.Un("Write",e,t)}pr(e){return $(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,$(!e.writeResults||e.writeResults.length===0,55816),this.listener.vr()}onNext(e){$(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this._r.reset();let t=u0(e.writeResults,e.commitTime),n=Xt(e.commitTime);return this.listener.Dr(n,t)}Cr(){let e={};e.database=jB(this.serializer),this.Tr(e)}Sr(e){let t={streamToken:this.lastStreamToken,writes:e.map((n=>o0(this.serializer,n)))};this.Tr(t)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var eh=class{},th=class extends eh{constructor(e,t,n,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=s,this.Fr=!1}Or(){if(this.Fr)throw new q(V.FAILED_PRECONDITION,"The client has already been terminated.")}In(e,t,n,s){return this.Or(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,a])=>this.connection.In(e,qB(t,n),s,i,a))).catch((i=>{throw i.name==="FirebaseError"?(i.code===V.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new q(V.UNKNOWN,i.toString())}))}dn(e,t,n,s,i){return this.Or(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([a,u])=>this.connection.dn(e,qB(t,n),s,a,u,i))).catch((a=>{throw a.name==="FirebaseError"?(a.code===V.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new q(V.UNKNOWN,a.toString())}))}terminate(){this.Fr=!0,this.connection.terminate()}};function _0(r,e,t,n){return new th(r,e,t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var y0="ComponentProvider",Gm=new Map;function w0(r,e,t,n,s){return new EB(r,e,t,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,JE(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,n,s._customHeaders,s.grpcFlowControlWindow)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Um={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},zE=41943040,Tt=class r{static withCacheSize(e){return new r(e,r.DEFAULT_COLLECTION_PERCENTILE,r.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}};Tt.DEFAULT_COLLECTION_PERCENTILE=10,Tt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Tt.DEFAULT=new Tt(zE,Tt.DEFAULT_COLLECTION_PERCENTILE,Tt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Tt.DISABLED=new Tt(-1,0,0);/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Vs=class{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=n=>this.Mr(n),this.Nr=n=>t.writeSequenceNumber(n))}Mr(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){let e=++this.previousValue;return this.Nr&&this.Nr(e),e}};Vs.Br=-1;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var D0="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.",nh=class{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((e=>e()))}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function $s(r){if(r.code!==V.FAILED_PRECONDITION||r.message!==D0)throw r;K("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var M=class r{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e((t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)}),(t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)}))}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&Y(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new r(((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(n,s)}}))}toPromise(){return new Promise(((e,t)=>{this.next(e,t)}))}wrapUserFunction(e){try{let t=e();return t instanceof r?t:r.resolve(t)}catch(t){return r.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction((()=>e(t))):r.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction((()=>e(t))):r.reject(t)}static resolve(e){return new r(((t,n)=>{t(e)}))}static reject(e){return new r(((t,n)=>{n(e)}))}static waitFor(e){return new r(((t,n)=>{let s=0,i=0,a=!1;e.forEach((u=>{++s,u.next((()=>{++i,a&&i===s&&t()}),(c=>n(c)))})),a=!0,i===s&&t()}))}static or(e){let t=r.resolve(!1);for(let n of e)t=t.next((s=>s?r.resolve(s):n()));return t}static forEach(e,t){let n=[];return e.forEach(((s,i)=>{n.push(t.call(this,s,i))})),this.waitFor(n)}static mapArray(e,t){return new r(((n,s)=>{let i=e.length,a=new Array(i),u=0;for(let c=0;c<i;c++){let l=c;t(e[l]).next((h=>{a[l]=h,++u,u===i&&n(a)}),(h=>s(h)))}}))}static doWhile(e,t){return new r(((n,s)=>{let i=()=>{e()===!0?t().next((()=>{i()}),s):n()};i()}))}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function I0(r){let e=r.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}function Ys(r){return r.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Hm="LruGarbageCollector",T0=1048576;function qm([r,e],[t,n]){let s=ae(r,t);return s===0?ae(e,n):s}var rh=class{constructor(e){this.ai=e,this.buffer=new ke(qm),this.ui=0}ci(){return++this.ui}li(e){let t=[e,this.ci()];if(this.buffer.size<this.ai)this.buffer=this.buffer.add(t);else{let n=this.buffer.last();qm(t,n)<0&&(this.buffer=this.buffer.delete(n).add(t))}}get maxValue(){return this.buffer.last()[0]}},sh=class{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.Ei=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.hi(6e4)}stop(){this.Ei&&(this.Ei.cancel(),this.Ei=null)}get started(){return this.Ei!==null}hi(e){K(Hm,`Garbage collection scheduled in ${e}ms`),this.Ei=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,(async()=>{this.Ei=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){Ys(t)?K(Hm,"Ignoring IndexedDB error during garbage collection: ",t):await $s(t)}await this.hi(3e5)}))}},ih=class{constructor(e,t){this.Ti=e,this.params=t}calculateTargetCount(e,t){return this.Ti.Pi(e).next((n=>Math.floor(t/100*n)))}nthSequenceNumber(e,t){if(t===0)return M.resolve(Vs.Br);let n=new rh(t);return this.Ti.forEachTarget(e,(s=>n.li(s.sequenceNumber))).next((()=>this.Ti.Ii(e,(s=>n.li(s))))).next((()=>n.maxValue))}removeTargets(e,t,n){return this.Ti.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.Ti.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(K("LruGarbageCollector","Garbage collection skipped; disabled"),M.resolve(Um)):this.getCacheSize(e).next((n=>n<this.params.cacheSizeCollectionThreshold?(K("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Um):this.Ri(e,t)))}getCacheSize(e){return this.Ti.getCacheSize(e)}Ri(e,t){let n,s,i,a,u,c,l,h=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next((d=>(d>this.params.maximumSequenceNumbersToCollect?(K("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${d}`),s=this.params.maximumSequenceNumbersToCollect):s=d,a=Date.now(),this.nthSequenceNumber(e,s)))).next((d=>(n=d,u=Date.now(),this.removeTargets(e,n,t)))).next((d=>(i=d,c=Date.now(),this.removeOrphanedDocuments(e,n)))).next((d=>(l=Date.now(),ls()<=oe.DEBUG&&K("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${a-h}ms
	Determined least recently used ${s} in `+(u-a)+`ms
	Removed ${i} targets in `+(c-u)+`ms
	Removed ${d} documents in `+(l-c)+`ms
Total Duration: ${l-h}ms`),M.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:d}))))}};function A0(r,e){return new ih(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var WE="firestore.googleapis.com",jm=!0,Pu=class{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new q(V.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=WE,this.ssl=jm}else this.host=e.host,this.ssl=e.ssl??jm;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e._customHeaders&&(this._customHeaders={...e._customHeaders}),e.cacheSizeBytes===void 0)this.cacheSizeBytes=zE;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<T0)throw new q(V.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}if(aE("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=JE(e.experimentalLongPollingOptions??{}),(function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new q(V.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new q(V.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new q(V.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams,e.grpcFlowControlWindow!==void 0){if(typeof e.grpcFlowControlWindow!="number"||e.grpcFlowControlWindow<=0||e.grpcFlowControlWindow>2147483647||!Number.isInteger(e.grpcFlowControlWindow))throw new q(V.INVALID_ARGUMENT,"grpcFlowControlWindow must be a positive integer and cannot exceed 2147483647");this.grpcFlowControlWindow=e.grpcFlowControlWindow}}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(n,s){return n.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams&&this.grpcFlowControlWindow===e.grpcFlowControlWindow&&(function(n,s){if(n===s)return!0;if(!n||!s)return!1;let i=Object.keys(n),a=Object.keys(s);if(i.length!==a.length)return!1;for(let u of i)if(n[u]!==s[u])return!1;return!0})(this._customHeaders,e._customHeaders)}},hc=class{constructor(e,t,n,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Pu({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new q(V.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new q(V.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Pu(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(n){if(!n)return new Du;switch(n.type){case"firstParty":return new zB(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new q(V.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){let n=Gm.get(t);n&&(K(y0,"Removing Datastore"),Gm.delete(t),n.terminate())})(this),Promise.resolve()}};function QE(r,e,t,n={}){var l;r=yt(r,hc);let s=ur(e),i=r._getSettings(),a={...i,emulatorOptions:r._getEmulatorOptions()},u=`${e}:${t}`;s&&no(`https://${u}`),i.host!==WE&&i.host!==u&&bt("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");let c={...i,host:u,ssl:s,emulatorOptions:n};if(!Pt(c,a)&&(r._setSettings(c),n.mockUserToken)){let h,d;if(typeof n.mockUserToken=="string")h=n.mockUserToken,d=Ke.MOCK_USER;else{h=Xp(n.mockUserToken,(l=r._app)==null?void 0:l.options.projectId);let p=n.mockUserToken.sub||n.mockUserToken.user_id;if(!p)throw new q(V.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");d=new Ke(p)}r._authCredentials=new KB(new wu(h,d))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var jn=class r{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new r(this.firestore,e,this._query)}},Se=class r{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Cn(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new r(this.firestore,e,this._key)}toJSON(){return{type:r._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(Sa(t,r._jsonSchema))return new r(e,n||null,new X(he.fromString(t.referencePath)))}};Se._jsonSchemaVersion="firestore/documentReference/1.0",Se._jsonSchema={type:Re("string",Se._jsonSchemaVersion),referencePath:Re("string")};var Cn=class r extends jn{constructor(e,t,n){super(e,t,Oa(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){let e=this._path.popLast();return e.isEmpty()?null:new Se(this.firestore,null,new X(e))}withConverter(e){return new r(this.firestore,e,this._path)}};function wd(r,e,...t){if(r=we(r),iE("collection","path",e),r instanceof hc){let n=he.fromString(e,...t);return gm(n),new Cn(r,null,n)}{if(!(r instanceof Se||r instanceof Cn))throw new q(V.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");let n=r._path.child(he.fromString(e,...t));return gm(n),new Cn(r.firestore,null,n)}}function Dd(r,e,...t){if(r=we(r),arguments.length===1&&(e=_s.newId()),iE("doc","path",e),r instanceof hc){let n=he.fromString(e,...t);return Cm(n),new Se(r,null,new X(n))}{if(!(r instanceof Se||r instanceof Cn))throw new q(V.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");let n=r._path.child(he.fromString(e,...t));return Cm(n),new Se(r.firestore,r instanceof Cn?r.converter:null,new X(n))}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ms=class{constructor(e,t){this.pattern=e,this.options=t}isEqual(e){return this.pattern===e.pattern&&this.options===e.options}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var _t=class r{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0})(this._values,e._values)}toJSON(){return{type:r._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Sa(e,r._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new r(e.vectorValues);throw new q(V.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}};_t._jsonSchemaVersion="firestore/vectorValue/1.0",_t._jsonSchema={type:Re("string",_t._jsonSchemaVersion),vectorValues:Re("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var b0=/^__.*__$/,ah=class{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return this.fieldMask!==null?new en(e,this.data,this.fieldMask,t,this.fieldTransforms):new Lr(e,this.data,t,this.fieldTransforms)}},Nu=class{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new en(e,this.data,this.fieldMask,t,this.fieldTransforms)}};function $E(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw Y(40011,{dataSource:r})}}var oh=class r{constructor(e,t,n,s,i,a){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.validatePath(),this.fieldTransforms=i||[],this.fieldMask=a||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}contextWith(e){return new r({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}childContextForField(e){var s;let t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePathSegment(e),n}childContextForFieldPath(e){var s;let t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePath(),n}childContextForArray(e){return this.contextWith({path:void 0,arrayElement:!0})}createError(e){return xu(e,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(e){return this.fieldMask.find((t=>e.isPrefixOf(t)))!==void 0||this.fieldTransforms.find((t=>e.isPrefixOf(t.field)))!==void 0}validatePath(){if(this.path)for(let e=0;e<this.path.length;e++)this.validatePathSegment(this.path.get(e))}validatePathSegment(e){if(e.length===0)throw this.createError("Document fields must not be empty");if($E(this.dataSource)&&b0.test(e))throw this.createError('Document fields cannot begin and end with "__"')}},uh=class{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||Bc(e)}createContext(e,t,n,s=!1){return new oh({dataSource:e,methodName:t,targetDoc:n,path:Bt.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}};function fc(r){let e=r._freezeSettings(),t=Bc(r._databaseId);return new uh(r._databaseId,!!e.ignoreUndefinedProperties,t)}function YE(r,e,t,n,s,i={}){let a=r.createContext(i.merge||i.mergeFields?2:0,e,t,s);Id("Data must be an object, but it was:",a,n);let u=t_(n,a),c,l;if(i.merge)c=new At(a.fieldMask),l=a.fieldTransforms;else if(i.mergeFields){let h=[];for(let d of i.mergeFields){let p=Jn(e,d,t);if(!a.contains(p))throw new q(V.INVALID_ARGUMENT,`Field '${p}' is specified in your field mask but missing from your input data.`);s_(h,p)||h.push(p)}c=new At(h),l=a.fieldTransforms.filter((d=>c.covers(d.field)))}else c=null,l=a.fieldTransforms;return new ah(new it(u),c,l)}var Ou=class r extends Hr{_toFieldTransform(e){if(e.dataSource!==2)throw e.dataSource===1?e.createError(`${this._methodName}() can only appear at the top level of your update data`):e.createError(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof r}};var ch=class r extends Hr{_toFieldTransform(e){return new TB(e.path,new Nr)}isEqual(e){return e instanceof r}};function XE(r,e,t,n){let s=r.createContext(1,e,t);Id("Data must be an object, but it was:",s,n);let i=[],a=it.empty();er(n,((c,l)=>{let h=Td(e,c,t);l=we(l);let d=s.childContextForFieldPath(h);if(l instanceof Ou)i.push(h);else{let p=Kn(l,d);p!=null&&(i.push(h),a.set(h,p))}}));let u=new At(i);return new Nu(a,u,s.fieldTransforms)}function ZE(r,e,t,n,s,i){let a=r.createContext(1,e,t),u=[Jn(e,n,t)],c=[s];if(i.length%2!=0)throw new q(V.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let p=0;p<i.length;p+=2)u.push(Jn(e,i[p])),c.push(i[p+1]);let l=[],h=it.empty();for(let p=u.length-1;p>=0;--p)if(!s_(l,u[p])){let E=u[p],y=c[p];y=we(y);let S=a.childContextForFieldPath(E);if(y instanceof Ou)l.push(E);else{let F=Kn(y,S);F!=null&&(l.push(E),h.set(E,F))}}let d=new At(l);return new Nu(h,d,a.fieldTransforms)}function e_(r,e,t,n=!1){return Kn(t,r.createContext(n?4:3,e))}function Kn(r,e,t){if(r_(r=we(r)))return Id("Unsupported field value:",e,r),t_(r,e);if(r instanceof Hr)return(function(s,i){if(!$E(i.dataSource))throw i.createError(`${s._methodName}() can only be used with update() and set()`);if(!i.path)throw i.createError(`${s._methodName}() is not currently supported inside arrays`);let a=s._toFieldTransform(i);a&&i.fieldTransforms.push(a)})(r,e),null;if(r===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),r instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.createError("Nested arrays are not supported");return(function(s,i){let a=[],u=0;for(let c of s){let l=Kn(c,i.childContextForArray(u));l==null&&(l={nullValue:"NULL_VALUE"}),a.push(l),u++}return{arrayValue:{values:a}}})(r,e)}return(function(s,i,a){if((s=we(s))===null)return{nullValue:"NULL_VALUE"};if(typeof s=="number")return uc(i.serializer,s);if(typeof s=="boolean")return{booleanValue:s};if(typeof s=="string")return{stringValue:s};if(s instanceof Date){let u=Ie.fromDate(s);return{timestampValue:Zi(i.serializer,u)}}if(s instanceof Ie){let u=new Ie(s.seconds,1e3*Math.floor(s.nanoseconds/1e3));return{timestampValue:Zi(i.serializer,u)}}if(n_(s)){let u=Ie.fromInstant(s),c=new Ie(u.seconds,1e3*Math.floor(u.nanoseconds/1e3));return{timestampValue:Zi(i.serializer,c)}}if(s instanceof pn)return{geoPointValue:{latitude:s.latitude,longitude:s.longitude}};if(s instanceof Zt)return s.subtype===0?{bytesValue:HB(i.serializer,s._byteString)}:(function(c,l){let h=l.toUint8Array(),d=new Uint8Array(h.length+1);return d[0]=l.subtype,d.set(h,1),{mapValue:{fields:{[As]:{bytesValue:HB(c,De.fromUint8Array(d))}}}}})(i.serializer,s);if(s instanceof Se){let u=i.databaseId,c=s.firestore._databaseId;if(!c.isEqual(u))throw i.createError(`Document reference is for database ${c.projectId}/${c.database} but should be for database ${u.projectId}/${u.database}`);return{referenceValue:yd(s.firestore._databaseId||i.databaseId,s._key.path)}}if(s instanceof _t)return(function(c,l){let h=c instanceof _t?c.toArray():c;return{mapValue:{fields:{[ac]:{stringValue:oc},[Sr]:{arrayValue:{values:h.map((p=>{if(typeof p!="number")throw l.createError("VectorValues must only contain numeric values.");return gd(l.serializer,p)}))}}}}}})(s,i);if(s instanceof Ms)return(function(c){return{mapValue:{fields:{[zt]:{mapValue:{fields:{[Is]:{stringValue:c.pattern},[Ts]:{stringValue:c.options}}}}}}}})(s);if(s instanceof xs)return(function(c){return{mapValue:{fields:{[Pr]:{stringValue:c.value}}}}})(s);if(s instanceof ks)return(function(c){return{mapValue:{fields:{[tr]:gs(c.value)}}}})(s);if(s instanceof Ls)return(function(c){return{mapValue:{fields:{[_n]:{stringValue:c.stringValue}}}}})(s);if(s instanceof Fs)return(function(c){return{mapValue:{fields:{[fn]:{mapValue:{fields:{[ra]:gs(c.seconds),[sa]:gs(c.increment)}}}}}}})(s);if(s instanceof jr)return(function(){return{mapValue:{fields:{[dd]:{nullValue:"NULL_VALUE"}}}}})();if(s instanceof qr)return(function(){return{mapValue:{fields:{[Na]:{nullValue:"NULL_VALUE"}}}}})();if(jE(s))return s._toProto(i.serializer);throw i.createError(`Unsupported field value: ${Ra(s)}`)})(r,e)}function t_(r,e){let t={};return sE(r)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):er(r,((n,s)=>{let i=Kn(s,e.childContextForField(n));i!=null&&(t[n]=i)})),{mapValue:{fields:t}}}function n_(r){if(typeof r!="object"||r===null)return!1;if(typeof Temporal<"u"&&typeof Temporal.Instant=="function"&&r instanceof Temporal.Instant)return!0;let e=r;return e[Symbol.toStringTag]==="Temporal.Instant"&&typeof e.t=="bigint"}function r_(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof Ie||r instanceof pn||r instanceof Zt||r instanceof Se||r instanceof Hr||r instanceof _t||r instanceof jr||r instanceof qr||r instanceof ks||r instanceof Ls||r instanceof Ms||r instanceof xs||r instanceof Fs||n_(r)||jE(r))}function Id(r,e,t){if(!r_(t)||!va(t)){let n=Ra(t);throw n==="an object"?e.createError(r+" a custom object"):e.createError(r+" "+n)}}function Jn(r,e,t){if((e=we(e))instanceof Ur)return e._internalPath;if(typeof e=="string")return Td(r,e);throw xu("Field path arguments must be of type string or ",r,!1,void 0,t)}var v0=new RegExp("[~\\*/\\[\\]]");function Td(r,e,t){if(e.search(v0)>=0)throw xu(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,t);try{return new Ur(...e.split("."))._internalPath}catch{throw xu(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,t)}}function xu(r,e,t,n,s){let i=n&&!n.isEmpty(),a=s!==void 0,u=`Function ${e}() called with invalid data`;t&&(u+=" (via `toFirestore()`)"),u+=". ";let c="";return(i||a)&&(c+=" (found",i&&(c+=` in field ${n}`),a&&(c+=` in document ${s}`),c+=")"),new q(V.INVALID_ARGUMENT,u+r+c)}function s_(r,e){return r.some((t=>t.isEqual(e)))}function i_(r){return typeof r._readUserData=="function"}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var tt=class r{constructor(e){this.optionDefinitions=e}_getKnownOptions(e,t){let n=it.empty();for(let s in this.optionDefinitions)if(this.optionDefinitions.hasOwnProperty(s)){let i=this.optionDefinitions[s];if(s in e){let a=e[s],u;i.nestedOptions&&va(a)?u={mapValue:{fields:new r(i.nestedOptions).getOptionsProto(t,a)}}:a&&(u=Kn(a,t)??void 0),u&&n.set(Bt.fromServerFormat(i.serverName),u)}}return n}getOptionsProto(e,t,n){let s=this._getKnownOptions(t,e);if(n){let i=new Map(rE(n,((a,u)=>[Bt.fromServerFormat(u),a!==void 0?Kn(a,e):null])));s.setAll(i)}return s.value.mapValue.fields??{}}};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function R0(r){return typeof r=="object"&&r!==null&&!!("nullValue"in r&&(r.nullValue===null||r.nullValue==="NULL_VALUE")||"booleanValue"in r&&(r.booleanValue===null||typeof r.booleanValue=="boolean")||"integerValue"in r&&(r.integerValue===null||typeof r.integerValue=="number"||typeof r.integerValue=="string")||"doubleValue"in r&&(r.doubleValue===null||typeof r.doubleValue=="number")||"timestampValue"in r&&(r.timestampValue===null||(function(t){return typeof t=="object"&&t!==null&&"seconds"in t&&(t.seconds===null||typeof t.seconds=="number"||typeof t.seconds=="string")&&"nanos"in t&&(t.nanos===null||typeof t.nanos=="number")})(r.timestampValue))||"stringValue"in r&&(r.stringValue===null||typeof r.stringValue=="string")||"bytesValue"in r&&(r.bytesValue===null||r.bytesValue instanceof Uint8Array)||"referenceValue"in r&&(r.referenceValue===null||typeof r.referenceValue=="string")||"geoPointValue"in r&&(r.geoPointValue===null||(function(t){return typeof t=="object"&&t!==null&&"latitude"in t&&(t.latitude===null||typeof t.latitude=="number")&&"longitude"in t&&(t.longitude===null||typeof t.longitude=="number")})(r.geoPointValue))||"arrayValue"in r&&(r.arrayValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("values"in t)||t.values!==null&&!Array.isArray(t.values))})(r.arrayValue))||"mapValue"in r&&(r.mapValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("fields"in t)||t.fields!==null&&!va(t.fields))})(r.mapValue))||"fieldReferenceValue"in r&&(r.fieldReferenceValue===null||typeof r.fieldReferenceValue=="string")||"functionValue"in r&&(r.functionValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("name"in t)||t.name!==null&&typeof t.name!="string"||!("args"in t)||t.args!==null&&!Array.isArray(t.args))})(r.functionValue))||"pipelineValue"in r&&(r.pipelineValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("stages"in t)||t.stages!==null&&!Array.isArray(t.stages))})(r.pipelineValue)))}function Ad(){return new ch("serverTimestamp")}function a_(r){return new _t(r)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function G(r){let e;return r instanceof tn?r:(e=va(r)?P0(r):r instanceof Array?N0(r):o_(r,void 0),e)}function pB(r){if(r instanceof tn)return r;if(r instanceof _t)return da(r);if(Array.isArray(r))return da(a_(r));throw new Error("Unsupported value: "+typeof r)}function dc(r){return yB(r)?uu(r):G(r)}var tn=class{constructor(){this._protoValueType="ProtoValue"}add(e){return new x("add",[this,G(e)],"add")}asBoolean(){if(this instanceof Wn)return this;if(this instanceof Gs)return new Lu(this);if(this instanceof zn)return new hh(this);if(this instanceof x)return new Fu(this);throw new q("invalid-argument",`Conversion of type ${typeof this} to BooleanExpression not supported.`)}subtract(e){return new x("subtract",[this,G(e)],"subtract")}multiply(e){return new x("multiply",[this,G(e)],"multiply")}divide(e){return new x("divide",[this,G(e)],"divide")}mod(e){return new x("mod",[this,G(e)],"mod")}equal(e){return new x("equal",[this,G(e)],"equal").asBoolean()}notEqual(e){return new x("not_equal",[this,G(e)],"notEqual").asBoolean()}lessThan(e){return new x("less_than",[this,G(e)],"lessThan").asBoolean()}lessThanOrEqual(e){return new x("less_than_or_equal",[this,G(e)],"lessThanOrEqual").asBoolean()}greaterThan(e){return new x("greater_than",[this,G(e)],"greaterThan").asBoolean()}greaterThanOrEqual(e){return new x("greater_than_or_equal",[this,G(e)],"greaterThanOrEqual").asBoolean()}arrayConcat(e,...t){let n=[e,...t].map((s=>G(s)));return new x("array_concat",[this,...n],"arrayConcat")}arrayContains(e){return new x("array_contains",[this,G(e)],"arrayContains").asBoolean()}arrayContainsAll(e){let t=Array.isArray(e)?new Tr(e.map(G),"arrayContainsAll"):e;return new x("array_contains_all",[this,t],"arrayContainsAll").asBoolean()}arrayContainsAny(e){let t=Array.isArray(e)?new Tr(e.map(G),"arrayContainsAny"):e;return new x("array_contains_any",[this,t],"arrayContainsAny").asBoolean()}arrayReverse(){return new x("array_reverse",[this])}arrayLength(){return new x("array_length",[this],"arrayLength")}equalAny(e){let t=Array.isArray(e)?new Tr(e.map(G),"equalAny"):e;return new x("equal_any",[this,t],"equalAny").asBoolean()}notEqualAny(e){let t=Array.isArray(e)?new Tr(e.map(G),"notEqualAny"):e;return new x("not_equal_any",[this,t],"notEqualAny").asBoolean()}exists(){return new x("exists",[this],"exists").asBoolean()}charLength(){return new x("char_length",[this],"charLength")}like(e){return new x("like",[this,G(e)],"like").asBoolean()}regexContains(e){return new x("regex_contains",[this,G(e)],"regexContains").asBoolean()}regexFind(e){return new x("regex_find",[this,G(e)],"regexFind")}regexFindAll(e){return new x("regex_find_all",[this,G(e)],"regexFindAll")}regexMatch(e){return new x("regex_match",[this,G(e)],"regexMatch").asBoolean()}stringContains(e){return new x("string_contains",[this,G(e)],"stringContains").asBoolean()}startsWith(e){return new x("starts_with",[this,G(e)],"startsWith").asBoolean()}endsWith(e){return new x("ends_with",[this,G(e)],"endsWith").asBoolean()}toLower(){return new x("to_lower",[this],"toLower")}toUpper(){return new x("to_upper",[this],"toUpper")}trim(e){let t=[this];return e&&t.push(G(e)),new x("trim",t,"trim")}ltrim(e){let t=[this];return e&&t.push(G(e)),new x("ltrim",t,"ltrim")}rtrim(e){let t=[this];return e&&t.push(G(e)),new x("rtrim",t,"rtrim")}type(){return new x("type",[this])}isType(e){return new x("is_type",[this,da(e)],"isType").asBoolean()}stringConcat(e,...t){let n=[e,...t].map(G);return new x("string_concat",[this,...n],"stringConcat")}stringIndexOf(e){return new x("string_index_of",[this,G(e)],"stringIndexOf")}stringRepeat(e){return new x("string_repeat",[this,G(e)],"stringRepeat")}stringReplaceAll(e,t){return new x("string_replace_all",[this,G(e),G(t)],"stringReplaceAll")}stringReplaceOne(e,t){return new x("string_replace_one",[this,G(e),G(t)],"stringReplaceOne")}concat(e,...t){let n=[e,...t].map(G);return new x("concat",[this,...n],"concat")}reverse(){return new x("reverse",[this],"reverse")}arrayFilter(e,t){return new x("array_filter",[this,G(e),t],"arrayFilter")}arrayTransform(e,t){return new x("array_transform",[this,G(e),t],"arrayTransform")}arrayTransformWithIndex(e,t,n){return new x("array_transform",[this,G(e),G(t),n],"arrayTransformWithIndex")}arraySlice(e,t){let n=[this,G(e)];return t!==void 0&&n.push(G(t)),new x("array_slice",n,"arraySlice")}arrayFirst(){return new x("array_first",[this],"arrayFirst")}arrayFirstN(e){return new x("array_first_n",[this,G(e)],"arrayFirstN")}arrayLast(){return new x("array_last",[this],"arrayLast")}arrayLastN(e){return new x("array_last_n",[this,G(e)],"arrayLastN")}arrayMaximum(){return new x("maximum",[this],"arrayMaximum")}arrayMaximumN(e){return new x("maximum_n",[this,G(e)],"arrayMaximumN")}arrayMinimum(){return new x("minimum",[this],"arrayMinimum")}arrayMinimumN(e){return new x("minimum_n",[this,G(e)],"arrayMinimumN")}arrayIndexOf(e){return new x("array_index_of",[this,G(e),G("first")],"arrayIndexOf")}arrayLastIndexOf(e){return new x("array_index_of",[this,G(e),G("last")],"arrayLastIndexOf")}arrayIndexOfAll(e){return new x("array_index_of_all",[this,G(e)],"arrayIndexOfAll")}byteLength(){return new x("byte_length",[this],"byteLength")}ceil(){return new x("ceil",[this])}floor(){return new x("floor",[this])}abs(){return new x("abs",[this])}exp(){return new x("exp",[this])}mapGet(e){return new x("map_get",[this,da(e)],"mapGet")}mapSet(e,t,...n){let s=[this,G(e),G(t),...n.map(G)];return new x("map_set",s,"mapSet")}mapKeys(){return new x("map_keys",[this],"mapKeys")}mapValues(){return new x("map_values",[this],"mapValues")}mapEntries(){return new x("map_entries",[this],"mapEntries")}getField(e){return new x("get_field",[this,G(e)],"get_field")}count(){return mt._create("count",[this],"count")}sum(){return mt._create("sum",[this],"sum")}average(){return mt._create("average",[this],"average")}minimum(){return mt._create("minimum",[this],"minimum")}maximum(){return mt._create("maximum",[this],"maximum")}first(){return mt._create("first",[this],"first")}last(){return mt._create("last",[this],"last")}arrayAgg(){return mt._create("array_agg",[this],"arrayAgg")}arrayAggDistinct(){return mt._create("array_agg_distinct",[this],"arrayAggDistinct")}countDistinct(){return mt._create("count_distinct",[this],"countDistinct")}logicalMaximum(e,...t){let n=[e,...t];return new x("maximum",[this,...n.map(G)],"logicalMaximum")}logicalMinimum(e,...t){let n=[e,...t];return new x("minimum",[this,...n.map(G)],"minimum")}vectorLength(){return new x("vector_length",[this],"vectorLength")}cosineDistance(e){return new x("cosine_distance",[this,pB(e)],"cosineDistance")}dotProduct(e){return new x("dot_product",[this,pB(e)],"dotProduct")}euclideanDistance(e){return new x("euclidean_distance",[this,pB(e)],"euclideanDistance")}unixMicrosToTimestamp(){return new x("unix_micros_to_timestamp",[this],"unixMicrosToTimestamp")}timestampToUnixMicros(){return new x("timestamp_to_unix_micros",[this],"timestampToUnixMicros")}unixMillisToTimestamp(){return new x("unix_millis_to_timestamp",[this],"unixMillisToTimestamp")}timestampToUnixMillis(){return new x("timestamp_to_unix_millis",[this],"timestampToUnixMillis")}unixSecondsToTimestamp(){return new x("unix_seconds_to_timestamp",[this],"unixSecondsToTimestamp")}timestampToUnixSeconds(){return new x("timestamp_to_unix_seconds",[this],"timestampToUnixSeconds")}timestampAdd(e,t){return new x("timestamp_add",[this,G(e),G(t)],"timestampAdd")}timestampSubtract(e,t){return new x("timestamp_subtract",[this,G(e),G(t)],"timestampSubtract")}timestampDiff(e,t){return new x("timestamp_diff",[this,dc(e),G(t)],"timestampDiff")}timestampExtract(e,t){let n=[this,G(e)];return t&&n.push(G(t)),new x("timestamp_extract",n,"timestampExtract")}documentId(){return new x("document_id",[this],"documentId")}parent(){return new x("parent",[this],"parent")}substring(e,t){let n=G(e);return new x("substring",t===void 0?[this,n]:[this,n,G(t)],"substring")}arrayGet(e){return new x("array_get",[this,G(e)],"arrayGet")}isError(){return new x("is_error",[this],"isError").asBoolean()}ifError(e){let t=new x("if_error",[this,G(e)],"ifError");return e instanceof Wn?t.asBoolean():t}isAbsent(){return new x("is_absent",[this],"isAbsent").asBoolean()}mapRemove(e){return new x("map_remove",[this,G(e)],"mapRemove")}mapMerge(e,...t){let n=G(e),s=t.map(G);return new x("map_merge",[this,n,...s],"mapMerge")}pow(e){return new x("pow",[this,G(e)])}trunc(e){return e===void 0?new x("trunc",[this]):new x("trunc",[this,G(e)],"trunc")}round(e){return e===void 0?new x("round",[this]):new x("round",[this,G(e)],"round")}collectionId(){return new x("collection_id",[this])}length(){return new x("length",[this])}ln(){return new x("ln",[this])}sqrt(){return new x("sqrt",[this])}stringReverse(){return new x("string_reverse",[this])}ifAbsent(e){return new x("if_absent",[this,G(e)],"ifAbsent")}ifNull(e){return new x("if_null",[this,G(e)],"ifNull")}coalesce(e,...t){return new x("coalesce",[this,G(e),...t.map(G)],"coalesce")}join(e){return new x("join",[this,G(e)],"join")}log10(){return new x("log10",[this])}arraySum(){return new x("sum",[this])}split(e){return new x("split",[this,G(e)])}timestampTruncate(e,t){let n=[this,G(e)];return t&&n.push(G(t)),new x("timestamp_trunc",n)}ascending(){return O0(this)}descending(){return x0(this)}as(e){return new Bh(this,e,"as")}},mt=class r{constructor(e,t){this.name=e,this.params=t,this.exprType="AggregateFunction",this._protoValueType="ProtoValue"}static _create(e,t,n){let s=new r(e,t);return s._methodName=n,s}as(e){return new lh(this,e,"as")}over(e){return new fh(this.name,this.params,new Vu(e),"over")}_toProto(e){return{functionValue:{name:this.name,args:this.params.map((t=>t._toProto(e)))}}}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach((t=>t._readUserData(e)))}},lh=class{constructor(e,t,n){this.aggregate=e,this.alias=t,this._methodName=n}_readUserData(e){this.aggregate._readUserData(e)}},Bh=class{constructor(e,t,n){this.expr=e,this.alias=t,this._methodName=n,this.exprType="AliasedExpression",this.selectable=!0}_readUserData(e){this.expr._readUserData(e)}},Tr=class extends tn{constructor(e,t){super(),this.di=e,this._methodName=t,this.expressionType="ListOfExpressions"}_toProto(e){return{arrayValue:{values:this.di.map((t=>t._toProto(e)))}}}_readUserData(e){this.di.forEach((t=>t._readUserData(e)))}},zn=class extends tn{constructor(e,t){super(),this.fieldPath=e,this._methodName=t,this.expressionType="Field",this.selectable=!0}get _fieldPath(){return this.fieldPath}get fieldName(){return this.fieldPath.canonicalString()}get alias(){return this.fieldName}get expr(){return this}geoDistance(e){return new x("geo_distance",[this,G(e)],"geoDistance")}_toProto(e){return{fieldReferenceValue:this.fieldPath.canonicalString()}}_readUserData(e){}};function uu(r){return S0(r,"field")}function S0(r,e){return new zn(typeof r=="string"?Jt===r?KE()._internalPath:Jn("field",r):r._internalPath,e)}var Gs=class r extends tn{constructor(e,t){super(),this.value=e,this._methodName=t,this.expressionType="Constant"}static _fromProto(e){let t=new r(e,void 0);return t._protoValue=e,t}_toProto(e){return $(this._protoValue!==void 0,237),this._protoValue}_getValue(){return this._protoValue}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,R0(this._protoValue)||(this._protoValue=Kn(this.value,e))}};function da(r,e){return o_(r,"constant")}function o_(r,e){let t=new Gs(r,e);return typeof r=="boolean"?new Lu(t):t}var x=class extends tn{constructor(e,t,n,s){super(),this.name=e,this.params=t,this.expressionType="Function",this._optionsProto=void 0,n!==void 0&&(this._methodName=n),s!==void 0&&(this._options=s)}get _optionsUtil(){return new tt({})}_toProto(e){let t={functionValue:{name:this.name,args:this.params.map((n=>n._toProto(e)))}};return this._optionsProto&&(t.functionValue.options=this._optionsProto),t}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach((t=>t._readUserData(e))),this._options&&(this._optionsProto=this._optionsUtil.getOptionsProto(e,this._options))}},Wn=class r extends tn{get _methodName(){return this._expr._methodName}countIf(){return mt._create("count_if",[this],"countIf")}not(){return new x("not",[this],"not").asBoolean()}conditional(e,t){return new x("conditional",[this,e,t],"conditional")}ifError(e){let t=G(e),n=new x("if_error",[this,t],"ifError");return t instanceof r?n.asBoolean():n}_toProto(e){return this._expr._toProto(e)}_readUserData(e){this._expr._readUserData(e)}},Fu=class extends Wn{constructor(e){super(),this._expr=e,this.expressionType="Function"}},Lu=class extends Wn{constructor(e){super(),this._expr=e,this.expressionType="Constant"}_getValue(){return this._expr._getValue()}},hh=class extends Wn{constructor(e){super(),this._expr=e,this.expressionType="Field"}};function P0(r,e){let t=[];for(let n in r)if(Object.prototype.hasOwnProperty.call(r,n)){let s=r[n];t.push(da(n)),t.push(G(s))}return new x("map",t,"map")}function N0(r){return(function(t,n){return new x("array",t.map((s=>G(s))),n)})(r,"array")}function O0(r){return new ku(dc(r),"ascending","ascending")}function x0(r){return new ku(dc(r),"descending","descending")}var ku=class{constructor(e,t,n){this.expr=e,this.direction=t,this._methodName=n,this._protoValueType="ProtoValue"}_toProto(e){return{mapValue:{fields:{direction:yu(this.direction),expression:this.expr._toProto(e)}}}}_readUserData(e){this.expr._readUserData(e)}};function nu(r){return r instanceof tn}var Vu=class{constructor(e){this._protoValueType="ProtoValue";let t=e.sort;this.partition=(e.partition??[]).map(dc),this.sort=t===void 0?[]:Array.isArray(t)?t:[t],this.documents=e.documents,this.range=e.range}_toProto(e){let t={};return this.partition.length>0&&(t.partition={arrayValue:{values:this.partition.map((n=>n._toProto(e)))}}),this.sort.length>0&&(t.sort={arrayValue:{values:this.sort.map((n=>n._toProto(e)))}}),this.documents!==void 0&&(t.documents=this.frameToProto(e,this.documents)),this.range!==void 0&&(t.range=this.frameToProto(e,this.range)),{mapValue:{fields:t}}}_readUserData(e){this.partition.forEach((t=>t._readUserData(e))),this.sort.forEach((t=>t._readUserData(e)));for(let t of[this.documents,this.range]){if(t===void 0)continue;nu(t.preceding)&&t.preceding._readUserData(e),nu(t.following)&&t.following._readUserData(e);let n=t.unit;n!==void 0&&nu(n)&&n._readUserData(e)}}frameToProto(e,t){let n={};t.preceding!==void 0&&(n.preceding=this.frameBoundToProto(e,t.preceding,"preceding")),t.following!==void 0&&(n.following=this.frameBoundToProto(e,t.following,"following"));let s=t.unit;return s!==void 0&&(n.unit=yB(s)?yu(s):s._toProto(e)),{mapValue:{fields:n}}}frameBoundToProto(e,t,n){if(typeof t=="number")return uc(e,t);if(yB(t))return yu(t);if(nu(t))return t._toProto(e);throw new q("invalid-argument",`Invalid window frame bound: '${n}'. Expected a number, 'current', 'unbounded', or an Expression.`)}},fh=class r{constructor(e,t=[],n,s){this.name=e,this.params=t,this.window=n,this._methodName=s,this.exprType="WindowFunction",this._protoValueType="ProtoValue"}over(e){return new r(this.name,this.params,new Vu(e),this._methodName??"over")}as(e){return new dh(this,e,"as")}_toProto(e){let t={functionValue:{name:this.name,args:this.params.map((n=>n._toProto(e)))}};return this.window===void 0?t:{functionValue:{name:"over",args:[t,this.window._toProto(e)]}}}_readUserData(e){var t;e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach((n=>n._readUserData(e))),(t=this.window)==null||t._readUserData(e)}},dh=class{constructor(e,t,n){this.windowFunction=e,this.alias=t,this._methodName=n}_readUserData(e){this.windowFunction._readUserData(e)}};/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var at=class{constructor(e){this.optionsProto=void 0,{rawOptions:this.rawOptions,...this.knownOptions}=e}_readUserData(e){this.optionsProto=this._optionsUtil.getOptionsProto(e,this.knownOptions,this.rawOptions)}_toProto(e){return{name:this._name,options:this.optionsProto}}},Mu=class extends at{get _name(){return"add_fields"}get _optionsUtil(){return new tt({})}constructor(e,t){super(t),this.fields=e}_toProto(e){return{...super._toProto(e),args:[fa(e,this.fields)]}}_readUserData(e){super._readUserData(e),Qn(this.fields,e)}};var Gu=class extends at{get _name(){return"aggregate"}get _optionsUtil(){return new tt({})}constructor(e,t,n){super(n),this.groups=e,this.accumulators=t}_toProto(e){return{...super._toProto(e),args:[fa(e,this.accumulators),fa(e,this.groups)]}}_readUserData(e){super._readUserData(e),Qn(this.groups,e),Qn(this.accumulators,e)}},Uu=class extends at{get _name(){return"distinct"}get _optionsUtil(){return new tt({})}constructor(e,t){super(t),this.groups=e}_toProto(e){return{...super._toProto(e),args:[fa(e,this.groups)]}}_readUserData(e){super._readUserData(e),Qn(this.groups,e)}},Us=class extends at{get _name(){return"collection"}get _optionsUtil(){return new tt({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.pi=F0(e)}_toProto(e){return{...super._toProto(e),args:[{referenceValue:this.pi}]}}_readUserData(e){super._readUserData(e)}},Hs=class extends at{get _name(){return"collection_group"}get _optionsUtil(){return new tt({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.collectionId=e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:""},{stringValue:this.collectionId}]}}_readUserData(e){super._readUserData(e)}};var pa=class extends at{get _name(){return"database"}get _optionsUtil(){return new tt({})}_toProto(e){return{...super._toProto(e)}}_readUserData(e){super._readUserData(e)}},Ca=class extends at{get _name(){return"documents"}get _optionsUtil(){return new tt({})}constructor(e,t){if(super(t),!e||e.length===0)throw new q(V.INVALID_ARGUMENT,"Empty document paths are not allowed in DocumentsSource");let n=e.map((i=>i.startsWith("/")?i:"/"+i)),s=new Set(n);if(s.size!==n.length)throw new q(V.INVALID_ARGUMENT,"Duplicate document paths are not allowed in DocumentsSource");this.gi=n,this.yi=s}_toProto(e){return{...super._toProto(e),args:this.gi.map((t=>({referenceValue:t})))}}_readUserData(e){super._readUserData(e)}};var qs=class extends at{get _name(){return"where"}get _optionsUtil(){return new tt({})}constructor(e,t){super(t),this.condition=e}_toProto(e){return{...super._toProto(e),args:[this.condition._toProto(e)]}}_readUserData(e){super._readUserData(e),Qn(this.condition,e)}};var Dn=class extends at{get _name(){return"limit"}get _optionsUtil(){return new tt({})}constructor(e,t){$(!isNaN(e)&&e!==1/0&&e!==-1/0,34860),super(t),this.limit=e}_toProto(e){return{...super._toProto(e),args:[uc(e,this.limit)]}}},Hu=class extends at{get _name(){return"offset"}get _optionsUtil(){return new tt({})}constructor(e,t){super(t),this.offset=e}_toProto(e){return{...super._toProto(e),args:[uc(e,this.offset)]}}},ph=class extends at{get _name(){return"select"}get _optionsUtil(){return new tt({})}constructor(e,t){super(t),this.selections=e}_toProto(e){return{...super._toProto(e),args:[fa(e,this.selections)]}}_readUserData(e){super._readUserData(e),Qn(this.selections,e)}},Ft=class extends at{get _name(){return"sort"}get _optionsUtil(){return new tt({})}constructor(e,t){super(t),this.orderings=e}_toProto(e){return{...super._toProto(e),args:this.orderings.map((t=>t._toProto(e)))}}_readUserData(e){super._readUserData(e),Qn(this.orderings,e)}};var Ch=class r extends at{get _name(){return"replace_with"}get _optionsUtil(){return new tt({})}constructor(e,t){super(t),this.map=e}_toProto(e){return{...super._toProto(e),args:[this.map._toProto(e),yu(r.bi)]}}_readUserData(e){super._readUserData(e),Qn(this.map,e)}};Ch.bi="full_replace";function F0(r){let e=typeof r=="string"?r:r.path;return e.startsWith("/")?e:"/"+e}function Qn(r,e){return i_(r)?r._readUserData(e):Array.isArray(r)?r.forEach((t=>t._readUserData(e))):r instanceof Map?r.forEach((t=>t._readUserData(e))):Object.values(r).forEach((t=>t._readUserData(e))),r}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var gh=class r{constructor(e,t,n,s){this._db=e,this.userDataReader=t,this._userDataWriter=n,this.stages=s}Ci(e,t){let n=this.userDataReader.createContext(3,e);return i_(t)?t._readUserData(n):Array.isArray(t)?t.forEach((s=>s._readUserData(n))):t.forEach((s=>s._readUserData(n))),t}where(e){let t=this.stages.map((n=>n));return this.Ci("where",e),t.push(new qs(e,{})),new r(this._db,this.userDataReader,this._userDataWriter,t)}limit(e){let t=this.stages.map((n=>n));return t.push(new Dn(e,{})),new r(this._db,this.userDataReader,this._userDataWriter,t)}sort(e,...t){let n=this.stages.map((s=>s));return"orderings"in e?n.push(new Ft(this.Ci("sort",e.orderings),{})):n.push(new Ft(this.Ci("sort",[e,...t]),{})),new r(this._db,this.userDataReader,this._userDataWriter,n)}Fi(e){return{pipeline:{stages:this.stages.map((t=>t._toProto(e)))}}}};// Copyright 2024 Google LLC* @license
var $e=class{constructor(e,t,n){this.serializer=e,this.stages=t,this.listenOptions=n,this.isCorePipeline=!0}getPipelineCollection(){return pc(this)}getPipelineCollectionGroup(){return bd(this)}getPipelineCollectionId(){return L0(this)}getPipelineDocuments(){return mh(this)}getPipelineFlavor(){return(function(t){let n="exact";return t.stages.forEach(((s,i)=>{s._name!==Uu.name&&s._name!==Gu.name||(n="keyless"),s._name===ph.name&&n==="exact"&&(n="augmented"),s._name===Mu.name&&i<t.stages.length-1&&n==="exact"&&(n="augmented")})),n})(this)}getPipelineSourceType(){return Mn(this)}};function Mn(r){let e=r.stages[0];return e instanceof Us||e instanceof Hs||e instanceof pa||e instanceof Ca?e._name:"unknown"}function pc(r){if(Mn(r)==="collection")return r.stages[0].pi}function bd(r){if(Mn(r)==="collection_group")return r.stages[0].collectionId}function L0(r){switch(Mn(r)){case"collection":return he.fromString(pc(r)).lastSegment();case"collection_group":return bd(r);default:return}}function mh(r){if(Mn(r)==="documents")return r.stages[0].gi}var b=class r{constructor(e,t){this.type=e,this.value=t}static Oi(){return new r("ERROR",void 0)}static Mi(){return new r("UNSET",void 0)}static Ni(){return new r("NULL",bs)}static newValue(e){return Et(e)?new r("NULL",bs):(function(n){return!!n&&"booleanValue"in n})(e)?new r("BOOLEAN",e):Wt(e)?new r("INT",e):Qt(e)?new r("DOUBLE",e):(function(n){return!!n&&"timestampValue"in n&&!!n.timestampValue})(e)?new r("TIMESTAMP",e):(function(n){return!!n&&"stringValue"in n})(e)?new r("STRING",e):(function(n){return!!n&&"bytesValue"in n})(e)?new r("BYTES",e):e.referenceValue?new r("REFERENCE",e):e.geoPointValue?new r("GEO_POINT",e):Rs(e)?new r("ARRAY",e):DB(e)?new r("VECTOR",e):Ar(e)?new r("MAP",e):new r("ERROR",void 0)}Bi(){return this.type==="ERROR"||this.type==="UNSET"}Li(){return this.type==="NULL"}};function ea(r){if(!r.Bi())return r.value}function u_(r){return r instanceof Wn?r._expr:r}function ee(r){if((r=u_(r))instanceof zn)return new Eh(r);if(r instanceof Gs)return new _h(r);if(r instanceof Tr)return new yh(r);if(r instanceof x){if(r.name==="add")return new wh(r);if(r.name==="subtract")return new Dh(r);if(r.name==="multiply")return new Ih(r);if(r.name==="divide")return new Th(r);if(r.name==="mod")return new Ah(r);if(r.name==="and")return new bh(r);if(r.name==="equal")return new Gh(r);if(r.name==="not_equal")return new Uh(r);if(r.name==="less_than")return new Hh(r);if(r.name==="less_than_or_equal")return new qh(r);if(r.name==="greater_than")return new jh(r);if(r.name==="greater_than_or_equal")return new Kh(r);if(r.name==="array_concat")return new Jh(r);if(r.name==="array_reverse")return new zh(r);if(r.name==="array_contains")return new Wh(r);if(r.name==="array_contains_all")return new Qh(r);if(r.name==="array_contains_any")return new $h(r);if(r.name==="array_length")return new Yh(r);if(r.name==="array_element")return new Xh(r);if(r.name==="equal_any")return new qu(r);if(r.name==="not_equal_any")return new Sh(r);if(r.name==="is_nan")return new Ph(r);if(r.name==="is_not_nan")return new Nh(r);if(r.name==="is_null")return new Oh(r);if(r.name==="is_not_null")return new xh(r);if(r.name==="is_error")return new Fh(r);if(r.name==="exists")return new Lh(r);if(r.name==="not")return new js(r);if(r.name==="or")return new vh(r);if(r.name==="xor")return new Rh(r);if(r.name==="conditional")return new kh(r);if(r.name==="maximum")return new Vh(r);if(r.name==="minimum")return new Mh(r);if(r.name==="reverse")return new Zh(r);if(r.name==="replace_first")return new ef(r);if(r.name==="replace_all")return new tf(r);if(r.name==="char_length")return new nf(r);if(r.name==="byte_length")return new rf(r);if(r.name==="like")return new sf(r);if(r.name==="regex_contains")return new af(r);if(r.name==="regex_match")return new of(r);if(r.name==="string_contains")return new uf(r);if(r.name==="starts_with")return new cf(r);if(r.name==="ends_with")return new lf(r);if(r.name==="to_lower")return new Bf(r);if(r.name==="to_upper")return new hf(r);if(r.name==="trim")return new ff(r);if(r.name==="string_concat")return new df(r);if(r.name==="map_get")return new pf(r);if(r.name==="cosine_distance")return new Cf(r);if(r.name==="dot_product")return new gf(r);if(r.name==="euclidean_distance")return new mf(r);if(r.name==="vector_length")return new Ef(r);if(r.name==="unix_micros_to_timestamp")return new _f(r);if(r.name==="timestamp_to_unix_micros")return new Df(r);if(r.name==="unix_millis_to_timestamp")return new yf(r);if(r.name==="timestamp_to_unix_millis")return new If(r);if(r.name==="unix_seconds_to_timestamp")return new wf(r);if(r.name==="timestamp_to_unix_seconds")return new Tf(r);if(r.name==="timestamp_add")return new Af(r);if(r.name==="timestamp_subtract")return new bf(r)}throw new Error(`Unknown Expr : ${r}`)}var Eh=class{constructor(e){this.expr=e}evaluate(e,t){if(this.expr.fieldName===Jt)return b.newValue({referenceValue:_u(e.serializer,t.key)});if(this.expr.fieldName==="__update_time__")return b.newValue({timestampValue:ou(e.serializer,t.version)});if(this.expr.fieldName==="__create_time__")return b.newValue({timestampValue:ou(e.serializer,t.createTime)});let n=t.data.field(this.expr._fieldPath);return n?sc(n)?b.newValue((function(i,a){if(i.serverTimestampBehavior==="estimate")return{timestampValue:ou(i.serializer,te.fromTimestamp(ws(a)))};if(i.serverTimestampBehavior==="previous"){let u=Pa(a);if(u)return u}return{nullValue:"NULL_VALUE"}})(e,n)):b.newValue(n):b.Mi()}},_h=class{constructor(e){this.expr=e}evaluate(e,t){return b.newValue(this.expr._getValue())}},yh=class{constructor(e){this.expr=e}evaluate(e,t){let n=this.expr.di.map((s=>ee(s).evaluate(e,t)));return n.some((s=>s.Bi()))?b.Oi():b.newValue({arrayValue:{values:n.map((s=>s.value))}})}};function Ye(r){return Qt(r)?Number(r.doubleValue):Number(r.integerValue)}function nn(r){return BigInt(r.integerValue)}var k0=BigInt("0x7fffffffffffffff"),V0=-BigInt("0x8000000000000000"),Kr=class{constructor(e){this.expr=e}evaluate(e,t){$(this.expr.params.length>=2,24778);let n=ee(this.expr.params[0]).evaluate(e,t),s=ee(this.expr.params[1]).evaluate(e,t),i=this.$i(n,s);for(let a of this.expr.params.slice(2)){let u=ee(a).evaluate(e,t);i=this.$i(i,u)}return i}$i(e,t){if(e.Bi()||t.Bi())return b.Oi();if(e.Li()||t.Li())return b.Ni();let n=e.value,s=t.value;if(!Qt(n)&&!Wt(n)||!Qt(s)&&!Wt(s))return b.Oi();if(Qt(n)||Qt(s)){let i=this.Ui(n,s);return i?b.newValue(i):b.Oi()}if(Wt(n)&&Wt(s)){let i=this.ki(n,s);return i===void 0?b.Oi():typeof i=="number"?b.newValue({doubleValue:i}):i<V0||i>k0?b.Oi():b.newValue({integerValue:`${i}`})}return b.Oi()}};function In(r,e){return Oe(r)!==Oe(e)?"TYPE_MISMATCH":ze(r)||ze(e)?"NOT_EQ":Et(r)&&Et(e)?"EQ":Et(r)||Et(e)?"NULL":Rs(r)&&Rs(e)?(function(n,s){var a,u,c;if(((a=n.values)==null?void 0:a.length)!==((u=s.values)==null?void 0:u.length))return"NOT_EQ";let i=!1;for(let l=0;l<(((c=n.values)==null?void 0:c.length)??0);l++){let h=n.values[l],d=s.values[l];switch(In(h,d)){case"EQ":break;case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":i=!0;break;default:Y(44609,{Qi:h,qi:d})}}return i?"NULL":"EQ"})(r.arrayValue,e.arrayValue):DB(r)&&DB(e)||Ar(r)&&Ar(e)?(function(n,s){let i=n.fields||{},a=s.fields||{};if(Rr(i)!==Rr(a))return"NOT_EQ";let u=!1;for(let c in i)if(i.hasOwnProperty(c)){if(a[c]===void 0)return"NOT_EQ";switch(In(i[c],a[c])){case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":u=!0}}return u?"NULL":"EQ"})(r.mapValue,e.mapValue):(function(n,s){return vt(n,s,{be:!1,ye:!0,we:!0})})(r,e)?"EQ":"NOT_EQ"}var wh=class extends Kr{ki(e,t){return nn(e)+nn(t)}Ui(e,t){return{doubleValue:Ye(e)+Ye(t)}}},Dh=class extends Kr{constructor(e){super(e),this.expr=e}ki(e,t){return nn(e)-nn(t)}Ui(e,t){return{doubleValue:Ye(e)-Ye(t)}}},Ih=class extends Kr{constructor(e){super(e),this.expr=e}ki(e,t){return nn(e)*nn(t)}Ui(e,t){return{doubleValue:Ye(e)*Ye(t)}}},Th=class extends Kr{constructor(e){super(e),this.expr=e}ki(e,t){let n=nn(t);if(n!==BigInt(0))return nn(e)/n}Ui(e,t){let n=Ye(t);return n===0?{doubleValue:Ds(n)?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY}:{doubleValue:Ye(e)/n}}},Ah=class extends Kr{constructor(e){super(e),this.expr=e}ki(e,t){let n=nn(t);if(n!==BigInt(0))return nn(e)%n}Ui(e,t){let n=Ye(t);if(n!==0)return{doubleValue:Ye(e)%n}}},bh=class{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(let a of this.expr.params){let u=ee(a).evaluate(e,t);switch(u.type){case"BOOLEAN":if(!((i=u.value)!=null&&i.booleanValue))return b.newValue(Je);break;case"NULL":s=!0;break;default:n=!0}}return n?b.Oi():s?b.Ni():b.newValue(ht)}},js=class{constructor(e){this.expr=e}evaluate(e,t){var s;$(this.expr.params.length===1,9634);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return b.newValue({booleanValue:!((s=n.value)!=null&&s.booleanValue)});case"NULL":return b.Ni();default:return b.Oi()}}},vh=class{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(let a of this.expr.params){let u=ee(a).evaluate(e,t);switch(u.type){case"BOOLEAN":if((i=u.value)!=null&&i.booleanValue)return b.newValue(ht);break;case"NULL":s=!0;break;default:n=!0}}return n?b.Oi():s?b.Ni():b.newValue(Je)}},Rh=class r{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(let a of this.expr.params){let u=ee(a).evaluate(e,t);switch(u.type){case"BOOLEAN":n=r.xor(n,!!((i=u.value)!=null&&i.booleanValue));break;case"NULL":s=!0;break;default:return b.Oi()}}return s?b.Ni():b.newValue({booleanValue:n})}static xor(e,t){return(e||t)&&!(e&&t)}},qu=class{constructor(e){this.expr=e}evaluate(e,t){var a,u;$(this.expr.params.length===2,55094);let n=!1,s=ee(this.expr.params[0]).evaluate(e,t);switch(s.type){case"NULL":n=!0;break;case"ERROR":case"UNSET":return b.Oi()}let i=ee(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return b.Oi()}if(n)return b.Ni();for(let c of((u=(a=i.value)==null?void 0:a.arrayValue)==null?void 0:u.values)??[])switch(Et(s.value)&&Et(c)?"EQ":In(s.value,c)){case"EQ":return b.newValue(ht);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:Y(44608,{value:s.value,candidate:c})}return n?b.Ni():b.newValue(Je)}},Sh=class{constructor(e){this.expr=e}evaluate(e,t){return new js(new x("not",[new x("equal_any",this.expr.params)])).evaluate(e,t)}},Ph=class{constructor(e){this.expr=e}evaluate(e,t){$(this.expr.params.length===1,23322);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return b.newValue(Je);case"DOUBLE":return b.newValue({booleanValue:isNaN(Ye(n.value))});case"NULL":return b.Ni();default:return b.Oi()}}},Nh=class{constructor(e){this.expr=e}evaluate(e,t){return $(this.expr.params.length===1,50406),new js(new x("not",[new x("is_nan",this.expr.params)])).evaluate(e,t)}},Oh=class{constructor(e){this.expr=e}evaluate(e,t){switch($(this.expr.params.length===1,23123),ee(this.expr.params[0]).evaluate(e,t).type){case"NULL":return b.newValue(ht);case"UNSET":case"ERROR":return b.Oi();default:return b.newValue(Je)}}},xh=class{constructor(e){this.expr=e}evaluate(e,t){return $(this.expr.params.length===1,23167),new js(new x("not",[new x("is_null",this.expr.params)])).evaluate(e,t)}},Fh=class{constructor(e){this.expr=e}evaluate(e,t){return $(this.expr.params.length===1,5228),ee(this.expr.params[0]).evaluate(e,t).type==="ERROR"?b.newValue(ht):b.newValue(Je)}},Lh=class{constructor(e){this.expr=e}evaluate(e,t){switch($(this.expr.params.length===1,6877),ee(this.expr.params[0]).evaluate(e,t).type){case"ERROR":return b.Oi();case"UNSET":return b.newValue(Je);default:return b.newValue(ht)}}},kh=class{constructor(e){this.expr=e}evaluate(e,t){var s;$(this.expr.params.length===3,11706);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return(s=n.value)!=null&&s.booleanValue?ee(this.expr.params[1]).evaluate(e,t):ee(this.expr.params[2]).evaluate(e,t);case"NULL":return ee(this.expr.params[2]).evaluate(e,t);default:return b.Oi()}}},Vh=class{constructor(e){this.expr=e}evaluate(e,t){let n=this.expr.params.map((i=>ee(i).evaluate(e,t))),s;for(let i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||ft(i.value,s.value)>0?i:s}return s===void 0?b.Ni():s}},Mh=class{constructor(e){this.expr=e}evaluate(e,t){let n=this.expr.params.map((i=>ee(i).evaluate(e,t))),s;for(let i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||ft(i.value,s.value)<0?i:s}return s===void 0?b.Ni():s}},$n=class{constructor(e){this.expr=e}evaluate(e,t){$(this.expr.params.length===2,31033,`${this.expr.name}() function should have exactly 2 params`);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"ERROR":case"UNSET":return b.Oi()}let s=ee(this.expr.params[1]).evaluate(e,t);switch(s.type){case"ERROR":case"UNSET":return b.Oi()}return this.Ki(n,s)}},Gh=class extends $n{constructor(e){super(e),this.expr=e}Ki(e,t){if(e.Li()&&t.Li())return b.newValue(ht);if(e.Li()||t.Li()||ze(e.value)||ze(t.value)||Oe(e.value)!==Oe(t.value))return b.newValue(Je);switch(In(e.value,t.value)){case"EQ":return b.newValue(ht);case"NOT_EQ":return b.newValue(Je);case"NULL":return b.Ni();default:Y(44615,{left:e,right:t})}}},Uh=class extends $n{constructor(e){super(e),this.expr=e}Ki(e,t){switch(In(e.value,t.value)){case"EQ":return b.newValue(Je);case"NOT_EQ":case"TYPE_MISMATCH":return b.newValue(ht);case"NULL":return b.Ni();default:Y(44614,{left:e,right:t})}}},Hh=class extends $n{constructor(e){super(e),this.expr=e}Ki(e,t){return Oe(e.value)!==Oe(t.value)||ze(e.value)||ze(t.value)?b.newValue(Je):b.newValue({booleanValue:ft(e.value,t.value)<0})}},qh=class extends $n{constructor(e){super(e),this.expr=e}Ki(e,t){return Oe(e.value)!==Oe(t.value)||ze(e.value)||ze(t.value)?b.newValue(Je):In(e.value,t.value)==="EQ"?b.newValue(ht):b.newValue({booleanValue:ft(e.value,t.value)<0})}},jh=class extends $n{constructor(e){super(e),this.expr=e}Ki(e,t){return Oe(e.value)!==Oe(t.value)||ze(e.value)||ze(t.value)?b.newValue(Je):b.newValue({booleanValue:ft(e.value,t.value)>0})}},Kh=class extends $n{constructor(e){super(e),this.expr=e}Ki(e,t){return Oe(e.value)!==Oe(t.value)||ze(e.value)||ze(t.value)?b.newValue(Je):In(e.value,t.value)==="EQ"?b.newValue(ht):b.newValue({booleanValue:ft(e.value,t.value)>0})}},Jh=class{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}},zh=class{constructor(e){this.expr=e}evaluate(e,t){var s;$(this.expr.params.length===1,216);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return b.Ni();case"ARRAY":{let i=((s=n.value.arrayValue)==null?void 0:s.values)??[];return b.newValue({arrayValue:{values:[...i].reverse()}})}default:return b.Oi()}}},Wh=class{constructor(e){this.expr=e}evaluate(e,t){return $(this.expr.params.length===2,52884),new qu(new x("eq_any",[this.expr.params[1],this.expr.params[0]])).evaluate(e,t)}},Qh=class{constructor(e){this.expr=e}evaluate(e,t){var c,l,h,d;$(this.expr.params.length===2,1392);let n=!1,s=ee(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return b.Oi()}let i=ee(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return b.Oi()}if(n)return b.Ni();let a=((l=(c=i.value)==null?void 0:c.arrayValue)==null?void 0:l.values)??[],u=((d=(h=s.value)==null?void 0:h.arrayValue)==null?void 0:d.values)??[];for(let p of a){let E=!1;n=!1;for(let y of u){switch(Et(p)&&Et(y)?"EQ":In(p,y)){case"EQ":E=!0;break;case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:Y(44613,{value:y,search:p})}if(E)break}if(!E)return b.newValue(Je)}return b.newValue(ht)}},$h=class{constructor(e){this.expr=e}evaluate(e,t){var c,l,h,d;$(this.expr.params.length===2,2680);let n=!1,s=ee(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return b.Oi()}let i=ee(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return b.Oi()}if(n)return b.Ni();let a=((l=(c=i.value)==null?void 0:c.arrayValue)==null?void 0:l.values)??[],u=((d=(h=s.value)==null?void 0:h.arrayValue)==null?void 0:d.values)??[];for(let p of u)for(let E of a)switch(Et(p)&&Et(E)?"EQ":In(p,E)){case"EQ":return b.newValue(ht);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:Y(60403,{value:p,search:E})}return n?b.Ni():b.newValue(Je)}},Yh=class{constructor(e){this.expr=e}evaluate(e,t){var s,i,a;$(this.expr.params.length===1,38605);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return b.Ni();case"ARRAY":return b.newValue({integerValue:`${((a=(i=(s=n.value)==null?void 0:s.arrayValue)==null?void 0:i.values)==null?void 0:a.length)??0}`});default:return b.Oi()}}},Xh=class{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}},Zh=class{constructor(e){this.expr=e}evaluate(e,t){var s,i;$(this.expr.params.length===1,1508);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return b.Ni();case"BYTES":{let a=(s=n.value)==null?void 0:s.bytesValue;if(typeof a=="string"){let u=De.fromBase64String(a).toUint8Array();return u.reverse(),b.newValue({bytesValue:De.fromUint8Array(u).toBase64()})}return b.newValue({bytesValue:new Uint8Array(a).reverse()})}case"STRING":{let a=(i=n.value)==null?void 0:i.stringValue,u=new Intl.__PRIVATE_Segmenter(void 0,{granularity:"grapheme"}).segment(a),c=Array.from(u,(l=>l.segment)).reverse();return b.newValue({stringValue:c.join("")})}default:return b.Oi()}}},ef=class{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}},tf=class{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}},nf=class{constructor(e){this.expr=e}evaluate(e,t){$(this.expr.params.length===1,19400);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return b.Ni();case"STRING":{let s=(function(a){let u=0;for(let c=0;c<a.length;c++){let l=a.codePointAt(c);if(l===void 0)return;if(l<=65535)if(l>=55296&&l<=57343)if(l<=56319){let h=a.codePointAt(c+1);h!==void 0&&h>=56320&&h<=57343?(u+=1,c++):u+=1}else u+=1;else u+=1;else{if(!(l<=1114111))return;u+=1,c++}}return u})(n.value.stringValue);return s===void 0?b.Oi():b.newValue({integerValue:s})}default:return b.Oi()}}},rf=class{constructor(e){this.expr=e}evaluate(e,t){var s,i;$(this.expr.params.length===1,8486);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BYTES":{let a=(s=n.value)==null?void 0:s.bytesValue;return typeof a=="string"?b.newValue({integerValue:De.fromBase64String(a).toUint8Array().length}):b.newValue({integerValue:new Uint8Array(a).length})}case"STRING":{let a=(function(c){let l=0;for(let h=0;h<c.length;h++){let d=c.codePointAt(h);if(d===void 0)return;if(d>=55296&&d<=57343){if(!(d<=56319))return;{let p=c.codePointAt(h+1);if(p===void 0||!(p>=56320&&p<=57343))return;l+=4,h++}}else if(d<=127)l+=1;else if(d<=2047)l+=2;else if(d<=65535)l+=3;else{if(!(d<=1114111))return;l+=4,h++}}return l})((i=n.value)==null?void 0:i.stringValue);return a===void 0?b.Oi():b.newValue({integerValue:a})}case"NULL":return b.Ni();default:return b.Oi()}}},Yn=class{constructor(e){this.expr=e}evaluate(e,t){var a,u;$(this.expr.params.length===2,39773,`${this.expr.name}() function should have exactly two parameters`);let n=!1,s=ee(this.expr.params[0]).evaluate(e,t);switch(s.type){case"STRING":break;case"NULL":n=!0;break;default:return b.Oi()}let i=ee(this.expr.params[1]).evaluate(e,t);switch(i.type){case"STRING":break;case"NULL":n=!0;break;default:return b.Oi()}return n?b.Ni():this.Wi((a=s.value)==null?void 0:a.stringValue,(u=i.value)==null?void 0:u.stringValue)}},sf=class extends Yn{Wi(e,t){try{let n=(function(a){let u="";for(let c=0;c<a.length;c++){let l=a.charAt(c);switch(l){case"_":u+=".";break;case"%":u+=".*";break;case"\\":case".":case"*":case"?":case"+":case"^":case"$":case"|":case"(":case")":case"[":case"]":case"{":case"}":u+="\\"+l;break;default:u+=l}}return"^"+u+"$"})(t),s=Xo.compile(n);return b.newValue({booleanValue:s.matches(e)})}catch(n){return bt(`Invalid LIKE pattern converted to regex: ${t}, returning error. Error: ${n}`),b.Oi()}}},af=class extends Yn{Wi(e,t){try{let n=Xo.compile(t);return b.newValue({booleanValue:n.test(e)})}catch{return bt(`Invalid regex pattern found in regex_contains: ${t}, returning error`),b.Oi()}}},of=class extends Yn{Wi(e,t){try{return b.newValue({booleanValue:Xo.compile(t).matches(e)})}catch{return bt(`Invalid regex pattern found in regex_match: ${t}, returning error`),b.Oi()}}},uf=class extends Yn{Wi(e,t){return b.newValue({booleanValue:e.includes(t)})}},cf=class extends Yn{Wi(e,t){return b.newValue({booleanValue:e.startsWith(t)})}},lf=class extends Yn{Wi(e,t){return b.newValue({booleanValue:e.endsWith(t)})}},Bf=class{constructor(e){this.expr=e}evaluate(e,t){var s,i;$(this.expr.params.length===1,29079);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return b.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toLowerCase()});case"NULL":return b.Ni();default:return b.Oi()}}},hf=class{constructor(e){this.expr=e}evaluate(e,t){var s,i;$(this.expr.params.length===1,60487);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return b.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toUpperCase()});case"NULL":return b.Ni();default:return b.Oi()}}},ff=class{constructor(e){this.expr=e}evaluate(e,t){var s,i;$(this.expr.params.length===1,28544);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return b.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.trim()});case"NULL":return b.Ni();default:return b.Oi()}}},df=class{constructor(e){this.expr=e}evaluate(e,t){let n=this.expr.params.map((a=>ee(a).evaluate(e,t))),s="",i=!1;for(let a of n)switch(a.type){case"STRING":s+=a.value.stringValue;break;case"NULL":i=!0;break;default:return b.Oi()}return i?b.Ni():b.newValue({stringValue:s})}},pf=class{constructor(e){this.expr=e}evaluate(e,t){var a,u,c,l;$(this.expr.params.length===2,4483);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"UNSET":return b.Mi();case"MAP":break;default:return b.Oi()}let s=ee(this.expr.params[1]).evaluate(e,t);if(s.type!=="STRING")return b.Oi();let i=(l=(u=(a=n.value)==null?void 0:a.mapValue)==null?void 0:u.fields)==null?void 0:l[(c=s.value)==null?void 0:c.stringValue];return i===void 0?b.Mi():b.newValue(i)}},ga=class{constructor(e){this.expr=e}evaluate(e,t){var l,h;$(this.expr.params.length===2,25231,`${this.expr.name}() function should have exactly 2 params`);let n=!1,s=ee(this.expr.params[0]).evaluate(e,t);switch(s.type){case"VECTOR":break;case"NULL":n=!0;break;default:return b.Oi()}let i=ee(this.expr.params[1]).evaluate(e,t);switch(i.type){case"VECTOR":break;case"NULL":n=!0;break;default:return b.Oi()}if(n)return b.Ni();let a=IB(s.value),u=IB(i.value);if(a===void 0||u===void 0||((l=a.values)==null?void 0:l.length)!==((h=u.values)==null?void 0:h.length))return b.Oi();let c=this.Gi(a,u);return c===void 0||isNaN(c)?b.Oi():b.newValue({doubleValue:c})}},Cf=class extends ga{Gi(e,t){let n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return;let i=0,a=0,u=0;for(let l=0;l<n.length;l++){if(!yn(n[l])||!yn(s[l]))return;let h=Ye(n[l]),d=Ye(s[l]);i+=h*d,a+=h*h,u+=d*d}let c=Math.sqrt(a)*Math.sqrt(u);if(c!==0)return 1-Math.max(-1,Math.min(1,i/c))}},gf=class extends ga{Gi(e,t){let n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let a=0;a<n.length;a++){if(!yn(n[a])||!yn(s[a]))return;i+=Ye(n[a])*Ye(s[a])}return i}},mf=class extends ga{Gi(e,t){let n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let a=0;a<n.length;a++){if(!yn(n[a])||!yn(s[a]))return;let u=Ye(n[a]),c=Ye(s[a]);i+=Math.pow(u-c,2)}return Math.sqrt(i)}},Ef=class{constructor(e){this.expr=e}evaluate(e,t){var s;$(this.expr.params.length===1,39044);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"VECTOR":{let i=IB(n.value);return b.newValue({integerValue:((s=i==null?void 0:i.values)==null?void 0:s.length)??0})}case"NULL":return b.Ni();default:return b.Oi()}}},ma=BigInt(-62135596800),Ea=BigInt(253402300799),ju=BigInt(1e3),Gn=BigInt(1e6),M0=ma*ju,G0=Ea*ju+BigInt(999),U0=ma*Gn,H0=Ea*Gn+BigInt(999999);function vd(r){return r>=U0&&r<=H0}function c_(r){return r>=ma&&r<=Ea}function _a(r,e){let t=BigInt(r);return!(t<ma||t>Ea)&&!(e<0||e>=1e9)&&(t!==ma||e===0)&&!(t===Ea&&e>999999999)}function l_(r,e){return e<0?{seconds:r-1,nanos:e+1e9}:{seconds:r,nanos:e}}function Rd(r){return BigInt(r.seconds)*Gn+BigInt(Math.trunc(r.nanoseconds/1e3))}var ya=class{constructor(e){this.expr=e}evaluate(e,t){$(this.expr.params.length===1,49262,`${this.expr.name}() function should have exactly one parameter`);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return this.toTimestamp(BigInt(n.value.integerValue));case"NULL":return b.Ni();default:return b.Oi()}}},_f=class extends ya{toTimestamp(e){if(!vd(e))return b.Oi();let t=Number(e/Gn),n=Number(e%Gn*BigInt(1e3)),s=l_(t,n);return t=s.seconds,n=s.nanos,_a(t,n)?b.newValue({timestampValue:{seconds:t,nanos:n}}):b.Oi()}},yf=class extends ya{toTimestamp(e){if(!(function(a){return a>=M0&&a<=G0})(e))return b.Oi();let t=Number(e/ju),n=Number(e%ju*BigInt(1e6)),s=l_(t,n);return t=s.seconds,n=s.nanos,_a(t,n)?b.newValue({timestampValue:{seconds:t,nanos:n}}):b.Oi()}},wf=class extends ya{toTimestamp(e){if(!c_(e))return b.Oi();let t=Number(e);return b.newValue({timestampValue:{seconds:t,nanos:0}})}},wa=class{constructor(e){this.expr=e}evaluate(e,t){$(this.expr.params.length===1,1265,`${this.expr.name}() function should have exactly one parameter`);let n=ee(this.expr.params[0]).evaluate(e,t);switch(n.type){case"TIMESTAMP":break;case"NULL":return b.Ni();default:return b.Oi()}let s=_d(n.value.timestampValue);return _a(s.seconds,s.nanoseconds)?this.ji(s):b.Oi()}},Df=class extends wa{ji(e){let t=Rd(e);return vd(t)?b.newValue({integerValue:`${t.toString()}`}):b.Oi()}},If=class extends wa{ji(e){let t=Rd(e),n=t/BigInt(1e3),s=t%BigInt(1e3);return n>BigInt(0)||s===BigInt(0)?b.newValue({integerValue:n.toString()}):b.newValue({integerValue:(n-BigInt(1)).toString()})}},Tf=class extends wa{ji(e){let t=BigInt(e.seconds);return c_(t)?b.newValue({integerValue:t.toString()}):b.Oi()}},Ku=class{constructor(e){this.expr=e}evaluate(e,t){$(this.expr.params.length===3,2775,`${this.expr.name}() function should have exactly 3 parameters`);let n=!1,s=ee(this.expr.params[0]).evaluate(e,t);switch(s.type){case"TIMESTAMP":break;case"NULL":n=!0;break;default:return b.Oi()}let i=ee(this.expr.params[1]).evaluate(e,t),a;switch(i.type){case"STRING":if(a=(function(z){switch(z){case"microsecond":return"microsecond";case"millisecond":return"millisecond";case"second":return"second";case"minute":return"minute";case"hour":return"hour";case"day":return"day";default:return}})(i.value.stringValue),a===void 0)return b.Oi();break;case"NULL":n=!0;break;default:return b.Oi()}let u=ee(this.expr.params[2]).evaluate(e,t);switch(u.type){case"INT":break;case"NULL":n=!0;break;default:return b.Oi()}if(n)return b.Ni();let c=BigInt(u.value.integerValue),l;try{switch(a){case"microsecond":l=c;break;case"millisecond":l=c*BigInt(1e3);break;case"second":l=c*BigInt(1e6);break;case"minute":l=c*BigInt(6e7);break;case"hour":l=c*BigInt(36e8);break;case"day":l=c*BigInt(864e8);break;default:return b.Oi()}if(a!=="microsecond"&&c!==BigInt(0)&&l/c!==BigInt(this.zi(a)))return b.Oi()}catch(U){return bt(`Error during timestamp arithmetic: ${U}`),b.Oi()}let h=_d(s.value.timestampValue);if(!_a(h.seconds,h.nanoseconds))return b.Oi();let d=Rd(h),p=this.Hi(d,l);if(!vd(p))return b.Oi();let E=Number(p/Gn),y=p%Gn,S=Number((y<0?y+Gn:y)*BigInt(1e3)),F=y<0?E-1:E;return _a(F,S)?b.newValue({timestampValue:{seconds:F,nanos:S}}):b.Oi()}zi(e){switch(e){case"millisecond":return 1e3;case"second":return 1e6;case"minute":return 6e7;case"hour":return 36e8;case"day":return 864e8;default:return 1}}},Af=class extends Ku{Hi(e,t){return e+t}},bf=class extends Ku{Hi(e,t){return e-t}};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Da(r){if((r=u_(r))instanceof zn)return`fld(${r.fieldName})`;if(r instanceof Gs)return`cst(${(function(t){return t===null?"null":typeof t=="number"?t.toString():typeof t=="string"?`"${t}"`:t instanceof Se?`ref(${t.path})`:t instanceof _t?`vec(${JSON.stringify(t)})`:JSON.stringify(t)})(r.value)})`;if(r instanceof x)return`fn(${r.name},[${r.params.map(Da).join(",")}])`;if(r.expressionType==="ListOfExpressions")return`list([${r.di.map(Da).join(",")}])`;throw new Error(`Unrecognized expr ${JSON.stringify(r,null,2)}`)}function q0(r){if(r instanceof Mu)return`${r._name}(${ru(r.fields)})`;if(r instanceof Gu){let e=`${r._name}(${ru(r.accumulators)})`;return r.groups.size>0&&(e+=`grouping(${ru(r.groups)})`),e}if(r instanceof Uu)return`${r._name}(${ru(r.groups)})`;if(r instanceof Us)return`${r._name}(${r.pi})`;if(r instanceof Hs)return`${r._name}(${r.collectionId})`;if(r instanceof pa)return`${r._name}()`;if(r instanceof Ca)return`${r._name}(${r.gi.sort()})`;if(r instanceof qs)return`${r._name}(${Da(r.condition)})`;if(r instanceof Dn)return`${r._name}(${r.limit})`;if(r instanceof Ft)return`${r._name}(${(function(t){return t.map((n=>`${Da(n.expr)}${n.direction}`)).join(",")})(r.orderings)})`;throw new Error(`Unrecognized stage ${r._name}`)}function ru(r){return`${Array.from(r.entries()).sort().map((([e,t])=>`${e}=${Da(t)}`)).join(",")}`}function gn(r){return r.stages.map((e=>q0(e))).join("|")}function B_(r,e){return gn(r)===gn(e)}function Le(r){return r instanceof $e}function Km(r){return Le(r)?gn(r):Yi(r)}function h_(r){return Le(r)?gn(r):(function(t){return`${PE(Yt(t))}|lt:${t.limitType}`})(r)}function Cc(r,e){return r instanceof $e&&e instanceof $e?B_(r,e):!(r instanceof $e&&!(e instanceof $e)||!(r instanceof $e)&&e instanceof $e)&&JT(r,e)}function f_(r){return Dr(r)?gn(r):PE(r)}function d_(r,e){return r instanceof $e&&e instanceof $e?B_(r,e):!(r instanceof $e&&!(e instanceof $e)||!(r instanceof $e)&&e instanceof $e)&&NE(r,e)}function j0(r,e){let t=(function(s){let i=!1,a=[];for(let u of s)if(u instanceof Ft)if(i=!0,u.orderings.some((c=>c.expr instanceof zn&&c.expr.fieldName===Jt)))a.push(u);else{let c=u.orderings.map((l=>l));c.push(uu(Jt).ascending()),a.push(new Ft(c,{}))}else u instanceof Dn&&(i||(a.push(new Ft([uu(Jt).ascending()],{})),i=!0)),a.push(u);return i||a.push(new Ft([uu(Jt).ascending()],{})),a})(r.stages);if(r.userDataReader){let n=r.userDataReader.createContext(3,"toCorePipeline");t.forEach((s=>s._readUserData(n)))}return new $e(r.userDataReader.serializer,t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var vf=class{constructor(e,t,n,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(e,t){let n=t.mutationResults;for(let s=0;s<this.mutations.length;s++){let i=this.mutations[s];i.key.isEqual(e.key)&&LT(i,e,n[s])}}applyToLocalView(e,t){for(let n of this.baseMutations)n.key.isEqual(e.key)&&(t=$i(n,e,t,this.localWriteTime));for(let n of this.mutations)n.key.isEqual(e.key)&&(t=$i(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){let n=kE();return this.mutations.forEach((s=>{let i=e.get(s.key),a=i.overlayedDocument,u=this.applyToLocalView(a,i.mutatedFields);u=t.has(s.key)?null:u;let c=IE(a,u);c!==null&&n.set(s.key,c),a.isValidDocument()||a.convertToNoDocument(te.min())})),n}keys(){return this.mutations.reduce(((e,t)=>e.add(t.key)),ue())}isEqual(e){return this.batchId===e.batchId&&ys(this.mutations,e.mutations,((t,n)=>bm(t,n)))&&ys(this.baseMutations,e.baseMutations,((t,n)=>bm(t,n)))}},Rf=class r{constructor(e,t,n,s){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=s}static from(e,t,n){$(e.mutations.length===n.length,58842,{Ji:e.mutations.length,Yi:n.length});let s=(function(){return $T})(),i=e.mutations;for(let a=0;a<i.length;a++)s=s.insert(i[a].key,n[a].version);return new r(e,t,n,s)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var p_="";function K0(r){let e="";for(let t=0;t<r.length;t++)e.length>0&&(e=Jm(e)),e=J0(r.get(t),e);return Jm(e)}function J0(r,e){let t=e,n=r.length;for(let s=0;s<n;s++){let i=r.charAt(s);switch(i){case"\0":t+="";break;case p_:t+="";break;default:t+=i}}return t}function Jm(r){return r+p_+""}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var z0="remoteDocuments",C_="owner";var g_="mutationQueues";var m_="mutations";/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var E_="documentMutations",W0="remoteDocumentsV14";var __="remoteDocumentGlobal";var y_="targets";var w_="targetDocuments";var D_="targetGlobal",I_="collectionParents";var T_="clientMetadata";var A_="bundles";var b_="namedQueries";var Q0="indexConfiguration";var $0="indexState";var Y0="indexEntries";var v_="documentOverlays";var X0="globals";var Z0=[g_,m_,E_,z0,y_,C_,D_,w_,T_,__,I_,A_,b_],vR=[...Z0,v_],eA=[g_,m_,E_,W0,y_,C_,D_,w_,T_,__,I_,A_,b_,v_],tA=eA,nA=[...tA,Q0,$0,Y0];var RR=[...nA,X0];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Sf=class{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ks=class r{constructor(e,t,n,s,i=te.min(),a=te.min(),u=De.EMPTY_BYTE_STRING,c=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=u,this.expectedCount=c}withSequenceNumber(e){return new r(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new r(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new r(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new r(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Pf=class{constructor(e){this.Xi=e}};function rA(r){let e=B0({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?Cu(e,e.limit,"L"):e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ju=class{constructor(){}Ts(e,t){this.Ps(e,t),t.Is()}Ps(e,t){var n;if("nullValue"in e)this.Rs(t,5);else if("booleanValue"in e)this.Rs(t,10),t.As(e.booleanValue?1:0);else if("integerValue"in e)this.Rs(t,15),t.As(ge(e.integerValue));else if("doubleValue"in e){let s=ge(e.doubleValue);this.Vs(s,t)}else if("timestampValue"in e)this.ds(e.timestampValue,t);else if("stringValue"in e)this.fs(e.stringValue,t),this.ps(t);else if("bytesValue"in e)this.Rs(t,30),t.gs(xt(e.bytesValue)),this.ps(t);else if("referenceValue"in e)this.ys(e.referenceValue,t);else if("geoPointValue"in e)this.ws(e.geoPointValue,t);else if("mapValue"in e){let s=Cd(e);if(s===ce.fe)this.Rs(t,Number.MAX_SAFE_INTEGER);else if(s===ce.me)this.bs(e.mapValue,t);else if(s===ce.de)this.Rs(t,999);else if(s===ce.Ve)this.Rs(t,7);else if(s===ce.Ae){let i=(n=e.mapValue)==null?void 0:n.fields,a=i==null?void 0:i[As],u=a==null?void 0:a.bytesValue,c=xt(u).toUint8Array();if(c[0]===0){let l=c.slice(1);this.Rs(t,30),t.gs(De.fromUint8Array(l)),this.ps(t)}else this.Ss(e.mapValue,t)}else if(s===ce.he)this.xs(e.mapValue,t);else if(s===ce.Re)this.vs(e.mapValue,t);else if(s===ce.Te)this.Ds(e.mapValue,t);else if(s===ce.Pe)this.Cs(e.mapValue,t);else if(s===ce.Ie){let i=parseFloat(e.mapValue.fields[_n].stringValue);this.Vs(i,t)}else this.Fs(e.mapValue,t),this.ps(t)}else"arrayValue"in e?(this.Os(e.arrayValue,t),this.ps(t)):Y(19022,{Ms:e})}fs(e,t){this.Rs(t,25),this.Ns(e,t)}Ns(e,t){t.Bs(e)}Vs(e,t){isNaN(e)?this.Rs(t,13):(this.Rs(t,15),Ds(e)?t.As(0):t.As(e))}Cs(e,t){this.Rs(t,15),t.As(ge(e.fields[tr].integerValue))}ds(e,t){this.Rs(t,20),typeof e=="string"&&(e=En(e)),t.Bs(`${e.seconds||""}`),t.As(e.nanos||0)}ws(e,t){this.Rs(t,45),t.As(e.latitude||0),t.As(e.longitude||0)}Fs(e,t){let n=e.fields||{};this.Rs(t,55);for(let s of Object.keys(n))this.fs(s,t),this.Ps(n[s],t)}bs(e,t){var a,u;let n=e.fields||{};this.Rs(t,53);let s=Sr,i=((u=(a=n[s].arrayValue)==null?void 0:a.values)==null?void 0:u.length)||0;this.Rs(t,15),t.As(ge(i)),this.fs(s,t),this.Ps(n[s],t)}Os(e,t){let n=e.values||[];this.Rs(t,50);for(let s of n)this.Ps(s,t)}ys(e,t){this.Rs(t,37);let n=e.split("/").filter((s=>s.length>0));X.fromSegments(n.slice(5)).path.forEach((s=>{this.Rs(t,60),this.Ns(s,t)}))}Rs(e,t){e.As(t)}ps(e){e.As(2)}vs(e,t){this.Rs(t,22);let n=e.fields||{};n&&this.Fs(n[fn].mapValue,t)}Ds(e,t){var i;this.Rs(t,43);let n=e.fields||{},s=((i=n[Pr])==null?void 0:i.stringValue)||"";t.gs(xt(s))}Ss(e,t){var i;this.Rs(t,31);let n=e.fields||{},s=((i=n[As])==null?void 0:i.bytesValue)||"";t.gs(xt(s)),this.ps(t)}xs(e,t){var i,a,u,c;this.Rs(t,47);let n=e.fields||{},s=((a=(i=n[zt])==null?void 0:i.mapValue)==null?void 0:a.fields)||{};s&&(t.Bs(((u=s[Is])==null?void 0:u.stringValue)||""),t.Bs(((c=s[Ts])==null?void 0:c.stringValue)||"")),this.ps(t)}};Ju.Ls=new Ju;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law | agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES | CONDITIONS OF ANY KIND, either express | implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Nf=class{constructor(){this.d_=new Of}addToCollectionParentIndex(e,t){return this.d_.add(t),M.resolve()}getCollectionParents(e,t){return M.resolve(this.d_.getEntries(t))}addFieldIndex(e,t){return M.resolve()}deleteFieldIndex(e,t){return M.resolve()}deleteAllFieldIndexes(e){return M.resolve()}createTargetIndexes(e,t){return M.resolve()}getDocumentsMatchingTarget(e,t){return M.resolve(null)}getIndexType(e,t){return M.resolve(0)}getFieldIndexes(e,t){return M.resolve([])}getNextCollectionGroupToUpdate(e){return M.resolve(null)}getMinOffset(e,t){return M.resolve(Mr.min())}getMinOffsetFromCollectionGroup(e,t){return M.resolve(Mr.min())}updateCollectionGroup(e,t,n){return M.resolve()}updateIndexEntries(e,t){return M.resolve()}},Of=class{constructor(){this.index={}}add(e){let t=e.lastSegment(),n=e.popLast(),s=this.index[t]||new ke(he.comparator),i=!s.has(n);return this.index[t]=s.add(n),i}has(e){let t=e.lastSegment(),n=e.popLast(),s=this.index[t];return s&&s.has(n)}getEntries(e){return(this.index[e]||new ke(he.comparator)).toArray()}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var SR=new Uint8Array(0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Jr=class r{constructor(e){this.K_=e}next(){return this.K_+=2,this.K_}static W_(){return new r(0)}static G_(){return new r(-1)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */// Copyright 2024 Google LLC* @license
function R_(r,e){var n;let t=e;for(let s of r.stages)t=iA({serializer:r.serializer,serverTimestampBehavior:(n=r.listenOptions)==null?void 0:n.serverTimestampBehavior},s,t);return t}function gc(r,e){return R_(r,[e]).length>0}function sA(r,e){return Le(r)?gc(r,e):lc(r,e)}function iA(r,e,t){if(e instanceof Us)return(function(s,i,a){return a.filter((u=>u.isFoundDocument()&&`/${u.key.getCollectionPath().canonicalString()}`===i.pi))})(0,e,t);if(e instanceof qs)return(function(s,i,a){return a.filter((u=>{let c=ea(ee(i.condition).evaluate(s,u));return c!==void 0&&vt(c,ht)}))})(r,e,t);if(e instanceof Hs)return(function(s,i,a){return a.filter((u=>u.isFoundDocument()&&u.key.getCollectionPath().lastSegment()===i.collectionId))})(0,e,t);if(e instanceof pa)return(function(s,i,a){return a.filter((u=>u.isFoundDocument()))})(0,0,t);if(e instanceof Ca)return(function(s,i,a){return a.filter((u=>u.isFoundDocument()&&i.yi.has(u.key.path.toStringWithLeadingSlash())))})(0,e,t);if(e instanceof Dn)return(function(s,i,a){return a.slice(0,i.limit)})(0,e,t);if(e instanceof Ft)return(function(s,i,a){let u=i.orderings.map((c=>({eo:ee(c.expr),direction:c.direction})));return[...a].sort(((c,l)=>{for(let{eo:h,direction:d}of u){let p=ea(h.evaluate(s,c)),E=ea(h.evaluate(s,l)),y=ft(p??bs,E??bs);if(y!==0)return d==="ascending"?y:-y}return 0}))})(r,e,t);throw new Error(`Unknown stage: ${e._name}`)}function xf(r){let e=(function(n){for(let s=n.stages.length-1;s>=0;s--){let i=n.stages[s];if(i instanceof Ft)return i.orderings}throw new Error("Pipeline must contain at least one Sort stage")})(r);return(t,n)=>{for(let s of e){let i=ea(ee(s.expr).evaluate({serializer:r.serializer},t)),a=ea(ee(s.expr).evaluate({serializer:r.serializer},n)),u=ft(i||bs,a||bs);if(u!==0)return s.direction==="ascending"?u:-u}return 0}}function CB(r){for(let e=r.stages.length-1;e>=0;e--){let t=r.stages[e];if(t instanceof Dn)return{limit:t.limit}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ff=class{constructor(){this.changes=new wn((e=>e.toString()),((e,t)=>e.isEqual(t))),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,kt.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();let n=this.changes.get(t);return n!==void 0?M.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Lf=class{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var kf=class{constructor(e,t,n,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=s}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next((s=>(n=s,this.remoteDocumentCache.getEntry(e,t)))).next((s=>(n!==null&&$i(n.mutation,s,At.empty(),Ie.now()),s)))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.getLocalViewOfDocuments(e,n,ue()).next((()=>n))))}getLocalViewOfDocuments(e,t,n=ue()){let s=kn();return this.populateOverlays(e,s,t).next((()=>this.computeViews(e,t,s,n).next((i=>{let a=hs();return i.forEach(((u,c)=>{a=a.insert(u,c.overlayedDocument)})),a}))))}getOverlayedDocuments(e,t){let n=kn();return this.populateOverlays(e,n,t).next((()=>this.computeViews(e,t,n,ue())))}populateOverlays(e,t,n){let s=[];return n.forEach((i=>{t.has(i)||s.push(i)})),this.documentOverlayCache.getOverlays(e,s).next((i=>{i.forEach(((a,u)=>{t.set(a,u)}))}))}computeViews(e,t,n,s){let i=lt(),a=Xi(),u=(function(){return Xi()})();return t.forEach(((c,l)=>{let h=n.get(l.key);s.has(l.key)&&(h===void 0||h.mutation instanceof en)?i=i.insert(l.key,l):h!==void 0?(a.set(l.key,h.mutation.getFieldMask()),$i(h.mutation,l,h.mutation.getFieldMask(),Ie.now())):a.set(l.key,At.empty())})),this.recalculateAndSaveOverlays(e,i).next((c=>(c.forEach(((l,h)=>a.set(l,h))),t.forEach(((l,h)=>u.set(l,new Lf(h,a.get(l)??null)))),u)))}recalculateAndSaveOverlays(e,t){let n=Xi(),s=new Te(((a,u)=>a-u)),i=ue();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next((a=>{for(let u of a)u.keys().forEach((c=>{let l=t.get(c);if(l===null)return;let h=n.get(c)||At.empty();h=u.applyToLocalView(l,h),n.set(c,h);let d=(s.get(u.batchId)||ue()).add(c);s=s.insert(u.batchId,d)}))})).next((()=>{let a=[],u=s.getReverseIterator();for(;u.hasNext();){let c=u.getNext(),l=c.key,h=c.value,d=kE();h.forEach((p=>{if(!i.has(p)){let E=IE(t.get(p),n.get(p));E!==null&&d.set(p,E),i=i.add(p)}})),a.push(this.documentOverlayCache.saveOverlays(e,l,d))}return M.waitFor(a)})).next((()=>n))}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.recalculateAndSaveOverlays(e,n)))}getDocumentsMatchingQuery(e,t,n,s){return Le(t)?this.getDocumentsMatchingPipeline(e,t,n,s):jT(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):md(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,s):this.getDocumentsMatchingCollectionQuery(e,t,n,s)}getNextDocuments(e,t,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,s).next((i=>{let a=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,s-i.size):M.resolve(kn()),u=la,c=i;return a.next((l=>M.forEach(l,((h,d)=>(u<d.largestBatchId&&(u=d.largestBatchId),i.get(h)?M.resolve():this.remoteDocumentCache.getEntry(e,h).next((p=>{c=c.insert(h,p)}))))).next((()=>this.populateOverlays(e,l,i))).next((()=>this.computeViews(e,c,l,ue()))).next((h=>({batchId:u,changes:LE(h)})))))}))}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new X(t)).next((n=>{let s=hs();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s}))}getDocumentsMatchingCollectionGroupQuery(e,t,n,s){let i=t.collectionGroup,a=hs();return this.indexManager.getCollectionParents(e,i).next((u=>M.forEach(u,(c=>{let l=(function(d,p){return new Gr(p,null,d.explicitOrderBy.slice(),d.filters.slice(),d.limit,d.limitType,d.startAt,d.endAt)})(t,c.child(i));return this.getDocumentsMatchingCollectionQuery(e,l,n,s).next((h=>{h.forEach(((d,p)=>{a=a.insert(d,p)}))}))})).next((()=>a))))}getDocumentsMatchingCollectionQuery(e,t,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next((a=>(i=a,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s)))).next((a=>this.retrieveMatchingLocalDocuments(i,a,(u=>lc(t,u)))))}getDocumentsMatchingPipeline(e,t,n,s){if(Mn(t)==="collection_group"){let i=bd(t),a=hs();return this.indexManager.getCollectionParents(e,i).next((u=>M.forEach(u,(c=>{let l=(function(d,p){let E=d.stages.map((y=>y instanceof Hs?new Us(p.canonicalString(),{}):y));return new $e(d.serializer,E)})(t,c.child(i));return this.getDocumentsMatchingPipeline(e,l,n,s).next((h=>{h.forEach(((d,p)=>{a=a.insert(d,p)}))}))})).next((()=>a))))}{let i;return this.getOverlaysForPipeline(e,t,n.largestBatchId).next((a=>{switch(i=a,Mn(t)){case"collection":return this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s);case"documents":let u=ue();for(let c of mh(t))u=u.add(X.fromPath(c));return this.remoteDocumentCache.getEntries(e,u);case"database":return this.remoteDocumentCache.getAllEntries(e);default:throw new q("invalid-argument",`Invalid pipeline source to execute offline: ${gn(t)}`)}})).next((a=>this.retrieveMatchingLocalDocuments(i,a,(u=>gc(t,u)))))}}retrieveMatchingLocalDocuments(e,t,n){e.forEach(((i,a)=>{let u=a.getKey();t.get(u)===null&&(t=t.insert(u,kt.newInvalidDocument(u)))}));let s=hs();return t.forEach(((i,a)=>{let u=e.get(i);u!==void 0&&$i(u.mutation,a,At.empty(),Ie.now()),n(a)&&(s=s.insert(i,a))})),s}getOverlaysForPipeline(e,t,n){switch(Mn(t)){case"collection":return this.documentOverlayCache.getOverlaysForCollection(e,he.fromString(pc(t)),n);case"collection_group":throw new q("invalid-argument",`Unexpected collection group pipeline: ${gn(t)}`);case"documents":return this.documentOverlayCache.getOverlays(e,mh(t).map((s=>X.fromPath(s))));case"database":return this.documentOverlayCache.getAllOverlays(e,n);default:throw new q("invalid-argument",`Failed to get overlays for pipeline: ${gn(t)}`)}}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Vf=class{constructor(e){this.serializer=e,this.co=new Map,this.lo=new Map}getBundleMetadata(e,t){return M.resolve(this.co.get(t))}saveBundleMetadata(e,t){return this.co.set(t.id,(function(s){return{id:s.id,version:s.version,createTime:Xt(s.createTime)}})(t)),M.resolve()}getNamedQuery(e,t){return M.resolve(this.lo.get(t))}saveNamedQuery(e,t){return this.lo.set(t.name,(function(s){return{name:s.name,query:rA(s.bundledQuery),readTime:Xt(s.readTime)}})(t)),M.resolve()}};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Mf=class{constructor(){this.overlays=new Te(X.comparator),this.Eo=new Map}getOverlay(e,t){return M.resolve(this.overlays.get(t))}getOverlays(e,t){let n=kn();return M.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}getAllOverlays(e,t){let n=kn();return this.overlays.forEach(((s,i)=>{i.largestBatchId>t&&n.set(s,i)})),M.resolve(n)}saveOverlays(e,t,n){return n.forEach(((s,i)=>{this.Es(e,t,i)})),M.resolve()}removeOverlaysForBatchId(e,t,n){let s=this.Eo.get(n);return s!==void 0&&(s.forEach((i=>this.overlays=this.overlays.remove(i))),this.Eo.delete(n)),M.resolve()}getOverlaysForCollection(e,t,n){let s=kn(),i=t.length+1,a=new X(t.child("")),u=this.overlays.getIteratorFrom(a);for(;u.hasNext();){let c=u.getNext().value,l=c.getKey();if(!t.isPrefixOf(l.path))break;l.path.length===i&&c.largestBatchId>n&&s.set(c.getKey(),c)}return M.resolve(s)}getOverlaysForCollectionGroup(e,t,n,s){let i=new Te(((l,h)=>l-h)),a=this.overlays.getIterator();for(;a.hasNext();){let l=a.getNext().value;if(l.getKey().getCollectionGroup()===t&&l.largestBatchId>n){let h=i.get(l.largestBatchId);h===null&&(h=kn(),i=i.insert(l.largestBatchId,h)),h.set(l.getKey(),l)}}let u=kn(),c=i.getIterator();for(;c.hasNext()&&(c.getNext().value.forEach(((l,h)=>u.set(l,h))),!(u.size()>=s)););return M.resolve(u)}Es(e,t,n){let s=this.overlays.get(n.key);if(s!==null){let a=this.Eo.get(s.largestBatchId).delete(n.key);this.Eo.set(s.largestBatchId,a)}this.overlays=this.overlays.insert(n.key,new Sf(t,n));let i=this.Eo.get(t);i===void 0&&(i=ue(),this.Eo.set(t,i)),this.Eo.set(t,i.add(n.key))}};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Gf=class{constructor(){this.sessionToken=De.EMPTY_BYTE_STRING}getSessionToken(e){return M.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,M.resolve()}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ia=class{constructor(){this.ho=new ke(Ne.To),this.Po=new ke(Ne.Io)}isEmpty(){return this.ho.isEmpty()}addReference(e,t){let n=new Ne(e,t);this.ho=this.ho.add(n),this.Po=this.Po.add(n)}Ro(e,t){e.forEach((n=>this.addReference(n,t)))}removeReference(e,t){this.Ao(new Ne(e,t))}Vo(e,t){e.forEach((n=>this.removeReference(n,t)))}fo(e){let t=new X(new he([])),n=new Ne(t,e),s=new Ne(t,e+1),i=[];return this.Po.forEachInRange([n,s],(a=>{this.Ao(a),i.push(a.key)})),i}mo(){this.ho.forEach((e=>this.Ao(e)))}Ao(e){this.ho=this.ho.delete(e),this.Po=this.Po.delete(e)}po(e){let t=new X(new he([])),n=new Ne(t,e),s=new Ne(t,e+1),i=ue();return this.Po.forEachInRange([n,s],(a=>{i=i.add(a.key)})),i}containsKey(e){let t=new Ne(e,0),n=this.ho.firstAfterOrEqual(t);return n!==null&&e.isEqual(n.key)}},Ne=class{constructor(e,t){this.key=e,this.yo=t}static To(e,t){return X.comparator(e.key,t.key)||ae(e.yo,t.yo)}static Io(e,t){return ae(e.yo,t.yo)||X.comparator(e.key,t.key)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Uf=class{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.rs=1,this.wo=new ke(Ne.To)}checkEmpty(e){return M.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,n,s){let i=this.rs;this.rs++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];let a=new vf(i,t,n,s);this.mutationQueue.push(a);for(let u of s)this.wo=this.wo.add(new Ne(u.key,i)),this.indexManager.addToCollectionParentIndex(e,u.key.path.popLast());return M.resolve(a)}lookupMutationBatch(e,t){return M.resolve(this.bo(t))}getNextMutationBatchAfterBatchId(e,t){let n=t+1,s=this.So(n),i=s<0?0:s;return M.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return M.resolve(this.mutationQueue.length===0?fd:this.rs-1)}getAllMutationBatches(e){return M.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){let n=new Ne(t,0),s=new Ne(t,Number.POSITIVE_INFINITY),i=[];return this.wo.forEachInRange([n,s],(a=>{let u=this.bo(a.yo);i.push(u)})),M.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new ke(ae);return t.forEach((s=>{let i=new Ne(s,0),a=new Ne(s,Number.POSITIVE_INFINITY);this.wo.forEachInRange([i,a],(u=>{n=n.add(u.yo)}))})),M.resolve(this.xo(n))}getAllMutationBatchesAffectingQuery(e,t){let n=t.path,s=n.length+1,i=n;X.isDocumentKey(i)||(i=i.child(""));let a=new Ne(new X(i),0),u=new ke(ae);return this.wo.forEachWhile((c=>{let l=c.key.path;return!!n.isPrefixOf(l)&&(l.length===s&&(u=u.add(c.yo)),!0)}),a),M.resolve(this.xo(u))}xo(e){let t=[];return e.forEach((n=>{let s=this.bo(n);s!==null&&t.push(s)})),t}removeMutationBatch(e,t){$(this.vo(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.wo;return M.forEach(t.mutations,(s=>{let i=new Ne(s.key,t.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)})).next((()=>{this.wo=n}))}us(e){}containsKey(e,t){let n=new Ne(t,0),s=this.wo.firstAfterOrEqual(n);return M.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,M.resolve()}vo(e,t){return this.So(e)}So(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}bo(e){let t=this.So(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Hf=class{constructor(e){this.Do=e,this.docs=(function(){return new Te(X.comparator)})(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){let n=t.key,s=this.docs.get(n),i=s?s.size:0,a=this.Do(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:a}),this.size+=a-i,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){let t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){let n=this.docs.get(t);return M.resolve(n?n.document.mutableCopy():kt.newInvalidDocument(t))}getEntries(e,t){let n=lt();return t.forEach((s=>{let i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():kt.newInvalidDocument(s))})),M.resolve(n)}getAllEntries(e){let t=lt();return this.docs.forEach(((n,s)=>{t=t.insert(n,s.document)})),M.resolve(t)}getDocumentsMatchingQuery(e,t,n,s){let i,a;Le(t)?(i=he.fromString(pc(t)),a=h=>gc(t,h)):(i=t.path,a=h=>lc(t,h));let u=lt(),c=new X(i.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(c);for(;l.hasNext();){let{key:h,value:{document:d}}=l.getNext();if(!i.isPrefixOf(h.path))break;h.path.length>i.length+1||HT(UT(d),n)<=0||(s.has(d.key)||a(d))&&(u=u.insert(d.key,d.mutableCopy()))}return M.resolve(u)}getAllFromCollectionGroup(e,t,n,s){Y(9500)}Co(e,t){return M.forEach(this.docs,(n=>t(n)))}newChangeBuffer(e){return new qf(this)}getSize(e){return M.resolve(this.size)}},qf=class extends Ff{constructor(e){super(),this.ao=e}applyChanges(e){let t=[];return this.changes.forEach(((n,s)=>{s.isValidDocument()?t.push(this.ao.addEntry(e,s)):this.ao.removeEntry(n)})),M.waitFor(t)}getFromCache(e,t){return this.ao.getEntry(e,t)}getAllFromCache(e,t){return this.ao.getEntries(e,t)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var jf=class{constructor(e){this.persistence=e,this.Fo=new wn((t=>f_(t)),d_),this.lastRemoteSnapshotVersion=te.min(),this.highestTargetId=0,this.Oo=0,this.Mo=new Ia,this.targetCount=0,this.No=Jr.W_()}forEachTarget(e,t){return this.Fo.forEach(((n,s)=>t(s))),M.resolve()}getLastRemoteSnapshotVersion(e){return M.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return M.resolve(this.Oo)}allocateTargetId(e){return this.highestTargetId=this.No.next(),M.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.Oo&&(this.Oo=t),M.resolve()}H_(e){this.Fo.set(e.target,e);let t=e.targetId;t>this.highestTargetId&&(this.No=new Jr(t),this.highestTargetId=t),e.sequenceNumber>this.Oo&&(this.Oo=e.sequenceNumber)}addTargetData(e,t){return this.H_(t),this.targetCount+=1,M.resolve()}updateTargetData(e,t){return this.H_(t),M.resolve()}removeTargetData(e,t){return this.Fo.delete(t.target),this.Mo.fo(t.targetId),this.targetCount-=1,M.resolve()}removeTargets(e,t,n){let s=0,i=[];return this.Fo.forEach(((a,u)=>{u.sequenceNumber<=t&&n.get(u.targetId)===null&&(this.Fo.delete(a),i.push(this.removeMatchingKeysForTargetId(e,u.targetId)),s++)})),M.waitFor(i).next((()=>s))}getTargetCount(e){return M.resolve(this.targetCount)}getTargetData(e,t){let n=this.Fo.get(t)||null;return M.resolve(n)}addMatchingKeys(e,t,n){return this.Mo.Ro(t,n),M.resolve()}removeMatchingKeys(e,t,n){this.Mo.Vo(t,n);let s=this.persistence.referenceDelegate,i=[];return s&&t.forEach((a=>{i.push(s.markPotentiallyOrphaned(e,a))})),M.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this.Mo.fo(t),M.resolve()}getMatchingKeysForTargetId(e,t){let n=this.Mo.po(t);return M.resolve(n)}containsKey(e,t){return M.resolve(this.Mo.containsKey(t))}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var zu=class{constructor(e,t){this.Bo={},this.overlays={},this.Lo=new Vs(0),this.$o=!1,this.$o=!0,this.Uo=new Gf,this.referenceDelegate=e(this),this.ko=new jf(this),this.indexManager=new Nf,this.remoteDocumentCache=(function(s){return new Hf(s)})((n=>this.referenceDelegate.Qo(n))),this.serializer=new Pf(t),this.qo=new Vf(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.$o=!1,Promise.resolve()}get started(){return this.$o}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new Mf,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.Bo[e.toKey()];return n||(n=new Uf(t,this.referenceDelegate),this.Bo[e.toKey()]=n),n}getGlobalsCache(){return this.Uo}getTargetCache(){return this.ko}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.qo}runTransaction(e,t,n){K("MemoryPersistence","Starting transaction:",e);let s=new Kf(this.Lo.next());return this.referenceDelegate.Ko(),n(s).next((i=>this.referenceDelegate.Wo(s).next((()=>i)))).toPromise().then((i=>(s.raiseOnCommittedEvent(),i)))}Go(e,t){return M.or(Object.values(this.Bo).map((n=>()=>n.containsKey(e,t))))}},Kf=class extends nh{constructor(e){super(),this.currentSequenceNumber=e}},Jf=class r{constructor(e){this.persistence=e,this.jo=new Ia,this.zo=null}static Ho(e){return new r(e)}get Jo(){if(this.zo)return this.zo;throw Y(60996)}addReference(e,t,n){return this.jo.addReference(n,t),this.Jo.delete(n.toString()),M.resolve()}removeReference(e,t,n){return this.jo.removeReference(n,t),this.Jo.add(n.toString()),M.resolve()}markPotentiallyOrphaned(e,t){return this.Jo.add(t.toString()),M.resolve()}removeTarget(e,t){this.jo.fo(t.targetId).forEach((s=>this.Jo.add(s.toString())));let n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next((s=>{s.forEach((i=>this.Jo.add(i.toString())))})).next((()=>n.removeTargetData(e,t)))}Ko(){this.zo=new Set}Wo(e){let t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return M.forEach(this.Jo,(n=>{let s=X.fromPath(n);return this.Yo(e,s).next((i=>{i||t.removeEntry(s,te.min())}))})).next((()=>(this.zo=null,t.apply(e))))}updateLimboDocument(e,t){return this.Yo(e,t).next((n=>{n?this.Jo.delete(t.toString()):this.Jo.add(t.toString())}))}Qo(e){return 0}Yo(e,t){return M.or([()=>M.resolve(this.jo.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Go(e,t)])}},Wu=class r{constructor(e,t){this.persistence=e,this.Zo=new wn((n=>K0(n.path)),((n,s)=>n.isEqual(s))),this.garbageCollector=A0(this,t)}static Ho(e,t){return new r(e,t)}Ko(){}Wo(e){return M.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}Pi(e){let t=this.Y_(e);return this.persistence.getTargetCache().getTargetCount(e).next((n=>t.next((s=>n+s))))}Y_(e){let t=0;return this.Ii(e,(n=>{t++})).next((()=>t))}Ii(e,t){return M.forEach(this.Zo,((n,s)=>this.X_(e,n,s).next((i=>i?M.resolve():t(s)))))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0,s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.Co(e,(a=>this.X_(e,a,t).next((u=>{u||(n++,i.removeEntry(a,te.min()))})))).next((()=>i.apply(e))).next((()=>n))}markPotentiallyOrphaned(e,t){return this.Zo.set(t,e.currentSequenceNumber),M.resolve()}removeTarget(e,t){let n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.Zo.set(n,e.currentSequenceNumber),M.resolve()}removeReference(e,t,n){return this.Zo.set(n,e.currentSequenceNumber),M.resolve()}updateLimboDocument(e,t){return this.Zo.set(t,e.currentSequenceNumber),M.resolve()}Qo(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=fu(e.data.value)),t}X_(e,t,n){return M.or([()=>this.persistence.Go(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{let s=this.Zo.get(t);return M.resolve(s!==void 0&&s>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var zf=class r{constructor(e,t,n,s){this.targetId=e,this.fromCache=t,this.$a=n,this.Ua=s}static ka(e,t){let n=ue(),s=ue();for(let i of t.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new r(e,t.fromCache,n,s)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function aA(r,e){return X.comparator(r.key,e.key)}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Wf=class{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Qf=class{constructor(){this.Qa=!1,this.qa=!1,this.Ka=100,this.Wa=(function(){return sC()?8:I0(Me())>0?6:4})()}initialize(e,t){this.Ga=e,this.indexManager=t,this.Qa=!0}getDocumentsMatchingQuery(e,t,n,s){let i={result:null};return this.ja(e,t).next((a=>{i.result=a})).next((()=>{if(!i.result)return this.za(e,t,s,n).next((a=>{i.result=a}))})).next((()=>{if(i.result)return;let a=new Wf;return this.Ha(e,t,a).next((u=>{if(i.result=u,this.qa)return this.Ja(e,t,a,u.size)}))})).next((()=>i.result))}Ja(e,t,n,s){return Le(t)?M.resolve():n.documentReadCount<this.Ka?(ls()<=oe.DEBUG&&K("QueryEngine","SDK will not create cache indexes for query:",Yi(t),"since it only creates cache indexes for collection contains","more than or equal to",this.Ka,"documents"),M.resolve()):(ls()<=oe.DEBUG&&K("QueryEngine","Query:",Yi(t),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.Wa*s?(ls()<=oe.DEBUG&&K("QueryEngine","The SDK decides to create cache indexes for query:",Yi(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,Yt(t))):M.resolve())}ja(e,t){if(Le(t))return M.resolve(null);let n=t;if(Om(n))return M.resolve(null);let s=Yt(n);return this.indexManager.getIndexType(e,s).next((i=>i===0?null:(n.limit!==null&&i===1&&(n=Cu(n,null,"F"),s=Yt(n)),this.indexManager.getDocumentsMatchingTarget(e,s).next((a=>{let u=ue(...a);return this.Ga.getDocuments(e,u).next((c=>this.indexManager.getMinOffset(e,s).next((l=>{let h=this.Ya(n,c);return this.Za(n,h,u,l.readTime)?this.ja(e,Cu(n,null,"F")):this.Xa(e,h,n,l)}))))})))))}za(e,t,n,s){return(Le(t)?(function(a){for(let u of a.stages){if(u instanceof Dn||u instanceof Hu)return!1;if(u instanceof qs){if(u.condition instanceof Fu&&u.condition._expr.name==="exists"&&u.condition._expr.params[0]instanceof zn&&u.condition._expr.params[0].fieldName===Jt)continue;return!1}}return!0})(t):Om(t))||s.isEqual(te.min())?M.resolve(null):this.Ga.getDocuments(e,n).next((i=>{let a=this.Ya(t,i);return this.Za(t,a,n,s)?M.resolve(null):(ls()<=oe.DEBUG&&K("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),Km(t)),this.Xa(e,a,t,GT(s,la)).next((u=>u)))}))}Ya(e,t){let n,s;return Le(e)?(n=new ke(aA),s=i=>gc(e,i)):(n=new ke(Ed(e)),s=i=>lc(e,i)),t.forEach(((i,a)=>{s(a)&&(n=n.add(a))})),n}Za(e,t,n,s){if(Le(e))return(function(u){return u.stages.some((c=>c instanceof Dn||c instanceof Hu))})(e);if(e.limit===null)return!1;if(n.size!==t.size)return!0;let i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}Ha(e,t,n){return ls()<=oe.DEBUG&&K("QueryEngine","Using full collection scan to execute query:",Km(t)),this.Ga.getDocumentsMatchingQuery(e,t,Mr.min(),n)}Xa(e,t,n,s){return this.Ga.getDocumentsMatchingQuery(e,n,s).next((i=>(t.forEach((a=>{i=i.insert(a.key,a)})),i)))}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Sd="LocalStore",oA=3e8,$f=class{constructor(e,t,n,s){this.persistence=e,this.eu=t,this.serializer=s,this.tu=new Te(ae),this.nu=new wn((i=>f_(i)),d_),this.ru=new Map,this.iu=e.getRemoteDocumentCache(),this.ko=e.getTargetCache(),this.qo=e.getBundleCache(),this.su(n)}su(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new kf(this.iu,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.iu.setIndexManager(this.indexManager),this.eu.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(t=>e.collect(t,this.tu)))}};function uA(r,e,t,n){return new $f(r,e,t,n)}async function S_(r,e){let t=ne(r);return await t.persistence.runTransaction("Handle user change","readonly",(n=>{let s;return t.mutationQueue.getAllMutationBatches(n).next((i=>(s=i,t.su(e),t.mutationQueue.getAllMutationBatches(n)))).next((i=>{let a=[],u=[],c=ue();for(let l of s){a.push(l.batchId);for(let h of l.mutations)c=c.add(h.key)}for(let l of i){u.push(l.batchId);for(let h of l.mutations)c=c.add(h.key)}return t.localDocuments.getDocuments(n,c).next((l=>({_u:l,removedBatchIds:a,addedBatchIds:u})))}))}))}function cA(r,e){let t=ne(r);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",(n=>{let s=e.batch.keys(),i=t.iu.newChangeBuffer({trackRemovals:!0});return(function(u,c,l,h){let d=l.batch,p=d.keys(),E=M.resolve();return p.forEach((y=>{E=E.next((()=>h.getEntry(c,y))).next((S=>{let F=l.docVersions.get(y);$(F!==null,48541),S.version.compareTo(F)<0&&(d.applyToRemoteDocument(S,l),S.isValidDocument()&&(S.setReadTime(l.commitVersion),h.addEntry(S)))}))})),E.next((()=>u.mutationQueue.removeMutationBatch(c,d)))})(t,n,e,i).next((()=>i.apply(n))).next((()=>t.mutationQueue.performConsistencyCheck(n))).next((()=>t.documentOverlayCache.removeOverlaysForBatchId(n,s,e.batch.batchId))).next((()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,(function(u){let c=ue();for(let l=0;l<u.mutationResults.length;++l)u.mutationResults[l].transformResults.length>0&&(c=c.add(u.batch.mutations[l].key));return c})(e)))).next((()=>t.localDocuments.getDocuments(n,s)))}))}function P_(r){let e=ne(r);return e.persistence.runTransaction("Get last remote snapshot version","readonly",(t=>e.ko.getLastRemoteSnapshotVersion(t)))}function lA(r,e){let t=ne(r),n=e.snapshotVersion,s=t.tu;return t.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{let a=t.iu.newChangeBuffer({trackRemovals:!0});s=t.tu;let u=[];e.targetChanges.forEach(((h,d)=>{let p=s.get(d);if(!p)return;u.push(t.ko.removeMatchingKeys(i,h.removedDocuments,d).next((()=>t.ko.addMatchingKeys(i,h.addedDocuments,d))));let E=p.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(d)!==null?E=E.withResumeToken(De.EMPTY_BYTE_STRING,te.min()).withLastLimboFreeSnapshotVersion(te.min()):h.resumeToken.approximateByteSize()>0&&(E=E.withResumeToken(h.resumeToken,n)),s=s.insert(d,E),(function(S,F,U){return S.resumeToken.approximateByteSize()===0||F.snapshotVersion.toMicroseconds()-S.snapshotVersion.toMicroseconds()>=oA?!0:U.addedDocuments.size+U.modifiedDocuments.size+U.removedDocuments.size>0})(p,E,h)&&u.push(t.ko.updateTargetData(i,E))}));let c=lt(),l=ue();if(e.documentUpdates.forEach((h=>{e.resolvedLimboDocuments.has(h)&&u.push(t.persistence.referenceDelegate.updateLimboDocument(i,h))})),u.push(BA(i,a,e.documentUpdates).next((h=>{c=h.ou,l=h.au}))),!n.isEqual(te.min())){let h=t.ko.getLastRemoteSnapshotVersion(i).next((d=>t.ko.setTargetsMetadata(i,i.currentSequenceNumber,n)));u.push(h)}return M.waitFor(u).next((()=>a.apply(i))).next((()=>t.localDocuments.getLocalViewOfDocuments(i,c,l))).next((()=>c))})).then((i=>(t.tu=s,i)))}function BA(r,e,t){let n=ue(),s=ue();return t.forEach((i=>n=n.add(i))),e.getEntries(r,n).next((i=>{let a=lt();return t.forEach(((u,c)=>{let l=i.get(u);c.isFoundDocument()!==l.isFoundDocument()&&(s=s.add(u)),c.isNoDocument()&&c.version.isEqual(te.min())?(e.removeEntry(u,c.readTime),a=a.insert(u,c)):!l.isValidDocument()||c.version.compareTo(l.version)>0||c.version.compareTo(l.version)===0&&l.hasPendingWrites?(e.addEntry(c),a=a.insert(u,c)):K(Sd,"Ignoring outdated watch update for ",u,". Current version:",l.version," Watch version:",c.version)})),{ou:a,au:s}}))}function hA(r,e){let t=ne(r);return t.persistence.runTransaction("Get next mutation batch","readonly",(n=>(e===void 0&&(e=fd),t.mutationQueue.getNextMutationBatchAfterBatchId(n,e))))}function fA(r,e){let t=ne(r);return t.persistence.runTransaction("Allocate target","readwrite",(n=>{let s;return t.ko.getTargetData(n,e).next((i=>i?(s=i,M.resolve(s)):t.ko.allocateTargetId(n).next((a=>(s=new Ks(e,a,"TargetPurposeListen",n.currentSequenceNumber),t.ko.addTargetData(n,s).next((()=>s)))))))})).then((n=>{let s=t.tu.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.tu=t.tu.insert(n.targetId,n),t.nu.set(e,n.targetId)),n}))}async function Yf(r,e,t){let n=ne(r),s=n.tu.get(e),i=t?"readwrite":"readwrite-primary";try{t||await n.persistence.runTransaction("Release target",i,(a=>n.persistence.referenceDelegate.removeTarget(a,s)))}catch(a){if(!Ys(a))throw a;K(Sd,`Failed to update sequence numbers for target ${e}: ${a}`)}n.tu=n.tu.remove(e),n.nu.delete(s.target)}function zm(r,e,t){let n=ne(r),s=te.min(),i=ue();return n.persistence.runTransaction("Execute query","readwrite",(a=>(function(c,l,h){let d=ne(c),p=d.nu.get(h);return p!==void 0?M.resolve(d.tu.get(p)):d.ko.getTargetData(l,h)})(n,a,Le(e)?e:Yt(e)).next((u=>{if(u)return s=u.lastLimboFreeSnapshotVersion,n.ko.getMatchingKeysForTargetId(a,u.targetId).next((c=>{i=c}))})).next((()=>n.eu.getDocumentsMatchingQuery(a,e,t?s:te.min(),t?i:ue()))).next((u=>(dA(n,u),{documents:u,uu:i})))))}function dA(r,e){e.forEach(((t,n)=>{let s=n.key.getCollectionGroup(),i=r.ru.get(s)||te.min();n.readTime.compareTo(i)>0&&r.ru.set(s,n.readTime)}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Xf=class{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.Pu=0,this.Iu=null,this.Ru=!0}Au(){this.Pu===0&&(this.Vu("Unknown"),this.Iu=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this.Iu=null,this.du("Backend didn't respond within 10 seconds."),this.Vu("Offline"),Promise.resolve()))))}fu(e){this.state==="Online"?this.Vu("Unknown"):(this.Pu++,this.Pu>=1&&(this.mu(),this.du(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.Vu("Offline")))}set(e){this.mu(),this.Pu=0,e==="Online"&&(this.Ru=!1),this.Vu(e)}Vu(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}du(e){let t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.Ru?(mn(t),this.Ru=!1):K("OnlineStateTracker",t)}mu(){this.Iu!==null&&(this.Iu.cancel(),this.Iu=null)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var rn="RemoteStore",Zf=class{constructor(e,t,n,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.pu=[],this.gu=new Map,this.yu=new Map,this.wu=new Map,this.bu=new Jr(1e3),this.Su=new Jr(1001),this.xu=new Set,this.vu=[],this.Du=i,this.Du.tn((a=>{n.enqueueAndForget((async()=>{Wr(this)&&(K(rn,"Restarting streams for network reachability change."),await(async function(c){let l=ne(c);l.xu.add(4),await xa(l),l.Cu.set("Unknown"),l.xu.delete(4),await mc(l)})(this))}))})),this.Cu=new Xf(n,s)}};async function mc(r){if(Wr(r))for(let e of r.vu)await e(!0)}async function xa(r){for(let e of r.vu)await e(!1)}function ed(r,e){return r.yu.get(e)||void 0}function N_(r,e){let t=ne(r),n=ed(t,e.targetId);if(n!==void 0&&t.gu.has(n))return;let s=(function(u,c){let l=ed(u,c);l!==void 0&&u.wu.delete(l);let h=(function(p,E){return E%2!=0?p.Su.next():p.bu.next()})(u,c);return u.yu.set(c,h),u.wu.set(h,c),h})(t,e.targetId);K(rn,"remoteStoreListen mapping SDK target ID to remote",e.targetId,s);let i=new Ks(e.target,s,e.purpose,e.sequenceNumber,e.snapshotVersion,e.lastLimboFreeSnapshotVersion,e.resumeToken);t.gu.set(s,i),xd(t)?Od(t):Xs(t).ur()&&Nd(t,i)}function Pd(r,e){let t=ne(r),n=Xs(t),s=ed(t,e);K(rn,"remoteStoreUnlisten removing mapping of SDK target ID to remote",e,s),t.gu.delete(s),t.yu.delete(e),t.wu.delete(s),n.ur()&&O_(t,s),t.gu.size===0&&(n.ur()?n.Er():Wr(t)&&t.Cu.set("Unknown"))}function Nd(r,e){if(r.Fu.rt(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(te.min())>0){let t=r.wu.get(e.targetId);if(t===void 0)return void K(rn,"SDK target ID not found for remote ID: "+e.targetId);let n=r.remoteSyncer.getRemoteKeysForTarget(t).size;e=e.withExpectedCount(n)}Xs(r).yr(e)}function O_(r,e){r.Fu.rt(e),Xs(r).wr(e)}function Od(r){r.Fu=new MB({getRemoteKeysForTarget:e=>{let t=r.wu.get(e);return t!==void 0?r.remoteSyncer.getRemoteKeysForTarget(t):ue()},Mt:e=>r.gu.get(e)||null,xt:()=>r.datastore.serializer.databaseId}),Xs(r).start(),r.Cu.Au()}function xd(r){return Wr(r)&&!Xs(r).ar()&&r.gu.size>0}function Wr(r){return ne(r).xu.size===0}function x_(r){r.Fu=void 0}async function pA(r){r.Cu.set("Online")}async function CA(r){r.gu.forEach(((e,t)=>{Nd(r,e)}))}async function gA(r,e){x_(r),xd(r)?(r.Cu.fu(e),Od(r)):r.Cu.set("Unknown")}async function mA(r,e,t){if(r.Cu.set("Online"),e instanceof mu&&e.state===2&&e.cause)try{await(async function(s,i){let a=i.cause;for(let u of i.targetIds){if(s.gu.has(u)){let c=s.wu.get(u);c!==void 0&&(await s.remoteSyncer.rejectListen(c,a),s.yu.delete(c),s.wu.delete(u)),s.gu.delete(u)}s.Fu.removeTarget(u)}})(r,e)}catch(n){K(rn,"Failed to remove targets %s: %s ",e.targetIds.join(","),n),await Qu(r,n)}else if(e instanceof Es?r.Fu.Tt(e):e instanceof gu?r.Fu.ft(e):r.Fu.Rt(e),!t.isEqual(te.min()))try{let n=await P_(r.localStore);t.compareTo(n)>=0&&await(function(i,a){let u=i.Fu.Dt(a);u.targetChanges.forEach(((l,h)=>{if(l.resumeToken.approximateByteSize()>0){let d=i.gu.get(h);d&&i.gu.set(h,d.withResumeToken(l.resumeToken,a))}})),u.targetMismatches.forEach(((l,h)=>{let d=i.gu.get(l);if(!d)return;i.gu.set(l,d.withResumeToken(De.EMPTY_BYTE_STRING,d.snapshotVersion)),O_(i,l);let p=new Ks(d.target,l,h,d.sequenceNumber);Nd(i,p)}));let c=(function(h,d){let p=new Map;d.targetChanges.forEach(((y,S)=>{let F=h.wu.get(S);F!==void 0&&p.set(F,y)}));let E=new Te(ae);return d.targetMismatches.forEach(((y,S)=>{let F=h.wu.get(y);F!==void 0&&(E=E.insert(F,S))})),new Ba(d.snapshotVersion,p,E,d.documentUpdates,d.augmentedDocumentUpdates,d.resolvedLimboDocuments)})(i,u);return i.remoteSyncer.applyRemoteEvent(c)})(r,t)}catch(n){K(rn,"Failed to raise snapshot:",n),await Qu(r,n)}}async function Qu(r,e,t){if(!Ys(e))throw e;r.xu.add(1),await xa(r),r.Cu.set("Offline"),t||(t=()=>P_(r.localStore)),r.asyncQueue.enqueueRetryable((async()=>{K(rn,"Retrying IndexedDB access"),await t(),r.xu.delete(1),await mc(r)}))}function F_(r,e){return e().catch((t=>Qu(r,t,e)))}async function Ec(r){let e=ne(r),t=Xn(e),n=e.pu.length>0?e.pu[e.pu.length-1].batchId:fd;for(;EA(e);)try{let s=await hA(e.localStore,n);if(s===null){e.pu.length===0&&t.Er();break}n=s.batchId,_A(e,s)}catch(s){await Qu(e,s)}L_(e)&&k_(e)}function EA(r){return Wr(r)&&r.pu.length<10}function _A(r,e){r.pu.push(e);let t=Xn(r);t.ur()&&t.br&&t.Sr(e.mutations)}function L_(r){return Wr(r)&&!Xn(r).ar()&&r.pu.length>0}function k_(r){Xn(r).start()}async function yA(r){Xn(r).Cr()}async function wA(r){let e=Xn(r);for(let t of r.pu)e.Sr(t.mutations)}async function DA(r,e,t){let n=r.pu.shift(),s=Rf.from(n,e,t);await F_(r,(()=>r.remoteSyncer.applySuccessfulWrite(s))),await Ec(r)}async function IA(r,e){e&&Xn(r).br&&await(async function(n,s){if((function(a){return WT(a)&&a!==V.ABORTED})(s.code)){let i=n.pu.shift();Xn(n).lr(),await F_(n,(()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s))),await Ec(n)}})(r,e),L_(r)&&k_(r)}async function Wm(r,e){let t=ne(r);t.asyncQueue.verifyOperationInProgress(),K(rn,"RemoteStore received new credentials");let n=Wr(t);t.xu.add(3),await xa(t),n&&t.Cu.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.xu.delete(3),await mc(t)}async function TA(r,e){let t=ne(r);e?(t.xu.delete(2),await mc(t)):e||(t.xu.add(2),await xa(t),t.Cu.set("Unknown"))}function Xs(r){return r.Ou||(r.Ou=(function(t,n,s){let i=ne(t);return i.Or(),new XB(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{pn:pA.bind(null,r),yn:CA.bind(null,r),bn:gA.bind(null,r),gr:mA.bind(null,r)}),r.vu.push((async e=>{e?(r.Ou.lr(),xd(r)?Od(r):r.Cu.set("Unknown")):(await r.Ou.stop(),x_(r))}))),r.Ou}function Xn(r){return r.Mu||(r.Mu=(function(t,n,s){let i=ne(t);return i.Or(),new ZB(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{pn:()=>Promise.resolve(),yn:yA.bind(null,r),bn:IA.bind(null,r),vr:wA.bind(null,r),Dr:DA.bind(null,r)}),r.vu.push((async e=>{e?(r.Mu.lr(),await Ec(r)):(await r.Mu.stop(),r.pu.length>0&&(K(rn,`Stopping write stream with ${r.pu.length} pending writes`),r.pu=[]))}))),r.Mu}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ta=class{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Nu(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Nu(this.observer.error,e):mn("Uncaught Error in snapshot listener:",e.toString()))}Bu(){this.muted=!0}Nu(e,t){setTimeout((()=>{this.muted||e(t)}),0)}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var td=class r{constructor(e,t,n,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new Lt,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((a=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,s,i){let a=Date.now()+n,u=new r(e,t,a,s,i);return u.start(n),u}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new q(V.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}};function Fd(r,e){if(mn("AsyncQueue",`${e}: ${r}`),Ys(r))return new q(V.UNAVAILABLE,`${e}: ${r}`);throw r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var $u=class{constructor(){this.activeTargetIds=ZT()}nc(e){this.activeTargetIds=this.activeTargetIds.add(e)}rc(e){this.activeTargetIds=this.activeTargetIds.delete(e)}tc(){let e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}};var nd=class{constructor(){this.kc=new $u,this.Qc={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.kc.nc(e),this.Qc[e]||"not-current"}updateQueryState(e,t,n){this.Qc[e]=t}removeLocalQueryTarget(e){this.kc.rc(e)}isLocalQueryTarget(e){return this.kc.activeTargetIds.has(e)}clearQueryState(e){delete this.Qc[e]}getAllActiveQueryTargets(){return this.kc.activeTargetIds}isActiveQueryTarget(e){return this.kc.activeTargetIds.has(e)}start(){return this.kc=new $u,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gB(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Aa=class r{static emptySet(e){return new r(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||X.comparator(t.key,n.key):(t,n)=>X.comparator(t.key,n.key),this.keyedMap=hs(),this.sortedSet=new Te(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){let t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal(((t,n)=>(e(t),!1)))}add(e){let t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){let t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof r)||this.size!==e.size)return!1;let t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){let s=t.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){let e=[];return this.forEach((t=>{e.push(t.toString())})),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){let n=new r;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Yu=class{constructor(){this.qc=new Te(X.comparator)}track(e){let t=e.doc.key,n=this.qc.get(t);n?e.type!==0&&n.type===3?this.qc=this.qc.insert(t,e):e.type===3&&n.type!==1?this.qc=this.qc.insert(t,{type:n.type,doc:e.doc}):e.type===2&&n.type===2?this.qc=this.qc.insert(t,{type:2,doc:e.doc}):e.type===2&&n.type===0?this.qc=this.qc.insert(t,{type:0,doc:e.doc}):e.type===1&&n.type===0?this.qc=this.qc.remove(t):e.type===1&&n.type===2?this.qc=this.qc.insert(t,{type:1,doc:n.doc}):e.type===0&&n.type===1?this.qc=this.qc.insert(t,{type:2,doc:e.doc}):Y(63341,{Nt:e,Kc:n}):this.qc=this.qc.insert(t,e)}Wc(){let e=[];return this.qc.inorderTraversal(((t,n)=>{e.push(n)})),e}},Js=class r{constructor(e,t,n,s,i,a,u,c,l){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=a,this.syncStateChanged=u,this.excludesMetadataChanges=c,this.hasCachedResults=l}static fromInitialDocuments(e,t,n,s,i){let a=[];return t.forEach((u=>{a.push({type:0,doc:u})})),new r(e,t,Aa.emptySet(t),a,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Cc(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;let t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==n[s].type||!t[s].doc.isEqual(n[s].doc))return!1;return!0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var rd=class{constructor(){this.Gc=void 0,this.jc=[]}zc(){return this.jc.some((e=>e.Hc()))}},sd=class{constructor(){this.queries=Qm(),this.onlineState="Unknown",this.Jc=new Set}terminate(){(function(t,n){let s=ne(t),i=s.queries;s.queries=Qm(),i.forEach(((a,u)=>{for(let c of u.jc)c.onError(n)}))})(this,new q(V.ABORTED,"Firestore shutting down"))}};function Qm(){return new wn((r=>h_(r)),Cc)}async function Ld(r,e){let t=ne(r),n=3,s=e.query,i=t.queries.get(s);i?!i.zc()&&e.Hc()&&(n=2):(i=new rd,n=e.Hc()?0:1);try{switch(n){case 0:i.Gc=await t.onListen(s,!0);break;case 1:i.Gc=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(a){let u=Fd(a,`Initialization of query '${Le(e.query)?gn(e.query):Yi(e.query)}' failed`);return void e.onError(u)}t.queries.set(s,i),i.jc.push(e),e.Yc(t.onlineState),i.Gc&&e.Zc(i.Gc)&&Vd(t)}async function kd(r,e){let t=ne(r),n=e.query,s=3,i=t.queries.get(n);if(i){let a=i.jc.indexOf(e);a>=0&&(i.jc.splice(a,1),i.jc.length===0?s=e.Hc()?0:1:!i.zc()&&e.Hc()&&(s=2))}switch(s){case 0:return t.queries.delete(n),t.onUnlisten(n,!0);case 1:return t.queries.delete(n),t.onUnlisten(n,!1);case 2:return t.onLastRemoteStoreUnlisten(n);default:return}}function AA(r,e){let t=ne(r),n=!1;for(let s of e){let i=s.query,a=t.queries.get(i);if(a){for(let u of a.jc)u.Zc(s)&&(n=!0);a.Gc=s}}n&&Vd(t)}function bA(r,e,t){let n=ne(r),s=n.queries.get(e);if(s)for(let i of s.jc)i.onError(t);n.queries.delete(e)}function Vd(r){r.Jc.forEach((e=>{e.next()}))}var id;(function(r){r.Default="default",r.Cache="cache"})(id||(id={}));var ba=class{constructor(e,t,n){this.query=e,this.Xc=t,this.el=!1,this.tl=null,this.onlineState="Unknown",this.options=n||{}}Zc(e){if(!this.options.includeMetadataChanges){let n=[];for(let s of e.docChanges)s.type!==3&&n.push(s);e=new Js(e.query,e.docs,e.oldDocs,n,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.el?this.nl(e)&&(this.Xc.next(e),t=!0):this.rl(e,this.onlineState)&&(this.il(e),t=!0),this.tl=e,t}onError(e){this.Xc.error(e)}Yc(e){this.onlineState=e;let t=!1;return this.tl&&!this.el&&this.rl(this.tl,e)&&(this.il(this.tl),t=!0),t}rl(e,t){if(!e.fromCache||!this.Hc())return!0;let n=t!=="Offline";return(!this.options.waitForSyncWhenOnline||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}nl(e){if(e.docChanges.length>0)return!0;let t=this.tl&&this.tl.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}il(e){e=Js.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.el=!0,this.Xc.next(e)}Hc(){return this.options.source!==id.Cache}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Xu=class{constructor(e){this.key=e}},Zu=class{constructor(e){this.key=e}},ad=class{constructor(e,t){this.query=e,this.hl=t,this.Tl=null,this.hasCachedResults=!1,this.current=!1,this.Pl=ue(),this.mutatedKeys=ue(),this.Il=Le(e)?xf(e):Ed(e),this.Rl=new Aa(this.Il)}get Al(){return this.hl}Vl(e,t){let n=t?t.dl:new Yu,s=t?t.Rl:this.Rl,i=t?t.mutatedKeys:this.mutatedKeys,a=s,u=!1,[c,l]=this.fl(this.query,s);e.inorderTraversal(((d,p)=>{let E=s.get(d),y=sA(this.query,p)?p:null,S=!!E&&this.mutatedKeys.has(E.key),F=!!y&&(y.hasLocalMutations||this.mutatedKeys.has(y.key)&&y.hasCommittedMutations),U=!1;E&&y?E.data.isEqual(y.data)?S!==F&&(n.track({type:3,doc:y}),U=!0):this.ml(E,y)||(n.track({type:2,doc:y}),U=!0,(c&&this.Il(y,c)>0||l&&this.Il(y,l)<0)&&(u=!0)):!E&&y?(n.track({type:0,doc:y}),U=!0):E&&!y&&(n.track({type:1,doc:E}),U=!0,(c||l)&&(u=!0)),U&&(y?(a=a.add(y),i=F?i.add(d):i.delete(d)):(a=a.delete(d),i=i.delete(d)))}));let h=this.pl(this.query);if(h)if(Le(this.query)){let d=[];a.forEach((y=>d.push(y)));let p=R_(this.query,d),E=new Aa(xf(this.query));for(let y of p)E=E.add(y);a.forEach((y=>{E.has(y.key)||(i=i.delete(y.key),n.track({type:1,doc:y}))})),a=E}else{let d=this.gl(this.query);for(;a.size>h;){let p=d==="F"?a.last():a.first();a=a.delete(p.key),i=i.delete(p.key),n.track({type:1,doc:p})}}return{Rl:a,dl:n,Za:u,mutatedKeys:i}}pl(e){var t;return Le(e)?(t=CB(e))==null?void 0:t.limit:e.limit||void 0}gl(e){if(Le(e)){let t=CB(e);return t&&t.limit<0?"L":"F"}return e.limitType}fl(e,t){var n;if(Le(e)){let s=(n=CB(e))==null?void 0:n.limit;return[t.size===s?t.last():null,null]}return[e.limitType==="F"&&t.size===this.pl(this.query)?t.last():null,e.limitType==="L"&&t.size===this.pl(this.query)?t.first():null]}ml(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,s){let i=this.Rl;this.Rl=e.Rl,this.mutatedKeys=e.mutatedKeys;let a=e.dl.Wc();a.sort(((h,d)=>(function(E,y){let S=F=>{switch(F){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return Y(20277,{Nt:F})}};return S(E)-S(y)})(h.type,d.type)||this.Il(h.doc,d.doc))),this.yl(n),s=s??!1;let u=t&&!s?this.wl():[],c=this.Pl.size===0&&this.current&&!s?1:0,l=c!==this.Tl;return this.Tl=c,a.length!==0||l?{snapshot:new Js(this.query,e.Rl,i,a,e.mutatedKeys,c===0,l,!1,!!n&&n.resumeToken.approximateByteSize()>0),bl:u}:{bl:u}}Yc(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({Rl:this.Rl,dl:new Yu,mutatedKeys:this.mutatedKeys,Za:!1},!1)):{bl:[]}}Sl(e){return!this.hl.has(e)&&!!this.Rl.has(e)&&!this.Rl.get(e).hasLocalMutations}yl(e){e&&(e.addedDocuments.forEach((t=>this.hl=this.hl.add(t))),e.modifiedDocuments.forEach((t=>{})),e.removedDocuments.forEach((t=>this.hl=this.hl.delete(t))),this.current=e.current)}wl(){if(!this.current)return[];let e=this.Pl;this.Pl=ue(),this.Rl.forEach((n=>{this.Sl(n.key)&&(this.Pl=this.Pl.add(n.key))}));let t=[];return e.forEach((n=>{this.Pl.has(n)||t.push(new Zu(n))})),this.Pl.forEach((n=>{e.has(n)||t.push(new Xu(n))})),t}xl(e){this.hl=e.uu,this.Pl=ue();let t=this.Vl(e.documents);return this.applyChanges(t,!0)}vl(){return Js.fromInitialDocuments(this.query,this.Rl,this.mutatedKeys,this.Tl===0,this.hasCachedResults)}},Md="SyncEngine",od=class{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}},ud=class{constructor(e){this.key=e,this.Dl=!1}},cd=class{constructor(e,t,n,s,i,a){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=a,this.Cl={},this.Fl=new wn((u=>h_(u)),Cc),this.Ol=new Map,this.Ml=new Set,this.Nl=new Te(X.comparator),this.Bl=new Map,this.Ll=new Ia,this.$l={},this.Ul=new Map,this.kl=Jr.G_(),this.onlineState="Unknown",this.Ql=void 0}get isPrimaryClient(){return this.Ql===!0}};async function vA(r,e,t=!0){let n=q_(r),s,i=n.Fl.get(e);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.vl()):s=await V_(n,e,t,!0),s}async function RA(r,e){let t=q_(r);await V_(t,e,!0,!1)}async function V_(r,e,t,n){let s=await fA(r.localStore,Le(e)?e:Yt(e)),i=s.targetId,a=r.sharedClientState.addLocalQueryTarget(i,t),u;return n&&(u=await SA(r,e,i,a==="current",s.resumeToken)),r.isPrimaryClient&&t&&N_(r.remoteStore,s),u}async function SA(r,e,t,n,s){r.ql=(d,p,E)=>(async function(S,F,U,z){let re=F.view.Vl(U);re.Za&&(re=await zm(S.localStore,F.query,!1).then((({documents:A})=>F.view.Vl(A,re))));let me=z&&z.targetChanges.get(F.targetId),ye=z&&z.targetMismatches.get(F.targetId)!=null,Ee=F.view.applyChanges(re,S.isPrimaryClient,me,ye);return Ym(S,F.targetId,Ee.bl),Ee.snapshot})(r,d,p,E);let i=await zm(r.localStore,e,!0),a=new ad(e,i.uu),u=a.Vl(i.documents),c=ha.createSynthesizedTargetChangeForCurrentChange(t,n&&r.onlineState!=="Offline",s),l=a.applyChanges(u,r.isPrimaryClient,c);Ym(r,t,l.bl);let h=new od(e,t,a);return r.Fl.set(e,h),r.Ol.has(t)?r.Ol.get(t).push(e):r.Ol.set(t,[e]),l.snapshot}async function PA(r,e,t){let n=ne(r),s=n.Fl.get(e),i=n.Ol.get(s.targetId);if(i.length>1)return n.Ol.set(s.targetId,i.filter((a=>!Cc(a,e)))),void n.Fl.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await Yf(n.localStore,s.targetId,!1).then((()=>{n.sharedClientState.clearQueryState(s.targetId),t&&Pd(n.remoteStore,s.targetId),ld(n,s.targetId)})).catch($s)):(ld(n,s.targetId),await Yf(n.localStore,s.targetId,!0))}async function NA(r,e){let t=ne(r),n=t.Fl.get(e),s=t.Ol.get(n.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(n.targetId),Pd(t.remoteStore,n.targetId))}async function OA(r,e,t){let n=GA(r);try{let s=await(function(a,u){let c=ne(a),l=Ie.now(),h=u.reduce(((E,y)=>E.add(y.key)),ue()),d,p;return c.persistence.runTransaction("Locally write mutations","readwrite",(E=>{let y=lt(),S=ue();return c.iu.getEntries(E,h).next((F=>{y=F,y.forEach(((U,z)=>{z.isValidDocument()||(S=S.add(U))}))})).next((()=>c.localDocuments.getOverlayedDocuments(E,y))).next((F=>{d=F;let U=[];for(let z of u){let re=kT(z,d.get(z.key).overlayedDocument);re!=null&&U.push(new en(z.key,re,EE(re.value.mapValue),dn.exists(!0)))}return c.mutationQueue.addMutationBatch(E,l,U,u)})).next((F=>{p=F;let U=F.applyToLocalDocumentSet(d,S);return c.documentOverlayCache.saveOverlays(E,F.batchId,U)}))})).then((()=>({batchId:p.batchId,changes:LE(d)})))})(n.localStore,e);n.sharedClientState.addPendingMutation(s.batchId),(function(a,u,c){let l=a.$l[a.currentUser.toKey()];l||(l=new Te(ae)),l=l.insert(u,c),a.$l[a.currentUser.toKey()]=l})(n,s.batchId,t),await Fa(n,s.changes),await Ec(n.remoteStore)}catch(s){let i=Fd(s,"Failed to persist write");t.reject(i)}}async function M_(r,e){let t=ne(r);try{let n=await lA(t.localStore,e);e.targetChanges.forEach(((s,i)=>{let a=t.Bl.get(i);a&&($(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?a.Dl=!0:s.modifiedDocuments.size>0?$(a.Dl,14607):s.removedDocuments.size>0&&($(a.Dl,42227),a.Dl=!1))})),await Fa(t,n,e)}catch(n){await $s(n)}}function $m(r,e,t){let n=ne(r);if(n.isPrimaryClient&&t===0||!n.isPrimaryClient&&t===1){let s=[];n.Fl.forEach(((i,a)=>{let u=a.view.Yc(e);u.snapshot&&s.push(u.snapshot)})),(function(a,u){let c=ne(a);c.onlineState=u;let l=!1;c.queries.forEach(((h,d)=>{for(let p of d.jc)p.Yc(u)&&(l=!0)})),l&&Vd(c)})(n.eventManager,e),s.length&&n.Cl.gr(s),n.onlineState=e,n.isPrimaryClient&&n.sharedClientState.setOnlineState(e)}}async function xA(r,e,t){let n=ne(r);n.sharedClientState.updateQueryState(e,"rejected",t);let s=n.Bl.get(e),i=s&&s.key;if(i){let a=new Te(X.comparator);a=a.insert(i,kt.newNoDocument(i,te.min()));let u=ue().add(i),c=new Ba(te.min(),new Map,new Te(ae),a,lt(),u);await M_(n,c),n.Nl=n.Nl.remove(i),n.Bl.delete(e),Gd(n)}else await Yf(n.localStore,e,!1).then((()=>ld(n,e,t))).catch($s)}async function FA(r,e){let t=ne(r),n=e.batch.batchId;try{let s=await cA(t.localStore,e);U_(t,n,null),G_(t,n),t.sharedClientState.updateMutationState(n,"acknowledged"),await Fa(t,s)}catch(s){await $s(s)}}async function LA(r,e,t){let n=ne(r);try{let s=await(function(a,u){let c=ne(a);return c.persistence.runTransaction("Reject batch","readwrite-primary",(l=>{let h;return c.mutationQueue.lookupMutationBatch(l,u).next((d=>($(d!==null,37113),h=d.keys(),c.mutationQueue.removeMutationBatch(l,d)))).next((()=>c.mutationQueue.performConsistencyCheck(l))).next((()=>c.documentOverlayCache.removeOverlaysForBatchId(l,h,u))).next((()=>c.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(l,h))).next((()=>c.localDocuments.getDocuments(l,h)))}))})(n.localStore,e);U_(n,e,t),G_(n,e),n.sharedClientState.updateMutationState(e,"rejected",t),await Fa(n,s)}catch(s){await $s(s)}}function G_(r,e){(r.Ul.get(e)||[]).forEach((t=>{t.resolve()})),r.Ul.delete(e)}function U_(r,e,t){let n=ne(r),s=n.$l[n.currentUser.toKey()];if(s){let i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),n.$l[n.currentUser.toKey()]=s}}function ld(r,e,t=null){r.sharedClientState.removeLocalQueryTarget(e);for(let n of r.Ol.get(e))r.Fl.delete(n),t&&r.Cl.Kl(n,t);r.Ol.delete(e),r.isPrimaryClient&&r.Ll.fo(e).forEach((n=>{r.Ll.containsKey(n)||H_(r,n)}))}function H_(r,e){r.Ml.delete(e.path.canonicalString());let t=r.Nl.get(e);t!==null&&(Pd(r.remoteStore,t),r.Nl=r.Nl.remove(e),r.Bl.delete(t),Gd(r))}function Ym(r,e,t){for(let n of t)n instanceof Xu?(r.Ll.addReference(n.key,e),kA(r,n)):n instanceof Zu?(K(Md,"Document no longer in limbo: "+n.key),r.Ll.removeReference(n.key,e),r.Ll.containsKey(n.key)||H_(r,n.key)):Y(19791,{Wl:n})}function kA(r,e){let t=e.key,n=t.path.canonicalString();r.Nl.get(t)||r.Ml.has(n)||(K(Md,"New document in limbo: "+t),r.Ml.add(n),Gd(r))}function Gd(r){for(;r.Ml.size>0&&r.Nl.size<r.maxConcurrentLimboResolutions;){let e=r.Ml.values().next().value;r.Ml.delete(e);let t=new X(he.fromString(e)),n=r.kl.next();r.Bl.set(n,new ud(t)),r.Nl=r.Nl.insert(t,n),N_(r.remoteStore,new Ks(Yt(Oa(t.path)),n,"TargetPurposeLimboResolution",Vs.Br))}}async function Fa(r,e,t){let n=ne(r),s=[],i=[],a=[];n.Fl.isEmpty()||(n.Fl.forEach(((u,c)=>{a.push(n.ql(c,e,t).then((l=>{var h;if((l||t)&&n.isPrimaryClient){let d=l?!l.fromCache:(h=t==null?void 0:t.targetChanges.get(c.targetId))==null?void 0:h.current;n.sharedClientState.updateQueryState(c.targetId,d?"current":"not-current")}if(l){s.push(l);let d=zf.ka(c.targetId,l);i.push(d)}})))})),await Promise.all(a),n.Cl.gr(s),await(async function(c,l){let h=ne(c);try{await h.persistence.runTransaction("notifyLocalViewChanges","readwrite",(d=>M.forEach(l,(p=>M.forEach(p.$a,(E=>h.persistence.referenceDelegate.addReference(d,p.targetId,E))).next((()=>M.forEach(p.Ua,(E=>h.persistence.referenceDelegate.removeReference(d,p.targetId,E)))))))))}catch(d){if(!Ys(d))throw d;K(Sd,"Failed to update sequence numbers: "+d)}for(let d of l){let p=d.targetId;if(!d.fromCache){let E=h.tu.get(p),y=E.snapshotVersion,S=E.withLastLimboFreeSnapshotVersion(y);h.tu=h.tu.insert(p,S)}}})(n.localStore,i))}async function VA(r,e){let t=ne(r);if(!t.currentUser.isEqual(e)){K(Md,"User change. New user:",e.toKey());let n=await S_(t.localStore,e);t.currentUser=e,(function(i,a){i.Ul.forEach((u=>{u.forEach((c=>{c.reject(new q(V.CANCELLED,a))}))})),i.Ul.clear()})(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,n.removedBatchIds,n.addedBatchIds),await Fa(t,n._u)}}function MA(r,e){let t=ne(r),n=t.Bl.get(e);if(n&&n.Dl)return ue().add(n.key);{let s=ue(),i=t.Ol.get(e);if(!i)return s;for(let a of i??[]){let u=t.Fl.get(a);s=s.unionWith(u.view.Al)}return s}}function q_(r){let e=ne(r);return e.remoteStore.remoteSyncer.applyRemoteEvent=M_.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=MA.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=xA.bind(null,e),e.Cl.gr=AA.bind(null,e.eventManager),e.Cl.Kl=bA.bind(null,e.eventManager),e}function GA(r){let e=ne(r);return e.remoteStore.remoteSyncer.applySuccessfulWrite=FA.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=LA.bind(null,e),e}var zr=class{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Bc(e.databaseInfo.databaseId),this.sharedClientState=this.jl(e),this.persistence=this.zl(e),await this.persistence.start(),this.localStore=this.Hl(e),this.gcScheduler=this.Jl(e,this.localStore),this.indexBackfillerScheduler=this.Yl(e,this.localStore)}Jl(e,t){return null}Yl(e,t){return null}Hl(e){return uA(this.persistence,new Qf,e.initialUser,this.serializer)}zl(e){return new zu(Jf.Ho,this.serializer)}jl(e){return new nd}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}};zr.provider={build:()=>new zr};var ec=class extends zr{constructor(e){super(),this.cacheSizeBytes=e}Jl(e,t){$(this.persistence.referenceDelegate instanceof Wu,46915);let n=this.persistence.referenceDelegate.garbageCollector;return new sh(n,e.asyncQueue,t)}zl(e){let t=this.cacheSizeBytes!==void 0?Tt.withCacheSize(this.cacheSizeBytes):Tt.DEFAULT;return new zu((n=>Wu.Ho(n,t)),this.serializer)}};var zs=class{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>$m(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=VA.bind(null,this.syncEngine),await TA(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return(function(){return new sd})()}createDatastore(e){let t=Bc(e.databaseInfo.databaseId),n=E0(e.databaseInfo);return _0(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return(function(n,s,i,a,u){return new Zf(n,s,i,a,u)})(this.localStore,this.datastore,e.asyncQueue,(t=>$m(this.syncEngine,t,0)),(function(){return bu.cn()?new bu:new WB})())}createSyncEngine(e,t){return(function(s,i,a,u,c,l,h){let d=new cd(s,i,a,u,c,l);return h&&(d.Ql=!0),d})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await(async function(s){let i=ne(s);K(rn,"RemoteStore shutting down."),i.xu.add(5),await xa(i),i.Du.shutdown(),i.Cu.set("Unknown")})(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}};zs.provider={build:()=>new zs};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Zn="FirestoreClient",Bd=class{constructor(e,t,n,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this._databaseInfo=s,this.user=Ke.UNAUTHENTICATED,this.clientId=_s.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,(async a=>{K(Zn,"Received user=",a.uid),await this.authCredentialListener(a),this.user=a})),this.appCheckCredentials.start(n,(a=>(K(Zn,"Received new app check token=",a),this.appCheckCredentialListener(a,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();let e=new Lt;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){let n=Fd(t,"Failed to shutdown persistence");e.reject(n)}})),e.promise}};async function mB(r,e){r.asyncQueue.verifyOperationInProgress(),K(Zn,"Initializing OfflineComponentProvider");let t=r.configuration;await e.initialize(t);let n=t.initialUser;r.setCredentialChangeListener((async s=>{n.isEqual(s)||(await S_(e.localStore,s),n=s)})),e.persistence.setDatabaseDeletedListener((()=>r.terminate())),r._offlineComponents=e}async function Xm(r,e){r.asyncQueue.verifyOperationInProgress();let t=await UA(r);K(Zn,"Initializing OnlineComponentProvider"),await e.initialize(t,r.configuration),r.setCredentialChangeListener((n=>Wm(e.remoteStore,n))),r.setAppCheckTokenChangeListener(((n,s)=>Wm(e.remoteStore,s))),r._onlineComponents=e}async function UA(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){K(Zn,"Using user provided OfflineComponentProvider");try{await mB(r,r._uninitializedComponentsProvider._offline)}catch(e){let t=e;if(!(function(s){return s.name==="FirebaseError"?s.code===V.FAILED_PRECONDITION||s.code===V.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(t))throw t;bt("Error using user provided cache. Falling back to memory cache: "+t),await mB(r,new zr)}}else K(Zn,"Using default OfflineComponentProvider"),await mB(r,new ec(void 0));return r._offlineComponents}async function j_(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(K(Zn,"Using user provided OnlineComponentProvider"),await Xm(r,r._uninitializedComponentsProvider._online)):(K(Zn,"Using default OnlineComponentProvider"),await Xm(r,new zs))),r._onlineComponents}function HA(r){return j_(r).then((e=>e.syncEngine))}async function tc(r){let e=await j_(r),t=e.eventManager;return t.onListen=vA.bind(null,e.syncEngine),t.onUnlisten=PA.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=RA.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=NA.bind(null,e.syncEngine),t}function K_(r,e,t,n){let s=new Ta(n),i=new ba(e,s,t);return r.asyncQueue.enqueueAndForget((async()=>Ld(await tc(r),i))),()=>{s.Bu(),r.asyncQueue.enqueueAndForget((async()=>kd(await tc(r),i)))}}function J_(r,e,t={}){let n=new Lt;return r.asyncQueue.enqueueAndForget((async()=>(function(i,a,u,c,l){let h=new Ta({next:p=>{h.Bu(),a.enqueueAndForget((()=>kd(i,d)));let E=p.docs.has(u);!E&&p.fromCache?l.reject(new q(V.UNAVAILABLE,"Failed to get document because the client is offline.")):E&&p.fromCache&&c&&c.source==="server"?l.reject(new q(V.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):l.resolve(p)},error:p=>l.reject(p)}),d=new ba(Oa(u.path),h,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return Ld(i,d)})(await tc(r),r.asyncQueue,e,t,n))),n.promise}function z_(r,e,t={}){let n=new Lt;return r.asyncQueue.enqueueAndForget((async()=>(function(i,a,u,c,l){let h=new Ta({next:p=>{h.Bu(),a.enqueueAndForget((()=>kd(i,d))),p.fromCache&&c.source==="server"?l.reject(new q(V.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):l.resolve(p)},error:p=>l.reject(p)}),d=new ba(u instanceof gh?j0(u):u,h,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return Ld(i,d)})(await tc(r),r.asyncQueue,e,t,n))),n.promise}function W_(r,e){let t=new Lt;return r.asyncQueue.enqueueAndForget((async()=>OA(await HA(r),e,t))),t.promise}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ud=class{constructor(e,t,n,s,i){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new Se(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){let e=new qA(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){let t=this._document.data.field(Jn("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}},qA=class extends Ud{data(){return super.data()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var nc=class{convertValue(e,t="none"){switch(Oe(e)){case 0:return null;case 2:return e.booleanValue;case 3:if("mapValue"in e){if(qn(e))return this.convertToInt32Value(e.mapValue);if(Rt(e))return this.convertToDecimal128Value(e.mapValue)}return ge(e.integerValue||e.doubleValue);case 4:return this.convertTimestamp(e.timestampValue);case 6:return this.convertServerTimestamp(e,t);case 7:return e.stringValue;case 8:return"bytesValue"in e?this.convertBytes(xt(e.bytesValue)):this.convertToBytesWithSubtype(e.mapValue);case 9:return this.convertReference(e.referenceValue);case 11:return this.convertGeoPoint(e.geoPointValue);case 13:return this.convertArray(e.arrayValue,t);case 15:return this.convertObject(e.mapValue,t);case 14:return this.convertVectorValue(e.mapValue);case 12:return this.convertToRegexValue(e.mapValue);case 10:return this.convertToBsonObjectId(e.mapValue);case 5:return this.convertToBsonTimestamp(e.mapValue);case 16:return qr.instance();case 1:return jr.instance();default:throw Y(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){let n={};return er(e,((s,i)=>{n[s]=this.convertValue(i,t)})),n}convertVectorValue(e){var n,s,i;let t=(i=(s=(n=e.fields)==null?void 0:n[Sr].arrayValue)==null?void 0:s.values)==null?void 0:i.map((a=>ge(a.doubleValue)));return new _t(t)}convertToBsonObjectId(e){var n,s;let t=((s=(n=e.fields)==null?void 0:n[Pr])==null?void 0:s.stringValue)??"";return new xs(t)}convertToBytesWithSubtype(e){var u;let t=(u=e.fields)==null?void 0:u[As],n=t==null?void 0:t.bytesValue;if(!n)throw new Error("Received incorrect bytesValue for Bytes with subtype");let s=xt(n).toUint8Array();if(s.length===0)throw new Error("Received empty bytesValue for Bytes with subtype");let i=s[0],a=s.slice(1);return new Zt(De.fromUint8Array(a),i)}convertToBsonTimestamp(e){var i,a,u,c,l,h,d;let t=(i=e.fields)==null?void 0:i[fn],n=Number((c=(u=(a=t==null?void 0:t.mapValue)==null?void 0:a.fields)==null?void 0:u[ra])==null?void 0:c.integerValue),s=Number((d=(h=(l=t==null?void 0:t.mapValue)==null?void 0:l.fields)==null?void 0:h[sa])==null?void 0:d.integerValue);return new Fs(n,s)}convertToRegexValue(e){var s,i,a,u,c,l,h,d,p,E;let t=((c=(u=(a=(i=(s=e.fields)==null?void 0:s[zt])==null?void 0:i.mapValue)==null?void 0:a.fields)==null?void 0:u[Is])==null?void 0:c.stringValue)??"",n=((E=(p=(d=(h=(l=e.fields)==null?void 0:l[zt])==null?void 0:h.mapValue)==null?void 0:d.fields)==null?void 0:p[Ts])==null?void 0:E.stringValue)??"";return new Ms(t,n)}convertToInt32Value(e){var n,s;let t=Number((s=(n=e.fields)==null?void 0:n[tr])==null?void 0:s.integerValue);return new ks(t)}convertToDecimal128Value(e){var n,s;let t=((s=(n=e.fields)==null?void 0:n[_n])==null?void 0:s.stringValue)??"";return new Ls(t)}convertGeoPoint(e){return new pn(ge(e.latitude),ge(e.longitude))}convertArray(e,t){return(e.values||[]).map((n=>this.convertValue(n,t)))}convertServerTimestamp(e,t){switch(t){case"previous":let n=Pa(e);return n==null?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(ws(e));default:return null}}convertTimestamp(e){let t=En(e);return new Ie(t.seconds,t.nanos)}convertDocumentKey(e,t){let n=he.fromString(e);$(qE(n),9688,{name:e});let s=new na(n.get(1),n.get(3)),i=new X(n.popFirst(5));return s.isEqual(t)||mn(`A document reference to ${i} refers to a different database (${s.projectId}/${s.database}), which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Q_(r,e,t){let n;return n=r?t&&(t.merge||t.mergeFields)?r.toFirestore(e,t):r.toFirestore(e):e,n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Zm="AsyncQueue",rc=class{constructor(e=Promise.resolve()){this._E=[],this.oE=!1,this.aE=[],this.uE=null,this.cE=!1,this.lE=!1,this.EE=[],this._r=new Ru(this,"async_queue_retry"),this.hE=()=>{let n=gB();n&&K(Zm,"Visibility state changed to "+n.visibilityState),this._r.Xn()},this.TE=e;let t=gB();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this.hE)}get isShuttingDown(){return this.oE}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.PE(),this.IE(e)}enterRestrictedMode(e){if(!this.oE){this.oE=!0,this.lE=e||!1;let t=gB();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this.hE)}}enqueue(e){if(this.PE(),this.oE)return new Promise((()=>{}));let t=new Lt;return this.IE((()=>this.oE&&this.lE?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this._E.push(e),this.RE())))}async RE(){if(this._E.length!==0){try{await this._E[0](),this._E.shift(),this._r.reset()}catch(e){if(!Ys(e))throw e;K(Zm,"Operation failed with retryable error: "+e)}this._E.length>0&&this._r.Yn((()=>this.RE()))}}IE(e){let t=this.TE.then((()=>(this.cE=!0,e().catch((n=>{throw this.uE=n,this.cE=!1,mn("INTERNAL UNHANDLED ERROR: ",eE(n)),n})).then((n=>(this.cE=!1,n))))));return this.TE=t,t}enqueueAfterDelay(e,t,n){this.PE(),this.EE.indexOf(e)>-1&&(t=0);let s=td.createAndSchedule(this,e,t,n,(i=>this.AE(i)));return this.aE.push(s),s}PE(){this.uE&&Y(47125,{VE:eE(this.uE)})}verifyOperationInProgress(){}async dE(){let e;do e=this.TE,await e;while(e!==this.TE)}fE(e){for(let t of this.aE)if(t.timerId===e)return!0;return!1}mE(e){return this.dE().then((()=>{this.aE.sort(((t,n)=>t.targetTimeMs-n.targetTimeMs));for(let t of this.aE)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.dE()}))}pE(e){this.EE.push(e)}AE(e){let t=this.aE.indexOf(e);this.aE.splice(t,1)}};function eE(r){let e=r.message||"";return r.stack&&(e=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var sn=class extends hc{constructor(e,t,n,s){super(e,t,n,s),this.type="firestore",this._queue=new rc,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){let e=this._firestoreClient.terminate();this._queue=new rc(e),this._firestoreClient=void 0,await e}}};function Hd(r,e){let t=typeof r=="object"?r:ao(),n=typeof r=="string"?r:e||hu,s=mi(t,"firestore").getImmediate({identifier:n});if(!s._initialized){let i=Yp("firestore");i&&QE(s,...i)}return s}function La(r){if(r._terminated)throw new q(V.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||jA(r),r._firestoreClient}function jA(r){var n,s,i,a;let e=r._freezeSettings(),t=w0(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,(s=r._app)==null?void 0:s.options.apiKey,e);r._componentsProvider||(i=e.localCache)!=null&&i._offlineComponentProvider&&((a=e.localCache)!=null&&a._onlineComponentProvider)&&(r._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),r._firestoreClient=new Bd(r._authCredentials,r._appCheckCredentials,r._queue,t,r._componentsProvider&&(function(c){let l=c==null?void 0:c._online.build();return{_offline:c==null?void 0:c._offline.build(l),_online:l}})(r._componentsProvider))}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ws=class extends nc{constructor(e){super(),this.firestore=e}convertBytes(e){return new Zt(e)}convertReference(e){let t=this.convertDocumentKey(e,this.firestore._databaseId);return new Se(this.firestore,null,t)}};/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Vn=class{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}},Un=class r extends Ud{constructor(e,t,n,s,i,a){super(e,t,n,s,a),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){let t=new br(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){let n=this._document.data.field(Jn("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new q(V.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");let e=this._document,t={};return t.type=r._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}};Un._jsonSchemaVersion="firestore/documentSnapshot/1.0",Un._jsonSchema={type:Re("string",Un._jsonSchemaVersion),bundleSource:Re("string","DocumentSnapshot"),bundleName:Re("string"),bundle:Re("string")};var br=class extends Un{data(e={}){return super.data(e)}},Hn=class r{constructor(e,t,n,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new Vn(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){let e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((n=>{e.call(t,new br(this._firestore,this._userDataWriter,n.key,n,new Vn(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){let t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new q(V.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(s,i){if(s._snapshot.oldDocs.isEmpty()){let a=0;return s._snapshot.docChanges.map((u=>{Le(s._snapshot.query)?xf(s._snapshot.query):Ed(s.query._query);let c=new br(s._firestore,s._userDataWriter,u.doc.key,u.doc,new Vn(s._snapshot.mutatedKeys.has(u.doc.key),s._snapshot.fromCache),s.query.converter);return u.doc,{type:"added",doc:c,oldIndex:-1,newIndex:a++}}))}{let a=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((u=>i||u.type!==3)).map((u=>{let c=new br(s._firestore,s._userDataWriter,u.doc.key,u.doc,new Vn(s._snapshot.mutatedKeys.has(u.doc.key),s._snapshot.fromCache),s.query.converter),l=-1,h=-1;return u.type!==0&&(l=a.indexOf(u.doc.key),a=a.delete(u.doc.key)),u.type!==1&&(a=a.add(u.doc),h=a.indexOf(u.doc.key)),{type:KA(u.type),doc:c,oldIndex:l,newIndex:h}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new q(V.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");let e={};e.type=r._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=_s.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;let t=[],n=[],s=[];return this.docs.forEach((i=>{i._document!==null&&(t.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}};function KA(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return Y(61501,{type:r})}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Hn._jsonSchemaVersion="firestore/querySnapshot/1.0",Hn._jsonSchema={type:Re("string",Hn._jsonSchemaVersion),bundleSource:Re("string","QuerySnapshot"),bundleName:Re("string"),bundle:Re("string")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ty(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new q(V.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}var ka=class{},qd=class extends ka{};function ny(r,e,...t){let n=[];e instanceof ka&&n.push(e),n=n.concat(t),(function(i){let a=i.filter((c=>c instanceof jd)).length,u=i.filter((c=>c instanceof _c)).length;if(a>1||a>0&&u>0)throw new q(V.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(n);for(let s of n)r=s._apply(r);return r}var _c=class r extends qd{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new r(e,t,n)}_apply(e){let t=this._parse(e);return sy(e._query,t),new jn(e.firestore,e.converter,cc(e._query,t))}_parse(e){let t=fc(e.firestore);return(function(i,a,u,c,l,h,d){let p;if((function(S,F){if(typeof S=="number"&&isNaN(S)&&F!=="=="&&F!=="!="&&F!=="array-contains")throw new Error("Invalid query. You can only perform '==' and '!=' comparisons on NaN.");if(S===null&&F!=="=="&&F!=="!="&&F!=="array-contains")throw new Error("Invalid query. You can only perform '==' and '!=' comparisons on Null.")})(d,h),l.isKeyField()){if(h==="array-contains"||h==="array-contains-any")throw new q(V.INVALID_ARGUMENT,`Invalid Query. You can't perform '${h}' queries on documentId().`);if(h==="in"||h==="not-in"){Y_(d,h);let y=[];for(let S of d)y.push($_(c,i,S));p={arrayValue:{values:y}}}else p=$_(c,i,d)}else h!=="in"&&h!=="not-in"&&h!=="array-contains-any"||Y_(d,h),p=e_(u,a,d,h==="in"||h==="not-in");return ve.create(l,h,p)})(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}};function ry(r,e,t){let n=e,s=Jn("where",r);return _c._create(s,n,t)}var jd=class r extends ka{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new r(e,t)}_parse(e){let t=this._queryConstraints.map((n=>n._parse(e))).filter((n=>n.getFilters().length>0));return t.length===1?t[0]:St.create(t,this._getOperator())}_apply(e){let t=this._parse(e);return t.getFilters().length===0?e:((function(s,i){let a=s,u=i.getFlattenedFilters();for(let c of u)sy(a,c),a=cc(a,c)})(e._query,t),new jn(e.firestore,e.converter,cc(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}};function $_(r,e,t){if(typeof(t=we(t))=="string"){if(t==="")throw new q(V.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!md(e)&&t.indexOf("/")!==-1)throw new q(V.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);let n=e.path.child(he.fromString(t));if(!X.isDocumentKey(n))throw new q(V.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return pd(r,new X(n))}if(t instanceof Se)return pd(r,t._key);throw new q(V.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Ra(t)}.`)}function Y_(r,e){if(!Array.isArray(r)||r.length===0)throw new q(V.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function sy(r,e){let t=(function(s,i){for(let a of s)for(let u of a.getFlattenedFilters())if(i.indexOf(u.op)>=0)return u.op;return null})(r.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(e.op));if(t!==null)throw t===e.op?new q(V.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new q(V.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function X_(r){return(function(t,n){if(typeof t!="object"||t===null)return!1;let s=t;for(let i of n)if(i in s&&typeof s[i]=="function")return!0;return!1})(r,["next","error","complete"])}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function iy(r){r=yt(r,Se);let e=yt(r.firestore,sn),t=La(e);return J_(t,r._key).then((n=>By(e,r,n)))}function ay(r){r=yt(r,jn);let e=yt(r.firestore,sn),t=La(e),n=new Ws(e);return ty(r._query),z_(t,r._query).then((s=>new Hn(e,n,r,s)))}function oy(r,e,t){r=yt(r,Se);let n=yt(r.firestore,sn),s=Q_(r.converter,e,t),i=fc(n);return ly(n,[YE(i,"setDoc",r._key,s,r.converter!==null,t).toMutation(r._key,dn.none())])}function uy(r,e,t,...n){r=yt(r,Se);let s=yt(r.firestore,sn),i=fc(s),a;return a=typeof(e=we(e))=="string"||e instanceof Ur?ZE(i,"updateDoc",r._key,e,t,n):XE(i,"updateDoc",r._key,e),ly(s,[a.toMutation(r._key,dn.exists(!0))])}function cy(r,...e){var l,h,d;r=we(r);let t={includeMetadataChanges:!1,source:"default"},n=0;typeof e[n]!="object"||X_(e[n])||(t=e[n++]);let s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(X_(e[n])){let p=e[n];e[n]=(l=p.next)==null?void 0:l.bind(p),e[n+1]=(h=p.error)==null?void 0:h.bind(p),e[n+2]=(d=p.complete)==null?void 0:d.bind(p)}let i,a,u;if(r instanceof Se)a=yt(r.firestore,sn),u=Oa(r._key.path),i={next:p=>{e[n]&&e[n](By(a,r,p))},error:e[n+1],complete:e[n+2]};else{let p=yt(r,jn);a=yt(p.firestore,sn),u=p._query;let E=new Ws(a);i={next:y=>{e[n]&&e[n](new Hn(a,E,p,y))},error:e[n+1],complete:e[n+2]},ty(r._query)}let c=La(a);return K_(c,u,s,i)}function ly(r,e){let t=La(r);return W_(t,e)}function By(r,e,t){let n=t.docs.get(e._key),s=new Ws(r);return new Un(r,s,e._key,n,new Vn(t.hasPendingWrites,t.fromCache),e.converter)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Z_="@firebase/firestore",ey="4.20.0";(function(e,t=!0){tE(On),Nn(new wt("firestore",((n,{instanceIdentifier:s,options:i})=>{let a=n.getProvider("app").getImmediate(),u=new sn(new Iu(n.getProvider("auth-internal")),new Au(a,n.getProvider("app-check-internal")),BE(a,s),a);return i={useFetchStreams:t,...i},u._setSettings(i),u}),"PUBLIC").setMultipleInstances(!0)),Nt(Z_,ey,e),Nt(Z_,ey,"esm2020")})();function JA(r){try{return Mo(r,{persistence:[Mi,Vi,ss]})}catch(e){if(e.code==="auth/already-initialized")return zl(r);throw e}}window.APWebFirebase=Object.freeze([{initializeApp:hl,getApps:_C},{getAuth:JA,setPersistence:ql,indexedDBLocalPersistence:Mi,browserLocalPersistence:Vi,browserSessionPersistence:ss,onAuthStateChanged:jl,signInWithEmailAndPassword:Hl,signOut:Kl,sendPasswordResetEmail:Ul},{getFirestore:Hd,collection:wd,doc:Dd,getDoc:iy,getDocs:ay,onSnapshot:cy,query:ny,serverTimestamp:Ad,setDoc:oy,updateDoc:uy,where:ry}]);})();
