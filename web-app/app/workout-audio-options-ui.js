(function (global) {
  'use strict';
  const audio = global.APWorkoutAudio;
  if (!audio) return;

  const labels = {rest: 'Fim do descanso', cardio: 'Fim do cardio'};
  const get = id => document.getElementById(id);
  function element(tag, text = '', className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(label, className = 'ap-audio-choice-button') {
    const node = element('button', label, className);
    node.type = 'button';
    return node;
  }
  function messageNode() {
    const node = element('p', '', 'ap-audio-choice-message');
    node.setAttribute('role', 'status');
    return node;
  }
  const isPreviewing = (status, kind, slot) => status.preview === kind && status.previewChoice === slot;
  function labelPreview(node, active) {
    node.textContent = active ? 'Parar' : 'Ouvir';
    node.setAttribute('aria-pressed', String(active));
  }
  function previewButton(kind, message, getSlot) {
    const node = button('Ouvir');
    node.setAttribute('aria-label', 'Ouvir som de ' + labels[kind].toLowerCase());
    node.addEventListener('click', async () => {
      const slot = getSlot();
      if (isPreviewing(audio.status(), kind, slot)) return audio.stopPreview();
      global.stopSoundPreview?.();
      global.APCardioSound?.stopPreview?.();
      node.disabled = true;
      message.textContent = '';
      try { await audio.play(kind, true, slot); }
      catch (error) { message.textContent = error.message; }
      finally { node.disabled = false; }
    });
    return node;
  }

  for (const kind of Object.keys(labels)) {
    const host = get('apSharedAudio-' + kind);
    if (!host) continue;
    const input = element('input');
    input.type = 'file';
    input.accept = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.opus,.flac,.webm';
    input.multiple = true;
    input.hidden = true;
    const add = button('Adicionar áudios', 'btn');
    const list = element('ul', '', 'ap-audio-choice-list');
    const info = element('p', '', 'ap-audio-choice-message');
    const message = messageNode();
    host.append(info, add, input, list, message);
    let working = false, listKey = '';
    function render() {
      const state = audio.options(kind), count = state.extra.length;
      add.disabled = working || state.role !== 'teacher' || !state.supported || count >= 4;
      info.textContent = state.supported
        ? count + ' de 4 opções adicionais · Até 8 MB por arquivo.'
        : 'Conecte-se para carregar as opções de áudio.';
      const nextKey = JSON.stringify([state.extra, working]);
      if (nextKey !== listKey) {
       listKey = nextKey;
       list.replaceChildren(...state.extra.map(({name, slot, revision}) => {
        const row = element('li');
        const actions = element('div', '', 'ap-audio-choice-actions');
        const remove = button('Remover', 'btn');
        remove.disabled = working;
        remove.setAttribute('aria-label', 'Remover ' + name);
        remove.addEventListener('click', async () => {
          if (working || !global.confirm('Remover “' + name + '” das opções dos alunos?')) return;
          working = true;
          audio.stopPreview();
          render();
          try {
            await audio.removeOption(kind, slot, revision);
            message.textContent = 'Áudio removido das opções dos alunos.';
          } catch (error) { message.textContent = error.message; }
          finally { working = false; render(); }
        });
        const preview = previewButton(kind, message, () => slot);
        preview.dataset.audioOption = slot;
        preview.disabled = working;
        actions.append(preview, remove);
        row.append(element('strong', name), actions);
        return row;
       }));
      }
      const status = audio.status();
      for (const preview of list.querySelectorAll('[data-audio-option]')) labelPreview(preview, isPreviewing(status,kind,preview.dataset.audioOption));
    }
    add.addEventListener('click', () => {
      input.value = '';
      input.click();
    });
    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      if (working || !files.length) return;
      working = true;
      render();
      message.textContent = 'Enviando ' + files.length + (files.length === 1 ? ' áudio…' : ' áudios…');
      try {
        const result = await audio.addOptions(kind, files);
        const sent = result.sent ? result.sent + (result.sent === 1 ? ' áudio disponível.' : ' áudios disponíveis.') : '';
        message.textContent = [sent, ...result.failed.map(failure => failure.name + ' · ' + failure.message)].filter(Boolean).join(' ');
      } catch (error) { message.textContent = error.message; }
      finally { input.value = ''; working = false; render(); }
    });
    host.addEventListener('toggle', () => { if (host.open) audio.sync(); });
    audio.subscribe(render);
  }

  const open = get('apStudentAudioOpen'), panel = get('apStudentAudioOptions');
  if (!open || !panel) return;
  const controls = element('div', '', 'ap-audio-choice-controls');
  const close = button('Fechar'), refresh = button('Atualizar lista');
  const summary = messageNode();
  close.addEventListener('click', () => {
    panel.hidden = true;
    open.setAttribute('aria-expanded', 'false');
    audio.stopPreview();
    open.focus();
  });
  refresh.addEventListener('click', () => audio.sync());
  controls.append(refresh, close);
  panel.append(controls, summary);
  const groups = Object.entries(labels).map(([kind, label]) => {
    const row = element('div', '', 'ap-audio-choice-group');
    const title = element('label', label);
    const select = element('select');
    select.id = 'apStudentSound-' + kind;
    title.htmlFor = select.id;
    const save = button('Usar este som'), note = messageNode();
    const preview = previewButton(kind, note, () => select.value);
    const actions = element('div', '', 'ap-audio-choice-actions');
    actions.append(preview, save);
    row.append(title, select, actions, note);
    panel.insertBefore(row, controls);
    let signature = '', choice = '', writing = false;
    function render(status) {
      const value = audio.options(kind);
      const catalog = [
        {slot:'auto',name:value.original?'Som do professor · '+value.original:'Som do professor (automático)'},
        {slot:'default',name:'Sinal padrão'},
        ...value.extra
      ];
      const nextSignature = JSON.stringify(catalog);
      if (signature !== nextSignature || choice !== value.selected) {
        signature = nextSignature;
        choice = value.selected;
        select.replaceChildren(...catalog.map(({slot,name}) => {
          const option = element('option', name);
          option.value = slot;
          return option;
        }));
        select.value = choice;
        if (!writing) note.textContent = value.removed ? 'A opção escolhida saiu da lista. O sinal padrão está em uso.' : '';
      }
      select.disabled = writing || value.blocked;
      save.disabled = writing || value.blocked || select.value === choice;
      preview.disabled = writing || value.blocked;
      labelPreview(preview, isPreviewing(status,kind,select.value));
    }
    select.addEventListener('change', () => { note.textContent = ''; render(audio.status()); });
    save.addEventListener('click', async () => {
      const owner = audio.status().owner;
      writing = true;
      render(audio.status());
      try {
        const saved = await audio.chooseOption(kind, select.value);
        if (saved && owner === audio.status().owner) note.textContent = 'Som escolhido neste aparelho.';
      } catch (error) { if (owner === audio.status().owner) note.textContent = error.message; }
      finally { writing = false; render(audio.status()); }
    });
    return {render, reset() {signature = ''; choice = ''; note.textContent = '';}};
  });
  open.addEventListener('click', () => {
    if (!panel.hidden) return close.click();
    panel.hidden = false;
    open.setAttribute('aria-expanded', 'true');
    panel.focus();
    audio.sync();
  });
  let owner = '';
  audio.subscribe(status => {
    if (owner !== status.owner) {
      owner = status.owner;
      panel.hidden = true;
      open.setAttribute('aria-expanded', 'false');
      for (const group of groups) group.reset();
    }
    open.hidden = !audio.isStudent();
    refresh.disabled = status.busy;
    summary.textContent = status.busy ? 'Atualizando a lista…' : status.error;
    for (const group of groups) group.render(status);
  });
})(window);
