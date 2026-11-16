import { createRng } from './rng';
/**
 * La sonda: lógica pura (sin DOM) del cinturón de asteroides y del rover lunar, para poder probarla.
 * [DIBUJO] En el juego los asteroides están muy juntos; en la vida real casi nunca ves dos a la vez.
 * Nunca se pierde: si sale mal baja la nota y la historia sigue.
 */

// ------------------------------------------------------------------ cinturón: tres carriles fijos, cae todo desde arriba
export const BELT_SECONDS = 40;
export const BELT_LANES = 3;
export const BELT_SHIP_Y = 420;
export const BELT_H = 500;
export type BeltKind = 'rock' | 'battery' | 'chip' | 'algae';
export interface BeltThing { kind: BeltKind; lane: number; y: number; }
export interface BeltState {
  t: number; lane: number; hull: number; invuln: number;
  things: BeltThing[]; spawned: number; items: number; got: Record<'battery' | 'chip' | 'algae', number>;
  nextSpawn: number; speed: number; interval: number; rnd: () => number;
}
const ITEM_CYCLE: Exclude<BeltKind, 'rock'>[] = ['battery', 'chip', 'algae'];

export function createBelt(seed: number, hard: boolean): BeltState {
  return {
    t: 0, lane: 1, hull: 3, invuln: 0, things: [], spawned: 0, items: 0, got: { battery: 0, chip: 0, algae: 0 },
    nextSpawn: 0.6, speed: hard ? 360 : 260, interval: hard ? 0.6 : 0.8, rnd: createRng(seed),
  };
}

export function moveBelt(s: BeltState, dir: -1 | 1): void {
  s.lane = Math.max(0, Math.min(BELT_LANES - 1, s.lane + dir));
}

export function stepBelt(s: BeltState, dt: number): void {
  s.t += dt;
  s.invuln = Math.max(0, s.invuln - dt);
  if (s.t >= s.nextSpawn && s.t <= BELT_SECONDS - 4) {
    s.nextSpawn += s.interval;
    const k = s.spawned++;
    const lane = Math.floor(s.rnd() * BELT_LANES);
    if (k % 4 === 3) { s.items++; s.things.push({ kind: ITEM_CYCLE[Math.floor(k / 4) % 3], lane, y: -30 }); }
    else s.things.push({ kind: 'rock', lane, y: -30 });
  }
  for (const th of s.things) th.y += s.speed * dt;
  s.things = s.things.filter((th) => {
    if (th.lane === s.lane && Math.abs(th.y - BELT_SHIP_Y) < 28) {
      if (th.kind === 'rock') { if (s.invuln <= 0 && s.hull > 0) { s.hull--; s.invuln = 1; } return true; }
      s.got[th.kind]++;
      return false;
    }
    return th.y < BELT_H + 40;
  });
}
export const beltDone = (s: BeltState): boolean => s.t >= BELT_SECONDS;
export const beltItems = (s: BeltState): number => s.got.battery + s.got.chip + s.got.algae;
export const beltScore = (s: BeltState): number => 0.6 * (s.items ? beltItems(s) / s.items : 1) + 0.4 * (s.hull / 3);

// ------------------------------------------------------------------ rover lunar: pedal de avanzar + salto, cuestas, cráteres y baches
/**
 * El rover ya no avanza solo ni «se teletransporta»: acelera con el pedal, frena solo al soltarlo y la pendiente lo empuja
 * (cuesta abajo gana velocidad; cuesta arriba la pierde). Los cráteres son cuencos que se bajan y se suben: para salir hay que
 * aprovechar la velocidad de la bajada y el pedal. Los baches pequeños son peligrosos: hay que saltarlos.
 * [MODELO] Números del juego; la gravedad lunar real (1,62 m/s²) se escala para que el salto sea legible.
 */
export const ROVER_LEN = 7000;
export const ROVER_BASE_SEC = 80;
export const ROVER_PEDAL = 130;      // aceleración con el pedal (px/s²)
export const ROVER_MAX_SPEED = 190;  // velocidad máxima en plano (px/s)
export const ROVER_FRICTION = 22;    // frenado al soltar el pedal (px/s²)
export const ROVER_SLOPE_G = 210;    // cuánto empuja la pendiente (px/s² por unidad de pendiente)
export const ROVER_JUMP = 400;
/** Gravedad lunar 1,62 m/s²: G = 900 × 1,62 / 9,81 ≈ 148,6 px/s² (la del rover es mayor para que el salto sea corto y legible). */
export const MOON_G_PX = (900 * 1.62) / 9.81;
const ROVER_G = 900;
export const ROVER_AIR_SEC = (2 * ROVER_JUMP) / ROVER_G; // lo que dura un salto (≈ 0,9 s)
export const ROVER_LIVES = 3;        // integridad: cada bache letal quita 1
export const POTHOLE_W = 40;
const POTHOLE_LETHAL_H = 14;         // si va a menos de esta altura sobre el suelo, el bache lo atrapa
const INVULN_SEC = 1.5;
/** Puntos de control: tras un bache letal el rover reaparece en el último que pasó. */
export const CHECKPOINTS: readonly number[] = [0, 1500, 2900, 4400, 5800];
export const checkpointFor = (x: number): number => CHECKPOINTS.reduce((best, c) => (c <= x ? c : best), 0);
export const ROCKS: readonly number[] = [560, 1330, 2000, 2850, 3600, 4200, 5050, 5900];

