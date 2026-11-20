"""Monta imagens com as capturas de capturas.js (ícone do feedback, 1.12.294), para olhar a olho.
Uso: python3 montagem.py <pasta-das-capturas> <pasta-de-saida>
Só junta e legenda; nada aqui confere o comportamento (quem confere é funcional.js). As capturas do Início têm um .json ao lado com o
retângulo de cada botão do topo, e é ele que decide o recorte (nenhum número de recorte é chutado)."""
import json
import os
import sys
from PIL import Image, ImageDraw, ImageFont

origem, destino = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
os.makedirs(destino, exist_ok=True)
FUNDO = (14, 18, 24)
TEXTO = (236, 240, 244)
SUAVE = (170, 180, 190)
NEGRITO = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
NORMAL = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
ESCALA = 2           # as capturas são 2x
ESPACO, MARGEM = 24, 24
LARGURA = 390 * ESCALA
ALTURA = 844 * ESCALA

CORES = ['rosa', 'vermelho', 'laranja', 'amarelo', 'verde', 'ciano', 'azul', 'roxo', 'preto']
NOME_COR = {'rosa': 'Rosa', 'vermelho': 'Vermelho', 'laranja': 'Laranja', 'amarelo': 'Amarelo', 'verde': 'Verde', 'ciano': 'Ciano', 'azul': 'Azul', 'roxo': 'Roxo', 'preto': 'Tema preto'}


def fonte(caminho, tamanho):
    return ImageFont.truetype(caminho, tamanho)


def abrir(nome):
    return Image.open(os.path.join(origem, nome)).convert('RGB')


def medidas(nome):
    with open(os.path.join(origem, nome.replace('.png', '.json')), encoding='utf8') as f:
        return json.load(f)


def painel(imagem, caixa, titulo, subtitulo=None, largura_minima=0):
    """Recorta `caixa` (esquerda, topo, direita, base) e põe a legenda em cima.
    `largura_minima` alarga a folha (não a imagem) para as colunas da montagem ficarem alinhadas."""
    corte = imagem.crop(caixa)
    alto_legenda = 74 if subtitulo else 52
    folha = Image.new('RGB', (max(corte.width, largura_minima), corte.height + alto_legenda), FUNDO)
    d = ImageDraw.Draw(folha)
    d.text((18, 10), titulo, font=fonte(NEGRITO, 28), fill=TEXTO)
    if subtitulo:
        d.text((18, 44), subtitulo, font=fonte(NORMAL, 22), fill=SUAVE)
    folha.paste(corte, (0, alto_legenda))
    return folha


def fileiras(linhas):
    """Junta fileiras de painéis (cada fileira alinhada à esquerda, painéis lado a lado)."""
    largura = max(sum(p.width for p in linha) + ESPACO * (len(linha) - 1) for linha in linhas)
    altura = sum(max(p.height for p in linha) for linha in linhas) + ESPACO * (len(linhas) - 1)
    folha = Image.new('RGB', (largura + 2 * MARGEM, altura + 2 * MARGEM), FUNDO)
    y = MARGEM
    for linha in linhas:
        x = MARGEM
        for p in linha:
            folha.paste(p, (x, y))
            x += p.width + ESPACO
        y += max(p.height for p in linha) + ESPACO
    return folha


def faixa_dos_botoes(nome, quantos=None, folga=8):
    """Recorte dos botões do topo do Início (WhatsApp, feedback, sino e foto), na ordem em que aparecem, sem escala. `quantos` limita aos primeiros."""
    m = medidas(nome)
    todos = sorted(m['filhos'], key=lambda f: f['x'])
    filhos = todos[:quantos] if quantos else todos
    esq = min(f['x'] for f in filhos) - folga
    topo = min(f['y'] for f in filhos) - folga
    base = max(f['b'] for f in filhos) + folga
    dir_ = max(f['r'] for f in filhos) + folga
    if len(filhos) < len(todos):  # corta no meio do espaço entre o último botão e o próximo, para não sobrar um pedaço dele
        dir_ = min(dir_, (filhos[-1]['r'] + todos[len(filhos)]['x']) / 2)
    return abrir(nome).crop((round(esq * ESCALA), round(topo * ESCALA), round(dir_ * ESCALA), round(base * ESCALA)))


def cartao(imagem, legenda, largura):
    """Imagem com uma legenda pequena em cima, numa folha com a `largura` dada (as colunas da grade ficam alinhadas)."""
    folha = Image.new('RGB', (largura, imagem.height + 36), FUNDO)
    ImageDraw.Draw(folha).text((4, 5), legenda, font=fonte(NORMAL, 22), fill=SUAVE)
    folha.paste(imagem, (0, 36))
    return folha


def grade(cartoes, colunas):
    linhas = [cartoes[i:i + colunas] for i in range(0, len(cartoes), colunas)]
    return fileiras(linhas)


def com_titulo(corpo, titulo, subtitulo):
    cab = Image.new('RGB', (corpo.width, 82), FUNDO)
    d = ImageDraw.Draw(cab)
    d.text((MARGEM, 14), titulo, font=fonte(NEGRITO, 30), fill=TEXTO)
    d.text((MARGEM, 50), subtitulo, font=fonte(NORMAL, 22), fill=SUAVE)
    folha = Image.new('RGB', (corpo.width, cab.height + corpo.height), FUNDO)
    folha.paste(cab, (0, 0))
    folha.paste(corpo, (0, cab.height))
    return folha


