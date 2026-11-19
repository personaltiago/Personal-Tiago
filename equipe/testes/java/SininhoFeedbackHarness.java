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
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Confere o pacote 1.12.292 (sino do feedback no topo do aluno, sobre o 1.12.291) contra o código REAL do aplicativo
 * (UpdateAreaPatch, UpdateIdentity e UpdateManager, compilados com as mesmas imitações simples de Android dos testes oficiais).
 * Não é teste em aparelho nem APK assinado.
 *
 * Argumentos: <pasta do projeto Android> <pacote 1.12.291> <pacote 1.12.292> <correção por área equivalente (agenda-patch/2)>
 *
 * A. O mesmo conteúdo como correção por área (módulo feedback da área Evolução: o script do aluno e o estilo compartilhado nas DUAS
 *    páginas), aplicado pelo UpdateAreaPatch de verdade sobre o 1.12.291, tem de dar exatamente as quatro páginas do pacote, com a
 *    numeração que o pacote tem (1.12.292, sequência 398). Isso prova que o gerador do pacote faz as mesmas trocas de bloco que o app
 *    e que ele respeita a regra do componente compartilhado (UpdateAreaPatch.SHARED: aluno e professor iguais). A mesma correção só
 *    no aluno, ou com a cópia do professor diferente, é recusada pelo app.
 * B. Roda o importador de verdade (UpdateManager.importUri, janela de revisão, confirmação) em aparelhos de mentira:
 *    1. aparelho com o 1.12.291: o pacote aparece como "Revisar atualização", com as notas e as versões 1.12.291 → 1.12.292, e instala;
 *       o conteúdo instalado é o do pacote, o histórico de correções não muda, e importar de novo é ignorado ("já está instalado");
 *    2. aparelho com o 1.12.292: o 1.12.291 aparece como "Revisar restauração" (versão anterior), como as notas avisam;
 *    3. aparelho com o 1.12.291 que recebe a correção por área: instala com a janela das correções, dá o mesmo conteúdo do pacote e
 *       o pacote, depois disso, é tratado pelo app como já instalado ou como reinstalação (nunca como restauração).
 */
public final class SininhoFeedbackHarness {
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
            folder = Files.createTempDirectory("agenda-292-");
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

