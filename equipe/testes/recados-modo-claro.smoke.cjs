'use strict';
// Confere o pacote 1.12.286 (cartão "Recados do dia" legível no modo claro) contra o pacote 1.12.285 (o que está na main).
// Não precisa de navegador nem de internet:
//   node equipe/testes/recados-modo-claro.smoke.cjs
// A mudança é só de estilo (duas regras de CSS no professor.html), então o teste confere, de forma estática:
//  - o pacote: versão, sequência, escopo (só professor.html), reversão byte a byte, determinismo, linha de comando;
//  - que a ÚNICA diferença para o 1.12.285 é o texto das duas regras novas (nenhum script, nenhum outro estilo mudou);
//  - as regras novas, lendo a folha de estilo de verdade: só valem com o marcador do modo claro, só mexem no cartão do
//    professor sem mascote (.ap-teacher-mascot.ap-recado-only), só trocam fundo/borda/texto/título, com variáveis da paleta
//    do tema e valor de reserva, todas com !important e com especificidade maior que a das regras que já existiam;
//  - e roda variações sabotadas das regras (sem o marcador, no escuro, no cartão do aluno, sem !important, dentro de @media,
//    longe da âncora...) para provar que o teste pega o erro.
// O resultado visual (contraste medido, 5 temas, claro e escuro, comparação do estilo de todos os elementos da tela antes e
// depois) foi conferido à parte, em Chrome real (equipe/testes/navegador/recados-modo-claro).
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-recados-modo-claro-1.12.286.cjs');
// O pacote-base é o 1.12.285. O Tiago o subiu na main com o nome do arquivo do 1.12.284 (commit b4b6072), então o arquivo com
// esse nome na raiz é o 1.12.285 (SHA-256 abaixo). Se um dia esse arquivo for trocado, o teste busca o original no histórico.
const SOURCE_NAME = 'AgendaPersonal-1.12.284-Lista-De-Alunos-Para-Assinar.agenda.json';
const SOURCE_COMMIT = 'b4b60722b3ca57092379bb7f25c4ba9d74ab7d1c';
const SOURCE_SHA256 = '87d7fd05c2fcf33e729c332773ec65ea058f56c156894bc9a2c65a4caa9c8442';
const SOURCE = (() => {
  const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  const inRoot = path.join(ROOT, SOURCE_NAME);
  if (fs.existsSync(inRoot) && digest(fs.readFileSync(inRoot)) === SOURCE_SHA256) return inRoot;
  let fromHistory;
  try {
    fromHistory = execFileSync('git', ['show', SOURCE_COMMIT + ':' + SOURCE_NAME], {cwd: ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
  } catch (problem) {
    throw new Error('Não achei o pacote 1.12.285 (SHA-256 ' + SOURCE_SHA256 + '): o arquivo da raiz é outro e o commit ' +
      SOURCE_COMMIT.slice(0, 7) + ' não está neste clone (se o clone é raso, rode: git fetch --unshallow).');
  }
  assert.equal(digest(fromHistory), SOURCE_SHA256, 'o 1.12.285 do histórico do git não é o esperado');
  const copy = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'base-285-')), SOURCE_NAME);
  fs.writeFileSync(copy, fromHistory);
  return copy;
})();
const G = require(GENERATOR);
const o = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const p = G.makeUpdate(o);
const baseTeacher = o.files['professor.html'], page = p.files['professor.html'];
let ok = 0, bad = 0;
const queue = [];
const t = (n, f) => queue.push([n, f]);

