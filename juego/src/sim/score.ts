import type { MissionSummary } from './simulation';

export interface ScoreResult { score: number; stars: 0 | 1 | 2 | 3; }

/** Salud mínima para la segunda estrella y para la tercera (con todas las llamaradas pasadas dentro de la nave). */
export const GOOD_HEALTH = 50;
export const GREAT_HEALTH = 80;

/**
 * Puntaje y estrellas de una jornada científica. Ocho términos:
 * tareas×300 + llamaradas dentro de la nave×100 + días ahorrados×100 + salud final×2 + recursos sobrantes (promedio) + estrellas×200
 * + biofirmas (nota de cada muestra analizada ×100; opcional, 0 si no se analiza) + nota de la sonda×200.
 * ★ completar la investigación · ★★ además volver con salud ≥ 50 · ★★★ además salud ≥ 80 y todas las llamaradas dentro de la nave.
 */
export function computeScore(s: MissionSummary): ScoreResult {
  const { health, energy, oxygen, food } = s.resources;
  const allSheltered = s.stats.unshieldedFlares === 0;
  const stars: ScoreResult['stars'] = !s.won ? 0 : health < GOOD_HEALTH ? 1 : health >= GREAT_HEALTH && allSheltered ? 3 : 2;
  const early = s.won ? Math.max(0, s.days - s.daysSurvived) : 0; // volver antes del plazo suma
  const score =
    s.tasksDone * 300 +
    s.stats.shelteredFlares * 100 +
    early * 100 +
    Math.round(health) * 2 +
    Math.round((energy + oxygen + food) / 3) +
    stars * 200 +
    Math.round(s.stats.bioScore * 100) +
    Math.round(s.stats.probeScore * 200);
  return { score: Math.max(0, score), stars };
}
