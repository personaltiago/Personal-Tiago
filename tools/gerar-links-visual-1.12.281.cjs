'use strict';

// Gera o pacote 1.12.281 (sem assinatura) a partir do pacote 1.12.278 (seq 384).
// Soma duas coisas, nesta ordem:
//  1) a correção do Voltar (1.12.280), pelo gerador irmão tools/gerar-voltar-passo-a-passo-1.12.280.cjs;
//  2) o novo visual da janela "Cadastro por link" (professor.html): seis atalhos em grade com ícone
//     (Cadastro, Instalação, Grupo, Contatos, Anamnese e Planos), painéis no mesmo visual e dois links novos
//     (Anamnese e Planos) que o professor cola, copia ou envia pelo WhatsApp, como já faz com a Instalação.
// Não mexe em descanso, cronômetros, alarmes, notificações, Firebase, dados de alunos, avaliacoes.html,
// cadastro.html nem no histórico modular. O index.html só recebe a edição do Voltar (gerador irmão).

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const voltar = require(path.join(__dirname, 'gerar-voltar-passo-a-passo-1.12.280.cjs'));

const version = '1.12.281';
const sequence = 387;
const title = 'Links dos alunos';
const summary = 'Cadastro por link ganha 6 atalhos em grade com ícone e visual novo; Anamnese e Planos: cole o link, copie ou envie pelo WhatsApp.';
const notes = 'A janela Cadastro por link ganhou visual novo: os atalhos viram 6 botões com ícone (Cadastro, Instalação, Grupo, Contatos, Anamnese e Planos) e cada painel mostra o link com o botão de copiar dentro do campo, seguido de Enviar pelo WhatsApp, Copiar link e Alterar link. '
  + 'Anamnese e Planos são novos e funcionam como a Instalação: toque em Adicionar link, cole o endereço https:// da sua página e salve; depois use Enviar pelo WhatsApp ou Copiar link. Remover link apaga o endereço. Sem link salvo, os botões de enviar e copiar ficam desativados. '
  + 'Os links de Cadastro, Instalação e Grupo continuam os mesmos e a aba Contatos não mudou. '
  + 'Este pacote inclui o Voltar passo a passo (1.12.280). Descanso, cronômetros, alarmes e notificações não foram alterados.';

const START = '<div class="sheet-head"><h3 id="registrationLinkTitle">Cadastro por link</h3>';
const END = '    <p class="registration-status" id="registrationStatus"';
// SHA-256 do trecho original (cabeçalho, abas e painéis) entre START e END no professor.html do 1.12.278/1.12.280.
const OLD_BLOCK_SHA256 = 'd4bdd044eec5bdb7d2a502780f4a7e00401f4abe8238f704f90590014a23e809';

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

function replaceOne(source, previous, next) {
  const index = source.indexOf(previous);
  assert.ok(index >= 0, 'O trecho esperado não existe: ' + previous.slice(0, 80));
  assert.equal(source.indexOf(previous, index + previous.length), -1, 'O trecho está duplicado: ' + previous.slice(0, 80));
  return source.slice(0, index) + next + source.slice(index + previous.length);
}

