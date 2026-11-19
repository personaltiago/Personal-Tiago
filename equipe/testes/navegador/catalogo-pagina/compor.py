# Montagem das imagens de evidência (Pillow). Não faz parte do app nem do pacote.
from PIL import Image, ImageDraw, ImageFont
import os, sys

SAIDA = os.environ.get('SAIDA', 'saida')

FD = '/usr/share/fonts/opentype/inter/'
def F(peso, tam):
    return ImageFont.truetype(FD + {'r': 'Inter-Regular.otf', 'm': 'Inter-Medium.otf', 's': 'Inter-SemiBold.otf', 'b': 'Inter-Bold.otf'}[peso], tam)

BG = (236, 236, 241)        # mesmo fundo frio das imagens anteriores
TXT = (24, 24, 32)
SUB = (88, 88, 100)
RED = (176, 32, 64)
GRN = (14, 122, 84)
LINE = (190, 190, 202)

def painel(path, escala):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    return im.resize((round(w * escala), round(h * escala)), Image.LANCZOS)

def texto_quebrado(d, xy, txt, fonte, cor, largura, entrelinha=1.35):
    palavras = txt.split(' ')
    linhas, atual = [], ''
    for p in palavras:
        t = (atual + ' ' + p).strip()
        if d.textlength(t, font=fonte) <= largura:
            atual = t
        else:
            linhas.append(atual); atual = p
    linhas.append(atual)
    x, y = xy
    for l in linhas:
        d.text((x, y), l, font=fonte, fill=cor)
        y += round(fonte.size * entrelinha)
    return y

def antes_depois(saida):
    esc = 0.56
    pn = [painel(f'{SAIDA}/cap/antes-1-aberto.png', esc), painel(f'{SAIDA}/cap/antes-2-arrastou.png', esc), painel(f'{SAIDA}/cap/depois-2-arrastou.png', esc)]
    pw, ph = pn[0].size
    M, G = 44, 44
    W = M * 2 + pw * 3 + G * 2
    topo = 168          # título + subtítulo
    rot = 78            # rótulo ANTES/DEPOIS
    leg = 150           # legenda sob cada painel
    rod = 74
    H = topo + rot + ph + leg + rod
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((M, 34), 'Catálogo de exercícios · antes e depois', font=F('b', 40), fill=TXT)
    d.text((M, 92), 'Mesmo gesto do seu vídeo: dedo no título, arrastando para baixo. Tema Atual, modo escuro.', font=F('r', 25), fill=SUB)
    rotulos = [('ANTES · 1.12.286', 'aberto', RED), ('ANTES · 1.12.286', 'depois de arrastar o dedo', RED), ('DEPOIS · 1.12.287', 'depois de arrastar o dedo', GRN)]
    legendas = [
        'Abre como um cartão por cima. A faixa escura no topo é a página de trás.',
        'A página de trás mexeu junto: apareceu “Pendências de hoje” na faixa (foi de 354 para 219 px).',
        'Abre como página inteira, sem faixa nenhuma. A página de trás nem se mexe: continua em 354 px.',
    ]
    for i, p in enumerate(pn):
        x = M + i * (pw + G)
        y = topo + rot
        d.text((x, topo - 2), rotulos[i][0], font=F('s', 27), fill=rotulos[i][2])
        d.text((x, topo + 30), rotulos[i][1], font=F('r', 22), fill=SUB)
        im.paste(p, (x, y))
        d.rectangle([x - 1, y - 1, x + pw, y + ph], outline=LINE, width=2)
        if i < 2:   # contorno na faixa da página de trás (topo) — fica fora do conteúdo
            fx = round(32 * esc)
            d.rectangle([x, y, x + pw - 1, y + fx], outline=RED, width=2)
        texto_quebrado(d, (x, y + ph + 20), legendas[i], F('r', 22), TXT, pw)
    d.text((M, H - 52), 'Simulação no Chrome (tela de 390×844 px) com toque real. Não é foto do celular.', font=F('r', 22), fill=SUB)
    im.save(saida, optimize=True)
    print(saida, im.size)


TEMAS = [('current', 'Atual'), ('neon', 'Roxo Neon TL'), ('metal', 'Metal 3D TL'), ('pro', 'Performance Pro'), ('deep', 'Roxo Profundo 3D')]

def cinco_temas(saida):
    esc = 0.34
    corte = 940                        # topo da tela (2x): título, busca e filtros, sem cortar texto no meio
    M, G = 40, 22
    pw, ph = round(780 * esc), round(corte * esc)
    W = M * 2 + pw * 5 + G * 4
    topo = 150
    bloco = 54 + ph + 40 + 26          # cabeçalho do modo + painel + nome do tema + respiro
    H = topo + bloco * 2 + 62
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((M, 30), 'Catálogo de exercícios aberto nos 5 temas', font=F('b', 38), fill=TXT)
    d.text((M, 84), 'Página inteira, de borda a borda, em modo escuro e claro. Cada tema mantém as próprias cores.', font=F('r', 24), fill=SUB)
    for r, (modo, rotulo) in enumerate([('dark', 'MODO ESCURO'), ('light', 'MODO CLARO')]):
        y0 = topo + r * bloco
        d.text((M, y0), rotulo, font=F('s', 24), fill=TXT)
        for i, (chave, nome) in enumerate(TEMAS):
            x = M + i * (pw + G)
            y = y0 + 44
            p = Image.open(f'{SAIDA}/pg/final-{chave}-{modo}-topo.png').convert('RGB').crop((0, 0, 780, corte))
            p = p.resize((pw, ph), Image.LANCZOS)
            im.paste(p, (x, y))
            d.rectangle([x - 1, y - 1, x + pw, y + ph], outline=LINE, width=2)
            d.text((x, y + ph + 12), nome, font=F('m', 21), fill=TXT)
    d.text((M, H - 46), 'Simulação no Chrome (tela de 390×844 px). Não é foto do celular. Recorte do topo da tela.', font=F('r', 21), fill=SUB)
    im.save(saida, optimize=True)
    print(saida, im.size)

if __name__ == '__main__':
    antes_depois(f'{SAIDA}/catalogo-antes-depois.png')
    cinco_temas(f'{SAIDA}/catalogo-5-temas.png')
