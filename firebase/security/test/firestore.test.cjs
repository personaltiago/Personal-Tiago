'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,collection,query,where,getDoc,getDocs,setDoc,updateDoc,deleteDoc,serverTimestamp}=require('firebase/firestore');
const PROJECT='demo-agenda-personal-security',TEACHER='R2EmnDVcvMWt7TjPxOP6DjW1VOn1';
let env;
const ctx=uid=>env.authenticatedContext(uid,{email:uid+'@example.invalid'}).firestore();
const profile=(uid,active=false)=>({nome:'Aluno de teste',email:uid+'@example.invalid',whatsapp:'(69) 99999-0000',nascimento:'2000-01-01',genero:'Masculino',perfil:'aluno',ativo:active,professorId:TEACHER,criadoEm:serverTimestamp()});
const area=uid=>({version:2,professorId:TEACHER,studentId:'student-'+uid,studentUid:uid,payload:'{"version":2}',updatedAt:serverTimestamp()});
before(async()=>{
  assert.equal(process.env.GCLOUD_PROJECT||PROJECT,PROJECT);
  assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):8089$/);
  env=await initializeTestEnvironment({projectId:PROJECT,firestore:{rules:fs.readFileSync(path.resolve(__dirname,'../../firestore.rules'),'utf8'),host:'127.0.0.1',port:8089}});
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    for(const [uid,active]of [['alice',true],['bob',true],['pending',false],['foreign',true]]){
      const p=profile(uid,active);if(uid==='foreign')p.professorId='outro-professor';
      await setDoc(doc(db,'usuarios',uid),p);
      await setDoc(doc(db,'usuarios',uid,'treinos','atual'),area(uid));
    }
    await setDoc(doc(db,'usuarios',TEACHER),{perfil:'professor',ativo:true});
    await setDoc(doc(db,'avisosAparelhos',TEACHER,'aparelhos','private-token'),{token:'fixture-only'});
  });
});
after(async()=>{await env?.cleanup();});

