import { describe, expect, it } from 'vitest';
import {
  BELT_SECONDS, ROCKS, ROVER_LEN, beltDone, beltItems, beltScore, craters, createBelt, createRover, finaleScore, hintSeconds, moveBelt, roverDone, roverScore,
  stepBelt, stepRover, terrainY,
} from '../../src/sim/finale';

const runBelt = (seed: number, hard: boolean) => {
  const s = createBelt(seed, hard);
  const kinds = new Set<string>();
  while (!beltDone(s)) { stepBelt(s, 1 / 60); s.things.forEach((t) => kinds.add(t.kind)); }
  return { s, kinds };
};

describe('la sonda', () => {
  it('el terreno es determinista y su pendiente es subible (≤ 0,7)', () => {
    let max = 0;
    for (let x = 0; x < ROVER_LEN; x += 2) max = Math.max(max, Math.abs(terrainY(x + 2) - terrainY(x)) / 2);
    expect(max).toBeLessThanOrEqual(0.7);
    expect(terrainY(1234)).toBe(terrainY(1234));
  });

  it('las 8 rocas están sobre el terreno, separadas y fuera de los cráteres', () => {
    expect(ROCKS).toHaveLength(8);
    ROCKS.forEach((r, i) => {
      expect(r).toBeLessThan(ROVER_LEN);
      if (i) expect(r - ROCKS[i - 1]).toBeLessThan(900);
      for (const c of craters(true)) expect(Math.abs(r - c)).toBeGreaterThan(100);
    });
  });

  it('el rover con gas llega al final y la nota queda entre 0 y 1', () => {
    const s = createRover(0, 0, false);
    for (let i = 0; i < 60 * 60 && !roverDone(s); i++) stepRover(s, 1 / 60, { brake: false, jump: false });
    expect(roverDone(s)).toBe(true);
    expect(roverScore(s)).toBeGreaterThanOrEqual(0);
    expect(roverScore(s)).toBeLessThanOrEqual(1);
  });

  it('volcar en un cráter cuesta 3 s y nunca termina la partida', () => {
    const s = createRover(0, 0, true);
    s.x = craters(true)[0] + 1;
    const before = s.left;
    stepRover(s, 0.01, { brake: false, jump: false });
    expect(s.flips).toBe(1);
    expect(before - s.left).toBeGreaterThanOrEqual(3);
    expect(s.x).toBeGreaterThan(craters(true)[0] + 70);
  });

  it('cada batería suma 4 s (máx. 16) y cada chip 8 s de flecha (máx. 3 chips)', () => {
    expect(createRover(2, 0, false).left - createRover(0, 0, false).left).toBe(8);
    expect(createRover(9, 0, false).left - createRover(0, 0, false).left).toBe(16);
    expect(hintSeconds(9)).toBe(24);
  });

  it('el cinturón con la misma semilla repite la secuencia y siempre aparece cada tipo de ítem', () => {
    for (const hard of [false, true]) {
      const a = runBelt(7, hard);
      const b = runBelt(7, hard);
      expect(a.s.spawned).toBe(b.s.spawned);
      expect(a.s.hull).toBe(b.s.hull);
      for (const k of ['rock', 'battery', 'chip', 'algae']) expect(a.kinds.has(k), k).toBe(true);
      expect(a.s.t).toBeGreaterThanOrEqual(BELT_SECONDS);
    }
  });

  it('los puntajes quedan entre 0 y 1 y el casco nunca baja de 0', () => {
    const s = createBelt(3, true);
    while (!beltDone(s)) stepBelt(s, 1 / 60);
    expect(s.hull).toBeGreaterThanOrEqual(0);
    expect(beltScore(s)).toBeGreaterThanOrEqual(0);
    expect(beltScore(s)).toBeLessThanOrEqual(1);
    expect(beltItems(s)).toBeLessThanOrEqual(s.items);
    moveBelt(s, -1); moveBelt(s, -1); moveBelt(s, -1);
    expect(s.lane).toBe(0);
    expect(finaleScore(1, 1, 1)).toBeCloseTo(1);
    expect(finaleScore(0, 0, 0)).toBe(0);
  });
});

describe('la sonda en la simulación', () => {
  it('solo se completa con las demás tareas de la investigación hechas, y cuenta como tarea', async () => {
    const { makeSim } = await import('./helpers');
    const sim = makeSim({ tasks: [{ id: 'a', kind: 'shelter', count: 1 }, { id: 'p', kind: 'probe', count: 1 }] });
    sim.completeProbe(0.9, 8, 2);
    expect(sim.ended).toBeNull(); // antes de terminar lo demás no cuenta
    expect(sim.stats.probe).toBe(0);
    sim.stats.shelteredFlares = 1;
    expect(sim.probeReady).toBe(true);
    sim.completeProbe(1.7, 8, 2);
    expect(sim.stats.probeScore).toBe(1); // se acota a 0–1
    expect(sim.stats.probeRocks).toBe(8);
    expect(sim.probeReady).toBe(false);
    expect(sim.ended).toBe('won');
  });
});
