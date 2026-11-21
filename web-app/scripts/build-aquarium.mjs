import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const mainImport = "import { aquariumResponse } from './aquarium.js';\n";
const [main, aquarium, payload] = await Promise.all([
  fs.readFile(path.join(root, 'worker/index.js'), 'utf8'),
  fs.readFile(path.join(root, 'worker/aquarium.js'), 'utf8'),
  fs.readFile(path.join(root, 'worker/aquarium-payload.js'), 'utf8'),
]);
if (!main.startsWith(mainImport)) throw new Error('Aquarium route import is missing');
const source = [
  payload.replace(/^export const /gm, 'const '),
  aquarium.replace(/^import [^\n]+\n/, '').replace(/^export function aquariumResponse/m, 'function aquariumResponse'),
  main.slice(mainImport.length),
].join('\n');
await fs.mkdir(path.join(root, 'dist/server'), { recursive: true });
await fs.mkdir(path.join(root, 'dist/.openai'), { recursive: true });
await fs.writeFile(path.join(root, 'dist/server/index.js'), source);
await fs.copyFile(path.join(root, '.openai/hosting.json'), path.join(root, 'dist/.openai/hosting.json'));
console.log(`Aquarium worker built (${Buffer.byteLength(source)} bytes)`);
