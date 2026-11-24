'use strict';
// Teste no Chrome do 1.12.311 (aviso "Novo cadastro" na tela bloqueada), com o 1.12.310 como comparação.
// Sozinho: lê os pacotes da raiz do repositório, serve as páginas num servidor local e simula o Android 1.211 (ponte
// getPushStatus/getPushToken/refreshPushToken/openPushSettings/takePushOpen) e as funções do Firebase (protocolo das funções
// chamáveis: POST {data} com o token da conta, resposta {result} ou {error}). Não usa rede, Firebase de verdade nem aparelho.
// Uso: node equipe/testes/navegador/aviso-cadastro-311/aviso-cadastro-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../../../..');
const SHOTS = process.argv[2] || '/tmp/t311';
const P311 = 'AgendaPersonal-1.12.311-Aviso-Cadastro-Para-Assinar.agenda.json';
const P310 = 'AgendaPersonal-1.12.310-Sons-E-Alertas-Para-Assinar.agenda.json';
const FUNCOES = 'https://southamerica-east1-agenda-personal-bdb58.cloudfunctions.net/';
const TEACHER = 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1';
const TOKEN = 'fcm_tokenAAAA:APA91b' + 'x'.repeat(140);
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

function bloco(html, id) {
  const abre = '<script id="' + id + '">', i = html.indexOf(abre);
  if (i < 0 || html.indexOf(abre, i + 1) >= 0) throw Error('bloco ' + id + ' não aparece uma única vez');
  return html.slice(i + abre.length, html.indexOf('</script>', i));
}

// Página mínima do app principal: contas, painel do professor (iframe com a lista de aprovação) e o bloco ap-push-avisos real.
function harness(js) {
  return '<!doctype html><html><head><meta charset="utf-8"></head><body><iframe id="apPreviewTeacher" srcdoc="<!doctype html><script>'
    + "window.aprovacoes=0;window.estados=0;window.openStudentApprovals=()=>{window.aprovacoes++};addEventListener('ap-push-status',()=>{window.estados++})"
    + '</script>"></iframe><script>window.aberturasPainel=0;window.APopenTeacher=()=>{window.aberturasPainel++};'
    + 'window.APaccounts={isTeacher:()=>window.__professor!==false,teacherUid:()=>window.__professor!==false?"' + TEACHER + '":null,'
    + 'getPhotoToken:async()=>"id-token-do-professor"};</script><script id="ap-push-avisos">' + js + '</script></body></html>';
}

