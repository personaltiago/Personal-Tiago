'use strict';
// Confere o pacote 1.12.292 (sino do feedback no topo da tela do aluno, sobre o 1.12.291) sem navegador e sem internet:
//   node equipe/testes/sininho-feedback.smoke.cjs
// O que confere:
//  - a entrada: o pacote 1.12.291 entregue ao Tiago (SHA-256 7153e570…). Se ele não estiver na raiz do repositório (nem em PACOTE_291), o
//    teste o refaz com o gerador do 291 a partir dos quatro arquivos que já estão na main e confere o mesmo SHA-256;
//  - o pacote: versão 1.12.292 e sequência 398 (= 397 + 1 = versão + 106), ordem das chaves, nada de assinatura, limites de tamanho;
//  - o escopo: muda o index.html (só os dois blocos do feedback do aluno: script e estilo) e, no professor.html, só a cópia do estilo
//    ap-feedback-css, que o aplicativo trata como componente compartilhado (as duas cópias precisam continuar iguais; o acréscimo não
//    tem efeito no professor); o resto das páginas, avaliacoes.html, cadastro.html, o histórico de correções e os campos do pacote ficam
//    iguais; desfazendo só o que o gerador acrescentou, o 291 volta byte a byte;
//  - o código novo (texto, sem navegador): o sino só existe com aluno logado e feedback pendente; a chamada fica dentro de f() com o mesmo
//    número do aviso do pet; o toque abre a janela sem argumentos; sem rede, sem armazenamento, sem tempo, sem a ponte do aplicativo;
//    innerHTML só com texto fixo; nomes que não existem em nenhuma página do 291; contraste do número (referência WCAG); ícone SVG dentro
//    da caixa; estilo só com os seletores previstos e nada que mude o topo sem o sino; número com a geometria do sino de notificações;
//  - o gerador: determinismo, linha de comando (mesmo conteúdo, recusa sobrescrever, recusa entrada trocada);
//  - e roda sabotagens para provar que o teste pega o erro: bloco alterado, ausente ou duplicado, âncora que some ou se repete, edição
//    que fecha o bloco antes da hora, hash errado, edição repetida, base errada e versões sabotadas do próprio código novo.
// O comportamento na tela é conferido no Chrome real (equipe/testes/navegador/sininho-feedback) e a importação pelo código Java real do
// aplicativo em equipe/testes/sininho-feedback.java.py. Nada disso substitui o teste no celular.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const {spawnSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-sininho-feedback-1.12.292.cjs');
const G = require(GENERATOR);
const G291 = require(path.join(ROOT, 'tools/gerar-correcoes-exercicios-1.12.291.cjs'));
const {locate291} = require('./pacote-291.cjs');

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sininho-292-'));

let SOURCE_FILE, source, pack;
try {
  SOURCE_FILE = locate291(workDir); // PACOTE_291, a raiz do repositório ou refeito pelo gerador do 291 (sempre conferido pelo SHA-256)
  source = G.loadSource(SOURCE_FILE);
  pack = G.makeUpdate(source);
} catch (problem) {
  console.log('FALHA ao montar o pacote 1.12.292:\n     ' + String(problem && problem.message || problem).split('\n').join('\n     '));
  console.log('\n0 ok, 1 com falha');
  process.exit(1);
}
const fresh = () => G.loadSource(SOURCE_FILE); // cópia nova, para as sabotagens mexerem sem estragar as outras
const copy = value => JSON.parse(JSON.stringify(value));
const sha = G.sha256;
let ok = 0, bad = 0;
const queue = [];
const t = (n, f) => queue.push([n, f]);
const throwsWith = (fn, part, what) => {
  let error = null;
  try { fn(); } catch (e) { error = e; }
  assert.ok(error, (what || 'devia recusar') + ': nada foi recusado');
  assert.ok(String(error.message).includes(part), (what || 'recusa') + ': a mensagem era "' + String(error.message).slice(0, 160) + '", esperava conter "' + part + '"');
};
const occurrences = (text, part) => { let n = 0; for (let i = text.indexOf(part); i >= 0; i = text.indexOf(part, i + part.length)) n++; return n; };

const PAGE = 'index.html', TEACHER = 'professor.html';
const EDITS = G.BLOCK_EDITS[PAGE];
const BLOCKS = EDITS.map(e => e.id);
const SCRIPT = 'ap-feedback-student', STYLE = 'ap-feedback-css';
// Páginas que o gerador muda e os blocos que muda em cada uma.
const CHANGED = {[PAGE]: [SCRIPT, STYLE], [TEACHER]: [STYLE]};
const blocksOf = (html, ids) => G291.findBlocks(html, new Set(ids));
const inner = (html, id) => { const b = blocksOf(html, [id]).get(id); return b ? html.slice(b.start, b.end) : null; };
const replaceInner = (html, id, text) => { const b = blocksOf(html, [id]).get(id); return html.slice(0, b.start) + text + html.slice(b.end); };
// A mesma página com o texto de dentro dos blocos pedidos trocado por um marcador: o que sobra é "tudo o que não é desses blocos".
function withoutBlocks(html, ids) {
  const found = [...blocksOf(html, ids).entries()].sort((a, b) => a[1].start - b[1].start);
  let out = '', from = 0;
  for (const [id, b] of found) { out += html.slice(from, b.start) + '«' + id + '»'; from = b.end; }
  return out + html.slice(from);
}
const NEW_NAMES = ['apFeedbackBell', 'apFeedbackBellCount', 'ap-feedback-bell', 'ap-feedback-bell-on', 'fb-bell-ink', 'feedbackBell', 'feedbackBellInk'];

