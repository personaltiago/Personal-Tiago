'use strict';
// Teste no Chrome do 1.12.307: a ficha guarda a carga do último treino completo de cada exercício comum.
// Dados fictícios; data fixa terça 24/11/2026 10h em Cuiabá; toque de celular.
// Preparação: extraia professor.html do 1.12.306 e do 1.12.307 para /tmp/t302/<306|307>-professor.html e sirva a pasta:
//   (cd /tmp/t302 && python3 -m http.server 8799 --bind 127.0.0.1)
// Uso: node carga-da-ficha-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const SHOTS = process.argv[2] || '/tmp/t302';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

const ex = (id, name, sets, reps, load, extra = {}) => ({id, name, sets, reps, load, rest: '60s', muscle: 'Glúteos', category: 'Musculação', ...extra});
const UID = 'uidAnaTeste0001';
function base() {
  return {
    students: [{id: 'ana', name: 'Ana Teste', studentType: 'presencial', firebaseUid: UID}],
    lessons: [], occurrenceStatus: {}, payments: [], history: [], workoutExecutions: [], workoutDrafts: {},
    workoutPlans: [{id: 'p1', studentId: 'ana', name: 'Ficha A', organization: 'sequence', visibility: 'always', startDate: '2026-11-01', days: [
      {id: 'd1', name: 'Treino A', exercises: [
        ex('e1', 'Elevação de Quadril', '4', '6-10', '130'),
        ex('e2', 'Glúteo coice', '3', '10-15', '25kg'),
        ex('e3', 'Stiff com Halteres', '3', '8-10', '20 22'),
        ex('e4', 'Prancha', '3', '12', 'Peso corporal'),
        ex('e5', 'Leg press drop-set', '3', '10', '40', {technique: {name: 'Drop-set', presetId: '', observations: '', rows: [{sets: 2, reps: '10', load: '40', restSeconds: 60}, {sets: 1, reps: '8', load: '30', restSeconds: 0}]}}),
      ]},
      {id: 'd2', name: 'Treino B', exercises: [
        ex('e6', 'Supino', '3', '10', '20'), ex('e7', 'Remada', '3', '10', '30'),
        ex('e9', 'Agachamento', '3', '10', '20/22/24'), ex('e10', 'Rosca', '3', '12', '10/10'),
      ], bisets: [{id: 'g1', exerciseIds: ['e6', 'e7'], rounds: 3, restSeconds: 60}]},
    ]}],
  };
}
// Treinos do professor (já gravados) e do aluno (no app dele), para a ficha aberta em 24/11.
const serie = (round, load, prescribedLoad) => ({round, done: true, reps: 10, load: String(load), prescribedReps: '10', prescribedLoad});
const treinoProf = (id, finishedAt, exercicios) => ({id, studentId: 'ana', planId: 'p1', dayId: 'd1', date: finishedAt.slice(0, 10), recordedAt: finishedAt, finishedAt,
  exercises: exercicios.map(([exerciseId, prescrita, cargas]) => ({exerciseId, name: exerciseId, sets: String(cargas.length), prescribed: {sets: String(cargas.length), reps: '10', load: prescrita, rest: '60s'}, performedSets: cargas.map((c, i) => serie(i + 1, c, prescrita))}))});
const HISTORICO = [
  treinoProf('t1', '2026-11-21T22:00:00.000Z', [['e3', '20 22', ['24 kg', '24 kg', '24 kg']]]),          // ficha igual à de hoje, mas o do aluno (22/11) é mais novo
  treinoProf('t2', '2026-11-23T12:00:00.000Z', [['e10', '10/10', ['12 kg', '12 kg', '12 kg']]]),           // ficha igual à de hoje → vale
  treinoProf('t3', '2026-11-23T13:00:00.000Z', [['e2', '20kg', ['30 kg', '30 kg', '30 kg']]]),             // ficha mudou depois → não vale
  treinoProf('t4', '2026-11-24T09:00:00.000Z', [['e1', '130', ['150 kg', '150 kg', '150 kg']]]),           // incompleto (3 de 4) → não vale
];
const regAluno = (id, iso, exercicios) => ({id, startedAt: Date.parse(iso) - 3600000, finishedAt: Date.parse(iso), incomplete: false, workoutName: 'Treino A',
  exerciseRecords: exercicios.map(([exerciseId, cargas, feitas]) => ({exerciseId, name: exerciseId, sets: cargas.length, reps: '10', targets: cargas.map(() => '10'), loads: cargas, done: feitas || cargas.map(() => true)}))});
