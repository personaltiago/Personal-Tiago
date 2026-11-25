'use strict';

// Gera o pacote 1.12.314 / 420 (sem assinatura) a partir do 1.12.313 / 419 assinado (referência; SHA-256 conferido).
// Pedido: Tiago, 24/11/2026 18:49 e 20:46. Colar a prescrição escrita (texto do ChatGPT) no perfil do aluno, "Orientações +
// colar texto" e "Também montar os exercícios"; cardio do texto vira card no fim do treino com o tempo exato; poder tirar o
// "Como fazer" do texto (a galeria já tem o dela); no app do aluno, na tela dos treinos, um botão "Orientações" que abre o texto.
// Agora:
//  professor.html - blocos novos ap-treino-texto-css e ap-treino-texto (leitor do texto + janela de revisão) e dois botões
//    "Importar treino por texto" no texto do app (ao lado de "Importar treino por PDF" e de "Criar ficha de treino").
//  index.html - blocos novos ap-orientacoes-aluno-css e ap-orientacoes-aluno (botão Orientações e janela de leitura).
// Não muda: o PDF, descanso, cronômetros, alarmes, notificações, Firebase, cadastro do aluno, financeiro, login e mascotes.
// Uso: node tools/gerar-treino-texto-1.12.314.cjs [pacote-1.12.313.agenda.json] [saida.agenda.json]

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');

const version = '1.12.314';
const sequence = 420;
const title = 'Treino por texto e Orientações';
const summary = 'Cole a prescrição escrita no perfil do aluno e o app monta a ficha, com cardio no fim e Orientações para o aluno ler.';
const notesText = 'Treino por texto e Orientações.\n\n'
  + 'Professor: no perfil do aluno (Aluno e ficha) e na ficha vazia, o botão Importar treino por texto. Cole o texto da prescrição; '
  + 'o app mostra o que leu antes de criar a ficha: dias, exercícios, séries, repetições e descanso, o vínculo de cada exercício com a '
  + 'galeria e as Orientações gerais. Descanso em faixa (45–60 s) usa um valor só, que você escolhe.\n\n'
  + 'O Como fazer do texto pode ser tirado por exercício ou de todos de uma vez; sem ele, o aluno vê o da galeria.\n\n'
  + 'Se o texto prevê cardio, o app cria um card de cardio no fim de cada treino, depois da musculação, com o cronômetro no tempo '
  + 'do texto (faixa como 10–15 min começa no menor; você escolhe) e a modalidade e as orientações do cardio. Sem cardio no texto, '
  + 'nenhum card é criado.\n\n'
  + 'Só ficam com você: classificação das orientações, resumo do volume, progressão e auditoria. O app não guarda o texto original.\n\n'
  + 'Aluno: na tela Meus treinos aparece o botão Orientações (quando a ficha tem Orientações gerais ou do treino). As Orientações '
  + 'gerais que você já escreveu em fichas antigas também passam a aparecer lá.\n\n'
  + 'O que não muda: importação por PDF, descanso, cronômetros, alarmes, notificações da tela bloqueada, Firebase, cadastro do '
  + 'aluno, financeiro, login e mascotes.\n\n'
  + 'Inclui tudo do 1.12.313 e deve ser instalado no lugar dele.';
const APP_ID = 'com.tiagolima.agendapersonal';
const SOURCE_NAME = 'AgendaPersonal-1.12.313-Aviso-No-Relogio-Para-Assinar.agenda.json';
const SOURCE_SHA256 = 'b67ea8dc12c1a6629e2f4f0e5efdfd724b5a41dec1bef200a086161faa695ee5';
const TARGET_NAME = 'AgendaPersonal-1.12.314-Treino-Por-Texto-Para-Assinar.agenda.json';
const count = (text, part) => text.split(part).length - 1;
const sha256 = data => createHash('sha256').update(data).digest('hex');
const lerFonte = nome => readFileSync(join(__dirname, 'treino-texto', nome), 'utf8').replace(/\r\n/g, '\n');

const PARSER = lerFonte('parser.js');
const PROFESSOR_JS = '(function(){\n\'use strict\';\nconst Parser=(function(){const module={exports:{}};\n' + PARSER + '\nreturn module.exports})();\n' + lerFonte('professor.js') + '\n})();';
const ALUNO_JS = '(function(){\n\'use strict\';\n' + lerFonte('aluno.js') + '\n})();';
const PROFESSOR_CSS = '\n' + lerFonte('professor.css');
const ALUNO_CSS = '\n' + lerFonte('aluno.css');
for (const [nome, texto] of [['professor', PROFESSOR_JS], ['aluno', ALUNO_JS], ['css-p', PROFESSOR_CSS], ['css-a', ALUNO_CSS]])
  assert.equal(count(texto, '</script'), 0, 'Fonte ' + nome + ' não pode conter </script');

const BLOCOS_PROFESSOR = '<style id="ap-treino-texto-css">' + PROFESSOR_CSS + '</style>\n<script id="ap-treino-texto">' + PROFESSOR_JS + '\n</script>\n';
const BLOCOS_ALUNO = '<style id="ap-orientacoes-aluno-css">' + ALUNO_CSS + '</style>\n<script id="ap-orientacoes-aluno">' + ALUNO_JS + '\n</script>\n';

