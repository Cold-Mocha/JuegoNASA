"""Rig del michi astronauta: capas SVG con pivotes + poses por frame.

Coordenadas locales del personaje (mirando a la DERECHA): origen entre los pies,
el cuerpo va de y≈-55 (orejas) a y≈30 (botas). El frame es de 128×128 y el personaje
se coloca con translate(64, 88) scale(1.1). Para mirar a la izquierda se voltea en el motor.
"""
from __future__ import annotations
import math
from dataclasses import dataclass, field

OUTLINE = '#0e0b33'
FRAME = 128
ROOT = 'translate(64 88) scale(1.1)'

VARIANTS = {
    'miu':   {'name': 'Miu',   'fur': '#f2a65a', 'furDark': '#c4733a', 'accent': '#ffcb47', 'nose': '#ee5fd6'},
    'tomas': {'name': 'Tomás', 'fur': '#a7a9b8', 'furDark': '#6e7085', 'accent': '#4cc3f5', 'nose': '#ee5fd6'},
    'luna':  {'name': 'Luna',  'fur': '#4a4466', 'furDark': '#2a2540', 'accent': '#ee5fd6', 'nose': '#ff9ad9'},
}
SUIT = '#f5f5f2'
SUIT_SHADE = '#d9d8ea'
GEAR = '#c4c2e0'
GLASS = '#0e0b33'


@dataclass
class Pose:
    bob: float = 0          # desplazamiento vertical del torso (+ abajo)
    jump: float = 0         # salto de todo el cuerpo (− arriba)
    legB: float = 0         # ángulo pierna trasera (grados)
    legF: float = 0         # ángulo pierna delantera
    armB: float = 10        # ángulo brazo trasero (0 = colgando)
    armF: float = -10       # ángulo brazo delantero
    tail: float = 0         # ángulo de la cola
    head: float = 0         # inclinación del casco
    ear: float = 0          # tic de orejas
    blink: float = 0        # 0 abierto, 1 cerrado
    sx: float = 1           # squash/stretch
    sy: float = 1
    hurt: bool = False
    shadow: float = 1       # escala de la sombra
    extra: list[str] = field(default_factory=list)  # efectos (destellos, gotas)


# ---------------------------------------------------------------- capas
def rot(angle: float, px: float, py: float) -> str:
    return f'rotate({angle:.2f} {px} {py})'


def layer_shadow(p: Pose, v) -> str:
    s = p.shadow
    return f'<g id="sombra"><ellipse cx="0" cy="30" rx="{24*s:.1f}" ry="{6.5*s:.1f}" fill="#000" opacity=".28"/></g>'


def layer_tail(p: Pose, v) -> str:
    return (f'<g id="cola" transform="{rot(p.tail, -14, 14)}">'
            f'<path d="M-14 14 Q-36 10 -31 -8 Q-29 -15 -24 -13" fill="none" stroke="{OUTLINE}" stroke-width="10" stroke-linecap="round"/>'
            f'<path d="M-14 14 Q-36 10 -31 -8 Q-29 -15 -24 -13" fill="none" stroke="{v["fur"]}" stroke-width="6" stroke-linecap="round"/>'
            f'<path d="M-29 -4 Q-30 -11 -25 -12" fill="none" stroke="{v["furDark"]}" stroke-width="6" stroke-linecap="round"/>'
            '</g>')


def leg(id_: str, x: float, angle: float, shade: bool) -> str:
    fill = SUIT_SHADE if shade else SUIT
    return (f'<g id="{id_}" transform="{rot(angle, x, 16)}">'
            f'<rect x="{x-6}" y="14" width="12" height="13" rx="5" fill="{fill}" stroke="{OUTLINE}" stroke-width="3"/>'
            f'<path d="M{x-7.5} 24 h13 a3.5 3.5 0 0 1 3.5 3.5 v0 a3 3 0 0 1 -3 3 h-13.5 a3 3 0 0 1 -3 -3 v-0.5 a3 3 0 0 1 3 -3z" fill="{GEAR}" stroke="{OUTLINE}" stroke-width="3"/>'
            '</g>')


