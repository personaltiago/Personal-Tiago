'use strict';
// Confere o pacote 1.12.280 (Voltar passo a passo) contra o 1.12.278.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.join(__dirname, '../..');
const G = require(path.join(ROOT, 'tools/gerar-voltar-passo-a-passo-1.12.280.cjs'));
const o = JSON.parse(fs.readFileSync(path.join(ROOT, 'AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json'), 'utf8'));
const p = G.makeUpdate(o);
let ok = 0, bad = 0;
const t = (n, f) => { try { f(); ok++; console.log('OK   ' + n); } catch (e) { bad++; console.log('FALHA ' + n + ' -> ' + e.message); } };

// Extrai o Voltar do aplicativo (handleAgendaSystemBack) da tela de entrada e roda com um ambiente de mentira.
function shellBack(indexHtml, view) {
  const start = indexHtml.indexOf('window.handleAgendaSystemBack=function(){');
  assert(start > 0, 'handleAgendaSystemBack não encontrado');
  const end = indexHtml.indexOf(';for(const e of[t,n])e.addEventListener("load"', start);
  assert(end > start, 'fim de handleAgendaSystemBack não encontrado');
  const code = indexHtml.slice(start + 'window.handleAgendaSystemBack='.length, end);
  let back = 0;
  const env = {
    window: {},
    document: {getElementById: () => null, body: {dataset: {view}}},
    e: {classList: {contains: () => false}}, t: {}, n: {}, a: '', h() {}, f() {}, agendaBack: () => { back++; }
  };
  const fn = new Function('window', 'document', 'e', 't', 'n', 'a', 'h', 'f', 'agendaBack', 'return (' + code + ')')
    (env.window, env.document, env.e, env.t, env.n, env.a, env.h, env.f, env.agendaBack);
  return {result: fn(), back};
}

t('Versão 1.12.280 / seq 386 / sem assinatura', () => { assert.equal(p.version, '1.12.280'); assert.equal(p.sequence, 386); assert.equal(p.agendaSignature, undefined); });
t('Só professor.html e index.html mudaram; avaliações, cadastro e histórico modular ficam idênticos', () => {
  for (const k of ['avaliacoes.html', 'cadastro.html']) assert.equal(p.files[k], o.files[k], k);
  assert.notEqual(p.files['professor.html'], o.files['professor.html']);
  assert.notEqual(p.files['index.html'], o.files['index.html']);
  assert.deepEqual(p.modularUpdates, o.modularUpdates);
});
t('Prova de reversão: desfazendo as edições, professor.html e index.html voltam byte a byte ao 1.12.278', () => {
  for (const [file, edits] of [['professor.html', G.professorEdits()], ['index.html', G.shellEdits()]]) {
    let page = p.files[file];
    for (const [previous, next] of edits.slice().reverse()) { assert.equal(page.split(next).length - 1, 1, 'edição não aplicada uma vez: ' + next.slice(0, 60)); page = page.replace(next, () => previous); }
    assert.equal(page, o.files[file], file);
  }
});
t('Cada atalho só marca retorno quando a ação realmente trocou de tela', () => {
  const page = p.files['professor.html'];
  assert(page.includes('appNavigation.length>before)entry.returnToPrevious=currentScreen'));
  for (const id of ['trainerProfileDialog', 'lessonDialog', 'studentDialog', 'rescheduleDialog']) assert(page.includes("apMarkReturn('" + id + "',ap_before)"), id);
});
t('Ficha arquivada: o Voltar volta para a lista de arquivadas antes de fechar', () => { assert(p.files['professor.html'].includes("workoutPlanCollection==='archived'&&workoutPlanArchivedDetailId){showWorkoutPlanCollection('archived');return}")); });
t('Não mexe em descanso, cronômetro, alarme ou notificação', () => {
  for (const [a, b] of [...G.professorEdits(), ...G.shellEdits()]) assert(!/(\brest\b|restSeconds|alarm|notific|timer|descanso|cron[oô]metro|resumeWorkoutRest)/i.test(b), b.slice(0, 60));
});
t('Início do aluno: o Voltar é consumido e não fecha o aplicativo (antes fechava)', () => {
  assert.deepEqual(shellBack(o.files['index.html'], 'home'), {result: false, back: 0}, 'o 1.12.278 devolvia false (fechava)');
  assert.deepEqual(shellBack(p.files['index.html'], 'home'), {result: true, back: 0});
});
t('Entrada (sem login) continua devolvendo false; as demais telas do aluno continuam voltando uma por vez', () => {
  assert.deepEqual(shellBack(p.files['index.html'], 'landing'), {result: false, back: 0});
  for (const view of ['login', 'gender', 'aluno', 'workouts', 'exercise', 'history', 'assessments', 'payments', 'profile', 'agenda'])
    assert.deepEqual(shellBack(p.files['index.html'], view), {result: true, back: 1}, view);
});
t('Nenhum link de convite no pacote', () => { assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(JSON.stringify(p.files))); });
console.log(`\nresultado: ${ok} ok, ${bad} falhas`);
process.exit(bad ? 1 : 0);
