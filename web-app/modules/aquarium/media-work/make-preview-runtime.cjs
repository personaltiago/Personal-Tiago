'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
// Development-only transform. The production source is never rewritten.
function portableSHA(bytes){
 const constants=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const size=Math.ceil((bytes.length+9)/64)*64,data=new Uint8Array(size);data.set(bytes);data[bytes.length]=128;const bits=bytes.length*8;for(let i=0;i<8;i++)data[size-1-i]=Math.floor(bits/2**(i*8))&255;
 const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],words=new Uint32Array(64),rr=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let offset=0;offset<size;offset+=64){for(let i=0;i<16;i++){const p=offset+i*4;words[i]=((data[p]<<24)|(data[p+1]<<16)|(data[p+2]<<8)|data[p+3])>>>0}for(let i=16;i<64;i++){const a=words[i-15],b=words[i-2];words[i]=(words[i-16]+(rr(a,7)^rr(a,18)^(a>>>3))+words[i-7]+(rr(b,17)^rr(b,19)^(b>>>10)))>>>0}
  let [a,b,c,d,e,f,g,k]=h;for(let i=0;i<64;i++){const t1=(k+(rr(e,6)^rr(e,11)^rr(e,25))+((e&f)^(~e&g))+constants[i]+words[i])>>>0,t2=((rr(a,2)^rr(a,13)^rr(a,22))+((a&b)^(a&c)^(b&c)))>>>0;k=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0}for(const[i,n]of [a,b,c,d,e,f,g,k].entries())h[i]=(h[i]+n)>>>0;
 }
 return h.map(n=>n.toString(16).padStart(8,'0')).join('');
}
function transform(source){
 const old="async function digest(bytes){if(!host.crypto?.subtle)throw fail('Este aparelho não permite conferir o arquivo do aquário. Atualize o navegador ou o aplicativo.');return Array.from(new Uint8Array(await host.crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('')}",replacement=portableSHA.toString()+"\nasync function digest(bytes){return host.crypto?.subtle?Array.from(new Uint8Array(await host.crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join(''):portableSHA(bytes)}\nfunction previewURL(value){try{const u=new URL(value,host.location.href);return (u.protocol==='http:'||u.protocol==='https:')&&u.origin===host.location.origin&&!u.username&&!u.password}catch{return false}}";
 assert.equal(source.split(old).length,2,'Original production digest must match exactly');let output=source.replace(old,replacement);
 const guard="options.url!=='https://agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site/api/aquarium/v1/media.json'";assert.equal(output.split(guard).length,2,'Original production URL guard must match exactly');output=output.replace(guard,"(options.url!=='https://agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site/api/aquarium/v1/media.json'&&!previewURL(options.url))");
 return '/* PREVIEW ONLY: same-origin media URL and portable SHA-256 for HTTP QA. */\n'+output;
}
if(require.main===module){const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'fish-media.js'),'utf8'),output=process.argv[2]?path.resolve(process.argv[2]):path.join(__dirname,'fish-media.preview.js');fs.writeFileSync(output,transform(source));console.log(output)}
module.exports={transform,portableSHA};
