/**
 * Capas de la atmósfera para la pantalla de carga (valores de referencia NASA / NOAA, aproximados).
 * La pantalla no es a escala: cada capa ocupa una banda; la altitud mostrada sí es real.
 */
export interface Layer {
  id: string;
  name: string;
  fromKm: number;
  toKm: number;
  sky: number;   // color de fondo de la banda (arte)
  fact: string;
}

export const LAYERS: Layer[] = [
  { id: 'tropo', name: 'Troposfera', fromKm: 0, toKm: 12, sky: 0x4a9fe0, fact: 'Aquí están las nubes y casi todo el clima.' },
  { id: 'strato', name: 'Estratosfera', fromKm: 12, toKm: 50, sky: 0x2f5fb8, fact: 'La capa de ozono nos protege de los rayos UV.' },
  { id: 'meso', name: 'Mesosfera', fromKm: 50, toKm: 85, sky: 0x2a2f8a, fact: 'Aquí se queman la mayoría de los meteoros.' },
  { id: 'thermo', name: 'Termosfera', fromKm: 85, toKm: 600, sky: 0x1d1a62, fact: 'Pasamos la línea de Kármán (100 km): ¡ya es el espacio!' },
];

export const CISLUNAR: Layer = {
  id: 'cislunar', name: 'Espacio cislunar', fromKm: 600, toKm: 384_400, sky: 0x0e0b33,
  fact: 'El viaje a la Luna tarda unos 3 días.',
};
