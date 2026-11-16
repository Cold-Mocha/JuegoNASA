import type { EntryId } from './encyclopedia';
import type { MissionId } from './missions';
import { t } from '../core/i18n';

/**
 * Capítulos de la historia «Laboratorio Chile»: cada jornada ganada (y la vuelta a casa) trae un mensaje de la Tierra.
 * Los mensajes son RECREACIÓN (la Dra. Almendra es ficticia) y apuntan a una ficha real del Archivo con su fuente.
 */
export type ChapterId = MissionId | 'casa';

export interface Chapter {
  id: ChapterId;
  number: number;
  entry: EntryId; // ficha real del Archivo
}

export const CHAPTERS: readonly Chapter[] = [
  { id: 'huerto-lunar', number: 1, entry: 'chile-arads' },
  { id: 'paneles-solares', number: 2, entry: 'chile-seguimiento' },
  { id: 'hielo-lunar', number: 3, entry: 'chile-act' },
  { id: 'casa', number: 4, entry: 'chile-artemis' },
];

export const chapterFor = (id: ChapterId): Chapter => CHAPTERS.find((c) => c.id === id)!;
export const chapterTitle = (c: Chapter): string => t(`chapter.${c.id}.title`);
export const chapterMessage = (c: Chapter): string => t(`chapter.${c.id}.message`);
/** Qué avanza hacia un hábitat lunar con este capítulo ([PROPUESTA]: metáfora de juego, no un dato real). */
export const chapterHabitat = (c: Chapter): string => t(`chapter.${c.id}.habitat`);
