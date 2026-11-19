'use strict';
// "Teste do teste" do sino do feedback (1.12.292) no Chrome real: estraga a página do 292 de dez jeitos, um de cada vez, e roda o teste
// funcional (funcional.js, com PARAR=1) em cada uma. Cada defeito precisa ser PEGO (o teste falha); se algum passar, o teste não protege
// aquele comportamento. A página sem defeito passa nos 149 itens (rode funcional.js nela para ver).
// Defeito equivalente (de propósito fora da lista): tirar o `!!t.uid()&&` de `const show=!!t.uid()&&count>0`. A página passa nos 149 itens com
// ele tirado, e é de se esperar: APFeedbackSync.pending() já devolve vazio sem conta de aluno (visible() = conta ? lista : []) e o objeto é
// congelado (Object.freeze), então nenhuma tela alcançável tem pendências sem conta. A guarda fica como segurança, caso pending() mude um dia.
// Variável SO=nome1,nome2 roda só esses defeitos.
// uso: PORTA=8790 node mutantes.cjs <pasta-servida> [index-292.html] [index-291.html]
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {spawnSync} = require('node:child_process');

const [, , pasta, nova = 'index-292.html', antiga = 'index-291.html'] = process.argv;
if (!pasta) { console.error('uso: node mutantes.cjs <pasta-servida> [index-292.html] [index-291.html]'); process.exit(2); }

// [nome, o que o defeito faz, texto original (precisa existir UMA vez na página), texto defeituoso]
const MUTANTES = [
  ['sem-chamada', 'a tela do aluno nunca atualiza o sino', ',feedbackBell(e)}', '}'],
  ['aparece-com-zero', 'o sino aparece mesmo sem feedback pendente', 'const show=!!t.uid()&&count>0;', 'const show=!!t.uid();'],
  ['sem-classe-do-topo', 'o topo não ganha a classe do sino (o nome e os ícones ficam sem o ajuste de espaço)', 'actions.parentNode.classList.toggle("ap-feedback-bell-on",show);', ''],
  ['fim-da-fila', 'o sino vai para o fim da fila (depois do avatar), não antes do sino de avisos', 'actions.insertBefore(bell,next&&next.parentNode===actions?next:null)', 'actions.insertBefore(bell,null)'],
  ['sem-clique', 'tocar no sino não faz nada', 'bell.onclick=()=>m()', 'bell.onclick=null'],
  ['clique-com-evento', 'o toque passa o evento para a janela (o jeito errado de ligar o clique)', 'bell.onclick=()=>m()', 'bell.onclick=m'],
  ['numero-errado', 'o número do sino é o das pendências mais um', 'textContent=String(count)', 'textContent=String(count+1)'],
  ['rotulo-no-plural', 'o rótulo de acessibilidade diz "1 pendentes"', '1===count?" pendente":" pendentes"', '0===count?" pendente":" pendentes"'],
  ['tinta-sempre-branca', 'o número é sempre branco, mesmo sobre cor clara', 'return 1.05/(lum(hex)+.05)>=3?"#fff":"#0a151e"', 'return "#fff"'],
  ['css-sem-oculto', 'o sino escondido continua aparecendo (falta a regra [hidden])', '.ap-feedback-bell[hidden]{display:none!important}', '']
];

const html = fs.readFileSync(path.join(pasta, nova), 'utf8');
const conta = (texto, trecho) => texto.split(trecho).length - 1;
const bloco = (texto, id) => { const a = texto.indexOf('<script id="' + id + '">'); return texto.slice(a + id.length + 14, texto.indexOf('</script>', a)); };

const so = process.env.SO ? process.env.SO.split(',') : null;
if (so && so.some(n => !MUTANTES.some(m => m[0] === n))) { console.error('SO tem nome que não existe: ' + so.join(',')); process.exit(2); }
const lista = so ? MUTANTES.filter(m => so.includes(m[0])) : MUTANTES;
let pegos = 0, soltos = [];
for (const [nome, defeito, original, estragado] of lista) {
  if (conta(html, original) !== 1) { console.error('O trecho do defeito "' + nome + '" aparece ' + conta(html, original) + ' vez(es) na página (precisa ser 1)'); process.exit(2); }
  const pagina = html.replace(original, () => estragado);
  new vm.Script(bloco(pagina, 'ap-feedback-student')); // o defeito não pode ser erro de sintaxe: tem que mudar o comportamento, não derrubar o bloco
  const arquivo = 'mutante-' + nome + '.html';
  fs.writeFileSync(path.join(pasta, arquivo), pagina);
  const r = spawnSync(process.execPath, [path.join(__dirname, 'funcional.js'), arquivo, antiga], {env: {...process.env, PARAR: '1'}, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 900000});
  const saida = (r.stdout || '') + (r.stderr || '');
  const falha = saida.split('\n').find(l => l.startsWith('FALHA'));
  const feitos = saida.split('\n').filter(l => l.startsWith('OK  ')).length;
  if (r.status !== 0 && falha) { pegos++; console.log('PEGO   ' + nome + ' — ' + defeito + '\n         primeira falha (após ' + feitos + ' itens ok): ' + falha.slice(0, 190)); }
  else { soltos.push(nome); console.log('SOLTO  ' + nome + ' — ' + defeito + ' (o teste NÃO percebeu; status ' + r.status + ')'); }
  fs.rmSync(path.join(pasta, arquivo), {force: true});
}
console.log('\nSino do feedback · mutantes no Chrome: ' + pegos + ' de ' + lista.length + ' defeitos pegos' + (soltos.length ? '; SOLTOS: ' + soltos.join(', ') : ''));
process.exit(soltos.length ? 1 : 0);
