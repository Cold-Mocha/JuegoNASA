"""Michi astronauta — estilo papel recortado (2.5D).

- La cabeza es SIEMPRE la misma (mismo tamaño y cara con o sin casco).
- El casco es una burbuja de vidrio que se superpone a la cabeza: no reemplaza la cara.
- Sin sombra propia: la sombra la dibuja el motor sobre el piso.
- El borde blanco de papel se agrega al rasterizar (ver render_michi_papel.py).

Coordenadas locales mirando a la DERECHA; origen entre los pies (y=31 es el suelo).
"""
from __future__ import annotations
from dataclasses import dataclass, field

OUT = '#0e0b33'
SUIT = '#f5f5f2'
SUIT_BACK = '#dedded'
GEAR = '#c4c2e0'
FRAME = 128
ROOT = 'translate(66 84) scale(0.92)'   # deja margen para el borde de papel y el balanceo
FEET = (66, 84 + 31 * 0.92)            # ancla de los pies en el frame 1x  (≈ 66, 112.5)

VARIANTS = {
    'miu':   {'name': 'Miu',   'fur': '#f2a65a', 'band': '#ffcb47', 'nose': '#ee5fd6', 'ear': '#ff9ad9'},
    # Leo, leopardo de las nieves (Panthera uncia): pelaje gris humo claro, orejas redondas, manchas oscuras y cola gruesa moteada
    'leo': {'name': 'Leo', 'fur': '#cdd0dc', 'band': '#4cc3f5', 'nose': '#e58fa6', 'ear': '#b9bdd0', 'spots': '#4a4c63', 'round_ears': True},
    # güiña (Leopardus guigna, felino chileno): pelaje amarillo ocre con manchas negras, orejas redondas y ojos turquesa
    'luna':  {'name': 'Güiña', 'fur': '#e9b949', 'band': '#ee5fd6', 'nose': '#c9707f', 'ear': '#c98a2e', 'spots': '#1f1812', 'round_ears': True, 'eye': '#2ad0c6'},
    # marciano: pelaje verde y antenitas (caben dentro de la burbuja del casco)
    'zib':   {'name': 'Zib',   'fur': '#7ed957', 'band': '#9b7bff', 'nose': '#2f8f3a', 'ear': '#c6f28a', 'antennae': '#ffcb47', 'eyes': 1.22},
}


@dataclass
class Pose:
    jump: float = 0
    bob: float = 0
    legB: tuple = (0, 0)
    legF: tuple = (0, 0)
    tail: float = 0
    tilt: float = 0
    sx: float = 1
    sy: float = 1
    expr: str = 'normal'     # normal | half | closed | smile | hurt | focus
    ear: float = 0
    hurt_tint: bool = False
    extra: list = field(default_factory=list)


def rot(a, x, y):
    return f'rotate({a:.2f} {x} {y})'


# ------------------------------------------------------------------ capas
def l_tail(p, v):
    d = 'M-16 16 Q-44 16 -42 -6 Q-41 -16 -33 -17'
    if 'spots' in v:  # cola gruesa de leopardo de las nieves, con manchas
        return (f'<g id="cola" transform="{rot(p.tail, -16, 16)}">'
                f'<path d="{d}" fill="none" stroke="{OUT}" stroke-width="16" stroke-linecap="round"/>'
                f'<path d="{d}" fill="none" stroke="{v["fur"]}" stroke-width="11" stroke-linecap="round"/>'
                f'<path d="{d}" fill="none" stroke="{v["spots"]}" stroke-width="4.2" stroke-linecap="round" stroke-dasharray="0.1 8.5" stroke-dashoffset="-3"/></g>')
    return (f'<g id="cola" transform="{rot(p.tail, -16, 16)}">'
            f'<path d="{d}" fill="none" stroke="{OUT}" stroke-width="11" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{v["fur"]}" stroke-width="6" stroke-linecap="round"/></g>')


