// Importar treino por texto (1.12.314). Pedido do Tiago em 24/11/2026: colar a prescrição escrita (texto do ChatGPT) em vez de
// só PDF; criar dias e exercícios a partir das tabelas; poder tirar o "Como fazer" do texto (a galeria já tem o dela);
// Orientações gerais para o aluno ler; cardio do texto vira um card com o tempo exato no fim de cada treino.
// Só cria uma ficha nova para o aluno aberto (como o PDF faz). Não mexe no descanso, cronômetros, alarmes, Firebase nem no
// cadastro do aluno. Usa do app: studentById, workoutStudentId, workoutImportCatalogMatches, workoutImportResolveExercise,
// workoutCatalogItem, workoutCatalogItems, workoutImportNorm, commitWorkoutChange, openDialog, closeDialog, openWorkoutStudent,
// selectWorkoutPlan, showScreen, iso, hesc, toast.
if(window.APTreinoTexto)return;
if(!document.getElementById('workoutPdfImportDialog'))return;
const ID='apTextoDialog',MAX_ORIENT=4000;
let E=null,caixa=null;
const novoId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ex2=(d,i)=>d.letra+':'+i;
const fmtTempo=s=>{const m=Math.floor(s/60),r=s%60;return m&&r?m+' min '+r+' s':m?m+' min':r+' s'};
const faixa=(a,b)=>a===b?fmtTempo(a):fmtTempo(a)+' a '+fmtTempo(b);

function construir(){
 if(document.getElementById(ID))return document.getElementById(ID);
 const d=document.createElement('div');d.id=ID;d.className='dialog';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','apTextoTitulo');
 d.innerHTML='<div class="sheet workout-sheet"><div class="sheet-head"><h3 id="apTextoTitulo">Importar treino por texto</h3><button class="close" type="button" data-ap-texto="fechar" aria-label="Fechar importação por texto">×</button></div><div id="apTextoCorpo" class="workout-import-stage"></div><div id="apTextoRodape" class="workout-import-footer"></div></div>';
 document.body.append(d);
 d.addEventListener('click',ev=>{const b=ev.target.closest('[data-ap-texto]');if(b)acao(b.dataset.apTexto,b,ev)});
 d.addEventListener('input',ev=>entrada(ev.target));
 d.addEventListener('change',ev=>entrada(ev.target));
 return d;
}
function abrir(){
 const aluno=typeof workoutStudentId==='string'?studentById(workoutStudentId):null;
 if(!aluno)return toast('Abra a ficha de um aluno para importar o treino por texto.');
 E={alunoId:aluno.id,texto:'',analise:null,descanso:'max',cardioSeg:0,cardioDias:{},usar:{},cat:{},vinculo:{},orient:'',confirmouNome:false,salvando:false};
 caixa=construir();telaColar();openDialog(ID);
 const area=document.getElementById('apTextoEntrada');if(area)area.focus({preventScroll:true});
}
function fechar(){E=null;closeDialog(ID)}

function telaColar(texto=''){
 document.getElementById('apTextoTitulo').textContent='Importar treino por texto';
 document.getElementById('apTextoCorpo').innerHTML='<p class="workout-import-lead">Cole aqui o texto completo da prescrição. O aplicativo mostra o que reconheceu antes de criar a ficha.</p><label class="field full"><span>Texto da prescrição</span><textarea id="apTextoEntrada" rows="12" spellcheck="false" placeholder="Cole o texto da ficha aqui"></textarea></label><p id="apTextoAviso" class="note" role="status" aria-live="polite"></p>';
 document.getElementById('apTextoEntrada').value=texto;
 document.getElementById('apTextoRodape').innerHTML='<button class="btn ghost" type="button" data-ap-texto="fechar">Cancelar</button><button class="btn primary" type="button" id="apTextoLer" data-ap-texto="ler">Ler o texto</button>';
 atualizarLer();
}
function atualizarLer(){
 const area=document.getElementById('apTextoEntrada'),b=document.getElementById('apTextoLer');if(!area||!b)return;
 b.disabled=area.value.trim().length<30;
}

