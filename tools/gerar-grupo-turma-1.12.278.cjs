'use strict';

// Gera o pacote 1.12.278 (sem assinatura) a partir do pacote 1.12.276:
//  - professor.html: nova aba "Grupo" em "Cadastro por link" (colar, trocar, copiar, testar e remover o link do grupo do WhatsApp);
//  - professor.html: o link salvo segue dentro da ficha do aluno já existente (area.trainer.groupLink), só quando houver link válido;
//  - index.html (aluno): ícone do WhatsApp ao lado do sininho, na tela inicial; abre o grupo direto (cartão "Seu profissional" intacto).
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

// Ícone cheio (24x24) no formato dos demais ícones do menu Mais: símbolo do WhatsApp (balão com telefone), desenho próprio.
const groupGlyph = '<path fill-rule="evenodd" d="M12 1.8a10.2 10.2 0 1 1 0 20.4 10.2 10.2 0 0 1-4.9-1.3L2 22l1.4-4.9A10.2 10.2 0 0 1 12 1.8Zm0 2.2a8 8 0 0 0-6.8 12.2l.2.3-.7 2.4 2.5-.7.3.2A8 8 0 1 0 12 4Z"/><path d="M9.1 7.2c.4-.4 1-.4 1.3.1l1 1.7c.2.4.1.8-.2 1.1l-.6.6c.6 1.2 1.6 2.2 2.8 2.8l.6-.6c.3-.3.8-.4 1.1-.2l1.7 1c.5.3.5.9.1 1.3-.9 1-2.3 1.3-3.6.8-2.9-1.1-4.7-2.9-5.8-5.8-.5-1.3-.2-2.7.7-3.6Z"/>';
const menuCard = '<button class="more-function more-function-compact" id="moreGroupLink" type="button" onclick="openGroupFromMenu()"><span class="more-function-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 1 1-4.6 1.2L3 21l1.5-4.5A9.5 9.5 0 0 1 12 2.5Z"/></svg></span><span class="more-function-copy"><strong>Grupo da turma</strong><small>Abra o grupo do WhatsApp.</small></span><span class="more-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></span></button>';

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
function openGroupFromMenu() {
  if (getGroupLink()) { openGroupLink(); return; }
  L();
  D("group");
}
c("groupUrlForm").onsubmit = saveGroupLink;
window.openGroupFromMenu = openGroupFromMenu;
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
    ['<button class="more-function more-function-compact" type="button" data-screen="makeup">', menuCard + '<button class="more-function more-function-compact" type="button" data-screen="makeup">'],
    ['window.APMoreMenuGlyphs=Object.freeze({', 'window.APMoreMenuGlyphs=Object.freeze({"menu-group":' + JSON.stringify(groupGlyph) + ','],
    ["moreRegistrationLink:['students',3,'menu-link'],", "moreGroupLink:['agenda',4,'menu-group'],moreRegistrationLink:['students',3,'menu-link'],"],
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
  const glyph = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + groupGlyph + '</svg>';
  const fn = [
    'function ap_groupButton(e,o){const h=document.querySelector("#homeScroll .home-actions");if(!h)return;let b=document.getElementById("apGroupButton");const g=o&&o.groupLink;',
    'if(!/^https:\\/\\/chat\\.whatsapp\\.com\\/[A-Za-z0-9]{10,40}$/.test(g||"")||!1===e?.area?.enabled){b&&b.remove();return}',
    'if(!b){b=document.createElement("button");b.id="apGroupButton";b.type="button";b.className="home-bell ap-group-button";b.setAttribute("aria-label","Grupo da turma");b.title="Grupo da turma";b.innerHTML=' + JSON.stringify(glyph) + ';h.prepend(b)}',
    'b.onclick=()=>{try{if(window.Android?.openExternal){Android.openExternal(g);return}}catch(t){}window.open(g,"_blank","noopener,noreferrer")}}'
  ].join('');
  const head = 'function y(){const e=window.__AP_STUDENT_CONTEXT,o=e?.area?.trainer;';
  return [
    [head, fn + head],
    ['i.append(s,l)}}removeProfilePhoto=function(){', 'i.append(s,l)}ap_groupButton(e,o)}removeProfilePhoto=function(){'],
    ['.ap-professional-info{min-width:0;flex:1}', '.ap-professional-info{min-width:0;flex:1}.ap-group-button svg{width:24px;height:24px}']
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
