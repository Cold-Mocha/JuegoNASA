import { describe, expect, it } from 'vitest';
import { ACTIONS, GROW_LIGHTS_AT_DUSK, LIGHT_BY_DAY, PASSIVE_PER_DAY, SHELTER_FACTOR, EARTH_MOON_ROUND_TRIP_SEC, ACTION_COOLDOWN_SEC } from '../../src/sim/rules';
import { flareDose } from '../../src/sim/flares';
import type { ActionId, SimEvent } from '../../src/sim/types';
import { DAY, flare, goTo, makeSim, run } from './helpers';

const types = (evs: SimEvent[]): string[] => evs.map((e) => e.type);

describe('consumo pasivo y calendario lunar', () => {
  it('una jornada consume lo que dice el diseño v2', () => {
    const sim = makeSim();
    const start = { ...sim.res };
    run(sim, DAY * 0.999, 0.1);
    expect(sim.res.energy).toBeCloseTo(start.energy + PASSIVE_PER_DAY.energy, 0);
    expect(sim.res.oxygen).toBeCloseTo(start.oxygen + PASSIVE_PER_DAY.oxygen, 0);
  });

  it('el multiplicador de dificultad escala el consumo', () => {
    const easy = makeSim({ drain: 0.5 });
    run(easy, DAY * 0.999, 0.1);
    expect(easy.res.oxygen).toBeCloseTo(70 + PASSIVE_PER_DAY.oxygen * 0.5, 0);
  });

  it('la luz sigue el calendario: 3 de día, 1 atardecer, 3 de noche', () => {
    const sim = makeSim({ drain: 0 });
    const light: number[] = [];
    for (let d = 1; d <= 7; d++) {
      light.push(sim.light);
      sim.tick(DAY);
    }
    expect(light).toEqual([...LIGHT_BY_DAY]);
  });

  it('emite dayStart y degrada la antena al cerrar la jornada', () => {
    const sim = makeSim({ drain: 0 });
    sim.tick(DAY + 0.1);
    const evs = sim.drainEvents();
    expect(evs).toContainEqual({ type: 'dayStart', day: 2, light: 1 });
    expect(sim.comp.antenna).toBeLessThan(1);
  });

  it('dt negativo o nulo no avanza el tiempo', () => {
    const sim = makeSim();
    sim.tick(0);
    sim.tick(-5);
    expect(sim.time).toBe(0);
  });
});

describe('ninguna decisión es gratis', () => {
  it('toda acción tiene un costo', () => {
    for (const [id, rule] of Object.entries(ACTIONS) as [ActionId, (typeof ACTIONS)[ActionId]][]) {
      expect(Object.keys(rule.cost).length, id).toBeGreaterThan(0);
    }
  });

  it('limpiar el aire: +15 de soporte vital por −6 energía', () => {
    const sim = makeSim();
    goTo(sim, 'enfermeria'); goTo(sim, 'comunicaciones'); goTo(sim, 'soporte');
    const before = { ...sim.res };
    const d = sim.act('recycleAir');
    expect(d).toMatchObject({ energy: -6, oxygen: 15 });
    expect(sim.res.oxygen).toBeCloseTo(before.oxygen + 15, 5);
    expect(sim.res.energy).toBeCloseTo(before.energy - 6, 5);
  });

  it('orientar paneles da energía según la luz, a cambio de radiación', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'exterior');
    expect(sim.preview('orientPanels')).toMatchObject({ energy: 20, radiation: 3 });
    sim.tick(DAY * 3);
    expect(sim.preview('orientPanels')).toMatchObject({ energy: 10 }); // atardecer
  });

  it('las luces de las algas dan soporte vital ya y más al cierre de la jornada', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'enfermeria'); goTo(sim, 'comunicaciones'); goTo(sim, 'esclusa'); goTo(sim, 'invernadero');
    const life = sim.res.oxygen;
    sim.act('growLights');
    expect(sim.res.oxygen).toBe(life + 10);
    sim.tick(DAY);
    expect(sim.res.oxygen).toBe(life + 10 + GROW_LIGHTS_AT_DUSK.oxygen);
  });
});

