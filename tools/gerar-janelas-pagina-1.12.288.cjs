'use strict';

// Gera o pacote 1.12.288 (sem assinatura) a partir do pacote 1.12.287 (seq 393). Muda só o professor.html, e só o estilo (CSS).
// Motivo (Tiago, 19/11): depois do Catálogo de exercícios, pediu o mesmo para as outras janelas ("faz tudo de uma vez"): elas abrem
// como um cartão por cima de outra página, e ele quer que abram como página. O 1.12.287 já parou a página de trás em todas as
// janelas e transformou o Catálogo em página; este pacote estende a apresentação como página às outras, num bloco só, e substitui
// o bloco do 1.12.287 (o pacote inclui tudo do 1.12.287, então basta subir este).
// O aplicativo tem 38 janelas (.dialog, mesmo componente). Cada uma está em exatamente uma destas listas:
//  - PAGE_WINDOWS (33): passam a abrir como página inteira, em aparelho de toque;
//  - KEPT_WINDOWS (5): ficam exatamente como estavam (só ganham a trava da página de trás, que vem do 1.12.287):
//      workoutStudentDialog  Ficha de treino: já é uma página (com a barra do topo e fundo opaco) desde antes;
//      workoutDayDialog      Exercícios (treino em andamento): cronômetro do treino, contagem/despertador de fim do treino e
//                            os atalhos do intervalo moram nela;
//      workoutRestDialog     Intervalo: o contador do descanso;
//      workoutBisetDialog    Execução do bi-set: o descanso do bi-set, contando ao vivo;
//      workoutVideoDialog    Vídeo do exercício: o próprio aplicativo calcula o tamanho do vídeo (fitWorkoutVideoWindow) e a
//                            janela abre por cima do treino.
//    Regra do projeto: descanso, cronômetros, alarmes e notificações não são mudados sem pedido específico. O Tiago pode pedir
//    para incluir as janelas do treino ao vivo; é só mudar as listas (e o teste confere que cada janela está em uma lista só).
// O que muda nas 33: a janela (.dialog.open) fica sem padding e o cartão (.sheet) ocupa 100% da largura e da altura, sem borda,
// sem canto arredondado e sem sombra, com a mesma cor do tema. O espaço da barra Voltar/Painel (fixa, por cima) entra como
// padding-bottom do cartão; no tema Performance Pro, que esconde essa barra, volta ao padrão. As regras usam o id da janela
// (:is(#a,#b,...)), então vencem, por especificidade, as regras que já existiam (inclusive as !important do Performance Pro).
// Só em aparelho de toque (@media hover:none ou pointer:coarse): no computador com mouse as janelas continuam como cartão.
// Não muda: scripts, dados, Firebase, descanso, cronômetros, alarmes, notificações, as 5 janelas acima (fora a trava),
// index.html, avaliacoes.html e cadastro.html.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.288';
const sequence = 394;
const title = 'Janelas como página';
const summary = 'As janelas do aplicativo (aluno, aulas, nova ficha, catálogo, cadastro por link, comprovante e outras) abrem como página inteira, e a página de trás não se mexe mais.';
const notes = 'No celular, as janelas do aplicativo abriam como um cartão por cima de outra página e, ao arrastar o dedo, a página de trás também se mexia. '
  + 'Agora 33 janelas abrem como uma página inteira: ocupam a tela toda, sem a faixa da página de trás por cima e sem cantos arredondados. A barra Voltar e Painel continua embaixo, e o fim da rolagem fica livre dela.\n\n'
  + 'Janelas que viraram página. Alunos: Novo aluno, Perfil do aluno, Tipo de aluno, Editar WhatsApp, Adicionar local, Foto do aluno e Evolução do aluno. '
  + 'Aulas: Nova aula, Aulas e horários, Criar reposição e Adicionar à lista de espera. '
  + 'Personal: Perfil do personal, Enquadrar foto e Painel de cores. '
  + 'Cadastro: Cadastro por link (com Alunos para aprovar e Lista de alunos), Área do aluno e Conectar as áreas dos alunos. '
  + 'Financeiro: Conferir comprovante Pix e Comprovante do pagamento. '
  + 'Treino: Importar aluno por PDF, Nova ficha de treino, Adicionar treino, Adicionar exercício, Catálogo de exercícios, Técnicas (com Técnica e Editar técnica), Bi-set · Escolher exercício, Criar bi-set, Visualização do aluno, Finalizar treino, Evolução (com Feedbacks) e Editar observações.\n\n'
  + 'Com qualquer janela aberta, a página de trás fica parada: arrastar o dedo no título, no começo ou no fim do conteúdo não move mais nada atrás, e a janela continua rolando normalmente por dentro. Ao fechar, a página de trás está onde estava.\n\n'
  + 'Ficam como estavam, de propósito: a Ficha de treino (que já era uma página), o treino em andamento (Exercícios), o Intervalo, a Execução do bi-set e o Vídeo do exercício. Elas têm cronômetro, descanso, despertador ou um tamanho que o próprio aplicativo calcula, e só ganham a página de trás parada. Descanso, cronômetros, alarmes e notificações não foram alterados.\n\n'
  + 'A apresentação como página vale em aparelho de toque (celular e tablet); no computador com mouse as janelas continuam como cartão. Os cinco temas (Atual, Roxo Neon, Metal 3D, Performance Pro e Roxo Profundo), no modo claro e no escuro, mantêm as cores de sempre.\n\n'
  + 'Só o arquivo professor.html muda, e só o estilo visual (regras de CSS). Nenhum dado, tela, regra, botão ou texto foi alterado. Este pacote inclui o 1.12.287 (Catálogo como página e página de trás parada) e tudo até Recados no modo claro (1.12.286).';

