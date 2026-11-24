'use strict';
// Teste no Chrome do 1.12.313 (Smartwatch: aviso no relógio no fim do descanso), com o 1.12.312 como comparação.
// Sozinho: lê os pacotes da raiz do repositório, serve as páginas reais num servidor local e simula o Android 1.212 (ponte
// getWatchNoticeVersion/getWatchNoticeStatus/setWatchNoticeEnabled/scheduleWatchNotice/cancelWatchNotice/testWatchNotice/
// openWatchNoticeSettings e o getWatchStatus do Wear OS). Não usa rede, Firebase, aparelho nem relógio.
// Uso: node equipe/testes/navegador/aviso-relogio-313/aviso-relogio-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../../../..');
const SHOTS = process.argv[2] || '/tmp/t313';
const P313 = 'AgendaPersonal-1.12.313-Aviso-No-Relogio-Para-Assinar.agenda.json';
const P312 = 'AgendaPersonal-1.12.312-Aviso-Cadastro-Local-Para-Assinar.agenda.json';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };
const espera = ms => new Promise(r => setTimeout(r, ms));

// Android 1.212 de mentira: a mesma ponte do MainActivity.Bridge (aviso no relógio) e o getWatchStatus do Wear OS.
const androidFalso = ({estado, wear, semPonteNova}) => {
  window.__relogio = {estado: Object.assign({versao: 1, app: '1.212', ativo: false, permissao: true, canal: 'ausente', exato: true}, estado || {}),
    marcados: [], cancelados: [], testes: 0, ajustes: 0, ligar: [], wear: wear || {state: 'unavailable', nodes: []}, recusar: false};
  const r = window.__relogio;
  window.Android = semPonteNova ? {getWatchStatus: () => JSON.stringify({message: '', connection: r.wear, results: []})} : {
    getWatchNoticeVersion: () => 1,
    getWatchNoticeStatus: () => JSON.stringify(r.estado),
    setWatchNoticeEnabled: on => { r.ligar.push(on); r.estado.ativo = !!on; if (on && r.estado.canal === 'ausente') r.estado.canal = 'alerta'; return true; },
    scheduleWatchNotice: (k, at, json) => { if (r.recusar || !r.estado.ativo) return false; r.marcados.push({k, at, ...JSON.parse(json)}); return true; },
    cancelWatchNotice: k => { r.cancelados.push(k); },
    testWatchNotice: () => { r.testes++; return true; },
    openWatchNoticeSettings: () => { r.ajustes++; },
    getWatchStatus: () => JSON.stringify({message: '', connection: r.wear, results: []}),
  };
};

