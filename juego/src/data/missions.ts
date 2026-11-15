import { DONKI_ARCHIVE, type ArchivedWeek } from './donki-archive';
import { mapFlaresToDays } from '../sim/flares';
import { ACTIONS } from '../sim/rules';
import type { ActionId, RoomId, SolarEvent, TaskGoal } from '../sim/types';
import { dateLocale, t } from '../core/i18n';

/**
 * Jornadas científicas: cada una es una INVESTIGACIÓN con una lista de tareas. Al cumplirlas todas, la tripulación
 * vuelve a la Tierra. Los recursos (energía, oxígeno…) son secundarios: hay que cuidarlos para poder investigar.
 * El "clima" de fondo es una semana REAL de llamaradas (archivo DONKI). Los textos de las investigaciones son
 * propuestas del equipo: sus fuentes se revisarán en una iteración siguiente.
 * Agregar una jornada = un objeto aquí (y, si hace falta, una semana nueva en donki-archive.ts).
 */
export type MissionId = 'huerto-lunar' | 'paneles-solares' | 'hielo-lunar';

export type TaskId =
  | 'huerto-luces' | 'huerto-cosecha' | 'huerto-polvo' | 'huerto-datos'
  | 'paneles-prueba' | 'paneles-polvo' | 'paneles-cosecha' | 'paneles-datos'
  | 'hielo-muestras' | 'hielo-polvo' | 'hielo-cosecha' | 'hielo-datos';

/** Tarea de una investigación; su texto para el jugador está en los diccionarios (`taskLabel`). */
export type ResearchTask = TaskGoal & { id: TaskId };

export interface Mission {
  id: MissionId;
  level: 1 | 2 | 3;
  accent: string;        // token de color del design system
  archiveId: string;
  tasks: ResearchTask[];
  /** Paso del tutorial que lleva al objeto propio de la jornada. `handsOn`: se exige usarlo; si no, solo se explica (p. ej. el panel de pruebas necesita una tormenta de polvo). */
  tutorial: { asset: string; action: ActionId; handsOn: boolean };
}

/** Plazo de cada jornada científica (días lunares comprimidos). */
export const MISSION_DAYS = 7;

const act = (id: TaskId, action: ActionId, count: number, stage?: 1 | 2): ResearchTask => ({ id, kind: 'action', action, count, stage });

/**
 * Textos de una jornada: nombre, pregunta que responde, qué hay que hacer (para niños), semana real del Sol que se vive de fondo,
 * objeto que solo aparece con ella y el paso del tutorial que lleva a ese objeto.
 */
export type MissionField = 'name' | 'question' | 'brief' | 'tagline' | 'newObject' | 'tutorial';
export const missionText = (id: MissionId, field: MissionField): string => t(`mission.${id}.${field}`);
export const taskLabel = (task: ResearchTask): string => t(`task.${task.id}`);

/** Entrenamiento: una sola tarea de investigación (cosechar) más el aviso a la Tierra, para ver una misión ganada de punta a punta. */
const TRAINING_TASKS: readonly TaskId[] = ['huerto-cosecha', 'huerto-datos'];
/** Tareas que cuentan en la partida: todas las de la jornada o, en el entrenamiento, solo las de práctica. */
export const missionTasks = (m: Mission, training: boolean): ResearchTask[] => (training ? m.tasks.filter((x) => TRAINING_TASKS.includes(x.id)) : m.tasks);

/** Tres jornadas: la primera con el Sol tranquilo y las otras dos con semanas reales de llamaradas. Cada una trae su objeto propio en el mapa (ver data/rooms.ts). */
export const MISSIONS: Mission[] = [
  {
    id: 'huerto-lunar', level: 1, accent: 'aurora-teal', archiveId: 'quiet-2019',
    tutorial: { asset: 'tanque-algas', action: 'growLights', handsOn: true },
    tasks: [
      act('huerto-luces', 'growLights', 3),
      act('huerto-cosecha', 'harvest', 1),
      act('huerto-polvo', 'cleanDust', 1),
      act('huerto-datos', 'tellEarth', 1, 2),
    ],
  },
  {
    id: 'paneles-solares', level: 2, accent: 'star-gold', archiveId: 'may-2024',
    tutorial: { asset: 'panel-solar', action: 'cleanTestPanel', handsOn: false },
    tasks: [
      act('paneles-prueba', 'cleanTestPanel', 3),
      act('paneles-polvo', 'cleanDust', 1),
      act('paneles-cosecha', 'harvest', 1),
      act('paneles-datos', 'tellEarth', 1, 2),
    ],
  },
  {
    id: 'hielo-lunar', level: 3, accent: 'comet-cyan', archiveId: 'oct-2024',
    tutorial: { asset: 'roca-hielo', action: 'eva', handsOn: true },
    tasks: [
      act('hielo-muestras', 'eva', 2),
      act('hielo-polvo', 'cleanDust', 1),
      act('hielo-cosecha', 'harvest', 1),
      act('hielo-datos', 'tellEarth', 1, 2),
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
  return d.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Quién registró las llamaradas de la jornada: DONKI solo si la semana ya se contrastó con su API. */
export const sourceName = (m: Mission): string => (archiveFor(m).verifiedAgainstDonki ? 'NASA DONKI' : 'NASA / NOAA');

/** Texto de crédito honesto: dice si el dato es archivado y si ya se verificó contra DONKI. */
export const sourceCredit = (m: Mission): string => t('source.credit', { source: sourceName(m) });
