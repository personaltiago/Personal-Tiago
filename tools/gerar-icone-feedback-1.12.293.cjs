'use strict';

// Gera o pacote 1.12.293 (sem assinatura) a partir do pacote 1.12.292 (seq 398). Muda a tela do aluno (index.html) em dois trechos do
// feedback: o script ap-feedback-student e o estilo ap-feedback-css. O mesmo acréscimo de estilo entra na cópia do professor.html (sem
// efeito lá): o aplicativo trata ap-feedback-css como componente COMPARTILHADO (UpdateAreaPatch.SHARED: aluno e professor têm de ter o
// mesmo texto, e uma correção por área só vale se trocar as duas cópias para o mesmo conteúdo).
// Motivo (Tiago, 19/11, 20:22, ditado, com duas imagens): "personalizar esse ícone de feedback: esse ícone que você fez aí ficaria o
// padrão, sempre ia começar com ele, mas a pessoa poderia escolher entre todos esses daqui". As imagens: o selo roxo (balão com linhas de
// texto, joinha e cinco estrelas), que passa a ser o padrão, e uma grade de 18 ícones roxos para escolher. Na mesma hora ele pediu que
// as atualizações que estão no GitHub continuem no aparelho depois deste pacote (ver abaixo).
// O que o pacote faz:
//  - Em "Meu perfil" (tela do aluno) entra uma linha nova, "Ícone do feedback", logo depois de "Configurações". Ao tocar, abre um painel
//    com os 19 ícones (o padrão e os 18 da grade); tocar num deles vale na hora: o botão do topo do Início (o do 1.12.292, com o número
//    de feedbacks pendentes) passa a mostrar o ícone escolhido. Quem não escolhe nada continua com o padrão.
//  - A escolha é de cada aluno e fica só no aparelho (APstudentStorage, chave agenda_demo_feedback_icon, que o aplicativo separa por
//    conta, como o tema e as outras opções de personalização). Não vai para o Firebase, não é lida pelo professor e não muda dados de
//    aluno. A escolha NÃO acompanha o aluno em outro aparelho (limite deste desenho; para valer em todos os aparelhos ou para o professor
//    escolher por todos os alunos seria preciso gravar no Firebase, o que depende de autorização).
//  - O número, a cor do número, a posição, o tamanho de toque (44×44), o rótulo ("Feedback do treino, N pendente(s)") e a janela
//    "Como foi hoje?" continuam como no 1.12.292; só o desenho dentro do botão muda (imagem WebP embutida no script, 160×160, 38 px na tela
//    para os blocos e 40 px para o selo redondo). Se a imagem não carregar, volta o balão simples do 1.12.292.
//  - A linha de "Meu perfil" só existe para aluno logado (o mesmo critério do botão do topo) e segue o tema claro/escuro do perfil.
// Não muda: o resto do index.html e do professor.html, avaliacoes.html, cadastro.html, dados, respostas, Firebase, a lista do feedback
// (APFeedbackSync), descanso, cronômetros, alarmes e notificações. O código novo não usa rede, não cria timers e não mexe em notificações.
// No professor.html o acréscimo é inerte: só tem seletores do botão do topo do aluno e da linha de "Meu perfil", que não existem lá.
// Como o conteúdo é montado: o MESMO algoritmo do aplicativo para blocos (UpdateAreaPatch.findBlocks, app 1.207): cada mudança troca o
// texto de dentro de um bloco <script id=...> ou <style id=...>; o texto atual precisa ter o SHA-256 "before" e o novo precisa ter o
// SHA-256 "after", senão o gerador para.
// Numeração: sequência = número da versão + 106 (regra do projeto). 1.12.293 = sequência 399 = 292 (398) + 1. O pacote é completo e
// cumulativo: inclui tudo do 1.12.292 (que inclui o 1.12.291) e deve ser instalado no lugar dele. Os próximos pacotes completos devem
// partir deste (versão a partir de 1.12.294, sequência a partir de 400).
// Os ícones ficam em tools/icones-feedback-293/ (WebP 160×160 + manifest.json com SHA-256 de cada um); o gerador confere cada arquivo.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { findBlocks } = require('./gerar-correcoes-exercicios-1.12.291.cjs');

