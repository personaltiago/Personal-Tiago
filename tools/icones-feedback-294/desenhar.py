"""Desenha os 19 ícones do feedback (1.12.294) como vetores sólidos de uma cor só (preenchimento = a cor de destaque do aluno).
Mesma linguagem do balão do 1.12.292: grade 24×24, silhueta cheia, detalhes vazados de verdade (não pintados), cantos arredondados.
Uso: python3 -I desenhar.py [saida.json]   (gera também a folha de conferência em HTML quando pedido com --folha pasta)"""
import json, sys, hashlib, math
sys.path.insert(0, __file__.rsplit('/', 1)[0] if '/' in __file__ else '.')
from kit import *

# O desenho do 1.12.292, igual byte a byte (o padrão não muda).
ICON292 = ('M5.5 3h13A3.5 3.5 0 0 1 22 6.5v8a3.5 3.5 0 0 1-3.5 3.5h-8l-4.1 3.5Q5.5 22.2 5.5 21v-3A3.5 3.5 0 0 1 2 14.5v-8A3.5 3.5 0 0 1 5.5 3z'
           'M7.4 7.6h9.2a.9.9 0 0 1 0 1.8H7.4a.9.9 0 0 1 0-1.8z'
           'M7.4 11.5h5.2a.9.9 0 0 1 0 1.8H7.4a.9.9 0 0 1 0-1.8z')
BODY292 = from_svg(ICON292.split('M7.4')[0])          # só a silhueta do balão (sem as duas linhas)


def rb():
    """Balão retangular: o do 1.12.292."""
    return BODY292


def sb():
    """Balão arredondado (quase redondo), com o mesmo rabinho embaixo à esquerda."""
    body = rrect(2.4, 2.4, 19.2, 17.6, 8.8)
    tail = rpoly([(5.2, 14.4), (5.2, 21.4), (12.2, 19.0)], radii=[0, 1.0, 0])
    return U(body, tail)


def dots(cx, cy, dx, r, n=3):
    return U(*[circle(cx + (i - (n - 1) / 2) * dx, cy, r) for i in range(n)])


def heart(cx, cy, w):
    s = w / 9.6
    pts = [('M', 0, -0.9), ('C', 0, -3.3, -4.8, -4.1, -4.8, -0.7), ('C', -4.8, 1.9, -1.9, 3.2, 0, 4.6),
           ('C', 1.9, 3.2, 4.8, 1.9, 4.8, -0.7), ('C', 4.8, -4.1, 0, -3.3, 0, -0.9)]
    p = Path()
    for c in pts:
        if c[0] == 'M':
            p.moveTo(cx + c[1] * s, cy + c[2] * s)
        else:
            p.cubicTo(cx + c[1] * s, cy + c[2] * s, cx + c[3] * s, cy + c[4] * s, cx + c[5] * s, cy + c[6] * s)
    p.close()
    return p


def thumb_up():
    """Joinha em uma caixa de 10×10 (origem no canto de cima à esquerda): manga à esquerda, punho e o polegar inclinado para a direita."""
    cuff = rrect(0, 4.2, 2.5, 5.8, 0.7)
    pts = [(5.5, 0.0), (7.5, 0.5), (6.9, 3.5), (9.4, 3.5), (10.0, 4.1), (10.0, 9.2), (9.2, 10.0), (3.4, 10.0), (3.4, 4.7), (4.3, 3.9)]
    rad = [1.1, 1.1, 0.9, 0.9, 0.7, 0.6, 1.0, 0.8, 0.6, 0.9]
    return U(cuff, rpoly(pts, radii=rad))


def place(path, cx, cy, size, native=10.0):
    """Leva uma peça desenhada em uma caixa de native×native para o centro (cx, cy) com `size` de lado."""
    s = size / native
    return move(scale(path, s, s, 0, 0), cx - size / 2, cy - size / 2)


def comma(cx, cy, r=1.9):
    ball = circle(cx, cy, r)
    tail = rpoly([(cx + r, cy - 0.1), (cx + r, cy + 1.1), (cx + 0.7, cy + 3.7), (cx - 1.3, cy + 4.6), (cx - 1.6, cy + 3.6), (cx - 0.2, cy + 2.3), (cx - r, cy + 1.0)],
                 radii=[0, 0.4, 0.7, 0.5, 0.4, 0.5, 0])
    return U(ball, tail)


def smile(cx, cy, R, sweep, w):
    """Boca sorridente (concavidade para cima): arco da parte de baixo de um círculo de raio R centrado em (cx, cy)."""
    return stroke(arc(cx, cy, R, 90 - sweep, 90 + sweep), w)


