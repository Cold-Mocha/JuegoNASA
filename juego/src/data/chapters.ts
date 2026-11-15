import { localize } from '../core/i18n';

/**
 * Capítulos de la historia «Laboratorio Chile»: cada jornada completada desbloquea un mensaje de la Tierra.
 * Los mensajes son RECREACIÓN (personaje ficticio, no real) y apuntan a una ficha real del Archivo con su fuente oficial.
 */
export type ChapterId = 'huerto-lunar' | 'paneles-solares' | 'hielo-lunar' | 'casa';

export interface Chapter {
  id: ChapterId;
  number: number;
  title: string;
  from: string;      // personaje ficticio
  message: string;
  entry: string;     // id de la ficha real del Archivo
}

export const CHAPTERS: Chapter[] = localize([
  {
    id: 'huerto-lunar', number: 1, title: 'Aire y comida', from: 'Dra. Almendra, Control Tierra-Chile', entry: 'chile-arads',
    message: '¡Gran cosecha, tripulación! Cuidar seres vivos pequeños enseña mucho. En el desierto de Atacama, otros equipos buscan microbios que sobreviven en lugares extremos.',
  },
  {
    id: 'paneles-solares', number: 2, title: 'Energía y señal', from: 'Dra. Almendra, Control Tierra-Chile', entry: 'chile-seguimiento',
    message: 'Recibimos sus mediciones de energía. Para que un mensaje llegue hasta nosotros hacen falta antenas en la Tierra: hace décadas, una de ellas estaba cerca de Santiago.',
  },
  {
    id: 'hielo-lunar', number: 3, title: 'Datos para todos', from: 'Dra. Almendra, Control Tierra-Chile', entry: 'chile-act',
    message: 'Sus muestras de hielo ya están anotadas. Un dato vale más cuando se comparte: los mapas de un telescopio del desierto chileno están abiertos para cualquier científico.',
  },
  {
    id: 'casa', number: 4, title: 'De vuelta a casa', from: 'Dra. Almendra, Control Tierra-Chile', entry: 'chile-artemis',
    message: '¡Bienvenidos a la Tierra! Misión cumplida. Explorar la Luna se hace entre países que cooperan y comparten lo que descubren, como dicen los Acuerdos Artemis.',
  },
]);

export const chapterFor = (id: string): Chapter | undefined => CHAPTERS.find((c) => c.id === id);
