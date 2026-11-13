#!/usr/bin/env python3
"""Teste de presença das funcionalidades exigidas do Agenda Personal.

Lê o ZIP do projeto (sem extrair e sem alterar nada) e confere o inventário em
equipe/funcionalidades-exigidas.json.

Reprova (código de saída 1) quando:
- um item exigido (bloco, marcador, classe, método da ponte, módulo, arquivo) some;
- a lista de ausências conhecidas difere das exceções aprovadas (EXCECOES_APROVADAS);
- um item é exigido e ausência conhecida ao mesmo tempo;
- um item exigido na base (main) foi retirado do inventário sem uma substituição aprovada;
- uma substituição está incompleta (sem aprovação ou PR) ou o item novo não existe.

Ausências conhecidas que voltam a existir só geram aviso (com --estrito, reprovam).

Uso:
  python3 equipe/testes/verificar_funcionalidades.py [--zip CAMINHO] [--inventario CAMINHO]
      [--base-inventario CAMINHO | --sem-base] [--json SAIDA] [--estrito]

Sem --base-inventario, a base é a versão do inventário em origin/main (via git),
se existir.
"""
import argparse
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
ZIP_PADRAO = RAIZ / 'AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip'
INVENTARIO_PADRAO = RAIZ / 'equipe' / 'funcionalidades-exigidas.json'
BLOCO = re.compile(r'<(?:script|style)[^>]*\bid="([^"]+)"')
PONTE = re.compile(r'@JavascriptInterface\s+public\s+[\w<>\[\]]+\s+(\w+)\s*\(')

# Exceções aprovadas pelo Tiago (equipe/ESTADO.md, seções 4.1 e 4.2; PR #2).
# Mudar esta lista exige alterar este arquivo num PR revisado e aprovado.
EXCECOES_APROVADAS = {
    'audio-opcoes-treino': ('professor.html', 'bloco', 'ap-workout-audio-options-ui'),
    'audio-opcoes-treino-aluno': ('index.html', 'bloco', 'ap-workout-audio-options-ui'),
    'guardar-agenda-telefone': ('professor.html', 'texto', 'Guardar a agenda no telefone'),
    'guardar-agenda-telefone-ativacao': ('professor.html', 'texto', 'nsActivate'),
}


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
        return self.zip.read(self.base + relativo).decode('utf-8') if self.existe(relativo) else ''


def itens_exigidos(inv):
    """Conjunto (tipo, tela, valor) de tudo o que o inventário exige."""
    itens = set()
    for tela, exig in inv.get('telas', {}).items():
        itens |= {('bloco', tela, b) for b in exig.get('blocos', {})}
        itens |= {('texto', tela, m['texto']) for m in exig.get('marcadores', [])}
    java = inv.get('java', {})
    itens |= {('classe', 'java', c) for c in java.get('classes', [])}
    itens |= {('ponte', 'MainActivity', m) for m in java.get('ponte_javascript_MainActivity', [])}
    up = inv.get('atualizacoes', {})
    itens |= {('modulo', a, m) for a, m in up.get('UpdateAreaPatch_modulos', [])}
    itens |= {('pet-catalogo', 'update-catalog.js', p) for p in up.get('update_catalog_pets', [])}
    itens |= {('arquivo', 'projeto', a) for a in inv.get('arquivos', [])}
    return itens


def conferir_regras(inv, base):
    falhas = []
    ausencias = inv.get('ausencias_conhecidas', [])
    vistas = {}
    for a in ausencias:
        chave = (a.get('tela'), a.get('tipo'), a.get('valor'))
        if a.get('id') not in EXCECOES_APROVADAS:
            falhas.append(f'Ausência conhecida não aprovada: "{a.get("id")}" {chave}')
        elif EXCECOES_APROVADAS[a['id']] != chave:
            falhas.append(f'Ausência conhecida "{a["id"]}" alterada: {chave} ≠ aprovado {EXCECOES_APROVADAS[a["id"]]}')
        vistas[a.get('id')] = chave
    for faltando in sorted(set(EXCECOES_APROVADAS) - set(vistas)):
        falhas.append(f'Ausência conhecida aprovada foi retirada do inventário sem atualizar o verificador: "{faltando}"')

    exigidos = itens_exigidos(inv)
    for a in ausencias:
        tipo = 'bloco' if a.get('tipo') == 'bloco' else 'texto'
        if (tipo, a.get('tela'), a.get('valor')) in exigidos:
            falhas.append(f'"{a.get("valor")}" está ao mesmo tempo exigido e como ausência conhecida ({a.get("tela")})')

    subs = inv.get('substituicoes', [])
    cobertos = set()
    for s in subs:
        if not all(str(s.get(k, '')).strip() for k in ('tipo', 'tela', 'de', 'para', 'motivo', 'aprovado_por', 'pr')):
            falhas.append(f'Substituição incompleta (exige tipo, tela, de, para, motivo, aprovado_por, pr): {s}')
            continue
        cobertos.add((s['tipo'], s['tela'], s['de']))
        if (s['tipo'], s['tela'], s['para']) not in exigidos:
            falhas.append(f'Substituição de "{s["de"]}" para "{s["para"]}": o item novo precisa estar entre os exigidos')

    if base is not None:
        for item in sorted(itens_exigidos(base) - exigidos - cobertos):
            falhas.append(f'Item exigido na base foi retirado do inventário sem substituição aprovada: {item}')
    return falhas, {(s['tipo'], s['tela'], s['de']): s for s in subs if s.get('de')}