test('anonymous cannot read profiles, workouts, lists or push tokens',async()=>{
  const db=env.unauthenticatedContext().firestore();
  for(const p of [['usuarios','alice'],['usuarios','alice','treinos','atual'],['avisosAparelhos',TEACHER,'aparelhos','private-token']])await assertFails(getDoc(doc(db,...p)));
  await assertFails(getDocs(collection(db,'usuarios')));
});
test('student A can read own profile and workout, never student B',async()=>{
  const db=ctx('alice');
  await assertSucceeds(getDoc(doc(db,'usuarios','alice')));
  await assertSucceeds(getDoc(doc(db,'usuarios','alice','treinos','atual')));
  await assertFails(getDoc(doc(db,'usuarios','bob')));
  await assertFails(getDoc(doc(db,'usuarios','bob','treinos','atual')));
  await assertFails(getDoc(doc(db,'usuarios',TEACHER)));
  await assertFails(getDocs(collection(db,'usuarios')));
});
test('student cannot write/delete another profile or workout',async()=>{
  const db=ctx('alice');
  await assertFails(updateDoc(doc(db,'usuarios','bob'),{nome:'Alterado'}));
  await assertFails(deleteDoc(doc(db,'usuarios','bob')));
  await assertFails(setDoc(doc(db,'usuarios','bob','treinos','atual'),area('bob')));
  await assertFails(deleteDoc(doc(db,'usuarios','bob','treinos','atual')));
});
test('student cannot change role, approval or teacher association',async()=>{
  for(const uid of ['alice','pending'])for(const change of [{perfil:'professor'},{ativo:uid==='pending'},{professorId:'outro-professor'},{admin:true},{role:'admin'},{nome:'Outro nome'}]){
    await assertFails(updateDoc(doc(ctx(uid),'usuarios',uid),change));
  }
});
test('pending student reads own status but not workout; can update only pending photo',async()=>{
  const db=ctx('pending');await assertSucceeds(getDoc(doc(db,'usuarios','pending')));
  await assertFails(getDoc(doc(db,'usuarios','pending','treinos','atual')));
  await assertSucceeds(updateDoc(doc(db,'usuarios','pending'),{fotoCadastro:'data:image/jpeg;base64,/9j/2Q=='}));
  await assertFails(updateDoc(doc(db,'usuarios','pending'),{fotoCadastro:'data:image/svg+xml,<svg onload="x"/>'}));
  await assertFails(updateDoc(doc(db,'usuarios','alice'),{fotoCadastro:''}));
});
test('valid registration including optional photo succeeds, without allowing approval',async()=>{
  for(const uid of ['new-student','new-photo']){
    const db=ctx(uid);await assertSucceeds(getDoc(doc(db,'usuarios',uid)));
    const p=profile(uid);if(uid==='new-photo')p.fotoCadastro='data:image/jpeg;base64,/9j/2Q==';
    await assertSucceeds(setDoc(doc(db,'usuarios',uid),p));
  }
});
test('malformed or privileged registration is denied server-side',async()=>{
  const mutations=[{ativo:true},{perfil:'professor'},{professorId:'outro-professor'},{email:'someone-else@example.invalid'},{role:'admin'},{senha:'must-never-be-stored'},{nome:'x'},{whatsapp:123},{whatsapp:'----------'},{genero:'outro'},{criadoEm:'2000-01-01'},{fotoCadastro:'x'.repeat(120001)}];
  for(const [i,change]of mutations.entries()){
    const uid='invalid-'+i;await assertFails(setDoc(doc(ctx(uid),'usuarios',uid),{...profile(uid),...change}));
  }
  await assertFails(setDoc(doc(ctx('other-owner'),'usuarios','not-other-owner'),profile('other-owner')));
});
test('teacher can query the linked students and approve a pending student',async()=>{
  const db=ctx(TEACHER);
  await assertSucceeds(getDocs(query(collection(db,'usuarios'),where('professorId','==',TEACHER),where('perfil','==','aluno'))));
  await assertFails(getDocs(collection(db,'usuarios')));
  await assertFails(getDoc(doc(db,'usuarios','foreign')));
  await assertSucceeds(updateDoc(doc(db,'usuarios','new-student'),{ativo:true,tipoAluno:'presencial',aprovadoEm:serverTimestamp()}));
  await assertSucceeds(setDoc(doc(db,'usuarios','new-student','treinos','atual'),area('new-student')));
  await assertSucceeds(getDoc(doc(ctx('new-student'),'usuarios','new-student','treinos','atual')));
});
test('workout writes require teacher, correct owner, bounded payload and server timestamp',async()=>{
  const db=ctx(TEACHER),ref=doc(db,'usuarios','alice','treinos','atual');
  await assertSucceeds(setDoc(ref,area('alice')));
  for(const change of [{studentUid:'bob'},{professorId:'other'},{payload:'x'.repeat(650001)},{updatedAt:'2026-01-01'},{extra:'forbidden'}])await assertFails(setDoc(ref,{...area('alice'),...change}));
  await assertFails(setDoc(doc(db,'usuarios','pending','treinos','atual'),area('pending')));
  await assertFails(setDoc(doc(db,'usuarios','foreign','treinos','atual'),area('foreign')));
  await assertFails(setDoc(doc(db,'usuarios','alice','treinos','other'),area('alice')));
  await assertFails(setDoc(doc(ctx('alice'),'usuarios','alice','treinos','atual'),area('alice')));
});
test('teacher own document remains usable; deleting a linked profile works without opening push tokens',async()=>{
  const db=ctx(TEACHER);
  await assertSucceeds(updateDoc(doc(db,'usuarios',TEACHER),{nome:'Professor teste'}));
  await assertFails(deleteDoc(doc(db,'usuarios',TEACHER)));
  await assertFails(getDoc(doc(db,'avisosAparelhos',TEACHER,'aparelhos','private-token')));
  await assertFails(setDoc(doc(db,'avisosAparelhos',TEACHER,'aparelhos','new'),{token:'fixture'}));
  await assertSucceeds(deleteDoc(doc(db,'usuarios','new-photo')));
});
test('unknown collections and arbitrary nested paths stay denied',async()=>{
  for(const uid of ['alice',TEACHER]){
    const db=ctx(uid);await assertFails(setDoc(doc(db,'unmapped','record'),{owner:uid}));
    await assertFails(setDoc(doc(db,'usuarios',uid,'private','record'),{owner:uid}));
  }
});
