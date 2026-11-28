import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';

const bundle=JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE,'utf8'));
const source=JSON.parse(gunzipSync(Buffer.from(bundle.files['cadastro.html'].match(/id="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)<\/script>/)[1],'base64')));
async function fixture(teacher){
 const nodeEvents={},docEvents={},windowEvents={},frames=new Map(),timers=new Map(),actions=[],targets=[],captures=[],released=[];
 let clock=10000,next=0,model={species:'panda',xp:600,name:'Bear',colors:{panda:'brown'},poses:{panda:'default'}};
 const styleValues=new Map([['touch-action','manipulation']]);
 const style={getPropertyValue:k=>styleValues.get(k)||'',getPropertyPriority:()=>'',setProperty:(k,v)=>styleValues.set(k,v),removeProperty:k=>styleValues.delete(k)};
 const surface={style,setPointerCapture:id=>captures.push(id),releasePointerCapture:id=>released.push(id)};
 const image={isConnected:true,getScreenCTM:()=>({inverse:()=>({})})},svg={dataset:{},setAttribute(){}};
 const mark={isConnected:true,innerHTML:'original',setPointerCapture:id=>captures.push('pet:'+id),releasePointerCapture:id=>released.push('pet:'+id),querySelector:q=>q==='svg'?svg:image,getBoundingClientRect:()=>({left:100,top:50,width:320,height:320})};
 const status={textContent:''},doc={hidden:false,defaultView:{innerHeight:900},addEventListener:(k,f)=>(docEvents[k]??=[]).push(f)};
 const node={ownerDocument:doc,isConnected:true,dataset:{},addEventListener:(k,f)=>(nodeEvents[k]??=[]).push(f),removeEventListener(){},append(){},querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0,bottom:360,width:390,height:360}),querySelector:q=>q==='.ap-habitat-open'?surface:q.includes('image')?image:q.includes('.ap-mascot-mini')?mark:q==='.ap-pet-touch-status'?status:null};
 const host={document:doc,addEventListener:(k,f)=>(windowEvents[k]??=[]).push(f),Date:{now:()=>clock},requestAnimationFrame:f=>{const id=++next;frames.set(id,f);return id},cancelAnimationFrame:id=>frames.delete(id),setTimeout:(f,ms)=>{const id=++next;timers.set(id,f);return id},clearTimeout:id=>timers.delete(id),matchMedia:()=>({matches:false}),DOMPoint:class{constructor(x,y){this.x=x;this.y=y}matrixTransform(){return{x:this.x-100,y:this.y-50}}},APMascotCloseup:{moving:()=>false,prepareForGesture:async()=>true,approach(){actions.push('camera');node.dataset.petCloseup='true'}},APMascotArt:{load:async()=>true,scale:()=>1,mirrored:()=>false},APMascotHomes:{decorate(){}},APMascotModel:{phase:()=>({id:'teen'}),color:m=>({id:m.colors.panda||'original'}),pose:()=>({id:'default'})}};host.window=host;
 vm.runInNewContext(source,host);
 host.APMascotBear={supports:()=>false,get:()=>null};
 host.APMascotBearPoses={supports:m=>m.species==='panda',start:async(_image,_model,kind,point)=>{actions.push(kind);if(point)targets.push(point);return{duration:2300,profile:{head:[160,80,50,50]},retarget:point=>{targets.push(point);return 2300},hold(){},release:()=>550,dispose(){}}}};
 host.APMascotHitAreas={hit:async()=>({part:'body',x:.5,y:.3})};
 host.APMascotPetting.bind(node,()=>model);
 const target=pet=>({closest(selector){if(pet&&selector.includes(teacher?'.ap-teacher-mascot-mark':'.ap-mascot-mini'))return mark;if(selector==='.ap-habitat-open')return surface;return null}});
 const flush=async()=>{for(let i=0;i<35;i++)await Promise.resolve()};
 const event=(id,x,y,pet=false)=>({pointerId:id,pointerType:'touch',button:0,buttons:1,isPrimary:true,clientX:x,clientY:y,target:target(pet)});
 const send=async(type,event,documentOnly=false)=>{clock+=20;if(!documentOnly)for(const f of nodeEvents[type]||[])f(event);for(const f of docEvents[type]||[])f(event);await flush()};
 const tick=async()=>{const queued=[...frames.values()];frames.clear();for(const f of queued)await f();await flush()};
 return{host,node,styleValues,actions,targets,captures,released,event,send,tick,flush,changeSpecies(){model={...model,species:'wolf'};host.APBearFieldGaze.bind(node,()=>model)},advance:()=>clock+=1000};
}
for(const teacher of [false,true]){
 const f=await fixture(teacher);
 assert.equal(f.styleValues.get('touch-action'),'none','bear scenery must suppress UA pan cancellation before pointerdown');
 await f.send('pointerdown',f.event(10,350,130));
 assert(f.captures.includes(10),'scenery must capture the real pointer');
 await f.send('pointermove',f.event(10,352,132));await f.tick();assert.equal(f.actions.length,0,'a sub-threshold move must remain a tap');
 await f.send('pointermove',f.event(10,340,145));await f.tick();assert.deepEqual(f.actions,['look'],'the actual hit-tested scenery-stroke branch starts gaze');
 for(let i=0;i<20;i++)await f.send('pointermove',f.event(10,500+i*8,180+i),true);
 await f.tick();assert(f.targets.length>=2,'document movement continues retargeting outside the card');
 assert.equal(f.targets.at(-1).x,(652-100)/320);assert.equal(f.targets.at(-1).y,(199-50)/320);
 await f.send('pointerup',f.event(10,652,199));await f.tick();assert(!f.actions.includes('camera'),'a drag must never turn into an approach');assert(f.released.includes(10));
 const count=f.targets.length;await f.send('pointermove',f.event(10,700,200),true);await f.tick();assert.equal(f.targets.length,count,'released touch must not keep following');
 f.host.APMascotPetting.cancel(f.node);f.advance();
 await f.send('pointerdown',f.event(11,160,120,true));await f.send('pointerup',f.event(11,160,120,true));await f.tick();assert.equal(f.actions.at(-1),'angry','a pet tap still becomes angry');
 f.host.APMascotPetting.cancel(f.node);f.advance();
 await f.send('pointerdown',f.event(12,160,120,true));await f.send('pointermove',f.event(12,180,130,true));await f.tick();assert.equal(f.actions.at(-1),'affection','a real pet stroke stays affection');
 await f.send('pointermove',f.event(12,250,140,true));await f.tick();assert.equal(f.actions.at(-1),'affection');await f.send('pointerup',f.event(12,250,140,true));
 f.host.APMascotPetting.cancel(f.node);f.advance();
 await f.send('pointerdown',f.event(13,350,130));await f.send('pointerup',f.event(13,350,130));await f.tick();assert.equal(f.actions.at(-1),'camera','a short scenery tap keeps its existing camera action');
 const prior=f.targets.length;await f.send('pointermove',{...f.event(20,100,100),pointerType:'mouse',buttons:0},true);await f.tick();assert.equal(f.targets.length,prior,'gaze cannot interrupt the complete camera hold');
 delete f.node.dataset.petCloseup;f.advance();
 await f.send('pointerdown',f.event(14,350,130));await f.send('pointermove',f.event(14,320,160));await f.send('pointercancel',f.event(14,320,160));await f.tick();assert.equal(f.targets.length,prior,'cancelled touches cannot replay a queued look');
 f.changeSpecies();assert.equal(f.styleValues.get('touch-action'),'manipulation','other pets retain their original touch and scrolling behavior');
}
console.log('PASS: actual packed touch handlers follow captured scenery drags beyond the card, retarget smoothly, release/cancel correctly, retain pet anger/affection and short-tap camera behavior, and restore other pets’ touch settings in both cards.');
