'use strict';
// Teste no Chrome real das três correções de exercícios incluídas no pacote 1.12.291, na página REAL (professor.html do pacote), em tela de toque
// (390×844 a 2×), com toque de verdade nos botões e com a ponte do Android simulada só onde o aplicativo a usa (salvar arquivo).
//   1) as três correções estão ativas e a página abre sem erro;
//   2) Catálogo de exercícios unificado (01): exercícios do app e os seus numa lista só, aba "Seus exercícios" escondida, nota nova, "Salvar também no catálogo";
//   3) Baixar catálogo de exercícios (02): o TXT (nome, conteúdo, agrupamento, origem, campos alterados), com a ponte do Android, sem ela (download comum) e com falha;
//   4) o Catálogo continua uma página inteira (1.12.288) com a fileira de abas nova e o botão novo sem estourar a largura, no escuro e no claro;
//   5) Duplicatas e exclusão no catálogo (03): um cartão por exercício equivalente, favorito do grupo, excluir (cancelar, confirmar, pelo editor), o que é preservado
//      (fichas, histórico, alunos, vínculo e vídeo da ficha), o que sai do TXT, e a exclusão continuando depois de reabrir;
//   6) contraste: na página SEM a 03 (1.12.288 + 01 + 02) os mesmos cenários mostram o comportamento antigo, para provar que o teste enxerga a diferença.
// uso: node catalogo.js [pagina.html] [pagina-sem-03.html]     (variáveis: PORTA, SAIDA, como nos outros testes desta pasta)
const {launch, sleep, BASE, SAIDA} = require('../janelas-pagina/cdp.js');
const {estado} = require('../janelas-pagina/semente.js');
const fs = require('node:fs');
const APP = process.argv[2] || 'prof-291.html';
const SEM03 = process.argv[3] || 'prof-sem03.html';
const VIDEO = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
const DB = 'agendaPersonalTL_v1';

// Estado de exemplo: o do teste das janelas, mais exercícios pessoais (um único, um par igual ao do app e um par igual entre si).
function semente() {
  const st = estado();
  const mine = (id, name, muscle, video = '', notes = '') => ({id, name, muscle, muscles: [muscle], category: 'Musculação', notes, observations: '', video});
  st.exerciseCatalog = [
    mine('ex-mine-1', 'Remada Unilateral Personalizada', 'Costas', VIDEO, 'Apoie o joelho no banco.'),
    mine('ex-dup-1', 'Supino reto com barra', 'Peito'),
    mine('ex-dup-2', 'Elevação lateral no cabo', 'Ombros'),
    mine('ex-dup-3', 'Elevação lateral no cabo', 'Ombros')
  ];
  st.exerciseCatalogOverrides = {'app-ex-002': {observations: 'Observação do professor para teste.'}};
  st.exerciseFavorites = ['ex-dup-1'];
  // um exercício da ficha da Mariana foi inserido a partir do exercício pessoal (mesmo nome e vínculo), sem vídeo próprio
  Object.assign(st.workoutPlans[0].days[1].exercises[2], {name: 'Remada Unilateral Personalizada', catalogId: 'ex-mine-1', video: ''});
  st.history = [{id: 'h-teste', at: '2026-11-01T10:00:00.000Z', text: 'Histórico de teste que não pode mudar'}];
  return st;
}

const res = []; let falhas = 0;
const check = (nome, cond, det) => { if (!cond) falhas++; res.push((cond ? 'OK   ' : 'FALHA') + ' ' + nome + (det ? '  — ' + det : '')); };

async function abrir(app, {limpar = true} = {}) {
  const c = await launch({w: 390, h: 844, dpr: 2});
  const url = BASE + '/dialogo.html?app=' + app;
  await c.navigate(url); await sleep(300);
  if (limpar) await c.evaluate(`localStorage.setItem(${JSON.stringify(DB)}, ${JSON.stringify(JSON.stringify(semente()))});`);
  await c.navigate(url);
  await esperar(c);
  return {c, url, ev: body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`)};
}
async function esperar(c) {
  for (let i = 0; i < 120; i++) {
    let ok = false;
    try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('workoutCatalogDialog'))}catch(e){return false}})()`); } catch (e) {}
    if (ok) break;
    await sleep(250);
  }
  await sleep(2200);
}

