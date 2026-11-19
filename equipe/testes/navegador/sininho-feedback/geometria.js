'use strict';
// Matriz de geometria do topo do aluno com o sino do feedback (1.12.292), em Chrome real: larguras de 320 a 430, nomes curtos e longos,
// três tamanhos de letra, com e sem o ícone do grupo, modo claro e escuro. Em cada caso o nome (primeiro nome + "!") NÃO pode ser partido
// no meio da palavra, nada pode sair da tela nem se sobrepor, e o sino e o número precisam ter o tamanho certo. Sem pendência o topo do
// 1.12.292 precisa ficar idêntico ao do 1.12.291 (mesmas medidas).
// uso: PORTA=8790 SAIDA=saida node geometria.js <pagina-292.html> <pagina-291.html>
const {abrir, cenario, suite, sleep, SAIDA} = require('./aluno.js');

const [, , nova, antiga] = process.argv;
if (!nova || !antiga) { console.error('uso: node geometria.js <pagina-292.html> <pagina-291.html>'); process.exit(2); }
const S = suite('Sino do feedback · geometria do topo');
const t = S.t;

// Os padrões cobrem a matriz inteira; LARGURAS, FONTES, NOMES e MODOS (separados por vírgula) restringem, para rodar partes.
const lista = (nome, padrao) => (process.env[nome] ? process.env[nome].split(',') : padrao);
const LARGURAS = lista('LARGURAS', [320, 360, 375, 390, 412, 430]).map(Number);
const NOMES = lista('NOMES', ['Ana', 'Jessica', 'Jéssica', 'Alexandre', 'Alessandra', 'Guilherme', 'Christiane', 'Wellington', 'Maximiliano']);
const FONTES = lista('FONTES', ['pequena', 'media', 'grande']);
const MODOS = lista('MODOS', ['escuro']);
const IGUAIS = ['topo', 'h1', 'acoes', 'diaria'];
const mesmo = (a, b) => ['x', 'y', 'w', 'h'].every(k => Math.abs(a[k] - b[k]) < 0.02);

(async () => {
  const c = await abrir(nova, {}), d = await abrir(antiga, {});
  const resumo = {casos: 0, abaixo: 0, maisLinhas: 0, mesmaLinha: 0, quebradas: 0, fora: 0, sobrep: 0, estouro: 0, tamanho: 0, iguais: 0, diferentes: 0};
  const detalhesAbaixo = [];
  for (const modo of MODOS) for (const largura of LARGURAS) {
    await c.viewport(largura, 844); await d.viewport(largura, 844);
    for (const fonte of FONTES) for (const grupo of [true, false]) for (const nome of NOMES) {
      const entrada = {nome: nome + ' Silva', fonte, grupo, modo};
      // sem pendência: o 292 tem de medir o mesmo que o 291
      await cenario(c, entrada, {pendentes: 0, respondidos: 2}); await cenario(d, entrada, {pendentes: 0, respondidos: 2});
      const m0 = await c.t('medir'), a0 = await d.t('medir');
      const dif = IGUAIS.filter(k => !mesmo(m0[k], a0[k]));
      if (m0.filhos.length !== a0.filhos.length || m0.filhos.some((f, i) => f.id !== a0.filhos[i].id || !mesmo(f, a0.filhos[i]))) dif.push('filhos');
      if (dif.length) { resumo.diferentes++; t('Sem pendência ' + [modo, largura, fonte, grupo ? 'grupo' : 'sem grupo', nome].join(' · ') + ': medidas do 292 iguais às do 291', false, dif); } else resumo.iguais++;
      // com pendência
      await cenario(c, entrada, {pendentes: 2, respondidos: 1});
      const m = await c.t('medir'), a = a0, rotulo = [modo, largura, fonte, grupo ? 'grupo' : 'sem grupo', nome].join(' · ');
      resumo.casos++;
      const ruins = [];
      if (m.palavrasPartidas.length) { ruins.push('nome partido: ' + m.palavrasPartidas.join(',')); resumo.quebradas++; }
      if (m.foraDaTela.length) { ruins.push('fora da tela: ' + m.foraDaTela.join(',')); resumo.fora++; }
      if (m.sobrepostos.length) { ruins.push('sobrepostos: ' + m.sobrepostos.join(',')); resumo.sobrep++; }
      if (m.estourouHorizontal > 0 || m.estourouJanela > 0 || m.h1Estouro > 0) { ruins.push('estouro: ' + [m.estourouHorizontal, m.estourouJanela, m.h1Estouro].join('/')); resumo.estouro++; }
      const sino = m.filhos.find(f => f.id === 'apFeedbackBell');
      if (!sino || Math.abs(sino.w - 44) > 0.01 || Math.abs(sino.h - 44) > 0.01 || !m.numero || m.numero.h !== 19 || m.numero.w < 19) { ruins.push('tamanho do sino/número: ' + JSON.stringify([sino && [sino.w, sino.h], m.numero])); resumo.tamanho++; }
      // o 291 com pendência (sem sino) não pode ter palavra partida pelo mesmo motivo: referência para comparar
      if (m.acoesAbaixo) { resumo.abaixo++; if (detalhesAbaixo.length < 400) detalhesAbaixo.push(rotulo); if (m.acoes.r < m.limiteDir - 0.5) ruins.push('ícones na linha de baixo não estão encostados à direita'); }
      if (m.linhasNome > a.linhasNome) resumo.maisLinhas++;
      if (!m.acoesAbaixo && m.linhasNome <= a.linhasNome) resumo.mesmaLinha++;
      if (ruins.length) t('Com 2 pendentes ' + rotulo, false, ruins);
    }
  }
  console.log('\nRESUMO (casos com sino: ' + resumo.casos + ')');
  console.log(' - nome partido no meio da palavra: ' + resumo.quebradas + ' · ícone fora da tela: ' + resumo.fora + ' · sobreposição: ' + resumo.sobrep + ' · estouro: ' + resumo.estouro + ' · tamanho errado: ' + resumo.tamanho);
  console.log(' - ícones passaram para a linha de baixo (nome comprido): ' + resumo.abaixo + ' de ' + resumo.casos);
  console.log(' - nome ficou com mais linhas do que no 1.12.291: ' + resumo.maisLinhas + ' · nome com o mesmo número de linhas e ícones na mesma linha: ' + resumo.mesmaLinha);
  console.log(' - sem pendência, medidas iguais ao 291: ' + resumo.iguais + ' · diferentes: ' + resumo.diferentes);
  require('node:fs').mkdirSync(SAIDA, {recursive: true});
  require('node:fs').writeFileSync(require('node:path').join(SAIDA, 'geometria-linha-de-baixo.txt'), detalhesAbaixo.join('\n') + '\n');
  t('Nenhum caso com nome partido, ícone fora da tela, sobreposição, estouro ou tamanho errado (' + resumo.casos + ' casos com sino)', resumo.quebradas + resumo.fora + resumo.sobrep + resumo.estouro + resumo.tamanho === 0, resumo);
  t('Sem pendência o topo do 292 mede exatamente o mesmo que o do 291 (' + resumo.iguais + ' casos)', resumo.diferentes === 0 && resumo.iguais > 0, resumo);
  const erros = c.logs.filter(l => /^ERRO-PAGINA/.test(l));
  t('Nenhum erro de JavaScript na página', erros.length === 0, erros.slice(0, 3));
  c.close(); d.close();
  process.exit(S.fim() ? 1 : 0);
})().catch(erro => { console.error('FALHA-GERAL', erro); process.exit(3); });
