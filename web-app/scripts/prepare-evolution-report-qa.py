"""Create local, account-free browser fixtures from the delivered app renderer."""
import gzip
import json
from pathlib import Path
import re
import sys
from html.parser import HTMLParser

root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
alphabet = ''.join(chr(n) for n in range(33,127) if n not in [34,36,38,39,60,62,92,96,126])
def decode(v):
    v = v.strip()
    def word(o):
        n=0
        for c in v[o:o+5]: n=n*85+alphabet.index(c)
        return n
    return b''.join(word(i).to_bytes(4,'big') for i in range(5,len(v),5))[:word(0)]
class Styles(HTMLParser):
    def __init__(self): super().__init__(); self.active=False; self.values=[]
    def handle_starttag(self,tag,attrs):
        if tag=='style': self.active=True
    def handle_endtag(self,tag):
        if tag=='style': self.active=False
    def handle_data(self,data):
        if self.active:self.values.append(data)
for path in sys.argv[2:]:
    bundle=json.loads(Path(path).read_text());version=bundle['version'].split('.')[-1];html=bundle['files']['index.html']
    parser=Styles();parser.feed(html)
    out.joinpath('evolution-'+version+'.css').write_text('\n'.join(parser.values))
    start=re.search(r'\blet evTab\s*=',html).start();end=html.index('const ASS_FEMALE_PHOTOS=',start)
    out.joinpath('renderer-'+version+'.js').write_text(html[start:end])
    progress=gzip.decompress(decode(re.search(r'<script[^>]*id="ap-progress-sync-source"[^>]*>([\s\S]*?)</script>',html)[1])).decode()
    marker='/* AP_EVOLUTION_CONTROLS_START */'
    start=progress.index(marker) if marker in progress else progress.index('(function (host) {')
    out.joinpath('adapter-'+version+'.js').write_text(progress[start:])
    section=re.search(r'<section id="historyScreen"[\s\S]*?</section>',html)[0].replace(' hidden aria-label=', ' aria-label=',1)
    page='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="evolution-'+version+'.css"><style>html,body{margin:0;width:100%;height:100%;font-family:Arial,sans-serif;background:#020b11;color:white}#historyScreen{display:flex;flex-direction:column;position:fixed;inset:0;height:100%;margin:auto}.ev-main-scroll{flex:1;min-height:0}button,select{font-family:inherit}</style></head><body data-view="history">'+section+'<script src="fixture-data.js"></script><script src="renderer-'+version+'.js"></script><script src="adapter-'+version+'.js"></script><script>renderHistory();parent.postMessage({ready:true,version:'+json.dumps(version)+'},"*")</script></body></html>'
    out.joinpath('frame-'+version+'.html').write_text(page)
for name in ['evolution-layout.html','evolution-layout.js','fixture-data.js']:
    out.joinpath('index.html' if name=='evolution-layout.html' else name).write_text((root/'tests/browser'/name).read_text().replace('177','179').replace('178','180'))
print(json.dumps({'preview':str(out),'versions':len(sys.argv)-2}))
