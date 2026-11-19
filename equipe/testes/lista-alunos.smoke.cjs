'use strict';
// Confere o pacote 1.12.284 (cartão "Lista de alunos" no Mais; "Alunos para aprovar" só para aprovar)
// contra o pacote 1.12.283 que está na raiz do repositório. Não precisa de navegador nem de internet:
//   node equipe/testes/lista-alunos.smoke.cjs
// O teste confere: escopo (só professor.html), prova de reversão byte a byte, determinismo, o cartão no Mais (lugar,
// texto, registro) e o ícone nas três tabelas (Mais, Metal e Profundo), o ícone novo no cabeçalho da janela e, rodando o
// módulo REAL de cadastro em vm com um DOM estrito (id que não existe devolve null, como no navegador): o que cada modo
// mostra (Alunos para aprovar: só quem falta; Lista de alunos: todos, com Excluir da lista), a troca de modo, os caminhos
// do sininho e do "Tentar novamente", a aprovação (a mesma gravação nos dois modos) e os textos de lista vazia. Também
// prova que nada de Firebase, armazenamento, alarme, cronômetro ou notificação foi acrescentado e roda variações
// sabotadas do código para provar que o teste pega o erro.
// A parte visual (cartão desenhado, ícones nos temas, janela nos dois modos, Excluir, Voltar) foi conferida à parte,
// em Chrome real (equipe/testes/navegador/lista-alunos), e consta do histórico técnico do projeto.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-lista-alunos-1.12.284.cjs');
const SOURCE = path.join(ROOT, 'AgendaPersonal-1.12.283-Alunos-Para-Aprovar-Para-Assinar.agenda.json');
const G = require(GENERATOR);
const o = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const p = G.makeUpdate(o);
const baseTeacher = o.files['professor.html'], page = p.files['professor.html'];
let ok = 0, bad = 0;
const queue = [];
const t = (n, f) => queue.push([n, f]);

