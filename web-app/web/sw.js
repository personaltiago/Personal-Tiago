'use strict';
const CACHE='agenda-personal-web-shell-v9',FILES=['/app/','/app/web.css','/app/boot.js','/app/registration-notices.js','/app/registration-notices.css','/app/platform.js','/app/publication-panel.js','/app/icon.png','/app/icon-192.png','/app/manifest.webmanifest','/app/teacher-sync-model.js','/app/teacher-sync-preferences.js','/app/teacher-sync.js','/app/teacher-sync.css','/app/firebase-loader.js','/app/firebase.js','/app/login-session.js'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(FILES);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('agenda-personal-web-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);if(r.method!=='GET')return;
 const shell=u.origin===self.location.origin&&FILES.includes(u.pathname),sdk=u.origin==='https://www.gstatic.com'&&/^\/firebasejs\/(?:10\.14\.1|13\.0\.0)\/[a-zA-Z0-9._-]+\.js$/.test(u.pathname);
 // Never cache Firebase credentials, API responses, photos, or workout records.
 if(!shell&&!sdk)return;
 event.respondWith((async()=>{const c=await caches.open(CACHE);if(sdk){const saved=await c.match(r);if(saved)return saved}try{const result=await fetch(r);if(result.ok&&result.type!=='opaque')await c.put(r,result.clone());return result}catch(e){const saved=await c.match(r);if(saved)return saved;throw e}})());
});
