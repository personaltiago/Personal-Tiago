'use strict';

// Gera o pacote 1.12.309 / 415 (sem assinatura) a partir do 1.12.308 / 414 da main (SHA-256 conferido).
// Pedido: Tiago, 23/11/2026 21:36, com print do cartão de feedback e o símbolo TL circulado: "esse ícone … eu acho que ele já é
// fixo … quando eu for para outras pessoas eles têm que ter o próprio ícone deles". Às ~21:45 escolheu, na pergunta do app,
// "Símbolo próprio (Recomendado)": opção na tela Feedback, o app tira o fundo do logo e pinta na cor do tema; sem símbolo, as
// iniciais; vale também no cartão do aluno, e ele autorizou mandar o símbolo (poucos KB) ao Firebase junto com a área do aluno.
//
// Antes: o símbolo do cartão era um desenho fixo (o TL do Tiago) no código, igual para qualquer professor e para os alunos.
// Agora:
//  - ap-feedback-card (o cartão, igual nas duas páginas; a mesma mudança nas duas): aceita symbol (PNG só com a forma, pintado na
//    cor do cartão), symbol 'tl' (o desenho TL de sempre) e initials (selo com as iniciais). Sem essas opções, desenha o TL como
//    antes. Exporta initials(nome).
//  - professor.html, ap-feedback-theme (1.12.308): o embrulho do cartão volta a expor tudo do cartão (lines, symbol e agora
//    initials), e não só create/open/accent.
//  - professor.html, tela Feedback (fora dos blocos): o cartão "Símbolo nos feedbacks" (prévia com o alto do cartão de verdade,
//    Escolher imagem, Salvar, Cancelar, Voltar ao padrão); textos do Mais e da tela citam o símbolo.
//  - professor.html, ap-feedback-symbol-css e ap-feedback-symbol (blocos novos): tiram o fundo da imagem (transparente ou de uma cor
//    só), guardam a forma em state.trainerProfile.feedbackSymbol (PNG de até 40 mil caracteres, que viaja com o perfil), põem o
//    símbolo nos cartões do professor e na área do aluno (area.trainer.symbol, dentro do payload; nunca passa de 620 mil bytes, o
//    limite de envio é 650 mil). Sem símbolo salvo: na conta do Tiago continua o TL ('tl'); nas outras, as iniciais ('').
//  - index.html, ap-feedback-symbol-student (bloco novo): o cartão do aluno usa o símbolo que veio na área; área sem o campo
//    (professor com o app antigo) continua com o TL.
// Não muda: Firestore (regras e coleções; o campo novo vai dentro do payload da área, como o feedbackName do 1.12.302), login,
// alunos, treinos, agenda, financeiro, avaliações, descanso, cronômetros, alarmes, notificações, sons e mascotes.
//
// Uso: node tools/gerar-simbolo-feedback-1.12.309.cjs [pacote-1.12.308.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.309';
const sequence = 415;
const title = 'Símbolo nos feedbacks';
const summary = 'Em Mais → Feedback você escolhe o símbolo dos cartões: o app tira o fundo do seu logo e pinta na cor do tema. Sem símbolo, fica o padrão.';
const notesText = 'Símbolo nos feedbacks.\n\n'
  + 'Em Mais → Feedback há um cartão novo, "Símbolo nos feedbacks". Escolha a imagem do seu logo (PNG, JPG ou WebP, com fundo '
  + 'transparente ou de uma cor só): o app tira o fundo e pinta o símbolo na cor do tema, no alto do cartão de feedback. A prévia '
  + 'mostra o alto do cartão antes de salvar. "Voltar ao padrão" tira o símbolo enviado.\n\n'
  + 'Sem símbolo enviado, a sua conta continua com o símbolo TL. Nas contas de outros professores, o cartão mostra as iniciais do '
  + 'nome, nunca o símbolo de outra pessoa.\n\n'
  + 'Os alunos recebem o símbolo junto com a ficha, na próxima sincronização, e o cartão que eles salvam ou compartilham passa a '
  + 'mostrar o mesmo símbolo. Aluno com o aplicativo antigo continua vendo o TL.\n\n'
  + 'Se o símbolo estiver desligado em Atualizações ("Símbolo nos cartões de feedback"), os cartões continuam mostrando o nome escrito.\n\n'
  + 'O que não muda: o conteúdo dos feedbacks, a cor do tema, o envio e as respostas, treinos, agenda, financeiro, login, mascotes, '
  + 'descanso, cronômetros e alarmes.\n\n'
  + 'Inclui tudo do 1.12.308 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.308-Feedback-Cor-Do-Tema-Para-Assinar.agenda.json';
