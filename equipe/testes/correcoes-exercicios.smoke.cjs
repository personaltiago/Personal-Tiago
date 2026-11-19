'use strict';
// Confere o pacote 1.12.291 (o 1.12.288 com as três correções de exercícios que estão à parte no site já incluídas) sem navegador e sem
// internet:
//   node equipe/testes/correcoes-exercicios.smoke.cjs
// O que confere:
//  - as entradas: os quatro arquivos que o Tiago subiu na main (o 1.12.288 e as correções 01, 02 e 03) são os esperados (SHA-256), cada
//    correção troca exatamente um bloco de professor.html e esse bloco está, no 1.12.288, no estado "antes" da correção (por isso o
//    1.12.288 retira as três: um pacote completo troca a página inteira);
//  - o pacote: versão 1.12.291 e sequência 397 (a numeração que o aplicativo dá a três correções instaladas, uma a uma, sobre o 1.12.288:
//    evita o aviso "Revisar restauração" em qualquer aparelho que já tenha uma, duas ou as três), ordem das chaves, nada de assinatura,
//    limites de tamanho de resumo e notas;
//  - o escopo: só professor.html muda e, dentro dele, só os três blocos; os outros arquivos ficam byte a byte iguais; o texto de cada
//    bloco passa a ser o da correção (SHA-256 "after") e todo o resto da página é igual ao do 1.12.288;
//  - o histórico: um registro por correção, o mais novo na frente, com a assinatura que o aplicativo calcula, seguido do que o 1.12.288
//    já trazia, sem repetir identificador e com no máximo 20;
//  - o gerador: determinismo, linha de comando (mesmo conteúdo que a função, recusa sobrescrever, recusa entrada trocada ou alterada);
//  - e roda variações sabotadas para provar que o teste pega o erro (entrada alterada, fora de ordem, faltando uma, correção repetida,
//    conflito com o conteúdo em uso, bloco que não existe, componente fora do escopo, bloco que fecha antes da hora, pacote-base errado,
//    limite de texto, identificador repetido no histórico).
// O mesmo conteúdo é conferido contra o código Java real do aplicativo (equipe/testes/correcoes-exercicios.java.py: 89 verificações) e
// no Chrome real (equipe/testes/navegador/correcoes-exercicios). Nada disso substitui o teste no celular.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const {execFileSync, spawnSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const GENERATOR = path.join(ROOT, 'tools/gerar-correcoes-exercicios-1.12.291.cjs');
const G = require(GENERATOR);

