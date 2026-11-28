(function (host) {
  'use strict';
  if (host.__AP_PUBLIC_REGISTER) return;
  const palettes = {rosa: '#f52283', verde: '#00d98d', preto: '#b6bec7', azul: '#138cff', roxo: '#8f35df'};
  function color(value) {
    const preference = value || prefs();
    if (/^#[a-f0-9]{6}$/i.test(preference.color || '')) return preference.color;
    return palettes[preference.theme] || palettes[currentProfileGender() === 'Masculino' ? 'azul' : 'rosa'];
  }
  function apply() {
    const accent = color();
    for (const [id, property] of [
      ['studentHome', '--home-accent'], ['workoutsScreen', '--ws-accent'],
      ['exerciseScreen', '--ex-accent'], ['historyScreen', '--history-accent'],
      ['profileScreen', '--profile-accent'], ['apFeedbackStudent', '--fb-accent']
    ]) host.document.getElementById(id)?.style.setProperty(property, accent);
  }
  host.APStudentTheme = Object.freeze({color, apply});
  for (const name of ['renderPrefs', 'renderHome', 'renderWorkouts', 'renderExerciseApp', 'renderExerciseDetail', 'renderHistory', 'profileRender']) {
    const render = host[name];
    if (typeof render === 'function') host[name] = function (...args) {
      const result = render.apply(this, args);
      apply();
      return result;
    };
  }
  // Reading the history must refresh the teacher's records as well as drawing
  // the cached view. Existing request coalescing and account guards remain active.
  if (typeof route === 'function') {
    const navigate = route;
    route = function (view, ...args) {
      const result = navigate.call(this, view, ...args);
      if (view === 'history') host.APTeacherEvolution?.refresh(true);
      if (view === 'home') host.APFeedbackSync?.schedule();
      apply();
      return result;
    };
  }
  host.addEventListener('ap-student-ready', apply);
  host.addEventListener('ap-account-changed', apply);
  host.addEventListener('ap-feedback-changed', () => host.APTeacherEvolution?.schedule());
  apply();
})(globalThis);
