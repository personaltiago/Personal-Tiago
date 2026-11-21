#!/usr/bin/env python3
"""Roda os testes oficiais do projeto Android (tests/verify_*.cjs) com as páginas de um pacote .agenda.json no lugar das páginas do APK.

Os testes oficiais leem as páginas de DOIS lugares: app/src/main/assets/{index,professor,avaliacoes,cadastro}.html (8 testes) e o pacote
embutido web/native-release.agenda.json (10 testes). Este executor extrai o ZIP do projeto numa pasta temporária e troca OS DOIS pelo
conteúdo do pacote (as quatro páginas, a versão e a sequência), confere que nenhum teste ficou lendo o conteúdo antigo do APK e roda
cada verify_*.cjs com o node, um por vez.
Correção de 20/11: até então só as páginas de assets/ eram trocadas, e os 10 testes que leem native-release.agenda.json conferiam
sempre o conteúdo 1.12.269 do APK (achado da revisão do ChatGPT: mudar o limite do histórico no pacote não mudava o resultado).
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

# Ajustes CONHECIDOS e justificados nos testes oficiais quando eles leem o conteúdo de um pacote (feitos só na cópia temporária, impressos
# no resultado; se o trecho não for achado exatamente uma vez, o executor falha em vez de seguir):
#  - verify_update_center.cjs: o primeiro teste fixa o SHA-256 das páginas do APK 1.12.269 e a versão 1.12.269/375. É conferência de
#    integridade do APK, não de comportamento: com outro conteúdo ele falha sempre. Passa a conferir que as páginas são as do pacote.
#  - verify_shell_back.cjs: "home do aluno" esperava que o Voltar na tela inicial do aluno saísse do app (false). Desde o 1.12.281
#    (Voltar passo a passo, PRs #9/#10 e #11) o Voltar na tela inicial NÃO sai do app: o esperado passa a ser true, sem voltar a agenda.
AJUSTES = {
    'verify_update_center.cjs': [(
        "for(const [name,expected]of Object.entries({",
        "for(const [name,expected]of Object.entries(PACOTE_HASHES))assert.equal(hash(next.files[name]),expected);if(0)for(const [name,expected]of Object.entries({"),
        ('assert.equal(hash(html),"36b68d79cb440e39871e0e747a37e031da058c54be393c456291bb41d2df2069");assert.equal(next.version,\'1.12.269\');assert.equal(next.sequence,375);',
         'assert.equal(next.version,PACOTE_VERSAO);assert.equal(next.sequence,PACOTE_SEQUENCIA);'),
        # Fixture antigo sem document.querySelector (usado pelos avisos de cadastro, conteúdo novo):
        # só acrescenta o método ao DOM falso, nenhuma asserção muda.
        (
        "querySelectorAll(selector){return this.body.querySelectorAll(selector)}",
        "querySelectorAll(selector){return this.body.querySelectorAll(selector)}querySelector(selector){return this.body.querySelector(selector)}")],
    'verify_shell_back.cjs': [(
        "r=run({open:false,view:'home'});check('home do aluno',[r.result,r.calls.agendaBack],[false,0]);",
        "r=run({open:false,view:'home'});check('home do aluno (desde o 1.12.281 o Voltar não sai do app)',[r.result,r.calls.agendaBack],[true,0]);")],
}


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
            embutido = projeto / 'web' / 'native-release.agenda.json'
            nativo = json.loads(embutido.read_text(encoding='utf-8'))
            antigo = dict(nativo['files'])
            nativo['files'] = {pagina: dados['files'][pagina] for pagina in PAGINAS}
            nativo['version'], nativo['sequence'] = dados['version'], dados['sequence']
            embutido.write_text(json.dumps(nativo, ensure_ascii=False), encoding='utf-8')
            # nenhum teste pode continuar lendo o conteúdo do APK: as duas fontes têm de ter as páginas do pacote
            for pagina in PAGINAS:
                assert (assets / pagina).read_text(encoding='utf-8') == dados['files'][pagina], pagina
                assert json.loads(embutido.read_text(encoding='utf-8'))['files'][pagina] == dados['files'][pagina], pagina
            mudou = sum(antigo[p] != dados['files'][p] for p in PAGINAS)
            print('Páginas do pacote %s (sequência %s) no lugar das do APK, em assets/ e em web/native-release.agenda.json (%d de 4 páginas diferentes do APK).' % (dados['version'], dados['sequence'], mudou))
        if opcoes.pacote:
            import hashlib
            for nome, trocas in AJUSTES.items():
                alvo = projeto / 'tests' / nome
                texto = alvo.read_text(encoding='utf-8')
                for antes, depois in trocas:
                    assert texto.count(antes) == 1, 'Ajuste conhecido não casou em %s: %s' % (nome, antes[:60])
                    texto = texto.replace(antes, depois)
                if nome == 'verify_update_center.cjs':
                    hashes = {p: hashlib.sha256(dados['files'][p].encode('utf-8')).hexdigest() for p in PAGINAS}
                    texto = 'const PACOTE_HASHES=%s,PACOTE_VERSAO=%s,PACOTE_SEQUENCIA=%d;\n' % (json.dumps(hashes), json.dumps(dados['version']), dados['sequence']) + texto
                alvo.write_text(texto, encoding='utf-8')
                print('Ajuste conhecido aplicado em %s (ver AJUSTES no executor)' % nome)
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
