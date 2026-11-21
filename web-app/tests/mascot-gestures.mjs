import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';

process.on('unhandledRejection', error => {
  console.error('Gesture handler rejected: ' + error.message);
  process.exitCode = 1;
});

const path = process.env.AGENDA_HOSTED_CANDIDATE;
assert.ok(path, 'provide the candidate four-page bundle');
const bundle = JSON.parse(await readFile(path, 'utf8'));
const encoded = bundle.files['cadastro.html'].match(/<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)<\/script>/)[1];
const source = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')));

function fixture(species, xp, teacher, stable = false) {
  const handlers = {}, actions = [], approaches = [], timers = new Map();
  const preparations = [], held = [];
  let next = 0, clock = 10000;
  const status = {}, svg = {dataset: {}, setAttribute() {}}, image = {isConnected: true, cloneNode: () => ({}), getScreenCTM: () => ({inverse: () => ({})})};
  const markClass = teacher ? '.ap-teacher-mascot-mark' : '.ap-mascot-mini';
  const mark = {isConnected: true, innerHTML: '', setPointerCapture() {}, releasePointerCapture() {},
    querySelector: selector => selector === 'svg' ? svg : image};
  const doc = {hidden: false, addEventListener() {}};
  const node = {isConnected: true, dataset: {}, ownerDocument: doc,
    querySelector: selector => selector.includes('.ap-mascot-mini') ? mark : selector.includes('image') ? image : selector === '.ap-pet-touch-status' ? status : null,
    querySelectorAll: () => [], addEventListener(name, fn) { handlers[name] = fn; }};
  const model = {species, xp, name: 'Nino'};
  const host = {document: doc, addEventListener() {}, Date: {now: () => clock},
    setTimeout(fn, ms) { const id = ++next; timers.set(id, {fn, at: clock + ms}); return id; },
    clearTimeout(id) { timers.delete(id); },
    DOMPoint: class { constructor(x, y) { this.x = x; this.y = y; } matrixTransform() { return this; } },
    APMascotArt: {scale: () => 1, mirrored: () => false}, APMascotHomes: {decorate() {}},
    APMascotModel: {phase: value => ({id: value >= 1800 ? 'adult' : value >= 600 ? 'teen' : 'baby'}), color: () => ({id: 'original'}), pose: () => ({id: 'default'})},
    APWebPlatform: {stablePetCamera: stable},
    APMascotCloseup: {approach: (...args) => approaches.push(args), prepareForGesture: (...args) => preparations.push(args)}};
  host.window = host;
  try { vm.runInNewContext(source, host, {displayErrors: false}); }
  catch (error) { throw new Error('Bundled runtime: ' + error.message); }
  const engine = supported => ({supports: state => supported === state.species,
    async start(_image, _model, kind, hold, _reduced, poseHeld) { actions.push(kind); held.push(supported === 'panda' ? poseHeld : hold); return {duration: 2300, profile: {heart: [160, 20], head: [160, 80, 50, 50]}, dispose() {}, release: () => 650, hold() {}}; }});
  host.APWolfFace = engine('wolf'); host.APKittenFace = engine('kitten'); host.APChickFace = engine('rooster');
  host.APCapybaraFace = engine('capybara'); host.APMascotBear = {supports: () => false, attentionSupports: () => false}; host.APMascotBearPoses = engine('panda');
  host.APMascotCuriosityMotion = {start: async (_image, _model, kind) => { actions.push(kind); return {duration: 2000, dispose() {}}; }};
  let hit = null;
  host.APMascotHitAreas = {hit: async () => hit};
  host.APMascotPetting.bind(node, () => model);
  const target = kind => ({closest(selector) {
    if (kind === 'house' && selector.includes('.ap-habitat-house')) return {};
    if (kind === 'pet' && selector.includes(markClass)) return mark;
    if (kind !== 'house' && selector === '.ap-habitat-open') return {};
    return null;
  }});
  const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  async function tap(kind, {part = 'body', pointerType = 'touch', keyboard = false} = {}) {
    const t = target(kind);
    if (keyboard) { clock += 1000; handlers.click({target: t, detail: 0}); }
    else {
      hit = kind === 'pet' ? {part, x: .5, y: .3, zone: {x: .5, y: .3}} : null;
      clock += 1000;
      const event = {target: t, pointerType, pointerId: ++next, isPrimary: true, button: 0, clientX: 150, clientY: 120};
      handlers.pointerdown(event); clock += 50; handlers.pointerup(event);
      // Include the synthesized click emitted after a real pointer tap.
      handlers.click({target: t, detail: 1});
    }
    await flush();
  }
  return {host, node, model, tap, actions, held, approaches, preparations, handlers, timers, target, flush};
}