const version = '1.12.293';
const sequence = 399;
const title = 'Ícone do feedback personalizável';
const summary = 'O aluno escolhe em Meu perfil o ícone do aviso de feedback do topo (19 opções; padrão: selo roxo). Inclui o 1.12.292 e tudo o que já está publicado na main, exceto a Raposinha.';
const notes = 'Ícone do feedback personalizável. O aluno pode escolher o ícone do botão de feedback que aparece no topo do Início (o botão com o número de feedbacks pendentes, do 1.12.292). '
  + 'Em Meu perfil há uma linha nova, "Ícone do feedback", logo depois de Configurações. Ao tocar nela abre a lista com 19 ícones e o escolhido vale na hora. '
  + 'O padrão, para quem não escolher nada, é o selo roxo (balão com linhas de texto, joinha e cinco estrelas).\n\n'
  + 'Como funciona. A escolha é de cada aluno e fica guardada só no aparelho dele, como as outras opções de personalização: não vai para o Firebase, o professor não vê e ela não acompanha o aluno em outro aparelho (em outro celular começa no padrão). '
  + 'O número de pendentes, a cor do número, a posição no topo e a janela "Como foi hoje?" continuam como no 1.12.292; só o desenho do botão muda. '
  + 'Sem feedback pendente o topo fica exatamente como era, qualquer que seja a escolha. Se a imagem do ícone não carregar, o botão volta ao balão simples do 1.12.292.\n\n'
  + 'Na tela do aluno (index.html) mudam dois trechos do feedback: o script e o estilo. O mesmo acréscimo de estilo entra na cópia do professor (professor.html), sem nenhum efeito lá: o aplicativo exige que as duas cópias do estilo do feedback sejam iguais. '
  + 'Nenhum dado, resposta, treino, Firebase ou envio de feedback foi alterado e descanso, cronômetros, alarmes e notificações não foram mexidos.\n\n'
  + 'Atualizações da main mantidas. Este pacote é completo e cumulativo: instalado no lugar do 1.12.292 (ou do 291 ou do 288), ele já traz tudo o que está publicado na main, então não é preciso reinstalar nada depois dele. '
  + 'Estão dentro: o sino do feedback (1.12.292); as correções de exercícios do 1.12.291 (catálogo unificado, baixar catálogo, duplicatas e exclusão); apagar exercício do catálogo; ficha selecionada recolhível no painel do professor; '
  + 'histórico mensal de pagamentos sem anexos; sininho de cadastros pendentes do professor; testar e enviar sons do treino; e as janelas como página (1.12.288). '
  + 'Cada uma foi conferida contra o código do aplicativo e nenhuma se perde ao instalar este pacote.\n\n'
  + 'Fora do pacote: a Raposinha (três fases). Ela não está no 1.12.288, nem no 291, nem no 292, e o aplicativo a recusa por conflito com o conteúdo atual dos mascotes; precisa ser adaptada antes de entrar.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_VERSION = '1.12.292';
const SOURCE_SEQUENCE = 398;
// O pacote 1.12.292 entregue ao Tiago, sem assinatura (ainda não está na main quando este gerador foi escrito).
const SOURCE_NAME = 'AgendaPersonal-1.12.292-Sino-Feedback-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '82f41147ea8b47609483817506756ed1c1560c0dc7c718eed83b8e0224e687fb';

const ICON_DIR = path.join(__dirname, 'icones-feedback-293');
const ICON_COUNT = 19;
const END_BLOCK = /<\/\s*(?:script|style)\b/i;
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const sha256Bytes = bytes => createHash('sha256').update(bytes).digest('hex');

