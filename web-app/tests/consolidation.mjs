import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
const [basePath,candidatePath]=process.argv.slice(2);
assert(basePath&&candidatePath);
const base=JSON.parse(await readFile(basePath,'utf8')),candidate=JSON.parse(await readFile(candidatePath,'utf8'));
assert.equal(candidate.version,'1.12.180');assert.equal(candidate.sequence,286);
for(const key of ['appId','format','bridgeVersion','dataSchema'])assert.equal(candidate[key],base[key]);
assert.deepEqual(Object.keys(candidate.files),Object.keys(base.files));
const script=(html,id)=>html.match(new RegExp('<script\\b[^>]*\\bid="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const gesture=bundle=>JSON.parse(gunzipSync(Buffer.from(script(bundle.files['cadastro.html'],'ap-mascot-gesture-runtime'),'base64')));
const normalizeVersion=text=>text.replaceAll(candidate.version,base.version);
const opening="(function(host) {\n  'use strict';\n  const meta = host.APBearSkinMeta,";
const nextModule="(function(host) {\n  'use strict';\n  const bindings = new WeakMap(),";
function withoutCoat(text){const a=text.indexOf(opening),b=text.indexOf(nextModule,a);assert(a>0&&b>a);return (text.slice(0,a)+'COAT\n'+text.slice(b)).replace(')() : (await host.APBearSkin.prepare(doc, base, model, p, "angry", paint)).canvas;',')() : host.APBearSkin.coat(doc, base, p, ref, "angry").canvas;');}
assert.equal(withoutCoat(gesture(candidate)),withoutCoat(gesture(base)),'all pose, gaze, motor, input and other-pet code is retained outside the face registration module');
for(const name of ['professor.html','avaliacoes.html'])assert.equal(normalizeVersion(candidate.files[name]),base.files[name]);
assert.equal(normalizeVersion(candidate.files['cadastro.html'].replace(script(candidate.files['cadastro.html'],'ap-mascot-gesture-runtime'),'RUNTIME')),base.files['cadastro.html'].replace(script(base.files['cadastro.html'],'ap-mascot-gesture-runtime'),'RUNTIME'));
function normalizeIndex(html,isCandidate){
 html=normalizeVersion(html).replace(script(html,'ap-progress-sync-source'),'PROGRESS');
 const start=html.search(/\blet evTab\s*=/),end=html.indexOf('const ASS_FEMALE_PHOTOS=',start);assert(start>0&&end>start);
 html=html.slice(0,start)+'EVOLUTION\n'+html.slice(end);
 if(!isCandidate){const from=html.indexOf('evRecordReps=function(e){'),to=html.indexOf('payRender=function()',from);assert(from>0&&to>from);html=html.slice(0,from)+html.slice(to);}
 if(!isCandidate)for(const id of ['evolution-v4','evolution-fidelity-v5','evolution-fidelity-polish'])html=html.replace(new RegExp('<style[^>]*id="'+id+'"[^>]*>[\\s\\S]*?<\\/style>'),'');
 return html.replace(new RegExp('<style[^>]*id="'+(isCandidate?'ap-evolution-css':'ap-evolution-report-css')+'"[^>]*>[\\s\\S]*?<\\/style>'),'EVOLUTION_CSS');
}
assert.equal(normalizeIndex(candidate.files['index.html'],true),normalizeIndex(base.files['index.html'],false),'only evolution sources/styles changed in the entry page');
const codec={};vm.runInNewContext(script(candidate.files['index.html'],'ap-mascot-asset-codec'),codec);
const progress=gunzipSync(codec.APMascotAssetCodec.decode(script(candidate.files['index.html'],'ap-progress-sync-source'))).toString();
assert(!/renderHistory\s*=/.test(progress),'sync, theme and controls no longer wrap the renderer');
assert(!progress.includes('document.createElement("style")')&&!progress.includes("document.createElement('style')"),'one static stylesheet owns evolution styles');
assert(!candidate.files['index.html'].includes('id="evolution-v4"'));
assert.equal(candidate.files['index.html'].split('id="ap-evolution-css"').length,2);
for(const name of ['evExtract','evData','evRecordLoad','evRecordReps','evToggleAll','evToggleDetail'])assert(!new RegExp('\\b'+name+'\\b').test(candidate.files['index.html']+progress),'removed aggregate helper is not referenced: '+name);
new vm.Script(progress);new vm.Script(gesture(candidate));
for(const html of Object.values(candidate.files))for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
 const type=match[1].match(/\btype="([^"]+)"/)?.[1];
 if(!type||['text/javascript','application/javascript'].includes(type))new vm.Script(match[2]);
}
const doc={addEventListener(){}};const host={document:doc,addEventListener(){}};host.window=host;vm.createContext(host);
vm.runInContext(script(candidate.files['index.html'],'ap-student-mascot-model'),host);vm.runInContext(gesture(candidate),host);
let count=0,maxOldError=0,maxNewError=0;
for(const xp of [0,600,1800])for(const pose of ['default','sit','rest']){
 if(xp===0&&pose==='rest')continue;
 for(const color of ['black','original','white','brown','cream','cinnamon']){
  const model=host.APMascotModel.read({schema:1,species:'panda',name:'Urso',xp,colors:{panda:color},poses:{panda:pose},owned:host.APMascotModel.catalog.filter(x=>x.kind==='pose').map(x=>x.id)});
  const profile=host.APMascotBearPoses.profile(model),reference=host.APMascotBearPoses.profile({...model,colors:{...model.colors,panda:'black'}});
  if(color!=='black')assert(host.APBearSkin.reactionPoints[profile.age+':'+color]?.length===4,'authored expression landmarks exist for every colored coat');
  const fit=host.APBearSkin.faceMapping(profile,reference),old=host.APBearSkin.mapping(profile.eyes,reference.eyes);
  assert(fit.a*fit.d-fit.b*fit.c>0,'face transform must preserve orientation');
  const before=[old.a*profile.nose[0]-old.b*profile.nose[1]+old.x,old.b*profile.nose[0]+old.a*profile.nose[1]+old.y];
  maxOldError=Math.max(maxOldError,Math.hypot(before[0]-reference.nose[0],before[1]-reference.nose[1]));
  for(const [from,to]of [[profile.eyes[0],reference.eyes[0]],[profile.eyes[1],reference.eyes[1]],[profile.nose,reference.nose]]){
   const point=[fit.a*from[0]+fit.c*from[1]+fit.x,fit.b*from[0]+fit.d*from[1]+fit.y];
   const error=Math.hypot(point[0]-to[0],point[1]-to[1]);assert(error<1e-8);maxNewError=Math.max(maxNewError,error);
  }
  count++;
 }
}
assert.equal(count,48);
console.log(JSON.stringify({pass:true,variants:count,maxNoseErrorBefore:maxOldError,maxLandmarkErrorAfter:maxNewError,unchangedPages:2,motionAndInputUnchanged:true,renderHooksInSync:0,canonicalStyleBlocks:1}));
