'use strict';

// Funções do Firebase do Agenda Personal: avisos no celular do professor.
//  - avisoNovoCadastro: aluno novo em usuarios/{uid} (perfil aluno, ativo false) → "Novo cadastro" no celular do professor.
//  - registrarAparelho: o app do professor (APK 1.211 ou mais novo) guarda o endereço de push do celular.
//  - testarAviso: o botão "Testar aviso" manda um aviso de teste para os aparelhos do professor.
// Publicar: firebase/publicar.sh (Cloud Shell do console do Firebase). Não mexe nas regras do Firestore.

const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {logger} = require('firebase-functions');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const {getMessaging} = require('firebase-admin/messaging');
const avisos = require('./avisos');

initializeApp();

// O gatilho do Firestore precisa ficar na mesma região do banco; publicar.sh descobre e grava regiao.json.
let regiaoDoBanco = 'us-central1';
try { regiaoDoBanco = require('./regiao.json').firestore || regiaoDoBanco; } catch (_) { /* sem o arquivo: us-central1 (banco nam5) */ }
const REGIAO_APP = 'southamerica-east1'; // as funções que o app chama (endereço fixo no app)
const comum = {maxInstances: 2, memory: '256MiB', timeoutSeconds: 30};

exports.avisoNovoCadastro = onDocumentCreated({...comum, document: 'usuarios/{uid}', region: regiaoDoBanco}, async event => {
  const aviso = avisos.novoCadastro(event.data?.data());
  if (!aviso) return;
  const r = await avisos.enviar(getFirestore(), getMessaging(), aviso, event.params.uid);
  logger.info('Aviso de novo cadastro', r);
});

function soProfessor(request) {
  if (request.auth?.uid !== avisos.TEACHER) throw new HttpsError('permission-denied', 'Só a conta do professor pode usar os avisos.');
}

exports.registrarAparelho = onCall({...comum, region: REGIAO_APP}, async request => {
  soProfessor(request);
  let aparelho;
  try { aparelho = avisos.validarAparelho(request.data); } catch (_) { throw new HttpsError('invalid-argument', 'Aparelho inválido.'); }
  await avisos.aparelhos(getFirestore()).doc(avisos.chave(aparelho.token)).set({...aparelho, atualizadoEm: FieldValue.serverTimestamp()});
  return {ok: true};
});

exports.testarAviso = onCall({...comum, region: REGIAO_APP}, async request => {
  soProfessor(request);
  const r = await avisos.enviar(getFirestore(), getMessaging(), {
    titulo: 'Teste do aviso',
    texto: 'Se isto apareceu na tela bloqueada, os avisos de cadastro estão funcionando.',
    tipo: 'teste',
  });
  logger.info('Aviso de teste', r);
  return r;
});
