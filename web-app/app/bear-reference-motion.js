(function(host) {
  "use strict";
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (v) => (v = clamp(v)) * v * (3 - 2 * v);
  const durations = Object.freeze({ curious: 2.7, nose: 1.6, ear: 1.8, affection: 2.6, paw: 2.9, angry: 2.8, look: 3.2 });
  class Spring {
    constructor(w) {
      this.w = w;
      this.x = this.v = 0;
    }
    step(target, dt) {
      const a = this.x - target, b = this.v + this.w * a, e = Math.exp(-this.w * dt);
      this.x = target + (a + b * dt) * e;
      this.v = (this.v - this.w * b * dt) * e;
      return this.x;
    }
  }
  function targets(kind, time, age, aim, held = false, strength = 0) {
    const duration = durations[kind] || Infinity;
    const decay = held ? 1 : kind === "idle" ? 0 : 1 - smooth((age - duration + 0.75) / 0.75);
    const v = { focus: 0, angry: 0, aff: 0, paw: 0, angle: Math.sin(time * 0.52) * 3e-3, x: 0, y: -0.12 * Math.sin(time * 1.58), ear: 0, gx: 0, gy: 0, yaw: 0, pitch: 0, nose: 0, wave: 0 };
    if (kind === "curious") {
      v.angle = aim.x * 0.025 * decay * smooth((age - 0.06) / 0.2);
      v.ear = 0.14 * decay;
    }
    if (kind === "ear") {
      v.ear = (aim.x > 0 ? -0.95 : 0.95) * Math.sin(Math.min(age, 1) * Math.PI) * decay;
      v.angle = aim.x * 0.012 * decay;
      v.gx = aim.x * 0.6;
      v.gy = -0.45 * decay;
      v.yaw = aim.x * 0.05 * decay;
      v.pitch = 0.045 * decay;
    }
    if (kind === "nose") {
      v.nose = 0.48 * Math.sin(age * 9) * Math.exp(-age * 1.2);
      v.y -= 0.3 * decay;
      v.gy = 0.28;
      v.pitch = -0.015 * decay;
    }
    if (kind === "look") v.angle = aim.x * 0.025 * decay * smooth((age - 0.06) / 0.2);
    if (kind === "affection") {
      v.aff = decay;
      v.angle = (8e-3 * Math.sin(age * 1.45) * (0.45 + 0.55 * strength) + aim.x * 9e-3) * decay;
      v.y = -0.18 * Math.sin(age * 1.58);
      v.pitch = 0.055 * decay;
      v.yaw = aim.x * 0.04 * decay;
      v.ear = 0.22 * decay;
    }
    if (kind === "paw" || kind === "angry") {
      v.paw = decay;
      v.angle = v.y = 0;
      if (kind === "angry") v.angry = decay;
      else {
        v.gx = 0.2;
        v.gy = 0.1;
      }
    }
    if (kind === "curious" || kind === "look") {
      v.focus = 1;
      v.gx = aim.x * 0.95 * decay;
      v.gy = -aim.y * 0.95 * decay;
    }
    for (const at of [3.35, 11.2, 18.5]) {
      const d = time % 22 - at;
      if (d > 0 && d < 0.7 && kind === "idle") v.ear += 0.5 * Math.sin(d / 0.7 * Math.PI * 2) * Math.sin(d / 0.7 * Math.PI);
    }
    return v;
  }
  class Controller {
    constructor(reduced = false) {
      this.reduced = reduced;
      this.time = this.previous = this.began = 0;
      this.kind = "idle";
      this.aim = { x: 0, y: 0 };
      this.held = false;
      this.strength = 0;
      this.springs = Object.fromEntries([["focus", 26], ["angry", 13], ["aff", 14], ["paw", 14], ["angle", 8], ["x", 8], ["y", 8], ["ear", 12], ["gx", 20], ["gy", 20], ["yaw", 8.5], ["pitch", 8.5], ["nose", 13], ["wave", 12]].map(([k, w]) => [k, new Spring(w)]));
    }
    act(kind, x = 0.65, y = 0.25, held = false) {
      if (kind !== "idle" && !durations[kind]) return false;
      const tracking = kind === "look" && this.kind === "look";
      this.kind = kind;
      if (!tracking) this.began = this.time;
      this.aim = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      this.held = held;
      if (tracking) this.began = Math.max(this.began, this.time - 0.7);
      return true;
    }
    release() {
      if (this.kind === "affection" && this.held) {
        this.held = false;
        this.began = this.time - 1.4;
      }
    }
    draw(time) {
      const dt = clamp(time - this.previous, 0, 0.1);
      this.previous = this.time = time;
      this.strength *= Math.exp(-dt * 4);
      const age = time - this.began;
      if (!this.held && age > (durations[this.kind] || Infinity)) this.kind = "idle";
      const t = targets(this.kind, time, age, this.aim, this.held, this.strength), v = {};
      this.springs.gx.w = this.springs.gy.w = ["look", "curious"].includes(this.kind) ? 36 : 20;
      for (const [key, s] of Object.entries(this.springs)) v[key] = this.reduced ? ["focus", "gx", "gy", "aff", "angry"].includes(key) ? t[key] : 0 : s.step(t[key], dt);
      let blink = 0;
      if (!this.reduced) for (const at of [1.7, 5.25, 5.62, 10.8, 17.9, 21.2]) {
        const d = time % 22 - at;
        if (d >= 0 && d < 0.24) blink = Math.max(blink, Math.sin(d / 0.24 * Math.PI));
      }
      blink *= 1 - v.angry;
      if (v.aff > 1e-3) blink = Math.max(blink, smooth(v.aff / 0.36));
      return { ...v, blink, kind: this.kind, held: this.held, age, time };
    }
  }
  host.APBearReferenceMotion = Object.freeze({ Controller, targets, durations, Spring });
})(globalThis);
