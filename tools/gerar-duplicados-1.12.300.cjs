'use strict';

// Gera o pacote 1.12.300 / 406 (sem assinatura): o 1.12.299 (tools/gerar-financeiro-imc-1.12.299.cjs, ainda não subido) + duas coisas:
//  1. "Vencimentos com pagamento repetido" no Financeiro: o 1.12.299 evita duplicar daqui para a frente, mas pagamentos repetidos JÁ
//     gravados (ex.: R$ 450 + R$ 500 no mesmo vencimento = R$ 950) continuavam somando. O painel lista cada vencimento quitado mais de
//     uma vez (mesmo aluno e mesma data de vencimento, sem contar "recebimento sem quitar") e, para cada pagamento, "Manter este". Com
//     confirmação, o escolhido passa a valer e os outros ficam no histórico como substituídos (o mesmo "replaces" do 1.12.299), fora das
//     somas. Nada é apagado; nenhum valor ou data muda. Sem repetição, o painel não aparece.
//  2. Comprovante Pix: cancelar a substituição mostrava no diálogo "Não foi possível salvar o pagamento"; passa a dizer que foi cancelada
//     e que nada foi registrado.
// Pedido: Tiago, 20/11 19:52 ("tem alguma melhoria que você consiga fazer sem o chat"); proposta enviada a ele às 19:5x, aprovação do
// pacote pendente. Numeração: 1.12.300 = 406. Completo e cumulativo: inclui o 1.12.299 e o 1.12.298; substitui o 1.12.299 (subir só este).
//
// Uso: node tools/gerar-duplicados-1.12.300.cjs <pacote-1.12.298.agenda.json> [saida.agenda.json]