function count(text, part) {
  assert.ok(typeof part === 'string' && part.length > 0, 'Trecho vazio não pode ser procurado');
  let total = 0;
  for (let at = text.indexOf(part); at >= 0; at = text.indexOf(part, at + part.length)) total++;
  return total;
}

// ---------- Ícones ----------
// Lê o manifesto e cada WebP (tamanho e SHA-256 conferidos) e devolve [{id, name, disc?, src}] na ordem do painel: o padrão primeiro.
function loadIcons(dir = ICON_DIR) {
  const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.icones.length, ICON_COUNT, 'O manifesto devia ter ' + ICON_COUNT + ' ícones');
  assert.equal(manifest.icones[0].id, 'padrao', 'O primeiro ícone do manifesto precisa ser o padrão');
  const seen = new Set(), names = new Set();
  return manifest.icones.map(item => {
    assert.match(item.id, /^[a-z]+(?:-[a-z]+)*$/, 'Identificador de ícone inválido: ' + item.id);
    assert.ok(!seen.has(item.id) && !names.has(item.nome), 'Ícone repetido (identificador ou nome): ' + item.id);
    seen.add(item.id); names.add(item.nome);
    assert.ok(typeof item.nome === 'string' && item.nome.trim() === item.nome && item.nome.length >= 3 && item.nome.length <= 30, 'Nome inválido: ' + item.id);
    assert.ok(item.forma === (item.id === 'padrao' ? 'disco' : 'bloco'), 'Só o padrão é redondo: ' + item.id);
    const bytes = readFileSync(path.join(dir, item.arquivo));
    assert.equal(bytes.length, item.bytes, 'Tamanho do arquivo diferente do manifesto: ' + item.arquivo);
    assert.equal(sha256Bytes(bytes), item.sha256, 'SHA-256 do arquivo diferente do manifesto: ' + item.arquivo);
    assert.ok(bytes.subarray(0, 4).toString('latin1') === 'RIFF' && bytes.subarray(8, 12).toString('latin1') === 'WEBP', 'Não é um WebP: ' + item.arquivo);
    return {id: item.id, name: item.nome, ...(item.forma === 'disco' ? {disc: true} : {}), src: 'data:image/webp;base64,' + bytes.toString('base64')};
  });
}

// ---------- Script (bloco ap-feedback-student) ----------
// 1) As constantes ficam no começo do bloco (antes de qualquer código que possa chamar f()): a chave de armazenamento e a lista de ícones.
//    A chave começa com agenda_demo_: o APstudentStorage do aplicativo só separa por conta as chaves com esse prefixo.
const JS_HEAD_BEFORE = 'let o="",d="",s=null,i=null,c=null;const r=new MutationObserver(';
const jsHead = icons => 'let o="",d="",s=null,i=null,c=null;const FB_ICON_KEY="agenda_demo_feedback_icon",FB_ICONS=' + JSON.stringify(icons) + ';const r=new MutationObserver(';

// 2) O desenho do botão do topo: depois de decidir que o botão aparece, feedbackBell() chama feedbackBellFace(), que põe a imagem do
//    ícone escolhido pelo aluno (ou o padrão) antes do número. O balão simples do 1.12.292 continua no botão como reserva.
const JS_FACE_BEFORE = 'bell.hidden=!show;actions.parentNode.classList.toggle("ap-feedback-bell-on",show);if(!show)return;';
const JS_FACE_AFTER = JS_FACE_BEFORE + 'feedbackBellFace(bell);';

