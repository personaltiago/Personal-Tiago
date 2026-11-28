'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=__dirname,media=path.join(root,'media'),delivery=path.join(root,'delivery'),cv=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 fs.mkdirSync(delivery,{recursive:true});const source=JSON.parse(fs.readFileSync(path.join(media,'manifest.json'))),images={};
 const turnFile=path.join(media,'turn-manifest.json');let turns={};if(fs.existsSync(turnFile)){const v=JSON.parse(fs.readFileSync(turnFile));turns=v.images||v;assert.ok(turns&&typeof turns==='object'&&!Array.isArray(turns),'Turn records must be an object keyed by image id')}
 for(const[id,r]of Object.entries({...source.images,...turns})){
  assert.equal(r.id,id);assert.ok(/^(fish-(original|blue|gold)-(baby|teen|adult)(-turn)?|aq-(jardim|ruinas|cristais|cachoeira|naufragio))$/.test(id));assert.ok(typeof r.path==='string'&&!path.isAbsolute(r.path)&&!r.path.split(/[\\/]/).includes('..'));
  const bytes=fs.readFileSync(path.join(media,r.path)),im=await cv.loadImage(bytes);assert.ok(im.width>0&&im.width<=2048&&im.height>0&&im.height<=2048);
  const clean={id,mime:'image/webp',uri:'data:image/webp;base64,'+bytes.toString('base64'),width:im.width,height:im.height,bytes:bytes.length,sha256:hash(bytes)};
  if(id.startsWith('fish-')){for(const k of ['contentBounds','displayWidth','rig']){assert.notEqual(r[k],undefined,id+':'+k);clean[k]=r[k]}}
  images[id]=clean;
 }
 const pack={format:'agenda-aquarium-media',version:1,spriteOrientation:'right',images,fish:source.fish,scenes:source.scenes},bytes=Buffer.from(JSON.stringify(pack));assert.ok(bytes.length<=4*1024*1024);const name='AgendaPersonal-Aquario-1.aquarium.json';fs.writeFileSync(path.join(delivery,name),bytes);
 const config={version:1,sha256:hash(bytes),bytes:bytes.length,url:'https://agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site/api/aquarium/v1/media.json'};fs.writeFileSync(path.join(root,'media-config.json'),JSON.stringify(config,null,2));
 const thumbnails={};let thumbBytes=0;for(const phase of ['baby','teen','adult']){const r=images['fish-original-'+phase],im=await cv.loadImage(r.uri),canvas=cv.createCanvas(96,72),ctx=canvas.getContext('2d');ctx.drawImage(im,0,0,96,72);const pixels=ctx.getImageData(0,0,96,72);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=Math.round(pixels.data[i]/17)*17;ctx.putImageData(pixels,0,0);const bytes=canvas.toBuffer('image/webp',70);thumbBytes+=bytes.length;thumbnails[phase]={uri:'data:image/webp;base64,'+bytes.toString('base64'),width:96,height:72,rig:r.rig,contentBounds:r.contentBounds,displayWidth:r.displayWidth}}
 assert.ok(thumbBytes<8192,'Thumbnails must fit in 8 KiB');fs.writeFileSync(path.join(root,'thumbnails.json'),JSON.stringify(thumbnails));
 console.log(JSON.stringify({file:path.join(delivery,name),config,images:Object.keys(images).length,thumbnailWebPBytes:thumbBytes,thumbnailJSONBytes:Buffer.byteLength(JSON.stringify(thumbnails))},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
