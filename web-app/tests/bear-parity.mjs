import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
const base=JSON.parse(await readFile(process.env.AGENDA_BEAR_PARITY_BASE,'utf8'));
const candidate=JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE,'utf8'));
const script=(html,id)=>html.match(new RegExp('<script\\b[^>]*\\bid="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>'))?.[1];
const runtime=JSON.parse(gunzipSync(Buffer.from(script(candidate.files['cadastro.html'],'ap-mascot-gesture-runtime'),'base64')));
new vm.Script(runtime);
assert(!runtime.includes('APBearCoatFaces'),'portrait replacement renderer is absent');
assert(runtime.includes('F=function(e,t,a){const n=e.getContext("webgl"'),'real pose mesh renderer restored');
assert(runtime.includes('T=c?e.APMascotBearAttention.fragment(s):e.APBearSkin.mainFragment(E,s)'),'coats bind to the original approved 3D engine');
for(const name of Object.keys(base.files)){
 let old=base.files[name],next=candidate.files[name];
 for(const id of name==='cadastro.html'?['ap-mascot-gesture-runtime']:name==='index.html'?['ap-mascot-closeup','ap-student-mascot-art']:[]){old=old.replace(script(old,id),'ALLOWED-MODULE-'+id);next=next.replace(script(next,id),'ALLOWED-MODULE-'+id)}
 assert.equal(next,old.replaceAll(base.version,candidate.version),'all other markup, data adapters, original skins, poses, assets, workouts and account logic remain byte-identical: '+name);
}
class ScriptNode{
 constructor(attributes,text){this.attributes=new Set([...attributes.matchAll(/([\w-]+)(?:="[^"]*")?/g)].map(m=>m[1]));this.textContent=text}
 hasAttribute(key){return this.attributes.has(key)}
 removeAttribute(key){this.attributes.delete(key)}
}
const document={addEventListener(){},head:{append(){}},createElement:()=>({remove(){}})};
const host={document,addEventListener(){},dispatchEvent(){},Event,Response,Blob,DecompressionStream,Uint8Array,TextDecoder,TextEncoder,atob,btoa,Date,
 Image:class{naturalWidth=512;naturalHeight=512;set src(value){this.value=value;queueMicrotask(()=>this.onload?.())}async decode(){}},
 DOMParser:class{parseFromString(html){const nodes=new Map();for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){const id=m[1].match(/\bid="([^"]+)"/)?.[1];if(id)nodes.set(id,new ScriptNode(m[1],m[2]))}return{getElementById:id=>nodes.get(id)||null,querySelectorAll:selector=>selector==='[data-ap-gzip]'?[...nodes.values()].filter(n=>n.hasAttribute('data-ap-gzip')):[]}}},
 APdecodeSource:async()=>candidate.files['cadastro.html'],APMascotHomes:{hydrate(){}},
};host.window=host;
vm.createContext(host);
for(const id of ['ap-student-mascot-model','ap-mascot-asset-codec'])vm.runInContext(script(candidate.files['index.html'],id),host);
vm.runInContext(runtime,host);
vm.runInContext(script(candidate.files['index.html'],'ap-student-mascot-art'),host);
assert.equal(await host.APMascotArt.load(),true,'actual artifact loader configures all original coat/pose/expression assets');
let count=0;
for(const age of ['baby','teen','adult'])for(const pose of ['default','sit','rest']){
 if(age==='baby'&&pose==='rest')continue;
 for(const color of ['black','original','white','brown','cream','cinnamon']){
  const model=host.APMascotModel.read({schema:1,species:'panda',name:'Bear',xp:{baby:0,teen:600,adult:1800}[age],colors:{panda:color},poses:{panda:pose},owned:host.APMascotModel.catalog.filter(x=>x.kind==='pose').map(x=>x.id)});
  assert.equal(host.APMascotModel.pose(model).id,pose,'selected pose remains available');
  assert.equal(host.APMascotModel.color(model).id,color);
  const html=host.APMascotArt.render(model),uri=html.match(/href="([^"]+)"/)?.[1];
  assert(uri?.startsWith('data:image/'),'every supported coat/stage/pose still renders an actual image');
  assert.equal(uri,host.APMascotArt.portrait(model),'approved motor does not replace the selected normal portrait');
  assert.equal(host.APMascotBear.supports(model),age==='adult'&&pose==='sit','all six adult sitting coats share the approved motor');
  const profile=host.APMascotBearPoses.profile(model);
  const eyes=host.APBearSkin.attentionEyes(model);
  assert.equal(eyes.length,2);for(const eye of eyes){assert(eye.outline.length>=8);for(const k of ['center','iris','radius','white','travel'])assert(eye[k].every(Number.isFinite),k);assert(eye.radius.every(v=>v>0));}
  for(const kind of ['affection','angry','look','curious','ear','nose']){
   const state=host.APMascotBearPoses.values(profile,kind,.65,{x:.8,y:.7},false,false);
   assert(Object.values(state).every(Number.isFinite));
   if(kind==='affection')assert(state.aff>.9);
   if(kind==='angry')assert(state.angry>.9);
   const foot=host.APMascotBearPoses.project(140,310,profile,state);
   assert(Math.hypot(foot[0]-140,foot[1]-310)<1e-8,'face motion never moves planted feet');
  }
  for(const [x,y] of [[-1,0],[1,0],[0,-1],[0,1]]){
   const state=host.APMascotBearPoseAttention.values(profile,'look',.7,{x,y},false);
   assert.equal(Math.sign(state.gx),Math.sign(x));assert.equal(Math.sign(state.gy),Math.sign(y));assert(state.focus>.99);
  }
  count++;
 }
}
assert.equal(count,48);
console.log('PASS: actual loader and artwork API retain all 48 legal bear coat/stage/pose variants. Six adult-sit coats share the approved engine; gaze geometry and canonical eye/head/ear/nose/anger/affection motion are valid throughout, without moving planted feet.');
console.log('PASS: full four-page fidelity outside the explicitly changed animation/portrait adapter modules; no original skin, pose, workout, login or other pet asset is replaced.');
