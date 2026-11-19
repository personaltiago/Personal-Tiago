package com.tiagolima.agendapersonal;

import android.app.AlertDialog;
import android.net.Uri;
import android.webkit.WebView;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Confere o pacote 1.12.291 (1.12.288 + as três correções de exercícios) contra o código REAL do aplicativo
 * (UpdateAreaPatch, UpdateIdentity e UpdateManager, compilados com as mesmas imitações simples de Android dos testes oficiais).
 * Não é teste em aparelho nem APK assinado.
 *
 * Argumentos: <pasta do projeto Android> <1.12.288> <correção 01> <correção 02> <correção 03> <pacote 1.12.291>
 *
 * A. Monta o conteúdo do jeito que o aplicativo monta ao instalar as três correções, uma a uma, sobre o 1.12.288
 *    (UpdateAreaPatch.apply + inverse + o que UpdateManager.importUri acrescenta ao histórico) e exige que seja IGUAL ao pacote:
 *    as quatro páginas, a versão (1.12.291), a sequência (397) e o histórico. Em qualquer ordem de aplicação o conteúdo é o mesmo.
 * B. Roda o importador de verdade (UpdateManager.importUri, janela de revisão, confirmação):
 *    1. aparelho com o 1.12.288: o pacote aparece como "Revisar atualização", com as notas, e instala;
 *    2. aparelho com as três correções instaladas por arquivo: o pacote tem a mesma identidade de conteúdo (o app diz que já está instalado);
 *    3. aparelho com uma ou duas das três: o pacote aparece como "Revisar atualização" (nunca "restauração" nem "reinstalação");
 *    4. depois de instalar o pacote, as três correções são "Esta correção já está presente.";
 *    5. a causa do problema relatado: com as três instaladas, instalar o 1.12.288 aparece como "Revisar restauração" e, confirmado,
 *       as três voltam a ser aplicáveis (ou seja, foram retiradas).
 */
public final class CorrecoesExerciciosHarness {
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

    static boolean applicable(JSONObject release, JSONObject patch) {
        try { UpdateAreaPatch.apply(release, patch, APP, LIMIT); return true; }
        catch (UpdateAreaPatch.Invalid presentOrConflict) { return false; }
        catch (Exception unexpected) { throw new AssertionError(unexpected); }
    }

    static String refusal(JSONObject release, JSONObject patch) throws Exception {
        try { UpdateAreaPatch.apply(release, patch, APP, LIMIT); return null; }
        catch (UpdateAreaPatch.Invalid refused) { return refused.getMessage(); }
    }

    /** Instala a correção como o importUri: reversão calculada sobre o conteúdo em uso e histórico com ownsChanges e summary. */
    static JSONObject installLikeApp(JSONObject installed, JSONObject patch) throws Exception {
        JSONObject inverse = UpdateAreaPatch.inverse(installed, patch);
        check(inverse != null, "A correção " + patch.getString("id") + " não tem reversão sobre o conteúdo em uso");
        JSONObject next = UpdateAreaPatch.apply(installed, patch, APP, LIMIT);
        next.getJSONArray("modularUpdates").getJSONObject(0).put("ownsChanges", inverse != null).put("summary", patch.optString("notes"));
        return next;
    }

    /** Um aparelho de mentira com o UpdateManager de verdade e o conteúdo informado instalado. */
    static final class Device {
        final Path folder, file;
        final MainActivity activity;
        final WebView view;
        final UpdateManager manager;

