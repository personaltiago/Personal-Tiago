"""Apply the same habitat interaction to the four-page Android/web package."""
import base64
import gzip
import json
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parents[1]
target_version = sys.argv[3] if len(sys.argv) > 3 else '1.12.163'
target_sequence = int(sys.argv[4]) if len(sys.argv) > 4 else 269
assert re.fullmatch(r'\d+\.\d+\.\d+', target_version) and target_sequence > 268
bundle = json.loads(pathlib.Path(sys.argv[1]).read_bytes())
assert bundle['version'] == '1.12.162' and bundle['sequence'] == 268
html = bundle['files']['index.html']
module = (root / 'app/mascot-closeup.js').read_text()
marker = '<script id="ap-mascot-homes">'
assert html.count(marker) == 1
html = html.replace(marker, '<script id="ap-mascot-closeup">' + module + '</script>\n' + marker, 1)
old = 'function A(t){if(c.has(t))return;'
new = 'function A(t){if(e.APMascotCloseup?.layout(t))return;if(c.has(t))return;'
assert html.count(old) == 1
html = html.replace(old, new, 1)
old = 'r.set(t,e)}A(t)}},icon:'
new = 'r.set(t,e)}e.APMascotCloseup?.layout(t,a),A(t)}},icon:'
assert html.count(old) == 1
html = html.replace(old, new, 1)
html = html.replace('1.12.162', target_version)
bundle['files']['index.html'] = html

registration = bundle['files']['cadastro.html']
pattern = r'(<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>)([\s\S]*?)(</script>)'
match = re.search(pattern, registration)
assert match and 'data-ap-gzip' in match[1] and 'data-ap-base85' not in match[1]
runtime = json.loads(gzip.decompress(base64.b64decode(match[2])))
# The young bear's profile measures the dark iris, not the whole white globe.
# Cover the complete globe before inpainting from surrounding fur; leave the
# adult and the authored angry faces unchanged.
old = 'function w(e,t,a,n){const o=v(e,t,a.eyes.map(([e,t,a,n])=>[e,t,1.08*a,1.08*n])),r=y(e),i=r.getContext("2d");'
new = 'function w(e,t,a,n){const youngLids="affection"===n&&"adult"!==a.age,o=v(e,t,a.eyes.map(([e,t,a,n])=>[e,t,(youngLids?1.8:1.08)*a,(youngLids?1.5:1.08)*n])),r=y(e),i=r.getContext("2d");'
assert runtime.count(old) == 1
runtime = runtime.replace(old, new, 1)
old = '.ap-habitat-house,.ap-mascot-speech,.ap-mascot-home-copy strong'
new = '.ap-habitat-house,.ap-mascot-home-copy strong'
assert runtime.count(old) == 1
runtime = runtime.replace(old, new, 1)
old = 'if(!e){x();const e=n.querySelector("image:not([data-pet-prior])")'
new = 'if(!e){x();globalThis.APMascotCloseup?.approach(n,o());const e=n.querySelector("image:not([data-pet-prior])")'
assert runtime.count(old) == 1
runtime = runtime.replace(old, new, 1)
# A tap on the painted pet is an angry face. Only the no-hit scenery branch
# above approaches the camera. Single and repeated taps share the same action,
# so no delayed single/double-tap arbitration is needed; strokes still pet it.
old = 'if(d&&d.contact!==a.contact&&d.type===a.type&&d.part===e.part&&i-d.at>=0&&i-d.at<=280&&Math.hypot(a.x-d.x,a.y-d.y)<=24)return x(),void v(n,o(),"paw");x(),d={at:i,x:a.x,y:a.y,type:a.type,contact:a.contact,part:e.part},p=setTimeout(()=>{if(d=null,p=0,a.epoch===h&&r()&&n.isConnected){const t=o();v(n,t,"capybara"===t.species?"look":"body"===e.part?"curious":e.part,"capybara"===t.species?{x:e.x,y:e.y}:e.zone||{x:e.x,y:e.y})}},285)'
new = 'x(),v(n,o(),"angry")'
assert runtime.count(old) == 1
runtime = runtime.replace(old, new, 1)
old = 'e.target.closest(".ap-habitat-open")&&r()&&g(n,o())'
new = 'e.target.closest(".ap-habitat-open")&&r()&&(e.target.closest(".ap-mascot-mini,.ap-teacher-mascot-mark,.ap-mascot-art")?v(n,o(),"angry"):globalThis.APMascotCloseup?.approach(n,o()))'
assert runtime.count(old) == 1
runtime = runtime.replace(old, new, 1)
packed = base64.b64encode(gzip.compress(json.dumps(runtime, ensure_ascii=False, separators=(',', ':')).encode(), compresslevel=9, mtime=0)).decode()
registration = registration[:match.start(2)] + packed + registration[match.end(2):]
bundle['files']['cadastro.html'] = registration.replace('1.12.162', target_version)
bundle['files']['professor.html'] = bundle['files']['professor.html'].replace('1.12.162', target_version)
bundle['files']['avaliacoes.html'] = bundle['files']['avaliacoes.html'].replace('1.12.162', target_version)
bundle['version'] = target_version
bundle['sequence'] = target_sequence
output = pathlib.Path(sys.argv[2]); output.parent.mkdir(parents=True, exist_ok=True)
temporary = output.with_suffix(output.suffix + '.tmp')
temporary.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
temporary.replace(output)
assert output.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'bytes': output.stat().st_size}))
