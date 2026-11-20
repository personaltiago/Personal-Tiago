'use strict';
// "Teste do teste" do ícone do feedback (1.12.293) no Chrome real: estraga a página do 293 de vários jeitos, um de cada vez, e roda o teste
// funcional (funcional.js, com PARAR=1) em cada uma. Cada defeito precisa ser PEGO (o teste falha); se algum passar, o teste não protege
// aquele comportamento. A página sem defeito passa em todos os itens (rode funcional.js nela para ver).
// Defeito equivalente (de propósito fora da lista): tirar `panel&&(panel.hidden=!0);` do tratador de ap-account-changed. A página continua
// igual, porque feedbackIconSync() (chamado logo em seguida por feedbackIconRow) já fecha o painel quando não há aluno logado.
// Variável SO=nome1,nome2 roda só esses defeitos.
// uso: PORTA=8790 node mutantes.cjs <pasta-servida> [index-293.html] [index-292.html]
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {spawnSync} = require('node:child_process');

const [, , pasta, nova = 'index-293.html', antiga = 'index-292.html'] = process.argv;
if (!pasta) { console.error('uso: node mutantes.cjs <pasta-servida> [index-293.html] [index-292.html]'); process.exit(2); }

// [nome, o que o defeito faz, texto original (precisa existir UMA vez na página), texto defeituoso]
const MUTANTES = [
  ['sem-rosto', 'o botão do topo nunca recebe o desenho do ícone', 'if(!show)return;feedbackBellFace(bell);', 'if(!show)return;'],
  ['padrao-errado', 'sem escolha, o padrão passa a ser o segundo ícone', '||FB_ICONS[0]}', '||FB_ICONS[1]}'],
  ['sem-disco', 'o selo redondo perde a classe (fica 38 px em vez de 40)', 'bell.classList.toggle("ap-fbicon-disc",!!icon.disc)', 'bell.classList.toggle("ap-fbicon-disc",!1)'],
  ['chave-sem-conta', 'a chave não começa por agenda_demo_ (a escolha vira do aparelho, não da conta)', 'FB_ICON_KEY="agenda_demo_feedback_icon"', 'FB_ICON_KEY="feedback_icon"'],
  ['le-sem-conta', 'a escolha é lida do localStorage direto, sem a separação por conta', 'id=String(APstudentStorage.getItem(FB_ICON_KEY)||"")', 'id=String(localStorage.getItem(FB_ICON_KEY)||"")'],
  ['linha-no-fim', 'a linha vai para o fim da lista, não logo depois de Configurações', 'settings?settings.after(open,panel):list.append(open,panel)', 'list.append(open,panel)'],
  ['sem-envoltorio', 'o Perfil redesenhado não recria a linha', 'if("function"==typeof profileRender){', 'if(!1){'],
  ['linha-sempre-visivel', 'a linha aparece mesmo sem aluno logado', 'open.hidden=!show;', 'open.hidden=!1;'],
  ['sem-reserva', 'imagem que não carrega não devolve o balão simples', 'img.addEventListener("error",()=>bell.classList.add("ap-fbicon-fallback"));', ''],
  ['falha-silenciosa', 'disco cheio: acha que gravou e não avisa', 'catch(_){saved=!1}', 'catch(_){saved=!0}'],
  ['grupo-errado', 'os rádios não pertencem ao grupo certo (o tratador ignora a escolha)', 'type="radio" name="apFeedbackIcon" value=', 'type="radio" name="apFeedbackIconX" value='],
  ['sem-evento', 'escolher um ícone não avisa a página (evento ap-feedback-icon-changed)', 'dispatchEvent(new CustomEvent("ap-feedback-icon-changed",{detail:{id:icon.id}}))', '0'],
  ['sem-atualizar-botao', 'escolher um ícone grava mas não atualiza o botão do topo', 'feedbackBell(t.pending().length);dispatchEvent', 'dispatchEvent'],
  ['sem-foco-no-painel', 'o painel aberto não recebe o foco', 'panel.focus({preventScroll:!0});', ''],
  ['status-sem-nome', 'o status não diz qual ícone está escolhido', 'text="Escolhido: "+icon.name', 'text="Escolhido"'],
  ['movimento-ignorado', 'a rolagem é sempre suave, mesmo com "reduzir movimento"', 'matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"', '"smooth"'],
  ['css-sem-oculto', 'linha e painel escondidos (hidden) continuam aparecendo', '#apFeedbackIconOpen[hidden],#apFeedbackIconPanel[hidden]{display:none!important}', ''],
  ['css-bloco-pequeno', 'o ícone do topo fica com 30 px', '.student-home .ap-feedback-bell img{display:block;width:38px;height:38px', '.student-home .ap-feedback-bell img{display:block;width:30px;height:30px'],
  ['css-grade-miuda', 'os alvos de toque da grade ficam com 36 px', 'minmax(56px,1fr)', 'minmax(36px,1fr)'],
  ['css-sem-marca', 'o ícone escolhido perde a marca de visto', '.ap-fbicon-opt input:checked+.ap-fbicon-face::after{content:"";', '.ap-fbicon-opt input:checked+.ap-fbicon-face::after{content:none;'],
  ['css-texto-apagado', 'a descrição do painel fica com contraste baixo no escuro', '.ap-fbicon-panel p{margin:0;font-size:12px;line-height:1.35;color:#c2ccd7}', '.ap-fbicon-panel p{margin:0;font-size:12px;line-height:1.35;color:#4a5560}']
];

