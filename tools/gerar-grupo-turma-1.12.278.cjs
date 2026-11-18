'use strict';

// Gera o pacote 1.12.278 (sem assinatura) a partir do pacote 1.12.276:
//  - app do aluno: botão "Grupo da turma" no cartão "Seu profissional", que abre direto o grupo do WhatsApp.
// O link fica dentro do app (index.html), sem Firebase e sem alterar a ficha dos alunos.
// O link NÃO fica neste arquivo: é informado na hora de gerar, pela variável AP_GRUPO_URL.
// Atenção: depois de gerado, o link fica visível a quem abrir o código do app ou o pacote publicado.

const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.278';
const sequence = 384;
const name = 'AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json';
const summary = 'Adiciona o botão Grupo da turma, que abre direto o grupo do WhatsApp.';

function replaceOne(source, previous, next) {
  const index = source.indexOf(previous);
  assert.ok(index >= 0, 'O trecho esperado não existe: ' + previous.slice(0, 80));
  assert.equal(source.indexOf(previous, index + previous.length), -1, 'O trecho está duplicado: ' + previous.slice(0, 80));
  return source.slice(0, index) + next + source.slice(index + previous.length);
}

function normalizeGroupLink(raw) {
  try {
    const url = new URL(String(raw || '').trim());
    if (url.protocol !== 'https:' || url.hostname !== 'chat.whatsapp.com' || url.username || url.password || url.port) return '';
    const code = url.pathname.replace(/^\/+|\/+$/g, '');
    return /^[A-Za-z0-9]{10,40}$/.test(code) ? 'https://chat.whatsapp.com/' + code : '';
  } catch (_) {
    return '';
  }
}

function studentEditsFor(link) {
  assert.ok(link, 'Link do grupo inválido. Use https://chat.whatsapp.com/código');
  const button = [
    'const ap_g=' + JSON.stringify(link) + ';',
    'const b=document.createElement("button");b.type="button";b.className="ap-group-button";b.textContent="Grupo da turma";',
    'b.addEventListener("click",()=>{try{if(window.Android?.openExternal){Android.openExternal(ap_g);return}}catch(t){}window.open(ap_g,"_blank","noopener,noreferrer")});i.append(b)'
  ].join('');
  return [
    ['i.append(s,l)}}removeProfilePhoto=function(){', 'i.append(s,l);' + button + '}}removeProfilePhoto=function(){'],
    [
      '.ap-professional-info{min-width:0;flex:1}',
      '.ap-professional-info{min-width:0;flex:1}.ap-professional-bar:has(.ap-group-button){flex-wrap:wrap}.ap-group-button{flex:1 0 100%;min-height:44px;padding:8px 12px;border:1px solid var(--home-accent,var(--prof-accent,#c8b4dd));border-radius:11px;background:transparent;color:var(--home-accent,var(--prof-accent,#c8b4dd));font:inherit;font-size:14px;font-weight:650;text-align:center}'
    ]
  ];
}

function patch(page, edits) {
  return edits.reduce((current, [previous, next]) => replaceOne(current, previous, next), page);
}

function makeUpdate(source, rawLink) {
  const link = normalizeGroupLink(rawLink);
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  assert.equal(source.version, '1.12.276');
  assert.equal(source.sequence, 382);
  for (const page of ['index.html', 'professor.html', 'avaliacoes.html', 'cadastro.html']) {
    assert.equal(typeof source.files?.[page], 'string', 'Página ausente: ' + page);
  }
  const { agendaSignature, ...original } = source;
  const files = {
    ...original.files,
    'index.html': patch(original.files['index.html'], studentEditsFor(link))
  };
  return {
    ...original,
    files,
    version,
    sequence,
    notes: summary,
    update: {...original.update, title: 'Grupo da turma', summary}
  };
}

if (require.main === module) {
  const [, , sourceFile, targetFile = name] = process.argv;
  assert.ok(sourceFile, 'Uso: AP_GRUPO_URL=https://chat.whatsapp.com/codigo node tools/gerar-grupo-turma-1.12.278.cjs AgendaPersonal-1.12.276-Links-Cadastro-Instalacao-Para-Assinar.agenda.json');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')), process.env.AP_GRUPO_URL);
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {makeUpdate, normalizeGroupLink, studentEditsFor};
