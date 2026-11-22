'use strict';

// Gera o pacote 1.12.303 / 409 (sem assinatura) a partir do 1.12.302 / 408 da main (SHA-256 conferido).
// Pedido: Tiago, 22/11/2026 12:20: "eu quero que você faça sua própria [entrada] escrito Feedback com os nomes… lá no despertador também
// tem o tamanho das letras… eu quero que você coloque [uma] para o tamanho das letras e tudo fica separado".
//
// O que muda (só o professor.html):
//  - Mais → Aparência e preferências ganha dois cartões próprios, com ícone próprio:
//      "Tamanho das letras" → tela própria com os três tamanhos (o mesmo controle de antes, mesmos ids e a mesma gravação);
//      "Feedback"           → tela própria com "Nome nos feedbacks" (o mesmo campo do 1.12.302).
//  - A tela Configurações (despertador e sons) deixa de ter esses dois cartões.
//  - Ícones novos "menu-text" (A grande e a pequeno) e "menu-feedback" (o balão de feedback que o aluno já usa) nos três desenhos do
//    menu: o simples (ap-more-menu-glyphs) e os de acabamento (scripts data-agenda-metal-icons e data-agenda-deep-icons).
// Não muda: como o tamanho das letras e o nome são guardados, o cartão de feedback, o aluno (index.html), login, alunos, treinos,
// agenda, financeiro, avaliações, Firebase, descanso, cronômetros, alarmes, notificações, sons e mascotes.
//
// Uso: node tools/gerar-cartoes-separados-1.12.303.cjs [pacote-1.12.302.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.303';
const sequence = 409;
const title = 'Tamanho das letras e Feedback com cartões próprios';
const summary = 'Em Mais, "Tamanho das letras" e "Feedback" ganham cartões e telas próprios, fora de Configurações.';
const notes = 'Tamanho das letras e Feedback separados.\n\n'
  + 'Em Mais → Aparência e preferências há dois cartões novos, cada um com a sua tela: "Tamanho das letras" (Normal, Grande e Extra '
  + 'grande) e "Feedback" (o nome que aparece no rodapé dos cartões de feedback). Configurações fica só com o despertador e os sons.\n\n'
  + 'As escolhas que você já fez continuam valendo: nada precisa ser configurado de novo.\n\n'
  + 'O que não muda: o aplicativo do aluno, login, alunos, treinos, agenda, financeiro, avaliações, Firebase, descanso, cronômetros, '
  + 'alarmes, notificações, sons e mascotes.\n\n'
  + 'Inclui tudo do 1.12.302 e deve ser instalado no lugar dele.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.302-Nome-Feedbacks-Para-Assinar.agenda.json';
const SOURCE_SHA256 = 'bb04ce6f59279e02d06dfd02c2c3ace762ca78f1bfaea4d0fa1e11b0036d59e1';
const TARGET_NAME = 'AgendaPersonal-1.12.303-Cartoes-Separados-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// Ícones (24×24, preenchidos, no mesmo padrão dos outros do menu).
const GLYPHS = {
  // "Aa": um A grande e um a pequeno, com o vão interno recortado.
  'menu-text': '<path fill-rule="evenodd" d="M1 20 6.3 4h2.9l5.3 16h-2.9l-1.2-3.6H5.1L3.9 20Zm4.9-6.1h3.7L7.75 8.3Z"/>'
    + '<path fill-rule="evenodd" d="m14.6 20 3.2-9h2.1l3.2 9h-2.2l-.7-2h-2.7l-.7 2Zm3.6-4h1.5l-.75-2.4Z"/>',
  // O balão de feedback (o mesmo desenho do ícone "Padrão" que o aluno usa), com as duas linhas recortadas.
  'menu-feedback': '<path fill-rule="evenodd" d="M5.5 3h13A3.5 3.5 0 0 1 22 6.5v8a3.5 3.5 0 0 1-3.5 3.5h-8l-4.1 3.5Q5.5 22.2 5.5 21v-3A3.5 3.5 0 0 1 2 14.5v-8A3.5 3.5 0 0 1 5.5 3zM7.4 7.6h9.2a.9.9 0 0 1 0 1.8H7.4a.9.9 0 0 1 0-1.8zM7.4 11.5h5.2a.9.9 0 0 1 0 1.8H7.4a.9.9 0 0 1 0-1.8z"/>',
};
const glyphEntries = Object.entries(GLYPHS).map(([k, v]) => JSON.stringify(k) + ':' + JSON.stringify(v)).join(',');
const solidEntries = Object.entries(GLYPHS).map(([k, v]) => 'solid[' + JSON.stringify(k) + ']=' + JSON.stringify(v) + ';').join('');

const SETTINGS_OPEN = '<section id="screen-settings" class="screen">';
const SETTINGS_SUBTITLE_OLD = 'Ajuste a leitura, os sons das aulas e o descanso do treino.';
const SETTINGS_SUBTITLE_NEW = 'Despertador e os sons das aulas e do descanso do treino.';
const TEXT_SECTION = /<section class="teacher-text-setting" aria-labelledby="teacherTextTitle"><h3 id="teacherTextTitle">Tamanho das letras<\/h3><p>Ajuste a leitura das telas do professor\. A escolha fica salva neste aparelho\.<\/p>(<div class="teacher-text-options"[\s\S]*?<\/div>)(<p id="teacherTextStatus" role="status" aria-live="polite"><\/p>)<\/section>/;
const FEEDBACK_SECTION = /<section class="teacher-text-setting feedback-name-setting" aria-labelledby="feedbackNameTitle">[\s\S]*?<p id="feedbackNameStatus" role="status" aria-live="polite"><\/p><\/section>/;
const SETTINGS_CARD = /<button class="more-function" type="button" data-screen="settings">[\s\S]*?<\/button>/;

