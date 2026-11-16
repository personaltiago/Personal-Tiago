'use strict';

const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.276';
const sequence = 382;
const name = 'AgendaPersonal-1.12.276-Links-Cadastro-Instalacao-Para-Assinar.agenda.json';
const summary = 'Adiciona o link de instalação, com edição e compartilhamento independentes do link de cadastro.';

const migrationFrom274 = [
  [
    "function u(t){const e=String(t||\"\").trim();if(!e)return\"\";try{const t=new URL(e);if(t.protocol!==\"https:\"||t.username||t.password||!t.hostname.includes(\".\")||/^(localhost|127\\.|0\\.|\\[)/i.test(t.hostname))return\"\";t.hash=\"\";t.searchParams.set(\"cadastro\",\"1\");return t.toString()}catch(t){return\"\"}}",
    "\nconst publicRegistrationUrl = new URL(\"https://personaltiago.github.io/agenda-personal-distribuicao/cadastro-aluno.html?cadastro=1&capa=3\");\nfunction u(rawUrl) {\n  const value = String(rawUrl || \"\").trim();\n  if (!value) return \"\";\n  try {\n    const url = new URL(value);\n    if (url.protocol !== \"https:\" || url.username || url.password ||\n        !url.hostname.includes(\".\") || /^(localhost|127\\.|0\\.|\\[)/i.test(url.hostname)) return \"\";\n    if (url.origin === publicRegistrationUrl.origin &&\n        url.pathname === \"/Personal-Tiago/cadastro-aluno.html\") {\n      url.pathname = publicRegistrationUrl.pathname;\n    }\n    url.hash = \"\";\n    url.searchParams.set(\"cadastro\", \"1\");\n    return url.toString();\n  } catch (_) {\n    return \"\";\n  }\n}\n"
  ],
  [
    "p()||u(\"https://personaltiago.github.io/Personal-Tiago/cadastro-aluno.html\")",
    "p()||publicRegistrationUrl.toString()"
  ]
];
const edits = [
  [
    ".registration-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}",
    ".registration-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:20px}"
  ],
  [
    ".registration-tabs button{border:1px solid var(--line);border-radius:12px;background:var(--panel2);color:var(--muted);padding:12px;min-height:44px;font-weight:700}",
    ".registration-tabs button{min-width:0;border:1px solid var(--line);border-radius:12px;background:var(--panel2);color:var(--muted);padding:10px 4px;min-height:44px;font-weight:700}"
  ],
  [
    "#registrationPublicUrl{",
    "#registrationPublicUrl,#installationPublicUrl{"
  ],
  [
    "#registrationConfig[hidden]{",
    "#registrationConfig[hidden],#installationConfig[hidden]{"
  ],
  [
    "#registrationUrlSetting{",
    "#registrationUrlSetting,#installationUrlSetting{"
  ],
  [
    "<button id=\"registrationLinkTab\" type=\"button\" role=\"tab\" aria-selected=\"true\" aria-controls=\"registrationLinkPanel\" onclick=\"setRegistrationTab('link')\">Link</button>",
    "<button id=\"registrationLinkTab\" type=\"button\" role=\"tab\" aria-selected=\"true\" aria-controls=\"registrationLinkPanel\" onclick=\"setRegistrationTab('link')\">Cadastro</button>\n      <button id=\"installationLinkTab\" type=\"button\" role=\"tab\" aria-selected=\"false\" aria-controls=\"installationLinkPanel\" onclick=\"setRegistrationTab('installation')\">Instalação</button>"
  ],
  [
    "    <div id=\"registrationContactsPanel\" role=\"tabpanel\"",
    "    <div id=\"installationLinkPanel\" role=\"tabpanel\" aria-labelledby=\"installationLinkTab\" hidden>\n      <div class=\"registration-intro\"><h4>Link de instalação</h4><p>Envie a página de instalação do Agenda Personal para Android e iPhone.</p></div>\n      <label class=\"field full\"><span>Seu link de instalação</span><input id=\"installationPublicUrl\" readonly onclick=\"this.select()\"></label>\n      <div class=\"registration-actions\">\n        <button id=\"installationCopy\" class=\"btn\" type=\"button\" onclick=\"copyInstallationLink()\">Copiar link</button>\n        <button id=\"installationWhatsApp\" class=\"btn\" type=\"button\" onclick=\"shareInstallationLink()\">Enviar pelo WhatsApp</button>\n      </div>\n      <button id=\"installationEdit\" class=\"btn registration-edit-link\" type=\"button\" aria-expanded=\"false\" aria-controls=\"installationConfig\" onclick=\"editInstallationLink()\">Alterar link</button>\n      <section class=\"registration-config\" id=\"installationConfig\" aria-labelledby=\"installationEditTitle\" hidden>\n        <h4 id=\"installationEditTitle\">Alterar link de instalação</h4>\n        <form id=\"installationUrlForm\">\n          <label class=\"field full\"><span>Novo endereço de instalação</span><input id=\"installationUrlSetting\" type=\"url\" inputmode=\"url\" required autocomplete=\"url\" autocapitalize=\"none\" spellcheck=\"false\"></label>\n          <div class=\"registration-editor-actions\"><button class=\"btn primary\" type=\"submit\">Salvar link</button><button class=\"btn\" type=\"button\" onclick=\"cancelInstallationLinkEdit()\">Cancelar</button></div>\n        </form>\n      </section>\n    </div>\n    <div id=\"registrationContactsPanel\" role=\"tabpanel\""
  ],
  [
    "function u(rawUrl) {\n  const value = String(rawUrl || \"\").trim();\n  if (!value) return \"\";\n  try {\n    const url = new URL(value);\n    if (url.protocol !== \"https:\" || url.username || url.password ||\n        !url.hostname.includes(\".\") || /^(localhost|127\\.|0\\.|\\[)/i.test(url.hostname)) return \"\";\n    if (url.origin === publicRegistrationUrl.origin &&\n        url.pathname === \"/Personal-Tiago/cadastro-aluno.html\") {\n      url.pathname = publicRegistrationUrl.pathname;\n    }\n    url.hash = \"\";\n    url.searchParams.set(\"cadastro\", \"1\");\n    return url.toString();\n  } catch (_) {\n    return \"\";\n  }\n}\n",
    "const defaultInstallationUrl = \"https://personaltiago.github.io/agenda-personal-distribuicao/instalar.html\";\nfunction parsePublicLink(rawUrl) {\n  const value = String(rawUrl || \"\").trim();\n  if (!value) return null;\n  try {\n    const url = new URL(value);\n    if (url.protocol !== \"https:\" || url.username || url.password ||\n        !url.hostname.includes(\".\") || /^(localhost|127\\.|0\\.|\\[)/i.test(url.hostname)) return null;\n    return url;\n  } catch (_) {\n    return null;\n  }\n}\nfunction u(rawUrl) {\n  const url = parsePublicLink(rawUrl);\n  if (!url) return \"\";\n  if (url.origin === publicRegistrationUrl.origin &&\n      url.pathname === \"/Personal-Tiago/cadastro-aluno.html\") {\n    url.pathname = publicRegistrationUrl.pathname;\n  }\n  url.hash = \"\";\n  url.searchParams.set(\"cadastro\", \"1\");\n  return url.toString();\n}\nfunction installationUrl(rawUrl) {\n  const url = parsePublicLink(rawUrl);\n  return url && url.hostname !== \"appassets.androidplatform.net\" ? url.toString() : \"\";\n}\nfunction getInstallationLink() {\n  return installationUrl(state.installationLink?.url) || defaultInstallationUrl;\n}\nfunction saveConfiguredLink(field, url) {\n  const value = {version: 1, url};\n  localStorage.setItem(DB_KEY, JSON.stringify({...state, [field]: value}));\n  state[field] = value;\n}\nfunction renderInstallationLink(editing = false) {\n  const url = getInstallationLink();\n  c(\"installationPublicUrl\").value = url;\n  c(\"installationUrlSetting\").value = url;\n  c(\"installationConfig\").hidden = !editing;\n  c(\"installationEdit\").setAttribute(\"aria-expanded\", String(editing));\n}\nfunction editInstallationLink() {\n  renderInstallationLink(true);\n  l(\"\");\n  c(\"installationUrlSetting\").focus();\n  c(\"installationUrlSetting\").select();\n  c(\"installationConfig\").scrollIntoView({block: \"nearest\", behavior: \"smooth\"});\n}\nfunction cancelInstallationLinkEdit() {\n  renderInstallationLink();\n  l(\"\");\n  c(\"installationEdit\").focus();\n}\nfunction saveInstallationLink(event) {\n  event.preventDefault();\n  const url = installationUrl(c(\"installationUrlSetting\").value);\n  if (!url) {\n    l(\"Informe um endereço https:// publicado na internet.\", true);\n    return;\n  }\n  try {\n    saveConfiguredLink(\"installationLink\", url);\n    renderInstallationLink();\n    l(\"Endereço de instalação salvo.\");\n  } catch (_) {\n    l(\"Não foi possível salvar o endereço. Confira o armazenamento do aplicativo.\", true);\n  }\n}\n"
  ],
  [
    "const a={version:1,url:e};try{localStorage.setItem(DB_KEY,JSON.stringify({...state,registrationLink:a}));state.registrationLink=a;f();l(\"Endereço de cadastro salvo.\")}",
    "try{saveConfiguredLink(\"registrationLink\",e);f();l(\"Endereço de cadastro salvo.\")}"
  ],
  [
    "function D(t){cancelRegistrationRemoval(false);n=t===\"contacts\"?\"contacts\":\"link\";s++;l(\"\");for(const t of[\"link\",\"contacts\"]){const e=t===n;c(t===\"link\"?\"registrationLinkTab\":\"registrationContactsTab\").setAttribute(\"aria-selected\",String(e));c(t===\"link\"?\"registrationLinkPanel\":\"registrationContactsPanel\").hidden=!e}if(n===\"link\")f();else U()}",
    "\nconst studentLinkTabs = [\n  [\"link\", \"registrationLinkTab\", \"registrationLinkPanel\"],\n  [\"installation\", \"installationLinkTab\", \"installationLinkPanel\"],\n  [\"contacts\", \"registrationContactsTab\", \"registrationContactsPanel\"],\n];\nfunction D(tab) {\n  cancelRegistrationRemoval(false);\n  n = tab === \"installation\" || tab === \"contacts\" ? tab : \"link\";\n  s++;\n  l(\"\");\n  for (const [name, buttonId, panelId] of studentLinkTabs) {\n    const selected = name === n;\n    c(buttonId).setAttribute(\"aria-selected\", String(selected));\n    c(panelId).hidden = !selected;\n  }\n  if (n === \"installation\") renderInstallationLink();\n  else if (n === \"contacts\") U();\n  else f();\n}\n"
  ],
  [
    "async function x(){const t=g();if(!t){l(\"Configure o endereço publicado do formulário primeiro.\",true);return}try{await navigator.clipboard.writeText(t);l(\"Link copiado.\")}catch(t){const e=c(\"registrationPublicUrl\");e.focus();e.select();let a=false;try{a=document.execCommand(\"copy\")}catch(t){}l(a?\"Link copiado.\":\"O link está selecionado. Toque e segure para copiar.\")}}function I(){const t=g();if(!t){l(\"Configure o endereço publicado do formulário primeiro.\",true);return}const e=\"https://wa.me/?text=\"+encodeURIComponent(t);try{if(window.Android?.openExternal){Android.openExternal(e);return}}catch(t){}window.open(e,\"_blank\",\"noopener\")}",
    "\nasync function copyPublicLink(url, inputId) {\n  if (!url) {\n    l(\"Configure o endereço publicado do formulário primeiro.\", true);\n    return;\n  }\n  try {\n    await navigator.clipboard.writeText(url);\n    l(\"Link copiado.\");\n  } catch (_) {\n    const input = c(inputId);\n    input.focus();\n    input.select();\n    let copied = false;\n    try { copied = document.execCommand(\"copy\"); } catch (_) {}\n    l(copied ? \"Link copiado.\" : \"O link está selecionado. Toque e segure para copiar.\");\n  }\n}\nfunction sharePublicLink(url) {\n  if (!url) {\n    l(\"Configure o endereço publicado do formulário primeiro.\", true);\n    return;\n  }\n  const whatsapp = \"https://wa.me/?text=\" + encodeURIComponent(url);\n  try {\n    if (window.Android?.openExternal) {\n      Android.openExternal(whatsapp);\n      return;\n    }\n  } catch (_) {}\n  window.open(whatsapp, \"_blank\", \"noopener\");\n}\nfunction x() { return copyPublicLink(g(), \"registrationPublicUrl\"); }\nfunction I() { sharePublicLink(g()); }\nfunction copyInstallationLink() { return copyPublicLink(getInstallationLink(), \"installationPublicUrl\"); }\nfunction shareInstallationLink() { sharePublicLink(getInstallationLink()); }\nc(\"installationUrlForm\").onsubmit = saveInstallationLink;\nwindow.editInstallationLink = editInstallationLink;\nwindow.cancelInstallationLinkEdit = cancelInstallationLinkEdit;\nwindow.copyInstallationLink = copyInstallationLink;\nwindow.shareInstallationLink = shareInstallationLink;\n"
  ]
];

