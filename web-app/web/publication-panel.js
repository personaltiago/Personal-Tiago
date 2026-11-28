(function () {
  'use strict';
  const original = window.APupdates;
  if (!original || !window.APWebPlatform) return;
  const panelMarkup = `<section class="ap-publish-sheet" role="dialog" aria-modal="true" aria-labelledby="apPublishTitle"><header><div><small>CONTA DO PROFESSOR</small><h2 id="apPublishTitle">Central de atualizações</h2></div><button id="apPublishClose" type="button" aria-label="Fechar">×</button></header><p class="ap-publish-description">Este aparelho publica a mesma versão para professor e alunos, no Android, no iPhone e no navegador. No iPhone, a instalação acontece quando não há treino ou edição em andamento.</p><p class="ap-publish-description"><a href="https://agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site/app/" target="_blank" rel="noopener noreferrer">Abrir o aplicativo no iPhone ou navegador ↗</a></p><div class="ap-publish-source"><button id="apPublishCurrent" type="button">Usar a versão deste aparelho</button><span>ou escolha uma atualização recebida</span><label class="ap-publish-file">Escolher arquivo .agenda.json<input id="apPublishFile" type="file" accept=".json,application/json"></label></div><p id="apPublishSelected" hidden></p><label class="ap-publish-label" for="apPublishNotes">O que mudou nesta versão?</label><textarea id="apPublishNotes" maxlength="1200" rows="3" placeholder="Descreva as melhorias que os alunos vão receber."></textarea><div id="apPublishProgress" class="ap-publish-progress" hidden><div class="ap-publish-progress-top"><strong id="apPublishProgressTitle">Enviando arquivo</strong><output id="apPublishProgressPercent">0% do envio</output></div><progress id="apPublishProgressBar" max="100" value="0" aria-label="Progresso da etapa atual"></progress><p id="apPublishProgressDetails"></p><p id="apPublishProgressEta"></p></div><p id="apPublishStatus" role="status" aria-live="polite" hidden></p><button id="apPublishSend" type="button" disabled>Publicar para Android e iPhone</button><section id="apPublishReceipt" aria-label="Recibo da publicação" hidden></section><p class="ap-publish-footnote">A publicação termina quando a versão fica disponível no servidor.</p></section>`;
  const releasePublicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs2qgeDa6+Zj9DG0B4gn0jczsrqON+TDFpnluHU0b7IcqcOIosXEqNZRVFVXQcbS6m083G/T1lUbQuj4ZiHQ1cyFgSnSTyY093w66CSwCC6yUFNClgqxFtSG7bCPp89eyL2B84MTqMmxowtgQFa91/MZV+BHjRdJSkwDZMGm1pW7H12iliN2yvQWjcyTpJMMgQ7vLXwjKZwq/aRAA2byIohcoK0ziO6I4IfArfBfg0emLApJ3Mj8Z8nHQJHzyn3HMOga6TX4hoYyi9a39W9pKIyU775myCHlflI9AL+4OyJYtZjypCP0AIit20Goj2dq8NAwhq4SLUAWQ9bhQzwDU4QIDAQAB';
  const maxBytes = 24 * 1024 * 1024;
  const pages = ['index.html', 'professor.html', 'avaliacoes.html', 'cadastro.html'];
  const $ = id => document.getElementById(id);
  const encoder = new TextEncoder();
  let panel, focusBefore, candidate, reader, retrySelection, transfer, busy = false, generation = 0;
  let stage = '';
  const style = document.createElement('style');
  style.textContent = '#apPublishReceipt:not([hidden]){padding:14px 16px;margin:14px 0;border:1px solid #548c70;border-radius:12px;line-height:1.5}#apPublishReceipt p{margin:6px 0;overflow-wrap:anywhere}#apPublishProgress[data-state=error] progress::-webkit-progress-value{background:#ef829a}#apPublishProgress[data-state=error] progress::-moz-progress-bar{background:#ef829a}';
  document.head.append(style);
  const label = {read: 'Lendo arquivo', signature: 'Conferindo assinatura', ready: 'Arquivo conferido', authorize: 'Preparando envio', upload: 'Enviando', confirm: 'Confirmando no servidor', done: 'Concluído'};
  function status(message, kind = 'info') {
    const node = $('apPublishStatus');
    node.hidden = !message;
    node.textContent = message;
    node.dataset.kind = kind;
  }
  function progress(next, loaded = null, total = null) {
    const changedStage = stage !== next;
    stage = next;
    const measured = total > 0 && Number.isFinite(loaded) ? {loaded, total} : null;
    const box = $('apPublishProgress'), bar = $('apPublishProgressBar');
    box.hidden = false;
    box.dataset.state = stage;
    $('apPublishProgressTitle').textContent = label[stage];
    const count = stage === 'done' ? 100 : measured ? Math.floor(100 * loaded / total) : null;
    // Transferring all bytes does not establish that the server activated the file.
    if (count === null || (count >= 100 && stage !== 'done')) {
      bar.removeAttribute('value'); $('apPublishProgressPercent').textContent = '';
    } else { bar.value = count; $('apPublishProgressPercent').textContent = `${count}%`; }
    $('apPublishProgressDetails').textContent = measured ? `${loaded.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} bytes` : '';
    $('apPublishProgressEta').textContent = stage === 'confirm' ? 'Conferindo a versão disponível aos alunos.' : '';
    if (changedStage && stage !== 'done') box.scrollIntoView?.({block:'nearest'});
  }
  function fail(error) {
    const box = $('apPublishProgress');
    box.dataset.state = 'error';
    $('apPublishProgressTitle').textContent = `Falha na etapa: ${label[stage]}`;
    $('apPublishProgressEta').textContent = '';
    status(error.message || 'Confira a conexão e tente de novo.', 'error');
    $('apPublishSend').textContent = 'Tentar de novo';
    $('apPublishSend').scrollIntoView?.({block:'nearest'});
  }
  function lock(value) {
    busy = value;
    for (const id of ['apPublishFile','apPublishCurrent','apPublishNotes']) $(id).disabled = value;
    $('apPublishSend').disabled = value || (!candidate && !retrySelection);
  }
  function active(id) { return id === generation && APaccounts.isTeacher(); }
  function read(file, id) {
    return new Promise((resolve, reject) => {
      const current = new FileReader(); reader = current;
      current.onprogress = e => { if(active(id)) progress('read', e.loaded, e.lengthComputable ? e.total : file.size || null); };
      current.onerror = () => reject(Error('Não foi possível ler este arquivo. Selecione-o novamente.'));
      current.onabort = () => reject(Error('A leitura foi interrompida.'));
      current.onload = () => resolve(new Uint8Array(current.result));
      current.onloadend = () => { if(reader === current) reader = null; };
      current.readAsArrayBuffer(file);
    });
  }
  const sha256 = bytes => crypto.subtle.digest('SHA-256', bytes);
  const hex = buffer => Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2,'0')).join('');
  // Same canonical byte representation as the official tools/sign_update.cjs; only the APK public key is embedded.
  async function checkSignature(bundle) {
    const parts = ['Agenda Personal update v1\n'];
    function string(value) {
      const bytes = encoder.encode(value);
      if (new TextDecoder('utf-8',{ignoreBOM:true}).decode(bytes) !== value) throw Error('Texto inválido no pacote.');
      const length = new ArrayBuffer(4);
      new DataView(length).setUint32(0, bytes.length);
      parts.push('s', length, bytes);
    }
    function append(value, depth) {
      if (depth > 64) throw Error('Metadados complexos demais.');
      if (Array.isArray(value)) { parts.push('['); for(const item of value) append(item,depth+1); parts.push(']'); }
      else if(value === null) parts.push('n');
      else if(typeof value === 'object') {
        parts.push('{');
        for(const key of Object.keys(value).sort()) {
          if(depth === 0 && key === 'agendaSignature') continue;
          string(key); append(value[key],depth+1);
        }
        parts.push('}');
      } else if(typeof value === 'string') string(value);
      else if(typeof value === 'boolean') parts.push(value ? 't' : 'f');
      else if(Number.isSafeInteger(value)) parts.push('#'+value+';');
      else throw Error('Número inválido no pacote.');
    }
    if(typeof bundle.agendaSignature !== 'string' || !/^[A-Za-z0-9+/]{342}==$/.test(bundle.agendaSignature)) throw Error('Assinatura ausente ou inválida. Escolha um pacote completo assinado.');
    append(bundle,0);
    const decode = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
    const algorithm = {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'};
    const key = await crypto.subtle.importKey('spki',decode(releasePublicKey),algorithm,false,['verify']);
    const digest = await sha256(await new Blob(parts).arrayBuffer());
    if(!await crypto.subtle.verify(algorithm,key,decode(bundle.agendaSignature),digest)) throw Error('A assinatura não corresponde ao conteúdo do arquivo.');
  }
  async function select(file, base = null) {
    if(busy || !APaccounts.isTeacher() || !file) return;
    const id = ++generation;
    reader?.abort(); candidate = null; retrySelection = null;
    $('apPublishSelected').hidden = true; $('apPublishReceipt').hidden = true;
    $('apPublishSend').disabled = true; $('apPublishSend').textContent = 'Publicar para Android e iPhone';
    status(''); progress('read',0,typeof file === 'string' ? null : file.size);
    try {
      if(file.size > maxBytes) throw Error('O pacote ultrapassa 24 MB.');
      const bytes = typeof file === 'string' ? encoder.encode(file) : await read(file,id);
      if(!active(id)) return;
      if(!bytes.length || bytes.length > maxBytes) throw Error('Escolha um arquivo completo de até 24 MB.');
      let bundle;
      try { bundle = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); }
      catch { throw Error('O arquivo está incompleto ou não contém JSON válido.'); }
      if(bundle?.format!==1 || bundle.appId!=='com.tiagolima.agendapersonal' || bundle.bridgeVersion!==3 || bundle.dataSchema!==4 || !Number.isSafeInteger(bundle.sequence) || bundle.sequence<99 || bundle.sequence>2147483647 || !/^\d+\.\d+\.\d+$/.test(bundle.version||'') || Object.keys(bundle.files || {}).length!==4 || pages.some(name => typeof bundle.files[name]!=='string' || !bundle.files[name].toLowerCase().includes('</html>') || (name!=='cadastro.html' && !bundle.files[name].includes('data-agenda-ready')) || bundle.files[name].includes('window.__agendaNativeReleaseToken'+'='))) throw Error('Escolha o pacote completo do Agenda Personal com as quatro telas.');
      progress('signature');
      // A patch composed locally keeps its original requirement to match the active and published base.
      if (base === null || Object.hasOwn(bundle, 'agendaSignature')) await checkSignature(bundle);
      const hash = hex(await sha256(bytes));
      if(!active(id)) return;
      candidate = {bytes,hash,version:bundle.version,sequence:bundle.sequence,base,attempted:false};
      progress('ready');
      $('apPublishSelected').textContent = `Versão ${bundle.version} · sequência ${bundle.sequence} · ${bytes.length.toLocaleString('pt-BR')} bytes`;
      $('apPublishSelected').hidden = false;
    } catch(error) {
      if(!active(id)) return;
      retrySelection = base === null ? () => $('apPublishFile').click() : () => select(file,base);
      fail(error);
    } finally { if(active(id)) lock(false); }
  }
  async function manifest() {
    const response = await fetch('/api/manifest?verify='+Date.now(),{cache:'no-store',signal:globalThis.AbortSignal?.timeout?.(20000)});
    if(!response.ok) throw Error('O servidor não respondeu à consulta de versão.');
    return response.json();
  }
  function matches(m, file) {
    return m?.available === true && m.version===file.version && m.sequence===file.sequence && m.sha256===file.hash && m.size===file.bytes.length;
  }
  async function checkPatchBase(file, current) {
    if (APWebPlatform.getPublishableUpdate() !== file.base) {
      throw Error('O conteúdo em uso mudou. Prepare a correção novamente.');
    }
    const release = current || await manifest();
    const baseHash = hex(await sha256(encoder.encode(file.base)));
    if (release?.available !== true || release.sequence !== file.sequence - 1 || release.sha256 !== baseHash) {
      throw Error('O conteúdo publicado mudou. Atualize este aparelho e prepare a correção novamente.');
    }
  }
  function upload(file, token) {
    return new Promise((resolve,reject) => {
      const request = new XMLHttpRequest(); transfer = request;
      request.open('POST','/api/publish'); request.timeout = 600000;
      request.setRequestHeader('Content-Type','application/json'); request.setRequestHeader('Authorization','Bearer '+token);
      request.setRequestHeader('X-Release-Notes',encodeURIComponent($('apPublishNotes').value.trim()));
      progress('upload',0,file.bytes.length);
      request.upload.onprogress = e => { if(e.lengthComputable && e.total>0 && e.loaded>=e.total) progress('confirm'); else progress('upload',e.loaded,e.lengthComputable ? e.total : null); };
      request.upload.onload = () => progress('confirm');
      request.onerror = () => reject(Error('A conexão caiu. Tente de novo para conferir o servidor antes de reenviar.'));
      request.onabort = () => reject(Error('Envio interrompido.'));
      request.ontimeout = () => reject(Error('O servidor demorou a responder.'));
      request.onloadend = () => { if(transfer === request) transfer = null; };
      request.onload = () => {
        try {
          const response = JSON.parse(request.responseText);
          if(request.status<200 || request.status>=300 || !response.published) throw Error(response.error || 'Publicação recusada pelo servidor.');
          if(!matches(response.manifest,file)) throw Error('O servidor respondeu com um arquivo diferente.');
          resolve();
        } catch(error) { reject(error instanceof SyntaxError ? Error('O servidor não confirmou o envio.') : error); }
      };
      file.attempted = true; request.send(file.bytes);
    });
  }
  function receipt(file, remote) {
    const node = $('apPublishReceipt'); node.replaceChildren();
    const installed = JSON.parse(APWebPlatform.getUpdateStatus());
    const timestamp = value => new Intl.DateTimeFormat('pt-BR', {dateStyle:'short',timeStyle:'medium'}).format(value);
    const when = Number.isFinite(Date.parse(remote.publishedAt)) ? timestamp(new Date(remote.publishedAt)) : 'horário não informado';
    for(const line of ['Recibo da publicação',`Arquivo enviado: ${file.version} · sequência ${file.sequence}`,`Disponível no servidor: ${remote.version} · sequência ${remote.sequence}`,`Em uso neste aparelho: ${installed.installedVersion || 'indisponível'}${installed.installedVersion ? ' · sequência '+installed.installedSequence : ''}`,`Publicado: ${when}`,`Conferido neste aparelho: ${timestamp(new Date())}`]) {
      const row = document.createElement(node.childElementCount ? 'p' : 'strong'); row.textContent = line; node.append(row);
    }
    node.hidden = false;
  }
  async function send() {
    if(busy || !APaccounts.isTeacher()) return false;
    if(retrySelection) { retrySelection(); return false; }
    if(!candidate) return false;
    const id = generation, file = candidate;
    lock(true); status('');
    try {
      let remote;
      if(file.attempted) {progress('confirm'); remote = await manifest();}
      if(!active(id)) return false;
      if(!matches(remote,file)) {
        progress('authorize');
        if (file.base !== null) await checkPatchBase(file,remote);
        if(!active(id)) return false;
        let timer;
        const timeout = new Promise((_,reject) => { timer = setTimeout(() => reject(Error('A sessão do professor demorou a responder.')), 20000); });
        const token = await Promise.race([APaccounts.getPublicationToken(),timeout]).finally(() => clearTimeout(timer));
        if(!active(id)) return false;
        await upload(file,token);
        if(!active(id)) return false;
        progress('confirm'); remote = await manifest();
        if(!matches(remote,file)) throw Error('O manifesto disponível aos alunos ainda não confirma este arquivo.');
      }
      if(!active(id)) return false;
      receipt(file,remote); progress('done',file.bytes.length,file.bytes.length);
      status('Publicação confirmada.','success'); candidate = null;
      $('apPublishSend').textContent = 'Publicar para Android e iPhone';
      $('apPublishReceipt').scrollIntoView?.({block:'end'});
      window.dispatchEvent(new Event('ap-central-sync'));
      if(original.canInstall()) Promise.resolve().then(() => APWebPlatform.applyPublishedUpdate(JSON.stringify(remote))).catch(() => {});
      return true;
    } catch(error) { if(active(id)) fail(error); return false; }
    finally { if(active(id)) lock(false); }
  }
  function close() {
    if(!panel) return original.closePublisher();
    if(busy) {status('Aguarde o envio terminar.'); return false;}
    ++generation; reader?.abort(); panel.remove(); panel = null; candidate = retrySelection = null;
    focusBefore?.focus(); return true;
  }
  function open() {
    if(!APaccounts.isTeacher()) {window.toast?.('Entre como professor para publicar atualizações.'); return false;}
    if(panel) return true;
    const previous = $('apUpdatePublisher');
    if(previous) { if(!previous.hidden && !original.closePublisher()) return false; previous.remove(); }
    ++generation; stage = ''; focusBefore = document.activeElement;
    panel = document.createElement('div'); panel.id = 'apUpdatePublisher'; panel.className = 'ap-update-publisher';
    panel.innerHTML = panelMarkup; document.body.append(panel);
    $('apPublishClose').onclick = close; $('apPublishCurrent').onclick = () => {
      const raw = APWebPlatform.getPublishableUpdate();
      if(raw) return select(raw);
      status('A versão em uso está indisponível. Escolha o arquivo assinado.','error');
    };
    $('apPublishFile').onchange = e => { const file = e.target.files[0]; e.target.value = ''; return select(file); };
    $('apPublishSend').onclick = send;
    panel.onclick = e => { if(e.target===panel) close(); };
    $('apPublishCurrent').focus({preventScroll:true}); return true;
  }
  window.APupdates = Object.freeze({...original,openPublisher:open,closePublisher:close,
    openPrepared(text,base) {
      if(busy || typeof base !== 'string' || !base || !open()) return false;
      void select(text,base);
      return true;
    }
  });
  window.addEventListener('ap-account-changed',() => {
    if(panel && !APaccounts.isTeacher()) {transfer?.abort(); busy=false; close();}
  });
})();
