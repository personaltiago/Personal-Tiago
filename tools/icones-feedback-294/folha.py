"""Folha de conferência dos ícones: HTML com cada ícone grande e no tamanho real (27 px) em várias cores, no escuro e no claro.
Uso: python3 -I folha.py icones.json saida.html"""
import json, sys, html

def svg(d, size, color):
    return ('<svg viewBox="0 0 24 24" width="%d" height="%d" style="color:%s;fill:currentColor"><path fill-rule="evenodd" d="%s"/></svg>' % (size, size, color, html.escape(d)))

def main(src, out, only=None, big=120):
    icons = json.load(open(src, encoding='utf8'))
    if only:
        icons = [x for x in icons if x['id'] in only]
    cores = [('#f52283', 'rosa'), ('#2f9bff', 'azul'), ('#ff4d4d', 'vermelho'), ('#34d399', 'verde'), ('#a855f7', 'roxo'), ('#d4f03a', 'lima')]
    h = ['<!doctype html><meta charset=utf-8><style>body{margin:0;background:#06111a;color:#cfd8e3;font:12px Arial}h2{margin:14px 16px 6px;font-size:13px}',
         '.g{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:8px 16px}.c{background:#0a1b27;border:1px solid #1d3342;border-radius:10px;padding:10px 4px;text-align:center}',
         '.c svg{display:block;margin:0 auto 6px}.row{display:flex;gap:6px;padding:2px 16px;align-items:center;flex-wrap:nowrap}.row b{width:60px;font-weight:400;font-size:10px}',
         '.b{width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex:none}.l{background:#fff;padding:6px 0}.l .row b{color:#444}</style>']
    h.append('<h2>Grande (caixa 24×24, pontilhado = área viva 2–22)</h2><div class=g>')
    for x in icons:
        pic = svg(x['d'], big, '#f52283')
        h.append('<div class=c><div style="position:relative;width:%dpx;margin:0 auto">%s<div style="position:absolute;inset:%dpx;border:1px dashed #28485c;pointer-events:none"></div></div><div>%s</div></div>' % (big, pic, big // 12, html.escape(x['nome'])))
    h.append('</div><h2>Tamanho real: 27 px dentro de botão 44×44, escuro</h2>')
    for cor, nome in cores:
        h.append('<div class=row><b>%s</b>%s</div>' % (nome, ''.join('<div class=b>%s</div>' % svg(x['d'], 27, cor) for x in icons)))
    h.append('<div class=l><h2 style="color:#333">Tamanho real, tema claro</h2>')
    for cor, nome in (('#c2185b', 'rosa'), ('#1565c0', 'azul'), ('#2e7d32', 'verde')):
        h.append('<div class=row><b>%s</b>%s</div>' % (nome, ''.join('<div class=b>%s</div>' % svg(x['d'], 27, cor) for x in icons)))
    h.append('</div>')
    open(out, 'w', encoding='utf8').write(''.join(h))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3].split(',') if len(sys.argv) > 3 and sys.argv[3] else None, int(sys.argv[4]) if len(sys.argv) > 4 else 120)
