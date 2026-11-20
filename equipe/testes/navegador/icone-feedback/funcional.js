'use strict';
// Teste funcional do ícone do feedback personalizável (1.12.294) no Chrome real, com toque e teclado de verdade, na página do aluno de dentro
// do pacote. Compara com a página do 1.12.292 (a anterior) onde o resultado tem de ser igual. O que o teste prova:
//  A  sem escolha o botão do topo mostra o padrão (o balão do 292, o MESMO caminho SVG, 27 px dentro do botão 44×44) e só o atributo
//     data-icon difere do botão do 292
//  B  a linha "Ícone do feedback" entra em Meu perfil logo depois de Configurações, com ícone do tamanho (27 px) e da cor das vizinhas
//  C  abrir e fechar o painel (toque e teclado), 19 opções na ordem do manifesto, o padrão marcado, nomes e desenhos iguais ao manifesto
//  D  cada uma das 19 escolhas: botão do topo (desenho, gravação por conta, rádio, status, linha, evento, rótulo e número) E o tamanho:
//     27 px no botão 44×44, caixa e massa do desenho na faixa do balão do 292, centrado como o WhatsApp, pouco coberto pelo selo do número
//  E  a escolha sobrevive a fechar e abrir o aplicativo (recarregar a página) · F é por conta · G sem pendência o topo continua igual
//  H nada é baixado nem desenhado como imagem: só caminhos SVG · I falha ao gravar avisa e não troca nada · J valor gravado estranho cai no padrão
//  K a rotina do Perfil recria a linha sem duplicar · L teclado: setas trocam, Enter abre, contorno de foco legível também no modo claro
//  M painel do Perfil em cada cor de destaque (8 cores do aplicativo + tema preto), claro e escuro: texto legível, linha com as cores das
//    vizinhas, marca de visto, quadradinhos escuros e desenho com contraste de pelo menos 3:1 sobre eles
//  S COR: em cada cor de destaque, no escuro e no claro, o desenho do botão do topo tem a MESMA cor do WhatsApp e do sino ao lado e o da linha e
//    dos 19 da grade tem a cor dos ícones das outras linhas do Perfil (nada é de uma cor fixa, nem de roxo)
//  O a janela "Como foi hoje?" segue igual · R "reduzir movimento" do sistema: a rolagem ao abrir o painel deixa de ser suave
//  Q larguras de 320 a 430 e letra grande: grade sem estouro, alvos de toque ≥ 48 px, nada fora da tela
// uso: PORTA=8790 SAIDA=saida node funcional.js <pagina-294.html> <pagina-292.html> [pasta-dos-icones]
const fs = require('node:fs'), path = require('node:path');
const {abrir, cenario, suite, contraste, rgbHex, sleep} = require('./aluno.js');

const [, , nova, antiga, pastaIcones = path.join(__dirname, '..', '..', '..', '..', 'tools', 'icones-feedback-294')] = process.argv;
if (!nova || !antiga) { console.error('uso: node funcional.js <pagina-294.html> <pagina-292.html> [pasta-dos-icones]'); process.exit(2); }
const S = suite('Ícone do feedback · funcional');
const t = S.t;

