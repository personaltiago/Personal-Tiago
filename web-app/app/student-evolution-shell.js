/* Evolution state, navigation and chart primitives. One renderer owns the content. */
let evTab="cargas", evPeriod="all", evSelectedExercise="", evDetail="", evPreview=false, evLoading=false;
const EV_TAB_NAMES={cargas:"Cargas",repeticoes:"Repetições",medidas:"Medidas",peso:"Peso",fotos:"Fotos"};
const evFmt=n=>Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:1});
function evDate(ts) {
  return new Date(ts).toLocaleDateString("pt-BR");
}

function evUnit() {
  return evTab === "repeticoes" ? "rep" : "kg";
}

function evChangeTab(tab) {
  if (!EV_TAB_NAMES[tab]) return;
  if (["medidas", "peso", "fotos"].includes(tab)) {
    openAssessments(tab);
    return;
  }
  evTab = tab;
  evDetail = "";
  evSelectedExercise = "";
  renderHistory();
}

function evSetPeriod(period) {
  evPeriod = ["1m", "3m", "6m", "12m", "all"].includes(period) ? period : "3m";
  evDetail = "";
  renderHistory();
}

function evTogglePreview() {
  evPreview = !evPreview;
  evSelectedExercise = "";
  evDetail = "";
  renderHistory();
}

function evPeriodStart() {
  if (evPeriod === "all") return -Infinity;
  const today = /* @__PURE__ */ new Date();
  today.setHours(23, 59, 59, 999);
  today.setMonth(today.getMonth() - ({ "1m": 1, "3m": 3, "6m": 6, "12m": 12 }[evPeriod] || 3));
  return today.getTime();
}

function evSessionRecords(s) {
  if (Array.isArray(s.exerciseRecords)) return s.exerciseRecords;
  const set = (s.gender === "Masculino" ? EXERCISES_MALE : EXERCISES_FEMALE)[s.id] || [];
  return set.map((row, i) => ({ name: row[0], muscles: row[1], reps: row[3], sets: 3, loads: Array.isArray(s.loads?.[i]) ? s.loads[i] : [], done: Array.isArray(s.done?.[i]) ? s.done[i] : [] }));
}

