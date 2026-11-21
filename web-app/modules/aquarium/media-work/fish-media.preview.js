/* PREVIEW ONLY: same-origin media URL and portable SHA-256 for HTTP QA. */
(function(host){
'use strict';
const LIMIT=4*1024*1024,DB='agenda_aquarium_media_v1',STORE='packs';
const COLORS=['original','blue','gold'],PHASES=['baby','teen','adult'],SCENES=['aq-jardim','aq-ruinas','aq-cristais','aq-cachoeira','aq-naufragio'];
const REQUIRED=COLORS.flatMap(c=>PHASES.map(p=>'fish-'+c+'-'+p)).concat(SCENES);
const PREFIX='data:image/webp;base64,',encoder=new TextEncoder();
let config=null,pack=null,persistent=false,state='idle',error='',generation=0,tail=Promise.resolve(),initial=null,pending=null,picker=null,dbPending=null;
const fail=message=>new Error(message),serial=fn=>{const next=tail.then(fn,fn);tail=next.catch(()=>{});return next};
function emit(next,message=''){state=next;error=message;host.dispatchEvent?.(new Event('ap-aquarium-media'))}
function storageError(cause){return fail(cause?.name==='QuotaExceededError'?'Não há espaço para guardar o aquário neste aparelho. Libere espaço e tente novamente.':'Não foi possível guardar o aquário para uso offline. Verifique o armazenamento do aplicativo e tente novamente.')}
function open(){
 if(dbPending)return dbPending;
 dbPending=new Promise((resolve,reject)=>{
  if(!host.indexedDB){reject(storageError());return}
  let request,settled=false;try{request=host.indexedDB.open(DB,1)}catch(e){reject(storageError(e));return}
  const stop=e=>{if(settled)return;settled=true;reject(storageError(e))};
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};
  request.onerror=()=>stop(request.error);request.onblocked=()=>stop();
  request.onsuccess=()=>{const db=request.result;if(settled){db.close();return}settled=true;db.onversionchange=()=>{db.close();dbPending=null};resolve(db)};
 }).catch(e=>{dbPending=null;throw e});return dbPending;
}
async function stored(mode,key,value){
 const db=await open();return new Promise((resolve,reject)=>{
  let tx,request,result;try{tx=db.transaction(STORE,mode==='get'?'readonly':'readwrite');const store=tx.objectStore(STORE);request=mode==='get'?store.get(key):mode==='delete'?store.delete(key):store.put(value,key)}catch(e){reject(storageError(e));return}
  request.onsuccess=()=>{result=request.result};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(storageError(tx.error||request.error));tx.onerror=()=>{};
 });
}
function portableSHA(bytes){
 const constants=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const size=Math.ceil((bytes.length+9)/64)*64,data=new Uint8Array(size);data.set(bytes);data[bytes.length]=128;const bits=bytes.length*8;for(let i=0;i<8;i++)data[size-1-i]=Math.floor(bits/2**(i*8))&255;
 const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],words=new Uint32Array(64),rr=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let offset=0;offset<size;offset+=64){for(let i=0;i<16;i++){const p=offset+i*4;words[i]=((data[p]<<24)|(data[p+1]<<16)|(data[p+2]<<8)|data[p+3])>>>0}for(let i=16;i<64;i++){const a=words[i-15],b=words[i-2];words[i]=(words[i-16]+(rr(a,7)^rr(a,18)^(a>>>3))+words[i-7]+(rr(b,17)^rr(b,19)^(b>>>10)))>>>0}
  let [a,b,c,d,e,f,g,k]=h;for(let i=0;i<64;i++){const t1=(k+(rr(e,6)^rr(e,11)^rr(e,25))+((e&f)^(~e&g))+constants[i]+words[i])>>>0,t2=((rr(a,2)^rr(a,13)^rr(a,22))+((a&b)^(a&c)^(b&c)))>>>0;k=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0}for(const[i,n]of [a,b,c,d,e,f,g,k].entries())h[i]=(h[i]+n)>>>0;
 }
 return h.map(n=>n.toString(16).padStart(8,'0')).join('');
}
async function digest(bytes){return host.crypto?.subtle?Array.from(new Uint8Array(await host.crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join(''):portableSHA(bytes)}
function previewURL(value){try{const u=new URL(value,host.location.href);return (u.protocol==='http:'||u.protocol==='https:')&&u.origin===host.location.origin&&!u.username&&!u.password}catch{return false}}
const number=(n,min=0,max=1)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
function point(value,length=2){if(!Array.isArray(value)||value.length!==length||value.some(n=>!number(n)))throw fail('As coordenadas do aquário são inválidas.');return value.slice()}
function dimensions(bytes){
 const text=(i,n)=>String.fromCharCode(...bytes.subarray(i,i+n)),u32=i=>(bytes[i]|bytes[i+1]<<8|bytes[i+2]<<16|bytes[i+3]<<24)>>>0,u24=i=>bytes[i]|bytes[i+1]<<8|bytes[i+2]<<16;
 if(bytes.length<20||text(0,4)!=='RIFF'||text(8,4)!=='WEBP'||u32(4)+8!==bytes.length)throw fail('Uma imagem do aquário está incompleta.');
 let width=0,height=0,frame=false;
 for(let i=12;i<bytes.length;){if(i+8>bytes.length)throw fail('Uma imagem do aquário está incompleta.');const type=text(i,4),size=u32(i+4),p=i+8;if(size>bytes.length-p)throw fail('Uma imagem do aquário está incompleta.');
  if(type==='VP8X'){if(size<10||(bytes[p]&2))throw fail('O formato de uma imagem do aquário não é compatível.');width=u24(p+4)+1;height=u24(p+7)+1}
  if(type==='VP8 '){if(size<10||text(p+3,3)!=='\x9d\x01\x2a')throw fail('Uma imagem do aquário é inválida.');const w=(bytes[p+6]|bytes[p+7]<<8)&16383,h=(bytes[p+8]|bytes[p+9]<<8)&16383;if(width&&(width!==w||height!==h))throw fail('As dimensões de uma imagem não conferem.');width=w;height=h;frame=true}
  if(type==='VP8L'){if(size<5||bytes[p]!==47||(bytes[p+4]>>5)!==0)throw fail('Uma imagem do aquário é inválida.');const w=1+(bytes[p+1]|(bytes[p+2]&63)<<8),h=1+((bytes[p+2]>>6)|bytes[p+3]<<2|(bytes[p+4]&15)<<10);if(width&&(width!==w||height!==h))throw fail('As dimensões de uma imagem não conferem.');width=w;height=h;frame=true}
  i=p+size+(size&1);if(i>bytes.length)throw fail('Uma imagem do aquário está incompleta.');
 }
 if(!frame||!number(width,1,2048)||!number(height,1,2048))throw fail('As dimensões de uma imagem do aquário são inválidas.');return [width,height];
}
async function validate(text,selected){
 if(typeof text!=='string'||text.length>LIMIT)throw fail('O arquivo do aquário é muito grande.');const bytes=encoder.encode(text);if(bytes.length>LIMIT)throw fail('O arquivo do aquário é muito grande.');
 if(await digest(bytes)!==selected.sha256)throw fail('Este arquivo não corresponde à versão do aquário esperada. Baixe a cópia correta novamente.');
 let value;try{value=JSON.parse(text)}catch{throw fail('O arquivo do aquário está incompleto ou inválido.')}
 if(!value||value.format!=='agenda-aquarium-media'||value.version!==1||value.spriteOrientation!=='right'||!value.images||typeof value.images!=='object'||Array.isArray(value.images))throw fail('Este arquivo não é um pacote de aquário compatível.');
 const ids=Object.keys(value.images);if(ids.length<14||ids.length>23||REQUIRED.some(id=>!Object.hasOwn(value.images,id)))throw fail('Faltam imagens no pacote do aquário.');
 const images=Object.create(null);
 for(const id of ids){
  if(!SCENES.includes(id)&&!/^fish-(original|blue|gold)-(baby|teen|adult)(-turn)?$/.test(id))throw fail('O pacote contém uma imagem não prevista.');
  const r=value.images[id];if(!r||r.id!==id||r.mime!=='image/webp'||!Number.isInteger(r.width)||!Number.isInteger(r.height)||!number(r.width,1,2048)||!number(r.height,1,2048)||typeof r.uri!=='string'||!r.uri.startsWith(PREFIX)||!Number.isInteger(r.bytes)||!number(r.bytes,1,2*1024*1024)||typeof r.sha256!=='string'||!/^[a-f0-9]{64}$/.test(r.sha256))throw fail('Uma imagem do aquário tem metadados inválidos.');
  const b64=r.uri.slice(PREFIX.length);if(!b64.length||b64.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(b64))throw fail('Uma imagem do aquário está incompleta.');let raw;try{raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0))}catch{throw fail('Uma imagem do aquário está incompleta.')}
  if(raw.length!==r.bytes||await digest(raw)!==r.sha256)throw fail('Uma imagem do aquário não passou pela conferência.');const [w,h]=dimensions(raw);if(w!==r.width||h!==r.height)throw fail('As dimensões de uma imagem não conferem.');
  const clean={id,uri:r.uri,mime:r.mime,width:w,height:h,bytes:r.bytes,sha256:r.sha256};
  if(id.startsWith('fish-')){if(!number(r.displayWidth,.05,.6)||!r.rig||typeof r.rig!=='object'||Array.isArray(r.rig)||Object.keys(r.rig).length>30)throw fail('O movimento do peixe tem dados inválidos.');clean.displayWidth=r.displayWidth;clean.contentBounds=point(r.contentBounds,4);if(clean.contentBounds[0]+clean.contentBounds[2]>1.001||clean.contentBounds[1]+clean.contentBounds[3]>1.001)throw fail('O recorte do peixe é inválido.');clean.rig=Object.create(null);for(const[k,v]of Object.entries(r.rig)){if(!/^[a-z][A-Za-z0-9]{0,31}$/.test(k)||!(Array.isArray(v)?v.length===2&&v.every(n=>number(n)):number(v)))throw fail('O movimento do peixe tem dados inválidos.');clean.rig[k]=Array.isArray(v)?v.slice():v}for(const key of ['head','nose','eye','tailRoot'])if(!Array.isArray(clean.rig[key]))throw fail('Faltam pontos de movimento do peixe.')}
  images[id]=clean;
 }
 if(!Array.isArray(value.scenes)||value.scenes.length!==5)throw fail('Faltam cenários no pacote do aquário.');const sceneIds=new Set;
 const scenes=value.scenes.map(r=>{if(!r||!SCENES.includes(r.id)||sceneIds.has(r.id)||r.image!==r.id||typeof r.name!=='string'||!r.name.trim()||r.name.length>80||/[\x00-\x1f]/.test(r.name))throw fail('Um cenário do aquário é inválido.');sceneIds.add(r.id);if(!Array.isArray(r.bubbles)||r.bubbles.length>6||!r.effects||!['green','blue','violet'].includes(r.effects.tone))throw fail('Os efeitos do aquário são inválidos.');const clean={id:r.id,image:r.id,name:r.name,position:point(r.position),bubbles:r.bubbles.map(p=>point(p)),effects:{light:point(r.effects.light),tone:r.effects.tone}};if(r.effects.waterfall){clean.effects.waterfall=point(r.effects.waterfall,4);const a=clean.effects.waterfall;if(a[0]+a[2]>1.001||a[1]+a[3]>1.001)throw fail('O efeito de água é inválido.')}return clean});
 const fish=Object.create(null);for(const c of COLORS){fish[c]=Object.create(null);for(const p of PHASES){const id='fish-'+c+'-'+p;if(value.fish?.[c]?.[p]!==id)throw fail('As fases do peixe estão incompletas.');fish[c][p]=id}}
 return{format:value.format,version:1,spriteOrientation:'right',images,fish,scenes};
}
async function download(selected,force){
 const abort=new AbortController(),timer=host.setTimeout(()=>abort.abort(),15000);let reader;
 try{
  const response=await host.fetch(selected.url,{mode:'cors',credentials:'omit',redirect:'error',cache:force?'reload':'default',headers:{Accept:'application/json'},signal:abort.signal});
  if(!response.ok)throw fail('Não foi possível baixar o aquário. Verifique a conexão e tente novamente.');const advertised=response.headers?.get('content-length');if(advertised&&(!/^\d+$/.test(advertised)||Number(advertised)>LIMIT))throw fail('O arquivo do aquário é muito grande.');
  if(!response.body?.getReader)throw fail('Este navegador não permite concluir o download. Use a opção Importar aquário.');reader=response.body.getReader();const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>LIMIT){abort.abort();reader.cancel().catch(()=>{});throw fail('O arquivo do aquário é muito grande.')}chunks.push(value)}
  const joined=new Uint8Array(size);let i=0;for(const chunk of chunks){joined.set(chunk,i);i+=chunk.byteLength}try{return new TextDecoder('utf-8',{fatal:true}).decode(joined)}catch{throw fail('O arquivo do aquário está incompleto ou inválido.')}
 }catch(e){if(e?.name==='AbortError')throw fail('O download do aquário demorou demais. Verifique a conexão e tente novamente.');if(e?.name==='TypeError'||e?.name==='NetworkError')throw fail('Não foi possível baixar o aquário. Verifique a conexão e tente novamente.');throw e}finally{host.clearTimeout(timer);try{reader?.releaseLock()}catch{}}
}
function assertCurrent(selected,token){if(config!==selected||generation!==token)throw fail('A versão do aquário mudou. Abra a opção novamente.')}
async function save(text,selected,token){const value=await validate(text,selected);assertCurrent(selected,token);await stored('put',selected.sha256,{text,version:selected.version,sha256:selected.sha256});assertCurrent(selected,token);pack=value;persistent=true;emit('ready');return pack}
function init(options){
 if(!options||options.version!==1||typeof options.sha256!=='string'||!/^[a-f0-9]{64}$/.test(options.sha256)||(options.url!=='https://agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site/api/aquarium/v1/media.json'&&!previewURL(options.url)))throw fail('A configuração do aquário é inválida.');
 if(config&&config.sha256===options.sha256&&config.url===options.url)return pack?Promise.resolve(pack):initial||Promise.resolve(null);
 config=Object.freeze({version:1,sha256:options.sha256,url:options.url});const selected=config,token=++generation;pack=null;persistent=false;pending=null;emit('idle');
 initial=serial(async()=>{try{const record=await stored('get',selected.sha256);assertCurrent(selected,token);if(!record)return null;try{if(record.sha256!==selected.sha256||record.version!==1)throw fail('A cópia salva do aquário está incompleta.');const value=await validate(record.text,selected);assertCurrent(selected,token);pack=value;persistent=true;emit('ready');return pack}catch(e){try{await stored('delete',selected.sha256)}catch{}throw e}}catch(e){if(config===selected&&generation===token)emit('error',e.message||'Não foi possível recuperar o aquário salvo.');return null}});return initial;
}
function ensure(options={}){
 if(!config)return Promise.reject(fail('O aquário ainda não foi configurado.'));if(pending)return pending;
 const selected=config,token=generation,force=options.force===true;
 const work=serial(async()=>{assertCurrent(selected,token);if(pack&&!force)return pack;emit('loading');try{return await save(await download(selected,force),selected,token)}catch(e){if(config===selected&&generation===token)emit('error',e.message||'Não foi possível preparar o aquário.');throw e}});
 pending=work;work.then(()=>{if(pending===work)pending=null},()=>{if(pending===work)pending=null});return work;
}
function installText(text){
 if(!config)return Promise.reject(fail('O aquário ainda não foi configurado.'));const selected=config,token=generation;
 return serial(async()=>{assertCurrent(selected,token);emit('loading');try{return await save(text,selected,token)}catch(e){if(config===selected&&generation===token)emit('error',e.message||'Não foi possível importar o aquário.');throw e}});
}
function importFile(){
 if(picker)return picker;if(!config)return Promise.reject(fail('O aquário ainda não foi configurado.'));
 const input=host.document.createElement('input');input.type='file';input.accept='.aquarium.json,application/json';input.style.display='none';host.document.body.append(input);let finish;
 const work=new Promise((resolve,reject)=>{let settled=false,focusTimer=0;finish=(value,cause)=>{if(settled)return;settled=true;host.clearTimeout(focusTimer);host.removeEventListener?.('focus',focused);input.remove();cause?reject(cause):resolve(value)};const focused=()=>{focusTimer=host.setTimeout(()=>{if(!input.files?.length)finish(null)},1000)};host.addEventListener?.('focus',focused);
  input.addEventListener('cancel',()=>finish(null),{once:true});input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file){finish(null);return}if(file.size>LIMIT){finish(null,fail('O arquivo do aquário é muito grande.'));return}try{finish(await installText(await file.text()))}catch(e){finish(null,e)}},{once:true});
 });picker=work;work.then(()=>{if(picker===work)picker=null},()=>{if(picker===work)picker=null});try{input.click()}catch(e){finish(null,fail('Não foi possível abrir a seleção de arquivos.'))}return work;
}
host.APFishMedia=Object.freeze({init,ready:()=>!!pack&&persistent,asset:id=>pack?.images?.[id]||null,status:()=>({state,persistent,error}),ensure,installText,importFile});
})(globalThis);
