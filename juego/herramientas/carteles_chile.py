#!/usr/bin/env python3
"""Genera los carteles de «Laboratorio Chile» (public/game/props/cartel-*.svg).
Mismo marco y tamaño que cuadro-tierra.svg. Los rótulos son nombres propios o números (iguales en español e inglés).
Uso: python3 herramientas/carteles_chile.py"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'game' / 'props'
INK, PAPER, NAVY = '#0e0b33', '#f5f5f2', '#18144e'

def sheet(panel: str, art: str, caption: str) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="158" height="128" viewBox="-14 -14 158 128"><g stroke-linejoin="round">'
        f'<rect x="6" y="6" width="118" height="88" rx="4" fill="{PAPER}" stroke="{INK}" stroke-width="3.5"/>'
        f'<rect x="14" y="14" width="102" height="60" rx="3" fill="{panel}" stroke="{INK}" stroke-width="2.5"/>'
        f'{art}'
        f'<text x="65" y="87" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="9" fill="{NAVY}">{caption}</text>'
        f'<circle cx="12" cy="12" r="4" fill="#ff7a59" stroke="{INK}" stroke-width="2"/><circle cx="118" cy="12" r="4" fill="#ff7a59" stroke="{INK}" stroke-width="2"/>'
        f'<rect x="52" y="2" width="26" height="9" rx="2" fill="#f0e6b8" stroke="{INK}" stroke-width="1.5"/></g></svg>'
    )

def shape(d: str, fill: str, w: float = 2.5) -> str:
    return f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{w}" stroke-linecap="round"/>'

POSTERS = {
    # Acuerdos Artemis: la Luna y la Tierra
    'artemis': (NAVY, '<circle cx="48" cy="44" r="20" fill="#d9d6e6" stroke="%s" stroke-width="3"/><circle cx="41" cy="38" r="4" fill="#b9b5d0"/><circle cx="55" cy="52" r="5" fill="#b9b5d0"/>'
                '<circle cx="90" cy="30" r="9" fill="#3a8de0" stroke="%s" stroke-width="2.5"/><path d="M86 27 q5 -3 8 2 q-1 5 -5 4Z" fill="#7ed957"/>' % (INK, INK), 'ARTEMIS · 2024'),
    # Seguimiento de satélites: antena parabólica
    'seguimiento': ('#2b5aa8', shape('M36 52 q22 -34 52 -6 l-8 4 q-20 -18 -38 4Z', '#f5f5f2') + shape('M62 48 L62 66 M50 66 L74 66', '#f5f5f2', 3)
                    + '<circle cx="86" cy="26" r="4" fill="#ffcb47" stroke="%s" stroke-width="2"/>' % INK, 'MINITRACK'),
    # Cerro Tololo: cúpula de observatorio
    'tololo': ('#14104a', shape('M34 66 L34 50 q0 -22 30 -22 q30 0 30 22 L94 66Z', '#f5f5f2') + '<rect x="60" y="26" width="9" height="40" fill="#18144e" stroke="%s" stroke-width="2"/>' % INK
               + '<circle cx="24" cy="24" r="1.5" fill="#f5f5f2"/><circle cx="100" cy="22" r="1.5" fill="#f5f5f2"/><circle cx="104" cy="44" r="1.5" fill="#f5f5f2"/>', 'CERRO TOLOLO'),
    # ARADS: róver en el desierto
    'arads': ('#e9b873', '<rect x="38" y="40" width="54" height="16" rx="4" fill="#f5f5f2" stroke="%s" stroke-width="2.5"/><rect x="46" y="30" width="20" height="10" rx="2" fill="#7ed957" stroke="%s" stroke-width="2"/>' % (INK, INK)
              + '<path d="M80 40 L98 26" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/>' % INK
              + ''.join(f'<circle cx="{x}" cy="60" r="7" fill="#3b3b4f" stroke="{INK}" stroke-width="2.5"/>' for x in (46, 65, 84)), 'ARADS · ATACAMA'),
    # 1960: helicóptero
    'terremoto-1960': ('#7fb6e8', '<ellipse cx="60" cy="46" rx="22" ry="12" fill="#ff7a59" stroke="%s" stroke-width="2.5"/>' % INK
                       + '<path d="M80 46 L100 40" stroke="%s" stroke-width="4" fill="none" stroke-linecap="round"/>' % INK
                       + '<path d="M34 30 L88 30 M60 30 L60 34" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/>' % INK
                       + '<path d="M44 62 L76 62" stroke="%s" stroke-width="3" fill="none" stroke-linecap="round"/>' % INK, 'VALDIVIA 1960'),
    # Alianza para el Progreso: estrella sobre libro abierto
    'alianza': ('#2b5aa8', shape('M65 22 L70 36 L85 36 L73 45 L78 60 L65 51 L52 60 L57 45 L45 36 L60 36Z', '#ffcb47'), '1961 · KENNEDY'),
}

for name, (panel, art, cap) in POSTERS.items():
    (OUT / f'cartel-{name}.svg').write_text(sheet(panel, art, cap), encoding='utf-8')
    print('cartel-%s.svg' % name)
