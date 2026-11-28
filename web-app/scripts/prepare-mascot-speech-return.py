"""Reposition speech throughout the camera return and settle at the resting head."""
import hashlib
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
original = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(original).hexdigest() == 'dd5c101493901314e5b843f17bfb2f1a8ec1aacbef4390238c68a00f0876f302'
bundle = json.loads(original)
assert bundle['version'] == '1.12.168' and bundle['sequence'] == 274
html = bundle['files']['index.html']
pattern = r'(<script\b[^>]*\bid="ap-mascot-closeup"[^>]*>)([\s\S]*?)(</script>)'
match = re.search(pattern, html)
assert match
html = html[:match.start(2)] + (root / 'app/mascot-closeup.js').read_text() + html[match.end(2):]
patches = [
    # A normal layout queued before approach must honor the current close-up.
    ('c.delete(t),function(e){', 'c.delete(t),e.APMascotCloseup?.layout(t)||function(e){'),
    # Animated bounds locate the head; they must not resize the resting scene.
    ('e.dataset.petAffection||e.style.getPropertyValue("--pet-scene-height")',
     'e.dataset.petAffection||e.dataset.petReturning||e.style.getPropertyValue("--pet-scene-height")'),
]
for old, new in patches:
    assert html.count(old) == 1, old
    html = html.replace(old, new, 1)
bundle['files']['index.html'] = html
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.168', '1.12.169')
bundle['version'] = '1.12.169'
bundle['sequence'] = 275
output = Path(sys.argv[2])
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
assert output.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'],
    'size': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))
