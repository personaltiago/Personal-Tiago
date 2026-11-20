'use strict';
// Prepara a pasta servida pelo servidor.py para os testes no Chrome do ícone do feedback (1.12.294):
//   index-291.html / index-292.html / index-294.html    a tela do ALUNO nos três pacotes (as páginas de dentro deles);
//   professor-292.html / professor-294.html             a tela do PROFESSOR antes e depois (no 294 muda só um trecho de estilo, sem efeito ali);
//   dialogo.html                                        a casca de teste (iframe) do teste das janelas, que abre as páginas do professor.
// O 1.12.292 é achado (ou refeito pelo gerador do 292, a partir do 291) e sempre conferido pelo SHA-256; o 1.12.294 sai do gerador, como no
// pacote entregue. O 1.12.291 só entra como base de comparação do topo (geometria.js e o funcional.js do 292 comparam com ele).
// uso: node preparar.cjs <pasta-de-saida> [pacote-1.12.292.agenda.json]
const fs = require('node:fs'), path = require('node:path');
const generator = require('../../../../tools/gerar-icone-feedback-1.12.294.cjs');
const generator292 = require('../../../../tools/gerar-sininho-feedback-1.12.292.cjs');
const {locate291} = require('../../pacote-291.cjs');
const {locate292} = require('../../pacote-292.cjs');

const [, , outDir, given] = process.argv;
if (!outDir) {
  console.error('uso: node preparar.cjs <pasta-de-saida> [pacote-1.12.292.agenda.json]');
  process.exit(2);
}
fs.mkdirSync(outDir, {recursive: true});
const inputs = path.join(path.resolve(outDir), '_entradas');
const source = generator.loadSource(given || locate292(inputs));   // o 292 entregue (SHA-256 conferido)
const pack = generator.makeUpdate(source);                          // o 294, como no pacote entregue
const source291 = generator292.loadSource(locate291(path.join(inputs, 'p291')));
const write = (name, text) => fs.writeFileSync(path.join(outDir, name), text);
write('index-291.html', source291.files['index.html']);
write('index-292.html', source.files['index.html']);
write('index-294.html', pack.files['index.html']);
write('professor-292.html', source.files['professor.html']);
write('professor-294.html', pack.files['professor.html']);
fs.copyFileSync(path.join(__dirname, '../janelas-pagina/dialogo.html'), path.join(outDir, 'dialogo.html'));
console.log('index-291/292/294.html, professor-292/294.html e dialogo.html em ' + path.resolve(outDir));