function analisar(){
 const area=document.getElementById('apTextoEntrada');if(!area)return;
 const texto=area.value,r=Parser.analisar(texto);
 if(!r.ok){
  document.getElementById('apTextoAviso').innerHTML=r.avisos.filter(a=>a.nivel==='erro').map(a=>esc(a.texto)).join('<br>')||'Não reconheci um treino neste texto.';
  return;
 }
 E.texto=texto;E.analise=r;E.cat={};E.usar={};E.vinculo={};E.cardioDias={};E.confirmouNome=false;
 for(const d of r.dias)d.exercicios.forEach((e,i)=>{
  if(e.cardio)return;
  const k=ex2(d,i);E.cat[k]=workoutImportCatalogMatches(e.nome);E.usar[k]=!!e.comoFazer;
 });
 if(r.cardio){E.cardioSeg=r.cardio.duracaoMin;for(const d of r.dias)E.cardioDias[d.letra]=!d.cardioNaTabela&&(!r.cardio.dias||r.cardio.dias.includes(d.letra))}
 E.orient=Parser.formatarOrientacoes(r.orientacoes);
 telaRevisao();
}

function avisoNome(){
 const aluno=studentById(E.alunoId),nome=E.analise.nome;
 if(!aluno||!nome)return '';
 return workoutImportNorm(aluno.name)===workoutImportNorm(nome)?'':'O texto é de “'+nome+'” e a ficha aberta é de “'+aluno.name+'”. Confirme que o texto pertence a este aluno.';
}
function pendencias(){
 const p=[];
 if(avisoNome()&&!E.confirmouNome)p.push('Confirme que o texto é deste aluno.');
 if(E.orient.length>MAX_ORIENT)p.push('As orientações gerais passam de '+MAX_ORIENT+' caracteres. Tire algumas linhas.');
 if(E.analise.cardio&&Object.values(E.cardioDias).some(Boolean)&&!(E.cardioSeg>=1&&E.cardioSeg<=86400))p.push('Informe o tempo do cardio (de 1 segundo a 24 horas).');
 return p;
}
function telaRevisao(){
 const a=E.analise,aluno=studentById(E.alunoId),total=a.dias.reduce((n,d)=>n+d.exercicios.length,0);
 const vinculados=Object.values(E.cat).filter(c=>c.match).length,semVinculo=Object.keys(E.cat).length-vinculados;
 const fichasAtivas=state.workoutPlans.filter(p=>p.studentId===E.alunoId&&!(p.archived===true)).length;
 const nome=avisoNome();
 let h='<div class="workout-import-summary"><div><strong>'+a.dias.length+'</strong><span>treinos</span></div><div><strong>'+total+'</strong><span>exercícios</span></div><div><strong>'+vinculados+'</strong><span>vinculados à galeria</span></div><div><strong>'+a.orientacoes.length+'</strong><span>orientações gerais</span></div></div>';
 h+='<section class="workout-import-section"><header><strong>1. Destino</strong><span>'+esc(aluno?.name||'')+'</span></header><div class="workout-import-section-body"><p class="note">Será criada uma ficha nova para '+esc(aluno?.name||'o aluno')+'. Nada do aluno é alterado.'+(fichasAtivas?' Ele já tem '+fichasAtivas+(fichasAtivas===1?' ficha ativa':' fichas ativas')+': a nova fica ao lado; arquive a antiga se o aluno deve ver só a nova.':'')+'</p>'
  +(nome?'<article class="workout-import-item warn"><div class="title"><strong>Nome diferente</strong><span>CONFIRMAR</span></div><p>'+esc(nome)+'</p><label class="workout-import-check"><input type="checkbox" data-ap-texto="nome"'+(E.confirmouNome?' checked':'')+'><span>Confirmo que o texto é deste aluno.</span></label></article>':'')+'</div></section>';
 // Avisos de leitura
 const av=a.avisos.filter(x=>x.nivel!=='info');
 const rangos=a.dias.flatMap(d=>d.exercicios).filter(e=>e.descansoMax>e.descansoMin).length;
 h+='<section class="workout-import-section"><header><strong>2. Conferência da leitura</strong><span>'+(av.length+(rangos?1:0)?av.length+(rangos?1:0)+' para ver':'sem divergências')+'</span></header><div class="workout-import-section-body">'
  +(av.length?'<div class="workout-import-list">'+av.map(x=>'<article class="workout-import-item '+(x.nivel==='erro'?'error':'warn')+'"><p>'+esc(x.texto)+'</p></article>').join('')+'</div>':'<div class="empty"><strong>Nenhuma divergência.</strong>Confira os treinos abaixo antes de criar.</div>')
  +(rangos?'<label class="field"><span>'+rangos+(rangos===1?' descanso vem':' descansos vêm')+' em faixa (ex.: 45–60 s). O app guarda um valor só. Usar:</span><select data-ap-texto="descanso"><option value="max"'+(E.descanso==='max'?' selected':'')+'>O maior valor (60 s)</option><option value="min"'+(E.descanso==='min'?' selected':'')+'>O menor valor (45 s)</option><option value="media"'+(E.descanso==='media'?' selected':'')+'>O valor do meio</option></select></label>':'')
  +(semVinculo?'<p class="note">'+semVinculo+(semVinculo===1?' exercício não foi':' exercícios não foram')+' encontrado(s) com segurança na galeria. Escolha abaixo ou mantenha sem vínculo.</p>':'')+'</div></section>';
 // Treinos
 const comTexto=a.dias.flatMap(d=>d.exercicios.map((e,i)=>({e,k:ex2(d,i)}))).filter(x=>!x.e.cardio&&x.e.comoFazer);
 h+='<section class="workout-import-section"><header><strong>3. Treinos e exercícios</strong><span>'+a.dias.length+' dias</span></header><div class="workout-import-section-body">'
  +(comTexto.length?'<p class="note">Cada exercício já tem o “Como fazer” da galeria. Se o texto não trouxer nada específico, desmarque: o aluno vê o da galeria.</p><div class="ap-texto-mestre"><button class="btn" type="button" data-ap-texto="manter-todos">Manter todos do texto</button><button class="btn" type="button" data-ap-texto="tirar-todos">Tirar todos do texto</button></div>':'')
  +a.dias.map(d=>'<details class="ap-texto-dia" open><summary><strong>'+esc(d.nome)+'</strong><small>'+d.exercicios.length+(d.exercicios.length===1?' exercício':' exercícios')+(E.analise.cardio&&E.cardioDias[d.letra]?' + cardio':'')+'</small></summary><ol>'
    +d.exercicios.map((e,i)=>linhaExercicio(d,e,i)).join('')
    +(E.analise.cardio&&E.cardioDias[d.letra]?'<li class="ap-texto-cardio-linha"><strong>Cardio · '+esc(E.analise.cardio.modalidade)+'</strong><small>'+esc(fmtTempo(E.cardioSeg||0))+' · no fim do treino</small></li>':'')
    +'</ol></details>').join('')+'</div></section>';
 // Cardio
 const c=a.cardio;
 h+='<section class="workout-import-section"><header><strong>4. Cardio</strong><span>'+(c?'previsto no texto':'não previsto')+'</span></header><div class="workout-import-section-body">';
 if(!c)h+='<div class="empty"><strong>Sem card de cardio.</strong>O texto não prevê cardio, então nenhum foi criado.</div>';
 else{
  const min=Math.floor(E.cardioSeg/60),seg=E.cardioSeg%60;
  h+='<p class="note"><strong>'+esc(c.modalidade)+'</strong> · texto: '+esc(faixa(c.duracaoMin,c.duracaoMax))+'. O card entra depois de todos os exercícios, com o cronômetro neste tempo.</p>'
   +(c.duracaoMax>c.duracaoMin?'<p class="note">O texto dá uma faixa e o cronômetro precisa de um tempo só. Começa no menor; escolha:</p><div class="ap-texto-mestre"><button class="btn" type="button" data-ap-texto="cardio-min">'+esc(fmtTempo(c.duracaoMin))+'</button><button class="btn" type="button" data-ap-texto="cardio-max">'+esc(fmtTempo(c.duracaoMax))+'</button></div>':'')
   +'<div class="workout-import-grid"><label class="field"><span>Minutos</span><input type="number" min="0" max="1440" step="1" inputmode="numeric" data-ap-texto="cardio-m" value="'+min+'"></label><label class="field"><span>Segundos</span><input type="number" min="0" max="59" step="1" inputmode="numeric" data-ap-texto="cardio-s" value="'+seg+'"></label></div>'
   +'<div class="ap-texto-cardio-dias"><span>Colocar o cardio no fim de:</span>'+a.dias.map(d=>'<label><input type="checkbox" data-ap-texto="cardio-dia" data-dia="'+esc(d.letra)+'"'+(E.cardioDias[d.letra]?' checked':'')+(d.cardioNaTabela?' disabled':'')+'><span>Dia '+esc(d.letra)+(d.cardioNaTabela?' (já tem na tabela)':'')+'</span></label>').join('')+'</div>'
   +(c.orientacao?'<p class="note">Orientação do cardio (vai no “Como fazer” do card): '+esc(c.orientacao)+'</p>':'');
 }
 h+='</div></section>';
 // Orientações
 h+='<section class="workout-import-section"><header><strong>5. Orientações gerais</strong><span id="apTextoContagem"></span></header><div class="workout-import-section-body"><p class="note">O aluno lê no botão “Orientações”, na tela dos treinos. Uma por linha; apague as que não quiser.</p><label class="field full"><span>Orientações gerais</span><textarea id="apTextoOrient" rows="9" data-ap-texto="orient">'+esc(E.orient)+'</textarea></label></div></section>';
 h+='<section class="workout-import-section"><header><strong>Fica só com você</strong><span>não vai para o aluno</span></header><div class="workout-import-section-body"><p class="note">'+(a.ignorados.length?esc(a.ignorados.join(' · '))+'.':'Nada.')+' O texto original continua com você; o app não guarda cópia dele.</p></div></section>';
 document.getElementById('apTextoTitulo').textContent='Revisar treino por texto';
 document.getElementById('apTextoCorpo').innerHTML=h;
 rodape();
}
function linhaExercicio(d,e,i){
 const k=ex2(d,i);
 if(e.cardio)return '<li><strong>'+esc(e.nome)+'</strong><small>Cardio · '+esc(faixa(e.duracaoMin,e.duracaoMax))+' · vai para o fim</small></li>';
 const info=E.cat[k],vinc=E.vinculo[k]!==undefined?E.vinculo[k]:info.match?.id||'';
 const rest=e.descansoMin?fmtTempo(e.descansoMin===e.descansoMax?e.descansoMin:Parser.descansoEmSegundos(e,E.descanso)):'sem descanso';
 let s='<li data-ex="'+esc(k)+'"><strong>'+esc(e.nome)+'</strong><small>'+esc([e.series&&e.repeticoes?e.series+' × '+e.repeticoes:e.repeticoes,rest].filter(Boolean).join(' · '))+'</small>';
 if(!vinc)s+='<div class="ap-texto-vinculo">Sem vínculo com a galeria.'+(info.suggestions.length?'<select data-ap-texto="vinculo" data-k="'+esc(k)+'"><option value="">Manter sem vínculo</option>'+info.suggestions.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+(x.muscle?' · '+esc(x.muscle):'')+'</option>').join('')+'</select>':'')+'</div>';
 if(e.comoFazer)s+='<label class="ap-texto-usar"><input type="checkbox" data-ap-texto="usar" data-k="'+esc(k)+'"'+(E.usar[k]?' checked':'')+'><span>Usar o “Como fazer” do texto</span></label><details class="ap-texto-previa"><summary>Ver o texto</summary><p>'+esc(e.comoFazer)+'</p></details>';
 return s+'</li>';
}
function rodape(){
 // Atualiza o rodapé sem trocar os botões: se o campo digitado perde o foco no toque em "Criar ficha", trocar o botão
 // nesse instante faria o primeiro toque se perder.
 const p=pendencias(),r=document.getElementById('apTextoRodape');if(!r)return;
 if(!r.querySelector('#apTextoNota')||!r.querySelector('[data-ap-texto="criar"]'))
  r.innerHTML='<p class="workout-import-action-note" id="apTextoNota" aria-live="polite"></p><button class="btn ghost" type="button" data-ap-texto="voltar">Voltar ao texto</button><button class="btn primary" type="button" data-ap-texto="criar">Criar ficha</button>';
 r.querySelector('#apTextoNota').textContent=E.salvando?'Criando a ficha…':p[0]||'Tudo pronto para criar a ficha.';
 r.querySelector('[data-ap-texto="criar"]').disabled=!!(p.length||E.salvando);
 const c=document.getElementById('apTextoContagem');if(c)c.textContent=E.orient.length+' / '+MAX_ORIENT;
}