// 3) A linha e o painel do Perfil, a escolha e o que liga tudo. Entram no fim do bloco, antes da última chamada f().
const JS_TAIL_BEFORE = 'window.APFeedbackStudent=Object.freeze({open:m,close:k,render:b,decorate:f}),f()}();';
const JS_NEW = [
  '/* Ícone do feedback (1.12.293): a escolha do aluno fica só neste aparelho, por conta (APstudentStorage separa por aluno as chaves agenda_demo_*). */',
  'function feedbackIcon(){let id="";try{id=String(APstudentStorage.getItem(FB_ICON_KEY)||"")}catch(_){}return FB_ICONS.find(x=>x.id===id)||FB_ICONS[0]}',
  'function feedbackBellFace(bell){const icon=feedbackIcon();let img=bell.querySelector("img");',
  'if(!img){img=document.createElement("img");img.alt="";img.draggable=!1;',
  'img.addEventListener("error",()=>bell.classList.add("ap-fbicon-fallback"));img.addEventListener("load",()=>bell.classList.remove("ap-fbicon-fallback"));bell.prepend(img)}',
  'if(bell.dataset.icon!==icon.id){bell.dataset.icon=icon.id;bell.classList.remove("ap-fbicon-fallback");img.src=icon.src}',
  'bell.classList.toggle("ap-fbicon-disc",!!icon.disc)}',
  'function feedbackIconSync(){const open=a("apFeedbackIconOpen"),panel=a("apFeedbackIconPanel");if(!open||!panel)return;',
  'const show=!!t.uid(),icon=feedbackIcon(),now=open.querySelector("img");open.hidden=!show;',
  'if(!show){panel.hidden=!0;open.setAttribute("aria-expanded","false")}',
  'if(now.dataset.icon!==icon.id){now.dataset.icon=icon.id;now.src=icon.src}',
  'panel.querySelectorAll(\'input[name="apFeedbackIcon"]\').forEach(r=>{r.checked=r.value===icon.id});',
  'const status=a("apFeedbackIconStatus"),text="Escolhido: "+icon.name;status&&status.textContent!==text&&(status.textContent=text)}',
  'function feedbackIconChoose(id){const icon=FB_ICONS.find(x=>x.id===id),status=a("apFeedbackIconStatus");if(!icon||!status)return;',
  'let saved=!!t.uid();if(saved)try{APstudentStorage.setItem(FB_ICON_KEY,icon.id)}catch(_){saved=!1}',
  'feedbackIconSync();if(!saved){status.textContent="Não foi possível guardar o ícone neste aparelho.";return}',
  'feedbackBell(t.pending().length);dispatchEvent(new CustomEvent("ap-feedback-icon-changed",{detail:{id:icon.id}}))}',
  'function feedbackIconRow(){const list=document.querySelector("#profileScreen .profile-options");if(!list)return;',
  'if(!a("apFeedbackIconOpen")){const open=document.createElement("button"),panel=document.createElement("section");',
  'open.id="apFeedbackIconOpen";open.type="button";open.className="profile-option ap-fbicon-open";open.hidden=!0;',
  'open.setAttribute("aria-expanded","false");open.setAttribute("aria-controls","apFeedbackIconPanel");',
  'open.innerHTML=\'<span class="ap-fbicon-now"><img alt="" draggable="false"></span><div><strong>Ícone do feedback</strong><small>Escolha o ícone do aviso de feedback</small></div><span class="profile-chevron" data-profile-icon="chevron"></span>\';',
  'panel.id="apFeedbackIconPanel";panel.className="profile-panel ap-fbicon-panel";panel.tabIndex=-1;panel.hidden=!0;panel.setAttribute("aria-labelledby","apFeedbackIconTitle");',
  'panel.innerHTML=\'<h2 id="apFeedbackIconTitle">Ícone do feedback</h2><p>Este ícone aparece no topo do Início quando há um feedback do treino para você enviar.</p>\'',
  '+\'<div id="apFeedbackIconStatus" class="ap-fbicon-status" role="status" aria-live="polite"></div>\'',
  '+\'<div class="ap-fbicon-grid" role="radiogroup" aria-labelledby="apFeedbackIconTitle">\'',
  '+FB_ICONS.map(x=>\'<label class="ap-fbicon-opt\'+(x.disc?" ap-fbicon-disc-opt":"")+\'"><input type="radio" name="apFeedbackIcon" value="\'+n(x.id)+\'" aria-label="\'+n(x.name)+\'"><span class="ap-fbicon-face"><img alt="" draggable="false" src="\'+x.src+\'"></span></label>\').join("")',
  '+\'</div>\';',
  'open.addEventListener("click",()=>{const opening=panel.hidden;panel.hidden=!opening;open.setAttribute("aria-expanded",String(opening));',
  'if(opening){feedbackIconSync();panel.focus({preventScroll:!0});panel.scrollIntoView({block:"nearest",behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"})}});',
  'panel.addEventListener("change",ev=>{const r=ev.target;r&&"apFeedbackIcon"===r.name&&feedbackIconChoose(r.value)});',
  'const settings=[...list.children].find(x=>/profileSettings\\(/.test(x.getAttribute("onclick")||""));settings?settings.after(open,panel):list.append(open,panel)}',
  'const chevron=a("apFeedbackIconOpen").querySelector(\'[data-profile-icon="chevron"]\');',
  'if(chevron&&!chevron.firstChild&&"function"==typeof profileSymbol)chevron.innerHTML=profileSymbol("chevron");feedbackIconSync()}',
  'if("function"==typeof profileRender){const original=profileRender;profileRender=function(...ev){const result=original.apply(this,ev);try{feedbackIconRow()}catch(_){}return result}}',
  'addEventListener("ap-student-ready",()=>{try{feedbackIconRow()}catch(_){}});',
  'addEventListener("ap-account-changed",()=>{const panel=a("apFeedbackIconPanel"),open=a("apFeedbackIconOpen");',
  'panel&&(panel.hidden=!0);open&&open.setAttribute("aria-expanded","false");try{feedbackIconRow()}catch(_){}});',
  'try{feedbackIconRow()}catch(_){}'
].join('\n');
const JS_TAIL_AFTER = 'window.APFeedbackStudent=Object.freeze({open:m,close:k,render:b,decorate:f});\n' + JS_NEW + '\nf()}();';

