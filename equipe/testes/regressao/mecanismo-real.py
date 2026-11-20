"""Teste de regressão com o mecanismo REAL de atualização do aplicativo (UpdateManager e UpdateAreaPatch do ZIP oficial).

Compila o código Java de atualização de dentro de AgendaPersonal_AndroidStudio_v1.65_contas_convites.zip (com os mesmos dublês de Android
do teste oficial tests/verify_native_updates.py) e roda equipe/testes/regressao/java/RegressaoHarness.java para cada candidato.

Uso (da raiz do repositório):
  python3 -I equipe/testes/regressao/mecanismo-real.py [--candidato ARQUIVO ...] [--zip ZIP]
Sem --candidato, testa a própria REFERÊNCIA do manifesto (1.12.295 + os complementos dele, igual ao 1.12.298) sobre todos os estados.
Os pacotes (1.12.288, 1.12.294, 1.12.295), o complemento e as correções da main são achados na raiz/histórico da main pelo SHA-256; o 1.12.291 e o
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
        pac = {p['versao']: p for p in manifesto['pacotes'] if p['tipo'] == 'pacote-completo'}
        # complementos do 1.12.295, na ordem da cadeia (a referência = 295 + todos eles)
        comps = [p for p in manifesto['pacotes'] if p['tipo'] == 'complemento' and p['base'] == '1.12.295']
        pares = ['%s=%s' % (pac[v]['arquivo'], pac[v]['sha256']) for v in ('1.12.288', '1.12.294', '1.12.295')]
        pares += ['%s=%s' % (c['arquivo'], c['sha256']) for c in manifesto['correcoes']]
        achados = node(TESTES / 'arquivos-da-main.cjs', trabalho / 'main', *pares)
        p288, p294, p295 = (Path(a) for a in achados[:3])
        pasta = trabalho / 'correcoes'
        pasta.mkdir()
        for caminho in achados[3:]:
            shutil.copy(caminho, pasta / Path(caminho).name)
        pcomps = [pasta / c['arquivo'] for c in comps]
        esperado = {c['arquivo']: {'presente': 'presente', 'evoluida': 'evoluída', 'aplicavel': 'aplicável', 'conflito': 'conflito'}[c['situacao_no_canonico']] for c in manifesto['correcoes']}
        (pasta / 'esperado.json').write_text(json.dumps(esperado, ensure_ascii=False, indent=1), encoding='utf-8')
        p292 = Path(node(TESTES / 'pacote-292.cjs', trabalho / 'p292')[-1])
        p291 = next((trabalho / 'p292' / 'p291').glob('*1.12.291*.agenda.json'), None) or Path(node(TESTES / 'pacote-291.cjs', trabalho / 'p291')[-1])
        # a referência montada pelo mesmo código do manifesto (o Java confere que é igual à do app)
        referencia = trabalho / 'referencia.agenda.json'
        subprocess.run(['node', '-e', "const L=require(process.argv[1]),fs=require('fs');let p=L.lerJson(process.argv[2]);for(const c of process.argv.slice(4))p=L.aplicarCorrecao(p,L.lerJson(c));fs.writeFileSync(process.argv[3],JSON.stringify(p))",
                        str(RAIZ / 'equipe' / 'canonico' / 'lib.cjs'), str(p295), str(referencia), *map(str, pcomps)], check=True)
        candidatos = [Path(c).resolve() for c in opcoes.candidato] or [referencia]

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
        falhas = []
        import hashlib
        passos = {p['sha256']: p for p in manifesto['pacotes'] if p['tipo'] == 'pacote-completo' and p['sequencia'] >= manifesto['canonico']['sequencia']}
        for candidato in candidatos:
            print('\n=== Candidato: %s' % candidato.name, flush=True)
            passo = passos.get(hashlib.sha256(candidato.read_bytes()).hexdigest())
            if passo:
                # reassinatura de um passo aprovado da cadeia (idêntico byte a byte): ele já é testado aqui como estado (seção C) e a
                # referência é testada sobre ele; instalado sobre a referência, o app avisa "Revisar restauração" (seção D).
                print('Passo conhecido da cadeia %s, idêntico byte a byte: já coberto pelo teste da referência; nada a instalar por cima dela.' % passo['versao'])
                continue
            autorizados = node(Path(__file__).resolve().parent / 'autorizados.cjs', candidato)[-1]
            r = subprocess.run([java, '-Xmx3g', '-cp', str(classes), 'com.tiagolima.agendapersonal.RegressaoHarness',
                                str(projeto), str(p288), str(p291), str(p292), str(p294), str(p295), str(referencia), str(candidato), str(pasta), ','.join(c.name for c in pcomps), autorizados])
            if r.returncode:
                falhas.append(candidato.name)
        if falhas:
            print('\nREPROVADO pelo teste com o mecanismo real: ' + ', '.join(falhas))
            return 1
        print('\nAprovado pelo teste com o mecanismo real: ' + ', '.join(c.name for c in candidatos))
        return 0


if __name__ == '__main__':
    sys.exit(main())
