(function(root){
  'use strict';
  const FORMAT='agenda-personal-backup-encrypted',ITERATIONS=600000,MAX=64*1024*1024;
  const aad=new TextEncoder().encode('AgendaPersonal|backup|1|PBKDF2-SHA256|600000|AES256GCM');
  function passwordBytes(password){
    if(typeof password!=='string'||password.length<12||password.length>1024)throw Error('Use uma senha de 12 a 1024 caracteres.');
    return new TextEncoder().encode(password);
  }
  function base64(bytes){let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}
  function decode(text,max){
    if(typeof text!=='string'||text.length>Math.ceil(max/3)*4||text.length%4!==0||/[^A-Za-z0-9+/=]/.test(text)||/=/.test(text.slice(0,-2))||text.endsWith('=')===false&&text.includes('='))throw Error('Arquivo protegido inválido.');
    return Uint8Array.from(atob(text),c=>c.charCodeAt(0));
  }
  function validPlain(bytes){
    if(!(bytes instanceof Uint8Array)||bytes.length>MAX||!bytes.length)throw Error('Selecione um backup JSON de até 64 MiB.');
    let data;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch(_){throw Error('O conteúdo não é um backup JSON válido.');}
    if(!data||typeof data!=='object'||Array.isArray(data))throw Error('O conteúdo não é um backup JSON válido.');
  }
  async function key(password,salt,usage){
    const bytes=passwordBytes(password);
    try{
      const material=await crypto.subtle.importKey('raw',bytes,'PBKDF2',false,['deriveKey']);
      return await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',iterations:ITERATIONS,salt},material,{name:'AES-GCM',length:256},false,[usage]);
    }finally{bytes.fill(0);}
  }
  async function encrypt(bytes,password){
    validPlain(bytes);const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
    const secret=await key(password,salt,'encrypt');
    const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},secret,bytes));
    return JSON.stringify({format:FORMAT,version:1,kdf:{name:'PBKDF2',hash:'SHA-256',iterations:ITERATIONS,salt:base64(salt)},cipher:{name:'AES-GCM',iv:base64(iv)},ciphertext:base64(cipher)});
  }
  async function decrypt(text,password){
    if(typeof text!=='string'||text.length>Math.ceil((MAX+16)/3)*4+2048)throw Error('Arquivo protegido inválido ou acima do limite.');
    let data;try{data=JSON.parse(text);}catch(_){throw Error('Arquivo protegido inválido.');}
    if(!data||data.format!==FORMAT||data.version!==1||data.kdf?.name!=='PBKDF2'||data.kdf.hash!=='SHA-256'||data.kdf.iterations!==ITERATIONS||data.cipher?.name!=='AES-GCM')throw Error('Formato ou parâmetros de proteção incompatíveis.');
    const salt=decode(data.kdf.salt,16),iv=decode(data.cipher.iv,12),cipher=decode(data.ciphertext,MAX+16);
    if(salt.length!==16||iv.length!==12||cipher.length<17)throw Error('Arquivo protegido inválido.');
    const secret=await key(password,salt,'decrypt');let bytes;
    try{bytes=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},secret,cipher));}
    catch(_){throw Error('Senha incorreta ou arquivo protegido alterado.');}
    validPlain(bytes);return bytes;
  }
  const api=Object.freeze({encrypt,decrypt,maxBytes:MAX});
  if(typeof module==='object'&&module.exports)module.exports=api;else root.APBackupCrypto=api;
})(typeof globalThis==='object'?globalThis:this);
