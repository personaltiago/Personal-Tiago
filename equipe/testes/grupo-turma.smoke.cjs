'use strict';
// Testa o botão "Grupo da turma" do pacote 1.12.278 usando um link FICTÍCIO.
const {JSDOM} = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.join(__dirname, '../..');
const G = require(path.join(ROOT, 'tools/gerar-grupo-turma-1.12.278.cjs'));
const o = JSON.parse(fs.readFileSync(path.join(ROOT, 'AgendaPersonal-1.12.276-Links-Cadastro-Instalacao-Para-Assinar.agenda.json'), 'utf8'));
const FAKE = 'https://chat.whatsapp.com/AbCdEfGhIjKlMn12';
const p = G.makeUpdate(o, FAKE + '?s=cl&p=a&iam=2');
const I = p.files['index.html'];
let ok = 0, bad = 0;
const t = (n, f) => { try { f(); ok++; console.log('OK   ' + n); } catch (e) { bad++; console.log('FALHA ' + n + ' -> ' + e.message); } };

for (const raw of ['http://chat.whatsapp.com/AbCdEfGhIjKlMn12', 'https://chat.whatsapp.com.evil.com/AbCdEfGhIjKlMn12', 'https://user:pw@chat.whatsapp.com/AbCdEfGhIjKlMn12', 'https://chat.whatsapp.com/curto', 'javascript:alert(1)', '', undefined]) {
  t('Gerador recusa link inválido: ' + String(raw).slice(0, 50), () => assert.throws(() => G.makeUpdate(o, raw)));
}
t('Gerador normaliza e descarta a consulta (?s=…)', () => assert.equal(G.normalizeGroupLink(FAKE + '?s=cl&p=a&iam=2'), FAKE));

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
const area = {enabled: true, trainer: {name: 'Tiago Lima', subtitle: 'Personal Trainer', cref: '123', photo: ''}};
let a = boot(area, {android: true});
t('Aluno aprovado: botão "Grupo da turma" aparece no cartão do profissional', () => { const b = a.q('#apHomeProfessional .ap-group-button'); assert(b); assert.equal(b.textContent, 'Grupo da turma'); assert.equal(b.type, 'button'); });
a.q('#apHomeProfessional .ap-group-button').click();
t('Android: abre pelo sistema (Android.openExternal) com o link exato, sem window.open', () => { assert.deepEqual(a.log.ext, [FAKE]); assert.equal(a.log.open.length, 0); });
const w2 = boot(area); w2.q('#apHomeProfessional .ap-group-button').click();
t('Navegador (iPhone/web): window.open em nova aba com noopener,noreferrer', () => assert.deepEqual(w2.log.open, [[FAKE, '_blank', 'noopener,noreferrer']]));
t('Também aparece na tela de perfil', () => assert(w2.q('#apProfileProfessional .ap-group-button')));
t('Acesso bloqueado (enabled=false): cartão oculto e sem botão', () => { const x = boot({...area, enabled: false}); assert.equal(x.q('.ap-group-button'), null); assert.equal(x.q('#apHomeProfessional').hidden, true); });
t('O link nunca aparece como texto na tela', () => assert(!a.q('#apHomeProfessional').textContent.includes('whatsapp')));

const undo = (page, edits) => [...edits].reverse().reduce((cur, [prev, next]) => { assert.equal(cur.split(next).length - 1, 1, 'trecho novo duplicado/ausente'); return cur.replace(next, () => prev); }, page);
t('Prova de reversão: desfazendo só as edições previstas, o index.html volta byte a byte ao 1.12.276', () => assert.equal(undo(I, G.studentEditsFor(FAKE)), o.files['index.html']));
t('Só o index.html mudou; versão 1.12.278 / seq 384 / sem assinatura', () => { for (const k of Object.keys(o.files)) if (k !== 'index.html') assert.equal(p.files[k], o.files[k], k); assert.notEqual(I, o.files['index.html']); assert.equal(p.version, '1.12.278'); assert.equal(p.sequence, 384); assert(!('agendaSignature' in p)); });
t('Texto acrescentado não menciona descanso, alarme, notificação ou cronômetro', () => { for (const [prev, next] of G.studentEditsFor(FAKE)) { const added = next.split(prev).join(''); assert(!/(rest\b|restSeconds|alarm|notif|timer|descanso|cron)/i.test(added), added.slice(0, 120)); } });
t('Nenhum link de convite literal no gerador nem neste teste, só o fictício', () => { for (const f of ['tools/gerar-grupo-turma-1.12.278.cjs', 'equipe/testes/grupo-turma.smoke.cjs']) { const src = fs.readFileSync(path.join(ROOT, f), 'utf8'); const hits = [...src.matchAll(/chat\.whatsapp\.com\/([A-Za-z0-9]{10,40})/g)].map(m => m[1]); assert.deepEqual(hits.filter(h => h !== 'AbCdEfGhIjKlMn12'), [], f); } });
console.log(`\nresultado: ${ok} ok, ${bad} falhas`);
process.exit(bad ? 1 : 0);