const SOURCE_SHA256 = 'b077e1f0a38d25fddcbafa5e83522d01859cc1ebffd588fa08d62d7e8c9a366b';
const TARGET_NAME = 'AgendaPersonal-1.12.309-Simbolo-Feedback-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// ---------------------------------------------------------------------------------------------------------------------------------
// ap-feedback-card (o mesmo texto nas duas páginas, antes e depois)
const CARD_HELPERS = String.raw`function apFeedbackInitials(v){const s=String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").normalize("NFC").split(/\s+/).filter(x=>/[\p{L}\p{N}]/u.test(x)&&!/^(da|das|de|do|dos|e)$/i.test(x));if(!s.length)return"";const f=x=>(x.match(/[\p{L}\p{N}]/u)||[""])[0];return(f(s[0])+(s.length>1?f(s[s.length-1]):"")).toLocaleUpperCase("pt-BR")}`
  + String.raw`function apFeedbackSymbolImage(s){return typeof s!=="string"||!/^data:image\/png;base64,/.test(s)||s.length>4e4?Promise.resolve(null):new Promise(o=>{const x=new Image,I=setTimeout(()=>o(null),3e3);x.onload=()=>{clearTimeout(I),o(x.naturalWidth&&x.naturalHeight?x:null)},x.onerror=()=>{clearTimeout(I),o(null)},x.src=s})}`
  // 1.12.309: o símbolo do professor (forma pintada na cor do cartão), 'tl' (o desenho de sempre) ou um selo com as iniciais.
  // Símbolo largo fica mais baixo (altura 54/largura^0,4) para pesar como o TL e não competir com o nome do aluno.
  + String.raw`async function apFeedbackMark(e,p,s,n){if(s===void 0||s==="tl")return k(e,80,148,54,p);const x=await apFeedbackSymbolImage(s);if(x){const r=x.naturalWidth/x.naturalHeight;let H=r>1?54/Math.pow(r,.4):54,W=H*r;W>216&&(W=216,H=216/r);const c=document.createElement("canvas");c.width=Math.max(1,Math.round(2*W)),c.height=Math.max(1,Math.round(2*H));const o=c.getContext("2d");o.imageSmoothingQuality="high",o.drawImage(x,0,0,c.width,c.height),o.globalCompositeOperation="source-in",o.fillStyle=p,o.fillRect(0,0,c.width,c.height),e.save(),e.imageSmoothingQuality="high",e.drawImage(c,80,148+(54-H)/2,W,H),e.restore(),c.width=c.height=0;return}const q=String(n??"").replace(/[^\p{L}\p{N}]/gu,"").slice(0,2).toLocaleUpperCase("pt-BR");q&&(e.save(),e.beginPath(),e.roundRect(80,148,54,54,14),e.fillStyle=p,e.fill(),e.fillStyle="#181c20",e.font="700 "+(q.length>1?24:28)+"px Arial",e.textAlign="center",e.textBaseline="middle",e.fillText(q,107,176),e.restore())}`;
const CARD_CHANGES = [
  ['as funções do símbolo e as opções novas do cartão (symbol, initials)',
    'async function w(t,{photo:f="",accent:i="#b6ff26",professional:a="Agenda Personal",brand:ap302brand=""}={}){',
    CARD_HELPERS + 'async function w(t,{photo:f="",accent:i="#b6ff26",professional:a="Agenda Personal",brand:ap302brand="",symbol:ap309symbol,initials:ap309initials=""}={}){'],
  ['o alto do cartão desenha o símbolo escolhido (sem as opções, o TL de antes)',
    'window.APTeacherFeatures?.enabled("feedbackSymbol")!==!1?k(e,80,148,54,p):(',
    'window.APTeacherFeatures?.enabled("feedbackSymbol")!==!1?await apFeedbackMark(e,p,ap309symbol,ap309initials):('],
  ['o cartão exporta initials(nome)',
    'lines:h,symbol:k})})();',
    'lines:h,symbol:k,initials:apFeedbackInitials})})();'],
];

