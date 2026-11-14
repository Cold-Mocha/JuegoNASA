import { describe, expect, it } from 'vitest';
import { flareDose, mapFlaresToDays, parseFlareClass, peakFlux, severity } from '../../src/sim/flares';

describe('clases de llamaradas GOES', () => {
  it('interpreta la clase', () => {
    expect(parseFlareClass('X9.3')).toEqual({ letter: 'X', magnitude: 9.3 });
    expect(parseFlareClass(' m5.5 ')).toEqual({ letter: 'M', magnitude: 5.5 });
  });

  it('rechaza formatos inválidos', () => {
    expect(() => parseFlareClass('Z1')).toThrow();
    expect(() => parseFlareClass('X')).toThrow();
  });

  it('cada letra es 10× la anterior (X1 = 1e-4 W/m²)', () => {
    expect(peakFlux('X1.0')).toBeCloseTo(1e-4);
    expect(peakFlux('M1.0')).toBeCloseTo(1e-5);
    expect(peakFlux('C1.0')).toBeCloseTo(1e-6);
    expect(peakFlux('X9.3') / peakFlux('X1.0')).toBeCloseTo(9.3);
  });
});

describe('dosis de juego', () => {
  it('crece con la clase', () => {
    const doses = ['C5.0', 'M1.0', 'M5.5', 'X1.0', 'X9.3'].map((c) => flareDose(c, false));
    for (let i = 1; i < doses.length; i++) expect(doses[i]).toBeGreaterThan(doses[i - 1]);
  });

  it('una tormenta de partículas (SEP) suma 50 %', () => {
    expect(flareDose('X8.2', true)).toBe(Math.round(flareDose('X8.2', false) * 1.5));
  });

  it('ninguna llamarada sola es letal sin protección (< 100)', () => {
    expect(flareDose('X9.3', true)).toBeLessThan(100);
  });

  it('clasifica la severidad', () => {
    expect(severity('C2.0')).toBe('minor');
    expect(severity('M5.5')).toBe('moderate');
    expect(severity('X1.0')).toBe('moderate');
    expect(severity('X9.0')).toBe('severe');
  });
});

describe('línea de tiempo de la misión', () => {
  const flares = [
    { peakTime: '2017-09-06T12:02:00Z', classType: 'X9.3', sep: false },
    { peakTime: '2017-09-04T20:33:00Z', classType: 'M5.5', sep: true },
    { peakTime: '2017-09-20T00:00:00Z', classType: 'X1.0', sep: false },
  ];

  it('ubica cada llamarada en su jornada y hora UTC reales, ordenadas', () => {
    const ev = mapFlaresToDays(flares, '2017-09-04', 7);
    expect(ev).toHaveLength(2);
    expect(ev[0]).toMatchObject({ day: 1, classType: 'M5.5', sep: true });
    expect(ev[0].hour).toBeCloseTo(20.55, 2);
    expect(ev[1]).toMatchObject({ day: 3, classType: 'X9.3' });
    expect(ev[1].hour).toBeCloseTo(12.033, 2);
  });
});
