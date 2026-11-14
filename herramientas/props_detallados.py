"""Sprites de la estación con más detalle, basados en equipo real (ver SOURCES.md, sección "Objetos").

Salida: juego/public/game/props/<nombre>.svg  y, para las máquinas con las que se interactúa,
<nombre>-marcado.svg (el mismo dibujo con un contorno blanco fino: así se ve qué se puede usar).
Convención: cada función devuelve (ancho, alto, cuerpo_svg) a 1x; el ancla es el centro inferior; se agregan 14 px de margen.
No usa ventanas. No usa rayos (el rayo es solo el icono de energía del HUD).

Uso (desde la raíz de JuegoNASA):  python3 herramientas/props_detallados.py
"""
import math
import os

OUT = '#0e0b33'
SW = 4
WHITE = '#f5f5f2'
METAL = '#c4c2e0'
METAL_D = '#9a98c8'
METAL_L = '#e4e3f2'
NAVY = '#18144e'
NAVY_L = '#2a3f8f'
GOLD, CYAN, TEAL, VIOLET, MAG, CORAL, RED, GREEN = '#ffcb47', '#4cc3f5', '#5ad6b2', '#9b7bff', '#ee5fd6', '#ff7a59', '#ff6b7a', '#7ed957'
TAN, TAN_D, TAN_L = '#c9a06a', '#a87c46', '#e3bd84'


def rr(x, y, w, h, r, fill, sw=SW, stroke=OUT, extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'


def circ(cx, cy, r, fill, sw=3, stroke=OUT, extra=''):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'


def path(d, fill='none', stroke=OUT, sw=SW, extra=''):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'


def text(x, y, s, size=12, fill=NAVY, anchor='middle'):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Arial, Helvetica, sans-serif" font-weight="700" '
            f'font-size="{size}" fill="{fill}">{s}</text>')


def screen(x, y, w, h, color=NAVY, r=8):
    return rr(x, y, w, h, r, OUT, 3) + rr(x + 4, y + 4, w - 8, h - 8, max(2, r - 4), color, 0, 'none')


def rivets(x, y, n, gap, r=2.2, fill=METAL_D):
    return ''.join(f'<circle cx="{x + i * gap}" cy="{y}" r="{r}" fill="{fill}" stroke="{OUT}" stroke-width="1"/>' for i in range(n))


def gauge(cx, cy, r, value=0.6, color=TEAL):
    a = math.pi * (1 + value)
    nx, ny = cx + (r - 4) * math.cos(a), cy + (r - 4) * math.sin(a)
    ticks = ''.join(path(f'M{cx + (r - 3) * math.cos(math.pi * (1 + t / 4))} {cy + (r - 3) * math.sin(math.pi * (1 + t / 4))}'
                         f'L{cx + (r - 7) * math.cos(math.pi * (1 + t / 4))} {cy + (r - 7) * math.sin(math.pi * (1 + t / 4))}', stroke=METAL_L, sw=1.5)
                    for t in range(5))
    return (circ(cx, cy, r, NAVY, 3) + ticks + path(f'M{cx} {cy}L{nx:.1f} {ny:.1f}', stroke=color, sw=2.5) + circ(cx, cy, 2.5, WHITE, 1))


def valve(cx, cy, r=9):
    spokes = ''.join(path(f'M{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}L{cx - r * math.cos(a):.1f} {cy - r * math.sin(a):.1f}', stroke=OUT, sw=3) for a in (0, math.pi / 2))
    return circ(cx, cy, r, RED, 3) + spokes + circ(cx, cy, 3, GOLD, 1.5)


def pipe(d, color=METAL_D, sw=9):
    return path(d, stroke=OUT, sw=sw + 4) + path(d, stroke=color, sw=sw)


def leaf(cx, cy, w, h, ang, fill=GREEN, vein='#2f8f3a'):
    return (f'<g transform="rotate({ang} {cx} {cy})"><path d="M{cx} {cy} C{cx - w} {cy - h * .4} {cx - w * .6} {cy - h} {cx} {cy - h} '
            f'C{cx + w * .6} {cy - h} {cx + w} {cy - h * .4} {cx} {cy}Z" fill="{fill}" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="M{cx} {cy - 3}V{cy - h + 6}" stroke="{vein}" stroke-width="2" stroke-linecap="round"/></g>')


# ================================================================== interactivos
def reciclador_aire():
    """Unidad de remoción de CO₂ de la ISS (CDRA): lechos de sorbente en dos columnas, válvulas y un tanque de O₂."""
    w, h = 200, 240
    b = rr(20, 24, 140, 206, 22, METAL)
    b += rr(32, 36, 116, 40, 9, NAVY, 3) + text(90, 53, 'CO₂ → O₂', 14, GOLD) + f'<rect x="42" y="60" width="60" height="6" rx="3" fill="{TEAL}"/>'
    b += circ(130, 62, 7, GREEN, 2.5) + circ(114, 62, 7, GOLD, 2.5)
    for i in range(2):
        x = 38 + i * 56
        b += rr(x - 2, 84, 48, 12, 5, METAL_D, 3)
        b += rr(x, 94, 44, 88, 14, '#d9efff', 3.5)
        b += ''.join(f'<circle cx="{x + 9 + (j * 13) % 28}" cy="{104 + (j * 17) % 70}" r="4" fill="{TAN_L}" stroke="{TAN_D}" stroke-width="1.5"/>' for j in range(14))
        b += path(f'M{x + 6} 100 Q{x + 4} 130 {x + 8} 160', stroke=WHITE, sw=4, extra='opacity=".7"')
        b += rr(x - 2, 178, 48, 10, 5, METAL_D, 3)
    b += pipe('M60 188 V204 H120 V188', METAL_D, 7) + valve(70, 204, 9) + valve(112, 204, 9)
    b += rr(40, 214, 100, 12, 5, NAVY, 3) + ''.join(f'<rect x="{50 + i * 12}" y="217" width="6" height="6" rx="1" fill="{METAL_D}"/>' for i in range(7))
    b += rr(158, 96, 36, 120, 15, TEAL) + path('M166 106 V190', stroke=WHITE, sw=4, extra='opacity=".6"')
    b += rr(168, 86, 16, 12, 4, METAL_D, 3) + text(176, 160, 'O₂', 14, NAVY) + pipe('M158 110 H150', METAL_D, 6)
    b += rivets(30, 34, 1, 0) + rivets(150, 34, 1, 0)
    return w, h, b


