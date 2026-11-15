import type { ActionCheck, ActionId } from '../sim/types';

/** Textos de las acciones de cada sala (los números viven en sim/rules.ts). */
export const ACTION_TEXT: Record<ActionId, { label: string; why: string }> = {
  repairAntenna: { label: 'Reparar la antena', why: 'Gasta energía y recupera la señal con la Tierra; la respuesta tarda casi 3 segundos.' },
  forecast: { label: 'Pedir el pronóstico solar', why: 'Gasta energía: el aviso de cada llamarada llega 25 segundos antes en vez de 10, mientras la señal sea buena.' },
  growLights: { label: 'Encender luces de las algas', why: 'Gasta energía y da O₂ y comida, más al terminar el día; una vez por día.' },
  harvest: { label: 'Cosechar', why: 'Gasta un poco de energía y da comida según lo que coseches; una vez por día.' },
  cleanDust: { label: 'Limpiar el polvo de los paneles', why: 'Afuera, con radiación: deja los paneles limpios para que la energía vuelva a subir.' },
  cleanTestPanel: { label: 'Limpiar el panel de pruebas', why: 'Afuera, con radiación: mide el panel y da ciencia; una vez por día.' },
  eva: { label: 'Recoger muestras de hielo', why: 'Afuera, con más radiación: da ciencia según lo que encuentres; una vez por día.' },
  repair: { label: 'Sellar la fractura', why: 'Gasta energía y cierra la fuga para que el oxígeno deje de bajar.' },
  pedal: { label: 'Pedalear', why: 'Cambia comida por energía; hasta 3 veces por día.' },
  heal: { label: 'Curarse', why: 'Gasta energía y comida y recupera salud.' },
};

export const BLOCK_REASON: Record<NonNullable<ActionCheck['reason']>, string> = {
  busy: 'Estás caminando.',
  cooldown: 'Espera un momento…',
  noEnergy: 'No hay energía suficiente.',
  noFood: 'No hay comida suficiente.',
  noLink: 'La señal es débil: repara la antena primero.',
  forecastOn: 'Ya pediste el pronóstico: los avisos llegan antes mientras la señal sea buena.',
  evaDone: 'Ya saliste hoy. Vuelve mañana.',
  clean: 'Los paneles están limpios. Cuando una tormenta de polvo los cubra, podrás limpiarlos.',
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

