"""1) Genera el cascarón vacío de cada sala (piso en perspectiva, pared, techo curvo).
2) Compone el fondo de cada sala colocando los assets ya generados por separado.
3) Exporta el layout (posiciones) para que el motor dibuje los objetos como sprites propios.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = sys.argv[1]            # carpeta escenario (contiene assets/ y estacion-central.json)
A = f'{ROOT}/assets'
W, H = 960, 600
K = 2                         # trabajamos a 2x
ROOM_W, ROOM_D = 12, 6
BACK_Y, FRONT_Y = 250, 560
S_BACK, S_FRONT = 0.72, 1.12
UNIT = 66
PAD = 14                      # margen de papel de cada asset (1x)
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'fuentes', 'fredoka-latin-600-normal.woff2')


def s_at(z): return S_BACK + (S_FRONT - S_BACK) * z / ROOM_D
def proj(x, z): s = s_at(z); return W / 2 + (x - ROOM_W / 2) * UNIT * s, BACK_Y + (FRONT_Y - BACK_Y) * z / ROOM_D, s


DOOR_X = {'izq': 235, 'izq2': 335, 'der': 725}
LAYOUT = {
    'refugio':        {'pared': [('ventana', 520, 150)], 'puertas': {'der': 'enfermeria'},
                       'piso': [('refugio-capsula', 6.4, 1.6), ('casillero', 2.6, 0.8), ('planta', 10.7, 4.8)]},
    'enfermeria':     {'pared': [('cuadro-tierra', 480, 150), ('extintor', 600, 205)], 'puertas': {'izq': 'refugio', 'der': 'comunicaciones'},
                       'piso': [('camilla-medica', 5.6, 1.7)]},
    'comunicaciones': {'pared': [('ventana', 520, 150)], 'puertas': {'izq': 'enfermeria', 'izq2': 'esclusa', 'der': 'soporte'},
                       'piso': [('consola-antena', 7.6, 1.4), ('mesa-comedor', 3.0, 3.8), ('cajas', 10.6, 4.7)]},
    'soporte':        {'pared': [('extintor', 690, 205)], 'puertas': {'izq': 'comunicaciones'},
                       'piso': [('reciclador-aire', 6.2, 1.3), ('cajas', 9.6, 3.9)]},
    'cultivo':        {'pared': [('ventana', 640, 150)], 'puertas': {'izq': 'esclusa'},
                       'piso': [('tanque-algas', 6.0, 1.2), ('bandeja-cultivo', 2.6, 3.4), ('bandeja-cultivo', 9.5, 3.4), ('planta', 10.9, 5.2)]},
    'puente':         {'pared': [('ventana', 480, 140), ('cuadro-tierra', 345, 100)], 'puertas': {'izq': 'esclusa', 'der': 'energia'},
                       'piso': [('consola-puente', 6.0, 2.4), ('casillero', 3.2, 0.8)]},
    'energia':        {'pared': [('ventana', 470, 150)], 'puertas': {'izq': 'puente'},
                       'piso': [('banco-baterias', 6.2, 1.4), ('cajas', 10.4, 4.0)]},
    'esclusa':        {'pared': [('puerta-esclusa', 520, None)], 'puertas': {'izq': 'comunicaciones', 'izq2': 'puente', 'der': 'cultivo'},
                       'piso': [('casillero-trajes', 9.8, 3.6)]},
}


def shell_svg(piso, pared):
    """Cascarón vacío: módulo cilíndrico visto desde adentro."""
    bl, br = proj(0, 0), proj(ROOM_W, 0)
    fl, fr = proj(-0.6, ROOM_D + 0.9), proj(ROOM_W + 0.6, ROOM_D + 0.9)
    lines = []
    for x in range(ROOM_W + 1):
        a, b = proj(x, 0), proj(x, ROOM_D + 1.2)
        lines.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')
    for z in range(ROOM_D + 2):
        a, b = proj(-1, z), proj(ROOM_W + 1, z)
        lines.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')
    top = 40
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W*K}" height="{H*K}" viewBox="0 0 {W} {H}">
  <rect width="{W}" height="{H}" fill="#0e0b33"/>
  <!-- techo curvo (el módulo es un cilindro) -->
  <path d="M0 {BACK_Y-10} Q{W/2} {top-120} {W} {BACK_Y-10} V0 H0 Z" fill="#1a1560"/>
  <path d="M{bl[0]} {BACK_Y} V{top+70} Q{W/2} {top-20} {br[0]} {top+70} V{BACK_Y} Z" fill="{pared}"/>
  <path d="M{bl[0]+14} {top+82} Q{W/2} {top-4} {br[0]-14} {top+82}" fill="none" stroke="#faf8f0" stroke-opacity=".25" stroke-width="6" stroke-linecap="round"/>
  <!-- costillas del cilindro -->
  <path d="M{bl[0]} {top+70} Q{W*0.2} {top-6} 0 {top+40}" fill="none" stroke="#2a2380" stroke-width="10"/>
  <path d="M{br[0]} {top+70} Q{W*0.8} {top-6} {W} {top+40}" fill="none" stroke="#2a2380" stroke-width="10"/>
  <!-- paredes laterales -->
  <path d="M{bl[0]} {BACK_Y} V{top+70} L0 {top+40} V{H} L{fl[0]} {H} Z" fill="#211a66"/>
  <path d="M{br[0]} {BACK_Y} V{top+70} L{W} {top+40} V{H} L{fr[0]} {H} Z" fill="#211a66"/>
  <!-- zócalo de la pared del fondo -->
  <rect x="{bl[0]}" y="{BACK_Y-16}" width="{br[0]-bl[0]}" height="16" fill="#0e0b33" opacity=".35"/>
  <!-- piso -->
  <path d="M{bl[0]} {BACK_Y} L{br[0]} {BACK_Y} L{fr[0]} {H} L{fl[0]} {H} Z" fill="{piso}"/>
  <clipPath id="f"><path d="M{bl[0]} {BACK_Y} L{br[0]} {BACK_Y} L{fr[0]} {H} L{fl[0]} {H} Z"/></clipPath>
  <g clip-path="url(#f)" stroke="#8a87c4" stroke-opacity=".3" stroke-width="2">{''.join(lines)}</g>
  <!-- borde del piso con la pared -->
  <line x1="{bl[0]}" y1="{BACK_Y}" x2="{br[0]}" y2="{BACK_Y}" stroke="#0e0b33" stroke-width="4"/>
</svg>'''


def load(name, props):
    return Image.open(f"{A}/{props[name]['archivo']}").convert('RGBA')


def main():
    data = json.load(open(f'{ROOT}/estacion-central.json'))
    props = json.load(open(f'{A}/props.json'))
    names = {s['id']: s['nombre'] for s in data['salas']}
    font = ImageFont.truetype(FONT, 15 * K)
    layout_out = {}
    os.makedirs(f'{ROOT}/fondos', exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': W * K, 'height': H * K})
        for sala in data['salas']:
            sid = sala['id']; L = LAYOUT[sid]
            d = f'{ROOT}/fondos/{sid}'; os.makedirs(d, exist_ok=True)
            svg = shell_svg(sala['piso'], sala['pared'])
            open(f'{d}/fondo-vacio.svg', 'w').write(svg)
            pg.set_content(f'<body style="margin:0">{svg}</body>')
            pg.locator('svg').screenshot(path=f'{d}/fondo-vacio@2x.png')
            shell = Image.open(f'{d}/fondo-vacio@2x.png').convert('RGBA')

            variants = ['dia', 'atardecer', 'noche'] if sid == 'puente' else ['dia']
            items = []
            for v in variants:
                img = shell.copy(); draw = ImageDraw.Draw(img)
                items = []
                # --- pared: puertas
                for slot, dest in L['puertas'].items():
                    im = load('puerta-lateral', props); sc = 0.62
                    w2, h2 = int(im.width * sc), int(im.height * sc)
                    x = DOOR_X[slot] * K - w2 // 2; y = BACK_Y * K - h2 + int(PAD * K * sc)
                    img.alpha_composite(im.resize((w2, h2), Image.LANCZOS), (x, y))
                    label = names[dest]
                    tw = draw.textlength(label, font=font)
                    bx = DOOR_X[slot] * K - tw / 2 - 12 * K; by = y - 26 * K
                    draw.rounded_rectangle([bx, by, bx + tw + 24 * K, by + 22 * K], radius=8 * K, fill=(14, 11, 51, 235), outline=(138, 135, 196, 255), width=2 * K)
                    draw.text((DOOR_X[slot] * K, by + 11 * K), label, font=font, fill=(245, 245, 242, 255), anchor='mm')
                    items.append({'asset': 'puerta-lateral', 'tipo': 'puerta', 'destino': dest, 'pared_x': DOOR_X[slot], 'escala': sc})
                # --- pared: ventanas, cuadros, compuerta
                for name, cx, cy in L['pared']:
                    asset = f'ventana-{v}' if name == 'ventana' else name
                    im = load(asset, props)
                    sc = 0.72 if name in ('ventana', 'puerta-esclusa') else 0.8
                    w2, h2 = int(im.width * sc), int(im.height * sc)
                    x = cx * K - w2 // 2
                    y = (BACK_Y * K - h2 + int(PAD * K * sc)) if cy is None else cy * K - h2 // 2
                    img.alpha_composite(im.resize((w2, h2), Image.LANCZOS), (x, y))
                    items.append({'asset': asset if name != 'ventana' else 'ventana-<dia|atardecer|noche>', 'tipo': props[name if name != 'ventana' else 'ventana-dia']['tipo'],
                                  'pared_x': cx, 'pared_y': cy if cy is not None else 'apoyada en el piso', 'escala': sc})
                # --- piso: ordenados por profundidad (z)
                for name, wx, wz in sorted(L['piso'], key=lambda t: t[2]):
                    im = load(name, props); px, py, s = proj(wx, wz)
                    sc = s * 0.9
                    w2, h2 = int(im.width * sc), int(im.height * sc)
                    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
                    rx, ry = w2 * 0.42, 10 * K * s
                    sd.ellipse([px * K - rx, py * K - ry, px * K + rx, py * K + ry], fill=(0, 0, 0, 70))
                    img.alpha_composite(sh)
                    img.alpha_composite(im.resize((w2, h2), Image.LANCZOS), (int(px * K - w2 / 2), int(py * K - h2 + PAD * K * sc)))
                    items.append({'asset': name, 'tipo': props[name]['tipo'], 'x': wx, 'z': wz, 'escala_base': 0.9})
                fn = f'{d}/fondo-compuesto@2x.png' if v == 'dia' else f'{d}/fondo-compuesto-{v}@2x.png'
                img.save(fn, optimize=True)
                img.resize((W, H), Image.LANCZOS).convert('RGB').save(fn.replace('@2x.png', '.jpg'), quality=88)
            layout_out[sid] = {'nombre': sala['nombre'], 'piso': sala['piso'], 'pared': sala['pared'],
                               'fondo_vacio': f'fondos/{sid}/fondo-vacio@2x.png', 'objetos': items}
        b.close()
    json.dump({'proyeccion': {'ancho': W, 'alto': H, 'sala': [ROOM_W, ROOM_D], 'y_fondo': BACK_Y, 'y_frente': FRONT_Y,
                              'escala_fondo': S_BACK, 'escala_frente': S_FRONT, 'px_por_unidad': UNIT,
                              'nota': 'x: 0–12 (izq→der), z: 0–6 (fondo→frente). escala(z) interpola entre escala_fondo y escala_frente.'},
               'salas': layout_out}, open(f'{ROOT}/layout-salas.json', 'w'), ensure_ascii=False, indent=2)
    print('ok', len(layout_out))


if __name__ == '__main__':
    main()
