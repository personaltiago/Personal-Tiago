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
 * Confere o pacote 1.12.293 (ícone do feedback personalizável, sobre o 1.12.292) contra o código REAL do aplicativo (UpdateAreaPatch,
 * UpdateIdentity e UpdateManager, compilados com as mesmas imitações simples de Android dos testes oficiais). Não é teste em aparelho
 * nem APK assinado.
 *
 * Argumentos: <pasta do projeto Android> <pacote 288> <pacote 291> <pacote 292> <pacote 293> <correção por área equivalente> <pasta das
 * correções da main, com esperado.json>
 *
 * A. A mesma mudança como correção por área (módulo feedback da área Evolução: script e estilo do aluno e o estilo compartilhado nas DUAS
 *    páginas), aplicada pelo UpdateAreaPatch de verdade sobre o 1.12.292, dá exatamente as quatro páginas do pacote, com a numeração
 *    do pacote (1.12.293, sequência 399); a regra do componente compartilhado (aluno e professor iguais) é respeitada.
 * B. RETENÇÃO. Cada correção por área que o Tiago subiu na raiz da main é aplicada (pelo UpdateAreaPatch) ao conteúdo do 1.12.288, do
 *    1.12.291, do 1.12.292 e do 1.12.293: "presente" (já está no conteúdo), "aplicável" (ainda entraria) ou "conflito". O 293 tem de
 *    estar como o esperado.json diz e tem de ter EXATAMENTE a situação do 292 em cada correção (nenhuma foi perdida pelo ícone).
 * C. Aparelhos de mentira com o UpdateManager de verdade: o 293 sobre o 292, o 291, o 288 e sobre um 288 que já recebeu, pela janela
 *    de revisão, todas as correções da main que ainda cabem: aparece "Revisar atualização", instala, o conteúdo é o do pacote, nenhuma
 *    correção da main que estava presente se perde, e importar de novo é ignorado ("já está instalado"); voltar ao 292 é "restauração".
 */
public final class IconeFeedbackHarness {
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
            folder = Files.createTempDirectory("agenda-293-");
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