def verificar(projeto, inv, base=None):
    falhas, substituidos = conferir_regras(inv, base)
    avisos, ok = [], 0
    release = json.loads(projeto.texto('web/native-release.agenda.json') or '{"files":{}}')
    telas = release.get('files', {})
    versao = re.search(r"versionName '([^']+)'", projeto.texto('app/build.gradle'))
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
            if achado >= minimo:
                ok += 1
            elif ('bloco', tela, bloco) in substituidos:
                avisos.append(f'{tela}: bloco "{bloco}" substituído por "{substituidos[("bloco", tela, bloco)]["para"]}" (aprovado)')
            else:
                falhas.append(f'{tela}: bloco "{bloco}" esperado {minimo}x, encontrado {achado}x')
        for m in exig.get('marcadores', []):
            if m['texto'] in html:
                ok += 1
            elif ('texto', tela, m['texto']) in substituidos:
                avisos.append(f'{tela}: marcador "{m["texto"]}" substituído (aprovado)')
            else:
                falhas.append(f'{tela}: [{m["area"]}] marcador ausente: {m["texto"]}')
        novos = sorted(set(contagem) - set(exig.get('blocos', {})))
        if novos:
            avisos.append(f'{tela}: blocos novos ainda fora do inventário: {", ".join(novos)}')

    java = inv['java']
    for classe in java['classes']:
        if projeto.existe(java['pasta'] + '/' + classe):
            ok += 1
        elif ('classe', 'java', classe) not in substituidos:
            falhas.append(f'Java: classe ausente: {classe}')
    ponte = set(PONTE.findall(projeto.texto(java['pasta'] + '/MainActivity.java')))
    for metodo in java['ponte_javascript_MainActivity']:
        if metodo in ponte:
            ok += 1
        elif ('ponte', 'MainActivity', metodo) not in substituidos:
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
        elif ('arquivo', 'projeto', arquivo) not in substituidos:
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


def carregar_base(args):
    if args.sem_base:
        return None, 'sem base (desligada)'
    if args.base_inventario:
        return json.loads(Path(args.base_inventario).read_text(encoding='utf-8')), args.base_inventario
    try:
        texto = subprocess.run(['git', '-C', str(RAIZ), 'show', 'origin/main:equipe/funcionalidades-exigidas.json'],
                               capture_output=True, text=True, check=True).stdout
        return json.loads(texto), 'origin/main'
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError):
        return None, 'origin/main ainda não tem inventário (comparação com a base ignorada)'


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument('--zip', default=str(ZIP_PADRAO))
    p.add_argument('--inventario', default=str(INVENTARIO_PADRAO))
    p.add_argument('--base-inventario', help='inventário de referência (por padrão, o de origin/main)')
    p.add_argument('--sem-base', action='store_true', help='não comparar com a base')
    p.add_argument('--json', help='grava o resultado em JSON neste caminho')
    p.add_argument('--estrito', action='store_true')
    args = p.parse_args()
    inv = json.loads(Path(args.inventario).read_text(encoding='utf-8'))
    base, origem_base = carregar_base(args)
    info, ok, falhas, avisos, ausencias = verificar(Projeto(args.zip), inv, base)

    print(f'Projeto: Android {info["android"]} / conteúdo {info["conteudo"]} / sequência {info["sequencia"]}')
    print(f'Base do inventário: {origem_base}')
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
        Path(args.json).write_text(json.dumps({'projeto': info, 'base': origem_base, 'presentes': ok,
                                               'falhas': falhas, 'avisos': avisos,
                                               'ausencias_conhecidas': ausencias,
                                               'resultado': 'REPROVADO' if reprovado else 'APROVADO'},
                                              ensure_ascii=False, indent=2), encoding='utf-8')
    sys.exit(1 if reprovado else 0)


if __name__ == '__main__':
    main()
