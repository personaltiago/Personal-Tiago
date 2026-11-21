"""Replace only the non-black bear expression module in the published 173 bundle."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
original = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(original).hexdigest() == '3a5882c35dd2a6d334ef3b52f1f4b1123a72afd977cd70106c0b960d44e5b248'
bundle = json.loads(original)
assert bundle['version'] == '1.12.173' and bundle['sequence'] == 279
html = bundle['files']['cadastro.html']
match = re.search(r'<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)</script>', html)
assert match
runtime = json.loads(gzip.decompress(base64.b64decode(match[1])))
start = runtime.rindex('\n(function (host) {') + 1
assert hashlib.sha256(runtime[start:].encode()).hexdigest() == 'ac42093e8f93326c572de8563c1de288857f0b67611942e4357a44f2ff96b67d'
assert runtime.count('R.dataset.bearCoatFace="173"') == 1
runtime = runtime[:start].replace('R.dataset.bearCoatFace="173"', 'R.dataset.bearCoatFace="174"') + (root / 'app/bear-coat-faces.js').read_text()
packed = base64.b64encode(gzip.compress(json.dumps(runtime, ensure_ascii=False, separators=(',', ':')).encode(), compresslevel=9, mtime=0)).decode()
bundle['files']['cadastro.html'] = html[:match.start(1)] + packed + html[match.end(1):]
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.173', '1.12.174')
bundle['version'] = '1.12.174'
bundle['sequence'] = 280
output = Path(sys.argv[2]); output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
assert output.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'size': output.stat().st_size,
    'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))
