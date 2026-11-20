#!/usr/bin/env python3
"""Confere o pacote 1.12.294 (ícone do feedback personalizável, sobre o 1.12.292; o 1.12.293 foi descartado) com o código Java REAL do aplicativo e confere que ele
MANTÉM as correções por área que estão na raiz da main.

Compila UpdateManager, UpdateAreaPatch, UpdateIdentity e companhia (do ZIP do projeto Android que está na raiz do repositório) com as
mesmas imitações simples de Android dos testes oficiais (tests/verify_native_updates.py) e roda
equipe/testes/java/IconeFeedbackHarness.java, que:
  A. aplica o mesmo conteúdo como correção por área pelo UpdateAreaPatch de verdade e exige que dê as quatro páginas do pacote;
  B. aplica cada correção por área da main ao 1.12.288, 291, 292 e 294 e mostra a situação (presente / evoluída / aplicável / conflito); o
     294 tem de ter a situação do esperado e IGUAL à do 292 em todas (nenhuma correção perdida);
  C. usa o importador de verdade (revisão, confirmação, "já está instalado", "restauração") em aparelhos de mentira: 292, 291, 288 e um
     288 com todas as correções da main que ainda cabem.
Não é teste em aparelho físico nem APK assinado.

Uso (da raiz do repositório):
  python3 equipe/testes/icone-feedback.java.py [--zip ZIP] [--pacote PACOTE_294_JA_GERADO]
Os pacotes de partida (1.12.288 e as correções da main, na raiz da main; 1.12.291 e 1.12.292, refeitos pelos geradores) são achados e
conferidos pelo SHA-256 (equipe/testes/arquivos-da-main.cjs, pacote-291.cjs e pacote-292.cjs). Sem --pacote, o 1.12.294 é gerado agora.
"""
import argparse
import json
import runpy
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
GERADOR = RAIZ / 'tools' / 'gerar-icone-feedback-1.12.294.cjs'
GERADOR_291 = RAIZ / 'tools' / 'gerar-correcoes-exercicios-1.12.291.cjs'
LOCALIZADOR_MAIN = RAIZ / 'equipe' / 'testes' / 'arquivos-da-main.cjs'
LOCALIZADOR_292 = RAIZ / 'equipe' / 'testes' / 'pacote-292.cjs'
HARNESS = RAIZ / 'equipe' / 'testes' / 'java' / 'IconeFeedbackHarness.java'
PACOTE = 'com/tiagolima/agendapersonal/'
FONTES = ('UpdateManager.java', 'UpdateAreaPatch.java', 'UpdateArchive.java', 'AndroidInstaller.java', 'UpdateStorage.java',
          'UpdateExport.java', 'UpdateDownloads.java', 'LocalPages.java', 'UpdateManifest.java', 'UpdatePackageSignature.java',
          'NativeLaunch.java', 'UpdateIdentity.java')
PACOTE_288 = ('AgendaPersonal-1.12.288-Janelas-Como-Pagina-Para-Assinar.agenda.json', '1f9b66c8cb8af792ed661c435d46ba2ee172306e6f4b38c298e38836b2d29f15')
# Correções por área que o Tiago subiu na raiz da main: (arquivo, SHA-256, situação esperada no 1.12.294).
# "presente" = o conteúdo do 294 já contém a correção; "evoluída" = contém, e outra correção da main continuou o mesmo trecho a partir dela
# (a Ficha recolhível foi seguida pelo 02, Baixar catálogo); "conflito" = o 294 NÃO a contém e ela não entraria sem refazer (Raposinha).
CORRECOES = (
    ('AgendaPersonal-01-Catalogo-Unificado-Para-Assinar.agenda.json', '2f35cc63a72403df04b9058ca28a42e7ad7bc685fbf1dce2277c09c4d96ea397', 'presente'),
    ('AgendaPersonal-02-Baixar-Catalogo-Para-Assinar.agenda.json', 'bdfef91b00e0a6699d8e460bc1804ade1b1b7a7dd76fda540f7690a166b94950', 'presente'),
    ('AgendaPersonal-03-Corrigir-Duplicatas-Catalogo-Para-Assinar.agenda.json', 'be415ec62e96d0c6a337da6b2d3153ba9a7d7b56c967b5a436fe518ee178a9cd', 'presente'),
    ('AgendaPersonal-Apagar-Exercicio-do-Catalogo-Assinado.agenda.json', '7d3724d46ee4ba242571f1b857d0a5d47ae05a466d7063be0204541159a14375', 'presente'),
    ('AgendaPersonal-Apagar-Exercicio-do-Catalogo.agenda.json', '0e5b7283321675b7f5d8a00c4ffb2efa8b9fa5772b7d9ecbf1ed357f8d3609ad', 'presente'),
    ('AgendaPersonal-Pets-Raposinha.agenda.json', '84b0ede80c28d44ef04ecf7ab20a19191a6fd738ad865299b611c0c6cfbf8587', 'conflito'),
    ('AgendaPersonal-Pix-Comprovantes-Sem-Arquivos.agenda.json', '2f5ad122e4fd141d0fcc9db2938057718e287f6c0b7f9233c4bb65db5ecec5bc', 'presente'),
    ('AgendaPersonal-Professor-Ficha-Recolhivel-253.agenda.json', '8eb9179bdc851637f8dbecc7669eec4c0bfc67f777222a85dfc94cdc4548afd8', 'evoluída'),
    ('AgendaPersonal-Sininho-Cadastro-Professor-para-assinar.agenda.json', '97a1f3c989d8893cb8e7b6b1e277e1a238595737db7721da92dc0c2208dee9a9', 'presente'),
    ('AgendaPersonal-Testar-Enviar-Sons-Treino-para-assinar.agenda.json', '85decba4e95464299ed6243d67b04d8169287138c1bcf14bf7259f3a3fa6e93e', 'presente'),
)

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
const patch = {format: 'agenda-patch/2', id: 'aluno-icone-feedback', area: 'evolucao', module: 'feedback', title: G.title, version: G.version,
  notes: 'Ícone do feedback personalizável (equivalente por área do pacote completo ' + G.version + ').', appId: G.APP_ID, bridgeVersion: 3, dataSchema: 4, changes};
