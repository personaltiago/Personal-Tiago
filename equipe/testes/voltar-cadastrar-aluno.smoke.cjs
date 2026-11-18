'use strict';
// Confere o pacote 1.12.279 (correção do Voltar em Cadastrar aluno) contra o 1.12.278.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.join(__dirname, '../..');
const G = require(path.join(ROOT, 'tools/gerar-voltar-cadastrar-aluno-1.12.279.cjs'));
const o = JSON.parse(fs.readFileSync(path.join(ROOT, 'AgendaPersonal-1.12.278-Grupo-Turma-Para-Assinar.agenda.json'), 'utf8'));
const p = G.makeUpdate(o);
let ok = 0, bad = 0;
const t = (n, f) => { try { f(); ok++; console.log('OK   ' + n); } catch (e) { bad++; console.log('FALHA ' + n + ' -> ' + e.message); } };

t('Versão 1.12.279 / seq 385 / sem assinatura', () => { assert.equal(p.version, '1.12.279'); assert.equal(p.sequence, 385); assert.equal(p.agendaSignature, undefined); });
t('Só professor.html mudou; os demais arquivos ficam idênticos', () => { for (const k of Object.keys(o.files)) if (k !== 'professor.html') assert.equal(p.files[k], o.files[k], k); assert.notEqual(p.files['professor.html'], o.files['professor.html']); });
t('Prova de reversão: desfazendo só as 2 edições, professor.html volta byte a byte ao 1.12.278', () => {
  let page = p.files['professor.html'];
  for (const [previous, next] of G.professorEdits()) { assert.equal(page.split(next).length - 1, 1, 'edição não aplicada uma vez'); page = page.replace(next, () => previous); }
  assert.equal(page, o.files['professor.html']);
});
t('O formulário só volta ao ponto anterior quando a ação do painel realmente mudou de tela', () => { assert(p.files['professor.html'].includes('appNavigation.length>ap_before')); });
t('Não mexe em descanso, cronômetro, alarme ou notificação', () => { for (const [a, b] of G.professorEdits()) assert(!/(\brest\b|restSeconds|alarm|notific|timer|descanso|cron[oô]metro)/i.test(b), b.slice(0, 60)); });
t('Nenhum link de convite no pacote', () => { assert(!/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(JSON.stringify(p.files))); });
console.log(`\nresultado: ${ok} ok, ${bad} falhas`);
process.exit(bad ? 1 : 0);
