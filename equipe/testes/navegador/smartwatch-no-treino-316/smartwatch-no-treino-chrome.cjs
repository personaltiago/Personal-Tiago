'use strict';
// Teste no Chrome do 1.12.316 (Smartwatch no treino: chave "Usar smartwatch", ícone no treino, primeiro exercício ao iniciar e a
// próxima série no fim do descanso), com o 1.12.315 como comparação. Sozinho: lê os pacotes da raiz, serve as páginas reais num
// servidor local e simula o Android 1.213 (a ponte do aviso no relógio do 1.212 e o getWatchStatus do Wear OS). Aluno e ficha
// FICTÍCIOS. Não usa rede, Firebase, aparelho nem relógio.
// Uso: node equipe/testes/navegador/smartwatch-no-treino-316/smartwatch-no-treino-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../../../..');
const SHOTS = process.argv[2] || '/tmp/t316';
const P316 = 'AgendaPersonal-1.12.316-Smartwatch-No-Treino-Para-Assinar.agenda.json';
const P315 = 'AgendaPersonal-1.12.315-Criar-Treino-Manual-Para-Assinar.agenda.json';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };
const espera = ms => new Promise(r => setTimeout(r, ms));

// Android 1.213 de mentira: a ponte do aviso no relógio (MainActivity.Bridge) e o getWatchStatus do Wear OS.
const androidFalso = ({estado, wear}) => {
  window.__relogio = {estado: Object.assign({versao: 1, app: '1.213', ativo: false, permissao: true, canal: 'ausente', exato: true}, estado || {}),
    marcados: [], cancelados: [], testes: 0, ajustes: 0, ligar: [], wear: wear || {state: 'unavailable', nodes: []}, enviosWear: 0};
  const r = window.__relogio;
  try { const salvo = JSON.parse(sessionStorage.getItem('__relogio') || 'null'); if (salvo) Object.assign(r.estado, salvo); } catch (e) {}
  window.Android = {
    syncLessonAlarms: () => true,
    getWatchNoticeVersion: () => 1,
    getWatchNoticeStatus: () => JSON.stringify(r.estado),
    setWatchNoticeEnabled: on => { r.ligar.push(on); r.estado.ativo = !!on; if (on && r.estado.canal === 'ausente') r.estado.canal = 'alerta'; sessionStorage.setItem('__relogio', JSON.stringify(r.estado)); return true; },
    scheduleWatchNotice: (k, at, json) => { if (!r.estado.ativo || at <= Date.now() || at > Date.now() + 7200000) return false; r.marcados.push({k, at, em: Date.now(), ...JSON.parse(json)}); return true; },
    cancelWatchNotice: k => { r.cancelados.push(k); },
    testWatchNotice: () => { r.testes++; return true; },
    openWatchNoticeSettings: () => { r.ajustes++; },
    getWatchStatus: () => JSON.stringify({message: '', connection: r.wear, results: []}),
  };
};
const ex = (id, name, sets, reps, load, extra = {}) => ({id, name, sets, reps, load, rest: '60s', muscle: 'Costas', category: 'Musculação', ...extra});
const BASE_PROF = {
  students: [{id: 'ana', name: 'Ana Teste', studentType: 'presencial', firebaseUid: ''}],
  lessons: [], occurrenceStatus: {}, payments: [], history: [], workoutExecutions: [], workoutDrafts: {},
  workoutPlans: [{id: 'p1', studentId: 'ana', name: 'Ficha A', organization: 'sequence', visibility: 'always', startDate: '2026-11-01', days: [
    {id: 'd1', name: 'Treino A', exercises: [ex('e1', 'Supino Inclinado Articulado', '3', '10', '30'), ex('e2', 'Remada Baixa', '3', '10-12', '25kg')]},
    {id: 'd2', name: 'Treino B', exercises: [ex('e6', 'Supino', '3', '10', '20'), ex('e7', 'Remada', '3', '10', '30')], bisets: [{id: 'g1', exerciseIds: ['e6', 'e7'], rounds: 3, restSeconds: 60}]},
    {id: 'd3', name: 'Treino C', exercises: [ex('e11', 'Puxada Frontal', '2', '12', '35'), ex('e12', 'Esteira', '1', '1200 s', '', {category: 'Cardio', durationSeconds: 1200})]},
  ]}],
};