// As 38 janelas, na ordem em que aparecem no professor.html (a última é criada pelo script, não está no HTML).
const PAGE_WINDOWS = [
  'waitlistEditor', 'colorPanelDialog', 'trainerPhotoCropDialog', 'trainerProfileDialog', 'lessonDialog', 'studentLessonsDialog',
  'studentProfileDialog', 'workoutPdfImportDialog', 'workoutPlanDialog', 'workoutDayEditDialog', 'workoutTechniquesDialog',
  'workoutTechniqueDetailDialog', 'workoutTechniqueEditorDialog', 'workoutExerciseDialog', 'workoutCatalogDialog',
  'workoutAudienceDialog', 'workoutExecutionDialog', 'workoutHistoryDialog', 'workoutFeedbackDialog', 'studentPhotoDialog',
  'studentLocationDialog', 'studentPhoneDialog', 'studentTypeDialog', 'studentDialog', 'rescheduleDialog',
  'workoutBisetPartnerDialog', 'workoutBisetEditorDialog', 'registrationLinkDialog', 'studentAreaDialog',
  'studentAreaConnectionDialog', 'financeReceiptDialog', 'financeReceiptViewDialog', 'studentEvolutionDialog'
];
const KEPT_WINDOWS = {
  workoutStudentDialog: 'Ficha de treino: já é uma página (barra do topo e fundo opaco)',
  workoutDayDialog: 'Exercícios (treino em andamento): cronômetro, despertador de fim do treino e atalhos do intervalo',
  workoutRestDialog: 'Intervalo: contador do descanso',
  workoutBisetDialog: 'Execução do bi-set: descanso do bi-set ao vivo',
  workoutVideoDialog: 'Vídeo do exercício: tamanho calculado pelo aplicativo (fitWorkoutVideoWindow), abre por cima do treino'
};

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

// `absent` é o trecho que só existe depois da edição: sem essa trava a edição poderia ser aplicada de novo.
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
const STYLE_ID = 'dialog-scroll-lock-pages';
const STYLE_OPEN = '<style id="' + STYLE_ID + '">';
const PREVIOUS_STYLE_ID = 'dialog-scroll-lock-catalog-page';
// O bloco do 1.12.287, que este pacote substitui (cópia exata; o teste confere contra o gerador do 1.12.287).
const PREVIOUS_STYLE_BLOCK = '<style id="dialog-scroll-lock-catalog-page">@media(hover:none),(pointer:coarse){body.dialog-open{overflow:hidden}}.dialog,.dialog>.sheet{overscroll-behavior:contain}#workoutCatalogDialog.dialog.open{padding:0!important}#workoutCatalogDialog.dialog.open>.sheet{width:100%;height:100%!important;max-height:none!important;border-width:0;border-radius:0;box-shadow:none;padding-top:calc(18px + env(safe-area-inset-top));padding-bottom:calc(92px + env(safe-area-inset-bottom))}html[data-agenda-design=pro-tl] #workoutCatalogDialog.dialog.open>.sheet{padding-bottom:calc(22px + env(safe-area-inset-bottom))}</style>';
// O bloco fica onde o do 1.12.287 estava: logo antes do estilo que cuida do layout das janelas com a barra Voltar/Painel.
const CSS_ANCHOR = '<style id="previous-page-navigation">';

