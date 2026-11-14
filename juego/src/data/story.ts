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
}

export const STORY: StorySlide[] = [
  { image: 'story/01.svg', text: 'Cada noche, desde su ventana, Miu y sus amigos miraban las estrellas y soñaban con viajar entre ellas.' },
  { image: 'story/02.svg', text: 'Un día llegó una carta brillante: «Has sido seleccionado para la Academia de Astronautas Junior».' },
  { image: 'story/03.svg', speaker: 'Comandante Nébula', text: 'Bienvenidos, cadetes. En el espacio no hay que correr: hay que pensar, revisar y trabajar en equipo.' },
  { image: 'story/04.svg', speaker: 'Comandante Nébula', text: 'Elijan su misión, su tripulante y su nivel. ¡El cohete a la Estación Central, en la Luna, está listo!' },
];
