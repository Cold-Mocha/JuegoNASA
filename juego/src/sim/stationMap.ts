import type { RoomId, Zone } from './types';
import { ROOM_ZONE } from './rules';

/**
 * Plano de la Estación Central como UN solo mundo continuo (vista cenital 3/4, en píxeles de mapa).
 * Layout: la NAVE arriba (Soporte vital, Puente y Enfermería sobre un pasillo central que termina en
 * Comunicaciones; la Esclusa abajo) y AFUERA la superficie lunar (paneles solares y roca con hielo),
 * a la que se sale por la Esclusa, con el invernadero al fondo.
 * Salas y pasillos son rectángulos ("áreas"); dos áreas se conectan donde se solapan.
 * Todo es puro: la escena solo lo dibuja.
 */
export interface Rect { x: number; y: number; w: number; h: number; }
export interface Point { x: number; y: number; }
export interface Obstacle extends Point { r: number; }

export const MAP_W = 3000;
export const MAP_H = 2900;
/** Alto de la pared del fondo (cara norte) que se ve sobre cada piso. */
export const WALL_H = 130;

/** Piso caminable de cada sala. `exterior` es la superficie lunar (sin paredes). */
export const ROOM_RECTS: Record<RoomId, Rect> = {
  soporte:        { x: 300,  y: 200,  w: 560,  h: 360 },
  puente:         { x: 1000, y: 200,  w: 560,  h: 360 },
  enfermeria:     { x: 1700, y: 200,  w: 560,  h: 360 },
  comunicaciones: { x: 2300, y: 640,  w: 460,  h: 360 },
  esclusa:        { x: 1060, y: 1180, w: 440,  h: 360 },
  exterior:       { x: 200,  y: 1720, w: 2600, h: 520 },
  invernadero:    { x: 400,  y: 2420, w: 760,  h: 380 },
};

/** Pasillo o camino. `outdoors`: está afuera de la nave (el traje gasta oxígeno y no hay protección). */
export interface Hall extends Rect { outdoors?: boolean; }

/** Pasillos de la nave y caminos de afuera. Se meten 80 px en lo que unen (sin rendijas al chocar). */
export const HALLS: readonly Hall[] = [
  { x: 480, y: 795, w: 1900, h: 150 },  // pasillo central → Comunicaciones
  { x: 515, y: 480, w: 130, h: 395 },   // → Soporte vital
  { x: 1215, y: 480, w: 130, h: 395 },  // → Puente
  { x: 1915, y: 480, w: 130, h: 395 },  // → Enfermería
  { x: 1145, y: 865, w: 130, h: 395 },  // → Esclusa
  { x: 1145, y: 1460, w: 130, h: 340, outdoors: true }, // Esclusa → superficie lunar (en línea con el pasillo de la Esclusa)
  { x: 715, y: 2160, w: 130, h: 340, outdoors: true },  // superficie → invernadero
];

/** Margen de los pies del michi con cada borde (la pared norte es alta: más margen arriba). */
const INSET = { side: 24, top: 36, bottom: 14 } as const;

const ROOM_IDS = Object.keys(ROOM_RECTS) as RoomId[];

interface Area extends Rect { room: RoomId | null; outdoors: boolean; }
const AREAS: readonly Area[] = [
  ...ROOM_IDS.map((room) => ({ ...ROOM_RECTS[room], room, outdoors: ROOM_ZONE[room] !== 'ship' })),
  ...HALLS.map((h) => ({ ...h, room: null, outdoors: h.outdoors ?? false })),
];

const inside = (p: Point, r: Rect): boolean => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const insideInset = (p: Point, r: Rect): boolean =>
  p.x >= r.x + INSET.side && p.x <= r.x + r.w - INSET.side && p.y >= r.y + INSET.top && p.y <= r.y + r.h - INSET.bottom;
const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

export const roomCenter = (room: RoomId): Point => {
  const r = ROOM_RECTS[room];
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
};

/** Sala en la que está el punto, o null si está en un pasillo (o fuera). */
export function roomAt(p: Point): RoomId | null {
  return ROOM_IDS.find((id) => inside(p, ROOM_RECTS[id])) ?? null;
}

/** Zona del punto: sala → su zona; camino de afuera → superficie; pasillo de la nave → nave. */
export function zoneAt(p: Point): Zone {
  const room = roomAt(p);
  if (room) return ROOM_ZONE[room];
  return HALLS.some((h) => h.outdoors && inside(p, h)) ? 'surface' : 'ship';
}

