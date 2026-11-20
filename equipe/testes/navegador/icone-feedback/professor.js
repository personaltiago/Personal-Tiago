'use strict';
// Confere no Chrome real que a tela do PROFESSOR não muda com o ícone do feedback do aluno (1.12.293).
// Por quê: o estilo do feedback (ap-feedback-css) é um componente compartilhado entre o aluno e o professor (UpdateAreaPatch.SHARED): o
// aplicativo só aceita a correção se o aluno e o professor receberem o MESMO texto. Então o professor.html do pacote ganha as mesmas
// regras novas do ícone. Todas começam por .student-home, #profileScreen, #apFeedbackIcon... ou .ap-fbicon-..., que não existem na página
// do professor (o professor.html não tem a tela "Meu perfil" do aluno nem o botão do topo do aluno). O script novo NÃO entra no professor.
// O que se confere, abrindo o professor.html do 1.12.292 e o do 1.12.293 lado a lado, com o mesmo estado de exemplo:
//   1) o estilo do feedback do 293 = o do 292 + regras novas (nenhuma regra antiga muda ou some; o número de regras novas vem do gerador);
//   2) nenhuma regra nova casa com elemento algum da página do professor (nem com a janela de feedback aberta);
//   3) a página é a mesma: mesma lista de elementos e, em cada elemento, o mesmo estilo calculado completo e o mesmo retângulo;
//   4) nenhum elemento do botão do aluno nem da linha/painel do ícone existe e a página não dá erro de JavaScript;
//   5) controles do resumo: duas aberturas da MESMA página (292) dão o mesmo resumo (senão a igualdade 292 x 293 não valeria) e uma mudança
//      de 1 px na margem da barra de topo muda o resumo (se não mudasse, a igualdade não provaria nada).
// uso: node professor.js [professor-292.html] [professor-293.html]     (variáveis: PORTA, SAIDA, como nos outros testes desta pasta)
// A pasta servida precisa ter as duas páginas e o dialogo.html (casca do iframe) do teste das janelas: veja preparar.cjs.
const {launch, sleep, BASE} = require('../janelas-pagina/cdp.js');
const {estado} = require('../janelas-pagina/semente.js');
const ANTES = process.argv[2] || 'professor-292.html', DEPOIS = process.argv[3] || 'professor-293.html';
const NOVAS = (require('../../../../tools/gerar-icone-feedback-1.12.293.cjs').CSS_ICON.match(/\}/g) || []).length; // regras que o gerador acrescenta
const DB = 'agendaPersonalTL_v1';

let ok = 0, bad = 0;
const t = (descricao, condicao, detalhe) => {
  if (condicao) { ok++; console.log('OK   ' + descricao); return; }
  bad++; console.log('FALHA ' + descricao + (detalhe !== undefined ? ' -> ' + (typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe)) : ''));
};

async function esperar(c) {
  for (let i = 0; i < 120; i++) {
    let pronto = false;
    try { pronto = await c.evaluate("(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('workoutCatalogDialog')&&W.APFeedbackTeacher)}catch(e){return false}})()"); } catch (e) {}
    if (pronto) break;
    await sleep(250);
  }
  await sleep(2200);
}

