'use strict';
// Confere o pacote 1.12.283 (cartão "Alunos para aprovar" no Mais; Contatos sai de Cadastro por link)
// contra o pacote 1.12.282 que está na raiz do repositório. Não precisa de navegador nem de internet:
//   node equipe/testes/alunos-aprovar.smoke.cjs
// O teste confere: escopo (só professor.html e uma frase do index.html), prova de reversão byte a byte,
// determinismo, o cartão e o ícone nas três tabelas (Mais, Metal e Profundo), a janela (ids, atalhos, grade),
// os textos que apontavam para Contatos e, rodando o módulo REAL de cadastro em vm com um DOM estrito (id que não
// existe devolve null, como no navegador), a lista (quem aparece e quem sai), a permanência de quem acabou de ser
// aprovado até atualizar, o modo da janela e a aprovação. Também prova que nada de Firebase, armazenamento, alarme,
// cronômetro ou notificação foi acrescentado e roda variações sabotadas do código para provar que o teste pega o erro.
// A parte visual (cartão desenhado, ícones nos temas, grade 3+2, Voltar) foi conferida à parte, em Chrome real,
// e consta do histórico técnico do projeto.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-alunos-aprovar-1.12.283.cjs');
const SOURCE = path.join(ROOT, 'AgendaPersonal-1.12.282-Feedback-Aluno-Para-Assinar.agenda.json');
const G = require(GENERATOR);
const o = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const p = G.makeUpdate(o);
const baseTeacher = o.files['professor.html'], page = p.files['professor.html'];
const baseIndex = o.files['index.html'], index = p.files['index.html'];
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

// ---------- 1) pacote ----------
t('Versão 1.12.283 / seq 389 / sem assinatura, com o mesmo aplicativo e formato do 1.12.282', () => {
  assert.equal(p.version, '1.12.283');
  assert.equal(p.sequence, 389);
  assert.equal(p.agendaSignature, undefined);
  for (const k of ['format', 'appId', 'bridgeVersion', 'dataSchema']) assert.deepEqual(p[k], o[k], k);
  assert(p.sequence > o.sequence);
  assert.deepEqual(Object.keys(p), ['format', 'appId', 'bridgeVersion', 'dataSchema', 'version', 'sequence', 'files', 'notes', 'update', 'modularUpdates']);
});
t('Aviso: título, resumo e notas dentro dos limites e coerentes com o que o código faz', () => {
  assert.equal(p.update.title, 'Alunos para aprovar');
  assert.equal(p.update.category, o.update.category);
  assert(p.update.summary.length > 20 && p.update.summary.length <= 200, 'resumo: ' + p.update.summary.length);
  assert(p.notes.length > 100 && p.notes.length <= 4000, 'notas: ' + p.notes.length);
  assert(/Alunos para aprovar/.test(p.update.summary) && /Cadastro por link/.test(p.update.summary));
  assert(/1\.12\.282/.test(p.notes), 'as notas dizem que o pacote inclui o Feedback do aluno');
  assert(/Descanso, cronômetros, alarmes e notificações não foram alterados\./.test(p.notes));
  assert(/Excluir da lista continua só escondendo/.test(p.notes) && /mesma gravação no Firebase/.test(p.notes));
});
t('Só professor.html e uma frase do index.html mudaram: avaliações e cadastro idênticos, histórico modular igual', () => {
  for (const k of ['avaliacoes.html', 'cadastro.html']) assert.equal(p.files[k], o.files[k], k);
  assert.notEqual(page, baseTeacher);
  assert.notEqual(index, baseIndex);
  assert.deepEqual(Object.keys(p.files), Object.keys(o.files));
  assert.deepEqual(p.modularUpdates, o.modularUpdates);
  // no index.html só muda a frase da conta do aluno sem vínculo
  assert.equal(G.INDEX_EDITS.length, 1);
  assert(Math.abs(index.length - baseIndex.length) < 80);
});
t('Prova de reversão: desfeitas as edições, professor.html e index.html voltam byte a byte aos do 1.12.282', () => {
  for (const [name, list] of Object.entries(G.edits)) {
    let undone = p.files[name];
    for (const edit of list.slice().reverse()) undone = G.undoEdit(undone, edit);
    assert.equal(undone, o.files[name], name);
  }
});
t('Cada edição existe uma vez no 1.12.282 (ou o número de vezes declarado) e o resultado tem o que se esperava', () => {
  for (const [name, list] of Object.entries(G.edits)) {
    for (const edit of list) {
      const inBase = edit.scope ? count(block(o.files[name], edit.scope), edit.previous) : count(o.files[name], edit.previous);
      assert.equal(inBase, edit.times || 1, edit.name + ' (base)');
    }
  }
  assert.equal(G.TEACHER_EDITS.length, 28);
  assert.equal(G.INDEX_EDITS.length, 1);
});
t('O gerador recusa aplicar duas vezes, recusa outra base e é determinístico', () => {
  assert.throws(() => G.makeUpdate(p));
  assert.throws(() => G.makeUpdate({...o, version: '1.12.281'}));
  assert.throws(() => G.makeUpdate({...o, sequence: 387}));
  assert.throws(() => G.applyAll(page, G.TEACHER_EDITS));
  assert.equal(JSON.stringify(G.makeUpdate(o)), JSON.stringify(p));
});
t('A linha de comando grava exatamente o JSON do pacote e não sobrescreve arquivo existente; tamanho abaixo de 24 MiB', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-alunos-aprovar-'));
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
  for (const [a, b] of [[baseTeacher, page], [baseIndex, index]]) {
    const before = compile(a), after = compile(b);
    assert(before > 50, 'poucos scripts: ' + before);
    assert.equal(after, before);
  }
});