// ---------- Estilo (bloco ap-feedback-css) ----------
// Acrescentado ao fim do bloco. Botão do topo: a imagem substitui o balão (que fica escondido, de reserva); o selo redondo tem 40 px e os
// blocos 38 px (um quadrado do mesmo lado que um círculo parece maior). O botão continua 44×44 (as regras do 1.12.292 não mudam).
// Painel do Perfil: segue o .profile-panel do aplicativo (fundo escuro ou branco no tema claro); grade que se ajusta à largura; cada
// ícone é um rádio de verdade escondido por cima da figura (teclado e leitor de tela de graça); o escolhido ganha um anel na cor de
// destaque do aluno (box-shadow: acompanha o canto arredondado também no Safari antigo) e uma marca de visto escura, que aparece mesmo
// quando a cor de destaque é clara demais para o anel se destacar do fundo.
const CHECK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M2.4 6.3l2.4 2.4 4.8-5.2\' fill=\'none\' stroke=\'%23fff\' stroke-width=\'1.8\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")';
const CSS_ICON = [
  '.student-home .ap-feedback-bell img{display:block;width:38px;height:38px;object-fit:contain;pointer-events:none;-webkit-user-select:none;user-select:none}',
  '.student-home .ap-feedback-bell.ap-fbicon-disc img{width:40px;height:40px}',
  '.student-home .ap-feedback-bell:not(.ap-fbicon-fallback) svg,.student-home .ap-feedback-bell.ap-fbicon-fallback img{display:none}',
  '#apFeedbackIconOpen[hidden],#apFeedbackIconPanel[hidden]{display:none!important}',
  '#profileScreen .ap-fbicon-now{flex:none;display:block;width:27px;height:27px}',
  '#profileScreen .ap-fbicon-now img{display:block;width:100%;height:100%;object-fit:contain}',
  '#profileScreen .profile-panel.ap-fbicon-panel{display:grid;gap:10px;margin:0;padding:14px}',
  '.ap-fbicon-panel h2{margin:0;font-size:1.05em}',
  '.ap-fbicon-panel p{margin:0;font-size:12px;line-height:1.35;color:#c2ccd7}',
  '#profileScreen.profile-light .ap-fbicon-panel p{color:#526271}',
  '.ap-fbicon-panel .ap-fbicon-status{font-size:13px;font-weight:700;line-height:1.3;overflow-wrap:anywhere}',
  '.ap-fbicon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:14px 12px;margin:4px 0 2px}',
  '.ap-fbicon-opt{position:relative;display:block;aspect-ratio:1;border-radius:16px;-webkit-tap-highlight-color:transparent}',
  '.ap-fbicon-opt.ap-fbicon-disc-opt{border-radius:50%}',
  '.ap-fbicon-opt input{position:absolute;inset:0;z-index:1;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}',
  '.ap-fbicon-face{position:absolute;inset:0;display:block;border-radius:inherit}',
  '.ap-fbicon-face img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;-webkit-user-select:none;user-select:none}',
  '.ap-fbicon-opt input:checked+.ap-fbicon-face{box-shadow:0 0 0 3px var(--ap-fbicon-gap,#071a25),0 0 0 5px var(--prof-accent,#fff)}',
  '.ap-fbicon-opt input:checked+.ap-fbicon-face::after{content:"";position:absolute;right:-7px;bottom:-7px;width:20px;height:20px;border-radius:50%;',
  'background:#0a151e ' + CHECK + ' center/12px 12px no-repeat;box-shadow:0 0 0 2px var(--prof-accent,#fff)}',
  '.ap-fbicon-opt.ap-fbicon-disc-opt input:checked+.ap-fbicon-face::after{right:-1px;bottom:-1px}',
  '.ap-fbicon-opt input:focus-visible+.ap-fbicon-face{outline:2px dashed currentColor;outline-offset:7px}',
  '#profileScreen.profile-light .ap-fbicon-panel{--ap-fbicon-gap:#fff}'
].join('');

