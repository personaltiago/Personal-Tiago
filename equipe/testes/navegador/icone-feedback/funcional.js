'use strict';
// Teste funcional do ícone do feedback personalizável (1.12.293) no Chrome real, com toque e teclado de verdade, na página do aluno de dentro
// do pacote. Compara com a página do 1.12.292 (a anterior) onde o resultado tem de ser igual. O que o teste prova:
//  A  sem escolha o botão do topo mostra o padrão (selo roxo redondo, 40 px dentro do botão 44×44) e só o desenho difere do 292
//  B  a linha "Ícone do feedback" entra em Meu perfil logo depois de Configurações e o resto do Perfil não muda
//  C  abrir e fechar o painel (toque e teclado), 19 opções na ordem do manifesto, o padrão marcado, nomes e imagens iguais aos arquivos
//  D  cada uma das 19 escolhas: botão do topo, gravação (chave por conta), rádio, status, linha, evento, tamanho, rótulo e número
//  E  a escolha sobrevive a fechar e abrir o aplicativo (recarregar a página) · F é por conta · G sem pendência o topo continua igual
//  H a imagem que não carrega devolve o balão do 292 · I falha ao gravar avisa e não troca nada · J valor gravado estranho cai no padrão
//  K a rotina do Perfil recria a linha sem duplicar · L teclado: setas trocam, Enter abre · M cores/contraste em 5 acentos, claro e escuro
//  N o código acrescentado não usa rede, timers, notificações, som nem armazenamento próprio · O a janela "Como foi hoje?" segue igual
//  R "reduzir movimento" do sistema: a rolagem ao abrir o painel deixa de ser suave
//  Q larguras de 320 a 430 e letra grande: grade sem estouro, alvos de toque ≥ 48 px, nada fora da tela
// uso: PORTA=8790 SAIDA=saida node funcional.js <pagina-293.html> <pagina-292.html> [pasta-dos-icones]
const fs = require('node:fs'), path = require('node:path');
const {abrir, cenario, suite, contraste, rgbHex, sleep} = require('./aluno.js');

const [, , nova, antiga, pastaIcones = path.join(__dirname, '..', '..', '..', '..', 'tools', 'icones-feedback-293')] = process.argv;
if (!nova || !antiga) { console.error('uso: node funcional.js <pagina-293.html> <pagina-292.html> [pasta-dos-icones]'); process.exit(2); }
const S = suite('Ícone do feedback · funcional');
const t = S.t;

