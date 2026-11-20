'use strict';

// Gera o pacote 1.12.299 / 405 (sem assinatura) a partir do 1.12.298 / 404 da main (SHA-256 conferido). Pacote completo: a correção do IMC
// fica num script SEM id do avaliacoes.html (não é um bloco que uma correção por área alcance).
// Motivo: avaliação de 20/11 (Tiago, com a revisão do ChatGPT), conferida no código pelo Claude:
//  1. Financeiro: R$ 450 quitando um vencimento, depois o mesmo vencimento quitado de novo com R$ 500, dava R$ 950 no Recebido. O
//     Recebido do mês e os resultados por mês somam todos os pagamentos do mês; só juntam registros com o mesmo id.
//     Decisão do Tiago (20/11 18:55, "Sim"): o app pergunta "Substituir?"; o registro anterior NÃO é apagado, fica marcado como
//     substituído e sai das somas.
//  2. Avaliação: o IMC usava só a faixa adulta (18,5 a <25,0), sem a idade. Para 60 anos ou mais vale a faixa do Ministério da Saúde para
//     pessoas idosas (IMC < 22 baixo peso; 22 a 27 adequado; > 27 sobrepeso). Ex.: 70 anos, 1,60 m, 67 kg (IMC 26,17) aparecia "acima,
//     < 64 kg"; passa a "peso adequado, 56,3–69,1 kg". Tela, cartão de compartilhar e PDF.
// Não muda: Firebase, dados existentes (nenhum pagamento é apagado nem reescrito por esta atualização), login, descanso, cronômetros,
// alarmes, notificações, mascotes, index.html e cadastro.html, o modelo compartilhado ap-billing-model, as equações de gordura.
// Numeração: sequência = número da versão + 106. 1.12.299 = 405 = 298 (404) + 1. Completo e cumulativo: inclui tudo do 1.12.298.
//
// Uso: node tools/gerar-financeiro-imc-1.12.299.cjs <pacote-1.12.298.agenda.json> [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.299';
const sequence = 405;
const title = 'Mensalidade corrigida e IMC por idade';
const summary = 'Corrigir uma mensalidade já paga substitui o registro anterior em vez de somar. Na avaliação, quem tem 60 anos ou mais usa a faixa de IMC para pessoas idosas (22 a 27).';
const notes = 'Mensalidade corrigida e IMC por idade.\n\n'
  + 'Financeiro: quando um vencimento que já tem pagamento registrado é quitado de novo para o mesmo aluno (por exemplo, R$ 450 registrado e depois corrigido para R$ 500), '
  + 'o aplicativo pergunta se deve substituir o valor. Confirmando, o novo pagamento passa a valer e o anterior fica guardado no histórico, marcado como substituído, '
  + 'sem entrar no Recebido do mês, nos resultados por mês nem no histórico que o aluno vê. Cancelando, nada é registrado. '
  + 'Recebimentos marcados como "sem quitar o vencimento" continuam somando normalmente. Nenhum pagamento já registrado é apagado ou alterado por esta atualização.\n\n'
  + 'Avaliação física: a faixa de peso pelo Índice de Massa Corporal (IMC) passa a considerar a idade informada na avaliação. '
  + 'Com 60 anos ou mais vale a referência do Ministério da Saúde para pessoas idosas: abaixo de 22 baixo peso, de 22 a 27 peso adequado, acima de 27 sobrepeso. '
  + 'Abaixo de 60 anos, ou sem idade informada, continua a faixa adulta (18,5 a menos de 25). Vale na tela, no cartão de compartilhar e no PDF.\n\n'
  + 'O que não muda: login, alunos, treinos, agenda, Firebase, descanso do treino, cronômetros, alarmes, notificações, mascotes e o cálculo da gordura corporal.\n\n'
  + 'Inclui tudo do 1.12.298 (feedback somente no topo, feedback online e compartilhamento e as correções anteriores) e deve ser instalado no lugar dele.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_VERSION = '1.12.298';
const SOURCE_SEQUENCE = 404;
const SOURCE_NAME = 'AgendaPersonal-1.12.298-Feedback-Consolidado-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '602b204bd7d93b460e4b9e9d1f8f12d89da18ffc6c5b7959105f6af778c87973';
const TARGET_NAME = 'AgendaPersonal-1.12.299-Financeiro-IMC-Idade-Para-Assinar.agenda.json';
const sha256Bytes = bytes => createHash('sha256').update(bytes).digest('hex');
const count = (text, part) => text.split(part).length - 1;

