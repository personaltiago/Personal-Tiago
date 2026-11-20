// Teste rápido dos modelos do financeiro e do bloco novo, num vm, com o commitFinanceChange de mentira.
const vm=require('vm'),assert=require('assert/strict');
const pkg=require(process.argv[2]);const h=pkg.files['professor.html'];
const blk=id=>{const i=h.indexOf('<script id="'+id+'">');assert.ok(i>=0,id);const s=h.indexOf('>',i)+1;return h.slice(s,h.indexOf('</script>',s))};
const confirms=[],toasts=[];let answer=true;
const c={console,Date,Set,Map,state:{students:[{id:'s1',name:'Ana',financeEnabled:true,monthlyValue:'500',dueDate:'2026-03-10'}],payments:[]},
 window:{confirm:m=>{confirms.push(m);return answer}},toast:(m)=>toasts.push(m),fmtDate:d=>d.split('-').reverse().join('/')};
c.globalThis=c;vm.createContext(c);
vm.runInContext('function commitFinanceChange(student,changes,text,payment=null,ledger=null){state.payments=[payment,...state.payments];return "ok"}',c);
for(const id of ['ap-billing-model','ap-finance-wallet-model','ap-finance-results-model'])vm.runInContext(blk(id),c);
const now=new Date();const iso=now.toISOString();
vm.runInContext(blk('ap-finance-replacements'),c);
const pay=(id,amount,due,extra={})=>vm.runInContext('commitFinanceChange(state.students[0],{},"t",'+JSON.stringify({id,studentId:'s1',studentName:'Ana',dueDate:due,paidAt:iso,amount,...extra})+')',c);
const W=()=>vm.runInContext('APFinanceWallet.build(state)',c),R=()=>vm.runInContext('APFinanceResults.build(state,'+now.getFullYear()+')',c).total.receivedCents;
assert.equal(pay('p1','450','2026-02-10'),'ok');assert.equal(confirms.length,0,'primeiro pagamento não pergunta');
assert.equal(W().receivedCents,45000);
answer=false;assert.equal(pay('p2','500','2026-02-10'),null);assert.equal(confirms.length,1);assert.match(confirms[0],/10\/02\/2026.*R\$\s?450,00/s);assert.match(confirms[0],/R\$\s?500,00/);
assert.equal(c.state.payments.length,1,'cancelado não registra');assert.match(toasts[0],/Nada foi registrado/);
answer=true;assert.equal(pay('p3','500','2026-02-10'),'ok');assert.equal(c.state.payments.length,2,'o anterior não é apagado');
assert.deepEqual([...c.state.payments[0].replaces],['p1']);assert.equal(c.state.payments[1].amount,'450');
assert.equal(W().receivedCents,50000,'Recebido do mês: 500, não 950');assert.equal(W().receivedCount,1);
assert.equal(R(),50000,'Resultados do ano: 500');
const hist=vm.runInContext('APBilling.make(state,state.students[0],"")',c).history;assert.deepEqual([...hist.map(x=>x.id)],["p3"],'aluno vê só o que vale');
assert.ok(vm.runInContext('APBilling.valid(APBilling.make(state,state.students[0],""))',c));
// terceira correção: substitui só o que vale (p3); p1 continua substituído
assert.equal(pay('p4','520','2026-02-10'),'ok');assert.equal(confirms.length,3);assert.match(confirms[2],/R\$\s?500,00\./);assert.doesNotMatch(confirms[2],/450/);
assert.deepEqual([...c.state.payments[0].replaces],['p3']);assert.equal(W().receivedCents,52000);
// outro vencimento e recebimento sem quitar: não perguntam e somam
assert.equal(pay('p5','500','2026-03-10'),'ok');assert.equal(pay('p6','50','2026-03-10',{settlesMonthlyFee:false}),'ok');assert.equal(confirms.length,3);
assert.equal(W().receivedCents,52000+50000+5000);
// pagamento antigo sem vencimento válido não pergunta
assert.equal(pay('p7','10',''),'ok');assert.equal(confirms.length,3);
console.log('financeiro (vm): todas as verificações passaram;',confirms.length,'perguntas; exemplo:\n'+confirms[0]);