def frown(cx, cy, R, sweep, w):
    return stroke(arc(cx, cy, R, 270 - sweep, 270 + sweep), w)


def pencil(length=12.0, width=3.8, tip=3.6):
    """Lápis na horizontal, ponta à direita, com uma fenda entre a borracha e o corpo."""
    body = rpoly([(0, 0), (length - tip, 0), (length, width / 2), (length - tip, width), (0, width)], radii=[1.0, 0.2, 0.5, 0.2, 1.0])
    cut = rrect(1.9, -0.5, 0.8, width + 1.0, 0)
    return D(body, cut)


def check(pts, w=1.9):
    return line(pts, w)


# ---------------------------------------------------------------- os 19
def g_padrao():
    return None                                     # usa ICON292 como está


def g_balao():
    return D(rb(), dots(12, 10.5, 4.5, 1.35))


def g_balao_estrela():
    return D(sb(), star(12, 11.2, 5.9, 2.5, tip=0.5, valley=0.15))


def g_conversa():
    """Duas conversas: a de trás em cima, à esquerda, e a da frente embaixo, à direita, com a ponta do balão para baixo e à direita. O canto
    de cima à direita (onde o número de pendentes cobre o ícone) fica livre; com a de trás nesse canto, o número tapava os três pontinhos."""
    back = rrect(8.6, 2.2, 13.4, 9.6, 3)
    front = rrect(2, 9.2, 13.8, 9.6, 3)
    front = U(front, rpoly([(5.0, 17.4), (5.0, 21.6), (9.4, 18.2)], radii=[0, 0.8, 0]))
    back = D(back, grow(front, 1.3))
    back = D(back, dots(15.3, 7.0, 3.0, 0.95))
    front = D(front, dots(8.9, 14.0, 3.0, 0.95))
    return scale(U(back, front), -1, 1, 12, 12)


def g_prancheta():
    board = U(rrect(3, 4.2, 14.2, 17.4, 2.6), rrect(6.2, 2.0, 7.8, 4.4, 1.5))
    cut = U(circle(10.1, 3.7, 0.95),
            check([(5.7, 9.4), (6.8, 10.5), (8.9, 8.0)], 1.4), line([(10.8, 9.3), (14.8, 9.3)], 1.4),
            check([(5.7, 13.2), (6.8, 14.3), (8.9, 11.8)], 1.4), line([(10.8, 13.1), (12.8, 13.1)], 1.4))
    mini = U(rrect(11.6, 15.2, 10.4, 7.0, 2.6), rpoly([(19.4, 21.4), (19.4, 23.4), (16.6, 21.6)], radii=[0, 0.6, 0]))
    board = D(board, cut, grow(mini, 1.2))
    mini = D(mini, dots(16.8, 18.6, 2.6, 0.8))
    return U(board, mini)


def g_carinha():
    return D(sb(), U(circle(9.3, 9.4, 1.2), circle(14.7, 9.4, 1.2), smile(12, 9.8, 4.7, 55, 1.7)))


def g_joinha():
    return D(sb(), place(thumb_up(), 12, 11.3, 10.6))


def g_tres_estrelas():
    return D(rb(), U(*[star(cx, 10.8, 2.7, 1.15, tip=0.25, valley=0.08) for cx in (6.5, 12, 17.5)]))


def g_anotacao():
    doc = rrect(2.5, 3.2, 15.2, 18, 2.6)
    cut = U(line([(5.6, 9.2), (11.4, 9.2)], 1.6), line([(5.6, 13.0), (12.6, 13.0)], 1.6), line([(5.6, 16.8), (10.0, 16.8)], 1.6))
    doc = D(doc, cut)
    pen = move(rotate(pencil(13.0, 3.6), -45, 0, 0), 11.2, 14.2)
    return U(D(doc, grow(pen, 1.3)), pen)


def g_coracao():
    return D(sb(), heart(12, 11.2, 9.8))


def g_gostei():
    a = U(rrect(2, 2, 13, 10.2, 3), rpoly([(4.8, 11.4), (4.8, 15.0), (8.6, 11.6)], radii=[0, 0.8, 0]))
    b = U(rrect(9.8, 11.8, 12.2, 9.7, 3), rpoly([(19.2, 20.6), (19.2, 23.2), (15.6, 20.8)], radii=[0, 0.8, 0]))
    a = D(a, grow(b, 1.3), place(thumb_up(), 7.3, 6.7, 6.4))
    b = D(b, place(flip_y(thumb_up(), 5), 16.0, 16.7, 6.4))
    return U(a, b)