// ---------------------------------------------------------------- professor.html (financeiro)
const NEW_BLOCK = `<script id="ap-finance-replacements">(function(){
 'use strict';
 // Mensalidade corrigida: um novo pagamento que quita o MESMO vencimento do mesmo aluno substitui o anterior, depois de confirmação.
 // O registro anterior não é apagado: fica no histórico, marcado como substituído (o novo guarda em "replaces" o id dele), e sai do
 // Recebido do mês, dos resultados por mês e do histórico enviado ao aluno. Recebimento "sem quitar" (settlesMonthlyFee:false) não entra.
 const money=cents=>cents===null?'valor não informado':APFinanceWallet.money(cents);
 function sameInstallment(payment){
  const due=APBilling.date(payment.dueDate);if(!due||!payment.studentId)return [];
  const replaced=APFinanceWallet.replacedIds(state.payments);
  return (state.payments||[]).filter(row=>row&&row.id!==payment.id&&row.studentId===payment.studentId&&row.settlesMonthlyFee!==false&&APBilling.date(row.dueDate)===due&&!replaced.has(row.id));
 }
 const before=commitFinanceChange;
 commitFinanceChange=function(student,changes,historyText,payment=null,receiptLedger=null){
  if(!payment||payment.settlesMonthlyFee===false)return before.apply(this,arguments);
  const prior=sameInstallment(payment);
  if(!prior.length)return before.apply(this,arguments);
  const old=prior.map(row=>money(APBilling.cents(row.amount))).join(' + ');
  if(!window.confirm('O vencimento de '+fmtDate(payment.dueDate)+' de '+(student?.name||'este aluno')+' já tem pagamento registrado: '+old+'.\\n\\nSubstituir pelo novo valor, '+money(APBilling.cents(payment.amount))+'?\\n\\nO registro anterior fica guardado no histórico como substituído e deixa de entrar nas somas.')){
   toast('Nada foi registrado. O pagamento anterior continua valendo.',6500);
   return null;
  }
  const args=[...arguments];
  args[3]={...payment,replaces:[...new Set([...(Array.isArray(payment.replaces)?payment.replaces:[]),...prior.map(row=>row.id)])]};
  return before.apply(this,args);
 };
 // Histórico enviado ao aluno sem o pagamento substituído (o modelo compartilhado ap-billing-model não muda).
 const make=APBilling.make;
 globalThis.APBilling=Object.freeze({...APBilling,make(data,student,pixKey){const replaced=APFinanceWallet.replacedIds(data?.payments);return make({...data,payments:(data?.payments||[]).filter(row=>!row||!replaced.has(row.id))},student,pixKey)}});
})();
</script>`;

