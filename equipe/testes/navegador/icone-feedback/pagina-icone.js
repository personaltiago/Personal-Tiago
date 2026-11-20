'use strict';
// Código que roda DENTRO da página do aluno (index.html do pacote 1.12.294), injetado por aluno.js DEPOIS de ../sininho-feedback/pagina.js.
// Acrescenta funções a window.__t (as do 292 continuam valendo):
//   sinoIcone()      o desenho do botão do topo: ícone escolhido (data-icon e o atributo d do caminho), cor pintada, tamanho do desenho e do botão
//                    44×44, caixa do desenho em unidades da grade e em pixels, rótulo e número. Não há imagem: o desenho é um caminho SVG.
//   tinta()          quanto o desenho do botão pesa (área pintada, em unidades da grade) e quanto dele fica debaixo do selo do número
//   vizinhos()       o WhatsApp e o sino de notificações ao lado: tamanho, cor e a caixa do desenho de cada um, em pixels, para comparar
//   coresTopo()      a cor de destaque do Início e a cor com que cada botão do topo (WhatsApp, feedback, sino) é pintado
//   perfilIcone()    a linha "Ícone do feedback" em Meu perfil e o painel: posição entre as linhas, estado, opções (desenho e cor de cada uma), status
//   coresPerfil()    a cor de destaque do Perfil e a cor do ícone da linha, das linhas vizinhas e dos 19 desenhos da grade
//   guardado()       tudo o que está no localStorage com "feedback_icon" no nome (para ver se a chave é a certa e se é por conta)
//   espiar()/eventos()  conta os eventos ap-feedback-icon-changed (com o id que vem no detalhe)
//   falhaGravacao(ligar)  faz o localStorage recusar a chave do ícone (como disco cheio), para o teste de "não foi possível guardar"
//   valorBruto(texto)     grava (ou apaga, com null) o valor da chave do ícone da conta atual, sem passar pela tela
//   apagarLinha()         tira a linha e o painel da tela (a rotina do Perfil precisa recriá-los)
//   cores()          cores calculadas do painel e das linhas (contraste, marca de visto, fundo)
//   grade()          geometria da grade de opções (colunas, tamanho de cada alvo de toque, estouro horizontal)
//   recursos()       quantos recursos de rede a página já carregou (para provar que escolher um ícone não baixa nada)
(() => {
  const q = s => document.querySelector(s);
  const vis = e => !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  const rect = e => { const b = e.getBoundingClientRect(); return {x: +b.left.toFixed(2), y: +b.top.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), r: +b.right.toFixed(2), b: +b.bottom.toFixed(2)}; };
  const texto = e => (e ? e.textContent.replace(/\s+/g, ' ').trim() : null);
  const contexto = () => (window.__AP_STUDENT_CONTEXT || {}).storageId || null;
  const chave = () => 'agenda_student_v2_' + contexto() + ':agenda_demo_feedback_icon';
  const desenho = svg => { const p = svg ? svg.querySelector('path') : null; return p ? {d: p.getAttribute('d'), regra: p.getAttribute('fill-rule'), preenchimento: getComputedStyle(p).fill, traco: getComputedStyle(p).stroke} : null; };
  // Cor (em rgb) que o Chrome calcula para `var(--nome)` num elemento: põe um elemento de teste, lê a cor e o tira.
  const corDe = (el, variavel) => {
    if (!el) return null;
    const t = document.createElement('i'); t.style.cssText = 'position:absolute;width:0;height:0;color:var(' + variavel + ')';
    el.appendChild(t); const c = getComputedStyle(t).color; t.remove(); return c;
  };

  // Caixa (em pixels de tela) que o desenho de um svg ocupa DE VERDADE: a união das caixas dos elementos de desenho (já com transformações),
  // mais meia espessura do traço nos que têm traço (o sino de notificações é feito de traço).
  function tintaPx(svg) {
    if (!svg) return null;
    const escala = svg.getBoundingClientRect().width / ((svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width) || 24);
    const caixas = [...svg.querySelectorAll('path,circle,rect,line,polyline,polygon,ellipse')].map(e => {
      const b = e.getBoundingClientRect(), cs = getComputedStyle(e), m = cs.stroke !== 'none' ? parseFloat(cs.strokeWidth) * escala / 2 : 0;
      return {x: b.left - m, y: b.top - m, r: b.right + m, b: b.bottom + m};
    }).filter(b => b.r > b.x && b.b > b.y);
    if (!caixas.length) return null;
    const x = Math.min(...caixas.map(b => b.x)), y = Math.min(...caixas.map(b => b.y)), r = Math.max(...caixas.map(b => b.r)), b = Math.max(...caixas.map(c => c.b));
    return {x: +x.toFixed(2), y: +y.toFixed(2), w: +(r - x).toFixed(2), h: +(b - y).toFixed(2), cx: +((x + r) / 2).toFixed(2), cy: +((y + b) / 2).toFixed(2)};
  }

  function sinoIcone() {
    const bell = document.getElementById('apFeedbackBell');
    if (!bell) return null;
    const svg = bell.querySelector('svg'), numero = document.getElementById('apFeedbackBellCount');
    return {
      visivel: vis(bell), oculto: bell.hidden, icone: bell.dataset.icon || null, classe: bell.className,
      imgs: bell.querySelectorAll('img').length, svgs: bell.querySelectorAll('svg').length, paths: bell.querySelectorAll('svg path').length,
      desenho: desenho(svg), corBotao: getComputedStyle(bell).color,
      svg: svg ? {...rect(svg), caixaVista: svg.getAttribute('viewBox'), preenchimento: getComputedStyle(svg).fill, traco: getComputedStyle(svg).stroke} : null,
      tinta: tintaPx(svg),
      botao: rect(bell), rotulo: bell.getAttribute('aria-label'), titulo: bell.title, numero: numero ? numero.textContent : null,
      numeroRetangulo: numero && vis(numero) ? rect(numero) : null,
      filhos: [...bell.children].map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')), html: bell.outerHTML
    };
  }

  // Área pintada do caminho (regra evenodd, grade 24×24 amostrada de 0,2 em 0,2) e a parte dela que fica debaixo do selo do número.
  function tinta() {
    const bell = document.getElementById('apFeedbackBell'), svg = bell && bell.querySelector('svg'), p = svg && svg.querySelector('path'), n = document.getElementById('apFeedbackBellCount');
    if (!p) return null;
    const caixa = p.getBBox(), sr = svg.getBoundingClientRect(), nr = n.getBoundingClientRect(), k = sr.width / 24;
    const cx = (nr.left + nr.width / 2 - sr.left) / k, cy = (nr.top + nr.height / 2 - sr.top) / k, raio = nr.width / 2 / k;
    const g = document.createElement('canvas').getContext('2d'), caminho = new Path2D(p.getAttribute('d')), passo = 0.2;
    let total = 0, sob = 0;
    for (let y = passo / 2; y < 24; y += passo) for (let x = passo / 2; x < 24; x += passo) if (g.isPointInPath(caminho, x, y, 'evenodd')) { total++; if ((x - cx) ** 2 + (y - cy) ** 2 < raio * raio) sob++; }
    const u = passo * passo;
    return {caixa: {x: +caixa.x.toFixed(2), y: +caixa.y.toFixed(2), w: +caixa.width.toFixed(2), h: +caixa.height.toFixed(2)}, area: +(total * u).toFixed(1), sob: +(sob * u).toFixed(1), fracao: total ? +(sob / total).toFixed(4) : 0,
      selo: {cx: +cx.toFixed(2), cy: +cy.toFixed(2), raio: +raio.toFixed(2)}};
  }

  function vizinhos() {
    const zap = document.getElementById('apGroupButton'), sino = document.getElementById('apStudentNotificationBell');
    const um = (b, ident) => b ? {id: ident, botao: rect(b), svg: rect(b.querySelector('svg')), tinta: tintaPx(b.querySelector('svg')), cor: getComputedStyle(b).color,
      preenchimento: getComputedStyle(b.querySelector('svg')).fill, traco: getComputedStyle(b.querySelector('svg')).stroke} : null;
    return {whatsapp: um(zap, 'whatsapp'), sino: um(sino, 'sino')};
  }

  function coresTopo() {
    const casa = document.getElementById('studentHome'), zap = document.getElementById('apGroupButton'), sino = document.getElementById('apStudentNotificationBell'), fb = document.getElementById('apFeedbackBell'), n = document.getElementById('apFeedbackBellCount');
    const cs = (e, p) => e ? getComputedStyle(e)[p] : null;
    return {
      acento: corDe(casa, '--home-accent'),
      whatsapp: {preenchimento: cs(zap && zap.querySelector('svg'), 'fill'), cor: cs(zap, 'color')},
      sino: {traco: cs(sino && sino.querySelector('svg'), 'stroke'), cor: cs(sino, 'color')},
      feedback: {preenchimento: cs(fb && fb.querySelector('svg path'), 'fill'), preenchimentoSvg: cs(fb && fb.querySelector('svg'), 'fill'), cor: cs(fb, 'color'), traco: cs(fb && fb.querySelector('svg path'), 'stroke')},
      numero: n ? {fundo: cs(n, 'backgroundColor'), cor: cs(n, 'color'), borda: cs(n, 'borderTopColor')} : null,
      fundoTopo: (() => { const h = q('#homeScroll .home-header'); return h ? cs(h, 'backgroundColor') : null; })()
    };
  }

  function perfilIcone() {
    const lista = q('#profileScreen .profile-options');
    if (!lista) return {lista: false};
    const open = document.getElementById('apFeedbackIconOpen'), panel = document.getElementById('apFeedbackIconPanel');
    const nome = e => e.id || texto(e.querySelector('strong')) || e.tagName.toLowerCase();
    const filhos = [...lista.children], i = open ? filhos.indexOf(open) : -1;
    const radios = panel ? [...panel.querySelectorAll('input[type="radio"]')] : [];
    const status = document.getElementById('apFeedbackIconStatus');
    const agora = open ? open.querySelector('.ap-fbicon-now') : null, gsvg = agora ? agora.querySelector('svg') : null;
    const vizinhaIcone = open && open.previousElementSibling ? open.previousElementSibling.querySelector('[data-profile-icon] svg') : null;
    return {
      lista: true, linhas: document.querySelectorAll('#apFeedbackIconOpen').length, paineis: document.querySelectorAll('#apFeedbackIconPanel').length,
      itens: filhos.map(nome), posicao: i, antes: i > 0 ? nome(filhos[i - 1]) : null, depois: i >= 0 && filhos[i + 1] ? nome(filhos[i + 1]) : null,
      painelDepoisDaLinha: !!open && !!panel && open.nextElementSibling === panel,
      linha: open ? {
        oculta: open.hidden, visivel: vis(open), tag: open.tagName, tipo: open.type, classe: open.className, expandido: open.getAttribute('aria-expanded'),
        controla: open.getAttribute('aria-controls'), texto: texto(open), titulo: texto(open.querySelector('strong')), subtitulo: texto(open.querySelector('small')),
        retangulo: rect(open), icone: open.dataset.icon || null, desenho: desenho(gsvg), svg: gsvg ? rect(gsvg) : null, imgs: open.querySelectorAll('img').length,
        corIcone: agora ? getComputedStyle(agora).color : null, chevron: !!open.querySelector('[data-profile-icon="chevron"] svg'),
        vizinha: vizinhaIcone ? {...rect(vizinhaIcone), cor: getComputedStyle(vizinhaIcone).color, traco: getComputedStyle(vizinhaIcone).stroke} : null
      } : null,
      painel: panel ? {
        oculto: panel.hidden, visivel: vis(panel), tag: panel.tagName, classe: panel.className, foco: document.activeElement === panel, tabindex: panel.tabIndex,
        rotuladoPor: panel.getAttribute('aria-labelledby'), titulo: texto(document.getElementById('apFeedbackIconTitle')), descricao: texto(panel.querySelector('p')),
        retangulo: rect(panel), imgs: panel.querySelectorAll('img').length
      } : null,
      status: status ? {texto: status.textContent, papel: status.getAttribute('role'), vivo: status.getAttribute('aria-live'), tag: status.tagName, visivel: vis(status)} : null,
      grupo: panel && panel.querySelector('.ap-fbicon-grid') ? {papel: panel.querySelector('.ap-fbicon-grid').getAttribute('role'), rotuladoPor: panel.querySelector('.ap-fbicon-grid').getAttribute('aria-labelledby')} : null,
      opcoes: radios.map(r => {
        const rotulo = r.closest('label'), face = rotulo.querySelector('.ap-fbicon-face'), sv = rotulo.querySelector('svg');
        return {valor: r.value, nome: r.getAttribute('aria-label'), marcado: r.checked, grupo: r.name, tipo: r.type, retangulo: rect(rotulo), face: rect(face),
          svg: sv ? rect(sv) : null, desenho: desenho(sv), imgs: rotulo.querySelectorAll('img').length, cor: getComputedStyle(rotulo).color, foco: document.activeElement === r};
      }),
      foco: document.activeElement ? (document.activeElement.id || document.activeElement.tagName.toLowerCase()) : null
    };
  }

  function coresPerfil() {
    const tela = document.getElementById('profileScreen'), open = document.getElementById('apFeedbackIconOpen'), panel = document.getElementById('apFeedbackIconPanel');
    if (!open) return null;
    const vizinha = open.previousElementSibling, vsvg = vizinha ? vizinha.querySelector('[data-profile-icon] svg') : null;
    const agora = open.querySelector('.ap-fbicon-now');
    return {
      acento: corDe(tela, '--prof-accent'),
      linha: agora ? getComputedStyle(agora.querySelector('svg path')).fill : null,
      vizinha: vsvg ? {cor: getComputedStyle(vsvg).color, traco: getComputedStyle(vsvg).stroke} : null,
      opcoes: panel ? [...panel.querySelectorAll('.ap-fbicon-opt')].map(l => getComputedStyle(l.querySelector('svg path')).fill) : []
    };
  }

  function guardado() {
    const saida = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/feedback_icon/.test(k)) saida.push([k, localStorage.getItem(k)]); }
    return saida;
  }

  function espiar() {
    window.__icEv = [];
    if (!window.__icEvOn) { window.__icEvOn = true; addEventListener('ap-feedback-icon-changed', e => window.__icEv.push(e.detail && e.detail.id !== undefined ? e.detail.id : '(sem detalhe)')); }
    return true;
  }
  const eventos = () => window.__icEv || [];

  function falhaGravacao(ligar) {
    if (ligar && !window.__setItemOriginal) {
      window.__setItemOriginal = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (/feedback_icon/.test(String(k))) throw new DOMException('Cota excedida (teste)', 'QuotaExceededError'); return window.__setItemOriginal.call(this, k, v); };
    }
    if (!ligar && window.__setItemOriginal) { Storage.prototype.setItem = window.__setItemOriginal; window.__setItemOriginal = null; }
    return !!window.__setItemOriginal;
  }

  function valorBruto(valor) {
    const k = chave();
    if (valor === null) localStorage.removeItem(k); else localStorage.setItem(k, valor);
    return k;
  }

  function apagarLinha() {
    document.getElementById('apFeedbackIconOpen')?.remove();
    document.getElementById('apFeedbackIconPanel')?.remove();
    return !document.getElementById('apFeedbackIconOpen') && !document.getElementById('apFeedbackIconPanel');
  }

  // Cor visível de um elemento: sobe pelos pais até achar fundo que não seja transparente.
  function fundoDe(el) {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor, m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c);
      if (m && (m[4] === undefined || Number(m[4]) > 0.95)) return c;
    }
    return 'rgb(255, 255, 255)';
  }
  function cores() {
    const panel = document.getElementById('apFeedbackIconPanel'), open = document.getElementById('apFeedbackIconOpen');
    if (!panel || !open) return null;
    const status = document.getElementById('apFeedbackIconStatus'), desc = panel.querySelector('p'), titulo = document.getElementById('apFeedbackIconTitle');
    const vizinho = open.previousElementSibling, tela = document.getElementById('profileScreen');
    const marcada = panel.querySelector('input:checked'), face = marcada ? marcada.nextElementSibling : null;
    const pseudo = face ? getComputedStyle(face, '::after') : null;
    return {
      claro: tela.classList.contains('profile-light'), acento: getComputedStyle(tela).getPropertyValue('--prof-accent').trim(),
      fundoPainel: fundoDe(panel), fundoLinha: fundoDe(open), fundoVizinha: vizinho ? fundoDe(vizinho) : null,
      status: getComputedStyle(status).color, descricao: getComputedStyle(desc).color, titulo: getComputedStyle(titulo).color,
      linhaTitulo: getComputedStyle(open.querySelector('strong')).color, linhaSub: getComputedStyle(open.querySelector('small')).color,
      vizinhaTitulo: vizinho && vizinho.querySelector('strong') ? getComputedStyle(vizinho.querySelector('strong')).color : null,
      vizinhaSub: vizinho && vizinho.querySelector('small') ? getComputedStyle(vizinho.querySelector('small')).color : null,
      sombraMarcada: face ? getComputedStyle(face).boxShadow : null, bordaMarcada: face ? getComputedStyle(face).borderTopColor : null,
      marca: pseudo ? {conteudo: pseudo.content, w: pseudo.width, h: pseudo.height, direita: pseudo.right, base: pseudo.bottom, fundo: pseudo.backgroundColor, sombra: pseudo.boxShadow} : null
    };
  }

  // Retângulo de uma opção (para ler os pixels do que o Chrome pintou nela) e de um ponto dentro dela, a 6 px do canto de cima à esquerda.
  function pontosDaOpcao(valor) {
    const r = document.querySelector('input[name=apFeedbackIcon][value=' + valor + ']');
    const b = r.closest('label').getBoundingClientRect();
    return {x: b.left, y: b.top, w: b.width, h: b.height, canto: [b.left + 6, b.top + 6], baixo: [b.left + 6, b.bottom - 6]};
  }

  function grade() {
    const panel = document.getElementById('apFeedbackIconPanel'), tela = document.getElementById('profileScreen');
    if (!panel) return null;
    const rotulos = [...panel.querySelectorAll('.ap-fbicon-opt')], rs = rotulos.map(rect);
    const direita = Math.max(...rs.map(r => r.r)), esquerda = Math.min(...rs.map(r => r.x));
    const painel = rect(panel);
    return {
      n: rs.length, colunas: new Set(rs.map(r => Math.round(r.x))).size, linhas: new Set(rs.map(r => Math.round(r.y))).size,
      menorLado: Math.min(...rs.flatMap(r => [r.w, r.h])), maiorLado: Math.max(...rs.flatMap(r => [r.w, r.h])), quadrados: rs.every(r => Math.abs(r.w - r.h) < 0.6),
      direita, esquerda, largura: innerWidth, painel,
      estouroTela: tela.scrollWidth - tela.clientWidth, estouroJanela: document.documentElement.scrollWidth - innerWidth, estouroPainel: panel.scrollWidth - panel.clientWidth,
      menorEspaco: (() => { let m = 1e9; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const dx = Math.max(rs[j].x - rs[i].r, rs[i].x - rs[j].r), dy = Math.max(rs[j].y - rs[i].b, rs[i].y - rs[j].b); const d = Math.max(dx, dy); if (d < m) m = d; } return +m.toFixed(2); })()
    };
  }

  const recursos = () => performance.getEntriesByType('resource').map(r => r.name).length;

  Object.assign(window.__t, {sinoIcone, tinta, vizinhos, coresTopo, perfilIcone, coresPerfil, guardado, espiar, eventos, falhaGravacao, valorBruto, apagarLinha, cores, pontosDaOpcao, grade, recursos, chave});
})();
