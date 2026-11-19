'use strict';
// Prepara a pasta servida pelo servidor.py para os testes no Chrome do sino do feedback (1.12.292):
//   index-291.html / index-292.html            a tela do ALUNO antes e depois (as páginas de dentro dos dois pacotes);
//   professor-291.html / professor-292.html    a tela do PROFESSOR antes e depois (no 292 muda só um trecho de estilo, sem efeito ali);
//   dialogo.html                               a casca de teste (iframe) do teste das janelas, que abre as páginas do professor.
// O 1.12.291 é achado (ou refeito pelo gerador) e sempre conferido pelo SHA-256; o 1.12.292 sai do gerador, como no pacote entregue.
// uso: node preparar.cjs <pasta-de-saida> [pacote-1.12.291.agenda.json]
const fs = require('node:fs'), path = require('node:path');
const generator = require('../../../../tools/gerar-sininho-feedback-1.12.292.cjs');
const {locate291} = require('../../pacote-291.cjs');

const [, , outDir, given] = process.argv;
if (!outDir) {
  console.error('uso: node preparar.cjs <pasta-de-saida> [pacote-1.12.291.agenda.json]');
  process.exit(2);
}
fs.mkdirSync(outDir, {recursive: true});
const source = generator.loadSource(given || locate291(path.join(path.resolve(outDir), '_entradas')));
const pack = generator.makeUpdate(source);
const write = (name, text) => fs.writeFileSync(path.join(outDir, name), text);
write('index-291.html', source.files['index.html']);
write('index-292.html', pack.files['index.html']);
write('professor-291.html', source.files['professor.html']);
write('professor-292.html', pack.files['professor.html']);
fs.copyFileSync(path.join(__dirname, '../janelas-pagina/dialogo.html'), path.join(outDir, 'dialogo.html'));
console.log('index-291/292.html, professor-291/292.html e dialogo.html em ' + path.resolve(outDir));
