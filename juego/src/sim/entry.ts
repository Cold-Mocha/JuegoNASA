/**
 * Misión final «Casa»: modelo puro (sin Phaser ni DOM) de las 4 fases: giro e inspección, quemada, reingreso y planeo.
 * [REAL] la R-bar Pitch Maneuver gira 0,75 °/s (360° en 480 s); [MODELO] todo lo demás es una simplificación educativa
 * (tiempos comprimidos, calor ∝ densidad, corredor de reingreso 1-D).
 */
const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

// ---------------------------------------------------------------- Fase 0: enlace con la Tierra
/** [MODELO] ángulos y canales didácticos, no telemetría real: apuntar la antena y elegir el canal que usa la Tierra. */
export const LINK_ANGLES: readonly number[] = [-40, -24, 22, 38];
export const LINK_CHANNELS = 3;
export const LINK_AIM_MAX = 65;
/** Diferencia de ángulo (grados) con la que la señal queda firme. */
export const LINK_LOCK_DEG = 9;
/** Intensidad de la señal (0–1): sin el canal correcto no hay señal; con él, baja con la desviación del ángulo. */
export const linkStrength = (aim: number, target: number, rightChannel: boolean): number =>
  rightChannel ? clamp(1 - Math.abs(target - aim) / 64, 0, 1) : 0;
export const linkLocked = (aim: number, target: number, rightChannel: boolean): boolean =>
  rightChannel && Math.abs(target - aim) <= LINK_LOCK_DEG;
/** Los canales equivocados pesan poco y la rapidez es opcional: nunca baja de 0,4. */
export const linkScore = (errors: number, seconds: number): number => clamp(1 - errors * 0.08 - Math.max(0, seconds - 25) * 0.003, 0.4, 1);

// ---------------------------------------------------------------- Fase 1: giro e inspección
/** [REAL] velocidad del giro de 360° (R-bar Pitch Maneuver): 0,75 °/s, es decir 480 s por vuelta. */
export const RPM_DEG_PER_SEC = 0.75;
export const RPM_REAL_SECONDS = 360 / RPM_DEG_PER_SEC;
/** [MODELO] la vuelta se comprime a 24 s de juego (×20). */
export const INSPECT_GAME_SECONDS = 24;
export const INSPECT_SPEEDUP = RPM_REAL_SECONDS / INSPECT_GAME_SECONDS;
/** Ángulo del giro (0–360°) a los t segundos de juego. */
export const spinAngle = (t: number): number => (t * INSPECT_SPEEDUP * RPM_DEG_PER_SEC) % 360;
/** El vientre de la nave mira a las ventanas de la estación entre estos ángulos. */
export const bellyFacing = (angle: number): boolean => angle >= 110 && angle <= 250;
/** Cada daño que no se encontró sube el calor base del reingreso. */
export const DAMAGE_HEAT = 0.35;
export const heatMultiplier = (unfoundDamage: number): number => 1 + DAMAGE_HEAT * unfoundDamage;

// ---------------------------------------------------------------- Fase 2: quemada de frenado
export const BURN_TOLERANCE = 0.12;
export const BURN_FILL_SECONDS = 6;
export function burnStep(gauge: number, error: number, dt: number): number {
  return Math.abs(error) <= BURN_TOLERANCE ? Math.min(1, gauge + dt / BURN_FILL_SECONDS) : Math.max(0, gauge - dt / (BURN_FILL_SECONDS * 2));
}

// ---------------------------------------------------------------- Fase 3: corredor de reingreso
export const REENTRY_SECONDS = 30;
export const HEAT_LIMIT = 85;
export const CORRIDOR_HALF = 0.28;
export const ROLL_SPEED = 1.1;       // cuánto se desplaza de lado por segundo con el alabeo al máximo
const HEAT_RATE = 3.1;               // con el corredor bien seguido, el calor llega a ~60
/** Centro del corredor (−1..1): una S, por eso se usan inversiones de alabeo. */
export const corridorCenter = (t: number): number => 0.55 * Math.sin((2 * Math.PI * t * 1.5) / REENTRY_SECONDS);

export interface ReentryState { t: number; x: number; heat: number; inside: number; }
export const initialReentry = (): ReentryState => ({ t: 0, x: 0, heat: 0, inside: 0 });

/** Un paso del reingreso: `roll` (−1..1) mueve la nave de lado; fuera del corredor el calor sube más rápido. */
export function stepReentry(s: ReentryState, roll: number, dt: number, heatMult = 1): ReentryState {
  const t = s.t + dt;
  const x = clamp(s.x + clamp(roll, -1, 1) * ROLL_SPEED * dt, -1, 1);
  const inside = Math.abs(x - corridorCenter(t)) <= CORRIDOR_HALF;
  const density = Math.sin(Math.PI * Math.min(1, t / REENTRY_SECONDS)); // 0 → 1 → 0: el aire más denso, a mitad
  const heat = s.heat + HEAT_RATE * density * heatMult * (inside ? 1 : 2.2) * dt;
  return { t, x, heat, inside: s.inside + (inside ? dt : 0) };
}
/** Tramo del reingreso en que no hay comunicación (apagón por el plasma), en segundos de juego. */
export const BLACKOUT: readonly [number, number] = [11, 23];

// ---------------------------------------------------------------- Fase 4: planeo
export const GLIDE_SECONDS = 16;
/** Un paso del planeo: `pitch` (−1 baja la nariz, +1 la sube) cambia la velocidad de descenso; la altura va de 1 a 0 en GLIDE_SECONDS. */
export const glideStep = (alt: number, pitch: number, dt: number): number => alt - ((1 + 0.9 * -clamp(pitch, -1, 1)) / GLIDE_SECONDS) * dt;
/** Puntaje del planeo (0–1): tocar la pista en el momento justo. `alt` es la altura al terminar y `landedAt` el instante si tocó antes. */
export function glideScore(alt: number, landedAt: number | null): number {
  const error = landedAt === null ? Math.max(0, alt) : (GLIDE_SECONDS - landedAt) / GLIDE_SECONDS;
  return clamp(1 - error * 2.5, 0, 1);
}

// ---------------------------------------------------------------- resultado
export interface CasaResult {
  inspected: number;   // 0–1: daños encontrados
  burn: number;        // 0–1
  corridor: number;    // 0–1: tiempo dentro del corredor
  heatMax: number;
  glide: number;       // 0–1
  link?: number;       // 0–1: enlace con la Tierra (opcional: los resultados antiguos no lo traen)
}

export function casaStars(r: CasaResult): 1 | 2 | 3 {
  const low = r.heatMax <= HEAT_LIMIT;
  const great = [r.inspected, r.burn, r.corridor, r.glide].every((q) => q >= 0.8);
  return low && great && r.inspected >= 1 ? 3 : low ? 2 : 1;
}

export const casaScore = (r: CasaResult): number =>
  Math.round(1000 * (0.25 * r.inspected + 0.2 * r.burn + 0.3 * r.corridor + 0.25 * r.glide) + (r.heatMax <= HEAT_LIMIT ? 300 : 0) + Math.round(100 * (r.link ?? 0)));
