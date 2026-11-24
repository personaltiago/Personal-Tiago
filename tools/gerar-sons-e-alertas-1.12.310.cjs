'use strict';

// Gera o pacote 1.12.310 / 416 (sem assinatura) a partir do 1.12.309 / 415 da main (SHA-256 conferido).
// Pedido: Tiago, 23/11/2026 23:53, com prints do Mais ("Sons e alertas" e "Configurações" circulados) e da tela Configurações:
// "Dá uma analisada mas não parece que essas duas opções são a mesma coisa". Na pergunta do app escolheu "Só Sons e alertas
// (Recomendado)": Configurações sai do Mais; a tela passa a se chamar "Sons e alertas" e abre no topo; sons, despertador e descanso
// não mudam.
//
// Antes: os dois cartões abriam a mesma tela (screen-settings: Despertador e os 5 sons). "Configurações" abria no topo;
// "Sons e alertas" (openLessonSoundSettings) abria a mesma tela rolada até "Som do descanso do treino".
// Agora (só professor.html):
//  - fora dos blocos: o cartão "Configurações" (data-screen="settings") sai do Mais; o cartão "Sons e alertas" (moreLessonSounds)
//    abre a tela pelo mesmo caminho dos outros cartões (data-screen="settings", no topo), com o texto "Sons e alertas /
//    Despertador e sons das aulas e do treino." e sem o aria-label antigo (o nome acessível passa a ser o texto visível);
//    o título da tela passa de "Configurações" para "Sons e alertas".
//  - ap-more-organization: a legenda do cartão Sons e alertas fica igual à do HTML.
// Não muda: o conteúdo da tela (Despertador e os sons), openLessonSoundSettings (continua no menu escondido #proMoreMenu),
// descanso do treino, cronômetros, alarmes, notificações, sons, Firebase, alunos, treinos, financeiro, login e mascotes.
// Os cartões criados por outros blocos (Backup, Armazenamento, Relógio, Sincronizar, Acompanhamento) usam #morePet como âncora,
// não o cartão Configurações (conferido).
//
// Uso: node tools/gerar-sons-e-alertas-1.12.310.cjs [pacote-1.12.309.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.310';
const sequence = 416;
const title = 'Sons e alertas no Mais';
const summary = 'No Mais, "Sons e alertas" e "Configurações" abriam a mesma tela. Fica só "Sons e alertas", que abre a tela no topo. Os sons não mudam.';
const notesText = 'Sons e alertas no Mais.\n\n'
  + 'Antes, no Mais, "Sons e alertas" e "Configurações" abriam a mesma tela (o Despertador e os sons das aulas e do treino): '
  + 'um no topo e o outro já rolado até o som do descanso.\n\n'
  + 'Agora fica só "Sons e alertas" ("Despertador e sons das aulas e do treino."), que abre a tela no topo. A tela também passa a '
  + 'se chamar "Sons e alertas".\n\n'
  + 'O que não muda: o despertador, os sons das aulas, da pausa, do cardio e do descanso do treino, o envio dos sons aos alunos, '
  + 'treinos, agenda, financeiro, login e mascotes.\n\n'
  + 'Inclui tudo do 1.12.309 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.309-Simbolo-Feedback-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '8bdf9e4ffa67bf3949355728a8ace532ab0ad89df89ef94d2fae7e8d2663be07';
const TARGET_NAME = 'AgendaPersonal-1.12.310-Sons-E-Alertas-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

