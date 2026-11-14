# Herramientas

```bash
pip install playwright pillow
playwright install chromium
```

## Personaje oficial (estilo papel)
- `michi_papel.py`: geometría de las capas, casco-burbuja, variantes de color, expresiones (normal, parpadeo, sonrisa, daño, concentrado) y poses de las 6 animaciones.
- `render_michi_papel.py`: genera todo `assets/personajes/michi-papel/` (capas, variantes, spritesheets 1x y @2x, frames, GIF y JSON). **Borra y recrea** esa carpeta.

```bash
python herramientas/render_michi_papel.py
```

Para un animal nuevo o una animación nueva, se edita `michi_papel.py` (agregar una entrada a `VARIANTS` o a `ANIMS`) y se vuelve a correr.

## Versión 1 (obsoleta)
`michi_rig.py` y `render_michi.py` generan el michi v1 (`assets/personajes/michi/`). Se conservan solo como referencia.

## Escenario (Estación Central v2)
Primero se generan los assets por separado y después se componen los fondos:

```bash
python herramientas/render_props.py escenario/assets     # 1) cada objeto por separado (SVG + PNG @2x)
python herramientas/compose_salas.py escenario           # 2) fondo vacío + fondo compuesto + layout-salas.json
```
- `escenario_props.py`: dibujo de cada objeto (interactivos, decoración, ventana en 3 estados, puerta).
- `compose_salas.py`: cascarón de cada sala y posiciones de los objetos (tabla `LAYOUT`). Para mover un objeto, se edita ahí y se vuelve a correr.
- Nota: Pillow lee la fuente .woff2 solo si FreeType tiene soporte de brotli; si falla, cambia `FONT` a cualquier .ttf.
