import type { ActionCheck, ActionId } from '../sim/types';

/** Textos de las acciones de cada sala (los números viven en sim/rules.ts). */
export const ACTION_TEXT: Record<ActionId, { label: string; why: string }> = {
  repairAntenna: { label: 'Reparar la antena', why: 'La antena se desajusta con los días y la señal con la Tierra se debilita. Conecta los cables en el minijuego para repararla. La Tierra tarda casi 3 segundos en responder.' },
  forecast: { label: 'Pedir el pronóstico solar', why: 'La Tierra vigila el Sol. Con el pronóstico, el aviso de cada llamarada llega 25 segundos antes en vez de 10. Necesita buena señal: si la antena se debilita, deja de llegar hasta repararla.' },
  growLights: { label: 'Encender luces de las algas', why: 'Minijuego: mantén la luz, los nutrientes y la temperatura de las algas en la franja verde. La luz calienta el tanque, así que subirla te obliga a compensar. Cuanto mejor lo hagas, más O₂ y comida dan las algas.' },
  harvest: { label: 'Cosechar', why: 'Minijuego: toca solo las plantas maduras y deja las verdes. Cuanto más cosechas, más comida recuperas. Una vez por día.' },
  cleanDust: { label: 'Limpiar el polvo de los paneles', why: 'Las tormentas de polvo lunar tapan las celdas de los paneles cuando menos lo esperas. Solo se puede limpiar cuando llega una: se hace a mano con un cepillo (minijuego) y al terminar la energía vuelve a renovarse sola.' },
  cleanTestPanel: { label: 'Limpiar el panel de pruebas', why: 'Es el panel de la investigación: cuando una tormenta de polvo lo ensucia, límpialo con el cepillo y oriéntalo hacia el Sol para medir cuánta energía da. Afuera hay radiación y el traje gasta oxígeno. Una vez por día.' },
  eva: { label: 'Recoger muestras de hielo', why: 'Muestras para la ciencia. Afuera hay más radiación y el traje gasta oxígeno. Una vez por día.' },
  repair: { label: 'Sellar la fractura', why: 'Una grieta deja escapar el aire: el oxígeno de la nave baja hasta cerrarla. Sigue la grieta con el sellador (minijuego).' },
  pedal: { label: 'Pedalear', why: 'La bicicleta de la estación convierte tu esfuerzo en energía: sigue el ritmo. Cuesta un poco de comida. Hasta 3 veces por día.' },
  heal: { label: 'Curarse', why: 'Minijuego: trata cada herida de la camilla. Recupera salud; gasta energía y un poco de comida.' },
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

