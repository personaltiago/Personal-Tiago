const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const esbuild=require(require.resolve('esbuild',{paths:[__dirname,path.join(__dirname,'media-work/deps')]}));
const ROOT = __dirname;
const basePath = process.argv[2], output = process.argv[3];
if (!basePath || !output) throw Error('Usage: node build-update.cjs BASE.agenda.json OUTPUT_DIR');
const BASE = JSON.parse(fs.readFileSync(basePath, 'utf8'));
const changes = [];
const hash = source => crypto.createHash('sha256').update(source).digest('hex');
function once(source, needle, replacement) {
  if (source.split(needle).length !== 2) throw Error('Expected one match: ' + needle.slice(0, 130));
  return source.replace(needle, () => replacement);
}
function block(page, id, transform, javascript = true) {
  const opening = `<script${id === 'ap-mascot-home-assets' ? ' type="application/json"' : ''} id="${id}">`;
  const html = BASE.files[page];
  const start = html.indexOf(opening);
  if (start < 0 || start !== html.lastIndexOf(opening)) throw Error('Missing or duplicated block: ' + id);
  const end = html.indexOf('</script>', start + opening.length);
  const prior = html.slice(start + opening.length, end);
  const content = transform(prior);
  if (javascript) new vm.Script(content, { filename: id });
  if (/<\/\s*(?:script|style)\b/i.test(content)) throw Error('Invalid block content: ' + id);
  changes.push({page, id, before: hash(prior), after: hash(content), content});
  return content;
}
const script = (id, transform) => block('index.html', id, transform);
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'media-config.json')));
const thumbs = JSON.parse(fs.readFileSync(path.join(ROOT, 'thumbnails.json')));
function runtime(preview = false) {
  const files = [preview ? 'media-work/fish-media.preview.js' : 'fish-media.js', 'fish-motion.js', 'water-motion.js', 'fish-renderer.js', 'aquarium.js'];
  const settings = `globalThis.__AP_AQUARIUM_CONFIG__=${JSON.stringify(config)};\nglobalThis.__AP_AQUARIUM_THUMBNAILS__=${JSON.stringify(thumbs)};\n`;
  const source = settings + files.map(name => fs.readFileSync(path.join(ROOT, name), 'utf8')).join('\n');
  return esbuild.transformSync(source, {minify:true, target:'es2020', charset:'utf8'}).code;
}
const code = runtime();
const homes=[['jardim','Jardim submerso',0,'Plantas, pedras e luz natural atravessando a água.'],['ruinas','Ruínas submersas',200,'Arcos de pedra em um refúgio aquático.'],['cristais','Gruta de cristais',300,'Cristais violetas e reflexos suaves no fundo da água.'],['cachoeira','Cachoeira submersa',400,'Água em movimento entre pedras cobertas de musgo.'],['naufragio','Naufrágio',500,'Um barco antigo e um baú no fundo do aquário.']].map(([id,name,price,copy])=>({id:'aq-'+id,name,kind:'home',species:'fish',price,copy}));
script('ap-student-mascot-model',s=>{
  s=once(s,'j=Object.freeze({wolf:','j=Object.freeze({fish:Object.freeze([t("original","Vermelho e branco","#e74448"),t("blue","Azul e branco","#347fce"),t("gold","Dourado e preto","#dca93f")]),wolf:');
  s=once(s,'{id:"wolf",name:"Lobo"}]),O=','{id:"wolf",name:"Lobo"},{id:"fish",name:"Betta"}]),O=');
  s=once(s,'O=Object.freeze({wolf:','O=Object.freeze({fish:[],wolf:');
  s=once(s,'[{id:"default",name:"Pose original",copy:"A posição clássica do seu companheiro.",price:0},','[{id:"default",name:a==="fish"?"Nadando":"Pose original",copy:a==="fish"?"Nado livre pelo aquário.":"A posição clássica do seu companheiro.",price:0},');
  s=once(s,'...c.flatMap(a=>b(a.id)',homes.map(h=>JSON.stringify(h)).join(',')+',...c.flatMap(a=>b(a.id)');
  s=once(s,'copy:"Pelagem do "+a.name+" para todas as fases."','copy:a.id==="fish"?"Cor do peixe para as três fases.":"Pelagem do "+a.name+" para todas as fases."');
  s=once(s,'owned:["home-yard"],','aquariumHome:"aq-jardim",landHome:"home-yard",owned:["home-yard","aq-jardim"],');
  s=once(s,'o.id==="home-yard"||i.includes(o.id)','o.id==="home-yard"||o.id==="aq-jardim"||i.includes(o.id)');
  s=once(s,'s.rewards=Array.isArray(a.rewards)','(function(){const valid=(id,fish)=>s.owned.includes(id)&&f.some(v=>v.id===id&&v.kind==="home"&&(v.species==="fish")===fish);s.aquariumHome=[a.aquariumHome,a.equipped?.home].find(id=>valid(id,true))||"aq-jardim";s.landHome=[a.landHome,a.equipped?.home].find(id=>valid(id,false))||"home-yard";s.equipped.home=s.species==="fish"?s.aquariumHome:s.landHome})(),s.rewards=Array.isArray(a.rewards)');
  s=once(s,'const e=x(r),n=f.find(d=>d.id===i);','const e=x(r),n=f.find(d=>d.id===i);if(["buy","use"].includes(s)&&n?.kind==="home"&&(n.species==="fish")!==(e.species==="fish"))return{ok:false,error:e.species==="fish"?"Escolha um dos aquários do seu peixe.":"Este cenário é exclusivo do peixe."};');
  s=once(s,'(e.species=i,{ok:!0,state:e,message:', '(e.species=i,e.equipped.home=i==="fish"?e.aquariumHome:e.landHome,{ok:!0,state:e,message:');
  s=once(s,'(e.equipped[n.kind]=i,{ok:!0,state:e,message:', '(e.equipped[n.kind]=i,n.kind==="home"&&(e[e.species==="fish"?"aquariumHome":"landHome"]=i),{ok:!0,state:e,message:');
  return '/* Agenda Personal: aquário */\n' + code + s;
});
script('ap-student-mascot-art',s=>{
  s=s.replaceAll('APMascotModel.choices','APMascotModel.choices.filter(e=>e.id!=="fish")');
  s=once(s,'l=o=>e.APMascotBear?.portrait(o)||','l=o=>o?.species==="fish"?e.APAquarium.portrait(o):e.APMascotBear?.portrait(o)||');
  s=once(s,'function g(t){return ','function g(t){if(t?.species==="fish")return e.APAquarium.asset(t);return ');
  s=once(s,'function M(t,a=!1,o="",s=!1){','function M(t,a=!1,o="",s=!1){if(t?.species==="fish")return e.APAquarium.render(t);');
  s=once(s,'document.head.append(e),e.remove()','document.head.append(e),e.remove(),globalThis.APAquarium?.wrapGestures()');
  s=once(s,'reaction:function(e){return ','reaction:function(e){if(e?.species==="fish")return globalThis.APAquarium.asset(e);return ');return s;
});
script('ap-mascot-homes',s=>{
  s=once(s,'function M(e){if(m.has(e))return;','function M(e){if(e.dataset.mascotSpecies==="fish"||m.has(e))return;');
  s=once(s,'const t=JSON.parse(a.textContent),s=', 'const t=unpackHomes(JSON.parse(a.textContent)),s=');
  s=once(s,'function B(e){return ','function B(e){if(String(e).startsWith("aq-"))return o.APAquarium.scene(e);return ');
  s=once(s,'function J(e){return','function J(e){if(e?.species==="fish")return o.APAquarium.background(e);return');
  s=once(s,'decorate:function(e,a,t){if(e){','decorate:function(e,a,t){if(a?.species==="fish")return o.APAquarium.decorate(e,a);o.APAquarium.release(e);if(e){');
  return once(s, 'function B(e){', `function unpackHomes(value){
    if(value.encoding!=="webp-base85/1")return value;
    return Object.fromEntries(Object.entries(value.homes).map(([id,packed])=>{
      const bytes=o.APMascotAssetCodec.decode(packed);
      let binary="";
      for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
      return [id,"data:image/webp;base64,"+btoa(binary)];
    }));
  }function B(e){`);
});
script('ap-mascot-petting',s=>{
  s=once(s,'bind(e,n,l){c().then','bind(e,n,l){if(n()?.species==="fish"){t.APAquarium.bind(e,n,l);return}c().then');
  s=once(s,'react:(...e)=>c().then(n=>!!n&&t.APMascotPetting.react(...e))','react:(...e)=>e[1]?.species==="fish"?Promise.resolve((t.APAquarium.decorate(e[0],e[1]),t.APAquarium.tap(e[0]))):c().then(n=>!!n&&t.APMascotPetting.react(...e))');
  s=once(s,'cancel(){},cancelAll(){}','cancel(e){t.APAquarium.release(e)},cancelAll(){t.APAquarium.cancelAll()}');return s;
});
script('ap-student-mascot',s=>{
  s=once(s,'i.catalog.filter(c=>c.kind==="home")','i.catalog.filter(c=>c.kind==="home"&&(c.species==="fish")===(e.species==="fish"))');
  s=once(s,"'<p class=\"ap-mascot-section-note\">Escolha onde seu mascote vai morar. Compre com as moedas dos treinos e aplique quando quiser. O quintal já é seu.</p><div class=\"ap-mascot-grid\">'",'(e.species==="fish"?\'<p class="ap-mascot-section-note">Os aquários são exclusivos do Betta. O Jardim submerso já é seu. Compre os outros com moedas dos treinos e aplique quando quiser.</p><div class="ap-mascot-grid">\':\'<p class="ap-mascot-section-note">Escolha onde seu mascote vai morar. Compre com as moedas dos treinos e aplique quando quiser. O quintal já é seu.</p><div class="ap-mascot-grid">\')');
  s=once(s,'function R(t="colors"){','const apAquariumPreviousMenu=q;q=function(...args){const result=apAquariumPreviousMenu(...args);globalThis.APAquarium.decorateMenu(args[0]||g(),a("apMascotContent"),u);return result};function R(t="colors"){');
  return s;
});