const manifesto = JSON.parse(fs.readFileSync(path.join(pastaIcones, 'manifest.json'), 'utf8')).icones;
const IDS = manifesto.map(i => i.id);
const NOME = Object.fromEntries(manifesto.map(i => [i.id, i.nome]));
const ARQUIVO = Object.fromEntries(manifesto.map(i => [i.id, 'data:image/webp;base64,' + fs.readFileSync(path.join(pastaIcones, i.arquivo)).toString('base64')]));
const UID_A = 'uidAlunoTeste123', UID_B = 'uidAlunoBeatriz456';
const CHAVE = uid => 'agenda_student_v2_' + uid + ':agenda_demo_feedback_icon';
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const daConta = (lista, uid) => lista.filter(([k]) => k === CHAVE(uid));
const SEMENTE = {pendentes: 2, respondidos: 1};
const FALHA_GRAVAR = 'Não foi possível guardar o ícone neste aparelho.';

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
    t('A sem escolha: botão do topo visível com o ícone padrão (selo redondo)', !!s && s.visivel && !s.oculto && s.icone === 'padrao' && s.disco && !s.reserva, s && {icone: s.icone, disco: s.disco, classe: s.classe});
    t('A a imagem do padrão carregou (160×160), tem 40×40 dentro do botão 44×44 e é o arquivo do repositório', !!s.img && s.img.carregou && igual(s.img.natural, [160, 160]) && s.img.w === 40 && s.img.h === 40 && s.botao.w === 44 && s.botao.h === 44 && s.img.src === ARQUIVO.padrao, s.img && {carregou: s.img.carregou, natural: s.img.natural, w: s.img.w, h: s.img.h, botao: [s.botao.w, s.botao.h]});
    t('A imagem é decorativa (alt vazio, não arrastável) e é a primeira dentro do botão; o balão simples fica escondido de reserva', s.imgs === 1 && s.img.alt === '' && s.img.arrastavel === false && s.filhos[0] === 'img' && s.svg && s.svg.display === 'none' && !s.svg.visivel, {filhos: s.filhos, svg: s.svg});
    t('A rótulo e número como no 292: "Feedback do treino, 2 pendentes" e "2"', s.rotulo === 'Feedback do treino, 2 pendentes' && s.numero === '2' && s.rotulo === s292.rotulo && s.numero === s292.numero && s.titulo === s292.titulo, {rotulo: s.rotulo, numero: s.numero, titulo: s.titulo});
    const normalizar = html => html.replace(/<img\b[^>]*>/g, '').replace(/ data-icon="[^"]*"/g, '').replace(/ ap-fbicon-(?:disc|fallback)/g, '');
    t('A o botão do 293, sem a imagem, o data-icon e as classes ap-fbicon-*, é idêntico ao do 292 (só o desenho muda)', normalizar(s.html) === s292.html, {a: normalizar(s.html).slice(0, 400), b: s292.html.slice(0, 400)});
    t('A abrir o Início não grava nada no aparelho (a escolha só é gravada quando o aluno toca num ícone)', (await c.t('guardado')).length === 0, await c.t('guardado'));
    const i293 = await c.t('instantaneo'), i292 = await d.t('instantaneo');
    t('A com pendências: o topo (sem o botão), o cartão do Início, a lista e o mascote são idênticos aos do 292', igual(i293, i292), Object.keys(i293).filter(k => !igual(i293[k], i292[k])));

    // ---------------------------------------------------------------- B · linha no Perfil
    await ir(c, 'profile'); await ir(d, 'profile');
    let p = await c.t('perfilIcone'), p292 = await d.t('perfilIcone');
    t('B uma linha e um painel (sem duplicar)', p.linhas === 1 && p.paineis === 1, {linhas: p.linhas, paineis: p.paineis});
    t('B a linha vem logo depois de "Configurações" e o painel logo depois da linha', /^Configura/.test(p.antes || '') && p.painelDepoisDaLinha, {antes: p.antes, depois: p.depois, itens: p.itens});
    t('B o resto do Perfil não mudou (mesmas linhas, na mesma ordem, que no 292)', igual(p.itens.filter(x => x !== 'apFeedbackIconOpen' && x !== 'apFeedbackIconPanel'), p292.itens), {novo: p.itens, antigo: p292.itens});
    const L = p.linha;
    t('B a linha é um botão de verdade, fechado, ligado ao painel, com título e subtítulo', !!L && L.tag === 'BUTTON' && L.tipo === 'button' && L.expandido === 'false' && L.controla === 'apFeedbackIconPanel' && L.titulo === 'Ícone do feedback' && L.subtitulo === 'Escolha o ícone do aviso de feedback', L);
    t('B a linha está visível, mostra o ícone atual (padrão, 27×27, carregado) e a seta', !L.oculta && L.visivel && L.icone === 'padrao' && L.imagem.carregou && L.imagem.w === 27 && L.imagem.h === 27 && L.chevron, L && {icone: L.icone, imagem: L.imagem && [L.imagem.w, L.imagem.h, L.imagem.carregou], chevron: L.chevron});
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
    t('C cada opção mostra a imagem do arquivo do repositório, já carregada (19 de 19)', p.opcoes.every(o => o.imagem.carregou && o.imagem.src === ARQUIVO[o.valor] && igual(o.imagem.natural, [160, 160])), p.opcoes.filter(o => !o.imagem.carregou || o.imagem.src !== ARQUIVO[o.valor]).map(o => o.valor));
    t('C só o padrão é redondo; os outros 18 são blocos de cantos arredondados', p.opcoes.every(o => o.disco === (o.valor === 'padrao')), p.opcoes.filter(o => o.disco).map(o => o.valor));
    await c.tocar('#apFeedbackIconOpen'); await sleep(400);
    p = await c.t('perfilIcone');
    t('C tocar de novo na linha fecha o painel (aria-expanded=false, escondido)', p.painel.oculto && !p.painel.visivel && p.linha.expandido === 'false', {oculto: p.painel.oculto, expandido: p.linha.expandido});
    await c.tocar('#apFeedbackIconOpen'); await sleep(400);
    t('C e abre outra vez', (await c.t('perfilIcone')).painel.visivel);

    // ---------------------------------------------------------------- D · cada uma das 19 escolhas
    await c.t('espiar');
    let erroD = 0;
    for (const x of [...IDS.slice(1), 'padrao']) {
      await c.t('espiar');
      await c.escolher(x); await sleep(300);
      const pp = await c.t('perfilIcone'), g = await c.t('guardado'), ev = await c.t('eventos'), sn = await c.t('sinoIcone');
      const f = [];
      if (sn.icone !== x) f.push('botão do topo mostra ' + sn.icone);
      if (sn.disco !== (x === 'padrao')) f.push('classe redonda errada');
      if (sn.reserva) f.push('caiu na reserva');
      if (!sn.img || !sn.img.carregou || !igual(sn.img.natural, [160, 160]) || sn.img.src !== ARQUIVO[x]) f.push('imagem do botão não é o arquivo');
      if (!igual(g, [[CHAVE(UID_A), x]])) f.push('gravação: ' + JSON.stringify(g));
      if (!igual(pp.opcoes.filter(o => o.marcado).map(o => o.valor), [x])) f.push('marcados: ' + pp.opcoes.filter(o => o.marcado).map(o => o.valor));
      if (pp.status.texto !== 'Escolhido: ' + NOME[x]) f.push('status: ' + pp.status.texto);
      if (pp.linha.icone !== x || pp.linha.imagem.src !== ARQUIVO[x]) f.push('linha mostra ' + pp.linha.icone);
      if (!igual(ev, [x])) f.push('eventos: ' + JSON.stringify(ev));
      if (sn.rotulo !== 'Feedback do treino, 2 pendentes' || sn.numero !== '2') f.push('rótulo/número mudou: ' + sn.rotulo + ' / ' + sn.numero);
      if (!pp.painel.visivel) f.push('o painel fechou sozinho');
      // tamanho na tela do Início (a imagem só tem tamanho quando o Início está à vista)
      await ir(c, 'home');
      const sh = await c.t('sinoIcone'), lado = x === 'padrao' ? 40 : 38;
      if (!sh.visivel || sh.botao.w !== 44 || sh.botao.h !== 44) f.push('botão ' + JSON.stringify(sh.botao));
      if (!sh.img.visivel || Math.abs(sh.img.w - lado) > 0.01 || Math.abs(sh.img.h - lado) > 0.01) f.push('imagem ' + sh.img.w + '×' + sh.img.h + ' em vez de ' + lado);
      if (sh.img.x < sh.botao.x - 0.01 || sh.img.r > sh.botao.r + 0.01 || sh.img.y < sh.botao.y - 0.01 || sh.img.b > sh.botao.b + 0.01) f.push('imagem fora do botão');
      await ir(c, 'profile');
      if (!t('D escolher "' + NOME[x] + '" (' + x + '): botão do topo, gravação, rádio, status, linha, evento e tamanho', f.length === 0, f)) erroD++;
    }
    t('D nenhuma das 19 escolhas deixou erro de JavaScript na página', c.erros().length === 0, c.erros());

    // ---------------------------------------------------------------- E · persistência
    await c.escolher('tres-estrelas'); await sleep(250);
    await c.recarregar();
    await cenario(c, {nome: 'Jéssica Silva'}, SEMENTE);
    s = await c.t('sinoIcone');
    t('E depois de fechar e abrir o aplicativo (página recarregada) o botão do topo continua com o ícone escolhido', s && s.icone === 'tres-estrelas' && s.img.carregou && s.img.src === ARQUIVO['tres-estrelas'], s && s.icone);
    await ir(c, 'profile'); p = await c.t('perfilIcone');
    t('E o Perfil também: rádio marcado, status e ícone da linha são o escolhido', igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), ['tres-estrelas']) && p.status.texto === 'Escolhido: ' + NOME['tres-estrelas'] && p.linha.icone === 'tres-estrelas', {marcados: p.opcoes.filter(o => o.marcado).map(o => o.valor), status: p.status && p.status.texto});

    // ---------------------------------------------------------------- F · por conta
    await abrirPainel(); await c.escolher('joinha'); await sleep(250);
    await c.t('sair'); await sleep(350);
    s = await c.t('sinoIcone'); p = await c.t('perfilIcone');
    t('F sem aluno logado: o botão do topo some e a linha do Perfil fica escondida (painel fechado)', (!s || !s.visivel) && p.linha.oculta && p.painel.oculto && p.linha.expandido === 'false', {sino: s && s.visivel, linha: p.linha.oculta, painel: p.painel.oculto});
    await cenario(c, {uid: UID_B, nome: 'Beatriz Lima'}, SEMENTE);
    s = await c.t('sinoIcone');
    t('F outro aluno no mesmo aparelho começa com o padrão (a escolha do primeiro não vaza)', s.visivel && s.icone === 'padrao', s.icone);
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

    // ---------------------------------------------------------------- H · imagem que não carrega
    await ir(c, 'home');
    await c.evaluate("document.querySelector('#apFeedbackBell img').dispatchEvent(new Event('error'))"); await sleep(150);
    s = await c.t('sinoIcone');
    t('H evento de erro da imagem: volta o balão simples do 292 (visível) e a imagem some', s.reserva && s.svg.display !== 'none' && s.svg.visivel && s.svg.w > 10 && !s.img.visivel, {reserva: s.reserva, svg: s.svg});
    await c.evaluate("document.querySelector('#apFeedbackBell img').dispatchEvent(new Event('load'))"); await sleep(150);
    s = await c.t('sinoIcone');
    t('H quando a imagem carrega, a reserva sai e a imagem volta', !s.reserva && s.img.visivel && s.svg.display === 'none', {reserva: s.reserva});
    await c.evaluate("document.querySelector('#apFeedbackBell img').src='data:image/webp;base64,AAAA'"); await sleep(500);
    s = await c.t('sinoIcone');
    t('H imagem corrompida de verdade (o navegador dispara o erro sozinho): reserva ligada, número e rótulo continuam', s.reserva && s.svg.visivel && s.numero === '2' && s.rotulo === 'Feedback do treino, 2 pendentes', {reserva: s.reserva});
    const tocado = await c.evaluate("document.getElementById('apFeedbackBell').click(), document.getElementById('apFeedbackStudent') && document.getElementById('apFeedbackStudent').open");
    t('H na reserva o botão continua abrindo a janela "Como foi hoje?"', tocado === true, tocado);
    await c.evaluate("APFeedbackStudent.close()"); await sleep(250);
    await abrirPainel(); await c.escolher('carinha'); await sleep(350);
    s = await c.t('sinoIcone');
    t('H escolher outro ícone limpa a reserva e a nova imagem carrega', !s.reserva && s.icone === 'carinha' && s.img.carregou && s.img.src === ARQUIVO.carinha, {reserva: s.reserva, icone: s.icone});

    // ---------------------------------------------------------------- I · falha ao gravar
    await c.t('falhaGravacao', true); await c.t('espiar');
    await c.escolher('selo'); await sleep(350);
    p = await c.t('perfilIcone'); s = await c.t('sinoIcone');
    t('I disco cheio: aparece "' + FALHA_GRAVAR + '"', p.status.texto === FALHA_GRAVAR && p.status.visivel, p.status.texto);
    t('I e nada muda: o botão do topo, o rádio marcado, a linha e a gravação ficam no ícone anterior (carinha)', s.icone === 'carinha' && igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), ['carinha']) && p.linha.icone === 'carinha' && igual(daConta(await c.t('guardado'), UID_A), [[CHAVE(UID_A), 'carinha']]), {sino: s.icone, marcados: p.opcoes.filter(o => o.marcado).map(o => o.valor)});
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
      const ok = sn.icone === 'padrao' && sn.img.carregou && igual(pp.opcoes.filter(o => o.marcado).map(o => o.valor), ['padrao']) && pp.status.texto === 'Escolhido: ' + NOME.padrao;
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
    t('K a linha recriada mostra o ícone guardado (joinha)', p.linha.icone === 'joinha' && igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), ['joinha']), p.linha.icone);

    // ---------------------------------------------------------------- L · teclado
    await abrirPainel(); await c.t('espiar');
    await c.evaluate("document.querySelector('input[name=apFeedbackIcon][value=joinha]').focus()"); await sleep(150);
    await c.tecla('ArrowRight', 'ArrowRight', 39);
    const iJ = IDS.indexOf('joinha');
    p = await c.t('perfilIcone');
    t('L seta para a direita no rádio focado marca o próximo ícone (' + IDS[iJ + 1] + '), grava e atualiza o botão do topo', igual(p.opcoes.filter(o => o.marcado).map(o => o.valor), [IDS[iJ + 1]]) && igual(daConta(await c.t('guardado'), UID_A), [[CHAVE(UID_A), IDS[iJ + 1]]]) && (await c.t('sinoIcone')).icone === IDS[iJ + 1] && igual(await c.t('eventos'), [IDS[iJ + 1]]), {marcados: p.opcoes.filter(o => o.marcado).map(o => o.valor), guardado: await c.t('guardado')});
    await c.tecla('ArrowLeft', 'ArrowLeft', 37);
    t('L seta para a esquerda volta ao ícone anterior (joinha)', (await c.t('sinoIcone')).icone === 'joinha' && igual((await c.t('perfilIcone')).opcoes.filter(o => o.marcado).map(o => o.valor), ['joinha']));
    const fv = await c.evaluate("JSON.stringify((()=>{const r=document.querySelector('input[name=apFeedbackIcon]:checked');const f=r.nextElementSibling;const cs=getComputedStyle(f);return {foco:document.activeElement===r,fv:r.matches(':focus-visible'),estilo:cs.outlineStyle,largura:cs.outlineWidth}})())");
    t('L o ícone com foco de teclado ganha um contorno tracejado visível', JSON.parse(fv).foco && JSON.parse(fv).fv && JSON.parse(fv).estilo === 'dashed' && parseFloat(JSON.parse(fv).largura) >= 2, fv);
    await c.evaluate("document.getElementById('apFeedbackIconOpen').focus()"); await sleep(100);
    await c.tecla('Enter', 'Enter', 13);
    t('L Enter na linha fecha o painel (que estava aberto) e Enter de novo abre', (await c.t('perfilIcone')).painel.oculto, await c.t('perfilIcone').then(x => x.linha.expandido));
    await c.tecla('Enter', 'Enter', 13);
    p = await c.t('perfilIcone');
    t('L ...e abre com o foco no painel', p.painel.visivel && p.painel.foco && p.linha.expandido === 'true', {foco: p.painel.foco, expandido: p.linha.expandido});

    // ---------------------------------------------------------------- M · cores e contraste (5 acentos × claro/escuro)
    const ACENTOS = {rosa: '#ff4d8d', azul: '#2f9bff', roxo: '#8f35df', verde: '#00d98d', lima: '#d7ff3f'};
    const folga = [];
    for (const modo of ['escuro', 'claro']) for (const [nomeAc, cor] of Object.entries(ACENTOS)) {
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
      if (!k.marca || k.marca.conteudo === 'none' || k.marca.w !== '20px' || k.marca.h !== '20px') falhas.push('marca de visto: ' + JSON.stringify(k.marca));
      // o anel de folga (3 px) tem de ter a cor que o painel TEM de verdade: compara os pixels pintados, 1,5 px fora do ícone (folga) e 7 px fora (fundo)
      const gr = JSON.parse(await c.evaluate("JSON.stringify((()=>{const b=document.querySelector('input[name=apFeedbackIcon]:checked').closest('label').getBoundingClientRect();return {x:b.left,y:b.top,h:b.height}})())"));
      const [pxFolga, pxFundo] = await c.pixels([[gr.x - 1.5, gr.y + gr.h / 2], [gr.x - 7, gr.y + gr.h / 2]]);
      const dist = Math.max(...pxFolga.map((v, i) => Math.abs(v - pxFundo[i])));
      folga.push([modo, nomeAc, dist, pxFolga, pxFundo]);
      t('M ' + modo + ' · acento ' + nomeAc + ': texto legível (≥ 4,5:1), linha com as cores das vizinhas, anel e marca de visto presentes', falhas.length === 0, falhas);
    }
    t('M o anel de folga tem a cor com que o painel é pintado de verdade nos 10 casos (pixels da captura; diferença máxima ≤ 8 de 255 por canal)', folga.every(f => f[2] <= 8), folga.filter(f => f[2] > 8));
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
      if (g.menorEspaco < 12) f.push('espaço entre opções de ' + g.menorEspaco + ' px');
      if (g.colunas < 3 || g.colunas > 6) f.push('colunas: ' + g.colunas);
      if (!pp.linha || pp.linha.retangulo.r > w + 0.5) f.push('linha fora da tela');
      problemas.push([w + ' px · letra ' + fonte, g.colunas + ' colunas, alvo ' + g.menorLado + ' px, espaço ' + g.menorEspaco + ' px', f]);
      t('Q ' + w + ' px · letra ' + fonte + ' (' + g.colunas + ' colunas, alvo ' + g.menorLado + ' px, espaço ' + g.menorEspaco + ' px): grade dentro da tela, sem estouro', f.length === 0, f);
    }
    await c.viewport(390, 844);

    t('Z nenhum erro de JavaScript na página durante todo o teste (293 e 292)', c.erros().length === 0 && d.erros().length === 0, {novo: c.erros(), antigo: d.erros()});
  } finally { c.close(); d.close(); }
  process.exit(S.fim() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
