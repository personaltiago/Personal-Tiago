package com.tiagolima.agendapersonal;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeMap;
import org.json.JSONObject;

/**
 * Confere o pacote 1.12.295 (feedback pelo ícone do topo, sobre o 1.12.294) contra o código REAL do aplicativo (UpdateManager,
 * UpdateAreaPatch), reaproveitando as ferramentas do IconeFeedbackHarness (aparelho de mentira com o UpdateManager de verdade e a
 * classificação de cada correção por área da main):
 *  A. numeração (1.12.295 / 401), sem assinatura, só o index.html muda, o histórico de correções (modularUpdates) não muda;
 *  B. cada correção por área da raiz da main tem no 295 a MESMA situação que no 294 (nenhuma presente se perde);
 *  C. aparelho no 294 (o que o Tiago instalou): "Revisar atualização", instala, as páginas ficam as do pacote, importar de novo é
 *     ignorado e voltar ao 294 é "Revisar restauração"; aparelho no 292 e no 288: "Revisar atualização" (o pacote é cumulativo).
 * Uso: java ... FeedbackTopoHarness <projeto> <1.12.288> <1.12.292> <1.12.294> <1.12.295> <pasta-das-correcoes-com-esperado.json>
 */
public final class FeedbackTopoHarness {
    static void check(boolean ok, String message) { IconeFeedbackHarness.check(ok, message); }

    public static void main(String[] args) throws Exception {
        Path project = Path.of(args[0]);
        JSONObject s288 = IconeFeedbackHarness.read(args[1]), s292 = IconeFeedbackHarness.read(args[2]), s294 = IconeFeedbackHarness.read(args[3]), mine = IconeFeedbackHarness.read(args[4]);
        Path folder = Path.of(args[5]);
        JSONObject expected = new JSONObject(Files.readString(folder.resolve("esperado.json")));

        // A
        check(s294.getString("version").equals("1.12.294") && s294.getInt("sequence") == 400, "O ponto de partida não é o 1.12.294 (seq 400)");
        check(mine.getString("version").equals("1.12.295") && mine.getInt("sequence") == 401, "O pacote não é o 1.12.295 (seq 401)");
        check(!mine.has("agendaSignature"), "O pacote não pode vir assinado");
        for (String page : IconeFeedbackHarness.PAGES) {
            boolean same = mine.getJSONObject("files").getString(page).equals(s294.getJSONObject("files").getString(page));
            check(page.equals("index.html") ? !same : same, "A página " + page + (page.equals("index.html") ? " devia mudar" : " não deveria mudar"));
        }
        check(mine.getJSONArray("modularUpdates").toString().equals(s294.getJSONArray("modularUpdates").toString()), "O histórico de correções não deve mudar");

        // B
        List<String> names = new ArrayList<>();
        try (var stream = Files.list(folder)) { stream.map(p -> p.getFileName().toString()).filter(n -> n.endsWith(".agenda.json")).sorted().forEach(names::add); }
        check(names.size() == expected.length(), "As correções da pasta não são as do esperado.json");
        TreeMap<String, JSONObject> patches = IconeFeedbackHarness.ALL;
        for (String name : names) patches.put(name, IconeFeedbackHarness.read(folder.resolve(name).toString()));
        TreeMap<String, String> on295 = new TreeMap<>();
        System.out.println(String.format("  %-52s %-10s %s", "correção", "1.12.294", "1.12.295"));
        for (String name : names) {
            String c = IconeFeedbackHarness.classify(s294, patches.get(name)), d = IconeFeedbackHarness.classify(mine, patches.get(name));
            System.out.println(String.format("  %-52s %-10s %s", name.replace("AgendaPersonal-", "").replace(".agenda.json", ""), IconeFeedbackHarness.shortKind(c), IconeFeedbackHarness.shortKind(d)));
            check(IconeFeedbackHarness.shortKind(d).equals(expected.getString(name)), name + ": no 1.12.295 devia ser '" + expected.getString(name) + "', mas é: " + d);
            check(d.equals(c), name + ": a situação mudou do 1.12.294 para o 1.12.295 (" + c + " -> " + d + ")");
            on295.put(name, d);
        }
        long kept = on295.values().stream().filter(IconeFeedbackHarness::kept).count();
        check(kept >= 8, "Menos de 8 correções da main mantidas no 1.12.295: " + kept);
        System.out.println("  mantidas (presente ou evoluída): " + kept + " de " + names.size());

        // C1. 294 -> 295
        IconeFeedbackHarness.Device d294 = new IconeFeedbackHarness.Device(project, s294);
        try {
            String[] shown = d294.reviewAndCancel(mine);
            check(shown[0].equals("Revisar atualização"), "Título da revisão sobre o 294: " + shown[0]);
            check(shown[1].contains("Versão instalada: 1.12.294") && shown[1].contains("Versão do arquivo: 1.12.295"), "Versões não apresentadas");
            check(shown[1].contains(mine.getString("notes")), "A revisão não traz as notas do pacote");
            check(shown[2].equals("Sim, atualizar"), "Botão de confirmar: " + shown[2]);
            check(d294.install(mine).equals("Revisar atualização"), "Título ao instalar sobre o 294");
            JSONObject saved = d294.active();
            check(saved.getString("version").equals("1.12.295") && saved.getInt("sequence") == 401, "Numeração depois de instalar");
            IconeFeedbackHarness.samePages(saved, mine, "Depois de instalar sobre o 294");
            for (String name : names) check(IconeFeedbackHarness.classify(saved, patches.get(name)).equals(on295.get(name)), name + ": depois de instalar sobre o 294 a situação é outra");
            d294.importIsIgnored(mine);
            String[] back = d294.reviewAndCancel(s294);
            check(back[0].equals("Revisar restauração") && back[2].equals("Restaurar esta versão"), "O 294 sobre o 295 devia ser restauração: " + back[0]);
        } finally { d294.manager.destroy(); }

        // C2 e C3. 292 -> 295 e 288 -> 295
        for (JSONObject from : new JSONObject[]{s292, s288}) {
            IconeFeedbackHarness.Device dev = new IconeFeedbackHarness.Device(project, from);
            try {
                check(dev.install(mine).equals("Revisar atualização"), "Título ao instalar sobre o " + from.getString("version"));
                IconeFeedbackHarness.samePages(dev.active(), mine, "Depois de instalar sobre o " + from.getString("version"));
                for (String name : names) check(IconeFeedbackHarness.classify(dev.active(), patches.get(name)).equals(on295.get(name)), name + ": depois de instalar sobre o " + from.getString("version") + " a situação é outra");
            } finally { dev.manager.destroy(); }
        }
        System.out.println(IconeFeedbackHarness.checks + " verificações do pacote 1.12.295 contra o código real do aplicativo passaram; sem rede, APK assinado ou aparelho físico.");
        System.exit(0);
    }
}
