"use strict";

const {readFileSync} = require("node:fs");
const {resolve} = require("node:path");
const {after, before, beforeEach, test} = require("node:test");
const {equal} = require("node:assert/strict");
const {initializeTestEnvironment, assertFails, assertSucceeds} = require("@firebase/rules-unit-testing");
const {
  collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where
} = require("firebase/firestore");

const fragment = readFileSync(resolve(__dirname, "../../firebase/mural-da-turma.rules"), "utf8");
const rules = [
  "rules_version = '2';",
  "service cloud.firestore {",
  "  match /databases/{database}/documents {",
  "    function professorUid() { return 'professor-teste'; }",
  "    function isProfessor() { return request.auth != null && request.auth.uid == professorUid(); }",
  fragment,
  "  }",
  "}"
].join("\n");

const professor = "professor-teste";
const aluna = "aluna-teste";
const colega = "colega-teste";
const pendente = "pendente-teste";
const visitante = "outra-turma";
const turma = ["muralTurmas", professor, "publicacoes"];
let env;

const db = uid => uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
const texto = (uid = aluna, nome = "Aluna Teste") => ({
  autorId: uid, autorNome: nome, texto: "Hoje terminei a última série.",
  criadoEm: serverTimestamp(), visivel: true
});
const post = (store, ...tail) => doc(store, ...turma, "treino-teste", ...tail);
const publicacoes = store => query(collection(store, ...turma), where("visivel", "==", true));

before(async () => {
  env = await initializeTestEnvironment({projectId: "demo-agenda-mural", firestore: {rules}});
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const store = context.firestore();
    const contas = [
      [aluna, "Aluna Teste", true, professor],
      [colega, "Colega Teste", true, professor],
      [pendente, "Conta Pendente", false, professor],
      [visitante, "Conta Visitante", true, "outro-professor"]
    ];
    await Promise.all(contas.map(([uid, nome, ativo, professorId]) =>
      setDoc(doc(store, "usuarios", uid), {nome, ativo, professorId, perfil: "aluno"})));
  });
});

after(async () => { await env?.cleanup(); });

test("Aluno aprovado publica texto e a turma e seu professor leem a publicação", async () => {
  await assertSucceeds(setDoc(post(db(aluna)), texto()));
  const feed = await assertSucceeds(getDocs(publicacoes(db(colega))));
  equal(feed.size, 1);
  equal(feed.docs[0].data().texto, texto().texto);
  await assertSucceeds(getDoc(post(db(professor))));
  await assertFails(getDocs(collection(db(colega), ...turma)));
});

test("Convidado, pendente e aluno de outra turma não conseguem ler nem publicar", async () => {
  await setDoc(post(db(aluna)), texto());
  for (const uid of [undefined, pendente, visitante]) {
    const store = db(uid);
    await assertFails(getDoc(post(store)));
    await assertFails(getDocs(publicacoes(store)));
    await assertFails(setDoc(doc(store, ...turma, "negado"), texto(uid, "Conta de Teste")));
  }
  const store = db(aluna);
  await assertFails(getDocs(query(collection(store, "muralTurmas", "outro-professor", "publicacoes"),
    where("visivel", "==", true))));
});

test("Aluno envia texto com sua autoria e o formato não admite campos extras", async () => {
  const store = db(aluna);
  for (const payload of [
    texto(colega, "Colega Teste"),
    {...texto(), autorNome: "Nome de outra pessoa"},
    {...texto(), intensidade: "Alta"},
    {...texto(), treinoId: "registro-local"},
    {...texto(), texto: ""},
    {...texto(), texto: "a".repeat(2001)}
  ]) await assertFails(setDoc(post(store), payload));
});

test("Colega comenta e só controla a própria curtida", async () => {
  await setDoc(post(db(aluna)), texto());
  const store = db(colega);
  const comment = post(store, "comentarios", "comentario-teste");
  await assertSucceeds(setDoc(comment, texto(colega, "Colega Teste")));
  const comments = query(collection(post(db(aluna)), "comentarios"), where("visivel", "==", true));
  equal((await assertSucceeds(getDocs(comments))).size, 1);
  await assertFails(getDoc(post(db(visitante), "comentarios", "comentario-teste")));
  const like = post(store, "curtidas", colega);
  await assertSucceeds(setDoc(like, {ativo: true}));
  await assertFails(setDoc(post(store, "curtidas", aluna), {ativo: true}));
  const likes = query(collection(post(db(aluna)), "curtidas"), where("ativo", "==", true));
  equal((await assertSucceeds(getDocs(likes))).size, 1);
  await assertSucceeds(setDoc(like, {ativo: false}));
  equal((await assertSucceeds(getDocs(likes))).size, 0);
});

test("Revogação do cadastro retira o acesso ainda com a conta autenticada", async () => {
  await setDoc(post(db(aluna)), texto());
  const store = db(colega);
  await assertSucceeds(getDoc(post(store)));
  await env.withSecurityRulesDisabled(context =>
    updateDoc(doc(context.firestore(), "usuarios", colega), {ativo: false}));
  await assertFails(getDoc(post(store)));
  await assertFails(setDoc(post(store, "curtidas", colega), {ativo: true}));
});

test("Autor ou professor podem remover texto e os dados do post oculto ficam inacessíveis", async () => {
  await setDoc(post(db(aluna)), texto());
  const fields = {visivel: false, texto: ""};
  const teacherStore = db(professor), other = db(colega);
  const ownStore = db(aluna);
  const ownPost = doc(ownStore, ...turma, "publicacao-do-autor");
  await setDoc(ownPost, texto());
  await assertSucceeds(updateDoc(ownPost, fields));
  await assertFails(getDoc(ownPost));
  await assertFails(updateDoc(post(other), fields));
  const comment = post(other, "comentarios", "comentario-teste");
  await setDoc(comment, texto(colega, "Colega Teste"));
  await assertSucceeds(updateDoc(comment, fields));
  await setDoc(post(other, "curtidas", colega), {ativo: true});
  await assertSucceeds(updateDoc(post(teacherStore), fields));
  await assertFails(getDoc(post(other)));
  await assertFails(getDoc(post(other, "curtidas", colega)));
  await assertFails(setDoc(post(other, "comentarios", "tardio"), texto(colega, "Colega Teste")));
  equal((await assertSucceeds(getDocs(publicacoes(other)))).size, 0);
});
