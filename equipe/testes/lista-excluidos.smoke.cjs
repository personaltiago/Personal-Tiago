'use strict';
// Confere o pacote 1.12.285 (Lista de alunos: Mostrar excluídos / Voltar para a lista) contra o pacote 1.12.284 que
// está na raiz do repositório. Não precisa de navegador nem de internet:
//   node equipe/testes/lista-excluidos.smoke.cjs
// O teste confere: escopo (só professor.html), prova de reversão byte a byte, determinismo, e, rodando o módulo REAL de
// cadastro em vm com um DOM estrito (id que não existe devolve null, como no navegador) e com os botões ligados de
// verdade (o clique chama o código do pacote): o bloco dos excluídos (fechado, aberto, aberto sozinho quando não há
// aluno na lista, ausente em Alunos para aprovar), Voltar para a lista (um e todos: o que sai do mapa, o que fica, o que
// é gravado, o aviso de sincronização, nenhuma gravação no Firebase), falha ao salvar, nomes com HTML, o estado
// aberto/fechado do bloco, a confirmação do Excluir com o aviso novo e, por cima de tudo, as regras do 1.12.284 (que
// seguem valendo). Também prova que nada de Firebase, alarme, cronômetro ou notificação foi acrescentado e roda variações
// sabotadas do código para provar que o teste pega o erro.
// A parte visual (bloco desenhado, botões de 44 px, Metal e Profundo, celular estreito) foi conferida à parte, em Chrome
// real (equipe/testes/navegador/lista-excluidos), e consta do histórico técnico do projeto.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-lista-excluidos-1.12.285.cjs');
const SOURCE = path.join(ROOT, 'AgendaPersonal-1.12.284-Lista-De-Alunos-Para-Assinar.agenda.json');
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

