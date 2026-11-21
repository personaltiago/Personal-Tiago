'use strict';
// Escreve equipe/canonico/INVENTARIO.md a partir de manifesto.json: situação de cada pacote (seis estados), cada funcionalidade e
// correção por área no canônico e nos pacotes posteriores (incorporada, evoluída, ausente, conflito), relação com os PRs, paridade por
// área entre o canônico e cada posterior, paridade aluno/professor dos componentes compartilhados e a investigação da Raposinha.
// Uso (da raiz): node equipe/canonico/relatorio.cjs [--conferir]
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const L = require('./lib.cjs');
const {locateMain} = require('../testes/arquivos-da-main.cjs');

const M = L.lerJson(path.join(__dirname, 'manifesto.json'));
const SAIDA = path.join(__dirname, 'INVENTARIO.md');
// PR -> versão do conteúdo (só os que viraram pacote). Fonte: títulos dos PRs e equipe/relatorios/.
const PRS = [
  [4, 'chatgpt/modo-telefone', '1.12.273', 'Modo telefone e "Guardar a agenda no telefone" (ChatGPT)'],
  [5, 'chatgpt/mural-feedback-turma', null, 'Mural da turma (engavetado; nunca virou pacote)'],
  [6, 'claude/testar-regras-mural', null, 'Testes das regras do mural (sem pacote)'],
  [7, 'claude/mural-limite-diario', null, 'Limite diário do mural (sem pacote)'],
  [8, 'claude/grupo-turma-whatsapp', '1.12.278', 'Grupo da turma'],
  [9, 'claude/voltar-cadastrar-aluno', null, 'Voltar em Cadastrar aluno (PR fechado; substituído pelo #10)'],
  [10, 'claude/voltar-passo-a-passo', '1.12.281', 'Voltar passo a passo (1.12.280 nunca subiu; entrou junto no 1.12.281)'],
  [11, 'claude/links-visual-anamnese-planos', '1.12.281', 'Links dos alunos'],
  [12, 'claude/feedback-aluno-7-compartilhar', '1.12.282', 'Feedback do aluno'],
  [13, 'claude/alunos-para-aprovar', '1.12.283', 'Alunos para aprovar'],
  [14, 'claude/lista-de-alunos', '1.12.285', 'Lista de alunos (o 1.12.284 foi substituído pelo 1.12.285 com o mesmo nome de arquivo)'],
  [15, 'claude/lista-alunos-excluidos', '1.12.285', 'Excluídos da lista'],
  [16, 'claude/recados-modo-claro', '1.12.286', 'Recados no modo claro'],
  [17, 'claude/catalogo-janela-pagina', '1.12.288', 'Catálogo como página (1.12.287 nunca subiu; entrou no 1.12.288)'],
  [18, 'claude/janelas-como-pagina', '1.12.288', 'Janelas como página'],
  [19, 'claude/correcoes-exercicios', '1.12.291', 'Correções de exercícios 01/02/03 dentro do pacote completo'],
  [20, 'claude/sininho-feedback', '1.12.292', 'Sino do feedback no topo'],
  [21, 'claude/icone-feedback', '1.12.294', 'Ícone do feedback personalizável'],
  [24, 'claude/feedback-topo', '1.12.295', 'Feedback pelo ícone do topo (o complemento "Feedback somente no topo", subido em 3ab3556, não veio de PR)'],
];

function carregar() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-inventario-'));
  const out = {};
  // colunas: o canônico instalado, os pacotes completos posteriores e a referência (último passo assinado, completo ou complemento)
  let ultimo = null;
  for (const p of M.pacotes.filter(p => p.sequencia >= M.canonico.sequencia)) {
    if (p.tipo === 'pacote-completo') out[p.versao] = ultimo = L.lerJson(locateMain(p.arquivo, p.sha256, tmp));
    else out['referência ' + p.versao] = ultimo = L.aplicarCorrecao(ultimo, L.lerJson(locateMain(p.arquivo, p.sha256, tmp)));
  }
  const cor = {};
  for (const c of M.correcoes) cor[c.arquivo] = L.lerJson(locateMain(c.arquivo, c.sha256, tmp));
  fs.rmSync(tmp, {recursive: true, force: true});
  return {pacotes: out, correcoes: cor};
}

