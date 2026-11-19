'use strict';
// Prepara a pasta servida pelo servidor.py para o teste no Chrome (catalogo.js):
//   prof-291.html     o professor.html do pacote 1.12.291 (1.12.288 + as 3 correções de exercícios), montado pelo gerador;
//   prof-288.html     o professor.html do 1.12.288 (para comparar);
//   prof-sem03.html   o 1.12.288 + só as correções 01 e 02 (para mostrar o que a 03 muda);
//   dialogo.html      a casca de teste (iframe), a mesma do teste das janelas como página.
// uso: node preparar.cjs <1.12.288.agenda.json> <01.agenda.json> <02.agenda.json> <03.agenda.json> <pasta-de-saida>
const fs = require('node:fs'), path = require('node:path');
const generator = require('../../../../tools/gerar-correcoes-exercicios-1.12.291.cjs');

const [, , sourceFile, p01, p02, p03, outDir] = process.argv;
if (!sourceFile || !p01 || !p02 || !p03 || !outDir) {
  console.error('uso: node preparar.cjs <1.12.288.agenda.json> <01.agenda.json> <02.agenda.json> <03.agenda.json> <pasta-de-saida>');
  process.exit(2);
}
const {source, patches} = generator.loadInputs(sourceFile, [p01, p02, p03]);
const pack = generator.makeUpdate(source, patches);
fs.mkdirSync(outDir, {recursive: true});
const write = (name, text) => fs.writeFileSync(path.join(outDir, name), text);
write('prof-291.html', pack.files['professor.html']);
write('prof-288.html', source.files['professor.html']);
const withTwo = patches.slice(0, 2).reduce((files, patch) => generator.applyPatch(files, patch), source.files);
write('prof-sem03.html', withTwo['professor.html']);
fs.copyFileSync(path.join(__dirname, '../janelas-pagina/dialogo.html'), path.join(outDir, 'dialogo.html'));
console.log('prof-291.html, prof-288.html, prof-sem03.html e dialogo.html em ' + path.resolve(outDir));
