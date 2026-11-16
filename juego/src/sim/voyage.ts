/**
 * Regreso a casa, tramo 1 (escenas 1–5 del guion «Rueda detenida»): estado de la nave, adaptador de CO₂, presupuesto de energía y finales.
 * Sin Phaser ni DOM. Todo lo numérico es [MODELO] / [PROPUESTA]: no son mediciones reales.
 */
const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));

export interface ShipState { energy: number; air: number; antenna: number; science: number; }

/** Estado de partida según las estrellas ganadas en las tres jornadas (0–9) [PROPUESTA]: lo bien que cuidaste la base se nota al volver. */
export function shipFromStars(totalStars: number): ShipState {
  const q = clamp(totalStars / 9);
  return { energy: Math.round(45 + 45 * q), air: Math.round(45 + 45 * q), antenna: +(0.45 + 0.5 * q).toFixed(2), science: Math.round(6 + 8 * q) };
}

export interface GoItem { id: 'energy' | 'air' | 'antenna' | 'science'; go: boolean; }
/** Chequeo GO / NO-GO: un NO-GO no impide seguir, anuncia el problema que viene. */
export const goNoGo = (s: ShipState): GoItem[] => [
  { id: 'energy', go: s.energy >= 30 }, { id: 'air', go: s.air >= 30 },
  { id: 'antenna', go: s.antenna >= 0.6 }, { id: 'science', go: s.science >= 10 },
];

// ------------------------------------------------------------------ sintonía de radio (escena 3)
export interface DialConfig { tolerance: number; drift: number; seconds: number; lockSeconds: number; }
/** Con antena buena la banda es ancha y el ruido se mueve poco [MODELO]. */
export const dialConfig = (antenna: number, hard: boolean): DialConfig => ({
  tolerance: +(0.05 + 0.07 * clamp(antenna)).toFixed(3) * (hard ? 0.8 : 1),
  drift: (0.05 + 0.06 * (1 - clamp(antenna))) * (hard ? 1.3 : 1),
  seconds: hard ? 22 : 28,
  lockSeconds: hard ? 2.5 : 2,
});
/** Fuerza de la señal 0–1 según la distancia al canal. */
export const dialSignal = (pos: number, target: number, tolerance: number): number => clamp(1 - Math.abs(pos - target) / (tolerance * 3));

// ------------------------------------------------------------------ el adaptador de CO₂ (escena 4)
export const ADAPTER_STEPS = ['bolsa', 'carton', 'manguera', 'cinta', 'filtro'] as const;
export type AdapterStep = (typeof ADAPTER_STEPS)[number];
export const adapterScore = (errors: number): number => clamp(1 - errors * 0.2);

// ------------------------------------------------------------------ presupuesto de energía (escena 5)
export interface Breaker { id: 'luces' | 'calefaccion' | 'laboratorio' | 'comunicaciones' | 'cultivo'; cost: number; }
export const BREAKERS: Breaker[] = [
  { id: 'luces', cost: 6 }, { id: 'calefaccion', cost: 14 }, { id: 'laboratorio', cost: 12 }, { id: 'comunicaciones', cost: 10 }, { id: 'cultivo', cost: 8 },
];
/** Reserva mínima para el escudo y la quema [MODELO]. */
export const SHIELD_NEED = 30;
export const reserve = (energy: number, on: ReadonlySet<Breaker['id']>): number =>
  energy - BREAKERS.filter((b) => on.has(b.id)).reduce((a, b) => a + b.cost, 0);
/** La mejor respuesta apaga solo lo necesario y deja las comunicaciones encendidas hasta el apagón de radio. */
export function powerScore(energy: number, on: ReadonlySet<Breaker['id']>): number {
  const r = reserve(energy, on);
  const base = r >= SHIELD_NEED ? 1 : 0.25 + 0.5 * clamp(r / SHIELD_NEED);
  return clamp(base - (on.has('comunicaciones') ? 0 : 0.35) - (r >= SHIELD_NEED && r > SHIELD_NEED + 30 ? 0.1 : 0));
}

// ------------------------------------------------------------------ finales (ninguno castiga)
export type Ending = 'A' | 'B' | 'C';
export interface VoyageResult { signal: number; air: number; power: number; inspected: number; unfound: number; reentry: number; glide: number; }
/**
 * A «Rueda detenida»: nave segura y buena inspección y reingreso.
 * B «El rescate»: se detectó todo el daño, pero la nave no está segura (aire o energía bajos) → vuelve la tripulación en otra nave.
 * C «Silencio»: inspección incompleta o reingreso fallido; se ofrece reintentar. [PROPUESTA]
 */
export function endingFor(r: VoyageResult): Ending {
  if (r.inspected < 0.5 || r.reentry < 0.3) return 'C';
  const unsafe = Math.min(r.air, r.power) < 0.5;
  if (r.unfound === 0 && unsafe) return 'B';
  if (r.inspected >= 0.85 && r.reentry >= 0.5 && !unsafe) return 'A';
  return r.reentry >= 0.5 ? 'A' : 'C';
}
export const voyageScore = (r: VoyageResult): number =>
  Math.round(100 * (0.1 * r.signal + 0.1 * r.air + 0.1 * r.power + 0.2 * r.inspected + 0.3 * r.reentry + 0.2 * r.glide));
