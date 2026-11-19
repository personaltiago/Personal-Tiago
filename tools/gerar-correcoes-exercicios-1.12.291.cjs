'use strict';

// Gera o pacote 1.12.291 (sem assinatura) = pacote 1.12.288 (seq 394) + as três correções de exercícios que estão à parte no site:
//   01 Catálogo de exercícios unificado   (professor.html, bloco ap-workout-instructions)
//   02 Baixar catálogo de exercícios      (professor.html, bloco ap-workout-export)
//   03 Duplicatas e exclusão no catálogo  (professor.html, bloco ap-workout-corrections)
// Motivo (Tiago, 19/11): "quando eu instalo, está desinstalando as que já estão lá, por exemplo a dos exercícios". É isso mesmo: um pacote
// completo (.agenda.json com as quatro páginas) SUBSTITUI as páginas inteiras, então um pacote feito sem essas correções (todos os completos
// de 1.12.273 a 1.12.288) retira as que já estavam instaladas. Este pacote junta tudo: o conteúdo do 1.12.288 com as três correções já
// aplicadas. Os próximos pacotes completos devem partir deste (versão a partir de 1.12.292, sequência a partir de 398).
//
// Como o conteúdo é montado: o MESMO algoritmo do aplicativo (UpdateAreaPatch.apply / findBlocks / replaceBlocks, app 1.207): cada mudança
// troca o texto de dentro de um bloco <script id=...> ou <style id=...>; o texto atual do bloco precisa ter o SHA-256 "before" (ou já
// ter o "after", e então fica como está); qualquer outro texto é conflito e o gerador para. O resultado é conferido contra o código Java
// real do aplicativo em equipe/testes/correcoes-exercicios.java.py.
// Como o histórico é montado: igual ao do aplicativo quando se instala uma correção por arquivo (UpdateAreaPatch.history e
// UpdateManager.importUri): um registro por correção, o mais novo primeiro, com a assinatura do aplicativo (signature), ownsChanges e o
// texto das notas (summary), somado aos registros que o 1.12.288 já trazia.
// Como a numeração é montada: o aplicativo soma 1 à versão e 1 à sequência a cada correção instalada. Três correções sobre o 1.12.288
// (seq 394) dão 1.12.291 (seq 397). Usar exatamente esse número evita o aviso "Revisar restauração" em qualquer aparelho que já tenha
// instalado uma, duas ou as três correções por arquivo (o aparelho com as três, se o conteúdo for igual, só diz "já está instalado").
// Não muda: index.html, avaliacoes.html, cadastro.html, dados, Firebase, descanso, cronômetros, alarmes e notificações.

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const version = '1.12.291';
const sequence = 397;
const title = 'Correções de exercícios incluídas';
const summary = 'Reúne o 1.12.288 e as três correções de exercícios (catálogo unificado, baixar catálogo, duplicatas e exclusão), que os pacotes completos anteriores retiravam.';
const notes = 'Reúne num arquivo só o 1.12.288 (Janelas como página) e as três correções de exercícios que estavam à parte. '
  + 'Os pacotes completos anteriores foram feitos sem elas e, ao serem instalados, retiravam as que já estivessem no aparelho. '
  + 'Instalando este, as três ficam incluídas, e os próximos pacotes completos partem dele.\n\n'
  + 'Catálogo de exercícios unificado. Exercícios criados no catálogo ou no treino aparecem em Exercícios do app, junto com os cadastrados antes. '
  + 'Favoritos, vídeos, instruções e vínculos com as fichas são preservados.\n\n'
  + 'Baixar catálogo de exercícios. Baixa um TXT com todos os exercícios agrupados por região, incluindo como fazer, observações, '
  + 'links dos vídeos e indicação dos itens adicionados ou editados.\n\n'
  + 'Duplicatas e exclusão no catálogo. Mostra um cartão por exercício equivalente e disponibiliza Excluir do catálogo para os exercícios '
  + 'do app e os cadastrados. Preserva os dados vinculados a fichas e histórico.\n\n'
  + 'Em relação ao 1.12.288 muda só o arquivo professor.html, e só nesses três trechos do catálogo de exercícios. '
  + 'Nenhum aluno, ficha, treino, histórico ou cadastro é alterado ao instalar, e descanso, cronômetros, alarmes e notificações não foram mexidos. '
  + 'Se você já tinha instalado alguma das três correções, nada se perde: o conteúdo delas é o mesmo.\n\n'
  + 'A versão pula do 288 para o 291 de propósito: é a mesma numeração que o aplicativo dá ao instalar as três correções, uma a uma, sobre o 288.';

