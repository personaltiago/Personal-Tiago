import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function element() {
  const attributes = new Map();
  return {
    children: [],
    append(...children) { this.children.push(...children); },
    after(next) { this.next = next; },
    getAttribute(key) { return attributes.get(key); },
    setAttribute(key, value) { attributes.set(key, value); },
    toggleAttribute(key, value) { if (value) attributes.set(key, ''); else attributes.delete(key); }
  };
}

const teacherUid = 'teacher-fixture';
const bell = element(), heading = element();
bell.setAttribute('aria-label', 'Abrir avisos e atualizações');
const win = new EventTarget();
const doc = new EventTarget();
Object.assign(doc, {
  querySelector: selector => selector === '.header-notifications' ? bell : heading,
  createElement: element
});
let authChange, contactsOpen, tabOpen, pending, detachCount = 0;
const auth = { currentUser: null };
const sdk = {
  auth, db: {},
  collection: (_, name) => name,
  query: (...parts) => parts,
  where: (...parts) => parts,
  onAuthStateChanged: (_, callback) => { authChange = callback; callback(); return () => { authChange = null; }; },
  onSnapshot(query, callback) {
    assert.equal(query[0], 'usuarios');
    assert.deepEqual(query.slice(1), [['professorId', '==', teacherUid], ['perfil', '==', 'aluno'], ['ativo', '==', false]]);
    pending = callback;
    return () => { detachCount++; pending = null; };
  }
};
Object.assign(win, {
  agendaRegistration: { teacher: teacherUid, registrationSdk: async () => sdk },
  openRegistrationLink: () => { contactsOpen = true; },
  setRegistrationTab: tab => { tabOpen = tab; }
});
const state = {};
runInNewContext(readFileSync(new URL('../web/registration-notices.js', import.meta.url), 'utf8'), { document: doc, window: win, state, console });
await new Promise(resolve => setImmediate(resolve));
const [badge] = bell.children;
const card = heading.next;
assert.equal(pending, undefined);
assert.equal(badge.hidden, true);
auth.currentUser = { uid: teacherUid };
authChange();
pending({ docs: [{ id: 'one' }, { id: 'two' }] });
assert.equal(badge.textContent, '2');
assert.equal(card.children[0].textContent, '2 alunos aguardando aprovação');
card.children[1].onclick();
assert.equal(contactsOpen, true);
assert.equal(tabOpen, 'contacts');

state.registrationContactsHidden = { [teacherUid + ':two']: true };
doc.dispatchEvent(new Event('ap-registration-contacts-change'));
assert.equal(badge.textContent, '1');
assert.match(bell.getAttribute('aria-label'), /1 aluno aguardando aprovação/);
pending({ docs: [{ id: 'two' }] });
assert.equal(badge.hidden, true);
assert.equal(card.hidden, true);
assert.equal(bell.getAttribute('aria-label'), 'Abrir avisos e atualizações');

auth.currentUser = { uid: 'student' };
authChange();
assert.equal(detachCount, 1);
assert.equal(pending, null);

auth.currentUser = { uid: teacherUid };
authChange();
pending({ docs: [{ id: 'fresh' }] });
assert.equal(badge.textContent, '1');
win.dispatchEvent(new Event('pagehide'));
assert.equal(detachCount, 2);
assert.equal(authChange, null);
assert.equal(badge.hidden, true);
console.log('PASS: autenticação, cadastro em tempo real, abertura dos contatos, exclusão da lista, aprovação e limpeza da conexão.');

const boot = readFileSync(new URL('../web/boot.js', import.meta.url), 'utf8');
const bundle = process.env.AGENDA_WEB_BUNDLE
  ? JSON.parse(readFileSync(process.env.AGENDA_WEB_BUNDLE, 'utf8'))
  : { files: { 'professor.html': '<html><head></head><body><script data-agenda-registration>function T(){\n const list=c("registrationContactsList");}window.agendaRegistration=Object.freeze({teacher:e})})();</script></body></html>' } };
const context = { current: { bundle }, NAMES: Object.keys(bundle.files), location: { origin: 'https://agenda.example.test' } };
runInNewContext(boot.slice(boot.indexOf('function page(name){'), boot.indexOf('function show(record){')), context);
const adapted = context.page('professor.html');
assert.match(adapted, /registrationSdk:A/);
assert.match(adapted, /dispatchEvent\(new Event\("ap-registration-contacts-change"\)\)/);
assert.match(adapted, /<script data-agenda-registration-notices src="\/app\/registration-notices.js"><\/script>/);
assert.match(adapted, /href="\/app\/registration-notices.css"/);
assert.doesNotMatch(bundle.files['professor.html'], /registration-notices\.js/);
console.log('PASS: integração no HTML do professor, preservando o pacote armazenado.');
