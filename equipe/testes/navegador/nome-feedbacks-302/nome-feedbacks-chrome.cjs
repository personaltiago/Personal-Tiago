'use strict';
// Teste no Chrome do "Nome nos feedbacks" (1.12.302). Compara com o 1.12.301 onde faz sentido.
// Preparação (da raiz do repositório):
//   node tools/gerar-nome-feedbacks-1.12.302.cjs <1.12.301.agenda.json> /tmp/t302/302.agenda.json
//   extraia index.html e professor.html do 1.12.301 e do 1.12.302 para /tmp/t302/<301|302>-<página>
//   (cd /tmp/t302 && python3 -m http.server 8799 --bind 127.0.0.1)
// Uso: node nome-feedbacks-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const SHOTS = process.argv[2] || '/tmp/t302';
const BASE = 'http://127.0.0.1:8799/';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

const ITEM = {id: 'f1', studentName: 'Ana Teste', source: 'online', startedAt: '2026-11-20T10:00:00.000Z', finishedAt: '2026-11-20T11:00:00.000Z',
  durationSeconds: 3600, response: {comment: 'Treino ótimo.', intensity: 'Moderada'}};

// Grava cada fillText do canvas para ler o texto do cartão.
const GRAVAR_TEXTO = () => {
  window.__textos = [];
  const original = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (texto, ...resto) { window.__textos.push(String(texto)); return original.call(this, texto, ...resto); };
};
const rodape = async (pg, brand) => pg.evaluate(async ([item, brand]) => {
  window.__textos = [];
  const canvas = await APFeedbackCard.create(item, brand === undefined ? {} : {brand});
  return {rodape: window.__textos.filter(t => /Acompanhamento de treino\.$/.test(t) || t === window.__ultimoNome).pop() || window.__textos[window.__textos.length - 1], ultimo: window.__textos[window.__textos.length - 1], png: canvas.toDataURL('image/png').length, dados: canvas.toDataURL('image/png')};
}, [ITEM, brand]);

