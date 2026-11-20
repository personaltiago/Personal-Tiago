'use strict';

// Gera o pacote 1.12.285 (sem assinatura) a partir do pacote 1.12.284 (seq 390). Muda só o professor.html.
// Motivo: na Lista de alunos (1.12.284) os cadastros que já tinham sido excluídos da lista pelo botão "Excluir da lista"
// ficam escondidos, e a tela não tinha nenhum jeito de mostrá-los nem de desfazer a exclusão. Quando todos os cadastros
// estavam escondidos, a lista abria só com "Nenhum aluno na lista.".
// O que muda:
//  1) Na Lista de alunos, quando existe algum cadastro excluído da lista, aparece o bloco "Excluídos da lista": o botão
//     "Mostrar excluídos (N)" abre a relação (nome, situação e contatos) e cada cadastro ganha "Voltar para a lista";
//     com mais de um, também "Voltar todos para a lista". Se todos estão excluídos, o bloco já abre sozinho.
//  2) Voltar para a lista só desfaz a marca de exclusão guardada na agenda do professor (a mesma que o "Excluir da lista"
//     grava, pelo mesmo caminho: localStorage da agenda + sincronização da agenda). Nada é gravado no Firebase dos alunos.
//  3) A confirmação do "Excluir da lista" avisa que o cadastro poderá voltar para a lista.
// "Alunos para aprovar" não muda (não mostra excluídos). A aprovação, o aviso do sininho, o menu Alunos e convites, os dados
// de alunos, descanso, cronômetros, alarmes, notificações, index.html, avaliacoes.html, cadastro.html e o histórico modular
// também não mudam.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.285';
const sequence = 391;
const title = 'Excluídos da lista';
const summary = 'Na Lista de alunos, Mostrar excluídos traz de volta os cadastros escondidos pelo Excluir da lista, um por um ou todos.';
const notes = 'Na Lista de alunos, quando algum cadastro foi excluído da lista, aparece o botão Mostrar excluídos (com a quantidade). Ele abre a relação dos escondidos, com nome, situação e contatos, e cada um tem o botão Voltar para a lista (com mais de um, também Voltar todos para a lista). Se todos os cadastros estiverem excluídos, a lista já abre mostrando quem está escondido, em vez de só dizer Nenhum aluno na lista. '
  + 'Excluir da lista continua só escondendo: a conta, os dados e a agenda do aluno não são tocados. Voltar para a lista só desfaz essa marca de exclusão da agenda do professor, pelo mesmo caminho que o Excluir já usava; nenhum cadastro nem conta de aluno é alterado no Firebase. A confirmação do Excluir passa a avisar que o cadastro poderá voltar para a lista. '
  + 'Alunos para aprovar não mudou e não mostra excluídos. A aprovação, o aviso do sininho e o menu Alunos e convites continuam como estavam. '
  + 'Este pacote inclui tudo até a Lista de alunos (1.12.284). Descanso, cronômetros, alarmes e notificações não foram alterados.';

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

function count(text, part) {
  assert.ok(typeof part === 'string' && part.length > 0, 'Trecho vazio não pode ser procurado');
  let total = 0;
  for (let at = text.indexOf(part); at >= 0; at = text.indexOf(part, at + part.length)) total++;
  return total;
}

// Uma edição troca `previous` por `next`. Com `scope`, a troca vale só dentro do bloco <script> que começa naquele
// marcador. Com `times`, o trecho precisa existir exatamente essa quantidade de vezes (padrão: uma).
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

const SCRIPT_SCOPE = '<script data-agenda-registration>';

// ---------- Estilo: o bloco dos excluídos usa os mesmos cartões e botões da lista ----------
const CSS_ANCHOR = '#registrationLinkDialog .registration-contact-remove{margin-top:12px}';
const CSS_NEXT = CSS_ANCHOR
  + '#registrationLinkDialog .registration-hidden{margin-top:20px}'
  + '#registrationLinkDialog .registration-hidden>.btn{width:100%;min-height:44px;margin:0 0 12px}';

const STYLE_EDITS = [
  {name: 'Estilo: bloco dos excluídos', previous: CSS_ANCHOR, next: CSS_NEXT}
];

// ---------- Script do cadastro (data-agenda-registration) ----------
const VARIABLE_PREVIOUS = 'let registrationListMode="approvals";';
const VARIABLE_NEXT = VARIABLE_PREVIOUS
  + '\n// Lista de alunos: o bloco dos cadastros excluídos da lista fica fechado enquanto houver alunos na lista (abre sozinho quando não há).'
  + '\nlet registrationHiddenOpen=false;';

