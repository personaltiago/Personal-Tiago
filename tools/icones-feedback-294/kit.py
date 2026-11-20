"""Ferramentas de desenho dos ícones do feedback (1.12.294): formas simples, operações booleanas (skia-pathops) e saída em SVG.
Tudo em uma grade de 24×24 (y para baixo), a mesma do balão do 1.12.292."""
import math
from pathops import Path, PathOp, op, LineCap, LineJoin
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.svgLib.path import parse_path

K = 0.5522847498307936


def from_svg(d):
    p = Path()
    parse_path(d, p.getPen())
    return p


def rrect(x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    k = r * K
    p = Path()
    p.moveTo(x + r, y)
    p.lineTo(x + w - r, y); p.cubicTo(x + w - r + k, y, x + w, y + r - k, x + w, y + r)
    p.lineTo(x + w, y + h - r); p.cubicTo(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h)
    p.lineTo(x + r, y + h); p.cubicTo(x + r - k, y + h, x, y + h - r + k, x, y + h - r)
    p.lineTo(x, y + r); p.cubicTo(x, y + r - k, x + r - k, y, x + r, y)
    p.close()
    return p


def ellipse(cx, cy, rx, ry):
    kx, ky = rx * K, ry * K
    p = Path()
    p.moveTo(cx + rx, cy)
    p.cubicTo(cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry)
    p.cubicTo(cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy)
    p.cubicTo(cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry)
    p.cubicTo(cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy)
    p.close()
    return p


def circle(cx, cy, r):
    return ellipse(cx, cy, r, r)


def rpoly(pts, r=0.0, radii=None):
    """Polígono com cantos arredondados por curva quadrática; r é a distância de corte em cada aresta."""
    n = len(pts)
    p = Path()
    first = True
    for i in range(n):
        a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
        ri = radii[i] if radii else r
        if ri <= 0:
            (p.moveTo if first else p.lineTo)(*b)
            first = False
            continue
        ba, bc = (a[0] - b[0], a[1] - b[1]), (c[0] - b[0], c[1] - b[1])
        la, lc = math.hypot(*ba), math.hypot(*bc)
        d = min(ri, la / 2, lc / 2)
        p1 = (b[0] + ba[0] / la * d, b[1] + ba[1] / la * d)
        p2 = (b[0] + bc[0] / lc * d, b[1] + bc[1] / lc * d)
        (p.moveTo if first else p.lineTo)(*p1)
        first = False
        p.quadTo(b[0], b[1], p2[0], p2[1])
    p.close()
    return p


def arc(cx, cy, R, a0, a1):
    """Arco aberto (ângulos em graus, 0 = direita, crescendo para baixo), em cúbicas de no máximo 60°."""
    p = Path()
    steps = max(1, int(math.ceil(abs(a1 - a0) / 60.0)))
    da = (a1 - a0) / steps
    t = 4.0 / 3.0 * math.tan(math.radians(da) / 4.0)
    for i in range(steps):
        s, e = math.radians(a0 + da * i), math.radians(a0 + da * (i + 1))
        p0 = (cx + R * math.cos(s), cy + R * math.sin(s))
        p3 = (cx + R * math.cos(e), cy + R * math.sin(e))
        p1 = (p0[0] - t * R * math.sin(s), p0[1] + t * R * math.cos(s))
        p2 = (p3[0] + t * R * math.sin(e), p3[1] - t * R * math.cos(e))
        if i == 0:
            p.moveTo(*p0)
        p.cubicTo(*p1, *p2, *p3)
    return p


def stroke(path, width, cap=LineCap.ROUND_CAP, join=LineJoin.ROUND_JOIN):
    """Transforma um traço aberto no contorno da região coberta por ele."""
    q = Path()
    q.addPath(path)
    q.stroke(width, cap, join, 4)
    q.convertConicsToQuads(0.02)
    return simplify(q)


def line(pts, width, cap=LineCap.ROUND_CAP, join=LineJoin.ROUND_JOIN):
    p = Path()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    return stroke(p, width, cap, join)


def simplify(p):
    q = Path()
    q.addPath(p)
    q.simplify(fix_winding=True)
    return q


def U(*ps):
    out = ps[0]
    for q in ps[1:]:
        out = op(out, q, PathOp.UNION)
    return out


def D(a, *bs):
    out = a
    for q in bs:
        out = op(out, q, PathOp.DIFFERENCE)
    return out


def I(a, b):
    return op(a, b, PathOp.INTERSECTION)


def grow(path, amount):
    """Região do traço engrossada em `amount` para todos os lados (usada para abrir uma folga em volta de uma peça)."""
    q = Path()
    q.addPath(path)
    q.stroke(2 * amount, LineCap.ROUND_CAP, LineJoin.ROUND_JOIN, 4)
    q.convertConicsToQuads(0.02)
    return U(path, simplify(q))


def move(path, dx=0.0, dy=0.0):
    return path.transform(1, 0, 0, 1, dx, dy)


def scale(path, sx, sy=None, cx=0.0, cy=0.0):
    sy = sx if sy is None else sy
    return path.transform(sx, 0, 0, sy, cx - sx * cx, cy - sy * cy)


def rotate(path, deg, cx=0.0, cy=0.0):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return path.transform(c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy)


def flip_y(path, cy):
    return simplify(path.transform(1, 0, 0, -1, 0, 2 * cy))


def star(cx, cy, R, r, n=5, rot=-90.0, tip=0.0, valley=0.0):
    pts = []
    for i in range(2 * n):
        a = math.radians(rot + i * 180.0 / n)
        rr = R if i % 2 == 0 else r
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    radii = [tip if i % 2 == 0 else valley for i in range(2 * n)]
    return rpoly(pts, radii=radii)


def svg_d(p, nd=2):
    fmt = lambda v: (('%.*f' % (nd, v)).rstrip('0').rstrip('.') or '0') if abs(v) > 5e-3 else '0'
    pen = SVGPathPen(None, ntos=fmt)
    p.draw(pen)
    return pen.getCommands()


def bounds(p):
    return p.bounds


def area(p):
    return abs(p.area)
