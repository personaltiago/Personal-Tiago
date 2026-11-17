const {JSDOM}=require('jsdom');const fs=require('fs');const assert=require('assert');const vm=require('vm');
const path=require('path');const ROOT=path.join(__dirname,'../..');const G2=require(path.join(ROOT,'tools/gerar-grupo-turma-1.12.278.cjs'));
const OLD=path.join(ROOT,'AgendaPersonal-1.12.276-Links-Cadastro-Instalacao-Para-Assinar.agenda.json');
const o=JSON.parse(fs.readFileSync(OLD,'utf8')),p=G2.makeUpdate(o);
const P=p.files['professor.html'],I=p.files['index.html'];
let ok=0,bad=0;const t=(n,f)=>{try{f();ok++;console.log('OK   '+n)}catch(e){bad++;console.log('FALHA '+n+' -> '+e.message)}};
const CODE='AbCdEfGhIjKlMn12';const LINK='https://chat.whatsapp.com/'+CODE;
// 1 normalize
const src=P.slice(P.indexOf('const APGroupLink='),P.indexOf('function makeArea(state,student,helpers={}){'));
const ctx={URL};vm.createContext(ctx);vm.runInContext(src+';this.G=APGroupLink;',ctx);const G=ctx.G;
t('Link válido é aceito e a consulta (?s=…) é descartada',()=>assert.equal(G.normalize(LINK+'?s=cl&p=a&iam=2'),LINK));
for(const bad of ['http://chat.whatsapp.com/'+CODE,'https://chat.whatsapp.com.evil.com/'+CODE,'https://evil.com/chat.whatsapp.com/'+CODE,'https://user:pw@chat.whatsapp.com/'+CODE,'https://chat.whatsapp.com:8443/'+CODE,'https://chat.whatsapp.com/curto','https://chat.whatsapp.com/'+CODE+'/extra','javascript:alert(1)','','   ',null,undefined,'chat.whatsapp.com/'+CODE])
  t('Rejeita: '+String(bad).slice(0,60),()=>assert.equal(G.normalize(bad),''));
// 2 area.trainer
const i0=P.indexOf('area.trainer={');const line=P.slice(i0,P.indexOf('};',i0)+1);
const text=(v,n)=>String(v==null?'':v).slice(0,n);
const mk=trainer=>{const area={};ctx.trainer=trainer;ctx.text=text;ctx.area=area;vm.runInContext(line,ctx);return area.trainer};
t('Sem link: area.trainer idêntico ao anterior (mesmas chaves e ordem, nenhuma ficha muda)',()=>{const a=mk({name:'Tiago',subtitle:'Personal',cref:'1',photoDataUrl:''});assert.deepEqual(Object.keys(a),['name','subtitle','cref','photo']);assert(!('groupLink' in a));
  const before=o.files['professor.html'];const j=before.indexOf('area.trainer={');assert(before.slice(j,before.indexOf('};',j)+1).includes('name:text(trainer.name,120),subtitle:text'))});
