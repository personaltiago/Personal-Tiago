'use strict';
// Sinaliza pacotes e correções da raiz do repositório que o manifesto ainda não classificou (nem na cadeia, nem entre as correções,
// nem como anteriores à cadeia), ou cujo SHA-256 mudou. Reprova (código 1) para que um envio novo na main seja incluído no manifesto
// (com o estado verdadeiro dele em status-pacotes.json) antes de qualquer outra atualização partir da referência.
// Uso (da raiz): node equipe/canonico/conferir-raiz.cjs
const fs = require('node:fs');
const path = require('node:path');
const L = require('./lib.cjs');
const M = L.lerJson(path.join(__dirname, 'manifesto.json'));
const conhecidos = new Map([...M.pacotes, ...M.correcoes, ...M.anteriores_a_cadeia].map(p => [p.arquivo, p.sha256]));
let ruim = 0;
for (const nome of fs.readdirSync(L.RAIZ).filter(n => n.endsWith('.agenda.json')).sort()) {
  const sha = L.sha256Bytes(fs.readFileSync(path.join(L.RAIZ, nome)));
  if (!M.classificados.includes(nome)) { ruim++; console.log('NÃO CLASSIFICADO: ' + nome + ' (' + sha.slice(0, 12) + '): inclua em equipe/canonico/gerar-manifesto.cjs e status-pacotes.json'); }
  else if (conhecidos.get(nome) !== sha) { ruim++; console.log('SHA-256 DIFERENTE do manifesto: ' + nome + ' (' + sha.slice(0, 12) + ' x ' + String(conhecidos.get(nome)).slice(0, 12) + ')'); }
}
console.log(ruim ? ruim + ' arquivo(s) da raiz fora do manifesto' : 'Todos os ' + M.classificados.length + ' arquivos da raiz estão classificados no manifesto, com o SHA-256 conferido');
process.exit(ruim ? 1 : 0);