export interface Crater { x: number; r: number; d: number; }
const CRATERS_ALL: readonly Crater[] = [
  { x: 1150, r: 150, d: 55 }, { x: 2650, r: 170, d: 62 }, { x: 3900, r: 160, d: 60 }, { x: 5200, r: 190, d: 68 }, { x: 6200, r: 150, d: 55 },
];
/** Cráteres del recorrido: en Cadete y Piloto hay menos. */
export const craters = (hard: boolean): readonly Crater[] => (hard ? CRATERS_ALL : CRATERS_ALL.filter((_, i) => i % 2 === 0));
const POTHOLES_ALL: readonly number[] = [720, 1650, 2150, 3050, 3450, 4350, 4850, 5700, 6600];
/** Baches pequeños (inicio de cada uno): solo se cruzan saltando. */
export const potholes = (hard: boolean): readonly number[] => (hard ? POTHOLES_ALL : POTHOLES_ALL.filter((_, i) => i % 2 === 0));

/** Cuenco suave del cráter (y hacia abajo, en píxeles) con un borde levantado. */
function craterOffset(c: Crater, x: number): number {
  const dx = Math.abs(x - c.x);
  const bowl = dx < c.r ? 0.5 * (1 + Math.cos((Math.PI * dx) / c.r)) : 0;
  const rim = Math.exp(-(((dx - c.r * 1.12) / (c.r * 0.12)) ** 2));
  return c.d * bowl - 9 * rim;
}

/** Altura del suelo (y de pantalla, 0 arriba): lomas largas y cuestas, más cráteres (siempre los de Comandante, para que la pista no cambie con el nivel). */
export const terrainY = (x: number): number => {
  let y = 340 + 55 * Math.sin(x / 520) + 38 * Math.sin(x / 230 + 1) + 9 * Math.sin(x / 70);
  for (const c of CRATERS_ALL) y += craterOffset(c, x);
  return y;
};
/** Pendiente del suelo en x (positiva = bajada). */
export const slopeAt = (x: number): number => (terrainY(x + 4) - terrainY(x - 4)) / 8;

export interface RoverState {
  x: number; v: number; h: number; vy: number; left: number; deaths: number; invuln: number; rocks: Set<number>; chips: number; hard: boolean;
  /** x donde reapareció tras el último bache letal (para el aviso en pantalla). */
  respawnAt: number | null;
}
export function createRover(batteries: number, chips: number, hard: boolean): RoverState {
  return { x: 0, v: 0, h: 0, vy: 0, left: ROVER_BASE_SEC + 4 * Math.min(4, batteries), deaths: 0, invuln: 0, rocks: new Set(), chips: Math.min(3, chips), hard, respawnAt: null };
}
export interface RoverInput { pedal: boolean; jump: boolean; }

const STEP = 1 / 60;
export function stepRover(s: RoverState, dt: number, input: RoverInput): void {
  for (let rest = dt; rest > 1e-9; rest -= STEP) stepOnce(s, Math.min(STEP, rest), input);
}
function stepOnce(s: RoverState, dt: number, input: RoverInput): void {
  s.left -= dt;
  s.invuln = Math.max(0, s.invuln - dt);
  s.respawnAt = s.invuln > 0 ? s.respawnAt : null;
  if (input.jump && s.h === 0) s.vy = ROVER_JUMP;
  s.vy -= ROVER_G * dt;
  s.h = Math.max(0, s.h + s.vy * dt);
  if (s.h === 0 && s.vy < 0) s.vy = 0;
  if (s.h === 0) { // en el suelo: pedal, fricción y pendiente (en el aire el rover conserva su velocidad)
    let a = input.pedal ? ROVER_PEDAL * Math.max(0, 1 - s.v / ROVER_MAX_SPEED) : 0;
    a += ROVER_SLOPE_G * slopeAt(s.x);
    if (!input.pedal && s.v > 0) a -= ROVER_FRICTION;
    s.v = Math.max(-60, Math.min(ROVER_MAX_SPEED * 1.3, s.v + a * dt));
    if (!input.pedal && Math.abs(s.v) < 2 && Math.abs(slopeAt(s.x)) < 0.05) s.v = 0; // se queda quieto en plano
  }
  s.x = Math.max(0, s.x + s.v * dt);
  if (s.x === 0 && s.v < 0) s.v = 0;
  if (s.invuln === 0 && s.h < POTHOLE_LETHAL_H) {
    for (const p of potholes(s.hard)) {
      if (s.x > p && s.x < p + POTHOLE_W) { // cayó en un bache: pierde integridad y vuelve al último punto de control
        s.deaths++;
        s.left -= 2;
        s.respawnAt = s.x = checkpointFor(s.x);
        s.v = 0; s.h = 0; s.vy = 0;
        s.invuln = INVULN_SEC;
        break;
      }
    }
  }
  ROCKS.forEach((rx, i) => { if (!s.rocks.has(i) && Math.abs(s.x - rx) < 24 && s.h < 40) s.rocks.add(i); });
}
export const roverLives = (s: RoverState): number => Math.max(0, ROVER_LIVES - s.deaths);
export const roverDone = (s: RoverState): boolean => s.x >= ROVER_LEN || s.left <= 0 || s.rocks.size >= ROCKS.length || roverLives(s) <= 0;
export const roverScore = (s: RoverState): number => 0.7 * (s.rocks.size / ROCKS.length) + 0.15 * (roverLives(s) / ROVER_LIVES) + 0.15 * Math.min(1, s.x / ROVER_LEN);

/** Flecha hacia la próxima roca: 8 s por chip (máximo 3 chips). */
export const hintSeconds = (chips: number): number => 8 * Math.min(3, chips);

/** score = 0,2 × contacto + 0,3 × cinturón + 0,5 × luna */
export const finaleScore = (contact: number, belt: number, moon: number): number => 0.2 * contact + 0.3 * belt + 0.5 * moon;
