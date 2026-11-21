'use strict';

// Gera o pacote 1.12.292 (sem assinatura) a partir do pacote 1.12.291 (seq 397). Muda a tela do aluno (index.html) em dois trechos do
// feedback: o script ap-feedback-student e o estilo ap-feedback-css. O mesmo acréscimo de estilo entra na cópia do professor.html (sem
// efeito lá): o aplicativo trata ap-feedback-css como componente COMPARTILHADO (UpdateAreaPatch.SHARED: aluno e professor têm de ter o
// mesmo texto, e uma correção por área só vale se trocar as duas cópias para o mesmo conteúdo). Mexer só na do aluno deixaria as cópias
// diferentes e travaria qualquer correção futura desse estilo.
// Motivo (Tiago, 19/11): o aviso de feedback pendente aparece embaixo, dentro do pet ("Treino concluído · dê seu feedback — 1 resposta
// pendente · toque aqui"), muita gente não vê e precisa entrar no pet para encontrar. Ele pediu um sino no topo, ao lado do sino de
// notificações, "com o número 1, 2, 3", só do feedback.
// O que o pacote faz: no topo da tela do aluno (Início), ao lado do sino de notificações, aparece um botão de balão com o número de
// feedbacks pendentes. Tocar nele abre direto a janela do feedback ("Como foi hoje?"), sem entrar no pet. Quando não há feedback
// pendente, ou não há aluno logado (professor, visualização do aluno, cadastro por link), o botão não existe na tela.
//  - O número é o mesmo do aviso do pet: APFeedbackSync.pending().length (as 7 sessões mais recentes, mais as respostas na fila de envio).
//  - A cor do botão é a cor de destaque escolhida pelo aluno (--home-accent), como o sino e o ícone do WhatsApp. O número é branco, como o
//    do sino de notificações, e só fica escuro quando a cor do tema é clara demais para texto branco (contraste abaixo de 3:1).
//  - Com o botão, o topo tem quatro ícones. Para o "Olá, …!" nunca ser cortado no meio da palavra, quando o botão está na tela o topo
//    passa de grade para linhas que quebram: se o nome mais longo não couber ao lado dos ícones, os ícones descem para a linha de baixo.
//    Os ícones ficam 4 px afastados (e 4 px do nome) enquanto o botão aparece: com 8 px, "Olá, Jéssica!" já passava para duas linhas no
//    iPhone de 390 px; com 4 px, nomes de até 7 letras continuam na mesma linha de hoje (medido no Chrome real, 360–430 px).
//  - O aviso vermelho dentro do pet continua como estava. O ícone é um balão (e não um segundo sino) para o aluno não confundir os dois.
// Não muda: o resto do index.html e do professor.html, avaliacoes.html, cadastro.html, dados, respostas, Firebase, descanso, cronômetros,
// alarmes e notificações. No professor.html o acréscimo é inerte: só tem seletores do botão do sino (e do topo com a classe
// ap-feedback-bell-on), que só existem na tela do aluno. Não grava nada no aparelho e não usa a rede. A lista do feedback (APFeedbackSync) não é tocada: o pet continua
// lendo APFeedbackSync.items() inteira para as moedas.
// Como o conteúdo é montado: o MESMO algoritmo do aplicativo para blocos (UpdateAreaPatch.findBlocks, app 1.207): cada mudança troca o
// texto de dentro de um bloco <script id=...> ou <style id=...>; o texto atual precisa ter o SHA-256 "before" e o novo precisa ter o
// SHA-256 "after", senão o gerador para. Os componentes estão na lista que o aplicativo aceita para a área Evolução (módulo feedback),
// e o estilo é igual nas duas páginas antes e depois, então o mesmo conteúdo também poderia seguir como correção por área (o teste com o
// código Java real do aplicativo monta essa correção e confere que o resultado é o mesmo deste pacote).
// Numeração: sequência = número da versão + 106 (regra do projeto). 1.12.292 = sequência 398 = 291 (397) + 1. O pacote é completo e
// cumulativo: inclui tudo do 1.12.291 (as três correções de exercícios) e deve ser instalado no lugar dele. Os próximos pacotes
// completos devem partir deste (versão a partir de 1.12.293, sequência a partir de 399).

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const { findBlocks } = require('./gerar-correcoes-exercicios-1.12.291.cjs');

