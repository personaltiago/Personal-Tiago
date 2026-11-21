/** Build the consolidated client from the frozen 179 baseline, replacing modules. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [input,output]=process.argv.slice(2);
assert(input&&output,'Usage: node prepare-consolidated-release.mjs BASE_179_JSON OUTPUT_JSON');
const bytes=await readFile(input),digest=value=>createHash('sha256').update(value).digest('hex');
assert.equal(digest(bytes),'70b77e40afc47e23b8a0b341d9079316393647f9e2c158ba80e27a89f5028fde');
const bundle=JSON.parse(bytes);assert.equal(bundle.version,'1.12.179');assert.equal(bundle.sequence,285);
const read=name=>readFile(path.join(root,'app',name),'utf8');
let html=bundle.files['index.html'];
const source=id=>html.match(new RegExp('<script\\b[^>]*\\bid="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>'))[1];
const context={Uint8Array};vm.runInNewContext(source('ap-mascot-asset-codec'),context);
const codec=context.APMascotAssetCodec;
const beforeProgress=gunzipSync(codec.decode(source('ap-progress-sync-source'))).toString();
const runtime=await read('student-progress-runtime.js')+'\n/* AP_EVOLUTION_CONTROLS_START */\n'+
 await read('student-evolution.js')+'\n'+await read('student-evolution-report.js');
new vm.Script(runtime);
const packed=codec.encode(gzipSync(Buffer.from(runtime),{level:9,mtime:0}));
html=html.replace(source('ap-progress-sync-source'),packed);
const from=html.indexOf('let evTab='),to=html.indexOf('const ASS_FEMALE_PHOTOS=',from);
assert(from>0&&to>from,'Missing legacy evolution section');
const shell=transformSync(await read('student-evolution-shell.js'),{loader:'js',minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,charset:'utf8'}).code;
html=html.slice(0,from)+shell+'\n'+html.slice(to);
// The student UI used to replace the legacy aggregate helpers after startup.
// The session report owns these calculations now; remove the obsolete writes.
const oldAggregates=html.indexOf('evRecordReps=function(e){');
const nextStudentFeature=html.indexOf('payRender=function()',oldAggregates);
assert(oldAggregates>0&&nextStudentFeature>oldAggregates);
assert(html.slice(oldAggregates,nextStudentFeature).includes('evRecordLoad=function(e){'));
html=html.slice(0,oldAggregates)+html.slice(nextStudentFeature);
const ids=['evolution-v4','evolution-fidelity-v5','evolution-fidelity-polish','ap-evolution-report-css'];
let styleBefore=0;
for(const id of ids){
 const expression=new RegExp('<style\\b[^>]*\\bid="'+id+'"[^>]*>([\\s\\S]*?)<\\/style>');
 const match=html.match(expression);assert(match,'Missing '+id);styleBefore+=Buffer.byteLength(match[1]);
 const replacement=id==='ap-evolution-report-css'?'<style id="ap-evolution-css">'+transformSync(await read('student-evolution.css'),{loader:'css',minify:true,charset:'utf8'}).code+'</style>':'';
 html=html.replace(expression,()=>replacement);
}
bundle.files['index.html']=html;

const registration=bundle.files['cadastro.html'];
const gestureTag=registration.match(/<script\b[^>]*\bid="ap-mascot-gesture-runtime"[^>]*>([\s\S]*?)<\/script>/);
assert(gestureTag);
const oldGesture=JSON.parse(gunzipSync(Buffer.from(gestureTag[1],'base64')));
const skinStart=oldGesture.indexOf("(function(host) {\n  'use strict';\n  const meta = host.APBearSkinMeta,");
const skinEnd=oldGesture.indexOf("(function(host) {\n  'use strict';\n  const bindings = new WeakMap(),",skinStart);
assert(skinStart>0&&skinEnd>skinStart,'Missing existing coat module');
let gesture=oldGesture.slice(0,skinStart)+await read('bear-skin.js')+'\n'+oldGesture.slice(skinEnd);
const oldReaction=')() : host.APBearSkin.coat(doc, base, p, ref, "angry").canvas;';
const newReaction=')() : (await host.APBearSkin.prepare(doc, base, model, p, "angry", paint)).canvas;';
assert.equal(gesture.split(oldReaction).length,2,'Existing expression texture path');
gesture=gesture.replace(oldReaction,newReaction);
new vm.Script(gesture);
const encoded=gzipSync(Buffer.from(JSON.stringify(gesture)),{level:9,mtime:0}).toString('base64');
bundle.files['cadastro.html']=registration.replace(gestureTag[1],encoded);
for(const name of Object.keys(bundle.files))bundle.files[name]=bundle.files[name].replaceAll('1.12.179','1.12.180');
bundle.version='1.12.180';bundle.sequence=286;
const result=Buffer.from(JSON.stringify(bundle));assert(result.length<24*1024*1024);
await mkdir(path.dirname(path.resolve(output)),{recursive:true});await writeFile(output,result);
console.log(JSON.stringify({version:bundle.version,sequence:bundle.sequence,size:result.length,sha256:digest(result),
 legacyEvolutionBytes:to-from,consolidatedShellBytes:Buffer.byteLength(shell),
 oldProgressSourceBytes:Buffer.byteLength(beforeProgress),newProgressSourceBytes:Buffer.byteLength(runtime),
 legacyStyleBlocks:ids.length,consolidatedStyleBlocks:1,previousStyleBytes:styleBefore}));
