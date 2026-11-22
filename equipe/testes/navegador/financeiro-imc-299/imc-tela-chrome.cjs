const {chromium}=require('/tmp/pwc/node_modules/playwright-core');
const casos=[['70','160','67'],['30','160','67'],['','160','67'],['65','160','54'],['65','160','72'],['60','170','80'],['59','170','80']];
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const v of ['298','299']){
  const pg=await b.newPage({viewport:{width:412,height:900}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file:///tmp/t299/pag/'+v+'-avaliacoes.html');await pg.waitForTimeout(1200);
  for(const [age,h,w] of casos){
   const r=await pg.evaluate(([age,h,w])=>{const set=(n,x)=>{const e=document.querySelector('[name="'+n+'"]');if(!e)return n+'?';e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return ''};
     const miss=set('age',age)+set('height',h)+set('weight',w);
     return {miss,curto:document.getElementById('reference-weight-value').textContent,texto:document.getElementById('projection-reference').textContent}},[age,h,w]);
   console.log(v,'idade',age||'(vazia)',h,w,'|',r.miss,r.curto,'|',r.texto);
  }
  console.log(v,'erros de página',errs.slice(0,3));
  await pg.close();
 }
 await b.close();
})();
