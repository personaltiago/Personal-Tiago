'use strict';

// Gera o pacote 1.12.284 (sem assinatura) a partir do pacote 1.12.283 (seq 389). Muda só o professor.html.
// O que muda:
//  1) Mais ganha o cartão "Lista de alunos" (grupo Alunos e financeiro, logo depois de "Alunos para aprovar").
//  2) A janela da lista de cadastros (a mesma do "Alunos para aprovar") ganha um segundo modo, "Lista de alunos": é a
//     lista antiga de contatos, com TODOS os cadastros que não foram excluídos da lista (aguardando aprovação, aprovados
//     que ainda não entraram na agenda e já na agenda), o mesmo passo a passo de aprovação, o botão "Ver aluno na agenda"
//     e o botão "Excluir da lista".
//  3) "Alunos para aprovar" continua só com quem ainda precisa de uma ação (aguarda aprovação ou falta entrar na agenda)
//     e perde o botão "Excluir da lista": excluir passa a ser feito só na "Lista de alunos".
// O modo é uma variável do módulo (registrationListMode); a aba interna continua sendo "contacts" nos dois casos, então
// o aviso do sininho (ap-teacher-features, que não muda), o login do professor, o "Tentar novamente" e todas as
// verificações que já existiam seguem valendo sem alteração. A aprovação (a gravação no Firebase) é exatamente a mesma.
// Não mexe em dados de alunos, em descanso, cronômetros, alarmes, notificações, no index.html, em avaliacoes.html,
// cadastro.html nem no histórico modular.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.284';
const sequence = 390;
const title = 'Lista de alunos';
const summary = 'Novo cartão Lista de alunos no Mais, com todos os cadastros e o Excluir da lista. Alunos para aprovar fica só para aprovar quem falta, sem o botão Excluir.';
const notes = 'Novo cartão Lista de alunos no Mais (grupo Alunos e financeiro, logo depois de Alunos para aprovar). Ele é a lista antiga de contatos: mostra todos os cadastros recebidos (aguardando aprovação, aprovados e já na agenda), com o mesmo passo a passo de aprovação (Tipo de aluno, Aprovar aluno ou Adicionar à agenda), o botão Ver aluno na agenda e o botão Excluir da lista. '
  + 'Excluir da lista só esconde o cadastro desta lista: a conta e os dados do aluno continuam como estão, nada é apagado. '
  + 'Alunos para aprovar agora serve só para aprovar: continua mostrando apenas quem aguarda aprovação ou foi aprovado e ainda não entrou na agenda, e o botão Excluir da lista saiu dele. Para excluir, use a Lista de alunos. '
  + 'A aprovação em si não mudou: a mesma gravação no Firebase nos dois cartões. O aviso do sininho (Ver cadastros) continua abrindo Alunos para aprovar. '
  + 'Este pacote inclui tudo até Alunos para aprovar (1.12.283). Descanso, cronômetros, alarmes e notificações não foram alterados.';

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

function count(text, part) {
  assert.ok(typeof part === 'string' && part.length > 0, 'Trecho vazio não pode ser procurado');
  let total = 0;
  for (let at = text.indexOf(part); at >= 0; at = text.indexOf(part, at + part.length)) total++;
  return total;
}

// Uma edição troca `previous` por `next`. Com `scope`, a troca vale só dentro do bloco <script> que começa naquele
// marcador (as três tabelas de ícones do Mais repetem o mesmo trecho). Com `times`, o trecho precisa existir
// exatamente essa quantidade de vezes (padrão: uma).
function blockRange(page, scope) {
  const start = page.indexOf(scope);
  assert.ok(start >= 0, 'Bloco não encontrado: ' + scope);
  assert.equal(page.indexOf(scope, start + scope.length), -1, 'Bloco duplicado: ' + scope);
  const end = page.indexOf('</script>', start);
  assert.ok(end > start, 'Fim do bloco não encontrado: ' + scope);
  return [start, end];
}

function replaceIn(text, previous, next, times, label) {
  assert.equal(count(text, previous), times, 'O trecho esperado existe ' + count(text, previous) + ' vez(es), e não ' + times + ': ' + label);
  return text.split(previous).join(next);
}