// ---------- 2) cartão no Mais e ícone nas três tabelas ----------
t('Cartão Alunos para aprovar: uma vez, entre Cadastro por link e Sons e alertas, dentro da seção de opções do Mais', () => {
  assert.equal(count(page, 'id="moreStudentApprovals"'), 1);
  assert.equal(count(page, 'onclick="openStudentApprovals()"'), 1);
  const a = page.indexOf('id="moreRegistrationLink"'), b = page.indexOf('id="moreStudentApprovals"'), c = page.indexOf('id="moreLessonSounds"');
  assert(a > 0 && b > a && c > b, 'ordem dos cartões');
  const start = page.indexOf('aria-labelledby="moreOptionsTitle"'), end = page.indexOf('</section>', start);
  assert(b > start && b < end, 'dentro da seção de opções');
  const card = page.slice(page.lastIndexOf('<button', b), page.indexOf('</button>', b) + 9);
  assert.equal(card, G.APPROVALS_CARD);
  assert(/<strong>Alunos para aprovar<\/strong><small>Aprove os cadastros recebidos\.<\/small>/.test(card));
  assert(page.includes('<small>Convide novos alunos pelo link.</small>') && !page.includes('Convide e aprove novos alunos.'));
  assert(page.includes("moreStudentApprovals:['students',3.5,'menu-approve'],"));
});
t('Ícone menu-approve: entra uma vez em cada uma das três tabelas (Mais, Metal e Profundo) e a tabela do Mais continua válida', () => {
  for (const open of ['<script id="ap-more-menu-glyphs">', '<script data-agenda-metal-icons>', '<script data-agenda-deep-icons>']) {
    assert.equal(count(block(page, open), G.GLYPH_ENTRY), 1, open);
    assert.equal(count(block(page, open), '"menu-approve":'), 1, open);
    assert.equal(count(block(baseTeacher, open), '"menu-approve"'), 0, open + ' (base)');
  }
  const parse = html => { const b = block(html, '<script id="ap-more-menu-glyphs">'); return JSON.parse(b.slice(b.indexOf('Object.freeze(') + 14, b.lastIndexOf('})') + 1)); };
  const before = parse(baseTeacher), after = parse(page);
  assert.equal(Object.keys(before).length, 26);
  assert.deepEqual(Object.keys(after), [...Object.keys(before).slice(0, 20), 'menu-approve', ...Object.keys(before).slice(20)]);
  for (const k of Object.keys(before)) assert.equal(after[k], before[k], 'glifo alterado: ' + k);
  assert.equal(after['menu-approve'], G.APPROVE_GLYPH);
  assert(!/(script|on\w+=|href)/i.test(G.APPROVE_GLYPH), 'o glifo é só desenho');
});