// Resumo da página do professor, calculado dentro do iframe: o estilo do feedback, os elementos do sino e uma impressão digital por elemento
// (assinatura, todos os estilos calculados, retângulo). Devolve também a lista das regras e, para cada regra, quantos elementos ela alcança.
const RESUMO = `(()=>{
  const W=document.getElementById('app').contentWindow, D=W.document;
  const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h>>>0};
  const els=[...D.querySelectorAll('*')];
  const assinatura=els.map(e=>e.tagName+'#'+e.id+'.'+(typeof e.className==='string'?e.className:''));
  const pintura=els.map(e=>{
    const cs=W.getComputedStyle(e), lista=[];
    for(let i=0;i<cs.length;i++){const p=cs[i];lista.push(p+':'+cs.getPropertyValue(p))}
    lista.sort(); // a ordem em que o Chrome lista as propriedades (as variáveis CSS, principalmente) muda de uma abertura para outra
    const r=e.getBoundingClientRect();
    return fnv(lista.join(';')+'@'+[r.left,r.top,r.width,r.height].map(v=>Math.round(v*10)/10).join(','));
  });
  const st=D.getElementById('ap-feedback-css');
  const regras=st&&st.sheet?[...st.sheet.cssRules].map(r=>({texto:r.cssText,seletor:r.selectorText||''})):null;
  const alcance=regras?regras.map(r=>{let n=-1;if(r.seletor){try{n=D.querySelectorAll(r.seletor).length}catch(e){n=-2}}return n}):null;
  return JSON.stringify({elementos:els.length,assinatura:fnv(assinatura.join('|')),pintura:fnv(pintura.join(',')),pinturaLista:pintura,assinaturaLista:assinatura,
    sino:D.querySelectorAll('.ap-feedback-bell,#apFeedbackBell,#apFeedbackBellCount,.ap-feedback-bell-on,#apFeedbackIconOpen,#apFeedbackIconPanel,#apFeedbackIconStatus,#apFeedbackIconTitle,.ap-fbicon-open,.ap-fbicon-now,.ap-fbicon-panel,.ap-fbicon-grid,.ap-fbicon-opt,.ap-fbicon-face,.ap-fbicon-status').length,
    estilo:st?st.textContent.length:-1,regras,alcance,
    jans:[...D.querySelectorAll('dialog[open]')].map(d=>d.id)});
})()`;

async function abrirPagina(pagina) {
  const c = await launch({w: 390, h: 844, dpr: 2});
  const url = BASE + '/dialogo.html?app=' + pagina;
  await c.navigate(url); await sleep(300);
  await c.evaluate(`localStorage.setItem(${JSON.stringify(DB)}, ${JSON.stringify(JSON.stringify(estado()))});`);
  await c.navigate(url);
  await esperar(c);
  return c;
}
const resumo = async c => JSON.parse(await c.evaluate(RESUMO));

// Primeira diferença entre duas listas de impressões digitais (índice e assinatura do elemento).
function primeiraDiferenca(a, b) {
  const n = Math.min(a.pinturaLista.length, b.pinturaLista.length);
  for (let i = 0; i < n; i++) if (a.pinturaLista[i] !== b.pinturaLista[i]) return {indice: i, elemento: a.assinaturaLista[i]};
  return null;
}

