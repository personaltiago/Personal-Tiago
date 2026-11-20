'use strict';
// Confere o pacote 1.12.294 (ícone do feedback personalizável, sobre o 1.12.292) sem navegador e sem internet:
//   node equipe/testes/icone-feedback.smoke.cjs
// O que confere:
//  - a entrada: o pacote 1.12.292 entregue ao Tiago (SHA-256 82f41147…); se não estiver na raiz (nem em PACOTE_292), é refeito pelo gerador do
//    292 a partir do 291 (que sai da main) e conferido pelo mesmo SHA-256;
//  - o pacote: versão 1.12.294, sequência 400 (= 398 + 2 = versão + 106; o 293 foi descartado), ordem das chaves, sem assinatura, limites de
//    notas, resumo e tamanho;
//  - o escopo: no index.html mudam SÓ os dois blocos do feedback do aluno (script e estilo); no professor.html SÓ a cópia do estilo (as duas
//    cópias têm de continuar iguais: componente compartilhado); avaliacoes.html, cadastro.html, histórico de correções e demais campos ficam
//    iguais; desfazendo só o que o gerador acrescentou, o 292 volta byte a byte;
//  - os 19 ícones: manifesto (caminhos SVG de uma cor só, SHA-256 de cada um), o padrão é o balão do 292 byte a byte, todos dentro da grade
//    24×24, e o que está embutido na página é exatamente o manifesto;
//  - COR E TAMANHO (a correção do 293): nenhum desenho tem cor própria (tudo é currentColor = a cor de destaque do aluno, a mesma do sino e do
//    WhatsApp), nenhuma regra nova mexe no botão do topo (o svg de 27 px do 292 vale para os 19) e a linha do Perfil tem o tamanho das outras;
//  - o código novo (texto): sem rede, sem timers, sem notificações, sem som, sem armazenamento próprio (só o APstudentStorage da conta),
//    só dois membros do APFeedbackSync (uid e pending), innerHTML só com texto fixo e dados do próprio pacote, nomes que não existem em
//    nenhuma página do 292, sintaxe, chaves e parênteses balanceados;
//  - o estilo novo: só seletores da linha/painel do Perfil e das classes ap-fbicon-; sem movimento, sem @import, nada que mude o topo;
//    alvos de toque de pelo menos 48 px; !important só na regra [hidden];
//  - o gerador: determinismo, linha de comando (mesmo conteúdo, recusa sobrescrever, recusa entrada trocada) e sabotagens: bloco alterado,
//    ausente ou duplicado, âncora que some, edição repetida, hash errado, desenho adulterado/repetido/fora de ordem/com marcação, notas
//    com marcador, resumo grande, numeração errada, e defeitos no código e no estilo (inclusive cor fixa e tamanho trocado).
// O comportamento na tela é conferido no Chrome real (equipe/testes/navegador/icone-feedback), a importação e a RETENÇÃO das correções
// da main pelo código Java real do aplicativo (equipe/testes/icone-feedback.java.py). Nada disso substitui o teste no celular.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const {spawnSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-icone-feedback-1.12.294.cjs');
const G = require(GENERATOR);
const G291 = require(path.join(ROOT, 'tools/gerar-correcoes-exercicios-1.12.291.cjs'));
const {locate292, SHA256_292} = require('./pacote-292.cjs');

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'icone-294-'));
process.on('exit', () => { try { fs.rmSync(workDir, {recursive: true, force: true}); } catch (e) {} });

let SOURCE_FILE, source, pack, icons;
try {
  SOURCE_FILE = locate292(workDir); // PACOTE_292, a raiz do repositório ou refeito pelos geradores (sempre conferido pelo SHA-256)
  source = G.loadSource(SOURCE_FILE);
  icons = G.loadIcons();
  pack = G.makeUpdate(source);
} catch (problem) {
  console.log('FALHA ao montar o pacote 1.12.294:\n     ' + String(problem && problem.message || problem).split('\n').join('\n     '));
  console.log('\n0 ok, 1 com falha');
  process.exit(1);
}
const fresh = () => G.loadSource(SOURCE_FILE);
let ok = 0, bad = 0;
const queue = [];
const t = (n, f) => queue.push([n, f]);
const throwsWith = (fn, part, what) => {
  let error = null;
  try { fn(); } catch (e) { error = e; }
  assert.ok(error, (what || 'devia recusar') + ': nada foi recusado');
  assert.ok(String(error.message).includes(part), (what || 'recusa') + ': a mensagem era "' + String(error.message).slice(0, 200) + '", esperava conter "' + part + '"');
};
const occurrences = (text, part) => { let n = 0; for (let i = text.indexOf(part); i >= 0; i = text.indexOf(part, i + part.length)) n++; return n; };

const PAGE = 'index.html', TEACHER = 'professor.html';
const SCRIPT = 'ap-feedback-student', STYLE = 'ap-feedback-css';
const CHANGED = {[PAGE]: [SCRIPT, STYLE], [TEACHER]: [STYLE]};
const blocksOf = (html, ids) => G291.findBlocks(html, new Set(ids));
const inner = (html, id) => { const b = blocksOf(html, [id]).get(id); return b ? html.slice(b.start, b.end) : null; };
// A mesma página com o texto de dentro dos blocos pedidos trocado por um marcador: o que sobra é "tudo o que não é desses blocos".
function withoutBlocks(html, ids) {
  const found = [...blocksOf(html, ids).entries()].sort((a, b) => a[1].start - b[1].start);
  let out = '', from = 0;
  for (const [id, b] of found) { out += html.slice(from, b.start) + '«' + id + '»'; from = b.end; }
  return out + html.slice(from);
}

