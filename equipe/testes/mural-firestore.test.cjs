"use strict";

// Regras do mural: 1 publicação por aluno por dia e 10 comentários por aluno por dia.
// O dia é o dia em UTC. O teste só oscila se rodar exatamente na virada do dia UTC.

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
let env;

const dia = (data = new Date()) => data.toISOString().slice(0, 10).replace(/-/g, "");
const hoje = () => dia();
const ontem = () => dia(new Date(Date.now() - 864e5));
const db = uid => uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
const nomeDe = uid => ({[aluna]: "Aluna Teste", [colega]: "Colega Teste"}[uid] || "Conta de Teste");
const texto = (uid = aluna, nome = nomeDe(uid)) => ({
  autorId: uid, autorNome: nome, texto: "Hoje terminei a última série.", criadoEm: serverTimestamp(), visivel: true
});
const comentarioDe = (uid, publicacaoId, extra = {}) => ({
  ...texto(uid), texto: "Boa!", publicacaoId, dia: hoje(), ...extra
});
const idPost = (uid, quando = hoje()) => `${uid}_${quando}`;
const postRef = (store, uid, quando) => doc(store, "muralTurmas", professor, "publicacoes", idPost(uid, quando));
const vaga = (store, uid, n, quando = hoje()) =>
  doc(store, "muralTurmas", professor, "comentarios", `${uid}_${quando}_${n}`);
const publicar = uid => assertSucceeds(setDoc(postRef(db(uid), uid), texto(uid)));
const feed = store => query(collection(store, "muralTurmas", professor, "publicacoes"), where("visivel", "==", true));
const comentariosDe = (store, publicacaoId) => query(collection(store, "muralTurmas", professor, "comentarios"),
  where("publicacaoId", "==", publicacaoId), where("visivel", "==", true));
const remocao = {visivel: false, texto: ""};

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

test("Aluno aprovado publica e a turma e o professor leem; fora da turma não lê", async () => {
  await publicar(aluna);
  const lista = await assertSucceeds(getDocs(feed(db(colega))));
  equal(lista.size, 1);
  equal(lista.docs[0].id, idPost(aluna));
  await assertSucceeds(getDoc(postRef(db(professor), aluna)));
  await assertFails(getDocs(collection(db(colega), "muralTurmas", professor, "publicacoes")));
  for (const uid of [undefined, pendente, visitante]) {
    await assertFails(getDoc(postRef(db(uid), aluna)));
    await assertFails(getDocs(feed(db(uid))));
    await assertFails(setDoc(postRef(db(uid), uid || "anonimo"), texto(uid || "anonimo", "Conta de Teste")));
  }
  await assertFails(getDocs(query(collection(db(aluna), "muralTurmas", "outro-professor", "publicacoes"),
    where("visivel", "==", true))));
});

test("Publicação exige o próprio código do dia, autoria correta e formato fechado", async () => {
  const store = db(aluna);
  for (const alvo of [
    doc(store, "muralTurmas", professor, "publicacoes", "treino-aleatorio"),
    postRef(store, colega),
    postRef(store, aluna, ontem()),
    postRef(store, aluna, "20300101")
  ]) await assertFails(setDoc(alvo, texto()));
  for (const payload of [
    texto(colega, "Colega Teste"),
    {...texto(), autorNome: "Nome de outra pessoa"},
    {...texto(), intensidade: "Alta"},
    {...texto(), texto: ""},
    {...texto(), texto: "a".repeat(2001)},
    {...texto(), visivel: false}
  ]) await assertFails(setDoc(postRef(store, aluna), payload));
  await assertSucceeds(setDoc(postRef(store, aluna), {...texto(), texto: "a".repeat(2000)}));
});

test("Só uma publicação por dia; apagar a publicação não devolve o dia", async () => {
  await publicar(aluna);
  await assertFails(setDoc(postRef(db(aluna), aluna), texto()));
  await assertFails(updateDoc(postRef(db(aluna), aluna), {texto: "Editado"}));
  await assertSucceeds(updateDoc(postRef(db(aluna), aluna), remocao));
  await assertFails(setDoc(postRef(db(aluna), aluna), texto()));
  await assertSucceeds(setDoc(postRef(db(colega), colega), texto(colega)));
});

