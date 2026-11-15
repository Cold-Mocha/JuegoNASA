import { localize } from '../core/i18n';
/** Controles de la estación (se muestran al empezar y en Pausa → Controles). */
export interface Control {
  keys: string[];
  alt?: string;
  action: string;
}

/** 6 controles: caminar, usar, impulso, saltar, mapa y pausa. */
export const CONTROLS: Control[] = localize([
  { keys: ['W', 'A', 'S', 'D'], alt: 'o flechas', action: 'Caminar' },
  { keys: ['E'], action: 'Usar la máquina que tienes cerca (otra vez E para confirmar)' },
  { keys: ['Shift'], action: 'Impulso: una carrera corta que gasta su barra' },
  { keys: ['Espacio'], action: 'Saltar (en la Luna se salta 6 veces más alto)' },
  { keys: ['M'], action: 'Mapa: mira dónde estás' },
  { keys: ['Esc'], action: 'Pausa' },
]);

export const POINTER_HINT = localize('Con el ratón o el dedo: toca el piso para caminar y una máquina para usarla.');
