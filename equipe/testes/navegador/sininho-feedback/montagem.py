"""Monta duas imagens com as capturas de capturas.js (antes/depois e variações), para olhar a olho.
Uso: python3 montagem.py <pasta-das-capturas> <pasta-de-saida>
Só junta e legenda; nada aqui confere o comportamento. Cada captura tem um .json ao lado com a posição do topo da tela,
e é ele que decide o recorte da faixa do nome e dos ícones (nenhum número de recorte é chutado)."""
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
    """A faixa do nome e dos ícones de uma captura (do alto do topo até o fim da linha mais baixa), na largura pedida."""
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


# ---- 1) antes e depois: o topo do aluno com a barra do feedback logo abaixo (390 px de largura, 2x) ----
topo = (0, 0, LARGURA, 660)
antes = painel(abrir('01-antes-1.12.291.png'), topo, 'Hoje (1.12.291)', 'só o aviso vermelho embaixo')
depois = painel(abrir('02-depois-1-pendente.png'), topo, 'Com o sino (1.12.292)', '1 pendente: o balão aparece no topo')
fileiras([[antes, depois]]).save(os.path.join(destino, 'sino-antes-depois.png'), optimize=True)

# ---- 2) variações ----
claro = painel(abrir('04b-depois-claro.png'), topo, 'Modo claro', '2 pendentes')
tres = painel(abrir('03-depois-3-pendentes.png'), topo, 'Três pendentes', 'o número acompanha: 1, 2, 3…')
estreita = painel(abrir('05-depois-320-nome-longo-escuro.png'), (0, 0, 320 * ESCALA, 600), 'Tela estreita (320 px), nome longo', 'os ícones descem; o nome não é cortado', largura_minima=LARGURA)
janela = painel(abrir('07-janela-aberta.png'), (0, 0, LARGURA, 800), 'Ao tocar no sino', 'abre direto o "Como foi hoje?"')

# as seis cores de destaque, em duas fileiras de três, ocupando a largura toda
cores = [('rosa', 'rosa'), ('azul', 'azul'), ('roxo', 'roxo'), ('verde', 'verde'), ('preto', 'preto'), ('limao', 'cor livre: limão')]
total = 2 * LARGURA + ESPACO
lado = (total - 2 * ESPACO) // 3
tiras = []
for arquivo, nome in cores:
    faixa = faixa_do_topo('06-cor-' + arquivo + '.png', lado)
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
d.text((18, 10), 'Cor de destaque do aluno', font=fonte(NEGRITO, 28), fill=TEXTO)
d.text((18, 44), 'o balão e o número seguem a cor escolhida', font=fonte(NORMAL, 22), fill=SUAVE)
cores_painel = Image.new('RGB', (total, 74 + quadro.height), FUNDO)
cores_painel.paste(cabecalho, (0, 0))
cores_painel.paste(quadro, (0, 74))

fileiras([[claro, tres], [estreita, janela], [cores_painel]]).save(os.path.join(destino, 'sino-variacoes.png'), optimize=True)
print('montagens gravadas em', destino)