const { createHash } = require('node:crypto');
const { writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const base = require('./gerar-financeiro-imc-1.12.299.cjs');

const version = '1.12.300';
const sequence = 406;
const title = 'Pagamentos repetidos, mensalidade e IMC por idade';
const summary = 'Mostra vencimentos pagos mais de uma vez para escolher o que vale, sem apagar nada. Inclui a mensalidade corrigida e o IMC por idade do 1.12.299.';
const notes = 'Pagamentos repetidos, mensalidade corrigida e IMC por idade.\n\n'
  + 'Novo no Financeiro: quando o mesmo vencimento de um aluno tem mais de um pagamento que quita a mensalidade (por exemplo, R$ 450 e depois R$ 500, somando R$ 950), '
  + 'aparece o quadro "Vencimentos com pagamento repetido". Em cada pagamento há o botão "Manter este". Confirmando, ele passa a valer e os outros ficam guardados no histórico, '
  + 'marcados como substituídos, sem entrar no Recebido do mês, nos resultados nem no histórico do aluno. Nada é apagado e nenhum valor ou data muda. Sem repetição o quadro não aparece.\n\n'
  + 'Daqui para a frente, quitar de novo um vencimento já quitado pergunta se deve substituir o valor anterior (cancelando, nada é registrado, também no comprovante Pix).\n\n'
  + 'Avaliação física: com 60 anos ou mais, a faixa de peso pelo IMC usa a referência do Ministério da Saúde para pessoas idosas (22 a 27), na tela, no compartilhar e no PDF. '
  + 'Abaixo de 60 anos, ou sem idade informada, continua a faixa adulta.\n\n'
  + 'O que não muda: login, alunos, treinos, agenda, Firebase, descanso do treino, cronômetros, alarmes, notificações, mascotes e o cálculo da gordura corporal.\n\n'
  + 'Inclui tudo do 1.12.298 e do 1.12.299 (que não precisa ser instalado separadamente) e deve ser instalado no lugar deles.';
const TARGET_NAME = 'AgendaPersonal-1.12.300-Pagamentos-Repetidos-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;

const DUPLICATES_JS = `
 // Vencimentos com pagamento repetido (gravados antes desta regra): escolher o que vale; os outros ficam substituídos, nada é apagado.
 function repeated(){
  const replaced=APFinanceWallet.replacedIds(state.payments),groups=new Map();
  for(const row of state.payments||[]){
   if(!row||!row.id||!row.studentId||row.settlesMonthlyFee===false||replaced.has(row.id))continue;
   const due=APBilling.date(row.dueDate);if(!due)continue;
   const key=row.studentId+'|'+due;(groups.get(key)||groups.set(key,[]).get(key)).push(row);
  }
  return [...groups].filter(([,rows])=>rows.length>1);
 }
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
 const nameOf=row=>row.studentName||studentById(row.studentId)?.name||'Aluno';
 const paidOn=row=>{const at=new Date(row.paidAt);return Number.isFinite(at.getTime())?at.toLocaleDateString('pt-BR'):'data não informada'};
 const panel=document.createElement('section');
 panel.id='financeDuplicates';panel.hidden=true;panel.setAttribute('aria-labelledby','financeDuplicatesTitle');
 panel.innerHTML='<h3 id="financeDuplicatesTitle">Vencimentos com pagamento repetido</h3><p class="finance-duplicates-note">Cada vencimento quitado deveria ter um pagamento. Toque em <strong>Manter este</strong> no que vale: os outros ficam guardados no histórico como substituídos e saem das somas. Nada é apagado.</p><div id="financeDuplicatesList"></div>';
 const wallet=document.getElementById('financeWallet');
 if(wallet)wallet.before(panel);
 function renderRepeated(){
  if(!wallet)return;
  const list=repeated();panel.hidden=!list.length;
  document.getElementById('financeDuplicatesList').innerHTML=list.map(([key,rows])=>{
   const total=rows.reduce((sum,row)=>sum+(APBilling.cents(row.amount)||0),0);
   return '<article class="finance-duplicates-group"><div class="finance-duplicates-head"><strong>'+esc(nameOf(rows[0]))+'</strong><small>Vencimento '+esc(fmtDate(APBilling.date(rows[0].dueDate)))+' · '+rows.length+' pagamentos somando '+esc(money(total))+'</small></div>'
    +rows.map(row=>'<div class="finance-duplicates-row"><div><strong>'+esc(money(APBilling.cents(row.amount)))+'</strong><small>Recebido em '+esc(paidOn(row))+(row.receipt||row.method==='pix'?' · Pix':'')+'</small></div><button class="btn" type="button" data-keep-payment="'+esc(row.id)+'" data-keep-group="'+esc(key)+'">Manter este</button></div>').join('')+'</article>';
  }).join('');
 }
 panel.addEventListener('click',event=>{
  const button=event.target.closest('[data-keep-payment]');if(!button)return;
  if(globalThis.APBackupRestoring===true)return toast('Aguarde a recuperação dos dados terminar.');
  const group=repeated().find(([key])=>key===button.dataset.keepGroup)?.[1]||[];
  const kept=group.find(row=>row.id===button.dataset.keepPayment),others=group.filter(row=>row!==kept);
  if(!kept||!others.length){renderRepeated();return toast('Esse vencimento não tem mais pagamentos repetidos.')}
  if(!window.confirm('Manter '+money(APBilling.cents(kept.amount))+' (recebido em '+paidOn(kept)+') como o pagamento do vencimento '+fmtDate(APBilling.date(kept.dueDate))+' de '+nameOf(kept)+'?\\n\\n'+(others.length===1?'O outro pagamento, ':'Os outros pagamentos, ')+others.map(row=>money(APBilling.cents(row.amount))).join(' + ')+', '+(others.length===1?'fica guardado':'ficam guardados')+' no histórico como substituído e sai das somas. Nada é apagado.'))return;
  const ids=others.map(row=>row.id),before=state.payments;
  state.payments=before.map(row=>row===kept?{...row,replaces:[...new Set([...(Array.isArray(row.replaces)?row.replaces:[]),...ids])]}:row);
  try{save()}catch(_){state.payments=before;renderAll();return toast('Não foi possível salvar. Nada mudou; tente novamente.',6500)}
  toast('Pronto: vale '+money(APBilling.cents(kept.amount))+'. '+(ids.length===1?'O outro ficou':'Os outros ficaram')+' no histórico como substituído.',6500);
 });
 const renderBefore=renderFinance;
 renderFinance=function(){const result=renderBefore.apply(this,arguments);renderRepeated();return result};
 renderRepeated();
`;

const DUPLICATES_CSS = '<style id="ap-finance-duplicates-css">#financeDuplicates{margin:0 0 20px;padding:20px;border:1px solid var(--ac-warn-border,var(--line));border-radius:20px;background:var(--ac-surface,var(--panel));color:var(--ac-text,var(--text))}'
  + '#financeDuplicates[hidden]{display:none!important}#financeDuplicates h3{margin:0 0 10px;font-size:calc((1.08rem) * var(--ap-ts,1));line-height:1.35}'
  + '#financeDuplicates .finance-duplicates-note{margin:0 0 6px;font-size:calc((.8rem) * var(--ap-ts,1));line-height:1.6;color:var(--ac-muted,var(--muted))}'
  + '#financeDuplicates .finance-duplicates-group{padding:14px 0 4px;border-top:1px solid var(--ac-line,var(--line));margin-top:12px}'
  + '#financeDuplicates .finance-duplicates-head strong,#financeDuplicates .finance-duplicates-head small{display:block}#financeDuplicates .finance-duplicates-head small,#financeDuplicates .finance-duplicates-row small{font-size:calc((.78rem) * var(--ap-ts,1));line-height:1.5;color:var(--ac-muted,var(--muted))}'
  + '#financeDuplicates .finance-duplicates-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0}#financeDuplicates .finance-duplicates-row>div{min-width:0}#financeDuplicates .finance-duplicates-row strong,#financeDuplicates .finance-duplicates-row small{display:block;overflow-wrap:anywhere}'
  + '#financeDuplicates .finance-duplicates-row strong{font-variant-numeric:tabular-nums}#financeDuplicates .finance-duplicates-row .btn{flex:0 0 auto;min-height:44px}</style>';

const CHANGES = [
  ['o aviso de substituição cancelada (início da confirmação)',
    `  if(!payment||payment.settlesMonthlyFee===false)return before.apply(this,arguments);\n  const prior=sameInstallment(payment);`,
    `  globalThis.APFinanceReplacementCancelled=false;\n  if(!payment||payment.settlesMonthlyFee===false)return before.apply(this,arguments);\n  const prior=sameInstallment(payment);`],
  ['o aviso de substituição cancelada (cancelar)',
    `   toast('Nada foi registrado. O pagamento anterior continua valendo.',6500);`,
    `   globalThis.APFinanceReplacementCancelled=true;\n   toast('Nada foi registrado. O pagamento anterior continua valendo.',6500);`],
  ['o painel de vencimentos repetidos (fim do bloco ap-finance-replacements)',
    `return make({...data,payments:(data?.payments||[]).filter(row=>!row||!replaced.has(row.id))},student,pixKey)}});\n})();\n</script>`,
    `return make({...data,payments:(data?.payments||[]).filter(row=>!row||!replaced.has(row.id))},student,pixKey)}});` + DUPLICATES_JS + `})();\n</script>`],
  ['a mensagem do comprovante Pix quando a substituição é cancelada',
    `if(result===null)throw Error('Não foi possível salvar o pagamento. A baixa não foi feita.');`,
    `if(result===null)throw Error(globalThis.APFinanceReplacementCancelled===true?'Substituição cancelada: nada foi registrado e o pagamento anterior continua valendo.':'Não foi possível salvar o pagamento. A baixa não foi feita.');`],
];

function makeUpdate(source) {
  const p299 = base.makeUpdate(source);
  assert.equal(p299.version, '1.12.299');
  assert.equal(sequence, p299.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]));
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notes.length <= 4000, 'notas: ' + notes.length);
  let html = p299.files['professor.html'];
  for (const [what, from, to] of CHANGES) {
    assert.equal(count(html, from), 1, 'Não achei ' + what + ' uma única vez no 1.12.299');
    html = html.replace(from, () => to);
  }
  const cssAnchor = '<style id="ap-finance-wallet-css">';
  assert.equal(count(html, cssAnchor), 1);
  const cssEnd = html.indexOf('</style>', html.indexOf(cssAnchor)) + '</style>'.length;
  assert.equal(count(html, 'id="ap-finance-duplicates-css"'), 0);
  html = html.slice(0, cssEnd) + DUPLICATES_CSS + html.slice(cssEnd);
  return {...p299, files: {...p299.files, 'professor.html': html}, version, sequence, notes, update: {category: 'general', title, summary}};
}

if (require.main === module) {
  const [, , sourceFile = base.SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(base.loadSource(sourceFile)), null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + createHash('sha256').update(payload, 'utf8').digest('hex'));
}

module.exports = {makeUpdate, version, sequence, title, summary, notes, TARGET_NAME, DUPLICATES_JS, DUPLICATES_CSS, CHANGES};
