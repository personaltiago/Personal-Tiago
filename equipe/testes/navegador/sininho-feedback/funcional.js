'use strict';
// Teste funcional do sino do feedback (1.12.292) na página do aluno verdadeira, em Chrome real (toque de verdade).
// uso: PORTA=8790 SAIDA=saida node funcional.js <pagina-292.html> [pagina-291.html]
// Com a segunda página (a do 1.12.291) também confere que tudo o que NÃO é o sino ficou igual.
const {abrir, cenario, suite, contraste, rgbHex, sleep} = require('./aluno.js');

const [, , nova, antiga] = process.argv;
if (!nova) { console.error('uso: node funcional.js <pagina-292.html> [pagina-291.html]'); process.exit(2); }
const S = suite('Sino do feedback · funcional');
const t = S.t;

const SINOS_ESPERADOS = ['apGroupButton', 'apFeedbackBell', 'apStudentNotificationBell', 'home-avatar'];
const SEM_SINO = ['apGroupButton', 'apStudentNotificationBell', 'home-avatar'];

(async () => {
  const c = await abrir(nova, {});
  const e = () => c.t('estado');

  // ---------- A) sem pendência: o topo é o de sempre ----------
  await cenario(c, {nome: 'Jessica Souza'}, {pendentes: 0, respondidos: 5});
  let s = await e();
  t('A1 sem pendência (5 respondidos): nada de sino na tela', !s.sino || (s.sino.oculto && !s.sino.visivel), s.sino);
  t('A1 topo sem a classe do sino e só os três ícones de antes', !s.classeTopo.includes('ap-feedback-bell-on') && JSON.stringify(s.irmaos) === JSON.stringify(SEM_SINO), [s.classeTopo, s.irmaos]);
  await cenario(c, {nome: 'Jessica Souza'}, {pendentes: 0, respondidos: 0});
  s = await e();
  t('A2 sem nenhum feedback: nada de sino', !s.sino || (s.sino.oculto && !s.sino.visivel) && s.pendentes === 0, s);

  // ---------- B) com pendências: número, rótulo, posição ----------
  for (const [n, extra] of [[1, 0], [2, 3], [3, 0], [5, 2], [7, 0]]) {
    await cenario(c, {nome: 'Jessica Souza'}, {pendentes: n, respondidos: extra});
    s = await e();
    const rotulo = 'Feedback do treino, ' + n + (n === 1 ? ' pendente' : ' pendentes');
    t('B' + n + ' ' + n + ' pendente(s) + ' + extra + ' respondido(s): sino visível com o número ' + n,
      !!s.sino && s.sino.visivel && !s.sino.oculto && s.sino.numero === String(n) && s.sino.numeroVisivel, s.sino);
    t('B' + n + ' rótulo de acessibilidade e título "' + rotulo + '"', !!s.sino && s.sino.rotulo === rotulo && s.sino.titulo === rotulo, s.sino && [s.sino.rotulo, s.sino.titulo]);
    t('B' + n + ' é um botão de verdade (button, type=button), filho de .home-actions, um só', !!s.sino && s.sino.tag === 'BUTTON' && s.sino.tipo === 'button' && s.sino.pai && s.sinos === 1, [s.sino, s.sinos]);
    t('B' + n + ' ordem no topo: grupo, feedback, notificações, perfil', JSON.stringify(s.irmaos) === JSON.stringify(SINOS_ESPERADOS), s.irmaos);
    t('B' + n + ' o topo ganha a classe do layout; o número é o mesmo do aviso (pendentes = ' + n + ')', s.classeTopo.includes('ap-feedback-bell-on') && s.pendentes === n, [s.classeTopo, s.pendentes]);
  }
  // mais pendentes que o limite de 7: a lista só mostra as 7 mais recentes, e o sino acompanha a lista
  await cenario(c, {nome: 'Jessica Souza'}, {pendentes: 9, respondidos: 0});
  s = await e();
  t('B9 9 pedidos sem resposta: a lista mostra 7 e o sino mostra 7 (o mesmo número do aviso do pet)', s.visiveis === 7 && s.pendentes === 7 && s.sino && s.sino.numero === '7', s);
  // sem grupo da turma: o sino fica antes do sino de notificações do mesmo jeito
  await cenario(c, {nome: 'Jessica Souza', grupo: false}, {pendentes: 2, respondidos: 1});
  s = await e();
  t('B-grupo sem ícone do WhatsApp: ordem feedback, notificações, perfil', JSON.stringify(s.irmaos) === JSON.stringify(['apFeedbackBell', 'apStudentNotificationBell', 'home-avatar']), s.irmaos);

  // ---------- C) atualiza ao vivo e some sozinho ----------
  await cenario(c, {nome: 'Jessica Souza'}, {pendentes: 3, respondidos: 1});
  const idAntes = await c.evaluate("document.getElementById('apFeedbackBell')?(window.__sinoRef=document.getElementById('apFeedbackBell'),true):false");
  t('C0 começa com o sino na tela', idAntes === true);
  const passos = [[2, 2], [1, 3], [0, 4], [1, 3], [3, 1]];
  for (const [n, r] of passos) {
    await c.t('semear', {pendentes: n, respondidos: r});
    await sleep(150);
    s = await e();
    const mesmo = await c.evaluate("document.getElementById('apFeedbackBell')===window.__sinoRef");
    if (n === 0) t('C ' + n + ' pendente: o sino some e o topo volta ao que era', (!s.sino.visivel) && s.sino.oculto && !s.classeTopo.includes('ap-feedback-bell-on') && JSON.stringify(s.irmaos) === JSON.stringify(['apGroupButton', 'apFeedbackBell', 'apStudentNotificationBell', 'home-avatar']), s);
    else t('C ' + n + ' pendente(s): o número acompanha sem recarregar a tela (mesmo botão, sem duplicar)', s.sino.visivel && s.sino.numero === String(n) && s.sinos === 1 && mesmo, [s.sino && s.sino.numero, s.sinos, mesmo]);
  }

  // ---------- D) toque, janela do feedback, foco e Voltar ----------
  await cenario(c, {nome: 'Jessica Souza'}, {pendentes: 2, respondidos: 3});
  await c.tocar('#apFeedbackBell');
  s = await e();
  t('D1 tocar no sino abre a janela do feedback direto (sem entrar no pet)', s.janela && s.janela.aberta === true, s.janela);
  t('D1 abre já no pedido pendente mais recente (fb_s01)', s.janela && s.janela.selecionado === 'fb_s01', s.janela);
  t('D1 o foco vai para dentro da janela (botão fechar)', await c.evaluate("document.getElementById('apFeedbackStudent').contains(document.activeElement)"), s.foco);
  t('D1 o sino continua com o número 2 por trás da janela', s.sino.numero === '2');
  await c.captura('funcional-janela-aberta.png');
  // Voltar (botão do sistema e função back) fecha a janela primeiro
  const voltou = await c.evaluate("(()=>{const r=typeof handleAgendaSystemBack==='function'?handleAgendaSystemBack():null;return JSON.stringify({r,aberta:document.getElementById('apFeedbackStudent').open})})()");
  const v = JSON.parse(voltou);
  t('D2 Voltar do sistema fecha a janela do feedback', v.aberta === false, v);
  await c.tocar('#apFeedbackBell');
  await c.evaluate("back()");
  t('D3 back() fecha a janela do feedback', (await e()).janela.aberta === false);
  await c.tocar('#apFeedbackBell');
  await c.tocar('#apFeedbackStudent [data-feedback-close]');
  s = await e();
  t('D4 fechar no × devolve o foco ao sino', s.janela.aberta === false && s.foco === 'apFeedbackBell', [s.janela, s.foco]);
  // depois de fechar, o sino responde de novo
  await c.tocar('#apFeedbackBell');
  t('D5 tocar de novo abre de novo', (await e()).janela.aberta === true);
  await c.evaluate("APFeedbackStudent.close()");

  // ---------- E) responder: o número cai quando o envio é confirmado ----------
  await cenario(c, {nome: 'Jessica Souza'}, {pendentes: 2, respondidos: 2});
  await c.t('servidor', {});
  await c.tocar('#apFeedbackBell');
  await c.evaluate("(()=>{document.getElementById('apFeedbackIntensity').value='Intensa';document.getElementById('apFeedbackComment').value='Foi bom.';document.getElementById('apFeedbackForm').requestSubmit()})()");
  await sleep(2000);
  s = await e();
  const chamadas = await c.evaluate("JSON.stringify(window.__srv.calls)");
  t('E1 responder o primeiro: o servidor confirmou e o sino caiu de 2 para 1 sozinho', s.pendentes === 1 && s.sino.visivel && s.sino.numero === '1', [s.pendentes, s.sino, chamadas]);
  t('E1 o aviso "enviado" fecha a janela sozinho (comportamento de antes)', s.janela.aberta === false, s.janela);
  await c.tocar('#apFeedbackBell');
  s = await e();
  t('E2 tocar no sino agora abre o pedido que sobrou (fb_s02)', s.janela.aberta && s.janela.selecionado === 'fb_s02', s.janela);
  await c.evaluate("(()=>{document.getElementById('apFeedbackIntensity').value='Leve';document.getElementById('apFeedbackComment').value='';document.getElementById('apFeedbackForm').requestSubmit()})()");
  await sleep(2000);
  s = await e();
  t('E3 responder o último: o sino some e o topo volta ao de sempre', s.pendentes === 0 && (!s.sino.visivel) && !s.classeTopo.includes('ap-feedback-bell-on'), [s.pendentes, s.sino, s.classeTopo]);
  // envio que falha: a resposta fica no aparelho e o sino continua até o servidor confirmar
  await cenario(c, {nome: 'Jessica Souza'}, {pendentes: 1, respondidos: 1});
  await c.t('servidor', {falhaEnvio: true});
  await c.tocar('#apFeedbackBell');
  await c.evaluate("(()=>{document.getElementById('apFeedbackIntensity').value='Intensa';document.getElementById('apFeedbackComment').value='Offline.';document.getElementById('apFeedbackForm').requestSubmit()})()");
  await sleep(1800);
  s = await e();
  const fila = await c.evaluate("JSON.stringify(Object.keys(APFeedbackSync.local().outbox))");
  t('E4 envio recusado: resposta guardada no aparelho (fila) e o sino continua com 1, como o aviso do pet', JSON.parse(fila).length === 1 && s.pendentes === 1 && s.sino.visivel && s.sino.numero === '1', [fila, s.pendentes, s.sino]);
  await c.evaluate("APFeedbackStudent.close()");

  // ---------- F) conta: sem aluno, professor, outra conta ----------
  await cenario(c, {nome: 'Jessica Souza'}, {pendentes: 2, respondidos: 0});
  await c.t('sair');
  await sleep(200);
  s = await e();
  t('F1 sair da conta: o sino some', s.uid === '' && (!s.sino || !s.sino.visivel) && !(s.classeTopo || '').includes('ap-feedback-bell-on'), [s.uid, s.sino, s.classeTopo]);
  await cenario(c, {nome: 'Jessica Souza', role: 'preview'}, {pendentes: 2, respondidos: 0});
  s = await e();
  t('F2 visualização do aluno pelo professor (role preview): não há sino', s.uid === '' && (!s.sino || !s.sino.visivel), [s.uid, s.sino]);
  await cenario(c, {nome: 'Jessica Souza', uid: 'contaA'}, {pendentes: 2, respondidos: 0});
  s = await e();
  t('F3 conta A com 2 pendentes: sino com 2', s.sino && s.sino.visivel && s.sino.numero === '2', s.sino);
  await cenario(c, {nome: 'Outro Aluno', uid: 'contaB'}, {pendentes: 0, respondidos: 0});
  s = await e();
  t('F3 troca para a conta B (sem feedback): o sino da conta A não fica', s.uid === 'contaB' && (!s.sino || !s.sino.visivel), [s.uid, s.sino]);
  await cenario(c, {nome: 'Jessica Souza', uid: 'contaA'}, {pendentes: 2, respondidos: 0});
  await c.evaluate("window.__AP_STUDENT_CONTEXT.area.enabled=false;window.dispatchEvent(new Event('ap-account-changed'))");
  await sleep(200);
  s = await e();
  t('F4 área do aluno desligada pelo professor: não há sino', s.uid === '' && (!s.sino || !s.sino.visivel), [s.uid, s.sino]);

  // ---------- G) a cor do número: sempre legível ----------
  const cores = [['rosa', null], ['azul', null], ['roxo', null], ['verde', null], ['preto', null], ['custom', '#ffd400'], ['custom', '#b6ff26'], ['custom', '#ffffff'], ['custom', '#101010'], ['custom', '#ff0000']];
  for (const modo of ['escuro', 'claro']) {
    for (const [tema, cor] of cores) {
      await cenario(c, {nome: 'Jessica Souza', tema: tema === 'custom' ? 'rosa' : tema, ...(cor ? {cor} : {}), modo}, {pendentes: 3, respondidos: 0});
      const m = JSON.parse(await c.evaluate("(()=>{const n=document.getElementById('apFeedbackBellCount'),b=document.getElementById('apFeedbackBell'),cs=getComputedStyle(n),bs=getComputedStyle(b);return JSON.stringify({fundo:cs.backgroundColor,texto:cs.color,anel:cs.borderTopColor,icone:bs.color,svg:getComputedStyle(b.querySelector('svg')).fill,acento:getComputedStyle(document.getElementById('studentHome')).getPropertyValue('--home-accent').trim()})})()"));
      const fundo = rgbHex(m.fundo), texto = rgbHex(m.texto), icone = rgbHex(m.icone), svg = rgbHex(m.svg);
      const r = contraste(fundo, texto);
      t('G ' + modo + ' ' + (cor || tema) + ': número legível (contraste ' + r.toFixed(2) + ':1 ≥ 3, texto ' + texto + ' sobre ' + fundo + ')', r >= 3, m);
      t('G ' + modo + ' ' + (cor || tema) + ': fundo do número, balão e acento do tema são a mesma cor', fundo === icone && icone === svg && (!m.acento || m.acento.toLowerCase() === fundo), m);
    }
  }
  // as cores padrão (rosa, azul, roxo) mantêm o número branco, como o do sino de notificações
  for (const tema of ['rosa', 'azul', 'roxo']) {
    await cenario(c, {nome: 'Jessica Souza', tema}, {pendentes: 1, respondidos: 0});
    s = await e();
    t('G ' + tema + ': número branco (igual ao do sino de notificações)', s.sino.tinta === '#fff', s.sino.tinta);
  }
  for (const [tema, cor] of [['verde', null], ['preto', null], ['custom', '#b6ff26']]) {
    await cenario(c, {nome: 'Jessica Souza', tema: tema === 'custom' ? 'rosa' : tema, ...(cor ? {cor} : {})}, {pendentes: 1, respondidos: 0});
    s = await e();
    t('G ' + (cor || tema) + ': cor clara demais para branco → número escuro', s.sino.tinta === '#0a151e', s.sino.tinta);
  }

  // ---------- H) o resto da página não muda: 292 x 291 ----------
  // Páginas novas dos dois lados (sem o servidor simulado e sem resto do teste anterior), com a mesma data fixa nos feedbacks.
  if (antiga) {
    const AGORA = Date.UTC(2026, 10, 19, 15, 0, 0);
    const novo = await abrir(nova, {}), d = await abrir(antiga, {});
    // Primeiro os estados em que o sino nunca chega a ser criado: o topo do 292 é igual ao do 291 byte a byte, inclusive a classe.
    const semPendencia = [['sem feedback', {pendentes: 0, respondidos: 0}], ['só respondidos', {pendentes: 0, respondidos: 5}]];
    const comPendencia = [['1 pendente', {pendentes: 1, respondidos: 0}], ['3 pendentes + 2 respondidos', {pendentes: 3, respondidos: 2}],
      ['7 pendentes', {pendentes: 7, respondidos: 0}], ['12 sessões, 4 pendentes', {pendentes: 4, respondidos: 8}]];
    const topoIgual = async (rotulo) => {
      const a = await novo.evaluate("document.querySelector('#homeScroll .home-header').outerHTML"), b = await d.evaluate("document.querySelector('#homeScroll .home-header').outerHTML");
      t('H ' + rotulo + ': o topo do 292 é idêntico ao do 291 (HTML inteiro, sem sino e sem classe nova)', a === b, [a.length, b.length]);
    };
    const comparar = async (rotulo, entrada, semente) => {
      await cenario(novo, entrada, {...semente, agora: AGORA}); await cenario(d, entrada, {...semente, agora: AGORA});
      for (const x of [novo, d]) { await x.evaluate("APFeedbackStudent.open()"); await sleep(150); }
      const a = await novo.t('instantaneo'), b = await d.t('instantaneo');
      for (const x of [novo, d]) await x.evaluate("APFeedbackStudent.close()");
      const campos = Object.keys(b).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
      t('H ' + rotulo + ': tudo o que não é o sino é igual ao 1.12.291 (topo sem o sino, aviso do pet, lista da janela, contagens)', campos.length === 0, campos.map(k => [k, String(a[k]).slice(0, 160), String(b[k]).slice(0, 160)]));
      const sd = await d.t('estado');
      t('H ' + rotulo + ': no 1.12.291 não existe sino', sd.sino === null && sd.sinos === 0);
    };
    for (const modo of ['escuro', 'claro']) {
      for (const [nome, semente] of semPendencia) {
        const entrada = {nome: 'Jessica Souza', modo};
        await comparar(modo + ' · ' + nome, entrada, semente);
        await topoIgual(modo + ' · ' + nome);
        const s2 = await novo.t('estado');
        t('H ' + modo + ' · ' + nome + ': no 292 o sino nem chega a ser criado', s2.sino === null && s2.sinos === 0, s2.sino);
      }
    }
    for (const modo of ['escuro', 'claro']) for (const genero of ['Feminino', 'Masculino']) for (const [nome, semente] of comPendencia) {
      await comparar(modo + ' ' + genero + ' · ' + nome, {nome: 'Jessica Souza', modo, genero, tema: genero === 'Masculino' ? 'azul' : 'rosa'}, semente);
    }
    novo.close(); d.close();
  }

  // ---------- I) erros na página ----------
  const erros = c.logs.filter(l => /^ERRO-PAGINA/.test(l));
  t('I Nenhum erro de JavaScript na página durante todo o teste', erros.length === 0, erros.slice(0, 3));
  c.close();
  process.exit(S.fim() ? 1 : 0);
})().catch(erro => { console.error('FALHA-GERAL', erro); process.exit(3); });
