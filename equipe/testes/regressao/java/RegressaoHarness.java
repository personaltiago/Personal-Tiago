package com.tiagolima.agendapersonal;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Teste de regressão com o MECANISMO REAL de atualização do aplicativo (UpdateManager e UpdateAreaPatch do ZIP oficial, com a janela de
 * revisão de importação de verdade). Argumentos:
 *   projeto 1.12.288 1.12.291 1.12.292 canonico candidato pasta-das-correcoes
 * A pasta tem as correções por área da raiz da main e esperado.json (situação de cada uma no canônico).
 * O que prova:
 *  A. 1.12.291 = 1.12.288 + correções 01, 02 e 03 aplicadas pelo UpdateAreaPatch real (origem do 291 conferida);
 *  B. reversão segura: cada uma das 01/02/03, desfeita pelo inverse/remove do app, devolve exatamente o conteúdo anterior;
 *     idempotência: reimportar uma correção presente é recusado com "Esta correção já está presente.";
 *     conflito e hash divergente: a Raposinha e uma 01 com pré-condição adulterada são recusadas pelo app, sem mudar nada;
 *     paridade: uma mudança em ap-feedback-css só no aluno é recusada (componente compartilhado);
 *  C. o CANDIDATO instalado pela janela de revisão sobre aparelhos em 1.12.288, 1.12.288 + correções da main (as 01/02/03 entre elas,
 *     pelo fluxo de importação de verdade), 1.12.291, 1.12.292 e no canônico: "Revisar atualização" (ou "já instalado" se for igual),
 *     páginas iguais às do candidato e NENHUMA correção da main que estava presente (ou evoluída) se perde; 01/02/03 seguem presentes;
 *  D. o pacote completo antigo (1.12.288) sobre o canônico aparece como "Revisar restauração", avisa que retira funções mais recentes e,
 *     cancelado, não muda nada;
 *  E. sensibilidade: um candidato adulterado (versão nova, mas com ap-workout-corrections do 1.12.288) é instalado pelo app SEM aviso
 *     ("Revisar atualização") e derruba a correção 03 — o teste tem de perceber a perda. Prova que só a conferência antes da assinatura
 *     (equipe/testes/regressao/verificar-pacote.cjs) bloqueia esse caso; o app sozinho não bloqueia.
 */
public final class RegressaoHarness {
    static final String APP = RegressaoBase.APP;
    static final int LIMIT = RegressaoBase.LIMIT;
    static void check(boolean ok, String message) { RegressaoBase.check(ok, message); }
    static String nome(String arquivo) { return arquivo.replace("AgendaPersonal-", "").replace(".agenda.json", ""); }

