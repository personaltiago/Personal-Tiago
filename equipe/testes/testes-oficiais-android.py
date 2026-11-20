#!/usr/bin/env python3
"""Roda os testes oficiais do projeto Android (tests/verify_*.cjs) com as páginas de um pacote .agenda.json no lugar das páginas do APK.

Os testes oficiais leem app/src/main/assets/{index,professor,avaliacoes,cadastro}.html. Este executor extrai o ZIP do projeto (que está na raiz
do repositório) numa pasta temporária, troca essas quatro páginas pelas do pacote e roda cada verify_*.cjs com o node, um por vez.
Não é teste em aparelho. Os verify_*.py (Java/Android) têm executores próprios.

Uso (da raiz do repositório):
  python3 equipe/testes/testes-oficiais-android.py PACOTE.agenda.json [--zip ZIP]
Sem trocar nada (só as páginas do APK): use --sem-pacote.
"""
import argparse
import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
PAGINAS = ('index.html', 'professor.html', 'avaliacoes.html', 'cadastro.html')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('pacote', nargs='?')
    parser.add_argument('--sem-pacote', action='store_true')
    parser.add_argument('--zip', default=str(RAIZ / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'))
    opcoes = parser.parse_args()
    assert opcoes.pacote or opcoes.sem_pacote, 'Informe o pacote .agenda.json (ou --sem-pacote).'
    with tempfile.TemporaryDirectory(prefix='agenda-oficiais-') as temporario:
        pasta = Path(temporario)
        with zipfile.ZipFile(opcoes.zip) as zip_:
            zip_.extractall(pasta)
        bases = [p.parent for p in pasta.rglob('settings.gradle')]
        assert len(bases) == 1, 'O ZIP precisa conter um único projeto Android.'
        projeto = bases[0]
        assets = projeto / 'app/src/main/assets'
        if opcoes.pacote:
            dados = json.loads(Path(opcoes.pacote).read_text(encoding='utf-8'))
            for pagina in PAGINAS:
                (assets / pagina).write_text(dados['files'][pagina], encoding='utf-8')
            print('Páginas do pacote %s (sequência %s) no lugar das do APK.' % (dados['version'], dados['sequence']))
        testes = sorted((projeto / 'tests').glob('verify_*.cjs'))
        falhas = []
        for teste in testes:
            r = subprocess.run(['node', str(teste)], cwd=str(projeto), capture_output=True, text=True, timeout=600)
            print(('OK    ' if r.returncode == 0 else 'FALHA ') + teste.name)
            if r.returncode != 0:
                falhas.append(teste.name)
                print((r.stdout + r.stderr)[-1500:])
        print('\n%d de %d testes oficiais passaram%s' % (len(testes) - len(falhas), len(testes), '' if not falhas else '; falharam: ' + ', '.join(falhas)))
        return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(main())
