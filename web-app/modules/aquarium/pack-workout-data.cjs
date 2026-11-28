const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const NAMES = ['WORKOUT_PDF_EXERCISES', 'WORKOUT_GUIDANCE', 'WORKOUT_REPORT_FONTS'];
const START = '/* AP_WORKOUT_DATA_START */';
const END = '/* AP_WORKOUT_DATA_END */';

function packWorkoutData(html, esbuild) {
  const resolverPaths = [__dirname, path.join(__dirname, 'media-work/deps')];
  const entry = require.resolve('fflate', { paths: resolverPaths });
  const packageRoot = path.resolve(path.dirname(entry), '..');
  const license = fs.readFileSync(path.join(packageRoot, 'LICENSE'), 'utf8');
  const decoder = esbuild.buildSync({
    stdin: {
      contents: `import {gunzipSync} from ${JSON.stringify(path.join(packageRoot, 'esm/browser.js'))};
export function decode(encoded){
  const bytes=Uint8Array.from(atob(encoded), c=>c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(gunzipSync(bytes)));
}`,
      resolveDir: __dirname,
    },
    format: 'iife', globalName: 'APWorkoutPacking', platform: 'browser',
    bundle: true, minify: true, write: false, target: 'es2020',
    banner: { js: '/*!\n' + license.replace(/\*\//g, '* /') + '\n*/' },
  }).outputFiles[0].text;
  const before = Buffer.byteLength(html);
  for (const name of NAMES) {
    const declaration = new RegExp(`const ${name}=([^\\n]+);\\n`, 'g');
    const matches = [...html.matchAll(declaration)];
    if (matches.length !== 1) throw new Error(`Missing or repeated ${name}`);
    const [match, raw] = matches[0];
    JSON.parse(raw);
    const compressed = zlib.gzipSync(raw, { level: 9 }).toString('base64');
    html = html.replace(match, `const ${name}=APWorkoutPacking.decode("${compressed}");\n`);
  }
  const first = Math.min(...NAMES.map(name => html.indexOf(`const ${name}=`)));
  html = html.slice(0, first) + `${START}\n${decoder}${END}\n` + html.slice(first);
  return { html, saved: before - Buffer.byteLength(html) };
}

module.exports = { packWorkoutData, NAMES, START, END };
