import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
const bundle=JSON.parse(await readFile(process.env.AGENDA_HOSTED_CANDIDATE,'utf8'));
const runtime=JSON.parse(gunzipSync(Buffer.from(bundle.files['cadastro.html'].match(/id="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)<\/script>/)[1],'base64')));
function fixture(native=false){
 let blocks=0,starts=0,mounts=0,retargets=0,resolve;
 const doc={hidden:false,addEventListener(){},createElement:()=>({style:{setProperty(){}},setAttribute(){},remove(){}})};
 const image={isConnected:true},svg={setAttribute(){},dataset:{}};
 const mark={isConnected:true,innerHTML:'original-portrait',querySelector:q=>q==='svg'?svg:image,getBoundingClientRect:()=>({left:0,top:0,width:112,height:112})};
 const status={textContent:''};
 const node={isConnected:true,ownerDocument:doc,dataset:{},querySelector:q=>q.includes('.ap-mascot-mini')?mark:q==='.ap-pet-touch-status'?status:null,querySelectorAll:()=>[],append(){},getBoundingClientRect:()=>({left:0,top:0,width:360,height:260})};
 const model={species:'panda',name:'Bear',xp:native?1800:600,colors:{panda:'brown'},poses:{panda:native?'sit':'default'}};
 const host={document:doc,addEventListener(){},setTimeout:()=>1,clearTimeout(){},matchMedia:()=>({matches:false}),APMascotCloseup:{prepareForGesture:async()=>true,moving:()=>false},APMascotHomes:{decorate(){}},APMascotModel:{phase:xp=>({id:xp>=1800?'adult':'teen'}),pose:m=>({id:m.poses.panda}),color:m=>({id:m.colors.panda})},APMascotArt:{load:async()=>true,scale:()=>1,mirrored:()=>false}};host.window=host;
 vm.runInNewContext(runtime,host);
 host.APBearFieldGaze={begin(){blocks++;let ended=false;return()=>{assert(!ended);ended=true;blocks--}}};
 host.APMascotBear={supports:()=>native,async start(){mounts++;return null},asset:()=>({headX:.5,headTop:0})};
 const actor=()=>({duration:2350,profile:{head:[160,80,50,50]},retarget:()=>{retargets++;return 3000},dispose(){},hold(){},release:()=>550});
 host.APMascotBearPoses={supports:()=>true,start:async()=>{starts++;return await new Promise(yes=>resolve=()=>yes(actor()))}};
 const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
 return{host,node,model,flush,counts:()=>({blocks,starts,mounts,retargets}),finish:()=>resolve(),instant(){host.APMascotBearPoses.start=async()=>{starts++;return actor()}}};
}
for(const kind of ['angry','affection']){
 const f=fixture();const pending=kind==='affection'?f.host.APMascotPetting.react(f.node,f.model,false):f.host.APMascotPetting.respond(f.node,f.model,kind);
 await f.flush();assert.equal(f.counts().starts,1);assert.equal(f.counts().blocks,1,'packed '+kind+' must keep its blocker while the pose/texture promise is pending');
 f.finish();assert.equal(await pending,true);assert.equal(f.counts().blocks,0,'packed '+kind+' releases its blocker only after ready');
}
const f=fixture(true);f.instant();await f.host.APMascotPetting.respond(f.node,f.model,'look',{x:.2,y:.2});for(let i=0;i<20;i++)await f.host.APMascotPetting.respond(f.node,f.model,'look',{x:.2+i/30,y:.2});
assert.equal(f.counts().mounts,1,'a valid fallback must not remount a failed R14 motor on every target update');assert.equal(f.counts().starts,1);assert.equal(f.counts().retargets,20);
console.log('PASS: actual packed anger/affection entrypoints preserve priority across deferred pose/texture initialization; failed native GPU mount is tried once while the existing fallback retargets twenty times.');