(async () => {
  const pacote = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  const p316 = pacote(P316), p315 = pacote(P315);
  const g = require(path.join(RAIZ, 'tools/gerar-smartwatch-no-treino-1.12.316.cjs'));
  const g313 = require(path.join(RAIZ, 'tools/gerar-aviso-relogio-1.12.313.cjs'));
  fs.mkdirSync(SHOTS, {recursive: true});

  // ---------------------------------------------------------------- 0. Só os dois blocos do relógio mudam
  const novos = '<style id="ap-aviso-relogio-css">' + g.CSS + '</style>\n<script id="ap-aviso-relogio">' + g.JS + '\n</script>\n';
  const velhos = '<style id="ap-aviso-relogio-css">' + g313.CSS + '</style>\n<script id="ap-aviso-relogio">' + g313.JS + '\n</script>\n';
  for (const f of ['index.html', 'professor.html']) {
    conferir(f + ': os dois blocos novos aparecem uma vez', p316.files[f].split(novos).length === 2);
    conferir(f + ': com os blocos de antes no lugar, é idêntico ao 1.12.315', p316.files[f].replace(novos, () => velhos) === p315.files[f]);
  }
  conferir('os demais arquivos são idênticos ao 1.12.315', Object.keys(p315.files).every(f => ['index.html', 'professor.html'].includes(f) || p316.files[f] === p315.files[f]) && Object.keys(p316.files).length === Object.keys(p315.files).length);
  conferir('versão e sequência', p316.version === '1.12.316' && p316.sequence === 422 && !('agendaSignature' in p316));

  const paginas = {'/316-professor.html': p316.files['professor.html'], '/316-index.html': p316.files['index.html'], '/315-professor.html': p315.files['professor.html']};
  const servidor = http.createServer((req, res) => {
    const corpo = paginas[req.url.split('?')[0]];
    if (corpo === undefined) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); res.end(corpo);
  });
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const BASE = 'http://127.0.0.1:' + servidor.address().port;
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  const novaPagina = async (url, init, rotulo, prof) => {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 915}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(rotulo + ': ' + e.message + (process.env.PILHA ? ' @ ' + String(e.stack).slice(0, 700) : '')));
    pg.on('dialog', d => d.accept());
    if (prof) await pg.addInitScript(e => {
      if (!localStorage.getItem('agendaPersonalTL_v1')) localStorage.setItem('agendaPersonalTL_v1', JSON.stringify(e));
      window.APaccounts = {isTeacher: () => true, teacherUid: () => '', stage() {}, refreshPreview() {}, knownAreas: () => [], status: () => null, retry() {}};
    }, BASE_PROF);
    if (init) await pg.addInitScript(androidFalso, init);
    await pg.goto(BASE + url); await pg.waitForTimeout(900);
    return {ctx, pg};
  };
  const r = pg => pg.evaluate(() => JSON.parse(JSON.stringify(window.__relogio)));
  const ultimo = (lista, titulo) => lista.filter(m => m.titulo === titulo).at(-1);
  const painel = pg => pg.evaluate(() => {
    const d = document.getElementById('apAvisoRelogio'); if (!d) return null;
    const q = s => d.querySelector(s), ret = q('[data-relogio-retorno]');
    return {aberto: d.open, rapido: d.classList.contains('ap-relogio-rapido'), estado: q('[data-relogio-estado]')?.textContent || '', rotulo: q('[data-relogio-previa-rotulo]')?.textContent ?? null,
      previa: q('[data-relogio-previa]') ? q('[data-relogio-previa]').textContent.replace(/\u00a0/g, ' ') : null, nbsp: /\u00a0/.test(q('[data-relogio-previa]')?.textContent || ''), agoraDesligado: q('[data-relogio-agora]')?.disabled ?? null, nota: q('[data-relogio-nota]')?.textContent || '',
      retorno: ret && !ret.hidden ? ret.textContent : '', chave: q('[data-relogio-ligar]') ? {ligado: q('[data-relogio-ligar]').checked, rotulo: q('.ap-relogio-chave strong').textContent, sub: q('.ap-relogio-chave small').textContent} : null,
      opcoes: q('#apRelogioMarca') ? [...q('#apRelogioMarca').options].map(o => o.value) : null, larguraOk: d.getBoundingClientRect().width <= innerWidth && d.scrollWidth <= d.clientWidth + 1, foco: document.activeElement?.id || ''};
  });
  const iconeProf = pg => pg.evaluate(() => { const b = document.querySelector('#workoutDayContent .ap-watch-session-heading .ap-watch-send-icon'); if (!b) return null; const c = b.getBoundingClientRect(); return {display: getComputedStyle(b).display, w: c.width, h: c.height, dentro: c.right <= innerWidth}; });
  async function series(pg, exId, linhas) {
    for (let i = 0; i < linhas.length; i++) {
      const [round, reps, carga] = linhas[i];
      await pg.evaluate(([e, rd, rep, c]) => {
        const row = document.querySelector('#workoutDayContent .ws-set-row[data-series-exercise="' + e + '"][data-series-round="' + rd + '"]');
        const repsInput = row.querySelector('[data-series-field="reps"]'), loadInput = row.querySelector('[data-series-field="load"]');
        repsInput.value = String(rep); saveWorkoutSeriesInput(repsInput);
        if (c !== null) { loadInput.value = String(c); saveWorkoutSeriesInput(loadInput); }
        const fresh = document.querySelector('#workoutDayContent .ws-set-row[data-series-exercise="' + e + '"][data-series-round="' + rd + '"] input[type=checkbox]');
        fresh.checked = true; completeWorkoutSeriesCheck(fresh);
      }, [exId, round, reps, carga]);
      await pg.waitForTimeout(80);
    }
  }
  const abrirDia = (pg, dia) => pg.evaluate(d => { showScreen('workouts'); openWorkoutStudent('ana'); selectWorkoutPlan('p1'); openWorkoutDay(d); }, dia);

  // ---------------------------------------------------------------- A. Professor, Android 1.213, smartwatch desligado → ligado
  {
    const {ctx, pg} = await novaPagina('/316-professor.html', {estado: {}}, 'professor', true);
    await pg.evaluate(() => { window.__envioWear = 0; window.APsendTeacherWatchWorkout = () => { window.__envioWear++; }; });
    let card = await pg.evaluate(() => document.querySelector('#moreSmartwatch .more-function-copy small')?.textContent);
    conferir('Mais > Smartwatch mostra "Desligado"', card === 'Desligado. Toque para ligar.', card);
    conferir('desligado: marca na página', await pg.evaluate(() => document.documentElement.dataset.apRelogio === 'desligado'));
    await abrirDia(pg, 'd1'); await pg.evaluate(() => startWorkoutSession()); await pg.waitForTimeout(400);
    let i = await iconeProf(pg);
    conferir('treino em andamento, smartwatch desligado: ícone escondido', i && i.display === 'none', JSON.stringify(i));
    await pg.waitForTimeout(1700);
    conferir('desligado: nada é mandado ao iniciar o treino', (await r(pg)).marcados.length === 0);

    // Ligar pela tela do Mais (a mesma do cartão)
    await pg.evaluate(() => window.APAvisoRelogio.abrir()); await pg.waitForTimeout(200);
    let d = await painel(pg);
    conferir('tela Smartwatch: chave "Usar smartwatch"', d && d.chave && d.chave.rotulo === 'Usar smartwatch' && d.chave.sub === 'Ícone no treino e avisos no relógio' && !d.chave.ligado, JSON.stringify(d && d.chave));
    conferir('tela Smartwatch: 9 marcas, com Colmi/Pubu Wear', d && d.opcoes.length === 9 && d.opcoes[1] === 'pubu', JSON.stringify(d && d.opcoes));
    await pg.selectOption('#apRelogioMarca', 'pubu'); await pg.waitForTimeout(80);
    const passo = await pg.evaluate(() => document.querySelector('[data-relogio-passo]').textContent);
    conferir('passo a passo do Pubu Wear', passo.startsWith('No app do relógio (Pubu Wear, Da Fit') && passo.includes('Outro software'), passo);
    await pg.click('#apRelogioLigar'); await pg.waitForTimeout(200);
    d = await painel(pg);
    conferir('ligado: texto novo, sem "sem som" (app 1.213)', d.chave.ligado && d.estado === 'Ligado. O relógio recebe o primeiro exercício ao iniciar o treino e a próxima série no fim de cada descanso.', d.estado);
    await pg.evaluate(() => document.querySelector('#apAvisoRelogio').scrollTo(0, 0));
    await pg.screenshot({path: SHOTS + '/316-professor-smartwatch-ligado.png'});
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
    card = await pg.evaluate(() => document.querySelector('#moreSmartwatch .more-function-copy small')?.textContent);
    conferir('Mais > Smartwatch mostra "Ligado"', card === 'Ligado. Treino e descanso no relógio.', card);
    i = await iconeProf(pg);
    conferir('ligado: o ícone do relógio volta ao Treino em andamento (44 × 44, dentro da tela)', i && i.display !== 'none' && i.w === 44 && i.h === 44 && i.dentro, JSON.stringify(i));
    await pg.evaluate(() => document.querySelector('#workoutDayContent .ap-watch-session-heading').scrollIntoView({block: 'center'}));
    await pg.screenshot({path: SHOTS + '/316-professor-treino-icone.png'});

    // Início do treino (começou há menos de 1 min): o relógio recebe o primeiro exercício, uma vez.
    await pg.waitForTimeout(1700);
    let e = await r(pg), ini = ultimo(e.marcados, 'Treino iniciado');
    conferir('ao iniciar o treino: primeiro exercício com série, repetições e carga', ini && ini.k === 'professor' && ini.texto === 'Ana Teste · Supino Inclinado Articulado · série 1 de 3 · 10 reps · 30 kg', JSON.stringify(ini));
    conferir('o aviso do início sai 5 s depois', ini && Math.abs(ini.at - ini.em - 5000) < 50, ini && String(ini.at - ini.em));
    await pg.waitForTimeout(1700);
    conferir('o início é mandado uma vez só', (await r(pg)).marcados.filter(m => m.titulo === 'Treino iniciado').length === 1);

    // Toque no ícone: painel (e não o envio ao app Wear OS, que não está instalado)
    await pg.click('#workoutDayContent .ap-watch-session-heading .ap-watch-send-icon'); await pg.waitForTimeout(250);
    d = await painel(pg);
    conferir('toque no ícone abre o painel do smartwatch', d && d.aberto && d.rapido, JSON.stringify(d));
    conferir('não chama o envio ao app Wear OS', (await pg.evaluate(() => window.__envioWear)) === 0);
    conferir('painel: mostra o exercício agora', d && d.rotulo === 'Exercício agora' && d.previa === 'Ana Teste · Supino Inclinado Articulado · série 1 de 3 · 10 reps · 30 kg' && d.agoraDesligado === false, JSON.stringify(d && {r: d.rotulo, p: d.previa}));
    conferir('painel: foco no título e cabe na tela', d && d.foco === 'apRelogioTitulo' && d.larguraOk);
    conferir('painel: estado curto, e "30 kg" não quebra a linha', d && d.estado === 'Smartwatch ligado.' && d.nbsp, d && d.estado);
    const bts = await pg.evaluate(() => [...document.querySelectorAll('#apAvisoRelogio .ap-watch-actions button')].map(b => { const c = b.getBoundingClientRect(); return [b.textContent, Math.round(c.width), Math.round(c.top), Math.round(c.height)]; }));
    conferir('painel: Mandar ao relógio na largura toda; Ajustes e Fechar lado a lado, mesma largura e altura', bts.length === 3 && bts[1][2] === bts[2][2] && bts[1][1] === bts[2][1] && bts[1][3] === bts[2][3] && bts[0][1] > bts[1][1] * 1.9 && bts[1][2] > bts[0][2], JSON.stringify(bts));
    await pg.screenshot({path: SHOTS + '/316-professor-painel.png'});
    await pg.click('[data-relogio-agora]'); await pg.waitForTimeout(150);
    e = await r(pg); d = await painel(pg); let ag = ultimo(e.marcados, 'Agora no treino');
    conferir('Mandar ao relógio: aviso com o exercício agora, em 5 s', ag && ag.k === 'professor' && ag.texto === d.previa && Math.abs(ag.at - ag.em - 5000) < 50, JSON.stringify(ag));
    conferir('Mandar ao relógio: retorno', d.retorno === 'Mandado. Em 5 segundos chega no relógio.', d.retorno);
    await pg.click('[data-relogio-tela]'); await pg.waitForTimeout(200);
    d = await painel(pg);
    conferir('Ajustes do smartwatch abre a tela completa', d && !d.rapido && d.chave && d.chave.ligado);
    const voltar = await pg.evaluate(() => ({r: handleAgendaSystemBack(), tela: !!document.getElementById('apAvisoRelogio'), treino: document.getElementById('workoutDayDialog').classList.contains('open')}));
    conferir('voltar do Android: fecha só a tela Smartwatch, o treino continua aberto', voltar.r === true && !voltar.tela && voltar.treino, JSON.stringify(voltar));
    await pg.click('#workoutDayContent .ap-watch-session-heading .ap-watch-send-icon'); await pg.waitForTimeout(200);
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
    const esc = await pg.evaluate(() => ({tela: !!document.getElementById('apAvisoRelogio'), treino: document.getElementById('workoutDayDialog').classList.contains('open')}));
    conferir('Esc: fecha só o painel, o treino continua aberto', !esc.tela && esc.treino, JSON.stringify(esc));

    // Série 1 feita → descanso automático → o aviso do fim traz a série 2
    await series(pg, 'e1', [[1, 10, 30]]);
    await pg.waitForTimeout(1700);
    e = await r(pg);
    const descanso = await pg.evaluate(() => state.workoutRest && {ex: state.workoutRest.exerciseId, fim: state.workoutRest.endAt});
    let fimD = ultimo(e.marcados, 'Fim do descanso');
    conferir('descanso começou sozinho depois da série', descanso && descanso.ex === 'e1', JSON.stringify(descanso));
    conferir('fim do descanso: próxima série do mesmo exercício', fimD && fimD.at === descanso?.fim && fimD.texto === 'Ana Teste · Supino Inclinado Articulado · série 2 de 3 · 10 reps · 30 kg', JSON.stringify(fimD));
    // Durante o descanso o painel mostra o aviso do fim e não deixa mandar outro (substituiria o do descanso).
    await pg.click('#workoutDayContent .ap-watch-session-heading .ap-watch-send-icon'); await pg.waitForTimeout(250);
    d = await painel(pg);
    conferir('painel no descanso: mostra o aviso do fim e trava o Mandar', d && /^No fim do descanso, em \d+:\d\d$/.test(d.rotulo) && d.previa === fimD?.texto && d.agoraDesligado === true && d.nota.startsWith('Durante o descanso'), JSON.stringify(d && {r: d.rotulo, p: d.previa, b: d.agoraDesligado}));
    await pg.screenshot({path: SHOTS + '/316-professor-painel-descanso.png'});
    await pg.evaluate(() => window.APAvisoRelogio.fechar());
    // Mudou a carga da próxima série durante o descanso: o aviso é marcado de novo com a carga nova.
    await pg.evaluate(() => { const inp = document.querySelector('#workoutDayContent .ws-set-row[data-series-exercise="e1"][data-series-round="2"] [data-series-field="load"]'); inp.value = '32,5'; saveWorkoutSeriesInput(inp); });
    await pg.waitForTimeout(1700);
    fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('carga da série seguinte mudou no descanso: aviso atualizado', fimD && fimD.texto === 'Ana Teste · Supino Inclinado Articulado · série 2 de 3 · 10 reps · 32,5 kg', JSON.stringify(fimD));
    // Exercício terminado → o aviso traz o próximo
    await series(pg, 'e1', [[2, 10, '32,5'], [3, 9, '32,5']]);
    await pg.waitForTimeout(1700);
    fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('exercício terminado: o aviso traz o próximo exercício', fimD && fimD.texto === 'Ana Teste · Próximo: Remada Baixa · série 1 de 3 · 10-12 reps · 25kg', JSON.stringify(fimD));
    // Parar o descanso antes do fim desmarca (como no 1.12.313)
    const cAntes = (await r(pg)).cancelados.length;
    await pg.evaluate(() => stopWorkoutRest()); await pg.waitForTimeout(1700);
    e = await r(pg);
    conferir('descanso parado antes do fim: desmarca', e.cancelados.length === cAntes + 1 && e.cancelados.at(-1) === 'professor');

    // Reabrir a página com o treino em andamento: o início não é mandado de novo.
    const antesRecarregar = (await r(pg)).marcados.length;
    await pg.reload(); await pg.waitForTimeout(1200);
    await pg.waitForTimeout(1700);
    conferir('recarregar a página não manda o início de novo', (await r(pg)).marcados.filter(m => m.titulo === 'Treino iniciado').length === 0, JSON.stringify((await r(pg)).marcados.map(m => m.titulo)));
    conferir('após recarregar continua ligado (ícone)', await pg.evaluate(() => document.documentElement.dataset.apRelogio === 'ligado'), String(antesRecarregar));
    // Reiniciar o treino é um treino novo: manda o início.
    await pg.evaluate(() => { stopWorkoutRest = () => {}; window.APsendTeacherWatchWorkout = () => { window.__envioWear = (window.__envioWear || 0) + 1; }; });
    await abrirDia(pg, 'd1'); await pg.evaluate(() => startWorkoutSession(true)); await pg.waitForTimeout(400);
    await pg.waitForTimeout(1700);
    ini = ultimo((await r(pg)).marcados, 'Treino iniciado');
    conferir('reiniciar o treino: manda o início de novo', ini && ini.texto === 'Ana Teste · Supino Inclinado Articulado · série 1 de 3 · 10 reps · 30 kg', JSON.stringify(ini));

    // Bi-set: no descanso depois de B, o aviso traz a próxima rodada.
    await abrirDia(pg, 'd2'); await pg.evaluate(() => startWorkoutSession()); await pg.waitForTimeout(300);
    await pg.evaluate(() => {
      const k = workoutDraftKey('p1', 'd2'), dr = state.workoutDrafts[k];
      const sig = JSON.stringify([['e6', 'e7'], 3, 60]), parte = {reps: 10, load: '20 kg', completedAt: Date.now()};
      state.workoutDrafts[k] = {...dr, bisets: {g1: {signature: sig, sessionId: dr.sessionId, rounds: [{A: parte, B: {...parte, load: '30 kg'}}], pending: {}, restAfter: 1, restUntil: Date.now() + 60000, restId: 'rb'}}};
      state.workoutRest = {id: 'rb', studentId: 'ana', planId: 'p1', dayId: 'd2', exerciseId: 'e7', bisetId: 'g1', student: 'Ana Teste', exercise: 'Bi-set 1 · descanso após B', seconds: 60, endAt: Date.now() + 60000, notified: false, native: false};
    });
    await pg.waitForTimeout(1700);
    fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('bi-set: o aviso traz a próxima rodada', fimD && fimD.texto === 'Ana Teste · Bi-set 1 · Supino + Remada · rodada 2 de 3', JSON.stringify(fimD));

    // Cardio e fim do treino
    await pg.evaluate(() => { state.workoutRest = null; });
    await abrirDia(pg, 'd3'); await pg.evaluate(() => startWorkoutSession()); await pg.waitForTimeout(300);
    await series(pg, 'e11', [[1, 12, 35]]); await pg.waitForTimeout(1700);
    fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('última série de 2: "série 2 de 2"', fimD && fimD.texto === 'Ana Teste · Puxada Frontal · série 2 de 2 · 12 reps · 35 kg', JSON.stringify(fimD));
    await series(pg, 'e11', [[2, 12, 35]]); await pg.waitForTimeout(1700);
    fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('próximo é cardio: nome e minutos', fimD && fimD.texto === 'Ana Teste · Próximo: Esteira · 20 min', JSON.stringify(fimD));
    await pg.evaluate(() => { const k = workoutDraftKey('p1', 'd3'); state.workoutDrafts[k].values.e12 = {done: true, sets: '1', reps: '1200 s', load: '', series: {1: {round: 1, done: true, reps: 1200}}}; state.workoutRest = {...state.workoutRest, endAt: Date.now() + 30000}; });
    await pg.waitForTimeout(1700);
    fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('tudo feito: "Todas as séries feitas. Finalize o treino."', fimD && fimD.texto === 'Ana Teste · Todas as séries feitas. Finalize o treino.', JSON.stringify(fimD));
    conferir('nenhum texto passa de 120 caracteres', (await r(pg)).marcados.every(m => m.texto.length <= 120 && m.titulo.length <= 40));
    await pg.evaluate(() => { state.workoutRest = null; });

    // Desligar: o ícone some de novo e nada é mandado.
    await pg.evaluate(() => window.APAvisoRelogio.abrir()); await pg.waitForTimeout(150);
    await pg.click('#apRelogioLigar'); await pg.waitForTimeout(200);
    await pg.evaluate(() => window.APAvisoRelogio.fechar());
    await abrirDia(pg, 'd1'); await pg.waitForTimeout(200);
    i = await iconeProf(pg);
    conferir('desligado de novo: ícone escondido e Mais "Desligado"', i && i.display === 'none' && (await pg.evaluate(() => document.querySelector('#moreSmartwatch .more-function-copy small').textContent)) === 'Desligado. Toque para ligar.', JSON.stringify(i));
    const n = (await r(pg)).marcados.length;
    await pg.evaluate(() => { state.workoutRest = {id: 'x', studentId: 'ana', planId: 'p1', dayId: 'd1', exerciseId: 'e2', student: 'Ana Teste', exercise: 'Remada Baixa', seconds: 60, endAt: Date.now() + 60000}; });
    await pg.waitForTimeout(1700);
    conferir('desligado: o descanso não é mandado', (await r(pg)).marcados.length === n);
    await pg.evaluate(() => { state.workoutRest = null; });

    // Wear OS pronto: o ícone faz o envio de antes (app do relógio Wear OS).
    await pg.evaluate(() => { window.__relogio.wear = {state: 'checked', nodes: [{id: 'n1', name: 'Galaxy Watch6'}], appNodes: ['n1']}; window.APAvisoRelogio.abrir(); window.APAvisoRelogio.fechar(); window.__envioWear = 0; });
    i = await iconeProf(pg);
    await pg.click('#workoutDayContent .ap-watch-session-heading .ap-watch-send-icon'); await pg.waitForTimeout(200);
    conferir('Wear OS pronto: ícone à mostra e o toque faz o envio ao app Wear OS', i.display !== 'none' && (await pg.evaluate(() => window.__envioWear)) === 1 && (await painel(pg)) === null, JSON.stringify(i));
    await ctx.close();
  }

  // ---------------------------------------------------------------- B. Professor com o app Android 1.212 (aviso sem som)
  {
    const {ctx, pg} = await novaPagina('/316-professor.html', {estado: {app: '1.212', ativo: true, canal: 'alerta'}}, 'professor 1.212', true);
    await pg.evaluate(() => window.APAvisoRelogio.abrir()); await pg.waitForTimeout(150);
    const d = await painel(pg);
    conferir('app 1.212: avisa que sai sem som e sugere atualizar', d.estado.endsWith('Neste app o aviso sai sem som; se não chegar no relógio, atualize o app Android.'), d.estado);
    await ctx.close();
  }

  // ---------------------------------------------------------------- C. Professor no navegador (sem Android)
  {
    const {ctx, pg} = await novaPagina('/316-professor.html', null, 'professor navegador', true);
    await abrirDia(pg, 'd1'); await pg.evaluate(() => startWorkoutSession()); await pg.waitForTimeout(400);
    const i = await iconeProf(pg), card = await pg.evaluate(() => document.querySelector('#moreSmartwatch .more-function-copy small')?.textContent);
    conferir('navegador: ícone escondido e cartão "Funciona no app Android."', i && i.display === 'none' && card === 'Funciona no app Android.', JSON.stringify({i, card}));
    await pg.evaluate(() => window.APAvisoRelogio.abrir()); await pg.waitForTimeout(150);
    const d = await painel(pg);
    conferir('navegador: explica que funciona no app Android, chave travada', d.estado.startsWith('O smartwatch funciona no aplicativo Android') && await pg.evaluate(() => document.querySelector('[data-relogio-ligar]').disabled), d.estado);
    await ctx.close();
  }

  // ---------------------------------------------------------------- D. 1.12.315: o ícone ficava escondido sem Wear OS
  {
    const {ctx, pg} = await novaPagina('/315-professor.html', {estado: {ativo: true, canal: 'alerta'}}, 'professor 315', true);
    await abrirDia(pg, 'd1'); await pg.evaluate(() => startWorkoutSession()); await pg.waitForTimeout(400);
    const i = await iconeProf(pg);
    conferir('no 1.12.315, mesmo com o aviso ligado, o ícone não aparecia (o que o Tiago viu)', i && i.display === 'none', JSON.stringify(i));
    await ctx.close();
  }

  // ---------------------------------------------------------------- E. Aluno, Android 1.213
  {
    const {ctx, pg} = await novaPagina('/316-index.html', {estado: {ativo: true, canal: 'alerta'}}, 'aluno', false);
    const linha = await pg.evaluate(() => document.querySelector('#apProfileRelogio small')?.textContent);
    conferir('Perfil > Smartwatch mostra "Ligado"', linha === 'Ligado. Treino e descanso no relógio.', linha);
    // Treino do aluno (o mesmo formato do app: exercisesFor, active[treino] com done, loads, restUntil e apAutoRestSeries)
    await pg.evaluate(() => {
      window.__AP_STUDENT_CONTEXT = {role: 'student'};
      const lin = (n, reps, load, rest) => Array.from({length: n}, () => ({reps, load, rest}));
      const lista = [
        {id: 'x1', name: 'Leg press 45°', sets: 3, reps: '12', rest: 60, rows: lin(3, '12', '80', 60)},
        {id: 'x2', name: 'Cadeira extensora', sets: 3, reps: '15', rest: 45, rows: lin(3, '15', '40', 45)},
        {id: 'x3', name: 'Stiff', sets: 3, reps: '10', rest: 0, rows: lin(3, '10', '20', 0), paired: 3, pairOwner: true, pair: 'b1'},
        {id: 'x4', name: 'Flexora', sets: 3, reps: '12', rest: 60, rows: lin(3, '12', '30', 60), paired: 2, pairOwner: false, pair: 'b1'},
      ];
      exercisesFor = id => id === 'A' ? JSON.parse(JSON.stringify(lista)) : [];
      window.__treino = {active: {A: {startedAt: Date.now(), loads: {0: [80, 85, 85]}, done: {}, id: 'A', lastExercise: 0}}, history: []};
      exStore = () => JSON.parse(JSON.stringify(window.__treino));
      exActiveId = 'A'; exIndex = 0;
    });
    await pg.waitForTimeout(1700);
    let e = await r(pg), ini = ultimo(e.marcados, 'Treino iniciado');
    conferir('aluno: ao iniciar, o primeiro exercício (carga da série que ele usa)', ini && ini.k === 'aluno' && ini.texto === 'Leg press 45° · série 1 de 3 · 12 reps · 80 kg', JSON.stringify(ini));
    const fim = await pg.evaluate(() => { const f = Date.now() + 60000; Object.assign(window.__treino.active.A, {done: {0: [true, false, false]}, restUntil: f, apAutoRestSeries: {deadline: f, exercise: 0, series: 0}}); return f; });
    await pg.waitForTimeout(1700);
    let fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('aluno: fim do descanso com a série 2 e a carga dela', fimD && fimD.at === fim && fimD.texto === 'Leg press 45° · série 2 de 3 · 12 reps · 85 kg', JSON.stringify(fimD));
    await pg.evaluate(() => { const f = Date.now() + 40000; Object.assign(window.__treino.active.A, {done: {0: [true, true, true]}, restUntil: f, apAutoRestSeries: {deadline: f, exercise: 0, series: 2}}); });
    await pg.waitForTimeout(1700);
    fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('aluno: exercício terminado → próximo, com a carga da ficha', fimD && fimD.texto === 'Próximo: Cadeira extensora · série 1 de 3 · 15 reps · 40 kg', JSON.stringify(fimD));
    await pg.evaluate(() => { const f = Date.now() + 50000; Object.assign(window.__treino.active.A, {done: {0: [true, true, true], 1: [true, true, true], 2: [true, false, false], 3: [true, false, false]}, restUntil: f, apAutoRestSeries: {deadline: f, exercise: 3, series: 0}}); });
    await pg.waitForTimeout(1700);
    fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('aluno: bi-set → próxima rodada', fimD && fimD.texto === 'Bi-set · Stiff + Flexora · rodada 2 de 3', JSON.stringify(fimD));
    await pg.evaluate(() => { const f = Date.now() + 50000; Object.assign(window.__treino.active.A, {done: {0: [true, true, true], 1: [true, true, true], 2: [true, true, true], 3: [true, true, true]}, restUntil: f, apAutoRestSeries: {deadline: f, exercise: 3, series: 2}}); });
    await pg.waitForTimeout(1700);
    fimD = ultimo((await r(pg)).marcados, 'Fim do descanso');
    conferir('aluno: tudo feito', fimD && fimD.texto === 'Todas as séries feitas. Finalize o treino.', JSON.stringify(fimD));
    // Ícone na tela do exercício: com o smartwatch ligado aparece e abre o painel
    await pg.evaluate(() => {
      Object.assign(window.__treino.active.A, {done: {0: [true, false, false]}, restUntil: 0}); delete window.__treino.active.A.apAutoRestSeries;
      const t = document.querySelector('#exerciseScreen .ex-header-title');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ap-watch-send-icon'; b.id = 'teste-icone'; b.textContent = '⌚'; window.__envioWear = 0; b.onclick = () => { window.__envioWear++; };
      t.classList.add('ap-watch-title'); t.append(b);
      document.querySelectorAll('body > *').forEach(x => { if (!['SCRIPT', 'STYLE', 'DIALOG'].includes(x.tagName)) x.style.visibility = 'hidden'; });
      const s = document.getElementById('exerciseScreen'); s.hidden = false; s.style.visibility = 'visible'; s.style.display = 'block';
    });
    await pg.waitForTimeout(1700);
    const ic = await pg.evaluate(() => ({display: getComputedStyle(document.getElementById('teste-icone')).display, grade: getComputedStyle(document.querySelector('#exerciseScreen .ex-header-title')).display}));
    conferir('aluno, ligado: ícone à mostra na tela do exercício (título em grade)', ic.display !== 'none' && ic.grade === 'grid', JSON.stringify(ic));
    await pg.click('#teste-icone'); await pg.waitForTimeout(250);
    let d = await painel(pg);
    conferir('aluno: toque no ícone abre o painel, sem o envio Wear OS', d && d.rapido && (await pg.evaluate(() => window.__envioWear)) === 0);
    conferir('aluno: painel com a série que falta do exercício aberto', d && d.previa === 'Leg press 45° · série 2 de 3 · 12 reps · 85 kg' && d.agoraDesligado === false, JSON.stringify(d && d.previa));
    conferir('aluno: painel com as cores do Perfil', await pg.evaluate(() => document.getElementById('apAvisoRelogio').style.getPropertyValue('--ac-panel') === '#071b26'));
    await pg.screenshot({path: SHOTS + '/316-aluno-painel.png'});
    await pg.click('[data-relogio-agora]'); await pg.waitForTimeout(150);
    const ag = ultimo((await r(pg)).marcados, 'Agora no treino');
    conferir('aluno: Mandar ao relógio', ag && ag.k === 'aluno' && ag.texto === 'Leg press 45° · série 2 de 3 · 12 reps · 85 kg', JSON.stringify(ag));
    await pg.evaluate(() => window.APAvisoRelogio.fechar());
    // Smartwatch desligado: ícone some e o título volta ao normal
    await pg.evaluate(() => { window.Android.setWatchNoticeEnabled(false); window.APAvisoRelogio.sincronizar(); });
    await pg.waitForTimeout(200);
    const ic2 = await pg.evaluate(() => ({display: getComputedStyle(document.getElementById('teste-icone')).display, grade: getComputedStyle(document.querySelector('#exerciseScreen .ex-header-title')).display}));
    conferir('aluno, desligado: ícone escondido e título sem grade', ic2.display === 'none' && ic2.grade === 'block', JSON.stringify(ic2));
    await ctx.close();
  }

  // ---------------------------------------------------------------- F. Aluno no navegador (iPhone)
  {
    const {ctx, pg} = await novaPagina('/316-index.html', null, 'aluno navegador', false);
    const linha = await pg.evaluate(() => document.querySelector('#apProfileRelogio small')?.textContent);
    conferir('navegador: Perfil > Smartwatch "Funciona no app Android."', linha === 'Funciona no app Android.', linha);
    conferir('navegador: o ícone fica escondido', await pg.evaluate(() => { const b = document.createElement('button'); b.className = 'ap-watch-send-icon'; document.body.append(b); return getComputedStyle(b).display === 'none'; }));
    await ctx.close();
  }

  conferir('sem erro de JavaScript nas páginas', erros.length === 0, erros.slice(0, 5).join(' | '));
  await navegador.close(); servidor.close();
  console.log('\n' + ok + '/' + (ok + falhas) + ' verificações' + (falhas ? ' — ' + falhas + ' FALHA(S)' : ''));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
