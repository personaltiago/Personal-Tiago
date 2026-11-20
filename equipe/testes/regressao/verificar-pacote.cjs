'use strict';
// Verificador de regressão de pacotes do Agenda Personal (pacote completo .agenda.json formato 1 ou correção por área agenda-patch/1|2).
// Compara o arquivo com a FONTE CANÔNICA (equipe/canonico/manifesto.json) e REPROVA (código 1) quando:
//  - é um pacote completo com sequência menor ou igual à do canônico e conteúdo diferente (pacote antigo/regressivo), ou um pacote
//    conhecido da cadeia anterior ao canônico; ou appId, ponte, esquema de dados ou a regra sequência = versão + 106 divergem;
//  - um bloco que existe no canônico some (remoção) sem estar em "remocoes" da autorização;
//  - um bloco volta a um hash ANTERIOR da cadeia (reversão) sem estar em "reversoes" da autorização;
//  - uma correção por área da main que está presente (ou evoluída) no canônico deixa de estar (perda de correção aprovada);
//  - um componente compartilhado (UpdateAreaPatch.SHARED) fica diferente entre aluno e professor;
//  - modo "pr": um bloco muda ou nasce sem estar declarado na autorização, ou a autorização diverge do pacote (hash "antes" que não é o
//    do canônico = partiu de um retrato velho; hash "depois" diferente; mudança declarada que não aconteceu);
//  - correção por área: uma mudança não encontra o bloco como espera (conflito de pré-condição), toca um bloco que não existe, leva um
//    bloco de volta a um hash antigo, ou muda só uma cópia de um bloco compartilhado.
// No modo "assinatura" (antes de assinar), mudança nova não declarada só aparece no relatório (o upload do Tiago é a aprovação dela);
// remoção, reversão, perda de correção, pacote antigo e divergência de paridade reprovam sempre.
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

function autorizacao(dir, versao) {
  const f = path.join(dir, versao + '.json');
  return fs.existsSync(f) ? L.lerJson(f) : null;
}

const chaveDe = (pagina, id) => pagina + '|' + id;