function applyEdit(page, edit) {
  const times = edit.times || 1;
  if (!edit.scope) return replaceIn(page, edit.previous, edit.next, times, edit.name);
  const [start, end] = blockRange(page, edit.scope);
  return page.slice(0, start) + replaceIn(page.slice(start, end), edit.previous, edit.next, times, edit.name) + page.slice(end);
}

// Desfaz uma edição (usado só pelos testes, para provar que nada além das edições mudou).
function undoEdit(page, edit) {
  assert.ok(edit.next.length > 0, 'Edição sem texto novo não pode ser desfeita: ' + edit.name);
  return applyEdit(page, {...edit, previous: edit.next, next: edit.previous});
}

// ---------- Mais: cartão novo, registro do cartão e ícone ----------
// Ícone cheio (como os outros do Mais): agenda de contatos, a mesma ideia do atalho Contatos que existia em Cadastro por link.
const ROSTER_GLYPH = '<path fill-rule="evenodd" d="M5.2 1.8h10.6a2.6 2.6 0 0 1 2.6 2.6v15.2a2.6 2.6 0 0 1-2.6 2.6H5.2a2.6 2.6 0 0 1-2.6-2.6V4.4a2.6 2.6 0 0 1 2.6-2.6Zm5.3 4.9a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8ZM5.6 18.8c.4-3 2.5-4.6 4.9-4.6s4.5 1.6 4.9 4.6Z"/><rect x="19.8" y="6.4" width="3.2" height="3.8" rx="1.1"/><rect x="19.8" y="13.8" width="3.2" height="3.8" rx="1.1"/>';
// O mesmo desenho em traço, igual ao do atalho Contatos antigo (cabeçalho da janela e reserva do cartão).
const ROSTER_STROKE = '<rect x="4" y="3" width="15" height="18" rx="2.6"/><circle cx="11.5" cy="10" r="2.5"/><path d="M7.4 17.2c.6-2.1 2.3-3.2 4.1-3.2s3.5 1.1 4.1 3.2"/><path d="M21.5 7.5v3M21.5 13.5v3"/>';
const GLYPH_ANCHOR = ',"menu-followup":"<circle cx=\\"7\\" cy=\\"6\\" r=\\"3.5\\"/>';
const GLYPH_ENTRY = ',"menu-roster":' + JSON.stringify(ROSTER_GLYPH);

const LIST_CARD = '<button class="more-function more-function-compact" type="button" id="moreStudentList" onclick="openStudentList()">'
  + '<span class="more-function-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ROSTER_STROKE + '</svg></span>'
  + '<span class="more-function-copy"><strong>Lista de alunos</strong><small>Todos os cadastros recebidos.</small></span>'
  + '<span class="more-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></span></button>';

const MORE_EDITS = [
  {
    name: 'Mais: cartão Lista de alunos',
    previous: '</button><button id="moreLessonSounds"',
    next: '</button>' + LIST_CARD + '<button id="moreLessonSounds"'
  },
  {
    name: 'Mais: lugar e ícone do cartão',
    previous: "moreStudentApprovals:['students',3.5,'menu-approve'],",
    next: "moreStudentApprovals:['students',3.5,'menu-approve'],moreStudentList:['students',3.6,'menu-roster'],"
  },
  // O mesmo ícone entra nas três tabelas: a do Mais (cor normal) e as dos temas Metal e Profundo.
  {name: 'Ícone no Mais', scope: '<script id="ap-more-menu-glyphs">', previous: GLYPH_ANCHOR, next: GLYPH_ENTRY + GLYPH_ANCHOR},
  {name: 'Ícone no tema Metal', scope: '<script data-agenda-metal-icons>', previous: GLYPH_ANCHOR, next: GLYPH_ENTRY + GLYPH_ANCHOR},
  {name: 'Ícone no tema Profundo', scope: '<script data-agenda-deep-icons>', previous: GLYPH_ANCHOR, next: GLYPH_ENTRY + GLYPH_ANCHOR}
];