    public static void main(String[] args) throws Exception {
        Path project = Path.of(args[0]);
        JSONObject s288 = RegressaoBase.read(args[1]), s291 = RegressaoBase.read(args[2]), s292 = RegressaoBase.read(args[3]);
        JSONObject canon = RegressaoBase.read(args[4]), cand = RegressaoBase.read(args[5]);
        if (cand.optString("format").startsWith("agenda-patch/")) {
            // correção por área como candidata: o app de verdade a aplica sobre o canônico (recusa conflito, hash divergente, paridade);
            // o resultado é o conteúdo que o aparelho teria, e é ele que se instala sobre os outros estados.
            String refused = RegressaoBase.refusal(canon, cand);
            check(refused == null || RegressaoBase.PRESENT.equals(refused), "O app recusa a correção por área sobre o canônico: " + refused);
            System.out.println("Correção por área " + cand.optString("id") + " sobre o canônico: " + (refused == null ? "aceita pelo app" : refused));
            cand = refused == null ? UpdateAreaPatch.apply(canon, cand, APP, LIMIT) : canon;
        }
        Path folder = Path.of(args[6]);
        JSONObject expected = RegressaoBase.read(folder.resolve("esperado.json").toString());
        List<String> names = new ArrayList<>();
        try (var stream = Files.list(folder)) { stream.map(p -> p.getFileName().toString()).filter(n -> n.endsWith(".agenda.json")).sorted().forEach(names::add); }
        check(names.size() == expected.length(), "A pasta das correções não corresponde ao esperado.json");
        TreeMap<String, JSONObject> patches = RegressaoBase.ALL;
        for (String n : names) patches.put(n, RegressaoBase.read(folder.resolve(n).toString()));
        String P01 = "AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json", P02 = "AgendaPersonal-02-Baixar-Catalogo-Para-Assinar.agenda.json",
               P03 = "AgendaPersonal-03-Corrigir-Duplicatas-Catalogo-Para-Assinar.agenda.json", RAPOSA = "AgendaPersonal-Pets-Raposinha.agenda.json";
        String[] EXERCICIOS = {P01, P02, P03};
        System.out.println("Canônico " + canon.getString("version") + "/" + canon.getInt("sequence") + "; candidato " + cand.getString("version") + "/" + cand.getInt("sequence"));

        // ---------- A. origem do 291 ----------
        JSONObject chain = s288;
        for (String p : EXERCICIOS) chain = UpdateAreaPatch.apply(chain, patches.get(p), APP, LIMIT);
        RegressaoBase.samePages(chain, s291, "1.12.288 + 01 + 02 + 03 (UpdateAreaPatch real) x pacote 1.12.291");
        System.out.println("A. 1.12.291 = 1.12.288 + correções 01, 02 e 03 aplicadas pelo app: confere (4 páginas iguais)");

        // ---------- B. reversão, idempotência, conflito, hash divergente, paridade ----------
        JSONObject before = s288;
        for (String p : EXERCICIOS) {
            JSONObject reverse = UpdateAreaPatch.inverse(before, patches.get(p));
            check(reverse != null, nome(p) + ": o app não montou a reversão");
            JSONObject after = UpdateAreaPatch.apply(before, patches.get(p), APP, LIMIT);
            JSONObject record = null;
            JSONArray history = after.getJSONArray("modularUpdates");
            for (int i = 0; i < history.length(); i++) if (patches.get(p).getString("id").equals(history.getJSONObject(i).optString("id"))) record = history.getJSONObject(i);
            check(record != null, nome(p) + ": o app não registrou a correção no histórico");
            JSONObject undone = UpdateAreaPatch.remove(after, record, reverse, APP, LIMIT);
            RegressaoBase.samePages(undone, before, nome(p) + ": aplicar e reverter não devolveu o conteúdo anterior");
            check(RegressaoBase.PRESENT.equals(RegressaoBase.refusal(after, patches.get(p))), nome(p) + ": reimportar devia ser recusado como já presente");
            before = after;
        }
        System.out.println("B. 01/02/03: desinstalar pelo app (remove) devolve o conteúdo anterior; reimportar = \"" + RegressaoBase.PRESENT + "\"");
        String raposa = RegressaoBase.refusal(cand, patches.get(RAPOSA));
        check(raposa != null && raposa.contains("ap-student-mascot-model"), "A Raposinha devia ser recusada por conflito em ap-student-mascot-model, mas: " + raposa);
        System.out.println("B. Raposinha sobre o candidato: recusada pelo app -> " + raposa);
        JSONObject stale = new JSONObject(patches.get(P01).toString());
        JSONObject c0 = stale.getJSONArray("changes").getJSONObject(0);
        c0.put("before", "f".repeat(64));
        String divergente = RegressaoBase.refusal(s288, stale);
        check(divergente != null && !RegressaoBase.PRESENT.equals(divergente), "Correção com hash de pré-condição divergente devia ser recusada, mas: " + divergente);
        System.out.println("B. 01 com hash \"antes\" adulterado: recusada -> " + divergente);
        String cssAluno = canon.getJSONObject("files").getString("index.html");
        JSONObject soAluno = new JSONObject().put("format", "agenda-patch/2").put("appId", APP).put("bridgeVersion", 3).put("dataSchema", 4)
            .put("id", "teste-paridade").put("area", "evolucao").put("module", "feedback").put("version", "1.0").put("title", "Teste de paridade")
            .put("notes", "teste").put("changes", new JSONArray().put(new JSONObject().put("page", "index.html").put("id", "ap-feedback-css")
                .put("before", blockHash(cssAluno, "ap-feedback-css")).put("after", RegressaoBase.sha256(blockText(cssAluno, "ap-feedback-css") + ".x{}"))
                .put("content", blockText(cssAluno, "ap-feedback-css") + ".x{}")));
        String paridade = RegressaoBase.refusal(canon, soAluno);
        check(paridade != null && paridade.contains("aluno e no professor"), "Mudança do compartilhado só no aluno devia ser recusada, mas: " + paridade);
        System.out.println("B. ap-feedback-css só no aluno: recusada -> " + paridade);

        // ---------- situação esperada de cada correção no canônico ----------
        TreeMap<String, String> onCanon = new TreeMap<>();
        for (String n : names) {
            String k = RegressaoBase.classify(canon, patches.get(n));
            check(RegressaoBase.shortKind(k).equals(expected.getString(n)), nome(n) + ": no canônico devia ser " + expected.getString(n) + ", é " + k);
            onCanon.put(n, k);
        }

        // ---------- C. candidato sobre vários estados ----------
        Map<String, JSONObject> states = new LinkedHashMap<>();
        states.put("1.12.288", s288);
        states.put("1.12.291", s291);
        states.put("1.12.292", s292);
        states.put(canon.getString("version") + " (canônico)", canon);
        System.out.println(String.format("C. %-36s %-22s %s", "aparelho", "revisão", "correções da main mantidas / perdidas"));
        for (Map.Entry<String, JSONObject> e : states.entrySet()) installAndCheck(project, e.getKey(), e.getValue(), null, cand, names, patches, onCanon, EXERCICIOS, true);
        installAndCheck(project, "1.12.288 + correções da main", s288, names, cand, names, patches, onCanon, EXERCICIOS, true);

        // ---------- D. pacote antigo sobre o canônico ----------
        RegressaoBase.Device dev = new RegressaoBase.Device(project, canon);
        try {
            String[] shown = dev.reviewAndCancel(s288);
            check(shown[0].equals("Revisar restauração") && shown[2].equals("Restaurar esta versão"), "O 1.12.288 sobre o canônico devia aparecer como restauração: " + shown[0] + " / " + shown[2]);
            check(shown[1].contains("Este arquivo é de uma versão anterior") && shown[1].contains("pode retirar funções mais recentes"), "A restauração não avisa que retira funções mais recentes");
            RegressaoBase.samePages(dev.active(), canon, "Depois de cancelar a restauração");
            System.out.println("D. 1.12.288 sobre o canônico: \"" + shown[0] + "\" com o aviso \"pode retirar funções mais recentes\" e botão \"" + shown[2] + "\"; cancelado, nada muda");
        } finally { dev.manager.destroy(); }

        // ---------- E. sensibilidade: candidato adulterado ----------
        JSONObject bad = new JSONObject(cand.toString());
        String nv = "1.12." + (Integer.parseInt(cand.getString("version").split("\\.")[2]) + 1);
        bad.put("version", nv).put("sequence", cand.getInt("sequence") + 1);
        String prof = bad.getJSONObject("files").getString("professor.html");
        bad.getJSONObject("files").put("professor.html", replaceBlock(prof, "ap-workout-corrections", blockText(s288.getJSONObject("files").getString("professor.html"), "ap-workout-corrections")));
        RegressaoBase.Device d2 = new RegressaoBase.Device(project, s291);
        try {
            check(RegressaoBase.classify(d2.active(), patches.get(P03)).equals("presente"), "No 1.12.291 a 03 devia estar presente");
            String title = d2.install(bad);
            String now = RegressaoBase.classify(d2.active(), patches.get(P03));
            check(title.equals("Revisar atualização"), "O app mostrou " + title + " para o candidato adulterado");
            check(!RegressaoBase.kept(now), "O teste não percebeu a perda da 03 no candidato adulterado: " + now);
            System.out.println("E. candidato adulterado " + nv + " (ap-workout-corrections do 1.12.288): o app mostra \"" + title + "\" e instala; a 03 passa a " + RegressaoBase.shortKind(now) + " -> perda detectada");
        } finally { d2.manager.destroy(); }

        System.out.println(RegressaoBase.checks + " verificações com o código real do aplicativo passaram; sem rede, APK assinado ou aparelho físico.");
        System.exit(0);
    }

