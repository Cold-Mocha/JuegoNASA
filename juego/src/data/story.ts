import type { TKey } from '../core/i18n';

/**
 * Historia introductoria: una lámina = imagen + texto (el texto está en data/locales).
 * Reemplazar las imágenes de public/story/ por las ilustraciones finales (mismo nombre, 1280×720).
 * Si una imagen usa material de la NASA, poner su crédito en `credit`.
 */
export interface StorySlide {
  image: string;
  /** Habla la Comandante Nébula (si no, es narración). */
  commander?: boolean;
  text: TKey;
  credit?: string;
}

export const STORY: StorySlide[] = [
  { image: 'story/01.svg', text: 'story.1' },
  { image: 'story/02.svg', text: 'story.2' },
  { image: 'story/03.svg', commander: true, text: 'story.3' },
  { image: 'story/04.svg', commander: true, text: 'story.4' },
];
