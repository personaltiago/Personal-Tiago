(function (host) {
  'use strict';
  // Landmarks belong to the existing expression photos for each coat and age.
  // They are never borrowed from the black bear or stretched as one face mesh.
  const points = {"affection:baby:original":[[147.5,92.0],[229.0,99.5],[195.5,98.0]],"affection:baby:white":[[147.0,90.0],[225.5,96.5],[196.5,96.0]],"affection:baby:brown":[[147.5,96.0],[225.5,101.5],[196.0,103.0]],"affection:baby:cream":[[149.0,89.5],[229.0,90.5],[199.5,94.5]],"affection:baby:cinnamon":[[151.5,92.0],[229.5,95.0],[199.5,94.0]],"affection:teen:original":[[150.5,88.5],[227.0,97.0],[196.0,95.0]],"affection:teen:white":[[156.5,83.5],[231.5,92.0],[202.5,91.0]],"affection:teen:brown":[[150.0,87.5],[224.5,94.0],[197.0,94.5]],"affection:teen:cream":[[152.0,82.5],[228.5,88.0],[201.0,88.0]],"affection:teen:cinnamon":[[152.0,84.5],[227.5,90.5],[200.0,91.0]],"affection:adult:original":[[161.5,84.5],[217.0,89.5],[203.5,87.5]],"affection:adult:white":[[162.5,74.0],[235.5,81.5],[206.5,79.5]],"affection:adult:brown":[[152.5,73.0],[221.0,79.5],[195.0,77.5]],"affection:adult:cream":[[154.5,69.0],[226.0,74.0],[200.0,73.5]],"affection:adult:cinnamon":[[155.5,71.5],[223.5,76.0],[196.5,75.0]],"reaction:baby:original":[[166.0,126.0],[229.0,149.0],[196.0,159.0],[186.5,176.0]],"reaction:baby:white":[[162.5,127.5],[224.0,144.0],[197.0,158.0],[190.5,175.5]],"reaction:baby:brown":[[166.0,126.0],[227.5,146.5],[196.5,158.5],[187.0,176.0]],"reaction:baby:cream":[[168.5,125.5],[226.0,144.0],[200.0,158.5],[195.0,175.0]],"reaction:baby:cinnamon":[[168.0,126.0],[226.0,144.0],[199.5,158.5],[189.5,175.5]],"reaction:teen:original":[[166.5,113.0],[230.5,135.0],[201.0,145.0],[193.0,159.5]],"reaction:teen:white":[[163.0,115.0],[227.0,133.0],[200.0,144.5],[195.5,159.5]],"reaction:teen:brown":[[164.0,113.5],[223.5,132.5],[200.0,145.0],[191.5,159.5]],"reaction:teen:cream":[[161.5,114.0],[226.0,130.5],[199.0,144.5],[191.5,160.0]],"reaction:teen:cinnamon":[[168.0,113.5],[227.5,132.0],[205.0,145.0],[196.5,160.0]],"reaction:adult:original":[[165.0,103.5],[234.0,123.0],[197.0,132.5],[190.5,147.5]],"reaction:adult:white":[[159.5,104.0],[220.5,121.0],[197.5,132.5],[190.5,147.5]],"reaction:adult:brown":[[160.0,102.5],[220.0,120.5],[195.5,132.0],[194.5,147.5]],"reaction:adult:cream":[[169.0,105.5],[227.0,118.5],[199.0,132.0],[193.0,147.0]],"reaction:adult:cinnamon":[[165.0,105.5],[228.5,120.0],[202.5,132.0],[195.5,147.0]]};
  const images = new Map(), textures = new Map();
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const smooth = (low, high, value) => {
    const t = clamp((value - low) / (high - low), 0, 1);
    return t * t * (3 - 2 * t);
  };
  function remember(cache, key, value) {
    cache.delete(key); cache.set(key, value);
    while (cache.size > 12) cache.delete(cache.keys().next().value);
    return value;
  }
  function canvas(doc) {
    const value = doc.createElement('canvas'); value.width = value.height = 320;
    return value;
  }
  function load(uri) {
    if (images.has(uri)) return images.get(uri);
    return remember(images, uri, new Promise((resolve, reject) => {
      const image = new host.Image(); image.onload = () => resolve(image);
      image.onerror = () => { images.delete(uri); reject(new Error('Bear expression image')); };
      image.src = uri;
    }));
  }
  function mapping(from, to) {
    const sx = from[1][0] - from[0][0], sy = from[1][1] - from[0][1];
    const tx = to[1][0] - to[0][0], ty = to[1][1] - to[0][1];
    const norm = sx * sx + sy * sy;
    const a = (tx * sx + ty * sy) / norm, b = (ty * sx - tx * sy) / norm;
    return {a, b, x: to[0][0] - a * from[0][0] + b * from[0][1],
      y: to[0][1] - b * from[0][0] - a * from[0][1]};
  }
  function inverse(matrix, x, y) {
    const dx = x - matrix.x, dy = y - matrix.y;
    const norm = matrix.a * matrix.a + matrix.b * matrix.b;
    return [(matrix.a * dx + matrix.b * dy) / norm,
      (-matrix.b * dx + matrix.a * dy) / norm];
  }
  function sample(pixels, x, y) {
    x = clamp(x, 0, 319); y = clamp(y, 0, 319);
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const value = [];
    for (let channel = 0; channel < 4; channel++) {
      const at = (x, y) => pixels[4 * (320 * y + x) + channel];
      value.push((1 - fy) * ((1 - fx) * at(ix, iy) + fx * at(Math.min(319, ix + 1), iy)) +
        fy * ((1 - fx) * at(ix, Math.min(319, iy + 1)) + fx * at(Math.min(319, ix + 1), Math.min(319, iy + 1))));
    }
    return value;
  }
  const supported = (profile, kind) => profile && profile.color !== 'black' &&
    ['affection', 'angry', 'paw', 'tail'].includes(kind) &&
    !!points[(kind === 'affection' ? 'affection' : 'reaction') + ':' + profile.age + ':' + profile.color];
  async function render(doc, base, profile, kind) {
    if (!supported(profile, kind)) return null;
    const expression = kind === 'affection' ? 'affection' : 'reaction';
    const key = [profile.pose, profile.age, profile.color, expression].join(':');
    if (textures.has(key)) return remember(textures, key, textures.get(key));
    const model = {species: 'panda', xp: {baby: 0, teen: 600, adult: 1800}[profile.age],
      colors: {panda: profile.color}};
    const asset = host.APMascotArt[expression](model);
    if (!asset?.uri) throw new Error('Missing bear coat expression: ' + key);
    const reference = canvas(doc), referenceContext = reference.getContext('2d', {willReadFrequently: true});
    referenceContext.drawImage(await load(asset.uri), 0, 0, 320, 320);
    const source = referenceContext.getImageData(0, 0, 320, 320).data;
    const original = base.getContext('2d').getImageData(0, 0, 320, 320);
    // A complete, already-authored reaction for this exact coat and age. Mixing
    // eye/mouth fragments made a different (sad or distorted) face. The short
    // raised-paw protest is a single natural portrait, then the selected pose
    // returns. No face mesh, painted lids, copied fur, or partial second face.
    if (expression === 'reaction') return remember(textures, key, {
      canvas: reference, key, expression, landmarks: points[expression + ':' + profile.age + ':' + profile.color],
      nose: profile.nose, original: original.data, pixels: source,
    });
    // Some coat photographs put the nose above the legacy estimated point.
    // Locate its dark core before protecting it; otherwise the protection can
    // accidentally preserve a piece of the old pink mouth instead of the nose.
    const seen = new Set(), noses = [];
    const bounds = {left: Math.max(0, Math.floor(profile.nose[0] - 18)), right: Math.min(319, Math.ceil(profile.nose[0] + 18)),
      top: Math.max(0, Math.floor(profile.nose[1] - 18)), bottom: Math.min(319, Math.ceil(profile.nose[1] + 10))};
    const dark = (x, y) => {
      if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom ||
        profile.eyes.some(([cx, cy, rx, ry]) => Math.hypot((x - cx) / rx, (y - cy) / ry) < 1.15)) return false;
      const i = 4 * (320 * y + x);
      return original.data[i + 3] > 250 && Math.max(original.data[i], original.data[i + 1], original.data[i + 2]) < 65;
    };
    for (let y = bounds.top; y <= bounds.bottom; y++) for (let x = bounds.left; x <= bounds.right; x++) {
      const key = 320 * y + x; if (seen.has(key) || !dark(x, y)) continue;
      const pending = [[x, y]], component = [];
      while (pending.length) {
        const [px, py] = pending.pop(), index = 320 * py + px;
        if (seen.has(index) || !dark(px, py)) continue;
        seen.add(index); component.push([px, py]);
        pending.push([px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]);
      }
      const xs = component.map(p => p[0]), ys = component.map(p => p[1]);
      const width = Math.max(...xs) - Math.min(...xs) + 1, height = Math.max(...ys) - Math.min(...ys) + 1;
      if (component.length < 8 || width < 5 || width > 26 || height < 3 || height > 20 || width < height * .8) continue;
      const center = [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2];
      noses.push({center, score: component.length - 2 * Math.hypot(center[0] - profile.nose[0], center[1] - profile.nose[1])});
    }
    if (noses.length) profile = {...profile, nose: noses.sort((a, b) => b.score - a.score)[0].center};
    const output = new Uint8ClampedArray(original.data);
    const landmarks = points[expression + ':' + profile.age + ':' + profile.color];
    const eyeMap = mapping(landmarks, profile.eyes);
    const noseMask = (x, y) => smooth(1, 1.35, Math.hypot((x - profile.nose[0]) / 11, (y - profile.nose[1]) / 7));
    function blend(x, y, pixel, weight) {
      if (x < 0 || y < 0 || x >= 320 || y >= 320) return;
      const index = 4 * (320 * y + x);
      if (original.data[index + 3] < 254) return;
      weight *= noseMask(x, y);
      for (let channel = 0; channel < 3; channel++) output[index + channel] =
        output[index + channel] * (1 - weight) + pixel[channel] * weight;
    }
    function furFill(x, y, rx, ry, patchy = false, eye = false) {
      const candidates = [];
      for (let py = Math.max(0, Math.floor(y - 2 * ry)); py < Math.min(320, y + 2 * ry); py++) {
        for (let px = Math.max(0, Math.floor(x - 2 * rx)); px < Math.min(320, x + 2 * rx); px++) {
          const distance = Math.hypot((px - x) / rx, (py - y) / ry);
          if (distance < 1.18 || distance > 1.65 || noseMask(px, py) < 1) continue;
          const index = 4 * (320 * py + px), rgb = original.data.slice(index, index + 3);
          const light = (rgb[0] + rgb[1] + rgb[2]) / 3;
          if (original.data[index + 3] !== 255 || light < (patchy ? 40 : 105) || patchy && light > 160) continue;
          candidates.push({x: px, y: py, rgb, light});
        }
      }
      if (!candidates.length) return;
      candidates.sort((a, b) => a.light - b.light);
      const center = candidates[Math.floor(candidates.length / 2)];
      const color = [0, 1, 2].map(channel => {
        const values = candidates.map(point => point.rgb[channel]).sort((a, b) => a - b);
        return values[Math.floor(values.length / 2)];
      });
      for (let py = Math.max(0, Math.floor(y - 1.6 * ry)); py <= Math.min(319, y + 1.6 * ry); py++) {
        for (let px = Math.max(0, Math.floor(x - 1.8 * rx)); px <= Math.min(319, x + 1.8 * rx); px++) {
          const distance = Math.hypot((px - x) / (1.5 * rx), (py - y) / (1.3 * ry));
          if (distance >= 1.08) continue;
          const detail = sample(original.data, center.x + clamp((px - x) / rx, -1.5, 1.5) * 3,
            center.y + clamp((py - y) / ry, -1.3, 1.3) * 3);
          const pixel = color.map((value, channel) => clamp(value + clamp(detail[channel] - center.rgb[channel], -6, 6) -
            2.5 * Math.max(0, (py - y) / ry), 0, 255));
          const upper = eye ? smooth(y - 1.45 * ry, y - 1.2 * ry, py) : 1;
          blend(px, py, pixel, (1 - smooth(.94, 1.08, distance)) * upper);
        }
      }
    }
    function naturalLine(sourceCenter, targetCenter, matrix, halfWidth, halfHeight) {
      const local = {...matrix};
      local.x = targetCenter[0] - local.a * sourceCenter[0] + local.b * sourceCenter[1];
      local.y = targetCenter[1] - local.b * sourceCenter[0] - local.a * sourceCenter[1];
      const radius = Math.ceil((Math.abs(local.a) + Math.abs(local.b)) * (halfWidth + halfHeight) + 3);
      for (let y = Math.max(0, Math.floor(targetCenter[1] - radius)); y <= Math.min(319, targetCenter[1] + radius); y++) {
        for (let x = Math.max(0, Math.floor(targetCenter[0] - radius)); x <= Math.min(319, targetCenter[0] + radius); x++) {
          const [sx, sy] = inverse(local, x, y);
          if (Math.abs(sx - sourceCenter[0]) > halfWidth || Math.abs(sy - sourceCenter[1]) > halfHeight) continue;
          const pixel = sample(source, sx, sy);
          const above = sample(source, sx, sourceCenter[1] - halfHeight - 3);
          const below = sample(source, sx, sourceCenter[1] + halfHeight + 3);
          const background = (above[0] + above[1] + above[2] + below[0] + below[1] + below[2]) / 6;
          const light = (pixel[0] + pixel[1] + pixel[2]) / 3;
          const sourceNose = Math.hypot((sx - landmarks[2][0]) / 16, (sy - landmarks[2][1]) / 10);
          const opacity = clamp((background - light - 10) / Math.max(30, background - 25), 0, 1) * smooth(1, 1.3, sourceNose);
          blend(x, y, pixel, Math.min(1, opacity * (expression === 'reaction' ? 1.5 : 1)) * smooth(245, 255, pixel[3]));
        }
      }
    }
    for (let eye = 0; eye < 2; eye++) {
      const [x, y, rx, ry] = profile.eyes[eye];
      furFill(x, y, rx, ry, ['original', 'brown'].includes(profile.color), true);
      naturalLine(landmarks[eye], [x, y], eyeMap, eye ? 17 : 22, 7);
    }
    const result = canvas(doc);
    result.getContext('2d').putImageData(new host.ImageData(output, 320, 320), 0, 0);
    return remember(textures, key, {canvas: result, key, expression, landmarks, nose: profile.nose,
      original: original.data, pixels: output});
  }
  function renderer(target, base, face, kind) {
    const context = target.getContext('2d'); if (!context) return null;
    const buffer = canvas(target.ownerDocument), bufferContext = buffer.getContext('2d');
    const frame = new host.ImageData(new Uint8ClampedArray(face.original), 320, 320), changed = [];
    for (let i = 0; i < face.pixels.length; i += 4) if ([0, 1, 2, 3].some(c => face.pixels[i + c] !== face.original[i + c])) changed.push(i);
    let previous = -1;
    return {
      kind: 'coat-face',
      draw(state) {
        const weight = clamp(kind === 'affection' ? state.aff : state.angry, 0, 1);
        if (weight !== previous) {
          for (const index of changed) {
            if (face.expression !== 'reaction') {
              for (let c = 0; c < 3; c++) frame.data[index + c] =
                face.original[index + c] * (1 - weight) + face.pixels[index + c] * weight;
              continue;
            }
            // Premultiplied-alpha dissolve: transparent fur/paw edges cannot
            // leave a black fringe or be clipped to the previous pose's shape.
            const alpha = face.original[index + 3] * (1 - weight) + face.pixels[index + 3] * weight;
            for (let c = 0; c < 3; c++) frame.data[index + c] = weight === 0 ? face.original[index + c] :
              weight === 1 ? face.pixels[index + c] : alpha ?
              (face.original[index + c] * face.original[index + 3] * (1 - weight) +
                face.pixels[index + c] * face.pixels[index + 3] * weight) / alpha : 0;
            frame.data[index + 3] = alpha;
          }
          bufferContext.putImageData(frame, 0, 0); previous = weight;
        }
        context.setTransform(target.width / 320, 0, 0, target.height / 320, 0, 0);
        context.clearRect(0, 0, 320, 320); context.drawImage(buffer, 0, 0);
      },
      dispose() { target.width = 0; buffer.width = 0; },
    };
  }
  host.APBearCoatFaces = Object.freeze({supported, render, renderer, mapping, inverse, points});
})(globalThis);
