'use strict';

// Gera o pacote 1.12.301 / 407 (sem assinatura) a partir do 1.12.300 / 406 da main (SHA-256 conferido). Pacote completo porque o bloco
// ap-distribution-controls (index.html) não está em nenhuma área do UpdateAreaPatch (uma correção por área seria recusada pelo app).
// Muda SÓ esse bloco: a barra do "Publicar para os alunos" não vai mais a 100% quando a publicação dá erro.
// Causa (achada pelo Claude em 21/11/2026, depois de o ChatGPT ver a barra pular a 100% numa queda de conexão em 25%):
//  - o erro do envio desenhava a barra com o que tinha sido entregue à rede (r), mas logo depois o catch final de publicar chamava
//    c("error", tamanhoTotal, tamanhoTotal) e a barra ia a 100% junto com "Publicação não confirmada";
//  - quando o arquivo inteiro já tinha saído e a confirmação do servidor falhava, também mostrava 100%.
// Correção: a função que desenha a barra guarda o último progresso real; no erro ela usa esse valor (nunca o que o chamador mandar),
// limita a 99% e escreve "Parou em X%" ou, se o arquivo inteiro saiu mas o servidor não confirmou, "Enviado, sem confirmação".
// Pedido: Tiago, 21/11/2026 14:01 ("já dá continuidade no próximo"), item da lista enviada às 13:27.
// Não muda: o envio, a autorização, a conferência da publicação, o resultado no servidor, nenhuma outra tela.
//
// Uso: node tools/gerar-publicar-erro-1.12.301.cjs [pacote-1.12.300.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.301';
const sequence = 407;
const title = 'Publicar: barra não vai a 100% no erro';
const summary = 'Quando a publicação para os alunos falha, a barra para onde estava e diz até onde o envio chegou, sem pular para 100%.';
const notes = 'Publicar para os alunos: barra correta quando dá erro.\n\n'
  + 'Antes, se a conexão caísse no meio do envio (por exemplo em 25%), a barra pulava para 100% junto com a mensagem de erro, '
  + 'como se o arquivo tivesse sido enviado. Agora ela para onde estava, fica no estado de erro e mostra "Parou em X%". '
  + 'Se o arquivo chegou inteiro mas o servidor não confirmou a publicação, mostra "Enviado, sem confirmação". '
  + 'Os 100% continuam aparecendo só quando a publicação é confirmada.\n\n'
  + 'O que não muda: como a publicação é feita e conferida, login, alunos, treinos, agenda, financeiro, avaliações, Firebase, descanso, '
  + 'cronômetros, alarmes, notificações e mascotes.\n\n'
  + 'Inclui tudo do 1.12.300 e deve ser instalado no lugar dele.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.300-Pagamentos-Repetidos-Para-Assinar.agenda.json';
const SOURCE_SHA256 = 'c91d3a533b305c5bb518173094e93ea158f737e10b1107f23d12ee4db91496dd';
const TARGET_NAME = 'AgendaPersonal-1.12.301-Publicar-Barra-Erro-Para-Assinar.agenda.json';
const BLOCK = '<script id="ap-distribution-controls">';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');

const CHANGES = [
  ['a barra guarda o último progresso real e usa ele no erro',
    'const s=t>0?Math.min(100,Math.floor(a/t*100)):0,r=e=>(e/1048576).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});',
    // 1.12.301: no erro, a barra usa o último progresso real guardado (o catch de publicar mandava o tamanho total e ia a 100%).
    'let s=t>0?Math.min(100,Math.floor(a/t*100)):0;const r=e=>(e/1048576).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});'
    + 'if(e==="authorizing"){n.dataset.lastPercent="0";n.dataset.lastBytes="0";n.dataset.lastTotal="0"}'
    + 'else if(e==="error"){const g=Math.max(0,Math.min(100,Number(n.dataset.lastPercent)||0));s=Math.min(g,99);t=Number(n.dataset.lastTotal)||t;a=Math.min(Number(n.dataset.lastBytes)||0,t);n.dataset.reachedUpload=g>=100?"1":"0"}'
    + 'else if(t>0){n.dataset.lastPercent=String(s);n.dataset.lastBytes=String(Math.min(a,t));n.dataset.lastTotal=String(t)}'],
  ['o texto da porcentagem no erro',
    '{u.value=s;l("apPublishProgressPercent").textContent=s+"% do envio"}',
    '{u.value=s;l("apPublishProgressPercent").textContent=e==="error"?(n.dataset.reachedUpload==="1"?"Enviado, sem confirmação":"Parou em "+s+"%"):s+"% do envio"}'],
];

function editBlock(html) {
  assert.equal(count(html, BLOCK), 1, 'O bloco ap-distribution-controls não aparece uma única vez no index.html');
  const start = html.indexOf(BLOCK) + BLOCK.length;
  const end = html.indexOf('</script>', start);
  let inner = html.slice(start, end);
  const before = sha256(inner);
  for (const [what, from, to] of CHANGES) {
    assert.equal(count(inner, from), 1, 'Não achei ' + what + ' uma única vez no 1.12.300');
    inner = inner.replace(from, () => to);
  }
  return {html: html.slice(0, start) + inner + html.slice(end), before, after: sha256(inner), inner};
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.300');
  assert.equal(source.sequence, 406);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notes.length <= 4000, 'notas: ' + notes.length);
  const { agendaSignature, ...original } = source;
  const edited = editBlock(original.files['index.html']);
  return {...original, files: {...original.files, 'index.html': edited.html}, version, sequence, notes, update: {category: 'general', title, summary}};
}

function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.300 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}

if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}

module.exports = {makeUpdate, loadSource, editBlock, CHANGES, version, sequence, TARGET_NAME, SOURCE_NAME};