t('Com link válido: groupLink normalizado entra no area.trainer',()=>assert.equal(mk({name:'T',groupUrl:LINK+'?x=1'}).groupLink,LINK));
t('Link inválido salvo antes: não entra na ficha',()=>assert(!('groupLink' in mk({name:'T',groupUrl:'https://evil.com/x'}))));
// 3 botão do aluno
const f0=I.indexOf('function y(){const e=window.__AP_STUDENT_CONTEXT,o=e?.area?.trainer;');const fy=I.slice(f0,I.indexOf('removeProfilePhoto=function(){',f0));
function boot(area,{android}={}){
  const dom=new JSDOM('<!doctype html><body><div id="homeScroll"><header></header></div><div id="profileScroll"></div></body>',{runScripts:'outside-only',url:'https://appassets.androidplatform.net/assets/index.html'});
  const w=dom.window;const log={ext:[],open:[]};w.open=(...a)=>{log.open.push(a)};if(android)w.Android={openExternal:u=>log.ext.push(u)};
  w.__AP_STUDENT_CONTEXT={area};w.eval('const t=i=>document.getElementById(i);'+fy.replace(/^function y\(\)/,'window.__y=function()')+'};window.__y();'.replace('};',';'));
  return {w,log,q:s=>w.document.querySelector(s)};
}
const base={enabled:true,trainer:{name:'Tiago Lima',subtitle:'Personal Trainer',cref:'123',photo:''}};
const wrapFix=src=>src;
try{
 let m=boot({...base,trainer:{...base.trainer,groupLink:LINK}},{android:true});
 t('Aluno com link: botão "Grupo da turma" aparece no cartão do profissional',()=>{const b=m.q('#apHomeProfessional .ap-group-button');assert(b);assert.equal(b.textContent,'Grupo da turma');assert.equal(b.type,'button')});
 m.q('#apHomeProfessional .ap-group-button').click();
 t('Android: abre pelo sistema (Android.openExternal) com o link exato, sem window.open',()=>{assert.deepEqual(m.log.ext,[LINK]);assert.equal(m.log.open.length,0)});
 let w2=boot({...base,trainer:{...base.trainer,groupLink:LINK}});w2.q('#apHomeProfessional .ap-group-button').click();
 t('Navegador (iPhone/web): window.open em nova aba com noopener,noreferrer',()=>assert.deepEqual(w2.log.open,[[LINK,'_blank','noopener,noreferrer']]));
 t('Também aparece na tela de perfil',()=>assert(w2.q('#apProfileProfessional .ap-group-button')));
 for(const bad of ['http://chat.whatsapp.com/'+CODE,'https://evil.com/'+CODE,'javascript:alert(1)','https://chat.whatsapp.com/curto','']){
  const x=boot({...base,trainer:{...base.trainer,groupLink:bad}});t('Link inválido na ficha não vira botão: '+bad.slice(0,45),()=>assert.equal(x.q('.ap-group-button'),null))}
 t('Sem link na ficha: nenhum botão e o cartão continua igual',()=>{const x=boot(base);assert.equal(x.q('.ap-group-button'),null);assert(x.q('#apHomeProfessional').textContent.includes('Tiago Lima'))});
 t('Acesso bloqueado (enabled=false): cartão oculto e sem botão',()=>{const x=boot({...base,enabled:false,trainer:{...base.trainer,groupLink:LINK}});assert.equal(x.q('.ap-group-button'),null);assert.equal(x.q('#apHomeProfessional').hidden,true)});
}catch(e){bad++;console.log('FALHA harness aluno -> '+e.message)}
// 4 integridade do pacote
t('Só index.html e professor.html mudaram; versão 1.12.278 / seq 384 / sem assinatura',()=>{for(const k of Object.keys(o.files))if(!['index.html','professor.html'].includes(k))assert.equal(p.files[k],o.files[k],k);assert.notEqual(P,o.files['professor.html']);assert.notEqual(I,o.files['index.html']);assert.equal(p.version,'1.12.278');assert.equal(p.sequence,384);assert(!('agendaSignature' in p))});
t('Nenhum link de convite literal no pacote (o personal digita o link no app)',()=>{for(const [k,v] of Object.entries(p.files))assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}/.test(v),k)});
const undo=(page,edits)=>[...edits].reverse().reduce((cur,[prev,next])=>{assert.equal(cur.split(next).length-1,1,'trecho novo duplicado/ausente');return cur.replace(next,()=>prev)},page);
t('Prova de reversão: desfazendo só as edições previstas, os dois arquivos voltam byte a byte ao 1.12.276',()=>{assert.equal(undo(P,G2.professorEdits),o.files['professor.html']);assert.equal(undo(I,G2.studentEdits),o.files['index.html'])});
t('Texto acrescentado não menciona descanso, alarme, notificação ou cronômetro',()=>{for(const [prev,next] of [...G2.professorEdits,...G2.studentEdits]){const added=next.split(prev).join('');assert(!/(rest\b|restSeconds|alarm|notif|timer|descanso|cron)/i.test(added),added.slice(0,120))}});
console.log(`\nresultado: ${ok} ok, ${bad} falhas`);process.exit(bad?1:0);
