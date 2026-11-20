'use strict';
// Teste no Chrome real do 1.12.295 ("Feedback pelo ícone do topo"), com toque de verdade, na página do aluno de dentro do pacote.
// Pedido (Tiago, 20/11, 11:38): o ícone do feedback tem de ficar no topo do Início (antes só aparecia com feedback pendente) e o feedback
// tem de sair do pet. O teste usa a biblioteca do teste do sino (../sininho-feedback/aluno.js e pagina.js).
// O pet de verdade precisa do aplicativo inteiro e não aparece aqui: para a parte do pet o teste põe na página um cartão e uma janela do
// pet com os mesmos ids que o aplicativo usa (#apMascotHome, .ap-mascot-speech, #apMascotBody) e chama APFeedbackStudent.decorate(),
// que é o que o aplicativo chama. Rodar também contra o 1.12.294 serve de controle: lá o aviso do pet aparece e as seções P falham.
// uso: PORTA=8790 node funcional.js <index-295.html> [index-294.html]
const {abrir, cenario, suite, rgbHex, sleep} = require('../sininho-feedback/aluno.js');

const [, , nova, controle] = process.argv;
if (!nova) { console.error('uso: node funcional.js <index-295.html> [index-294.html]'); process.exit(2); }

const PET = `(() => {
  const home = document.getElementById('homeScroll');
  for (const id of ['apMascotHome', 'apMascotBody']) document.getElementById(id)?.remove();
  const pet = document.createElement('div'); pet.id = 'apMascotHome'; pet.className = 'ap-mascot-home';
  pet.innerHTML = '<span class="ap-mascot-speech">Oi, vamos treinar?</span>';
  const body = document.createElement('div'); body.id = 'apMascotBody';
  home.appendChild(pet); document.body.appendChild(body);
  return true;
})()`;
const SOBRAS = `(() => {
  const pet = document.getElementById('apMascotHome'), body = document.getElementById('apMascotBody'), home = document.getElementById('homeScroll');
  pet.classList.add('ap-feedback-pending');
  const n = document.createElement('span'); n.className = 'ap-feedback-pet-notice'; n.textContent = 'velho'; pet.appendChild(n);
  const b = document.createElement('button'); b.id = 'apMascotFeedback'; b.textContent = 'Seus feedbacks'; body.prepend(b);
  const c = document.createElement('button'); c.id = 'apFeedbackHome'; c.textContent = 'velho'; home.appendChild(c);
  return true;
})()`;
const PET_ESTADO = `JSON.stringify((() => {
  const pet = document.getElementById('apMascotHome');
  return {
    classe: pet ? pet.classList.contains('ap-feedback-pending') : null,
    aviso: document.querySelectorAll('.ap-feedback-pet-notice').length,
    fala: pet?.querySelector('.ap-mascot-speech')?.textContent ?? null,
    botaoPet: !!document.getElementById('apMascotFeedback'),
    cartaoInicio: !!document.getElementById('apFeedbackHome'),
    textoSeus: [...document.querySelectorAll('button')].some(b => /Seus feedbacks|Dê seu feedback|dê seu feedback/.test(b.textContent) && b.offsetParent !== null)
  };
})())`;
const decorar = c => c.evaluate('window.APFeedbackStudent.decorate(),true');