function relatorio() {
  const {pacotes} = carregar();
  const alvos = Object.keys(pacotes).sort((a, b) => pacotes[a].sequence - pacotes[b].sequence);
  const blocosDe = {};
  for (const v of alvos) { blocosDe[v] = {}; for (const pg of L.PAGINAS) blocosDe[v][pg] = L.blocos(pacotes[v].files[pg]); }
  const linhas = [];
  const w = s => linhas.push(s);
  w('# Inventário do conteúdo do Agenda Personal (gerado)');
  w('');
  w('Gerado por `equipe/canonico/relatorio.cjs` a partir de `equipe/canonico/manifesto.json`. Não editar à mão. **Canônico instalado: ' + M.canonico.versao + '** (sequência ' + M.canonico.sequencia + ', `' + M.canonico.arquivo + '`, SHA-256 `' + M.canonico.sha256 + '`). ' + M.canonico.motivo);
  w('');
  w('**Referência (o que nenhuma atualização nova pode perder): `' + M.referencia.id + '`** = último passo assinado (`' + M.referencia.arquivo + '`, SHA-256 `' + M.referencia.sha256 + '`), numeração efetiva no aparelho ' + M.referencia.versao_efetiva + '/' + M.referencia.sequencia_efetiva + '. **Próxima versão livre para pacote completo: ' + M.referencia.proxima_versao_livre + ' / sequência ' + M.referencia.proxima_sequencia_livre + '.**');
  w('');
  w('## 1. Passos da cadeia: pacotes completos e complementos (seis estados independentes)');
  w('');
  w('| Versão | Seq | Tipo | Arquivo (SHA-256) | Origem | Proposto | Aprovado | Assinado | Publicado | Instalado | Validado |');
  w('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const p of M.pacotes) w(`| ${p.versao} | ${p.sequencia} | ${p.tipo === 'complemento' ? 'complemento sobre o ' + p.base + ' (numeração do app)' : 'completo'} | ${p.arquivo.replace('AgendaPersonal-', '').replace('.agenda.json', '')} (\`${p.sha256.slice(0, 12)}\`) | ${p.origem} | ${p.status.proposto} | ${p.status.aprovado} | ${p.status.assinado} | ${p.status.publicado} | ${p.status.instalado} | ${p.status.validado} |`);
  w('');
  w('"publicado" = distribuído ao app web dos alunos ou ao repositório de distribuição; nenhuma evidência disso foi verificada pelo Claude.');
  w('');
  w('## 2. Funcionalidades por versão: incorporada, evoluída ou ausente');
  w('');
  w('Cada funcionalidade é o conjunto de blocos que o passo (pacote completo ou complemento) mudou em relação à anterior da cadeia (identificador estável `pacote-<versão>-<título>`). "evoluída" = uma versão posterior continuou o mesmo bloco; "AUSENTE" = o bloco não está como nenhuma versão posterior o deixou.');
  w('');
  w('| Funcionalidade | Versão | Blocos | Depende de | ' + alvos.join(' | ') + ' |');
  w('|---|---|---|---|' + alvos.map(() => '---').join('|') + '|');
  for (const f of M.funcionalidades) {
    const col = alvos.map(v => {
      if (pacotes[v].sequence < f.sequencia) return 'posterior';
      if (pacotes[v].sequence === f.sequencia && !v.startsWith('referência') && f.tipo === 'complemento') return 'posterior';
      let inc = 0, evo = 0, aus = 0;
      for (const b of f.blocos) {
        const atual = blocosDe[v][b.pagina].get(b.id);
        if (b.depois === null) { atual ? aus++ : inc++; continue; }
        if (atual?.hash === b.depois) { inc++; continue; }
        const depois = M.funcionalidades.some(g => g.sequencia > f.sequencia && g.sequencia <= pacotes[v].sequence && g.blocos.some(x => x.pagina === b.pagina && x.id === b.id));
        depois ? evo++ : aus++;
      }
      return aus ? `**AUSENTE ${aus}**` : evo ? `ok (${evo} evoluído${evo > 1 ? 's' : ''})` : 'incorporada';
    });
    w(`| \`${f.id}\` | ${f.versao} | ${f.blocos.map(b => b.pagina.replace('.html', '') + ':' + b.id).join(', ')} | ${f.depende_de.map(d => '`' + d + '`').join(', ') || '—'} | ${col.join(' | ')} |`);
  }
  w('');
  w('## 3. Correções por área da raiz da main');
  w('');
  w('| Correção (id) | Arquivo | Área/módulo | Blocos | ' + alvos.join(' | ') + ' |');
  w('|---|---|---|---|' + alvos.map(() => '---').join('|') + '|');
  for (const c of M.correcoes) {
    const col = alvos.map(v => {
      const s = c.mudancas.map(m => {
        const h = blocosDe[v][m.pagina].get(m.id)?.hash;
        if (h === m.depois) return 'presente';
        if (h === m.antes) return 'aplicável';
        if (m.situacao_no_canonico === 'evoluida' && h === M.blocos[m.pagina][m.id]?.hash) return 'evoluída';
        return 'conflito';
      });
      const u = [...new Set(s)];
      return u.length === 1 ? (u[0] === 'conflito' ? '**conflito**' : u[0]) : u.join('+');
    });
    w(`| \`${c.id}\` | ${c.arquivo.replace('AgendaPersonal-', '').replace('.agenda.json', '')} | ${c.area}/${c.modulo} | ${c.mudancas.map(m => m.pagina.replace('.html', '') + ':' + m.id).join(', ')} | ${col.join(' | ')} |`);
  }
  w('');
  w('## 4. Pull Requests');
  w('');
  w('Nenhum PR foi juntado à `main` (conferido pela API em 20/11): o conteúdo chegou ao aparelho pelos pacotes subidos à mão. A coluna diz se o que o PR entregou está no canônico.');
  w('');
  w('| PR | Branch | Pacote | No canônico ' + M.canonico.versao + ' |');
  w('|---|---|---|---|');
  for (const [n, br, v, t] of PRS) {
    let s = 'não virou pacote';
    if (v) {
      const p = M.pacotes.find(x => x.versao === v);
      if (p.sequencia > M.canonico.sequencia) s = 'ainda não instalado (posterior ao canônico; assinado: ' + p.status.assinado.split(':')[0] + '); faz parte da referência';
      else { const f = M.funcionalidades.find(x => x.versao === v); s = f ? 'incorporado (ver seção 2: `' + f.id + '`)' : 'incorporado (base da cadeia)'; }
    }
    w(`| #${n} | \`${br}\` | ${v || '—'} | ${t}: ${s} |`);
  }
  w('');
  const canonBlocos = {};
  for (const pg of L.PAGINAS) canonBlocos[pg] = Object.fromEntries([...blocosDe[M.canonico.versao][pg]].map(([id, b]) => [id, {hash: b.hash, area: L.areaDoBloco(L.regrasDoApp(), pg, id)}]));
  w('## 5. Paridade por área: canônico instalado x passos posteriores');
  w('');
  const regras = L.regrasDoApp();
  for (const v of alvos.filter(v => v !== M.canonico.versao)) {
    const porArea = {};
    for (const pg of L.PAGINAS) {
      const canon = canonBlocos[pg], b = blocosDe[v][pg];
      for (const [id, x] of Object.entries(canon)) { const a = (porArea[x.area] ||= {iguais: 0, alterados: [], removidos: [], novos: []}); const y = b.get(id); if (!y) a.removidos.push(pg + ':' + id); else if (y.hash === x.hash) a.iguais++; else a.alterados.push(pg + ':' + id); }
      for (const [id] of b) if (!canon[id]) { const area = L.areaDoBloco(regras, pg, id); (porArea[area] ||= {iguais: 0, alterados: [], removidos: [], novos: []}).novos.push(pg + ':' + id); }
    }
    w(`### ${M.canonico.versao} → ${v}`);
    w('');
    w('| Área | Iguais | Alterados | Removidos | Novos |');
    w('|---|---|---|---|---|');
    for (const [area, a] of Object.entries(porArea).sort()) w(`| ${area} | ${a.iguais} | ${a.alterados.join(', ') || '0'} | ${a.removidos.join(', ') || '0'} | ${a.novos.join(', ') || '0'} |`);
    w('');
  }
  w('## 6. Componentes compartilhados (aluno x professor)');
  w('');
  w('| Componente | ' + alvos.join(' | ') + ' |');
  w('|---|' + alvos.map(() => '---').join('|') + '|');
  for (const id of M.compartilhados) w(`| \`${id}\` | ` + alvos.map(v => { const a = blocosDe[v]['index.html'].get(id), p = blocosDe[v]['professor.html'].get(id); return !a && !p ? 'ausente nos dois' : !a || !p ? 'só ' + (a ? 'aluno' : 'professor') : a.hash === p.hash ? 'igual' : '**DIFERENTE**'; }).join(' | ') + ' |');
  w('');
  w('## 7. Raposinha (`AgendaPersonal-Pets-Raposinha.agenda.json`)');
  w('');
  const rap = M.correcoes.find(c => c.arquivo.includes('Raposinha'));
  for (const m of rap.mudancas) {
    const hist = M.historico[m.pagina + '|' + m.id] || [];
    const espera = hist.find(h => h.hash === m.antes);
    w(`- \`${m.pagina} ${m.id}\`: a correção espera \`${String(m.antes).slice(0, 12)}\` (${espera ? 'era o conteúdo desde ' + espera.desde : 'conteúdo que nenhum pacote completo da cadeia teve'}) e deixa \`${m.depois.slice(0, 12)}\`; no canônico é \`${M.blocos[m.pagina][m.id]?.hash.slice(0, 12)}\` → **${m.situacao_no_canonico}**. Hashes que o bloco teve na cadeia: ${hist.map(h => '`' + h.hash.slice(0, 8) + '` desde ' + h.desde).join(', ')}.`);
  }
  // De onde vem o "antes" do modelo dos mascotes que a Raposinha espera: o 1.12.255 (anterior à cadeia) ainda tinha o Galo, removido e
  // aprovado na 1.195; o conteúdo-base do APK (1.12.269) e toda a cadeia já têm o modelo sem ele.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-raposa-'));
  const p255 = L.lerJson(locateMain('AgendaPersonal-1.12.255-Verificar-Para-Assinar.agenda.json', '0cdb38d1d776a86794f884048eb2ae4373c01304df3a73582ba2660736136bc3', tmp));
  fs.rmSync(tmp, {recursive: true, force: true});
  const modelo = rap.mudancas.find(m => m.id === 'ap-student-mascot-model');
  const b255 = L.blocos(p255.files['index.html']).get('ap-student-mascot-model');
  const t255 = p255.files['index.html'].slice(b255.inicio, b255.fim);
  w('');
  w(`Origem do conflito: o "antes" que a Raposinha espera em \`ap-student-mascot-model\` ${b255.hash === modelo.antes ? 'é exatamente o do pacote **1.12.255**' : 'não é o do 1.12.255'} (main, \`AgendaPersonal-1.12.255-Verificar-Para-Assinar.agenda.json\`), cujo modelo dos mascotes ainda cita o Galo (${(t255.match(/rooster|galo/gi) || []).length} ocorrências de "rooster"/"galo"). O conteúdo-base do APK (1.12.269) e toda a cadeia 1.12.273 → ${M.canonico.versao} têm o modelo depois da retirada do Urso e do Galo (aprovada na 1.195). Por isso o app recusa.`);
  w('');
  w('Conclusão: a Raposinha foi feita sobre um conteúdo de pets anterior à cadeia. Aplicar à força as mudanças dela trocaria o modelo dos mascotes atual pelo dela, montado sobre o modelo antigo: risco [H] de trazer de volta o que foi retirado na 1.195. O app recusa a correção inteira ("Conflito em ap-student-mascot-model") e não aplica as outras três mudanças. Ela **nunca esteve** em nenhum pacote completo da cadeia. Integrar exige refazer as quatro mudanças sobre o conteúdo atual dos mascotes, revisar os mascotes aprovados (Gato, Lobo, Capivara; Urso e Galo removidos na 1.195) e testar no aparelho: **decisão pendente do Tiago; nada foi alterado nos mascotes**.');
  w('');
  return linhas.join('\n') + '\n';
}

if (require.main === module) {
  const texto = relatorio();
  if (process.argv.includes('--conferir')) {
    if (!fs.existsSync(SAIDA) || fs.readFileSync(SAIDA, 'utf8') !== texto) { console.error('INVENTARIO.md não confere com o manifesto. Rode: node equipe/canonico/relatorio.cjs'); process.exit(1); }
    console.log('INVENTARIO.md confere com o manifesto');
  } else { fs.writeFileSync(SAIDA, texto); console.log(SAIDA); }
}