// Caixa de um caminho SVG pelos pontos finais e de controle (uma caixa que contém o desenho: se ela cabe na grade, o desenho cabe).
function pathBox(d) {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let at = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
  const points = [], num = () => parseFloat(tokens[at++]);
  while (at < tokens.length) {
    if (/[A-Za-z]/.test(tokens[at])) cmd = tokens[at++];
    const rel = cmd === cmd.toLowerCase(), c = cmd.toUpperCase();
    if (c === 'Z') { x = sx; y = sy; continue; }
    if (c === 'M' || c === 'L') { let a = num(), b = num(); if (rel) { a += x; b += y; } x = a; y = b; points.push([x, y]); if (c === 'M') { sx = x; sy = y; cmd = rel ? 'l' : 'L'; } }
    else if (c === 'H') { let a = num(); if (rel) a += x; x = a; points.push([x, y]); }
    else if (c === 'V') { let b = num(); if (rel) b += y; y = b; points.push([x, y]); }
    else if (c === 'Q') { let a = num(), b = num(), e = num(), f = num(); if (rel) { a += x; b += y; e += x; f += y; } points.push([a, b], [e, f]); x = e; y = f; }
    else if (c === 'C') { let a = num(), b = num(), e = num(), f = num(), g = num(), h = num(); if (rel) { a += x; b += y; e += x; f += y; g += x; h += y; } points.push([a, b], [e, f], [g, h]); x = g; y = h; }
    else if (c === 'A') { num(); num(); num(); num(); num(); let a = num(), b = num(); if (rel) { a += x; b += y; } x = a; y = b; points.push([x, y]); }
    else throw new Error('comando de caminho não previsto: ' + cmd);
  }
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  return {x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys)};
}

