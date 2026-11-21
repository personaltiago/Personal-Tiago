"""Avoid animated canvas face patches while the iPhone's camera portrait scales."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
original = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(original).hexdigest() == '4278d593173439b26c12fbb1a7725c0d5359081432a02ad24c8e9e0b056317f6'
bundle = json.loads(original)
assert bundle['version'] == '1.12.170' and bundle['sequence'] == 276
html = bundle['files']['index.html']
pattern = r'(<script\b[^>]*\bid="ap-mascot-closeup"[^>]*>)([\s\S]*?)(</script>)'
match = re.search(pattern, html)
assert match
html = html[:match.start(2)] + (root / 'app/mascot-closeup.js').read_text() + html[match.end(2):]
bundle['files']['index.html'] = html
registration = bundle['files']['cadastro.html']
match = re.search(r'(<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>)([\s\S]*?)(</script>)', registration)
assert match and 'data-ap-gzip' in match[1] and 'data-ap-base85' not in match[1]
runtime = json.loads(gzip.decompress(base64.b64decode(match[2])))
patches = [
    # Scenery needs the portrait approach, without a simultaneous canvas gaze.
    ('globalThis.APMascotCloseup?.approach(n,o());const e=n.querySelector',
     'globalThis.APMascotCloseup?.approach(n,o());if(globalThis.APWebPlatform?.stablePetCamera)return;const e=n.querySelector'),
    # Preserve angry and affectionate gestures while keeping their SVG still.
    ('async function g(a,i,d=!1){', 'async function g(a,i,d=!1){e.APMascotCloseup?.prepareForGesture(a);'),
    ('async function v(a,o,r,i){', 'async function v(a,o,r,i){e.APMascotCloseup?.prepareForGesture(a);'),
]
for old, new in patches:
    assert runtime.count(old) == 1, old
    runtime = runtime.replace(old, new, 1)
packed = base64.b64encode(gzip.compress(json.dumps(runtime, ensure_ascii=False, separators=(',', ':')).encode(), compresslevel=9, mtime=0)).decode()
bundle['files']['cadastro.html'] = registration[:match.start(2)] + packed + registration[match.end(2):]
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.170', '1.12.171')
bundle['version'] = '1.12.171'
bundle['sequence'] = 277
output = Path(sys.argv[2]); output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
assert output.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'size': output.stat().st_size,
    'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))