// ---------- 3) janela: ids, atalhos, grade e textos ----------
t('Janela: ids novos existem uma vez, o atalho Contatos saiu e restam cinco atalhos de links', () => {
  for (const id of ['registrationTabs', 'registrationLinkIcon', 'registrationApprovalsIcon', 'registrationLinkClose', 'registrationLinkTitle', 'registrationContactsPanel', 'registrationContactsView'])
    assert.equal(count(page, ' id="' + id + '"'), 1, id);
  assert(!page.includes('registrationContactsTab'), 'sobrou referência ao atalho Contatos');
  const tabs = page.slice(page.indexOf('<div class="registration-tabs"'), page.indexOf('</div>', page.indexOf('<div class="registration-tabs"')));
  const ids = [...tabs.matchAll(/<button id="([^"]+)"[^>]*onclick="setRegistrationTab\('([^']+)'\)"/g)].map(m => m[2]);
  assert.deepEqual(ids, ['link', 'installation', 'group', 'anamnesis', 'plans']);
  assert.equal(count(tabs, '<button '), 5);
  assert(page.includes('<div id="registrationContactsPanel" role="tabpanel" aria-labelledby="registrationLinkTitle" hidden>'));
  assert(/<span class="registration-head-icon" id="registrationApprovalsIcon" hidden>/.test(page));
  assert(/<h3 id="registrationLinkTitle">Cadastro por link<\/h3><button class="close" id="registrationLinkClose" type="button" data-close="registrationLinkDialog" aria-label="Fechar cadastro por link">/.test(page));
});
t('Janela: grade de 6 colunas, três atalhos na primeira linha e dois centralizados na segunda', () => {
  assert(page.includes('#registrationLinkDialog .registration-tabs{grid-template-columns:repeat(6,minmax(0,1fr));'));
  assert(page.includes('#registrationLinkDialog .registration-tabs button{grid-column:span 2}'));
  assert(page.includes('#registrationLinkDialog .registration-tabs button:nth-child(4){grid-column:2/4}'));
  assert(page.includes('#registrationLinkDialog .registration-tabs button:nth-child(5){grid-column:4/6}'));
  assert(!page.includes('registration-tabs{grid-template-columns:repeat(3,minmax(0,1fr))'));
});
t('Textos: nada manda mais para Contatos; as frases novas apontam para Mais → Alunos para aprovar', () => {
  for (const [name, html] of [['professor.html', page], ['index.html', index]]) {
    assert(!/na aba Contatos|→ Contatos|→ Contatos|em Contatos\./.test(html), name + ': sobrou frase antiga');
  }
  assert(!/Atualizar contatos|Atualize os contatos|atualize os contatos|Nenhum contato na lista/.test(page));
  assert.equal(count(page, 'Mais → Alunos para aprovar'), 2);
  assert.equal(count(index, 'Mais → Alunos para aprovar'), 1);
  assert.equal(count(page, 'a este perfil em Alunos para aprovar.'), 1);
  assert.equal(count(page, 'Atualize a lista e tente novamente.'), 3);
  assert.equal(count(page, 'Entre com a conta do professor e atualize a lista.'), 1);
  assert.equal(count(page, '>Atualizar lista</button>'), 1);
  assert.equal(count(page, 'Nenhum aluno aguardando aprovação.'), 1);
  assert.equal(count(page, 'Nenhum cadastro recebido ainda.<br>Envie seu link aos novos alunos.'), 1);
  // a categoria "Cadastros e contatos" do histórico de atualizações é outra coisa e continua igual
  assert.equal(count(index, 'Cadastros e contatos'), count(baseIndex, 'Cadastros e contatos'));
});
t('Ids do módulo de cadastro: todo id citado no código existe na página (ou nasce do próprio módulo)', () => {
  const src = moduleSource(page);
  const staticIds = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const dynamic = new Set(['registrationContactsList', 'registrationRefresh', 'registrationSignOut', 'registrationTeacherLogin', 'registrationRemovalPrompt']);
  const used = new Set([...src.matchAll(/\bc\((["'])([A-Za-z][A-Za-z0-9_-]*)\1\)/g)].map(m => m[2]));
  for (const m of src.matchAll(/getElementById\((["'])([A-Za-z][A-Za-z0-9_-]*)\1\)/g)) used.add(m[2]);
  assert(used.size > 30, 'poucos ids: ' + used.size);
  for (const id of used) assert(staticIds.has(id) || dynamic.has(id), 'id citado e inexistente: ' + id);
  for (const id of ['registrationTabs', 'registrationLinkIcon', 'registrationApprovalsIcon', 'registrationLinkClose', 'registrationLinkTitle']) assert(used.has(id), 'o código deveria usar ' + id);
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
  const hooks = '\nwindow.__t={approve:O,setContacts:r=>i=r,setSdk:v=>o=v,setTab:v=>n=v,renderList:T,refresh:U,tab:D,openApprovals:openStudentApprovals,shown:()=>[...approvalsShown]};\n})();';
  const instrumented = source.replace(/\}\)\(\);\s*$/, hooks);
  assert.notEqual(instrumented, source, 'instrumentação não aplicada');
  vm.runInNewContext(instrumented, ctx);
  return {ctx, state, elements, writes, dialogs, el: getElementById, hook: ctx.__t, api: ctx.agendaRegistration};
}
const listOf = env => {
  const html = env.el('registrationContactsList').innerHTML;
  return [...html.matchAll(/<article class="registration-contact" data-registration-uid="([^"]*)">[\s\S]*?<strong>([^<]*)<\/strong><span class="registration-contact-status">([^<]*)<\/span>/g)].map(m => ({uid: m[1], nome: m[2], status: m[3]}));
};
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

// Tudo o que o módulo precisa cumprir. É chamado com o código real do pacote e, mais abaixo, com versões sabotadas.
async function behaviorChecks(source) {
  // a) lista: quem aparece e quem sai
  const A = makeEnv(source);
  A.hook.setSdk(fakeSdk(() => []));
  A.hook.setTab('contacts');
  A.hook.setContacts([people.ana, people.elisa, people.carla, people.diego, people.hugo].map(r => ({...r})));
  A.hook.renderList();
  const first = listOf(A);
  assert.deepEqual(first.map(x => x.nome), ['Ana Pendente', 'Elisa Na Agenda Sem Aprovar', 'Carla Aprovada'], 'quem aparece: ' + first.map(x => x.nome).join(' | '));
  assert.deepEqual(first.map(x => x.status), ['Aguardando aprovação', 'Na agenda', 'Aprovado · adicionar à agenda']);
  assert(!A.el('registrationContactsList').innerHTML.includes('Diego') && !A.el('registrationContactsList').innerHTML.includes('Hugo'), 'Diego (aprovado e na agenda) e Hugo (excluído da lista) ficam de fora');
  // lista vazia: dois textos diferentes
  A.hook.setContacts([]);
  A.hook.renderList();
  assert(/Nenhum cadastro recebido ainda\.<br>Envie seu link aos novos alunos\./.test(A.el('registrationContactsList').innerHTML), 'sem nenhum cadastro');
  A.hook.setContacts([{...people.diego}, {...people.hugo}]);
  A.hook.renderList();
  assert(/Nenhum aluno aguardando aprovação\./.test(A.el('registrationContactsList').innerHTML), 'só resolvidos ou excluídos');

  // b) quem já foi mostrado fica até atualizar; atualizar recomeça a conferência
  const B = makeEnv(source);
  const cloud = [{...people.ana}, {...people.carla}];
  B.hook.setSdk(fakeSdk(() => cloud));
  B.hook.setTab('contacts');
  B.hook.setContacts(cloud.map(r => ({...r})));
  B.hook.renderList();
  assert.deepEqual(listOf(B).map(x => x.nome), ['Ana Pendente', 'Carla Aprovada']);
  B.state.students.push({id: 'stu_carla', name: 'Carla Aprovada', firebaseUid: 'u_carla'}); // Carla entrou na agenda
  B.hook.renderList();
  assert.deepEqual(listOf(B).map(x => x.nome + '/' + x.status), ['Ana Pendente/Aguardando aprovação', 'Carla Aprovada/Na agenda'], 'Carla continua na tela, como Na agenda, até atualizar');
  await B.hook.refresh();
  assert.deepEqual(listOf(B).map(x => x.nome), ['Ana Pendente'], 'depois de atualizar, Carla sai');
  assert.deepEqual(B.hook.shown(), ['u_ana']);

  // c) aprovar de verdade (código real): uma gravação, a mesma de antes; o cartão fica como Na agenda
  const C = makeEnv(source);
  const cloudWrites = [];
  const ana = {...people.ana};
  C.hook.setSdk(fakeSdk(() => [ana], cloudWrites));
  C.hook.setTab('contacts');
  C.hook.setContacts([ana]);
  C.hook.renderList();
  await C.hook.approve(buttonFor(ana, 'online'));
  assert.equal(cloudWrites.length, 1);
  assert.deepEqual(cloudWrites[0], {uid: 'u_ana', data: {ativo: true, tipoAluno: 'online', aprovadoEm: 'server-time'}});
  assert(C.state.students.some(s => s.firebaseUid === 'u_ana' && s.studentType === 'online'), 'entrou na agenda');
  assert.deepEqual(listOf(C).map(x => x.nome + '/' + x.status), ['Ana Pendente/Na agenda'], 'o cartão fica, como Na agenda, para mostrar a confirmação');
  assert.equal(C.writes.length, 1, 'uma gravação local (a da agenda)');

  // d) modo da janela
  const D = makeEnv(source);
  D.hook.setSdk(fakeSdk(() => [people.ana].map(r => ({...r}))));
  const flag = id => D.el(id).hidden;
  D.hook.tab('contacts');
  assert.equal(D.el('registrationLinkTitle').textContent, 'Alunos para aprovar');
  assert.equal(flag('registrationTabs'), true);
  assert.equal(flag('registrationLinkIcon'), true);
  assert.equal(flag('registrationApprovalsIcon'), false);
  assert.equal(D.el('registrationLinkClose').attrs['aria-label'], 'Fechar alunos para aprovar');
  assert.equal(flag('registrationContactsPanel'), false);
  assert.equal(flag('registrationLinkPanel'), true);
  D.hook.tab('group');
  assert.equal(D.el('registrationLinkTitle').textContent, 'Cadastro por link');
  assert.equal(flag('registrationTabs'), false);
  assert.equal(flag('registrationLinkIcon'), false);
  assert.equal(flag('registrationApprovalsIcon'), true);
  assert.equal(D.el('registrationLinkClose').attrs['aria-label'], 'Fechar cadastro por link');
  assert.equal(flag('registrationContactsPanel'), true);
  assert.equal(flag('groupLinkPanel'), false);
  assert.equal(D.el('groupLinkTab').attrs['aria-selected'], 'true');
  D.hook.tab('contacts');
  D.hook.tab('link');
  assert.equal(D.el('registrationLinkTitle').textContent, 'Cadastro por link');
  assert.equal(flag('registrationLinkPanel'), false);
  assert.equal(D.el('registrationLinkTab').attrs['aria-selected'], 'true');
  // abrir pelo cartão: janela aberta uma vez, já no modo de aprovação
  D.hook.openApprovals();
  assert.deepEqual(D.dialogs, ['registrationLinkDialog']);
  assert.equal(D.el('registrationLinkTitle').textContent, 'Alunos para aprovar');
  assert.equal(typeof D.ctx.openStudentApprovals, 'function', 'exportado em window');
  assert.equal(D.ctx.openRegistrationLink === undefined, false);
  assert.equal(typeof D.ctx.setRegistrationTab, 'function');
}

t('Módulo real: a lista mostra quem falta, quem foi mostrado fica até atualizar, a aprovação grava o mesmo, a janela troca de modo', async () => {
  await behaviorChecks(moduleSource(page));
});
t('O teste pega o erro: lista sem filtro, sem permanência, sem reinício ao atualizar, sem "aprovado e na agenda", atalho sem botão e modo não aplicado', async () => {
  const real = moduleSource(page);
  const mutants = {
    'filtro desligado (mostra todos)': ['(!registrationSettled(record)||approvalsShown.has(record.uid))', 'true'],
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
    let caught = false;
    try { await behaviorChecks(real.replace(from, () => to)); } catch (e) { caught = true; }
    assert(caught, 'o teste não pegou a sabotagem: ' + name);
  }
});

// ---------- 5) o que não pode ser tocado ----------
const addedCode = [...G.TEACHER_EDITS, ...G.INDEX_EDITS].map(e => e.next).join('\n');
t('Aprovação e Firebase: mesmas chamadas, mesma gravação, mesmo número de operações em professor.html e index.html', () => {
  for (const [a, b, name] of [[baseTeacher, page, 'professor.html'], [baseIndex, index, 'index.html']]) {
    for (const op of ['updateDoc(', 'getDocs(', 'onSnapshot(', 'setDoc(', 'deleteDoc(', 'addDoc(', 'writeBatch(', 'runTransaction(', 'getDoc(', 'signIn', 'signOut(', 'localStorage.setItem(', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'sendBeacon'])
      assert.equal(count(b, op), count(a, op), name + ': ' + op);
  }
  assert.equal(count(page, "await o.updateDoc(ref,'ativo',true,'tipoAluno',type,'aprovadoEm',o.serverTimestamp())"), 1);
  assert.equal(count(page, "await o.updateDoc(ref,'ativo',true);"), 1);
  assert.equal(count(page, 'o.where("professorId","==",e)'), 1);
});
t('Não mexe em descanso, cronômetro, alarme ou notificação; o aviso do sininho continua exatamente igual', () => {
  // firebaseUid é só o campo que já existe em cada aluno vinculado: o código novo apenas o lê (registrationSettled).
  const found = (addedCode.match(/(\brest\b|restSeconds|alarm|notific|timer|descanso|cron[oô]metro|resumeWorkoutRest|firebase(?!Uid)|firestore|\.delete\(|removeItem|setItem|localStorage|fetch\(|XMLHttpRequest)/i) || [])[0];
  assert(!found, 'achou: ' + found);
  assert(!/(descanso|cron[oô]metro|alarme|notifica)/i.test(p.update.summary + ' ' + p.notes.replace(/Descanso, cronômetros, alarmes e notificações não foram alterados\./, '')));
  const bell = html => block(html, '<script id="ap-teacher-features">');
  assert.equal(sha(bell(page)), sha(bell(baseTeacher)), 'o bloco do aviso do sininho não pode mudar');
  assert(bell(page).includes("window.openRegistrationLink();\n      window.setRegistrationTab('contacts');"), 'Ver cadastros continua chamando estas duas funções');
  assert(moduleSource(page).includes('window.openRegistrationLink=L;window.setRegistrationTab=D;'));
});
t('Quem é "Contatos" por dentro não mudou: ainda é a mesma aba interna, com o mesmo nome técnico', () => {
  assert(moduleSource(page).includes('["contacts", "", "registrationContactsPanel"]'));
  assert(moduleSource(page).includes('else if (n === "contacts") U();'));
  assert(page.includes('registrationContactsHidden'));
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
