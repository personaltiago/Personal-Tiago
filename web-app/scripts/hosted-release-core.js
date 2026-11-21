// Publish the exact release approved in the source repository. No caller can
// select content or write account data through this path. Normal publications
// still require the existing Firebase teacher authorization.
let hostedReleaseWork=null;
async function releaseDigest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('')}
async function releaseBytes(object){return new Uint8Array(await (typeof object.arrayBuffer==='function'?object.arrayBuffer():new Response(object.body).arrayBuffer()))}
function releaseOffset(bytes,offset){
 let value=bytes[offset+7]&127;for(let n=6;n>=0;n--)value=value*256+bytes[offset+n];
 if(!Number.isSafeInteger(value))throw Error('AP-RELEASE-OFFSET');return bytes[offset+7]&128?-value:value;
}
async function reconstructHostedRelease(base){
 const specification=HOSTED_RELEASE.patch;
 const binary=atob(specification.gzip),packed=new Uint8Array(binary.length);
 for(let i=0;i<packed.length;i++)packed[i]=binary.charCodeAt(i);
 const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'));
 const patch=new Uint8Array(await new Response(stream).arrayBuffer());
 if(patch.length!==specification.controlBytes+specification.diffBytes+specification.extraBytes)throw Error('AP-RELEASE-PATCH');
 const controls=patch.subarray(0,specification.controlBytes),diff=patch.subarray(specification.controlBytes,specification.controlBytes+specification.diffBytes),extra=patch.subarray(specification.controlBytes+specification.diffBytes);
 const output=new Uint8Array(HOSTED_RELEASE.manifest.size);
 let oldPosition=0,newPosition=0,controlPosition=0,diffPosition=0,extraPosition=0;
 while(newPosition<output.length){
  if(controlPosition+24>controls.length)throw Error('AP-RELEASE-CONTROL');
  const copy=releaseOffset(controls,controlPosition),insert=releaseOffset(controls,controlPosition+8),seek=releaseOffset(controls,controlPosition+16);controlPosition+=24;
  if(copy<0||insert<0||newPosition+copy+insert>output.length||diffPosition+copy>diff.length||extraPosition+insert>extra.length||copy+insert===0&&seek===0)throw Error('AP-RELEASE-BOUNDS');
  for(let i=0;i<copy;i++){const source=oldPosition+i;output[newPosition+i]=(diff[diffPosition+i]+(source>=0&&source<base.length?base[source]:0))&255}
  newPosition+=copy;oldPosition+=copy;diffPosition+=copy;
  output.set(extra.subarray(extraPosition,extraPosition+insert),newPosition);newPosition+=insert;extraPosition+=insert;oldPosition+=seek;
 }
 if(await releaseDigest(output)!==HOSTED_RELEASE.manifest.sha256)throw Error('AP-RELEASE-CHECKSUM');
 return output;
}
async function installHostedRelease(bucket){
 let latest=await current(bucket);if(latest?.release.sequence>=HOSTED_RELEASE.manifest.sequence)return true;
 const targetKey='bundles/'+HOSTED_RELEASE.manifest.bundlePath.split('/').pop()+'.json';
 let target=await bucket.get(targetKey);
 if(!target){
  const source=await bucket.get(HOSTED_RELEASE.base.key);if(!source)return false;
  const base=await releaseBytes(source);
  if(base.length!==HOSTED_RELEASE.base.size||await releaseDigest(base)!==HOSTED_RELEASE.base.sha256)throw Error('AP-RELEASE-BASE');
  const bytes=await reconstructHostedRelease(base);
  const stored=await bucket.put(targetKey,bytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'public, max-age=31536000, immutable'}});
  if(!stored){target=await bucket.get(targetKey);if(!target)throw Error('AP-RELEASE-STORAGE')}
 }
 if(target){const bytes=await releaseBytes(target);if(bytes.length!==HOSTED_RELEASE.manifest.size||await releaseDigest(bytes)!==HOSTED_RELEASE.manifest.sha256)throw Error('AP-RELEASE-STORED-CHECKSUM')}
 for(let attempt=0;attempt<3;attempt++){
  latest=await current(bucket);if(latest?.release.sequence>=HOSTED_RELEASE.manifest.sequence)return true;
  const result=await bucket.put(HEAD,JSON.stringify(HOSTED_RELEASE.manifest),{onlyIf:latest?{etagMatches:latest.object.etag}:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'no-store'}});
  if(result)return true;
 }
 return false;
}
async function ensureHostedRelease(bucket){
 if(hostedReleaseWork)return hostedReleaseWork;
 hostedReleaseWork=installHostedRelease(bucket).catch(error=>{console.error('AP-RELEASE-INSTALL',error.message);return false}).finally(()=>{hostedReleaseWork=null});
 return hostedReleaseWork;
}
