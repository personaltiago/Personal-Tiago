"""Keep release 169 intact; use exercise media and scope evolution to the selected workout."""
import gzip
import hashlib
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
alphabet = ''.join(chr(n) for n in range(33, 127) if n not in [34, 36, 38, 39, 60, 62, 92, 96, 126])
def decode(value):
    value = value.strip()
    def word(offset):
        number = 0
        for c in value[offset:offset + 5]: number = number * 85 + alphabet.index(c)
        return number
    size = word(0)
    assert len(value) == 5 * ((size + 3) // 4 + 1)
    return b''.join(word(i).to_bytes(4, 'big') for i in range(5, len(value), 5))[:size]
def encode(value):
    def word(number):
        result = ''
        for _ in range(5): result = alphabet[number % 85] + result; number //= 85
        return result
    return word(len(value)) + ''.join(word(int.from_bytes(value[i:i + 4].ljust(4, b'\0'), 'big')) for i in range(0, len(value), 4))

original = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(original).hexdigest() == 'f725281c61e6ddf0f6add6f8acf9b5f7df4c0046409c580ed32e037cbf763185'
bundle = json.loads(original)
assert bundle['version'] == '1.12.169' and bundle['sequence'] == 275
html = bundle['files']['index.html']
for old, new in [
    ('evPhoto(item.workout,item.index)', 'evPhoto(item.workout,item.index,item)'),
    ("Foto ilustrativa de '+htmlSafe(item.name)", "Prévia de '+htmlSafe(item.name)"),
    ('<h2>Evolução por exercício</h2>', '<h2>Exercícios do treino</h2>'),
]:
    assert html.count(old) == 1, old
    html = html.replace(old, new, 1)
match = re.search(r'(<script\b[^>]*\bid="ap-progress-sync-source"[^>]*>)([\s\S]*?)(</script>)', html)
assert match and 'gzip-base85' in match[1]
progress = gzip.decompress(decode(match[2])).decode()
old = 'o&&(o.querySelector("strong").textContent='
new = 'o?.querySelector("strong")&&o.querySelector("div")&&(o.querySelector("strong").textContent='
assert progress.count(old) == 1
progress = progress.replace(old, new, 1) + '\n' + (root / 'app/student-evolution.js').read_text()
packed = encode(gzip.compress(progress.encode(), compresslevel=9, mtime=0))
assert gzip.decompress(decode(packed)).decode() == progress
html = html[:match.start(2)] + packed + html[match.end(2):]
bundle['files']['index.html'] = html
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.169', '1.12.170')
bundle['version'] = '1.12.170'
bundle['sequence'] = 276
output = Path(sys.argv[2]); output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
assert output.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'size': output.stat().st_size,
    'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))