const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_VERSION = '1.12.288';
const SOURCE_SEQUENCE = 394;
// O pacote 1.12.288 que o Tiago subiu na main (commit 176f8d7, 19/11 11:54:50), sem assinatura.
const SOURCE_NAME = 'AgendaPersonal-1.12.288-Janelas-Como-Pagina-Para-Assinar.agenda.json';
const SOURCE_SHA256 = '1f9b66c8cb8af792ed661c435d46ba2ee172306e6f4b38c298e38836b2d29f15';
// As correções na ordem em que o aplicativo as instalaria (a mais antiga primeiro). O SHA-256 é do arquivo como está na main.
const PATCHES = [
  {
    name: 'AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json', id: 'professor-catalogo-exercicios-unificado',
    sha256: '2f35cc63a72403df04b9058ca28a42e7ad7bc685fbf1dce2277c09c4d96ea397', block: 'ap-workout-instructions'
  },
  {
    name: 'AgendaPersonal-02-Baixar-Catalogo-Para-Assinar.agenda.json', id: 'professor-baixar-catalogo-exercicios',
    sha256: 'bdfef91b00e0a6699d8e460bc1804ade1b1b7a7dd76fda540f7690a166b94950', block: 'ap-workout-export'
  },
  {
    name: 'AgendaPersonal-03-Corrigir-Duplicatas-Catalogo-Para-Assinar.agenda.json', id: 'professor-catalogo-exercicios-duplicatas',
    sha256: 'be415ec62e96d0c6a337da6b2d3153ba9a7d7b56c967b5a436fe518ee178a9cd', block: 'ap-workout-corrections'
  }
];

const PAGES = ['index.html', 'professor.html', 'avaliacoes.html', 'cadastro.html'];
const FORMAT = 'agenda-patch/1';
const FORMAT_MODULE = 'agenda-patch/2';
const AREA = 'professor';
const MODULE = 'exercicios';
// Componentes que o aplicativo aceita em professor.html para o módulo Exercícios (UpdateAreaPatch.RULES/MODULES), só os que estas correções usam.
const ALLOWED = {'professor.html': ['ap-workout-corrections', 'ap-workout-instructions', 'ap-workout-export']};
const LABEL = /^[a-z0-9][a-z0-9-]{0,59}$/;
const HASH = /^[a-f0-9]{64}$/;
const END_BLOCK = /<\/\s*(?:script|style)\b/i;
const HISTORY_LIMIT = 20;

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const line = (value, max) => typeof value === 'string' && value.length <= max && value.trim().length > 0;
const keyOf = change => change.page + '|' + change.id;
const byKey = (a, b) => (keyOf(a) < keyOf(b) ? -1 : keyOf(a) > keyOf(b) ? 1 : 0);

// ---------- Blocos (cópia do UpdateAreaPatch.findBlocks) ----------
function tagEnd(html, start) {
  let quote = '';
  for (let at = start; at < html.length; at++) {
    const c = html[at];
    if (quote) { if (c === quote) quote = ''; }
    else if (c === '\'' || c === '"') quote = c;
    else if (c === '>') return at;
  }
  return -1;
}

