"""Assets de escenario (estilo papel 2.5D), cada uno en su propio SVG.

Convención: cada función devuelve (ancho, alto, cuerpo_svg) en px a 1x.
El ancla de los objetos de piso es el centro inferior (x = ancho/2, y = alto).
El borde blanco de papel se agrega al rasterizar.
"""
OUT = '#0e0b33'
SW = 4
INK = '#f5f5f2'
MUTED = '#c4c2e0'
LINE = '#8a87c4'
S900, S800, S700, S600 = '#0e0b33', '#18144e', '#241d6b', '#322a8a'
GOLD, GOLD_D, CYAN, TEAL, VIOLET, MAG, CORAL, RED = '#ffcb47', '#c98a12', '#4cc3f5', '#5ad6b2', '#9b7bff', '#ee5fd6', '#ff7a59', '#ff6b7a'
SUIT = '#f5f5f2'
METAL = '#c4c2e0'
METAL_D = '#9a98c8'


def rr(x, y, w, h, r, fill, sw=SW, stroke=OUT, extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'


def screen(x, y, w, h, color, r=8):
    return rr(x, y, w, h, r, S900, 3) + f'<rect x="{x+6}" y="{y+6}" width="{w-12}" height="{h-12}" rx="{max(2, r-4)}" fill="{color}"/>'


def legs(x1, x2, y, h=10):
    return rr(x1, y, 14, h, 4, METAL_D, 3) + rr(x2, y, 14, h, 4, METAL_D, 3)


# ------------------------------------------------------------------ interactivos (1 por sala)
def refugio_capsula():
    w, h = 220, 170
    b = rr(10, 40, 200, 120, 30, SUIT)
    b += rr(22, 52, 176, 70, 22, '#2a3f8f', 3)                         # interior con paredes de agua (azul)
    b += ''.join(f'<path d="M{34+i*22} 58 v58" stroke="#4cc3f5" stroke-width="5" stroke-linecap="round" opacity=".55"/>' for i in range(8))
    b += rr(40, 92, 140, 26, 12, VIOLET, 3)                            # colchón
    b += rr(150, 84, 32, 20, 9, INK, 3)                                # almohada
    b += f'<path d="M10 70 Q110 0 210 70" fill="none" stroke="{OUT}" stroke-width="{SW}"/>'
    b += f'<path d="M24 66 Q110 12 196 66" fill="none" stroke="{GOLD}" stroke-width="6" stroke-linecap="round"/>'  # banda de blindaje
    b += rr(86, 128, 48, 22, 8, S900, 3) + f'<circle cx="110" cy="139" r="5" fill="{TEAL}"/>'
    return w, h, b


def camilla_medica():
    w, h = 210, 170
    b = legs(40, 156, 140, 26)
    b += rr(20, 104, 170, 40, 14, SUIT)
    b += rr(28, 96, 130, 18, 9, '#9fd8f5', 3)                          # colchoneta
    b += rr(150, 90, 34, 18, 8, INK, 3)
    b += rr(150, 14, 46, 70, 10, METAL, SW)                            # monitor
    b += screen(156, 20, 34, 40, CYAN, 6)
    b += f'<path d="M160 40 l6 0 l3 -8 l4 14 l3 -6 l8 0" fill="none" stroke="{S900}" stroke-width="2.5" stroke-linejoin="round"/>'
    b += f'<path d="M173 84 v12" stroke="{OUT}" stroke-width="{SW}"/>'
    b += f'<rect x="60" y="114" width="10" height="26" fill="{RED}"/><rect x="52" y="122" width="26" height="10" fill="{RED}"/>'
    return w, h, b


def consola_antena():
    w, h = 200, 190
    b = rr(20, 90, 160, 90, 14, METAL)
    b += screen(34, 100, 80, 52, '#123a5c', 8)
    b += ''.join(f'<rect x="{44+i*12}" y="{140-i*8}" width="8" height="{6+i*8}" rx="2" fill="{CYAN}"/>' for i in range(5))
    b += ''.join(f'<circle cx="{140+ (i%2)*20}" cy="{112+ (i//2)*22}" r="7" fill="{c}" stroke="{OUT}" stroke-width="3"/>' for i, c in enumerate([GOLD, TEAL, RED, CYAN]))
    b += f'<path d="M100 90 V50" stroke="{OUT}" stroke-width="{SW+2}"/><path d="M100 90 V50" stroke="{METAL_D}" stroke-width="{SW-1}"/>'
    b += f'<path d="M58 44 Q100 -6 142 44 Z" fill="{SUIT}" stroke="{OUT}" stroke-width="{SW}" stroke-linejoin="round"/>'  # plato
    b += f'<circle cx="100" cy="30" r="6" fill="{GOLD}" stroke="{OUT}" stroke-width="3"/>'
    return w, h, b


def reciclador_aire():
    w, h = 170, 220
    b = rr(30, 20, 110, 190, 40, METAL)
    b += rr(44, 36, 82, 82, 41, S900, 3)
    b += ''.join(f'<path d="M85 77 L{85+30*__import__("math").cos(a)} {77+30*__import__("math").sin(a)}" stroke="{CYAN}" stroke-width="9" stroke-linecap="round"/>'
                 for a in [0.3, 2.4, 4.5])
    b += f'<circle cx="85" cy="77" r="9" fill="{INK}" stroke="{OUT}" stroke-width="3"/>'
    b += rr(50, 134, 70, 22, 8, S900, 3) + f'<rect x="56" y="140" width="40" height="10" rx="3" fill="{TEAL}"/>'
    b += f'<text x="85" y="186" text-anchor="middle" font-family="Space Mono, monospace" font-weight="700" font-size="18" fill="{S700}">O₂</text>'
    b += f'<path d="M30 60 H10 V200 H40" fill="none" stroke="{OUT}" stroke-width="{SW+3}"/><path d="M30 60 H10 V200 H40" fill="none" stroke="{TEAL}" stroke-width="{SW-1}"/>'
    return w, h, b


def tanque_algas():
    w, h = 190, 230
    b = rr(20, 20, 150, 22, 10, METAL)                                   # lámpara de cultivo
    b += f'<path d="M30 42 L20 70 H170 L160 42" fill="{MAG}" opacity=".35"/>'
    b += rr(34, 60, 122, 140, 24, '#2a8a6f')
    b += ''.join(f'<circle cx="{50+(i*37)%100}" cy="{80+(i*53)%100}" r="{4+i%4}" fill="#bff5df" stroke="{OUT}" stroke-width="1.5" opacity=".9"/>' for i in range(9))
    b += f'<path d="M34 120 Q60 108 95 120 T156 120 V176 Q156 200 132 200 H58 Q34 200 34 176 Z" fill="#1f6b55"/>'
    b += rr(34, 60, 122, 140, 24, 'none')
    b += rr(26, 196, 138, 24, 10, METAL)
    b += f'<path d="M40 70 Q38 100 46 120" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>'
    return w, h, b


def consola_puente():
    w, h = 260, 180
    b = f'<path d="M20 170 L40 80 H220 L240 170 Z" fill="{METAL}" stroke="{OUT}" stroke-width="{SW}" stroke-linejoin="round"/>'
    b += screen(56, 20, 148, 76, '#16326b', 10)
    b += f'<circle cx="105" cy="58" r="22" fill="#9fd8f5" stroke="{OUT}" stroke-width="3"/><path d="M92 50 q8 -6 14 2 t12 6" fill="none" stroke="{TEAL}" stroke-width="6" stroke-linecap="round"/>'
    b += ''.join(f'<rect x="{140}" y="{36+i*14}" width="{48-i*9}" height="7" rx="3" fill="{c}"/>' for i, c in enumerate([GOLD, CYAN, MAG]))
    b += ''.join(f'<rect x="{60+i*30}" y="118" width="22" height="14" rx="4" fill="{c}" stroke="{OUT}" stroke-width="3"/>' for i, c in enumerate([GOLD, TEAL, CYAN, VIOLET, RED]))
    b += f'<path d="M100 150 h60" stroke="{S700}" stroke-width="6" stroke-linecap="round"/>'
    return w, h, b


def banco_baterias():
    w, h = 240, 200
    b = ''
    for i in range(3):
        x = 20 + i * 70
        b += rr(x, 40, 60, 150, 14, METAL)
        b += rr(x + 10, 54, 40, 110, 8, S900, 3)
        b += f'<rect x="{x+14}" y="{94 - 0}" width="32" height="66" rx="5" fill="{GOLD}"/>'
        b += rr(x + 22, 28, 16, 14, 4, METAL_D, 3)
    b += f'<path d="M126 70 l-14 26 h12 l-6 22 l18 -30 h-12 z" fill="{INK}" stroke="{OUT}" stroke-width="2.5" stroke-linejoin="round"/>'
    return w, h, b


def puerta_esclusa():
    w, h = 210, 240
    b = rr(10, 10, 190, 220, 60, METAL)
    b += f'<circle cx="105" cy="112" r="74" fill="{S600}" stroke="{OUT}" stroke-width="{SW}"/>'
    b += f'<circle cx="105" cy="112" r="56" fill="{S700}" stroke="{OUT}" stroke-width="3"/>'
    b += f'<circle cx="105" cy="112" r="22" fill="{METAL}" stroke="{OUT}" stroke-width="{SW}"/>'
    b += ''.join(f'<path d="M105 112 L{105+50*__import__("math").cos(a)} {112+50*__import__("math").sin(a)}" stroke="{METAL}" stroke-width="7" stroke-linecap="round"/>' for a in [0, 2.094, 4.188])
    b += f'<circle cx="105" cy="112" r="8" fill="{GOLD}" stroke="{OUT}" stroke-width="3"/>'
    b += f'<path d="M20 214 H190" stroke="{GOLD}" stroke-width="8" stroke-dasharray="16 10"/>'
    return w, h, b


# ------------------------------------------------------------------ decoración (sin acción)
def casillero():
    w, h = 110, 190
    b = rr(10, 10, 90, 172, 10, METAL) + f'<path d="M55 12 V180" stroke="{OUT}" stroke-width="3"/>'
    b += ''.join(f'<path d="M{20+k*45} {30+j*10} h26" stroke="{METAL_D}" stroke-width="4" stroke-linecap="round"/>' for k in range(2) for j in range(3))
    b += f'<circle cx="46" cy="100" r="4" fill="{OUT}"/><circle cx="64" cy="100" r="4" fill="{OUT}"/>'
    return w, h, b


def casillero_trajes():
    w, h = 150, 200
    b = rr(10, 10, 130, 182, 12, METAL_D)
    b += rr(24, 24, 102, 150, 10, S700, 3)
    b += f'<circle cx="75" cy="62" r="24" fill="#bfe6ff" fill-opacity=".35" stroke="{OUT}" stroke-width="3"/>'
    b += rr(48, 86, 54, 70, 16, SUIT, 3) + f'<rect x="50" y="112" width="50" height="8" fill="{GOLD}"/>'
    return w, h, b


def planta():
    w, h = 100, 150
    b = f'<path d="M24 100 H76 L70 142 H30 Z" fill="{CORAL}" stroke="{OUT}" stroke-width="{SW}" stroke-linejoin="round"/>'
    for cx, cy, r in [(50, 46, 26), (28, 70, 20), (72, 70, 20), (50, 80, 18)]:
        b += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{TEAL}" stroke="{OUT}" stroke-width="3"/>'
    b += f'<path d="M50 100 V60" stroke="#1f6b55" stroke-width="5"/>'
    return w, h, b


def extintor():
    w, h = 60, 120
    b = rr(14, 30, 32, 82, 14, RED) + rr(20, 18, 20, 16, 5, OUT, 0) + f'<path d="M30 20 Q46 14 50 30" fill="none" stroke="{OUT}" stroke-width="4"/>'
    b += f'<rect x="18" y="60" width="24" height="14" rx="3" fill="{INK}"/>'
    return w, h, b


def cuadro_tierra():
    w, h = 130, 100
    b = rr(8, 8, 114, 84, 12, METAL) + rr(18, 18, 94, 64, 8, S900, 3)
    b += f'<circle cx="65" cy="50" r="22" fill="{CYAN}" stroke="{OUT}" stroke-width="3"/><path d="M52 42 q8 -8 16 0 t12 10 M50 58 q6 4 12 0" fill="none" stroke="{TEAL}" stroke-width="6" stroke-linecap="round"/>'
    b += ''.join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="{MUTED}"/>' for x, y in [(28, 26), (100, 30), (96, 72), (30, 70)])
    return w, h, b


def mesa_comedor():
    w, h = 200, 130
    b = legs(40, 146, 70, 52) + rr(14, 52, 172, 24, 10, METAL)
    b += rr(46, 30, 26, 26, 6, INK, 3) + f'<path d="M72 38 q10 2 0 12" fill="none" stroke="{OUT}" stroke-width="3"/>'
    b += rr(110, 34, 44, 20, 8, CORAL, 3)
    return w, h, b


def cajas():
    w, h = 160, 130
    b = rr(10, 50, 80, 72, 8, '#c9a46a') + f'<path d="M10 76 H90" stroke="{OUT}" stroke-width="3"/>'
    b += rr(80, 70, 70, 52, 8, '#b08a52') + f'<path d="M80 92 H150" stroke="{OUT}" stroke-width="3"/>'
    b += rr(30, 14, 60, 40, 8, '#d9b77e') + f'<path d="M30 32 H90" stroke="{OUT}" stroke-width="3"/>'
    return w, h, b


def bandeja_cultivo():
    w, h = 200, 120
    b = legs(30, 156, 70, 42) + rr(14, 54, 172, 24, 8, METAL)
    b += f'<path d="M24 54 Q30 40 22 26 M40 54 Q46 30 38 18 M60 54 Q62 36 70 24 M84 54 Q80 30 92 20 M108 54 Q114 36 106 22 M130 54 Q136 30 148 22 M156 54 Q152 36 166 28" fill="none" stroke="#1f6b55" stroke-width="6" stroke-linecap="round"/>'
    b += ''.join(f'<ellipse cx="{x}" cy="{y}" rx="9" ry="6" fill="{TEAL}" stroke="{OUT}" stroke-width="2"/>' for x, y in [(24, 26), (38, 18), (70, 24), (92, 20), (106, 22), (148, 22), (166, 28)])
    b += f'<path d="M14 40 H186" stroke="{MAG}" stroke-width="3" opacity=".5"/>'
    return w, h, b


# ------------------------------------------------------------------ piezas del cascarón (pared)
def ventana(estado):
    """Vista al exterior lunar. estado: dia | atardecer | noche (sigue el calendario lunar)."""
    w, h = 300, 170
    sky = {'dia': '#0e0b33', 'atardecer': '#0e0b33', 'noche': '#06051a'}[estado]
    ground = {'dia': '#c4c2e0', 'atardecer': '#9a8fb8', 'noche': '#4a4670'}[estado]
    ground_d = {'dia': '#9a98c8', 'atardecer': '#7a6f9a', 'noche': '#35315a'}[estado]
    b = rr(6, 6, w - 12, h - 12, 26, METAL)
    b += f'<clipPath id="vw"><rect x="20" y="20" width="{w-40}" height="{h-40}" rx="16"/></clipPath><g clip-path="url(#vw)">'
    b += f'<rect x="20" y="20" width="{w-40}" height="{h-40}" fill="{sky}"/>'
    b += ''.join(f'<circle cx="{30+(i*41)%240}" cy="{26+(i*29)%70}" r="{1.2 + (i%3)*0.5}" fill="{MUTED}"/>' for i in range(26))
    b += f'<circle cx="220" cy="54" r="18" fill="{CYAN}" stroke="{OUT}" stroke-width="2"/><path d="M210 50 q6 -6 12 0 t8 6" fill="none" stroke="{TEAL}" stroke-width="4" stroke-linecap="round"/>'  # la Tierra
    if estado == 'dia':
        b += f'<circle cx="70" cy="44" r="14" fill="{GOLD}"/>'
    elif estado == 'atardecer':
        b += f'<circle cx="60" cy="112" r="16" fill="{GOLD}"/>'
    b += f'<path d="M20 120 Q70 100 120 116 T220 108 T290 118 V160 H20 Z" fill="{ground}"/>'
    b += f'<ellipse cx="90" cy="132" rx="22" ry="6" fill="{ground_d}"/><ellipse cx="200" cy="138" rx="30" ry="7" fill="{ground_d}"/>'
    if estado == 'noche':
        b += f'<rect x="20" y="20" width="{w-40}" height="{h-40}" fill="#000" opacity=".25"/>'
    b += '</g>' + rr(20, 20, w - 40, h - 40, 16, 'none', 3)
    b += f'<path d="M40 34 L70 34" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>'
    return w, h, b


def puerta_lateral():
    w, h = 130, 200
    b = rr(8, 8, 114, 186, 40, METAL)
    b += rr(22, 22, 86, 166, 30, '#1d1858', 3)
    b += f'<path d="M65 30 V180" stroke="{GOLD}" stroke-width="5" stroke-dasharray="12 9"/>'
    b += rr(40, 98, 50, 14, 6, TEAL, 3)
    return w, h, b


PROPS = {
    # nombre: (función, tipo, colocacion)
    'refugio-capsula': (refugio_capsula, 'interactivo', 'piso'),
    'camilla-medica': (camilla_medica, 'interactivo', 'piso'),
    'consola-antena': (consola_antena, 'interactivo', 'piso'),
    'reciclador-aire': (reciclador_aire, 'interactivo', 'piso'),
    'tanque-algas': (tanque_algas, 'interactivo', 'piso'),
    'consola-puente': (consola_puente, 'interactivo', 'piso'),
    'banco-baterias': (banco_baterias, 'interactivo', 'piso'),
    'puerta-esclusa': (puerta_esclusa, 'interactivo', 'pared'),
    'casillero': (casillero, 'decoracion', 'piso'),
    'casillero-trajes': (casillero_trajes, 'decoracion', 'piso'),
    'planta': (planta, 'decoracion', 'piso'),
    'extintor': (extintor, 'decoracion', 'pared'),
    'cuadro-tierra': (cuadro_tierra, 'decoracion', 'pared'),
    'mesa-comedor': (mesa_comedor, 'decoracion', 'piso'),
    'cajas': (cajas, 'decoracion', 'piso'),
    'bandeja-cultivo': (bandeja_cultivo, 'decoracion', 'piso'),
    'ventana-dia': (lambda: ventana('dia'), 'cascaron', 'pared'),
    'ventana-atardecer': (lambda: ventana('atardecer'), 'cascaron', 'pared'),
    'ventana-noche': (lambda: ventana('noche'), 'cascaron', 'pared'),
    'puerta-lateral': (puerta_lateral, 'cascaron', 'pared'),
}


def svg_of(name):
    fn = PROPS[name][0]
    w, h, body = fn()
    pad = 14  # margen para el borde de papel
    return w + pad * 2, h + pad * 2, (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w+pad*2}" height="{h+pad*2}" viewBox="{-pad} {-pad} {w+pad*2} {h+pad*2}">'
                                      f'<g stroke-linejoin="round">{body}</g></svg>')
