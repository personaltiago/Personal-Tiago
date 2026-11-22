'use strict';
// Teste no Chrome do 1.12.304: ícones de "Sons do treino", "Pet" e "Atualizações" no Perfil do aluno, comparando com o 1.12.303.
// Preparação: extraia index.html do 1.12.303 e do 1.12.304 para /tmp/t302/<303|304>-index.html e sirva a pasta:
//   (cd /tmp/t302 && python3 -m http.server 8799 --bind 127.0.0.1)
// Uso: node icones-perfil-chrome.cjs [pasta-das-capturas]
const {chromium} = require(process.env.PLAYWRIGHT_CORE || '/tmp/pwc/node_modules/playwright-core');
const SHOTS = process.argv[2] || '/tmp/t302';
let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => { if (cond) ok++; else falhas++; console.log((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); };
const ALVOS = ['apStudentAudioOpen', 'apProfilePet', 'apProfileUpdates'];

(async () => {
  const navegador = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  const erros = [];
  async function perfil(versao, claro = false) {
    const pg = await (await navegador.newContext({viewport: {width: 412, height: 1400}, deviceScaleFactor: 2})).newPage();
    pg.on('pageerror', e => erros.push(versao + ': ' + e.message));
    await pg.goto('http://127.0.0.1:8799/' + versao + '-index.html');
    await pg.waitForTimeout(2500);
    await pg.evaluate(claro => {
      // aluno em prévia (como o professor vê a área do aluno); "Sons do treino" só aparece quando o professor envia sons: aqui é mostrado
      window.__AP_STUDENT_CONTEXT = {storageId: 'teste-icones', role: 'preview', profile: {name: 'Ana Teste'}, area: null};
      window.APstudentUI.activate(true);
      if (claro) document.getElementById('profileScreen').classList.add('profile-light');
      document.getElementById('apStudentAudioOpen').hidden = false;
    }, claro);
    await pg.evaluate(() => { try { window.route('profile'); } catch (_) { document.querySelector('[data-nav="profile"],[data-route="profile"]')?.click(); } });
    await pg.waitForTimeout(800);
    return pg;
  }
  const medir = pg => pg.evaluate(ids => {
    const ref = document.querySelector('#profileScreen .profile-option [data-profile-icon="profile"] svg');
    const r0 = ref.getBoundingClientRect(), cor0 = getComputedStyle(ref).color;
    return {ref: {w: Math.round(r0.width), h: Math.round(r0.height), cor: cor0}, itens: Object.fromEntries(ids.map(id => {
      const s = document.querySelector('#' + id + ' > span:first-child svg'); const r = s?.getBoundingClientRect();
      return [id, s ? {w: Math.round(r.width), h: Math.round(r.height), cor: getComputedStyle(s).color, desenhador: document.querySelector('#' + id + ' > span:first-child').dataset.profileIcon || ''} : null];
    }))};
  }, ALVOS);

  const antes = await medir(await perfil('303'));
  conferir('1.12.303: os três ícones somem (0×0) — o defeito da foto', ALVOS.every(id => antes.itens[id] && antes.itens[id].w === 0), JSON.stringify(antes.itens));

  const pg = await perfil('304');
  const depois = await medir(pg);
  for (const id of ALVOS) {
    const i = depois.itens[id];
    conferir(`1.12.304: ${id} com ícone do mesmo tamanho e cor dos outros`, i && i.w === depois.ref.w && i.h === depois.ref.h && i.w > 0 && i.cor === depois.ref.cor && i.desenhador, JSON.stringify(i) + ' ref ' + JSON.stringify(depois.ref));
  }
  // os itens continuam fazendo o mesmo: os botões e os onclick não mudaram
  const acoes = await pg.evaluate(() => ({pet: document.getElementById('apProfilePet').getAttribute('onclick'), upd: document.getElementById('apProfileUpdates').getAttribute('onclick'), sons: document.getElementById('apStudentAudioOpen').getAttribute('aria-controls')}));
  conferir('as ações dos três itens não mudaram', acoes.pet === 'APmascot.open()' && acoes.upd === 'APaccounts.openUpdates()' && acoes.sons === 'apStudentAudioOptions', JSON.stringify(acoes));
  await pg.locator('#profileScreen .profile-options').screenshot({path: SHOTS + '/304-perfil-aluno.png'});

  const claro = await perfil('304', true);
  const mc = await medir(claro);
  conferir('modo claro: os três seguem a cor do tema como os outros', ALVOS.every(id => mc.itens[id].cor === mc.ref.cor && mc.itens[id].w === mc.ref.w), JSON.stringify(mc));
  await claro.locator('#profileScreen .profile-options').screenshot({path: SHOTS + '/304-perfil-aluno-claro.png'});

  conferir('sem erros de JavaScript', erros.length === 0, erros.slice(0, 3).join(' | '));
  console.log(`\nRESUMO: ${ok} OK, ${falhas} falha(s)`);
  await navegador.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