const manifesto = JSON.parse(fs.readFileSync(path.join(pastaIcones, 'icones.json'), 'utf8')).icones;
const IDS = manifesto.map(i => i.id);
const NOME = Object.fromEntries(manifesto.map(i => [i.id, i.nome]));
const DESENHO = Object.fromEntries(manifesto.map(i => [i.id, i.d]));
const UID_A = 'uidAlunoTeste123', UID_B = 'uidAlunoBeatriz456';
const CHAVE = uid => 'agenda_student_v2_' + uid + ':agenda_demo_feedback_icon';
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const daConta = (lista, uid) => lista.filter(([k]) => k === CHAVE(uid));
const SEMENTE = {pendentes: 2, respondidos: 1};
const FALHA_GRAVAR = 'Não foi possível guardar o ícone neste aparelho.';
// As 8 cores de destaque que o aplicativo oferece em "Cores personalizadas" e a do tema "Preto" (chooseTheme grava PALETTES.preto como cor).
const CORES = {rosa: '#f52283', vermelho: '#f0444a', laranja: '#ff942e', amarelo: '#ffd43d', verde: '#00d98d', ciano: '#06d0d2', azul: '#138cff', roxo: '#8f35df', 'tema preto': '#b6bec7'};
const rgb = hex => 'rgb(' + [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ') + ')';
const luz = hex => { const c = [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const f2 = n => (Math.round(n * 100) / 100).toString();

(async () => {
  const c = await abrir(nova), d = await abrir(antiga);
  const ir = async (cc, tela) => { await cc.evaluate("route('" + tela + "')"); await sleep(450); };
  // Abre o painel do Perfil (se ainda estiver fechado) com toque de verdade na linha.
  const abrirPainel = async () => {
    await ir(c, 'profile');
    if ((await c.t('perfilIcone')).painel.oculto) { await c.evaluate("document.getElementById('apFeedbackIconOpen').scrollIntoView({block:'center'})"); await sleep(200); await c.tocar('#apFeedbackIconOpen'); await sleep(450); }
  };
  try {
    // ---------------------------------------------------------------- A · padrão
    for (const cc of [c, d]) await cenario(cc, {nome: 'Jéssica Silva'}, SEMENTE);
    let s = await c.t('sinoIcone'), s292 = await d.t('sinoIcone');
    t('A sem escolha: botão do topo visível com o ícone padrão', !!s && s.visivel && !s.oculto && s.icone === 'padrao', s && {icone: s.icone, classe: s.classe});
    t('A o desenho do padrão é o balão do 292, o mesmo caminho SVG igual byte a byte (e é o primeiro do manifesto)', s.desenho.d === s292.desenho.d && s.desenho.d === DESENHO.padrao && s.desenho.regra === 'evenodd', {novo: s.desenho.d.slice(0, 60), antigo: s292.desenho.d.slice(0, 60)});
    t('A é um desenho vetorial só (1 svg, 1 caminho, nenhuma imagem), 27×27 dentro do botão 44×44, no mesmo retângulo do 292', s.imgs === 0 && s.svgs === 1 && s.paths === 1 && s.svg.w === 27 && s.svg.h === 27 && s.botao.w === 44 && s.botao.h === 44 && igual(s.svg, s292.svg) && igual(s.botao, s292.botao), {novo: [s.svg, s.botao, s.imgs, s.svgs, s.paths], antigo: [s292.svg, s292.botao]});
    t('A o desenho é cheio, sem contorno, e pintado com a cor do botão (currentColor), como no 292', s.desenho.traco === 'none' && s.desenho.preenchimento === s.corBotao && s.desenho.preenchimento === s292.desenho.preenchimento, {preenchimento: s.desenho.preenchimento, botao: s.corBotao, traco: s.desenho.traco});
    t('A rótulo e número como no 292: "Feedback do treino, 2 pendentes" e "2"', s.rotulo === 'Feedback do treino, 2 pendentes' && s.numero === '2' && s.rotulo === s292.rotulo && s.numero === s292.numero && s.titulo === s292.titulo, {rotulo: s.rotulo, numero: s.numero, titulo: s.titulo});
    const normalizar = html => html.replace(/ data-icon="[^"]*"/g, '');
    t('A o botão do 294, sem o atributo data-icon, é idêntico ao do 292 (só o desenho pode mudar)', normalizar(s.html) === s292.html, {a: normalizar(s.html).slice(0, 400), b: s292.html.slice(0, 400)});
    t('A abrir o Início não grava nada no aparelho (a escolha só é gravada quando o aluno toca num ícone)', (await c.t('guardado')).length === 0, await c.t('guardado'));
    const i294 = await c.t('instantaneo'), i292 = await d.t('instantaneo');
    t('A com pendências: o topo (sem o botão), o cartão do Início, a lista e o mascote são idênticos aos do 292', igual(i294, i292), Object.keys(i294).filter(k => !igual(i294[k], i292[k])));
    const V = await c.t('vizinhos'), T0 = await c.t('tinta');
    t('A medidas de referência no Início: WhatsApp e sino ao lado (24 px e 29 px de svg), balão do 292 com 27 px', !!V.whatsapp && !!V.sino && V.whatsapp.svg.w === 24 && V.sino.svg.w === 29 && s.svg.w === 27, {whatsapp: V.whatsapp && V.whatsapp.svg, sino: V.sino && V.sino.svg});
    console.log('     (referência) caixa do desenho em px: WhatsApp ' + V.whatsapp.tinta.w + '×' + V.whatsapp.tinta.h + ', sino ' + V.sino.tinta.w + '×' + V.sino.tinta.h + ', balão do 292 ' + s.tinta.w + '×' + s.tinta.h + '; massa do balão ' + T0.area + ' un², sob o número ' + f2(T0.fracao * 100) + ' %');

    // ---------------------------------------------------------------- B · linha no Perfil
    await ir(c, 'profile'); await ir(d, 'profile');
    let p = await c.t('perfilIcone'), p292 = await d.t('perfilIcone');
    t('B uma linha e um painel (sem duplicar)', p.linhas === 1 && p.paineis === 1, {linhas: p.linhas, paineis: p.paineis});
    t('B a linha vem logo depois de "Configurações" e o painel logo depois da linha', /^Configura/.test(p.antes || '') && p.painelDepoisDaLinha, {antes: p.antes, depois: p.depois, itens: p.itens});
    t('B o resto do Perfil não mudou (mesmas linhas, na mesma ordem, que no 292)', igual(p.itens.filter(x => x !== 'apFeedbackIconOpen' && x !== 'apFeedbackIconPanel'), p292.itens), {novo: p.itens, antigo: p292.itens});
    const L = p.linha;
    t('B a linha é um botão de verdade, fechado, ligado ao painel, com título e subtítulo', !!L && L.tag === 'BUTTON' && L.tipo === 'button' && L.expandido === 'false' && L.controla === 'apFeedbackIconPanel' && L.titulo === 'Ícone do feedback' && L.subtitulo === 'Escolha o ícone do aviso de feedback', L);
    t('B a linha está visível e mostra o ícone atual (o padrão) com 27×27, o tamanho dos ícones das outras linhas, e a seta', !L.oculta && L.visivel && L.icone === 'padrao' && L.desenho.d === DESENHO.padrao && L.svg.w === 27 && L.svg.h === 27 && !!L.vizinha && L.svg.w === L.vizinha.w && L.svg.h === L.vizinha.h && L.imgs === 0 && L.chevron, L && {icone: L.icone, svg: L.svg, vizinha: L.vizinha, imgs: L.imgs, chevron: L.chevron});
    t('B o ícone da linha tem a cor do ícone da linha vizinha (a cor de destaque do Perfil)', L.desenho.preenchimento === L.vizinha.cor && L.corIcone === L.vizinha.cor, {linha: L.desenho.preenchimento, vizinha: L.vizinha});
    const antes = (await c.evaluate("JSON.stringify((()=>{const b=document.getElementById('apFeedbackIconOpen').previousElementSibling.getBoundingClientRect();return {x:b.left,w:b.width,h:b.height}})())")), vizinha = JSON.parse(antes);
    t('B a linha tem a mesma largura e o mesmo recuo das outras (altura até 4 px de diferença)', Math.abs(L.retangulo.x - vizinha.x) < 0.6 && Math.abs(L.retangulo.w - vizinha.w) < 0.6 && Math.abs(L.retangulo.h - vizinha.h) <= 4, {linha: L.retangulo, vizinha});
    t('B o painel começa fechado e escondido', p.painel.oculto && !p.painel.visivel, p.painel);
    t('B no 292 a linha não existe (a página anterior não tem o recurso)', p292.linhas === 0 && p292.paineis === 0, p292);

    // ---------------------------------------------------------------- C · abrir e fechar, 19 opções
    await c.evaluate("document.getElementById('apFeedbackIconOpen').scrollIntoView({block:'center'})"); await sleep(250);
    await c.tocar('#apFeedbackIconOpen'); await sleep(500);
    p = await c.t('perfilIcone');
    t('C tocar na linha abre o painel: visível, aria-expanded=true e foco no painel', p.painel.visivel && !p.painel.oculto && p.linha.expandido === 'true' && p.painel.foco && p.painel.tabindex === -1, {painel: p.painel, expandido: p.linha.expandido});
    t('C o painel tem título, descrição e se identifica pelo título (aria-labelledby)', p.painel.titulo === 'Ícone do feedback' && /aparece no topo do Início/.test(p.painel.descricao || '') && p.painel.rotuladoPor === 'apFeedbackIconTitle', p.painel);
    t('C 19 opções, todas rádio do mesmo grupo, na ordem e com os nomes do manifesto', p.opcoes.length === 19 && igual(p.opcoes.map(o => o.valor), IDS) && p.opcoes.every(o => o.tipo === 'radio' && o.grupo === 'apFeedbackIcon' && o.nome === NOME[o.valor]), {valores: p.opcoes.map(o => o.valor)});
    t('C o grupo é um radiogroup rotulado pelo título', !!p.grupo && p.grupo.papel === 'radiogroup' && p.grupo.rotuladoPor === 'apFeedbackIconTitle', p.grupo);
    t('C só o padrão está marcado e o status diz qual é ("Escolhido: ' + NOME.padrao + '")', igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), ['padrao']) && p.status.texto === 'Escolhido: ' + NOME.padrao, {marcados: p.opcoes.filter(o => o.marcado).map(o => o.valor), status: p.status.texto});
    t('C o status é uma região viva educada (role=status, aria-live=polite) e está acima da grade', p.status.papel === 'status' && p.status.vivo === 'polite' && p.status.visivel && p.status.tag === 'DIV', p.status);
    t('C cada opção mostra o desenho do manifesto (19 de 19), cheio (evenodd), e nenhuma tem imagem', p.opcoes.every(o => o.desenho && o.desenho.d === DESENHO[o.valor] && o.desenho.regra === 'evenodd' && o.imgs === 0), p.opcoes.filter(o => !o.desenho || o.desenho.d !== DESENHO[o.valor] || o.imgs !== 0).map(o => o.valor));
    t('C cada opção é um quadrado de 52×52 com o desenho de 28×28 no centro', p.opcoes.every(o => o.retangulo.w === 52 && o.retangulo.h === 52 && o.svg.w === 28 && o.svg.h === 28 && Math.abs((o.svg.x + o.svg.w / 2) - (o.retangulo.x + o.retangulo.w / 2)) < 0.6 && Math.abs((o.svg.y + o.svg.h / 2) - (o.retangulo.y + o.retangulo.h / 2)) < 0.6), p.opcoes.filter(o => o.retangulo.w !== 52 || o.svg.w !== 28).map(o => [o.valor, o.retangulo.w, o.svg.w]));
    await c.tocar('#apFeedbackIconOpen'); await sleep(400);
    p = await c.t('perfilIcone');
    t('C tocar de novo na linha fecha o painel (aria-expanded=false, escondido)', p.painel.oculto && !p.painel.visivel && p.linha.expandido === 'false', {oculto: p.painel.oculto, expandido: p.linha.expandido});
    await c.tocar('#apFeedbackIconOpen'); await sleep(400);
    t('C e abre outra vez', (await c.t('perfilIcone')).painel.visivel);

    // ---------------------------------------------------------------- D · cada uma das 19 escolhas (inclui tamanho)
    await c.t('espiar');
    const tabela = [];
    for (const x of [...IDS.slice(1), 'padrao']) {
      await c.t('espiar');
      await c.escolher(x); await sleep(300);
      const pp = await c.t('perfilIcone'), g = await c.t('guardado'), ev = await c.t('eventos'), sn = await c.t('sinoIcone');
      const f = [];
      if (sn.icone !== x) f.push('botão do topo mostra ' + sn.icone);
      if (!sn.desenho || sn.desenho.d !== DESENHO[x] || sn.desenho.regra !== 'evenodd') f.push('o desenho do botão não é o do manifesto');
      if (sn.imgs !== 0 || sn.svgs !== 1 || sn.paths !== 1) f.push('estrutura do botão: ' + [sn.imgs, sn.svgs, sn.paths]);
      if (!igual(g, [[CHAVE(UID_A), x]])) f.push('gravação: ' + JSON.stringify(g));
      if (!igual(pp.opcoes.filter(o => o.marcado).map(o => o.valor), [x])) f.push('marcados: ' + pp.opcoes.filter(o => o.marcado).map(o => o.valor));
      if (pp.status.texto !== 'Escolhido: ' + NOME[x]) f.push('status: ' + pp.status.texto);
      if (pp.linha.icone !== x || !pp.linha.desenho || pp.linha.desenho.d !== DESENHO[x]) f.push('linha mostra ' + pp.linha.icone);
      if (!pp.linha.svg || pp.linha.svg.w !== 27 || pp.linha.svg.h !== 27) f.push('desenho da linha: ' + JSON.stringify(pp.linha.svg));
      if (!igual(ev, [x])) f.push('eventos: ' + JSON.stringify(ev));
      if (sn.rotulo !== 'Feedback do treino, 2 pendentes' || sn.numero !== '2') f.push('rótulo/número mudou: ' + sn.rotulo + ' / ' + sn.numero);
      if (!pp.painel.visivel) f.push('o painel fechou sozinho');
      // tamanho e lugar na tela do Início (o desenho só tem tamanho quando o Início está à vista)
      await ir(c, 'home');
      const sh = await c.t('sinoIcone'), tk = await c.t('tinta'), vz = await c.t('vizinhos');
      if (!sh.visivel || !igual(sh.botao, s292.botao)) f.push('botão ' + JSON.stringify(sh.botao) + ' em vez de ' + JSON.stringify(s292.botao));
      if (!igual(sh.svg, s292.svg)) f.push('o svg tem ' + sh.svg.w + '×' + sh.svg.h + ' em ' + sh.svg.x + ',' + sh.svg.y + ' em vez de ' + JSON.stringify(s292.svg));
      if (sh.desenho.preenchimento !== sh.corBotao || sh.desenho.preenchimento !== vz.whatsapp.preenchimento) f.push('cor do desenho ' + sh.desenho.preenchimento + ' (botão ' + sh.corBotao + ', WhatsApp ' + vz.whatsapp.preenchimento + ')');
      if (tk.caixa.w < 18 || tk.caixa.w > 21.2 || tk.caixa.h < 16 || tk.caixa.h > 21.2) f.push('caixa do desenho ' + tk.caixa.w + '×' + tk.caixa.h + ' fora da faixa do balão do 292 (largura 18 a 21,2; altura 16 a 21,2)');
      if (Math.abs(tk.caixa.x + tk.caixa.w / 2 - 12) > 0.8 || Math.abs(tk.caixa.y + tk.caixa.h / 2 - 12.2) > 0.9) f.push('desenho descentralizado: centro ' + f2(tk.caixa.x + tk.caixa.w / 2) + ',' + f2(tk.caixa.y + tk.caixa.h / 2));
      if (tk.area < 0.4 * T0.area || tk.area > 1.15 * T0.area) f.push('massa do desenho ' + tk.area + ' un² fora de 40 % a 115 % da do balão (' + T0.area + ')');
      if (tk.fracao > 0.08) f.push((tk.fracao * 100).toFixed(1) + ' % do desenho fica debaixo do número de pendentes (limite 8 %)');
      const lado = Math.max(sh.tinta.w, sh.tinta.h), ref = Math.max(vz.whatsapp.tinta.w, vz.whatsapp.tinta.h);
      if (lado < 0.9 * ref || lado > 1.25 * ref) f.push('o maior lado do desenho (' + lado + ' px) está fora de 90 % a 125 % do do WhatsApp (' + ref + ' px)');
      if (Math.abs(sh.tinta.cy - vz.whatsapp.tinta.cy) > 1.5 || Math.abs(sh.tinta.cy - vz.sino.tinta.cy) > 2.5) f.push('altura do centro: ' + sh.tinta.cy + ' (WhatsApp ' + vz.whatsapp.tinta.cy + ', sino ' + vz.sino.tinta.cy + ')');
      tabela.push([x, tk.caixa.w, tk.caixa.h, tk.area, Math.round(tk.fracao * 1000) / 10]);
      await ir(c, 'profile');
      t('D escolher "' + NOME[x] + '" (' + x + '): botão do topo, gravação, rádio, status, linha, evento, tamanho, lugar e cor', f.length === 0, f);
    }
    console.log('     (tabela) ícone · largura × altura da caixa (un) · massa (un²) · % sob o número');
    for (const r of tabela) console.log('       ' + r[0].padEnd(18) + String(r[1]).padStart(6) + ' ×' + String(r[2]).padStart(6) + '   ' + String(r[3]).padStart(6) + '   ' + String(r[4]).padStart(5) + ' %');
    t('D nenhuma das 19 escolhas deixou erro de JavaScript na página', c.erros().length === 0, c.erros());

    // ---------------------------------------------------------------- E · persistência
    await c.escolher('tres-estrelas'); await sleep(250);
    await c.recarregar();
    await cenario(c, {nome: 'Jéssica Silva'}, SEMENTE);
    s = await c.t('sinoIcone');
    t('E depois de fechar e abrir o aplicativo (página recarregada) o botão do topo continua com o ícone escolhido', s && s.icone === 'tres-estrelas' && s.desenho.d === DESENHO['tres-estrelas'], s && s.icone);
    await ir(c, 'profile'); p = await c.t('perfilIcone');
    t('E o Perfil também: rádio marcado, status e ícone da linha são o escolhido', igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), ['tres-estrelas']) && p.status.texto === 'Escolhido: ' + NOME['tres-estrelas'] && p.linha.icone === 'tres-estrelas' && p.linha.desenho.d === DESENHO['tres-estrelas'], {marcados: p.opcoes.filter(o => o.marcado).map(o => o.valor), status: p.status && p.status.texto});

    // ---------------------------------------------------------------- F · por conta
    await abrirPainel(); await c.escolher('joinha'); await sleep(250);
    await c.t('sair'); await sleep(350);
    s = await c.t('sinoIcone'); p = await c.t('perfilIcone');
    t('F sem aluno logado: o botão do topo some e a linha do Perfil fica escondida (painel fechado)', (!s || !s.visivel) && p.linha.oculta && p.painel.oculto && p.linha.expandido === 'false', {sino: s && s.visivel, linha: p.linha.oculta, painel: p.painel.oculto});
    await cenario(c, {uid: UID_B, nome: 'Beatriz Lima'}, SEMENTE);
    s = await c.t('sinoIcone');
    t('F outro aluno no mesmo aparelho começa com o padrão (a escolha do primeiro não vaza)', s.visivel && s.icone === 'padrao' && s.desenho.d === DESENHO.padrao, s.icone);
    await abrirPainel(); p = await c.t('perfilIcone');
    t('F e no Perfil dele só o padrão está marcado', igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), ['padrao']) && !p.linha.oculta, p.opcoes.filter(o => o.marcado).map(o => o.valor));
    await c.escolher('coracao'); await sleep(250);
    t('F as duas escolhas ficam em chaves diferentes, uma por aluno', igual((await c.t('guardado')).sort(), [[CHAVE(UID_A), 'joinha'], [CHAVE(UID_B), 'coracao']].sort()), await c.t('guardado'));
    await c.t('sair'); await sleep(250);
    await cenario(c, {uid: UID_A}, SEMENTE);
    t('F de volta ao primeiro aluno: o ícone dele (joinha) está lá', (await c.t('sinoIcone')).icone === 'joinha');
    await cenario(c, {uid: UID_B, nome: 'Beatriz Lima'}, SEMENTE);
    t('F de volta ao segundo aluno: o ícone dele (coracao) está lá', (await c.t('sinoIcone')).icone === 'coracao');
    await cenario(c, {uid: UID_A}, SEMENTE);

    // ---------------------------------------------------------------- G · sem pendência
    await cenario(c, {nome: 'Jéssica Silva'}, {pendentes: 0, respondidos: 2}); await cenario(d, {nome: 'Jéssica Silva'}, {pendentes: 0, respondidos: 2});
    s = await c.t('sinoIcone'); const e1 = await c.t('estado'), e0 = await d.t('estado');
    t('G sem feedback pendente o botão continua escondido, mesmo com um ícone escolhido (joinha)', (!s || !s.visivel) && e1.sino && e1.sino.oculto === true && !e1.classeTopo.includes('ap-feedback-bell-on'), {sino: e1.sino, classe: e1.classeTopo});
    const m1 = await c.t('medir'), m0 = await d.t('medir');
    t('G o topo mede exatamente o mesmo que no 292', igual({t: m1.topo, h: m1.h1, a: m1.acoes, f: m1.filhos}, {t: m0.topo, h: m0.h1, a: m0.acoes, f: m0.filhos}), {novo: m1.acoes, antigo: m0.acoes});
    t('G o resto do Início (cartão, lista, mascote) é igual ao do 292', igual(await c.t('instantaneo'), await d.t('instantaneo')));
    await cenario(c, {nome: 'Jéssica Silva'}, SEMENTE);

    // ---------------------------------------------------------------- H · nada é baixado, nada é imagem
    await ir(c, 'home');
    const r0 = await c.t('recursos');
    await abrirPainel();
    for (const x of ['megafone', 'selo', 'coracao']) { await c.escolher(x); await sleep(200); }
    await ir(c, 'home'); await sleep(200);
    t('H escolher ícones e voltar ao Início não baixa nenhum recurso (nenhuma imagem, nenhum pedido novo de rede)', (await c.t('recursos')) === r0, {antes: r0, depois: await c.t('recursos')});
    await ir(c, 'profile'); p = await c.t('perfilIcone'); s = await c.t('sinoIcone');
    t('H o botão do topo, a linha e a grade não têm nenhuma imagem (<img>): só caminhos SVG', s.imgs === 0 && p.linha.imgs === 0 && p.painel.imgs === 0 && p.opcoes.every(o => o.imgs === 0), {botao: s.imgs, linha: p.linha.imgs, painel: p.painel.imgs});
    t('H a página não tem nenhum arquivo de imagem do ícone embutido (nem WebP, nem PNG) no script do feedback', !/data:image\/(?:webp|png|jpeg|gif)/.test(await c.evaluate("document.getElementById('ap-feedback-student').textContent")), 'o script tem imagem embutida');
    await abrirPainel(); await c.escolher('carinha'); await sleep(350);
    s = await c.t('sinoIcone');
    t('H escolher outro ícone depois disso continua funcionando (carinha)', s.icone === 'carinha' && s.desenho.d === DESENHO.carinha, s.icone);

    // ---------------------------------------------------------------- I · falha ao gravar
    await c.t('falhaGravacao', true); await c.t('espiar');
    await c.escolher('selo'); await sleep(350);
    p = await c.t('perfilIcone'); s = await c.t('sinoIcone');
    t('I disco cheio: aparece "' + FALHA_GRAVAR + '"', p.status.texto === FALHA_GRAVAR && p.status.visivel, p.status.texto);
    t('I e nada muda: o botão do topo, o rádio marcado, a linha e a gravação ficam no ícone anterior (carinha)', s.icone === 'carinha' && s.desenho.d === DESENHO.carinha && igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), ['carinha']) && p.linha.icone === 'carinha' && igual(daConta(await c.t('guardado'), UID_A), [[CHAVE(UID_A), 'carinha']]), {sino: s.icone, marcados: p.opcoes.filter(o => o.marcado).map(o => o.valor)});
    t('I nenhum evento de troca de ícone foi disparado e não houve erro de JavaScript', (await c.t('eventos')).length === 0 && c.erros().length === 0, {eventos: await c.t('eventos'), erros: c.erros()});
    await c.t('falhaGravacao', false);
    await c.escolher('selo'); await sleep(300);
    p = await c.t('perfilIcone');
    t('I depois que o aparelho volta a gravar, a mesma escolha funciona e a mensagem de erro some', p.status.texto === 'Escolhido: ' + NOME.selo && (await c.t('sinoIcone')).icone === 'selo' && igual(await c.t('eventos'), ['selo']), p.status.texto);

    // ---------------------------------------------------------------- J · valor gravado estranho
    let estranhos = 0;
    for (const v of ['', 'lixo', '__proto__', 'constructor', 'toString', 'PADRAO', ' padrao', 'selo ', '19', '{"id":"joinha"}', '<img src=x onerror=alert(1)>', 'a'.repeat(5000)]) {
      await c.t('valorBruto', v); await ir(c, 'home');
      const sn = await c.t('sinoIcone'); await ir(c, 'profile'); const pp = await c.t('perfilIcone');
      const ok = sn.icone === 'padrao' && sn.desenho.d === DESENHO.padrao && igual(pp.opcoes.filter(o => o.marcado).map(o => o.valor), ['padrao']) && pp.status.texto === 'Escolhido: ' + NOME.padrao;
      if (!ok) { estranhos++; t('J valor gravado "' + v.slice(0, 30) + '" cai no padrão', false, {sino: sn.icone, marcados: pp.opcoes.filter(o => o.marcado).map(o => o.valor)}); }
    }
    t('J valores gravados estranhos (vazio, lixo, __proto__, constructor, maiúsculas, espaço, HTML, 5000 letras) caem todos no padrão, sem erro', estranhos === 0 && c.erros().length === 0, c.erros());
    await c.t('valorBruto', null); await ir(c, 'home');
    t('J apagar a chave devolve o padrão', (await c.t('sinoIcone')).icone === 'padrao');
    await c.t('valorBruto', 'joinha'); await ir(c, 'home');

    // ---------------------------------------------------------------- K · rotina do Perfil
    await ir(c, 'profile');
    t('K tirar a linha e o painel da tela e abrir o Perfil de novo: a rotina do Perfil recria os dois (1 de cada)', await c.t('apagarLinha') && (await ir(c, 'profile'), true) && (p = await c.t('perfilIcone')) && p.linhas === 1 && p.paineis === 1 && /^Configura/.test(p.antes) && !p.linha.oculta, p && {linhas: p.linhas, paineis: p.paineis, antes: p.antes});
    for (let i = 0; i < 3; i++) await c.evaluate('profileRender()');
    await sleep(200); p = await c.t('perfilIcone');
    t('K chamar a rotina do Perfil várias vezes não duplica a linha nem o painel', p.linhas === 1 && p.paineis === 1 && p.itens.filter(x => x === 'apFeedbackIconOpen').length === 1, {linhas: p.linhas, paineis: p.paineis});
    t('K a linha recriada mostra o ícone guardado (joinha), com o desenho dele', p.linha.icone === 'joinha' && p.linha.desenho.d === DESENHO.joinha && igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), ['joinha']), p.linha.icone);

    // ---------------------------------------------------------------- L · teclado
    await abrirPainel(); await c.t('espiar');
    await c.evaluate("document.querySelector('input[name=apFeedbackIcon][value=joinha]').focus()"); await sleep(150);
    await c.tecla('ArrowRight', 'ArrowRight', 39);
    const iJ = IDS.indexOf('joinha');
    p = await c.t('perfilIcone');
    t('L seta para a direita no rádio focado marca o próximo ícone (' + IDS[iJ + 1] + '), grava e atualiza o botão do topo', igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), [IDS[iJ + 1]]) && igual(daConta(await c.t('guardado'), UID_A), [[CHAVE(UID_A), IDS[iJ + 1]]]) && (await c.t('sinoIcone')).icone === IDS[iJ + 1] && igual(await c.t('eventos'), [IDS[iJ + 1]]), {marcados: p.opcoes.filter(o => o.marcado).map(o => o.valor), guardado: await c.t('guardado')});
    await c.tecla('ArrowLeft', 'ArrowLeft', 37);
    t('L seta para a esquerda volta ao ícone anterior (joinha)', (await c.t('sinoIcone')).icone === 'joinha' && igual((await c.t('perfilIcone')).opcoes.filter(o => o.marcado).map(o => o.valor), ['joinha']));
    const foco = () => c.evaluate("JSON.stringify((()=>{const r=document.querySelector('input[name=apFeedbackIcon]:checked');const f=r.nextElementSibling;const cs=getComputedStyle(f);return {foco:document.activeElement===r,fv:r.matches(':focus-visible'),estilo:cs.outlineStyle,largura:cs.outlineWidth,cor:cs.outlineColor}})())").then(JSON.parse);
    let fv = await foco();
    t('L o ícone com foco de teclado ganha um contorno tracejado visível', fv.foco && fv.fv && fv.estilo === 'dashed' && parseFloat(fv.largura) >= 2, fv);
    await c.evaluate("document.getElementById('apFeedbackIconOpen').focus()"); await sleep(100);
    await c.tecla('Enter', 'Enter', 13);
    t('L Enter na linha fecha o painel (que estava aberto) e Enter de novo abre', (await c.t('perfilIcone')).painel.oculto, await c.t('perfilIcone').then(x => x.linha.expandido));
    await c.tecla('Enter', 'Enter', 13);
    p = await c.t('perfilIcone');
    t('L ...e abre com o foco no painel', p.painel.visivel && p.painel.foco && p.linha.expandido === 'true', {foco: p.painel.foco, expandido: p.linha.expandido});
    // modo claro com a cor mais clara do aplicativo (amarelo): o contorno do foco precisa continuar visível sobre o painel branco
    await cenario(c, {nome: 'Jéssica Silva', cor: CORES.amarelo, modo: 'claro'}, SEMENTE);
    await abrirPainel();
    await c.evaluate("document.querySelector('input[name=apFeedbackIcon][value=joinha]').focus()"); await sleep(150);
    await c.tecla('ArrowRight', 'ArrowRight', 39);
    fv = await foco();
    const painelClaro = rgbHex((await c.t('cores')).fundoPainel);
    t('L modo claro, cor amarela: o contorno do foco tem contraste de pelo menos 3:1 com o painel branco (precisa aparecer em qualquer cor)', fv.foco && fv.fv && fv.estilo === 'dashed' && !!rgbHex(fv.cor) && contraste(rgbHex(fv.cor), painelClaro) >= 3, {contorno: fv.cor, painel: painelClaro, contraste: rgbHex(fv.cor) && contraste(rgbHex(fv.cor), painelClaro)});
    await cenario(c, {nome: 'Jéssica Silva'}, SEMENTE);

    // ---------------------------------------------------------------- M · painel do Perfil em cada cor (claro e escuro)
    const lendo = [];
    for (const modo of ['escuro', 'claro']) for (const [nomeAc, cor] of Object.entries(CORES)) {
      await cenario(c, {nome: 'Jéssica Silva', cor, modo}, SEMENTE);
      await abrirPainel(); await c.escolher('conversa'); await sleep(250);
      const k = await c.t('cores'), ex = rgbHex(k.fundoPainel);
      const cr = {desc: contraste(rgbHex(k.descricao), ex), status: contraste(rgbHex(k.status), ex), titulo: contraste(rgbHex(k.titulo), ex), anel: contraste(cor, ex)};
      const mfun = rgbHex(k.marca.fundo), badge = contraste(mfun, ex);
      const falhas = [];
      if (k.claro !== (modo === 'claro')) falhas.push('modo do Perfil: ' + k.claro);
      if (cr.desc < 4.5 || cr.status < 4.5 || cr.titulo < 4.5) falhas.push('contraste do texto ' + JSON.stringify(cr));
      if (k.linhaTitulo !== k.vizinhaTitulo || k.linhaSub !== k.vizinhaSub || k.fundoLinha !== k.fundoVizinha) falhas.push('a linha nova tem cores diferentes das vizinhas');
      if (Math.max(cr.anel, badge) < 3) falhas.push('nem o anel nem a marca de visto aparecem contra o fundo: ' + JSON.stringify({anel: cr.anel, badge}));
      if (!/\S/.test(k.sombraMarcada || '') || k.sombraMarcada === 'none') falhas.push('o ícone marcado não tem anel');
      if (!k.marca || k.marca.conteudo === 'none' || k.marca.w !== '18px' || k.marca.h !== '18px') falhas.push('marca de visto: ' + JSON.stringify(k.marca));
      // o que o Chrome PINTOU no quadradinho (um ponto de uma opção não marcada, a 6 px do canto): tem de ser escuro nos dois modos, e a cor de destaque tem de
      // ter pelo menos 3:1 de contraste sobre ele (limite do WCAG para desenhos e componentes)
      const pt = await c.t('pontosDaOpcao', 'balao'), ps = await c.t('pontosDaOpcao', 'conversa');
      const [pxCanto, pxMarcado] = await c.pixels([pt.canto, ps.canto]);
      const hex = px => '#' + px.map(v => v.toString(16).padStart(2, '0')).join('');
      const hexTile = hex(pxCanto), hexMarcado = hex(pxMarcado), contrasteTile = contraste(cor, hexTile), contrasteMarcado = contraste(cor, hexMarcado);
      if (luz(hexTile) > 0.05) falhas.push('o quadradinho está claro (' + hexTile + ', luminância ' + f2(luz(hexTile)) + ')');
      if (contrasteTile < 3) falhas.push('o desenho tem só ' + f2(contrasteTile) + ':1 de contraste sobre o quadradinho (' + hexTile + ')');
      if (contrasteMarcado < 3) falhas.push('o desenho tem só ' + f2(contrasteMarcado) + ':1 de contraste sobre o quadradinho marcado (' + hexMarcado + ')');
      lendo.push([modo, nomeAc, f2(contrasteTile), f2(contrasteMarcado)]);
      t('M ' + modo + ' · ' + nomeAc + ' (' + cor + '): texto legível (≥ 4,5:1), linha com as cores das vizinhas, anel e marca de visto, quadradinho escuro (' + hexTile + ') e desenho com ' + f2(contrasteTile) + ':1 sobre ele (' + f2(contrasteMarcado) + ':1 no marcado)', falhas.length === 0, falhas);
    }
    console.log('     (contraste do desenho sobre o quadradinho, normal / marcado) ' + lendo.filter(x => x[0] === 'escuro').map(x => x[1] + ' ' + x[2] + '/' + x[3]).join(' · '));
    await cenario(c, {nome: 'Jéssica Silva'}, SEMENTE);

    // ---------------------------------------------------------------- S · a cor do desenho é a cor do aplicativo, em todas as cores
    // Para cada cor de destaque e cada modo: o botão do topo tem a mesma cor do WhatsApp e do sino ao lado (que é a cor de destaque do Início);
    // a linha e os 19 desenhos da grade têm a cor dos ícones das outras linhas do Perfil (a cor de destaque do Perfil). Se alguma coisa fosse
    // de cor fixa (por exemplo o roxo da ilustração), só uma das cores passaria.
    const exemplos = ['megafone', 'selo', 'tres-carinhas', 'documento-lapis', 'padrao'];
    let n = 0;
    for (const modo of ['escuro', 'claro']) for (const [nomeAc, cor] of Object.entries(CORES)) {
      const exemplo = exemplos[n++ % exemplos.length], esperado = rgb(cor), falhas = [];
      await cenario(c, {nome: 'Jéssica Silva', cor, modo, tema: nomeAc === 'tema preto' ? 'preto' : undefined}, SEMENTE);
      await c.t('valorBruto', exemplo === 'padrao' ? null : exemplo); await ir(c, 'home');
      const top = await c.t('coresTopo'), st = await c.t('sinoIcone');
      if (top.acento !== esperado) falhas.push('o Início usa ' + top.acento + ' em vez de ' + esperado);
      if (st.icone !== exemplo) falhas.push('o botão mostra ' + st.icone + ' em vez de ' + exemplo);
      if (top.feedback.preenchimento !== esperado) falhas.push('desenho do feedback ' + top.feedback.preenchimento);
      if (top.feedback.cor !== esperado) falhas.push('botão do feedback ' + top.feedback.cor);
      if (top.whatsapp.preenchimento !== esperado || top.sino.traco !== esperado) falhas.push('os vizinhos não têm a cor esperada: WhatsApp ' + top.whatsapp.preenchimento + ', sino ' + top.sino.traco);
      if (top.feedback.traco !== 'none') falhas.push('o desenho tem contorno: ' + top.feedback.traco);
      await ir(c, 'profile');
      const pf = await c.t('coresPerfil');
      if (pf.acento !== esperado) falhas.push('o Perfil usa ' + pf.acento + ' em vez de ' + esperado);
      if (pf.linha !== esperado || !pf.vizinha || pf.vizinha.cor !== esperado) falhas.push('a linha tem ' + pf.linha + ' e a vizinha ' + JSON.stringify(pf.vizinha));
      await abrirPainel();
      const pg = await c.t('coresPerfil');
      if (pg.opcoes.length !== 19 || pg.opcoes.some(x => x !== esperado)) falhas.push('desenhos da grade fora da cor: ' + JSON.stringify([...new Set(pg.opcoes)]));
      t('S ' + modo + ' · ' + nomeAc + ' (' + cor + '): botão do topo (' + exemplo + ') com a cor do WhatsApp e do sino; linha e 19 desenhos da grade na cor das outras linhas do Perfil', falhas.length === 0, falhas);
    }
    await cenario(c, {nome: 'Jéssica Silva'}, SEMENTE);
    // uma cor que o aluno escolhe na paleta livre (campo de cor do aplicativo), uma escura e uma clara: o desenho acompanha qualquer uma
    for (const cor of ['#7a5cff', '#1b3a8a', '#e6ff3d']) {
      await cenario(c, {nome: 'Jéssica Silva', cor}, SEMENTE);
      await c.t('valorBruto', 'estrela-visto'); await ir(c, 'home');
      const top = await c.t('coresTopo'); await abrirPainel(); const pg = await c.t('coresPerfil');
      t('S cor livre ' + cor + ': o botão do topo, a linha e os 19 desenhos da grade acompanham', top.feedback.preenchimento === rgb(cor) && top.whatsapp.preenchimento === rgb(cor) && pg.linha === rgb(cor) && pg.opcoes.length === 19 && pg.opcoes.every(x => x === rgb(cor)), {topo: top.feedback.preenchimento, linha: pg.linha, grade: [...new Set(pg.opcoes)]});
    }
    await cenario(c, {nome: 'Jéssica Silva'}, SEMENTE);

    // ---------------------------------------------------------------- O · a janela "Como foi hoje?" segue igual
    await ir(c, 'home'); await sleep(200);
    await c.tocar('#apFeedbackBell'); await sleep(500);
    let e = await c.t('estado');
    t('O tocar no botão (com ícone escolhido) abre a janela "Como foi hoje?" como no 292', e.janela && e.janela.aberta === true, e.janela);
    await c.evaluate("APFeedbackStudent.close()"); await sleep(300);
    e = await c.t('estado');
    t('O ao fechar, a janela fecha e o foco volta ao botão do topo', e.janela.aberta === false && e.foco === 'apFeedbackBell', {janela: e.janela, foco: e.foco});
    t('O a interface pública do feedback do aluno continua com as mesmas quatro funções e congelada', await c.evaluate("JSON.stringify(Object.keys(APFeedbackStudent))") === JSON.stringify(['open', 'close', 'render', 'decorate']) && await c.evaluate('Object.isFrozen(APFeedbackStudent)') === true);

    // ---------------------------------------------------------------- R · "reduzir movimento"
    await c.evaluate("window.__sv=[];if(!window.__svOn){window.__svOn=true;const o=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(a){if(a&&a.block==='nearest')window.__sv.push(a.behavior);return o.apply(this,arguments)}}");
    for (const [rotuloMov, valor, esperado] of [['sem preferência', 'no-preference', 'smooth'], ['reduzir movimento', 'reduce', 'auto']]) {
      await c.send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: valor}]});
      await ir(c, 'profile');
      const tocarLinha = async () => { await c.evaluate("document.getElementById('apFeedbackIconOpen').scrollIntoView({block:'center'})"); await sleep(250); await c.tocar('#apFeedbackIconOpen'); };
      if (!(await c.t('perfilIcone')).painel.oculto) { await tocarLinha(); await sleep(300); } // se já estiver aberto, fecha
      await c.evaluate('window.__sv=[]');
      await tocarLinha(); await sleep(500);
      const usado = JSON.parse(await c.evaluate('JSON.stringify(window.__sv)'));
      t('R ' + rotuloMov + ': ao abrir o painel a rolagem usa "' + esperado + '"', igual(usado, [esperado]), usado);
    }
    await c.send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'no-preference'}]});

    // ---------------------------------------------------------------- Q · larguras e letra grande
    const problemas = [];
    for (const [w, fonte] of [[320, 'media'], [360, 'media'], [390, 'media'], [430, 'media'], [320, 'grande'], [390, 'grande']]) {
      await c.viewport(w, 844);
      await cenario(c, {nome: 'Jéssica Silva', fonte}, SEMENTE);
      await abrirPainel(); await c.evaluate("document.getElementById('apFeedbackIconPanel').scrollIntoView({block:'start'})"); await sleep(250);
      const g = await c.t('grade'), pp = await c.t('perfilIcone');
      const f = [];
      if (g.n !== 19) f.push('opções: ' + g.n);
      if (g.menorLado < 48) f.push('alvo de toque de ' + g.menorLado + ' px');
      if (!g.quadrados) f.push('opção que não é quadrada');
      if (g.estouroTela > 0 || g.estouroJanela > 0 || g.estouroPainel > 0) f.push('estouro horizontal ' + [g.estouroTela, g.estouroJanela, g.estouroPainel]);
      if (g.direita + 7 > w - 4 || g.esquerda < 4) f.push('opção ou marca de visto encostada na borda: ' + [g.esquerda, g.direita]);
      if (g.menorEspaco < 8) f.push('espaço entre opções de ' + g.menorEspaco + ' px');
      if (g.colunas < 3 || g.colunas > 6) f.push('colunas: ' + g.colunas);
      if (!pp.linha || pp.linha.retangulo.r > w + 0.5) f.push('linha fora da tela');
      problemas.push([w + ' px · letra ' + fonte, g.colunas + ' colunas, alvo ' + g.menorLado + ' px, espaço ' + g.menorEspaco + ' px', f]);
      t('Q ' + w + ' px · letra ' + fonte + ' (' + g.colunas + ' colunas, alvo ' + g.menorLado + ' px, espaço ' + g.menorEspaco + ' px): grade dentro da tela, sem estouro', f.length === 0, f);
    }
    await c.viewport(390, 844);

    t('Z nenhum erro de JavaScript na página durante todo o teste (294 e 292)', c.erros().length === 0 && d.erros().length === 0, {novo: c.erros(), antigo: d.erros()});
  } finally { c.close(); d.close(); }
  process.exit(S.fim() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