function replaceOne(source, previous, next) {
  const index = source.indexOf(previous);
  assert.ok(index >= 0, 'O trecho esperado não existe: ' + previous.slice(0, 80));
  assert.equal(source.indexOf(previous, index + previous.length), -1, 'O trecho está duplicado: ' + previous.slice(0, 80));
  return source.slice(0, index) + next + source.slice(index + previous.length);
}

function patchProfessor(page, sourceVersion) {
  const changes = sourceVersion === '1.12.274' ? [...migrationFrom274, ...edits] : edits;
  return changes.reduce((current, [previous, next]) => replaceOne(current, previous, next), page);
}

function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, 'com.tiagolima.agendapersonal');
  const allowedSequences = {'1.12.274': 380, '1.12.275': 381};
  assert.ok(Object.hasOwn(allowedSequences, source.version), 'Use o pacote 1.12.274 do GitHub ou a 1.12.275.');
  assert.equal(source.sequence, allowedSequences[source.version]);
  for (const page of ['index.html', 'professor.html', 'avaliacoes.html', 'cadastro.html']) {
    assert.equal(typeof source.files?.[page], 'string', 'Página ausente: ' + page);
  }

  const { agendaSignature, ...original } = source;
  const files = {...original.files, 'professor.html': patchProfessor(original.files['professor.html'], source.version)};
  const module = files['professor.html'].split('<script data-agenda-registration>')[1]?.split('</script>')[0];
  assert.ok(module, 'Módulo de cadastro ausente.');
  new Function(module);

  return {
    ...original,
    files,
    version,
    sequence,
    notes: summary,
    update: {...original.update, title: 'Cadastro e instalação dos alunos', summary},
  };
}

if (require.main === module) {
  const [, , sourceFile, targetFile = name] = process.argv;
  assert.ok(sourceFile, 'Uso: node tools/gerar-links-alunos-1.12.276.cjs arquivo-base.agenda.json');
  const data = makeUpdate(JSON.parse(readFileSync(sourceFile, 'utf8')));
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {makeUpdate};
