'use strict';
// Verificador de regressão de pacotes do Agenda Personal (pacote completo .agenda.json formato 1 ou correção por área agenda-patch/1|2).
// Compara o ESTADO RESULTANTE do arquivo com a REFERÊNCIA de equipe/canonico/manifesto.json (o último passo assinado da cadeia: hoje
// 1.12.295 + "Feedback somente no topo") e REPROVA (código 1) quando:
//  - pacote completo: sequência menor ou igual à efetiva da referência (pacote antigo/regressivo), appId, ponte, esquema de dados ou a
//    regra sequência = versão + 106 divergem;
//  - correção por área: o conteúdo não tem o hash "depois" declarado, o bloco não existe ou é repetido, ou a pré-condição não casa com a
//    referência (conflito: nunca sobrescrever);
//  - nos dois casos, olhando o estado resultante:
//    · um bloco da referência some (remoção) sem estar em "remocoes" da autorização;
//    · um bloco volta a um hash ANTERIOR da cadeia (reversão) sem estar em "reversoes";
//    · o bloco de uma correção protegida (correção da main ou complemento presente/evoluída na referência) muda para QUALQUER outro
//      conteúdo sem autorização expressa de continuação. Não depende de o conteúdo novo ser um hash antigo: um comentário, um espaço ou
//      qualquer outra mudança no bloco protegido reprova do mesmo jeito;
//    · um componente compartilhado (UpdateAreaPatch.SHARED) fica diferente entre aluno e professor;
//    · modo "pr": um bloco muda ou nasce sem estar na autorização, ou a autorização diverge (base que não é a referência, hash "antes"
//      que não é o da referência, "depois" diferente, mudança declarada que não aconteceu).
// No modo "assinatura" (antes de assinar), mudança nova FORA de bloco protegido e sem autorização vira aviso (o upload do Tiago é a
// aprovação dela); todo o resto reprova sempre. O teste com o mecanismo real (mecanismo-real.py) roda em seguida, nos dois fluxos.
// Autorização: equipe/canonico/alteracoes-autorizadas/<versão do pacote | id da correção>.json, ou <nome>.autorizacao.json ao lado do
// arquivo verificado (para subir junto na main).
// Uso: node equipe/testes/regressao/verificar-pacote.cjs [--modo pr|assinatura] [--manifesto M] [--autorizacoes DIR] [--json SAIDA] arquivo...
const fs = require('node:fs');
const path = require('node:path');
const L = require('../../canonico/lib.cjs');

function args(argv) {
  const o = {modo: 'pr', manifesto: path.join(L.RAIZ, 'equipe/canonico/manifesto.json'), autorizacoes: path.join(L.RAIZ, 'equipe/canonico/alteracoes-autorizadas'), json: null, arquivos: []};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--modo') o.modo = argv[++i];
    else if (a === '--manifesto') o.manifesto = argv[++i];
    else if (a === '--autorizacoes') o.autorizacoes = argv[++i];
    else if (a === '--json') o.json = argv[++i];
    else o.arquivos.push(a);
  }
  if (!['pr', 'assinatura'].includes(o.modo)) throw new Error('--modo deve ser pr ou assinatura');
  return o;
}

const chaveDe = (pagina, id) => pagina + '|' + id;

// A autorização do arquivo: ao lado dele (<nome>.autorizacao.json) ou na pasta versionada, pela versão (pacote) ou pelo id (correção).
function autorizacao(arquivo, dado, dir) {
  const lado = arquivo.replace(/\.agenda\.json$/, '.autorizacao.json');
  if (lado !== arquivo && fs.existsSync(lado)) return {fonte: path.basename(lado), ...L.lerJson(lado)};
  const chave = String(dado.format).startsWith('agenda-patch/') ? dado.id : dado.version;
  const f = path.join(dir, chave + '.json');
  return chave && fs.existsSync(f) ? {fonte: 'alteracoes-autorizadas/' + chave + '.json', ...L.lerJson(f)} : null;
}

