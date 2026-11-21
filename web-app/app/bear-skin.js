(function(host) {
  'use strict';
  const meta = host.APBearSkinMeta,
    // Authored angry faces move the muzzle relative to the neutral portrait.
    // These bounds cover its real nose and frown, excluding dark neck fur.
    muzzles = Object.freeze({
      'default:baby': {nose: [184, 145, 14, 9], mouth: [174, 159, 20, 12]},
      'default:teen': {nose: [127, 122, 11, 7], mouth: [119, 137, 18, 10]},
      'default:adult': {nose: [109, 103, 13, 8], mouth: [105, 119, 19, 9]},
      'sit:baby': {nose: [187, 147, 14, 9], mouth: [180, 164, 20, 11]},
      'sit:teen': {nose: [188, 126, 12, 8], mouth: [181, 142, 19, 10]},
      'sit:adult': {nose: [192, 110, 12, 8], mouth: [184, 127, 18, 10]},
      'rest:teen': {nose: [206, 162, 14, 9], mouth: [202, 179, 21, 11]},
      'rest:adult': {nose: [215, 148, 14, 9], mouth: [212, 162, 21, 11]}
    }),
    images = new Map(),
    references = new Map(),
    textures = new Map();
  // Coordinates in the existing 320px reaction artwork for each coat and age.
  const reactionPoints = Object.freeze({"baby:original":[[166,126],[229,149],[196,159],[186.5,176]],"baby:white":[[162.5,127.5],[224,144],[197,158],[190.5,175.5]],"baby:brown":[[166,126],[227.5,146.5],[196.5,158.5],[187,176]],"baby:cream":[[168.5,125.5],[226,144],[200,158.5],[195,175]],"baby:cinnamon":[[168,126],[226,144],[199.5,158.5],[189.5,175.5]],"teen:original":[[166.5,113],[230.5,135],[201,145],[193,159.5]],"teen:white":[[163,115],[227,133],[200,144.5],[195.5,159.5]],"teen:brown":[[164,113.5],[223.5,132.5],[200,145],[191.5,159.5]],"teen:cream":[[161.5,114],[226,130.5],[199,144.5],[191.5,160]],"teen:cinnamon":[[168,113.5],[227.5,132],[205,145],[196.5,160]],"adult:original":[[165,103.5],[234,123],[197,132.5],[190.5,147.5]],"adult:white":[[159.5,104],[220.5,121],[197.5,132.5],[190.5,147.5]],"adult:brown":[[160,102.5],[220,120.5],[195.5,132],[194.5,147.5]],"adult:cream":[[169,105.5],[227,118.5],[199,132],[193,147]],"adult:cinnamon":[[165,105.5],[228.5,120],[202.5,132],[195.5,147]]});
  let approved = {},
    adultFaces = {};
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => {
    v = clamp((v - a) / (b - a));
    return v * v * (3 - 2 * v)
  };
  const mix = (a, b, t) => a + (b - a) * t;
  const canvas = doc => {
    const c = doc.createElement('canvas');
    c.width = c.height = 320;
    return c
  };
  const remember = (map, key, value) => {
    map.delete(key);
    map.set(key, value);
    while (map.size > 16) map.delete(map.keys().next().value);
    return value
  };
  const load = uri => {
    if (images.has(uri)) return images.get(uri);
    return remember(images, uri, new Promise((yes, no) => {
      const image = new host.Image();
      image.onload = () => yes(image);
      image.onerror = () => {
        images.delete(uri);
        no(Error('Bear skin image'))
      };
      image.src = uri
    }))
  };
  const pixels = (doc, image) => {
    const c = canvas(doc);
    c.getContext('2d').drawImage(image, 0, 0, 320, 320);
    return c.getContext('2d').getImageData(0, 0, 320, 320).data
  };
  const output = (doc, data) => {
    const c = canvas(doc);
    c.getContext('2d').putImageData(new host.ImageData(new Uint8ClampedArray(data), 320, 320), 0, 0);
    return c
  };
  const blackModel = model => ({
    ...model,
    colors: {
      ...model.colors,
      panda: 'black'
    }
  });

  function mapping(from, to) {
    const sx = from[1][0] - from[0][0],
      sy = from[1][1] - from[0][1],
      tx = to[1][0] - to[0][0],
      ty = to[1][1] - to[0][1],
      n = sx * sx + sy * sy,
      a = (tx * sx + ty * sy) / n,
      b = (ty * sx - tx * sy) / n;
    return {
      a,
      b,
      x: to[0][0] - a * from[0][0] + b * from[0][1],
      y: to[0][1] - b * from[0][0] - a * from[0][1]
    }
  }

  // Eye alignment alone cannot register a muzzle whose position differs by
  // coat. Fit the face triangle so both eyes and the nose stay on their own
  // authored landmarks. This does not alter the body, pose or coat artwork.
  function faceMapping(from, to) {
    const [p, q] = from.eyes, r = from.nose;
    const [u, v] = to.eyes, w = to.nose;
    const x1 = q[0] - p[0], y1 = q[1] - p[1];
    const x2 = r[0] - p[0], y2 = r[1] - p[1];
    const determinant = x1 * y2 - x2 * y1;
    if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-6) {
      const fit = mapping(from.eyes, to.eyes);
      return {...fit, c: -fit.b, d: fit.a};
    }
    const a = ((v[0] - u[0]) * y2 - (w[0] - u[0]) * y1) / determinant;
    const c = (x1 * (w[0] - u[0]) - x2 * (v[0] - u[0])) / determinant;
    const b = ((v[1] - u[1]) * y2 - (w[1] - u[1]) * y1) / determinant;
    const d = (x1 * (w[1] - u[1]) - x2 * (v[1] - u[1])) / determinant;
    return {a, b, c, d, x: u[0] - a * p[0] - c * p[1], y: u[1] - b * p[0] - d * p[1]};
  }

  function sample(data, x, y, channels = 4) {
    x = clamp(x, 0, 319);
    y = clamp(y, 0, 319);
    const ix = Math.floor(x),
      iy = Math.floor(y),
      fx = x - ix,
      fy = y - iy,
      result = [];
    for (let c = 0; c < channels; c++) {
      const at = (x, y) => data[channels * (320 * y + x) + c];
      result.push(mix(mix(at(ix, iy), at(Math.min(319, ix + 1), iy), fx), mix(at(ix, Math.min(319, iy + 1)), at(Math.min(319, ix + 1), Math.min(319, iy + 1)), fx), fy))
    }
    return result
  }

  function blur(data, sigma) {
    const radius = Math.ceil(3 * sigma),
      kernel = [];
    let total = 0;
    for (let i = -radius; i <= radius; i++) {
      const w = Math.exp(-i * i / (2 * sigma * sigma));
      kernel.push(w);
      total += w
    }
    for (let i = 0; i < kernel.length; i++) kernel[i] /= total;
    const tmp = new Float32Array(data.length),
      out = new Float32Array(data.length);
    for (let y = 0; y < 320; y++)
      for (let x = 0; x < 320; x++)
        for (let c = 0; c < 3; c++) {
          let v = 0;
          for (let k = -radius; k <= radius; k++) v += data[3 * (320 * y + clamp(x + k, 0, 319)) + c] * kernel[k + radius];
          tmp[3 * (320 * y + x) + c] = v
        }
    for (let y = 0; y < 320; y++)
      for (let x = 0; x < 320; x++)
        for (let c = 0; c < 3; c++) {
          let v = 0;
          for (let k = -radius; k <= radius; k++) v += tmp[3 * (320 * clamp(y + k, 0, 319) + x) + c] * kernel[k + radius];
          out[3 * (320 * y + x) + c] = v
        }
    return out
  }
  // A material field removes the old eye/brow/mouth pigmentation, while the
  // canonical black expression supplies its real folds and eyelid geometry.
  function material(data, profile, color, closedEyes = false) {
    const result = new Float32Array(320 * 320 * 3);
    for (let i = 0; i < 320 * 320; i++)
      for (let c = 0; c < 3; c++) result[3 * i + c] = data[4 * i + c];
    // Light, unpatterned coats expose the old outer iris if only the inner eye
    // is cleared. Reconstruct fur beyond that rim before drawing the closed lid.
    const solid = ['black', 'white', 'cream', 'cinnamon'].includes(color);
    const zones = profile.eyes.map(([x, y, rx, ry]) => [x, y, (closedEyes ? solid ? 1.85 : 1.6 : 1.25) * rx, (closedEyes ? solid ? 1.7 : 1.55 : 1.25) * ry]);
    zones.push([...profile.mouth, 1.6 * profile.eyes[0][2], .95 * profile.eyes[0][3]], [...profile.nose, 18, 16]);
    for (const [x, y, rx, ry] of profile.eyes) zones.push([x + .25 * rx, y - 1.9 * ry, 1.25 * rx, .3 * ry]);
    for (let zi = 0; zi < zones.length; zi++) {
      const [cx, cy, rx, ry] = zones[zi], left = Math.max(1, Math.floor(cx - rx - 2)), right = Math.min(319, Math.ceil(cx + rx + 3)), top = Math.max(1, Math.floor(cy - ry - 2)), bottom = Math.min(319, Math.ceil(cy + ry + 3)), inside = [], edge = [];
      for (let y = top; y < bottom; y++)
        for (let x = left; x < right; x++) {
          const d = Math.hypot((x - cx) / rx, (y - cy) / ry),
            i = 320 * y + x;
          if (d < 1) inside.push(i);
          else if (d < 1.2 && data[4 * i + 3] > 250) edge.push(i)
        }
      let candidates = edge;
      if (zi < 2 && ['original', 'brown'].includes(color)) {
        const dark = edge.filter(i => (result[3 * i] + result[3 * i + 1] + result[3 * i + 2]) / 3 < 155);
        if (dark.length > 10) candidates = dark
      }
      if (!candidates.length) continue;
      const rgb = [0, 1, 2].map(c => {
        const v = candidates.map(i => result[3 * i + c]).sort((a, b) => a - b);
        return v[Math.floor(v.length / 2)]
      });
      for (const i of inside)
        for (let c = 0; c < 3; c++) result[3 * i + c] = rgb[c];
      if (zi < 2 && ['original', 'brown'].includes(color)) continue;
      const temp = new Float32Array(inside.length * 3);
      for (let step = 0; step < 100; step++) {
        for (let j = 0; j < inside.length; j++)
          for (let c = 0; c < 3; c++) {
            const i = inside[j];
            temp[3 * j + c] = (result[3 * (i - 1) + c] + result[3 * (i + 1) + c] + result[3 * (i - 320) + c] + result[3 * (i + 320) + c]) / 4
          }
        for (let j = 0; j < inside.length; j++)
          for (let c = 0; c < 3; c++) result[3 * inside[j] + c] = temp[3 * j + c]
      }
    }
    return blur(result, color ? 1.1 : 4.5)
  }

  function polygon(points, x, y) {
    let sign = 0,
      min = Infinity;
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length],
        v = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
      if (!sign && Math.abs(v) > .01) sign = Math.sign(v);
      if (sign * v < 0) return 0;
      min = Math.min(min, Math.abs(v) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1))
    }
    return smooth(0, .8, min)
  }

  function featureMask(reference, kind, x, y, expr) {
    const p = reference.profile,
      ageKey = p.pose + ':' + p.age;
    if (kind === 'angry') {
      const {nose, mouth} = muzzles[ageKey];
      let w = Math.max(...meta[ageKey].anger.map(poly => polygon(poly, x, y)));
      w = Math.max(w, 1 - smooth(.8, 1.15, Math.hypot((x - nose[0]) / nose[2], (y - nose[1]) / nose[3])));
      const frown = (1 - smooth(.85, 1.05, Math.hypot((x - mouth[0]) / mouth[2], (y - mouth[1]) / mouth[3]))) * (1 - smooth(24, 38, (expr[0] + expr[1] + expr[2]) / 3));
      w = Math.max(w, frown);
      return w
    }
    let w = 0;
    if (p.pose === 'sit' && p.age === 'adult') {
      for (const [cx, cy] of [
          [162, 96],
          [221, 115]
        ])
        if (Math.hypot((x - cx) / 20, (y - cy) / 8) < 1) w = Math.max(w, 1 - smooth(25, 40, (expr[0] + expr[1] + expr[2]) / 3));
      if (Math.hypot((x - 184) / 13, (y - 128) / 8) < 1 && (expr[0] + expr[1] + expr[2]) / 3 < 70) w = 1;
      const pink = expr[0] > 1.3 * expr[1] && expr[0] > 1.2 * expr[2] && expr[0] > 100;
      if (pink && y > p.nose[1] && y < p.mouth[1] + 25) w = 1;
      w = Math.max(w, 1 - smooth(.8, 1.15, Math.hypot((x - 195) / 11, (y - 114) / 8)));
      return w
    }
    for (const [cx, cy, rx, ry] of p.eyes) {
      const t = (x - cx + .66 * rx) / (1.32 * rx);
      if (t < 0 || t > 1) continue;
      const line = cy + .05 * ry - .66 * ry * t * (1 - t),
        width = Math.max(1.6, .13 * rx);
      w = Math.max(w, 1 - smooth(.4 * width, .9 * width, Math.abs(y - line)))
    }
    return w
  }
  async function reference(doc, model, kind, paint, mainImages) {
    const black = blackModel(model),
      profile = host.APMascotBearPoses.profile(black),
      key = [profile.pose, profile.age, kind].join(':');
    if (references.has(key)) return references.get(key);
    const image = mainImages?.original || await load(host.APMascotArt.portrait(black)),
      base = pixels(doc, image);
    let expression;
    if (profile.pose === 'sit' && profile.age === 'adult') {
      const raw = pixels(doc, mainImages?.[kind === 'angry' ? 'angry' : 'affection'] || await load(approved[kind === 'angry' ? 'angry' : 'affection']));
      expression = new Uint8ClampedArray(base);
      for (let y = 0; y < 320; y++)
        for (let x = 0; x < 320; x++) {
          const i = 4 * (320 * y + x),
            w = (1 - smooth(.88, 1.06, Math.hypot((x - 192) / 60, (y - 109.333333) / 53.333333))) * smooth(.8, .99, raw[i + 3] / 255);
          for (let c = 0; c < 3; c++) expression[i + c] = mix(base[i + c], raw[i + c], w)
        }
    } else if (kind === 'affection') {
      expression = pixels(doc, paint(doc, image, profile, 'affection'))
    } else if (profile.age !== 'adult') {
      const authored = await host.APBearYoungFaces.render(doc, output(doc, base), profile);
      if (!authored) throw Error('Missing canonical bear face ' + key);
      expression = authored.canvas.getContext('2d').getImageData(0, 0, 320, 320).data
    } else {
      const spec = adultFaces[profile.pose];
      if (!spec) throw Error('Missing adult bear face');
      const raw = pixels(doc, await load(spec.uri));
      expression = new Uint8ClampedArray(base);
      const [cx, cy, rx, ry] = profile.head;
      for (let y = 0; y < 320; y++)
        for (let x = 0; x < 320; x++) {
          const i = 4 * (320 * y + x),
            e = sample(raw, x + spec.offset[0], y + spec.offset[1]);
          let w = (1 - smooth(.72, 1.02, Math.hypot((x - cx) / rx, (y - cy) / ry))) * smooth(.8, .99, e[3] / 255);
          if (profile.pose === 'rest') w *= smooth(.88, 1.3, Math.hypot((x - 275) / 35, (y - 205) / 57));
          for (let c = 0; c < 3; c++) expression[i + c] = mix(base[i + c], e[c], w)
        }
    }
    return remember(references, key, {
      profile,
      base,
      expression,
      material: material(base, profile, null)
    })
  }

  function coat(doc, base, profile, reference, kind) {
    const own = base.getContext('2d').getImageData(0, 0, 320, 320).data,
      closedEyes = kind === 'affection' && !(profile.pose === 'sit' && profile.age === 'adult'),
      closedSolid = closedEyes && ['black', 'white', 'cream', 'cinnamon'].includes(profile.color),
      field = material(own, profile, profile.color, closedEyes),
      matrix = faceMapping(profile, reference.profile),
      result = new Uint8ClampedArray(own);
    const [cx, cy, rx, ry] = profile.head;
    for (let y = 0; y < 320; y++)
      for (let x = 0; x < 320; x++) {
        const i = 4 * (320 * y + x);
        if (own[i + 3] < 254) continue;
        let w;
        if (closedEyes) w = Math.max(...profile.eyes.map(([cx, cy, rx, ry]) => 1 - smooth(closedSolid ? .86 : .99, 1.1, Math.hypot((x - cx) / ((closedSolid ? 1.9 : 1.55) * rx), (y - cy) / ((closedSolid ? 1.8 : 1.5) * ry))))) * smooth(1, 1.45, Math.hypot((x - profile.nose[0]) / 12, (y - profile.nose[1]) / 10));
        else w = 1 - smooth(.82, 1.08, Math.hypot((x - cx) / (.9 * rx), (y - cy) / (.95 * ry)));
        if (profile.pose === 'rest') {
          const eyeBottom = profile.eyes[1][1] + .9 * profile.eyes[1][3];
          const paw = smooth(.88, 1.3, Math.hypot((x - 275) / 35, (y - 205) / 57));
          // The foreground paw starts below the eye. Protecting its entire
          // ellipse also protected the old outer iris on a closed eyelid.
          w *= mix(1, paw, smooth(eyeBottom, eyeBottom + 12, y))
        }
        if (w <= 0) continue;
        const sx = matrix.a * x + matrix.c * y + matrix.x,
          sy = matrix.b * x + matrix.d * y + matrix.y,
          e = sample(reference.expression, sx, sy),
          m = sample(reference.material, sx, sy, 3),
          detail = (e[0] + e[1] + e[2] - m[0] - m[1] - m[2]) / 3,
          feature = featureMask(reference, kind, sx, sy, e);
        for (let c = 0; c < 3; c++) {
          const fur = clamp(field[3 * (320 * y + x) + c] + (kind === 'affection' && !(profile.pose === 'sit' && profile.age === 'adult') ? 0 : 1.3 * detail), 0, 255),
            value = mix(fur, e[c], feature);
          result[i + c] = mix(own[i + c], value, w)
        }
      }
    return {
      canvas: output(doc, result),
      key: [profile.pose, profile.age, profile.color, kind].join(':'),
      region: [cx, cy, .9 * rx, .95 * ry],
      protect: [],
      pixels: result,
      original: own
    }
  }
  async function authoredReaction(doc, base, model, profile) {
    if (profile.color === 'black') return null;
    const landmarks = reactionPoints[profile.age + ':' + profile.color];
    const uri = host.APMascotArt.reaction(model)?.uri;
    if (!landmarks || !uri) throw Error('Missing authored bear expression');
    const source = pixels(doc, await load(uri));
    const own = base.getContext('2d').getImageData(0, 0, 320, 320).data;
    const matrix = faceMapping(profile, {eyes: landmarks.slice(0, 2), nose: landmarks[2]});
    const result = new Uint8ClampedArray(own), [cx, cy, rx, ry] = profile.head;
    for (let y = 0; y < 320; y++) for (let x = 0; x < 320; x++) {
      const i = 4 * (320 * y + x);
      if (own[i + 3] < 254) continue;
      // The reaction artwork raises a paw beside the cheek. Transfer the
      // authored facial features, not that paw or a second head silhouette.
      let features = 0;
      for (const [ex, ey, erx, ery] of profile.eyes) {
        features = Math.max(features, 1 - smooth(.78, 1.05, Math.hypot((x - ex) / (1.85 * erx), (y - ey + .4 * ery) / (1.85 * ery))));
        features = Math.max(features, 1 - smooth(.75, 1.05, Math.hypot((x - ex) / (1.65 * erx), (y - ey + 1.9 * ery) / (.85 * ery))));
      }
      const muzzleX = (profile.nose[0] + profile.mouth[0]) / 2, muzzleY = (profile.nose[1] + profile.mouth[1]) / 2;
      features = Math.max(features, 1 - smooth(.8, 1.06, Math.hypot((x - muzzleX) / 26, (y - muzzleY) / (Math.abs(profile.mouth[1] - profile.nose[1]) / 2 + 13))));
      let weight = features * (1 - smooth(.8, 1.03, Math.hypot((x - cx) / (.94 * rx), (y - cy) / (.98 * ry))));
      if (profile.pose === 'rest') {
        const eyeBottom = profile.eyes[1][1] + .9 * profile.eyes[1][3];
        const paw = smooth(.88, 1.3, Math.hypot((x - 275) / 35, (y - 205) / 57));
        weight *= mix(1, paw, smooth(eyeBottom, eyeBottom + 12, y));
      }
      if (weight <= 0) continue;
      const pixel = sample(source, matrix.a * x + matrix.c * y + matrix.x, matrix.b * x + matrix.d * y + matrix.y);
      weight *= smooth(.9, .995, pixel[3] / 255);
      for (let c = 0; c < 3; c++) result[i + c] = mix(own[i + c], pixel[c], weight);
    }
    return {canvas: output(doc, result), key: [profile.pose, profile.age, profile.color, 'angry'].join(':'),
      region: profile.head.slice(0, 4), protect: [], pixels: result, original: own};
  }
  async function prepare(doc, base, model, profile, kind, paint) {
    if (profile.color === 'black' && !(profile.age === 'adult' && profile.pose === 'sit') && kind !== 'affection' || !['affection', 'angry', 'paw', 'tail'].includes(kind)) return null;
    kind = kind === 'affection' ? 'affection' : 'angry';
    const key = [profile.pose, profile.age, profile.color, kind].join(':');
    if (textures.has(key)) return remember(textures, key, textures.get(key));
    if (kind === 'angry' && profile.color !== 'black') return remember(textures, key, await authoredReaction(doc, base, model, profile));
    const ref = await reference(doc, model, kind, paint);
    if (profile.color === 'black' && (kind !== 'affection' || profile.age === 'adult' && profile.pose === 'sit')) return remember(textures, key, {
      canvas: output(doc, ref.expression),
      key,
      region: profile.head.slice(0, 4),
      protect: [],
      pixels: ref.expression,
      original: ref.base
    });
    return remember(textures, key, coat(doc, base, profile, ref, kind))
  }
  async function main(image, model, blackImages) {
    const doc = image.ownerDocument,
      base = output(doc, pixels(doc, await load(image.getAttribute('href')))),
      profile = host.APMascotBearPoses.profile(model),
      result = {
        original: base,
        paw: await load(host.APMascotArt.reaction(model).uri)
      };
    for (const kind of ['angry', 'affection']) {
      const key = [profile.pose, profile.age, profile.color, kind].join(':');
      let value = textures.get(key);
      if (!value) {
        if (kind === 'angry' && profile.color !== 'black') value = remember(textures, key, await authoredReaction(doc, base, model, profile));
        else {
          const ref = await reference(doc, model, kind, null, blackImages);
          value = remember(textures, key, coat(doc, base, profile, ref, kind));
        }
      }
      result[kind] = value.canvas
    }
    return result
  }

  function attentionEyes(model, fallback, doc, image) {
    const profile = host.APMascotBearPoses.profile(model);
    if (!profile) return fallback;
    const key = profile.pose + ':' + profile.age,
      source = meta[key]?.eyes;
    if (!source) return fallback;
    const original = host.APMascotBearPoseProfiles.poses[profile.pose + ':' + profile.age + ':black'];
    const native = profile.pose === 'sit' && profile.age === 'adult' ? host.APMascotBearAttention?.profiles?.[profile.color] : null;
    const mapped = native ? native.map(eye => {
      const point = p => p.map(v => v * 4 / 3);
      return {...eye, center: point(eye.center), iris: point(eye.iris), white: point(eye.white), radius: point(eye.radius), travel: point(eye.travel), outline: eye.outline.map(point)}
    }) : source.map((eye, i) => {
      const from = original.slice(i * 4, i * 4 + 4),
        to = profile.eyes[i],
        sx = to[2] / from[2],
        sy = to[3] / from[3],
        point = p => [to[0] + (p[0] - from[0]) * sx, to[1] + (p[1] - from[1]) * sy];
      return {
        ...eye,
        center: point(eye.center),
        iris: point(eye.iris),
        white: point(eye.white),
        radius: [eye.radius[0] * sx, eye.radius[1] * sy],
        travel: [eye.travel[0] * sx, eye.travel[1] * sy],
        outline: eye.outline.map(point)
      }
    });
    for (const eye of mapped) {
      const area = eye.outline.reduce((sum, a, j) => {
        const b = eye.outline[(j + 1) % eye.outline.length];
        return sum + a[0] * b[1] - a[1] * b[0]
      }, 0);
      // The GPU and Canvas masks both require positive inward edge distances.
      if (area < 0) eye.outline.reverse();
    }
    if (!doc || !image) return mapped;
    const data = pixels(doc, image);
    const light = p => .2126 * p[0] + .7152 * p[1] + .0722 * p[2];
    for (const eye of mapped) {
      let best = -1, white = eye.white;
      const xs = eye.outline.map(p => p[0]), ys = eye.outline.map(p => p[1]);
      for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
        for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
          if (polygon(eye.outline, x, y) < .99 || Math.hypot((x - eye.iris[0]) / eye.radius[0], (y - eye.iris[1]) / eye.radius[1]) < .65) continue;
          let score = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) score += light(sample(data, x + dx, y + dy));
          score /= 9;
          if (score > best) { best = score; white = [x, y] }
        }
      // Coat variations place the sclera differently. Sampling dark fur as
      // the eye white can hide or reverse visible iris movement.
      const current = light(sample(data, ...eye.white));
      if (best > 165 && (current < 180 || best > current + 5)) eye.white = white;
      if (profile.age !== 'adult') {
        // The young-bear trace describes the eye opening, not the full iris.
        // Recover its dark component from the original artwork so looking
        // around does not replace a large authored iris with a tiny pupil.
        const left = Math.max(0, Math.floor(Math.min(...xs))), top = Math.max(0, Math.floor(Math.min(...ys)));
        const width = Math.min(319, Math.ceil(Math.max(...xs))) - left + 1, height = Math.min(319, Math.ceil(Math.max(...ys))) - top + 1;
        const dark = new Uint8Array(width * height), threshold = clamp(Math.max(best, current) * .65, 100, 160);
        let seed = -1, nearest = Infinity;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const px = left + x, py = top + y;
          if (polygon(eye.outline, px, py) < .99 || light(sample(data, px, py)) >= threshold) continue;
          const i = y * width + x, distance = Math.hypot((px - eye.iris[0]) / eye.radius[0], (py - eye.iris[1]) / eye.radius[1]);
          dark[i] = 1;
          if (distance < nearest) { nearest = distance; seed = i }
        }
        if (seed >= 0) {
          const queue = [seed]; dark[seed] = 0;
          let minX = width, minY = height, maxX = 0, maxY = 0;
          for (let at = 0; at < queue.length; at++) {
            const i = queue[at], x = i % width, y = Math.floor(i / width);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
              if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
              const next = ny * width + nx;
              if (dark[next]) { dark[next] = 0; queue.push(next) }
            }
          }
          if (queue.length > 20) {
            const rx = (maxX - minX + 1) / 2, ry = (maxY - minY + 1) / 2;
            const scale = Math.sqrt(queue.length / (Math.PI * rx * ry)) / 1.12;
            eye.radius = [Math.max(eye.radius[0], Math.min(eye.radius[0] * 1.6, rx * scale)), Math.max(eye.radius[1], Math.min(eye.radius[1] * 1.6, ry * scale))];
          }
        }
      }
    }
    return mapped
  }

  function asset(model) {
    const p = host.APMascotBearPoses.profile(model),
      key = [p.pose, p.age, p.color, 'affection'].join(':'),
      value = textures.get(key);
    let uri = host.APMascotArt.portrait(model);
    if (value && value.canvas.toDataURL) uri = value.uri || (value.uri = value.canvas.toDataURL('image/webp', .9));
    return {
      uri,
      headX: p.head[0] / 320,
      headTop: Math.max(0, (p.head[1] - p.head[3]) / 320)
    }
  }
  const vec = point => 'vec2(' + point.map(v => Number(v).toFixed(5)).join(',') + ')';

  function mainFragment(fragment, model) {
    if (host.APMascotModel.color(model).id === 'black') return fragment;
    const eyes = host.APMascotBearAttention.profiles[host.APMascotModel.color(model).id];
    if (!eyes) return fragment;
    const aperture = eyes.map((eye, i) => 'float aperture' + i + '(vec2 p){float d=100.;' + eye.outline.map((p, j) => 'd=min(d,edgeDistance(p,' + vec(p) + ',' + vec(eye.outline[(j + 1) % eye.outline.length]) + '));').join('') + 'return smoothstep(.15,.6,d);}').join('\n');
    const start = fragment.indexOf('float aperture0('),
      end = fragment.indexOf('vec4 eye(', start);
    if (start < 0 || end < 0) throw Error('Approved bear shader changed');
    const directed = `vec4 directedEye(vec4 base,vec2 p,vec2 unused,vec2 r,vec2 ic,vec2 ir,vec2 whiteAt){if(eyeFocus<.0001)return base;bool first=unused.x<140.;vec2 center=first?${vec(eyes[0].center)}:${vec(eyes[1].center)},iris=first?${vec(eyes[0].iris)}:${vec(eyes[1].iris)},radius=first?${vec(eyes[0].radius)}:${vec(eyes[1].radius)},display=first?${vec(eyes[0].display)}:${vec(eyes[1].display)},travel=first?${vec(eyes[0].travel)}:${vec(eyes[1].travel)},white=first?${vec(eyes[0].white)}:${vec(eyes[1].white)};float mask=first?aperture0(p):aperture1(p);vec2 goal=mix(iris,center+gaze*travel,eyeFocus),d=(p-goal)/(display*(vec2(1.)-abs(gaze)*vec2(.045,.035)*eyeFocus));float inside=1.-smoothstep(.94,1.025,length(d));vec3 pupil=texture2D(original,(iris+d*radius)/240.).rgb,sclera=texture2D(original,white/240.).rgb;vec2 sphere=(p-center)/vec2(12.,11.);sclera*=.84+.16*sqrt(max(0.,1.-dot(sphere,sphere)*.65));base.rgb=mix(base.rgb,mix(sclera,pupil,inside),mask*smoothstep(0.,.025,eyeFocus));return base;}\n`;
    fragment = fragment.slice(0, start) + aperture + '\n' + directed + fragment.slice(end);
    fragment = fragment.replace('vec2 center=c.x<140.?vec2(122.5,69.):vec2(160.8,80.6),radius=c.x<140.?vec2(15.,12.):vec2(12.,13.);', 'vec2 center=c.x<140.?' + vec(eyes[0].center) + ':' + vec(eyes[1].center) + ',radius=c.x<140.?vec2(15.,12.):vec2(12.,13.);');
    return fragment
  }
  const bear = host.APMascotBear,
    attention = host.APMascotBearPoseAttention;
  host.APMascotBear = Object.freeze({
    ...bear,
    configure(data) {
      approved = data;
      bear.configure(data)
    }
  });
  host.APMascotBearPoseAttention = Object.freeze({
    ...attention,
    configureFaces(data) {
      adultFaces = data;
      attention.configureFaces(data)
    }
  });
  host.APBearSkin = Object.freeze({
    prepare,
    main,
    mainFragment,
    attentionEyes,
    mapping,
    faceMapping,
    authoredReaction,
    reactionPoints,
    material,
    coat,
    reference,
    asset
  });
})(globalThis);
