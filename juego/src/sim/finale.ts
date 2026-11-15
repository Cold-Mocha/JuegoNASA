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

// ------------------------------------------------------------------ rover lunar: avanza solo; se controlan el freno y el salto
export const ROVER_LEN = 6200;
export const ROVER_BASE_SEC = 60;
export const ROVER_SPEED = 120;
export const ROVER_BRAKE = 40;
export const ROVER_JUMP = 330;
/** Gravedad lunar 1,62 m/s²: G = 900 × 1,62 / 9,81 ≈ 148,6 px/s² (la del rover es mayor para que el salto sea corto y legible). */
export const MOON_G_PX = (900 * 1.62) / 9.81;
const ROVER_G = 900;
export const ROCKS: readonly number[] = Array.from({ length: 8 }, (_, i) => 520 + i * 700);
const CRATERS_ALL: readonly number[] = [900, 1600, 2300, 3000, 3700, 4400, 5100];
export const craters = (hard: boolean): readonly number[] => (hard ? CRATERS_ALL : CRATERS_ALL.filter((_, i) => i % 2 === 0));
export const CRATER_W = 70;

/** Altura del suelo (y de pantalla, 0 arriba); pendiente máxima ≈ 0,58 (menor que 0,7). */
export const terrainY = (x: number): number => 340 + 40 * Math.sin(x / 180) + 25 * Math.sin(x / 70);

export interface RoverState {
  x: number; h: number; vy: number; left: number; flips: number; rocks: Set<number>; chips: number; fell: number; hard: boolean;
}
export function createRover(batteries: number, chips: number, hard: boolean): RoverState {
  return { x: 0, h: 0, vy: 0, left: ROVER_BASE_SEC + 4 * Math.min(4, batteries), flips: 0, rocks: new Set(), chips: Math.min(3, chips), fell: 0, hard };
}
export interface RoverInput { brake: boolean; jump: boolean; }

export function stepRover(s: RoverState, dt: number, input: RoverInput): void {
  s.left -= dt;
  if (s.fell > 0) s.fell = Math.max(0, s.fell - dt); // cuesta 3 s: se cuenta aparte
  if (input.jump && s.h === 0) s.vy = ROVER_JUMP;
  s.vy -= ROVER_G * dt;
  s.h = Math.max(0, s.h + s.vy * dt);
  if (s.h === 0 && s.vy < 0) s.vy = 0;
  s.x += (input.brake ? ROVER_BRAKE : ROVER_SPEED) * dt;
  for (const c of craters(s.hard)) {
    if (s.x > c && s.x < c + CRATER_W && s.h < 20) { s.flips++; s.left -= 3; s.x = c + CRATER_W + 4; s.vy = 0; } // vuelca: cuesta 3 s y sigue
  }
  ROCKS.forEach((rx, i) => { if (!s.rocks.has(i) && Math.abs(s.x - rx) < 24 && s.h < 40) s.rocks.add(i); });
}
export const roverDone = (s: RoverState): boolean => s.x >= ROVER_LEN || s.left <= 0 || s.rocks.size >= ROCKS.length;
export const roverScore = (s: RoverState): number => 0.75 * (s.rocks.size / ROCKS.length) + 0.25 * (1 - Math.min(s.flips, 3) / 3);

/** Flecha hacia la próxima roca: 8 s por chip (máximo 3 chips). */
export const hintSeconds = (chips: number): number => 8 * Math.min(3, chips);

/** score = 0,2 × contacto + 0,3 × cinturón + 0,5 × luna */
export const finaleScore = (contact: number, belt: number, moon: number): number => 0.2 * contact + 0.3 * belt + 0.5 * moon;