    /** Cópia da correção só com a mudança de índice i (para saber, uma a uma, o que o conteúdo já tem). */
    static JSONObject only(JSONObject patch, int i) throws Exception {
        return new JSONObject(patch.toString()).put("changes", new JSONArray().put(new JSONObject(patch.getJSONArray("changes").getJSONObject(i).toString())));
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
            if (found == null) return whole;
            by.add(found);
        }
        return by.isEmpty() ? "presente" : "evoluída por " + String.join(", ", new java.util.LinkedHashSet<>(by));
    }

    static boolean kept(String classified) { return classified.equals("presente") || classified.startsWith("evoluída"); }
    static String shortKind(String classified) { return classified.startsWith("evoluída") ? "evoluída" : kind(classified); }

    public static void main(String[] args) throws Exception {
        Path project = Path.of(args[0]);
        JSONObject s288 = read(args[1]), s291 = read(args[2]), s292 = read(args[3]), mine = read(args[4]), patch = read(args[5]);
        Path folder = Path.of(args[6]);
        JSONObject expected = read(folder.resolve("esperado.json").toString());
        check(s288.getString("version").equals("1.12.288"), "O ponto de partida antigo não é o 1.12.288");
        check(s291.getString("version").equals("1.12.291") && s291.getInt("sequence") == 397, "Não é o 1.12.291 (seq 397)");
        check(s292.getString("version").equals("1.12.292") && s292.getInt("sequence") == 398, "Não é o 1.12.292 (seq 398)");
        check(mine.getString("version").equals("1.12.293") && mine.getInt("sequence") == 399, "O pacote não é o 1.12.293 (seq 399)");
        check(!mine.has("agendaSignature"), "O pacote não pode vir assinado (quem assina é o fluxo do GitHub)");
        JSONArray listed = patch.getJSONArray("changes");
        check(listed.length() == 3, "A correção equivalente devia ter 3 mudanças (script e estilo do aluno, estilo do professor)");

        // ---------- A. Montagem pelo código real do aplicativo ----------
        check(UpdateAreaPatch.inverse(s292, patch) != null, "A correção por área não tem reversão sobre o 1.12.292");
        JSONObject viaPatch = UpdateAreaPatch.apply(s292, patch, APP, LIMIT);
        check(viaPatch.getString("version").equals("1.12.293") && viaPatch.getInt("sequence") == 399, "O app numeraria a correção como " + viaPatch.getString("version") + "/" + viaPatch.getInt("sequence"));
        samePages(viaPatch, mine, "Pacote x correção por área aplicada pelo app");
        for (String page : new String[]{"avaliacoes.html", "cadastro.html"})
            check(mine.getJSONObject("files").getString(page).equals(s292.getJSONObject("files").getString(page)), "A página " + page + " não deveria mudar");
        for (String page : new String[]{"index.html", "professor.html"})
            check(!mine.getJSONObject("files").getString(page).equals(s292.getJSONObject("files").getString(page)), "A página " + page + " devia mudar");
        check(mine.getJSONArray("modularUpdates").toString().equals(s292.getJSONArray("modularUpdates").toString()), "O pacote completo não deve acrescentar registro ao histórico de correções");
        check(PRESENT.equals(refusal(mine, patch)) && PRESENT.equals(refusal(viaPatch, patch)), "A correção por área devia constar como já presente no pacote e depois de aplicada");
        String shared = "precisa da mesma correção no aluno e no professor";
        String onlyStudent = refusal(s292, variant(patch, false, ""));
        check(onlyStudent != null && onlyStudent.contains(shared), "O app devia recusar a mudança do estilo só no aluno, mas: " + onlyStudent);
        String different = refusal(s292, variant(patch, true, " "));
        check(different != null && different.contains(shared), "O app devia recusar a cópia do professor diferente da do aluno, mas: " + different);
        check(refusal(s292, variant(patch, true, "")) == null, "A correção inteira devia ser aceita pelo app");

        // ---------- B. Retenção das correções da main ----------
        List<String> names = new ArrayList<>();
        try (var stream = Files.list(folder)) { stream.map(p -> p.getFileName().toString()).filter(n -> n.endsWith(".agenda.json")).sorted().forEach(names::add); }
        List<String> listedNames = new ArrayList<>();
        for (var it = expected.keys(); it.hasNext(); ) listedNames.add(it.next());
        java.util.Collections.sort(listedNames);
        check(names.equals(listedNames), "As correções da pasta não são as do esperado.json: " + names + " x " + listedNames);
        TreeMap<String, JSONObject> patches = ALL;
        for (String name : names) patches.put(name, read(folder.resolve(name).toString()));
        System.out.println("Situação de cada correção por área da main (presente / evoluída / aplicável / conflito) em cada pacote:");
        System.out.println(String.format("  %-52s %-10s %-10s %-10s %s", "correção", "1.12.288", "1.12.291", "1.12.292", "1.12.293"));
        TreeMap<String, String> on293 = new TreeMap<>();
        for (String name : names) {
            JSONObject p = patches.get(name);
            String a = classify(s288, p), b = classify(s291, p), c = classify(s292, p), d = classify(mine, p);
            System.out.println(String.format("  %-52s %-10s %-10s %-10s %s", name.replace("AgendaPersonal-", "").replace(".agenda.json", ""), shortKind(a), shortKind(b), shortKind(c), d.length() > 110 ? d.substring(0, 110) + "…" : d));
            check(shortKind(d).equals(expected.getString(name)), name + ": no 1.12.293 devia ser '" + expected.getString(name) + "', mas é: " + d);
            check(d.equals(c), name + ": a situação mudou do 1.12.292 para o 1.12.293 (" + c + " -> " + d + "): o ícone mexeu em algo que a correção toca");
            on293.put(name, d);
        }
        long keptCount = on293.values().stream().filter(IconeFeedbackHarness::kept).count();
        check(keptCount >= 8, "Menos de 8 correções da main mantidas no 1.12.293: " + keptCount);

        // ---------- C. Aparelhos de mentira (UpdateManager de verdade) ----------
        // C1. 292 -> 293
        Device d292 = new Device(project, s292);
        try {
            String[] shown = d292.reviewAndCancel(mine);
            check(shown[0].equals("Revisar atualização"), "Título da revisão do pacote: " + shown[0]);
            check(shown[1].contains("Versão instalada: 1.12.292") && shown[1].contains("Versão do arquivo: 1.12.293"), "Versões não apresentadas: " + shown[1].substring(0, Math.min(140, shown[1].length())));
            check(shown[1].contains(mine.getString("notes")), "A janela de revisão não traz as notas do pacote");
            check(!shown[1].contains("versão anterior") && !shown[1].contains("numeração é igual"), "O aplicativo tratou o pacote como versão anterior ou de numeração igual");
            check(shown[2].equals("Sim, atualizar"), "Botão de confirmar: " + shown[2]);
            check(d292.install(mine).equals("Revisar atualização"), "Título ao instalar");
            JSONObject saved = d292.active();
            check(saved.getString("version").equals("1.12.293") && saved.getInt("sequence") == 399, "Numeração depois de instalar");
            samePages(saved, mine, "Depois de instalar o pacote sobre o 292");
            check(saved.getJSONArray("modularUpdates").toString().equals(s292.getJSONArray("modularUpdates").toString()), "O histórico de correções não devia mudar ao instalar o pacote completo");
            for (String name : names) check(classify(saved, patches.get(name)).equals(on293.get(name)), name + ": depois de instalar o 293 sobre o 292 a situação é outra");
            d292.importIsIgnored(mine);
            check(fingerprint(d292.manager, saved).equals(fingerprint(d292.manager, mine)), "A identidade de conteúdo do aparelho difere da do pacote");
            check(!fingerprint(d292.manager, saved).equals(fingerprint(d292.manager, s292)), "A identidade de conteúdo do 293 não pode ser a do 292");
            String[] back = d292.reviewAndCancel(s292);
            check(back[0].equals("Revisar restauração") && back[2].equals("Restaurar esta versão"), "O 1.12.292 sobre o 293 devia aparecer como restauração: " + back[0] + " / " + back[2]);
            check(back[1].contains("Este arquivo é de uma versão anterior") && back[1].contains("pode retirar funções mais recentes"), "A restauração não avisa que retira funções mais recentes");
        } finally { d292.manager.destroy(); }

        // C2 e C3. 291 -> 293 e 288 -> 293 (o pacote é cumulativo: dá para pular as versões do meio)
        for (JSONObject from : new JSONObject[]{s291, s288}) {
            Device dev = new Device(project, from);
            try {
                String[] shown = dev.reviewAndCancel(mine);
                check(shown[0].equals("Revisar atualização") && shown[1].contains("Versão instalada: " + from.getString("version")) && shown[1].contains("Versão do arquivo: 1.12.293"), "Revisão sobre o " + from.getString("version") + ": " + shown[0]);
                check(dev.install(mine).equals("Revisar atualização"), "Título ao instalar sobre o " + from.getString("version"));
                samePages(dev.active(), mine, "Depois de instalar o pacote sobre o " + from.getString("version"));
                for (String name : names) check(classify(dev.active(), patches.get(name)).equals(on293.get(name)), name + ": depois de instalar o 293 sobre o " + from.getString("version") + " a situação é outra");
                dev.importIsIgnored(mine);
            } finally { dev.manager.destroy(); }
        }

        // C4. O aparelho do Tiago: 1.12.288 que já recebeu, pela janela de revisão, todas as correções da main que ainda cabem (em rodadas,
        //     porque algumas dependem de outras), e depois recebe o 293. Nenhuma correção que estava presente pode sumir.
        Device field = new Device(project, s288);
        try {
            List<String> installed = new ArrayList<>(), pending = new ArrayList<>(names);
            for (boolean progress = true; progress && !pending.isEmpty(); ) {
                progress = false;
                for (String name : new ArrayList<>(pending)) {
                    if (refusal(field.active(), patches.get(name)) != null) continue;
                    field.install(patches.get(name));
                    installed.add(name); pending.remove(name); progress = true;
                }
            }
            System.out.println("Aparelho 1.12.288 com correções da main instaladas pela revisão: " + installed.size() + " de " + names.size());
            check(installed.size() >= 1, "Nenhuma correção da main coube no 1.12.288 (o cenário não testaria nada)");
            JSONObject before = field.active();
            TreeMap<String, String> was = new TreeMap<>();
            for (String name : names) was.put(name, classify(before, patches.get(name)));
            String[] shown = field.reviewAndCancel(mine);
            check(shown[0].equals("Revisar atualização"), "Título da revisão sobre o aparelho com correções: " + shown[0] + " / " + shown[1].substring(0, Math.min(200, shown[1].length())));
            check(field.install(mine).equals("Revisar atualização"), "Título ao instalar sobre o aparelho com correções");
            samePages(field.active(), mine, "Aparelho com correções da main + pacote 293");
            List<String> lostNames = new ArrayList<>();
            for (String name : names) {
                String now = classify(field.active(), patches.get(name));
                if (kept(was.get(name)) && !kept(now)) lostNames.add(name.replace("AgendaPersonal-", "").replace(".agenda.json", ""));
                check(now.equals(on293.get(name)), name + ": no aparelho com correções, depois do 293, a situação difere da do pacote: " + now);
            }
            System.out.println("Correções da main mantidas antes do 293 e perdidas por ele: " + lostNames.size() + (lostNames.isEmpty() ? "" : " " + lostNames));
            check(lostNames.isEmpty(), "O 293 retirou correções da main que o aparelho tinha: " + lostNames);
            field.importIsIgnored(mine);
        } finally { field.manager.destroy(); }

        // C5. A mesma mudança como correção por área sobre o 292, pela janela das correções
        Device filed = new Device(project, s292);
        try {
            String[] shown = filed.reviewAndCancel(patch);
            check(shown[0].equals("Revisar atualização") && shown[2].equals("Instalar"), "A correção por área apareceu como: " + shown[0] + " / " + shown[2]);
            check(shown[1].contains("Compatível com o conteúdo em uso."), "A janela da correção não diz que é compatível");
            check(filed.install(patch).equals("Revisar atualização"), "Título ao instalar a correção por área");
            JSONObject device = filed.active();
            check(device.getString("version").equals("1.12.293") && device.getInt("sequence") == 399, "Numeração depois da correção por área");
            samePages(device, mine, "Aparelho com a correção por área x pacote");
            check(fingerprint(filed.manager, device).equals(fingerprint(filed.manager, mine)), "Identidade de conteúdo do aparelho com a correção por área x pacote");
            filed.importIsIgnored(mine);
        } finally { filed.manager.destroy(); }

        System.out.println(checks + " verificações do pacote 1.12.293 contra o código real do aplicativo passaram; sem rede, APK assinado ou aparelho físico.");
    }
}