// Blocos protegidos: os das correções presentes (ou evoluídas) na referência -> lista dessas correções.
function protegidos(M) {
  const mapa = new Map();
  for (const c of M.correcoes) {
    if (!['presente', 'evoluida'].includes(c.situacao_no_canonico)) continue;
    for (const m of c.mudancas) {
      const k = chaveDe(m.pagina, m.id);
      if (!mapa.has(k)) mapa.set(k, []);
      if (!mapa.get(k).includes(c)) mapa.get(k).push(c);
    }
  }
  return mapa;
}

// Confere um estado resultante (hashes por página: Map id -> hash) contra a referência.
function conferirEstado(res, M, aut, falhas, avisos, linhas, exigirDeclaracao) {
  const declaradas = new Map((aut?.alteracoes || []).map(a => [chaveDe(a.pagina, a.id), a]));
  const remocoes = new Set((aut?.remocoes || []).map(a => chaveDe(a.pagina, a.id)));
  const reversoes = new Set((aut?.reversoes || []).map(a => chaveDe(a.pagina, a.id)));
  const usadas = new Set();
  const prot = protegidos(M);
  for (const pagina of L.PAGINAS) {
    const b = res[pagina], ref = M.blocos[pagina];
    for (const [id, v] of Object.entries(ref)) {
      const k = chaveDe(pagina, id), novo = b.get(id);
      const donos = (prot.get(k) || []).map(c => `"${c.titulo}"`).join(', ');
      if (novo === undefined) {
        if (remocoes.has(k)) { usadas.add(k); linhas.push({pagina, id, area: v.area, estado: 'removido (autorizado)'}); }
        else { falhas.push(`REMOÇÃO não autorizada: ${pagina} ${id} (área ${v.area}) existe na referência e sumiu` + (donos ? `; é bloco de ${donos} (CORREÇÃO PERDIDA)` : '')); linhas.push({pagina, id, area: v.area, estado: 'REMOVIDO'}); }
        continue;
      }
      if (novo === v.hash) { linhas.push({pagina, id, area: v.area, estado: 'igual'}); continue; }
      const antigo = (M.historico[k] || []).find(h => h.hash === novo);
      if (antigo && !reversoes.has(k)) {
        falhas.push(`REVERSÃO: ${pagina} ${id} (área ${v.area}) voltou ao conteúdo de ${antigo.desde}; na referência ele é outro` + (donos ? `; desfaz ${donos} (CORREÇÃO PERDIDA)` : ''));
        linhas.push({pagina, id, area: v.area, estado: 'REVERTIDO para ' + antigo.desde}); continue;
      }
      const d = declaradas.get(k);
      if (d) {
        usadas.add(k);
        if (d.antes !== v.hash) falhas.push(`DIVERGÊNCIA DE HASH: a autorização diz que ${pagina} ${id} parte de ${String(d.antes).slice(0, 12)}, mas na referência é ${v.hash.slice(0, 12)} (partiu de um retrato velho?)`);
        if (d.depois !== novo) falhas.push(`DIVERGÊNCIA DE HASH: a autorização diz que ${pagina} ${id} fica ${String(d.depois).slice(0, 12)}, mas no resultado é ${novo.slice(0, 12)}`);
        linhas.push({pagina, id, area: v.area, estado: 'alterado (autorizado)' + (donos ? ', continua ' + donos : '')});
      } else if (donos) {
        falhas.push(`CORREÇÃO PERDIDA: ${pagina} ${id} é bloco de ${donos}, protegido na referência, e mudou sem autorização de continuação (qualquer mudança nele, até um comentário, precisa dela)`);
        linhas.push({pagina, id, area: v.area, estado: 'ALTERADO bloco protegido'});
      } else if (exigirDeclaracao) {
        falhas.push(`alteração NÃO declarada: ${pagina} ${id} (área ${v.area})`); linhas.push({pagina, id, area: v.area, estado: 'ALTERADO sem autorização'});
      } else { avisos.push(`alterado (sem autorização versionada; vale o upload do Tiago): ${pagina} ${id}`); linhas.push({pagina, id, area: v.area, estado: 'alterado'}); }
    }
    for (const [id, h] of b) if (!ref[id]) {
      const k = chaveDe(pagina, id), d = declaradas.get(k);
      if (d) { usadas.add(k); if (d.antes !== null || d.depois !== h) falhas.push(`DIVERGÊNCIA DE HASH no bloco novo ${pagina} ${id}`); linhas.push({pagina, id, area: 'novo', estado: 'novo (autorizado)'}); }
      else if (exigirDeclaracao) { falhas.push(`bloco NOVO não declarado: ${pagina} ${id}`); linhas.push({pagina, id, area: 'novo', estado: 'NOVO sem autorização'}); }
      else { avisos.push('bloco novo: ' + pagina + ' ' + id); linhas.push({pagina, id, area: 'novo', estado: 'novo'}); }
    }
  }
  for (const k of declaradas.keys()) if (!usadas.has(k)) falhas.push('a autorização declara uma mudança que não aconteceu: ' + k.replace('|', ' '));
  for (const k of remocoes) if (!usadas.has(k)) falhas.push('a autorização declara uma remoção que não aconteceu: ' + k.replace('|', ' '));
  for (const id of M.compartilhados) {
    const a = res['index.html'].get(id), p = res['professor.html'].get(id);
    if (a && p && a !== p) falhas.push(`PARIDADE: o componente compartilhado ${id} ficou diferente entre aluno e professor`);
  }
}

