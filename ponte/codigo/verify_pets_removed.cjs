'use strict';
// Urso (panda) e Galo (rooster) removidos: escolha, tabelas de imagens e migração dos pets existentes para o gato.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const files=JSON.parse(fs.readFileSync(path.join(__dirname,'..','web','native-release.agenda.json'),'utf8')).files;
const idx=files['index.html'],cad=files['cadastro.html'];let checks=0;const ok=(c,m)=>{checks++;assert.ok(c,m)};
const model=idx.match(/<script\b[^>]*\bid="ap-student-mascot-model"[^>]*>([\s\S]*?)<\/script>/)[1];
const codec=idx.match(/(!function\(t\)\{"use strict";const e=Object\.freeze\(function\(\)\{let t="";[\s\S]*?\(globalThis\);)/)[1];
const box={Math,Object,Array,Number,String,JSON,Set,Date,Error,Uint8Array,Int16Array};box.globalThis=box;vm.createContext(box);
vm.runInContext(model,box);vm.runInContext(codec,box);
const M=box.APMascotModel;
ok(JSON.stringify(M.choices.map(c=>c.id))==='["capybara","kitten","wolf"]','escolha só com capivara, gato e lobo: '+JSON.stringify(M.choices.map(c=>c.id)));
for(const sp of ['panda','rooster']){
  const old={schema:1,species:sp,name:'Léo',xp:950,xpSpent:100,coins:340,colors:{[sp]:'white',kitten:'ginger'},poses:{[sp]:'sit'},owned:['home-yard','home-bamboo','color-'+sp+'-white','color-kitten-ginger','ball'],equipped:{head:'',body:'',home:'home-bamboo'}};
  const s=M.read(old);
  ok(s.species==='kitten','pet '+sp+' vira gato: '+s.species);
  ok(s.name==='Léo'&&s.xp===950&&s.xpSpent===100&&s.coins===340,'nome, XP e moedas mantidos ('+sp+')');
  ok(s.owned.includes('home-bamboo')&&s.owned.includes('ball')&&s.equipped.home==='home-bamboo','casas e itens mantidos ('+sp+')');
  ok(s.colors.kitten==='ginger'&&!s.colors[sp]&&!s.poses[sp],'cor do gato mantida e restos do '+sp+' removidos');
  ok(M.change(s,'species',sp).ok===false,'não é possível escolher '+sp+' de novo');
}
ok(!M.catalog.some(i=>i.species==='panda'||i.species==='rooster'),'loja sem itens do urso e do galo');
for(const id of ['ap-approved-bear-assets','ap-bear-face-reaction-assets','ap-bear-young-face-assets','ap-chick-face-assets'])ok(!cad.includes('id="'+id+'"'),'imagens removidas: '+id);
for(const id of ['ap-mascot-reaction-assets','ap-mascot-affection-assets','ap-mascot-image-assets','ap-mascot-coat-assets','ap-mascot-pose-assets']){
  const m=cad.match(new RegExp('id="'+id+'" data-ap-gzip data-ap-base85>([^<]*)<'));ok(m,'tabela presente: '+id);
  const d=JSON.parse(zlib.gunzipSync(Buffer.from(box.APMascotAssetCodec.decode(m[1]))).toString('utf8'));
  ok(JSON.stringify(Object.keys(d).sort())==='["capybara","kitten","wolf"]','tabela '+id+' só com os pets mantidos: '+Object.keys(d));
}
console.log('PASS Urso e Galo removidos: '+checks+' verificações (sem aparelho físico).');
