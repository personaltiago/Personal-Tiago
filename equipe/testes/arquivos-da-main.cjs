'use strict';
// Acha, conferindo o SHA-256, arquivos que o Tiago subiu na raiz da main (pacotes e correções por área) para os testes do pacote 1.12.293.
// Ordem de busca para cada arquivo: a raiz deste clone; a main do GitHub (origin/main); qualquer commit do histórico que tenha o arquivo
// com esse SHA-256 (git log --all). Copia o que achou para a pasta de trabalho e imprime o caminho da cópia.
// Uso:  node equipe/testes/arquivos-da-main.cjs <pasta-de-trabalho> <nome>=<sha256> [<nome>=<sha256> ...]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {execFileSync} = require('child_process');
const ROOT = path.join(__dirname, '../..');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = args => { try { return execFileSync('git', args, {cwd: ROOT, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore']}); } catch (e) { return null; } };

function locateMain(name, sha256, workDir) {
  fs.mkdirSync(workDir, {recursive: true});
  const target = path.join(workDir, name);
  const accept = bytes => { if (bytes && digest(bytes) === sha256) { fs.writeFileSync(target, bytes); return target; } return null; };
  const inRoot = path.join(ROOT, name);
  if (fs.existsSync(inRoot)) { const found = accept(fs.readFileSync(inRoot)); if (found) return found; }
  for (const ref of ['origin/main', 'main']) { const found = accept(git(['show', ref + ':' + name])); if (found) return found; }
  const commits = (git(['log', '--all', '--format=%H', '--', name]) || Buffer.alloc(0)).toString('utf8').split(/\s+/).filter(Boolean);
  for (const commit of commits) { const found = accept(git(['show', commit + ':' + name])); if (found) return found; }
  throw new Error('Não achei ' + name + ' com SHA-256 ' + sha256 + ' (nem na raiz, nem na main, nem no histórico). Se o clone é raso: git fetch --unshallow; e: git fetch origin main.');
}

module.exports = {locateMain};

if (require.main === module) {
  const [, , pasta, ...pares] = process.argv;
  if (!pasta || !pares.length) { console.error('uso: node arquivos-da-main.cjs <pasta> <nome>=<sha256> ...'); process.exit(2); }
  for (const par of pares) { const i = par.lastIndexOf('='); console.log(locateMain(par.slice(0, i), par.slice(i + 1), path.resolve(pasta))); }
}
