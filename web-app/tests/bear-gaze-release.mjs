import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';

const base=JSON.parse(await readFile(process.env.AGENDA_BEAR_GAZE_BASE,'utf8'));
const candidate=JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE,'utf8'));
const packed=html=>html.match(/id="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)<\/script>/)[1];
const runtime=b=>JSON.parse(gunzipSync(Buffer.from(packed(b.files['cadastro.html']),'base64')));
const old=runtime(base),next=runtime(candidate),skin="(function(host) {\n  'use strict';\n  const meta = host.APBearSkinMeta,",field="(function(host) {\n  'use strict';\n  const bindings = new WeakMap(),";
const beforeCalibration='b.eyes=e.APBearSkin.attentionEyes(h,l[b.pose]);const A=new e.Image;A.src=s.getAttribute("href"),await A.decode();';
const afterCalibration='const A=new e.Image;A.src=s.getAttribute("href"),await A.decode();b.eyes=e.APBearSkin.attentionEyes(h,l[b.pose],s.ownerDocument,A);';
const beforeReduced='return L=O(a),U=a,q=N(t),"look"!==g&&(I=a),d[g]';
const afterReduced='return L=O(a),U=a,q=N(t),"look"!==g&&(I=a),w&&(L=null,z(Math.max(a,I+600))),d[g]';
assert.equal(next.slice(0,next.indexOf(skin)),old.slice(0,old.indexOf(skin)).replace(beforeCalibration,afterCalibration).replace(beforeReduced,afterReduced),'all original renderers, gestures, expressions, head/ear/nose motion and camera coordination remain exact apart from eye calibration and explicit target redraw in reduced motion');
function coatExceptEyes(source){
 const own=source.slice(source.indexOf(skin),source.indexOf(field));
 const a=own.indexOf('  function attentionEyes('),b=own.indexOf('  function asset(',a);
 assert(a>0&&b>a);return own.slice(0,a)+'EYE-GEOMETRY\n'+own.slice(b);
}
assert.equal(coatExceptEyes(next),coatExceptEyes(old),'the coat expression textures and all other material functions remain unchanged');
for(const [name,html] of Object.entries(base.files)){
 let before=html,after=candidate.files[name];
 if(name==='cadastro.html'){before=before.replace(packed(before),'GAZE-MODULES');after=after.replace(packed(after),'GAZE-MODULES')}
 assert.equal(after,before.replaceAll(base.version,candidate.version),'all original art, poses, other pets, workout and account code remain exact: '+name);
}
console.log('PASS: release changes only mapped eye winding and field input; all canonical motors, expressions, selected poses, original artwork, other pets and account/workout logic remain byte-identical.');
