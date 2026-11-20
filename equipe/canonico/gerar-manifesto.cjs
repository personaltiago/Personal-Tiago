'use strict';
// Gera equipe/canonico/manifesto.json: a fonte canônica versionada do conteúdo do app e o manifesto das funcionalidades.
// Entradas (todas conferidas pelo SHA-256; nenhuma é escolhida pelo nome ou pelo número da versão):
//  - a cadeia de pacotes completos conhecidos (CADEIA), da raiz da main ou refeitos pelos geradores (291 e 292);
//  - as correções por área (agenda-patch) da raiz da main (CORRECOES);
//  - equipe/canonico/status-pacotes.json: o que se sabe de cada pacote (proposto, aprovado, assinado, publicado, instalado, validado),
//    escrito à mão, com a evidência.
// Saída: o pacote CANÔNICO (o último assinado E instalado, ver status), o hash de cada bloco dele por página e área, o histórico de hashes
// de cada bloco na cadeia (para reconhecer uma reversão), as funcionalidades (uma por passo da cadeia e uma por correção por área),
// com identificador estável, versão, blocos, hashes e dependências, e a situação de cada correção da main no canônico.
// Uso (da raiz):  node equipe/canonico/gerar-manifesto.cjs [--conferir]
//   --conferir: não grava; falha se o manifesto versionado não for exatamente o que seria gerado agora (usado no CI).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const L = require('./lib.cjs');

const SAIDA = path.join(__dirname, 'manifesto.json');
const STATUS = path.join(__dirname, 'status-pacotes.json');

// Cadeia de pacotes completos, em ordem. "origem": main (arquivo na raiz, achado pelo SHA-256 também no histórico) ou gerador.
const CADEIA = [
  ['1.12.273', 'AgendaPersonal-1.12.273-Modo-Telefone-Para-Assinar.agenda.json', '8aa7535dd99f1d982409414eebe4ff40dbec04b07218f8e3f8a4098baa833553', 'main'],
  ['1.12.274', 'AgendaPersonal-1.12.274-Aviso-Recuperacao-Para-Assinar.agenda.json', 'c897216aed77dd2921c52b72d93a0971fd97c375bc95873d3b806e34479f513e', 'main'],
  ['1.12.276', 'AgendaPersonal-1.12.276-Links-Cadastro-Instalacao-Para-Assinar.agenda.json', '3f0d4cc0b312c596abfe26019a6765d56e40a8270c8ee574861127b813019b65', 'main'],
  ['1.12.278', 'AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json', 'eb97ba3c234e3a70b83019b5dd23a331ecc2ec70e4ae09396b4c3db5675fd7a6', 'main'],
  ['1.12.281', 'AgendaPersonal-1.12.281-Links-Visual-Anamnese-Planos-Para-Assinar.agenda.json', '643f5f9b6713a9b6d9240a614c11900d09c926cc25d58414664ec1d0ed47899d', 'main'],
  ['1.12.282', 'AgendaPersonal-1.12.282-Feedback-Aluno-Para-Assinar.agenda.json', 'f505ad6ad109812251a467417dd94d05ef2e7052def9d80eefc87ea34ea4e15e', 'main'],
  ['1.12.283', 'AgendaPersonal-1.12.283-Alunos-Para-Aprovar-Para-Assinar.agenda.json', '1fe1c35fa54acea352a10e688cde5345b7f9c36f30cf99cd1f8b75762c688620', 'main'],
  // Atenção: o arquivo tem o nome do 1.12.284, mas o conteúdo é o 1.12.285 (sequência 391). Vale o conteúdo, nunca o nome.
  ['1.12.285', 'AgendaPersonal-1.12.284-Lista-De-Alunos-Para-Assinar.agenda.json', '87d7fd05c2fcf33e729c332773ec65ea058f56c156894bc9a2c65a4caa9c8442', 'main'],
  ['1.12.286', 'AgendaPersonal-1.12.286-Recados-Modo-Claro-Para-Assinar.agenda.json', '7de8a60cdbba5d3f17d3d4072e76bb823017ef7427edf97ff015ab22317621e8', 'main'],
  ['1.12.288', 'AgendaPersonal-1.12.288-Janelas-Como-Pagina-Para-Assinar.agenda.json', '1f9b66c8cb8af792ed661c435d46ba2ee172306e6f4b38c298e38836b2d29f15', 'main'],
  ['1.12.291', 'AgendaPersonal-1.12.291-Exercicios-Incluidos-Para-Assinar.agenda.json', '7153e570e9d7307536059ede5f179a2f4735ddbbee7eac9e200242a3e58a9fa0', 'gerador'],
  ['1.12.292', 'AgendaPersonal-1.12.292-Sino-Feedback-Para-Assinar.agenda.json', '82f41147ea8b47609483817506756ed1c1560c0dc7c718eed83b8e0224e687fb', 'gerador'],
  ['1.12.294', 'AgendaPersonal-1.12.294-Icone-Feedback-Para-Assinar.agenda.json', '2bf38cc59b48a663e00da9faf8d2feb7ca48ae186ff833500c0a0e68fea230e9', 'main'],
  ['1.12.295', 'AgendaPersonal-1.12.295-Feedback-Topo-Para-Assinar.agenda.json', '031b8a55010063925bc37d213ebe74d818d4c5249981f2d273a57f4ef1e20185', 'main'],
];
// Correções por área da raiz da main. "esperado": a situação no canônico que o Tiago já conhece (presente, evoluída ou conflito).
const CORRECOES = [
  ['AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json', '2f35cc63a72403df04b9058ca28a42e7ad7bc685fbf1dce2277c09c4d96ea397'],
  ['AgendaPersonal-02-Baixar-Catalogo-Para-Assinar.agenda.json', 'bdfef91b00e0a6699d8e460bc1804ade1b1b7a7dd76fda540f7690a166b94950'],
  ['AgendaPersonal-03-Corrigir-Duplicatas-Catalogo-Para-Assinar.agenda.json', 'be415ec62e96d0c6a337da6b2d3153ba9a7d7b56c967b5a436fe518ee178a9cd'],
  ['AgendaPersonal-Apagar-Exercicio-do-Catalogo-Assinado.agenda.json', '7d3724d46ee4ba242571f1b857d0a5d47ae05a466d7063be0204541159a14375'],
  ['AgendaPersonal-Apagar-Exercicio-do-Catalogo.agenda.json', '0e5b7283321675b7f5d8a00c4ffb2efa8b9fa5772b7d9ecbf1ed357f8d3609ad'],
  ['AgendaPersonal-Pets-Raposinha.agenda.json', '84b0ede80c28d44ef04ecf7ab20a19191a6fd738ad865299b611c0c6cfbf8587'],
  ['AgendaPersonal-Pix-Comprovantes-Sem-Arquivos.agenda.json', '2f5ad122e4fd141d0fcc9db2938057718e287f6c0b7f9233c4bb65db5ecec5bc'],
  ['AgendaPersonal-Professor-Ficha-Recolhivel-253.agenda.json', '8eb9179bdc851637f8dbecc7669eec4c0bfc67f777222a85dfc94cdc4548afd8'],
  ['AgendaPersonal-Sininho-Cadastro-Professor-para-assinar.agenda.json', '97a1f3c989d8893cb8e7b6b1e277e1a238595737db7721da92dc0c2208dee9a9'],
  ['AgendaPersonal-Testar-Enviar-Sons-Treino-para-assinar.agenda.json', '85decba4e95464299ed6243d67b04d8169287138c1bcf14bf7259f3a3fa6e93e'],
];

