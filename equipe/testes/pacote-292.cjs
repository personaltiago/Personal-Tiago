'use strict';
// Acha (ou refaz) o pacote 1.12.292 que foi entregue ao Tiago, sempre conferido pelo SHA-256, para os testes do 1.12.293.
// Ordem de busca: a variável PACOTE_292 (caminho do arquivo), a raiz do repositório (se o 292 já foi subido na main) e, por último, o
// gerador do 292 a partir do 1.12.291 (que por sua vez é achado ou refeito por pacote-291.cjs).
// Uso na linha de comando:  node equipe/testes/pacote-292.cjs <pasta-de-trabalho>   (imprime o caminho do arquivo)
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const {locate291} = require('./pacote-291.cjs');

const ROOT = path.join(__dirname, '../..');
const G292 = require(path.join(ROOT, 'tools/gerar-sininho-feedback-1.12.292.cjs'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const SHA256_292 = '82f41147ea8b47609483817506756ed1c1560c0dc7c718eed83b8e0224e687fb';
const NAME_292 = 'AgendaPersonal-1.12.292-Sino-Feedback-Para-Assinar.agenda.json';

function locate292(workDir) {
  fs.mkdirSync(workDir, {recursive: true});
  for (const candidate of [process.env.PACOTE_292, path.join(ROOT, NAME_292)]) {
    if (candidate && fs.existsSync(candidate) && digest(fs.readFileSync(candidate)) === SHA256_292) return candidate;
  }
  const bytes = Buffer.from(JSON.stringify(G292.makeUpdate(G292.loadSource(locate291(path.join(workDir, 'p291')))), null, 2) + '\n', 'utf8');
  assert.equal(digest(bytes), SHA256_292, 'O gerador do 292 não refez o pacote 1.12.292 entregue (SHA-256 diferente)');
  const target = path.join(workDir, NAME_292);
  fs.writeFileSync(target, bytes);
  return target;
}

module.exports = {locate292, SHA256_292, NAME_292};

if (require.main === module) {
  if (!process.argv[2]) { console.error('uso: node equipe/testes/pacote-292.cjs <pasta-de-trabalho>'); process.exit(2); }
  console.log(locate292(path.resolve(process.argv[2])));
}
