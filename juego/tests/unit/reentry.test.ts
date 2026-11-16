import { describe, expect, it } from 'vitest';
import {
  BLACKOUT, ENTRY_INTERFACE, LIMITS, MAX_BANK_DEG, MAX_GAME_SECONDS, TARGET_RANGE_KM, TAEM, TIME_COMPRESSION,
  adviseBank, bandHalfWidthG, clampBank, corridorNow, createEntry, density, gravityAt, heatRateOf, inBlackout, mach,
  referenceDragG, scoreEntry, soundSpeed, stepEntry, type EntryOptions, type EntryState, type Level,
} from '../../src/sim/reentry';

const DT = 1 / 20;

/** Juega una partida completa con una función de control; devuelve el estado final. */
function fly(opts: EntryOptions, control: (s: EntryState) => number, maxSteps = 20 * 400): EntryState {
  const s = createEntry(opts);
  for (let i = 0; i < maxSteps && s.ending === 'running'; i++) stepEntry(s, control(s), DT);
  return s;
}

/** Piloto que sigue el consejo del juego con reacción lenta (0,4 s) y ruido de ±8°, como un jugador atento. */
function attentive(opts: EntryOptions, noise = 8): EntryState {
  const s = createEntry(opts);
  let rnd = opts.seed * 9301 + 49297;
  const next = (): number => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
  for (let i = 0; i < 4000 && s.ending === 'running'; i++) {
    const c = adviseBank(s) + (next() * 2 - 1) * noise;
    for (let k = 0; k < 8 && s.ending === 'running'; k++) stepEntry(s, c, DT);
  }
  return s;
}

describe('constantes y física base [MODELO / REAL]', () => {
  it('usa la interfaz de entrada del transbordador (122 km, 7,8 km/s)', () => {
    expect(ENTRY_INTERFACE.altitudeM).toBe(122_000);
    expect(ENTRY_INTERFACE.speedMS).toBe(7_800);
  });

  it('la densidad cae con la altura y la gravedad se debilita', () => {
    expect(density(0)).toBeCloseTo(1.225);
    expect(density(80_000)).toBeLessThan(density(60_000));
    expect(gravityAt(0)).toBeCloseTo(9.81);
    expect(gravityAt(122_000)).toBeLessThan(9.81);
  });

  it('el calor crece con la densidad y con la velocidad al cubo (escala √ρ·v³)', () => {
    const base = heatRateOf(density(70_000), 6_000);
    expect(heatRateOf(density(70_000), 12_000)).toBeCloseTo(base * 8, 5);
    expect(heatRateOf(density(70_000) * 4, 6_000)).toBeCloseTo(base * 2, 5);
  });

  it('Mach usa la velocidad del sonido de cada altura', () => {
    expect(soundSpeed(0)).toBe(340);
    expect(soundSpeed(30_000)).toBe(295);
    expect(soundSpeed(6_000)).toBeCloseTo(317.5);
    expect(mach(2_950, 30_000)).toBeCloseTo(10);
  });

  it('el alabeo se limita a ±80°', () => {
    expect(clampBank(200)).toBe(MAX_BANK_DEG);
    expect(clampBank(-200)).toBe(-MAX_BANK_DEG);
    expect(clampBank(12)).toBe(12);
  });

  it('el tiempo comprimido pone ~30 minutos reales en ~90 s de juego', () => {
    expect(TIME_COMPRESSION * 90).toBeGreaterThan(1_200);
    expect(TIME_COMPRESSION * 90).toBeLessThan(1_800);
  });
});

describe('perfil de arrastre de referencia y corredor', () => {
  it('sube mientras la nave se frena y nunca pasa del tope', () => {
    expect(referenceDragG(7_800)).toBeLessThan(referenceDragG(5_000));
    for (let v = 900; v <= 7_800; v += 100) {
      expect(referenceDragG(v)).toBeLessThanOrEqual(1.3 + 1e-9);
      expect(referenceDragG(v)).toBeGreaterThan(0);
    }
  });

  it('la banda del Explorador es más ancha que la del Ingeniero y la tormenta la angosta', () => {
    const ref = 0.8;
    expect(bandHalfWidthG('explorer', ref)).toBeGreaterThan(bandHalfWidthG('engineer', ref));
    expect(bandHalfWidthG('engineer', ref, 0.5)).toBeLessThan(bandHalfWidthG('engineer', ref, 0));
    expect(bandHalfWidthG('engineer', ref, 5)).toBeCloseTo(bandHalfWidthG('engineer', ref, 0.5));
  });

  it('corridorNow rodea la referencia', () => {
    const s = createEntry({ level: 'explorer', seed: 1 });
    const { refG, lowG, highG } = corridorNow(s);
    expect(lowG).toBeLessThan(refG);
    expect(highG).toBeGreaterThan(refG);
    expect(lowG).toBeGreaterThanOrEqual(0);
  });
});