const TOUCH_MEDIA = '@media(hover:none),(pointer:coarse)';
const CSS_CONTAIN = '.dialog,.dialog>.sheet{overscroll-behavior:contain}';
const CSS_LOCK_BODY = 'body.dialog-open{overflow:hidden}';
const PAGE_LIST = ':is(' + PAGE_WINDOWS.map(id => '#' + id).join(',') + ')';
const PAGE_OPEN = PAGE_LIST + '.dialog.open';
const PAGE_SHEET = PAGE_OPEN + '>.sheet';
const PRO_SELECTOR = 'html[data-agenda-design=pro-tl] ' + PAGE_SHEET;
// Cada declaração do cartão vale com !important: o aplicativo já tem regras !important sobre estas mesmas propriedades
// (.trainer-crop-sheet{max-width:480px!important}, .color-panel-sheet{border-radius:22px!important} a partir de 600px), e o id da janela
// (especificidade maior) garante que esta apresentação vence em qualquer tema, tamanho de tela e estado.
const SHEET_DECLARATIONS = [
  ['width', '100%'], ['max-width', 'none'], ['height', '100%'], ['max-height', 'none'],
  ['border-width', '0'], ['border-radius', '0'], ['box-shadow', 'none'],
  ['padding-top', 'calc(18px + env(safe-area-inset-top))'], ['padding-bottom', 'calc(92px + env(safe-area-inset-bottom))']
];
const PRO_DECLARATIONS = [['padding-bottom', 'calc(22px + env(safe-area-inset-bottom))']];
const declarations = list => list.map(([property, value]) => property + ':' + value + '!important').join(';');
// Em paisagem, num aparelho com recorte de câmera (iPhone), a janela não passa por baixo do recorte: o espaço do recorte fica nas laterais.
const CSS_PAGE_DIALOG = PAGE_OPEN + '{padding:0 env(safe-area-inset-right) 0 env(safe-area-inset-left)!important}';
const CSS_PAGE_SHEET = PAGE_SHEET + '{' + declarations(SHEET_DECLARATIONS) + '}';
const CSS_PAGE_PRO = PRO_SELECTOR + '{' + declarations(PRO_DECLARATIONS) + '}';
const CSS_TOUCH = TOUCH_MEDIA + '{' + CSS_LOCK_BODY + CSS_PAGE_DIALOG + CSS_PAGE_SHEET + CSS_PAGE_PRO + '}';
const CSS_RULES = CSS_CONTAIN + CSS_TOUCH;
const STYLE_BLOCK = STYLE_OPEN + CSS_RULES + '</style>';

const STYLE_EDITS = [
  {name: 'Estilo: janelas como página (33) e trava da página de trás (38), no lugar do bloco do 1.12.287', previous: PREVIOUS_STYLE_BLOCK, next: STYLE_BLOCK, absent: STYLE_OPEN}
];

const TEACHER_EDITS = [...STYLE_EDITS];
const edits = {'professor.html': TEACHER_EDITS};

function applyAll(page, list) {
  return list.reduce((current, edit) => applyEdit(current, edit), page);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.287');
  assert.equal(source.sequence, 393);
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  assert.equal(new Set([...PAGE_WINDOWS, ...Object.keys(KEPT_WINDOWS)]).size, PAGE_WINDOWS.length + Object.keys(KEPT_WINDOWS).length, 'Uma janela está em mais de uma lista');
  const { agendaSignature, ...original } = source;
  const files = {...original.files};
  for (const [name, list] of Object.entries(edits)) files[name] = applyAll(original.files[name], list);
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.288-Janelas-Como-Pagina-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-janelas-pagina-1.12.288.cjs <pacote-1.12.287.agenda.json> [saida.agenda.json]');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, applyAll, applyEdit, undoEdit, edits, TEACHER_EDITS, STYLE_EDITS,
  STYLE_ID, STYLE_OPEN, STYLE_BLOCK, PREVIOUS_STYLE_ID, PREVIOUS_STYLE_BLOCK, CSS_ANCHOR, CSS_RULES,
  TOUCH_MEDIA, CSS_CONTAIN, CSS_LOCK_BODY, CSS_TOUCH, PAGE_LIST, PAGE_OPEN, PAGE_SHEET, PRO_SELECTOR, CSS_PAGE_DIALOG, CSS_PAGE_SHEET, CSS_PAGE_PRO, SHEET_DECLARATIONS, PRO_DECLARATIONS,
  PAGE_WINDOWS, KEPT_WINDOWS, sha256, count, version, sequence, title, summary, notes
};
