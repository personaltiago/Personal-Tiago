"""Teste de regressão com o mecanismo REAL de atualização do aplicativo (UpdateManager e UpdateAreaPatch do ZIP oficial).

Compila o código Java de atualização de dentro de AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip (com os mesmos dublês de Android
do teste oficial tests/verify_native_updates.py) e roda equipe/testes/regressao/java/RegressaoHarness.java para cada candidato.

Uso (da raiz do repositório):
  python3 -I equipe/testes/regressao/mecanismo-real.py [--candidato ARQUIVO ...] [--zip ZIP]
Sem --candidato, testa o canônico de equipe/canonico/manifesto.json e todos os pacotes da cadeia posteriores a ele.
Os pacotes (1.12.288, canônico e posteriores) e as correções da main são achados na raiz/histórico da main pelo SHA-256; o 1.12.291 e o
1.12.292 são refeitos pelos geradores (tools/) e conferidos pelo SHA-256.
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

RAIZ = Path(__file__).resolve().parents[3]
TESTES = RAIZ / 'equipe' / 'testes'
JAVA = Path(__file__).resolve().parent / 'java'
PACOTE = 'com/tiagolima/agendapersonal/'
FONTES = ('UpdateManager.java', 'UpdateAreaPatch.java', 'UpdateArchive.java', 'AndroidInstaller.java', 'UpdateStorage.java',
          'UpdateExport.java', 'UpdateDownloads.java', 'LocalPages.java', 'UpdateManifest.java', 'UpdatePackageSignature.java',
          'NativeLaunch.java', 'UpdateIdentity.java')


def node(*args):
    return subprocess.check_output(['node', *map(str, args)], text=True).strip().splitlines()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--zip', default=str(RAIZ / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'))
    parser.add_argument('--candidato', action='append', default=[])
    opcoes = parser.parse_args()
    manifesto = json.loads((RAIZ / 'equipe' / 'canonico' / 'manifesto.json').read_text(encoding='utf-8'))
    java = shutil.which('java')
    assert java, 'Java 17 ou mais novo é necessário.'
    compilador = [shutil.which('javac')] if shutil.which('javac') else [java, 'com.sun.tools.javac.Main']
    with tempfile.TemporaryDirectory(prefix='agenda-regressao-java-') as temporario:
        trabalho = Path(temporario)
        pac = {p['versao']: p for p in manifesto['pacotes']}
        canon = manifesto['canonico']
        posteriores = [p for p in manifesto['pacotes'] if p['sequencia'] > canon['sequencia'] and p['origem'] == 'main']
        pares = ['%s=%s' % (pac['1.12.288']['arquivo'], pac['1.12.288']['sha256']), '%s=%s' % (canon['arquivo'], canon['sha256'])]
        pares += ['%s=%s' % (p['arquivo'], p['sha256']) for p in posteriores]
        pares += ['%s=%s' % (c['arquivo'], c['sha256']) for c in manifesto['correcoes']]
        achados = node(TESTES / 'arquivos-da-main.cjs', trabalho / 'main', *pares)
        p288, pcanon = Path(achados[0]), Path(achados[1])
        pposteriores = [Path(a) for a in achados[2:2 + len(posteriores)]]
        pasta = trabalho / 'correcoes'
        pasta.mkdir()
        for caminho in achados[2 + len(posteriores):]:
            shutil.copy(caminho, pasta / Path(caminho).name)
        esperado = {c['arquivo']: {'presente': 'presente', 'evoluida': 'evoluída', 'aplicavel': 'aplicável', 'conflito': 'conflito'}[c['situacao_no_canonico']] for c in manifesto['correcoes']}
        (pasta / 'esperado.json').write_text(json.dumps(esperado, ensure_ascii=False, indent=1), encoding='utf-8')
        p292 = Path(node(TESTES / 'pacote-292.cjs', trabalho / 'p292')[-1])
        p291 = next((trabalho / 'p292' / 'p291').glob('*1.12.291*.agenda.json'), None) or Path(node(TESTES / 'pacote-291.cjs', trabalho / 'p291')[-1])
        candidatos = [Path(c).resolve() for c in opcoes.candidato] or [pcanon, *pposteriores]

        with zipfile.ZipFile(opcoes.zip) as zip_:
            zip_.extractall(trabalho / 'projeto')
        bases = [p.parent for p in (trabalho / 'projeto').rglob('settings.gradle')]
        assert len(bases) == 1, 'O ZIP precisa conter um único projeto Android.'
        projeto = bases[0]
        stubs = dict(runpy.run_path(str(projeto / 'tests' / 'verify_native_updates.py'))['STUBS'])
        stubs.pop(PACOTE + 'NativeUpdateHarness.java')
        for nome in ('RegressaoBase.java', 'RegressaoHarness.java'):
            stubs[PACOTE + nome] = (JAVA / nome).read_text(encoding='utf-8')
        fontes = [str(projeto / 'app/src/main/java' / PACOTE / nome) for nome in FONTES]
        for nome, texto in stubs.items():
            alvo = trabalho / 'stubs' / nome
            alvo.parent.mkdir(parents=True, exist_ok=True)
            alvo.write_text(texto, encoding='utf-8')
            fontes.append(str(alvo))
        classes = trabalho / 'classes'
        subprocess.run(compilador + ['-nowarn', '-encoding', 'UTF-8', '-d', str(classes)] + fontes, check=True)
        for candidato in candidatos:
            print('\n=== Candidato: %s' % candidato.name, flush=True)
            subprocess.run([java, '-Xmx3g', '-cp', str(classes), 'com.tiagolima.agendapersonal.RegressaoHarness',
                            str(projeto), str(p288), str(p291), str(p292), str(pcanon), str(candidato), str(pasta)], check=True)


if __name__ == '__main__':
    sys.exit(main())
