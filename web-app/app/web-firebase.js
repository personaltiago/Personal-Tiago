import {initializeApp,getApps} from 'firebase/app';
import {initializeAuth,getAuth as existingAuth,setPersistence,indexedDBLocalPersistence,
  browserLocalPersistence,browserSessionPersistence,onAuthStateChanged,
  signInWithEmailAndPassword,signOut,sendPasswordResetEmail} from 'firebase/auth';
import {getFirestore,collection,doc,getDoc,getDocs,onSnapshot,query,serverTimestamp,setDoc,updateDoc,where} from 'firebase/firestore';

function getAuth(app){
  try{
    // Email/password needs no popup resolver. Read existing local/session users
    // while preferring IndexedDB for durable sessions inside the iPhone frame.
    return initializeAuth(app,{persistence:[indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence]});
  }catch(error){if(error.code==='auth/already-initialized')return existingAuth(app);throw error}
}
window.APWebFirebase=Object.freeze([
  {initializeApp,getApps},
  {getAuth,setPersistence,indexedDBLocalPersistence,browserLocalPersistence,
    browserSessionPersistence,onAuthStateChanged,signInWithEmailAndPassword,signOut,sendPasswordResetEmail},
  {getFirestore,collection,doc,getDoc,getDocs,onSnapshot,query,serverTimestamp,setDoc,updateDoc,where}
]);
