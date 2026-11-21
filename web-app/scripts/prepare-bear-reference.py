"""Refine coat expressions while retaining canonical bear motors from 1.12.175."""
import base64, gzip, hashlib, json, re, sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
raw = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(raw).hexdigest() == '2925cbbfe69cec9678c19142c64a63f37828b4d78f133a5a43479a6189808f45'
bundle = json.loads(raw)
assert bundle['version'] == '1.12.175' and bundle['sequence'] == 281
html = bundle['files']['cadastro.html']
match = re.search(r'<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)</script>', html)
runtime = json.loads(gzip.decompress(base64.b64decode(match[1])))
start = runtime.index("(function(host) {\n  'use strict';\n  const meta = host.APBearSkinMeta,")
end = runtime.index("(function(host) {\n  'use strict';\n  const bindings = new WeakMap(),", start)
runtime = runtime[:start] + (root / 'app/bear-skin.js').read_text() + '\n' + runtime[end:]
packed = base64.b64encode(gzip.compress(json.dumps(runtime, ensure_ascii=False, separators=(',', ':')).encode(), compresslevel=9, mtime=0)).decode()
bundle['files']['cadastro.html'] = html[:match.start(1)] + packed + html[match.end(1):]
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.175', '1.12.176')
bundle['version'] = '1.12.176'
bundle['sequence'] = 282
out = Path(sys.argv[2])
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
assert out.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'size': out.stat().st_size, 'sha256': hashlib.sha256(out.read_bytes()).hexdigest()}))
