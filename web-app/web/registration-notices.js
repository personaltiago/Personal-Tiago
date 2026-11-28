(function () {
  'use strict';

  const bell = document.querySelector('.header-notifications');
  const notices = document.querySelector('#screen-notices .module-heading');
  const registration = window.agendaRegistration;
  if (!bell || !notices || !registration) return;

  const teacherUid = registration.teacher;
  const originalLabel = bell.getAttribute('aria-label') || 'Abrir avisos e atualizações';
  const badge = document.createElement('span');
  badge.className = 'registration-notification-count';
  badge.setAttribute('aria-hidden', 'true');
  badge.hidden = true;
  bell.append(badge);

  const card = document.createElement('article');
  card.className = 'notice-update registration-notification-card';
  card.hidden = true;
  const title = document.createElement('h3');
  title.setAttribute('role', 'status');
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'btn';
  open.textContent = 'Ver cadastros';
  open.onclick = () => {
    window.openRegistrationLink();
    window.setRegistrationTab('contacts');
  };
  card.append(title, open);
  notices.after(card);

  let pendingIds = [];
  let sdk, stopAuth, stopPending;
  let connecting = false;
  let closed = false;

  function render() {
    const count = pendingIds.filter(uid => !state.registrationContactsHidden?.[teacherUid + ':' + uid]).length;
    const label = count === 1 ? '1 aluno aguardando aprovação' : count + ' alunos aguardando aprovação';
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.hidden = card.hidden = count === 0;
    title.textContent = count ? label : '';
    bell.toggleAttribute('data-registration-pending', count > 0);
    bell.setAttribute('aria-label', count ? originalLabel + '. ' + label : originalLabel);
  }

  function resetPending() {
    stopPending?.();
    stopPending = null;
    pendingIds = [];
    render();
  }

  function listen() {
    if (closed || !sdk) return;
    if (sdk.auth.currentUser?.uid !== teacherUid) {
      resetPending();
      return;
    }
    if (stopPending) return;

    const filters = sdk.query(sdk.collection(sdk.db, 'usuarios'),
      sdk.where('professorId', '==', teacherUid),
      sdk.where('perfil', '==', 'aluno'),
      sdk.where('ativo', '==', false));
    stopPending = sdk.onSnapshot(filters, snapshot => {
      if (closed || sdk.auth.currentUser?.uid !== teacherUid) return;
      pendingIds = snapshot.docs.map(doc => doc.id);
      render();
    }, error => {
      resetPending();
      console.warn('Não foi possível acompanhar novos cadastros.', error.code || error.message);
    });
  }

  async function start() {
    if (closed || connecting) return;
    if (sdk) {
      listen();
      return;
    }
    connecting = true;
    try {
      sdk = await registration.registrationSdk();
      if (!closed) stopAuth = sdk.onAuthStateChanged(sdk.auth, listen);
    } catch (error) {
      console.warn('Cadastro online indisponível no sininho.', error.code || error.message);
    } finally {
      connecting = false;
    }
  }

  document.addEventListener('ap-registration-contacts-change', render);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      render();
      void start();
    }
  });
  window.addEventListener('online', start);
  window.addEventListener('pagehide', () => {
    closed = true;
    stopAuth?.();
    stopAuth = null;
    resetPending();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    closed = false;
    sdk = null;
    void start();
  });
  void start();
})();
