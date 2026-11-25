'use strict';
// Teste no Chrome do 1.12.315 (Criar treino manual no cartão Aluno e ficha; sai o quadro da ficha vazia), com o 1.12.314 como
// comparação. Sozinho: lê os pacotes da raiz e serve as páginas reais num servidor local. Usa só o aluno e o texto FICTÍCIOS
// (equipe/testes/texto-prescricao/exemplo-ficticio.md). Não usa rede, Firebase, aparelho nem dado de aluno real.
// Uso: node equipe/testes/navegador/criar-treino-manual-315/criar-treino-manual-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../../../..');
const SHOTS = process.argv[2] || '/tmp/t315';
const P315 = 'AgendaPersonal-1.12.315-Criar-Treino-Manual-Para-Assinar.agenda.json';
const P314 = 'AgendaPersonal-1.12.314-Treino-Por-Texto-Para-Assinar.agenda.json';
const TEXTO = fs.readFileSync(path.join(RAIZ, 'equipe/testes/texto-prescricao/exemplo-ficticio.md'), 'utf8');
const ORDEM = ['Criar treino manual', 'Importar treino por PDF', 'Importar treino por texto', 'Inativar nos treinos'];
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

(async () => {
  const pacote = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  const p315 = pacote(P315), p314 = pacote(P314);
  const g = require(path.join(RAIZ, 'tools/gerar-criar-treino-manual-1.12.315.cjs'));
  fs.mkdirSync(SHOTS, {recursive: true});

  // ---------------------------------------------------------------- 0. O que mudou em relação ao 1.12.314
  let volta = p315.files['professor.html'];
  for (const [antes, depois] of g.TROCAS) { conferir('professor.html: trecho novo aparece uma vez — ' + depois.slice(0, 50), volta.split(depois).length === 2); volta = volta.replace(depois, () => antes); }
  conferir('professor.html: desfeitas as três trocas, é idêntico ao 1.12.314', volta === p314.files['professor.html']);
  conferir('index.html idêntico ao 1.12.314', p315.files['index.html'] === p314.files['index.html']);
  conferir('os demais arquivos do pacote são idênticos ao 1.12.314', Object.keys(p314.files).every(f => f === 'professor.html' || p315.files[f] === p314.files[f]) && Object.keys(p315.files).length === Object.keys(p314.files).length);
  conferir('versão e sequência', p315.version === '1.12.315' && p315.sequence === 421 && !('agendaSignature' in p315));

  const paginas = {'/315-professor.html': p315.files['professor.html'], '/314-professor.html': p314.files['professor.html']};
  const servidor = http.createServer((req, res) => {
    const corpo = paginas[req.url.split('?')[0]];
    if (corpo === undefined) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); res.end(corpo);
  });
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const BASE = 'http://127.0.0.1:' + servidor.address().port;
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  const novaPagina = async (url, rotulo) => {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 915}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(rotulo + ': ' + e.message));
    pg.on('dialog', d => d.accept());
    await pg.goto(BASE + url); await pg.waitForTimeout(700);
    return {ctx, pg};
  };
  const aluno = {id: 's1', name: 'Maria Exemplo da Silva', studentType: 'presencial', phone: '(65) 90000-0000', location: '', notes: '', financeEnabled: false, startDate: '', dueDate: '', monthlyValue: '', paymentReminderDays: 3, photoDataUrl: '', workoutInactive: false, importedTrainingProfile: null, trainingDocuments: []};
  const ficha = (id, extra = {}) => ({id, studentId: 's1', name: 'Ficha ' + id, goal: 'Hipertrofia', level: 'Iniciante', startDate: '2026-11-01', endDate: '', organization: 'sequence', visibility: 'always', autoArchive: false, notes: '', createdAt: '2026-11-0' + id.slice(-1) + 'T10:00:00.000Z', days: [{id: id + 'd1', name: 'DIA A - Teste', weekday: 1, notes: '', exercises: []}], ...extra});
  const abrir = async (pg, planos) => {
    await pg.evaluate(([a, planos]) => { state.students.push(a); state.workoutPlans = planos; showScreen('workouts'); openWorkoutStudent('s1'); }, [aluno, planos]);
    await pg.waitForTimeout(300);
  };
  const ler = pg => pg.evaluate(() => {
    const c = document.getElementById('workoutStudentContent'), d = document.getElementById('workoutStudentOptions');
    const bts = d ? [...d.querySelectorAll('.workout-sheet-options-body > .workout-actions > button')] : [];
    const r = bts.map(b => b.getBoundingClientRect());
    return {quadro: !!c.querySelector('.workout-empty'), textoVazio: /ainda não tem ficha|Nenhuma ficha ativa/.test(c.textContent), aberto: !!d?.open,
      botoes: bts.map(b => b.textContent.trim()), grade: r.length === 4 && Math.abs(r[0].top - r[1].top) < 1 && Math.abs(r[2].top - r[3].top) < 1 && r[2].top > r[0].top && Math.abs(r[0].width - r[1].width) < 1 && Math.abs(r[0].width - r[2].width) < 1,
      largura: document.getElementById('workoutStudentDialog').scrollWidth <= innerWidth + 1, novaFicha: [...c.querySelectorAll('.workout-sheet-actions button')].some(b => b.textContent.trim() === 'Nova ficha'),
      abas: [...c.querySelectorAll('.workout-plan-collection-tab')].map(b => b.textContent.replace(/\s+/g, ' ').trim())};
  });

  // ---------------------------------------------------------------- A. Aluno sem ficha (o caso do print do Tiago)
  {
    const {ctx, pg} = await novaPagina('/315-professor.html', 'professor 315');
    await abrir(pg, []);
    const v = await ler(pg);
    conferir('sem ficha: o quadro "Este aluno ainda não tem ficha de treino" saiu', !v.quadro && !v.textoVazio);
    conferir('sem ficha: o cartão Aluno e ficha já aparece aberto', v.aberto);
    conferir('botões na ordem: Criar treino manual, PDF, texto, Inativar', JSON.stringify(v.botoes) === JSON.stringify(ORDEM), JSON.stringify(v.botoes));
    conferir('quatro botões em grade 2 × 2, mesma largura; nada passa da tela', v.grade && v.largura);
    conferir('abas Ativas 0 e Arquivadas 0 continuam', JSON.stringify(v.abas) === JSON.stringify(['Ativas 0', 'Arquivadas 0']), JSON.stringify(v.abas));
    await pg.evaluate(() => document.querySelector('#workoutStudentDialog .sheet').scrollTo(0, 0));
    await pg.screenshot({path: SHOTS + '/315-sem-ficha.png'});
    await pg.evaluate(() => document.getElementById('workoutStudentOptions').scrollIntoView({block: 'start'}));
    await pg.screenshot({path: SHOTS + '/315-sem-ficha-cartao.png'});

    // Cada botão faz o mesmo que antes
    // PDF: o seletor de arquivo não abre no Chrome de teste; confere que o botão chama a mesma função de antes, para este aluno.
    await pg.evaluate(() => { window.__pdf = null; const orig = chooseWorkoutPdfImport; window.chooseWorkoutPdfImport = id => { window.__pdf = id; }; window.__pdfOrig = orig; });
    await pg.click('#workoutStudentOptions .workout-actions button:nth-child(2)'); await pg.waitForTimeout(100);
    conferir('Importar treino por PDF: chama a importação por PDF deste aluno', await pg.evaluate(() => window.__pdf === 's1'));
    await pg.evaluate(() => { window.chooseWorkoutPdfImport = window.__pdfOrig; });
    await pg.click('#workoutStudentOptions .workout-actions button:nth-child(3)'); await pg.waitForTimeout(150);
    conferir('Importar treino por texto: abre a janela de colar o texto', await pg.evaluate(() => document.getElementById('apTextoDialog')?.classList.contains('open')));
    await pg.evaluate(() => APTreinoTexto.fechar()); await pg.waitForTimeout(100);
    await pg.click('#workoutStudentOptions .workout-actions button:nth-child(1)'); await pg.waitForTimeout(150);
    const editor = await pg.evaluate(() => ({aberto: document.getElementById('workoutPlanDialog').classList.contains('open'), titulo: document.getElementById('workoutPlanTitle').textContent, aluno: document.getElementById('workoutPlanStudent').textContent}));
    conferir('Criar treino manual: abre "Nova ficha de treino" deste aluno', editor.aberto && editor.titulo === 'Nova ficha de treino' && editor.aluno === aluno.name, JSON.stringify(editor));
    await pg.screenshot({path: SHOTS + '/315-criar-treino-manual.png'});
    await pg.fill('#workoutPlanName', 'Ficha manual de teste');
    await pg.click('#workoutPlanForm button[type="submit"]'); await pg.waitForTimeout(400);
    const criada = await pg.evaluate(() => ({n: state.workoutPlans.length, nome: state.workoutPlans[0]?.name, aluno: state.workoutPlans[0]?.studentId, vazio: !!document.querySelector('#workoutStudentContent .workout-empty'), nova: !!document.querySelector('#workoutStudentContent .workout-sheet-actions')}));
    conferir('a ficha manual é criada para o aluno e a tela mostra a ficha', criada.n === 1 && criada.nome === 'Ficha manual de teste' && criada.aluno === 's1' && criada.nova && !criada.vazio, JSON.stringify(criada));

    // Inativar continua funcionando no último lugar
    await pg.click('#workoutStudentOptions .workout-actions button:nth-child(4)'); await pg.waitForTimeout(300);
    const inat = await pg.evaluate(() => ({flag: state.students.find(s => s.id === 's1').workoutInactive, ultimo: document.querySelector('#workoutStudentOptions .workout-actions button:nth-child(4)')?.textContent.trim()}));
    conferir('Inativar nos treinos (com confirmação) continua funcionando e vira Reativar, no último lugar', inat.flag === true && inat.ultimo === 'Reativar nos treinos', JSON.stringify(inat));
    await ctx.close();
  }

  // ---------------------------------------------------------------- B. Importar por texto a partir do cartão (fluxo completo)
  {
    const {ctx, pg} = await novaPagina('/315-professor.html', 'professor 315 texto');
    await abrir(pg, []);
    await pg.click('#workoutStudentOptions .workout-actions button:nth-child(3)'); await pg.waitForTimeout(150);
    await pg.fill('#apTextoEntrada', TEXTO); await pg.click('#apTextoLer'); await pg.waitForTimeout(250);
    await pg.click('[data-ap-texto="criar"]'); await pg.waitForTimeout(500);
    const f = await pg.evaluate(() => { const p = state.workoutPlans.at(-1); return p ? {dias: p.days.length, ultimos: p.days.map(d => d.exercises.at(-1)?.category)} : null; });
    conferir('importar por texto a partir do cartão: cria a ficha com 3 treinos e o cardio por último', f && f.dias === 3 && f.ultimos.every(c => c === 'Cardio'), JSON.stringify(f));
    await ctx.close();
  }

  // ---------------------------------------------------------------- C. Só fichas arquivadas
  {
    const {ctx, pg} = await novaPagina('/315-professor.html', 'professor 315 arquivadas');
    await abrir(pg, [ficha('p1', {archivedAt: '2026-11-10T10:00:00.000Z', archived: true})]);
    const v = await ler(pg);
    const arquivada = await pg.evaluate(() => state.workoutPlans.filter(workoutPlanArchived).length);
    conferir('só arquivadas: sem o quadro, cartão aberto, aba Arquivadas 1', arquivada === 1 && !v.quadro && v.aberto && v.abas[1] === 'Arquivadas 1', JSON.stringify({arquivada, ...v}));
    await pg.click('.workout-plan-collection-tab:nth-child(2)'); await pg.waitForTimeout(250);
    conferir('a aba Arquivadas continua listando a ficha', await pg.evaluate(() => document.querySelectorAll('#workoutStudentContent .workout-archive-collection article').length === 1));
    await ctx.close();
  }

  // ---------------------------------------------------------------- D. Aluno com ficha ativa: comportamento de antes
  {
    const {ctx, pg} = await novaPagina('/315-professor.html', 'professor 315 com ficha');
    await abrir(pg, [ficha('p1')]);
    const v = await ler(pg);
    conferir('com ficha ativa: o cartão abre fechado (como antes) e Nova ficha continua em Ações da ficha', !v.aberto && v.novaFicha && !v.quadro);
    conferir('com ficha ativa: os mesmos quatro botões no cartão', JSON.stringify(v.botoes) === JSON.stringify(ORDEM), JSON.stringify(v.botoes));
    await pg.evaluate(() => openWorkoutStudentOptions()); await pg.waitForTimeout(150);
    conferir('o botão do topo (Aluno e ficha) abre o cartão', await pg.evaluate(() => document.getElementById('workoutStudentOptions').open));
    await pg.screenshot({path: SHOTS + '/315-com-ficha-cartao.png'});
    await ctx.close();
  }

  // ---------------------------------------------------------------- E. Comparação: no 1.12.314 o quadro existia e o cartão abria fechado
  {
    const {ctx, pg} = await novaPagina('/314-professor.html', 'professor 314');
    await abrir(pg, []);
    const v = await ler(pg);
    conferir('1.12.314 (antes): quadro presente e cartão fechado — a mudança é só do 1.12.315', v.quadro && !v.aberto);
    await ctx.close();
  }

  conferir('nenhum erro de página nas telas testadas', erros.length === 0, erros.join(' | '));
  await navegador.close(); servidor.close();
  console.log('\n' + ok + ' verificações OK, ' + falhas + ' falhas');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
