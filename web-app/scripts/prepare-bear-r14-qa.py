"""Prepare a static browser fixture from the exact delivered update.

Usage: prepare-bear-r14-qa.py BUNDLE_JSON OUTPUT_DIR [USER_REFERENCE_HTML]
"""
import json,re,shutil,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bundle=json.loads(Path(sys.argv[1]).read_text())
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
(out/'cadastro.html').write_text(bundle['files']['cadastro.html'])
for name in ['ap-student-mascot-model','ap-mascot-asset-codec','ap-student-mascot-art']:
    match=re.search(r'<script\b[^>]*id="'+name+r'"[^>]*>([\s\S]*?)</script>',bundle['files']['index.html'])
    assert match,name
    (out/(name+'.js')).write_text(match[1])
html=(root/'tests/browser/bear-r14-compat.html').read_text()
if len(sys.argv)>3:
    shutil.copyfile(sys.argv[3],out/'reference.html')
else:
    html=re.sub(r'<iframe\b[^>]*id="reference"[\s\S]*?</iframe>','',html)
(out/'index.html').write_text(html)
shutil.copyfile(root/'tests/browser/bear-r14-compat.js',out/'bear-r14-compat.js')
print(json.dumps({'version':bundle['version'],'fixture':str(out.resolve())}))