const version = '1.12.292';
const sequence = 398;
const title = 'Sino do feedback no topo do aluno';
const summary = 'Sino do feedback no topo da tela do aluno: mostra quantos feedbacks estão pendentes (1, 2, 3…) e abre a janela direto, sem entrar no pet. Inclui o 1.12.291.';
const notes = 'Sino do feedback no topo da tela do aluno. Até agora o aviso de feedback pendente aparecia só embaixo, dentro do pet, e muitos alunos não viam. '
  + 'Agora, quando o aluno tem feedback pendente, aparece no topo do Início, ao lado do sino de notificações, um botão de balão com o número de pendentes (1, 2, 3…). '
  + 'Tocar nele abre direto a janela "Como foi hoje?", sem entrar no pet. Quando o aluno responde e o envio é confirmado, o botão some. O aviso vermelho dentro do pet continua como estava.\n\n'
  + 'Como funciona. O número é o mesmo do aviso do pet ("1 resposta pendente"). O botão aparece só para o aluno logado com feedback pendente: no app do professor, na visualização do aluno e no cadastro por link ele não existe. '
  + 'O ícone é um balão, e não um segundo sino, para o aluno não confundir os dois. A cor do botão segue a cor de destaque que o aluno escolheu; o número é branco e só fica escuro quando a cor é clara demais para texto branco.\n\n'
  + 'O topo continua legível. Com o botão são quatro ícones ao lado do "Olá, …!". Os ícones ficam um pouco mais juntos enquanto o botão aparece, para o nome continuar na mesma linha. Se mesmo assim o nome não couber, os ícones passam para a linha de baixo, em vez de cortar o nome no meio da palavra. '
  + 'Sem feedback pendente o topo fica exatamente como era.\n\n'
  + 'Na tela do aluno (index.html) mudam dois trechos do feedback: o script e o estilo. O mesmo acréscimo de estilo entra na cópia do professor (professor.html), sem nenhum efeito lá: o aplicativo exige que as duas cópias do estilo do feedback sejam iguais. Nenhum dado, resposta, treino, Firebase ou envio de feedback foi alterado, a lista do feedback não foi tocada e descanso, cronômetros, alarmes e notificações não foram mexidos.\n\n'
  + 'Este pacote inclui o 1.12.291 (Exercícios incluídos: catálogo unificado, baixar catálogo e duplicatas) e tudo o que ele trazia, e deve ser instalado no lugar dele. '
  + 'A versão passa do 291 para o 292.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_VERSION = '1.12.291';
const SOURCE_SEQUENCE = 397;
// O pacote 1.12.291 entregue ao Tiago, sem assinatura (ainda não está na main quando este gerador foi escrito).
const SOURCE_NAME = 'AgendaPersonal-1.12.291-Exercicios-Incluidos-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '7153e570e9d7307536059ede5f179a2f4735ddbbee7eac9e200242a3e58a9fa0';

const END_BLOCK = /<\/\s*(?:script|style)\b/i;
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const sha256Bytes = bytes => createHash('sha256').update(bytes).digest('hex');

function count(text, part) {
  assert.ok(typeof part === 'string' && part.length > 0, 'Trecho vazio não pode ser procurado');
  let total = 0;
  for (let at = text.indexOf(part); at >= 0; at = text.indexOf(part, at + part.length)) total++;
  return total;
}

// ---------- Ícone ----------
// Balão de fala cheio (24×24): contorno com rabinho embaixo à esquerda e duas linhas de texto vazadas (fill-rule evenodd). Mesmo peso
// visual do sino cheio e do ícone do WhatsApp; sem traço, para as linhas vazadas não serem preenchidas pelo contorno.
const ICON_PATH = 'M5.5 3h13A3.5 3.5 0 0 1 22 6.5v8a3.5 3.5 0 0 1-3.5 3.5h-8l-4.1 3.5Q5.5 22.2 5.5 21v-3A3.5 3.5 0 0 1 2 14.5v-8A3.5 3.5 0 0 1 5.5 3z'
  + 'M7.4 7.6h9.2a.9.9 0 0 1 0 1.8H7.4a.9.9 0 0 1 0-1.8z'
  + 'M7.4 11.5h5.2a.9.9 0 0 1 0 1.8H7.4a.9.9 0 0 1 0-1.8z';

