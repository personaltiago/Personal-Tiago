'use strict';
// Teste no Chrome do 1.12.317 (cronômetro livre ao lado do tempo da aula e "Última" nas séries por tempo), com o 1.12.316 como
// comparação. Sozinho: lê os pacotes da raiz e serve as páginas reais num servidor local. Aluno e ficha FICTÍCIOS. Sem rede,
// Firebase ou aparelho.
// Uso: node equipe/testes/navegador/cronometro-livre-317/cronometro-livre-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../../../..');
const SHOTS = process.argv[2] || '/tmp/t317';
const P317 = 'AgendaPersonal-1.12.317-Cronometro-Livre-Para-Assinar.agenda.json';
const P316 = 'AgendaPersonal-1.12.316-Smartwatch-No-Treino-Para-Assinar.agenda.json';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

const ex = (id, name, sets, reps, load, extra = {}) => ({id, name, sets, reps, load, rest: '60s', muscle: 'Core', category: 'Musculação', ...extra});
const BASE = {
  students: [{id: 'ana', name: 'Ana Teste', studentType: 'presencial', firebaseUid: ''}],
  lessons: [], occurrenceStatus: {}, payments: [], history: [], workoutDrafts: {}, lessonTimers: {},
  workoutExecutions: [{id: 'r1', studentId: 'ana', planId: 'p1', dayId: 'd1', date: '2026-11-20', finishedAt: '2026-11-20T10:00:00Z',
    exercises: [{exerciseId: 'e1', performedSets: [{round: 1, done: true, unit: 'seconds', seconds: 42, reps: 42, prescribedReps: '30s'}]},
      {exerciseId: 'e2', performedSets: [{round: 1, done: true, reps: 12, prescribedReps: '10'}]}]}],
  workoutPlans: [{id: 'p1', studentId: 'ana', name: 'Ficha A', organization: 'sequence', visibility: 'always', startDate: '2026-11-01', days: [
    {id: 'd1', name: 'Treino A', exercises: [ex('e1', 'Prancha', '2', '30s', ''), ex('e2', 'Remada Baixa', '2', '10', '25')]},
  ]}],
};