(async () => {
  const pacote = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  const p311 = pacote(P311), p310 = pacote(P310);
  fs.mkdirSync(SHOTS, {recursive: true});
  const paginas = {'/311-professor.html': p311.files['professor.html'], '/310-professor.html': p310.files['professor.html'],
    '/311-index.html': p311.files['index.html'], '/bloco.html': harness(bloco(p311.files['index.html'], 'ap-push-avisos'))};
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

  // Funções do Firebase de mentira: guarda cada chamada e responde como o Firebase (ou falha como mandado).
  async function funcoes(ctx) {
    const chamadas = [], respostas = {};
    await ctx.route(FUNCOES + '**', async rota => {
      const req = rota.request(), nome = req.url().slice(FUNCOES.length);
      if (req.method() === 'OPTIONS') return rota.fulfill({status: 204, headers: {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'POST'}});
      chamadas.push({nome, auth: req.headers()['authorization'], corpo: JSON.parse(req.postData() || 'null')});
      const r = respostas[nome] || {status: 200, json: {result: nome === 'testarAviso' ? {aparelhos: 1, enviados: 1, removidos: 0} : {ok: true}}};
      if (r.abortar) return rota.abort('internetdisconnected');
      return rota.fulfill({status: r.status, headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, body: JSON.stringify(r.json)});
    });
    return {chamadas, respostas};
  }

  // Android 1.211 de mentira (a mesma ponte do MainActivity.Bridge).
  const androidFalso = ({estado, token}) => {
    window.__push = {estado, token, abertura: '', refresh: 0, ajustes: 0};
    window.Android = {getPushVersion: () => 1, getPushStatus: () => JSON.stringify(window.__push.estado), getPushToken: () => window.__push.token,
      refreshPushToken: () => { window.__push.refresh++; setTimeout(() => window.dispatchEvent(new Event('ap-push-token')), 30); },
      openPushSettings: () => { window.__push.ajustes++; }, takePushOpen: () => { const t = window.__push.abertura; window.__push.abertura = ''; return t; }};
  };
  const LIGADO = {versao: 1, app: '1.211', configurado: true, token: true, permissao: true, canal: 'alerta', telaBloqueada: true, erro: ''};

  // ---------------------------------------------------------------- A. ap-push-avisos (app principal)
  {
    const ctx = await contexto(); const f = await funcoes(ctx); const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push('bloco: ' + e.message));
    await pg.addInitScript(androidFalso, {estado: LIGADO, token: TOKEN});
    await pg.goto(BASE + '/bloco.html'); await pg.waitForTimeout(300);
    const quadro = () => pg.evaluate(() => ({aprovacoes: document.getElementById('apPreviewTeacher').contentWindow.aprovacoes, estados: document.getElementById('apPreviewTeacher').contentWindow.estados, painel: window.aberturasPainel, ...window.__push, marca: localStorage.getItem('apPushAparelho:R2EmnDVcvMWt7TjPxOP6DjW1VOn1')}));
    conferir('nada acontece antes do painel do professor ficar pronto', f.chamadas.length === 0 && (await quadro()).refresh === 0);

    await pg.evaluate(() => window.dispatchEvent(new Event('ap-teacher-ready'))); await pg.waitForTimeout(400);
    let q = await quadro();
    const reg = f.chamadas.filter(c => c.nome === 'registrarAparelho');
    conferir('painel pronto: liga o aviso no Android (refreshPushToken)', q.refresh === 1, JSON.stringify(q));
    conferir('guarda o endereço uma vez pela função registrarAparelho, com o token da conta', reg.length === 1 && reg[0].auth === 'Bearer id-token-do-professor', JSON.stringify(f.chamadas.map(c => c.nome)));
    conferir('envia só o endereço e a versão do app (protocolo {data})', JSON.stringify(reg[0]?.corpo) === JSON.stringify({data: {token: TOKEN, versaoApp: '1.211'}}), JSON.stringify(reg[0]?.corpo).slice(0, 120));
    const marca = JSON.parse(q.marca || 'null');
    conferir('guarda só uma marca do endereço neste aparelho (não o endereço)', marca && /^[0-9a-f]{8}\.\d+$/.test(marca.marca) && !q.marca.includes(TOKEN.slice(0, 20)) && Date.now() - marca.em < 60000, q.marca);
    conferir('o cartão do professor é avisado depois do registro', q.estados >= 1, String(q.estados));
    conferir('estado: Ligado', await pg.evaluate(() => APPushAvisos.estado().rotulo) === 'Ligado');

    await pg.evaluate(() => window.dispatchEvent(new Event('ap-teacher-ready'))); await pg.waitForTimeout(400);
    conferir('painel de novo, mesmo endereço e menos de uma semana: não registra de novo', f.chamadas.length === 1 && (await quadro()).refresh === 2, String(f.chamadas.length));
    await pg.evaluate(t => { window.__push.token = t; window.dispatchEvent(new Event('ap-push-token')); }, TOKEN + 'novo'); await pg.waitForTimeout(400);
    conferir('endereço novo do Firebase: registra de novo', f.chamadas.length === 2 && f.chamadas[1].corpo.data.token === TOKEN + 'novo');
    await pg.evaluate(() => { const k = 'apPushAparelho:R2EmnDVcvMWt7TjPxOP6DjW1VOn1', m = JSON.parse(localStorage.getItem(k)); m.em -= 8 * 864e5; localStorage.setItem(k, JSON.stringify(m)); window.dispatchEvent(new Event('ap-push-token')); });
    await pg.waitForTimeout(400);
    conferir('passou uma semana: registra de novo (mantém o endereço vivo no Firebase)', f.chamadas.length === 3);
    await pg.evaluate(() => { window.dispatchEvent(new Event('ap-push-token')); window.dispatchEvent(new Event('ap-push-token')); window.dispatchEvent(new Event('ap-teacher-ready')); });
    await pg.waitForTimeout(400);
    conferir('vários avisos juntos não duplicam o registro', f.chamadas.length === 3, String(f.chamadas.length));

    // Toque no aviso
    await pg.evaluate(() => { window.__push.abertura = 'cadastro'; window.dispatchEvent(new Event('ap-push-open')); }); await pg.waitForTimeout(200);
    q = await quadro();
    conferir('toque no aviso "Novo cadastro": abre o painel e a lista Alunos para aprovar', q.aprovacoes === 1 && q.painel === 1 && q.abertura === '', JSON.stringify(q));
    await pg.evaluate(() => window.dispatchEvent(new Event('ap-push-open'))); await pg.waitForTimeout(200);
    conferir('o mesmo toque não abre duas vezes', (await quadro()).aprovacoes === 1);
    await pg.evaluate(() => { window.__push.abertura = 'teste'; window.dispatchEvent(new Event('ap-push-open')); }); await pg.waitForTimeout(200);
    conferir('toque no aviso de teste só abre o app', (await quadro()).aprovacoes === 1);
    await pg.evaluate(() => { window.__professor = false; window.__push.abertura = 'cadastro'; window.dispatchEvent(new Event('ap-push-open')); }); await pg.waitForTimeout(200);
    q = await quadro();
    conferir('antes de a conta do professor voltar, o toque fica guardado no Android', q.aprovacoes === 1 && q.abertura === 'cadastro', JSON.stringify(q));
    await pg.evaluate(() => { window.__professor = true; window.dispatchEvent(new Event('ap-teacher-ready')); }); await pg.waitForTimeout(300);
    conferir('com o professor pronto, abre a aprovação guardada', (await quadro()).aprovacoes === 2);

    // Estados para o cartão
    const estado = e => pg.evaluate(e => { window.__push.estado = e; return APPushAvisos.estado(); }, e);
    const casos = [
      [{...LIGADO, permissao: false}, 'Notificações desligadas', true, false],
      [{...LIGADO, canal: 'desligado'}, 'Desligado', true, false],
      [{...LIGADO, token: false, erro: ''}, 'Ligando…', true, false],
      [{...LIGADO, token: false, erro: 'SERVICE_NOT_AVAILABLE'}, 'Sem conexão', true, false],
      [{...LIGADO, telaBloqueada: false}, 'Fora da tela bloqueada', true, true],
      [{...LIGADO, canal: 'silencioso'}, 'Silencioso', true, true],
      [{...LIGADO, canal: 'som'}, 'Ligado', true, true],
      [{...LIGADO, configurado: false}, 'Indisponível neste app', false, false, 'indisponivel'],
      [LIGADO, 'Ligado', true, true]];
    for (const [e, rotulo, ajustar, testar, nivel] of casos) {
      const r = await estado(e);
      conferir('estado ' + JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k, v]) => LIGADO[k] !== v))) + ' → ' + rotulo, r.rotulo === rotulo && r.ajustar === ajustar && r.testar === testar && r.texto.length > 10 && (!nivel || r.nivel === nivel), JSON.stringify(r));
    }

    // Testar
    let antes = f.chamadas.length;
    const okTeste = await pg.evaluate(() => APPushAvisos.testar().then(m => m, e => 'ERRO ' + e.message));
    const novas = f.chamadas.slice(antes).map(c => c.nome);
    conferir('Testar: confirma o endereço e manda o aviso de teste', JSON.stringify(novas) === '["registrarAparelho","testarAviso"]' && okTeste.startsWith('Aviso de teste enviado.'), okTeste + ' ' + JSON.stringify(novas));
    f.respostas.testarAviso = {status: 200, json: {result: {aparelhos: 1, enviados: 0, removidos: 1}}};
    conferir('Testar: o Firebase não entregou', (await pg.evaluate(() => APPushAvisos.testar().catch(e => e.message))).startsWith('O Firebase não entregou'));
    f.respostas.testarAviso = {status: 404, json: {}};
    conferir('Testar antes de publicar as funções: diz que falta publicar', (await pg.evaluate(() => APPushAvisos.testar().catch(e => e.message))).includes('falta publicar as funções'));
    f.respostas.testarAviso = {status: 403, json: {error: {status: 'PERMISSION_DENIED', message: 'x'}}};
    conferir('Testar com outra conta: recusa explicada', (await pg.evaluate(() => APPushAvisos.testar().catch(e => e.message))) === 'Só a conta do professor pode ligar o aviso.');
    f.respostas.testarAviso = {abortar: true};
    conferir('Testar sem internet: pede para conferir a internet', (await pg.evaluate(() => APPushAvisos.testar().catch(e => e.message))).startsWith('Sem conexão com o Firebase'));
    delete f.respostas.testarAviso;
    f.respostas.registrarAparelho = {status: 404, json: {}};
    await pg.evaluate(() => { localStorage.clear(); window.dispatchEvent(new Event('ap-push-token')); }); await pg.waitForTimeout(400);
    const naoLigado = await pg.evaluate(() => APPushAvisos.estado());
    conferir('registro recusado (funções não publicadas): o cartão mostra o motivo', naoLigado.rotulo === 'Não ligado' && naoLigado.texto.includes('falta publicar as funções'), JSON.stringify(naoLigado));
    delete f.respostas.registrarAparelho;
    await pg.evaluate(() => window.dispatchEvent(new Event('ap-push-token'))); await pg.waitForTimeout(400);
    conferir('registro aceito depois: volta a Ligado', (await pg.evaluate(() => APPushAvisos.estado().rotulo)) === 'Ligado');
    await pg.evaluate(() => APPushAvisos.ajustar());
    conferir('ajustar abre o canal do aviso no Android', (await quadro()).ajustes === 1);
    conferir('APPushAvisos não pode ser trocado por outro bloco', await pg.evaluate(() => Object.isFrozen(APPushAvisos)));
    await ctx.close();
  }
  // Aluno, APK antigo e navegador: nada acontece
  for (const [nome, preparo, esperado] of [
    ['aluno no app 1.211', () => { window.__professor = false; }, null],
    ['professor no APK antigo (sem a ponte do aviso)', () => { window.Android = {getUpdateStatus: () => '{}'}; }, 'Precisa do app 1.211'],
    ['professor no navegador (iPhone)', () => { delete window.Android; }, '']]) {
    const ctx = await contexto(); const f = await funcoes(ctx); const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(nome + ': ' + e.message));
    await pg.addInitScript(androidFalso, {estado: LIGADO, token: TOKEN});
    await pg.addInitScript(preparo);
    await pg.goto(BASE + '/bloco.html'); await pg.waitForTimeout(200);
    await pg.evaluate(() => { if (window.__push) window.__push.abertura = 'cadastro'; window.dispatchEvent(new Event('ap-teacher-ready')); window.dispatchEvent(new Event('ap-push-token')); window.dispatchEvent(new Event('ap-push-open')); });
    await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => ({estado: APPushAvisos.estado(), refresh: window.__push?.refresh, aprovacoes: document.getElementById('apPreviewTeacher').contentWindow.aprovacoes}));
    const parado = f.chamadas.length === 0 && r.aprovacoes === 0 && (nome.startsWith('aluno') ? r.refresh === 0 : true);
    conferir(nome + ': não liga, não registra e não abre nada', parado, JSON.stringify(r));
    if (esperado !== null) conferir(nome + ': cartão ' + (esperado ? '"' + esperado + '"' : 'escondido'), esperado ? r.estado.rotulo === esperado : r.estado.nivel === 'oculto', JSON.stringify(r.estado));
    await ctx.close();
  }

  // ---------------------------------------------------------------- B. Cartão em Sons e alertas (professor.html)
  async function professor(versao, avisos) {
    const ctx = await contexto(); const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(versao + '-professor: ' + e.message));
    await pg.addInitScript(() => {
      localStorage.setItem('agendaPersonalTL_v1', JSON.stringify({students: [{id: 'ana', name: 'Ana Teste', studentType: 'presencial'}], lessons: [], occurrenceStatus: {}, payments: [], history: [], workoutPlans: [], trainerProfile: {name: 'Tiago Lima'}}));
      window.APaccounts = {isTeacher: () => true, teacherUid: () => 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1', stage() {}, refreshPreview() {}, knownAreas: () => [], status: () => null, retry() {}};
    });
    if (avisos) await pg.addInitScript(() => {
      window.__cartao = {estado: {nivel: 'ok', rotulo: 'Ligado', texto: 'Chega na tela bloqueada quando um aluno se cadastra, mesmo com o app fechado. O toque abre Alunos para aprovar.', ajustar: true, testar: true}, testes: 0, ajustes: 0, resposta: null};
      window.APPushAvisos = {estado: () => window.__cartao.estado, ajustar: () => { window.__cartao.ajustes++; },
        testar: () => { window.__cartao.testes++; return new Promise((ok, falha) => setTimeout(() => window.__cartao.resposta ? falha(Error(window.__cartao.resposta)) : ok('Aviso de teste enviado. Ele aparece em poucos segundos e fica na tela bloqueada até você abrir.'), 300)); }};
    });
    await pg.goto(BASE + '/' + versao + '-professor.html'); await pg.waitForTimeout(1500);
    // O tema do Tiago (o mesmo do teste do 1.12.308): visual Atual, Azul Royal + Preto
    await pg.evaluate(() => { AgendaColors.selectDesign('current'); AgendaColors.save(AgendaColors.presets.find(p => p.id === 'royal-black')); showScreen('settings'); window.scrollTo(0, 0); });
    await pg.waitForTimeout(400);
    return pg;
  }
  const semCartao = pg => pg.evaluate(() => { const s = document.getElementById('screen-settings').cloneNode(true); s.querySelector('#apPushCard')?.remove(); return s.innerHTML; });
  const v310 = await professor('310', false); const tela310 = await semCartao(v310); await v310.context().close();
  const pg = await professor('311', true);
  const cartao = () => pg.evaluate(() => {
    const c = document.getElementById('apPushCard'), $ = id => document.getElementById(id);
    return {existe: !!c, oculto: c?.hidden, depoisDoDespertador: c?.previousElementSibling?.classList.contains('alarm-tools'), naTela: c?.closest('.screen')?.id,
      dentroDasAbas: !!c?.closest('#apAudioForTeacher,#apAudioForStudents'), rotulo: $('apPushLabel')?.textContent, ajuda: $('apPushHelp')?.textContent,
      corAjuda: $('apPushHelp')?.style.color, testar: $('apPushTest')?.textContent, testarDesligado: $('apPushTest')?.disabled, testarOculto: $('apPushTest')?.hidden, testarApagado: $('apPushTest')?.style.opacity === '.45' || $('apPushTest')?.style.opacity === '0.45', ajustarDesligado: $('apPushAdjust')?.disabled,
      status: $('apPushStatus')?.hidden ? '' : $('apPushStatus')?.textContent, corStatus: $('apPushStatus')?.style.color, cartoes: document.querySelectorAll('#apPushCard').length};
  });
  let c = await cartao();
  conferir('o cartão aparece em Sons e alertas, logo abaixo do Despertador e fora das abas dos sons', c.existe && !c.oculto && c.depoisDoDespertador && c.naTela === 'screen-settings' && !c.dentroDasAbas && c.cartoes === 1, JSON.stringify(c));
  conferir('Ligado: título, estado e explicação', c.rotulo === 'Ligado' && c.ajuda.startsWith('Chega na tela bloqueada') && c.corAjuda === '' && !c.testarDesligado && !c.testarOculto && !c.testarApagado && !c.ajustarDesligado, JSON.stringify(c));
  conferir('o resto da tela é idêntico ao do 1.12.310', (await semCartao(pg)) === tela310);
  await pg.screenshot({path: SHOTS + '/311-sons-e-alertas-ligado.png'});

  await pg.tap('#apPushTest'); await pg.waitForTimeout(80);
  c = await cartao();
  conferir('Testar: botão "Enviando…" desligado enquanto envia', c.testar === 'Enviando…' && c.testarDesligado, JSON.stringify(c));
  await pg.waitForTimeout(500); c = await cartao();
  conferir('Testar: mostra o resultado', c.status.startsWith('Aviso de teste enviado.') && c.corStatus === '' && c.testar === 'Testar' && !c.testarDesligado && (await pg.evaluate(() => window.__cartao.testes)) === 1, JSON.stringify(c));
  await pg.screenshot({path: SHOTS + '/311-sons-e-alertas-teste.png'});
  await pg.evaluate(() => { window.__cartao.resposta = 'O aviso ainda não foi ligado no Firebase: falta publicar as funções.'; });
  await pg.tap('#apPushTest'); await pg.waitForTimeout(500); c = await cartao();
  conferir('Testar com falha: mostra o motivo em destaque', c.status.includes('falta publicar') && c.corStatus === 'var(--amber)', JSON.stringify(c));
  await pg.tap('#apPushAdjust');
  conferir('tocar no cartão abre o ajuste do aviso', (await pg.evaluate(() => window.__cartao.ajustes)) === 1);

  await pg.evaluate(() => { window.__cartao.estado = {nivel: 'atencao', rotulo: 'Fora da tela bloqueada', texto: 'O aviso chega, mas não aparece na tela bloqueada. Toque no cartão e permita mostrar na tela de bloqueio.', ajustar: true, testar: true}; window.dispatchEvent(new Event('ap-push-status')); });
  await pg.waitForTimeout(100); c = await cartao();
  conferir('o app principal avisa (ap-push-status) e o cartão muda na hora, com a orientação em destaque', c.rotulo === 'Fora da tela bloqueada' && c.corAjuda === 'var(--amber)', JSON.stringify(c));
  await pg.screenshot({path: SHOTS + '/311-sons-e-alertas-atencao.png'});
  await pg.evaluate(() => { window.__cartao.estado = {nivel: 'aguarde', rotulo: 'Ligando…', texto: 'Ligando o aviso neste celular.', ajustar: true, testar: false}; window.dispatchEvent(new Event('ap-push-status')); });
  await pg.waitForTimeout(100); c = await cartao();
  conferir('Ligando…: Testar fica apagado até o aviso ligar', c.rotulo === 'Ligando…' && c.testarDesligado && c.testarApagado && !c.testarOculto && c.corAjuda === '', JSON.stringify(c));
  await pg.evaluate(() => { showScreen('more'); }); await pg.waitForTimeout(200);
  await pg.evaluate(() => { window.__cartao.estado = {nivel: 'indisponivel', rotulo: 'Precisa do app 1.211', texto: 'O aviso na tela bloqueada funciona no app Android 1.211 ou mais novo. Atualize o app para ligar.', ajustar: false, testar: false}; showScreen('settings'); window.scrollTo(0, 0); });
  await pg.waitForTimeout(300); c = await cartao();
  conferir('ao abrir a tela de novo: lê o estado e limpa o resultado do teste anterior', c.rotulo === 'Precisa do app 1.211' && c.status === '', JSON.stringify(c));
  conferir('APK antigo: sem o botão Testar, sem ajuste e com a orientação em destaque', c.testarOculto && c.ajustarDesligado && c.corAjuda === 'var(--amber)', JSON.stringify(c));
  await pg.screenshot({path: SHOTS + '/311-sons-e-alertas-apk-antigo.png'});
  await pg.evaluate(() => { window.__cartao.estado = {nivel: 'oculto'}; window.dispatchEvent(new Event('ap-push-status')); }); await pg.waitForTimeout(100);
  conferir('navegador (sem Android): o cartão some', (await cartao()).oculto === true);
  // Tema claro: o cartão usa as mesmas classes dos outros cartões da tela
  await pg.evaluate(() => { window.__cartao.estado = {nivel: 'ok', rotulo: 'Ligado', texto: 'Chega na tela bloqueada quando um aluno se cadastra, mesmo com o app fechado. O toque abre Alunos para aprovar.', ajustar: true, testar: true}; window.dispatchEvent(new Event('ap-push-status')); });
  const mesmasCores = await pg.evaluate(() => {
    const cs = el => { const s = getComputedStyle(el); return [s.backgroundColor, s.borderTopColor, s.color, s.borderRadius].join('|'); };
    const outro = document.querySelector('#screen-settings .sound-choice-group:not(#apPushCard)');
    return {cartao: cs(document.getElementById('apPushCard')) === cs(outro), botao: cs(document.getElementById('apPushAdjust')) === cs(outro.querySelector('.sound-button')), testar: cs(document.getElementById('apPushTest')) === cs(outro.querySelector('.sound-preview-button'))};
  });
  conferir('mesmo fundo, borda, cor e cantos dos outros cartões da tela', mesmasCores.cartao && mesmasCores.botao && mesmasCores.testar, JSON.stringify(mesmasCores));
  const temaClaro = await pg.evaluate(() => { const p = AgendaColors.presets.find(x => x.id === 'purple-white'); if (!p) return null; AgendaColors.save(p); window.scrollTo(0, 0); return p.id; });
  if (temaClaro) { await pg.waitForTimeout(200); await pg.screenshot({path: SHOTS + '/311-sons-e-alertas-tema-claro.png'}); }
  conferir('captura também num tema claro', !!temaClaro, String(temaClaro));
  await pg.context().close();
  const semAvisos = await professor('311', false);
  conferir('página do professor fora do app principal (sem APPushAvisos): o cartão fica escondido', await semAvisos.evaluate(() => document.getElementById('apPushCard')?.hidden === true));
  await semAvisos.context().close();

  // ---------------------------------------------------------------- C. A página principal real abre com o bloco novo
  {
    const ctx = await contexto(); const pgi = await ctx.newPage(); const errosIndex = [];
    pgi.on('pageerror', e => errosIndex.push(e.message));
    await pgi.goto(BASE + '/311-index.html'); await pgi.waitForTimeout(2500);
    const r = await pgi.evaluate(() => ({existe: typeof window.APPushAvisos?.estado === 'function', estado: window.APPushAvisos?.estado?.()}));
    conferir('index.html real do 1.12.311 carrega o bloco e, no navegador, o cartão fica escondido', r.existe && r.estado?.nivel === 'oculto', JSON.stringify(r));
    const nossos = errosIndex.filter(m => /APPushAvisos|ap-push|registrarAparelho|testarAviso|takePushOpen|getPushStatus/.test(m));
    conferir('nenhum erro de JavaScript do bloco novo na página principal', nossos.length === 0, nossos.join(' | '));
    await ctx.close();
  }

  conferir('sem erros de JavaScript nas páginas testadas', erros.length === 0, erros.slice(0, 4).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close(); servidor.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
