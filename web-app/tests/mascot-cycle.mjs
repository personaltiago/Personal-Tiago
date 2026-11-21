import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
import {fixture} from './mascot-closeup.mjs';

const candidate = JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE, 'utf8'));
const previous = JSON.parse(await readFile(process.env.AGENDA_CYCLE_BASE, 'utf8'));
const script = (html, id) => html.match(new RegExp('<script\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const unpack = bundle => JSON.parse(gunzipSync(Buffer.from(script(bundle.files['cadastro.html'], 'ap-mascot-gesture-runtime'), 'base64')));
let expectedGesture = unpack(previous);
for (const [old, next] of [
  ['globalThis.APMascotCloseup?.approach(n,o());if(globalThis.APWebPlatform?.stablePetCamera)return;const e=n.querySelector("image:not([data-pet-prior])"),t=e?.getScreenCTM();if(t){let e;try{e=new DOMPoint(a.x,a.y).matrixTransform(t.inverse())}catch(e){return}v(n,o(),"look",{x:e.x/320,y:e.y/320})}return', 'globalThis.APMascotCloseup?.approach(n,o());return'],
  ['async function g(a,i,d=!1){e.APMascotCloseup?.prepareForGesture(a);', 'async function g(a,i,d=!1){const camera=await e.APMascotCloseup?.prepareForGesture(a);if(!1===camera)return!1;if("settled"===camera)d=!1;'],
  ['async function v(a,o,r,i){e.APMascotCloseup?.prepareForGesture(a);', 'async function v(a,o,r,i){if(!1===await e.APMascotCloseup?.prepareForGesture(a))return!1;'],
]) { assert.equal(expectedGesture.split(old).length, 2); expectedGesture = expectedGesture.replace(old, next); }
assert.equal(unpack(candidate), expectedGesture, 'all expressions and artwork retained outside the scenery branch and two movement gates');
new vm.Script(expectedGesture);
const closeup = await readFile(new URL('../app/mascot-closeup.js', import.meta.url), 'utf8');
for (const name of Object.keys(previous.files)) {
  let expected = previous.files[name];
  if (name === 'index.html') expected = expected.replace(script(expected, 'ap-mascot-closeup'), closeup);
  if (name === 'cadastro.html') expected = expected.replace(script(expected, 'ap-mascot-gesture-runtime'), script(candidate.files[name], 'ap-mascot-gesture-runtime'));
  assert.equal(candidate.files[name], expected.replaceAll('1.12.171', '1.12.172'), 'preserve all unrelated page, login, evolution and artwork bytes: ' + name);
}
assert.equal(candidate.sequence, 278);
const regression = fixture();
vm.runInNewContext(script(previous.files['index.html'], 'ap-mascot-closeup'), regression.host);
const regressionModel = {species: 'panda', xp: 0, colors: {panda: 'brown'}, poses: {panda: 'sit'}};
regression.host.APMascotCloseup.approach(regression.node, regressionModel);
for (let i = 0; i < 7; i++) { await regression.advance(175); regression.host.APMascotCloseup.approach(regression.node, regressionModel); }
await regression.advance(175);
assert.equal(regression.node.dataset.petCloseup, 'true', 'the previous release reproduces the enlarged pet after the original return deadline');
regression.host.APMascotCloseup.resetAll();
const context = {};
vm.runInNewContext(script(candidate.files['index.html'], 'ap-student-mascot-model'), context);
const model = context.APMascotModel;
let variants = 0, cycles = 0;
for (const species of ['panda', 'capybara', 'wolf', 'kitten', 'rooster']) for (const xp of [0, 600, 1800]) {
  for (const color of model.colorsFor(species)) for (const pose of model.posesFor(species, xp)) {
    const state = model.read({schema: 1, species, xp, colors: {[species]: color.id}, poses: {[species]: pose.id}, owned: pose.itemId ? [pose.itemId] : []});
    assert.equal(model.color(state).id, color.id); assert.equal(model.pose(state).id, pose.id);
    variants++;
    for (const teacher of [false, true]) for (const stable of [false, true]) {
      const f = fixture({teacher, stable});
      f.node.style.setProperty('--pet-scene-height', '248px');
      assert.equal(f.host.APMascotCloseup.approach(f.node, state), true);
      for (let i = 0; i < 7; i++) { await f.advance(175); f.host.APMascotCloseup.approach(f.node, state); }
      await f.advance(174); assert.equal(f.node.dataset.petCloseup, 'true');
      await f.advance(1); assert.equal(f.node.dataset.petCloseup, undefined);
      assert.equal(f.node.dataset.petReturning, 'true');
      const gesture = f.host.APMascotCloseup.prepareForGesture(f.node);
      for (let i = 0; i < 5; i++) { f.host.APMascotCloseup.approach(f.node, state); await f.advance(200); }
      assert.equal(await gesture, 'settled');
      assert.equal(f.node.dataset.petReturning, undefined);
      assert.equal(f.animations.length, 2); assert.equal(f.animations[1].duration, 1000);
      assert.equal(f.animations[1].cancelled, false);
      assert.equal(f.node.style.getPropertyValue('--pet-scene-height'), '248px');
      assert.equal(f.timers.size, 0);
      cycles++;
    }
  }
}
console.log(`PASS: ${variants} real catalog combinations (all pets, colors, ages and available poses), ${cycles} repeated-touch cycles across teacher/student and iPhone/native paths; bounded return and original scene restored.`);
console.log('PASS: complete four-page bundle fidelity; only the camera module, scenery branch, two asynchronous gesture gates and release version changed.');
