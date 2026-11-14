import type { ActionCheck, ActionId } from '../sim/types';

/** Textos de las acciones de cada sala (los números viven en sim/rules.ts). */
export const ACTION_TEXT: Record<ActionId, { label: string; why: string }> = {
  repairAntenna: { label: 'Reparar la antena', why: 'La antena se desajusta con los días y la señal con la Tierra se debilita. Conecta los cables en el minijuego para repararla. La Tierra tarda casi 3 segundos en responder.' },
  growLights: { label: 'Encender luces de las algas', why: 'Las algas del invernadero dan O₂ y comida: un poco ahora y más al terminar el día.' },
  harvest: { label: 'Cosechar', why: 'Minijuego: toca solo las plantas maduras y deja las verdes. Cuanto más cosechas, más comida recuperas.' },
  cleanDust: { label: 'Limpiar el polvo de los paneles', why: 'El polvo lunar tapa las celdas de los paneles. Los limpias a mano con un cepillo (minijuego); al terminar, la energía vuelve a renovarse sola.' },
  cleanTestPanel: { label: 'Limpiar el panel de pruebas', why: 'Es el panel de la investigación: cuánto polvo junta en un día. Se limpia a mano con el cepillo (minijuego). Una vez por día.' },
  eva: { label: 'Recoger muestras de hielo', why: 'Muestras para la ciencia. Afuera hay más radiación y el traje gasta oxígeno. Una vez por día.' },
  repair: { label: 'Sellar la fractura', why: 'Una grieta deja escapar el aire: el oxígeno de la nave baja hasta cerrarla. Sigue la grieta con el sellador (minijuego).' },
  heal: { label: 'Curarse', why: 'Minijuego: trata cada herida de la camilla. Recupera salud; gasta energía y un poco de comida.' },
};

export const BLOCK_REASON: Record<NonNullable<ActionCheck['reason']>, string> = {
  busy: 'Estás caminando.',
  cooldown: 'Espera un momento…',
  noEnergy: 'No hay energía suficiente.',
  noFood: 'No hay comida suficiente.',
  locked: 'Primero termina las tareas de la investigación.',
  leak: 'Hay una fractura: el aire se escapa. Repárala primero.',
  night: 'Es de noche: los paneles no reciben luz.',
  noLink: 'La señal es débil: alinea la antena en Comunicaciones.',
  evaDone: 'Ya saliste hoy. Vuelve mañana.',
  doneToday: 'Eso ya lo hiciste hoy. Vuelve mañana.',
  ended: 'La misión terminó.',
};

export const RESOURCE_TEXT = {
  energy: { label: 'Energía', short: 'Energía' },
  oxygen: { label: 'Oxígeno', short: 'O₂' },
  food: { label: 'Comida', short: 'Comida' },
  health: { label: 'Salud', short: 'Salud' },
  radiation: { label: 'Radiación', short: 'Rad' },
  science: { label: 'Ciencia', short: 'Ciencia' },
} as const;


/** Máquinas sin acciones: información (y, si tienen, una ficha del Archivo para leer). */
export const MACHINE_INFO: Record<string, { body: string; read?: string; entry?: string }> = {
};
