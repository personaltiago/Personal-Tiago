'use strict';

// Gera o pacote 1.12.294 (sem assinatura) a partir do pacote 1.12.292 (seq 398). Muda a tela do aluno (index.html) em dois trechos do
// feedback: o script ap-feedback-student e o estilo ap-feedback-css. O mesmo acréscimo de estilo entra na cópia do professor.html (sem
// efeito lá): o aplicativo trata ap-feedback-css como componente COMPARTILHADO (UpdateAreaPatch.SHARED: aluno e professor têm de ter o
// mesmo texto, e uma correção por área só vale se trocar as duas cópias para o mesmo conteúdo).
// Motivo (Tiago, 19/11, 20:22, ditado, com duas imagens): "personalizar esse ícone de feedback: esse ícone que você fez aí ficaria o
// padrão, sempre ia começar com ele, mas a pessoa poderia escolher entre todos esses daqui". As imagens eram ilustrações roxas: o selo
// de um balão com linhas de texto, joinha e estrelas e uma grade de 18 ícones. Na mesma hora ele pediu que as atualizações que estão no
// GitHub continuem no aparelho depois deste pacote (ver abaixo).
// ESTE PACOTE SUBSTITUI O 1.12.293 (22:12, mesmo dia, Tiago): o 1.12.293 usava as imagens roxas como arte final (WebP fixos, inclusive no
// padrão), então o botão ficava roxo, brilhante e maior que o sino e o WhatsApp mesmo para um aluno com tema rosa. O Tiago corrigiu: o
// roxo era só ilustração, os ícones têm de acompanhar a cor do aplicativo e ter o tamanho dos ícones vizinhos. Por isso, aqui:
//  - o PADRÃO é o balão do 1.12.292, o mesmo caminho SVG, sem mudar um ponto (quem não escolhe nada vê exatamente o do 292);
//  - os outros 18 são desenhos novos, vetoriais, de uma cor só (silhueta cheia com detalhes vazados, grade 24×24), no mesmo estilo e
//    no mesmo peso do balão, do sino cheio e do ícone do WhatsApp (tools/icones-feedback-294/: desenhar.py gera icones.json);
//  - todos usam currentColor, a cor de destaque do aluno (a mesma do sino e do WhatsApp no topo e dos ícones das linhas de Meu perfil),
//    em qualquer tema, no escuro e no claro; nada é pintado de uma cor fixa;
//  - todos têm o mesmo tamanho do balão do 292 no topo (svg de 27 px no botão de 44×44, que as regras do 292 já definem) e em Meu perfil
//    o mesmo tamanho dos ícones das outras linhas (27 px).
// O que o pacote faz:
//  - Em "Meu perfil" (tela do aluno) entra uma linha nova, "Ícone do feedback", logo depois de "Configurações". Ao tocar, abre um painel
//    com os 19 ícones (o padrão e 18 outros); tocar num deles vale na hora: o botão do topo do Início (o do 1.12.292, com o número
//    de feedbacks pendentes) passa a mostrar o ícone escolhido. Quem não escolhe nada continua com o padrão.
//  - A escolha é de cada aluno e fica só no aparelho (APstudentStorage, chave agenda_demo_feedback_icon, que o aplicativo separa por
//    conta, como o tema e as outras opções de personalização). Não vai para o Firebase, não é lida pelo professor e não muda dados de
//    aluno. A escolha NÃO acompanha o aluno em outro aparelho (limite deste desenho; para valer em todos os aparelhos ou para o professor
//    escolher por todos os alunos seria preciso gravar no Firebase, o que depende de autorização).
//  - O número, a cor do número, a posição, o tamanho de toque (44×44), o rótulo ("Feedback do treino, N pendente(s)") e a janela
//    "Como foi hoje?" continuam como no 1.12.292; só o caminho do desenho dentro do botão muda (o atributo d do <path> que já existe).
//    Não há imagem, então não há o que falhar ao carregar.
//  - A linha de "Meu perfil" só existe para aluno logado (o mesmo critério do botão do topo) e segue o tema claro/escuro do perfil.
// Não muda: o resto do index.html e do professor.html, avaliacoes.html, cadastro.html, dados, respostas, Firebase, a lista do feedback
// (APFeedbackSync), descanso, cronômetros, alarmes e notificações. O código novo não usa rede, não cria timers e não mexe em notificações.
// No professor.html o acréscimo é inerte: só tem seletores do painel de ícones da tela do aluno, que não existem lá.
// Como o conteúdo é montado: o MESMO algoritmo do aplicativo para blocos (UpdateAreaPatch.findBlocks, app 1.207): cada mudança troca o
// texto de dentro de um bloco <script id=...> ou <style id=...>; o texto atual precisa ter o SHA-256 "before" e o novo precisa ter o
// SHA-256 "after", senão o gerador para.
// Numeração: sequência = número da versão + 106 (regra do projeto). 1.12.294 = sequência 400 = 292 (398) + 2 (o 1.12.293 / 399 foi
// entregue ao Tiago, nunca foi instalado nem publicado, e este o substitui). O pacote é completo e cumulativo: inclui tudo do 1.12.292
// (que inclui o 1.12.291) e deve ser instalado no lugar dele. Os próximos pacotes completos devem partir deste (versão a partir de
// 1.12.295, sequência a partir de 401).
// Os desenhos ficam em tools/icones-feedback-294/icones.json (caminho SVG de cada um + SHA-256); o gerador confere cada um.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { findBlocks } = require('./gerar-correcoes-exercicios-1.12.291.cjs');