// Ponte do Android e confirm() simulados dentro da página (o Chrome sem cabeça não tem os dois).
const PREPARAR_PONTE = `
  W.__salvos = []; W.__confirmacoes = []; W.__resposta = true; W.__salvarOk = true;
  W.Android = {saveBase64File(nome, mime, b64) { W.__salvos.push({nome, mime, b64}); return W.__salvarOk; }};
  W.confirm = mensagem => { W.__confirmacoes.push(String(mensagem)); return W.__resposta; };`;
const buscar = nome => `const i=D.getElementById('workoutCatalogSearch');i.value=${JSON.stringify(nome)};W.renderWorkoutCatalog();`;
const cartoes = `[...D.querySelectorAll('#workoutCatalogContent .workout-catalog-card')]`;
const decodificar = b64 => Buffer.from(b64, 'base64').toString('utf8');

(async () => {
  fs.mkdirSync(SAIDA, {recursive: true});
  const {c, url, ev} = await abrir(APP);
  const toque = async (x, y) => { await c.swipe(x, y, 0, {steps: 1}); await sleep(300); };
  // toca (de verdade) no centro de um elemento, depois de rolá-lo para o meio da janela
  const tocarEm = async seletor => {
    const r = await ev(`const e=${seletor};e.scrollIntoView({block:'center'});return new Promise(ok=>setTimeout(()=>{const b=e.getBoundingClientRect();ok({x:Math.round(b.left+b.width/2),y:Math.round(b.top+b.height/2),w:Math.round(b.width),h:Math.round(b.height)})},250))`);
    await toque(r.x, r.y);
    return r;
  };
  const estadoDe = async chave => JSON.parse(await ev(`return JSON.stringify(W.eval(${JSON.stringify('state.' + chave)}))`));
  try {
    // ---------- 1) carregamento ----------
    res.push('# 1) carregamento e presença das três correções');
    check('1a. a página abre sem erro', c.logs.filter(l => /ERRO-PAGINA/.test(l)).length === 0, JSON.stringify(c.logs.filter(l => /ERRO-PAGINA/.test(l)).slice(0, 2)));
    check('1b. 01 ativa: aba "Seus exercícios" escondida e fileira marcada como unificada', await ev(`const m=D.getElementById('workoutCatalogMine');return m.hidden&&W.getComputedStyle(m).display==='none'&&m.parentElement.classList.contains('workout-catalog-unified')`));
    check('1c. 02 ativa: botão "Baixar catálogo" na fileira de abas', await ev(`const b=D.getElementById('workoutCatalogDownload');return !!b&&b.textContent==='Baixar catálogo'&&b.parentElement===D.getElementById('workoutCatalogApp').parentElement`));
    check('1d. 03 ativa: a exclusão é a nova (agrupa os equivalentes) e o botão do editor continua existindo', await ev(`return W.deleteCatalogExercise.toString().includes('visibleGroups')&&!!D.getElementById('workoutCatalogDelete')`));

    // ---------- 2) Catálogo unificado (01) ----------
    res.push('# 2) Catálogo de exercícios unificado');
    await ev(`W.openWorkoutCatalog();return 1`); await sleep(600);
    const unif = JSON.parse(await ev(`
      W.setWorkoutCatalogTab('app');const nomes=W.filteredWorkoutCatalog(false).map(i=>i.id);
      return JSON.stringify({app: nomes.includes('app-ex-003'), pessoal: nomes.includes('ex-mine-1'), total: nomes.length,
        aba: W.eval('workoutCatalogTab'), nota: D.querySelector('#workoutCatalogDialog .workout-actions + .note')?.textContent||''});`));
    check('2a. na aba "Exercícios do app" aparecem juntos os do app e os pessoais', unif.app && unif.pessoal, JSON.stringify(unif));
    check('2b. a aba continua sendo "app" (o 01 não deixa abrir "Seus exercícios")', await ev(`W.setWorkoutCatalogTab('mine');return W.eval('workoutCatalogTab')==='app'`));
    check('2c. nota do catálogo atualizada', unif.nota === 'Vídeos salvos no treino também ficam disponíveis neste catálogo.', unif.nota);
    await ev(buscar('Remada Unilateral'));
    check('2d. a busca por nome acha o exercício pessoal', (await ev(`return ${cartoes}.map(x=>x.dataset.catalogId)`)).includes('ex-mine-1'));
    await ev(`W.setWorkoutCatalogTab('favorites');${buscar('')}return 1`);
    check('2e. aba Favoritos continua funcionando (o favorito do grupo aparece uma vez)', JSON.stringify(await ev(`return ${cartoes}.map(x=>x.dataset.catalogId)`)) === '["ex-dup-1"]');
    await ev(`W.setWorkoutCatalogTab('app');${buscar('')}return 1`);
    check('2f. editor do exercício: caixa "Salvar também no catálogo"', await ev(`W.openWorkoutExerciseEditor?.call(W);const r=D.getElementById('workoutExerciseReusable');return !!r&&r.parentElement.textContent.includes('Salvar também no catálogo')`));
    await ev(`W.closeDialog('workoutExerciseDialog');return 1`); await sleep(300);

    // ---------- 3) Baixar catálogo (02) ----------
    res.push('# 3) Baixar catálogo de exercícios');
    await ev(PREPARAR_PONTE + `return 1`);
    await tocarEm(`D.getElementById('workoutCatalogDownload')`);
    const salvo = await ev(`return JSON.stringify({n: W.__salvos.length, nome: W.__salvos[0]?.nome, mime: W.__salvos[0]?.mime, toast: D.getElementById('toast').textContent})`).then(JSON.parse);
    const txt = salvo.n === 1 ? await ev(`return W.__salvos[0].b64`).then(decodificar) : '';
    check('3a. toque no botão: o aplicativo recebe UM arquivo, texto simples, com nome datado', salvo.n === 1 && salvo.mime === 'text/plain' && /^Catalogo-Exercicios-Agenda-Personal_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.txt$/.test(salvo.nome), JSON.stringify(salvo));
    check('3b. aviso ao professor depois de preparar', salvo.toast === 'Catálogo preparado. Aguarde a confirmação do Android.', salvo.toast);
    check('3c. o arquivo começa com BOM e o título, e acentos saem certos', txt.startsWith('﻿AGENDA PERSONAL — CATÁLOGO DE EXERCÍCIOS\n') && txt.includes('GRUPO MUSCULAR / REGIÃO: '), txt.slice(0, 60).replace(/\n/g, '⏎'));
    const totalItens = await ev(`return W.eval('workoutCatalogItems().length')`);
    const totalTxt = Number((txt.match(/^Total de exercícios: (\d+)$/m) || [])[1]);
    const exerciciosNoTxt = (txt.match(/^Exercício: /gm) || []).length;
    check('3d. "Total de exercícios" é o de itens do catálogo e cada um tem a sua linha', totalTxt === totalItens && exerciciosNoTxt === totalItens, `total ${totalTxt}, itens ${totalItens}, linhas ${exerciciosNoTxt}`);
    const blocoPessoal = txt.split('\nExercício: ').find(b => b.startsWith('Remada Unilateral Personalizada')) || '';
    check('3e. exercício pessoal: grupo, origem, "como fazer" e link do vídeo', /Origem: Adicionado ao catálogo/.test(blocoPessoal) && /Como fazer: Apoie o joelho no banco\./.test(blocoPessoal) && blocoPessoal.includes(VIDEO) && /GRUPO MUSCULAR \/ REGIÃO: Costas \(\d+\)/.test(txt), blocoPessoal.slice(0, 200).replace(/\n/g, '⏎'));
    const blocoEditado = txt.split('\nExercício: ').find(b => /ID: app-ex-002\n/.test(b)) || '';
    check('3f. exercício do app editado pelo professor: origem e campo alterado', /Origem: Exercício do app editado/.test(blocoEditado) && /Campos alterados: Observações/.test(blocoEditado), blocoEditado.slice(0, 260).replace(/\n/g, '⏎'));
    const blocoApp = txt.split('\nExercício: ').find(b => /ID: app-ex-001\n/.test(b)) || '';
    check('3g. exercício do app sem edição: "Exercício do app" e sem campos alterados', /Origem: Exercício do app\n/.test(blocoApp) && !/Campos alterados/.test(blocoApp), blocoApp.slice(0, 200).replace(/\n/g, '⏎'));
    check('3h. grupos em ordem alfabética (pt-BR), "Sem grupo muscular" por último', (() => { const g = [...txt.matchAll(/^GRUPO MUSCULAR \/ REGIÃO: (.+?) \(\d+\)$/gm)].map(m => m[1]); const sem = g.indexOf('Sem grupo muscular'); const resto = sem < 0 ? g : g.filter(x => x !== 'Sem grupo muscular'); return g.length > 3 && (sem < 0 || sem === g.length - 1) && JSON.stringify(resto) === JSON.stringify([...resto].sort(new Intl.Collator('pt-BR', {numeric: true, sensitivity: 'base'}).compare)); })());
    // sem a ponte do Android: download comum (Blob), e com a ponte falhando
    await ev(`W.Android = undefined;W.__blobs=[];W.__cliques=[];
      W.URL.createObjectURL = b => {W.__blobs.push(b);return 'blob:teste'};
      W.HTMLAnchorElement.prototype.click = function(){W.__cliques.push({download:this.download,href:this.href})};return 1`);
    await tocarEm(`D.getElementById('workoutCatalogDownload')`);
    const dl = JSON.parse(await ev(`return JSON.stringify({blobs: W.__blobs.length, cliques: W.__cliques, toast: D.getElementById('toast').textContent, tipo: W.__blobs[0]?.type})`));
    const corpoBlob = dl.blobs === 1 ? await ev(`return W.__blobs[0].text()`) : '';
    check('3i. sem a ponte do Android: download comum de um TXT, com o mesmo conteúdo', dl.blobs === 1 && dl.cliques.length === 1 && /^Catalogo-Exercicios-.*\.txt$/.test(dl.cliques[0].download) && /^text\/plain/.test(dl.tipo) && corpoBlob.includes('AGENDA PERSONAL — CATÁLOGO DE EXERCÍCIOS') && dl.toast === 'Download do catálogo iniciado.', JSON.stringify(dl));
    await ev(`W.Android = {saveBase64File(){return false}};return 1`);
    await tocarEm(`D.getElementById('workoutCatalogDownload')`);
    check('3j. se o Android não conseguir salvar: aviso de erro (e nenhum download)', await ev(`return D.getElementById('toast').textContent==='Não foi possível baixar o catálogo. Tente novamente.'&&W.__blobs.length===1`));

    // ---------- 5) o Catálogo como página, com a fileira de abas e o botão novos ----------
    res.push('# 4) Catálogo como página, abas e botão no escuro e no claro');
    await ev(`W.__salvarOk=true;W.Android={saveBase64File(){return true}};${buscar('')}return 1`);
    for (const modo of ['dark', 'light']) {
      await ev(`W.AgendaAppearance.setMode(${JSON.stringify(modo)});return 1`); await sleep(500);
      await ev(`D.querySelector('#workoutCatalogDialog>.sheet').scrollTop=0;return 1`); await sleep(200);
      const g = JSON.parse(await ev(`
        const dlg=D.getElementById('workoutCatalogDialog'),sh=dlg.querySelector(':scope>.sheet'),r=b=>{const x=b.getBoundingClientRect();return {l:Math.round(x.left),r:Math.round(x.right),t:Math.round(x.top),b:Math.round(x.bottom),w:Math.round(x.width),h:Math.round(x.height)}};
        const f=D.getElementById('workoutCatalogFavorites'),a=D.getElementById('workoutCatalogApp'),d=D.getElementById('workoutCatalogDownload');
        return JSON.stringify({sheet:r(sh),f:r(f),a:r(a),d:r(d),sw:sh.scrollWidth,cw:sh.clientWidth,dFit:d.scrollWidth<=d.clientWidth+1,aFit:a.scrollWidth<=a.clientWidth+1,fFit:f.scrollWidth<=f.clientWidth+1,
          cols:W.getComputedStyle(a.parentElement).gridTemplateColumns, bg:W.getComputedStyle(sh).backgroundColor, cor:W.getComputedStyle(d).color, fundoBtn:W.getComputedStyle(d).backgroundColor});`));
      check(`4a. (${modo}) o Catálogo continua uma página inteira, sem rolar de lado`, g.sheet.t === 0 && g.sheet.l === 0 && g.sheet.r === 390 && g.sheet.b === 844 && g.sw <= g.cw, JSON.stringify({sheet: g.sheet, sw: g.sw, cw: g.cw}));
      check(`4b. (${modo}) as 3 peças da fileira (Favoritos, Exercícios do app, Baixar catálogo) numa linha, dentro da tela`, [g.f, g.a, g.d].every(x => x.l >= 0 && x.r <= 390) && Math.abs(g.f.t - g.d.t) <= 2 && Math.abs(g.a.t - g.d.t) <= 2, JSON.stringify({f: g.f, a: g.a, d: g.d, cols: g.cols}));
      check(`4c. (${modo}) os textos cabem nos botões (sem cortar) e o toque tem pelo menos 44 px de altura`, g.dFit && g.aFit && g.fFit && g.d.h >= 44 && g.a.h >= 44 && g.f.h >= 44, JSON.stringify({dFit: g.dFit, aFit: g.aFit, fFit: g.fFit, h: [g.f.h, g.a.h, g.d.h]}));
      await ev(`D.getElementById('toast').classList.remove('show');return 1`); await sleep(350); // o aviso do passo 3j ainda estava na tela: fora do enquadramento
      await c.shot(SAIDA + '/catalogo-abas-' + modo + '.png');
    }
    await ev(`W.AgendaAppearance.setMode('dark');return 1`); await sleep(400);

    // ---------- 4) Duplicatas e exclusão (03) ----------
    res.push('# 5) Duplicatas e exclusão no catálogo');
    const antes = {};
    for (const k of ['workoutPlans', 'history', 'students', 'lessons', 'workoutExecutions', 'payments', 'exerciseCatalog', 'exerciseCatalogOverrides', 'exerciseFavorites']) antes[k] = await estadoDe(k);
    const videoDaFicha = `W.workoutExerciseVideoUrl(W.eval('state.workoutPlans[0].days[1].exercises[2]'))`;
    check('5-pre. o exercício da ficha da Mariana (ligado ao pessoal, sem vídeo próprio) enxerga o vídeo do catálogo', (await ev(`return ${videoDaFicha}||''`)).includes('aqz-KE-bpKQ'), await ev(`return String(${videoDaFicha})`));
    await ev(buscar('Supino reto com barra'));
    let ids = JSON.parse(await ev(`return JSON.stringify(${cartoes}.map(x=>[x.querySelector('h4').textContent,x.dataset.catalogId]))`));
    check('5a. exercício do app + pessoal com o mesmo nome: UM cartão só ("Supino reto com barra")', ids.filter(([n]) => n === 'Supino reto com barra').length === 1, JSON.stringify(ids));
    await ev(buscar('Elevação lateral no cabo'));
    ids = JSON.parse(await ev(`return JSON.stringify(${cartoes}.map(x=>[x.querySelector('h4').textContent,x.dataset.catalogId]))`));
    check('5b. dois pessoais iguais entre si: um cartão só ("Elevação lateral no cabo")', ids.filter(([n]) => n === 'Elevação lateral no cabo').length === 1, JSON.stringify(ids));
    check('5c. todo cartão tem "Excluir do catálogo"', await ev(`const c=${cartoes};return c.length>0&&c.every(x=>[...x.querySelectorAll('.workout-actions button.danger')].filter(b=>b.textContent==='Excluir do catálogo').length===1)`));
    // favorito do grupo
    await ev(buscar('Supino reto com barra'));
    const estrela = () => ev(`const c=${cartoes}.find(x=>x.querySelector('h4').textContent==='Supino reto com barra');const s=c.querySelector('.workout-star');return JSON.stringify({texto:s.textContent,pressed:s.getAttribute('aria-pressed'),fav:W.eval('state.exerciseFavorites')})`).then(JSON.parse);
    let e0 = await estrela();
    check('5d. o cartão do grupo aparece como favorito (o favorito é de um dos cadastros equivalentes)', e0.pressed === 'true' && e0.texto === '★', JSON.stringify(e0));
    await tocarEm(`${cartoes}.find(x=>x.querySelector('h4').textContent==='Supino reto com barra').querySelector('.workout-star')`);
    e0 = await estrela();
    check('5e. tocar na estrela desmarca o grupo todo', e0.pressed === 'false' && e0.fav.length === 0, JSON.stringify(e0));
    await tocarEm(`${cartoes}.find(x=>x.querySelector('h4').textContent==='Supino reto com barra').querySelector('.workout-star')`);
    e0 = await estrela();
    check('5f. tocar de novo marca um só cadastro (o do cartão)', e0.pressed === 'true' && e0.fav.length === 1, JSON.stringify(e0));
    // cancelar
    await ev(`W.__resposta=false;W.__confirmacoes=[];return 1`);
    await tocarEm(`${cartoes}.find(x=>x.querySelector('h4').textContent==='Supino reto com barra').querySelector('button.danger')`);
    const cancel = JSON.parse(await ev(`return JSON.stringify({conf:W.__confirmacoes, cat:W.eval('state.exerciseCatalog'), ov:W.eval('state.exerciseCatalogOverrides'), nomes:${cartoes}.map(x=>x.querySelector('h4').textContent)})`));
    check('5g. cancelar a pergunta: nada é excluído', cancel.conf.length === 1 && JSON.stringify(cancel.cat) === JSON.stringify(antes.exerciseCatalog) && JSON.stringify(cancel.ov) === JSON.stringify(antes.exerciseCatalogOverrides) && cancel.nomes.includes('Supino reto com barra'), JSON.stringify(cancel).slice(0, 300));
    // confirmar
    await ev(`W.__resposta=true;W.__confirmacoes=[];return 1`);
    await tocarEm(`${cartoes}.find(x=>x.querySelector('h4').textContent==='Supino reto com barra').querySelector('button.danger')`);
    const apos = JSON.parse(await ev(`return JSON.stringify({conf:W.__confirmacoes, toast:D.getElementById('toast').textContent, nomes:${cartoes}.map(x=>x.querySelector('h4').textContent), cat:W.eval('state.exerciseCatalog'), ov:W.eval('state.exerciseCatalogOverrides'), fav:W.eval('state.exerciseFavorites'), itens:W.eval('workoutCatalogItems().map(i=>i.id)')})`));
    check('5h. a pergunta nomeia o exercício, avisa dos equivalentes e diz que fichas e histórico ficam', apos.conf.length === 1 && apos.conf[0] === 'Excluir “Supino reto com barra” do catálogo? Os 2 cadastros equivalentes serão ocultados. As fichas e o histórico serão preservados.', apos.conf[0]);
    check('5i. confirmado: o cartão some (os outros exercícios da busca ficam) e o aviso aparece', !apos.nomes.includes('Supino reto com barra') && apos.nomes.includes('Supino Reto com Barra Reta') && apos.toast === 'Exercício removido do catálogo.', JSON.stringify({nomes: apos.nomes, toast: apos.toast}));
    const removidoPessoal = apos.cat.find(i => i.id === 'ex-dup-1');
    check('5j. é exclusão "suave": o pessoal continua guardado, só marcado como removido; o do app vira marca de removido', !!removidoPessoal && removidoPessoal.catalogRemoved === true && apos.cat.length === antes.exerciseCatalog.length && apos.ov['app-ex-001']?.catalogRemoved === true, JSON.stringify({pessoal: removidoPessoal && removidoPessoal.catalogRemoved, n: apos.cat.length, app: apos.ov['app-ex-001']}));
    check('5k. o favorito do exercício excluído sai dos favoritos e não some o dos outros', !apos.fav.includes('ex-dup-1') && !apos.fav.includes('app-ex-001'), JSON.stringify(apos.fav));
    check('5l. o exercício excluído não aparece mais na lista do catálogo', !apos.itens.includes('ex-dup-1') && !apos.itens.includes('app-ex-001'));
    const depois = {};
    for (const k of ['workoutPlans', 'history', 'students', 'lessons', 'workoutExecutions', 'payments']) depois[k] = await estadoDe(k);
    check('5m. alunos, aulas, fichas, histórico, execuções e pagamentos ficam exatamente como estavam', Object.keys(depois).every(k => JSON.stringify(depois[k]) === JSON.stringify(antes[k])), Object.keys(depois).filter(k => JSON.stringify(depois[k]) !== JSON.stringify(antes[k])).join(','));
    // outro exercício do mesmo grupo de duplicatas pessoais
    await ev(buscar('Elevação lateral no cabo') + `W.__confirmacoes=[];return 1`);
    await tocarEm(`${cartoes}.find(x=>x.querySelector('h4').textContent==='Elevação lateral no cabo').querySelector('button.danger')`);
    const par = JSON.parse(await ev(`return JSON.stringify({conf:W.__confirmacoes[0], cat:W.eval('state.exerciseCatalog').filter(i=>/^ex-dup-[23]$/.test(i.id)).map(i=>[i.id,i.catalogRemoved===true]), cards:${cartoes}.length})`));
    check('5n. excluir o grupo de dois pessoais iguais oculta os dois', par.cards === 0 && JSON.stringify(par.cat) === '[["ex-dup-2",true],["ex-dup-3",true]]' && /Os 2 cadastros equivalentes serão ocultados\./.test(par.conf), JSON.stringify(par));
    // exportar de novo: os excluídos não entram
    await ev(`W.__salvos=[];W.Android={saveBase64File(n,m,b){W.__salvos.push({n,m,b});return true}};return 1`);
    await tocarEm(`D.getElementById('workoutCatalogDownload')`);
    const txt2 = await ev(`return W.__salvos[0]?.b||''`).then(decodificar);
    check('5o. o TXT depois de excluir não traz os excluídos e o total diminui', !/ID: (ex-dup-[123]|app-ex-001)\n/.test(txt2) && Number((txt2.match(/^Total de exercícios: (\d+)$/m) || [])[1]) === totalItens - 4 && txt2.includes('Remada Unilateral Personalizada'), 'total ' + (txt2.match(/^Total de exercícios: (\d+)$/m) || [])[1] + ' (antes ' + totalItens + ')');
    // pelo editor
    await ev(`W.closeDialog('workoutCatalogDialog');return 1`); await sleep(300);
    await ev(`W.openWorkoutCatalog();${buscar('Remada Unilateral')}W.openCatalogExerciseEditor('ex-mine-1');W.__confirmacoes=[];return 1`); await sleep(600);
    check('5p. editor do exercício do catálogo: botão "Apagar exercício" visível', await ev(`const b=D.getElementById('workoutCatalogDelete');return !b.hidden&&W.getComputedStyle(b).display!=='none'&&D.getElementById('workoutExerciseDialog').classList.contains('open')`));
    await tocarEm(`D.getElementById('workoutCatalogDelete')`);
    const ed = JSON.parse(await ev(`return JSON.stringify({conf:W.__confirmacoes, aberto:D.getElementById('workoutExerciseDialog').classList.contains('open'), removido:W.eval('state.exerciseCatalog').find(i=>i.id==='ex-mine-1').catalogRemoved===true, n:W.eval('state.exerciseCatalog.length'), toast:D.getElementById('toast').textContent})`));
    check('5q. "Apagar exercício" do editor usa a exclusão nova: uma pergunta só, janela do editor fecha, exercício marcado como removido', ed.conf.length === 1 && ed.conf[0] === 'Excluir “Remada Unilateral Personalizada” do catálogo? As fichas e o histórico serão preservados.' && !ed.aberto && ed.removido && ed.n === antes.exerciseCatalog.length && ed.toast === 'Exercício removido do catálogo.', JSON.stringify(ed));
    check('5r. o exercício da ficha continua ligado ao exercício excluído e ainda enxerga o vídeo dele (a ficha não muda)', (await ev(`return ${videoDaFicha}||''`)).includes('aqz-KE-bpKQ') && (await estadoDe('workoutPlans')).length === 1 && JSON.stringify(await estadoDe('workoutPlans')) === JSON.stringify(antes.workoutPlans));
    check('5s. nenhuma entrada nova no histórico do aplicativo e dados do aluno intactos depois das três exclusões', JSON.stringify(await estadoDe('history')) === JSON.stringify(antes.history) && JSON.stringify(await estadoDe('students')) === JSON.stringify(antes.students));
    // persistência: reabrir
    await c.navigate(url); await esperar(c);
    await ev(`W.openWorkoutCatalog();${buscar('Supino reto com barra')}return 1`); await sleep(500);
    const reab = JSON.parse(await ev(`return JSON.stringify({cards:${cartoes}.map(x=>x.querySelector('h4').textContent), cat:W.eval('state.exerciseCatalog.filter(i=>i.catalogRemoved===true).map(i=>i.id)'), ov:Object.keys(W.eval('state.exerciseCatalogOverrides')).filter(k=>W.eval('state.exerciseCatalogOverrides')[k].catalogRemoved)})`));
    check('5t. depois de fechar e abrir a página, as exclusões continuam (nada volta sozinho)', !reab.cards.includes('Supino reto com barra') && reab.cat.sort().join() === 'ex-dup-1,ex-dup-2,ex-dup-3,ex-mine-1' && reab.ov.join() === 'app-ex-001', JSON.stringify(reab));
    check('5u. e a ficha da aluna segue igual depois de reabrir', JSON.stringify(await estadoDe('workoutPlans')) === JSON.stringify(antes.workoutPlans));
    check('5v. nenhum erro de página em todo o percurso', c.logs.filter(l => /ERRO-PAGINA/.test(l)).length === 0, JSON.stringify(c.logs.filter(l => /ERRO-PAGINA/.test(l)).slice(0, 2)));
  } finally { c.close(); }

  // ---------- 6) contraste: a mesma pergunta na página SEM a 03 ----------
  res.push('# 6) contraste com a página sem a correção 03 (1.12.288 + 01 + 02)');
  const sem = await abrir(SEM03);
  try {
    await sem.ev(`W.openWorkoutCatalog();${buscar('Supino reto com barra')}return 1`); await sleep(500);
    const nomes = JSON.parse(await sem.ev(`return JSON.stringify(${cartoes}.map(x=>x.querySelector('h4').textContent))`));
    check('6a. sem a 03 o mesmo exercício aparece em DOIS cartões (a 03 é que junta)', nomes.filter(n => n === 'Supino reto com barra').length === 2, JSON.stringify(nomes));
    check('6b. sem a 03 o 01 e o 02 já funcionam (abas unificadas e botão de baixar)', await sem.ev(`return D.getElementById('workoutCatalogMine').hidden&&!!D.getElementById('workoutCatalogDownload')`));
  } finally { sem.c.close(); }

  console.log(res.join('\n'));
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\ntodos os cenários passaram');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.log('FALHA', e.message, e.stack); process.exit(1); });
