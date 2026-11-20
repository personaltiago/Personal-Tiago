'use strict';
// "Teste do teste" do verificador de regressão: monta, a partir do canônico de verdade, pacotes e correções com regressões PROPOSITAIS
// (pacote antigo, reversão das correções de exercícios, remoção de bloco, alteração não declarada, paridade aluno/professor quebrada,
// sequência e hashes divergentes, correção em conflito ou que reverte) e exige que cada um seja REPROVADO pelo motivo certo. Também
// exige que os controles bons (o próprio canônico, o 1.12.295 autorizado, uma correção da main já presente) passem.
// Uso (da raiz): node equipe/testes/regressao/testar-verificador.cjs
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const L = require('../../canonico/lib.cjs');
const {verificarArquivo} = require('./verificar-pacote.cjs');
const {locateMain} = require('../arquivos-da-main.cjs');

const M = L.lerJson(path.join(L.RAIZ, 'equipe/canonico/manifesto.json'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-verificador-'));
const AUT = path.join(L.RAIZ, 'equipe/canonico/alteracoes-autorizadas');
const achar = (nome) => { const p = M.pacotes.find(x => x.arquivo === nome) || M.correcoes.find(x => x.arquivo === nome); return locateMain(nome, p.sha256, tmp); };
const canonico = L.lerJson(achar(M.canonico.arquivo));
const p288 = L.lerJson(achar('AgendaPersonal-1.12.288-Janelas-Como-Pagina-Para-Assinar.agenda.json'));
const corr = nome => L.lerJson(achar(nome));

// troca o conteúdo de um bloco de uma página
function trocar(html, id, texto) {
  const b = L.blocos(html).get(id);
  if (!b || b.vezes !== 1) throw new Error('bloco inexistente ou repetido: ' + id);
  return html.slice(0, b.inicio) + texto + html.slice(b.fim);
}
function textoDe(html, id) { const b = L.blocos(html).get(id); return html.slice(b.inicio, b.fim); }
function remover(html, id) {
  const b = L.blocos(html).get(id);
  const ini = html.lastIndexOf('<', b.inicio - 1), fim = html.indexOf('>', b.fim) + 1;
  return html.slice(0, ini) + html.slice(fim);
}
const copia = o => JSON.parse(JSON.stringify(o));
function v296(muda) { const p = copia(canonico); p.version = '1.12.296'; p.sequence = 402; muda(p); return p; }
function autorizar(dir, p, alteracoes, extra = {}) {
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, p.version + '.json'), JSON.stringify({versao: p.version, sequencia: p.sequence, base: {versao: M.canonico.versao, sha256: M.canonico.sha256}, alteracoes, remocoes: [], reversoes: [], ...extra}));
  return dir;
}
const hashDe = (p, pagina, id) => L.blocos(p.files[pagina]).get(id)?.hash ?? null;
const decl = (p, pagina, id) => ({pagina, id, antes: M.blocos[pagina][id]?.hash ?? null, depois: hashDe(p, pagina, id)});

let n = 0, bad = 0;
function caso(nome, dado, {modo = 'pr', autorizacoes = path.join(tmp, 'vazio'), espera, motivo}) {
  const arq = path.join(tmp, 'caso-' + (++n) + '.agenda.json');
  fs.writeFileSync(arq, typeof dado === 'string' ? fs.readFileSync(dado) : JSON.stringify(dado));
  const r = verificarArquivo(arq, M, {modo, autorizacoes});
  const reprovou = r.falhas.length > 0;
  const certo = espera === 'reprova' ? reprovou && (!motivo || r.falhas.some(f => motivo.test(f))) : !reprovou;
  if (!certo) bad++;
  console.log((certo ? 'OK    ' : 'FALHA ') + nome + ' -> ' + (reprovou ? 'reprovado: ' + r.falhas.slice(0, 2).join(' | ').slice(0, 220) : 'aprovado: ' + r.resumo));
}

fs.mkdirSync(path.join(tmp, 'vazio'));
// ---- controles que precisam passar
caso('controle: o canônico 1.12.294', canonico, {espera: 'passa'});
caso('controle: o 1.12.295 com a autorização versionada', achar('AgendaPersonal-1.12.295-Feedback-Topo-Para-Assinar.agenda.json'), {autorizacoes: AUT, espera: 'passa'});
caso('controle: correção 01 (já presente no canônico: idempotente)', corr('AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json'), {espera: 'passa'});
caso('controle: correção Sininho de cadastro (presente)', corr('AgendaPersonal-Sininho-Cadastro-Professor-para-assinar.agenda.json'), {espera: 'passa'});
const novaCss = textoDe(canonico.files['index.html'], 'ap-feedback-css') + '.x-teste{}';
const boa = v296(p => { for (const pg of ['index.html', 'professor.html']) p.files[pg] = trocar(p.files[pg], 'ap-feedback-css', novaCss); });
caso('controle: 1.12.296 que muda o estilo compartilhado nas duas páginas, autorizado', boa, {autorizacoes: autorizar(path.join(tmp, 'a-boa'), boa, [decl(boa, 'index.html', 'ap-feedback-css'), decl(boa, 'professor.html', 'ap-feedback-css')]), espera: 'passa'});
caso('controle: a mesma mudança sem autorização passa no modo assinatura (o upload do Tiago autoriza)', boa, {modo: 'assinatura', espera: 'passa'});

