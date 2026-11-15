/** Modificadores de dificultad: la simulación los lee desde state.loadout. */
import { t } from '../core/i18n';

export type DifficultyId = 'cadete' | 'piloto' | 'comandante';

export interface Difficulty {
  id: DifficultyId;
  stars: 1 | 2 | 3;
  drain: number;          // multiplicador del consumo pasivo (oxígeno, comida, energía)
  dayLengthSec: number;   // segundos reales que dura una jornada
  hints: boolean;         // tutorial y consejos de la Comandante
}

export const DIFFICULTIES: Difficulty[] = [
  { id: 'cadete', stars: 1, drain: 0.7, dayLengthSec: 120, hints: true },
  { id: 'piloto', stars: 2, drain: 1, dayLengthSec: 90, hints: true },
  { id: 'comandante', stars: 3, drain: 1.15, dayLengthSec: 72, hints: false },
];

export const difficultyName = (id: DifficultyId): string => t(`difficulty.${id}.name`);
export const difficultyDescription = (id: DifficultyId): string => t(`difficulty.${id}.description`);