def l_leg(id_, x, off, fill):
    return (f'<g id="{id_}" transform="translate({off[0]:.2f} {off[1]:.2f})">'
            f'<ellipse cx="{x}" cy="27" rx="7.5" ry="6" fill="{fill}" stroke="{OUT}" stroke-width="3"/></g>')


def l_backpack(p, v):
    return f'<rect id="mochila" x="-25" y="-2" width="12" height="22" rx="5" fill="{GEAR}" stroke="{OUT}" stroke-width="3"/>'


def l_body(p, v):
    return (f'<g id="cuerpo"><rect x="-17" y="-4" width="34" height="30" rx="12" fill="{SUIT}" stroke="{OUT}" stroke-width="3"/>'
            f'<rect x="-15.5" y="10" width="31" height="6" rx="2" fill="{v["band"]}"/></g>')


def l_collar(p, v):
    return f'<rect id="cuello" x="-14" y="-9" width="28" height="9" rx="4.5" fill="{GEAR}" stroke="{OUT}" stroke-width="3"/>'


def lighten(hex_, a):
    """Mezcla un color con blanco (a = 0..1): sirve para el morro, más claro que el pelaje."""
    r, g, b = (int(hex_[i:i + 2], 16) for i in (1, 3, 5))
    return '#%02x%02x%02x' % tuple(round(c + (255 - c) * a) for c in (r, g, b))


# Boca felina caricaturizada: nariz triangular, línea corta bajo la nariz y dos curvitas en «ω» (proporciones de dibujo animado).
def cat_mouth(kind='neutral'):
    w = f'stroke="{OUT}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"'
    if kind == 'open':    # sonrisa: boca abierta en «ω» con lengüita
        return (f'<path d="M0 -13.4 v1" {w}/><path d="M-5.6 -12.4 q2.8 2.4 5.6 0 q2.8 2.4 5.6 0 q-0.4 6.6 -5.6 6.6 q-5.2 0 -5.6 -6.6z" fill="{OUT}" stroke="{OUT}" stroke-width="1.2" stroke-linejoin="round"/>'
                f'<path d="M-2.5 -7.7 q2.5 -2.4 5 0 q-2.5 2.6 -5 0z" fill="#ff7fb8"/>')
    if kind == 'hurt':    # «ω» al revés
        return f'<path d="M0 -13.4 v1.6 M0 -11.8 q-2.6 -2.6 -5.4 -0.2 M0 -11.8 q2.6 -2.6 5.4 -0.2" {w}/>'
    if kind == 'flat':    # concentrado
        return f'<path d="M0 -13.4 v1.6 M-3.4 -11.8 h6.8" {w}/>'
    return f'<path d="M0 -13.4 v1.8 M0 -11.6 q-2.6 3.2 -5.4 0.4 M0 -11.6 q2.6 3.2 5.4 0.4" {w}/>'


