/* Synthetic records only. No account, login, network or real student data. */
const params=new URLSearchParams(location.search);
const qaNames=['Puxada alta com barra triângulo W','Pulldown com corda','Remada baixa triângulo','Face pull','Rosca direta na polia (barra W)','Rosca martelo com halteres','Abdominal dead bug','Prancha com apoio alternado'];
const qaWorkouts=[{id:'plan~monday',label:'Treino de costas e braços',weekday:1,planName:'Ficha de conferência',exercises:qaNames.map((name,i)=>({id:'ex-'+i,name}))},{id:'plan~tuesday',label:'Treino de pernas',weekday:2,exercises:['Agachamento','Leg press','Panturrilha'].map((name,i)=>({id:'leg-'+i,name}))}];
const qaRecord=(i,loads)=>({exerciseId:'ex-'+i,name:qaNames[i],loads,done:loads.map(()=>true),targets:loads.map(()=>'10'),sets:loads.length,reps:'10'});
const qaWhen=days=>Date.now()-days*86400000;
const qaHistory=[{id:'plan~monday',finishedAt:qaWhen(15),startedAt:qaWhen(15)-1800000,durationMs:1800000,source:'teacher',teacherRecordId:'one',exerciseRecords:[qaRecord(0,[5,10]),qaRecord(1,[null,0]),qaRecord(2,[9.4]),qaRecord(3,[15]),qaRecord(4,[10])]},
{id:'plan~monday',finishedAt:qaWhen(8),startedAt:qaWhen(8)-1800000,durationMs:1800000,source:'app',exerciseRecords:[qaRecord(0,[5,15]),qaRecord(1,[5])]},
{id:'plan~monday',finishedAt:qaWhen(1),startedAt:qaWhen(1)-1800000,durationMs:1800000,source:'teacher',teacherRecordId:'three',exerciseRecords:[qaRecord(0,[5,10]),qaRecord(2,[14.4])]},
{id:'plan~tuesday',finishedAt:qaWhen(2),startedAt:qaWhen(2)-1800000,durationMs:1800000,exerciseRecords:[{exerciseId:'leg-0',name:'Agachamento',loads:[40],done:[true],targets:['10'],sets:1,reps:'10'}]}];
window.__AP_STUDENT_CONTEXT={role:'student',storageId:'synthetic-qa',area:{studentId:'synthetic'}};
function el(id){return document.getElementById(id)}
function prefs(){return{color:'#f52283',font:params.get('font')==='large'?'grande':'media',mode:params.get('mode')==='light'?'claro':'escuro'}}
function currentProfileGender(){return'Feminino'}
function exStore(){return{history:qaHistory}}
function workoutsForProfile(){return qaWorkouts}
function htmlSafe(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function iconSvg(){return''}
function photoForWorkout(){return''}
const EX_REFERENCE_THUMBS=[],EXERCISES_FEMALE={A:[['Exercício de exemplo','','','10']]};
window.qaEvolutionStates=()=>{
 const savedWorkouts=qaWorkouts.slice(),savedHistory=qaHistory.slice(),savedContext=window.__AP_STUDENT_CONTEXT;
 const rows=()=>document.querySelectorAll('[data-ev-open]').length;
 const text=()=>document.getElementById('historyContent').textContent;
 const result={};
 try{
  qaHistory.splice(0);renderHistory();result.emptyKeepsPrescription=rows()===8&&text().includes('Ainda sem registro');
  evTogglePreview();result.example=rows()>0&&text().includes('dados fictícios');
  evTogglePreview();result.leavesExample=rows()===8&&!text().includes('dados fictícios');
  qaWorkouts.splice(0,qaWorkouts.length,{id:'other',label:'Outro treino',exercises:[{id:'new',name:'Exercício da outra conta'}]});
  qaHistory.push({id:'other',finishedAt:Date.now(),durationMs:60000,exerciseRecords:[{exerciseId:'new',name:'Exercício da outra conta',loads:[99],done:[true],targets:['10']}]});
  window.__AP_STUDENT_CONTEXT={role:'student',storageId:'other-synthetic-account',area:{studentId:'other'}};
  dispatchEvent(new Event('ap-account-changed'));renderHistory();
  result.accountIsolation=rows()===1&&text().includes('99 kg')&&!text().includes('Puxada alta');
  qaWorkouts.splice(0);qaHistory.splice(0);renderHistory();
  result.noWorkouts=rows()===0&&document.getElementById('apEvolutionWorkout').disabled&&!text().includes('99 kg');
  result.pass=Object.values(result).every(Boolean);
 }finally{
  qaWorkouts.splice(0,qaWorkouts.length,...savedWorkouts);qaHistory.splice(0,qaHistory.length,...savedHistory);
  window.__AP_STUDENT_CONTEXT=savedContext;evPreview=false;dispatchEvent(new Event('ap-account-changed'));renderHistory();
 }
 return result;
};
