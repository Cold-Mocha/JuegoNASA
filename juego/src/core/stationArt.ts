import { HALLS, MAP_H, MAP_W, ROOM_RECTS, WALL_H, type Rect } from '../sim/stationMap';
import { ROOM_ZONE } from '../sim/rules';
import { ROOM_IDS } from '../data/rooms';
import type { RoomId } from '../sim/types';

/**
 * Fondo del plano completo de la Estación Central (vista cenital 3/4, estilo papel).
 * Se genera como SVG desde la misma geometría que usa la simulación, así lo que se ve
 * es exactamente lo que se camina. Se rasteriza una vez durante la pantalla del cohete.
 */
export const MAP_TEXTURE = 'station-map';

const INK = '#0b0c0f';
const PAPER = '#6b707a';     // borde exterior del casco (gris medio, opaco)
const REGOLITH = '#101215';   // casi negro: todo lo que no se camina (entre salas y pasillos)
/** Un solo color de piso y de pared en toda la estación (metal gris oscuro): las salas se distinguen por sus objetos. */
const FLOOR = '#4c5058';      // gris oscuro metálico, opaco
const FLOOR_LINE = '#41444b';
const WALL = '#2a2d33';       // gris más oscuro
/** Superficie lunar (afuera): regolito gris, sin paredes, con cráteres. */
const GROUND = '#3a3d43';
const GROUND_DARK = '#2e3035';
const GROUND_LIGHT = '#474a51';
/** Invernadero: módulo de vidrio con piso verdoso. */
const GH_FLOOR = '#4a5650';
const GH_FLOOR_LINE = '#3f4a44';
const GH_WALL = '#4f6660';

/** Radio exterior del módulo; los bordes interiores usan radio exterior − grosor del borde (curvas concéntricas). */
const OUTER_R = 34;
const PAPER_W = 14;
const RIM_W = 8;
const FLOOR_R = OUTER_R - PAPER_W / 2 - RIM_W;

const f = (n: number): string => n.toFixed(1);
const rect = (r: Rect, fill: string, extra = ''): string =>
  `<rect x="${f(r.x)}" y="${f(r.y)}" width="${f(r.w)}" height="${f(r.h)}" fill="${fill}" ${extra}/>`;
/** Cuerpo del módulo: piso + pared del fondo. */
const body = (r: Rect): Rect => ({ x: r.x, y: r.y - WALL_H, w: r.w, h: r.h + WALL_H });
const band = (r: Rect): Rect => ({ x: r.x, y: r.y - WALL_H, w: r.w, h: WALL_H });

// ------------------------------------------------------------------ exterior lunar (liso)
function exterior(): string {
  return rect({ x: 0, y: 0, w: MAP_W, h: MAP_H }, REGOLITH);
}

// ------------------------------------------------------------------ paredes
/** Pared lisa: solo el zócalo oscuro abajo. */
function wallBase(b: Rect, color: string): string {
  return rect(b, color) + `<rect x="${b.x}" y="${b.y + b.h - 16}" width="${b.w}" height="16" fill="${INK}" opacity=".35"/>`;
}

// ------------------------------------------------------------------ pisos
/** Piso: una sola textura de baldosas para toda la nave (patrón en coordenadas del mapa: queda alineado entre salas y pasillos). */
const TILE = 48;
const floor = (r: Rect): string => rect(r, 'url(#tiles)');

// ------------------------------------------------------------------ superficie lunar
/** Cráteres fijos (en coordenadas relativas a la superficie): decorativos, no estorban al caminar. */
const CRATERS: readonly [number, number, number][] = [
  [180, 120, 70], [760, 380, 54], [1320, 300, 90], [1560, 110, 46], [2540, 420, 66], [960, 120, 38], [2280, 450, 40], [80, 420, 44],
];

function surface(): string {
  const r = ROOM_RECTS.exterior;
  let out = rect(r, GROUND, `rx="60" stroke="${GROUND_DARK}" stroke-width="10"`);
  out += CRATERS.map(([x, y, rad]) => `<ellipse cx="${r.x + x}" cy="${r.y + y}" rx="${rad}" ry="${rad * 0.55}" fill="${GROUND_DARK}"/>
    <path d="M${r.x + x - rad} ${r.y + y} A${rad} ${rad * 0.55} 0 0 0 ${r.x + x + rad} ${r.y + y}" fill="none" stroke="${GROUND_LIGHT}" stroke-width="6"/>`).join('');
  // piedritas: patrón determinista
  for (let i = 0; i < 90; i++) {
    const px = r.x + 40 + ((i * 337) % (r.w - 80));
    const py = r.y + 30 + ((i * 211) % (r.h - 60));
    out += `<circle cx="${px}" cy="${py}" r="${3 + (i % 4)}" fill="${i % 3 ? GROUND_DARK : GROUND_LIGHT}"/>`;
  }
  return out;
}

