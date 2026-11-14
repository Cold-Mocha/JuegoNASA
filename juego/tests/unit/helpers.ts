import { Simulation } from '../../src/sim/simulation';
import type { SimConfig, SolarEvent } from '../../src/sim/types';

export const DAY = 40;

export function makeSim(over: Partial<SimConfig> = {}): Simulation {
  return new Simulation({ days: 7, dayLengthSec: DAY, drain: 1, events: [], seed: 7, ...over });
}

export const flare = (day: number, hour: number, classType = 'X5.0', sep = false): SolarEvent =>
  ({ day, hour, classType, sep, peakTime: `2024-01-0${day}T${String(Math.floor(hour)).padStart(2, '0')}:00:00Z` });

/** Avanza el reloj en pasos pequeños (como lo haría la escena a 60 FPS). */
export function run(sim: Simulation, seconds: number, step = 1 / 60): void {
  for (let t = 0; t < seconds; t += step) sim.tick(step);
}

/** Viaja y espera a llegar. */
export function goTo(sim: Simulation, room: Parameters<Simulation['travel']>[0]): void {
  const secs = sim.travel(room);
  sim.tick(secs + 0.01);
}
