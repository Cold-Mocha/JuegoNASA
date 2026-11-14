import type { MissionSummary } from './simulation';

export interface ScoreResult { score: number; stars: 0 | 1 | 2 | 3; }

/** Radiación máxima para la segunda estrella. */
export const LOW_DOSE = 50;

/**
 * Puntaje y estrellas de una jornada científica: lo principal es la investigación; los recursos son secundarios.
 * ★ completar la investigación · ★★ además volver con radiación < 50 % · ★★★ además pasar todas las llamaradas en el Refugio.
 */
export function computeScore(s: MissionSummary): ScoreResult {
  const lowDose = s.resources.radiation < LOW_DOSE;
  const allSheltered = s.stats.unshieldedFlares === 0;
  const stars: ScoreResult['stars'] = !s.won ? 0 : !lowDose ? 1 : allSheltered ? 3 : 2;
  const early = s.won ? Math.max(0, s.days - s.daysSurvived) : 0; // volver antes del plazo suma
  const score =
    s.tasksDone * 300 +
    s.science * 100 +
    s.stats.shelteredFlares * 100 +
    early * 100 +
    stars * 200;
  return { score: Math.max(0, score), stars };
}
