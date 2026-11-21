'use strict';
// "Teste do teste" do verificador de regressão: monta, a partir da REFERÊNCIA de verdade (o último passo assinado do manifesto; desde 20/11 o 1.12.300),
// pacotes e correções com regressões PROPOSITAIS e exige que cada um seja REPROVADO pelo motivo certo; e exige que os controles bons
// passem. Inclui as regressões disfarçadas (a correção 03 do 1.12.288 com um comentário no fim, que muda o hash sem devolver nada) e a
// perda dos complementos do 1.12.295. Os pacotes de teste usam a próxima versão livre do manifesto.
// Uso (da raiz): node equipe/testes/regressao/testar-verificador.cjs
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const L = require('../../canonico/lib.cjs');
const {verificarArquivo} = require('./verificar-pacote.cjs');
const {locateMain} = require('../arquivos-da-main.cjs');

const M = L.lerJson(path.join(L.RAIZ, 'equipe/canonico/manifesto.json'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-verificador-'));
const achar = nome => { const p = M.pacotes.find(x => x.arquivo === nome) || M.correcoes.find(x => x.arquivo === nome); return locateMain(nome, p.sha256, tmp); };
const COMP = 'AgendaPersonal-Feedback-Somente-No-Topo-Para-Assinar.agenda.json';
const p288 = L.lerJson(achar('AgendaPersonal-1.12.288-Janelas-Como-Pagina-Para-Assinar.agenda.json'));
const p294 = L.lerJson(achar('AgendaPersonal-1.12.294-Icone-Feedback-Para-Assinar.agenda.json'));
const p295 = L.lerJson(achar('AgendaPersonal-1.12.295-Feedback-Topo-Para-Assinar.agenda.json'));
const comp = L.lerJson(achar(COMP));
const ONLINE = 'AgendaPersonal-Feedback-Online-Compartilhar-Para-Assinar.agenda.json';
const ref = L.lerJson(achar(M.referencia.arquivo)); // a referência atual (último passo assinado da cadeia)
const consolidado = L.aplicarCorrecao(L.aplicarCorrecao(p295, comp), L.lerJson(achar(ONLINE))); // 295 + os dois complementos (= 1.12.298)
if (consolidado.files['index.html'] !== ref.files['index.html']) throw new Error('o index.html da referência mudou depois do 295 + complementos; revise os casos');
const corr = nome => L.lerJson(achar(nome));
const C01 = 'AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json';

function textoDe(html, id) { const b = L.blocos(html).get(id); return html.slice(b.inicio, b.fim); }
function trocar(html, id, texto) { const b = L.blocos(html).get(id); if (!b || b.vezes !== 1) throw new Error('bloco: ' + id); return html.slice(0, b.inicio) + texto + html.slice(b.fim); }
function remover(html, id) { const b = L.blocos(html).get(id); const ini = html.lastIndexOf('<', b.inicio - 1), fim = html.indexOf('>', b.fim) + 1; return html.slice(0, ini) + html.slice(fim); }
const copia = o => JSON.parse(JSON.stringify(o));
function completo(base, versao, muda = () => {}) { const p = copia(base); delete p.modularUpdates; p.modularUpdates = copia(base.modularUpdates || []); p.version = versao; p.sequence = Number(versao.split('.')[2]) + 106; muda(p); return p; }
const NOVA = M.referencia.proxima_versao_livre, SEQ = M.referencia.proxima_sequencia_livre; // próxima versão livre depois da referência
const v297 = muda => completo(ref, NOVA, muda);
function patchDe(id, mudancas) {
  return {format: 'agenda-patch/2', appId: M.canonico.appId, bridgeVersion: 3, dataSchema: 4, id, area: 'professor', module: 'exercicios', version: '1.0', title: 'teste ' + id, notes: 'teste',
    changes: mudancas.map(([page, bid, content]) => ({page, id: bid, before: M.blocos[page][bid].hash, after: L.sha256(content), content}))};
}
const BASE = {referencia: M.referencia.id, impressao: M.referencia.impressao};
function autorizar(nome, dado, alteracoes, extra = {}) {
  const dir = path.join(tmp, 'aut-' + nome); fs.mkdirSync(dir, {recursive: true});
  const chave = String(dado.format).startsWith('agenda-patch/') ? dado.id : dado.version;
  fs.writeFileSync(path.join(dir, chave + '.json'), JSON.stringify({versao: dado.version, sequencia: dado.sequence, base: BASE, alteracoes, remocoes: [], reversoes: [], ...extra}));
  return dir;
}
const hashDe = (p, pagina, id) => L.blocos(p.files[pagina]).get(id)?.hash ?? null;
const decl = (p, pagina, id) => ({pagina, id, antes: M.blocos[pagina][id]?.hash ?? null, depois: hashDe(p, pagina, id)});
const declP = (patch, i = 0) => ({pagina: patch.changes[i].page, id: patch.changes[i].id, antes: patch.changes[i].before, depois: patch.changes[i].after});

let n = 0, bad = 0, controles = 0;
const vazio = path.join(tmp, 'vazio'); fs.mkdirSync(vazio);
function caso(nome, dado, {modo = 'pr', autorizacoes = vazio, espera, motivo, lado}) {
  if (espera === 'passa') controles++;
  const arq = path.join(tmp, 'caso-' + (++n) + '.agenda.json');
  fs.writeFileSync(arq, typeof dado === 'string' ? fs.readFileSync(dado) : JSON.stringify(dado));
  if (lado) fs.writeFileSync(arq.replace(/\.agenda\.json$/, '.autorizacao.json'), JSON.stringify(lado));
  const r = verificarArquivo(arq, M, {modo, autorizacoes});
  const reprovou = r.falhas.length > 0;
  const certo = espera === 'reprova' ? reprovou && (!motivo || r.falhas.some(f => motivo.test(f))) : !reprovou;
  if (!certo) bad++;
  console.log((certo ? 'OK    ' : 'FALHA ') + `[${modo}] ` + nome + ' -> ' + (reprovou ? 'reprovado: ' + r.falhas.slice(0, 2).join(' | ').slice(0, 200) : 'aprovado: ' + r.resumo));
}

// ---------------- controles que precisam passar
caso('controle: o complemento "Feedback online" reimportado (idempotente: último passo do bloco)', achar(ONLINE), {modo: 'assinatura', espera: 'passa'});
caso(`controle: reassinar o ${M.referencia.versao_efetiva} idêntico byte a byte (é a referência)`, achar(M.referencia.arquivo), {modo: 'assinatura', espera: 'passa'});
caso('controle: correção 01 (presente)', corr(C01), {modo: 'assinatura', espera: 'passa'});
caso('controle: correção Sininho de cadastro (presente)', corr('AgendaPersonal-Sininho-Cadastro-Professor-para-assinar.agenda.json'), {espera: 'passa'});
caso(`controle: ${NOVA} com o conteúdo da referência (nada muda)`, v297(), {modo: 'assinatura', espera: 'passa'});
const novaCss = textoDe(ref.files['index.html'], 'ap-feedback-css') + '.x-teste{}';
const boa = v297(p => { for (const pg of ['index.html', 'professor.html']) p.files[pg] = trocar(p.files[pg], 'ap-feedback-css', novaCss); });
caso(`controle: ${NOVA} que muda o estilo compartilhado nas duas páginas, autorizado`, boa, {autorizacoes: autorizar('boa', boa, [decl(boa, 'index.html', 'ap-feedback-css'), decl(boa, 'professor.html', 'ap-feedback-css')]), espera: 'passa'});
caso('controle: a mesma mudança sem autorização no modo assinatura (bloco não protegido: só aviso)', boa, {modo: 'assinatura', espera: 'passa'});
caso('controle: a mesma, com a autorização AO LADO do arquivo', boa, {lado: {versao: NOVA, sequencia: SEQ, base: BASE, alteracoes: [decl(boa, 'index.html', 'ap-feedback-css'), decl(boa, 'professor.html', 'ap-feedback-css')]}, espera: 'passa'});
const fbNovo = textoDe(ref.files['index.html'], 'ap-feedback-student') + '\n/*continuação*/';
const contFb = patchDe('continua-feedback', [['index.html', 'ap-feedback-student', fbNovo]]);
caso('controle: correção que continua o bloco do complemento, COM autorização de continuação', contFb, {modo: 'assinatura', autorizacoes: autorizar('cont', contFb, [declP(contFb)]), espera: 'passa'});

// ---------------- regressões propositais
caso('controle: reassinar o 1.12.295 idêntico byte a byte (passo aprovado, para aparelho ainda atrás da referência)', achar('AgendaPersonal-1.12.295-Feedback-Topo-Para-Assinar.agenda.json'), {modo: 'assinatura', espera: 'passa'});
caso('controle: reassinar o 1.12.294 idêntico byte a byte (é o instalado no Tiago)', achar('AgendaPersonal-1.12.294-Icone-Feedback-Para-Assinar.agenda.json'), {modo: 'assinatura', espera: 'passa'});
caso('pacote antigo 1.12.288 idêntico byte a byte (anterior ao instalado)', achar('AgendaPersonal-1.12.288-Janelas-Como-Pagina-Para-Assinar.agenda.json'), {modo: 'assinatura', espera: 'reprova', motivo: /REGRESSIVO/});
for (const [rot, p] of [['1.12.288', p288], ['1.12.294 com bytes diferentes', p294], ['1.12.295 com bytes diferentes (sem o complemento)', p295]])
  caso(`pacote completo antigo ${rot} por cima da referência`, p, {modo: 'assinatura', espera: 'reprova', motivo: /REGRESSIVO/});
caso('1.12.296/402 com as páginas do 295 (caso da revisão): sequência igual e sem o complemento', completo(p295, '1.12.296'), {modo: 'assinatura', espera: 'reprova', motivo: /REGRESSIVO/});
caso('1.12.296/402 com as páginas do 295: também acusa a perda do complemento', completo(p295, '1.12.296'), {modo: 'assinatura', espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
caso(`${NOVA} montado do 295 (sequência nova) que perde os complementos`, completo(p295, NOVA), {modo: 'assinatura', espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
caso('o complemento "Feedback somente no topo" reimportado sobre a referência (já continuado pelo "Feedback online")', achar(COMP), {modo: 'assinatura', espera: 'reprova', motivo: /CONFLITO/});
caso(`${NOVA} montado de 295 + só o primeiro complemento (perde o "Feedback online")`, completo(L.aplicarCorrecao(p295, comp), NOVA), {modo: 'assinatura', espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
caso('1.12.297/403 com as páginas da referência (versão já usada por 295 + 2 complementos)', completo(ref, '1.12.297'), {modo: 'assinatura', espera: 'reprova', motivo: /REGRESSIVO/});
for (const [id, c] of [['ap-workout-instructions', '01'], ['ap-workout-export', '02'], ['ap-workout-corrections', '03']])
  caso(`${NOVA} que volta ${id} ao 1.12.288 (perde a ${c})`, v297(p => { p.files['professor.html'] = trocar(p.files['professor.html'], id, textoDe(p288.files['professor.html'], id)); }), {modo: 'assinatura', espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
const disfarce = textoDe(p288.files['professor.html'], 'ap-workout-corrections') + '\n/* review: harmless formatting */\n';
caso(`DISFARÇADA: ${NOVA} com a 03 do 1.12.288 + um comentário (hash novo)`, v297(p => { p.files['professor.html'] = trocar(p.files['professor.html'], 'ap-workout-corrections', disfarce); }), {modo: 'assinatura', espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
const pDisf = patchDe('review-only-revert-03-newline', [['professor.html', 'ap-workout-corrections', disfarce]]);
caso('DISFARÇADA (caso da revisão): correção por área com a 03 do 1.12.288 + comentário', pDisf, {modo: 'assinatura', espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
caso('DISFARÇADA também no modo PR', pDisf, {espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
const soEspaco = patchDe('so-um-espaco', [['professor.html', 'ap-workout-corrections', textoDe(ref.files['professor.html'], 'ap-workout-corrections') + ' ']]);
caso('bloco da 03 com só um espaço a mais, sem autorização', soEspaco, {modo: 'assinatura', espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
caso('bloco do complemento mudado sem autorização', contFb, {modo: 'assinatura', espera: 'reprova', motivo: /CORREÇÃO PERDIDA/});
caso('autorização de continuação que parte de outra referência', contFb, {modo: 'assinatura', autorizacoes: autorizar('velha', contFb, [declP(contFb)], {base: {referencia: '1.12.294', impressao: 'x'}}), espera: 'reprova', motivo: /não da referência/});
caso('remoção de bloco (ap-workout-corrections some)', v297(p => { p.files['professor.html'] = remover(p.files['professor.html'], 'ap-workout-corrections'); }), {modo: 'assinatura', espera: 'reprova', motivo: /REMOÇÃO/});
caso('remoção de bloco do aluno (ap-feedback-sync some)', v297(p => { p.files['index.html'] = remover(p.files['index.html'], 'ap-feedback-sync'); }), {modo: 'assinatura', espera: 'reprova', motivo: /REMOÇÃO/});
caso('alteração não declarada (modo PR)', boa, {espera: 'reprova', motivo: /NÃO declarada|sem autorização/});
const par = v297(p => { p.files['index.html'] = trocar(p.files['index.html'], 'ap-feedback-css', novaCss); });
caso('paridade: estilo compartilhado mudado só no aluno', par, {modo: 'assinatura', espera: 'reprova', motivo: /PARIDADE/});
caso(`divergência de sequência (${NOVA} com sequência ${SEQ - 1})`, v297(p => { p.sequence = SEQ - 1; }), {modo: 'assinatura', espera: 'reprova', motivo: /divergência de sequência/});
caso('autorização com hash "antes" velho', boa, {autorizacoes: autorizar('antes', boa, [{...decl(boa, 'index.html', 'ap-feedback-css'), antes: '0'.repeat(64)}, decl(boa, 'professor.html', 'ap-feedback-css')]), espera: 'reprova', motivo: /DIVERGÊNCIA DE HASH/});
caso('appId diferente', v297(p => { p.appId = 'com.outro.app'; }), {modo: 'assinatura', espera: 'reprova', motivo: /appId/});
caso('correção em conflito (Raposinha)', corr('AgendaPersonal-Pets-Raposinha.agenda.json'), {modo: 'assinatura', espera: 'reprova', motivo: /CONFLITO/});
caso('Ficha recolhível 253 reenviada (já evoluída)', corr('AgendaPersonal-Professor-Ficha-Recolhivel-253.agenda.json'), {modo: 'assinatura', espera: 'reprova', motivo: /CONFLITO/});
caso('correção com hash de pré-condição divergente (feita sobre outro conteúdo)', (() => { const c = copia(contFb); c.changes[0].before = 'f'.repeat(64); return c; })(), {modo: 'assinatura', espera: 'reprova', motivo: /CONFLITO/});
caso('correção cujo conteúdo não bate com o hash "depois"', (() => { const c = copia(pDisf); c.changes[0].content += 'x'; return c; })(), {modo: 'assinatura', espera: 'reprova', motivo: /hash "depois"/});
caso('correção que leva ap-workout-export de volta ao 1.12.288 (hash antigo exato)', patchDe('volta-02', [['professor.html', 'ap-workout-export', textoDe(p288.files['professor.html'], 'ap-workout-export')]]), {modo: 'assinatura', espera: 'reprova', motivo: /REVERSÃO/});
caso('correção que muda o estilo compartilhado só no aluno', patchDe('so-aluno', [['index.html', 'ap-feedback-css', novaCss]]), {modo: 'assinatura', espera: 'reprova', motivo: /PARIDADE/});
caso('correção num bloco que não existe', (() => { const c = copia(pDisf); c.changes[0].id = 'ap-nao-existe'; return c; })(), {modo: 'assinatura', espera: 'reprova', motivo: /não existe/});

fs.rmSync(tmp, {recursive: true, force: true});
console.log(`\n${n} casos (${n - bad} com o resultado esperado, ${bad} errados): ${controles} controles que precisam passar e ${n - controles} regressões que precisam ser reprovadas`);
process.exit(bad ? 1 : 0);
