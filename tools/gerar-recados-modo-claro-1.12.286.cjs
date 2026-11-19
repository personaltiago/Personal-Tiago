'use strict';

// Gera o pacote 1.12.286 (sem assinatura) a partir do pacote 1.12.285 (seq 391). Muda só o professor.html, e só o estilo (CSS).
// Motivo: no Painel do professor, o cartão "Recados do dia" (que ocupa o lugar do mascote quando o mascote está desligado) tem
// o fundo escuro fixo (#191b1f) em qualquer modo, mas a cor do texto segue o tema. No modo claro o texto vira escuro
// (#17131d, #202126) sobre aquele fundo escuro: contraste de 1,06:1, ilegível. Só o título "Recados do dia", em verde-limão
// fixo, aparecia. O cartão equivalente do aluno já tem uma regra própria para o modo claro; o do professor não tinha.
// O que muda:
//  1) No modo claro (html[data-agenda-color-mode="light"], o mesmo marcador que o aplicativo já usa para saber o modo), o
//     cartão passa a usar o fundo (--ac-surface), a borda (--ac-accent-border), o texto (--ac-text) e a cor do título
//     (--ac-accent) do tema escolhido. São as variáveis da paleta, que o aplicativo já garante legíveis entre si
//     (texto >= 4,65:1 e destaque >= 4,75:1 sobre o fundo) nos cinco temas e em temas personalizados.
//  2) No modo escuro nada muda: as duas regras novas só valem com o marcador do modo claro, então o cartão escuro continua
//     exatamente como era (a regra original não é tocada).
// As regras novas têm mais especificidade que a regra original (que usa !important), então vencem sem depender da ordem.
// Não mudam: tamanho, margens, posição, texto do recado, o cartão do mascote ligado, o cartão do aluno, index.html,
// avaliacoes.html, cadastro.html, dados, Firebase, descanso, cronômetros, alarmes e notificações.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.286';
const sequence = 392;
const title = 'Recados no modo claro';
const summary = 'No modo claro, o cartão Recados do dia do Painel deixa de ficar escuro: usa o fundo e as cores do tema, e o texto fica legível.';
const notes = 'No Painel do professor, o cartão Recados do dia (que aparece no lugar do mascote quando ele está desligado) tinha o fundo escuro fixo em qualquer modo. No modo claro o texto ficava escuro sobre esse fundo e não dava para ler. '
  + 'Agora, no modo claro, o cartão usa o fundo, a borda, o texto e a cor do título do próprio tema escolhido (Atual, Roxo Neon, Metal 3D, Performance Pro e Roxo Profundo, e também temas personalizados), com o mesmo tamanho e a mesma posição de antes. '
  + 'No modo escuro nada muda: o cartão continua exatamente como era. '
  + 'Só o arquivo professor.html muda, e só o estilo visual (duas regras de CSS). Nenhum dado, tela, regra, botão ou texto foi alterado. O cartão do aluno e o cartão do mascote (quando o mascote está ligado) também não foram alterados. '
  + 'Este pacote inclui tudo até Excluídos da lista (1.12.285). Descanso, cronômetros, alarmes e notificações não foram alterados.';

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

function count(text, part) {
  assert.ok(typeof part === 'string' && part.length > 0, 'Trecho vazio não pode ser procurado');
  let total = 0;
  for (let at = text.indexOf(part); at >= 0; at = text.indexOf(part, at + part.length)) total++;
  return total;
}

// Uma edição troca `previous` por `next`; o trecho precisa existir exatamente `times` vez(es) (padrão: uma).
function replaceIn(text, previous, next, times, label) {
  assert.equal(count(text, previous), times, 'O trecho esperado existe ' + count(text, previous) + ' vez(es), e não ' + times + ': ' + label);
  return text.split(previous).join(next);
}

// `absent` é o trecho que só existe depois da edição: como o texto novo começa com a âncora, sem essa trava a edição poderia ser
// aplicada de novo e duplicaria as regras.
function applyEdit(page, edit) {
  if (edit.absent) assert.equal(count(page, edit.absent), 0, 'Esta edição já foi aplicada: ' + edit.name);
  return replaceIn(page, edit.previous, edit.next, edit.times || 1, edit.name);
}

// Desfaz uma edição (usado só pelos testes, para provar que nada além das edições mudou).
function undoEdit(page, edit) {
  assert.ok(edit.next.length > 0, 'Edição sem texto novo não pode ser desfeita: ' + edit.name);
  return applyEdit(page, {...edit, previous: edit.next, next: edit.previous, absent: undefined});
}

// ---------- Estilo ----------
// A âncora é a regra do cartão do aluno no modo claro, que já existe e é única no professor.html. As regras novas entram logo
// depois dela, no mesmo nível da folha de estilo (fora de @media).
const CSS_ANCHOR = '.ap-mascot-home.ap-recado-only.ap-mascot-light{background:#fff!important;color:#292631!important}';
const LIGHT_CARD = 'html[data-agenda-color-mode="light"] .ap-teacher-mascot.ap-recado-only';
const LIGHT_TITLE = LIGHT_CARD + ' .ap-mascot-recados strong';
// Os valores depois da vírgula só valem se a variável do tema não existir (não acontece com o marcador do modo claro, que
// o aplicativo só coloca junto com a paleta); formam sempre um par legível: #17131d sobre #fff e #7437b8 sobre #fff.
const CSS_CARD = LIGHT_CARD + '{background-color:var(--ac-surface,#fff)!important;border-color:var(--ac-accent-border,var(--ac-line,#d1d0d4))!important;color:var(--ac-text,#17131d)!important}';
const CSS_TITLE = LIGHT_TITLE + '{color:var(--ac-accent,#7437b8)!important}';
const CSS_NEXT = CSS_ANCHOR + CSS_CARD + CSS_TITLE;

const STYLE_EDITS = [
  {name: 'Estilo: cartão Recados do dia do professor no modo claro', previous: CSS_ANCHOR, next: CSS_NEXT, absent: LIGHT_CARD + '{'}
];

const TEACHER_EDITS = [...STYLE_EDITS];
const edits = {'professor.html': TEACHER_EDITS};

function applyAll(page, list) {
  return list.reduce((current, edit) => applyEdit(current, edit), page);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.285');
  assert.equal(source.sequence, 391);
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files};
  for (const [name, list] of Object.entries(edits)) files[name] = applyAll(original.files[name], list);
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.286-Recados-Modo-Claro-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-recados-modo-claro-1.12.286.cjs <pacote-1.12.285.agenda.json> [saida.agenda.json]');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, applyAll, applyEdit, undoEdit, edits, TEACHER_EDITS, STYLE_EDITS,
  CSS_ANCHOR, CSS_NEXT, CSS_CARD, CSS_TITLE, LIGHT_CARD, LIGHT_TITLE, sha256, count, version, sequence, title, summary, notes
};
