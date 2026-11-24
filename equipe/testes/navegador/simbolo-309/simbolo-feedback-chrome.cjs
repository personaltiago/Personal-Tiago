'use strict';
// Teste no Chrome do 1.12.309 ("Símbolo nos feedbacks"), com o 1.12.308 como comparação.
// Preparação: extraia professor.html e index.html do 1.12.308 e do 1.12.309 para /tmp/t309/<308|309>-<página> e sirva a pasta:
//   (cd /tmp/t309 && python3 -m http.server 8799 --bind 127.0.0.1)
// Uso: node simbolo-feedback-chrome.cjs [pasta-das-capturas]
// As imagens de teste (logos fictícios, "foto", imagem pequena) são desenhadas no próprio navegador.
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const fs = require('node:fs');
const SHOTS = process.argv[2] || '/tmp/t309';
const BASE = 'http://127.0.0.1:8799/';
const DONO = 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1'; // a conta do Tiago (o TL é a marca dele)
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };
const ITEM = {id: 'fb1', studentId: 'ana', studentName: 'Ana Teste', source: 'presencial', startedAt: '2026-11-23T20:46:00.000Z', finishedAt: '2026-11-23T21:39:00.000Z', durationSeconds: 3191, response: {comment: 'Treino forte, mas consegui.', intensity: 'Muito intensa'}};
// Grava cada fillText do canvas para ler o texto desenhado no cartão.
const GRAVAR_TEXTO = () => {
  window.__textos = [];
  const original = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (texto, ...resto) { window.__textos.push(String(texto)); return original.call(this, texto, ...resto); };
};