function entrada(el){
 if(!E&&!document.getElementById('apTextoEntrada'))return;
 const a=el.dataset?.apTexto;
 if(el.id==='apTextoEntrada'){atualizarLer();return}
 if(!E||!E.analise)return;
 if(a==='orient'){E.orient=el.value;rodape();return}
 if(a==='cardio-m'||a==='cardio-s'){
  const m=Number(document.querySelector('[data-ap-texto="cardio-m"]').value||0),s=Number(document.querySelector('[data-ap-texto="cardio-s"]').value||0);
  E.cardioSeg=Number.isInteger(m)&&Number.isInteger(s)&&m>=0&&s>=0&&s<=59?m*60+s:0;rodape();return;
 }
 if(a==='usar'){E.usar[el.dataset.k]=el.checked;return}
 if(a==='nome'){E.confirmouNome=el.checked;rodape();return}
 if(a==='cardio-dia'){E.cardioDias[el.dataset.dia]=el.checked;return}
 if(a==='vinculo'){E.vinculo[el.dataset.k]=el.value;telaRevisao();return}
 if(a==='descanso'){E.descanso=el.value;telaRevisao();return}
}
function acao(a,botao){
 if(a==='fechar')return fechar();
 if(a==='ler')return analisar();
 if(!E)return;
 if(a==='voltar'){telaColar(E.texto);return}
 if(a==='manter-todos'||a==='tirar-todos'){for(const k of Object.keys(E.usar)){const [l,i]=k.split(':'),d=E.analise.dias.find(x=>x.letra===l);E.usar[k]=a==='manter-todos'&&!!d.exercicios[Number(i)].comoFazer}telaRevisao();return}
 if(a==='cardio-min'||a==='cardio-max'){E.cardioSeg=a==='cardio-min'?E.analise.cardio.duracaoMin:E.analise.cardio.duracaoMax;telaRevisao();return}
 if(a==='criar')return criar();
}