const count = (text, part) => { assert(typeof part === 'string' && part.length > 0, 'trecho vazio'); return text.split(part).length - 1; };
const sha = text => crypto.createHash('sha256').update(text, 'utf8').digest('hex');
const block = (html, open) => {
  const start = html.indexOf(open);
  assert(start >= 0, 'bloco ausente: ' + open);
  assert.equal(html.indexOf(open, start + open.length), -1, 'bloco duplicado: ' + open);
  return html.slice(start, html.indexOf('</script>', start) + '</script>'.length);
};
const classicScripts = html => [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .filter(m => !/\stype="/.test(m[1] || '') || /\stype="text\/javascript"/.test(m[1]));
const MODULE_OPEN = '<script data-agenda-registration>';
const moduleSource = html => block(html, MODULE_OPEN).slice(MODULE_OPEN.length, -'</script>'.length);
const GLYPH_TABLES = ['<script id="ap-more-menu-glyphs">', '<script data-agenda-metal-icons>', '<script data-agenda-deep-icons>'];

// ---------- 1) pacote ----------
t('Versão 1.12.284 / seq 390 / sem assinatura, com o mesmo aplicativo e formato do 1.12.283', () => {
  assert.equal(p.version, '1.12.284');
  assert.equal(p.sequence, 390);
  assert.equal(o.version, '1.12.283');
  assert.equal(o.sequence, 389);
  assert.equal(p.agendaSignature, undefined);
  for (const k of ['format', 'appId', 'bridgeVersion', 'dataSchema']) assert.deepEqual(p[k], o[k], k);
  assert(p.sequence > o.sequence);
  assert.deepEqual(Object.keys(p), ['format', 'appId', 'bridgeVersion', 'dataSchema', 'version', 'sequence', 'files', 'notes', 'update', 'modularUpdates']);
});
t('Aviso: título, resumo e notas dentro dos limites e coerentes com o que o código faz', () => {
  assert.equal(p.update.title, 'Lista de alunos');
  assert.equal(p.update.category, o.update.category);
  assert(p.update.summary.length > 20 && p.update.summary.length <= 200, 'resumo: ' + p.update.summary.length);
  assert(p.notes.length > 100 && p.notes.length <= 4000, 'notas: ' + p.notes.length);
  assert(/Lista de alunos/.test(p.update.summary) && /Alunos para aprovar/.test(p.update.summary) && /Excluir/.test(p.update.summary));
  assert(/1\.12\.283/.test(p.notes), 'as notas dizem que o pacote inclui o Alunos para aprovar');
  assert(/Descanso, cronômetros, alarmes e notificações não foram alterados\./.test(p.notes));
  assert(/Excluir da lista só esconde/.test(p.notes) && /mesma gravação no Firebase/.test(p.notes) && /o botão Excluir da lista saiu dele/.test(p.notes));
});
t('Só professor.html mudou: index, avaliações e cadastro idênticos, histórico modular igual', () => {
  for (const k of ['index.html', 'avaliacoes.html', 'cadastro.html']) assert.equal(p.files[k], o.files[k], k);
  assert.notEqual(page, baseTeacher);
  assert.deepEqual(Object.keys(p.files), Object.keys(o.files));
  assert.deepEqual(p.modularUpdates, o.modularUpdates);
  assert.deepEqual(Object.keys(G.edits), ['professor.html']);
});
t('Prova de reversão: desfeitas as edições, professor.html volta byte a byte ao do 1.12.283', () => {
  let undone = page;
  for (const edit of G.TEACHER_EDITS.slice().reverse()) undone = G.undoEdit(undone, edit);
  assert.equal(undone, baseTeacher);
});
t('Cada edição existe uma vez no 1.12.283 (ou o número de vezes declarado) e o total é o esperado', () => {
  for (const edit of G.TEACHER_EDITS) {
    const inBase = edit.scope ? count(block(baseTeacher, edit.scope), edit.previous) : count(baseTeacher, edit.previous);
    assert.equal(inBase, edit.times || 1, edit.name + ' (base)');
  }
  assert.equal(G.TEACHER_EDITS.length, 13);
});
t('O gerador recusa aplicar duas vezes, recusa outra base e é determinístico', () => {
  assert.throws(() => G.makeUpdate(p));
  assert.throws(() => G.makeUpdate({...o, version: '1.12.282'}));
  assert.throws(() => G.makeUpdate({...o, sequence: 388}));
  assert.throws(() => G.applyAll(page, G.TEACHER_EDITS));
  assert.equal(JSON.stringify(G.makeUpdate(o)), JSON.stringify(p));
});
t('A linha de comando grava exatamente o JSON do pacote e não sobrescreve arquivo existente; tamanho abaixo de 24 MiB', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-lista-alunos-'));
  try {
    const out = path.join(dir, 'saida.agenda.json');
    execFileSync(process.execPath, [GENERATOR, SOURCE, out], {stdio: 'pipe'});
    const written = fs.readFileSync(out, 'utf8');
    assert.equal(written, JSON.stringify(p, null, 2) + '\n');
    assert(Buffer.byteLength(written, 'utf8') < 24 * 1024 ** 2);
    assert.throws(() => execFileSync(process.execPath, [GENERATOR, SOURCE, out], {stdio: 'pipe'}));
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
t('Todos os scripts clássicos compilam e nenhum script foi acrescentado ou removido', () => {
  const compile = html => { let n = 0; for (const m of classicScripts(html)) { try { new vm.Script(m[2]); n++; } catch (e) { throw new Error(e.message + ' | ' + m[0].slice(0, 80)); } } return n; };
  const before = compile(baseTeacher), after = compile(page);
  assert(before > 50, 'poucos scripts: ' + before);
  assert.equal(after, before);
});

// ---------- 2) cartão no Mais, registro e ícone nas três tabelas ----------
t('Cartão Lista de alunos: uma vez, depois de Alunos para aprovar e antes de Sons e alertas, dentro da seção de opções do Mais', () => {
  assert.equal(count(page, 'id="moreStudentList"'), 1);
  assert.equal(count(page, 'onclick="openStudentList()"'), 1);
  const a = page.indexOf('id="moreRegistrationLink"'), b = page.indexOf('id="moreStudentApprovals"'), c = page.indexOf('id="moreStudentList"'), d = page.indexOf('id="moreLessonSounds"');
  assert(a > 0 && b > a && c > b && d > c, 'ordem dos cartões');
  const start = page.indexOf('aria-labelledby="moreOptionsTitle"'), end = page.indexOf('</section>', start);
  assert(c > start && c < end, 'dentro da seção de opções');
  const card = page.slice(page.lastIndexOf('<button', c), page.indexOf('</button>', c) + 9);
  assert.equal(card, G.LIST_CARD);
  assert(/<strong>Lista de alunos<\/strong><small>Todos os cadastros recebidos\.<\/small>/.test(card));
  // o cartão Alunos para aprovar continua exatamente como era
  const approvalsOf = html => { const k = html.indexOf('id="moreStudentApprovals"'); return html.slice(html.lastIndexOf('<button', k), html.indexOf('</button>', k) + 9); };
  assert.equal(approvalsOf(page), approvalsOf(baseTeacher));
  assert(/<strong>Alunos para aprovar<\/strong><small>Aprove os cadastros recebidos\.<\/small>/.test(approvalsOf(page)));
});
t('Registro do Mais: Lista de alunos fica no grupo Alunos e financeiro, entre Alunos para aprovar e Acompanhamento, com ícone que existe nas três tabelas', () => {
  const orgBlock = block(page, '<script id="ap-more-organization">');
  const grabFrom = (text, name) => { const m = text.match(new RegExp('const ' + name + '=(\\{[\\s\\S]*?\\});')); assert(m, 'registro ' + name); return vm.runInNewContext('(' + m[1] + ')'); };
  const routes = grabFrom(orgBlock, 'routes'), byId = grabFrom(orgBlock, 'byId');
  assert.deepEqual(byId.moreStudentList, ['students', 3.6, 'menu-roster']);
  assert.deepEqual(byId.moreStudentApprovals, ['students', 3.5, 'menu-approve']);
  const group = Object.entries({...routes, ...byId}).filter(([, v]) => v[0] === 'students').sort((x, y) => x[1][1] - y[1][1]).map(([k]) => k);
  assert.deepEqual(group, ['students-presencial', 'students-online', 'student', 'moreRegistrationLink', 'moreStudentApprovals', 'moreStudentList', 'moreFollowup', 'finance']);
  // todas as outras entradas do registro seguem iguais
  const before = grabFrom(block(baseTeacher, '<script id="ap-more-organization">'), 'byId');
  const {moreStudentList, ...rest} = byId;
  assert.deepEqual(rest, before);
  assert.deepEqual(routes, grabFrom(block(baseTeacher, '<script id="ap-more-organization">'), 'routes'));
});
t('Ícone menu-roster: entra uma vez em cada uma das três tabelas (Mais, Metal e Profundo), logo depois de menu-approve, e nenhum outro ícone mudou', () => {
  for (const open of GLYPH_TABLES) {
    assert.equal(count(block(page, open), G.GLYPH_ENTRY), 1, open);
    assert.equal(count(block(page, open), '"menu-roster":'), 1, open);
    assert.equal(count(block(baseTeacher, open), '"menu-roster"'), 0, open + ' (base)');
  }
  const parse = html => { const b = block(html, '<script id="ap-more-menu-glyphs">'); return JSON.parse(b.slice(b.indexOf('Object.freeze(') + 14, b.lastIndexOf('})') + 1)); };
  const before = parse(baseTeacher), after = parse(page);
  const keys = Object.keys(before), at = keys.indexOf('menu-approve');
  assert(at > 0, 'menu-approve existe no 1.12.283');
  assert.deepEqual(Object.keys(after), [...keys.slice(0, at + 1), 'menu-roster', ...keys.slice(at + 1)]);
  for (const k of keys) assert.equal(after[k], before[k], 'glifo alterado: ' + k);
  assert.equal(after['menu-roster'], G.ROSTER_GLYPH);
  // o glifo é só desenho: só path, rect e circle, só atributos de geometria
  assert(/^(<(path|rect|circle)(\s[a-z-]+="[^"<>]*")+\/>)+$/.test(G.ROSTER_GLYPH), 'o glifo é só desenho');
  assert(!/(script|on\w+=|href|style)/i.test(G.ROSTER_GLYPH));
});

// ---------- 3) janela: ícone novo no cabeçalho ----------
t('Janela: o ícone da Lista de alunos existe uma vez, começa oculto, fica junto dos outros dois ícones e os atalhos de links seguem os mesmos cinco', () => {
  assert.equal(count(page, ' id="registrationRosterIcon"'), 1);
  assert(page.includes('<span class="registration-head-icon" id="registrationRosterIcon" hidden>'));
  assert(page.includes(G.ROSTER_ICON));
  const head = page.slice(page.indexOf('<div class="sheet-head"><span class="registration-head-icon" id="registrationLinkIcon"'));
  const order = ['id="registrationLinkIcon"', 'id="registrationApprovalsIcon"', 'id="registrationRosterIcon"', 'id="registrationLinkTitle"', 'id="registrationLinkClose"'].map(k => head.indexOf(k));
  assert(order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])), 'ordem no cabeçalho: ' + order.join(','));
  for (const id of ['registrationTabs', 'registrationLinkIcon', 'registrationApprovalsIcon', 'registrationRosterIcon', 'registrationLinkClose', 'registrationLinkTitle', 'registrationContactsPanel', 'registrationContactsView'])
    assert.equal(count(page, ' id="' + id + '"'), 1, id);
  const tabs = page.slice(page.indexOf('<div class="registration-tabs"'), page.indexOf('</div>', page.indexOf('<div class="registration-tabs"')));
  const ids = [...tabs.matchAll(/<button id="([^"]+)"[^>]*onclick="setRegistrationTab\('([^']+)'\)"/g)].map(m => m[2]);
  assert.deepEqual(ids, ['link', 'installation', 'group', 'anamnesis', 'plans']);
  assert(page.includes('<div id="registrationContactsPanel" role="tabpanel" aria-labelledby="registrationLinkTitle" hidden>'));
});
t('Ids do módulo de cadastro: todo id citado no código existe na página (ou nasce do próprio módulo)', () => {
  const src = moduleSource(page);
  const staticIds = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const dynamic = new Set(['registrationContactsList', 'registrationRefresh', 'registrationSignOut', 'registrationTeacherLogin', 'registrationRemovalPrompt']);
  const used = new Set([...src.matchAll(/\bc\((["'])([A-Za-z][A-Za-z0-9_-]*)\1\)/g)].map(m => m[2]));
  for (const m of src.matchAll(/getElementById\((["'])([A-Za-z][A-Za-z0-9_-]*)\1\)/g)) used.add(m[2]);
  assert(used.size > 30, 'poucos ids: ' + used.size);
  for (const id of used) assert(staticIds.has(id) || dynamic.has(id), 'id citado e inexistente: ' + id);
  for (const id of ['registrationTabs', 'registrationLinkIcon', 'registrationApprovalsIcon', 'registrationRosterIcon', 'registrationLinkClose', 'registrationLinkTitle']) assert(used.has(id), 'o código deveria usar ' + id);
});

// ---------- 4) o módulo real de cadastro em vm, com DOM estrito ----------
const TEACHER = 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1';
const STATIC_IDS = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
const DYNAMIC_IDS = new Set(['registrationContactsList', 'registrationRefresh', 'registrationSignOut', 'registrationTeacherLogin', 'registrationRemovalPrompt']);
const people = {
  ana: {uid: 'u_ana', nome: 'Ana Pendente', email: 'ana@exemplo.com', whatsapp: '(69) 99999-1000', nascimento: '2000-05-12', genero: 'Prefiro não informar', perfil: 'aluno', professorId: TEACHER, ativo: false},
  elisa: {uid: 'u_elisa', nome: 'Elisa Na Agenda Sem Aprovar', email: 'elisa@exemplo.com', whatsapp: '(69) 99999-1001', nascimento: '2000-05-12', perfil: 'aluno', professorId: TEACHER, ativo: false},
  carla: {uid: 'u_carla', nome: 'Carla Aprovada', email: 'carla@exemplo.com', whatsapp: '(69) 99999-1002', nascimento: '2000-05-12', perfil: 'aluno', professorId: TEACHER, ativo: true},
  diego: {uid: 'u_diego', nome: 'Diego Na Agenda', email: 'diego@exemplo.com', whatsapp: '(69) 99999-1003', nascimento: '2000-05-12', perfil: 'aluno', professorId: TEACHER, ativo: true},
  hugo: {uid: 'u_hugo', nome: 'Hugo Escondido', email: 'hugo@exemplo.com', whatsapp: '(69) 99999-1004', nascimento: '2000-05-12', perfil: 'aluno', professorId: TEACHER, ativo: false}
};
const everyone = () => [people.ana, people.elisa, people.carla, people.diego, people.hugo].map(r => ({...r}));
function makeEnv(source) {
  const elements = new Map();
  const make = id => {
    const attrs = {};
    return {id, value: '', dataset: {}, innerHTML: '', textContent: '', hidden: false, disabled: false, open: false, style: {}, attrs, classList: {contains: () => true, add() {}, remove() {}, toggle() {}},
      setAttribute(k, v) { attrs[k] = String(v); }, getAttribute: k => (k in attrs ? attrs[k] : null), removeAttribute(k) { delete attrs[k]; }, toggleAttribute() {},
      querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, append() {}, appendChild() {}, remove() {}, scrollIntoView() {}, focus() {}, select() {}, closest: () => null};
  };
  const getElementById = id => {
    if (!STATIC_IDS.has(id) && !DYNAMIC_IDS.has(id)) return null; // como no navegador: id que não existe devolve null
    if (!elements.has(id)) elements.set(id, make(id));
    return elements.get(id);
  };
  const state = {students: [{id: 'stu_elisa', name: 'Elisa Na Agenda Sem Aprovar', firebaseUid: 'u_elisa'}, {id: 'stu_diego', name: 'Diego Na Agenda', firebaseUid: 'u_diego'}, {id: 'stu_livre', name: 'Gil Sem Conta'}], history: [], registrationContactsHidden: {[TEACHER + ':u_hugo']: true}};
  const writes = [], dialogs = [];
  const ctx = {
    console, URL, structuredClone, setTimeout, clearTimeout, queueMicrotask, state, DB_KEY: 'agendaPersonalTL_v1',
    document: {getElementById, execCommand: () => true, createElement: () => make('criado'), addEventListener() {}},
    navigator: {clipboard: {writeText: async () => {}}}, location: {href: 'https://exemplo.github.io/agenda/professor.html'},
    localStorage: {setItem: (k, v) => writes.push([k, JSON.parse(v)]), getItem: () => null},
    id: () => 'novo-' + writes.length, iso: d => d.toISOString().slice(0, 10), fmtDate: x => String(x), renderAll() {}, syncNativeAlarms() {},
    openDialog: d => dialogs.push(d), openEditStudent() {}, window: {}
  };
  ctx.window = ctx;
  const hooks = '\nwindow.__t={approve:O,setContacts:r=>i=r,setSdk:v=>o=v,setTab:v=>n=v,renderList:T,refresh:U,tab:D,openApprovals:openStudentApprovals,openList:openStudentList,mode:()=>registrationListMode,shown:()=>[...approvalsShown]};\n})();';
  const instrumented = source.replace(/\}\)\(\);\s*$/, hooks);
  assert.notEqual(instrumented, source, 'instrumentação não aplicada');
  vm.runInNewContext(instrumented, ctx);
  return {ctx, state, elements, writes, dialogs, el: getElementById, hook: ctx.__t, api: ctx.agendaRegistration};
}
const html = env => env.el('registrationContactsList').innerHTML;
const listOf = env => [...html(env).matchAll(/<article class="registration-contact" data-registration-uid="([^"]*)">[\s\S]*?<strong>([^<]*)<\/strong><span class="registration-contact-status">([^<]*)<\/span>/g)].map(m => ({uid: m[1], nome: m[2], status: m[3]}));
const removeButtons = env => count(html(env), 'data-registration-remove aria-label="Excluir ');
const fakeSdk = (records, writes = []) => ({
  auth: {currentUser: {uid: TEACHER}}, db: {}, collection: (db, name) => ({name}), where: (f, op, v) => ({f, op, v}), query: (c, ...k) => ({c, k}),
  getDocs: async () => ({docs: records().map(r => ({id: r.uid, data: () => { const {uid, ...rest} = r; return rest; }}))}),
  doc: (db, collection, uid) => ({collection, uid}), serverTimestamp: () => 'server-time',
  updateDoc: async (ref, ...fields) => { const data = {}; for (let k = 0; k < fields.length; k += 2) data[fields[k]] = fields[k + 1]; writes.push({uid: ref.uid, data}); },
  onAuthStateChanged() { return () => {}; }, signOut: async () => {}
});
const buttonFor = (record, type = 'online') => {
  const card = {dataset: {registrationUid: record.uid}, isConnected: true, setAttribute() {}, removeAttribute() {}, appendChild() {}, querySelectorAll: () => [],
    querySelector: selector => (selector === '[data-registration-type]' ? {value: type} : selector === '[data-registration-target]' ? {value: ''} : {value: '', dataset: {}, setAttribute() {}, scrollIntoView() {}, disabled: false})};
  return {disabled: false, textContent: 'Aprovar aluno', closest: () => card};
};
// abre uma janela já com o Firestore simulado e espera a lista carregar (como o professor veria)
async function openWith(source, mode, records = everyone, writes = []) {
  const env = makeEnv(source);
  env.hook.setSdk(fakeSdk(records, writes));
  if (mode === 'students') env.hook.openList(); else env.hook.openApprovals();
  await env.hook.refresh();
  return env;
}
const NAMES_APPROVALS = ['Ana Pendente', 'Elisa Na Agenda Sem Aprovar', 'Carla Aprovada'];
const NAMES_ROSTER = ['Ana Pendente', 'Elisa Na Agenda Sem Aprovar', 'Carla Aprovada', 'Diego Na Agenda'];

// Tudo o que o módulo precisa cumprir. É chamado com o código real do pacote e, mais abaixo, com versões sabotadas.
async function behaviorChecks(source) {
  // a) Alunos para aprovar (modo padrão): só quem falta, sem Excluir da lista
  const A = await openWith(source, 'approvals');
  assert.equal(A.hook.mode(), 'approvals');
  assert.deepEqual(listOf(A).map(x => x.nome), NAMES_APPROVALS, 'aprovar: quem aparece: ' + listOf(A).map(x => x.nome).join(' | '));
  assert.deepEqual(listOf(A).map(x => x.status), ['Aguardando aprovação', 'Na agenda', 'Aprovado · adicionar à agenda']);
  assert(!html(A).includes('Diego') && !html(A).includes('Hugo'), 'aprovar: Diego (aprovado e na agenda) e Hugo (excluído da lista) ficam de fora');
  assert.equal(removeButtons(A), 0, 'aprovar: sem botão Excluir da lista');
  assert(!/Excluir da lista/.test(html(A)), 'aprovar: nenhum texto Excluir da lista');
  assert(/Aprovar aluno/.test(html(A)) && /Adicionar à agenda/.test(html(A)) && /Ver aluno na agenda/.test(html(A)), 'aprovar: continua com os botões de aprovar');

  // b) Lista de alunos: todos os cadastros não excluídos, com Excluir da lista em cada um
  const B = await openWith(source, 'students');
  assert.equal(B.hook.mode(), 'students');
  assert.deepEqual(listOf(B).map(x => x.nome), NAMES_ROSTER, 'lista: quem aparece: ' + listOf(B).map(x => x.nome).join(' | '));
  assert.deepEqual(listOf(B).map(x => x.status), ['Aguardando aprovação', 'Na agenda', 'Aprovado · adicionar à agenda', 'Na agenda']);
  assert(!html(B).includes('Hugo'), 'lista: Hugo (excluído da lista) continua escondido');
  assert.equal(removeButtons(B), 4, 'lista: um Excluir da lista por cadastro');
  for (const nome of NAMES_ROSTER) assert(html(B).includes('aria-label="Excluir ' + nome + ' da lista">Excluir da lista</button>'), 'lista: Excluir de ' + nome);
  assert(/Aprovar aluno/.test(html(B)) && /Adicionar à agenda/.test(html(B)) && /Ver aluno na agenda/.test(html(B)), 'lista: continua com os botões de aprovar');

  // c) textos de lista vazia, por modo
  for (const [mode, onlyHidden] of [['approvals', /Nenhum aluno aguardando aprovação\./], ['students', /Nenhum aluno na lista\./]]) {
    const E = await openWith(source, mode, () => []);
    assert(/Nenhum cadastro recebido ainda\.<br>Envie seu link aos novos alunos\./.test(html(E)), mode + ': sem nenhum cadastro');
    E.hook.setContacts([{...people.hugo}]);
    E.hook.renderList();
    assert(onlyHidden.test(html(E)), mode + ': só cadastros excluídos da lista: ' + html(E));
  }
  const F = await openWith(source, 'approvals', () => []);
  F.hook.setContacts([{...people.diego}]);
  F.hook.renderList();
  assert(/Nenhum aluno aguardando aprovação\./.test(html(F)), 'aprovar: só quem já está na agenda');
  const F2 = await openWith(source, 'students', () => []);
  F2.hook.setContacts([{...people.diego}]);
  F2.hook.renderList();
  assert(listOf(F2).length === 1 && /Diego Na Agenda/.test(html(F2)), 'lista: quem já está na agenda aparece');

  // d) quem acabou de ser aprovado: em Alunos para aprovar fica até atualizar e sai; na Lista de alunos fica sempre
  const cloud = [{...people.ana}, {...people.carla}];
  const G1 = await openWith(source, 'approvals', () => cloud);
  assert.deepEqual(listOf(G1).map(x => x.nome), ['Ana Pendente', 'Carla Aprovada']);
  G1.state.students.push({id: 'stu_carla', name: 'Carla Aprovada', firebaseUid: 'u_carla'}); // Carla entrou na agenda
  G1.hook.renderList();
  assert.deepEqual(listOf(G1).map(x => x.nome + '/' + x.status), ['Ana Pendente/Aguardando aprovação', 'Carla Aprovada/Na agenda'], 'aprovar: Carla continua na tela, como Na agenda, até atualizar');
  await G1.hook.refresh();
  assert.deepEqual(listOf(G1).map(x => x.nome), ['Ana Pendente'], 'aprovar: depois de atualizar, Carla sai');
  const G2 = await openWith(source, 'students', () => cloud);
  G2.state.students.push({id: 'stu_carla', name: 'Carla Aprovada', firebaseUid: 'u_carla'});
  await G2.hook.refresh();
  assert.deepEqual(listOf(G2).map(x => x.nome + '/' + x.status), ['Ana Pendente/Aguardando aprovação', 'Carla Aprovada/Na agenda'], 'lista: Carla continua na lista depois de atualizar');

  // e) aprovar de verdade (código real) nos dois modos: uma gravação, a mesma de antes; o cartão fica como Na agenda
  for (const mode of ['approvals', 'students']) {
    const cloudWrites = [];
    const ana = {...people.ana};
    const C = await openWith(source, mode, () => [ana], cloudWrites);
    await C.hook.approve(buttonFor(ana, 'online'));
    assert.equal(cloudWrites.length, 1, mode + ': uma gravação');
    assert.deepEqual(cloudWrites[0], {uid: 'u_ana', data: {ativo: true, tipoAluno: 'online', aprovadoEm: 'server-time'}}, mode);
    assert(C.state.students.some(s => s.firebaseUid === 'u_ana' && s.studentType === 'online'), mode + ': entrou na agenda');
    assert.deepEqual(listOf(C).map(x => x.nome + '/' + x.status), ['Ana Pendente/Na agenda'], mode + ': o cartão fica, como Na agenda, para mostrar a confirmação');
    assert.equal(C.writes.length, 1, mode + ': uma gravação local (a da agenda)');
    assert.equal(C.hook.mode(), mode, mode + ': aprovar não troca o modo');
  }

  // f) janela: título, ícones, atalhos e rótulo do botão fechar em cada modo
  const D = makeEnv(source);
  D.hook.setSdk(fakeSdk(everyone));
  const flag = id => D.el(id).hidden;
  const iconsFor = () => [flag('registrationLinkIcon'), flag('registrationApprovalsIcon'), flag('registrationRosterIcon')].join();
  D.hook.openApprovals();
  assert.equal(D.el('registrationLinkTitle').textContent, 'Alunos para aprovar');
  assert.equal(iconsFor(), 'true,false,true', 'aprovar: só o ícone de aprovação');
  assert.equal(flag('registrationTabs'), true);
  assert.equal(D.el('registrationLinkClose').attrs['aria-label'], 'Fechar alunos para aprovar');
  assert.equal(flag('registrationContactsPanel'), false);
  assert.equal(flag('registrationLinkPanel'), true);
  D.hook.openList();
  assert.equal(D.hook.mode(), 'students');
  assert.equal(D.el('registrationLinkTitle').textContent, 'Lista de alunos');
  assert.equal(iconsFor(), 'true,true,false', 'lista: só o ícone da lista');
  assert.equal(flag('registrationTabs'), true);
  assert.equal(D.el('registrationLinkClose').attrs['aria-label'], 'Fechar lista de alunos');
  assert.equal(flag('registrationContactsPanel'), false);
  assert.equal(flag('registrationLinkPanel'), true);
  assert.deepEqual(D.dialogs, ['registrationLinkDialog', 'registrationLinkDialog'], 'cada cartão abre a janela uma vez');
  // "Tentar novamente" chama só a aba da lista, sem modo: mantém a Lista de alunos
  D.hook.tab('contacts');
  assert.equal(D.hook.mode(), 'students', 'Tentar novamente mantém o modo');
  assert.equal(D.el('registrationLinkTitle').textContent, 'Lista de alunos');
  // qualquer outra aba reinicia o modo e mostra Cadastro por link
  D.hook.tab('group');
  assert.equal(D.hook.mode(), 'approvals', 'outra aba volta ao padrão');
  assert.equal(D.el('registrationLinkTitle').textContent, 'Cadastro por link');
  assert.equal(iconsFor(), 'false,true,true', 'links: só o ícone de link');
  assert.equal(flag('registrationTabs'), false);
  assert.equal(D.el('registrationLinkClose').attrs['aria-label'], 'Fechar cadastro por link');
  assert.equal(flag('registrationContactsPanel'), true);
  assert.equal(flag('groupLinkPanel'), false);
  assert.equal(D.el('groupLinkTab').attrs['aria-selected'], 'true');
  D.hook.tab('link');
  assert.equal(flag('registrationLinkPanel'), false);
  assert.equal(D.el('registrationLinkTab').attrs['aria-selected'], 'true');
  assert.equal(typeof D.ctx.openStudentList, 'function', 'openStudentList exportado em window');
  assert.equal(typeof D.ctx.openStudentApprovals, 'function', 'openStudentApprovals exportado em window');
  assert.equal(typeof D.ctx.setRegistrationTab, 'function');

  // g) entradas que já existiam: o sininho e o menu Alunos e convites chamam openRegistrationLink() e depois
  //    setRegistrationTab('contacts'); mesmo depois de a Lista de alunos ter sido usada, caem em Alunos para aprovar
  const H = makeEnv(source);
  H.hook.setSdk(fakeSdk(everyone));
  H.hook.openList();
  assert.equal(H.hook.mode(), 'students');
  H.ctx.openRegistrationLink();
  assert.equal(H.el('registrationLinkTitle').textContent, 'Cadastro por link', 'Cadastro por link volta ao modo de links');
  assert.equal(H.hook.mode(), 'approvals');
  H.ctx.setRegistrationTab('contacts');
  assert.equal(H.hook.mode(), 'approvals', 'sininho: Alunos para aprovar');
  assert.equal(H.el('registrationLinkTitle').textContent, 'Alunos para aprovar');
  assert.equal(H.el('registrationRosterIcon').hidden, true);
  await H.hook.refresh();
  assert.deepEqual(listOf(H).map(x => x.nome), NAMES_APPROVALS);
  assert.equal(removeButtons(H), 0);
}

t('Módulo real: cada modo mostra o que deve (aprovar: só quem falta e sem Excluir; lista: todos, com Excluir), a janela troca de modo, o sininho cai em aprovar e a aprovação grava o mesmo', async () => {
  await behaviorChecks(moduleSource(page));
});
t('O teste pega o erro: Excluir fora do lugar, filtro trocado, modo perdido ou não reiniciado, ícone, título, vazio e exportação sabotados', async () => {
  const real = moduleSource(page);
  const REMOVE_BUTTON = "+(roster?'<button class=\"btn danger registration-contact-remove\"";
  const mutants = {
    'Excluir aparece também em Alunos para aprovar': [REMOVE_BUTTON, "+(true?'<button class=\"btn danger registration-contact-remove\""],
    'Excluir nunca aparece (nem na Lista de alunos)': [REMOVE_BUTTON, "+(false?'<button class=\"btn danger registration-contact-remove\""],
    'Lista de alunos filtrada como a de aprovação': ['(roster||!registrationSettled(record)||approvalsShown.has(record.uid))', '(!registrationSettled(record)||approvalsShown.has(record.uid))'],
    'Alunos para aprovar mostra todos': ['(roster||!registrationSettled(record)||approvalsShown.has(record.uid))', 'true'],
    'cartão da lista abre no modo de aprovação': ['D("contacts", "students");', 'D("contacts", "approvals");'],
    'cartão de aprovação abre no modo da lista': ['D("contacts", "approvals");', 'D("contacts", "students");'],
    'outra aba não reinicia o modo': ['if (n !== "contacts") registrationListMode = "approvals";\n  else if (', 'if ('],
    'Tentar novamente derruba o modo': ['else if (mode === "approvals" || mode === "students") registrationListMode = mode;', 'else registrationListMode = mode === "students" ? "students" : "approvals";'],
    'ícone da lista nunca é ajustado': ['  c("registrationRosterIcon").hidden = !roster;\n', ''],
    'ícone de aprovação aparece também na lista': ['c("registrationApprovalsIcon").hidden = !listing || roster;', 'c("registrationApprovalsIcon").hidden = !listing;'],
    'título da lista errado': ['roster ? "Lista de alunos" : listing', 'roster ? "Alunos para aprovar" : listing'],
    'botão fechar da lista com nome errado': ['roster ? "Fechar lista de alunos" : listing', 'roster ? "Fechar alunos para aprovar" : listing'],
    'lista vazia sem texto próprio da lista': ["(roster?'Nenhum aluno na lista.':'Nenhum aluno aguardando aprovação.')", "'Nenhum aluno aguardando aprovação.'"],
    'Lista de alunos não exportada': ['window.openStudentList=openStudentList;', ''],
    // as sabotagens do 1.12.283 continuam valendo
    'sem permanência depois de aprovar': ['||approvalsShown.has(record.uid))).sort(', ')).sort('],
    'atualizar não recomeça a conferência': ['cancelRegistrationRemoval(false);approvalsShown=new Set;const t=c("registrationContactsView")', 'cancelRegistrationRemoval(false);const t=c("registrationContactsView")'],
    'resolvido sem olhar a aprovação': ['return record.ativo===true&&state.students.some(', 'return state.students.some('],
    'sem guarda do atalho sem botão': ['if (buttonId) c(buttonId).setAttribute(', 'c(buttonId).setAttribute('],
    'atalho ainda aponta para o botão que saiu': ['["contacts", "", "registrationContactsPanel"]', '["contacts", "registrationContactsTab", "registrationContactsPanel"]'],
    'modo da janela não aplicado': ['  applyRegistrationMode();\n  if (n === "installation")', '  if (n === "installation")'],
    'lembra de quem foi mostrado só no primeiro desenho': ['\n approvalsShown=new Set(visible.map(record=>record.uid));', '\n']
  };
  for (const [name, [from, to]] of Object.entries(mutants)) {
    assert.equal(count(real, from), 1, 'sabotagem sem alvo: ' + name);
    const mutated = real.replace(from, () => to);
    assert.doesNotThrow(() => new vm.Script(mutated), 'a sabotagem precisa ser um código válido: ' + name);
    let caught = false;
    try { await behaviorChecks(mutated); } catch (e) { caught = true; }
    assert(caught, 'o teste não pegou a sabotagem: ' + name);
  }
});

// ---------- 5) o que não pode ser tocado ----------
const addedCode = G.TEACHER_EDITS.map(e => e.next).join('\n');
t('Aprovação e Firebase: mesmas chamadas, mesma gravação, mesmo número de operações', () => {
  for (const op of ['updateDoc(', 'getDocs(', 'onSnapshot(', 'setDoc(', 'deleteDoc(', 'addDoc(', 'writeBatch(', 'runTransaction(', 'getDoc(', 'signIn', 'signOut(', 'localStorage.setItem(', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'sendBeacon'])
    assert.equal(count(page, op), count(baseTeacher, op), op);
  assert.equal(count(page, "await o.updateDoc(ref,'ativo',true,'tipoAluno',type,'aprovadoEm',o.serverTimestamp())"), 1);
  assert.equal(count(page, "await o.updateDoc(ref,'ativo',true);"), 1);
  assert.equal(count(page, 'o.where("professorId","==",e)'), 1);
  // a exclusão continua sendo a mesma: só esconde localmente, sem tocar no cadastro do aluno
  assert.equal(count(moduleSource(page), "state.registrationContactsHidden=hidden;"), 1);
  assert(moduleSource(page).includes("[registrationRemovalKey(record.uid)]:true"));
});
t('Não mexe em descanso, cronômetro, alarme ou notificação; o aviso do sininho continua exatamente igual', () => {
  // firebaseUid é só o campo que já existe em cada aluno vinculado e não é acrescentado por esta mudança
  const found = (addedCode.match(/(\brest\b|restSeconds|alarm|notific|timer|descanso|cron[oô]metro|resumeWorkoutRest|firebase|firestore|\.delete\(|removeItem|setItem|localStorage|fetch\(|XMLHttpRequest)/i) || [])[0];
  assert(!found, 'achou: ' + found);
  assert(!/(descanso|cron[oô]metro|alarme|notifica)/i.test(p.update.summary + ' ' + p.notes.replace(/Descanso, cronômetros, alarmes e notificações não foram alterados\./, '')));
  const bell = html => block(html, '<script id="ap-teacher-features">');
  assert.equal(sha(bell(page)), sha(bell(baseTeacher)), 'o bloco do aviso do sininho não pode mudar');
  assert(bell(page).includes("window.openRegistrationLink();\n      window.setRegistrationTab('contacts');"), 'Ver cadastros continua chamando estas duas funções');
  assert(moduleSource(page).includes('window.openRegistrationLink=L;window.setRegistrationTab=D;'));
  // o menu Alunos e convites do aplicativo (index.html) também não muda e continua chamando as mesmas duas funções
  assert(p.files['index.html'].includes('t.openRegistrationLink();t.setRegistrationTab?.("contacts")'));
});
t('A aba interna continua "contacts" nos dois modos, com o mesmo nome técnico e o mesmo painel', () => {
  const src = moduleSource(page);
  assert(src.includes('["contacts", "", "registrationContactsPanel"]'));
  assert(src.includes('else if (n === "contacts") U();'));
  assert(src.includes('n="link";f();D("link");openDialog("registrationLinkDialog")'));
  assert(page.includes('registrationContactsHidden'));
  assert.equal(count(src, 'n!==\'contacts\''), count(moduleSource(baseTeacher), 'n!==\'contacts\''));
  assert.equal(count(src, 'n==="contacts"'), count(moduleSource(baseTeacher), 'n==="contacts"'));
});
t('Nenhum link de convite do grupo no pacote', () => {
  assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(JSON.stringify(p.files)));
});

(async () => {
  for (const [name, fn] of queue) {
    try { await fn(); ok++; console.log('OK   ' + name); } catch (e) { bad++; console.log('FALHA ' + name + ' -> ' + (e && e.message)); }
  }
  console.log(`\nresultado: ${ok} ok, ${bad} falhas`);
  process.exit(bad ? 1 : 0);
})();
