"""Exporta los assets del escenario y del michi a juego/public/game/ en versión liviana.

- El plano de la estación ya no se exporta: el juego lo genera como SVG (juego/src/core/stationArt.ts).
- Props (interactivos, decoración, cascarón): @2x → 1,25× del tamaño 1x (PNG con alfa).
- Michi: tiras @2x de la variante elegida (se cargan solo las del tripulante en juego).

Uso: python3 herramientas/exportar_juego.py   (desde la raíz de JuegoNASA)
"""
from pathlib import Path
import shutil

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ESC = ROOT / 'escenario'
OUT = ROOT / 'juego' / 'public' / 'game'
PROP_SCALE = 1.25 / 2  # @2x → 1,25×
VARIANTS = ['miu', 'tomas', 'luna', 'zib']
HELMETS = ['sin-casco', 'casco']
ANIMS = ['idle', 'blink', 'walk', 'use', 'hurt', 'smile']


def main() -> None:
    (OUT / 'props').mkdir(parents=True, exist_ok=True)
    for group in ['interactivos', 'decoracion', 'cascaron']:
        for src in sorted((ESC / 'assets' / group / 'png').glob('*@2x.png')):
            img = Image.open(src).convert('RGBA')
            size = (round(img.width * PROP_SCALE), round(img.height * PROP_SCALE))
            img.resize(size, Image.LANCZOS).save(OUT / 'props' / src.name.replace('@2x', ''), optimize=True)

    sheets = ROOT / 'assets' / 'personajes' / 'michi-papel' / 'animaciones' / 'spritesheets'
    for v in VARIANTS:
        for h in HELMETS:
            dst = OUT / 'michi' / v / h
            dst.mkdir(parents=True, exist_ok=True)
            for a in ANIMS:
                shutil.copyfile(sheets / v / h / f'michi-{v}-{h}-{a}@2x.png', dst / f'{a}.png')

    total = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
    print(f'Assets exportados en {OUT} ({total / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
