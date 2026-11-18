'use strict';
// Testa a aba "Grupo" (professor) e o botão "Grupo da turma" (aluno) do pacote 1.12.278 usando um link FICTÍCIO.
const {JSDOM} = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.join(__dirname, '../..');
const G = require(path.join(ROOT, 'tools/gerar-grupo-turma-1.12.278.cjs'));
const o = JSON.parse(fs.readFileSync(path.join(ROOT, 'AgendaPersonal-1.12.276-Links-Cadastro-Instalacao-Para-Assinar.agenda.json'), 'utf8'));
const FAKE = 'https://chat.whatsapp.com/AbCdEfGhIjKlMn12';
const FAKE2 = 'https://chat.whatsapp.com/ZyXwVuTsRqPoNm98';
const p = G.makeUpdate(o);
const I = p.files['index.html'];
const P = p.files['professor.html'];
let ok = 0, bad = 0;
const t = (n, f) => { try { f(); ok++; console.log('OK   ' + n); } catch (e) { bad++; console.log('FALHA ' + n + ' -> ' + e.message); } };

t('Normalizador recusa links inválidos e descarta consulta', () => {
  for (const raw of ['http://chat.whatsapp.com/AbCdEfGhIjKlMn12', 'https://chat.whatsapp.com.evil.com/AbCdEfGhIjKlMn12', 'https://user:pw@chat.whatsapp.com/AbCdEfGhIjKlMn12', 'https://chat.whatsapp.com/curto', 'https://wa.me/123', 'javascript:alert(1)', '', undefined]) assert.equal(G.normalizeGroupLink(raw), '', String(raw));
  assert.equal(G.normalizeGroupLink(FAKE + '?s=cl&p=a&iam=2'), FAKE);
});

// ---------- Professor: aba Grupo ----------
const panelStart = P.indexOf('<div id="groupLinkPanel"');
const panelHtml = P.slice(panelStart, P.indexOf('<div id="registrationContactsPanel"', panelStart));
const fnStart = P.indexOf('function groupInviteUrl(raw){', P.indexOf('function shareInstallationLink()'));
const fnSrc = P.slice(fnStart, P.indexOf('window.copyGroupLink = copyGroupLink;', fnStart) + 'window.copyGroupLink = copyGroupLink;'.length);
const saveSrc = P.slice(P.indexOf('function saveConfiguredLink(field, url) {'), P.indexOf('function renderInstallationLink'));
function bootProf(initial, {android} = {}) {
  const dom = new JSDOM('<!doctype html><body>' + panelHtml + '<p id="registrationStatus"></p></body>', {runScripts: 'dangerously', url: 'https://appassets.androidplatform.net/assets/professor.html'});
  const w = dom.window; const log = {ext: [], open: [], copy: []};
  w.open = (...a) => { log.open.push(a); };
  w.scrollIntoView = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  if (android) w.Android = {openExternal: u => log.ext.push(u)};
  w.eval('const DB_KEY="k";const state=' + JSON.stringify(initial || {}) + ';const c=i=>document.getElementById(i);const l=(m,e)=>{c("registrationStatus").textContent=m;c("registrationStatus").dataset.err=e?"1":""};window.copyPublicLink=(u,i)=>{window.__copied=u};function copyPublicLink(u,i){window.__copied=u}' + saveSrc + fnSrc + ';window.__state=state;');
  return {w, log, q: s => w.document.querySelector(s), st: () => w.document.getElementById('registrationStatus')};
}
const submit = (x, value) => { x.q('#groupUrlSetting').value = value; x.q('#groupUrlForm').dispatchEvent(new x.w.Event('submit', {cancelable: true, bubbles: true})); };