def g_aspas():
    return D(sb(), U(comma(9.9, 9.6), comma(14.9, 9.6)))


def g_carta_estrela():
    env = rrect(2, 5.0, 20, 14.2, 2.8)
    env = D(env, line([(3.6, 7.0), (12, 13.2), (20.4, 7.0)], 1.7))
    badge = circle(17.8, 16.8, 4.9)
    env = D(env, grow(badge, 1.3))
    badge = D(badge, star(17.8, 16.9, 2.8, 1.25, tip=0.25, valley=0.1))
    return U(env, badge)


def g_megafone():
    horn = rpoly([(6.4, 9.4), (15.6, 4.4), (15.6, 19.4), (6.4, 14.6)], radii=[1.4, 1.2, 1.2, 1.4])
    mouth = rrect(2.6, 9.0, 4.6, 6.0, 1.4)
    handle = rpoly([(6.8, 14.2), (10.6, 16.2), (11.2, 20.2), (7.6, 20.2)], radii=[0.5, 0.5, 1.2, 1.2])
    rim = rrect(14.6, 3.6, 2.8, 16.6, 1.4)
    rays = U(line([(19.6, 8.2), (22.2, 6.8)], 1.7), line([(20.0, 12.0), (23.0, 12.0)], 1.7), line([(19.6, 15.8), (22.2, 17.2)], 1.7))
    return U(horn, mouth, handle, rim, rays)


def g_estrela_visto():
    st = star(11.2, 11.4, 9.9, 4.2, tip=0.8, valley=0.3)
    badge = circle(17.5, 17.6, 5.0)
    st = D(st, grow(badge, 1.3))
    badge = D(badge, check([(15.2, 17.7), (16.9, 19.3), (19.9, 15.8)], 1.6))
    return U(st, badge)


def g_selo():
    n = 14
    lobes = [circle(12 + 7.6 * math.cos(2 * math.pi * i / n), 12 + 7.6 * math.sin(2 * math.pi * i / n), 2.45) for i in range(n)]
    seal = U(circle(12, 12, 7.6), *lobes)
    return D(seal, place(thumb_up(), 12, 12, 8.4))


def rosto(x, y, R, humor):
    """Carinha de raio R: disco com olhos e boca vazados (humor: 'triste', 'neutro' ou 'feliz'). Os detalhes crescem com R (medidas do raio 3,35)."""
    k = R / 3.35
    olhos = [circle(x - 1.25 * k, y - 0.9 * k, 0.62 * k), circle(x + 1.25 * k, y - 0.9 * k, 0.62 * k)]
    if humor == 'feliz':
        boca = smile(x, y - 0.4 * k, 1.9 * k, 60, 0.95 * k)
    elif humor == 'triste':
        boca = frown(x, y + 3.0 * k, 1.9 * k, 60, 0.95 * k)
    else:
        boca = line([(x - 1.1 * k, y + 1.45 * k), (x + 1.1 * k, y + 1.45 * k)], 0.95 * k)
    return D(circle(x, y, R), U(*olhos, boca))


def g_tres_carinhas():
    """Três carinhas (triste, neutra, feliz) em triângulo, a neutra no alto: em fila de três, cada uma ficava com 6,7 de largura e o conjunto
    com 6 de altura (muito menor que os outros ícones, que têm uns 19); em triângulo o conjunto ocupa 19 × 17 da grade, como os demais, e
    a esquerda, o meio e a direita continuam sendo triste, neutra e feliz. O canto de cima à direita fica livre para o número de pendentes."""
    return U(rosto(7.0, 16.2, 4.4, 'triste'), rosto(12.0, 7.8, 4.4, 'neutro'), rosto(17.0, 16.2, 4.4, 'feliz'))


def g_balao_visto():
    return D(sb(), check([(7.7, 11.6), (10.7, 14.4), (16.5, 8.1)], 2.0))


def g_documento_lapis():
    body = rpoly([(2.5, 2.4), (13.4, 2.4), (17.7, 6.7), (17.7, 21.4), (2.5, 21.4)], radii=[2.4, 0.6, 0.6, 2.4, 2.4])
    fold = rpoly([(13.4, 2.4), (17.7, 6.7), (13.4, 6.7)], radii=[0, 0.4, 0.6])
    cut = U(line([(5.6, 9.2), (11.8, 9.2)], 1.6), line([(5.6, 13.0), (10.8, 13.0)], 1.6), line([(5.6, 16.8), (9.2, 16.8)], 1.6))
    body = D(body, grow(fold, 1.0), cut)
    pen = move(rotate(pencil(12.0, 3.6), -45, 0, 0), 12.0, 19.2)
    return U(D(body, grow(pen, 1.3)), pen, fold)


