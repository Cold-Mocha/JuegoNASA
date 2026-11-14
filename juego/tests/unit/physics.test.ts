import { describe, expect, it } from 'vitest';
import { GRAVITY, airTime, jumpHeight, maxJumpHeight } from '../../src/sim/physics';

describe('salto con gravedad real', () => {
  it('usa las gravedades de los Fact Sheets de la NASA', () => {
    expect(GRAVITY).toEqual({ earth: 9.81, moon: 1.62, mars: 3.72 });
  });

  it('en la Luna se salta ~6 veces más alto que en la Tierra', () => {
    expect(maxJumpHeight(1.8, GRAVITY.moon) / maxJumpHeight(1.8, GRAVITY.earth)).toBeCloseTo(9.81 / 1.62);
    expect(maxJumpHeight(1.8, GRAVITY.moon)).toBeCloseTo(1.0, 1);
  });

  it('la altura máxima ocurre a mitad del tiempo de vuelo y vuelve a 0 al aterrizar', () => {
    const T = airTime(1.8, GRAVITY.moon);
    expect(jumpHeight(1.8, GRAVITY.moon, T / 2)).toBeCloseTo(maxJumpHeight(1.8, GRAVITY.moon));
    expect(jumpHeight(1.8, GRAVITY.moon, T + 0.01)).toBe(0);
  });
});