        Device(Path project, JSONObject installed) throws Exception {
            folder = Files.createTempDirectory("agenda-291-");
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

        /** Seleciona o arquivo, devolve o título e a mensagem da revisão e cancela (nada é instalado). */
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

    static void sameContent(JSONObject actual, JSONObject expected, String what) throws Exception {
        for (String page : PAGES)
            check(actual.getJSONObject("files").getString(page).equals(expected.getJSONObject("files").getString(page)), what + ": a página " + page + " é diferente");
    }

    public static void main(String[] args) throws Exception {
        Path project = Path.of(args[0]);
        JSONObject s288 = read(args[1]);
        JSONObject[] patches = {read(args[2]), read(args[3]), read(args[4])};
        JSONObject mine = read(args[5]);
        String[] ids = {"professor-catalogo-exercicios-unificado", "professor-baixar-catalogo-exercicios", "professor-catalogo-exercicios-duplicatas"};
        for (int i = 0; i < 3; i++) check(patches[i].getString("id").equals(ids[i]), "Correção fora de ordem: " + patches[i].getString("id"));
        check(s288.getString("version").equals("1.12.288") && s288.getInt("sequence") == 394, "O ponto de partida não é o 1.12.288 (seq 394)");

        // ---------- A. Montagem pelo código real do aplicativo ----------
        JSONObject real = s288;
        for (JSONObject patch : patches) real = installLikeApp(real, patch);
        check(real.getString("version").equals("1.12.291") && real.getInt("sequence") == 397, "O app numeraria o resultado como " + real.getString("version") + "/" + real.getInt("sequence"));
        check(mine.getString("version").equals(real.getString("version")) && mine.getInt("sequence") == real.getInt("sequence"), "Numeração do pacote diferente da do app");
        sameContent(real, mine, "Pacote x montagem do app");
        for (String page : new String[]{"index.html", "avaliacoes.html", "cadastro.html"})
            check(mine.getJSONObject("files").getString(page).equals(s288.getJSONObject("files").getString(page)), "A página " + page + " não deveria mudar");
        check(!mine.getJSONObject("files").getString("professor.html").equals(s288.getJSONObject("files").getString("professor.html")), "O professor.html não mudou");
        check(real.getJSONArray("modularUpdates").toString().equals(mine.getJSONArray("modularUpdates").toString()), "O histórico do pacote difere do que o app grava");
        check(mine.getJSONArray("modularUpdates").length() == 7, "O histórico deveria ter 7 registros");
        // ordem diferente de aplicação: mesmo conteúdo
        JSONObject shuffled = s288;
        for (int index : new int[]{2, 0, 1}) shuffled = installLikeApp(shuffled, patches[index]);
        sameContent(shuffled, mine, "Ordem 03, 01, 02");
        // cada correção, sozinha, não tem conflito com o 1.12.288 e todas já estão presentes no pacote
        for (JSONObject patch : patches) {
            check(applicable(s288, patch), "A correção " + patch.getString("id") + " não se aplica ao 1.12.288");
            String refused = refusal(mine, patch);
            check("Esta correção já está presente.".equals(refused), "No pacote, a correção " + patch.getString("id") + " deveria constar como já presente, mas: " + refused);
        }

        // ---------- B. Importador de verdade ----------
        // B1. Aparelho com o 1.12.288 recebe o pacote
        Device plain = new Device(project, s288);
        try {
            String[] shown = plain.reviewAndCancel(mine);
            check(shown[0].equals("Revisar atualização"), "Título da revisão do pacote: " + shown[0]);
            check(shown[1].contains("Versão instalada: 1.12.288") && shown[1].contains("Versão do arquivo: 1.12.291"), "Versões não apresentadas: " + shown[1].substring(0, Math.min(120, shown[1].length())));
            check(shown[1].contains(mine.getString("notes")), "A janela de revisão não traz as notas do pacote");
            check(!shown[1].contains("versão anterior"), "O aplicativo tratou o pacote como versão anterior");
            check(shown[2].equals("Sim, atualizar"), "Botão de confirmar: " + shown[2]);
            check(plain.install(mine).equals("Revisar atualização"), "Título ao instalar");
            JSONObject saved = plain.active();
            check(saved.getString("version").equals("1.12.291") && saved.getInt("sequence") == 397, "Numeração depois de instalar");
            sameContent(saved, mine, "Depois de instalar o pacote");
            check(saved.getJSONArray("modularUpdates").toString().equals(mine.getJSONArray("modularUpdates").toString()), "Histórico depois de instalar");
            // B4. depois de instalar o pacote, as três correções constam como já presentes (e instalar o mesmo pacote de novo é ignorado)
            for (JSONObject patch : patches) check("Esta correção já está presente.".equals(refusal(saved, patch)), "Correção não consta como presente depois de instalar o pacote");
            plain.importIsIgnored(mine);
            String fingerprint = fingerprint(plain.manager, saved);
            check(fingerprint.equals(fingerprint(plain.manager, real)), "A identidade de conteúdo do pacote difere da montagem do app");
        } finally { plain.manager.destroy(); }

        // B2 e B3. Aparelho que recebeu as correções por arquivo, uma a uma, com o importador de verdade
        Device filed = new Device(project, s288);
        try {
            for (int i = 0; i < 3; i++) {
                // com 0, 1 ou 2 correções instaladas, o pacote é uma atualização comum
                String[] shown = filed.reviewAndCancel(mine);
                check(shown[0].equals("Revisar atualização") && shown[2].equals("Sim, atualizar"), "Com " + i + " correção(ões) instalada(s) o pacote apareceu como: " + shown[0] + " / " + shown[2]);
                check(!shown[1].contains("versão anterior") && !shown[1].contains("numeração é igual"), "Com " + i + " correção(ões) o aplicativo falou em versão anterior ou numeração igual");
                check(filed.install(patches[i]).equals("Revisar atualização"), "Revisão da correção " + patches[i].getString("id"));
                check(filed.active().getInt("sequence") == 394 + i + 1 && filed.active().getString("version").equals("1.12." + (288 + i + 1)), "Numeração depois da correção " + (i + 1));
            }
            JSONObject device = filed.active();
            check(device.getString("version").equals("1.12.291") && device.getInt("sequence") == 397, "Numeração depois das três correções");
            sameContent(device, mine, "Aparelho com as três correções por arquivo x pacote");
            check(device.getJSONArray("modularUpdates").toString().equals(mine.getJSONArray("modularUpdates").toString()), "Histórico do aparelho x pacote");
            check(fingerprint(filed.manager, device).equals(fingerprint(filed.manager, mine)), "Identidade de conteúdo do aparelho x pacote");
            // B2. mesmo conteúdo: o aplicativo diz que já está instalado e não oferece instalar
            filed.importIsIgnored(mine);

            // B5. A causa do problema: com as três instaladas, o 1.12.288 aparece como restauração e, confirmado, as retira
            String[] old = filed.reviewAndCancel(s288);
            check(old[0].equals("Revisar restauração") && old[1].contains("pode retirar funções mais recentes"), "O 1.12.288 sobre as três correções deveria aparecer como restauração: " + old[0]);
            String title = filed.install(s288);
            check(title.equals("Revisar restauração"), "Título ao instalar o 1.12.288 sobre as três correções");
            for (JSONObject patch : patches) check(applicable(filed.active(), patch), "Depois de instalar o 1.12.288, a correção " + patch.getString("id") + " deveria ter sido retirada");
            check(filed.active().getString("version").equals("1.12.288"), "Versão depois de reinstalar o 1.12.288");
            // e o pacote novo traz tudo de volta
            check(filed.install(mine).equals("Revisar atualização"), "Título ao instalar o pacote depois do 1.12.288");
            sameContent(filed.active(), mine, "Pacote instalado depois do 1.12.288");
        } finally { filed.manager.destroy(); }

        System.out.println(checks + " verificações do pacote 1.12.291 contra o código real do aplicativo passaram; sem rede, APK assinado ou aparelho físico.");
    }
}