const PROFESSOR = [
  ['o modelo do Recebido: a lista dos pagamentos substituídos',
    ` function build(state,now=new Date()){\n  const month=now.getFullYear()`,
    ` // Ids dos pagamentos substituídos por outro do mesmo vencimento (o novo guarda "replaces"); ficam no histórico e fora das somas.\n function replacedIds(payments){const out=new Set();for(const p of payments||[])if(p&&Array.isArray(p.replaces))for(const id of p.replaces)if(typeof id==='string'&&id)out.add(id);return out}\n function build(state,now=new Date()){\n  const month=now.getFullYear()`],
  ['o Recebido do mês sem os substituídos',
    `  const seen=new Set();\n  for(const p of state.payments||[]){\n   if(!p||typeof p.paidAt!=='string')continue;`,
    `  const seen=new Set(),replaced=replacedIds(state.payments);\n  for(const p of state.payments||[]){\n   if(!p||typeof p.paidAt!=='string')continue;`],
  ['o Recebido do mês: pular o substituído',
    `   const key=typeof p.id==='string'?p.id.trim():'';if(key&&seen.has(key))continue;if(key)seen.add(key);\n   receivedCount++;`,
    `   const key=typeof p.id==='string'?p.id.trim():'';if(key&&seen.has(key))continue;if(key)seen.add(key);if(key&&replaced.has(key))continue;\n   receivedCount++;`],
  ['o modelo do Recebido: exportar a lista',
    ` global.APFinanceWallet=Object.freeze({build,money});`,
    ` global.APFinanceWallet=Object.freeze({build,money,replacedIds});`],
  ['os resultados por mês sem os substituídos',
    `  const today=day(now),seen=new Set();let invalidDates=0;\n  for(const p of state.payments||[]){\n   if(!p)continue;const key=typeof p.id==='string'?p.id.trim():'';if(key&&seen.has(key))continue;if(key)seen.add(key);`,
    `  const today=day(now),seen=new Set(),replaced=global.APFinanceWallet&&APFinanceWallet.replacedIds?APFinanceWallet.replacedIds(state.payments):new Set();let invalidDates=0;\n  for(const p of state.payments||[]){\n   if(!p)continue;const key=typeof p.id==='string'?p.id.trim():'';if(key&&seen.has(key))continue;if(key)seen.add(key);if(key&&replaced.has(key))continue;`],
  ['o comprovante Pix: manter a marca de substituição ao limpar dados de comprovantes antigos',
    `   const {id,studentId,studentName,dueDate,paidAt,amount,paidDatePrecision}=row;\n   return {id,studentId,studentName:studentName||student.name,dueDate,paidAt,amount,...(paidDatePrecision?{paidDatePrecision}:{})};`,
    `   const {id,studentId,studentName,dueDate,paidAt,amount,paidDatePrecision,replaces}=row;\n   return {id,studentId,studentName:studentName||student.name,dueDate,paidAt,amount,...(paidDatePrecision?{paidDatePrecision}:{}),...(Array.isArray(replaces)&&replaces.length?{replaces}:{})};`],
  ['o histórico de pagamentos: lista dos substituídos',
    `  const all=state.payments.filter(payment=>!monthFilter.value||monthOf(payment)===monthFilter.value)`,
    `  const replacedRows=APFinanceWallet.replacedIds(state.payments);\n  const all=state.payments.filter(payment=>!monthFilter.value||monthOf(payment)===monthFilter.value)`],
  ['o histórico de pagamentos: marca no registro substituído e no que substitui',
    `return '<article class="payment-row receipt-payment-row"><div>`,
    `const replacedRow=replacedRows.has(p.id);return '<article class="payment-row receipt-payment-row'+(replacedRow?' payment-replaced" style="opacity:.62':'')+'"><div>`],
  ['o histórico de pagamentos: textos da substituição',
    `+(p.settlesMonthlyFee===false?'<small>Recebimento sem quitar o vencimento</small>':'')+(p.method==='pix'||receipt?`,
    `+(p.settlesMonthlyFee===false?'<small>Recebimento sem quitar o vencimento</small>':'')+(replacedRow?'<small>Substituído por um registro mais novo deste vencimento · fora das somas</small>':'')+(Array.isArray(p.replaces)&&p.replaces.length?'<small>Substitui o registro anterior deste vencimento</small>':'')+(p.method==='pix'||receipt?`],
];
// o bloco novo entra logo depois do ap-pix-receipt (envolve o commitFinanceChange dele)
const PROFESSOR_INSERT = ['</script><script id="ap-teacher-mascot-day">', '</script>' + NEW_BLOCK + '<script id="ap-teacher-mascot-day">'];