// ---------- Script (bloco ap-feedback-student) ----------
// A função f() do bloco (a que desenha o aviso do pet e os botões de feedback) termina nestas duas frases; o sino é desenhado por último,
// com o mesmo número de pendentes (e) que ela acabou de calcular. As duas funções novas ficam logo depois dela.
const JS_TAIL_BEFORE = 'c.classList.toggle("ap-feedback-pending",e>0))}function m(e=""){';
const JS_CALL = ',feedbackBell(e)}';
// Cor do número: branco (como o do sino de notificações) salvo se o contraste do branco com a cor do tema ficar abaixo de 3:1.
const JS_INK = [
  'function feedbackBellInk(hex){',
  'const lum=h=>{const c=[1,3,5].map(i=>{const v=parseInt(h.slice(i,i+2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]};',
  'return 1.05/(lum(hex)+.05)>=3?"#fff":"#0a151e"}'
].join('');
// O botão: criado uma vez, dentro de .home-actions e antes do sino de notificações; escondido (hidden) sem pendência ou sem aluno logado.
// O topo (.home-header) ganha a classe ap-feedback-bell-on só enquanto o botão aparece (é ela que liga o layout de linhas que quebram).
const JS_BELL = [
  'function feedbackBell(count){',
  'const actions=document.querySelector("#homeScroll .home-actions");if(!actions)return;',
  'let bell=a("apFeedbackBell");const show=!!t.uid()&&count>0;',
  'if(!bell){if(!show)return;bell=document.createElement("button");bell.id="apFeedbackBell";bell.type="button";bell.className="home-bell ap-feedback-bell";',
  'bell.innerHTML=\'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="' + ICON_PATH + '"/></svg><span id="apFeedbackBellCount" aria-hidden="true"></span>\';',
  'bell.onclick=()=>m()}',
  'if(bell.parentNode!==actions){const next=a("apStudentNotificationBell");actions.insertBefore(bell,next&&next.parentNode===actions?next:null)}',
  'bell.hidden=!show;actions.parentNode.classList.toggle("ap-feedback-bell-on",show);if(!show)return;',
  'const label="Feedback do treino, "+count+(1===count?" pendente":" pendentes"),raw=getComputedStyle(actions).getPropertyValue("--home-accent").trim();',
  'bell.setAttribute("aria-label",label);bell.title=label;a("apFeedbackBellCount").textContent=String(count);',
  'bell.style.setProperty("--fb-bell-ink",feedbackBellInk(/^#[0-9a-f]{6}$/i.test(raw)?raw:feedbackCardAccent()))}'
].join('');
const JS_TAIL_AFTER = 'c.classList.toggle("ap-feedback-pending",e>0))' + JS_CALL + JS_INK + JS_BELL + 'function m(e=""){';

// ---------- Estilo (bloco ap-feedback-css) ----------
// Acrescentado ao fim do bloco. O botão reaproveita .home-bell (tamanho 44×44, cor de destaque, posição relativa) e o número copia o do
// sino de notificações (#apStudentNotificationCount: mesmo tamanho, anel e fonte), com a cor do texto vinda de --fb-bell-ink.
// Layout com o botão: a grade do topo vira linhas que quebram (flex-wrap). O h1 não quebra palavra no meio (overflow-wrap:break-word não
// entra no cálculo do tamanho mínimo, ao contrário do anywhere que o topo usa), então a menor largura do nome é a da palavra mais longa;
// se essa palavra mais os ícones não couberem na linha, os ícones vão para a linha de baixo, à direita (margin-left:auto).
// Os 4 px entre os ícones e entre o nome e os ícones (column-gap e gap) são o que mantém o nome de 7 letras na mesma linha em 390 px; cada
// botão tem 44 px e o ícone só uns 24 px, então o vazio visível entre dois ícones continua em torno de 24 px.
const HEADER = '.student-home .home-header.ap-feedback-bell-on';
const CSS_BELL = [
  '.student-home .ap-feedback-bell svg{width:27px;height:27px;fill:currentColor;stroke:none}',
  '#apFeedbackBellCount{position:absolute;right:-2px;top:0;min-width:19px;height:19px;padding:0 4px;border:2px solid #0a151e;border-radius:12px;',
  'background:var(--home-accent);color:var(--fb-bell-ink,#fff);font:700 10px/15px Arial,sans-serif;text-align:center}',
  '.ap-feedback-bell[hidden]{display:none!important}',
  HEADER + '{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;column-gap:4px;row-gap:8px}',
  HEADER + ' .home-welcome{display:contents}',
  HEADER + ' .home-welcome h1{order:1;flex:1 1 0;min-width:min-content;overflow-wrap:break-word}',
  HEADER + ' .home-actions{order:2;margin-left:auto;gap:4px}',
  HEADER + ' #apHomeDailyMessage{order:3;flex:1 0 100%}'
].join('');