// ap-feedback-theme (professor.html, 1.12.308): o embrulho volta a expor tudo do cartão.
const THEME_CHANGES = [
  ['o embrulho da cor do tema mantém lines, symbol e initials do cartão',
    'window.APFeedbackCard=Object.freeze({create:(item,options)=>card.create(item,themed(options)),open:(item,options)=>card.open(item,themed(options)),accent});',
    'window.APFeedbackCard=Object.freeze({...card,create:(item,options)=>card.create(item,themed(options)),open:(item,options)=>card.open(item,themed(options)),accent});'],
];

// Fora dos blocos (professor.html): os textos do Mais e da tela Feedback, e o cartão "Símbolo nos feedbacks" na tela.
const PROFESSOR_TEXT_CHANGES = [
  ['o atalho do Mais', '<small>Nome que aparece nos cartões de feedback.</small>', '<small>Nome e símbolo dos cartões de feedback.</small>'],
  ['a descrição da tela Feedback', '<p>O nome que aparece nos cartões de feedback dos seus alunos.</p>', '<p>O nome e o símbolo que aparecem nos cartões de feedback dos seus alunos.</p>'],
];
const SETTINGS_ANCHOR = '<p id="feedbackNameStatus" role="status" aria-live="polite"></p></section>';
const SETTINGS_HTML = '<section id="feedbackSymbolSetting" class="teacher-text-setting feedback-symbol-setting" aria-labelledby="feedbackSymbolTitle">'
  + '<h3 id="feedbackSymbolTitle">Símbolo nos feedbacks</h3>'
  + '<p>Aparece no alto do cartão, na cor do tema. Use o seu logo com fundo transparente ou de uma cor só: o app tira o fundo.</p>'
  + '<div id="feedbackSymbolPreview" class="feedback-symbol-preview"></div>'
  + '<p id="feedbackSymbolCurrent" class="feedback-symbol-current"></p>'
  + '<div class="feedback-symbol-actions">'
  + '<button id="feedbackSymbolChoose" class="btn primary" type="button">Escolher imagem</button>'
  + '<button id="feedbackSymbolSave" class="btn primary" type="button" hidden>Salvar</button>'
  + '<button id="feedbackSymbolCancel" class="btn" type="button" hidden>Cancelar</button>'
  + '<button id="feedbackSymbolReset" class="btn" type="button" hidden>Voltar ao padrão</button>'
  + '</div>'
  + '<input id="feedbackSymbolFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>'
  + '<p id="feedbackSymbolStatus" role="status" aria-live="polite"></p>'
  + '</section>';

const SYMBOL_CSS = '.feedback-symbol-setting .feedback-symbol-preview{max-width:420px;margin:12px 0 0;border:1px solid var(--ac-line,var(--line));border-radius:14px;overflow:hidden;background:#181c20;aspect-ratio:600/276}'
  + '.feedback-symbol-setting .feedback-symbol-preview canvas{display:block;width:100%;height:auto}'
  + '.feedback-symbol-setting .feedback-symbol-current{font-size:calc(.78rem * var(--ap-ts,1));line-height:1.45;margin:10px 0 0;color:var(--ac-muted,var(--muted));overflow-wrap:anywhere}'
  + '.feedback-symbol-setting .feedback-symbol-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0}'
  + '.feedback-symbol-setting .feedback-symbol-actions .btn{min-height:48px;margin:0;padding:10px 18px;border-radius:11px;white-space:nowrap}'
  + '.feedback-symbol-setting .feedback-symbol-actions .btn[hidden]{display:none}'
  + '.feedback-symbol-setting #feedbackSymbolStatus{font-size:calc(.78rem * var(--ap-ts,1));line-height:1.45;margin:8px 0 0}'
  + '.feedback-symbol-setting #feedbackSymbolStatus:empty{display:none}'
  + '.feedback-symbol-setting #feedbackSymbolStatus[data-error=true]{color:var(--ac-danger)}'
  + '@media print{.feedback-symbol-setting{display:none}}';