describe('el apagón de plasma', () => {
  it('ocurre solo en un rango de velocidades y bajo 100 km', () => {
    expect(inBlackout(BLACKOUT.fromV - 1, 70_000)).toBe(true);
    expect(inBlackout(BLACKOUT.fromV + 500, 70_000)).toBe(false);
    expect(inBlackout(BLACKOUT.toV - 500, 50_000)).toBe(false);
    expect(inBlackout(5_000, 110_000)).toBe(false);
  });

  it('un vuelo bien guiado lo atraviesa durante ~10 a 15 s de juego', () => {
    const s = createEntry({ level: 'explorer', seed: 4 });
    let blackout = 0;
    for (let i = 0; i < 4000 && s.ending === 'running'; i++) {
      stepEntry(s, adviseBank(s), DT);
      if (s.blackout) blackout += DT;
    }
    expect(blackout).toBeGreaterThan(8);
    expect(blackout).toBeLessThan(18);
  });
});

describe('pre-bank: antes de sentir el aire no se puede inclinar', () => {
  it('el alabeo real queda casi nivelado y el reloj corre más rápido hasta que hay aire', () => {
    const s = createEntry({ level: 'explorer', seed: 1 });
    stepEntry(s, 80, 1);
    expect(s.guiding).toBe(false);
    expect(Math.abs(s.bank)).toBeLessThanOrEqual(12);
    expect(adviseBank(s)).toBe(0);
    let t = 0;
    while (!s.guiding && t < 30) { stepEntry(s, 0, DT); t += DT; }
    expect(s.guiding).toBe(true);
    expect(t).toBeLessThan(10);
  });
});

describe('quien no hace nada pierde (como pide balance.test.ts para las jornadas)', () => {
  for (const level of ['explorer', 'engineer'] as Level[]) {
    it(`${level}: alas niveladas todo el tiempo → pasa de largo`, () => {
      const s = fly({ level, seed: 3 }, () => 0);
      expect(s.ending).toBe('long');
      expect(scoreEntry(s).stars).toBe(0);
      expect(scoreEntry(s).quality).toBeLessThanOrEqual(0.35);
    });

    it(`${level}: un alabeo fijo no controla el rumbo → se sale del corredor`, () => {
      for (const bank of [30, 52, -52]) {
        const s = fly({ level, seed: 3 }, () => bank);
        expect(s.ending).toBe('offcourse');
      }
    });
  }

  it('en picada (alabeo máximo) la fuerza g rompe el límite', () => {
    const s = fly({ level: 'engineer', seed: 3 }, () => 80);
    expect(s.ending).toBe('overstress');
  });
});

describe('quien juega con atención lo completa', () => {
  it('siguiendo el consejo con reacción lenta y ruido, en las dos dificultades y varias semillas', () => {
    for (const level of ['explorer', 'engineer'] as Level[]) {
      for (let seed = 1; seed <= 8; seed++) {
        const s = attentive({ level, seed });
        expect(s.ending, `${level} semilla ${seed}`).toBe('success');
        const r = scoreEntry(s);
        expect(r.quality).toBeGreaterThan(0.55);
        expect(r.stars).toBeGreaterThanOrEqual(1);
        expect(Math.abs(r.rangeErrorPct)).toBeLessThan(8);
      }
    }
  });

  it('con calidad de un niño promedio (0,7) se completa: la tarea sigue siendo ganable', () => {
    const results = Array.from({ length: 8 }, (_, i) => scoreEntry(attentive({ level: 'explorer', seed: i + 1 }, 12)));
    expect(results.every((r) => r.ending === 'success')).toBe(true);
    expect(results.reduce((a, r) => a + r.quality, 0) / results.length).toBeGreaterThan(0.6);
  });

  it('el consejo invierte el alabeo (giro en S) cuando el rumbo llega al borde', () => {
    const s = createEntry({ level: 'explorer', seed: 1 });
    s.guiding = true;
    s.heading = (LIMITS.headingDeg * 0.9 * Math.PI) / 180;
    expect(adviseBank(s)).toBeLessThan(0);
    s.heading = (-LIMITS.headingDeg * 0.9 * Math.PI) / 180;
    expect(adviseBank(s)).toBeGreaterThan(0);
  });

  it('el calor y la distancia terminan dentro de lo previsto', () => {
    const s = attentive({ level: 'explorer', seed: 2 });
    expect(s.heat).toBeLessThan(LIMITS.heatCapacity);
    expect(s.range).toBeGreaterThan(TARGET_RANGE_KM * 0.92);
    expect(s.range).toBeLessThan(TARGET_RANGE_KM * 1.08);
    expect(s.v).toBeLessThanOrEqual(TAEM.speedMS);
  });
});

