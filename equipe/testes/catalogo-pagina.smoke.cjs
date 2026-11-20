'use strict';
// Confere o pacote 1.12.287 (Catálogo de exercícios como página + trava da página de trás nas janelas) contra o pacote 1.12.286
// (o que está na main). Não precisa de navegador nem de internet:
//   node equipe/testes/catalogo-pagina.smoke.cjs
// A mudança é só de estilo (um bloco <style> novo no professor.html), então o teste confere, de forma estática:
//  - o pacote: versão, sequência, escopo (só professor.html), reversão byte a byte, determinismo, linha de comando;
//  - que a ÚNICA diferença para o 1.12.286 é o bloco de estilo novo (nenhum script, nenhum outro estilo, tag ou atributo mudou);
//  - as regras novas, lendo a folha de estilo de verdade: a trava do corpo só vale em aparelho de toque e só com janela aberta
//    (body.dialog-open); a contenção de rolagem é genérica e só usa overscroll-behavior; tudo o que muda a aparência é do
//    Catálogo (#workoutCatalogDialog, só aberto), com as propriedades combinadas e nada além delas (nada de touch-action,
//    posição, cor, fundo, z-index...); e as regras do Catálogo vencem, por especificidade, todas as regras já existentes que
//    mexem nas mesmas propriedades do mesmo elemento (inclusive as !important do tema Performance Pro);
//  - o que o CSS espera do aplicativo (classes dialog/open/dialog-open, 38 janelas, o cartão do Catálogo como .sheet.workout-sheet,
//    a devolução da página ao ponto de antes ao fechar);
//  - e roda variações sabotadas das regras (sem @media, trava em outro elemento, touch-action, Catálogo generalizado, id trocado,
//    sem !important, sem a regra do tema Performance Pro, bloco fora do lugar...) para provar que o teste pega o erro.
// O resultado visual (toque real no Chrome: fundo parado, cartão rolando, Catálogo em página inteira nos cinco temas, claro e
// escuro, comparação do estilo de todas as janelas antes e depois) foi conferido à parte (equipe/testes/navegador/catalogo-pagina).
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-catalogo-pagina-1.12.287.cjs');
// O pacote-base é o 1.12.286, que o Tiago subiu na main com o nome abaixo (commit c3e8d57, SHA-256 abaixo). Se um dia esse
// arquivo for trocado, o teste busca o original no histórico.
const SOURCE_NAME = 'AgendaPersonal-1.12.286-Recados-Modo-Claro-Para-Assinar.agenda.json';
const SOURCE_COMMIT = 'c3e8d570995b0995fcf38ffd3876b06dbfaf9692';
const SOURCE_SHA256 = '7de8a60cdbba5d3f17d3d4072e76bb823017ef7427edf97ff015ab22317621e8';
const SOURCE = (() => {
  const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  const inRoot = path.join(ROOT, SOURCE_NAME);
  if (fs.existsSync(inRoot) && digest(fs.readFileSync(inRoot)) === SOURCE_SHA256) return inRoot;
  let fromHistory;
  try {
    fromHistory = execFileSync('git', ['show', SOURCE_COMMIT + ':' + SOURCE_NAME], {cwd: ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
  } catch (problem) {
    throw new Error('Não achei o pacote 1.12.286 (SHA-256 ' + SOURCE_SHA256 + '): o arquivo da raiz é outro e o commit ' +
      SOURCE_COMMIT.slice(0, 7) + ' não está neste clone (se o clone é raso, rode: git fetch --unshallow).');
  }
  assert.equal(digest(fromHistory), SOURCE_SHA256, 'o 1.12.286 do histórico do git não é o esperado');
  const copy = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'base-286-')), SOURCE_NAME);
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
    const raw = text.slice(colon + 1).trim();
    out.push({prop: text.slice(0, colon).trim().toLowerCase(), value: raw, important: /!important\s*$/.test(raw)});
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

// ---------- o que as regras novas devem ser (e nada além disso) ----------
const CATALOG_ID = '#workoutCatalogDialog';
const CATALOG_OPEN = CATALOG_ID + '.dialog.open';
const SHEET_SELECTOR = CATALOG_OPEN + '>.sheet';
const PRO_SELECTOR = 'html[data-agenda-design=pro-tl] ' + SHEET_SELECTOR;
const LOCK_MEDIA = '@media(hover:none),(pointer:coarse)';
// Cada regra: seletor, e a lista exata de declarações [propriedade, valor] na ordem.
const PLAN = [
  {where: 'media', media: LOCK_MEDIA, selector: 'body.dialog-open', declarations: [['overflow', 'hidden']]},
  {where: 'top', selector: '.dialog,.dialog>.sheet', declarations: [['overscroll-behavior', 'contain']]},
  {where: 'top', selector: CATALOG_OPEN, declarations: [['padding', '0!important']]},
  {where: 'top', selector: SHEET_SELECTOR, declarations: [
    ['width', '100%'], ['height', '100%!important'], ['max-height', 'none!important'], ['border-width', '0'], ['border-radius', '0'], ['box-shadow', 'none'],
    ['padding-top', 'calc(18px + env(safe-area-inset-top))'], ['padding-bottom', 'calc(92px + env(safe-area-inset-bottom))']]},
  {where: 'top', selector: PRO_SELECTOR, declarations: [['padding-bottom', 'calc(22px + env(safe-area-inset-bottom))']]}
];
const STYLE_ID = 'dialog-scroll-lock-catalog-page';
const ANCHOR = '<style id="previous-page-navigation">';
// Famílias de propriedades que as regras do Catálogo definem (um atalho e suas partes disputam o mesmo valor).
const FAMILY = {
  padding: ['padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-block', 'padding-inline', 'padding-block-start', 'padding-block-end', 'padding-inline-start', 'padding-inline-end'],
  'padding-top': ['padding', 'padding-top', 'padding-block', 'padding-block-start'],
  'padding-bottom': ['padding', 'padding-bottom', 'padding-block', 'padding-block-end'],
  width: ['width', 'inline-size'],
  height: ['height', 'block-size'],
  'max-height': ['max-height', 'max-block-size'],
  'border-width': ['border', 'border-width', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-block-width', 'border-inline-width', 'border-block', 'border-inline'],
  'border-radius': ['border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-start-start-radius', 'border-start-end-radius', 'border-end-start-radius', 'border-end-end-radius'],
  'box-shadow': ['box-shadow']
};
const DIALOG_SUBJECT = /(^|[\s>+~])[^\s>+~]*\.dialog(?![\w-])[^\s>+~]*$/;
const SHEET_SUBJECT = /(^|[\s>+~])[^\s>+~]*\.(sheet|workout-sheet)(?![\w-])[^\s>+~]*$/;
const subjectOf = selector => selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '').replace(/\((?:[^()]|\([^()]*\))*\)/g, '()').trim();
// Lê o bloco novo direto da página e devolve a lista de problemas (vazia = tudo certo).
function auditCss(html) {
  const problems = [];
  const found = [...html.matchAll(new RegExp('<style id="' + STYLE_ID + '">([\\s\\S]*?)</style>', 'g'))];
  if (found.length !== 1) { problems.push('esperava 1 bloco <style id="' + STYLE_ID + '"> e achei ' + found.length); return problems; }
  if (!html.includes(found[0][0] + ANCHOR)) problems.push('o bloco novo precisa vir logo antes de ' + ANCHOR);
  if (count(html, ANCHOR) !== 1) problems.push('a âncora ' + ANCHOR + ' deveria existir uma vez');
  const css = found[0][1];
  if (/touch-action/i.test(css)) problems.push('touch-action não pode ser usado (no WebKit o none do pai trava a rolagem dos filhos)');
  const tops = parseCss(css);
  if (tops.length !== PLAN.length) { problems.push('esperava ' + PLAN.length + ' regras no nível principal e achei ' + tops.length); return problems; }
  const mine = [];
  PLAN.forEach((plan, index) => {
    let rule = tops[index];
    if (plan.where === 'media') {
      if (!rule.at || rule.prelude.replace(/\s+/g, '') !== plan.media) { problems.push('regra ' + (index + 1) + ': esperava ' + plan.media + ' e achei ' + rule.prelude); return; }
      const inner = rule.children;
      if (inner.length !== 1) { problems.push('regra ' + (index + 1) + ': esperava 1 regra dentro do @media'); return; }
      rule = inner[0];
    } else if (rule.at) { problems.push('regra ' + (index + 1) + ': não pode estar dentro de @media/@supports'); return; }
    if (rule.prelude.replace(/\s+/g, ' ').replace(/\s*([>,])\s*/g, '$1') !== plan.selector) problems.push('regra ' + (index + 1) + ': seletor ' + rule.prelude + ' (esperado ' + plan.selector + ')');
    const decls = declarations(rule.body).map(d => [d.prop, d.value.replace(/\s+/g, ' ').replace(/\s*!important$/, '!important')]);
    if (JSON.stringify(decls) !== JSON.stringify(plan.declarations)) problems.push('regra ' + (index + 1) + ' (' + plan.selector + '): declarações ' + JSON.stringify(decls));
    mine.push({rule, plan, selector: plan.selector});
  });
  if (problems.length) return problems;
  // escopo: o único id é o do Catálogo, só aberto; as regras do Catálogo não atingem .dialog/.sheet genéricos
  for (const m of mine) {
    const ids = m.selector.match(/#[\w-]+/g) || [];
    if (ids.some(id => id !== CATALOG_ID)) problems.push('id fora do combinado em ' + m.selector);
    if (m.plan.declarations.some(([prop]) => /^(border|padding|width|height|max-height|box-shadow)/.test(prop)) && !ids.length) problems.push('regra de aparência sem o id do Catálogo: ' + m.selector);
    if (ids.length && !/\.dialog\.open/.test(m.selector)) problems.push('a regra do Catálogo precisa valer só com a janela aberta (.dialog.open): ' + m.selector);
  }
  // vencem as regras que já existiam: para cada declaração do Catálogo, nenhuma regra existente que atinja o mesmo elemento e
  // mexa na mesma propriedade pode ganhar (importante vence normal; mesma importância: maior especificidade; empate: a mais tardia,
  // e o bloco novo vem antes das folhas dos temas, então empate conta como derrota).
  const mineSet = new Set(mine.map(m => m.rule));
  const others = parseAll(html.replace(found[0][0], '')).flatMap(flatten).filter(r => !mineSet.has(r));
  for (const m of mine.filter(x => /#workoutCatalogDialog/.test(x.selector) || /pro-tl/.test(x.selector))) {
    const mineSpec = specificity(m.selector);
    const isSheetRule = />\.sheet$/.test(m.selector);
    const subject = isSheetRule ? SHEET_SUBJECT : DIALOG_SUBJECT;
    for (const [prop, rawValue] of m.plan.declarations) {
      const family = FAMILY[prop] || [prop];
      const important = /!important$/.test(rawValue);
      for (const other of others) {
        for (const selector of other.prelude.split(',').map(s => s.trim())) {
          if (!subject.test(subjectOf(selector))) continue;
          const ids = selector.match(/#[\w-]+/g) || [];
          if (ids.some(id => id !== CATALOG_ID)) continue; // é de outra janela
          for (const d of declarations(other.body)) {
            if (!family.includes(d.prop)) continue;
            if (d.important && !important) problems.push('regra existente !important vence ' + prop + ' do Catálogo: ' + selector + ' {' + d.prop + '}');
            else if (d.important === important && compare(specificity(selector), mineSpec) >= 0) problems.push('regra existente com especificidade igual ou maior para ' + prop + ': ' + selector);
          }
        }
      }
    }
  }
  // a regra do tema Performance Pro vence a do Catálogo geral (mesma propriedade, mais especificidade)
  if (compare(specificity(PRO_SELECTOR), specificity(SHEET_SELECTOR)) <= 0) problems.push('a regra do Performance Pro precisa ter mais especificidade que a regra geral do Catálogo');
  return problems;
}
// Tudo que não é o bloco novo precisa ser idêntico ao 1.12.286 (nenhum script, nenhum outro estilo).
function auditAgainstBase(html) {
  const problems = [];
  const restored = html.replace(G.STYLE_BLOCK, '');
  if (restored !== baseTeacher) problems.push('professor.html tem diferenças além do bloco de estilo novo');
  if (html.length - baseTeacher.length !== G.STYLE_BLOCK.length) problems.push('o tamanho acrescentado não é o do bloco');
  return problems;
}

// ---------- 1) pacote ----------
function auditPackage(pkg) {
  const problems = [];
  const want = (cond, message) => { if (!cond) problems.push(message); };
  want(pkg.version === '1.12.287', 'versão ' + pkg.version);
  want(pkg.sequence === 393, 'sequência ' + pkg.sequence);
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
t('Versão 1.12.287 / seq 393 / sem assinatura, com o mesmo aplicativo e formato do 1.12.286', () => {
  assert.equal(o.version, '1.12.286');
  assert.equal(o.sequence, 392);
  assert(p.sequence > o.sequence);
  assert.deepEqual(auditPackage(p), []);
});
t('Aviso: título, resumo e notas coerentes com o que o pacote faz, sem prometer o que não muda', () => {
  assert.equal(p.update.title, 'Catálogo como página');
  assert(/Catálogo de exercícios/.test(p.update.summary) && /página/.test(p.update.summary));
  for (const frase of [/Catálogo de exercícios/, /página de trás fica parada/, /o cartão continua rolando normalmente por dentro/, /a página volta para o mesmo ponto em que estava/,
    /abre como uma página inteira/, /Vale também quando o catálogo é aberto para escolher um exercício dentro de um treino/, /Os cinco temas .* mantêm as cores de sempre/,
    /As outras janelas continuam com o mesmo visual de antes/, /Só o arquivo professor\.html muda, e só o estilo visual/, /Nenhum dado, tela, regra, botão ou texto foi alterado/,
    /1\.12\.286/, /Descanso, cronômetros, alarmes e notificações não foram alterados\./]) assert(frase.test(p.notes), 'as notas deveriam dizer: ' + frase);
});
t('Só professor.html mudou e a única edição é a do bloco de estilo', () => {
  assert.deepEqual(Object.keys(G.edits), ['professor.html']);
  assert.equal(G.TEACHER_EDITS.length, 1);
  assert.equal(G.STYLE_EDITS.length, 1);
  assert.equal(G.TEACHER_EDITS[0].next, G.STYLE_BLOCK + G.CSS_ANCHOR);
  assert.equal(G.TEACHER_EDITS[0].previous, G.CSS_ANCHOR);
});
t('Prova de reversão: desfeita a edição, professor.html volta byte a byte ao do 1.12.286', () => {
  let undone = page;
  for (const edit of G.TEACHER_EDITS.slice().reverse()) undone = G.undoEdit(undone, edit);
  assert.equal(undone, baseTeacher);
  assert.equal(sha(undone), sha(baseTeacher));
});
t('A âncora existe uma vez no 1.12.286 e o bloco novo existe uma vez no 1.12.287', () => {
  assert.equal(count(baseTeacher, G.CSS_ANCHOR), 1);
  assert.equal(count(baseTeacher, G.STYLE_OPEN), 0, 'o 1.12.286 não tinha o bloco');
  assert.equal(count(page, G.STYLE_BLOCK), 1);
  assert.equal(count(page, G.STYLE_OPEN), 1);
  assert.equal(count(page, G.CSS_ANCHOR), 1);
  assert.equal(page.length - baseTeacher.length, G.STYLE_BLOCK.length);
});
t('O gerador recusa aplicar duas vezes, recusa outra base e é determinístico', () => {
  assert.throws(() => G.makeUpdate(p));
  assert.throws(() => G.makeUpdate({...o, version: '1.12.285'}));
  assert.throws(() => G.makeUpdate({...o, sequence: 391}));
  assert.throws(() => G.applyAll(page, G.TEACHER_EDITS), /já foi aplicada/);
  assert.equal(JSON.stringify(G.makeUpdate(o)), JSON.stringify(p));
  assert.equal(JSON.stringify(G.makeUpdate({...o, agendaSignature: 'assinatura-qualquer'})), JSON.stringify(p), 'uma assinatura na base não passa para o pacote novo');
});
t('A linha de comando grava exatamente o JSON do pacote e não sobrescreve arquivo existente; tamanho abaixo de 24 MiB', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-catalogo-pagina-'));
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
t('Os scripts são exatamente os mesmos do 1.12.286 e todos compilam', () => {
  const before = classicScripts(baseTeacher), after = classicScripts(page);
  assert(before.length > 50, 'poucos scripts: ' + before.length);
  assert.equal(after.length, before.length);
  after.forEach((m, k) => { assert.equal(m[0], before[k][0], 'o script ' + k + ' mudou'); new vm.Script(m[2]); });
});
t('A única diferença para o 1.12.286 é o bloco de estilo novo (nenhum outro estilo, tag ou atributo mudou)', () => {
  assert.deepEqual(auditAgainstBase(page), []);
  assert(!/[<>]|url\(|@import|expression|javascript:|\bscript\b|=>|function|\bon[a-z]+=/i.test(G.CSS_RULES.replace(/>\.sheet/g, '').replace(/\.dialog>/g, '')), 'o texto novo é só CSS: ' + G.CSS_RULES);
  assert.equal(count(page, '</style>') - count(baseTeacher, '</style>'), 1);
  assert.equal(count(page, '<style') - count(baseTeacher, '<style'), 1);
});
t('Os arquivos index.html, avaliacoes.html e cadastro.html seguem byte a byte iguais', () => {
  for (const k of ['index.html', 'avaliacoes.html', 'cadastro.html']) assert.equal(sha(p.files[k]), sha(o.files[k]), k);
});
t('Nenhum link de convite do grupo no pacote', () => {
  assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(JSON.stringify(p.files)));
});

// ---------- 3) as regras novas, lidas da folha de estilo ----------
t('Regras novas: exatamente as 5 combinadas, com as propriedades combinadas e nada além; bloco logo antes da âncora', () => {
  assert.deepEqual(auditCss(page), []);
  assert.equal(G.CSS_LOCK_BODY, LOCK_MEDIA + '{body.dialog-open{overflow:hidden}}');
  assert.equal(G.CATALOG_OPEN, CATALOG_OPEN);
  assert.equal(G.PRO_SELECTOR, PRO_SELECTOR);
  assert.equal(G.STYLE_ID, STYLE_ID);
});
t('O 1.12.286 não passa nesta auditoria (não tinha o bloco): o teste enxerga a falta', () => {
  assert.notDeepEqual(auditCss(baseTeacher), []);
});
t('A trava do corpo só vale em aparelho de toque (@media hover:none ou pointer:coarse) e só com janela aberta (body.dialog-open)', () => {
  const tops = parseCss(styleBlocks(page).find(css => css.startsWith(G.CSS_LOCK_BODY)));
  assert.equal(tops[0].prelude.replace(/\s+/g, ''), LOCK_MEDIA);
  assert.equal(tops[0].children.length, 1);
  assert.equal(tops[0].children[0].prelude, 'body.dialog-open');
  assert.deepEqual(declarations(tops[0].children[0].body).map(d => [d.prop, d.value]), [['overflow', 'hidden']]);
  // nenhum overflow:hidden fora do @media neste bloco (o computador com mouse não muda)
  const outside = tops.filter(r => !r.at).flatMap(r => declarations(r.body)).filter(d => d.prop.startsWith('overflow'));
  assert.deepEqual(outside, []);
});
t('Especificidade: as regras do Catálogo vencem as do tema Performance Pro (!important) e as gerais das janelas, sem depender da ordem', () => {
  assert.deepEqual(specificity(CATALOG_OPEN), [1, 2, 0]);
  assert.deepEqual(specificity(SHEET_SELECTOR), [1, 3, 0]);
  assert.deepEqual(specificity(PRO_SELECTOR), [1, 4, 1]);
  const existing = [
    ['html[data-agenda-design=pro-tl] .dialog.open', CATALOG_OPEN],
    ['html[data-agenda-design=pro-tl] .dialog.open .sheet', SHEET_SELECTOR],
    ['.dialog-open .dialog>.sheet', SHEET_SELECTOR],
    ['.function-view .dialog>.sheet', SHEET_SELECTOR],
    ['.dialog-open .dialog', CATALOG_OPEN]
  ];
  for (const [other, mine] of existing) assert(compare(specificity(mine), specificity(other)) > 0, mine + ' deveria vencer ' + other);
  // e essas regras existentes estão mesmo no professor.html (a conta acima é sobre regras reais)
  for (const trecho of ['html[data-agenda-design=pro-tl] .dialog.open{padding:12px!important;align-items:center!important}',
    'html[data-agenda-design=pro-tl] .dialog.open .sheet{margin:0 auto!important;max-height:calc(100dvh - 24px)!important;height:auto!important;border-radius:14px}',
    '.dialog-open .dialog>.sheet{max-height:calc(100dvh - 86px - env(safe-area-inset-bottom))!important}',
    '.dialog-open .dialog{padding-bottom:calc(70px + env(safe-area-inset-bottom))}']) assert.equal(count(baseTeacher, trecho), 1, trecho);
});
t('O Performance Pro esconde a barra Voltar/Painel com janela aberta; por isso só ele volta ao padding-bottom padrão', () => {
  assert.equal(count(page, 'html[data-agenda-design=pro-tl] body:has(.dialog.open) :is(.panel-return-bar,.topbar){display:none}'), 1);
  assert.equal(count(page, '.dialog-open .panel-return-bar{position:fixed;inset:auto 0 0;z-index:300;'), 1, 'nos outros temas a barra fica fixa por cima, e o cartão reserva espaço para ela');
});

// ---------- 4) o que o CSS espera do aplicativo ----------
t('O aplicativo põe dialog-open no <body>, abre a janela com a classe open e devolve a página ao ponto de antes ao fechar', () => {
  assert.equal(count(page, "document.body.classList.toggle('dialog-open',dialogStack.length>0)"), 1);
  assert.equal(count(page, "dialog.classList.add('open');updateDialogLayers();"), 1);
  assert.equal(count(page, 'returnScrollTop:window.scrollY||0'), 1, 'guarda onde a página estava ao abrir');
  assert.equal(count(page, "window.scrollTo({top:entry.returnScrollTop||0,behavior:'instant'})"), 1, 'devolve a página ao ponto de antes ao fechar');
});
t('O Catálogo é uma .dialog com o cartão .sheet.workout-sheet como primeiro filho, e há 38 janelas no mesmo componente (37 no HTML e a da evolução do aluno, criada pelo script)', () => {
  assert.equal([...page.matchAll(/<div id="workoutCatalogDialog" class="dialog" role="dialog" aria-modal="true" aria-labelledby="workoutCatalogTitle">\s*<div class="sheet workout-sheet">/g)].length, 1);
  assert.equal([...page.matchAll(/<div\s[^>]*\bclass="dialog"[^>]*>/g)].length, 37);
  assert.equal(count(page, 'n.id="studentEvolutionDialog",n.className="dialog"'), 1);
  assert.equal(count(page, "openDialog('workoutCatalogDialog');"), 1, 'o Catálogo abre por openWorkoutCatalog, que chama openDialog');
  assert.equal(count(page, 'function openWorkoutCatalog(picking=false){'), 1);
});
t('O que o aplicativo já fazia continua: html/body sem puxar para atualizar, e a contenção já usada no cartão da importação de PDF e no painel de cores', () => {
  assert.equal(count(page, 'body,html{overscroll-behavior-y:none!important}'), 1);
  assert.equal(count(page, '#workoutPdfImportDialog>.sheet{display:block;max-height:92vh;max-height:92dvh;overflow:auto;overscroll-behavior:contain;'), 1);
  assert.equal(count(page, '.color-panel-scroll{overflow:auto;overscroll-behavior:contain;'), 1);
});

// ---------- 5) variações sabotadas: o teste precisa pegar cada uma ----------
const withRules = (rules) => page.replace(G.STYLE_BLOCK, G.STYLE_OPEN + rules + '</style>');
const mutants = [
  ['trava do corpo fora do @media (mudaria o computador com mouse)', css => css.replace(G.CSS_LOCK_BODY, 'body.dialog-open{overflow:hidden}')],
  ['@media errado (por largura em vez de toque)', css => css.replace('(hover:none),(pointer:coarse)', '(max-width:700px)')],
  ['trava em html em vez de body', css => css.replace('{body.dialog-open{overflow:hidden}}', '{html{overflow:hidden}}')],
  ['trava sem a janela aberta (body em vez de body.dialog-open)', css => css.replace('{body.dialog-open{overflow:hidden}}', '{body{overflow:hidden}}')],
  ['touch-action na janela', css => css.replace('.dialog,.dialog>.sheet{overscroll-behavior:contain}', '.dialog,.dialog>.sheet{overscroll-behavior:contain;touch-action:none}')],
  ['contenção só no cartão (sem a janela, que rola sozinha no vídeo)', css => css.replace('.dialog,.dialog>.sheet{overscroll-behavior:contain}', '.dialog>.sheet{overscroll-behavior:contain}')],
  ['overscroll-behavior:none no lugar de contain', css => css.replace('.dialog,.dialog>.sheet{overscroll-behavior:contain}', '.dialog,.dialog>.sheet{overscroll-behavior:none}')],
  ['regra do cartão do Catálogo virou genérica (todas as janelas virariam página)', css => css.replace(G.CSS_CATALOG_SHEET, G.CSS_CATALOG_SHEET.replace('#workoutCatalogDialog.dialog.open>.sheet', '.dialog.open>.sheet'))],
  ['regra da janela do Catálogo virou genérica', css => css.replace(G.CSS_CATALOG_DIALOG, '.dialog.open{padding:0!important}')],
  ['id trocado (outra janela virou página)', css => css.replace(G.CSS_CATALOG_SHEET, G.CSS_CATALOG_SHEET.replace('#workoutCatalogDialog', '#workoutRestDialog'))],
  ['regra do Catálogo sem .open (valeria com a janela fechada)', css => css.replace(G.CSS_CATALOG_SHEET, G.CSS_CATALOG_SHEET.replace('.dialog.open>.sheet', '.dialog>.sheet'))],
  ['altura sem !important (o Performance Pro, com height:auto!important, ganharia)', css => css.replace('height:100%!important', 'height:100%')],
  ['altura máxima sem !important (a regra existente com !important ganharia)', css => css.replace('max-height:none!important', 'max-height:none')],
  ['padding da janela sem !important (o Performance Pro, com padding:12px!important, ganharia)', css => css.replace('padding:0!important', 'padding:0')],
  ['sem a regra do Performance Pro (a lista ficaria sob uma barra que não existe, com folga a mais)', css => css.replace(G.CSS_CATALOG_PRO, '')],
  ['regra do Performance Pro com a especificidade da geral', css => css.replace(G.CSS_CATALOG_PRO, G.CSS_CATALOG_PRO.replace('html[data-agenda-design=pro-tl] ', ''))],
  ['sem o espaço da barra Voltar/Painel (o fim da lista ficaria escondido atrás dela)', css => css.replace('padding-bottom:calc(92px + env(safe-area-inset-bottom))', 'padding-bottom:calc(22px + env(safe-area-inset-bottom))')],
  ['cor de fundo mexida (o tema deixaria de valer)', css => css.replace('border-width:0;', 'border-width:0;background:#000;')],
  ['cantos ainda arredondados', css => css.replace('border-radius:0;', 'border-radius:24px;')],
  ['position:fixed no cartão', css => css.replace('border-width:0;', 'border-width:0;position:fixed;')],
  ['z-index no cartão', css => css.replace('border-width:0;', 'border-width:0;z-index:9999;')],
  ['overflow:hidden no cartão (pararia de rolar)', css => css.replace('border-width:0;', 'border-width:0;overflow:hidden;')],
  ['uma regra a mais', css => css + '.dialog{background:#000}'],
  ['uma regra a menos', css => css.replace(G.CSS_CATALOG_DIALOG, '')]
];
for (const [name, mutate] of mutants) {
  t('Sabotagem: ' + name, () => {
    const rules = mutate(G.CSS_RULES);
    assert.notEqual(rules, G.CSS_RULES, 'a sabotagem não mudou nada (teste mal escrito)');
    assert.notDeepEqual(auditCss(withRules(rules)), [], 'o teste não percebeu a sabotagem');
  });
}
t('Sabotagem: bloco novo fora do lugar (no fim do <head>, longe da âncora)', () => {
  const moved = page.replace(G.STYLE_BLOCK, '').replace('</head>', G.STYLE_BLOCK + '</head>');
  assert.notEqual(moved, page);
  assert.notDeepEqual(auditCss(moved), []);
});
t('Sabotagem: bloco duplicado', () => {
  assert.notDeepEqual(auditCss(page.replace(G.STYLE_BLOCK, G.STYLE_BLOCK + G.STYLE_BLOCK)), []);
});
t('Sabotagem: uma regra existente mais forte para o mesmo elemento (a auditoria de especificidade enxerga)', () => {
  const extra = css => page.replace('</head>', '<style>' + css + '</style></head>');
  assert.deepEqual(auditCss(extra('.sem-efeito{color:red}')), [], 'uma regra qualquer, longe das janelas, não pode atrapalhar');
  assert.notDeepEqual(auditCss(extra('#workoutCatalogDialog.dialog.open>.sheet.workout-sheet{height:auto!important}')), []);
  assert.notDeepEqual(auditCss(extra('html body #workoutCatalogDialog.dialog.open{padding:9px!important}')), []);
  // e uma regra de OUTRA janela com as mesmas propriedades não atrapalha (não é falso alarme)
  assert.deepEqual(auditCss(extra('#workoutRestDialog.dialog.open>.sheet{height:auto!important;padding:3px!important}')), []);
});

(async () => {
  for (const [name, fn] of queue) {
    try { await fn(); ok++; console.log('OK   ' + name); } catch (e) { bad++; console.log('FALHA ' + name + '\n     ' + String(e && e.message || e).split('\n').join('\n     ')); }
  }
  console.log('\n' + ok + ' ok, ' + bad + ' com falha, de ' + queue.length);
  process.exit(bad ? 1 : 0);
})();