// ---------- Edições por bloco ----------
// before/after: SHA-256 do texto de dentro do bloco, antes (no 1.12.292) e depois.
const SCRIPT_EDIT = {
  id: 'ap-feedback-student', kind: 'script',
  before: '0730944c9db6f28900906000abeec9192bb953dc62ec0eebec18c2ba01ca3760',
  after: '4da2dacfa793f10779d6d1e8e6c56c0c1931e25caf2db811331c1123b3a49f66',
  apply: (inner, icons = loadIcons()) => {
    for (const [what, part] of [['o começo do bloco', JS_HEAD_BEFORE], ['o fim do desenho do botão', JS_FACE_BEFORE], ['o fim do bloco', JS_TAIL_BEFORE]])
      assert.equal(count(inner, part), 1, 'Não achei ' + what + ' do feedback do aluno como esperado');
    return inner.split(JS_HEAD_BEFORE).join(jsHead(icons)).split(JS_FACE_BEFORE).join(JS_FACE_AFTER).split(JS_TAIL_BEFORE).join(JS_TAIL_AFTER);
  }
};
// O estilo é o mesmo nas duas páginas (SHA-256 igual antes e depois): é o que o aplicativo exige de um componente compartilhado.
const CSS_EDIT = {
  id: 'ap-feedback-css', kind: 'style',
  before: 'e0407658139b1392b21b1994aac0e305badc2e913a4dc983e721b9fadf2a7376',
  after: '86eb7c5879cec350914868a59774a41a61393d539feb9aed1d5a9272a2023e62',
  apply: inner => inner + CSS_ICON
};
const BLOCK_EDITS = {
  'index.html': [SCRIPT_EDIT, CSS_EDIT],
  'professor.html': [CSS_EDIT]
};
// Componentes que o aplicativo exige iguais nas duas páginas (UpdateAreaPatch.SHARED) e que este pacote toca.
const SHARED_BLOCKS = ['ap-feedback-css'];