const version = '1.12.294';
const sequence = 400;
const title = 'Ícone do feedback personalizável';
const summary = 'O aluno escolhe em Meu perfil o ícone do aviso de feedback do topo (19 opções, na cor do app; padrão: o balão do 292). Inclui o 1.12.292 e tudo o que já está na main, exceto a Raposinha.';
const notes = 'Ícone do feedback personalizável. O aluno pode escolher o ícone do botão de feedback que aparece no topo do Início (o botão com o número de feedbacks pendentes, do 1.12.292). '
  + 'Em Meu perfil há uma linha nova, "Ícone do feedback", logo depois de Configurações. Ao tocar nela abre a lista com 19 ícones e o escolhido vale na hora. '
  + 'O padrão, para quem não escolher nada, é o balão do 1.12.292.\n\n'
  + 'Cor e tamanho. Os ícones são desenhos de uma cor só e usam a cor de destaque que o aluno escolheu no aplicativo, como o sino de notificações e o ícone do WhatsApp ao lado: se a cor mudar, o ícone muda junto, no escuro e no claro. '
  + 'No topo ficam do mesmo tamanho do balão do 1.12.292 (27 px dentro do botão de 44×44) e, em Meu perfil, do mesmo tamanho dos ícones das outras linhas.\n\n'
  + 'Como funciona. A escolha é de cada aluno e fica guardada só no aparelho dele, como as outras opções de personalização: não vai para o Firebase, o professor não vê e ela não acompanha o aluno em outro aparelho (em outro celular começa no padrão). '
  + 'O número de pendentes, a cor do número, a posição no topo e a janela "Como foi hoje?" continuam como no 1.12.292; só o desenho do botão muda. '
  + 'Sem feedback pendente o topo fica exatamente como era, qualquer que seja a escolha.\n\n'
  + 'Na tela do aluno (index.html) mudam dois trechos do feedback: o script e o estilo. O mesmo acréscimo de estilo entra na cópia do professor (professor.html), sem nenhum efeito lá: o aplicativo exige que as duas cópias do estilo do feedback sejam iguais. '
  + 'Nenhum dado, resposta, treino, Firebase ou envio de feedback foi alterado e descanso, cronômetros, alarmes e notificações não foram mexidos.\n\n'
  + 'Atualizações da main mantidas. Este pacote é completo e cumulativo: instalado no lugar do 1.12.292 (ou do 291 ou do 288), ele já traz tudo o que está publicado na main, então não é preciso reinstalar nada depois dele. '
  + 'Estão dentro: o sino do feedback (1.12.292); as correções de exercícios do 1.12.291 (catálogo unificado, baixar catálogo, duplicatas e exclusão); apagar exercício do catálogo; ficha selecionada recolhível no painel do professor; '
  + 'histórico mensal de pagamentos sem anexos; sininho de cadastros pendentes do professor; testar e enviar sons do treino; e as janelas como página (1.12.288). '
  + 'Cada uma foi conferida contra o código do aplicativo e nenhuma se perde ao instalar este pacote.\n\n'
  + 'Fora do pacote: a Raposinha (três fases). Ela não está no 1.12.288, nem no 291, nem no 292, e o aplicativo a recusa por conflito com o conteúdo atual dos mascotes; precisa ser adaptada antes de entrar. '
  + 'Este pacote também substitui o 1.12.293, que tinha os ícones em roxo fixo.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_VERSION = '1.12.292';
