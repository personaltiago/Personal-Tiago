'use strict';
// Teste no Chrome do 1.12.306: arquivar sozinho quem passou 5 dias do vencimento sem pagamento registrado.
// Dados fictícios. Datas fixas em Cuiabá: segunda 23/11/2026 (primeiro dia, com a lista dos que já estavam atrasados) e terça 24/11.
// Preparação: extraia professor.html do 1.12.305 e do 1.12.306 para /tmp/t302/<305|306>-professor.html e sirva a pasta:
//   (cd /tmp/t302 && python3 -m http.server 8799 --bind 127.0.0.1)
// Uso: node arquivar-sem-pagamento-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const SHOTS = process.argv[2] || '/tmp/t302';
const ESPERA = 7000; // o app confere 6 s depois de abrir
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

const aluno = (id, nome, extra) => ({id, name: nome + ' Teste', studentType: 'presencial', financeEnabled: true, monthlyValue: '200', paymentReminderDays: 3, ...extra});
const ESTADO = {
  students: [
    aluno('ana', 'Ana', {dueDate: '2026-11-25'}),                                   // em dia
    aluno('bia', 'Bia', {dueDate: '2026-11-18', firebaseUid: 'uidBiaTeste0001'}),     // 5 dias em 23/11 (já atrasada no 1º dia)
    aluno('car', 'Carla', {dueDate: '2026-11-10'}),                                   // 13 dias em 23/11 (já atrasada no 1º dia)
    aluno('dani', 'Dani', {dueDate: '2026-11-19', firebaseUid: 'uidDaniTeste001'}),   // 4 dias em 23/11; 5 dias em 24/11
    aluno('edu', 'Edu', {financeEnabled: false, dueDate: ''}),                       // sem financeiro
    aluno('fe', 'Fernanda', {dueDate: '2026-11-01', archived: true, archivedAt: '2026-11-05T12:00:00.000Z', archiveReason: 'manual'}),
    aluno('gil', 'Gil', {dueDate: '2026-11-12', reactivatedAt: '2026-11-20T15:00:00.000Z'}), // reativado depois do vencimento
  ],
  lessons: [
    {id: 'l-bia', studentId: 'bia', date: '2026-11-02', time: '18:00', duration: 60, type: 'Presencial', location: '', lead: 15, repeat: 'weekly', repeatDays: [1], notes: ''},
    {id: 'l-dani', studentId: 'dani', date: '2026-11-03', time: '08:00', duration: 60, type: 'Presencial', location: '', lead: 15, repeat: 'weekly', repeatDays: [2], notes: ''},
  ],
  occurrenceStatus: {}, payments: [], history: [], workoutPlans: [],
};

