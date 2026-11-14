import type { MissionSummary } from './simulation';

export type AchievementId =
  | 'first-forecast' | 'safe-shelter' | 'lunar-night' | 'explorer' | 'strong-signal'
  | 'mission-complete' | 'healthy-crew' | 'scientist' | 'reader';

/** Logros que se desbloquean al terminar una jornada científica (los textos están en data/achievements.ts). */
export const SCIENTIST_GOAL = 4;
/** "Tripulación sana": volver con menos de esta radiación acumulada. */
export const HEALTHY_DOSE = 30;
export function earnedAchievements(s: MissionSummary): AchievementId[] {
  const out: AchievementId[] = [];
  if (s.stats.forecasts > 0) out.push('first-forecast');
  if (s.stats.shelteredFlares > 0) out.push('safe-shelter');
  if (s.daysSurvived >= 5) out.push('lunar-night');
  if (s.stats.evas > 0) out.push('explorer');
  if (s.stats.antennaAligns > 0) out.push('strong-signal');
  if (s.won) out.push('mission-complete');
  if (s.won && s.resources.radiation < HEALTHY_DOSE) out.push('healthy-crew');
  if (s.science >= SCIENTIST_GOAL) out.push('scientist');
  return out;
}

/** Cuántas fichas del Archivo Científico hay que leer para el logro "Lector". */
export const READER_GOAL = 5;
