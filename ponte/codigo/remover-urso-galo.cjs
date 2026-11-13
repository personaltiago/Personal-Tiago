const fs=require('fs'),zlib=require('zlib');const C=require('/tmp/x/pets/codec.js');
const P='web/native-release.agenda.json';const raw=fs.readFileSync(P,'utf8');const rel=JSON.parse(raw);
if(JSON.stringify(rel)!==raw)throw Error('serialização diferente');
let c=rel.files['cadastro.html'],idx=rel.files['index.html'];const before=c.length;
const once=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error(label+': '+n);return s.replace(a,()=>b)};
// 1) remove bear/chick-only asset scripts
for(const id of ['ap-approved-bear-assets','ap-bear-face-reaction-assets','ap-bear-young-face-assets','ap-chick-face-assets']){
  const re=new RegExp('<script type="application/json" id="'+id+'" data-ap-gzip data-ap-base85>[^<]*</script>','g');
  const m=c.match(re);if(!m||m.length!==1)throw Error('script '+id);c=c.replace(re,'');}
// 2) strip panda/rooster from shared mascot asset tables
for(const id of ['ap-mascot-reaction-assets','ap-mascot-affection-assets','ap-mascot-image-assets','ap-mascot-coat-assets','ap-mascot-pose-assets']){
  const re=new RegExp('(<script type="application/json" id="'+id+'" data-ap-gzip data-ap-base85>)([^<]*)(</script>)');
  const m=c.match(re);if(!m)throw Error('tabela '+id);
  const text=zlib.gunzipSync(Buffer.from(C.decode(m[2]))).toString('utf8');const d=JSON.parse(text);
  if(!d.panda||!d.rooster)throw Error('sem espécies '+id);delete d.panda;delete d.rooster;
  const out=JSON.stringify(d);
  const enc=C.encode(new Uint8Array(zlib.gzipSync(Buffer.from(out,'utf8'),{level:9})));
  // round-trip check
  if(zlib.gunzipSync(Buffer.from(C.decode(enc))).toString('utf8')!==out)throw Error('roundtrip '+id);
  c=c.replace(re,(_,a,b,z)=>a+enc+z);
}
// 3) model: remove choices, coats, poses; migrate existing bear/rooster pets to kitten
idx=once(idx,',panda:Object.freeze([t("original","Preto e branco","#b2ada1"),t("white","Todo branco","#f0eee5",0),t("black","Todo preto","#302a26",1),t("brown","Castanho e branco","#8c6550",2),t("cream","Creme","#e2c99f",3),t("cinnamon","Canela","#985b37",4)])','','coats panda');
idx=once(idx,',rooster:Object.freeze([t("original","Cobre","#b67537"),t("white","Branco","#e8e2d5",0),t("black","Preto","#2c332f",1),t("barred","Carijó","#8c8b85",3),t("buff","Dourado","#c8a56b",4)])','','coats rooster');
idx=once(idx,'panda:{red:"cinnamon",blue:"original",gold:"cream",violet:"brown"},','','A panda');
idx=once(idx,',rooster:{red:"original",blue:"barred",gold:"buff",violet:"white"}})','})','A rooster');
idx=once(idx,'{id:"panda",name:"Panda"},{id:"rooster",name:"Galo"},','','choices');
idx=once(idx,'panda:[["sit","Sentado","Patas para a frente e um descanso tranquilo."]],','','poses panda');
idx=once(idx,',rooster:[["sit","Descansando","Asas fechadas e patinhas recolhidas."],["rest","Asas abertas","Exibindo as penas em um belo alongamento."],["play","Cantando","Peito erguido e bico aberto para cantar."]]})','})','poses rooster');
idx=once(idx,'E=Object.freeze(["pose-panda-play","pose-panda-rest","pose-alligator-sit"','E=Object.freeze(["pose-alligator-sit"','legacy poses');
idx=once(idx,'.test(a.species)?a.species:"";','.test(a.species)?a.species:"";(s.species==="panda"||s.species==="rooster")&&(s.species="kitten");','migrate');
rel.files['cadastro.html']=c;rel.files['index.html']=idx;
fs.writeFileSync(P,JSON.stringify(rel));
console.log('cadastro',before,'->',c.length,'index',idx.length);
