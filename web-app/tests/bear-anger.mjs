import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';

const base = JSON.parse(await readFile(process.env.AGENDA_BEAR_FACE_BASE, 'utf8'));
const candidate = JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE, 'utf8'));
const script = (html, id) => html.match(new RegExp('<script\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const unpack = bundle => JSON.parse(gunzipSync(Buffer.from(script(bundle.files['cadastro.html'], 'ap-mascot-gesture-runtime'), 'base64')));
const module = await readFile(new URL('../app/bear-coat-faces.js', import.meta.url), 'utf8');
const prior = unpack(base);
const boundary = prior.lastIndexOf('\n(function (host) {') + 1;
assert(boundary > 0);
const expected = prior.slice(0, boundary).replace('R.dataset.bearCoatFace="173"', 'R.dataset.bearCoatFace="174"') + module;
assert.equal(unpack(candidate), expected);
new vm.Script(expected);
for (const name of Object.keys(base.files)) {
  let html = base.files[name];
  if (name === 'cadastro.html') html = html.replace(script(html, 'ap-mascot-gesture-runtime'), script(candidate.files[name], 'ap-mascot-gesture-runtime'));
  assert.equal(candidate.files[name], html.replaceAll('1.12.173', '1.12.174'), 'every artwork, other pet, camera, auth and workout byte retained: ' + name);
}
const profiles = vm.runInNewContext('(' + expected.match(/window\.APMascotBearPoseProfiles=(\{poses:.*?\}),function/)[1] + ')').poses;
const calls = [], decoded = [];
const rgba = (seed = 0) => {
  const pixels = new Uint8ClampedArray(320 * 320 * 4);
  for (let y = 0; y < 320; y++) for (let x = 0; x < 320; x++) {
    const i = 4 * (320 * y + x);
    pixels.set([80 + (x + seed) % 90, 75 + (y + seed) % 90, 65 + seed % 60, x < 10 + seed % 7 || x > 309 || y < 10 || y > 309 - seed % 9 ? 0 : 255], i);
  }
  return pixels;
};
class Canvas {
  width = 320; height = 320; pixels = rgba();
  getContext() { return {
    setTransform() {}, clearRect() {},
    drawImage: image => { this.pixels = new Uint8ClampedArray(image.pixels); },
    getImageData: () => ({data: new Uint8ClampedArray(this.pixels)}),
    putImageData: image => { this.pixels = image.data; },
  }; }
}
const doc = {createElement: name => { assert.equal(name, 'canvas'); const value = new Canvas(); value.ownerDocument = doc; return value; }};
const host = {Uint8ClampedArray,
  Image: class { set src(uri) { decoded.push(uri); this.pixels = rgba([...uri].reduce((n, c) => n + c.charCodeAt(0), 0)); this.onload(); } },
  ImageData: class { constructor(data, width, height) { this.data = data; this.width = width; this.height = height; } },
  APMascotArt: Object.fromEntries(['affection', 'reaction'].map(expression => [expression, model => {
    assert.equal(model.species, 'panda'); const uri = expression + ':' + model.xp + ':' + model.colors.panda;
    calls.push(uri); return {uri};
  }])),
};
vm.runInNewContext(prior.slice(boundary), host);
const previousFaces = host.APBearCoatFaces;
vm.runInNewContext(module, host);
const faces = host.APBearCoatFaces;
let count = 0;
for (const [key, values] of Object.entries(profiles)) {
  const [pose, age, color] = key.split(':');
  const profile = {pose, age, color, eyes: [values.slice(0, 4), values.slice(4, 8)], nose: values.slice(8, 10), mouth: values.slice(10, 12)};
  for (const kind of ['angry', 'affection']) {
    const before = calls.length;
    const portrait = new Canvas();
    const result = await faces.render(doc, portrait, profile, kind);
    if (color === 'black') {
      assert.equal(result, null); assert.equal(calls.length, before, 'the working black bear keeps its existing renderer and assets');
      continue;
    }
    const uri = (kind === 'affection' ? 'affection' : 'reaction') + ':' + {baby: 0, teen: 600, adult: 1800}[age] + ':' + color;
    assert.equal(calls.at(-1), uri, 'the expression must belong to this exact coat and age');
    assert.equal(result.key, [pose, age, color, kind === 'affection' ? 'affection' : 'reaction'].join(':'));
    const matrix = faces.mapping(result.landmarks, profile.eyes);
    for (let eye = 0; eye < 2; eye++) {
      const point = faces.inverse(matrix, profile.eyes[eye][0], profile.eyes[eye][1]);
      assert(Math.hypot(point[0] - result.landmarks[eye][0], point[1] - result.landmarks[eye][1]) < 1e-8, 'both eyes align in every pose');
    }
    const pixels = result.canvas.pixels;
    let changed = 0;
    for (let y = 0; y < 320; y++) for (let x = 0; x < 320; x++) {
      const i = 4 * (320 * y + x);
      if (kind === 'affection') assert.equal(pixels[i + 3], portrait.pixels[i + 3], 'affection keeps its original silhouette/alpha');
      const different = [0, 1, 2].some(channel => pixels[i + channel] !== portrait.pixels[i + channel]);
      if (kind === 'affection') {
        const nose = Math.hypot((x - profile.nose[0]) / 11, (y - profile.nose[1]) / 7);
        if (nose <= 1) assert.equal(different, false, 'affection still protects the original nose');
      }
      if (kind === 'affection' && y > Math.max(...profile.eyes.map(eye => eye[1])) + 80) assert.equal(different, false, 'body, paws and pose retained');
      if (different) changed++;
    }
    assert(changed > 100, 'the expression must actually render, not silently return an unchanged portrait');
    if (kind === 'affection') {
      const old = await previousFaces.render(doc, portrait, profile, kind);
      assert.deepEqual(result.pixels, old.pixels, 'the accepted affection expression must stay exactly unchanged');
    } else {
      const source = rgba([...uri].reduce((n, c) => n + c.charCodeAt(0), 0));
      assert.deepEqual(result.pixels, source, 'the complete own-coat/age angry portrait is used without drawing, warping, or mixing facial fragments');
      assert(result.pixels.some((value, index) => index % 4 === 3 && value !== portrait.pixels[index]), 'fixture exercises the raised paw silhouette as well as face colors');
    }
    const target = doc.createElement('canvas');
    const renderer = faces.renderer(target, portrait, result, kind);
    renderer.draw({aff: 1, angry: 1}); assert.deepEqual(target.pixels, result.canvas.pixels, 'full expression remains a single undistorted portrait');
    if (kind === 'angry') {
      renderer.draw({angry: .5, aff: 0});
      for (let i = 0; i < result.pixels.length; i += 4) {
        const alpha = (portrait.pixels[i + 3] + result.pixels[i + 3]) / 2;
        assert(Math.abs(target.pixels[i + 3] - alpha) <= .51);
        for (let c = 0; c < 3; c++) {
          const expected = alpha ? (portrait.pixels[i + c] * portrait.pixels[i + 3] + result.pixels[i + c] * result.pixels[i + 3]) / (2 * alpha) : 0;
          assert(Math.abs(target.pixels[i + c] - expected) <= .51, 'transparent paw/fur edges use premultiplied alpha without dark fringes');
        }
      }
    }
    renderer.draw({aff: 0, angry: 0}); assert.deepEqual(target.pixels, portrait.pixels, 'return restores every original color and alpha, without mesh seams');
    renderer.dispose(); assert.equal(target.width, 0);
    const repeat = await faces.render(doc, portrait, profile, kind);
    assert.equal(repeat, result, 'cache reuses this exact pose/age/coat/expression only');
    count++;
  }
}
assert.equal(count, 80);
assert(!decoded.some(uri => uri.endsWith(':black')));
console.log('PASS: every non-black coat/age uses its complete unwarped angry portrait, including a natural raised-paw silhouette and premultiplied-alpha transition. All 40 selected poses restore exactly; all 40 affection expressions remain pixel-identical to 173; black bear unchanged.');
console.log('PASS: complete four-page fidelity, every image/other pet unchanged, and bounded integration into the real face renderer.');