// ---------- ícones (traço de 1,8 como os demais do aplicativo) ----------
const svg = inner => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
const ICONS = {
  link: '<path d="M10 13a5 5 0 0 0 7 .3l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.3l-3 3a5 5 0 0 0 7 7l2-2"/>',
  register: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  install: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  group: '<circle cx="12" cy="8" r="3.1"/><path d="M6.6 20v-.9a5.4 5.4 0 0 1 10.8 0v.9"/><circle cx="4.6" cy="9.6" r="2.1"/><path d="M1.6 18.4v-.5a3.5 3.5 0 0 1 3-3.4"/><circle cx="19.4" cy="9.6" r="2.1"/><path d="M22.4 18.4v-.5a3.5 3.5 0 0 0-3-3.4"/>',
  contacts: '<rect x="4" y="3" width="15" height="18" rx="2.6"/><circle cx="11.5" cy="10" r="2.5"/><path d="M7.4 17.2c.6-2.1 2.3-3.2 4.1-3.2s3.5 1.1 4.1 3.2"/><path d="M21.5 7.5v3M21.5 13.5v3"/>',
  anamnesis: '<path d="M8 4H6.5A2.5 2.5 0 0 0 4 6.5v13A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 17.5 4H16"/><rect x="8" y="2" width="8" height="4" rx="1.2"/><path d="M12 10.5v6M9 13.5h6"/>',
  plans: '<path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2.4"/><path d="M5 16H4.5A2.5 2.5 0 0 1 2 13.5v-9A2.5 2.5 0 0 1 4.5 2h9A2.5 2.5 0 0 1 16 4.5V5"/>',
  edit: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/><path d="m15 5 4 4"/>'
};
// Mesmo símbolo do WhatsApp já usado no botão Grupo da turma do aluno.
const WHATSAPP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M12 1.8a10.2 10.2 0 1 1 0 20.4 10.2 10.2 0 0 1-4.9-1.3L2 22l1.4-4.9A10.2 10.2 0 0 1 12 1.8Zm0 2.2a8 8 0 0 0-6.8 12.2l.2.3-.7 2.4 2.5-.7.3.2A8 8 0 1 0 12 4Z"/><path d="M9.1 7.2c.4-.4 1-.4 1.3.1l1 1.7c.2.4.1.8-.2 1.1l-.6.6c.6 1.2 1.6 2.2 2.8 2.8l.6-.6c.3-.3.8-.4 1.1-.2l1.7 1c.5.3.5.9.1 1.3-.9 1-2.3 1.3-3.6.8-2.9-1.1-4.7-2.9-5.8-5.8-.5-1.3-.2-2.7.7-3.6Z"/></svg>';

// [id do botão, id do painel, nome interno, rótulo, ícone] — a ordem é a da grade 3×2.
const TABS = [
  ['registrationLinkTab', 'registrationLinkPanel', 'link', 'Cadastro', 'register'],
  ['installationLinkTab', 'installationLinkPanel', 'installation', 'Instalação', 'install'],
  ['groupLinkTab', 'groupLinkPanel', 'group', 'Grupo', 'group'],
  ['registrationContactsTab', 'registrationContactsPanel', 'contacts', 'Contatos', 'contacts'],
  ['anamnesisLinkTab', 'anamnesisLinkPanel', 'anamnesis', 'Anamnese', 'anamnesis'],
  ['plansLinkTab', 'plansLinkPanel', 'plans', 'Planos', 'plans']
];

function tabButton([id, panel, name, label, icon], selected) {
  return '<button id="' + id + '" type="button" role="tab" aria-selected="' + selected + '" aria-controls="' + panel + '" onclick="setRegistrationTab(\'' + name + '\')">'
    + '<span class="registration-tile-icon">' + svg(ICONS[icon]) + '</span><span class="registration-tile-label">' + label + '</span></button>';
}

function section(old, id) {
  const start = old.indexOf('<section class="registration-config" id="' + id + '"');
  assert.ok(start >= 0, 'Seção não encontrada: ' + id);
  const end = old.indexOf('</section>', start);
  assert.ok(end > start, 'Fim da seção não encontrado: ' + id);
  return old.slice(start, end + '</section>'.length);
}

// Campo com o botão de copiar dentro (como na foto de referência).
function urlField(label, inputId, copyId, copyLabel, copyHandler, placeholder, extra = '') {
  return '<label class="field full registration-urlfield"><span>' + label + '</span><input id="' + inputId + '" readonly aria-label="' + label + '"' + (placeholder ? ' placeholder="' + placeholder + '"' : '') + extra + ' onclick="this.select()">'
    + '<button id="' + copyId + '" class="registration-urlcopy" type="button" aria-label="' + copyLabel + '" onclick="' + copyHandler + '">' + svg(ICONS.copy) + '</button></label>';
}
const action = (id, primary, handler, icon, text) =>
  '<button id="' + id + '" class="btn' + (primary ? ' primary' : '') + '" type="button" onclick="' + handler + '">' + icon + '<span>' + text + '</span></button>';
