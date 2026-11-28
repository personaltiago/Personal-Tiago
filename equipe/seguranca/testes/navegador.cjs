'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../..');
const fixtures={
 'firebase-app.js':`export const initializeApp=()=>({});`,
 'firebase-auth.js':`const auth={currentUser:null};export const getAuth=()=>auth;export async function createUserWithEmailAndPassword(_,email){window.fixture.calls++;if(window.fixture.fail)throw Object.assign(Error('INTERNAL_CANARY_SECRET'),{code:window.fixture.fail});return {user:{uid:'synthetic-student',email}}}export const signInWithEmailAndPassword=createUserWithEmailAndPassword;export const updateProfile=async()=>{};`,
 'firebase-firestore.js':`export const getFirestore=()=>({});export const doc=(...args)=>args;export const getDoc=async()=>({exists:()=>false});export const setDoc=async(_,value)=>{window.fixture.stored=value};export const updateDoc=async()=>{};export const serverTimestamp=()=>({synthetic:true});`
};
async function main(){
 const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1);if(!/^[a-z0-9.-]+$/.test(name)){res.writeHead(404).end();return;}const file=path.join(root,name);if(!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],unexpected=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin===origin)return route.continue();
   const fixture=fixtures[url.pathname.split('/').pop()];
   if(url.hostname==='www.gstatic.com'&&fixture)return route.fulfill({status:200,contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:fixture});
   unexpected.push(url.origin+url.pathname);return route.abort();
  });
  await page.addInitScript(()=>{window.fixture={calls:0,fail:null,stored:null};document.addEventListener('securitypolicyviolation',e=>{(window.cspViolations??=[]).push(e.violatedDirective);});});
  const load=async()=>{await page.goto(origin+'/cadastro-aluno.html');await page.waitForFunction(()=>window.APRegistrationSecurity&&document.getElementById('nascimento').max);};
  const fill=async()=>{for(const [key,value]of Object.entries({nome:'Aluno Sintético',email:'synthetic@example.invalid',whatsapp:'69999990000',nascimento:'2000-02-29',senha:'senha sintética longa',confirmar:'senha sintética longa'}))await page.locator('#'+key).fill(value);await page.locator('#genero').selectOption('Feminino');};
  await load();await fill();await page.locator('#nome').fill('<script>');await page.locator('#submit').click();assert.equal(await page.evaluate(()=>fixture.calls),0);
  await page.locator('#nome').fill('Aluno Sintético');await page.evaluate(()=>fixture.fail='sdk/unknown');await page.locator('#submit').click();await page.waitForFunction(()=>!document.getElementById('submit').disabled);
  assert.ok(!(await page.locator('#status').innerText()).includes('CANARY'));assert.equal(await page.locator('#senha').inputValue(),'');
  await load();await fill();await page.locator('#submit').click();await page.locator('#done').waitFor({state:'visible'});
  const stored=await page.evaluate(()=>fixture.stored);assert.equal(stored.ativo,false);assert.equal(stored.perfil,'aluno');assert.ok(!('senha'in stored));assert.ok(!('confirmar'in stored));
  assert.deepEqual(await page.evaluate(()=>window.cspViolations||[]),[],'legitimate scripts satisfy the CSP');
  await page.evaluate(()=>{const s=document.createElement('script');s.textContent='window.injectedCanary=true';document.body.appendChild(s);});
  assert.equal(await page.evaluate(()=>window.injectedCanary),undefined,'injected inline script blocked');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'signup fits mobile viewport');
  await page.goto(origin+'/backup-seguro.html');await page.locator('#file').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from('{"synthetic":true}')});
  await page.locator('#password').fill('senha longa sintética');await page.locator('#confirmation').fill('senha longa sintética');
  const download=page.waitForEvent('download');await page.locator('#backup-submit').click();const result=await download;
  const encrypted=fs.readFileSync(await result.path(),'utf8');assert.equal(JSON.parse(encrypted).format,'agenda-personal-backup-encrypted');
  assert.equal(await page.locator('#password').inputValue(),'');
  await page.locator('#mode').selectOption('decrypt');await page.locator('#file').setInputFiles({name:'encrypted.json',mimeType:'application/json',buffer:Buffer.from(encrypted)});await page.locator('#password').fill('senha longa sintética');
  const restored=page.waitForEvent('download');await page.locator('#backup-submit').click();assert.equal(fs.readFileSync(await(await restored).path(),'utf8'),'{"synthetic":true}');
  assert.deepEqual(unexpected,[],'no production requests or backup uploads');assert.deepEqual(errors,[]);
  for(const name of ['privacidade.html','termos.html']){await page.goto(origin+'/'+name);assert.ok(await page.locator('h1').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  console.log('PASS Chromium: cadastro válido/inválido, erros redigidos, senha limpa, CSP real, viewport 390px, privacidade/termos e backup criptografado/restaurado por download. Apenas dados e Firebase sintéticos; zero chamadas de produção.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
