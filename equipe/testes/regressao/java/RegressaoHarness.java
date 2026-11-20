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
 *   projeto 1.12.288 1.12.291 1.12.292 1.12.294 1.12.295 referencia-node candidato pasta-das-correcoes complementos autorizados
 * A pasta tem as correções por área da raiz da main e esperado.json (situação de cada uma na referência). "complementos" são os nomes, separados
 * por vírgula e na ordem da cadeia, das correções que seguem o 1.12.295 ("Feedback somente no topo", "Feedback online"); "referencia-node" é o estado consolidado montado pelo
 * gerador do manifesto; "autorizados" é a lista pagina|id (separada por vírgula, ou "-") de blocos com continuação autorizada.
 * O que prova:
 *  A. 1.12.291 = 1.12.288 + 01/02/03 pelo app; a REFERÊNCIA = 1.12.295 + complemento pelo app, igual à montada pelo manifesto;
 *     o complemento sobre o 1.12.294 é recusado (depende do 295);
 *  B. reversão segura (desinstalar 01/02/03 devolve o conteúdo anterior), idempotência, conflito (Raposinha), hash divergente e paridade;
 *  C. o CANDIDATO (pacote completo instalado pela janela de revisão, ou correção por área importada no aparelho com a referência) não
 *     tira nenhuma correção da main nem o complemento que estão na referência, sobre 1.12.288, 1.12.288 + correções, 1.12.291, 1.12.292,
 *     1.12.294, 1.12.295 e a referência; 01/02/03 seguem presentes;
 *  D. pacotes antigos (1.12.288 e o 1.12.295 sem o complemento) sobre a referência: "Revisar restauração" com aviso; cancelado, nada muda;
 *  E-G. sensibilidade: o app ACEITA sem aviso (E) um pacote novo com a 03 do 1.12.288, (F) a correção por área disfarçada da revisão
 *     (a 03 do 1.12.288 + um comentário) e (G) um 1.12.299 montado do 295 sem os complementos; o teste tem de perceber as três perdas.
 */
public final class RegressaoHarness {
    static final String APP = RegressaoBase.APP;
    static final int LIMIT = RegressaoBase.LIMIT;
    static void check(boolean ok, String message) { RegressaoBase.check(ok, message); }
    static String nome(String arquivo) { return arquivo.replace("AgendaPersonal-", "").replace(".agenda.json", ""); }
    static java.util.Set<String> AUTORIZADOS = new java.util.HashSet<>();