function card(settingsCard, id, screen, strong, small) {
  // Mesmo formato do cartão Configurações (o organizador do Mais troca o ícone pelo desenho próprio).
  const out = settingsCard
    .replace('<button class="more-function" type="button" data-screen="settings">', '<button id="' + id + '" class="more-function" type="button" data-screen="' + screen + '">')
    .replace('<strong>Configurações</strong>', '<strong>' + strong + '</strong>')
    .replace('<small>Despertador, áudios e preferências.</small>', '<small>' + small + '</small>');
  assert.notEqual(out.indexOf('data-screen="' + screen + '"'), -1);
  assert.notEqual(out.indexOf('<strong>' + strong + '</strong>'), -1, 'título do cartão ' + id);
  assert.notEqual(out.indexOf('<small>' + small + '</small>'), -1, 'descrição do cartão ' + id);
  return out;
}

function replaceOnce(text, what, from, to) {
  assert.equal(count(text, from), 1, 'Não achei ' + what + ' uma única vez no 1.12.302');
  return text.replace(from, () => to);
}

function editBlock(html, id, changes) {
  const open = '<script id="' + id + '">';
  assert.equal(count(html, open), 1, 'O bloco ' + id + ' não aparece uma única vez');
  const start = html.indexOf(open) + open.length;
  const end = html.indexOf('</script>', start);
  let inner = html.slice(start, end);
  for (const [what, from, to] of changes) inner = replaceOnce(inner, what, from, to);
  return html.slice(0, start) + inner + html.slice(end);
}

function editProfessor(html) {
  // Blocos com id.
  html = editBlock(html, 'ap-more-menu-glyphs', [['os ícones do menu', 'window.APMoreMenuGlyphs=Object.freeze({', 'window.APMoreMenuGlyphs=Object.freeze({' + glyphEntries + ',']]);
  html = editBlock(html, 'ap-more-organization', [['a posição dos cartões no Mais', 'const byId={moreWorkoutCatalog:',
    "const byId={moreTextSize:['appearance',0.5,'menu-text'],moreFeedbackSettings:['appearance',2.5,'menu-feedback'],moreWorkoutCatalog:"]]);
  html = editBlock(html, 'ap-feedback-name', [['a tela observada pelo campo do nome', "const screen=$('screen-settings');", "const screen=form.closest('.screen');"]]);

  // Fora dos blocos: as duas telas novas, os dois cartões do Mais e os ícones dos acabamentos.
  const text = TEXT_SECTION.exec(html);
  assert.ok(text, 'Não achei o cartão Tamanho das letras em Configurações');
  const feedback = FEEDBACK_SECTION.exec(html);
  assert.ok(feedback, 'Não achei o cartão Nome nos feedbacks em Configurações');
  assert.equal(text.index + text[0].length, feedback.index, 'os dois cartões deviam estar juntos em Configurações');
  const settingsAt = html.indexOf(SETTINGS_OPEN);
  assert.ok(settingsAt > 0 && settingsAt < text.index, 'os cartões deviam estar dentro de Configurações');
  html = html.slice(0, text.index) + html.slice(feedback.index + feedback[0].length);
  html = replaceOnce(html, 'a descrição de Configurações', SETTINGS_SUBTITLE_OLD, SETTINGS_SUBTITLE_NEW);

  const textScreen = '<section id="screen-text-size" class="screen">'
    + '<div class="module-heading"><div><h2>Tamanho das letras</h2><p>Ajuste a leitura das telas do professor. A escolha fica salva neste aparelho.</p></div></div>'
    + '<section class="teacher-text-setting" aria-labelledby="teacherTextTitle"><h3 id="teacherTextTitle">Escolha o tamanho</h3>' + text[1] + text[2] + '</section>'
    + '</section>\n      ';
  const feedbackScreen = '<section id="screen-feedback-settings" class="screen">'
    + '<div class="module-heading"><div><h2>Feedback</h2><p>O nome que aparece nos cartões de feedback dos seus alunos.</p></div></div>'
    + feedback[0]
    + '</section>\n      ';
  html = replaceOnce(html, 'o começo da tela Configurações', SETTINGS_OPEN, textScreen + feedbackScreen + SETTINGS_OPEN);

  const settingsCard = SETTINGS_CARD.exec(html);
  assert.ok(settingsCard && count(html, settingsCard[0]) === 1, 'Não achei o cartão Configurações do Mais uma única vez');
  html = html.replace(settingsCard[0], () => card(settingsCard[0], 'moreTextSize', 'text-size', 'Tamanho das letras', 'Letras maiores ou menores nas telas.')
    + settingsCard[0]
    + card(settingsCard[0], 'moreFeedbackSettings', 'feedback-settings', 'Feedback', 'Nome que aparece nos cartões de feedback.'));

  const modelAnchor = '\n function model(svg){\n  if(svg.dataset.apMenuIcon&&solid[svg.dataset.apMenuIcon])return svg.dataset.apMenuIcon;';
  assert.equal(count(html, modelAnchor), 2, 'os dois desenhos de acabamento (metal e deep) deviam ter o mesmo começo de model()');
  html = html.split(modelAnchor).join('\n ' + solidEntries + modelAnchor);
  return html;
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.302');
  assert.equal(source.sequence, 408);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notes.length <= 4000, 'notas: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'professor.html': editProfessor(original.files['professor.html'])};
  return {...original, files, version, sequence, notes, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.302 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editProfessor, GLYPHS, version, sequence, TARGET_NAME, SOURCE_NAME};
