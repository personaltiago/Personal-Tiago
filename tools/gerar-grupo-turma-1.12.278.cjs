'use strict';

// Gera o pacote 1.12.278 (sem assinatura) a partir do pacote 1.12.276:
//  - professor.html: nova aba "Grupo" em "Cadastro por link" (colar, trocar, copiar, testar e remover o link do grupo do WhatsApp);
//  - professor.html: o link salvo segue dentro da ficha do aluno já existente (area.trainer.groupLink), só quando houver link válido;
//  - index.html (aluno): botão "Grupo da turma" no cartão "Seu profissional", que abre o grupo direto.
// Nenhum link fica neste arquivo nem no pacote: o personal digita o link dentro do app.

const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.278';
const sequence = 384;
const name = 'AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json';
const summary = 'Nova aba Grupo em Cadastro por link: o link do grupo do WhatsApp é colado no app, pode ser trocado quando quiser e vira o botão Grupo da turma para os alunos.';

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

// Mesma regra de normalizeGroupLink, em uma linha, para dentro do app.
const inviteFn = 'function groupInviteUrl(raw){try{const u=new URL(String(raw||"").trim());if(u.protocol!=="https:"||u.hostname!=="chat.whatsapp.com"||u.username||u.password||u.port)return"";const k=u.pathname.replace(/^\\/+|\\/+$/g,"");return /^[A-Za-z0-9]{10,40}$/.test(k)?"https://chat.whatsapp.com/"+k:""}catch(_){return""}}';

const tabButton = '<button id="groupLinkTab" type="button" role="tab" aria-selected="false" aria-controls="groupLinkPanel" onclick="setRegistrationTab(\'group\')">Grupo</button>\n      ';
const tabPanel = `<div id="groupLinkPanel" role="tabpanel" aria-labelledby="groupLinkTab" hidden>
      <div class="registration-intro"><h4>Grupo do WhatsApp</h4><p>Cole o link do grupo da turma. Os alunos veem o botão Grupo da turma na agenda e entram direto.<br>Você pode trocar o link quando quiser.</p></div>
      <label class="field full"><span>Link do grupo vinculado</span><input id="groupPublicUrl" readonly placeholder="Nenhum grupo vinculado" onclick="this.select()"></label>
      <div class="registration-actions">
        <button id="groupOpen" class="btn" type="button" onclick="openGroupLink()">Abrir grupo</button>
        <button id="groupCopy" class="btn" type="button" onclick="copyGroupLink()">Copiar link</button>
      </div>
      <button id="groupEdit" class="btn registration-edit-link" type="button" aria-expanded="false" aria-controls="groupConfig" onclick="editGroupLink()">Trocar link</button>
      <section class="registration-config" id="groupConfig" aria-labelledby="groupEditTitle" hidden>
        <h4 id="groupEditTitle">Link do grupo</h4>
        <form id="groupUrlForm">
          <label class="field full"><span>Link de convite do WhatsApp</span><input id="groupUrlSetting" type="url" inputmode="url" required autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="https://chat.whatsapp.com/…"></label>
          <div class="registration-editor-actions"><button class="btn primary" type="submit">Salvar link</button><button class="btn" type="button" onclick="cancelGroupLinkEdit()">Cancelar</button><button id="groupRemove" class="btn" type="button" onclick="removeGroupLink()">Remover grupo</button></div>
        </form>
      </section>
    </div>
    `;

