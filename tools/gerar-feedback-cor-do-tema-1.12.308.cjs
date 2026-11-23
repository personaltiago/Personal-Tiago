'use strict';

// Gera o pacote 1.12.308 / 414 (sem assinatura) a partir do 1.12.307 / 413 da main (SHA-256 conferido).
// Pedido: Tiago, 23/11/2026 18:47, com prints: o cartão de feedback compartilhado no Status "saiu verde" e, na janela de
// feedbacks, "tem muito azul mas na hora que eu entrei no feedback só ele tá verde". A cor tem que seguir o tema do professor
// (ou do aluno), e ele pediu para conferir com todas as cores.
//
// Causa: o estilo compartilhado do feedback (ap-feedback-css, igual no app do aluno e no do professor) usa
// --fb-accent:var(--ac-primary,var(--accent,#b6ff26)). O app do aluno define essa cor; o do professor chama a cor do tema de
// --ac-accent (sistema AgendaColors) e não tem --ac-primary nem --accent, então caía no verde #b6ff26. O cartão do professor
// copia a cor do título da janela, e por isso também saía verde.
// Agora (só o professor.html, em dois blocos novos; o estilo compartilhado não muda):
//  - ap-feedback-theme-css (logo depois do ap-feedback-css): as janelas de feedback do professor usam --ac-accent, a cor do
//    tema dele, que o AgendaColors já calcula legível no fundo da tela (claro ou escuro).
//  - ap-feedback-theme (fim da página): o cartão de imagem do professor usa a cor do tema, clareada até ler bem no fundo
//    escuro do cartão (contraste ≥ 4,5, a mesma regra do app do aluno).
// O app do aluno já seguia o tema do aluno e não muda.
//
// Uso: node tools/gerar-feedback-cor-do-tema-1.12.308.cjs [pacote-1.12.307.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.308';
const sequence = 414;
const title = 'Feedback na cor do tema';
const summary = 'A janela de feedbacks e o cartão de imagem do professor passam a usar a cor do tema dele, em vez do verde fixo. O app do aluno já seguia o tema do aluno.';
const notesText = 'Feedback na cor do tema.\n\n'
  + 'Antes, no app do professor, a janela "Feedbacks dos alunos" e o cartão de imagem compartilhado saíam sempre verdes, '
  + 'qualquer que fosse o tema escolhido.\n\n'
  + 'Agora:\n'
  + '- a janela de feedbacks usa a cor do seu tema, nos modos claro e escuro;\n'
  + '- o cartão de imagem (Salvar e Compartilhar) usa a mesma cor, clareada só o necessário para ler bem no fundo escuro do '
  + 'cartão. O símbolo e a barra do topo acompanham.\n\n'
  + 'Conferido com os 5 visuais e as 24 combinações de cores.\n\n'
  + 'O app do aluno já seguia o tema do aluno e não muda.\n\n'
  + 'O que não muda: textos e conteúdo dos feedbacks, envio e respostas, treinos, agenda, financeiro, login, mascotes e o '
  + 'aplicativo do aluno.\n\n'
  + 'Inclui tudo do 1.12.307 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.307-Carga-Da-Ficha-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '59e739f68b0a71bf7b7a97041b12a047a40106cf44f6b9cd2e8be20d77841119';
const TARGET_NAME = 'AgendaPersonal-1.12.308-Feedback-Cor-Do-Tema-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

// Janelas de feedback do professor (.ap-feedback): a cor do tema. Seletor mais específico que o do estilo compartilhado.
const CSS = 'html .ap-feedback{--fb-accent:var(--ac-accent,var(--purple,#a12cff))}';

const JS = String.raw`(function(){
 'use strict';
 // 1.12.308: o cartão de feedback do professor usa a cor do tema dele (pedido do Tiago, 23/11/2026: "saiu verde").
 const card=window.APFeedbackCard;if(!card||typeof card.open!=='function'||typeof card.create!=='function')return;
 const HEX=/^#[0-9a-f]{6}$/i;
 const lum=hex=>{const c=[1,3,5].map(i=>{const v=parseInt(hex.slice(i,i+2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
 const GROUND=lum('#181c20'); // fundo do cartão
 // Clareia a cor só até ler bem no fundo escuro do cartão (contraste ≥ 4,5, a mesma regra do app do aluno).
 function readable(hex){
  for(let step=0;step<=40;step++){const mixed='#'+[1,3,5].map(i=>{const v=parseInt(hex.slice(i,i+2),16);return Math.round(v+(255-v)*step/40).toString(16).padStart(2,'0')}).join('');if((lum(mixed)+.05)/(GROUND+.05)>=4.5)return mixed}
  return '#ffffff';
 }
 function accent(fallback){
  const theme=String(getComputedStyle(document.documentElement).getPropertyValue('--ac-accent')||'').trim().toLowerCase();
  return readable(HEX.test(theme)?theme:HEX.test(String(fallback||''))?String(fallback).toLowerCase():'#a12cff');
 }
 const themed=options=>({...(options||{}),accent:accent(options?.accent)});
 window.APFeedbackCard=Object.freeze({create:(item,options)=>card.create(item,themed(options)),open:(item,options)=>card.open(item,themed(options)),accent});
})();`;

const CSS_BLOCK = '<style id="ap-feedback-theme-css">' + CSS + '</style>';
const JS_BLOCK = '<script id="ap-feedback-theme">' + JS + '\n</script>\n';
const SHARED_CSS = '<style id="ap-feedback-css">';

function editProfessor(html) {
  for (const id of ['ap-feedback-theme-css', 'ap-feedback-theme"'])
    assert.equal(count(html, id), 0, id + ' já existe no 1.12.307');
  assert.equal(count(html, SHARED_CSS), 1, 'O estilo compartilhado do feedback não aparece uma única vez');
  assert.equal(count(html, '</body>'), 1, 'O fim da página do professor não aparece uma única vez');
  // A causa: o estilo compartilhado chama --ac-primary/--accent, que o professor não tem; o tema do professor é --ac-accent.
  assert.equal(count(html, '--fb-accent:var(--ac-primary,var(--accent,#b6ff26))'), 1, 'O estilo compartilhado mudou: rever a correção');
  assert.equal(count(html, "root.style.setProperty('--ac-'+key,value)"), 1, 'O sistema de cores do professor mudou');
  assert.ok(html.includes("const result={bg,surface,raised,field,text:ink,muted,accent,"), 'A paleta do professor não tem mais a cor accent');
  for (const needed of ['window.APFeedbackCard=Object.freeze({create:w,open:async function(t,f){', 'await APFeedbackCard.open(i,{professional:'])
    assert.equal(count(html, needed), 1, 'Dependência ausente ou repetida no 1.12.307: ' + needed);
  const sharedEnd = html.indexOf('</style>', html.indexOf(SHARED_CSS)) + '</style>'.length;
  let out = html.slice(0, sharedEnd) + CSS_BLOCK + html.slice(sharedEnd);
  out = out.replace('</body>', () => JS_BLOCK + '</body>');
  return out;
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.307');
  assert.equal(source.sequence, 413);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notesText.length <= 4000, 'notas: ' + notesText.length);
  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'professor.html': editProfessor(original.files['professor.html'])};
  return {...original, files, version, sequence, notes: notesText, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.307 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME};
