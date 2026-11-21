const main=document.getElementById('screen'),width=document.getElementById('width'),version=document.getElementById('version'),results=document.getElementById('results'),status=document.getElementById('status');
function show(){main.width=width.value;main.src='frame-'+version.value+'.html'}
width.onchange=show;version.onchange=show;
const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
async function check(size,font='',mode=''){
 const frame=document.createElement('iframe');frame.width=size;frame.height=880;
 const ready=new Promise(resolve=>frame.onload=resolve);frame.src='frame-178.html?font='+font+'&mode='+mode;document.getElementById('matrix').append(frame);await ready;await nextFrame();
 const doc=frame.contentDocument,scroll=doc.getElementById('evMainScroll');
 const root=doc.getElementById('historyContent');
 const descriptor=Object.getOwnPropertyDescriptor(frame.contentWindow.Element.prototype,'innerHTML');
 let writes=0;
 Object.defineProperty(root,'innerHTML',{configurable:true,get(){return descriptor.get.call(this)},set(value){writes++;descriptor.set.call(this,value)}});
 const rows=doc.querySelectorAll('[data-ev-open]'),initial=rows.length;
 const boxes=[doc.documentElement,doc.body,doc.getElementById('historyScreen'),scroll,doc.getElementById('historyContent')];
 const overflow=boxes.map(el=>({element:el.id||el.tagName,client:el.clientWidth,scroll:el.scrollWidth}));
 scroll.scrollLeft=200;const pan=scroll.scrollLeft;
 rows[0]?.click();await nextFrame();
 const detail=doc.getElementById('evOpenDetail')?.innerText||'';
 const variations=detail.includes('+5 kg')&&detail.includes('−5 kg');
 const sets=detail.includes('1ª série')&&detail.includes('2ª série')&&detail.includes('Professor')&&detail.includes('Aplicativo');
 const seriesText=Array.from(doc.querySelectorAll('.ap-ev-set-load small')).map(el=>el.textContent).join(' ');
 const seriesChanges=seriesText.includes('+5 kg')&&seriesText.includes('−5 kg');
 scroll.scrollTop=500;const beforeRefresh=scroll.scrollTop;writes=0;frame.contentWindow.renderHistory();
 const paintsPerRefresh=writes;
 const scrollRetained=Math.abs(scroll.scrollTop-beforeRefresh)<=1&&!!doc.getElementById('evOpenDetail');
 const sel=doc.getElementById('apEvolutionWorkout');sel.value='plan~tuesday';sel.dispatchEvent(new Event('change'));await nextFrame();
 const switched=doc.querySelectorAll('[data-ev-open]').length===3&&!doc.getElementById('historyContent').innerText.includes('Puxada alta');
 const selectFont=parseFloat(frame.contentWindow.getComputedStyle(doc.getElementById('apEvolutionWorkout')).fontSize);
 const touch=frame.contentWindow.getComputedStyle(scroll).touchAction;
 const pass=initial===8&&overflow.every(x=>x.scroll<=x.client+1)&&pan===0&&variations&&sets&&seriesChanges&&scrollRetained&&switched&&selectFont>=16&&touch.includes('pan-y')&&paintsPerRefresh===1;
 const row={width:size,font:font||'normal',mode:mode||'dark',initialExercises:initial,overflow,horizontalPan:pan,positiveAndNegative:variations,allSeriesAndSources:sets,perSeriesChanges:seriesChanges,scrollRetained,workoutSwitch:switched,paintsPerRefresh,selectFont,touchAction:touch,pass};
 frame.remove();return row;
}
async function run(){document.getElementById('run').disabled=true;status.textContent='Conferindo…';const rows=[];try{
 for(const size of [320,375,390,414,520])rows.push(await check(size));
 rows.push(await check(375,'large'));rows.push(await check(375,'','light'));
 const stateFrame=document.createElement('iframe'),stateReady=new Promise(resolve=>stateFrame.onload=resolve);stateFrame.src='frame-178.html';document.getElementById('matrix').append(stateFrame);await stateReady;
 const states=stateFrame.contentWindow.qaEvolutionStates();stateFrame.remove();
 const summary={cases:rows.length,passed:rows.filter(x=>x.pass).length,failed:rows.filter(x=>!x.pass).length,stateChecksPassed:states.pass,renderer:'delivered evolution UI; synthetic records'};
 const failed=summary.failed||!states.pass;
 results.textContent=JSON.stringify({summary,rows,states},null,2);status.className=failed?'fail':'ok';status.textContent=failed?'Falhou uma conferência; revisar antes de publicar.':'PASSOU · oito exercícios, aumentos e reduções, estados de conta e nenhum deslocamento horizontal nas sete configurações.';
}catch(e){status.textContent='Erro: '+e.message}finally{document.getElementById('run').disabled=false}}
document.getElementById('run').onclick=run;run();