test("Comentar exige a publicação de hoje; a de ontem ou a oculta não vale", async () => {
  await publicar(colega);
  const store = db(aluna);
  await assertFails(setDoc(vaga(store, aluna, 1), comentarioDe(aluna, idPost(colega))));
  await env.withSecurityRulesDisabled(context => setDoc(postRef(context.firestore(), aluna, ontem()), {
    ...texto(), criadoEm: new Date(Date.now() - 864e5)
  }));
  await assertFails(setDoc(vaga(store, aluna, 1), comentarioDe(aluna, idPost(colega))));
  await publicar(aluna);
  await assertSucceeds(setDoc(vaga(store, aluna, 1), comentarioDe(aluna, idPost(colega))));
  await assertSucceeds(updateDoc(postRef(db(professor), aluna), remocao));
  await assertFails(setDoc(vaga(store, aluna, 2), comentarioDe(aluna, idPost(colega))));
});

test("Dez comentários por dia somando todas as publicações; o 11º e a reutilização falham", async () => {
  await publicar(aluna);
  await publicar(colega);
  const store = db(aluna);
  for (let n = 1; n <= 10; n++) {
    const alvo = n % 2 ? idPost(aluna) : idPost(colega);
    await assertSucceeds(setDoc(vaga(store, aluna, n), comentarioDe(aluna, alvo)));
  }
  await assertFails(setDoc(vaga(store, aluna, 11), comentarioDe(aluna, idPost(aluna))));
  await assertFails(setDoc(vaga(store, aluna, 0), comentarioDe(aluna, idPost(aluna))));
  await assertFails(setDoc(vaga(store, aluna, 1), comentarioDe(aluna, idPost(aluna), {texto: "Outra vez"})));
  await assertSucceeds(updateDoc(vaga(store, aluna, 1), remocao));
  await assertFails(setDoc(vaga(store, aluna, 1), comentarioDe(aluna, idPost(aluna))));
  await assertFails(setDoc(doc(store, "muralTurmas", professor, "comentarios", "aleatorio"),
    comentarioDe(aluna, idPost(aluna))));
  await assertSucceeds(setDoc(vaga(db(colega), colega, 1), comentarioDe(colega, idPost(aluna))));
});

test("Comentário tem autoria, formato, dia e destino válidos", async () => {
  await publicar(aluna);
  await publicar(colega);
  const store = db(aluna);
  const alvo = idPost(colega);
  for (const payload of [
    comentarioDe(colega, alvo),
    comentarioDe(aluna, alvo, {autorNome: "Outra Pessoa"}),
    comentarioDe(aluna, alvo, {texto: ""}),
    comentarioDe(aluna, alvo, {texto: "a".repeat(501)}),
    comentarioDe(aluna, alvo, {dia: ontem()}),
    comentarioDe(aluna, alvo, {intensidade: "Alta"}),
    comentarioDe(aluna, alvo, {visivel: false}),
    comentarioDe(aluna, "publicacao-que-nao-existe"),
    comentarioDe(aluna, 42)
  ]) await assertFails(setDoc(vaga(store, aluna, 1), payload));
  await assertFails(setDoc(vaga(store, colega, 1), comentarioDe(aluna, alvo)));
  const {dia: _, ...semDia} = comentarioDe(aluna, alvo);
  await assertFails(setDoc(vaga(store, aluna, 1), semDia));
  await assertSucceeds(setDoc(vaga(store, aluna, 1), comentarioDe(aluna, alvo, {texto: "a".repeat(500)})));
});

test("Professor e quem não é aluno aprovado da turma não comentam nem publicam", async () => {
  await publicar(aluna);
  await assertFails(setDoc(postRef(db(professor), professor), texto(professor, "Professor")));
  await assertFails(setDoc(vaga(db(professor), professor, 1), comentarioDe(professor, idPost(aluna))));
  for (const uid of [undefined, pendente, visitante]) {
    await assertFails(setDoc(vaga(db(uid), uid || "anonimo", 1), comentarioDe(uid || "anonimo", idPost(aluna))));
  }
});

