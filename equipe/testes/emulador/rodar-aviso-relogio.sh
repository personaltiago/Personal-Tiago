#!/usr/bin/env bash
# Roda dentro do emulador do GitHub (Android 14): instala o app de teste e a simulação do aviso no relógio, roda e mostra o relatório.
# Falha o job se algum cenário falhar. Não publica nada e não grava no repositório.
set -u
adb install -r -g "$APP_APK"
adb install -r -g "$TEST_APK"
adb shell locksettings set-disabled false || true
adb shell settings put secure lock_screen_show_notifications 1
echo "Android $(adb shell getprop ro.build.version.release)"
adb logcat -c
T=com.tiagolima.agendapersonal.AvisoRelogioSimulation
R=com.tiagolima.agendapersonal.test/androidx.test.runner.AndroidJUnitRunner
# Rodada 1: com "Alarmes e lembretes" (horário exato).
adb shell appops set com.tiagolima.agendapersonal SCHEDULE_EXACT_ALARM allow
adb shell am instrument -w -r -e notClass "$T#g_semAlarmesELembretes" "$R" | tee /tmp/rodada1.txt
# Rodada 2: sem "Alarmes e lembretes". Desligar a permissão encerra o app, por isso é feito antes, com o app fechado.
adb shell appops set com.tiagolima.agendapersonal SCHEDULE_EXACT_ALARM deny
sleep 2
adb shell am instrument -w -r -e class "$T#g_semAlarmesELembretes" "$R" | tee /tmp/rodada2.txt
adb shell appops set com.tiagolima.agendapersonal SCHEDULE_EXACT_ALARM allow
cat /tmp/rodada1.txt /tmp/rodada2.txt > /tmp/instrumentacao.txt
echo "===== RELATÓRIO (um cenário por linha)"
adb shell cat /sdcard/Android/data/com.tiagolima.agendapersonal/files/aviso-relogio/relatorio.jsonl || echo "sem relatório"
echo "===== NOTIFICAÇÕES DO APP (dumpsys)"
adb shell dumpsys notification --noredact | grep -E "pkg=com.tiagolima.agendapersonal|channel=relogio|android.title|android.text" | head -40 || true
echo "===== CANAL"
adb shell dumpsys notification --noredact | grep -E "mId='?relogio" | head -5 || true
if grep -q "FAILURES!!!\|Process crashed" /tmp/instrumentacao.txt || ! grep -q "^OK (6 tests)" /tmp/rodada1.txt || ! grep -q "^OK (1 test)" /tmp/rodada2.txt; then
  adb logcat -d -v time | grep -E "AndroidRuntime|agendapersonal|FATAL" | tail -120
  echo "SIMULAÇÃO REPROVADA"; exit 1
fi
echo "SIMULAÇÃO APROVADA"
