'use strict';

// Gera o pacote 1.12.302 / 408 (sem assinatura) a partir do 1.12.301 / 407 da main (SHA-256 conferido).
// Pedido: Tiago, 22/11/2026 11:31 ("na parte Mais coloca o nome dos feedbacks… a pessoa pode escolher o nome… se não colocar nenhum
// nome vai aparecer só Agenda Personal") e 11:36 ("Concordo pode fazer").
//
// O que muda:
//  - Configurações (Mais → Configurações) ganha o cartão "Nome nos feedbacks": um campo de até 40 letras, salvo no perfil do professor
//    (state.trainerProfile.feedbackName, que já viaja para os outros aparelhos do professor pela sincronização do perfil).
//  - O rodapé do cartão de feedback (o que o aluno e o professor salvam ou compartilham) passa a ser "<nome> · Acompanhamento de treino.".
//    Sem nome: "Agenda Personal · Acompanhamento de treino." (igual a hoje).
//  - O nome vai para o aluno dentro da área do aluno que o app já envia (area.trainer.feedbackName, dentro do campo payload). As regras
//    do Firestore não mudam: a regra de usuarios/{uid}/treinos/atual só confere as chaves do documento (version, professorId, studentId,
//    studentUid, payload, updatedAt), não o conteúdo do payload. Aluno com pacote antigo ignora o campo novo (assertArea não confere
//    area.trainer). Salvar o nome chama save(), que já dispara o reenvio das áreas (queue() do bloco data-ap-student-area).
//
// Pacote completo porque a tela Configurações e o modelo da área do aluno (script data-ap-student-model, sem id) estão fora dos blocos.
// Não muda: login, alunos, treinos, agenda, financeiro, avaliações, Firebase (nem regras nem coleções), descanso, cronômetros, alarmes,
// notificações, sons, mascotes; o cabeçalho do cartão (símbolo ou nome do perfil) continua igual.
//
// Uso: node tools/gerar-nome-feedbacks-1.12.302.cjs [pacote-1.12.301.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.302';
const sequence = 408;
const title = 'Nome nos feedbacks';
const summary = 'Em Configurações você escolhe o nome que aparece no rodapé dos cartões de feedback. Em branco, continua "Agenda Personal".';
const notes = 'Nome nos feedbacks.\n\n'
  + 'Em Mais → Configurações há um cartão novo, "Nome nos feedbacks". O nome escolhido (até 40 letras, por exemplo o seu nome ou o do '
  + 'seu estúdio) aparece no rodapé do cartão de feedback que você e os seus alunos salvam ou compartilham: '
  + '"<nome> · Acompanhamento de treino.". Deixe em branco para continuar aparecendo "Agenda Personal".\n\n'
  + 'Os alunos recebem o nome junto com a ficha, na próxima sincronização. Quem ainda não atualizou o aplicativo continua vendo '
  + '"Agenda Personal".\n\n'
  + 'O que não muda: login, alunos, treinos, agenda, financeiro, avaliações, Firebase, descanso, cronômetros, alarmes, notificações, '
  + 'sons e mascotes.\n\n'
  + 'Inclui tudo do 1.12.301 e deve ser instalado no lugar dele.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.301-Publicar-Barra-Erro-Para-Assinar.agenda.json';
const SOURCE_SHA256 = 'daf5e60ff1b08a780e4c6fbf339e24bee301772c684d4b94d6e00928c7fcb44f';
const TARGET_NAME = 'AgendaPersonal-1.12.302-Nome-Feedbacks-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// ---------------------------------------------------------------------------------------------------------------------------------
// ap-feedback-card (mesma mudança nas duas páginas: o texto do bloco continua idêntico no aluno e no professor)
const CARD_CHANGES = [
  ['a função que escreve o rodapé (nome escolhido ou Agenda Personal; encurta se não couber)',
    'async function w(t,{photo:f="",accent:i="#b6ff26",professional:a="Agenda Personal"}={}){',
    // 1.12.302: rodapé com o "Nome nos feedbacks" (vazio = Agenda Personal).
    'function apFeedbackFooter(e,b){const q=(typeof b==="string"?b.replace(/[\\u0000-\\u001f\\u007f]/g,"").replace(/\\s+/g," ").trim().slice(0,40):"")||"Agenda Personal";'
    + 'const z=q+" · Acompanhamento de treino.";return e.measureText(z).width<=920?z:q}'
    + 'async function w(t,{photo:f="",accent:i="#b6ff26",professional:a="Agenda Personal",brand:ap302brand=""}={}){'],
  ['o rodapé do cartão',
    'e.fillText("Agenda Personal · Acompanhamento de treino.",80,n.height-90)',
    'e.fillText(apFeedbackFooter(e,ap302brand),80,n.height-90)'],
];