function conferirBase(aut, M, falhas) {
  if (!aut) return;
  const r = M.referencia;
  if (aut.base?.referencia !== r.id || aut.base?.impressao !== r.impressao)
    falhas.push(`a autorização (${aut.fonte}) parte de ${aut.base?.referencia || aut.base?.versao || '?'} (${String(aut.base?.impressao || aut.base?.sha256 || '').slice(0, 12)}), não da referência ${r.id} (${r.impressao.slice(0, 12)})`);
}

function verificarCompleto(pacote, arquivo, M, o) {
  const falhas = [], avisos = [], linhas = [];
  const r = M.referencia, c = M.canonico;
  for (const k of ['appId', 'bridgeVersion', 'dataSchema']) if (pacote[k] !== c[k]) falhas.push(`${k} é ${pacote[k]}, a referência tem ${c[k]}`);
  const mv = /^1\.12\.(\d+)$/.exec(pacote.version || '');
  if (!mv) falhas.push('versão fora do padrão 1.12.N: ' + pacote.version);
  else if (pacote.sequence !== Number(mv[1]) + 106) falhas.push(`divergência de sequência: ${pacote.version} devia ter sequência ${Number(mv[1]) + 106} (versão + 106), tem ${pacote.sequence}`);
  for (const p of L.PAGINAS) if (typeof pacote.files?.[p] !== 'string') falhas.push('página ausente: ' + p);
  const res = L.hashesDoPacote(pacote);
  const igual = L.PAGINAS.every(p => Object.entries(M.blocos[p]).every(([id, v]) => res[p].get(id) === v.hash) && res[p].size === Object.keys(M.blocos[p]).length);
  if (igual && pacote.sequence === r.sequencia_efetiva) return {falhas, avisos, linhas: [], resumo: 'idêntico à referência ' + r.id};
  // Reassinar, byte a byte, um passo já aprovado da cadeia que não é anterior ao instalado no Tiago (hoje 1.12.294 e 1.12.295) não é
  // regressão: é o caminho para levar até a referência um aparelho que ainda está atrás dela (os artefatos assinados expiram).
  const passo = M.pacotes.find(p => p.tipo === 'pacote-completo' && p.sha256 === o.sha256);
  // Só vale para passo que não passa da referência: um passo proposto DEPOIS dela (já classificado na cadeia, mas ainda não assinado,
  // como no fluxo em que o pacote e a classificação chegam no mesmo PR) passa pela conferência completa abaixo.
  if (passo && passo.sequencia >= c.sequencia && passo.sequencia <= r.sequencia_efetiva && falhas.length === 0) {
    avisos.push(`reassinatura do passo ${passo.versao} da cadeia, idêntico byte a byte; é ANTERIOR à referência ${r.id}: instalar só em aparelho que ainda não tem a referência (sobre ela o app avisa "Revisar restauração")`);
    return {falhas, avisos, linhas: [], resumo: `passo conhecido da cadeia ${passo.versao} (reassinatura)`};
  }
  if (pacote.sequence <= r.sequencia_efetiva) {
    const conhecido = M.pacotes.find(p => p.tipo === 'pacote-completo' && p.versao === pacote.version);
    falhas.push(`pacote completo REGRESSIVO: sequência ${pacote.sequence} (${pacote.version}) não é maior que a efetiva da referência ${r.sequencia_efetiva} (${r.versao_efetiva}, ${r.id}); instalado por cima, voltaria o conteúdo para trás` + (conhecido ? ` (é o ${conhecido.versao} da cadeia)` : '') + `. Próxima livre: ${r.proxima_versao_livre}/${r.proxima_sequencia_livre}`);
  }
  const aut = autorizacao(arquivo, pacote, o.autorizacoes);
  if (o.modo === 'pr' && !aut) falhas.push(`sem autorização (alteracoes-autorizadas/${pacote.version}.json ou ${path.basename(arquivo).replace(/\.agenda\.json$/, '.autorizacao.json')})`);
  if (aut && (aut.versao !== pacote.version || aut.sequencia !== pacote.sequence)) falhas.push(`a autorização é para ${aut.versao}/${aut.sequencia}, o pacote é ${pacote.version}/${pacote.sequence}`);
  conferirBase(aut, M, falhas);
  conferirEstado(res, M, aut, falhas, avisos, linhas, o.modo === 'pr');
  return {falhas, avisos, linhas, resumo: `pacote completo ${pacote.version} (seq ${pacote.sequence}) contra a referência ${r.id}`};
}

