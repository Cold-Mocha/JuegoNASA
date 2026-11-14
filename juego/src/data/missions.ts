import { DONKI_ARCHIVE, type ArchivedWeek } from './donki-archive';
import { mapFlaresToDays } from '../sim/flares';
import { ACTIONS } from '../sim/rules';
import type { ActionId, RoomId, SolarEvent, TaskGoal } from '../sim/types';

/**
 * Jornadas científicas: cada una es una INVESTIGACIÓN con una lista de tareas. Al cumplirlas todas, la tripulación
 * vuelve a la Tierra. Los recursos (energía, oxígeno…) son secundarios: hay que cuidarlos para poder investigar.
 * El "clima" de fondo es una semana REAL de llamaradas (archivo DONKI). Los textos de las investigaciones son
 * propuestas del equipo: sus fuentes se revisarán en una iteración siguiente.
 * Agregar una jornada = un objeto aquí (y, si hace falta, una semana nueva en donki-archive.ts).
 */
export type MissionId = 'huerto-lunar' | 'hielo-lunar' | 'cazadores-tormentas';

/** Tarea con su texto para el jugador. */
export type ResearchTask = TaskGoal & { label: string };

export interface Mission {
  id: MissionId;
  name: string;
  question: string;      // la pregunta que responde la investigación
  brief: string;         // qué hay que hacer (texto para niños)
  tagline: string;       // semana real del Sol que se vive de fondo
  level: 1 | 2 | 3;
  accent: string;        // token de color del design system
  archiveId: string;
  tasks: ResearchTask[];
}

/** Plazo de cada jornada científica (días lunares comprimidos). */
export const MISSION_DAYS = 7;

const act = (id: string, action: ActionId, count: number, label: string): ResearchTask => ({ id, kind: 'action', action, count, label });
const shelter = (id: string, count: number, label: string): ResearchTask => ({ id, kind: 'shelter', count, label });

/** Tres jornadas, una por nivel: primero sin llamaradas, después con algunas y al final la gran tormenta. */
export const MISSIONS: Mission[] = [
  {
    id: 'huerto-lunar', name: 'Huerto lunar', level: 1, accent: 'aurora-teal', archiveId: 'quiet-2019', tagline: 'Sol de diciembre de 2019',
    question: '¿Pueden las algas darnos aire y comida en la Luna?',
    brief: 'Las algas crecen con luz y fabrican aire. Sal al invernadero, cultívalas, limpia el aire y manda los resultados a la Tierra. Esa semana el Sol estuvo tranquilo.',
    tasks: [
      act('huerto-luces', 'growLights', 3, 'Encender las luces de las algas 3 veces'),
      act('huerto-aire', 'recycleAir', 2, 'Limpiar el aire 2 veces'),
      act('huerto-datos', 'alignAntenna', 1, 'Mandar los resultados a la Tierra'),
    ],
  },
  {
    id: 'hielo-lunar', name: 'Hielo en la Luna', level: 2, accent: 'comet-cyan', archiveId: 'oct-2024', tagline: 'Sol de octubre de 2024',
    question: '¿Hay agua congelada cerca de la estación?',
    brief: 'Los cráteres de los polos lunares casi no reciben sol y pueden guardar hielo. Pide el pronóstico, sal a la roca con hielo y avisa a la Tierra.',
    tasks: [
      act('hielo-pronostico', 'forecast', 1, 'Pedir el pronóstico del Sol antes de salir'),
      act('hielo-muestras', 'eva', 2, 'Recoger muestras de hielo 2 veces'),
      act('hielo-datos', 'alignAntenna', 1, 'Mandar los datos a la Tierra'),
    ],
  },
  {
    id: 'cazadores-tormentas', name: 'Cazadores de tormentas', level: 3, accent: 'nebula-magenta', archiveId: 'may-2024', tagline: 'Sol de mayo de 2024',
    question: '¿Cómo protegemos a la tripulación de las llamaradas?',
    brief: 'En mayo de 2024 el Sol lanzó muchas llamaradas fuertes en una semana. Pide pronósticos, vuelve a la nave a tiempo y manda el informe.',
    tasks: [
      act('tormenta-pronosticos', 'forecast', 2, 'Pedir 2 pronósticos del Sol'),
      shelter('tormenta-refugio', 2, 'Pasar 2 llamaradas dentro de la nave'),
      act('tormenta-informe', 'alignAntenna', 1, 'Mandar el informe a la Tierra'),
    ],
  },
];

/** Sala donde se avanza una tarea (para guiar al jugador). */
export const taskRoom = (t: TaskGoal): RoomId => (t.kind === 'action' ? ACTIONS[t.action].room : t.kind === 'shelter' ? 'esclusa' : 'exterior');

export const archiveFor = (m: Mission): ArchivedWeek => {
  const week = DONKI_ARCHIVE.find((w) => w.id === m.archiveId);
  if (!week) throw new Error(`Falta la semana "${m.archiveId}" en donki-archive.ts`);
  return week;
};

export const missionEvents = (m: Mission): SolarEvent[] => {
  const week = archiveFor(m);
  return mapFlaresToDays(week.flares, week.startDate, MISSION_DAYS);
};

/** Fecha real de un día de la jornada (para mostrarla en el HUD). */
export function realDate(m: Mission, day: number): string {
  const d = new Date(`${archiveFor(m).startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day - 1);
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Texto de crédito honesto: dice si el dato es archivado y si ya se verificó contra DONKI. */
export const sourceCredit = (m: Mission): string =>
  archiveFor(m).verifiedAgainstDonki ? 'FUENTE: NASA DONKI, archivo histórico (no en vivo)' : 'FUENTE: NASA / NOAA, archivo histórico (no en vivo)';
