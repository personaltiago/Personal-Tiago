'use strict';

// Gera o pacote 1.12.317 / 423 (sem assinatura) a partir do 1.12.316 / 422 (referência assinada; SHA-256 conferido).
// Pedido: Tiago, 26/11/2026 18:07 (prints de "Treino em andamento" e de uma série por tempo): "um quadradinho separando esse
// aqui [o tempo da aula] fica mais curto e ali na lateral ficasse tipo um cronômetro [...] para todos os treinos [...] para quando
// sobrar tempo"; "Aqui tu promete 30 segundos mas eu quero que seja sem meta [...] aparece [...] o [tempo] que a pessoa durou a
// última vez que fez". Respostas às perguntas: cronômetro livre contando para cima; trocar "Meta" por "Última"; 18:10 "deixa só o
// professor".
// Só no professor.html:
//  1. Blocos novos ap-cronometro-livre-css e ap-cronometro-livre (antes de </body>): no "Treino em andamento", o tempo da aula
//     fica num quadrado mais estreito e, ao lado, um cronômetro livre (Iniciar, Pausar, Continuar, Zerar), sem meta e sem som.
//     Um só para todos os treinos, guardado neste aparelho (localStorage apCronometroLivre): continua contando com o app fechado.
//  2. Script data-agenda-workout-series (sem id; "#fora-dos-blocos" no verificador): na série por tempo, embaixo do Iniciar, "Meta: 30s" vira "Última: 42 s" (o tempo da mesma série
//     no último treino concluído, o mesmo número da coluna "Último treino"), ou "Última: —". Séries por repetições não mudam.
// Não muda: a contagem e o despertador da aula, o descanso, o cronômetro da série (continua contando livre, como antes), alarmes,
// sons, o aluno (index.html), treinos salvos, Firebase, financeiro, login e mascotes.
//
// Uso: node tools/gerar-cronometro-livre-1.12.317.cjs [pacote-1.12.316.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.317';
const sequence = 423;
const title = 'Cronômetro livre no treino';
const summary = 'No Treino em andamento, um cronômetro livre ao lado do tempo da aula. Na série por tempo, aparece o tempo da última vez no lugar da meta.';
const notesText = 'Cronômetro livre no treino (professor).\n\n'
  + 'No Treino em andamento, o tempo da aula fica num quadrado mais estreito e, ao lado, aparece um cronômetro livre: Iniciar, '
  + 'Pausar, Continuar e Zerar. Ele conta para cima, sem meta e sem som. É um só para todos os treinos e continua contando com o '
  + 'app fechado; só zera quando você toca em Zerar.\n\n'
  + 'Nas séries por tempo (prancha, isometria), embaixo do Iniciar aparece o tempo que o aluno fez na mesma série no último treino '
  + '(Última: 42 s) no lugar da meta. O cronômetro da série continua contando livre, como antes.\n\n'
  + 'O que não muda: a contagem e o despertador da aula, o descanso, os alarmes, os sons, a área do aluno e os treinos salvos.\n\n'
  + 'Inclui tudo do 1.12.316 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.316-Smartwatch-No-Treino-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '88c89220889ee15a769be5843537197c42b10aefe819a1f86e481421c07dc991';
const TARGET_NAME = 'AgendaPersonal-1.12.317-Cronometro-Livre-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

const CSS = String.raw`
/* Cronômetro livre no Treino em andamento (1.12.317): o tempo da aula e o cronômetro lado a lado, com o mesmo visual. */
.ap-aula-cronos{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin:14px 0;align-items:stretch}
.ap-aula-cronos.ap-cronolivre-so{grid-template-columns:minmax(0,1fr)}
.ap-aula-cronos>.lesson-timer.lesson-timer{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:6px;margin:0;padding:12px;min-width:0}
.ap-aula-cronos .lesson-timer-copy{display:contents}
.ap-aula-cronos .lesson-timer-copy strong{order:1;margin:0;line-height:1.3}
.ap-aula-cronos .timer-count{order:2;font-size:calc((1.6rem) * var(--ap-ts,1));line-height:1.1;font-variant-numeric:tabular-nums;white-space:nowrap}
.ap-aula-cronos .lesson-timer-copy span{order:3;margin:0;line-height:1.4}
.ap-aula-cronos .lesson-timer>.btn,.ap-aula-cronos .ap-cronolivre-acoes{order:4}
.ap-aula-cronos .lesson-timer>.btn:not([hidden]),.ap-aula-cronos .ap-cronolivre-acoes{margin-top:auto}
.ap-aula-cronos .lesson-timer>.btn:not([hidden])~.btn{margin-top:0}
.ap-aula-cronos .lesson-timer>.btn{display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:6px 8px;font-size:calc((.75rem) * var(--ap-ts,1));line-height:1.2;text-align:center;white-space:normal}
.ap-aula-cronos .lesson-timer>.btn[hidden]{display:none}
.ap-aula-cronos .lesson-timer>.btn svg{width:17px;height:17px;flex:none}
.ap-cronolivre-acoes{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px}
.ap-cronolivre-acoes .btn{display:flex;align-items:center;justify-content:center;min-height:44px;min-width:0;padding:6px 4px;font-size:calc((.75rem) * var(--ap-ts,1));line-height:1.2;white-space:nowrap}
.ap-cronolivre-acoes .btn:disabled{opacity:.45;cursor:not-allowed}
.ap-cronolivre[data-estado="contando"] .timer-count{color:var(--ac-accent,#c9a7ff)}
@media (max-width:339px){.ap-aula-cronos{grid-template-columns:minmax(0,1fr)}}
`;

