"""Genera el set completo del michi estilo papel.

Salida (por defecto ../assets/personajes/michi-papel relativo a este archivo):
  capas/svg|png/<casco|sin-casco>/<capa>      capas separadas, mismo lienzo (sin borde de papel)
  capas/rig.json                               orden, pivotes y ancla de pies
  variantes/<id>/michi-<id>-<casco>.svg|@2x.png pose neutral (png con borde de papel)
  animaciones/spritesheets/<id>/<casco>/michi-<id>-<casco>-<anim>[@2x].png
  animaciones/frames/<casco>/<anim>/michi-miu-<casco>-<anim>-NN.png   (solo Miu, 1x)
  animaciones/gif/michi-miu-<casco>-<anim>.gif
  animaciones/animaciones.json

Requiere: pip install playwright pillow && playwright install chromium
"""
import json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageFilter
try:
    from playwright.sync_api import sync_playwright
except ImportError:      # sin Playwright: rasteriza con cairosvg (pip install cairosvg); el resultado es casi idéntico
    sync_playwright = None
import michi_papel as M

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'personajes', 'michi-papel')
S = 2
F2 = M.FRAME * S
BG = (42, 35, 120)
HELMETS = {'casco': True, 'sin-casco': False}


def paper(im, border=9):
    a = im.split()[-1]
    g = a.filter(ImageFilter.MaxFilter(border * 2 + 1)).filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: 255 if v > 100 else 0)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    w = Image.new('RGBA', im.size, (250, 248, 240, 255)); w.putalpha(g)
    out.alpha_composite(w); out.alpha_composite(im)
    return out


def mk(p):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    # CHROMIUM=/ruta/al/navegador reutiliza un Chromium ya instalado (p. ej. el de los tests del juego)
    launch = {'executable_path': os.environ['CHROMIUM']} if os.environ.get('CHROMIUM') else {}
    if sync_playwright is not None and os.environ.get('RENDERER') != 'cairosvg':
        ctx = sync_playwright()
        p = ctx.__enter__()
        b = p.chromium.launch(**launch)
        pg = b.new_page(viewport={'width': F2, 'height': F2})

        def raw(svg):
            pg.set_content(f'<body style="margin:0;background:transparent">{svg}</body>')
            pg.locator('svg').screenshot(path='/tmp/_michi.png', omit_background=True)
            return Image.open('/tmp/_michi.png').convert('RGBA')
    else:
        import cairosvg, io
        b = ctx = None

        def raw(svg):
            return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode('utf-8'), output_width=F2, output_height=F2))).convert('RGBA')
    if True:
        base = M.VARIANTS['miu']
        # 1) capas separadas
        for tag, hel in HELMETS.items():
            for name in M.ORDER:
                if name == 'casco' and not hel:
                    continue
                svg = M.frame_svg(M.Pose(), base, uid=f'L{tag}{name}', helmet=hel, only=name)
                open(mk(f'{OUT}/capas/svg/{tag}/{name}.svg'), 'w').write(svg)
                raw(M.frame_svg(M.Pose(), base, uid=f'L{tag}{name}', size=F2, helmet=hel, only=name)).save(mk(f'{OUT}/capas/png/{tag}/{name}@2x.png'))
        rig = {
            'estilo': 'papel recortado 2.5D', 'frame': {'w': M.FRAME, 'h': M.FRAME}, 'mira': 'derecha (voltear con scaleX para la izquierda)',
            'ancla_pies_1x': {'x': M.FEET[0], 'y': round(M.FEET[1], 1)}, 'ancla_pies_2x': {'x': M.FEET[0] * 2, 'y': round(M.FEET[1] * 2, 1)},
            'orden_capas': M.ORDER, 'nota_casco': 'El casco es una burbuja superpuesta: la cabeza y la cara son idénticas con y sin casco.',
            'borde_papel': 'Se agrega al rasterizar (blanco #faf8f0, 9 px @2x). Las capas sueltas no lo traen.',
            'sombra': 'No incluida: el motor dibuja una elipse en el piso bajo el ancla de pies.',
            'variantes': M.VARIANTS,
        }
        open(mk(f'{OUT}/capas/rig.json'), 'w').write(json.dumps(rig, ensure_ascii=False, indent=2))

        # 2) variantes + animaciones
        meta = {}
        for vid, v in M.VARIANTS.items():
            for tag, hel in HELMETS.items():
                open(mk(f'{OUT}/variantes/{vid}/michi-{vid}-{tag}.svg'), 'w').write(M.frame_svg(M.Pose(), v, uid=f'V{vid}{tag}', helmet=hel))
                paper(raw(M.frame_svg(M.Pose(), v, uid=f'V{vid}{tag}', size=F2, helmet=hel))).save(mk(f'{OUT}/variantes/{vid}/michi-{vid}-{tag}@2x.png'))
                for anim, (poses, fps, loop, desc) in M.ANIMS.items():
                    f2 = [paper(raw(M.frame_svg(ps, v, uid=f'{vid}{tag}{anim}{i}', size=F2, helmet=hel))) for i, ps in enumerate(poses)]
                    f1 = [f.resize((M.FRAME, M.FRAME), Image.LANCZOS) for f in f2]
                    for suf, frames, size in (('', f1, M.FRAME), ('@2x', f2, F2)):
                        sheet = Image.new('RGBA', (size * len(frames), size), (0, 0, 0, 0))
                        for i, f in enumerate(frames):
                            sheet.paste(f, (i * size, 0))
                        sheet.save(mk(f'{OUT}/animaciones/spritesheets/{vid}/{tag}/michi-{vid}-{tag}-{anim}{suf}.png'), optimize=True)
                    if vid == 'miu':
                        for i, f in enumerate(f1):
                            f.save(mk(f'{OUT}/animaciones/frames/{tag}/{anim}/michi-miu-{tag}-{anim}-{i:02d}.png'), optimize=True)
                        gif = []
                        seq = f2 if len(f2) > 1 else f2 * 2
                        for f in seq:
                            bg = Image.new('RGBA', f.size, BG + (255,)); bg.alpha_composite(f)
                            gif.append(bg.convert('P', palette=Image.ADAPTIVE, colors=96))
                        gif[0].save(mk(f'{OUT}/animaciones/gif/michi-miu-{tag}-{anim}.gif'), save_all=True, append_images=gif[1:],
                                    duration=int(1000 / fps), loop=0)
                    meta[anim] = {'frames': len(poses), 'fps': fps, 'loop': loop, 'descripcion': desc}
        open(mk(f'{OUT}/animaciones/animaciones.json'), 'w').write(json.dumps({
            'frameWidth': M.FRAME, 'frameHeight': M.FRAME, 'frameWidth@2x': F2, 'frameHeight@2x': F2,
            'ancla_pies_1x': {'x': M.FEET[0], 'y': round(M.FEET[1], 1)},
            'animaciones': meta, 'variantes': list(M.VARIANTS), 'cascos': list(HELMETS),
            'ruta': 'spritesheets/<variante>/<casco|sin-casco>/michi-<variante>-<casco>-<anim>[@2x].png',
        }, ensure_ascii=False, indent=2))
        if b is not None:
            b.close()
            ctx.__exit__(None, None, None)
    n = sum(len(fs) for _, _, fs in os.walk(OUT))
    print('archivos:', n, '→', OUT)


if __name__ == '__main__':
    main()
