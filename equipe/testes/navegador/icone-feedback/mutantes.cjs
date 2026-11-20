'use strict';
// "Teste do teste" do ícone do feedback (1.12.294) no Chrome real: estraga a página do 294 de vários jeitos, um de cada vez, e roda o teste
// funcional (funcional.js, com PARAR=1) em cada uma. Cada defeito precisa ser PEGO (o teste falha); se algum passar, o teste não protege
// aquele comportamento. A página sem defeito passa em todos os itens (rode funcional.js nela para ver).
// Defeito equivalente (de propósito fora da lista): tirar `panel&&(panel.hidden=!0);` do tratador de ap-account-changed. A página continua
// igual, porque feedbackIconSync() (chamado logo em seguida por feedbackIconRow) já fecha o painel quando não há aluno logado.
// Variáveis: SO=nome1,nome2 roda só esses defeitos; PARALELO=2 (padrão) quantos rodam ao mesmo tempo (cada um abre dois Chromes).
// uso: PORTA=8790 node mutantes.cjs <pasta-servida> [index-294.html] [index-292.html]
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), vm = require('node:vm');
const {spawn} = require('node:child_process');

const [, , pasta, nova = 'index-294.html', antiga = 'index-292.html'] = process.argv;
if (!pasta) { console.error('uso: node mutantes.cjs <pasta-servida> [index-294.html] [index-292.html]'); process.exit(2); }

const manifesto = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'tools', 'icones-feedback-294', 'icones.json'), 'utf8')).icones;
const D = id => '"d":"' + manifesto.find(i => i.id === id).d + '"';