const SYMBOL_JS = String.raw`(function(){
 'use strict';
 // 1.12.309: símbolo próprio nos cartões de feedback (pedido do Tiago, 23/11/2026: "eles têm que ter o próprio ícone deles").
 // Fica em state.trainerProfile.feedbackSymbol: PNG só com a forma (o app tira o fundo); o cartão pinta na cor do tema.
 // Sem símbolo salvo: na conta do Tiago continua o desenho TL ('tl'); nas outras contas, as iniciais do nome ('').
 const TL_OWNER='R2EmnDVcvMWt7TjPxOP6DjW1VOn1'; // conta do Tiago: o TL é a marca dele
 const PNG=/^data:image\/png;base64,/,MAX=40000,AREA_LIMIT=620000;
 const card=window.APFeedbackCard;
 if(!card||typeof card.create!=='function'||typeof card.open!=='function'||typeof card.initials!=='function')return;
 const $=id=>document.getElementById(id);
 function saved(){try{const v=state?.trainerProfile?.feedbackSymbol;return typeof v==='string'&&PNG.test(v)&&v.length<=MAX?v:''}catch(_){return ''}}
 function owner(){try{return window.parent?.APaccounts?.teacherUid?.()===TL_OWNER}catch(_){return false}}
 function effective(){return saved()||(owner()?'tl':'')}
 function sourceName(){let n='';try{n=typeof window.APFeedbackName==='function'?window.APFeedbackName():''}catch(_){}if(!n)try{n=typeof trainerProfile==='function'?trainerProfile().name:''}catch(_){}return String(n||'')}
 function initials(){return card.initials(sourceName())}
 const add=options=>({symbol:effective(),initials:initials(),...(options||{})});
 window.APFeedbackCard=Object.freeze({...card,create:(item,options)=>card.create(item,add(options)),open:(item,options)=>card.open(item,add(options))});

 // A área do aluno leva o símbolo (ou 'tl', ou vazio = iniciais) dentro do payload, sem passar do limite de envio.
 const model=window.APStudentModel;
 if(model&&typeof model.makeArea==='function')window.APStudentModel=Object.freeze({...model,makeArea:function(){
  const area=model.makeArea.apply(this,arguments);
  try{if(area&&area.trainer&&typeof area.trainer==='object'){const s=effective(),size=new TextEncoder().encode(JSON.stringify(area)).byteLength;area.trainer.symbol=size+s.length+16<=AREA_LIMIT?s:''}}catch(_){}
  return area;
 }});

 // Tira o fundo (transparente ou de uma cor só) e devolve só a forma, recortada, em PNG branco com transparência.
 async function process(file){
  if(!file||!/^image\/(png|jpeg|webp)$/.test(String(file.type||'')))throw Error('Use uma imagem PNG, JPG ou WebP.');
  if(file.size>8e6)throw Error('A imagem passa de 8 MB. Escolha uma menor.');
  const url=URL.createObjectURL(file);let img;
  try{img=await new Promise((ok,fail)=>{const x=new Image(),t=setTimeout(()=>fail(Error('tempo')),15000);x.onload=()=>{clearTimeout(t);ok(x)};x.onerror=()=>{clearTimeout(t);fail(Error('imagem'))};x.src=url})}
  catch(_){throw Error('Não foi possível abrir essa imagem.')}
  finally{URL.revokeObjectURL(url)}
  const scale=Math.min(1,512/Math.max(img.naturalWidth||1,img.naturalHeight||1));
  const W=Math.round((img.naturalWidth||0)*scale),H=Math.round((img.naturalHeight||0)*scale);
  if(W<16||H<16)throw Error('A imagem é pequena demais.');
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,W,H);
  const px=g.getImageData(0,0,W,H).data,total=W*H,mask=new Uint8ClampedArray(total);
  const border=[];for(let x=0;x<W;x++)border.push(x,(H-1)*W+x);for(let y=1;y<H-1;y++)border.push(y*W,y*W+W-1);
  let clear=0;for(let i=0;i<total;i++)if(px[i*4+3]<128)clear++;
  const clearBorder=border.filter(i=>px[i*4+3]<128).length/border.length;
  if(clearBorder>=.5&&clear/total>=.02){for(let i=0;i<total;i++)mask[i]=px[i*4+3]}
  else{
   const solid=border.filter(i=>px[i*4+3]>=128);
   const median=c=>{const v=solid.map(i=>px[i*4+c]).sort((a,b)=>a-b);return v[v.length>>1]||0};
   const bg=[median(0),median(1),median(2)];
   const dist=i=>Math.hypot(px[i*4]-bg[0],px[i*4+1]-bg[1],px[i*4+2]-bg[2]);
   if(!solid.length||solid.filter(i=>dist(i)<=40).length/border.length<.85)throw Error('Não deu para separar o símbolo do fundo. Use um logo com fundo transparente ou de uma cor só.');
   for(let i=0;i<total;i++)mask[i]=Math.round(Math.min(1,Math.max(0,(dist(i)-24)/40))*px[i*4+3]);
  }
  let x0=W,y0=H,x1=-1,y1=-1,on=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(mask[y*W+x]>32){on++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0||on/total<.004)throw Error('Não encontrei o símbolo na imagem.');
  if(on/total>.9)throw Error('A imagem não tem fundo para tirar. Use um logo com fundo transparente ou de uma cor só.');
  const pad=Math.round(Math.max(x1-x0,y1-y0)*.04);
  x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(W-1,x1+pad);y1=Math.min(H-1,y1+pad);
  const cw=x1-x0+1,ch=y1-y0+1,shape=document.createElement('canvas');shape.width=cw;shape.height=ch;
  const sg=shape.getContext('2d'),out=sg.createImageData(cw,ch);
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const o=(y*cw+x)*4;out.data[o]=out.data[o+1]=out.data[o+2]=255;out.data[o+3]=mask[(y+y0)*W+x+x0]}
  sg.putImageData(out,0,0);
  for(const target of [160,120,96]){
   let h=Math.min(target,ch),w=Math.round(cw*h/ch);
   if(w>4*target){w=4*target;h=Math.max(1,Math.round(ch*w/cw))}
   const f=document.createElement('canvas');f.width=Math.max(1,w);f.height=Math.max(1,h);
   const fg=f.getContext('2d');fg.imageSmoothingQuality='high';fg.drawImage(shape,0,0,f.width,f.height);
   const dataUrl=f.toDataURL('image/png');
   if(dataUrl.length<=MAX)return {dataUrl,width:f.width,height:f.height};
  }
  throw Error('O símbolo tem detalhes demais para o cartão. Tente uma versão mais simples do logo.');
 }

 // Tela Feedback: prévia com o alto do cartão de verdade, Escolher imagem, Salvar, Cancelar e Voltar ao padrão.
 let draft=null,busy=false,renderId=0;
 function status(text,error){const s=$('feedbackSymbolStatus');if(!s)return;s.textContent=text||'';s.dataset.error=error?'true':'false'}
 function describe(){
  if(window.APTeacherFeatures?.enabled?.('feedbackSymbol')===false)return 'O símbolo está desligado em Atualizações ("Símbolo nos cartões de feedback"): os cartões mostram o nome escrito.';
  if(draft)return 'Prévia do símbolo novo. Toque em Salvar para usar nos cartões.';
  const s=effective();
  return s==='tl'?'Agora: o símbolo TL, padrão da sua conta.':s?'Agora: o seu símbolo.':'Agora: as iniciais '+(initials()||'do nome')+', porque nenhum símbolo foi enviado.';
 }
 async function preview(){
  const box=$('feedbackSymbolPreview');if(!box)return;const id=++renderId,end=Date.now();
  try{
   const full=await window.APFeedbackCard.create({id:'symbol-preview',studentId:'',studentName:'Aluno Exemplo',source:'presencial',startedAt:end-3600000,finishedAt:end,durationSeconds:3600,response:{intensity:'Moderada',comment:'Treino feito.'}},draft?{symbol:draft}:{});
   if(id!==renderId){full.width=full.height=0;return}
   const c=document.createElement('canvas');c.width=600;c.height=276;c.getContext('2d').drawImage(full,44,50,600,276,0,0,600,276);full.width=full.height=0;
   c.setAttribute('role','img');c.setAttribute('aria-label','Prévia do alto do cartão de feedback');box.replaceChildren(c);
  }catch(_){if(id===renderId)box.replaceChildren()}
 }
 function sync(){
  const has=!!saved(),show=(id,on)=>{const el=$(id);if(el)el.hidden=!on};
  show('feedbackSymbolChoose',!draft);show('feedbackSymbolSave',!!draft);show('feedbackSymbolCancel',!!draft);show('feedbackSymbolReset',!draft&&has);
  const d=$('feedbackSymbolCurrent');if(d)d.textContent=describe();
  if($('feedbackSymbolSetting')?.closest('.screen')?.classList.contains('active'))preview(); // só desenha com a tela aberta
 }
 function store(value){
  const previous=state.trainerProfile;
  if(value){state.trainerProfile={...(previous||{}),feedbackSymbol:value}}else{const {feedbackSymbol,...rest}=previous||{};state.trainerProfile=rest}
  try{save();return true}catch(_){state.trainerProfile=previous;status('Não foi possível salvar. Verifique o espaço disponível.',true);return false}
 }
 function init(){
  const section=$('feedbackSymbolSetting'),input=$('feedbackSymbolFile');if(!section||!input||section.dataset.ready)return;section.dataset.ready='1';
  $('feedbackSymbolChoose').addEventListener('click',()=>{if(!busy)input.click()});
  input.addEventListener('change',async()=>{
   const file=input.files&&input.files[0];input.value='';if(!file||busy)return;
   busy=true;status('Preparando o símbolo…');
   try{draft=(await process(file)).dataUrl;status('')}catch(e){draft=null;status(e&&e.message||'Não foi possível usar essa imagem.',true)}
   finally{busy=false;sync()}
  });
  $('feedbackSymbolSave').addEventListener('click',()=>{if(!draft)return;if(store(draft)){draft=null;status('Salvo. Os alunos recebem o símbolo na próxima sincronização.')}sync()});
  $('feedbackSymbolCancel').addEventListener('click',()=>{draft=null;status('');sync()});
  $('feedbackSymbolReset').addEventListener('click',()=>{if(store(''))status(owner()?'Voltou ao símbolo TL.':'Símbolo removido. Os cartões mostram as iniciais.');sync()});
  const screen=section.closest('.screen');
  if(screen&&window.MutationObserver)new MutationObserver(()=>{if(screen.classList.contains('active'))sync();else if(draft){draft=null;status('')}}).observe(screen,{attributes:true,attributeFilter:['class','hidden']});
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 window.APFeedbackSymbol=Object.freeze({saved,effective,initials,process});
})();`;