// Devolve Map(id -> {start, end}) com o texto de dentro de cada <script>/<style> pedido. Estrutura estranha (id repetido,
// src, bloco repetido) é recusada, como no aplicativo.
function findBlocks(html, wanted) {
  const blocks = new Map();
  const rawTag = /<!--|<(script|style|textarea|title|xmp|iframe|noembed|noframes)\b/gi;
  let from = 0;
  for (;;) {
    rawTag.lastIndex = from;
    const raw = rawTag.exec(html);
    if (!raw) break;
    const tag = raw[1];
    const rawEnd = raw.index + raw[0].length;
    if (tag === undefined) {
      const end = html.indexOf('-->', rawEnd);
      if (end < 0) break;
      from = end + 3;
      continue;
    }
    const openingEnd = tagEnd(html, rawEnd);
    if (openingEnd < 0) break;
    const close = new RegExp('</' + tag + '\\s*>', 'gi');
    close.lastIndex = openingEnd + 1;
    const closing = close.exec(html);
    if (!closing) break;
    from = closing.index + closing[0].length;
    if (!/^(?:script|style)$/i.test(tag)) continue;
    const attributes = /\s([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    const inside = html.slice(rawEnd, openingEnd);
    let found = null, ids = 0, src = false, attribute;
    while ((attribute = attributes.exec(inside)) !== null) {
      const name = attribute[1];
      if (/^src$/i.test(name)) src = true;
      if (!/^id$/i.test(name)) continue;
      ids++;
      const id = attribute[2] !== undefined ? attribute[2] : attribute[3] !== undefined ? attribute[3] : attribute[4];
      if (wanted.has(id)) found = id;
    }
    if (found !== null && (ids !== 1 || src || blocks.has(found))) {
      throw new Error('O componente ' + found + ' aparece em uma estrutura incompatível.');
    }
    if (found !== null) blocks.set(found, {start: openingEnd + 1, end: closing.index});
  }
  return blocks;
}

// ---------- Conferência de uma correção (os mesmos requisitos do UpdateAreaPatch.apply) ----------
function checkPatch(patch) {
  assert.ok(patch && typeof patch === 'object' && !Array.isArray(patch), 'Correção inválida');
  assert.ok(patch.format === FORMAT || patch.format === FORMAT_MODULE, 'Formato de correção desconhecido: ' + patch.format);
  assert.equal(patch.appId, APP_ID, 'appId diferente');
  assert.equal(patch.bridgeVersion, 3, 'bridgeVersion diferente');
  assert.equal(patch.dataSchema, 4, 'dataSchema diferente');
  assert.ok(typeof patch.id === 'string' && LABEL.test(patch.id), 'Identificador inválido: ' + patch.id);
  assert.equal(patch.area, AREA, 'Área diferente de professor: ' + patch.area);
  assert.ok(line(patch.title, 90), 'Título inválido');
  assert.ok(line(patch.version, 40), 'Versão da correção inválida');
  assert.ok(line(patch.notes, 700), 'Notas inválidas (vazias ou acima de 700 caracteres)');
  assert.ok(Array.isArray(patch.changes) && patch.changes.length >= 1 && patch.changes.length <= 24, 'Lista de mudanças inválida');
  if (patch.format === FORMAT_MODULE) assert.equal(patch.module, MODULE, 'Módulo diferente de exercicios: ' + patch.module);
  const seen = new Set();
  for (const change of patch.changes) {
    assert.ok(PAGES.includes(change.page), 'Página desconhecida: ' + change.page);
    assert.ok(typeof change.id === 'string' && LABEL.test(change.id), 'Componente inválido: ' + change.id);
    assert.ok((ALLOWED[change.page] || []).includes(change.id), 'Componente fora do escopo permitido: ' + change.page + ' ' + change.id);
    assert.ok(HASH.test(change.before) && HASH.test(change.after) && change.before !== change.after, 'Hashes inválidos em ' + change.id);
    assert.equal(typeof change.content, 'string', 'Conteúdo ausente em ' + change.id);
    assert.ok(!END_BLOCK.test(change.content), 'O conteúdo de ' + change.id + ' fecha o bloco antes da hora');
    assert.equal(sha256(change.content), change.after, 'Falha na verificação de integridade de ' + change.id);
    assert.ok(!seen.has(keyOf(change)), 'Mudança repetida: ' + keyOf(change));
    seen.add(keyOf(change));
  }
}

// Aplica uma correção às páginas, como o aplicativo (UpdateAreaPatch.replaceBlocks). Devolve páginas novas (as não tocadas ficam
// idênticas, a mesma string). Recusa conflito, componente ausente e correção que já está presente.
function applyPatch(files, patch) {
  checkPatch(patch);
  const next = {...files};
  const ordered = [...patch.changes].sort(byKey);
  let changed = false;
  for (const page of PAGES) {
    const selected = new Map(ordered.filter(change => change.page === page).map(change => [change.id, change]));
    if (selected.size === 0) continue;
    const html = files[page];
    assert.equal(typeof html, 'string', 'Página ausente: ' + page);
    const blocks = findBlocks(html, selected);
    const pending = [];
    for (const change of selected.values()) {
      const block = blocks.get(change.id);
      assert.ok(block, 'O componente ' + change.id + ' não existe no conteúdo em uso.');
      const current = sha256(html.slice(block.start, block.end));
      if (current === change.after) continue;
      assert.equal(current, change.before, 'Conflito em ' + change.id + ': esta correção precisa ser adaptada ao conteúdo em uso.');
      pending.push(change);
    }
    if (pending.length === 0) continue;
    pending.sort((a, b) => blocks.get(a.id).start - blocks.get(b.id).start);
    let result = '', from = 0;
    for (const change of pending) {
      const block = blocks.get(change.id);
      result += html.slice(from, block.start) + change.content;
      from = block.end;
    }
    next[page] = result + html.slice(from);
    changed = true;
  }
  assert.ok(changed, 'Esta correção já está presente: ' + patch.id);
  return next;
}

// Assinatura do aplicativo para o histórico: SHA-256 do JSON compacto [área, (módulo declarado, só no formato 2), [[página, id, before, after], ...]].
function patchSignature(patch) {
  const identity = [patch.area];
  if (patch.format === FORMAT_MODULE) identity.push(patch.module);
  identity.push([...patch.changes].sort(byKey).map(change => [change.page, change.id, change.before, change.after]));
  return sha256(JSON.stringify(identity));
}

// Registro do histórico como o aplicativo grava ao instalar a correção por arquivo (history() + ownsChanges + summary).
function historyRecord(patch) {
  return {
    id: patch.id, area: patch.area, title: patch.title, version: patch.version, signature: patchSignature(patch),
    module: MODULE, ownsChanges: true, summary: patch.notes
  };
}

// Novo histórico: o registro novo na frente e depois os que já existiam (sem repetir o mesmo identificador e até 20), como UpdateAreaPatch.history.
function addHistory(previous, record) {
  const result = [record];
  for (const item of Array.isArray(previous) ? previous : []) {
    if (!item || typeof item !== 'object') continue;
    if (item.id === record.id) {
      assert.equal(item.signature, record.signature, 'Já existe outra correção com o identificador ' + record.id);
    } else if (result.length < HISTORY_LIMIT && typeof item.id === 'string' && LABEL.test(item.id) && line(item.title, 90) &&
      line(item.version, 40) && typeof item.signature === 'string' && HASH.test(item.signature)) {
      result.push(item);
    }
  }
  return result;
}

function makeUpdate(source, patches) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, SOURCE_VERSION);
  assert.equal(source.sequence, SOURCE_SEQUENCE);
  assert.ok(Array.isArray(patches) && patches.length === PATCHES.length, 'Faltam correções');
  patches.forEach((patch, index) => assert.equal(patch.id, PATCHES[index].id, 'Correção fora de ordem: ' + patch.id));
  assert.equal(sequence, SOURCE_SEQUENCE + patches.length, 'A sequência deve ser a do 1.12.288 mais uma por correção');
  assert.equal(version, '1.12.' + (288 + patches.length), 'A versão deve ser a do 1.12.288 mais uma por correção');
  assert.ok(summary.length <= 200, 'O resumo passa de 200 caracteres: ' + summary.length);
  assert.ok(notes.length <= 4000, 'As notas passam de 4000 caracteres: ' + notes.length);
  const { agendaSignature, ...original } = source;
  let files = {...original.files};
  let history = original.modularUpdates;
  for (const patch of patches) {
    files = applyPatch(files, patch);
    history = addHistory(history, historyRecord(patch));
  }
  return {...original, files, version, sequence, notes, update: {...original.update, title, summary}, modularUpdates: history};
}

