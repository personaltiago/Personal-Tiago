const stage=document.getElementById('stage'),status=document.getElementById('status'),samples=document.getElementById('samples');
const colors=['original','white','black','brown','cream','cinnamon'];
const ageList=[['baby',0,'Filhote'],['teen',600,'Adolescente'],['adult',1800,'Adulto']];
const modelFor=(xp,pose,color)=>APMascotModel.read({schema:1,species:'panda',name:'Urso',xp,colors:{panda:color},poses:{panda:pose},owned:APMascotModel.catalog.filter(x=>x.kind==='pose').map(x=>x.id)});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function edgeMask(eye,x,y){
 const area=eye.outline.reduce((s,a,i)=>{const b=eye.outline[(i+1)%eye.outline.length];return s+a[0]*b[1]-a[1]*b[0]},0),sign=area<0?-1:1;
 return Math.min(...eye.outline.map((a,i)=>{const b=eye.outline[(i+1)%eye.outline.length],dx=b[0]-a[0],dy=b[1]-a[1];return sign*(dx*(y-a[1])-dy*(x-a[0]))/Math.hypot(dx,dy)}));
}
function sample(data,width,height,x,y){
 x=clamp(x,0,width-1);y=clamp(y,0,height-1);const xx=Math.floor(x),yy=Math.floor(y),fx=x-xx,fy=y-yy;
 return [0,1,2,3].map(c=>{const at=(x,y)=>data[4*(y*width+x)+c];return(1-fy)*((1-fx)*at(xx,yy)+fx*at(Math.min(width-1,xx+1),yy))+fy*((1-fx)*at(xx,Math.min(height-1,yy+1))+fx*at(Math.min(width-1,xx+1),Math.min(height-1,yy+1)))});
}
function measuredEyes(canvas,actor,eyes){
 const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;const ctx=copy.getContext('2d',{willReadFrequently:true});ctx.drawImage(canvas,0,0);const data=ctx.getImageData(0,0,copy.width,copy.height).data;
 const points=eyes.map(eye=>{
  let weight=0,sx=0,sy=0,count=0;
  const xs=eye.outline.map(p=>p[0]),ys=eye.outline.map(p=>p[1]);
  for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++)for(let x=Math.floor(Math.min(...xs));x<=Math.ceil(Math.max(...xs));x++){
   if(edgeMask(eye,x+.5,y+.5)<.8)continue;
   // Project each neutral coordinate into the rendered face before sampling.
   // A turning head alone cannot pass this pupil-motion check.
   const p=actor.project(x+.5,y+.5),rgb=sample(data,copy.width,copy.height,p[0]*copy.width/320-.5,p[1]*copy.height/320-.5);
   const lum=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2],w=Math.max(0,160-lum)*(rgb[3]/255);
   sx+=(x+.5)*w;sy+=(y+.5)*w;weight+=w;count++;
  }
  return{x:sx/weight,y:sy/weight,weight,count};
 });
 return{points,copy};
}
function crop(source,profile,label,color){
 const section=document.createElement('section'),h=document.createElement('h2'),c=document.createElement('canvas');h.textContent=color+' · '+label;section.append(h,c);c.width=c.height=240;
 const [x,y,rx,ry]=profile.head,r=Math.max(rx,ry)*1.1;c.getContext('2d').drawImage(source,(x-r)*source.width/320,(y-r)*source.height/320,2*r*source.width/320,2*r*source.height/320,0,0,240,240);return section;
}
async function frame(model,x,y){
 stage.innerHTML=APMascotArt.render(model);const image=stage.querySelector('image'),profile=APMascotBearPoses.profile(model),point={x:(profile.head[0]+110*x)/320,y:(profile.head[1]+100*y)/320};
 const actor=await APMascotBearPoses.start(image,model,'look',point,false,false);if(!actor)throw Error('Motor indisponível');
 actor.draw(700);const canvas=actor.canvas||actor.root.querySelector('canvas'),value=measuredEyes(canvas,actor,APBearSkin.attentionEyes(model)),renderer=actor.root?.dataset.petRenderer;
 actor.dispose();return{...value,renderer};
}
async function reducedTargets(model){
 stage.innerHTML=APMascotArt.render(model);const image=stage.querySelector('image'),profile=APMascotBearPoses.profile(model),point=(x,y)=>({x:(profile.head[0]+110*x)/320,y:(profile.head[1]+100*y)/320}),eyes=APBearSkin.attentionEyes(model);
 const actor=await APMascotBearPoses.start(image,model,'look',point(-1,0),true,false);if(!actor)throw Error('Motor reduzido indisponível');
 const read=()=>measuredEyes(actor.canvas||actor.root.querySelector('canvas'),actor,eyes).points;
 const left=read();actor.retarget(point(1,0));const right=read();actor.retarget(point(0,-1));const up=read();actor.retarget(point(0,1));const down=read();actor.dispose();
 return left.map((p,i)=>({dx:right[i].x-p.x,dy:down[i].y-up[i].y}));
}
async function measure(){
 document.getElementById('measure').disabled=true;document.getElementById('record').disabled=true;samples.replaceChildren();const rows=[],leftSamples=[],rightSamples=[];
 for(const [age,xp] of ageList)for(const pose of ['default','sit','rest']){
  if(age==='baby'&&pose==='rest')continue;
  for(const color of colors){
   const model=modelFor(xp,pose,color),profile=APMascotBearPoses.profile(model),left=await frame(model,-1,0),right=await frame(model,1,0),up=await frame(model,0,-1),down=await frame(model,0,1);
   const eyes=left.points.map((p,i)=>({dx:right.points[i].x-p.x,dy:down.points[i].y-up.points[i].y}));
   const reduced=await reducedTargets(model),pass=eyes.every(p=>p.dx>.45&&p.dy>.35)&&reduced.every(p=>p.dx>.45&&p.dy>.35);rows.push({age,pose,color,eyes,reduced,pass,renderer:left.renderer});
   if(age==='teen'&&pose==='default'){leftSamples.push(crop(left.copy,profile,'Esquerda',APMascotModel.color(model).name));rightSamples.push(crop(right.copy,profile,'Direita',APMascotModel.color(model).name))}
   status.textContent=rows.length+'/48 combinações · '+age+' · '+pose+' · '+color;
   await new Promise(requestAnimationFrame);
  }
 }
 samples.append(...leftSamples,...rightSamples);const failed=rows.filter(r=>!r.pass),summary={version:'1.12.'+version,combinations:rows.length,passed:rows.length-failed.length,failed:failed.length,minHorizontal:Math.min(...rows.flatMap(r=>r.eyes.map(e=>e.dx))),minVertical:Math.min(...rows.flatMap(r=>r.eyes.map(e=>e.dy))),minReducedHorizontal:Math.min(...rows.flatMap(r=>r.reduced.map(e=>e.dx))),minReducedVertical:Math.min(...rows.flatMap(r=>r.reduced.map(e=>e.dy))),renderers:[...new Set(rows.map(r=>r.renderer))]};
 document.getElementById('summary').textContent=JSON.stringify(summary,null,2);document.getElementById('results').textContent=JSON.stringify({summary,rows},null,2);status.textContent=failed.length?'FALHA REPRODUZIDA · '+failed.length+' combinações sem acompanhamento completo das pupilas.':'PASSOU · as pupilas se movem nas quatro direções em todas as 48 combinações.';
 document.getElementById('measure').disabled=false;document.getElementById('record').disabled=false;
}
async function record(){
 document.getElementById('record').disabled=true;document.getElementById('measure').disabled=true;const c=document.getElementById('recordCanvas');c.hidden=false;const ctx=c.getContext('2d'),chunks=[],recorder=new MediaRecorder(c.captureStream(20),{mimeType:'video/webm;codecs=vp9'}),film=document.getElementById('filmStage');
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.start();
 for(const [age,xp,label] of ageList){
  film.replaceChildren();const entries=[];
  for(const color of colors){
   const model=modelFor(xp,age==='adult'?'sit':'default',color),card=document.createElement('div');card.className='test-card ap-habitat';card.innerHTML='<button class="ap-habitat-open"><span class="ap-mascot-mini">'+APMascotArt.render(model)+'</span></button>';film.append(card);APMascotPetting.bind(card,()=>model,()=>true);
   const profile=APMascotBearPoses.profile(model);await APMascotPetting.respond(card,model,'look',{x:profile.head[0]/320,y:profile.head[1]/320});entries.push({card,model,profile});
  }
  status.textContent='Gravando '+label.toLowerCase()+' · seis cores';
  await new Promise(resolve=>{
   const began=performance.now();let last=0;
   const paint=now=>{
    const elapsed=(now-began)/1000,x=.95*Math.sin(elapsed*Math.PI*.75),y=.8*Math.cos(elapsed*Math.PI*.75);
    if(now-last>50){
     last=now;ctx.fillStyle='#151a20';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#fff';ctx.font='bold 25px Arial';ctx.fillText('Olhos acompanhando o movimento · '+label,24,38);ctx.font='18px Arial';ctx.fillStyle='#b7d9ef';ctx.fillText('Seis cores · motor e imagens reais do aplicativo',24,65);ctx.fillStyle='#5fd5ff';ctx.beginPath();ctx.arc(870+x*120,45+y*18,8,0,Math.PI*2);ctx.fill();
     entries.forEach(({card,model,profile},i)=>{
      const image=card.querySelector('image[data-mascot-photo]'),matrix=image.getScreenCTM(),target=new DOMPoint(profile.head[0]+110*x,profile.head[1]+100*y).matrixTransform(matrix);APBearFieldGaze.follow(card,()=>model,()=>true,target.x,target.y);
      const actor=APMascotBear.get(card)||APMascotBearPoseAttention.get(image)||APMascotBearPoses.get(image),canvas=actor?.canvas||actor?.root?.querySelector('canvas');if(!canvas)return;
      const col=i%3,row=Math.floor(i/3),left=col*352,top=94+row*340,r=Math.max(profile.head[2],profile.head[3])*1.08;ctx.fillStyle='#27343b';ctx.fillRect(left+8,top,336,326);ctx.drawImage(canvas,(profile.head[0]-r)*canvas.width/320,(profile.head[1]-r)*canvas.height/320,2*r*canvas.width/320,2*r*canvas.height/320,left+20,top+12,312,282);ctx.fillStyle='#fff';ctx.font='18px Arial';ctx.fillText(APMascotModel.color(model).name,left+20,top+313);
     });
    }
    if(elapsed<4.6)requestAnimationFrame(paint);else resolve();
   };requestAnimationFrame(paint);
  });
  entries.forEach(({card})=>APMascotPetting.cancel(card));
 }
 const done=new Promise(resolve=>recorder.onstop=resolve);recorder.stop();await done;film.replaceChildren();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));a.download='ursos-olhar-1.12.'+version+'.webm';a.textContent='Baixar vídeo do movimento';a.style.cssText='display:block;margin:16px;color:#b7f9a9';document.getElementById('download').replaceChildren(a);status.textContent='Gravação concluída · três idades e seis cores';document.getElementById('record').disabled=false;document.getElementById('measure').disabled=false;
}
window.BearPixelQA={measuredEyes};
if(document.getElementById('measure')){
 APMascotArt.load().then(ok=>{if(!ok)throw Error('Imagens indisponíveis');return measure()}).catch(e=>status.textContent='Erro: '+e.message);
 document.getElementById('measure').onclick=()=>measure().catch(e=>status.textContent='Erro: '+e.message);document.getElementById('record').onclick=()=>record().catch(e=>status.textContent='Erro: '+e.message);
}
