import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const candidate = JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE, 'utf8'));
const previous = JSON.parse(await readFile(process.env.AGENDA_SPEECH_RETURN_BASE, 'utf8'));
const script = (bundle, id) => bundle.files['index.html'].match(new RegExp('<script\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const currentCloseup = await readFile(new URL('../app/mascot-closeup.js', import.meta.url), 'utf8');
assert.equal(script(candidate, 'ap-mascot-closeup'), currentCloseup);
for (const name of Object.keys(previous.files)) {
  let expected = previous.files[name];
  if (name === 'index.html') {
    expected = expected.replace(script(previous, 'ap-mascot-closeup'), currentCloseup)
      .replace('c.delete(t),function(e){', 'c.delete(t),e.APMascotCloseup?.layout(t)||function(e){')
      .replace('e.dataset.petAffection||e.style.getPropertyValue("--pet-scene-height")', 'e.dataset.petAffection||e.dataset.petReturning||e.style.getPropertyValue("--pet-scene-height")');
  }
  assert.equal(candidate.files[name], expected.replaceAll('1.12.168', '1.12.169'), 'retain every unrelated byte of ' + name);
}

class Style extends Map {
  getPropertyValue(k) { return this.get(k) || ''; }
  setProperty(k, v) { this.set(k, String(v)); }
  removeProperty(k) { this.delete(k); }
  [Symbol.iterator]() { return this.keys(); }
}
function fixture(bundle, {teacher = true, species = 'panda', xp = 0, mirrored = false, pose = 'default', width = 360, reduced = false, animate = true} = {}) {
  let now = 0, next = 0, path = '';
  const frames = new Map(), timers = new Map(), animations = [], events = {}, docEvents = {};
  const model = {species, xp, equipped: {home: 'home-night'}}, scale = xp >= 1800 ? 1 : xp >= 600 ? .85 : .7;
  const px = (style, k, fallback) => parseFloat(style.getPropertyValue(k)) || fallback;
  const rect = (left, top, width, height) => ({left, top, right: left + width, bottom: top + height, width, height});
  const doc = {hidden: false, head: {append() {}}, getElementById: () => null, createElement: () => ({}), addEventListener(k, fn) { docEvents[k] = fn; }};
  const node = {style: new Style(), dataset: {}, isConnected: true, hidden: false, ownerDocument: doc, clientWidth: width, clientLeft: 1, clientTop: 1,
    get clientHeight() { return px(this.style, '--pet-scene-height', 244); }, getBoundingClientRect() { return rect(20, 30, width + 2, this.clientHeight + 2); },
    classList: {contains: () => false, add() {}}, matches: () => true, addEventListener() {}};
  const mark = {getBoundingClientRect() {
    const close = node.dataset.petCloseup === 'true', size = close ? px(node.style, '--pet-close-size', 400) : 128 * (xp >= 1800 ? 1.6 : 1);
    let left = 21 + (close ? px(node.style, '--pet-close-left', 0) : 14), top = 31 + (close ? px(node.style, '--pet-close-top', 0) : node.clientHeight - 32 - size), w = size;
    const animation = animations.findLast(a => !a.cancelled && !a.ended);
    if (animation) {
      const progress = Math.min(1, (now - animation.start) / animation.duration), values = animation.frames[0].transform.match(/-?\d+(?:\.\d+)?/g).map(Number);
      left += values[0] * (1 - progress); top += values[1] * (1 - progress); w *= 1 + (values[2] - 1) * (1 - progress);
    }
    return rect(left, top, w, w);
  }, querySelector(selector) { return selector === 'image' ? image : {}; }};
  const image = {getBoundingClientRect() { const r = mark.getBoundingClientRect(); return rect(r.left + r.width * (1 - scale) / 2, r.top + r.height * (1 - scale), r.width * scale, r.height * scale); }};
  if (animate) mark.animate = (keyframes, options) => {
    let resolve, reject;
    const animation = {frames: keyframes, ...options, start: now, cancelled: false, ended: false,
      finished: new Promise((a, b) => { resolve = a; reject = b; }), cancel() { this.cancelled = true; reject(new Error('cancelled')); }, resolve() { this.ended = true; resolve(); }};
    // Entrance animations are intentionally cancelled by the controller.
    animation.finished.catch(() => {}); animations.push(animation); return animation;
  };
  const speech = {style: new Style(), getBoundingClientRect() {
    const close = node.dataset.petCloseup === 'true';
    return rect(21 + px(close ? node.style : this.style, close ? '--pet-close-speech-left' : '--speech-left', 56),
      31 + px(close ? node.style : this.style, close ? '--pet-close-speech-top' : '--speech-top', 12), Math.min(close ? 264 : 240, width - 72), 70);
  }};
  const tail = {setAttribute() {}, firstElementChild: {setAttribute(k, v) { if (k === 'd') path = v; }}};
  node.querySelector = selector => selector.split(',').includes(teacher ? '.ap-teacher-mascot-mark' : '.ap-mascot-mini') ? mark :
    selector === '.ap-mascot-speech' ? speech : selector === '.ap-mascot-speech-tail' ? tail : selector.includes('data-mascot-name') ? {getBoundingClientRect: () => rect(35, 43, 40, 18)} : null;
  const host = {document: doc, matchMedia: () => ({matches: reduced}), Event: class {}, dispatchEvent() {}, addEventListener(k, fn) { events[k] = fn; },
    requestAnimationFrame(fn) { const id = ++next; frames.set(id, fn); return id; }, cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn, delay) { const id = ++next; timers.set(id, {fn, at: now + delay}); return id; }, clearTimeout(id) { timers.delete(id); },
    APMascotModel: {phase: () => ({id: xp >= 1800 ? 'adult' : xp >= 600 ? 'teen' : 'baby'}), pose: () => ({id: pose})},
    APMascotArt: {scale: () => scale, mirrored: () => mirrored, landmarks: () => pose === 'default' ? null : {headX: pose === 'sit' ? .6 : .35, headTop: .08}}, APMascotHitAreas: {zones: () => [{part: 'nose', x: .5, y: .3}]}};
  doc.defaultView = host;
  vm.runInNewContext(script(bundle, 'ap-mascot-closeup'), host);
  vm.runInNewContext(script(bundle, 'ap-mascot-homes'), host);
  function snapshot() {
    const markRect = mark.getBoundingClientRect(), values = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
    return {left: speech.style.getPropertyValue('--speech-left'), top: speech.style.getPropertyValue('--speech-top'), height: node.clientHeight,
      error: values ? Math.abs(values[6] - (markRect.left - 21 + markRect.width * host.APMascotHomes.mouthX(model))) : Infinity};
  }
  async function advance(ms, inspect = () => {}) {
    const end = now + ms;
    while (now < end) {
      now = Math.min(end, now + 16);
      for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); }
      for (const animation of animations) if (!animation.cancelled && !animation.ended && now - animation.start >= animation.duration) animation.resolve();
      await Promise.resolve();
      const callbacks = [...frames]; frames.clear(); for (const [, fn] of callbacks) fn(now);
      await Promise.resolve(); inspect(snapshot());
    }
  }
  const approach = () => host.APMascotCloseup.approach(node, model);
  host.APMascotHomes.decorate(node, model);
  return {node, host, model, approach, advance, snapshot, frames, timers, events, docEvents};
}
const old = fixture(previous); await old.advance(48); const original = old.snapshot(); old.approach(); await old.advance(2700);
assert(old.snapshot().error > 10 || old.snapshot().left !== original.left, 'release 168 must reproduce the stale speech after the animated return');