// ---------- 1) pacote ----------
t('Versão 1.12.285 / seq 391 / sem assinatura, com o mesmo aplicativo e formato do 1.12.284', () => {
  assert.equal(p.version, '1.12.285');
  assert.equal(p.sequence, 391);
  assert.equal(o.version, '1.12.284');
  assert.equal(o.sequence, 390);
  assert.equal(p.agendaSignature, undefined);
  for (const k of ['format', 'appId', 'bridgeVersion', 'dataSchema']) assert.deepEqual(p[k], o[k], k);
  assert(p.sequence > o.sequence);
  assert.deepEqual(Object.keys(p), ['format', 'appId', 'bridgeVersion', 'dataSchema', 'version', 'sequence', 'files', 'notes', 'update', 'modularUpdates']);
});
t('Aviso: título, resumo e notas dentro dos limites e coerentes com o que o código faz', () => {
  assert.equal(p.update.title, 'Excluídos da lista');
  assert.equal(p.update.category, o.update.category);
  assert(p.update.summary.length > 20 && p.update.summary.length <= 200, 'resumo: ' + p.update.summary.length);
  assert(p.notes.length > 100 && p.notes.length <= 4000, 'notas: ' + p.notes.length);
  assert(/Lista de alunos/.test(p.update.summary) && /Mostrar excluídos/.test(p.update.summary) && /Excluir da lista/.test(p.update.summary));
  for (const frase of [/Mostrar excluídos/, /Voltar para a lista/, /Voltar todos para a lista/, /Nenhum aluno na lista/, /Excluir da lista continua só escondendo/,
    /nenhum cadastro nem conta de aluno é alterado no Firebase/, /A confirmação do Excluir passa a avisar/, /Alunos para aprovar não mudou e não mostra excluídos/, /1\.12\.284/,
    /Descanso, cronômetros, alarmes e notificações não foram alterados\./]) assert(frase.test(p.notes), 'as notas deveriam dizer: ' + frase);
});
t('Só professor.html mudou: index, avaliações e cadastro idênticos, histórico modular igual', () => {
  for (const k of ['index.html', 'avaliacoes.html', 'cadastro.html']) assert.equal(p.files[k], o.files[k], k);
  assert.notEqual(page, baseTeacher);
  assert.deepEqual(Object.keys(p.files), Object.keys(o.files));
  assert.deepEqual(p.modularUpdates, o.modularUpdates);
  assert.deepEqual(Object.keys(G.edits), ['professor.html']);
});
t('Prova de reversão: desfeitas as edições, professor.html volta byte a byte ao do 1.12.284', () => {
  let undone = page;
  for (const edit of G.TEACHER_EDITS.slice().reverse()) undone = G.undoEdit(undone, edit);
  assert.equal(undone, baseTeacher);
});
t('Cada edição existe uma vez no 1.12.284 (ou o número de vezes declarado) e o total é o esperado', () => {
  for (const edit of G.TEACHER_EDITS) {
    const inBase = edit.scope ? count(block(baseTeacher, edit.scope), edit.previous) : count(baseTeacher, edit.previous);
    assert.equal(inBase, edit.times || 1, edit.name + ' (base)');
  }
  assert.equal(G.TEACHER_EDITS.length, 7);
  assert.equal(G.STYLE_EDITS.length, 1);
  assert.equal(G.SCRIPT_EDITS.length, 6);
});
t('O gerador recusa aplicar duas vezes, recusa outra base e é determinístico', () => {
  assert.throws(() => G.makeUpdate(p));
  assert.throws(() => G.makeUpdate({...o, version: '1.12.283'}));
  assert.throws(() => G.makeUpdate({...o, sequence: 389}));
  assert.throws(() => G.applyAll(page, G.TEACHER_EDITS));
  assert.equal(JSON.stringify(G.makeUpdate(o)), JSON.stringify(p));
});
t('A linha de comando grava exatamente o JSON do pacote e não sobrescreve arquivo existente; tamanho abaixo de 24 MiB', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-lista-excluidos-'));
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

// ---------- 2) o que entra no código, sem rodar ----------
t('Estilo: o bloco dos excluídos entra uma vez, só dentro da janela de cadastro, e o resto do estilo segue igual', () => {
  assert.equal(count(page, G.CSS_NEXT), 1);
  assert.equal(count(baseTeacher, G.CSS_ANCHOR), 1);
  const added = G.CSS_NEXT.slice(G.CSS_ANCHOR.length);
  assert(/^(#registrationLinkDialog \.registration-hidden[^{}]*\{[^{}]*\})+$/.test(added), 'só regras do bloco novo: ' + added);
  assert(!/(url\(|@import|expression|javascript:|<)/i.test(added));
});
t('Ids e atributos: nenhum id novo, e cada botão novo é ligado uma vez, ao seu clique', () => {
  const src = moduleSource(page), base = moduleSource(baseTeacher);
  const staticIds = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  assert.deepEqual([...staticIds].sort(), [...new Set([...baseTeacher.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]))].sort(), 'o conjunto de ids da página não pode mudar');
  const dynamic = new Set(['registrationContactsList', 'registrationRefresh', 'registrationSignOut', 'registrationTeacherLogin', 'registrationRemovalPrompt']);
  const used = new Set([...src.matchAll(/\bc\((["'])([A-Za-z][A-Za-z0-9_-]*)\1\)/g)].map(m => m[2]));
  for (const m of src.matchAll(/getElementById\((["'])([A-Za-z][A-Za-z0-9_-]*)\1\)/g)) used.add(m[2]);
  for (const id of used) assert(staticIds.has(id) || dynamic.has(id), 'id citado e inexistente: ' + id);
  const baseUsed = new Set([...base.matchAll(/\bc\((["'])([A-Za-z][A-Za-z0-9_-]*)\1\)/g)].map(m => m[2]));
  assert.deepEqual([...used].sort(), [...baseUsed].sort(), 'o módulo não passa a usar nenhum id novo');
  for (const attr of ['data-registration-hidden-toggle', 'data-registration-restore', 'data-registration-restore-all']) {
    assert.equal(count(src, "list.querySelectorAll('[" + attr + "]')"), 1, attr + ' ligado uma vez');
    assert.equal(count(base, attr), 0, attr + ' não existia');
  }
  assert.deepEqual([...src.matchAll(/window\.([A-Za-z]+)\s*=/g)].map(m => m[1]).sort(), [...base.matchAll(/window\.([A-Za-z]+)\s*=/g)].map(m => m[1]).sort(), 'nenhuma função nova é exportada em window');
});

t('O código novo só usa chamadas que o módulo já usava (o teste oficial do Android roda com um DOM mínimo, sem insertAdjacentHTML e afins)', () => {
  const added = G.TEACHER_EDITS.filter(e => e.scope).map(e => e.next.replace(e.previous, '')).join('\n');
  const base = moduleSource(baseTeacher);
  const methods = text => new Set([...text.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, '""').matchAll(/\.([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]));
  const novos = [...methods(added)].filter(name => !methods(base).has(name));
  assert.deepEqual(novos, [], 'chamadas que o módulo não usava antes: ' + novos.join(', '));
  assert(!/insertAdjacentHTML|createRange|DOMParser|outerHTML|document\.write/.test(added));
});

// ---------- 3) o módulo real de cadastro em vm, com DOM estrito e botões ligados de verdade ----------
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
// marcas guardadas na agenda: Hugo está excluído; mais uma de outro professor e uma de cadastro que o Firebase não devolve
const EXTRAS = {'OUTRO:u_x': true, [TEACHER + ':u_ghost']: true};
const hideMap = uids => ({...Object.fromEntries(uids.map(uid => [TEACHER + ':' + uid, true])), ...EXTRAS});
const HIDDEN_DEFAULT = hideMap(['u_hugo']);
const HIDE_ALL = hideMap(['u_ana', 'u_elisa', 'u_carla', 'u_diego', 'u_hugo']);
const attrProp = attr => attr.replace(/^data-/, '').replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());

function makeEnv(source, hiddenMap = HIDDEN_DEFAULT) {
  const elements = new Map(), created = [], focused = [], sync = [], flags = {failStorage: false};
  const make = (id, extra = {}) => {
    const attrs = {};
    return {id, value: '', dataset: {}, innerHTML: '', textContent: '', hidden: false, disabled: false, open: false, style: {}, attrs, focusCount: 0, classList: {contains: () => true, add() {}, remove() {}, toggle() {}},
      setAttribute(k, v) { attrs[k] = String(v); }, getAttribute: k => (k in attrs ? attrs[k] : null), removeAttribute(k) { delete attrs[k]; }, toggleAttribute() {},
      querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, append() {}, appendChild() {}, remove() {}, scrollIntoView() {}, focus() { this.focusCount++; }, select() {}, closest: () => null, ...extra};
  };
  // a lista: os elementos que o código procura (botões, cartões) nascem do HTML que ele mesmo escreveu
  let cache = {html: null, cards: []};
  const rebuild = list => {
    if (cache.html === list.innerHTML) return cache;
    const html = list.innerHTML;
    const cards = [...html.matchAll(/<article\b[^>]*\sdata-registration-uid="([^"]*)"[^>]*>[\s\S]*?<\/article>/g)].map(m => ({
      start: m.index, end: m.index + m[0].length, uid: m[1], el: make('cartao', {dataset: {registrationUid: m[1]}, isConnected: true})
    }));
    cache = {html, cards};
    return cache;
  };
  const fakesFor = (list, selector) => {
    const m = /^\[(data-[a-z-]+)\]$/.exec(selector);
    if (!m) return [];
    const attr = m[1], prop = attrProp(attr), current = rebuild(list);
    if (attr === 'data-registration-uid') return current.cards.map(c => c.el);
    const out = [];
    for (const hit of current.html.matchAll(new RegExp('<[a-z]+\\b[^>]*?\\s' + attr + '(?=[\\s=>/])(?:="([^"]*)")?[^>]*>', 'g'))) {
      const owner = current.cards.find(c => hit.index >= c.start && hit.index < c.end);
      out.push(make(attr, {dataset: {[prop]: hit[1] === undefined ? '' : hit[1]}, isConnected: true, onclick: null, closest: sel => (sel === '[data-registration-uid]' && owner ? owner.el : null), focus() { focused.push(attr); }}));
    }
    return out;
  };
  const last = {};
  const getElementById = id => {
    if (!STATIC_IDS.has(id) && !DYNAMIC_IDS.has(id)) return null; // como no navegador: id que não existe devolve null
    if (!elements.has(id)) {
      if (id === 'registrationContactsList') {
        const list = make(id, {querySelectorAll(selector) { return (last[selector] = fakesFor(list, selector)); }, querySelector(selector) { return fakesFor(list, selector)[0] || null; }});
        elements.set(id, list);
      } else elements.set(id, make(id));
    }
    return elements.get(id);
  };
  const state = {students: [{id: 'stu_elisa', name: 'Elisa Na Agenda Sem Aprovar', firebaseUid: 'u_elisa'}, {id: 'stu_diego', name: 'Diego Na Agenda', firebaseUid: 'u_diego'}, {id: 'stu_livre', name: 'Gil Sem Conta'}], history: [], registrationContactsHidden: {...hiddenMap}};
  const writes = [], dialogs = [];
  const ctx = {
    console, URL, structuredClone, setTimeout, clearTimeout, queueMicrotask, state, DB_KEY: 'agendaPersonalTL_v1',
    document: {getElementById, execCommand: () => true, createElement: () => { const e = make('criado'); created.push(e); return e; }, addEventListener() {}},
    navigator: {clipboard: {writeText: async () => {}}}, location: {href: 'https://exemplo.github.io/agenda/professor.html'},
    localStorage: {setItem: (k, v) => { if (flags.failStorage) throw new Error('armazenamento cheio (simulado)'); writes.push([k, JSON.parse(v)]); }, getItem: () => null},
    APTeacherSync: {changed: () => { sync.push(1); }},
    id: () => 'novo-' + writes.length, iso: d => d.toISOString().slice(0, 10), fmtDate: x => String(x), renderAll() {}, syncNativeAlarms() {},
    openDialog: d => dialogs.push(d), openEditStudent() {}, window: {}
  };
  ctx.window = ctx;
  const hooks = '\nwindow.__t={approve:O,setContacts:r=>i=r,setSdk:v=>o=v,setTab:v=>n=v,renderList:T,refresh:U,tab:D,openApprovals:openStudentApprovals,openList:openStudentList,mode:()=>registrationListMode,shown:()=>[...approvalsShown],restore:typeof restoreRegistrations==="function"?restoreRegistrations:null,hiddenOpen:()=>typeof registrationHiddenOpen==="undefined"?null:registrationHiddenOpen,requestRemoval:requestRegistrationRemoval};\n})();';
  const instrumented = source.replace(/\}\)\(\);\s*$/, hooks);
  assert.notEqual(instrumented, source, 'instrumentação não aplicada');
  vm.runInNewContext(instrumented, ctx);
  const click = (selector, index = 0) => {
    const found = last[selector] && last[selector][index];
    assert(found && typeof found.onclick === 'function', 'sem botão ' + selector + ' [' + index + '] na tela');
    return found.onclick();
  };
  return {ctx, state, elements, writes, dialogs, created, focused, sync, flags, click, el: getElementById, hook: ctx.__t, api: ctx.agendaRegistration};
}
const html = env => env.el('registrationContactsList').innerHTML;
const listOf = env => [...html(env).matchAll(/<article class="registration-contact" data-registration-uid="([^"]*)">[\s\S]*?<strong>([^<]*)<\/strong><span class="registration-contact-status">([^<]*)<\/span>/g)].map(m => ({uid: m[1], nome: m[2], status: m[3]}));
const HIDDEN_CARD = /<article class="registration-contact registration-contact-hidden"><strong>([^<]*)<\/strong><span class="registration-contact-status">([^<]*)<\/span><p>([\s\S]*?)<\/p><button class="btn" type="button" data-registration-restore="([^"]*)" aria-label="([^"]*)">Voltar para a lista<\/button><\/article>/g;
const hiddenOf = env => [...html(env).matchAll(HIDDEN_CARD)].map(m => ({nome: m[1], status: m[2], contatos: m[3], uid: m[4], rotulo: m[5]}));
const sectionOf = env => (html(env).match(/<section class="registration-hidden" aria-label="Excluídos da lista">[\s\S]*<\/section>/) || [''])[0];
const toggleOf = env => (html(env).match(/<button class="btn" type="button" data-registration-hidden-toggle aria-expanded="(true|false)">([^<]*)<\/button>/) || null);
const toggleState = (env, quando) => { const m = toggleOf(env); assert(m, quando + ': o botão do bloco dos excluídos não está na tela'); return m.slice(1); };
const removeButtons = env => count(html(env), 'data-registration-remove aria-label="Excluir ');
const statusOf = env => env.el('registrationStatus');
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
async function openWith(source, mode, records = everyone, writes = [], hiddenMap = HIDDEN_DEFAULT) {
  const env = makeEnv(source, hiddenMap);
  env.hook.setSdk(fakeSdk(records, writes));
  if (mode === 'students') env.hook.openList(); else env.hook.openApprovals();
  await env.hook.refresh();
  return env;
}
const NAMES_APPROVALS = ['Ana Pendente', 'Elisa Na Agenda Sem Aprovar', 'Carla Aprovada'];
const NAMES_ROSTER = ['Ana Pendente', 'Elisa Na Agenda Sem Aprovar', 'Carla Aprovada', 'Diego Na Agenda'];
const NAMES_ROSTER_ALL = ['Ana Pendente', 'Elisa Na Agenda Sem Aprovar', 'Hugo Escondido', 'Carla Aprovada', 'Diego Na Agenda'];

// ---- regras do 1.12.284 (a Lista de alunos e Alunos para aprovar) que seguem valendo no 1.12.285 ----
async function behaviors284(source) {
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

// ---- o que é novo no 1.12.285 ----
async function behaviors285(source) {
  // A) Alunos para aprovar nunca mostra o bloco, nem com cadastros excluídos, nem com todos excluídos
  const A = await openWith(source, 'approvals');
  for (const trecho of ['registration-hidden', 'data-registration-hidden-toggle', 'data-registration-restore', 'Voltar para a lista', 'Mostrar excluídos']) assert(!html(A).includes(trecho), 'aprovar: não mostra ' + trecho);
  const A2 = await openWith(source, 'approvals', everyone, [], HIDE_ALL);
  assert(/Nenhum aluno aguardando aprovação\./.test(html(A2)) && !html(A2).includes('registration-hidden') && !html(A2).includes('Voltar'), 'aprovar: com todos excluídos só diz que ninguém aguarda');
  A2.hook.restore && A2.hook.restore(['u_ana']);
  assert.equal(A2.writes.length, 0, 'aprovar: devolver não funciona fora da Lista de alunos');
  assert.deepEqual(A2.state.registrationContactsHidden, HIDE_ALL);

  // B) Lista de alunos com um excluído: bloco fechado, no fim da lista; abrir mostra a relação; fechar esconde
  const cloudB = [];
  const B = await openWith(source, 'students', everyone, cloudB);
  assert.deepEqual(listOf(B).map(x => x.nome), NAMES_ROSTER, 'lista: os cartões não mudam');
  assert(sectionOf(B), 'lista: o bloco dos excluídos existe');
  assert.deepEqual(toggleState(B, 'lista com um excluído'), ['false', 'Mostrar excluídos (1)'], 'lista com um excluído: botão fechado');
  assert.equal(hiddenOf(B).length, 0, 'fechado: sem a relação');
  assert(!html(B).includes('data-registration-restore'), 'fechado: sem botões de voltar');
  assert(html(B).indexOf('registration-hidden') > html(B).lastIndexOf('data-registration-uid'), 'o bloco fica depois dos cartões');
  assert.equal(B.hook.hiddenOpen(), false);
  B.click('[data-registration-hidden-toggle]');
  assert.equal(B.hook.hiddenOpen(), true);
  assert.deepEqual(toggleState(B, 'bloco aberto'), ['true', 'Ocultar excluídos'], 'bloco aberto: botão Ocultar excluídos');
  assert.deepEqual(hiddenOf(B).map(x => [x.nome, x.status, x.uid, x.rotulo]), [['Hugo Escondido', 'Aguardando aprovação', 'u_hugo', 'Voltar Hugo Escondido para a lista']], 'relação aberta: nome, situação, código e rótulo do botão');
  assert(/^hugo@exemplo\.com<br>\(69\) 99999-1004<br>2000-05-12$/.test(hiddenOf(B)[0].contatos), 'contatos: ' + hiddenOf(B)[0].contatos);
  assert(/<p class="registration-help">1 cadastro excluído da lista\. Nada foi apagado: a conta e os dados do aluno continuam guardados\.<\/p>/.test(html(B)), 'texto do bloco');
  assert(!html(B).includes('data-registration-restore-all'), 'com um só excluído não há Voltar todos');
  assert(!/data-registration-(approve|remove|edit)/.test(sectionOf(B)) && !/<select/.test(sectionOf(B)), 'o cartão do excluído não aprova, não exclui e não escolhe tipo');
  assert(B.focused.includes('data-registration-hidden-toggle'), 'o foco fica no botão do bloco');
  assert.deepEqual(listOf(B).map(x => x.nome), NAMES_ROSTER, 'bloco aberto: os cartões não mudam');
  B.click('[data-registration-hidden-toggle]');
  assert.equal(B.hook.hiddenOpen(), false);
  assert.equal(hiddenOf(B).length, 0, 'fechado de novo');
  B.click('[data-registration-hidden-toggle]');
  assert.equal(hiddenOf(B).length, 1);
  // devolver o único excluído: grava só a agenda, tira só a marca dele, avisa a sincronização, nada no Firebase
  const before = {writes: B.writes.length, sync: B.sync.length};
  B.click('[data-registration-restore]');
  assert.equal(B.writes.length, before.writes + 1, 'uma gravação local');
  const [key, saved] = B.writes[B.writes.length - 1];
  assert.equal(key, 'agendaPersonalTL_v1');
  assert.deepEqual(saved.registrationContactsHidden, EXTRAS, 'só a marca de Hugo saiu; as outras ficam');
  assert.deepEqual(B.state.registrationContactsHidden, EXTRAS, 'a agenda em memória acompanha o que foi gravado');
  assert.deepEqual(saved.students, B.state.students, 'o resto da agenda é gravado como estava');
  assert.equal(B.sync.length, before.sync + 1, 'um aviso de sincronização');
  assert.deepEqual(listOf(B).map(x => x.nome), NAMES_ROSTER_ALL, 'Hugo volta à lista, entre os que aguardam');
  assert(!html(B).includes('registration-hidden'), 'sem excluídos o bloco some');
  assert.equal(statusOf(B).textContent, 'Cadastro devolvido à lista.');
  assert.equal(statusOf(B).dataset.error, 'false');
  assert(B.el('registrationRefresh').focusCount >= 1, 'o foco vai para Atualizar lista');
  assert.equal(cloudB.length, 0, 'nada gravado no Firebase');

  // C) vários excluídos: ordem por nome, situação de cada um, Voltar todos, e o bloco continua aberto enquanto sobrar excluído
  const cloudC = [];
  const C = await openWith(source, 'students', everyone, cloudC, hideMap(['u_ana', 'u_carla', 'u_hugo']));
  assert.deepEqual(listOf(C).map(x => x.nome), ['Elisa Na Agenda Sem Aprovar', 'Diego Na Agenda'], 'três excluídos: só dois cartões na lista');
  assert.deepEqual(toggleState(C, 'três excluídos'), ['false', 'Mostrar excluídos (3)'], 'três excluídos: botão com a quantidade');
  C.click('[data-registration-hidden-toggle]');
  assert.deepEqual(hiddenOf(C).map(x => x.nome + '/' + x.status), ['Ana Pendente/Aguardando aprovação', 'Carla Aprovada/Aprovado · adicionar à agenda', 'Hugo Escondido/Aguardando aprovação'], 'três excluídos: em ordem de nome, cada um com a sua situação');
  assert(/3 cadastros excluídos da lista\./.test(html(C)));
  assert.equal(count(html(C), 'data-registration-restore-all>Voltar todos para a lista</button>'), 1, 'com vários excluídos há um Voltar todos');
  assert.equal(count(html(C), 'data-registration-restore="'), 3, 'um Voltar para a lista por excluído');
  C.click('[data-registration-restore]', 1); // Carla
  assert.deepEqual(hiddenOf(C).map(x => x.nome), ['Ana Pendente', 'Hugo Escondido'], 'Carla saiu da relação, os outros dois ficam');
  assert.equal(C.hook.hiddenOpen(), true, 'sobraram excluídos: o bloco continua aberto');
  assert.deepEqual(listOf(C).map(x => x.nome + '/' + x.status), ['Elisa Na Agenda Sem Aprovar/Na agenda', 'Carla Aprovada/Aprovado · adicionar à agenda', 'Diego Na Agenda/Na agenda'], 'Carla volta à lista como aprovada e fora da agenda');
  assert.deepEqual(C.state.registrationContactsHidden, hideMap(['u_ana', 'u_hugo']), 'só a marca de Carla saiu');
  assert.equal(statusOf(C).textContent, 'Cadastro devolvido à lista.');
  const syncC = C.sync.length;
  C.click('[data-registration-restore-all]');
  assert.equal(statusOf(C).textContent, '2 cadastros devolvidos à lista.');
  assert.equal(statusOf(C).dataset.error, 'false');
  assert.deepEqual(C.state.registrationContactsHidden, EXTRAS);
  assert.deepEqual(C.writes[C.writes.length - 1][1].registrationContactsHidden, EXTRAS);
  assert.equal(C.sync.length, syncC + 1, 'Voltar todos: um aviso de sincronização só');
  assert.deepEqual(listOf(C).map(x => x.nome), NAMES_ROSTER_ALL);
  assert(!html(C).includes('registration-hidden'));
  assert.equal(C.hook.hiddenOpen(), false);
  assert.equal(cloudC.length, 0, 'nada gravado no Firebase');

  // D) todos excluídos (o que o celular do Tiago mostrava): o bloco já vem aberto, sem botão de abrir
  const D1 = await openWith(source, 'students', everyone, [], HIDE_ALL);
  assert.equal(listOf(D1).length, 0);
  assert(/Nenhum aluno na lista\./.test(html(D1)), 'a mensagem de lista vazia continua');
  assert(sectionOf(D1) && !toggleOf(D1), 'sem aluno na lista não há botão de abrir');
  assert.deepEqual(hiddenOf(D1).map(x => x.nome + '/' + x.status), ['Ana Pendente/Aguardando aprovação', 'Carla Aprovada/Aprovado · adicionar à agenda', 'Diego Na Agenda/Na agenda', 'Elisa Na Agenda Sem Aprovar/Na agenda', 'Hugo Escondido/Aguardando aprovação'], 'todos excluídos: os cinco, em ordem de nome, cada um com a sua situação');
  assert(/5 cadastros excluídos da lista\./.test(html(D1)) && html(D1).includes('data-registration-restore-all'));
  assert.equal(count(html(D1), 'data-registration-restore="'), 5);
  assert.equal(removeButtons(D1), 0);
  assert(html(D1).indexOf('Nenhum aluno na lista.') < html(D1).indexOf('registration-hidden'), 'a mensagem vem antes do bloco');
  D1.click('[data-registration-restore-all]');
  assert.deepEqual(listOf(D1).map(x => x.nome), NAMES_ROSTER_ALL, 'Voltar todos devolve os cinco');
  assert(!/Nenhum aluno na lista/.test(html(D1)) && !html(D1).includes('registration-hidden'));
  assert.equal(statusOf(D1).textContent, '5 cadastros devolvidos à lista.');
  // um único cadastro, excluído
  const one = () => [{...people.ana}];
  const D2 = await openWith(source, 'students', one, [], hideMap(['u_ana']));
  assert(/Nenhum aluno na lista\./.test(html(D2)) && !toggleOf(D2));
  assert(/1 cadastro excluído da lista\./.test(html(D2)) && !html(D2).includes('data-registration-restore-all'));
  D2.click('[data-registration-restore]');
  assert.deepEqual(listOf(D2).map(x => x.nome), ['Ana Pendente']);
  assert.equal(statusOf(D2).textContent, 'Cadastro devolvido à lista.');
  assert(!html(D2).includes('registration-hidden'));

  // E) pedidos que não devem fazer nada
  const E = await openWith(source, 'students');
  const snapshotE = JSON.stringify(E.state.registrationContactsHidden), htmlE = html(E);
  for (const arg of [['u_ana'], ['../x', '', 'a b', 5, null, {}], 'u_hugo', [], undefined, null]) E.hook.restore(arg);
  assert.equal(E.writes.length, 0, 'nada a devolver: nenhuma gravação');
  assert.equal(E.sync.length, 0, 'nada a devolver: nenhum aviso');
  assert.equal(JSON.stringify(E.state.registrationContactsHidden), snapshotE);
  assert.equal(html(E), htmlE);
  assert.equal(statusOf(E).textContent, '');
  const E2 = await openWith(source, 'approvals');
  E2.hook.restore(['u_hugo']);
  assert.equal(E2.writes.length + E2.sync.length, 0, 'fora da Lista de alunos não devolve');
  assert.deepEqual(E2.state.registrationContactsHidden, HIDDEN_DEFAULT);
  const E3 = await openWith(source, 'students');
  E3.hook.setSdk({...fakeSdk(everyone), auth: {currentUser: {uid: 'OUTRO'}}});
  E3.hook.restore(['u_hugo']);
  assert.equal(E3.writes.length + E3.sync.length, 0, 'sem a conta do professor não devolve');
  assert.deepEqual(E3.state.registrationContactsHidden, HIDDEN_DEFAULT);
  const E4 = await openWith(source, 'students');
  E4.hook.setTab('link');
  E4.hook.restore(['u_hugo']);
  assert.equal(E4.writes.length + E4.sync.length, 0, 'fora da aba da lista não devolve');
  assert.deepEqual(E4.state.registrationContactsHidden, HIDDEN_DEFAULT);

  // F) não conseguir salvar: nada muda, a tela avisa, e depois funciona
  const F = await openWith(source, 'students');
  F.click('[data-registration-hidden-toggle]');
  F.flags.failStorage = true;
  F.click('[data-registration-restore]');
  assert.deepEqual(F.state.registrationContactsHidden, HIDDEN_DEFAULT, 'sem salvar, a agenda não muda');
  assert.equal(F.sync.length, 0, 'sem salvar, nenhum aviso de sincronização');
  assert(/Não foi possível salvar\. Os cadastros continuam excluídos da lista\./.test(statusOf(F).textContent), statusOf(F).textContent);
  assert.equal(statusOf(F).dataset.error, 'true');
  assert.deepEqual(hiddenOf(F).map(x => x.nome), ['Hugo Escondido'], 'o excluído continua na tela');
  assert.deepEqual(listOf(F).map(x => x.nome), NAMES_ROSTER);
  F.flags.failStorage = false;
  F.click('[data-registration-restore]');
  assert.deepEqual(F.state.registrationContactsHidden, EXTRAS, 'com o armazenamento de volta, a marca sai');
  assert.equal(F.sync.length, 1);
  assert.equal(statusOf(F).dataset.error, 'false');

  // G) nome, e-mail, telefone e gênero com HTML não viram HTML
  const xss = {uid: 'u_xss', nome: '<img src=x onerror=alert(1)>', email: 'a"b@x.com', whatsapp: '<b>1</b>', genero: '&', nascimento: '2001-01-01', perfil: 'aluno', professorId: TEACHER, ativo: false};
  const X = await openWith(source, 'students', () => [xss], [], hideMap(['u_xss']));
  const h = html(X);
  assert(!h.includes('<img src=x') && !h.includes('<b>1</b>') && !h.includes('a"b@x.com'), 'sem HTML solto: ' + h);
  assert(h.includes('<strong>&lt;img src=x onerror=alert(1)&gt;</strong>') && h.includes('a&quot;b@x.com') && h.includes('&lt;b&gt;1&lt;/b&gt;') && h.includes(' · &amp;'));
  assert(h.includes('aria-label="Voltar &lt;img src=x onerror=alert(1)&gt; para a lista"'));
  assert.equal(count(h, 'data-registration-restore="u_xss"'), 1);

  // H) o bloco aberto: quem fecha e quem não fecha
  const H = await openWith(source, 'students');
  H.click('[data-registration-hidden-toggle]');
  H.hook.tab('contacts'); // Tentar novamente
  assert.equal(H.hook.hiddenOpen(), true, 'Tentar novamente não fecha o bloco');
  await H.hook.refresh();
  assert.equal(H.hook.hiddenOpen(), true, 'Atualizar lista não fecha o bloco');
  assert.equal(hiddenOf(H).length, 1);
  H.hook.openList();
  assert.equal(H.hook.hiddenOpen(), false, 'abrir a lista de novo fecha o bloco');
  await H.hook.refresh();
  assert.deepEqual(toggleState(H, 'lista aberta de novo'), ['false', 'Mostrar excluídos (1)'], 'lista aberta de novo: bloco fechado');
  H.click('[data-registration-hidden-toggle]');
  H.hook.openApprovals();
  assert.equal(H.hook.hiddenOpen(), false, 'abrir Alunos para aprovar fecha o bloco');
  H.hook.openList();
  assert.equal(H.hook.hiddenOpen(), false);
  await H.hook.refresh();
  H.click('[data-registration-hidden-toggle]');
  H.hook.tab('group');
  assert.equal(H.hook.hiddenOpen(), false, 'sair da lista fecha o bloco');
  H.hook.openList();
  await H.hook.refresh();
  assert.deepEqual(toggleState(H, 'lista aberta de novo'), ['false', 'Mostrar excluídos (1)'], 'lista aberta de novo: bloco fechado');

  // I) excluir de novo pelo fluxo real: a confirmação avisa que dá para voltar, e o bloco nasce fechado
  const I = await openWith(source, 'students', everyone, [], hideMap(['u_hugo', 'u_ana']));
  I.click('[data-registration-hidden-toggle]');
  I.click('[data-registration-restore]', 0); // Ana
  I.click('[data-registration-restore]', 0); // Hugo, o último
  assert.deepEqual(I.state.registrationContactsHidden, EXTRAS);
  assert.equal(I.hook.hiddenOpen(), false, 'sem excluídos, o bloco fica fechado para a próxima vez');
  const index = listOf(I).map(x => x.nome).indexOf('Diego Na Agenda');
  assert(index >= 0);
  const from = I.created.length, syncI = I.sync.length, writesI = I.writes.length;
  I.click('[data-registration-remove]', index);
  const [, prompt, help, , , confirm] = I.created.slice(from);
  assert.equal(prompt.textContent, 'Excluir Diego Na Agenda desta lista?');
  assert.equal(help.textContent, 'A conta e os dados do aluno serão mantidos. Você poderá voltar este cadastro para a lista depois.');
  confirm.onclick();
  assert.equal(I.state.registrationContactsHidden[TEACHER + ':u_diego'], true);
  assert.equal(I.writes.length, writesI + 1);
  assert.equal(I.sync.length, syncI + 1);
  assert.equal(statusOf(I).textContent, 'Contato excluído da lista.');
  assert(!listOf(I).some(x => x.nome === 'Diego Na Agenda'));
  assert.deepEqual(toggleState(I, 'depois de excluir'), ['false', 'Mostrar excluídos (1)'], 'depois de excluir o bloco nasce fechado');
  I.click('[data-registration-hidden-toggle]');
  assert.deepEqual(hiddenOf(I).map(x => x.nome + '/' + x.status), ['Diego Na Agenda/Na agenda'], 'Diego, excluído de novo, aparece na relação');
}

t('Módulo real, regras do 1.12.284: cada modo mostra o que deve, a janela troca de modo, o sininho cai em aprovar e a aprovação grava o mesmo', async () => {
  await behaviors284(moduleSource(page));
});
t('Módulo real, o que é novo: bloco dos excluídos (fechado, aberto, aberto sozinho), Voltar para a lista (um e todos), falha ao salvar, nomes com HTML, estado do bloco e a confirmação do Excluir', async () => {
  await behaviors285(moduleSource(page));
});
t('O teste pega o erro: bloco no lugar errado, devolução que apaga demais, não grava, não avisa, grava no Firebase, escape, ordem, abrir/fechar e a confirmação sabotados', async () => {
  const real = moduleSource(page);
  const RESTORE_GUARD = "if(!C()||n!=='contacts'||registrationListMode!=='students')return;";
  const SAVE_TRY = "try{localStorage.setItem(DB_KEY,JSON.stringify({...state,registrationContactsHidden:hidden}))}\n catch(problem){l('Não foi possível salvar. Os cadastros";
  const mutants = {
    'o bloco aparece também em Alunos para aprovar': ["if(registrationListMode!=='students')return '';", ''],
    'o bloco nunca aparece': ["if(!hidden.length)return '';", "return '';"],
    'o bloco lista quem não está excluído': ['const hidden=i.filter(registrationContactHidden).sort(', 'const hidden=i.slice().sort('],
    'a relação dos excluídos fica fora de ordem': ["const hidden=i.filter(registrationContactHidden).sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));", 'const hidden=i.filter(registrationContactHidden);'],
    'sem alunos na lista o bloco não abre sozinho': ['open=registrationHiddenOpen||!visibleCount;', 'open=registrationHiddenOpen;'],
    'o bloco está sempre aberto': ['open=registrationHiddenOpen||!visibleCount;', 'open=true;'],
    'o botão de abrir some mesmo com alunos na lista': ['if(visibleCount)html+=', 'if(false)html+='],
    'o botão de abrir aparece mesmo sem alunos na lista': ['if(visibleCount)html+=', 'if(true)html+='],
    'Voltar todos aparece com um só excluído': ['if(total>1)html+=', 'if(total>0)html+='],
    'Voltar todos nunca aparece': ['if(total>1)html+=', 'if(false)html+='],
    'a contagem do texto não distingue um de vários': ["(total===1?'1 cadastro excluído da lista.':total+' cadastros excluídos da lista.')", "(total+' cadastros excluídos da lista.')"],
    'o texto não garante que nada foi apagado': ['Nada foi apagado: a conta e os dados do aluno continuam guardados.', 'Eles foram removidos.'],
    'situação do excluído sempre aguardando': ["const student=state.students.find(item=>item.firebaseUid===record.uid),status=student?'Na agenda':record.ativo===true?'Aprovado · adicionar à agenda':'Aguardando aprovação';", "const student=null,status='Aguardando aprovação';"],
    'o nome do excluído entra sem escape': ['registration-contact-hidden"><strong>\'+d(record.nome)+\'</strong>', 'registration-contact-hidden"><strong>\'+record.nome+\'</strong>'],
    'o e-mail do excluído entra sem escape': ["</span><p>'+d(record.email)+'<br>'+d(record.whatsapp)+(record.nascimento?'<br>'+d(fmtDate(record.nascimento)):'')+(record.genero?' · '+d(record.genero):'')+'</p><button class=\"btn\" type=\"button\" data-registration-restore", "</span><p>'+record.email+'<br>'+d(record.whatsapp)+(record.nascimento?'<br>'+d(fmtDate(record.nascimento)):'')+(record.genero?' · '+d(record.genero):'')+'</p><button class=\"btn\" type=\"button\" data-registration-restore"],
    'o rótulo do botão não leva o nome': ['aria-label="Voltar \'+d(record.nome)+\' para a lista"', 'aria-label="Voltar para a lista"'],
    'o bloco fica antes dos cartões': ['list.innerHTML=rosterHtml+hiddenRegistrationsHtml(visible.length);', 'list.innerHTML=hiddenRegistrationsHtml(visible.length)+rosterHtml;'],
    'o bloco não é desenhado': ['list.innerHTML=rosterHtml+hiddenRegistrationsHtml(visible.length);', 'list.innerHTML=rosterHtml;'],
    'Voltar apaga todas as marcas, não só a escolhida': ['for(const key of keys)if(hidden[key]===true){delete hidden[key];restored++}', 'for(const key of Object.keys(hidden)){delete hidden[key];restored++}'],
    'Voltar grava false em vez de tirar a marca': ['{delete hidden[key];restored++}', '{hidden[key]=false;restored++}'],
    'Voltar não guarda na agenda do celular': [SAVE_TRY, "try{}\n catch(problem){l('Não foi possível salvar. Os cadastros"],
    'Voltar guarda mas não atualiza a agenda em memória': [' state.registrationContactsHidden=hidden;\n registrationHiddenOpen=i.some(', ' registrationHiddenOpen=i.some('],
    'Voltar não redesenha a lista': ['T();l(restored===1?', 'l(restored===1?'],
    'Voltar não avisa a sincronização': ["try{window.APTeacherSync?.changed()}catch(problem){console.warn('Cadastros devolvidos à lista; sincronização pendente.',problem)}", ''],
    'Voltar também grava no cadastro do aluno no Firebase': [' if(!restored)return;\n', " if(!restored)return;\n o.updateDoc(o.doc(o.db,'usuarios',uids[0]),'ativo',false);\n"],
    'falha ao salvar não interrompe a devolução': ["continuam excluídos da lista. Confira o armazenamento e tente novamente.',true);return}", "continuam excluídos da lista. Confira o armazenamento e tente novamente.',true)}"],
    'Voltar funciona sem a conta do professor, fora da aba ou fora da lista': [RESTORE_GUARD, 'if(false)return;'],
    'Voltar funciona também em Alunos para aprovar': ["||registrationListMode!=='students')return;", ')return;'],
    'um clique em Voltar devolve todos': ['button.onclick=()=>restoreRegistrations([button.dataset.registrationRestore])', 'button.onclick=()=>restoreRegistrations(i.filter(registrationContactHidden).map(record=>record.uid))'],
    'Voltar todos devolve só quem já está na lista': ['restoreRegistrations(i.filter(registrationContactHidden).map(record=>record.uid))', 'restoreRegistrations(i.filter(record=>!registrationContactHidden(record)).map(record=>record.uid))'],
    'abrir e fechar o bloco não redesenha': ['registrationHiddenOpen=!registrationHiddenOpen;T();', 'registrationHiddenOpen=!registrationHiddenOpen;'],
    'abrir a lista de novo não fecha o bloco': ['if (n !== "contacts" || mode === "approvals" || mode === "students") registrationHiddenOpen = false;', ''],
    'Tentar novamente fecha o bloco': ['if (n !== "contacts" || mode === "approvals" || mode === "students") registrationHiddenOpen = false;', 'registrationHiddenOpen = false;'],
    'depois de devolver o bloco fica aberto para sempre': ['registrationHiddenOpen=i.some(registrationContactHidden);', 'registrationHiddenOpen=true;'],
    'a confirmação do Excluir não avisa que dá para voltar': [' Você poderá voltar este cadastro para a lista depois.', '']
  };
  for (const [name, [from, to]] of Object.entries(mutants)) {
    assert.equal(count(real, from), 1, 'sabotagem sem alvo (ou alvo repetido): ' + name + ' (' + count(real, from) + ')');
    const mutated = real.replace(from, () => to);
    assert.notEqual(mutated, real, 'a sabotagem precisa mudar o código: ' + name);
    assert.doesNotThrow(() => new vm.Script(mutated), 'a sabotagem precisa ser um código válido: ' + name);
    let caught = false;
    try { await behaviors285(mutated); } catch (e) { caught = true; if (process.env.VER_SABOTAGEM) console.log('  sabotagem pega: ' + name + '\n      -> ' + String(e && e.message).split('\n')[0].slice(0, 150)); }
    assert(caught, 'o teste não pegou a sabotagem: ' + name);
  }
  assert(Object.keys(mutants).length >= 30);
});
t('O teste das regras do 1.12.284 também pega o erro: filtro trocado, Excluir fora do lugar, modo perdido', async () => {
  const real = moduleSource(page);
  const REMOVE_BUTTON = "+(roster?'<button class=\"btn danger registration-contact-remove\"";
  const mutants = {
    'Excluir aparece também em Alunos para aprovar': [REMOVE_BUTTON, "+(true?'<button class=\"btn danger registration-contact-remove\""],
    'Excluir nunca aparece (nem na Lista de alunos)': [REMOVE_BUTTON, "+(false?'<button class=\"btn danger registration-contact-remove\""],
    'Lista de alunos filtrada como a de aprovação': ['(roster||!registrationSettled(record)||approvalsShown.has(record.uid))', '(!registrationSettled(record)||approvalsShown.has(record.uid))'],
    'Alunos para aprovar mostra todos': ['(roster||!registrationSettled(record)||approvalsShown.has(record.uid))', 'true'],
    'cartão da lista abre no modo de aprovação': ['D("contacts", "students");', 'D("contacts", "approvals");'],
    'outra aba não reinicia o modo': ['if (n !== "contacts") registrationListMode = "approvals";\n  else if (', 'if ('],
    'Tentar novamente derruba o modo': ['else if (mode === "approvals" || mode === "students") registrationListMode = mode;', 'else registrationListMode = mode === "students" ? "students" : "approvals";'],
    'lista vazia sem texto próprio da lista': ["(roster?'Nenhum aluno na lista.':'Nenhum aluno aguardando aprovação.')", "'Nenhum aluno aguardando aprovação.'"],
    'sem permanência depois de aprovar': ['||approvalsShown.has(record.uid))).sort(', ')).sort(']
  };
  for (const [name, [from, to]] of Object.entries(mutants)) {
    assert.equal(count(real, from), 1, 'sabotagem sem alvo: ' + name);
    const mutated = real.replace(from, () => to);
    assert.doesNotThrow(() => new vm.Script(mutated), 'a sabotagem precisa ser um código válido: ' + name);
    let caught = false;
    try { await behaviors284(mutated); } catch (e) { caught = true; if (process.env.VER_SABOTAGEM) console.log('  sabotagem pega: ' + name + '\n      -> ' + String(e && e.message).split('\n')[0].slice(0, 150)); }
    assert(caught, 'o teste não pegou a sabotagem: ' + name);
  }
});

// ---------- 4) o que não pode ser tocado ----------
const addedCode = G.TEACHER_EDITS.map(e => e.next).join('\n');
t('Firebase: mesmas chamadas e mesmo número de operações do 1.12.284; só há uma gravação local a mais (a que desfaz a exclusão)', () => {
  for (const op of ['updateDoc(', 'getDocs(', 'onSnapshot(', 'setDoc(', 'deleteDoc(', 'addDoc(', 'writeBatch(', 'runTransaction(', 'getDoc(', 'signIn', 'signOut(', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'sendBeacon'])
    assert.equal(count(page, op), count(baseTeacher, op), op);
  assert.equal(count(page, 'localStorage.setItem('), count(baseTeacher, 'localStorage.setItem(') + 1, 'uma gravação local nova');
  assert.equal(count(addedCode, 'localStorage.setItem('), 1);
  assert.equal(count(addedCode, 'localStorage.setItem(DB_KEY,JSON.stringify({...state,registrationContactsHidden:hidden}))'), 1);
  assert.equal(count(page, "await o.updateDoc(ref,'ativo',true,'tipoAluno',type,'aprovadoEm',o.serverTimestamp())"), 1);
  assert.equal(count(page, "await o.updateDoc(ref,'ativo',true);"), 1);
  assert.equal(count(page, 'o.where("professorId","==",e)'), 1);
  // o mapa de exclusões só é escrito em dois lugares: ao excluir (acrescenta a marca) e ao devolver (tira a marca)
  const src = moduleSource(page);
  assert.equal(count(src, 'state.registrationContactsHidden=hidden;'), 2);
  assert.equal(count(moduleSource(baseTeacher), 'state.registrationContactsHidden=hidden;'), 1);
  assert(src.includes("[registrationRemovalKey(record.uid)]:true"));
  assert.equal(count(src, 'registrationContactsHidden='), count(moduleSource(baseTeacher), 'registrationContactsHidden=') + 1);
});
t('Não mexe em descanso, cronômetro, alarme ou notificação; o aviso do sininho continua exatamente igual', () => {
  // a única gravação nova é a local, que tira a marca de exclusão; firebaseUid só é lido
  assert.equal(count(addedCode, 'firebaseUid'), 1, 'firebaseUid só é lido, na mesma comparação que o desenho dos cartões já faz');
  assert.equal(count(addedCode, 'item.firebaseUid===record.uid'), 1);
  const found = (addedCode.replace('item.firebaseUid===record.uid', '').replace(/localStorage\.setItem\(DB_KEY,JSON\.stringify\(\{\.\.\.state,registrationContactsHidden:hidden\}\)\)/, '').match(/(\brest\b|restSeconds|alarm|notific|timer|descanso|cron[oô]metro|resumeWorkoutRest|firebase|firestore|updateDoc|getDocs|setDoc|deleteDoc|\.delete\(|removeItem|fetch\(|XMLHttpRequest|localStorage)/i) || [])[0];
  assert(!found, 'achou: ' + found);
  assert(!/(descanso|cron[oô]metro|alarme|notifica)/i.test(p.update.summary + ' ' + p.notes.replace(/Descanso, cronômetros, alarmes e notificações não foram alterados\./, '')));
  const bell = html => block(html, '<script id="ap-teacher-features">');
  assert.equal(sha(bell(page)), sha(bell(baseTeacher)), 'o bloco do aviso do sininho não pode mudar');
  assert(bell(page).includes("window.openRegistrationLink();\n      window.setRegistrationTab('contacts');"), 'Ver cadastros continua chamando estas duas funções');
  assert(bell(page).includes('!state.registrationContactsHidden?.[teacherUid + \':\' + uid]'), 'o sininho continua descontando os excluídos da lista (a chave é a mesma que o Voltar mexe)');
  assert(moduleSource(page).includes('window.openRegistrationLink=L;window.setRegistrationTab=D;'));
  assert(p.files['index.html'].includes('t.openRegistrationLink();t.setRegistrationTab?.("contacts")'));
  // o sincronizador de agenda e o resto do aplicativo não mudam: só o módulo de cadastro e o estilo da janela
  const outside = html => html.replace(block(html, MODULE_OPEN), '').replace(G.CSS_NEXT, G.CSS_ANCHOR);
  assert.equal(outside(page), outside(baseTeacher));
});
t('A aba interna continua "contacts" nos dois modos e o cartão Lista de alunos, o cartão Alunos para aprovar e a janela não mudam', () => {
  const src = moduleSource(page), base = moduleSource(baseTeacher);
  assert(src.includes('["contacts", "", "registrationContactsPanel"]'));
  assert(src.includes('else if (n === "contacts") U();'));
  assert.equal(count(src, 'n!==\'contacts\''), count(base, 'n!==\'contacts\'') + 1, 'a nova guarda de Voltar é a única diferença');
  assert.equal(count(src, 'n==="contacts"'), count(base, 'n==="contacts"'));
  for (const id of ['moreStudentList', 'moreStudentApprovals', 'moreRegistrationLink', 'registrationRosterIcon', 'registrationApprovalsIcon', 'registrationLinkIcon'])
    assert.equal(count(page, ' id="' + id + '"'), count(baseTeacher, ' id="' + id + '"'), id);
  assert(page.includes('<strong>Lista de alunos</strong><small>Todos os cadastros recebidos.</small>'));
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