const intro = (icon, heading, text) =>
  '<div class="registration-intro"><span class="registration-intro-icon">' + svg(ICONS[icon]) + '</span><h4>' + heading + '</h4><p>' + text + '</p></div>';
const editButton = (id, controls, handler, labelId, label) =>
  '<button id="' + id + '" class="btn registration-edit-link" type="button" aria-expanded="false" aria-controls="' + controls + '" onclick="' + handler + '">' + svg(ICONS.edit) + '<span' + (labelId ? ' id="' + labelId + '"' : '') + '>' + label + '</span></button>';

// Painel dos links colados pelo professor (Anamnese e Planos): mesmo padrão da Instalação, sem endereço padrão.
function optionalPanel(key, o) {
  const call = name => 'apRegistrationLinks.' + name + '(\'' + key + '\')';
  return [
    '    <div id="' + key + 'LinkPanel" role="tabpanel" aria-labelledby="' + key + 'LinkTab" hidden>',
    '      ' + intro(o.icon, o.heading, o.text),
    '      ' + urlField(o.fieldLabel, key + 'PublicUrl', key + 'UrlCopy', o.copyLabel, call('copy'), 'Nenhum link adicionado'),
    '      <div class="registration-actions">',
    '        ' + action(key + 'WhatsApp', true, call('share'), WHATSAPP, 'Enviar pelo WhatsApp'),
    '        ' + action(key + 'Copy', false, call('copy'), svg(ICONS.copy), 'Copiar link'),
    '      </div>',
    '      ' + editButton(key + 'Edit', key + 'Config', call('edit'), key + 'EditLabel', 'Adicionar link'),
    '      <section class="registration-config" id="' + key + 'Config" aria-labelledby="' + key + 'EditTitle" hidden>',
    '        <h4 id="' + key + 'EditTitle">' + o.editTitle + '</h4>',
    '        <form id="' + key + 'UrlForm">',
    '          <label class="field full"><span>' + o.settingLabel + '</span><input id="' + key + 'UrlSetting" type="url" inputmode="url" required autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="https://…"></label>',
    '          <div class="registration-editor-actions"><button class="btn primary" type="submit">Salvar link</button><button class="btn" type="button" onclick="' + call('cancel') + '">Cancelar</button><button id="' + key + 'Remove" class="btn registration-editor-remove" type="button" onclick="' + call('remove') + '" hidden>Remover link</button></div>',
        '        </form>',
    '      </section>',
    '    </div>'
  ].join('\n');
}

