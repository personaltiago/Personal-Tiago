"""Correct visible iris masks and mobile field input, preserving 1.12.176 art/motors."""
import base64, gzip, hashlib, json, re, sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
raw = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(raw).hexdigest() == '65841112e7162016fc34b288570070919a2ff0f651fce00f8f324a25d54e4fba'
bundle = json.loads(raw)
assert bundle['version'] == '1.12.176' and bundle['sequence'] == 282
html = bundle['files']['cadastro.html']
match = re.search(r'<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)</script>', html)
runtime = json.loads(gzip.decompress(base64.b64decode(match[1])))
old = 'b.eyes=e.APBearSkin.attentionEyes(h,l[b.pose]);const A=new e.Image;A.src=s.getAttribute("href"),await A.decode();'
new = 'const A=new e.Image;A.src=s.getAttribute("href"),await A.decode();b.eyes=e.APBearSkin.attentionEyes(h,l[b.pose],s.ownerDocument,A);'
assert runtime.count(old) == 1
runtime = runtime.replace(old, new, 1)
old = 'return L=O(a),U=a,q=N(t),"look"!==g&&(I=a),d[g]'
new = 'return L=O(a),U=a,q=N(t),"look"!==g&&(I=a),w&&(L=null,z(Math.max(a,I+600))),d[g]'
assert runtime.count(old) == 1
runtime = runtime.replace(old, new, 1)
start = runtime.index("(function(host) {\n  'use strict';\n  const meta = host.APBearSkinMeta,")
field = runtime.index("(function(host) {\n  'use strict';\n  const bindings = new WeakMap(),", start)
assert runtime[field:].count('(function(') == 1 and runtime.rstrip().endswith('})(globalThis);')
runtime = runtime[:start] + (root/'app/bear-skin.js').read_text() + '\n' + (root/'app/bear-field-gaze.js').read_text()
packed = base64.b64encode(gzip.compress(json.dumps(runtime, ensure_ascii=False, separators=(',', ':')).encode(), compresslevel=9, mtime=0)).decode()
bundle['files']['cadastro.html'] = html[:match.start(1)] + packed + html[match.end(1):]
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.176', '1.12.177')
bundle['version'] = '1.12.177'
bundle['sequence'] = 283
out = Path(sys.argv[2])
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
assert out.stat().st_size < 24*1024*1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'size': out.stat().st_size, 'sha256': hashlib.sha256(out.read_bytes()).hexdigest()}))