(async () => {
  const pacote = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  const p317 = pacote(P317), p316 = pacote(P316);
  const g = require(path.join(RAIZ, 'tools/gerar-cronometro-livre-1.12.317.cjs'));
  fs.mkdirSync(SHOTS, {recursive: true});

  // ---------------------------------------------------------------- 0. O que mudou
  const blocos = '<style id="ap-cronometro-livre-css">' + g.CSS + '</style>\n<script id="ap-cronometro-livre">' + g.JS + '\n</script>\n';
  const volta = p317.files['professor.html'].replace(blocos, '').replace(g.META_DEPOIS, () => g.META_ANTES);
  conferir('professor.html: sem os blocos novos e com o "Meta" de antes, é idêntico ao 1.12.316', volta === p316.files['professor.html']);
  conferir('os demais arquivos (incluindo o index.html do aluno) são idênticos', Object.keys(p316.files).every(f => f === 'professor.html' || p317.files[f] === p316.files[f]) && Object.keys(p317.files).length === Object.keys(p316.files).length);
  conferir('versão e sequência', p317.version === '1.12.317' && p317.sequence === 423 && !('agendaSignature' in p317));

  const paginas = {'/317.html': p317.files['professor.html'], '/316.html': p316.files['professor.html']};
  const servidor = http.createServer((req, res) => { const c = paginas[req.url.split('?')[0]]; if (c === undefined) { res.writeHead(404); return res.end(); } res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); res.end(c); });
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const URL = 'http://127.0.0.1:' + servidor.address().port;
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  const nova = async (url, rotulo, largura = 393) => {
    const ctx = await navegador.newContext({viewport: {width: largura, height: 873}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(rotulo + ': ' + e.message));
    pg.on('dialog', d => d.accept());
    await pg.addInitScript(e => {
      if (!localStorage.getItem('agendaPersonalTL_v1')) localStorage.setItem('agendaPersonalTL_v1', JSON.stringify(e));
      window.APaccounts = {isTeacher: () => true, teacherUid: () => '', stage() {}, refreshPreview() {}, knownAreas: () => [], status: () => null, retry() {}};
      window.Android = {syncLessonAlarms: () => true};
    }, BASE);
    await pg.goto(URL + url); await pg.waitForTimeout(900);
    return {ctx, pg};
  };
  const abrir = pg => pg.evaluate(() => { showScreen('workouts'); openWorkoutStudent('ana'); selectWorkoutPlan('p1'); openWorkoutDay('d1'); });
  // Treino em andamento: ao iniciar, o app já cria a contagem da aula (60 min sem aula na agenda).
  const comAula = pg => pg.evaluate(() => { startWorkoutSession(); openWorkoutDay('d1'); });
  const caixas = pg => pg.evaluate(() => {
    const g = document.querySelector('#workoutDayContent .ap-aula-cronos'); if (!g) return null;
    const r = el => { const c = el.getBoundingClientRect(); return {x: Math.round(c.left), y: Math.round(c.top), w: Math.round(c.width), h: Math.round(c.height), dentro: c.right <= innerWidth + 0.5}; };
    const aula = g.querySelector('.workout-countdown'), cr = g.querySelector('[data-cronolivre]');
    const sobra = el => [...el.querySelectorAll('*')].some(x => x.scrollWidth > x.clientWidth + 1 && getComputedStyle(x).overflow !== 'visible');
    return {so: g.classList.contains('ap-cronolivre-so'), aula: aula && r(aula), cr: cr && r(cr), tempo: cr?.querySelector('[data-cronolivre-tempo]').textContent, texto: cr?.querySelector('[data-cronolivre-texto]').textContent,
      botao: cr?.querySelector('[data-cronolivre-acao="alternar"]').textContent, zerar: cr?.querySelector('[data-cronolivre-acao="zerar"]').disabled, contagemAula: aula?.querySelector('.timer-count').textContent,
      paradaAula: aula && r(aula.querySelector('.lesson-timer-stop')), botoesCr: cr && [...cr.querySelectorAll('.btn')].map(r), cortado: (aula ? sobra(aula) : false) || (cr ? sobra(cr) : false)};
  });

  // ---------------------------------------------------------------- A. Treino em andamento com a contagem da aula
  {
    const {ctx, pg} = await nova('/317.html', '317');
    await abrir(pg); await pg.waitForTimeout(200);
    conferir('visualização do treino (antes de iniciar): sem cronômetro', (await caixas(pg)) === null);
    await comAula(pg); await pg.waitForTimeout(400);
    let c = await caixas(pg);
    conferir('tempo da aula e cronômetro lado a lado, mesma altura e largura parecida', c && !c.so && c.aula.y === c.cr.y && c.aula.h === c.cr.h && Math.abs(c.aula.w - c.cr.w) <= 2 && c.cr.x > c.aula.x && c.cr.dentro, JSON.stringify(c && {a: c.aula, c: c.cr}));
    conferir('cronômetro parado: 00:00, Iniciar, Zerar travado', c.tempo === '00:00' && c.botao === 'Iniciar' && c.zerar === true && c.texto === 'Livre, sem meta.', JSON.stringify(c));
    conferir('botões com 44 px de altura e nada cortado', c.paradaAula.h >= 44 && c.botoesCr.every(b => b.h >= 44) && !c.cortado, JSON.stringify(c.botoesCr));
    const aula1 = c.contagemAula; await pg.waitForTimeout(1300);
    c = await caixas(pg);
    conferir('a contagem da aula continua andando dentro do quadrado', aula1 === '60:00' && /^59:5\d$/.test(c.contagemAula), aula1 + ' → ' + c.contagemAula);
    await pg.evaluate(() => document.querySelector('#workoutDayContent .ap-aula-cronos').scrollIntoView({block: 'center'}));
    await pg.screenshot({path: SHOTS + '/317-parado.png'});
    await pg.click('[data-cronolivre-acao="alternar"]'); await pg.waitForTimeout(2300);
    c = await caixas(pg);
    conferir('Iniciar: conta para cima e o botão vira Pausar', c.tempo === '00:02' && c.botao === 'Pausar' && c.zerar === false && c.texto === 'Contando.', JSON.stringify({t: c.tempo, b: c.botao}));
    await pg.screenshot({path: SHOTS + '/317-contando.png'});
    await pg.click('[data-cronolivre-acao="alternar"]'); await pg.waitForTimeout(1200);
    c = await caixas(pg);
    conferir('Pausar: para no tempo e o botão vira Continuar', c.tempo === '00:02' && c.botao === 'Continuar' && c.texto === 'Pausado.', JSON.stringify({t: c.tempo, b: c.botao}));
    await pg.click('[data-cronolivre-acao="alternar"]'); await pg.waitForTimeout(1100);
    c = await caixas(pg);
    conferir('Continuar: volta a contar a partir do tempo pausado', c.tempo === '00:03' && c.botao === 'Pausar', c.tempo);
    // Continua com a página recarregada (guardado neste aparelho)
    await pg.reload(); await pg.waitForTimeout(900); await abrir(pg); await pg.waitForTimeout(1200);
    c = await caixas(pg);
    conferir('recarregar o app: o cronômetro continua contando', c && ['00:04', '00:05', '00:06'].includes(c.tempo) && c.botao === 'Pausar', c && c.tempo);
    // Mudar a tela do treino (marcar série) re-renderiza e o cronômetro continua
    await pg.click('[data-cronolivre-acao="zerar"]'); await pg.waitForTimeout(300);
    c = await caixas(pg);
    conferir('Zerar: volta a 00:00 e para', c.tempo === '00:00' && c.botao === 'Iniciar' && c.zerar === true);
    // A contagem e o despertador da aula não mudam: o Parar cronômetro é o mesmo botão de antes
    const parar = await pg.evaluate(() => { const b = document.querySelector('#workoutDayContent .ap-aula-cronos .lesson-timer-stop'); return b && b.getAttribute('onclick'); });
    conferir('o botão de parar a aula continua o mesmo (stopLessonTimer)', parar === 'stopLessonTimer(this.dataset.lessonId,this.dataset.classDate)', parar);
    // Série por tempo: "Última" no lugar da meta
    const series = await pg.evaluate(() => [...document.querySelectorAll('#workoutDayContent .ws-set-row')].map(r => ({ex: r.dataset.seriesExercise, round: r.dataset.seriesRound, alvo: r.querySelector('.ws-set-target')?.textContent, coluna: r.querySelector('.ws-set-previous')?.textContent})));
    const s = (e, n) => series.find(x => x.ex === e && x.round === String(n));
    conferir('série por tempo com resultado: "Última: 42 s" (igual à coluna Último treino)', s('e1', 1)?.alvo === 'Última: 42 s' && s('e1', 1)?.coluna === '42 s', JSON.stringify(s('e1', 1)));
    conferir('série por tempo sem resultado: "Última: —"', s('e1', 2)?.alvo === 'Última: —', JSON.stringify(s('e1', 2)));
    conferir('série por repetições: continua "Meta: 10"', s('e2', 1)?.alvo === 'Meta: 10' && s('e2', 2)?.alvo === 'Meta: 10', JSON.stringify(s('e2', 1)));
    await pg.evaluate(() => document.querySelector('#workoutDayContent .ws-set-row[data-series-exercise="e1"]').scrollIntoView({block: 'center'}));
    await pg.screenshot({path: SHOTS + '/317-serie-tempo.png'});
    // O cronômetro da série continua livre (sem parar nos 30 s) e grava o tempo como antes
    await pg.click('#workoutDayContent .ws-set-row[data-series-exercise="e1"][data-series-round="1"] .ws-time-button'); await pg.waitForTimeout(2200);
    await pg.click('#workoutDayContent .ws-set-row[data-series-exercise="e1"][data-series-round="1"] .ws-time-button'); await pg.waitForTimeout(300);
    const gravado = await pg.evaluate(() => state.workoutDrafts[workoutDraftKey('p1', 'd1')].values.e1?.series?.[1]);
    conferir('cronômetro da série: grava o tempo feito, como antes', gravado && gravado.done === true && [2, 3].includes(Number(gravado.reps)), JSON.stringify(gravado));
    await ctx.close();
  }

  // ---------------------------------------------------------------- B. Parar a contagem da aula: o cronômetro fica na largura toda
  {
    const {ctx, pg} = await nova('/317.html', '317 sem aula');
    await abrir(pg); await comAula(pg); await pg.waitForTimeout(300);
    await pg.click('#workoutDayContent .ap-aula-cronos .lesson-timer-stop'); await pg.waitForTimeout(400);
    const c = await caixas(pg), ativar = await pg.evaluate(() => [...document.querySelectorAll('#workoutDayContent .workout-actions .btn')].some(b => b.textContent.trim() === 'Ativar cronômetro'));
    conferir('Parar cronômetro (da aula) para a aula como antes e o cronômetro livre fica na largura toda', c && c.so && !c.aula && c.cr.w > 300 && ativar, JSON.stringify(c && c.cr));
    await ctx.close();
  }

  // ---------------------------------------------------------------- C. Tela estreita (320 px) e tela grande (430 px)
  for (const largura of [320, 430]) {
    const {ctx, pg} = await nova('/317.html', '317 ' + largura, largura);
    await abrir(pg); await comAula(pg); await pg.waitForTimeout(300);
    const c = await caixas(pg);
    const lado = largura >= 340;
    conferir(largura + ' px: ' + (lado ? 'lado a lado' : 'um embaixo do outro') + ', dentro da tela e nada cortado', c && c.cr.dentro && c.aula.dentro && !c.cortado && (lado ? c.aula.y === c.cr.y : c.cr.y > c.aula.y), JSON.stringify(c && {a: c.aula, c: c.cr}));
    await pg.evaluate(() => document.querySelector('#workoutDayContent .ap-aula-cronos').scrollIntoView({block: 'center'}));
    await pg.screenshot({path: SHOTS + '/317-' + largura + '.png'});
    await ctx.close();
  }

  // ---------------------------------------------------------------- D. 1.12.316: como era
  {
    const {ctx, pg} = await nova('/316.html', '316');
    await abrir(pg); await comAula(pg); await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => ({cronos: !!document.querySelector('.ap-aula-cronos'), alvo: document.querySelector('#workoutDayContent .ws-set-row[data-series-exercise="e1"] .ws-set-target')?.textContent}));
    conferir('no 1.12.316: sem cronômetro livre e com "Meta: 30s"', !r.cronos && r.alvo === 'Meta: 30s', JSON.stringify(r));
    await ctx.close();
  }

  conferir('sem erro de JavaScript nas páginas', erros.length === 0, erros.slice(0, 5).join(' | '));
  await navegador.close(); servidor.close();
  console.log('\n' + ok + '/' + (ok + falhas) + ' verificações' + (falhas ? ' — ' + falhas + ' FALHA(S)' : ''));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