def arm(id_: str, x: float, angle: float, shade: bool) -> str:
    fill = SUIT_SHADE if shade else SUIT
    return (f'<g id="{id_}" transform="{rot(angle, x, 2)}">'
            f'<rect x="{x-4.5}" y="-1" width="9" height="16" rx="4.5" fill="{fill}" stroke="{OUTLINE}" stroke-width="3"/>'
            f'<circle cx="{x}" cy="16" r="5.5" fill="{GEAR}" stroke="{OUTLINE}" stroke-width="3"/>'
            '</g>')


def layer_backpack(p: Pose, v) -> str:
    return (f'<g id="mochila"><rect x="-25" y="-4" width="13" height="24" rx="5" fill="{GEAR}" stroke="{OUTLINE}" stroke-width="3"/>'
            f'<rect x="-22" y="1" width="7" height="4" rx="2" fill="{v["accent"]}"/>'
            f'<rect x="-22" y="8" width="7" height="3" rx="1.5" fill="#68668f"/></g>')


def layer_body(p: Pose, v) -> str:
    return (f'<g id="cuerpo"><rect x="-17" y="-5" width="34" height="31" rx="12" fill="{SUIT}" stroke="{OUTLINE}" stroke-width="3"/>'
            f'<path d="M-14 18 Q0 25 14 18 L14 21 Q14 24 10 24 L-10 24 Q-14 24 -14 21Z" fill="{SUIT_SHADE}"/></g>')


def layer_stripe(p: Pose, v) -> str:
    return (f'<g id="franja"><rect x="-15.5" y="9" width="31" height="6" rx="2" fill="{v["accent"]}"/>'
            f'<circle cx="9" cy="3" r="3.2" fill="#4cc3f5" stroke="{OUTLINE}" stroke-width="1.5"/>'
            f'<rect x="-6" y="1" width="9" height="4" rx="2" fill="#68668f"/></g>')


def layer_helmet(p: Pose, v) -> str:
    return (f'<g id="casco">'
            f'<path d="M-17 -31 L-13 -51 L-2 -39 Z" fill="{SUIT}" stroke="{OUTLINE}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="M17 -31 L13 -51 L2 -39 Z" fill="{SUIT}" stroke="{OUTLINE}" stroke-width="3" stroke-linejoin="round"/>'
            f'<circle cx="0" cy="-22" r="22" fill="{SUIT}" stroke="{OUTLINE}" stroke-width="3"/>'
            f'<path d="M-19 -12 A22 22 0 0 0 14 -5" fill="none" stroke="{SUIT_SHADE}" stroke-width="5" stroke-linecap="round"/>'
            '</g>')


def layer_ears(p: Pose, v) -> str:
    t = p.ear
    return (f'<g id="orejas">'
            f'<path transform="{rot(-t, -13, -36)}" d="M-13 -35 L-12 -45 L-7 -39 Z" fill="{v["fur"]}"/>'
            f'<path transform="{rot(t, 13, -36)}" d="M13 -35 L12 -45 L7 -39 Z" fill="{v["fur"]}"/>'
            '</g>')