    public static void main(String[] args) throws Exception {
        Path project = Path.of(args[0]);
        JSONObject s288 = RegressaoBase.read(args[1]), s291 = RegressaoBase.read(args[2]), s292 = RegressaoBase.read(args[3]);
        JSONObject s294 = RegressaoBase.read(args[4]), s295 = RegressaoBase.read(args[5]), refNode = RegressaoBase.read(args[6]), cand = RegressaoBase.read(args[7]);
        Path folder = Path.of(args[8]);
        // complementos do 1.12.295, na ordem da cadeia ("Feedback somente no topo", depois "Feedback online")
        String[] COMPS = args[9].split(",");
        String COMP = COMPS[0], ULTIMO = COMPS[COMPS.length - 1];
        if (!args[10].equals("-")) for (String a : args[10].split(",")) AUTORIZADOS.add(a.trim());
        JSONObject expected = RegressaoBase.read(folder.resolve("esperado.json").toString());
        List<String> names = new ArrayList<>();
        try (var stream = Files.list(folder)) { stream.map(p -> p.getFileName().toString()).filter(n -> n.endsWith(".agenda.json")).sorted().forEach(names::add); }
        check(names.size() == expected.length(), "A pasta das correções não corresponde ao esperado.json");
        TreeMap<String, JSONObject> patches = RegressaoBase.ALL;
        for (String n : names) patches.put(n, RegressaoBase.read(folder.resolve(n).toString()));
        for (String c : COMPS) check(patches.containsKey(c), "O complemento não está na pasta das correções: " + c);
        String P01 = "AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json", P02 = "AgendaPersonal-02-Baixar-Catalogo-Para-Assinar.agenda.json",
               P03 = "AgendaPersonal-03-Corrigir-Duplicatas-Catalogo-Para-Assinar.agenda.json", RAPOSA = "AgendaPersonal-Pets-Raposinha.agenda.json";
        String[] EXERCICIOS = {P01, P02, P03};

        // ---------- A. origem do 291 e da referência ----------
        JSONObject chain = s288;
        for (String p : EXERCICIOS) chain = UpdateAreaPatch.apply(chain, patches.get(p), APP, LIMIT);
        RegressaoBase.samePages(chain, s291, "1.12.288 + 01 + 02 + 03 (UpdateAreaPatch real) x pacote 1.12.291");
        JSONObject ref = s295;
        for (String c : COMPS) ref = UpdateAreaPatch.apply(ref, patches.get(c), APP, LIMIT);
        RegressaoBase.samePages(ref, refNode, "1.12.295 + complementos pelo app x referência do manifesto (= 1.12.298)");
        String sobre294 = RegressaoBase.refusal(s294, patches.get(COMP));
        check(sobre294 != null && sobre294.contains("ap-feedback-student"), "O complemento devia ser recusado sobre o 1.12.294 (depende do 295), mas: " + sobre294);
        System.out.println("A. 1.12.291 = 1.12.288 + 01/02/03 pelo app; referência = 1.12.295 + " + COMPS.length + " complemento(s) pelo app (" + ref.getString("version") + "/" + ref.getInt("sequence") + "), igual à do manifesto; complemento sobre o 1.12.294: recusado (" + sobre294 + ")");
        if (cand.optString("format").startsWith("agenda-patch/")) System.out.println("Candidato: correção por área " + cand.optString("id"));
        else System.out.println("Candidato: pacote completo " + cand.getString("version") + "/" + cand.getInt("sequence"));

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
            RegressaoBase.samePages(UpdateAreaPatch.remove(after, record, reverse, APP, LIMIT), before, nome(p) + ": aplicar e desinstalar não devolveu o conteúdo anterior");
            check(RegressaoBase.PRESENT.equals(RegressaoBase.refusal(after, patches.get(p))), nome(p) + ": reimportar devia ser recusado como já presente");
            before = after;
        }
        check(RegressaoBase.PRESENT.equals(RegressaoBase.refusal(ref, patches.get(ULTIMO))), "Reimportar o último complemento na referência devia dar 'já presente'");
        if (COMPS.length > 1) {
            String primeiro = RegressaoBase.refusal(ref, patches.get(COMP));
            check(primeiro != null && !RegressaoBase.PRESENT.equals(primeiro) && primeiro.contains("ap-feedback-student"), "O primeiro complemento, já continuado pelo seguinte, devia ser recusado por conflito na referência, mas: " + primeiro);
        }
        String raposa = RegressaoBase.refusal(ref, patches.get(RAPOSA));
        check(raposa != null && raposa.contains("ap-student-mascot-model"), "A Raposinha devia ser recusada por conflito em ap-student-mascot-model, mas: " + raposa);
        JSONObject stale = new JSONObject(patches.get(P01).toString());
        stale.getJSONArray("changes").getJSONObject(0).put("before", "f".repeat(64));
        String divergente = RegressaoBase.refusal(s288, stale);
        check(divergente != null && !RegressaoBase.PRESENT.equals(divergente), "Correção com hash de pré-condição divergente devia ser recusada, mas: " + divergente);
        String cssAluno = ref.getJSONObject("files").getString("index.html");
        String paridade = RegressaoBase.refusal(ref, patch("teste-paridade", "evolucao", "feedback", "index.html", "ap-feedback-css", blockHash(cssAluno, "ap-feedback-css"), blockText(cssAluno, "ap-feedback-css") + ".x{}"));
        check(paridade != null && paridade.contains("aluno e no professor"), "Mudança do compartilhado só no aluno devia ser recusada, mas: " + paridade);
        System.out.println("B. desinstalar 01/02/03 devolve o anterior; reimportar = já presente (também o último complemento; o primeiro, já continuado, é recusado); Raposinha, hash divergente e ap-feedback-css só no aluno: recusados pelo app");