const JS = String.raw`(function(){
'use strict';
// Cronômetro livre no Treino em andamento (1.12.317; pedido do Tiago em 26/11/2026). Conta para cima, sem meta, sem som e sem
// alarme; um só para todos os treinos, guardado neste aparelho. Não mexe na contagem nem no despertador da aula, no descanso nem no
// cronômetro da série: só acrescenta um quadrado ao lado do tempo da aula.
if(window.APCronometroLivre||typeof workoutSessionHtml!=='function')return;
const CHAVE='apCronometroLivre';
function ler(){
 try{const v=JSON.parse(localStorage.getItem(CHAVE)||'null'),inicio=Number(v?.inicio),acumulado=Number(v?.acumulado);
  return {inicio:Number.isFinite(inicio)&&inicio>0?inicio:0,acumulado:Number.isFinite(acumulado)&&acumulado>0?acumulado:0}}
 catch(e){return {inicio:0,acumulado:0}}
}
function salvar(s){try{localStorage.setItem(CHAVE,JSON.stringify(s))}catch(e){}}
const decorrido=s=>Math.max(0,s.acumulado+(s.inicio?Date.now()-s.inicio:0));
function formatar(ms){const t=Math.floor(ms/1000),h=Math.floor(t/3600),m=Math.floor(t/60)%60,s=t%60,d=n=>String(n).padStart(2,'0');return (h?h+':'+d(m):d(m))+':'+d(s)}
function situacao(s){const ms=decorrido(s);return s.inicio?{estado:'contando',texto:'Contando.',botao:'Pausar',ms}:ms>=1000?{estado:'pausado',texto:'Pausado.',botao:'Continuar',ms}:{estado:'parado',texto:'Livre, sem meta.',botao:'Iniciar',ms}}
function html(){
 const x=situacao(ler());
 return '<div class="lesson-timer ap-cronolivre" data-cronolivre data-estado="'+x.estado+'"><div class="lesson-timer-copy"><strong>Cronômetro</strong><span data-cronolivre-texto>'+x.texto+'</span></div>'
  +'<div class="timer-count" role="timer" aria-label="Cronômetro livre" data-cronolivre-tempo>'+formatar(x.ms)+'</div>'
  +'<div class="ap-cronolivre-acoes"><button class="btn" type="button" data-cronolivre-acao="alternar" aria-pressed="'+(x.estado==='contando')+'">'+x.botao+'</button>'
  +'<button class="btn ghost" type="button" data-cronolivre-acao="zerar"'+(x.estado==='parado'?' disabled':'')+'>Zerar</button></div></div>';
}
function atualizar(){
 const caixas=document.querySelectorAll('[data-cronolivre]');if(!caixas.length)return;
 const x=situacao(ler()),tempo=formatar(x.ms);
 for(const c of caixas){
  if(c.dataset.estado!==x.estado)c.dataset.estado=x.estado;
  const t=c.querySelector('[data-cronolivre-tempo]'),s=c.querySelector('[data-cronolivre-texto]'),a=c.querySelector('[data-cronolivre-acao="alternar"]'),z=c.querySelector('[data-cronolivre-acao="zerar"]');
  if(t&&t.textContent!==tempo)t.textContent=tempo;
  if(s&&s.textContent!==x.texto)s.textContent=x.texto;
  if(a&&a.textContent!==x.botao){a.textContent=x.botao;a.setAttribute('aria-pressed',String(x.estado==='contando'))}
  if(z)z.disabled=x.estado==='parado';
 }
}
function alternar(){const s=ler(),agora=Date.now();salvar(s.inicio?{inicio:0,acumulado:decorrido(s)}:{inicio:agora,acumulado:s.acumulado});atualizar()}
function zerar(){salvar({inicio:0,acumulado:0});atualizar()}
document.addEventListener('click',ev=>{
 const b=ev.target?.closest?.('[data-cronolivre-acao]');if(!b||!b.closest('[data-cronolivre]'))return;
 ev.preventDefault();if(b.dataset.cronolivreAcao==='zerar')zerar();else alternar();
});
// No Treino em andamento: o tempo da aula e o cronômetro lado a lado. Sem a contagem da aula, o cronômetro ocupa a largura toda.
const original=workoutSessionHtml;
workoutSessionHtml=function(plan,day,running){
 const conteudo=original.apply(this,arguments);
 if(!running||typeof conteudo!=='string')return conteudo;
 try{
  const fim=conteudo.indexOf('<div id="workoutElapsed"');if(fim<0)return conteudo;
  const inicio=conteudo.indexOf('<div class="lesson-timer workout-countdown"');
  if(inicio>=0&&inicio<fim)return conteudo.slice(0,inicio)+'<div class="ap-aula-cronos">'+conteudo.slice(inicio,fim)+html()+'</div>'+conteudo.slice(fim);
  return conteudo.slice(0,fim)+'<div class="ap-aula-cronos ap-cronolivre-so">'+html()+'</div>'+conteudo.slice(fim);
 }catch(e){return conteudo}
};
window.APCronometroLivre=Object.freeze({ler,alternar,zerar,formatar});
setInterval(atualizar,250);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)atualizar()});
})();`;

