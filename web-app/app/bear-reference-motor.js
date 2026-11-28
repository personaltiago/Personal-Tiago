(function(host) {
  "use strict";
  const native = host.APMascotBear, actors = /* @__PURE__ */ new WeakMap(), active = /* @__PURE__ */ new Set();
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => (v = clamp((v - a) / (b - a))) * v * (3 - 2 * v);
  const vec = (p) => "vec2(" + p.map((v) => Number(v).toFixed(5)).join(",") + ")";
  const makeCanvas = (doc) => {
    const c = doc.createElement("canvas");
    c.width = c.height = 320;
    return c;
  };
  const readPixels = (doc, image) => {
    const c = makeCanvas(doc);
    c.getContext("2d").drawImage(image, 0, 0, 320, 320);
    return c.getContext("2d").getImageData(0, 0, 320, 320).data;
  };
  const load = async (uri) => {
    const im = new host.Image();
    im.src = uri;
    await im.decode();
    return im;
  };
  function geometry(n) {
    const points = [], indices = [];
    for (let y = 0; y <= n; y++) for (let x = 0; x <= n; x++) points.push(320 * x / n, 320 * y / n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * (n + 1) + x;
      indices.push(i, i + n + 1, i + 1, i + 1, i + n + 1, i + n + 2);
    }
    return { points: new Float32Array(points), indices: new Uint16Array(indices) };
  }
  const mesh = geometry(40), fallbackMesh = geometry(16);
  function projection(x, y, p, s) {
    if (!s) return [x, y];
    const [cx, cy, rx, ry, neck] = p.head, weight = host.APMascotBearPoses.weight(x, y, p), sx = rx / 65, sy = ry / 61;
    const ref = [135 + (x - cx) / sx, 75 + (y - cy) / sy];
    const q = host.APMascotBearDepth.relief(ref, ref, [s.yaw, s.pitch], weight).point;
    let px = cx + (q[0] - 135) * sx, py = cy + (q[1] - 75) * sy;
    const angle = s.angle * weight, dx = px - cx, dy = py - neck;
    px = cx + Math.cos(angle) * dx - Math.sin(angle) * dy;
    py = neck + Math.sin(angle) * dx + Math.cos(angle) * dy + s.y * sy * weight;
    for (let i = 0; i < p.ears.length; i++) {
      const e = p.ears[i], fall = Math.exp(-(((x - e.x * 320) / (18 * sx)) ** 2) - ((y - e.y * 320) / (18 * sy)) ** 2);
      py += s.ear * sy * fall * (i ? -0.75 : 1);
      px += s.ear * sx * 0.35 * fall;
    }
    py += s.nose * sy * Math.exp(-(((x - p.nose[0]) / (15 * sx)) ** 2) - ((y - p.nose[1]) / (11 * sy)) ** 2) * weight;
    const free = 1 - smooth(neck - 8, Math.min(302, neck + 42), y), chest = Math.exp(-(((x - cx) / (64 * sx)) ** 2) - ((y - (cy + 64 * sy)) / (42 * sy)) ** 2) * free;
    const breath = 0.7 * Math.sin(s.time * 1.58) + 0.1 * (Math.sin(s.time * 3.16 + 0.6) - Math.sin(0.6));
    if (!s.reduced) {
      px += (x - cx) * 33e-4 * breath * chest;
      py -= 0.34 * sy * breath * chest;
    }
    if (p.paw && s.paw) {
      const [ax, ay, arx, ary] = p.paw, fall = Math.exp(-(((x - ax) / arx) ** 4) - ((y - ay) / ary) ** 4) * (1 - weight), a = -0.045 * s.paw * fall, dx2 = x - ax, dy2 = y - (ay - ary);
      px += Math.cos(a) * dx2 - Math.sin(a) * dy2 - dx2;
      py += Math.sin(a) * dx2 + Math.cos(a) * dy2 - dy2;
    }
    return [px, py];
  }
  function shader(eyes) {
    return `precision highp float;uniform sampler2D original;uniform sampler2D closed;uniform sampler2D angry;uniform vec2 gaze;uniform float focus;uniform float blink;uniform float affection;uniform float anger;varying vec2 uv;
float edge(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return(d.x*(p.y-a.y)-d.y*(p.x-a.x))/length(d);}
${eyes.map((e, i) => "float aperture" + i + "(vec2 p){float d=100.;" + e.outline.map((a, j) => "d=min(d,edge(p," + vec(a) + "," + vec(e.outline[(j + 1) % e.outline.length]) + "));").join("") + "return smoothstep(.18,.75,d);}").join("\n")}
vec4 eye(vec4 base,vec2 p,float mask,vec2 center,vec2 iris,vec2 radius,vec2 whiteAt,vec2 travel){if(focus<.0001||mask<.0001)return base;vec2 goal=mix(iris,center+gaze*travel,focus),d=(p-goal)/(radius*1.12);float inside=1.-smoothstep(.93,1.025,length(d));vec3 pupil=texture2D(original,(iris+d*radius)/320.).rgb,white=texture2D(original,whiteAt/320.).rgb;vec2 sphere=(p-center)/(radius+vec2(3.));white*=.78+.12*sqrt(max(0.,1.-dot(sphere,sphere)*.6));base.rgb=mix(base.rgb,mix(white,pupil,inside),mask*smoothstep(0.,.025,focus));return base;}
void main(){vec2 p=uv*320.;vec4 color=texture2D(original,uv);
${eyes.map((e, i) => "color=eye(color,p,aperture" + i + "(p)," + [e.center, e.iris, e.radius, e.white, e.travel].map(vec).join(",") + ");").join("\n")}
float lid=0.;${eyes.map((e) => "lid=max(lid,1.-smoothstep(.78,1.1,length((p-" + vec(e.center) + ")/" + vec(e.radius.map((v) => v * 2.15)) + ")));").join("")}
vec4 c=texture2D(closed,uv);color.rgb=mix(color.rgb,c.rgb,max(affection,smoothstep(.42,.68,blink)*lid));vec4 a=texture2D(angry,uv);color.rgb=mix(color.rgb,a.rgb,anger);if(color.a<.004)discard;gl_FragColor=color;}`;
  }
  function gpu(canvas, images, eyes, p) {
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true, depth: false, stencil: false });
    if (!gl) return null;
    const buffers = [], textures = [], shaders = [];
    let program;
    const dispose = () => {
      var _a;
      buffers.forEach((x) => gl.deleteBuffer(x));
      textures.forEach((x) => gl.deleteTexture(x));
      shaders.forEach((x) => gl.deleteShader(x));
      if (program) gl.deleteProgram(program);
      (_a = gl.getExtension("WEBGL_lose_context")) == null ? void 0 : _a.loseContext();
    };
    try {
      const compile = (type, source) => {
        const s = gl.createShader(type);
        shaders.push(s);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
        return s;
      };
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, "attribute vec2 p;attribute vec2 q;varying vec2 uv;void main(){uv=p/320.;gl_Position=vec4(q.x/160.-1.,1.-q.y/160.,0.,1.);}"));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, shader(eyes)));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const attribute = (name, data, usage) => {
        const b = gl.createBuffer();
        buffers.push(b);
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        const loc = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        return b;
      };
      attribute("p", mesh.points, gl.STATIC_DRAW);
      const dynamic = attribute("q", mesh.points, gl.DYNAMIC_DRAW), index = gl.createBuffer();
      buffers.push(index);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      images.forEach((image, i) => {
        const t = gl.createTexture();
        textures.push(t);
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.uniform1i(gl.getUniformLocation(program, ["original", "closed", "angry"][i]), i);
      });
      const u = Object.fromEntries(["gaze", "focus", "blink", "affection", "anger"].map((k) => [k, gl.getUniformLocation(program, k)])), q = new Float32Array(mesh.points.length);
      gl.clearColor(0, 0, 0, 0);
      return { kind: "webgl", dispose, draw(s) {
        if (gl.isContextLost()) throw Error("Bear WebGL context lost");
        for (let i = 0; i < q.length; i += 2) {
          const v = projection(mesh.points[i], mesh.points[i + 1], p, s);
          q[i] = v[0];
          q[i + 1] = v[1];
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindBuffer(gl.ARRAY_BUFFER, dynamic);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, q);
        gl.uniform2f(u.gaze, s.gx, s.gy);
        gl.uniform1f(u.focus, s.focus);
        gl.uniform1f(u.blink, s.blink);
        gl.uniform1f(u.affection, s.aff);
        gl.uniform1f(u.anger, s.angry);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
      } };
    } catch (error) {
      dispose();
      return null;
    }
  }
  function cpu(canvas, images, eyes, p, doc) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const neutral = readPixels(doc, images[0]), closed = readPixels(doc, images[1]), angry = readPixels(doc, images[2]), paint = makeCanvas(doc), pc = paint.getContext("2d"), lidMask = new Float32Array(320 * 320);
    for (let y = 0; y < 320; y++) for (let x = 0; x < 320; x++) lidMask[y * 320 + x] = Math.max(...eyes.map((e) => 1 - smooth(0.78, 1.1, Math.hypot((x + 0.5 - e.center[0]) / (e.radius[0] * 2.15), (y + 0.5 - e.center[1]) / (e.radius[1] * 2.15)))));
    const sample = (x, y) => {
      x = clamp(x, 0, 319);
      y = clamp(y, 0, 319);
      const xx = Math.floor(x), yy = Math.floor(y), fx = x - xx, fy = y - yy;
      return [0, 1, 2].map((c) => {
        const at = (x2, y2) => neutral[4 * (y2 * 320 + x2) + c];
        return (1 - fy) * ((1 - fx) * at(xx, yy) + fx * at(Math.min(319, xx + 1), yy)) + fy * ((1 - fx) * at(xx, Math.min(319, yy + 1)) + fx * at(Math.min(319, xx + 1), Math.min(319, yy + 1)));
      });
    };
    const mix = (a, b, t) => a + (b - a) * t;
    return { kind: "canvas", dispose() {
      canvas.width = 0;
    }, draw(s) {
      const data = new host.ImageData(new Uint8ClampedArray(neutral), 320, 320);
      for (const e of eyes) {
        const xs = e.outline.map((p2) => p2[0]), ys = e.outline.map((p2) => p2[1]);
        for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(319, Math.ceil(Math.max(...ys))); y++) for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(319, Math.ceil(Math.max(...xs))); x++) {
          let distance = 100;
          for (let j = 0; j < e.outline.length; j++) {
            const a = e.outline[j], b = e.outline[(j + 1) % e.outline.length];
            distance = Math.min(distance, ((b[0] - a[0]) * (y + 0.5 - a[1]) - (b[1] - a[1]) * (x + 0.5 - a[0])) / Math.hypot(b[0] - a[0], b[1] - a[1]));
          }
          const mask = smooth(0.18, 0.75, distance) * smooth(0, 0.025, s.focus);
          if (!mask) continue;
          const dx = (x + 0.5 - mix(e.iris[0], e.center[0] + s.gx * e.travel[0], s.focus)) / (e.radius[0] * 1.12), dy = (y + 0.5 - mix(e.iris[1], e.center[1] + s.gy * e.travel[1], s.focus)) / (e.radius[1] * 1.12), inside = 1 - smooth(0.93, 1.025, Math.hypot(dx, dy)), iris = sample(e.iris[0] + dx * e.radius[0], e.iris[1] + dy * e.radius[1]), white = sample(...e.white), shade = 0.78 + 0.12 * Math.sqrt(Math.max(0, 1 - 0.6 * (((x + 0.5 - e.center[0]) / (e.radius[0] + 3)) ** 2 + ((y + 0.5 - e.center[1]) / (e.radius[1] + 3)) ** 2)));
          for (let c = 0; c < 3; c++) {
            const i = 4 * (y * 320 + x) + c;
            data.data[i] = mix(data.data[i], mix(white[c] * shade, iris[c], inside), mask);
          }
        }
      }
      const blink = smooth(0.42, 0.68, s.blink);
      if (s.aff || blink || s.angry) for (let j = 0; j < 320 * 320; j++) {
        const i = 4 * j;
        if (!neutral[i + 3]) continue;
        const w = Math.max(s.aff, blink * lidMask[j]);
        for (let c = 0; c < 3; c++) data.data[i + c] = mix(mix(data.data[i + c], closed[i + c], w), angry[i + c], s.angry);
      }
      pc.putImageData(data, 0, 0);
      ctx.setTransform(canvas.width / 320, 0, 0, canvas.height / 320, 0, 0);
      ctx.clearRect(0, 0, 320, 320);
      const { points, indices } = fallbackMesh, q = [];
      for (let i = 0; i < points.length; i += 2) q.push(projection(points[i], points[i + 1], p, s));
      for (let i = 0; i < indices.length; i += 3) {
        const ids = [indices[i], indices[i + 1], indices[i + 2]], [a, b, c] = ids.map((j) => [points[2 * j], points[2 * j + 1]]), [d, e, f] = ids.map((j) => q[j]), det = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]), m0 = ((e[0] - d[0]) * (c[1] - a[1]) - (f[0] - d[0]) * (b[1] - a[1])) / det, m1 = ((e[1] - d[1]) * (c[1] - a[1]) - (f[1] - d[1]) * (b[1] - a[1])) / det, m2 = ((f[0] - d[0]) * (b[0] - a[0]) - (e[0] - d[0]) * (c[0] - a[0])) / det, m3 = ((f[1] - d[1]) * (b[0] - a[0]) - (e[1] - d[1]) * (c[0] - a[0])) / det;
        ctx.save();
        ctx.beginPath();
        const mx = (d[0] + e[0] + f[0]) / 3, my = (d[1] + e[1] + f[1]) / 3;
        [d, e, f].forEach(([x, y], k) => {
          const l = Math.hypot(x - mx, y - my) || 1;
          ctx[k ? "lineTo" : "moveTo"](x + (x - mx) / l * 1, y + (y - my) / l * 1);
        });
        ctx.closePath();
        ctx.clip();
        ctx.transform(m0, m1, m2, m3, d[0] - m0 * a[0] - m2 * a[1], d[1] - m1 * a[0] - m3 * a[1]);
        ctx.drawImage(paint, 0, 0);
        ctx.restore();
      }
    } };
  }
  async function start(image, model) {
    if (native.supports(model)) {
      const a = await native.start(image, model);
      if (a) return a;
    }
    const p = host.APMascotBearPoses.profile(model);
    if (!p) return null;
    const doc = image.ownerDocument, node = image.closest(".ap-habitat"), neutral = await load(image.getAttribute("href")), base = makeCanvas(doc);
    base.getContext("2d").drawImage(neutral, 0, 0, 320, 320);
    const paint = host.APMascotBearPoses.paint;
    const closed = await host.APBearSkin.prepare(doc, base, model, p, "affection", paint), ref = await host.APBearSkin.reference(doc, model, "angry", paint);
    const angry = p.color === "black" ? (() => {
      const c = makeCanvas(doc);
      c.getContext("2d").putImageData(new host.ImageData(new Uint8ClampedArray(ref.expression), 320, 320), 0, 0);
      return c;
    })() : (await host.APBearSkin.prepare(doc, base, model, p, "angry", paint)).canvas;
    if (!image.isConnected) return null;
    const eyes = host.APBearSkin.attentionEyes(model, null, doc, neutral), images = [base, closed.canvas, angry], holder = doc.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    for (const [key, value] of Object.entries({ x: 0, y: 0, width: 320, height: 320, "pointer-events": "none" })) holder.setAttribute(key, value);
    if (image.hasAttribute("transform")) holder.setAttribute("transform", image.getAttribute("transform"));
    holder.dataset.approvedBear = "R14-adapted";
    holder.dataset.bearPose = p.pose;
    const canvas = makeCanvas(doc);
    canvas.width = canvas.height = Math.max(320, Math.min(640, Math.round((image.getBoundingClientRect().width || 320) * Math.min(host.devicePixelRatio || 1, 2))));
    canvas.style.cssText = "display:block;width:320px;height:320px;pointer-events:none";
    holder.append(canvas);
    let renderer = gpu(canvas, images, eyes, p);
    if (!renderer) {
      const replacement = canvas.cloneNode();
      holder.replaceChildren(replacement);
      return mount(replacement, cpu(replacement, images, eyes, p, doc));
    }
    return mount(canvas, renderer);
    function mount(canvas2, renderer2) {
      var _a;
      if (!renderer2) return null;
      holder.dataset.petRenderer = renderer2.kind;
      const zone = host.APMascotHitAreas.zones(model).find((z) => z.part === "paw");
      if (zone == null ? void 0 : zone.polygon) {
        const xs = zone.polygon.map((p2) => p2[0] * 320), ys = zone.polygon.map((p2) => p2[1] * 320);
        p.paw = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, Math.max(18, (Math.max(...xs) - Math.min(...xs)) / 2), Math.max(22, (Math.max(...ys) - Math.min(...ys)) / 2)];
      }
      const reduced = host.matchMedia("(prefers-reduced-motion: reduce)"), controller = new host.APBearReferenceMotion.Controller(reduced.matches), originalOpacity = image.getAttribute("opacity"), mask = readPixels(doc, base);
      let disposed = false, frame = 0, last = 0, state, origin = host.performance.now();
      image.after(holder);
      image.setAttribute("opacity", "0");
      const project = (x, y) => projection(x, y, p, state);
      const aimAtScreen = (x, y) => {
        const point = new host.DOMPoint(x, y).matrixTransform(image.getScreenCTM().inverse()), center = project(p.head[0], p.head[1]);
        return { x: clamp((point.x - center[0]) / (p.head[2] * 1.55), -1, 1), y: clamp((center[1] - point.y) / (p.head[3] * 1.28), -1, 1) };
      };
      function draw(time) {
        state = controller.draw(time);
        state.reduced = controller.reduced;
        try {
          renderer2.draw(state);
        } catch (error) {
          dispose();
        }
        return state;
      }
      const act = (kind, x, y, held) => {
        controller.time = Math.max(controller.time, (host.performance.now() - origin) / 1e3);
        const result = controller.act(kind, x, y, held);
        holder.dataset.petLocalMotion = kind;
        if (controller.reduced) draw(controller.time);
        return result;
      };
      const dispose = () => {
        var _a2;
        if (disposed) return;
        disposed = true;
        host.cancelAnimationFrame(frame);
        renderer2.dispose();
        holder.remove();
        if (originalOpacity === null) image.removeAttribute("opacity");
        else image.setAttribute("opacity", originalOpacity);
        actors.delete(node);
        active.delete(actor);
        (_a2 = reduced.removeEventListener) == null ? void 0 : _a2.call(reduced, "change", change);
      };
      const actor = { canvas: canvas2, holder, image, profile: p, alive: () => !disposed, state: () => ({ ...state, kind: controller.kind, held: controller.held }), action: () => controller.kind, project, aimAtScreen, act, stroke(strength, x) {
        controller.strength = clamp(strength);
        controller.aim.x = clamp(x, -1, 1);
      }, release: () => controller.release(), actAtScreen(kind, x, y) {
        const a = aimAtScreen(x, y);
        return act(kind, a.x, a.y);
      }, hit(x, y) {
        let q = new host.DOMPoint(x, y).matrixTransform(image.getScreenCTM().inverse());
        let ref2 = [q.x, q.y];
        for (let i = 0; i < 6; i++) {
          const at = project(...ref2);
          ref2 = [ref2[0] - (at[0] - q.x), ref2[1] - (at[1] - q.y)];
        }
        const xx = Math.round(ref2[0]), yy = Math.round(ref2[1]);
        if (xx < 0 || xx > 319 || yy < 0 || yy > 319 || mask[4 * (yy * 320 + xx) + 3] < 40) return null;
        const inside = (center, rx, ry) => Math.hypot((ref2[0] - center[0]) / rx, (ref2[1] - center[1]) / ry) < 1;
        const part = inside(p.nose, 17, 15) ? "nose" : p.ears.some((e) => inside([e.x * 320, e.y * 320], e.rx * 320, e.ry * 320)) ? "ear" : p.paw && inside(p.paw, p.paw[2], p.paw[3]) ? "paw" : "body";
        return { part, x: ref2[0] / 320, y: ref2[1] / 320, zone: { x: ref2[0] / 320, y: ref2[1] / 320 } };
      }, dispose, draw };
      const change = () => {
        controller.reduced = reduced.matches;
        draw(controller.time);
      };
      (_a = reduced.addEventListener) == null ? void 0 : _a.call(reduced, "change", change);
      const tick = (stamp) => {
        if (disposed) return;
        if (!image.isConnected || !holder.isConnected) {
          dispose();
          return;
        }
        if (!doc.hidden && stamp - last >= (renderer2.kind === "canvas" ? 65 : 30)) {
          draw((stamp - origin) / 1e3);
          last = stamp;
        }
        frame = host.requestAnimationFrame(tick);
      };
      actors.set(node, actor);
      active.add(actor);
      draw(0);
      frame = host.requestAnimationFrame(tick);
      return actor;
    }
  }
  const safeStart = async (image, model) => {
    var _a;
    try {
      return await start(image, model);
    } catch (error) {
      (_a = image.closest(".ap-habitat")) == null ? void 0 : _a.setAttribute("data-bear-motor-error", String(error.message).slice(0, 240));
      throw error;
    }
  };
  host.APMascotBear = Object.freeze({ ...native, supports: (model) => (model == null ? void 0 : model.species) === "panda" && !!host.APMascotBearPoses.profile(model), start: safeStart, referenceSupports: native.supports, asset: (model) => native.supports(model) ? native.asset(model) : host.APBearSkin.asset(model), get: (node) => actors.get(node) || native.get(node), hit: (node, x, y) => {
    var _a;
    return (_a = actors.get(node) || native.get(node)) == null ? void 0 : _a.hit(x, y);
  }, cancelAll() {
    native.cancelAll();
    for (const a of [...active]) a.dispose();
  } });
  host.APBearReferenceMotor = Object.freeze({ projection, shader, geometry });
})(globalThis);