const slug = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function achar(trabalho) {
  const {locateMain} = require(path.join(L.RAIZ, 'equipe/testes/arquivos-da-main.cjs'));
  const {locate291} = require(path.join(L.RAIZ, 'equipe/testes/pacote-291.cjs'));
  const {locate292} = require(path.join(L.RAIZ, 'equipe/testes/pacote-292.cjs'));
  const caminho = {};
  for (const [versao, nome, sha, origem] of CADEIA) {
    if (origem === 'main') caminho[versao] = locateMain(nome, sha, trabalho);
    else if (versao === '1.12.291') caminho[versao] = locate291(path.join(trabalho, 'p291'));
    else if (versao === '1.12.292') caminho[versao] = locate292(path.join(trabalho, 'p292'));
    if (L.sha256Bytes(fs.readFileSync(caminho[versao])) !== sha) throw new Error('SHA-256 diferente: ' + versao);
  }
  for (const [nome, sha] of CORRECOES) caminho[nome] = locateMain(nome, sha, trabalho);
  return caminho;
}

function gerar() {
  const trabalho = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-canonico-'));
  try {
    const caminho = achar(trabalho);
    const regras = L.regrasDoApp();
    const status = L.lerJson(STATUS);
    const canonicoVersao = status.canonico;
    if (!CADEIA.some(c => c[0] === canonicoVersao)) throw new Error('O canônico de status-pacotes.json não está na cadeia: ' + canonicoVersao);

    const pacotes = [], funcionalidades = [], historico = {};
    const dono = {}; // pagina|id|hash -> funcionalidade que deixou o bloco com esse hash
    let anterior = null;
    const seqCanonico = L.lerJson(caminho[canonicoVersao]).sequence;
    for (const [versao, nome, sha, origem] of CADEIA) {
      const p = L.lerJson(caminho[versao]);
      if (p.version !== versao) throw new Error('Versão do arquivo ' + nome + ' é ' + p.version + ', não ' + versao);
      const st = status.pacotes[versao];
      if (!st) throw new Error('status-pacotes.json não tem o ' + versao);
      pacotes.push({versao, sequencia: p.sequence, arquivo: nome, sha256: sha, origem, titulo: p.update?.title || '', status: st});
      const atual = {};
      for (const pagina of L.PAGINAS) atual[pagina] = L.blocos(p.files[pagina]);
      const id = 'pacote-' + versao.replace(/\./g, '-') + '-' + slug(p.update?.title || 'sem-titulo');
      const mudou = [];
      for (const pagina of L.PAGINAS) {
        const antes = anterior ? anterior[pagina] : new Map();
        for (const [bid, b] of atual[pagina]) {
          const chave = pagina + '|' + bid;
          // o histórico só guarda o que veio ATÉ o canônico: voltar a um desses hashes é reversão; o que veio depois é candidato
          if (p.sequence <= seqCanonico) {
            (historico[chave] ||= []);
            if (!historico[chave].some(h => h.hash === b.hash)) historico[chave].push({hash: b.hash, desde: versao});
          }
          const a = antes.get(bid);
          if (anterior && (!a || a.hash !== b.hash)) mudou.push({pagina, id: bid, area: L.areaDoBloco(regras, pagina, bid), antes: a ? a.hash : null, depois: b.hash});
        }
        if (anterior) for (const [bid, a] of antes) if (!atual[pagina].has(bid)) mudou.push({pagina, id: bid, area: L.areaDoBloco(regras, pagina, bid), antes: a.hash, depois: null});
      }
      if (anterior) {
        const depende = new Set();
        for (const m of mudou) { const d = m.antes && dono[m.pagina + '|' + m.id + '|' + m.antes]; if (d && d !== id) depende.add(d); }
        funcionalidades.push({id, titulo: p.update?.title || '', tipo: 'pacote-completo', versao, sequencia: p.sequence, blocos: mudou, depende_de: [...depende].sort()});
      }
      for (const pagina of L.PAGINAS) for (const [bid, b] of atual[pagina]) { const k = pagina + '|' + bid + '|' + b.hash; if (!dono[k]) dono[k] = anterior ? id : 'base-1.12.273'; }
      anterior = atual;
    }

    const canonico = L.lerJson(caminho[canonicoVersao]);
    const canonicoBlocos = {};
    for (const pagina of L.PAGINAS) {
      canonicoBlocos[pagina] = {};
      for (const [bid, b] of L.blocos(canonico.files[pagina])) canonicoBlocos[pagina][bid] = {hash: b.hash, area: L.areaDoBloco(regras, pagina, bid), vezes: b.vezes};
    }

    const correcoes = [];
    const todas = CORRECOES.map(([nome, sha]) => ({nome, sha, p: L.lerJson(caminho[nome])}));
    for (const {nome, sha, p} of todas) {
      const mudancas = p.changes.map(c => ({pagina: c.page, id: c.id, area: L.areaDoBloco(regras, c.page, c.id), antes: c.before, depois: c.after}));
      // situação no canônico, por mudança: presente, aplicável, evoluída (outra correção da main continuou a partir do "depois") ou conflito
      const porMudanca = p.changes.map(c => {
        const s = L.situacaoMudanca(canonico, c);
        if (s !== 'conflito') return s;
        const atual = canonicoBlocos[c.page][c.id]?.hash;
        const segue = todas.some(o => o.nome !== nome && o.p.changes.some(d => d.page === c.page && d.id === c.id && d.before === c.after && d.after === atual));
        return segue ? 'evoluida' : 'conflito';
      });
      const situacao = porMudanca.every(s => s === 'presente') ? 'presente'
        : porMudanca.every(s => s === 'presente' || s === 'evoluida') ? 'evoluida'
        : porMudanca.every(s => s === 'aplicavel') ? 'aplicavel' : 'conflito';
      correcoes.push({id: 'correcao-' + p.id, arquivo: nome, sha256: sha, titulo: p.title, area: p.area, modulo: p.module, assinada_no_arquivo: !!p.agendaSignature,
        mudancas: mudancas.map((m, i) => ({...m, situacao_no_canonico: porMudanca[i]})), situacao_no_canonico: situacao});
    }

    return {
      descricao: 'Fonte canônica versionada do conteúdo do Agenda Personal e manifesto das funcionalidades. Gerado por equipe/canonico/gerar-manifesto.cjs; não editar à mão (o CI confere).',
      canonico: {versao: canonicoVersao, sequencia: canonico.sequence, arquivo: CADEIA.find(c => c[0] === canonicoVersao)[1], sha256: CADEIA.find(c => c[0] === canonicoVersao)[2],
        appId: canonico.appId, bridgeVersion: canonico.bridgeVersion, dataSchema: canonico.dataSchema, motivo: status.motivo_canonico},
      compartilhados: regras.compartilhados,
      pacotes, blocos: canonicoBlocos, historico, funcionalidades, correcoes
    };
  } finally { fs.rmSync(trabalho, {recursive: true, force: true}); }
}

if (require.main === module) {
  const texto = JSON.stringify(gerar(), null, 1) + '\n';
  if (process.argv.includes('--conferir')) {
    const atual = fs.existsSync(SAIDA) ? fs.readFileSync(SAIDA, 'utf8') : '';
    if (atual !== texto) { console.error('equipe/canonico/manifesto.json não confere com o que é gerado agora. Rode: node equipe/canonico/gerar-manifesto.cjs'); process.exit(1); }
    console.log('manifesto.json confere com as fontes (SHA-256 ' + L.sha256(texto) + ')');
  } else { fs.writeFileSync(SAIDA, texto); console.log(SAIDA + ' (SHA-256 ' + L.sha256(texto) + ')'); }
}
module.exports = {gerar, CADEIA, CORRECOES};
