'use strict';
// Teste no Chrome do 1.12.305: aluno arquivado sai da agenda (Hoje, Semana, Painel, Horários livres, conflito), sem apagar nada.
// Compara 1.12.304 (antes) e 1.12.305 (depois). Data fixa: segunda, 23/11/2026, 10h em Cuiabá.
// Preparação: extraia professor.html do 1.12.304 e do 1.12.305 para /tmp/t302/<304|305>-professor.html e sirva a pasta:
//   (cd /tmp/t302 && python3 -m http.server 8799 --bind 127.0.0.1)
// Uso: node arquivado-agenda-chrome.cjs [pasta-das-capturas]
// Padrão = a decisão do Tiago (23/11 07:13): LEMBRETES ligado (despertador das aulas para), COBRANCA desligado (cobrança continua).
// Para conferir um pacote gerado com outra decisão: LEMBRETES=0 e/ou COBRANCA=1.
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const SHOTS = process.argv[2] || '/tmp/t302';
const LEMBRETES = process.env.LEMBRETES !== '0', COBRANCA = process.env.COBRANCA === '1';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

// Dados fictícios. Carla: arquivada, aula fixa às segundas 17:55, uma aula "realizada" em 09/11 (histórico) e uma avulsa futura.
const ESTADO = {
  students: [
    {id: 'ana', name: 'Ana Teste', studentType: 'presencial', financeEnabled: true, dueDate: '2026-11-25', monthlyValue: '200'},
    {id: 'car', name: 'Carla Teste', studentType: 'presencial', archived: true, archivedAt: '2026-11-20T12:00:00.000Z', archiveReason: 'manual', financeEnabled: true, dueDate: '2026-11-26', monthlyValue: '180'},
  ],
  lessons: [
    {id: 'l-ana', studentId: 'ana', date: '2026-11-02', time: '16:45', duration: 60, type: 'Presencial', location: '', lead: 15, repeat: 'weekly', repeatDays: [1], notes: ''},
    {id: 'l-car', studentId: 'car', date: '2026-11-02', time: '17:55', duration: 60, type: 'Presencial', location: '', lead: 15, repeat: 'weekly', repeatDays: [1], notes: ''},
    {id: 'l-car-avulsa', studentId: 'car', date: '2026-11-25', time: '09:00', duration: 60, type: 'Presencial', location: '', lead: 15, repeat: 'none', repeatDays: [], notes: ''},
  ],
  occurrenceStatus: {'l-car|2026-11-09': 'realizada'},
  payments: [], history: [], workoutPlans: [],
};