test("Comentários: leitura só da turma, em publicação visível; o aluno vê as próprias vagas", async () => {
  await publicar(aluna);
  await publicar(colega);
  await assertSucceeds(setDoc(vaga(db(colega), colega, 1), comentarioDe(colega, idPost(aluna))));
  await assertSucceeds(setDoc(vaga(db(colega), colega, 2), comentarioDe(colega, idPost(aluna))));
  await assertSucceeds(updateDoc(vaga(db(colega), colega, 2), remocao));
  equal((await assertSucceeds(getDocs(comentariosDe(db(aluna), idPost(aluna))))).size, 1);
  equal((await assertSucceeds(getDocs(comentariosDe(db(professor), idPost(aluna))))).size, 1);
  for (const uid of [undefined, pendente, visitante]) {
    await assertFails(getDocs(comentariosDe(db(uid), idPost(aluna))));
  }
  const minhas = query(collection(db(colega), "muralTurmas", professor, "comentarios"),
    where("autorId", "==", colega), where("dia", "==", hoje()));
  equal((await assertSucceeds(getDocs(minhas))).size, 2);
  const deOutro = query(collection(db(aluna), "muralTurmas", professor, "comentarios"),
    where("autorId", "==", colega), where("dia", "==", hoje()));
  await assertFails(getDocs(deOutro));
  await assertFails(getDocs(collection(db(aluna), "muralTurmas", professor, "comentarios")));
  await assertSucceeds(updateDoc(postRef(db(professor), aluna), remocao));
  await assertFails(getDocs(comentariosDe(db(colega), idPost(aluna))));
});

test("Subcoleção antiga de comentários fica fechada, sem o limite diário", async () => {
  await publicar(aluna);
  const antigo = doc(db(aluna), "muralTurmas", professor, "publicacoes", idPost(aluna), "comentarios", "x");
  await assertFails(setDoc(antigo, texto()));
  await assertFails(getDoc(antigo));
});

test("Curtida: só o próprio aluno, em publicação visível", async () => {
  await publicar(aluna);
  const like = doc(db(colega), "muralTurmas", professor, "publicacoes", idPost(aluna), "curtidas", colega);
  await assertSucceeds(setDoc(like, {ativo: true}));
  await assertFails(setDoc(doc(db(colega), "muralTurmas", professor, "publicacoes", idPost(aluna), "curtidas", aluna), {ativo: true}));
  const likes = query(collection(postRef(db(aluna), aluna), "curtidas"), where("ativo", "==", true));
  equal((await assertSucceeds(getDocs(likes))).size, 1);
  await assertSucceeds(setDoc(like, {ativo: false}));
  equal((await assertSucceeds(getDocs(likes))).size, 0);
  await assertSucceeds(updateDoc(postRef(db(professor), aluna), remocao));
  await assertFails(setDoc(like, {ativo: true}));
  await assertFails(getDocs(likes));
});

test("Revogação do cadastro retira o acesso ainda com a conta autenticada", async () => {
  await publicar(aluna);
  await publicar(colega);
  const store = db(colega);
  await assertSucceeds(getDoc(postRef(store, aluna)));
  await env.withSecurityRulesDisabled(context =>
    updateDoc(doc(context.firestore(), "usuarios", colega), {ativo: false}));
  await assertFails(getDoc(postRef(store, aluna)));
  await assertFails(setDoc(vaga(store, colega, 1), comentarioDe(colega, idPost(aluna))));
});

test("Autor ou professor removem; outro aluno não; o conteúdo oculto não volta", async () => {
  await publicar(aluna);
  await publicar(colega);
  await assertFails(updateDoc(postRef(db(colega), aluna), remocao));
  await assertFails(updateDoc(postRef(db(aluna), aluna), {visivel: false}));
  await assertFails(updateDoc(postRef(db(aluna), aluna), {visivel: false, texto: "", autorNome: "Outro"}));
  await assertSucceeds(setDoc(vaga(db(colega), colega, 1), comentarioDe(colega, idPost(aluna))));
  await assertFails(updateDoc(vaga(db(aluna), colega, 1), remocao));
  await assertSucceeds(updateDoc(vaga(db(professor), colega, 1), remocao));
  await assertSucceeds(updateDoc(postRef(db(aluna), aluna), remocao));
  await assertFails(getDoc(postRef(db(colega), aluna)));
  await assertSucceeds(updateDoc(postRef(db(professor), colega), remocao));
  equal((await assertSucceeds(getDocs(feed(db(aluna))))).size, 0);
});