const TAB_PREVIOUS = '  else if (mode === "approvals" || mode === "students") registrationListMode = mode;\n  s++;';
const TAB_NEXT = [
  '  else if (mode === "approvals" || mode === "students") registrationListMode = mode;',
  '  // Abrir uma lista de novo (ou sair dela) recomeça com o bloco dos excluídos fechado; o "Tentar novamente" não mexe nele.',
  '  if (n !== "contacts" || mode === "approvals" || mode === "students") registrationHiddenOpen = false;',
  '  s++;'
].join('\n');

// O desenho da lista passa a ser montado em uma variável e gravado de uma vez, junto com o bloco dos excluídos.
const RENDER_START_PREVIOUS = "\n list.innerHTML=visible.length?visible.map(record=>{";
const RENDER_START_NEXT = "\n const rosterHtml=visible.length?visible.map(record=>{";
const RENDER_PREVIOUS = "\n list.querySelectorAll('[data-registration-approve]').forEach(button=>button.onclick=()=>O(button));";
const RENDER_NEXT = "\n list.innerHTML=rosterHtml+hiddenRegistrationsHtml(visible.length);"
  + "\n list.querySelectorAll('[data-registration-approve]').forEach(button=>button.onclick=()=>O(button));";

const WIRING_PREVIOUS = "list.querySelectorAll('[data-registration-remove]').forEach(button=>button.onclick=()=>requestRegistrationRemoval(button));\n}\nconst activeRegistrationApprovals=new Set;";

// Código novo: o HTML do bloco dos excluídos e a função que devolve cadastros à lista.
const NEW_FUNCTIONS = [
  '// Lista de alunos: "Excluir da lista" só esconde o cadastro, e a marca fica guardada na agenda do professor. Este bloco mostra',
  '// quem está escondido e deixa devolver à lista, um por um ou todos. Só existe na Lista de alunos.',
  'function hiddenRegistrationsHtml(visibleCount){',
  " if(registrationListMode!=='students')return '';",
  " const hidden=i.filter(registrationContactHidden).sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));",
  " if(!hidden.length)return '';",
  ' const total=hidden.length,open=registrationHiddenOpen||!visibleCount;',
  " let html='<section class=\"registration-hidden\" aria-label=\"Excluídos da lista\">';",
  " if(visibleCount)html+='<button class=\"btn\" type=\"button\" data-registration-hidden-toggle aria-expanded=\"'+open+'\">'+(open?'Ocultar excluídos':'Mostrar excluídos ('+total+')')+'</button>';",
  ' if(open){',
  "  html+='<p class=\"registration-help\">'+(total===1?'1 cadastro excluído da lista.':total+' cadastros excluídos da lista.')+' Nada foi apagado: a conta e os dados do aluno continuam guardados.</p>';",
  "  if(total>1)html+='<button class=\"btn\" type=\"button\" data-registration-restore-all>Voltar todos para a lista</button>';",
  '  html+=hidden.map(record=>{',
  "   const student=state.students.find(item=>item.firebaseUid===record.uid),status=student?'Na agenda':record.ativo===true?'Aprovado · adicionar à agenda':'Aguardando aprovação';",
  "   return '<article class=\"registration-contact registration-contact-hidden\"><strong>'+d(record.nome)+'</strong><span class=\"registration-contact-status\">'+status+'</span><p>'+d(record.email)+'<br>'+d(record.whatsapp)+(record.nascimento?'<br>'+d(fmtDate(record.nascimento)):'')+(record.genero?' · '+d(record.genero):'')+'</p><button class=\"btn\" type=\"button\" data-registration-restore=\"'+d(record.uid)+'\" aria-label=\"Voltar '+d(record.nome)+' para a lista\">Voltar para a lista</button></article>';",
  "  }).join('');",
  ' }',
  " return html+'</section>';",
  '}',
  'function restoreRegistrations(uids){',
  " if(!C()||n!=='contacts'||registrationListMode!=='students')return;",
  ' const keys=(Array.isArray(uids)?uids:[]).map(registrationRemovalKey).filter(Boolean);',
  ' const previous=state.registrationContactsHidden;',
  " const hidden={...(previous&&typeof previous==='object'&&!Array.isArray(previous)?previous:{})};",
  ' let restored=0;',
  ' for(const key of keys)if(hidden[key]===true){delete hidden[key];restored++}',
  ' if(!restored)return;',
  ' try{localStorage.setItem(DB_KEY,JSON.stringify({...state,registrationContactsHidden:hidden}))}',
  " catch(problem){l('Não foi possível salvar. Os cadastros continuam excluídos da lista. Confira o armazenamento e tente novamente.',true);return}",
  ' state.registrationContactsHidden=hidden;',
  ' registrationHiddenOpen=i.some(registrationContactHidden);',
  " T();l(restored===1?'Cadastro devolvido à lista.':restored+' cadastros devolvidos à lista.');",
  " try{window.APTeacherSync?.changed()}catch(problem){console.warn('Cadastros devolvidos à lista; sincronização pendente.',problem)}",
  " c('registrationRefresh')?.focus({preventScroll:true});",
  '}'
].join('\n');

