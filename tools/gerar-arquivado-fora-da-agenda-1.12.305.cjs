'use strict';

// Gera o pacote 1.12.305 / 411 (sem assinatura) a partir do 1.12.304 / 410 da main (SHA-256 conferido).
// Pedido: Tiago, 23/11/2026 07:06 (fotos: uma aluna arquivada aparecendo na agenda de segunda 17:55): "como ela está arquivada não
// deveria constar que eu tenho que dar aula para ela… quando eu arquivo, ele deixa de ser aluno".
//
// Causa: arquivar (toggleStudentArchive, e o bloqueio por mensalidade atrasada) só marca student.archived. As aulas do aluno
// (state.lessons, inclusive as fixas semanais) continuam valendo em todo lugar que gera as aulas do dia.
// Correção (só o professor.html; nada é apagado):
//  - Aula de aluno arquivado sai de occurrences() (Hoje, Semana, Painel, reposições pendentes, resumo do pet) e de
//    blockingOccurrencesOnDate() (Horários livres e conflito por horário). Exceção: a aula marcada como "realizada" continua
//    aparecendo, porque é histórico do que aconteceu.
//  - candidateConflict() ignora as aulas de aluno arquivado: o horário dele fica livre para outro aluno.
//  - Reativar: as aulas voltam sozinhas (nada foi apagado). Antes de reativar, o app avisa se algum horário dele já foi ocupado.
//  - Mensagem de Arquivar passa a dizer que o aluno sai também da agenda.
//  - LEMBRETES (área protegida: despertador das aulas) e COBRANCA (financeiro): só entram com o sim do Tiago (constantes abaixo).
//    Resposta dele (23/11 07:13): "O despertador para e o lembrete para a aula para também […] o lembrete de pagamento tem que ser
//    mandado ainda, pois [se] a pessoa pagar aí eu desarquivo" → LEMBRETES ligado, COBRANCA desligado.
//    Com LEMBRETES, arquivar/reativar também reenvia os avisos ao Android na hora (syncNativeAlarms).
// Não muda: o cronômetro da aula (isOccurrence continua igual), login, treinos, avaliações, Firebase, descanso, sons, mascotes e o
// aplicativo do aluno.
//
// Uso: node tools/gerar-arquivado-fora-da-agenda-1.12.305.cjs [pacote-1.12.304.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

// Decisões do Tiago sobre as áreas protegidas (23/11/2026).
const LEMBRETES = true;  // parar o despertador/lembrete das aulas de aluno arquivado (pedido do Tiago, 23/11 07:13)
const COBRANCA = false;  // manter o lembrete de cobrança de aluno arquivado (pedido do Tiago, 23/11 07:13)

const version = '1.12.305';
const sequence = 411;
const title = 'Aluno arquivado sai da agenda';
const summary = LEMBRETES
  ? 'Aluno arquivado sai de Hoje, Semana, Painel e Horários livres, o horário dele fica livre e o despertador das aulas dele para. Nada é apagado: ao reativar, tudo volta.'
  : 'Aluno arquivado deixa de aparecer em Hoje, Semana, Painel e Horários livres, e o horário dele fica livre. Nada é apagado: ao reativar, as aulas voltam.';
const notesBase = 'Aluno arquivado sai da agenda.\n\n'
  + 'Ao arquivar um aluno, as aulas dele deixam de aparecer em Hoje, Semana, Painel e Horários livres, e o horário fica livre para '
  + 'outro aluno. As aulas já marcadas como realizadas continuam no histórico.\n\n'
  + 'Nada é apagado: ao reativar, as aulas voltam sozinhas. Se algum horário dele já tiver sido ocupado, o aplicativo avisa antes '
  + 'de reativar.\n\n';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.304-Icones-Perfil-Aluno-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '6bc7982e6e4b8daf4e32345d6cc287edf7ed9dbcbda81eb30ad59a21ea2cd1ef';
const TARGET_NAME = 'AgendaPersonal-1.12.305-Arquivado-Fora-Da-Agenda-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

function notes() {
  const extra = [LEMBRETES && 'O despertador das aulas de aluno arquivado também para, na hora em que você arquiva, e volta ao reativar.',
    COBRANCA ? 'O lembrete de cobrança de aluno arquivado também para.' : 'O lembrete de cobrança continua, para você cobrar e reativar quando ele pagar.'].filter(Boolean);
  const keep = ['login', 'alunos', 'treinos', 'financeiro', 'avaliações', 'Firebase', 'descanso', 'cronômetros', !LEMBRETES && 'alarmes', 'sons', 'mascotes'].filter(Boolean);
  return notesBase + (extra.length ? extra.join(' ') + '\n\n' : '') + 'O que não muda: ' + keep.join(', ') + ' e o aplicativo do aluno.\n\n'
    + 'Inclui tudo do 1.12.304 e deve ser instalado no lugar dele.';
}

// ---------------------------------------------------------------------------------------------------------------------------------
const HELPERS = '// 1.12.305: aluno arquivado sai da agenda (sem apagar nada). A aula "realizada" continua, porque é histórico.\n'
  + 'function lessonOwnerArchived(lesson){const s=lesson&&lesson.studentId?studentById(lesson.studentId):null;return !!s&&s.archived===true}\n'
  + 'function archivedLessonHidden(lesson,date){return lessonOwnerArchived(lesson)&&statusOf(lesson,date)!==\'realizada\'}\n';

