/* Agenda Teste — modo de teste local (só existe no APK de teste, nunca no app oficial).
 * - Bloqueia toda conexão externa da tela (fetch, XHR, WebSocket, EventSource, sendBeacon).
 *   A política CSP "connect-src" injetada junto reforça o bloqueio no próprio navegador.
 * - Na tela principal, troca o carregador do Firebase por um Firebase falso e local:
 *   o professor fictício entra sozinho, nenhum dado vai ou vem do Firebase de produção,
 *   e toda leitura/gravação remota falha com "sincronização desativada".
 * - O código de backup, recuperação e modo telefone do app não é alterado.
 */
(function () {
  'use strict';
  if (window.__AP_MODO_TESTE) return;
  window.__AP_MODO_TESTE = true;
  var AVISO = 'Modo teste: sincronização e rede externa desativadas.';
  function permitido(u) {
    try {
      var x = new URL(String(u), location.href);
      return x.protocol === 'data:' || x.protocol === 'blob:' || x.origin === location.origin;
    } catch (_) { return false; }
  }
  function erro() { var e = new Error(AVISO); e.code = 'unavailable'; return e; }
  function recusa() { return Promise.reject(erro()); }
  window.__AP_MODO_TESTE_BLOQUEIOS = [];
  function registra(u) { try { window.__AP_MODO_TESTE_BLOQUEIOS.push(String(u).slice(0, 200)); } catch (_) {} }

  // 1. Rede externa desligada nesta tela.
  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function (entrada) {
      var u = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || String(entrada);
      if (!permitido(u)) { registra(u); return recusa(); }
      return originalFetch.apply(this, arguments);
    };
  }
  if (window.XMLHttpRequest) {
    var abrir = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (metodo, u) {
      if (!permitido(u)) { registra(u); throw erro(); }
      return abrir.apply(this, arguments);
    };
  }
  if (window.WebSocket) window.WebSocket = function (u) { registra(u); throw erro(); };
  if (window.EventSource) window.EventSource = function (u) { registra(u); throw erro(); };
  if (navigator.sendBeacon) navigator.sendBeacon = function (u) { registra(u); return false; };

  if (window.top !== window) return;

  // 2. Firebase falso e local (só na tela principal, que é quem carrega o Firebase).
  var EMAIL = 'professor.ficticio@teste.invalid';
  function professorUid() {
    try { if (window.APStudentModel && APStudentModel.TEACHER) return APStudentModel.TEACHER; } catch (_) {}
    return 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1';
  }
  var apps = [];
  var auth = { name: '[DEFAULT]', currentUser: null, authStateReady: function () { return Promise.resolve(); } };
  var ouvintes = [];
  function entra() {
    auth.currentUser = {
      uid: professorUid(), email: EMAIL, displayName: 'Professor Fictício', isAnonymous: false, emailVerified: true,
      providerData: [], getIdToken: recusa, getIdTokenResult: recusa, reload: function () { return Promise.resolve(); }
    };
    return auth.currentUser;
  }
  function avisa() {
    ouvintes.slice().forEach(function (fn) { setTimeout(function () { try { fn(auth.currentUser); } catch (e) { console.error(e); } }, 0); });
  }
  function observa(_, cb) {
    var fn = typeof cb === 'function' ? cb : cb && cb.next;
    if (typeof fn !== 'function') return function () {};
    ouvintes.push(fn);
    setTimeout(function () { try { fn(auth.currentUser); } catch (e) { console.error(e); } }, 0);
    return function () { ouvintes = ouvintes.filter(function (x) { return x !== fn; }); };
  }
  function login() { entra(); avisa(); return Promise.resolve({ user: auth.currentUser }); }
  var appModulo = {
    getApps: function () { return apps; },
    getApp: function () { return apps[0]; },
    initializeApp: function (opcoes, nome) { var a = { name: nome || '[DEFAULT]', options: opcoes || {} }; apps.push(a); return a; }
  };
  function Provedor() {}
  Provedor.credential = function () { return {}; };
  var authModulo = {
    getAuth: function () { if (!auth.currentUser) entra(); return auth; },
    onAuthStateChanged: observa, onIdTokenChanged: observa,
    signOut: function () { auth.currentUser = null; avisa(); return Promise.resolve(); },
    signInWithEmailAndPassword: login, signInWithCredential: login, signInWithPopup: login,
    sendPasswordResetEmail: recusa, createUserWithEmailAndPassword: recusa,
    setPersistence: function () { return Promise.resolve(); },
    browserLocalPersistence: { type: 'LOCAL' }, browserSessionPersistence: { type: 'SESSION' },
    indexedDBLocalPersistence: { type: 'LOCAL' }, inMemoryPersistence: { type: 'NONE' },
    browserPopupRedirectResolver: {}, GoogleAuthProvider: Provedor
  };
  function ref() {
    var partes = Array.prototype.filter.call(arguments, function (x) { return typeof x === 'string'; });
    return { path: partes.join('/'), id: partes[partes.length - 1] || '' };
  }
  function vazio() { return {}; }
  var firestoreModulo = {
    getFirestore: function () { return { tipo: 'firestore-teste' }; },
    initializeFirestore: function () { return { tipo: 'firestore-teste' }; },
    doc: ref, collection: ref, query: function (q) { return q; }, where: vazio, orderBy: vazio, limit: vazio,
    endAt: vazio, documentId: function () { return '__name__'; }, count: vazio, sum: vazio, or: vazio, and: vazio,
    getDoc: recusa, getDocs: recusa, setDoc: recusa, updateDoc: recusa, deleteDoc: recusa, addDoc: recusa,
    runTransaction: recusa, getCountFromServer: recusa, getAggregateFromServer: recusa,
    writeBatch: function () { var b = { set: function () { return b; }, update: function () { return b; }, delete: function () { return b; }, commit: recusa }; return b; },
    onSnapshot: function (_, a, b) {
      var falha = typeof b === 'function' ? b : a && a.error;
      setTimeout(function () { try { if (falha) falha(erro()); } catch (_) {} }, 0);
      return function () {};
    },
    serverTimestamp: function () { return { modoTeste: 'serverTimestamp' }; },
    arrayUnion: vazio, arrayRemove: vazio, deleteField: vazio, increment: vazio,
    Timestamp: { now: function () { return { toMillis: function () { return Date.now(); } }; } }
  };
  var sdk = Promise.resolve([appModulo, authModulo, firestoreModulo]);
  Object.defineProperty(window, 'APloadFirebase', {
    configurable: false, enumerable: true,
    get: function () { return function () { return sdk; }; },
    set: function () {}
  });

  // 3. Sem login Google: o login nativo do Google fala com o Firebase de produção.
  window.addEventListener('click', function (ev) {
    var alvo = ev.target && ev.target.closest && ev.target.closest('#apGoogleAccess');
    if (!alvo) return;
    ev.preventDefault(); ev.stopImmediatePropagation(); ev.stopPropagation();
    var s = document.getElementById('apGoogleStatus');
    if (s) { s.hidden = false; s.textContent = 'Modo teste: entre com qualquer e-mail e senha (professor fictício).'; }
  }, true);
  var estilo = document.createElement('style');
  estilo.textContent = '#apGoogleAccess{display:none!important}';
  (document.head || document.documentElement).appendChild(estilo);

  // 4. Aviso visível de que este é o app de teste.
  function faixa() {
    if (!document.body || document.getElementById('apModoTesteFaixa')) return;
    var f = document.createElement('div');
    f.id = 'apModoTesteFaixa';
    f.textContent = 'AGENDA TESTE';
    f.title = 'Professor fictício · sem sincronização';
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;left:4px;top:calc(env(safe-area-inset-top,0px) + 2px);z-index:2147483646;white-space:nowrap;' +
      'pointer-events:none;padding:1px 7px;border-radius:999px;background:#c2410c;color:#fff;font:700 10px/1.4 system-ui,sans-serif;opacity:.9';
    document.body.appendChild(f);
  }
  if (document.body) faixa(); else document.addEventListener('DOMContentLoaded', faixa, { once: true });
})();