for (const teacher of [false, true]) for (const species of ['capybara', 'panda', 'rooster', 'kitten', 'wolf']) for (const xp of [0, 600, 1800]) {
  for (const pointerType of ['touch', 'mouse']) for (const part of ['body', 'ear', 'nose', 'paw', 'tail']) {
    const f = fixture(species, xp, teacher);
    await f.tap('pet', {part, pointerType});
    assert.deepEqual(f.actions, ['angry'], `${species}/${xp}/${part}: a pet tap must be angry immediately`);
    assert.equal(f.approaches.length, 0, 'tapping the pet must not approach');
    await f.tap('pet', {part, pointerType});
    assert.equal(f.approaches.length, 0, 'repeated pet taps must not approach');
  }
  const f = fixture(species, xp, teacher);
  await f.tap('scene');
  assert.equal(f.approaches.length, 1, 'scenery tap must approach');
  assert.ok(!f.actions.includes('angry'), 'scenery must not make the pet angry');
  await f.tap('house');
  assert.equal(f.approaches.length, 1, 'the house must not approach');
  const keyboard = fixture(species, xp, teacher);
  await keyboard.tap('scene', {keyboard: true});
  assert.equal(keyboard.approaches.length, 1, 'keyboard scenery activation must approach');
  const petKeyboard = fixture(species, xp, teacher);
  await petKeyboard.tap('pet', {keyboard: true});
  assert.deepEqual(petKeyboard.actions, ['angry']);
  assert.equal(petKeyboard.approaches.length, 0);
}
for (const teacher of [false, true]) for (const species of ['capybara', 'panda', 'rooster', 'kitten', 'wolf']) for (const xp of [0, 600, 1800]) {
  const ios = fixture(species, xp, teacher, true); await ios.tap('scene');
  assert.equal(ios.approaches.length, 1);
  assert.deepEqual(ios.actions, [], 'iPhone scenery must not start a layered canvas gaze alongside the camera');
  await ios.tap('pet'); assert.deepEqual(ios.actions, ['angry']);
  assert(ios.preparations.length > 0, 'angry gesture coordinates with the camera lifecycle');
  const android = fixture(species, xp, teacher); await android.tap('scene');
  assert.equal(android.approaches.length, 1); assert.equal(android.actions.length, 0, 'native scenery also uses a single portrait without overlapping gaze');
}
console.log('PASS: actual bundled gesture handlers separate angry pet taps from scenery approach in both cards, all five pets and three ages; touch, mouse, repeated taps, keyboard and house.');
console.log('PASS: iPhone and Android scenery taps approach without overlapping canvas/gaze; pet taps still become angry.');
for (const teacher of [false, true]) for (const species of ['capybara', 'panda', 'rooster', 'kitten', 'wolf']) {
  for (const allowed of [false, 'settled']) {
    const f = fixture(species, 0, teacher, true);
    let settle;
    f.host.APMascotCloseup.prepareForGesture = () => new Promise(resolve => { settle = resolve; });
    await f.tap('pet'); assert.deepEqual(f.actions, [], 'a moving portrait cannot start a face layer');
    settle(allowed); await f.flush();
    assert.deepEqual(f.actions, allowed ? ['angry'] : [], 'cancelled camera waits must not replay an old angry face');
    const stroke = f.host.APMascotPetting.react(f.node, f.model, true);
    await f.flush(); settle(allowed); await stroke;
    assert.deepEqual(f.actions, allowed ? ['angry', 'affection'] : []);
    if (allowed) assert.equal(f.held.at(-1), false, 'a stroke released while waiting cannot leave the eyes held closed forever');
  }
}
console.log('PASS: actual packed angry/affection handlers wait for camera, reject cancelled actions and do not hold a released stroke after return.');
