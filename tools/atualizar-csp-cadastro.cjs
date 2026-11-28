'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),file=path.join(root,'cadastro-aluno.html');
const html=fs.readFileSync(file,'utf8');
const hashes=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(match=>!/(?:^|\s)src\s*=/.test(match[1]))
  .map(match=>"'sha256-"+crypto.createHash('sha256').update(match[2]).digest('base64')+"'");
const policy=["default-src 'self'", "base-uri 'self'", "object-src 'none'", "form-action 'self'",
  "script-src 'self' https://www.gstatic.com "+hashes.join(' '),
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.googleapis.com",
  "frame-src https://agenda-personal-bdb58.firebaseapp.com"].join('; ');
const meta='<meta http-equiv="Content-Security-Policy" content="'+policy+'">';
const next=html.includes('http-equiv="Content-Security-Policy"')?html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/,meta):html.replace('</title>','</title>\n'+meta);
if(process.argv.includes('--conferir')){if(next!==html)throw Error('CSP do cadastro desatualizada. Rode node tools/atualizar-csp-cadastro.cjs.');console.log('CSP confere com os scripts reais.');}
else fs.writeFileSync(file,next);
