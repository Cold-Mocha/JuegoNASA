/**
 * Física del michi (pura, basada en delta-time): salto con gravedad real e impulso (dash).
 * El movimiento y los choques con el plano viven en `stationMap.ts`.
 */

/** Gravedades superficiales reales (m/s²): NASA Planetary Fact Sheets. */
export const GRAVITY = { earth: 9.81, moon: 1.62, mars: 3.72 } as const;

/** Escala del mapa: una sala de ~12 m mide ~560 px. */
export const PX_PER_METER = 47;

/** Altura (m) de un salto con velocidad inicial v0 (m/s) a los t segundos; 0 al aterrizar. */
export function jumpHeight(v0: number, g: number, t: number): number {
  const h = v0 * t - 0.5 * g * t * t;
  return h > 0 ? h : 0;
}

/** Altura máxima de un salto: v0² / 2g. */
export const maxJumpHeight = (v0: number, g: number): number => (v0 * v0) / (2 * g);

/** Tiempo en el aire: 2·v0 / g. */
export const airTime = (v0: number, g: number): number => (2 * v0) / g;

// ---------------------------------------------------------------- impulso (dash)
/** Carga del impulso: barra propia del michi (no gasta la energía de la estación). */
export const DASH = {
  max: 100,
  cost: 35,          // cada impulso gasta esto de la barra
  regenPerSec: 20,   // se recarga sola: una carga completa tarda 5 s
  duration: 0.18,    // segundos de impulso
  speedFactor: 3.2,  // multiplica la velocidad al caminar mientras dura
} as const;

export interface DashState {
  charge: number;    // 0..DASH.max
  remaining: number; // segundos de impulso que quedan (0 = no está en impulso)
}

export const createDash = (): DashState => ({ charge: DASH.max, remaining: 0 });

export const canDash = (s: DashState): boolean => s.remaining <= 0 && s.charge >= DASH.cost;

/** Intenta empezar un impulso; devuelve true si había carga suficiente. */
export function startDash(s: DashState): boolean {
  if (!canDash(s)) return false;
  s.charge -= DASH.cost;
  s.remaining = DASH.duration;
  return true;
}

/** Avanza el impulso y recarga la barra (no recarga mientras el impulso está activo). */
export function tickDash(s: DashState, dt: number): void {
  if (dt <= 0) return;
  if (s.remaining > 0) {
    s.remaining = Math.max(0, s.remaining - dt);
    return;
  }
  s.charge = Math.min(DASH.max, s.charge + DASH.regenPerSec * dt);
}

/** Multiplicador de velocidad en este instante. */
export const dashSpeedFactor = (s: DashState): number => (s.remaining > 0 ? DASH.speedFactor : 1);