describe('reglas de cada acción', () => {
  it('solo se actúa en la sala correcta y sin estar caminando', () => {
    const sim = makeSim();
    expect(sim.canAct('recycleAir')).toEqual({ ok: false, reason: 'busy' });
    const secs = sim.travel('soporte');
    expect(sim.canAct('recycleAir').reason).toBe('busy');
    sim.tick(secs + 0.1);
    expect(sim.canAct('recycleAir').ok).toBe(true);
  });

  it('sin energía suficiente no se puede', () => {
    const sim = makeSim();
    sim.res.energy = 3;
    goTo(sim, 'soporte');
    expect(sim.canAct('recycleAir')).toEqual({ ok: false, reason: 'noEnergy' });
    expect(sim.act('recycleAir')).toBeNull();
  });

  it('de noche los paneles no producen', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'exterior');
    sim.tick(DAY * 5);
    expect(sim.canAct('orientPanels')).toEqual({ ok: false, reason: 'night' });
  });

  it('el pronóstico requiere enlace y llega tras la demora real Tierra–Luna', () => {
    const sim = makeSim({ drain: 0, events: [flare(1, 20), flare(2, 6), flare(4, 1)] });
    goTo(sim, 'exterior'); goTo(sim, 'puente');
    sim.comp.antenna = 0.2;
    expect(sim.canAct('forecast').reason).toBe('noLink');
    sim.comp.antenna = 1;
    sim.act('forecast');
    expect(sim.forecastValid).toBe(false);
    expect(sim.canAct('forecast').reason).toBe('cooldown');
    sim.tick(EARTH_MOON_ROUND_TRIP_SEC + 0.01);
    expect(sim.drainEvents()).toContainEqual({ type: 'actionResolved', action: 'forecast', message: 'forecastReady' });
    expect(sim.forecast.map((e) => e.day)).toEqual([1, 2]); // hoy y mañana, no la jornada 4
  });

  it('alinear la antena la deja al 100 % tras la respuesta', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'comunicaciones');
    sim.comp.antenna = 0.3;
    sim.act('alignAntenna');
    expect(sim.comp.antenna).toBe(0.3);
    sim.tick(3);
    expect(sim.comp.antenna).toBe(1);
  });

  it('una salida al exterior por jornada; siempre da 2 de ciencia', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'esclusa');
    expect(sim.act('eva')).toMatchObject({ science: 2, oxygen: -10 });
    sim.tick(4);
    expect(sim.canAct('eva').reason).toBe('evaDone');
    sim.tick(DAY);
    sim.comp.antenna = 0.3;
    expect(sim.preview('eva').science).toBe(2);
    sim.res.oxygen = 5;
    expect(sim.canAct('eva').reason).toBe('noLife');
  });

  it('salir durante una llamarada triplica la radiación del traje', () => {
    const sim = makeSim({ drain: 0, events: [flare(1, 1)] });
    goTo(sim, 'esclusa');
    expect(sim.preview('eva').radiation).toBe(18);
  });

  it('las acciones tienen enfriamiento', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'soporte');
    sim.act('recycleAir');
    expect(sim.canAct('recycleAir').reason).toBe('cooldown');
    sim.tick(ACTION_COOLDOWN_SEC + 0.01);
    expect(sim.canAct('recycleAir').ok).toBe(true);
  });

  it('dentro de la nave está protegido; afuera no', () => {
    const sim = makeSim({ drain: 0 });
    expect(sim.sheltered).toBe(true);
    sim.enter('exterior', 'surface');
    expect(sim.sheltered).toBe(false);
    sim.enter('invernadero', 'greenhouse');
    expect(sim.sheltered).toBe(false);
    sim.enter(null, 'ship');
    expect(sim.sheltered).toBe(true);
  });

  it('caminar libre: en el pasillo no se actúa; al entrar a una sala, sí', () => {
    const sim = makeSim({ drain: 0 });
    sim.enter(null);
    expect(sim.inHall).toBe(true);
    expect(sim.canAct('recycleAir').reason).toBe('busy');
    sim.enter('soporte');
    expect(sim.inHall).toBe(false);
    expect(sim.room).toBe('soporte');
    expect(sim.canAct('recycleAir').ok).toBe(true);
  });

  it('el traje gasta oxígeno en la superficie y se recarga adentro; vacío = rescate', () => {
    const sim = makeSim({ drain: 1 });
    sim.enter('exterior', 'surface');
    run(sim, 10, 0.1);
    expect(sim.suit).toBeLessThan(100);
    sim.enter('invernadero', 'greenhouse');
    run(sim, 5, 0.1);
    expect(sim.suit).toBe(100);
    sim.enter('exterior', 'surface');
    const life = sim.res.oxygen;
    run(sim, 60, 0.1);
    expect(sim.room).toBe('esclusa');
    expect(sim.res.oxygen).toBeLessThan(life);
  });

  it('travel ignora destinos inválidos', () => {
    const sim = makeSim();
    expect(sim.travel('puente')).toBe(0);
    sim.travel('enfermeria');
    expect(sim.travel('soporte')).toBe(0);
  });
});

