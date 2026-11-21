// Barra do "Publicar para os alunos": sequência real de chamadas da função que desenha a barra (c) em cada situação.
const {chromium}=require('/tmp/pwc/node_modules/playwright-core');
const T=19_200_000;
const casos={
 'queda em 25% (envio para em 25%, depois o catch final)':[['authorizing',0,0],['uploading',0,T],['uploading',T*0.25,T],['error',T*0.25,T],['error',T,T]],
 'arquivo enviado, servidor não confirma':[['authorizing',0,0],['uploading',T*0.5,T],['confirming',T,T],['error',T,T],['error',T,T]],
 'falha antes de começar o envio':[['authorizing',0,0],['error',0,0]],
 'sucesso':[['authorizing',0,0],['uploading',T*0.6,T],['confirming',T,T],['done',T,T]],
};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const v of ['300','301']){for(const [nome,seq] of Object.entries(casos)){
 const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(m=>{window.__marcacao=m},require('fs').readFileSync('/tmp/t301/marcacao.html','utf8'));await pg.goto('http://127.0.0.1:8798/'+v+'-index.html');await pg.waitForTimeout(1500);
 const r=await pg.evaluate(seq=>{if(typeof window.__apDesenhar!=='function')return {erro:'sem função'};const box=document.createElement('div');box.innerHTML=window.__marcacao;document.body.append(box);for(const x of seq)window.__apDesenhar(...x);const g=id=>document.getElementById(id);
  return {titulo:g('apPublishProgressTitle').textContent,pct:g('apPublishProgressPercent').textContent,barra:g('apPublishProgressBar').getAttribute('value'),mb:g('apPublishProgressDetails').textContent,estado:g('apPublishProgress').dataset.state}},seq);
 console.log(v,'|',nome,'|',JSON.stringify(r),errs.length?'ERROS '+errs.slice(0,2):'');await pg.close()}}
await b.close()})();