/** ¿Pueden estar los pies del michi en este punto? */
export const isWalkable = (p: Point): boolean => AREAS.some((a) => insideInset(p, a));

const isFree = (p: Point, obstacles: readonly Obstacle[]): boolean =>
  isWalkable(p) && obstacles.every((o) => dist(p, o) >= o.r);

/**
 * Avanza según la entrada (−1..1 por eje), velocidad en px/s y delta en segundos.
 * Si choca, prueba cada eje por separado para deslizarse por la pared. Si ya estaba encima de un
 * obstáculo (p. ej. tras caminar solo), se le deja salir.
 */
export function moveOnMap(pos: Point, input: Point, speed: number, dt: number, obstacles: readonly Obstacle[] = []): Point {
  const len = Math.hypot(input.x, input.y);
  if (len === 0 || dt <= 0) return { ...pos };
  const k = (speed * Math.min(dt, 0.1)) / Math.max(1, len); // dt acotado: evita saltos tras una pestaña inactiva
  const dx = input.x * k;
  const dy = input.y * k;
  const ok = isFree(pos, obstacles) ? (p: Point) => isFree(p, obstacles) : isWalkable;
  for (const next of [{ x: pos.x + dx, y: pos.y + dy }, { x: pos.x + dx, y: pos.y }, { x: pos.x, y: pos.y + dy }]) {
    if (ok(next)) return next;
  }
  return { ...pos };
}

/** Pasos entre áreas: el centro de la zona donde se solapan dos áreas. */
interface Portal extends Point { areas: readonly [number, number]; }

function overlap(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

const PORTALS: Portal[] = AREAS.flatMap((a, i) => AREAS.slice(i + 1).flatMap((b, k) => {
  const o = overlap(a, b);
  return o ? [{ x: o.x + o.w / 2, y: o.y + o.h / 2, areas: [i, i + 1 + k] as const }] : [];
}));

/** Pasos que tocan el área de una sala (para tests y para ubicar entradas). */
export const roomEntrances = (room: RoomId): Point[] => {
  const i = AREAS.findIndex((a) => a.room === room);
  return PORTALS.filter((p) => p.areas.includes(i)).map(({ x, y }) => ({ x, y }));
};

/**
 * Ruta caminable (lista de puntos, sin incluir el origen) desde `from` hasta `to`.
 * Cada área es un rectángulo: dentro de una misma área se va en línea recta; entre áreas, por sus pasos.
 * Devuelve [] si alguno de los dos puntos no está en el mapa.
 */
export function findRoute(from: Point, to: Point): Point[] {
  const fromAreas = AREAS.flatMap((a, i) => (inside(from, a) ? [i] : []));
  const toAreas = AREAS.flatMap((a, i) => (inside(to, a) ? [i] : []));
  if (!fromAreas.length || !toAreas.length) return [];
  if (fromAreas.some((i) => toAreas.includes(i))) return [to];

  const n = PORTALS.length;
  const START = n;
  const GOAL = n + 1;
  const cost = new Array<number>(n + 2).fill(Infinity);
  const prev = new Array<number>(n + 2).fill(-1);
  const done = new Array<boolean>(n + 2).fill(false);
  const pt = (i: number): Point => (i === START ? from : i === GOAL ? to : PORTALS[i]);
  const areasOf = (i: number): readonly number[] => (i === START ? fromAreas : i === GOAL ? toAreas : PORTALS[i].areas);
  const linked = (i: number, j: number): boolean => i !== j && areasOf(i).some((a) => areasOf(j).includes(a));

  cost[START] = 0;
  for (;;) {
    let cur = -1;
    for (let i = 0; i < n + 2; i++) if (!done[i] && cost[i] < Infinity && (cur < 0 || cost[i] < cost[cur])) cur = i;
    if (cur < 0 || cur === GOAL) break;
    done[cur] = true;
    for (let j = 0; j < n + 2; j++) {
      if (done[j] || j === START || !linked(cur, j)) continue;
      const c = cost[cur] + dist(pt(cur), pt(j));
      if (c < cost[j]) {
        cost[j] = c;
        prev[j] = cur;
      }
    }
  }
  if (cost[GOAL] === Infinity) return [];
  const path: Point[] = [];
  for (let i = GOAL; i !== START; i = prev[i]) path.unshift({ x: pt(i).x, y: pt(i).y });
  return path;
}

/** Largo en px de una ruta que empieza en `from`. */
export const routeLength = (from: Point, route: readonly Point[]): number =>
  route.reduce((acc, p, i) => acc + dist(i === 0 ? from : route[i - 1], p), 0);
