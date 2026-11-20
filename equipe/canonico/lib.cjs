'use strict';
// Biblioteca comum do controle de regressão (equipe/canonico/ e equipe/testes/regressao/).
// Lê os blocos <script id> / <style id> das páginas do mesmo jeito que o aplicativo (UpdateAreaPatch.findBlocks) e tira as regras de
// área e a lista de componentes compartilhados (SHARED) do próprio UpdateAreaPatch.java de dentro do ZIP oficial, para nunca divergir do
// código que roda no aparelho.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');

const RAIZ = path.join(__dirname, '..', '..');
const ZIP = path.join(RAIZ, 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip');
const FORA = '#fora-dos-blocos';
const PAGINAS = ['index.html', 'professor.html', 'avaliacoes.html', 'cadastro.html'];
const sha256 = texto => crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
const sha256Bytes = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function tagEnd(html, from) {
  let quote = null;
  for (let i = from; i < html.length; i++) {
    const c = html[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") quote = c; else if (c === '>') return i;
  }
  return -1;
}

// Todos os blocos <script>/<style> com id de uma página: Map id -> {hash, vezes, inicio, fim}. Blocos com o mesmo id mais de uma vez
// (o app não deixa uma correção por área mexer neles) ficam com vezes > 1 e o hash da concatenação na ordem.
function blocos(html) {
  const mapa = new Map();
  const rawTag = /<!--|<(script|style|textarea|title|xmp|iframe|noembed|noframes)\b/gi;
  let from = 0;
  for (;;) {
    rawTag.lastIndex = from;
    const raw = rawTag.exec(html);
    if (!raw) break;
    const tag = raw[1], rawEnd = raw.index + raw[0].length;
    if (tag === undefined) { const end = html.indexOf('-->', rawEnd); if (end < 0) break; from = end + 3; continue; }
    const openingEnd = tagEnd(html, rawEnd);
    if (openingEnd < 0) break;
    const close = new RegExp('</' + tag + '\\s*>', 'gi');
    close.lastIndex = openingEnd + 1;
    const closing = close.exec(html);
    if (!closing) break;
    from = closing.index + closing[0].length;
    if (!/^(?:script|style)$/i.test(tag)) continue;
    const m = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(html.slice(rawEnd, openingEnd));
    if (!m) continue;
    const id = m[1] ?? m[2] ?? m[3];
    const texto = html.slice(openingEnd + 1, closing.index);
    const atual = mapa.get(id);
    if (atual) { atual.vezes++; atual.texto += '\u0000' + texto; atual.hash = sha256(atual.texto); }
    else mapa.set(id, {hash: sha256(texto), vezes: 1, texto, inicio: openingEnd + 1, fim: closing.index});
  }
  for (const v of mapa.values()) delete v.texto;
  // O que fica fora dos blocos com id (marcação HTML, scripts sem id): um pacote completo também pode reverter isso.
  const partes = [...mapa.values()].sort((x, y) => x.inicio - y.inicio);
  let resto = '', de = 0;
  for (const b of partes) { if (b.vezes === 1) { resto += html.slice(de, b.inicio) + '\u0000'; de = b.fim; } }
  resto += html.slice(de);
  mapa.set(FORA, {hash: sha256(resto), vezes: 1, inicio: -1, fim: -1});
  return mapa;
}

let fonteJava = null;
function updateAreaPatchJava() {
  if (fonteJava) return fonteJava;
  const nomes = execFileSync('unzip', ['-Z1', ZIP], {maxBuffer: 64 * 1024 * 1024}).toString('utf8').split('\n');
  const nome = nomes.find(n => n.endsWith('/com/tiagolima/agendapersonal/UpdateAreaPatch.java'));
  if (!nome) throw new Error('UpdateAreaPatch.java não está no ZIP oficial');
  fonteJava = execFileSync('unzip', ['-p', ZIP, nome], {maxBuffer: 64 * 1024 * 1024}).toString('utf8');
  return fonteJava;
}

// SHARED e as regras de área (por página, na ordem de PAGINAS) lidas do UpdateAreaPatch.java oficial.
function regrasDoApp() {
  const java = updateAreaPatchJava();
  const shared = /SHARED\s*=\s*Arrays\.asList\(([^;]*)\);/.exec(java);
  const compartilhados = [...shared[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const inicio = java.indexOf('RULES = {'), fim = java.indexOf('};', inicio);
  const corpo = java.slice(inicio + 'RULES = {'.length, fim);
  const grupos = [];
  let nivel = 0, atual = '';
  for (const c of corpo) {
    if (c === '{') { nivel++; if (nivel === 1) { atual = ''; continue; } }
    if (c === '}') { nivel--; if (nivel === 0) { grupos.push(atual); continue; } }
    if (nivel >= 1) atual += c;
  }
  if (grupos.length !== PAGINAS.length) throw new Error('Não consegui ler as regras de área do UpdateAreaPatch.java');
  const areaDe = {};
  grupos.forEach((g, i) => {
    const texto = g.replace(/"\s*\+\s*"/g, '');
    const mapa = areaDe[PAGINAS[i]] = {};
    for (const linha of texto.matchAll(/"([^"]+)"/g)) {
      const [area, ...ids] = linha[1].trim().split(/\s+/);
      for (const id of ids) mapa[id] = area;
    }
  });
  return {compartilhados, areaDe};
}

function areaDoBloco(regras, pagina, id) { return regras.areaDe[pagina]?.[id] || 'geral'; }

function lerJson(arquivo) { return JSON.parse(fs.readFileSync(arquivo, 'utf8')); }

// Situação de uma mudança de correção por área (agenda-patch) num conteúdo: 'presente' (o bloco já está como ela deixa), 'aplicavel'
// (está como ela espera encontrar) ou 'conflito'. A versão autoritativa é o UpdateAreaPatch de verdade (teste Java); esta serve ao CI rápido.
function situacaoMudanca(pacote, mudanca, cache = new Map()) {
  const pagina = mudanca.page;
  if (!cache.has(pagina)) cache.set(pagina, blocos(pacote.files[pagina] || ''));
  const bloco = cache.get(pagina).get(mudanca.id);
  if (!bloco) return 'ausente';
  if (bloco.hash === mudanca.after) return 'presente';
  if (bloco.hash === mudanca.before) return 'aplicavel';
  return 'conflito';
}

module.exports = {FORA, RAIZ, ZIP, PAGINAS, sha256, sha256Bytes, blocos, regrasDoApp, areaDoBloco, lerJson, situacaoMudanca};
