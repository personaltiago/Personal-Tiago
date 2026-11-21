"""Restore canonical bear motors and bind coat materials to every stage and pose."""
import base64,gzip,hashlib,json,re,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
raw=Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(raw).hexdigest()=='996ea7daa2c8d4e892496341c8aa7ca584cc959d268e511e18cb3b63eaca36f3'
bundle=json.loads(raw);assert bundle['version']=='1.12.174' and bundle['sequence']==280
html=bundle['files']['cadastro.html'];match=re.search(r'<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)</script>',html)
runtime=json.loads(gzip.decompress(base64.b64decode(match[1])))
start=runtime.rindex('\n(function (host) {');assert 'host.APBearCoatFaces =' in runtime[start:];runtime=runtime[:start]
def replace(old,new):
 global runtime
 assert runtime.count(old)==1,(runtime.count(old),old[:120])
 runtime=runtime.replace(old,new,1)
# Remove the portrait-replacement renderer; all variants use the real mesh again.
replace('const coatFace=await e.APBearCoatFaces?.render(b,A,v,l),T=E?await(e.APBearYoungFaces?.render(b,A,v)):null;', 'const skin=await e.APBearSkin?.prepare(b,A,i,v,l,w),T=E?skin||await(e.APBearYoungFaces?.render(b,A,v)):null;')
replace('"affection"===l?coatFace?.canvas||w(b,M,v,"affection"):A,E?coatFace?.canvas||T?.canvas||w(b,M,v,"angry"):A', '"affection"===l?skin?.canvas||w(b,M,v,"affection"):A,E?T?.canvas||w(b,M,v,"angry"):A')
replace('coatFace&&(R.dataset.bearCoatFace="174",R.dataset.bearFaceKey=coatFace.key)', 'skin&&(R.dataset.bearSkin="175",R.dataset.bearFaceKey=skin.key)')
replace('let D=k(),F=coatFace?e.APBearCoatFaces.renderer(D,A,coatFace,l):function(e,t,a){','let D=k(),F=function(e,t,a){')
replace('catch(Ce){return f.remove(),m.getExtension("WEBGL_lose_context")?.loseContext(),null}', 'catch(Ce){return i.setAttribute("data-bear-motor-error",String(Ce.message).slice(0,240)),f.remove(),m.getExtension("WEBGL_lose_context")?.loseContext(),null}')
replace('if(!m)return null;const g=', 'if(!m){i.setAttribute("data-bear-motor-error","WebGL context unavailable");return null}const g=')
replace('const c=t=>"panda"===t?.species&&!e.APMascotBear?.supports(t)&&!!s(t)', 'const c=t=>"panda"===t?.species&&!!s(t)')
# Adult sitting coats share the approved black 3-D motor, with their own artwork.
replace('const r=t=>"panda"===t?.species&&"adult"===e.APMascotModel.phase(t.xp).id&&"black"===e.APMascotModel.color(t).id&&"sit"===e.APMascotModel.pose(t).id;', 'const r=t=>"panda"===t?.species&&"adult"===e.APMascotModel.phase(t.xp).id&&"sit"===e.APMascotModel.pose(t).id;')
replace('portrait:e=>r(e)?n?.original:null,asset:e=>r(e)&&n?{uri:n.affection,headX:.6,headTop:.08}:null', 'portrait:e=>r(e)&&"black"===globalThis.APMascotModel.color(e).id?n?.original:null,asset:e=>r(e)&&n?"black"===globalThis.APMascotModel.color(e).id?{uri:n.affection,headX:.6,headTop:.08}:globalThis.APBearSkin.asset(e):null')
replace('if(!i.isConnected)return null;const u=i.ownerDocument,', 'if(!c&&"black"!==e.APMascotModel.color(s).id)l=await e.APBearSkin.main(i,s,l);if(!i.isConnected)return null;const u=i.ownerDocument,')
replace('T=c?e.APMascotBearAttention.fragment(s):E,P=[],R=[],k=[];', 'T=c?e.APMascotBearAttention.fragment(s):e.APBearSkin.mainFragment(E,s),P=[],R=[],k=[];')
# Use the black adult's real iris-in-aperture tracking for other coats and stages.
replace('u=t=>"panda"===t?.species&&"adult"===e.APMascotModel.phase(t.xp).id&&"black"===e.APMascotModel.color(t).id&&Object.hasOwn(l,e.APMascotModel.pose(t).id)', 'u=t=>"panda"===t?.species&&!!e.APMascotBearPoses.profile(t)')
replace('if("affection"===g||!u(h)||!Object.hasOwn(d,g))return t.start(s,h,g,y,w,M);', 'if("affection"===g||!u(h)||!Object.hasOwn(d,g)||["paw","tail","angry"].includes(g)&&("adult"!==e.APMascotModel.phase(h.xp).id||"black"!==e.APMascotModel.color(h).id||"sit"===e.APMascotModel.pose(h).id))return t.start(s,h,g,y,w,M);')
replace('b.eyes=l[b.pose];', 'b.eyes=e.APBearSkin.attentionEyes(h,l[b.pose]);')
# A moving target must not restart the eye opening/focus ramp every frame.
replace('const t=f(b,g,(e-I)/1e3,q,w);', 'const elapsed="look"===g?Math.min(.7,(e-I)/1e3)+Math.max(0,(e-U-200)/1e3):(e-I)/1e3,t=f(b,g,elapsed,q,w);')
replace('return L=O(a),U=a,q=N(t),I=a,d[g]', 'return L=O(a),U=a,q=N(t),"look"!==g&&(I=a),d[g]')
replace('act:V,release:K,actAtScreen:ie', 'act:V,action:()=>q,release:K,actAtScreen:ie')
# An unavailable GPU must not tear down an already working pose fallback.
replace('async function c(a,o){if(!e.APMascotBear?.supports(o))return null;let r=t.get(a);', 'async function c(a,o){if(!e.APMascotBear?.supports(o))return null;let r=t.get(a);if(r?.poseLocal&&x(a,o))return null;')
# Reduced motion keeps explicit eye/face feedback and lets every action expire;
# automatic idle movement and all head/ear/depth animation remain disabled.
replace('(!L.matches||0===de||"angry"===q)', '(!L.matches||0===de||"idle"!==q)')
replace('L.matches&&"angry"===q&&(s.angry=r,s.paw=s.aff=0)', 'L.matches&&(s.angry=i.angry,s.aff=i.aff,s.paw=i.paw,s.focus=i.focus,s.gx=i.gx,s.gy=i.gy)')
# Field gaze is separate from taps; taps still retain the selected camera action.
replace('bind:function(n,o,r=()=>!0){if(!n)return;', 'bind:function(n,o,r=()=>!0){if(!n)return;e.APBearFieldGaze?.bind(n,o,r);')
replace('n.addEventListener("pointermove",e=>{const t=u;', 'n.addEventListener("pointermove",e=>{const t=u,px=e.clientX,py=e.clientY;')
replace('t.hit.then(e=>{e&&u===t&&t.epoch===h&&r()&&g(n,o(),!0)})', 't.hit.then(hit=>{u===t&&t.epoch===h&&r()&&(hit?g(n,o(),!0):globalThis.APBearFieldGaze?.follow(n,o,r,px,py))})')
replace('async function v(a,o,r,i){if(!1===await e.APMascotCloseup?.prepareForGesture(a))return!1;', 'async function v(a,o,r,i){if("look"===r&&e.APMascotCloseup?.moving?.(a))return!1;if(!1===await e.APMascotCloseup?.prepareForGesture(a)||"look"===r&&e.APMascotCloseup?.moving?.(a))return!1;')
# Pending native texture loads have the same input priority as the active gesture.
for signature,following,intent in [
 ('async function g(a,i,d=!1){','function y(e,t){','"affection"'),
 ('async function v(a,o,r,i){','const w=()=>{','r'),
]:
 begin=runtime.index(signature);end=runtime.index(following,begin)
 block=runtime[begin:end];assert block.endswith('}')
 body=block[len(signature):-1]
 guard=('"look"!==r&&' if intent=='r' else '')+'e.APBearFieldGaze?.begin(a,'+intent+')'
 runtime=runtime[:begin]+signature+'const finishGazeBlock='+guard+';try{return await(async()=>{'+body+'})()}finally{finishGazeBlock&&finishGazeBlock()}}'+runtime[end:]
