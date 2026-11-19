'use strict';
// Acha (ou refaz) o pacote 1.12.291 que foi entregue ao Tiago, sempre conferido pelo SHA-256, para os testes do 1.12.292.
// Ordem de busca: a variável PACOTE_291 (caminho do arquivo), a raiz do repositório (se o 291 já foi subido na main) e, por último, o
// próprio gerador do 291 a partir dos quatro arquivos que já estão na main (na raiz ou no commit em que foram subidos).
// Uso na linha de comando:  node equipe/testes/pacote-291.cjs <pasta-de-trabalho>   (imprime o caminho do arquivo)
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const ROOT = path.join(__dirname, '../..');
const G = require(path.join(ROOT, 'tools/gerar-sininho-feedback-1.12.292.cjs'));
const G291 = require(path.join(ROOT, 'tools/gerar-correcoes-exercicios-1.12.291.cjs'));

// Os quatro arquivos que o gerador do 291 usa: na raiz (como o Tiago subiu) ou, se um dia o arquivo da raiz for trocado, no commit abaixo.
const COMMITS = {
  [G291.SOURCE_NAME]: '176f8d75e96412b8e0491ccb6d16fa23b7f96c2b',
  'AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json': '0764e15f1e0860c4a139e1105ae1bf2426801ded',
  'AgendaPersonal-02-Baixar-Catalogo-Para-Assinar.agenda.json': '0764e15f1e0860c4a139e1105ae1bf2426801ded',
  'AgendaPersonal-03-Corrigir-Duplicatas-Catalogo-Para-Assinar.agenda.json': '4bfa7eb1d23a9547f2279342f2f12c9a0f800b15'
};
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function locate(name, expected, workDir) {
  const inRoot = path.join(ROOT, name);
  if (fs.existsSync(inRoot) && digest(fs.readFileSync(inRoot)) === expected) return inRoot;
  const commit = COMMITS[name];
  let fromHistory;
  try {
    fromHistory = execFileSync('git', ['show', commit + ':' + name], {cwd: ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
  } catch (problem) {
    throw new Error('Não achei ' + name + ' (SHA-256 ' + expected + '): o arquivo da raiz é outro e o commit ' + String(commit).slice(0, 7) +
      ' não está neste clone (se o clone é raso, rode: git fetch --unshallow).');
  }
  assert.equal(digest(fromHistory), expected, name + ' do histórico do git não é o esperado');
  const copy = path.join(workDir, name);
  fs.writeFileSync(copy, fromHistory);
  return copy;
}

function locate291(workDir) {
  fs.mkdirSync(workDir, {recursive: true});
  for (const candidate of [process.env.PACOTE_291, path.join(ROOT, G.SOURCE_NAME)]) {
    if (candidate && fs.existsSync(candidate) && digest(fs.readFileSync(candidate)) === G.SOURCE_SHA256) return candidate;
  }
  const {source, patches} = G291.loadInputs(locate(G291.SOURCE_NAME, G291.SOURCE_SHA256, workDir), G291.PATCHES.map(p => locate(p.name, p.sha256, workDir)));
  const bytes = Buffer.from(JSON.stringify(G291.makeUpdate(source, patches), null, 2) + '\n', 'utf8');
  assert.equal(digest(bytes), G.SOURCE_SHA256, 'O gerador do 291 não refez o pacote 1.12.291 entregue (SHA-256 diferente)');
  const target = path.join(workDir, G.SOURCE_NAME);
  fs.writeFileSync(target, bytes);
  return target;
}

module.exports = {locate291};

if (require.main === module) {
  if (!process.argv[2]) { console.error('uso: node equipe/testes/pacote-291.cjs <pasta-de-trabalho>'); process.exit(2); }
  console.log(locate291(path.resolve(process.argv[2])));
}
