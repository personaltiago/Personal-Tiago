'use strict';
// Leitor do texto de uma prescrição de treino (1.12.314). Função pura: recebe o texto colado e devolve o que reconheceu.
// Formato de referência: o texto que o ChatGPT devolve ao Tiago (cabeçalho com nome e objetivo; "### DIA A — …" com tabela
// "Exercício | Séries × repetições | Descanso"; "Como fazer e observações"; "Orientações Gerais"; "Cardio e aplicação").
// Aceita também tabelas separadas por tabulação (texto copiado da tela) e títulos sem "#".
// Não usa DOM nem lookbehind (o iPhone com Safari mais antigo não aceita). Este arquivo é embutido no bloco ap-treino-texto
// do professor e carregado como módulo CommonJS nos testes.

const semAcento = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const chave = s => semAcento(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const limpa = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const traco = s => String(s ?? '').replace(/[–—−]/g, '-');

function normalizar(texto) {
  let t = String(texto ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/[   ]/g, ' ');
  t = t.replace(/\\([.\-()#*_!+>~`[\]])/g, '$1'); // escapes do markdown: "1\." "\-"
  t = t.replace(/\*\*([^*\n]+)\*\*/g, '$1').replace(/__([^_\n]+)__/g, '$1');
  return t;
}

// Tempo em segundos: "75 s", "45–60 s", "1 min", "1:30", "1 min 30 s", "10 a 15 minutos". Devolve {min,max} ou null.
// unidadePadrao: 's' (descanso) ou 'min' (cardio) quando o texto vem sem unidade.
function lerTempo(texto, unidadePadrao = 's') {
  const t = semAcento(traco(texto)).toLowerCase().replace(/,/g, '.').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  const fator = u => {
    if (!u) return unidadePadrao === 'min' ? 60 : 1;
    if (/^(s|seg|segs|segundo|segundos)$/.test(u)) return 1;
    if (/^(m|min|mins|minuto|minutos|')$/.test(u)) return 60;
    if (/^(h|hr|hrs|hora|horas)$/.test(u)) return 3600;
    return 0;
  };
  const ok = (a, b) => {
    const min = Math.round(a), max = Math.round(b);
    return Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min && max <= 86400 ? { min, max } : null;
  };
  let m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m && Number(m[2]) < 60) return ok(Number(m[1]) * 60 + Number(m[2]), Number(m[1]) * 60 + Number(m[2]));
  m = t.match(/^(\d+)\s*(?:min|m|minutos?)\s*(\d+)\s*(?:s|seg|segs|segundos?)?(?:\s|$)/);
  if (m) return ok(Number(m[1]) * 60 + Number(m[2]), Number(m[1]) * 60 + Number(m[2]));
  m = t.match(/^(\d+(?:\.\d+)?)\s*(?:-|a|ate)\s*(\d+(?:\.\d+)?)\s*([a-z']*)/);
  if (m) {
    const f = fator(m[3]);
    return f ? ok(Number(m[1]) * f, Number(m[2]) * f) : null;
  }
  m = t.match(/^(\d+(?:\.\d+)?)\s*([a-z']*)/);
  if (m) {
    const f = fator(m[2]);
    return f ? ok(Number(m[1]) * f, Number(m[1]) * f) : null;
  }
  return null;
}

// Escolhe um único valor de descanso em segundos (o app guarda um número só por exercício). modo: 'max' | 'min' | 'media'.
function descansoEmSegundos(ex, modo = 'max') {
  if (!ex || !ex.descansoMin) return 0;
  if (modo === 'min') return ex.descansoMin;
  if (modo === 'media') return Math.round((ex.descansoMin + ex.descansoMax) / 2);
  return ex.descansoMax;
}

function celulas(linha) {
  if (/\|/.test(linha)) {
    const partes = linha.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|');
    return partes.map(limpa);
  }
  if (/\t/.test(linha)) return linha.split('\t').map(limpa);
  return null;
}
const separador = c => c.length > 0 && c.every(x => /^:?-{2,}:?$/.test(x) || x === '');

const TIPOS_SECAO = [
  ['estrutura', /^estrutura semanal/],
  ['classificacao', /^classificacao (das|de) orientacoes/],
  ['orientacoes', /^orientacoes gerais/],
  ['treinos', /^treinos? por dias?/],
  ['cardio', /^cardio/],
  ['resumo', /^(resumo tecnico|resumo do volume)/],
  ['progressao', /^progressao/],
  ['auditoria', /^auditoria/]
];

function cabecalhoSecao(linha) {
  const m = linha.match(/^\s*(#{1,6})\s+(.*\S)\s*$/);
  let texto;
  if (m) texto = m[2];
  else {
    const n = linha.match(/^\s*(\d{1,2})\s*[.)]\s+(\S.{0,90})$/);
    if (!n || /\|/.test(linha)) return null;
    texto = n[2];
  }
  const k = chave(texto.replace(/^\d+\s*[.)]?\s*/, ''));
  for (const [tipo, re] of TIPOS_SECAO) if (re.test(k)) return { tipo, titulo: limpa(texto.replace(/^\d+\s*[.)]?\s*/, '')) };
  return m ? { tipo: 'outro', titulo: limpa(texto) } : null;
}

function cabecalhoDia(linha) {
  const m = linha.match(/^\s*(?:#{1,6}\s*)?(?:DIA|Dia|TREINO|Treino)\s+([A-Z]|\d{1,2})\b\s*(?:[—–:\-]+\s*)?(.*)$/);
  if (!m) return null;
  const letra = /^\d+$/.test(m[1]) ? LETRAS[Number(m[1]) - 1] || m[1] : m[1];
  return { letra, titulo: limpa(m[2]).replace(/[\s—–:\-]+$/, '') };
}
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function listarItens(linhas) {
  const itens = [];
  let aberto = false;
  for (const l of linhas) {
    const m = l.match(/^\s*(?:[*•·▪●◦-]|\d{1,2}[.)])\s+(\S.*)$/);
    if (m) { itens.push(limpa(m[1])); aberto = true; continue; }
    if (!l.trim()) { aberto = false; continue; }
    if (aberto && itens.length) itens[itens.length - 1] = limpa(itens[itens.length - 1] + ' ' + l); // linha quebrada do mesmo item
  }
  return itens;
}

function paragrafos(linhas) {
  const saida = [];
  let atual = [];
  for (const l of linhas) {
    if (!l.trim()) { if (atual.length) saida.push(limpa(atual.join(' '))); atual = []; continue; }
    if (/^\s*\|/.test(l) || /\t/.test(l)) { if (atual.length) saida.push(limpa(atual.join(' '))); atual = []; continue; }
    atual.push(l);
  }
  if (atual.length) saida.push(limpa(atual.join(' ')));
  return saida;
}

const ROTULOS_PERFIL = [
  ['objetivo', /Objetivo\s*:/i],
  ['nivel', /N[ií]vel(?:\s+operacional)?\s*:/i],
  ['frequencia', /Frequ[eê]ncia\s*:/i],
  ['duracao', /Dura[cç][aã]o(?:\s+dispon[ií]vel)?\s*:/i],
  ['cardio', /Cardio(?:\s+informado)?\s*:/i]
];
function lerPerfil(texto) {
  const achados = [];
  for (const [campo, re] of ROTULOS_PERFIL) {
    const m = re.exec(texto);
    if (m) achados.push({ campo, inicio: m.index, fim: m.index + m[0].length });
  }
  achados.sort((a, b) => a.inicio - b.inicio);
  const perfil = { objetivo: '', nivel: '', frequencia: '', duracao: '', cardio: '' };
  achados.forEach((a, i) => {
    const fim = i + 1 < achados.length ? achados[i + 1].inicio : texto.length;
    perfil[a.campo] = limpa(texto.slice(a.fim, fim)).replace(/[.;\s]+$/, '');
  });
  return perfil;
}

function pareceNome(texto) {
  const t = limpa(texto);
  return t.length >= 5 && t.length <= 80 && t.split(' ').length >= 2 && !/\d/.test(t)
    && /^[A-Za-zÀ-ÿ'’. -]+$/.test(t) && !/(treino|ficha|prescri|orienta|estrutura|objetivo|plano)/i.test(semAcento(t));
}

const CARDIO_NOME = /(esteira|bicicleta|bike|el[ií]ptico|transport|corrida|caminhada|cardio|ergom[eé]tric|escada)/i;
function textoSemTabela(linhas) { return linhas.filter(l => !celulas(l)); }

function lerSeries(celula) {
  const t = traco(celula).replace(/(\d)\s*[xX]\s*(?=\d)/g, '$1 × ');
  const m = t.match(/^\s*(\d{1,2})\s*×\s*(.+?)\s*$/);
  if (!m) return null;
  return { series: m[1], repeticoes: limpa(m[2]) };
}

function lerDia(bloco, avisos) {
  const L = bloco.linhas;
  const rotulo = 'Dia ' + bloco.letra;
  let cab = -1;
  for (let i = 0; i < L.length; i++) {
    const c = celulas(L[i]);
    if (c && c.length >= 2 && c.some(x => chave(x).startsWith('exercicio'))) { cab = i; break; }
  }
  const dia = { letra: bloco.letra, titulo: bloco.titulo, nome: ('DIA ' + bloco.letra + (bloco.titulo ? ' - ' + bloco.titulo : '')), exercicios: [], cardioNaTabela: false };
  if (cab < 0) { avisos.push({ nivel: 'erro', texto: rotulo + ': não encontrei a tabela com a coluna Exercício.' }); return dia; }
  const cabecalho = celulas(L[cab]).map(chave);
  const col = { nome: 0, serie: 1, descanso: 2, carga: -1, obs: -1 };
  cabecalho.forEach((k, i) => {
    if (k.startsWith('exercicio')) col.nome = i;
    else if (/serie|repet/.test(k)) col.serie = i;
    else if (/descanso|intervalo|pausa/.test(k)) col.descanso = i;
    else if (/carga/.test(k)) col.carga = i;
    else if (/observ|como fazer/.test(k)) col.obs = i;
  });
  let fim = cab + 1;
  for (; fim < L.length; fim++) {
    const c = celulas(L[fim]);
    if (!c || c.length < 2) break;
    if (separador(c) || c.every(x => !x)) continue;
    const bruto = c[col.nome] || '';
    const codigo = (bruto.match(/\(\s*(E\d{1,4})\s*\)\s*$/i) || [])[1] || '';
    const nome = limpa(bruto.replace(/\(\s*E\d{1,4}\s*\)\s*$/i, ''));
    if (!nome) continue;
    const celulaSerie = c[col.serie] || '', celulaDescanso = col.descanso >= 0 ? c[col.descanso] || '' : '';
    const ex = { nome, codigo, series: '', repeticoes: '', descansoTexto: celulaDescanso, descansoMin: 0, descansoMax: 0, carga: col.carga >= 0 ? c[col.carga] || '' : '', comoFazer: col.obs >= 0 ? c[col.obs] || '' : '', cardio: false };
    // Cardio dentro da tabela: nome de cardio e tempo em minutos/segundos no lugar das repetições.
    if (CARDIO_NOME.test(semAcento(nome)) && /\d\s*(?:min|minutos?|seg|segundos?|'|h\b)/i.test(celulaSerie + ' ' + celulaDescanso)) {
      const tempo = lerTempo((celulaSerie.match(/\d.*$/) || [''])[0].replace(/^\d+\s*×\s*/, ''), 'min') || lerTempo(celulaSerie.replace(/^\d+\s*×\s*/, ''), 'min');
      if (tempo) { ex.cardio = true; ex.duracaoMin = tempo.min; ex.duracaoMax = tempo.max; ex.repeticoes = limpa(celulaSerie); dia.exercicios.push(ex); continue; }
    }
    const s = lerSeries(celulaSerie);
    if (s) { ex.series = s.series; ex.repeticoes = s.repeticoes; }
    else { ex.repeticoes = limpa(traco(celulaSerie)); avisos.push({ nivel: 'aviso', texto: rotulo + ' · ' + nome + ': séries e repetições não reconhecidas ("' + limpa(celulaSerie) + '").' }); }
    if (celulaDescanso) {
      const t = lerTempo(celulaDescanso, 's');
      if (t) { ex.descansoMin = t.min; ex.descansoMax = t.max; }
      else avisos.push({ nivel: 'aviso', texto: rotulo + ' · ' + nome + ': descanso não reconhecido ("' + celulaDescanso + '").' });
    } else avisos.push({ nivel: 'aviso', texto: rotulo + ' · ' + nome + ': sem descanso no texto.' });
    dia.exercicios.push(ex);
  }
  // "Como fazer e observações": um item por exercício, no formato "Nome do exercício: texto".
  const itens = listarItens(L.slice(fim));
  const livres = dia.exercicios.map((ex, i) => ({ ex, i, k: chave(ex.nome), usado: false }));
  for (const item of itens) {
    const d = item.indexOf(':');
    if (d < 1) continue;
    const kRotulo = chave(item.slice(0, d)), corpo = limpa(item.slice(d + 1));
    if (!corpo) continue;
    let alvo = livres.find(x => !x.usado && x.k === kRotulo)
      || livres.find(x => x.k === kRotulo)
      || livres.filter(x => kRotulo && (x.k.includes(kRotulo) || kRotulo.includes(x.k))).sort((a, b) => b.k.length - a.k.length)[0];
    if (alvo) { alvo.usado = true; alvo.ex.comoFazer = alvo.ex.comoFazer ? alvo.ex.comoFazer + ' ' + corpo : corpo; }
    else avisos.push({ nivel: 'aviso', texto: rotulo + ': a instrução "' + limpa(item.slice(0, d)) + '" não corresponde a nenhum exercício da tabela.' });
  }
  // Cardio escrito na tabela fica sempre depois da musculação.
  const musculacao = dia.exercicios.filter(e => !e.cardio), cardio = dia.exercicios.filter(e => e.cardio);
  dia.exercicios = [...musculacao, ...cardio];
  dia.cardioNaTabela = cardio.length > 0;
  if (!musculacao.length && !cardio.length) avisos.push({ nivel: 'erro', texto: rotulo + ': a tabela não tem exercícios.' });
  return dia;
}

const NEGA_CARDIO = /(sem cardio|n[aã]o (?:haver[aá]|h[aá]|ter[aá]|ser[aá] (?:feito|prescrito|inclu[ií]do)|inclu[ií]r|fazer|prescrev)\S*\s+(?:nenhum\s+)?cardio|cardio\s*:\s*(?:n[aã]o|nenhum|sem)\b|nenhum cardio)/i;
function lerCardio(blocos, perfil, avisos) {
  const sec = blocos.find(b => b.tipo === 'cardio');
  const fonte = sec ? paragrafos(sec.linhas).filter(Boolean) : [];
  const principal = fonte.find(p => /modalidade|esteira|bicicleta|bike|caminhada|corrida|el[ií]ptico|transport|cardio/i.test(semAcento(p)) && /\d/.test(p));
  if (!principal) {
    if (sec && fonte.length && !fonte.some(p => NEGA_CARDIO.test(semAcento(p)))) avisos.push({ nivel: 'aviso', texto: 'Há uma seção de cardio, mas não encontrei o tempo. Nenhum card de cardio foi criado.' });
    return null;
  }
  if (NEGA_CARDIO.test(semAcento(principal))) return null;
  const mod = principal.match(/Modalidade(?:\s+escolhida)?\s*:\s*([^,.;]+?)\s*(?=,|\.|;|\s+por\s+\d|$)/i);
  const tempoTxt = principal.match(/(\d+(?:[.,]\d+)?\s*(?:-|–|—|a|à|até)\s*\d+(?:[.,]\d+)?\s*(?:min(?:utos?)?|h(?:oras?)?)|\d+(?:[.,]\d+)?\s*(?:min(?:utos?)?|h(?:oras?)?))/i);
  if (!tempoTxt) {
    avisos.push({ nivel: 'aviso', texto: 'O cardio do texto não tem tempo em minutos. Nenhum card de cardio foi criado.' });
    return null;
  }
  const tempo = lerTempo(tempoTxt[1].replace(/\bà\b|\baté\b/gi, 'a'), 'min');
  if (!tempo) { avisos.push({ nivel: 'aviso', texto: 'Não consegui ler o tempo do cardio ("' + tempoTxt[1] + '"). Nenhum card de cardio foi criado.' }); return null; }
  const modalidade = limpa(mod ? mod[1] : '') || 'Cardio';
  const frases = principal.split(/(?:\.|!|\?)\s+/).map(limpa).filter(Boolean);
  // Orientação = o que vem depois da frase da modalidade e do tempo (ex.: "Manter ritmo confortável e interromper se …").
  const indice = frases.findIndex(f => /modalidade|por\s+\d/i.test(semAcento(f)));
  const orientacao = frases.slice(indice >= 0 ? indice + 1 : 1).filter(f => !/^m\d\b|\bm[1-9]\b/i.test(f)).join('. ').replace(/[.\s]+$/, '');
  const dias = (principal.match(/\b(?:nos|nas|no|na|em)\s+dias?\s+((?:[A-E](?:\s*(?:,|e|\/)\s*)?)+)\b/) || [])[1];
  return {
    modalidade: modalidade.charAt(0).toUpperCase() + modalidade.slice(1),
    duracaoMin: tempo.min, duracaoMax: tempo.max,
    orientacao: orientacao ? orientacao + '.' : '',
    dias: dias ? dias.match(/[A-E]/g) : null,
    textoOriginal: principal,
    informadoNoCabecalho: !!perfil.cardio
  };
}

function analisar(texto) {
  const avisos = [];
  const linhas = normalizar(texto).split('\n').map(l => l.replace(/\s+$/, ''));
  const blocos = [];
  let atual = { tipo: 'pre', titulo: '', linhas: [] };
  blocos.push(atual);
  for (const l of linhas) {
    const dia = cabecalhoDia(l);
    if (dia) { atual = { tipo: 'dia', ...dia, linhas: [] }; blocos.push(atual); continue; }
    const sec = cabecalhoSecao(l);
    if (sec) {
      if (sec.tipo === 'outro' && atual.tipo === 'dia' && /como fazer|observa/i.test(semAcento(sec.titulo))) { atual.linhas.push('', sec.titulo); continue; }
      atual = { ...sec, linhas: [] };
      blocos.push(atual);
      continue;
    }
    atual.linhas.push(l);
  }
  const primeiraSecao = blocos.findIndex(b => b.tipo !== 'pre' && b.tipo !== 'outro');
  const cabecalho = blocos.slice(0, primeiraSecao < 0 ? blocos.length : primeiraSecao);
  const nomeBloco = cabecalho.find(b => b.tipo === 'outro' && pareceNome(b.titulo));
  const textoCabecalho = cabecalho.map(b => (b.tipo === 'outro' ? b.titulo + '\n' : '') + b.linhas.join('\n')).join('\n').replace(/\n+/g, ' ');
  const nomeLinha = textoCabecalho.match(/(?:Aluno\(a\)|Aluna|Aluno|Nome)\s*:\s*([^.:]{3,80}?)(?=\s{2,}|\s+(?:Objetivo|N[ií]vel|Frequ|Dura)|$)/i);
  const nome = nomeBloco ? limpa(nomeBloco.titulo) : nomeLinha ? limpa(nomeLinha[1]) : '';
  const perfil = lerPerfil(textoCabecalho);

  const diasBlocos = blocos.filter(b => b.tipo === 'dia');
  const dias = [];
  const vistos = new Set();
  for (const b of diasBlocos) {
    if (vistos.has(b.letra)) { avisos.push({ nivel: 'erro', texto: 'O Dia ' + b.letra + ' aparece mais de uma vez no texto.' }); continue; }
    vistos.add(b.letra);
    dias.push(lerDia(b, avisos));
  }
  if (!dias.length) avisos.push({ nivel: 'erro', texto: 'Não encontrei os treinos por dia (títulos como "DIA A — …" com a tabela de exercícios).' });

  const bOrient = blocos.find(b => b.tipo === 'orientacoes');
  const orientacoes = bOrient ? listarItens(bOrient.linhas) : [];
  const bClass = blocos.find(b => b.tipo === 'classificacao');
  const decl = bClass ? (bClass.linhas.join(' ').match(/(?:Quantidade definida|Total)\s*:\s*(\d+)/i) || bClass.linhas.join(' ').match(/(\d+)\s+orienta[cç][oõ]es/i)) : null;
  const declaradas = decl ? Number(decl[1]) : null;
  if (declaradas !== null && declaradas !== orientacoes.length)
    avisos.push({ nivel: 'aviso', texto: 'O texto declara ' + declaradas + ' orientações gerais e encontrei ' + orientacoes.length + '. Confira se o texto foi colado inteiro.' });
  if (!bOrient) avisos.push({ nivel: 'info', texto: 'Não encontrei a seção "Orientações Gerais". A ficha será criada sem orientações gerais.' });

  const bEstrutura = blocos.find(b => b.tipo === 'estrutura');
  if (bEstrutura) {
    const letras = bEstrutura.linhas.map(celulas).filter(c => c && c.length >= 2 && !separador(c) && /^[A-Z]$/.test(c[0])).map(c => c[0]);
    if (letras.length && (letras.length !== dias.length || letras.some((x, i) => dias[i]?.letra !== x)))
      avisos.push({ nivel: 'aviso', texto: 'A estrutura semanal tem ' + letras.length + ' dias (' + letras.join(', ') + ') e encontrei ' + dias.length + ' (' + dias.map(d => d.letra).join(', ') + ').' });
  }

  const cardio = lerCardio(blocos, perfil, avisos);
  for (const d of dias) for (const ex of d.exercicios) if (!ex.cardio && CARDIO_NOME.test(semAcento(ex.nome)) && !ex.series)
    avisos.push({ nivel: 'aviso', texto: 'Dia ' + d.letra + ' · ' + ex.nome + ': parece cardio, mas sem tempo em minutos. Foi tratado como exercício comum.' });

  const nomeIgnorado = { estrutura: 'Estrutura semanal (só conferida)', classificacao: 'Classificação das orientações', resumo: 'Resumo técnico do volume', progressao: 'Progressão e revisão', auditoria: 'Auditoria final' };
  const ignorados = blocos.filter(b => nomeIgnorado[b.tipo]).map(b => nomeIgnorado[b.tipo]);
  const ok = dias.some(d => d.exercicios.length > 0) && !avisos.some(a => a.nivel === 'erro' && /Não encontrei os treinos/.test(a.texto));
  return { ok, nome, perfil, dias, orientacoes, orientacoesDeclaradas: declaradas, cardio, ignorados, avisos };
}

// Nome curto do objetivo para o nome da ficha: "emagrecimento, preservando…" -> "Emagrecimento".
function objetivoCurto(objetivo) {
  const t = limpa(String(objetivo || '').split(/[,;.:(]| - /)[0]);
  return t ? t.charAt(0).toUpperCase() + t.slice(1, 60) : '';
}
function nivelCurto(nivel) {
  const k = chave(nivel);
  return /iniciante/.test(k) ? 'Iniciante' : /intermediario/.test(k) ? 'Intermediário' : /avancado/.test(k) ? 'Avançado' : '';
}
// Orientações gerais no formato guardado na ficha: uma por linha, com "• ".
function formatarOrientacoes(lista) { return lista.map(x => '• ' + limpa(x)).join('\n'); }

module.exports = { analisar, lerTempo, descansoEmSegundos, objetivoCurto, nivelCurto, formatarOrientacoes, normalizar, chave };
