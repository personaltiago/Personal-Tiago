(function (host) {
  'use strict';
  const text = value => String(value ?? '').trim();
  const norm = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const letter = index => {
    let result = '';
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result;
    return result;
  };
  function title(workout, index, historical = false) {
    const name = text(workout.label || workout.name);
    if (Number.isInteger(workout.weekday) && workout.weekday >= 0 && workout.weekday <= 6) {
      const day = weekdays[workout.weekday];
      return name && !norm(name).includes(norm(day).split('-')[0]) ? day + ' · ' + name : name || day;
    }
    const named = name.match(/^(?:treino|dia)\s+([a-z]{1,3})\b\s*[-–—:·]?\s*(.*)$/i);
    if (named) return 'Treino ' + named[1].toUpperCase() + (named[2] ? ' · ' + named[2] : '');
    const idLetter = /^[A-Z]{1,3}$/.test(text(workout.id)) ? text(workout.id) : '';
    if (historical && !idLetter) return name || 'Treino anterior ' + (index + 1);
    return 'Treino ' + (idLetter || letter(index)) + (name ? ' · ' + name : '');
  }
  function groups(workouts = [], sessions = []) {
    const result = new Map();
    for (const [index, workout] of workouts.entries()) {
      const key = text(workout.id);
      if (key && !result.has(key)) result.set(key, {key, label: title(workout, index), planName: text(workout.planName), workout, historical: false});
    }
    // A retired or deleted prescription must keep its saved history accessible.
    for (const session of sessions.slice().sort((a, b) => Number(b.finishedAt) - Number(a.finishedAt))) {
      const key = text(session.id);
      if (!key || result.has(key)) continue;
      const snapshot = session.workoutSnapshot || {};
      const workout = {...snapshot, id: key, label: session.workoutName || snapshot.label || snapshot.name};
      result.set(key, {key, label: title(workout, result.size, true), planName: text(snapshot.planName), workout, historical: true});
    }
    const list = [...result.values()], names = new Map();
    for (const item of list) names.set(item.label, (names.get(item.label) || 0) + 1);
    for (const item of list) if (names.get(item.label) > 1 && item.planName) item.label += ' · ' + item.planName;
    return list;
  }
  function matchingExercise(exercises, record) {
    const list = Array.isArray(exercises) ? exercises : [];
    if (text(record?.exerciseId || record?.id)) {
      const matches = list.filter(ex => text(ex.id || ex.exerciseId) === text(record.exerciseId || record.id) && norm(ex.name) === norm(record.name));
      if (matches.length === 1) return matches[0];
    }
    const matches = list.filter(ex => norm(ex.name) === norm(record?.name));
    return matches.length === 1 ? matches[0] : null;
  }
  function youtube(value) {
    try {
      const url = new URL(text(value));
      if (url.protocol !== 'https:' || url.username || url.password) return '';
      let id = '';
      if (/^(www\.)?youtu\.be$/.test(url.hostname)) id = url.pathname.slice(1);
      else if (/^(?:(?:www|m|music)\.)?(youtube\.com|youtube-nocookie\.com)$/.test(url.hostname)) {
        id = url.searchParams.get('v') || (/^\/(?:shorts|embed|live)\//.test(url.pathname) ? url.pathname.split('/')[2] : '');
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : '';
    } catch { return ''; }
  }
  const escape = value => text(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  function placeholder(name) {
    const initials = text(name).split(/\s+/).slice(0, 2).map(word => [...word][0] || '').join('').toLocaleUpperCase('pt-BR');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" rx="12" fill="#17252f"/><text x="80" y="56" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" fill="#e5edf2">' + escape(initials) + '</text><text x="80" y="86" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#b8c6d0">Sem prévia</text></svg>');
  }
  function photo(workouts, sessions, wid, index, item) {
    const name = text(item?.name);
    const current = workouts.find(workout => text(workout.id) === text(wid));
    const history = sessions.filter(session => text(session.id) === text(wid)).slice().sort((a, b) => Number(b.finishedAt) - Number(a.finishedAt));
    for (const session of history) {
      const records = Array.isArray(session.exerciseRecords) ? session.exerciseRecords : [];
      let record = records[index];
      if (!record || name && norm(record.name) !== norm(name)) {
        const matches = records.filter(ex => norm(ex.name) === norm(name));
        record = matches.length === 1 ? matches[0] : null;
      }
      if (!record) continue;
      const active = matchingExercise(current?.exercises, record);
      const saved = matchingExercise(session.workoutSnapshot?.exercises, record);
      // The workout cover and other exercise positions are deliberately excluded.
      for (const exercise of [active, record, saved]) {
        const image = youtube(exercise?.video);
        if (image) return image;
      }
    }
    if (name) {
      const exercise = matchingExercise(current?.exercises, {name});
      const image = youtube(exercise?.video);
      if (image) return image;
    }
    return placeholder(name || 'Exercício');
  }
  const model = Object.freeze({groups, photo, youtube, placeholder});
  host.APEvolutionWorkouts = model;
  if (!host.document || host.__AP_PUBLIC_REGISTER || typeof evGetSessions !== 'function') return;

  let selected = '', account = '', available = [], preview = false, realSelection = '';
  const workouts = () => typeof workoutsForProfile === 'function' ? workoutsForProfile() || [] : [];
  const sessions = () => evGetSessions() || [];
  const context = () => {
    const value = host.__AP_STUDENT_CONTEXT;
    return JSON.stringify([value?.role, value?.storageId, value?.area?.studentId]);
  };
  function prepare() {
    const owner = context();
    if (account !== owner) { account = owner; selected = ''; preview = false; realSelection = ''; }
    const sample = typeof evPreview !== 'undefined' && evPreview;
    if (sample && !preview) realSelection = selected;
    if (!sample && preview) selected = realSelection;
    preview = sample;
    const history = sessions(), ids = new Set(history.map(session => text(session.id)));
    available = model.groups(sample ? workouts().filter(workout => ids.has(text(workout.id))) : workouts(), history);
    if (!available.some(item => item.key === selected)) selected = available[0]?.key || '';
    return {selected, available, workouts: workouts(), history: history.filter(session => text(session.id) === selected)};
  }
  function controls() {
    const section = document.createElement('section');
    section.className = 'ap-evolution-workout';
    const label = document.createElement('label');
    label.htmlFor = 'apEvolutionWorkout';
    label.textContent = 'Evolução por treino';
    const select = document.createElement('select');
    select.id = 'apEvolutionWorkout';
    select.setAttribute('aria-label', 'Escolher treino para acompanhar a evolução');
    for (const item of available) {
      const option = document.createElement('option');
      option.value = item.key; option.textContent = item.label;
      select.append(option);
    }
    if (!available.length) {
      const option = document.createElement('option');
      option.textContent = 'Nenhum treino disponível'; select.append(option); select.disabled = true;
    }
    select.value = selected;
    select.addEventListener('change', () => {
      if (!available.some(item => item.key === select.value)) return;
      selected = select.value;
      evSelectedExercise = ''; evDetail = '';
      const scroll = document.getElementById('evMainScroll');
      if (scroll) scroll.scrollTop = 0;
      renderHistory();
    });
    section.append(label, select);
    const item = available.find(item => item.key === selected);
    if (item?.planName) {
      const caption = document.createElement('small');
      caption.textContent = item.planName; section.append(caption);
    }
    return section;
  }
  host.APEvolutionSelection = Object.freeze({prepare, controls});
  host.addEventListener('ap-account-changed', () => { account = ''; selected = ''; available = []; });
})(globalThis);