ICONES = [
    ('padrao', 'Padrão', g_padrao), ('balao', 'Balão', g_balao), ('balao-estrela', 'Balão com estrela', g_balao_estrela),
    ('conversa', 'Conversa', g_conversa), ('prancheta', 'Prancheta', g_prancheta), ('carinha', 'Carinha feliz', g_carinha),
    ('joinha', 'Joinha', g_joinha), ('tres-estrelas', 'Três estrelas', g_tres_estrelas), ('anotacao', 'Anotação', g_anotacao),
    ('coracao', 'Coração', g_coracao), ('gostei-nao-gostei', 'Gostei e não gostei', g_gostei), ('aspas', 'Aspas', g_aspas),
    ('carta-estrela', 'Carta com estrela', g_carta_estrela), ('megafone', 'Megafone', g_megafone), ('estrela-visto', 'Estrela com visto', g_estrela_visto),
    ('selo', 'Selo aprovado', g_selo), ('tres-carinhas', 'Três carinhas', g_tres_carinhas), ('balao-visto', 'Balão com visto', g_balao_visto),
    ('documento-lapis', 'Documento e lápis', g_documento_lapis),
]


CENTRAR = {'conversa', 'prancheta', 'anotacao', 'gostei-nao-gostei', 'carta-estrela', 'megafone', 'estrela-visto', 'selo', 'tres-carinhas', 'documento-lapis'}


def ajustar(p, lado=20.6):
    """Encolhe (nunca amplia) para caber em `lado` e centraliza a caixa da peça em (12, 12)."""
    x0, y0, x1, y1 = p.bounds
    f = min(1.0, lado / max(x1 - x0, y1 - y0))
    q = scale(p, f, f, (x0 + x1) / 2, (y0 + y1) / 2) if f < 1 else p
    x0, y0, x1, y1 = q.bounds
    return move(q, 12 - (x0 + x1) / 2, 12 - (y0 + y1) / 2)


def build():
    out = []
    for id_, nome, fn in ICONES:
        p = fn()
        if p is not None and id_ in CENTRAR:
            p = ajustar(p)
        d = ICON292 if p is None else svg_d(p)
        pp = from_svg(d)
        out.append({'id': id_, 'nome': nome, 'd': d, 'sha256': hashlib.sha256(d.encode('utf8')).hexdigest(),
                    'caixa': [round(v, 2) for v in pp.bounds], 'contornos': len(list(pp.contours))})
    return out


def validar(icones):
    """Confere o que o olho não pega: caixa dentro da área segura, nenhum contorno minúsculo (ilha ou furo), só comandos de caminho."""
    import re
    erros = []
    for x in icones:
        x0, y0, x1, y1 = x['caixa']
        if x0 < 1.5 or y0 < 1.5 or x1 > 22.5 or y1 > 22.5:
            erros.append('%s: fora da área segura %s' % (x['id'], x['caixa']))
        if not re.fullmatch(r'[MmLlHhVvCcSsQqTtAaZz0-9 .,\-]+', x['d']):
            erros.append('%s: caracteres inesperados no caminho' % x['id'])
        for c in from_svg(x['d']).contours:
            if abs(c.area) < 0.5:
                erros.append('%s: contorno minúsculo (área %.2f)' % (x['id'], abs(c.area)))
    return erros


if __name__ == '__main__':
    data = build()
    erros = validar(data)
    for x in data:
        print('%-18s caixa=%s contornos=%d bytes=%d' % (x['id'], x['caixa'], x['contornos'], len(x['d'])))
    if erros:
        print('\n'.join('ERRO ' + e for e in erros))
        sys.exit(1)
    if len(sys.argv) > 1:
        manifesto = {'grade': 24, 'origem': 'Desenhados do zero em tools/icones-feedback-294/desenhar.py (silhuetas sólidas de uma cor, detalhes vazados), no estilo do balão do 1.12.292.',
                     'icones': [{k: v for k, v in x.items() if k in ('id', 'nome', 'd', 'sha256')} for x in data]}
        open(sys.argv[1], 'w', encoding='utf8').write(json.dumps(manifesto, ensure_ascii=False, indent=1) + '\n')
        print('escrito', sys.argv[1], len(manifesto['icones']), 'ícones')
