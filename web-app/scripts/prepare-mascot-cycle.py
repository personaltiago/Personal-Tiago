"""Keep one bounded camera cycle, including repeated scenery and face touches."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
original = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(original).hexdigest() == '63ef7d75c7e80870ad8950fb2e799b59771892c9074420acf409cb7edb72cc17'
bundle = json.loads(original)
assert bundle['version'] == '1.12.171' and bundle['sequence'] == 277
html = bundle['files']['index.html']
match = re.search(r'<script\b[^>]*\bid="ap-mascot-closeup"[^>]*>([\s\S]*?)</script>', html)
assert match
bundle['files']['index.html'] = html[:match.start(1)] + (root / 'app/mascot-closeup.js').read_text() + html[match.end(1):]
html = bundle['files']['cadastro.html']
match = re.search(r'<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)</script>', html)
assert match
runtime = json.loads(gzip.decompress(base64.b64decode(match[1])))
for old, new in [
    ('globalThis.APMascotCloseup?.approach(n,o());if(globalThis.APWebPlatform?.stablePetCamera)return;const e=n.querySelector("image:not([data-pet-prior])"),t=e?.getScreenCTM();if(t){let e;try{e=new DOMPoint(a.x,a.y).matrixTransform(t.inverse())}catch(e){return}v(n,o(),"look",{x:e.x/320,y:e.y/320})}return', 'globalThis.APMascotCloseup?.approach(n,o());return'),
    ('async function g(a,i,d=!1){e.APMascotCloseup?.prepareForGesture(a);', 'async function g(a,i,d=!1){const camera=await e.APMascotCloseup?.prepareForGesture(a);if(!1===camera)return!1;if("settled"===camera)d=!1;'),
    ('async function v(a,o,r,i){e.APMascotCloseup?.prepareForGesture(a);', 'async function v(a,o,r,i){if(!1===await e.APMascotCloseup?.prepareForGesture(a))return!1;'),
]:
    assert runtime.count(old) == 1, old
    runtime = runtime.replace(old, new, 1)
packed = base64.b64encode(gzip.compress(json.dumps(runtime, ensure_ascii=False, separators=(',', ':')).encode(), compresslevel=9, mtime=0)).decode()
bundle['files']['cadastro.html'] = html[:match.start(1)] + packed + html[match.end(1):]
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.171', '1.12.172')
bundle['version'] = '1.12.172'
bundle['sequence'] = 278
output = Path(sys.argv[2]); output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'size': output.stat().st_size,
    'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))