def eyes_mouth(expr, k=1.0, eye=None):
    """Ojos estilo anime: más grandes y más separados que antes (x = ±7,6), con brillo doble; k agranda aún más los ojos (p. ej. el marciano)."""
    X, Y = 7.6, -21.4
    spark = lambda x, y, k_=1.0: (f'<circle cx="{x + 1.3 * k_:.2f}" cy="{y - 1.7 * k_:.2f}" r="{1.25 * k_:.2f}" fill="#fff"/>'
                                 f'<circle cx="{x - 1.2 * k_:.2f}" cy="{y + 1.9 * k_:.2f}" r="{0.6 * k_:.2f}" fill="#fff" opacity=".9"/>')
    if expr == 'hurt':
        eyes = f'<path d="M-{X + 3.4} -24.6 l5.6 5.6 m0 -5.6 l-5.6 5.6 M{X - 2.2} -24.6 l5.6 5.6 m0 -5.6 l-5.6 5.6" stroke="{OUT}" stroke-width="2.6" stroke-linecap="round"/>'
        mouth = cat_mouth('hurt')
    elif expr == 'smile':   # ojos felices en arco
        eyes = f'<path d="M-{X + 3.8} -20 q3.8 -5.4 7.6 0 M{X - 3.8} -20 q3.8 -5.4 7.6 0" fill="none" stroke="{OUT}" stroke-width="2.6" stroke-linecap="round"/>'
        mouth = cat_mouth('open')
    elif expr == 'closed':
        eyes = f'<path d="M-{X + 3.6} -21.4 q3.6 2.6 7.2 0 M{X - 3.6} -21.4 q3.6 2.6 7.2 0" fill="none" stroke="{OUT}" stroke-width="2.6" stroke-linecap="round"/>'
        mouth = None
    elif expr == 'half':
        eyes = f'<ellipse cx="-{X}" cy="-20.8" rx="{3.4 * k:.2f}" ry="1.8" fill="{OUT}"/><ellipse cx="{X}" cy="-20.8" rx="{3.4 * k:.2f}" ry="1.8" fill="{OUT}"/>'
        mouth = None
    elif expr == 'focus':   # concentrado al usar una consola (mira un poco a la derecha)
        xs = (-X + 1.0, X + 1.0)
        if eye:
            eyes = ''.join(f'<ellipse cx="{x}" cy="{Y}" rx="4.0" ry="4.6" fill="{eye}" stroke="{OUT}" stroke-width="1.4"/><ellipse cx="{x + 0.6}" cy="{Y}" rx="1.5" ry="3.9" fill="{OUT}"/>{spark(x, Y, 0.9)}' for x in xs)
        else:
            eyes = ''.join(f'<ellipse cx="{x}" cy="{Y}" rx="{3.0 * k:.2f}" ry="{4.3 * k:.2f}" fill="{OUT}"/>{spark(x, Y, k)}' for x in xs)
        mouth = cat_mouth('flat')
    else:
        if eye:  # ojos de color: iris grande, pupila vertical (felina) y doble brillo
            eyes = ''.join(f'<ellipse cx="{x}" cy="{Y}" rx="4.6" ry="5.4" fill="{eye}" stroke="{OUT}" stroke-width="1.5"/><ellipse cx="{x}" cy="{Y}" rx="1.6" ry="4.4" fill="{OUT}"/>{spark(x, Y, 1.15)}' for x in (-X, X))
        else:
            eyes = ''.join(f'<ellipse cx="{x}" cy="{Y}" rx="{3.4 * k:.2f}" ry="{4.8 * k:.2f}" fill="{OUT}"/>{spark(x, Y, k * 1.1)}' for x in (-X, X))
        mouth = None
    if mouth is None:
        mouth = cat_mouth()
    # boca un poco más pequeña en proporción a los ojos (caricatura)
    mouth = f'<g transform="translate(0 -11.6) scale(.9) translate(0 11.6)">{mouth}</g>'
    return eyes, mouth


