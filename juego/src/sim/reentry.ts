import { GRAVITY } from './physics';
import { createRng } from './rng';

/**
 * Reingreso (fase 3 de «Casa»): modelo de 1 dimensión de energía, calor y corredor. Sin Phaser ni DOM.
 *
 * Qué es REAL y qué es MODELO (ver GDD / propuesta §11):
 *  - [REAL] La interfaz de entrada del transbordador está a ~122 km (400 000 pies), a ~7,8 km/s, con el vientre al flujo.
 *  - [REAL] La guía del transbordador seguía un perfil de ARRASTRE de referencia y usaba el ángulo de alabeo para corregirlo:
 *    más alabeo = menos sustentación vertical = baja antes, más aire, más frenado. Las inversiones de alabeo (giros en S) controlan el rumbo.
 *  - [REAL, escala] El calor convectivo crece como √ρ · v³ (escala de Sutton-Graves).
 *  - [MODELO] Atmósfera exponencial, sustentación/arrastre constantes y un "tiempo comprimido": ~30 min reales pasan en ~90 s de juego.
 *    Los valores de vehículo (β, L/D) son de orden de magnitud y deben verificarse antes de presentarlos como datos.
 */

// ---------------------------------------------------------------- constantes
export const EARTH_RADIUS_M = 6_371_000;
/** Interfaz de entrada [REAL, verificar]. */
export const ENTRY_INTERFACE = { altitudeM: 122_000, speedMS: 7_800, pathAngleDeg: -1.2 } as const;
/** Fin de la fase (interfaz con el planeo final, ~Mach 2,5) [MODELO]. */
export const TAEM = { speedMS: 900 } as const;
/** Distancia objetivo hasta esa interfaz (km) y tolerancia (fracción). Si llegas con energía de sobra pasas de largo; si no, quedas corto [MODELO]. */
export const TARGET_RANGE_KM = 8_085;
export const RANGE_TOLERANCE = 0.08;
/** Tiempo máximo de juego antes de darlo por "pasaste de largo". */
export const MAX_GAME_SECONDS = 140;

/** Vehículo [MODELO]: β = m / (Cd·S) en kg/m² y relación sustentación/arrastre hipersónica. */
export const VEHICLE = { ballistic: 450, liftToDrag: 1.0 } as const;
/** Atmósfera exponencial: ρ = ρ₀ · e^(−h/H). */
export const ATMOSPHERE = { rho0: 1.225, scaleHeightM: 7_200 } as const;

/** Segundos reales que pasan por cada segundo de juego. */
export const TIME_COMPRESSION = 15;
/** Mientras no hay aire (antes de empezar a guiar) el reloj corre más rápido para no esperar. */
export const COAST_SPEEDUP = 4;
/** Paso interno de integración (s reales simulados); más chico = más exacto. */
export const SUBSTEP_S = 0.5;

/** Alabeo máximo (°) y velocidad de giro del alabeo (°/s de juego). */
export const MAX_BANK_DEG = 80;
export const ROLL_RATE_DEG_PER_S = 55;

/** Aire mínimo para empezar a guiar: antes de eso el alabeo se mantiene casi nivelado (pre-bank). */
export const GUIDANCE_START_DRAG_G = 0.1;
/** Alabeo de referencia del perfil de arrastre (°). */
export const REFERENCE_BANK_DEG = 52;
/** Tope del arrastre de referencia (g) para no pedir lo imposible. */
export const REFERENCE_DRAG_MAX_G = 1.3;

/** Calor acumulado por segundo real a tasa nominal (1,0). Calibrado para que un buen vuelo use ~55 % de la barra [MODELO]. */
export const HEAT_PER_REAL_S = 0.06;

/** Límites de la fase. */
export const LIMITS = {
  heatCapacity: 100,      // barra de calor acumulado (0 a 100)
  gMax: 3.0,              // carga sobre la tripulación (g) [verificar]
  skipAltitudeM: 140_000, // si sube tanto, rebotó en la atmósfera
  headingDeg: 20,         // corredor de rumbo (±)
} as const;

/** Banda del corredor de arrastre (fracción de la referencia y mínimo absoluto en g). */
export const BAND = {
  explorer: { frac: 0.3, minG: 0.16 },
  engineer: { frac: 0.18, minG: 0.1 },
} as const;

export type Level = 'explorer' | 'engineer';
export type EntryEnding = 'running' | 'success' | 'burned' | 'skipped' | 'overstress' | 'long' | 'short' | 'offcourse';

