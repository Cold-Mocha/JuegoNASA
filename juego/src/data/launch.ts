import { t } from '../core/i18n';

/**
 * Guion y línea de tiempo del despegue (pantalla de carga). Todos los tiempos en ms desde que abre la escena.
 * Los instantes del conteo regresivo se derivan de LIFTOFF_MS: T-n = LIFTOFF_MS - n·1000.
 */
export const COUNTDOWN_FROM = 10;                         // el conteo muestra T-10 … T-0
export const LIFTOFF_MS = 14_500;                         // T-0: encendido de los propulsores laterales y despegue
export const COUNTDOWN_START_MS = LIFTOFF_MS - COUNTDOWN_FROM * 1000;
export const IGNITION_T = 6;                              // T-6: encendido de los motores principales y vapor de agua
export const IGNITION_MS = LIFTOFF_MS - IGNITION_T * 1000;
export const ASCENT_MS = 10_500;                          // del despegue a salir por arriba de la pantalla

export type Speaker = 'control' | 'crew';

export interface LaunchLine {
  at: number;        // ms (se muestra cuando llega ese instante y la línea anterior ya se leyó)
  who: Speaker;
  text: string;      // `{name}` se reemplaza por el nombre del tripulante elegido
}

/** Comunicación directa entre el Control de misión (torre) y el tripulante elegido; `{name}` es el nombre del tripulante (ver `fillName`). */
export const launchScript = (): LaunchLine[] => [
  { at: 600, who: 'control', text: t('launch.line.1') },
  { at: 3000, who: 'crew', text: t('launch.line.2') },
  { at: 5300, who: 'control', text: t('launch.line.3') },
  { at: 8300, who: 'control', text: t('launch.line.4') },
  { at: 11_200, who: 'crew', text: t('launch.line.5') },
  { at: 13_000, who: 'control', text: t('launch.line.6') },
  { at: 15_100, who: 'control', text: t('launch.line.7') },
];

/**
 * Subida: cada capa de la atmósfera (LAYERS + CISLUNAR) anuncia su dato cuando la nave llega a su fracción de ASCENT_MS.
 * La altitud mostrada interpola entre estos puntos [fracción, km]: las alturas de cada capa son las reales.
 */
export const LAYER_LINE_AT = [0.06, 0.26, 0.44, 0.6, 0.76];
export const ALTITUDE_POINTS: ReadonlyArray<readonly [number, number]> = [[0, 0], [0.26, 12], [0.44, 50], [0.6, 85], [0.76, 600], [1, 2000]];

export const fillName = (text: string, name: string): string => text.replace(/\{name\}/g, name);

/** Altitud (km) para una fracción de subida 0–1. */
export function altitudeKm(a: number): number {
  for (let i = 1; i < ALTITUDE_POINTS.length; i++) {
    const [a1, k1] = ALTITUDE_POINTS[i];
    if (a <= a1) {
      const [a0, k0] = ALTITUDE_POINTS[i - 1];
      return k0 + ((a - a0) / (a1 - a0)) * (k1 - k0);
    }
  }
  return ALTITUDE_POINTS[ALTITUDE_POINTS.length - 1][1];
}