const SOURCE_SEQUENCE = 398;
// O pacote 1.12.292 entregue ao Tiago, sem assinatura (ainda não está na main quando este gerador foi escrito).
const SOURCE_NAME = 'AgendaPersonal-1.12.292-Sino-Feedback-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '82f41147ea8b47609483817506756ed1c1560c0dc7c718eed83b8e0224e687fb';

const ICON_DIR = path.join(__dirname, 'icones-feedback-294');
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
// O desenho do balão do 1.12.292, igual byte a byte: é o ícone padrão e o que o botão do topo já tem. Os outros 18 são desenhos novos no
// mesmo estilo (silhueta cheia, detalhes vazados, grade 24×24), gerados por tools/icones-feedback-294/desenhar.py.
const ICON_292 = 'M5.5 3h13A3.5 3.5 0 0 1 22 6.5v8a3.5 3.5 0 0 1-3.5 3.5h-8l-4.1 3.5Q5.5 22.2 5.5 21v-3A3.5 3.5 0 0 1 2 14.5v-8A3.5 3.5 0 0 1 5.5 3z'
  + 'M7.4 7.6h9.2a.9.9 0 0 1 0 1.8H7.4a.9.9 0 0 1 0-1.8z'
  + 'M7.4 11.5h5.2a.9.9 0 0 1 0 1.8H7.4a.9.9 0 0 1 0-1.8z';
const PATH_CHARS = /^[MmLlHhVvCcSsQqTtAaZz0-9 .,-]+$/;

// Lê o manifesto e devolve [{id, name, d}] na ordem do painel: o padrão primeiro. Cada caminho tem o SHA-256 conferido e só pode ter
// comandos de caminho SVG (nada que feche aspas ou abra marcação quando for escrito dentro de um atributo).
function loadIcons(dir = ICON_DIR) {
  const manifest = JSON.parse(readFileSync(path.join(dir, 'icones.json'), 'utf8'));
  assert.equal(manifest.grade, 24, 'Os desenhos devem estar em uma grade 24×24');
  assert.equal(manifest.icones.length, ICON_COUNT, 'O manifesto devia ter ' + ICON_COUNT + ' ícones');
  assert.equal(manifest.icones[0].id, 'padrao', 'O primeiro ícone do manifesto precisa ser o padrão');
  assert.equal(manifest.icones[0].d, ICON_292, 'O padrão precisa ser o balão do 1.12.292, igual byte a byte');
  const seen = new Set(), names = new Set(), shapes = new Set();
  return manifest.icones.map(item => {
    assert.match(item.id, /^[a-z]+(?:-[a-z]+)*$/, 'Identificador de ícone inválido: ' + item.id);
    assert.ok(!seen.has(item.id) && !names.has(item.nome) && !shapes.has(item.d), 'Ícone repetido (identificador, nome ou desenho): ' + item.id);
    seen.add(item.id); names.add(item.nome); shapes.add(item.d);
    assert.ok(typeof item.nome === 'string' && item.nome.trim() === item.nome && item.nome.length >= 3 && item.nome.length <= 30, 'Nome inválido: ' + item.id);
    assert.ok(typeof item.d === 'string' && item.d.length > 40 && item.d.length < 4000 && PATH_CHARS.test(item.d) && /^M/.test(item.d), 'Caminho inválido: ' + item.id);
    assert.equal(sha256(item.d), item.sha256, 'SHA-256 do desenho diferente do manifesto: ' + item.id);
    return {id: item.id, name: item.nome, d: item.d};
  });
}

