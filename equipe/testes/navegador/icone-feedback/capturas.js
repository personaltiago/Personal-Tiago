'use strict';
// Capturas para olhar a olho (nada é conferido aqui, quem confere é funcional.js): o topo do aluno no 1.12.292 (balão simples) e no 1.12.293
// com o ícone padrão (selo roxo) e com várias escolhas; a linha "Ícone do feedback" em Meu perfil fechada e aberta (grade de 19 ícones, com
// um já escolhido); o modo claro; a tela estreita (320 px) e a janela "Como foi hoje?" aberta pelo botão do topo com um ícone escolhido.
// As escolhas são feitas como o aluno faz: toque de verdade na linha do Perfil e depois num ícone da grade.
// uso: PORTA=8790 SAIDA=saida node capturas.js <pagina-293.html> <pagina-292.html>
const {abrir, cenario, sleep} = require('./aluno.js');

const [, , nova, antiga] = process.argv;
if (!nova || !antiga) { console.error('uso: node capturas.js <pagina-293.html> <pagina-292.html>'); process.exit(2); }

const ESCOLHAS = ['balao-estrela', 'megafone', 'carinha', 'coracao', 'selo', 'joinha'];

(async () => {
  const c = await abrir(nova), d = await abrir(antiga);
  const ir = async (cc, tela) => { await cc.evaluate("route('" + tela + "')"); await sleep(450); };
  // Rola a linha do Perfil para o meio da tela e toca nela (abre ou fecha o painel).
  const tocarLinha = async () => { await c.evaluate("document.getElementById('apFeedbackIconOpen').scrollIntoView({block:'center'})"); await sleep(250); await c.tocar('#apFeedbackIconOpen'); await sleep(450); };
  const painelAberto = async () => !(await c.t('perfilIcone')).painel.oculto;
  try {
    const base = {nome: 'Jéssica Silva'};
    const semente = {pendentes: 2, respondidos: 1};

    // 1) antes (292) e depois (293, ícone padrão), escuro
    await cenario(d, base, semente); await d.captura('01-antes-1.12.292.png');
    await cenario(c, base, semente); await c.t('valorBruto', null); await c.recarregar(); await cenario(c, base, semente);
    await c.captura('02-depois-padrao.png');

    // 2) o Perfil: linha fechada e painel aberto no padrão
    await ir(c, 'profile');
    await c.evaluate("document.getElementById('apFeedbackIconOpen').scrollIntoView({block:'center'})"); await sleep(300);
    await c.captura('03-perfil-fechado.png');
    await tocarLinha();
    await c.evaluate("document.getElementById('apFeedbackIconPanel').scrollIntoView({block:'start'})"); await sleep(350);
    await c.captura('04-perfil-aberto-padrao.png');

    // 3) várias escolhas (toque de verdade), cada uma com o topo do Início logo depois
    for (const id of ESCOLHAS) {
      await ir(c, 'profile');
      if (!(await painelAberto())) await tocarLinha();
      await c.escolher(id); await sleep(350);
      if (id === 'megafone') { await c.evaluate("document.getElementById('apFeedbackIconPanel').scrollIntoView({block:'start'})"); await sleep(350); await c.captura('05-perfil-aberto-escolhido.png'); }
      await ir(c, 'home');
      await c.captura('06-topo-' + id + '.png');
    }

    // 4) a janela do feedback aberta pelo botão do topo, com o último ícone escolhido
    await c.tocar('#apFeedbackBell'); await sleep(600);
    await c.captura('07-janela-aberta.png');
    await c.evaluate('APFeedbackStudent.close()'); await sleep(300);

    // 5) modo claro: topo e painel (ícone escolhido: balão com estrela)
    await cenario(c, {...base, modo: 'claro'}, semente);
    await ir(c, 'profile');
    if (!(await painelAberto())) await tocarLinha();
    await c.escolher('balao-estrela'); await sleep(350);
    await c.evaluate("document.getElementById('apFeedbackIconPanel').scrollIntoView({block:'start'})"); await sleep(350);
    await c.captura('08-claro-perfil-aberto.png');
    await ir(c, 'home'); await c.captura('09-claro-topo.png');

    // 6) tela estreita (320 px), letra média e nome comprido: painel aberto com o padrão escolhido de novo
    await c.viewport(320, 700);
    await cenario(c, {nome: 'Maximiliano Costa'}, semente);
    await ir(c, 'profile');
    if (!(await painelAberto())) await tocarLinha();
    await c.escolher('padrao'); await sleep(350);
    await c.evaluate("document.getElementById('apFeedbackIconPanel').scrollIntoView({block:'start'})"); await sleep(350);
    await c.captura('10-320-perfil-aberto.png');
    await ir(c, 'home'); await c.captura('11-320-topo.png');
    await c.viewport(390, 844);
    console.log('capturas gravadas');
  } finally { c.close(); d.close(); }
})().catch(e => { console.error(e); process.exit(1); });