const SUBTITLE = 'Despertador e sons das aulas e do treino.';
// Fora dos blocos (professor.html)
const SETTINGS_CARD = '<button class="more-function" type="button" data-screen="settings"><span class="more-function-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 3-.7 3-2.6 1.5-3-.9L1 10l2.3 2v3l-2.3 2 1.7 3.4 3-.9L8.3 21l.7 3h4l.7-3 2.6-1.5 3 .9L21 17l-2.3-2v-3L21 10l-1.7-3.4-3 .9L13.7 6 13 3z" transform="translate(1 -1.5) scale(.92)"/><circle cx="12" cy="12" r="3"/></svg></span><span class="more-function-copy"><strong>Configurações</strong><small>Despertador, áudios e preferências.</small></span><span class="more-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></span></button>';
const TEXT_CHANGES = [
  ['o cartão Sons e alertas abre a tela no topo, como os outros cartões',
    '<button id="moreLessonSounds" class="more-function more-function-compact" type="button" aria-label="Sons e alertas das aulas" onclick="openLessonSoundSettings()">',
    '<button id="moreLessonSounds" class="more-function more-function-compact" type="button" data-screen="settings">'],
  ['o texto do cartão Sons e alertas',
    '<strong>Despertador</strong><small>Toques das aulas e do descanso.</small>',
    '<strong>Sons e alertas</strong><small>' + SUBTITLE + '</small>'],
  ['o título da tela',
    '<h2>Configurações</h2><p>Despertador e os sons das aulas e do descanso do treino.</p>',
    '<h2>Sons e alertas</h2><p>Despertador e os sons das aulas e do descanso do treino.</p>'],
];
// ap-more-organization: a legenda do cartão igual à do HTML
const ORGANIZATION_CHANGES = [
  ['a legenda do cartão Sons e alertas',
    "const copies={moreLessonSounds:['Sons e alertas','Aulas, descanso e despertador.'],",
    "const copies={moreLessonSounds:['Sons e alertas','" + SUBTITLE + "'],"],
];

function blockRange(html, tag, id) {
  const open = '<' + tag + ' id="' + id + '">';
  assert.equal(count(html, open), 1, 'Bloco ' + id + ' não aparece uma única vez');
  const start = html.indexOf(open) + open.length, end = html.indexOf('</' + tag + '>', start);
  assert.ok(end > start, 'Fim do bloco ' + id + ' não encontrado');
  return [start, end];
}
function editBlock(html, tag, id, changes) {
  const [start, end] = blockRange(html, tag, id);
  let text = html.slice(start, end);
  for (const [what, before, after] of changes) {
    assert.equal(count(text, before), 1, id + ': trecho para "' + what + '" não aparece uma única vez');
    text = text.replace(before, () => after);
  }
  return html.slice(0, start) + text + html.slice(end);
}

function editProfessor(html) {
  // O cartão sai do Mais: confere que nenhum bloco usa ele como âncora e que o menu escondido continua com o seu atalho
  assert.equal(count(html, SETTINGS_CARD), 1, 'O cartão Configurações do Mais mudou: rever');
  assert.equal(count(html, 'data-screen="settings"'), 2, 'Mudou o número de atalhos para a tela (cartão do Mais e menu escondido)');
  assert.equal(count(html, '#proMoreMenu{display:none!important}'), 1, 'O menu antigo (#proMoreMenu) não está mais escondido');
  assert.equal(count(html, "document.querySelectorAll('.nav [data-screen]').forEach(btn=>btn.onclick=()=>navigateToScreen(btn.dataset.screen));"), 1, 'Os cartões com data-screen não abrem mais a tela pelo mesmo caminho');
  // A definição, o menu escondido e o cartão do Mais; depois da mudança, só a definição e o menu escondido
  assert.equal(count(html, 'openLessonSoundSettings()'), 3, 'openLessonSoundSettings é usado em outro lugar: rever');
  for (const anchor of ["getElementById('morePet')", 'getElementById("morePet")'])
    assert.ok(count(html, anchor) >= 1, 'Os cartões criados por blocos não usam mais #morePet como âncora: rever');
  let out = html.replace(SETTINGS_CARD, '');
  for (const [what, before, after] of TEXT_CHANGES) {
    assert.equal(count(out, before), 1, 'Trecho para "' + what + '" não aparece uma única vez');
    out = out.replace(before, () => after);
  }
  out = editBlock(out, 'script', 'ap-more-organization', ORGANIZATION_CHANGES);
  assert.equal(count(out, 'data-screen="settings"'), 2, 'Depois: o cartão Sons e alertas e o menu escondido');
  assert.equal(count(out, '<strong>Configurações</strong>'), 0, 'Ainda há um cartão Configurações no Mais');
  assert.equal(count(out, 'openLessonSoundSettings()'), 2, 'O cartão do Mais ainda chama openLessonSoundSettings');
  return out;
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.309');
  assert.equal(source.sequence, 415);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notesText.length <= 4000, 'notas: ' + notesText.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'professor.html': editProfessor(original.files['professor.html'])};
  return {...original, files, version, sequence, notes: notesText, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.309 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME};
