#!/usr/bin/env python3
"""Confere o pacote 1.12.291 (1.12.288 + 3 correções de exercícios) com o código Java REAL do aplicativo.

Compila UpdateManager, UpdateAreaPatch, UpdateIdentity e companhia (do ZIP do projeto Android que está na raiz do repositório) com as
mesmas imitações simples de Android dos testes oficiais (tests/verify_native_updates.py) e roda
equipe/testes/java/CorrecoesExerciciosHarness.java, que:
  A. monta o conteúdo como o aplicativo monta ao instalar as três correções por arquivo e exige que seja igual ao pacote gerado;
  B. usa o importador de verdade (revisão, confirmação, "já está instalado", "restauração") em aparelhos de mentira.
Não é teste em aparelho físico nem APK assinado.

Uso (da raiz do repositório):
  python3 equipe/testes/correcoes-exercicios.java.py [--zip ZIP] [--pasta PASTA_COM_OS_4_ARQUIVOS] [--pacote PACOTE_JA_GERADO]

Sem --pasta, cada arquivo de entrada é procurado na raiz do repositório e, se não estiver lá com o SHA-256 esperado, em origin/main.
Sem --pacote, o pacote é gerado agora pelo gerador (tools/gerar-correcoes-exercicios-1.12.291.cjs) numa pasta temporária.
"""
import argparse
import hashlib
import json
import runpy
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
GERADOR = RAIZ / 'tools' / 'gerar-correcoes-exercicios-1.12.291.cjs'
HARNESS = RAIZ / 'equipe' / 'testes' / 'java' / 'CorrecoesExerciciosHarness.java'
PACOTE = 'com/tiagolima/agendapersonal/'
FONTES = ('UpdateManager.java', 'UpdateAreaPatch.java', 'UpdateArchive.java', 'AndroidInstaller.java', 'UpdateStorage.java',
          'UpdateExport.java', 'UpdateDownloads.java', 'LocalPages.java', 'UpdateManifest.java', 'UpdatePackageSignature.java',
          'NativeLaunch.java', 'UpdateIdentity.java')


def sha256(dados):
    return hashlib.sha256(dados).hexdigest()


def entradas():
    """Nome e SHA-256 esperados dos quatro arquivos de entrada, lidos do próprio gerador (uma fonte só)."""
    texto = subprocess.check_output(['node', '-e', (
        "const g=require(process.argv[1]);"
        "console.log(JSON.stringify([{nome:g.SOURCE_NAME,sha256:g.SOURCE_SHA256}].concat(g.PATCHES.map(p=>({nome:p.name,sha256:p.sha256})))))"
    ), str(GERADOR)], text=True)
    return json.loads(texto)


def localizar(item, pasta, destino):
    nome, esperado = item['nome'], item['sha256']
    candidatos = [Path(pasta) / nome] if pasta else [RAIZ / nome]
    for caminho in candidatos:
        if caminho.is_file() and sha256(caminho.read_bytes()) == esperado:
            return caminho
    if not pasta:
        try:
            dados = subprocess.check_output(['git', 'show', 'origin/main:' + nome], cwd=RAIZ, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError:
            dados = b''
        if sha256(dados) == esperado:
            copia = destino / nome
            copia.write_bytes(dados)
            return copia
    raise SystemExit('Não achei %s com o SHA-256 %s (raiz do repositório, --pasta ou origin/main).' % (nome, esperado))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--zip', default=str(RAIZ / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'))
    parser.add_argument('--pasta')
    parser.add_argument('--pacote')
    opcoes = parser.parse_args()
    java = shutil.which('java')
    assert java, 'Java 17 ou mais novo é necessário.'
    compilador = [shutil.which('javac')] if shutil.which('javac') else [java, 'com.sun.tools.javac.Main']
    with tempfile.TemporaryDirectory(prefix='agenda-291-java-') as temporario:
        trabalho = Path(temporario)
        entrada = trabalho / 'entrada'
        entrada.mkdir()
        arquivos = [localizar(item, opcoes.pasta, entrada) for item in entradas()]
        if opcoes.pacote:
            pacote = Path(opcoes.pacote).resolve()
        else:
            pacote = trabalho / 'pacote.agenda.json'
            subprocess.run(['node', str(GERADOR), *map(str, arquivos), str(pacote)], check=True, stdout=subprocess.DEVNULL)
        projeto_zip = trabalho / 'projeto'
        with zipfile.ZipFile(opcoes.zip) as zip_:
            zip_.extractall(projeto_zip)
        bases = [p.parent for p in projeto_zip.rglob('settings.gradle')]
        assert len(bases) == 1, 'O ZIP precisa conter um único projeto Android.'
        projeto = bases[0]
        stubs = dict(runpy.run_path(str(projeto / 'tests' / 'verify_native_updates.py'))['STUBS'])
        stubs.pop(PACOTE + 'NativeUpdateHarness.java')
        stubs[PACOTE + 'CorrecoesExerciciosHarness.java'] = HARNESS.read_text(encoding='utf-8')
        fontes = [str(projeto / 'app/src/main/java' / PACOTE / nome) for nome in FONTES]
        for nome, texto in stubs.items():
            alvo = trabalho / 'stubs' / nome
            alvo.parent.mkdir(parents=True, exist_ok=True)
            alvo.write_text(texto, encoding='utf-8')
            fontes.append(str(alvo))
        classes = trabalho / 'classes'
        subprocess.run(compilador + ['-encoding', 'UTF-8', '-d', str(classes)] + fontes, check=True)
        subprocess.run([java, '-Xmx3g', '-cp', str(classes), 'com.tiagolima.agendapersonal.CorrecoesExerciciosHarness',
                        str(projeto), *map(str, arquivos), str(pacote)], check=True)


if __name__ == '__main__':
    sys.exit(main())