const STUDENT_JS = String.raw`(function(){
 'use strict';
 // 1.12.309: o cartão de feedback do aluno usa o símbolo que o professor mandou na área (area.trainer.symbol).
 // Área sem o campo (professor com o app antigo): continua o TL de antes.
 const card=window.APFeedbackCard;
 if(!card||typeof card.create!=='function'||typeof card.open!=='function'||typeof card.initials!=='function')return;
 const PNG=/^data:image\/png;base64,/;
 function mark(){
  let t=null;try{t=window.__AP_STUDENT_CONTEXT?.area?.trainer}catch(_){}
  if(!t||typeof t!=='object'||typeof t.symbol!=='string')return null;
  const s=t.symbol==='tl'?'tl':PNG.test(t.symbol)&&t.symbol.length<=40000?t.symbol:'';
  return {symbol:s,initials:card.initials(String(t.feedbackName||t.name||''))};
 }
 const add=options=>{const m=mark();return m?{...m,...(options||{})}:(options||{})};
 window.APFeedbackCard=Object.freeze({...card,create:(item,options)=>card.create(item,add(options)),open:(item,options)=>card.open(item,add(options))});
})();`;

const CSS_BLOCK = '<style id="ap-feedback-symbol-css">' + SYMBOL_CSS + '</style>';
const JS_BLOCK = '<script id="ap-feedback-symbol">' + SYMBOL_JS + '\n</script>\n';
const STUDENT_BLOCK = '<script id="ap-feedback-symbol-student">' + STUDENT_JS + '\n</script>\n';

