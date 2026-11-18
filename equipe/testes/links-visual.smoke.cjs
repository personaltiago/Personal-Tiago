'use strict';
// Confere o pacote 1.12.281 (Cadastro por link: visual novo + Anamnese e Planos) contra o 1.12.278.
// O 1.12.281 soma o Voltar (1.12.280, gerador irmão) e a nova janela Cadastro por link (só professor.html).
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.join(__dirname, '../..');
const G = require(path.join(ROOT, 'tools/gerar-links-visual-1.12.281.cjs'));
const V = require(path.join(ROOT, 'tools/gerar-voltar-passo-a-passo-1.12.280.cjs'));
const o = JSON.parse(fs.readFileSync(path.join(ROOT, 'AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json'), 'utf8'));
const v = V.makeUpdate(o);   // conteúdo do 1.12.280 (Voltar), base direta do 1.12.281
const p = G.makeUpdate(o);
const page = p.files['professor.html'];
const base = v.files['professor.html'];
let ok = 0, bad = 0;
const t = (n, f) => { try { f(); ok++; console.log('OK   ' + n); } catch (e) { bad++; console.log('FALHA ' + n + ' -> ' + e.message); } };

const count = (text, part) => text.split(part).length - 1;
// Janela antiga: começa em START. Janela nova: o cabeçalho ganhou um ícone antes do título, então começa na <div class="sheet-head"> que contém o título.
const slice = (text, isNew) => {
  let a;
  if (isNew) {
    const title = text.indexOf('id="registrationLinkTitle"');
    assert(title >= 0, 'título da janela não encontrado');
    a = text.lastIndexOf('<div class="sheet-head">', title);
  } else {
    a = text.indexOf(G.START);
  }
  const b = a >= 0 ? text.indexOf(G.END, a) : -1;
  assert(a >= 0 && b > a, 'janela Cadastro por link não encontrada');
  return {a, b, block: text.slice(a, b)};
};
const idsOf = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const neu = slice(page, true);
const old = slice(base, false);

