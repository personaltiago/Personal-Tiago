/* Shared synchronization and theme integration; no evolution rendering hooks. */
!(function(e) {
  "use strict";
  const t = (e2, t2 = 160) => String(e2 ?? "").trim().slice(0, t2), r = (e2) => {
    if ("number" != typeof e2 && "string" != typeof e2 || "string" == typeof e2 && !/^\d+(?:[.,]\d+)?$/.test(e2.trim())) return null;
    const t2 = Number(String(e2).replace(",", "."));
    return Number.isFinite(t2) && t2 >= 0 && t2 <= 1e3 ? t2 : null;
  }, s = (e2) => JSON.stringify([e2.id, e2.startedAt, e2.finishedAt]);
  function n(e2) {
    if (!e2 || false !== e2.incomplete || !t(e2.id) || !Number.isFinite(e2.startedAt) || !Number.isFinite(e2.finishedAt) || e2.startedAt < 0 || e2.finishedAt < e2.startedAt || e2.finishedAt - e2.startedAt > 26784e5 || !Array.isArray(e2.exerciseRecords) || !e2.exerciseRecords.length || e2.exerciseRecords.length > 80) return null;
    const s2 = [];
    for (const n2 of e2.exerciseRecords) {
      if (!n2 || !t(n2.name) || !Array.isArray(n2.done) || !n2.done.length || n2.done.length > 30 || n2.done.some((e4) => true !== e4)) return null;
      const e3 = n2.done.length;
      s2.push({ exerciseId: t(n2.exerciseId), name: t(n2.name), sets: e3, reps: t(n2.reps, 40), targets: Array.from({ length: e3 }, (e4, r2) => t(n2.targets?.[r2] ?? n2.reps, 40)), loads: Array.from({ length: e3 }, (e4, t2) => r(n2.loads?.[t2])), done: Array(e3).fill(true) });
    }
    return { id: t(e2.id), startedAt: e2.startedAt, finishedAt: e2.finishedAt, durationMs: e2.finishedAt - e2.startedAt, workoutName: t(e2.workoutName || e2.workoutSnapshot?.label), intensity: t(e2.intensity, 60), comment: t(e2.comment, 1e3), incomplete: false, exerciseRecords: s2 };
  }
  e.APStudentProgressModel = Object.freeze({ normalize: n, key: s, groups: function(e2, r2 = -1 / 0) {
    const o = /* @__PURE__ */ new Map();
    for (const s2 of e2) {
      const e3 = n(s2);
      !e3 || e3.finishedAt < r2 || e3.exerciseRecords.forEach((r3, s3) => {
        const n2 = t(r3.name).normalize("NFKC").toLocaleLowerCase("pt-BR"), i2 = JSON.stringify([e3.id, r3.exerciseId || n2, r3.exerciseId ? "" : s3, n2]);
        o.has(i2) || o.set(i2, { key: i2, name: r3.name, workoutName: e3.workoutName || e3.id, entries: [], sets: 0 });
        const a = o.get(i2);
        a.name = r3.name, a.sets = Math.max(a.sets, r3.sets), a.entries.push({ when: e3.finishedAt, exercise: r3, record: e3 });
      });
    }
    const i = [...o.values()];
    for (const e3 of i) e3.entries.sort((e4, t2) => e4.when - t2.when || s(e4.record).localeCompare(s(t2.record)));
    return i.sort((e3, t2) => e3.name.localeCompare(t2.name, "pt-BR") || e3.workoutName.localeCompare(t2.workoutName, "pt-BR"));
  }, points: function(e2, t2 = "load", r2 = 0) {
    return (e2?.entries || []).flatMap((e3) => {
      const s2 = e3.exercise;
      let n2 = null;
      return "reps" === t2 ? s2.targets.every((e4) => /^\d+$/.test(e4)) && (n2 = s2.targets.reduce((e4, t3) => e4 + Number(t3), 0)) : n2 = s2.loads[r2] ?? null, null === n2 ? [] : [{ when: e3.when, value: n2, record: e3.record }];
    });
  }, numeric: r });
})(globalThis);
!(function() {
  "use strict";
  if (window.APWorkoutSync || window.__AP_PUBLIC_REGISTER) return;
  const e = APStudentProgressModel, o = () => "student" === window.__AP_STUDENT_CONTEXT?.role ? window.__AP_STUDENT_CONTEXT.storageId : "", t = () => true === window.APaccounts?.isTeacher(), r = (e2) => "agenda_progress_sent_v1_" + e2, n = (e2) => "agenda_progress_teacher_v1_" + APStudentModel.TEACHER + "_" + e2;
  let a = 0, s = false, i = 0, c = "";
  const d = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), u = (e2, o2) => {
    try {
      return JSON.parse(localStorage.getItem(e2) || "null") || o2;
    } catch (e3) {
      return o2;
    }
  };
  function f(e2) {
    c = e2;
    let o2 = document.getElementById("apWorkoutSyncStatus");
    const t2 = document.getElementById("historyScreen");
    !o2 && t2 && (o2 = document.createElement("p"), o2.id = "apWorkoutSyncStatus", o2.setAttribute("role", "status"), o2.style.cssText = "padding:0 16px;font:12px/1.5 Arial,sans-serif;color:inherit;opacity:.8", t2.appendChild(o2)), o2 && (o2.textContent = e2, o2.hidden = !e2);
  }
  async function p(e2, r2) {
    const n2 = o(), s2 = t(), i2 = a, c2 = await APaccounts.getPhotoToken();
    if (i2 !== a || n2 !== o() || s2 !== t()) throw Error("A conta foi alterada.");
    const d2 = await fetch("https://agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site" + e2, { method: "POST", headers: { Authorization: "Bearer " + c2, "Content-Type": "application/json" }, body: JSON.stringify(r2), signal: globalThis.AbortSignal?.timeout?.(25e3) });
    let l2;
    try {
      l2 = await d2.json();
    } catch (e3) {
      throw Error("O serviço não respondeu. Tente novamente com conexão.");
    }
    if (!d2.ok) throw Error(l2.error || "Não foi possível sincronizar os treinos.");
    return l2;
  }
  function g() {
    clearTimeout(i), i = setTimeout(h, 700);
  }
  async function h() {
    const t2 = o(), n2 = a;
    if (!t2 || s) return;
    const i2 = exStore().history, c2 = (Array.isArray(i2) ? i2 : []).map(e.normalize).filter(Boolean), d2 = u(r(t2), {}), l2 = c2.filter((o2) => !d2[e.key(o2)]);
    if (l2.length) if (false !== navigator.onLine) {
      s = true, f("Enviando os treinos concluídos ao professor…");
      try {
        for (const s3 of l2.slice(0, 10)) {
          if (n2 !== a || t2 !== o()) return;
          const i3 = await p("/api/student-workout", { workout: s3 });
          if (n2 !== a || t2 !== o()) return;
          if (true !== i3.saved || i3.uid !== t2 || i3.recordKey !== e.key(s3)) throw Error("A confirmação do treino não foi recebida.");
          d2[e.key(s3)] = true;
          const l3 = {};
          for (const o2 of c2) d2[e.key(o2)] && (l3[e.key(o2)] = true);
          localStorage.setItem(r(t2), JSON.stringify(l3));
        }
        const s2 = l2.length > 10;
        f(s2 ? "Enviando os treinos concluídos ao professor…" : "Treinos enviados ao professor."), s2 && g();
      } catch (e2) {
        n2 === a && t2 === o() && f("Treinos salvos neste aparelho. O envio ao professor será tentado novamente com conexão.");
      } finally {
        s = false, n2 !== a && o() && g();
      }
    } else f("Treinos salvos neste aparelho. Aguardando conexão para enviar ao professor.");
    else f(c2.length ? "Treinos enviados ao professor." : "");
  }
  function y(o2) {
    if (!t() || !/^[A-Za-z0-9_-]{1,128}$/.test(o2 || "")) return [];
    if (!d.has(o2)) {
      const t2 = u(n(o2), null);
      d.set(o2, { records: Array.isArray(t2?.records) ? t2.records.map(e.normalize).filter(Boolean) : [], at: t2?.at || "", message: "" });
    }
    return d.get(o2).records.slice();
  }
  const m = exSave;
  exSave = function(e2) {
    const t2 = m(e2);
    return t2 && o() && g(), t2;
  }, window.APWorkoutSync = Object.freeze({ pump: h, schedule: g, records: y, refresh: async function(o2) {
    if (!t() || !/^[A-Za-z0-9_-]{1,128}$/.test(o2 || "")) throw Error("O aluno precisa ter uma conta vinculada ao professor.");
    if (l.has(o2)) return l.get(o2);
    const r2 = a;
    y(o2);
    const s2 = (async () => {
      if (false === navigator.onLine) return d.get(o2).message = "Sem conexão. Exibindo os registros já recebidos neste aparelho.", y(o2);
      try {
        const s3 = new Map(y(o2).map((o3) => [e.key(o3), o3]));
        let i2 = null, c2 = 0;
        do {
          const n2 = await p("/api/student-workouts", { uid: o2, cursor: i2 });
          if (r2 !== a || !t()) throw Error("A conta foi alterada.");
          if (n2.uid !== o2 || !Array.isArray(n2.workouts) || null !== n2.cursor && "string" != typeof n2.cursor) throw Error("O histórico recebido não corresponde ao aluno selecionado.");
          for (const o3 of n2.workouts) {
            const t2 = e.normalize(o3);
            t2 && s3.set(e.key(t2), t2);
          }
          if (i2 = n2.cursor, c2++, i2 && c2 >= 100) throw Error("Histórico extenso. Atualize novamente para continuar a consulta.");
        } while (i2);
        if (r2 !== a || !t()) return [];
        const l2 = { records: [...s3.values()].sort((e2, o3) => e2.finishedAt - o3.finishedAt), at: (/* @__PURE__ */ new Date()).toISOString(), message: "" };
        d.set(o2, l2);
        try {
          localStorage.setItem(n(o2), JSON.stringify({ records: l2.records, at: l2.at }));
        } catch (e2) {
          l2.message = "Registros recebidos. Não foi possível manter uma cópia neste aparelho.";
        }
        return l2.records.slice();
      } catch (e2) {
        throw r2 === a && t() && (d.get(o2).message = "Não foi possível atualizar agora. " + (y(o2).length ? "Exibindo os registros já recebidos." : "Conecte o aplicativo atualizado do aluno para enviar os treinos.")), e2;
      }
    })();
    l.set(o2, s2);
    try {
      return await s2;
    } finally {
      l.get(o2) === s2 && l.delete(o2);
    }
  }, summary: function(e2) {
    return y(e2), t() ? { at: d.get(e2)?.at || "", message: d.get(e2)?.message || "" } : { at: "", message: "" };
  }, status: () => c }), window.addEventListener("ap-account-changed", () => {
    a++, clearTimeout(i), d.clear(), l.clear(), f("");
  }), window.addEventListener("ap-student-ready", g), window.addEventListener("online", g), document.addEventListener("visibilitychange", () => {
    document.hidden || g();
  }), setInterval(() => {
    document.hidden || g();
  }, 6e4), g();
})();
;
!(function(e) {
  "use strict";
  const r = (e2, r2 = 160) => String(e2 ?? "").trim().slice(0, r2), t = (e2, r2 = 1e3) => {
    if ("number" != typeof e2 && "string" != typeof e2) return null;
    const t2 = String(e2).trim().replace(/\s*kg\s*$/i, "");
    if (!/^\d+(?:[.,]\d+)?$/.test(t2)) return null;
    const s2 = Number(t2.replace(",", "."));
    return Number.isFinite(s2) && s2 >= 0 && s2 <= r2 ? s2 : null;
  }, s = (e2, r2 = 100) => /^\d+$/.test(String(e2 ?? "")) && Number(e2) >= 1 && Number(e2) <= r2 ? Number(e2) : null, n = Object.freeze({ fromTeacher: function(e2) {
    if (!e2 || !r(e2.id) || !Array.isArray(e2.exercises) || !e2.exercises.length || e2.exercises.length > 80) return null;
    const n2 = (function(e3) {
      if (e3.date) {
        const r3 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e3.date);
        if (!r3) return null;
        const [t2, s2, n3] = r3.slice(1).map(Number), i2 = Date.UTC(t2, s2 - 1, n3, 16), o2 = new Date(i2);
        return o2.getUTCFullYear() !== t2 || o2.getUTCMonth() !== s2 - 1 || o2.getUTCDate() !== n3 ? null : i2;
      }
      const r2 = Date.parse(e3.finishedAt || e3.recordedAt || "");
      return Number.isFinite(r2) ? r2 : null;
    })(e2);
    if (null === n2 || n2 < 0 || n2 > Date.now() + 864e5) return null;
    let i = t(e2.durationSeconds, 2678400);
    if (null !== i) i = Math.round(1e3 * i);
    else {
      const r2 = Date.parse(e2.startedAt || ""), t2 = Date.parse(e2.finishedAt || e2.recordedAt || "");
      i = Number.isFinite(r2) && Number.isFinite(t2) && t2 >= r2 && t2 - r2 <= 26784e5 ? t2 - r2 : null;
    }
    let o = Number(e2.totalExercises) === e2.exercises.length;
    const u = [];
    for (const n3 of e2.exercises) {
      if (!n3 || !r(n3.name)) continue;
      let e3 = [];
      if (Array.isArray(n3.performedSets) && n3.performedSets.length) {
        const r2 = /* @__PURE__ */ new Set();
        for (const i3 of n3.performedSets.slice().sort((e4, r3) => Number(e4?.round) - Number(r3?.round))) {
          const n4 = s(i3?.round), o2 = "seconds" === i3?.unit, u2 = s(o2 ? i3.seconds ?? i3.reps : i3?.reps, o2 ? 86400 : 999);
          n4 && u2 && !r2.has(n4) && false !== i3.done && (r2.add(n4), e3.push({ round: n4, reps: String(u2), load: t(i3.load), unit: o2 ? "seconds" : "reps" }));
        }
      } else {
        const i3 = s(n3.sets);
        if (!i3) continue;
        e3 = Array.from({ length: i3 }, (e4, s2) => ({ round: s2 + 1, reps: r(n3.reps, 40), load: t(n3.load), unit: "seconds" === n3.unit ? "seconds" : "reps" }));
      }
      if (!e3.length || e3.length > 100) continue;
      const i2 = s(n3.biset?.roundsPlanned ?? (Array.isArray(n3.technique?.rows) && n3.technique.rows.length ? n3.technique.rows.reduce((e4, r2) => e4 + Number(r2.sets), 0) : n3.prescribed?.sets));
      i2 && e3.length !== i2 && (o = false), u.push({ exerciseId: r(n3.exerciseId), name: r(n3.name), muscles: r(n3.muscle, 300), sets: e3.length, reps: e3.every((r2) => r2.reps === e3[0].reps) ? e3[0].reps : "", targets: e3.map((e4) => e4.reps), loads: e3.map((e4) => e4.load), units: e3.map((e4) => e4.unit), rounds: e3.map((e4) => e4.round), done: e3.map(() => true) });
    }
    if (!u.length) return null;
    u.length !== e2.exercises.length && (o = false);
    const d = t(e2.bodyWeight, 500);
    return { source: "teacher", teacherRecordId: r(e2.id), id: r(e2.planId) + "~" + r(e2.dayId), startedAt: Math.max(0, n2 - (i || 0)), finishedAt: n2, durationMs: i || 0, durationKnown: null !== i, workoutName: r(e2.dayName || e2.planName || "Treino registrado"), incomplete: !o, bodyWeight: null !== d && d >= 0.1 ? d : null, exerciseRecords: u };
  }, valid: function(e2) {
    return !!e2 && "teacher" === e2.source && !!r(e2.teacherRecordId) && Number.isSafeInteger(e2.finishedAt) && e2.finishedAt >= 0 && Number.isSafeInteger(e2.startedAt) && e2.startedAt >= 0 && e2.startedAt <= e2.finishedAt && Number.isSafeInteger(e2.durationMs) && e2.durationMs >= 0 && e2.durationMs <= 26784e5 && "boolean" == typeof e2.incomplete && Array.isArray(e2.exerciseRecords) && e2.exerciseRecords.length > 0 && e2.exerciseRecords.length <= 80 && e2.exerciseRecords.every((e3) => e3 && "string" == typeof e3.name && e3.name.length > 0 && e3.name.length <= 160 && Number.isInteger(e3.sets) && e3.sets > 0 && e3.sets <= 100 && ["done", "loads", "targets", "units"].every((r2) => Array.isArray(e3[r2]) && e3[r2].length === e3.sets) && e3.done.every((e4) => true === e4) && e3.loads.every((e4) => null === e4 || "number" == typeof e4 && t(e4) === e4) && e3.targets.every((e4) => "string" == typeof e4 && e4.length <= 40) && e3.units.every((e4) => ["reps", "seconds"].includes(e4)));
  }, number: t });
  "object" == typeof module && module.exports ? module.exports = n : e.APTeacherEvolutionModel = n;
})(globalThis);
;
!(function() {
  "use strict";
  if (window.__AP_PUBLIC_REGISTER) return;
  const e = { rosa: "#f52283", verde: "#00d98d", preto: "#b6bec7", azul: "#138cff", roxo: "#8f35df" };
  function r(r2) {
    const o2 = r2 || prefs(), n = currentProfileGender();
    return /^#[a-f0-9]{6}$/i.test(o2.color || "") ? o2.color : e[o2.theme] || e["Masculino" === n ? "azul" : "rosa"];
  }
  function o() {
    const e2 = r();
    for (const [r2, o2] of [["workoutsScreen", "--ws-accent"], ["exScreen", "--ex-accent"], ["historyScreen", "--history-accent"], ["profileScreen", "--profile-accent"]]) document.getElementById(r2)?.style.setProperty(o2, e2);
  }
  window.APStudentTheme = Object.freeze({ color: r, apply: o });
  for (const e2 of ["renderPrefs", "renderWorkouts", "renderExerciseApp", "renderExerciseDetail", "profileRender"]) {
    const r2 = window[e2];
    "function" == typeof r2 && (window[e2] = function(...e3) {
      const n = r2.apply(this, e3);
      return o(), n;
    });
  }
  o();
})();
;
!(function() {
  "use strict";
  if (window.__AP_PUBLIC_REGISTER) return;
  const e = APTeacherEvolutionModel, t = () => "student" === window.__AP_STUDENT_CONTEXT?.role ? window.__AP_STUDENT_CONTEXT.storageId : "", o = (e2) => "agenda_teacher_evolution_v1_" + e2;
  let r = 0, n = null, i = 0, s = 0, a = "", u = null;
  function d() {
    const r2 = t();
    if (!r2) return null;
    if (u?.uid === r2) return u;
    try {
      const t2 = JSON.parse(localStorage.getItem(o(r2)) || "null");
      if (t2?.uid === r2 && Array.isArray(t2.workouts) && t2.workouts.every(e.valid)) return u = t2;
    } catch (e2) {
    }
    return u = { uid: r2, revision: null, at: "", workouts: [] };
  }
  function l() {
    const t2 = window.__AP_STUDENT_CONTEXT;
    if ("preview" === t2?.role && true === window.APaccounts?.isTeacher()) try {
      return (JSON.parse(localStorage.getItem("agendaPersonalTL_v1") || "{}").workoutExecutions || []).filter((e2) => e2.studentId === t2.area?.studentId).map(e.fromTeacher).filter(Boolean);
    } catch (e2) {
      return [];
    }
    return d()?.workouts.slice() || [];
  }
  function c(e2 = []) {
    const t2 = /* @__PURE__ */ new Map();
    for (const o2 of e2) t2.set("phone:" + JSON.stringify([o2.id, o2.startedAt, o2.finishedAt]), o2);
    for (const e3 of l()) t2.set("teacher:" + e3.teacherRecordId, e3);
    return [...t2.values()].sort((e3, t3) => Number(t3.finishedAt) - Number(e3.finishedAt));
  }
  function f() {
    const e2 = document.getElementById("historyScreen"), o2 = document.getElementById("evMainScroll");
    if (!e2 || !o2) return;
    let r2 = document.getElementById("apTeacherEvolutionStatus");
    r2 || (r2 = document.createElement("div"), r2.id = "apTeacherEvolutionStatus", r2.className = "ap-evolution-sync", r2.innerHTML = '<p role="status" aria-live="polite"></p><button type="button">Atualizar</button>', r2.querySelector("button").onclick = () => p(true), document.getElementById("historyContent").before(r2));
    const i2 = document.getElementById("apStudentUnifiedHistory");
    i2 && i2.parentElement !== o2 && o2.append(i2), r2.hidden = !t();
    const s2 = r2.querySelector("p"), u2 = r2.querySelector("button"), l2 = d();
    u2.disabled = !!n, s2.textContent = a || (l2?.workouts.length ? "Registros do professor: " + l2.workouts.length + (l2.at ? " · " + new Date(l2.at).toLocaleDateString("pt-BR") : "") : "Receba aqui os treinos registrados pelo professor.");
  }
  async function p(i2 = false) {
    const c2 = t();
    if (!c2) return;
    if (n?.uid === c2) return n.work;
    if (!i2 && Date.now() - s < 3e4) return;
    s = Date.now();
    const p2 = r;
    if (d(), false === navigator.onLine) return a = "Sem conexão. Exibindo os registros já recebidos neste aparelho.", void f();
    a = "Buscando os registros do professor…";
    const g2 = { uid: c2, work: null };
    n = g2;
    const v2 = (async () => {
      try {
        const n2 = await APaccounts.getPhotoToken();
        if (p2 !== r || c2 !== t()) return;
        const i3 = /* @__PURE__ */ new Map();
        let s2 = null, d2 = null, l2 = "";
        for (let o2 = 0; o2 < 200; o2++) {
          const u2 = await fetch("https://agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site/api/student-evolution", { method: "POST", headers: { Authorization: "Bearer " + n2, "Content-Type": "application/json" }, body: JSON.stringify({ cursor: s2 }), cache: "no-store", signal: globalThis.AbortSignal?.timeout?.(25e3) }), f3 = await u2.json();
          if (p2 !== r || c2 !== t()) return;
          if (!u2.ok) {
            const e2 = Error(f3.error || "Não foi possível receber a evolução.");
            throw e2.status = u2.status, e2;
          }
          if (f3.uid !== c2 || "boolean" != typeof f3.available || !Array.isArray(f3.workouts) || !f3.workouts.every(e.valid) || null !== f3.cursor && "string" != typeof f3.cursor) throw Error("Os registros recebidos não correspondem à sua conta.");
          if (!f3.available) return void (a = "O professor precisa abrir o aplicativo atualizado e sincronizar a agenda para enviar os registros.");
          if (!/^[a-f0-9-]{36}$/.test(f3.revision || "") || d2 && d2 !== f3.revision) throw Error("A evolução foi atualizada durante a consulta. Toque em Atualizar.");
          d2 = f3.revision, l2 = f3.updatedAt;
          for (const e2 of f3.workouts) i3.set(e2.teacherRecordId, e2);
          if (s2 = f3.cursor, !s2) break;
          if (199 === o2) throw Error("O histórico é extenso. Atualize novamente para continuar.");
        }
        if (p2 !== r || c2 !== t()) return;
        const f2 = u.workouts.length;
        u = { uid: c2, revision: d2, at: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: l2, workouts: [...i3.values()].sort((e2, t2) => e2.finishedAt - t2.finishedAt) }, a = u.workouts.length ? "Registros do professor: " + u.workouts.length + " · atualização concluída." : "Nenhum treino registrado pelo professor neste histórico.";
        try {
          localStorage.setItem(o(c2), JSON.stringify(u));
        } catch (e2) {
          a = "Registros recebidos. Não foi possível manter uma cópia neste aparelho.";
        }
        !f2 && u.workouts.length && "undefined" != typeof evPreview && (evPreview = false);
      } catch (e2) {
        if (p2 !== r || c2 !== t()) return;
        if (403 === e2.status) {
          u = { uid: c2, revision: null, at: "", workouts: [] };
          try {
            localStorage.removeItem(o(c2));
          } catch (e3) {
          }
        }
        a = 403 === e2.status ? e2.message : "Não foi possível atualizar. " + (l().length ? "Exibindo os registros já recebidos." : "Confira sua conexão e tente novamente.");
      } finally {
        p2 === r && c2 === t() && (n = null, "history" === document.body.dataset.view ? renderHistory() : f());
      }
    })();
    return g2.work = v2, f(), v2;
  }
  function g() {
    clearTimeout(i), t() && (i = setTimeout(() => p(), 200));
  }
  function renderWeight() {
      if ("undefined" == typeof evTab || "peso" !== evTab || "undefined" != typeof evPreview && evPreview) return false;
      const e3 = l().filter((e4) => Number.isFinite(e4.bodyWeight) && e4.bodyWeight >= 0.1 && e4.finishedAt >= evPeriodStart()).sort((e4, t4) => e4.finishedAt - t4.finishedAt);
      if (!e3.length) return false;
      const t3 = document.getElementById("historyContent"), o3 = (e4) => Number(e4).toLocaleString("pt-BR", { maximumFractionDigits: 2 }), r2 = e3[0], n2 = e3.at(-1), i2 = Math.min(...e3.map((e4) => e4.bodyWeight)) - 1, s2 = Math.max(...e3.map((e4) => e4.bodyWeight)) + 1, a2 = e3.map((t4, o4) => [38 + (1 === e3.length ? 144 : o4 / (e3.length - 1) * 288), 174 - (t4.bodyWeight - i2) / (s2 - i2) * 140]);
      t3.innerHTML = '<div class="ap-evolution-weight"><h2>Peso registrado</h2><p>Medições anotadas pelo professor nas sessões.</p><div class="ap-evolution-weight-summary"><span>Primeiro registro<strong>' + o3(r2.bodyWeight) + " kg</strong></span><span>Último registro<strong>" + o3(n2.bodyWeight) + ' kg</strong></span></div><svg viewBox="0 0 360 210" role="img" aria-label="Peso corporal registrado pelo professor"><title>Peso em kg</title><path d="M38 20v154h288" fill="none" stroke="currentColor" opacity=".3"/>' + (e3.length > 1 ? '<polyline points="' + a2.map((e4) => e4.join(",")).join(" ") + '" fill="none" stroke="var(--history-accent)" stroke-width="3"/>' : "") + a2.map(([t4, r3], n3) => '<circle cx="' + t4 + '" cy="' + r3 + '" r="4" fill="var(--history-accent)"><title>' + new Date(e3[n3].finishedAt).toLocaleDateString("pt-BR") + ": " + o3(e3[n3].bodyWeight) + " kg</title></circle>").join("") + "</svg><ul>" + e3.slice().reverse().map((e4) => "<li><span>" + new Date(e4.finishedAt).toLocaleDateString("pt-BR") + "</span><strong>" + o3(e4.bodyWeight) + " kg</strong></li>").join("") + "</ul></div>";

    return true;
  }
  window.APTeacherEvolution = Object.freeze({ records: l, sessions: c, refresh: p, status: () => ({ message: a, pending: !!n, uid: t() }), decorate: f, schedule: g, renderWeight }), addEventListener("ap-account-changed", () => {
    r++, n = null, u = null, s = 0, a = "", clearTimeout(i), f(), g();
  }), addEventListener("ap-student-ready", g), addEventListener("online", () => {
    s = 0, g();
  }), addEventListener("pageshow", g), document.addEventListener("visibilitychange", () => {
    document.hidden || g();
  }), setInterval(() => {
    document.hidden || g();
  }, 6e4), g();
})();
;

