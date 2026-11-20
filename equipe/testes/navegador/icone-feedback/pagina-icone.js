'use strict';
// Código que roda DENTRO da página do aluno (index.html do pacote 1.12.293), injetado por aluno.js DEPOIS de ../sininho-feedback/pagina.js.
// Acrescenta funções a window.__t (as do 292 continuam valendo):
//   sinoIcone()      o desenho do botão do topo: ícone escolhido, imagem (tamanho, se carregou), balão de reserva, botão 44×44, rótulo e número
//   perfilIcone()    a linha "Ícone do feedback" em Meu perfil e o painel: posição entre as linhas, estado, opções, status
//   guardado()       tudo o que está no localStorage com "feedback_icon" no nome (para ver se a chave é a certa e se é por conta)
//   espiar()/eventos()  conta os eventos ap-feedback-icon-changed (com o id que vem no detalhe)
//   falhaGravacao(ligar)  faz o localStorage recusar a chave do ícone (como disco cheio), para o teste de "não foi possível guardar"
//   valorBruto(texto)     grava (ou apaga, com null) o valor da chave do ícone da conta atual, sem passar pela tela
//   apagarLinha()         tira a linha e o painel da tela (a rotina do Perfil precisa recriá-los)
//   cores()          cores calculadas do painel e das linhas (contraste, anel, fundo)
//   grade()          geometria da grade de opções (colunas, tamanho de cada alvo de toque, estouro horizontal)
(() => {
  const q = s => document.querySelector(s);
  const vis = e => !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  const rect = e => { const b = e.getBoundingClientRect(); return {x: +b.left.toFixed(2), y: +b.top.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), r: +b.right.toFixed(2), b: +b.bottom.toFixed(2)}; };
  const texto = e => (e ? e.textContent.replace(/\s+/g, ' ').trim() : null);
  const imagem = img => img ? {...rect(img), visivel: vis(img), carregou: img.complete && img.naturalWidth > 0, natural: [img.naturalWidth, img.naturalHeight], alt: img.getAttribute('alt'), arrastavel: img.draggable, src: img.getAttribute('src') || ''} : null;
  const contexto = () => (window.__AP_STUDENT_CONTEXT || {}).storageId || null;
  const chave = () => 'agenda_student_v2_' + contexto() + ':agenda_demo_feedback_icon';

  function sinoIcone() {
    const bell = document.getElementById('apFeedbackBell');
    if (!bell) return null;
    const img = bell.querySelector('img'), svg = bell.querySelector('svg'), numero = document.getElementById('apFeedbackBellCount');
    return {
      visivel: vis(bell), oculto: bell.hidden, icone: bell.dataset.icon || null, classe: bell.className,
      disco: bell.classList.contains('ap-fbicon-disc'), reserva: bell.classList.contains('ap-fbicon-fallback'),
      imgs: bell.querySelectorAll('img').length, img: imagem(img),
      svg: svg ? {display: getComputedStyle(svg).display, visivel: vis(svg), ...rect(svg)} : null,
      botao: rect(bell), rotulo: bell.getAttribute('aria-label'), titulo: bell.title, numero: numero ? numero.textContent : null,
      filhos: [...bell.children].map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')), html: bell.outerHTML
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
    const agora = open ? open.querySelector('.ap-fbicon-now img') : null;
    return {
      lista: true, linhas: document.querySelectorAll('#apFeedbackIconOpen').length, paineis: document.querySelectorAll('#apFeedbackIconPanel').length,
      itens: filhos.map(nome), posicao: i, antes: i > 0 ? nome(filhos[i - 1]) : null, depois: i >= 0 && filhos[i + 1] ? nome(filhos[i + 1]) : null,
      painelDepoisDaLinha: !!open && !!panel && open.nextElementSibling === panel,
      linha: open ? {
        oculta: open.hidden, visivel: vis(open), tag: open.tagName, tipo: open.type, classe: open.className, expandido: open.getAttribute('aria-expanded'),
        controla: open.getAttribute('aria-controls'), texto: texto(open), titulo: texto(open.querySelector('strong')), subtitulo: texto(open.querySelector('small')),
        retangulo: rect(open), icone: agora ? agora.dataset.icon || null : null, imagem: imagem(agora), chevron: !!open.querySelector('[data-profile-icon="chevron"] svg')
      } : null,
      painel: panel ? {
        oculto: panel.hidden, visivel: vis(panel), tag: panel.tagName, classe: panel.className, foco: document.activeElement === panel, tabindex: panel.tabIndex,
        rotuladoPor: panel.getAttribute('aria-labelledby'), titulo: texto(document.getElementById('apFeedbackIconTitle')), descricao: texto(panel.querySelector('p')),
        retangulo: rect(panel)
      } : null,
      status: status ? {texto: status.textContent, papel: status.getAttribute('role'), vivo: status.getAttribute('aria-live'), tag: status.tagName, visivel: vis(status)} : null,
      grupo: panel && panel.querySelector('.ap-fbicon-grid') ? {papel: panel.querySelector('.ap-fbicon-grid').getAttribute('role'), rotuladoPor: panel.querySelector('.ap-fbicon-grid').getAttribute('aria-labelledby')} : null,
      opcoes: radios.map(r => {
        const rotulo = r.closest('label'), face = rotulo.querySelector('.ap-fbicon-face'), im = rotulo.querySelector('img');
        return {valor: r.value, nome: r.getAttribute('aria-label'), marcado: r.checked, grupo: r.name, tipo: r.type, disco: rotulo.classList.contains('ap-fbicon-disc-opt'),
          retangulo: rect(rotulo), face: rect(face), imagem: imagem(im), foco: document.activeElement === r};
      }),
      foco: document.activeElement ? (document.activeElement.id || document.activeElement.tagName.toLowerCase()) : null
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
      folga: getComputedStyle(panel).getPropertyValue('--ap-fbicon-gap').trim(),
      fundoPainel: fundoDe(panel), fundoLinha: fundoDe(open), fundoVizinha: vizinho ? fundoDe(vizinho) : null,
      status: getComputedStyle(status).color, descricao: getComputedStyle(desc).color, titulo: getComputedStyle(titulo).color,
      linhaTitulo: getComputedStyle(open.querySelector('strong')).color, linhaSub: getComputedStyle(open.querySelector('small')).color,
      vizinhaTitulo: vizinho && vizinho.querySelector('strong') ? getComputedStyle(vizinho.querySelector('strong')).color : null,
      vizinhaSub: vizinho && vizinho.querySelector('small') ? getComputedStyle(vizinho.querySelector('small')).color : null,
      sombraMarcada: face ? getComputedStyle(face).boxShadow : null,
      marca: pseudo ? {conteudo: pseudo.content, w: pseudo.width, h: pseudo.height, direita: pseudo.right, base: pseudo.bottom, fundo: pseudo.backgroundColor, sombra: pseudo.boxShadow} : null
    };
  }

  function grade() {
    const panel = document.getElementById('apFeedbackIconPanel'), tela = document.getElementById('profileScreen');
    if (!panel) return null;
    const rotulos = [...panel.querySelectorAll('.ap-fbicon-opt')], rs = rotulos.map(rect);
    const direita = Math.max(...rs.map(r => r.r)), esquerda = Math.min(...rs.map(r => r.x));
    const rolagem = tela.querySelector('.profile-scroll') || tela;
    return {
      n: rs.length, colunas: new Set(rs.map(r => Math.round(r.x))).size, linhas: new Set(rs.map(r => Math.round(r.y))).size,
      menorLado: Math.min(...rs.flatMap(r => [r.w, r.h])), maiorLado: Math.max(...rs.flatMap(r => [r.w, r.h])), quadrados: rs.every(r => Math.abs(r.w - r.h) < 0.6),
      direita, esquerda, largura: innerWidth, painel: rect(panel),
      estouroTela: tela.scrollWidth - tela.clientWidth, estouroJanela: document.documentElement.scrollWidth - innerWidth, estouroPainel: panel.scrollWidth - panel.clientWidth,
      menorEspaco: (() => { let m = 1e9; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const dx = Math.max(rs[j].x - rs[i].r, rs[i].x - rs[j].r), dy = Math.max(rs[j].y - rs[i].b, rs[i].y - rs[j].b); const d = Math.max(dx, dy); if (d < m) m = d; } return +m.toFixed(2); })()
    };
  }

  Object.assign(window.__t, {sinoIcone, perfilIcone, guardado, espiar, eventos, falhaGravacao, valorBruto, apagarLinha, cores, grade, chave});
})();
