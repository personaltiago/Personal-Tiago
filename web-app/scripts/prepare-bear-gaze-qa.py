"""Prepare a managed-preview fixture using exact delivered app modules."""
import json, re, shutil, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
for file in sys.argv[2:]:
    bundle=json.loads(Path(file).read_text());v=bundle['version'].split('.')[-1]
    (out/f'cadastro-{v}.html').write_text(bundle['files']['cadastro.html'])
    for name in ['ap-student-mascot-model','ap-mascot-asset-codec','ap-student-mascot-art']:
        match=re.search('<script\\b[^>]*id="'+name+'"[^>]*>([\\s\\S]*?)</script>',bundle['files']['index.html'])
        (out/(name+'-'+v+'.js')).write_text(match[1])
for name in ['bear-eye-pixels.html','bear-eye-pixels.js']:
    shutil.copyfile(root/'tests/browser'/name,out/name)
print('Pixel/animation QA prepared with the actual bundled modules.')
