import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { createHandler } from '../dist/server/index.js';

const origin = 'https://agenda-personal-distribuicao.silvanaoliveira1411.chatgpt.site';
const conf = JSON.parse(await fs.readFile(new URL('../modules/aquarium/media-config.json', import.meta.url)));
const fetcher = async () => { throw new Error('Aquarium must not use account services'); };
const bucket = new Proxy({}, { get() { throw new Error('Aquarium must not use stored account data'); } });
const handle = createHandler(fetcher);
const get = (route, method = 'GET') => handle(new Request(origin + route, { method, headers: { Origin: 'https://appassets.androidplatform.net' } }), { BUCKET: bucket });
const media = await get('/api/aquarium/v1/media.json');
assert.equal(media.status, 200);
assert.equal(media.headers.get('access-control-allow-origin'), '*');
assert.match(media.headers.get('cache-control'), /immutable/);
const bytes = Buffer.from(await media.arrayBuffer());
assert.equal(bytes.length, conf.bytes);
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), conf.sha256);
assert.equal(Object.keys(JSON.parse(bytes.toString()).images).length, 23);
for (const [method, status] of [['OPTIONS', 204], ['HEAD', 200], ['POST', 405]]) {
  const response = await get('/api/aquarium/v1/media.json', method);
  assert.equal(response.status, status);
  assert.equal(await response.text(), '');
}
assert.match(await (await get('/aquario')).text(), /Aquário do Betta/);
assert.match(await (await get('/api/aquarium/v1/runtime.js')).text(), /APFishMedia/);
console.log('PASS public aquarium routes: SHA, 23 media assets, CORS for Android, GET/HEAD/OPTIONS, no account service/storage calls.');
