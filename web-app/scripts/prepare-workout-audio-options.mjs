import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';

const [inputPath,outputPath]=process.argv.slice(2);
const input=await readFile(inputPath);
const hash=value=>createHash('sha256').update(value).digest('hex');
assert.equal(hash(input),'e72e5df8fb7b624cf49034581648cfc12742c02a042525ee8ebf011fa2e57c40');
const base=JSON.parse(input);
assert.equal(base.version,'1.12.230');
assert.equal(base.sequence,336);
const version='1.12.231';
const next={...base,version,sequence:337,files:{...base.files}};
const source=async file=>readFile(new URL('../app/'+file,import.meta.url),'utf8');
const [client,ui,css]=await Promise.all(['workout-audio.js','workout-audio-options-ui.js','workout-audio-options.css'].map(source));
new vm.Script(client);
new vm.Script(ui);

function replaceUnique(html,before,after){
 assert.equal(html.split(before).length,2,before.slice(0,140));
 return html.replace(before,()=>after);
}
for(const name of ['index.html','professor.html']){
 let html=base.files[name];
 const previous=html.match(/<script id="ap-workout-audio">([\s\S]*?)<\/script>/);
 assert.equal(hash(previous[1]),'593ba7355d216b0a35c7cff05d84acf618d56f8baa3a6ab73c6b8c06b94cdb78');
 html=replaceUnique(html,previous[0],'<script id="ap-workout-audio">'+client+'</script>');
 const head=html.match(/<\/head>\s*<body>/)?.[0];
 const end=html.match(/<\/body>\s*<\/html>\s*$/)?.[0];
 assert.ok(head&&end);
 html=replaceUnique(html,head,'<style id="ap-workout-audio-options-css">'+css+'</style>\n'+head);
 html=replaceUnique(html,end,'<script id="ap-workout-audio-options-ui">'+ui+'</script>\n'+end);
 if(name==='index.html'){
  const profile='<button id="apProfilePet"';
  html=replaceUnique(html,profile,`<button id="apStudentAudioOpen" hidden type="button" class="profile-option" aria-expanded="false" aria-controls="apStudentAudioOptions">
   <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3m13 0a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/></svg></span>
   <div><strong>Sons do treino</strong><small>Escolha os avisos de descanso e cardio</small></div><span class="profile-chevron" data-profile-icon="chevron"></span>
  </button>
  <section id="apStudentAudioOptions" class="profile-panel ap-audio-choices" tabindex="-1" aria-labelledby="apStudentAudioTitle" hidden><h2 id="apStudentAudioTitle">Sons do treino</h2></section>
  `+profile);
 }else{
  for(const kind of ['rest','cardio']){
   const start=html.indexOf('id="'+kind+'AudioShareStatus"'),end=html.indexOf('</section>',start);
   assert.ok(start>=0&&end>start);
   const disclosure='<details id="apSharedAudio-'+kind+'" class="ap-audio-choices"><summary>Opções de áudio para os alunos</summary></details>';
   html=html.slice(0,end)+disclosure+html.slice(end);
  }
 }
 next.files[name]=html;
}
for(const name of Object.keys(next.files))next.files[name]=next.files[name].replaceAll(base.version,version);
next.notes='O professor pode enviar vários áudios para o fim do descanso e o fim do cardio. Cada aluno pode ouvir as opções e escolher um som por aviso em Perfil → Sons do treino. As escolhas ficam salvas no aparelho e os áudios selecionados podem tocar sem internet após o download. Preserva o áudio já enviado, o sinal padrão e as demais funções da 1.12.230.';
const output=Buffer.from(JSON.stringify(next));
assert(output.length<24*1024*1024,'Limite de importação de 24 MiB');
await writeFile(outputPath,output);
console.log(JSON.stringify({version,sequence:next.sequence,bytes:output.length,sha256:hash(output)}));
