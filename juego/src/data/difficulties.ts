/** Modificadores de dificultad: la simulación los lee desde state.loadout. */
export type DifficultyId = 'cadete' | 'piloto' | 'comandante';

export interface Difficulty {
  id: DifficultyId;
  name: string;
  description: string;
  stars: 1 | 2 | 3;
  drain: number;          // multiplicador del consumo pasivo (oxígeno, comida, energía)
  dayLengthSec: number;   // segundos reales que dura una jornada
  hints: boolean;         // tutorial y consejos de la Comandante
}

export const DIFFICULTIES: Difficulty[] = [
  { id: 'cadete', name: 'Cadete', description: 'Fácil. Días largos, todo dura más y la Comandante te ayuda.', stars: 1, drain: 0.7, dayLengthSec: 120, hints: true },
  { id: 'piloto', name: 'Piloto', description: 'Normal. La Comandante te avisa cuando algo está bajo.', stars: 2, drain: 1, dayLengthSec: 90, hints: true },
  { id: 'comandante', name: 'Comandante', description: 'Difícil. Días cortos y sin ayuda. ¡Como una misión real!', stars: 3, drain: 1.15, dayLengthSec: 72, hints: false },
];