describe('llamaradas reales', () => {
  it('el blindaje deja pasar solo el 10 %', () => {
    const open = makeSim({ drain: 0, events: [flare(1, 2, 'X9.3')] });
    const safe = makeSim({ drain: 0, events: [flare(1, 2, 'X9.3')] });
    open.enter('exterior', 'surface');
    run(open, 20, 0.05);
    run(safe, 20, 0.05);
    const total = flareDose('X9.3', false);
    const bg = 2 * (20 / DAY);
    expect(open.res.radiation).toBeCloseTo(total + bg, 0); // afuera de la nave
    expect(safe.res.radiation).toBeCloseTo((total + bg) * SHELTER_FACTOR, 0);
    expect(safe.stats.shelteredFlares).toBe(1);
    expect(open.stats.unshieldedFlares).toBe(1);
  });

  it('emite flareStart (marcando si fue pronosticada) y flareEnd', () => {
    const sim = makeSim({ drain: 0, events: [flare(1, 3)] });
    run(sim, 20, 0.05);
    const evs = sim.drainEvents();
    expect(types(evs)).toEqual(expect.arrayContaining(['flareStart', 'flareEnd']));
    expect(evs.find((e) => e.type === 'flareStart')).toMatchObject({ forecasted: false });
  });
});

describe('envíos de la Tierra (power-up con costo de oportunidad)', () => {
  it('llegan en la jornada 3 si la antena está bien, y se elige solo una caja', () => {
    const sim = makeSim({ drain: 0, seed: 1 });
    sim.tick(DAY * 2 - 1);
    sim.comp.antenna = 1;
    sim.tick(1.1);
    expect(sim.resupplyOpen).toBe(true);
    const life = sim.res.oxygen;
    expect(sim.chooseResupply('oxygen')).toBe(true);
    expect(sim.res.oxygen).toBe(life + 25);
    expect(sim.chooseResupply('energy')).toBe(false);
  });

  it('se pierden si la antena está desalineada', () => {
    const sim = makeSim({ drain: 0 });
    sim.tick(DAY * 2 - 1);
    sim.comp.antenna = 0.3;
    sim.tick(1.1);
    expect(sim.resupplyOpen).toBe(false);
    expect(types(sim.drainEvents())).toContain('resupplyMissed');
  });
});

describe('fin de misión', () => {
  it('sin soporte vital termina con causa "oxygen"', () => {
    const sim = makeSim();
    sim.res.oxygen = 0.01;
    run(sim, 2, 0.25);
    expect(sim.ended).toBe('lost');
    expect(sim.cause).toBe('oxygen');
    expect(types(sim.drainEvents())).toContain('gameOver');
    expect(sim.summary().won).toBe(false);
  });

  it('radiación al 100 % termina con causa "radiation"', () => {
    const sim = makeSim({ drain: 0 });
    sim.res.radiation = 100;
    run(sim, 1, 0.25);
    expect(sim.cause).toBe('radiation');
  });

  it('se acaba el plazo con tareas pendientes = "timeout"', () => {
    const sim = makeSim({ drain: 0, tasks: [{ id: 't', kind: 'science', count: 99 }] });
    sim.tick(DAY * 7 + 1);
    expect(sim.cause).toBe('timeout');
  });

  it('avisa una sola vez cuando un recurso entra en estado crítico', () => {
    const sim = makeSim();
    sim.res.oxygen = 21;
    run(sim, 10, 0.25);
    run(sim, 10, 0.25);
    expect(sim.drainEvents().filter((e) => e.type === 'critical' && e.resource === 'oxygen')).toHaveLength(1);
  });

  it('completar las 7 jornadas gana la misión', () => {
    const sim = makeSim({ drain: 0 });
    sim.tick(DAY * 7 + 1);
    expect(sim.ended).toBe('won');
    expect(sim.summary()).toMatchObject({ won: true, daysSurvived: 7 });
    expect(sim.act('forecast')).toBeNull();
    sim.tick(5);
    expect(sim.time).toBeCloseTo(DAY * 7, 0);
  });
});