const html = fs.readFileSync(path.join(pasta, nova), 'utf8');
const conta = (texto, trecho) => texto.split(trecho).length - 1;
const bloco = (texto, id) => { const a = texto.indexOf('<script id="' + id + '">'); return texto.slice(a + id.length + 14, texto.indexOf('</script>', a)); };

const so = process.env.SO ? process.env.SO.split(',') : null;
if (so && so.some(n => !MUTANTES.some(m => m[0] === n))) { console.error('SO tem nome que não existe: ' + so.join(',')); process.exit(2); }
const lista = so ? MUTANTES.filter(m => so.includes(m[0])) : MUTANTES;
let pegos = 0, soltos = [];
for (const [nome, defeito, original, estragado] of lista) {
  if (conta(html, original) !== 1) { console.error('O trecho do defeito "' + nome + '" aparece ' + conta(html, original) + ' vez(es) na página (precisa ser 1)'); process.exit(2); }
  const pagina = html.replace(original, () => estragado);
  new vm.Script(bloco(pagina, 'ap-feedback-student')); // o defeito não pode ser erro de sintaxe: tem que mudar o comportamento, não derrubar o bloco
  const arquivo = 'mutante-' + nome + '.html';
  fs.writeFileSync(path.join(pasta, arquivo), pagina);
  const r = spawnSync(process.execPath, [path.join(__dirname, 'funcional.js'), arquivo, antiga], {env: {...process.env, PARAR: '1'}, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 900000});
  const saida = (r.stdout || '') + (r.stderr || '');
  const falha = saida.split('\n').find(l => l.startsWith('FALHA'));
  const feitos = saida.split('\n').filter(l => l.startsWith('OK  ')).length;
  if (r.status !== 0 && falha) { pegos++; console.log('PEGO   ' + nome + ' — ' + defeito + '\n         primeira falha (após ' + feitos + ' itens ok): ' + falha.slice(0, 190)); }
  else { soltos.push(nome); console.log('SOLTO  ' + nome + ' — ' + defeito + ' (o teste NÃO percebeu; status ' + r.status + ')'); }
  fs.rmSync(path.join(pasta, arquivo), {force: true});
}
console.log('\nÍcone do feedback · mutantes no Chrome: ' + pegos + ' de ' + lista.length + ' defeitos pegos' + (soltos.length ? '; SOLTOS: ' + soltos.join(', ') : ''));
process.exit(soltos.length ? 1 : 0);
