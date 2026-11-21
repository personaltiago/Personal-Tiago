import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const bundle=JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE,'utf8'));
const before=JSON.parse(await readFile(process.env.AGENDA_SPEECH_BASE,'utf8'));
const module=html=>html.match(/<script\b[^>]*\bid="ap-mascot-homes"[^>]*>([\s\S]*?)<\/script>/)[1];
const source=module(bundle.files['index.html']);
const old='b=(e.dataset.mascotPose&&"default"!==e.dataset.mascotPose?h:p.right-Math.min(9,.08*p.width))-g';
for(const name of Object.keys(before.files)){
 const expected=(name==='index.html'?before.files[name].replace(old,'b=h-g'):before.files[name]).replaceAll('1.12.167','1.12.168');
 assert.equal(bundle.files[name],expected,'preserve every other byte of '+name);
}

class Style extends Map{getPropertyValue(k){return this.get(k)||''}setProperty(k,v){this.set(k,v)}}
function render(code,{teacher,species,xp,mirrored,pose,width}){
 const style=new Style(),base={left:21,top:31},scale=xp>=1800?1:xp>=600?.85:.7;
 const model={species,xp,equipped:{home:'home-yard'}},origin={left:base.left+1,top:base.top+1};
 let path='';
 const markRect={left:origin.left+14,top:origin.top+150,right:origin.left+184,bottom:origin.top+320,width:170,height:170};
 const mark={getBoundingClientRect:()=>markRect,querySelector:()=>({getBoundingClientRect:()=>markRect})};
 const speech={style:new Style(),getBoundingClientRect(){const left=origin.left+(parseFloat(this.style.getPropertyValue('--speech-left'))||56),top=origin.top+(parseFloat(this.style.getPropertyValue('--speech-top'))||12);return{left,top,right:left+Math.min(240,width-72),bottom:top+74,width:Math.min(240,width-72),height:74}}};
 const tail={setAttribute(){},firstElementChild:{setAttribute(name,value){if(name==='d')path=value}}};
 const node={style,dataset:{},clientLeft:1,clientTop:1,clientWidth:width,
  get clientHeight(){return parseFloat(style.getPropertyValue('--pet-scene-height'))||300},
  getBoundingClientRect:()=>({...base,width:width+2}),classList:{add(){}},
  querySelector(selector){if(selector.split(',').includes(teacher?'.ap-teacher-mascot-mark':'.ap-mascot-mini'))return mark;if(selector==='.ap-mascot-speech')return speech;if(selector==='.ap-mascot-speech-tail')return tail;return null}};
 const host={requestAnimationFrame:fn=>fn(),dispatchEvent(){},Event:class{},
  APMascotModel:{phase:()=>({id:xp>=1800?'adult':xp>=600?'teen':'baby'}),pose:()=>({id:pose})},
  APMascotArt:{scale:()=>scale,mirrored:()=>mirrored,landmarks:()=>null}};
 node.ownerDocument={defaultView:host};vm.runInNewContext(code,host);
 host.APMascotHomes.decorate(node,model);
 assert(path,'tail must be rendered for '+(teacher?'teacher':'student'));
 const numbers=path.match(/-?\d+(?:\.\d+)?/g).map(Number);
 // M x y C x y x y TIP_X TIP_Y Q x y x y
 const tip={x:numbers[6],y:numbers[7]};
 const head=markRect.left-origin.left+markRect.width*host.APMascotHomes.mouthX(model);
 return{tip,head,path,speech:speech.getBoundingClientRect()};
}
let count=0;
for(const teacher of [false,true])for(const species of ['capybara','panda','rooster','kitten','wolf'])for(const xp of [0,600,1800])for(const mirrored of [false,true])for(const pose of ['default','sleepy','petting'])for(const width of [280,360,480]){
 const result=render(source,{teacher,species,xp,mirrored,pose,width});
 assert(Math.abs(result.tip.x-result.head)<.011,`${species}/${xp}/${pose}: tail must point to the pet landmark, not the image edge`);
 assert(result.tip.y>=result.speech.bottom-32,'tail must descend from the balloon');count++;
}
const fixture={teacher:true,species:'panda',xp:0,mirrored:false,pose:'default',width:360};
const previous=render(module(before.files['index.html']),fixture);
assert(Math.abs(previous.tip.x-previous.head)>30,'regression fixture must reproduce the old off-head pointer');
console.log(`PASS: actual habitat layout anchors speech tails to the head in ${count} role/species/age/mirror/pose/width combinations; old resting pose fails; every unrelated bundle byte retained.`);
