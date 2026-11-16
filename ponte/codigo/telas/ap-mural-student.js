(function (global) {
  "use strict";

  if (global.__AP_PUBLIC_REGISTER || global.APMural) return;

  const document = global.document;
  const postLimit = 2000;
  const commentLimit = 500;
  const active = {
    session: null, revision: 0, busy: false, ready: false, likesReady: false,
    liked: false, post: null, posts: new Map(), feed: null, detail: []
  };
  const byId = id => document.getElementById(id);
  const accounts = () => global.APaccounts;
  const isStudent = () => accounts()?.context()?.role === "student" && !accounts()?.isTeacher();
  let dialog;

  function status(text = "") {
    byId("apMuralStatus").textContent = text;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(text, action) {
    const node = element("button", "ap-mural-button", text);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }

  function controls() {
    const canWrite = active.ready && !active.busy && active.session?.role === "student";
    byId("apMuralNew").hidden = active.session?.role !== "student";
    for (const id of ["apMuralNew", "apMuralSend", "apMuralCommentSend"]) {
      byId(id).disabled = !canWrite;
    }
    byId("apMuralLike").disabled = !canWrite || !active.likesReady;
    for (const id of ["apMuralText", "apMuralComment", "apMuralCancel", "apMuralReturn"]) {
      byId(id).disabled = active.busy;
    }
  }

  function show(panel) {
    for (const name of ["Feed", "Composer", "Detail"]) byId("apMural" + name).hidden = panel !== name;
  }

  function unsubscribeDetail() {
    for (const end of active.detail) end();
    active.detail = [];
    active.post = null;
    active.likesReady = false;
    active.liked = false;
  }

  function cleanup() {
    active.revision++;
    active.feed?.();
    active.feed = null;
    unsubscribeDetail();
    active.session = null;
    active.posts = new Map();
    active.ready = false;
    active.busy = false;
    if (dialog) {
      byId("apMuralPosts").replaceChildren();
      byId("apMuralComments").replaceChildren();
      byId("apMuralPostContent").replaceChildren();
      byId("apMuralText").value = "";
      byId("apMuralComment").value = "";
      status();
    }
  }

  function close() {
    if (!dialog?.open) return false;
    cleanup();
    dialog.close();
    return true;
  }

  function backToFeed() {
    unsubscribeDetail();
    byId("apMuralComments").replaceChildren();
    byId("apMuralPostContent").replaceChildren();
    byId("apMuralText").value = "";
    byId("apMuralComment").value = "";
    show("Feed");
    status();
    byId("apMuralNew").focus();
  }

  function compose(comment = "") {
    unsubscribeDetail();
    byId("apMuralText").value = typeof comment === "string" ? comment.slice(0, postLimit) : "";
    show("Composer");
    status();
    byId("apMuralText").focus();
  }

  function build() {
    if (dialog) return;
    dialog = element("dialog", "ap-mural");
    dialog.id = "apMural";
    dialog.setAttribute("aria-labelledby", "apMuralTitle");
    dialog.innerHTML = '<header class="ap-mural-head"><h2 id="apMuralTitle">Mural da turma</h2><button type="button" class="ap-mural-button ap-mural-close" id="apMuralClose" aria-label="Fechar mural">×</button></header>'
      + '<p id="apMuralStatus" class="ap-mural-status" role="status"></p>'
      + '<section id="apMuralFeed"><button type="button" id="apMuralNew" class="ap-mural-button ap-mural-primary">Nova publicação</button><div id="apMuralPosts"></div></section>'
      + '<section id="apMuralComposer" hidden><h3>Compartilhar no Mural</h3><p class="ap-mural-audience">Visível para sua turma</p>'
      + '<form id="apMuralPublish"><label for="apMuralText">O que você quer compartilhar?</label>'
      + '<textarea id="apMuralText" rows="5" maxlength="2000" required placeholder="Escreva sobre seu treino."></textarea>'
      + '<div class="ap-mural-actions"><button type="button" class="ap-mural-button" id="apMuralCancel">Cancelar</button><button type="submit" class="ap-mural-button ap-mural-primary" id="apMuralSend">Publicar</button></div></form></section>'
      + '<section id="apMuralDetail" hidden><button type="button" id="apMuralReturn" class="ap-mural-button">Voltar ao mural</button><div id="apMuralPostContent"></div>'
      + '<div class="ap-mural-actions"><button type="button" id="apMuralLike" class="ap-mural-button" aria-pressed="false">Curtir</button><span id="apMuralLikeCount"></span></div>'
      + '<h3>Comentários</h3><div id="apMuralComments"></div><form id="apMuralReply"><label for="apMuralComment">Seu comentário</label>'
      + '<textarea id="apMuralComment" rows="3" maxlength="500" required></textarea><button type="submit" id="apMuralCommentSend" class="ap-mural-button ap-mural-primary">Comentar</button></form></section>';
    document.body.appendChild(dialog);

    byId("apMuralClose").addEventListener("click", close);
    dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
    dialog.addEventListener("close", () => { if (!dialog.open && active.session) cleanup(); });
    byId("apMuralNew").addEventListener("click", () => compose());
    byId("apMuralCancel").addEventListener("click", backToFeed);
    byId("apMuralReturn").addEventListener("click", backToFeed);
    byId("apMuralPublish").addEventListener("submit", publish);
    byId("apMuralReply").addEventListener("submit", reply);
    byId("apMuralLike").addEventListener("click", toggleLike);
  }

  function visibleContent(...tail) {
    const {sdk, professorId} = active.session;
    return sdk.query(sdk.collection(sdk.db, "muralTurmas", professorId, "publicacoes", ...tail), sdk.where("visivel", "==", true));
  }

  function ref(...tail) {
    const {sdk, professorId} = active.session;
    return sdk.doc(sdk.db, "muralTurmas", professorId, "publicacoes", ...tail);
  }

  function list(snapshot, newestFirst) {
    const rows = snapshot.docs.filter(doc => !doc.metadata?.hasPendingWrites).map(doc => ({...doc.data(), id: doc.id}));
    const milliseconds = entry => entry.criadoEm?.toMillis?.() || 0;
    rows.sort((left, right) => (newestFirst ? -1 : 1) * (milliseconds(left) - milliseconds(right)));
    return rows;
  }

  function card(entry, postId, inFeed = false) {
    const node = element("article", "ap-mural-card");
    node.append(element("strong", "", entry.autorNome), element("p", "ap-mural-copy", entry.texto));
    if (inFeed) node.append(button("Ver publicação", () => showPost(entry.id)));
    if (active.session.role === "teacher" || entry.autorId === active.session.uid) {
      node.append(button("Remover", () => {
        if (!active.busy && active.ready && global.confirm(postId ? "Remover este comentário?" : "Remover esta publicação?")) {
          remove(entry.id, postId);
        }
      }));
    }
    return node;
  }

  function renderFeed(rows) {
    const root = byId("apMuralPosts");
    root.replaceChildren(...(rows.length ? rows.map(entry => card(entry, null, true))
      : [element("p", "ap-mural-empty", "Ainda não há publicações na turma.")]));
  }

  function messageFor(error) {
    return String(error?.code || "").endsWith("permission-denied")
      ? "O mural está indisponível para esta conta."
      : "O mural não respondeu. Confira a conexão e tente de novo.";
  }

  function invalidFeed(message) {
    active.ready = false;
    active.posts = new Map();
    byId("apMuralPosts").replaceChildren();
    if (active.post) backToFeed();
    controls();
    status(message);
  }

  async function open(prefill) {
    if (!isStudent() && !accounts()?.isTeacher()) return false;
    if (typeof prefill === "string" && !isStudent()) return false;
    build();
    cleanup();
    const revision = active.revision;
    const valid = () => dialog.open && revision === active.revision;
    if (isStudent()) {
      const color = global.APStudentTheme?.color?.();
      if (color) dialog.style.setProperty("--mural-accent", color);
    } else {
      dialog.style.removeProperty("--mural-accent");
    }
    if (!dialog.open) dialog.showModal();
    if (typeof prefill === "string") compose(prefill);
    else show("Feed");
    controls();
    status("Carregando publicações…");

    try {
      const session = await accounts().muralSdk();
      if (!valid()) return false;
      active.session = session;
      active.feed = session.sdk.onSnapshot(visibleContent(), {includeMetadataChanges: true}, snapshot => {
        if (!valid()) return;
        if (snapshot.metadata.fromCache) {
          invalidFeed("Conecte-se para abrir o mural.");
          return;
        }
        const waiting = !active.ready;
        const rows = list(snapshot, true);
        active.ready = true;
        active.posts = new Map(rows.map(entry => [entry.id, entry]));
        if (active.post && !active.posts.has(active.post)) backToFeed();
        renderFeed(rows);
        controls();
        if (waiting) status();
      }, error => { if (valid()) invalidFeed(messageFor(error)); });
      return true;
    } catch (error) {
      if (valid()) invalidFeed(messageFor(error));
      return false;
    }
  }

  function showPost(id) {
    if (!active.ready || active.busy || !active.posts.has(id)) return;
    unsubscribeDetail();
    active.post = id;
    const {session, revision} = active, {sdk, uid, role} = session;
    const valid = () => dialog.open && revision === active.revision && active.post === id && active.ready;
    const error = problem => { if (valid()) status(messageFor(problem)); };
    byId("apMuralPostContent").replaceChildren(card(active.posts.get(id), null));
    byId("apMuralComments").replaceChildren();
    byId("apMuralLikeCount").textContent = "";
    byId("apMuralComment").value = "";
    byId("apMuralLike").hidden = role !== "student";
    byId("apMuralLike").textContent = "Curtir";
    byId("apMuralLike").setAttribute("aria-pressed", "false");
    byId("apMuralReply").hidden = role !== "student";
    show("Detail");
    controls();
    status();
    byId("apMuralReturn").focus();
    active.detail.push(sdk.onSnapshot(visibleContent(id, "comentarios"), {includeMetadataChanges: true}, snapshot => {
      if (!valid() || snapshot.metadata.fromCache) return;
      const rows = list(snapshot, false);
      byId("apMuralComments").replaceChildren(...(rows.length ? rows.map(entry => card(entry, id))
        : [element("p", "ap-mural-empty", "Nenhum comentário ainda.")]));
    }, error));
    const likes = sdk.query(sdk.collection(ref(id), "curtidas"), sdk.where("ativo", "==", true));
    active.detail.push(sdk.onSnapshot(likes, {includeMetadataChanges: true}, snapshot => {
      if (!valid()) return;
      active.likesReady = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
      controls();
      if (!active.likesReady) return;
      const likes = snapshot.docs;
      const count = likes.length;
      active.liked = likes.some(doc => doc.id === uid);
      byId("apMuralLikeCount").textContent = count + (count === 1 ? " curtida" : " curtidas");
      byId("apMuralLike").textContent = active.liked ? "Descurtir" : "Curtir";
      byId("apMuralLike").setAttribute("aria-pressed", String(active.liked));
    }, problem => {
      if (!valid()) return;
      active.likesReady = false;
      controls();
      error(problem);
    }));
  }

  async function write(operation, success, studentOnly = true) {
    if (!active.ready || active.busy || (studentOnly && active.session.role !== "student")) return;
    if (global.navigator?.onLine === false) { status("Conecte-se para enviar."); return; }
    const revision = active.revision;
    active.busy = true;
    controls();
    status("Salvando…");
    try {
      await operation(active.session.sdk);
      if (revision === active.revision) success();
    } catch (error) {
      if (revision === active.revision) status(messageFor(error));
    } finally {
      if (revision === active.revision) {
        active.busy = false;
        controls();
      }
    }
  }

  function payload(sdk, text) {
    return {autorId: active.session.uid, autorNome: active.session.nome, texto: text, criadoEm: sdk.serverTimestamp(), visivel: true};
  }

  function publish(event) {
    event.preventDefault();
    const text = byId("apMuralText").value.trim();
    if (!text || text.length > postLimit) { status("Confira o texto da publicação."); return; }
    const target = global.crypto.randomUUID();
    return write(sdk => sdk.setDoc(ref(target), payload(sdk, text)), () => {
      byId("apMuralText").value = "";
      backToFeed();
      status("Publicado para sua turma.");
    });
  }

  function reply(event) {
    event.preventDefault();
    const text = byId("apMuralComment").value.trim();
    const post = active.post;
    if (!post || !text || text.length > commentLimit) { status("Confira o comentário."); return; }
    const id = global.crypto.randomUUID();
    return write(sdk => sdk.setDoc(ref(post, "comentarios", id), payload(sdk, text)), () => {
      if (post === active.post) byId("apMuralComment").value = "";
      status("Comentário enviado.");
    });
  }

  function toggleLike() {
    const post = active.post;
    if (!post || !active.likesReady) return;
    const liked = !active.liked;
    return write(sdk => sdk.setDoc(ref(post, "curtidas", active.session.uid), {ativo: liked}), () => {
      status();
    });
  }

  function remove(id, postId) {
    const path = postId ? [postId, "comentarios", id] : [id];
    return write(sdk => sdk.updateDoc(ref(...path), {visivel: false, texto: ""}), () => {
      if (!postId && active.post === id) backToFeed();
      status(postId ? "Comentário removido." : "Publicação removida.");
    }, false);
  }

  function decorate() {
    const home = byId("homeScroll");
    if (home) {
      let entry = byId("apMuralStudentEntry");
      if (!entry) {
        entry = button("Mural da turma", () => open());
        entry.id = "apMuralStudentEntry";
        entry.className = "ap-feedback-home ap-mural-entry";
        const today = home.querySelector(".home-today");
        if (today) today.after(entry);
        else home.append(entry);
      }
      entry.hidden = !isStudent();
    }
    const menu = byId("apTeacherMoreMenu");
    if (menu && !byId("apMuralTeacherEntry")) {
      const entry = button("Mural da turma", () => {
        menu.hidden = true;
        byId("apTeacherMoreToggle")?.setAttribute("aria-expanded", "false");
        open();
      });
      entry.id = "apMuralTeacherEntry";
      menu.append(entry);
    }
  }

  global.APMural = Object.freeze({open, share: text => open(typeof text === "string" ? text : "")});
  global.addEventListener("ap-account-changed", () => { close(); decorate(); });
  global.addEventListener("ap-student-ready", decorate);
  const originalBack = global.handleAgendaSystemBack;
  if (typeof originalBack === "function") {
    global.handleAgendaSystemBack = function (...args) {
      return close() || originalBack.apply(this, args);
    };
  }
  decorate();
})(window);