t('Aba Grupo existe entre Instalação e Contatos, com 4 colunas de abas', () => {
  assert(P.indexOf('id="installationLinkTab"') < P.indexOf('id="groupLinkTab"') && P.indexOf('id="groupLinkTab"') < P.indexOf('id="registrationContactsTab"'));
  assert(P.includes('.registration-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))'));
  assert(P.includes('["group", "groupLinkTab", "groupLinkPanel"]'));
  assert(P.includes('tab === "installation" || tab === "group" || tab === "contacts"'));
  assert(P.includes('else if (n === "group") renderGroupLink();'));
});
let x = bootProf({}, {android: true}); x.w.renderGroupLink ? 0 : x.w.eval('window.renderGroupLink=renderGroupLink;window.saveGroupLink=saveGroupLink;');
t('Sem link: campo vazio, formulário aberto, abrir/copiar desativados, remover oculto', () => {
  x.w.eval('renderGroupLink()');
  assert.equal(x.q('#groupPublicUrl').value, ''); assert.equal(x.q('#groupConfig').hidden, false);
  assert(x.q('#groupOpen').disabled && x.q('#groupCopy').disabled); assert.equal(x.q('#groupRemove').hidden, true);
  assert.equal(x.q('#groupEdit').textContent, 'Vincular grupo');
});
t('Link inválido não grava nada', () => {
  for (const bad of ['https://example.com/x', 'http://chat.whatsapp.com/AbCdEfGhIjKlMn12', 'abc']) { submit(x, bad); assert.equal(x.st().dataset.err, '1'); assert.equal(x.w.__state.groupLink, undefined); assert.equal(x.w.localStorage.getItem('k'), null); }
});
t('Link válido: grava normalizado no estado e no armazenamento, fecha o formulário', () => {
  submit(x, FAKE + '?s=cl'); assert.deepEqual(x.w.__state.groupLink, {version: 1, url: FAKE});
  assert.equal(JSON.parse(x.w.localStorage.getItem('k')).groupLink.url, FAKE);
  assert.equal(x.q('#groupPublicUrl').value, FAKE); assert.equal(x.q('#groupConfig').hidden, true); assert.equal(x.q('#groupEdit').textContent, 'Trocar link');
  assert(!x.q('#groupOpen').disabled);
});
t('Abrir grupo (Android): usa Android.openExternal com o link exato', () => { x.q('#groupOpen').click(); assert.deepEqual(x.log.ext, [FAKE]); assert.equal(x.log.open.length, 0); });
t('Abrir grupo (navegador): window.open noopener,noreferrer', () => { const y = bootProf({groupLink: {version: 1, url: FAKE}}); y.w.eval('renderGroupLink()'); y.q('#groupOpen').click(); assert.deepEqual(y.log.open, [[FAKE, '_blank', 'noopener,noreferrer']]); });
t('Copiar entrega o link do grupo', () => { x.q('#groupCopy').click(); assert.equal(x.w.__copied, FAKE); });
t('Trocar link: abre o formulário preenchido e o novo link substitui o anterior', () => { x.q('#groupEdit').click(); assert.equal(x.q('#groupConfig').hidden, false); assert.equal(x.q('#groupUrlSetting').value, FAKE); submit(x, FAKE2); assert.equal(x.w.__state.groupLink.url, FAKE2); assert.equal(x.q('#groupPublicUrl').value, FAKE2); });
t('Remover grupo: limpa o link e volta ao estado vazio', () => { x.q('#groupEdit').click(); x.q('#groupRemove').click(); assert.equal(x.w.__state.groupLink.url, ''); assert.equal(x.q('#groupPublicUrl').value, ''); assert(x.q('#groupOpen').disabled); });
t('Cancelar a edição não altera o link salvo', () => { const y = bootProf({groupLink: {version: 1, url: FAKE}}); y.w.eval('renderGroupLink(true)'); y.q('#groupUrlSetting').value = 'lixo'; y.q('#groupConfig button[onclick="cancelGroupLinkEdit()"]').click(); assert.equal(y.q('#groupPublicUrl').value, FAKE); assert.equal(y.w.__state.groupLink.url, FAKE); });

