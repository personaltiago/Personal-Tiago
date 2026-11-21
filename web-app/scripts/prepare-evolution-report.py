"""Preserve delivered 177 and append the complete, session-based evolution view."""
import gzip
import hashlib
import json
from pathlib import Path
from html.parser import HTMLParser
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
assert hashlib.sha256(original).hexdigest() == 'a7f905bdd333aa0cc77ef48bbf1c0e1da5c536733f23d2728067e60218d03914'
bundle = json.loads(original)
assert bundle['version'] == '1.12.177' and bundle['sequence'] == 283
html = bundle['files']['index.html']
match = re.search(r'(<script\b[^>]*\bid="ap-progress-sync-source"[^>]*>)([\s\S]*?)(</script>)', html)
assert match and 'gzip-base85' in match[1]
progress = gzip.decompress(decode(match[2])).decode()
assert progress.endswith((root / 'app/student-evolution.js').read_text())
progress += '\n' + (root / 'app/student-evolution-report.js').read_text()
packed = encode(gzip.compress(progress.encode(), compresslevel=9, mtime=0))
assert gzip.decompress(decode(packed)).decode() == progress
html = html[:match.start(2)] + packed + html[match.end(2):]
default = 'let evTab="cargas",evPeriod="3m"'
assert html.count(default) == 1
html = html.replace(default, 'let evTab="cargas",evPeriod="all"', 1)
class HeadBoundary(HTMLParser):
    positions = []
    def handle_endtag(self, tag):
        if tag == 'head': self.positions.append(self.getpos())
parser = HeadBoundary(); parser.feed(html)
assert len(parser.positions) == 1
line, column = parser.positions[0]
offset = sum(len(value) for value in html.splitlines(keepends=True)[:line - 1]) + column
html = html[:offset] + '<style id="ap-evolution-report-css">' + (root / 'app/student-evolution-report.css').read_text() + '</style>' + html[offset:]
bundle['files']['index.html'] = html
for name in bundle['files']: bundle['files'][name] = bundle['files'][name].replace('1.12.177', '1.12.178')
bundle['version'] = '1.12.178'
bundle['sequence'] = 284
output = Path(sys.argv[2]); output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
assert output.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'size': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))
