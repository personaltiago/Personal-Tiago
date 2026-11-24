'use strict';

// Regras dos avisos no celular do professor (sem Firebase aqui dentro, para testar sem rede).
// Pedido do Tiago (24/11/2026): quando um aluno se cadastrar, avisar na tela bloqueada, mesmo com o app fechado.

const crypto = require('node:crypto');

const TEACHER = 'R2EmnDVcvMWt7TjPxOP6DjW1VOn1'; // a conta do professor (a mesma de APStudentModel.TEACHER)
const COLECAO = 'avisosAparelhos'; // avisosAparelhos/{professor}/aparelhos/{chave}: só as funções gravam e leem
const TOKEN = /^[A-Za-z0-9_:-]{20,4096}$/;
const INVALIDOS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

// Só o primeiro nome vai para a tela bloqueada.
function primeiroNome(nome) {
  const primeiro = String(nome ?? '').trim().split(/\s+/)[0] || '';
  return Array.from(primeiro.replace(/[\u0000-\u001f\u007f]/g, '')).slice(0, 40).join(''); // corta por letra, sem partir emoji
}

// O documento novo em usuarios/{uid} é um cadastro de aluno à espera de aprovação?
function novoCadastro(dados) {
  if (!dados || dados.perfil !== 'aluno' || dados.ativo !== false || dados.professorId !== TEACHER) return null;
  const nome = primeiroNome(dados.nome);
  return {titulo: 'Novo cadastro', texto: (nome ? nome + ' se cadastrou' : 'Um aluno se cadastrou') + '. Toque para aprovar.', tipo: 'cadastro'};
}

function chave(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex').slice(0, 40);
}

// Só dados, sem o bloco "notification": o app (PushAvisos, APK 1.211) monta o aviso no canal "Cadastros de alunos" com o app
// aberto ou fechado. Com "notification", o Firebase mostraria sozinho com o app fechado e o toque recarregaria a agenda sem
// abrir a lista de aprovação.
function mensagem(aviso, tokens, aluno) {
  const data = {tipo: aviso.tipo, titulo: aviso.titulo, texto: aviso.texto};
  if (aluno) data.aluno = String(aluno);
  return {tokens, data, android: {priority: 'high', ttl: 24 * 60 * 60 * 1000}};
}

function tokensInvalidos(tokens, resposta) {
  return (resposta?.responses || [])
    .map((r, i) => (!r.success && INVALIDOS.has(r.error?.code)) ? tokens[i] : null)
    .filter(Boolean);
}

function aparelhos(db) {
  return db.collection(COLECAO).doc(TEACHER).collection('aparelhos');
}

// Manda o aviso para todos os aparelhos do professor e tira os que o Firebase diz que não existem mais.
async function enviar(db, messaging, aviso, aluno = '') {
  const lista = await aparelhos(db).get();
  const tokens = [...new Set(lista.docs.map(d => d.get('token')).filter(t => typeof t === 'string' && TOKEN.test(t)))];
  if (!tokens.length) return {aparelhos: 0, enviados: 0, removidos: 0};
  const resposta = await messaging.sendEachForMulticast(mensagem(aviso, tokens, aluno));
  const ruins = tokensInvalidos(tokens, resposta);
  await Promise.all(ruins.map(t => aparelhos(db).doc(chave(t)).delete()));
  return {aparelhos: tokens.length, enviados: resposta.successCount, removidos: ruins.length};
}

function validarAparelho(dados) {
  const token = String(dados?.token ?? '');
  if (!TOKEN.test(token)) throw new Error('token inválido');
  return {token, plataforma: 'android', versaoApp: String(dados?.versaoApp ?? '').replace(/[^0-9.]/g, '').slice(0, 20)};
}

module.exports = {TEACHER, COLECAO, TOKEN, primeiroNome, novoCadastro, chave, mensagem, tokensInvalidos, aparelhos, enviar, validarAparelho};
