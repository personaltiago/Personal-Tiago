"""Confere o pacote 1.12.295 (feedback pelo ícone do topo, sobre o 1.12.294) com o código Java REAL do aplicativo (FeedbackTopoHarness.java,
que reaproveita o IconeFeedbackHarness.java): numeração, só o index.html muda, nenhuma correção por área da main que estava no 294 se
perde, e o UpdateManager de verdade mostra "Revisar atualização" sobre o 294, o 292 e o 288 e "Revisar restauração" ao voltar ao 294.

Uso (da raiz do repositório):
  python3 -I equipe/testes/feedback-topo.java.py [--zip ZIP] [--pacote PACOTE_295_JA_GERADO]
O 1.12.294 e o 1.12.288 são achados na raiz da main (conferidos pelo SHA-256), o 1.12.292 pelo pacote-292.cjs; as correções da main e o que
se espera de cada uma vêm do icone-feedback.java.py. Sem --pacote, o 1.12.295 é gerado agora a partir do 294.
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
BASE = runpy.run_path(str(RAIZ / 'equipe' / 'testes' / 'icone-feedback.java.py'), run_name='base')
GERADOR = RAIZ / 'tools' / 'gerar-feedback-topo-1.12.295.cjs'
PACOTE_294 = ('AgendaPersonal-1.12.294-Icone-Feedback-Para-Assinar.agenda.json', '2bf38cc59b48a663e00da9faf8d2feb7ca48ae186ff833500c0a0e68fea230e9')
HARNESS = RAIZ / 'equipe' / 'testes' / 'java' / 'FeedbackTopoHarness.java'
node = BASE['node']


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--zip', default=str(RAIZ / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'))
    parser.add_argument('--pacote')
    opcoes = parser.parse_args()
    java = shutil.which('java')
    assert java, 'Java 17 ou mais novo é necessário.'
    compilador = [shutil.which('javac')] if shutil.which('javac') else [java, 'com.sun.tools.javac.Main']
    with tempfile.TemporaryDirectory(prefix='agenda-295-java-') as temporario:
        trabalho = Path(temporario)
        pacote_292 = Path(node(BASE['LOCALIZADOR_292'], trabalho / 'entrada')[-1])
        pares = ['%s=%s' % BASE['PACOTE_288'], '%s=%s' % PACOTE_294] + ['%s=%s' % (nome, sha) for nome, sha, _ in BASE['CORRECOES']]
        achados = node(BASE['LOCALIZADOR_MAIN'], trabalho / 'main', *pares)
        pacote_288, pacote_294 = Path(achados[0]), Path(achados[1])
        pasta = trabalho / 'correcoes'
        pasta.mkdir()
        for caminho in achados[2:]:
            shutil.copy(caminho, pasta / Path(caminho).name)
        (pasta / 'esperado.json').write_text(json.dumps({nome: esperado for nome, _, esperado in BASE['CORRECOES']}, indent=2), encoding='utf-8')
        if opcoes.pacote:
            pacote = Path(opcoes.pacote).resolve()
        else:
            pacote = trabalho / 'pacote.agenda.json'
            subprocess.run(['node', str(GERADOR), str(pacote_294), str(pacote)], check=True, stdout=subprocess.DEVNULL)
        with zipfile.ZipFile(opcoes.zip) as zip_:
            zip_.extractall(trabalho / 'projeto')
        bases = [p.parent for p in (trabalho / 'projeto').rglob('settings.gradle')]
        assert len(bases) == 1, 'O ZIP precisa conter um único projeto Android.'
        projeto = bases[0]
        PACOTE = BASE['PACOTE']
        stubs = dict(runpy.run_path(str(projeto / 'tests' / 'verify_native_updates.py'))['STUBS'])
        stubs.pop(PACOTE + 'NativeUpdateHarness.java')
        stubs[PACOTE + 'IconeFeedbackHarness.java'] = BASE['HARNESS'].read_text(encoding='utf-8')
        stubs[PACOTE + 'FeedbackTopoHarness.java'] = HARNESS.read_text(encoding='utf-8')
        fontes = [str(projeto / 'app/src/main/java' / PACOTE / nome) for nome in BASE['FONTES']]
        for nome, texto in stubs.items():
            alvo = trabalho / 'stubs' / nome
            alvo.parent.mkdir(parents=True, exist_ok=True)
            alvo.write_text(texto, encoding='utf-8')
            fontes.append(str(alvo))
        classes = trabalho / 'classes'
        subprocess.run(compilador + ['-encoding', 'UTF-8', '-d', str(classes)] + fontes, check=True)
        subprocess.run([java, '-Xmx3g', '-cp', str(classes), 'com.tiagolima.agendapersonal.FeedbackTopoHarness',
                        str(projeto), str(pacote_288), str(pacote_292), str(pacote_294), str(pacote), str(pasta)], check=True)


if __name__ == '__main__':
    sys.exit(main())
