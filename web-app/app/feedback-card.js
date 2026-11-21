(function() {
  "use strict";
  const u = APFeedbackModel;
  function k(t, f, i, a, n) {
    t.save(), t.translate(f, i), t.scale(a / 770, a / 770), t.fillStyle = n, t.fill(new Path2D("M0 0H770L641 239 566 270 654 60H42Z M52 109H412L255 462 399 646 526 538 412 736 225 492 321 176H76Z M176 227H254L178 394 138 315Z M507 109H586L420 445 638 306 563 462 412 518 354 447Z")), t.restore();
  }
  function h(t, f, i) {
    const a = [];
    for (const n of String(f).split(`
`)) {
      let e = "";
      for (const s of n.split(/\s+/)) if (s) if (t.measureText(s).width > i) {
        e && (a.push(e), e = "");
        let r = "";
        for (const c of s) t.measureText(r + c).width > i && (a.push(r), r = ""), r += c;
        e = r;
      } else e && t.measureText(e + " " + s).width > i ? (a.push(e), e = s) : e += (e ? " " : "") + s;
      a.push(e);
    }
    return a;
  }
  function x(t, f, i, a, n, e, s) {
    t.beginPath(), t.roundRect(f, i, a, n, e), t.fillStyle = s, t.fill();
  }
  async function w(t, { photo: f = "", accent: i = "#b6ff26", professional: a = "Agenda Personal" } = {}) {
    if (!t.response) throw Error("Aguarde a resposta do aluno para preparar o cart\xE3o.");
    const n = document.createElement("canvas");
    n.width = 1080;
    let e = n.getContext("2d");
    e.font = "500 42px Arial";
    const s = h(e, t.response.comment || "Sem coment\xE1rio.", 824);
    e.font = "700 44px Arial";
    const r = h(e, t.studentName, 700);
    e.font = "700 36px Arial";
    const c = h(e, t.response.intensity || "N\xE3o informada", 820);
    e.font = "500 32px Arial";
    const g = u.evaluation(t), d = g ? h(e, g, 824) : [], A = 404 + 54 * Math.max(0, r.length - 1), intensityTop = A + (d.length ? 40 + 46 * d.length + 48 : 0), T = intensityTop + 34 + 48 * c.length + 52, v = T + 40, E = v + 60 * s.length + 54;
    n.height = Math.max(1080, E + 380), e = n.getContext("2d");
    const p = /^#[0-9a-f]{6}$/i.test(i) ? i : "#b6ff26";
    e.fillStyle = "#0c0f12", e.fillRect(0, 0, n.width, n.height), x(e, 32, 32, 1016, n.height - 64, 34, "#181c20"), e.strokeStyle = "#353c42", e.lineWidth = 2, e.stroke(), x(e, 64, 64, 952, 6, 3, p), e.textBaseline = "top", e.fillStyle = p, e.font = "700 24px Arial", e.fillText("FEEDBACK DE TREINO", 80, 106), window.APTeacherFeatures?.enabled("feedbackSymbol") !== false ? k(e, 80, 148, 54, p) : (e.fillStyle = "#aab4bd", e.font = "500 24px Arial", h(e, a, 900).forEach((l, o) => e.fillText(l, 80, 146 + 31 * o)));
    const m = await (async function(l) {
      return typeof l != "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(l) || l.length > 4e5 ? null : new Promise((o) => {
        const b = new Image(), I = setTimeout(() => o(null), 3e3);
        b.onload = () => {
          clearTimeout(I), o(b);
        }, b.onerror = () => {
          clearTimeout(I), o(null);
        }, b.src = l;
      });
    })(f);
    if (e.save(), e.beginPath(), e.arc(126, 266, 46, 0, 2 * Math.PI), e.clip(), e.fillStyle = "#303a3e", e.fillRect(80, 220, 92, 92), m) {
      const l = Math.min(m.naturalWidth, m.naturalHeight);
      e.drawImage(m, (m.naturalWidth - l) / 2, (m.naturalHeight - l) / 2, l, l, 80, 220, 92, 92);
    } else e.fillStyle = p, e.font = "700 30px Arial", e.textAlign = "center", e.fillText(t.studentName.split(/\s+/).map((l) => l[0]).slice(0, 2).join("").toUpperCase(), 126, 250);
    e.restore(), e.textAlign = "left", e.fillStyle = "#f3f5f7", e.font = "700 44px Arial", r.forEach((l, o) => e.fillText(l, 198, 224 + 54 * o));
    const y = 54 * Math.max(0, r.length - 1);
    e.font = "500 26px Arial", e.fillStyle = "#b4bec7", e.fillText((t.source === "online" ? "ONLINE" : "PRESENCIAL") + "  ·  " + u.stamp(t.finishedAt), 80, 336 + y);
    if (d.length) {
      e.font = "700 22px Arial", e.fillStyle = p, e.fillText("AVALIAÇÃO DO PROFESSOR", 80, A);
      e.font = "500 32px Arial", e.fillStyle = "#d3dce3", d.forEach((l, o) => e.fillText(l, 80, A + 40 + 46 * o));
    }
    e.font = "700 22px Arial", e.fillStyle = p, e.fillText("INTENSIDADE", 80, intensityTop);
    e.fillStyle = "#f3f5f7", e.font = "700 36px Arial", c.forEach((l, o) => e.fillText(l, 80, intensityTop + 34 + 48 * o));
    e.font = "700 22px Arial", e.fillStyle = p, e.fillText("FEEDBACK DO ALUNO", 80, T);
    e.font = "500 42px Arial", e.fillStyle = "#f3f5f7", s.forEach((l, o) => e.fillText(l, 80, v + 60 * o));
    const S = Math.max(E, n.height - 380);
    x(e, 64, S, 952, 240, 22, "#22292e");
    for (const [l, o] of [["In\xEDcio", u.stamp(t.startedAt)], ["Fim", u.stamp(t.finishedAt)], ["Tempo de treino", u.duration(t.durationSeconds)]].entries()) e.textAlign = "left", e.fillStyle = "#aeb9c2", e.font = "500 28px Arial", e.fillText(o[0], 88, S + 32 + 63 * l), e.textAlign = "right", e.fillStyle = "#f3f5f7", e.font = (l === 2 ? "700" : "500") + " 29px Arial", e.fillText(o[1], 988, S + 32 + 63 * l);
    return e.textAlign = "left", e.fillStyle = "#9ba6af", e.font = "500 21px Arial", e.fillText("Agenda Personal \xB7 Acompanhamento de treino.", 80, n.height - 90), n;
  }
  function C() {
    for (const t of this.querySelectorAll("canvas")) t.width = t.height = 0;
    this.querySelector("[data-feedback-preview]").replaceChildren(), this.querySelector("[data-save-feedback]").onclick = null, this.querySelector("[data-share-feedback]").onclick = null, delete this.dataset.feedbackId;
  }
  window.APFeedbackCard = Object.freeze({ create: w, open: async function(t, f) {
    const i = await w(t, f);
    let a = document.getElementById("apFeedbackImage");
    a || (a = document.createElement("dialog"), a.id = "apFeedbackImage", a.className = "ap-feedback", a.setAttribute("aria-labelledby", "apFeedbackImageTitle"), a.innerHTML = '<header class="ap-feedback-heading"><h2 id="apFeedbackImageTitle">Imagem do feedback</h2><button type="button" aria-label="Fechar imagem">\xD7</button></header><div data-feedback-preview style="margin-top:18px"></div><div class="ap-feedback-actions"><button type="button" data-save-feedback>Salvar imagem</button><button type="button" data-share-feedback>Compartilhar</button></div><p data-feedback-image-status role="status" style="font-size:.8rem"></p>', a.querySelector("header button").onclick = function() {
      this.closest("dialog").close();
    }, document.body.appendChild(a)), a.dataset.cleanup || (a.dataset.cleanup = "true", a.addEventListener("close", C)), a.dataset.feedbackId = t.id, i.style.cssText = "display:block;width:100%;height:auto;border-radius:12px", i.setAttribute("aria-label", "Cart\xE3o de feedback de " + t.studentName), a.querySelector("[data-feedback-preview]").replaceChildren(i);
    const n = "feedback-" + t.id + ".png", e = window.Android || window.parent?.Android, s = i.toDataURL("image/png").split(",")[1], r = a.querySelector("[data-feedback-image-status]");
    return r.textContent = "", a.querySelector("[data-save-feedback]").onclick = () => {
      if (e?.saveBase64File) e.saveBase64File(n, "image/png", s), r.textContent = "Imagem preparada. Confira a confirma\xE7\xE3o do Android em Downloads/Agenda Personal.";
      else {
        const c = document.createElement("a");
        c.href = i.toDataURL("image/png"), c.download = n, c.click(), r.textContent = "Download da imagem iniciado.";
      }
    }, a.querySelector("[data-share-feedback]").onclick = async () => {
      if (e?.shareBase64File) return void e.shareBase64File(n, "image/png", s, "");
      const c = await new Promise((d) => i.toBlob(d, "image/png")), g = new File([c], n, { type: "image/png" });
      try {
        navigator.canShare?.({ files: [g] }) ? await navigator.share({ files: [g] }) : r.textContent = "Salve a imagem para compartilhar no aplicativo de sua prefer\xEAncia.";
      } catch (d) {
        d.name !== "AbortError" && (r.textContent = "N\xE3o foi poss\xEDvel abrir o compartilhamento. Use Salvar imagem.");
      }
    }, a.open || a.showModal(), i;
  }, lines: h, symbol: k });
})();
