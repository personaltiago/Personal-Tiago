// Orientações do treino para o aluno (1.12.314). Pedido do Tiago em 24/11/2026: na tela dos treinos do aluno aparece
// "Orientações"; a pessoa toca e lê. Mostra as Orientações gerais da ficha (plan.notes) e as orientações de cada treino
// (day.notes) que o professor escreveu. Só lê a ficha que o aluno já recebe (area.plans); não muda treino, descanso,
// cronômetro, alarme nem registro de execução.
if(window.APOrientacoesAluno)return;
if(!document.getElementById('workoutsScreen')||document.getElementById('screen-more'))return;
const ID='apOrientDialog',BOTAO='apOrientBtn';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SETA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
const ICONE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
let dialogo=null;
function itens(texto){
 const linhas=String(texto||'').split('\n').map(x=>x.trim()).filter(Boolean);
 let h='',aberto=false;
 for(const l of linhas){
  const m=l.match(/^(?:[•·*-])\s+(.*)$/);
  if(m){if(!aberto){h+='<ul>';aberto=true}h+='<li>'+esc(m[1])+'</li>'}
  else{if(aberto){h+='</ul>';aberto=false}h+='<p>'+esc(l)+'</p>'}
 }
 return h+(aberto?'</ul>':'');
}
function planos(){
 const c=window.__AP_STUDENT_CONTEXT;
 if(!c||c.role!=='student'||!c.area||c.area.enabled===false||!Array.isArray(c.area.plans))return [];
 return c.area.plans.map(p=>({nome:p.name||'',geral:String(p.notes||'').trim(),dias:(p.days||[]).filter(d=>String(d.notes||'').trim()).map(d=>({nome:d.name||'',texto:String(d.notes).trim()}))})).filter(p=>p.geral||p.dias.length);
}
function conteudo(lista){
 return lista.map(p=>(lista.length>1&&p.nome?'<h3>'+esc(p.nome)+'</h3>':'')
  +(p.geral?'<section><h4>Orientações gerais</h4>'+itens(p.geral)+'</section>':'')
  +p.dias.map(d=>'<section><h4>'+esc(d.nome||'Treino')+'</h4>'+itens(d.texto)+'</section>').join('')).join('');
}
function tema(d){
 const tela=document.getElementById('workoutsScreen'),claro=!!tela?.classList.contains('ws-light');
 let cor='';try{cor=getComputedStyle(tela).getPropertyValue('--ws-accent').trim()}catch(e){}
 const v=claro?{bg:'#ffffff',txt:'#1b2a38',mut:'#586777',line:'#cad6df'}:{bg:'#0c1a26',txt:'#f5f6fa',mut:'#b8c2d1',line:'#2c3947'};
 for(const k in v)d.style.setProperty('--ori-'+k,v[k]);
 d.style.setProperty('--ori-ac',/^#[0-9a-f]{3,8}$/i.test(cor)?cor:'#f52283');
}
function fechar(){const d=dialogo;dialogo=null;if(d){try{d.close()}catch(e){}d.remove()}}
function abrir(){
 const lista=planos();if(!lista.length)return;
 fechar();
 const d=document.createElement('dialog');d.id=ID;d.className='ap-orient';d.setAttribute('aria-labelledby','apOrientTitulo');
 d.innerHTML='<header><h2 id="apOrientTitulo" tabindex="-1">Orientações</h2><button type="button" data-ori-fechar aria-label="Fechar orientações">×</button></header><div class="ap-orient-corpo">'+conteudo(lista)+'</div><button type="button" class="ap-orient-ok" data-ori-fechar>Fechar</button>';
 tema(d);
 for(const b of d.querySelectorAll('[data-ori-fechar]'))b.onclick=fechar;
 d.addEventListener('cancel',e=>{e.preventDefault();fechar()});
 // O app volta de tela com Esc (agendaBack); com a leitura aberta, Esc só fecha a leitura.
 d.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();fechar()}});
 document.body.append(d);dialogo=d;
 try{d.showModal()}catch(e){d.setAttribute('open','')}
 d.querySelector('h2').focus({preventScroll:true});
}
function pintar(){
 const topo=document.querySelector('#wsListContent .ws-header');if(!topo)return;
 const lista=planos();let b=document.getElementById(BOTAO);
 if(!lista.length){if(b)b.hidden=true;return}
 if(!b){
  b=document.createElement('button');b.id=BOTAO;b.type='button';b.className='ap-orient-botao';b.setAttribute('aria-haspopup','dialog');
  b.innerHTML='<span class="ap-orient-ic">'+ICONE+'</span><span class="ap-orient-tx"><strong>Orientações</strong><small>Leia antes de treinar</small></span><span class="ap-orient-seta">'+SETA+'</span>';
  b.onclick=abrir;topo.insertAdjacentElement('afterend',b);
 }
 b.hidden=false;
}
window.APOrientacoesAluno=Object.freeze({abrir,fechar,pintar});
if(typeof renderWorkouts==='function'){const original=renderWorkouts;renderWorkouts=function(...a){const r=original.apply(this,a);try{pintar()}catch(e){}return r}}
addEventListener('ap-student-ready',()=>{try{pintar()}catch(e){}});
addEventListener('ap-account-changed',()=>{fechar();try{pintar()}catch(e){}});
addEventListener('pagehide',fechar);
try{pintar()}catch(e){}