def l_head(p, v):
    """Cabeza del gato: idéntica con y sin casco."""
    e = p.ear
    eyes, mouth = eyes_mouth(p.expr, v.get('eyes', 1.0), v.get('eye'))
    nose = f'<path d="M-2.7 -17 h5.4 l-2.7 3.5 z" fill="{v["nose"]}" stroke="{OUT}" stroke-width="0.9" stroke-linejoin="round"/>'
    # morro: dos mejillas claras más grandes que antes (caricatura felina), debajo de la nariz y la boca
    muzzle = ''.join(f'<ellipse cx="{sg * 5}" cy="-11.6" rx="6.8" ry="5.3" fill="{lighten(v["fur"], 0.55)}"/>' for sg in (-1, 1))
    antennae = ''
    if 'antennae' in v:  # antenitas de marciano: entre las orejas, delante de ellas y detrás de la cara
        antennae = ''.join(
            f'<g transform="{rot(sg * -e, sg * -3.5, -37)}">'
            f'<path d="M{sg * -3.5} -37 Q{sg * -3} -45 {sg * -6.5} -49" fill="none" stroke="{OUT}" stroke-width="5" stroke-linecap="round"/>'
            f'<path d="M{sg * -3.5} -37 Q{sg * -3} -45 {sg * -6.5} -49" fill="none" stroke="{v["fur"]}" stroke-width="2.2" stroke-linecap="round"/>'
            f'<circle cx="{sg * -6.5}" cy="-49.5" r="3.6" fill="{v["antennae"]}" stroke="{OUT}" stroke-width="2.2"/></g>'
            for sg in (1, -1))
    if v.get('round_ears'):  # orejitas redondas (leopardo de las nieves)
        ear_l, ear_r = 'M-18 -29 C-22 -41 -17 -49 -10.5 -48 C-5 -47 -2.5 -42 -3 -37 Z', 'M18 -29 C22 -41 17 -49 10.5 -48 C5 -47 2.5 -42 3 -37 Z'
        inner_l, inner_r = 'M-14.5 -33 C-15.5 -39 -13.5 -43 -11 -42.5 C-8.5 -42 -7.5 -39 -8 -36.5 Z', 'M14.5 -33 C15.5 -39 13.5 -43 11 -42.5 C8.5 -42 7.5 -39 8 -36.5 Z'
    else:
        ear_l, ear_r = 'M-18 -30 L-14 -48 L-3 -38 Z', 'M18 -30 L14 -48 L3 -38 Z'
        inner_l, inner_r = 'M-14.5 -33 L-13.5 -42 L-8 -37 Z', 'M14.5 -33 L13.5 -42 L8 -37 Z'
    spots = ''
    if 'spots' in v:  # manchas: frente, mejillas y borde oscuro de las orejas
        c = v['spots']
        spots = (''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}"/>' for x, y, rx, ry in
                         [(-8, -33, 2.4, 1.6), (0, -35, 2.2, 1.7), (8, -33, 2.4, 1.6), (-4, -29.5, 1.7, 1.2), (4, -29.5, 1.7, 1.2),
                          (-15.5, -19, 1.9, 1.5), (15.5, -19, 1.9, 1.5), (-14, -14.5, 1.6, 1.3), (14, -14.5, 1.6, 1.3)]))
    # bigotes de gato: tres por lado, salen de las mejillas (quedan dentro de la burbuja del casco)
    whiskers = f'<g stroke="{OUT}" stroke-width="1.7" stroke-linecap="round" fill="none">' + ''.join(
        f'<path d="M{sg * 7.5} {y0} Q{sg * 16} {y0 + dy * 0.35} {sg * 25} {y0 + dy}"/>'
        for sg in (-1, 1) for y0, dy in ((-16.5, -5), (-14, 0.5), (-11.5, 5.5))) + '</g>'
    return (f'<g id="cabeza">'
            f'<path transform="{rot(-e,-11,-34)}" d="{ear_l}" fill="{v["fur"]}" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path transform="{rot(e,11,-34)}" d="{ear_r}" fill="{v["fur"]}" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path transform="{rot(-e,-11,-34)}" d="{inner_l}" fill="{v["ear"]}"/>'
            f'<path transform="{rot(e,11,-34)}" d="{inner_r}" fill="{v["ear"]}"/>'
            f'{antennae}'
            f'<ellipse cx="0" cy="-22" rx="19.5" ry="17.5" fill="{v["fur"]}" stroke="{OUT}" stroke-width="3"/>'
            f'{spots}{muzzle}{eyes}{nose}{mouth}{whiskers}</g>')


def l_helmet(p, v):
    """Burbuja de vidrio: se dibuja ENCIMA de la cabeza; no tapa ni achica la cara."""
    return (f'<g id="casco">'
            f'<circle cx="0" cy="-25" r="27.5" fill="#bfe6ff" fill-opacity=".12" stroke="{OUT}" stroke-width="3"/>'
            f'<path d="M-19 -39 A23 23 0 0 1 -5 -48" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>'
            f'<circle cx="15" cy="-43" r="2.2" fill="#fff" opacity=".75"/>'
            f'<rect x="-17" y="-7" width="34" height="8" rx="4" fill="{GEAR}" stroke="{OUT}" stroke-width="3"/></g>')


