'use strict';
// High-confidence findings only. Never prints the matched value.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
function findings(text){
 const types=[];
 if(/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/.test(text))types.push('chave privada PEM');
 if(/["'`]gh[pousr]_[A-Za-z0-9]{36,255}["'`]/.test(text))types.push('token GitHub');
 if(/["'`]github_pat_[A-Za-z0-9_]{60,255}["'`]/.test(text))types.push('token GitHub fine-grained');
 if(/"type"\s*:\s*"service_account"/.test(text)&&/"private_key"\s*:/.test(text))types.push('credencial service account');
 return types;
}
async function scan(root){
 const files=cp.execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root}).toString().split('\0').filter(Boolean),problems=[];let checked=0;
 for(const file of new Set(files)){
  if(!/\.(?:html?|[cm]?js|json|ya?ml|sh|md|txt|pem|key|env)$/.test(file)&&!/(?:^|\/)\.env(?:\.|$)/.test(file))continue;
  const full=path.join(root,file);if(!fs.existsSync(full))continue;checked++;let carry='',types=new Set();
  for await(const chunk of fs.createReadStream(full,{encoding:'utf8',highWaterMark:128*1024})){
   const value=carry+chunk;for(const item of findings(value))types.add(item);carry=value.slice(-4096);
  }
  if(types.size)problems.push({file,types:[...types]});
 }
 return {checked,problems};
}
if(require.main===module)scan(path.resolve(__dirname,'..')).then(result=>{
 for(const problem of result.problems)console.error(problem.file+': '+problem.types.join(', '));
 console.log(result.checked+' arquivos de texto disponíveis verificados; '+result.problems.length+' achados de alta confiança. Valores nunca são exibidos.');
 process.exitCode=result.problems.length?1:0;
}).catch(()=>{console.error('Falha ao verificar arquivos.');process.exitCode=1;});
module.exports={findings};
