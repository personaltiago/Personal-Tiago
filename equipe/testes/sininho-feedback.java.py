#!/usr/bin/env python3
"""Confere o pacote 1.12.292 (sino do feedback no topo do aluno, sobre o 1.12.291) com o código Java REAL do aplicativo.

Compila UpdateManager, UpdateAreaPatch, UpdateIdentity e companhia (do ZIP do projeto Android que está na raiz do repositório) com as
mesmas imitações simples de Android dos testes oficiais (tests/verify_native_updates.py) e roda
equipe/testes/java/SininhoFeedbackHarness.java, que:
  A. aplica o mesmo conteúdo como correção por área (módulo feedback da área Evolução, com o estilo compartilhado nas duas páginas) pelo
     UpdateAreaPatch de verdade e exige que dê as quatro páginas do pacote; e confere que o app recusa a mudança só no aluno;
  B. usa o importador de verdade (revisão, confirmação, "já está instalado", "restauração") em aparelhos de mentira.
Não é teste em aparelho físico nem APK assinado.

Uso (da raiz do repositório):
  python3 equipe/testes/sininho-feedback.java.py [--zip ZIP] [--pacote-291 ARQUIVO_DO_291] [--pacote PACOTE_292_JA_GERADO]

Sem --pacote-291, o 1.12.291 é achado (variável PACOTE_291 ou raiz do repositório) ou refeito pelo gerador do 291 (equipe/testes/pacote-291.cjs).
Sem --pacote, o pacote 1.12.292 é gerado agora pelo gerador (tools/gerar-sininho-feedback-1.12.292.cjs) numa pasta temporária.
"""
import argparse
import runpy
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
GERADOR = RAIZ / 'tools' / 'gerar-sininho-feedback-1.12.292.cjs'
GERADOR_291 = RAIZ / 'tools' / 'gerar-correcoes-exercicios-1.12.291.cjs'
LOCALIZADOR = RAIZ / 'equipe' / 'testes' / 'pacote-291.cjs'
HARNESS = RAIZ / 'equipe' / 'testes' / 'java' / 'SininhoFeedbackHarness.java'
PACOTE = 'com/tiagolima/agendapersonal/'
FONTES = ('UpdateManager.java', 'UpdateAreaPatch.java', 'UpdateArchive.java', 'AndroidInstaller.java', 'UpdateStorage.java',
          'UpdateExport.java', 'UpdateDownloads.java', 'LocalPages.java', 'UpdateManifest.java', 'UpdatePackageSignature.java',
          'NativeLaunch.java', 'UpdateIdentity.java')

# Monta, com as mesmas trocas de bloco do gerador, a correção por área (agenda-patch/2) equivalente ao pacote: uma mudança por bloco e página.
MONTAR_CORRECAO = r"""
const fs = require('fs');
const [, gerador, gerador291, fonte, saida] = process.argv; // com node -e, process.argv[0] é o node e os argumentos começam em [1]
const G = require(gerador), {findBlocks} = require(gerador291);
const source = G.loadSource(fonte), changes = [];
for (const [page, edits] of Object.entries(G.BLOCK_EDITS)) for (const edit of edits) {
  const html = source.files[page], block = findBlocks(html, new Map([[edit.id, edit]])).get(edit.id);
  changes.push({page, id: edit.id, before: edit.before, after: edit.after, content: edit.apply(html.slice(block.start, block.end))});
}
const patch = {format: 'agenda-patch/2', id: 'aluno-sino-feedback', area: 'evolucao', module: 'feedback', title: G.title, version: G.version,
  notes: 'Sino do feedback no topo da tela do aluno (equivalente por área do pacote completo ' + G.version + ').', appId: G.APP_ID, bridgeVersion: 3, dataSchema: 4, changes};
fs.writeFileSync(saida, JSON.stringify(patch, null, 2) + '\n');
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--zip', default=str(RAIZ / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'))
    parser.add_argument('--pacote-291')
    parser.add_argument('--pacote')
    opcoes = parser.parse_args()
    java = shutil.which('java')
    assert java, 'Java 17 ou mais novo é necessário.'
    compilador = [shutil.which('javac')] if shutil.which('javac') else [java, 'com.sun.tools.javac.Main']
    with tempfile.TemporaryDirectory(prefix='agenda-292-java-') as temporario:
        trabalho = Path(temporario)
        if opcoes.pacote_291:
            pacote_291 = Path(opcoes.pacote_291).resolve()
        else:
            saida = subprocess.check_output(['node', str(LOCALIZADOR), str(trabalho / 'entrada')], text=True)
            pacote_291 = Path(saida.strip().splitlines()[-1])
        if opcoes.pacote:
            pacote = Path(opcoes.pacote).resolve()
        else:
            pacote = trabalho / 'pacote.agenda.json'
            subprocess.run(['node', str(GERADOR), str(pacote_291), str(pacote)], check=True, stdout=subprocess.DEVNULL)
        correcao = trabalho / 'correcao.agenda.json'
        subprocess.run(['node', '-e', MONTAR_CORRECAO, str(GERADOR), str(GERADOR_291), str(pacote_291), str(correcao)], check=True)
        projeto_zip = trabalho / 'projeto'
        with zipfile.ZipFile(opcoes.zip) as zip_:
            zip_.extractall(projeto_zip)
        bases = [p.parent for p in projeto_zip.rglob('settings.gradle')]
        assert len(bases) == 1, 'O ZIP precisa conter um único projeto Android.'
        projeto = bases[0]
        stubs = dict(runpy.run_path(str(projeto / 'tests' / 'verify_native_updates.py'))['STUBS'])
        stubs.pop(PACOTE + 'NativeUpdateHarness.java')
        stubs[PACOTE + 'SininhoFeedbackHarness.java'] = HARNESS.read_text(encoding='utf-8')
        fontes = [str(projeto / 'app/src/main/java' / PACOTE / nome) for nome in FONTES]
        for nome, texto in stubs.items():
            alvo = trabalho / 'stubs' / nome
            alvo.parent.mkdir(parents=True, exist_ok=True)
            alvo.write_text(texto, encoding='utf-8')
            fontes.append(str(alvo))
        classes = trabalho / 'classes'
        subprocess.run(compilador + ['-encoding', 'UTF-8', '-d', str(classes)] + fontes, check=True)
        subprocess.run([java, '-Xmx3g', '-cp', str(classes), 'com.tiagolima.agendapersonal.SininhoFeedbackHarness',
                        str(projeto), str(pacote_291), str(pacote), str(correcao)], check=True)


if __name__ == '__main__':
    sys.exit(main())
