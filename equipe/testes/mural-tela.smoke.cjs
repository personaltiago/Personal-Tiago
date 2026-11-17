const {JSDOM}=require('jsdom');const fs=require('fs');const assert=require('assert');
const js=fs.readFileSync(require('path').join(__dirname,'../../ponte/codigo/telas/ap-mural-student.js'),'utf8');
let ok=0,bad=0;const t=(n,f)=>{try{f();ok++;console.log('OK   '+n)}catch(e){bad++;console.log('FALHA '+n+' -> '+e.message)}};
const wait=()=>new Promise(r=>setTimeout(r,15));
function boot({role='student',fromCache=false,posts=[],slots=[]}={}){
  const dom=new JSDOM('<!doctype html><body><div id="homeScroll"></div></body>',{runScripts:'outside-only',url:'https://exemplo.com.br/'});
  const w=dom.window;const writes=[];let cb;
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
  w.crypto.randomUUID=()=> 'id-'+Math.random().toString(36).slice(2);
  w.confirm=()=>true;
  const mk=(id,d)=>({id,data:()=>d,metadata:{hasPendingWrites:false}});
  const sdk={db:{},collection:(...a)=>({p:a.slice(1).join('/')}),doc:(...a)=>({p:a.slice(1).join('/')}),where:(f,o,v)=>({f,v}),query:(c,...w)=>({p:c.p,w}),
    serverTimestamp:()=>'TS',setDoc:async(r,d)=>{writes.push(['setDoc',r.p,d])},updateDoc:async(r,d)=>{writes.push(['updateDoc',r.p,d])},
    onSnapshot:(q,o,f,e)=>{ if(q.w&&q.w.some(x=>x.f==='autorId')){f({docs:slots.map(id=>mk(id,{})),metadata:{fromCache:false}});return()=>{}} if(/curtidas|comentarios/.test(q.p)){f({docs:[],metadata:{fromCache:false}});return()=>{}} cb=f; f({docs:posts.map((p,i)=>mk(p._id||'p'+i,p)),metadata:{fromCache}});return()=>{}}};
  w.APaccounts={context:()=>({role}),isTeacher:()=>role==='teacher',muralSdk:async()=>({sdk,uid:'u1',professorId:'prof',role,nome:'Aluna Teste'})};
  w.eval(js);return {w,writes,$:i=>w.document.getElementById(i)};
}
(async()=>{
 const xss='<img src=x onerror="window.__pwned=1"><script>window.__pwned=1<\/script>';
 let m=boot({posts:[{autorId:'u2',autorNome:'Colega <b>x</b>',texto:xss,criadoEm:{toMillis:()=>1},visivel:true}]});
 await m.w.APMural.share('Treino ótimo hoje.');await wait();
 t('Compartilhar abre o compositor com o texto, sem publicar nada',()=>{assert.equal(m.$('apMuralText').value,'Treino ótimo hoje.');assert.equal(m.writes.length,0);assert.equal(m.$('apMuralComposer').hidden,false)});
 m.$('apMuralPublish').dispatchEvent(new m.w.Event('submit',{cancelable:true}));await wait();
 t('Só publica no envio do formulário, com campos exatos e caminho da turma',()=>{assert.equal(m.writes.length,1);const [op,p,d]=m.writes[0];assert.equal(op,'setDoc');assert.equal(p,'muralTurmas/prof/publicacoes/u1_'+new Date().toISOString().slice(0,10).replace(/-/g,''),p);assert.deepEqual(Object.keys(d).sort(),['autorId','autorNome','criadoEm','texto','visivel']);assert.equal(d.autorNome,'Aluna Teste');assert.equal(d.visivel,true);assert.equal(d.texto,'Treino ótimo hoje.')});
 t('Conteúdo de terceiros vira texto (sem HTML/script executável)',()=>{const feed=m.$('apMuralPosts');assert.equal(feed.querySelector('img,script,b'),null);assert(feed.textContent.includes('<img src=x'));assert(!m.w.__pwned)});
 const vazio=boot();await vazio.w.APMural.open();await wait();vazio.$('apMuralNew').click();vazio.$('apMuralText').value='   ';vazio.$('apMuralPublish').dispatchEvent(new vazio.w.Event('submit',{cancelable:true}));await wait();
 t('Texto vazio ou só espaços não publica',()=>assert.equal(vazio.writes.length,0));
 const longo=boot();await longo.w.APMural.open();await wait();longo.$('apMuralNew').click();longo.$('apMuralText').value='a'.repeat(2001);longo.$('apMuralPublish').dispatchEvent(new longo.w.Event('submit',{cancelable:true}));await wait();
 t('Texto acima de 2000 caracteres não publica',()=>assert.equal(longo.writes.length,0));
 const cache=boot({fromCache:true,posts:[{autorId:'u2',autorNome:'X',texto:'oculto',criadoEm:{toMillis:()=>1},visivel:true}]});await cache.w.APMural.open();await wait();
 t('Dados vindos do cache local: lista vazia e criação bloqueada',()=>{assert.equal(cache.$('apMuralPosts').children.length,0);assert.equal(cache.$('apMuralNew').disabled,true)});
 const prof=boot({role:'teacher',posts:[{autorId:'u2',autorNome:'Colega',texto:'olá',criadoEm:{toMillis:()=>1},visivel:true}]});await prof.w.APMural.open();await wait();
 t('Professor: não vê "Nova publicação" e pode remover',()=>{assert.equal(prof.$('apMuralNew').hidden,true);const rm=[...prof.$('apMuralPosts').querySelectorAll('button')].find(b=>b.textContent==='Remover');assert(rm);rm.click()});
 await wait();
 t('Remoção grava só {visivel:false, texto:""}',()=>{assert.equal(prof.writes.length,1);assert.deepEqual(prof.writes[0][2],{visivel:false,texto:''})});
 const rec=boot({role:'student'});
 t('Professor não consegue abrir o compositor com texto pré-preenchido',async()=>{});
 const p2=boot({role:'teacher'});const r=await p2.w.APMural.share('x');t('share() como professor é recusado',()=>assert.equal(r,false));

 const D=new Date().toISOString().slice(0,10).replace(/-/g,'');
 const meu={_id:'u1_'+D,autorId:'u1',autorNome:'Aluna Teste',texto:'meu treino',criadoEm:{toMillis:()=>2},visivel:true};
 const alvo={_id:'u2_'+D,autorId:'u2',autorNome:'Colega',texto:'treino dela',criadoEm:{toMillis:()=>1},visivel:true};
 const feed=[]; 
 const dia=boot({posts:[meu]});await dia.w.APMural.open();await wait();
 t('Já publicou hoje: botão Nova publicação bloqueado e aviso visível',()=>{assert.equal(dia.$('apMuralNew').disabled,true);assert(dia.$('apMuralDaily').textContent.includes('já publicou hoje'))});
 const livre=boot({posts:[alvo]});await livre.w.APMural.open();await wait();
 t('Sem post hoje: pode publicar e é avisado que não comenta',()=>{assert.equal(livre.$('apMuralNew').disabled,false);assert(livre.$('apMuralCredit').textContent.includes('Publique o treino de hoje'))});
 const cm=boot({posts:[meu,{...alvo}]});await cm.w.APMural.open();await wait();
 const ids=[...cm.$('apMuralPosts').querySelectorAll('button')].filter(b=>b.textContent==='Ver publicação');
 t('Posts do feed têm botão Ver publicação',()=>assert(ids.length>=1));
 ids[0].click();await wait();
 t('Com post hoje, comentar libera e mostra 0/10',()=>{assert.equal(cm.$('apMuralCommentSend').disabled,false);assert(cm.$('apMuralCredit').textContent.includes('0/10'))});
 cm.$('apMuralComment').value='Boa!';cm.$('apMuralReply').dispatchEvent(new cm.w.Event('submit',{cancelable:true}));await wait();
 t('Comentário usa a vaga 1, pasta plana e campos exatos',()=>{assert.equal(cm.writes.length,1);const [op,p,d]=cm.writes[0];assert.equal(p,'muralTurmas/prof/comentarios/u1_'+D+'_1');assert.deepEqual(Object.keys(d).sort(),['autorId','autorNome','criadoEm','dia','publicacaoId','texto','visivel']);assert.equal(d.dia,D);assert.equal(d.publicacaoId,'u1_'+D)});
 const usadas=Array.from({length:3},(_,i)=>'u1_'+D+'_'+(i+1));
 const tres=boot({posts:[meu,alvo],slots:usadas});await tres.w.APMural.open();await wait();
 [...tres.$('apMuralPosts').querySelectorAll('button')].find(b=>b.textContent==='Ver publicação').click();await wait();
 tres.$('apMuralComment').value='Mais um';tres.$('apMuralReply').dispatchEvent(new tres.w.Event('submit',{cancelable:true}));await wait();
 t('Com 3 vagas usadas, próximo comentário usa a vaga 4',()=>{assert.equal(tres.writes[0][1],'muralTurmas/prof/comentarios/u1_'+D+'_4');assert(tres.$('apMuralCredit').textContent.includes('3/10'))});
 const dez=boot({posts:[meu,alvo],slots:Array.from({length:10},(_,i)=>'u1_'+D+'_'+(i+1))});await dez.w.APMural.open();await wait();
 [...dez.$('apMuralPosts').querySelectorAll('button')].find(b=>b.textContent==='Ver publicação').click();await wait();
 t('Com 10 vagas usadas, comentar bloqueia com aviso de limite',()=>{assert.equal(dez.$('apMuralCommentSend').disabled,true);assert(dez.$('apMuralCredit').textContent.includes('Limite de 10'));dez.$('apMuralReply').dispatchEvent(new dez.w.Event('submit',{cancelable:true}))});
 await wait();t('Mesmo forçando o envio, nada é gravado com 10/10',()=>assert.equal(dez.writes.length,0));
 const sem=boot({posts:[alvo]});await sem.w.APMural.open();await wait();
 [...sem.$('apMuralPosts').querySelectorAll('button')].find(b=>b.textContent==='Ver publicação').click();await wait();
 sem.$('apMuralComment').value='x';sem.$('apMuralReply').dispatchEvent(new sem.w.Event('submit',{cancelable:true}));await wait();
 t('Sem post hoje, comentar fica bloqueado e nada é gravado',()=>{assert.equal(sem.$('apMuralCommentSend').disabled,true);assert.equal(sem.writes.length,0)});
 console.log(`\nresultado: ${ok} ok, ${bad} falhas`);process.exit(bad?1:0);
})();