// ---- regressões propositais
caso('pacote completo antigo (1.12.288) por cima do canônico', p288, {espera: 'reprova', motivo: /REGRESSIVO/});
caso('pacote completo antigo (1.12.288) no modo assinatura', p288, {modo: 'assinatura', espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
for (const [id, cor] of [['ap-workout-instructions', '01'], ['ap-workout-export', '02'], ['ap-workout-corrections', '03']]) {
  const r = v296(p => { p.files['professor.html'] = trocar(p.files['professor.html'], id, textoDe(p288.files['professor.html'], id)); });
  caso(`atualização nova que volta ${id} ao 1.12.288 (perde a correção ${cor})`, r, {modo: 'assinatura', espera: 'reprova', motivo: /REVERSÃO|CORREÇÃO PERDIDA/});
}
const fb = v296(p => {
  p.files['index.html'] = trocar(p.files['index.html'], 'ap-feedback-student', textoDe(p.files['index.html'], 'ap-feedback-student') + '\n/*x*/');
  p.files['professor.html'] = trocar(p.files['professor.html'], 'ap-workout-corrections', textoDe(p288.files['professor.html'], 'ap-workout-corrections'));
});
caso('atualização de feedback AUTORIZADA que também desfaz a correção 03 por baixo', fb, {autorizacoes: autorizar(path.join(tmp, 'a-fb'), fb, [decl(fb, 'index.html', 'ap-feedback-student')]), espera: 'reprova', motivo: /REVERSÃO/});
caso('remoção de bloco (ap-workout-corrections some)', v296(p => { p.files['professor.html'] = remover(p.files['professor.html'], 'ap-workout-corrections'); }), {modo: 'assinatura', espera: 'reprova', motivo: /REMOÇÃO/});
caso('remoção de bloco do aluno (ap-feedback-sync some)', v296(p => { p.files['index.html'] = remover(p.files['index.html'], 'ap-feedback-sync'); }), {modo: 'assinatura', espera: 'reprova', motivo: /REMOÇÃO/});
caso('alteração não declarada (modo PR)', boa, {espera: 'reprova', motivo: /NÃO declarada|sem autorização/});
const par = v296(p => { p.files['index.html'] = trocar(p.files['index.html'], 'ap-feedback-css', novaCss); });
caso('paridade: estilo compartilhado mudado só no aluno', par, {autorizacoes: autorizar(path.join(tmp, 'a-par'), par, [decl(par, 'index.html', 'ap-feedback-css')]), espera: 'reprova', motivo: /PARIDADE/});
caso('paridade também no modo assinatura', par, {modo: 'assinatura', espera: 'reprova', motivo: /PARIDADE/});
caso('divergência de sequência (1.12.296 com sequência 401)', v296(p => { p.sequence = 401; }), {modo: 'assinatura', espera: 'reprova', motivo: /divergência de sequência/});
caso('mesma versão e sequência do canônico com conteúdo diferente', (() => { const p = copia(boa); p.version = '1.12.294'; p.sequence = 400; return p; })(), {modo: 'assinatura', espera: 'reprova', motivo: /REGRESSIVO/});
caso('autorização que parte de um retrato velho (hash "antes" divergente)', boa, {autorizacoes: autorizar(path.join(tmp, 'a-velha'), boa, [{...decl(boa, 'index.html', 'ap-feedback-css'), antes: '0'.repeat(64)}, decl(boa, 'professor.html', 'ap-feedback-css')]), espera: 'reprova', motivo: /DIVERGÊNCIA DE HASH/});
caso('autorização com base diferente do canônico', boa, {autorizacoes: autorizar(path.join(tmp, 'a-base'), boa, [decl(boa, 'index.html', 'ap-feedback-css'), decl(boa, 'professor.html', 'ap-feedback-css')], {base: {versao: '1.12.288', sha256: '1f9b66c8cb8af792ed661c435d46ba2ee172306e6f4b38c298e38836b2d29f15'}}), espera: 'reprova', motivo: /não do canônico/});
caso('appId diferente', v296(p => { p.appId = 'com.outro.app'; }), {modo: 'assinatura', espera: 'reprova', motivo: /appId/});
// correções por área
caso('correção em conflito (Raposinha: ap-student-mascot-model mudou)', corr('AgendaPersonal-Pets-Raposinha.agenda.json'), {espera: 'reprova', motivo: /CONFLITO/});
const c01 = corr('AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json');
caso('correção com hash de pré-condição divergente', (() => { const c = copia(c01); c.changes[0].before = 'f'.repeat(64); c.changes[0].after = 'e'.repeat(64); return c; })(), {espera: 'reprova', motivo: /CONFLITO/});
caso('correção que leva ap-workout-export de volta ao 1.12.288', (() => { const c = copia(c01); c.changes = [{page: 'professor.html', id: 'ap-workout-export', before: M.blocos['professor.html']['ap-workout-export'].hash, after: L.blocos(p288.files['professor.html']).get('ap-workout-export').hash, content: textoDe(p288.files['professor.html'], 'ap-workout-export')}]; return c; })(), {espera: 'reprova', motivo: /REVERSÃO/});
caso('correção que muda o estilo compartilhado só no aluno', (() => { const c = copia(c01); c.changes = [{page: 'index.html', id: 'ap-feedback-css', before: M.blocos['index.html']['ap-feedback-css'].hash, after: L.sha256(novaCss), content: novaCss}]; return c; })(), {espera: 'reprova', motivo: /PARIDADE/});
caso('correção num bloco que não existe', (() => { const c = copia(c01); c.changes[0].id = 'ap-nao-existe'; return c; })(), {espera: 'reprova', motivo: /não existe/});

fs.rmSync(tmp, {recursive: true, force: true});
console.log(`\n${n} casos, ${n - bad} com o resultado esperado, ${bad} errados`);
process.exit(bad ? 1 : 0);
