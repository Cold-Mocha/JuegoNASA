import type { MissionSummary } from './simulation';

export type AchievementId =
  | 'safe-shelter' | 'lunar-night' | 'explorer' | 'strong-signal'
  | 'mission-complete' | 'healthy-crew' | 'reader';

/** Logros que se desbloquean al terminar una jornada científica (los textos están en data/achievements.ts). */
/** "Tripulación sana": volver con al menos esta salud. */
export const HEALTHY_HEALTH = 80;
export function earnedAchievements(s: MissionSummary): AchievementId[] {
  const out: AchievementId[] = [];
  if (s.stats.shelteredFlares > 0) out.push('safe-shelter');
  if (s.stats.nightActions > 0) out.push('lunar-night');
  if (s.stats.evas > 0) out.push('explorer');
  if (s.stats.antennaAligns > 0) out.push('strong-signal');
  if (s.won) out.push('mission-complete');
  if (s.won && s.resources.health >= HEALTHY_HEALTH) out.push('healthy-crew');
  return out;
}

/** Cuántas fichas del Archivo Científico hay que leer para el logro "Lector". */
export const READER_GOAL = 5;