const OUTSIDE = [
  ['as funções de aluno arquivado, antes de occurrences()', 'function occurrences(fromDate,countDays){', HELPERS + 'function occurrences(fromDate,countDays){'],
  ['occurrences() sem as aulas de aluno arquivado',
    'state.lessons.forEach(l=>{if(isOccurrence(l,ds)) out.push({lesson:l,date:ds,status:statusOf(l,ds)})});',
    'state.lessons.forEach(l=>{if(isOccurrence(l,ds)&&!archivedLessonHidden(l,ds)) out.push({lesson:l,date:ds,status:statusOf(l,ds)})});'],
  ['Horários livres e conflito por horário sem as aulas de aluno arquivado',
    "return state.lessons.filter(l=>l.id!==excludeLessonId&&isOccurrence(l,dateStr)&&statusOf(l,dateStr)!=='cancelada')",
    "return state.lessons.filter(l=>l.id!==excludeLessonId&&isOccurrence(l,dateStr)&&statusOf(l,dateStr)!=='cancelada'&&!archivedLessonHidden(l,dateStr))"],
  ['o conflito de nova aula ignora o horário de aluno arquivado',
    '  for(const existing of state.lessons){\n    if(existing.id===excludeLessonId)continue;\n',
    '  for(const existing of state.lessons){\n    if(existing.id===excludeLessonId||lessonOwnerArchived(existing))continue;\n'],
];
const OUTSIDE_LEMBRETES = ['os lembretes das aulas sem aluno arquivado (com o sim do Tiago)',
  'const lessons=state.lessons.map(lesson=>{', 'const lessons=state.lessons.filter(lesson=>!lessonOwnerArchived(lesson)).map(lesson=>{'];
// Arquivar/reativar salva por commitWorkoutChange(), que não reenvia os avisos ao Android. Sem isto, o despertador da aula só
// pararia (ou voltaria) quando Hoje, Semana ou Configurações fossem abertos.
const ARCHIVE_LEMBRETES = ['o despertador parar (ou voltar) na hora de arquivar ou reativar',
  " if(currentProfileStudentId===sid)renderStudentProfile();\n",
  " if(currentProfileStudentId===sid)renderStudentProfile();\n syncNativeAlarms(); // 1.12.305: o despertador das aulas dele para (ou volta) na hora.\n"];
const OUTSIDE_COBRANCA = ['o lembrete de cobrança sem aluno arquivado (com o sim do Tiago)',
  'const students=state.students.filter(s=>s.financeEnabled&&s.dueDate)', 'const students=state.students.filter(s=>s.financeEnabled&&s.dueDate&&s.archived!==true)'];

// ap-student-archive: a mensagem de Arquivar e o aviso de horário ocupado ao reativar.
const ARCHIVE = [
  ['o aviso de horário ocupado antes de reativar',
    " const archived=student.archived===true;\n",
    " const archived=student.archived===true;\n"
    + " // 1.12.305: ao reativar, as aulas voltam; avisa se algum horário dele foi ocupado enquanto estava arquivado.\n"
    + " const today=iso(new Date()),clashes=archived?state.lessons.filter(l=>l.studentId===sid&&(l.repeat!=='none'||l.date>=today)).map(l=>({lesson:l,clash:candidateConflict(l,l.id)})).filter(x=>x.clash):[];\n"
    + " const clashText=clashes.length?'\\n\\nAtenção: '+clashes.map(x=>(x.lesson.repeat==='weekly'?longDays[parseDate(x.clash.date).getDay()]:fmtDate(x.clash.date))+' '+x.lesson.time+' bate com '+(lessonParticipant(x.clash.lesson)?.name||'outra aula')).join('; ')+'. Ajuste a agenda depois de reativar.':'';\n"],
  ['a mensagem de Arquivar e Reativar',
    "'O aluno sai das listas ativas e seus treinos serão bloqueados no aplicativo ao sincronizar.')+'\\n\\nCadastro, fichas, avaliações, cargas e histórico de pagamentos serão mantidos.'))return false;",
    "'O aluno sai das listas ativas e da agenda, e seus treinos serão bloqueados no aplicativo ao sincronizar.')+'\\n\\nCadastro, fichas, aulas, avaliações, cargas e histórico de pagamentos serão mantidos.'+clashText))return false;"],
];

function replaceOnce(text, what, from, to) {
  assert.equal(count(text, from), 1, 'Não achei ' + what + ' uma única vez no 1.12.304');
  return text.replace(from, () => to);
}

function editBlock(html, id, changes) {
  const open = '<script id="' + id + '">';
  assert.equal(count(html, open), 1, 'O bloco ' + id + ' não aparece uma única vez');
  const start = html.indexOf(open) + open.length;
  const end = html.indexOf('</script>', start);
  let inner = html.slice(start, end);
  for (const [what, from, to] of changes) inner = replaceOnce(inner, what, from, to);
  return html.slice(0, start) + inner + html.slice(end);
}

function editProfessor(html) {
  for (const [what, from, to] of [...OUTSIDE, ...(LEMBRETES ? [OUTSIDE_LEMBRETES] : []), ...(COBRANCA ? [OUTSIDE_COBRANCA] : [])]) html = replaceOnce(html, what, from, to);
  html = editBlock(html, 'ap-student-archive', [...ARCHIVE, ...(LEMBRETES ? [ARCHIVE_LEMBRETES] : [])]);
  return html;
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.304');
  assert.equal(source.sequence, 410);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  const text = notes();
  assert.ok(text.length <= 4000, 'notas: ' + text.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'professor.html': editProfessor(original.files['professor.html'])};
  return {...original, files, version, sequence, notes: text, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.304 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME, LEMBRETES, COBRANCA};