// ---------- verificações do código novo (reaproveitadas nas sabotagens) ----------
// `parts`: {call, ink, bell, css}. Cada uma lança erro se o texto fugir do combinado.
const FORBIDDEN = [/\bfetch\b/, /\bXMLHttpRequest\b/, /\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /\bsetItem\b/, /\bremoveItem\b/, /\bsetTimeout\b/, /\bsetInterval\b/,
  /\brequestAnimationFrame\b/, /\bAndroid\w*/, /\bwebkit\b/, /\bpostMessage\b/, /\bNotification\b/, /\bvibrate\b/, /\bAudio\w*/, /\beval\b/, /\bFunction\s*\(/,
  /document\.write/, /\blocation\b/, /\bhistory\b/, /window\.open/, /\bimport\s*\(/, /\bnavigator\b/, /\bsubmit\b/, /\brefresh\b/, /\bdraft\b/, /\bAPFeedbackSync\b/];
function checkJs({call, ink, bell}) {
  const code = call + ink + bell;
  for (const pattern of FORBIDDEN) assert.ok(!pattern.test(code), 'o código novo usa ' + pattern);
  // a chamada traz a chave que fecha f(); as duas funções novas, sozinhas, têm de fechar tudo o que abrem
  const functions = ink + bell;
  assert.equal(occurrences(functions, '{'), occurrences(functions, '}'), 'chaves desbalanceadas nas funções novas');
  assert.equal(occurrences(code, '('), occurrences(code, ')'), 'parênteses desbalanceados no código novo');
  assert.equal(call, ',feedbackBell(e)}', 'a chamada do sino mudou');
  assert.ok(bell.startsWith('function feedbackBell(count){') && ink.startsWith('function feedbackBellInk(hex){'), 'as funções novas mudaram de nome');
  // só aparece com aluno logado e pendência
  assert.ok(bell.includes('const show=!!t.uid()&&count>0;'), 'o sino precisa de aluno logado (t.uid()) e count>0');
  assert.ok(bell.includes('if(!bell){if(!show)return;'), 'sem pendência o botão nem é criado');
  assert.ok(bell.includes('bell.hidden=!show;') && bell.includes('classList.toggle("ap-feedback-bell-on",show)'), 'sem pendência o botão fica escondido e o topo volta ao que era');
  // toque: abre a janela sem argumentos (m(e="") recebe a mensagem; passar o evento do toque seria um erro)
  assert.equal(occurrences(bell, 'bell.onclick='), 1);
  assert.ok(bell.includes('bell.onclick=()=>m()'), 'o toque precisa chamar m() sem argumentos');
  assert.ok(bell.includes('actions.insertBefore(bell,next&&next.parentNode===actions?next:null)'), 'o botão entra antes do sino de notificações, dentro de .home-actions');
  assert.ok(bell.includes('document.querySelector("#homeScroll .home-actions")'), 'o botão é procurado só no topo do Início');
  // innerHTML só com texto fixo; número por textContent, rótulo por setAttribute
  assert.equal(occurrences(code, 'innerHTML'), 1, 'um só innerHTML');
  const html = /bell\.innerHTML='([^']*)';/.exec(bell);
  assert.ok(html, 'o innerHTML precisa ser um texto fixo entre aspas simples, sem variável');
  assert.ok(html[1].startsWith('<svg ') && html[1].endsWith('</span>') && !/\$\{|\+/.test(html[1]), 'o texto fixo do botão mudou');
  assert.equal(/\sd="([^"]+)"/.exec(html[1])[1], G.ICON_PATH, 'o desenho do ícone não é o aprovado');
  assert.ok(html[1].includes('aria-hidden="true"'), 'ícone e número escondidos dos leitores de tela (o rótulo do botão já diz tudo)');
  assert.ok(bell.includes('a("apFeedbackBellCount").textContent=String(count)'), 'o número entra por textContent');
  assert.ok(bell.includes('bell.setAttribute("aria-label",label)') && bell.includes('"Feedback do treino, "+count+(1===count?" pendente":" pendentes")'), 'rótulo de acessibilidade com singular e plural');
  // a cor do número vem do contraste e cai no acento do cartão do feedback se a cor do tema não for #rrggbb
  assert.ok(bell.includes('feedbackBellInk(/^#[0-9a-f]{6}$/i.test(raw)?raw:feedbackCardAccent())'), 'cor do número: contraste com o acento do tema');
}
// Referência independente (WCAG): contraste do branco com a cor. O branco vale até 3:1; abaixo disso o número fica escuro.
const wcagLuminance = hex => { const c = [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const whiteContrast = hex => 1.05 / (wcagLuminance(hex) + 0.05);
function checkInk(inkText) {
  const ink = vm.runInNewContext(inkText + ';feedbackBellInk');
  const samples = [];
  for (let v = 0; v < 256; v++) samples.push('#' + v.toString(16).padStart(2, '0').repeat(3));
  let seed = 12345;
  for (let i = 0; i < 400; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; samples.push('#' + (seed % 0x1000000).toString(16).padStart(6, '0')); }
  samples.push('#ff0000', '#b6ff26', '#ffd400', '#ffffff', '#000000', '#101010');
  for (const hex of samples) assert.equal(ink(hex), whiteContrast(hex) >= 3 ? '#fff' : '#0a151e', 'cor do número para ' + hex);
  assert.equal(ink('#949494'), '#fff', '#949494 é o cinza mais claro com 3:1 sobre o branco');
  assert.equal(ink('#959595'), '#0a151e', '#959595 já fica abaixo de 3:1');
  assert.equal(ink('#ffffff'), '#0a151e'); assert.equal(ink('#000000'), '#fff');
}
// Desenho do balão: três contornos (balão e duas linhas vazadas), tudo dentro da caixa 24×24 e as linhas bem dentro do balão.
function pathBoxes(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g), arity = {M: 2, m: 2, L: 2, l: 2, H: 1, h: 1, V: 1, v: 1, A: 7, a: 7, Q: 4, q: 4, Z: 0, z: 0};
  const boxes = []; let i = 0, x = 0, y = 0, box = null, cmd = null;
  const touch = (px, py) => { x = px; y = py; box.x0 = Math.min(box.x0, x); box.x1 = Math.max(box.x1, x); box.y0 = Math.min(box.y0, y); box.y1 = Math.max(box.y1, y); };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const n = arity[cmd]; assert.ok(n !== undefined, 'comando de desenho desconhecido: ' + cmd);
    const a = tokens.slice(i, i + n).map(Number); i += n;
    if (cmd === 'M' || cmd === 'm') { box = {x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9}; boxes.push(box); touch(cmd === 'M' ? a[0] : x + a[0], cmd === 'M' ? a[1] : y + a[1]); cmd = cmd === 'M' ? 'L' : 'l'; }
    else if (cmd === 'L') touch(a[0], a[1]); else if (cmd === 'l') touch(x + a[0], y + a[1]);
    else if (cmd === 'H') touch(a[0], y); else if (cmd === 'h') touch(x + a[0], y);
    else if (cmd === 'V') touch(x, a[0]); else if (cmd === 'v') touch(x, y + a[0]);
    else if (cmd === 'A') touch(a[5], a[6]); else if (cmd === 'a') touch(x + a[5], y + a[6]);
    else if (cmd === 'Q') touch(a[2], a[3]); else if (cmd === 'q') touch(x + a[2], y + a[3]);
    else if (cmd === 'Z' || cmd === 'z') { /* fecha o contorno */ }
  }
  return boxes;
}
function checkIcon(d) {
  const boxes = pathBoxes(d);
  assert.equal(boxes.length, 3, 'o desenho tem três contornos');
  assert.equal(occurrences(d, 'z'), 3, 'cada contorno fecha com z');
  for (const b of boxes) assert.ok(b.x0 >= 0 && b.y0 >= 0 && b.x1 <= 24 && b.y1 <= 24, 'dentro da caixa 24×24');
  const [outer, ...holes] = boxes;
  for (const h of holes) assert.ok(h.x0 - outer.x0 >= 3 && outer.x1 - h.x1 >= 3 && h.y0 - outer.y0 >= 3 && outer.y1 - h.y1 >= 3, 'a linha vazada precisa ficar bem dentro do balão');
}
// Estilo novo.
const parseDeclarations = body => Object.fromEntries(body.split(';').filter(Boolean).map(d => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; }));
function parseRules(css) { return css.split('}').filter(Boolean).map(rule => { const i = rule.indexOf('{'); assert.ok(i > 0, 'regra sem chave: ' + rule); return {selector: rule.slice(0, i).trim(), body: rule.slice(i + 1), declarations: parseDeclarations(rule.slice(i + 1))}; }); }
function checkCss(css, originalBadgeRule) {
  assert.equal(occurrences(css, '{'), occurrences(css, '}'), 'chaves desbalanceadas no estilo');
  for (const bad of [/@/, /url\s*\(/i, /expression/i, /javascript:/i, /<\//]) assert.ok(!bad.test(css), 'o estilo usa ' + bad);
  const rules = parseRules(css);
  assert.deepEqual(rules.map(r => r.selector), [
    '.student-home .ap-feedback-bell svg', '#apFeedbackBellCount', '.ap-feedback-bell[hidden]', G.HEADER, G.HEADER + ' .home-welcome',
    G.HEADER + ' .home-welcome h1', G.HEADER + ' .home-actions', G.HEADER + ' #apHomeDailyMessage'], 'seletores do estilo novo');
  for (const r of rules) {
    if (r.body.includes('!important')) assert.equal(r.selector, '.ap-feedback-bell[hidden]', '!important só para esconder o botão');
    if (/\.home-header/.test(r.selector)) assert.ok(r.selector.includes('.ap-feedback-bell-on'), 'regra que mexe no topo sem exigir .ap-feedback-bell-on: ' + r.selector);
  }
  const by = Object.fromEntries(rules.map(r => [r.selector, r.declarations]));
  // topo com o sino: linhas que quebram; 4 px entre ícones e entre nome e ícones (é o que mantém "Olá, Jéssica!" em uma linha em 390 px)
  assert.deepEqual(by[G.HEADER], {display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'space-between', 'column-gap': '4px', 'row-gap': '8px'});
  assert.equal(by[G.HEADER + ' .home-actions'].gap, '4px'); assert.equal(by[G.HEADER + ' .home-actions']['margin-left'], 'auto');
  assert.equal(by[G.HEADER + ' .home-welcome'].display, 'contents');
  assert.ok(by[G.HEADER + ' .home-welcome h1']['min-width'] === 'min-content' && by[G.HEADER + ' .home-welcome h1']['overflow-wrap'] === 'break-word', 'o nome nunca é partido no meio da palavra');
  assert.equal(by[G.HEADER + ' #apHomeDailyMessage'].flex, '1 0 100%');
  // o número é uma cópia do número do sino de notificações; só muda de onde vem a cor do texto
  const original = parseDeclarations(originalBadgeRule.slice(originalBadgeRule.indexOf('{') + 1, originalBadgeRule.lastIndexOf('}')));
  const badge = by['#apFeedbackBellCount'];
  assert.deepEqual(Object.keys(badge), Object.keys(original), 'mesmas propriedades do número do sino de notificações');
  for (const key of Object.keys(original)) if (key !== 'color') assert.equal(badge[key], original[key], 'número do sino: ' + key);
  assert.equal(original.color, '#fff'); assert.equal(badge.color, 'var(--fb-bell-ink,#fff)');
}

const jsParts = () => ({call: G.JS_CALL, ink: G.JS_INK, bell: G.JS_BELL});
const originalBadge = html => { const i = html.indexOf('#apStudentNotificationCount{'); assert.ok(i >= 0, 'regra do número do sino de notificações não encontrada'); return html.slice(i, html.indexOf('}', i) + 1); };

// ---------- 1) a entrada ----------
t('Entrada: o pacote 1.12.291 é o entregue (SHA-256), 1.12.291 / sequência 397, sem assinatura, com as quatro páginas e sem nada do sino', () => {
  assert.equal(digest(fs.readFileSync(SOURCE_FILE)), G.SOURCE_SHA256);
  assert.equal(source.version, '1.12.291'); assert.equal(source.sequence, 397);
  assert.equal(source.format, 1); assert.equal(source.appId, G.APP_ID);
  assert.equal(source.agendaSignature, undefined, 'o 291 entregue é o arquivo sem assinatura (quem assina é o fluxo do GitHub)');
  assert.deepEqual(Object.keys(source.files).sort(), ['avaliacoes.html', 'cadastro.html', 'index.html', 'professor.html']);
  for (const page of Object.keys(source.files)) for (const name of NEW_NAMES) assert.equal(occurrences(source.files[page], name), 0, name + ' já existe em ' + page + ' do 291');
});
t('Entrada: no 1.12.291 os dois blocos existem uma vez cada no index.html e estão no estado "antes" (SHA-256) que o gerador espera', () => {
  const html = source.files[PAGE];
  for (const edit of EDITS) {
    assert.equal(blocksOf(html, [edit.id]).size, 1, edit.id);
    assert.equal(sha(inner(html, edit.id)), edit.before, edit.id + ': o 1.12.291 não tem o estado "antes" esperado');
    assert.notEqual(edit.before, edit.after);
  }
  assert.deepEqual(BLOCKS, [SCRIPT, STYLE]);
  // o estilo é compartilhado: no 291 o texto é o mesmo no aluno e no professor, e o gerador troca as duas cópias pela mesma edição
  assert.deepEqual(G.SHARED_BLOCKS, [STYLE]);
  assert.deepEqual(G.BLOCK_EDITS[TEACHER], [G.CSS_EDIT]); assert.equal(EDITS[1], G.CSS_EDIT);
  assert.equal(blocksOf(source.files[TEACHER], [STYLE]).size, 1);
  assert.equal(inner(source.files[TEACHER], STYLE), inner(html, STYLE), 'no 1.12.291 o estilo ap-feedback-css é igual no aluno e no professor');
  assert.equal(sha(inner(source.files[TEACHER], STYLE)), G.CSS_EDIT.before);
  assert.equal(G.CSS_EDIT.after, EDITS[1].after);
});

// ---------- 2) o pacote ----------
t('Pacote: 1.12.292, sequência 398 (= 397 + 1 = versão + 106), mesmos aplicativo, ponte e esquema do 1.12.291', () => {
  assert.equal(pack.version, '1.12.292'); assert.equal(pack.sequence, 398);
  assert.equal(pack.sequence, source.sequence + 1);
  assert.equal(pack.sequence - 106, Number(pack.version.split('.')[2]), 'a regra do projeto: sequência = número da versão + 106');
  for (const key of ['format', 'appId', 'bridgeVersion', 'dataSchema']) assert.equal(pack[key], source[key], key);
});
t('Pacote: chaves na mesma ordem do 1.12.291, sem assinatura, com título (até 90), resumo (até 200) e notas (até 4000); o resto de "update" não muda', () => {
  assert.deepEqual(Object.keys(pack), Object.keys(source));
  assert.deepEqual(Object.keys(pack), ['format', 'appId', 'bridgeVersion', 'dataSchema', 'version', 'sequence', 'files', 'notes', 'update', 'modularUpdates']);
  assert.equal(pack.agendaSignature, undefined);
  assert.ok(pack.update.summary.length > 0 && pack.update.summary.length <= 200, 'resumo ' + pack.update.summary.length);
  assert.ok(pack.notes.length > 0 && pack.notes.length <= 4000, 'notas ' + pack.notes.length);
  assert.ok(pack.update.title.length > 0 && pack.update.title.length <= 90, 'título ' + pack.update.title.length);
  assert.deepEqual(Object.keys(pack.update), Object.keys(source.update));
  for (const key of Object.keys(source.update)) if (!['title', 'summary'].includes(key)) assert.deepEqual(pack.update[key], source.update[key], 'update.' + key);
  assert.equal(pack.update.title, G.title); assert.equal(pack.update.summary, G.summary); assert.equal(pack.notes, G.notes);
});
t('Pacote: se a base trouxer uma assinatura (arquivo já assinado), o 292 sai sem ela: uma assinatura velha não vale para o conteúdo novo', () => {
  const signed = {...source, agendaSignature: {keyId: 'qualquer', signature: 'x'}};
  const made = G.makeUpdate(signed);
  assert.equal(made.agendaSignature, undefined);
  assert.equal(JSON.stringify(made), JSON.stringify(pack));
});
t('Pacote: as notas dizem o que o Tiago precisa saber (o sino, o número, o balão, o aviso do pet, o 291 incluído e a troca 291 → 292)', () => {
  const n = pack.notes;
  for (const part of ['Sino do feedback', 'ao lado do sino de notificações', 'número de pendentes', 'sem entrar no pet', 'aviso vermelho dentro do pet continua', 'um balão, e não um segundo sino',
    'só para o aluno logado', 'tela do aluno (index.html)', 'cópia do professor (professor.html)', 'sem nenhum efeito lá', 'descanso, cronômetros, alarmes e notificações não foram mexidos', 'inclui o 1.12.291', 'no lugar dele', 'do 291 para o 292', 'mais juntos']) {
    assert.ok(n.includes(part), 'as notas não dizem: ' + part);
  }
  assert.ok(pack.update.summary.includes('1, 2, 3') && pack.update.summary.includes('1.12.291'));
});
t('Pacote: o tamanho cabe no limite do aplicativo (24 MiB) e o arquivo gravado é exatamente JSON.stringify(dados, null, 2) + quebra de linha', () => {
  const payload = JSON.stringify(pack, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  assert.equal(JSON.stringify(JSON.parse(payload), null, 2) + '\n', payload);
});

// ---------- 3) o escopo ----------
t('Escopo: só index.html e professor.html mudam; avaliacoes e cadastro ficam byte a byte iguais; mesmas páginas, mesma ordem', () => {
  assert.deepEqual(Object.keys(pack.files), Object.keys(source.files));
  for (const page of Object.keys(source.files)) {
    if (CHANGED[page]) assert.notEqual(pack.files[page], source.files[page], page + ' devia mudar');
    else assert.equal(pack.files[page], source.files[page], page + ' não devia mudar');
  }
  assert.deepEqual(Object.keys(G.BLOCK_EDITS).sort(), Object.keys(CHANGED).sort());
});
t('Escopo: o histórico de correções e o resto do pacote não mudam (um pacote completo não registra correção)', () => {
  assert.deepEqual(pack.modularUpdates, source.modularUpdates);
  assert.ok(Array.isArray(pack.modularUpdates) && pack.modularUpdates.length > 0, 'o histórico do 291 está lá');
});
t('Escopo: dentro de cada página só mudam os blocos previstos; o resto é igual ao do 1.12.291 e nenhum <script> ou <style> foi criado ou tirado', () => {
  for (const [page, ids] of Object.entries(CHANGED)) {
    assert.equal(withoutBlocks(source.files[page], ids), withoutBlocks(pack.files[page], ids), page);
    assert.equal(blocksOf(pack.files[page], ids).size, ids.length, page);
    for (const tag of ['<script', '</script', '<style', '</style', '<!--']) assert.equal(occurrences(pack.files[page], tag), occurrences(source.files[page], tag), page + ' ' + tag);
  }
  assert.equal(pack.files[PAGE].length - source.files[PAGE].length, G.JS_TAIL_AFTER.length - G.JS_TAIL_BEFORE.length + G.CSS_BELL.length, 'só cresceu o que o gerador acrescenta');
  assert.equal(pack.files[TEACHER].length - source.files[TEACHER].length, G.CSS_BELL.length, 'no professor.html só cresceu o estilo');
});
t('Escopo: o texto de cada bloco é o esperado (SHA-256 "after") e todos os outros blocos <script>/<style> com id continuam idênticos, nas duas páginas', () => {
  for (const edit of EDITS) assert.equal(sha(inner(pack.files[PAGE], edit.id)), edit.after);
  assert.equal(sha(inner(pack.files[TEACHER], STYLE)), G.CSS_EDIT.after);
  for (const [page, changed] of Object.entries(CHANGED)) {
    const ids = new Set([...source.files[page].matchAll(/<(?:script|style)\b[^>]*\sid="([^"]+)"/g)].map(m => m[1]));
    let compared = 0;
    for (const id of ids) {
      if (changed.includes(id)) continue;
      let before, after;
      try { before = inner(source.files[page], id); after = inner(pack.files[page], id); } catch (e) { continue; } // id repetido: o aplicativo também recusaria, não é alvo desta mudança
      assert.equal(after, before, page + ': o bloco ' + id + ' mudou');
      compared++;
    }
    assert.ok(compared > 20, page + ': conferi poucos blocos (' + compared + ')');
  }
});
t('Escopo: o estilo do feedback continua IGUAL no aluno e no professor (componente compartilhado do aplicativo) e no professor o acréscimo é inerte', () => {
  assert.equal(inner(pack.files[PAGE], STYLE), inner(pack.files[TEACHER], STYLE));
  // inerte: o que os seletores novos precisam (botão, número, classe do topo, variável de cor, funções) não existe em professor.html fora do bloco do estilo
  const outside = withoutBlocks(pack.files[TEACHER], [STYLE]);
  for (const name of NEW_NAMES) assert.equal(occurrences(outside, name), 0, name + ' existe em professor.html fora do estilo: o acréscimo deixaria de ser inerte');
  // os módulos do aplicativo para a área Evolução/feedback aceitam estes componentes nestas páginas (UpdateAreaPatch.RULES): conferido no teste Java
});
t('Escopo: desfazendo só o que o gerador acrescentou, os blocos voltam ao 1.12.291 byte a byte nas duas páginas (o 292 só acrescenta)', () => {
  const script = inner(pack.files[PAGE], SCRIPT), style = inner(pack.files[PAGE], STYLE);
  assert.equal(occurrences(script, G.JS_TAIL_AFTER), 1);
  assert.ok(style.endsWith(G.CSS_BELL), 'o estilo novo fica no fim do bloco');
  const undoScript = text => text.split(G.JS_TAIL_AFTER).join(G.JS_TAIL_BEFORE), undoStyle = text => text.slice(0, text.length - G.CSS_BELL.length);
  assert.equal(undoScript(script), inner(source.files[PAGE], SCRIPT));
  assert.equal(undoStyle(style), inner(source.files[PAGE], STYLE));
  const backIndex = replaceInner(replaceInner(pack.files[PAGE], SCRIPT, undoScript(script)), STYLE, undoStyle(style));
  assert.equal(backIndex, source.files[PAGE]);
  const teacherStyle = inner(pack.files[TEACHER], STYLE);
  assert.ok(teacherStyle.endsWith(G.CSS_BELL));
  assert.equal(replaceInner(pack.files[TEACHER], STYLE, undoStyle(teacherStyle)), source.files[TEACHER]);
});
t('Escopo: aplicar a mesma edição de novo sobre o 292 é recusado ("já foi aplicada") em cada página', () => {
  throwsWith(() => G.editBlocks(pack.files[PAGE], EDITS), 'já foi aplicada');
  throwsWith(() => G.editBlocks(pack.files[TEACHER], G.BLOCK_EDITS[TEACHER]), 'já foi aplicada');
});

// ---------- 4) o código novo ----------
t('Script: o bloco novo compila e a chamada do sino fica dentro de f(), no fim, com o mesmo número (e) do aviso do pet; as funções novas ficam no nível do bloco', () => {
  const before = inner(source.files[PAGE], SCRIPT), after = inner(pack.files[PAGE], SCRIPT);
  new vm.Script(before); new vm.Script(after);
  assert.ok(before.includes('function f(){const e=t.pending().length,'), 'f() calcula e = t.pending().length, o número do aviso do pet');
  assert.equal(occurrences(after, 'feedbackBell(e)'), 1, 'um só ponto de chamada');
  assert.equal(occurrences(after, 'function feedbackBell('), 1); assert.equal(occurrences(after, 'function feedbackBellInk('), 1);
  assert.equal(occurrences(after, 'feedbackBellInk('), 2, 'definição e uma chamada');
  assert.ok(after.includes('c.classList.toggle("ap-feedback-pending",e>0)),feedbackBell(e)}function feedbackBellInk(hex){'), 'a chamada fecha f() e as funções novas começam logo depois, no mesmo nível de function m');
  assert.ok(after.includes('}function m(e=""){'), 'function m continua onde estava');
  // a chamada está depois do último return de f() em que o aviso é calculado: f() só sai antes por falta de #homeScroll, onde o sino também não existiria
  assert.ok(after.includes('if(!o)return;'), 'a saída antecipada de f() é a falta de #homeScroll');
});
t('Script: o sino só existe com aluno logado e pendência, abre a janela sem argumentos e entra antes do sino de notificações (texto do código novo)', () => { checkJs(jsParts()); });
t('Script: o código novo não usa rede, armazenamento, tempo, áudio, ponte do aplicativo nem eval; só mexe no DOM do sino e no topo; innerHTML só com texto fixo', () => {
  const code = G.JS_CALL + G.JS_INK + G.JS_BELL;
  for (const pattern of FORBIDDEN) assert.ok(!pattern.test(code), String(pattern));
  assert.equal(occurrences(code, 'innerHTML'), 1);
});
t('Script: nenhum nome novo (ids, classes, variável CSS, funções) existe em página do 1.12.291; no 292 só aparecem dentro dos blocos que o gerador muda', () => {
  for (const name of NEW_NAMES) {
    for (const page of Object.keys(source.files)) assert.equal(occurrences(source.files[page], name), 0, name + ' em ' + page + ' do 291');
    for (const page of Object.keys(pack.files)) assert.equal(occurrences(withoutBlocks(pack.files[page], CHANGED[page] || []), name), 0, name + ' fora dos blocos mudados em ' + page + ' do 292');
  }
  for (const name of ['feedbackBell', 'feedbackBellInk']) assert.equal(occurrences(pack.files[TEACHER], name), 0, name + ' (código) não pode estar em professor.html');
});
t('Script: o que o código novo usa existe no bloco do 291 (a, t, m, feedbackCardAccent) e a cor do número segue o contraste (referência WCAG, 256 cinzas, 400 cores e o limite 3:1)', () => {
  const before = inner(source.files[PAGE], SCRIPT);
  for (const part of ['t=APFeedbackSync,a=e=>document.getElementById(e)', 'function m(e=""){', 'function feedbackCardAccent(){']) assert.ok(before.includes(part), 'o bloco do 291 não tem: ' + part);
  checkInk(G.JS_INK);
});
t('Ícone: o desenho é um balão com duas linhas vazadas (três contornos, evenodd), dentro da caixa 24×24, com folga entre as linhas e a borda', () => { checkIcon(G.ICON_PATH); assert.ok(G.JS_BELL.includes('fill-rule="evenodd"')); });

// ---------- 5) o estilo ----------
t('Estilo: só os seletores previstos, nada de @media, @import, url() ou expression, !important só para esconder o botão, e nenhuma regra mexe no topo sem exigir .ap-feedback-bell-on', () => {
  checkCss(G.CSS_BELL, originalBadge(source.files[PAGE]));
});
t('Estilo: o botão herda o tamanho 44×44 do sino de notificações (.home-bell) e o topo original continua com as regras de que o layout novo depende', () => {
  const html = source.files[PAGE];
  assert.ok(html.includes('.student-home .home-bell{width:44px;height:44px;overflow:visible}'), 'tamanho do sino');
  assert.ok(html.includes('.student-home .home-header{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:8px;row-gap:8px;align-items:center}'), 'topo em grade');
  assert.ok(html.includes('id="apHomeDailyMessage"') || html.includes("id='apHomeDailyMessage'") || html.includes('apHomeDailyMessage'), 'a mensagem do dia existe');
  assert.ok(G.CSS_BELL.includes('.ap-feedback-bell svg{width:27px;height:27px;fill:currentColor;stroke:none}'));
});

// ---------- 6) o gerador ----------
t('Gerador: determinístico (duas execuções dão exatamente os mesmos bytes) e não altera a entrada lida', () => {
  assert.equal(JSON.stringify(G.makeUpdate(fresh())), JSON.stringify(pack));
  assert.equal(digest(fs.readFileSync(SOURCE_FILE)), G.SOURCE_SHA256);
});
t('Gerador: linha de comando grava o mesmo conteúdo da função, recusa sobrescrever, recusa entrada trocada ou alterada e pede o arquivo de entrada', () => {
  const run = (args, cwd) => spawnSync(process.execPath, [GENERATOR, ...args], {cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  const target = path.join(workDir, 'saida.agenda.json');
  const first = run([SOURCE_FILE, target], workDir);
  assert.equal(first.status, 0, first.stderr);
  const written = fs.readFileSync(target, 'utf8');
  assert.equal(written, JSON.stringify(pack, null, 2) + '\n');
  assert.notEqual(run([SOURCE_FILE, target], workDir).status, 0, 'não pode sobrescrever');
  assert.equal(fs.readFileSync(target, 'utf8'), written, 'o arquivo existente não pode mudar');
  const standard = run([SOURCE_FILE], workDir);
  assert.equal(standard.status, 0, standard.stderr);
  assert.ok(fs.existsSync(path.join(workDir, 'AgendaPersonal-1.12.292-Sino-Feedback-Para-Assinar.agenda.json')), 'nome padrão, na pasta de onde se roda');
  const altered = path.join(workDir, 'alterado.agenda.json');
  fs.writeFileSync(altered, fs.readFileSync(SOURCE_FILE, 'utf8') + ' ');
  const bad = run([altered, path.join(workDir, 'x2.agenda.json')], workDir);
  assert.notEqual(bad.status, 0); assert.ok(!fs.existsSync(path.join(workDir, 'x2.agenda.json')), 'não pode deixar arquivo pela metade');
  assert.notEqual(run([], workDir).status, 0, 'falta o arquivo de entrada');
});

// ---------- 7) sabotagens (o teste precisa enxergar o erro) ----------
t('Sabotagem: bloco com o texto diferente do 1.12.291 (um comentário a mais) é recusado como conflito, nos dois blocos', () => {
  const html = source.files[PAGE];
  for (const id of BLOCKS) {
    const b = blocksOf(html, [id]).get(id);
    throwsWith(() => G.editBlocks(html.slice(0, b.end) + ' /* mexido */' + html.slice(b.end), EDITS), 'Conflito em ' + id);
  }
});
t('Sabotagem: bloco ausente (id trocado) e página ausente', () => {
  const html = source.files[PAGE];
  for (const id of BLOCKS) {
    const gone = html.replace('id="' + id + '"', 'id="outro-id"');
    assert.notEqual(gone, html, 'o id ' + id + ' devia estar escrito assim na página');
    throwsWith(() => G.editBlocks(gone, EDITS), 'não existe no conteúdo em uso');
  }
  throwsWith(() => G.editBlocks(undefined, EDITS), 'Página ausente');
});
t('Sabotagem: a âncora do fim de f() some ou aparece duas vezes (mesmo com o "antes" de acordo)', () => {
  const html = source.files[PAGE], original = inner(html, SCRIPT);
  for (const changed of [original.split(G.JS_TAIL_BEFORE).join('c.classList.toggle("ap-feedback-pending",e>1))}function m(e=""){'), original + G.JS_TAIL_BEFORE]) {
    const edits = EDITS.map(e => ({...e})); edits[0].before = sha(changed);
    throwsWith(() => G.editBlocks(replaceInner(html, SCRIPT, changed), edits), 'O fim da função f() do feedback do aluno não está como esperado');
  }
});
t('Sabotagem: edição que fecha o bloco antes da hora (</script> ou </STYLE >) e edição com SHA-256 "after" errado', () => {
  const html = source.files[PAGE];
  const close = (index, text) => EDITS.map((e, i) => i === index ? {...e, apply: inner => e.apply(inner) + text} : e);
  throwsWith(() => G.editBlocks(html, close(0, '</script>')), 'fecha o bloco antes da hora');
  throwsWith(() => G.editBlocks(html, close(1, '</STYLE >')), 'fecha o bloco antes da hora');
  for (const index of [0, 1]) {
    const edits = EDITS.map((e, i) => i === index ? {...e, after: (e.after[0] === '0' ? '1' : '0') + e.after.slice(1)} : e);
    throwsWith(() => G.editBlocks(html, edits), 'não ficou como o esperado');
  }
});
t('Sabotagem: página com bloco repetido (id duplicado) é recusada como no aplicativo', () => {
  const html = source.files[PAGE];
  const b = blocksOf(html, [STYLE]).get(STYLE);
  const open = html.lastIndexOf('<', b.start - 1), close = html.indexOf('>', b.end) + 1;
  throwsWith(() => G.editBlocks(html.slice(0, close) + html.slice(open, close) + html.slice(close), EDITS), 'estrutura incompatível');
});
t('Sabotagem: o estilo compartilhado deixa de ser igual (cópia do professor diferente na base, ou edição só em uma das páginas) e o gerador para', () => {
  const diverged = fresh();
  diverged.files[TEACHER] = replaceInner(diverged.files[TEACHER], STYLE, inner(diverged.files[TEACHER], STYLE) + ' ');
  throwsWith(() => G.makeUpdate(diverged), 'já não é igual no aluno e no professor');
  const only = G.BLOCK_EDITS[TEACHER];
  G.BLOCK_EDITS[TEACHER] = [];
  try { throwsWith(() => G.makeUpdate(fresh()), 'ficou diferente entre aluno e professor'); } finally { G.BLOCK_EDITS[TEACHER] = only; }
  assert.equal(JSON.stringify(G.makeUpdate(fresh())), JSON.stringify(pack), 'a sabotagem deixou o gerador diferente');
});
t('Sabotagem: base que não é o 1.12.291 (versão, sequência, aplicativo ou formato diferentes) é recusada', () => {
  for (const [key, value] of [['version', '1.12.290'], ['sequence', 396], ['appId', 'com.outra.coisa'], ['format', 2]]) {
    const s = fresh(); s[key] = value;
    assert.throws(() => G.makeUpdate(s), undefined, key + ' diferente devia ser recusado');
  }
});
t('Sabotagem: arquivo de entrada com um byte diferente é recusado pelo SHA-256 do gerador', () => {
  const altered = path.join(workDir, 'um-byte.agenda.json');
  fs.writeFileSync(altered, fs.readFileSync(SOURCE_FILE, 'utf8') + '\n');
  throwsWith(() => G.loadSource(altered), 'não é o pacote 1.12.291');
});
t('Sabotagem do código novo: versões estragadas do script são recusadas (sem aluno logado, aparece com 0, toque passa o evento, rede, armazenamento, tempo, innerHTML com variável…)', () => {
  const good = jsParts();
  checkJs(good); checkInk(good.ink); // o código verdadeiro passa por exatamente as mesmas verificações
  const mutate = (key, from, to, what) => {
    assert.ok(good[key].includes(from), 'a sabotagem "' + what + '" procura um trecho que não existe mais: ' + from);
    const mutated = {...good, [key]: good[key].split(from).join(to)};
    assert.throws(() => { checkJs(mutated); checkInk(mutated.ink); }, undefined, 'não pegou: ' + what);
  };
  mutate('bell', 'const show=!!t.uid()&&count>0;', 'const show=count>0;', 'sem checar o aluno logado');
  mutate('bell', 'const show=!!t.uid()&&count>0;', 'const show=!!t.uid()&&count>=0;', 'aparece com zero pendentes');
  mutate('bell', 'bell.onclick=()=>m()', 'bell.onclick=m', 'toque passa o evento para m()');
  mutate('bell', 'bell.onclick=()=>m()', 'bell.onclick=()=>m("x")', 'toque passa argumento');
  mutate('bell', 'if(!bell){if(!show)return;', 'if(!bell){', 'cria o botão mesmo sem pendência');
  mutate('bell', 'bell.hidden=!show;', 'bell.hidden=false;', 'não esconde o botão');
  mutate('bell', 'actions.insertBefore(bell,next&&next.parentNode===actions?next:null)', 'actions.appendChild(bell)', 'ordem do botão no topo');
  mutate('bell', 'a("apFeedbackBellCount").textContent=String(count)', 'a("apFeedbackBellCount").innerHTML=String(count)', 'número por innerHTML');
  mutate('bell', '<span id="apFeedbackBellCount" aria-hidden="true"></span>\';', '<span id="apFeedbackBellCount" aria-hidden="true">\'+count+\'</span>\';', 'innerHTML com variável');
  mutate('bell', 'bell.onclick=()=>m()}', 'bell.onclick=()=>m();fetch("/api/x")}', 'rede');
  mutate('bell', 'bell.onclick=()=>m()}', 'bell.onclick=()=>m();localStorage.setItem("a","b")}', 'armazenamento');
  mutate('bell', 'bell.onclick=()=>m()}', 'bell.onclick=()=>m();setTimeout(m,5)}', 'tempo');
  mutate('bell', 'bell.onclick=()=>m()}', 'bell.onclick=()=>m();Android.vibrate(5)}', 'ponte do aplicativo');
  mutate('bell', '"Feedback do treino, "+count+(1===count?" pendente":" pendentes")', '"Feedback do treino, "+count', 'rótulo sem singular e plural');
  mutate('call', ',feedbackBell(e)}', ',feedbackBell(0)}', 'chamada com outro número');
  mutate('ink', ')>=3?', ')>=4.5?', 'limite do contraste');
  mutate('ink', '.2126*c[0]', '.3126*c[0]', 'coeficiente da luminância');
  assert.throws(() => checkInk(good.ink.split(')>=3?').join(')>=4.5?')), undefined, 'o teste de contraste não pegou o limite 4,5:1');
  assert.throws(() => checkInk(good.ink.split('?"#fff":"#0a151e"').join('?"#0a151e":"#fff"')), undefined, 'o teste de contraste não pegou as cores trocadas');
});
t('Sabotagem do estilo: versões estragadas (regra que mexe no topo sem o sino, !important, @media, espaçamento, número com outra geometria) são recusadas', () => {
  const css = G.CSS_BELL, badge = originalBadge(source.files[PAGE]);
  checkCss(css, badge);
  const mutate = (from, to, what) => {
    assert.ok(css.includes(from), 'a sabotagem "' + what + '" procura um trecho que não existe mais: ' + from);
    assert.throws(() => checkCss(css.split(from).join(to), badge), undefined, 'não pegou: ' + what);
  };
  mutate(G.HEADER + ' .home-actions{', '.student-home .home-header .home-actions{', 'regra do topo sem exigir o sino');
  mutate('.ap-feedback-bell[hidden]{display:none!important}', '.ap-feedback-bell[hidden]{display:none!important}.student-home .home-welcome h1{color:red!important}', 'regra a mais com !important');
  mutate('#apFeedbackBellCount{', '@media (max-width:400px){#apFeedbackBellCount{display:none}}#apFeedbackBellCount{', 'media query');
  mutate('column-gap:4px', 'column-gap:8px', 'espaçamento do nome');
  mutate('.home-actions{order:2;margin-left:auto;gap:4px}', '.home-actions{order:2;margin-left:auto;gap:8px}', 'espaçamento dos ícones');
  mutate('min-width:19px;height:19px', 'min-width:20px;height:19px', 'tamanho do número');
  mutate('overflow-wrap:break-word', 'overflow-wrap:anywhere', 'nome partido no meio da palavra');
  mutate('background:var(--home-accent)', 'background:red', 'cor do número');
});
t('Sabotagem: as sabotagens não estragaram a entrada (o teste termina com o mesmo SHA-256 do arquivo e o mesmo pacote)', () => {
  assert.equal(digest(fs.readFileSync(SOURCE_FILE)), G.SOURCE_SHA256);
  assert.equal(JSON.stringify(G.makeUpdate(fresh())), JSON.stringify(pack));
});

(async () => {
  for (const [name, fn] of queue) {
    try { await fn(); ok++; console.log('OK   ' + name); } catch (e) { bad++; console.log('FALHA ' + name + '\n     ' + String(e && e.message || e).split('\n').join('\n     ')); }
  }
  fs.rmSync(workDir, {recursive: true, force: true});
  console.log('\n' + ok + ' ok, ' + bad + ' com falha, de ' + queue.length);
  process.exit(bad ? 1 : 0);
})();