function buildBlock(old) {
  const registrationConfig = section(old, 'registrationConfig');
  const installationConfig = section(old, 'installationConfig');
  const groupConfig = section(old, 'groupConfig');
  const contactsStart = old.indexOf('    <div id="registrationContactsPanel"');
  assert.ok(contactsStart >= 0, 'Painel de contatos não encontrado');
  const contacts = old.slice(contactsStart).replace(/\n$/, '');
  assert.ok(contacts.includes('id="registrationContactsView"'), 'Painel de contatos inesperado');

  const lines = [
    '<div class="sheet-head"><span class="registration-head-icon">' + svg(ICONS.link) + '</span><h3 id="registrationLinkTitle">Cadastro por link</h3><button class="close" type="button" data-close="registrationLinkDialog" aria-label="Fechar cadastro por link">×</button></div>',
    '    <div class="registration-tabs" role="tablist" aria-label="Cadastro por link">',
    ...TABS.map((tab, index) => '      ' + tabButton(tab, index === 0)),
    '    </div>',
    // Cadastro
    '    <div id="registrationLinkPanel" role="tabpanel" aria-labelledby="registrationLinkTab">',
    '      ' + intro('register', 'Link de cadastro', 'Envie aos novos alunos ou coloque na sua bio.<br>Você aprova os cadastros recebidos na aba Contatos.'),
    '      ' + urlField('Seu link de cadastro', 'registrationPublicUrl', 'registrationUrlCopy', 'Copiar link de cadastro', 'copyRegistrationLink()', 'Configure o endereço do formulário'),
    '      <div class="registration-actions">',
    '        ' + action('registrationWhatsApp', true, 'shareRegistrationLink()', WHATSAPP, 'Enviar pelo WhatsApp'),
    '        ' + action('registrationCopy', false, 'copyRegistrationLink()', svg(ICONS.copy), 'Copiar link'),
    '      </div>',
    '      <p id="registrationUrlHint" class="registration-help"></p>',
    '      ' + editButton('registrationEdit', 'registrationConfig', 'editRegistrationLink()', '', 'Alterar link'),
    '      ' + registrationConfig,
    '    </div>',
    // Instalação
    '    <div id="installationLinkPanel" role="tabpanel" aria-labelledby="installationLinkTab" hidden>',
    '      ' + intro('install', 'Link de instalação', 'Envie a página de instalação do Agenda Personal para Android e iPhone.'),
    '      ' + urlField('Seu link de instalação', 'installationPublicUrl', 'installationUrlCopy', 'Copiar link de instalação', 'copyInstallationLink()', ''),
    '      <div class="registration-actions">',
    '        ' + action('installationWhatsApp', true, 'shareInstallationLink()', WHATSAPP, 'Enviar pelo WhatsApp'),
    '        ' + action('installationCopy', false, 'copyInstallationLink()', svg(ICONS.copy), 'Copiar link'),
    '      </div>',
    '      ' + editButton('installationEdit', 'installationConfig', 'editInstallationLink()', '', 'Alterar link'),
    '      ' + installationConfig,
    '    </div>',
    // Grupo
    '    <div id="groupLinkPanel" role="tabpanel" aria-labelledby="groupLinkTab" hidden>',
    '      ' + intro('group', 'Grupo do WhatsApp', 'Cole o link do grupo da turma. Os alunos veem o botão Grupo da turma na agenda e entram direto.<br>Você pode trocar o link quando quiser.'),
    '      ' + urlField('Link do grupo vinculado', 'groupPublicUrl', 'groupUrlCopy', 'Copiar link do grupo', 'copyGroupLink()', 'Nenhum grupo vinculado'),
    '      <div class="registration-actions">',
    '        ' + action('groupOpen', true, 'openGroupLink()', WHATSAPP, 'Abrir grupo'),
    '        ' + action('groupCopy', false, 'copyGroupLink()', svg(ICONS.copy), 'Copiar link'),
    '      </div>',
    '      ' + editButton('groupEdit', 'groupConfig', 'editGroupLink()', 'groupEditLabel', 'Trocar link'),
    '      ' + groupConfig,
    '    </div>',
    // Contatos (sem mudanças)
    contacts,
    // Anamnese e Planos (novos)
    optionalPanel('anamnesis', {
      icon: 'anamnesis', heading: 'Link da anamnese', text: 'Envie a ficha de anamnese para o aluno preencher.',
      fieldLabel: 'Seu link de anamnese', copyLabel: 'Copiar link da anamnese', editTitle: 'Link da anamnese', settingLabel: 'Endereço da anamnese'
    }),
    optionalPanel('plans', {
      icon: 'plans', heading: 'Link dos planos', text: 'Envie a página com os seus planos.',
      fieldLabel: 'Seu link de planos', copyLabel: 'Copiar link dos planos', editTitle: 'Link dos planos', settingLabel: 'Endereço dos planos'
    })
  ];
  return lines.join('\n') + '\n';
}

