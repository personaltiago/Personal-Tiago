(function(global){
 'use strict';
 const missing=Symbol('missing'),plain=x=>x&&typeof x==='object'&&!Array.isArray(x),copy=x=>x===missing?missing:JSON.parse(JSON.stringify(x)),bad=new Set(['__proto__','prototype','constructor']);
 function stable(v){if(v===missing)return '#missing';if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(plain(v))return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v)}
 const same=(a,b)=>stable(a)===stable(b);
 function validate(v,depth=0){if(depth>64)throw Error('A agenda contém dados muito complexos.');if(v&&typeof v==='object'){for(const k of Object.keys(v)){if(bad.has(k))throw Error('A agenda contém um campo incompatível.');validate(v[k],depth+1)}}return v}
 function snapshot(agenda,assessments={clients:[]},appearance){const a=copy(agenda);delete a.workoutRest;delete a.lessonTimers;delete a.workoutDrafts;delete a.trainerProfile;return validate({agenda:a,assessments:copy(assessments),...(appearance?{appearance:copy(appearance)}:{})})}
 function meaningful(s){return ['students','lessons','payments','workoutPlans','workoutExecutions'].some(k=>s?.agenda?.[k]?.length>0)||s?.assessments?.clients?.length>0}
 function merge(base,local,remote,resolve=''){
  validate(local);validate(remote);const conflicts=[];
  const conflict=(b,l,r,path)=>{conflicts.push({path,localRemoved:l===missing,remoteRemoved:r===missing,local:l===missing?null:copy(l),remote:r===missing?null:copy(r)});return copy(resolve==='remote'?r:l)};
  const keyArray=a=>Array.isArray(a)&&a.every(v=>plain(v)&&typeof v.id==='string'&&v.id.length>0)&&new Set(a.map(v=>v.id)).size===a.length;
  function visit(b,l,r,path){
   if(same(l,r))return copy(l);if(same(l,b))return copy(r);if(same(r,b))return copy(l);
   if(plain(l)&&plain(r)&&(plain(b)||b===missing)){const out={};for(const k of new Set([...Object.keys(b===missing?{}:b),...Object.keys(l),...Object.keys(r)])){const v=visit(b!==missing&&Object.hasOwn(b,k)?b[k]:missing,Object.hasOwn(l,k)?l[k]:missing,Object.hasOwn(r,k)?r[k]:missing,path.concat(k));if(v!==missing)out[k]=v}return out}
   if(keyArray(l)&&keyArray(r)&&(keyArray(b)||b===missing)){
    const a=b===missing?[]:b,maps=[a,l,r].map(v=>new Map(v.map(x=>[x.id,x]))),merged=new Map();for(const id of new Set([...a,...l,...r].map(x=>x.id))){const v=visit(...maps.map(m=>m.has(id)?m.get(id):missing),path.concat(id));if(v!==missing)merged.set(id,v)}
    const baseIds=a.map(x=>x.id),common=new Set(baseIds.filter(id=>maps[1].has(id)&&maps[2].has(id))),order=v=>v.filter(x=>common.has(x.id)).map(x=>x.id),bo=order(a),lo=order(l),ro=order(r);let first=!same(lo,bo)?l:r;
    if(!same(lo,bo)&&!same(ro,bo)&&!same(lo,ro)){conflict(bo,lo,ro,path.concat('ordem'));first=resolve==='remote'?r:l}
    const ids=[...new Set([...first,...(first===l?r:l),...a].map(x=>x.id))];return ids.filter(id=>merged.has(id)).map(id=>merged.get(id));
   }
   return conflict(b,l,r,path);
  }
  return {data:visit(base===undefined?missing:base,local,remote,[]),conflicts};
 }
 global.APTeacherSyncModel=Object.freeze({stable,same,snapshot,meaningful,merge,validate});
})(globalThis);