const ALUNO = [
  regAluno('s0', '2026-11-19T21:00:00.000Z', [['e1', [150, 150, 150, 150]]]),                                 // antes desta atualização → não vale
  regAluno('s1', '2026-11-22T21:00:00.000Z', [['e1', [135, 135, 140, 140]], ['e3', [21, 22, 23]], ['e2', [30, 30, null]],
    ['e5', [40, 40, 30]], ['e4', [5, 5, 5]], ['e6', [25, 25, 25]], ['e9', [21, 23, 25]]]),
];

(async () => {
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  async function abrir(versao, estado, preparo = {}) {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 915}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
    await ctx.clock.setFixedTime(new Date('2026-11-24T10:00:00-04:00'));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(versao + ': ' + e.message));
    await pg.addInitScript(([e, p, aluno]) => {
      if (!localStorage.getItem('agendaPersonalTL_v1')) localStorage.setItem('agendaPersonalTL_v1', JSON.stringify(e));
      if (p.desde && !localStorage.getItem('agendaWorkoutLoadsSince_v1')) localStorage.setItem('agendaWorkoutLoadsSince_v1', p.desde);
      window.__areas = []; window.__buscas = 0; window.__avisos = []; window.__confirmacoes = [];
      window.Android = {syncLessonAlarms: () => true};
      window.APaccounts = {isTeacher: () => true, teacherUid: () => '', stage: a => window.__areas.push(JSON.parse(JSON.stringify(a))), refreshPreview() {}, knownAreas: () => [], status: () => null, retry() {}};
      window.APloadWorkoutSync = async () => ({refresh: async uid => { window.__buscas++; return aluno; }, records: uid => aluno.slice()});
      window.confirm = m => { window.__confirmacoes.push(String(m)); return true; };
      document.addEventListener('DOMContentLoaded', () => {
        const t = document.getElementById('toast');
        if (t) new MutationObserver(() => { if (t.textContent) window.__avisos.push(t.textContent); }).observe(t, {childList: true, characterData: true, subtree: true});
      });
    }, [estado, preparo, preparo.aluno || []]);
    await pg.goto('http://127.0.0.1:8799/' + versao + '-professor.html');
    await pg.waitForTimeout(1200);
    return pg;
  }
  const ficha = pg => pg.evaluate(() => Object.fromEntries(state.workoutPlans[0].days.flatMap(d => d.exercises).map(e => [e.id, e.load])));
  const marca = (pg, id) => pg.evaluate(i => { const e = state.workoutPlans[0].days.flatMap(d => d.exercises).find(x => x.id === i); return {em: e.loadsUpdatedAt || '', fonte: e.loadsSource || ''}; }, id);
  const tabela = (pg, dia) => pg.evaluate(d => { showScreen('workouts'); openWorkoutStudent('ana'); selectWorkoutPlan('p1'); openWorkoutDay(d);
    const out = {}; document.querySelectorAll('#workoutDayContent [data-series-field="load"]').forEach(i => { (out[i.dataset.seriesExercise] = out[i.dataset.seriesExercise] || []).push(i.value); }); return out; }, dia);
  const area = pg => pg.evaluate(() => { const a = window.__areas.filter(x => x.studentId === 'ana').pop(); if (!a) return null;
    return Object.fromEntries(a.plans.flatMap(p => p.days).flatMap(d => d.exercises).map(e => [e.id, e.rows.map(r => r.load)])); });
  async function series(pg, exId, linhas) {
    for (let i = 0; i < linhas.length; i++) {
      const [reps, carga] = linhas[i];
      await pg.evaluate(([e, r, rep, c]) => {
        const row = document.querySelector('#workoutDayContent .ws-set-row[data-series-exercise="' + e + '"][data-series-round="' + r + '"]');
        const repsInput = row.querySelector('[data-series-field="reps"]'), loadInput = row.querySelector('[data-series-field="load"]');
        repsInput.value = String(rep); saveWorkoutSeriesInput(repsInput);
        if (c !== null) { loadInput.value = String(c); saveWorkoutSeriesInput(loadInput); }
        const fresh = document.querySelector('#workoutDayContent .ws-set-row[data-series-exercise="' + e + '"][data-series-round="' + r + '"] input[type=checkbox]');
        fresh.checked = true; completeWorkoutSeriesCheck(fresh);
      }, [exId, i + 1, reps, carga]);
      await pg.waitForTimeout(60);
    }
  }

  // 1) Carga por série na prescrição ("20/22/24" em 3 séries) — 1.12.306 x 1.12.307, tabela e área do aluno
  for (const v of ['306', '307']) {
    const pg = await abrir(v, base());
    const t = await tabela(pg, 'd2');
    await pg.waitForTimeout(900);
    const a = await area(pg);
    if (v === '306') conferir('1.12.306: "20/22/24" aparece igual nas 3 séries e o aluno recebe 20 em todas', JSON.stringify(t.e9) === '["20/22/24","20/22/24","20/22/24"]' && JSON.stringify(a?.e9) === '[20,20,20]', JSON.stringify({t: t.e9, a: a?.e9}));
    else {
      conferir('1.12.307: "20/22/24" vira 20, 22 e 24 nas séries da tabela', JSON.stringify(t.e9) === '["20","22","24"]', JSON.stringify(t.e9));
      conferir('1.12.307: o app do aluno recebe 20, 22 e 24', JSON.stringify(a?.e9) === '[20,22,24]', JSON.stringify(a?.e9));
      conferir('"10/10" em 3 séries (não divide certo) continua igual em todas', JSON.stringify(t.e10) === '["10/10","10/10","10/10"]' && JSON.stringify(a?.e10) === '[10,10,10]', JSON.stringify({t: t.e10, a: a?.e10}));
      conferir('bi-set e técnica com a prescrição de antes', JSON.stringify(a?.e6) === '[20,20,20]' && JSON.stringify(t.e6) === '["20","20","20"]', JSON.stringify({t: t.e6, a: a?.e6}));
    }
    await pg.context().close();
  }

  // 2) Finalizar o treino no app do professor atualiza a ficha (aluno sem conta vinculada, para isolar)
  {
    const e = base(); e.students[0].firebaseUid = '';
    const pg = await abrir('307', e);
    const antes = await tabela(pg, 'd1');
    await pg.evaluate(() => startWorkoutSession());
    await pg.waitForTimeout(300);
    await series(pg, 'e1', [[8, 140], [8, 140], [8, 140], [8, 140]]);
    await series(pg, 'e2', [[12, 25], [12, '27,5'], [12, '27,5']]);
    await series(pg, 'e3', [[10, 22], [10, 22], [10, 22]]);
    await series(pg, 'e4', [[12, null], [12, null], [12, null]]);
    await series(pg, 'e5', [[10, 40], [10, 40], [8, 30]]);
    await pg.evaluate(() => { openWorkoutExecution(); document.getElementById('workoutExecutionForm').requestSubmit(); });
    await pg.waitForTimeout(700);
    const f = await ficha(pg), rec = await pg.evaluate(() => state.workoutExecutions[0] && {at: state.workoutExecutions[0].finishedAt, n: state.workoutExecutions.length});
    conferir('treino finalizado e gravado', rec?.n === 1, JSON.stringify(rec));
    conferir('ficha: Elevação 130 → 140 (igual nas 4 séries)', f.e1 === '140', f.e1);
    conferir('ficha: Glúteo coice 25kg → 25/27,5/27,5 (uma carga por série)', f.e2 === '25/27,5/27,5', f.e2);
    conferir('ficha: Stiff "20 22" → 22', f.e3 === '22', f.e3);
    conferir('carga em texto (Peso corporal) e exercício com técnica ficam como estavam', f.e4 === 'Peso corporal' && f.e5 === '40', JSON.stringify({e4: f.e4, e5: f.e5}));
    const m = await marca(pg, 'e2');
    conferir('marca da atualização = hora do treino, fonte professor', m.em === rec.at && m.fonte === 'professor', JSON.stringify(m));
    const hist = await pg.evaluate(() => state.history[0]?.text || '');
    conferir('Histórico: "Cargas da ficha atualizadas · Ana Teste · …"', hist === 'Cargas da ficha atualizadas · Ana Teste · Elevação de Quadril 140; Glúteo coice 25/27,5/27,5; Stiff com Halteres 22', hist);
    const avisos = await pg.evaluate(() => window.__avisos.join(' | '));
    conferir('aviso ao finalizar diz que a ficha foi atualizada', /Treino finalizado\. Ficha atualizada com as cargas de hoje: Elevação de Quadril 140; Glúteo coice 25\/27,5\/27,5; Stiff com Halteres 22\./.test(avisos), avisos.slice(0, 300));
    const depois = await tabela(pg, 'd1');
    conferir('próximo treino: a tabela já começa com as cargas novas', JSON.stringify(antes.e2) === '["25","25","25"]' && JSON.stringify(depois.e2) === '["25","27,5","27,5"]' && JSON.stringify(depois.e1) === '["140","140","140","140"]' && JSON.stringify(depois.e3) === '["22","22","22"]', JSON.stringify({antes: antes.e2, depois}));
    await pg.locator('#workoutDayContent .workout-exercise[data-exercise-id="e2"]').screenshot({path: SHOTS + '/307-carga-por-serie.png'}).catch(() => {});
    await pg.waitForTimeout(900);
    const a = await area(pg);
    conferir('app do aluno recebe as cargas novas por série', JSON.stringify(a?.e2) === '[25,27.5,27.5]' && JSON.stringify(a?.e1) === '[140,140,140,140]' && JSON.stringify(a?.e3) === '[22,22,22]', JSON.stringify({e1: a?.e1, e2: a?.e2, e3: a?.e3}));
    const de_novo = await pg.evaluate(() => window.APWorkoutLoads.apply('ana', window.APWorkoutLoads.teacherSessions('ana')));
    conferir('aplicar de novo não muda nada (sem gravação repetida)', Array.isArray(de_novo) && de_novo.length === 0, JSON.stringify(de_novo));
    await pg.context().close();
  }

  // 3) Abrir a ficha: treinos do aluno (depois desta atualização) e do professor, o mais novo de cada exercício
  {
    const e = base(); e.workoutExecutions = HISTORICO;
    const pg = await abrir('307', e, {desde: '2026-11-20T00:00:00.000Z', aluno: ALUNO});
    await pg.evaluate(() => { showScreen('workouts'); openWorkoutStudent('ana'); });
    await pg.waitForTimeout(900);
    const f = await ficha(pg);
    conferir('Elevação: treino do aluno de 22/11 (135/135/140/140); o de 19/11 é anterior à atualização e o do professor de 24/11 está incompleto', f.e1 === '135/135/140/140', f.e1);
    conferir('Stiff: o do aluno (22/11) vence o do professor (21/11)', f.e3 === '21/22/23', f.e3);
    conferir('Glúteo coice fica 25kg: treino do aluno incompleto e o do professor foi com outra ficha', f.e2 === '25kg', f.e2);
    conferir('Rosca: treino do professor com a ficha igual à de hoje (12)', f.e10 === '12', f.e10);
    conferir('Agachamento (outro dia): 21/23/25', f.e9 === '21/23/25', f.e9);
    conferir('técnica, bi-set e carga em texto não mudam', f.e5 === '40' && f.e6 === '20' && f.e7 === '30' && f.e4 === 'Peso corporal', JSON.stringify({e4: f.e4, e5: f.e5, e6: f.e6, e7: f.e7}));
    const m1 = await marca(pg, 'e1');
    conferir('marca: hora do treino do aluno, fonte aluno', m1.em === '2026-11-22T21:00:00.000Z' && m1.fonte === 'aluno', JSON.stringify(m1));
    const s = await pg.evaluate(() => ({h: state.history.filter(x => x.text.startsWith('Cargas da ficha atualizadas')).length, avisos: window.__avisos.join(' | '), buscas: window.__buscas}));
    conferir('uma gravação só ao abrir (1 entrada no Histórico) e aviso na tela', s.h === 1 && s.avisos.includes('Ficha de Ana Teste atualizada com o último treino'), JSON.stringify(s));
    // Mudança à mão no editor: vale até o próximo treino feito depois dela
    await pg.evaluate(() => { selectWorkoutPlan('p1'); openWorkoutDay('d1'); openWorkoutExerciseEditor('e1'); document.getElementById('workoutExerciseLoad').value = '120'; document.getElementById('workoutExerciseForm').requestSubmit(); });
    await pg.waitForTimeout(400);
    const m2 = await marca(pg, 'e1'), f2 = await ficha(pg);
    conferir('editar a carga à mão grava a hora e a fonte "manual"', f2.e1 === '120' && m2.fonte === 'manual' && m2.em === '2026-11-24T14:00:00.000Z', JSON.stringify({load: f2.e1, m2}));
    await pg.evaluate(() => { openWorkoutExerciseEditor('e3'); document.getElementById('workoutExerciseNotes').value = 'Coluna neutra'; document.getElementById('workoutExerciseForm').requestSubmit(); });
    await pg.waitForTimeout(400);
    const m3 = await marca(pg, 'e3');
    conferir('editar outro campo não mexe na marca da carga', m3.fonte === 'aluno' && m3.em === '2026-11-22T21:00:00.000Z', JSON.stringify(m3));
    await pg.evaluate(() => window.APWorkoutLoads.syncStudent('ana'));
    const f3 = await ficha(pg), buscas = await pg.evaluate(() => window.__buscas);
    conferir('abrir de novo: treino mais antigo não desfaz a mudança à mão (120)', f3.e1 === '120', f3.e1);
    conferir('busca no servidor no máximo a cada 10 min por aluno (1 busca em 2 aberturas)', buscas === 1, String(buscas));
    await pg.context().close();
  }

  // 4) Dia com treino em andamento não muda; os outros dias mudam
  {
    const e = base(); e.workoutExecutions = HISTORICO;
    const pg = await abrir('307', e, {desde: '2026-11-20T00:00:00.000Z', aluno: ALUNO});
    await pg.evaluate(() => { state.workoutDrafts[workoutDraftKey('p1', 'd2')] = {active: true, startedAt: Date.now(), sessionId: 'teste', values: {}}; showScreen('workouts'); openWorkoutStudent('ana'); });
    await pg.waitForTimeout(900);
    const f = await ficha(pg);
    conferir('treino em andamento no Treino B: Agachamento e Rosca ficam; Treino A atualiza', f.e9 === '20/22/24' && f.e10 === '10/10' && f.e1 === '135/135/140/140', JSON.stringify({e9: f.e9, e10: f.e10, e1: f.e1}));
    await pg.context().close();
  }

  // 5) Proteções: contexto do aluno e restauração de backup não mudam a ficha
  {
    const e = base(); e.workoutExecutions = HISTORICO;
    const pg = await abrir('307', e, {desde: '2026-11-20T00:00:00.000Z', aluno: ALUNO});
    await pg.evaluate(() => { globalThis.APBackupRestoring = true; });
    const r1 = await pg.evaluate(() => window.APWorkoutLoads.syncStudent('ana'));
    await pg.evaluate(() => { globalThis.APBackupRestoring = false; window.__AP_STUDENT_CONTEXT = {role: 'student'}; });
    const r2 = await pg.evaluate(() => window.APWorkoutLoads.syncStudent('ana'));
    const f = await ficha(pg);
    conferir('restauração de backup e contexto do aluno: nada muda', r1.length === 0 && r2.length === 0 && f.e1 === '130' && f.e3 === '20 22', JSON.stringify({r1, r2, e1: f.e1}));
    await pg.context().close();
  }

  // 6) 1.12.306: abrir a ficha e finalizar não mexem na ficha
  {
    const e = base(); e.workoutExecutions = HISTORICO;
    const pg = await abrir('306', e, {desde: '2026-11-20T00:00:00.000Z', aluno: ALUNO});
    await pg.evaluate(() => { showScreen('workouts'); openWorkoutStudent('ana'); });
    await pg.waitForTimeout(900);
    const f = await ficha(pg);
    conferir('1.12.306: ficha igual e sem o recurso', f.e1 === '130' && f.e3 === '20 22' && (await pg.evaluate(() => typeof window.APWorkoutLoads)) === 'undefined', JSON.stringify(f));
    await pg.context().close();
  }

  conferir('sem erros de JavaScript', erros.length === 0, erros.slice(0, 4).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
