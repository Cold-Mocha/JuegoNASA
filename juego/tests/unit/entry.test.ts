import { describe, expect, it } from 'vitest';
import {
  BURN_FILL_SECONDS, GLIDE_SECONDS, HEAT_LIMIT, INSPECT_GAME_SECONDS, REENTRY_SECONDS, RPM_DEG_PER_SEC, RPM_REAL_SECONDS,
  bellyFacing, burnStep, casaStars, corridorCenter, glideScore, glideStep, heatMultiplier, initialReentry, spinAngle, stepReentry,
} from '../../src/sim/entry';

describe('Fase 1: giro e inspección', () => {
  it('el giro es el real: 0,75 °/s y 480 s por vuelta; en el juego la vuelta dura 24 s', () => {
    expect(RPM_DEG_PER_SEC).toBe(0.75);
    expect(RPM_REAL_SECONDS).toBe(480);
    expect(spinAngle(INSPECT_GAME_SECONDS / 2)).toBeCloseTo(180);
    expect(spinAngle(0)).toBe(0);
  });

  it('el vientre mira a las ventanas solo a mitad de la vuelta', () => {
    expect(bellyFacing(180)).toBe(true);
    expect(bellyFacing(20)).toBe(false);
    expect(bellyFacing(330)).toBe(false);
  });

  it('cada daño sin encontrar sube el calor base', () => {
    expect(heatMultiplier(0)).toBe(1);
    expect(heatMultiplier(2)).toBeGreaterThan(heatMultiplier(1));
  });
});

describe('Fase 2: quemada', () => {
  it('alineado se llena en el tiempo previsto; desalineado se vacía más lento', () => {
    let g = 0;
    for (let t = 0; t < BURN_FILL_SECONDS + 0.1; t += 0.1) g = burnStep(g, 0, 0.1);
    expect(g).toBe(1);
    expect(burnStep(0.5, 0.5, 1)).toBeLessThan(0.5);
  });
});

describe('Fase 3: corredor de reingreso', () => {
  const run = (roll: (s: ReturnType<typeof initialReentry>) => number, mult = 1): ReturnType<typeof initialReentry> => {
    let s = initialReentry();
    const dt = 1 / 30;
    for (let t = 0; t < REENTRY_SECONDS; t += dt) s = stepReentry(s, roll(s), dt, mult);
    return s;
  };
  const tracker = (s: ReturnType<typeof initialReentry>): number => Math.max(-1, Math.min(1, (corridorCenter(s.t + 0.1) - s.x) * 8));

  it('siguiendo el corredor se queda adentro todo el tiempo y el calor queda bajo el límite', () => {
    const end = run(tracker);
    expect(end.inside / REENTRY_SECONDS).toBeGreaterThan(0.95);
    expect(end.heat).toBeLessThan(HEAT_LIMIT);
  });

  it('un bot con calidad 0,7 (sigue el corredor con retraso y error) también lo cruza sin pasarse del rojo', () => {
    const sloppy = (s: ReturnType<typeof initialReentry>): number => 0.7 * tracker(s);
    const end = run(sloppy);
    expect(end.heat).toBeLessThan(100);
    expect(end.inside / REENTRY_SECONDS).toBeGreaterThan(0.6);
  });

  it('quedarse quieto saca la nave del corredor y sube el calor', () => {
    const idle = run(() => 0);
    const good = run(tracker);
    expect(idle.inside).toBeLessThan(good.inside);
    expect(idle.heat).toBeGreaterThan(good.heat);
  });

  it('los daños sin reparar suben el calor', () => {
    expect(run(tracker, heatMultiplier(2)).heat).toBeGreaterThan(run(tracker).heat);
  });
});

describe('Fase 4: planeo', () => {
  it('sin tocar los controles se llega a la pista justo al terminar', () => {
    let alt = 1;
    for (let t = 0; t < GLIDE_SECONDS; t += 0.05) alt = glideStep(alt, 0, 0.05);
    expect(alt).toBeCloseTo(0, 1);
    expect(glideScore(alt, null)).toBeGreaterThan(0.95);
  });

  it('tocar el suelo antes de tiempo, o quedarse corto, baja el puntaje', () => {
    expect(glideScore(0, 8)).toBeLessThan(glideScore(0, 15));
    expect(glideScore(0.5, null)).toBeLessThan(0.5);
  });
});

describe('estrellas', () => {
  it('★ aterrizar · ★★ con calor bajo el límite · ★★★ además inspección completa y todas las fases con buena calidad', () => {
    const base = { inspected: 1, burn: 0.9, corridor: 0.9, heatMax: 60, glide: 0.9 };
    expect(casaStars(base)).toBe(3);
    expect(casaStars({ ...base, inspected: 0.5 })).toBe(2);
    expect(casaStars({ ...base, heatMax: 95 })).toBe(1);
  });
});