// ---------- Ficha do aluno (makeArea) ----------
const mi = P.indexOf('function groupInviteUrl(raw){'); // primeira ocorrência: bloco do makeArea
const miEnd = P.indexOf('function makeArea(state,student,helpers={}){', mi);
const inviteSrc = P.slice(mi, miEnd);
const trainerLine = P.slice(P.indexOf('const trainer=state.trainerProfile||{};area.trainer='), P.indexOf('assertArea(area,linked||null)'));
function trainerFor(state) { return new Function('state', 'text', inviteSrc + ';const area={};' + trainerLine + ';return area.trainer;')(state, (v, n) => String(v || '').slice(0, n)); }
t('makeArea: sem link a ficha do aluno fica idêntica à anterior (sem a chave groupLink)', () => { const tr = trainerFor({trainerProfile: {name: 'Tiago'}}); assert.deepEqual(Object.keys(tr), ['name', 'subtitle', 'cref', 'photo']); assert.deepEqual(Object.keys(trainerFor({trainerProfile: {name: 'T'}, groupLink: {version: 1, url: ''}})), ['name', 'subtitle', 'cref', 'photo']); });
t('makeArea: com link válido entra só groupLink normalizado', () => { assert.equal(trainerFor({trainerProfile: {name: 'T'}, groupLink: {version: 1, url: FAKE}}).groupLink, FAKE); });
t('makeArea: link adulterado no armazenamento é ignorado', () => { for (const u of ['https://evil.com/AbCdEfGhIjKlMn12', 'javascript:alert(1)', 'http://chat.whatsapp.com/AbCdEfGhIjKlMn12']) assert.equal('groupLink' in trainerFor({trainerProfile: {name: 'T'}, groupLink: {version: 1, url: u}}), false); });

// ---------- Aluno: botão ----------
const f0 = I.indexOf('function y(){const e=window.__AP_STUDENT_CONTEXT,o=e?.area?.trainer;');
const fy = I.slice(f0, I.indexOf('removeProfilePhoto=function(){', f0));
function boot(area, {android} = {}) {
  const dom = new JSDOM('<!doctype html><body><div id="homeScroll"><header></header></div><div id="profileScroll"></div></body>', {runScripts: 'outside-only', url: 'https://appassets.androidplatform.net/assets/index.html'});
  const w = dom.window; const log = {ext: [], open: []};
  w.open = (...a) => { log.open.push(a); };
  if (android) w.Android = {openExternal: u => log.ext.push(u)};
  w.__AP_STUDENT_CONTEXT = {area};
  w.eval('const t=i=>document.getElementById(i);' + fy.replace(/^function y\(\)/, 'window.__y=function()') + ';window.__y();');
  return {w, log, q: s => w.document.querySelector(s)};
}
const area = {enabled: true, trainer: {groupLink: FAKE, name: 'Tiago Lima', subtitle: 'Personal Trainer', cref: '123', photo: ''}};
let a = boot(area, {android: true});
t('Aluno aprovado: botão "Grupo da turma" aparece no cartão do profissional', () => { const b = a.q('#apHomeProfessional .ap-group-button'); assert(b); assert.equal(b.getAttribute('aria-label'), 'Grupo da turma'); assert.equal(b.textContent, ''); assert(b.querySelector('svg')); assert.equal(b.type, 'button'); });
a.q('#apHomeProfessional .ap-group-button').click();
t('Android: abre pelo sistema (Android.openExternal) com o link exato, sem window.open', () => { assert.deepEqual(a.log.ext, [FAKE]); assert.equal(a.log.open.length, 0); });
const w2 = boot(area); w2.q('#apHomeProfessional .ap-group-button').click();
t('Navegador (iPhone/web): window.open em nova aba com noopener,noreferrer', () => assert.deepEqual(w2.log.open, [[FAKE, '_blank', 'noopener,noreferrer']]));
t('Também aparece na tela de perfil', () => assert(w2.q('#apProfileProfessional .ap-group-button')));
t('Acesso bloqueado (enabled=false): cartão oculto e sem botão', () => { const x = boot({...area, enabled: false}); assert.equal(x.q('.ap-group-button'), null); assert.equal(x.q('#apHomeProfessional').hidden, true); });
t('Sem groupLink (ou inválido) não aparece botão', () => { for (const gl of [undefined, '', 'https://evil.com/AbCdEfGhIjKlMn12', 'javascript:alert(1)']) { const z = boot({enabled: true, trainer: {groupLink: gl, name: 'T', subtitle: '', cref: '', photo: ''}}); assert.equal(z.q('.ap-group-button'), null); assert(z.q('#apHomeProfessional')); } });
t('Menu do professor: cartão Grupo da turma na seção Agenda, ícone próprio e abre pelo handler', () => {
  assert(P.includes('id="moreGroupLink"') && P.includes('onclick="openGroupFromMenu()"'));
  assert(P.includes("moreGroupLink:['agenda',4,'menu-group']"));
  assert(P.includes('window.APMoreMenuGlyphs=Object.freeze({"menu-group":'));
  assert(P.indexOf('id="moreGroupLink"') < P.indexOf('data-screen="makeup"', P.indexOf('id="moreGroupLink"')) );
});
t('openGroupFromMenu: com link abre o grupo; sem link abre a aba Grupo', () => {
  const y = bootProf({groupLink: {version: 1, url: FAKE}}, {android: true});
  y.w.eval('window.__tab=[];function L(){window.__tab.push("L")}function D(x){window.__tab.push(x)}' + P.slice(P.indexOf('function openGroupFromMenu() {'), P.indexOf('c("groupUrlForm").onsubmit')) + ';window.__m=openGroupFromMenu;');
  y.w.__m(); assert.deepEqual(y.log.ext, [FAKE]); assert.deepEqual(y.w.__tab, []);
  const z = bootProf({}); z.w.eval('window.__tab=[];function L(){window.__tab.push("L")}function D(x){window.__tab.push(x)}' + P.slice(P.indexOf('function openGroupFromMenu() {'), P.indexOf('c("groupUrlForm").onsubmit')) + ';window.__m=openGroupFromMenu;');
  z.w.__m(); assert.deepEqual(z.w.__tab, ['L', 'group']); assert.equal(z.log.ext.length + z.log.open.length, 0);
});
t('O link nunca aparece como texto na tela', () => assert(!a.q('#apHomeProfessional').textContent.includes('whatsapp')));

