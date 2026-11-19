'use strict';
// Código que roda DENTRO da página do aluno (index.html verdadeiro do pacote), injetado por aluno.js. Define window.__t:
//   entrar(opções)   simula o aluno logado: contexto da conta, preferências (cor, modo, fonte), nome, grupo da turma, e abre o Início
//   semear(opções)   grava o cache de feedback do aluno no aparelho (como o aplicativo grava) e avisa a página, sem rede
//   sair()           desloga (contexto nulo + ap-account-changed), como o aplicativo faz ao sair da conta
//   estado()         o que o aluno vê: sino, número, rótulo, irmãos no topo, classe do topo, pendentes
//   medir()          geometria do topo: retângulos, palavras do nome quebradas no meio, ícones dentro da tela, sobreposição
(() => {
  const UID = 'uidAlunoTeste123';
  const pad = n => String(n).padStart(2, '0');
  const q = s => document.querySelector(s);
  const vis = e => !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

  function entrar(o = {}) {
    const uid = o.uid || UID;
    const genero = o.genero || 'Feminino';
    const trainer = {name: 'Tiago', role: 'Personal Trainer'};
    if (o.grupo !== false) trainer.groupLink = 'https://chat.whatsapp.com/ABCDEFGHIJKLMNOP';
    window.__AP_STUDENT_CONTEXT = {
      storageId: uid, role: o.role || 'student',
      profile: {name: o.nome || 'Jessica Souza', email: 'aluno@teste.invalid', phone: '', birth: '', gender: genero},
      area: {enabled: true, plans: [], trainer}
    };
    APstudentStorage.setItem('agenda_demo_genero', genero);
    APstudentStorage.setItem('agenda_demo_personalizacao', JSON.stringify({
      gender: genero, theme: o.tema || 'rosa', ...(o.cor ? {color: o.cor} : {}), mode: o.modo || 'escuro',
      icons: 'padrao', font: o.fonte || 'media', sound: true, animations: true
    }));
    APstudentStorage.setItem(profileStorageKey(), JSON.stringify({name: o.nome || 'Jessica Souza'}));
    window.dispatchEvent(new Event('ap-student-ready'));
    route('home');
  }

  // As mais recentes ficam pendentes; depois vêm as respondidas. `fila`: respostas salvas no aparelho e ainda não enviadas.
  function semear(o = {}) {
    const uid = (window.__AP_STUDENT_CONTEXT || {}).storageId || UID;
    const now = o.agora || Date.now(), items = [], total = (o.pendentes || 0) + (o.respondidos || 0);
    for (let i = 1; i <= total; i++) {
      const fin = now - i * 864e5 - 36e5, st = fin - 55 * 60e3;
      const item = {
        id: 'fb_s' + pad(i), uid, studentId: 'stu_1', studentName: 'Maria Souza', source: 'presencial',
        planName: 'Plano de hipertrofia', dayName: 'Treino ' + String.fromCharCode(64 + i), startedAt: st, finishedAt: fin,
        professorId: APFeedbackModel.TEACHER, createdAt: new Date(fin).toISOString(), teacherEvaluation: {note: 'Boa evolução.', effort: 8}
      };
      if (i > (o.pendentes || 0)) item.response = {intensity: 'Intensa', comment: 'Ótimo treino.', publicationBasis: 'contract', mutationId: 'mut' + pad(i), receivedAt: new Date(fin + 12e4).toISOString()};
      items.push(item);
    }
    localStorage.setItem('agenda_feedback_v1_' + uid, JSON.stringify({version: 1, items, outbox: o.fila || {}, drafts: {}}));
    window.dispatchEvent(new CustomEvent('ap-feedback-changed'));
  }

  function sair() {
    window.__AP_STUDENT_CONTEXT = null;
    window.dispatchEvent(new Event('ap-account-changed'));
  }

  function estado() {
    const bell = document.getElementById('apFeedbackBell'), count = document.getElementById('apFeedbackBellCount');
    const header = q('#homeScroll .home-header'), actions = q('#homeScroll .home-actions');
    const dialog = document.getElementById('apFeedbackStudent');
    return {
      uid: APFeedbackSync.uid(), pendentes: APFeedbackSync.pending().length, visiveis: APFeedbackSync.visible().length,
      sino: bell ? {
        visivel: vis(bell), oculto: bell.hidden, tag: bell.tagName, tipo: bell.type, classe: bell.className,
        rotulo: bell.getAttribute('aria-label'), titulo: bell.title, numero: count ? count.textContent : null, numeroVisivel: vis(count),
        tinta: bell.style.getPropertyValue('--fb-bell-ink'), pai: bell.parentNode === actions
      } : null,
      sinos: document.querySelectorAll('#apFeedbackBell').length,
      irmaos: actions ? [...actions.children].map(e => e.id || e.className.split(' ')[0]) : null,
      classeTopo: header ? header.className : null,
      janela: dialog ? {aberta: dialog.open, selecionado: dialog.querySelector('[data-feedback-session][aria-pressed="true"]')?.dataset.feedbackSession || null} : null,
      foco: document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : null,
      casa: (() => { const b = document.getElementById('apFeedbackHome'); return b ? {oculto: b.hidden, texto: b.textContent} : null; })(),
      aviso: !!q('.ap-feedback-pet-notice')
    };
  }

  // Palavras do texto de `el` que ficaram partidas em duas linhas (uma palavra com retângulos em alturas diferentes).
  function palavrasPartidas(el) {
    const partidas = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const re = /\S+/g;
      for (let m = re.exec(n.data); m; m = re.exec(n.data)) {
        const r = document.createRange();
        r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const tops = new Set([...r.getClientRects()].filter(x => x.width > 0).map(x => Math.round(x.top)));
        if (tops.size > 1) partidas.push(m[0]);
      }
    }
    return partidas;
  }

  function medir() {
    const r = e => { const b = e.getBoundingClientRect(); return {x: +b.left.toFixed(2), y: +b.top.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), r: +b.right.toFixed(2), b: +b.bottom.toFixed(2)}; };
    const header = q('#homeScroll .home-header'), actions = q('#homeScroll .home-actions'), h1 = header.querySelector('h1');
    const daily = document.getElementById('apHomeDailyMessage'), scroll = document.getElementById('homeScroll'), home = document.getElementById('studentHome');
    const filhos = [...actions.children].filter(vis).map(e => ({id: e.id || e.className.split(' ')[0], ...r(e)}));
    const sc = scroll.getBoundingClientRect(), cs = getComputedStyle(scroll), hs = getComputedStyle(header);
    const limiteDir = sc.right - parseFloat(cs.paddingRight) - parseFloat(hs.paddingRight);
    const limiteEsq = sc.left + parseFloat(cs.paddingLeft) + parseFloat(hs.paddingLeft);
    const sobrepostos = [];
    for (let i = 0; i < filhos.length - 1; i++) if (filhos[i].r > filhos[i + 1].x + 0.01) sobrepostos.push(filhos[i].id + '/' + filhos[i + 1].id);
    const count = document.getElementById('apFeedbackBellCount'), notifCount = document.getElementById('apStudentNotificationCount');
    return {
      largura: innerWidth, topo: r(header), h1: r(h1), h1Texto: h1.textContent.replace(/\s+/g, ' ').trim(), h1Estouro: h1.scrollWidth - h1.clientWidth,
      palavrasPartidas: palavrasPartidas(h1), diaria: daily ? r(daily) : null, acoes: r(actions), filhos,
      limiteDir: +limiteDir.toFixed(2), limiteEsq: +limiteEsq.toFixed(2),
      foraDaTela: filhos.filter(f => f.r > limiteDir + 0.5 || f.x < limiteEsq - 0.5).map(f => f.id),
      sobrepostos, estourouHorizontal: scroll.scrollWidth - scroll.clientWidth, estourouJanela: document.documentElement.scrollWidth - innerWidth,
      acoesAbaixo: r(actions).y >= r(h1).b - 1, linhasNome: Math.round(r(h1).h / parseFloat(getComputedStyle(h1).lineHeight)),
      numero: count && vis(count) ? r(count) : null, numeroNotif: notifCount && vis(notifCount) ? r(notifCount) : null
    };
  }


  // O que NÃO é o sino, para comparar a página do 1.12.292 com a do 1.12.291 (o resto precisa ser idêntico).
  function instantaneo() {
    const topo = q('#homeScroll .home-header').cloneNode(true);
    topo.querySelector('#apFeedbackBell')?.remove();
    topo.classList.remove('ap-feedback-bell-on');
    const casa = document.getElementById('apFeedbackHome'), janela = document.getElementById('apFeedbackStudent'), pet = document.getElementById('apMascotHome');
    return {
      topo: topo.outerHTML, casa: casa ? casa.outerHTML : null,
      lista: janela ? janela.querySelector('#apFeedbackStudentList').innerHTML : null,
      pet: pet ? {classe: pet.className, oculto: pet.hidden, aviso: pet.querySelector('.ap-feedback-pet-notice')?.textContent || null} : null,
      mascote: document.getElementById('apMascotFeedback') ? document.getElementById('apMascotFeedback').outerHTML : null,
      itens: APFeedbackSync.items().length, visiveis: APFeedbackSync.visible().length, pendentes: APFeedbackSync.pending().length
    };
  }

  // Servidor simulado do feedback (o mesmo desenho do teste do 1.12.282): inbox e submit, sem rede.
  function servidor(o = {}) {
    const uid = (window.__AP_STUDENT_CONTEXT || {}).storageId || UID;
    const cache = JSON.parse(localStorage.getItem('agenda_feedback_v1_' + uid) || '{"items":[]}');
    window.__srv = {items: cache.items.map(x => JSON.parse(JSON.stringify(x))), calls: [], falhaEnvio: !!o.falhaEnvio};
    window.APaccounts = Object.assign(Object.create(null), window.APaccounts, {getPhotoToken: async () => 'tok'});
    if (!window.__fetchOriginal) window.__fetchOriginal = window.fetch.bind(window);
    window.fetch = async (url, opts) => {
      const u = String(url);
      if (!u.includes('agenda-personal-distribuicao')) return window.__fetchOriginal(url, opts);
      const path = u.replace(/^https:\/\/[^/]+/, ''), body = JSON.parse((opts && opts.body) || '{}');
      window.__srv.calls.push(path);
      const json = (obj, status = 200) => ({ok: status < 400, status, json: async () => obj});
      if (path === '/api/feedback-inbox') return json({uid, items: window.__srv.items, cursor: null});
      if (path === '/api/feedback-submit') {
        if (window.__srv.falhaEnvio) return json({error: 'falha de teste'}, 500);
        const item = window.__srv.items.find(x => x.id === body.id);
        if (!item) return json({error: 'não encontrado'}, 404);
        item.response = {intensity: body.intensity, comment: body.comment, publicationBasis: 'contract', mutationId: body.mutationId, receivedAt: new Date().toISOString()};
        return json({saved: true, item});
      }
      return json({error: 'rota inesperada ' + path}, 404);
    };
  }

  window.__t = {entrar, semear, sair, estado, medir, instantaneo, servidor, UID};
})();
