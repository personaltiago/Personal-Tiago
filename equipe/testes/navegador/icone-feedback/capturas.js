'use strict';
// Capturas para olhar a olho (nada é conferido aqui, quem confere é funcional.js): o botão do feedback ao lado do WhatsApp e do sino do
// aplicativo, em cada cor de destaque que o aplicativo oferece (8 cores e o tema preto), no escuro e no claro; os 19 desenhos no topo, todos
// na mesma cor, para comparar o tamanho entre os vizinhos; a linha "Ícone do feedback" em Meu perfil fechada e o painel aberto em algumas
// cores; a tela estreita (320 px) e a janela "Como foi hoje?" aberta pelo botão do topo.
// As escolhas são feitas como o aluno faz: toque de verdade na linha do Perfil e depois num ícone da grade.
// Ao lado de cada captura do Início fica um .json com o retângulo de cada botão do topo, para a montagem recortar sem número chutado.
// uso: PORTA=8790 SAIDA=saida node capturas.js <pagina-294.html> <pagina-292.html> [pasta-dos-icones]
const fs = require('node:fs'), path = require('node:path');
const {abrir, cenario, sleep, SAIDA} = require('./aluno.js');

const [, , nova, antiga, pastaIcones = path.join(__dirname, '..', '..', '..', '..', 'tools', 'icones-feedback-294')] = process.argv;
if (!nova || !antiga) { console.error('uso: node capturas.js <pagina-294.html> <pagina-292.html> [pasta-dos-icones]'); process.exit(2); }

const ICONES = JSON.parse(fs.readFileSync(path.join(pastaIcones, 'icones.json'), 'utf8')).icones;
// As 8 cores de destaque do aplicativo ("Cores personalizadas") e o tema preto (que grava a cor cinza-azulada do tema).
const CORES = [['rosa', '#f52283'], ['vermelho', '#f0444a'], ['laranja', '#ff942e'], ['amarelo', '#ffd43d'], ['verde', '#00d98d'], ['ciano', '#06d0d2'], ['azul', '#138cff'], ['roxo', '#8f35df'], ['preto', '#b6bec7']];
const SEMENTE = {pendentes: 2, respondidos: 1};
const NOME = 'Jéssica Silva';

