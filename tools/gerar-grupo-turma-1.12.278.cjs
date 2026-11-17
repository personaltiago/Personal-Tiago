'use strict';

// Gera o pacote 1.12.278 (sem assinatura) a partir do pacote 1.12.276:
//  - Perfil do personal: campo "Grupo da turma" (link do grupo do WhatsApp, opcional);
//  - o link segue dentro de area.trainer.groupLink, no conteúdo da ficha que o app já envia;
//  - app do aluno: botão "Grupo da turma" no cartão "Seu profissional".
// Sem link preenchido, a ficha dos alunos não muda e nada é gravado no Firebase.
// O link do grupo NUNCA fica neste arquivo nem no repositório: o personal digita no app.

const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.278';
const sequence = 384;
const name = 'AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json';
const summary = 'Adiciona o botão Grupo da turma, aberto direto no WhatsApp, com o link informado pelo personal.';

function replaceOne(source, previous, next) {
  const index = source.indexOf(previous);
  assert.ok(index >= 0, 'O trecho esperado não existe: ' + previous.slice(0, 80));
  assert.equal(source.indexOf(previous, index + previous.length), -1, 'O trecho está duplicado: ' + previous.slice(0, 80));
  return source.slice(0, index) + next + source.slice(index + previous.length);
}

const groupPattern = String.raw`^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}$`;
const studentButton = [
  'const ap_g=/' + groupPattern + '/.test(String(o.groupLink||""))?String(o.groupLink):"";',
  'if(ap_g){const b=document.createElement("button");b.type="button";b.className="ap-group-button";b.textContent="Grupo da turma";',
  'b.addEventListener("click",()=>{try{if(window.Android?.openExternal){Android.openExternal(ap_g);return}}catch(t){}window.open(ap_g,"_blank","noopener,noreferrer")});i.append(b)}'
].join('');

const professorEdits = [
  [
    '<div class="field full"><button class="btn primary full" type="submit">SALVAR PERFIL</button></div></form>',
    '<label class="field full"><span>Grupo da turma <small>(link do WhatsApp, opcional)</small></span><input id="trainerGroup" type="url" inputmode="url" maxlength="120" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="https://chat.whatsapp.com/..."></label><div class="field full"><button class="btn primary full" type="submit">SALVAR PERFIL</button></div></form>'
  ],
  [
    "document.getElementById('trainerCref').value=profile.cref;",
    "document.getElementById('trainerCref').value=profile.cref;document.getElementById('trainerGroup').value=stored.groupUrl||'';"
  ],
  [
    "const previous=state.trainerProfile;state.trainerProfile={...(previous||{}),name,",
    "const groupRaw=document.getElementById('trainerGroup').value.trim(),groupUrl=groupRaw?APGroupLink.normalize(groupRaw):'';if(groupRaw&&!groupUrl)return toast('Informe o link completo do grupo, no formato https://chat.whatsapp.com/código.');const previous=state.trainerProfile;state.trainerProfile={...(previous||{}),groupUrl,name,"
  ],
  [
    "area.trainer={name:text(trainer.name,120),",
    "area.trainer={...(APGroupLink.normalize(trainer.groupUrl)?{groupLink:APGroupLink.normalize(trainer.groupUrl)}:{}),name:text(trainer.name,120),"
  ],
  [
    "function makeArea(state,student,helpers={}){",
    "const APGroupLink=Object.freeze({normalize(raw){try{const url=new URL(String(raw||'').trim());if(url.protocol!=='https:'||url.hostname!=='chat.whatsapp.com'||url.username||url.password||url.port)return '';const code=url.pathname.replace(/^\\/+|\\/+$/g,'');return /^[A-Za-z0-9]{10,40}$/.test(code)?'https://chat.whatsapp.com/'+code:''}catch(_){return ''}}});\nfunction makeArea(state,student,helpers={}){"
  ]
];

const studentEdits = [
  [
    'i.append(s,l)}}removeProfilePhoto=function(){',
    'i.append(s,l);' + studentButton + '}}removeProfilePhoto=function(){'
  ],
  [
    '.ap-professional-info{min-width:0;flex:1}',
    '.ap-professional-info{min-width:0;flex:1}.ap-professional-bar:has(.ap-group-button){flex-wrap:wrap}.ap-group-button{flex:1 0 100%;min-height:44px;padding:8px 12px;border:1px solid var(--home-accent,var(--prof-accent,#c8b4dd));border-radius:11px;background:transparent;color:var(--home-accent,var(--prof-accent,#c8b4dd));font:inherit;font-size:14px;font-weight:650;text-align:center}'
  ]
];

function patch(page, edits) {
  return edits.reduce((current, [previous, next]) => replaceOne(current, previous, next), page);
}

function makeUpdate(source) {
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
    'index.html': patch(original.files['index.html'], studentEdits),
    'professor.html': patch(original.files['professor.html'], professorEdits)
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
  assert.ok(sourceFile, 'Uso: node tools/gerar-grupo-turma-1.12.278.cjs AgendaPersonal-1.12.276-Links-Cadastro-Instalacao-Para-Assinar.agenda.json');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {makeUpdate, groupPattern, professorEdits, studentEdits};
