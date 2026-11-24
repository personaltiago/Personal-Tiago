package com.tiagolima.agendapersonal;

import android.app.Activity;
import android.app.Instrumentation;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.UiAutomation;
import android.content.Context;
import android.content.Intent;
import android.os.ParcelFileDescriptor;
import android.os.PowerManager;
import android.service.notification.StatusBarNotification;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

/**
 * Aviso no relógio (Android 1.212) num Android de verdade: o emulador do GitHub (Android 14). Só roda no GitHub; não vai para o APK.
 * Confere o caminho inteiro do aparelho: alarme do Android, receptor, canal e notificação, com a tela apagada; e a ponte que o
 * conteúdo usa (window.Android.scheduleWatchNotice). A chegada no relógio depende do app da marca e não é testada aqui.
 */
@RunWith(AndroidJUnit4.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class AvisoRelogioSimulation {
    private static final String PKG = "com.tiagolima.agendapersonal";
    private final Instrumentation ins = InstrumentationRegistry.getInstrumentation();
    private final UiAutomation ui = ins.getUiAutomation();
    private final Context app = ins.getTargetContext();
    private final NotificationManager nm = (NotificationManager) app.getSystemService(Context.NOTIFICATION_SERVICE);
    private final PowerManager power = (PowerManager) app.getSystemService(Context.POWER_SERVICE);

    @Before public void preparar() throws Exception {
        sh("pm grant " + PKG + " android.permission.POST_NOTIFICATIONS");
        sh("appops set " + PKG + " SCHEDULE_EXACT_ALARM allow");
        call("cancelar", app, "professor");
        call("cancelar", app, "aluno");
        nm.cancelAll();
        acordar();
    }

    @Test public void a_fimDoDescansoComTelaApagada() throws Exception {
        assertEquals(Boolean.TRUE, call("ligar", app, true));
        long quando = System.currentTimeMillis() + 8000;
        assertEquals(Boolean.TRUE, call("agendar", app, "aluno", quando, "{\"titulo\":\"Fim do descanso\",\"texto\":\"Leg press 45°\"}"));
        apagar();
        AtomicReference<Boolean> apagadaNoAviso = new AtomicReference<>(null);
        StatusBarNotification n = esperar("aluno", 20000, apagadaNoAviso);
        JSONObject r = relatorio("fim do descanso com a tela apagada", n, quando).put("telaApagadaNoAviso", apagadaNoAviso.get());
        salvar(r);
        acordar();
        assertNotNull("o aviso não apareceu", n);
        assertEquals("relogio", n.getNotification().getChannelId());
        assertEquals("Fim do descanso", n.getNotification().extras.getString(Notification.EXTRA_TITLE));
        assertEquals("Leg press 45°", String.valueOf(n.getNotification().extras.getCharSequence(Notification.EXTRA_TEXT)));
        assertTrue("tela acesa no momento do aviso", Boolean.TRUE.equals(apagadaNoAviso.get()));
        long atraso = n.getPostTime() - quando;
        assertTrue("fora do horário: " + atraso + " ms", atraso >= -100 && atraso < 5000);
    }

    @Test public void b_desmarcadoAntesDoFim() throws Exception {
        call("ligar", app, true);
        long quando = System.currentTimeMillis() + 6000;
        assertEquals(Boolean.TRUE, call("agendar", app, "aluno", quando, "{\"texto\":\"Remada\"}"));
        call("cancelar", app, "aluno");
        apagar();
        StatusBarNotification n = esperar("aluno", 11000, null);
        salvar(relatorio("descanso parado antes do fim (desmarcado)", n, quando));
        acordar();
        assertNull("apareceu um aviso desmarcado", n);
    }

    @Test public void c_substituidoPeloNovoDescanso() throws Exception {
        call("ligar", app, true);
        long primeiro = System.currentTimeMillis() + 5000, segundo = primeiro + 4000;
        call("agendar", app, "professor", primeiro, "{\"texto\":\"Ana · Supino reto\"}");
        call("agendar", app, "professor", segundo, "{\"texto\":\"Ana · Remada curvada\"}");
        apagar();
        Thread.sleep(Math.max(0, primeiro - System.currentTimeMillis() + 1500));
        StatusBarNotification cedo = achar("professor");
        StatusBarNotification n = esperar("professor", 12000, null);
        salvar(relatorio("descanso trocado antes do fim (vale o novo)", n, segundo).put("apareceuNoHorarioAntigo", cedo != null));
        acordar();
        assertNull("o horário antigo ainda mostrou aviso", cedo);
        assertNotNull(n);
        assertEquals("Ana · Remada curvada", String.valueOf(n.getNotification().extras.getCharSequence(Notification.EXTRA_TEXT)));
    }

    @Test public void d_desligadoNaoMarca() throws Exception {
        assertEquals(Boolean.TRUE, call("ligar", app, false));
        long quando = System.currentTimeMillis() + 5000;
        Object marcado = call("agendar", app, "aluno", quando, "{}");
        StatusBarNotification n = esperar("aluno", 8000, null);
        salvar(relatorio("aviso desligado", n, quando).put("marcou", marcado));
        assertEquals(Boolean.FALSE, marcado);
        assertNull(n);
    }

    @Test public void e_testarNoRelogio() throws Exception {
        call("ligar", app, false);
        long pedido = System.currentTimeMillis();
        assertEquals(Boolean.TRUE, call("testar", app));
        apagar();
        StatusBarNotification n = esperar("teste", 20000, null);
        salvar(relatorio("Testar no relógio (desligado)", n, pedido + 10000));
        acordar();
        assertNotNull("o teste não apareceu", n);
        assertEquals("Teste do relógio", n.getNotification().extras.getString(Notification.EXTRA_TITLE));
        long espera = n.getPostTime() - pedido;
        assertTrue("o teste deveria sair em cerca de 10 s: " + espera + " ms", espera >= 9500 && espera < 15000);
    }

    @Test public void f_pelaPonteDoConteudo() throws Exception {
        Intent launch = app.getPackageManager().getLaunchIntentForPackage(PKG);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        String resposta;
        long antes = System.currentTimeMillis();
        try (ActivityScenario<Activity> scenario = ActivityScenario.launch(launch)) {
            Thread.sleep(12000); // a página do app carrega
            AtomicReference<WebView> web = new AtomicReference<>();
            scenario.onActivity(activity -> web.set(findWebView(activity)));
            resposta = avaliar(web.get(), "(function(){var a=window.Android;var f=Date.now()+8000;return JSON.stringify({v:a.getWatchNoticeVersion(),"
                    + "ligar:a.setWatchNoticeEnabled(true),marcar:a.scheduleWatchNotice('professor',f,JSON.stringify({titulo:'Fim do descanso',texto:'Ana Souza · Supino reto'})),"
                    + "fim:f,estado:JSON.parse(a.getWatchNoticeStatus())})})()");
        }
        JSONObject r = new JSONObject(new JSONObject("{\"v\":" + resposta + "}").getString("v"));
        apagar();
        StatusBarNotification n = esperar("professor", 20000, null);
        salvar(relatorio("pela ponte do conteúdo (window.Android)", n, r.optLong("fim", antes)).put("ponte", r));
        acordar();
        assertEquals(1, r.getInt("v"));
        assertTrue(r.getBoolean("ligar") && r.getBoolean("marcar"));
        assertTrue(r.getJSONObject("estado").getBoolean("ativo"));
        assertNotNull("o aviso pedido pela página não apareceu", n);
        assertEquals("Ana Souza · Supino reto", String.valueOf(n.getNotification().extras.getCharSequence(Notification.EXTRA_TEXT)));
    }

    @Test public void g_semAlarmesELembretes() throws Exception {
        sh("appops set " + PKG + " SCHEDULE_EXACT_ALARM deny");
        try {
            call("ligar", app, true);
            JSONObject estado = new JSONObject(String.valueOf(call("status", app)));
            long quando = System.currentTimeMillis() + 8000;
            Object marcado = call("agendar", app, "aluno", quando, "{\"texto\":\"Agachamento\"}");
            apagar();
            StatusBarNotification n = esperar("aluno", 90000, null);
            salvar(relatorio("sem Alarmes e lembretes (com tolerância)", n, quando).put("estado", estado).put("marcou", marcado));
            acordar();
            assertEquals(Boolean.TRUE, marcado);
            assertTrue("o estado deveria mostrar o alarme sem horário exato", !estado.getBoolean("exato"));
            assertNotNull("sem Alarmes e lembretes o aviso não saiu em 90 s", n);
        } finally {
            sh("appops set " + PKG + " SCHEDULE_EXACT_ALARM allow");
        }
    }

    // ---------------------------------------------------------------- apoio

    private StatusBarNotification achar(String chave) {
        for (StatusBarNotification s : nm.getActiveNotifications())
            if (chave.equals(s.getTag()) && s.getId() == 4201) return s;
        return null;
    }

    private StatusBarNotification esperar(String chave, long limite, AtomicReference<Boolean> apagada) throws Exception {
        long fim = System.currentTimeMillis() + limite;
        while (System.currentTimeMillis() < fim) {
            StatusBarNotification s = achar(chave);
            if (s != null) {
                if (apagada != null) apagada.set(!power.isInteractive());
                return s;
            }
            Thread.sleep(200);
        }
        return null;
    }

    private JSONObject relatorio(String cenario, StatusBarNotification n, long previsto) throws Exception {
        JSONObject r = new JSONObject().put("cenario", cenario).put("apareceu", n != null);
        if (n != null) {
            Notification x = n.getNotification();
            r.put("canal", x.getChannelId()).put("titulo", x.extras.getString(Notification.EXTRA_TITLE))
                    .put("texto", String.valueOf(x.extras.getCharSequence(Notification.EXTRA_TEXT)))
                    .put("atrasoMs", n.getPostTime() - previsto).put("fixo", (x.flags & Notification.FLAG_ONGOING_EVENT) != 0)
                    .put("someEmMs", x.getTimeoutAfter()).put("publicoSemTexto", x.publicVersion != null
                            && String.valueOf(x.publicVersion.extras.getCharSequence(Notification.EXTRA_TEXT)).equals("Toque para abrir o treino."));
        }
        return r;
    }

    private void salvar(JSONObject r) throws Exception {
        File dir = new File(app.getExternalFilesDir(null), "aviso-relogio");
        dir.mkdirs();
        try (FileWriter out = new FileWriter(new File(dir, "relatorio.jsonl"), true)) { out.write(r.toString() + "\n"); }
    }

    private void apagar() throws Exception { sh("input keyevent KEYCODE_SLEEP"); Thread.sleep(1200); }

    private void acordar() throws Exception { sh("input keyevent KEYCODE_WAKEUP"); sh("wm dismiss-keyguard"); Thread.sleep(800); }

    /** AvisosRelogio é do pacote do app: chamado por reflexão, sem depender do carregador de classes do teste. */
    private static Object call(String method, Object... args) {
        try {
            Class<?> c = Class.forName(PKG + ".AvisosRelogio", true, InstrumentationRegistry.getInstrumentation().getTargetContext().getClassLoader());
            for (java.lang.reflect.Method m : c.getDeclaredMethods()) {
                if (m.getName().equals(method) && m.getParameterTypes().length == args.length) {
                    m.setAccessible(true);
                    return m.invoke(null, args);
                }
            }
            return "método não encontrado: " + method;
        } catch (Exception e) { return "erro " + e; }
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

    private String avaliar(WebView web, String js) throws Exception {
        if (web == null) return "\"sem WebView\"";
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>("\"sem resposta\"");
        ins.runOnMainSync(() -> web.evaluateJavascript(js, v -> { value.set(v); done.countDown(); }));
        done.await(20, TimeUnit.SECONDS);
        return value.get();
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
