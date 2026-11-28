'use strict';
// Standalone official emulator, pinned to Firebase CLI 15.37.0's published manifest.
// Avoids installing the CLI's unrelated deployment/server dependencies in tests.
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process'),{createHash}=require('node:crypto'),{Readable}=require('node:stream'),{pipeline}=require('node:stream/promises'),net=require('node:net');
const version='1.22.0',sha256='9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c';
const project='demo-agenda-personal-security',host='127.0.0.1',port=8089;
async function digest(file){const hash=createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');}
async function jar(){
 const cache=path.join(os.homedir(),'.cache','firebase','emulators'),file=path.join(cache,'cloud-firestore-emulator-v'+version+'.jar');
 if(fs.existsSync(file)){if(await digest(file)!==sha256)throw Error('Emulador em cache não corresponde ao SHA-256 fixado.');return file;}
 await fsp.mkdir(cache,{recursive:true});const temporary=file+'.'+process.pid+'.download';
 try{
  const response=await fetch('https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v'+version+'.jar',{redirect:'error',signal:AbortSignal.timeout(180000)});
  if(!response.ok||!response.body)throw Error('Não foi possível obter o emulador oficial.');
  await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(temporary,{flags:'wx'}));
  if(await digest(temporary)!==sha256)throw Error('SHA-256 do emulador oficial diverge.');
  await fsp.rename(temporary,file);return file;
 }finally{await fsp.rm(temporary,{force:true});}
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
 const binary=await jar();
 await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(port,host,()=>probe.close(resolve));});
 const emulator=spawn('java',['-jar',binary,'--host',host,'--port',String(port),'--project_id',project,'--rules',path.resolve(__dirname,'../firestore.rules')],{stdio:'inherit'});
 let failure;emulator.once('error',error=>{failure=error;});
 const exited=new Promise(resolve=>{emulator.once('exit',resolve);emulator.once('error',()=>resolve());});
 const stop=()=>emulator.kill('SIGTERM');process.once('SIGINT',stop);process.once('SIGTERM',stop);
 try{
  const deadline=Date.now()+60000;let ready=false;
  while(Date.now()<deadline){
   if(failure)throw failure;if(emulator.exitCode!==null)throw Error('Emulador encerrou antes dos testes.');
   try{await fetch('http://'+host+':'+port+'/',{signal:AbortSignal.timeout(1000)});ready=true;break;}catch(_){await delay(150);}
  }
  if(!ready)throw Error('Emulador não iniciou no prazo.');
  const files=fs.readdirSync(path.join(__dirname,'test')).filter(name=>name.endsWith('.test.cjs')).map(name=>path.join(__dirname,'test',name));
  const test=spawn(process.execPath,['--test',...files],{stdio:'inherit',env:{...process.env,GCLOUD_PROJECT:project,FIRESTORE_EMULATOR_HOST:host+':'+port}});
  const code=await new Promise((resolve,reject)=>{test.once('error',reject);test.once('exit',resolve);});
  process.exitCode=code??1;
 }finally{
  stop();const killer=setTimeout(()=>emulator.kill('SIGKILL'),5000);killer.unref();await exited;clearTimeout(killer);
  process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