// ---------- partes do código novo ----------
const newScript = inner(pack.files[PAGE], SCRIPT), oldScript = inner(source.files[PAGE], SCRIPT);
const newCss = inner(pack.files[PAGE], STYLE), oldCss = inner(source.files[PAGE], STYLE);
const JS_NEW = G.JS_NEW;
const HEAD = G.jsHead(icons);
// O único literal de expressão regular do código novo tem um "(" escapado de propósito; tirado dele, os pares precisam fechar.
const noRegex = js => js.split('/profileSettings\\(/').join('/profileSettings/');
const FORBIDDEN = [/\bfetch\b/, /\bXMLHttpRequest\b/, /\bsendBeacon\b/, /\bWebSocket\b/, /\bEventSource\b/, /\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /\bcookie\b/,
  /\bsetTimeout\b/, /\bsetInterval\b/, /\brequestAnimationFrame\b/, /\bAndroid\w*/, /\bwebkit\b/, /\bpostMessage\b/, /\bNotification\b/, /\bvibrate\b/, /\bAudio\w*/, /\beval\b/,
  /\bFunction\s*\(/, /document\.write/, /\blocation\b/, /\bhistory\b/, /window\.open/, /\bimport\s*\(/, /\bnavigator\b/, /\bfirebase\b/i, /\bfirestore\b/i, /\bsubmit\b/, /\bdraft\b/,
  /\bAPaccounts\b/, /\bAPFeedbackModel\b/, /\bclipboard\b/];
// Cor própria num desenho: atributo fill/stroke/style, cor em hexadecimal, rgb()/hsl(), ou o roxo do 293. Tudo deve vir de currentColor.
const OWN_COLOR = [/\bfill="/, /\bstroke="/, /\bstyle="/, /#[0-9a-fA-F]{3,8}\b/, /\brgba?\(/, /\bhsla?\(/, /8f35df/i];

// 1. A entrada e o pacote ---------------------------------------------------------------------------------------------------------
t('Entrada: o pacote 1.12.292 conferido pelo SHA-256 ' + SHA256_292.slice(0, 8) + '… (1.12.292, sequência 398)', () => {
  assert.equal(source.version, '1.12.292'); assert.equal(source.sequence, 398); assert.ok(!source.agendaSignature, 'o 292 de partida não pode estar assinado');
});
t('Pacote: versão 1.12.294, sequência 400 = 398 + 2 = 294 + 106 (o 293 foi descartado), sem assinatura', () => {
  assert.equal(pack.version, '1.12.294'); assert.equal(pack.sequence, 400); assert.equal(pack.sequence, source.sequence + 2); assert.equal(pack.sequence - 106, 294);
  assert.ok(!('agendaSignature' in pack), 'quem assina é o fluxo do GitHub');
});
t('Pacote: ordem das chaves como a dos pacotes anteriores e os campos que não são da mudança iguais ao 292', () => {
  const expected = ['format', 'appId', 'bridgeVersion', 'dataSchema', 'version', 'sequence', 'files', 'notes', 'update', 'modularUpdates'];
  assert.deepEqual(Object.keys(pack), expected); assert.deepEqual(Object.keys(source), expected);
  for (const k of ['format', 'appId', 'bridgeVersion', 'dataSchema']) assert.deepEqual(pack[k], source[k], k);
  assert.deepEqual(pack.modularUpdates, source.modularUpdates, 'o pacote completo não acrescenta registro ao histórico de correções');
  assert.deepEqual(Object.keys(pack.update), Object.keys(source.update));
  for (const k of Object.keys(source.update)) if (k !== 'title' && k !== 'summary') assert.deepEqual(pack.update[k], source.update[k], 'update.' + k);
  assert.equal(pack.update.title, G.title); assert.equal(pack.update.summary, G.summary);
});
t('Pacote: notas até 4000 letras, resumo até 200, sem marcador por preencher, menos de 24 MiB', () => {
  assert.ok(pack.notes.length <= 4000 && pack.notes.length > 800, 'notas: ' + pack.notes.length); assert.ok(pack.update.summary.length <= 200, 'resumo: ' + pack.update.summary.length);
  assert.ok(!pack.notes.includes('@@') && !pack.update.summary.includes('@@'));
  assert.ok(Buffer.byteLength(JSON.stringify(pack, null, 2) + '\n', 'utf8') < 24 * 1024 ** 2);
});
t('Notas: dizem o que o aluno vê, a cor e o tamanho, que a escolha fica só no aparelho, que o pacote mantém o que está na main (Raposinha fora) e que o 293 foi substituído', () => {
  for (const part of ['Ícone do feedback', 'Meu perfil', 'Configurações', '19 ícones', 'balão do 1.12.292', 'cor de destaque', 'sino de notificações', 'WhatsApp', '27 px', 'só no aparelho',
    'não vai para o Firebase', 'não acompanha o aluno em outro aparelho', 'completo e cumulativo', 'nenhuma se perde', 'Raposinha',
    'descanso, cronômetros, alarmes e notificações não foram mexidos', 'substitui o 1.12.293'])
    assert.ok(pack.notes.includes(part), 'faltou nas notas: ' + part);
  assert.deepEqual(pack.notes.match(/roxo[^.]*/g), ['roxo fixo'], 'o único roxo citado nas notas é o do 293 que foi descartado');
});
t('Escopo: avaliacoes.html e cadastro.html são byte a byte os do 292', () => {
  for (const page of ['avaliacoes.html', 'cadastro.html']) assert.equal(pack.files[page], source.files[page], page);
  assert.deepEqual(Object.keys(pack.files), Object.keys(source.files));
});
t('Escopo: no index.html só mudam o script e o estilo do feedback do aluno; no professor.html só a cópia do estilo', () => {
  for (const [page, ids] of Object.entries(CHANGED)) {
    assert.equal(withoutBlocks(pack.files[page], ids), withoutBlocks(source.files[page], ids), page + ': algo fora dos blocos mudou');
    for (const id of ids) assert.notEqual(inner(pack.files[page], id), inner(source.files[page], id), page + ' ' + id + ' devia mudar');
  }
  assert.equal(inner(pack.files[TEACHER], SCRIPT), inner(source.files[TEACHER], SCRIPT), 'o professor não pode ganhar o script novo');
});
t('Escopo: o estilo do feedback é IGUAL no aluno e no professor (componente compartilhado) e o sha256 é o previsto', () => {
  assert.equal(inner(pack.files[PAGE], STYLE), inner(pack.files[TEACHER], STYLE));
  assert.equal(G.sha256(newCss), G.CSS_EDIT.after); assert.equal(G.sha256(newScript), G.SCRIPT_EDIT.after);
  assert.equal(G.sha256(oldCss), G.CSS_EDIT.before); assert.equal(G.sha256(oldScript), G.SCRIPT_EDIT.before);
  assert.ok(G.SHARED_BLOCKS.includes(STYLE));
});
t('Reversão: tirando só o que o gerador acrescentou, o bloco do script e o do estilo do 292 voltam byte a byte', () => {
  const back = newScript.split(HEAD).join(G.JS_HEAD_BEFORE).split(G.JS_FACE_AFTER).join(G.JS_FACE_BEFORE).split(G.JS_TAIL_AFTER).join(G.JS_TAIL_BEFORE);
  assert.equal(back, oldScript, 'script');
  assert.ok(newCss.endsWith(G.CSS_ICON)); assert.equal(newCss.slice(0, newCss.length - G.CSS_ICON.length), oldCss, 'estilo');
  for (const part of [HEAD, G.JS_FACE_AFTER, G.JS_TAIL_AFTER]) assert.equal(occurrences(newScript, part), 1, 'cada acréscimo entra uma única vez');
});

// 2. Os 19 ícones (caminhos SVG) -------------------------------------------------------------------------------------------------
const manifest = JSON.parse(fs.readFileSync(path.join(G.ICON_DIR, 'icones.json'), 'utf8'));
t('Ícones: 19, o padrão primeiro e igual ao balão do 292 byte a byte, ids, nomes e desenhos únicos, SHA-256 de cada caminho conferido', () => {
  assert.equal(manifest.grade, 24); assert.equal(icons.length, 19); assert.equal(icons[0].id, 'padrao'); assert.equal(icons[0].d, G.ICON_292);
  assert.equal(new Set(icons.map(i => i.id)).size, 19); assert.equal(new Set(icons.map(i => i.name)).size, 19); assert.equal(new Set(icons.map(i => i.d)).size, 19);
  for (const i of manifest.icones) assert.equal(G.sha256(i.d), i.sha256, i.id);
});
t('Ícones: o padrão do 292 está no botão do topo do 292 (o mesmo caminho) e é o primeiro da lista nova', () => {
  assert.equal(occurrences(oldScript, 'd="' + G.ICON_292 + '"'), 1, 'o balão do 292 tem de aparecer uma vez no script do 292');
});
t('Ícones: só comandos de caminho SVG (nada que feche aspas ou abra marcação), cada um com menos de 4000 letras e o conjunto com menos de 40 KB', () => {
  let total = 0;
  for (const i of icons) { assert.ok(G.PATH_CHARS.test(i.d) && /^M/.test(i.d), i.id); assert.ok(i.d.length > 40 && i.d.length < 4000, i.id + ' ' + i.d.length); total += i.d.length; }
  assert.ok(total < 40 * 1024, 'conjunto: ' + total);
});
t('Ícones: todos dentro da grade 24×24 com folga (nenhum ponto do desenho fora de 1,5 a 22,5), então o viewBox não corta nada', () => {
  for (const i of icons) {
    const b = pathBox(i.d);
    assert.ok(b.x0 >= 1.5 && b.x1 <= 22.5 && b.y0 >= 1.5 && b.y1 <= 22.5, i.id + ' ' + JSON.stringify(b));
    assert.ok(b.x1 - b.x0 >= 17 && b.y1 - b.y0 >= 14, i.id + ' é pequeno demais: ' + JSON.stringify(b));
  }
});
t('Ícones: o que está embutido na página é exatamente a lista do manifesto (ids, nomes, ordem e caminhos)', () => {
  const start = newScript.indexOf('FB_ICONS=') + 9, end = newScript.indexOf(';const r=new MutationObserver(');
  assert.ok(start > 9 && end > start);
  const inPage = JSON.parse(newScript.slice(start, end));
  assert.deepEqual(inPage, icons);
  assert.deepEqual(inPage.map(i => i.id), manifest.icones.map(i => i.id)); assert.deepEqual(inPage.map(i => i.name), manifest.icones.map(i => i.nome)); assert.deepEqual(inPage.map(i => i.d), manifest.icones.map(i => i.d));
});
t('Ícones: nenhum é imagem (sem data:image, base64, <img nem endereço no código novo e na lista; o único url() do estilo é a marca de visto em SVG)', () => {
  for (const text of [JS_NEW, HEAD]) assert.ok(!/data:image|base64|<img|https?:|\.webp|\.png/i.test(text), 'achei imagem ou endereço no código novo');
  const urls = [...G.CSS_ICON.matchAll(/url\(([^)]*)\)/g)].map(m => m[1]);
  assert.equal(urls.length, 1); assert.ok(urls[0].startsWith('"data:image/svg+xml,'), urls[0].slice(0, 40));
});

// 3. COR E TAMANHO ---------------------------------------------------------------------------------------------------------------
const rules = [...G.CSS_ICON.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({selector: m[1].trim(), body: m[2]}));
const ruleOf = (list, selector) => { const r = list.find(x => x.selector === selector); assert.ok(r, 'regra não achada: ' + selector); return r.body; };
// Tudo o que decide cor e tamanho, num só lugar (as sabotagens abaixo usam a mesma função em cópias com defeito).
function checkColorAndSize(js, css) {
  const rs = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({selector: m[1].trim(), body: m[2]}));
  for (const p of OWN_COLOR) assert.ok(!p.test(js), 'o código novo tem cor própria: ' + p);
  const paths = [...js.matchAll(/<path ([^>]*)>/g)].map(m => (m[1].match(/[\w-]+(?==)/g) || []).join(','));
  assert.ok(paths.length >= 2 && paths.every(a => a === 'fill-rule,d'), 'o <path> do código novo só pode ter fill-rule e d: ' + JSON.stringify(paths));
  const now = ruleOf(rs, '#profileScreen .ap-fbicon-now'), nowSvg = ruleOf(rs, '#profileScreen .ap-fbicon-now svg');
  const opt = ruleOf(rs, '.ap-fbicon-opt'), face = ruleOf(rs, '.ap-fbicon-face'), faceSvg = ruleOf(rs, '.ap-fbicon-face svg');
  assert.ok(/(^|;)color:var\(--prof-accent\)(;|$)/.test(now) && /(^|;)color:var\(--prof-accent\)(;|$)/.test(opt), 'a cor do desenho tem de ser a cor de destaque do Perfil (--prof-accent)');
  for (const body of [nowSvg, faceSvg]) assert.ok(/(^|;)fill:currentColor(;|$)/.test(body) && /(^|;)stroke:none(;|$)/.test(body), 'o desenho tem de ser preenchido com currentColor: ' + body);
  assert.ok(!/(^|;)(color|fill|stroke):(?!currentColor|var\(--prof-accent\)|none)/.test(now + ';' + nowSvg + ';' + opt + ';' + faceSvg), 'cor fixa no desenho');
  assert.ok(!/8f35df/i.test(css), 'o roxo do 293 não pode voltar');
  assert.ok(/width:27px;height:27px/.test(nowSvg), 'o desenho da linha do Perfil tem 27 px (o das outras linhas)');
  assert.ok(/width:27px;height:27px/.test(now), 'a caixa do desenho da linha do Perfil tem 27 px');
  assert.ok(/width:52px;height:52px/.test(opt) && /width:28px;height:28px/.test(faceSvg), 'opção de 52 px com desenho de 28 px');
  assert.ok(!rs.some(r => /ap-feedback-bell|\.student-home|\.home-|apStudentNotification|apGroupButton/.test(r.selector)), 'nenhuma regra nova pode mexer no botão nem no topo do Início');
  assert.ok(!/setAttribute\("(fill|stroke|style|class|width|height|viewBox)"/.test(js), 'o código novo não pode trocar cor, tamanho nem classe do botão');
  assert.ok(/background:linear-gradient\(120deg,#08171f,#050e15\)/.test(face) && !rs.some(r => /profile-light/.test(r.selector) && /ap-fbicon-face/.test(r.selector) && /background/.test(r.body)),
    'os quadradinhos são escuros também no modo claro');
}
t('Cor: nenhum desenho tem cor própria; no código e no estilo tudo vem de currentColor = cor de destaque do aluno (a do sino e a do WhatsApp)', () => checkColorAndSize(JS_NEW + HEAD, G.CSS_ICON));
t('Cor: o botão do topo não tem regra nova (a cor é a do 292, a mesma do WhatsApp e do sino) e o svg de 27 px do 292 vale para os 19 desenhos', () => {
  assert.ok(!/ap-feedback-bell/.test(G.CSS_ICON), 'nenhuma regra nova toca o botão do topo');
  assert.ok(oldCss.includes('.student-home .ap-feedback-bell svg{width:27px;height:27px;fill:currentColor;stroke:none}'), 'o 292 já define o svg do botão: 27 px, currentColor');
  assert.ok(oldCss.includes('width:44px') && oldCss.includes('height:44px'), 'o botão do 292 é 44×44');
  assert.ok(G.JS_FACE_AFTER.endsWith('feedbackBellFace(bell);') && JS_NEW.includes('path.setAttribute("d",icon.d)'), 'o desenho do botão só troca o d do <path> que já existe');
});

// 4. O código novo (texto) --------------------------------------------------------------------------------------------------------
t('Código: sintaxe válida do bloco inteiro e chaves/parênteses balanceados no que foi acrescentado', () => {
  new vm.Script(newScript, {filename: 'ap-feedback-student.js'});
  for (const [o, c] of [['{', '}'], ['(', ')'], ['[', ']']]) assert.equal(occurrences(noRegex(JS_NEW), o), occurrences(noRegex(JS_NEW), c), 'desbalanceado: ' + o + c);
});
t('Código: sem rede, timers, notificações, som, armazenamento próprio, navegação nem Firebase', () => {
  for (const pattern of FORBIDDEN) assert.ok(!pattern.test(JS_NEW), 'o código novo usa ' + pattern);
  for (const pattern of FORBIDDEN) assert.ok(!pattern.test(G.JS_FACE_AFTER.slice(G.JS_FACE_BEFORE.length)), 'a chamada nova usa ' + pattern);
});
t('Código: a única coisa gravada é a chave agenda_demo_feedback_icon, pelo APstudentStorage (que separa por conta)', () => {
  assert.ok(HEAD.includes('FB_ICON_KEY="agenda_demo_feedback_icon"')); assert.ok(/^agenda_demo_/.test('agenda_demo_feedback_icon'));
  assert.equal(occurrences(JS_NEW, 'APstudentStorage.setItem('), 1); assert.equal(occurrences(JS_NEW, 'APstudentStorage.getItem('), 1);
  assert.deepEqual([...new Set((JS_NEW.match(/APstudentStorage\.\w+/g) || []))].sort(), ['APstudentStorage.getItem', 'APstudentStorage.setItem']);
  assert.ok(!/removeItem|\.clear\(/.test(JS_NEW), 'o código novo não apaga nada');
});
t('Código: do APFeedbackSync só usa uid() e pending() (não lê nem muda feedback, rascunho, fila ou resposta)', () => {
  const members = [...new Set([...JS_NEW.matchAll(/\bt\.(\w+)/g)].map(m => m[1]))].sort();
  assert.deepEqual(members, ['pending', 'uid']);
});
t('Código: o único evento que dispara é ap-feedback-icon-changed, com o id do ícone; escuta só ap-student-ready, ap-account-changed, click e change', () => {
  assert.deepEqual([...new Set([...JS_NEW.matchAll(/new CustomEvent\("([^"]+)"/g)].map(m => m[1]))], ['ap-feedback-icon-changed']);
  assert.deepEqual([...new Set([...JS_NEW.matchAll(/addEventListener\("([^"]+)"/g)].map(m => m[1]))].sort(), ['ap-account-changed', 'ap-student-ready', 'change', 'click']);
  assert.ok(JS_NEW.includes('detail:{id:icon.id}'));
});
t('Código: innerHTML só com texto fixo e dados do próprio pacote (id, nome e caminho escapados por n())', () => {
  assert.equal(occurrences(JS_NEW, 'innerHTML'), 3, 'abrir (texto fixo), painel (texto fixo + lista de ícones) e a seta (símbolo do Perfil)');
  assert.ok(JS_NEW.includes('value="\'+n(x.id)+\'" aria-label="\'+n(x.name)+\'"'), 'ids e nomes entram escapados');
  assert.ok(JS_NEW.includes('d="\'+n(x.d)+\'"'), 'o caminho entra escapado');
  const dynamic = [...JS_NEW.matchAll(/'\+([^+']+?)\+'/g)].map(m => m[1]).filter(s => !/^"/.test(s));
  for (const d of dynamic) assert.ok(/^n\(x\.(id|name|d)\)$/.test(d), 'interpolação inesperada em innerHTML: ' + d);
  assert.ok(JS_NEW.includes('chevron.innerHTML=profileSymbol("chevron")'));
});
t('Código: o botão do topo só ganha o desenho depois de decidir que aparece (sem pendência nada é criado nem pintado)', () => {
  assert.equal(G.JS_FACE_AFTER, G.JS_FACE_BEFORE + 'feedbackBellFace(bell);');
  assert.ok(G.JS_FACE_BEFORE.endsWith('if(!show)return;'), 'a chamada nova fica DEPOIS de "if(!show)return;"');
  assert.ok(JS_NEW.includes('bell.dataset.icon!==icon.id') && JS_NEW.includes('path.setAttribute("d",icon.d)'), 'só troca o caminho quando o ícone muda (não repinta o tempo todo)');
});
t('Código: a linha do Perfil só existe para aluno logado, vem logo depois de Configurações e se refaz quando o Perfil é redesenhado', () => {
  assert.ok(JS_NEW.includes('open.hidden=!show') && JS_NEW.includes('show=!!t.uid()'));
  assert.ok(JS_NEW.includes('/profileSettings\\(/.test(x.getAttribute("onclick")||"")') && JS_NEW.includes('settings?settings.after(open,panel):list.append(open,panel)'));
  assert.ok(JS_NEW.includes('profileRender=function(...ev){const result=original.apply(this,ev);try{feedbackIconRow()}catch(_){}return result}'));
  assert.ok(JS_NEW.includes('matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"'), 'respeita "reduzir movimento"');
  assert.ok(JS_NEW.includes('panel.focus({preventScroll:!0})'));
});
t('Código: acessibilidade da lista (rádios de verdade, rótulo por ícone, grupo rotulado, região viva educada, desenho escondido do leitor de tela)', () => {
  for (const part of ['type="radio" name="apFeedbackIcon"', 'role="radiogroup"', 'aria-labelledby="apFeedbackIconTitle"', 'role="status" aria-live="polite"', 'aria-expanded', 'aria-controls', 'aria-hidden="true"'])
    assert.ok(JS_NEW.includes(part) || JS_NEW.includes(part.replace(/"/g, '\\"')), 'faltou: ' + part);
});
t('Nomes: nenhum nome novo do código ou do estilo existe em qualquer página do 292 (nada colide)', () => {
  const names = ['feedbackIcon(', 'feedbackBellFace', 'feedbackIconSync', 'feedbackIconChoose', 'feedbackIconRow', 'FB_ICON_KEY', 'FB_ICONS', 'apFeedbackIconOpen', 'apFeedbackIconPanel',
    'apFeedbackIconStatus', 'apFeedbackIconTitle', 'ap-fbicon-', 'ap-feedback-icon-changed', 'agenda_demo_feedback_icon', 'apFeedbackIcon'];
  for (const page of Object.keys(source.files)) for (const n of names) assert.equal(occurrences(source.files[page], n), 0, n + ' já existe em ' + page + ' do 292');
});

// 5. O estilo novo -----------------------------------------------------------------------------------------------------------------
t('Estilo: 18 regras e todas só alcançam a linha/painel do ícone ou classes ap-fbicon- (nenhuma o botão do topo)', () => {
  assert.equal(rules.length, 18);
  for (const r of rules) for (const part of r.selector.split(',')) assert.ok(/apFeedbackIcon|ap-fbicon|profileScreen/.test(part), 'seletor fora do combinado: ' + part);
  for (const r of rules) for (const part of r.selector.split(',')) assert.ok(!/^(html|body|\*|:root|\.home-header|\.home-actions|\.topbar|dialog)\b/.test(part.trim()) && !/ap-feedback-bell|\.student-home/.test(part), 'seletor largo demais: ' + part);
});
t('Estilo: sem movimento, sem @import, sem endereço externo, sem aspect-ratio/inset/color-mix (Safari antigo); !important só na regra [hidden]', () => {
  assert.ok(!/animation|transition|@keyframes|@import|@font-face|position:\s*fixed|\bfilter\b|\bblur\b/.test(G.CSS_ICON));
  assert.ok(!/aspect-ratio|\binset:|color-mix/.test(G.CSS_ICON), 'recurso de navegador novo demais');
  assert.ok(!/https?:/.test(G.CSS_ICON.split(G.CHECK).join('')), 'endereço externo (o único http é o xmlns da marca de visto, que não é um endereço de rede)');
  assert.deepEqual(rules.filter(r => /!important/.test(r.body)).map(r => r.selector), ['#apFeedbackIconOpen[hidden],#apFeedbackIconPanel[hidden]']);
});
t('Estilo: alvo de toque de 52 px (grade de colunas de 52 px) e foco visível para o teclado', () => {
  assert.ok(ruleOf(rules, '.ap-fbicon-grid').includes('repeat(auto-fill,52px)'));
  assert.ok(ruleOf(rules, '.ap-fbicon-opt').includes('width:52px;height:52px'));
  assert.ok(ruleOf(rules, '.ap-fbicon-opt input:focus-visible+.ap-fbicon-face').includes('outline:2px dashed currentColor'), 'foco visível para o teclado');
});
t('Estilo: o modo claro tem texto próprio (#526271) e foco escuro (#1e3040); os quadradinhos são escuros nos dois modos; a marca de visto é escura com anel na cor de destaque', () => {
  assert.ok(ruleOf(rules, '#profileScreen.profile-light .ap-fbicon-panel p').includes('#526271'));
  assert.ok(ruleOf(rules, '#profileScreen.profile-light .ap-fbicon-opt input:focus-visible+.ap-fbicon-face').includes('outline-color:#1e3040'));
  assert.ok(ruleOf(rules, '.ap-fbicon-face').includes('linear-gradient(120deg,#08171f,#050e15)'));
  const check = rules.find(r => /input:checked\+\.ap-fbicon-face::after/.test(r.selector));
  assert.ok(check && /\bbackground:#0a151e url\(/.test(G.CSS_ICON) && check.body.includes('box-shadow:0 0 0 2px currentColor'));
});

// 6. O gerador ------------------------------------------------------------------------------------------------------------------
t('Gerador: determinístico (duas montagens dão o mesmo texto) e o JSON sai em 2 espaços com quebra de linha no fim', () => {
  const a = JSON.stringify(G.makeUpdate(fresh()), null, 2), b = JSON.stringify(G.makeUpdate(fresh()), null, 2);
  assert.equal(a, b); assert.equal(a, JSON.stringify(pack, null, 2));
});
t('Gerador: linha de comando gera o mesmo conteúdo, recusa sobrescrever e recusa entrada trocada', () => {
  const out = path.join(workDir, 'saida-cli.agenda.json');
  const run = (...args) => spawnSync(process.execPath, [GENERATOR, ...args], {encoding: 'utf8'});
  const r1 = run(SOURCE_FILE, out); assert.equal(r1.status, 0, r1.stderr);
  assert.equal(fs.readFileSync(out, 'utf8'), JSON.stringify(pack, null, 2) + '\n');
  assert.notEqual(run(SOURCE_FILE, out).status, 0, 'devia recusar sobrescrever um arquivo existente');
  const other = path.join(workDir, 'outro.agenda.json'); fs.writeFileSync(other, fs.readFileSync(SOURCE_FILE, 'utf8').replace('"1.12.292"', '"1.12.292 "'));
  const r2 = run(other, path.join(workDir, 'saida-2.agenda.json')); assert.notEqual(r2.status, 0); assert.ok(/SHA-256 diferente/.test(r2.stderr), r2.stderr.slice(0, 300));
  assert.notEqual(run().status, 0, 'sem argumentos devia recusar');
});

// 7. Sabotagens: o teste precisa PEGAR cada defeito -------------------------------------------------------------------------------------
const tamper = (html, id, fn) => { const b = blocksOf(html, [id]).get(id); return html.slice(0, b.start) + fn(html.slice(b.start, b.end)) + html.slice(b.end); };
t('Sabotagem: bloco do script alterado em 1 letra → conflito', () => {
  const s = fresh(); s.files[PAGE] = tamper(s.files[PAGE], SCRIPT, x => x + ' ');
  throwsWith(() => G.makeUpdate(s), 'Conflito em ' + SCRIPT);
});
t('Sabotagem: estilo do feedback alterado igualmente nas duas páginas → conflito (não é mais o do 1.12.292)', () => {
  const s = fresh(); for (const page of [PAGE, TEACHER]) s.files[page] = tamper(s.files[page], STYLE, x => x + ' ');
  throwsWith(() => G.makeUpdate(s), 'Conflito em ' + STYLE);
});
t('Sabotagem: estilo diferente entre aluno e professor já na entrada → recusa pela regra do componente compartilhado', () => {
  const s = fresh(); s.files[TEACHER] = tamper(s.files[TEACHER], STYLE, x => x + ' ');
  throwsWith(() => G.makeUpdate(s), 'já não é igual no aluno e no professor');
});
t('Sabotagem: bloco ausente (id trocado) → recusa', () => {
  const s = fresh(); s.files[PAGE] = s.files[PAGE].replace('<script id="' + SCRIPT + '">', '<script id="' + SCRIPT + '-x">');
  throwsWith(() => G.makeUpdate(s), 'não existe');
});
t('Sabotagem: bloco duplicado na página → recusa', () => {
  const s = fresh(); s.files[PAGE] += '\n<style id="' + STYLE + '">.x{}</style>\n';
  assert.throws(() => G.makeUpdate(s));
});
t('Sabotagem: pacote que já tem a mudança (aplicar duas vezes) → "já foi aplicada" (e o gerador, sobre o 294, recusa pela versão)', () => {
  throwsWith(() => G.editBlocks(pack.files[PAGE], G.BLOCK_EDITS[PAGE]), 'já foi aplicada');
  throwsWith(() => G.editBlocks(pack.files[TEACHER], G.BLOCK_EDITS[TEACHER]), 'já foi aplicada');
  throwsWith(() => G.makeUpdate(pack), 'Expected values to be strictly equal');
});
t('Sabotagem: âncora do código que some (cabeça, rosto ou cauda) → recusa com o nome da âncora', () => {
  for (const [part, what] of [[G.JS_HEAD_BEFORE, 'o começo do bloco'], [G.JS_FACE_BEFORE, 'o fim do desenho do botão'], [G.JS_TAIL_BEFORE, 'o fim do bloco']]) {
    const inner0 = inner(source.files[PAGE], SCRIPT);
    throwsWith(() => G.SCRIPT_EDIT.apply(inner0.split(part).join('/*x*/'), icons), what, 'sem ' + what);
    throwsWith(() => G.SCRIPT_EDIT.apply(inner0.replace(part, part + part), icons), what, 'âncora duplicada');
  }
});
t('Sabotagem: o balão do 292 some do botão do topo (a base mudou) → recusa antes de montar', () => {
  const inner0 = inner(source.files[PAGE], SCRIPT);
  throwsWith(() => G.SCRIPT_EDIT.apply(inner0.split('d="' + G.ICON_292 + '"').join('d="M0 0"'), icons), 'o desenho do balão do 1.12.292 no botão');
});
t('Sabotagem: hash "depois" errado ou edição que fecha o bloco antes da hora → recusa', () => {
  const html = source.files[PAGE];
  throwsWith(() => G.editBlocks(html, [{...G.CSS_EDIT, after: '0'.repeat(64)}]), 'SHA-256 diferente');
  throwsWith(() => G.editBlocks(html, [{...G.CSS_EDIT, apply: x => x + '</style>'}]), 'fecha o bloco antes da hora');
  throwsWith(() => G.editBlocks(html, [{...G.CSS_EDIT, before: '1'.repeat(64)}]), 'Conflito');
});
t('Sabotagem: pacote de partida trocado (versão, sequência, appId, SHA-256) → recusa', () => {
  for (const [k, v] of [['version', '1.12.291'], ['sequence', 397], ['appId', 'com.outra.app']]) {
    const s = fresh(); s[k] = v; assert.throws(() => G.makeUpdate(s), /./, 'devia recusar ' + k);
  }
  const bytes = fs.readFileSync(SOURCE_FILE); const alt = path.join(workDir, 'alterado.agenda.json'); fs.writeFileSync(alt, Buffer.concat([bytes, Buffer.from(' ')]));
  throwsWith(() => G.loadSource(alt), 'SHA-256 diferente');
});
t('Sabotagem: notas com marcador, resumo de 201 letras ou numeração fora da regra → makeUpdate recusa (gerador copiado com a mudança)', () => {
  const code = fs.readFileSync(GENERATOR, 'utf8');
  const variants = [
    ['marcador', code.replace("const summary = '", "const summary = '@@ ").replace(/const notes = '/, "const notes = '@@ "), 'marcador'],
    ['resumo grande', code.replace(/const summary = '[^']*'/, "const summary = '" + 'x'.repeat(201) + "'"), '200'],
    ['sequência errada', code.replace('const sequence = 400;', 'const sequence = 401;'), 'sequência'],
    ['sequência do 293', code.replace('const sequence = 400;', 'const sequence = 399;'), 'sequência']
  ];
  for (const [nome, text, part] of variants) {
    assert.notEqual(text, code, nome + ': a troca não achou o trecho');
    const file = path.join(workDir, 'gerador-' + nome.replace(/\W/g, '') + '.cjs');
    fs.writeFileSync(file, text.replace("require('./gerar-correcoes-exercicios-1.12.291.cjs')", "require(" + JSON.stringify(path.join(ROOT, 'tools/gerar-correcoes-exercicios-1.12.291.cjs')) + ")").replace("path.join(__dirname, 'icones-feedback-294')", JSON.stringify(G.ICON_DIR)));
    const variant = require(file);
    throwsWith(() => variant.makeUpdate(fresh()), part, nome + ': devia recusar');
  }
});
// Desenhos adulterados: cada defeito num manifesto copiado.
function iconDir(change) {
  const dir = fs.mkdtempSync(path.join(workDir, 'icones-'));
  const m = JSON.parse(fs.readFileSync(path.join(G.ICON_DIR, 'icones.json'), 'utf8')); change(m); fs.writeFileSync(path.join(dir, 'icones.json'), JSON.stringify(m));
  return dir;
}
const withSha = (item, d) => { item.d = d; item.sha256 = G.sha256(d); };
t('Sabotagem: um número de um desenho mudado → recusa (SHA-256 do desenho)', () => throwsWith(() => G.loadIcons(iconDir(m => { m.icones[3].d = m.icones[3].d.replace('M', 'M ').replace(/(\d)/, d => String((Number(d) + 1) % 10)); })), 'SHA-256'));
t('Sabotagem: caminho com aspas, marcação ou comando estranho (mesmo com o SHA-256 certo no manifesto) → recusa', () => {
  throwsWith(() => G.loadIcons(iconDir(m => withSha(m.icones[4], 'M2 2h20v20H2z"><script>alert(1)</script><path d="M0 0'))), 'Caminho inválido');
  throwsWith(() => G.loadIcons(iconDir(m => withSha(m.icones[4], 'M2 2h20v20H2z' + ' '.repeat(10) + 'fill:#8f35df;stroke=red'))), 'Caminho inválido');
  throwsWith(() => G.loadIcons(iconDir(m => withSha(m.icones[4], 'M2 2h20v20H2z' + 'l1 1'.repeat(1200)))), 'Caminho inválido');
  throwsWith(() => G.loadIcons(iconDir(m => withSha(m.icones[4], 'L2 2h20v20H2z' + 'h1 '.repeat(20)))), 'Caminho inválido');
});
t('Sabotagem: o padrão diferente do balão do 292 (um ponto mudado, SHA-256 certo) → recusa', () => {
  throwsWith(() => G.loadIcons(iconDir(m => withSha(m.icones[0], m.icones[0].d.replace('M5.5 3h13', 'M5.6 3h13')))), 'igual byte a byte');
});
t('Sabotagem: id repetido, nome repetido, desenho repetido, 18 ou 20 ícones, padrão fora do começo, grade errada, id ou nome inválidos → recusa', () => {
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones[5].id = m.icones[4].id; })), 'repetido');
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones[5].nome = m.icones[4].nome; })), 'repetido');
  throwsWith(() => G.loadIcons(iconDir(m => withSha(m.icones[5], m.icones[4].d))), 'repetido');
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones.pop(); })), '19');
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones.push({...m.icones[1], id: 'extra', nome: 'Extra'}); })), '19');
  throwsWith(() => G.loadIcons(iconDir(m => { [m.icones[0], m.icones[1]] = [m.icones[1], m.icones[0]]; })), 'padrão');
  throwsWith(() => G.loadIcons(iconDir(m => { m.grade = 32; })), '24×24');
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones[2].id = 'Balão'; })), 'Identificador');
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones[2].nome = 'x'; })), 'Nome inválido');
});
// Defeitos no CÓDIGO NOVO (cada um precisa ser pego por uma das verificações acima, reaproveitadas como funções).
const checkJsNew = js => {
  for (const pattern of FORBIDDEN) assert.ok(!pattern.test(js), 'o código novo usa ' + pattern);
  for (const [o, c] of [['{', '}'], ['(', ')'], ['[', ']']]) assert.equal(occurrences(noRegex(js), o), occurrences(noRegex(js), c), 'desbalanceado ' + o + c);
  assert.deepEqual([...new Set([...js.matchAll(/\bt\.(\w+)/g)].map(m => m[1]))].sort(), ['pending', 'uid']);
  assert.equal(occurrences(js, 'APstudentStorage.setItem('), 1); assert.ok(!/removeItem|\.clear\(/.test(js));
  new vm.Script('(()=>{let t,a,n,f;' + js + '})');
  checkColorAndSize(js, G.CSS_ICON);
};
t('Teste do teste (código): o código atual passa nas verificações que as sabotagens usam', () => checkJsNew(JS_NEW));
for (const [nome, de, para] of [
  ['rede', 'path.setAttribute("d",icon.d))}', 'path.setAttribute("d",icon.d),fetch("/x"))}'],
  ['timer', 'panel.focus({preventScroll:!0})', 'setTimeout(()=>panel.focus(),0)'],
  ['armazenamento próprio', 'APstudentStorage.getItem(FB_ICON_KEY)', 'localStorage.getItem(FB_ICON_KEY)'],
  ['apaga a escolha', 'feedbackIconSync();if(!saved)', 'APstudentStorage.removeItem(FB_ICON_KEY);feedbackIconSync();if(!saved)'],
  ['mexe no feedback', 'feedbackBell(t.pending().length)', 'feedbackBell(t.pending().length);t.submit()'],
  ['notificação', 'dispatchEvent(new CustomEvent("ap-feedback-icon-changed"', 'new Notification("x");dispatchEvent(new CustomEvent("ap-feedback-icon-changed"'],
  ['chave sem conta', 'APstudentStorage.setItem(FB_ICON_KEY,icon.id)', 'APstudentStorage.setItem(FB_ICON_KEY,icon.id);APstudentStorage.setItem("outra",1)'],
  ['sintaxe', 'function feedbackIconRow(){', 'function feedbackIconRow({'],
  ['chave a mais', 'try{feedbackIconRow()}catch(_){}', 'try{feedbackIconRow()}catch(_){}}'],
  // a correção do 293: cor própria e tamanho próprio no desenho
  ['cor fixa no desenho da grade (roxo)', '<path fill-rule="evenodd" d="\'+n(x.d)', '<path fill="#8f35df" fill-rule="evenodd" d="\'+n(x.d)'],
  ['cor fixa no desenho da linha', '<path fill-rule="evenodd" d=""/>', '<path fill="#f52283" fill-rule="evenodd" d=""/>'],
  ['cor por estilo no desenho', '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="\'+n(x.d)', '<svg viewBox="0 0 24 24" aria-hidden="true" style="color:#8f35df"><path fill-rule="evenodd" d="\'+n(x.d)'],
  ['tamanho trocado no botão do topo', 'path.setAttribute("d",icon.d))}', 'path.setAttribute("d",icon.d),path.parentNode.setAttribute("width","34"))}'],
  ['cor trocada no botão do topo', 'path.setAttribute("d",icon.d))}', 'path.setAttribute("d",icon.d),path.setAttribute("fill","#f52283"))}']
]) t('Teste do teste (código): defeito "' + nome + '" é pego', () => { assert.equal(occurrences(JS_NEW, de) >= 1, true, 'trecho não achado: ' + de); assert.throws(() => checkJsNew(JS_NEW.replace(de, para)), /./, nome + ' passou despercebido'); });
// Defeitos no ESTILO NOVO.
t('Teste do teste (estilo): o estilo atual passa na verificação de cor e tamanho', () => checkColorAndSize(JS_NEW, G.CSS_ICON));
for (const [nome, de, para] of [
  ['cor fixa na opção (roxo)', '.ap-fbicon-opt{position:relative;display:block;width:52px;height:52px;border-radius:12px;color:var(--prof-accent)', '.ap-fbicon-opt{position:relative;display:block;width:52px;height:52px;border-radius:12px;color:#8f35df'],
  ['cor fixa na linha do Perfil', 'height:27px;color:var(--prof-accent)}', 'height:27px;color:#8f35df}'],
  ['desenho da grade com preenchimento fixo', 'fill:currentColor;stroke:none;pointer-events:none}', 'fill:#8f35df;stroke:none;pointer-events:none}'],
  ['desenho da linha sem currentColor', '#profileScreen .ap-fbicon-now svg{display:block;width:27px;height:27px;fill:currentColor;stroke:none}', '#profileScreen .ap-fbicon-now svg{display:block;width:27px;height:27px;fill:#fff;stroke:none}'],
  ['linha do Perfil maior que as vizinhas', '#profileScreen .ap-fbicon-now{flex:none;display:block;width:27px;height:27px', '#profileScreen .ap-fbicon-now{flex:none;display:block;width:40px;height:40px'],
  ['desenho da grade miúdo', 'width:28px;height:28px;fill:currentColor', 'width:14px;height:14px;fill:currentColor'],
  ['regra que mexe no botão do topo', '#apFeedbackIconOpen[hidden],#apFeedbackIconPanel[hidden]{display:none!important}', '#apFeedbackIconOpen[hidden],#apFeedbackIconPanel[hidden]{display:none!important}.student-home .ap-feedback-bell svg{width:34px;height:34px}'],
  ['quadradinho claro no modo claro', '#profileScreen.profile-light .ap-fbicon-opt input:focus-visible+.ap-fbicon-face{outline-color:#1e3040}', '#profileScreen.profile-light .ap-fbicon-opt input:focus-visible+.ap-fbicon-face{outline-color:#1e3040}#profileScreen.profile-light .ap-fbicon-face{background:#eef3f7}']
]) t('Teste do teste (estilo): defeito "' + nome + '" é pego', () => { assert.equal(occurrences(G.CSS_ICON, de), 1, 'trecho não achado: ' + de); assert.throws(() => checkColorAndSize(JS_NEW, G.CSS_ICON.replace(de, para)), /./, nome + ' passou despercebido'); });

(async () => {
  for (const [name, fn] of queue) {
    try { await fn(); ok++; console.log('OK   ' + name); }
    catch (error) { bad++; console.log('FALHA ' + name + '\n     ' + String(error && error.message || error).split('\n').join('\n     ')); }
  }
  console.log('\n' + ok + ' ok, ' + bad + ' com falha');
  process.exit(bad ? 1 : 0);
})();
