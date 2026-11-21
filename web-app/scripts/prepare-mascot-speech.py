"""Keep release 167 intact and anchor resting speech tails to the pet's head."""
import hashlib
import json
from pathlib import Path
import sys

original = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(original).hexdigest() == 'f0c45a95055fce505cb3cc3c977dd70bb30af694598836820ff5523b710daa0e'
bundle = json.loads(original)
assert bundle['version'] == '1.12.167' and bundle['sequence'] == 273
old = 'b=(e.dataset.mascotPose&&"default"!==e.dataset.mascotPose?h:p.right-Math.min(9,.08*p.width))-g'
new = 'b=h-g'
html = bundle['files']['index.html']
assert html.count(old) == 1
# h is the head/mouth horizontal landmark already used to place the balloon.
# The image box includes transparent margins and is not the head position.
bundle['files']['index.html'] = html.replace(old, new, 1)
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.167', '1.12.168')
bundle['version'] = '1.12.168'
bundle['sequence'] = 274
output = Path(sys.argv[2])
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
assert output.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'],
    'size': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))