async function rodar(pagina, rotulo, S) {
  const t = (d, ok, det) => S.t(rotulo + ' · ' + d, ok, det);
  const c = await abrir(pagina);
  try {
    // A) sem pendência: o botão existe, sem número
    await cenario(c, {nome: 'Silvana Souza'}, {pendentes: 0, respondidos: 2});
    let s = await c.t('estado');
    t('A Sem pendência o botão do feedback aparece no topo', !!s.sino && s.sino.visivel && !s.sino.oculto && s.sino.pai, s.sino);
    t('A Sem pendência o botão fica sem número', !!s.sino && !s.sino.numeroVisivel && !s.sino.numero, s.sino);
    t('A Sem pendência o rótulo é "Feedback do treino"', s.sino?.rotulo === 'Feedback do treino', s.sino?.rotulo);
    t('A Ordem no topo: WhatsApp, feedback, sino, foto', JSON.stringify(s.irmaos) === JSON.stringify(['apGroupButton', 'apFeedbackBell', 'apStudentNotificationBell', 'home-avatar']), s.irmaos);
    const med = JSON.parse(await c.evaluate(`JSON.stringify((()=>{const b=document.getElementById('apFeedbackBell');if(!b)return {};const g=b.querySelector('svg').getBoundingClientRect(),r=b.getBoundingClientRect(),w=document.getElementById('apGroupButton');return {w:r.width,h:r.height,sw:g.width,cor:getComputedStyle(b).color,zap:w?getComputedStyle(w).color:null}})())`));
    t('A Tamanho do botão 44×44 e desenho de 27 px (o do 1.12.292)', Math.abs(med.w - 44) < .5 && Math.abs(med.h - 44) < .5 && Math.abs(med.sw - 27) < .5, med);
    t('A Mesma cor do ícone do WhatsApp', !!med.zap && rgbHex(med.cor) === rgbHex(med.zap), med);

    // B) tocar sem pendência abre a janela com a lista
    await c.tocar('#apFeedbackBell').catch(() => null);
    s = await c.t('estado');
    const itens = Number(await c.evaluate("document.querySelectorAll('#apFeedbackStudentList [data-feedback-session]').length"));
    t('B Toque sem pendência abre a janela do feedback com os 2 feedbacks', !!s.janela?.aberta && itens === 2, {janela: s.janela, itens});
    await c.evaluate("document.getElementById('apFeedbackStudent')?.close(),true"); await sleep(200);

    // C) sem nenhum feedback: o botão continua e a janela diz que não há nenhum
    await cenario(c, {nome: 'Silvana Souza'}, {pendentes: 0, respondidos: 0});
    s = await c.t('estado');
    t('C Sem nenhum feedback o botão continua no topo', !!s.sino?.visivel, s.sino);
    await c.tocar('#apFeedbackBell').catch(() => null);
    const vazio = await c.evaluate("!!document.getElementById('apFeedbackStudent')?.open&&!!document.querySelector('#apFeedbackStudentList .ap-feedback-empty')");
    t('C Toque abre a janela com "Nenhum feedback solicitado"', vazio === true, vazio);
    await c.evaluate("document.getElementById('apFeedbackStudent')?.close(),true"); await sleep(200);

    // D) com pendência: número e rótulo
    for (const [n, rot] of [[1, 'Feedback do treino, 1 pendente'], [3, 'Feedback do treino, 3 pendentes']]) {
      await cenario(c, {nome: 'Silvana Souza'}, {pendentes: n, respondidos: 1});
      s = await c.t('estado');
      t('D ' + n + ' pendente(s): número ' + n + ' visível e rótulo certo', s.sino?.visivel && s.sino.numeroVisivel && s.sino.numero === String(n) && s.sino.rotulo === rot, s.sino);
    }
    await c.tocar('#apFeedbackBell').catch(() => null);
    s = await c.t('estado');
    t('D Toque com pendência abre a janela no feedback pendente mais recente', !!s.janela?.aberta && s.janela.selecionado === 'fb_s01', s.janela);
    await c.evaluate("document.getElementById('apFeedbackStudent')?.close(),true"); await sleep(200);
    await cenario(c, {nome: 'Silvana Souza'}, {pendentes: 0, respondidos: 1});
    s = await c.t('estado');
    t('D Depois de responder tudo o número some e o botão fica', s.sino?.visivel && !s.sino.numeroVisivel, s.sino);

    // P) o pet: nada de feedback nele
    await cenario(c, {nome: 'Silvana Souza'}, {pendentes: 2, respondidos: 1});
    await c.evaluate(PET); await decorar(c); await sleep(150);
    let p = JSON.parse(await c.evaluate(PET_ESTADO));
    t('P Com pendência o cartão do pet não ganha o aviso vermelho nem a classe de pendência', p.aviso === 0 && p.classe === false, p);
    t('P A fala do pet não é trocada pelo feedback', p.fala === 'Oi, vamos treinar?', p.fala);
    t('P A janela do pet não ganha o botão "Seus feedbacks"', !p.botaoPet, p);
    t('P Nenhum cartão de feedback no Início', !p.cartaoInicio && !p.textoSeus, p);
    await c.evaluate("document.getElementById('apMascotHome').hidden=true,true"); await decorar(c); await sleep(150);
    p = JSON.parse(await c.evaluate(PET_ESTADO));
    t('P Com o pet escondido também não aparece cartão de feedback no Início', !p.cartaoInicio, p);
    await c.evaluate("document.getElementById('apMascotHome').hidden=false,true");
    await c.evaluate(SOBRAS); await decorar(c); await sleep(150);
    p = JSON.parse(await c.evaluate(PET_ESTADO));
    t('P O que sobrou na tela do pacote anterior (aviso, classe, botão do pet, cartão) é limpo', p.aviso === 0 && !p.classe && !p.botaoPet && !p.cartaoInicio, p);
    s = await c.t('estado');
    t('P O botão do topo continua com o número 2', s.sino?.visivel && s.sino.numero === '2', s.sino);

    // I) o ícone escolhido em Meu perfil vale também sem pendência
    await cenario(c, {nome: 'Silvana Souza'}, {pendentes: 0, respondidos: 1});
    await c.evaluate("APstudentStorage.setItem('agenda_demo_feedback_icon','coracao'),window.APFeedbackStudent.decorate(),true"); await sleep(150);
    const icone = await c.evaluate("document.getElementById('apFeedbackBell')?.dataset.icon||''");
    t('I Sem pendência o botão mostra o ícone escolhido (Coração)', icone === 'coracao', icone);
    const texto = await c.evaluate("(()=>{route('profile');return true})()").then(() => sleep(300)).then(() => c.evaluate("(document.querySelector('#apFeedbackIconPanel p')||{}).textContent||''"));
    t('I O texto do painel diz que o ícone fica no topo do Início', /fica no topo do Início/.test(texto), texto);
    await c.evaluate("APstudentStorage.removeItem('agenda_demo_feedback_icon'),route('home'),true"); await sleep(300);

    // F) quem não é aluno logado não tem o botão
    await c.t('sair'); await sleep(300);
    s = await c.t('estado');
    t('F Sem aluno logado o botão não aparece', !s.sino || !s.sino.visivel, s.sino);
    await cenario(c, {nome: 'Silvana Souza', role: 'teacher-preview'}, {pendentes: 2});
    s = await c.t('estado');
    t('F Fora do papel de aluno (visualização) o botão não aparece', !s.sino || !s.sino.visivel, s.sino);

    const erros = c.logs.filter(l => /^ERRO-PAGINA/.test(l));
    t('Z Nenhum erro de JavaScript', erros.length === 0, erros.slice(0, 3));
  } finally { c.close(); }
}

(async () => {
  const S = suite('Feedback pelo ícone do topo (1.12.295)');
  await rodar(nova, 'novo', S);
  if (controle) {
    const C = suite('Controle (página anterior: estas verificações DEVEM falhar em A, C, P e I)');
    await rodar(controle, 'controle', C);
    const falhas = C.fim();
    console.log(falhas > 0 ? 'Controle OK: a página anterior falha em ' + falhas + ' verificações (o teste distingue as duas).' : 'CONTROLE FALHOU: a página anterior passou em tudo.');
  }
  process.exit(S.fim() ? 1 : 0);
})().catch(erro => { console.error('FALHA-GERAL', erro); process.exit(3); });
