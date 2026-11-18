'use strict';
// Confere o pacote 1.12.282 (Feedback do aluno: lista "Como foi hoje?" limitada a 7 + Compartilhar cartão)
// contra o pacote 1.12.281 que está na raiz do repositório. Não precisa de navegador nem de internet:
//   node equipe/testes/feedback-aluno.smoke.cjs
// Só o index.html (tela do aluno) muda. O teste confere: escopo, prova de reversão byte a byte, determinismo,
// que o limite de 7 vale só para a EXIBIÇÃO (o pet usa APFeedbackSync.items() e precisa da lista completa),
// o cartão copiado do professor.html, o ajuste de cor do tema e que nada de rede, armazenamento, alarme,
// cronômetro ou Firebase foi acrescentado. A parte visual (cartão desenhado, botões, Voltar) não cabe aqui:
// foi conferida à parte, em Chrome real, e consta do histórico técnico do projeto.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-feedback-aluno-1.12.282.cjs');
const SOURCE = path.join(ROOT, 'AgendaPersonal-1.12.281-Links-Visual-Anamnese-Planos-Para-Assinar.agenda.json');
const G = require(GENERATOR);
const o = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const p = G.makeUpdate(o);
const base = o.files['index.html'];
const page = p.files['index.html'];
const teacher = o.files['professor.html'];
const card = G.cardBlock(teacher);
let ok = 0, bad = 0;
const t = (n, f) => { try { f(); ok++; console.log('OK   ' + n); } catch (e) { bad++; console.log('FALHA ' + n + ' -> ' + e.message); } };