def estacion_comida():
    """Galera de la ISS: calentador de comida tipo maletín, dispensador de agua con paquete y bolsitas de comida."""
    w, h = 230, 190
    b = rr(10, 108, 210, 72, 10, METAL) + rr(6, 98, 218, 14, 6, METAL_L, 3.5)
    b += rr(18, 120, 90, 50, 6, METAL_D, 3) + rr(116, 120, 96, 50, 6, METAL_D, 3)
    b += rr(50, 130, 26, 6, 3, NAVY, 2) + rr(150, 130, 26, 6, 3, NAVY, 2) + rivets(26, 164, 5, 18, 2) + rivets(124, 164, 5, 19, 2)
    # calentador de comida (maletín abierto)
    b += rr(20, 74, 88, 26, 6, METAL_D) + rr(28, 80, 72, 8, 3, CORAL, 2)
    b += path('M20 74 L30 34 H98 L108 74 Z', METAL, OUT, SW) + path('M34 70 L40 42 H88 L94 70 Z', '#ffb08a', OUT, 2.5)
    b += path('M52 28 q-6 -10 2 -16 M66 30 q-6 -10 2 -18 M80 28 q-6 -10 2 -16', 'none', WHITE, 3, 'opacity=".85"')
    b += circ(100, 90, 4, GREEN, 2)
    # dispensador de agua
    b += rr(146, 18, 64, 82, 10, METAL) + rr(154, 26, 48, 22, 6, NAVY, 3) + text(178, 42, 'AGUA', 11, CYAN)
    b += circ(162, 62, 7, RED, 2.5) + circ(194, 62, 7, CYAN, 2.5) + text(162, 83, 'CALIENTE', 6, NAVY) + text(194, 83, 'FRÍA', 7, NAVY)
    b += rr(172, 74, 12, 14, 3, METAL_D, 2.5) + path('M178 88 V96', stroke=CYAN, sw=3)
    # bolsitas de comida y cuchara
    for i, c in enumerate([GOLD, TEAL, VIOLET]):
        b += rr(116 + i * 10, 80 + (i % 2) * 2, 22, 26, 6, c, 3) + f'<rect x="{119 + i * 10}" y="{84 + (i % 2) * 2}" width="16" height="4" rx="1.5" fill="{OUT}" opacity=".55"/>'
    b += path('M12 90 q4 -6 10 -2', stroke=OUT, sw=3)
    return w, h, b


def tanque_algas():
    """Fotobiorreactor: columna de vidrio con algas, barra de luces rojas y azules, bomba y medidor de pH."""
    w, h = 200, 250
    b = '<path d="M36 38 L18 74 H182 L164 38 Z" fill="#ee5fd6" opacity=".22"/>'
    b += rr(22, 12, 156, 26, 10, METAL) + ''.join(circ(40 + i * 20, 25, 5.5, MAG if i % 2 else CYAN, 2) for i in range(7))
    b += rr(34, 60, 132, 14, 6, METAL_D, 3.5)
    b += rr(40, 70, 120, 124, 28, '#2e9f7b', 4)
    b += path('M40 110 Q70 98 100 110 T160 110 V170 Q160 194 136 194 H64 Q40 194 40 170 Z', '#1f7a5c', 'none', 0)
    for i, (x, y, r) in enumerate([(62, 90, 5), (96, 130, 7), (124, 100, 4), (80, 160, 6), (132, 150, 5), (56, 140, 4), (108, 84, 3)]):
        b += circ(x, y, r, '#d4fbe9', 1.8, OUT, 'opacity=".9"')
    b += path('M64 180 q10 -26 2 -50 M110 186 q12 -22 0 -46 M140 176 q6 -20 -4 -36', 'none', '#8be3b0', 4, 'opacity=".75"')
    b += rr(40, 70, 120, 124, 28, 'none', 4)
    b += path('M52 84 Q50 112 58 134', stroke=WHITE, sw=5, extra='opacity=".5"')
    b += rr(34, 190, 132, 12, 6, METAL_D, 3.5)
    b += rr(24, 200, 152, 42, 12, METAL) + gauge(54, 222, 14, 0.55, GOLD) + text(54, 242, 'pH', 8, NAVY)
    b += circ(100, 220, 8, VIOLET, 2.5) + circ(124, 220, 8, TEAL, 2.5) + rr(146, 212, 22, 16, 4, NAVY, 2.5) + f'<rect x="150" y="216" width="14" height="4" rx="2" fill="{GREEN}"/>'
    b += pipe('M176 214 H190 V120 H160', METAL_D, 6)
    return w, h, b