function blockRange(html, tag, id) {
  const open = '<' + tag + ' id="' + id + '">';
  assert.equal(count(html, open), 1, 'Bloco ' + id + ' não aparece uma única vez');
  const start = html.indexOf(open) + open.length;
  const end = html.indexOf('</' + tag + '>', start);
  assert.ok(end > start, 'Fim do bloco ' + id + ' não encontrado');
  return [start, end];
}
function editBlock(html, tag, id, changes) {
  const [start, end] = blockRange(html, tag, id);
  let text = html.slice(start, end);
  for (const [what, before, after] of changes) {
    assert.equal(count(text, before), 1, id + ': trecho para "' + what + '" não aparece uma única vez');
    text = text.replace(before, () => after);
  }
  return html.slice(0, start) + text + html.slice(end);
}
function blockText(html, tag, id) { const [start, end] = blockRange(html, tag, id); return html.slice(start, end); }

function editProfessor(html) {
  for (const id of ['ap-feedback-symbol-css', 'ap-feedback-symbol"', 'feedbackSymbolSetting'])
    assert.equal(count(html, id), 0, id + ' já existe no 1.12.308');
  assert.equal(count(html, '</body>'), 1, 'O fim da página do professor não aparece uma única vez');
  // Dependências conferidas no 1.12.308
  for (const needed of ['global.APStudentModel=Object.freeze({TEACHER,text,uid,clone,https,youtube,makeArea,assertArea,workouts,key});',
    'const packet=s=>APStudentModel.makeArea(state,s,helpers);', "area.trainer={", 'window.APFeedbackName=current;',
    'function trainerProfile(){', 'global.APTeacherFeatures=Object.freeze({read,set,enabled:name=>read()[name]!==false});',
    'id="screen-feedback-settings" class="screen"'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.308: ' + needed);
  assert.equal(count(html, 'APStudentModel.makeArea('), 3, 'Mudou o número de lugares que montam a área do aluno: rever o embrulho');
  let out = editBlock(html, 'script', 'ap-feedback-card', CARD_CHANGES);
  out = editBlock(out, 'script', 'ap-feedback-theme', THEME_CHANGES);
  for (const [what, before, after] of PROFESSOR_TEXT_CHANGES) {
    assert.equal(count(out, before), 1, 'Texto para "' + what + '" não aparece uma única vez');
    out = out.replace(before, () => after);
  }
  assert.equal(count(out, SETTINGS_ANCHOR), 1, 'O fim do cartão "Nome nos feedbacks" não aparece uma única vez');
  out = out.replace(SETTINGS_ANCHOR, () => SETTINGS_ANCHOR + SETTINGS_HTML);
  out = out.replace('</body>', () => CSS_BLOCK + JS_BLOCK + '</body>');
  return out;
}

function editStudent(html) {
  assert.equal(count(html, 'ap-feedback-symbol-student'), 0, 'ap-feedback-symbol-student já existe no 1.12.308');
  assert.ok(html.includes('window.__AP_STUDENT_CONTEXT?.area?.trainer?.feedbackName'), 'O cartão do aluno não lê mais a área do aluno');
  // O professor usa a conta logada (APaccounts.teacherUid, do app principal) para saber se o TL é o padrão
  assert.equal(count(html, 'teacherUid:()=>A()?s.uid:null'), 1, 'APaccounts.teacherUid mudou no app principal');
  let out = editBlock(html, 'script', 'ap-feedback-card', CARD_CHANGES);
  const end = out.lastIndexOf('</body>');
  assert.ok(end > 0 && /^<\/body>\s*<\/html>\s*$/.test(out.slice(end)), 'O fim da página do aluno não é </body></html>');
  return out.slice(0, end) + STUDENT_BLOCK + out.slice(end);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.308');
  assert.equal(source.sequence, 414);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notesText.length <= 4000, 'notas: ' + notesText.length);
  const { agendaSignature, ...original } = source;
  // O cartão é o mesmo texto nas duas páginas antes e depois
  assert.equal(blockText(original.files['index.html'], 'script', 'ap-feedback-card'), blockText(original.files['professor.html'], 'script', 'ap-feedback-card'), 'O cartão já era diferente entre aluno e professor');
  const files = {...original.files, 'professor.html': editProfessor(original.files['professor.html']), 'index.html': editStudent(original.files['index.html'])};
  assert.equal(blockText(files['index.html'], 'script', 'ap-feedback-card'), blockText(files['professor.html'], 'script', 'ap-feedback-card'), 'O cartão ficou diferente entre aluno e professor');
  return {...original, files, version, sequence, notes: notesText, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.308 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editProfessor, editStudent, version, sequence, TARGET_NAME, SOURCE_NAME, SYMBOL_JS, STUDENT_JS};
