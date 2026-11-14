import json, os, sys, shutil
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from playwright.sync_api import sync_playwright
import michi_rig as R

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'personajes', 'michi')
shutil.rmtree(OUT, ignore_errors=True)
SCALE = 2
BG = (24, 20, 78)  # space-800 para los GIF


def mk(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()  # requiere: pip install playwright pillow && playwright install chromium
        pg = b.new_page(viewport={'width': R.FRAME * SCALE, 'height': R.FRAME * SCALE})

        def raster(svg: str, path: str):
            pg.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
            pg.locator('svg').screenshot(path=mk(path), omit_background=True)

        base = R.VARIANTS['miu']
        neutral = R.Pose()

        # 1) capas separadas (pose neutral, mismo lienzo para alinear)
        for name, pivot, recolor in R.LAYER_ORDER:
            svg = R.frame_svg(neutral, base, uid=name, only=name, size=R.FRAME * SCALE)
            open(mk(f'{OUT}/capas/svg/{name}.svg'), 'w').write(R.frame_svg(neutral, base, uid=name, only=name))
            raster(svg, f'{OUT}/capas/png/{name}@2x.png')

        rig = {
            'personaje': 'michi-astronauta',
            'frame': {'width': R.FRAME, 'height': R.FRAME, 'origen': {'x': 64, 'y': 88}, 'escala': 1.1, 'mira': 'derecha (voltear para izquierda)'},
            'pies': {'x': 64, 'y': 121},
            'capas': [{'orden': i, 'nombre': n, 'pivote_local': {'x': pv[0], 'y': pv[1]},
                       'pivote_frame': {'x': round(64 + pv[0] * 1.1, 1), 'y': round(88 + pv[1] * 1.1, 1)},
                       'recoloreable': rc, 'grupo': 'cabeza' if n in R.HEAD else 'torso' if n in R.UPPER else 'base'}
                      for i, (n, pv, rc) in enumerate(R.LAYER_ORDER)],
            'colores_recoloreables': {'fur': 'pelaje (cola, orejas, cara)', 'furDark': 'pelaje oscuro (rayas)', 'accent': 'franja del traje y luz de mochila'},
            'variantes': R.VARIANTS,
        }
        open(mk(f'{OUT}/capas/rig.json'), 'w').write(json.dumps(rig, ensure_ascii=False, indent=2))

        # 2) personaje completo + animaciones por variante
        anim_meta = {}
        for vid, v in R.VARIANTS.items():
            open(mk(f'{OUT}/variantes/michi-{vid}.svg'), 'w').write(R.frame_svg(neutral, v, uid=vid))
            raster(R.frame_svg(neutral, v, uid=vid, size=R.FRAME * SCALE), f'{OUT}/variantes/michi-{vid}@2x.png')

            for anim, (fn, fps, loop) in R.ANIMS.items():
                poses = fn()
                frames2x = []
                for i, pose in enumerate(poses):
                    tmp = f'/tmp/michi/{vid}-{anim}-{i:02d}.png'
                    raster(R.frame_svg(pose, v, uid=f'{vid}{anim}{i}', size=R.FRAME * SCALE), tmp)
                    frames2x.append(Image.open(tmp).convert('RGBA'))
                frames1x = [f.resize((R.FRAME, R.FRAME), Image.LANCZOS) for f in frames2x]

                for scale_tag, frames, size in (('', frames1x, R.FRAME), ('@2x', frames2x, R.FRAME * SCALE)):
                    sheet = Image.new('RGBA', (size * len(frames), size), (0, 0, 0, 0))
                    for i, f in enumerate(frames):
                        sheet.paste(f, (i * size, 0))
                    sheet.save(mk(f'{OUT}/animaciones/spritesheets/{vid}/michi-{vid}-{anim}{scale_tag}.png'), optimize=True)

                if vid == 'miu':
                    for i, f in enumerate(frames1x):
                        f.save(mk(f'{OUT}/animaciones/frames/{anim}/michi-miu-{anim}-{i:02d}.png'), optimize=True)
                    # GIF de vista previa sobre space-800 (los GIF no tienen alfa real)
                    gif = []
                    for f in frames2x:
                        bgimg = Image.new('RGBA', f.size, BG + (255,))
                        bgimg.alpha_composite(f)
                        gif.append(bgimg.convert('P', palette=Image.ADAPTIVE, colors=128))
                    gif[0].save(mk(f'{OUT}/animaciones/gif/michi-miu-{anim}.gif'), save_all=True, append_images=gif[1:],
                                duration=int(1000 / fps), loop=0 if loop else 0, disposal=2)
                anim_meta[anim] = {'frames': len(poses), 'fps': fps, 'loop': loop}

        meta = {
            'frameWidth': R.FRAME, 'frameHeight': R.FRAME,
            'frameWidth@2x': R.FRAME * SCALE, 'frameHeight@2x': R.FRAME * SCALE,
            'animaciones': anim_meta,
            'archivos': 'animaciones/spritesheets/<variante>/michi-<variante>-<anim>[@2x].png (tira horizontal)',
            'variantes': list(R.VARIANTS),
        }
        open(mk(f'{OUT}/animaciones/animaciones.json'), 'w').write(json.dumps(meta, ensure_ascii=False, indent=2))
        b.close()


if __name__ == '__main__':
    os.makedirs('/tmp/michi', exist_ok=True)
    main()
    n = sum(len(fs) for _, _, fs in os.walk(OUT))
    print('archivos:', n)
