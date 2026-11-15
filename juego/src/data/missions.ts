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
export type MissionId = 'huerto-lunar' | 'paneles-solares' | 'hielo-lunar';

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
  newObject: string;     // objeto interactivo que solo aparece con esta jornada
  /** Paso del tutorial que lleva al objeto propio de la jornada. `handsOn`: se exige usarlo; si no, solo se explica (p. ej. el panel de pruebas necesita una tormenta de polvo). */
  tutorial: { asset: string; action: ActionId; text: string; handsOn: boolean };
}

/** Plazo de cada jornada científica (días lunares comprimidos). */
export const MISSION_DAYS = 7;

const act = (id: string, action: ActionId, count: number, label: string, stage?: 1 | 2): ResearchTask => ({ id, kind: 'action', action, count, label, stage });

/** Tres jornadas: la primera con el Sol tranquilo y las otras dos con semanas reales de llamaradas. Cada una trae su objeto propio en el mapa (ver data/rooms.ts). */
export const MISSIONS: Mission[] = [
  {
    id: 'huerto-lunar', name: 'Huerto lunar', level: 1, newObject: 'Cultivo de algas', accent: 'aurora-teal', archiveId: 'quiet-2019', tagline: 'Sol de diciembre de 2019',
    tutorial: { asset: 'tanque-algas', action: 'growLights', handsOn: true, text: 'Tu investigación: ve al Cultivo de algas, en el invernadero, y úsalo. Es un minijuego: mantén luz, nutrientes y temperatura en la franja verde.' },
    question: '¿Pueden las algas darnos aire y comida en la Luna?',
    brief: 'Cultiva algas con luz. El Sol está tranquilo.',
    tasks: [
      act('huerto-luces', 'growLights', 3, 'Encender las luces de las algas 3 días'),
      act('huerto-cosecha', 'harvest', 1, 'Cosechar el invernadero'),
      act('huerto-polvo', 'cleanDust', 1, 'Limpiar los paneles solares'),
      act('huerto-datos', 'repairAntenna', 1, 'Reparar la antena y avisar a la Tierra', 2),
    ],
  },
  {
    id: 'paneles-solares', name: 'Energía del Sol', level: 2, newObject: 'Panel de pruebas', accent: 'star-gold', archiveId: 'may-2024', tagline: 'Sol de mayo de 2024',
    tutorial: { asset: 'panel-solar', action: 'cleanTestPanel', handsOn: false, text: 'Tu investigación: el Panel de pruebas, afuera. Cuando una tormenta de polvo lo ensucie, límpialo y oriéntalo al Sol para medir su energía.' },
    question: '¿Cuánta energía da el Sol en la Luna, y qué la reduce?',
    brief: 'Mide los paneles en una semana de tormentas solares.',
    tasks: [
      act('paneles-prueba', 'cleanTestPanel', 3, 'Limpiar el panel de pruebas 3 días'),
      act('paneles-polvo', 'cleanDust', 1, 'Limpiar los paneles de la estación'),
      act('paneles-cosecha', 'harvest', 1, 'Cosechar para tener comida'),
      act('paneles-datos', 'repairAntenna', 1, 'Reparar la antena y avisar a la Tierra', 2),
    ],
  },
  {
    id: 'hielo-lunar', name: 'Hielo en la Luna', level: 3, newObject: 'Taladro de hielo', accent: 'comet-cyan', archiveId: 'oct-2024', tagline: 'Sol de octubre de 2024',
    tutorial: { asset: 'roca-hielo', action: 'eva', handsOn: true, text: 'Tu investigación: ve al Taladro de hielo, afuera, y úsalo. Es un minijuego: empareja cada pico del espectro con su huella.' },
    question: '¿Hay agua congelada cerca de la estación?',
    brief: 'Busca hielo en la roca de afuera.',
    tasks: [
      act('hielo-muestras', 'eva', 2, 'Recoger muestras de hielo 2 días'),
      act('hielo-polvo', 'cleanDust', 1, 'Limpiar los paneles antes de salir'),
      act('hielo-cosecha', 'harvest', 1, 'Cosechar para tener comida'),
      act('hielo-datos', 'repairAntenna', 1, 'Reparar la antena y avisar a la Tierra', 2),
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
