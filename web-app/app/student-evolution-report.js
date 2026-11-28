(function (host) {
  'use strict';
  const text = value => String(value ?? '').trim();
  const norm = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const safe = value => text(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  function number(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    const raw = text(value).replace(/\s*kg$/i, '');
    if (!/^\d+(?:[.,]\d+)?$/.test(raw)) return null;
    const result = Number(raw.replace(',', '.'));
    return Number.isFinite(result) && result >= 0 && result <= 1000 ? result : null;
  }
  const exerciseId = exercise => text(exercise?.exerciseId || exercise?.id);
  function series(record) {
    const loads = Array.isArray(record.loads) ? record.loads : [];
    const count = Math.max(loads.length, record.done?.length || 0, record.targets?.length || 0);
    return Array.from({length: count}, (_, index) => {
      const unit = record.units?.[index] === 'seconds' || record.unit === 'seconds' ? 'seconds' : 'reps';
      const target = text(record.targets?.[index] ?? record.reps);
      const amount = /^\d+$/.test(target) ? Number(target) : null;
      return {round: Number(record.rounds?.[index]) || index + 1,
        done: record.done?.length ? record.done[index] === true : true,
        load: number(loads[index]), amount, target, unit};
    });
  }
  function report(workout, history = [], {start = -Infinity, end = Infinity, tab = 'cargas', records = session => session.exerciseRecords || []} = {}) {
    const items = [], ids = new Map(), names = new Map();
    const add = (exercise, key, index, retired) => {
      const item = {key, name: text(exercise.name), exerciseId: exerciseId(exercise), exercise, index, retired, entries: []};
      items.push(item);
      if (item.exerciseId) {
        const list = ids.get(item.exerciseId) || []; list.push(item); ids.set(item.exerciseId, list);
      }
      const list = names.get(norm(item.name)) || []; list.push(item); names.set(norm(item.name), list);
      return item;
    };
    for (const [index, exercise] of (workout?.exercises || []).entries()) {
      if (text(exercise?.name)) add(exercise, 'current:' + index + ':' + (exerciseId(exercise) || norm(exercise.name)), index, false);
    }
    const sorted = history.map((session, index) => ({session, index})).filter(({session}) => Number.isFinite(Number(session.finishedAt)) && (!text(workout?.id) || text(session.id) === text(workout.id)))
      .sort((a, b) => Number(a.session.finishedAt) - Number(b.session.finishedAt) || text(a.session.teacherRecordId).localeCompare(text(b.session.teacherRecordId)) || a.index - b.index);
    for (const {session, index: sessionIndex} of sorted) {
      const occurrences = new Map(), sessionRecords = records(session), counts = new Map();
      for (const record of sessionRecords) if (text(record?.name)) counts.set(norm(record.name), (counts.get(norm(record.name)) || 0) + 1);
      for (const [index, record] of sessionRecords.entries()) {
        if (!text(record?.name)) continue;
        const id = exerciseId(record), name = norm(record.name), ordinal = occurrences.get(name) || 0;
        occurrences.set(name, ordinal + 1);
        let item;
        if (id) {
          const matches = ids.get(id) || [];
          if (matches.length === 1) item = matches[0];
        } else {
          const matches = names.get(name) || [];
          if (matches.length === 1 && counts.get(name) === 1) item = matches[0];
        }
        // Explicitly different IDs and ambiguous names never borrow another
        // exercise's history. Legacy duplicates stay separate by occurrence.
        const key = 'previous:' + (id ? 'id:' + id : 'name:' + name + ':' + ordinal);
        if (!item) item = items.find(value => value.key === key) || add(record, key, index, true);
        const sets = series(record), completed = sets.filter(value => value.done);
        const loads = completed.map(value => value.load).filter(value => value !== null);
        const repetitions = completed.filter(value => value.unit === 'reps' && value.amount !== null);
        const load = loads.length ? Math.max(...loads) : null;
        const reps = repetitions.length ? repetitions.reduce((sum, value) => sum + value.amount, 0) : null;
        item.entries.push({when: Number(session.finishedAt), source: session.source === 'teacher' ? 'teacher' : 'app',
          sessionKey: session.source === 'teacher' ? 'teacher:' + text(session.teacherRecordId) : 'app:' + sessionIndex + ':' + text(session.startedAt),
          incomplete: session.incomplete === true, sets, load, totalReps: reps, value: tab === 'repeticoes' ? reps : load});
      }
    }
    for (const item of items) {
      let previous = null;
      const previousSeries = new Map();
      for (const entry of item.entries) {
        for (const set of entry.sets) {
          const before = previousSeries.get(set.round);
          set.previousLoad = before || null;
          set.loadDelta = set.done && set.load !== null && before ? Math.round((set.load - before.load) * 1e6) / 1e6 : null;
          if (set.done && set.load !== null) previousSeries.set(set.round, {load: set.load, when: entry.when});
        }
        entry.previous = previous;
        entry.delta = entry.value !== null && previous ? Math.round((entry.value - previous.value) * 1e6) / 1e6 : null;
        if (entry.value !== null) previous = entry;
      }
      item.filtered = item.entries.filter(entry => entry.when >= start && entry.when <= end);
      item.points = item.filtered.filter(entry => entry.value !== null);
      item.first = item.points[0] || null;
      item.last = item.points.at(-1) || null;
      item.net = item.first && item.last ? Math.round((item.last.value - item.first.value) * 1e6) / 1e6 : null;
      item.rise = item.points.filter(entry => entry.delta > 0).sort((a, b) => b.delta - a.delta)[0] || null;
      item.fall = item.points.filter(entry => entry.delta < 0).sort((a, b) => a.delta - b.delta)[0] || null;
    }
    return {items, current: items.filter(item => !item.retired), retired: items.filter(item => item.retired),
      sessions: sorted.map(({session}) => session).filter(session => session.finishedAt >= start && session.finishedAt <= end)};
  }
  host.APEvolutionReport = Object.freeze({report, series, number});
  if (!host.document || host.__AP_PUBLIC_REGISTER || typeof renderHistory !== 'function') return;

  let identity = '', workoutKey = '';
  const fmt = value => Number(value).toLocaleString('pt-BR', {maximumFractionDigits: 2});
  const date = when => new Date(when).toLocaleDateString('pt-BR');
  const unit = () => evTab === 'repeticoes' ? 'rep' : 'kg';
  const amount = value => value === null || value === undefined ? '—' : fmt(value) + ' ' + unit();
  const signed = value => value === null || value === undefined ? 'Primeiro registro' : (value > 0 ? '+' : value < 0 ? '−' : '') + fmt(Math.abs(value)) + ' ' + unit();
  const direction = value => value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const seriesChange = set => set.loadDelta === null ? '' : '<small class="' + direction(set.loadDelta) + '">' + (set.loadDelta > 0 ? '+' : set.loadDelta < 0 ? '−' : '') + fmt(Math.abs(set.loadDelta)) + ' kg · vs ' + date(set.previousLoad.when) + '</small>';
  const metric = (label, value, note) => '<div class="ev-metric"><small>' + label + '</small><strong>' + value + '</strong><span class="ev-metric-desc">' + note + '</span></div>';
  function badge(label, entry) {
    return '<div class="ev-chart-badge"><span class="ev-badge-text"><small>' + label + '</small><strong class="' + direction(entry?.delta) + '">' + (entry ? signed(entry.delta) : '—') + '</strong><span class="ev-badge-note">' + (entry ? amount(entry.previous.value) + ' → ' + amount(entry.value) : 'Sem variação registrada') + '</span><span class="ev-badge-extra">' + (entry ? date(entry.previous.when) + ' → ' + date(entry.when) : '') + '</span></span></div>';
  }
  function detail(item) {
    return '<div class="ev-detail" id="evOpenDetail"><div class="ev-detail-header"><div><h3>' + safe(item.name) + '</h3><small>Todas as sessões do período selecionado</small></div></div>' +
      (item.filtered.length ? '<p class="ap-ev-note">Cada série compara sua carga com o último registro da mesma série.</p>' + item.filtered.slice().reverse().map(entry => '<section class="ev-detail-entry"><div class="ap-ev-session-heading"><strong>' + date(entry.when) + '</strong><span>' + (entry.source === 'teacher' ? 'Professor' : 'Aplicativo') + (entry.incomplete ? ' · treino parcial' : '') + '</span></div><div class="ap-ev-session-value"><b>' + amount(entry.value) + '</b><span class="' + direction(entry.delta) + '">' + (entry.value === null ? 'Sem valor registrado' : signed(entry.delta)) + '</span></div>' + (entry.previous && entry.value !== null ? '<small>Comparado com ' + date(entry.previous.when) + ': ' + amount(entry.previous.value) + ' → ' + amount(entry.value) + '</small>' : '') + '<ul class="ap-ev-sets">' + entry.sets.map(set => '<li><span>' + set.round + 'ª série' + (!set.done ? ' · não concluída' : '') + '</span><span class="ap-ev-set-load"><b>' + (set.load === null ? 'Carga não informada' : fmt(set.load) + ' kg') + '</b>' + seriesChange(set) + '</span><span>' + (set.amount !== null ? fmt(set.amount) + (set.unit === 'seconds' ? ' s' : ' rep') : 'Repetições não informadas') + '</span></li>').join('') + '</ul></section>').join('') : '<p class="ap-ev-note">Nenhuma sessão registrada para este exercício no período.</p>') + '</div>';
  }
  function render() {
    const selectedBefore = typeof evSelectedExercise === 'string' ? evSelectedExercise : '';
    const previousTop = document.getElementById('evMainScroll')?.scrollTop || 0;
    const root = document.getElementById('historyContent');
    if (!root) return;
    if (!['cargas', 'repeticoes'].includes(evTab)) {
      if (evTab !== 'peso' || !host.APTeacherEvolution?.renderWeight()) {
        root.innerHTML = '<div class="ev-soon"><div class="ev-soon-icon">' + evIcon({medidas:'ruler',peso:'weight',fotos:'photo'}[evTab]) + '</div><h2>' + safe(EV_TAB_NAMES[evTab]) + '</h2><p>Os dados das avaliações corporais do professor aparecerão aqui quando forem vinculados.</p></div>';
      }
      return;
    }
    const selection = host.APEvolutionSelection.prepare();
    const control = host.APEvolutionSelection.controls();
    const selected = selection.selected;
    const context = JSON.stringify([host.__AP_STUDENT_CONTEXT?.role, host.__AP_STUDENT_CONTEXT?.storageId, host.__AP_STUDENT_CONTEXT?.area?.studentId, !!evPreview]);
    if (identity !== context || workoutKey !== selected) { evSelectedExercise = ''; evDetail = ''; }
    else evSelectedExercise = selectedBefore;
    identity = context; workoutKey = selected;
    const history = selection.history, plans = selection.workouts, active = plans.find(workout => text(workout.id) === selected);
    let workout = active;
    if (active && !Array.isArray(active.exercises) && typeof exercisesFor === 'function') workout = {...active, exercises: exercisesFor(selected)};
    if (!workout) workout = history.slice().sort((a, b) => b.finishedAt - a.finishedAt).find(session => session.workoutSnapshot?.exercises)?.workoutSnapshot;
    if (!workout && evPreview) workout = {exercises: evSessionRecords(history[0] || {})};
    workout = {...workout, id: selected};
    const data = report(workout, history, {start: evPeriodStart(), tab: evTab, records: evSessionRecords});
    const chosen = data.items.find(item => item.key === evSelectedExercise) || data.items.find(item => item.points.length) || data.items[0];
    evSelectedExercise = chosen?.key || '';
    const tracked = data.items.filter(item => item.points.length).length;
    const timed = data.sessions.filter(session => session.durationKnown !== false && Number.isFinite(Number(session.durationMs)));
    const minutes = Math.round(timed.reduce((sum, session) => sum + Number(session.durationMs), 0) / 60000);
    let html = evPreview ? '<div class="ev-sample-bar"><span><b>Prévia visual</b> · dados fictícios</span><button type="button" data-ev-preview>Ver meus dados</button></div>' : '';
    if (!history.length && !evPreview) html += '<div class="ev-empty-note"><strong>Sua evolução começa no primeiro treino.</strong><div>Todos os exercícios do treino estão abaixo. As cargas aparecem quando forem registradas.</div><button type="button" data-ev-preview>Ver exemplo visual</button></div>';
    html += '<div class="ev-metrics">' + metric('Treinos no período', fmt(data.sessions.length), 'Professor e aplicativo') + metric('Exercícios do treino', fmt(data.current.length), 'Lista completa') + metric(evTab === 'cargas' ? 'Com carga registrada' : 'Com repetições', fmt(tracked), 'No período selecionado') + metric('Tempo registrado', timed.length ? Math.floor(minutes / 60) + 'h ' + minutes % 60 + 'min' : '—', 'Sessões com duração') + '</div>';
    html += '<div class="ev-section-heading"><h2>' + (evTab === 'cargas' ? 'Evolução das cargas' : 'Evolução das repetições') + '</h2><select class="ev-chart-select" aria-label="Escolher exercício">' + data.items.map(item => '<option value="' + safe(item.key) + '"' + (item === chosen ? ' selected' : '') + '>' + safe(item.name) + (item.retired ? ' · anterior' : '') + '</option>').join('') + '</select></div>';
    html += '<p class="ap-ev-method">' + (evTab === 'cargas' ? 'Maior carga concluída em cada sessão. Todas as séries aparecem no histórico do exercício.' : 'Total de repetições concluídas em cada sessão. Séries por tempo aparecem separadas no histórico.') + '</p>';
    html += '<div class="ev-chart-panel">' + evChart(chosen ? chosen.points.map(entry => ({when: entry.when, label: date(entry.when), y: entry.value})) : []) + '</div>';
    html += '<div class="ev-chart-badges">' + badge('Maior aumento entre sessões', chosen?.rise) + badge('Maior redução entre sessões', chosen?.fall) + '</div>';
    const row = item => {
      const thumb = host.APEvolutionWorkouts.youtube(item.exercise.video) || (evPreview ? evPhoto(selected, item.index) : host.APEvolutionWorkouts.photo(plans, history, selected, item.index, item));
      const open = evDetail === item.key;
      const latest = item.last;
      const lastNote = latest ? latest.delta === null ? 'Primeiro registro · ' + date(latest.when) : 'Última mudança: ' + signed(latest.delta) + ' · ' + date(latest.when) : item.entries.length ? 'Sem registro neste período' : 'Ainda sem registro';
      return '<button type="button" class="ev-ex-row" data-ev-open="' + safe(item.key) + '" aria-expanded="' + open + '" aria-label="Ver histórico de ' + safe(item.name) + '"><img class="ev-ex-img" src="' + safe(thumb) + '" alt="Prévia de ' + safe(item.name) + '"><span class="ev-ex-main"><strong>' + safe(item.name) + '</strong><span class="ap-ev-last ' + direction(latest?.delta) + '">' + lastNote + '</span></span><span class="ev-ex-stats"><span class="ev-ex-stat"><small>Primeira no período</small><b>' + amount(item.first?.value) + '</b></span><span class="ev-ex-stat"><small>Última no período</small><b>' + amount(latest?.value) + '</b></span><span class="ev-ex-stat"><small>Variação no período</small><b class="' + direction(item.net) + '">' + (item.net === null ? '—' : signed(item.net)) + '</b></span></span><span class="ev-ex-row-arrow" aria-hidden="true">' + (open ? '⌄' : '›') + '</span></button>' + (open ? detail(item) : '');
    };
    html += '<div class="ev-list-toolbar"><h2>Exercícios do treino</h2><span>' + data.current.length + ' exercícios</span></div><div class="ev-ex-list">' + (data.current.length ? data.current.map(row).join('') : '<div class="ev-empty-note">A prescrição atual deste treino não está disponível.</div>') + '</div>';
    if (data.retired.length) html += '<div class="ev-list-toolbar"><h2>Exercícios anteriores deste treino</h2></div><div class="ev-ex-list">' + data.retired.map(row).join('') + '</div>';
    html += '<p class="ev-disclaimer">Somente valores registrados em séries concluídas. As variações comparam sessões; a carga prescrita não substitui a realizada. “—” indica ausência de registro. Toque em um exercício para ver as datas, as séries e cada aumento ou redução.</p>';
    root.innerHTML = html; root.prepend(control);
    const select = root.querySelector('.ev-chart-select');
    if (select) { select.disabled = !data.items.length; select.addEventListener('change', () => { evSelectedExercise = select.value; evDetail = ''; renderHistory(); }); }
    root.querySelector('[data-ev-preview]')?.addEventListener('click', evTogglePreview);
    for (const button of root.querySelectorAll('[data-ev-open]')) button.addEventListener('click', () => {
      const key = button.dataset.evOpen;
      evDetail = evDetail === key ? '' : key; evSelectedExercise = key;
      renderHistory();
      if (evDetail) document.getElementById('evOpenDetail')?.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    });
    for (const image of root.querySelectorAll('img.ev-ex-img')) image.addEventListener('error', () => { image.src = host.APEvolutionWorkouts.placeholder(image.alt.replace(/^Prévia de /, '')); }, {once: true});
    const scroll = document.getElementById('evMainScroll');
    if (scroll) scroll.scrollTop = Math.min(previousTop, Math.max(0, scroll.scrollHeight - scroll.clientHeight));
  }
  host.APEvolutionView = Object.freeze({render});
  host.addEventListener('ap-account-changed', () => { identity = ''; workoutKey = ''; evSelectedExercise = ''; evDetail = ''; });
  if (host.document.body?.dataset.view === 'history' && (typeof evLoading === 'undefined' || !evLoading)) renderHistory();
})(globalThis);