// ---------------------------------------------------------------- avaliacoes.html (IMC por idade)
const AVALIACOES = [
  ['a faixa de IMC pela idade e o cálculo da faixa de peso',
    `  function weightReferenceStatus(d) {
    if (!Number.isFinite(d?.weight) || !Number.isFinite(d?.height) || d.weight <= 0 || d.height <= 0) return null;
    const h = d.height / 100;
    const bmi = d.weight / (h ** 2);
    const lowWeight = 18.5 * h ** 2;
    const highWeight = 25 * h ** 2;
    if (bmi < 18.5) return { status: 'below', bmi, lowWeight, highWeight, targetWeight: lowWeight, delta: lowWeight - d.weight };
    if (bmi >= 25) return { status: 'above', bmi, lowWeight, highWeight, targetWeight: highWeight, delta: d.weight - highWeight };
    return { status: 'within', bmi, lowWeight, highWeight, targetWeight: d.weight, delta: 0 };
  }`,
    `  // Faixa de IMC pela idade da avaliação: adulto 18,5 a <25,0; 60 anos ou mais, referência do Ministério da Saúde para pessoas idosas,
  // < 22 baixo peso, 22 a 27 adequado, > 27 sobrepeso. Sem idade informada vale a faixa adulta.
  function bmiReference(age) {
    return Number.isFinite(age) && age >= 60
      ? { elderly: true, low: 22, high: 27, upperInclusive: true, rangeShort: '22–27', label: 'para pessoa idosa (60 anos ou mais: IMC 22 a 27, referência do Ministério da Saúde)' }
      : { elderly: false, low: 18.5, high: 25, upperInclusive: false, rangeShort: '18,5–24,9', label: '(IMC 18,5 a <25,0)' };
  }
  function weightReferenceStatus(d) {
    if (!Number.isFinite(d?.weight) || !Number.isFinite(d?.height) || d.weight <= 0 || d.height <= 0) return null;
    const ref = bmiReference(d.age);
    const h = d.height / 100;
    const bmi = d.weight / (h ** 2);
    const lowWeight = ref.low * h ** 2;
    const highWeight = ref.high * h ** 2;
    if (bmi < ref.low) return { status: 'below', bmi, lowWeight, highWeight, targetWeight: lowWeight, delta: lowWeight - d.weight, ref };
    if (ref.upperInclusive ? bmi > ref.high : bmi >= ref.high) return { status: 'above', bmi, lowWeight, highWeight, targetWeight: highWeight, delta: d.weight - highWeight, ref };
    return { status: 'within', bmi, lowWeight, highWeight, targetWeight: d.weight, delta: 0, ref };
  }`],
  ['o valor curto da Meta 3',
    "    if (w.status === 'above') return `< ${fmt(w.targetWeight)} kg`;\n    if (w.status === 'below') return `≥ ${fmt(w.targetWeight)} kg`;\n    return `${fmt(w.lowWeight)}–<${fmt(w.highWeight)} kg`;",
    "    if (w.status === 'above') return `${w.ref.upperInclusive ? '≤' : '<'} ${fmt(w.targetWeight)} kg`;\n    if (w.status === 'below') return `≥ ${fmt(w.targetWeight)} kg`;\n    return `${fmt(w.lowWeight)}–${w.ref.upperInclusive ? '' : '<'}${fmt(w.highWeight)} kg`;"],
  ['o texto da faixa de peso (acima)',
    "    if (w.status === 'above') return `IMC ${fmt(w.bmi, 2)}: acima da faixa de peso adequado (IMC 18,5 a <25,0). Para entrar nela pelo limite superior, o peso deve ficar abaixo de ≈ ${fmt(w.targetWeight)} kg",
    "    if (w.status === 'above') return `IMC ${fmt(w.bmi, 2)}: acima da faixa de peso adequado ${w.ref.label}. Para entrar nela pelo limite superior, o peso deve ficar ${w.ref.upperInclusive ? 'em até' : 'abaixo de'} ≈ ${fmt(w.targetWeight)} kg"],
  ['o texto da faixa de peso (abaixo)',
    "    if (w.status === 'below') return `IMC ${fmt(w.bmi, 2)}: abaixo da faixa de peso adequado (IMC 18,5 a <25,0). Para alcançar IMC 18,5, o peso",
    "    if (w.status === 'below') return `IMC ${fmt(w.bmi, 2)}: abaixo da faixa de peso adequado ${w.ref.label}. Para alcançar IMC ${w.ref.elderly ? '22' : '18,5'}, o peso"],
  ['o texto da faixa de peso (dentro)',
    "    return `IMC ${fmt(w.bmi, 2)}: está classificado como peso adequado pelo IMC (18,5 a <25,0). Para esta estatura, a faixa correspondente é ≈ ${fmt(w.lowWeight)} kg até menos de ${fmt(w.highWeight)} kg.`;",
    "    return `IMC ${fmt(w.bmi, 2)}: está classificado como peso adequado ${w.ref.elderly ? w.ref.label : 'pelo IMC (18,5 a <25,0)'}. Para esta estatura, a faixa correspondente é ≈ ${fmt(w.lowWeight)} kg até ${w.ref.upperInclusive ? '' : 'menos de '}${fmt(w.highWeight)} kg.`;"],
  ['a classificação do peso pelo IMC',
    "  function bmiCategory(bmi) {\n    return bmi < 18.5 ? 'baixo peso' : bmi < 25 ? 'peso adequado' : bmi < 30 ? 'sobrepeso' : 'obesidade';\n  }",
    "  function bmiCategory(bmi, age) {\n    if (bmiReference(age).elderly) return bmi < 22 ? 'baixo peso' : bmi <= 27 ? 'peso adequado' : 'sobrepeso';\n    return bmi < 18.5 ? 'baixo peso' : bmi < 25 ? 'peso adequado' : bmi < 30 ? 'sobrepeso' : 'obesidade';\n  }"],
  ['a classificação da avaliação anterior (PDF, evolução)',
    "<dt>Classificação do peso</dt><dd>${bmiCategory(previousBmi)}</dd>",
    "<dt>Classificação do peso</dt><dd>${bmiCategory(previousBmi, Number.isFinite(previous.data.age) ? previous.data.age : d.age)}</dd>"],
  ['a classificação da avaliação atual (PDF, evolução)',
    "<dt>Classificação do peso</dt><dd>${bmiCategory(bmi)}</dd>",
    "<dt>Classificação do peso</dt><dd>${bmiCategory(bmi, d.age)}</dd>"],
  ['a classificação no cartão de compartilhar',
    "`Classificação: ${bmiCategory(info.bmi)}`",
    "`Classificação: ${bmiCategory(info.bmi, info.data?.age)}`"],
  ['a classificação no PDF',
    "`Classificação pelo peso e altura: ${bmiCategory(bmi)}*`",
    "`Classificação pelo peso e altura: ${bmiCategory(bmi, d.age)}${bmiReference(d.age).elderly ? ' (60 anos ou mais)' : ''}*`"],
  ['a Meta 3 do PDF (faixa de peso)',
    "`${fmt(w.lowWeight)}–${fmt(w.highWeight)} kg para IMC 18,5–24,9` : `IMC 18,5–24,9 · ",
    "`${fmt(w.lowWeight)}–${fmt(w.highWeight)} kg para IMC ${w.ref.rangeShort}${w.ref.elderly ? ' (60 anos ou mais)' : ''}` : `IMC ${w.ref.rangeShort}${w.ref.elderly ? ' (60 anos ou mais)' : ''} · "],
  ['a explicação da Meta 3 no PDF',
    "se já estiver na faixa, mostra o intervalo de peso correspondente à estatura. Essa Meta 3",
    "se já estiver na faixa, mostra o intervalo de peso correspondente à estatura. Para quem tem 60 anos ou mais, usa a faixa do Ministério da Saúde para pessoas idosas (IMC 22 a 27), com limite superior 27 e inferior 22. Essa Meta 3"],
  ['a ajuda da Meta 3 na tela',
    'Calculada por peso e estatura usando a faixa adulta de IMC 18,5–24,9.',
    'Calculada por peso e estatura: faixa adulta de IMC 18,5–24,9; com 60 anos ou mais, faixa para pessoas idosas de IMC 22–27 (Ministério da Saúde).'],
  ['a explicação do automático na tela',
    'se o IMC estiver acima da faixa adulta de 18,5–24,9,',
    'se o IMC estiver acima da faixa adulta de 18,5–24,9 (22–27 para quem tem 60 anos ou mais),'],
];

