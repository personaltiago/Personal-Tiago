! function(e) {
    "use strict";
    const t = "R2EmnDVcvMWt7TjPxOP6DjW1VOn1",
        n = ["Muito leve", "Leve", "Moderada", "Pouco intensa", "Intensa", "Muito intensa", "Muito, muito intensa", "Exaustão máxima"],
        i = e => "string" == typeof e && /^[A-Za-z0-9_-]{1,160}$/.test(e),
        o = e => "string" == typeof e && /^[A-Za-z0-9_-]{1,128}$/.test(e),
        a = e => "number" == typeof e ? e : Date.parse(e || ""),
        r = e => {
            const t = Math.max(0, Math.floor(Number(e) || 0));
            return Math.floor(t / 60) + " min " + String(t % 60).padStart(2, "0") + " s"
        },
        s = e => Number.isFinite(a(e)) ? new Date(a(e)).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        }) : "—";

    function d(e) {
        const t = e.teacherEvaluation;
        return t ? [null !== t.effort ? "Esforço observado: " + String(t.effort).replace(".", ",") + "/10" : "", t.note].filter(Boolean).join("\n") : ""
    }
    e.APFeedbackModel = Object.freeze({
        TEACHER: t,
        intensities: n,
        session: function(e, t) {
            if (!e || !t || "presencial" !== t.studentType || !0 === t.archived || !i("fb_" + e.id)) return null;
            const n = a(e.startedAt),
                r = a(e.finishedAt);
            return !Number.isSafeInteger(n) || !Number.isSafeInteger(r) || n <= 0 || r < n || r - n > 26784e5 ? null : {
                id: "fb_" + e.id,
                uid: o(t.firebaseUid) ? t.firebaseUid : "",
                studentId: t.id,
                studentName: String(t.name || "Aluno").slice(0, 160),
                planName: String(e.planName || "Treino").slice(0, 160),
                dayName: String(e.dayName || "Treino presencial").slice(0, 160),
                startedAt: n,
                finishedAt: r,
                teacherEvaluation: {
                    note: String(e.note || "").trim().slice(0, 4e3),
                    effort: Number.isFinite(e.effort) && e.effort >= 1 && e.effort <= 10 ? e.effort : null
                }
            }
        },
        normalize: function(e, r) {
            const s = "online" === e?.source;
            if (!e || !i(e.id) || !o(e.uid) || e.uid !== r || e.professorId !== t || "string" != typeof e.studentId || !s && !e.studentId || e.studentId.length > 200 || "string" != typeof e.studentName || e.studentName.length > 160 || "string" != typeof e.planName || e.planName.length > 160 || "string" != typeof e.dayName || e.dayName.length > 160 || !Number.isSafeInteger(e.startedAt) || !Number.isSafeInteger(e.finishedAt) || e.startedAt <= 0 || e.finishedAt < e.startedAt || e.finishedAt - e.startedAt > 26784e5) return null;
            let d = null;
            const l = e.response;
            if (l) {
                if ((s ? "string" != typeof l.intensity || l.intensity.length > 60 : !n.includes(l.intensity)) || "string" != typeof l.comment || l.comment.length > 2e3 || "boolean" != typeof l.allowPublish && "contract" !== l.publicationBasis || !i(l.mutationId) || !Number.isFinite(a(l.receivedAt))) return null;
                d = {
                    intensity: l.intensity,
                    comment: l.comment,
                    ..."boolean" == typeof l.allowPublish ? {
                        allowPublish: l.allowPublish
                    } : {},
                    ..."contract" === l.publicationBasis ? {
                        publicationBasis: "contract"
                    } : {},
                    mutationId: l.mutationId,
                    receivedAt: l.receivedAt
                }
            }
            const u = e.teacherEvaluation;
            let f = null;
            if (null != u) {
                if ("string" != typeof u.note || u.note.length > 4e3 || null !== u.effort && (!Number.isFinite(u.effort) || u.effort < 1 || u.effort > 10)) return null;
                f = {
                    note: u.note,
                    effort: u.effort
                }
            }
            return s && !d ? null : {
                id: e.id,
                uid: e.uid,
                studentId: e.studentId,
                studentName: e.studentName,
                source: s ? "online" : "presencial",
                planName: e.planName,
                dayName: e.dayName,
                startedAt: e.startedAt,
                finishedAt: e.finishedAt,
                durationSeconds: Math.floor((e.finishedAt - e.startedAt) / 1e3),
                professorId: t,
                createdAt: String(e.createdAt || ""),
                teacherEvaluation: f,
                response: d
            }
        },
        duration: r,
        stamp: s,
        text: function(e) {
            return e.studentName + "\n" + ("online" === e.source ? "Online" : "Presencial") + " · " + e.dayName + " · " + e.planName + (d(e) ? "\n\nAvaliação do professor:\n" + d(e) : "") + "\n\nIntensidade do aluno: " + (e.response?.intensity || "Não informada") + "\nFeedback do aluno: " + (e.response?.comment || "Sem comentário.") + "\n\nInício: " + s(e.startedAt) + "\nFim: " + s(e.finishedAt) + "\nTempo de treino: " + r(e.durationSeconds)
        },
        evaluation: d,
        uid: o
    })
}(globalThis);