// ap-feedback-student (index.html): o aluno usa o nome que veio na área dele.
const STUDENT_CHANGES = [
  ['o cartão do aluno recebe o nome da área do aluno',
    'professional:"Agenda Personal",photo:',
    'professional:"Agenda Personal",brand:String(window.__AP_STUDENT_CONTEXT?.area?.trainer?.feedbackName||""),photo:'],
];

// ap-feedback-teacher (professor.html): o professor usa o nome salvo em Configurações.
const TEACHER_CHANGES = [
  ['o cartão do professor recebe o nome de Configurações',
    'professional:"function"==typeof trainerProfile?trainerProfile().name:"Agenda Personal",',
    'professional:"function"==typeof trainerProfile?trainerProfile().name:"Agenda Personal",brand:"function"==typeof window.APFeedbackName?window.APFeedbackName():"",'],
];

// Fora dos blocos (professor.html): o cartão na tela Configurações e o campo na área enviada ao aluno.
const SETTINGS_ANCHOR = '<p id="teacherTextStatus" role="status" aria-live="polite"></p></section>';
const SETTINGS_HTML = '<section class="teacher-text-setting feedback-name-setting" aria-labelledby="feedbackNameTitle">'
  + '<h3 id="feedbackNameTitle">Nome nos feedbacks</h3>'
  + '<p>Aparece no rodapé do cartão de feedback que você e os seus alunos salvam ou compartilham. Em branco, aparece Agenda Personal.</p>'
  + '<form id="feedbackNameForm" class="feedback-name-row" autocomplete="off">'
  + '<input id="feedbackNameInput" type="text" maxlength="40" placeholder="Agenda Personal" aria-label="Nome nos feedbacks" enterkeyhint="done">'
  + '<button class="btn primary" type="submit">Salvar</button></form>'
  + '<p id="feedbackNamePreview" class="feedback-name-preview" aria-live="polite"></p>'
  + '<p id="feedbackNameStatus" role="status" aria-live="polite"></p></section>';
const OUTSIDE_CHANGES = [
  ['o cartão "Nome nos feedbacks" em Configurações, logo depois de Tamanho das letras',
    SETTINGS_ANCHOR, SETTINGS_ANCHOR + SETTINGS_HTML],
  ['o nome dos feedbacks dentro da área enviada ao aluno (area.trainer)',
    'cref:text(trainer.cref,40),photo:',
    'cref:text(trainer.cref,40),feedbackName:text(trainer.feedbackName,40).replace(/\\s+/g," "),photo:'],
];

// Blocos novos (professor.html), antes de </body>.
const NEW_CSS = '.feedback-name-setting .feedback-name-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:0}'
  + '.feedback-name-setting input{box-sizing:border-box;width:100%;min-width:0;min-height:48px;margin:0;padding:10px 12px;'
  + 'border:1px solid var(--ac-line,var(--line));border-radius:11px;background:var(--ac-field,var(--panel2));color:var(--ac-text,var(--text));'
  + 'font:inherit;font-size:calc(.95rem * var(--ap-ts,1))}'
  + '.feedback-name-setting input::placeholder{color:var(--ac-muted,var(--muted));opacity:.85}'
  + '.feedback-name-setting .feedback-name-row .btn{min-height:48px;margin:0;padding:10px 18px;border-radius:11px;white-space:nowrap}'
  + '.feedback-name-setting .feedback-name-preview{font-size:calc(.78rem * var(--ap-ts,1));line-height:1.45;margin:10px 0 0;'
  + 'color:var(--ac-muted,var(--muted));overflow-wrap:anywhere}'
  + '.feedback-name-setting #feedbackNameStatus{font-size:calc(.78rem * var(--ap-ts,1));margin:6px 0 0}'
  + '.feedback-name-setting #feedbackNameStatus:empty{display:none}'
  + '.feedback-name-setting #feedbackNameStatus[data-error=true]{color:var(--ac-danger)}'
  + '@media print{.feedback-name-setting{display:none}}';
