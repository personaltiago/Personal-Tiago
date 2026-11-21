"""Apply the supplied R14 interaction contract and response curves to all bears."""
import base64,gzip,hashlib,json,re,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bundle=json.loads(Path(sys.argv[1]).read_text())
assert bundle['version']=='1.12.178' and bundle['sequence']==284
html=bundle['files']['cadastro.html']
m=re.search(r'<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)</script>',html)
runtime=json.loads(gzip.decompress(base64.b64decode(m[1])))
def patch(old,new):
 global runtime
 assert runtime.count(old)==1,(runtime.count(old),old[:120])
 runtime=runtime.replace(old,new,1)
patch('weight:u,start:async function','weight:u,paint:w,start:async function')
patch('const t="paw"===r||"tail"===r?"angry":r;', 'const t="tail"===r?"angry":r;')
patch('if("look"===r&&i){', 'if(["look","curious","ear","nose"].includes(r)&&i){')
patch('act:V,action:()=>q,release:K,actAtScreen:ie', 'act:V,action:()=>q,stroke:(strength,x)=>{W=g(strength);z.x=g(x,-1,1)},release:K,actAtScreen:ie')
patch('"angry"===q&&(i.paw=0,i.angry=r,i.angle=0,i.y=0)', '"angry"===q&&(i.paw=r,i.angry=r,i.angle=0,i.y=0)')
patch('preserve:x,cancel:l,cancelAll:w', 'preserve:x,release:a=>{const s=t.get(a);if(s){s.held=!1,clearTimeout(s.hearts),s.motion?.release()}},cancel:l,cancelAll:w')
for name in ['bear-reference-motion.js','bear-reference-motor.js','bear-reference-input.js']:
 runtime+='\n'+(root/'app'/name).read_text()
packed=base64.b64encode(gzip.compress(json.dumps(runtime,ensure_ascii=False,separators=(',',':')).encode(),compresslevel=9,mtime=0)).decode()
bundle['files']['cadastro.html']=html[:m.start(1)]+packed+html[m.end(1):]
h=bundle['files']['index.html']
old='e.APMascotBear?.supports(t)&&"black"===e.APMascotModel.color(t).id?{headTop:.08,headX:.6}'
new='e.APMascotBear?.referenceSupports?.(t)&&"black"===e.APMascotModel.color(t).id?{headTop:.08,headX:.6}'
assert h.count(old)==1
bundle['files']['index.html']=h.replace(old,new,1)
for name in bundle['files']:bundle['files'][name]=bundle['files'][name].replace('1.12.178','1.12.179')
bundle['version']='1.12.179';bundle['sequence']=285
out=Path(sys.argv[2]);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')))
assert out.stat().st_size<24*1024*1024
print(json.dumps({'version':bundle['version'],'sequence':bundle['sequence'],'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
