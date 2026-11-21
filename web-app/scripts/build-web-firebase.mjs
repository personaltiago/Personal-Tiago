import {build} from 'esbuild';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(require('firebase/package.json').version!=='10.14.1')throw Error('Use the locked web Firebase version.');
await build({entryPoints:[new URL('../app/web-firebase.js',import.meta.url).pathname],
  outfile:new URL('../web/firebase.js',import.meta.url).pathname,bundle:true,minify:true,
  platform:'browser',format:'iife',target:['safari15','chrome89'],legalComments:'inline'});
console.log('Web Firebase prepared: 10.14.1, IndexedDB/local/session restoration.');
