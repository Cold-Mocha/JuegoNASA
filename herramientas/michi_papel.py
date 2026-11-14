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
    'tomas': {'name': 'Tomás', 'fur': '#a7a9b8', 'band': '#4cc3f5', 'nose': '#ee5fd6', 'ear': '#ff9ad9'},
    'luna':  {'name': 'Luna',  'fur': '#f1e4c8', 'band': '#ee5fd6', 'nose': '#ff7fb8', 'ear': '#ff9ad9'},
    # marciano: pelaje verde y antenitas (caben dentro de la burbuja del casco)
    'zib':   {'name': 'Zib',   'fur': '#7ed957', 'band': '#9b7bff', 'nose': '#2f8f3a', 'ear': '#c6f28a', 'antennae': '#ffcb47', 'eyes': 1.45},
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


def eyes_mouth(expr, k=1.0):
    """k agranda los ojos abiertos (variantes de ojos grandes, p. ej. el marciano); con k > 1 llevan brillo."""
    if expr == 'hurt':
        eyes = f'<path d="M-8.5 -24.5 l5 5 m0 -5 l-5 5 M3.5 -24.5 l5 5 m0 -5 l-5 5" stroke="{OUT}" stroke-width="2.6" stroke-linecap="round"/>'
        mouth = f'<path d="M-3.5 -11.5 q3.5 -3 7 0" fill="none" stroke="{OUT}" stroke-width="1.8" stroke-linecap="round"/>'
    elif expr == 'smile':
        eyes = f'<path d="M-9 -20 q3 -4 6 0 M3 -20 q3 -4 6 0" fill="none" stroke="{OUT}" stroke-width="2.4" stroke-linecap="round"/>'
        mouth = f'<path d="M-4.5 -13.5 q4.5 6 9 0 z" fill="{OUT}"/><path d="M-2.2 -11.4 q2.2 1.6 4.4 0" fill="none" stroke="#ff7fb8" stroke-width="1.6" stroke-linecap="round"/>'
    elif expr == 'closed':
        eyes = f'<path d="M-9 -21 q3 2 6 0 M3 -21 q3 2 6 0" fill="none" stroke="{OUT}" stroke-width="2.4" stroke-linecap="round"/>'
        mouth = None
    elif expr == 'half':
        eyes = f'<ellipse cx="-6" cy="-20.5" rx="{2.6 * k:.2f}" ry="1.5" fill="{OUT}"/><ellipse cx="6" cy="-20.5" rx="{2.6 * k:.2f}" ry="1.5" fill="{OUT}"/>'
        mouth = None
    elif expr == 'focus':   # concentrado al usar una consola
        eyes = f'<ellipse cx="-5" cy="-21" rx="{2.4 * k:.2f}" ry="{3.2 * k:.2f}" fill="{OUT}"/><ellipse cx="7" cy="-21" rx="{2.4 * k:.2f}" ry="{3.2 * k:.2f}" fill="{OUT}"/>'
        mouth = f'<path d="M-1 -13 h4" stroke="{OUT}" stroke-width="1.7" stroke-linecap="round"/>'
    else:
        eyes = f'<ellipse cx="-6" cy="-21" rx="{2.6 * k:.2f}" ry="{3.6 * k:.2f}" fill="{OUT}"/><ellipse cx="6" cy="-21" rx="{2.6 * k:.2f}" ry="{3.6 * k:.2f}" fill="{OUT}"/>'
        if k > 1:  # brillo en los ojos grandes
            eyes += f'<circle cx="{-6 + 1.1 * k:.2f}" cy="{-21 - 1.4 * k:.2f}" r="{0.9 * k:.2f}" fill="#fff"/><circle cx="{6 + 1.1 * k:.2f}" cy="{-21 - 1.4 * k:.2f}" r="{0.9 * k:.2f}" fill="#fff"/>'
        mouth = None
    if mouth is None:
        mouth = f'<path d="M-2.5 -12.8 q2.5 2 5 0" fill="none" stroke="{OUT}" stroke-width="1.6" stroke-linecap="round"/>'
    return eyes, mouth


def l_head(p, v):
    """Cabeza del gato: idéntica con y sin casco."""
    e = p.ear
    eyes, mouth = eyes_mouth(p.expr, v.get('eyes', 1.0))
    nose = '' if p.expr == 'smile' else f'<path d="M-1.9 -16.2 h3.8 l-1.9 2.3 z" fill="{v["nose"]}"/>'
    antennae = ''
    if 'antennae' in v:  # antenitas de marciano: entre las orejas, delante de ellas y detrás de la cara
        antennae = ''.join(
            f'<g transform="{rot(sg * -e, sg * -3.5, -37)}">'
            f'<path d="M{sg * -3.5} -37 Q{sg * -3} -45 {sg * -6.5} -49" fill="none" stroke="{OUT}" stroke-width="5" stroke-linecap="round"/>'
            f'<path d="M{sg * -3.5} -37 Q{sg * -3} -45 {sg * -6.5} -49" fill="none" stroke="{v["fur"]}" stroke-width="2.2" stroke-linecap="round"/>'
            f'<circle cx="{sg * -6.5}" cy="-49.5" r="3.6" fill="{v["antennae"]}" stroke="{OUT}" stroke-width="2.2"/></g>'
            for sg in (1, -1))
    return (f'<g id="cabeza">'
            f'<path transform="{rot(-e,-11,-34)}" d="M-18 -30 L-14 -48 L-3 -38 Z" fill="{v["fur"]}" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path transform="{rot(e,11,-34)}" d="M18 -30 L14 -48 L3 -38 Z" fill="{v["fur"]}" stroke="{OUT}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path transform="{rot(-e,-11,-34)}" d="M-14.5 -33 L-13.5 -42 L-8 -37 Z" fill="{v["ear"]}"/>'
            f'<path transform="{rot(e,11,-34)}" d="M14.5 -33 L13.5 -42 L8 -37 Z" fill="{v["ear"]}"/>'
            f'{antennae}'
            f'<ellipse cx="0" cy="-22" rx="19.5" ry="17.5" fill="{v["fur"]}" stroke="{OUT}" stroke-width="3"/>'
            f'{eyes}{nose}{mouth}</g>')


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
