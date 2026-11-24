'use strict';
// Testes sem rede das regras dos avisos (node --test test/).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const avisos = require('../avisos');

const TOKEN_A = 'dA1b2C3d4E5f6G7h8I9j:APA91bF' + 'x'.repeat(120);
const TOKEN_B = 'eB1c2D3e4F5g6H7i8J9k:APA91bG' + 'y'.repeat(120);
const TOKEN_C = 'fC1d2E3f4G5h6I7j8K9l:APA91bH' + 'z'.repeat(120);

// Firestore e Messaging de mentira, com o mínimo que avisos.js usa
function bancoFalso(tokens) {
  const docs = new Map(tokens.map(t => [avisos.chave(t), {token: t}]));
  const apagados = [];
  const colecao = {
    async get() { return {docs: [...docs.values()].map(d => ({get: k => d[k]}))}; },
    doc: id => ({async delete() { apagados.push(id); docs.delete(id); }}),
  };
  const db = {collection: nome => { assert.equal(nome, avisos.COLECAO); return {doc: id => { assert.equal(id, avisos.TEACHER); return {collection: sub => { assert.equal(sub, 'aparelhos'); return colecao; }}; }}; }};
  return {db, apagados, docs};
}
function mensageiroFalso(erros = {}) {
  const enviados = [];
  return {enviados, async sendEachForMulticast(m) { enviados.push(m); const responses = m.tokens.map(t => erros[t] ? {success: false, error: {code: erros[t]}} : {success: true}); return {responses, successCount: responses.filter(r => r.success).length}; }};
}

test('cadastro de aluno à espera de aprovação gera o aviso, só com o primeiro nome', () => {
  const aviso = avisos.novoCadastro({nome: 'Carla Souza Teste', perfil: 'aluno', ativo: false, professorId: avisos.TEACHER, email: 'carla@exemplo.com'});
  assert.deepEqual(aviso, {titulo: 'Novo cadastro', texto: 'Carla se cadastrou. Toque para aprovar.', tipo: 'cadastro'});
  assert.ok(!JSON.stringify(aviso).includes('Souza') && !JSON.stringify(aviso).includes('@'));
});

test('outros documentos de usuarios não geram aviso', () => {
  for (const dados of [null, undefined, {}, {perfil: 'professor', ativo: false, professorId: avisos.TEACHER},
    {perfil: 'aluno', ativo: true, professorId: avisos.TEACHER}, {perfil: 'aluno', ativo: false, professorId: 'outro'},
    {perfil: 'aluno', professorId: avisos.TEACHER}])
    assert.equal(avisos.novoCadastro(dados), null, JSON.stringify(dados));
});

test('nome vazio ou estranho', () => {
  assert.equal(avisos.novoCadastro({nome: '   ', perfil: 'aluno', ativo: false, professorId: avisos.TEACHER}).texto, 'Um aluno se cadastrou. Toque para aprovar.');
  assert.equal(avisos.primeiroNome('Ana\u0007Maria Silva'), 'AnaMaria');
  assert.equal(avisos.primeiroNome('x'.repeat(80)).length, 40);
  const emoji = avisos.primeiroNome('a'.repeat(39) + '\u{1F600}\u{1F600}');
  assert.equal(Array.from(emoji).length, 40);
  assert.ok(!/[\ud800-\udbff]$/.test(emoji), 'não corta emoji ao meio');
});

test('a mensagem vai só com dados, alta prioridade: o app monta o aviso (aberto ou fechado)', () => {
  const m = avisos.mensagem({titulo: 'Novo cadastro', texto: 'Carla se cadastrou. Toque para aprovar.', tipo: 'cadastro'}, [TOKEN_A], 'uid123');
  assert.deepEqual(m.data, {tipo: 'cadastro', titulo: 'Novo cadastro', texto: 'Carla se cadastrou. Toque para aprovar.', aluno: 'uid123'});
  assert.deepEqual(m.android, {priority: 'high', ttl: 86400000});
  assert.equal(m.notification, undefined, 'com "notification" o Firebase mostraria sozinho e o toque não abriria a aprovação');
  assert.deepEqual(m.tokens, [TOKEN_A]);
  assert.ok(Object.values(m.data).every(v => typeof v === 'string'), 'o FCM só aceita textos nos dados');
  assert.deepEqual(avisos.mensagem({titulo: 't', texto: 'x', tipo: 'teste'}, [TOKEN_A]).data, {tipo: 'teste', titulo: 't', texto: 'x'});
});