    public static void main(String[] args) throws Exception {
        Path project = Path.of(args[0]);
        JSONObject s291 = read(args[1]);
        JSONObject mine = read(args[2]);
        JSONObject patch = read(args[3]);
        check(s291.getString("version").equals("1.12.291") && s291.getInt("sequence") == 397, "O ponto de partida não é o 1.12.291 (seq 397)");
        check(mine.getString("version").equals("1.12.292") && mine.getInt("sequence") == 398, "O pacote não é o 1.12.292 (seq 398)");
        check(!mine.has("agendaSignature"), "O pacote não pode vir assinado (quem assina é o fluxo do GitHub)");
        JSONArray listed = patch.getJSONArray("changes");
        check(listed.length() == 3, "A correção equivalente devia ter 3 mudanças (script e estilo do aluno, estilo do professor)");
        check(patch.getString("area").equals("evolucao") && patch.getString("module").equals("feedback") && patch.getString("format").equals("agenda-patch/2"), "A correção por área não é Evolução/feedback");

        // ---------- A. Montagem pelo código real do aplicativo ----------
        JSONObject inverse = UpdateAreaPatch.inverse(s291, patch);
        check(inverse != null, "A correção por área não tem reversão sobre o 1.12.291 (o app não poderia desinstalá-la)");
        JSONObject viaPatch = UpdateAreaPatch.apply(s291, patch, APP, LIMIT);
        check(viaPatch.getString("version").equals("1.12.292") && viaPatch.getInt("sequence") == 398, "O app numeraria a correção como " + viaPatch.getString("version") + "/" + viaPatch.getInt("sequence"));
        check(mine.getString("version").equals(viaPatch.getString("version")) && mine.getInt("sequence") == viaPatch.getInt("sequence"), "Numeração do pacote diferente da do app");
        samePages(viaPatch, mine, "Pacote x correção por área aplicada pelo app");
        for (String page : new String[]{"avaliacoes.html", "cadastro.html"})
            check(mine.getJSONObject("files").getString(page).equals(s291.getJSONObject("files").getString(page)), "A página " + page + " não deveria mudar");
        for (String page : new String[]{"index.html", "professor.html"})
            check(!mine.getJSONObject("files").getString(page).equals(s291.getJSONObject("files").getString(page)), "A página " + page + " devia mudar");
        check(mine.getJSONArray("modularUpdates").toString().equals(s291.getJSONArray("modularUpdates").toString()), "O pacote completo não deve acrescentar registro ao histórico de correções");
        check(viaPatch.getJSONArray("modularUpdates").length() == s291.getJSONArray("modularUpdates").length() + 1, "A correção por área acrescenta um registro ao histórico");
        check("Esta correção já está presente.".equals(refusal(mine, patch)), "No pacote, a correção por área devia constar como já presente");
        check("Esta correção já está presente.".equals(refusal(viaPatch, patch)), "Depois de aplicada, a correção devia constar como já presente");
        // regra do componente compartilhado (UpdateAreaPatch.SHARED): o estilo do feedback precisa ser igual no aluno e no professor
        String shared = "precisa da mesma correção no aluno e no professor";
        String onlyStudent = refusal(s291, variant(patch, false, ""));
        check(onlyStudent != null && onlyStudent.contains(shared), "O app devia recusar a mudança do estilo só no aluno, mas: " + onlyStudent);
        String different = refusal(s291, variant(patch, true, " "));
        check(different != null && different.contains(shared), "O app devia recusar a cópia do professor diferente da do aluno, mas: " + different);
        check(refusal(s291, variant(patch, true, "")) == null, "A correção inteira devia ser aceita pelo app");

        // ---------- B. Importador de verdade ----------
        // B1. Aparelho com o 1.12.291 recebe o pacote
        Device plain = new Device(project, s291);
        try {
            String[] shown = plain.reviewAndCancel(mine);
            check(shown[0].equals("Revisar atualização"), "Título da revisão do pacote: " + shown[0]);
            check(shown[1].contains("Versão instalada: 1.12.291") && shown[1].contains("Versão do arquivo: 1.12.292"), "Versões não apresentadas: " + shown[1].substring(0, Math.min(120, shown[1].length())));
            check(shown[1].contains(mine.getString("notes")), "A janela de revisão não traz as notas do pacote");
            check(!shown[1].contains("versão anterior") && !shown[1].contains("numeração é igual"), "O aplicativo tratou o pacote como versão anterior ou de numeração igual");
            check(shown[2].equals("Sim, atualizar"), "Botão de confirmar: " + shown[2]);
            check(plain.install(mine).equals("Revisar atualização"), "Título ao instalar");
            JSONObject saved = plain.active();
            check(saved.getString("version").equals("1.12.292") && saved.getInt("sequence") == 398, "Numeração depois de instalar");
            samePages(saved, mine, "Depois de instalar o pacote");
            check(saved.getJSONArray("modularUpdates").toString().equals(s291.getJSONArray("modularUpdates").toString()), "O histórico de correções não devia mudar ao instalar o pacote completo");
            check("Esta correção já está presente.".equals(refusal(saved, patch)), "Depois de instalar o pacote, a correção por área devia constar como já presente");
            plain.importIsIgnored(mine);
            check(fingerprint(plain.manager, saved).equals(fingerprint(plain.manager, mine)), "A identidade de conteúdo do aparelho difere da do pacote");
            check(!fingerprint(plain.manager, saved).equals(fingerprint(plain.manager, s291)), "A identidade de conteúdo do 292 não pode ser a do 291");
            // B2. voltar para o 1.12.291 depois do 292 é "restauração" e o aplicativo avisa
            String[] back = plain.reviewAndCancel(s291);
            check(back[0].equals("Revisar restauração") && back[2].equals("Restaurar esta versão"), "O 1.12.291 sobre o 292 devia aparecer como restauração: " + back[0] + " / " + back[2]);
            check(back[1].contains("Este arquivo é de uma versão anterior") && back[1].contains("pode retirar funções mais recentes"), "A restauração não avisa que retira funções mais recentes");
        } finally { plain.manager.destroy(); }

        // B3. Aparelho com o 1.12.291 recebe a correção por área (a janela das correções) e, depois, o pacote
        Device filed = new Device(project, s291);
        try {
            String[] shown = filed.reviewAndCancel(patch);
            check(shown[0].equals("Revisar atualização") && shown[2].equals("Instalar"), "A correção por área apareceu como: " + shown[0] + " / " + shown[2]);
            check(shown[1].contains("Compatível com o conteúdo em uso."), "A janela da correção não diz que é compatível");
            check(filed.install(patch).equals("Revisar atualização"), "Título ao instalar a correção por área");
            JSONObject device = filed.active();
            check(device.getString("version").equals("1.12.292") && device.getInt("sequence") == 398, "Numeração depois da correção por área");
            samePages(device, mine, "Aparelho com a correção por área x pacote");
            check(fingerprint(filed.manager, device).equals(fingerprint(filed.manager, mine)), "Identidade de conteúdo do aparelho com a correção por área x pacote");
            // com o mesmo conteúdo o aplicativo não oferece instalar o pacote
            filed.importIsIgnored(mine);
        } finally { filed.manager.destroy(); }

        System.out.println(checks + " verificações do pacote 1.12.292 contra o código real do aplicativo passaram; sem rede, APK assinado ou aparelho físico.");
    }
}