// ------------------------------------------------------------------ composición
/** Módulos con paredes: salas de la nave, el invernadero y todos los pasillos (los de afuera son tubos). */
const MODULE_ROOMS: readonly RoomId[] = ROOM_IDS.filter((id) => ROOM_ZONE[id] !== 'surface');
const isGreenhouse = (id: RoomId): boolean => ROOM_ZONE[id] === 'greenhouse';

export function stationSvg(): string {
  const shapes: { r: Rect; radius: number }[] = [
    ...HALLS.map((h) => ({ r: h.outdoors ? h : body(h), radius: 10 })), // los tubos de afuera no tienen pared de fondo
    ...MODULE_ROOMS.map((id) => ({ r: body(ROOM_RECTS[id]), radius: OUTER_R })),
  ];
  const clips = MODULE_ROOMS.map((id) => {
    const r = ROOM_RECTS[id];
    const b = band(r);
    const k = FLOOR_R;
    // pared: esquinas de arriba redondeadas (concéntricas con el borde), abajo rectas
    const wallPath = `M${b.x} ${b.y + b.h}V${b.y + k}Q${b.x} ${b.y} ${b.x + k} ${b.y}H${b.x + b.w - k}Q${b.x + b.w} ${b.y} ${b.x + b.w} ${b.y + k}V${b.y + b.h}Z`;
    return `<clipPath id="floor-${id}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${k}"/></clipPath><clipPath id="wall-${id}"><path d="${wallPath}"/></clipPath>`;
  }).join('');

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP_W}" height="${MAP_H}" viewBox="0 0 ${MAP_W} ${MAP_H}">
  <defs>${clips}
    <pattern id="tiles" patternUnits="userSpaceOnUse" width="${TILE}" height="${TILE}">
      <rect width="${TILE}" height="${TILE}" fill="${FLOOR}"/>
      <path d="M${TILE} 0V${TILE}H0" fill="none" stroke="${FLOOR_LINE}" stroke-width="2"/>
    </pattern>
    <pattern id="gh-tiles" patternUnits="userSpaceOnUse" width="${TILE}" height="${TILE}">
      <rect width="${TILE}" height="${TILE}" fill="${GH_FLOOR}"/>
      <path d="M${TILE} 0V${TILE}H0" fill="none" stroke="${GH_FLOOR_LINE}" stroke-width="2"/>
    </pattern>
  </defs>`;
  s += exterior();
  s += surface();
  // sombra del casco sobre el regolito
  s += shapes.map(({ r, radius }) => rect({ x: r.x + 14, y: r.y + 20, w: r.w, h: r.h }, '#000', `rx="${radius}" opacity=".28"`)).join('');
  // borde de papel y borde oscuro (la unión de todos los módulos)
  s += shapes.map(({ r, radius }) => rect(r, PAPER, `rx="${radius}" stroke="${PAPER}" stroke-width="${PAPER_W * 2}"`)).join('');
  s += shapes.map(({ r, radius }) => rect(r, INK, `rx="${radius}" stroke="${INK}" stroke-width="${RIM_W * 2}"`)).join('');
  // paredes: primero las de los pasillos, encima las de las salas (el invernadero es de vidrio)
  s += HALLS.filter((h) => h.w > h.h).map((h) => wallBase(band(h), WALL)).join('');
  s += MODULE_ROOMS.map((id) => {
    const b = band(ROOM_RECTS[id]);
    const glass = isGreenhouse(id)
      ? Array.from({ length: Math.floor(b.w / 90) }, (_, i) => `<rect x="${b.x + 40 + i * 90}" y="${b.y + 14}" width="14" height="${b.h - 40}" fill="#ffffff" opacity=".08"/>`).join('')
      : '';
    return `<g clip-path="url(#wall-${id})">${wallBase(b, isGreenhouse(id) ? GH_WALL : WALL)}${glass}</g>`;
  }).join('');
  // pisos: pasillos (cortan las paredes donde entran) y luego salas
  s += HALLS.map(floor).join('');
  s += MODULE_ROOMS.map((id) => {
    const r = ROOM_RECTS[id];
    return `<g clip-path="url(#floor-${id})">${rect(r, isGreenhouse(id) ? 'url(#gh-tiles)' : 'url(#tiles)')}
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="18" fill="${INK}" opacity=".12"/></g>`;
  }).join('');
  return `${s}</svg>`;
}