// Lê os quatro arquivos e confere o SHA-256 de cada um contra o que está na main.
function loadInputs(sourceFile, patchFiles) {
  const read = (file, expected, what) => {
    const bytes = readFileSync(file);
    assert.equal(sha256Bytes(bytes), expected, 'O arquivo ' + what + ' não é o que está na main (SHA-256 diferente): ' + file);
    return JSON.parse(bytes.toString('utf8'));
  };
  const source = read(sourceFile, SOURCE_SHA256, SOURCE_NAME);
  assert.ok(patchFiles.length === PATCHES.length, 'Informe as ' + PATCHES.length + ' correções, na ordem 01, 02 e 03');
  const patches = patchFiles.map((file, index) => read(file, PATCHES[index].sha256, PATCHES[index].name));
  return {source, patches};
}
const sha256Bytes = bytes => createHash('sha256').update(bytes).digest('hex');

if (require.main === module) {
  const [, , sourceFile, p01, p02, p03, targetFile = 'AgendaPersonal-1.12.291-Exercicios-Incluidos-Para-Assinar.agenda.json'] = process.argv;
  assert.ok(sourceFile && p01 && p02 && p03, 'Uso: node tools/gerar-correcoes-exercicios-1.12.291.cjs <1.12.288.agenda.json> <01.agenda.json> <02.agenda.json> <03.agenda.json> [saida.agenda.json]');
  const { source, patches } = loadInputs(sourceFile, [p01, p02, p03]);
  const data = makeUpdate(source, patches);
  const payload = JSON.stringify(data, null, 2) + '\n';
  assert.ok(Buffer.byteLength(payload, 'utf8') < 24 * 1024 ** 2);
  writeFileSync(targetFile, payload, {encoding: 'utf8', flag: 'wx'});
  console.log(targetFile);
}

module.exports = {
  makeUpdate, loadInputs, findBlocks, checkPatch, applyPatch, patchSignature, historyRecord, addHistory,
  PATCHES, PAGES, ALLOWED, APP_ID, SOURCE_NAME, SOURCE_SHA256, SOURCE_VERSION, SOURCE_SEQUENCE, MODULE, AREA, HISTORY_LIMIT,
  sha256, version, sequence, title, summary, notes
};