function verificarCorrecao(patch, arquivo, M, o) {
  const falhas = [], avisos = [], linhas = [];
  if (patch.appId !== M.canonico.appId) falhas.push('appId diferente: ' + patch.appId);
  const res = {};
  for (const p of L.PAGINAS) res[p] = new Map(Object.entries(M.blocos[p]).map(([id, v]) => [id, v.hash]));
  const situacoes = [];
  for (const m of patch.changes || []) {
    const v = M.blocos[m.page]?.[m.id];
    if (L.sha256(m.content || '') !== m.after) falhas.push(`o conteúdo de ${m.page} ${m.id} não tem o hash "depois" declarado (o app recusaria)`);
    if (!v) { falhas.push(`a correção mexe em ${m.page} ${m.id}, que não existe na referência`); situacoes.push('ausente'); continue; }
    if (v.vezes > 1) falhas.push(`${m.page} ${m.id} aparece ${v.vezes} vezes: o app recusa correção por área nele`);
    const s = v.hash === m.after ? 'presente' : v.hash === m.before ? 'aplicavel' : 'conflito';
    if (s === 'conflito') {
      const cor = M.correcoes.find(c => c.mudancas.some(x => x.pagina === m.page && x.id === m.id && x.antes === m.before && x.depois === m.after && x.situacao_no_canonico === 'evoluida'));
      falhas.push(`CONFLITO de pré-condição: ${m.page} ${m.id} (área ${v.area}) na referência tem ${v.hash.slice(0, 12)}; a correção espera ${String(m.before).slice(0, 12)}.` +
        (cor ? ' Esta mudança já está na referência, continuada por outra correção da main (situação "evoluída"): o app a recusaria; não há o que assinar.' : ' Nunca sobrescrever: refazer a correção sobre o conteúdo atual'));
    }
    if (s === 'aplicavel') res[m.page].set(m.id, m.after);
    situacoes.push(s);
    linhas.push({pagina: m.page, id: m.id, area: v.area, estado: s});
  }
  for (const id of M.compartilhados) {
    const lista = (patch.changes || []).filter(m => m.id === id);
    if (!lista.length) continue;
    const pag = new Set(lista.map(m => m.page));
    if (['index.html', 'professor.html'].filter(p => M.blocos[p]?.[id]).some(p => !pag.has(p))) falhas.push(`PARIDADE: ${id} é compartilhado e a correção não muda as duas cópias (aluno e professor)`);
  }
  const todasPresentes = situacoes.length > 0 && situacoes.every(s => s === 'presente');
  if (!todasPresentes && !falhas.some(f => f.startsWith('CONFLITO'))) {
    const aut = autorizacao(arquivo, patch, o.autorizacoes);
    conferirBase(aut, M, falhas);
    const sub = [];
    conferirEstado(res, M, aut, falhas, avisos, sub, o.modo === 'pr');
    for (const l of sub.filter(l => l.estado !== 'igual')) linhas.push({...l, estado: 'resultado: ' + l.estado});
  }
  const resumo = todasPresentes ? 'já presente na referência (reimportar é ignorado: idempotente)'
    : situacoes.every(s => s === 'aplicavel') ? 'aplicável à referência' : 'misto: ' + situacoes.join(', ');
  return {falhas, avisos, linhas, resumo: `correção por área "${patch.title || patch.id}": ${resumo}`};
}

