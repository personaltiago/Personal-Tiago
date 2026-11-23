'use strict';
// Teste no Chrome do 1.12.308: a janela de feedbacks e o cartão de imagem do professor seguem a cor do tema dele.
// Passa por todos os visuais (5) e todas as combinações de cores (24), no 1.12.307 (defeito: verde fixo) e no 1.12.308.
// Também confere a leitura (contraste ≥ 4,5) de todo texto na cor de destaque da janela, com a lista preenchida.
// Preparação: extraia professor.html do 1.12.307 e do 1.12.308 para /tmp/t302/<307|308>-professor.html e sirva a pasta:
//   (cd /tmp/t302 && python3 -m http.server 8799 --bind 127.0.0.1)
// Uso: node feedback-cor-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const fs = require('node:fs');
const SHOTS = process.argv[2] || '/tmp/t302';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };
const VERDE = '#b6ff26';
const ITEM = {id: 'fb1', studentId: 'ana', studentName: 'Ana Teste', source: 'presencial', startedAt: '2026-11-23T20:46:00.000Z', finishedAt: '2026-11-23T21:39:00.000Z', durationSeconds: 3191, response: {comment: 'Treino forte, mas consegui.', intensity: 'Muito intensa'}};

(async () => {
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  async function abrir(versao) {
    const ctx = await navegador.newContext({viewport: {width: 412, height: 915}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
    const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(versao + ': ' + e.message));
    await pg.addInitScript(() => {
      localStorage.setItem('agendaPersonalTL_v1', JSON.stringify({students: [{id: 'ana', name: 'Ana Teste', studentType: 'presencial'}], lessons: [], occurrenceStatus: {}, payments: [], history: []}));
      window.APaccounts = {isTeacher: () => true, teacherUid: () => '', stage() {}, refreshPreview() {}, knownAreas: () => [], status: () => null, retry() {}};
    });
    await pg.goto('http://127.0.0.1:8799/' + versao + '-professor.html');
    await pg.waitForTimeout(1500);
    return pg;
  }
  // Abre "Feedbacks dos alunos" como o professor abre, com um feedback respondido (com avaliação) e um aguardando, em "Todos".
  const abrirJanela = pg => pg.evaluate(() => {
    const fim = Date.parse('2026-11-23T21:39:00.000Z');
    state.workoutFeedbackRequests = [
      {id: 'fb_a', uid: 'u1', studentId: 'ana', studentName: 'Ana Teste', planName: 'Treino A', dayName: 'Segunda', source: 'presencial', startedAt: fim - 3191000, finishedAt: fim, durationSeconds: 3191, status: 'sent', teacherEvaluation: {note: 'Boa execução.', effort: 8}, response: {intensity: 'Muito intensa', comment: 'Treino forte, mas consegui.', allowPublish: false, mutationId: 'm1', receivedAt: fim + 60000}, seenAt: null},
      {id: 'fb_b', uid: 'u1', studentId: 'ana', studentName: 'Ana Teste', planName: 'Treino B', dayName: 'Quarta', source: 'online', startedAt: fim - 3000000, finishedAt: fim - 100000, durationSeconds: 2900, status: 'sent', response: null}
    ];
    APFeedbackTeacher.open();
    document.querySelector('#apFeedbackTeacher [data-feedback-filter="all"]').click();
    return document.querySelectorAll('#apFeedbackTeacher .ap-feedback-card').length;
  });
  // Para cada visual e cada combinação de cores: a cor do tema, o título, o fundo da janela, a barra do cartão e o contraste de
  // cada texto na cor de destaque (título, filtro ativo, etiqueta Presencial/Online, "Avaliação do professor") sobre o fundo real.
  const medir = pg => pg.evaluate(async ({VERDE, ITEM}) => {
    // "#9a7cb8" já é hexadecimal; "rgb(154, 124, 184)" é convertido.
    const hex = c => { const t = String(c).trim().toLowerCase(); if (/^#[0-9a-f]{6}$/.test(t)) return t; const m = t.match(/\d+(\.\d+)?/g); return m && m.length >= 3 ? '#' + m.slice(0, 3).map(v => Math.round(Number(v)).toString(16).padStart(2, '0')).join('') : t; };
    const rgba = c => { const m = String(c).match(/[\d.]+/g) || []; return m.length >= 3 ? [+m[0], +m[1], +m[2], m.length >= 4 ? +m[3] : 1] : [0, 0, 0, 0]; };
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    // Fundo efetivo: as camadas de fundo do elemento até a janela (opaca), compostas de baixo para cima.
    function fundo(el) {
      const camadas = [];
      for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) camadas.push(c); if (c[3] >= 1 || n.id === 'apFeedbackTeacher') break; }
      let base = camadas.pop() || [0, 0, 0, 1];
      while (camadas.length) { const c = camadas.pop(); base = [0, 1, 2].map(i => c[i] * c[3] + base[i] * (1 - c[3])).concat(1); }
      return base;
    }
    const dialog = document.getElementById('apFeedbackTeacher');
    const textos = {titulo: '.ap-feedback-heading small', filtro: '.ap-feedback-filters [aria-pressed=true]', etiqueta: '.ap-feedback-card .ap-feedback-tag', avaliacao: '.ap-feedback-evaluation>strong'};
    const out = [];
    for (const design of AgendaColors.designs.map(d => d.id)) {
      AgendaColors.selectDesign(design);
      for (const preset of AgendaColors.presets) {
        const saved = AgendaColors.save(preset); if (!saved.ok) { out.push({design, preset: preset.id, erro: saved.error}); continue; }
        const tema = hex(getComputedStyle(document.documentElement).getPropertyValue('--ac-accent'));
        const titulo = hex(getComputedStyle(dialog.querySelector(textos.titulo)).color);
        const fundoJanela = rgba(getComputedStyle(dialog).backgroundColor);
        const leitura = {};
        for (const [nome, seletor] of Object.entries(textos)) {
          const els = [...dialog.querySelectorAll(seletor)];
          leitura[nome] = els.length ? Math.min(...els.map(el => contraste(rgba(getComputedStyle(el).color), fundo(el)))) : null;
        }
        const canvas = await APFeedbackCard.create(ITEM, {accent: VERDE}); // como o app antigo chamava: verde
        const barra = hex(canvas.getContext('2d').getImageData(500, 66, 1, 1).data.slice(0, 3).join(','));
        out.push({design, preset: preset.id, tema, titulo, janelaOpaca: fundoJanela[3] >= 1, barra, leitura});
      }
    }
    return out;
  }, {VERDE, ITEM});
  // O botão "Imagem do feedback": open() com verde e os nomes, como a janela do professor chama. Só a cor pode mudar entre versões.
  const imagem = pg => pg.evaluate(async ITEM => {
    AgendaColors.selectDesign('current'); AgendaColors.save(AgendaColors.presets.find(p => p.id === 'royal-black'));
    document.getElementById('apFeedbackTeacher').close();
    await APFeedbackCard.open(ITEM, {accent: '#b6ff26', professional: 'Agenda Personal', brand: 'Tiago Lima'});
    const c = document.querySelector('#apFeedbackImage canvas'), d = c.getContext('2d').getImageData(500, 66, 1, 1).data;
    return {barra: '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''), tema: getComputedStyle(document.documentElement).getPropertyValue('--ac-accent').trim(), png: c.toDataURL('image/png').split(',')[1]};
  }, ITEM);
  // Tema do Tiago (Azul Royal + Preto) e a janela no topo, como ela abre: título, filtros e o começo da lista.
  const temaDoTiago = pg => pg.evaluate(() => { AgendaColors.selectDesign('current'); AgendaColors.save(AgendaColors.presets.find(p => p.id === 'royal-black')); document.activeElement?.blur?.(); document.getElementById('apFeedbackTeacher').scrollTop = 0; });
  const lum = h => { const c = [1, 3, 5].map(i => { const v = parseInt(h.slice(i, i + 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const legivel = h => { for (let s = 0; s <= 40; s++) { const m = '#' + [1, 3, 5].map(i => { const v = parseInt(h.slice(i, i + 2), 16); return Math.round(v + (255 - v) * s / 40).toString(16).padStart(2, '0'); }).join(''); if (contraste(m, '#181c20') >= 4.5) return m; } return '#ffffff'; };
  const ilegiveis = r => r.flatMap(x => Object.entries(x.leitura || {}).filter(([, c]) => c !== null && c < 4.5).map(([nome, c]) => x.design + '/' + x.preset + ' ' + nome + ' ' + c.toFixed(2)));

  // 1) 1.12.307: o defeito — título e cartão verdes em todos os temas
  {
    const pg = await abrir('307');
    conferir('1.12.307: janela aberta com 2 feedbacks (respondido com avaliação e aguardando)', await abrirJanela(pg) === 2);
    const r = await medir(pg);
    conferir('1.12.307: ' + r.length + ' combinações medidas (5 visuais × 24 cores)', r.length === 120 && r.every(x => !x.erro), JSON.stringify(r.filter(x => x.erro).slice(0, 2)));
    conferir('1.12.307: título da janela verde em todas (o defeito do print)', r.every(x => x.titulo === VERDE), JSON.stringify(r.filter(x => x.titulo !== VERDE).slice(0, 2)));
    conferir('1.12.307: cartão verde em todas', r.every(x => x.barra === VERDE), JSON.stringify(r.filter(x => x.barra !== VERDE).slice(0, 2)));
    const ruins = ilegiveis(r);
    console.log('     1.12.307: textos verdes com leitura ruim (contraste < 4,5): ' + ruins.length + (ruins.length ? ' — ex.: ' + ruins.slice(0, 3).join('; ') : ''));
    await temaDoTiago(pg);
    await pg.screenshot({path: SHOTS + '/308-janela-antes.png'});
    const aberto = await imagem(pg);
    conferir('1.12.307: "Imagem do feedback" (open) sai verde no tema azul (o defeito do status)', aberto.barra === VERDE, aberto.barra);
    fs.writeFileSync(SHOTS + '/308-cartao-antes.png', Buffer.from(aberto.png, 'base64'));
    await pg.context().close();
  }

  // 2) 1.12.308: título e cartão na cor do tema, legíveis, em todos os visuais e cores
  {
    const pg = await abrir('308');
    conferir('1.12.308: janela aberta com 2 feedbacks', await abrirJanela(pg) === 2);
    const r = await medir(pg);
    conferir('1.12.308: ' + r.length + ' combinações medidas', r.length === 120 && r.every(x => !x.erro), JSON.stringify(r.filter(x => x.erro).slice(0, 2)));
    conferir('a janela é opaca em todas (o fundo medido é o que aparece)', r.every(x => x.janelaOpaca));
    const titulo = r.filter(x => x.titulo !== x.tema);
    conferir('título da janela = cor do tema em todas', titulo.length === 0, JSON.stringify(titulo.slice(0, 3)));
    const ruins = ilegiveis(r);
    conferir('todo texto na cor do tema lê bem (contraste ≥ 4,5): título, filtro ativo, etiqueta e "Avaliação do professor", em todas', ruins.length === 0, ruins.slice(0, 6).join('; '));
    conferir('os quatro textos foram medidos em todas', r.every(x => Object.values(x.leitura).every(c => c !== null)));
    const cartao = r.filter(x => x.barra !== legivel(x.tema));
    conferir('cartão = cor do tema (clareada só o necessário), mesmo quando o app passa verde', cartao.length === 0, JSON.stringify(cartao.slice(0, 3)));
    const cartaoRuim = r.filter(x => contraste(x.barra, '#181c20') < 4.5);
    conferir('cartão legível no fundo escuro (contraste ≥ 4,5) em todas', cartaoRuim.length === 0, JSON.stringify(cartaoRuim.slice(0, 3)));
    const verde = r.filter(x => x.titulo === VERDE || x.barra === VERDE);
    conferir('nenhum tema fica com o verde fixo', verde.length === 0, JSON.stringify(verde.slice(0, 3)));
    const azul = r.find(x => x.design === 'current' && x.preset === 'royal-black');
    conferir('tema do Tiago (Azul Royal + Preto): janela e cartão azuis', azul && azul.titulo === azul.tema && /^#[0-9a-f]{6}$/.test(azul.barra) && parseInt(azul.barra.slice(5, 7), 16) > parseInt(azul.barra.slice(3, 5), 16), JSON.stringify(azul));
    console.log('     menor contraste medido no 1.12.308: ' + Math.min(...r.flatMap(x => Object.values(x.leitura))).toFixed(2));
    console.log('     cores medidas (visual/combinação → título | cartão):');
    for (const x of r.filter(x => x.design === 'current' || x.preset === 'purple-black')) console.log('       ' + x.design + '/' + x.preset + ' → ' + x.titulo + ' | ' + x.barra);
    await temaDoTiago(pg);
    await pg.screenshot({path: SHOTS + '/308-janela-depois.png'});
    const aberto = await imagem(pg);
    conferir('"Imagem do feedback" (open) sai azul mesmo recebendo verde', aberto.barra === legivel(aberto.tema), JSON.stringify({barra: aberto.barra, tema: aberto.tema}));
    fs.writeFileSync(SHOTS + '/308-cartao-depois.png', Buffer.from(aberto.png, 'base64'));
    await pg.context().close();
  }

  conferir('sem erros de JavaScript', erros.length === 0, erros.slice(0, 4).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
