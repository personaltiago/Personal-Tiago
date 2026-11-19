'use strict';
// Abre as janelas com conteúdo realista (estado de exemplo), tira foto de cada uma e mede geometria e alcance do fim.
// uso: node realista.js <pagina.html> <css|-> <prefixo> [LxA] [design] [modo]   (env SO=id1,id2 limita; FIM=0 não rola até o fim)
const fs = require('node:fs');
const {launch, sleep, BASE, SAIDA} = require('./cdp.js');
const {estado} = require('./semente.js');
const APP = process.argv[2], CSS = process.argv[3] && process.argv[3] !== '-' ? fs.readFileSync(process.argv[3], 'utf8') : '';
const PREF = process.argv[4] || 'r';
const [W_, H_] = (process.argv[5] || '390x844').split('x').map(Number);
const DESIGN = process.argv[6] || 'current', MODO = process.argv[7] || 'dark';
const DESIGN_ID = {current: null, neon: 'neon-tl', metal: 'metal-tl', pro: 'pro-tl', deep: 'deep-tl'}[DESIGN];
const CL = require('./classes.js'); // {paginas, fora}: vem do gerador do pacote
const FICHA = `W.showScreen('workouts');W.openWorkoutStudent('s1');W.selectWorkoutPlan('p1');`;
const DIA = FICHA + `W.openWorkoutDay('d1');`;
const hojeIso = new Date().toISOString().slice(0, 10);
// id da janela → JS que a abre do jeito natural (com o contexto que ela precisa)
const ABRIR = {
  studentDialog: `W.openNewStudent()`,
  studentProfileDialog: `W.openStudentProfile('s1')`,
  studentPhotoDialog: `W.openStudentProfile('s1');W.openStudentPhotoOptions()`,
  studentLocationDialog: `W.openStudentProfile('s1');W.openStudentLocationEditor()`,
  studentPhoneDialog: `W.openStudentProfile('s1');W.openStudentPhoneEditor()`,
  studentTypeDialog: `W.openStudentProfile('s1');W.openStudentTypeEditor()`,
  studentAreaDialog: `W.openStudentProfile('s1');W.openCurrentStudentArea()`,
  studentLessonsDialog: `W.eval("state.lessons.push({id:'l4',studentId:'s1',date:'${hojeIso}',time:'18:30',duration:60,type:'presencial',location:'Academia Bio Fit',lead:30,repeat:'weekly',repeatDays:[2,4],notes:''})");W.openStudentLessons('s1')`,
  lessonDialog: `W.showLessonEditor()`,
  rescheduleDialog: `W.openReschedule('l1','${hojeIso}')`,
  trainerProfileDialog: `W.openTrainerProfile()`,
  colorPanelDialog: `W.openColorPanel()`,
  waitlistEditor: `W.openWaitlistEditor()`,
  registrationLinkDialog: `W.openRegistrationLink()`,
  studentAreaConnectionDialog: `W.openStudentAreaConnection()`,
  workoutStudentDialog: FICHA,
  workoutCatalogDialog: FICHA + `W.openWorkoutCatalog()`,
  workoutPlanDialog: FICHA + `W.openWorkoutPlanEditor('p1')`,
  workoutDayEditDialog: FICHA + `W.openWorkoutDayEditor('d1')`,
  workoutDayDialog: DIA,
  workoutExerciseDialog: DIA + `W.openWorkoutExerciseEditor('e1')`,
  workoutAudienceDialog: FICHA + `W.openWorkoutAudience()`,
  workoutHistoryDialog: FICHA + `W.openWorkoutHistory()`,
  workoutTechniquesDialog: FICHA + `W.openWorkoutTechniques('manage')`,
  workoutTechniqueEditorDialog: FICHA + `W.openWorkoutTechniqueEditor('','preset')`,
  workoutBisetEditorDialog: DIA + `W.openWorkoutBisetEditor()`,
  workoutRestDialog: DIA + `W.openWorkoutRest('e1',false)`,
  workoutExecutionDialog: DIA + `W.openWorkoutExecution()`,
};
(async () => {
  const c = await launch({w: W_, h: H_, dpr: 2});
  const ev = body => c.evaluate(`(()=>{const W=document.getElementById('app').contentWindow,D=W.document;${body}})()`);
  fs.mkdirSync(SAIDA + '/r', {recursive: true});
  try {
    const url = BASE + '/dialogo.html?app=' + APP;
    await c.navigate(url); await sleep(300);
    await c.evaluate(`localStorage.setItem('agendaPersonalTL_v1', ${JSON.stringify(JSON.stringify(estado()))});` + (DESIGN_ID ? `localStorage.setItem('agendaPersonalTL_design_v1', JSON.stringify({version:1,id:${JSON.stringify(DESIGN_ID)}}))` : `localStorage.removeItem('agendaPersonalTL_design_v1')`));
    await c.navigate(url);
    for (let i = 0; i < 120; i++) { let ok = false; try { ok = await c.evaluate(`(()=>{try{const W=document.getElementById('app').contentWindow;return !!(W.showScreen&&W.openDialog&&W.AgendaAppearance&&W.document.getElementById('screen-more'))}catch(e){return false}})()`); } catch (e) {} if (ok) break; await sleep(150); }
    await sleep(2200);
    await ev(`return W.AgendaAppearance.setMode(${JSON.stringify(MODO)})`); await sleep(600);
    if (CSS) await ev(`const s=D.createElement('style');s.id='css-candidato';s.textContent=${JSON.stringify(CSS)};D.head.appendChild(s);`);
    const ids = await ev(`return [...D.querySelectorAll('.dialog')].map(d=>d.id)`);
    const alvo = process.env.SO ? process.env.SO.split(',') : ids;
    const sem = await ev(`return W.eval('({alunos:state.students.length,planos:state.workoutPlans.length})')`);
    console.log('estado semeado:', JSON.stringify(sem));
    const linhas = [];
    for (const id of alvo) {
      await ev(`[...D.querySelectorAll('.dialog.open')].forEach(d=>W.closeDialog(d.id));W.showScreen('more');`); await sleep(250);
      let como = 'natural', erro = '';
      if (ABRIR[id]) { try { await ev(`${ABRIR[id]};return 1`); } catch (e) { erro = e.message.split('\n')[0].slice(0, 90); } }
      await sleep(650);
      let aberta = await ev(`return D.getElementById(${JSON.stringify(id)}).classList.contains('open')`);
      if (!aberta) { como = 'openDialog'; await ev(`W.openDialog(${JSON.stringify(id)});return 1`); await sleep(500); aberta = await ev(`return D.getElementById(${JSON.stringify(id)}).classList.contains('open')`); }
      if (!aberta) { linhas.push(`${id.padEnd(30)} NÃO ABRIU ${erro}`); continue; }
      const m = await ev(`
        const d=D.getElementById(${JSON.stringify(id)}), sh=d.querySelector(':scope>.sheet'), b=sh.getBoundingClientRect();
        const abertas=[...D.querySelectorAll('.dialog.open')].map(x=>x.id);
        const bar=D.querySelector('.panel-return-bar'), vis=bar&&W.getComputedStyle(bar).display!=='none';
        return {top:Math.round(b.top),bottom:Math.round(b.bottom),vh:W.innerHeight,max:sh.scrollHeight-sh.clientHeight,barTop:vis?Math.round(bar.getBoundingClientRect().top):null,abertas};`);
      await c.shot(`${SAIDA}/r/${PREF}-${DESIGN}-${MODO}-${id}.png`);
      let fim = '';
      if (process.env.FIM !== '0') {
        // rola até o fim (o cartão, ou o filho que rola) e mede o último item visível contra a barra
        const f = await ev(`
          const d=D.getElementById(${JSON.stringify(id)}), sh=d.querySelector(':scope>.sheet');
          const rol=[sh,...sh.querySelectorAll('*')].filter(e=>e.scrollHeight-e.clientHeight>20&&/(auto|scroll)/.test(W.getComputedStyle(e).overflowY));
          rol.forEach(e=>{e.scrollTop=e.scrollHeight});
          const vis=e=>{const r=e.getBoundingClientRect(),cs=W.getComputedStyle(e);return r.height>0&&r.width>0&&cs.visibility!=='hidden'&&cs.display!=='none'};
          const todos=[...sh.querySelectorAll('*')].filter(vis).filter(e=>!e.querySelector('*')||e.matches('input,select,textarea,button,svg,canvas,img'));
          const ult=todos.reduce((a,e)=>Math.max(a,e.getBoundingClientRect().bottom),0);
          return {ult:Math.round(ult),rolantes:rol.length};`);
        await sleep(250);
        await c.shot(`${SAIDA}/r/${PREF}-${DESIGN}-${MODO}-${id}-fim.png`);
        const lim = m.barTop === null ? m.vh : m.barTop;
        fim = ` fim: último=${f.ult} limite=${lim} folga=${lim - f.ult}${lim - f.ult < 0 ? ' <<< ESCONDIDO' : ''} rolantes=${f.rolantes}`;
      }
      const eh = CL.paginas.includes(id) ? 'PÁGINA' : 'fora  ';
      linhas.push(`${eh} ${id.padEnd(30)} via=${como}${erro ? ' (erro: ' + erro + ')' : ''} top=${m.top} base=${m.bottom}/${m.vh} rolagem=${m.max}${fim} pilha=[${m.abertas.join('>')}]`);
    }
    console.log(linhas.join('\n'));
    const errs = c.logs.filter(l => /ERRO-PAGINA/.test(l)); if (errs.length) console.log('ERROS-PAGINA', [...new Set(errs)].slice(0, 5).join(' | '));
  } finally { c.close(); }
  process.exit(0);
})().catch(e => { console.log('FALHA', e.message); process.exit(1); });