(async () => {
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  async function abrir(versao) {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 900}, deviceScaleFactor: 2, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
    await ctx.clock.setFixedTime(new Date('2026-11-23T10:00:00-04:00'));
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(versao + ': ' + e.message));
    await pg.addInitScript(e => {
      if (!localStorage.getItem('agendaPersonalTL_v1')) localStorage.setItem('agendaPersonalTL_v1', JSON.stringify(e));
      window.__alarmes = [];
      window.Android = {syncLessonAlarms: p => { window.__alarmes.push(JSON.parse(p)); return true; }};
      window.__confirmacoes = [];
      window.confirm = m => { window.__confirmacoes.push(String(m)); return true; };
    }, ESTADO);
    await pg.goto('http://127.0.0.1:8799/' + versao + '-professor.html');
    await pg.waitForTimeout(2500);
    return pg;
  }
  const medir = pg => pg.evaluate(() => {
    const nomes = l => l.map(x => x.lesson.studentId + '@' + x.date);
    const semana = occurrences(new Date(2026, 10, 16), 14);
    const ultimo = window.__alarmes[window.__alarmes.length - 1] || {lessons: [], students: []};
    return {
      hoje: nomes(occurrences(new Date(2026, 10, 23), 1)),
      semana: nomes(semana),
      realizada: semana.concat(occurrences(new Date(2026, 10, 9), 1)).filter(x => x.lesson.id === 'l-car' && x.date === '2026-11-09').map(x => x.status),
      livres: blockingOccurrencesOnDate('2026-11-23').map(x => x.lesson.studentId),
      conflito: (candidateConflict({id: 'novo', studentId: 'ana', date: '2026-11-23', time: '18:00', duration: 60, repeat: 'weekly', repeatDays: [1]}, '') || {}).lesson?.studentId || null,
      ocorrenciaCronometro: isOccurrence(state.lessons.find(l => l.id === 'l-car'), '2026-11-23'),
      aulasGuardadas: state.lessons.length,
      alarmeAulas: (ultimo.lessons || []).map(l => l.studentId),
      alarmeCobranca: (ultimo.students || []).map(s => s.id),
      painel: document.getElementById('screen-dashboard')?.innerText.includes('Carla') || false,
    };
  });

  async function telaSemana(pg, captura) {
    await pg.evaluate(() => showScreen('agenda'));
    await pg.waitForTimeout(400);
    await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Semana'); b && b.click(); });
    await pg.waitForTimeout(600);
    const lista = pg.locator('#weekList');
    if (captura && await lista.count()) await lista.screenshot({path: SHOTS + '/' + captura});
    return pg.evaluate(() => ({semana: document.getElementById('weekList')?.innerText || '', hoje: document.getElementById('todayList')?.innerText || ''}));
  }

  const pg304 = await abrir('304');
  const antes = await medir(pg304);
  const telaAntes = await telaSemana(pg304, '305-semana-antes.png');
  conferir('1.12.304: a tela Semana mostra a aluna arquivada (o defeito da foto do Tiago)', telaAntes.semana.includes('Carla'), telaAntes.semana.slice(0, 160).replace(/\n/g, ' | '));
  conferir('1.12.304: a aluna arquivada aparece hoje e ocupa o horário (o defeito da foto)', antes.hoje.includes('car@2026-11-23') && antes.livres.includes('car') && antes.conflito === 'car', JSON.stringify(antes));

  const pg = await abrir('305');
  const depois = await medir(pg);
  conferir('Hoje (segunda 23/11): só a Ana; a aluna arquivada não aparece', JSON.stringify(depois.hoje) === JSON.stringify(['ana@2026-11-23']), JSON.stringify(depois.hoje));
  conferir('Semana 16–29/11: nenhuma aula da aluna arquivada (nem a fixa nem a avulsa de 25/11)', depois.semana.every(x => !x.startsWith('car@')) && depois.semana.filter(x => x.startsWith('ana@')).length === 2, JSON.stringify(depois.semana));
  conferir('a aula realizada de 09/11 continua no histórico', JSON.stringify(depois.realizada) === JSON.stringify(['realizada']), JSON.stringify(depois.realizada));
  conferir('Horários livres: o horário dela fica livre', JSON.stringify(depois.livres) === JSON.stringify(['ana']), JSON.stringify(depois.livres));
  conferir('nova aula na segunda 18:00 não acusa conflito com aluna arquivada', depois.conflito === null, String(depois.conflito));
  conferir('nada é apagado: as 3 aulas continuam guardadas', depois.aulasGuardadas === 3);
  conferir('cronômetro não muda: a aula fixa dela continua sendo uma aula válida para o cronômetro', depois.ocorrenciaCronometro === true);
  conferir('Painel não mostra a aluna arquivada', depois.painel === false);
  conferir('lembretes das aulas: ' + (LEMBRETES ? 'sem a aluna arquivada' : 'iguais ao 1.12.304'),
    LEMBRETES ? !depois.alarmeAulas.includes('car') && depois.alarmeAulas.includes('ana') : JSON.stringify(depois.alarmeAulas) === JSON.stringify(antes.alarmeAulas), JSON.stringify(depois.alarmeAulas));
  conferir('lembrete de cobrança: ' + (COBRANCA ? 'sem a aluna arquivada' : 'continua para a aluna arquivada, igual ao 1.12.304'),
    COBRANCA ? !depois.alarmeCobranca.includes('car') && depois.alarmeCobranca.includes('ana') : JSON.stringify(depois.alarmeCobranca) === JSON.stringify(antes.alarmeCobranca), JSON.stringify(depois.alarmeCobranca));

  // Tela Semana de verdade (a da foto)
  const tela = await telaSemana(pg, '305-semana-depois.png');
  conferir('tela Semana sem a aluna arquivada', tela.semana.length > 0 && !tela.semana.includes('Carla') && tela.semana.includes('Ana Teste'), tela.semana.slice(0, 200).replace(/\n/g, ' | '));

  // Arquivar a Ana: a mensagem avisa que sai da agenda e (com LEMBRETES) o despertador dela para na hora, sem abrir Hoje/Semana
  const ultimoAlarme = () => pg.evaluate(() => { const u = window.__alarmes[window.__alarmes.length - 1] || {lessons: [], students: []}; return {envios: window.__alarmes.length, aulas: (u.lessons || []).map(l => l.studentId), cobranca: (u.students || []).map(s => s.id)}; });
  const antesDeArquivar = await ultimoAlarme();
  await pg.evaluate(() => toggleStudentArchive('ana'));
  await pg.waitForTimeout(300);
  const msgArquivar = await pg.evaluate(() => window.__confirmacoes[window.__confirmacoes.length - 1] || '');
  conferir('Arquivar avisa que o aluno sai da agenda e que as aulas são mantidas', msgArquivar.includes('sai das listas ativas e da agenda') && msgArquivar.includes('Cadastro, fichas, aulas,'), msgArquivar.replace(/\n/g, ' | '));
  const aoArquivar = await ultimoAlarme();
  if (LEMBRETES) {
    conferir('ao arquivar, os avisos são reenviados na hora e o despertador da Ana sai', aoArquivar.envios > antesDeArquivar.envios && !aoArquivar.aulas.includes('ana'), JSON.stringify({antesDeArquivar, aoArquivar}));
    conferir('ao arquivar, a cobrança da Ana continua' + (COBRANCA ? ' (não: COBRANCA ligado)' : ''), COBRANCA ? !aoArquivar.cobranca.includes('ana') : aoArquivar.cobranca.includes('ana'), JSON.stringify(aoArquivar.cobranca));
  }
  await pg.evaluate(() => toggleStudentArchive('ana')); // reativa a Ana
  await pg.waitForTimeout(300);
  const aoReativar = await ultimoAlarme();
  if (LEMBRETES) conferir('ao reativar, o despertador da Ana volta na hora', aoReativar.envios > aoArquivar.envios && aoReativar.aulas.includes('ana'), JSON.stringify(aoReativar));

  // Nova aluna no horário da Carla, depois reativar a Carla: aviso do horário ocupado, e as aulas dela voltam
  await pg.evaluate(() => { state.students.push({id: 'bia', name: 'Bia Teste', studentType: 'presencial'}); state.lessons.push({id: 'l-bia', studentId: 'bia', date: '2026-11-23', time: '18:00', duration: 60, type: 'Presencial', location: '', lead: 15, repeat: 'weekly', repeatDays: [1], notes: ''}); save(); });
  await pg.evaluate(() => toggleStudentArchive('car'));
  await pg.waitForTimeout(400);
  const reativar = await pg.evaluate(() => ({msg: window.__confirmacoes[window.__confirmacoes.length - 1] || '', hoje: occurrences(new Date(2026, 10, 23), 1).map(x => x.lesson.studentId), arquivada: studentById('car').archived}));
  conferir('Reativar avisa que segunda 17:55 bate com a Bia', reativar.msg.startsWith('Reativar Carla Teste?') && reativar.msg.includes('Atenção: segunda-feira 17:55 bate com Bia Teste. Ajuste a agenda depois de reativar.'), reativar.msg.replace(/\n/g, ' | '));
  conferir('depois de reativar, as aulas dela voltam sozinhas', reativar.arquivada === false && reativar.hoje.includes('car'), JSON.stringify(reativar));

  conferir('sem erros de JavaScript', erros.length === 0, erros.slice(0, 3).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
