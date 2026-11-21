(function (host) {
  'use strict';
  const states = new WeakMap();
  const active = new Set();
  const returning = new Map();
  let generation = 0;
  const reducedMotion = () => !!host.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const styleId = 'ap-mascot-closeup-css';
  const css = `
.ap-habitat[data-pet-closeup="true"] .ap-mascot-mini,
.ap-habitat[data-pet-closeup="true"] .ap-teacher-mascot-mark {
  left: var(--pet-close-left) !important;
  top: var(--pet-close-top) !important;
  bottom: auto !important;
  width: var(--pet-close-size) !important;
  height: var(--pet-close-size) !important;
  transform-origin: 0 0;
}
.ap-habitat[data-pet-closeup="true"] .ap-mascot-speech {
  left: var(--pet-close-speech-left) !important;
  top: var(--pet-close-speech-top) !important;
  width: min(264px, calc(100% - 56px)) !important;
  height: auto !important;
  max-height: none !important;
  padding: 12px 16px !important;
  border-radius: 32px !important;
  overflow: visible !important;
  white-space: normal !important;
  font-size: calc(13px * var(--ap-ts, 1)) !important;
  line-height: 1.4 !important;
  z-index: 6 !important;
  opacity: 1 !important;
  pointer-events: auto;
}
.ap-habitat[data-pet-closeup="true"] .ap-mascot-speech > * {
  pointer-events: none;
}
.ap-habitat[data-pet-closeup="true"] > .ap-mascot-speech-tail {
  z-index: 6;
}
`;
  const set = (node, name, value) => {
    const next = Math.round(value * 100) / 100 + 'px';
    if (node.style.getPropertyValue(name) !== next) node.style.setProperty(name, next);
  };
  function ensureStyle(doc) {
    if (doc.getElementById(styleId)) return;
    const style = doc.createElement('style');
    style.id = styleId;
    style.textContent = css;
    doc.head.append(style);
  }
  function eligible(node) {
    return node?.matches('.ap-mascot-home.ap-habitat,.ap-teacher-mascot.ap-habitat') &&
      !node.classList.contains('ap-recado-only') && !node.hidden;
  }
  function layout(node, nextModel) {
    if (nextModel && returning.has(node)) returning.get(node).model = nextModel;
    const state = states.get(node);
    if (!state || node.dataset.petCloseup !== 'true') return false;
    if (nextModel) state.model = nextModel;
    const mark = node.querySelector('.ap-mascot-mini,.ap-teacher-mascot-mark');
    const speech = node.querySelector('.ap-mascot-speech');
    if (!mark || !speech || !node.clientWidth) return false;
    const model = state.model;
    const scale = host.APMascotArt?.scale(model) || 1;
    const landmarks = host.APMascotArt?.landmarks(model);
    const zones = host.APMascotHitAreas?.zones(model) || [];
    const ears = zones.filter(zone => zone.part === 'ear');
    const nose = zones.find(zone => zone.part === 'nose');
    const rawX = ears.length ? ears.reduce((sum, ear) => sum + ear.x, 0) / ears.length :
      landmarks?.headX ?? nose?.x ?? .5;
    const mirroredX = host.APMascotArt?.mirrored(model) ? 1 - rawX : rawX;
    const headX = (1 - scale) / 2 + scale * mirroredX;
    const rawCrown = ears.length ? Math.max(0, Math.min(...ears.map(ear => ear.y - ear.ry))) :
      landmarks?.headTop ?? Math.max(0, (nose?.y ?? .25) - .17);
    const crown = 1 - scale + scale * rawCrown;
    const width = node.clientWidth;
    const scene = node.getBoundingClientRect();
    const name = node.querySelector('[data-mascot-name],.ap-mascot-home-copy strong');
    const titleBottom = name ? name.getBoundingClientRect().bottom - scene.top : 24;
    const speechTop = Math.max(34, titleBottom + 10);
    set(node, '--pet-close-speech-top', speechTop);
    set(node, '--pet-close-speech-left', (width - speech.getBoundingClientRect().width) / 2);
    const speechBottom = speechTop + speech.getBoundingClientRect().height;
    const size = Math.min(680, Math.max(240, width * .78 / scale));
    const headTop = speechBottom + 6;
    const height = Math.max(state.height, headTop + 134);
    set(node, '--pet-scene-height', height);
    set(node, '--pet-close-size', size);
    set(node, '--pet-close-left', width / 2 - size * headX);
    set(node, '--pet-close-top', headTop - size * crown);
    let tail = node.querySelector('.ap-mascot-speech-tail');
    if (tail) {
      tail.setAttribute('viewBox', '0 0 ' + width + ' ' + node.clientHeight);
      const x = Math.round(width / 2 - 18), y = Math.round(speechBottom - 1);
      tail.firstElementChild?.setAttribute('d',
        'M ' + (x - 8) + ' ' + y + ' Q ' + (x - 4) + ' ' + (y + 14) + ' ' +
        (x + 7) + ' ' + (y + 19) + ' Q ' + (x + 4) + ' ' + (y + 8) + ' ' +
        (x + 8) + ' ' + y);
    }
    return true;
  }
  function stopReturn(node) {
    const state = returning.get(node);
    if (!state) return null;
    returning.delete(node);
    state.view.cancelAnimationFrame?.(state.frame);
    state.animation.cancel();
    delete node.dataset.petReturning;
    return state;
  }
  function reset(node) {
    const priorReturn = stopReturn(node);
    const state = states.get(node);
    if (!state) {
      if (priorReturn && node.isConnected) host.APMascotHomes?.decorate(node, priorReturn.model);
      return;
    }
    host.clearTimeout(state.timer);
    state.animation?.cancel();
    state.observer?.disconnect();
    delete node.dataset.petCloseup;
    for (const name of Array.from(node.style)) {
      if (name.startsWith('--pet-close-')) node.style.removeProperty(name);
    }
    if (state.sceneHeight) node.style.setProperty('--pet-scene-height', state.sceneHeight);
    else node.style.removeProperty('--pet-scene-height');
    states.delete(node);
    active.delete(node);
    if (node.isConnected) host.APMascotHomes?.decorate(node, state.model);
  }
  function resetAll() {
    generation++;
    for (const node of Array.from(active)) reset(node);
    for (const node of Array.from(returning.keys())) reset(node);
  }
  function goBack(node) {
    const state = states.get(node);
    if (!state) return;
    // Use one portrait while the camera moves, with no overlapping canvas
    // face or gaze. The same lifecycle applies to native and web cards.
    host.APMascotPetting?.cancel(node);
    const mark = node.querySelector('.ap-mascot-mini,.ap-teacher-mascot-mark');
    const before = mark?.getBoundingClientRect();
    reset(node);
    if (!node.isConnected || reducedMotion() || !mark?.animate || !before?.width) return;
    const after = mark.getBoundingClientRect();
    if (!after.width) return;
    // Keep the resting scene height while the transformed pet moves back.
    // Habitat layout measures its visible bounds to follow the head each frame.
    node.dataset.petReturning = 'true';
    const animation = mark.animate([
      {transformOrigin: '0 0', transform: 'translate(' + (before.left - after.left) + 'px,' +
        (before.top - after.top) + 'px) scale(' + (before.width / after.width) + ')'},
      {transformOrigin: '0 0', transform: 'none'}
    ], {duration: 1000, easing: 'cubic-bezier(.3,0,.25,1)'});
    const view = node.ownerDocument.defaultView || host;
    const current = {animation, view, model: state.model, frame: null};
    returning.set(node, current);
    const follow = () => {
      if (returning.get(node) !== current) return;
      if (!node.isConnected) { stopReturn(node); return; }
      host.APMascotHomes?.decorate(node, current.model);
      current.frame = view.requestAnimationFrame?.(follow);
    };
    current.frame = view.requestAnimationFrame?.(follow);
    const finish = () => {
      if (returning.get(node) !== current) return;
      returning.delete(node);
      view.cancelAnimationFrame?.(current.frame);
      delete node.dataset.petReturning;
      // Re-measure after the transform has ended, including in older WebViews
      // without requestAnimationFrame on the card's document.
      if (node.isConnected) host.APMascotHomes?.decorate(node, current.model);
    };
    animation.finished.then(finish, finish);
  }
  function scheduleReturn(node, state) {
    host.clearTimeout(state.timer);
    state.timer = host.setTimeout(() => {
      if (states.get(node) === state) goBack(node);
    }, 1400);
  }
  async function prepareForGesture(node) {
    const epoch = generation;
    const priorReturn = returning.get(node);
    if (priorReturn) {
      // Let the smooth return finish before drawing a new face. Cancelling it
      // here would snap a tapped pet straight to its small resting size.
      const completed = await priorReturn.animation.finished.then(() => true, () => false);
      return completed && epoch === generation && node.isConnected && !host.document.hidden &&
        !returning.has(node) && !states.has(node) ? 'settled' : false;
    }
    const state = states.get(node);
    if (!state) return node.isConnected && !host.document.hidden;
    if (state.entered) return true;
    // Keep a face reaction on a stationary portrait without cutting short the
    // entrance or restarting the camera's original return deadline.
    await state.animation?.finished?.catch(() => {});
    return epoch === generation && node.isConnected && !host.document.hidden &&
      states.get(node) === state ? 'settled' : false;
  }
  function approach(node, model) {
    if (!eligible(node) || !model?.species) return false;
    ensureStyle(node.ownerDocument);
    if (states.has(node)) {
      const state = states.get(node);
      state.model = model;
      const placed = layout(node);
      return placed;
    }
    // A scenery tap owns one complete approach/hold/return cycle. More taps
    // must not postpone the return or reverse an already returning portrait.
    if (returning.has(node)) return true;
    host.APMascotPetting?.cancel(node);
    const mark = node.querySelector('.ap-mascot-mini,.ap-teacher-mascot-mark');
    if (!mark?.querySelector('image[data-mascot-photo]')) return false;
    for (const prior of active) if (!prior.isConnected) reset(prior);
    const before = mark.getBoundingClientRect();
    stopReturn(node);
    const state = {model, entered: true, height: node.clientHeight,
      sceneHeight: node.style.getPropertyValue('--pet-scene-height')};
    states.set(node, state);
    active.add(node);
    node.style.setProperty('--pet-scene-height', state.height + 'px');
    node.dataset.petCloseup = 'true';
    layout(node);
    const after = mark.getBoundingClientRect();
    if (!reducedMotion() && mark.animate && after.width) {
      state.entered = false;
      state.animation = mark.animate([
        {transformOrigin: '0 0', transform: 'translate(' + (before.left - after.left) + 'px,' +
          (before.top - after.top) + 'px) scale(' + (before.width / after.width) + ')'},
        {transformOrigin: '0 0', transform: 'none'}
      ], {duration: 240, easing: 'cubic-bezier(.2,.7,.25,1)'});
      state.animation.finished?.then(() => { state.entered = true; }, () => {});
    }
    if (host.ResizeObserver) {
      state.observer = new host.ResizeObserver(() => layout(node));
      state.observer.observe(node);
      state.observer.observe(node.querySelector('.ap-mascot-speech'));
    }
    if (!node.dataset.petCloseupBound) {
      node.dataset.petCloseupBound = 'true';
      node.addEventListener('click', event => {
        if (event.target.closest('.ap-habitat-house')) reset(node);
      }, true);
    }
    scheduleReturn(node, state);
    return true;
  }
  host.addEventListener('ap-account-changed', resetAll);
  host.document.addEventListener('visibilitychange', () => {
    if (host.document.hidden) resetAll();
  });
  function moving(node) { const state = states.get(node); return returning.has(node) || !!state && !state.entered; }
  host.APMascotCloseup = Object.freeze({approach, layout, reset, resetAll, prepareForGesture, moving});
})(globalThis);
