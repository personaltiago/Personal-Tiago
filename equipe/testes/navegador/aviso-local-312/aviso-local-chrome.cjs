'use strict';
// Teste no Chrome do 1.12.312 (aviso "Novo cadastro" na tela, local), com o 1.12.310 como comparação da tela Sons e alertas.
// Sozinho: lê os pacotes da raiz do repositório, serve as páginas num servidor local e simula o Android 1.211 (ponte
// getNoticeVersion/getNoticeStatus/showRegistrationNotice/openNoticeSettings/takeNoticeOpen) e a consulta do Firebase que o
// sininho usa (cadastros à espera de aprovação). Não usa rede, Firebase de verdade nem aparelho.
// Uso: node equipe/testes/navegador/aviso-local-312/aviso-local-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../../../..');
const SHOTS = process.argv[2] || '/tmp/t312';
const P312 = 'AgendaPersonal-1.12.312-Aviso-Cadastro-Local-Para-Assinar.agenda.json';
const P310 = 'AgendaPersonal-1.12.310-Sons-E-Alertas-Para-Assinar.agenda.json';
const TEACHER = 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };

function bloco(html, id) {
  const abre = '<script id="' + id + '">', i = html.indexOf(abre);
  if (i < 0 || html.indexOf(abre, i + 1) >= 0) throw Error('bloco ' + id + ' não aparece uma única vez');
  return html.slice(i + abre.length, html.indexOf('</script>', i));
}

// Página mínima do app principal: contas (com o Firebase de mentira do sininho), painel do professor e o bloco real.
function harness(js) {
  return '<!doctype html><html><head><meta charset="utf-8"></head><body><iframe id="apPreviewTeacher" srcdoc="<!doctype html><script>'
    + "window.aprovacoes=0;window.estados=0;window.openStudentApprovals=()=>{window.aprovacoes++};addEventListener('ap-aviso-status',()=>{window.estados++})"
    + '</script>"></iframe><script>window.aberturasPainel=0;window.APopenTeacher=()=>{window.aberturasPainel++};'
    + 'Object.defineProperty(document,"hidden",{configurable:true,get:()=>window.__oculto===true});'
    + 'window.__fs={next:null,erro:null,ouvintes:0,parados:0,consultas:[],sdks:0};'
    + 'const sdk={auth:{currentUser:{uid:"' + TEACHER + '"}},db:{nome:"db"},collection:(db,nome)=>({db:db.nome,nome}),where:(campo,op,valor)=>[campo,op,valor],'
    + 'query:(c,...filtros)=>({colecao:c.nome,filtros}),onSnapshot:(q,next,erro)=>{__fs.ouvintes++;__fs.consultas.push(q);__fs.next=next;__fs.erro=erro;return()=>{__fs.parados++;__fs.next=null}},'
    + 'onAuthStateChanged:(auth,cb)=>{setTimeout(()=>cb(auth.currentUser),0);return()=>{}}};'
    + 'window.APaccounts={isTeacher:()=>window.__professor!==false,teacherUid:()=>window.__professor!==false?"' + TEACHER + '":null,'
    + 'registrationSdk:async()=>{__fs.sdks++;if(window.__professor===false)throw Error("Entre com a conta do professor.");return sdk}};'
    + 'window.__cadastros=docs=>__fs.next&&__fs.next({docs:docs.map(([id,nome])=>({id,data:()=>nome===undefined?{}:{nome}}))});'
    + '</script><script id="ap-aviso-cadastro">' + js + '</script></body></html>';
}

