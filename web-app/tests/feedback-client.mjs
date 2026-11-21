import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const bundle = JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE, 'utf8'));
const html = bundle.files['professor.html'];
const script = (page, id) => page.match(new RegExp('<script\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const modelSource = script(html, 'ap-feedback-model');
assert.equal(modelSource, script(bundle.files['index.html'], 'ap-feedback-model'), 'teacher and student validate the same numeric effort');
const host = {};
vm.runInNewContext(modelSource, host);
const model = host.APFeedbackModel;
const student = {id: 'student-one', name: 'Aluno demonstração', studentType: 'presencial', firebaseUid: 'alice'};
const start = Date.now() - 3600000;
const record = {id: 'session-one', startedAt: start, finishedAt: start + 2800000, dayName: 'Treino A', planName: 'Ficha', effort: 9.4, note: ''};
const session = model.session(record, student);
assert.equal(session.teacherEvaluation.effort, 9.4);
const receipt = {...session, professorId: model.TEACHER, response: {intensity: 'Muito intensa', comment: 'Bom treino.', publicationBasis: 'contract', mutationId: 'mutation-one', receivedAt: new Date().toISOString()}};
assert.equal(model.normalize(receipt, 'alice').teacherEvaluation.effort, 9.4);
assert.ok(model.evaluation(receipt).includes('9,4/10'));
assert.ok(model.text(receipt).indexOf('9,4/10') < model.text(receipt).indexOf('Intensidade do aluno'));
for (const effort of [1, 7, 9.4, 9.45, 10, null]) assert.ok(model.normalize({...receipt, teacherEvaluation: {note: '', effort}}, 'alice'));
for (const effort of [0, 10.1, NaN, Infinity, '9.4', '9,4', true]) assert.equal(model.normalize({...receipt, teacherEvaluation: {note: '', effort}}, 'alice'), null);

// Exercise the real finalization function, including its stored numeric record.
const saveSource = html.slice(html.indexOf('function saveWorkoutExecution(event){'), html.indexOf('function openWorkoutHistory(', html.indexOf('function saveWorkoutExecution(event){')));
const decimalSource = html.slice(html.indexOf('function workoutProgressDecimal(value){'), html.indexOf('function workoutMeasuredWeight(', html.indexOf('function workoutProgressDecimal(value){')));
assert.ok(saveSource && decimalSource);
for (const [raw, expected] of [['9.4', 9.4], ['9,4', 9.4], [' 9,45 ', 9.45], ['10', 10], ['1', 1], ['', null], ['0.9', undefined], ['10,1', undefined], ['abc', undefined], ['9,4.2', undefined]]) {
  const values = {workoutExecutionPlanId: 'plan', workoutExecutionDayId: 'day', workoutExecutionSessionId: 'token', workoutExecutionDate: '2020-01-01', workoutExecutionEffort: raw, workoutExecutionBodyWeight: '', workoutExecutionNote: ''};
  const day = {id: 'day', name: 'Treino A', exercises: [{}]}, plan = {id: 'plan', studentId: student.id, days: [day]};
  let stored, warned = '';
  const context = {document: {getElementById: id => ({value: values[id]})}, window: {}, state: {workoutDrafts: {draft: {startedAt: start}}, lessonTimers: {}, workoutExecutions: []},
    workoutPlanById: () => plan, workoutPlanArchived: () => false, workoutDraftKey: () => 'draft', workoutRunning: () => true, workoutSessionToken: () => 'token', completedWorkoutExercises: () => [{}], validWorkoutDate: () => true, iso: () => '2026-10-28',
    id: () => 'saved-execution', workoutSessionSeconds: () => 2800, studentById: () => student, fmtDate: x => x,
    commitWorkoutChange: changes => (stored = changes.workoutExecutions[0], true), toast: text => { warned = text; }};
  for (const name of ['closeDialog', 'syncNativeAlarms', 'renderToday', 'renderWeek', 'updateWorkoutSessionLabels', 'updateTimerLabels']) context[name] = () => {};
  vm.runInNewContext(decimalSource + '\n' + saveSource, context);
  context.saveWorkoutExecution({preventDefault() {}});
  assert.equal(stored?.effort, expected, `input ${JSON.stringify(raw)} must keep its exact decimal value`);
  if (expected === undefined) assert.ok(warned.includes('1 a 10'));
}
const input = html.match(/<input\b[^>]*\bid="workoutExecutionEffort"[^>]*>/)[0];
assert.ok(input.includes('type="text"') && input.includes('inputmode="decimal"'), 'comma and dot must remain available on mobile keyboards');

// Check rendered canvas coordinates, including wrapping and feedbacks without a teacher score.
for (const item of [receipt, {...receipt, studentName: 'Nome de demonstração suficientemente longo para quebrar em mais de uma linha', teacherEvaluation: {effort: 9.4, note: 'Execução controlada.\nBoa constância e atenção à postura.\nCarga ajustada durante o treino.'}}, {...receipt, source: 'online', teacherEvaluation: null}]) {
  const drawn = [];
  const ctx = {font: '', measureText(text) { return {width: String(text).length * (parseFloat(this.font.match(/([\d.]+)px/)?.[1]) || 32) * .56}; }, fillText(text, x, y) { drawn.push({text, x, y, font: this.font}); }};
  for (const name of ['save', 'restore', 'translate', 'scale', 'fill', 'beginPath', 'roundRect', 'stroke', 'fillRect', 'arc', 'clip', 'drawImage']) ctx[name] = () => {};
  const canvas = {getContext: () => ctx};
  const environment = {APFeedbackModel: model, document: {createElement: () => canvas}, Path2D: class {}};
  environment.window = environment;
  vm.runInNewContext(script(html, 'ap-feedback-card'), environment);
  await environment.APFeedbackCard.create(item);
  const intensity = drawn.find(row => row.text === 'INTENSIDADE'), feedback = drawn.find(row => row.text === 'FEEDBACK DO ALUNO'), score = drawn.find(row => row.text.includes('Esforço observado'));
  assert.ok(intensity.y < feedback.y && canvas.height > feedback.y + 100);
  if (item.teacherEvaluation) {
    assert.ok(drawn.find(row => row.text === 'AVALIAÇÃO DO PROFESSOR').y < score.y && score.y < intensity.y, 'the teacher score must come before student intensity');
    assert.ok(score.text.includes('9,4/10'));
  } else assert.equal(drawn.some(row => row.text === 'AVALIAÇÃO DO PROFESSOR'), false);
}
console.log('PASS: comma/dot input saves exact decimal effort; student/teacher normalization, legacy scores and numeric bounds; card places teacher assessment first with long and absent evaluations.');
