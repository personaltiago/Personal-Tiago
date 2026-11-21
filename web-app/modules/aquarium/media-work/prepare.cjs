'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),cv=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
const out=path.join(root,'media');fs.mkdirSync(out,{recursive:true});
function hash(bytes){return crypto.createHash('sha256').update(bytes).digest('hex')}
function bounds(alpha,w,h,label){let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(alpha[y*w+x]===label){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}return{x:l,y:t,width:r-l+1,height:b-t+1}}
async function main(){
 const im=await cv.loadImage(path.resolve(root,'../upload/07-1000053464.png')),sheet=cv.createCanvas(im.width,im.height),sctx=sheet.getContext('2d');sctx.drawImage(im,0,0);
 const w=sheet.width,h=sheet.height,src=sctx.getImageData(0,0,w,h).data,N=w*h,seen=new Uint8Array(N),components=[];
 for(let p=0;p<N;p++){if(seen[p]||src[p*4+3]<128)continue;const q=[p];seen[p]=1;for(let k=0;k<q.length;k++){const j=q[k],x=j%w;for(const n of [j-1,j+1,j-w,j+w])if(n>=0&&n<N&&!seen[n]&&Math.abs(n%w-x)<=1&&src[n*4+3]>=128){seen[n]=1;q.push(n)}}if(q.length>7000)components.push(q)}
 if(components.length!==9)throw Error('Expected nine separate opaque fish cores');
 const cores=components.map(points=>{let x=0,y=0;for(const p of points){x+=p%w;y+=Math.floor(p/w)}return{points,cx:x/points.length,cy:y/points.length}}).sort((a,b)=>Math.floor(a.cy/240)-Math.floor(b.cy/240)||a.cx-b.cx);
 const labels=new Uint8Array(N),distance=new Uint8Array(N),queue=new Int32Array(N);let end=0;
 for(let i=0;i<cores.length;i++)for(const p of cores[i].points){labels[p]=i+1;queue[end++]=p}
 for(let k=0;k<end;k++){const p=queue[k],x=p%w;if(distance[p]>=8)continue;for(const dy of [-1,0,1])for(const dx of [-1,0,1]){if(!dx&&!dy)continue;const n=p+dy*w+dx;if(n<0||n>=N||Math.abs(n%w-x)>1||labels[n]||src[n*4+3]<4)continue;labels[n]=labels[p];distance[n]=distance[p]+1;queue[end++]=n}}
 const colors=['original','blue','gold'],phases=['baby','teen','adult'],sizes={baby:[320,240],teen:[448,336],adult:[512,384]},display={baby:.15,teen:.22,adult:.28};
 const rigByPhase={baby:{nose:[.978,.53],eye:[.902,.45],head:[.87,.52],headStart:.78,tailRoot:[.39,.52],bodyCenter:[.66,.53],dorsal:[.55,.22],ventral:[.57,.76],finSwingStart:.35},teen:{nose:[.978,.52],eye:[.92,.43],head:[.88,.50],headStart:.80,tailRoot:[.51,.52],bodyCenter:[.72,.50],dorsal:[.63,.16],ventral:[.63,.81],finSwingStart:.48},adult:{nose:[.979,.53],eye:[.924,.45],head:[.884,.52],headStart:.81,tailRoot:[.55,.52],bodyCenter:[.74,.51],dorsal:[.66,.14],ventral:[.66,.84],finSwingStart:.51}};
 const manifest={format:'agenda-aquarium-media',version:1,created:'2026-11-03',spriteOrientation:'right',images:{},fish:{},scenes:[],notes:['All visual identities are taken from the supplied images.','Source fish sheet has touching low-alpha fringe between rows; opaque cores and nearby connected fin fringe were preserved separately.','No frontal pose is fabricated; swimming mesh should anchor the head and gently flex fins/tail.']};
 const previews=[];
 for(let i=0;i<9;i++){
  const color=colors[Math.floor(i/3)],phase=phases[i%3],b=bounds(labels,w,h,i+1),clean=cv.createCanvas(b.width,b.height),cx=clean.getContext('2d'),pixels=cx.createImageData(b.width,b.height);
  for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){const p=(b.y+y)*w+b.x+x;if(labels[p]!==i+1)continue;const j=(y*b.width+x)*4;for(let k=0;k<4;k++)pixels.data[j+k]=src[p*4+k]}
  cx.putImageData(pixels,0,0);const [fw,fh]=sizes[phase],frame=cv.createCanvas(fw,fh),ctx=frame.getContext('2d'),scale=Math.min((fw-24)/b.width,(fh-24)/b.height),dw=b.width*scale,dh=b.height*scale,ox=(fw-dw)/2,oy=(fh-dh)/2;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(clean,ox,oy,dw,dh);
  const bytes=frame.toBuffer('image/webp',90),id='fish-'+color+'-'+phase,file=id+'.webp';fs.writeFileSync(path.join(out,file),bytes);
  const transformPoint=([x,y])=>[(ox+x*dw)/fw,(oy+y*dh)/fh],rawRig=rigByPhase[phase],rig={};for(const[k,v]of Object.entries(rawRig))rig[k]=Array.isArray(v)?transformPoint(v):(ox+v*dw)/fw;
  const record={id,path:file,mime:'image/webp',width:fw,height:fh,bytes:bytes.length,sha256:hash(bytes),source:{file:'07-1000053464.png',crop:b,corePixels:cores[i].points.length},contentBounds:[ox/fw,oy/fh,dw/fw,dh/fh],displayWidth:display[phase],rig};
  manifest.images[id]=record;(manifest.fish[color]??={})[phase]=id;previews.push({label:color+' · '+phase,frame});
 }
 const scenes=[['aq-jardim','Jardim submerso','05-1000053459.png',[.5,.53],[[.44,.97],[.70,.98]],{light:[.48,.02],tone:'green'}],['aq-ruinas','Ruínas submersas','03-1000053461.png',[.52,.52],[[.30,.98],[.68,.95]],{light:[.48,.02],tone:'blue'}],['aq-cristais','Gruta de cristais','04-1000053460.png',[.5,.5],[[.33,.97],[.65,.98]],{light:[.50,.02],tone:'violet'}],['aq-cachoeira','Cachoeira submersa','06-1000053463.png',[.53,.52],[[.28,.98],[.62,.96]],{light:[.42,.02],tone:'blue',waterfall:[.71,.24,.23,.58]}],['aq-naufragio','Naufrágio','02-1000053462.png',[.48,.52],[[.55,.98],[.68,.95]],{light:[.47,.02],tone:'blue'}]];
 for(const[id,name,source,position,bubbles,effects]of scenes){const im=await cv.loadImage(path.resolve(root,'../upload',source)),canvas=cv.createCanvas(1000,Math.round(1000*im.height/im.width));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);const bytes=canvas.toBuffer('image/webp',85),file=id+'.webp';fs.writeFileSync(path.join(out,file),bytes);manifest.images[id]={id,path:file,mime:'image/webp',width:canvas.width,height:canvas.height,bytes:bytes.length,sha256:hash(bytes),source:{file:source,crop:{x:0,y:0,width:im.width,height:im.height}}};manifest.scenes.push({id,name,image:id,position,bubbles,effects});previews.push({label:name,frame:canvas})}
 manifest.totalImageBytes=Object.values(manifest.images).reduce((sum,r)=>sum+r.bytes,0);if(manifest.totalImageBytes>1024*1024)throw Error('Media target exceeded');fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 const contact=cv.createCanvas(960,4*300+2*360),cctx=contact.getContext('2d');cctx.fillStyle='#102328';cctx.fillRect(0,0,contact.width,contact.height);
 for(let i=0;i<9;i++){const row=Math.floor(i/3),col=i%3,{label,frame}=previews[i],x=col*320,y=row*300;cctx.fillStyle='#e5eef0';cctx.font='18px sans-serif';cctx.fillText(label,x+12,y+25);const ratio=Math.min(288/frame.width,250/frame.height);cctx.drawImage(frame,x+(320-frame.width*ratio)/2,y+40,frame.width*ratio,frame.height*ratio)}
 for(let i=0;i<5;i++){const col=i%2,row=Math.floor(i/2),{label,frame}=previews[i+9],x=col*480,y=900+row*300;cctx.fillStyle='#e5eef0';cctx.font='18px sans-serif';cctx.fillText(label,x+12,y+25);const ratio=Math.min(460/frame.width,260/frame.height);cctx.drawImage(frame,x+10,y+35,frame.width*ratio,frame.height*ratio)}
 fs.writeFileSync(path.join(root,'media-work/contact.png'),contact.toBuffer('image/png'));console.log(JSON.stringify({images:Object.keys(manifest.images).length,total:manifest.totalImageBytes,manifest:path.join(out,'manifest.json')},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