// ---------- Edições por bloco ----------
// before/after: SHA-256 do texto de dentro do bloco, antes (no 1.12.291) e depois.
const SCRIPT_EDIT = {
  id: 'ap-feedback-student', kind: 'script',
  before: 'fc36fe708f16fb4aab7cbb667d83c8a14796c3c0fd7d8567710c914dc0a26ede',
  after: '0730944c9db6f28900906000abeec9192bb953dc62ec0eebec18c2ba01ca3760',
  apply: inner => {
    assert.equal(count(inner, JS_TAIL_BEFORE), 1, 'O fim da função f() do feedback do aluno não está como esperado');
    return inner.split(JS_TAIL_BEFORE).join(JS_TAIL_AFTER);
  }
};
// O estilo é o mesmo nas duas páginas (SHA-256 igual antes e depois): é o que o aplicativo exige de um componente compartilhado.
const CSS_EDIT = {
  id: 'ap-feedback-css', kind: 'style',
  before: 'd441d2ff79a3dfd9b2b3c0105a7841faccf0fee5835f7bf1404ea2fd74a736f1',
  after: 'e0407658139b1392b21b1994aac0e305badc2e913a4dc983e721b9fadf2a7376',
  apply: inner => inner + CSS_BELL
};
const BLOCK_EDITS = {
  'index.html': [SCRIPT_EDIT, CSS_EDIT],
  'professor.html': [CSS_EDIT]
};
// Componentes que o aplicativo exige iguais nas duas páginas (UpdateAreaPatch.SHARED) e que este pacote toca.
const SHARED_BLOCKS = ['ap-feedback-css'];

// Troca o texto de dentro dos blocos pedidos (a mesma ideia do UpdateAreaPatch.replaceBlocks). Recusa conflito, bloco ausente e edição que
// já foi aplicada.
function editBlocks(html, edits) {
  assert.equal(typeof html, 'string', 'Página ausente');
  const blocks = findBlocks(html, new Map(edits.map(edit => [edit.id, edit])));
  const pending = [];
  for (const edit of edits) {
    const block = blocks.get(edit.id);
    assert.ok(block, 'O componente ' + edit.id + ' não existe no conteúdo em uso.');
    const current = html.slice(block.start, block.end);
    const hash = sha256(current);
    assert.notEqual(hash, edit.after, 'Esta edição já foi aplicada: ' + edit.id);
    assert.equal(hash, edit.before, 'Conflito em ' + edit.id + ': o bloco não é o do 1.12.291.');
    const next = edit.apply(current);
    assert.ok(!END_BLOCK.test(next), 'O conteúdo de ' + edit.id + ' fecha o bloco antes da hora');
    assert.equal(sha256(next), edit.after, 'O bloco ' + edit.id + ' não ficou como o esperado (SHA-256 diferente)');
    pending.push({block, next});
  }
  pending.sort((a, b) => a.block.start - b.block.start);
  let result = '', from = 0;
  for (const {block, next} of pending) {
    result += html.slice(from, block.start) + next;
    from = block.end;
  }
  return result + html.slice(from);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, SOURCE_VERSION);
  assert.equal(source.sequence, SOURCE_SEQUENCE);
  assert.equal(sequence, SOURCE_SEQUENCE + 1, 'A sequência deve ser a do 1.12.291 mais um');
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const sharedText = (pages, id) => ['index.html', 'professor.html'].map(page => {
    const block = findBlocks(pages[page], new Map([[id, {}]])).get(id);
    assert.ok(block, 'O componente compartilhado ' + id + ' não existe em ' + page);
    return pages[page].slice(block.start, block.end);
  });
  for (const id of SHARED_BLOCKS) assert.equal(...sharedText(original.files, id), 'O componente compartilhado ' + id + ' já não é igual no aluno e no professor do 1.12.291');
  const files = {...original.files};
  for (const [page, edits] of Object.entries(BLOCK_EDITS)) files[page] = editBlocks(original.files[page], edits);
  for (const id of SHARED_BLOCKS) assert.equal(...sharedText(files, id), 'O componente compartilhado ' + id + ' ficou diferente entre aluno e professor');
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}};
}

// Lê o 1.12.291 e confere o SHA-256 do arquivo.
function loadSource(sourceFile) {
  const bytes = readFileSync(sourceFile);
  assert.equal(sha256Bytes(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.291 entregue (SHA-256 diferente): ' + sourceFile);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.292-Sino-Feedback-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-sininho-feedback-1.12.292.cjs <pacote-1.12.291.agenda.json> [saida.agenda.json]');
  const data = makeUpdate(loadSource(sourceFile));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, loadSource, editBlocks, BLOCK_EDITS, SCRIPT_EDIT, CSS_EDIT, SHARED_BLOCKS, ICON_PATH, JS_TAIL_BEFORE, JS_TAIL_AFTER, JS_CALL, JS_INK, JS_BELL, CSS_BELL, HEADER,
  APP_ID, SOURCE_NAME, SOURCE_SHA256, SOURCE_VERSION, SOURCE_SEQUENCE, sha256, count, version, sequence, title, summary, notes
};