function verificarCompleto(pacote, nome, M, aut, modo) {
  const falhas = [], avisos = [], linhas = [];
  const c = M.canonico;
  for (const k of ['appId', 'bridgeVersion', 'dataSchema']) if (pacote[k] !== c[k]) falhas.push(`${k} é ${pacote[k]}, o canônico tem ${c[k]}`);
  const mv = /^1\.12\.(\d+)$/.exec(pacote.version || '');
  if (!mv) falhas.push('versão fora do padrão 1.12.N: ' + pacote.version);
  else if (pacote.sequence !== Number(mv[1]) + 106) falhas.push(`divergência de sequência: ${pacote.version} devia ter sequência ${Number(mv[1]) + 106} (versão + 106), tem ${pacote.sequence}`);
  const conhecido = M.pacotes.find(p => p.versao === pacote.version);
  const paginasIguais = L.PAGINAS.every(p => {
    const canon = M.blocos[p]; const b = L.blocos(pacote.files?.[p] || '');
    return Object.entries(canon).every(([id, v]) => b.get(id)?.hash === v.hash) && b.size === Object.keys(canon).length;
  });
  if (pacote.version === c.versao && pacote.sequence === c.sequencia && paginasIguais) {
    return {falhas, avisos, linhas: [], resumo: 'idêntico ao canônico ' + c.versao};
  }
  if (pacote.sequence <= c.sequencia) falhas.push(`pacote completo REGRESSIVO: sequência ${pacote.sequence} (${pacote.version}) não é maior que a do canônico ${c.sequencia} (${c.versao}); instalado por cima, voltaria o conteúdo para trás`);
  if (conhecido && conhecido.sequencia < c.sequencia) falhas.push(`é o pacote ${conhecido.versao} da cadeia, anterior ao canônico ${c.versao}`);
  if (modo === 'pr' && !aut) falhas.push(`sem autorização equipe/canonico/alteracoes-autorizadas/${pacote.version}.json (o que muda, por quê, quem aprovou)`);
  if (aut) {
    if (aut.versao !== pacote.version || aut.sequencia !== pacote.sequence) falhas.push(`a autorização é para ${aut.versao}/${aut.sequencia}, o pacote é ${pacote.version}/${pacote.sequence}`);
    if (aut.base?.versao !== c.versao || aut.base?.sha256 !== c.sha256) falhas.push(`a autorização parte de ${aut.base?.versao} (${(aut.base?.sha256 || '').slice(0, 12)}), não do canônico ${c.versao} (${c.sha256.slice(0, 12)})`);
  }
  const declaradas = new Map((aut?.alteracoes || []).map(a => [chaveDe(a.pagina, a.id), a]));
  const remocoes = new Set((aut?.remocoes || []).map(a => chaveDe(a.pagina, a.id)));
  const reversoes = new Set((aut?.reversoes || []).map(a => chaveDe(a.pagina, a.id)));
  const usadas = new Set();
  const atual = {};
  for (const pagina of L.PAGINAS) {
    const b = atual[pagina] = L.blocos(pacote.files?.[pagina] || '');
    if (!pacote.files?.[pagina]) falhas.push('página ausente: ' + pagina);
    const canon = M.blocos[pagina];
    for (const [id, v] of Object.entries(canon)) {
      const k = chaveDe(pagina, id), novo = b.get(id);
      if (!novo) {
        if (remocoes.has(k)) { usadas.add(k); linhas.push({pagina, id, area: v.area, estado: 'removido (autorizado)'}); }
        else { falhas.push(`REMOÇÃO não autorizada: ${pagina} ${id} (área ${v.area}) existe no canônico e sumiu`); linhas.push({pagina, id, area: v.area, estado: 'REMOVIDO'}); }
        continue;
      }
      if (novo.hash === v.hash) { linhas.push({pagina, id, area: v.area, estado: 'igual'}); continue; }
      const antigo = (M.historico[k] || []).find(h => h.hash === novo.hash);
      if (antigo && !reversoes.has(k)) {
        falhas.push(`REVERSÃO: ${pagina} ${id} (área ${v.area}) voltou ao conteúdo de ${antigo.desde}; no canônico ${M.canonico.versao} ele é outro`);
        linhas.push({pagina, id, area: v.area, estado: 'REVERTIDO para ' + antigo.desde}); continue;
      }
      const d = declaradas.get(k);
      if (d) {
        usadas.add(k);
        if (d.antes !== v.hash) falhas.push(`DIVERGÊNCIA DE HASH: a autorização diz que ${pagina} ${id} parte de ${String(d.antes).slice(0, 12)}, mas no canônico é ${v.hash.slice(0, 12)} (partiu de um retrato velho?)`);
        if (d.depois !== novo.hash) falhas.push(`DIVERGÊNCIA DE HASH: a autorização diz que ${pagina} ${id} fica ${String(d.depois).slice(0, 12)}, mas no pacote é ${novo.hash.slice(0, 12)}`);
        linhas.push({pagina, id, area: v.area, estado: 'alterado (autorizado)'});
      } else if (modo === 'pr') {
        falhas.push(`alteração NÃO declarada: ${pagina} ${id} (área ${v.area})`); linhas.push({pagina, id, area: v.area, estado: 'ALTERADO sem autorização'});
      } else { avisos.push(`alterado (sem autorização versionada; vale o upload do Tiago): ${pagina} ${id}`); linhas.push({pagina, id, area: v.area, estado: 'alterado'}); }
    }
    for (const [id] of b) if (!canon[id]) {
      const k = chaveDe(pagina, id), d = declaradas.get(k);
      if (d) { usadas.add(k); if (d.antes !== null || d.depois !== b.get(id).hash) falhas.push(`DIVERGÊNCIA DE HASH no bloco novo ${pagina} ${id}`); linhas.push({pagina, id, area: 'novo', estado: 'novo (autorizado)'}); }
      else if (modo === 'pr') { falhas.push(`bloco NOVO não declarado: ${pagina} ${id}`); linhas.push({pagina, id, area: 'novo', estado: 'NOVO sem autorização'}); }
      else { avisos.push('bloco novo: ' + pagina + ' ' + id); linhas.push({pagina, id, area: 'novo', estado: 'novo'}); }
    }
  }
  for (const k of declaradas.keys()) if (!usadas.has(k)) falhas.push('a autorização declara uma mudança que não aconteceu: ' + k.replace('|', ' '));
  for (const k of remocoes) if (!usadas.has(k)) falhas.push('a autorização declara uma remoção que não aconteceu: ' + k.replace('|', ' '));
  // paridade dos compartilhados
  for (const id of M.compartilhados) {
    const a = atual['index.html'].get(id), p = atual['professor.html'].get(id);
    if (a && p && a.hash !== p.hash) falhas.push(`PARIDADE: o componente compartilhado ${id} ficou diferente entre aluno e professor`);
  }
  // correções da main
  const cache = new Map();
  for (const cor of M.correcoes) {
    if (!['presente', 'evoluida'].includes(cor.situacao_no_canonico)) continue;
    const perdidas = cor.mudancas.filter(m => {
      const s = L.situacaoMudanca(pacote, {page: m.pagina, id: m.id, before: m.antes, after: m.depois}, cache);
      if (s === 'presente') return false;
      if (m.situacao_no_canonico === 'evoluida') return atual[m.pagina].get(m.id)?.hash !== M.blocos[m.pagina][m.id]?.hash && !declaradas.has(chaveDe(m.pagina, m.id));
      return !declaradas.has(chaveDe(m.pagina, m.id));
    });
    if (perdidas.length) falhas.push(`CORREÇÃO PERDIDA: "${cor.titulo}" (${cor.arquivo}) está ${cor.situacao_no_canonico} no canônico e deixa de estar: ${perdidas.map(m => m.pagina + ' ' + m.id).join(', ')}`);
  }
  return {falhas, avisos, linhas, resumo: `pacote completo ${pacote.version} (seq ${pacote.sequence}) contra o canônico ${c.versao}`};
}