        TreeMap<String, String> onRef = new TreeMap<>();
        for (String n : names) {
            String k = RegressaoBase.classify(ref, patches.get(n));
            check(RegressaoBase.shortKind(k).equals(expected.getString(n)), nome(n) + ": na referência devia ser " + expected.getString(n) + ", é " + k);
            onRef.put(n, k);
        }

        // ---------- C. candidato ----------
        if (cand.optString("format").startsWith("agenda-patch/")) {
            RegressaoBase.Device dev = new RegressaoBase.Device(project, ref);
            try {
                String refused = RegressaoBase.refusal(ref, cand);
                check(refused == null || RegressaoBase.PRESENT.equals(refused), "O app recusa a correção por área sobre a referência: " + refused);
                String title = refused == null ? dev.install(cand) : "já presente";
                lost("C. aparelho com a referência + correção (" + title + ")", dev.active(), names, patches, onRef, EXERCICIOS, true);
            } finally { dev.manager.destroy(); }
        } else {
            Map<String, JSONObject> states = new LinkedHashMap<>();
            states.put("1.12.288", s288); states.put("1.12.291", s291); states.put("1.12.292", s292);
            states.put("1.12.294 (instalado no Tiago)", s294); states.put("1.12.295", s295); states.put("referência " + ref.getString("version"), ref);
            for (Map.Entry<String, JSONObject> e : states.entrySet()) installAndCheck(project, e.getKey(), e.getValue(), null, cand, names, patches, onRef, EXERCICIOS);
            installAndCheck(project, "1.12.288 + correções da main", s288, names, cand, names, patches, onRef, EXERCICIOS);
        }

        // ---------- D. pacotes antigos sobre a referência ----------
        for (JSONObject old : new JSONObject[]{s288, s295}) {
            RegressaoBase.Device dev = new RegressaoBase.Device(project, ref);
            try {
                String[] shown = dev.reviewAndCancel(old);
                check(shown[0].equals("Revisar restauração") && shown[2].equals("Restaurar esta versão"), "O " + old.getString("version") + " sobre a referência devia ser restauração: " + shown[0]);
                check(shown[1].contains("pode retirar funções mais recentes"), "A restauração não avisa que retira funções mais recentes");
                RegressaoBase.samePages(dev.active(), ref, "Depois de cancelar a restauração");
                System.out.println("D. " + old.getString("version") + " sobre a referência: \"" + shown[0] + "\" com aviso; cancelado, nada muda");
            } finally { dev.manager.destroy(); }
        }

        // ---------- E, F, G. sensibilidade: o app aceita, o teste tem de perceber ----------
        String antiga03 = blockText(s288.getJSONObject("files").getString("professor.html"), "ap-workout-corrections");
        // a próxima versão livre depois da referência (1.12.298/404) é 1.12.299/405
        JSONObject e = new JSONObject(ref.toString()).put("version", "1.12.299").put("sequence", 405);
        e.getJSONObject("files").put("professor.html", replaceBlock(e.getJSONObject("files").getString("professor.html"), "ap-workout-corrections", antiga03));
        sensibilidade(project, "E. 1.12.299 com a 03 do 1.12.288", ref, e, P03, patches);
        String prof = ref.getJSONObject("files").getString("professor.html");
        JSONObject f = patch("review-only-revert-03-newline", "professor", "exercicios", "professor.html", "ap-workout-corrections", blockHash(prof, "ap-workout-corrections"), antiga03 + "\n/* review: harmless formatting */\n");
        sensibilidade(project, "F. correção disfarçada (03 do 1.12.288 + comentário)", ref, f, P03, patches);
        JSONObject g = new JSONObject(s295.toString()).put("version", "1.12.299").put("sequence", 405);
        sensibilidade(project, "G. 1.12.299 montado do 295 sem os complementos", ref, g, ULTIMO, patches);