def rack_plantas():
    """Rack de cultivo tipo Veggie: estantes con tiras de luces LED, almohadillas con plantas y tanque de agua."""
    w, h = 250, 230
    b = rr(8, 6, 14, 218, 5, METAL_D, 3.5) + rr(228, 6, 14, 218, 5, METAL_D, 3.5) + rr(8, 4, 234, 12, 5, METAL, 3.5)
    kinds = ['lechuga', 'tomate', 'trigo']
    for i, kind in enumerate(kinds):
        yb = 76 + i * 66
        b += rr(20, yb - 62, 210, 9, 4, NAVY, 3) + ''.join(circ(34 + j * 18, yb - 57.5, 2.8, [RED, CYAN, GREEN][j % 3], 1) for j in range(11))
        b += f'<path d="M30 {yb - 53} L22 {yb - 12} H228 L220 {yb - 53}Z" fill="#ee5fd6" opacity=".08"/>'
        b += rr(20, yb - 12, 210, 18, 5, METAL) + rr(26, yb - 16, 198, 10, 4, '#7a4f2f', 3)
        for j in range(5):
            x = 50 + j * 38
            if kind == 'lechuga':
                b += leaf(x, yb - 14, 14, 28, -35) + leaf(x, yb - 14, 14, 28, 35) + leaf(x, yb - 14, 13, 34, 0, '#9be86a')
            elif kind == 'tomate':
                b += path(f'M{x} {yb - 14} V{yb - 48}', stroke='#2f8f3a', sw=3.5) + leaf(x, yb - 30, 10, 16, -50) + leaf(x, yb - 36, 10, 16, 50)
                b += circ(x - 6, yb - 24, 5, RED, 2) + circ(x + 6, yb - 30, 4.5, RED, 2)
            else:
                b += ''.join(path(f'M{x + (k - 1) * 6} {yb - 14} q{(k - 1) * 3} -18 {(k - 1) * 5} -34', stroke=TAN_D, sw=2.5) + circ(x + (k - 1) * 5, yb - 49, 2.8, GOLD, 1.2) for k in range(3))
    b += rr(26, 196, 56, 26, 7, CYAN) + text(54, 214, 'AGUA', 10, NAVY) + pipe('M82 208 H100 V190', CYAN, 5)
    b += gauge(204, 208, 12, 0.7, GREEN)
    return w, h, b


def consola_puente():
    """Consola de clima espacial: Sol con erupción, gráfico de rayos X (clases C, M y X), alerta y satélite."""
    w, h = 280, 210
    b = path('M18 204 L38 108 H242 L262 204 Z', METAL, OUT, SW)
    b += rr(66, 12, 148, 98, 10, METAL_D, 3.5) + screen(72, 18, 136, 84, NAVY, 8)
    b += circ(112, 60, 21, GOLD, 3) + ''.join(path(f'M{112 + 25 * math.cos(a):.1f} {60 + 25 * math.sin(a):.1f}L{112 + 31 * math.cos(a):.1f} {60 + 31 * math.sin(a):.1f}', stroke=GOLD, sw=3) for a in [i * math.pi / 4 for i in range(8)])
    b += path('M126 42 Q146 22 150 38 Q138 38 132 50Z', MAG, OUT, 2.5)
    for k, (y, c, s) in enumerate([(40, RED, 'X'), (58, GOLD, 'M'), (76, CYAN, 'C')]):
        b += f'<path d="M158 {y}H202" stroke="{c}" stroke-width="1.5" opacity=".7"/>' + text(204, y + 3, s, 8, c, 'start')
    b += path('M158 90 L168 84 L176 86 L184 50 L192 78 L202 80', 'none', CORAL, 2.5)
    b += rr(14, 34, 46, 64, 8, METAL_D, 3.5) + screen(18, 38, 38, 44, NAVY, 5) + path('M37 46 L49 70 H25Z', GOLD, OUT, 2.5) + f'<rect x="35.5" y="54" width="3" height="9" fill="{OUT}"/>' + circ(37, 66, 1.8, OUT, 0)
    b += circ(30, 90, 4, GREEN, 2) + circ(44, 90, 4, RED, 2)
    b += rr(220, 34, 46, 64, 8, METAL_D, 3.5) + screen(224, 38, 38, 44, NAVY, 5)
    b += rr(236, 54, 14, 12, 2, METAL_L, 2) + rr(226, 56, 8, 8, 1, NAVY_L, 2) + rr(252, 56, 8, 8, 1, NAVY_L, 2) + circ(243, 74, 2.5, CYAN, 1)
    b += text(243, 94, 'GOES', 7, CYAN)
    b += ''.join(rr(56 + i * 26, 124, 20, 12, 4, c, 3) for i, c in enumerate([GOLD, TEAL, CYAN, VIOLET, RED, GOLD, TEAL]))
    b += ''.join(circ(70 + i * 32, 158, 8, c, 3) + path(f'M{70 + i * 32} 158 l4 -4', stroke=OUT, sw=2) for i, c in enumerate([METAL_L, GOLD, METAL_L, CYAN, METAL_L]))
    b += rr(98, 176, 84, 8, 4, NAVY, 3) + f'<rect x="{104 + 30}" y="177.5" width="16" height="5" rx="2" fill="{GOLD}"/>' + rivets(40, 190, 1, 0) + rivets(240, 190, 1, 0)
    return w, h, b