const NEW_JS = '(function(){\n'
  + ' \'use strict\';\n'
  + ' // 1.12.302: "Nome nos feedbacks" (Configurações). Fica em state.trainerProfile.feedbackName; vazio = Agenda Personal.\n'
  + ' const MAX=40,DEFAULT_NAME=\'Agenda Personal\';\n'
  + ' const clean=v=>String(v??\'\').replace(/[\\u0000-\\u001f\\u007f]/g,\'\').replace(/\\s+/g,\' \').trim().slice(0,MAX);\n'
  + ' function current(){try{return clean(state?.trainerProfile?.feedbackName)}catch(_){return \'\'}}\n'
  + ' window.APFeedbackName=current;\n'
  + ' const $=id=>document.getElementById(id);\n'
  + ' function preview(value){const p=$(\'feedbackNamePreview\');if(p)p.textContent=\'No cartão: \'+(clean(value)||DEFAULT_NAME)+\' · Acompanhamento de treino.\'}\n'
  + ' function status(text,error){const s=$(\'feedbackNameStatus\');if(!s)return;s.textContent=text;s.dataset.error=error?\'true\':\'false\'}\n'
  + ' function fill(){const input=$(\'feedbackNameInput\');if(!input||document.activeElement===input)return;input.value=current();preview(input.value)}\n'
  + ' function init(){\n'
  + '  const form=$(\'feedbackNameForm\'),input=$(\'feedbackNameInput\');if(!form||!input||form.dataset.ready)return;form.dataset.ready=\'1\';\n'
  + '  fill();\n'
  + '  input.addEventListener(\'input\',()=>{preview(input.value);status(\'\')});\n'
  + '  form.addEventListener(\'submit\',event=>{\n'
  + '   event.preventDefault();const value=clean(input.value);input.value=value;preview(value);\n'
  + '   if(value===current()){status(value?\'Este nome já está salvo.\':\'Já aparece Agenda Personal.\');return}\n'
  + '   const previous=state.trainerProfile;state.trainerProfile={...(previous||{}),feedbackName:value};\n'
  + '   try{save();status(value?\'Salvo. Os alunos recebem o nome na próxima sincronização.\':\'Nome removido. Volta a aparecer Agenda Personal.\');input.blur()}\n'
  + '   catch(_){state.trainerProfile=previous;status(\'Não foi possível salvar. Verifique o espaço disponível.\',true)}\n'
  + '  });\n'
  + '  const screen=$(\'screen-settings\');\n'
  + '  if(screen&&window.MutationObserver)new MutationObserver(()=>{fill();status(\'\')}).observe(screen,{attributes:true,attributeFilter:[\'class\',\'hidden\']});\n'
  + ' }\n'
  + ' if(document.readyState===\'loading\')document.addEventListener(\'DOMContentLoaded\',init);else init();\n'
  + '})();\n';
const NEW_BLOCKS = '<style id="ap-feedback-name-css">' + NEW_CSS + '</style><script id="ap-feedback-name">' + NEW_JS + '</script>\n';

// ---------------------------------------------------------------------------------------------------------------------------------
function replaceOnce(text, what, from, to) {
  assert.equal(count(text, from), 1, 'Não achei ' + what + ' uma única vez no 1.12.301');
  return text.replace(from, () => to);
}

function editBlock(html, id, changes, tag = 'script') {
  const open = '<' + tag + ' id="' + id + '">';
  assert.equal(count(html, open), 1, 'O bloco ' + id + ' não aparece uma única vez');
  const start = html.indexOf(open) + open.length;
  const end = html.indexOf('</' + tag + '>', start);
  let inner = html.slice(start, end);
  for (const [what, from, to] of changes) inner = replaceOnce(inner, what, from, to);
  return html.slice(0, start) + inner + html.slice(end);
}

function editIndex(html) {
  html = editBlock(html, 'ap-feedback-card', CARD_CHANGES);
  html = editBlock(html, 'ap-feedback-student', STUDENT_CHANGES);
  return html;
}

function editProfessor(html) {
  html = editBlock(html, 'ap-feedback-card', CARD_CHANGES);
  html = editBlock(html, 'ap-feedback-teacher', TEACHER_CHANGES);
  for (const [what, from, to] of OUTSIDE_CHANGES) html = replaceOnce(html, what, from, to);
  assert.equal(count(html, 'id="ap-feedback-name"'), 0);
  assert.equal(count(html, '</body>'), 1, 'professor.html deveria ter um único </body>');
  return html.replace('</body>', () => NEW_BLOCKS + '</body>');
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.301');
  assert.equal(source.sequence, 407);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notes.length <= 4000, 'notas: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'index.html': editIndex(original.files['index.html']), 'professor.html': editProfessor(original.files['professor.html'])};
  return {...original, files, version, sequence, notes, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.301 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editIndex, editProfessor, CARD_CHANGES, version, sequence, TARGET_NAME, SOURCE_NAME, NEW_JS, NEW_CSS};
