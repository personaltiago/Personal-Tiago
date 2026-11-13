#!/usr/bin/env bash
# Roda dentro do emulador do GitHub. Não falha o job: o resultado sempre volta para o repositório.
set -x
OUT="$GITHUB_WORKSPACE/simulacao/resultado"
rm -rf "$OUT"; mkdir -p "$OUT"
adb install -r -g "$APP_APK" > "$OUT/instalacao.txt" 2>&1
adb install -r -g "$TEST_APK" >> "$OUT/instalacao.txt" 2>&1
adb shell locksettings set-disabled false || true
adb shell settings put secure lock_screen_show_notifications 1
adb shell settings put secure lock_screen_allow_private_notifications 1
adb shell getprop ro.build.version.release > "$OUT/android.txt"
adb logcat -c
adb shell am instrument -w -r com.tiagolima.agendapersonal.test/androidx.test.runner.AndroidJUnitRunner > "$OUT/instrumentacao.txt" 2>&1
adb pull /sdcard/Android/data/com.tiagolima.agendapersonal/files/simulacao/. "$OUT/" || true
adb logcat -d -v time | grep -E "AgendaSim|AndroidRuntime|agendapersonal|ForegroundService|FATAL|chromium" | tail -400 > "$OUT/logcat.txt" || true
exit 0
