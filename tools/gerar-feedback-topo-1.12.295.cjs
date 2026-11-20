'use strict';

// Gera o pacote 1.12.295 (sem assinatura) a partir do pacote 1.12.294 (seq 400). Muda só a tela do aluno (index.html), só o script
// ap-feedback-student. O estilo (ap-feedback-css, componente compartilhado) e o professor.html NÃO mudam.
// Motivo (Tiago, 20/11, 11:38, ditado, com duas fotos do celular da aluna Silvana depois de instalar o 1.12.294): o ícone do feedback não
// aparecia no topo do Início (a aluna estava sem feedback pendente, e desde o 1.12.292 o botão só existia com pendência) e o feedback
// continuava "atrelado ao pet" (botão "Seus feedbacks" dentro da janela do pet, aviso vermelho no cartão do pet). Pedido: "quero que suma
// daí e que o ícone apareça lá em cima e a pessoa entra por lá".
// O que o pacote faz:
//  - O botão do feedback no topo do Início passa a existir SEMPRE para o aluno logado (o mesmo critério de antes: APFeedbackSync.uid(), que
//    só tem valor para aluno com a área ligada; a visualização pelo professor e o cadastro por link continuam sem o botão). O número só
//    aparece quando há feedback pendente; sem pendência o botão fica sem número e tocar nele abre a mesma janela "Como foi hoje?" com a
//    lista dos feedbacks (ou a frase de que ainda não há nenhum). Rótulo: "Feedback do treino" ou "Feedback do treino, N pendente(s)".
//  - Sai do pet: o aviso vermelho "Treino concluído · dê seu feedback" no cartão do pet, a troca da fala do pet e o botão "Seus feedbacks"
//    (ou "Você concluiu o treino. Dê seu feedback") dentro da janela do pet. Sai também o cartão "Treino concluído · dê seu feedback (N)"
//    que aparecia no Início quando o pet estava escondido (o botão do topo faz o mesmo papel).
//  - O texto do painel "Ícone do feedback" em Meu perfil passa a dizer que o ícone fica no topo do Início.
// Não muda: as recompensas do pet por feedback, a janela do feedback, o envio, a fila, APFeedbackSync, o Firebase, o estilo, o professor,
// avaliacoes.html, cadastro.html, descanso, cronômetros, alarmes e notificações. As regras de estilo antigas do aviso do pet ficam no
// estilo sem efeito (tirar mexeria no componente compartilhado e no professor.html sem ganho).
// Custo conhecido: com o botão sempre presente, o topo do aluno fica sempre no arranjo do 1.12.292 com pendência (ícones a 4 px; com nome
// comprido o cumprimento pode ir para mais linhas ou os ícones descerem), não só quando há pendência.
// Numeração: sequência = número da versão + 106. 1.12.295 = sequência 401 = 294 (400) + 1. Completo e cumulativo: inclui tudo do
// 1.12.294 e deve ser instalado no lugar dele. Próximos pacotes completos partem deste (1.12.296 / 402 ou mais).

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const base = require('./gerar-icone-feedback-1.12.294.cjs');
const { findBlocks } = require('./gerar-correcoes-exercicios-1.12.291.cjs');

const version = '1.12.295';
const sequence = 401;
const title = 'Feedback pelo ícone do topo';
const summary = 'O ícone do feedback fica sempre no topo do Início do aluno (com o número quando há pendência) e o feedback sai do pet. Inclui o 1.12.294 e tudo o que já está na main, exceto a Raposinha.';
const notes = 'Feedback pelo ícone do topo. O botão do feedback no topo do Início do aluno, ao lado do sino, agora aparece sempre para o aluno, '
  + 'e não só quando há feedback pendente. Quando há pendência ele mostra o número (1, 2, 3...); sem pendência fica sem número. '
  + 'Tocar nele abre a janela "Como foi hoje?" com os feedbacks do aluno, como antes.\n\n'
  + 'O feedback sai do pet: o aviso vermelho "Treino concluído · dê seu feedback" no cartão do pet e o botão "Seus feedbacks" dentro da janela do pet deixam de aparecer. '
  + 'O cartão de aviso que aparecia no Início quando o pet estava escondido também sai. A entrada do feedback passa a ser só o ícone do topo. '
  + 'As recompensas do pet por responder o feedback continuam como antes.\n\n'
  + 'O ícone continua o escolhido em Meu perfil, "Ícone do feedback", na cor do aplicativo.\n\n'
  + 'O que não muda: a janela do feedback, o envio ao professor, os dados, o Firebase, a tela do professor, o descanso do treino, os cronômetros, os alarmes e as notificações.\n\n'
  + 'Inclui tudo do 1.12.294 (ícone personalizável, sino do feedback, correções de exercícios e as atualizações que já estão no GitHub, exceto a Raposinha) e deve ser instalado no lugar dele.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_VERSION = '1.12.294';
const SOURCE_SEQUENCE = 400;
const SOURCE_NAME = 'AgendaPersonal-1.12.294-Icone-Feedback-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '2bf38cc59b48a663e00da9faf8d2feb7ca48ae186ff833500c0a0e68fea230e9';
const END_BLOCK = /<\/\s*script\b/i;
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const sha256Bytes = bytes => createHash('sha256').update(bytes).digest('hex');
const { count } = base;