        System.out.println(RegressaoBase.checks + " verificações com o código real do aplicativo passaram; sem rede, APK assinado ou aparelho físico.");
        System.exit(0);
    }

    static JSONObject patch(String id, String area, String module, String page, String block, String before, String content) throws Exception {
        return new JSONObject().put("format", "agenda-patch/2").put("appId", APP).put("bridgeVersion", 3).put("dataSchema", 4)
            .put("id", id).put("area", area).put("module", module).put("version", "1.0").put("title", "Teste " + id).put("notes", "teste")
            .put("changes", new JSONArray().put(new JSONObject().put("page", page).put("id", block).put("before", before).put("after", RegressaoBase.sha256(content)).put("content", content)));
    }

    static void sensibilidade(Path project, String label, JSONObject ref, JSONObject bad, String lostName, TreeMap<String, JSONObject> patches) throws Exception {
        RegressaoBase.Device dev = new RegressaoBase.Device(project, ref);
        try {
            check(RegressaoBase.kept(RegressaoBase.classify(dev.active(), patches.get(lostName))), label + ": a correção devia estar na referência");
            String title = dev.install(bad);
            String now = RegressaoBase.classify(dev.active(), patches.get(lostName));
            check(title.equals("Revisar atualização"), label + ": o app mostrou " + title);
            check(!RegressaoBase.kept(now), label + ": o teste não percebeu a perda de " + nome(lostName) + ": " + now);
            System.out.println(label + ": o app mostra \"" + title + "\" e instala; " + nome(lostName) + " passa a " + RegressaoBase.shortKind(now) + " -> perda detectada");
        } finally { dev.manager.destroy(); }
    }

    /** A correção segue valendo no conteúdo: cada mudança dela ou continua presente, ou está num bloco cuja continuação foi autorizada. */
    static boolean authorizedOrPresent(JSONObject now, JSONObject patch) throws Exception {
        if (AUTORIZADOS.isEmpty()) return false;
        JSONArray c = patch.getJSONArray("changes");
        for (int i = 0; i < c.length(); i++) {
            JSONObject d = c.getJSONObject(i);
            if (AUTORIZADOS.contains(d.getString("page") + "|" + d.getString("id"))) continue;
            if (!RegressaoBase.PRESENT.equals(RegressaoBase.refusal(now, RegressaoBase.only(patch, i)))) return false;
        }
        return true;
    }

    static void lost(String label, JSONObject now, List<String> names, TreeMap<String, JSONObject> patches, TreeMap<String, String> onRef, String[] exercicios, boolean print) throws Exception {
        List<String> lostNames = new ArrayList<>();
        int kept = 0;
        for (String n : names) {
            String k = RegressaoBase.classify(now, patches.get(n));
            if (RegressaoBase.kept(k)) kept++;
            else if (RegressaoBase.kept(onRef.get(n)) && !authorizedOrPresent(now, patches.get(n))) lostNames.add(nome(n) + " (" + k + ")");
        }
        check(lostNames.isEmpty(), label + ": está na referência e não está depois do candidato: " + lostNames);
        for (String p : exercicios) check(RegressaoBase.classify(now, patches.get(p)).equals("presente") || authorizedOrPresent(now, patches.get(p)), label + ": " + nome(p) + " não está presente depois do candidato");
        if (print) System.out.println(String.format("%-58s %d mantidas / 0 perdidas (01, 02 e 03 presentes)", label, kept));
    }

    static void installAndCheck(Path project, String label, JSONObject state, List<String> preinstall, JSONObject cand, List<String> names,
                                TreeMap<String, JSONObject> patches, TreeMap<String, String> onRef, String[] exercicios) throws Exception {
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
            boolean identical = true;
            for (String page : RegressaoBase.PAGES) identical &= dev.active().getJSONObject("files").getString(page).equals(cand.getJSONObject("files").getString(page));
            String title;
            if (identical && dev.active().getInt("sequence") == cand.getInt("sequence")) { dev.importIsIgnored(cand); title = "já instalado"; }
            else { title = dev.install(cand); check(title.equals("Revisar atualização"), label + ": o candidato apareceu como " + title); }
            RegressaoBase.samePages(dev.active(), cand, label + ": depois de instalar o candidato");
            lost(String.format("C. %-36s %-20s", label, title), dev.active(), names, patches, onRef, exercicios, true);
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
