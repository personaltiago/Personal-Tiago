// Pagamentos repetidos já gravados (antes da regra do 1.12.299): painel, cancelar, "Manter este", recarregar.
const {chromium}=require('/tmp/pwc/node_modules/playwright-core');
const v=process.argv[2]||'300';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const pg=await (await b.newContext({viewport:{width:412,height:900}})).newPage();const errs=[],dialogs=[];pg.on('pageerror',e=>errs.push(e.message));
let resposta=true;pg.on('dialog',d=>{dialogs.push(d.message());resposta?d.accept():d.dismiss()});
const hoje=new Date(),paid=new Date(hoje.getFullYear(),hoje.getMonth(),Math.max(1,hoje.getDate()-1),10).toISOString(),paid2=new Date(hoje.getFullYear(),hoje.getMonth(),Math.max(1,hoje.getDate()-1),11).toISOString();
await pg.addInitScript(([paid,paid2])=>{if(!localStorage.getItem('agendaPersonalTL_v1'))localStorage.setItem('agendaPersonalTL_v1',JSON.stringify({students:[{id:'s1',name:'Ana Teste',studentType:'presencial',financeEnabled:true,monthlyValue:'500',dueDate:'2026-12-05',startDate:'2026-01-01'},{id:'s2',name:'Bruno Teste',studentType:'online',financeEnabled:true,monthlyValue:'300',dueDate:'2026-12-10',startDate:'2026-01-01'}],
 payments:[{id:'p2',studentId:'s1',studentName:'Ana Teste',dueDate:'2026-11-05',paidAt:paid2,amount:'500'},{id:'p1',studentId:'s1',studentName:'Ana Teste',dueDate:'2026-11-05',paidAt:paid,amount:'450'},{id:'p3',studentId:'s2',studentName:'Bruno Teste',dueDate:'2026-11-10',paidAt:paid,amount:'300'},{id:'p4',studentId:'s2',studentName:'Bruno Teste',dueDate:'2026-11-10',paidAt:paid,amount:'50',settlesMonthlyFee:false}],history:[]}))},[paid,paid2]);
await pg.goto('http://127.0.0.1:8799/'+v+'-professor.html');await pg.waitForTimeout(3000);await pg.evaluate(()=>showScreen('finance'));await pg.waitForTimeout(600);
const estado=async()=>JSON.parse(await pg.evaluate(()=>JSON.stringify({rec:document.getElementById('financeWalletReceived')?.textContent,painel:document.getElementById('financeDuplicates')?(document.getElementById('financeDuplicates').hidden?'oculto':document.getElementById('financeDuplicatesList').innerText.replace(/\n/g,' | ')):'(não existe)',pag:JSON.parse(localStorage.getItem('agendaPersonalTL_v1')).payments.map(p=>p.id+':'+p.amount+(p.replaces?' replaces '+p.replaces:'')).join(', ')})));
console.log('inicio',JSON.stringify(await estado()));
await pg.locator('#financeDuplicates').screenshot({path:'/tmp/t299/duplicados-'+v+'.png'}).catch(()=>{});
if(v!=='300'){console.log('erros',errs);await b.close();return}
resposta=false;await pg.click('[data-keep-payment="p2"]');await pg.waitForTimeout(400);console.log('cancelar',JSON.stringify(await estado()));
resposta=true;await pg.click('[data-keep-payment="p2"]');await pg.waitForTimeout(600);console.log('manter 500',JSON.stringify(await estado()));
const hist=await pg.evaluate(()=>[...document.querySelectorAll('#paymentHistory article')].map(a=>a.innerText.replace(/\n/g,' | ')));console.log('historico',JSON.stringify(hist));
await pg.reload();await pg.waitForTimeout(3000);await pg.evaluate(()=>showScreen('finance'));await pg.waitForTimeout(500);console.log('recarregado',JSON.stringify(await estado()));
console.log('dialogos',JSON.stringify(dialogs));console.log('erros',errs);await b.close()})();
