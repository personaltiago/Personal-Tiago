'use strict';
// Teste no Chrome do 1.12.310 ("Sons e alertas" no Mais), com o 1.12.309 como comparação.
// Preparação: extraia professor.html do 1.12.309 e do 1.12.310 para /tmp/t309/<309|310>-professor.html e sirva a pasta:
//   (cd /tmp/t309 && python3 -m http.server 8799 --bind 127.0.0.1)
// Uso: node sons-e-alertas-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const SHOTS = process.argv[2] || '/tmp/t309';
const BASE = 'http://127.0.0.1:8799/';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

(async () => {
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  async function abrir(versao) {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 915}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(versao + ': ' + e.message));
    await pg.addInitScript(() => {
      localStorage.setItem('agendaPersonalTL_v1', JSON.stringify({students: [{id: 'ana', name: 'Ana Teste', studentType: 'presencial'}], lessons: [], occurrenceStatus: {}, payments: [], history: [], workoutPlans: [], trainerProfile: {name: 'Tiago Lima'}}));
      window.APaccounts = {isTeacher: () => true, teacherUid: () => 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1', stage() {}, refreshPreview() {}, knownAreas: () => [], status: () => null, retry() {}};
    });
    await pg.goto(BASE + versao + '-professor.html');
    await pg.waitForTimeout(1500);
    return pg;
  }
  // Os cartões visíveis de cada grupo do Mais, na ordem, e o conteúdo da tela (sem o título)
  const mais = pg => pg.evaluate(async () => {
    showScreen('more'); await new Promise(r => setTimeout(r, 400));
    const grupos = {};
    for (const g of document.querySelectorAll('#screen-more .ap-more-group')) if (!g.hidden) grupos[g.querySelector('h3').textContent] = [...g.querySelectorAll('button.more-function')].filter(b => b.getBoundingClientRect().height > 0).map(b => b.querySelector('.more-function-copy strong')?.textContent + ' | ' + b.querySelector('.more-function-copy small')?.textContent);
    return grupos;
  });
  const tela = pg => pg.evaluate(() => { const s = document.getElementById('screen-settings').cloneNode(true); s.querySelector('h2').textContent = ''; return s.innerHTML; });
  // Toca no cartão como no celular: o primeiro toque destaca, o segundo abre
  const tocar = async (pg, seletor) => {
    await pg.evaluate(() => { showScreen('more'); window.scrollTo(0, 0); });
    await pg.waitForTimeout(300);
    const cartao = pg.locator(seletor);
    await cartao.scrollIntoViewIfNeeded();
    await cartao.tap(); await pg.waitForTimeout(250);
    const destacado = await pg.evaluate(s => ({aberta: document.getElementById('screen-settings').classList.contains('active'), marcado: document.querySelector(s).getAttribute('aria-pressed')}), seletor);
    await cartao.tap(); await pg.waitForTimeout(600);
    return {destacado, ...await pg.evaluate(() => {
      const r = el => { const b = el.getBoundingClientRect(); return {top: Math.round(b.top), bottom: Math.round(b.bottom)}; };
      return {aberta: document.getElementById('screen-settings').classList.contains('active'), titulo: document.querySelector('#screen-settings h2').textContent,
        despertador: r(document.getElementById('alarmSettingsButton')), descanso: r(document.querySelector('[data-phone-ringtone="rest"]')), altura: innerHeight};
    })};
  };
  const naTela = x => x.top >= 0 && x.bottom <= 915;

  // ------------------------------------------------------------ 1.12.309: os dois cartões abrem a mesma tela
  const v = await abrir('309');
  const m309 = await mais(v);
  const tela309 = await tela(v);
  const aparencia309 = m309['Aparência e preferências'] || [];
  conferir('1.12.309: "Sons e alertas" e "Configurações" no Mais', aparencia309.some(t => t.startsWith('Sons e alertas |')) && aparencia309.some(t => t.startsWith('Configurações |')), JSON.stringify(aparencia309));
  const sons309 = await tocar(v, '#moreLessonSounds');
  conferir('1.12.309: "Sons e alertas" abre a tela Configurações rolada até o som do descanso', sons309.aberta && sons309.titulo === 'Configurações' && !naTela(sons309.despertador) && naTela(sons309.descanso), JSON.stringify(sons309));
  const config309 = await tocar(v, '#screen-more button.more-function[data-screen="settings"]:not(#moreLessonSounds)');
  conferir('1.12.309: "Configurações" abre a mesma tela, no topo', config309.aberta && config309.titulo === 'Configurações' && naTela(config309.despertador), JSON.stringify(config309));
  await v.context().close();

  // ------------------------------------------------------------ 1.12.310: só "Sons e alertas"
  const pg = await abrir('310');
  const m310 = await mais(pg);
  const tela310 = await tela(pg); // no mesmo momento do 1.12.309: antes de abrir a tela
  const aparencia = m310['Aparência e preferências'] || [];
  conferir('Aparência e preferências: Painel de cores, Tamanho das letras, Sons e alertas, Feedback, Pet (sem Configurações)',
    JSON.stringify(aparencia.map(t => t.split(' | ')[0])) === JSON.stringify(['Painel de cores', 'Tamanho das letras', 'Sons e alertas', 'Feedback', 'Pet']), JSON.stringify(aparencia));
  conferir('legenda nova: "Despertador e sons das aulas e do treino."', aparencia.includes('Sons e alertas | Despertador e sons das aulas e do treino.'), JSON.stringify(aparencia));
  const todos = o => Object.values(o).flat().map(t => t.split(' | ')[0]).sort();
  const sumiram = todos(m309).filter(t => !todos(m310).includes(t)), novos = todos(m310).filter(t => !todos(m309).includes(t));
  conferir('o resto do Mais não muda: só "Configurações" saiu', JSON.stringify(sumiram) === '["Configurações"]' && novos.length === 0 && JSON.stringify(Object.keys(m309)) === JSON.stringify(Object.keys(m310)), JSON.stringify({sumiram, novos, grupos: Object.keys(m310)}));
  const nome = await pg.evaluate(() => { const b = document.getElementById('moreLessonSounds'); return {aria: b.getAttribute('aria-label'), onclick: b.getAttribute('onclick'), tela: b.dataset.screen}; });
  conferir('o cartão abre pela navegação de sempre (data-screen) e o nome lido é o texto visível', nome.aria === null && nome.onclick === null && nome.tela === 'settings', JSON.stringify(nome));
  const sons = await tocar(pg, '#moreLessonSounds');
  conferir('primeiro toque só destaca o cartão (como os outros)', !sons.destacado.aberta && sons.destacado.marcado === 'true', JSON.stringify(sons.destacado));
  conferir('segundo toque abre "Sons e alertas" no topo, com o Despertador à vista', sons.aberta && sons.titulo === 'Sons e alertas' && naTela(sons.despertador), JSON.stringify(sons));
  conferir('o conteúdo da tela (Despertador e os 5 sons) é idêntico ao do 1.12.309; só o título muda', tela310 === tela309, tela310.length + ' × ' + tela309.length);
  await pg.screenshot({path: SHOTS + '/310-sons-e-alertas.png'});
  await pg.evaluate(() => showScreen('more')); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const g = [...document.querySelectorAll('#screen-more .ap-more-group')].find(x => x.querySelector('h3').textContent === 'Aparência e preferências'); g.scrollIntoView({block: 'start'}); });
  await pg.waitForTimeout(300);
  await pg.screenshot({path: SHOTS + '/310-mais.png'});
  conferir('o menu antigo escondido (#proMoreMenu) continua escondido e com os atalhos de antes', await pg.evaluate(() => { const p = document.getElementById('proMoreMenu'); return getComputedStyle(p).display === 'none' && !!p.querySelector('[data-screen="settings"]') && !!p.querySelector('#moreProLessonSounds'); }));
  await pg.context().close();

  conferir('sem erros de JavaScript', erros.length === 0, erros.slice(0, 4).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