    static void installAndCheck(Path project, String label, JSONObject state, List<String> preinstall, JSONObject cand, List<String> names,
                                TreeMap<String, JSONObject> patches, TreeMap<String, String> onCanon, String[] exercicios, boolean print) throws Exception {
        RegressaoBase.Device dev = new RegressaoBase.Device(project, state);
        try {
            if (preinstall != null) {
                List<String> pending = new ArrayList<>(preinstall);
                for (boolean progress = true; progress && !pending.isEmpty(); ) {
                    progress = false;
                    for (String n : new ArrayList<>(pending)) {
                        if (RegressaoBase.refusal(dev.active(), patches.get(n)) != null) continue;
                        check(dev.install(patches.get(n)).equals("Revisar atualização"), n + ": a correção não apareceu como atualização");
                        pending.remove(n); progress = true;
                    }
                }
                for (String p : exercicios) check(RegressaoBase.classify(dev.active(), patches.get(p)).equals("presente"), nome(p) + " não ficou presente no aparelho antes do candidato");
            }
            TreeMap<String, String> was = new TreeMap<>();
            for (String n : names) was.put(n, RegressaoBase.classify(dev.active(), patches.get(n)));
            boolean identical = true;
            for (String page : RegressaoBase.PAGES) identical &= dev.active().getJSONObject("files").getString(page).equals(cand.getJSONObject("files").getString(page));
            String title;
            if (identical && dev.active().getString("version").equals(cand.getString("version"))) { dev.importIsIgnored(cand); title = "já instalado (ignorado)"; }
            else { title = dev.install(cand); check(title.equals("Revisar atualização"), label + ": o candidato apareceu como " + title); }
            RegressaoBase.samePages(dev.active(), cand, label + ": depois de instalar o candidato");
            List<String> lost = new ArrayList<>();
            int kept = 0;
            for (String n : names) {
                String now = RegressaoBase.classify(dev.active(), patches.get(n));
                if (RegressaoBase.kept(now)) kept++;
                if (RegressaoBase.kept(was.get(n)) && !RegressaoBase.kept(now)) lost.add(nome(n));
                if (RegressaoBase.kept(onCanon.get(n))) check(RegressaoBase.kept(now), label + ": " + nome(n) + " está no canônico e não está depois do candidato: " + now);
            }
            for (String p : exercicios) check(RegressaoBase.classify(dev.active(), patches.get(p)).equals("presente"), label + ": " + nome(p) + " não está presente depois do candidato");
            check(lost.isEmpty(), label + ": o candidato retirou correções que o aparelho tinha: " + lost);
            if (print) System.out.println(String.format("C. %-36s %-22s %d mantidas / %d perdidas (01, 02 e 03 presentes)", label, title, kept, lost.size()));
        } finally { dev.manager.destroy(); }
    }

    static String blockText(String html, String id) throws Exception {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("<(script|style)\\b[^>]*\\bid=\"" + java.util.regex.Pattern.quote(id) + "\"[^>]*>").matcher(html);
        check(m.find(), "Bloco ausente: " + id);
        int start = m.end(), end = html.indexOf("</" + m.group(1), start);
        return html.substring(start, end);
    }
    static String blockHash(String html, String id) throws Exception { return RegressaoBase.sha256(blockText(html, id)); }
    static String replaceBlock(String html, String id, String text) throws Exception {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("<(script|style)\\b[^>]*\\bid=\"" + java.util.regex.Pattern.quote(id) + "\"[^>]*>").matcher(html);
        check(m.find(), "Bloco ausente: " + id);
        int start = m.end(), end = html.indexOf("</" + m.group(1), start);
        return html.substring(0, start) + text + html.substring(end);
    }
}
