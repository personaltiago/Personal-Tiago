(function (root) {
  'use strict';
  const generic = 'Não foi possível concluir agora. Confira sua conexão e tente novamente. Se continuar, fale com o professor.';
  const messages = Object.freeze({
    'auth/invalid-credential': 'Não foi possível confirmar o acesso. Confira o e-mail e a senha.',
    'auth/wrong-password': 'Não foi possível confirmar o acesso. Confira o e-mail e a senha.',
    'auth/user-not-found': 'Não foi possível confirmar o acesso. Confira o e-mail e a senha.',
    'auth/email-already-in-use': 'Não foi possível confirmar o acesso. Confira o e-mail e a senha.',
    'auth/invalid-email': 'Digite um e-mail válido.',
    'auth/weak-password': 'A senha não atende aos requisitos de segurança. Use uma senha mais longa.',
    'auth/password-does-not-meet-requirements': 'A senha não atende aos requisitos de segurança. Use uma senha mais longa.',
    'auth/too-many-requests': 'Muitas tentativas em pouco tempo. Aguarde e tente novamente.',
    'auth/network-request-failed': 'Não foi possível conectar. Confira sua internet e tente novamente.',
    'auth/operation-not-allowed': 'O cadastro está indisponível. Fale com o professor.',
    'permission-denied': 'Não foi possível concluir o cadastro. Fale com o professor.',
    'firestore/permission-denied': 'Não foi possível concluir o cadastro. Fale com o professor.',
    'cadastro/conta-professor': 'Use a conta do aluno para solicitar cadastro.',
    'cadastro/outra-agenda': 'Esta conta já possui outro vínculo. Fale com o professor.'
  });
  const photoMessages = new Set([
    'Aguarde a preparação da foto antes de enviar.',
    'Confirme o recorte da foto ou toque em Cancelar antes de enviar.'
  ]);
  function errorText(error, photo = false) {
    if (photo && photoMessages.has(error?.message)) return error.message;
    return messages[error?.code] || generic;
  }
  function validationError(message) { const error = new Error(message); error.code = 'cadastro/entrada-invalida'; return error; }
  function validate(input, now = new Date()) {
    const nome = String(input.nome ?? '').trim();
    const email = String(input.email ?? '').trim().toLowerCase();
    const whatsapp = String(input.whatsapp ?? '').trim();
    const nascimento = String(input.nascimento ?? '');
    const genero = String(input.genero ?? '');
    const senha = String(input.senha ?? '');
    if (nome.length < 2 || nome.length > 120 || /[\u0000-\u001f\u007f<>]/.test(nome)) throw validationError('Informe seu nome completo, com até 120 caracteres.');
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw validationError('Digite um e-mail válido.');
    if (whatsapp.length > 25 || !/^[+() 0-9-]+$/.test(whatsapp) || !/^\d{10,11}$/.test(whatsapp.replace(/\D/g, ''))) throw validationError('Digite um WhatsApp válido com DDD.');
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nascimento);
    const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!match || date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3]) || date > today) throw validationError('Informe uma data de nascimento válida, até a data de hoje.');
    if (!['Masculino', 'Feminino', 'Prefiro não informar'].includes(genero)) throw validationError('Selecione uma das opções de gênero.');
    // Preserve existing Firebase password compatibility; the enforced policy belongs in Auth.
    if (senha.length < 6 || senha.length > 4096) throw validationError('Informe uma senha com pelo menos 6 caracteres.');
    if (senha !== input.confirmar) throw validationError('As senhas não são iguais.');
    return {nome, email, whatsapp, nascimento, genero, senha};
  }
  const api = Object.freeze({validate, errorText});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.APRegistrationSecurity = api;
})(typeof globalThis === 'object' ? globalThis : this);
