import sys, os, json
from PIL import Image, ImageDraw, ImageFont
# uso: folha.py <saida.png> <colunas> <largura-celula> <arquivo1[:rótulo]> ...
out, cols, cw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
items = sys.argv[4:]
FONT = '/usr/share/fonts/opentype/inter/Inter-Medium.otf'
try: f = ImageFont.truetype(FONT, 15)
except Exception: f = ImageFont.load_default()
cells = []
for it in items:
    p, _, lab = it.partition(':')
    im = Image.open(p).convert('RGB')
    h = int(im.height * cw / im.width)
    cells.append((im.resize((cw, h), Image.LANCZOS), lab or os.path.basename(p)))
ch = max(c[0].height for c in cells) + 30
rows = (len(cells) + cols - 1) // cols
pad = 12
W = cols * cw + (cols + 1) * pad; H = rows * ch + (rows + 1) * pad
sheet = Image.new('RGB', (W, H), (236, 236, 241))
d = ImageDraw.Draw(sheet)
for i, (im, lab) in enumerate(cells):
    x = pad + (i % cols) * (cw + pad); y = pad + (i // cols) * (ch + pad)
    sheet.paste(im, (x, y + 24)); d.text((x, y + 2), lab, fill=(40, 40, 50), font=f)
    d.rectangle([x - 1, y + 23, x + cw, y + 24 + im.height], outline=(190, 190, 200))
sheet.save(out)
print(out, sheet.size)
