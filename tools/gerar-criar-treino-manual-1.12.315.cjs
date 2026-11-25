'use strict';

// Gera o pacote 1.12.315 / 421 (sem assinatura) a partir do 1.12.314 / 420 (referência assinada; SHA-256 conferido).
// Pedido: Tiago, 24/11/2026 21:40, com print da ficha vazia circulada: tirar o quadro "Este aluno ainda não tem ficha de treino"
// ("retira aquela parte de cima") e pôr "Criar treino manual" entre os botões quadrados do cartão Aluno e ficha, junto de
// "Importar treino por PDF" e "Importar treino por texto".
// Por que pacote completo: os três trechos estão no texto do app (renderWorkoutStudent, fora dos blocos ap-*), que uma correção
// por área não alcança.
// Agora (só professor.html, fora dos blocos):
//  1. Botões do Aluno e ficha: Criar treino manual, Importar treino por PDF, Importar treino por texto e, por último,
//     Inativar/Reativar nos treinos (as três formas de criar a ficha juntas; a ação de status do aluno no fim).
//  2. O cartão Aluno e ficha abre já aberto quando o aluno não tem ficha ativa (antes abria fechado e o quadro mostrava os botões).
//  3. Sai o quadro da ficha vazia ("Este aluno ainda não tem ficha de treino" / "Nenhuma ficha ativa").
// Não muda: index.html, os blocos ap-*, o "Nova ficha" de Ações da ficha, PDF, texto, descanso, cronômetros, alarmes,
// notificações, Firebase, dados de alunos, financeiro, login e mascotes.
// Uso: node tools/gerar-criar-treino-manual-1.12.315.cjs [pacote-1.12.314.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.315';
const sequence = 421;
const title = 'Criar treino manual no Aluno e ficha';
const summary = 'Os botões para criar a ficha ficam juntos no cartão Aluno e ficha: Criar treino manual, por PDF e por texto. Sai o quadro da ficha vazia.';
const notesText = 'Criar treino manual no Aluno e ficha.\n\n'
  + 'No perfil do aluno, o cartão Aluno e ficha passa a ter quatro botões, dois por linha: Criar treino manual, Importar treino '
  + 'por PDF, Importar treino por texto e Inativar nos treinos (ou Reativar).\n\n'
  + 'Sai o quadro "Este aluno ainda não tem ficha de treino" (e o "Nenhuma ficha ativa", de quem só tem fichas arquivadas), que '
  + 'repetia esses botões. Quando o aluno não tem ficha ativa, o cartão Aluno e ficha já aparece aberto.\n\n'
  + 'Com ficha ativa, nada muda: o cartão abre fechado e o botão Nova ficha continua em Ações da ficha.\n\n'
  + 'O que não muda: importação por PDF e por texto, Orientações do aluno, descanso, cronômetros, alarmes, notificações da tela '
  + 'bloqueada, Firebase, dados dos alunos, financeiro, login e mascotes.\n\n'
  + 'Inclui tudo do 1.12.314 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.314-Treino-Por-Texto-Para-Assinar.agenda.json';
const SOURCE_SHA256 = 'c531474b5436f32f5c19561984f80369994b9c7876299f2c6db85ab8c469ecda';
const TARGET_NAME = 'AgendaPersonal-1.12.315-Criar-Treino-Manual-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

const B_INATIVAR = '<button class="btn" type="button" onclick="toggleWorkoutStudentActive()">${s.workoutInactive?\'Reativar nos treinos\':\'Inativar nos treinos\'}</button>';
const B_PDF = '<button class="btn" type="button" onclick="chooseWorkoutPdfImportForStudent()">Importar treino por PDF</button>';
const B_TEXTO = '<button class="btn" type="button" onclick="window.APTreinoTexto&&APTreinoTexto.abrir()">Importar treino por texto</button>';
const B_MANUAL = '<button class="btn" type="button" onclick="openWorkoutPlanEditor()">Criar treino manual</button>';

// [antes, depois]: cada "antes" tem de aparecer exatamente uma vez no professor.html do 1.12.314.
const TROCAS = [
  ['const controls=`<div class="workout-actions">' + B_INATIVAR + B_PDF + B_TEXTO + '</div>`;',
    'const controls=`<div class="workout-actions">' + B_MANUAL + B_PDF + B_TEXTO + B_INATIVAR + '</div>`;'],
  ['<details id="workoutStudentOptions" class="workout-sheet-options"${optionsOpen?\' open\':\'\'}>',
    '<details id="workoutStudentOptions" class="workout-sheet-options"${optionsOpen||!p&&!archivedListOpen?\' open\':\'\'}>'],
  ['if(!p){content.innerHTML=`${collections}<div class="empty workout-empty"><strong>${archivedPlans.length?\'Nenhuma ficha ativa.\':\'Este aluno ainda não tem ficha de treino.\'}</strong>${archivedPlans.length?\'Acesse Arquivadas para consultar ou reativar os treinos anteriores.\':\'Crie a ficha e adicione os treinos e exercícios.\'}<button class="btn primary full" type="button" onclick="openWorkoutPlanEditor()">Criar ficha de treino</button><button class="btn full" type="button" onclick="window.APTreinoTexto&&APTreinoTexto.abrir()">Importar treino por texto</button></div>${context}`;return;}',
    'if(!p){content.innerHTML=`${collections}${context}`;return;}'],
];

function editProfessor(html) {
  for (const needed of ['function renderWorkoutStudent(){', 'function openWorkoutPlanEditor(', 'function toggleWorkoutStudentActive(',
    'function chooseWorkoutPdfImportForStudent(', 'function openWorkoutStudentOptions(', 'window.APTreinoTexto=',
    'const archivedListOpen=workoutPlanCollection===\'archived\'&&!workoutPlanArchivedDetailId;'])
    assert.ok(count(html, needed) === 1, 'Dependência ausente ou repetida no 1.12.314 (professor.html): ' + needed);
  assert.equal(count(html, 'Criar treino manual'), 0, 'Criar treino manual já existe no 1.12.314');
  // As três trocas ficam dentro de renderWorkoutStudent, depois de "archivedListOpen" (a condição nova usa p e archivedListOpen).
  const ini = html.indexOf('function renderWorkoutStudent(){'), fim = html.indexOf('\nfunction ', ini + 10);
  const decl = html.indexOf('const archivedListOpen=', ini);
  let h = html;
  for (const [antes, depois] of TROCAS) {
    assert.equal(count(h, antes), 1, 'Trecho esperado exatamente uma vez no professor.html: ' + antes.slice(0, 90));
    const pos = html.indexOf(antes);
    assert.ok(pos > decl && pos < fim, 'Trecho fora de renderWorkoutStudent: ' + antes.slice(0, 60));
    h = h.replace(antes, () => depois);
  }
  return h;
}
function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.314');
  assert.equal(source.sequence, 420);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notesText.length <= 4000, 'notas: ' + notesText.length);
  const { agendaSignature, ...original } = source;
  const files = { ...original.files, 'professor.html': editProfessor(original.files['professor.html']) };
  return { ...original, files, version, sequence, notes: notesText, update: { category: 'general', title, summary } };
}
function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.314 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}
if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, { encoding: 'utf8', flag: 'wx' });
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}
module.exports = { makeUpdate, loadSource, editProfessor, TROCAS, version, sequence, TARGET_NAME, SOURCE_NAME };
