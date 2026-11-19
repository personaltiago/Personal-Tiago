'use strict';

// Gera o pacote 1.12.283 (sem assinatura) a partir do pacote 1.12.282 (seq 388).
// Muda só o professor.html e uma frase do index.html. O que muda:
//  1) Mais ganha o cartão "Alunos para aprovar" (grupo Alunos e financeiro, logo depois de "Cadastro por link").
//  2) A lista que antes era a aba "Contatos" de Cadastro por link passa a abrir nesse cartão, na mesma janela
//     (a mesma lista, o mesmo código de aprovação), com o título "Alunos para aprovar" e sem os atalhos de links.
//     A lista mostra só quem ainda precisa de uma ação: quem aguarda aprovação e quem já foi aprovado mas ainda não
//     está na agenda. Quem já está aprovado E na agenda sai da lista. Quem acabou de ser aprovado fica na tela, como
//     "Na agenda", até a lista ser atualizada (é nesse cartão que aparece a confirmação "… está na sua agenda." e o
//     botão "Ver aluno na agenda"). Quem está na agenda mas continua sem aprovação no Firebase também segue na lista,
//     como já era na aba Contatos e como o aviso do sininho já conta.
//  3) Cadastro por link fica só com os links: Cadastro, Instalação, Grupo, Anamnese e Planos (o atalho Contatos sai).
//  4) Os textos que mandavam o professor para "Contatos" passam a apontar para Mais → Alunos para aprovar.
// Não mexe em aprovação (a gravação no Firebase é exatamente a mesma), em dados de alunos, em descanso, cronômetros,
// alarmes, notificações, no aviso do sininho (ap-teacher-features), em avaliacoes.html, cadastro.html nem no
// histórico modular.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.283';
const sequence = 389;
const title = 'Alunos para aprovar';
const summary = 'Novo cartão Alunos para aprovar no Mais: só quem falta aprovar ou adicionar à agenda. Cadastro por link fica só com os links: Cadastro, Instalação, Grupo, Anamnese e Planos.';
const notes = 'Novo cartão Alunos para aprovar no Mais (grupo Alunos e financeiro, logo depois de Cadastro por link). Ele mostra só os cadastros que ainda precisam de você: quem aguarda aprovação e quem já foi aprovado mas ainda não foi adicionado à agenda. Quem já está aprovado e na agenda não aparece mais ali. '
  + 'Depois de aprovar um aluno, o cartão dele continua na tela como Na agenda, com a confirmação e o botão Ver aluno na agenda, até você atualizar a lista ou abrir a janela de novo. '
  + 'A aprovação em si não mudou: o mesmo passo a passo (Tipo de aluno, Aprovar aluno ou Adicionar à agenda) e a mesma gravação no Firebase. Nenhum dado de aluno é apagado, e Excluir da lista continua só escondendo o cadastro desta lista. '
  + 'Cadastro por link deixa de ter o atalho Contatos e fica só com os links: Cadastro, Instalação, Grupo, Anamnese e Planos. O aviso do sininho (Ver cadastros) abre direto a nova janela. '
  + 'Os textos que citavam Contatos agora apontam para Mais → Alunos para aprovar. '
  + 'Este pacote inclui tudo até o Feedback do aluno (1.12.282). Descanso, cronômetros, alarmes e notificações não foram alterados.';

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
const APPROVE_GLYPH = '<circle cx="8.7" cy="6" r="3.3"/><path d="M1.8 21v-3.2a6.9 6.9 0 0 1 12.1-4.6 5.8 5.8 0 0 0-1 7.8Z"/><path d="M14.9 16.7 13.1 18.5 16.9 22.3 23.7 15.5 21.9 13.7 16.9 18.7Z"/>';
const GLYPH_ANCHOR = ',"menu-followup":"<circle cx=\\"7\\" cy=\\"6\\" r=\\"3.5\\"/>';
const GLYPH_ENTRY = ',"menu-approve":' + JSON.stringify(APPROVE_GLYPH);

const APPROVALS_CARD = '<button class="more-function more-function-compact" type="button" id="moreStudentApprovals" onclick="openStudentApprovals()">'
  + '<span class="more-function-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7" r="3.5"/><path d="M2 21v-2a7 7 0 0 1 12-5"/><path d="m16 19 2 2 4-4"/></svg></span>'
  + '<span class="more-function-copy"><strong>Alunos para aprovar</strong><small>Aprove os cadastros recebidos.</small></span>'
  + '<span class="more-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></span></button>';

