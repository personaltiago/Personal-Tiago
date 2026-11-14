'use strict';
// Prepara o projeto extraído do ZIP para gerar o APK "Agenda Teste".
// Só roda no workflow de teste; não altera o ZIP do repositório.
//   - identificador separado: com.tiagolima.agendapersonal.teste (instala ao lado do oficial);
//   - nome "Agenda Teste" e versão marcada como teste;
//   - injeta o modo de teste (Firebase falso local + rede externa bloqueada) nas quatro telas;
//   - confere que todo o resto das telas, incluindo backup, recuperação e modo telefone, ficou idêntico.
// Uso: node preparar-agenda-teste.cjs <pasta do projeto>
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const projeto = path.resolve(process.argv[2] || '.');
const ID_OFICIAL = 'com.tiagolima.agendapersonal', ID_TESTE = ID_OFICIAL + '.teste';
const PAGINAS = ['index.html', 'professor.html', 'avaliacoes.html', 'cadastro.html'];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
function falha(m) { console.error('PREPARAÇÃO DO TESTE INTERROMPIDA: ' + m); process.exit(1); }
function trocaUma(texto, antes, depois, onde) {
  const n = texto.split(antes).length - 1;
  if (n !== 1) falha(`esperava 1 ocorrência em ${onde}, achei ${n}: ${antes}`);
  return texto.replace(antes, depois);
}

// 1. Gradle: identificador e versão de teste. A assinatura vem do build "debug" (chave de depuração).
const gradle = path.join(projeto, 'app/build.gradle');
let g = fs.readFileSync(gradle, 'utf8');
g = trocaUma(g, `applicationId '${ID_OFICIAL}'`, `applicationId '${ID_TESTE}'`, 'build.gradle');
g = g.replace(/versionName '([^']+)'/, (_, v) => `versionName '${v}-teste'`);
if (!g.includes("-teste'")) falha('versionName não encontrado');
fs.writeFileSync(gradle, g);

// 2. Nome do app.
const strings = path.join(projeto, 'app/src/main/res/values/strings.xml');
fs.writeFileSync(strings, trocaUma(fs.readFileSync(strings, 'utf8'),
  '<string name="app_name">Agenda Personal</string>', '<string name="app_name">Agenda Teste</string>', 'strings.xml'));

// 3. Telas: CSP connect-src + script do modo de teste no começo do <head>.
const modo = fs.readFileSync(path.join(__dirname, 'modo-teste.js'), 'utf8');
if (modo.includes('</script')) falha('o script de teste não pode conter </script');
const CSP = `<meta http-equiv="Content-Security-Policy" content="connect-src 'self' data: blob:">`;
const INJECAO = CSP + '<script id="ap-modo-teste">' + modo + '</script>';
const relFile = path.join(projeto, 'web/native-release.agenda.json');
const bruto = fs.readFileSync(relFile);
const rel = JSON.parse(bruto.toString('utf8'));
const original = JSON.parse(bruto.toString('utf8'));
for (const p of PAGINAS) {
  const html = rel.files[p];
  if (typeof html !== 'string') falha('tela ausente: ' + p);
  const i = html.indexOf('<head>');
  if (i < 0 || html.slice(0, i).includes('<script')) falha('<head> inesperado em ' + p);
  rel.files[p] = html.slice(0, i + 6) + INJECAO + html.slice(i + 6);
}
// Conferência: retirando a injeção, cada tela é byte a byte a original (backup e recuperação preservados).
for (const p of PAGINAS) {
  if (rel.files[p].replace(INJECAO, '') !== original.files[p]) falha('a tela mudou além da injeção: ' + p);
  for (const marca of ['global.APFullBackupCore=', 'restoreAgenda', 'Recuperação da agenda', 'function save(){if(globalThis.APBackupRestoring'])
    if (p === 'professor.html' && !rel.files[p].includes(marca)) falha('trecho do backup ausente: ' + marca);
}
for (const k of Object.keys(original)) if (k !== 'files' && JSON.stringify(original[k]) !== JSON.stringify(rel[k])) falha('metadado mudou: ' + k);
const novo = Buffer.from(JSON.stringify(rel), 'utf8');
fs.writeFileSync(relFile, novo);

// 4. release.json: só o hash do conteúdo consolidado, para o prepare_assets aceitar o pacote de teste.
const releaseFile = path.join(projeto, 'release.json');
const release = JSON.parse(fs.readFileSync(releaseFile, 'utf8'));
if (release.sourceHashes['web/native-release.agenda.json'] !== sha(bruto)) falha('hash original do conteúdo não confere');
release.sourceHashes['web/native-release.agenda.json'] = sha(novo);
fs.writeFileSync(releaseFile, JSON.stringify(release, null, 2) + '\n');

console.log(`Agenda Teste preparado: ${ID_TESTE}; conteúdo ${rel.version} (seq ${rel.sequence}) com modo de teste em ${PAGINAS.length} telas; resto das telas idêntico.`);
console.log('SHA-256 do modo de teste: ' + sha(Buffer.from(modo, 'utf8')));
