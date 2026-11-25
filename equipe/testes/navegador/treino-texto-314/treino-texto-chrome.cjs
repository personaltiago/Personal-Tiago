'use strict';
// Teste no Chrome do 1.12.314 (Importar treino por texto + Orientações do aluno), com o 1.12.313 como comparação.
// Sozinho: lê os pacotes da raiz, serve as páginas reais num servidor local e usa o texto FICTÍCIO de
// equipe/testes/texto-prescricao/exemplo-ficticio.md. Não usa rede, Firebase, aparelho nem dado de aluno real.
// Uso: node equipe/testes/navegador/treino-texto-314/treino-texto-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../../../..');
const SHOTS = process.argv[2] || '/tmp/t314';
const P314 = 'AgendaPersonal-1.12.314-Treino-Por-Texto-Para-Assinar.agenda.json';
const P313 = 'AgendaPersonal-1.12.313-Aviso-No-Relogio-Para-Assinar.agenda.json';
const TEXTO = fs.readFileSync(path.join(RAIZ, 'equipe/testes/texto-prescricao/exemplo-ficticio.md'), 'utf8');
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

(async () => {
  const pacote = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  const p314 = pacote(P314), p313 = pacote(P313);
  const g = require(path.join(RAIZ, 'tools/gerar-treino-texto-1.12.314.cjs'));
  fs.mkdirSync(SHOTS, {recursive: true});

  // ---------------------------------------------------------------- 0. O que mudou em relação ao 1.12.313
  const blP = '<style id="ap-treino-texto-css">' + g.PROFESSOR_CSS + '</style>\n<script id="ap-treino-texto">' + g.PROFESSOR_JS + '\n</script>\n';
  const blA = '<style id="ap-orientacoes-aluno-css">' + g.ALUNO_CSS + '</style>\n<script id="ap-orientacoes-aluno">' + g.ALUNO_JS + '\n</script>\n';
  conferir('index.html: os dois blocos novos aparecem uma vez', p314.files['index.html'].split(blA).length === 2);
  conferir('index.html: sem os blocos novos, é idêntico ao 1.12.313', p314.files['index.html'].replace(blA, '') === p313.files['index.html']);
  conferir('professor.html: os dois blocos novos aparecem uma vez', p314.files['professor.html'].split(blP).length === 2);
  const volta = p314.files['professor.html'].replace(blP, '')
    .replace('<button class="btn" type="button" onclick="window.APTreinoTexto&&APTreinoTexto.abrir()">Importar treino por texto</button></div>', '</div>')
    .replace('<button class="btn full" type="button" onclick="window.APTreinoTexto&&APTreinoTexto.abrir()">Importar treino por texto</button></div>${context}', '</div>${context}');
  conferir('professor.html: tirados os blocos e os dois botões, é idêntico ao 1.12.313', volta === p313.files['professor.html']);
  for (const f of Object.keys(p313.files).filter(f => !['index.html', 'professor.html'].includes(f))) if (p314.files[f] !== p313.files[f]) conferir(f + ' idêntico', false);
  conferir('os demais arquivos do pacote são idênticos ao 1.12.313', true);
  conferir('versão e sequência', p314.version === '1.12.314' && p314.sequence === 420 && !('agendaSignature' in p314));

  const paginas = {'/314-professor.html': p314.files['professor.html'], '/314-index.html': p314.files['index.html']};
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
    await pg.goto(BASE + url); await pg.waitForTimeout(700);
    return {ctx, pg};
  };
  const aluno = nome => ({id: 's1', name: nome, studentType: 'presencial', phone: '', location: '', notes: '', financeEnabled: false, startDate: '', dueDate: '', monthlyValue: '', paymentReminderDays: 3, photoDataUrl: '', workoutInactive: false, importedTrainingProfile: null, trainingDocuments: []});
  const preparar = async (pg, nome = 'Maria Exemplo da Silva') => {
    await pg.evaluate(a => { state.students.push(a); state.workoutPlans = []; showScreen('workouts'); openWorkoutStudent('s1'); }, aluno(nome));
    await pg.waitForTimeout(250);
  };
  const colar = async (pg, texto = TEXTO) => {
    await pg.evaluate(() => APTreinoTexto.abrir()); await pg.waitForTimeout(150);
    await pg.fill('#apTextoEntrada', texto);
    await pg.click('#apTextoLer'); await pg.waitForTimeout(200);
  };
  const ficha = pg => pg.evaluate(() => JSON.parse(JSON.stringify(state.workoutPlans.at(-1) || null)));

  // ---------------------------------------------------------------- A. Professor
  {
    const {ctx, pg} = await novaPagina('/314-professor.html', 'professor');
    await preparar(pg);
    const botoes = await pg.evaluate(() => [...document.querySelectorAll('#workoutStudentContent button')].map(b => b.textContent.trim()).filter(t => /Importar treino|Criar ficha/.test(t)));
    conferir('ficha vazia: botões Criar ficha, Importar por texto e (no perfil) por PDF e por texto', botoes.includes('Criar ficha de treino') && botoes.filter(t => t === 'Importar treino por texto').length === 2 && botoes.includes('Importar treino por PDF'), JSON.stringify(botoes));
    await pg.screenshot({path: SHOTS + '/314-professor-ficha-vazia.png'});

    // 1. Colar
    await pg.click('#workoutStudentContent button.btn.full:has-text("Importar treino por texto")'); await pg.waitForTimeout(200);
    conferir('abre a janela para colar, Ler desabilitado sem texto', await pg.evaluate(() => document.getElementById('apTextoDialog').classList.contains('open') && document.getElementById('apTextoLer').disabled));
    await pg.fill('#apTextoEntrada', 'Olá, segue a ficha amanhã, combinado, até lá então.'); await pg.click('#apTextoLer'); await pg.waitForTimeout(150);
    conferir('texto sem treino: mensagem clara e nada é lido', await pg.evaluate(() => /Não encontrei os treinos por dia/.test(document.getElementById('apTextoAviso').textContent) && !document.querySelector('.workout-import-summary')));
    await pg.fill('#apTextoEntrada', TEXTO); await pg.click('#apTextoLer'); await pg.waitForTimeout(250);

    // 2. Revisão
    const rev = await pg.evaluate(() => ({
      resumo: [...document.querySelectorAll('.workout-import-summary > div')].map(d => d.textContent),
      dias: [...document.querySelectorAll('.ap-texto-dia > summary strong')].map(s => s.textContent),
      cardioLinhas: document.querySelectorAll('.ap-texto-cardio-linha').length,
      orient: document.getElementById('apTextoOrient').value, cria: !document.querySelector('[data-ap-texto="criar"]').disabled,
      nota: document.getElementById('apTextoNota').textContent, nomeConf: !!document.querySelector('[data-ap-texto="nome"]'),
      faixa: !!document.querySelector('select[data-ap-texto="descanso"]'), usar: document.querySelectorAll('[data-ap-texto="usar"]').length,
      cardioMin: document.querySelector('[data-ap-texto="cardio-m"]').value, cardioSeg: document.querySelector('[data-ap-texto="cardio-s"]').value,
      ignorados: [...document.querySelectorAll('.workout-import-section')].at(-1).textContent, larguraOk: document.getElementById('apTextoDialog').scrollWidth <= innerWidth + 1}));
    conferir('resumo: 3 treinos, 6 exercícios, 3 orientações', rev.resumo[0].startsWith('3') && rev.resumo[1].startsWith('6') && rev.resumo[3].startsWith('3'), JSON.stringify(rev.resumo));
    conferir('os três dias com nome DIA X - título', JSON.stringify(rev.dias) === JSON.stringify(['DIA A - Quadríceps, posterior e panturrilhas', 'DIA B - Peito, costas, ombros e braços', 'DIA C - Glúteos e abdômen']), JSON.stringify(rev.dias));
    conferir('cardio no fim dos 3 treinos, no menor tempo da faixa (10 min)', rev.cardioLinhas === 3 && rev.cardioMin === '10' && rev.cardioSeg === '0');
    conferir('orientações gerais prontas para editar, uma por linha com •', rev.orient.split('\n').length === 3 && rev.orient.startsWith('• Siga os dias'));
    conferir('descanso em faixa: o app pergunta qual valor usar', rev.faixa);
    conferir('"Como fazer" do texto: caixa para cada exercício que tem texto (3)', rev.usar === 3, String(rev.usar));
    conferir('seções só do professor ficam de fora e avisadas', /Classificação das orientações/.test(rev.ignorados) && /Auditoria final/.test(rev.ignorados));
    conferir('pronto para criar; cabe na tela', rev.cria && rev.nota === 'Tudo pronto para criar a ficha.' && rev.larguraOk, rev.nota);
    await pg.evaluate(() => document.querySelector('#apTextoDialog .sheet').scrollTo(0, 0));
    await pg.screenshot({path: SHOTS + '/314-professor-revisao-topo.png'});
    await pg.evaluate(() => document.getElementById('apTextoCorpo').scrollIntoView(false));
    await pg.evaluate(() => document.querySelector('.ap-texto-dia').scrollIntoView());
    await pg.screenshot({path: SHOTS + '/314-professor-revisao-treinos.png'});
    await pg.evaluate(() => document.querySelector('#apTextoOrient').scrollIntoView({block: 'center'}));
    await pg.screenshot({path: SHOTS + '/314-professor-revisao-orientacoes.png'});

    // 3. Voltar ao texto mantém o texto
    await pg.click('[data-ap-texto="voltar"]'); await pg.waitForTimeout(100);
    conferir('Voltar ao texto mantém o que foi colado', (await pg.inputValue('#apTextoEntrada')) === TEXTO);
    await pg.click('#apTextoLer'); await pg.waitForTimeout(200);

    // 4. Escolhas: tirar o Como fazer de Sobe/Desce; cardio no fim de A e B, não no C; 15 min
    const antes = await pg.evaluate(() => JSON.stringify(state.students));
    await pg.uncheck('[data-ap-texto="usar"][data-k="A:0"]');
    await pg.uncheck('[data-ap-texto="cardio-dia"][data-dia="C"]');
    await pg.click('[data-ap-texto="cardio-max"]'); await pg.waitForTimeout(100);
    const apos = await pg.evaluate(() => ({m: document.querySelector('[data-ap-texto="cardio-m"]').value, usarA0: document.querySelector('[data-ap-texto="usar"][data-k="A:0"]').checked, linhas: document.querySelectorAll('.ap-texto-cardio-linha').length, cDia: document.querySelector('[data-ap-texto="cardio-dia"][data-dia="C"]').checked}));
    conferir('faixa do cardio: escolher 15 min preenche o tempo; escolhas continuam depois de redesenhar', apos.m === '15' && !apos.usarA0 && apos.linhas === 2 && !apos.cDia, JSON.stringify(apos));
    await pg.click('[data-ap-texto="criar"]'); await pg.waitForTimeout(400);

    // 5. O que foi criado
    const p = await ficha(pg);
    const rest = await pg.evaluate(() => state.workoutPlans.at(-1).days.flatMap(d => d.exercises).filter(e => e.category !== 'Cardio').map(e => workoutRestDuration(e.rest)));
    conferir('ficha nova do aluno, nome e objetivo', p && p.studentId === 's1' && p.name === 'Treino por texto · Emagrecimento' && p.goal === 'Emagrecimento' && p.level === 'Iniciante' && p.organization === 'sequence' && !p.archived, JSON.stringify(p && [p.name, p.goal, p.level]));
    conferir('orientações gerais na ficha, uma por linha', p.notes.split('\n').length === 3 && p.notes.includes('• Interrompa a série se perder o controle do movimento.'));
    conferir('3 treinos, em segunda, terça e quarta', p.days.length === 3 && p.days.map(d => d.weekday).join() === '1,2,3' && p.days[0].name.startsWith('DIA A - '));
    conferir('exercícios por treino: A 3+cardio, B 2+cardio, C 1 (sem cardio)', p.days.map(d => d.exercises.length).join() === '4,3,1', p.days.map(d => d.exercises.length).join());
    const cardA = p.days[0].exercises.at(-1), cardB = p.days[1].exercises.at(-1);
    conferir('cardio é o ÚLTIMO de A e B, com o tempo exato (15 min = 900 s)', cardA.category === 'Cardio' && cardA.durationSeconds === 900 && cardB.durationSeconds === 900 && p.days[2].exercises.every(e => e.category !== 'Cardio'), JSON.stringify([cardA.name, cardA.durationSeconds, cardB.category]));
    conferir('card de cardio: modalidade, orientações e campos do cardio por tempo', cardA.name === 'Cardio · Caminhada na esteira' && cardA.sets === '1' && cardA.reps === '900 s' && cardA.load === '' && cardA.rest === '' && cardA.notes.startsWith('Manter ritmo confortável'), JSON.stringify([cardA.name, cardA.reps, cardA.notes]));
    const cardio = await pg.evaluate(() => { const e = state.workoutPlans.at(-1).days[0].exercises.at(-1); return {is: APCardio.is(e), dur: APCardio.duration(e)}; });
    conferir('o app reconhece como cardio e lê 900 s', cardio.is && cardio.dur === 900, JSON.stringify(cardio));
    const e0 = p.days[0].exercises[0], e1 = p.days[0].exercises[1];
    conferir('séries, repetições (hífen) e descanso em número único', e0.sets === '2' && e0.reps === '8-12 por perna' && e0.rest === '75 s' && e1.sets === '3' && e1.reps === '12-15' && e1.rest === '60 s', JSON.stringify([e0.sets, e0.reps, e0.rest, e1.rest]));
    conferir('descanso funciona no cronômetro do professor (lido, sem mexer)', rest.length === 6 && rest.every(n => n > 0), JSON.stringify(rest));
    conferir('Sobe/Desce: Como fazer do texto tirado, entra o da galeria (ou fica vazio se a galeria não tem)', e0.sourceNotes === '' && e0.notesOrigin !== 'text' && e0.notes !== 'use um banco baixo e estável.', JSON.stringify([e0.notesOrigin, e0.notes.slice(0, 40)]));
    conferir('Extensora: Como fazer do texto mantido', e1.notes === 'mantenha as costas apoiadas.' && e1.notesOrigin === 'text' && e1.sourceNotes === e1.notes);
    conferir('nome do exercício sem o código (E391)', !p.days.flatMap(d => d.exercises).some(e => /\(E\d+\)/.test(e.name)) && e0.name === 'Sobe/Desce no Banco');
    conferir('exercícios da galeria ficam vinculados (catalogId)', !!e0.catalogId && !!e1.catalogId, JSON.stringify([e0.catalogId, e1.catalogId, cardA.catalogId]));
    conferir('sem documento de origem (o texto não é guardado)', p.sourceDocumentId === '' && p.days.every(d => d.sourceDocumentId === ''));
    conferir('cadastro do aluno não foi alterado', (await pg.evaluate(() => JSON.stringify(state.students))) === antes);
    conferir('janela fecha e a ficha nova fica aberta', await pg.evaluate(() => !document.getElementById('apTextoDialog').classList.contains('open') && workoutPlanId === state.workoutPlans.at(-1).id));
    await pg.waitForTimeout(250);
    await pg.screenshot({path: SHOTS + '/314-professor-ficha-criada.png'});
    const hist = await pg.evaluate(() => state.history[0]?.text);
    conferir('histórico registra a importação', /^Treino importado de texto · Maria Exemplo da Silva/.test(hist || ''), hist);
    await ctx.close();
  }

  // ---------------------------------------------------------------- B. Professor: casos de borda
  {
    const {ctx, pg} = await novaPagina('/314-professor.html', 'professor bordas');
    await preparar(pg, 'Joana Outra Pessoa');
    await colar(pg);
    const bloqueio = await pg.evaluate(() => ({desab: document.querySelector('[data-ap-texto="criar"]').disabled, nota: document.getElementById('apTextoNota').textContent, aviso: document.querySelector('[data-ap-texto="nome"]') ? document.querySelector('.workout-import-item.warn p').textContent : ''}));
    conferir('nome diferente do aluno: bloqueia até confirmar', bloqueio.desab && /Confirme que o texto é deste aluno/.test(bloqueio.nota) && /Maria Exemplo da Silva/.test(bloqueio.aviso), JSON.stringify(bloqueio));
    await pg.check('[data-ap-texto="nome"]'); await pg.waitForTimeout(60);
    conferir('confirmando, libera', await pg.evaluate(() => !document.querySelector('[data-ap-texto="criar"]').disabled));
    // orientações grandes demais
    await pg.fill('#apTextoOrient', '• ' + 'a'.repeat(4100));
    conferir('orientações com mais de 4000 caracteres bloqueiam', await pg.evaluate(() => document.querySelector('[data-ap-texto="criar"]').disabled && /passam de 4000/.test(document.getElementById('apTextoNota').textContent)));
    await pg.fill('#apTextoOrient', '');
    await pg.click('[data-ap-texto="tirar-todos"]'); await pg.waitForTimeout(60);
    conferir('Tirar todos desmarca todos os Como fazer', await pg.evaluate(() => [...document.querySelectorAll('[data-ap-texto="usar"]')].every(c => !c.checked)));
    // faixa: menor valor; cardio com tempo 0 bloqueia
    await pg.selectOption('select[data-ap-texto="descanso"]', 'min'); await pg.waitForTimeout(60);
    await pg.fill('[data-ap-texto="cardio-m"]', '0'); await pg.fill('[data-ap-texto="cardio-s"]', '0');
    conferir('cardio sem tempo bloqueia a criação', await pg.evaluate(() => document.querySelector('[data-ap-texto="criar"]').disabled && /tempo do cardio/.test(document.getElementById('apTextoNota').textContent)));
    await pg.fill('[data-ap-texto="cardio-m"]', '1'); await pg.fill('[data-ap-texto="cardio-s"]', '30');
    conferir('90 s = 1 min 30 s é aceito', await pg.evaluate(() => !document.querySelector('[data-ap-texto="criar"]').disabled));
    await pg.click('[data-ap-texto="criar"]'); await pg.waitForTimeout(400);
    const p = await ficha(pg);
    const ext = p.days[0].exercises[1];
    conferir('menor valor da faixa (45 s); Como fazer do texto fora; cardio 90 s; sem orientações', ext.rest === '45 s' && ext.sourceNotes === '' && p.days[0].exercises.at(-1).durationSeconds === 90 && p.notes === '', JSON.stringify([ext.rest, p.days[0].exercises.at(-1).durationSeconds, p.notes]));
    // texto sem cardio: nenhum card
    await pg.evaluate(() => { state.workoutPlans = []; });
    await colar(pg, TEXTO.replace(/### 5[\s\S]*?(?=### 6)/, ''));
    conferir('texto sem cardio: aviso na revisão e nenhuma linha de cardio', await pg.evaluate(() => /Sem card de cardio/.test(document.body.textContent) && !document.querySelector('.ap-texto-cardio-linha') && !document.querySelector('[data-ap-texto="cardio-m"]')));
    await pg.check('[data-ap-texto="nome"]');
    await pg.click('[data-ap-texto="criar"]'); await pg.waitForTimeout(300);
    const q = await ficha(pg);
    conferir('texto sem cardio: nenhum exercício de cardio na ficha', q.days.flatMap(d => d.exercises).every(e => e.category !== 'Cardio') && q.days.map(d => d.exercises.length).join() === '3,2,1');
    // Cancelar
    await pg.evaluate(() => APTreinoTexto.abrir()); await pg.waitForTimeout(100);
    await pg.click('#apTextoDialog [data-ap-texto="fechar"]'); await pg.waitForTimeout(100);
    conferir('Cancelar fecha sem criar nada', await pg.evaluate(() => !document.getElementById('apTextoDialog').classList.contains('open') && state.workoutPlans.length === 1));
    conferir('PDF continua lá: botão e função do PDF intactos', await pg.evaluate(() => typeof chooseWorkoutPdfImportForStudent === 'function' && typeof confirmWorkoutPdfImport === 'function' && !!document.getElementById('workoutPdfImportDialog')));
    await ctx.close();
  }

  // ---------------------------------------------------------------- C. Aluno
  {
    const {ctx, pg} = await novaPagina('/314-index.html', 'aluno');
    const area = geral => ({enabled: true, plans: [{id: 'p1', name: 'Treino por texto · Emagrecimento', notes: geral, days: [{id: 'd1', name: 'DIA A - Pernas', notes: '', exercises: []}, {id: 'd2', name: 'DIA B - Peito', notes: 'Comece leve e sem pressa.', exercises: []}]}]});
    const estado = () => pg.evaluate(() => { const b = document.getElementById('apOrientBtn'); return b && {oculto: b.hidden, depoisDoCabecalho: b.previousElementSibling?.classList.contains('ws-header'), texto: b.innerText.replace(/\s+/g, ' ').trim()}; });
    await pg.evaluate(() => { document.getElementById('workoutsScreen').hidden = false; document.getElementById('workoutsScreen').style.display = 'flex'; window.__AP_STUDENT_CONTEXT = {role: 'student', area: {enabled: true, plans: [{id: 'p', name: 'x', notes: '', days: [{id: 'd', name: 'A', notes: '', exercises: []}]}]}}; APOrientacoesAluno.pintar(); });
    conferir('sem orientações na ficha: nenhum botão', (await estado()) === null || (await estado()).oculto);
    const geral = '• Siga os dias na ordem cadastrada.\n• Interrompa a série se perder o controle do movimento.\n• Registre cargas e repetições realizadas.';
    await pg.evaluate(([a]) => { window.__AP_STUDENT_CONTEXT = {role: 'student', area: a}; APOrientacoesAluno.pintar(); }, [area(geral)]);
    let e = await estado();
    conferir('com orientações: botão "Orientações" logo abaixo do cabeçalho de Meus treinos', e && !e.oculto && e.depoisDoCabecalho && e.texto === 'Orientações Leia antes de treinar', JSON.stringify(e));
    await pg.screenshot({path: SHOTS + '/314-aluno-botao.png'});
    await pg.click('#apOrientBtn'); await pg.waitForTimeout(200);
    const d = await pg.evaluate(() => { const x = document.getElementById('apOrientDialog'); return x && {aberto: x.open, titulo: x.querySelector('h2').textContent, secoes: [...x.querySelectorAll('h4')].map(h => h.textContent), itens: x.querySelectorAll('li').length, paragrafos: [...x.querySelectorAll('p')].map(p => p.textContent), foco: document.activeElement.id, larg: x.getBoundingClientRect().width <= innerWidth, fundo: getComputedStyle(x).backgroundColor}; });
    conferir('toque abre a leitura: gerais (3 itens) e só o treino que tem orientação', d && d.aberto && d.titulo === 'Orientações' && JSON.stringify(d.secoes) === JSON.stringify(['Orientações gerais', 'DIA B - Peito']) && d.itens === 3 && d.paragrafos[0] === 'Comece leve e sem pressa.' && d.foco === 'apOrientTitulo' && d.larg, JSON.stringify(d));
    await pg.screenshot({path: SHOTS + '/314-aluno-orientacoes.png'});
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
    conferir('Esc fecha', await pg.evaluate(() => !document.getElementById('apOrientDialog')));
    await pg.evaluate(() => { document.getElementById('workoutsScreen').classList.add('ws-light'); });
    await pg.screenshot({path: SHOTS + '/314-aluno-botao-claro.png'});
    await pg.click('#apOrientBtn'); await pg.waitForTimeout(150);
    conferir('modo claro: leitura clara', await pg.evaluate(() => getComputedStyle(document.getElementById('apOrientDialog')).backgroundColor) === 'rgb(255, 255, 255)');
    await pg.screenshot({path: SHOTS + '/314-aluno-orientacoes-claro.png'});
    await pg.click('.ap-orient-ok'); await pg.waitForTimeout(80);
    await pg.evaluate(() => { window.__AP_STUDENT_CONTEXT = {role: 'teacher'}; APOrientacoesAluno.pintar(); });
    conferir('fora da conta de aluno: botão some', (await estado()).oculto);
    conferir('o app do aluno continua com a tela dos treinos e o renderWorkouts', await pg.evaluate(() => typeof renderWorkouts === 'function' && !!document.getElementById('wsCards')));
    await ctx.close();
  }

  conferir('nenhum erro de página nas telas testadas', erros.length === 0, erros.join(' | '));
  await navegador.close(); servidor.close();
  console.log('\n' + ok + ' verificações OK, ' + falhas + ' falhas');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
