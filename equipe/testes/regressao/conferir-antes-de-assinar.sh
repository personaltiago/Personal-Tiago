#!/usr/bin/env bash
# Conferência comum ANTES de assinar, usada por todos os fluxos que assinam conteúdo (.github/workflows/assinar-*.yml).
# 1) verificador de regressão no modo assinatura; 2) teste com o mecanismo real do app (UpdateManager/UpdateAreaPatch do ZIP).
# Qualquer reprovação termina com código diferente de zero, e o fluxo para ANTES de decodificar a chave.
# Uso (da raiz): bash equipe/testes/regressao/conferir-antes-de-assinar.sh arquivo.agenda.json [...]
set -euo pipefail
if [[ $# -eq 0 ]]; then echo "Informe os arquivos a conferir." >&2; exit 2; fi
echo "== 1/2 Verificador de regressão (modo assinatura)"
node equipe/testes/regressao/verificar-pacote.cjs --modo assinatura "$@"
echo "== 2/2 Mecanismo real de atualização"
args=()
for f in "$@"; do args+=(--candidato "$f"); done
python3 -I equipe/testes/regressao/mecanismo-real.py "${args[@]}"
echo "Conferência antes de assinar: aprovada."
