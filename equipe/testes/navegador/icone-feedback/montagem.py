"""Monta imagens com as capturas de capturas.js (ícone do feedback, 1.12.293), para olhar a olho.
Uso: python3 montagem.py <pasta-das-capturas> <pasta-de-saida>
Só junta e legenda; nada aqui confere o comportamento (quem confere é funcional.js). As capturas do Início têm um .json ao lado com a posição
do topo da tela, e é ele que decide o recorte da faixa do nome e dos ícones (nenhum número de recorte é chutado)."""
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


def faixa_do_topo(nome, largura_final):
    """A faixa do nome e dos ícones de uma captura do Início (do alto do topo até o fim da linha mais baixa), na largura pedida."""
    m = medidas(nome)
    cima = max(0, round((m['topo']['y'] - 6) * ESCALA))
    baixo = round((max(m['acoes']['b'], m['h1']['b']) + 8) * ESCALA)
    corte = abrir(nome).crop((0, cima, m['largura'] * ESCALA, baixo))
    return corte.resize((largura_final, round(corte.height * largura_final / corte.width)), Image.LANCZOS)


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


# ---- 1) antes e depois: o topo do Início (390 px de largura, 2x), 2 pendentes ----
topo = (0, 0, LARGURA, 560)
antes = painel(abrir('01-antes-1.12.292.png'), topo, 'Hoje (1.12.292)', 'o balão simples')
depois = painel(abrir('02-depois-padrao.png'), topo, 'Novo (1.12.293)', 'o selo roxo é o padrão; a aluna pode trocar')
fileiras([[antes, depois]]).save(os.path.join(destino, 'icone-antes-depois.png'), optimize=True)

# ---- 2) o Perfil: linha fechada, painel aberto no padrão, painel com um ícone escolhido ----
cheia = (0, 0, LARGURA, ALTURA)
perfil = [
    painel(abrir('03-perfil-fechado.png'), cheia, 'Meu perfil', 'nova linha "Ícone do feedback"'),
    painel(abrir('04-perfil-aberto-padrao.png'), cheia, 'Ao tocar na linha', '19 opções; o padrão já vem marcado'),
    painel(abrir('05-perfil-aberto-escolhido.png'), cheia, 'Ícone escolhido', 'o status diz qual é; o topo muda na hora')
]
reduzidos = []
for p in perfil:
    reduzidos.append(p.resize((p.width * 6 // 10, p.height * 6 // 10), Image.LANCZOS))
fileiras([reduzidos]).save(os.path.join(destino, 'icone-perfil.png'), optimize=True)

# ---- 3) variações ----
ESCOLHAS = [('balao-estrela', 'Balão com estrela'), ('megafone', 'Megafone'), ('carinha', 'Carinha feliz'), ('coracao', 'Coração'), ('selo', 'Selo aprovado'), ('joinha', 'Joinha')]
total = 2 * LARGURA + ESPACO
lado = (total - 2 * ESPACO) // 3
tiras = []
for arquivo, nome in ESCOLHAS:
    faixa = faixa_do_topo('06-topo-' + arquivo + '.png', lado)
    folha = Image.new('RGB', (lado, faixa.height + 34), FUNDO)
    ImageDraw.Draw(folha).text((4, 4), nome, font=fonte(NORMAL, 22), fill=SUAVE)
    folha.paste(faixa, (0, 34))
    tiras.append(folha)
alto_tira = max(t.height for t in tiras)
quadro = Image.new('RGB', (total, 2 * alto_tira + ESPACO), FUNDO)
for i, tira in enumerate(tiras):
    quadro.paste(tira, ((i % 3) * (lado + ESPACO), (i // 3) * (alto_tira + ESPACO)))
cabecalho = Image.new('RGB', (total, 74), FUNDO)
d = ImageDraw.Draw(cabecalho)
d.text((18, 10), 'Algumas escolhas no topo do Início', font=fonte(NEGRITO, 28), fill=TEXTO)
d.text((18, 44), 'o número de pendentes continua no canto; o resto do topo não muda', font=fonte(NORMAL, 22), fill=SUAVE)
escolhas = Image.new('RGB', (total, 74 + quadro.height), FUNDO)
escolhas.paste(cabecalho, (0, 0))
escolhas.paste(quadro, (0, 74))

claro_perfil = painel(abrir('08-claro-perfil-aberto.png'), cheia, 'Modo claro', 'Perfil com o painel aberto')
claro_topo = painel(abrir('09-claro-topo.png'), topo, 'Modo claro', 'topo do Início (balão com estrela)', largura_minima=LARGURA)
estreita_perfil = painel(abrir('10-320-perfil-aberto.png'), (0, 0, 320 * ESCALA, 700 * ESCALA), 'Tela estreita (320 px)', 'a grade passa para 4 colunas')
estreita_topo = painel(abrir('11-320-topo.png'), (0, 0, 320 * ESCALA, 560), '320 px, nome comprido', 'topo do Início', largura_minima=320 * ESCALA)
janela = painel(abrir('07-janela-aberta.png'), (0, 0, LARGURA, 800), 'Ao tocar no ícone do topo', 'abre o "Como foi hoje?" como antes')

fileiras([[escolhas], [claro_perfil, claro_topo], [estreita_perfil, estreita_topo], [janela]]).save(os.path.join(destino, 'icone-variacoes.png'), optimize=True)
print('montagens gravadas em', destino)