// ---- criação da ficha ----
function catalogoCardio(modalidade){
 const k=workoutImportNorm(modalidade);
 const nome=/(esteira|caminhada|corrida)/.test(k)?'esteira':/(bicicleta|bike|ciclo)/.test(k)?'bicicleta ergometrica':'';
 if(!nome)return null;
 return workoutCatalogItems().find(x=>workoutImportNorm(x.name)===nome&&x.category==='Cardio')||null;
}
function cartaoCardio(modalidade,segundos,orientacao){
 const cat=catalogoCardio(modalidade);
 const base={importId:novoId(),name:modalidade==='Cardio'?'Cardio':'Cardio · '+modalidade,sourceInstructionName:'',sourceNotes:orientacao||'',sourceObservations:'',structuralWarnings:[],ambiguous:false,sets:'1',reps:segundos+' s',load:'',rest:''};
 const r=workoutImportResolveExercise(base,cat);
 return montar({...r,category:'Cardio',durationSeconds:segundos,sets:'1',reps:segundos+' s',load:'',rest:''});
}
function montar(r){
 const o={id:novoId(),name:r.name,muscle:r.muscle||'',category:r.category||'Musculação',sets:r.sets||'',reps:r.reps||'',load:r.load||'',rest:r.rest||'',video:r.video||'',notes:r.notes||'',observations:r.observations||'',catalogId:r.catalogId||'',sourceInstructionName:'',importWarnings:[...(r.warnings||[])],importNotices:(r.notices||[]).map(t=>t.replace(/do PDF/g,'do texto').replace(/no PDF/g,'no texto')),instructionName:r.instructionName||r.name,catalogName:r.catalogName||'',instructionResolution:r.instructionResolution||'source',guidanceVersion:1,guidanceResolvedFromCatalog:!!r.guidanceResolvedFromCatalog,notesOrigin:(r.notesOrigin==='pdf'?'text':r.notesOrigin)||'missing',observationsOrigin:(r.observationsOrigin==='pdf'?'text':r.observationsOrigin)||'missing',sourceNotes:r.sourceNotes||'',sourceObservations:r.sourceObservations||'',sourceDocumentId:''};
 if(r.durationSeconds)o.durationSeconds=r.durationSeconds;
 return o;
}
function criar(){
 if(!E||E.salvando||pendencias().length)return;
 const aluno=studentById(E.alunoId);if(!aluno)return toast('O aluno não existe mais.');
 E.salvando=true;rodape();
 try{
  const a=E.analise,agora=new Date().toISOString();
  const dias=a.dias.map((d,di)=>{
   const lista=[];let cardioTabela=null;
   d.exercicios.forEach((e,i)=>{
    if(e.cardio){cardioTabela=cartaoCardio(e.nome,e.duracaoMin,e.comoFazer);return}
    const k=ex2(d,i),info=E.cat[k],vinc=E.vinculo[k]!==undefined?E.vinculo[k]:info.match?.id||'';
    const catalogo=vinc?workoutCatalogItem(vinc):null,seg=Parser.descansoEmSegundos(e,E.descanso);
    const base={importId:novoId(),name:e.nome,sourceInstructionName:'',sourceNotes:E.usar[k]&&e.comoFazer?e.comoFazer:'',sourceObservations:'',structuralWarnings:e.series?[]:['Séries não reconhecidas no texto. Confira antes de treinar.'],ambiguous:!catalogo&&info.ambiguous,sets:e.series,reps:e.repeticoes,load:e.carga||'',rest:seg?seg+' s':''};
    lista.push(montar(workoutImportResolveExercise(base,catalogo)));
   });
   if(cardioTabela)lista.push(cardioTabela);
   else if(a.cardio&&E.cardioDias[d.letra])lista.push(cartaoCardio(a.cardio.modalidade,E.cardioSeg,a.cardio.orientacao));
   return {id:novoId(),name:d.nome,weekday:(di+1)%7,notes:'',sourceDocumentId:'',exercises:lista};
  });
  const meta=Parser.objetivoCurto(a.perfil.objetivo);
  const plano={id:novoId(),studentId:aluno.id,name:meta?'Treino por texto · '+meta:'Treino por texto',goal:meta,level:Parser.nivelCurto(a.perfil.nivel),startDate:iso(new Date()),endDate:'',autoArchive:false,visibility:'always',age:'',sex:'',weight:'',height:'',currentLevel:'',organization:'sequence',notes:E.orient.trim(),archived:false,sourceDocumentId:'',sourceFileName:'',sourceKind:'text',createdAt:agora,updatedAt:agora,days:dias};
  const total=dias.reduce((n,d)=>n+d.exercises.length,0);
  if(!commitWorkoutChange({workoutPlans:[...state.workoutPlans,plano]},'Treino importado de texto · '+aluno.name+' · '+plano.name)){E.salvando=false;rodape();return}
  fechar();showScreen('workouts');openWorkoutStudent(aluno.id);selectWorkoutPlan(plano.id);
  toast('Ficha criada: '+dias.length+' treinos e '+total+' exercícios.',5200);
 }catch(erro){console.error(erro);if(E){E.salvando=false;rodape()}toast(erro?.message||'Não foi possível criar a ficha.',6500)}
}

window.APTreinoTexto=Object.freeze({abrir,fechar});