// ---------- Script (bloco ap-feedback-student) ----------
// 1) As constantes ficam no começo do bloco (antes de qualquer código que possa chamar f()): a chave de armazenamento e a lista de ícones.
//    A chave começa com agenda_demo_: o APstudentStorage do aplicativo só separa por conta as chaves com esse prefixo.
const JS_HEAD_BEFORE = 'let o="",d="",s=null,i=null,c=null;const r=new MutationObserver(';
const jsHead = icons => 'let o="",d="",s=null,i=null,c=null;const FB_ICON_KEY="agenda_demo_feedback_icon",FB_ICONS=' + JSON.stringify(icons) + ';const r=new MutationObserver(';

// 2) O desenho do botão do topo: depois de decidir que o botão aparece, feedbackBell() chama feedbackBellFace(), que troca só o
//    atributo d do <path> que o botão do 1.12.292 já tem (mesmo svg de 27 px, mesma cor do botão: currentColor = cor de destaque).
const JS_FACE_BEFORE = 'bell.hidden=!show;actions.parentNode.classList.toggle("ap-feedback-bell-on",show);if(!show)return;';
const JS_FACE_AFTER = JS_FACE_BEFORE + 'feedbackBellFace(bell);';

// 3) A linha e o painel do Perfil, a escolha e o que liga tudo. Entram no fim do bloco, antes da última chamada f().
const JS_TAIL_BEFORE = 'window.APFeedbackStudent=Object.freeze({open:m,close:k,render:b,decorate:f}),f()}();';
const JS_NEW = [
  '/* Ícone do feedback (1.12.294): a escolha do aluno fica só neste aparelho, por conta (APstudentStorage separa por aluno as chaves agenda_demo_*). Os desenhos são caminhos SVG de uma cor só (currentColor): seguem a cor de destaque. */',
  'function feedbackIcon(){let id="";try{id=String(APstudentStorage.getItem(FB_ICON_KEY)||"")}catch(_){}return FB_ICONS.find(x=>x.id===id)||FB_ICONS[0]}',
  'function feedbackBellFace(bell){const icon=feedbackIcon(),path=bell.querySelector("svg path");path&&bell.dataset.icon!==icon.id&&(bell.dataset.icon=icon.id,path.setAttribute("d",icon.d))}',
  'function feedbackIconSync(){const open=a("apFeedbackIconOpen"),panel=a("apFeedbackIconPanel");if(!open||!panel)return;',
  'const show=!!t.uid(),icon=feedbackIcon(),now=open.querySelector(".ap-fbicon-now path");open.hidden=!show;',
  'if(!show){panel.hidden=!0;open.setAttribute("aria-expanded","false")}',
  'if(now&&open.dataset.icon!==icon.id){open.dataset.icon=icon.id;now.setAttribute("d",icon.d)}',
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
  'open.innerHTML=\'<span class="ap-fbicon-now"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d=""/></svg></span><div><strong>Ícone do feedback</strong><small>Escolha o ícone do aviso de feedback</small></div><span class="profile-chevron" data-profile-icon="chevron"></span>\';',
  'panel.id="apFeedbackIconPanel";panel.className="profile-panel ap-fbicon-panel";panel.tabIndex=-1;panel.hidden=!0;panel.setAttribute("aria-labelledby","apFeedbackIconTitle");',
  'panel.innerHTML=\'<h2 id="apFeedbackIconTitle">Ícone do feedback</h2><p>Este ícone aparece no topo do Início quando há um feedback do treino para você enviar.</p>\'',
  '+\'<div id="apFeedbackIconStatus" class="ap-fbicon-status" role="status" aria-live="polite"></div>\'',
  '+\'<div class="ap-fbicon-grid" role="radiogroup" aria-labelledby="apFeedbackIconTitle">\'',
  '+FB_ICONS.map(x=>\'<label class="ap-fbicon-opt"><input type="radio" name="apFeedbackIcon" value="\'+n(x.id)+\'" aria-label="\'+n(x.name)+\'"><span class="ap-fbicon-face"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="\'+n(x.d)+\'"/></svg></span></label>\').join("")',
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
// Acrescentado ao fim do bloco. Botão do topo: NENHUMA regra nova. O svg de 27 px, a cor (currentColor = cor de destaque do aluno, a mesma do
// sino e do WhatsApp), o número e o tamanho de toque 44×44 são do 1.12.292; só o caminho do desenho muda (por script).
// Linha de Meu perfil: o desenho atual no mesmo tamanho (27 px) e na mesma cor (--prof-accent) dos ícones das outras linhas.
// Painel do Perfil: segue o .profile-panel do aplicativo (fundo escuro ou branco no tema claro). Cada opção é um quadrado de 52 px com o
// desenho na cor de destaque, sobre um fundo bem escuro nos DOIS modos (a mais escura das cores do aplicativo, o roxo, só passa de 3:1 de
// contraste sobre um fundo mais escuro que o do painel; sobre um fundo claro quatro cores (amarelo, laranja, verde e ciano) ficariam
// abaixo de 2,2:1 e o desenho quase sumiria no modo claro). É um rádio de verdade escondido por cima (teclado e leitor de tela de graça). O escolhido ganha
// borda e fundo na cor de destaque e uma marca de visto escura com anel na cor de destaque, que aparece em qualquer cor de destaque
// (inclusive clara) e não depende só da cor. O contorno do foco de teclado no modo claro é escuro, para aparecer com qualquer cor de
// destaque. Sem aspect-ratio, sem inset e sem color-mix, para o Safari mais antigo mostrar igual.
const CHECK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M2.4 6.3l2.4 2.4 4.8-5.2\' fill=\'none\' stroke=\'%23fff\' stroke-width=\'1.8\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")';
const CSS_ICON = [
  '#apFeedbackIconOpen[hidden],#apFeedbackIconPanel[hidden]{display:none!important}',
  '#profileScreen .ap-fbicon-now{flex:none;display:block;width:27px;height:27px;color:var(--prof-accent)}',
  '#profileScreen .ap-fbicon-now svg{display:block;width:27px;height:27px;fill:currentColor;stroke:none}',
  '#profileScreen .profile-panel.ap-fbicon-panel{display:grid;gap:10px;margin:0;padding:14px}',
  '.ap-fbicon-panel h2{margin:0;font-size:1.05em}',
  '.ap-fbicon-panel p{margin:0;font-size:12px;line-height:1.35;color:#c2ccd7}',
  '#profileScreen.profile-light .ap-fbicon-panel p{color:#526271}',
  '.ap-fbicon-panel .ap-fbicon-status{font-size:13px;font-weight:700;line-height:1.3;overflow-wrap:anywhere}',
  '.ap-fbicon-grid{display:grid;grid-template-columns:repeat(auto-fill,52px);justify-content:space-between;gap:12px 8px;margin:4px 0 2px}',
  '.ap-fbicon-opt{position:relative;display:block;width:52px;height:52px;border-radius:12px;color:var(--prof-accent);-webkit-tap-highlight-color:transparent}',
  '.ap-fbicon-opt input{position:absolute;top:0;right:0;bottom:0;left:0;z-index:2;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}',
  '.ap-fbicon-face{position:absolute;top:0;right:0;bottom:0;left:0;display:flex;align-items:center;justify-content:center;border:1px solid #2a414f;border-radius:inherit;background:linear-gradient(120deg,#08171f,#050e15)}',
  '.ap-fbicon-face svg{position:relative;z-index:1;display:block;width:28px;height:28px;fill:currentColor;stroke:none;pointer-events:none}',
  '.ap-fbicon-opt input:checked+.ap-fbicon-face{border-color:currentColor;box-shadow:inset 0 0 0 1px currentColor}',
  '.ap-fbicon-opt input:checked+.ap-fbicon-face::before{content:"";position:absolute;top:0;right:0;bottom:0;left:0;border-radius:inherit;background:currentColor;opacity:.1}',
  '.ap-fbicon-opt input:checked+.ap-fbicon-face::after{content:"";position:absolute;z-index:2;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;',
  'background:#0a151e ' + CHECK + ' center/11px 11px no-repeat;box-shadow:0 0 0 2px currentColor}',
  '.ap-fbicon-opt input:focus-visible+.ap-fbicon-face{outline:2px dashed currentColor;outline-offset:3px}',
  '#profileScreen.profile-light .ap-fbicon-opt input:focus-visible+.ap-fbicon-face{outline-color:#1e3040}'
].join('');

// ---------- Edições por bloco ----------
// before/after: SHA-256 do texto de dentro do bloco, antes (no 1.12.292) e depois.
const SCRIPT_EDIT = {
  id: 'ap-feedback-student', kind: 'script',
  before: '0730944c9db6f28900906000abeec9192bb953dc62ec0eebec18c2ba01ca3760',
  after: '716376dbdf9c59c9b8c350e813fd801c7503c47b9ccc8932cd5b472490852121',
  apply: (inner, icons = loadIcons()) => {
    for (const [what, part] of [['o começo do bloco', JS_HEAD_BEFORE], ['o fim do desenho do botão', JS_FACE_BEFORE], ['o fim do bloco', JS_TAIL_BEFORE],
      ['o desenho do balão do 1.12.292 no botão', 'd="' + icons[0].d + '"']])
      assert.equal(count(inner, part), 1, 'Não achei ' + what + ' do feedback do aluno como esperado');
    return inner.split(JS_HEAD_BEFORE).join(jsHead(icons)).split(JS_FACE_BEFORE).join(JS_FACE_AFTER).split(JS_TAIL_BEFORE).join(JS_TAIL_AFTER);
  }
};
// O estilo é o mesmo nas duas páginas (SHA-256 igual antes e depois): é o que o aplicativo exige de um componente compartilhado.
const CSS_EDIT = {
  id: 'ap-feedback-css', kind: 'style',
  before: 'e0407658139b1392b21b1994aac0e305badc2e913a4dc983e721b9fadf2a7376',
  after: '583bd4ee1010be97a2a13f795222367a0b6491a880fc6335c9375f3da16baad5',
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
  assert.equal(sequence, SOURCE_SEQUENCE + 2, 'A sequência deve ser a do 1.12.292 mais dois (o 1.12.293 foi descartado)');
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
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.294-Icone-Feedback-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-icone-feedback-1.12.294.cjs <pacote-1.12.292.agenda.json> [saida.agenda.json]');
  const data = makeUpdate(loadSource(sourceFile));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, loadSource, loadIcons, editBlocks, BLOCK_EDITS, SCRIPT_EDIT, CSS_EDIT, SHARED_BLOCKS, JS_HEAD_BEFORE, JS_FACE_BEFORE, JS_FACE_AFTER, JS_TAIL_BEFORE,
  JS_TAIL_AFTER, JS_NEW, jsHead, CSS_ICON, CHECK, ICON_292, PATH_CHARS, APP_ID, SOURCE_NAME, SOURCE_SHA256, SOURCE_VERSION, SOURCE_SEQUENCE, ICON_DIR, ICON_COUNT, sha256, count,
  version, sequence, title, summary, notes
};
