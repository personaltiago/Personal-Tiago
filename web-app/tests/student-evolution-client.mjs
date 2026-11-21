import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';

const bundle = JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE, 'utf8'));
const base = JSON.parse(await readFile(process.env.AGENDA_EVOLUTION_BASE, 'utf8'));
const script = (html, id) => html.match(new RegExp('<script\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const app = await readFile(new URL('../app/student-evolution.js', import.meta.url), 'utf8');
const codec = {}; vm.runInNewContext(script(base.files['index.html'], 'ap-mascot-asset-codec'), codec);
const unpack = html => gunzipSync(codec.APMascotAssetCodec.decode(script(html, 'ap-progress-sync-source'))).toString();
const progress = unpack(bundle.files['index.html']), previousProgress = unpack(base.files['index.html']);
const oldGuard = 'o&&(o.querySelector("strong").textContent=', newGuard = 'o?.querySelector("strong")&&o.querySelector("div")&&(o.querySelector("strong").textContent=';
assert.equal(progress, previousProgress.replace(oldGuard, newGuard) + '\n' + app, 'preserve synchronization, auth and numeric fidelity outside the new UI and empty-state guard');
new vm.Script(progress);
for (const name of Object.keys(base.files)) {
  let expected = base.files[name];
  if (name === 'index.html') expected = expected
    .replace('evPhoto(item.workout,item.index)', 'evPhoto(item.workout,item.index,item)')
    .replace("Foto ilustrativa de '+htmlSafe(item.name)", "Prévia de '+htmlSafe(item.name)")
    .replace('<h2>Evolução por exercício</h2>', '<h2>Exercícios do treino</h2>')
    .replace(script(expected, 'ap-progress-sync-source'), script(bundle.files[name], 'ap-progress-sync-source'));
  assert.equal(bundle.files[name], expected.replaceAll('1.12.169', '1.12.170'), 'every unrelated byte retained in ' + name);
}

const pure = {URL}; vm.runInNewContext(app, pure); const model = pure.APEvolutionWorkouts;
const url = id => 'https://www.youtube.com/watch?v=' + id;
const supino = {id: 'supino', name: 'Supino inclinado', video: url('aaaaaaaaaaa')};
const fly = {id: 'fly', name: 'Crucifixo máquina', video: url('bbbbbbbbbbb')};
const workouts = [{id: 'plan~A', label: 'DIA A - Peito e ombros', planName: 'Ficha 1', exercises: [fly, supino]},
  {id: 'plan~B', label: 'Treino B', planName: 'Ficha 1', exercises: [{...supino, id: 'supino-b', video: url('ccccccccccc')}]}];
const now = Date.now();
const record = (id, day, name, exerciseId, load) => ({id, workoutName: name, startedAt: now - day * 86400000 - 1200000, finishedAt: now - day * 86400000, durationMs: 1200000, incomplete: false,
  exerciseRecords: [{name: 'Supino inclinado', exerciseId, sets: 1, reps: '10', targets: ['10'], loads: [load], done: [true]}]});
const history = [record('plan~A', 5, 'DIA A - Peito e ombros', 'supino', 10), record('plan~A', 1, 'DIA A - Peito e ombros', 'supino', 14), record('plan~B', 2, 'Treino B', 'supino-b', 40)];
const image = (wid, index, item, records = history, plans = workouts) => model.photo(plans, records, wid, index, item);
assert.equal(image('plan~A', 0, {name: 'Supino inclinado'}), 'https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg', 'reordered exercise must use its own media, not the first cover');
const flyHistory = [{...history[0], exerciseRecords: [{...history[0].exerciseRecords[0], name: fly.name, exerciseId: fly.id}]}];
assert.equal(image('plan~A', 0, {name: fly.name}, flyHistory), 'https://i.ytimg.com/vi/bbbbbbbbbbb/hqdefault.jpg');
assert.equal(image('plan~B', 0, {name: supino.name}), 'https://i.ytimg.com/vi/ccccccccccc/hqdefault.jpg', 'same exercise name in another day must resolve in that day');
const retired = [{...history[0], id: 'retired', workoutName: 'Treino antigo', workoutSnapshot: {exercises: [supino]}}];
assert.equal(image('retired', 0, {name: supino.name}, retired), 'https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg', 'retired workout keeps its own saved media');
assert(image('missing', 0, {name: 'Agachamento'}).startsWith('data:image/svg+xml'), 'missing history never borrows an unrelated workout cover');
const repeated = [{id: 'x', exercises: [{name: 'Duplicado', video: url('aaaaaaaaaaa')}, {name: 'Duplicado', video: url('bbbbbbbbbbb')}]}];
assert(model.photo(repeated, [], 'x', 0, {name: 'Duplicado'}).startsWith('data:image/svg+xml'), 'ambiguous names do not guess a preview');
for (const value of ['javascript:alert(1)', 'http://youtu.be/aaaaaaaaaaa', 'https://youtube.com.evil.test/watch?v=aaaaaaaaaaa', 'https://user:pass@youtube.com/watch?v=aaaaaaaaaaa', 'https://tiktok.com/video/123']) assert.equal(model.youtube(value), '');
for (const value of ['https://youtu.be/aaaaaaaaaaa', 'https://www.youtube.com/shorts/aaaaaaaaaaa', 'https://youtube-nocookie.com/embed/aaaaaaaaaaa', url('aaaaaaaaaaa')]) assert.equal(model.youtube(value), 'https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg');
assert(!decodeURIComponent(model.placeholder('<img onerror=x>')).includes('<img'), 'placeholder escapes labels');
const options = model.groups(workouts, retired);
assert.equal(options[0].label, 'Treino A · Peito e ombros'); assert.equal(options[1].label, 'Treino B'); assert.equal(options[2].key, 'retired');
assert.equal(model.groups([{id: 'mon', label: 'Treino de pernas', weekday: 1}], [])[0].label, 'Segunda-feira · Treino de pernas');
assert.equal(model.groups([{id: 'tue', label: 'Terça-feira', weekday: 2}], [])[0].label, 'Terça-feira');
assert.deepEqual(JSON.parse(JSON.stringify(model.groups([{id: 'one', label: 'Treino A', planName: 'Ficha 1'}, {id: 'two', label: 'Treino A', planName: 'Ficha 2'}], []).map(x => x.label))), ['Treino A · Ficha 1', 'Treino A · Ficha 2']);

// Execute the original chart/list renderer with the production adapter. A small
// DOM records controls and generated markup; numeric data is not reimplemented.
const elements = new Map();
class Element {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.handlers = {}; this.style = {setProperty() {}}; this.classList = {toggle() {}}; this.scrollTop = 0; this.scrollHeight = 1000; this._html = ''; }
  set id(value) { this._id = value; elements.set(value, this); } get id() { return this._id; }
  set innerHTML(value) { this._html = value; this.children = []; } get innerHTML() { return this._html; }
  append(...nodes) { this.children.push(...nodes); } prepend(...nodes) { this.children.unshift(...nodes); }
  setAttribute(k, value) { this[k] = value; } addEventListener(k, fn) { this.handlers[k] = fn; }
  querySelectorAll() { return []; }
}
for (const id of ['historyScreen', 'evPeriod', 'evMainScroll', 'historyContent']) { const node = new Element(); node.id = id; }
const events = {}, ui = {URL, console, currentWorkouts: workouts, savedHistory: history, document: {head: new Element('head'), createElement: tag => new Element(tag), getElementById: id => elements.get(id)},
  __AP_STUDENT_CONTEXT: {role: 'student', storageId: 'alice', area: {studentId: 'one'}},
  addEventListener(k, fn) { events[k] = fn; }, el: id => elements.get(id), prefs: () => ({color: '#f52283'}), currentProfileGender: () => 'Feminino',
  htmlSafe: value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])),
  iconSvg: () => '', exStore: () => ({history: ui.savedHistory}), workoutsForProfile: () => ui.currentWorkouts, photoForWorkout: () => 'wrong-cover',
  EX_REFERENCE_THUMBS: ['demo-photo'], EXERCISES_FEMALE: {A: [['Exercício exemplo', '', '', '12']]}};