// Troca o texto de dentro dos blocos pedidos (a mesma ideia do UpdateAreaPatch.replaceBlocks). Recusa conflito, bloco ausente e edição que
// já foi aplicada.
function editBlocks(html, edits) {
  assert.equal(typeof html, 'string', 'Página ausente');
  const blocks = findBlocks(html, new Map(edits.map(edit => [edit.id, edit])));
  const pending = [];
  for (const edit of edits) {
    const block = blocks.get(edit.id);
    assert.ok(block, 'O componente ' + edit.id + ' não existe no conteúdo em uso.');
    const current = html.slice(block.start, block.end);
    const hash = sha256(current);
    assert.notEqual(hash, edit.after, 'Esta edição já foi aplicada: ' + edit.id);
    assert.equal(hash, edit.before, 'Conflito em ' + edit.id + ': o bloco não é o do 1.12.292.');
    const next = edit.apply(current);
    assert.ok(!END_BLOCK.test(next), 'O conteúdo de ' + edit.id + ' fecha o bloco antes da hora');
    assert.equal(sha256(next), edit.after, 'O bloco ' + edit.id + ' não ficou como o esperado (SHA-256 diferente)');
    pending.push({block, next});
  }
  pending.sort((a, b) => a.block.start - b.block.start);
  let result = '', from = 0;
  for (const {block, next} of pending) {
    result += html.slice(from, block.start) + next;
    from = block.end;
  }
  return result + html.slice(from);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, SOURCE_VERSION);
  assert.equal(source.sequence, SOURCE_SEQUENCE);
  assert.equal(sequence, SOURCE_SEQUENCE + 1, 'A sequência deve ser a do 1.12.292 mais um');
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(!notes.includes('@@'), 'As notas ainda têm um marcador por preencher');
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const sharedText = (pages, id) => ['index.html', 'professor.html'].map(page => {
    const block = findBlocks(pages[page], new Map([[id, {}]])).get(id);
    assert.ok(block, 'O componente compartilhado ' + id + ' não existe em ' + page);
    return pages[page].slice(block.start, block.end);
  });
  for (const id of SHARED_BLOCKS) assert.equal(...sharedText(original.files, id), 'O componente compartilhado ' + id + ' já não é igual no aluno e no professor do 1.12.292');
  const files = {...original.files};
  for (const [page, edits] of Object.entries(BLOCK_EDITS)) files[page] = editBlocks(original.files[page], edits);
  for (const id of SHARED_BLOCKS) assert.equal(...sharedText(files, id), 'O componente compartilhado ' + id + ' ficou diferente entre aluno e professor');
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

// Lê o 1.12.292 e confere o SHA-256 do arquivo.
function loadSource(sourceFile) {
  const bytes = readFileSync(sourceFile);
  assert.equal(sha256Bytes(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.292 entregue (SHA-256 diferente): ' + sourceFile);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.293-Icone-Feedback-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-icone-feedback-1.12.293.cjs <pacote-1.12.292.agenda.json> [saida.agenda.json]');
  const data = makeUpdate(loadSource(sourceFile));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, loadSource, loadIcons, editBlocks, BLOCK_EDITS, SCRIPT_EDIT, CSS_EDIT, SHARED_BLOCKS, JS_HEAD_BEFORE, JS_FACE_BEFORE, JS_FACE_AFTER, JS_TAIL_BEFORE,
  JS_TAIL_AFTER, JS_NEW, jsHead, CSS_ICON, CHECK, APP_ID, SOURCE_NAME, SOURCE_SHA256, SOURCE_VERSION, SOURCE_SEQUENCE, ICON_DIR, ICON_COUNT, sha256, count,
  version, sequence, title, summary, notes
};
