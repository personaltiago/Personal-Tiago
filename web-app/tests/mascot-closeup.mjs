import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../app/mascot-closeup.js', import.meta.url), 'utf8');
function fixture({teacher = false, reduced = false, animate = true, stable = false} = {}) {
  let now = 0, next = 0;
  let layers = 3, cancellations = 0;
  const timers = new Map(), events = {}, docEvents = {}, animations = [];
  class Style extends Map {
    getPropertyValue(name) { return this.get(name) || ''; }
    setProperty(name, value) { this.set(name, value); }
    removeProperty(name) { this.delete(name); }
    [Symbol.iterator]() { return this.keys(); }
  }
  const doc = {hidden: false, head: {append() {}}, getElementById: () => null,
    createElement: () => ({}), addEventListener: (name, cb) => { docEvents[name] = cb; }};
  const node = {style: new Style(), dataset: {}, ownerDocument: doc, hidden: false,
    isConnected: true, clientWidth: 360, get clientHeight() { return parseFloat(this.style.getPropertyValue('--pet-scene-height')) || 248; },
    classList: {contains: () => false}, matches: selector => selector.includes(teacher ? '.ap-teacher-mascot' : '.ap-mascot-home'),
    getBoundingClientRect: () => ({left: 0, top: 0, width: 360, height: node.clientHeight}), addEventListener() {}};
  const mark = {querySelector: () => ({}), getBoundingClientRect: () => node.dataset.petCloseup ?
    {left: parseFloat(node.style.getPropertyValue('--pet-close-left')), top: parseFloat(node.style.getPropertyValue('--pet-close-top')), width: parseFloat(node.style.getPropertyValue('--pet-close-size'))} :
    {left: 14, top: 100, width: 112}};
  if (animate) mark.animate = (frames, options) => {
    let resolve, reject;
    const animation = {frames, ...options, at: now + options.duration, layers, cancelled: false, done: false,
      finished: new Promise((yes, no) => { resolve = yes; reject = no; }),
      finish() { if (!this.done) { this.done = true; resolve(); } },
      cancel() { if (!this.done) { this.done = true; this.cancelled = true; reject(new Error('cancelled')); } }};
    animations.push(animation); return animation;
  };
  const speech = {getBoundingClientRect: () => ({width: node.dataset.petCloseup ? 264 : 240, height: 70})};
  node.querySelector = selector => selector.includes('.ap-mascot-mini') ? mark : selector === '.ap-mascot-speech' ? speech :
    selector.includes('data-mascot-name') ? {getBoundingClientRect: () => ({bottom: 28})} : null;
  const host = {document: doc, matchMedia: () => ({matches: reduced}),
    APWebPlatform: {stablePetCamera: stable}, APMascotPetting: {cancel() { layers = 0; cancellations++; }},
    setTimeout(fn, delay) { const id = ++next; timers.set(id, {fn, at: now + delay}); return id; },
    clearTimeout(id) { timers.delete(id); }, addEventListener(name, fn) { events[name] = fn; },
    APMascotArt: {scale: model => model.xp >= 1800 ? 1 : model.xp >= 600 ? .85 : .7, mirrored: () => false, landmarks: () => null},
    APMascotHomes: {decorate() {}}, APMascotHitAreas: {zones: () => [{part: 'nose', x: .5, y: .3}]}};
  vm.runInNewContext(source, host);
  async function advance(ms) {
    const end = now + ms;
    while (true) {
      const time = Math.min(...[...timers.values()].map(t => t.at), ...animations.filter(a => !a.done).map(a => a.at));
      if (time > end) break;
      now = time;
      for (const animation of animations) if (!animation.done && animation.at <= now) animation.finish();
      for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); }
      for (let i = 0; i < 8; i++) await Promise.resolve();
    }
    now = end;
    for (let i = 0; i < 8; i++) await Promise.resolve();
  }

  return {host, node, advance, animations, events, docEvents, timers, setLayers(value) { layers = value; }, get cancellations() { return cancellations; }};
}
for (const teacher of [false, true]) for (const species of ['capybara', 'panda', 'rooster', 'kitten', 'wolf']) for (const xp of [0, 600, 1800]) {
  const f = fixture({teacher});
  f.node.style.setProperty('--pet-scene-height', '248px');
  assert.equal(f.host.APMascotCloseup.approach(f.node, {species, xp}), true);
  assert.equal(f.node.dataset.petCloseup, 'true');
  await f.advance(1399); assert.equal(f.node.dataset.petCloseup, 'true');
  await f.advance(1); assert.equal(f.node.dataset.petCloseup, undefined);
  assert.equal(f.node.style.getPropertyValue('--pet-scene-height'), '248px');
  assert.equal([...f.node.style].some(name => name.startsWith('--pet-close-')), false);
  assert.deepEqual(f.animations.map(animation => animation.duration), [240, 1000]);
  for (const animation of f.animations) {
    assert.ok(animation.frames.every(frame => frame.transformOrigin === '0 0'), 'the scale origin must stay fixed after the close-up CSS is removed');
  }
}
const repeat = fixture();
const model = {species: 'wolf', xp: 1800};
repeat.host.APMascotCloseup.approach(repeat.node, model);
for (let i = 0; i < 10; i++) { await repeat.advance(130); repeat.host.APMascotCloseup.approach(repeat.node, model); }
await repeat.advance(99); assert.equal(repeat.node.dataset.petCloseup, 'true');
await repeat.advance(1); assert.equal(repeat.node.dataset.petCloseup, undefined, 'repeated taps cannot postpone the original return');
assert.equal(repeat.node.dataset.petReturning, 'true');
for (let i = 0; i < 9; i++) { await repeat.advance(100); repeat.host.APMascotCloseup.approach(repeat.node, model); }
assert.equal(repeat.animations.length, 2, 'scenery taps during return must not reverse it');
await repeat.advance(100); assert.equal(repeat.node.dataset.petReturning, undefined);
repeat.host.APMascotCloseup.approach(repeat.node, model); await repeat.advance(2400);
assert.equal(repeat.node.dataset.petReturning, undefined, 'a new cycle can start after the prior return finishes');
for (const options of [{reduced: true}, {animate: false}]) {
  const f = fixture(options); f.host.APMascotCloseup.approach(f.node, model); await f.advance(3000);
  assert.equal(f.node.dataset.petCloseup, undefined); assert.equal(f.animations.length, 0);
}
const cancel = fixture(); cancel.host.APMascotCloseup.approach(cancel.node, model);
cancel.events['ap-account-changed'](); await cancel.advance(1000);
assert.equal(cancel.node.dataset.petCloseup, undefined); assert.equal(cancel.animations.length, 1);
assert.equal(cancel.timers.size, 0);
for (const teacher of [false, true]) for (const species of ['capybara', 'panda', 'rooster', 'kitten', 'wolf']) for (const xp of [0, 600, 1800]) {
  const f = fixture({teacher, stable: true});
  f.host.APMascotCloseup.approach(f.node, {species, xp});
  assert.equal(f.cancellations, 1, 'remove prior or pending face layers before the camera starts');
  assert.equal(f.animations[0].layers, 0);
  await f.advance(50);
  let ready = false;
  const earlyGesture = f.host.APMascotCloseup.prepareForGesture(f.node).then(result => { ready = result; });
  await f.advance(189); assert.equal(ready, false, 'gesture waits for entrance without snapping');
  await f.advance(1); await earlyGesture; assert.equal(ready, 'settled');
  assert.equal(f.animations[0].cancelled, false);
  f.setLayers(2);
  await f.advance(1159); assert.equal(f.node.dataset.petCloseup, 'true');
  assert.equal(await f.host.APMascotCloseup.prepareForGesture(f.node), true);
  await f.advance(1); assert.equal(f.node.dataset.petCloseup, undefined, 'gesture must not restart the camera hold');
  assert.equal(f.cancellations, 2, 'dispose gesture patches before scaling back');
  assert.equal(f.animations[1].layers, 0);
  ready = false;
  const returnGesture = f.host.APMascotCloseup.prepareForGesture(f.node).then(result => { ready = result; });
  await f.advance(999); assert.equal(ready, false);
  assert.equal(f.animations[1].cancelled, false, 'a returning pet must keep moving smoothly');
  await f.advance(1); await returnGesture; assert.equal(ready, 'settled');
  assert.equal(f.node.dataset.petReturning, undefined);
  assert.equal(f.timers.size, 0);
}
for (const phase of ['entrance', 'return']) for (const cause of ['account', 'hidden', 'detached', 'house']) {
  const f = fixture({stable: true}); f.host.APMascotCloseup.approach(f.node, model);
  await f.advance(phase === 'entrance' ? 50 : 1500);
  const pending = f.host.APMascotCloseup.prepareForGesture(f.node);
  if (cause === 'account') f.events['ap-account-changed']();
  else if (cause === 'hidden') { f.host.document.hidden = true; f.docEvents.visibilitychange(); }
  else if (cause === 'house') f.host.APMascotCloseup.reset(f.node);
  else f.node.isConnected = false;
  await f.advance(3000);
  assert.equal(await pending, false, 'never replay a face gesture after ' + cause + ' during ' + phase);
}
const native = fixture(); native.host.APMascotCloseup.approach(native.node, model); await native.advance(500);
assert.equal(await native.host.APMascotCloseup.prepareForGesture(native.node), true); await native.advance(900);
assert.equal(native.cancellations, 2); assert.equal(native.node.dataset.petCloseup, undefined, 'Android also clears face layers before moving');
console.log('PASS: automatic bounded cycles in both cards, all five pets and three ages; rapid scenery taps do not extend or reverse return; original scene restored; reduced motion/older WebViews and account cleanup.');
console.log('PASS: faces wait for entrance/return without snapping, never extend the camera hold and never replay after account/visibility/detachment changes; canvas face layers removed before camera movement on web and Android.');

export {fixture};