// [o que é, texto no 1.12.294 (precisa existir UMA vez), texto no 1.12.295]
const JS_CHANGES = [
  ['o observador do cartão do pet (não precisa mais recolocar o aviso)',
    'const r=new MutationObserver(e=>{(e.some(e=>"attributes"===e.type)||t.pending().length&&i&&!i.hasAttribute("data-pet-selection")&&!i.querySelector(".ap-feedback-pet-notice"))&&f()})',
    'const r=new MutationObserver(e=>{e.some(e=>"attributes"===e.type)&&f()})'],
  ['o aviso do feedback no cartão do pet (sai; o que um aparelho ainda tiver na tela é limpo)',
    'if(n){const a=n.classList.contains("ap-feedback-pending");if(n.classList.toggle("ap-feedback-pending",!selection&&e>0&&!!t.uid()),n.querySelector(".ap-feedback-pet-notice")?.remove(),!selection&&e&&t.uid()){const t=n.querySelector(".ap-mascot-speech");t&&(t.textContent="Você finalizou seu treino presencial. Conte ao professor como foi.");const a=document.createElement("span");a.className="ap-feedback-pet-notice",a.innerHTML="<strong>Treino concluído · dê seu feedback</strong><span>"+e+" "+(1===e?"resposta pendente":"respostas pendentes")+" · toque aqui</span>",n.appendChild(a)}else a&&t.uid()&&window.APmascot?.refreshHome()}',
    'if(n){const a=n.classList.contains("ap-feedback-pending");n.classList.remove("ap-feedback-pending"),n.querySelector(".ap-feedback-pet-notice")?.remove(),a&&t.uid()&&window.APmascot?.refreshHome()}'],
  ['o cartão do Início sem pet e o botão "Seus feedbacks" da janela do pet (saem)',
    'let s=a("apFeedbackHome");s||(s=document.createElement("button"),s.id="apFeedbackHome",s.type="button",s.className="ap-feedback-home",s.onclick=()=>m(),o.appendChild(s)),s.hidden=!t.uid()||!e||!!n&&!n.hidden&&!selection,s.textContent="Treino concluído · dê seu feedback ("+e+")",e&&t.uid()&&d&&d.before(s);let c=a("apMascotFeedback");const p=a("apMascotBody");p&&!c&&(c=document.createElement("button"),c.id="apMascotFeedback",c.type="button",c.className="ap-feedback-home",c.onclick=()=>m(),p.prepend(c)),c&&(c.hidden=!t.uid(),c.textContent=e?"Você concluiu o treino. Dê seu feedback ("+e+")":"Seus feedbacks",c.classList.toggle("ap-feedback-pending",e>0)),feedbackBell(e)}',
    'a("apFeedbackHome")?.remove(),a("apMascotFeedback")?.remove(),feedbackBell(e)}'],
  ['quando o botão do topo aparece (sempre, para o aluno logado)',
    'const show=!!t.uid()&&count>0;',
    'const show=!!t.uid();'],
  ['o rótulo do botão do topo',
    'const label="Feedback do treino, "+count+(1===count?" pendente":" pendentes")',
    'const label="Feedback do treino"+(count>0?", "+count+(1===count?" pendente":" pendentes"):"")'],
  ['o número do botão do topo (só com pendência)',
    'a("apFeedbackBellCount").textContent=String(count);',
    'const num=a("apFeedbackBellCount");num.textContent=count>0?String(count):"";num.hidden=!(count>0);'],
  ['o texto do painel "Ícone do feedback" de Meu perfil',
    'Este ícone aparece no topo do Início quando há um feedback do treino para você enviar.',
    'Este ícone fica no topo do Início. Toque nele para ver e enviar seus feedbacks do treino.']
];

const SCRIPT_EDIT = {
  id: 'ap-feedback-student', kind: 'script',
  before: base.SCRIPT_EDIT.after,
  after: 'cf666ed2b6103ab4c9cde9fa3051ca0c5e39e02afd41da037b4a852638fb2cd3',
  apply: inner => {
    let out = inner;
    for (const [what, from, to] of JS_CHANGES) {
      assert.equal(count(out, from), 1, 'Não achei ' + what + ' no feedback do aluno do 1.12.294');
      out = out.split(from).join(to);
    }
    return out;
  }
};

function editScript(html) {
  const block = findBlocks(html, new Map([[SCRIPT_EDIT.id, SCRIPT_EDIT]])).get(SCRIPT_EDIT.id);
  assert.ok(block, 'O componente ap-feedback-student não existe no conteúdo em uso.');
  const current = html.slice(block.start, block.end);
  assert.notEqual(sha256(current), SCRIPT_EDIT.after, 'Esta edição já foi aplicada');
  assert.equal(sha256(current), SCRIPT_EDIT.before, 'Conflito em ap-feedback-student: o bloco não é o do 1.12.294.');
  const next = SCRIPT_EDIT.apply(current);
  assert.ok(!END_BLOCK.test(next), 'O script fecha o bloco antes da hora');
  if (SCRIPT_EDIT.after !== '@@') assert.equal(sha256(next), SCRIPT_EDIT.after, 'O bloco não ficou como o esperado (SHA-256 diferente)');
  return html.slice(0, block.start) + next + html.slice(block.end);
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
  const files = {...original.files, 'index.html': editScript(original.files['index.html'])};
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

function loadSource(sourceFile) {
  const bytes = readFileSync(sourceFile);
  assert.equal(sha256Bytes(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.294 entregue (SHA-256 diferente): ' + sourceFile);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.295-Feedback-Topo-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-feedback-topo-1.12.295.cjs <pacote-1.12.294.agenda.json> [saida.agenda.json]');
  const data = makeUpdate(loadSource(sourceFile));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {makeUpdate, loadSource, editScript, SCRIPT_EDIT, JS_CHANGES, APP_ID, SOURCE_NAME, SOURCE_SHA256, SOURCE_VERSION, SOURCE_SEQUENCE,
  sha256, version, sequence, title, summary, notes};
