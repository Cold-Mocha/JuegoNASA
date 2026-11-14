import type { SolarEvent } from './types';

export interface FlareClass { letter: 'A' | 'B' | 'C' | 'M' | 'X'; magnitude: number; }

const LETTERS = ['A', 'B', 'C', 'M', 'X'] as const;

/** "X9.3" → { letter: 'X', magnitude: 9.3 }. Lanza error si el formato no es GOES. */
export function parseFlareClass(classType: string): FlareClass {
  const m = /^([ABCMX])(\d+(?:\.\d+)?)$/.exec(classType.trim().toUpperCase());
  if (!m) throw new Error(`Clase de llamarada inválida: "${classType}"`);
  return { letter: m[1] as FlareClass['letter'], magnitude: Number(m[2]) };
}

/** Flujo de rayos X en el pico (W/m²): cada letra es 10× la anterior (A = 1e-8 … X = 1e-4). */
export function peakFlux(classType: string): number {
  const { letter, magnitude } = parseFlareClass(classType);
  return magnitude * 10 ** (LETTERS.indexOf(letter) - 8);
}

/**
 * Dosis de juego (puntos de la barra de radiación) para una llamarada sin protección.
 * Escala logarítmica del flujo real: una X9 pesa mucho más que una M5, sin volverse imposible.
 * Las tormentas de partículas (SEP) suman 50 %: son las que más dañan fuera de la Tierra.
 */
export function flareDose(classType: string, sep: boolean): number {
  const decades = Math.log10(peakFlux(classType) / 1e-6); // C1 = 0, M1 = 1, X1 = 2, X10 = 3
  const base = decades <= 0 ? 1 : 2 + 6 * decades ** 1.3;
  return Math.round(base * (sep ? 1.5 : 1));
}

export type FlareSeverity = 'minor' | 'moderate' | 'severe';

export function severity(classType: string): FlareSeverity {
  const { letter, magnitude } = parseFlareClass(classType);
  if (letter === 'X' && magnitude >= 5) return 'severe';
  if (letter === 'X' || (letter === 'M' && magnitude >= 5)) return 'moderate';
  return 'minor';
}

const DAY_MS = 86_400_000;

/** Ubica llamaradas reales en las jornadas de la misión según su fecha (jornada 1 = startDate). */
export function mapFlaresToDays(
  flares: ReadonlyArray<{ peakTime: string; classType: string; sep: boolean }>,
  startDate: string,
  days: number,
): SolarEvent[] {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  return flares
    .map((f) => {
      const t = Date.parse(f.peakTime);
      const offset = (t - start) / DAY_MS;
      return { day: Math.floor(offset) + 1, hour: (offset % 1) * 24, classType: f.classType, sep: f.sep, peakTime: f.peakTime };
    })
    .filter((e) => e.day >= 1 && e.day <= days)
    .sort((a, b) => a.day - b.day || a.hour - b.hour);
}