const CSS_BLOCK = '<style id="ap-cronometro-livre-css">' + CSS + '</style>\n';
const JS_BLOCK = '<script id="ap-cronometro-livre">' + JS + '\n</script>\n';
const META_ANTES = '<small class="ws-set-target">Meta: ${hesc(row.targetReps||\'a definir\')}</small>';
const META_DEPOIS = '${timed?`<small class="ws-set-target ws-set-last" title="${hesc(lastLabel)}">Última: ${lastReps!==undefined&&lastTimed?lastReps+\' s\':\'—\'}</small>`:`<small class="ws-set-target">Meta: ${hesc(row.targetReps||\'a definir\')}</small>`}';

function editProfessor(html) {
  for (const needed of ['function workoutSessionHtml(plan,day,running){', '<div class="lesson-timer workout-countdown"', '<div id="workoutElapsed"',
    "const lastReps=previous?.values[row.round],lastTimed=previous?.units?.[row.round]==='seconds'", ',lastLabel=lastReps===undefined?',
    "timed=window.APTimedSeries?.isTimed(row.targetReps)===true;", 'const original=workoutSessionHtml;'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.316 (professor.html): ' + needed);
  for (const unique of ['<div class="lesson-timer workout-countdown"', '<div id="workoutElapsed"'])
    assert.equal(count(html, unique), 1, 'Esperado uma vez no professor.html: ' + unique);
  assert.equal(count(html, META_ANTES), 1, 'Texto "Meta" da série não encontrado exatamente uma vez');
  assert.equal(count(html, 'ap-cronometro-livre'), 0, 'O 1.12.316 já tem o cronômetro livre');
  // O "Meta" fica no script sem id <script data-agenda-workout-series> (no verificador, "#fora-dos-blocos").
  const bloco = html.indexOf('<script data-agenda-workout-series>'), fimBloco = html.indexOf('</script>', bloco), meta = html.indexOf(META_ANTES);
  assert.ok(bloco > 0 && meta > bloco && meta < fimBloco, 'O texto "Meta" não está no script data-agenda-workout-series');
  let out = html.replace(META_ANTES, () => META_DEPOIS);
  // Antes do último </body>.
  const fim = out.lastIndexOf('</body>');
  assert.ok(fim > 0 && /^<\/body>\s*<\/html>\s*$/.test(out.slice(fim)), 'O fim do professor.html não é </body></html>');
  out = out.slice(0, fim) + CSS_BLOCK + JS_BLOCK + out.slice(fim);
  return out;
}
function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.316');
  assert.equal(source.sequence, 422);
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
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.316 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}
if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}
module.exports = {makeUpdate, loadSource, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME, CSS, JS, META_ANTES, META_DEPOIS};