// ---------- CSS (tudo restrito à janela Cadastro por link; segue o tema/cores escolhidos no app) ----------
const ACC = 'rgba(var(--ac-accent-rgb,161,44,255),';
const CSS = '<style id="ap-registration-hub-css">' + [
  '#registrationLinkDialog .sheet-head{justify-content:flex-start;gap:12px;margin-bottom:16px}',
  '#registrationLinkDialog .sheet-head h3{flex:1 1 auto;min-width:0}',
  '#registrationLinkDialog .sheet-head .close{flex:none;margin-left:auto}',
  '#registrationLinkDialog :is(.registration-head-icon,.registration-tile-icon,.registration-intro-icon){display:grid;place-items:center;flex:none;color:var(--ac-on-primary,#fff);background:linear-gradient(145deg,var(--ac-primary-middle,#9a22dd),var(--ac-primary-end,#af22f9));box-shadow:inset 0 1px 0 rgba(255,255,255,.26),0 3px 12px ' + ACC + '.32)}',
  '#registrationLinkDialog .registration-head-icon{width:42px;height:42px;border-radius:13px;border:1px solid var(--nt-rim,rgba(255,255,255,.16))}',
  '#registrationLinkDialog .registration-head-icon svg{width:23px;height:23px}',
  '#registrationLinkDialog .registration-tabs{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 18px;padding-bottom:18px;border-bottom:1px solid var(--ac-line,var(--line))}',
  '#registrationLinkDialog .registration-tabs button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-width:0;min-height:86px;padding:12px 6px 10px;border:1px solid var(--nt-edge,var(--ac-line,var(--line)));border-radius:16px;background:var(--nt-card,var(--ac-surface,var(--panel2)));color:var(--ac-text,var(--text));font-weight:700;-webkit-tap-highlight-color:transparent;transition:border-color .15s,box-shadow .15s}',
  '#registrationLinkDialog .registration-tabs button[aria-selected=true]{color:var(--ac-text,var(--text));border-color:var(--nt-rim,var(--ac-accent,var(--purple)));background:var(--nt-card,var(--ac-surface,var(--panel)));box-shadow:0 0 0 1px var(--nt-rim,var(--ac-accent,var(--purple))),0 0 16px ' + ACC + '.34),inset 0 0 14px ' + ACC + '.1)}',
  '#registrationLinkDialog .registration-tabs button:focus-visible{outline:2px solid var(--ac-accent,var(--purple));outline-offset:2px}',
  '#registrationLinkDialog .registration-tile-icon{width:40px;height:40px;border-radius:50%}',
  '#registrationLinkDialog .registration-tile-icon svg{width:22px;height:22px}',
  '#registrationLinkDialog .registration-tile-label{max-width:100%;font-size:calc((.8rem) * var(--ap-ts,1));line-height:1.15;text-align:center;overflow-wrap:anywhere}',
  '#registrationLinkDialog .registration-intro{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;column-gap:12px;row-gap:6px;margin:0 0 18px;text-align:center}',
  '#registrationLinkDialog .registration-intro-icon{width:44px;height:44px;border-radius:50%}',
  '#registrationLinkDialog .registration-intro-icon svg{width:24px;height:24px}',
  '#registrationLinkDialog .registration-intro h4{flex:0 1 auto;min-width:0;margin:0;text-align:left;font-size:calc((1.15rem) * var(--ap-ts,1));line-height:1.2}',
  '#registrationLinkDialog .registration-intro p{flex:0 0 100%;margin:4px 0 0;color:var(--ac-muted,var(--muted));font-size:calc((.88rem) * var(--ap-ts,1));line-height:1.5}',
  '#registrationLinkDialog .registration-urlfield{position:relative;display:block;margin:0}',
  '#registrationLinkDialog .registration-urlfield input{min-height:50px;padding:12px 52px 12px 14px;font-size:calc((.86rem) * var(--ap-ts,1));text-overflow:ellipsis}',
  '#registrationLinkDialog .registration-urlcopy{position:absolute;right:5px;bottom:5px;display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;border-radius:10px;background:transparent;color:var(--ac-text,var(--text))}',
  '#registrationLinkDialog .registration-urlcopy svg{width:21px;height:21px}',
  '#registrationLinkDialog .registration-urlcopy:disabled{opacity:.4}',
  '#registrationLinkDialog .registration-urlcopy:focus-visible{outline:2px solid var(--ac-accent,var(--purple));outline-offset:-2px}',
  '#registrationLinkDialog .registration-actions{grid-template-columns:1fr;gap:10px;margin:14px 0 0}',
  '#registrationLinkDialog :is(.registration-actions .btn,.registration-edit-link){display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;margin:0;border-radius:14px;font-size:calc((.92rem) * var(--ap-ts,1));font-weight:700;color:var(--ac-text,var(--text))}',
  '#registrationLinkDialog .registration-actions .btn.primary{color:var(--ac-on-primary,#fff)}',
  '#registrationLinkDialog .registration-edit-link{margin-top:10px}',
  '#registrationLinkDialog :is(.registration-actions .btn,.registration-edit-link) svg{flex:none;width:21px;height:21px}',
  '#registrationLinkDialog .registration-actions .btn:disabled{opacity:.45}',
  '#registrationLinkDialog .registration-editor-remove{grid-column:1/-1}',
  // Metal e Profundo redesenham todos os ícones em relevo (tom sobre tom). Sobre o círculo roxo cheio o desenho some,
  // então nesses dois temas o círculo usa a mesma placa escura que o app já usa nos ícones do menu Mais.
  'html[data-agenda-design=metal-tl] #registrationLinkDialog :is(.registration-head-icon,.registration-tile-icon,.registration-intro-icon),' +
  'html[data-agenda-design=deep-tl] #registrationLinkDialog :is(.registration-head-icon,.registration-tile-icon,.registration-intro-icon)' +
  '{color:var(--ac-accent);background:var(--nt-icon-bg);border:1px solid ' + ACC + '.48);box-shadow:inset 0 1px 8px ' + ACC + '.07),0 0 10px ' + ACC + '.07)}'
].join('') + '</style>';
const CSS_END = '@media(max-width:350px){.registration-config{padding:12px}.registration-editor-actions{gap:8px}}</style>';

