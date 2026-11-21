import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {transformSync} from 'esbuild';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [input, output] = process.argv.slice(2);
assert(input && output, 'Usage: node prepare-student-recovery.mjs BASE_224_PDF_JSON OUTPUT_JSON');
const bytes = await readFile(input);
const digest = value => createHash('sha256').update(value).digest('hex');
assert.equal(digest(bytes), '48f4b734a2c12fb22954e60c345a0abae2d972aea6d1406d9981fa660e9d5bee');
const bundle = JSON.parse(bytes);
assert.equal(bundle.version, '1.12.224');
assert.equal(bundle.sequence, 330);
const read = name => readFile(path.join(root, 'app', name), 'utf8');
const compile = source => transformSync(source, {loader: 'js', minify: true, charset: 'utf8'}).code.trim();
function replaceOnce(source, before, after) {
  assert.equal(source.split(before).length - 1, 1, before.slice(0, 140));
  return source.replace(before, after);
}
function moduleSource(page, id) {
  const expression = new RegExp('(<script\\b[^>]*\\bid="' + id + '"[^>]*>)([\\s\\S]*?)(</script>)', 'g');
  const matches = [...page.matchAll(expression)];
  assert.equal(matches.length, 1, id);
  return matches[0][2];
}
function setModule(page, id, source) {
  assert(!source.toLowerCase().includes('</script'));
  return replaceOnce(page, moduleSource(page, id), source);
}

const model = compile(await read('feedback-model.js'));
for (const name of ['index.html', 'professor.html']) {
  bundle.files[name] = setModule(bundle.files[name], 'ap-feedback-model', model);
}
let teacher = bundle.files['professor.html'];
const core = moduleSource(teacher, 'ap-teacher-sync-core');
const commitHook = '};const apCommitForStudentSync=commitWorkoutChange;commitWorkoutChange=function(...args){const saved=apCommitForStudentSync.apply(this,args);if(saved)R();return saved};window.APTeacherSync=Object.freeze';
teacher = setModule(teacher, 'ap-teacher-sync-core', replaceOnce(core, '},window.APTeacherSync=Object.freeze', commitHook));
teacher = replaceOnce(teacher,
  'id="workoutExecutionEffort" type="number" inputmode="numeric" min="1" max="10" step="1"',
  'id="workoutExecutionEffort" type="text" inputmode="decimal" autocomplete="off" placeholder="Ex.: 9,4"');
teacher = replaceOnce(teacher,
  "effort=document.getElementById('workoutExecutionEffort').value;",
  'rawEffort=document.getElementById("workoutExecutionEffort").value.trim(),effort=rawEffort?workoutProgressDecimal(rawEffort):null;');
teacher = replaceOnce(teacher,
  "if(effort&&(!Number.isInteger(Number(effort))||Number(effort)<1||Number(effort)>10))return toast('O esforço deve ser um número inteiro de 1 a 10.');",
  'if(rawEffort&&(effort===null||effort<1||effort>10))return toast("O esforço deve ser de 1 a 10. Você pode usar decimais, como 9,4.");');
teacher = replaceOnce(teacher, 'effort:effort?Number(effort):null,', 'effort:effort,');
teacher = setModule(teacher, 'ap-feedback-card', compile(await read('feedback-card.js')));
bundle.files['professor.html'] = teacher;
const feedbackStudent = moduleSource(bundle.files['index.html'], 'ap-feedback-student');
bundle.files['index.html'] = setModule(bundle.files['index.html'], 'ap-feedback-student',
  replaceOnce(feedbackStudent, 'n.color||"#b6ff26"', 'window.APStudentTheme?.color(n)||n.color||"#b6ff26"'));
const recovery = compile(await read('student-session-recovery.js'));
const entry = '<script id="ap-student-session-recovery">' + recovery + '</script>';
bundle.files['index.html'] = replaceOnce(bundle.files['index.html'], '<script id="ap-release-center">', entry + '<script id="ap-release-center">');
bundle.version = '1.12.225';
bundle.sequence = 331;
bundle.notes = 'Restaura o tema escolhido nas telas do aluno, incluindo treinos, exercícios e avaliação. Recupera os pedidos de feedback com notas decimais e o aviso do pet. Ao salvar um treino pelo personal, agenda imediatamente a sincronização; abrir Evolução busca os registros atuais do professor. Inclui a correção de importação de PDF com RIR da 1.12.224. Mantém histórico, cargas por série, preferências e pets existentes.';
for (const name of Object.keys(bundle.files)) {
  bundle.files[name] = bundle.files[name].replaceAll('1.12.224', bundle.version);
  for (const match of bundle.files[name].matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\btype=["'](?:application\/octet-stream|application\/json|text\/plain)/i.test(match[1])) continue;
    new vm.Script(match[2], {filename: name});
  }
}
const result = JSON.stringify(bundle);
assert(Buffer.byteLength(result) < 24 * 1024 * 1024, 'Android import limit');
await mkdir(path.dirname(output), {recursive: true});
await writeFile(output, result);
console.log(JSON.stringify({version: bundle.version, sequence: bundle.sequence, bytes: Buffer.byteLength(result), sha256: digest(result)}));
