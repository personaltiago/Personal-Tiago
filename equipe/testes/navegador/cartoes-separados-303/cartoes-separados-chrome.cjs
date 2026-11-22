'use strict';
// Teste no Chrome do 1.12.303: "Tamanho das letras" e "Feedback" com cartões e telas próprios no Mais.
// Preparação: gere o 1.12.303 (tools/gerar-cartoes-separados-1.12.303.cjs), extraia professor.html do 1.12.302 e do 1.12.303 para
// /tmp/t302/<302|303>-professor.html e sirva a pasta: (cd /tmp/t302 && python3 -m http.server 8799 --bind 127.0.0.1)
// Uso: node cartoes-separados-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const SHOTS = process.argv[2] || '/tmp/t302';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

(async () => {
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  async function abrir(arquivo, preparar) {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 900}, deviceScaleFactor: 2});
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(arquivo + ': ' + e.message));
    if (preparar) await pg.addInitScript(preparar);
    await pg.goto('http://127.0.0.1:8799/' + arquivo);
    await pg.waitForTimeout(2500);
    return pg;
  }
  // Escolhas feitas no 1.12.302 (tamanho Grande e um nome) precisam continuar valendo no 1.12.303.
  const ANTES = () => {
    if (!localStorage.getItem('agendaPersonalTL_v1')) {
      localStorage.setItem('agendaPersonalTL_teacher_text_v1', JSON.stringify({version: 1, id: 'large'}));
      localStorage.setItem('agendaPersonalTL_v1', JSON.stringify({students: [], payments: [], history: [], trainerProfile: {name: 'Tiago', subtitle: 'Personal Trainer', feedbackName: 'Tiago Lima'}}));
    }
  };
  const pg = await abrir('303-professor.html', ANTES);
  await pg.evaluate(() => chooseTeacherAppearance('light'));
  await pg.evaluate(() => showScreen('more'));
  await pg.waitForTimeout(500);
  const grupo = await pg.evaluate(() => [...document.querySelectorAll('[data-more-group="appearance"] button.more-function')].map(c => ({t: c.querySelector('.more-function-copy strong').textContent, s: c.querySelector('.more-function-copy small').textContent, icone: c.querySelector('.more-function-icon svg')?.dataset.apMenuIcon || ''})));
  conferir('Mais → Aparência e preferências: os dois cartões novos, cada um com o seu ícone',
    JSON.stringify(grupo.map(g => g.t)) === JSON.stringify(['Painel de cores', 'Tamanho das letras', 'Sons e alertas', 'Configurações', 'Feedback', 'Pet'])
    && grupo.find(g => g.t === 'Tamanho das letras').icone === 'menu-text' && grupo.find(g => g.t === 'Feedback').icone === 'menu-feedback', JSON.stringify(grupo));
  await pg.locator('[data-more-group="appearance"]').screenshot({path: SHOTS + '/303-mais-aparencia.png'});

  // Configurações não tem mais os dois cartões
  await pg.evaluate(() => showScreen('settings'));
  await pg.waitForTimeout(300);
  const config = await pg.evaluate(() => ({letras: !!document.querySelector('#screen-settings [data-teacher-text]'), nome: !!document.querySelector('#screen-settings #feedbackNameForm'),
    sub: document.querySelector('#screen-settings .module-heading p').textContent, despertador: !!document.querySelector('#screen-settings .alarm-tools'), sons: document.querySelectorAll('#screen-settings .ap-audio-settings').length}));
  conferir('Configurações fica só com despertador e sons', !config.letras && !config.nome && config.despertador && config.sons > 0 && config.sub === 'Despertador e os sons das aulas e do descanso do treino.', JSON.stringify(config));

  // Cartão Tamanho das letras → tela própria; a escolha antiga vale; trocar grava; Voltar volta ao Mais
  await pg.evaluate(() => showScreen('more'));
  await pg.waitForTimeout(300);
  // O Mais pede dois toques (o primeiro destaca o cartão, o segundo abre), como em todos os cartões.
  await pg.click('#moreTextSize');
  await pg.waitForTimeout(300);
  await pg.click('#moreTextSize');
  await pg.waitForTimeout(400);
  const letras = await pg.evaluate(() => ({ativa: document.querySelector('.screen.active')?.id, titulo: document.querySelector('#screen-text-size h2').textContent,
    marcado: document.querySelector('#screen-text-size [data-teacher-text][aria-pressed="true"]')?.dataset.teacherText, botoes: document.querySelectorAll('#screen-text-size [data-teacher-text]').length}));
  conferir('Tamanho das letras abre a tela própria, com a escolha antiga (Grande) marcada', letras.ativa === 'screen-text-size' && letras.titulo === 'Tamanho das letras' && letras.marcado === 'large' && letras.botoes === 3, JSON.stringify(letras));
  await pg.locator('#screen-text-size').screenshot({path: SHOTS + '/303-tela-letras.png'});
  await pg.click('#screen-text-size [data-teacher-text="xlarge"]');
  await pg.waitForTimeout(300);
  const troca = await pg.evaluate(() => ({html: document.documentElement.dataset.teacherTextSize, salvo: JSON.parse(localStorage.getItem('agendaPersonalTL_teacher_text_v1')).id, status: document.getElementById('teacherTextStatus').textContent}));
  conferir('trocar para Extra grande grava e aplica', troca.html === 'xlarge' && troca.salvo === 'xlarge' && troca.status === 'Tamanho salvo: Extra grande.', JSON.stringify(troca));
  await pg.click('#screen-text-size [data-teacher-text="normal"]');
  await pg.waitForTimeout(200);
  await pg.click('#panelReturnBar button, #panelReturnBar [data-return], #panelReturnBar a').catch(() => pg.evaluate(() => document.querySelector('#panelReturnBar button')?.click()));
  await pg.waitForTimeout(400);
  conferir('Voltar sai de Tamanho das letras para o Mais', await pg.evaluate(() => document.querySelector('.screen.active')?.id) === 'screen-more', await pg.evaluate(() => document.querySelector('.screen.active')?.id));

  // Cartão Feedback → tela própria; o nome antigo aparece; salvar continua funcionando
  await pg.click('#moreFeedbackSettings');
  await pg.waitForTimeout(300);
  await pg.click('#moreFeedbackSettings');
  await pg.waitForTimeout(400);
  const fb = await pg.evaluate(() => ({ativa: document.querySelector('.screen.active')?.id, titulo: document.querySelector('#screen-feedback-settings h2').textContent,
    valor: document.getElementById('feedbackNameInput').value, previa: document.getElementById('feedbackNamePreview').textContent}));
  conferir('Feedback abre a tela própria com o nome já salvo', fb.ativa === 'screen-feedback-settings' && fb.titulo === 'Feedback' && fb.valor === 'Tiago Lima' && fb.previa === 'No cartão: Tiago Lima · Acompanhamento de treino.', JSON.stringify(fb));
  await pg.fill('#feedbackNameInput', 'Studio Tiago');
  await pg.press('#feedbackNameInput', 'Enter');
  await pg.waitForTimeout(400);
  const fb2 = await pg.evaluate(() => ({fn: window.APFeedbackName(), status: document.getElementById('feedbackNameStatus').textContent}));
  conferir('salvar o nome na tela Feedback', fb2.fn === 'Studio Tiago' && fb2.status === 'Salvo. Os alunos recebem o nome na próxima sincronização.', JSON.stringify(fb2));
  await pg.locator('#screen-feedback-settings').screenshot({path: SHOTS + '/303-tela-feedback.png'});
  await pg.evaluate(() => document.querySelector('#panelReturnBar button')?.click());
  await pg.waitForTimeout(400);
  conferir('Voltar sai de Feedback para o Mais', await pg.evaluate(() => document.querySelector('.screen.active')?.id) === 'screen-more');

  // Acabamento 3D (matte): os ícones novos recebem o mesmo tratamento dos outros
  const pgm = await abrir('303-professor.html', () => { try { localStorage.setItem('agendaPersonalTL_icon_finish_test', '1'); } catch (_) {} });
  await pgm.evaluate(() => chooseTeacherAppearance('light'));
  await pgm.evaluate(() => { document.documentElement.dataset.agendaIconFinish = 'matte'; showScreen('more'); });
  await pgm.waitForTimeout(800);
  const deco = await pgm.evaluate(() => Object.fromEntries(['moreTextSize', 'moreFeedbackSettings', 'moreThemeButton'].map(id => { const s = document.querySelector('#' + id + ' .more-function-icon svg'); return [id, {icone: s?.dataset.apMenuIcon, deep: s?.hasAttribute('data-deep-decorated') || false}]; })));
  conferir('acabamento 3D: os ícones novos são decorados como os outros', deco.moreTextSize.deep === deco.moreThemeButton.deep && deco.moreFeedbackSettings.deep === deco.moreThemeButton.deep, JSON.stringify(deco));
  await pgm.locator('[data-more-group="appearance"]').screenshot({path: SHOTS + '/303-mais-aparencia-3d.png'});

  // 1.12.302 continua igual no que não mudou: as escolhas ficam nas mesmas chaves (comparação com o 302)
  const p302 = await abrir('302-professor.html', ANTES);
  const chaves = await p302.evaluate(() => ({texto: localStorage.getItem('agendaPersonalTL_teacher_text_v1'), nome: window.APFeedbackName()}));
  conferir('as escolhas usam as mesmas chaves do 1.12.302', chaves.texto === JSON.stringify({version: 1, id: 'large'}) && chaves.nome === 'Tiago Lima', JSON.stringify(chaves));

  conferir('sem erros de JavaScript', erros.length === 0, erros.slice(0, 3).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
