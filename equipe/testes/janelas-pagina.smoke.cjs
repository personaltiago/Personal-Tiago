'use strict';
// Confere o pacote 1.12.288 (as janelas do aplicativo abrem como página inteira, em aparelho de toque) contra o pacote 1.12.287
// (Catálogo como página; entregue ao Tiago, mas não subido na main) e contra o 1.12.286 (o que está na main). Não precisa de
// navegador nem de internet:
//   node equipe/testes/janelas-pagina.smoke.cjs
// A mudança é só de estilo (o bloco <style> do 1.12.287 é trocado por outro), então o teste confere, de forma estática:
//  - o pacote: versão, sequência, escopo (só professor.html), reversão byte a byte, determinismo, linha de comando, e que ele
//    inclui tudo do 1.12.287 e do 1.12.286 (em relação ao 1.12.286 a única diferença é o bloco de estilo);
//  - a classificação das 38 janelas do aplicativo: 33 viram página e 5 ficam como estavam (cada janela está em uma lista só, as duas
//    listas cobrem todas as janelas do HTML e do script, e cada janela mantida tem mesmo o recurso que justifica mantê-la:
//    cronômetro, descanso, despertador ou tamanho calculado pelo aplicativo);
//  - as regras novas, lendo a folha de estilo de verdade: a trava do corpo e a apresentação como página só valem em aparelho de toque;
//    a contenção de rolagem é genérica e só usa overscroll-behavior; tudo o que muda a aparência é das 33 janelas combinadas
//    (id da janela, só aberta), com as propriedades combinadas, todas !important, e nada além delas; e essas regras vencem, por
//    especificidade e importância, todas as regras já existentes que mexem nas mesmas propriedades do mesmo elemento (inclusive as
//    !important do tema Performance Pro, do painel de cores e do enquadramento de foto);
//  - o que o CSS espera do aplicativo (classes dialog/open/dialog-open, 38 janelas, o cartão como primeiro filho .sheet, a devolução
//    da página ao ponto de antes ao fechar);
//  - e roda variações sabotadas das regras (sem @media, janela protegida na lista, id faltando, sem !important, sem a regra do tema
//    Performance Pro, sem o recorte de câmera, bloco fora do lugar...) para provar que o teste pega o erro.
// O resultado visual (toque real no Chrome: fundo parado em todas as janelas, 33 páginas inteiras e 5 janelas intactas nos cinco
// temas, claro e escuro, em 7 tamanhos de tela, paisagem com recorte de câmera, conteúdo longo, comparação do estilo antes e depois)
// foi conferido à parte (equipe/testes/navegador/janelas-pagina).
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-janelas-pagina-1.12.288.cjs');
const GENERATOR_287 = path.join(ROOT, 'tools/gerar-catalogo-pagina-1.12.287.cjs');
// A base original é o 1.12.286, que o Tiago subiu na main com o nome abaixo (commit c3e8d57, SHA-256 abaixo). Se um dia esse
// arquivo for trocado, o teste busca o original no histórico. O 1.12.287 não está na main: é gerado do 1.12.286 pelo gerador do
// 1.12.287 e conferido pelo SHA-256 do arquivo que foi entregue.
const SOURCE_NAME = 'AgendaPersonal-1.12.286-Recados-Modo-Claro-Para-Assinar.agenda.json';
const SOURCE_COMMIT = 'c3e8d570995b0995fcf38ffd3876b06dbfaf9692';
const SOURCE_SHA256 = '7de8a60cdbba5d3f17d3d4072e76bb823017ef7427edf97ff015ab22317621e8';
const PACKAGE_287_SHA256 = '7e22cee005cfdd1a38ee5f4edcd6d604b83418fbbd2c47a2eb59f655c68cb14d';
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
const G287 = require(GENERATOR_287);
const G = require(GENERATOR);
const o286 = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const o = G287.makeUpdate(o286); // o pacote 1.12.287, base deste
const p = G.makeUpdate(o);
const base286Teacher = o286.files['professor.html'], baseTeacher = o.files['professor.html'], page = p.files['professor.html'];
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
const splitTop = text => {
  const parts = []; let depth = 0, from = 0;
  for (let k = 0; k < text.length; k++) {
    if (text[k] === '(' || text[k] === '[') depth++;
    else if (text[k] === ')' || text[k] === ']') depth--;
    else if (text[k] === ',' && depth === 0) { parts.push(text.slice(from, k)); from = k + 1; }
  }
  parts.push(text.slice(from));
  return parts.map(s => s.trim()).filter(Boolean);
};
const compare = (a, b) => { for (let k = 0; k < 3; k++) if (a[k] !== b[k]) return a[k] - b[k]; return 0; };
// especificidade [ids, classes/atributos/pseudoclasses, tipos]; :where() vale zero; :is()/:not()/:has() valem pelo argumento mais específico
function specificity(selector) {
  let s = selector.replace(/"[^"]*"|'[^']*'/g, '""').replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '');
  const n = [0, 0, 0];
  for (;;) {
    const m = /:(is|not|has|matches)\(/.exec(s);
    if (!m) break;
    const open = m.index + m[0].length - 1, end = skipParens(s, open);
    let best = [0, 0, 0];
    for (const part of splitTop(s.slice(open + 1, end - 1))) { const sp = specificity(part); if (compare(sp, best) > 0) best = sp; }
    for (let k = 0; k < 3; k++) n[k] += best[k];
    s = s.slice(0, m.index) + s.slice(end);
  }
  n[0] += (s.match(/#[\w-]+/g) || []).length; s = s.replace(/#[\w-]+/g, '');
  n[1] += (s.match(/\[[^\]]*\]/g) || []).length; s = s.replace(/\[[^\]]*\]/g, '');
  n[1] += (s.match(/\.[\w-]+/g) || []).length; s = s.replace(/\.[\w-]+/g, '');
  n[1] += (s.match(/:(?!:)[\w-]+/g) || []).length; s = s.replace(/::?[\w-]+(\((?:[^()]|\([^()]*\))*\))?/g, '');
  n[2] += (s.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length;
  return n;
}
const styleBlocks = html => [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
const parseAll = html => styleBlocks(html).map(css => parseCss(css)); // (map(parseCss) passaria o índice como nível)

// ---------- a classificação das 38 janelas (cópia independente da do gerador: se uma lista mudar, os dois lugares precisam mudar) ----------
const PAGES = [
  'waitlistEditor', 'colorPanelDialog', 'trainerPhotoCropDialog', 'trainerProfileDialog', 'lessonDialog', 'studentLessonsDialog',
  'studentProfileDialog', 'workoutPdfImportDialog', 'workoutPlanDialog', 'workoutDayEditDialog', 'workoutTechniquesDialog',
  'workoutTechniqueDetailDialog', 'workoutTechniqueEditorDialog', 'workoutExerciseDialog', 'workoutCatalogDialog',
  'workoutAudienceDialog', 'workoutExecutionDialog', 'workoutHistoryDialog', 'workoutFeedbackDialog', 'studentPhotoDialog',
  'studentLocationDialog', 'studentPhoneDialog', 'studentTypeDialog', 'studentDialog', 'rescheduleDialog',
  'workoutBisetPartnerDialog', 'workoutBisetEditorDialog', 'registrationLinkDialog', 'studentAreaDialog',
  'studentAreaConnectionDialog', 'financeReceiptDialog', 'financeReceiptViewDialog', 'studentEvolutionDialog'
];
const KEPT = ['workoutStudentDialog', 'workoutDayDialog', 'workoutRestDialog', 'workoutBisetDialog', 'workoutVideoDialog'];
// Título que cada janela mostra (as de página precisam estar citadas, com este nome, nas notas do aviso).
const TITLES = {
  waitlistEditor: 'Adicionar à lista de espera', colorPanelDialog: 'Painel de cores', trainerPhotoCropDialog: 'Enquadrar foto',
  trainerProfileDialog: 'Perfil do personal', lessonDialog: 'Nova aula', studentLessonsDialog: 'Aulas e horários',
  studentProfileDialog: 'Perfil do aluno', workoutPdfImportDialog: 'Importar aluno por PDF', workoutPlanDialog: 'Nova ficha de treino',
  workoutDayEditDialog: 'Adicionar treino', workoutTechniquesDialog: 'Técnicas', workoutTechniqueDetailDialog: 'Técnica',
  workoutTechniqueEditorDialog: 'Editar técnica', workoutExerciseDialog: 'Adicionar exercício', workoutCatalogDialog: 'Catálogo de exercícios',
  workoutAudienceDialog: 'Visualização do aluno', workoutExecutionDialog: 'Finalizar treino', workoutHistoryDialog: 'Evolução',
  workoutFeedbackDialog: 'Editar observações', studentPhotoDialog: 'Foto do aluno', studentLocationDialog: 'Adicionar local',
  studentPhoneDialog: 'Editar WhatsApp', studentTypeDialog: 'Tipo de aluno', studentDialog: 'Novo aluno', rescheduleDialog: 'Criar reposição',
  workoutBisetPartnerDialog: 'Bi-set · Escolher exercício', workoutBisetEditorDialog: 'Criar bi-set', registrationLinkDialog: 'Cadastro por link',
  studentAreaDialog: 'Área do aluno', studentAreaConnectionDialog: 'Conectar as áreas dos alunos', financeReceiptDialog: 'Conferir comprovante Pix',
  financeReceiptViewDialog: 'Comprovante do pagamento', studentEvolutionDialog: 'Evolução do aluno',
  workoutStudentDialog: 'Ficha de treino', workoutDayDialog: 'Exercícios', workoutRestDialog: 'Intervalo', workoutBisetDialog: 'Execução do bi-set',
  workoutVideoDialog: 'Vídeo do exercício'
};
// Variantes do cartão (.sheet) que as janelas usam.
const SHEET_CLASSES = ['sheet', 'workout-sheet', 'color-panel-sheet', 'receipt-sheet', 'trainer-crop-sheet', 'ap-student-evolution', 'workout-video-sheet'];

// ---------- o que as regras novas devem ser (e nada além disso) ----------
const LIST = ':is(' + PAGES.map(id => '#' + id).join(',') + ')';
const PAGE_OPEN = LIST + '.dialog.open';
const SHEET_SELECTOR = PAGE_OPEN + '>.sheet';
const PRO_SELECTOR = 'html[data-agenda-design=pro-tl] ' + SHEET_SELECTOR;
const TOUCH_MEDIA = '@media(hover:none),(pointer:coarse)';
const PLAN_TOP = {selector: '.dialog,.dialog>.sheet', declarations: [['overscroll-behavior', 'contain']]};
// Dentro do @media de toque, na ordem. Cada regra: seletor e a lista exata de declarações [propriedade, valor].
const PLAN_TOUCH = [
  {selector: 'body.dialog-open', declarations: [['overflow', 'hidden']]},
  {selector: PAGE_OPEN, declarations: [['padding', '0 env(safe-area-inset-right) 0 env(safe-area-inset-left)!important']]},
  {selector: SHEET_SELECTOR, declarations: [
    ['width', '100%!important'], ['max-width', 'none!important'], ['height', '100%!important'], ['max-height', 'none!important'],
    ['border-width', '0!important'], ['border-radius', '0!important'], ['box-shadow', 'none!important'],
    ['padding-top', 'calc(18px + env(safe-area-inset-top))!important'], ['padding-bottom', 'calc(92px + env(safe-area-inset-bottom))!important']]},
  {selector: PRO_SELECTOR, declarations: [['padding-bottom', 'calc(22px + env(safe-area-inset-bottom))!important']]}
];
const STYLE_ID = 'dialog-scroll-lock-pages';
const PREVIOUS_STYLE_ID = 'dialog-scroll-lock-catalog-page';
const ANCHOR = '<style id="previous-page-navigation">';
// Famílias de propriedades (um atalho e suas partes disputam o mesmo valor).
const SIDES = ['top', 'right', 'bottom', 'left'];
const FAMILY = {
  padding: ['padding', 'padding-block', 'padding-inline', ...SIDES.map(s => 'padding-' + s), 'padding-block-start', 'padding-block-end', 'padding-inline-start', 'padding-inline-end'],
  'padding-top': ['padding', 'padding-top', 'padding-block', 'padding-block-start'],
  'padding-bottom': ['padding', 'padding-bottom', 'padding-block', 'padding-block-end'],
  width: ['width', 'inline-size'],
  'max-width': ['max-width', 'max-inline-size'],
  height: ['height', 'block-size'],
  'max-height': ['max-height', 'max-block-size'],
  'border-width': ['border', 'border-width', 'border-block-width', 'border-inline-width', 'border-block', 'border-inline', ...SIDES.map(s => 'border-' + s), ...SIDES.map(s => 'border-' + s + '-width')],
  'border-radius': ['border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-start-start-radius', 'border-start-end-radius', 'border-end-start-radius', 'border-end-end-radius'],
  'box-shadow': ['box-shadow']
};
const subjectOf = selector => selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '').replace(/\((?:[^()]|\([^()]*\))*\)/g, '()').trim();
const lastCompound = selector => { const m = /([^\s>+~]+)$/.exec(subjectOf(selector)); return m ? m[1] : ''; };
const isSheetSubject = c => SHEET_CLASSES.some(k => new RegExp('\\.' + k + '(?![\\w-])').test(c));
const isDialogSubject = c => !isSheetSubject(c) && (/\.dialog(?![\w-])/.test(c) || PAGES.some(id => c.includes('#' + id)));
const idsOf = selector => selector.match(/#[\w-]+/g) || [];
const normalize = text => text.replace(/\s+/g, ' ').replace(/\s*([>,])\s*/g, '$1');
// Lê o bloco novo direto da página e devolve a lista de problemas (vazia = tudo certo).
function auditCss(html) {
  const problems = [];
  const found = [...html.matchAll(new RegExp('<style id="' + STYLE_ID + '">([\\s\\S]*?)</style>', 'g'))];
  if (found.length !== 1) { problems.push('esperava 1 bloco <style id="' + STYLE_ID + '"> e achei ' + found.length); return problems; }
  if (!html.includes(found[0][0] + ANCHOR)) problems.push('o bloco novo precisa vir logo antes de ' + ANCHOR);
  if (count(html, ANCHOR) !== 1) problems.push('a âncora ' + ANCHOR + ' deveria existir uma vez');
  if (html.includes('<style id="' + PREVIOUS_STYLE_ID + '">')) problems.push('o bloco do 1.12.287 deveria ter sido trocado, e ainda está na página');
  const css = found[0][1];
  if (/touch-action/i.test(css)) problems.push('touch-action não pode ser usado (no WebKit o none do pai trava a rolagem dos filhos)');
  const tops = parseCss(css);
  if (tops.length !== 2) { problems.push('esperava 2 regras no nível principal (a contenção e o @media de toque) e achei ' + tops.length); return problems; }
  const mine = [];
  const check = (rule, plan, label) => {
    if (normalize(rule.prelude) !== plan.selector) problems.push(label + ': seletor ' + rule.prelude.slice(0, 120) + ' (esperado ' + plan.selector.slice(0, 120) + ')');
    const decls = declarations(rule.body).map(d => [d.prop, d.value.replace(/\s+/g, ' ').replace(/\s*!important$/, '!important')]);
    if (JSON.stringify(decls) !== JSON.stringify(plan.declarations)) problems.push(label + ' (' + plan.selector.slice(0, 60) + '…): declarações ' + JSON.stringify(decls));
    mine.push({rule, plan, selector: plan.selector});
  };
  if (tops[0].at) problems.push('a contenção de rolagem não pode estar dentro de @media/@supports'); else check(tops[0], PLAN_TOP, 'regra 1');
  const media = tops[1];
  if (!media.at || media.prelude.replace(/\s+/g, '') !== TOUCH_MEDIA) { problems.push('esperava ' + TOUCH_MEDIA + ' e achei ' + media.prelude); return problems; }
  if (media.children.length !== PLAN_TOUCH.length) { problems.push('esperava ' + PLAN_TOUCH.length + ' regras dentro do @media e achei ' + media.children.length); return problems; }
  media.children.forEach((rule, k) => {
    if (rule.at) problems.push('regra ' + (k + 2) + ': não pode ter @media aninhado'); else check(rule, PLAN_TOUCH[k], 'regra ' + (k + 2));
  });
  if (problems.length) return problems;
  // escopo: os ids são exatamente os das 33 janelas de página (nunca uma das 5 mantidas), só abertas
  for (const m of mine) {
    const ids = idsOf(m.selector);
    if (ids.length) {
      const names = ids.map(id => id.slice(1));
      const missing = PAGES.filter(id => !names.includes(id)), extra = names.filter(id => !PAGES.includes(id));
      if (missing.length || extra.length) problems.push('janelas na lista de ' + m.selector.slice(0, 40) + '…: faltam [' + missing + '] sobram [' + extra + ']');
      if (names.some(id => KEPT.includes(id))) problems.push('uma janela que deve ficar como estava entrou na regra');
      if (!/\.dialog\.open/.test(m.selector)) problems.push('a regra de página precisa valer só com a janela aberta (.dialog.open): ' + m.selector.slice(0, 60));
    } else if (m.plan.declarations.some(([prop]) => /^(border|padding|width|max-width|height|max-height|box-shadow)/.test(prop))) problems.push('regra de aparência sem os ids das janelas: ' + m.selector);
  }
  // vencem as regras que já existiam: para cada declaração nova, nenhuma regra existente que atinja o mesmo elemento e mexa na
  // mesma propriedade pode ganhar (importante vence normal; mesma importância: maior especificidade; empate: a mais tardia, e o
  // bloco novo vem antes das folhas dos temas, então empate conta como derrota).
  const mineSet = new Set(mine.map(m => m.rule));
  const others = parseAll(html.replace(found[0][0], '')).flatMap(flatten).filter(r => !mineSet.has(r));
  for (const m of mine.filter(x => idsOf(x.selector).length)) {
    const mineSpec = specificity(m.selector);
    const isSheetRule = />\.sheet$/.test(m.selector);
    for (const [prop, rawValue] of m.plan.declarations) {
      const family = FAMILY[prop] || [prop];
      const important = /!important$/.test(rawValue);
      for (const other of others) {
        for (const selector of other.prelude.split(',').map(s => s.trim())) {
          const compound = lastCompound(selector);
          if (/::/.test(compound) || !(isSheetRule ? isSheetSubject(compound) : isDialogSubject(compound))) continue;
          const ids = idsOf(selector);
          if (ids.some(id => !PAGES.includes(id.slice(1)))) continue; // é de outra janela (ou de outro elemento da página)
          for (const d of declarations(other.body)) {
            if (!family.includes(d.prop)) continue;
            if (d.important && !important) problems.push('regra existente !important vence ' + prop + ': ' + selector);
            else if (d.important === important && compare(specificity(selector), mineSpec) >= 0) problems.push('regra existente com especificidade igual ou maior para ' + prop + ': ' + selector);
          }
        }
      }
    }
  }
  // a regra do tema Performance Pro vence a geral (mesma propriedade, mais especificidade)
  if (compare(specificity(PRO_SELECTOR), specificity(SHEET_SELECTOR)) <= 0) problems.push('a regra do Performance Pro precisa ter mais especificidade que a regra geral');
  return problems;
}
// Tudo que não é o bloco novo precisa ser idêntico ao 1.12.287 (nenhum script, nenhum outro estilo).
function auditAgainstBase(html) {
  const problems = [];
  if (html.replace(G.STYLE_BLOCK, G.PREVIOUS_STYLE_BLOCK) !== baseTeacher) problems.push('professor.html tem diferenças além da troca do bloco de estilo');
  if (html.length - baseTeacher.length !== G.STYLE_BLOCK.length - G.PREVIOUS_STYLE_BLOCK.length) problems.push('o tamanho acrescentado não é o da troca');
  return problems;
}

// ---------- 1) pacote ----------
function auditPackage(pkg) {
  const problems = [];
  const want = (cond, message) => { if (!cond) problems.push(message); };
  want(pkg.version === '1.12.288', 'versão ' + pkg.version);
  want(pkg.sequence === 394, 'sequência ' + pkg.sequence);
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
t('O 1.12.287 gerado do 1.12.286 é byte a byte o arquivo que foi entregue (SHA-256), então este pacote parte do arquivo certo', () => {
  assert.equal(o286.version, '1.12.286');
  assert.equal(o286.sequence, 392);
  assert.equal(o.version, '1.12.287');
  assert.equal(o.sequence, 393);
  assert.equal(sha(JSON.stringify(o, null, 2) + '\n'), PACKAGE_287_SHA256);
});
t('Versão 1.12.288 / seq 394 / sem assinatura, com o mesmo aplicativo e formato do 1.12.287', () => {
  assert(p.sequence > o.sequence);
  assert.deepEqual(auditPackage(p), []);
});
t('Aviso: título, resumo e notas coerentes com o que o pacote faz, sem prometer o que não muda', () => {
  assert.equal(p.update.title, 'Janelas como página');
  assert(/janelas/i.test(p.update.summary) && /página inteira/.test(p.update.summary) && /página de trás não se mexe mais/.test(p.update.summary));
  for (const frase of [/Agora 33 janelas abrem como uma página inteira/, /A barra Voltar e Painel continua embaixo/, /a página de trás fica parada/, /a janela continua rolando normalmente por dentro/,
    /Ao fechar, a página de trás está onde estava/, /Ficam como estavam, de propósito: a Ficha de treino \(que já era uma página\), o treino em andamento \(Exercícios\), o Intervalo, a Execução do bi-set e o Vídeo do exercício/,
    /cronômetro, descanso, despertador ou um tamanho que o próprio aplicativo calcula/, /no computador com mouse as janelas continuam como cartão/, /Os cinco temas .* mantêm as cores de sempre/,
    /Só o arquivo professor\.html muda, e só o estilo visual/, /Nenhum dado, tela, regra, botão ou texto foi alterado/, /1\.12\.287/, /1\.12\.286/,
    /Descanso, cronômetros, alarmes e notificações não foram alterados/]) assert(frase.test(p.notes), 'as notas deveriam dizer: ' + frase);
  for (const id of PAGES) assert(p.notes.includes(TITLES[id]), 'as notas deveriam citar a janela "' + TITLES[id] + '" (' + id + ')');
  // as 5 mantidas não aparecem na lista das que viraram página (aparecem só no parágrafo das que ficam como estavam)
  const lista = p.notes.slice(p.notes.indexOf('Janelas que viraram página'), p.notes.indexOf('Com qualquer janela aberta'));
  for (const id of KEPT) assert(!lista.includes(TITLES[id] + ',') && !lista.includes(TITLES[id] + '.') && !lista.includes(TITLES[id] + ' e '), 'a lista das páginas não deveria incluir "' + TITLES[id] + '"');
});
t('Só professor.html mudou e a única edição é a troca do bloco de estilo do 1.12.287 pelo novo', () => {
  assert.deepEqual(Object.keys(G.edits), ['professor.html']);
  assert.equal(G.TEACHER_EDITS.length, 1);
  assert.equal(G.STYLE_EDITS.length, 1);
  assert.equal(G.TEACHER_EDITS[0].previous, G.PREVIOUS_STYLE_BLOCK);
  assert.equal(G.TEACHER_EDITS[0].next, G.STYLE_BLOCK);
  assert.equal(G.PREVIOUS_STYLE_BLOCK, G287.STYLE_BLOCK, 'o bloco que este pacote substitui é exatamente o que o gerador do 1.12.287 coloca');
});
t('Prova de reversão: desfeita a edição, professor.html volta byte a byte ao do 1.12.287', () => {
  let undone = page;
  for (const edit of G.TEACHER_EDITS.slice().reverse()) undone = G.undoEdit(undone, edit);
  assert.equal(undone, baseTeacher);
  assert.equal(sha(undone), sha(baseTeacher));
});
t('O pacote inclui tudo do 1.12.287 e do 1.12.286: em relação ao 1.12.286 a única diferença é o bloco de estilo, que o 1.12.287 também acrescentava', () => {
  assert.equal(page, base286Teacher.replace(ANCHOR, G.STYLE_BLOCK + ANCHOR));
  assert.equal(page.length - base286Teacher.length, G.STYLE_BLOCK.length);
  for (const k of ['index.html', 'avaliacoes.html', 'cadastro.html']) assert.equal(p.files[k], o286.files[k], k + ' diferente do 1.12.286');
});
t('A âncora existe uma vez; o bloco do 1.12.287 existe uma vez no 1.12.287 e não existe mais no 1.12.288, e o novo existe uma vez', () => {
  assert.equal(count(baseTeacher, ANCHOR), 1);
  assert.equal(count(baseTeacher, G.PREVIOUS_STYLE_BLOCK), 1);
  assert.equal(count(baseTeacher, G.STYLE_OPEN), 0, 'o 1.12.287 não tinha o bloco novo');
  assert.equal(count(page, G.PREVIOUS_STYLE_BLOCK), 0);
  assert.equal(count(page, '<style id="' + PREVIOUS_STYLE_ID + '">'), 0);
  assert.equal(count(page, G.STYLE_BLOCK), 1);
  assert.equal(count(page, G.STYLE_OPEN), 1);
  assert.equal(count(page, ANCHOR), 1);
  assert.equal(page.length - baseTeacher.length, G.STYLE_BLOCK.length - G.PREVIOUS_STYLE_BLOCK.length);
  assert.equal(count(page, '<style') - count(baseTeacher, '<style'), 0);
});
t('O gerador recusa aplicar duas vezes, recusa outra base e é determinístico', () => {
  assert.throws(() => G.makeUpdate(p));
  assert.throws(() => G.makeUpdate(o286), /1\.12\.287|esperad|Expected|deepEqual|equal/i, 'o 1.12.286 não é base deste pacote (o 1.12.287 precisa vir antes)');
  assert.throws(() => G.makeUpdate({...o, version: '1.12.285'}));
  assert.throws(() => G.makeUpdate({...o, sequence: 392}));
  assert.throws(() => G.applyAll(page, G.TEACHER_EDITS), /já foi aplicada/);
  assert.equal(JSON.stringify(G.makeUpdate(o)), JSON.stringify(p));
  assert.equal(JSON.stringify(G.makeUpdate({...o, agendaSignature: 'assinatura-qualquer'})), JSON.stringify(p), 'uma assinatura na base não passa para o pacote novo');
});
t('A linha de comando grava exatamente o JSON do pacote e não sobrescreve arquivo existente; tamanho abaixo de 24 MiB', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-janelas-pagina-'));
  try {
    const base = path.join(dir, 'base-287.agenda.json');
    fs.writeFileSync(base, JSON.stringify(o, null, 2) + '\n');
    const out = path.join(dir, 'saida.agenda.json');
    execFileSync(process.execPath, [GENERATOR, base, out], {stdio: 'pipe'});
    const written = fs.readFileSync(out, 'utf8');
    assert.equal(written, JSON.stringify(p, null, 2) + '\n');
    assert(Buffer.byteLength(written, 'utf8') < 24 * 1024 ** 2);
    assert.throws(() => execFileSync(process.execPath, [GENERATOR, base, out], {stdio: 'pipe'}));
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

// ---------- 2) nenhum código mudou ----------
t('Os scripts são exatamente os mesmos do 1.12.287 (e do 1.12.286) e todos compilam', () => {
  const before = classicScripts(baseTeacher), after = classicScripts(page), original = classicScripts(base286Teacher);
  assert(before.length > 50, 'poucos scripts: ' + before.length);
  assert.equal(after.length, before.length);
  assert.equal(original.length, before.length);
  after.forEach((m, k) => { assert.equal(m[0], before[k][0], 'o script ' + k + ' mudou'); assert.equal(m[0], original[k][0]); new vm.Script(m[2]); });
});
t('A única diferença para o 1.12.287 é a troca do bloco de estilo (nenhum outro estilo, tag ou atributo mudou)', () => {
  assert.deepEqual(auditAgainstBase(page), []);
  assert(!/[<>]|url\(|@import|expression|javascript:|\bscript\b|=>|function|\bon[a-z]+=/i.test(G.CSS_RULES.replace(/>\.sheet/g, '').replace(/\.dialog>/g, '')), 'o texto novo é só CSS');
  assert.equal(count(page, '</style>'), count(baseTeacher, '</style>'));
});
t('Os arquivos index.html, avaliacoes.html e cadastro.html seguem byte a byte iguais', () => {
  for (const k of ['index.html', 'avaliacoes.html', 'cadastro.html']) assert.equal(sha(p.files[k]), sha(o.files[k]), k);
});
t('Nenhum link de convite do grupo no pacote', () => {
  assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(JSON.stringify(p.files)));
});

// ---------- 3) a classificação das 38 janelas ----------
const dialogTags = html => [...html.matchAll(/<div\b[^>]*\bclass="dialog"[^>]*>/g)].map(m => ({tag: m[0], index: m.index, id: (/\bid="([^"]+)"/.exec(m[0]) || [])[1]}));
t('As listas do gerador são as mesmas deste teste: 33 janelas viram página, 5 ficam como estavam, nenhuma em duas listas', () => {
  assert.deepEqual(G.PAGE_WINDOWS, PAGES);
  assert.deepEqual(Object.keys(G.KEPT_WINDOWS), KEPT);
  assert.equal(PAGES.length, 33);
  assert.equal(KEPT.length, 5);
  assert.equal(new Set([...PAGES, ...KEPT]).size, 38);
  for (const id of Object.keys(G.KEPT_WINDOWS)) assert.equal(PAGES.includes(id), false, id + ' está nas duas listas');
});
t('Toda janela do aplicativo está classificada: as 37 do HTML mais a da evolução do aluno (criada pelo script) são exatamente as 38 das duas listas', () => {
  const ids = dialogTags(page).map(d => d.id);
  assert.equal(ids.length, 37);
  assert.equal(new Set(ids).size, 37);
  assert.equal(count(page, 'n.id="studentEvolutionDialog",n.className="dialog"'), 1);
  const all = [...ids, 'studentEvolutionDialog'].sort();
  assert.deepEqual(all, [...PAGES, ...KEPT].sort());
  // e o HTML do 1.12.286 tinha as mesmas 37 (nenhuma janela nova nesta versão)
  assert.deepEqual(dialogTags(base286Teacher).map(d => d.id), ids);
});
t('Cada janela de página é uma .dialog com o cartão .sheet como primeiro filho (e o da evolução do aluno, criado pelo script, também), com o título combinado', () => {
  for (const id of PAGES.filter(id => id !== 'studentEvolutionDialog')) {
    const tags = dialogTags(page).filter(d => d.id === id);
    assert.equal(tags.length, 1, id);
    const after = page.slice(tags[0].index + tags[0].tag.length, tags[0].index + tags[0].tag.length + 4000);
    const sheet = /^\s*<div class="([^"]+)"/.exec(after);
    assert(sheet, id + ': o primeiro filho não é um <div class>');
    const classes = sheet[1].split(/\s+/);
    assert(classes[0] === 'sheet' && classes.every(c => SHEET_CLASSES.includes(c)), id + ': cartão com classes ' + sheet[1]);
    assert(!classes.includes('workout-video-sheet'), id + ' tem o cartão do vídeo');
    assert(after.includes('>' + TITLES[id] + '<'), id + ': não mostra o título "' + TITLES[id] + '"');
  }
  assert.equal(count(page, '<div class="sheet ap-student-evolution"><div class="sheet-head"><h3 id="studentEvolutionTitle">Evolução do aluno</h3>'), 1);
  // o Cadastro por link é a mesma janela para Alunos para aprovar e Lista de alunos (muda só o título)
  assert.equal(count(page, 'c("registrationLinkTitle").textContent = roster ? "Lista de alunos" : listing ? "Alunos para aprovar" : "Cadastro por link"'), 1);
});
t('As 5 janelas mantidas têm mesmo o recurso que justifica mantê-las (cronômetro, descanso, despertador, tamanho calculado, ou já é uma página)', () => {
  // Ficha de treino: já é uma página, abaixo da barra do topo, com fundo próprio
  assert.equal(count(page, '#workoutStudentDialog{top:var(--workout-sheet-top,80px);background:#0c090f}'), 1);
  assert.equal(count(page, 'body:has(#workoutStudentDialog.open) .topbar{position:fixed;inset:0 0 auto;z-index:75;background:#0c090f}'), 1);
  // Exercícios (treino em andamento): a sessão com cronômetro e despertador de fim do treino
  assert.equal(count(page, 'function workoutSessionHtml(plan,day,running){'), 1);
  assert(count(page, 'state.lessonTimers[key]') >= 1);
  assert(/<h3 id="workoutDayTitle">Exercícios<\/h3>/.test(page));
  // Intervalo: o contador do descanso
  assert.equal(count(page, '<div id="workoutRestCounter" class="workout-rest-counter" role="timer">00:00</div>'), 1);
  // Execução do bi-set: o descanso do bi-set, contando ao vivo
  assert.equal(count(page, 'id="workoutBisetRestTime" class="biset-clock" role="timer"'), 1);
  // Vídeo: o aplicativo calcula o tamanho da janela
  assert.equal(count(page, 'function fitWorkoutVideoWindow(){'), 1);
  assert(/<h3 id="workoutVideoTitle">Vídeo do exercício<\/h3>/.test(page));
  // (e as cinco continuam fora das regras novas: ver a auditoria das regras)
});
t('"Finalizar treino" (página) mostra o tempo realizado só uma vez, ao abrir: não é um contador ao vivo', () => {
  assert.equal(count(page, "document.getElementById('workoutExecutionDuration').textContent=duration===null?'Tempo não registrado':workoutDurationText(duration);"), 1);
  assert.equal(count(page, "getElementById('workoutExecutionDuration')"), 1, 'nada mais mexe nesse texto (sem setInterval)');
});

// ---------- 4) as regras novas, lidas da folha de estilo ----------
t('Regras novas: exatamente as combinadas (a contenção e 4 regras de toque), com as propriedades combinadas e nada além; bloco logo antes da âncora', () => {
  assert.deepEqual(auditCss(page), []);
  assert.equal(G.CSS_CONTAIN, PLAN_TOP.selector + '{overscroll-behavior:contain}');
  assert.equal(G.CSS_LOCK_BODY, 'body.dialog-open{overflow:hidden}');
  assert.equal(G.TOUCH_MEDIA, TOUCH_MEDIA);
  assert.equal(G.PAGE_LIST, LIST);
  assert.equal(G.PAGE_OPEN, PAGE_OPEN);
  assert.equal(G.PAGE_SHEET, SHEET_SELECTOR);
  assert.equal(G.PRO_SELECTOR, PRO_SELECTOR);
  assert.equal(G.STYLE_ID, STYLE_ID);
  assert.equal(G.PREVIOUS_STYLE_ID, PREVIOUS_STYLE_ID);
});
t('O 1.12.287 e o 1.12.286 não passam nesta auditoria (não tinham o bloco): o teste enxerga a falta', () => {
  assert.notDeepEqual(auditCss(baseTeacher), []);
  assert.notDeepEqual(auditCss(base286Teacher), []);
});
t('Tudo o que o 1.12.287 fazia continua valendo: a trava e a contenção, e o Catálogo com as mesmas propriedades de antes na janela e no cartão', () => {
  const previousTops = parseCss(G.PREVIOUS_STYLE_BLOCK.replace(/^<style[^>]*>/, '').replace(/<\/style>$/, ''));
  const old = {};
  for (const r of flatten(previousTops)) for (const d of declarations(r.body)) old[normalize(r.prelude) + ' | ' + d.prop] = d.value.replace(/\s*!important$/, '');
  assert.equal(Object.keys(old).length, 12, 'o bloco do 1.12.287 tinha 12 declarações: ' + Object.keys(old).join(' ; '));
  const novo = {};
  for (const r of flatten(parseCss(G.STYLE_BLOCK.replace(/^<style[^>]*>/, '').replace(/<\/style>$/, '')))) for (const d of declarations(r.body)) novo[normalize(r.prelude) + ' | ' + d.prop] = d.value.replace(/\s*!important$/, '');
  const catalog = {
    'body.dialog-open | overflow': 'hidden', '.dialog,.dialog>.sheet | overscroll-behavior': 'contain'
  };
  for (const [k, v] of Object.entries(catalog)) { assert.equal(old[k], v); assert.equal(novo[k], v); }
  // as demais declarações do 1.12.287 eram do Catálogo (padding da janela, cartão e Performance Pro); aqui valem com o mesmo valor, para as 33 janelas
  const pairs = [['padding', 'padding'], ['width', 'width'], ['height', 'height'], ['max-height', 'max-height'], ['border-width', 'border-width'], ['border-radius', 'border-radius'], ['box-shadow', 'box-shadow'], ['padding-top', 'padding-top'], ['padding-bottom', 'padding-bottom']];
  const catalogDialog = '#workoutCatalogDialog.dialog.open | padding', catalogSheet = '#workoutCatalogDialog.dialog.open>.sheet | ', catalogPro = 'html[data-agenda-design=pro-tl] #workoutCatalogDialog.dialog.open>.sheet | padding-bottom';
  assert.equal(old[catalogDialog], '0');
  for (const [prop] of pairs.slice(1)) assert(old[catalogSheet + prop] !== undefined, 'o 1.12.287 tinha ' + prop + ' no cartão do Catálogo');
  assert.equal(novo[PAGE_OPEN + ' | padding'], '0 env(safe-area-inset-right) 0 env(safe-area-inset-left)', 'janela sem padding (só o recorte da câmera, que em retrato vale 0)');
  for (const [prop] of pairs.slice(1)) assert.equal(novo[SHEET_SELECTOR + ' | ' + prop], old[catalogSheet + prop], prop + ' do cartão mudou em relação ao Catálogo do 1.12.287');
  assert.equal(novo[PRO_SELECTOR + ' | padding-bottom'], old[catalogPro]);
  assert(PAGES.includes('workoutCatalogDialog'));
});
t('A trava do corpo só vale em aparelho de toque (@media hover:none ou pointer:coarse) e só com janela aberta (body.dialog-open); a apresentação como página também só no toque', () => {
  const tops = parseCss(styleBlocks(page).find(css => css.startsWith(G.CSS_CONTAIN)));
  assert.equal(tops.length, 2);
  assert.equal(tops[1].prelude.replace(/\s+/g, ''), TOUCH_MEDIA);
  assert.equal(tops[1].children[0].prelude, 'body.dialog-open');
  assert.deepEqual(declarations(tops[1].children[0].body).map(d => [d.prop, d.value]), [['overflow', 'hidden']]);
  // fora do @media só fica a contenção (nada que mude o computador com mouse: nenhum overflow, nenhum padding, nenhum tamanho)
  const outside = tops.filter(r => !r.at).flatMap(r => declarations(r.body)).map(d => d.prop);
  assert.deepEqual(outside, ['overscroll-behavior']);
});
t('Especificidade: as regras novas vencem as do tema Performance Pro, do painel de cores, do enquadramento de foto e as gerais das janelas, sem depender da ordem', () => {
  assert.deepEqual(specificity(PAGE_OPEN), [1, 2, 0]);
  assert.deepEqual(specificity(SHEET_SELECTOR), [1, 3, 0]);
  assert.deepEqual(specificity(PRO_SELECTOR), [1, 4, 1]);
  const existing = [
    ['html[data-agenda-design=pro-tl] .dialog.open', PAGE_OPEN],
    ['html[data-agenda-design=pro-tl] .dialog.open .sheet', SHEET_SELECTOR],
    ['.dialog-open .dialog>.sheet', SHEET_SELECTOR],
    ['.function-view .dialog>.sheet', SHEET_SELECTOR],
    ['.dialog-open .dialog', PAGE_OPEN],
    ['#colorPanelDialog>.color-panel-sheet', SHEET_SELECTOR],
    ['.color-panel-sheet', SHEET_SELECTOR],
    ['.trainer-crop-sheet', SHEET_SELECTOR],
    ['html #workoutAudienceDialog>.sheet', SHEET_SELECTOR]
  ];
  for (const [other, mine] of existing) assert(compare(specificity(mine), specificity(other)) > 0, mine.slice(0, 50) + ' deveria vencer ' + other);
  // e essas regras existentes estão mesmo no professor.html (a conta acima é sobre regras reais)
  for (const trecho of ['html[data-agenda-design=pro-tl] .dialog.open{padding:12px!important;align-items:center!important}',
    'html[data-agenda-design=pro-tl] .dialog.open .sheet{margin:0 auto!important;max-height:calc(100dvh - 24px)!important;height:auto!important;border-radius:14px}',
    '.dialog-open .dialog>.sheet{max-height:calc(100dvh - 86px - env(safe-area-inset-bottom))!important}',
    '.dialog-open .dialog{padding-bottom:calc(70px + env(safe-area-inset-bottom))}',
    '#colorPanelDialog>.color-panel-sheet{display:flex;flex-direction:column;gap:0;width:min(620px,100%);max-height:calc(100dvh - 86px - env(safe-area-inset-bottom))!important;',
    '.trainer-crop-sheet{max-width:480px!important}']) assert.equal(count(page, trecho), 1, trecho);
  // por que cada declaração nova é !important: a partir de 600px o painel de cores tem border-radius:22px!important, e o enquadramento de foto, max-width:480px!important
  assert.equal(count(page, '@media(min-width:600px){#colorPanelDialog{align-items:center}.color-panel-sheet{border-radius:22px!important}'), 1);
});
t('O Performance Pro esconde a barra Voltar/Painel com janela aberta; por isso só ele volta ao padding-bottom padrão', () => {
  assert.equal(count(page, 'html[data-agenda-design=pro-tl] body:has(.dialog.open) :is(.panel-return-bar,.topbar){display:none}'), 1);
  assert.equal(count(page, '.dialog-open .panel-return-bar{position:fixed;inset:auto 0 0;z-index:300;'), 1, 'nos outros temas a barra fica fixa por cima, e o cartão reserva espaço para ela');
});
t('A Visualização do aluno já tratava o recorte de câmera dentro do cartão só até 620px (regra existente, que continua como está); de 621px para cima (paisagem) o recorte vem do padding da janela', () => {
  const m = /@media\(max-width:620px\)\{html #workoutAudienceDialog>\.sheet,html #workoutBisetDialog>\.sheet,html #workoutDayDialog>\.sheet\{[^}]*\}/.exec(page);
  assert(m, 'a regra de até 620px da Visualização do aluno mudou');
  assert(m[0].includes('padding-left:max(8px,env(safe-area-inset-left))'));
  assert.equal(count(baseTeacher, m[0]), 1, 'a regra é a mesma do 1.12.287');
});

// ---------- 5) o que o CSS espera do aplicativo ----------
t('O aplicativo põe dialog-open no <body>, abre a janela com a classe open e devolve a página ao ponto de antes ao fechar', () => {
  assert.equal(count(page, "document.body.classList.toggle('dialog-open',dialogStack.length>0)"), 1);
  assert.equal(count(page, "dialog.classList.add('open');updateDialogLayers();"), 1);
  assert.equal(count(page, 'returnScrollTop:window.scrollY||0'), 1, 'guarda onde a página estava ao abrir');
  assert.equal(count(page, "window.scrollTo({top:entry.returnScrollTop||0,behavior:'instant'})"), 1, 'devolve a página ao ponto de antes ao fechar');
});
t('O que o aplicativo já fazia continua: html/body sem puxar para atualizar, e a contenção já usada no cartão da importação de PDF e no painel de cores', () => {
  assert.equal(count(page, 'body,html{overscroll-behavior-y:none!important}'), 1);
  assert.equal(count(page, '#workoutPdfImportDialog>.sheet{display:block;max-height:92vh;max-height:92dvh;overflow:auto;overscroll-behavior:contain;'), 1);
  assert.equal(count(page, '.color-panel-scroll{overflow:auto;overscroll-behavior:contain;'), 1);
});
t('Nenhum script do aplicativo mexe em tamanho/posição do cartão das janelas de página (só o do Vídeo, que fica como estava): sem estilo em linha que brigue com as regras', () => {
  const code = classicScripts(page).map(m => m[2]).join('\n');
  assert.equal(count(code, 'sheet.style'), 0);
  assert.equal(count(code, 'sh.style'), 0);
    // a única janela que o script dimensiona é a do Vídeo (--workout-video-height)
  assert.equal(count(code, "dialog.style.setProperty('--workout-video-height'"), 1);
});

// ---------- 6) variações sabotadas: o teste precisa pegar cada uma ----------
const withRules = rules => page.replace(G.STYLE_BLOCK, G.STYLE_OPEN + rules + '</style>');
const rulesWithout = (css, target) => css.replace(target, '');
const mutants = [
  ['trava do corpo fora do @media (mudaria o computador com mouse)', css => css.replace(G.CSS_TOUCH, G.CSS_LOCK_BODY + G.TOUCH_MEDIA + '{' + G.CSS_TOUCH.slice(G.TOUCH_MEDIA.length + 1 + G.CSS_LOCK_BODY.length))],
  ['@media errado (por largura em vez de toque)', css => css.replace('(hover:none),(pointer:coarse)', '(max-width:700px)')],
  ['as regras de página fora do @media (o computador com mouse também viraria página)', css => css.replace(G.CSS_TOUCH, '@media(hover:none),(pointer:coarse){' + G.CSS_LOCK_BODY + '}' + G.CSS_PAGE_DIALOG + G.CSS_PAGE_SHEET + G.CSS_PAGE_PRO)],
  ['trava em html em vez de body', css => css.replace('{body.dialog-open{overflow:hidden}', '{html{overflow:hidden}')],
  ['trava sem a janela aberta (body em vez de body.dialog-open)', css => css.replace('{body.dialog-open{overflow:hidden}', '{body{overflow:hidden}')],
  ['touch-action na janela', css => css.replace(G.CSS_CONTAIN, '.dialog,.dialog>.sheet{overscroll-behavior:contain;touch-action:none}')],
  ['contenção só no cartão (sem a janela, que rola sozinha no vídeo)', css => css.replace(G.CSS_CONTAIN, '.dialog>.sheet{overscroll-behavior:contain}')],
  ['overscroll-behavior:none no lugar de contain', css => css.replace(G.CSS_CONTAIN, '.dialog,.dialog>.sheet{overscroll-behavior:none}')],
  ['regra do cartão virou genérica (toda janela viraria página)', css => css.replace(G.CSS_PAGE_SHEET, G.CSS_PAGE_SHEET.replace(G.PAGE_OPEN, '.dialog.open'))],
  ['regra da janela virou genérica', css => css.replace(G.CSS_PAGE_DIALOG, G.CSS_PAGE_DIALOG.replace(G.PAGE_OPEN, '.dialog.open'))],
  ['regra do cartão sem lista de ids (:is vazio no lugar)', css => css.replace(G.CSS_PAGE_SHEET, G.CSS_PAGE_SHEET.replace(G.PAGE_LIST, ':is(#studentDialog)'))],
  ['faltou uma janela na lista do cartão (o Painel de cores ficaria como cartão)', css => css.replace(G.CSS_PAGE_SHEET, G.CSS_PAGE_SHEET.replace('#colorPanelDialog,', ''))],
  ['faltou uma janela na lista da janela (padding)', css => css.replace(G.CSS_PAGE_DIALOG, G.CSS_PAGE_DIALOG.replace('#studentDialog,', ''))],
  ['a janela do Intervalo entrou na lista do cartão (mexeria no descanso)', css => css.replace(G.CSS_PAGE_SHEET, G.CSS_PAGE_SHEET.replace('#studentDialog,', '#studentDialog,#workoutRestDialog,'))],
  ['a janela do treino em andamento entrou na lista da janela', css => css.replace(G.CSS_PAGE_DIALOG, G.CSS_PAGE_DIALOG.replace('#studentDialog,', '#studentDialog,#workoutDayDialog,'))],
  ['a Execução do bi-set entrou na lista do Performance Pro', css => css.replace(G.CSS_PAGE_PRO, G.CSS_PAGE_PRO.replace('#studentDialog,', '#studentDialog,#workoutBisetDialog,'))],
  ['a janela do Vídeo entrou na lista do cartão', css => css.replace(G.CSS_PAGE_SHEET, G.CSS_PAGE_SHEET.replace('#studentDialog,', '#studentDialog,#workoutVideoDialog,'))],
  ['a Ficha de treino entrou na lista do cartão', css => css.replace(G.CSS_PAGE_SHEET, G.CSS_PAGE_SHEET.replace('#studentDialog,', '#studentDialog,#workoutStudentDialog,'))],
  ['id trocado (outra janela virou página)', css => css.replace(G.CSS_PAGE_SHEET, G.CSS_PAGE_SHEET.replace('#studentDialog,', '#studentDialogo,'))],
  ['regra do cartão sem .open (valeria com a janela fechada)', css => css.replace(G.CSS_PAGE_SHEET, G.CSS_PAGE_SHEET.replace('.dialog.open>.sheet', '.dialog>.sheet'))],
  ['regra da janela sem .open', css => css.replace(G.CSS_PAGE_DIALOG, G.CSS_PAGE_DIALOG.replace('.dialog.open', '.dialog'))],
  ...G.SHEET_DECLARATIONS.map(([prop]) => ['declaração do cartão sem !important: ' + prop + ' (uma regra existente com !important ganharia)', css => css.replace(G.CSS_PAGE_SHEET, G.CSS_PAGE_SHEET.replace(new RegExp('(' + prop + ':[^;}]*)!important'), '$1'))]),
  ['padding da janela sem !important (o Performance Pro, com padding:12px!important, ganharia)', css => css.replace('env(safe-area-inset-left)!important', 'env(safe-area-inset-left)')],
  ['padding da janela sem o recorte da câmera (padding:0)', css => css.replace(G.CSS_PAGE_DIALOG, G.PAGE_OPEN + '{padding:0!important}')],
  ['recorte da câmera só de um lado', css => css.replace(G.CSS_PAGE_DIALOG, G.PAGE_OPEN + '{padding:0 0 0 env(safe-area-inset-left)!important}')],
  ['sem a regra do Performance Pro (a lista ficaria sob uma barra que não existe, com folga a mais)', css => css.replace(G.CSS_PAGE_PRO, '')],
  ['regra do Performance Pro com a especificidade da geral', css => css.replace(G.CSS_PAGE_PRO, G.CSS_PAGE_PRO.replace('html[data-agenda-design=pro-tl] ', ''))],
  ['regra do Performance Pro no tema errado', css => css.replace('pro-tl', 'neon-tl')],
  ['sem o espaço da barra Voltar/Painel (o fim da janela ficaria escondido atrás dela)', css => css.replace('padding-bottom:calc(92px + env(safe-area-inset-bottom))', 'padding-bottom:calc(22px + env(safe-area-inset-bottom))')],
  ['sem o espaço do topo do aparelho (barra de status)', css => css.replace('padding-top:calc(18px + env(safe-area-inset-top))', 'padding-top:18px')],
  ['sem max-width:none (o enquadramento de foto ficaria estreito em tela larga)', css => css.replace('max-width:none!important;', '')],
  ['cor de fundo mexida (o tema deixaria de valer)', css => css.replace('border-width:0!important;', 'border-width:0!important;background:#000!important;')],
  ['cantos ainda arredondados', css => css.replace('border-radius:0!important;', 'border-radius:24px!important;')],
  ['sombra mantida', css => css.replace('box-shadow:none!important;', 'box-shadow:0 0 9px #000!important;')],
  ['borda mantida', css => css.replace('border-width:0!important;', 'border-width:1px!important;')],
  ['altura em vh no lugar de 100%', css => css.replace('height:100%!important', 'height:100vh!important')],
  ['position:fixed no cartão', css => css.replace('border-width:0!important;', 'border-width:0!important;position:fixed!important;')],
  ['z-index no cartão', css => css.replace('border-width:0!important;', 'border-width:0!important;z-index:9999!important;')],
  ['overflow:hidden no cartão (pararia de rolar)', css => css.replace('border-width:0!important;', 'border-width:0!important;overflow:hidden!important;')],
  ['uma regra a mais', css => css + '.dialog{background:#000}'],
  ['uma regra a mais dentro do @media', css => css.replace(G.CSS_LOCK_BODY, G.CSS_LOCK_BODY + '.dialog{display:none}')],
  ['uma regra a menos (o Performance Pro)', css => rulesWithout(css, G.CSS_PAGE_PRO)],
  ['uma regra a menos (a janela)', css => rulesWithout(css, G.CSS_PAGE_DIALOG)],
  ['trava do corpo com overflow diferente (auto no lugar de hidden)', css => css.replace('overflow:hidden', 'overflow:auto')]
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
t('Sabotagem: o bloco do 1.12.287 ficou na página junto com o novo (as duas apresentações brigariam)', () => {
  assert.notDeepEqual(auditCss(page.replace(G.STYLE_BLOCK, G.PREVIOUS_STYLE_BLOCK + G.STYLE_BLOCK)), []);
});
t('Sabotagem: o pacote 1.12.287 (bloco antigo) é recusado pela auditoria de diferenças e a auditoria de diferenças pega um estilo a mais', () => {
  assert.notDeepEqual(auditAgainstBase(baseTeacher), []);
  assert.notDeepEqual(auditAgainstBase(page.replace('</head>', '<style>.x{color:red}</style></head>')), []);
  assert.notDeepEqual(auditAgainstBase(page.replace('function openDialog', 'function openDialogo')), []);
});
t('Sabotagem: uma regra existente mais forte para o mesmo elemento (a auditoria de especificidade enxerga)', () => {
  const extra = css => page.replace('</head>', '<style>' + css + '</style></head>');
  assert.deepEqual(auditCss(extra('.sem-efeito{color:red}')), [], 'uma regra qualquer, longe das janelas, não pode atrapalhar');
  assert.notDeepEqual(auditCss(extra('#studentDialog.dialog.open>.sheet.workout-sheet.extra{height:auto!important}')), []);
  assert.notDeepEqual(auditCss(extra('html body #studentPhoneDialog.dialog.open{padding:9px!important}')), []);
  assert.notDeepEqual(auditCss(extra('#colorPanelDialog.dialog.open.a>.sheet.color-panel-sheet{border-radius:22px!important}')), []);
  assert.notDeepEqual(auditCss(extra('#trainerPhotoCropDialog.dialog.open.a>.trainer-crop-sheet{max-width:480px!important}')), []);
  // regra !important sem id e sem especificidade para ganhar não atrapalha (as novas vencem), e uma regra de OUTRA janela com as mesmas propriedades também não
  assert.deepEqual(auditCss(extra('.trainer-crop-sheet{max-width:300px!important}')), []);
  assert.deepEqual(auditCss(extra('#workoutRestDialog.dialog.open>.sheet{height:auto!important;padding:3px!important}')), []);
  assert.deepEqual(auditCss(extra('#workoutVideoDialog.dialog.open>.sheet.workout-video-sheet.extra{width:50%!important}')), []);
});

(async () => {
  for (const [name, fn] of queue) {
    try { await fn(); ok++; console.log('OK   ' + name); } catch (e) { bad++; console.log('FALHA ' + name + '\n     ' + String(e && e.message || e).split('\n').join('\n     ')); }
  }
  console.log('\n' + ok + ' ok, ' + bad + ' com falha, de ' + queue.length);
  process.exit(bad ? 1 : 0);
})();
