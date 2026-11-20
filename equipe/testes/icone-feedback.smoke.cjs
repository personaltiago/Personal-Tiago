'use strict';
// Confere o pacote 1.12.293 (ícone do feedback personalizável, sobre o 1.12.292) sem navegador e sem internet:
//   node equipe/testes/icone-feedback.smoke.cjs
// O que confere:
//  - a entrada: o pacote 1.12.292 entregue ao Tiago (SHA-256 82f41147…); se não estiver na raiz (nem em PACOTE_292), é refeito pelo gerador do
//    292 a partir do 291 (que sai da main) e conferido pelo mesmo SHA-256;
//  - o pacote: versão 1.12.293, sequência 399 (= 398 + 1 = versão + 106), ordem das chaves, sem assinatura, limites de notas, resumo e tamanho;
//  - o escopo: no index.html mudam SÓ os dois blocos do feedback do aluno (script e estilo); no professor.html SÓ a cópia do estilo (as duas
//    cópias têm de continuar iguais: componente compartilhado); avaliacoes.html, cadastro.html, histórico de correções e demais campos ficam
//    iguais; desfazendo só o que o gerador acrescentou, o 292 volta byte a byte;
//  - os 19 ícones: manifesto, arquivos (WebP 160×160, SHA-256, só o padrão é redondo) e o que está embutido na página, byte a byte;
//  - o código novo (texto): sem rede, sem timers, sem notificações, sem som, sem armazenamento próprio (só o APstudentStorage da conta),
//    só dois membros do APFeedbackSync (uid e pending), innerHTML só com texto fixo e ícones do próprio pacote, nomes que não existem em
//    nenhuma página do 292, sintaxe, chaves e parênteses balanceados;
//  - o estilo novo: só seletores do botão do aluno, da linha/painel do Perfil e das classes ap-fbicon-; sem movimento, sem @import, nada
//    que mude o topo sem o botão; alvos de toque de pelo menos 44 px; !important só nas duas regras [hidden];
//  - o gerador: determinismo, linha de comando (mesmo conteúdo, recusa sobrescrever, recusa entrada trocada) e sabotagens: bloco alterado,
//    ausente ou duplicado, âncora que some, edição repetida, hash errado, ícone adulterado/repetido/fora de ordem/sem ser WebP, notas
//    com marcador, resumo grande, numeração errada.
// O comportamento na tela é conferido no Chrome real (equipe/testes/navegador/icone-feedback), a importação e a RETENÇÃO das correções
// da main pelo código Java real do aplicativo (equipe/testes/icone-feedback.java.py). Nada disso substitui o teste no celular.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const {spawnSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-icone-feedback-1.12.293.cjs');
const G = require(GENERATOR);
const G291 = require(path.join(ROOT, 'tools/gerar-correcoes-exercicios-1.12.291.cjs'));
const {locate292, SHA256_292} = require('./pacote-292.cjs');

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'icone-293-'));
process.on('exit', () => { try { fs.rmSync(workDir, {recursive: true, force: true}); } catch (e) {} });

let SOURCE_FILE, source, pack, icons;
try {
  SOURCE_FILE = locate292(workDir); // PACOTE_292, a raiz do repositório ou refeito pelos geradores (sempre conferido pelo SHA-256)
  source = G.loadSource(SOURCE_FILE);
  icons = G.loadIcons();
  pack = G.makeUpdate(source);
} catch (problem) {
  console.log('FALHA ao montar o pacote 1.12.293:\n     ' + String(problem && problem.message || problem).split('\n').join('\n     '));
  console.log('\n0 ok, 1 com falha');
  process.exit(1);
}
const fresh = () => G.loadSource(SOURCE_FILE);
const copy = value => JSON.parse(JSON.stringify(value));
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

// Tamanho de um WebP lido dos bytes (VP8X, VP8L e VP8), sem biblioteca.
function webpSize(buf) {
  assert.equal(buf.subarray(0, 4).toString('latin1'), 'RIFF'); assert.equal(buf.subarray(8, 12).toString('latin1'), 'WEBP');
  const kind = buf.subarray(12, 16).toString('latin1');
  if (kind === 'VP8X') return {kind, w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), alpha: !!(buf[20] & 0x10)};
  if (kind === 'VP8L') { const bits = buf.readUInt32LE(21); return {kind, w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff), alpha: !!((bits >> 28) & 1)}; }
  assert.equal(kind, 'VP8 '); return {kind, w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, alpha: false};
}

