'use strict';
// Imprime, separados por vírgula, os blocos (pagina|id) que a autorização do arquivo permite mudar (continuação de correção protegida),
// ou "-" se não há autorização. Usado por mecanismo-real.py para o teste Java não acusar uma continuação aprovada como perda.
const path = require('node:path');
const L = require('../../canonico/lib.cjs');
const {autorizacao} = require('./verificar-pacote.cjs');
const arquivo = process.argv[2];
const dado = L.lerJson(arquivo);
const aut = autorizacao(arquivo, dado, path.join(L.RAIZ, 'equipe/canonico/alteracoes-autorizadas'));
const lista = (aut?.alteracoes || []).map(a => a.pagina + '|' + a.id);
console.log(lista.length ? lista.join(',') : '-');
