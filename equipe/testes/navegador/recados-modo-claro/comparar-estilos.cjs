'use strict';
// Compara duas execuções do cenário com view=dump (a assinatura do estilo computado de TODOS os elementos da tela) e lista os
// elementos cujo estilo mudou entre a página antiga e a nova.
//   node comparar-estilos.cjs <saida-antes.txt> <saida-depois.txt>
// Sai com código 0 se a comparação foi feita (a quantidade de diferenças é só informada); 1 se algum arquivo não serve.
const fs = require('node:fs');

function load(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (problem) { console.error('não consegui ler ' + file + ': ' + problem.message); process.exit(1); }
  const head = text.indexOf('AUDIT ROWS ');
  if (head < 0) { console.error('sem linhas de assinatura em ' + file + ' (rodou com view=dump e terminou?)'); process.exit(1); }
  const rows = new Map();
  for (const line of text.slice(head + 'AUDIT ROWS '.length).split('\n')) {
    const m = line.match(/^(\d+)\|([^|]*)\|([0-9a-f]+)$/);
    if (m) rows.set(+m[1], {tag: m[2], hash: m[3]});
    else if (line.startsWith('AUDIT ')) break;
  }
  return rows;
}

const [, , before, after] = process.argv;
if (!before || !after) { console.error('Uso: node comparar-estilos.cjs <saida-antes.txt> <saida-depois.txt>'); process.exit(1); }
const a = load(before), b = load(after);
if (a.size !== b.size || a.size < 1000) { console.error('as duas telas têm tamanhos diferentes ou pequenos demais: ' + a.size + ' x ' + b.size); process.exit(1); }
const changed = [];
for (const [i, x] of a) {
  const y = b.get(i);
  if (!y || y.tag !== x.tag) changed.push(i + ':ESTRUTURA');
  else if (y.hash !== x.hash) changed.push(i + ':' + x.tag);
}
console.log('elementos comparados: ' + a.size + ' | com estilo diferente: ' + changed.length + (changed.length ? ' -> ' + changed.join(' ') : ''));
