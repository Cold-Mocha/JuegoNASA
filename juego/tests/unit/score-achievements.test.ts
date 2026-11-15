import { describe, expect, it } from 'vitest';
import { computeScore } from '../../src/sim/score';
import { earnedAchievements } from '../../src/sim/achievements';
import type { MissionSummary } from '../../src/sim/simulation';
import { ACHIEVEMENTS } from '../../src/data/achievements';

const base: MissionSummary = {
  won: true, cause: null, daysSurvived: 5, days: 7, science: 6, tasksDone: 3, tasksTotal: 3,
  resources: { energy: 40, oxygen: 40, food: 40, health: 90, radiation: 20 },
  stats: { shelteredFlares: 2, unshieldedFlares: 0, evas: 3, antennaAligns: 1, actions: 20, actionsBy: {}, probe: 0, dna: 0, probeScore: 0, probeRocks: 0, probeCargo: 0 },
};

describe('puntaje y estrellas', () => {
  it('3 estrellas: completa la investigación con buena salud y todas las llamaradas dentro de la nave', () => {
    expect(computeScore(base).stars).toBe(3);
  });

  it('2 estrellas si una llamarada lo pilló afuera; 1 si vuelve con poca salud', () => {
    expect(computeScore({ ...base, stats: { ...base.stats, unshieldedFlares: 1 } }).stars).toBe(2);
    expect(computeScore({ ...base, resources: { ...base.resources, health: 30 } }).stars).toBe(1);
  });

  it('0 estrellas si la investigación queda incompleta', () => {
    expect(computeScore({ ...base, won: false, cause: 'timeout', tasksDone: 2, daysSurvived: 7 }).stars).toBe(0);
  });

  it('el puntaje se calcula con la fórmula documentada (volver antes suma)', () => {
    expect(computeScore(base).score).toBe(3 * 300 + 6 * 100 + 2 * 100 + 2 * 100 + 90 * 2 + 40 + 3 * 200);
  });

  it('cada tarea cumplida suma, aunque la investigación quede incompleta', () => {
    const lost = (tasksDone: number) => computeScore({ ...base, won: false, cause: 'timeout', tasksDone, daysSurvived: 7 }).score;
    expect(lost(2)).toBeGreaterThan(lost(1));
  });
});

describe('logros científicos', () => {
  it('una jornada perfecta los entrega todos menos el de lectura', () => {
    expect(earnedAchievements(base).sort()).toEqual(Object.keys(ACHIEVEMENTS).filter((k) => k !== 'reader').sort());
  });

  it('una partida sin acciones no entrega logros', () => {
    const empty: MissionSummary = { ...base, won: false, daysSurvived: 2, science: 0,
      stats: { shelteredFlares: 0, unshieldedFlares: 1, evas: 0, antennaAligns: 0, actions: 0, actionsBy: {}, probe: 0, dna: 0, probeScore: 0, probeRocks: 0, probeCargo: 0 } };
    expect(earnedAchievements(empty)).toEqual([]);
  });
});