def layer_face(p: Pose, v, uid: str) -> str:
    """Cara dentro del visor (recortada por el círculo del vidrio)."""
    eyes_open = 1 - p.blink
    if p.hurt:
        eyes = (f'<path d="M-2 -23 l4 4 m0 -4 l-4 4 M7 -23 l4 4 m0 -4 l-4 4" stroke="{OUTLINE}" stroke-width="2.2" stroke-linecap="round"/>')
    elif eyes_open < 0.25:
        eyes = (f'<path d="M-2.5 -20 q2.5 1.8 5 0 M6.5 -20 q2.5 1.8 5 0" fill="none" stroke="{OUTLINE}" stroke-width="2" stroke-linecap="round"/>')
    else:
        ry = 3.4 * eyes_open
        eyes = (f'<ellipse cx="0" cy="-20" rx="2.5" ry="{ry:.2f}" fill="{OUTLINE}"/><ellipse cx="9" cy="-20" rx="2.5" ry="{ry:.2f}" fill="{OUTLINE}"/>'
                f'<circle cx="0.9" cy="-21.4" r="0.9" fill="#fff"/><circle cx="9.9" cy="-21.4" r="0.9" fill="#fff"/>')
    mouth = (f'<path d="M1.5 -12 q3 -2.5 6 0" fill="none" stroke="{OUTLINE}" stroke-width="1.6" stroke-linecap="round"/>' if p.hurt
             else f'<path d="M4.5 -13 q-1.8 2 -3.6 0.6 M4.5 -13 q1.8 2 3.6 0.6" fill="none" stroke="{OUTLINE}" stroke-width="1.4" stroke-linecap="round"/>')
    return (f'<g id="cara"><defs><clipPath id="visor-{uid}"><circle cx="3" cy="-21" r="15.5"/></clipPath></defs>'
            f'<g clip-path="url(#visor-{uid})">'
            f'<rect x="-14" y="-38" width="34" height="34" fill="{GLASS}"/>'
            f'<circle cx="4.5" cy="-17" r="12.5" fill="{v["fur"]}"/>'
            f'<path d="M-3 -27 q7.5 -4 15 0" fill="none" stroke="{v["furDark"]}" stroke-width="2.4" stroke-linecap="round"/>'
            f'<ellipse cx="-2" cy="-14.5" rx="2.6" ry="1.6" fill="#ff9ad9" opacity=".7"/><ellipse cx="11" cy="-14.5" rx="2.6" ry="1.6" fill="#ff9ad9" opacity=".7"/>'
            f'{eyes}'
            f'<path d="M3 -16.2 h3 l-1.5 2 z" fill="{v["nose"]}"/>{mouth}'
            f'<path d="M-6 -15 h-5 M-6 -13 l-4.5 1.5 M15 -15 h5 M15 -13 l4.5 1.5" stroke="{v["furDark"]}" stroke-width="1" stroke-linecap="round" opacity=".8"/>'
            '</g></g>')


def layer_visor(p: Pose, v) -> str:
    return (f'<g id="visor"><circle cx="3" cy="-21" r="15.5" fill="none" stroke="{OUTLINE}" stroke-width="3"/>'
            f'<path d="M-7 -30 A11.5 11.5 0 0 1 2 -33" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>'
            f'<circle cx="12" cy="-30" r="1.6" fill="#fff" opacity=".6"/></g>')


# Orden de dibujo (atrás → adelante), pivote y si se puede recolorear
LAYER_ORDER = [
    ('sombra',          (0, 30),   False),
    ('cola',            (-14, 14), True),
    ('brazo-trasero',   (-10, 2),  False),
    ('pierna-trasera',  (-7, 16),  False),
    ('mochila',         (-18, 8),  True),
    ('cuerpo',          (0, 10),   False),
    ('franja',          (0, 12),   True),
    ('pierna-delantera',(7, 16),   False),
    ('casco',           (0, -22),  False),
    ('orejas',          (0, -40),  True),
    ('cara',            (3, -21),  True),
    ('visor',           (3, -21),  False),
    ('brazo-delantero', (10, 2),   False),
]


def build_layers(p: Pose, v, uid: str) -> dict[str, str]:
    return {
        'sombra': layer_shadow(p, v),
        'cola': layer_tail(p, v),
        'brazo-trasero': arm('brazo-trasero', -10, p.armB, True),
        'pierna-trasera': leg('pierna-trasera', -7, p.legB, True),
        'mochila': layer_backpack(p, v),
        'cuerpo': layer_body(p, v),
        'franja': layer_stripe(p, v),
        'pierna-delantera': leg('pierna-delantera', 7, p.legF, False),
        'casco': layer_helmet(p, v),
        'orejas': layer_ears(p, v),
        'cara': layer_face(p, v, uid),
        'visor': layer_visor(p, v),
        'brazo-delantero': arm('brazo-delantero', 10, p.armF, False),
    }


UPPER = {'cola', 'brazo-trasero', 'mochila', 'cuerpo', 'franja', 'brazo-delantero'}
HEAD = {'casco', 'orejas', 'cara', 'visor'}