export interface EntryOptions {
  level: Level;
  seed: number;
  /** Daños sin reparar de la inspección (fase 1): cada uno sube el calor 15 %. */
  damage?: number;
  /** Tormenta geomagnética (0 a 0,5): atmósfera alta más densa, el corredor se angosta. */
  storm?: number;
}

export interface EntryState {
  level: Level;
  t: number;              // segundos de juego
  h: number;              // altitud (m)
  v: number;              // velocidad (m/s)
  gamma: number;          // ángulo de trayectoria (rad, + sube)
  heading: number;        // error de rumbo respecto de la pista (rad, + a la derecha)
  range: number;          // distancia recorrida (km)
  bank: number;           // alabeo real (°, + a la derecha)
  command: number;        // alabeo pedido (°)
  heat: number;           // calor acumulado 0..100
  heatRate: number;       // calor instantáneo relativo 0..1+
  dragG: number;
  loadG: number;
  peakHeat: number;       // máximo de heatRate
  peakG: number;
  guiding: boolean;
  blackout: boolean;
  ending: EntryEnding;
  // acumuladores de calidad
  corridorTime: number;
  corridorSum: number;
  excursions: number;
  overHeading: boolean;
  seed: number;
  rng: () => number;
  gust: number;           // ráfaga de densidad actual (±)
  damageMult: number;
  stormBoost: number;
  headingMaxSeen: number;
  adviceSign: 1 | -1;     // lado del alabeo que aconseja el juego (con histéresis)
}

export interface EntryResult {
  ending: EntryEnding;
  corridor: number;   // 0..1
  heading: number;    // 0..1
  energy: number;     // 0..1
  heatMargin: number; // 0..1
  quality: number;    // 0..1 (se entrega como `score` al hook de minijuegos)
  stars: 0 | 1 | 2 | 3;
  peakHeatPct: number;
  peakG: number;
  finalAltitudeKm: number;
  rangeErrorPct: number;
}

// ---------------------------------------------------------------- física pura
export const density = (h: number): number => ATMOSPHERE.rho0 * Math.exp(-h / ATMOSPHERE.scaleHeightM);
export const gravityAt = (h: number): number => GRAVITY.earth * (EARTH_RADIUS_M / (EARTH_RADIUS_M + h)) ** 2;
export const mach = (v: number, h: number): number => v / soundSpeed(h);
/** Velocidad del sonido aproximada (m/s): 295 arriba de 12 km; sube un poco con la altura en la estratosfera [MODELO]. */
export const soundSpeed = (h: number): number => (h < 12_000 ? 340 - 45 * (h / 12_000) : 295);

/** Calor relativo (1 = el pico del perfil nominal): √ρ · v³ normalizado [REAL, escala]. */
export const HEAT_NORM = Math.sqrt(density(66_000)) * 6_200 ** 3;
export const heatRateOf = (rho: number, v: number): number => (Math.sqrt(rho) * v ** 3) / HEAT_NORM;

/** Arrastre de referencia (g) en función de la velocidad: planeo en equilibrio con el alabeo de referencia, con tope y rampa de arranque. */
export function referenceDragG(v: number): number {
  const vc = Math.sqrt(GRAVITY.earth * EARTH_RADIUS_M);
  const eq = Math.max(0, 1 - (v / vc) ** 2) / (VEHICLE.liftToDrag * Math.cos((REFERENCE_BANK_DEG * Math.PI) / 180));
  const ramp = Math.min(1, Math.max(0, (7_900 - v) / 900)); // sube mientras el vehículo se frena de 7,9 a 7,0 km/s
  return Math.min(REFERENCE_DRAG_MAX_G, Math.max(0.3, eq) * (0.55 + 0.45 * ramp));
}

export function bandHalfWidthG(level: Level, refG: number, storm = 0): number {
  const b = BAND[level];
  const w = Math.max(b.minG, b.frac * refG);
  return w * (1 - 0.5 * Math.max(0, Math.min(0.5, storm))); // la tormenta angosta el corredor hasta 25 %
}

/** Apagón de plasma [MODELO]: según la velocidad, mientras el aire ioniza. */
export const BLACKOUT = { fromV: 6_300, toV: 4_300 } as const;
export const inBlackout = (v: number, h: number): boolean => v <= BLACKOUT.fromV && v >= BLACKOUT.toV && h < 100_000;