function edit(html, changes, page) {
  let out = html;
  for (const [what, from, to] of changes) {
    assert.equal(count(out, from), 1, `Não achei ${what} (${page}) uma única vez no 1.12.298`);
    out = out.replace(from, () => to);
  }
  return out;
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, SOURCE_VERSION);
  assert.equal(source.sequence, SOURCE_SEQUENCE);
  assert.equal(sequence, SOURCE_SEQUENCE + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  const { agendaSignature, ...original } = source;
  let professor = edit(original.files['professor.html'], PROFESSOR, 'professor.html');
  assert.equal(count(professor, 'id="ap-finance-replacements"'), 0, 'O bloco novo já existe');
  professor = edit(professor, [['o lugar do bloco novo (depois do ap-pix-receipt)', ...PROFESSOR_INSERT]], 'professor.html');
  const avaliacoes = edit(original.files['avaliacoes.html'], AVALIACOES, 'avaliacoes.html');
  const files = {...original.files, 'professor.html': professor, 'avaliacoes.html': avaliacoes};
  return {...original, files, version, sequence, notes, update: {category: 'general', title, summary}};
}

function loadSource(sourceFile) {
  const bytes = readFileSync(sourceFile);
  assert.equal(sha256Bytes(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.298 da main (SHA-256 diferente): ' + sourceFile);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const data = makeUpdate(loadSource(sourceFile));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256Bytes(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, NEW_BLOCK, PROFESSOR, AVALIACOES, version, sequence, title, summary, notes, SOURCE_NAME, SOURCE_SHA256, TARGET_NAME};
