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
  /** Qué avanza hacia un hábitat lunar con este capítulo ([PROPUESTA]: metáfora de juego, no un dato real). */
  habitat: string;
}

export const CHAPTERS: Chapter[] = localize([
  {
    id: 'huerto-lunar', number: 1, title: 'Aire y comida', from: 'Dra. Almendra, Control Tierra-Chile', entry: 'chile-arads', habitat: 'Primer paso del hábitat: aire y comida',
    message: '¡Gran cosecha, tripulación! Para vivir algún día en la Luna hay que producir aire y comida, y eso empieza con seres vivos pequeños. En el desierto de Atacama, otros equipos estudian microbios que sobreviven en lugares extremos: un laboratorio natural parecido a otros mundos.',
  },
  {
    id: 'paneles-solares', number: 2, title: 'Energía y señal', from: 'Dra. Almendra, Control Tierra-Chile', entry: 'chile-seguimiento', habitat: 'Segundo paso del hábitat: energía y señal',
    message: 'Recibimos sus mediciones de energía. Un hábitat necesita luz para funcionar y una señal que lo conecte con la Tierra. Hacen falta antenas aquí abajo: hace décadas, una de ellas estaba cerca de Santiago.',
  },
  {
    id: 'hielo-lunar', number: 3, title: 'Datos para todos', from: 'Dra. Almendra, Control Tierra-Chile', entry: 'chile-act', habitat: 'Tercer paso del hábitat: agua y hielo',
    message: 'Sus muestras de hielo ya están anotadas. Si hay agua, un hábitat tiene futuro; y un dato vale más cuando se comparte: los mapas de un telescopio del desierto chileno están abiertos para cualquier científico.',
  },
  {
    id: 'casa', number: 4, title: 'De vuelta a casa', from: 'Dra. Almendra, Control Tierra-Chile', entry: 'chile-artemis', habitat: 'Cuarto paso: traer lo aprendido a casa',
    message: '¡Bienvenidos a la Tierra! Misión cumplida: aire y comida, energía y señal, agua y hielo. Son los primeros pasos de la investigación para saber si la Luna podría ser habitable algún día. Todavía no lo es, y esto se hace entre países que cooperan y comparten lo que descubren, como dicen los Acuerdos Artemis.',
  },
]);

export const chapterFor = (id: string): Chapter | undefined => CHAPTERS.find((c) => c.id === id);