(async () => {
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  async function abrir(versao, quando, preparo = {}) {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 915}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
    await ctx.clock.setFixedTime(new Date(quando));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(versao + ' ' + quando + ': ' + e.message));
    await pg.addInitScript(([e, p]) => {
      if (!localStorage.getItem('agendaPersonalTL_v1')) localStorage.setItem('agendaPersonalTL_v1', JSON.stringify(e));
      if (p.marcador && !localStorage.getItem('agendaAutoArchive_v1')) localStorage.setItem('agendaAutoArchive_v1', JSON.stringify(p.marcador));
      if (p.aluno) window.__AP_STUDENT_CONTEXT = {role: 'student'};
      window.__alarmes = []; window.__areas = []; window.__confirmacoes = [];
      window.Android = {syncLessonAlarms: x => { window.__alarmes.push(JSON.parse(x)); return true; }};
      window.APaccounts = {isTeacher: () => true, teacherUid: () => '', stage: a => window.__areas.push(a), refreshPreview() {}, knownAreas: () => [], status: () => null, retry() {}};
      window.confirm = m => { window.__confirmacoes.push(String(m)); return true; };
    }, [ESTADO, preparo]);
    await pg.goto('http://127.0.0.1:8799/' + versao + '-professor.html');
    return pg;
  }
  const situacao = pg => pg.evaluate(() => {
    const ultimo = window.__alarmes[window.__alarmes.length - 1] || {lessons: [], students: []};
    const area = id => { const a = window.__areas.filter(x => x.studentId === id).pop(); return a ? a.enabled : null; };
    const d = document.getElementById('apAutoArchiveDialog');
    const lista = parte => d ? [...d.querySelectorAll('[data-list="' + parte + '"] li strong')].map(x => x.textContent) : [];
    return {
      arquivados: state.students.filter(s => s.archived === true).map(s => s.id + (s.archiveReason ? ':' + s.archiveReason : '')),
      janela: !!d && d.classList.contains('open'),
      titulo: d?.querySelector('#apAutoArchiveTitle')?.textContent || '',
      auto: lista('auto'), atrasados: lista('backlog'),
      autoVisivel: !!d && !d.querySelector('[data-part="auto"]').hidden,
      atrasadosVisivel: !!d && !d.querySelector('[data-part="backlog"]').hidden,
      botao: d?.querySelector('[data-auto-archive="archive-backlog"]')?.textContent || '',
      rodape: d?.querySelector('[data-role="ack"]')?.textContent || '',
      marcador: JSON.parse(localStorage.getItem('agendaAutoArchive_v1') || 'null'),
      historico: state.history.map(h => h.text),
      alarmeAulas: (ultimo.lessons || []).map(l => l.studentId),
      cobranca: (ultimo.students || []).map(s => s.id),
      areaBia: area('bia'), areaDani: area('dani'),
      gravado: JSON.parse(localStorage.getItem('agendaPersonalTL_v1')).students.filter(s => s.archived === true).map(s => s.id),
    };
  });
  const clicar = (pg, acao) => pg.evaluate(a => document.querySelector('#apAutoArchiveDialog [data-auto-archive="' + a + '"]').click(), acao);

  // 1) Primeiro dia (23/11): quem já estava atrasado NÃO é arquivado sozinho; a janela mostra a lista para decidir.
  let pg = await abrir('306', '2026-11-23T10:00:00-04:00');
  let s = await situacao(pg);
  conferir('antes de 6 s nada acontece', s.arquivados.join() === 'fe:manual' && !s.janela, JSON.stringify(s.arquivados));
  await pg.waitForTimeout(ESPERA);
  s = await situacao(pg);
  conferir('1º dia: ninguém é arquivado sozinho', s.arquivados.join() === 'fe:manual', JSON.stringify(s.arquivados));
  conferir('1º dia: a janela lista quem já estava com 5 dias ou mais (Bia 5, Carla 13); Dani (4), Gil (reativado), Edu e Fernanda ficam fora',
    s.janela && s.atrasadosVisivel && !s.autoVisivel && JSON.stringify(s.atrasados) === '["Bia Teste","Carla Teste"]' && s.titulo === 'Mensalidades atrasadas' && s.botao === 'Arquivar estes 2 alunos' && s.rodape === 'Agora não', JSON.stringify(s));
  conferir('o marcador do aparelho começa hoje', s.marcador?.since === '2026-11-23' && s.marcador.backlogAsked === false, JSON.stringify(s.marcador));
  await pg.screenshot({path: SHOTS + '/306-atrasados.png'});
  const antes = s;
  await clicar(pg, 'archive-backlog');
  await pg.waitForTimeout(600);
  s = await situacao(pg);
  conferir('"Arquivar estes 2 alunos" arquiva Bia e Carla, gravado de verdade', s.arquivados.sort().join() === 'bia:payment-auto,car:payment-auto,fe:manual' && s.gravado.sort().join() === 'bia,car,fe', JSON.stringify(s.arquivados));
  conferir('a janela passa a mostrar os dois com Desfazer', s.janela && s.autoVisivel && !s.atrasadosVisivel && s.titulo === '2 alunos arquivados por falta de pagamento', s.titulo);
  conferir('Histórico registra os dois', s.historico.filter(t => t.startsWith('Aluno arquivado por falta de pagamento (já estava atrasado) · ')).length === 2, JSON.stringify(s.historico.slice(0, 2)));
  conferir('despertador: a aula da Bia sai; cobrança: Bia e Carla continuam', antes.alarmeAulas.includes('bia') && !s.alarmeAulas.includes('bia') && s.cobranca.includes('bia') && s.cobranca.includes('car'), JSON.stringify({antes: antes.alarmeAulas, depois: s.alarmeAulas, cobranca: s.cobranca}));
  await pg.waitForTimeout(700);
  s = await situacao(pg);
  conferir('app do aluno: a área da Bia vai bloqueada (enabled:false), como no Arquivar manual', s.areaBia === false, String(s.areaBia));
  conferir('não pergunta de novo: backlogAsked gravado', s.marcador?.backlogAsked === true);
  await clicar(pg, 'close');
  await pg.reload();
  await pg.waitForTimeout(ESPERA);
  s = await situacao(pg);
  conferir('reabrir no mesmo dia: sem janela e sem novos arquivados', !s.janela && s.arquivados.sort().join() === 'bia:payment-auto,car:payment-auto,fe:manual', JSON.stringify(s));
  await pg.context().close();

  // 2) Primeiro dia, mas saindo pelo Voltar (o mesmo do voltar do Android): ninguém é arquivado e a lista não volta.
  pg = await abrir('306', '2026-11-23T10:00:00-04:00');
  await pg.waitForTimeout(ESPERA);
  await pg.evaluate(() => document.getElementById('previousPageButton').click());
  await pg.waitForTimeout(300);
  s = await situacao(pg);
  conferir('Voltar fecha a janela = não arquivar agora, e não perguntar de novo', !s.janela && s.arquivados.join() === 'fe:manual' && s.marcador?.backlogAsked === true, JSON.stringify(s.marcador));
  await pg.reload();
  await pg.waitForTimeout(ESPERA);
  s = await situacao(pg);
  conferir('reabrir: sem janela', !s.janela && s.arquivados.join() === 'fe:manual');
  await pg.context().close();

  // 3) Dia seguinte (24/11): a Dani completa 5 dias e é arquivada sozinha; Bia e Carla (decisão de ontem) ficam ativas.
  const MARCADOR = {since: '2026-11-23', backlogAsked: true};
  pg = await abrir('306', '2026-11-24T10:00:00-04:00', {marcador: MARCADOR});
  await pg.waitForTimeout(ESPERA);
  s = await situacao(pg);
  conferir('24/11: Dani (5 dias) arquivada sozinha, sem toque', s.arquivados.sort().join() === 'dani:payment-auto,fe:manual' && s.gravado.sort().join() === 'dani,fe', JSON.stringify(s.arquivados));
  conferir('a janela avisa: 1 aluno arquivado, com Desfazer', s.janela && s.autoVisivel && !s.atrasadosVisivel && s.titulo === 'Aluno arquivado por falta de pagamento' && JSON.stringify(s.auto) === '["Dani Teste"]' && s.rodape === 'Entendi', JSON.stringify(s));
  conferir('Histórico: "Aluno arquivado automaticamente · Dani Teste · mensalidade vencida em 19/11/2026 (5 dias sem pagamento)"', s.historico[0] === 'Aluno arquivado automaticamente · Dani Teste · mensalidade vencida em 19/11/2026 (5 dias sem pagamento)', s.historico[0]);
  conferir('despertador sem a aula da Dani; cobrança da Dani continua', !s.alarmeAulas.includes('dani') && s.cobranca.includes('dani'), JSON.stringify({aulas: s.alarmeAulas, cobranca: s.cobranca}));
  await pg.waitForTimeout(700);
  s = await situacao(pg);
  conferir('app do aluno: a área da Dani vai bloqueada', s.areaDani === false, String(s.areaDani));
  await pg.screenshot({path: SHOTS + '/306-arquivado.png'});
  await pg.evaluate(() => chooseTeacherAppearance('light'));
  await pg.waitForTimeout(400);
  await pg.screenshot({path: SHOTS + '/306-arquivado-claro.png'});
  const pagina = await pg.evaluate(() => { const r = document.querySelector('#apAutoArchiveDialog .sheet').getBoundingClientRect(); return {topo: Math.round(r.top), altura: Math.round(r.height), janela: innerHeight}; });
  conferir('no celular abre como página inteira, igual às outras janelas do app', pagina.topo === 0 && pagina.altura === pagina.janela, JSON.stringify(pagina));
  await pg.evaluate(() => chooseTeacherAppearance('dark'));
  // Desfazer: volta na hora e não é arquivada de novo pela mesma mensalidade
  await pg.evaluate(() => document.querySelector('#apAutoArchiveDialog [data-auto-archive="undo"]').click());
  await pg.waitForTimeout(600);
  s = await situacao(pg);
  const msgDesfazer = await pg.evaluate(() => window.__confirmacoes[window.__confirmacoes.length - 1] || '');
  conferir('Desfazer pergunta antes e explica', msgDesfazer.startsWith('Reativar Dani Teste?') && msgDesfazer.includes('Não será arquivado de novo por esta mensalidade'), msgDesfazer.replace(/\n/g, ' | '));
  conferir('Desfazer reativa a Dani, fecha a janela e devolve o despertador', s.arquivados.join() === 'fe:manual' && !s.janela && s.alarmeAulas.includes('dani') && s.historico[0] === 'Arquivamento automático desfeito · Dani Teste', JSON.stringify(s));
  const deNovo = await pg.evaluate(() => window.APAutoArchive.run());
  conferir('conferir de novo: a Dani não é arquivada outra vez (reativada depois do vencimento)', deNovo.auto.length === 0 && !(await situacao(pg)).arquivados.includes('dani:payment-auto'), JSON.stringify(deNovo));
  await pg.evaluate(() => markPaymentPaid('dani'));
  await pg.waitForTimeout(300);
  const venc = await pg.evaluate(() => studentById('dani').dueDate);
  conferir('pagamento registrado: próximo vencimento 19/12 e nada a arquivar', venc === '2026-12-19' && (await pg.evaluate(() => window.APAutoArchive.pending())).length === 0, venc);
  await pg.context().close();

  // 4) Proteções: contexto do aluno e restauração de backup não arquivam nada
  pg = await abrir('306', '2026-11-24T10:00:00-04:00', {marcador: MARCADOR, aluno: true});
  await pg.waitForTimeout(ESPERA);
  s = await situacao(pg);
  conferir('no contexto do aluno não roda', s.arquivados.join() === 'fe:manual' && !s.janela);
  await pg.context().close();
  // A restauração liga APBackupRestoring durante o processo (o app o desliga ao terminar a recuperação, ao abrir).
  pg = await abrir('306', '2026-11-24T10:00:00-04:00', {marcador: MARCADOR});
  await pg.waitForTimeout(1000);
  await pg.evaluate(() => { globalThis.APBackupRestoring = true; });
  await pg.waitForTimeout(ESPERA);
  s = await situacao(pg);
  conferir('durante a restauração de backup não roda', s.arquivados.join() === 'fe:manual' && !s.janela);
  await pg.evaluate(() => { globalThis.APBackupRestoring = false; localStorage.setItem('agenda_backup_restored_pending_sync_v1_uidProfessorTeste', 'true'); });
  const pendente = await pg.evaluate(() => window.APAutoArchive.run());
  s = await situacao(pg);
  conferir('backup restaurado e ainda não reunido com a conta: não roda (os dados podem ser antigos)', pendente.auto.length === 0 && s.arquivados.join() === 'fe:manual', JSON.stringify(pendente));
  await pg.evaluate(() => localStorage.setItem('agenda_backup_restored_pending_sync_v1_uidProfessorTeste', 'false'));
  const liberado = await pg.evaluate(() => window.APAutoArchive.run());
  conferir('depois de sincronizar o backup, volta a valer (prova de que era a proteção)', JSON.stringify(liberado.auto) === '["dani"]', JSON.stringify(liberado));
  await pg.context().close();

  // 5) Voltar para o app (refreshAgendaState) também confere
  pg = await abrir('306', '2026-11-24T10:00:00-04:00', {marcador: MARCADOR});
  await pg.waitForTimeout(ESPERA); // a Dani é arquivada (cenário 3); fecha o aviso
  await pg.evaluate(() => document.querySelector('#apAutoArchiveDialog [data-auto-archive="close"]').click());
  await pg.evaluate(() => { const raw = JSON.parse(localStorage.getItem('agendaPersonalTL_v1')); raw.students.find(x => x.id === 'ana').dueDate = '2026-11-19'; localStorage.setItem('agendaPersonalTL_v1', JSON.stringify(raw)); refreshAgendaState(); });
  await pg.waitForTimeout(ESPERA);
  s = await situacao(pg);
  conferir('ao voltar para o app, a Ana (vencimento alterado para 19/11) também é arquivada', s.arquivados.includes('ana:payment-auto') && s.janela && JSON.stringify(s.auto) === '["Ana Teste"]', JSON.stringify(s.arquivados));
  await pg.context().close();

  // 6) 1.12.305: nada disso existe
  pg = await abrir('305', '2026-11-24T10:00:00-04:00', {marcador: MARCADOR});
  await pg.waitForTimeout(ESPERA);
  s = await situacao(pg);
  conferir('1.12.305: ninguém é arquivado sozinho', s.arquivados.join() === 'fe:manual' && !s.janela && (await pg.evaluate(() => typeof window.APAutoArchive)) === 'undefined');
  await pg.context().close();

  conferir('sem erros de JavaScript', erros.length === 0, erros.slice(0, 3).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
