"use strict";

// Testa o mural CONTRA as regras publicadas do Firestore (cópia de 17/11/2026, com o UID
// do professor trocado por um marcador). Diferente de mural-firestore.test.cjs, aqui o
// cadastro dos alunos nasce e é aprovado pelas próprias regras de `usuarios`, sem atalhos.

const {readFileSync} = require("node:fs");
const {resolve} = require("node:path");
const {after, before, beforeEach, test} = require("node:test");
const {equal, ok} = require("node:assert/strict");
const {initializeTestEnvironment, assertFails, assertSucceeds} = require("@firebase/rules-unit-testing");
const {
  collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where
} = require("firebase/firestore");

const professor = "professor-teste";
const publicadas = readFileSync(resolve(__dirname, "../../firebase/regras-publicadas-2026-11-17.rules"), "utf8");
const fragment = readFileSync(resolve(__dirname, "../../firebase/mural-da-turma.rules"), "utf8");
const ancora = "match /databases/{database}/documents {";
ok(publicadas.includes("PROFESSOR_UID_PLACEHOLDER"), "marcador do professor ausente nas regras publicadas");
ok(publicadas.includes(ancora), "âncora das regras publicadas não encontrada");
const rules = publicadas
  .replace(/PROFESSOR_UID_PLACEHOLDER/g, professor)
  .replace(ancora, ancora + "\n" + fragment);

const aluna = "aluna-real";
const colega = "colega-real";
const outra = "outra-real";
const FOTO = "data:image/jpeg;base64,/9j/" + "A".repeat(40);
const dia = () => new Date().toISOString().slice(0, 10).replace(/-/g, "");
const turma = ["muralTurmas", professor, "publicacoes"];
let env;

const db = uid => env.authenticatedContext(uid, {email: `${uid}@exemplo.com.br`}).firestore();
const userRef = (store, uid) => doc(store, "usuarios", uid);
const cadastro = (uid, extra = {}) => ({
  nome: "Aluna Teste", email: `${uid}@exemplo.com.br`, whatsapp: "69999990000", nascimento: "2000-01-31",
  genero: "Feminino", perfil: "aluno", ativo: false, professorId: professor, criadoEm: serverTimestamp(), ...extra
});
const texto = (uid, nome = "Aluna Teste") => ({
  autorId: uid, autorNome: nome, texto: "Hoje terminei a última série.", criadoEm: serverTimestamp(), visivel: true
});
const post = (store, uid) => doc(store, ...turma, `${uid}_${dia()}`);
const feed = store => query(collection(store, ...turma), where("visivel", "==", true));
const aprovar = (uid, ativo = true) => updateDoc(userRef(db(professor), uid), {ativo});
const cadastrar = uid => assertSucceeds(setDoc(userRef(db(uid), uid), cadastro(uid)));

before(async () => {
  env = await initializeTestEnvironment({projectId: "demo-agenda-regras-reais", firestore: {rules}});
});
beforeEach(async () => { await env.clearFirestore(); });
after(async () => { await env?.cleanup(); });

test("Cadastro próprio nasce pendente: não nasce aprovado, nem como outro perfil, professor ou pessoa", async () => {
  const falhas = [
    ["aprovado", {ativo: true}],
    ["perfil professor", {perfil: "professor"}],
    ["professor de outra turma", {professorId: "outro-professor"}],
    ["campo extra", {admin: true}],
    ["e-mail de outra pessoa", {email: "alguem@exemplo.com.br"}]
  ];
  for (const [i, [, extra]] of falhas.entries()) {
    const uid = `tentativa-${i}`;
    await assertFails(setDoc(userRef(db(uid), uid), cadastro(uid, extra)));
  }
  await assertFails(setDoc(userRef(db("intruso"), "vitima"), cadastro("vitima")));
  await cadastrar(aluna);
  const lido = await assertSucceeds(getDoc(userRef(db(aluna), aluna)));
  equal(lido.data().ativo, false);
});

test("Aluno pendente só altera a foto: não se aprova, não troca de professor nem de nome", async () => {
  await cadastrar(aluna);
  const store = db(aluna);
  for (const mudanca of [
    {ativo: true}, {professorId: "outro-professor"}, {nome: "Outro Nome"}, {perfil: "professor"},
    {ativo: true, fotoCadastro: FOTO}
  ]) await assertFails(updateDoc(userRef(store, aluna), mudanca));
  await assertFails(updateDoc(userRef(store, aluna), {fotoCadastro: "data:text/html;base64,AAAA"}));
  await assertSucceeds(updateDoc(userRef(store, aluna), {fotoCadastro: FOTO}));
});

