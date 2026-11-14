import type Phaser from 'phaser';
import { addSvgTexture } from './art';
import { propKey } from '../data/preload';

/**
 * Objetos dibujados en código (mismo estilo que los PNG de `public/game/props`: contorno de tinta y
 * borde de papel de 14 px a 1x). Se rasterizan a 1,25× como los PNG, así comparten escala y margen en el mapa.
 */
const INK = '#0e0b33';
const PAPER = '#faf8f0';
const O = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const TEXTURE_SCALE = 1.25;

const paperFilter = `<filter id="paper" x="-20%" y="-20%" width="140%" height="140%">
  <feMorphology in="SourceAlpha" operator="dilate" radius="12" result="d"/>
  <feFlood flood-color="${PAPER}"/><feComposite in2="d" operator="in" result="p"/>
  <feMerge><feMergeNode in="p"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

const wrap = (w: number, h: number, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${paperFilter}</defs><g filter="url(#paper)">${body}</g></svg>`;

/** Panel solar sobre un poste: celdas azules con rejilla y un brillo de sol. */
function solarPanel(): string {
  const top = { l: 44, r: 256, y: 34 };
  const bot = { l: 22, r: 278, y: 140 };
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const cols = [0.25, 0.5, 0.75].map((t) => `<line x1="${lerp(top.l, top.r, t)}" y1="${top.y}" x2="${lerp(bot.l, bot.r, t)}" y2="${bot.y}"/>`).join('');
  const rows = [1 / 3, 2 / 3].map((t) => {
    const y = lerp(top.y, bot.y, t);
    return `<line x1="${lerp(top.l, bot.l, t)}" y1="${y}" x2="${lerp(top.r, bot.r, t)}" y2="${y}"/>`;
  }).join('');
  return wrap(300, 240, `
    <ellipse cx="150" cy="214" rx="54" ry="12" fill="#9a98c8" ${O}/>
    <rect x="140" y="132" width="20" height="82" rx="4" fill="#c4c2e0" ${O}/>
    <path d="M${top.l} ${top.y} H${top.r} L${bot.r} ${bot.y} H${bot.l} Z" fill="#2a3f8f" ${O}/>
    <g stroke="#4cc3f5" stroke-width="3">${cols}${rows}</g>
    <path d="M70 44 L104 44 L92 74 L58 74 Z" fill="#ffffff" opacity=".35"/>
    <path d="M${top.l} ${top.y} H${top.r} L${bot.r} ${bot.y} H${bot.l} Z" fill="none" ${O}/>`);
}

/** Roca lunar con cristales de hielo (para recoger muestras). */
function iceRock(): string {
  return wrap(240, 190, `
    <ellipse cx="120" cy="166" rx="92" ry="12" fill="#6e7085" opacity=".5"/>
    <path d="M28 162 C20 128 36 92 70 82 C88 52 132 46 156 70 C190 70 214 104 208 140 C206 152 200 160 190 162 Z" fill="#a7a9b8" ${O}/>
    <path d="M70 82 C80 96 78 116 64 128 M156 70 C150 92 160 108 176 116" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".5"/>
    <path d="M96 124 L108 92 L120 124 Z" fill="#bfe6ff" ${O}/>
    <path d="M118 128 L134 78 L150 128 Z" fill="#dff3ff" ${O}/>
    <path d="M148 132 L158 108 L168 132 Z" fill="#bfe6ff" ${O}/>
    <path d="M128 92 L132 80" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>`);
}

export const DRAWN_PROPS: Record<string, { svg: () => string; w: number; h: number }> = {
  'panel-solar': { svg: solarPanel, w: 300, h: 240 },
  'roca-hielo': { svg: iceRock, w: 240, h: 190 },
};

export const drawnPropsReady = (textures: Phaser.Textures.TextureManager): boolean =>
  Object.keys(DRAWN_PROPS).every((a) => textures.exists(propKey(a)));

/** Rasteriza los objetos dibujados (una vez; se reutilizan entre partidas). */
export function addDrawnProps(textures: Phaser.Textures.TextureManager): Promise<void> {
  return Promise.all(Object.entries(DRAWN_PROPS).map(([asset, p]) =>
    addSvgTexture(textures, propKey(asset), p.svg(), p.w, p.h, TEXTURE_SCALE))).then(() => undefined);
}