const MORE_EDITS = [
  {
    name: 'Mais: subtítulo de Cadastro por link',
    previous: '<small>Convide e aprove novos alunos.</small>',
    next: '<small>Convide novos alunos pelo link.</small>'
  },
  {
    name: 'Mais: cartão Alunos para aprovar',
    previous: '</button><button id="moreLessonSounds"',
    next: '</button>' + APPROVALS_CARD + '<button id="moreLessonSounds"'
  },
  {
    name: 'Mais: lugar e ícone do cartão',
    previous: "moreRegistrationLink:['students',3,'menu-link'],",
    next: "moreRegistrationLink:['students',3,'menu-link'],moreStudentApprovals:['students',3.5,'menu-approve'],"
  },
  // O mesmo ícone entra nas três tabelas: a do Mais (cor normal) e as dos temas Metal e Profundo.
  {name: 'Ícone no Mais', scope: '<script id="ap-more-menu-glyphs">', previous: GLYPH_ANCHOR, next: GLYPH_ENTRY + GLYPH_ANCHOR},
  {name: 'Ícone no tema Metal', scope: '<script data-agenda-metal-icons>', previous: GLYPH_ANCHOR, next: GLYPH_ENTRY + GLYPH_ANCHOR},
  {name: 'Ícone no tema Profundo', scope: '<script data-agenda-deep-icons>', previous: GLYPH_ANCHOR, next: GLYPH_ENTRY + GLYPH_ANCHOR}
];

// ---------- Janela: mesmo diálogo, dois modos ----------
const HEAD_PREVIOUS = '<div class="sheet-head"><span class="registration-head-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 13a5 5 0 0 0 7 .3l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.3l-3 3a5 5 0 0 0 7 7l2-2"/></svg></span><h3 id="registrationLinkTitle">Cadastro por link</h3><button class="close" type="button" data-close="registrationLinkDialog" aria-label="Fechar cadastro por link">×</button></div>';
const HEAD_NEXT = '<div class="sheet-head"><span class="registration-head-icon" id="registrationLinkIcon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 13a5 5 0 0 0 7 .3l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.3l-3 3a5 5 0 0 0 7 7l2-2"/></svg></span>'
  + '<span class="registration-head-icon" id="registrationApprovalsIcon" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg></span>'
  + '<h3 id="registrationLinkTitle">Cadastro por link</h3><button class="close" id="registrationLinkClose" type="button" data-close="registrationLinkDialog" aria-label="Fechar cadastro por link">×</button></div>';

const CONTACTS_TILE = '\n      <button id="registrationContactsTab" type="button" role="tab" aria-selected="false" aria-controls="registrationContactsPanel" onclick="setRegistrationTab(\'contacts\')"><span class="registration-tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="3" width="15" height="18" rx="2.6"/><circle cx="11.5" cy="10" r="2.5"/><path d="M7.4 17.2c.6-2.1 2.3-3.2 4.1-3.2s3.5 1.1 4.1 3.2"/><path d="M21.5 7.5v3M21.5 13.5v3"/></svg></span><span class="registration-tile-label">Contatos</span></button>';

const GROUP_TILE_END = '<span class="registration-tile-label">Grupo</span></button>';

const TABS_PREVIOUS = '#registrationLinkDialog .registration-tabs{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 18px;padding-bottom:18px;border-bottom:1px solid var(--ac-line,var(--line))}';
// Cinco atalhos: três na primeira linha e dois centralizados na segunda (grade de 6 colunas, cada atalho ocupa 2).
const TABS_NEXT = '#registrationLinkDialog .registration-tabs{grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:0 0 18px;padding-bottom:18px;border-bottom:1px solid var(--ac-line,var(--line))}'
  + '#registrationLinkDialog .registration-tabs button{grid-column:span 2}'
  + '#registrationLinkDialog .registration-tabs button:nth-child(4){grid-column:2/4}'
  + '#registrationLinkDialog .registration-tabs button:nth-child(5){grid-column:4/6}';