ORDER = ['cola', 'pierna-trasera', 'mochila', 'cuerpo', 'pierna-delantera', 'cuello', 'cabeza', 'casco']
BODY = {'cola', 'mochila', 'cuerpo', 'cuello', 'cabeza', 'casco'}


def frame_svg(p: Pose, v, uid='a', size=FRAME, helmet=False, only=None):
    L = {
        'cola': l_tail(p, v),
        'pierna-trasera': l_leg('pierna-trasera', -6.5, p.legB, SUIT_BACK),
        'mochila': l_backpack(p, v),
        'cuerpo': l_body(p, v),
        'pierna-delantera': l_leg('pierna-delantera', 6.5, p.legF, SUIT),
        'cuello': l_collar(p, v),
        'cabeza': l_head(p, v),
        'casco': l_helmet(p, v),
    }
    parts = []
    for n in ORDER:
        if n == 'casco' and not helmet:
            continue
        if only and n != only:
            continue
        dy = p.jump + (p.bob if n in BODY else 0)
        parts.append(f'<g transform="translate(0 {dy:.2f})">{L[n]}</g>')
    body = ''.join(parts)
    tf = f'rotate({p.tilt:.2f} 0 31) translate(0 31) scale({p.sx:.3f} {p.sy:.3f}) translate(0 -31)'
    flt = ''
    if p.hurt_tint:
        flt = f'<defs><filter id="h-{uid}"><feColorMatrix type="matrix" values="1 .3 .3 0 .1  0 .62 0 0 0  0 0 .62 0 0  0 0 0 1 0"/></filter></defs>'
        body = f'<g filter="url(#h-{uid})">{body}</g>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {FRAME} {FRAME}">{flt}'
            f'<g transform="{ROOT}"><g transform="{tf}">{body}</g>{"".join(p.extra)}</g></svg>')


def spark(x, y, r, color='#ffcb47'):
    k = r * 0.22
    return f'<path transform="translate({x} {y})" fill="{color}" stroke="{OUT}" stroke-width="1.5" d="M0 {-r} L{k} {-k} L{r} 0 L{k} {k} L0 {r} L{-k} {k} L{-r} 0 L{-k} {-k}Z"/>'


# ------------------------------------------------------------------ animaciones (estilo papel: pocos frames, poses claras)
ANIMS = {
    # nombre: (frames, fps, loop, descripción)
    'idle': ([Pose(), Pose(jump=-1.2, sy=1.015, sx=0.99)], 2, True, 'Quieto, respira'),
    'blink': ([Pose(expr='half'), Pose(expr='closed'), Pose(expr='half')], 12, False, 'Parpadeo (insertar cada 2-4 s sobre idle)'),
    'walk': ([Pose(legF=(8, -4), legB=(-7, 0), tilt=-5, jump=-2.5, tail=-2),
              Pose(legF=(-7, 0), legB=(8, -4), tilt=5, jump=-2.5, tail=2)], 6, True, 'Caminar: balanceo de papel'),
    'use': ([Pose(tilt=7, expr='focus', legF=(3, 0)),
             Pose(tilt=10, sy=0.95, sx=1.03, expr='focus', legF=(4, 0), extra=[spark(32, -10, 7, '#4cc3f5')]),
             Pose(tilt=4, expr='normal', extra=[spark(34, -16, 5, '#4cc3f5')])], 8, False, 'Usar consola: se inclina y presiona'),
    'hurt': ([Pose(expr='hurt', hurt_tint=True, sx=1.1, sy=0.9, tilt=-7, ear=-6, tail=12),
              Pose(expr='hurt', hurt_tint=True, sx=0.94, sy=1.06, tilt=6, ear=-6, tail=-8),
              Pose(expr='hurt', tilt=-2, ear=-3)], 10, False, 'Recibir daño: sacudón rojo'),
    'smile': ([Pose(expr='smile', jump=-4, sy=1.04, sx=0.97, ear=5, tail=6),
               Pose(expr='smile', jump=0, sy=0.97, sx=1.03, ear=5, tail=-4)], 4, True, 'Sonreír: feliz, saltitos'),
}
