#!/usr/bin/env bash
# Publica os avisos no celular do professor (Cloud Functions for Firebase, grupo "avisos").
# Rodar no Cloud Shell do console do Firebase, que já entra logado na conta do Tiago (dona do projeto).
# Comando único para colar no Cloud Shell:
#   git clone --depth 1 --filter=blob:none --sparse https://github.com/personaltiago/Personal-Tiago.git ap && cd ap && git sparse-checkout set firebase && bash firebase/publicar.sh
# Só publica as funções do grupo "avisos": não mexe nas regras do Firestore, nos dados dos alunos nem em outras funções.
# Precisa do plano Blaze. Se der "aguarde alguns minutos e tente de novo" na primeira vez, é só rodar o comando de novo.
set -euo pipefail
PROJETO=agenda-personal-bdb58
cd "$(dirname "$0")"

echo "0/4 Conferindo o risco de cobrança por IA (só leitura)..."
# Com o Blaze, as chaves públicas do app (a do site e a do Android, que vão no app de qualquer jeito) podem ser usadas por
# terceiros nas APIs de IA do Google se elas estiverem ligadas no projeto. O Agenda Personal não usa nenhuma delas.
ATIVAS=$(gcloud services list --enabled --project "$PROJETO" --format='value(config.name)')
IA=$(printf '%s\n' "$ATIVAS" | grep -xE 'generativelanguage\.googleapis\.com|aiplatform\.googleapis\.com' || true)
if [ -n "$IA" ]; then
  echo "    PAREI: estas APIs de IA estão ligadas no projeto e podem gerar cobrança com as chaves públicas do app:" >&2
  echo "$IA" | sed 's/^/      /' >&2
  echo "    O Agenda Personal não usa nenhuma delas. Para desligar, cole:" >&2
  echo "$IA" | sed "s/^/      gcloud services disable /; s/\$/ --project $PROJETO/" >&2
  echo "    Depois rode de novo o comando de publicar." >&2
  exit 1
fi
echo "    ok: nenhuma API de IA ligada"

echo "1/4 Descobrindo a região do banco (o gatilho de cadastro precisa ficar nela)..."
LOCAL=$(gcloud firestore databases describe --database='(default)' --project "$PROJETO" --format='value(locationId)')
case "$LOCAL" in
  nam5) REGIAO=us-central1 ;;
  eur3) REGIAO=europe-west1 ;;
  "") echo "Não consegui ler a região do banco. Confira se este é o projeto $PROJETO." >&2; exit 1 ;;
  *) REGIAO="$LOCAL" ;;
esac
echo "    banco em $LOCAL: gatilho em $REGIAO"
printf '{"firestore":"%s"}\n' "$REGIAO" > functions/regiao.json

echo "2/4 Ligando o envio de notificações (Firebase Cloud Messaging)..."
gcloud services enable fcm.googleapis.com --project "$PROJETO"

echo "3/4 Instalando as bibliotecas..."
npm --prefix functions ci --omit=dev --no-audit --no-fund

echo "4/4 Publicando (leva uns minutos)..."
npx -y firebase-tools@latest deploy --only functions:avisos --project "$PROJETO" --force

echo "Pronto: avisos publicados (avisoNovoCadastro, registrarAparelho e testarAviso)."
