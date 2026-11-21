import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';

const candidate = JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE, 'utf8'));
const previous = JSON.parse(await readFile(process.env.AGENDA_IPHONE_BASE, 'utf8'));
const script = (html, id) => html.match(new RegExp('<script\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const closeup = await readFile(new URL('../app/mascot-closeup.js', import.meta.url), 'utf8');
const unpack = bundle => JSON.parse(gunzipSync(Buffer.from(script(bundle.files['cadastro.html'], 'ap-mascot-gesture-runtime'), 'base64')));
let expectedGesture = unpack(previous);
for (const [old, next] of [
  ['globalThis.APMascotCloseup?.approach(n,o());const e=n.querySelector', 'globalThis.APMascotCloseup?.approach(n,o());if(globalThis.APWebPlatform?.stablePetCamera)return;const e=n.querySelector'],
  ['async function g(a,i,d=!1){', 'async function g(a,i,d=!1){e.APMascotCloseup?.prepareForGesture(a);'],
  ['async function v(a,o,r,i){', 'async function v(a,o,r,i){e.APMascotCloseup?.prepareForGesture(a);'],
]) { assert.equal(expectedGesture.split(old).length, 2); expectedGesture = expectedGesture.replace(old, next); }
assert.equal(unpack(candidate), expectedGesture, 'preserve the entire face/pose/artwork runtime outside the bounded camera coordination');
new vm.Script(expectedGesture);
for (const name of Object.keys(previous.files)) {
  let expected = previous.files[name];
  if (name === 'index.html') expected = expected.replace(script(expected, 'ap-mascot-closeup'), closeup);
  if (name === 'cadastro.html') expected = expected.replace(script(expected, 'ap-mascot-gesture-runtime'), script(candidate.files[name], 'ap-mascot-gesture-runtime'));
  assert.equal(candidate.files[name], expected.replaceAll('1.12.170', '1.12.171'), 'preserve unrelated bytes, including evolution/auth and every pet artwork: ' + name);
}
const platform = await readFile(new URL('../web/platform.js', import.meta.url), 'utf8');
function detect(userAgent, system = '', maxTouchPoints = 0, hosted = true) {
  const host = {URL, Request, Response, fetch: async () => new Response(), navigator: {userAgent, platform: system, maxTouchPoints}, document: {baseURI: 'https://agenda.example.test/app/', addEventListener() {}}, addEventListener() {}};
  host.window = host; host.parent = host;
  if (hosted) host.APWebHost = {};
  vm.runInNewContext(platform, host);
  assert.equal(host.Android, undefined, 'iPhone adapter must not impersonate the Android bridge');
  return host.APWebPlatform?.stablePetCamera;
}
for (const ua of ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18 Safari/604.1', 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0 Mobile Safari/604.1']) assert.equal(detect(ua), true);
assert.equal(detect('Mozilla/5.0 Macintosh AppleWebKit/605.1.15', 'MacIntel', 5), true, 'desktop-UA iPad is included');
for (const ua of ['Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36', 'Mozilla/5.0 Macintosh AppleWebKit/605.1.15', 'Mozilla/5.0 Windows NT Chrome/130']) assert.equal(detect(ua), false);
assert.equal(detect('iPhone AppleWebKit', '', 0, false), undefined, 'unhosted/native bundles do not enable web compatibility mode');
const sw = await readFile(new URL('../web/sw.js', import.meta.url), 'utf8'); assert(sw.includes('agenda-personal-web-shell-v6'));
console.log('PASS: iPhone/iPad hosted-only compatibility detection, including iPad desktop UA and iOS Chrome; native/desktop excluded; no fake Android bridge; complete bundle/artwork/evolution/auth fidelity and bounded gesture patch; shell cache refresh.');