// ---------------------------------------------------------------- estado y paso
export function createEntry(opts: EntryOptions): EntryState {
  const rng = createRng(opts.seed);
  return {
    level: opts.level, t: 0,
    h: ENTRY_INTERFACE.altitudeM, v: ENTRY_INTERFACE.speedMS, gamma: (ENTRY_INTERFACE.pathAngleDeg * Math.PI) / 180,
    heading: ((rng() * 2 - 1) * 8 * Math.PI) / 180,
    range: 0,
    bank: 0, command: 0,
    heat: 0, heatRate: 0, dragG: 0, loadG: 0, peakHeat: 0, peakG: 0,
    guiding: false, blackout: false,
    ending: 'running',
    corridorTime: 0, corridorSum: 0, excursions: 0, overHeading: false,
    seed: opts.seed, rng, gust: 0,
    damageMult: 1 + 0.15 * Math.max(0, Math.min(4, opts.damage ?? 0)),
    stormBoost: 1 + Math.max(0, Math.min(0.5, opts.storm ?? 0)),
    headingMaxSeen: 0,
    adviceSign: 1,
  };
}

export const clampBank = (deg: number): number => Math.max(-MAX_BANK_DEG, Math.min(MAX_BANK_DEG, deg));

/** Tolerancia actual del corredor (g) y referencia, para dibujar la banda. */
export function corridorNow(s: EntryState, storm = s.stormBoost - 1): { refG: number; lowG: number; highG: number } {
  const refG = referenceDragG(s.v);
  const half = bandHalfWidthG(s.level, refG, storm);
  return { refG, lowG: Math.max(0, refG - half), highG: refG + half };
}

/**
 * Alabeo que aconseja el juego (°, + a la derecha): más alabeo si falta arrastre, menos si sobra; y el lado se invierte
 * (inversión de alabeo, giro en S) cuando el rumbo se acerca al borde del corredor. Es el "consejo" del modo Explorador.
 */
export function adviseBank(s: EntryState): number {
  const e = (s.heading * 180) / Math.PI;
  const lim = LIMITS.headingDeg * 0.55;
  if (s.adviceSign > 0 && e > lim) s.adviceSign = -1;
  else if (s.adviceSign < 0 && e < -lim) s.adviceSign = 1;
  if (!s.guiding) return 0;
  const ref = referenceDragG(s.v);
  const err = (ref - s.dragG) / ref;
  return s.adviceSign * Math.max(5, Math.min(MAX_BANK_DEG, REFERENCE_BANK_DEG + 100 * err));
}

/** Desenlace al llegar a la interfaz con el planeo: rumbo y energía (distancia) deben estar dentro del corredor. */
function finalEnding(s: EntryState): EntryEnding {
  if (Math.abs((s.heading * 180) / Math.PI) > LIMITS.headingDeg) return 'offcourse';
  if (s.range > TARGET_RANGE_KM * (1 + RANGE_TOLERANCE) || s.t >= MAX_GAME_SECONDS) return 'long';
  if (s.range < TARGET_RANGE_KM * (1 - RANGE_TOLERANCE)) return 'short';
  return 'success';
}