t('Versão 1.12.281 / seq 387 / sem assinatura, com o mesmo aplicativo e formato do 1.12.278', () => {
  assert.equal(p.version, '1.12.281');
  assert.equal(p.sequence, 387);
  assert.equal(p.agendaSignature, undefined);
  for (const k of ['format', 'appId', 'bridgeVersion', 'dataSchema']) assert.deepEqual(p[k], o[k], k);
  assert(p.sequence > o.sequence && p.sequence > v.sequence);
});
t('Texto do aviso: título, resumo e notas dentro dos limites', () => {
  assert.equal(p.update.title, 'Links dos alunos');
  assert(p.update.summary.length > 20 && p.update.summary.length <= 200, 'resumo: ' + p.update.summary.length);
  assert(p.notes.length > 100 && p.notes.length <= 4000, 'notas: ' + p.notes.length);
  assert(/Anamnese/.test(p.notes) && /Planos/.test(p.notes) && /1\.12\.280/.test(p.notes));
});
t('Só o professor.html mudou em relação ao 1.12.280: tela do aluno, avaliações, cadastro e histórico modular idênticos', () => {
  assert.equal(p.files['index.html'], v.files['index.html'], 'index.html');
  for (const k of ['avaliacoes.html', 'cadastro.html']) assert.equal(p.files[k], o.files[k], k);
  assert.notEqual(page, base);
  assert.deepEqual(p.modularUpdates, o.modularUpdates);
  assert.deepEqual(Object.keys(p.files), Object.keys(o.files));
});
t('O trecho antigo da janela é o esperado (hash do gerador) e o Voltar 1.12.280 está incluído', () => {
  assert.equal(require('crypto').createHash('sha256').update(old.block, 'utf8').digest('hex'), G.OLD_BLOCK_SHA256);
  assert.notEqual(v.files['professor.html'], o.files['professor.html']);
  assert.notEqual(v.files['index.html'], o.files['index.html']);
});
t('Prova de reversão: desfeitas as edições de CSS/JS e trocada a janela, tudo volta byte a byte ao 1.12.280', () => {
  let undone = page;
  for (const [previous, next] of G.cssJsEdits().slice().reverse()) {
    assert.equal(count(undone, next), 1, 'edição não aplicada uma vez: ' + next.slice(0, 70));
    undone = undone.replace(next, () => previous);
  }
  const u = slice(undone, true);
  assert.equal(undone.slice(0, u.a), base.slice(0, old.a), 'antes da janela');
  assert.equal(undone.slice(u.b), base.slice(old.b), 'depois da janela');
  assert.equal(undone.slice(0, u.a) + old.block + undone.slice(u.b), base);
});
t('O gerador recusa aplicar duas vezes e é determinístico', () => {
  assert.throws(() => G.applyHub(page));
  assert.equal(JSON.stringify(G.makeUpdate(o)), JSON.stringify(p));
});
t('Seis atalhos na ordem Cadastro, Instalação, Grupo, Contatos, Anamnese, Planos; só o primeiro selecionado', () => {
  const tabs = [...neu.block.matchAll(/<button id="([^"]+)" type="button" role="tab" aria-selected="(true|false)" aria-controls="([^"]+)" onclick="setRegistrationTab\('([^']+)'\)">(.*?)<\/button>/g)];
  assert.deepEqual(tabs.map(m => m[1]), ['registrationLinkTab', 'installationLinkTab', 'groupLinkTab', 'registrationContactsTab', 'anamnesisLinkTab', 'plansLinkTab']);
  assert.deepEqual(tabs.map(m => m[4]), ['link', 'installation', 'group', 'contacts', 'anamnesis', 'plans']);
  assert.deepEqual(tabs.map(m => m[2]), ['true', 'false', 'false', 'false', 'false', 'false']);
  const labels = tabs.map(m => (m[5].match(/registration-tile-label">([^<]+)</) || [])[1]);
  assert.deepEqual(labels, ['Cadastro', 'Instalação', 'Grupo', 'Contatos', 'Anamnese', 'Planos']);
  for (const m of tabs) assert(/<svg /.test(m[5]), 'sem ícone: ' + m[1]);
});
t('Cada atalho aponta para um painel que existe uma vez; só o painel do Cadastro começa visível', () => {
  const tabs = [...neu.block.matchAll(/<button id="([^"]+)" type="button" role="tab"[^>]*aria-controls="([^"]+)"/g)];
  assert.equal(tabs.length, 6);
  for (const [, tabId, panelId] of tabs) {
    const panels = [...neu.block.matchAll(new RegExp('<div id="' + panelId + '" role="tabpanel" aria-labelledby="' + tabId + '"([^>]*)>', 'g'))];
    assert.equal(panels.length, 1, panelId);
    assert.equal(/\shidden/.test(panels[0][1]), panelId !== 'registrationLinkPanel', panelId);
  }
});
t('Ids da janela não repetem e todos os ids antigos continuam existindo (nada que o código usa sumiu)', () => {
  const ids = idsOf(neu.block);
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos: ' + ids.filter((x, i) => ids.indexOf(x) !== i));
  const missing = idsOf(old.block).filter(id => !ids.includes(id));
  assert.deepEqual(missing, [], 'ids que sumiram: ' + missing);
  for (const id of ['registrationUrlCopy', 'groupUrlCopy', 'groupEditLabel']) assert(ids.includes(id), 'novo id ausente: ' + id);
});
t('Anamnese e Planos: todos os elementos que o JavaScript usa existem em cada painel', () => {
  const ids = idsOf(neu.block);
  const js = page.slice(page.indexOf('const optionalLinkFields'), page.indexOf('c("groupUrlForm").onsubmit = saveGroupLink;'));
  const suffixes = new Set([...js.matchAll(/c\(key \+ "([A-Za-z]+)"\)/g)].map(m => m[1]));
  for (const s of ['PublicUrl', 'UrlSetting', 'UrlCopy', 'Copy', 'WhatsApp', 'Edit', 'EditLabel', 'Config', 'Remove', 'UrlForm']) assert(suffixes.has(s), 'o JS não usa ' + s);
  for (const key of ['anamnesis', 'plans']) for (const s of suffixes) assert(ids.includes(key + s), 'falta #' + key + s);
});
t('Campo do link: endereço digitado só aceita URL (type=url), sem corretor nem maiúscula automática', () => {
  for (const key of ['anamnesis', 'plans']) {
    const input = (neu.block.match(new RegExp('<input id="' + key + 'UrlSetting"[^>]*>')) || [])[0];
    assert(input, key);
    for (const attr of ['type="url"', 'inputmode="url"', 'required', 'autocomplete="off"', 'autocapitalize="none"', 'spellcheck="false"']) assert(input.includes(attr), key + ' sem ' + attr);
    const shown = (neu.block.match(new RegExp('<input id="' + key + 'PublicUrl"[^>]*>')) || [])[0];
    assert(shown && /\sreadonly/.test(shown), key + ' campo de exibição deve ser somente leitura');
  }
});
t('Textos dos painéis e nomes certos', () => {
  for (const s of ['<h4>Link da anamnese</h4>', 'Envie a ficha de anamnese para o aluno preencher.', 'Seu link de anamnese', 'Endereço da anamnese',
    '<h4>Link dos planos</h4>', 'Envie a página com os seus planos.', 'Seu link de planos', 'Endereço dos planos',
    'Enviar pelo WhatsApp', 'Copiar link', 'Adicionar link', 'Remover link', 'Salvar link']) assert(neu.block.includes(s), s);
});
t('Os links novos ficam no estado principal do app, no mesmo caminho da Instalação (saveConfiguredLink)', () => {
  assert(page.includes('const optionalLinkFields = {anamnesis: "anamnesisLink", plans: "plansLink"};'));
  assert(page.includes('saveConfiguredLink(optionalLinkFields[key], url);'));
  assert(page.includes('saveConfiguredLink(optionalLinkFields[key], "");'));
  assert.equal(count(page, 'function saveConfiguredLink('), 1);
  // só endereço https:// público: a mesma validação da Instalação
  assert(page.includes('installationUrl(c(key + "UrlSetting").value)'));
});
t('Enviar pelo WhatsApp usa o mesmo envio já existente (wa.me), sem criar outro caminho', () => {
  assert(page.includes('sharePublicLink(url);'));
  assert.equal(count(page, 'function sharePublicLink('), 1);
  assert.equal(count(base, 'function sharePublicLink('), 1);
  assert(page.includes('https://wa.me/?text='));
});
t('Abas antigas continuam ligadas ao mesmo código (Cadastro, Instalação, Grupo, Contatos)', () => {
  for (const s of ['["link", "registrationLinkTab", "registrationLinkPanel"]', '["installation", "installationLinkTab", "installationLinkPanel"]',
    '["group", "groupLinkTab", "groupLinkPanel"]', '["contacts", "registrationContactsTab", "registrationContactsPanel"]',
    '["anamnesis", "anamnesisLinkTab", "anamnesisLinkPanel"]', '["plans", "plansLinkTab", "plansLinkPanel"]']) assert.equal(count(page, s), 1, s);
  assert(page.includes('else if (n === "anamnesis" || n === "plans") renderOptionalLink(n);'));
  assert(page.includes('else if (n === "contacts") U();'));
});
t('Visual: CSS restrito à janela Cadastro por link, com reserva de cores (segue o tema escolhido) e plaquinha escura nos temas Metal e Profundo', () => {
  const css = (page.match(/<style id="ap-registration-hub-css">([\s\S]*?)<\/style>/) || [])[1];
  assert(css && css.length > 1000, 'bloco de estilo ausente');
  const rules = css.split('}').map(s => s.trim()).filter(Boolean);
  for (const r of rules) {
    const selector = r.split('{')[0];
    // separa só nas vírgulas de fora de parênteses (as de dentro de :is(...) fazem parte do mesmo seletor)
    const parts = []; let depth = 0, cur = '';
    for (const ch of selector) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch; }
    parts.push(cur);
    assert(parts.every(s => s.trim().startsWith('#registrationLinkDialog') || /^html\[data-agenda-design=(metal|deep)-tl\] #registrationLinkDialog/.test(s.trim())), 'regra fora da janela: ' + selector.slice(0, 80));
  }
  assert(/var\(--ac-accent,var\(--purple\)\)/.test(css) && /var\(--ac-accent-rgb,161,44,255\)/.test(css));
  assert(/data-agenda-design=metal-tl\] #registrationLinkDialog[^{]*,html\[data-agenda-design=deep-tl\] #registrationLinkDialog[^{]*\{[^}]*background:var\(--nt-icon-bg\)/.test(css));
});
t('Não mexe em descanso, cronômetro, alarme ou notificação', () => {
  const touched = [neu.block, ...G.cssJsEdits().map(e => e[1])].join('\n');
  assert(!/(\brest\b|restSeconds|alarm|notific|timer|descanso|cron[oô]metro|resumeWorkoutRest)/i.test(touched), (touched.match(/(\brest\b|restSeconds|alarm|notific|timer|descanso|cron[oô]metro|resumeWorkoutRest)/i) || [])[0]);
});
t('Não mexe em Firebase nem apaga dados de alunos', () => {
  const touched = [neu.block, ...G.cssJsEdits().map(e => e[1])].join('\n');
  assert(!/(firebase|firestore|indexedDB|\.delete\(|removeItem|localStorage\.clear|students\s*=\s*\[\])/i.test(touched), (touched.match(/(firebase|firestore|indexedDB|\.delete\(|removeItem|localStorage\.clear)/i) || [])[0]);
});
t('Nenhum link de convite do grupo no pacote, e tamanho abaixo do limite de 24 MiB', () => {
  assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(JSON.stringify(p.files)));
  assert(Buffer.byteLength(JSON.stringify(p, null, 2) + '\n', 'utf8') < 24 * 1024 ** 2);
});
console.log(`\nresultado: ${ok} ok, ${bad} falhas`);
process.exit(bad ? 1 : 0);