ui.window = ui;
const html = bundle.files['index.html'], start = html.indexOf('let evTab='), end = html.indexOf('const ASS_FEMALE_PHOTOS=', start);
assert(start > 0 && end > start);
vm.runInNewContext(html.slice(start, end) + '\n' + app, ui);
vm.runInNewContext('evPeriod="all"; renderHistory()', ui);
const root = elements.get('historyContent');
assert(root.innerHTML.includes('14 kg') && !root.innerHTML.includes('40 kg'), 'workout A only shows workout A loads');
assert(root.innerHTML.includes('aaaaaaaaaaa/hqdefault.jpg') && !root.innerHTML.includes('wrong-cover'));
assert.equal(elements.get('apEvolutionWorkout').value, 'plan~A');
const select = elements.get('apEvolutionWorkout'); select.value = 'plan~B'; select.handlers.change();
assert(root.innerHTML.includes('40 kg') && !root.innerHTML.includes('14 kg'), 'switching workout updates all metrics, chart and list');
assert(root.innerHTML.includes('ccccccccccc/hqdefault.jpg'));
vm.runInNewContext('evChangeTab("repeticoes")', ui);
assert.equal(elements.get('apEvolutionWorkout').value, 'plan~B', 'workout selection survives switching load/repetition tabs');
vm.runInNewContext('evChangeTab("cargas"); evSetPeriod("1m")', ui);
assert.equal(elements.get('apEvolutionWorkout').value, 'plan~B');
ui.currentWorkouts = [{id: 'other~A', label: 'Segunda-feira', weekday: 1, exercises: []}]; ui.savedHistory = [];
ui.__AP_STUDENT_CONTEXT = {role: 'student', storageId: 'bob', area: {studentId: 'two'}}; events['ap-account-changed'](); ui.renderHistory();
assert.equal(elements.get('apEvolutionWorkout').value, 'other~A'); assert(!root.innerHTML.includes('40 kg') && !root.innerHTML.includes('14 kg'), 'account changes clear selection and historical rows');
assert(root.innerHTML.includes('Sua evolução começa no primeiro treino.'));
vm.runInNewContext('evTogglePreview()', ui);
assert.equal(elements.get('apEvolutionWorkout').value, 'A', 'visual example must select its sample workout instead of an empty real workout');
assert(root.innerHTML.includes('dados fictícios'));
vm.runInNewContext('evTogglePreview()', ui);
assert.equal(elements.get('apEvolutionWorkout').value, 'other~A', 'leaving the example restores the real workout selection');
console.log('PASS: own exercise thumbnails after reordering; separate videos and metrics for identical exercise names in A/B; weekday/sequence/duplicate-plan labels; archived history and snapshots; missing/ambiguous media and unsafe URLs; actual renderer filters load/repetition metrics and retains workout selection; empty/account-change paths; synchronization and unrelated bundle bytes retained.');
