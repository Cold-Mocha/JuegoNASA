import { HALLS, MAP_H, MAP_W, ROOM_RECTS, WALL_H, type Rect } from '../sim/stationMap';
import { ROOM_ZONE, WORLD_SCALE } from '../sim/rules';
import { ROOM_IDS } from '../data/rooms';
import type { RoomId } from '../sim/types';

/**
 * Fondo del plano completo de la Estación Central (vista cenital 3/4, estilo papel).
 * Se genera como SVG desde la misma geometría que usa la simulación, así lo que se ve
 * es exactamente lo que se camina. Se rasteriza una vez durante la pantalla del cohete.
 */
export const MAP_TEXTURE = 'station-map';
/** Resolución de la textura del plano (1 = tamaño real; el mapa debe seguir bajo los 4096 px de alto que aceptan las GPU chicas). */
export const MAP_RASTER = 1;

const INK = '#0b0c0f';
const PAPER = '#6b707a';     // borde exterior del casco (gris medio, opaco)
const REGOLITH = '#101215';   // casi negro: todo lo que no se camina (entre salas y pasillos)
/** Un solo piso (gris a cuadros) y un solo color de pared (metal gris oscuro) en toda la estación: las salas se distinguen por sus objetos. */
const FLOOR = '#868a92';      // gris medio neutro: contrasta con el traje blanco y con el pelaje claro y oscuro de los michis
const FLOOR_ALT = '#7d8189';  // cuadro alterno: casi igual, para que el piso no distraiga
const FLOOR_LINE = '#747880';
const WALL = '#2a2d33';       // gris más oscuro
/** Superficie lunar (afuera): regolito gris, sin paredes, con cráteres. */
const GROUND = '#3a3d43';
const GROUND_DARK = '#2e3035';
const GROUND_LIGHT = '#474a51';
/** Invernadero: módulo con paredes verdosas y piso verdoso. */
const GH_FLOOR = '#818a86';
const GH_FLOOR_ALT = '#78817d';
const GH_FLOOR_LINE = '#6f7773';
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
/**
 * Detalles de la pared (sin ventanas): moldura superior, cañería con bridas, paneles con costuras, rejillas de ventilación,
 * placas con luces de estado, remaches y una franja de precaución sobre el zócalo. `v` cambia el orden por sala.
 */
function wallDetails(b: Rect, v: number): string {
  const step = 140;
  const n = Math.max(1, Math.floor(b.w / step));
  const w = b.w / n;
  let o = `<rect x="${b.x}" y="${b.y + 12}" width="${b.w}" height="14" fill="#383c44"/><rect x="${b.x}" y="${b.y + 26}" width="${b.w}" height="3" fill="${INK}" opacity=".45"/>`;
  o += `<rect x="${b.x}" y="${b.y + 44}" width="${b.w}" height="12" fill="#43474f"/><rect x="${b.x}" y="${b.y + 46}" width="${b.w}" height="3" fill="#575c65"/>`;
  for (let i = 0; i <= n; i++) {
    const x = b.x + i * w;
    o += `<rect x="${f(x - 1.5)}" y="${b.y + 30}" width="3" height="${b.h - 48}" fill="${INK}" opacity=".5"/><rect x="${f(x + 1.5)}" y="${b.y + 30}" width="2" height="${b.h - 48}" fill="#3d4148"/>`;
    o += `<rect x="${f(x - 9)}" y="${b.y + 40}" width="18" height="20" rx="3" fill="#50545d" stroke="${INK}" stroke-width="2"/>`;
  }
  for (let i = 0; i < n; i++) {
    const cx = b.x + i * w + w / 2;
    const kind = (i + v) % 3;
    if (kind === 0) {
      // rejilla de ventilación
      o += `<rect x="${f(cx - 34)}" y="${b.y + 66}" width="68" height="34" rx="4" fill="#202328" stroke="#4a4e57" stroke-width="3"/>`;
      for (let k = 0; k < 4; k++) o += `<rect x="${f(cx - 28)}" y="${b.y + 72 + k * 7}" width="56" height="3" fill="#0b0c0f"/>`;
    } else if (kind === 1) {
      // placa con luces de estado
      o += `<rect x="${f(cx - 30)}" y="${b.y + 70}" width="60" height="28" rx="4" fill="#33373e" stroke="${INK}" stroke-width="2"/>
        <circle cx="${f(cx - 14)}" cy="${b.y + 84}" r="5" fill="#5ad6b2"/><circle cx="${f(cx)}" cy="${b.y + 84}" r="5" fill="#ffcb47" opacity=".8"/><circle cx="${f(cx + 14)}" cy="${b.y + 84}" r="5" fill="#ff7a59" opacity=".6"/>`;
    } else {
      // tablero de paneles atornillados
      o += `<rect x="${f(cx - 36)}" y="${b.y + 68}" width="72" height="32" rx="3" fill="#2f3238" stroke="#44484f" stroke-width="2"/><path d="M${f(cx)} ${b.y + 68}V${b.y + 100}M${f(cx - 36)} ${b.y + 84}H${f(cx + 36)}" stroke="#44484f" stroke-width="2"/>`;
    }
  }
  for (let x = b.x + 14; x < b.x + b.w - 8; x += 28) o += `<circle cx="${x}" cy="${b.y + b.h - 34}" r="2.5" fill="#575c65"/>`;
  o += `<rect x="${b.x}" y="${b.y + b.h - 28}" width="${b.w}" height="8" fill="url(#hazard)" opacity=".55"/>`;
  return o;
}

