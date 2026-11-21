(function(host) {
  'use strict';
  const bindings = new WeakMap(),
    documents = new WeakMap(),
    active = new Set();
  let epoch = 0;
  const petSelector = '.ap-mascot-mini,.ap-teacher-mascot-mark,.ap-mascot-art';
  const controlSelector = '.ap-habitat-house,.ap-mascot-home-copy strong,.ap-teacher-mascot-copy strong,a,input,textarea,select,[data-mascot-retry],.ap-feedback-pet-notice,.ap-mascot-phase,.ap-mascot-balance,.ap-mascot-gear,.ap-mascot-home-name,#apMascotReaction';

  function clear(state) {
    state.latest = null;
    state.serial++;
    if (state.frame) host.cancelAnimationFrame(state.frame);
    state.frame = 0
  }

  function remove(state) {
    endContact(state, true);
    clear(state);
    restoreSurface(state);
    active.delete(state);
    documents.get(state.node.ownerDocument)?.states.delete(state);
    state.node.removeEventListener?.('pointerdown', state.down);
    bindings.delete(state.node)
  }

  function restoreSurface(state) {
    const surface = state.surface;
    if (!surface) return;
    if (surface.style.getPropertyValue('touch-action') === 'none') {
      if (state.touchAction) surface.style.setProperty('touch-action', state.touchAction, state.touchPriority);
      else surface.style.removeProperty('touch-action');
    }
    state.surface = null
  }

  function configureSurface(state) {
    const surface = state.node.querySelector('.ap-habitat-open');
    const bear = state.read()?.species === 'panda' && state.enabled() !== false;
    if (state.surface && (state.surface !== surface || !bear)) restoreSurface(state);
    if (!bear || !surface?.style?.setProperty || state.surface === surface) return;
    state.surface = surface;
    state.touchAction = surface.style.getPropertyValue('touch-action');
    state.touchPriority = surface.style.getPropertyPriority('touch-action');
    // This must be set before pointerdown: manipulation permits the browser
    // to cancel a vertical finger drag and start scrolling instead of gaze.
    surface.style.setProperty('touch-action', 'none')
  }

  function endContact(state, cancel) {
    const contact = state.contact;
    state.contact = null;
    if (contact?.type === 'touch') documents.get(state.node.ownerDocument).touchUntil = Date.now() + 750;
    try { contact?.capture?.releasePointerCapture(contact.id) } catch (_) {}
    if (cancel) clear(state)
  }

  function enabled(state) {
    const node = state.node,
      doc = node.ownerDocument,
      box = node.getBoundingClientRect(),
      view = doc.defaultView;
    return node.isConnected && !doc.hidden && !node.hidden && state.enabled() !== false && state.read()?.species === 'panda' && box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < (view?.innerHeight || Infinity) && !node.dataset.petCloseup && !node.dataset.petReturning && !host.APMascotCloseup?.moving?.(node)
  }

  function gestureBusy(node) {
    if ((bindings.get(node)?.blockers || 0) > 0) return true;
    const actor = host.APMascotBear.get?.(node), approved = actor?.action?.() || actor?.state()?.kind;
    if (approved && !['idle', 'look'].includes(approved)) return true;
    const reaction = node.dataset.petReaction;
    return !!reaction && reaction !== 'look'
  }

  function schedule(state, x, y) {
    if (!enabled(state) || gestureBusy(state.node)) {
      clear(state);
      return
    }
    state.latest = {
      x,
      y,
      epoch
    };
    if (!state.frame && !state.pending) state.frame = host.requestAnimationFrame(() => dispatch(state))
  }
  async function dispatch(state) {
    state.frame = 0;
    const point = state.latest;
    state.latest = null;
    if (!point || point.epoch !== epoch || !enabled(state) || gestureBusy(state.node)) return;
    const model = state.read(),
      image = state.node.querySelector('.ap-mascot-mini image,.ap-teacher-mascot-mark image,.ap-mascot-art image'),
      matrix = image?.getScreenCTM();
    if (!matrix) return;
    const serial = state.serial;
    const pending = {epoch, serial};
    state.pending = pending;
    try {
      const local = new host.DOMPoint(point.x, point.y).matrixTransform(matrix.inverse());
      if (point.epoch !== epoch || !enabled(state) || gestureBusy(state.node)) return;
      await host.APMascotPetting.respond(state.node, model, 'look', {
        x: local.x / 320,
        y: local.y / 320
      })
    } finally {
      if (state.pending === pending) {
        state.pending = null;
        if (state.latest && serial === state.serial && enabled(state) && !gestureBusy(state.node)) state.frame = host.requestAnimationFrame(() => dispatch(state));
      }
    }
  }

  function bind(node, read, can = () => true) {
    if (!node) return;
    for (const state of active)
      if (!state.node.isConnected) remove(state);
    let state = bindings.get(node);
    if (state) {
      state.read = read;
      state.enabled = can;
      configureSurface(state);
      return
    }
    state = {
      node,
      read,
      enabled: can,
      latest: null,
      frame: 0,
      pending: false,
      serial: 0,
      contact: null,
      surface: null
    };
    state.down = (event = {}) => {
      if (event.isPrimary === false || event.button != null && event.button !== 0) return;
      endContact(state, true);
      if (event.pointerId == null || !enabled(state) || event.target?.closest?.(controlSelector)) return;
      const type = event.pointerType || 'mouse';
      const group = documents.get(node.ownerDocument);
      if (type === 'mouse' && (event.sourceCapabilities?.firesTouchEvents || Date.now() < group.touchUntil)) return;
      const capture = event.target?.closest?.(petSelector) ? null : event.target?.closest?.('.ap-habitat-open');
      state.contact = {id: event.pointerId, type, x: event.clientX, y: event.clientY, following: false, capture};
      if (type === 'touch') group.touchUntil = Date.now() + 750;
      // Pet contacts retain the existing petting capture. Scenery contacts
      // keep delivering movement after the finger leaves the card bounds.
      try { capture?.setPointerCapture(event.pointerId) } catch (_) {}
    };
    bindings.set(node, state);
    active.add(state);
    const doc = node.ownerDocument;
    let group = documents.get(doc);
    if (!group) {
      group = {
        states: new Set(),
        touchUntil: 0
      };
      documents.set(doc, group);
      doc.addEventListener('pointermove', event => {
        for (const state of group.states) {
          if (!state.node.isConnected) {
            remove(state);
            continue
          }
          const contact = state.contact;
          if (contact && contact.id === event.pointerId) {
            contact.x = event.clientX;
            contact.y = event.clientY;
            // Only the existing hit-tested scenery-stroke branch enables
            // following; a pet stroke stays affection and a tap stays a tap.
            if (contact.following) schedule(state, contact.x, contact.y);
            continue
          }
          if (event.pointerType === 'touch' || event.buttons || event.sourceCapabilities?.firesTouchEvents || Date.now() < group.touchUntil) continue;
          schedule(state, event.clientX, event.clientY)
        }
      }, {
        passive: true
      });
      doc.addEventListener('pointerup', event => {
        for (const state of group.states) if (state.contact?.id === event.pointerId) endContact(state, false)
      }, {passive: true});
      doc.addEventListener('pointercancel', event => {
        for (const state of group.states) {
          if (state.contact?.id === event.pointerId) endContact(state, true);
          else if (!state.contact) clear(state);
        }
      }, {passive: true});
      doc.addEventListener('lostpointercapture', event => {
        for (const state of group.states) if (state.contact?.id === event.pointerId) endContact(state, true)
      }, {passive: true});
      doc.addEventListener('pointerleave', () => {
        for (const state of group.states) endContact(state, true)
      }, {passive: true});
      doc.addEventListener('visibilitychange', () => {
        if (doc.hidden)
          for (const state of group.states) endContact(state, true)
      });
    }
    group.states.add(state);
    configureSurface(state);
    node.addEventListener('pointerdown', state.down, {
      passive: true
    });
  }

  function follow(node, read, can, x, y) {
    bind(node, read, can);
    const state = bindings.get(node);
    if (state) {
      if (state.contact) {
        state.contact.following = true;
        // A delayed hit-test must not send the eyes back to an older point.
        x = state.contact.x;
        y = state.contact.y;
      }
      schedule(state, x, y)
    }
  }

  function begin(node) {
    const state = bindings.get(node);
    if (!state) return () => {};
    clear(state); state.blockers = (state.blockers || 0) + 1;
    const generation = epoch;
    let ended = false;
    return () => { if (!ended && generation === epoch) { ended = true; state.blockers = Math.max(0, state.blockers - 1); } };
  }
  function resetAll() {
    epoch++;
    for (const state of active) {
      endContact(state, true);
      clear(state);
      state.blockers = 0;
      state.pending = null;
      if (!state.node.isConnected) remove(state)
    }
  }
  host.addEventListener('ap-account-changed', resetAll);
  host.APBearFieldGaze = Object.freeze({
    bind,
    follow,
    resetAll,
    begin
  });
})(globalThis);
