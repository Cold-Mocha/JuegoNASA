import { describe, expect, it } from 'vitest';
import { BREAKERS, SHIELD_NEED, adapterScore, dialConfig, dialSignal, endingFor, goNoGo, powerScore, reserve, shipFromStars, voyageScore } from '../../src/sim/voyage';

const all = new Set(BREAKERS.map((b) => b.id));
describe('regreso a casa: tramo 1', () => {
  it('más estrellas dan una nave en mejor estado', () => {
    expect(shipFromStars(9).antenna).toBeGreaterThan(shipFromStars(0).antenna);
    expect(goNoGo(shipFromStars(9)).every((g) => g.go)).toBe(true);
    expect(goNoGo(shipFromStars(0)).some((g) => !g.go)).toBe(true);
  });
  it('la antena buena ensancha la banda de sintonía', () => {
    expect(dialConfig(0.9, false).tolerance).toBeGreaterThan(dialConfig(0.4, false).tolerance);
    expect(dialSignal(0.5, 0.5, 0.1)).toBe(1);
    expect(dialSignal(0.9, 0.5, 0.1)).toBe(0);
  });
  it('cada error en el adaptador resta', () => {
    expect(adapterScore(0)).toBe(1);
    expect(adapterScore(2)).toBeCloseTo(0.6);
    expect(adapterScore(9)).toBe(0);
  });
  it('el presupuesto premia apagar lo justo y dejar las comunicaciones', () => {
    const justo = new Set(['comunicaciones'] as const);
    expect(reserve(60, all)).toBe(60 - 50);
    expect(powerScore(60, all)).toBeLessThan(0.7);
    expect(powerScore(60, justo)).toBeGreaterThan(powerScore(60, new Set()));
    expect(reserve(60, justo)).toBeGreaterThanOrEqual(SHIELD_NEED);
  });
  it('los finales: A, B (rescate) y C (silencio)', () => {
    const ok = { signal: 1, air: 1, power: 1, inspected: 1, unfound: 0, reentry: 0.8, glide: 0.8 };
    expect(endingFor(ok)).toBe('A');
    expect(endingFor({ ...ok, air: 0.2 })).toBe('B');
    expect(endingFor({ ...ok, inspected: 0.3, unfound: 3 })).toBe('C');
    expect(endingFor({ ...ok, reentry: 0.1 })).toBe('C');
    expect(voyageScore(ok)).toBeGreaterThan(voyageScore({ ...ok, reentry: 0.2 }));
  });
});
