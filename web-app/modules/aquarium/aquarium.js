(function(host){
  'use strict';
  const Media=host.APFishMedia,actors=new Set(),byNode=new WeakMap(),imageCache=new Map(),styled=new WeakSet();
  const SCENES=['aq-jardim','aq-ruinas','aq-cristais','aq-cachoeira','aq-naufragio'];
  const tankIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18v15H3zM3 8c3-2 6 2 9 0s6 2 9 0M7 17l2-3-2-2-2 2 2 3zm2-3h4m5 6v-7m-2 3 2-1 2-2"/></svg>';
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let frameId=0,last=0,serial=0;
  const phase=s=>host.APMascotModel?.phase(s?.xp||0)?.id||((s?.xp||0)>=1800?'adult':(s?.xp||0)>=600?'teen':'baby');
  const color=s=>host.APMascotModel?.color(s)?.id||s?.colors?.fish||'original';
  const home=s=>SCENES.includes(s?.aquariumHome)?s.aquariumHome:SCENES.includes(s?.equipped?.home)?s.equipped.home:'aq-jardim';
  const asset=s=>Media.asset('fish-'+color(s)+'-'+phase(s));
  const portrait=s=>asset(s)?.uri||host.__AP_AQUARIUM_THUMBNAILS__?.[phase(s)]?.uri||'';
  const scene=id=>Media.asset(id)?.uri||'';
  const background=s=>{const uri=scene(home(s));return uri?'url("'+uri+'")':'linear-gradient(165deg,#0a4951,#07303c 48%,#071a25)'};
  function render(s){return'<svg viewBox="0 0 320 320" role="img" aria-label="'+escape((s?.name||'Betta')+', peixe Betta, '+phase(s))+'" data-mascot-species="fish" data-mascot-phase="'+phase(s)+'" data-mascot-color="'+escape(color(s))+'" data-mascot-pose="default">'+(portrait(s)?'<image width="320" height="320" href="'+portrait(s)+'" preserveAspectRatio="xMidYMid meet"/>':'<text x="160" y="165" text-anchor="middle" fill="currentColor" font-size="18">Peixe Betta</text>')+'</svg>'}
  function style(doc){if(styled.has(doc))return;const el=doc.createElement('style');el.textContent=`
    .ap-aquarium{position:relative;isolation:isolate;overflow:hidden;-webkit-tap-highlight-color:transparent;background-color:#072c37!important;min-height:280px;--pet-scene-height:clamp(300px,64vw,470px)}
    .ap-aquarium:active,.ap-aquarium .ap-habitat-open:active{filter:none!important;animation:none!important}
    .ap-aquarium-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
    .ap-aquarium .ap-habitat-open{position:relative;z-index:2;min-height:280px;height:100%;width:100%;background:transparent!important;box-shadow:none!important;filter:none!important;-webkit-tap-highlight-color:transparent;touch-action:pan-y}
    .ap-aquarium .ap-mascot-mini,.ap-aquarium .ap-teacher-mascot-mark,.ap-aquarium #apMascotArt{visibility:hidden;pointer-events:none}
    .ap-aquarium .ap-mascot-speech{position:absolute!important;top:42px!important;left:16px!important;right:16px!important;max-width:calc(100% - 32px)!important;width:auto!important}
    .ap-aquarium .ap-mascot-speech-tail{display:none!important}
    .ap-aquarium .ap-habitat-house{z-index:6}
    .ap-aquarium-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
    .ap-aquarium-hud{position:absolute;inset:0;z-index:7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;background:linear-gradient(155deg,rgba(4,24,33,.90),rgba(4,42,49,.85));color:#f1f5f2}
    .ap-aquarium-hud[hidden]{display:none}.ap-aquarium-hud p{font-size:15px;line-height:1.5;margin:0;max-width:390px}.ap-aquarium-hud strong{font-size:20px}
    .ap-aquarium-hud div,.ap-aquarium-media-controls div{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
    .ap-aquarium-hud button,.ap-aquarium-media-controls button{border:1px solid #60736c;border-radius:12px;color:inherit;background:#183c3d;font:inherit;padding:12px 16px;cursor:pointer;min-height:44px}
    .ap-aquarium-hud button:focus-visible,.ap-aquarium-media-controls button:focus-visible{outline:2px solid var(--mascot-accent,#b3e65a);outline-offset:3px}
    .ap-aquarium-hud button:disabled,.ap-aquarium-media-controls button:disabled{opacity:.55;cursor:wait}
    .ap-aquarium-media-controls{border-top:1px solid #53635a66;margin-top:22px;padding-top:18px}.ap-aquarium-media-controls p{line-height:1.5;margin:0 0 12px}
    .ap-aquarium-media-controls div{justify-content:flex-start}.ap-aquarium-media-controls small{display:block;margin-top:10px;line-height:1.5;opacity:.75}
  `;doc.head.append(el);styled.add(doc)}
  function loadImage(record){if(!record)return Promise.reject(Error('Imagem indisponível'));if(imageCache.has(record.id)){const v=imageCache.get(record.id);imageCache.delete(record.id);imageCache.set(record.id,v);return v}const p=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Não foi possível exibir uma imagem do aquário.'));im.src=record.uri});imageCache.set(record.id,p);p.catch(()=>imageCache.delete(record.id));while(imageCache.size>8)imageCache.delete(imageCache.keys().next().value);return p}
  function available(a){const r=a.node.getBoundingClientRect();return !a.doc.hidden&&a.visible&&!a.node.hidden&&a.enabled()&&r.width>0&&r.height>0}
  function requestFrame(){if(!frameId&&[...actors].some(a=>available(a)&&a.images&&(!a.reduced||a.motion.time-a.motion.tapAt<6)))frameId=host.requestAnimationFrame(tick)}
  function tick(at){frameId=0;const dt=last?Math.min(.06,(at-last)/1000):1/30;if(last&&at-last<30){requestFrame();return}last=at;for(const a of actors){if(!a.node.isConnected){release(a.node);continue}if(!available(a)||!a.images)continue;if(a.reduced&&a.motion.time-a.motion.tapAt>=6)continue;a.current=a.motion.step(dt);a.renderer.draw(a.current,a.reduced)}requestFrame()}
  function mediaMessage(){const s=Media.status();return s.state==='ready'&&s.persistent?'Imagens salvas neste aparelho. O aquário funciona sem internet.':s.state==='loading'?'Preparando o aquário…':s.state==='error'?s.error:'Baixe as imagens do aquário uma vez para usar também sem internet.'}
  function actionButton(doc,label,fn){const b=doc.createElement('button');b.type='button';b.textContent=label;b.dataset.aquariumControl='';b.addEventListener('click',event=>{event.stopPropagation();fn()});return b}
  function actions(doc,el){const row=doc.createElement('div'),retry=actionButton(doc,'Baixar aquário',()=>Media.ensure({force:true}).catch(()=>{})),file=actionButton(doc,'Importar imagens',()=>Media.importFile().catch(e=>{for(const a of actors){a.status.textContent=e.message}}));row.append(retry,file);el.append(row);return[retry,file]}
  function updateHud(a){const s=Media.status();a.hud.hidden=Media.ready();a.hudMessage.textContent=mediaMessage();a.buttons.forEach(b=>b.disabled=s.state==='loading');if(s.state==='error')a.status.textContent=s.error}
  function attach(a){if(!a.node.isConnected)return;if(a.renderer.canvas.parentNode!==a.node)a.node.append(a.renderer.canvas);if(a.hud.parentNode!==a.node)a.node.append(a.hud);if(a.status.parentNode!==a.node)a.node.append(a.status);const house=a.node.querySelector('.ap-habitat-house');if(house){house.innerHTML=tankIcon+'<span>Aquário</span>';house.setAttribute('aria-label','Abrir a loja e personalizar o aquário')}const button=a.node.querySelector('.ap-habitat-open');if(button)button.setAttribute('aria-label','Tocar no vidro para chamar '+(a.state.name||'o peixe'));a.renderer.resize();updateHud(a);if(a.images)a.renderer.draw(a.current||a.motion.step(0),a.reduced)}
  async function content(a){
    if(!Media.ready()){if(Media.status().state==='idle')Media.ensure().catch(()=>{});updateHud(a);return}
    const fish=asset(a.state),sc=Media.asset(home(a.state)),tr=Media.asset('fish-'+color(a.state)+'-'+phase(a.state)+'-turn'),key=[fish?.id,sc?.id,tr?.id].join(':');if(a.key===key&&a.images)return;
    const generation=++a.generation;a.key=key;
    try{const [sceneImage,fishImage,turnImage]=await Promise.all([loadImage(sc),loadImage(fish),tr?loadImage(tr):Promise.resolve(null)]);if(a.generation!==generation||byNode.get(a.node)!==a)return;a.images={key,scene:sceneImage,fish:fishImage,turn:turnImage,sceneId:sc.id,rig:fish.rig};a.renderer.setImages(a.images);attach(a);requestFrame()}catch(e){if(a.generation===generation){a.hud.hidden=false;a.hudMessage.textContent=e.message;a.status.textContent=e.message}}
  }
  function tap(node,x=.5,y=.57){const a=byNode.get(node);if(!a||!a.enabled()||!Media.ready())return false;a.motion.tap(x,y);a.status.textContent=(a.state.name||'O peixe')+' está vindo até você.';requestFrame();return true}
  function decorate(node,state){
    if(!node||state?.species!=='fish')return null;let a=byNode.get(node);
    if(!a){const doc=node.ownerDocument,win=doc.defaultView||host;style(doc);const renderer=new host.APAquariumRenderer(node),motion=new host.APAquariumMotion(725+(++serial)*73),hud=doc.createElement('div'),title=doc.createElement('strong'),message=doc.createElement('p'),status=doc.createElement('span');hud.className='ap-aquarium-hud';hud.dataset.aquariumControl='';title.textContent='Seu aquário';hud.append(title,message);status.className='ap-aquarium-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');a={node,doc,win,renderer,motion,hud,hudMessage:message,status,buttons:actions(doc,hud),state,getState:()=>a.state,enabled:()=>true,visible:true,reduced:!!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches,generation:0,key:'',images:null,savedHeight:node.style.getPropertyValue('--pet-scene-height')};
      let pointer=null;const blocked=target=>target.closest?.('.ap-habitat-house,[data-aquarium-control],[data-mascot-action],[data-mascot-tab],input,select,summary');
      a.down=e=>{if(!e.isPrimary||blocked(e.target))return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,at:Date.now()}};
      a.up=e=>{const p=pointer;pointer=null;if(!p||p.id!==e.pointerId||blocked(e.target)||Date.now()-p.at>500||Math.hypot(e.clientX-p.x,e.clientY-p.y)>12)return;const r=node.getBoundingClientRect();tap(node,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)};
      a.cancel=()=>{pointer=null};a.click=e=>{if(e.detail===0&&!blocked(e.target)&&e.target.closest?.('.ap-habitat-open'))tap(node)};
      for(const[n,fn]of[['pointerdown',a.down],['pointerup',a.up],['pointercancel',a.cancel],['click',a.click]])node.addEventListener(n,fn,{passive:true});
      a.resize=()=>{a.renderer.resize();attach(a)};if(win.ResizeObserver){a.ro=new win.ResizeObserver(a.resize);a.ro.observe(node)}
      if(win.IntersectionObserver){a.io=new win.IntersectionObserver(entries=>{a.visible=entries[0]?.isIntersecting!==false;last=0;requestFrame()});a.io.observe(node)}
      a.mediaQuery=win.matchMedia?.('(prefers-reduced-motion: reduce)');a.reducedChange=e=>{a.reduced=e.matches;a.renderer.draw(a.current||a.motion.step(0),a.reduced);last=0;requestFrame()};a.mediaQuery?.addEventListener?.('change',a.reducedChange);
      a.visibility=()=>{last=0;requestFrame()};doc.addEventListener('visibilitychange',a.visibility);byNode.set(node,a);actors.add(a);
    }
    a.state=state;a.motion.setPhase(phase(state));node.classList.add('ap-aquarium');node.dataset.mascotSpecies='fish';node.dataset.mascotHome=home(state);node.dataset.mascotPhase=phase(state);node.dataset.mascotPose='default';node.style.setProperty('--pet-scene-height','clamp(300px,64vw,470px)');node.style.backgroundImage=background(state);attach(a);a.win.requestAnimationFrame(()=>{if(byNode.get(node)===a)attach(a)});content(a);return a;
  }
  function release(node){const a=byNode.get(node);if(!a)return;a.generation++;a.ro?.disconnect();a.io?.disconnect();a.mediaQuery?.removeEventListener?.('change',a.reducedChange);a.doc.removeEventListener('visibilitychange',a.visibility);for(const[n,fn]of[['pointerdown',a.down],['pointerup',a.up],['pointercancel',a.cancel],['click',a.click]])node.removeEventListener(n,fn);a.renderer.dispose();a.hud.remove();a.status.remove();node.classList.remove('ap-aquarium');a.savedHeight?node.style.setProperty('--pet-scene-height',a.savedHeight):node.style.removeProperty('--pet-scene-height');actors.delete(a);byNode.delete(node);if(!actors.size&&frameId){host.cancelAnimationFrame(frameId);frameId=0;last=0}}
  function cancelAll(){for(const a of [...actors])release(a.node)}
  function bind(node,getState,enabled=()=>true){const s=getState();if(s?.species!=='fish')return false;if(!enabled()){release(node);return true}const a=decorate(node,s);a.getState=getState;a.enabled=enabled;return true}
  function wrapGestures(){const previous=host.APMascotPetting;if(!previous||previous.aquarium||!previous.gestures)return;host.APMascotPetting=Object.freeze({...previous,aquarium:true,bind(node,getState,enabled){if(bind(node,getState,enabled))return;release(node);return previous.bind(node,getState,()=>getState()?.species!=='fish'&&(enabled?enabled():true))},react(node,state,...args){if(state?.species==='fish'){decorate(node,state);return tap(node)}return previous.react(node,state,...args)},respond(node,state,...args){if(state?.species==='fish'){decorate(node,state);return tap(node)}return previous.respond?.(node,state,...args)},cancel(node){release(node);return previous.cancel?.(node)},cancelAll(){cancelAll();return previous.cancelAll?.()}})}
  function decorateMenu(state,node,tab){if(state?.species!=='fish'||!node)return;style(node.ownerDocument);if(tab==='shop'){node.innerHTML='<h3 class="ap-mascot-shop-heading">O jeito do seu peixe</h3><p class="ap-mascot-section-note">Seu Betta nada livremente. Toque no vidro para chamá-lo para perto. As cores acompanham as três fases; os cenários são exclusivos dele.</p>'}if(tab!=='shop'&&tab!=='house')return;const box=node.ownerDocument.createElement('div');box.className='ap-aquarium-media-controls';box.dataset.aquariumControl='';const p=node.ownerDocument.createElement('p');p.textContent=mediaMessage();box.append(p);const buttons=actions(node.ownerDocument,box);buttons.forEach(b=>b.disabled=Media.status().state==='loading');const note=node.ownerDocument.createElement('small');note.textContent='A opção Importar imagens aceita o arquivo do aquário. Ela não troca a versão do aplicativo.';box.append(note);node.append(box)}
  host.APAquarium=Object.freeze({asset,portrait,render,scene,background,decorate,release,wrapGestures,decorateMenu,cancelAll,tap,bind,debug:node=>{const a=byNode.get(node);return a?{phase:a.motion.phase,visible:available(a),renderer:a.renderer.gl?'webgl':'canvas',media:Media.status(),frame:a.current&&{...a.current},actors:actors.size}:null}});
  host.addEventListener('ap-account-changed',cancelAll);
  host.addEventListener('ap-aquarium-media',()=>{for(const a of actors){updateHud(a);if(Media.ready())content(a)}if(Media.ready())host.dispatchEvent(new Event('ap-mascot-homes-ready'))});
  try{Media.init(host.__AP_AQUARIUM_CONFIG__).catch(()=>{})}catch{}
})(globalThis);
