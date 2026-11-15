import { t } from '../core/i18n';

/** Controles de la estación (se muestran al empezar y en Pausa → Controles). Los textos están en data/locales. */
export type ControlId = 'walk' | 'use' | 'dash' | 'jump' | 'map' | 'pause';

export interface Control {
  id: ControlId;
  /** Teclas tal como se muestran; `Space` se traduce (Espacio / Space). */
  keys: string[];
  /** Tiene teclas alternativas (las flechas). */
  alt?: boolean;
  /** Lo mínimo para empezar: es lo único que muestra el entrenamiento inicial. */
  basic?: boolean;
}

/** 6 controles: caminar, usar, impulso, saltar, mapa y pausa. */
export const CONTROLS: Control[] = [
  { id: 'walk', keys: ['W', 'A', 'S', 'D'], alt: true, basic: true },
  { id: 'use', keys: ['E'], basic: true },
  { id: 'dash', keys: ['Shift'] },
  { id: 'jump', keys: ['Space'] },
  { id: 'map', keys: ['M'] },
  { id: 'pause', keys: ['Esc'], basic: true },
];

export const keyLabel = (key: string): string => (key === 'Space' ? t('key.space') : key);
export const controlAction = (id: ControlId): string => t(`control.${id}`);