/** Pared: color base, detalles y zócalo oscuro abajo. */
function wallBase(b: Rect, color: string, v = 0): string {
  return rect(b, color) + wallDetails(b, v) + `<rect x="${b.x}" y="${b.y + b.h - 16}" width="${b.w}" height="16" fill="${INK}" opacity=".35"/>`;
}

// ------------------------------------------------------------------ pisos
/** Piso: una sola textura de baldosas para toda la nave (patrón en coordenadas del mapa: queda alineado entre salas y pasillos). */
const TILE = 48;
const floor = (r: Rect): string => rect(r, 'url(#tiles)');

// ------------------------------------------------------------------ superficie lunar
/** Cráteres fijos (en coordenadas relativas a la superficie): decorativos, no estorban al caminar. */
const CRATERS: readonly [number, number, number][] = [
  [180, 120, 70], [760, 380, 54], [1120, 300, 90], [1060, 110, 46], [1940, 420, 66], [960, 120, 38], [1780, 450, 40], [80, 420, 44],
].map(([x, y, rad]) => [x * WORLD_SCALE, y * WORLD_SCALE, rad * WORLD_SCALE]) as [number, number, number][];

function surface(): string {
  const r = ROOM_RECTS.exterior;
  let out = rect(r, GROUND, `rx="60" stroke="${GROUND_DARK}" stroke-width="10"`);
  out += CRATERS.map(([x, y, rad]) => `<ellipse cx="${r.x + x}" cy="${r.y + y}" rx="${rad}" ry="${rad * 0.55}" fill="${GROUND_DARK}"/>
    <path d="M${r.x + x - rad} ${r.y + y} A${rad} ${rad * 0.55} 0 0 0 ${r.x + x + rad} ${r.y + y}" fill="none" stroke="${GROUND_LIGHT}" stroke-width="6"/>`).join('');
  // piedritas: patrón determinista
  for (let i = 0; i < Math.round(90 * WORLD_SCALE ** 2); i++) {
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
    <pattern id="tiles" patternUnits="userSpaceOnUse" width="${TILE * 2}" height="${TILE * 2}">
      <rect width="${TILE * 2}" height="${TILE * 2}" fill="${FLOOR}"/>
      <rect width="${TILE}" height="${TILE}" fill="${FLOOR_ALT}"/><rect x="${TILE}" y="${TILE}" width="${TILE}" height="${TILE}" fill="${FLOOR_ALT}"/>
      <path d="M${TILE} 0V${TILE * 2}M${TILE * 2} 0V${TILE * 2}M0 ${TILE}H${TILE * 2}M0 ${TILE * 2}H${TILE * 2}" fill="none" stroke="${FLOOR_LINE}" stroke-width="1.5"/>
    </pattern>
    <pattern id="hazard" patternUnits="userSpaceOnUse" width="28" height="8" patternTransform="skewX(-35)">
      <rect width="14" height="8" fill="#c9a227"/><rect x="14" width="14" height="8" fill="${INK}"/>
    </pattern>
    <pattern id="gh-tiles" patternUnits="userSpaceOnUse" width="${TILE * 2}" height="${TILE * 2}">
      <rect width="${TILE * 2}" height="${TILE * 2}" fill="${GH_FLOOR}"/>
      <rect width="${TILE}" height="${TILE}" fill="${GH_FLOOR_ALT}"/><rect x="${TILE}" y="${TILE}" width="${TILE}" height="${TILE}" fill="${GH_FLOOR_ALT}"/>
      <path d="M${TILE} 0V${TILE * 2}M${TILE * 2} 0V${TILE * 2}M0 ${TILE}H${TILE * 2}M0 ${TILE * 2}H${TILE * 2}" fill="none" stroke="${GH_FLOOR_LINE}" stroke-width="1.5"/>
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
  s += HALLS.filter((h) => h.w > h.h).map((h, i) => wallBase(band(h), WALL, i)).join('');
  s += MODULE_ROOMS.map((id, i) => {
    const b = band(ROOM_RECTS[id]);
    return `<g clip-path="url(#wall-${id})">${wallBase(b, isGreenhouse(id) ? GH_WALL : WALL, i + 1)}</g>`;
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