// Onde cada entrada está: na raiz (como o Tiago subiu) ou, se um dia o arquivo da raiz for trocado, no commit abaixo.
const COMMITS = {
  [G.SOURCE_NAME]: '176f8d75e96412b8e0491ccb6d16fa23b7f96c2b',
  'AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json': '0764e15f1e0860c4a139e1105ae1bf2426801ded',
  'AgendaPersonal-02-Baixar-Catalogo-Para-Assinar.agenda.json': '0764e15f1e0860c4a139e1105ae1bf2426801ded',
  'AgendaPersonal-03-Corrigir-Duplicatas-Catalogo-Para-Assinar.agenda.json': '4bfa7eb1d23a9547f2279342f2f12c9a0f800b15'
};
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'correcoes-291-'));
function locate(name, expected) {
  const inRoot = path.join(ROOT, name);
  if (fs.existsSync(inRoot) && digest(fs.readFileSync(inRoot)) === expected) return inRoot;
  const commit = COMMITS[name];
  let fromHistory;
  try {
    fromHistory = execFileSync('git', ['show', commit + ':' + name], {cwd: ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
  } catch (problem) {
    throw new Error('Não achei ' + name + ' (SHA-256 ' + expected + '): o arquivo da raiz é outro e o commit ' + commit.slice(0, 7) +
      ' não está neste clone (se o clone é raso, rode: git fetch --unshallow).');
  }
  assert.equal(digest(fromHistory), expected, name + ' do histórico do git não é o esperado');
  const copy = path.join(workDir, name);
  fs.writeFileSync(copy, fromHistory);
  return copy;
}
const SOURCE_FILE = locate(G.SOURCE_NAME, G.SOURCE_SHA256);
const PATCH_FILES = G.PATCHES.map(p => locate(p.name, p.sha256));

let source, patches, pack;
try {
  ({source, patches} = G.loadInputs(SOURCE_FILE, PATCH_FILES));
  pack = G.makeUpdate(source, patches);
} catch (problem) {
  console.log('FALHA ao montar o pacote 1.12.291 com as entradas da main:\n     ' + String(problem && problem.message || problem).split('\n').join('\n     '));
  console.log('\n0 ok, 1 com falha');
  process.exit(1);
}
const fresh = () => G.loadInputs(SOURCE_FILE, PATCH_FILES); // cópia nova, para as sabotagens mexerem sem estragar as outras
const copy = value => JSON.parse(JSON.stringify(value));
const sha = G.sha256;
let ok = 0, bad = 0;
const queue = [];
const t = (n, f) => queue.push([n, f]);
const throwsWith = (fn, part, what) => {
  let error = null;
  try { fn(); } catch (e) { error = e; }
  assert.ok(error, (what || 'devia recusar') + ': nada foi recusado');
  assert.ok(String(error.message).includes(part), (what || 'recusa') + ': a mensagem era "' + String(error.message).slice(0, 160) + '", esperava conter "' + part + '"');
};

const blocksOf = (html, ids) => G.findBlocks(html, new Set(ids));
const inner = (html, id) => { const b = blocksOf(html, [id]).get(id); return b ? html.slice(b.start, b.end) : null; };
// A mesma página com o texto de dentro dos blocos pedidos trocado por um marcador: o que sobra é "tudo o que não é desses blocos".
function withoutBlocks(html, ids) {
  const found = [...blocksOf(html, ids).entries()].sort((a, b) => a[1].start - b[1].start);
  let out = '', from = 0;
  for (const [id, b] of found) { out += html.slice(from, b.start) + '«' + id + '»'; from = b.end; }
  return out + html.slice(from);
}
const BLOCKS = G.PATCHES.map(p => p.block);

// ---------- 1) as entradas ----------
t('Entradas: os quatro arquivos são os que estão na main (SHA-256) e o 1.12.288 é 1.12.288 / sequência 394', () => {
  assert.equal(source.version, '1.12.288'); assert.equal(source.sequence, 394);
  assert.equal(source.format, 1); assert.equal(source.appId, G.APP_ID);
  assert.equal(G.PATCHES.length, 3);
  G.PATCHES.forEach((p, i) => { assert.equal(patches[i].id, p.id); assert.equal(digest(fs.readFileSync(PATCH_FILES[i])), p.sha256); });
  assert.equal(digest(fs.readFileSync(SOURCE_FILE)), G.SOURCE_SHA256);
  assert.equal(source.agendaSignature, undefined, 'o 1.12.288 da main é o arquivo sem assinatura (quem assina é o fluxo do GitHub)');
});
t('Entradas: cada correção é válida pelas regras do aplicativo e troca exatamente um bloco de professor.html (o do gerador)', () => {
  patches.forEach((patch, i) => {
    G.checkPatch(patch);
    assert.equal(patch.area, 'professor');
    assert.equal(patch.changes.length, 1, patch.id + ' deveria trocar um bloco só');
    assert.equal(patch.changes[0].page, 'professor.html');
    assert.equal(patch.changes[0].id, G.PATCHES[i].block);
    assert.ok(G.ALLOWED['professor.html'].includes(patch.changes[0].id));
  });
  assert.equal(new Set(BLOCKS).size, 3, 'três blocos diferentes');
});
t('Entradas: no 1.12.288 os três blocos estão no estado "antes" de cada correção (é por isso que o pacote completo as retira)', () => {
  const html = source.files['professor.html'];
  patches.forEach(patch => {
    const change = patch.changes[0];
    assert.equal(sha(inner(html, change.id)), change.before, change.id + ': o 1.12.288 não tem o estado "antes" esperado');
    assert.notEqual(change.before, change.after);
  });
});
t('Entradas: as três correções, aplicadas uma a uma sobre o 1.12.288, na ordem do aplicativo, dão o mesmo conteúdo do pacote', () => {
  let files = {...source.files};
  for (const patch of patches) files = G.applyPatch(files, patch);
  assert.deepEqual(Object.keys(files), Object.keys(pack.files));
  for (const page of G.PAGES) assert.equal(files[page], pack.files[page], page);
});

// ---------- 2) o pacote ----------
t('Pacote: 1.12.291, sequência 397 (= 394 + 3 correções = build 291 + 106), mesmos aplicativo, ponte e esquema do 1.12.288', () => {
  assert.equal(pack.version, '1.12.291'); assert.equal(pack.sequence, 397);
  assert.equal(pack.sequence, source.sequence + patches.length);
  assert.equal(Number(pack.version.split('.')[2]), Number(source.version.split('.')[2]) + patches.length);
  assert.equal(pack.sequence - 106, Number(pack.version.split('.')[2]), 'a regra do projeto: sequência = número da versão + 106');
  for (const key of ['format', 'appId', 'bridgeVersion', 'dataSchema']) assert.equal(pack[key], source[key], key);
});
t('Pacote: chaves na mesma ordem do 1.12.288, sem assinatura, com título, resumo (até 200) e notas (até 4000)', () => {
  assert.deepEqual(Object.keys(pack), Object.keys(source));
  assert.deepEqual(Object.keys(pack), ['format', 'appId', 'bridgeVersion', 'dataSchema', 'version', 'sequence', 'files', 'notes', 'update', 'modularUpdates']);
  assert.equal(pack.agendaSignature, undefined);
  assert.ok(pack.update.summary.length > 0 && pack.update.summary.length <= 200, 'resumo ' + pack.update.summary.length);
  assert.ok(pack.notes.length > 0 && pack.notes.length <= 4000, 'notas ' + pack.notes.length);
  assert.ok(pack.update.title.length > 0 && pack.update.title.length <= 90, 'título ' + pack.update.title.length);
  assert.deepEqual(Object.keys(pack.update), Object.keys(source.update));
  for (const key of Object.keys(source.update)) if (!['title', 'summary'].includes(key)) assert.deepEqual(pack.update[key], source.update[key], 'update.' + key);
  assert.equal(pack.update.title, G.title); assert.equal(pack.update.summary, G.summary); assert.equal(pack.notes, G.notes);
});
t('Pacote: se a base trouxer uma assinatura (arquivo já assinado), o 291 sai sem ela: quem assina é o fluxo do GitHub, e uma assinatura velha não vale para o conteúdo novo', () => {
  const signed = {...source, agendaSignature: {keyId: 'qualquer', signature: 'x'}};
  const made = G.makeUpdate(signed, patches);
  assert.equal(made.agendaSignature, undefined);
  assert.equal(JSON.stringify(made), JSON.stringify(pack));
});
t('Pacote: as notas dizem o que o Tiago precisa saber (as três correções, o 288 → 291 de propósito, e que só professor.html muda)', () => {
  const n = pack.notes;
  for (const part of ['Catálogo de exercícios unificado', 'Baixar catálogo de exercícios', 'Duplicatas e exclusão no catálogo', '1.12.288', '291', 'professor.html', 'descanso, cronômetros, alarmes e notificações']) assert.ok(n.includes(part), 'as notas não dizem: ' + part);
});
t('Pacote: o tamanho cabe no limite do aplicativo (24 MiB) e o arquivo gravado é exatamente JSON.stringify(dados, null, 2) + quebra de linha', () => {
  const payload = JSON.stringify(pack, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  assert.equal(JSON.stringify(JSON.parse(payload), null, 2) + '\n', payload);
});

// ---------- 3) o escopo ----------
t('Escopo: só professor.html muda; index, avaliacoes e cadastro ficam byte a byte iguais; mesmas páginas, mesma ordem', () => {
  assert.deepEqual(Object.keys(pack.files), Object.keys(source.files));
  assert.deepEqual(Object.keys(pack.files).sort(), [...G.PAGES].sort(), 'as quatro páginas do aplicativo, nem uma a mais');
  for (const page of Object.keys(source.files)) {
    if (page === 'professor.html') assert.notEqual(pack.files[page], source.files[page], 'professor.html devia mudar');
    else assert.equal(pack.files[page], source.files[page], page + ' não devia mudar');
  }
});
t('Escopo: dentro de professor.html só mudam os três blocos; o resto da página é igual ao do 1.12.288', () => {
  const a = withoutBlocks(source.files['professor.html'], BLOCKS), b = withoutBlocks(pack.files['professor.html'], BLOCKS);
  assert.equal(a, b);
  assert.equal(blocksOf(pack.files['professor.html'], BLOCKS).size, 3);
});
t('Escopo: o texto de cada bloco é o da correção (SHA-256 "after") e nenhum outro bloco do arquivo mudou', () => {
  patches.forEach(patch => {
    const change = patch.changes[0];
    assert.equal(inner(pack.files['professor.html'], change.id), change.content);
    assert.equal(sha(inner(pack.files['professor.html'], change.id)), change.after);
  });
  // todos os blocos <script>/<style> com id do 1.12.288 fora os três: mesmo texto
  const ids = new Set([...source.files['professor.html'].matchAll(/<(?:script|style)\b[^>]*\sid="([^"]+)"/g)].map(m => m[1]));
  let compared = 0;
  for (const id of ids) {
    if (BLOCKS.includes(id)) continue;
    let before, after;
    try { before = inner(source.files['professor.html'], id); after = inner(pack.files['professor.html'], id); } catch (e) { continue; } // id repetido: o aplicativo também recusaria, não é alvo destas correções
    assert.equal(after, before, 'o bloco ' + id + ' mudou');
    compared++;
  }
  assert.ok(compared > 20, 'conferi poucos blocos (' + compared + ')');
});
t('Escopo: aplicar qualquer das três de novo sobre o pacote é recusado ("já está presente"): quem importar o arquivo da correção depois do 291 recebe o aviso certo', () => {
  patches.forEach(patch => throwsWith(() => G.applyPatch(pack.files, patch), 'já está presente'));
});
t('Escopo: o que mudou no 1.12.288 e o 291 não retira (o bloco da janela como página e o do "Apagar exercício") continua igual', () => {
  const html = pack.files['professor.html'];
  for (const id of ['dialog-scroll-lock-pages', 'ap-workout-previous-series']) {
    assert.equal(inner(html, id), inner(source.files['professor.html'], id), id);
    assert.ok(inner(html, id) && inner(html, id).length > 50, id + ' ausente');
  }
});

// ---------- 4) o histórico ----------
t('Histórico: um registro por correção, o mais novo na frente (03, 02, 01), depois o que o 1.12.288 já trazia', () => {
  const ids = pack.modularUpdates.map(r => r.id);
  assert.deepEqual(ids.slice(0, 3), [patches[2].id, patches[1].id, patches[0].id]);
  const old = (source.modularUpdates || []).filter(r => !patches.some(p => p.id === r.id)).map(r => r.id);
  assert.deepEqual(ids.slice(3), old.slice(0, ids.length - 3));
  assert.ok(pack.modularUpdates.length <= G.HISTORY_LIMIT);
  assert.equal(new Set(ids).size, ids.length, 'identificador repetido no histórico');
});
t('Histórico: cada registro novo tem id, área, título, versão da correção, assinatura do aplicativo, módulo "exercicios", ownsChanges e as notas', () => {
  patches.forEach(patch => {
    const record = pack.modularUpdates.find(r => r.id === patch.id);
    assert.deepEqual(Object.keys(record), ['id', 'area', 'title', 'version', 'signature', 'module', 'ownsChanges', 'summary']);
    assert.equal(record.area, 'professor'); assert.equal(record.title, patch.title); assert.equal(record.version, patch.version);
    assert.equal(record.signature, G.patchSignature(patch)); assert.match(record.signature, /^[a-f0-9]{64}$/);
    assert.equal(record.module, 'exercicios'); assert.equal(record.ownsChanges, true); assert.equal(record.summary, patch.notes);
  });
});
t('Histórico: a assinatura é o SHA-256 do JSON compacto [área, (módulo no formato 2), [[página, id, before, after]]], independente da ordem das mudanças', () => {
  patches.forEach(patch => {
    const identity = [patch.area]; if (patch.format === 'agenda-patch/2') identity.push(patch.module);
    identity.push(patch.changes.map(c => [c.page, c.id, c.before, c.after]));
    assert.equal(G.patchSignature(patch), sha(JSON.stringify(identity)));
    const reversed = copy(patch); reversed.changes = [...patch.changes].reverse();
    assert.equal(G.patchSignature(reversed), G.patchSignature(patch));
  });
});
t('Histórico: o limite é 20 (os mais antigos saem), o mesmo identificador com a mesma assinatura é substituído e com outra assinatura é recusado', () => {
  const filler = n => Array.from({length: n}, (_, i) => ({id: 'x-' + i, area: 'professor', title: 'T' + i, version: '1', signature: sha('s' + i), module: 'exercicios', ownsChanges: true, summary: 's'}));
  const record = G.historyRecord(patches[0]);
  const full = G.addHistory(filler(30), record);
  assert.equal(full.length, 20); assert.equal(full[0].id, record.id); assert.equal(full[19].id, 'x-18');
  const again = G.addHistory([{...record}, ...filler(3)], record);
  assert.equal(again.filter(r => r.id === record.id).length, 1); assert.equal(again.length, 4);
  throwsWith(() => G.addHistory([{...record, signature: sha('outra')}], record), 'Já existe outra correção');
  assert.deepEqual(G.addHistory(undefined, record), [record]);
  assert.deepEqual(G.addHistory([null, 7, {id: 'maiúscula-INVÁLIDA'}], record), [record], 'registros inválidos não entram');
});

// ---------- 5) o gerador ----------
t('Gerador: determinístico (duas execuções dão exatamente os mesmos bytes) e não altera as entradas lidas', () => {
  const again = G.makeUpdate(fresh().source, fresh().patches);
  assert.equal(JSON.stringify(again), JSON.stringify(pack));
  assert.equal(digest(fs.readFileSync(SOURCE_FILE)), G.SOURCE_SHA256);
});
t('Gerador: linha de comando grava o mesmo conteúdo da função, recusa sobrescrever e recusa entradas trocadas ou alteradas', () => {
  const run = (args, cwd) => spawnSync(process.execPath, [GENERATOR, ...args], {cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  const target = path.join(workDir, 'saida.agenda.json');
  const first = run([SOURCE_FILE, ...PATCH_FILES, target], workDir);
  assert.equal(first.status, 0, first.stderr);
  const written = fs.readFileSync(target, 'utf8');
  assert.equal(written, JSON.stringify(pack, null, 2) + '\n');
  assert.notEqual(run([SOURCE_FILE, ...PATCH_FILES, target], workDir).status, 0, 'não pode sobrescrever');
  assert.equal(fs.readFileSync(target, 'utf8'), written, 'o arquivo existente não pode mudar');
  // nome padrão, na pasta de onde se roda
  const standard = run([SOURCE_FILE, ...PATCH_FILES], workDir);
  assert.equal(standard.status, 0, standard.stderr);
  assert.ok(fs.existsSync(path.join(workDir, 'AgendaPersonal-1.12.291-Exercicios-Incluidos-Para-Assinar.agenda.json')));
  // ordem trocada (02, 01, 03) e arquivo alterado (um byte a mais) são recusados
  assert.notEqual(run([SOURCE_FILE, PATCH_FILES[1], PATCH_FILES[0], PATCH_FILES[2], path.join(workDir, 'x1.agenda.json')], workDir).status, 0);
  const altered = path.join(workDir, 'alterado.agenda.json');
  fs.writeFileSync(altered, fs.readFileSync(PATCH_FILES[0], 'utf8') + ' ');
  const bad = run([SOURCE_FILE, altered, PATCH_FILES[1], PATCH_FILES[2], path.join(workDir, 'x2.agenda.json')], workDir);
  assert.notEqual(bad.status, 0); assert.ok(!fs.existsSync(path.join(workDir, 'x2.agenda.json')), 'não pode deixar arquivo pela metade');
  assert.notEqual(run([SOURCE_FILE, PATCH_FILES[0]], workDir).status, 0, 'faltam correções');
});

// ---------- 6) sabotagens (o teste precisa enxergar o erro) ----------
t('Sabotagem: correção com o conteúdo alterado (SHA-256 não bate) é recusada', () => {
  const {patches: p} = fresh();
  p[0].changes[0].content += '\n/* a mais */';
  throwsWith(() => G.makeUpdate(fresh().source, p), 'integridade');
});
t('Sabotagem: arquivo de entrada com um byte diferente é recusado pelo SHA-256 do gerador', () => {
  const altered = path.join(workDir, 'um-byte.agenda.json');
  fs.writeFileSync(altered, fs.readFileSync(PATCH_FILES[1], 'utf8') + '\n');
  throwsWith(() => G.loadInputs(SOURCE_FILE, [PATCH_FILES[0], altered, PATCH_FILES[2]]), 'não é o que está na main');
});
t('Sabotagem: correções fora de ordem, faltando uma ou sobrando uma', () => {
  const {source: s, patches: p} = fresh();
  throwsWith(() => G.makeUpdate(s, [p[1], p[0], p[2]]), 'fora de ordem');
  throwsWith(() => G.makeUpdate(s, [p[0], p[1]]), 'Faltam correções');
  throwsWith(() => G.makeUpdate(s, [p[0], p[1], p[2], p[2]]), 'Faltam correções');
});
t('Sabotagem: base que não é o 1.12.288 (versão, sequência ou aplicativo diferentes) é recusada', () => {
  for (const [key, value] of [['version', '1.12.289'], ['sequence', 395], ['appId', 'com.outra.coisa'], ['format', 2]]) {
    const {source: s, patches: p} = fresh();
    s[key] = value;
    assert.throws(() => G.makeUpdate(s, p), undefined, key + ' diferente devia ser recusado');
  }
});
t('Sabotagem: conflito com o conteúdo em uso (bloco que não é nem o "antes" nem o "depois") e bloco ausente', () => {
  const {source: s, patches: p} = fresh();
  const html = s.files['professor.html'];
  const b = blocksOf(html, ['ap-workout-instructions']).get('ap-workout-instructions');
  const edited = {...s.files, 'professor.html': html.slice(0, b.end) + ' /* mexido */' + html.slice(b.end)};
  throwsWith(() => G.applyPatch(edited, p[0]), 'Conflito em ap-workout-instructions');
  const gone = {...s.files, 'professor.html': html.replace('id="ap-workout-export"', 'id="outro-id"')};
  throwsWith(() => G.applyPatch(gone, p[1]), 'não existe no conteúdo em uso');
  throwsWith(() => G.applyPatch({...s.files, 'professor.html': undefined}, p[0]), 'Página ausente');
});
t('Sabotagem: a correção repetida (já aplicada) é recusada e não dá um pacote em silêncio', () => {
  const {source: s, patches: p} = fresh();
  const once = {...s.files};
  const applied = G.applyPatch(once, p[0]);
  throwsWith(() => G.applyPatch(applied, p[0]), 'já está presente');
  // base que já traz a 01: o gerador para (não faz um 291 com "duas correções novas" e numeração errada)
  const withFirst = {...s, files: applied};
  throwsWith(() => G.makeUpdate(withFirst, p), 'já está presente');
});
t('Sabotagem: componente fora da lista permitida, página desconhecida, área, módulo, ponte e esquema errados, e bloco que fecha antes da hora', () => {
  const mk = edit => { const {patches: p} = fresh(); const patch = copy(p[0]); edit(patch); return patch; };
  const resign = patch => { patch.changes[0].after = sha(patch.changes[0].content); return patch; };
  throwsWith(() => G.checkPatch(mk(p => { p.changes[0].id = 'ap-outro-bloco'; })), 'fora do escopo permitido');
  throwsWith(() => G.checkPatch(mk(p => { p.changes[0].page = 'index.html'; })), 'fora do escopo permitido');
  throwsWith(() => G.checkPatch(mk(p => { p.changes[0].page = 'financeiro.html'; })), 'Página desconhecida');
  throwsWith(() => G.checkPatch(mk(p => { p.area = 'aluno'; })), 'Área diferente');
  throwsWith(() => G.checkPatch(mk(p => { p.format = 'agenda-patch/2'; p.module = 'financeiro'; })), 'Módulo diferente de exercicios');
  throwsWith(() => G.checkPatch(mk(p => { p.bridgeVersion = 2; })), 'bridgeVersion');
  throwsWith(() => G.checkPatch(mk(p => { p.dataSchema = 5; })), 'dataSchema');
  throwsWith(() => G.checkPatch(mk(p => { p.appId = 'com.outra.coisa'; })), 'appId');
  throwsWith(() => G.checkPatch(mk(p => { p.format = 'agenda-patch/9'; })), 'Formato');
  throwsWith(() => G.checkPatch(mk(p => { p.changes = []; })), 'Lista de mudanças');
  throwsWith(() => G.checkPatch(mk(p => { p.changes.push(copy(p.changes[0])); })), 'Mudança repetida');
  throwsWith(() => G.checkPatch(mk(p => { p.notes = 'x'.repeat(701); })), 'Notas inválidas');
  throwsWith(() => G.checkPatch(mk(p => { p.title = ''; })), 'Título inválido');
  throwsWith(() => G.checkPatch(resign(mk(p => { p.changes[0].content += '</script>'; }))), 'fecha o bloco antes da hora');
  throwsWith(() => G.checkPatch(resign(mk(p => { p.changes[0].content += '</STYLE >'; }))), 'fecha o bloco antes da hora');
  throwsWith(() => G.checkPatch(mk(p => { p.changes[0].before = p.changes[0].after; })), 'Hashes inválidos');
});
t('Sabotagem: página com bloco repetido ou com id duplicado é recusada como no aplicativo', () => {
  const {source: s, patches: p} = fresh();
  const html = s.files['professor.html'];
  const b = blocksOf(html, ['ap-workout-instructions']).get('ap-workout-instructions');
  const open = html.lastIndexOf('<', b.start - 1), close = html.indexOf('>', b.end) + 1;
  const duplicated = {...s.files, 'professor.html': html.slice(0, close) + html.slice(open, close) + html.slice(close)};
  throwsWith(() => G.applyPatch(duplicated, p[0]), 'estrutura incompatível');
});
t('Sabotagem: as sabotagens não estragaram as entradas (o teste termina com o mesmo SHA-256 dos arquivos)', () => {
  assert.equal(digest(fs.readFileSync(SOURCE_FILE)), G.SOURCE_SHA256);
  G.PATCHES.forEach((p, i) => assert.equal(digest(fs.readFileSync(PATCH_FILES[i])), p.sha256));
  assert.equal(JSON.stringify(G.makeUpdate(fresh().source, fresh().patches)), JSON.stringify(pack));
});

(async () => {
  for (const [name, fn] of queue) {
    try { await fn(); ok++; console.log('OK   ' + name); } catch (e) { bad++; console.log('FALHA ' + name + '\n     ' + String(e && e.message || e).split('\n').join('\n     ')); }
  }
  fs.rmSync(workDir, {recursive: true, force: true});
  console.log('\n' + ok + ' ok, ' + bad + ' com falha, de ' + queue.length);
  process.exit(bad ? 1 : 0);
})();