fs.writeFileSync(saida, JSON.stringify(patch, null, 2) + '\n');
"""


def node(*args):
    return subprocess.check_output(['node', *map(str, args)], text=True).strip().splitlines()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--zip', default=str(RAIZ / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'))
    parser.add_argument('--pacote')
    opcoes = parser.parse_args()
    java = shutil.which('java')
    assert java, 'Java 17 ou mais novo é necessário.'
    compilador = [shutil.which('javac')] if shutil.which('javac') else [java, 'com.sun.tools.javac.Main']
    with tempfile.TemporaryDirectory(prefix='agenda-294-java-') as temporario:
        trabalho = Path(temporario)
        pacote_292 = Path(node(LOCALIZADOR_292, trabalho / 'entrada')[-1])
        pacote_291 = next(p for p in (trabalho / 'entrada' / 'p291').glob('*1.12.291*.agenda.json')) if (trabalho / 'entrada' / 'p291').exists() else None
        if pacote_291 is None:  # o 292 já existia pronto (variável PACOTE_292 ou raiz): o 291 é achado pelo localizador próprio
            pacote_291 = Path(node(RAIZ / 'equipe' / 'testes' / 'pacote-291.cjs', trabalho / 'entrada' / 'p291')[-1])
        pares = ['%s=%s' % PACOTE_288] + ['%s=%s' % (nome, sha) for nome, sha, _ in CORRECOES]
        achados = node(LOCALIZADOR_MAIN, trabalho / 'main', *pares)
        pacote_288 = Path(achados[0])
        pasta_correcoes = trabalho / 'correcoes'
        pasta_correcoes.mkdir()
        for caminho in achados[1:]:
            shutil.copy(caminho, pasta_correcoes / Path(caminho).name)
        (pasta_correcoes / 'esperado.json').write_text(json.dumps({nome: esperado for nome, _, esperado in CORRECOES}, indent=2), encoding='utf-8')
        if opcoes.pacote:
            pacote = Path(opcoes.pacote).resolve()
        else:
            pacote = trabalho / 'pacote.agenda.json'
            subprocess.run(['node', str(GERADOR), str(pacote_292), str(pacote)], check=True, stdout=subprocess.DEVNULL)
        correcao = trabalho / 'correcao.agenda.json'
        subprocess.run(['node', '-e', MONTAR_CORRECAO, str(GERADOR), str(GERADOR_291), str(pacote_292), str(correcao)], check=True)
        projeto_zip = trabalho / 'projeto'
        with zipfile.ZipFile(opcoes.zip) as zip_:
            zip_.extractall(projeto_zip)
        bases = [p.parent for p in projeto_zip.rglob('settings.gradle')]
        assert len(bases) == 1, 'O ZIP precisa conter um único projeto Android.'
        projeto = bases[0]
        stubs = dict(runpy.run_path(str(projeto / 'tests' / 'verify_native_updates.py'))['STUBS'])
        stubs.pop(PACOTE + 'NativeUpdateHarness.java')
        stubs[PACOTE + 'IconeFeedbackHarness.java'] = HARNESS.read_text(encoding='utf-8')
        fontes = [str(projeto / 'app/src/main/java' / PACOTE / nome) for nome in FONTES]
        for nome, texto in stubs.items():
            alvo = trabalho / 'stubs' / nome
            alvo.parent.mkdir(parents=True, exist_ok=True)
            alvo.write_text(texto, encoding='utf-8')
            fontes.append(str(alvo))
        classes = trabalho / 'classes'
        subprocess.run(compilador + ['-encoding', 'UTF-8', '-d', str(classes)] + fontes, check=True)
        subprocess.run([java, '-Xmx3g', '-cp', str(classes), 'com.tiagolima.agendapersonal.IconeFeedbackHarness',
                        str(projeto), str(pacote_288), str(pacote_291), str(pacote_292), str(pacote), str(correcao), str(pasta_correcoes)], check=True)


if __name__ == '__main__':
    sys.exit(main())
