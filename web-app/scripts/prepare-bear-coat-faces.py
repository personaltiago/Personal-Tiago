"""Use each bear coat's existing natural expression photos for its face layers."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
original = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(original).hexdigest() == 'c19723f7950e8ca86e047e6584eaa774f32340b265fc0f35ddca4a5845042b5e'
bundle = json.loads(original)
assert bundle['version'] == '1.12.172' and bundle['sequence'] == 278
html = bundle['files']['cadastro.html']
match = re.search(r'<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)</script>', html)
assert match
runtime = json.loads(gzip.decompress(base64.b64decode(match[1])))
for old, new in [
    ('"rest:adult:cream":[190,122,10.52,10.52,229,142,9.02,11.27,220,152,215,171,211.3,141.3,81,69,210]', '"rest:adult:cream":[196,122,14,14,249,141,14,15,220,152,215,171,221.7,138.3,81,69,210]'),
    ('const T=E?await(e.APBearYoungFaces?.render(b,A,v)):null;', 'const coatFace=await e.APBearCoatFaces?.render(b,A,v,l),T=E?await(e.APBearYoungFaces?.render(b,A,v)):null;'),
    ('const P=[A,"affection"===l?w(b,M,v,"affection"):A,E?T?.canvas||w(b,M,v,"angry"):A]', 'const P=[A,"affection"===l?coatFace?.canvas||w(b,M,v,"affection"):A,E?coatFace?.canvas||T?.canvas||w(b,M,v,"angry"):A]'),
    ('R.dataset.bearPose=v.pose,T&&', 'R.dataset.bearPose=v.pose,coatFace&&(R.dataset.bearCoatFace="173",R.dataset.bearFaceKey=coatFace.key),T&&'),
    ('let D=k(),F=function(e,t,a){', 'let D=k(),F=coatFace?e.APBearCoatFaces.renderer(D,A,coatFace,l):function(e,t,a){'),
]:
    assert runtime.count(old) == 1, old
    runtime = runtime.replace(old, new, 1)
runtime += '\n' + (root / 'app/bear-coat-faces.js').read_text()
packed = base64.b64encode(gzip.compress(json.dumps(runtime, ensure_ascii=False, separators=(',', ':')).encode(), compresslevel=9, mtime=0)).decode()
bundle['files']['cadastro.html'] = html[:match.start(1)] + packed + html[match.end(1):]
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.172', '1.12.173')
bundle['version'] = '1.12.173'
bundle['sequence'] = 279
output = Path(sys.argv[2]); output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
assert output.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'size': output.stat().st_size,
    'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))