test("Depois de aprovado o aluno não altera nem apaga o cadastro e não lê o de outros", async () => {
  await cadastrar(aluna);
  await cadastrar(colega);
  await assertSucceeds(aprovar(aluna));
  const store = db(aluna);
  for (const mudanca of [{fotoCadastro: FOTO}, {nome: "Outro Nome"}, {ativo: true}, {professorId: "outro-professor"}]) {
    await assertFails(updateDoc(userRef(store, aluna), mudanca));
  }
  await assertFails(deleteDoc(userRef(store, aluna)));
  await assertSucceeds(getDoc(userRef(store, aluna)));
  await assertFails(getDoc(userRef(store, colega)));
});

test("Mural: só entra quem o professor aprovou, e a aprovação não vem do aluno", async () => {
  await cadastrar(aluna);
  await cadastrar(outra);
  const pendente = db(aluna);
  await assertFails(getDocs(feed(pendente)));
  await assertFails(setDoc(post(pendente, aluna), texto(aluna)));
  await assertFails(updateDoc(userRef(pendente, aluna), {ativo: true}));
  await assertFails(setDoc(post(pendente, aluna), texto(aluna)));

  await assertSucceeds(aprovar(aluna));
  await assertSucceeds(setDoc(post(db(aluna), aluna), texto(aluna)));
  await assertFails(setDoc(post(db(aluna), aluna), texto(aluna)));
  await assertSucceeds(getDocs(feed(db(aluna))));

  await assertFails(getDocs(feed(db(outra))));
  await assertFails(getDoc(post(db(outra), aluna)));

  await assertSucceeds(setDoc(userRef(db(professor), "vinculada"), {
    nome: "Vinculada", perfil: "aluno", ativo: true, professorId: "outro-professor"
  }));
  await assertFails(getDocs(feed(db("vinculada"))));
  await assertFails(setDoc(post(db("vinculada"), "vinculada"), texto("vinculada", "Vinculada")));

  await assertSucceeds(aprovar(aluna, false));
  await assertFails(getDocs(feed(db(aluna))));

  await assertSucceeds(aprovar(aluna, true));
  await assertSucceeds(updateDoc(post(db(professor), aluna), {visivel: false, texto: ""}));
  await assertFails(getDoc(post(db(aluna), aluna)));
});

test("Comentários do mural: só aluno aprovado que publicou hoje, até 10 por dia", async () => {
  await cadastrar(aluna);
  await cadastrar(colega);
  await assertSucceeds(aprovar(aluna));
  await assertSucceeds(aprovar(colega));
  const coment = (uid, n, extra = {}) => [
    doc(db(uid), "muralTurmas", professor, "comentarios", `${uid}_${dia()}_${n}`),
    {autorId: uid, autorNome: "Aluna Teste", texto: "Boa!", criadoEm: serverTimestamp(), visivel: true,
      publicacaoId: `${colega}_${dia()}`, dia: dia(), ...extra}
  ];
  await assertSucceeds(setDoc(post(db(colega), colega), texto(colega, "Aluna Teste")));
  await assertFails(setDoc(...coment(aluna, 1)));
  await assertSucceeds(setDoc(post(db(aluna), aluna), texto(aluna)));
  for (let n = 1; n <= 10; n++) await assertSucceeds(setDoc(...coment(aluna, n)));
  await assertFails(setDoc(...coment(aluna, 11)));
  await assertFails(setDoc(doc(db(aluna), ...turma, `${colega}_${dia()}`, "comentarios", "antigo"), texto(aluna)));
});

test("Feedback, evolução e demais caminhos seguem fechados para qualquer conta (negação padrão)", async () => {
  await cadastrar(aluna);
  await assertSucceeds(aprovar(aluna));
  const caminhos = [
    ["feedback", "x"], ["evolucao", "x"], ["agendas", "x"], ["muralTurmas", professor],
    ["usuarios", aluna, "feedback", "x"], ["usuarios", aluna, "evolucao", "x"]
  ];
  for (const uid of [aluna, professor]) {
    for (const caminho of caminhos) {
      await assertFails(getDoc(doc(db(uid), ...caminho)));
      await assertFails(setDoc(doc(db(uid), ...caminho), {texto: "x"}));
    }
  }
  await assertFails(getDocs(collection(db(aluna), "feedback")));
});

test("Treino atual: aluno aprovado lê o próprio e não escreve; pendente e outros alunos não leem", async () => {
  await cadastrar(aluna);
  await cadastrar(colega);
  const atual = (uid, store) => doc(store, "usuarios", uid, "treinos", "atual");
  const ficha = uid => ({
    version: 2, professorId: professor, studentId: "id-1", studentUid: uid, payload: "{}", updatedAt: serverTimestamp()
  });
  await assertFails(setDoc(atual(aluna, db(professor)), ficha(aluna)));
  await assertSucceeds(aprovar(aluna));
  await assertSucceeds(setDoc(atual(aluna, db(professor)), ficha(aluna)));
  await assertSucceeds(getDoc(atual(aluna, db(aluna))));
  await assertFails(setDoc(atual(aluna, db(aluna)), ficha(aluna)));
  await assertFails(getDoc(atual(aluna, db(colega))));
  await assertSucceeds(getDoc(atual(aluna, db(professor))));
});
