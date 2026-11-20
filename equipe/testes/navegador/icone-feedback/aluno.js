'use strict';
// Biblioteca dos testes do ícone do feedback (1.12.293). Reaproveita a do sino do 292 (../sininho-feedback/aluno.js: Chrome real, página do
// aluno de dentro do pacote, toque de verdade) e acrescenta pagina-icone.js (medidas da linha e do painel do Perfil) e `recarregar()`,
// que reabre a página no MESMO Chrome (o localStorage fica), como o aluno fechando e abrindo o aplicativo.
const fs = require('node:fs'), path = require('node:path');
const {spawnSync} = require('node:child_process');
const base = require('../sininho-feedback/aluno.js');
const {sleep, BASE} = base;
const PAGINA = fs.readFileSync(path.join(__dirname, '..', 'sininho-feedback', 'pagina.js'), 'utf8');
const EXTRA = fs.readFileSync(path.join(__dirname, 'pagina-icone.js'), 'utf8');

async function esperarPronta(c) {
  for (let i = 0; i < 120; i++) {
    if (await c.evaluate("document.readyState==='complete'&&typeof route==='function'&&typeof APFeedbackModel==='object'").catch(() => false)) return true;
    await sleep(150);
  }
  throw new Error('A página do aluno não ficou pronta');
}

async function abrir(pagina, opcoes = {}) {
  const c = await base.abrir(pagina, opcoes);
  await c.evaluate(EXTRA);
  c.recarregar = async () => {
    await c.navigate(BASE + '/' + pagina);
    await esperarPronta(c);
    await c.evaluate(PAGINA);
    await c.evaluate(EXTRA);
  };
  // Toque de verdade numa opção da grade (rola até ela antes, para não tocar fora da tela).
  c.escolher = async valor => {
    await c.evaluate("document.querySelector('input[name=apFeedbackIcon][value=" + valor + "]').scrollIntoView({block:'center'})");
    await sleep(150);
    return c.tocar('input[name=apFeedbackIcon][value=' + valor + ']');
  };
  // Tecla de verdade (DevTools) no elemento que está com o foco.
  c.tecla = async (key, code, vk) => {
    await c.send('Input.dispatchKeyEvent', {type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk});
    if (key.length === 1 || key === 'Enter') await c.send('Input.dispatchKeyEvent', {type: 'char', key, code, text: key === 'Enter' ? '\r' : key, windowsVirtualKeyCode: vk});
    await c.send('Input.dispatchKeyEvent', {type: 'keyUp', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk});
    await sleep(250);
  };
  // Cor (RGB) dos pontos (x, y em pixels CSS) como o Chrome PINTOU: tira uma captura e lê os pixels com Pillow (python3 -I). É a única forma de
  // saber a cor real de um fundo translúcido ou em degradê, que getComputedStyle não dá.
  c.pixels = async pontos => {
    const arquivo = path.join(base.SAIDA, '_pixels.png');
    fs.mkdirSync(base.SAIDA, {recursive: true});
    await c.shot(arquivo);
    const r = spawnSync('python3', ['-I', '-c', "import sys,json\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGB');d=float(sys.argv[3])\nprint(json.dumps([list(im.getpixel((int(x*d),int(y*d)))) for x,y in json.loads(sys.argv[2])]))", arquivo, JSON.stringify(pontos), String(opcoes.dpr || 2)], {encoding: 'utf8'});
    if (r.status !== 0) throw new Error('Não consegui ler os pixels (python3 com Pillow): ' + r.stderr);
    return JSON.parse(r.stdout);
  };
  c.erros = () => c.logs.filter(l => /ERRO/.test(l));
  return c;
}

module.exports = {...base, abrir, esperarPronta};