const groupFns = `
${inviteFn}
function getGroupLink() { return groupInviteUrl(state.groupLink?.url); }
function renderGroupLink(editing = false) {
  const url = getGroupLink();
  const open = editing || !url;
  c("groupPublicUrl").value = url;
  c("groupUrlSetting").value = url;
  c("groupOpen").disabled = !url;
  c("groupCopy").disabled = !url;
  c("groupRemove").hidden = !url;
  c("groupEdit").textContent = url ? "Trocar link" : "Vincular grupo";
  c("groupConfig").hidden = !open;
  c("groupEdit").setAttribute("aria-expanded", String(open));
}
function editGroupLink() {
  renderGroupLink(true);
  l("");
  c("groupUrlSetting").focus();
  c("groupUrlSetting").select();
  c("groupConfig").scrollIntoView({block: "nearest", behavior: "smooth"});
}
function cancelGroupLinkEdit() {
  renderGroupLink();
  l("");
  c("groupEdit").focus();
}
function saveGroupLink(event) {
  event.preventDefault();
  const url = groupInviteUrl(c("groupUrlSetting").value);
  if (!url) {
    l("Informe o link de convite do grupo, no formato https://chat.whatsapp.com/código.", true);
    return;
  }
  try {
    saveConfiguredLink("groupLink", url);
    renderGroupLink();
    l("Grupo vinculado. O botão chega aos alunos na próxima sincronização.");
  } catch (_) {
    l("Não foi possível salvar o link. Confira o armazenamento do aplicativo.", true);
  }
}
function removeGroupLink() {
  try {
    saveConfiguredLink("groupLink", "");
    renderGroupLink();
    l("Grupo removido. O botão some dos alunos na próxima sincronização.");
  } catch (_) {
    l("Não foi possível remover o link. Confira o armazenamento do aplicativo.", true);
  }
}
function openGroupLink() {
  const url = getGroupLink();
  if (!url) { l("Vincule o link do grupo primeiro.", true); return; }
  try {
    if (window.Android?.openExternal) {
      Android.openExternal(url);
      return;
    }
  } catch (_) {}
  window.open(url, "_blank", "noopener,noreferrer");
}
function copyGroupLink() {
  const url = getGroupLink();
  if (!url) { l("Vincule o link do grupo primeiro.", true); return; }
  return copyPublicLink(url, "groupPublicUrl");
}
c("groupUrlForm").onsubmit = saveGroupLink;
window.editGroupLink = editGroupLink;
window.cancelGroupLinkEdit = cancelGroupLinkEdit;
window.removeGroupLink = removeGroupLink;
window.openGroupLink = openGroupLink;
window.copyGroupLink = copyGroupLink;
`;

function professorEdits() {
  return [
    ['.registration-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))', '.registration-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))'],
    ['<button id="registrationContactsTab"', tabButton + '<button id="registrationContactsTab"'],
    ['<div id="registrationContactsPanel"', tabPanel + '<div id="registrationContactsPanel"'],
    ['  ["contacts", "registrationContactsTab", "registrationContactsPanel"],', '  ["group", "groupLinkTab", "groupLinkPanel"],\n  ["contacts", "registrationContactsTab", "registrationContactsPanel"],'],
    ['n = tab === "installation" || tab === "contacts" ? tab : "link";', 'n = tab === "installation" || tab === "group" || tab === "contacts" ? tab : "link";'],
    ['  else if (n === "contacts") U();', '  else if (n === "group") renderGroupLink();\n  else if (n === "contacts") U();'],
    ['function shareInstallationLink() { sharePublicLink(getInstallationLink()); }', 'function shareInstallationLink() { sharePublicLink(getInstallationLink()); }' + groupFns],
    [
      'function makeArea(state,student,helpers={}){',
      inviteFn + 'function makeArea(state,student,helpers={}){'
    ],
    [
      'area.trainer={name:text(trainer.name,120),',
      'area.trainer={...(groupInviteUrl(state.groupLink?.url)?{groupLink:groupInviteUrl(state.groupLink?.url)}:{}),name:text(trainer.name,120),'
    ]
  ];
}

function studentEdits() {
  const button = [
    'const ap_g=o&&o.groupLink;if(/^https:\\/\\/chat\\.whatsapp\\.com\\/[A-Za-z0-9]{10,40}$/.test(ap_g||"")){',
    'const b=document.createElement("button");b.type="button";b.className="ap-group-button";b.textContent="Grupo da turma";',
    'b.addEventListener("click",()=>{try{if(window.Android?.openExternal){Android.openExternal(ap_g);return}}catch(t){}window.open(ap_g,"_blank","noopener,noreferrer")});i.append(b)}'
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
    'index.html': patch(original.files['index.html'], studentEdits()),
    'professor.html': patch(original.files['professor.html'], professorEdits())
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

module.exports = {makeUpdate, normalizeGroupLink, professorEdits, studentEdits, groupInviteUrl: normalizeGroupLink};