// Fit the assembled patch into the native 24 MiB cap. The six existing home
// illustrations are reconstructed from identical bytes by unpackHomes().
const codecContext = vm.createContext({Uint8Array, Int16Array});
const codec = BASE.files['index.html'].match(/<script id="ap-mascot-asset-codec">([\s\S]*?)<\/script>/)[1];
vm.runInContext(codec, codecContext);
const homeAssets = block('cadastro.html', 'ap-mascot-home-assets', prior => {
  const homes = Object.fromEntries(Object.entries(JSON.parse(prior)).map(([id,uri]) => {
    const prefix = 'data:image/webp;base64,';
    if (!uri.startsWith(prefix)) throw Error('Unexpected home encoding: ' + id);
    const bytes = Buffer.from(uri.slice(prefix.length), 'base64');
    const encoded = codecContext.APMascotAssetCodec.encode(bytes);
    if (prefix + Buffer.from(codecContext.APMascotAssetCodec.decode(encoded)).toString('base64') !== uri) {
      throw Error('Home image changed during repacking: ' + id);
    }
    return [id, encoded];
  }));
  return JSON.stringify({encoding:'webp-base85/1', homes});
}, false);

const patch = {
  format:'agenda-patch/1', appId:BASE.appId, bridgeVersion:3, dataSchema:4,
  id:'betta-nado-curvas-bolhas', area:'pets', title:'Betta: nado natural e bolhas em movimento', version:'1.1',
  notes:'O Betta se aproxima ao toque sem clarão. As barbatanas ondulam para os dois lados, o peixe faz curvas contínuas e as bolhas sobem nos cinco aquários.',
  changes,
};
fs.mkdirSync(output,{recursive:true});
const patchPath = path.join(output,'AgendaPersonal-Pets-Betta-Nado-Natural.agenda.json');
const bytes = JSON.stringify(patch);
fs.writeFileSync(patchPath, bytes);
fs.writeFileSync(path.join(output,'runtime.js'),code);
fs.writeFileSync(path.join(output,'runtime.preview.js'),runtime(true));
console.log(JSON.stringify({patch:patchPath, bytes:Buffer.byteLength(bytes), components:changes.length, homeAssets:Buffer.byteLength(homeAssets), runtime:Buffer.byteLength(code)}));
