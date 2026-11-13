#!/usr/bin/env python3
"""Autoteste do verificador de funcionalidades.

Cria cópias modificadas do ZIP numa pasta temporária nova (o ZIP original não é
alterado e nada é apagado) e confere se o verificador:
  1. aprova a versão atual, com as regressões documentadas;
  2. reprova quando um bloco, marcador, método da ponte, classe Java ou pet some;
  3. avisa (e reprova só com --estrito) quando uma regressão documentada volta.

Uso: python3 equipe/testes/testar_verificador.py [--zip CAMINHO]
"""
import argparse
import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
VERIFICADOR = AQUI / 'verificar_funcionalidades.py'
ZIP_PADRAO = AQUI.parents[1] / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'


def copia_modificada(origem, destino, mudar):
    with zipfile.ZipFile(origem) as z, zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as out:
        for item in z.infolist():
            dados = z.read(item.filename)
            novo = mudar(item.filename, dados)
            if novo is not None:
                out.writestr(item, novo)


def mudar_release(f):
    def mudar(nome, dados):
        if nome.endswith('web/native-release.agenda.json'):
            rel = json.loads(dados)
            f(rel['files'])
            return json.dumps(rel, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        return dados
    return mudar


def substituir_em(sufixo, antes, depois):
    def mudar(nome, dados):
        if nome.endswith(sufixo):
            texto = dados.decode('utf-8')
            assert antes in texto, (sufixo, antes)
            return texto.replace(antes, depois, 1).encode('utf-8')
        return dados
    return mudar


def sem_arquivo(sufixo):
    return lambda nome, dados: None if nome.endswith(sufixo) else dados


def rodar(zip_caminho, *extra):
    r = subprocess.run([sys.executable, str(VERIFICADOR), '--zip', str(zip_caminho), *extra],
                       capture_output=True, text=True)
    return r.returncode, r.stdout


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--zip', default=str(ZIP_PADRAO))
    origem = Path(p.parse_args().zip)
    pasta = Path(tempfile.mkdtemp(prefix='agenda-autoteste-'))
    casos = [
        ('versão atual (1.204) é aprovada', None, [], 0, 'ausente (documentada)'),
        ('bloco do financeiro removido reprova',
         mudar_release(lambda f: f.__setitem__('professor.html', f['professor.html'].replace('id="ap-finance-wallet"', 'id="x-removido"', 1))),
         [], 1, 'bloco "ap-finance-wallet"'),
        ('função do descanso removida reprova',
         mudar_release(lambda f: f.__setitem__('professor.html', f['professor.html'].replace('function saveWorkoutRest', 'function x_saveWorkoutRest', 1))),
         [], 1, 'function saveWorkoutRest'),
        ('migração do urso/galo removida reprova',
         mudar_release(lambda f: f.__setitem__('index.html', f['index.html'].replace('(s.species==="panda"||s.species==="rooster")&&(s.species="kitten")', '', 1))),
         [], 1, '[pets] marcador ausente'),
        ('método da ponte Android removido reprova',
         substituir_em('MainActivity.java', 'public boolean startWorkoutRest(', 'public boolean x_startWorkoutRest('),
         [], 1, 'startWorkoutRest'),
        ('classe Java removida reprova', sem_arquivo('agendapersonal/NativeStore.java'), [], 1, 'NativeStore.java'),
        ('pet removido da Conferência reprova', substituir_em('update-catalog.js', "['lobo', ", "['x-lobo', "), [], 1, 'lobo'),
        ('regressão de áudio restaurada só avisa',
         mudar_release(lambda f: f.__setitem__('professor.html', f['professor.html'].replace('</body>', '<script id="ap-workout-audio-options-ui"></script></body>', 1))),
         [], 0, 'parece RESTAURADA'),
        ('regressão restaurada reprova com --estrito',
         mudar_release(lambda f: f.__setitem__('professor.html', f['professor.html'].replace('</body>', '<script id="ap-workout-audio-options-ui"></script></body>', 1))),
         ['--estrito'], 1, 'parece RESTAURADA'),
    ]
    falhas = 0
    for i, (nome, mudar, extra, esperado, trecho) in enumerate(casos, 1):
        alvo = origem
        if mudar is not None:
            alvo = pasta / f'caso{i}.zip'
            copia_modificada(origem, alvo, mudar)
        codigo, saida = rodar(alvo, *extra)
        certo = codigo == esperado and trecho in saida
        falhas += not certo
        print(('PASS' if certo else 'FALHOU'), f'{i}. {nome} (saída {codigo}, esperado {esperado})')
        if not certo:
            print(saida)
    print(f'Autoteste: {len(casos) - falhas}/{len(casos)} casos corretos. Cópias temporárias em {pasta}')
    sys.exit(1 if falhas else 0)


if __name__ == '__main__':
    main()
