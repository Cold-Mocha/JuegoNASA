import { describe, expect, it } from 'vitest';
import { FLARE_DURATION_SEC, FLARE_MIN_GAP_SEC, FLARE_WARNING_SEC } from '../../src/sim/rules';
import { flare, makeSim } from './helpers';

describe('separación entre llamaradas', () => {
  it('entre el fin de una y el primer aviso de la siguiente pasan al menos FLARE_MIN_GAP_SEC', () => {
    const events = [flare(1, 1), flare(1, 1.1), flare(1, 1.2), flare(3, 2)];
    const sim = makeSim({ events });
    const lead = Math.max(FLARE_WARNING_SEC.forecasted, FLARE_WARNING_SEC.unforecasted);
    for (let i = 1; i < events.length; i++) {
      const endPrev = sim.eventTime(events[i - 1]) + FLARE_DURATION_SEC;
      const warnNext = sim.eventTime(events[i]) - lead;
      expect(warnNext - endPrev).toBeGreaterThanOrEqual(FLARE_MIN_GAP_SEC - 1e-9);
    }
  });

  it('una llamarada aislada conserva su hora real', () => {
    const e = flare(2, 6);
    expect(makeSim({ events: [e] }).eventTime(e)).toBeCloseTo((2 - 1 + 6 / 24) * 40);
  });
});