// [nome, o que o defeito faz, texto original (precisa existir UMA vez na página), texto defeituoso]
const MUTANTES = [
  // --- comportamento (script)
  ['sem-rosto', 'o botão do topo nunca recebe o desenho do ícone', 'if(!show)return;feedbackBellFace(bell);', 'if(!show)return;'],
  ['padrao-errado', 'sem escolha, o padrão passa a ser o segundo ícone', '||FB_ICONS[0]}', '||FB_ICONS[1]}'],
  ['padrao-diferente-do-292', 'o padrão deixa de ser o balão do 292 (o caminho muda um pouco)', '"d":"M5.5 3h13A3.5 3.5 0 0 1 22 6.5', '"d":"M5.5 3h13A3.5 3.5 0 0 1 22 6.9'],
  ['chave-sem-conta', 'a chave não começa por agenda_demo_ (a escolha vira do aparelho, não da conta)', 'FB_ICON_KEY="agenda_demo_feedback_icon"', 'FB_ICON_KEY="feedback_icon"'],
  ['le-sem-conta', 'a escolha é lida do localStorage direto, sem a separação por conta', 'id=String(APstudentStorage.getItem(FB_ICON_KEY)||"")', 'id=String(localStorage.getItem(FB_ICON_KEY)||"")'],
  ['linha-no-fim', 'a linha vai para o fim da lista, não logo depois de Configurações', 'settings?settings.after(open,panel):list.append(open,panel)', 'list.append(open,panel)'],
  ['sem-envoltorio', 'o Perfil redesenhado não recria a linha', 'if("function"==typeof profileRender){', 'if(!1){'],
  ['linha-sempre-visivel', 'a linha aparece mesmo sem aluno logado', 'open.hidden=!show;', 'open.hidden=!1;'],
  ['falha-silenciosa', 'disco cheio: acha que gravou e não avisa', 'catch(_){saved=!1}', 'catch(_){saved=!0}'],
  ['grupo-errado', 'os rádios não pertencem ao grupo certo (o tratador ignora a escolha)', 'type="radio" name="apFeedbackIcon" value=', 'type="radio" name="apFeedbackIconX" value='],
  ['sem-evento', 'escolher um ícone não avisa a página (evento ap-feedback-icon-changed)', 'dispatchEvent(new CustomEvent("ap-feedback-icon-changed",{detail:{id:icon.id}}))', '0'],
  ['sem-atualizar-botao', 'escolher um ícone grava mas não atualiza o botão do topo', 'feedbackBell(t.pending().length);dispatchEvent', 'dispatchEvent'],
  ['sem-foco-no-painel', 'o painel aberto não recebe o foco', 'panel.focus({preventScroll:!0});', ''],
  ['status-sem-nome', 'o status não diz qual ícone está escolhido', 'text="Escolhido: "+icon.name', 'text="Escolhido"'],
  ['movimento-ignorado', 'a rolagem é sempre suave, mesmo com "reduzir movimento"', 'matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"', '"smooth"'],
  // --- COR: o desenho tem de seguir a cor de destaque (o erro do 1.12.293 era justamente este)
  ['cor-fixa-topo', 'o desenho do botão do topo é pintado de roxo fixo, não da cor do aplicativo', 'path.setAttribute("d",icon.d))}', 'path.setAttribute("d",icon.d),path.setAttribute("fill","#8f35df"))}'],
  ['cor-fixa-linha', 'o ícone da linha de Meu perfil é roxo fixo', '#profileScreen .ap-fbicon-now{flex:none;display:block;width:27px;height:27px;color:var(--prof-accent)}', '#profileScreen .ap-fbicon-now{flex:none;display:block;width:27px;height:27px;color:#8f35df}'],
  ['cor-fixa-grade', 'os desenhos da grade de escolha são roxos fixos', '.ap-fbicon-opt{position:relative;display:block;width:52px;height:52px;border-radius:12px;color:var(--prof-accent)', '.ap-fbicon-opt{position:relative;display:block;width:52px;height:52px;border-radius:12px;color:#8f35df'],
  ['grade-branca', 'os desenhos da grade são brancos, não da cor de destaque', '.ap-fbicon-face svg{position:relative;z-index:1;display:block;width:28px;height:28px;fill:currentColor;stroke:none', '.ap-fbicon-face svg{position:relative;z-index:1;display:block;width:28px;height:28px;fill:#fff;stroke:none'],
  // --- TAMANHO: o desenho tem de ter o tamanho do balão do 292 entre o WhatsApp e o sino
  ['topo-grande', 'o desenho do botão do topo passa de 27 px para 34 px (maior que o sino)', '.student-home .ap-feedback-bell svg{width:27px;height:27px;fill:currentColor;stroke:none}', '.student-home .ap-feedback-bell svg{width:34px;height:34px;fill:currentColor;stroke:none}'],
  // Nestes dois o desenho muda na página E no manifesto (5º item), para o teste de tamanho e de cobertura ser quem pega, não a comparação com o manifesto.
  ['desenho-miudo', 'um dos ícones volta a ser pequeno (as três carinhas em fila, 6 de altura, como no primeiro desenho)', D('tres-carinhas'), '"d":"M3 10.5h4v3H3zM10 10.5h4v3h-4zM17 10.5h4v3h-4z"', {id: 'tres-carinhas', d: 'M3 10.5h4v3H3zM10 10.5h4v3h-4zM17 10.5h4v3h-4z'}],
  ['sob-o-numero', 'um dos ícones concentra o desenho no canto onde fica o número de pendentes', D('megafone'), '"d":"M2 14h8v7H2zM12 3h10v10H12z"', {id: 'megafone', d: 'M2 14h8v7H2zM12 3h10v10H12z'}],
  ['desenho-vazio', 'um dos ícones fica leve demais (uma linha fina no meio do botão)', D('aspas'), '"d":"M3 11h18v2H3z"', {id: 'aspas', d: 'M3 11h18v2H3z'}],
  ['desenho-descentrado', 'um dos ícones tem o tamanho certo mas fica deslocado 1,5 unidade para a direita e para baixo', D('coracao'), '"d":"M4.5 5.7h18v10h-18zM4.5 17.7h18v4h-18z"', {id: 'coracao', d: 'M4.5 5.7h18v10h-18zM4.5 17.7h18v4h-18z'}],
  ['grade-miuda', 'os alvos de toque da grade ficam com 36 px', '.ap-fbicon-opt{position:relative;display:block;width:52px;height:52px', '.ap-fbicon-opt{position:relative;display:block;width:36px;height:36px'],
  // --- forma e legibilidade
  ['sem-evenodd', 'os furos dos desenhos da grade enchem (sem a regra evenodd)', '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="\'+n(x.d)', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="\'+n(x.d)'],
  ['css-sem-oculto', 'linha e painel escondidos (hidden) continuam aparecendo', '#apFeedbackIconOpen[hidden],#apFeedbackIconPanel[hidden]{display:none!important}', ''],
  ['css-sem-marca', 'o ícone escolhido perde a marca de visto', '.ap-fbicon-opt input:checked+.ap-fbicon-face::after{content:"";', '.ap-fbicon-opt input:checked+.ap-fbicon-face::after{content:none;'],
  ['css-marca-grande', 'a marca de visto passa de 18 px para 24 px', 'top:-6px;right:-6px;width:18px;height:18px', 'top:-6px;right:-6px;width:24px;height:24px'],
  ['css-texto-apagado', 'a descrição do painel fica com contraste baixo no escuro', '.ap-fbicon-panel p{margin:0;font-size:12px;line-height:1.35;color:#c2ccd7}', '.ap-fbicon-panel p{margin:0;font-size:12px;line-height:1.35;color:#4a5560}'],
  ['marcado-tingido', 'o fundo do ícone marcado fica com 40 % da cor de destaque (o desenho perde contraste, em especial no roxo)', 'border-radius:inherit;background:currentColor;opacity:.1}', 'border-radius:inherit;background:currentColor;opacity:.4}'],
  ['tile-claro-no-claro', 'no modo claro os quadradinhos voltam a ser claros (amarelo, laranja, verde e ciano quase somem)', '#profileScreen.profile-light .ap-fbicon-opt input:focus-visible+.ap-fbicon-face{outline-color:#1e3040}', '#profileScreen.profile-light .ap-fbicon-face{border-color:#c4d1db;background:#f3f7fa}'],
  ['foco-claro-apagado', 'no modo claro o contorno do foco volta a ser da cor de destaque (some com o amarelo)', '#profileScreen.profile-light .ap-fbicon-opt input:focus-visible+.ap-fbicon-face{outline-color:#1e3040}', '']
];

const html = fs.readFileSync(path.join(pasta, nova), 'utf8');
const conta = (texto, trecho) => texto.split(trecho).length - 1;
const bloco = (texto, id) => { const a = texto.indexOf('<script id="' + id + '">'); return texto.slice(a + id.length + 14, texto.indexOf('</script>', a)); };

const so = process.env.SO ? process.env.SO.split(',') : null;
if (so && so.some(n => !MUTANTES.some(m => m[0] === n))) { console.error('SO tem nome que não existe: ' + so.join(',')); process.exit(2); }
const lista = so ? MUTANTES.filter(m => so.includes(m[0])) : MUTANTES;
const nomes = new Set(MUTANTES.map(m => m[0]));
if (nomes.size !== MUTANTES.length) { console.error('Há dois defeitos com o mesmo nome'); process.exit(2); }

for (const [nome, , original, estragado] of lista) {
  if (conta(html, original) !== 1) { console.error('O trecho do defeito "' + nome + '" aparece ' + conta(html, original) + ' vez(es) na página (precisa ser 1)'); process.exit(2); }
  if (original === estragado) { console.error('O defeito "' + nome + '" não muda nada'); process.exit(2); }
  new vm.Script(bloco(html.replace(original, () => estragado), 'ap-feedback-student')); // o defeito não pode ser erro de sintaxe: tem que mudar o comportamento, não derrubar o bloco
}

const saidaBase = path.resolve(process.env.SAIDA || 'saida');
function rodar([nome, defeito, original, estragado, manifestoMudado]) {
  const arquivo = 'mutante-' + nome + '.html';
  fs.writeFileSync(path.join(pasta, arquivo), html.replace(original, () => estragado));
  const args = [path.join(__dirname, 'funcional.js'), arquivo, antiga];
  let tmp = null;
  if (manifestoMudado) {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mutante-icones-'));
    const todos = manifesto.map(i => i.id === manifestoMudado.id ? {...i, d: manifestoMudado.d} : i);
    fs.writeFileSync(path.join(tmp, 'icones.json'), JSON.stringify({grade: 24, icones: todos}));
    args.push(tmp);
  }
  return new Promise(resolve => {
    const filho = spawn(process.execPath, args, {env: {...process.env, PARAR: '1', SAIDA: path.join(saidaBase, 'mutante-' + nome)}});
    let saida = '';
    filho.stdout.on('data', x => { saida += x; });
    filho.stderr.on('data', x => { saida += x; });
    const limite = setTimeout(() => filho.kill('SIGKILL'), 900000);
    filho.on('close', status => {
      clearTimeout(limite);
      fs.rmSync(path.join(pasta, arquivo), {force: true});
      if (tmp) fs.rmSync(tmp, {recursive: true, force: true});
      const falha = saida.split('\n').find(l => l.startsWith('FALHA'));
      const feitos = saida.split('\n').filter(l => l.startsWith('OK  ')).length;
      if (status !== 0 && falha) { console.log('PEGO   ' + nome + ' — ' + defeito + '\n         primeira falha (após ' + feitos + ' itens ok): ' + falha.slice(0, 190)); resolve(null); }
      else { console.log('SOLTO  ' + nome + ' — ' + defeito + ' (o teste NÃO percebeu; status ' + status + ')'); resolve(nome); }
    });
  });
}

(async () => {
  const fila = [...lista], soltos = [], paralelo = Math.max(1, Number(process.env.PARALELO || 2));
  const trabalhador = async () => { for (let m = fila.shift(); m; m = fila.shift()) { const r = await rodar(m); if (r) soltos.push(r); } };
  await Promise.all(Array.from({length: paralelo}, trabalhador));
  console.log('\nÍcone do feedback · mutantes no Chrome: ' + (lista.length - soltos.length) + ' de ' + lista.length + ' defeitos pegos' + (soltos.length ? '; SOLTOS: ' + soltos.join(', ') : ''));
  process.exit(soltos.length ? 1 : 0);
})();
