const colors=['black','original','white','brown','cream','cinnamon'],ages=[0,600,1800],cards=document.getElementById('cards'),status=document.getElementById('status'),log=document.getElementById('log');
const modelFor=(xp,pose,color)=>APMascotModel.read({schema:1,species:'panda',name:'Urso',xp,colors:{panda:color},poses:{panda:pose},owned:APMascotModel.catalog.filter(x=>x.kind==='pose').map(x=>x.id)});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function show(xp=0,pose='default',color='black'){
  APMascotPetting.cancelAll();APMascotBear.cancelAll();cards.replaceChildren();const model=modelFor(xp,pose,color),card=document.createElement('div');card.className='test-card ap-teacher-mascot ap-habitat';card.innerHTML='<h2>'+color+' · '+APMascotModel.phase(xp).id+' · '+APMascotModel.pose(model).id+'</h2><button class="ap-habitat-open" aria-label="Cenário"><span class="ap-teacher-mascot-mark">'+APMascotArt.render(model)+'</span></button>';cards.append(card);APMascotPetting.bind(card,()=>model,()=>true);
  for(let i=0;i<150&&!APMascotBear.get(card);i++)await delay(40);
  const actor=APMascotBear.get(card);if(!actor)throw Error('Motor não iniciou: '+(card.dataset.bearMotorError||card.querySelector('[data-bear-motor-error]')?.dataset.bearMotorError));
  const events=[];for(const k of ["act","release"]){const original=actor[k];actor[k]=(...args)=>{events.push({method:k,args,at:performance.now()});return original(...args);};}window.current={card,model,actor,events};status.textContent=color+' · '+APMascotModel.phase(xp).id+' · '+APMascotModel.pose(model).id+' · '+(actor.holder.dataset.petRenderer||'R14');return current;
}
function screenPoint(p){const a=current.card.querySelector('image'),m=a.getScreenCTM();return new DOMPoint(p[0],p[1]).matrixTransform(m);}
function eventAt(type,p,opts={}){const at=screenPoint(p),el=current.card.querySelector('.ap-teacher-mascot-mark');el.dispatchEvent(new PointerEvent(type,{bubbles:true,clientX:at.x,clientY:at.y,pointerId:77,pointerType:'touch',button:0,isPrimary:true,...opts}));}
async function tap(p){eventAt('pointerdown',p);await delay(40);eventAt('pointerup',p);}
async function traceGestures(){const {card,actor,model}=current,p=APMascotBearPoses.profile(model),body=[p.head[0],p.head[1]+p.head[3]*.55];const result={initial:actor.action()};current.events.length=0;await tap(body);await delay(430);result.single=actor.action();actor.act('idle');await delay(150);await tap(body);await delay(80);await tap(body);await delay(220);result.double=actor.action();actor.act('idle');await delay(350);eventAt('pointerdown',body);await delay(50);eventAt('pointermove',[body[0]+18,body[1]-3]);await delay(400);result.stroke=actor.action();result.held=actor.state().held;eventAt('pointerup',[body[0]+18,body[1]-3]);await delay(60);result.released=actor.state().held;result.events=current.events;result.rect=card.getBoundingClientRect().toJSON();log.textContent=JSON.stringify(result,null,2);return result;}
async function all(){const rows=[];window.result={running:true,rows};
 for(const xp of ages)for(const pose of ['default','sit','rest']){if(xp===0&&pose==='rest')continue;for(const color of colors){try{const {actor,model,card}=await show(xp,pose,color),profile=APMascotBearPoses.profile(model),rect=card.getBoundingClientRect().toJSON(),row={xp,pose,color,renderer:actor.holder.dataset.petRenderer||'R14',motions:{}};
   actor.act('idle');
   row.fixed=JSON.stringify(rect)===JSON.stringify(card.getBoundingClientRect().toJSON());row.gestures=await traceGestures();row.pass=row.fixed&&row.gestures.single==='curious'&&row.gestures.double==='angry'&&row.gestures.stroke==='affection'&&row.gestures.held===true&&row.gestures.released===false;rows.push(row);
 }catch(e){rows.push({xp,pose,color,pass:false,error:e.message});}status.textContent=rows.length+'/48 · '+rows.filter(x=>x.pass).length+' passaram';log.textContent=JSON.stringify(rows,null,2);}}
 window.result.running=false;window.result.passed=rows.filter(x=>x.pass).length;return result;
}
window.BearQA={show,all,traceGestures,eventAt,tap,screenPoint};
function eyeCentroids(actor,eyes){
 const c=document.createElement('canvas');c.width=actor.canvas.width;c.height=actor.canvas.height;const ctx=c.getContext('2d');ctx.drawImage(actor.canvas,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;
 const sample=(x,y)=>{x=Math.max(0,Math.min(c.width-1,x));y=Math.max(0,Math.min(c.height-1,y));const xx=Math.floor(x),yy=Math.floor(y),fx=x-xx,fy=y-yy;return[0,1,2].map(k=>{const at=(x,y)=>d[4*(y*c.width+x)+k];return(1-fy)*((1-fx)*at(xx,yy)+fx*at(Math.min(c.width-1,xx+1),yy))+fy*((1-fx)*at(xx,Math.min(c.height-1,yy+1))+fx*at(Math.min(c.width-1,xx+1),Math.min(c.height-1,yy+1)));});};
 return eyes.map(eye=>{let weight=0,sx=0,sy=0;const xs=eye.outline.map(p=>p[0]),ys=eye.outline.map(p=>p[1]);for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++)for(let x=Math.floor(Math.min(...xs));x<=Math.ceil(Math.max(...xs));x++){
 let edge=100;eye.outline.forEach((a,i)=>{const b=eye.outline[(i+1)%eye.outline.length];edge=Math.min(edge,((b[0]-a[0])*(y+.5-a[1])-(b[1]-a[1])*(x+.5-a[0]))/Math.hypot(b[0]-a[0],b[1]-a[1]));});if(edge<.8)continue;
 const p=actor.holder.dataset.approvedBear==='R14'?actor.project([(x+.5)*.75,(y+.5)*.75]).map(v=>v*4/3):actor.project(x+.5,y+.5),rgb=sample(p[0]*c.width/320-.5,p[1]*c.height/320-.5),lum=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2],w=Math.max(0,160-lum);sx+=(x+.5)*w;sy+=(y+.5)*w;weight+=w;
 }return{x:sx/weight,y:sy/weight};});
}
async function pixels(){const rows=[];document.getElementById('pixels').disabled=true;
 for(const xp of ages)for(const pose of ['default','sit','rest']){if(xp===0&&pose==='rest')continue;for(const color of colors){try{const {actor,model}=await show(xp,pose,color),image=new Image();image.src=actor.image.getAttribute('href');await image.decode();const eyes=APBearSkin.attentionEyes(model,null,document,image),points=[];
 for(const [x,y]of [[-1,0],[1,0],[0,-1],[0,1]]){actor.act('look',x,-y);let time=actor.state().time??actor.state().age??0;for(let i=0;i<42;i++)actor.draw(time+=.016);points.push(eyeCentroids(actor,eyes));}
 const measured=eyes.map((_,i)=>({dx:points[1][i].x-points[0][i].x,dy:points[3][i].y-points[2][i].y}));rows.push({xp,pose,color,eyes:measured,pass:measured.every(e=>e.dx>.45&&e.dy>.35)});
 }catch(error){rows.push({xp,pose,color,pass:false,error:error.message});}status.textContent=rows.length+'/48 olhos · '+rows.filter(r=>r.pass).length+' passaram';log.textContent=JSON.stringify({test:'pixels',passed:rows.filter(r=>r.pass).length,rows},null,2);}}
 document.getElementById('pixels').disabled=false;return rows;
}
document.getElementById('pixels').onclick=()=>pixels();
document.getElementById('trace').onclick=()=>traceGestures();document.getElementById('show').onclick=()=>show(+document.getElementById('age').value,document.getElementById('pose').value,document.getElementById('color').value).catch(e=>log.textContent=e.stack);document.getElementById('all').onclick=()=>all();
// Hold inspection expressions so screenshots cannot capture the return-to-idle
// instead. The automatic trace still checks real, released gestures.
for(const button of document.querySelectorAll('[data-action]'))button.onclick=()=>{const actor=current.actor;actor.act(button.dataset.action,.65,.25,['affection','angry'].includes(button.dataset.action));};
for(const b of document.querySelectorAll('button'))b.disabled=true;APMascotArt.load().then(ok=>{if(!ok)throw Error('Imagens indisponíveis');return show();}).then(()=>{for(const b of document.querySelectorAll('button'))b.disabled=false;}).catch(e=>{status.textContent='Erro';log.textContent=e.stack;});
