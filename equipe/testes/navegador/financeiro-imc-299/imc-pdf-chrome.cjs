const {chromium}=require('/tmp/pwc/node_modules/playwright-core');
async function texto(b,v,idade){const pg=await b.newPage({viewport:{width:900,height:1200}});pg.on('dialog',d=>d.accept());
await pg.goto('file:///tmp/t299/pag/'+v+'-avaliacoes.html');await pg.waitForTimeout(800);
await pg.evaluate((idade)=>{const f=document.getElementById('save-assessment').form;const V={clientName:'Teste Idade',studentType:'presencial',professional:'TIAGO LIMA',equation:'female',age:idade,date:'2026-11-20',height:'160',weight:'67',objective:'fatLoss'};
for(const e of f.elements){if(!e.name)continue;let x=V[e.name];if(x===undefined&&/^f[A-Z]/.test(e.name))x='20';if(x===undefined)continue;e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}))}},idade);
await pg.evaluate(()=>{const s=document.getElementById('save-assessment');s.form.requestSubmit(s)});await pg.waitForTimeout(2000);
const t=await pg.evaluate(()=>[...document.querySelectorAll('.sheet')].map(n=>n.innerText).join('\n'));await pg.close();return t}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const idade of ['45','70']){const a=await texto(b,'298',idade),c=await texto(b,'299',idade);
 const A=a.split(/(?<=[.:])\s+|\n/),C=c.split(/(?<=[.:])\s+|\n/);const sa=new Set(A),sc=new Set(C);
 console.log('=== idade',idade,'tamanho',a.length,c.length);
 for(const x of A)if(!sc.has(x))console.log('  - 298:',x.slice(0,300));for(const x of C)if(!sa.has(x))console.log('  + 299:',x.slice(0,300));}
await b.close()})();