// O único literal de expressão regular do código novo tem um "(" escapado de propósito; tirado dele, os pares precisam fechar.
const noRegex = js => js.split('/profileSettings\\(/').join('/profileSettings/');
// ---------- partes do código novo ----------
const newScript = inner(pack.files[PAGE], SCRIPT), oldScript = inner(source.files[PAGE], SCRIPT);
const newCss = inner(pack.files[PAGE], STYLE), oldCss = inner(source.files[PAGE], STYLE);
const JS_NEW = G.JS_NEW;
const HEAD = G.jsHead(icons);
const FORBIDDEN = [/\bfetch\b/, /\bXMLHttpRequest\b/, /\bsendBeacon\b/, /\bWebSocket\b/, /\bEventSource\b/, /\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /\bcookie\b/,
  /\bsetTimeout\b/, /\bsetInterval\b/, /\brequestAnimationFrame\b/, /\bAndroid\w*/, /\bwebkit\b/, /\bpostMessage\b/, /\bNotification\b/, /\bvibrate\b/, /\bAudio\w*/, /\beval\b/,
  /\bFunction\s*\(/, /document\.write/, /\blocation\b/, /\bhistory\b/, /window\.open/, /\bimport\s*\(/, /\bnavigator\b/, /\bfirebase\b/i, /\bfirestore\b/i, /\bsubmit\b/, /\bdraft\b/,
  /\bAPaccounts\b/, /\bAPFeedbackModel\b/, /\bclipboard\b/];

// 1. A entrada e o pacote ---------------------------------------------------------------------------------------------------------
t('Entrada: o pacote 1.12.292 conferido pelo SHA-256 ' + SHA256_292.slice(0, 8) + '… (1.12.292, sequência 398)', () => {
  assert.equal(source.version, '1.12.292'); assert.equal(source.sequence, 398); assert.ok(!source.agendaSignature, 'o 292 de partida não pode estar assinado');
});
t('Pacote: versão 1.12.293, sequência 399 = 398 + 1 = 293 + 106, sem assinatura', () => {
  assert.equal(pack.version, '1.12.293'); assert.equal(pack.sequence, 399); assert.equal(pack.sequence, source.sequence + 1); assert.equal(pack.sequence - 106, 293);
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
t('Notas: dizem o que o aluno vê, que a escolha fica só no aparelho e que o pacote mantém o que está na main (Raposinha fora)', () => {
  for (const part of ['Ícone do feedback', 'Meu perfil', 'Configurações', '19 ícones', 'selo roxo', 'só no aparelho', 'não vai para o Firebase', 'não acompanha o aluno em outro aparelho',
    'completo e cumulativo', 'nada se perde'.replace('nada se perde', 'nenhuma se perde'), 'Raposinha', 'descanso, cronômetros, alarmes e notificações não foram mexidos'])
    assert.ok(pack.notes.includes(part), 'faltou nas notas: ' + part);
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
  let back = newScript.split(HEAD).join(G.JS_HEAD_BEFORE).split(G.JS_FACE_AFTER).join(G.JS_FACE_BEFORE).split(G.JS_TAIL_AFTER).join(G.JS_TAIL_BEFORE);
  assert.equal(back, oldScript, 'script');
  assert.ok(newCss.endsWith(G.CSS_ICON)); assert.equal(newCss.slice(0, newCss.length - G.CSS_ICON.length), oldCss, 'estilo');
  for (const part of [HEAD, G.JS_FACE_AFTER, G.JS_TAIL_AFTER]) assert.equal(occurrences(newScript, part), 1, 'cada acréscimo entra uma única vez');
});

// 2. Os 19 ícones ----------------------------------------------------------------------------------------------------------------
const manifest = JSON.parse(fs.readFileSync(path.join(G.ICON_DIR, 'manifest.json'), 'utf8'));
t('Ícones: 19, o padrão primeiro e único redondo, nomes e ids únicos, arquivos conferidos pelo SHA-256 do manifesto', () => {
  assert.equal(icons.length, 19); assert.equal(icons[0].id, 'padrao'); assert.ok(icons[0].disc);
  assert.equal(new Set(icons.map(i => i.id)).size, 19); assert.equal(new Set(icons.map(i => i.name)).size, 19);
  assert.deepEqual(icons.filter(i => i.disc).map(i => i.id), ['padrao']);
  for (const i of manifest.icones) { const bytes = fs.readFileSync(path.join(G.ICON_DIR, i.arquivo)); assert.equal(digest(bytes), i.sha256, i.id); assert.equal(bytes.length, i.bytes, i.id); }
});
t('Ícones: todos WebP 160×160 com transparência, cada um com menos de 10 KB (o conjunto, menos de 130 KB)', () => {
  let total = 0;
  for (const i of manifest.icones) {
    const bytes = fs.readFileSync(path.join(G.ICON_DIR, i.arquivo)); total += bytes.length;
    const s = webpSize(bytes); assert.deepEqual([s.w, s.h], [160, 160], i.id + ' ' + JSON.stringify(s)); assert.ok(s.alpha, i.id + ' sem canal alfa (os cantos arredondados precisam de transparência)');
    assert.ok(bytes.length < 10 * 1024, i.id + ' tem ' + bytes.length + ' bytes');
  }
  assert.ok(total < 130 * 1024, 'conjunto: ' + total);
});
t('Ícones: o que está embutido na página é exatamente a lista do manifesto (ids, nomes, ordem, forma, imagem byte a byte)', () => {
  const start = newScript.indexOf('FB_ICONS=') + 9, end = newScript.indexOf(';const r=new MutationObserver(');
  assert.ok(start > 9 && end > start);
  const inPage = JSON.parse(newScript.slice(start, end));
  assert.deepEqual(inPage, icons);
  assert.deepEqual(inPage.map(i => i.id), manifest.icones.map(i => i.id)); assert.deepEqual(inPage.map(i => i.name), manifest.icones.map(i => i.nome));
  for (const [n, i] of inPage.entries()) assert.equal(i.src, 'data:image/webp;base64,' + fs.readFileSync(path.join(G.ICON_DIR, manifest.icones[n].arquivo)).toString('base64'), i.id);
  assert.ok(inPage.every(i => /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(i.src)), 'só imagens embutidas, nenhum endereço externo');
});

// 3. O código novo (texto) --------------------------------------------------------------------------------------------------------
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
t('Código: o único evento que dispara é ap-feedback-icon-changed, com o id do ícone; escuta só ap-student-ready e ap-account-changed', () => {
  assert.deepEqual([...new Set([...JS_NEW.matchAll(/new CustomEvent\("([^"]+)"/g)].map(m => m[1]))], ['ap-feedback-icon-changed']);
  assert.deepEqual([...new Set([...JS_NEW.matchAll(/addEventListener\("([^"]+)"/g)].map(m => m[1]))].sort(), ['ap-account-changed', 'ap-student-ready', 'change', 'click', 'error', 'load']);
  assert.ok(JS_NEW.includes('detail:{id:icon.id}'));
});
t('Código: innerHTML só com texto fixo e dados do próprio pacote (ids e nomes escapados por n(), imagem do pacote)', () => {
  assert.equal(occurrences(JS_NEW, 'innerHTML'), 3, 'abrir (texto fixo), painel (texto fixo + lista de ícones) e a seta (símbolo do Perfil)');
  assert.ok(JS_NEW.includes('value="\'+n(x.id)+\'" aria-label="\'+n(x.name)+\'"'), 'ids e nomes entram escapados');
  assert.ok(JS_NEW.includes('src="\'+x.src+\'"'), 'a imagem vem da lista do pacote');
  const dynamic = [...JS_NEW.matchAll(/'\+([^+']+?)\+'/g)].map(m => m[1]).filter(s => !/^"/.test(s));
  for (const d of dynamic) assert.ok(/^(n\(x\.id\)|n\(x\.name\)|x\.src)$/.test(d) || /^\(x\.disc\?/.test(d), 'interpolação inesperada em innerHTML: ' + d);
  assert.ok(JS_NEW.includes('chevron.innerHTML=profileSymbol("chevron")'));
});
t('Código: o botão do topo só ganha o desenho depois de decidir que aparece (sem pendência nada é criado nem pintado)', () => {
  assert.equal(G.JS_FACE_AFTER, G.JS_FACE_BEFORE + 'feedbackBellFace(bell);');
  assert.ok(G.JS_FACE_BEFORE.endsWith('if(!show)return;'), 'a chamada nova fica DEPOIS de "if(!show)return;"');
  assert.ok(JS_NEW.includes('bell.dataset.icon!==icon.id') && JS_NEW.includes('img.src=icon.src'), 'só troca o src quando o ícone muda (não repinta o tempo todo)');
});
t('Código: a linha do Perfil só existe para aluno logado, vem logo depois de Configurações e se refaz quando o Perfil é redesenhado', () => {
  assert.ok(JS_NEW.includes('open.hidden=!show') && JS_NEW.includes('show=!!t.uid()'));
  assert.ok(JS_NEW.includes('/profileSettings\\(/.test(x.getAttribute("onclick")||"")') && JS_NEW.includes('settings?settings.after(open,panel):list.append(open,panel)'));
  assert.ok(JS_NEW.includes('profileRender=function(...ev){const result=original.apply(this,ev);try{feedbackIconRow()}catch(_){}return result}'));
  assert.ok(JS_NEW.includes('matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"'), 'respeita "reduzir movimento"');
  assert.ok(JS_NEW.includes('panel.focus({preventScroll:!0})'));
});
t('Código: acessibilidade da lista (rádios de verdade, rótulo por ícone, grupo rotulado, região viva educada)', () => {
  for (const part of ['type="radio" name="apFeedbackIcon"', 'role="radiogroup"', 'aria-labelledby="apFeedbackIconTitle"', 'role="status" aria-live="polite"', 'aria-expanded', 'aria-controls', 'alt=""'])
    assert.ok(JS_NEW.includes(part) || JS_NEW.includes(part.replace(/"/g, '\\"')), 'faltou: ' + part);
});
t('Nomes: nenhum nome novo do código ou do estilo existe em qualquer página do 292 (nada colide)', () => {
  const names = ['feedbackIcon(', 'feedbackBellFace', 'feedbackIconSync', 'feedbackIconChoose', 'feedbackIconRow', 'FB_ICON_KEY', 'FB_ICONS', 'apFeedbackIconOpen', 'apFeedbackIconPanel',
    'apFeedbackIconStatus', 'apFeedbackIconTitle', 'ap-fbicon-', 'ap-feedback-icon-changed', 'agenda_demo_feedback_icon', 'apFeedbackIcon'];
  for (const page of Object.keys(source.files)) for (const n of names) assert.equal(occurrences(source.files[page], n), 0, n + ' já existe em ' + page + ' do 292');
});

// 4. O estilo novo -----------------------------------------------------------------------------------------------------------------
const rules = [...G.CSS_ICON.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({selector: m[1].trim(), body: m[2]}));
t('Estilo: 22 regras e todas só alcançam o botão do aluno, a linha/painel do ícone ou classes ap-fbicon-', () => {
  assert.equal(rules.length, 22);
  for (const r of rules) for (const part of r.selector.split(',')) assert.ok(/ap-feedback-bell|apFeedbackIcon|ap-fbicon|profileScreen/.test(part), 'seletor fora do combinado: ' + part);
  for (const r of rules) for (const part of r.selector.split(',')) assert.ok(!/^(html|body|\*|:root|\.home-header|\.home-actions|\.topbar|dialog)\b/.test(part.trim()), 'seletor largo demais: ' + part);
});
t('Estilo: sem movimento, sem @import, sem endereço externo; !important só nas duas regras [hidden]', () => {
  assert.ok(!/animation|transition|@keyframes|@import|@font-face|position:\s*fixed|\bfilter\b|\bblur\b/.test(G.CSS_ICON));
  const urls = [...G.CSS_ICON.matchAll(/url\(([^)]*)\)/g)].map(m => m[1]); assert.equal(urls.length, 1); assert.ok(urls[0].startsWith('"data:image/svg+xml,'), urls[0].slice(0, 40));
  assert.deepEqual(rules.filter(r => /!important/.test(r.body)).map(r => r.selector), ['#apFeedbackIconOpen[hidden],#apFeedbackIconPanel[hidden]']);
});
t('Estilo: o botão do topo continua 44×44 (nenhuma regra nova mexe em largura, altura ou margem do .ap-feedback-bell)', () => {
  for (const r of rules.filter(r => /^\.student-home \.ap-feedback-bell(?![-\w])/.test(r.selector) && !/ img|svg/.test(r.selector))) assert.ok(!/\b(width|height|margin|padding|min-|max-)/.test(r.body), r.selector);
  assert.ok(oldCss.includes('width:44px') && oldCss.includes('height:44px'));
  assert.ok(rules.find(r => r.selector === '.student-home .ap-feedback-bell img').body.includes('width:38px;height:38px'));
  assert.ok(rules.find(r => r.selector === '.student-home .ap-feedback-bell.ap-fbicon-disc img').body.includes('width:40px;height:40px'));
});
t('Estilo: alvo de toque de pelo menos 48 px (grade com minmax(56px,1fr), opção quadrada)', () => {
  assert.ok(rules.find(r => r.selector === '.ap-fbicon-grid').body.includes('minmax(56px,1fr)'));
  assert.ok(rules.find(r => r.selector === '.ap-fbicon-opt').body.includes('aspect-ratio:1'));
  assert.ok(rules.find(r => /input:focus-visible/.test(r.selector)).body.includes('outline:2px dashed'), 'foco visível para o teclado');
});
t('Estilo: o tema claro tem texto e anel de folga próprios (descrição #526271; folga #fff) e a marca de visto é escura', () => {
  assert.ok(rules.some(r => r.selector === '#profileScreen.profile-light .ap-fbicon-panel p' && r.body.includes('#526271')));
  assert.ok(rules.some(r => r.selector === '#profileScreen.profile-light .ap-fbicon-panel' && r.body.includes('--ap-fbicon-gap:#fff')));
  assert.ok(G.CSS_ICON.includes('background:#0a151e url('));
});

// 5. O gerador ------------------------------------------------------------------------------------------------------------------
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

// 6. Sabotagens: o teste precisa PEGAR cada defeito -------------------------------------------------------------------------------------
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
t('Sabotagem: pacote que já tem a mudança (aplicar duas vezes) → "já foi aplicada" (e o gerador, sobre o 293, recusa pela versão)', () => {
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
t('Sabotagem: hash "depois" errado ou edição que fecha o bloco antes da hora → recusa', () => {
  const html = source.files[PAGE];
  throwsWith(() => G.editBlocks(html, [{...G.CSS_EDIT, after: '0'.repeat(64)}]), 'SHA-256 diferente');
  throwsWith(() => G.editBlocks(html, [{...G.CSS_EDIT, apply: x => x + '</style>'}]), 'fecha o bloco antes da hora');
  throwsWith(() => G.editBlocks(html, [{...G.CSS_EDIT, before: '1'.repeat(64)}]), 'Conflito');
});
t('Sabotagem: pacote de partida trocado (versão, sequência, appId, SHA-256) → recusa', () => {
  for (const [k, v, part] of [['version', '1.12.291', 'version'], ['sequence', 397, 'sequence'], ['appId', 'com.outra.app', 'appId']]) {
    const s = fresh(); s[k] = v; assert.throws(() => G.makeUpdate(s), /./, 'devia recusar ' + k);
  }
  const bytes = fs.readFileSync(SOURCE_FILE); const alt = path.join(workDir, 'alterado.agenda.json'); fs.writeFileSync(alt, Buffer.concat([bytes, Buffer.from(' ')]));
  throwsWith(() => G.loadSource(alt), 'SHA-256 diferente');
});
t('Sabotagem: notas com marcador, resumo de 201 letras ou numeração fora da regra → makeUpdate recusa (gerador copiado com a mudança)', () => {
  const code = fs.readFileSync(GENERATOR, 'utf8');
  const variants = [
    ['marcador', code.replace("const summary = '", "const summary = '@@ ").replace(/const notes = '/, "const notes = '@@ "), "marcador"],
    ['resumo grande', code.replace(/const summary = '[^']*'/, "const summary = '" + 'x'.repeat(201) + "'"), '200'],
    ['sequência errada', code.replace('const sequence = 399;', 'const sequence = 400;'), 'sequência']
  ];
  for (const [nome, text, part] of variants) {
    const file = path.join(workDir, 'gerador-' + nome.replace(/\W/g, '') + '.cjs');
    fs.writeFileSync(file, text.replace("require('./gerar-correcoes-exercicios-1.12.291.cjs')", "require(" + JSON.stringify(path.join(ROOT, 'tools/gerar-correcoes-exercicios-1.12.291.cjs')) + ")").replace("path.join(__dirname, 'icones-feedback-293')", JSON.stringify(G.ICON_DIR)));
    const variant = require(file);
    assert.throws(() => variant.makeUpdate(fresh()), /./, nome + ': devia recusar');
  }
});
// Ícones adulterados: cada defeito num manifesto/arquivo copiado.
function iconDir(change) {
  const dir = fs.mkdtempSync(path.join(workDir, 'icones-')); for (const f of fs.readdirSync(G.ICON_DIR)) fs.copyFileSync(path.join(G.ICON_DIR, f), path.join(dir, f));
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); change(m, dir); fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m));
  return dir;
}
t('Sabotagem: um byte de um ícone mudado → recusa (SHA-256 do arquivo)', () => throwsWith(() => G.loadIcons(iconDir((m, d) => { const f = path.join(d, m.icones[3].arquivo); const b = fs.readFileSync(f); b[b.length - 1] ^= 1; fs.writeFileSync(f, b); })), 'SHA-256'));
t('Sabotagem: arquivo que não é WebP (mesmo com o SHA-256 certo no manifesto) → recusa', () => throwsWith(() => G.loadIcons(iconDir((m, d) => {
  const f = path.join(d, m.icones[4].arquivo), junk = Buffer.from('PNG fingindo ser WebP, com bytes suficientes para ter tamanho'); fs.writeFileSync(f, junk); m.icones[4].bytes = junk.length; m.icones[4].sha256 = digest(junk); })), 'Não é um WebP'));
t('Sabotagem: id repetido, nome repetido, 18 ou 20 ícones, padrão fora do começo, outro ícone redondo → recusa', () => {
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones[5].id = m.icones[4].id; })), 'repetido');
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones[5].nome = m.icones[4].nome; })), 'repetido');
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones.pop(); })), '19');
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones.push({...m.icones[1], id: 'extra'}); })), '19');
  throwsWith(() => G.loadIcons(iconDir(m => { [m.icones[0], m.icones[1]] = [m.icones[1], m.icones[0]]; })), 'padrão');
  throwsWith(() => G.loadIcons(iconDir(m => { m.icones[2].forma = 'disco'; })), 'redondo');
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
};
t('Teste do teste (código): o código atual passa nas verificações que as sabotagens usam', () => checkJsNew(JS_NEW));
for (const [nome, de, para] of [
  ['rede', 'img.src=icon.src', 'img.src=icon.src;fetch("/x")'],
  ['timer', 'panel.focus({preventScroll:!0})', 'setTimeout(()=>panel.focus(),0)'],
  ['armazenamento próprio', 'APstudentStorage.getItem(FB_ICON_KEY)', 'localStorage.getItem(FB_ICON_KEY)'],
  ['apaga a escolha', 'feedbackIconSync();if(!saved)', 'APstudentStorage.removeItem(FB_ICON_KEY);feedbackIconSync();if(!saved)'],
  ['mexe no feedback', 'feedbackBell(t.pending().length)', 'feedbackBell(t.pending().length);t.submit()'],
  ['notificação', 'dispatchEvent(new CustomEvent("ap-feedback-icon-changed"', 'new Notification("x");dispatchEvent(new CustomEvent("ap-feedback-icon-changed"'],
  ['chave sem conta', 'APstudentStorage.setItem(FB_ICON_KEY,icon.id)', 'APstudentStorage.setItem(FB_ICON_KEY,icon.id);APstudentStorage.setItem("outra",1)'],
  ['sintaxe', 'function feedbackIconRow(){', 'function feedbackIconRow({'],
  ['chave a mais', 'try{feedbackIconRow()}catch(_){}', 'try{feedbackIconRow()}catch(_){}}']
]) t('Teste do teste (código): defeito "' + nome + '" é pego', () => { assert.equal(occurrences(JS_NEW, de) >= 1, true, 'trecho não achado: ' + de); assert.throws(() => checkJsNew(JS_NEW.replace(de, para)), /./, nome + ' passou despercebido'); });

(async () => {
  for (const [name, fn] of queue) {
    try { await fn(); ok++; console.log('OK   ' + name); }
    catch (error) { bad++; console.log('FALHA ' + name + '\n     ' + String(error && error.message || error).split('\n').join('\n     ')); }
  }
  console.log('\n' + ok + ' ok, ' + bad + ' com falha');
  process.exit(bad ? 1 : 0);
})();