// Antes do último </body> (o index.html também tem "</body>" dentro de textos de janelas abertas pelo app).
function inserir(html, blocos, pagina, novos) {
  const fim = html.lastIndexOf('</body>');
  assert.ok(fim > 0 && /^<\/body>\s*<\/html>\s*$/.test(html.slice(fim)), 'O fim da página não é </body></html>: ' + pagina);
  for (const novo of novos) assert.equal(count(html, novo), 0, novo + ' já existe no 1.12.313 (' + pagina + ')');
  return html.slice(0, fim) + blocos + html.slice(fim);
}
function trocar(html, antes, depois) {
  assert.equal(count(html, antes), 1, 'Trecho esperado exatamente uma vez no professor.html: ' + antes.slice(0, 80));
  return html.replace(antes, () => depois);
}
const BOTAO_PDF = '<button class="btn" type="button" onclick="chooseWorkoutPdfImportForStudent()">Importar treino por PDF</button></div>';
const BOTAO_VAZIA = '<button class="btn primary full" type="button" onclick="openWorkoutPlanEditor()">Criar ficha de treino</button></div>${context}';

function editStudent(html) {
  for (const needed of ['id="workoutsScreen"', '<div id="wsListContent">', '<header class="ws-header">', 'function renderWorkouts(){',
    'window.__AP_STUDENT_CONTEXT', '.ws-screen.ws-light', 'notes:[n.notes,e.notes].filter(Boolean).join("\\n")', 'notes:n(r.notes,4e3)'])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.313 (index.html): ' + needed);
  assert.equal(count(html, 'id="screen-more"'), 0, 'index.html não pode ter #screen-more');
  return inserir(html, BLOCOS_ALUNO, 'index.html', ['ap-orientacoes-aluno', 'APOrientacoesAluno', 'apOrientBtn']);
}
function editProfessor(html) {
  for (const needed of ['id="workoutPdfImportDialog"', 'function workoutImportCatalogMatches(', 'function workoutImportResolveExercise(',
    'function commitWorkoutChange(', 'function workoutCatalogItem(', 'function workoutCatalogItems(', 'function openWorkoutStudent(',
    'function selectWorkoutPlan(', 'function showScreen(', 'let workoutStudentId', 'function workoutImportNorm('])
    assert.ok(count(html, needed) >= 1, 'Dependência ausente no 1.12.313 (professor.html): ' + needed);
  assert.equal(count(html, 'id="workoutsScreen"'), 0, 'professor.html não pode ter #workoutsScreen');
  for (const novo of ['APTreinoTexto', 'apTextoDialog']) assert.equal(count(html, novo), 0, novo + ' já existe no 1.12.313 (professor.html)');
  let h = trocar(html, BOTAO_PDF, BOTAO_PDF.slice(0, -'</div>'.length) + '<button class="btn" type="button" onclick="window.APTreinoTexto&&APTreinoTexto.abrir()">Importar treino por texto</button></div>');
  h = trocar(h, BOTAO_VAZIA, BOTAO_VAZIA.replace('</div>${context}', '<button class="btn full" type="button" onclick="window.APTreinoTexto&&APTreinoTexto.abrir()">Importar treino por texto</button></div>${context}'));
  return inserir(h, BLOCOS_PROFESSOR, 'professor.html', ['ap-treino-texto-css']);
}
function makeUpdate(source) {
  assert.equal(source.format, 1);
  assert.equal(source.appId, APP_ID);
  assert.equal(source.version, '1.12.313');
  assert.equal(source.sequence, 419);
  assert.equal(sequence, source.sequence + 1);
  assert.equal(sequence - 106, Number(version.split('.')[2]), 'A regra do projeto: sequência = número da versão + 106');
  assert.ok(summary.length <= 200, 'resumo: ' + summary.length);
  assert.ok(notesText.length <= 4000, 'notas: ' + notesText.length);
  const { agendaSignature, ...original } = source;
  const files = { ...original.files, 'index.html': editStudent(original.files['index.html']), 'professor.html': editProfessor(original.files['professor.html']) };
  return { ...original, files, version, sequence, notes: notesText, update: { category: 'general', title, summary } };
}
function loadSource(file) {
  const bytes = readFileSync(file);
  assert.equal(sha256(bytes), SOURCE_SHA256, 'O arquivo não é o pacote 1.12.313 da main (SHA-256 diferente): ' + file);
  return JSON.parse(bytes.toString('utf8'));
}
if (require.main === module) {
  const [, , sourceFile = SOURCE_NAME, targetFile = TARGET_NAME] = process.argv;
  const payload = JSON.stringify(makeUpdate(loadSource(sourceFile)), null, 2) + '\n';
  writeFileSync(targetFile, payload, { encoding: 'utf8', flag: 'wx' });
  console.log(targetFile + ' ' + sha256(Buffer.from(payload, 'utf8')));
}
module.exports = { makeUpdate, loadSource, editStudent, editProfessor, version, sequence, TARGET_NAME, SOURCE_NAME, PROFESSOR_JS, ALUNO_JS, PROFESSOR_CSS, ALUNO_CSS };