(async () => {
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  async function abrir(arquivo, {estado, ponte} = {}) {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 900}, deviceScaleFactor: 2});
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(arquivo + ': ' + e.message));
    await pg.addInitScript(GRAVAR_TEXTO);
    if (estado) await pg.addInitScript(e => { if (!localStorage.getItem('agendaPersonalTL_v1')) localStorage.setItem('agendaPersonalTL_v1', JSON.stringify(e)); }, estado);
    if (ponte) await pg.addInitScript(() => {
      window.__enviadas = [];
      window.APaccounts = {isTeacher: () => true, stage: p => window.__enviadas.push(JSON.parse(JSON.stringify(p))), refreshPreview() {}, knownAreas: () => [],
        status: () => ({state: 'ok', message: 'Sincronizado.'}), copyRules() {}, logout() {}};
    });
    await pg.goto(BASE + arquivo);
    await pg.waitForTimeout(2500);
    return pg;
  }
  const ESTADO = {students: [{id: 's1', name: 'Ana Teste', studentType: 'online', firebaseUid: 'Abcdefghijklmnopqrstuvwxyz12', startDate: '2026-01-01'}], payments: [], history: [], workoutPlans: []};

  // ---------------------------------------------------------------- professor 1.12.302
  const pg = await abrir('302-professor.html', {estado: ESTADO, ponte: true});
  await pg.evaluate(() => showScreen('settings'));
  await pg.waitForTimeout(400);
  const inicio = await pg.evaluate(() => {
    const s = document.querySelector('.feedback-name-setting');
    return {existe: !!s, depoisDeLetras: s?.previousElementSibling?.querySelector('#teacherTextTitle')?.textContent, dentroDeConfig: !!s?.closest('#screen-settings'),
      valor: document.getElementById('feedbackNameInput').value, previa: document.getElementById('feedbackNamePreview').textContent,
      maxlength: document.getElementById('feedbackNameInput').maxLength, visivel: s?.getBoundingClientRect().height > 0};
  });
  conferir('cartão "Nome nos feedbacks" em Configurações, logo depois de Tamanho das letras', inicio.existe && inicio.dentroDeConfig && inicio.depoisDeLetras === 'Tamanho das letras' && inicio.visivel, JSON.stringify(inicio));
  conferir('vazio: prévia mostra Agenda Personal', inicio.valor === '' && inicio.previa === 'No cartão: Agenda Personal · Acompanhamento de treino.' && inicio.maxlength === 40, inicio.previa);
  await pg.locator('.feedback-name-setting').screenshot({path: SHOTS + '/302-config-vazio.png'});

  await pg.fill('#feedbackNameInput', '  Tiago   Lima · Personal  ');
  conferir('prévia acompanha a digitação', (await pg.textContent('#feedbackNamePreview')) === 'No cartão: Tiago Lima · Personal · Acompanhamento de treino.');
  const antes = await pg.evaluate(() => { const n = window.__enviadas.length; return n; });
  await pg.press('#feedbackNameInput', 'Enter');
  await pg.waitForTimeout(700);
  const salvo = await pg.evaluate(() => ({status: document.getElementById('feedbackNameStatus').textContent, valor: document.getElementById('feedbackNameInput').value,
    guardado: JSON.parse(localStorage.getItem('agendaPersonalTL_v1')).trainerProfile?.feedbackName, fn: window.APFeedbackName(), enviadas: window.__enviadas.map(a => a.trainer?.feedbackName)}));
  const depois = salvo.enviadas.slice(antes);
  conferir('Salvar (Enter) guarda o nome limpo', salvo.guardado === 'Tiago Lima · Personal' && salvo.fn === 'Tiago Lima · Personal' && salvo.valor === 'Tiago Lima · Personal', JSON.stringify(salvo));
  conferir('mensagem de salvo', salvo.status === 'Salvo. Os alunos recebem o nome na próxima sincronização.', salvo.status);
  conferir('salvar reenvia a área do aluno com o nome (fila existente)', depois.length > 0 && depois.every(n => n === 'Tiago Lima · Personal'), 'antes do Salvar: ' + JSON.stringify(salvo.enviadas.slice(0, antes)) + ' depois: ' + JSON.stringify(depois));
  await pg.locator('.feedback-name-setting').screenshot({path: SHOTS + '/302-config-salvo.png'});
  const area = await pg.evaluate(() => APStudentModel.makeArea(state, state.students[0], {}));
  conferir('área do aluno leva trainer.feedbackName', area.trainer.feedbackName === 'Tiago Lima · Personal' && area.trainer.name !== undefined, JSON.stringify(area.trainer));

  const r1 = await rodape(pg, await pg.evaluate(() => window.APFeedbackName()));
  conferir('cartão do professor: rodapé com o nome', r1.ultimo === 'Tiago Lima · Personal · Acompanhamento de treino.', r1.ultimo);
  conferir('o cartão do professor passa o nome (código do bloco)', await pg.evaluate(() => document.getElementById('ap-feedback-teacher').textContent.includes('brand:"function"==typeof window.APFeedbackName?window.APFeedbackName():""')));

  await pg.press('#feedbackNameInput', 'Enter');
  await pg.waitForTimeout(300);
  conferir('sem mudança: avisa que já está salvo', (await pg.textContent('#feedbackNameStatus')) === 'Este nome já está salvo.');

  await pg.reload();
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => showScreen('settings'));
  await pg.waitForTimeout(300);
  conferir('depois de recarregar o nome continua', (await pg.inputValue('#feedbackNameInput')) === 'Tiago Lima · Personal');

  // nome comprido: 40 letras largas não cabem com o complemento -> só o nome
  await pg.evaluate(() => { const i = document.getElementById('feedbackNameInput'); i.value = 'W'.repeat(50) + '\u0007'; });
  await pg.click('.feedback-name-row .btn');
  await pg.waitForTimeout(300);
  const longo = await pg.evaluate(() => window.APFeedbackName());
  conferir('limita a 40 letras e tira caractere de controle', longo === 'W'.repeat(40), longo.length + '');
  const r2 = await rodape(pg, longo);
  conferir('nome comprido que não cabe: rodapé só com o nome', r2.ultimo === 'W'.repeat(40), r2.ultimo);

  // erro ao salvar: volta ao valor anterior
  await pg.evaluate(() => { window.__saveOriginal = save; save = () => { throw Error('sem espaço'); }; document.getElementById('feedbackNameInput').value = 'Outro Nome'; });
  await pg.click('.feedback-name-row .btn');
  await pg.waitForTimeout(200);
  const falhou = await pg.evaluate(() => ({fn: window.APFeedbackName(), status: document.getElementById('feedbackNameStatus').textContent, erro: document.getElementById('feedbackNameStatus').dataset.error}));
  conferir('falha ao salvar: desfaz e avisa', falhou.fn === 'W'.repeat(40) && falhou.erro === 'true' && /Não foi possível salvar/.test(falhou.status), JSON.stringify(falhou));
  await pg.evaluate(() => { save = window.__saveOriginal; });

  // apagar: volta a Agenda Personal
  await pg.fill('#feedbackNameInput', '');
  await pg.click('.feedback-name-row .btn');
  await pg.waitForTimeout(300);
  const limpo = await pg.evaluate(() => ({fn: window.APFeedbackName(), status: document.getElementById('feedbackNameStatus').textContent, previa: document.getElementById('feedbackNamePreview').textContent}));
  conferir('apagar o nome volta a Agenda Personal', limpo.fn === '' && limpo.status === 'Nome removido. Volta a aparecer Agenda Personal.' && limpo.previa === 'No cartão: Agenda Personal · Acompanhamento de treino.', JSON.stringify(limpo));
  const r3 = await rodape(pg, '');
  conferir('rodapé vazio = Agenda Personal', r3.ultimo === 'Agenda Personal · Acompanhamento de treino.', r3.ultimo);

  // letras grandes (Configurações → Extra grande) e captura
  await pg.fill('#feedbackNameInput', 'Tiago Lima · Personal');
  await pg.evaluate(() => document.querySelector('[data-teacher-text="xlarge"]').click());
  await pg.waitForTimeout(400);
  const xl = await pg.evaluate(() => { const r = document.querySelector('.feedback-name-row'), b = r.querySelector('.btn').getBoundingClientRect(), i = r.querySelector('input').getBoundingClientRect(), s = document.querySelector('.feedback-name-setting').getBoundingClientRect(); return {cabe: b.right <= s.right + 0.5 && i.left >= s.left, mesmaLinha: Math.abs(b.top - i.top) < 4}; });
  conferir('Extra grande: campo e botão cabem no cartão', xl.cabe && xl.mesmaLinha, JSON.stringify(xl));
  await pg.locator('.feedback-name-setting').screenshot({path: SHOTS + '/302-config-extra-grande.png'});
  await pg.evaluate(() => document.querySelector('[data-teacher-text="normal"]').click());

  // ---------------------------------------------------------------- mesmo cartão sem nome: igual ao 1.12.301 (pixel a pixel)
  const pg301 = await abrir('301-professor.html', {estado: ESTADO});
  const a301 = await rodape(pg301, undefined), a302 = await rodape(pg, undefined);
  conferir('sem nome, o cartão do professor é idêntico ao 1.12.301', a301.dados === a302.dados && a301.ultimo === 'Agenda Personal · Acompanhamento de treino.', a301.ultimo + ' / ' + a302.ultimo);

  // ---------------------------------------------------------------- aluno 1.12.302
  const al = await abrir('302-index.html');
  const expr = await al.evaluate(() => (document.getElementById('ap-feedback-student').textContent.match(/brand:(String\(window\.__AP_STUDENT_CONTEXT\?\.area\?\.trainer\?\.feedbackName\|\|""\))/) || [])[1] || '');
  conferir('o cartão do aluno passa o nome da área dele (código do bloco)', expr === 'String(window.__AP_STUDENT_CONTEXT?.area?.trainer?.feedbackName||"")', expr);
  const nomeAluno = await al.evaluate(([expr, area]) => { window.__AP_STUDENT_CONTEXT = {role: 'student', area}; return Function('return ' + expr)(); }, [expr, area]);
  const s1 = await rodape(al, nomeAluno);
  conferir('aluno com a área nova: rodapé com o nome do professor', s1.ultimo === 'Tiago Lima · Personal · Acompanhamento de treino.', s1.ultimo);
  const nomeVazio = await al.evaluate(expr => { window.__AP_STUDENT_CONTEXT = null; return Function('return ' + expr)(); }, expr);
  const s2 = await rodape(al, nomeVazio);
  conferir('aluno sem área (ou área antiga): Agenda Personal', s2.ultimo === 'Agenda Personal · Acompanhamento de treino.', s2.ultimo);
  conferir('aluno 1.12.302 aceita a área nova', await al.evaluate(a => { try { APStudentModel.assertArea(a); return true; } catch (e) { return e.message; } }, area) === true);

  // ---------------------------------------------------------------- aluno com o pacote antigo (1.12.301) recebendo a área nova
  const velho = await abrir('301-index.html');
  conferir('aluno 1.12.301 aceita a área com o campo novo (ignora)', await velho.evaluate(a => { try { APStudentModel.assertArea(a); return true; } catch (e) { return e.message; } }, area) === true);
  const v1 = await rodape(velho, undefined), v2 = await rodape(al, undefined);
  conferir('sem nome, o cartão do aluno é idêntico ao 1.12.301', v1.dados === v2.dados);

  conferir('sem erros de JavaScript nas páginas', erros.length === 0, erros.slice(0, 3).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
