'use strict';

// Gera o pacote 1.12.280 (sem assinatura) a partir do pacote 1.12.278 (seq 384).
// Substitui a correção 1.12.279 (Voltar só em Cadastrar aluno) por uma correção geral do Voltar:
//  - professor.html: o botão/gesto Voltar desfaz uma tela por vez nos atalhos que trocam de tela e abrem um formulário
//    (Editar perfil, Nova aula, Cadastrar aluno e Reposição abertos a partir do Painel/Mais) e no detalhe de ficha arquivada;
//  - index.html: na tela Início do aluno o Voltar deixa de fechar o aplicativo (só a tela de Entrada, sem login, ainda fecha).
// Não mexe em descanso, cronômetros, alarmes, notificações, Firebase nem em dados de alunos.

const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.280';
const sequence = 386;
const title = 'Voltar passo a passo';
const summary = 'Voltar (botão e gesto) desfaz uma tela por vez em Editar perfil, Nova aula, Cadastrar aluno, Reposição e ficha arquivada; no Início do aluno ele não fecha mais o aplicativo.';
const notes = 'O botão e o gesto Voltar agora desfazem uma tela por vez em Editar perfil, Nova aula, Cadastrar aluno (Painel e Mais), Reposição aberta pelo Painel e ficha arquivada (volta para a lista de arquivadas antes de fechar). '
  + 'Na tela Início do aluno o Voltar não fecha mais o aplicativo; para sair, use Mais > Sair da conta. '
  + 'Substitui o pacote 1.12.279 (Voltar em Cadastrar aluno). Descanso, cronômetros, alarmes e notificações não foram alterados.';

function replaceOne(source, previous, next) {
  const index = source.indexOf(previous);
  assert.ok(index >= 0, 'O trecho esperado não existe: ' + previous.slice(0, 80));
  assert.equal(source.indexOf(previous, index + previous.length), -1, 'O trecho está duplicado: ' + previous.slice(0, 80));
  return source.slice(0, index) + next + source.slice(index + previous.length);
}

// [antes, depois] — cada "antes" aparece exatamente uma vez no arquivo do pacote 1.12.278.
function professorEdits() {
  return [
    // 1) Voltar: marca de retorno para o formulário aberto por atalho + passo extra da ficha arquivada.
    [
      "function goBackApp(){\n  if(workoutPdfImport?.saving)return toast('Aguarde a conclusão da importação para voltar.');\n  if(dialogStack.length){closeDialog(dialogStack[dialogStack.length-1].id);return}\n  while(appNavigation.length){",
      "function apMarkReturn(id,before){const entry=dialogStack[dialogStack.length-1];if(entry&&entry.id===id&&appNavigation.length>before)entry.returnToPrevious=currentScreen}\n"
      + "function goBackApp(){\n  if(workoutPdfImport?.saving)return toast('Aguarde a conclusão da importação para voltar.');\n"
      + "  if(dialogStack.length){const ap_top=dialogStack[dialogStack.length-1];if(ap_top.id==='workoutStudentDialog'&&workoutPlanCollection==='archived'&&workoutPlanArchivedDetailId){showWorkoutPlanCollection('archived');return}"
      + "const ap_from=ap_top.returnToPrevious;closeDialog(ap_top.id);if(ap_from&&!dialogStack.length&&currentScreen===ap_from)while(appNavigation.length){const page=appNavigation.pop();if(restoreAppPage(page))return}return}\n"
      + "  while(appNavigation.length){"
    ],
    // 2) Editar perfil (Painel, Avisos etc.)
    [
      "function openTrainerProfile(){\n navigateToScreen('more');const profile=trainerProfile()",
      "function openTrainerProfile(){\n const ap_before=appNavigation.length;navigateToScreen('more');const profile=trainerProfile()"
    ],
    [
      "updateTrainerPhotoPreview();openDialog('trainerProfileDialog');\n}",
      "updateTrainerPhotoPreview();openDialog('trainerProfileDialog');apMarkReturn('trainerProfileDialog',ap_before);\n}"
    ],
    // 3) Nova aula (Painel)
    [
      "function createLessonFromPanel(){\n  if(currentScreen==='dashboard')showScreen('today');\n  openLesson();\n}",
      "function createLessonFromPanel(){\n  const ap_before=appNavigation.length;\n  if(currentScreen==='dashboard')showScreen('today');\n  openLesson();apMarkReturn('lessonDialog',ap_before);\n}"
    ],
    // 4) Cadastrar aluno (Painel e Mais)
    [
      "if(action==='student'){showScreen('students');openNewStudent();document.getElementById('studentType').value=''}",
      "if(action==='student'){const ap_before=appNavigation.length;showScreen('students');openNewStudent();document.getElementById('studentType').value='';apMarkReturn('studentDialog',ap_before)}"
    ],
    // 5) Reposição aberta a partir do Painel
    [
      "if(makeup){navigateToScreen('makeup');openReschedule(lid,date);return}",
      "if(makeup){const ap_before=appNavigation.length;navigateToScreen('makeup');openReschedule(lid,date);apMarkReturn('rescheduleDialog',ap_before);return}"
    ]
  ];
}

function shellEdits() {
  return [
    // Início do aluno: o Voltar é consumido (não fecha o app). Só a Entrada (sem login) continua devolvendo "false" ao Android.
    [
      ':!["landing","home"].includes(document.body.dataset.view)&&(agendaBack(),!0)}',
      ':"home"===document.body.dataset.view||"landing"!==document.body.dataset.view&&(agendaBack(),!0)}'
    ]
  ];
}

function applyEdits(page, edits) {
  return edits.reduce((current, [previous, next]) => replaceOne(current, previous, next), page);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.278');
  assert.equal(source.sequence, 384);
  const { agendaSignature, ...original } = source;
  const files = {
    ...original.files,
    'professor.html': applyEdits(original.files['professor.html'], professorEdits()),
    'index.html': applyEdits(original.files['index.html'], shellEdits())
  };
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.279-Voltar-Cadastrar-Aluno-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-voltar-passo-a-passo-1.12.280.cjs AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json [saida.agenda.json]');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {makeUpdate, professorEdits, shellEdits, version, sequence, title, summary, notes};
