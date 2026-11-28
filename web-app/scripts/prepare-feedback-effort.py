"""Preserve release 166 and update presencial feedback ordering and decimal effort."""
import hashlib
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
original = Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(original).hexdigest() == '16f0f9c2443f61b5a25e0c46bbe903d49e934d3e4246c8e141d580e491f770ff'
bundle = json.loads(original)
assert bundle['version'] == '1.12.166' and bundle['sequence'] == 272

def replace_once(text, old, new):
    assert text.count(old) == 1, old[:100]
    return text.replace(old, new, 1)

def module(html, identifier, path):
    pattern = r'(<script\b[^>]*\bid="' + re.escape(identifier) + r'"[^>]*>)[\s\S]*?(</script>)'
    assert len(re.findall(pattern, html)) == 1
    source = (root / path).read_text()
    assert '</script' not in source.lower()
    return re.sub(pattern, lambda match: match[1] + source + match[2], html, count=1)

for name in ['index.html', 'professor.html']:
    bundle['files'][name] = module(bundle['files'][name], 'ap-feedback-model', 'app/feedback-model.js')
teacher = module(bundle['files']['professor.html'], 'ap-feedback-card', 'app/feedback-card.js')
teacher = replace_once(teacher,
    'id="workoutExecutionEffort" type="number" inputmode="numeric" min="1" max="10" step="1"',
    'id="workoutExecutionEffort" type="text" inputmode="decimal" autocomplete="off" placeholder="Ex.: 9,4"')
teacher = replace_once(teacher,
    'effort=document.getElementById("workoutExecutionEffort").value;',
    'rawEffort=document.getElementById("workoutExecutionEffort").value.trim(),effort=rawEffort?workoutProgressDecimal(rawEffort):null;')
teacher = replace_once(teacher,
    'if(effort&&(!Number.isInteger(Number(effort))||Number(effort)<1||Number(effort)>10))return toast("O esforço deve ser um número inteiro de 1 a 10.");',
    'if(rawEffort&&(effort===null||effort<1||effort>10))return toast("O esforço deve ser de 1 a 10. Você pode usar decimais, como 9,4.");')
teacher = replace_once(teacher, 'effort:effort?Number(effort):null,', 'effort:effort,')
bundle['files']['professor.html'] = teacher
for name in bundle['files']:
    bundle['files'][name] = bundle['files'][name].replace('1.12.166', '1.12.167')
bundle['version'] = '1.12.167'
bundle['sequence'] = 273
output = Path(sys.argv[2]); output.parent.mkdir(parents=True, exist_ok=True)
temporary = output.with_suffix(output.suffix + '.tmp')
temporary.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
temporary.replace(output)
assert output.stat().st_size < 24 * 1024 * 1024
print(json.dumps({'version': bundle['version'], 'sequence': bundle['sequence'], 'bytes': output.stat().st_size}))