const DIALOG_EDITS = [
  {name: 'Janela: ícones, título e botão de fechar', previous: HEAD_PREVIOUS, next: HEAD_NEXT},
  {
    name: 'Janela: identificação dos atalhos',
    previous: '<div class="registration-tabs" role="tablist" aria-label="Cadastro por link">',
    next: '<div class="registration-tabs" id="registrationTabs" role="tablist" aria-label="Cadastro por link">'
  },
  // O atalho sai junto com o fim do atalho Grupo (que vem antes dele): assim a edição nunca troca por texto vazio
  // e dá para provar a reversão nos testes.
  {name: 'Janela: atalho Contatos sai', previous: GROUP_TILE_END + CONTACTS_TILE, next: GROUP_TILE_END},
  {
    name: 'Janela: painel da lista',
    previous: '<div id="registrationContactsPanel" role="tabpanel" aria-labelledby="registrationContactsTab" hidden>',
    next: '<div id="registrationContactsPanel" role="tabpanel" aria-labelledby="registrationLinkTitle" hidden>'
  },
  {name: 'Janela: grade dos cinco atalhos', previous: TABS_PREVIOUS, next: TABS_NEXT}
];

// ---------- Script do cadastro (data-agenda-registration) ----------
const MODE_FUNCTIONS = [
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
  ''
].join('\n');

const SCRIPT_SCOPE = '<script data-agenda-registration>';

const SCRIPT_EDITS = [
  {
    name: 'Script: atalho contacts sem botão',
    scope: SCRIPT_SCOPE,
    previous: '["contacts", "registrationContactsTab", "registrationContactsPanel"],',
    next: '["contacts", "", "registrationContactsPanel"],'
  },
  {
    name: 'Script: funções do modo de aprovação',
    scope: SCRIPT_SCOPE,
    previous: 'function D(tab) {\n  cancelRegistrationRemoval(false);',
    next: MODE_FUNCTIONS + 'function D(tab) {\n  cancelRegistrationRemoval(false);'
  },
  {
    name: 'Script: só marca o botão quando ele existe',
    scope: SCRIPT_SCOPE,
    previous: '    c(buttonId).setAttribute("aria-selected", String(selected));',
    next: '    if (buttonId) c(buttonId).setAttribute("aria-selected", String(selected));'
  },
  {
    name: 'Script: aplica o modo ao trocar de aba',
    scope: SCRIPT_SCOPE,
    previous: '    c(panelId).hidden = !selected;\n  }\n  if (n === "installation") renderInstallationLink();',
    next: '    c(panelId).hidden = !selected;\n  }\n  applyRegistrationMode();\n  if (n === "installation") renderInstallationLink();'
  },
  {
    name: 'Script: atualizar a lista recomeça a conferência',
    scope: SCRIPT_SCOPE,
    previous: 'async function U(){cancelRegistrationRemoval(false);const t=c("registrationContactsView"),a=++s;',
    next: 'async function U(){cancelRegistrationRemoval(false);approvalsShown=new Set;const t=c("registrationContactsView"),a=++s;'
  },
  {
    name: 'Script: botão Atualizar lista',
    scope: SCRIPT_SCOPE,
    previous: '<button class="btn" id="registrationRefresh" type="button">Atualizar contatos</button>',
    next: '<button class="btn" id="registrationRefresh" type="button">Atualizar lista</button>'
  },
  {
    name: 'Script: quem já foi mostrado fica até atualizar',
    scope: SCRIPT_SCOPE,
    previous: 'let pendingRegistrationRemoval=null;',
    next: 'let pendingRegistrationRemoval=null;\n// Quem já apareceu na lista continua nela, mesmo depois de entrar na agenda, até a lista ser atualizada:\n// é ali que aparece a confirmação da aprovação e o botão Ver aluno na agenda.\nlet approvalsShown=new Set;'
  },
  {
    name: 'Script: cadastro resolvido (aprovado e já na agenda)',
    scope: SCRIPT_SCOPE,
    previous: 'function cancelRegistrationRemoval(restoreFocus=true){',
    next: 'function registrationSettled(record){\n return record.ativo===true&&state.students.some(item=>item.firebaseUid===record.uid);\n}\nfunction cancelRegistrationRemoval(restoreFocus=true){'
  },
  {
    name: 'Script: lista só com quem ainda precisa de uma ação',
    scope: SCRIPT_SCOPE,
    previous: 'const visible=i.filter(record=>!registrationContactHidden(record)).sort(',
    next: 'const visible=i.filter(record=>!registrationContactHidden(record)&&(!registrationSettled(record)||approvalsShown.has(record.uid))).sort('
  },
  {
    name: 'Script: guarda quem foi mostrado',
    scope: SCRIPT_SCOPE,
    previous: '\n list.innerHTML=visible.length?visible.map(record=>{',
    next: '\n approvalsShown=new Set(visible.map(record=>record.uid));\n list.innerHTML=visible.length?visible.map(record=>{'
  },
  {
    name: 'Script: lista vazia',
    scope: SCRIPT_SCOPE,
    previous: "'Nenhum contato na lista.'",
    next: "'Nenhum aluno aguardando aprovação.'"
  },
  {
    name: 'Script: mensagens que citavam os contatos',
    scope: SCRIPT_SCOPE,
    previous: 'Atualize os contatos e tente novamente.',
    next: 'Atualize a lista e tente novamente.',
    times: 3
  },
  {
    name: 'Script: mensagem de sessão do professor',
    scope: SCRIPT_SCOPE,
    previous: 'Entre com a conta do professor e atualize os contatos.',
    next: 'Entre com a conta do professor e atualize a lista.'
  },
  {
    name: 'Script: abrir Alunos para aprovar por fora',
    scope: SCRIPT_SCOPE,
    previous: 'window.openRegistrationLink=L;window.setRegistrationTab=D;',
    next: 'window.openRegistrationLink=L;window.setRegistrationTab=D;window.openStudentApprovals=openStudentApprovals;'
  }
];