/** Avanza `dt` segundos de juego con el alabeo pedido `command` (°, + a la derecha). Devuelve el mismo estado (mutado). */
export function stepEntry(s: EntryState, command: number, dt: number): EntryState {
  if (s.ending !== 'running' || dt <= 0) return s;
  s.command = clampBank(command);
  // el alabeo real sigue al pedido con velocidad limitada; antes de empezar a guiar se mantiene nivelado (pre-bank)
  const target = s.guiding ? s.command : Math.max(-12, Math.min(12, s.command));
  const maxRoll = ROLL_RATE_DEG_PER_S * dt;
  s.bank += Math.max(-maxRoll, Math.min(maxRoll, target - s.bank));

  const dtReal = dt * TIME_COMPRESSION * (s.guiding ? 1 : COAST_SPEEDUP);
  const n = Math.max(1, Math.ceil(dtReal / SUBSTEP_S));
  const h = dtReal / n;
  const bankRad = (s.bank * Math.PI) / 180;
  const gustAmp = s.level === 'explorer' ? 0.07 : 0.15;
  // ráfaga lenta y suave (ruido con memoria): un jugador atento debe seguir corrigiendo
  s.gust += (( s.rng() * 2 - 1) * gustAmp - s.gust) * Math.min(1, dt * 0.8);

  for (let i = 0; i < n; i++) {
    const rho = density(s.h) * (1 + (s.stormBoost - 1) * Math.min(1, s.h / 100_000)) * (1 + s.gust);
    const dragA = (rho * s.v * s.v) / (2 * VEHICLE.ballistic);
    const liftA = dragA * VEHICLE.liftToDrag;
    const r = EARTH_RADIUS_M + s.h;
    const g = gravityAt(s.h);
    const dv = -dragA - g * Math.sin(s.gamma);
    const dgamma = (liftA * Math.cos(bankRad) - (g - (s.v * s.v) / r) * Math.cos(s.gamma)) / s.v;
    const dh = s.v * Math.sin(s.gamma);
    const dpsi = (liftA * Math.sin(bankRad)) / (s.v * Math.cos(s.gamma));
    s.v = Math.max(1, s.v + dv * h);
    s.gamma += dgamma * h;
    s.h += dh * h;
    s.heading += dpsi * h;
    s.range += ((s.v * Math.cos(s.gamma) * EARTH_RADIUS_M) / r) * h / 1000;
    s.dragG = dragA / g;
    s.loadG = Math.hypot(dragA, liftA) / g;
    s.heatRate = heatRateOf(rho, s.v) * s.damageMult;
    if (!s.guiding && s.dragG >= GUIDANCE_START_DRAG_G) s.guiding = true;
    // el calor se acumula con la tasa: la barra llena significa "el escudo no aguanta más"
    s.heat += s.heatRate * h * HEAT_PER_REAL_S;
    s.peakHeat = Math.max(s.peakHeat, s.heatRate);
    s.peakG = Math.max(s.peakG, s.loadG);
  }
  s.t += dt;
  s.blackout = inBlackout(s.v, s.h);
  s.headingMaxSeen = Math.max(s.headingMaxSeen, Math.abs(s.heading));

  if (s.guiding) {
    const { refG, lowG, highG } = corridorNow(s);
    const err = Math.abs(s.dragG - refG);
    const half = Math.max(1e-6, highG - refG);
    s.corridorTime += dt;
    s.corridorSum += dt * Math.max(0, 1 - Math.max(0, err - half * 0.5) / (half * 1.5));
    if (s.dragG < lowG || s.dragG > highG) s.excursions += dt;
  }
  const headLimit = (LIMITS.headingDeg * Math.PI) / 180;
  s.overHeading = Math.abs(s.heading) > headLimit;

  // desenlaces
  if (s.heat >= LIMITS.heatCapacity) s.ending = 'burned';
  else if (s.h > LIMITS.skipAltitudeM && s.guiding) s.ending = 'skipped';
  else if (s.loadG > LIMITS.gMax * 1.5) s.ending = 'overstress';
  else if (s.v <= TAEM.speedMS || s.h < 12_000 || s.t >= MAX_GAME_SECONDS) s.ending = finalEnding(s);
  return s;
}

/** Calidad y estrellas al terminar (también válido a mitad de camino, para depurar). */
export function scoreEntry(s: EntryState, opts: { inspected?: boolean } = {}): EntryResult {
  const corridor = s.corridorTime > 0 ? s.corridorSum / s.corridorTime : 0;
  const headingErr = Math.abs((s.heading * 180) / Math.PI);
  const heading = Math.max(0, Math.min(1, 1 - Math.max(0, headingErr - 3) / (LIMITS.headingDeg - 3)));
  const energy = Math.max(0, Math.min(1, 1 - Math.abs(s.range / TARGET_RANGE_KM - 1) / RANGE_TOLERANCE));
  const heatMargin = Math.max(0, Math.min(1, 1 - s.heat / LIMITS.heatCapacity));
  const ok = s.ending === 'success';
  const raw = 0.4 * corridor + 0.25 * heading + 0.25 * energy + 0.1 * heatMargin;
  const quality = ok ? Math.max(0, Math.min(1, raw)) : Math.min(raw, 0.35);
  let stars: 0 | 1 | 2 | 3 = 0;
  if (ok) {
    stars = 1;
    if (s.heat <= 85 && s.peakG <= LIMITS.gMax) stars = 2;
    if (stars === 2 && quality >= 0.8 && opts.inspected !== false) stars = 3;
  }
  return {
    ending: s.ending, corridor, heading, energy, heatMargin, quality, stars,
    peakHeatPct: Math.round(Math.min(150, s.peakHeat * 100)), peakG: s.peakG, finalAltitudeKm: s.h / 1000,
    rangeErrorPct: (s.range / TARGET_RANGE_KM - 1) * 100,
  };
}