(async () => {
  const dois = {};
  for (const [rotulo, pagina] of [['antes', ANTES], ['antes2', ANTES], ['depois', DEPOIS]]) {
    const c = await abrirPagina(pagina);
    const parado = await resumo(c);
    // janela de feedback do professor aberta (é a que usa o estilo compartilhado)
    const abriu = await c.evaluate("(()=>{try{const W=document.getElementById('app').contentWindow;W.APFeedbackTeacher.open();return W.document.getElementById('apFeedbackTeacher').open===true}catch(e){return 'erro: '+e.message}})()");
    await sleep(900);
    const aberto = await resumo(c);
    await c.evaluate("(()=>{try{const D=document.getElementById('app').contentWindow.document;const d=D.getElementById('apFeedbackTeacher');if(d&&d.open)d.close()}catch(e){}})()");
    const erros = c.logs.filter(l => l.startsWith('ERRO-PAGINA'));
    // controle: um desvio de 1 px num elemento qualquer muda o resumo?
    let controle = null;
    if (rotulo === 'depois') {
      await c.evaluate("(()=>{const D=document.getElementById('app').contentWindow.document;const s=D.createElement('style');s.id='controle-1px';s.textContent='.topbar{margin-left:1px!important}';D.head.appendChild(s)})()");
      const mudado = await resumo(c);
      controle = {mudou: mudado.pintura !== parado.pintura, antes: parado.pintura, depois: mudado.pintura};
    }
    dois[rotulo] = {parado, abriu, aberto, erros, controle};
    c.close();
  }
  const A = dois.antes, B = dois.depois, A2 = dois.antes2;

  // 1) o estilo do feedback: o do 293 é o do 292 mais regras novas
  const ra = A.parado.regras.map(r => r.texto), rb = B.parado.regras.map(r => r.texto);
  t('1  o estilo do feedback (ap-feedback-css) existe nas duas páginas', A.parado.regras && B.parado.regras, [A.parado.estilo, B.parado.estilo]);
  const prefixo = rb.slice(0, ra.length).every((x, i) => x === ra[i]);
  t('1  todas as regras do 292 continuam, na mesma ordem e com o mesmo texto', prefixo, {regras292: ra.length, regras293: rb.length});
  const novas = rb.slice(ra.length);
  t('1  o 293 acrescenta ' + NOVAS + ' regras novas no fim (as do gerador)', NOVAS >= 20 && novas.length === NOVAS, [novas.length, NOVAS]);
  // 2) nenhuma regra nova casa com elemento algum (parado e com a janela de feedback aberta)
  const alcanceNovas = B.parado.alcance.slice(ra.length), alcanceAberto = B.aberto.alcance.slice(ra.length);
  t('2  nenhuma regra nova alcança elemento algum da página do professor (parada)', alcanceNovas.length === NOVAS && alcanceNovas.every(n => n === 0), alcanceNovas);
  t('2  nem com a janela de feedback do professor aberta', alcanceAberto.length === NOVAS && alcanceAberto.every(n => n === 0), alcanceAberto);
  t('2  as regras que o 292 já tinha alcançam o mesmo número de elementos nas duas versões', JSON.stringify(A.parado.alcance) === JSON.stringify(B.parado.alcance.slice(0, ra.length)), [A.parado.alcance, B.parado.alcance.slice(0, ra.length)]);
  // 3) a página é a mesma
  t('3  mesma quantidade de elementos (parada)', A.parado.elementos === B.parado.elementos && A.parado.elementos > 1000, [A.parado.elementos, B.parado.elementos]);
  t('3  mesma lista de elementos, na mesma ordem (parada)', A.parado.assinatura === B.parado.assinatura);
  t('3  mesmo estilo calculado completo e mesmo retângulo em todos os ' + A.parado.elementos + ' elementos (parada)', A.parado.pintura === B.parado.pintura, primeiraDiferenca(A.parado, B.parado));
  t('3  a janela de feedback do professor abre nas duas versões', A.abriu === true && B.abriu === true, [A.abriu, B.abriu]);
  t('3  mesma lista de elementos com a janela de feedback aberta', A.aberto.assinatura === B.aberto.assinatura && A.aberto.elementos === B.aberto.elementos, [A.aberto.elementos, B.aberto.elementos]);
  t('3  mesmo estilo calculado completo e mesmo retângulo com a janela de feedback aberta', A.aberto.pintura === B.aberto.pintura, primeiraDiferenca(A.aberto, B.aberto));
  t('3  a janela aberta é a mesma nas duas versões', JSON.stringify(A.aberto.jans) === JSON.stringify(B.aberto.jans), [A.aberto.jans, B.aberto.jans]);
  // 4) sem sino e sem erro
  t('4  nenhum elemento do botão do aluno nem da linha/painel do ícone existe na página do professor (292 e 293, parada e com a janela aberta)',
    A.parado.sino === 0 && B.parado.sino === 0 && A.aberto.sino === 0 && B.aberto.sino === 0, [A.parado.sino, B.parado.sino, A.aberto.sino, B.aberto.sino]);
  t('4  nenhum erro de JavaScript em nenhuma das duas páginas', A.erros.length === 0 && B.erros.length === 0, [A.erros, B.erros]);
  // 5) controles do resumo
  t('5  controle: duas aberturas do 292 dão exatamente o mesmo resumo (parada e com a janela aberta)', A.parado.pintura === A2.parado.pintura && A.aberto.pintura === A2.aberto.pintura,
    [primeiraDiferenca(A.parado, A2.parado), primeiraDiferenca(A.aberto, A2.aberto)]);
  t('5  controle: o resumo percebe uma mudança de 1 px na margem da barra de topo', B.controle && B.controle.mudou === true, B.controle);

  console.log('\nÍcone do feedback · tela do professor: ' + ok + ' ok, ' + bad + ' com falha');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE', e); process.exit(2); });