def frame_svg(p: Pose, v, uid: str = 'a', only: str | None = None, size: int = FRAME) -> str:
    L = build_layers(p, v, uid)
    parts = []
    for name, _, _ in LAYER_ORDER:
        if only and name != only:
            continue
        g = L[name]
        if name == 'sombra':
            parts.append(g)
            continue
        if name in UPPER or name in HEAD:
            g = f'<g transform="translate(0 {p.bob:.2f})">{g}</g>'
        if name in HEAD:
            g = f'<g transform="{rot(p.head, 0, -4)}">{g}</g>' if p.head else g
        parts.append(f'<g transform="translate(0 {p.jump:.2f})">' if name != 'sombra' else '<g>')
        parts.append(g)
        parts.append('</g>')
    body = ''.join(parts)
    squash = f'translate(0 30) scale({p.sx:.3f} {p.sy:.3f}) translate(0 -30)'
    hurt_filter = ''
    if p.hurt:
        hurt_filter = (f'<defs><filter id="hurt-{uid}"><feColorMatrix type="matrix" values="1 0.25 0.25 0 0.12  0 0.6 0 0 0  0 0 0.6 0 0  0 0 0 1 0"/></filter></defs>')
        body = f'<g filter="url(#hurt-{uid})">{body}</g>'
    extra = ''.join(p.extra)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {FRAME} {FRAME}">'
            f'{hurt_filter}<g transform="{ROOT}"><g transform="{squash}">{body}</g>{extra}</g></svg>')


# ---------------------------------------------------------------- animaciones
def spark(x: float, y: float, r: float, color: str = '#ffcb47', alpha: float = 1) -> str:
    k = r * 0.22
    return (f'<path transform="translate({x:.1f} {y:.1f})" opacity="{alpha:.2f}" fill="{color}" '
            f'd="M0 {-r} L{k} {-k} L{r} 0 L{k} {k} L0 {r} L{-k} {k} L{-r} 0 L{-k} {-k}Z"/>')


def anim_idle(n=8):
    out = []
    for i in range(n):
        a = i / n * 2 * math.pi
        out.append(Pose(bob=math.sin(a) * 1.2, tail=math.sin(a) * 9, armB=10 + math.sin(a) * 2, armF=-10 - math.sin(a) * 2,
                        ear=4 if i == 3 else 0, blink=1 if i == 6 else (0.5 if i in (5, 7) else 0)))
    return out


def anim_walk(n=8):
    out = []
    for i in range(n):
        a = i / n * 2 * math.pi
        swing = math.sin(a) * 26
        out.append(Pose(bob=-abs(math.sin(a)) * 3 + 1.5, legB=-swing, legF=swing, armB=10 + swing * 0.9, armF=-10 - swing * 0.9,
                        tail=math.sin(a * 2) * 7 - 6, head=math.sin(a) * 2, shadow=1 - abs(math.sin(a)) * 0.08))
    return out


def anim_interact(n=6):
    """Tocar una consola: el brazo delantero sube y presiona."""
    curve = [0, 0.45, 1, 0.8, 1, 0.3]
    out = []
    for i in range(n):
        c = curve[i]
        out.append(Pose(armF=-10 - c * 95, armB=14, bob=c * 0.8, head=c * 4, tail=c * 10, ear=3 if i == 2 else 0,
                        extra=[spark(30, -6, 5 + c * 3, '#4cc3f5', c)] if c > 0.7 else []))
    return out


def anim_hurt(n=4):
    seq = [(1.12, 0.88, -6), (0.92, 1.08, 3), (1.04, 0.96, -2), (1, 1, 0)]
    return [Pose(sx=sx, sy=sy, head=h, hurt=i < 3, armB=40, armF=-40, tail=25, ear=-6) for i, (sx, sy, h) in enumerate(seq)]


def anim_celebrate(n=8):
    out = []
    for i in range(n):
        t = i / (n - 1)
        jump = -math.sin(t * math.pi) * 18
        squash = (1.1, 0.9) if i in (0, n - 1) else (0.95, 1.06)
        sparks = [spark(-28, -60 + i * 2, 4 + (i % 3), '#ffcb47', 0.9), spark(30, -52 - i, 3 + (i % 2) * 2, '#ee5fd6', 0.9)] if 1 <= i <= n - 2 else []
        out.append(Pose(jump=jump, sx=squash[0], sy=squash[1], armB=150, armF=-150, legB=-10 if jump < -4 else 0, legF=10 if jump < -4 else 0,
                        tail=20, ear=5, blink=1 if 2 <= i <= 5 else 0, shadow=1 + jump / 40, extra=sparks))
    return out


ANIMS = {
    'idle':      (anim_idle,      8,  True),
    'walk':      (anim_walk,      12, True),
    'interact':  (anim_interact,  10, False),
    'hurt':      (anim_hurt,      10, False),
    'celebrate': (anim_celebrate, 12, False),
}