function verificarArquivo(arquivo, M, o) {
  let dado;
  try { dado = L.lerJson(arquivo); } catch (e) { return {arquivo: path.basename(arquivo), falhas: ['não é JSON válido: ' + e.message], avisos: [], linhas: [], resumo: ''}; }
  const sha256 = L.sha256Bytes(fs.readFileSync(arquivo));
  const r = String(dado.format).startsWith('agenda-patch/') ? verificarCorrecao(dado, arquivo, M, o) : verificarCompleto(dado, arquivo, M, {...o, sha256});
  return {arquivo: path.basename(arquivo), sha256, ...r};
}

function porArea(linhas) {
  const a = {};
  for (const l of linhas) { const x = (a[l.area] ||= {}); x[l.estado] = (x[l.estado] || 0) + 1; }
  return a;
}

function main() {
  const o = args(process.argv.slice(2));
  if (!o.arquivos.length) { console.error('uso: node verificar-pacote.cjs [--modo pr|assinatura] arquivo.agenda.json ...'); process.exit(2); }
  const M = L.lerJson(o.manifesto);
  console.log(`Referência: ${M.referencia.id} (efetiva ${M.referencia.versao_efetiva}/${M.referencia.sequencia_efetiva}); canônico instalado: ${M.canonico.versao}; modo ${o.modo}`);
  const resultados = o.arquivos.map(a => verificarArquivo(a, M, o));
  let ruim = 0;
  for (const r of resultados) {
    console.log(`\n== ${r.arquivo} (${(r.sha256 || '').slice(0, 12)})  ${r.resumo}`);
    for (const [area, estados] of Object.entries(porArea(r.linhas)).sort()) console.log(`   área ${area.padEnd(11)} ${Object.entries(estados).map(([e, n]) => n + ' ' + e).join(', ')}`);
    for (const l of r.linhas.filter(l => l.estado !== 'igual')) console.log(`   ${l.estado.padEnd(24)} ${l.pagina} ${l.id}`);
    for (const a of r.avisos) console.log('   aviso: ' + a);
    for (const f of r.falhas) console.log('   REPROVA: ' + f);
    console.log(r.falhas.length ? `   RESULTADO: REPROVADO (${r.falhas.length})` : '   RESULTADO: aprovado');
    if (r.falhas.length) ruim++;
  }
  if (o.json) fs.writeFileSync(o.json, JSON.stringify({referencia: M.referencia, modo: o.modo, resultados: resultados.map(r => ({...r, areas: porArea(r.linhas)}))}, null, 1));
  process.exit(ruim ? 1 : 0);
}

if (require.main === module) main();
module.exports = {verificarArquivo, verificarCompleto, verificarCorrecao, autorizacao};
