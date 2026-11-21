import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const bundle = JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE, 'utf8'));
const base = JSON.parse(await readFile(process.env.AGENDA_RECOVERY_BASE, 'utf8'));
const script = (html, id) => html.match(new RegExp('<script\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>'))?.[1];
const plain = value => JSON.parse(JSON.stringify(value));

// These are the real installed wrappers, tested without network or account data.
function teacherTimers(source) {
  let next = 0, success = true, teacher = true;
  const timers = new Map(), store = new Map(), events = {};
  const context = {
    Symbol, console, state: {}, DB_KEY: 'agendaPersonalTL_v1', normalizeState: x => x,
    save: () => 'saved', commitWorkoutChange: () => success,
    localStorage: {getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value)},
    document: {readyState: 'complete', getElementById: () => null, querySelector: () => null,
      querySelectorAll: () => [], addEventListener: () => {}},
    setTimeout: (fn, delay) => (timers.set(++next, {fn, delay}), next), clearTimeout: id => timers.delete(id),
    setInterval: () => 1, clearInterval() {}, addEventListener: (type, fn) => {events[type] = fn;},
    parent: {APaccounts: {isTeacher: () => teacher, teacherUid: () => 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1'}, addEventListener() {}}
  };
  context.window = context;
  vm.runInNewContext(source, context);
  return {context, timers, setSuccess: value => {success = value;}, setTeacher: value => {teacher = value;}};
}
for (const [value, expected] of [[base, 0], [bundle, 1]]) {
  const test = teacherTimers(script(value.files['professor.html'], 'ap-teacher-sync-core'));
  test.timers.clear();
  assert.equal(test.context.commitWorkoutChange({workoutExecutions: [{id: 'new-session'}]}), true);
  assert.equal(test.timers.size, expected, value.version + ': successful workout commit must schedule synchronization');
  if (expected) assert.equal([...test.timers.values()][0].delay, 900);
  test.timers.clear(); test.setSuccess(false);
  assert.equal(test.context.commitWorkoutChange({workoutExecutions: []}), false);
  assert.equal(test.timers.size, 0, 'failed saves do not publish');
  test.setSuccess(true); test.setTeacher(false);
  test.context.commitWorkoutChange({workoutExecutions: []});
  assert.equal(test.timers.size, 0, 'account checks still gate synchronization');
}

const nodes = new Map(), events = {}, refreshes = [], routeCalls = [];
for (const id of ['studentHome', 'workoutsScreen', 'exerciseScreen', 'historyScreen', 'profileScreen', 'apFeedbackStudent']) {
  nodes.set(id, {values: {}, style: {setProperty(key, value) { nodes.get(id).values[key] = value; }}});
}
let preferences = {}, gender = 'Feminino';
const context = {document: {getElementById: id => nodes.get(id)}, prefs: () => preferences,
  currentProfileGender: () => gender, addEventListener: (type, fn) => {events[type] = fn;},
  route: (view, ...args) => (routeCalls.push([view, ...args]), 'route-result'),
  APTeacherEvolution: {refresh: force => refreshes.push(force), schedule: () => refreshes.push('scheduled')},
  APFeedbackSync: {schedule: () => refreshes.push('feedback')}
};
for (const name of ['renderPrefs', 'renderHome', 'renderWorkouts', 'renderExerciseApp', 'renderExerciseDetail', 'renderHistory', 'profileRender']) {
  context[name] = function (value) {
    nodes.get('workoutsScreen').style.setProperty('--ws-accent', preferences.color || '#8f35df');
    nodes.get('exerciseScreen').style.setProperty('--ex-accent', '#8f35df');
    return value;
  };
}
context.window = context;
vm.runInNewContext(script(bundle.files['index.html'], 'ap-student-session-recovery'), context);
for (const [preference, sex, expected] of [
  [{}, 'Feminino', '#f52283'], [{theme: 'rosa'}, 'Feminino', '#f52283'],
  [{theme: 'verde'}, 'Feminino', '#00d98d'], [{theme: 'azul'}, 'Feminino', '#138cff'],
  [{theme: 'roxo'}, 'Feminino', '#8f35df'], [{theme: 'preto'}, 'Feminino', '#b6bec7'],
  [{color: '#7155aa', theme: 'rosa'}, 'Feminino', '#7155aa'], [{}, 'Masculino', '#138cff']
]) {
  preferences = preference; gender = sex;
  const before = JSON.stringify(preferences);
  for (const name of ['renderPrefs', 'renderHome', 'renderWorkouts', 'renderExerciseApp', 'renderExerciseDetail', 'renderHistory', 'profileRender']) {
    assert.equal(context[name]('preserved-result'), 'preserved-result');
    for (const node of nodes.values()) assert(Object.values(node.values).every(value => value === expected), name);
  }
  assert.equal(JSON.stringify(preferences), before, 'theme rendering never overwrites preferences');
}
assert.equal(context.route('history', 'keep-argument'), 'route-result');
assert.deepEqual(refreshes, [true], 'entering evolution fetches fresh teacher records');
assert.deepEqual(plain(routeCalls[0]), ['history', 'keep-argument']);
context.route('home'); assert.equal(refreshes.at(-1), 'feedback');
events['ap-feedback-changed'](); assert.equal(refreshes.at(-1), 'scheduled');

// A decimal request used to reject the complete inbox on the student. Execute
// the real feedback sync against synthetic responses, including the old failure.
async function feedbackInbox(value) {
  const store = new Map(), notifications = [], requests = [];
  const now = Date.now(), uid = 'synthetic-student';
  const item = {id: 'fb_synthetic-session', uid, studentId: 'synthetic', studentName: 'Conferência',
    professorId: 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1', planName: 'Ficha de conferência', dayName: 'Treino A',
    startedAt: now - 3600000, finishedAt: now, teacherEvaluation: {note: 'Execução registrada.', effort: 9.4}, response: null};
  const environment = {console, __AP_STUDENT_CONTEXT: {role: 'student', storageId: uid},
    APaccounts: {isTeacher: () => false, getPhotoToken: async () => 'synthetic-token'},
    navigator: {onLine: true}, document: {hidden: false, addEventListener() {}},
    localStorage: {getItem: key => store.get(key) ?? null, setItem: (key, text) => store.set(key, text)},
    addEventListener() {}, dispatchEvent: event => notifications.push(event.type), CustomEvent: class {constructor(type) {this.type = type;}},
    setTimeout() {return 1;}, clearTimeout() {}, setInterval() {},
    fetch: async (url, request) => {
      requests.push({url, body: JSON.parse(request.body)});
      return {ok: true, json: async () => ({uid, items: [item], cursor: null})};
    }
  };
  environment.window = environment;
  vm.runInNewContext(script(value.files['index.html'], 'ap-feedback-model'), environment);
  vm.runInNewContext(script(value.files['index.html'], 'ap-feedback-sync'), environment);
  await environment.APFeedbackSync.refresh();
  return {pending: environment.APFeedbackSync.pending(), status: environment.APFeedbackSync.status(), notifications, requests};
}
assert.equal((await feedbackInbox(base)).pending.length, 0, 'reproduce decimal-inbox regression before the fix');
const fixed = await feedbackInbox(bundle);
assert.equal(fixed.pending.length, 1, 'decimal request reaches the pending list used by the pet notice');
assert.equal(fixed.pending[0].teacherEvaluation.effort, 9.4);
assert.equal(fixed.status.message, '');
assert(fixed.notifications.includes('ap-feedback-changed'));
assert.deepEqual(fixed.requests[0].body, {cursor: null});

// Keep the newer PDF/RIR repair and exercise all seven weekday headings using
// the real parser. Catalog matching and profile extraction are outside this test.
function functionSource(page, name) {
  const start = page.indexOf('function ' + name + '(');
  assert(start >= 0, name);
  const rest = page.slice(start);
  const next = rest.slice(1).search(/\n(?:async )?function /);
  return next < 0 ? rest : rest.slice(0, next + 1);
}
const pdfContext = {workoutImportCatalogMatches: () => ({match:null,ambiguous:false,suggestions:[]}),
  workoutImportResolveExercise: value => value, workoutImportParseProfile: () => ({name:''})};
let pdfId = 0; pdfContext.id = () => 'pdf-qa-' + (++pdfId);
for (const name of ['workoutImportText', 'workoutImportNorm', 'workoutImportNumberedPrescription', 'workoutImportNumberedPdf']) {
  const current = functionSource(bundle.files['professor.html'], name);
  assert.equal(current, functionSource(base.files['professor.html'], name), 'PDF repair must remain exact: ' + name);
  vm.runInNewContext(current, pdfContext);
}
const weekdays = ['SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO', 'DOMINGO'];
const pdfPages = weekdays.map((day, i) => ['TREINO ' + String.fromCharCode(65+i) + ' / ' + day,
  '1. Exercício ' + (i+1), 'Séries e repetições: 3 x 12 | RIR: 2 | CARGA: 20 kg | DESCANSO: 60',
  'Como fazer: Execução controlada.', 'Observações: Registro de conferência.']);
const parsed = pdfContext.workoutImportNumberedPdf(pdfPages);
assert.equal(parsed.days.length, 7);
assert.deepEqual(plain(parsed.days.map(day => day.weekday)), [1,2,3,4,5,6,0]);
assert(parsed.days.every(day => day.exercises.length === 1 && day.exercises[0].sets === '3' &&
  day.exercises[0].reps === '12' && day.exercises[0].load === '20 kg' && day.exercises[0].rest === '60s' &&
  day.exercises[0].sourceObservations.includes('RIR: 2')));

// Everything beyond the bounded recovery, including the partial-workout model,
// all mascot assets, source pages and account storage code stays byte-identical.
const getBlocks = html => [...html.matchAll(/<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi)];
const allowed = new Set(['ap-feedback-model', 'ap-teacher-sync-core', 'ap-feedback-card', 'ap-feedback-student']);
for (const [name, original] of Object.entries(base.files)) {
  const before = getBlocks(original), after = getBlocks(bundle.files[name]).filter(match => !match[2].includes('id="ap-student-session-recovery"'));
  assert.equal(before.length, after.length, name);
  for (let i = 0; i < before.length; i++) {
    const id = before[i][2].match(/\bid="([^"]+)"/)?.[1];
    if (allowed.has(id) || name === 'professor.html' && before[i][3].includes('function saveWorkoutExecution(event){')) continue;
    assert.equal(after[i][0], before[i][0].replaceAll(base.version, bundle.version), name + ': ' + (id || i));
  }
  if (['avaliacoes.html', 'cadastro.html'].includes(name)) assert.equal(bundle.files[name], original.replaceAll(base.version, bundle.version));
}
console.log('PASS: reproduces and fixes decimal feedback reception and missing workout-commit sync; failed-save/account guards; all student renderers follow default/preset/custom theme; history fetches new records; PDF/RIR repair and all seven weekdays; preferences, return values, partial-workout code, mascot assets and unrelated screens preserved.');
