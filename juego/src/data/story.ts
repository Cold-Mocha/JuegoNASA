import { localize } from '../core/i18n';
/**
 * Historia introductoria: una lámina = imagen + texto.
 * Reemplazar las imágenes de public/story/ por las ilustraciones finales (mismo nombre, 1280×720).
 * Si una imagen usa material de la NASA, poner su crédito en `credit`.
 */
export interface StorySlide {
  image: string;
  speaker?: string;
  text: string;
  credit?: string;
  /** Aviso que se muestra tal cual (p. ej. «esto es ficción»). */
  note?: string;
}

export const STORY: StorySlide[] = localize([
  { image: 'story/01.svg', text: 'Cada noche, desde su ventana, Miu y sus amigos miraban las estrellas y soñaban con viajar entre ellas.' },
  { image: 'story/02.svg', text: 'Un día llegó una carta brillante: «Has sido seleccionado para la Academia de Astronautas Junior».' },
  { image: 'story/03.svg', speaker: 'Comandante Nébula', text: 'Bienvenidos, cadetes. En el espacio no hay que correr: hay que pensar, revisar y trabajar en equipo.' },
  { image: 'story/04.svg', speaker: 'Comandante Nébula', text: 'Su destino es la Estación Central, una base en la Luna que imaginamos para entrenar. Allí no venimos a conquistar: venimos a investigar si, algún día, personas podrían vivir en la Luna.', note: 'La base lunar y esta historia son ficción. Hoy la Luna NO es habitable: no tiene aire respirable, ni agua líquida, ni protección contra la radiación.' },
  { image: 'story/04.svg', speaker: 'Comandante Nébula', text: 'Un hábitat necesita tres cosas: aire y comida, energía y señal, y agua. Cada jornada trabaja una de ellas. Es un juego, pero así piensan los equipos reales: paso a paso y con pruebas.', note: '[PROPUESTA] La idea de «tres pasos hacia un hábitat» es una forma de ordenar el juego, no un plan oficial de ninguna agencia.' },
  { image: 'story/04.svg', speaker: 'Comandante Nébula', text: 'Y esto ya está pasando de verdad: Chile envió su primer laboratorio al espacio, un contenedor con experimentos de biología y materiales que se prueban en microgravedad y radiación, a bordo de la Estación Espacial Internacional.', note: '[REAL] Primer laboratorio chileno en el espacio (proyecto Anillo AD220057, financiado por ANID). Contenedor a la Estación Espacial Internacional con experimentos biológicos y tecnológicos.' },
  { image: 'story/04.svg', speaker: 'Comandante Nébula', text: 'Chile también es un laboratorio natural: el desierto de Atacama y la Antártica se parecen a otros mundos, y allí se prueban instrumentos antes de llevarlos al espacio. Sus datos viajan con equipos de Estados Unidos y de otros países.', note: '[REAL] Atacama (ALMA, Paranal, La Silla) y la Antártica son sitios de investigación reconocidos; la comparación con otros mundos es una analogía de trabajo.' },
  { image: 'story/04.svg', speaker: 'Comandante Nébula', text: 'Elijan su misión, su tripulante y su nivel. Al final, una sonda de control remoto llevará el rover por el espacio, recorrerán la superficie y volveremos a la Tierra en un orbitador. ¡Despegamos!' },
]);
