'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{findings}=require('../../../tools/verificar-segredos.cjs');
test('scanner detecta exemplos sintéticos e não confunde API key pública Firebase',()=>{
 assert.deepEqual(findings("'"+'gh'+'p_'+'a'.repeat(36)+"'"),['token GitHub']);
 assert.deepEqual(findings('-----BEGIN '+'PRIVATE KEY-----'),['chave privada PEM']);
 assert.deepEqual(findings(JSON.stringify({type:'service_account',private_key:'synthetic'})),['credencial service account']);
 assert.deepEqual(findings("apiKey: 'AIza"+'x'.repeat(35)+"'"),[]);
});
