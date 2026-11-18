'use strict';

// Gera o pacote 1.12.279 (sem assinatura) a partir do pacote 1.12.278 (seq 384).
// Corrige só isto: em Mais > Cadastrar aluno, o botão/gesto Voltar fechava o formulário e parava na tela Alunos;
// agora volta para a tela de onde o cadastro foi aberto (Mais, Painel...). Nada mais muda.

const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.279';
const sequence = 385;
const summary = 'Corrige o botão e o gesto Voltar em Cadastrar aluno: volta para a tela de onde o cadastro foi aberto, em vez de parar em Alunos.';

function replaceOne(source, previous, next) {
  const index = source.indexOf(previous);
  assert.ok(index >= 0, 'O trecho esperado não existe: ' + previous.slice(0, 80));
  assert.equal(source.indexOf(previous, index + previous.length), -1, 'O trecho está duplicado: ' + previous.slice(0, 80));
  return source.slice(0, index) + next + source.slice(index + previous.length);
}

function professorEdits() {
  return [
    [
      "if(action==='student'){showScreen('students');openNewStudent();document.getElementById('studentType').value=''}",
      "if(action==='student'){const ap_before=appNavigation.length;showScreen('students');openNewStudent();document.getElementById('studentType').value='';const ap_entry=dialogStack.at(-1);if(ap_entry&&ap_entry.id==='studentDialog'&&appNavigation.length>ap_before)ap_entry.returnToPrevious=true}"
    ],
    [
      'if(dialogStack.length){closeDialog(dialogStack[dialogStack.length-1].id);return}\n  while(appNavigation.length){',
      'if(dialogStack.length){const ap_top=dialogStack[dialogStack.length-1],ap_back=ap_top.returnToPrevious===true;closeDialog(ap_top.id);if(ap_back&&!dialogStack.length&&currentScreen===\'students\')while(appNavigation.length){const page=appNavigation.pop();if(restoreAppPage(page))return}return}\n  while(appNavigation.length){'
    ]
  ];
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.278');
  assert.equal(source.sequence, 384);
  const { agendaSignature, ...original } = source;
  const files = {
    ...original.files,
    'professor.html': professorEdits().reduce((page, [previous, next]) => replaceOne(page, previous, next), original.files['professor.html'])
  };
  return {...original, files, version, sequence, notes: summary, update: {...original.update, title: 'Voltar em Cadastrar aluno', summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.279-Voltar-Cadastrar-Aluno-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-voltar-cadastrar-aluno-1.12.279.cjs AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {makeUpdate, professorEdits};