(async () => {
  const pacote = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  const p312 = pacote(P312), p310 = pacote(P310);
  fs.mkdirSync(SHOTS, {recursive: true});
  const paginas = {'/312-professor.html': p312.files['professor.html'], '/310-professor.html': p310.files['professor.html'],
    '/312-index.html': p312.files['index.html'], '/bloco.html': harness(bloco(p312.files['index.html'], 'ap-aviso-cadastro'))};
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

  // Android 1.211 de mentira (a mesma ponte do MainActivity.Bridge).
  const androidFalso = ({estado}) => {
    window.__avisos = {estado, mostrados: [], abertura: '', ajustes: 0, recusar: false};
    window.Android = {getNoticeVersion: () => 1, getNoticeStatus: () => JSON.stringify(window.__avisos.estado),
      showRegistrationNotice: json => { if (window.__avisos.recusar) return false; window.__avisos.mostrados.push(JSON.parse(json)); return true; },
      openNoticeSettings: () => { window.__avisos.ajustes++; }, takeNoticeOpen: () => { const t = window.__avisos.abertura; window.__avisos.abertura = ''; return t; }};
  };
  const LIGADO = {versao: 1, app: '1.211', permissao: true, canal: 'alerta', telaBloqueada: true};

  // ---------------------------------------------------------------- A. ap-aviso-cadastro (app principal)
  {
    const ctx = await contexto(); const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push('bloco: ' + e.message));
    await pg.addInitScript(androidFalso, {estado: LIGADO});
    await pg.goto(BASE + '/bloco.html'); await pg.waitForTimeout(300);
    const q = () => pg.evaluate(() => ({fs: {ouvintes: __fs.ouvintes, parados: __fs.parados, sdks: __fs.sdks, ativo: !!__fs.next}, mostrados: __avisos.mostrados,
      vistos: JSON.parse(localStorage.getItem('apAvisoCadastroVistos:R2EmnDVcvMWt7TjPxOP6DjW1VOn1') || 'null'),
      aprovacoes: document.getElementById('apPreviewTeacher').contentWindow.aprovacoes, estados: document.getElementById('apPreviewTeacher').contentWindow.estados,
      painel: window.aberturasPainel, abertura: __avisos.abertura}));
    const cadastros = async (docs, oculto) => { await pg.evaluate(([d, o]) => { window.__oculto = o; window.__cadastros(d); }, [docs, oculto]); await pg.waitForTimeout(80); return q(); };
    conferir('nada acontece antes do painel do professor ficar pronto', (await q()).fs.ouvintes === 0);
    await pg.evaluate(() => window.dispatchEvent(new Event('ap-teacher-ready'))); await pg.waitForTimeout(200);
    let r = await q();
    const consulta = await pg.evaluate(() => JSON.stringify(__fs.consultas[0]));
    conferir('painel pronto: acompanha os cadastros com a mesma consulta do sininho (só leitura)', r.fs.ouvintes === 1 && r.fs.ativo
      && consulta === JSON.stringify({colecao: 'usuarios', filtros: [['professorId', '==', TEACHER], ['perfil', '==', 'aluno'], ['ativo', '==', false]]}), consulta);
    r = await cadastros([['u0', 'Bruno Lima']], true);
    conferir('primeira vez no aparelho: quem já esperava aprovação não vira aviso', r.mostrados.length === 0 && JSON.stringify(r.vistos) === '["u0"]', JSON.stringify(r));
    r = await cadastros([['u0', 'Bruno Lima'], ['u1', 'Ana Souza']], false);
    conferir('cadastro novo com o app na tela: sem notificação (o sininho mostra), mas fica visto', r.mostrados.length === 0 && JSON.stringify(r.vistos) === '["u0","u1"]', JSON.stringify(r.vistos));
    r = await cadastros([['u0', 'Bruno Lima'], ['u1', 'Ana Souza'], ['u2', 'Carla Maria Dias']], true);
    conferir('cadastro novo com o app em segundo plano ou tela bloqueada: notificação com o primeiro nome',
      JSON.stringify(r.mostrados) === JSON.stringify([{tipo: 'cadastro', titulo: 'Novo cadastro', texto: 'Carla se cadastrou. Toque para aprovar.', aluno: 'u2'}]), JSON.stringify(r.mostrados));
    conferir('o cartão do professor é avisado a cada mudança', r.estados >= 3, String(r.estados));
    r = await cadastros([['u0', 'Bruno Lima'], ['u1', 'Ana Souza'], ['u2', 'Carla Maria Dias']], true);
    conferir('o mesmo cadastro não avisa duas vezes', r.mostrados.length === 1);
    r = await cadastros([['u0', 'Bruno Lima'], ['u3'], ['u4', '\u0007' + '\u{1F600}'.repeat(45) + ' Sobrenome']], true);
    const [semNome, comprido] = r.mostrados.slice(1);
    conferir('dois cadastros juntos: dois avisos; sem nome, "Um aluno se cadastrou"', r.mostrados.length === 3 && semNome?.texto === 'Um aluno se cadastrou. Toque para aprovar.' && semNome?.aluno === 'u3', JSON.stringify(r.mostrados.slice(1)).slice(0, 200));
    conferir('nome estranho: sem caracteres de controle, até 40 letras, sem partir emoji', comprido && Array.from(comprido.texto.split(' se cadastrou')[0]).length === 40 && !/[\u0000-\u001f]/.test(comprido.texto) && !/[\ud800-\udbff]( |$)/.test(comprido.texto), comprido?.texto);
    conferir('quem foi aprovado sai da lista sem aviso; o histórico de vistos continua', JSON.stringify(r.vistos) === '["u0","u1","u2","u3","u4"]', JSON.stringify(r.vistos));
    await pg.evaluate(() => window.dispatchEvent(new Event('ap-teacher-ready'))); await pg.waitForTimeout(150);
    conferir('painel pronto de novo: não abre outra consulta', (await q()).fs.ouvintes === 1);

    // App reaberto: o que chegou com ele fechado aparece no sininho, sem aviso; os novos depois disso avisam
    await pg.reload(); await pg.waitForTimeout(200);
    await pg.evaluate(() => window.dispatchEvent(new Event('ap-teacher-ready'))); await pg.waitForTimeout(150);
    r = await cadastros([['u0'], ['u1'], ['u2'], ['u3'], ['u4'], ['u5', 'Davi']], false);
    conferir('app aberto de novo: o cadastro que chegou com ele fechado aparece no sininho, sem aviso', r.mostrados.length === 0 && r.vistos.includes('u5'), JSON.stringify(r.vistos));
    r = await cadastros([['u0'], ['u1'], ['u2'], ['u3'], ['u4'], ['u5', 'Davi'], ['u6', 'Eva']], true);
    conferir('e o próximo, com o app em segundo plano, avisa', r.mostrados.length === 1 && r.mostrados[0].aluno === 'u6' && r.mostrados[0].texto.startsWith('Eva'), JSON.stringify(r.mostrados));
    await pg.evaluate(() => { const muitos = Array.from({length: 320}, (_, i) => ['x' + i]); window.__oculto = false; window.__cadastros(muitos); });
    conferir('a lista de vistos fica limitada a 300 (guarda os mais novos)', await pg.evaluate(() => { const v = JSON.parse(localStorage.getItem('apAvisoCadastroVistos:R2EmnDVcvMWt7TjPxOP6DjW1VOn1')); return v.length === 300 && v.at(-1) === 'x319'; }));

    // Toque no aviso
    await pg.evaluate(() => { __avisos.abertura = 'cadastro'; window.dispatchEvent(new Event('ap-notice-open')); }); await pg.waitForTimeout(150);
    r = await q();
    conferir('toque no aviso "Novo cadastro": abre o painel e a lista Alunos para aprovar', r.aprovacoes === 1 && r.painel === 1 && r.abertura === '', JSON.stringify({a: r.aprovacoes, p: r.painel}));
    await pg.evaluate(() => window.dispatchEvent(new Event('ap-notice-open'))); await pg.waitForTimeout(100);
    conferir('o mesmo toque não abre duas vezes', (await q()).aprovacoes === 1);
    await pg.evaluate(() => { __avisos.abertura = 'teste'; window.dispatchEvent(new Event('ap-notice-open')); }); await pg.waitForTimeout(100);
    conferir('toque no aviso de teste só abre o app', (await q()).aprovacoes === 1);
    await pg.evaluate(() => { window.__professor = false; __avisos.abertura = 'cadastro'; window.dispatchEvent(new Event('ap-notice-open')); }); await pg.waitForTimeout(100);
    conferir('antes de a conta do professor voltar, o toque fica guardado no Android', (await q()).abertura === 'cadastro');
    await pg.evaluate(() => { window.__professor = true; window.dispatchEvent(new Event('ap-teacher-ready')); }); await pg.waitForTimeout(200);
    conferir('com o professor pronto, abre a aprovação guardada', (await q()).aprovacoes === 2);

    // Estados para o cartão
    const estado = e => pg.evaluate(e => { __avisos.estado = e; return APAvisoCadastro.estado(); }, e);
    for (const [e, rotulo, ajustar, testar] of [
      [{...LIGADO, permissao: false}, 'Notificações desligadas', true, false],
      [{...LIGADO, canal: 'desligado'}, 'Desligado', true, false],
      [{...LIGADO, telaBloqueada: false}, 'Fora da tela bloqueada', true, true],
      [{...LIGADO, canal: 'silencioso'}, 'Silencioso', true, true],
      [{...LIGADO, canal: 'som'}, 'Ligado', true, true],
      [LIGADO, 'Ligado', true, true]]) {
      const s = await estado(e);
      conferir('estado ' + JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k, v]) => LIGADO[k] !== v))) + ' → ' + rotulo, s.rotulo === rotulo && s.ajustar === ajustar && s.testar === testar && s.texto.length > 10, JSON.stringify(s));
    }
    const ligado = await estado(LIGADO);
    conferir('Ligado explica o limite (app fechado) e a bateria do Xiaomi', ligado.texto.includes('Se o celular fechar o app') && ligado.texto.includes('Sem restrições'), ligado.texto);
    await pg.evaluate(() => __fs.erro(new Error('permission-denied'))); await pg.waitForTimeout(80);
    let s = await pg.evaluate(() => APAvisoCadastro.estado());
    conferir('erro ao acompanhar os cadastros: o cartão mostra "Sem conexão"', s.rotulo === 'Sem conexão' && s.texto.startsWith('Não foi possível acompanhar'), JSON.stringify(s));
    await pg.evaluate(() => window.dispatchEvent(new Event('online'))); await pg.waitForTimeout(150);
    await pg.evaluate(() => window.__cadastros([['x1']])); await pg.waitForTimeout(80);
    conferir('voltando a internet, volta a acompanhar e o cartão volta a Ligado', (await pg.evaluate(() => APAvisoCadastro.estado().rotulo)) === 'Ligado' && (await q()).fs.ativo);

    // Testar e ajustar
    const okTeste = await pg.evaluate(() => APAvisoCadastro.testar().then(m => m, e => 'ERRO ' + e.message));
    const teste = (await q()).mostrados.at(-1);
    conferir('Testar mostra um aviso de teste no próprio celular, sem internet', okTeste.startsWith('Aviso de teste mostrado.') && teste.tipo === 'teste' && teste.titulo === 'Teste do aviso' && !teste.aluno, okTeste + ' ' + JSON.stringify(teste));
    await pg.evaluate(() => { __avisos.recusar = true; });
    conferir('Testar quando o Android recusa: explica', (await pg.evaluate(() => APAvisoCadastro.testar().catch(e => e.message))) === 'O Android não mostrou o aviso. Confira as notificações do app.');
    await pg.evaluate(() => APAvisoCadastro.ajustar());
    conferir('ajustar abre o canal do aviso no Android', (await pg.evaluate(() => __avisos.ajustes)) === 1);
    conferir('APAvisoCadastro não pode ser trocado por outro bloco', await pg.evaluate(() => Object.isFrozen(APAvisoCadastro)));
    await pg.evaluate(() => window.dispatchEvent(new Event('ap-account-changed'))); await pg.waitForTimeout(80);
    conferir('troca de conta: para de acompanhar', (await q()).fs.ativo === false);
    await ctx.close();
  }
  // Aluno, APK antigo e navegador: nada acontece
  for (const [nome, preparo, esperado] of [
    ['aluno no app 1.211', () => { window.__professor = false; }, null],
    ['professor no APK antigo (sem a ponte do aviso)', () => { window.Android = {getUpdateStatus: () => '{}'}; }, 'Precisa do app 1.211'],
    ['professor no navegador (iPhone)', () => { delete window.Android; }, '']]) {
    const ctx = await contexto(); const pg = await ctx.newPage();
    pg.on('pageerror', e => erros.push(nome + ': ' + e.message));
    await pg.addInitScript(androidFalso, {estado: LIGADO});
    await pg.addInitScript(preparo);
    await pg.goto(BASE + '/bloco.html'); await pg.waitForTimeout(200);
    await pg.evaluate(() => { if (window.__avisos) window.__avisos.abertura = 'cadastro'; window.__oculto = true; window.dispatchEvent(new Event('ap-teacher-ready')); window.dispatchEvent(new Event('ap-notice-open')); });
    await pg.waitForTimeout(250);
    const r = await pg.evaluate(() => ({estado: APAvisoCadastro.estado(), ouvintes: __fs.ouvintes, sdks: __fs.sdks, mostrados: window.__avisos?.mostrados?.length ?? 0, aprovacoes: document.getElementById('apPreviewTeacher').contentWindow.aprovacoes}));
    conferir(nome + ': não acompanha, não mostra e não abre nada', r.ouvintes === 0 && r.sdks === 0 && r.mostrados === 0 && r.aprovacoes === 0, JSON.stringify(r));
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
      window.__cartao = {estado: {nivel: 'ok', rotulo: 'Ligado', texto: 'Avisa na tela quando um aluno se cadastra, com o app aberto ou em segundo plano. Se o celular fechar o app, o cadastro aparece ao abrir. No Xiaomi, deixe a bateria do app em "Sem restrições".', ajustar: true, testar: true}, testes: 0, ajustes: 0, resposta: null};
      window.APAvisoCadastro = {estado: () => window.__cartao.estado, ajustar: () => { window.__cartao.ajustes++; },
        testar: () => { window.__cartao.testes++; return window.__cartao.resposta ? Promise.reject(Error(window.__cartao.resposta)) : Promise.resolve('Aviso de teste mostrado. Bloqueie a tela: ele fica lá até você abrir.'); }};
    });
    await pg.goto(BASE + '/' + versao + '-professor.html'); await pg.waitForTimeout(1500);
    // O tema do Tiago (o mesmo dos testes do 1.12.308 e 1.12.311): visual Atual, Azul Royal + Preto
    await pg.evaluate(() => { AgendaColors.selectDesign('current'); AgendaColors.save(AgendaColors.presets.find(p => p.id === 'royal-black')); showScreen('settings'); window.scrollTo(0, 0); });
    await pg.waitForTimeout(400);
    return pg;
  }
  const semCartao = pg => pg.evaluate(() => { const s = document.getElementById('screen-settings').cloneNode(true); s.querySelector('#apAvisoCard')?.remove(); return s.innerHTML; });
  const v310 = await professor('310', false); const tela310 = await semCartao(v310); await v310.context().close();
  const pg = await professor('312', true);
  const cartao = () => pg.evaluate(() => {
    const c = document.getElementById('apAvisoCard'), $ = id => document.getElementById(id);
    return {existe: !!c, oculto: c?.hidden, depoisDoDespertador: c?.previousElementSibling?.classList.contains('alarm-tools'), naTela: c?.closest('.screen')?.id,
      dentroDasAbas: !!c?.closest('#apAudioForTeacher,#apAudioForStudents'), rotulo: $('apAvisoLabel')?.textContent, ajuda: $('apAvisoHelp')?.textContent,
      corAjuda: $('apAvisoHelp')?.style.color, testar: $('apAvisoTest')?.textContent, testarDesligado: $('apAvisoTest')?.disabled, testarOculto: $('apAvisoTest')?.hidden,
      ajustarDesligado: $('apAvisoAdjust')?.disabled, status: $('apAvisoStatus')?.hidden ? '' : $('apAvisoStatus')?.textContent, corStatus: $('apAvisoStatus')?.style.color,
      cartoes: document.querySelectorAll('#apAvisoCard').length, push: !!document.getElementById('apPushCard')};
  });
  let c = await cartao();
  conferir('o cartão aparece em Sons e alertas, logo abaixo do Despertador e fora das abas dos sons (e o do push não)', c.existe && !c.oculto && c.depoisDoDespertador && c.naTela === 'screen-settings' && !c.dentroDasAbas && c.cartoes === 1 && !c.push, JSON.stringify(c));
  conferir('Ligado: título, estado e explicação com o limite', c.rotulo === 'Ligado' && c.ajuda.includes('Se o celular fechar o app') && c.corAjuda === '' && !c.testarDesligado && !c.testarOculto && !c.ajustarDesligado, JSON.stringify(c));
  conferir('o resto da tela é idêntico ao do 1.12.310', (await semCartao(pg)) === tela310);
  await pg.screenshot({path: SHOTS + '/312-sons-e-alertas-ligado.png'});
  await pg.tap('#apAvisoTest'); await pg.waitForTimeout(200); c = await cartao();
  conferir('Testar: mostra o resultado', c.status.startsWith('Aviso de teste mostrado.') && c.corStatus === '' && c.testar === 'Testar' && (await pg.evaluate(() => window.__cartao.testes)) === 1, JSON.stringify(c));
  await pg.screenshot({path: SHOTS + '/312-sons-e-alertas-teste.png'});
  await pg.evaluate(() => { window.__cartao.resposta = 'O Android não mostrou o aviso. Confira as notificações do app.'; });
  await pg.tap('#apAvisoTest'); await pg.waitForTimeout(200); c = await cartao();
  conferir('Testar com falha: mostra o motivo em destaque', c.status.startsWith('O Android não mostrou') && c.corStatus === 'var(--amber)', JSON.stringify(c));
  await pg.tap('#apAvisoAdjust');
  conferir('tocar no cartão abre o ajuste do aviso', (await pg.evaluate(() => window.__cartao.ajustes)) === 1);
  await pg.evaluate(() => { window.__cartao.estado = {nivel: 'atencao', rotulo: 'Fora da tela bloqueada', texto: 'O aviso aparece, mas não na tela bloqueada. Toque no cartão e permita mostrar na tela de bloqueio.', ajustar: true, testar: true}; window.dispatchEvent(new Event('ap-aviso-status')); });
  await pg.waitForTimeout(100); c = await cartao();
  conferir('o app principal avisa (ap-aviso-status) e o cartão muda na hora, com a orientação em destaque', c.rotulo === 'Fora da tela bloqueada' && c.corAjuda === 'var(--amber)', JSON.stringify(c));
  await pg.evaluate(() => { showScreen('more'); }); await pg.waitForTimeout(200);
  await pg.evaluate(() => { window.__cartao.estado = {nivel: 'indisponivel', rotulo: 'Precisa do app 1.211', texto: 'O aviso na tela precisa do app Android 1.211 ou mais novo. Atualize o app para ligar.', ajustar: false, testar: false}; showScreen('settings'); window.scrollTo(0, 0); });
  await pg.waitForTimeout(300); c = await cartao();
  conferir('ao abrir a tela de novo: lê o estado e limpa o resultado do teste anterior', c.rotulo === 'Precisa do app 1.211' && c.status === '', JSON.stringify(c));
  conferir('APK antigo: sem o botão Testar, sem ajuste e com a orientação em destaque', c.testarOculto && c.ajustarDesligado && c.corAjuda === 'var(--amber)', JSON.stringify(c));
  await pg.screenshot({path: SHOTS + '/312-sons-e-alertas-apk-antigo.png'});
  await pg.evaluate(() => { window.__cartao.estado = {nivel: 'oculto'}; window.dispatchEvent(new Event('ap-aviso-status')); }); await pg.waitForTimeout(100);
  conferir('navegador (sem Android): o cartão some', (await cartao()).oculto === true);
  await pg.evaluate(() => { window.__cartao.estado = {nivel: 'ok', rotulo: 'Ligado', texto: 'Avisa na tela quando um aluno se cadastra, com o app aberto ou em segundo plano. Se o celular fechar o app, o cadastro aparece ao abrir. No Xiaomi, deixe a bateria do app em "Sem restrições".', ajustar: true, testar: true}; window.dispatchEvent(new Event('ap-aviso-status')); });
  const mesmasCores = await pg.evaluate(() => {
    const cs = el => { const s = getComputedStyle(el); return [s.backgroundColor, s.borderTopColor, s.color, s.borderRadius].join('|'); };
    const outro = document.querySelector('#screen-settings .sound-choice-group:not(#apAvisoCard)');
    return {cartao: cs(document.getElementById('apAvisoCard')) === cs(outro), botao: cs(document.getElementById('apAvisoAdjust')) === cs(outro.querySelector('.sound-button')), testar: cs(document.getElementById('apAvisoTest')) === cs(outro.querySelector('.sound-preview-button'))};
  });
  conferir('mesmo fundo, borda, cor e cantos dos outros cartões da tela', mesmasCores.cartao && mesmasCores.botao && mesmasCores.testar, JSON.stringify(mesmasCores));
  const temaClaro = await pg.evaluate(() => { const p = AgendaColors.presets.find(x => x.id === 'purple-white'); if (!p) return null; AgendaColors.save(p); window.scrollTo(0, 0); return p.id; });
  if (temaClaro) { await pg.waitForTimeout(200); await pg.screenshot({path: SHOTS + '/312-sons-e-alertas-tema-claro.png'}); }
  conferir('captura também num tema claro', !!temaClaro, String(temaClaro));
  await pg.context().close();
  const semAvisos = await professor('312', false);
  conferir('página do professor fora do app principal (sem APAvisoCadastro): o cartão fica escondido', await semAvisos.evaluate(() => document.getElementById('apAvisoCard')?.hidden === true));
  await semAvisos.context().close();

  // ---------------------------------------------------------------- C. A página principal real abre com o bloco novo
  {
    const ctx = await contexto(); const pgi = await ctx.newPage(); const errosIndex = [];
    pgi.on('pageerror', e => errosIndex.push(e.message));
    await pgi.goto(BASE + '/312-index.html'); await pgi.waitForTimeout(2500);
    const r = await pgi.evaluate(() => ({existe: typeof window.APAvisoCadastro?.estado === 'function', push: typeof window.APPushAvisos, estado: window.APAvisoCadastro?.estado?.()}));
    conferir('index.html real do 1.12.312 carrega o bloco novo, sem o do push, e no navegador o cartão fica escondido', r.existe && r.push === 'undefined' && r.estado?.nivel === 'oculto', JSON.stringify(r));
    const nossos = errosIndex.filter(m => /APAvisoCadastro|ap-aviso|showRegistrationNotice|takeNoticeOpen|getNoticeStatus/.test(m));
    conferir('nenhum erro de JavaScript do bloco novo na página principal', nossos.length === 0, nossos.join(' | '));
    await ctx.close();
  }

  conferir('sem erros de JavaScript nas páginas testadas', erros.length === 0, erros.slice(0, 4).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close(); servidor.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