# ---- 1) antes e depois: o topo do Início (390 px de largura, 2x), 2 pendentes ----
topo = (0, 0, LARGURA, 560)
antes = painel(abrir('01-antes-1.12.292.png'), topo, 'Hoje (1.12.292)', 'o balão do feedback')
depois = painel(abrir('02-depois-padrao.png'), topo, 'Novo (1.12.294)', 'o mesmo balão é o padrão; a aluna pode trocar')
fileiras([[antes, depois]]).save(os.path.join(destino, 'icone-antes-depois.png'), optimize=True)

# ---- 2) o Perfil: linha fechada, painel aberto no padrão, painel com um ícone escolhido ----
cheia = (0, 0, LARGURA, ALTURA)
perfil = [
    painel(abrir('03-perfil-fechado.png'), cheia, 'Meu perfil', 'nova linha "Ícone do feedback"'),
    painel(abrir('04-perfil-aberto-padrao.png'), cheia, 'Ao tocar na linha', '19 opções; o padrão já vem marcado'),
    painel(abrir('05-perfil-aberto-escolhido.png'), cheia, 'Ícone escolhido', 'o status diz qual é; o topo muda na hora')
]
fileiras([[p.resize((p.width * 6 // 10, p.height * 6 // 10), Image.LANCZOS) for p in perfil]]).save(os.path.join(destino, 'icone-perfil.png'), optimize=True)

# ---- 3) o ícone padrão em cada cor do aplicativo, escuro (esquerda) e claro (direita), ao lado do WhatsApp e do sino ----
fai = {(c, m): faixa_dos_botoes('20-cor-' + c + '-' + m + '.png') for c in CORES for m in ('escuro', 'claro')}
larg = max(f.width for f in fai.values())
cel = []
for c in CORES:
    cel.append(cartao(fai[(c, 'escuro')], NOME_COR[c] + ' · escuro', larg))
    cel.append(cartao(fai[(c, 'claro')], NOME_COR[c] + ' · claro', larg))
com_titulo(grade(cel, 2), 'O ícone acompanha a cor do aplicativo', 'WhatsApp · feedback · sino · foto: a mesma cor e o mesmo tamanho').save(os.path.join(destino, 'icone-cores.png'), optimize=True)

# ---- 4) os 19 desenhos no topo (rosa, escuro): WhatsApp, feedback e sino, para comparar o tamanho ----
ids = [n for n in os.listdir(origem) if n.startswith('10-topo-') and n.endswith('.json')]
ids.sort(key=lambda n: medidas(n.replace('.json', '.png'))['ordem'])  # a ordem do manifesto (a mesma da grade do Perfil)
fai19 = [(medidas(n)['nome'], faixa_dos_botoes(n.replace('.json', '.png'), quantos=3)) for n in ids]
larg19 = max(f.width for _, f in fai19)
com_titulo(grade([cartao(f, nome, larg19) for nome, f in fai19], 3), 'Os 19 ícones no topo', 'WhatsApp · feedback · sino (rosa, escuro): todos cabem entre os vizinhos').save(os.path.join(destino, 'icone-19-no-topo.png'), optimize=True)

# ---- 5) o painel do Perfil em quatro cores ----
def corte_painel(nome, titulo, subtitulo):
    m = medidas(nome)
    p = m['painel']
    imagem = abrir(nome)
    caixa = (0, max(0, round((p['y'] - 6) * ESCALA)), LARGURA, min(imagem.height, round((p['b'] + 8) * ESCALA)))
    q = painel(imagem, caixa, titulo, subtitulo)
    return q.resize((q.width * 75 // 100, q.height * 75 // 100), Image.LANCZOS)

paineis = [
    corte_painel('30-painel-azul-escuro.png', 'Azul · escuro', 'Coração escolhido'),
    corte_painel('31-painel-amarelo-claro.png', 'Amarelo · claro', 'Balão com estrela escolhido'),
    corte_painel('32-painel-roxo-claro.png', 'Roxo · claro', 'Carinha feliz escolhida'),
    corte_painel('33-painel-verde-escuro.png', 'Verde · escuro', 'Selo aprovado escolhido'),
]
fileiras([paineis[:2], paineis[2:]]).save(os.path.join(destino, 'icone-paineis.png'), optimize=True)

# ---- 6) tela estreita e janela aberta ----
estreita_perfil = painel(abrir('41-320-perfil-aberto.png'), (0, 0, 320 * ESCALA, 700 * ESCALA), 'Tela estreita (320 px)', 'a grade passa para 4 colunas')
estreita_topo = painel(abrir('42-320-topo.png'), (0, 0, 320 * ESCALA, 560), '320 px, nome comprido', 'topo do Início', largura_minima=320 * ESCALA)
janela = painel(abrir('40-janela-aberta.png'), (0, 0, LARGURA, 800), 'Ao tocar no ícone do topo', 'abre o "Como foi hoje?" como antes')
fileiras([[estreita_perfil, estreita_topo], [janela]]).save(os.path.join(destino, 'icone-variacoes.png'), optimize=True)
print('montagens gravadas em', destino)
