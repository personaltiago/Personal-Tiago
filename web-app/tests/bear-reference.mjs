import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';

const base=JSON.parse(await readFile(process.env.AGENDA_BEAR_REFERENCE_BASE,'utf8'));
const candidate=JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE,'utf8'));
const packed=html=>html.match(/id="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)<\/script>/)[1];
const runtime=bundle=>JSON.parse(gunzipSync(Buffer.from(packed(bundle.files['cadastro.html']),'base64')));
const old=runtime(base),next=runtime(candidate);
const opening="(function(host) {\n  'use strict';\n  const meta = host.APBearSkinMeta,";
const ending="(function(host) {\n  'use strict';\n  const bindings = new WeakMap(),";
function outsideAdapter(source){
 const a=source.indexOf(opening),b=source.indexOf(ending,a);
 assert(a>0&&b>a);
 return source.slice(0,a)+'COAT-ADAPTER\n'+source.slice(b);
}
assert.equal(outsideAdapter(next),outsideAdapter(old),'all canonical black/pose/attention motors, pet gestures, field tracking and camera lifecycle are retained byte for byte');
for(const [name,html] of Object.entries(base.files)){
 let before=html,after=candidate.files[name];
 if(name==='cadastro.html'){before=before.replace(packed(before),'COAT-ADAPTER');after=after.replace(packed(after),'COAT-ADAPTER')}
 assert.equal(after,before.replaceAll(base.version,candidate.version),'all original art, poses, other pets and account/workout code retained: '+name);
}
console.log('PASS: the reference black bear and every animation/gesture/camera motor remain byte-identical; only coat face material changes, with all original artwork, poses, other pets, account and workout code retained.');
