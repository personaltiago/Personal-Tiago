import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
const base=JSON.parse(await readFile(process.env.AGENDA_R14_BASE,'utf8'));
const next=JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE,'utf8'));
const reference=await readFile(process.env.AGENDA_R14_REFERENCE,'utf8');
const script=(html,id)=>html.match(new RegExp('<script\\b[^>]*\\bid="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const runtime=JSON.parse(gunzipSync(Buffer.from(script(next.files['cadastro.html'],'ap-mascot-gesture-runtime'),'base64')));
const doc={addEventListener(){}};
const host={document:doc,addEventListener(){}};host.window=host;
vm.createContext(host);
vm.runInContext(script(next.files['index.html'],'ap-student-mascot-model'),host);
vm.runInContext(runtime,host);
// The uploaded HTML is the oracle, rather than an assertion copied from the new motor.
const a=reference.indexOf('const decay=held?1:'),b=reference.indexOf('springs.gx.w=',a);assert(a>0&&b>a);
const expected=vm.runInNewContext('(function(kind,time,age,aim,held,strokeStrength){const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>(x=clamp(x))*x*(3-2*x),duration='+JSON.stringify(host.APBearReferenceMotion.durations)+'[kind]||Infinity,anticipation=null;'+reference.slice(a,b)+'return target;})');
let comparisons=0;
for(const kind of ['idle','look','curious','ear','nose','affection','paw','angry'])for(const age of [0,.08,.25,.65,1.4,2.3,2.75,3.1])for(const held of [false,true])for(const x of [-.8,.7]){
 const aim={x,y:-.4},t=11.4+age,want=expected(kind,t,age,aim,held,.6),actual=host.APBearReferenceMotion.targets(kind,t,age,aim,held,.6);
 for(const key of Object.keys(want))assert(Math.abs(want[key]-actual[key])<1e-12,kind+'/'+key+'/'+age);
 comparisons++;
}
let variants=0,minArea=Infinity,maxArea=-Infinity,extremes={};
for(const xp of [0,600,1800])for(const pose of ['default','sit','rest']){if(xp===0&&pose==='rest')continue;for(const color of ['black','original','white','brown','cream','cinnamon']){
 const model=host.APMascotModel.read({schema:1,species:'panda',name:'Urso',xp,colors:{panda:color},poses:{panda:pose},owned:host.APMascotModel.catalog.filter(x=>x.kind==='pose').map(x=>x.id)});
 assert(host.APMascotBear.supports(model));assert.equal(host.APMascotModel.pose(model).id,pose);
 const p=host.APMascotBearPoses.profile(model);
 for(const kind of ['idle','look','curious','ear','nose','affection','paw','angry']){
  const state={...host.APBearReferenceMotion.targets(kind,1.2,.65,{x:.9,y:.6},false,.5),time:1.2};
  for(let y=0;y<320;y+=10)for(let x=0;x<320;x+=10){const project=(x,y)=>host.APBearReferenceMotor.projection(x,y,p,state),a=project(x,y),b=project(x+10,y),c=project(x,y+10),area=((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/100;assert(Number.isFinite(area)&&area>0,'mesh inversion');if(area<minArea){minArea=area;extremes.min={xp,pose,color,kind,x,y,head:p.head};}if(area>maxArea){maxArea=area;extremes.max={xp,pose,color,kind,x,y,head:p.head};}}
 }
 variants++;
}}
assert.equal(variants,48);assert(minArea>.75&&maxArea<1.25,'bounded local deformation including transparent mesh margins: '+minArea+' / '+maxArea);
for(const name of Object.keys(base.files)){
 let prior=base.files[name],candidate=next.files[name];
 if(name==='cadastro.html'){prior=prior.replace(script(prior,'ap-mascot-gesture-runtime'),'MOTION');candidate=candidate.replace(script(candidate,'ap-mascot-gesture-runtime'),'MOTION');}
 if(name==='index.html')prior=prior.replace('e.APMascotBear?.supports(t)&&"black"===e.APMascotModel.color(t).id?{headTop:.08,headX:.6}','e.APMascotBear?.referenceSupports?.(t)&&"black"===e.APMascotModel.color(t).id?{headTop:.08,headX:.6}');
 assert.equal(candidate,prior.replaceAll(base.version,next.version),'unrelated application content changed: '+name);
}
console.log(JSON.stringify({pass:true,referenceComparisons:comparisons,variants,minTriangleAreaRatio:minArea,maxTriangleAreaRatio:maxArea,unrelatedPages:'identical'}));
