/**
 * Puntaje de los minijuegos de la estación: modelo puro (sin DOM ni Phaser), igual que `entry.ts` para «Casa».
 * Cada fórmula devuelve un puntaje 0–1; `rules.quality` lo convierte en la calidad que escala la acción.
 */
import type { DifficultyId } from '../data/difficulties';

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Parámetros por dificultad. Por ahora solo cambian las algas; la fase B suma el resto. */
export interface MiniDifficulty {
  /** Multiplica el tiempo de los minijuegos con reloj (cosecha, algas, panel de pruebas, curarse) y el compás del pedal: más difícil, menos tiempo. */
  time: number;
  /** Tubos (jeringas) del cultivo de algas: Cadete 2 (luz y nutrientes), Piloto y Comandante 3 (+ temperatura, que se calienta con la luz). */
  algaeTubes: 1 | 2 | 3;
  /** Segundos que hay que tener las 3 jeringas en su franja para ganar el cultivo de algas. */
  algaeHoldSec: number;
  /** Media altura de la franja verde de cada jeringa (0–1): más angosta, más difícil. */
  algaeBandHalf: number;
}

export const MINI_DIFFICULTY: Record<DifficultyId, MiniDifficulty> = {
  cadete: { time: 1.25, algaeTubes: 2, algaeHoldSec: 5, algaeBandHalf: 0.15 },
  piloto: { time: 1, algaeTubes: 3, algaeHoldSec: 6, algaeBandHalf: 0.13 },
  comandante: { time: 0.75, algaeTubes: 3, algaeHoldSec: 7, algaeBandHalf: 0.1 }, // franja más angosta y más tiempo a mantener
};

// ---------------------------------------------------------------- cosechar
export const HARVEST_SECONDS = 20;
/** Segundos que resta tocar una planta verde. */
export const HARVEST_PENALTY = 2;
export const harvestScore = (picked: number, ripeTotal: number): number => clamp01(picked / ripeTotal);

// ---------------------------------------------------------------- curarse
export const HEAL_HOLD_MS = 900;
/** Más rápido, más calidad: hasta 4 s da todo y a los 12 s llega a cero (× `time` de la dificultad). */
export const healScore = (elapsedMs: number, time = 1): number => clamp01(1 - (elapsedMs - 4000 * time) / (8000 * time));

// ---------------------------------------------------------------- pedalear
export const PEDAL_BEATS = 14;
/** Hay que llenar MÁS que esta fracción de la barra para ganar energía. */
export const PEDAL_PASS = 0.5;
export const pedalScore = (hits: number): number => clamp01(hits / PEDAL_BEATS);

// ---------------------------------------------------------------- mensaje con ruido: aciertos menos errores
export const messageScore = (wrongs: number): number => Math.max(0.2, 1 - wrongs * 0.3);

// ---------------------------------------------------------------- taladro de hielo
/** Segundos con el taladro sobre el punto para romper el hielo. */
export const ICE_FILL_SECONDS = 5;
/** Tiempo máximo: si se pasa, la muestra sale igual pero con la calidad mínima. */
export const ICE_MAX_SECONDS = 30;
/** Calidad = fracción del tiempo apretado que estuvo sobre el punto (nunca baja de 0,2). */
export const drillScore = (onSec: number, pressedSec: number): number => (pressedSec <= 0 ? 1 : Math.max(0.2, clamp01(onSec / pressedSec)));

// ---------------------------------------------------------------- cultivo de algas
/** Tiempo límite: si la barra no se llena antes, se pierde (sin efecto, como el pedal). */
export const ALGAE_SECONDS = 20;
/** Fuera de la franja la barra baja: a esta fracción de lo que sube. */
export const ALGAE_DRAIN = 0.5;
/** Ganado: más tiempo sobrante (sobre el límite `limitSec`), más estrellas (0,5–1). Perdido = 0. */
export const algaeScore = (timeLeftSec: number, limitSec = ALGAE_SECONDS): number => clamp01(0.5 + (0.5 * timeLeftSec) / limitSec);