let count = 0;
for (const teacher of [true, false]) for (const species of ['capybara', 'panda', 'rooster', 'kitten', 'wolf']) for (const xp of [0, 600, 1800]) for (const mirrored of [false, true]) for (const pose of ['default', 'sit', 'rest']) for (const width of [280, 390, 480]) {
  const f = fixture(candidate, {teacher, species, xp, mirrored, pose, width}); await f.advance(48); const start = f.snapshot();
  for (let cycle = 0; cycle < 2; cycle++) {
    f.approach(); await f.advance(2700, snapshot => {
      if (f.node.dataset.petReturning) { assert.equal(snapshot.height, start.height, 'return must not enlarge the resting scene from animated bounds'); assert(snapshot.error < .011, 'tail must follow the moving head'); }
    });
    assert.deepEqual(f.snapshot(), start, 'the full resting balloon and scene must return to their original geometry');
    assert.equal(f.node.dataset.petCloseup, undefined); assert.equal(f.node.dataset.petReturning, undefined); assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
  }
  count++;
}
for (const options of [{reduced: true}, {animate: false}]) {
  const f = fixture(candidate, options); await f.advance(48); const start = f.snapshot(); f.approach(); await f.advance(2700); assert.deepEqual(f.snapshot(), start);
}
for (const action of ['repeat', 'house', 'account', 'hidden', 'detached']) {
  const f = fixture(candidate); await f.advance(48); const start = f.snapshot(); f.approach(); await f.advance(1700);
  assert.equal(f.node.dataset.petReturning, 'true');
  if (action === 'repeat') f.approach();
  if (action === 'house') f.host.APMascotCloseup.reset(f.node);
  if (action === 'account') f.events['ap-account-changed']();
  if (action === 'hidden') { f.node.ownerDocument.hidden = true; f.docEvents.visibilitychange(); }
  if (action === 'detached') f.node.isConnected = false;
  await f.advance(2700);
  assert.equal(f.node.dataset.petReturning, undefined); assert.equal(f.node.dataset.petCloseup, undefined); assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
  if (action !== 'detached') assert.deepEqual(f.snapshot(), start, action + ' must settle in resting geometry');
}
console.log(`PASS: release 168 reproduces stale speech; actual bundled layout and animations follow the head, hold scene height and restore exact resting geometry in ${count} role/species/age/mirror/pose/width cases, two cycles each; repeat/cancel/account/hidden/detached/reduced-motion paths settle; unrelated bytes preserved.`);