// ---------- JavaScript (dentro do script data-agenda-registration, onde ficam Cadastro, Instalação e Grupo) ----------
const OPTIONAL_JS = [
  'const optionalLinkFields = {anamnesis: "anamnesisLink", plans: "plansLink"};',
  'const optionalLinkTitles = {anamnesis: "da anamnese", plans: "dos planos"};',
  'function optionalLinkUrl(key) {',
  '  return installationUrl(state[optionalLinkFields[key]]?.url);',
  '}',
  'function renderOptionalLink(key, editing = false) {',
  '  const url = optionalLinkUrl(key);',
  '  const open = editing || !url;',
  '  c(key + "PublicUrl").value = url;',
  '  c(key + "UrlSetting").value = url;',
  '  c(key + "UrlCopy").disabled = !url;',
  '  c(key + "Copy").disabled = !url;',
  '  c(key + "WhatsApp").disabled = !url;',
  '  c(key + "Remove").hidden = !url;',
  '  c(key + "EditLabel").textContent = url ? "Alterar link" : "Adicionar link";',
  '  c(key + "Config").hidden = !open;',
  '  c(key + "Edit").setAttribute("aria-expanded", String(open));',
  '}',
  'function editOptionalLink(key) {',
  '  renderOptionalLink(key, true);',
  '  l("");',
  '  c(key + "UrlSetting").focus();',
  '  c(key + "UrlSetting").select();',
  '  c(key + "Config").scrollIntoView({block: "nearest", behavior: "smooth"});',
  '}',
  'function cancelOptionalLinkEdit(key) {',
  '  renderOptionalLink(key);',
  '  l("");',
  '  c(key + "Edit").focus();',
  '}',
  'function saveOptionalLink(key, event) {',
  '  event.preventDefault();',
  '  const url = installationUrl(c(key + "UrlSetting").value);',
  '  if (!url) {',
  '    l("Informe um endereço https:// publicado na internet.", true);',
  '    return;',
  '  }',
  '  try {',
  '    saveConfiguredLink(optionalLinkFields[key], url);',
  '    renderOptionalLink(key);',
  '    l("Link " + optionalLinkTitles[key] + " salvo.");',
  '  } catch (_) {',
  '    l("Não foi possível salvar o link. Confira o armazenamento do aplicativo.", true);',
  '  }',
  '}',
  'function removeOptionalLink(key) {',
  '  try {',
  '    saveConfiguredLink(optionalLinkFields[key], "");',
  '    renderOptionalLink(key);',
  '    l("Link " + optionalLinkTitles[key] + " removido.");',
  '  } catch (_) {',
  '    l("Não foi possível remover o link. Confira o armazenamento do aplicativo.", true);',
  '  }',
  '}',
  'function copyOptionalLink(key) {',
  '  const url = optionalLinkUrl(key);',
  '  if (!url) { l("Adicione o link primeiro.", true); return; }',
  '  return copyPublicLink(url, key + "PublicUrl");',
  '}',
  'function shareOptionalLink(key) {',
  '  const url = optionalLinkUrl(key);',
  '  if (!url) { l("Adicione o link primeiro.", true); return; }',
  '  sharePublicLink(url);',
  '}',
  'for (const key of Object.keys(optionalLinkFields)) c(key + "UrlForm").onsubmit = event => saveOptionalLink(key, event);',
  'window.apRegistrationLinks = Object.freeze({edit: editOptionalLink, cancel: cancelOptionalLinkEdit, remove: removeOptionalLink, copy: copyOptionalLink, share: shareOptionalLink});',
  ''
].join('\n');