const count = (text, part) => text.split(part).length - 1;
const sha = text => crypto.createHash('sha256').update(text, 'utf8').digest('hex');
const scriptBody = (html, id) => {
  const m = html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>'));
  assert(m, 'bloco ausente: ' + id);
  return m[1];
};
const classicScripts = html => [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .filter(m => !/\stype="/.test(m[1] || '') || /\stype="text\/javascript"/.test(m[1]));

// ---------- bloco de sincronização rodando em vm, sem navegador e sem rede ----------
const UID = 'stu_uid_1';
const pad = n => String(n).padStart(2, '0');
function mkItem(teacherId, i, {answered = true, online = false} = {}) {
  const finished = Date.UTC(2026, 10, 18, 15) - i * 864e5, started = finished - 55 * 60e3;
  const item = {
    id: 'fb_s' + pad(i), uid: UID, studentId: online ? '' : 'stu_1', studentName: 'Maria Souza Lima',
    source: online ? 'online' : 'presencial', planName: 'Plano de hipertrofia', dayName: 'Treino A',
    startedAt: started, finishedAt: finished, professorId: teacherId, createdAt: new Date(finished).toISOString(),
    teacherEvaluation: {note: 'Boa evolução.', effort: 8}
  };
  if (answered) item.response = {intensity: online ? 'Treino puxado' : 'Intensa', comment: 'Ótimo treino.', publicationBasis: 'contract', mutationId: 'mut' + pad(i), receivedAt: new Date(finished + 12e4).toISOString()};
  return item;
}
// 12 sessões, da mais antiga para a mais nova (de propósito); a 01 é a mais recente. Sem resposta: 01, 02, 03 e 10. Online: 05 e 09.
const twelve = teacherId => {
  const list = [];
  for (let i = 12; i >= 1; i--) list.push(mkItem(teacherId, i, {answered: ![1, 2, 3, 10].includes(i), online: i === 5 || i === 9}));
  return list;
};
function syncContext(syncSource, makeCache) {
  const calls = {fetch: 0, setItem: 0, removeItem: 0};
  const store = new Map();
  const ctx = {
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { calls.setItem++; store.set(k, String(v)); },
      removeItem: k => { calls.removeItem++; store.delete(k); }
    },
    CustomEvent: class { constructor(type) { this.type = type; } },
    dispatchEvent() {}, addEventListener() {},
    document: {addEventListener() {}, hidden: false},
    navigator: {onLine: true},
    crypto: {randomUUID: () => 'mut-teste'},
    setInterval: () => 0, setTimeout: () => 0, clearTimeout() {},
    fetch: async () => { calls.fetch++; throw new Error('sem rede no teste'); }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(scriptBody(page, 'ap-feedback-model'), ctx);
  ctx.__AP_STUDENT_CONTEXT = {role: 'student', area: {enabled: true}, storageId: UID};
  store.set('agenda_feedback_v1_' + UID, JSON.stringify(makeCache(ctx.APFeedbackModel.TEACHER)));
  vm.runInContext(syncSource, ctx);
  return {ctx, calls, store, api: ctx.APFeedbackSync};
}
const ids = list => list.map(x => x.id);
const recent = n => Array.from({length: n}, (_, k) => 'fb_s' + pad(k + 1));

// Tudo o que o pet e a janela do aluno precisam do bloco de sincronização. É chamado com o código real do pacote
// e, mais abaixo, com uma versão sabotada (items() limitado) para provar que este teste pega o erro.
function syncChecks(syncSource) {
  const A = syncContext(syncSource, teacherId => ({version: 1, items: twelve(teacherId), outbox: {}, drafts: {}}));
  const key = 'agenda_feedback_v1_' + UID;
  const rawBefore = A.store.get(key);
  const api = A.ctx.APFeedbackSync;
  assert.equal(api.limit, 7, 'limite');
  assert.equal(api.items().length, 12, 'items() precisa continuar completo (o pet usa essa lista): ' + api.items().length);
  assert.equal(api.items().filter(x => x.source === 'presencial').length, 10, 'o pet precisa enxergar as 10 sessões presenciais');
  assert.equal(api.local().items.length, 12, 'a cópia guardada no aparelho precisa continuar completa');
  assert.deepEqual(ids(api.visible()), recent(7), 'visible() = as 7 mais recentes, da mais nova para a mais antiga');
  assert(ids(api.visible()).includes('fb_s05') && !ids(api.visible()).includes('fb_s09'), 'online entra na mesma conta (05 visível, 09 fora)');
  assert.deepEqual(ids(api.pending()), ['fb_s01', 'fb_s02', 'fb_s03'], 'pending() só olha a lista visível');
  assert.equal(api.items().filter(x => !x.response).length, 4, 'na lista completa continuam 4 sem resposta');
  assert.deepEqual(ids(api.visible()), ids(api.visible()), 'visible() deterministica');
  assert.equal(A.calls.setItem + A.calls.removeItem, 0, 'exibir a lista não pode gravar nem apagar nada no aparelho');
  assert.equal(A.calls.fetch, 0, 'exibir a lista não pode usar a rede');
  assert.equal(A.store.get(key), rawBefore, 'a cópia guardada não pode mudar');

  // resposta ainda não enviada (fila de envio) de uma sessão antiga: nunca some da lista
  const B = syncContext(syncSource, teacherId => ({version: 1, items: twelve(teacherId), outbox: {fb_s10: {id: 'fb_s10', intensity: 'Intensa', comment: 'x', mutationId: 'm10'}}, drafts: {}}));
  assert.deepEqual(ids(B.api.visible()), [...recent(7), 'fb_s10'], 'item com resposta na fila de envio continua visível');
  assert.equal(B.api.items().length, 12);
  assert(ids(B.api.pending()).includes('fb_s10'), 'pending() mantém o item da fila');

  // poucas sessões: nada some
  for (const n of [0, 1, 6, 7]) {
    const C = syncContext(syncSource, teacherId => ({version: 1, items: twelve(teacherId).slice(12 - n), outbox: {}, drafts: {}}));
    assert.equal(C.api.visible().length, n, 'com ' + n + ' sessões, aparecem ' + n);
    assert.equal(C.api.items().length, n);
  }

  // sem conta de aluno, ou com outra conta, a lista é vazia (nada vaza entre contas)
  A.ctx.__AP_STUDENT_CONTEXT = {role: 'student', area: {enabled: true}, storageId: 'outra_conta'};
  assert.deepEqual([A.api.visible(), A.api.items(), A.api.pending()], [[], [], []], 'outra conta');
  A.ctx.__AP_STUDENT_CONTEXT = undefined;
  assert.deepEqual([A.api.visible(), A.api.items(), A.api.pending()], [[], [], []], 'sem conta');
  return true;
}

// ---------- 1) pacote ----------
t('Versão 1.12.282 / seq 388 / sem assinatura, com o mesmo aplicativo e formato do 1.12.281', () => {
  assert.equal(p.version, '1.12.282');
  assert.equal(p.sequence, 388);
  assert.equal(p.agendaSignature, undefined);
  for (const k of ['format', 'appId', 'bridgeVersion', 'dataSchema']) assert.deepEqual(p[k], o[k], k);
  assert(p.sequence > o.sequence);
  assert.deepEqual(Object.keys(p), ['format', 'appId', 'bridgeVersion', 'dataSchema', 'version', 'sequence', 'files', 'notes', 'update', 'modularUpdates']);
});
t('Aviso: título, resumo e notas dentro dos limites e coerentes com o que o código faz', () => {
  assert.equal(p.update.title, 'Feedback do aluno');
  assert.equal(p.update.category, o.update.category);
  assert(p.update.summary.length > 20 && p.update.summary.length <= 200, 'resumo: ' + p.update.summary.length);
  assert(p.notes.length > 100 && p.notes.length <= 4000, 'notas: ' + p.notes.length);
  assert(/7 feedbacks/.test(p.update.summary) && /Compartilhar cartão/.test(p.update.summary));
  assert(!/guarda/i.test(p.update.summary), 'o limite só muda o que aparece na lista, não o que fica guardado');
  assert(/1\.12\.280/.test(p.notes) && /1\.12\.281/.test(p.notes), 'as notas dizem que o pacote inclui o Voltar e os Links');
});
t('Só o index.html mudou em relação ao 1.12.281: professor, avaliações e cadastro idênticos, histórico modular igual', () => {
  for (const k of ['professor.html', 'avaliacoes.html', 'cadastro.html']) assert.equal(p.files[k], o.files[k], k);
  assert.notEqual(page, base);
  assert.deepEqual(Object.keys(p.files), Object.keys(o.files));
  assert.deepEqual(p.modularUpdates, o.modularUpdates);
});
t('As mudanças ficam entre o início do bloco de sincronização e o fim do bloco do aluno; o resto do index.html é idêntico', () => {
  const n = Math.min(base.length, page.length);
  let i = 0; while (i < n && base[i] === page[i]) i++;
  let j = 0; while (j < n - i && base[base.length - 1 - j] === page[page.length - 1 - j]) j++;
  const syncStart = base.indexOf('<script id="ap-feedback-sync">');
  const studentEnd = base.indexOf('</script>', base.indexOf('<script id="ap-feedback-student">')) + '</script>'.length;
  assert(syncStart > 0 && i >= syncStart, 'mudança antes do bloco de sincronização, na posição ' + i);
  assert(base.length - j <= studentEnd, 'mudança depois do bloco do aluno');
});
t('Prova de reversão: desfeitas as edições, o index.html volta byte a byte ao do 1.12.281', () => {
  let undone = page;
  for (const [previous, next] of G.edits(card).slice().reverse()) {
    assert.equal(count(undone, next), 1, 'edição não aplicada uma vez: ' + next.slice(0, 70));
    undone = undone.replace(next, () => previous);
  }
  assert.equal(undone, base);
});
t('O gerador recusa aplicar duas vezes, recusa outra base e é determinístico', () => {
  assert.throws(() => G.applyFeedback(page, teacher));
  assert.throws(() => G.makeUpdate(p));
  assert.equal(JSON.stringify(G.makeUpdate(o)), JSON.stringify(p));
});
t('A linha de comando grava exatamente o JSON do pacote e não sobrescreve arquivo existente; tamanho abaixo de 24 MiB', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-feedback-aluno-'));
  try {
    const out = path.join(dir, 'saida.agenda.json');
    execFileSync(process.execPath, [GENERATOR, SOURCE, out], {stdio: 'pipe'});
    const written = fs.readFileSync(out, 'utf8');
    assert.equal(written, JSON.stringify(p, null, 2) + '\n');
    assert(Buffer.byteLength(written, 'utf8') < 24 * 1024 ** 2);
    assert.throws(() => execFileSync(process.execPath, [GENERATOR, SOURCE, out], {stdio: 'pipe'}));
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
t('Todos os scripts do index.html compilam (os de antes mais o do cartão)', () => {
  const compile = html => { let n = 0; for (const m of classicScripts(html)) { try { new vm.Script(m[2]); n++; } catch (e) { throw new Error(e.message + ' | ' + m[0].slice(0, 80)); } } return n; };
  const before = compile(base), after = compile(page);
  assert(before > 50, 'poucos scripts: ' + before);
  assert.equal(after, before + 1);
});

// ---------- 2) cartão ----------
t('Cartão: o bloco do index.html é igual, byte a byte, ao do professor.html; aparece uma vez, entre a sincronização e o aluno', () => {
  assert.equal(sha(card), G.CARD_SHA256);
  assert.equal(count(page, G.CARD_START), 1);
  assert.equal(count(page, card), 1);
  assert.equal(count(base, G.CARD_START), 0);
  const s = page.indexOf('<script id="ap-feedback-sync">'), c = page.indexOf(G.CARD_START), a = page.indexOf('<script id="ap-feedback-student">');
  assert(s >= 0 && s < c && c < a, 'ordem dos blocos');
});
t('Cartão: usa o mesmo caminho de salvar e compartilhar do professor (Android, navigator.share e download) e não usa rede', () => {
  for (const s of ['shareBase64File', 'saveBase64File', 'navigator.share']) assert(card.includes(s), s);
  assert(!/(fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB)/.test(card));
  assert(/#181c20/i.test(card), 'o ajuste de cor assume o fundo #181c20 do cartão');
});
t('Cor do tema: a cor usada no cartão é legível sobre o fundo escuro, igual à do tema quando já é legível e do mesmo tom quando é clareada o mínimo necessário', () => {
  const text = G.STUDENT_EDITS.map(e => e[1]).join('\n');
  const a = text.indexOf('function feedbackCardReadable('), b = text.indexOf('async function shareFeedbackCard(');
  assert(a >= 0 && b > a, 'função de cor não encontrada');
  const readable = new Function(text.slice(a, b) + '\nreturn feedbackCardReadable;')();
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = hex => { const [r, g, bl] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16))); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
  const GROUND = '#181c20';
  const contrast = hex => { const [x, y] = [lum(hex), lum(GROUND)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const hue = hex => {
    const [r, g, bl] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn;
    if (!d) return null;
    const h = 60 * (mx === r ? ((g - bl) / d) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4);
    return h < 0 ? h + 360 : h;
  };
  const mix = (hex, step) => '#' + [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16); return Math.round(v + (255 - v) * step / 40).toString(16).padStart(2, '0'); }).join('');
  const themes = ['#f52283', '#00d98d', '#b6bec7', '#138cff', '#8f35df'];   // rosa, verde, preto, azul, roxo (APStudentTheme)
  for (const c of [...themes, '#b6ff26', '#3366cc', '#0a1830', '#101010', '#7a1fa2', '#000000', '#ffffff']) {
    const r = readable(c);
    assert(/^#[0-9a-f]{6}$/.test(r), c + ' -> ' + r);
    assert(contrast(r) >= 4.5, c + ' -> ' + r + ' contraste ' + contrast(r).toFixed(2));
    if (contrast(c) >= 4.5) assert.equal(r, c, 'cor já legível não pode mudar: ' + c);
    else {
      let expected = '#ffffff';
      for (let step = 0; step <= 40; step++) { const m = mix(c, step); if (contrast(m) >= 4.5) { expected = m; break; } }
      assert.equal(r, expected, c + ' deveria ser clareada só o mínimo');
      const hc = hue(c), hr = hue(r);
      if (hc !== null && hr !== null) assert(Math.min(Math.abs(hc - hr), 360 - Math.abs(hc - hr)) < 12, 'tom mudou: ' + c + ' -> ' + r);
    }
  }
  assert.equal(readable('#F52283'), readable('#f52283'), 'maiúsculas e minúsculas');
  // Rosa, verde, preto e azul já passam (ou precisam de um passo de 2,5%); o roxo (#8f35df) tem contraste 3,05 sobre o fundo
  // do cartão e é clareado de propósito, mantendo o tom, para o texto pequeno do cartão continuar legível.
  assert.equal(readable('#00d98d'), '#00d98d');
  assert.equal(readable('#b6bec7'), '#b6bec7');
  assert.notEqual(readable('#8f35df'), '#8f35df');
});

// ---------- 3) limite de 7: só na exibição ----------
t('Limite de 7: a função que corta é pura, ordena do mais novo ao mais antigo, desempata por id, não altera a lista e mantém a fila de envio', () => {
  const text = G.SYNC_EDITS[0][1];
  const a = text.indexOf('const LIMIT=7;'), b = text.indexOf('function u(e,o=t()){');
  assert(a >= 0 && b > a, 'função do limite não encontrada');
  const {capItems, LIMIT} = new Function(text.slice(a, b) + '\nreturn {capItems, LIMIT};')();
  assert.equal(LIMIT, 7);
  const list = Array.from({length: 12}, (_, k) => ({id: 'x' + pad(k), finishedAt: 1000 + k}));
  const snapshot = JSON.stringify(list);
  const out = capItems(list, {});
  assert.deepEqual(out.map(x => x.id), ['x11', 'x10', 'x09', 'x08', 'x07', 'x06', 'x05']);
  assert.equal(JSON.stringify(list), snapshot, 'a lista de entrada não pode mudar');
  assert.deepEqual(capItems(list.slice().reverse(), undefined).map(x => x.id), out.map(x => x.id), 'a ordem de entrada não muda o resultado');
  assert.deepEqual(capItems(list, {x00: {id: 'x00'}}).map(x => x.id), [...out.map(x => x.id), 'x00'], 'item da fila de envio fica, mesmo antigo');
  const tied = ['b', 'c', 'a', 'd', 'e', 'f', 'g', 'h', 'i'].map(id => ({id, finishedAt: 5}));
  assert.deepEqual(capItems(tied, {}).map(x => x.id), ['a', 'b', 'c', 'd', 'e', 'f', 'g'], 'empate: por id');
  assert.deepEqual(capItems([], {}), []);
  assert.equal(capItems(list.slice(0, 7), {}).length, 7);
  assert.equal(capItems(list.slice(0, 3), {}).length, 3);
});
t('O pet não perde nada: items() continua completo; só visible() e pending() são limitados (código real do bloco de sincronização, em vm)', () => {
  assert.equal(syncChecks(scriptBody(page, 'ap-feedback-sync')), true);
});
t('O teste pega o erro: se items() fosse limitado (o desenho descartado), o teste do pet falharia', () => {
  const src = scriptBody(page, 'ap-feedback-sync');
  assert.equal(count(src, 'items:h,'), 1);
  assert.equal(count(src, 'items:visible'), 0);
  assert.throws(() => syncChecks(src.replace('items:h,', 'items:visible,')), /items\(\) precisa continuar completo/);
});
t('Consumidores: o pet continua lendo APFeedbackSync.items() e nenhuma edição toca no código do pet', () => {
  assert.equal(count(page, 'APFeedbackSync.items().sort('), 1);
  assert.equal(count(base, 'APFeedbackSync.items().sort('), 1);
  const edited = [...G.SYNC_EDITS, ...G.STUDENT_EDITS].map(e => e[0] + '\n' + e[1]).join('\n');
  assert(!/(APmascot|receivePresencialRewards|APMascotModel|reward)/i.test(edited));
});
t('A janela do aluno usa a lista limitada, mantém o aviso e o botão só no feedback enviado', () => {
  assert.equal(count(page, 'const s=t.visible(),i=t.local();'), 1);
  assert.equal(count(page, 'o=e||t.pending()[0]?.id||t.visible()[0]?.id||""'), 1);
  assert.equal(count(page, '"Mostrando os "+t.limit+" feedbacks mais recentes."'), 1);
  assert.equal(count(page, 'const LIMIT=7;'), 1);
  assert.equal(count(page, 'pending:()=>visible().filter(e=>!e.response)'), 1);
  const receiptAt = page.indexOf('r.response&&(a("apFeedbackReceipt").innerHTML=');
  assert(receiptAt > 0);
  const receipt = page.slice(receiptAt, receiptAt + 700);
  assert(receipt.includes(`data-feedback-share="'+n(r.id)+'">Compartilhar cartão</button></div>')`), 'botão no recibo, com o id escapado');
  assert.equal(count(page, 'data-feedback-share'), 2);    // o botão e o seletor do clique delegado
  assert.equal(count(page, 'closest("[data-feedback-share]")'), 1);
  assert.equal(count(page, 'shareFeedbackCard(t.dataset.feedbackShare)'), 1);
  assert(page.includes('t.visible().find(e=>e.id===id&&e.response)'), 'só compartilha feedback visível e já respondido');
  assert(/\.ap-feedback-actions\b/.test(base), 'a classe do botão já tem estilo no 1.12.281');
});
t('Voltar: fecha a imagem do cartão primeiro e depois a janela; trocar de conta fecha a imagem', () => {
  assert.equal(count(page, 'function kb(){const g=a("apFeedbackImage");return g?.open&&p.open?(g.close(),!0):k()}'), 1);
  assert.equal(count(page, 'function k(){const g=a("apFeedbackImage");g?.open&&g.close();return!!p.open&&('), 1);
  assert.equal(count(page, 'back=function(...t){if(!kb())return e.apply(this,t)}'), 1);
  assert.equal(count(page, 'window.handleAgendaSystemBack=function(...t){return!!kb()||e.apply(this,t)}'), 1);
  assert.equal(count(base, 'back=function(...t){if(!k())return e.apply(this,t)}'), 1);
  assert.equal(count(page, 'addEventListener("ap-account-changed",()=>{a("apFeedbackImage")?.open&&a("apFeedbackImage").close(),p.open&&p.close(),'), 1);
});

// ---------- 4) o que não pode ser tocado ----------
const addedText = [...G.SYNC_EDITS, ...G.STUDENT_EDITS].map(e => e[1]).join('\n') + '\n' + card;
t('Não mexe em descanso, cronômetro, alarme ou notificação', () => {
  const found = (addedText.match(/(\brest\b|restSeconds|alarm|notific|timer|descanso|cron[oô]metro|resumeWorkoutRest)/i) || [])[0];
  assert(!found, 'achou: ' + found);
  assert(!/(descanso|cron[oô]metro|alarme|notifica)/i.test(p.update.summary + ' ' + p.notes.replace(/Descanso, cronômetros, alarmes e notificações não foram alterados\./, '')));
});
t('Não mexe em Firebase, rede nem armazenamento e não apaga dados de alunos', () => {
  const found = (addedText.match(/(firebase|firestore|indexedDB|\.delete\(|removeItem|setItem|localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon|WebSocket|\.splice\()/i) || [])[0];
  assert(!found, 'achou: ' + found);
  const routes = html => [...new Set([...html.matchAll(/\/api\/[a-z0-9\-/]+/gi)].map(m => m[0]))].sort();
  assert.deepEqual(routes(page), routes(base), 'nenhuma rota nova');
});
t('Nenhum link de convite do grupo no pacote', () => {
  assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(JSON.stringify(p.files)));
});

console.log(`\nresultado: ${ok} ok, ${bad} falhas`);
process.exit(bad ? 1 : 0);
