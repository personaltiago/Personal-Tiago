'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const registration=require('../../../seguranca-cadastro.js'),backup=require('../../../backup-crypto.js');
const input=()=>({nome:'Ana Silva',email:' ANA@EXAMPLE.INVALID ',whatsapp:'(69) 99999-0000',nascimento:'2000-02-29',genero:'Feminino',senha:'senha de teste',confirmar:'senha de teste'});
test('cadastro aceita dados legítimos, preserva compatibilidade e normaliza e-mail',()=>{
 assert.equal(registration.validate(input()).email,'ana@example.invalid');
 assert.equal(registration.validate({...input(),senha:'123456',confirmar:'123456'}).senha,'123456');
});
test('campos inválidos são recusados antes de enviar ao Firebase',()=>{
 for(const change of [{nome:'<script>'},{nome:'x'},{nome:'x'.repeat(121)},{email:'a@b'},{whatsapp:'----------'},{whatsapp:'(69) 99'},{nascimento:'2001-02-29'},{nascimento:'2999-01-01'},{genero:'admin'},{senha:'12345'},{confirmar:'outra'}])assert.throws(()=>registration.validate({...input(),...change}),{code:'cadastro/entrada-invalida'});
});
test('mensagens arbitrárias do SDK nunca chegam ao usuário',()=>{
 for(const code of [undefined,'unknown','permission-denied','auth/wrong-password','auth/email-already-in-use'])assert.ok(!registration.errorText({code,message:'INTERNAL_CANARY_TOKEN'}).includes('CANARY'));
 assert.equal(registration.errorText({code:'auth/user-not-found'}),registration.errorText({code:'auth/wrong-password'}));
 assert.equal(registration.errorText({message:'INTERNAL_CANARY_TOKEN'},true),registration.errorText({}));
 assert.match(registration.errorText({message:'Aguarde a preparação da foto antes de enviar.'},true),/Aguarde/);
});
const password='senha longa de teste',plain=new TextEncoder().encode('{\n "aluno": "dados SINTÉTICOS", "valor": 0\n}');
test('backup AES-GCM recupera exatamente os bytes e usa salt/IV novos',async()=>{
 const a=await backup.encrypt(plain,password),b=await backup.encrypt(plain,password);
 assert.deepEqual(await backup.decrypt(a,password),plain);
 for(const key of ['salt'])assert.notEqual(JSON.parse(a).kdf[key],JSON.parse(b).kdf[key]);
 assert.notEqual(JSON.parse(a).cipher.iv,JSON.parse(b).cipher.iv);
 assert.ok(!a.includes('SINTÉTICOS'));
});
test('senha incorreta e adulteração do ciphertext falham sem devolver plaintext',async()=>{
 const data=JSON.parse(await backup.encrypt(plain,password));
 await assert.rejects(backup.decrypt(JSON.stringify(data),'outra senha longa'),/Senha incorreta/);
 data.ciphertext=(data.ciphertext[0]==='A'?'B':'A')+data.ciphertext.slice(1);
 await assert.rejects(backup.decrypt(JSON.stringify(data),password),/alterado/);
});
test('parâmetros maliciosos, arquivo inválido e senhas fracas são recusados',async()=>{
 await assert.rejects(backup.encrypt(plain,'curta'),/12/);
 for(const value of ['[]','null','123','texto'])await assert.rejects(backup.encrypt(new TextEncoder().encode(value),password),/JSON/);
 const data=JSON.parse(await backup.encrypt(plain,password));
 data.kdf.iterations=2147483647;await assert.rejects(backup.decrypt(JSON.stringify(data),password),/parâmetros/);
 data.kdf.iterations=600000;data.kdf.salt='x'.repeat(10000);await assert.rejects(backup.decrypt(JSON.stringify(data),password),/inválido/);
});
