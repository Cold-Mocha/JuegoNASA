import { describe, expect, it } from 'vitest';
import { Simulation } from '../../src/sim/simulation';
import { MISSIONS, MISSION_DAYS, missionEvents, taskRoom } from '../../src/data/missions';
import { DIFFICULTIES } from '../../src/data/difficulties';
import { travelTime } from '../../src/sim/graph';
import { computeScore } from '../../src/sim/score';
import type { ActionId, RoomId } from '../../src/sim/types';

/**
 * Prueba de balance: un "jugador bot" con estrategia razonable (protegerse de las llamaradas, mantener los
 * recursos y avanzar la investigación) debe COMPLETAR la investigación de TODAS las jornadas científicas en
 * todas las dificultades, y un jugador que no hace nada debe perder. Así comprobamos que las decisiones
 * importan y que ninguna jornada es imposible.
 */
function play(missionId: string, diffId: string, smart: boolean, seed = 3, skyFrom = missionId) {
  const m = MISSIONS.find((x) => x.id === missionId)!;
  const sky = MISSIONS.find((x) => x.id === skyFrom)!; // semana real de llamaradas de fondo
  const d = DIFFICULTIES.find((x) => x.id === diffId)!;
  const sim = new Simulation({ days: MISSION_DAYS, dayLengthSec: d.dayLengthSec, drain: d.drain, events: missionEvents(sky), seed, tasks: m.tasks });
  const step = 0.25;
  let eta = Infinity;
  let goal: { room: RoomId; action: ActionId } | null = null;
  const want = (room: RoomId, action: ActionId): boolean => {
    goal = { room, action };
    if (sim.room !== room) {
      // planificar: no salir de viaje si no alcanza a volver al Refugio antes de la próxima llamarada
      if (travelTime(sim.room, room) + travelTime(room, 'esclusa') + 4 > eta) return false;
      sim.travel(room);
      return true;
    }
    if (sim.canAct(action).ok) {
      sim.act(action);
      return true;
    }
    return false;
  };
  /** ¿Se podría hacer la acción al llegar? (sin contar dónde está el michi) */
  const doable = (action: ActionId): boolean => {
    const r = sim.canAct(action).reason;
    return !r || r === 'busy';
  };
  while (!sim.ended && sim.time < MISSION_DAYS * d.dayLengthSec + 5) {
    sim.tick(step);
    if (!smart || sim.traveling) continue;
    const next = sim.forecast[0];
    eta = next ? sim.eventTime(next) - sim.time : Infinity;
    // con una llamarada cerca, volver a la nave (adentro las paredes protegen)
    const danger = sim.flareActive || eta < travelTime(sim.room, 'esclusa') + 2;
    if (danger) {
      if (!sim.sheltered) sim.travel('esclusa');
      continue;
    }
    // compromiso: al llegar, hacer lo que vino a hacer antes de cambiar de plan
    const g = goal as { room: RoomId; action: ActionId } | null; // asignado dentro de want()
    if (g && sim.room === g.room) {
      goal = null;
      if (sim.canAct(g.action).ok) {
        sim.act(g.action);
        continue;
      }
    }
    const r = sim.res;
    if (sim.resupplyOpen) sim.chooseResupply(r.energy < r.oxygen ? 'energy' : 'oxygen');
    // 1) mantener lo básico
    if (!sim.forecastValid && !sim.isPending('forecast') && sim.comp.antenna >= 0.4 && want('puente', 'forecast')) continue;
    if (sim.comp.antenna < 0.6 && !sim.isPending('alignAntenna') && want('comunicaciones', 'alignAntenna')) continue;
    if (r.oxygen < 45 && want('soporte', 'recycleAir')) continue;
    if (sim.light > 0 && r.energy < 50 && r.radiation < 75 && want('exterior', 'orientPanels')) continue;
    // 2) avanzar la investigación: la primera tarea pendiente que se pueda hacer ahora
    const task = sim.tasks.find((t) => t.kind === 'action' && sim.taskProgress(t) < t.count && doable(t.action) && !sim.isPending(t.action)
      && (t.action !== 'eva' || (r.oxygen > 30 && r.radiation < 60)));
    if (task && task.kind === 'action' && want(taskRoom(task), task.action)) continue;
    // 3) sin tareas posibles ahora: cuidar energía mientras hay sol
    if (sim.light > 0 && r.energy < 90 && r.radiation < 70 && want('exterior', 'orientPanels')) continue;
  }
  return sim.summary();
}

describe('balance de las jornadas científicas', () => {
  for (const m of MISSIONS) {
    for (const d of DIFFICULTIES) {
      it(`${m.id} · ${d.id}: una buena estrategia completa la investigación`, () => {
        const s = play(m.id, d.id, true);
        expect(s.won, JSON.stringify(s)).toBe(true);
        expect(s.tasksDone).toBe(s.tasksTotal);
        expect(computeScore(s).stars).toBeGreaterThanOrEqual(1);
      });
    }
    it(`${m.id}: no hacer nada pierde`, () => {
      expect(play(m.id, 'piloto', false).won).toBe(false);
    });
  }

  it('la misma investigación es más difícil con el Sol de mayo de 2024 que con el de diciembre de 2019', () => {
    const rad = (sky: string) => play('hielo-lunar', 'piloto', true, 3, sky).resources.radiation;
    expect(rad('paneles-solares')).toBeGreaterThan(rad('huerto-lunar'));
  });
});