(async () => {
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  async function abrir(arquivo, {uid = DONO, nome = 'Tiago Lima', estado} = {}) {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 915}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(arquivo + ': ' + e.message));
    await pg.addInitScript(GRAVAR_TEXTO);
    await pg.addInitScript(([uid, nome, estado]) => {
      if (!localStorage.getItem('agendaPersonalTL_v1')) localStorage.setItem('agendaPersonalTL_v1', JSON.stringify(estado || {students: [{id: 'ana', name: 'Ana Teste', studentType: 'presencial'}], lessons: [], occurrenceStatus: {}, payments: [], history: [], workoutPlans: [], trainerProfile: {name: nome}}));
      window.APaccounts = {isTeacher: () => true, teacherUid: () => uid, stage() {}, refreshPreview() {}, knownAreas: () => [], status: () => null, retry() {}};
    }, [uid, nome, estado || null]);
    await pg.goto(BASE + arquivo);
    await pg.waitForTimeout(1500);
    return pg;
  }
  // Desenha no navegador uma imagem de teste e devolve {name, mimeType, buffer} para o campo de arquivo.
  const imagem = async (pg, tipo) => {
    const r = await pg.evaluate(tipo => {
      const c = document.createElement('canvas'), g = c.getContext('2d');
      let tipoArquivo = 'image/png', nome = tipo + '.png';
      if (tipo === 'transparente') { c.width = c.height = 600; g.strokeStyle = '#e0457b'; g.lineWidth = 70; g.beginPath(); g.arc(300, 300, 175, 0, 7); g.stroke(); g.fillStyle = '#e0457b'; g.beginPath(); g.moveTo(170, 470); g.lineTo(250, 470); g.lineTo(430, 130); g.lineTo(350, 130); g.fill(); }
      else if (tipo === 'fundo-branco') { c.width = 800; c.height = 560; g.fillStyle = '#fff'; g.fillRect(0, 0, 800, 560); g.fillStyle = '#172554'; g.beginPath(); g.moveTo(120, 440); g.lineTo(330, 140); g.lineTo(470, 340); g.lineTo(560, 220); g.lineTo(700, 440); g.fill(); g.beginPath(); g.arc(580, 130, 40, 0, 7); g.fill(); tipoArquivo = 'image/jpeg'; nome = 'logo.jpg'; }
      else if (tipo === 'largo') { c.width = 1400; c.height = 360; g.fillStyle = '#1e1e1e'; g.font = '700 230px Arial'; g.textBaseline = 'top'; g.fillText('FORMA', 60, 60); }
      else if (tipo === 'foto') { c.width = 640; c.height = 480; const d = g.createImageData(640, 480); let s = 7; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; for (let y = 0; y < 480; y++) for (let x = 0; x < 640; x++) { const o = (y * 640 + x) * 4; d.data[o] = 120 + 100 * Math.sin(x / 37) + 60 * rnd(); d.data[o + 1] = 80 + 90 * Math.cos(y / 29) + 60 * rnd(); d.data[o + 2] = (x + y) / 5 + 60 * rnd(); d.data[o + 3] = 255; } g.putImageData(d, 0, 0); tipoArquivo = 'image/jpeg'; nome = 'foto.jpg'; }
      else if (tipo === 'pequena') { c.width = c.height = 10; g.fillStyle = '#f00'; g.fillRect(0, 0, 10, 10); }
      return {nome, tipoArquivo, dados: c.toDataURL(tipoArquivo, .85).split(',')[1]};
    }, tipo);
    return {name: r.nome, mimeType: r.tipoArquivo, buffer: Buffer.from(r.dados, 'base64')};
  };
  const cartao = (pg, opcoes = {}) => pg.evaluate(async ([item, opcoes]) => { window.__textos = []; const c = await APFeedbackCard.create(item, opcoes); return {png: c.toDataURL('image/png'), textos: window.__textos.slice()}; }, [ITEM, opcoes]);
  // A cor de um pixel opaco do símbolo (área 80..296 × 148..202) igual à cor pedida
  const temCor = (pg, cor, opcoes = {}) => pg.evaluate(async ([item, cor, opcoes]) => {
    const c = await APFeedbackCard.create(item, opcoes), d = c.getContext('2d').getImageData(80, 148, 216, 54).data;
    const alvo = [1, 3, 5].map(i => parseInt(cor.slice(i, i + 2), 16));
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - alvo[0]) <= 1 && Math.abs(d[i + 1] - alvo[1]) <= 1 && Math.abs(d[i + 2] - alvo[2]) <= 1) return true;
    return false;
  }, [ITEM, cor, opcoes]);
  const tela = pg => pg.evaluate(() => {
    const v = id => { const el = document.getElementById(id); return !!el && !el.hidden && el.getBoundingClientRect().height > 0; };
    return {escolher: v('feedbackSymbolChoose'), salvar: v('feedbackSymbolSave'), cancelar: v('feedbackSymbolCancel'), padrao: v('feedbackSymbolReset'),
      agora: document.getElementById('feedbackSymbolCurrent')?.textContent || '', status: document.getElementById('feedbackSymbolStatus')?.textContent || '',
      erro: document.getElementById('feedbackSymbolStatus')?.dataset.error === 'true', previa: !!document.querySelector('#feedbackSymbolPreview canvas'),
      salvo: (JSON.parse(localStorage.getItem('agendaPersonalTL_v1') || '{}').trainerProfile || {}).feedbackSymbol};
  });
  const escolher = async (pg, arquivo) => { await pg.setInputFiles('#feedbackSymbolFile', arquivo); await pg.waitForFunction(() => !/Preparando/.test(document.getElementById('feedbackSymbolStatus').textContent)); await pg.waitForTimeout(500); };
  const area = (pg, aluno = 'ana') => pg.evaluate(aluno => { const s = state.students.find(x => x.id === aluno); const a = APStudentModel.makeArea(state, s, {visible: () => true}); return {symbol: a.trainer.symbol, tem: Object.hasOwn(a.trainer, 'symbol'), bytes: new TextEncoder().encode(JSON.stringify(a)).byteLength, ok: (() => { try { APStudentModel.assertArea(a); return true; } catch (e) { return e.message; } })()}; }, aluno);

  // ------------------------------------------------------------ 1) professor, conta do Tiago: nada muda até ele escolher
  const p308 = await abrir('308-professor.html');
  const c308 = await cartao(p308, {accent: '#b6ff26'});
  await p308.context().close();
  const pg = await abrir('309-professor.html');
  const c309 = await cartao(pg, {accent: '#b6ff26'});
  conferir('conta do Tiago, sem símbolo enviado: o cartão é idêntico ao do 1.12.308 (TL)', c309.png === c308.png);
  conferir('o cartão expõe initials e o resto da API (lines, symbol) mesmo com os embrulhos', await pg.evaluate(() => ['create', 'open', 'accent', 'lines', 'symbol', 'initials'].every(k => typeof APFeedbackCard[k] === 'function')));
  conferir('iniciais: "Maria da Silva Souza" → MS, "Tiago Lima" → TL, "Ágata" → Á, vazio → ""', await pg.evaluate(() => [APFeedbackCard.initials('Maria da Silva Souza'), APFeedbackCard.initials('Tiago Lima'), APFeedbackCard.initials('Ágata'), APFeedbackCard.initials('  ')].join('|')) === 'MS|TL|Á|');
  let a = await area(pg);
  conferir('área do aluno leva symbol "tl" (o TL de sempre) na conta do Tiago', a.symbol === 'tl' && a.ok === true, JSON.stringify(a));
  await pg.evaluate(() => showScreen('feedback-settings'));
  await pg.waitForTimeout(800);
  let t = await tela(pg);
  const lugar = await pg.evaluate(() => { const s = document.getElementById('feedbackSymbolSetting'); return {depoisDoNome: s?.previousElementSibling?.classList.contains('feedback-name-setting'), naTela: !!s?.closest('#screen-feedback-settings'), titulo: s?.querySelector('h3')?.textContent, mais: document.querySelector('#moreFeedbackSettings small')?.textContent, descricao: document.querySelector('#screen-feedback-settings .module-heading p')?.textContent}; });
  conferir('cartão "Símbolo nos feedbacks" na tela Feedback, logo depois do nome', lugar.depoisDoNome && lugar.naTela && lugar.titulo === 'Símbolo nos feedbacks', JSON.stringify(lugar));
  conferir('textos do Mais e da tela citam o símbolo', lugar.mais === 'Nome e símbolo dos cartões de feedback.' && lugar.descricao === 'O nome e o símbolo que aparecem nos cartões de feedback dos seus alunos.', JSON.stringify(lugar));
  conferir('estado inicial: prévia, "Agora: o símbolo TL", só "Escolher imagem"', t.previa && t.agora === 'Agora: o símbolo TL, padrão da sua conta.' && t.escolher && !t.salvar && !t.cancelar && !t.padrao && t.salvo === undefined, JSON.stringify(t));
  await pg.screenshot({path: SHOTS + '/309-tela-feedback.png'});

  // Recusas: nada é salvo
  for (const [tipo, msg] of [['foto', 'Não deu para separar o símbolo do fundo. Use um logo com fundo transparente ou de uma cor só.'], ['pequena', 'A imagem é pequena demais.']]) {
    await escolher(pg, await imagem(pg, tipo));
    t = await tela(pg);
    conferir('imagem "' + tipo + '" recusada com a mensagem certa e nada salvo', t.erro && t.status === msg && t.salvo === undefined && t.escolher && !t.salvar, JSON.stringify(t));
  }
  await escolher(pg, {name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('não é imagem')});
  t = await tela(pg);
  conferir('arquivo que não é imagem recusado', t.erro && t.status === 'Use uma imagem PNG, JPG ou WebP.' && t.salvo === undefined, JSON.stringify(t));

  // Escolher → prévia → Cancelar: nada salvo
  await escolher(pg, await imagem(pg, 'transparente'));
  t = await tela(pg);
  conferir('logo com fundo transparente: prévia com Salvar e Cancelar, ainda não salvo', !t.erro && t.previa && t.salvar && t.cancelar && !t.escolher && t.agora === 'Prévia do símbolo novo. Toque em Salvar para usar nos cartões.' && t.salvo === undefined, JSON.stringify(t));
  await pg.click('#feedbackSymbolCancel'); await pg.waitForTimeout(300);
  t = await tela(pg);
  conferir('Cancelar: volta ao TL, nada salvo', t.agora === 'Agora: o símbolo TL, padrão da sua conta.' && t.escolher && !t.salvar && t.salvo === undefined, JSON.stringify(t));

  // Sair da tela descarta a prévia
  await escolher(pg, await imagem(pg, 'transparente'));
  await pg.evaluate(() => showScreen('dashboard')); await pg.waitForTimeout(300);
  await pg.evaluate(() => showScreen('feedback-settings')); await pg.waitForTimeout(600);
  t = await tela(pg);
  conferir('sair da tela descarta a prévia', t.escolher && !t.salvar && t.salvo === undefined, JSON.stringify(t));

  // Logo com fundo branco (JPG): Salvar
  await escolher(pg, await imagem(pg, 'fundo-branco'));
  await pg.screenshot({path: SHOTS + '/309-previa-logo.png'});
  await pg.click('#feedbackSymbolSave'); await pg.waitForTimeout(400);
  t = await tela(pg);
  const salvo = t.salvo;
  conferir('Salvar: guarda a forma (PNG de até 40 mil caracteres) no perfil, com aviso', typeof salvo === 'string' && /^data:image\/png;base64,/.test(salvo) && salvo.length <= 40000 && t.status === 'Salvo. Os alunos recebem o símbolo na próxima sincronização.' && t.padrao && t.agora === 'Agora: o seu símbolo.', JSON.stringify({...t, salvo: salvo && salvo.length}));
  const forma = await pg.evaluate(async s => { const x = new Image(); x.src = s; await x.decode(); const c = document.createElement('canvas'); c.width = x.naturalWidth; c.height = x.naturalHeight; const g = c.getContext('2d'); g.drawImage(x, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let opaco = 0, transp = 0, branco = true; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 200) opaco++; if (d[i + 3] < 20) transp++; if (d[i + 3] > 0 && (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250)) branco = false; } return {w: c.width, h: c.height, opaco, transp, branco, canto: d[3]}; }, salvo);
  conferir('o fundo branco saiu: forma recortada, fundo transparente nos cantos', forma.canto === 0 && forma.opaco > 1000 && forma.transp > 1000 && forma.branco && forma.h <= 160 && forma.w <= 640, JSON.stringify(forma));
  const cDepois = await cartao(pg, {accent: '#b6ff26'});
  conferir('o cartão passa a mostrar o símbolo salvo (diferente do TL)', cDepois.png !== c309.png);
  const cExplicito = await cartao(pg, {accent: '#b6ff26', symbol: salvo, initials: ''});
  conferir('o cartão do professor usa exatamente o símbolo salvo', cDepois.png === cExplicito.png);
  a = await area(pg);
  conferir('área do aluno leva o símbolo salvo', a.symbol === salvo && a.ok === true);
  // Na cor do tema: Azul Royal + Preto → #5f82ff
  await pg.evaluate(() => { AgendaColors.selectDesign('current'); AgendaColors.save(AgendaColors.presets.find(p => p.id === 'royal-black')); });
  conferir('o símbolo sai na cor do tema (Azul Royal + Preto: #5f82ff), mesmo com o app passando verde', await temCor(pg, '#5f82ff', {accent: '#b6ff26'}));
  const imagemFinal = await pg.evaluate(async item => { await APFeedbackCard.open(item, {accent: '#b6ff26', professional: 'Agenda Personal', brand: 'Tiago Lima'}); return document.querySelector('#apFeedbackImage canvas').toDataURL('image/png').split(',')[1]; }, ITEM);
  fs.writeFileSync(SHOTS + '/309-cartao-logo.png', Buffer.from(imagemFinal, 'base64'));
  await pg.evaluate(() => document.getElementById('apFeedbackImage')?.close());

  // Símbolo desligado em Atualizações: nome escrito, como antes
  await pg.evaluate(() => APFeedbackSymbol && APTeacherFeatures.set('feedbackSymbol', false));
  const desligado = await cartao(pg, {accent: '#b6ff26', professional: 'Tiago Lima'});
  await pg.evaluate(() => showScreen('dashboard')); await pg.evaluate(() => showScreen('feedback-settings')); await pg.waitForTimeout(500);
  t = await tela(pg);
  conferir('símbolo desligado em Atualizações: o cartão escreve o nome e a tela avisa', desligado.textos.includes('Tiago Lima') && /desligado em Atualizações/.test(t.agora), JSON.stringify({textos: desligado.textos.slice(0, 3), agora: t.agora}));
  await pg.evaluate(() => APTeacherFeatures.set('feedbackSymbol', true));

  // Voltar ao padrão: conta do Tiago volta ao TL
  await pg.evaluate(() => showScreen('dashboard')); await pg.evaluate(() => showScreen('feedback-settings')); await pg.waitForTimeout(500);
  await pg.click('#feedbackSymbolReset'); await pg.waitForTimeout(400);
  t = await tela(pg);
  conferir('Voltar ao padrão: tira o símbolo do perfil e volta ao TL', t.salvo === undefined && t.status === 'Voltou ao símbolo TL.' && t.agora === 'Agora: o símbolo TL, padrão da sua conta.' && !t.padrao, JSON.stringify(t));
  conferir('depois de voltar ao padrão, a área leva "tl" de novo', (await area(pg)).symbol === 'tl');
  // Logo largo e logo com fundo transparente também passam
  for (const tipo of ['largo', 'transparente']) {
    const r = await pg.evaluate(async ([nome, tipoArquivo, dados]) => { const b = await (await fetch('data:' + tipoArquivo + ';base64,' + dados)).blob(); try { const x = await APFeedbackSymbol.process(new File([b], nome, {type: tipoArquivo})); return {w: x.width, h: x.height, n: x.dataUrl.length}; } catch (e) { return {erro: e.message}; } }, await imagem(pg, tipo).then(f => [f.name, f.mimeType, f.buffer.toString('base64')]));
    conferir('logo "' + tipo + '" vira forma recortada (' + JSON.stringify(r) + ')', !r.erro && r.h <= 160 && r.w <= 640 && r.n <= 40000);
  }
  await pg.context().close();

  // ------------------------------------------------------------ 2) professor, outra conta: iniciais, nunca o TL
  const outro = await abrir('309-professor.html', {uid: 'OutroProfessor1234567890abc', nome: 'Maria Souza'});
  const cOutro = await cartao(outro, {accent: '#b6ff26'});
  conferir('outra conta sem símbolo: selo com as iniciais MS, não o TL', cOutro.textos.includes('MS') && cOutro.png !== c308.png, JSON.stringify(cOutro.textos.slice(0, 3)));
  conferir('área do aluno da outra conta leva symbol vazio (iniciais)', (await area(outro)).symbol === '');
  await outro.evaluate(() => showScreen('feedback-settings')); await outro.waitForTimeout(800);
  t = await tela(outro);
  conferir('a tela da outra conta diz que aparecem as iniciais', t.agora === 'Agora: as iniciais MS, porque nenhum símbolo foi enviado.', t.agora);
  await outro.screenshot({path: SHOTS + '/309-tela-outra-conta.png'});
  const imgOutro = await outro.evaluate(async item => { await APFeedbackCard.open(item, {accent: '#b6ff26', professional: 'Maria Souza', brand: 'Maria Souza'}); return document.querySelector('#apFeedbackImage canvas').toDataURL('image/png').split(',')[1]; }, ITEM);
  fs.writeFileSync(SHOTS + '/309-cartao-iniciais.png', Buffer.from(imgOutro, 'base64'));
  await outro.context().close();

  // ------------------------------------------------------------ 3) limite de envio da área do aluno
  const foto = 'data:image/jpeg;base64,' + 'A'.repeat(199000 - 23);
  const exercicios = n => Array.from({length: n}, (_, i) => ({id: 'e' + i, name: 'Exercício ' + i, sets: 3, reps: '12', load: '20', rest: '60', description: 'x'.repeat(4900)}));
  const grande = n => ({students: [{id: 'ana', name: 'Ana Teste', studentType: 'online', photoDataUrl: foto}], lessons: [], occurrenceStatus: {}, payments: [], history: [],
    workoutPlans: [{id: 'p1', studentId: 'ana', name: 'Ficha', days: [{id: 'd1', name: 'A', exercises: exercicios(n)}]}], trainerProfile: {name: 'Tiago Lima', photoDataUrl: foto, feedbackSymbol: salvo}});
  for (const [n, espera] of [[40, 'com'], [44, 'sem']]) {
    const g = await abrir('309-professor.html', {estado: grande(n)});
    const r = await area(g);
    conferir('área de ' + Math.round(r.bytes / 1000) + ' mil bytes: ' + (espera === 'com' ? 'leva o símbolo' : 'fica sem o símbolo (passaria de 620 mil) e continua válida'),
      r.ok === true && r.bytes <= 650000 && (espera === 'com' ? r.symbol === salvo && r.bytes <= 620000 : r.symbol === '' && r.bytes + salvo.length > 620000), JSON.stringify({...r, symbol: r.symbol && r.symbol.slice(0, 12)}));
    await g.context().close();
  }

  // ------------------------------------------------------------ 4) aluno
  const contexto = (pg, trainer) => pg.evaluate(trainer => { window.__AP_STUDENT_CONTEXT = trainer === null ? null : {role: 'student', area: {trainer}}; }, trainer);
  const a308 = await abrir('308-index.html');
  await contexto(a308, {name: 'Tiago Lima', feedbackName: 'Tiago Lima'});
  const s308 = await cartao(a308, {accent: '#5f82ff'});
  await contexto(a308, {name: 'Tiago Lima', feedbackName: 'Tiago Lima', symbol: salvo});
  conferir('aluno com o app antigo (1.12.308) recebendo o símbolo: continua o TL e aceita a área', (await cartao(a308, {accent: '#5f82ff'})).png === s308.png && await a308.evaluate(trainer => { try { APStudentModel.assertArea({version: 2, professorId: APStudentModel.TEACHER, studentId: 'ana', enabled: true, profile: {name: 'Ana'}, plans: [], trainer}); return true; } catch (e) { return e.message; } }, {name: 'Tiago Lima', symbol: salvo}) === true);
  await a308.context().close();
  const al = await abrir('309-index.html');
  await contexto(al, {name: 'Tiago Lima', feedbackName: 'Tiago Lima'});
  conferir('aluno 1.12.309, área sem o campo (professor com o app antigo): idêntico ao 1.12.308 (TL)', (await cartao(al, {accent: '#5f82ff'})).png === s308.png);
  await contexto(al, {name: 'Tiago Lima', feedbackName: 'Tiago Lima', symbol: 'tl'});
  conferir('aluno, symbol "tl": o TL de sempre', (await cartao(al, {accent: '#5f82ff'})).png === s308.png);
  await contexto(al, {name: 'Tiago Lima', feedbackName: 'Tiago Lima', symbol: salvo});
  const sSimbolo = await cartao(al, {accent: '#5f82ff'});
  await contexto(al, null);
  const sExplicito = await cartao(al, {accent: '#5f82ff', symbol: salvo, initials: ''});
  conferir('aluno, símbolo do professor: o cartão usa exatamente esse símbolo', sSimbolo.png === sExplicito.png && sSimbolo.png !== s308.png);
  await contexto(al, {name: 'Tiago Lima', feedbackName: 'Tiago Lima', symbol: salvo});
  conferir('aluno: o símbolo sai na cor do tema do aluno (#5f82ff)', await temCor(al, '#5f82ff', {accent: '#5f82ff'}));
  await contexto(al, {name: 'Maria Souza', feedbackName: '', symbol: ''});
  const sIniciais = await cartao(al, {accent: '#5f82ff'});
  conferir('aluno de outra conta sem símbolo: iniciais do professor (MS)', sIniciais.textos.includes('MS'), JSON.stringify(sIniciais.textos.slice(0, 3)));
  await contexto(al, {name: 'Maria Souza', feedbackName: 'Studio Forma', symbol: 'data:image/gif;base64,R0lGOD'});
  const sInvalido = await cartao(al, {accent: '#5f82ff'});
  conferir('aluno, símbolo inválido: iniciais do nome do cartão (SF), nunca o TL', sInvalido.textos.includes('SF') && sInvalido.png !== s308.png, JSON.stringify(sInvalido.textos.slice(0, 3)));
  conferir('aluno 1.12.309 aceita a área com o símbolo', await al.evaluate(trainer => { try { APStudentModel.assertArea({version: 2, professorId: APStudentModel.TEACHER, studentId: 'ana', enabled: true, profile: {name: 'Ana'}, plans: [], trainer}); return true; } catch (e) { return e.message; } }, {name: 'Tiago Lima', symbol: salvo}) === true);
  await al.context().close();

  conferir('sem erros de JavaScript', erros.length === 0, erros.slice(0, 4).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
