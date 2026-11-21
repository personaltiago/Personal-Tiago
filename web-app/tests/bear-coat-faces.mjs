import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';

const base = JSON.parse(await readFile(process.env.AGENDA_BEAR_FACE_BASE, 'utf8'));
const candidate = JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE, 'utf8'));
const script = (html, id) => html.match(new RegExp('<script\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const unpack = bundle => JSON.parse(gunzipSync(Buffer.from(script(bundle.files['cadastro.html'], 'ap-mascot-gesture-runtime'), 'base64')));
const module = await readFile(new URL('../app/bear-coat-faces.js', import.meta.url), 'utf8');
let expected = unpack(base);
for (const [old, next] of [
  ['"rest:adult:cream":[190,122,10.52,10.52,229,142,9.02,11.27,220,152,215,171,211.3,141.3,81,69,210]', '"rest:adult:cream":[196,122,14,14,249,141,14,15,220,152,215,171,221.7,138.3,81,69,210]'],
  ['const T=E?await(e.APBearYoungFaces?.render(b,A,v)):null;', 'const coatFace=await e.APBearCoatFaces?.render(b,A,v,l),T=E?await(e.APBearYoungFaces?.render(b,A,v)):null;'],
  ['const P=[A,"affection"===l?w(b,M,v,"affection"):A,E?T?.canvas||w(b,M,v,"angry"):A]', 'const P=[A,"affection"===l?coatFace?.canvas||w(b,M,v,"affection"):A,E?coatFace?.canvas||T?.canvas||w(b,M,v,"angry"):A]'],
  ['R.dataset.bearPose=v.pose,T&&', 'R.dataset.bearPose=v.pose,coatFace&&(R.dataset.bearCoatFace="173",R.dataset.bearFaceKey=coatFace.key),T&&'],
  ['let D=k(),F=function(e,t,a){', 'let D=k(),F=coatFace?e.APBearCoatFaces.renderer(D,A,coatFace,l):function(e,t,a){'],
]) { assert.equal(expected.split(old).length, 2); expected = expected.replace(old, next); }
expected += '\n' + module;
assert.equal(unpack(candidate), expected);
new vm.Script(expected);
for (const name of Object.keys(base.files)) {
  let html = base.files[name];
  if (name === 'cadastro.html') html = html.replace(script(html, 'ap-mascot-gesture-runtime'), script(candidate.files[name], 'ap-mascot-gesture-runtime'));
  assert.equal(candidate.files[name], html.replaceAll('1.12.172', '1.12.173'), 'every artwork, other pet, camera, auth and workout byte retained: ' + name);
}
const profiles = vm.runInNewContext('(' + expected.match(/window\.APMascotBearPoseProfiles=(\{poses:.*?\}),function/)[1] + ')').poses;
const calls = [], decoded = [];
const rgba = (seed = 0) => {
  const pixels = new Uint8ClampedArray(320 * 320 * 4);
  for (let y = 0; y < 320; y++) for (let x = 0; x < 320; x++) {
    const i = 4 * (320 * y + x);
    pixels.set([80 + (x + seed) % 90, 75 + (y + seed) % 90, 65 + seed % 60, x < 10 || x > 309 || y < 10 || y > 309 ? 0 : 255], i);
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
      assert.equal(pixels[i + 3], portrait.pixels[i + 3], 'original silhouette/alpha retained');
      const different = [0, 1, 2].some(channel => pixels[i + channel] !== portrait.pixels[i + channel]);
      const nose = Math.hypot((x - profile.nose[0]) / 11, (y - profile.nose[1]) / 7);
      if (nose <= 1) assert.equal(different, false, 'never duplicate or smear the original nose');
      if (kind === 'angry' && profile.eyes.some(([cx, cy, rx, ry]) => Math.hypot((x - cx) / (.9 * rx), (y - cy) / (.9 * ry)) <= 1))
        assert.equal(different, false, 'angry eyebrows must never stretch or repaint the original eyeballs');
      if (y > Math.max(...profile.eyes.map(eye => eye[1])) + 80) assert.equal(different, false, 'body, paws and pose retained');
      if (different) changed++;
    }
    assert(changed > 100, 'the expression must actually render, not silently return an unchanged portrait');
    const target = doc.createElement('canvas');
    const renderer = faces.renderer(target, portrait, result, kind);
    renderer.draw({aff: 1, angry: 1}); assert.deepEqual(target.pixels, result.canvas.pixels, 'full expression remains a single undistorted portrait');
    renderer.draw({aff: 0, angry: 0}); assert.deepEqual(target.pixels, portrait.pixels, 'return restores every original color and alpha, without mesh seams');
    renderer.dispose(); assert.equal(target.width, 0);
    const repeat = await faces.render(doc, portrait, profile, kind);
    assert.equal(repeat, result, 'cache reuses this exact pose/age/coat/expression only');
    count++;
  }
}
assert.equal(count, 80);
assert(!decoded.some(uri => uri.endsWith(':black')));
console.log('PASS: 80 non-black coat/age/pose expressions use their own natural photo; eye alignment, nose, alpha and body retained; exact cache identity; black bear unchanged.');
console.log('PASS: complete four-page fidelity, every image/other pet unchanged, and bounded integration into the real face renderer.');
