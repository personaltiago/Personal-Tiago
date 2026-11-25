'use strict';
// Testes do leitor de texto de prescrição (1.12.314). Só dados fictícios.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const P = require('../../../tools/treino-texto/parser.js');
let n = 0;
const t = (nome, fn) => { fn(); n++; console.log('ok', n, nome); };
const texto = readFileSync(join(__dirname, 'exemplo-ficticio.md'), 'utf8');
const r = P.analisar(texto);

t('reconhece nome e perfil', () => {
  assert.equal(r.ok, true);
  assert.equal(r.nome, 'Maria Exemplo da Silva');
  assert.equal(r.perfil.objetivo, 'emagrecimento, preservando a qualidade muscular');
  assert.equal(P.objetivoCurto(r.perfil.objetivo), 'Emagrecimento');
  assert.equal(P.nivelCurto(r.perfil.nivel), 'Iniciante');
});
t('3 dias com exercícios, códigos retirados do nome', () => {
  assert.deepEqual(r.dias.map(d => d.letra), ['A', 'B', 'C']);
  assert.deepEqual(r.dias.map(d => d.exercicios.length), [3, 2, 1]);
  assert.equal(r.dias[0].nome, 'DIA A - Quadríceps, posterior e panturrilhas');
  const e = r.dias[0].exercicios[0];
  assert.equal(e.nome, 'Sobe/Desce no Banco'); assert.equal(e.codigo, 'E391');
  assert.equal(e.series, '2'); assert.equal(e.repeticoes, '8-12 por perna');
  assert.equal(r.dias[1].exercicios[0].nome, 'Supino Maquina (Pegada Neutra)');
});
t('descanso em faixa e em minutos', () => {
  const [a, b, c] = r.dias[0].exercicios;
  assert.deepEqual([a.descansoMin, a.descansoMax], [75, 75]);
  assert.deepEqual([b.descansoMin, b.descansoMax], [45, 60]);
  assert.deepEqual([c.descansoMin, c.descansoMax], [60, 60]);
  assert.equal(P.descansoEmSegundos(b, 'max'), 60); assert.equal(P.descansoEmSegundos(b, 'min'), 45); assert.equal(P.descansoEmSegundos(b, 'media'), 53 + 0 || 0);
});
t('como fazer ligado ao exercício; sem texto fica vazio', () => {
  assert.equal(r.dias[0].exercicios[0].comoFazer, 'use um banco baixo e estável.');
  assert.equal(r.dias[0].exercicios[2].comoFazer, '');
  assert.equal(r.dias[1].exercicios[0].comoFazer, 'costas apoiadas.');
  assert.equal(r.dias[2].exercicios[0].comoFazer, '');
});
t('orientações gerais: itens, linha quebrada e contagem declarada', () => {
  assert.equal(r.orientacoes.length, 3);
  assert.equal(r.orientacoes[1], 'Interrompa a série se perder o controle do movimento.');
  assert.equal(r.orientacoesDeclaradas, 3);
  assert.ok(!r.avisos.some(a => /declara/.test(a.texto)));
  assert.equal(P.formatarOrientacoes(r.orientacoes).split('\n')[0], '• Siga os dias na ordem cadastrada.');
});
t('texto cortado: contagem diferente gera aviso', () => {
  const cortado = texto.replace('* Registre cargas e repetições realizadas.\n', '');
  const x = P.analisar(cortado);
  assert.equal(x.orientacoes.length, 2);
  assert.ok(x.avisos.some(a => /declara 3 orientações.*encontrei 2/.test(a.texto)));
});
t('cardio: modalidade, faixa de tempo e orientação, sem jargão do método', () => {
  assert.equal(r.cardio.modalidade, 'Caminhada na esteira');
  assert.deepEqual([r.cardio.duracaoMin, r.cardio.duracaoMax], [600, 900]);
  assert.equal(r.cardio.orientacao, 'Manter ritmo confortável e interromper se houver piora lombar.');
  assert.equal(r.cardio.dias, null);
});
t('sem cardio no texto: nenhum cardio', () => {
  const x = P.analisar(texto.replace(/### 5[\s\S]*?(?=### 6)/, ''));
  assert.equal(x.cardio, null);
  const y = P.analisar(texto.replace(/Modalidade escolhida:[^\n]*/, 'Não haverá cardio nesta ficha.'));
  assert.equal(y.cardio, null);
});
t('cardio só em alguns dias', () => {
  const x = P.analisar(texto.replace('sempre após a musculação.', 'nos dias A e C, após a musculação.'));
  assert.deepEqual(x.cardio.dias, ['A', 'C']);
});
t('cardio na tabela vai para o fim do dia', () => {
  const x = P.analisar(texto.replace('| Cadeira Extensora (E385)               | 3 × 12–15           | 45–60 s  |',
    '| Esteira                                | 1 × 12 min          | —        |\n| Cadeira Extensora (E385)               | 3 × 12–15           | 45–60 s  |'));
  const d = x.dias[0].exercicios;
  assert.equal(d[d.length - 1].nome, 'Esteira'); assert.equal(d[d.length - 1].cardio, true);
  assert.deepEqual([d[d.length - 1].duracaoMin, d[d.length - 1].duracaoMax], [720, 720]);
  assert.equal(x.dias[0].cardioNaTabela, true);
});
t('seções só do professor não vão para o aluno', () => {
  assert.deepEqual(r.ignorados, ['Estrutura semanal (só conferida)', 'Classificação das orientações', 'Resumo técnico do volume', 'Progressão e revisão', 'Auditoria final']);
  assert.ok(!JSON.stringify(r.orientacoes).includes('Quadríceps'));
});
t('estrutura semanal diferente dos dias gera aviso', () => {
  const x = P.analisar(texto.replace(/### DIA C[\s\S]*?(?=### 5)/, ''));
  assert.ok(x.avisos.some(a => /estrutura semanal tem 3 dias/.test(a.texto)));
});
t('tabela com tabulação e títulos sem #', () => {
  const x = P.analisar('Joana Teste\n\nDIA A — Pernas\nExercício\tSéries × repetições\tDescanso\nAgachamento Livre\t3 × 10\t60 s\n');
  assert.equal(x.ok, true); assert.equal(x.dias[0].exercicios[0].nome, 'Agachamento Livre'); assert.equal(x.dias[0].exercicios[0].descansoMax, 60);
});
t('texto sem treinos é recusado com erro claro', () => {
  const x = P.analisar('Olá, segue a ficha amanhã.');
  assert.equal(x.ok, false); assert.ok(x.avisos.some(a => a.nivel === 'erro'));
});
t('lerTempo', () => {
  assert.deepEqual(P.lerTempo('1:30'), { min: 90, max: 90 });
  assert.deepEqual(P.lerTempo('1 min 30 s'), { min: 90, max: 90 });
  assert.deepEqual(P.lerTempo('10 a 15 minutos', 'min'), { min: 600, max: 900 });
  assert.deepEqual(P.lerTempo('90'), { min: 90, max: 90 });
  assert.equal(P.lerTempo('abc'), null); assert.equal(P.lerTempo('0 s'), null);
});
console.log('\n' + n + ' verificações do leitor passaram.');
