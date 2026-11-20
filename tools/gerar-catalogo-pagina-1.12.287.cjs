'use strict';

// Gera o pacote 1.12.287 (sem assinatura) a partir do pacote 1.12.286 (seq 392). Muda só o professor.html, e só o estilo (CSS).
// Motivo (vídeo do Tiago, Mais > Catálogo de exercícios): a janela abria como um cartão por cima da página Mais e, ao arrastar o
// dedo, a página de trás também se mexia. Reproduzido no Chrome com toque de verdade: as 38 janelas do aplicativo (.dialog) usam o
// mesmo componente, que não tem nenhuma trava de rolagem. Arrastar o dedo na parte escura, no título ou além do começo/fim do
// cartão passa a rolagem para a página de trás (a rolagem "encadeia" para o elemento de baixo).
// O que muda:
//  1) Trava da página de trás, para todas as janelas. Com uma janela aberta (o aplicativo já põe a classe dialog-open no <body>),
//     o corpo da página passa a overflow:hidden. Só em aparelho de toque (@media hover:none ou pointer:coarse): no computador
//     com mouse a barra de rolagem sumiria e a página deslocaria alguns pixels. Além disso, a janela e o cartão passam a usar
//     overscroll-behavior:contain (o aplicativo já faz isso no cartão da importação de PDF e no painel de cores).
//     O cartão continua rolando por dentro; ao fechar a janela, o aplicativo já devolve a página ao ponto em que estava.
//     Não usa touch-action: no WebKit (iPhone) o valor none de um elemento pai vale também para os filhos e poderia travar a
//     rolagem do próprio cartão.
//  2) Catálogo de exercícios (#workoutCatalogDialog) como página inteira: sem padding na janela, cartão com 100% da largura e da
//     altura, sem borda, sem canto arredondado e sem sombra, com a mesma cor do tema. O espaço da barra Voltar/Painel (que fica
//     por cima, fixa) entra como padding-bottom do cartão; no tema Performance Pro, que esconde essa barra, volta ao padrão.
//     Vale também quando o catálogo é aberto por cima de outra janela (escolher exercício para o treino).
// As regras novas ficam num bloco <style> próprio (id dialog-scroll-lock-catalog-page), logo antes de previous-page-navigation.
// As do Catálogo usam o id da janela, então vencem as regras já existentes (inclusive as com !important do tema Performance Pro)
// sem depender da ordem. Não mudam: o visual das outras 37 janelas, scripts, dados, Firebase, descanso, cronômetros, alarmes,
// notificações, index.html, avaliacoes.html e cadastro.html.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.287';
const sequence = 393;
const title = 'Catálogo como página';
const summary = 'O Catálogo de exercícios abre como uma página inteira e, com qualquer janela aberta, a página de trás deixa de se mexer quando você arrasta o dedo.';
const notes = 'No celular, ao abrir uma janela do aplicativo (como o Catálogo de exercícios), a página de trás continuava se mexendo quando você arrastava o dedo, e a janela parecia estar por cima de outra página. '
  + 'Agora, com qualquer janela aberta, a página de trás fica parada: arrastar o dedo na parte escura, no título ou no começo e no fim do cartão não move mais nada atrás, e o cartão continua rolando normalmente por dentro. Ao fechar a janela, a página volta para o mesmo ponto em que estava. '
  + 'Além disso, o Catálogo de exercícios agora abre como uma página inteira: ocupa a tela toda, sem a faixa da página de trás por cima e sem cantos arredondados, com a barra Voltar e Painel no mesmo lugar e a lista terminando com a mesma folga de antes. Vale também quando o catálogo é aberto para escolher um exercício dentro de um treino. '
  + 'Os cinco temas (Atual, Roxo Neon, Metal 3D, Performance Pro e Roxo Profundo), no modo claro e no escuro, mantêm as cores de sempre. As outras janelas continuam com o mesmo visual de antes; só deixam de mover a página de trás. '
  + 'Só o arquivo professor.html muda, e só o estilo visual (regras de CSS). Nenhum dado, tela, regra, botão ou texto foi alterado. Este pacote inclui tudo até Recados no modo claro (1.12.286). Descanso, cronômetros, alarmes e notificações não foram alterados.';

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

// `absent` é o trecho que só existe depois da edição: como o texto novo termina com a âncora, sem essa trava a edição poderia
// ser aplicada de novo e duplicaria o bloco.
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
const STYLE_ID = 'dialog-scroll-lock-catalog-page';
const STYLE_OPEN = '<style id="' + STYLE_ID + '">';
// A âncora é a abertura do bloco de estilo que já cuida do layout das janelas com a barra Voltar/Painel (id único no professor.html).
const CSS_ANCHOR = '<style id="previous-page-navigation">';

const LOCK_MEDIA = '@media(hover:none),(pointer:coarse)';
const CSS_LOCK_BODY = LOCK_MEDIA + '{body.dialog-open{overflow:hidden}}';
const CSS_CONTAIN = '.dialog,.dialog>.sheet{overscroll-behavior:contain}';
const CATALOG_OPEN = '#workoutCatalogDialog.dialog.open';
const CSS_CATALOG_DIALOG = CATALOG_OPEN + '{padding:0!important}';
const CSS_CATALOG_SHEET = CATALOG_OPEN + '>.sheet{width:100%;height:100%!important;max-height:none!important;border-width:0;border-radius:0;box-shadow:none;padding-top:calc(18px + env(safe-area-inset-top));padding-bottom:calc(92px + env(safe-area-inset-bottom))}';
const PRO_SELECTOR = 'html[data-agenda-design=pro-tl] ' + CATALOG_OPEN + '>.sheet';
const CSS_CATALOG_PRO = PRO_SELECTOR + '{padding-bottom:calc(22px + env(safe-area-inset-bottom))}';
const CSS_RULES = CSS_LOCK_BODY + CSS_CONTAIN + CSS_CATALOG_DIALOG + CSS_CATALOG_SHEET + CSS_CATALOG_PRO;
const STYLE_BLOCK = STYLE_OPEN + CSS_RULES + '</style>';

const STYLE_EDITS = [
  {name: 'Estilo: trava da página de trás nas janelas e Catálogo de exercícios como página', previous: CSS_ANCHOR, next: STYLE_BLOCK + CSS_ANCHOR, absent: STYLE_OPEN}
];

const TEACHER_EDITS = [...STYLE_EDITS];
const edits = {'professor.html': TEACHER_EDITS};

function applyAll(page, list) {
  return list.reduce((current, edit) => applyEdit(current, edit), page);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.286');
  assert.equal(source.sequence, 392);
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files};
  for (const [name, list] of Object.entries(edits)) files[name] = applyAll(original.files[name], list);
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.287-Catalogo-Pagina-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-catalogo-pagina-1.12.287.cjs <pacote-1.12.286.agenda.json> [saida.agenda.json]');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, applyAll, applyEdit, undoEdit, edits, TEACHER_EDITS, STYLE_EDITS,
  STYLE_ID, STYLE_OPEN, STYLE_BLOCK, CSS_ANCHOR, CSS_RULES, LOCK_MEDIA, CSS_LOCK_BODY, CSS_CONTAIN, CATALOG_OPEN,
  CSS_CATALOG_DIALOG, CSS_CATALOG_SHEET, CSS_CATALOG_PRO, PRO_SELECTOR, sha256, count, version, sequence, title, summary, notes
};
