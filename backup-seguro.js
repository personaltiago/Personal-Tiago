'use strict';
const form=document.getElementById('backup-form'),mode=document.getElementById('mode'),status=document.getElementById('backup-status'),submit=document.getElementById('backup-submit');
mode.addEventListener('change',()=>{const encrypt=mode.value==='encrypt';document.getElementById('confirmation-label').hidden=!encrypt;document.getElementById('confirmation').hidden=!encrypt;document.getElementById('confirmation').required=encrypt;submit.textContent=encrypt?'Proteger e baixar':'Abrir e baixar JSON';status.textContent='';});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(submit.disabled)return;let objectUrl='';
 const input=document.getElementById('file'),password=document.getElementById('password'),confirmation=document.getElementById('confirmation'),encrypt=mode.value==='encrypt';
 try{
  if(!globalThis.crypto?.subtle)throw Error('Abra esta ferramenta em um navegador com conexão HTTPS ou em um ambiente local seguro.');
  if(!input.files?.[0])throw Error('Selecione um arquivo.');
  if(input.files[0].size>(encrypt?APBackupCrypto.maxBytes:APBackupCrypto.maxBytes*1.34+2048))throw Error('O arquivo ultrapassa o limite permitido.');
  if(encrypt&&password.value!==confirmation.value)throw Error('As senhas não são iguais.');
  submit.disabled=true;status.textContent=encrypt?'Protegendo o arquivo neste navegador…':'Verificando a senha e o arquivo…';
  const output=encrypt?await APBackupCrypto.encrypt(new Uint8Array(await input.files[0].arrayBuffer()),password.value):await APBackupCrypto.decrypt(await input.files[0].text(),password.value);
  const blob=new Blob([output],{type:'application/json'}),link=document.createElement('a');objectUrl=URL.createObjectURL(blob);link.href=objectUrl;link.download=encrypt?'AgendaPersonal-Backup-Protegido.json':'AgendaPersonal-Backup-Recuperado.json';link.click();
  status.textContent=encrypt?'Arquivo protegido preparado para baixar. Confira se o download foi salvo.':'JSON recuperado preparado para baixar. Importe-o no aplicativo e cuide dessa cópia desprotegida.';
 }catch(error){status.textContent=error instanceof Error?error.message:'Não foi possível processar este arquivo.';}
 finally{password.value='';confirmation.value='';submit.disabled=false;if(objectUrl)setTimeout(()=>URL.revokeObjectURL(objectUrl),30000);}
});
