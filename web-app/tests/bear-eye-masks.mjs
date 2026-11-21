import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';

const script=(html,id)=>html.match(new RegExp('<script\\b[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
async function measure(path){
 const bundle=JSON.parse(await readFile(path,'utf8'));
 const host={document:{addEventListener(){}},addEventListener(){}};host.window=host;
 vm.createContext(host);
 vm.runInContext(script(bundle.files['index.html'],'ap-student-mascot-model'),host);
 vm.runInContext(JSON.parse(gunzipSync(Buffer.from(script(bundle.files['cadastro.html'],'ap-mascot-gesture-runtime'),'base64'))),host);
 const rows=[];
 for(const [age,xp] of [['baby',0],['teen',600],['adult',1800]])for(const pose of ['default','sit','rest']){
  if(age==='baby'&&pose==='rest')continue;
  for(const color of ['original','white','black','brown','cream','cinnamon']){
   const model=host.APMascotModel.read({schema:1,species:'panda',xp,colors:{panda:color},poses:{panda:pose},owned:host.APMascotModel.catalog.filter(x=>x.kind==='pose').map(x=>x.id)});
   for(const [index,eye] of host.APBearSkin.attentionEyes(model).entries()){
    const edge=(x,y)=>Math.min(...eye.outline.map((a,i)=>{const b=eye.outline[(i+1)%eye.outline.length],dx=b[0]-a[0],dy=b[1]-a[1];return(dx*(y-a[1])-dy*(x-a[0]))/Math.hypot(dx,dy)}));
    let visible=0;
    for(let y=Math.floor(Math.min(...eye.outline.map(p=>p[1])));y<=Math.ceil(Math.max(...eye.outline.map(p=>p[1])));y++)
     for(let x=Math.floor(Math.min(...eye.outline.map(p=>p[0])));x<=Math.ceil(Math.max(...eye.outline.map(p=>p[0])));x++)if(edge(x,y)>.75)visible++;
    rows.push({key:[age,pose,color,index].join(':'),visible,center:edge(...eye.center),iris:edge(...eye.iris)});
   }
  }
 }
 return{version:bundle.version,rows};
}
if(process.env.AGENDA_BEAR_GAZE_BASE){
 const base=await measure(process.env.AGENDA_BEAR_GAZE_BASE);
 const invisible=base.rows.filter(x=>x.visible===0);
 assert.equal(invisible.length,60,'reproduce the actual zero-coverage masks in the shipped young-bear variants');
 console.log('REPRODUCED: '+base.version+' has 60 eye masks with zero visible pupil coverage although look/focus state can change.');
}
const next=await measure(process.env.AGENDA_HOSTED_CANDIDATE);
assert.equal(next.rows.length,96);
for(const eye of next.rows){
 assert(eye.visible>40,'the actual GPU/Canvas inward-edge mask must expose an eye region: '+JSON.stringify(eye));
 assert(eye.center>.75&&eye.iris>.75,'the actual iris and eye center must lie inside the drawable mask: '+JSON.stringify(eye));
}
console.log('PASS: all 96 actual eye masks across 48 bear variants expose visible pupil pixels, with both center and iris inside the GPU/Canvas mask.');
