"""Embed a small, checksum-bound binary delta for a source-approved app release.

Usage: python prepare-hosted-release.py BASE_MANIFEST BASE_JSON CANDIDATE_JSON
Build-time dependency: bsdiff4. Runtime uses only standard Worker Web APIs.
"""
import base64,bz2,datetime,gzip,hashlib,json,pathlib,re,sys,uuid
import bsdiff4

root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads(pathlib.Path(sys.argv[1]).read_text())
base=pathlib.Path(sys.argv[2]).read_bytes()
candidate=pathlib.Path(sys.argv[3]).read_bytes()
bundle=json.loads(candidate)
digest=lambda b:hashlib.sha256(b).hexdigest()
assert digest(base)==manifest['sha256'] and len(base)==manifest['size']
assert bundle['sequence']>manifest['sequence'] and bundle['bridgeVersion']==3 and bundle['dataSchema']==4
assert bundle['appId']=='com.tiagolima.agendapersonal' and len(candidate)<24*1024*1024
assert set(bundle['files'])=={'index.html','professor.html','avaliacoes.html','cadastro.html'}
assert re.fullmatch(r'/api/bundle/[a-f0-9-]{36}',manifest['bundlePath'])
patch=bsdiff4.diff(base,candidate)
assert patch[:8]==b'BSDIFF40'
def offset(value):
    number=int.from_bytes(value,'little')
    return -(number&((1<<63)-1)) if number&(1<<63) else number
control_size,diff_size,new_size=[offset(patch[n:n+8]) for n in [8,16,24]]
assert new_size==len(candidate)
control=bz2.decompress(patch[32:32+control_size])
diff=bz2.decompress(patch[32+control_size:32+control_size+diff_size])
extra=bz2.decompress(patch[32+control_size+diff_size:])
packed=gzip.compress(control+diff+extra,compresslevel=9,mtime=0)
identifier=str(uuid.uuid5(uuid.NAMESPACE_URL,'agenda-personal-release:'+digest(candidate)))
notes=sys.argv[4] if len(sys.argv)>4 else 'Tema rosa nos treinos da aluna e evolução com os registros do professor, incluindo histórico, cargas, repetições, tempo e peso anotado.'
release={'available':True,'format':1,'appId':bundle['appId'],'bridgeVersion':3,'dataSchema':4,'version':bundle['version'],'sequence':bundle['sequence'],'size':len(candidate),'sha256':digest(candidate),'bundlePath':'/api/bundle/'+identifier,'notes':notes,'publishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')}
spec={'manifest':release,'base':{'key':'bundles/'+manifest['bundlePath'].split('/')[-1]+'.json','size':len(base),'sha256':digest(base)},'patch':{'controlBytes':len(control),'diffBytes':len(diff),'extraBytes':len(extra),'gzip':base64.b64encode(packed).decode()}}
block='// AP_HOSTED_RELEASE_START\nconst HOSTED_RELEASE='+json.dumps(spec,ensure_ascii=False,separators=(',',':'))+';\n'+(root/'scripts/hosted-release-core.js').read_text()+'\n// AP_HOSTED_RELEASE_END\n'
worker=root/'worker/index.js'
source=worker.read_text()
if '// AP_HOSTED_RELEASE_START' in source:source=re.sub(r'// AP_HOSTED_RELEASE_START[\s\S]*?// AP_HOSTED_RELEASE_END\n',lambda _:block,source,count=1)
else:source=source.replace('class ApiError extends Error',block+'class ApiError extends Error',1)
old="if(path==='/api/manifest'&&request.method==='GET'){const latest=await current(env.BUCKET);return json(request,latest?.release||{available:false});}"
new="if(path==='/api/manifest'&&request.method==='GET'){let latest=await current(env.BUCKET);if(!latest||latest.release.sequence<HOSTED_RELEASE.manifest.sequence){await ensureHostedRelease(env.BUCKET);latest=await current(env.BUCKET)}return json(request,latest?.release||{available:false});}"
assert old in source or new in source
source=source.replace(old,new,1)
worker.write_text(source)
assert bsdiff4.patch(base,patch)==candidate
print(json.dumps({'version':bundle['version'],'sequence':bundle['sequence'],'candidateBytes':len(candidate),'deltaBytes':len(packed),'workerBytes':len(source.encode()),'sha256':digest(candidate)}))
