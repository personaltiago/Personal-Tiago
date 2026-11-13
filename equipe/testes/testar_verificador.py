#!/usr/bin/env python3
"""Autoteste do verificador de funcionalidades.

Cria cópias modificadas do ZIP e do inventário dentro de um
tempfile.TemporaryDirectory() próprio. Só esses arquivos temporários são
removidos no fim; o ZIP original e o inventário original nunca são alterados
(o SHA-256 dos dois é conferido antes e depois).

Confere se o verificador:
  A. aprova a versão atual, com as regressões documentadas;
  B. reprova quando um bloco, marcador, método da ponte, classe Java ou pet some do app;
  C. avisa (e reprova só com --estrito) quando uma regressão documentada volta;
  D. reprova manipulações do inventário: exceção nova, exceção alterada ou
     retirada, item exigido e ausente ao mesmo tempo, item exigido apagado do
     inventário, substituição incompleta;
  E. aceita uma substituição (renomeação) completa e aprovada.

Uso: python3 equipe/testes/testar_verificador.py [--zip CAMINHO]
"""
import argparse
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
VERIFICADOR = AQUI / 'verificar_funcionalidades.py'
ZIP_PADRAO = AQUI.parents[1] / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'
INVENTARIO = AQUI.parent / 'funcionalidades-exigidas.json'


def sha256(caminho):
    return hashlib.sha256(Path(caminho).read_bytes()).hexdigest()


def copia_modificada(origem, destino, mudar):
    with zipfile.ZipFile(origem) as z, zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as out:
        for item in z.infolist():
            novo = mudar(item.filename, z.read(item.filename))
            if novo is not None:
                out.writestr(item, novo)


def mudar_tela(tela, antes, depois):
    def mudar(nome, dados):
        if nome.endswith('web/native-release.agenda.json'):
            rel = json.loads(dados)
            assert antes in rel['files'][tela], (tela, antes)
            rel['files'][tela] = rel['files'][tela].replace(antes, depois, 1)
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


AUDIO_DE_VOLTA = mudar_tela('professor.html', '</body>', '<script id="ap-workout-audio-options-ui"></script></body>')
CARTEIRA_RENOMEADA = mudar_tela('professor.html', 'id="ap-finance-wallet"', 'id="ap-finance-wallet-v2"')
SEM_CARTEIRA = mudar_tela('professor.html', 'id="ap-finance-wallet"', 'id="x-removido"')


def inv_mover_para_ausencias(inv):
    del inv['telas']['professor.html']['blocos']['ap-finance-wallet']
    inv['ausencias_conhecidas'].append({'id': 'carteira', 'descricao': 'escondendo regressão', 'tipo': 'bloco',
                                        'tela': 'professor.html', 'valor': 'ap-finance-wallet',
                                        'pendencia': 'nenhuma', 'decisao': 'nenhuma'})


def inv_alterar_excecao(inv):
    inv['ausencias_conhecidas'][0]['valor'] = 'ap-finance-wallet'


def inv_retirar_excecao(inv):
    inv['ausencias_conhecidas'].pop(0)


def inv_exigido_e_ausente(inv):
    inv['telas']['professor.html']['blocos']['ap-workout-audio-options-ui'] = 1


def inv_apagar_exigido(inv):
    del inv['telas']['professor.html']['blocos']['ap-finance-wallet']


def inv_renomear(inv, completa=True):
    blocos = inv['telas']['professor.html']['blocos']
    blocos['ap-finance-wallet-v2'] = blocos.pop('ap-finance-wallet')
    s = {'tipo': 'bloco', 'tela': 'professor.html', 'de': 'ap-finance-wallet', 'para': 'ap-finance-wallet-v2',
         'motivo': 'renomeação de teste', 'aprovado_por': 'Tiago', 'pr': '#teste'}
    if not completa:
        s.pop('aprovado_por')
    inv['substituicoes'].append(s)