const undo = (page, edits) => [...edits].reverse().reduce((cur, [prev, next]) => { assert.equal(cur.split(next).length - 1, 1, 'trecho novo duplicado/ausente'); return cur.replace(next, () => prev); }, page);
t('Prova de reversão: desfazendo só as edições previstas, index.html e professor.html voltam byte a byte ao 1.12.276', () => { assert.equal(undo(I, G.studentEdits()), o.files['index.html']); assert.equal(undo(P, G.professorEdits()), o.files['professor.html']); });
t('Só index.html e professor.html mudaram; versão 1.12.278 / seq 384 / sem assinatura', () => { for (const k of Object.keys(o.files)) if (k !== 'index.html' && k !== 'professor.html') assert.equal(p.files[k], o.files[k], k); assert.notEqual(I, o.files['index.html']); assert.notEqual(P, o.files['professor.html']); assert.equal(p.version, '1.12.278'); assert.equal(p.sequence, 384); assert(!('agendaSignature' in p)); });
t('Texto acrescentado não menciona descanso, alarme, notificação ou cronômetro', () => { for (const [prev, next] of [...G.studentEdits(), ...G.professorEdits()]) { const added = next.split(prev).join(''); assert(!/(\brest\b|restSeconds|alarm|notific|timer|descanso|cron[oô]metro)/i.test(added), added.slice(0, 120)); } });
t('Pacote gerado não contém link de convite algum; gerador e teste só o fictício', () => { for (const f of ['tools/gerar-grupo-turma-1.12.278.cjs', 'equipe/testes/grupo-turma.smoke.cjs']) { const src = fs.readFileSync(path.join(ROOT, f), 'utf8'); const hits = [...src.matchAll(/chat\.whatsapp\.com\/([A-Za-z0-9]{10,40})/g)].map(m => m[1]); assert.deepEqual(hits.filter(h => !['AbCdEfGhIjKlMn12', 'ZyXwVuTsRqPoNm98'].includes(h)), [], f); } assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(I + P), 'pacote contém link'); });
console.log(`\nresultado: ${ok} ok, ${bad} falhas`);
process.exit(bad ? 1 : 0);
