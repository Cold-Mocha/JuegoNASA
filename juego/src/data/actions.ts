import type { ActionCheck, ActionId, ResupplyChoice } from '../sim/types';

/** Textos de las acciones de cada sala (los números viven en sim/rules.ts). */
export const ACTION_TEXT: Record<ActionId, { label: string; why: string }> = {
  alignAntenna: { label: 'Arreglar la radio', why: 'Con la radio buena llegan el pronóstico y los envíos. La Tierra tarda casi 3 segundos en responder.' },
  recycleAir: { label: 'Limpiar el aire', why: 'La máquina saca el aire que exhalas y lo vuelve respirable. Usa energía.' },
  growLights: { label: 'Encender luces de las algas', why: 'Las algas del invernadero dan aire y comida: un poco ahora y más al terminar el día. Usan más energía.' },
  forecast: { label: 'Pedir el pronóstico del Sol', why: 'La Tierra te avisa antes de las llamaradas. Necesita la radio buena.' },
  orientPanels: { label: 'Mover los paneles solares', why: 'Apuntas los paneles al Sol y ganas energía. Afuera recibes un poco de radiación. De noche no hay sol.' },
  eva: { label: 'Recoger muestras de hielo', why: 'Muestras para la ciencia. Afuera hay más radiación y el traje gasta oxígeno. Una vez por día.' },
};

export const BLOCK_REASON: Record<NonNullable<ActionCheck['reason']>, string> = {
  busy: 'Estás caminando.',
  cooldown: 'Espera un momento…',
  noEnergy: 'No hay energía suficiente.',
  night: 'Es de noche: los paneles no reciben luz.',
  noLink: 'La radio está mala: arréglala en Comunicaciones.',
  evaDone: 'Ya saliste hoy. Vuelve mañana.',
  ended: 'La misión terminó.',
};

export const RESUPPLY_TEXT: Record<ResupplyChoice, string> = {
  life: 'Tanques de aire y comida',
  energy: 'Baterías cargadas',
};

export const RESOURCE_TEXT = {
  energy: { label: 'Energía', short: 'Energía' },
  life: { label: 'Aire y comida', short: 'Aire' },
  radiation: { label: 'Radiación', short: 'Radiación' },
  science: { label: 'Ciencia', short: 'Ciencia' },
} as const;

/** Palabra simple para la fuerza de una llamarada (la clase GOES va entre paréntesis). */
export const FLARE_WORD = { minor: 'pequeña', moderate: 'fuerte', severe: 'muy fuerte' } as const;

/** Máquinas sin acciones: información (y, si tienen, una ficha del Archivo para leer). */
export const MACHINE_INFO: Record<string, { body: string; read?: string; entry?: string }> = {
  'camilla-medica': {
    body: 'Aquí no se gasta nada: es para aprender. La radiación no se cura con remedios; por eso los astronautas se protegen antes, dentro de la nave.',
    read: 'Leer: el cuerpo en el espacio',
    entry: 'body-in-space',
  },
  'puerta-esclusa': {
    body: 'Por aquí sales a la superficie lunar. Afuera tu traje gasta oxígeno y las llamaradas no tienen nada que las frene. Dentro de la nave estás a salvo.',
    read: 'Leer: radiación en la Luna',
    entry: 'moon-radiation',
  },
};
