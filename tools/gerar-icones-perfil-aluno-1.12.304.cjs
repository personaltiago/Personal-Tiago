'use strict';

// Gera o pacote 1.12.304 / 410 (sem assinatura) a partir do 1.12.303 / 409 (SHA-256 conferido).
// Pedido: Tiago, 22/11/2026 12:41 (foto do Perfil do aluno): "os alunos na parte Mais têm algumas coisas que estão sem os ícones".
//
// Causa: no Perfil do aluno, os itens "Sons do treino", "Pet" e "Atualizações" foram criados com um <svg> solto dentro de um <span>
// sem tamanho. Na linha do menu (flex), esse span encolhe a 0×0 e o ícone some. Os outros itens usam o desenhador do próprio app
// (<span data-profile-icon="…">, preenchido por profileSymbol() em profileRender), que o CSS desenha com 27×27 e a cor do tema
// (--prof-accent).
// Correção: os três passam a usar o mesmo desenhador, com três desenhos novos no mesmo traço dos outros (contorno, traço 2):
//   sound  = alto-falante com ondas (o mesmo desenho que o item já tinha);
//   update = seta para baixo numa bandeja (o mesmo desenho que o item já tinha);
//   pet    = pata em contorno (antes era preenchida; no traço dos outros ícones do Perfil).
// Só o index.html (aluno), fora dos blocos. Não muda: o que os itens fazem, o professor, login, alunos, treinos, agenda, financeiro,
// avaliações, Firebase, descanso, cronômetros, alarmes, notificações, sons e mascotes.
//
// Uso: node tools/gerar-icones-perfil-aluno-1.12.304.cjs [pacote-1.12.303.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.304';
const sequence = 410;
const title = 'Ícones do Perfil do aluno';
const summary = 'No Perfil do aluno, Sons do treino, Pet e Atualizações voltam a mostrar o ícone, no mesmo estilo e na cor do tema dos outros.';
const notes = 'Ícones do Perfil do aluno.\n\n'
  + 'No Perfil do aluno, os itens "Sons do treino", "Pet" e "Atualizações" apareciam sem ícone. Agora mostram o ícone no mesmo '
  + 'tamanho, traço e cor do tema dos outros itens do menu.\n\n'
  + 'O que não muda: o que cada item faz, o aplicativo do professor, login, alunos, treinos, agenda, financeiro, avaliações, Firebase, '
  + 'descanso, cronômetros, alarmes, notificações, sons e mascotes.\n\n'
  + 'Inclui tudo do 1.12.303 e deve ser instalado no lugar dele.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.303-Cartoes-Separados-Para-Assinar.agenda.json';
const SOURCE_SHA256 = 'b865827a6bd69c9408067e02622f25124dbdcce9d3c9e767ae3cf00bb46791b4';
const TARGET_NAME = 'AgendaPersonal-1.12.304-Icones-Perfil-Aluno-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// Desenhos novos do profileSymbol (viewBox 24, sem preenchimento, traço 2, pontas e junções arredondadas, como os outros).
const SHAPES = {
  sound: '<path d="M3 9v6h4l5 4V5L7 9H3m13 0a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/>',
  update: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  pet: '<ellipse cx="4.9" cy="10" rx="1.7" ry="2.3" transform="rotate(-25 4.9 10)"/><ellipse cx="9.2" cy="5.4" rx="1.7" ry="2.4"/>'
    + '<ellipse cx="14.8" cy="5.4" rx="1.7" ry="2.4"/><ellipse cx="19.1" cy="10" rx="1.7" ry="2.3" transform="rotate(25 19.1 10)"/>'
    + '<path d="M7.4 18.3c0-2.4 2.1-3.2 3.1-4.9.7-1.1 2.3-1.1 3 0 1 1.7 3.1 2.5 3.1 4.9 0 2.1-2 3.1-3.7 2.4a3 3 0 0 0-1.8 0c-1.7.7-3.7-.3-3.7-2.4Z"/>',
};

const ITEMS = [
  ['Sons do treino', '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3m13 0a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/></svg></span>\n   <div><strong>Sons do treino</strong>',
    '<span data-profile-icon="sound"></span>\n   <div><strong>Sons do treino</strong>'],
  ['Pet', '<span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="5" cy="8" rx="2.5" ry="3.5" transform="rotate(-25 5 8)"/><ellipse cx="10" cy="4.5" rx="2.4" ry="3.4" transform="rotate(-8 10 4.5)"/><ellipse cx="16" cy="5" rx="2.4" ry="3.4" transform="rotate(15 16 5)"/><ellipse cx="20.5" cy="9" rx="2.4" ry="3.3" transform="rotate(30 20.5 9)"/><path d="M5 18c0-2 2-3 3.5-5.2 1.7-2.6 5.3-2.6 7 0C17 15 19 16 19 18c0 3-3 4.5-5.5 3.3a3.5 3.5 0 0 0-3 0C8 22.5 5 21 5 18Z"/></svg></span><div><strong>Pet</strong>',
    '<span data-profile-icon="pet"></span><div><strong>Pet</strong>'],
  ['Atualizações', '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></svg></span><div><strong>Atualizações</strong>',
    '<span data-profile-icon="update"></span><div><strong>Atualizações</strong>'],
];
const SHAPES_ANCHOR = "chevron:'<path d=\"m9 5 7 7-7 7\"/>'};";

function replaceOnce(text, what, from, to) {
  assert.equal(count(text, from), 1, 'Não achei ' + what + ' uma única vez no 1.12.303');
  return text.replace(from, () => to);
}

function editIndex(html) {
  for (const [what, from, to] of ITEMS) html = replaceOnce(html, 'o ícone de ' + what, from, to);
  const extra = Object.entries(SHAPES).map(([k, v]) => k + ':\'' + v + '\',').join('');
  assert.ok(Object.keys(SHAPES).every(k => !html.includes(k + ':\'<')), 'o profileSymbol já tem um desses nomes');
  return replaceOnce(html, 'o fim do dicionário do profileSymbol', SHAPES_ANCHOR, extra + SHAPES_ANCHOR);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.303');
  assert.equal(source.sequence, 409);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notes.length <= 4000, 'notas: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'index.html': editIndex(original.files['index.html'])};
  return {...original, files, version, sequence, notes, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.303 (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editIndex, SHAPES, version, sequence, TARGET_NAME, SOURCE_NAME};