for name in ['bear-skin-profiles.js','bear-skin.js','bear-field-gaze.js']:runtime+='\n'+(root/'app'/name).read_text()
packed=base64.b64encode(gzip.compress(json.dumps(runtime,ensure_ascii=False,separators=(',',':')).encode(),compresslevel=9,mtime=0)).decode()
bundle['files']['cadastro.html']=html[:match.start(1)]+packed+html[match.end(1):]
h=bundle['files']['index.html'];m=re.search(r'(<script\b[^>]*id="ap-mascot-closeup"[^>]*>)([\s\S]*?)(</script>)',h);assert m
bundle['files']['index.html']=h[:m.start(2)]+(root/'app/mascot-closeup.js').read_text()+h[m.end(2):]
h=bundle['files']['index.html'];m=re.search(r'(<script\b[^>]*id="ap-student-mascot-art"[^>]*>)([\s\S]*?)(</script>)',h);assert m
art=m[2];old='d=t=>e.APMascotBear?.supports(t)?{headTop:.08,headX:.6}'
assert art.count(old)==1
art=art.replace(old,'d=t=>e.APMascotBear?.supports(t)&&"black"===e.APMascotModel.color(t).id?{headTop:.08,headX:.6}')
bundle['files']['index.html']=h[:m.start(2)]+art+h[m.end(2):]
for name in bundle['files']:bundle['files'][name]=bundle['files'][name].replace('1.12.174','1.12.175')
bundle['version']='1.12.175';bundle['sequence']=281
out=Path(sys.argv[2]);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')))
assert out.stat().st_size<24*1024*1024
print(json.dumps({'version':bundle['version'],'sequence':bundle['sequence'],'size':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