// ---------- Textos que mandavam para Contatos ----------
const TEXT_EDITS = [
  {
    name: 'Texto: painel Cadastro',
    previous: 'Você aprova os cadastros recebidos na aba Contatos.',
    next: 'Você aprova os cadastros recebidos em Mais\u00a0→\u00a0Alunos para aprovar.'
  },
  {
    name: 'Texto: passo da área do aluno',
    previous: '<li>O aluno se cadastra pelo seu link. Em Cadastro por link → Contatos, aprove e vincule ao perfil que já existe na agenda.</li>',
    next: '<li>O aluno se cadastra pelo seu link. Em Mais\u00a0→\u00a0Alunos para aprovar, aprove e vincule ao perfil que já existe na agenda.</li>'
  },
  {
    name: 'Texto: situação da conta do aluno',
    previous: 'você vinculá-la a este perfil em Contatos.',
    next: 'você vinculá-la a este perfil em Alunos para aprovar.'
  }
];

const INDEX_EDITS = [
  {
    name: 'Texto do aplicativo: conta do aluno sem vínculo',
    previous: 'Cadastre e vincule a conta do aluno em Cadastro por link → Contatos.',
    next: 'Envie o cadastro por link ao aluno e vincule a conta dele em Mais\u00a0→\u00a0Alunos para aprovar.'
  }
];

const TEACHER_EDITS = [...MORE_EDITS, ...DIALOG_EDITS, ...SCRIPT_EDITS, ...TEXT_EDITS];
const edits = {'professor.html': TEACHER_EDITS, 'index.html': INDEX_EDITS};

function applyAll(page, list) {
  return list.reduce((current, edit) => applyEdit(current, edit), page);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.282');
  assert.equal(source.sequence, 388);
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files};
  for (const [name, list] of Object.entries(edits)) files[name] = applyAll(original.files[name], list);
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.283-Alunos-Para-Aprovar-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-alunos-aprovar-1.12.283.cjs AgendaPersonal-1.12.282-Feedback-Aluno-Para-Assinar.agenda.json [saida.agenda.json]');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, applyAll, applyEdit, undoEdit, edits, TEACHER_EDITS, INDEX_EDITS, MORE_EDITS, DIALOG_EDITS, SCRIPT_EDITS, TEXT_EDITS,
  APPROVE_GLYPH, GLYPH_ENTRY, GLYPH_ANCHOR, APPROVALS_CARD, MODE_FUNCTIONS, sha256, count,
  version, sequence, title, summary, notes
};
