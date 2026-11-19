'use strict';
// Capturas para olhar a olho (nada é conferido aqui, quem confere é funcional.js e geometria.js): o topo do aluno SEM o sino (1.12.291) e
// COM o sino (1.12.292), com 1 e com 3 pendentes, no modo claro, em 320 px com nome comprido (os ícones descem para a linha de baixo),
// em várias cores de destaque e a janela do feedback aberta ao tocar no sino. O pet não aparece neste teste (ele precisa do aplicativo
// inteiro): no lugar dele fica a barra do feedback que a página desenha quando o pet não está na tela.
// uso: PORTA=8790 SAIDA=saida node capturas.js <pagina-292.html> <pagina-291.html>
const {abrir, cenario, sleep} = require('./aluno.js');

const [, , nova, antiga] = process.argv;
if (!nova || !antiga) { console.error('uso: node capturas.js <pagina-292.html> <pagina-291.html>'); process.exit(2); }

(async () => {
  const c = await abrir(nova), d = await abrir(antiga);
  try {
    const base = {nome: 'Jéssica Silva'};
    await cenario(d, base, {pendentes: 1, respondidos: 2}); await d.captura('01-antes-1.12.291.png');
    await cenario(c, base, {pendentes: 1, respondidos: 2}); await c.captura('02-depois-1-pendente.png');
    await cenario(c, base, {pendentes: 3, respondidos: 1}); await c.captura('03-depois-3-pendentes.png');
    await cenario(d, {...base, modo: 'claro'}, {pendentes: 2, respondidos: 1}); await d.captura('04a-antes-claro.png');
    await cenario(c, {...base, modo: 'claro'}, {pendentes: 2, respondidos: 1}); await c.captura('04b-depois-claro.png');
    for (const modo of ['escuro', 'claro']) {
      await c.viewport(320, 700);
      await cenario(c, {nome: 'Maximiliano Costa', modo}, {pendentes: 2, respondidos: 1}); await c.captura('05-depois-320-nome-longo-' + modo + '.png');
      await c.viewport(390, 844);
    }
    const cores = [['rosa', 'rosa', null], ['azul', 'azul', null], ['roxo', 'roxo', null], ['verde', 'verde', null], ['preto', 'preto', null], ['limao', 'rosa', '#b6ff26']];
    for (const [rotulo, tema, cor] of cores) {
      await cenario(c, {...base, tema, ...(cor ? {cor} : {})}, {pendentes: 2, respondidos: 1}); await c.captura('06-cor-' + rotulo + '.png');
    }
    await cenario(c, base, {pendentes: 2, respondidos: 1});
    await c.tocar('#apFeedbackBell'); await sleep(600);
    await c.captura('07-janela-aberta.png');
    console.log('capturas gravadas');
  } finally { c.close(); d.close(); }
})().catch(e => { console.error(e); process.exit(1); });
