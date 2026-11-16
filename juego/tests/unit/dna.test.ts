import { describe, expect, it } from 'vitest';
import { BIO_TESTS, DNA_PROBLEMS, bioScore, isLegendaryBuild, dnaCost, dnaEfficiency, dnaFit, dnaBonus, dnaScore, STRAINS, dnaCostFor, dnaScoreFor, makeSample, needsMoreTests, type DnaDesign } from '../../src/sim/dna';
import { makeSim } from './helpers';

const design = (over: Partial<DnaDesign> = {}): DnaDesign => ({ sensor: 'light', fn: 'photosynthesis', sw: 'onDetect', ...over });

describe('laboratorio: ADN de papel', () => {
  it('cada jornada tiene su problema y la mejor respuesta es sensor + función que coinciden', () => {
    expect(Object.keys(DNA_PROBLEMS).sort()).toEqual(['hielo-lunar', 'huerto-lunar', 'paneles-solares']);
    for (const p of Object.values(DNA_PROBLEMS)) {
      const best = dnaScore({ sensor: p.sensor, fn: p.fn, sw: 'onDetect' }, p);
      for (const sensor of ['light', 'radiation', 'temperature'] as const) {
        for (const fn of ['pigment', 'photosynthesis', 'oxygen'] as const) expect(dnaScore({ sensor, fn, sw: 'onDetect' }, p)).toBeLessThanOrEqual(best + 1e-9);
      }
    }
  });

  it('la función solo ayuda si el sensor coincide', () => {
    const p = DNA_PROBLEMS['paneles-solares']; // radiación
    expect(dnaFit({ sensor: 'light', fn: 'pigment', sw: 'always' }, p)).toBeLessThan(dnaFit({ sensor: 'radiation', fn: 'pigment', sw: 'always' }, p));
  });

  it('«solo cuando detecta» paga el 40 % del costo y «siempre encendido» el completo', () => {
    expect(dnaCost(design({ sw: 'always' }))).toBeCloseTo(0.15);
    expect(dnaCost(design({ sw: 'onDetect' }))).toBeCloseTo(0.06);
    expect(dnaEfficiency(design({ sw: 'always' }))).toBe(0);
    expect(dnaEfficiency(design({ sw: 'onDetect' }))).toBeGreaterThan(0.5);
  });

  it('el taller es opcional y solo ayuda: la cosecha queda entre ×1 y ×1,25', () => {
    expect(dnaBonus(0)).toBeCloseTo(1);
    expect(dnaBonus(1)).toBeCloseTo(1.25);
    expect(dnaBonus(-3)).toBeCloseTo(1);
    expect(dnaBonus(9)).toBeCloseTo(1.25);
  });
});

describe('laboratorio: biofirmas', () => {
  it('con vida las tres pruebas coinciden; sin vida el espectro coincide pero las otras dos no', () => {
    let alive = 0;
    for (let seed = 1; seed < 60; seed++) {
      const s = makeSample(seed, false);
      expect(s.result.spectrum).toBe(true); // los orgánicos solos no prueban vida
      expect(s.result.repeat).toBe(s.alive);
      expect(s.result.control).toBe(s.alive);
      if (s.alive) alive++;
    }
    expect(alive).toBeGreaterThan(5);
    expect(alive).toBeLessThan(55);
    expect(BIO_TESTS).toHaveLength(3);
  });

  it('Comandante ofrece más huellas y la respuesta cae dentro', () => {
    const e = makeSample(5, false);
    const i = makeSample(5, true);
    expect(i.options).toBeGreaterThan(e.options);
    expect(i.answer).toBeGreaterThanOrEqual(0);
    expect(i.answer).toBeLessThan(i.options);
  });

  it('el puntaje queda entre 0 y 1; informar con una sola prueba pide más pruebas', () => {
    const s = makeSample(3, false);
    expect(bioScore(s, s.answer, 3, s.alive)).toBeCloseTo(1);
    expect(bioScore(s, -1, 0, !s.alive)).toBe(0);
    expect(needsMoreTests(1)).toBe(true);
    expect(needsMoreTests(2)).toBe(false);
  });
});

describe('cepas', () => {
  const p = DNA_PROBLEMS['huerto-lunar'];
  const good: DnaDesign = { sensor: p.sensor, fn: p.fn, sw: 'onDetect' };
  it('la cepa ideal para el problema puntúa más que una inadecuada', () => {
    const ideal = STRAINS.find((s) => s.good === p.sensor)!;
    const other = STRAINS.find((s) => s.good !== p.sensor)!;
    expect(dnaScoreFor(good, p, ideal)).toBeGreaterThan(dnaScoreFor(good, p, other));
  });
  it('el puntaje queda entre 0 y 1', () => {
    for (const s of STRAINS) expect(dnaScoreFor(good, p, s)).toBeLessThanOrEqual(1);
    for (const s of STRAINS) expect(dnaScoreFor({ sensor: 'light', fn: 'oxygen', sw: 'always' } as DnaDesign, p, s)).toBeGreaterThanOrEqual(0);
  });
  it('el costo escala con la cepa', () => {
    expect(dnaCostFor(good, STRAINS[0])).toBeLessThan(dnaCostFor(good, STRAINS[2]));
  });
});

describe('cepa legendaria Aurora', () => {
  it('solo un diseño perfecto (sensor, función, cepa e interruptor «solo cuando detecta») la desbloquea', () => {
    const p = DNA_PROBLEMS['huerto-lunar'];
    const brisa = STRAINS.find((s) => s.id === 'brisa')!;
    const polar = STRAINS.find((s) => s.id === 'polar')!;
    expect(isLegendaryBuild({ sensor: 'light', fn: 'photosynthesis', sw: 'onDetect' }, p, brisa)).toBe(true);
    expect(isLegendaryBuild({ sensor: 'light', fn: 'photosynthesis', sw: 'always' }, p, brisa)).toBe(false);
    expect(isLegendaryBuild({ sensor: 'light', fn: 'photosynthesis', sw: 'onDetect' }, p, polar)).toBe(false);
    expect(isLegendaryBuild({ sensor: 'radiation', fn: 'photosynthesis', sw: 'onDetect' }, p, brisa)).toBe(false);
  });

  it('se gana una sola vez y cura la radiación cuando llega a 60', () => {
    const sim = makeSim({ drain: 0 });
    expect(sim.grantLegendary()).toBe(true);
    expect(sim.grantLegendary()).toBe(false);
    sim.res.radiation = 65;
    sim.tick(0.1);
    const ev = sim.drainEvents().find((e) => e.type === 'legendaryUsed');
    expect(ev).toBeTruthy();
    expect(sim.res.radiation).toBeCloseTo(25, 0);
    sim.res.radiation = 80;
    sim.tick(0.1);
    expect(sim.drainEvents().some((e) => e.type === 'legendaryUsed')).toBe(false); // un solo uso
  });
});