function verificarCorrecao(patch, nome, M) {
  const falhas = [], avisos = [], linhas = [];
  const c = M.canonico;
  if (patch.appId !== c.appId) falhas.push('appId diferente do canônico: ' + patch.appId);
  const situacoes = [];
  for (const m of patch.changes || []) {
    const v = M.blocos[m.page]?.[m.id];
    const k = chaveDe(m.page, m.id);
    if (!v) { falhas.push(`a correção mexe em ${m.page} ${m.id}, que não existe no canônico`); situacoes.push('ausente'); continue; }
    if (v.vezes > 1) falhas.push(`${m.page} ${m.id} aparece ${v.vezes} vezes: o app recusa correção por área nele`);
    let s;
    if (v.hash === m.after) s = 'presente';
    else if (v.hash === m.before) s = 'aplicavel';
    else s = 'conflito';
    const antigo = s === 'aplicavel' && (M.historico[k] || []).find(h => h.hash === m.after && h.hash !== v.hash);
    if (antigo) { falhas.push(`REVERSÃO: a correção leva ${m.page} ${m.id} de volta ao conteúdo de ${antigo.desde}`); s = 'reversao'; }
    if (s === 'conflito') {
      const cor = M.correcoes.find(c => c.mudancas.some(x => x.pagina === m.page && x.id === m.id && x.antes === m.before && x.depois === m.after && x.situacao_no_canonico === 'evoluida'));
      falhas.push(`CONFLITO de pré-condição: ${m.page} ${m.id} (área ${v.area}) no canônico tem ${v.hash.slice(0, 12)}; a correção espera ${String(m.before).slice(0, 12)}.` +
        (cor ? ' Esta mudança já está no canônico, continuada por outra correção da main (situação "evoluída"): o app a recusaria; não há o que assinar.' : ' Nunca sobrescrever: refazer a correção sobre o conteúdo atual'));
    }
    situacoes.push(s);
    linhas.push({pagina: m.page, id: m.id, area: v.area, estado: s});
  }
  for (const id of M.compartilhados) {
    const lista = (patch.changes || []).filter(m => m.id === id);
    if (!lista.length) continue;
    const pag = new Set(lista.map(m => m.page));
    const presentes = ['index.html', 'professor.html'].filter(p => M.blocos[p]?.[id]);
    if (presentes.some(p => !pag.has(p))) falhas.push(`PARIDADE: ${id} é compartilhado e a correção não muda as duas cópias (aluno e professor)`);
    if (new Set(lista.map(m => m.after)).size > 1) falhas.push(`PARIDADE: as cópias de ${id} ficariam diferentes entre aluno e professor`);
  }
  const resumo = situacoes.length && situacoes.every(s => s === 'presente') ? 'já presente no canônico (reimportar é ignorado: idempotente)'
    : situacoes.every(s => s === 'aplicavel') ? 'aplicável ao canônico' : 'misto: ' + situacoes.join(', ');
  return {falhas, avisos, linhas, resumo: `correção por área "${patch.title || patch.id}": ${resumo}`};
}

function verificarArquivo(arquivo, M, o) {
  let dado;
  try { dado = L.lerJson(arquivo); } catch (e) { return {arquivo, falhas: ['não é JSON válido: ' + e.message], avisos: [], linhas: [], resumo: ''}; }
  const nome = path.basename(arquivo);
  const r = String(dado.format).startsWith('agenda-patch/') ? verificarCorrecao(dado, nome, M) : verificarCompleto(dado, nome, M, autorizacao(o.autorizacoes, dado.version), o.modo);
  return {arquivo: nome, sha256: L.sha256Bytes(fs.readFileSync(arquivo)), ...r};
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
  const resultados = o.arquivos.map(a => verificarArquivo(a, M, o));
  let ruim = 0;
  for (const r of resultados) {
    console.log(`\n== ${r.arquivo} (${(r.sha256 || '').slice(0, 12)})  ${r.resumo}`);
    const areas = porArea(r.linhas);
    for (const [area, estados] of Object.entries(areas).sort()) console.log(`   área ${area.padEnd(11)} ${Object.entries(estados).map(([e, n]) => n + ' ' + e).join(', ')}`);
    for (const l of r.linhas.filter(l => l.estado !== 'igual')) console.log(`   ${l.estado.padEnd(24)} ${l.pagina} ${l.id}`);
    for (const a of r.avisos) console.log('   aviso: ' + a);
    for (const f of r.falhas) console.log('   REPROVA: ' + f);
    console.log(r.falhas.length ? `   RESULTADO: REPROVADO (${r.falhas.length})` : '   RESULTADO: aprovado');
    if (r.falhas.length) ruim++;
  }
  if (o.json) fs.writeFileSync(o.json, JSON.stringify({canonico: M.canonico, modo: o.modo, resultados: resultados.map(r => ({...r, areas: porArea(r.linhas)}))}, null, 1));
  process.exit(ruim ? 1 : 0);
}

if (require.main === module) main();
module.exports = {verificarArquivo, verificarCompleto, verificarCorrecao};