(async () => {
  const c = await abrir(nova), d = await abrir(antiga);
  const ir = async (cc, tela) => { await cc.evaluate("route('" + tela + "')"); await sleep(450); };
  // Grava a imagem e um .json com a faixa dos botões do topo (o retângulo de cada um), para recortar na montagem.
  const foto = async (cc, nome, extra = {}) => {
    await cc.captura(nome);
    const m = await cc.t('medir');
    fs.writeFileSync(path.join(SAIDA, nome.replace(/\.png$/, '.json')), JSON.stringify({largura: m.largura, topo: m.topo, h1: m.h1, acoes: m.acoes, diaria: m.diaria, filhos: m.filhos, ...extra}));
  };
  // Captura do Perfil com o painel aberto; o .json guarda onde o painel está na tela, para a montagem recortar só ele.
  const fotoPainel = async (cc, nome) => {
    await cc.captura(nome);
    const p = await cc.evaluate("(()=>{const b=document.getElementById('apFeedbackIconPanel').getBoundingClientRect();return JSON.stringify({y:+b.top.toFixed(2),b:+b.bottom.toFixed(2),x:+b.left.toFixed(2),r:+b.right.toFixed(2)})})()");
    fs.writeFileSync(path.join(SAIDA, nome.replace(/\.png$/, '.json')), JSON.stringify({largura: 390, painel: JSON.parse(p)}));
  };
  // Rola a linha do Perfil para o meio da tela e toca nela (abre ou fecha o painel).
  const tocarLinha = async () => { await c.evaluate("document.getElementById('apFeedbackIconOpen').scrollIntoView({block:'center'})"); await sleep(250); await c.tocar('#apFeedbackIconOpen'); await sleep(450); };
  const painelAberto = async () => !(await c.t('perfilIcone')).painel.oculto;
  const abrirPainel = async () => { await ir(c, 'profile'); if (!(await painelAberto())) await tocarLinha(); };
  const verPainel = async () => { await c.evaluate("document.getElementById('apFeedbackIconPanel').scrollIntoView({block:'start'})"); await sleep(350); };
  // Volta ao ícone padrão (sem escolha guardada), como uma conta que nunca escolheu.
  const padrao = async () => { await c.t('valorBruto', null); await c.recarregar(); };
  try {
    const base = {nome: NOME};

    // 1) antes (292) e depois (294, ícone padrão), rosa, escuro
    await cenario(d, base, SEMENTE); await foto(d, '01-antes-1.12.292.png');
    await cenario(c, base, SEMENTE); await padrao(); await cenario(c, base, SEMENTE);
    await foto(c, '02-depois-padrao.png');

    // 2) o Perfil: linha fechada, painel aberto no padrão, painel com um ícone escolhido
    await ir(c, 'profile');
    await c.evaluate("document.getElementById('apFeedbackIconOpen').scrollIntoView({block:'center'})"); await sleep(300);
    await c.captura('03-perfil-fechado.png');
    await tocarLinha(); await verPainel();
    await c.captura('04-perfil-aberto-padrao.png');
    await c.escolher('megafone'); await sleep(350); await verPainel();
    await c.captura('05-perfil-aberto-escolhido.png');

    // 3) os 19 desenhos no topo do Início, todos em rosa e escuro (toque de verdade na grade)
    for (const [ordem, ic] of ICONES.entries()) {
      await abrirPainel();
      await c.escolher(ic.id); await sleep(300);
      await ir(c, 'home');
      await foto(c, '10-topo-' + ic.id + '.png', {id: ic.id, nome: ic.nome, ordem});
    }

    // 4) o ícone padrão em cada cor do aplicativo, escuro e claro (a cor vem do aplicativo, não do ícone)
    await padrao();
    for (const modo of ['escuro', 'claro']) {
      for (const [nome, cor] of CORES) {
        await cenario(c, {...base, cor, modo, tema: nome === 'preto' ? 'preto' : undefined}, SEMENTE);
        await foto(c, '20-cor-' + nome + '-' + modo + '.png', {cor: nome, hex: cor, modo});
      }
    }

    // 5) o painel aberto em algumas cores (escolhido um ícone de cada vez, para a seleção aparecer em cores diferentes)
    for (const [arq, nome, modo, id] of [['30-painel-azul-escuro.png', 'azul', 'escuro', 'coracao'], ['31-painel-amarelo-claro.png', 'amarelo', 'claro', 'balao-estrela'], ['32-painel-roxo-claro.png', 'roxo', 'claro', 'carinha'], ['33-painel-verde-escuro.png', 'verde', 'escuro', 'selo']]) {
      const cor = CORES.find(x => x[0] === nome)[1];
      await cenario(c, {...base, cor, modo}, SEMENTE);
      await abrirPainel();
      await c.escolher(id); await sleep(350); await verPainel();
      await fotoPainel(c, arq);
    }

    // 6) a janela do feedback aberta pelo botão do topo, com o último ícone escolhido (rosa, escuro)
    await cenario(c, base, SEMENTE); await ir(c, 'home');
    await c.tocar('#apFeedbackBell'); await sleep(600);
    await c.captura('40-janela-aberta.png');
    await c.evaluate('APFeedbackStudent.close()'); await sleep(300);

    // 7) tela estreita (320 px), nome comprido: painel aberto e topo, com o padrão escolhido de novo
    await c.viewport(320, 700);
    await cenario(c, {nome: 'Maximiliano Costa'}, SEMENTE);
    await abrirPainel();
    await c.escolher('padrao'); await sleep(350); await verPainel();
    await c.captura('41-320-perfil-aberto.png');
    await ir(c, 'home'); await foto(c, '42-320-topo.png');
    await c.viewport(390, 844);
    console.log('capturas gravadas');
  } finally { c.close(); d.close(); }
})().catch(e => { console.error(e); process.exit(1); });
