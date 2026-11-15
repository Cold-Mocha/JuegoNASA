/**
 * Capas de la atmósfera para la pantalla de carga (valores de referencia NASA / NOAA, aproximados).
 * La pantalla no es a escala: cada capa ocupa una banda; la altitud mostrada sí es real.
 */
import { t } from '../core/i18n';

export type LayerId = 'tropo' | 'strato' | 'meso' | 'thermo' | 'cislunar';

export interface Layer {
  id: LayerId;
  fromKm: number;
  toKm: number;
  sky: number;   // color de fondo de la banda (arte)
}

export const LAYERS: Layer[] = [
  { id: 'tropo', fromKm: 0, toKm: 12, sky: 0x4a9fe0 },
  { id: 'strato', fromKm: 12, toKm: 50, sky: 0x2f5fb8 },
  { id: 'meso', fromKm: 50, toKm: 85, sky: 0x2a2f8a },
  { id: 'thermo', fromKm: 85, toKm: 600, sky: 0x1d1a62 },
];

export const CISLUNAR: Layer = {
  id: 'cislunar', fromKm: 600, toKm: 384_400, sky: 0x0e0b33,
};

/** Línea que dice Control al cruzar la capa: su nombre y un dato. */
export const layerLine = (id: LayerId): string => `${t(`layer.${id}.name`)}: ${t(`layer.${id}.fact`)}`;
