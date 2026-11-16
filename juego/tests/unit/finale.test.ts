import { describe, expect, it } from 'vitest';
import {
  BELT_SECONDS, POTHOLE_W, ROVER_AIR_SEC, ROCKS, ROVER_LEN, beltDone, beltItems, beltScore, craters, createBelt, createRover, finaleScore, hintSeconds, moveBelt, roverDone, roverLives, roverScore, potholes,
  stepBelt, stepRover, terrainY,
} from '../../src/sim/finale';

const runBelt = (seed: number, hard: boolean) => {
  const s = createBelt(seed, hard);
  const kinds = new Set<string>();
  while (!beltDone(s)) { stepBelt(s, 1 / 60); s.things.forEach((t) => kinds.add(t.kind)); }
  return { s, kinds };
};

describe('la sonda', () => {
  it('el terreno es determinista y su pendiente es subible (≤ 0,85)', () => {
    let max = 0;
    for (let x = 0; x < ROVER_LEN; x += 2) max = Math.max(max, Math.abs(terrainY(x + 2) - terrainY(x)) / 2);
    expect(max).toBeLessThanOrEqual(0.85);
    expect(terrainY(1234)).toBe(terrainY(1234));
  });

  it('las 8 rocas están separadas y lejos de los baches; baches y cráteres no se pisan', () => {
    expect(ROCKS).toHaveLength(8);
    ROCKS.forEach((r, i) => {
      expect(r).toBeLessThan(ROVER_LEN);
      if (i) expect(r - ROCKS[i - 1]).toBeLessThan(900);
      for (const p of potholes(true)) expect(r < p - 60 || r > p + POTHOLE_W + 60).toBe(true);
    });
    for (const p of potholes(true)) for (const c of craters(true)) expect(Math.abs(p - c.x)).toBeGreaterThan(c.r + 60);
  });

  /** Jugador automático: pedal siempre y salta antes de cada bache. */
  const drive = (hard: boolean, jumper: boolean) => {
    const s = createRover(0, 0, hard);
    for (let i = 0; i < 60 * 120 && !roverDone(s); i++) {
      const next = potholes(hard).find((p) => p + POTHOLE_W > s.x && p - s.x < 110);
      stepRover(s, 1 / 60, { pedal: true, jump: jumper && next !== undefined && s.x + (s.v * ROVER_AIR_SEC) / 2 >= next + POTHOLE_W / 2 });
    }
    return s;
  };

  it('con pedal y saltando los baches se cruzan cuestas y cráteres, junta todas las rocas y llega a tiempo', () => {
    for (const hard of [false, true]) {
      const s = drive(hard, true);
      expect(s.rocks.size).toBe(ROCKS.length); // junta todas las rocas del recorrido
      expect(s.deaths).toBe(0);
      expect(s.left).toBeGreaterThan(0);
      expect(roverScore(s)).toBeGreaterThan(0);
      expect(roverScore(s)).toBeLessThanOrEqual(1);
    }
  });

  it('el rover no se teletransporta: en un paso nunca avanza más que su velocidad máxima', () => {
    const s = createRover(0, 0, true);
    let last = s.x;
    for (let i = 0; i < 60 * 30; i++) {
      stepRover(s, 1 / 60, { pedal: true, jump: i % 90 === 0 });
      if (s.respawnAt === null) expect(Math.abs(s.x - last)).toBeLessThan(6);
      last = s.x;
    }
  });

  it('un bache sin saltar quita 1 de 3 integridades, cuesta 2 s y devuelve al último punto de control; a la tercera queda varado', () => {
    const s = createRover(0, 0, true);
    const p = potholes(true)[1]; // 1650: el último punto de control antes es 1500
    s.x = p - 1; s.v = 100;
    const before = s.left;
    stepRover(s, 1 / 60, { pedal: false, jump: false });
    expect(s.deaths).toBe(1);
    expect(s.x).toBe(1500);
    expect(before - s.left).toBeGreaterThanOrEqual(2);
    expect(roverDone(s)).toBe(false);
    for (let k = 0; k < 2; k++) { s.invuln = 0; s.x = p + 1; s.h = 0; stepRover(s, 1 / 60, { pedal: false, jump: false }); }
    expect(roverLives(s)).toBe(0);
    expect(roverDone(s)).toBe(true);
  });

  it('saltando se pasa por encima del bache sin perder integridad', () => {
    const s = createRover(0, 0, true);
    const p = potholes(true)[0];
    s.x = p - 20; s.v = 120;
    for (let i = 0; i < 60; i++) stepRover(s, 1 / 60, { pedal: true, jump: i === 0 });
    expect(s.deaths).toBe(0);
    expect(s.x).toBeGreaterThan(p + POTHOLE_W);
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
  it('se llama al terminar la investigación (etapa 2) y bloquea la vuelta a la Tierra hasta entregarla', async () => {
    const { makeSim } = await import('./helpers');
    const sim = makeSim({ tasks: [{ id: 'a', kind: 'shelter', count: 1 }, { id: 'p', kind: 'probe', count: 1, stage: 2 }, { id: 'e', kind: 'action', action: 'tellEarth', count: 1, stage: 2 }] });
    sim.completeProbe(0.9, 8, 2);
    expect(sim.ended).toBeNull(); // antes de terminar lo demás no cuenta
    expect(sim.stats.probe).toBe(0);
    sim.stats.shelteredFlares = 1;
    expect(sim.probeReady).toBe(true);
    expect(sim.canAct('tellEarth').reason).not.toBe('locked');
    expect(sim.available('tellEarth')).toBe(false); // primero la sonda
    sim.completeProbe(1.7, 8, 2);
    expect(sim.stats.probeScore).toBe(1); // se acota a 0–1
    expect(sim.stats.probeRocks).toBe(8);
    expect(sim.probeReady).toBe(false);
    expect(sim.ended).toBeNull(); // falta reconectar con la Tierra
  });
});