CASOS = [
    # (nome, mudança no ZIP, mudança no inventário, argumentos extras, saída esperada, trecho esperado)
    ('A1 versão atual (1.204) é aprovada', None, None, [], 0, 'ausente (documentada)'),
    ('B1 bloco do financeiro removido do app reprova', SEM_CARTEIRA, None, [], 1, 'bloco "ap-finance-wallet"'),
    ('B2 função do descanso removida reprova',
     mudar_tela('professor.html', 'function saveWorkoutRest', 'function x_saveWorkoutRest'), None, [], 1, 'function saveWorkoutRest'),
    ('B3 migração do urso/galo removida reprova',
     mudar_tela('index.html', '(s.species==="panda"||s.species==="rooster")&&(s.species="kitten")', ''), None, [], 1, '[pets] marcador ausente'),
    ('B4 método da ponte Android removido reprova',
     substituir_em('MainActivity.java', 'public boolean startWorkoutRest(', 'public boolean x_startWorkoutRest('), None, [], 1, 'startWorkoutRest'),
    ('B5 classe Java removida reprova', sem_arquivo('agendapersonal/NativeStore.java'), None, [], 1, 'NativeStore.java'),
    ('B6 pet removido da Conferência reprova', substituir_em('update-catalog.js', "['lobo', ", "['x-lobo', "), None, [], 1, 'lobo'),
    ('C1 regressão de áudio restaurada só avisa', AUDIO_DE_VOLTA, None, [], 0, 'parece RESTAURADA'),
    ('C2 regressão restaurada reprova com --estrito', AUDIO_DE_VOLTA, None, ['--estrito'], 1, 'parece RESTAURADA'),
    ('D1 exigido transferido para ausências (escondendo regressão) reprova',
     SEM_CARTEIRA, inv_mover_para_ausencias, [], 1, 'Ausência conhecida não aprovada: "carteira"'),
    ('D2 exceção aprovada com valor alterado reprova', None, inv_alterar_excecao, [], 1, 'alterada'),
    ('D3 exceção aprovada retirada do inventário reprova', None, inv_retirar_excecao, [], 1, 'retirada do inventário'),
    ('D4 item exigido e ausência ao mesmo tempo reprova', None, inv_exigido_e_ausente, [], 1, 'ao mesmo tempo exigido'),
    ('D5 item exigido apagado do inventário reprova (comparação com a base)',
     SEM_CARTEIRA, inv_apagar_exigido, [], 1, 'retirado do inventário sem substituição'),
    ('D6 substituição sem aprovação reprova',
     CARTEIRA_RENOMEADA, lambda inv: inv_renomear(inv, completa=False), [], 1, 'Substituição incompleta'),
    ('E1 renomeação aprovada e completa é aceita', CARTEIRA_RENOMEADA, inv_renomear, [], 0, 'RESULTADO: APROVADO'),
]


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--zip', default=str(ZIP_PADRAO))
    origem = Path(p.parse_args().zip).resolve()
    antes = (sha256(origem), sha256(INVENTARIO))
    inventario = json.loads(INVENTARIO.read_text(encoding='utf-8'))
    falhas = 0
    with tempfile.TemporaryDirectory(prefix='agenda-autoteste-') as tmp:
        pasta = Path(tmp)
        for i, (nome, mudar_zip, mudar_inv, extra, esperado, trecho) in enumerate(CASOS, 1):
            alvo_zip = origem
            if mudar_zip is not None:
                alvo_zip = pasta / f'caso{i}.zip'
                copia_modificada(origem, alvo_zip, mudar_zip)
            inv = copy.deepcopy(inventario)
            if mudar_inv is not None:
                mudar_inv(inv)
            alvo_inv = pasta / f'caso{i}-inventario.json'
            alvo_inv.write_text(json.dumps(inv, ensure_ascii=False), encoding='utf-8')
            # A base é sempre o inventário original, como se fosse o da main.
            r = subprocess.run([sys.executable, str(VERIFICADOR), '--zip', str(alvo_zip), '--inventario', str(alvo_inv),
                                '--base-inventario', str(INVENTARIO), *extra], capture_output=True, text=True)
            certo = r.returncode == esperado and trecho in r.stdout
            falhas += not certo
            print(('PASS' if certo else 'FALHOU'), f'{nome} (saída {r.returncode}, esperado {esperado})')
            if not certo:
                print(r.stdout, r.stderr)
    depois = (sha256(origem), sha256(INVENTARIO))
    intactos = antes == depois
    print('ZIP e inventário originais intactos (SHA-256 igual antes e depois):', 'sim' if intactos else 'NÃO')
    print(f'Autoteste: {len(CASOS) - falhas}/{len(CASOS)} casos corretos. Arquivos temporários removidos.')
    sys.exit(0 if falhas == 0 and intactos else 1)


if __name__ == '__main__':
    main()
