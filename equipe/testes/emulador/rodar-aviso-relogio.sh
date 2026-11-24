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
adb shell am instrument -w -r -e class com.tiagolima.agendapersonal.AvisoRelogioSimulation \
  com.tiagolima.agendapersonal.test/androidx.test.runner.AndroidJUnitRunner | tee /tmp/instrumentacao.txt
echo "===== RELATÓRIO (um cenário por linha)"
adb shell cat /sdcard/Android/data/com.tiagolima.agendapersonal/files/aviso-relogio/relatorio.jsonl || echo "sem relatório"
echo "===== NOTIFICAÇÕES DO APP (dumpsys)"
adb shell dumpsys notification --noredact | grep -E "pkg=com.tiagolima.agendapersonal|channel=relogio|android.title|android.text" | head -40 || true
echo "===== CANAL"
adb shell dumpsys notification --noredact | grep -E "mId='?relogio" | head -5 || true
if grep -q "FAILURES!!!" /tmp/instrumentacao.txt || ! grep -q "^OK (" /tmp/instrumentacao.txt; then
  adb logcat -d -v time | grep -E "AndroidRuntime|agendapersonal|FATAL" | tail -120
  echo "SIMULAÇÃO REPROVADA"; exit 1
fi
echo "SIMULAÇÃO APROVADA"
