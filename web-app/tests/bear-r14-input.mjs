import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../app/bear-reference-input.js',import.meta.url),'utf8');
function fixture(){
 let clock=10000,next=0,hit={part:'body'},model={species:'panda',xp:0,color:'black',pose:'default'},reactWait=null;
 const timers=new Map(),listeners={},globalEvents={},calls=[];const handlers={};
 const capture={setPointerCapture(){},releasePointerCapture(){}};
 const actor={kind:'idle',held:false,action(){return this.kind;},state(){return{kind:this.kind,held:this.held};},hit(){return hit;},stroke(){}};
 const image={getScreenCTM:()=>({inverse:()=>({})})};
 const doc={hidden:false,addEventListener(k,f){(listeners[k]??=[]).push(f);}};
 const node={isConnected:true,ownerDocument:doc,querySelector:()=>image,addEventListener(k,f,options={}){(handlers[k]??=[]).push({fn:f,capture:options.capture});}};
 const modelAPI={phase:xp=>({id:xp>=1800?'adult':xp>=600?'teen':'baby'}),color:m=>({id:m.color}),pose:m=>({id:m.pose})};
 const native={bind(){for(const k of ['pointerdown','pointerup','pointermove','click'])node.addEventListener(k,()=>calls.push('legacy-'+k));},async respond(_node,_model,kind,point){actor.kind=kind;actor.held=false;calls.push({kind,point});},async react(_node,_model,held){if(reactWait)await reactWait;actor.kind='affection';actor.held=held;calls.push({kind:'affection',held});},release(){actor.held=false;},cancel(){}};
 const host={APMascotPetting:native,APMascotModel:modelAPI,APMascotHitAreas:{hit:async()=>hit},APMascotBear:{get:()=>actor},APMascotBearPoses:{profile:()=>({nose:[160,100]})},APBearFieldGaze:{begin:()=>()=>{},follow(){calls.push('follow');}},DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}},Date:{now:()=>clock},setTimeout(f,ms){const id=++next;timers.set(id,{fn:f,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id),addEventListener(k,f){(globalEvents[k]??=[]).push(f);}};
 vm.runInNewContext(source,host);host.APMascotPetting.bind(node,()=>model,()=>true);
 const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
 async function advance(ms){clock+=ms;for(const [id,t]of [...timers])if(t.at<=clock){timers.delete(id);t.fn();}await flush();}
 function send(type,x=160,y=140,extra={}){
  const event={pointerId:1,pointerType:'touch',button:0,isPrimary:true,clientX:x,clientY:y,detail:1,target:{closest(selector){if(selector.includes('a,input'))return null;if(selector.includes('.ap-mascot-mini')||selector==='.ap-habitat-open')return capture;return null;}},stopImmediatePropagation(){this.stopped=true;},...extra};
  for(const h of (handlers[type]||[]).filter(x=>x.capture)) {h.fn(event);if(event.stopped)return;}
  for(const h of (handlers[type]||[]).filter(x=>!x.capture)){h.fn(event);if(event.stopped)return;}
 }
 async function tap(){send('pointerdown');await advance(40);send('pointerup');await flush();}
 return{calls,actor,tap,send,advance,flush,setHit(value){hit=value;},setModel(value){model=value;},deferReact(){let finish;reactWait=new Promise(r=>finish=r);return finish;},account(){for(const f of globalEvents['ap-account-changed']||[])f();}};
}
let variants=0;
for(const xp of [0,600,1800])for(const pose of ['default','sit','rest']){if(xp===0&&pose==='rest')continue;for(const color of ['black','original','white','brown','cream','cinnamon']){
 const f=fixture();f.setModel({species:'panda',xp,pose,color});await f.tap();await f.advance(284);assert.equal(f.calls.length,0,'single tap waits for R14 double-tap window');await f.advance(1);assert.equal(f.actor.kind,'curious');
 const double=fixture();double.setModel({species:'panda',xp,pose,color});await double.tap();await double.advance(80);await double.tap();assert.equal(double.actor.kind,'angry');await double.advance(400);assert.equal(double.calls.filter(x=>x.kind==='angry').length,1);assert(!double.calls.some(x=>x.kind==='curious'));
 const stroke=fixture();stroke.setModel({species:'panda',xp,pose,color});stroke.send('pointerdown');await stroke.advance(40);stroke.send('pointermove',180,140);await stroke.flush();assert.equal(stroke.actor.kind,'affection');assert.equal(stroke.actor.held,true);stroke.send('pointerup',180,140);await stroke.flush();assert.equal(stroke.actor.held,false);await stroke.advance(600);assert(!stroke.calls.some(x=>x.kind==='curious'||x.kind==='angry'));
 variants++;
}}
for(const part of ['nose','ear']){const f=fixture();f.setHit({part});await f.tap();await f.advance(300);assert.equal(f.actor.kind,part);}
const scene=fixture();scene.setHit(null);await scene.tap();assert.equal(scene.actor.kind,'look');assert.equal(scene.calls[0].point.x,.5);
const cancelled=fixture();await cancelled.tap();cancelled.account();await cancelled.advance(500);assert(!cancelled.calls.some(x=>x.kind==='curious'),'account change cancels delayed taps');
const replaced=fixture();await replaced.tap();replaced.setModel({species:'panda',xp:1800,color:'white',pose:'sit'});await replaced.advance(500);assert(!replaced.calls.some(x=>x.kind==='curious'),'age/coat/pose changes cancel old tap intent');
const pending=fixture(),finish=pending.deferReact();pending.send('pointerdown');pending.send('pointermove',180,140);await pending.flush();pending.send('pointerup',180,140);finish();await pending.flush();assert.equal(pending.actor.held,false,'a late texture/gesture completion cannot hold a released stroke');
const other=fixture();other.setModel({species:'kitten',xp:0,color:'black',pose:'default'});other.send('pointerdown');assert(other.calls.includes('legacy-pointerdown'),'other animals retain their existing input handler');
console.log('PASS: R14 single/double/stroke/release across '+variants+' variants; ears/nose/scenery, cancelled accounts, changed portraits, delayed gesture completion, and unchanged other-animal input.');
