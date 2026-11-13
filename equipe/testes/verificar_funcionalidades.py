#!/usr/bin/env python3
"""Teste de presença das funcionalidades exigidas do Agenda Personal.

Lê o ZIP do projeto (sem extrair e sem alterar nada) e confere o inventário em
equipe/funcionalidades-exigidas.json.

- Item exigido ausente reprova (código de saída 1).
- Ausências conhecidas (regressões documentadas) não reprovam; se voltarem a
  existir, o relatório avisa para movê-las para os exigidos.
- Com --estrito, uma ausência conhecida que voltou também reprova (para lembrar
  de atualizar o inventário).

Uso:
  python3 equipe/testes/verificar_funcionalidades.py [--zip CAMINHO] [--inventario CAMINHO] [--json SAIDA] [--estrito]
"""
import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
ZIP_PADRAO = RAIZ / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'
INVENTARIO_PADRAO = RAIZ / 'equipe' / 'funcionalidades-exigidas.json'
BLOCO = re.compile(r'<(?:script|style)[^>]*\bid="([^"]+)"')
PONTE = re.compile(r'@JavascriptInterface\s+public\s+[\w<>\[\]]+\s+(\w+)\s*\(')


class Projeto:
    def __init__(self, caminho):
        self.zip = zipfile.ZipFile(caminho)
        nomes = [n for n in self.zip.namelist() if n.endswith('/settings.gradle')]
        if len(nomes) != 1:
            raise SystemExit('O ZIP precisa conter um único projeto Android.')
        self.base = nomes[0][:-len('settings.gradle')]

    def existe(self, relativo):
        try:
            self.zip.getinfo(self.base + relativo)
            return True
        except KeyError:
            return False

    def texto(self, relativo):
        return self.zip.read(self.base + relativo).decode('utf-8')


def verificar(projeto, inv):
    falhas, avisos, ok = [], [], 0
    release = json.loads(projeto.texto('web/native-release.agenda.json'))
    telas = release['files']
    gradle = projeto.texto('app/build.gradle')
    versao = re.search(r"versionName '([^']+)'", gradle)
    info = {'android': versao.group(1) if versao else '?', 'conteudo': release.get('version'),
            'sequencia': release.get('sequence')}

    for tela, exig in inv['telas'].items():
        html = telas.get(tela)
        if html is None:
            falhas.append(f'{tela}: tela inteira ausente')
            continue
        contagem = {}
        for bloco in BLOCO.findall(html):
            contagem[bloco] = contagem.get(bloco, 0) + 1
        for bloco, minimo in exig.get('blocos', {}).items():
            achado = contagem.get(bloco, 0)
            if achado < minimo:
                falhas.append(f'{tela}: bloco "{bloco}" esperado {minimo}x, encontrado {achado}x')
            else:
                ok += 1
        for m in exig.get('marcadores', []):
            if m['texto'] in html:
                ok += 1
            else:
                falhas.append(f'{tela}: [{m["area"]}] marcador ausente: {m["texto"]}')
        novos = sorted(set(contagem) - set(exig.get('blocos', {})))
        if novos:
            avisos.append(f'{tela}: blocos novos ainda fora do inventário: {", ".join(novos)}')

    java = inv['java']
    for classe in java['classes']:
        if projeto.existe(java['pasta'] + '/' + classe):
            ok += 1
        else:
            falhas.append(f'Java: classe ausente: {classe}')
    main = projeto.texto(java['pasta'] + '/MainActivity.java') if projeto.existe(java['pasta'] + '/MainActivity.java') else ''
    ponte = set(PONTE.findall(main))
    for metodo in java['ponte_javascript_MainActivity']:
        if metodo in ponte:
            ok += 1
        else:
            falhas.append(f'Ponte Android: método @JavascriptInterface ausente: {metodo}')

    up = inv['atualizacoes']
    patch = projeto.texto(java['pasta'] + '/UpdateAreaPatch.java')
    for area, modulo in up['UpdateAreaPatch_modulos']:
        if f'{{"{area}", "{modulo}"' in patch:
            ok += 1
        else:
            falhas.append(f'Atualizações: módulo ausente em UpdateAreaPatch: {area}/{modulo}')
    catalogo = projeto.texto('app/src/main/assets/update-catalog.js')
    for pet in up['update_catalog_pets']:
        if f"['{pet}', " in catalogo:
            ok += 1
        else:
            falhas.append(f'Atualizações: pet ausente em update-catalog.js: {pet}')

    for arquivo in inv['arquivos']:
        if projeto.existe(arquivo):
            ok += 1
        else:
            falhas.append(f'Arquivo ausente: {arquivo}')

    ausencias = []
    for a in inv.get('ausencias_conhecidas', []):
        html = telas.get(a['tela'], '')
        presente = (a['valor'] in BLOCO.findall(html)) if a['tipo'] == 'bloco' else (a['valor'] in html)
        ausencias.append({**a, 'presente_agora': presente})
        if presente:
            avisos.append(f'Regressão "{a["id"]}" parece RESTAURADA ({a["valor"]}). '
                          'Mova o item para os exigidos por PR aprovado.')
    return info, ok, falhas, avisos, ausencias


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument('--zip', default=str(ZIP_PADRAO))
    p.add_argument('--inventario', default=str(INVENTARIO_PADRAO))
    p.add_argument('--json', help='grava o resultado em JSON neste caminho')
    p.add_argument('--estrito', action='store_true')
    args = p.parse_args()
    inv = json.loads(Path(args.inventario).read_text(encoding='utf-8'))
    info, ok, falhas, avisos, ausencias = verificar(Projeto(args.zip), inv)

    print(f'Projeto: Android {info["android"]} / conteúdo {info["conteudo"]} / sequência {info["sequencia"]}')
    print(f'Itens exigidos presentes: {ok}')
    for a in ausencias:
        estado = 'VOLTOU A EXISTIR' if a['presente_agora'] else 'ausente (documentada)'
        print(f'Ausência conhecida "{a["id"]}": {estado} — {a["pendencia"]}')
    for aviso in avisos:
        print('AVISO:', aviso)
    for falha in falhas:
        print('FALHA:', falha)
    restaurada = any(a['presente_agora'] for a in ausencias)
    reprovado = bool(falhas) or (args.estrito and restaurada)
    print('RESULTADO:', 'REPROVADO' if reprovado else 'APROVADO',
          f'({len(falhas)} falha(s), {len(avisos)} aviso(s))')
    if args.json:
        Path(args.json).write_text(json.dumps({'projeto': info, 'presentes': ok, 'falhas': falhas,
                                               'avisos': avisos, 'ausencias_conhecidas': ausencias,
                                               'resultado': 'REPROVADO' if reprovado else 'APROVADO'},
                                              ensure_ascii=False, indent=2), encoding='utf-8')
    sys.exit(1 if reprovado else 0)


if __name__ == '__main__':
    main()
