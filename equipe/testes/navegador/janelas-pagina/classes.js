'use strict';
// Fonte única da classificação das 38 janelas: vem do gerador do pacote (as duas listas conferidas pelo teste automático).
const G = require('../../../../tools/gerar-janelas-pagina-1.12.288.cjs');
module.exports = {paginas: G.PAGE_WINDOWS, fora: Object.keys(G.KEPT_WINDOWS)};