const WIRING_NEXT = [
  "list.querySelectorAll('[data-registration-remove]').forEach(button=>button.onclick=()=>requestRegistrationRemoval(button));",
  " list.querySelectorAll('[data-registration-hidden-toggle]').forEach(button=>button.onclick=()=>{registrationHiddenOpen=!registrationHiddenOpen;T();list.querySelector('[data-registration-hidden-toggle]')?.focus({preventScroll:true})});",
  " list.querySelectorAll('[data-registration-restore]').forEach(button=>button.onclick=()=>restoreRegistrations([button.dataset.registrationRestore]));",
  " list.querySelectorAll('[data-registration-restore-all]').forEach(button=>button.onclick=()=>restoreRegistrations(i.filter(registrationContactHidden).map(record=>record.uid)));",
  '}',
  NEW_FUNCTIONS,
  'const activeRegistrationApprovals=new Set;'
].join('\n');

const HELP_PREVIOUS = "help.textContent='A conta e os dados do aluno serão mantidos.';";
const HELP_NEXT = "help.textContent='A conta e os dados do aluno serão mantidos. Você poderá voltar este cadastro para a lista depois.';";

const SCRIPT_EDITS = [
  {name: 'Script: variável do bloco dos excluídos', scope: SCRIPT_SCOPE, previous: VARIABLE_PREVIOUS, next: VARIABLE_NEXT},
  {name: 'Script: abrir a lista recomeça com o bloco fechado', scope: SCRIPT_SCOPE, previous: TAB_PREVIOUS, next: TAB_NEXT},
  {name: 'Script: a lista é montada em uma variável', scope: SCRIPT_SCOPE, previous: RENDER_START_PREVIOUS, next: RENDER_START_NEXT},
  {name: 'Script: o bloco dos excluídos entra depois dos cartões', scope: SCRIPT_SCOPE, previous: RENDER_PREVIOUS, next: RENDER_NEXT},
  {name: 'Script: botões do bloco e funções novas', scope: SCRIPT_SCOPE, previous: WIRING_PREVIOUS, next: WIRING_NEXT},
  {name: 'Script: a confirmação do Excluir avisa que dá para voltar', scope: SCRIPT_SCOPE, previous: HELP_PREVIOUS, next: HELP_NEXT}
];

const TEACHER_EDITS = [...STYLE_EDITS, ...SCRIPT_EDITS];
const edits = {'professor.html': TEACHER_EDITS};

function applyAll(page, list) {
  return list.reduce((current, edit) => applyEdit(current, edit), page);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.284');
  assert.equal(source.sequence, 390);
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files};
  for (const [name, list] of Object.entries(edits)) files[name] = applyAll(original.files[name], list);
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.285-Excluidos-Da-Lista-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-lista-excluidos-1.12.285.cjs AgendaPersonal-1.12.284-Lista-De-Alunos-Para-Assinar.agenda.json [saida.agenda.json]');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, applyAll, applyEdit, undoEdit, edits, TEACHER_EDITS, STYLE_EDITS, SCRIPT_EDITS, NEW_FUNCTIONS,
  CSS_ANCHOR, CSS_NEXT, VARIABLE_PREVIOUS, VARIABLE_NEXT, TAB_PREVIOUS, TAB_NEXT, RENDER_START_PREVIOUS, RENDER_START_NEXT, RENDER_PREVIOUS, RENDER_NEXT,
  WIRING_PREVIOUS, WIRING_NEXT, HELP_PREVIOUS, HELP_NEXT, sha256, count, version, sequence, title, summary, notes
};
