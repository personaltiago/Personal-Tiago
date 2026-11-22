package com.tiagolima.agendapersonal;

import android.app.AlertDialog;
import android.net.Uri;
import android.webkit.WebView;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.TreeMap;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Ferramentas comuns dos testes de regressão com o código REAL do aplicativo (UpdateManager e UpdateAreaPatch do ZIP oficial):
 * um aparelho de mentira com o UpdateManager de verdade (Device), a leitura da revisão de importação e a classificação de cada correção
 * por área da main num conteúdo (presente, evoluída, aplicável ou conflito). Extraído do teste do 1.12.294 (PR #21) sem mudar a lógica.
 */
public final class RegressaoBase {
    static final String TEACHER = "R2EmnDVcvMWt7TjPxOP6DjW1VOn1";
    static final String APP = "com.tiagolima.agendapersonal";
    static final String[] PAGES = {"index.html", "professor.html", "avaliacoes.html", "cadastro.html"};
    static final int LIMIT = 32 * 1024 * 1024;
    static int checks;

    static void check(boolean ok, String message) { checks++; if (!ok) throw new AssertionError(message); }

    static Object field(Object o, String name) throws Exception {
        Field f = o.getClass().getDeclaredField(name);
        f.setAccessible(true);
        return f.get(o);
    }

    static JSONObject read(String file) throws Exception { return new JSONObject(Files.readString(Path.of(file))); }

    static String sha256(String text) throws Exception {
        StringBuilder out = new StringBuilder();
        for (byte b : MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8))) out.append(String.format("%02x", b));
        return out.toString();
    }

    static void waitFor(UpdateManager m, boolean wantReview) throws Exception {
        long until = System.currentTimeMillis() + 90000;
        while (System.currentTimeMillis() < until) {
            AlertDialog d = (AlertDialog) field(m, "reviewDialog");
            if (wantReview && d != null && d.isShowing() && d.getButton(AlertDialog.BUTTON_POSITIVE).listener != null) return;
            if (!wantReview && !Boolean.TRUE.equals(field(m, "busy"))) return;
            Thread.sleep(5);
        }
        throw new AssertionError("Operação não terminou: review=" + wantReview + "; " + android.widget.Toast.shown);
    }

    static void click(AlertDialog dialog, int which) {
        android.widget.Button b = dialog.getButton(which);
        if (b.listener != null) b.listener.click(b);
    }

    static String fingerprint(UpdateManager manager, JSONObject release) throws Exception {
        Method method = UpdateManager.class.getDeclaredMethod("contentIdentity", JSONObject.class);
        method.setAccessible(true);
        return (String) method.invoke(manager, release);
    }

    static String refusal(JSONObject release, JSONObject patch) throws Exception {
        try { UpdateAreaPatch.apply(release, patch, APP, LIMIT); return null; }
        catch (UpdateAreaPatch.Invalid refused) { return refused.getMessage(); }
    }

    /** Um aparelho de mentira com o UpdateManager de verdade e o conteúdo informado instalado. */
    static final class Device {
        final Path folder, file;
        final MainActivity activity;
        final WebView view;
        final UpdateManager manager;

        Device(Path project, JSONObject installed) throws Exception {
            folder = Files.createTempDirectory("agenda-regressao-");
            file = folder.resolve("selected.json");
            Files.createDirectories(folder.resolve("updates"));
            Files.write(folder.resolve("updates/active.json"), installed.toString().getBytes(StandardCharsets.UTF_8));
            activity = new MainActivity(folder.toFile(), project.resolve("app/src/main/assets"));
            view = new WebView();
            manager = new UpdateManager(activity, view);
            view.reader = manager::localResponse;
            check(field(manager, "active") != null, "O conteúdo instalado não abriu");
            manager.setUpdateAccount(TEACHER);
            manager.openPage(Uri.parse(LocalPages.HOME));
            view.awaitLoads(1);
            view.ready = true;
            manager.pageReady();
        }

        JSONObject active() throws Exception { return (JSONObject) field(manager, "active"); }

        AlertDialog select(JSONObject value) throws Exception {
            Files.writeString(file, value.toString());
            manager.importUri(Uri.parse(file.toUri().toString()));
            waitFor(manager, true);
            return (AlertDialog) field(manager, "reviewDialog");
        }

        /** Seleciona o arquivo e confirma o que o aplicativo mostrar (qualquer que seja o título); devolve o título da revisão. */
        String install(JSONObject value) throws Exception {
            AlertDialog review = select(value);
            String title = review.title;
            int loads = view.loads;
            click(review, AlertDialog.BUTTON_POSITIVE);
            view.awaitLoads(loads + 1);
            view.ready = true;
            manager.pageReady();
            waitFor(manager, false);
            return title;
        }

        /** Seleciona o arquivo, devolve o título, a mensagem e o botão de confirmar da revisão e cancela (nada é instalado). */
        String[] reviewAndCancel(JSONObject value) throws Exception {
            JSONObject before = active();
            AlertDialog review = select(value);
            String[] shown = {review.title, review.message, review.getButton(AlertDialog.BUTTON_POSITIVE).text};
            click(review, AlertDialog.BUTTON_NEGATIVE);
            waitFor(manager, false);
            check(active() == before, "Cancelar a revisão mudou o conteúdo instalado");
            return shown;
        }

        /** Seleciona o arquivo e confere que o aplicativo NÃO abre revisão nem recarrega a página (conteúdo idêntico ao instalado). */
        void importIsIgnored(JSONObject value) throws Exception {
            JSONObject before = active();
            int loads = view.loads;
            Files.writeString(file, value.toString());
            manager.importUri(Uri.parse(file.toUri().toString()));
            waitFor(manager, false);
            check(field(manager, "reviewDialog") == null, "O aplicativo ofereceu instalar um conteúdo que já está instalado");
            check(active() == before && view.loads == loads, "O aplicativo mexeu em um conteúdo que já está instalado");
        }
    }

    static void samePages(JSONObject actual, JSONObject expected, String what) throws Exception {
        for (String page : PAGES)
            check(actual.getJSONObject("files").getString(page).equals(expected.getJSONObject("files").getString(page)), what + ": a página " + page + " é diferente");
    }

    /** Cópia da correção só com as mudanças pedidas; `professorExtra` acrescenta um texto à cópia do professor (e refaz o SHA-256 dela). */
    static JSONObject variant(JSONObject patch, boolean withTeacher, String professorExtra) throws Exception {
        JSONObject copy = new JSONObject(patch.toString());
        JSONArray changes = new JSONArray();
        JSONArray original = patch.getJSONArray("changes");
        for (int i = 0; i < original.length(); i++) {
            JSONObject entry = new JSONObject(original.optJSONObject(i).toString());
            if (entry.getString("page").equals("professor.html")) {
                if (!withTeacher) continue;
                String content = entry.getString("content") + professorExtra;
                entry.put("content", content).put("after", sha256(content));
            }
            changes.put(entry);
        }
        return copy.put("changes", changes);
    }


    static final String PRESENT = "Esta correção já está presente.";

    /** "presente", "aplicável" (entraria sem conflito) ou "conflito: motivo" — a situação de uma correção por área num conteúdo. */
    static String status(JSONObject release, JSONObject patch) throws Exception {
        String refused = refusal(release, patch);
        return refused == null ? "aplicável" : PRESENT.equals(refused) ? "presente" : "conflito: " + refused;
    }

    static String kind(String status) { return status.startsWith("conflito") ? "conflito" : status; }


    static TreeMap<String, JSONObject> ALL = new TreeMap<>();
    // Continuações AUTORIZADAS de pacotes completos já assinados (até a referência): {página, id, antes, depois}. Contam como continuação
    // legítima de um bloco, como as correções da main (o 1.12.302 continuou o bloco dos complementos de feedback).
    static final List<String[]> CONTINUACOES = new ArrayList<>();

    /** Cópia da correção só com a mudança de índice i (para saber, uma a uma, o que o conteúdo já tem). */
    static JSONObject only(JSONObject patch, int i) throws Exception {
        // id próprio: a pergunta é só se o CONTEÚDO já tem a mudança, sem o app confundir com a correção inteira já registrada no histórico
        return new JSONObject(patch.toString()).put("id", patch.getString("id") + "-mudanca-" + i).put("changes", new JSONArray().put(new JSONObject(patch.getJSONArray("changes").getJSONObject(i).toString())));
    }

    /** Hashes que um bloco (página|bloco) pode ter depois do "depois" de uma mudança: segue as correções da main que continuam a partir dele. */
    static boolean reaches(String page, String id, String from, String to) throws Exception {
        java.util.Set<String> seen = new java.util.HashSet<>(), queue = new java.util.LinkedHashSet<>();
        queue.add(from);
        while (!queue.isEmpty()) {
            String now = queue.iterator().next();
            queue.remove(now);
            if (!seen.add(now)) continue;
            if (now.equals(to)) return true;
            for (JSONObject other : ALL.values()) {
                JSONArray list = other.getJSONArray("changes");
                for (int i = 0; i < list.length(); i++) {
                    JSONObject c = list.getJSONObject(i);
                    if (c.getString("page").equals(page) && c.getString("id").equals(id) && c.getString("before").equals(now)) queue.add(c.getString("after"));
                }
            }
            for (String[] e : CONTINUACOES) if (e[0].equals(page) && e[1].equals(id) && e[2].equals(now)) queue.add(e[3]);
        }
        return false;
    }

    /**
     * Situação de uma correção por área da main num conteúdo, com o app de verdade (UpdateAreaPatch): "presente"; "evoluída" (cada bloco que ela
     * mexe ou já está como ela deixou, ou foi continuado por OUTRA correção da main que parte do "depois" dela e que está presente);
     * "aplicável" (ainda entraria sem conflito) ou "conflito: motivo".
     */
    static String classify(JSONObject release, JSONObject patch) throws Exception {
        String whole = status(release, patch);
        if (whole.equals("presente") || whole.equals("aplicável")) return whole;
        JSONArray list = patch.getJSONArray("changes");
        List<String> by = new ArrayList<>();
        for (int i = 0; i < list.length(); i++) {
            JSONObject c = list.getJSONObject(i);
            if (status(release, only(patch, i)).equals("presente")) continue;
            String found = null;
            for (var entry : ALL.entrySet()) {
                JSONObject other = entry.getValue();
                if (other.getString("id").equals(patch.getString("id"))) continue;
                JSONArray otherList = other.getJSONArray("changes");
                for (int j = 0; j < otherList.length() && found == null; j++) {
                    JSONObject d = otherList.getJSONObject(j);
                    if (d.getString("page").equals(c.getString("page")) && d.getString("id").equals(c.getString("id"))
                        && reaches(c.getString("page"), c.getString("id"), c.getString("after"), d.getString("after")) && status(release, only(other, j)).equals("presente"))
                        found = entry.getKey().replace("AgendaPersonal-", "").replace(".agenda.json", "") + " (" + c.getString("id") + ")";
                }
                if (found != null) break;
            }
            if (found == null) {
                // continuada por um pacote completo autorizado e já assinado: a linha parte do "depois" dela e chega ao bloco atual
                String atual = RegressaoHarness.blockHash(release.getJSONObject("files").getString(c.getString("page")), c.getString("id"));
                if (reaches(c.getString("page"), c.getString("id"), c.getString("after"), atual)) found = "continuação autorizada (" + c.getString("id") + ")";
            }
            if (found == null) return whole;
            by.add(found);
        }
        return by.isEmpty() ? "presente" : "evoluída por " + String.join(", ", new java.util.LinkedHashSet<>(by));
    }

    static boolean kept(String classified) { return classified.equals("presente") || classified.startsWith("evoluída"); }
    static String shortKind(String classified) { return classified.startsWith("evoluída") ? "evoluída" : kind(classified); }

}