(async () => {
  const pacote = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  const p313 = pacote(P313), p312 = pacote(P312);
  const g = require(path.join(RAIZ, 'tools/gerar-aviso-relogio-1.12.313.cjs'));
  fs.mkdirSync(SHOTS, {recursive: true});

  // ---------------------------------------------------------------- 0. Só os dois blocos novos mudam
  const blocos = '<style id="ap-aviso-relogio-css">' + g.CSS + '</style>\n<script id="ap-aviso-relogio">' + g.JS + '\n</script>\n';
  for (const f of ['index.html', 'professor.html']) {
    conferir(f + ': os dois blocos novos aparecem uma vez', p313.files[f].split(blocos).length === 2);
    conferir(f + ': sem os blocos novos, é idêntico ao 1.12.312', p313.files[f].replace(blocos, '') === p312.files[f]);
  }
  for (const f of ['cadastro.html', 'avaliacoes.html']) conferir(f + ': idêntico ao 1.12.312', p313.files[f] === p312.files[f]);
  conferir('versão e sequência', p313.version === '1.12.313' && p313.sequence === 419 && !('agendaSignature' in p313));

  const paginas = {'/313-professor.html': p313.files['professor.html'], '/313-index.html': p313.files['index.html'],
    '/312-professor.html': p312.files['professor.html']};
  const servidor = http.createServer((req, res) => {
    const corpo = paginas[req.url.split('?')[0]];
    if (corpo === undefined) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); res.end(corpo);
  });
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const BASE = 'http://127.0.0.1:' + servidor.address().port;
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  const contexto = () => navegador.newContext({viewport: {width: 412, height: 915}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/Cuiaba', locale: 'pt-BR'});
  const abrirPagina = async (url, init, rotulo) => {
    const ctx = await contexto(); const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(rotulo + ': ' + e.message + (process.env.PILHA ? ' @ ' + String(e.stack).slice(0, 700) : '')));
    if (init) await pg.addInitScript(androidFalso, init);
    await pg.goto(BASE + url); await pg.waitForTimeout(700);
    return {ctx, pg};
  };
  const r = pg => pg.evaluate(() => JSON.parse(JSON.stringify(window.__relogio)));
  const corAlerta = pg => pg.evaluate(() => { const t = document.createElement('span'); t.style.color = 'var(--ac-warn)'; document.body.append(t); const c = getComputedStyle(t).color; t.remove(); return c; });
  // No Mais, o primeiro toque destaca o cartão e o segundo abre (como nos outros cartões).
  const abrirCartao = async pg => { await pg.click('#moreSmartwatch'); await pg.waitForTimeout(150); if (!(await pg.evaluate(() => !!document.getElementById('apAvisoRelogio')))) { await pg.click('#moreSmartwatch'); await pg.waitForTimeout(200); } };
  const dialogo = pg => pg.evaluate(() => {
    const d = document.getElementById('apAvisoRelogio'); if (!d) return null;
    const chave = d.querySelector('[data-relogio-ligar]'), st = d.querySelector('[data-relogio-estado]'), ret = d.querySelector('[data-relogio-retorno]');
    return {aberto: d.open, titulo: d.querySelector('h2').textContent, ligado: chave.checked, chaveDesligada: chave.disabled, estado: st.textContent, nivel: st.dataset.nivel,
      cor: getComputedStyle(st).color, acoes: !d.querySelector('[data-relogio-acoes]').hidden && getComputedStyle(d.querySelector('[data-relogio-acoes]')).display !== 'none',
      retorno: ret.hidden ? '' : ret.textContent, marca: d.querySelector('#apRelogioMarca').value, opcoes: d.querySelector('#apRelogioMarca').options.length,
      passo: d.querySelector('[data-relogio-passo]').textContent, wear: !d.querySelector('[data-relogio-wearos-secao]').hidden, foco: document.activeElement?.id || '',
      claro: d.dataset.claro || '', acento: d.style.getPropertyValue('--ac-accent'), painel: d.style.getPropertyValue('--ac-panel'),
      fundo: getComputedStyle(d).backgroundColor, larguraOk: d.getBoundingClientRect().width <= innerWidth && d.scrollWidth <= d.clientWidth + 1};
  });

  // ---------------------------------------------------------------- A. Professor com o Android 1.212
  {
    const {ctx, pg} = await abrirPagina('/313-professor.html', {estado: {}}, 'professor');
    const card = await pg.evaluate(() => { const c = document.getElementById('moreSmartwatch'); return c && {texto: c.querySelector('small')?.textContent, controla: c.getAttribute('aria-controls'), popup: c.getAttribute('aria-haspopup')}; });
    conferir('cartão Smartwatch do Mais continua lá, com o texto novo', card && card.texto === 'Aviso no relógio ao fim do descanso.', JSON.stringify(card));
    conferir('cartão aponta para a tela nova', card && card.controla === 'apAvisoRelogio' && card.popup === 'dialog');
    conferir('sem descanso ao abrir: tira um aviso que tenha ficado marcado', (await r(pg)).cancelados.join() === 'professor');
    // O tema do Tiago (o mesmo dos testes do 1.12.308, 1.12.311 e 1.12.312): visual Atual, Azul Royal + Preto
    await pg.evaluate(() => { AgendaColors.selectDesign('current'); AgendaColors.save(AgendaColors.presets.find(p => p.id === 'royal-black')); showScreen('more'); document.getElementById('moreSmartwatch').scrollIntoView({block: 'center'}); });
    await pg.waitForTimeout(250);
    await pg.screenshot({path: SHOTS + '/313-professor-mais.png'});
    await pg.evaluate(() => window.scrollTo(0, 0));
    await pg.click('#moreSmartwatch'); await pg.waitForTimeout(150);
    const primeiro = await pg.evaluate(() => ({destacado: document.getElementById('moreSmartwatch').getAttribute('aria-pressed'), aberto: !!document.getElementById('apAvisoRelogio')}));
    conferir('primeiro toque só destaca o cartão, como os outros do Mais', primeiro.destacado === 'true' && !primeiro.aberto, JSON.stringify(primeiro));
    await pg.click('#moreSmartwatch'); await pg.waitForTimeout(200);
    let d = await dialogo(pg);
    conferir('segundo toque abre a tela Smartwatch', d && d.aberto && d.titulo === 'Smartwatch', JSON.stringify(d && {aberto: d.aberto, titulo: d.titulo}));
    conferir('foco no título ao abrir', d && d.foco === 'apRelogioTitulo');
    conferir('começa desligado, com a chave ativa', d && !d.ligado && !d.chaveDesligada && d.estado.startsWith('Desligado.') && d.nivel === 'desligado');
    conferir('Testar e Ajustes à mostra', d && d.acoes);
    conferir('8 marcas, Xiaomi primeiro, com o passo a passo', d && d.opcoes === 8 && d.marca === 'xiaomi' && d.passo.startsWith('No app Mi Fitness'), d && d.passo);
    conferir('Conexão Wear OS continua na tela', d && d.wear);
    conferir('cabe na tela do celular', d && d.larguraOk);
    await pg.screenshot({path: SHOTS + '/313-professor-smartwatch-desligado.png'});

    await pg.click('#apRelogioLigar'); await pg.waitForTimeout(150);
    d = await dialogo(pg); let e = await r(pg);
    conferir('ligar chama o Android', e.ligar.join() === 'true' && e.estado.ativo === true);
    conferir('ligado: texto e chave', d.ligado && d.estado.startsWith('Ligado. No fim de cada descanso') && d.nivel === 'ok', d.estado);
    await pg.screenshot({path: SHOTS + '/313-professor-smartwatch-ligado.png'});
    await pg.click('[data-relogio-testar]'); await pg.waitForTimeout(100);
    d = await dialogo(pg); e = await r(pg);
    conferir('Testar no relógio chama o Android uma vez', e.testes === 1);
    conferir('Testar orienta bloquear a tela', d.retorno.startsWith('Bloqueie a tela do celular agora. Em 10 segundos'), d.retorno);
    await pg.click('[data-relogio-ajustes]'); await pg.waitForTimeout(80);
    conferir('Ajustes do aviso abre o canal no Android', (await r(pg)).ajustes === 1);
    await pg.selectOption('#apRelogioMarca', 'amazfit'); await pg.waitForTimeout(80);
    d = await dialogo(pg);
    conferir('trocar a marca troca o passo a passo', d.passo.startsWith('No app Zepp'), d.passo);
    conferir('a marca fica guardada', (await pg.evaluate(() => localStorage.getItem('apRelogioMarca'))) === 'amazfit');
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(120);
    conferir('Esc fecha (e tira a tela)', (await dialogo(pg)) === null);
    await abrirCartao(pg);
    d = await dialogo(pg);
    conferir('reabrir mantém a marca e o ligado', d.marca === 'amazfit' && d.ligado);
    await pg.click('.ap-relogio .ap-watch-actions:last-child [data-relogio-fechar]'); await pg.waitForTimeout(100);
    conferir('Fechar fecha', (await dialogo(pg)) === null);
    await abrirCartao(pg);
    await pg.click('[data-relogio-wearos]'); await pg.waitForTimeout(250);
    const wearAberto = await pg.evaluate(() => ({nova: !!document.getElementById('apAvisoRelogio'), antiga: !!document.getElementById('apWatchSetup')?.open}));
    conferir('Conexão Wear OS abre a tela antiga do Wear OS', !wearAberto.nova && wearAberto.antiga, JSON.stringify(wearAberto));
    await pg.evaluate(() => window.APWatchUI.close()); await pg.waitForTimeout(80);

    // Descanso do professor: marca, não repete, desmarca se parado antes do fim, deixa o fim natural.
    // O descanso de teste não tem ficha de verdade e a própria página o pararia (stopWorkoutRest); aqui só o teste mexe nele.
    await pg.evaluate(() => { stopWorkoutRest = () => {}; });
    const antes = (await r(pg)).cancelados.length, base = (await r(pg)).marcados.length;
    const fim = await pg.evaluate(() => { const f = Date.now() + 60000; state.workoutRest = {id: 'r1', studentId: 's', planId: 'p', dayId: 'd', exerciseId: 'e', student: 'Ana Souza', exercise: 'Supino reto', seconds: 60, endAt: f, notified: false, native: false}; return f; });
    await pg.waitForTimeout(1800); e = await r(pg);
    conferir('descanso marcado no Android', e.marcados.length === base + 1 && e.marcados.at(-1).k === 'professor' && e.marcados.at(-1).at === fim, JSON.stringify(e.marcados));
    conferir('texto: aluno e exercício', e.marcados.at(-1)?.titulo === 'Fim do descanso' && e.marcados.at(-1)?.texto === 'Ana Souza · Supino reto');
    await pg.waitForTimeout(1700);
    conferir('não marca de novo o mesmo descanso', (await r(pg)).marcados.length === base + 1);
    await pg.evaluate(() => { state.workoutRest = null; }); await pg.waitForTimeout(1700); e = await r(pg);
    conferir('parado antes do fim: desmarca', e.cancelados.length === antes + 1 && e.cancelados.at(-1) === 'professor');
    const fim2 = await pg.evaluate(() => { const f = Date.now() + 4000; state.workoutRest = {id: 'r2', student: 'Bia', exercise: 'Bi-set 1 · descanso após B', endAt: f}; return f; });
    await pg.waitForTimeout(1600); e = await r(pg);
    conferir('descanso curto (4 s) também é marcado', e.marcados.length === base + 2 && e.marcados.at(-1).at === fim2 && e.marcados.at(-1).texto === 'Bia · Bi-set 1 · descanso após B', JSON.stringify(e.marcados.at(-1)));
    await espera(Math.max(0, fim2 - Date.now()) + 300);
    await pg.evaluate(() => { state.workoutRest = null; }); await pg.waitForTimeout(1700); e = await r(pg);
    conferir('fim natural: não desmarca', e.cancelados.length === antes + 1);
    await pg.evaluate(() => { state.workoutRest = {id: 'r3', student: 'Caio', exercise: 'Remada', endAt: Date.now() - 200}; });
    await pg.waitForTimeout(1600);
    conferir('descanso que já acabou não é marcado', (await r(pg)).marcados.length === base + 2);
    await pg.evaluate(() => { state.workoutRest = null; });
    // Desligado: nada é marcado.
    await abrirCartao(pg); await pg.click('#apRelogioLigar'); await pg.waitForTimeout(150);
    e = await r(pg); d = await dialogo(pg);
    conferir('desligar chama o Android e volta o texto', e.ligar.join() === 'true,false' && !d.ligado && d.estado.startsWith('Desligado.'));
    await pg.evaluate(() => window.APAvisoRelogio.fechar());
    await pg.evaluate(() => { state.workoutRest = {id: 'r4', student: 'Davi', exercise: 'Agachamento', endAt: Date.now() + 60000}; });
    await pg.waitForTimeout(1800);
    conferir('desligado: não marca', (await r(pg)).marcados.length === base + 2, String((await r(pg)).marcados.length));
    await pg.evaluate(() => { state.workoutRest = null; });

    // Estados do Android
    const estados = [
      [{ativo: true, permissao: false, canal: 'alerta'}, 'As notificações do Agenda Personal estão bloqueadas', 'atencao'],
      [{ativo: true, permissao: true, canal: 'desligado'}, 'O aviso está desligado nos ajustes do Android', 'atencao'],
      [{ativo: true, permissao: true, canal: 'silencioso'}, 'O aviso está silencioso no Android', 'atencao'],
      [{ativo: true, permissao: true, canal: 'alerta', exato: false}, 'Ligado. Sem a permissão Alarmes e lembretes', 'atencao'],
    ];
    for (const [estado, texto, nivel] of estados) {
      await pg.evaluate(x => { Object.assign(window.__relogio.estado, x); window.APAvisoRelogio.abrir(); }, estado); await pg.waitForTimeout(120);
      d = await dialogo(pg);
      conferir('estado: ' + texto, d.estado.startsWith(texto) && d.nivel === nivel && d.ligado, d.estado);
      if (estado.permissao === false) await pg.screenshot({path: SHOTS + '/313-professor-smartwatch-atencao.png'});
    }
    conferir('atenção na cor de alerta do tema (--ac-warn)', d.cor === (await corAlerta(pg)) && d.cor !== 'rgb(0, 0, 0)', d.cor);
    await pg.evaluate(() => { window.Android.getWatchNoticeStatus = () => 'quebrado'; window.APAvisoRelogio.abrir(); }); await pg.waitForTimeout(120);
    d = await dialogo(pg);
    conferir('estado ilegível: avisa sem travar', d.estado === 'Não foi possível ler o estado do aviso agora.' && d.nivel === 'atencao');
    await pg.evaluate(() => { window.Android.getWatchNoticeStatus = () => JSON.stringify(window.__relogio.estado); Object.assign(window.__relogio.estado, {exato: true, canal: 'alerta', permissao: true}); window.APAvisoRelogio.fechar(); });

    // Tema claro do professor
    const temaClaro = await pg.evaluate(() => { const p = AgendaColors.presets.find(x => x.id === 'purple-white'); if (!p) return null; AgendaColors.save(p); window.APAvisoRelogio.abrir(); return p.id; });
    await pg.waitForTimeout(250); d = await dialogo(pg);
    conferir('tema claro do professor: a tela fica clara', !!temaClaro && /rgb\((2[3-5]\d|1\d\d), (2[3-5]\d|1\d\d), (2[3-5]\d|1\d\d)\)/.test(d.fundo), d.fundo);
    await pg.screenshot({path: SHOTS + '/313-professor-smartwatch-tema-claro.png'});
    await pg.evaluate(() => { Object.assign(window.__relogio.estado, {permissao: false}); window.APAvisoRelogio.abrir(); }); await pg.waitForTimeout(150);
    d = await dialogo(pg);
    conferir('tema claro: atenção na cor de alerta do tema claro (escura, legível)', d.cor === (await corAlerta(pg)) && d.cor.match(/\d+/g).slice(0, 3).map(Number).reduce((a, b) => a + b, 0) < 450, d.cor);
    await pg.evaluate(() => { window.APAvisoRelogio.fechar(); AgendaColors.save(AgendaColors.presets.find(p => p.id === 'royal-black')); });

    // Ícone Wear OS
    const icone = () => pg.evaluate(() => { let b = document.getElementById('teste-icone'); if (!b) { b = document.createElement('button'); b.id = 'teste-icone'; b.className = 'ap-watch-send-icon'; document.body.append(b); } return {attr: document.documentElement.dataset.apWearOs, display: getComputedStyle(b).display}; });
    let i = await icone();
    conferir('sem relógio Wear OS: ícone de enviar treino escondido', i.attr === 'ausente' && i.display === 'none', JSON.stringify(i));
    await pg.evaluate(() => { window.__relogio.wear = {state: 'checked', nodes: [{id: 'n1', name: 'Galaxy Watch6'}], appNodes: []}; window.APAvisoRelogio.abrir(); window.APAvisoRelogio.fechar(); });
    i = await icone();
    conferir('Wear OS sem o app no relógio: continua escondido', i.attr === 'ausente' && i.display === 'none');
    await pg.evaluate(() => { window.__relogio.wear = {state: 'checked', nodes: [{id: 'n1', name: 'Galaxy Watch6'}], appNodes: ['n1']}; window.APAvisoRelogio.abrir(); window.APAvisoRelogio.fechar(); });
    i = await icone();
    conferir('Wear OS com o app no relógio: ícone volta', i.attr === 'pronto' && i.display !== 'none', JSON.stringify(i));
    await ctx.close();
  }

  // ---------------------------------------------------------------- B. 1.12.312 x 1.12.313: o cartão Mais do professor
  {
    const {ctx, pg} = await abrirPagina('/312-professor.html', {estado: {}}, 'professor 312');
    const antigo = await pg.evaluate(() => document.getElementById('moreSmartwatch')?.querySelector('small')?.textContent);
    conferir('no 1.12.312 o cartão dizia "Conexão e treinos no relógio."', antigo === 'Conexão e treinos no relógio.', antigo);
    await ctx.close();
  }

  // ---------------------------------------------------------------- C. Aluno com o Android 1.212
  {
    const {ctx, pg} = await abrirPagina('/313-index.html', {estado: {ativo: true, canal: 'alerta'}}, 'aluno');
    const linha = await pg.evaluate(() => {
      const b = document.getElementById('apProfileRelogio'); if (!b) return null;
      const lista = document.querySelector('#profileScreen .profile-options');
      return {naLista: b.parentElement === lista, antesDoPet: b.nextElementSibling?.id === 'apProfilePet', classe: b.className, texto: b.querySelector('strong').textContent,
        sub: b.querySelector('small').textContent, icone: !!b.querySelector('.ap-relogio-icone svg'), seta: !!b.querySelector('.profile-chevron svg'), unica: document.querySelectorAll('#apProfileRelogio').length === 1};
    });
    conferir('linha Smartwatch no Perfil do aluno, antes de Pet', linha && linha.naLista && linha.antesDoPet && linha.unica, JSON.stringify(linha));
    conferir('linha com o mesmo formato das outras (ícone, texto e seta)', linha && linha.classe === 'profile-option' && linha.texto === 'Smartwatch' && linha.sub === 'Aviso no relógio ao fim do descanso' && linha.icone && linha.seta);
    conferir('aluno: sem descanso e sem conta de aluno, nada é marcado', (await r(pg)).marcados.length === 0);
    // Perfil à mostra para a captura
    await pg.evaluate(() => { document.querySelectorAll('body > *').forEach(x => { if (x.id !== 'profileScreen' && x.tagName !== 'SCRIPT' && x.tagName !== 'STYLE' && x.tagName !== 'DIALOG') x.style.visibility = 'hidden'; });
      const p = document.getElementById('profileScreen'); p.hidden = false; p.style.visibility = 'visible';
      // Os ícones das outras linhas, como o profileRender desenha no app (o teste não tem conta de aluno).
      p.querySelectorAll('[data-profile-icon]').forEach(x => { x.innerHTML = profileSymbol(x.dataset.profileIcon); });
      const lista = p.querySelector('.profile-options'); lista.scrollIntoView({block: 'start'}); });
    await pg.waitForTimeout(250);
    const caixa = await pg.evaluate(() => { const b = document.getElementById('apProfileRelogio').getBoundingClientRect(); const pet = document.getElementById('apProfilePet').getBoundingClientRect(); return {b: [b.left, b.width, b.height], pet: [pet.left, pet.width, pet.height]}; });
    conferir('mesma largura, alinhamento e altura da linha Pet', caixa.b[0] === caixa.pet[0] && caixa.b[1] === caixa.pet[1] && Math.abs(caixa.b[2] - caixa.pet[2]) <= 1, JSON.stringify(caixa));
    const icones = await pg.evaluate(() => { const meu = document.querySelector('#apProfileRelogio .ap-relogio-icone svg').getBoundingClientRect(), outro = document.querySelector('#apProfilePet > [data-profile-icon] svg').getBoundingClientRect();
      const c = x => getComputedStyle(x).color; return {meu: [meu.width, meu.height, meu.left], outro: [outro.width, outro.height, outro.left], corMeu: c(document.querySelector('#apProfileRelogio .ap-relogio-icone svg')), corOutro: c(document.querySelector('#apProfilePet > [data-profile-icon] svg'))}; });
    conferir('ícone da linha nova com o mesmo tamanho, posição e cor dos outros', JSON.stringify(icones.meu) === JSON.stringify(icones.outro) && icones.corMeu === icones.corOutro, JSON.stringify(icones));
    await pg.screenshot({path: SHOTS + '/313-aluno-perfil.png'});
    await pg.click('#apProfileRelogio'); await pg.waitForTimeout(200);
    let d = await dialogo(pg);
    conferir('toque na linha abre a tela Smartwatch', d && d.aberto && d.titulo === 'Smartwatch');
    conferir('cores do Perfil do aluno (tema escuro)', d && d.claro === 'false' && d.acento === '#f52283' && d.painel === '#071b26', JSON.stringify(d && {claro: d.claro, acento: d.acento, painel: d.painel}));
    conferir('aluno: ligado', d && d.ligado && d.estado.startsWith('Ligado.'));
    await pg.screenshot({path: SHOTS + '/313-aluno-smartwatch.png'});
    await pg.evaluate(() => { window.APAvisoRelogio.fechar(); document.getElementById('profileScreen').classList.add('profile-light'); });
    await pg.waitForTimeout(100);
    await pg.screenshot({path: SHOTS + '/313-aluno-perfil-claro.png'});
    await pg.click('#apProfileRelogio'); await pg.waitForTimeout(200);
    d = await dialogo(pg);
    conferir('Perfil claro: a tela fica clara', d.claro === 'true' && d.painel === '#ffffff' && d.fundo === 'rgb(255, 255, 255)', d.fundo);
    await pg.screenshot({path: SHOTS + '/313-aluno-smartwatch-claro.png'});
    await pg.evaluate(() => window.APAvisoRelogio.fechar());

    // Descanso do aluno (o mesmo formato do treino do aluno: active[treino].restUntil e apAutoRestSeries)
    const fim = await pg.evaluate(() => {
      window.__AP_STUDENT_CONTEXT = {role: 'student'};
      exercisesFor = id => id === 'A' ? [{name: 'Leg press 45°'}, {name: 'Cadeira extensora'}] : [];
      const f = Date.now() + 45000;
      const ultimo = exercisesFor('A').length - 1; window.__ultimo = ultimo;
      window.__treino = {active: {A: {startedAt: Date.now(), loads: {}, done: {}, id: 'A', restUntil: f, apAutoRestSeries: {deadline: f, exercise: ultimo, series: 0}}}, history: []};
      exStore = () => JSON.parse(JSON.stringify(window.__treino)); return f;
    });
    await pg.waitForTimeout(1800);
    let e = await r(pg);
    const nome = await pg.evaluate(() => exercisesFor('A')[window.__ultimo].name);
    conferir('descanso do aluno marcado no Android', e.marcados.length === 1 && e.marcados[0].k === 'aluno' && e.marcados[0].at === fim, JSON.stringify(e.marcados));
    conferir('texto: o exercício do descanso', e.marcados[0]?.texto === nome && !!nome, nome);
    await pg.evaluate(() => { window.__treino.active.A.restUntil = 0; delete window.__treino.active.A.apAutoRestSeries; });
    await pg.waitForTimeout(1700); e = await r(pg);
    conferir('aluno parou o descanso: desmarca', e.cancelados.filter(k => k === 'aluno').length >= 2 && e.cancelados.at(-1) === 'aluno');
    await pg.evaluate(() => { exActiveId = 'A'; exIndex = 0; window.__treino.active.A.restUntil = Date.now() + 50000; });
    await pg.waitForTimeout(1700); e = await r(pg);
    conferir('descanso pelo botão (sem série): usa o exercício aberto', e.marcados.length === 2 && e.marcados[1].texto === (await pg.evaluate(() => exercisesFor('A')[0].name)));
    await pg.evaluate(() => { window.__AP_STUDENT_CONTEXT = {role: 'teacher'}; });
    await pg.waitForTimeout(1700); e = await r(pg);
    conferir('fora da conta de aluno: desmarca e não marca', e.marcados.length === 2 && e.cancelados.at(-1) === 'aluno');
    await ctx.close();
  }

  // ---------------------------------------------------------------- D. Navegador (sem Android) e APK antigo
  {
    const {ctx, pg} = await abrirPagina('/313-index.html', null, 'aluno navegador');
    await pg.evaluate(() => window.APAvisoRelogio.abrir()); await pg.waitForTimeout(150);
    const d = await dialogo(pg);
    conferir('navegador: explica que é no app Android', d.estado.startsWith('O aviso no relógio funciona no aplicativo Android') && d.nivel === 'web', d.estado);
    conferir('navegador: chave travada e sem Testar/Ajustes', d.chaveDesligada && !d.ligado && !d.acoes);
    conferir('navegador: linha Smartwatch também existe (o aluno vê a explicação)', await pg.evaluate(() => !!document.getElementById('apProfileRelogio')));
    conferir('navegador: ícone Wear OS escondido', await pg.evaluate(() => document.documentElement.dataset.apWearOs === 'ausente'));
    await ctx.close();
  }
  {
    const {ctx, pg} = await abrirPagina('/313-professor.html', {semPonteNova: true}, 'professor APK antigo');
    await pg.evaluate(() => window.APAvisoRelogio.abrir()); await pg.waitForTimeout(150);
    const d = await dialogo(pg);
    conferir('APK antigo: pede o 1.212', d.estado === 'Atualize o aplicativo Android para a versão 1.212 ou mais nova para usar o aviso no relógio.' && d.nivel === 'atualizar');
    conferir('APK antigo: chave travada e sem Testar/Ajustes', d.chaveDesligada && !d.acoes);
    await pg.evaluate(() => { state.workoutRest = {id: 'x', student: 'Ana', exercise: 'Supino', endAt: Date.now() + 60000}; });
    await pg.waitForTimeout(1700);
    conferir('APK antigo: nada quebra com descanso', true);
    await pg.screenshot({path: SHOTS + '/313-professor-apk-antigo.png'});
    await ctx.close();
  }

  conferir('sem erro de JavaScript nas páginas', erros.length === 0, erros.slice(0, 5).join(' | '));
  await navegador.close(); servidor.close();
  console.log('\n' + ok + '/' + (ok + falhas) + ' verificações' + (falhas ? ' — ' + falhas + ' FALHA(S)' : ''));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