describe('daños de la inspección y tormenta geomagnética', () => {
  it('cada daño sin reparar sube el calor (15 % cada uno)', () => {
    const clean = attentive({ level: 'engineer', seed: 2 });
    const damaged = attentive({ level: 'engineer', seed: 2, damage: 2 });
    expect(damaged.heat).toBeGreaterThan(clean.heat * 1.2);
    expect(damaged.damageMult).toBeCloseTo(1.3);
  });

  it('los daños y la tormenta se limitan a su rango', () => {
    expect(createEntry({ level: 'engineer', seed: 1, damage: 99 }).damageMult).toBeCloseTo(1.6);
    expect(createEntry({ level: 'engineer', seed: 1, storm: 9 }).stormBoost).toBeCloseTo(1.5);
    expect(createEntry({ level: 'engineer', seed: 1, damage: -3, storm: -1 }).stormBoost).toBe(1);
  });

  it('con tormenta la atmósfera alta es más densa: el vuelo cambia', () => {
    const calm = attentive({ level: 'engineer', seed: 5 });
    const storm = attentive({ level: 'engineer', seed: 5, storm: 0.5 });
    expect(storm.peakHeat).not.toBeCloseTo(calm.peakHeat, 3);
  });

  it('un daño grande junto con un vuelo en picada quema el escudo', () => {
    const s = fly({ level: 'engineer', seed: 3, damage: 4 }, (st) => (st.guiding ? 65 : 0));
    expect(['burned', 'offcourse', 'overstress']).toContain(s.ending);
    const burn = createEntry({ level: 'engineer', seed: 1 });
    burn.heat = LIMITS.heatCapacity - 0.0001;
    stepEntry(burn, 0, 1);
    expect(burn.ending).toBe('burned');
  });
});

describe('desenlaces especiales', () => {
  it('rebotar en la atmósfera termina la fase', () => {
    const s = createEntry({ level: 'explorer', seed: 1 });
    s.guiding = true;
    s.h = LIMITS.skipAltitudeM + 1_000;
    stepEntry(s, 0, DT);
    expect(s.ending).toBe('skipped');
    expect(scoreEntry(s).stars).toBe(0);
  });

  it('llegar corto: frenar demasiado pronto', () => {
    const s = createEntry({ level: 'explorer', seed: 1 });
    s.guiding = true;
    s.v = TAEM.speedMS - 1;
    s.range = TARGET_RANGE_KM * 0.8;
    s.heading = 0;
    stepEntry(s, 0, DT);
    expect(s.ending).toBe('short');
  });

  it('el tiempo máximo cuenta como pasar de largo', () => {
    const s = createEntry({ level: 'explorer', seed: 1 });
    s.t = MAX_GAME_SECONDS;
    s.range = TARGET_RANGE_KM;
    stepEntry(s, 0, DT);
    expect(s.ending).toBe('long');
  });

  it('una vez terminada, la partida ya no avanza; dt ≤ 0 no hace nada', () => {
    const s = createEntry({ level: 'explorer', seed: 1 });
    stepEntry(s, 0, 0);
    expect(s.t).toBe(0);
    s.ending = 'short';
    const t = s.t;
    stepEntry(s, 10, 1);
    expect(s.t).toBe(t);
  });

  it('el alabeo real sigue al pedido con velocidad limitada (no es instantáneo)', () => {
    const s = createEntry({ level: 'explorer', seed: 1 });
    s.guiding = true;
    stepEntry(s, 60, DT);
    expect(s.bank).toBeGreaterThan(0);
    expect(s.bank).toBeLessThan(5);
  });
});

describe('calidad y estrellas', () => {
  it('estrellas: 1 por completar, 2 con escudo y g dentro de límites, 3 con calidad ≥ 0,8 e inspección', () => {
    const ok = attentive({ level: 'explorer', seed: 8 }, 0);
    const r = scoreEntry(ok);
    expect(r.ending).toBe('success');
    expect(r.stars).toBeGreaterThanOrEqual(2);
    expect(scoreEntry(ok, { inspected: false }).stars).toBeLessThanOrEqual(2);
    const hot = { ...ok, heat: 90 } as EntryState;
    expect(scoreEntry(hot).stars).toBe(1);
  });

  it('un fracaso nunca pasa de 0,35 de calidad ni da estrellas', () => {
    const s = fly({ level: 'explorer', seed: 3 }, () => 0);
    const r = scoreEntry(s);
    expect(r.ending).not.toBe('success');
    expect(r.quality).toBeLessThanOrEqual(0.35);
    expect(r.stars).toBe(0);
  });

  it('sin tiempo guiado el corredor vale 0 y el resultado es válido', () => {
    const r = scoreEntry(createEntry({ level: 'explorer', seed: 1 }));
    expect(r.corridor).toBe(0);
    expect(r.quality).toBeGreaterThanOrEqual(0);
    expect(r.quality).toBeLessThanOrEqual(1);
  });
});

describe('determinismo', () => {
  it('misma semilla y mismos controles = mismo vuelo; otra semilla = otro vuelo', () => {
    const a = attentive({ level: 'engineer', seed: 11 }, 0);
    const b = attentive({ level: 'engineer', seed: 11 }, 0);
    const c = attentive({ level: 'engineer', seed: 12 }, 0);
    expect(a.range).toBeCloseTo(b.range, 6);
    expect(a.heat).toBeCloseTo(b.heat, 6);
    expect(c.range).not.toBeCloseTo(a.range, 3);
  });
});
