import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
const file = new URL('../published/AgendaPersonal-1.12.298-Assinado.agenda.json',import.meta.url);
export async function signedFixture() {
  try {return await readFile(file);} catch(error) {if(error.code !== 'ENOENT') throw error;}
  return gunzipSync(await readFile(new URL(file.href+'.gz')));
}