const count = (text, part) => { assert(typeof part === 'string' && part.length > 0, 'trecho vazio'); return text.split(part).length - 1; };
const sha = text => crypto.createHash('sha256').update(text, 'utf8').digest('hex');
const classicScripts = html => [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .filter(m => !/\stype="/.test(m[1] || '') || /\stype="text\/javascript"/.test(m[1]));

// ---------- leitor de folha de estilo (blocos, strings, comentários, parênteses; @media e afins entram como filhos) ----------
function skipString(text, i) {
  const quote = text[i];
  for (let k = i + 1; k < text.length; k++) {
    if (text[k] === '\\') { k++; continue; }
    if (text[k] === quote) return k + 1;
  }
  return text.length;
}
function skipParens(text, i) {
  let depth = 0;
  for (let k = i; k < text.length; k++) {
    const ch = text[k];
    if (ch === '"' || ch === "'") { k = skipString(text, k) - 1; continue; }
    if (ch === '(') depth++;
    else if (ch === ')' && --depth === 0) return k + 1;
  }
  return text.length;
}
function matchBrace(text, i) {
  let depth = 0;
  for (let k = i; k < text.length; k++) {
    const ch = text[k];
    if (ch === '/' && text[k + 1] === '*') { const e = text.indexOf('*/', k + 2); k = e < 0 ? text.length : e + 1; continue; }
    if (ch === '"' || ch === "'") { k = skipString(text, k) - 1; continue; }
    if (ch === '(') { k = skipParens(text, k) - 1; continue; }
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return k;
  }
  return text.length;
}
function parseCss(css, level = 0) {
  const rules = [];
  let i = 0, start = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2); i = e < 0 ? css.length : e + 2; continue; }
    if (ch === '"' || ch === "'") { i = skipString(css, i); continue; }
    if (ch === '(') { i = skipParens(css, i); continue; }
    if (ch === ';') { start = i + 1; i++; continue; }
    if (ch === '{') {
      const close = matchBrace(css, i);
      const prelude = css.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, '').trim();
      const body = css.slice(i + 1, close);
      if (/^@(media|supports|layer|container|document|scope)\b/i.test(prelude)) rules.push({prelude, level, at: true, children: parseCss(body, level + 1)});
      else if (prelude.startsWith('@')) rules.push({prelude, level, at: true, children: []});
      else rules.push({prelude, level, body});
      i = close + 1; start = i; continue;
    }
    i++;
  }
  return rules;
}
const flatten = rules => rules.flatMap(r => (r.at ? flatten(r.children) : [r]));
function declarations(body) {
  const out = [];
  let depth = 0, from = 0;
  const push = end => {
    const text = body.slice(from, end).trim();
    if (!text) return;
    const colon = text.indexOf(':');
    out.push({prop: text.slice(0, colon).trim().toLowerCase(), value: text.slice(colon + 1).trim()});
  };
  for (let k = 0; k < body.length; k++) {
    if (body[k] === '(') depth++;
    else if (body[k] === ')') depth--;
    else if (body[k] === ';' && depth === 0) { push(k); from = k + 1; }
  }
  push(body.length);
  return out;
}
// especificidade [ids, classes/atributos/pseudoclasses, tipos]; :where() vale zero
function specificity(selector) {
  let s = selector.replace(/"[^"]*"|'[^']*'/g, '""').replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '');
  const n = [0, 0, 0];
  n[0] += (s.match(/#[\w-]+/g) || []).length; s = s.replace(/#[\w-]+/g, '');
  n[1] += (s.match(/\[[^\]]*\]/g) || []).length; s = s.replace(/\[[^\]]*\]/g, '');
  n[1] += (s.match(/\.[\w-]+/g) || []).length; s = s.replace(/\.[\w-]+/g, '');
  n[1] += (s.match(/:(?!:)[\w-]+/g) || []).length; s = s.replace(/::?[\w-]+(\((?:[^()]|\([^()]*\))*\))?/g, '');
  n[2] += (s.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length;
  return n;
}
const compare = (a, b) => { for (let k = 0; k < 3; k++) if (a[k] !== b[k]) return a[k] - b[k]; return 0; };
const styleBlocks = html => [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
const parseAll = html => styleBlocks(html).map(css => parseCss(css)); // (map(parseCss) passaria o índice como nível)

// Lê as regras novas direto da folha de estilo da página e devolve a lista de problemas (vazia = tudo certo).
const LIGHT_MARK = 'html[data-agenda-color-mode="light"]';
const CARD_SELECTOR = LIGHT_MARK + ' .ap-teacher-mascot.ap-recado-only';
const TITLE_SELECTOR = CARD_SELECTOR + ' .ap-mascot-recados strong';
const ANCHOR_SELECTOR = '.ap-mascot-home.ap-recado-only.ap-mascot-light';
function auditCss(html) {
  const problems = [];
  const blocks = parseAll(html);
  const tops = blocks.flatMap(b => b);
  const all = blocks.flatMap(flatten);
  const light = all.filter(r => /data-agenda-color-mode/.test(r.prelude));
  if (light.length !== 2) { problems.push('esperava 2 regras com o marcador do modo claro e achei ' + light.length); return problems; }
  const card = light.find(r => r.prelude === CARD_SELECTOR), title = light.find(r => r.prelude === TITLE_SELECTOR);
  if (!card) problems.push('falta a regra do cartão: ' + CARD_SELECTOR);
  if (!title) problems.push('falta a regra do título: ' + TITLE_SELECTOR);
  for (const r of light) {
    if (r.prelude !== CARD_SELECTOR && r.prelude !== TITLE_SELECTOR) problems.push('seletor fora do combinado: ' + r.prelude);
    if (r.level !== 0) problems.push('a regra precisa estar fora de @media/@supports: ' + r.prelude);
  }
  if (!card || !title) return problems;
  // declarações: só as combinadas, cada uma com variável da paleta, valor de reserva e !important
  const plan = [
    [card, {'background-color': 'surface', 'border-color': 'accent-border', color: 'text'}],
    [title, {color: 'accent'}]
  ];
  for (const [rule, wanted] of plan) {
    const found = declarations(rule.body);
    const props = found.map(d => d.prop);
    if (props.slice().sort().join() !== Object.keys(wanted).sort().join() || new Set(props).size !== props.length) problems.push('propriedades de ' + rule.prelude + ': ' + props.join(', '));
    for (const d of found) {
      const m = /^var\(--ac-([a-z-]+),(.+)\)!important$/.exec(d.value);
      if (!m) { problems.push(d.prop + ' sem var(--ac-…, reserva) e !important: ' + d.value); continue; }
      if (wanted[d.prop] && m[1] !== wanted[d.prop]) problems.push(d.prop + ' deveria usar --ac-' + wanted[d.prop] + ', usa --ac-' + m[1]);
      if (!m[2].trim()) problems.push(d.prop + ' sem valor de reserva');
    }
  }
  // posição: logo depois da regra do cartão do aluno no modo claro, no mesmo nível da folha, primeiro o cartão e depois o título
  const at = tops.findIndex(r => r.prelude === ANCHOR_SELECTOR);
  if (at < 0) problems.push('a regra âncora (' + ANCHOR_SELECTOR + ') não está no nível principal da folha');
  else if (tops[at + 1] !== card || tops[at + 2] !== title) problems.push('as regras novas não vêm logo depois da âncora, na ordem cartão, título');
  // vencem as regras que já existiam (todas com !important): especificidade estritamente maior
  const mine = new Set([card, title]);
  const winsOver = (rule, mineSpec, testSelector, props) => {
    for (const other of all) {
      if (mine.has(other) || other.at) continue;
      const important = declarations(other.body).filter(d => props.includes(d.prop) && /!important\s*$/.test(d.value));
      if (!important.length) continue;
      for (const selector of other.prelude.split(',').map(s => s.trim())) {
        if (!testSelector.test(selector)) continue;
        if (compare(specificity(selector), mineSpec) >= 0) problems.push('regra existente com especificidade igual ou maior: ' + selector + ' {' + important.map(d => d.prop).join(',') + '}');
      }
    }
  };
  winsOver(card, specificity(CARD_SELECTOR), /ap-teacher-mascot|ap-recado-only/, ['background', 'background-color', 'border', 'border-color', 'color']);
  winsOver(title, specificity(TITLE_SELECTOR), /ap-mascot-recados/, ['color']);
  return problems;
}
// Tudo que não é o texto das regras novas precisa ser idêntico ao 1.12.285 (nenhum script, nenhum outro estilo).
function auditAgainstBase(html) {
  const problems = [];
  const added = html.length - baseTeacher.length;
  const restored = html.replace(G.CSS_CARD, '').replace(G.CSS_TITLE, '');
  if (restored !== baseTeacher) problems.push('professor.html tem diferenças além das duas regras novas');
  if (added <= 0) problems.push('nada foi acrescentado');
  return problems;
}

// ---------- 1) pacote ----------
function auditPackage(pkg) {
  const problems = [];
  const want = (cond, message) => { if (!cond) problems.push(message); };
  want(pkg.version === '1.12.286', 'versão ' + pkg.version);
  want(pkg.sequence === 392, 'sequência ' + pkg.sequence);
  want(pkg.agendaSignature === undefined, 'tem assinatura');
  for (const k of ['format', 'appId', 'bridgeVersion', 'dataSchema']) want(JSON.stringify(pkg[k]) === JSON.stringify(o[k]), k + ' mudou');
  want(JSON.stringify(Object.keys(pkg)) === JSON.stringify(['format', 'appId', 'bridgeVersion', 'dataSchema', 'version', 'sequence', 'files', 'notes', 'update', 'modularUpdates']), 'ordem das chaves');
  want(JSON.stringify(Object.keys(pkg.files)) === JSON.stringify(Object.keys(o.files)), 'lista de arquivos');
  for (const k of ['index.html', 'avaliacoes.html', 'cadastro.html']) want(pkg.files[k] === o.files[k], k + ' mudou');
  want(pkg.files['professor.html'] !== o.files['professor.html'], 'professor.html não mudou');
  want(JSON.stringify(pkg.modularUpdates) === JSON.stringify(o.modularUpdates), 'histórico modular mudou');
  want(pkg.update.summary.length > 20 && pkg.update.summary.length <= 200, 'resumo fora do limite: ' + pkg.update.summary.length);
  want(pkg.notes.length > 100 && pkg.notes.length <= 4000, 'notas fora do limite: ' + pkg.notes.length);
  want(pkg.update.category === o.update.category, 'categoria mudou');
  return problems;
}
t('Versão 1.12.286 / seq 392 / sem assinatura, com o mesmo aplicativo e formato do 1.12.285', () => {
  assert.equal(o.version, '1.12.285');
  assert.equal(o.sequence, 391);
  assert(p.sequence > o.sequence);
  assert.deepEqual(auditPackage(p), []);
});
t('Aviso: título, resumo e notas coerentes com o que o pacote faz, sem prometer o que não muda', () => {
  assert.equal(p.update.title, 'Recados no modo claro');
  assert(/modo claro/.test(p.update.summary) && /Recados do dia/.test(p.update.summary));
  for (const frase of [/Recados do dia/, /modo claro/, /No modo escuro nada muda/, /Só o arquivo professor\.html muda, e só o estilo visual/, /Nenhum dado, tela, regra, botão ou texto foi alterado/,
    /cartão do aluno e o cartão do mascote \(quando o mascote está ligado\) também não foram alterados/, /1\.12\.285/, /Descanso, cronômetros, alarmes e notificações não foram alterados\./]) assert(frase.test(p.notes), 'as notas deveriam dizer: ' + frase);
});
t('Só professor.html mudou e a única edição é a das duas regras de CSS', () => {
  assert.deepEqual(Object.keys(G.edits), ['professor.html']);
  assert.equal(G.TEACHER_EDITS.length, 1);
  assert.equal(G.STYLE_EDITS.length, 1);
  assert.equal(G.TEACHER_EDITS[0].next, G.CSS_ANCHOR + G.CSS_CARD + G.CSS_TITLE);
});
t('Prova de reversão: desfeita a edição, professor.html volta byte a byte ao do 1.12.285', () => {
  let undone = page;
  for (const edit of G.TEACHER_EDITS.slice().reverse()) undone = G.undoEdit(undone, edit);
  assert.equal(undone, baseTeacher);
  assert.equal(sha(undone), sha(baseTeacher));
});
t('A âncora existe uma vez no 1.12.285 e as regras novas existem uma vez no 1.12.286', () => {
  assert.equal(count(baseTeacher, G.CSS_ANCHOR), 1);
  assert.equal(count(baseTeacher, G.LIGHT_CARD), 0, 'o 1.12.285 não tinha nenhuma regra do modo claro para este cartão');
  assert.equal(count(page, G.CSS_CARD), 1);
  assert.equal(count(page, G.CSS_TITLE), 1);
  assert.equal(count(page, G.CSS_ANCHOR), 1);
  assert.equal(page.length - baseTeacher.length, G.CSS_CARD.length + G.CSS_TITLE.length);
});
t('O gerador recusa aplicar duas vezes, recusa outra base e é determinístico', () => {
  assert.throws(() => G.makeUpdate(p));
  assert.throws(() => G.makeUpdate({...o, version: '1.12.284'}));
  assert.throws(() => G.makeUpdate({...o, sequence: 390}));
  assert.throws(() => G.applyAll(page, G.TEACHER_EDITS), /já foi aplicada/);
  assert.equal(JSON.stringify(G.makeUpdate(o)), JSON.stringify(p));
  assert.equal(JSON.stringify(G.makeUpdate({...o, agendaSignature: 'assinatura-qualquer'})), JSON.stringify(p), 'uma assinatura na base não passa para o pacote novo');
});
t('A linha de comando grava exatamente o JSON do pacote e não sobrescreve arquivo existente; tamanho abaixo de 24 MiB', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-recados-modo-claro-'));
  try {
    const out = path.join(dir, 'saida.agenda.json');
    execFileSync(process.execPath, [GENERATOR, SOURCE, out], {stdio: 'pipe'});
    const written = fs.readFileSync(out, 'utf8');
    assert.equal(written, JSON.stringify(p, null, 2) + '\n');
    assert(Buffer.byteLength(written, 'utf8') < 24 * 1024 ** 2);
    assert.throws(() => execFileSync(process.execPath, [GENERATOR, SOURCE, out], {stdio: 'pipe'}));
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

// ---------- 2) nenhum código mudou ----------
t('Os scripts são exatamente os mesmos do 1.12.285 e todos compilam', () => {
  const before = classicScripts(baseTeacher), after = classicScripts(page);
  assert(before.length > 50, 'poucos scripts: ' + before.length);
  assert.equal(after.length, before.length);
  after.forEach((m, k) => { assert.equal(m[0], before[k][0], 'o script ' + k + ' mudou'); new vm.Script(m[2]); });
});
t('A única diferença para o 1.12.285 é o texto das duas regras novas (nenhum outro estilo, tag ou atributo mudou)', () => {
  assert.deepEqual(auditAgainstBase(page), []);
  const added = G.CSS_CARD + G.CSS_TITLE;
  assert(!/[<>]|url\(|@import|expression|javascript:|\bscript\b|=>|function|\bon[a-z]+=/i.test(added), 'o texto novo é só CSS: ' + added);
  assert.equal(count(page, '</style>'), count(baseTeacher, '</style>'));
  assert.equal(count(page, '<style'), count(baseTeacher, '<style'));
});
t('Os arquivos index.html, avaliacoes.html e cadastro.html seguem byte a byte iguais (o cartão do aluno vive no index.html e não muda)', () => {
  for (const k of ['index.html', 'avaliacoes.html', 'cadastro.html']) assert.equal(sha(p.files[k]), sha(o.files[k]), k);
});
t('Nenhum link de convite do grupo no pacote', () => {
  assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(JSON.stringify(p.files)));
});

// ---------- 3) as regras novas, lidas da folha de estilo ----------
t('Regras do modo claro: só no marcador do modo claro, só no cartão do professor sem mascote, fora de @media, depois da âncora', () => {
  assert.deepEqual(auditCss(page), []);
  assert.equal(G.LIGHT_CARD, CARD_SELECTOR);
  assert.equal(G.LIGHT_TITLE, TITLE_SELECTOR);
});
t('O 1.12.285 não passa nesta auditoria (não tinha as regras): o teste enxerga a falta', () => {
  assert.notDeepEqual(auditCss(baseTeacher), []);
});
t('Especificidade: as regras novas vencem as que já existiam (cartão escuro e título verde-limão) sem depender da ordem', () => {
  assert.deepEqual(specificity(CARD_SELECTOR), [0, 3, 1]);
  assert.deepEqual(specificity(TITLE_SELECTOR), [0, 4, 2]);
  assert.deepEqual(specificity('.ap-teacher-mascot.ap-recado-only'), [0, 2, 0]);
  assert.deepEqual(specificity('.ap-mascot-recados strong'), [0, 1, 1]);
  assert(compare(specificity(CARD_SELECTOR), specificity('.ap-teacher-mascot.ap-recado-only')) > 0);
  assert(compare(specificity(TITLE_SELECTOR), specificity('.ap-mascot-recados strong')) > 0);
  // as regras originais continuam lá, com !important, para o modo escuro
  const original = flatten(parseAll(page).flat()).find(r => /\.ap-teacher-mascot\.ap-recado-only/.test(r.prelude) && /^\.ap-mascot-home\.ap-recado-only/.test(r.prelude));
  assert(original, 'regra original do cartão não encontrada');
  const dark = declarations(original.body);
  assert(dark.some(d => d.prop === 'background' && /^var\(--surface,#191b1f\)!important$/.test(d.value)), 'fundo escuro original');
  assert(dark.some(d => d.prop === 'color' && /^var\(--text,#f3f3f5\)!important$/.test(d.value)), 'texto original');
  const originalRule = baseTeacher.slice(baseTeacher.indexOf(original.prelude + '{'));
  assert(page.includes(originalRule.slice(0, originalRule.indexOf('}') + 1)), 'a regra original segue intacta');
});
t('O marcador e as variáveis usados são os que o próprio aplicativo define (modo claro e paletas dos cinco temas)', () => {
  assert.equal(count(page, "root.dataset.agendaColorMode=p.light?'light':'dark'"), 1, 'o aplicativo marca o modo claro em <html>');
  assert.equal(count(page, 'delete root.dataset.agendaColorMode'), 1, 'sem tema salvo o marcador some e vale o escuro');
  assert.equal(count(page, "root.style.setProperty('--ac-'+key,value)"), 1, 'toda chave da paleta vira --ac-<chave>');
  // as três paletas (padrão, Performance Pro e Roxo Profundo) devolvem as chaves que as regras usam
  const spots = [...page.matchAll(/'accent-border'/g)].map(m => m.index);
  assert.equal(spots.length, 3, 'três paletas');
  for (const at of spots) {
    const around = page.slice(Math.max(0, at - 700), at + 40);
    for (const key of [/\bsurface\b/, /\btext:ink\b/, /\baccent\b/, /\bline\b/]) assert(key.test(around), 'a paleta perto de ' + at + ' não define ' + key);
  }
  // o texto e o destaque são validados contra o fundo e o cartão da paleta (4,65:1 e 4,75:1)
  assert.equal(count(page, 'readableSurface=color=>legible(color,[ink],4.65)'), 1);
  assert(/const accent=legible\(config\.id==='neon-reference'\?'#d34bf3':config\.primary,backgrounds,4\.75\)/.test(page));
});
t('Os valores de reserva formam pares legíveis (texto sobre fundo e título sobre fundo, mínimo 4,5:1) mesmo sem a paleta', () => {
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = hex => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const fallback = (rule, prop) => /var\(--ac-[a-z-]+,(#[0-9a-f]{6}|#[0-9a-f]{3})\)/.exec(declarations(flatten(parseAll(page).flat()).find(r => r.prelude === rule).body).find(d => d.prop === prop).value)[1];
  const full = h => (h.length === 4 ? '#' + [...h.slice(1)].map(c => c + c).join('') : h);
  const surface = full(fallback(CARD_SELECTOR, 'background-color')), text = full(fallback(CARD_SELECTOR, 'color')), accent = full(fallback(TITLE_SELECTOR, 'color'));
  assert(ratio(text, surface) >= 4.5, 'texto de reserva: ' + ratio(text, surface).toFixed(2));
  assert(ratio(accent, surface) >= 4.5, 'título de reserva: ' + ratio(accent, surface).toFixed(2));
});

// ---------- 4) sabotagens: o teste precisa pegar cada uma ----------
const mutate = (from, to) => page.replace(from, () => to);
const mutants = {
  'regras sem o marcador do modo claro (valeriam também no escuro)': mutate(G.CSS_CARD, G.CSS_CARD.replace(LIGHT_MARK + ' ', '')),
  'marcador do modo escuro em vez do claro': mutate(G.CSS_CARD, G.CSS_CARD.replace('"light"', '"dark"')),
  'seletor também no cartão do aluno': mutate(G.CSS_CARD, G.CSS_CARD.replace('.ap-teacher-mascot.ap-recado-only', '.ap-recado-only')),
  'seletor também no cartão do mascote ligado': mutate(G.CSS_CARD, G.CSS_CARD.replace('.ap-teacher-mascot.ap-recado-only', '.ap-teacher-mascot')),
  'seletor com :where (especificidade igual à da regra escura)': mutate(G.CSS_CARD, G.CSS_CARD.replace(LIGHT_MARK + ' ', ':where(' + LIGHT_MARK + ') ')),
  'fundo sem !important': mutate(G.CSS_CARD, G.CSS_CARD.replace('var(--ac-surface,#fff)!important', 'var(--ac-surface,#fff)')),
  'texto sem !important': mutate(G.CSS_CARD, G.CSS_CARD.replace('var(--ac-text,#17131d)!important', 'var(--ac-text,#17131d)')),
  'título sem !important': mutate(G.CSS_TITLE, G.CSS_TITLE.replace('!important', '')),
  'atalho background em vez de background-color': mutate(G.CSS_CARD, G.CSS_CARD.replace('background-color:', 'background:')),
  'variável sem valor de reserva': mutate(G.CSS_CARD, G.CSS_CARD.replace('var(--ac-surface,#fff)', 'var(--ac-surface)')),
  'variável errada para o fundo (--ac-bg)': mutate(G.CSS_CARD, G.CSS_CARD.replace('--ac-surface', '--ac-bg')),
  'cor fixa no lugar da variável do texto': mutate(G.CSS_CARD, G.CSS_CARD.replace('var(--ac-text,#17131d)', '#17131d')),
  'título com a cor do mascote (verde-limão de reserva)': mutate(G.CSS_TITLE, G.CSS_TITLE.replace('var(--ac-accent,#7437b8)', 'var(--mascot-accent,#b5ed43)')),
  'propriedade a mais (esconde o cartão)': mutate(G.CSS_CARD, G.CSS_CARD.replace('}', ';display:none!important}')),
  'propriedade a menos (sem a borda)': mutate(G.CSS_CARD, G.CSS_CARD.replace(/border-color:var\(--ac-accent-border,var\(--ac-line,#d1d0d4\)\)!important;/, '')),
  'regras dentro de @media': mutate(G.CSS_CARD + G.CSS_TITLE, '@media(min-width:0){' + G.CSS_CARD + G.CSS_TITLE + '}'),
  'regra do título ausente': mutate(G.CSS_TITLE, ''),
  'regra do cartão ausente': mutate(G.CSS_CARD, ''),
  'regra do cartão duplicada': mutate(G.CSS_CARD, G.CSS_CARD + G.CSS_CARD),
  'título que pega qualquer strong do cartão': mutate(G.CSS_TITLE, G.CSS_TITLE.replace(' .ap-mascot-recados strong', ' strong')),
  'ordem trocada (título antes do cartão)': mutate(G.CSS_CARD + G.CSS_TITLE, G.CSS_TITLE + G.CSS_CARD),
  'regras longe da âncora (no fim da folha)': (() => { const without = mutate(G.CSS_CARD + G.CSS_TITLE, ''); const at = without.indexOf('</style>', without.indexOf(G.CSS_ANCHOR)); return without.slice(0, at) + G.CSS_CARD + G.CSS_TITLE + without.slice(at); })(),
  'regra com um url() de fora': mutate(G.CSS_CARD, G.CSS_CARD.replace('}', ';background-image:url(https://exemplo.com/x.png)!important}')),
  // regras que já existiriam na folha e com !important: as novas só valem se forem estritamente mais específicas
  'regra concorrente mais específica (devolveria o cartão escuro)': mutate(G.CSS_TITLE, G.CSS_TITLE + ':root[data-agenda-colors] .home-card.ap-teacher-mascot.ap-recado-only{background:#191b1f!important}'),
  'regra concorrente de mesma especificidade no cartão': mutate(G.CSS_TITLE, G.CSS_TITLE + 'html[data-agenda-colors] .ap-teacher-mascot.ap-recado-only{color:#fff!important}'),
  'regra concorrente de mesma especificidade no título': mutate(G.CSS_TITLE, G.CSS_TITLE + 'html[data-agenda-colors] .ap-teacher-mascot.ap-recado-only .ap-mascot-recados strong{color:#b5ed43!important}')
};
const baseRuleStart = '.ap-mascot-home.ap-recado-only,.ap-teacher-mascot.ap-recado-only{display:block;min-height:0!important;padding:13px 15px!important;background:var(--surface,#191b1f)!important;';
const diffMutants = {
  'regra escura original alterada (#191b1f -> #ffffff)': page.replace(baseRuleStart, baseRuleStart.replace('#191b1f', '#ffffff')),
  'regra do título verde-limão alterada': page.replace('color:var(--mascot-accent,var(--primary,#b5ed43))!important}', 'color:#000!important}'),
  'regra do cartão do aluno no modo claro alterada': page.replace(G.CSS_ANCHOR, G.CSS_ANCHOR.replace('#fff', '#eee')),
  'um script alterado junto': page.replace('<script data-agenda-registration>', '<script data-agenda-registration>/* x */'),
  'um estilo qualquer alterado junto': page.replace('.ap-mascot-recados[hidden]{display:none!important}', '.ap-mascot-recados[hidden]{display:block!important}')
};
t('Sabotagens das regras: cada variação é pega pela auditoria do CSS', () => {
  for (const [name, mutated] of Object.entries(mutants)) {
    assert.notEqual(mutated, page, 'a sabotagem não mudou nada: ' + name);
    const problems = auditCss(mutated);
    assert(problems.length > 0, 'o teste não pegou a sabotagem: ' + name);
    if (process.env.VER_SABOTAGEM) console.log('  sabotagem pega: ' + name + '\n      -> ' + problems[0].slice(0, 150));
  }
});
t('Sabotagens do que não pode mudar: qualquer alteração além das duas regras é pega', () => {
  for (const [name, mutated] of Object.entries(diffMutants)) {
    assert.notEqual(mutated, page, 'a sabotagem não mudou nada: ' + name);
    const problems = auditAgainstBase(mutated);
    assert(problems.length > 0, 'o teste não pegou a sabotagem: ' + name);
    if (process.env.VER_SABOTAGEM) console.log('  sabotagem pega: ' + name + '\n      -> ' + problems[0].slice(0, 150));
  }
});
t('Sabotagens do pacote: versão, sequência, assinatura, outro arquivo, ordem das chaves e limites são pegos', () => {
  const clone = () => JSON.parse(JSON.stringify(p));
  const cases = {
    'versão': pkg => { pkg.version = '1.12.285'; },
    'sequência': pkg => { pkg.sequence = 391; },
    'assinatura presente': pkg => { pkg.agendaSignature = 'x'; },
    'index.html alterado': pkg => { pkg.files['index.html'] += ' '; },
    'cadastro.html alterado': pkg => { pkg.files['cadastro.html'] += ' '; },
    'avaliacoes.html alterado': pkg => { pkg.files['avaliacoes.html'] += ' '; },
    'professor.html igual ao 1.12.285': pkg => { pkg.files['professor.html'] = o.files['professor.html']; },
    'ordem das chaves': pkg => { const {notes, ...rest} = pkg; return {...rest, notes}; },
    'notas acima de 4000': pkg => { pkg.notes = 'x'.repeat(4001); },
    'resumo acima de 200': pkg => { pkg.update.summary = 'x'.repeat(201); },
    'histórico modular alterado': pkg => { pkg.modularUpdates = [...(pkg.modularUpdates || []), {id: 'x'}]; },
    'bridgeVersion alterado': pkg => { pkg.bridgeVersion = (pkg.bridgeVersion || 0) + 1; }
  };
  for (const [name, change] of Object.entries(cases)) {
    const pkg = clone();
    const result = change(pkg);
    assert(auditPackage(result || pkg).length > 0, 'o teste não pegou a sabotagem: ' + name);
  }
});

(async () => {
  for (const [name, fn] of queue) {
    try { await fn(); ok++; console.log('OK   ' + name); } catch (e) { bad++; console.log('FALHA ' + name + ' -> ' + (e && e.message)); }
  }
  console.log(`\nsabotagens: ${Object.keys(mutants).length} do CSS + ${Object.keys(diffMutants).length} do que não pode mudar + 12 do pacote`);
  console.log(`resultado: ${ok} ok, ${bad} falhas`);
  process.exit(bad ? 1 : 0);
})();