def consola_antena():
    """Antena parabólica de la Red del Espacio Profundo con su consola de señal."""
    w, h = 230, 230
    b = rr(98, 96, 26, 70, 6, METAL_D) + rr(86, 88, 50, 14, 5, METAL, 3.5)
    b += f'<g transform="rotate(-18 112 62)">' + path('M30 62 Q112 -26 194 62 Q112 40 30 62Z', WHITE, OUT, SW) + path('M42 60 Q112 8 182 60', 'none', METAL_D, 3) + path('M70 56 Q112 30 154 56', 'none', METAL_D, 2.5)
    b += path('M112 20 L112 -10', stroke=OUT, sw=3) + rr(104, -20, 16, 14, 4, GOLD, 3) + '</g>'
    b += path('M112 88 L96 56 M112 88 L128 56', stroke=OUT, sw=5) + path('M112 88 L96 56 M112 88 L128 56', stroke=METAL_D, sw=2.5)
    b += rr(16, 152, 198, 70, 12, METAL)
    b += screen(26, 160, 94, 54, '#0e2a4d', 8) + path('M32 190 q8 -22 16 0 t16 0 t16 0 t16 0', stroke=CYAN, sw=2.5)
    b += ''.join(f'<rect x="{34 + i * 10}" y="{206 - i * 5}" width="6" height="{4 + i * 5}" rx="1.5" fill="{GREEN if i < 3 else METAL_D}"/>' for i in range(5))
    b += ''.join(circ(144 + (i % 3) * 20, 174 + (i // 3) * 22, 7, c, 3) for i, c in enumerate([GOLD, TEAL, RED, CYAN, VIOLET, METAL_L]))
    b += rr(176, 160, 30, 8, 3, NAVY, 2.5) + path('M214 190 q10 8 4 22', stroke=OUT, sw=3) + rivets(24, 216, 1, 0) + rivets(206, 216, 1, 0)
    return w, h, b


def camilla_medica():
    """Camilla con correas, monitor de signos vitales y botiquín (equipo de salud de la tripulación de la ISS)."""
    w, h = 250, 200
    b = ''.join(rr(x, 150, 14, 36, 4, METAL_D, 3) for x in (36, 190)) + rr(24, 146, 186, 12, 5, METAL, 3.5)
    b += rr(20, 108, 188, 42, 14, WHITE) + rr(30, 100, 140, 20, 10, '#9fd8f5', 3) + rr(156, 92, 40, 20, 9, WHITE, 3)
    b += ''.join(rr(60 + i * 44, 100, 12, 46, 4, VIOLET, 3) + rr(62 + i * 44, 118, 8, 10, 2, GOLD, 2) for i in range(2))
    b += rr(18, 150, 20, 12, 4, TEAL, 3) + path('M22 156 h12', stroke=WHITE, sw=2)
    # monitor de signos vitales
    b += path('M62 82 V108', stroke=OUT, sw=5) + rr(14, 20, 96, 64, 9, METAL, 3.5) + screen(20, 26, 84, 42, NAVY, 6)
    b += path('M26 48 h12 l5 -12 l7 22 l6 -14 l5 4 h20', stroke=CORAL, sw=2.5) + text(94, 40, '72', 11, GREEN) + text(94, 52, 'BPM', 6, GREEN)
    b += circ(34, 76, 3.5, GREEN, 1.5) + circ(46, 76, 3.5, GOLD, 1.5)
    # botiquín
    b += rr(128, 8, 106, 78, 10, WHITE) + rr(136, 16, 90, 62, 6, '#ececf6', 2.5) + path('M181 24 V70 M159 47 H203', stroke=RED, sw=11) + rr(222, 38, 6, 20, 3, METAL_D, 2)
    b += rr(150, 96, 62, 8, 4, METAL_D, 2.5)
    return w, h, b


def puerta_esclusa():
    """Escotilla circular de esclusa (como la de la ISS) con rueda, luces de presión y rayas de precaución. Sin ventana."""
    w, h = 250, 290
    b = rr(14, 14, 222, 268, 26, METAL)
    b += rr(26, 26, 198, 244, 20, NAVY_L, 3) + rr(26, 26, 198, 14, 7, 'url(#hz)', 0, 'none')
    b += f'<rect x="26" y="256" width="198" height="14" rx="6" fill="url(#hz)"/>'
    b += rr(78, 36, 94, 22, 8, NAVY, 3) + text(125, 52, 'ESCLUSA', 13, GOLD)
    b += circ(125, 160, 82, METAL_L, 4) + circ(125, 160, 68, METAL_D, 3.5)
    b += ''.join(circ(125 + 75 * math.cos(a), 160 + 75 * math.sin(a), 4.5, METAL, 2) for a in [i * math.pi / 4 for i in range(8)])
    b += circ(125, 160, 40, METAL, 3.5)
    b += ''.join(path(f'M125 160 L{125 + 34 * math.cos(a):.1f} {160 + 34 * math.sin(a):.1f}', stroke=OUT, sw=9) + path(f'M125 160 L{125 + 34 * math.cos(a):.1f} {160 + 34 * math.sin(a):.1f}', stroke=GOLD, sw=5) + circ(125 + 34 * math.cos(a), 160 + 34 * math.sin(a), 6, GOLD, 2.5) for a in (-math.pi / 2, math.pi / 6, 5 * math.pi / 6))
    b += circ(125, 160, 11, RED, 3.5)
    b += rr(34, 70, 14, 40, 4, METAL_D, 2.5) + rr(34, 210, 14, 40, 4, METAL_D, 2.5)
    b += circ(196, 72, 11, NAVY, 3) + gauge(196, 72, 11, 0.5, GREEN) + circ(54, 244, 0.1, OUT, 0)
    b += circ(186, 244, 7, GREEN, 2.5) + circ(206, 244, 7, RED, 2.5)
    return w, h, b


def panel_solar():
    """Alas solares sobre un mástil con motor de giro y caja de conexiones."""
    w, h = 300, 240
    b = f'<ellipse cx="150" cy="222" rx="60" ry="12" fill="{METAL_D}" stroke="{OUT}" stroke-width="{SW}"/>'
    b += rr(138, 118, 24, 100, 6, METAL, 3.5) + rr(120, 150, 60, 30, 8, METAL_D) + circ(150, 165, 7, GOLD, 2.5) + rr(168, 184, 26, 18, 4, NAVY, 3) + circ(181, 193, 3, GREEN, 1)
    for side in (-1, 1):
        x0 = 150 + side * 6
        x1 = 150 + side * 132
        pts = f'{x0} 36 {x1} 22 {x1 + side * 4} 110 {x0} 118'
        b += f'<polygon points="{pts}" fill="{NAVY_L}" stroke="{OUT}" stroke-width="{SW}" stroke-linejoin="round"/>'
        for t in (0.25, 0.5, 0.75):
            xt = x0 + (x1 - x0) * t
            b += path(f'M{xt:.1f} {36 - 14 * t:.1f} L{xt + side * 4 * t:.1f} {118 - 8 * t:.1f}', stroke=CYAN, sw=2.5)
        for t in (0.33, 0.66):
            b += path(f'M{x0} {36 + 82 * t:.1f} L{x1 + side * 4:.1f} {22 + 88 * t:.1f}', stroke=CYAN, sw=2.5)
        b += f'<polygon points="{pts}" fill="none" stroke="{OUT}" stroke-width="{SW}" stroke-linejoin="round"/>'
        b += path(f'M{x0 + side * 14} 48 L{x0 + side * 44} 44 L{x0 + side * 38} 66 L{x0 + side * 10} 70Z', WHITE, 'none', 0, 'opacity=".28"')
    b += ''.join(circ(150 + ((i * 53) % 220 - 110) * 1.0, 60 + (i * 37) % 54, 1.8, '#b9b4a8', 0, 'none', 'opacity=".55"') for i in range(12))
    return w, h, b


def roca_hielo():
    """Roca con hielo y un taladro de muestreo (como el TRIDENT de la NASA) con tubos de muestra."""
    w, h = 260, 230
    b = f'<ellipse cx="110" cy="208" rx="100" ry="13" fill="#6e7085" opacity=".5"/>'
    b += path('M16 204 C8 164 26 124 62 112 C80 80 128 74 152 98 C186 98 206 134 198 178 C196 194 188 202 178 204Z', '#a7a9b8', OUT, SW)
    b += path('M62 112 C74 128 72 150 56 164 M152 98 C146 122 156 140 172 150', 'none', OUT, 3, 'opacity=".45"')
    b += path('M30 190 q20 -10 40 -2 M110 196 q20 -12 46 -4', 'none', '#8b8da0', 3)
    for (x, y, hh, c) in [(86, 150, 38, '#bfe6ff'), (110, 156, 54, '#dff3ff'), (136, 160, 34, '#bfe6ff'), (160, 164, 24, '#dff3ff')]:
        b += path(f'M{x - 11} {y + 22} L{x - 2} {y - hh + 22} L{x + 11} {y + 22}Z', c, OUT, 3)
    b += path('M112 128 L116 116', stroke=WHITE, sw=3.5)
    b += ''.join(circ(34 + (i * 41) % 150, 120 + (i * 29) % 70, 1.8, WHITE, 0, 'none', 'opacity=".7"') for i in range(10))
    # torre del taladro
    b += rr(200, 30, 30, 160, 5, METAL_D, 3.5) + rr(188, 22, 54, 38, 8, CORAL) + rr(196, 30, 38, 10, 3, NAVY, 2.5) + circ(215, 48, 4, GREEN, 1.5)
    b += rr(212, 60, 6, 108, 2, METAL_L, 2) + path('M215 168 l-6 -8 M215 168 l6 -8 M213 140 l-4 -4 M217 140 l4 -4', 'none', OUT, 2.5)
    b += rr(196, 184, 38, 10, 4, METAL, 3)
    # tubos de muestra
    b += rr(150, 196, 98, 14, 5, METAL, 3) + ''.join(rr(158 + i * 28, 170, 14, 30, 6, '#dff3ff', 3) + f'<rect x="{161 + i * 28}" y="184" width="8" height="12" rx="2" fill="#bfe6ff"/>' for i in range(3))
    b += path('M20 212 V176 L40 184 L20 192', CORAL, OUT, 2.5)
    return w, h, b


def estacion_limpieza():
    """Estación para limpiar polvo lunar: cepillo suave, soplador y panel de prueba con electrodos (escudo electrodinámico)."""
    w, h = 220, 200
    b = rr(10, 160, 200, 24, 9, METAL_D) + circ(36, 188, 11, NAVY, 3.5) + circ(184, 188, 11, NAVY, 3.5) + circ(36, 188, 3.5, METAL, 1) + circ(184, 188, 3.5, METAL, 1)
    b += rr(46, 38, 12, 126, 4, METAL, 3.5) + path('M52 56 H112', stroke=OUT, sw=11) + path('M52 56 H112', stroke=METAL, sw=6)
    b += rr(108, 44, 14, 26, 4, VIOLET, 3) + ''.join(path(f'M{112 + k * 3} 70 v16', stroke='#7a5a3a', sw=2.2) for k in range(4))
    b += path('M116 74 q-30 40 -44 80', stroke=OUT, sw=9) + path('M116 74 q-30 40 -44 80', stroke=TEAL, sw=5)
    b += rr(64, 150, 24, 10, 4, GOLD, 3)
    b += rr(128, 70, 76, 92, 6, NAVY_L, 4)
    b += path('M136 82 H196 M136 96 H196 M136 110 H196 M136 124 H196 M136 138 H196', 'none', CYAN, 2.2) + path('M136 82 L196 96 M136 110 L196 124', 'none', CYAN, 1.5, 'opacity=".6"')
    b += f'<path d="M128 112 H204 V162 H128Z" fill="#9c9684" opacity=".72"/>'
    b += ''.join(circ(134 + (i * 29) % 66, 118 + (i * 17) % 40, 2.4, '#b9b4a8', 0, 'none') for i in range(14))
    b += rr(128, 70, 76, 92, 6, 'none', 4) + text(166, 62, 'ESCUDO', 9, METAL_L)
    b += rr(20, 120, 22, 16, 4, GOLD, 3) + path('M24 120 q8 -12 14 0', 'none', OUT, 3)
    return w, h, b


# ================================================================== decoración
def casillero():
    w, h = 110, 190
    b = rr(6, 8, 98, 176, 8, METAL) + ''.join(rr(18, 20 + i * 7, 74, 3.5, 1.5, NAVY, 0, 'none') for i in range(5))
    b += rr(14, 60, 82, 112, 6, METAL_D, 3) + path('M55 60 V172', stroke=OUT, sw=2.5)
    b += rr(20, 70, 28, 14, 3, GOLD, 2.5) + text(34, 81, '12', 10, NAVY) + rr(62, 70, 26, 14, 3, WHITE, 2.5)
    b += ''.join(rr(40 + i * 28 - 10, 110, 6, 28, 3, VIOLET, 2.5) for i in range(2)) + rr(20, 150, 20, 14, 3, CORAL, 2) + rivets(18, 176, 4, 24, 2)
    return w, h, b


def casillero_trajes():
    w, h = 150, 200
    b = rr(6, 8, 138, 186, 10, METAL_D) + rr(16, 18, 118, 150, 8, NAVY, 3)
    b += rr(46, 90, 58, 66, 16, WHITE) + rr(52, 108, 46, 22, 5, METAL_D, 2.5) + ''.join(circ(60 + i * 10, 119, 3, [GOLD, GREEN, RED, CYAN][i], 1.5) for i in range(4))
    b += rr(26, 96, 24, 14, 7, WHITE, 3) + rr(100, 96, 24, 14, 7, WHITE, 3) + rr(48, 150, 22, 16, 5, METAL, 3) + rr(80, 150, 22, 16, 5, METAL, 3)
    b += circ(75, 64, 30, '#bfe6ff', 3.5, OUT, 'opacity=".95"') + path('M52 58 Q62 40 84 44', 'none', WHITE, 4, 'opacity=".85"') + rr(52, 82, 46, 10, 4, METAL, 3)
    b += rr(20, 170, 110, 18, 6, METAL, 3) + text(75, 183, 'TRAJES', 9, NAVY) + rivets(24, 176, 1, 0)
    return w, h, b


def planta():
    w, h = 100, 150
    b = f'<ellipse cx="50" cy="140" rx="34" ry="7" fill="{METAL_D}" stroke="{OUT}" stroke-width="3"/>'
    b += path('M26 98 H74 L68 138 H32Z', CORAL, OUT, SW) + rr(24, 92, 52, 12, 5, '#ff9475', 3.5) + path('M38 112 V130 M62 112 V130', 'none', '#cf5a3a', 3)
    b += path('M50 94 V54', stroke='#2f8f3a', sw=5)
    b += leaf(50, 94, 24, 50, -50, TEAL, '#2a8f74') + leaf(50, 94, 24, 50, 50, TEAL, '#2a8f74') + leaf(50, 94, 22, 62, -12, '#7ed9b6', '#2a8f74') + leaf(50, 94, 22, 56, 14, '#5ad6b2', '#2a8f74')
    b += circ(50, 52, 6, GOLD, 2.5) + circ(50, 52, 2, CORAL, 0)
    return w, h, b


def mesa_comedor():
    w, h = 200, 130
    b = rr(20, 60, 160, 14, 6, METAL_L, 3.5) + rr(30, 72, 12, 52, 4, METAL_D, 3) + rr(158, 72, 12, 52, 4, METAL_D, 3) + rr(40, 108, 120, 8, 3, METAL_D, 2.5)
    b += rr(34, 44, 66, 16, 5, METAL, 3) + rr(40, 36, 22, 10, 4, GOLD, 2.5) + rr(66, 38, 22, 10, 4, TEAL, 2.5)
    b += rr(112, 38, 24, 22, 5, WHITE, 3) + path('M136 44 q10 2 0 12', 'none', OUT, 3) + path('M118 38 L122 24', stroke=CORAL, sw=3)
    b += rr(144, 48, 26, 12, 3, NAVY, 2.5) + f'<rect x="147" y="51" width="20" height="6" rx="1.5" fill="{CYAN}"/>' + path('M104 54 h14', stroke=OUT, sw=3)
    return w, h, b


def cajas():
    w, h = 160, 130
    b = rr(10, 56, 100, 68, 7, TAN) + rr(10, 56, 100, 16, 7, TAN_L, 3.5) + f'<rect x="52" y="56" width="14" height="68" fill="#e9dcc0" stroke="{OUT}" stroke-width="2.5"/>'
    b += rr(18, 90, 26, 22, 3, WHITE, 2.5) + path('M23 96 h16 M23 102 h12 M23 107 h14', 'none', OUT, 1.8) + rr(72, 80, 30, 22, 3, GOLD, 2.5) + text(87, 95, 'FRÁGIL', 6, OUT)
    b += rr(86, 74, 64, 50, 7, TAN_D) + rr(86, 74, 64, 12, 7, TAN, 3.5) + path('M118 74 V124', stroke=OUT, sw=2.5) + rr(98, 96, 30, 6, 3, OUT, 0) + ''.join(circ(94 + i * 52, 118, 1.8, OUT, 0) for i in range(2))
    b += rr(22, 22, 66, 38, 7, TAN_L) + rr(22, 22, 66, 12, 7, '#f0d3a0', 3.5) + path('M55 22 V60', stroke=OUT, sw=2.5) + rr(26, 42, 22, 12, 2, WHITE, 2) + path('M30 46 h14', 'none', OUT, 1.5)
    return w, h, b


def bandeja_cultivo():
    w, h = 200, 120
    b = rr(16, 74, 168, 34, 9, METAL) + rr(24, 66, 152, 16, 6, '#7a4f2f', 3.5) + rr(14, 100, 172, 8, 4, METAL_D, 3)
    for i in range(6):
        x = 38 + i * 25
        b += path(f'M{x} 68 V{44 - (i % 3) * 5}', stroke='#2f8f3a', sw=3) + leaf(x, 52 - (i % 3) * 5, 10, 16, -45, TEAL if i % 2 else GREEN, '#2f8f3a') + leaf(x, 52 - (i % 3) * 5, 10, 16, 45, TEAL if i % 2 else GREEN, '#2f8f3a')
    b += path('M176 74 q14 -10 12 -36', stroke=OUT, sw=6) + path('M176 74 q14 -10 12 -36', stroke=METAL_D, sw=3) + rr(180, 24, 18, 16, 5, GOLD, 3)
    b += circ(46, 112, 0.1, OUT, 0) + rr(150, 92, 22, 10, 3, CYAN, 2.5)
    return w, h, b


def extintor():
    w, h = 60, 120
    b = rr(10, 104, 40, 8, 4, METAL_D, 3) + rr(12, 34, 36, 74, 14, RED) + rr(12, 62, 36, 20, 3, WHITE, 3) + path('M20 72 h20', 'none', OUT, 2.5)
    b += rr(22, 22, 16, 14, 4, OUT, 0) + path('M18 22 H42 L46 16 H30', 'none', OUT, 4) + path('M42 26 Q60 38 48 60 Q40 74 46 88', 'none', OUT, 4) + circ(30, 46, 6, WHITE, 2.5) + path('M30 46 l3 -3', stroke=RED, sw=2)
    b += path('M16 44 Q14 70 18 96', stroke=WHITE, sw=3.5, extra='opacity=".5"')
    return w, h, b


def cuadro_tierra():
    w, h = 130, 100
    b = rr(6, 6, 118, 88, 4, WHITE, 3.5) + rr(14, 14, 102, 60, 3, NAVY, 2.5)
    b += circ(58, 44, 22, '#3a8de0', 3) + path('M46 34 q10 -6 16 4 q-2 10 -10 8 q-8 2 -6 -12Z', GREEN, OUT, 1.8) + path('M64 48 q8 -4 12 4 q-4 10 -10 8Z', GREEN, OUT, 1.8)
    b += circ(94, 28, 8, '#d9d6e6', 2.5) + ''.join(circ(20 + (i * 31) % 90, 20 + (i * 23) % 48, 1, WHITE, 0, 'none') for i in range(7))
    b += text(65, 87, 'NUESTRO HOGAR', 9, NAVY)
    b += circ(12, 12, 4, CORAL, 2) + circ(118, 12, 4, CORAL, 2) + rr(52, 2, 26, 9, 2, '#f0e6b8', 1.5)
    return w, h, b


def roca():
    """Roca lunar simple (decoración): sin hielo ni equipo, para el paisaje de cualquier jornada."""
    w, h = 150, 100
    b = f'<ellipse cx="75" cy="88" rx="62" ry="9" fill="#6e7085" opacity=".5"/>'
    b += path('M14 86 C8 62 24 38 52 34 C64 14 100 14 114 36 C134 40 144 62 136 84 Z', '#a7a9b8', OUT, SW)
    b += path('M52 34 C60 46 58 62 46 70 M114 36 C108 50 116 62 126 66', 'none', OUT, 3, 'opacity=".45"')
    b += path('M24 78 q18 -8 38 -2 M84 80 q16 -8 36 -4', 'none', '#8b8da0', 3)
    b += ''.join(circ(26 + (i * 37) % 100, 44 + (i * 23) % 36, 1.8, WHITE, 0, 'none', 'opacity=".5"') for i in range(8))
    return w, h, b


def radar_tormentas():
    """Radar de tormentas solares: antena giratoria sobre una torre y consola con pantalla de barrido."""
    w, h = 230, 230
    b = rr(98, 74, 24, 96, 5, METAL_D, 3.5) + path('M98 170 L78 190 M122 170 L142 190', stroke=OUT, sw=5)
    b += path('M30 58 Q110 -10 190 58 Q110 34 30 58Z', WHITE, OUT, SW) + path('M46 56 Q110 14 174 56', 'none', METAL_D, 3)
    b += path('M110 40 V8', stroke=OUT, sw=3) + circ(110, 6, 7, GOLD, 3) + path('M80 70 H140', stroke=OUT, sw=7) + path('M80 70 H140', stroke=METAL, sw=3)
    b += path('M86 24 q-14 8 -18 26 M134 24 q14 8 18 26', 'none', CYAN, 3, 'opacity=".7"')
    b += rr(24, 150, 182, 72, 12, METAL)
    b += screen(34, 158, 80, 56, '#0e2a4d', 8) + circ(74, 186, 20, 'none', 2, CYAN) + circ(74, 186, 10, 'none', 1.5, CYAN) + path('M74 186 L90 172', stroke=GREEN, sw=2.5) + circ(86, 192, 2.5, CORAL, 0) + circ(64, 178, 2.5, GOLD, 0)
    b += ''.join(circ(138 + (i % 3) * 22, 172 + (i // 3) * 24, 8, c, 3) for i, c in enumerate([RED, GOLD, GREEN, CYAN, VIOLET, METAL_L]))
    b += rr(168, 158, 30, 8, 3, NAVY, 2.5) + rivets(30, 216, 1, 0) + rivets(200, 216, 1, 0)
    return w, h, b


def monitor_radiacion():
    """Monitor de radiación (dosímetro): símbolo de radiación, aguja de dosis y barra de alerta."""
    w, h = 200, 220
    b = rr(30, 150, 140, 62, 10, METAL_D) + rr(60, 130, 80, 26, 6, METAL, 3.5) + rivets(42, 204, 5, 29, 2.2)
    b += rr(18, 14, 164, 134, 14, METAL) + screen(28, 24, 144, 92, NAVY, 10)
    b += circ(72, 70, 28, GOLD, 3.5)
    b += ''.join(f'<path d="M72 70 L{72 + 26 * math.cos(a):.1f} {70 + 26 * math.sin(a):.1f} A26 26 0 0 1 {72 + 26 * math.cos(a + math.pi / 3):.1f} {70 + 26 * math.sin(a + math.pi / 3):.1f}Z" fill="{OUT}"/>' for a in (math.radians(-90 + 0), math.radians(30), math.radians(150)))
    b += circ(72, 70, 5, GOLD, 2.5)
    b += gauge(138, 56, 22, 0.7, CORAL) + text(138, 92, 'DOSIS', 9, METAL_L)
    b += rr(40, 104, 120, 8, 4, '#2a1d4a', 2) + f'<rect x="42" y="106" width="48" height="4" rx="2" fill="{GREEN}"/><rect x="90" y="106" width="30" height="4" fill="{GOLD}"/><rect x="120" y="106" width="38" height="4" rx="2" fill="{RED}"/>'
    b += ''.join(circ(46 + i * 24, 134, 6, [GREEN, GOLD, RED, CYAN][i], 2.5) for i in range(4)) + rr(142, 128, 26, 10, 3, NAVY, 2.5)
    return w, h, b


def reciclador_roto():
    """El reciclador de oxígeno roto: grieta en la columna, aire que se escapa y luz de alarma. De aquí sale la fractura."""
    w, h, b = reciclador_aire()
    b += path('M62 96 L50 124 L68 142 L48 170 L66 184', 'none', OUT, 9) + path('M62 96 L50 124 L68 142 L48 170 L66 184', 'none', '#0b0c0f', 5)
    b += path('M62 96 L50 124 L68 142 L48 170 L66 184', 'none', GOLD, 1.8, 'opacity=".8"')
    b += ''.join(circ(80 + i * 16, 118 + (i % 2) * 18 - i * 8, 8 - i, '#dff3ff', 2.2, OUT, 'opacity=".9"') for i in range(4))
    b += path('M84 132 q20 -8 34 -26', 'none', CYAN, 3.5, 'opacity=".7"')
    b += circ(130, 62, 7, RED, 2.5) + rr(50, 4, 90, 16, 6, GOLD, 3) + text(95, 16, 'FUGA', 10, NAVY)
    return w, h, b


PROPS = {
    # nombre: (función, ¿interactiva?)
    'reciclador-aire': (reciclador_aire, True), 'estacion-comida': (estacion_comida, True),
    'tanque-algas': (tanque_algas, True), 'rack-plantas': (rack_plantas, True),
    'consola-puente': (consola_puente, True), 'consola-antena': (consola_antena, True),
    'camilla-medica': (camilla_medica, True), 'reciclador-roto': (reciclador_roto, True), 'roca': (roca, False),
    'panel-solar': (panel_solar, True), 'roca-hielo': (roca_hielo, True), 'estacion-limpieza': (estacion_limpieza, True),
    'casillero': (casillero, False), 'casillero-trajes': (casillero_trajes, False), 'planta': (planta, False),
    'mesa-comedor': (mesa_comedor, False), 'cajas': (cajas, False), 'bandeja-cultivo': (bandeja_cultivo, False),
    'extintor': (extintor, False), 'cuadro-tierra': (cuadro_tierra, False),
}

PAD = 14
DEFS = (f'<pattern id="hz" patternUnits="userSpaceOnUse" width="16" height="16" patternTransform="rotate(45)">'
        f'<rect width="8" height="16" fill="{GOLD}"/><rect x="8" width="8" height="16" fill="{OUT}"/></pattern>')


def svg_of(w, h, body, marked):
    W, H = w + PAD * 2, h + PAD * 2
    defs = DEFS
    inner = f'<g stroke-linejoin="round">{body}</g>'
    if marked:  # contorno blanco fino alrededor de la silueta: "esto se puede usar"
        defs += (f'<filter id="marcado" filterUnits="userSpaceOnUse" x="{-PAD}" y="{-PAD}" width="{W}" height="{H}">'
                 f'<feMorphology in="SourceAlpha" operator="dilate" radius="5" result="d"/><feFlood flood-color="{WHITE}"/>'
                 f'<feComposite in2="d" operator="in" result="p"/><feMerge><feMergeNode in="p"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')
        inner = f'<g filter="url(#marcado)">{inner}</g>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="{-PAD} {-PAD} {W} {H}">'
            f'<defs>{defs}</defs>{inner}</svg>')


def main() -> None:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, 'juego', 'public', 'game', 'props')
    os.makedirs(out, exist_ok=True)
    for name in os.listdir(out):
        if name.endswith('.svg'):
            os.remove(os.path.join(out, name))
    for name, (fn, interactive) in PROPS.items():
        w, h, body = fn()
        with open(os.path.join(out, f'{name}.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_of(w, h, body, False))
        if interactive:
            with open(os.path.join(out, f'{name}-marcado.svg'), 'w', encoding='utf-8') as f:
                f.write(svg_of(w, h, body, True))
    print(f'{len(PROPS)} objetos en {out}')


if __name__ == '__main__':
    main()