function evIcon(name) {
  const paths = { dumbbell: '<path d="M2 9v6m3-9v12m3-8v4m8-4v4m3-8v12m3-9v6M8 12h8"/>', chart: '<path d="M4 20v-6m5 6V9m5 11V5m5 15V2"/>', fire: '<path d="M12 22c5.5 0 8-4.3 8-8.4 0-3.9-2.3-6.5-4.5-8.1.2 3-2.4 4.6-2.4 4.6C13.1 6.5 9 3 9 3c.1 4.5-5 6.1-5 10.9C4 18.8 7 22 12 22Z"/><path d="M12 21c2.2 0 3.3-1.8 3.3-3.6 0-1.7-1-2.8-1.7-3.4 0 1.7-1.6 2.4-1.6 2.4C12 14.8 10.3 13 10.3 13c0 1.7-2 2.7-2 4.6 0 1.9 1.3 3.4 3.7 3.4Z"/>', trophy: '<path d="M8 4h8v9a4 4 0 0 1-8 0V4ZM8 6H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 17v4m-5 0h10"/>', increase: '<path d="m3 17 7-7 4 4 7-9M15 5h6v6"/>', decrease: '<path d="m3 7 7 7 4-4 7 9M15 19h6v-6"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18M8 14h2m4 0h2M8 18h2"/>', reps: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>', ruler: '<path d="m4 16 12-12 4 4L8 20l-4-4Zm4-4 2 2m2-6 2 2m2-6 2 2"/>', weight: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2M3 12h18"/>', photo: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.4"/><path d="m4 18 6-6 3 3 3-4 4 5"/>' };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.chart) + "</svg>";
}

function evAmount(val, sign = false) {
  return (sign && val > 0 ? "+" : "") + evFmt(val) + " " + evUnit();
}

function evPhoto(wid, idx) {
  const w = workoutsForProfile();
  const workout = w.find((x) => x.id === wid) || w[0];
  if (currentProfileGender() === "Feminino" && wid === "A" && idx >= 0 && idx < EX_REFERENCE_THUMBS.length) return EX_REFERENCE_THUMBS[idx];
  if (currentProfileGender() === "Masculino" && wid === "C" && idx === 1) return EX_PHOTO_MALE_EXT;
  return photoForWorkout(workout?.photo);
}

function evChart(points) {
  if (!points.length) return '<div class="ev-empty-chart"><b>Sem registros neste per\xEDodo</b><span>Finalize um treino para acompanhar seu progresso.</span></div>';
  const width = 740, height = 210, l = 60, r = 21, t = 23, b = 32, w = width - l - r, h = height - t - b, vals = points.map((p) => Number(p.y) || 0);
  const max = Math.max(1, ...vals), range = max <= 20 ? 5 : max <= 100 ? 20 : max <= 250 ? 50 : Math.pow(10, Math.floor(Math.log10(max))) / 2;
  const upper = Math.ceil(max * 1.12 / range) * range;
  const coords = points.map((p, i) => ({ x: l + (points.length === 1 ? 0.5 : i / (points.length - 1)) * w, y: t + (upper - (Number(p.y) || 0)) / upper * h, p }));
  let grid = '<text x="14" y="' + (t + h / 2) + '" transform="rotate(-90 14 ' + (t + h / 2) + ')" fill="#ccd2df" font-size="14" text-anchor="middle">' + (evTab === "cargas" ? "Carga (kg)" : "Repeti\xE7\xF5es") + "</text>";
  for (let i = 0; i <= 4; i++) {
    const val = upper * (4 - i) / 4, y = t + i * h / 4;
    grid += '<line x1="' + l + '" y1="' + y + '" x2="' + (width - r) + '" y2="' + y + '" stroke="#203341" stroke-width="1"/><text x="' + (l - 10) + '" y="' + (y + 4) + '" fill="#c0ccda" font-size="13" text-anchor="end">' + evFmt(val) + "</text>";
  }
  const ticks = new Set(coords.map((_, i) => i).filter((i) => coords.length <= 7 || i === 0 || i === coords.length - 1 || i % Math.ceil(coords.length / 5) === 0));
  for (const i of ticks) {
    const x = coords[i].x;
    grid += '<line x1="' + x + '" x2="' + x + '" y1="' + t + '" y2="' + (t + h) + '" stroke="#19303c" stroke-width="1"/>';
  }
  const d = coords.map((p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
  const area = d + " L" + coords[coords.length - 1].x + " " + (t + h) + " L" + coords[0].x + " " + (t + h) + " Z";
  const circle = coords.map((p, i) => '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="5.4" fill="var(--history-accent)" stroke="#f573af" stroke-width=".6"><title>' + p.p.label + ": " + evAmount(p.p.y) + "</title></circle>").join("");
  const labels = coords.map((p, i) => coords.length <= 10 || i === 0 || i === coords.length - 1 || i % Math.max(1, Math.floor(coords.length / 9)) === 0 ? '<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 11).toFixed(1) + '" text-anchor="middle" fill="#fff" font-size="12.5" font-weight="650">' + evFmt(p.p.y) + "</text>" : "").join("");
  const dates = coords.map((p, i) => ticks.has(i) ? '<text x="' + p.x.toFixed(1) + '" y="' + (height - 6) + '" fill="#bdc9d6" font-size="12" text-anchor="middle">' + p.p.label.slice(0, 5) + "</text>" : "").join("");
  return '<svg viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="Gr\xE1fico de evolu\xE7\xE3o com ' + points.length + ' registros"><defs><linearGradient id="evAreaGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--history-accent)" stop-opacity=".4"/><stop offset="100%" stop-color="var(--history-accent)" stop-opacity="0"/></linearGradient></defs>' + grid + '<path d="' + area + '" fill="url(#evAreaGrad2)"/><path d="' + d + '" stroke="var(--history-accent)" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round" fill="none"/>' + circle + labels + dates + "</svg>";
}

function evExampleSessions() {
  const now = /* @__PURE__ */ new Date(), gender = currentProfileGender(), base = gender === "Masculino" ? EXERCISES_MALE.A : EXERCISES_FEMALE.A;
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (11 - i) * 7);
    date.setHours(18, 0, 0, 0);
    const records = base.map((e, j) => ({ name: e[0], muscles: e[1], reps: e[3], sets: 3, loads: Array.from({ length: 3 }, (_2, k) => Math.round(30 + j * 9 + i * (j === 4 ? -0.5 : (j + 2) * 1.5) + k * 2)), done: [true, true, true] }));
    return { id: "A", gender, finishedAt: date.getTime(), startedAt: date.getTime() - 45 * 6e4, durationMs: 45 * 6e4, exerciseRecords: records };
  });
}

function evGetSessions(){if(evPreview)return evExampleSessions();const history=exStore().history||[];return window.APTeacherEvolution?.sessions(history)||history;}
function renderHistory(){
  const screen=el('historyScreen'), p=prefs();
  const accent=window.APStudentTheme?.color(p)||p.color||(currentProfileGender()==='Masculino'?'#138cff':'#f52283');
  screen.style.setProperty('--history-accent',accent);
  screen.style.setProperty('--ev-scale',({pequena:.9,media:1,grande:1.12})[p.font]||1);
  screen.classList.toggle('ev-light',p.mode==='claro');
  el('evPeriod').value=evPeriod;
  screen.querySelectorAll('[data-evtab]').forEach(button=>{const selected=button.dataset.evtab===evTab;button.classList.toggle('chosen',selected);button.setAttribute('aria-selected',String(selected));});
  screen.querySelectorAll('[data-evnav]').forEach(node=>node.innerHTML=iconSvg(p.icons||'padrao',node.dataset.evnav));
  screen.querySelectorAll('[data-evicon]').forEach(node=>node.innerHTML=evIcon(node.dataset.evicon));
  if(window.APEvolutionView){
    window.APEvolutionView.render();
    window.APTeacherEvolution?.decorate();
    window.APTeacherEvolution?.schedule();
    return;
  }
  if(evLoading)return;
  const root=el('historyContent');root.innerHTML='<p class="ap-ev-note" role="status">Preparando sua evolução…</p>';
  if(typeof window.APloadWorkoutSync!=='function')return;
  evLoading=true;
  window.APloadWorkoutSync().then(()=>{evLoading=false;if(document.body.dataset.view==='history')renderHistory();}).catch(()=>{evLoading=false;if(document.body.dataset.view==='history')root.innerHTML='<p class="ap-ev-note" role="status">Não foi possível abrir a evolução. Abra a tela novamente para tentar.</p>';});
}
