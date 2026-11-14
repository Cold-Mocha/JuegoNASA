import { describe, expect, it } from 'vitest';
import { MISSIONS, MISSION_DAYS, missionEvents } from '../../src/data/missions';
import { DAY, makeSim, run } from './helpers';

describe('balance básico', () => {
  it('no hacer nada pierde antes del plazo (los recursos se acaban)', () => {
    for (const m of MISSIONS) {
      const sim = makeSim({ days: MISSION_DAYS, dayLengthSec: DAY, drain: 1, events: missionEvents(m), tasks: m.tasks, seed: 3 });
      run(sim, DAY * MISSION_DAYS + 5, 0.25);
      expect(sim.ended, m.id).toBe('lost');
    }
  });
});