// ---------- Janela: ícone do modo "Lista de alunos" no cabeçalho ----------
const SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
const APPROVALS_ICON = '<span class="registration-head-icon" id="registrationApprovalsIcon" hidden>' + SVG_OPEN + '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg></span>';
const ROSTER_ICON = '<span class="registration-head-icon" id="registrationRosterIcon" hidden>' + SVG_OPEN + ROSTER_STROKE + '</svg></span>';
const TITLE_TAG = '<h3 id="registrationLinkTitle">Cadastro por link</h3>';

const DIALOG_EDITS = [
  {name: 'Janela: ícone da lista de alunos', previous: APPROVALS_ICON + TITLE_TAG, next: APPROVALS_ICON + ROSTER_ICON + TITLE_TAG}
];

// ---------- Script do cadastro (data-agenda-registration) ----------
const SCRIPT_SCOPE = '<script data-agenda-registration>';

const MODE_PREVIOUS = [
  '// "Alunos para aprovar" usa esta mesma janela: no modo de aprovação o título muda, o ícone muda e os atalhos de links ficam ocultos.',
  'function applyRegistrationMode() {',
  '  const approvals = n === "contacts";',
  '  c("registrationLinkTitle").textContent = approvals ? "Alunos para aprovar" : "Cadastro por link";',
  '  c("registrationLinkIcon").hidden = approvals;',
  '  c("registrationApprovalsIcon").hidden = !approvals;',
  '  c("registrationTabs").hidden = approvals;',
  '  c("registrationLinkClose").setAttribute("aria-label", approvals ? "Fechar alunos para aprovar" : "Fechar cadastro por link");',
  '}',
  'function openStudentApprovals() {',
  '  D("contacts");',
  '  openDialog("registrationLinkDialog");',
  '}',
  'function D(tab) {',
  '  cancelRegistrationRemoval(false);'
].join('\n');

const MODE_NEXT = [
  '// A mesma janela serve a três telas. Cadastro por link mostra os atalhos de links. Alunos para aprovar e Lista de alunos',
  '// mostram a lista de cadastros (aba interna "contacts"), sem os atalhos, e o modo da lista decide o resto:',
  '//  - "approvals" (Alunos para aprovar): só quem ainda precisa de uma ação, sem o botão Excluir da lista;',
  '//  - "students" (Lista de alunos): todos os cadastros que não foram excluídos da lista, com o botão Excluir da lista.',
  'function applyRegistrationMode() {',
  '  const listing = n === "contacts", roster = listing && registrationListMode === "students";',
  '  c("registrationLinkTitle").textContent = roster ? "Lista de alunos" : listing ? "Alunos para aprovar" : "Cadastro por link";',
  '  c("registrationLinkIcon").hidden = listing;',
  '  c("registrationApprovalsIcon").hidden = !listing || roster;',
  '  c("registrationRosterIcon").hidden = !roster;',
  '  c("registrationTabs").hidden = listing;',
  '  c("registrationLinkClose").setAttribute("aria-label", roster ? "Fechar lista de alunos" : listing ? "Fechar alunos para aprovar" : "Fechar cadastro por link");',
  '}',
  'function openStudentApprovals() {',
  '  D("contacts", "approvals");',
  '  openDialog("registrationLinkDialog");',
  '}',
  'function openStudentList() {',
  '  D("contacts", "students");',
  '  openDialog("registrationLinkDialog");',
  '}',
  'function D(tab, mode) {',
  '  cancelRegistrationRemoval(false);'
].join('\n');

const TAB_PREVIOUS = '  n = ["installation", "group", "contacts", "anamnesis", "plans"].includes(tab) ? tab : "link";\n  s++;';
const TAB_NEXT = [
  '  n = ["installation", "group", "contacts", "anamnesis", "plans"].includes(tab) ? tab : "link";',
  '  // O modo da lista só muda quando alguém pede um (os dois cartões do Mais). Quem chama sem pedir (o "Tentar novamente"',
  '  // da lista) mantém o modo da janela. Qualquer outra aba volta ao padrão, que é o de aprovação: é por isso que o sininho,',
  '  // que abre primeiro Cadastro por link e depois a lista, sempre cai em Alunos para aprovar.',
  '  if (n !== "contacts") registrationListMode = "approvals";',
  '  else if (mode === "approvals" || mode === "students") registrationListMode = mode;',
  '  s++;'
].join('\n');

