(function(global){
 'use strict';
 const teacher='R2EmnDVcvMWt7TjPxOP6DjW1VOn1';
 const keys=Object.freeze({brand:'ap_professor_marca_159_professor_teste',theme:'agendaPersonalTL_theme_v1',design:'agendaPersonalTL_design_v1',backgrounds:'agendaPersonalTL_appearance_backgrounds_v1',iconFinish:'agendaPersonalTL_icon_finish_v1',teacherText:'agendaPersonalTL_teacher_text_v1',mascot:'agenda_teacher_mascot_v1_'+encodeURIComponent(teacher),petVisible:'agenda_pet_visible_v1_'+encodeURIComponent('teacher:'+teacher)});
 function capture(){const values={};for(const [name,key]of Object.entries(keys)){const raw=localStorage.getItem(key);values[name]=raw===null?null:JSON.parse(raw)}return {version:1,values}}
 function valid(data){if(!data||data.version!==1||!data.values||typeof data.values!=='object'||Array.isArray(data.values)||Object.keys(data).some(k=>!['version','values','profile'].includes(k))||Object.keys(keys).some(k=>!Object.hasOwn(data.values,k))||Object.keys(data.values).some(k=>!Object.hasOwn(keys,k)))throw Error('O visual da conta está incompleto.');return data}
 function raw(){return Object.fromEntries(Object.values(keys).map(key=>[key,localStorage.getItem(key)]))}
 function restore(values,expected){for(const key of Object.values(keys)){if(expected&&localStorage.getItem(key)!==expected[key])continue;const value=values[key];if(value===null||value===undefined)localStorage.removeItem(key);else localStorage.setItem(key,value)}}
 function write(data){valid(data);for(const [name,value]of Object.entries(data.values)){if(value===null)localStorage.removeItem(keys[name]);else localStorage.setItem(keys[name],JSON.stringify(value))}}
 function refresh(){
  dispatchEvent(new StorageEvent('storage',{key:null}));
  try{window.parent.dispatchEvent(new StorageEvent('storage',{key:null}));window.parent.APteacherMascot?.refreshCard()}catch(_){}
  const b=(()=>{try{return JSON.parse(localStorage.getItem(keys.brand)||'null')}catch(_){return null}})();
  if(b){const initials=String(b.name||'AP').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').replace(/[<>&"']/g,'');const bg=/^#[a-f0-9]{6}$/i.test(b.bg)?b.bg:'#17111e',color=/^#[a-f0-9]{6}$/i.test(b.main)?b.main:'#a12cff';const logo=b.logo||'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" rx="28" fill="'+bg+'"/><text x="90" y="108" text-anchor="middle" fill="'+color+'" font-size="62" font-family="Arial">'+initials+'</text></svg>');for(const img of document.querySelectorAll('.brand img,.more-identity-logo'))img.src=logo;document.title='Agenda Personal · '+String(b.name||'Professor')}
 }
 global.APTeacherSyncPreferences=Object.freeze({keys,capture,valid,raw,restore,write,refresh});
})(globalThis);
