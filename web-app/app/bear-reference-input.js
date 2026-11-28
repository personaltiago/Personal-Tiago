(function(host) {
  "use strict";
  const native = host.APMascotPetting, bindings = /* @__PURE__ */ new WeakMap(), active = /* @__PURE__ */ new Set(), documents = /* @__PURE__ */ new WeakSet();
  const controls = ".ap-habitat-house,.ap-mascot-home-copy strong,.ap-teacher-mascot-copy strong,a,input,textarea,select,[data-mascot-retry],.ap-feedback-pet-notice,.ap-mascot-phase,.ap-mascot-balance,.ap-mascot-gear,.ap-mascot-home-name,#apMascotReaction";
  const markSelector = ".ap-mascot-mini,.ap-teacher-mascot-mark,.ap-mascot-art";
  const key = (m) => [m == null ? void 0 : m.species, host.APMascotModel.phase((m == null ? void 0 : m.xp) || 0).id, host.APMascotModel.color(m).id, host.APMascotModel.pose(m).id].join(":");
  function point(node, x, y) {
    const image = node.querySelector(".ap-mascot-mini image,.ap-teacher-mascot-mark image,.ap-mascot-art image"), matrix = image == null ? void 0 : image.getScreenCTM();
    if (!matrix) return null;
    const p = new host.DOMPoint(x, y).matrixTransform(matrix.inverse());
    return { x: p.x / 320, y: p.y / 320 };
  }
  function reset(s) {
    var _a, _b, _c;
    clearTimeout(s.timer);
    s.timer = 0;
    s.tap = null;
    s.tapGeneration++;
    s.epoch++;
    const p = s.pointer;
    s.pointer = null;
    if (p) {
      (_a = p.finish) == null ? void 0 : _a.call(p);
      try {
        (_b = p.capture) == null ? void 0 : _b.releasePointerCapture(p.id);
      } catch (_) {
      }
    }
    (_c = native.release) == null ? void 0 : _c.call(native, s.node);
  }
  function clearTap(s) {
    clearTimeout(s.timer);
    s.timer = 0;
    s.tap = null;
  }
  function eligible(s, event) {
    var _a, _b, _c;
    return ((_a = s.read()) == null ? void 0 : _a.species) === "panda" && s.can() !== false && s.node.isConnected && !s.node.ownerDocument.hidden && !((_c = (_b = event.target) == null ? void 0 : _b.closest) == null ? void 0 : _c.call(_b, controls));
  }
  function bind(node, read, can = () => true) {
    if (!node) return;
    for (const prior of active) if (!prior.node.isConnected) {
      reset(prior);
      active.delete(prior);
    }
    let s = bindings.get(node);
    if (s) {
      s.read = read;
      s.can = can;
      native.bind(node, read, can);
      return;
    }
    s = { node, read, can, pointer: null, tap: null, timer: 0, epoch: 0, tapGeneration: 0, compatUntil: 0, queue: Promise.resolve(), lastPointer: 0 };
    bindings.set(node, s);
    active.add(s);
    const respond = (kind, x, y, epoch = s.epoch, modelKey = key(s.read())) => {
      if (epoch !== s.epoch || modelKey !== key(s.read()) || !node.isConnected || s.can() === false || node.ownerDocument.hidden) return;
      const zone = point(node, x, y);
      if (zone) return native.respond(node, s.read(), kind, zone);
    };
    node.addEventListener("pointerdown", (event) => {
      var _a, _b;
      if (!eligible(s, event)) return;
      event.stopImmediatePropagation();
      if (event.isPrimary === false || event.button !== 0 || s.pointer) return;
      const type = event.pointerType || "mouse", now = Date.now();
      if (type === "mouse" && (((_a = event.sourceCapabilities) == null ? void 0 : _a.firesTouchEvents) || now < s.compatUntil)) return;
      if (type === "touch") s.compatUntil = now + 800;
      const model = read(), capture = event.target.closest(markSelector) || event.target.closest(".ap-habitat-open");
      const p = { id: event.pointerId, type, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, at: now, lastAt: now, drag: false, capture, epoch: s.epoch, tapGeneration: s.tapGeneration, modelKey: key(model), finish: (_b = host.APBearFieldGaze) == null ? void 0 : _b.begin(node) };
      p.hit = host.APMascotHitAreas.hit(node, model, p.x, p.y, type === "touch" ? 5 : 0).catch(() => null);
      s.pointer = p;
      try {
        capture == null ? void 0 : capture.setPointerCapture(p.id);
      } catch (_) {
      }
    }, { capture: true, passive: true });
    node.addEventListener("pointermove", (event) => {
      var _a;
      if (!eligible(s, event)) return;
      event.stopImmediatePropagation();
      const p = s.pointer;
      if (!p) {
        if (event.pointerType !== "touch" && !event.buttons && Date.now() >= s.compatUntil) (_a = host.APBearFieldGaze) == null ? void 0 : _a.follow(node, s.read, s.can, event.clientX, event.clientY);
        return;
      }
      if (event.pointerId !== p.id) return;
      if (!p.drag && Math.hypot(event.clientX - p.x, event.clientY - p.y) >= 10) {
        p.drag = true;
        s.tapGeneration++;
        clearTap(s);
      }
      if (!p.drag) return;
      const x = event.clientX, y = event.clientY, now = Date.now();
      p.hit.then(async (hit) => {
        var _a2, _b, _c, _d, _e, _f, _g;
        if (s.pointer !== p || s.epoch !== p.epoch || key(read()) !== p.modelKey || s.can() === false) return;
        if (!hit) {
          (_a2 = p.finish) == null ? void 0 : _a2.call(p);
          p.finish = null;
          (_b = host.APBearFieldGaze) == null ? void 0 : _b.follow(node, s.read, s.can, x, y);
          return;
        }
        const current = host.APMascotBear.get(node), inside = current == null ? void 0 : current.hit(x, y);
        if (current && !inside) {
          (_c = native.release) == null ? void 0 : _c.call(native, node);
          return;
        }
        if ((current == null ? void 0 : current.action()) !== "affection" || !((_d = current == null ? void 0 : current.state()) == null ? void 0 : _d.held)) {
          await native.react(node, read(), true);
          if (s.pointer !== p) {
            if (!s.pointer && s.epoch === p.epoch && key(read()) === p.modelKey) (_e = native.release) == null ? void 0 : _e.call(native, node);
            return;
          }
        }
        (_g = (_f = host.APMascotBear.get(node)) == null ? void 0 : _f.stroke) == null ? void 0 : _g.call(_f, Math.min(1, Math.hypot(x - p.lastX, y - p.lastY) / Math.max(10, now - p.lastAt)), Math.max(-1, Math.min(1, (x - p.x) / 70)));
        p.lastX = x;
        p.lastY = y;
        p.lastAt = now;
      });
    }, { capture: true, passive: true });
    node.addEventListener("pointerup", (event) => {
      var _a, _b, _c;
      const p = s.pointer;
      if (!p || p.id !== event.pointerId) return;
      event.stopImmediatePropagation();
      s.pointer = null;
      s.lastPointer = Date.now();
      if (p.type === "touch" && p.finish) setTimeout(p.finish, 800);
      else (_a = p.finish) == null ? void 0 : _a.call(p);
      p.finish = null;
      try {
        (_b = p.capture) == null ? void 0 : _b.releasePointerCapture(p.id);
      } catch (_) {
      }
      if (p.drag) {
        (_c = native.release) == null ? void 0 : _c.call(native, node);
        return;
      }
      const now = Date.now(), x = event.clientX, y = event.clientY;
      if (now - p.at > 420 || Math.hypot(x - p.x, y - p.y) > 10) return;
      s.queue = s.queue.then(async () => {
        const hit = await p.hit;
        if (p.epoch !== s.epoch || p.tapGeneration !== s.tapGeneration || p.modelKey !== key(read()) || s.can() === false || !node.isConnected) return;
        if (!hit) {
          clearTap(s);
          await respond("look", x, y, p.epoch, p.modelKey);
          return;
        }
        const part = ["ear", "nose"].includes(hit.part) ? hit.part : "body";
        if (s.tap && s.tap.type === p.type && s.tap.part === part && now - s.tap.at <= 280 && Math.hypot(x - s.tap.x, y - s.tap.y) <= 24) {
          clearTap(s);
          await respond("angry", x, y, p.epoch, p.modelKey);
          return;
        }
        clearTap(s);
        s.tap = { at: now, x, y, part, type: p.type };
        s.timer = setTimeout(() => {
          s.tap = null;
          s.timer = 0;
          respond(part === "body" ? "curious" : part, p.x, p.y, p.epoch, p.modelKey);
        }, 285);
      }).catch(() => reset(s));
    }, { capture: true, passive: true });
    const abort = (event) => {
      var _a;
      if (((_a = s.pointer) == null ? void 0 : _a.id) === event.pointerId) {
        event.stopImmediatePropagation();
        reset(s);
      }
    };
    node.addEventListener("pointercancel", abort, { capture: true, passive: true });
    node.addEventListener("lostpointercapture", abort, { capture: true, passive: true });
    node.addEventListener("click", (event) => {
      if (!eligible(s, event)) return;
      event.stopImmediatePropagation();
      if (event.detail === 0 && Date.now() - s.lastPointer > 350) {
        clearTap(s);
        const model = read(), image = node.querySelector("image[data-mascot-photo]");
        if (!image) return;
        const p = host.APMascotBearPoses.profile(model), matrix = image.getScreenCTM(), q = new host.DOMPoint(...p.nose).matrixTransform(matrix);
        respond("curious", q.x, q.y);
      }
    }, { capture: true });
    if (!documents.has(node.ownerDocument)) {
      const doc = node.ownerDocument;
      documents.add(doc);
      doc.addEventListener("visibilitychange", () => {
        if (doc.hidden) {
          for (const state of active) if (state.node.ownerDocument === doc) reset(state);
        }
      });
    }
    native.bind(node, read, can);
  }
  host.addEventListener("ap-account-changed", () => {
    for (const s of active) {
      reset(s);
      if (!s.node.isConnected) active.delete(s);
    }
  });
  host.APMascotPetting = Object.freeze({ ...native, bind });
})(globalThis);