// [antes, depois] — cada "antes" aparece exatamente uma vez no professor.html do 1.12.280.
function cssJsEdits() {
  return [
    [CSS_END, CSS_END + CSS],
    [
      '  ["contacts", "registrationContactsTab", "registrationContactsPanel"],\n];',
      '  ["contacts", "registrationContactsTab", "registrationContactsPanel"],\n  ["anamnesis", "anamnesisLinkTab", "anamnesisLinkPanel"],\n  ["plans", "plansLinkTab", "plansLinkPanel"],\n];'
    ],
    [
      '  n = tab === "installation" || tab === "group" || tab === "contacts" ? tab : "link";',
      '  n = ["installation", "group", "contacts", "anamnesis", "plans"].includes(tab) ? tab : "link";'
    ],
    [
      '  else if (n === "group") renderGroupLink();\n  else if (n === "contacts") U();',
      '  else if (n === "group") renderGroupLink();\n  else if (n === "anamnesis" || n === "plans") renderOptionalLink(n);\n  else if (n === "contacts") U();'
    ],
    // O botão Trocar link/Vincular grupo agora tem ícone: o texto vai num <span>.
    [
      '  c("groupEdit").textContent = url ? "Trocar link" : "Vincular grupo";',
      '  c("groupUrlCopy").disabled = !url;\n  c("groupEditLabel").textContent = url ? "Trocar link" : "Vincular grupo";'
    ],
    // Cadastro: o botão de copiar dentro do campo também fica desativado quando não há link.
    [
      'c("registrationCopy").disabled=!t;',
      'c("registrationCopy").disabled=!t;c("registrationUrlCopy").disabled=!t;'
    ],
    ['c("groupUrlForm").onsubmit = saveGroupLink;', OPTIONAL_JS + 'c("groupUrlForm").onsubmit = saveGroupLink;']
  ];
}

function applyHub(page) {
  const a = page.indexOf(START);
  assert.ok(a >= 0, 'Início da janela Cadastro por link não encontrado');
  assert.equal(page.indexOf(START, a + START.length), -1, 'Início da janela duplicado');
  const b = page.indexOf(END, a);
  assert.ok(b > a, 'Fim da janela Cadastro por link não encontrado');
  assert.equal(page.indexOf(END, b + END.length), -1, 'Fim da janela duplicado');
  const old = page.slice(a, b);
  assert.equal(sha256(old), OLD_BLOCK_SHA256, 'A janela Cadastro por link mudou: revise o gerador antes de continuar');
  let out = page.slice(0, a) + buildBlock(old) + page.slice(b);
  for (const [previous, next] of cssJsEdits()) out = replaceOne(out, previous, next);
  return out;
}

function makeUpdate(source) {
  const base = voltar.makeUpdate(source); // confere 1.12.278 / seq 384, tira a assinatura e aplica o Voltar
  assert.equal(base.version, '1.12.280');
  assert.equal(base.sequence, 386);
  const files = {...base.files, 'professor.html': applyHub(base.files['professor.html'])};
  return {...base, files, version, sequence, notes, update: {...base.update, title, summary}};
}

if (require.main === module) {
  const [, , sourceFile, targetFile = 'AgendaPersonal-1.12.281-Links-Visual-Anamnese-Planos-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-links-visual-1.12.281.cjs AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json [saida.agenda.json]');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {makeUpdate, applyHub, buildBlock, cssJsEdits, version, sequence, title, summary, notes, START, END, OLD_BLOCK_SHA256, TABS};
