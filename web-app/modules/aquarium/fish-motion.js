(function (host) {
  'use strict';
  const TAU = 2 * Math.PI;
  const VERTICAL_SCALE = .76;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  function smooth(low, high, value) {
    const t = clamp((value - low) / (high - low), 0, 1);
    return t * t * (3 - 2 * t);
  }
  const angleBetween = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

  class Motion {
    constructor(seed = 725) {
      this.seed = seed >>> 0;
      this.x = .46;
      this.y = .6;
      this.face = 0;
      this.yaw = 0;
      this.speed = .035;
      this.stroke = 0;
      this.depth = .5;
      this.time = 0;
      this.next = 0;
      this.tapAt = -100;
      this.target = { x: .72, y: .55 };
      this.setPhase('adult');
    }
    random() {
      let t = this.seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    setPhase(phase) {
      this.phase = phase;
      this.width = { baby: .16, teen: .235, adult: .30 }[phase] || .30;
      this.bound();
    }
    bound() {
      const margin = this.width * .66 + .035;
      this.x = clamp(this.x, margin, 1 - margin);
      this.y = clamp(this.y, .34, .82);
    }
    tap(x, y) {
      const margin = this.width * .68 + .035;
      this.target = { x: clamp(x, margin, 1 - margin), y: clamp(y, .36, .78) };
      this.tapAt = this.time;
      this.next = this.time + 6.5;
    }
    wander() {
      const margin = this.width * .68 + .035;
      this.target = {
        x: clamp((this.x > .5 ? .20 : .58) + .22 * this.random(), margin, 1 - margin),
        y: mix(.42, .76, this.random()),
      };
      this.next = this.time + 4.7 + 2.4 * this.random();
    }
    step(delta) {
      const dt = clamp(delta, 0, .06);
      this.time += dt;
      if (this.time >= this.next) this.wander();
      const age = this.time - this.tapAt;
      const called = age < 5.6;
      const dx = this.target.x - this.x;
      const dy = (this.target.y - this.y) / VERTICAL_SCALE;
      const distance = Math.hypot(dx, dy);
      const error = distance > .022 ? angleBetween(this.face, Math.atan2(dy, dx)) : 0;
      // Heading steers both the body and its trajectory, including reversals.
      this.yaw = mix(this.yaw, clamp(error * 4, -3.1, 3.1), 1 - Math.exp(-dt * 7));
      this.face = (this.face + this.yaw * dt) % TAU;
      const turnBrake = .45 + .55 * Math.max(0, Math.cos(error));
      const cruise = (called ? .23 : .105) * smooth(.013, called ? .16 : .22, distance);
      this.speed = mix(this.speed, cruise * turnBrake, 1 - Math.exp(-dt * (called ? 4 : 2.8)));
      this.x += Math.cos(this.face) * this.speed * dt;
      this.y += Math.sin(this.face) * this.speed * VERTICAL_SCALE * dt;
      this.bound();
      const effort = clamp(this.speed / .23, 0, 1);
      this.stroke = (this.stroke + dt * (5.7 + effort * 5.2)) % (TAU * 100);
      this.depth = mix(this.depth, called ? .81 : .38 + .11 * Math.sin(this.time * .17), 1 - Math.exp(-dt * 1.5));
      const front = called ? smooth(0, .8, age) * (1 - smooth(4.4, 5.6, age)) * (1 - smooth(.035, .20, distance)) : 0;
      return {
        x: this.x, y: this.y + Math.sin(this.time * 1.4) * .003,
        width: this.width * (.88 + this.depth * .28), face: this.face,
        bend: this.yaw / 3.1, pitch: Math.sin(this.face) * Math.min(.23, this.speed * 1.6),
        stroke: this.stroke, speed: effort, front, time: this.time, phase: this.phase,
      };
    }
  }
  host.APAquariumMotion = Motion;
})(globalThis);