test('envia para todos os aparelhos e tira os que não existem mais', async () => {
  const {db, apagados, docs} = bancoFalso([TOKEN_A, TOKEN_B, TOKEN_C, 'curto']);
  const m = mensageiroFalso({[TOKEN_B]: 'messaging/registration-token-not-registered', [TOKEN_C]: 'messaging/internal-error'});
  const r = await avisos.enviar(db, m, {titulo: 'Novo cadastro', texto: 'x', tipo: 'cadastro'}, 'uid1');
  assert.deepEqual(r, {aparelhos: 3, enviados: 1, removidos: 1});
  assert.deepEqual(m.enviados[0].tokens, [TOKEN_A, TOKEN_B, TOKEN_C]);
  assert.deepEqual(apagados, [avisos.chave(TOKEN_B)]);
  assert.ok(docs.has(avisos.chave(TOKEN_C)), 'erro passageiro não apaga o aparelho');
});

test('sem aparelho registrado, não chama o Firebase Messaging', async () => {
  const {db} = bancoFalso([]);
  const m = mensageiroFalso();
  assert.deepEqual(await avisos.enviar(db, m, {titulo: 't', texto: 'x', tipo: 'teste'}), {aparelhos: 0, enviados: 0, removidos: 0});
  assert.equal(m.enviados.length, 0);
});

test('registro do aparelho: só endereço de push válido', () => {
  assert.deepEqual(avisos.validarAparelho({token: TOKEN_A, versaoApp: '1.211'}), {token: TOKEN_A, plataforma: 'android', versaoApp: '1.211'});
  assert.equal(avisos.validarAparelho({token: TOKEN_A, versaoApp: '<b>9</b>'}).versaoApp, '9');
  for (const dados of [null, {}, {token: 'curto'}, {token: TOKEN_A + ' '}, {token: '<script>' + 'a'.repeat(30)}, {token: 'a'.repeat(5000)}])
    assert.throws(() => avisos.validarAparelho(dados), /token/, JSON.stringify(dados).slice(0, 40));
  assert.equal(avisos.chave(TOKEN_A), avisos.chave(TOKEN_A));
  assert.notEqual(avisos.chave(TOKEN_A), avisos.chave(TOKEN_B));
  assert.match(avisos.chave(TOKEN_A), /^[0-9a-f]{40}$/);
});

test('as três funções: gatilho no Firestore (região do banco) e duas chamadas do app em São Paulo', () => {
  const regiao = path.join(__dirname, '..', 'regiao.json');
  const existia = fs.existsSync(regiao);
  const carregar = () => { for (const k of Object.keys(require.cache)) if (k.endsWith(path.join('functions', 'index.js')) || k.endsWith('regiao.json')) delete require.cache[k]; return require('../index.js'); };
  if (!existia) {
    const f = carregar();
    assert.deepEqual(f.avisoNovoCadastro.__endpoint.region, ['us-central1']);
    fs.writeFileSync(regiao, JSON.stringify({firestore: 'southamerica-east1'}));
  }
  try {
    const f = carregar();
    const e = f.avisoNovoCadastro.__endpoint;
    assert.equal(e.eventTrigger.eventType, 'google.cloud.firestore.document.v1.created');
    assert.deepEqual(e.eventTrigger.eventFilterPathPatterns, {document: 'usuarios/{uid}'});
    assert.equal(e.eventTrigger.retry, false);
    if (!existia) assert.deepEqual(e.region, ['southamerica-east1']);
    for (const nome of ['registrarAparelho', 'testarAviso']) {
      assert.deepEqual(f[nome].__endpoint.callableTrigger, {}, nome);
      assert.deepEqual(f[nome].__endpoint.region, ['southamerica-east1'], nome);
      assert.equal(f[nome].__endpoint.maxInstances, 2, nome);
    }
    assert.deepEqual(Object.keys(f).sort(), ['avisoNovoCadastro', 'registrarAparelho', 'testarAviso']);
  } finally { if (!existia) fs.unlinkSync(regiao); }
});

test('as chamadas do app recusam quem não é o professor', async () => {
  const f = require('../index.js');
  for (const nome of ['registrarAparelho', 'testarAviso']) {
    for (const auth of [undefined, {uid: 'aluno123'}])
      await assert.rejects(() => f[nome].run({data: {token: TOKEN_A}, auth}), e => e.code === 'permission-denied', nome);
  }
});