const SCRIPT_EDITS = [
  {name: 'Script: modo da janela e função da Lista de alunos', scope: SCRIPT_SCOPE, previous: MODE_PREVIOUS, next: MODE_NEXT},
  {name: 'Script: a aba da lista guarda o modo pedido', scope: SCRIPT_SCOPE, previous: TAB_PREVIOUS, next: TAB_NEXT},
  {
    name: 'Script: variável do modo da lista',
    scope: SCRIPT_SCOPE,
    previous: 'let approvalsShown=new Set;',
    next: 'let approvalsShown=new Set;\n// Modo da lista de cadastros: "approvals" (Alunos para aprovar) ou "students" (Lista de alunos). Ver D().\nlet registrationListMode="approvals";'
  },
  {
    name: 'Script: a Lista de alunos mostra todos os cadastros',
    scope: SCRIPT_SCOPE,
    previous: '\n const visible=i.filter(record=>!registrationContactHidden(record)&&(!registrationSettled(record)||approvalsShown.has(record.uid))).sort(',
    next: "\n const roster=registrationListMode==='students';\n const visible=i.filter(record=>!registrationContactHidden(record)&&(roster||!registrationSettled(record)||approvalsShown.has(record.uid))).sort("
  },
  {
    name: 'Script: Excluir da lista só na Lista de alunos',
    scope: SCRIPT_SCOPE,
    previous: "+'<button class=\"btn danger registration-contact-remove\" type=\"button\" data-registration-remove aria-label=\"Excluir '+d(record.nome)+' da lista\">Excluir da lista</button></article>';",
    next: "+(roster?'<button class=\"btn danger registration-contact-remove\" type=\"button\" data-registration-remove aria-label=\"Excluir '+d(record.nome)+' da lista\">Excluir da lista</button>':'')+'</article>';"
  },
  {
    name: 'Script: lista vazia da Lista de alunos',
    scope: SCRIPT_SCOPE,
    previous: "(i.length?'Nenhum aluno aguardando aprovação.':'Nenhum cadastro recebido ainda.<br>Envie seu link aos novos alunos.')",
    next: "(i.length?(roster?'Nenhum aluno na lista.':'Nenhum aluno aguardando aprovação.'):'Nenhum cadastro recebido ainda.<br>Envie seu link aos novos alunos.')"
  },
  {
    name: 'Script: abrir Lista de alunos por fora',
    scope: SCRIPT_SCOPE,
    previous: 'window.openStudentApprovals=openStudentApprovals;',
    next: 'window.openStudentApprovals=openStudentApprovals;window.openStudentList=openStudentList;'
  }
];

const TEACHER_EDITS = [...MORE_EDITS, ...DIALOG_EDITS, ...SCRIPT_EDITS];
const edits = {'professor.html': TEACHER_EDITS};

function applyAll(page, list) {
  return list.reduce((current, edit) => applyEdit(current, edit), page);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.283');
  assert.equal(source.sequence, 389);
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files};
  for (const [name, list] of Object.entries(edits)) files[name] = applyAll(original.files[name], list);
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.284-Lista-De-Alunos-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-lista-alunos-1.12.284.cjs AgendaPersonal-1.12.283-Alunos-Para-Aprovar-Para-Assinar.agenda.json [saida.agenda.json]');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, applyAll, applyEdit, undoEdit, edits, TEACHER_EDITS, MORE_EDITS, DIALOG_EDITS, SCRIPT_EDITS,
  ROSTER_GLYPH, ROSTER_STROKE, GLYPH_ENTRY, GLYPH_ANCHOR, LIST_CARD, ROSTER_ICON, APPROVALS_ICON, MODE_PREVIOUS, MODE_NEXT, sha256, count,
  version, sequence, title, summary, notes
};
