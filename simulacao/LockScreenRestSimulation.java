package com.tiagolima.agendapersonal;

import android.app.Activity;
import android.app.Instrumentation;
import android.app.UiAutomation;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.ParcelFileDescriptor;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Simulação do descanso na tela bloqueada (só roda no GitHub, não vai para o APK).
 * Abre o app de verdade, chama window.Android.startWorkoutRest pela página (o mesmo caminho da tela
 * do professor), bloqueia a tela, tira print e anota o que o Android mostrou.
 */
@RunWith(AndroidJUnit4.class)
public class LockScreenRestSimulation {
    private static final String PKG = "com.tiagolima.agendapersonal";
    private final Instrumentation ins = InstrumentationRegistry.getInstrumentation();
    private final UiAutomation ui = ins.getUiAutomation();
    private final Context app = ins.getTargetContext();

    @Test public void descansoComAlarmesELembretesLigado() throws Exception { cenario("1-alarmes-ligado", "allow"); }
    @Test public void descansoComAlarmesELembretesDesligado() throws Exception { cenario("2-alarmes-desligado", "deny"); }

    private void cenario(String nome, String exactAlarm) throws Exception {
        File dir = new File(app.getExternalFilesDir(null), "simulacao");
        dir.mkdirs();
        JSONObject report = new JSONObject().put("cenario", nome).put("alarmesELembretes", exactAlarm);
        sh("pm grant " + PKG + " android.permission.POST_NOTIFICATIONS");
        sh("appops set " + PKG + " SCHEDULE_EXACT_ALARM " + exactAlarm);
        sh("appops set " + PKG + " USE_EXACT_ALARM " + exactAlarm);
        call("AlarmScheduler", "cancelWorkoutRest", app);
        call("AlarmStore", "recordDelivery", app, "(simulação: antes do descanso)");
        sh("input keyevent KEYCODE_WAKEUP");
        sh("wm dismiss-keyguard");
        Thread.sleep(1500);

        Intent launch = app.getPackageManager().getLaunchIntentForPackage(PKG);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        try (ActivityScenario<Activity> scenario = ActivityScenario.launch(launch)) {
            Thread.sleep(12000); // a página do app carrega
            AtomicReference<WebView> web = new AtomicReference<>();
            scenario.onActivity(activity -> web.set(findWebView(activity)));
            report.put("webViewEncontrado", web.get() != null);
            long end = System.currentTimeMillis() + 120000L;
            String rest = new JSONObject().put("id", "sim").put("studentId", "s").put("planId", "p").put("dayId", "d")
                .put("exerciseId", "e").put("student", "Aluno Simulação").put("exercise", "Abdução de Quadril Máquina")
                .put("seconds", 120).put("endAt", end).put("triggerAtMillis", end).put("accent", "#9CC72C").toString();
            String js = "(function(){var o={pagina:location.href.slice(0,80),temAndroid:!!window.Android,"
                + "temStartWorkoutRest:!!(window.Android&&typeof Android.startWorkoutRest==='function')};"
                + "try{o.resultado=String(window.Android.startWorkoutRest(" + JSONObject.quote(rest) + "))}catch(e){o.resultado='ERRO '+e}"
                + "try{o.status=String(window.Android.getTimerOverlayStatus())}catch(e){o.status='ERRO '+e}return JSON.stringify(o)})()";
            report.put("pagina", evaluate(web.get(), js));
            Thread.sleep(4000);
            report.put("notificacaoComAppAberto", notificationDump());
            report.put("despertadorUltimoDisparo", String.valueOf(call("AlarmStore", "lastDelivery", app)));
            save(dir, nome + "-app-aberto.png");

            sh("input keyevent KEYCODE_SLEEP");
            Thread.sleep(2500);
            sh("input keyevent KEYCODE_WAKEUP");
            Thread.sleep(4000);
            save(dir, nome + "-tela-bloqueada.png");
            report.put("notificacaoComTelaBloqueada", notificationDump());
            report.put("telaBloqueada", sh("dumpsys window").contains("mDreamingLockscreen=true")
                || sh("dumpsys window policy").contains("showing=true"));
            report.put("despertadorDepois", String.valueOf(call("AlarmStore", "lastDelivery", app)));
        } finally {
            call("AlarmScheduler", "cancelWorkoutRest", app);
            sh("input keyevent KEYCODE_WAKEUP");
            sh("wm dismiss-keyguard");
        }
        try (FileOutputStream out = new FileOutputStream(new File(dir, nome + ".json"))) {
            out.write(report.toString(2).getBytes(StandardCharsets.UTF_8));
        }
        android.util.Log.i("AgendaSim", report.toString());
    }

    /** Package-private app methods, called by reflection so the test APK's class loader never matters. */
    private static Object call(String cls, String method, Object... args) {
        try {
            Class<?> c = Class.forName(PKG + "." + cls, true, InstrumentationRegistry.getInstrumentation().getTargetContext().getClassLoader());
            for (java.lang.reflect.Method m : c.getDeclaredMethods()) {
                if (m.getName().equals(method) && m.getParameterTypes().length == args.length) {
                    m.setAccessible(true);
                    return m.invoke(null, args);
                }
            }
            return "método não encontrado: " + cls + "." + method;
        } catch (Exception e) { return "erro " + e; }
    }

    private String notificationDump() throws Exception {
        String all = sh("dumpsys notification --noredact");
        StringBuilder found = new StringBuilder();
        boolean ours = false;
        for (String line : all.split("\n")) {
            if (line.contains("NotificationRecord(")) ours = line.contains("pkg=" + PKG);
            if (ours && (line.contains("NotificationRecord(") || line.contains("android.title") || line.contains("android.text")
                    || line.contains("channel=") || line.contains("visibility") || line.contains("flags=")
                    || line.contains("importance") || line.contains("chronometer"))) found.append(line.trim()).append('\n');
        }
        return found.length() == 0 ? "NENHUMA notificação do Agenda Personal" : found.toString();
    }

    private static WebView findWebView(Activity activity) {
        for (Class<?> c = activity.getClass(); c != null; c = c.getSuperclass()) {
            for (Field f : c.getDeclaredFields()) {
                if (WebView.class.isAssignableFrom(f.getType())) {
                    try { f.setAccessible(true); return (WebView) f.get(activity); } catch (Exception ignored) { }
                }
            }
        }
        return null;
    }

    private String evaluate(WebView web, String js) throws Exception {
        if (web == null) return "sem WebView";
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>("sem resposta");
        ins.runOnMainSync(() -> web.evaluateJavascript(js, v -> { value.set(v); done.countDown(); }));
        done.await(20, TimeUnit.SECONDS);
        return value.get();
    }

    private void save(File dir, String name) throws Exception {
        Bitmap shot = ui.takeScreenshot();
        if (shot == null) return;
        try (FileOutputStream out = new FileOutputStream(new File(dir, name))) {
            shot.compress(Bitmap.CompressFormat.PNG, 100, out);
        }
    }

    private String sh(String command) throws Exception {
        ParcelFileDescriptor pfd = ui.executeShellCommand(command);
        StringBuilder out = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ParcelFileDescriptor.AutoCloseInputStream(pfd), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) out.append(line).append('\n');
        }
        return out.toString();
    }
}
