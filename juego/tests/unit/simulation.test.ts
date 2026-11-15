import { describe, expect, it } from 'vitest';
import {
  ACTIONS, ACTION_COOLDOWN_SEC, BREACH_CHANCE, EVA_FACTOR, MAX_PER_DAY, PANEL_REGEN_PER_DAY, PASSIVE_PER_DAY, SHELTER_FACTOR, quality,
} from '../../src/sim/rules';
import type { ActionId, SimEvent } from '../../src/sim/types';
import { DAY, flare, goTo, makeSim, run } from './helpers';

const types = (evs: SimEvent[]): string[] => evs.map((e) => e.type);

describe('recursos y calendario', () => {
  it('con los paneles limpios la energía se renueva y el oxígeno también; la comida baja', () => {
    const sim = makeSim({ drain: 1 });
    sim.res.energy = 50;
    sim.res.oxygen = 50;
    const food = sim.res.food;
    run(sim, DAY * 0.999, 0.1);
    expect(sim.res.energy).toBeGreaterThan(50);                       // +generación −consumo
    expect(sim.res.oxygen).toBeGreaterThan(50);
    expect(sim.res.food).toBeCloseTo(food + PASSIVE_PER_DAY.food, 0);
  });

  it('dt negativo o nulo no avanza el tiempo', () => {
    const sim = makeSim();
    sim.tick(0);
    sim.tick(-5);
    expect(sim.time).toBe(0);
  });

  it('emite dayStart y degrada la antena y los paneles al cerrar la jornada', () => {
    const sim = makeSim({ drain: 0 });
    sim.tick(DAY + 0.1);
    expect(sim.drainEvents()).toContainEqual({ type: 'dayStart', day: 2, light: 1 });
    expect(sim.comp.antenna).toBeLessThan(1);
    expect(sim.comp.dust).toBeGreaterThan(0);
  });
});

describe('ninguna decisión es gratis', () => {
  it('toda acción tiene un costo', () => {
    for (const [id, rule] of Object.entries(ACTIONS) as [ActionId, (typeof ACTIONS)[ActionId]][]) {
      expect(Object.keys(rule.cost).length, id).toBeGreaterThan(0);
    }
  });

  it('cosechar: la comida ganada escala con lo logrado en el minijuego', () => {
    const full = makeSim({ drain: 0 });
    goTo(full, 'invernadero');
    full.res.food = 10;
    expect(full.act('harvest', 1)).toMatchObject({ food: ACTIONS.harvest.gain.food });
    const half = makeSim({ drain: 0 });
    goTo(half, 'invernadero');
    half.res.food = 10;
    half.act('harvest', 0.5);
    expect(half.res.food).toBeCloseTo(10 + (ACTIONS.harvest.gain.food ?? 0) * 0.5, 0);
  });

  it('limpiar el polvo deja los paneles limpios; solo se puede en la superficie', () => {
    const sim = makeSim({ drain: 0 });
    sim.comp.dust = 0.8;
    expect(sim.canAct('cleanDust').reason).toBe('busy');
    sim.enter('exterior', 'surface');
    expect(sim.act('cleanDust')).not.toBeNull();
    expect(sim.comp.dust).toBe(0);
  });

  it('reparar la antena la deja al 100 % tras la demora de la respuesta', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'exterior');
    sim.comp.antenna = 0.3;
    sim.act('repairAntenna');
    expect(sim.comp.antenna).toBe(0.3);
    sim.tick(3);
    expect(sim.comp.antenna).toBe(1);
  });

  it('las acciones tienen enfriamiento', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'enfermeria');
    sim.act('heal');
    expect(sim.canAct('heal').reason).toBe('cooldown');
    sim.tick(ACTION_COOLDOWN_SEC + 0.01);
    expect(sim.canAct('heal').ok).toBe(true);
  });

  it('salir durante una llamarada multiplica la radiación', () => {
    const sim = makeSim({ drain: 0, events: [flare(1, 1)] });
    sim.enter('exterior', 'surface');
    run(sim, 2, 0.1);
    expect(sim.preview('eva').radiation).toBe((ACTIONS.eva.cost.radiation ?? 0) * EVA_FACTOR);
  });
});

describe('límite por día de las acciones de cada investigación', () => {
  it('las luces de las algas, la cosecha y las muestras de hielo se hacen una vez por jornada', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'invernadero');
    sim.act('growLights');
    sim.tick(ACTION_COOLDOWN_SEC + 0.1);
    expect(sim.canAct('growLights').reason).toBe('doneToday');
    sim.res.energy = 90;
    sim.act('harvest');
    sim.tick(ACTION_COOLDOWN_SEC + 0.1);
    expect(sim.canAct('harvest').reason).toBe('doneToday'); // la cosecha también es una vez por jornada
    sim.tick(DAY); // jornada siguiente
    expect(sim.canAct('growLights').ok).toBe(true);
    expect(sim.canAct('harvest').ok).toBe(true);
  });

  it('el panel de pruebas se mide una vez por jornada y no limpia los paneles de la estación', () => {
    const sim = makeSim({ drain: 0 });
    sim.enter('exterior', 'surface');
    sim.comp.dust = 0.7;
    sim.testDirty = true; // una tormenta de polvo ensució el panel
    sim.act('cleanTestPanel');
    expect(sim.comp.dust).toBe(0.7);
    sim.tick(ACTION_COOLDOWN_SEC + 0.1);
    expect(sim.canAct('cleanTestPanel').reason).toBe('doneToday');
    expect(sim.canAct('cleanDust').ok).toBe(true);
  });
});

describe('calidad de los minijuegos y bicicleta', () => {
  it('la calidad va de 0,4 a 1: jugar mal nunca regala ni deja en cero', () => {
    expect(quality(0)).toBeCloseTo(0.4);
    expect(quality(1)).toBe(1);
    expect(quality(2)).toBe(1);
    expect(quality(-1)).toBeCloseTo(0.4);
  });

  it('pedalear da energía según la calidad, cuesta comida y se limita por día', () => {
    const sim = makeSim({ drain: 0 });
    goTo(sim, 'puente');
    sim.res.energy = 20;
    const food = sim.res.food;
    sim.act('pedal', 0.5);
    expect(sim.res.energy).toBeCloseTo(20 + (ACTIONS.pedal.gain.energy ?? 0) * 0.5, 0);
    expect(sim.res.food).toBe(food + (ACTIONS.pedal.cost.food ?? 0)); // el costo no se escala
    for (let i = 1; i < (MAX_PER_DAY.pedal ?? 1); i++) {
      sim.tick(ACTION_COOLDOWN_SEC + 0.1);
      sim.act('pedal');
    }
    sim.tick(ACTION_COOLDOWN_SEC + 0.1);
    expect(sim.canAct('pedal').reason).toBe('doneToday');
    sim.tick(DAY);
    expect(sim.canAct('pedal').ok).toBe(true);
  });

  it('la bicicleta sirve (palpita) cuando falta energía', () => {
    const sim = makeSim({ drain: 0 });
    expect(sim.useful('pedal')).toBe(false); // energía llena
    sim.res.energy = 50;
    expect(sim.useful('pedal')).toBe(true);
  });
});

describe('paneles solares', () => {
  it('con polvo suficiente fallan: avisan y la energía empieza a bajar; limpiarlos lo arregla', () => {
    const sim = makeSim({ drain: 1 });
    expect(sim.panelsOk).toBe(true);
    sim.comp.dust = 1;
    expect(sim.panelEfficiency).toBeLessThan(0.5);
    sim.res.energy = 80;
    run(sim, DAY * 0.5, 0.1);
    expect(types(sim.drainEvents())).toContain('panelsFailing');
    expect(sim.res.energy).toBeLessThan(80);
    sim.enter('exterior', 'surface');
    sim.act('cleanDust');
    sim.tick(0.1);
    expect(types(sim.drainEvents())).toContain('panelsRestored');
    expect(PANEL_REGEN_PER_DAY * sim.panelEfficiency).toBeGreaterThan(-PASSIVE_PER_DAY.energy);
  });
});

describe('fractura del casco', () => {
  it('sin fractura el oxígeno se regenera; con fractura se escapa y baja claramente (el traje se recarga igual dentro de la nave)', () => {
    const ok = makeSim({ drain: 1 });
    ok.res.oxygen = 50;
    run(ok, DAY * 0.5, 0.1);
    expect(ok.res.oxygen).toBeGreaterThan(50);

    const broken = makeSim({ drain: 1 });
    broken.breach = 'soporte';
    broken.res.oxygen = 50;
    broken.suit = 40;
    run(broken, DAY * 0.5, 0.1);
    expect(broken.res.oxygen).toBeLessThan(40);   // baja bastante más que solo el consumo normal
    expect(broken.suit).toBe(100);
  });

  it('sellar la fractura en su sala la elimina y el oxígeno vuelve a regenerarse', () => {
    const sim = makeSim({ drain: 1 });
    sim.breach = 'soporte';
    expect(sim.canAct('repair').reason).toBe('busy'); // no estás en Soporte vital
    goTo(sim, 'soporte');
    sim.act('repair');
    expect(sim.breach).toBeNull();
    expect(types(sim.drainEvents())).toContain('breachRepaired');
    sim.res.oxygen = 50;
    run(sim, DAY * 0.5, 0.1);
    expect(sim.res.oxygen).toBeGreaterThan(50);
  });

  it('puede abrirse una fractura al empezar una jornada (probabilidad BREACH_CHANCE)', () => {
    expect(BREACH_CHANCE).toBeGreaterThan(0);
    let opened = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const sim = makeSim({ drain: 0, seed });
      sim.tick(DAY * 3 + 0.1);
      if (sim.drainEvents().some((e) => e.type === 'breachOpened')) opened++;
    }
    expect(opened).toBeGreaterThan(0);
  });
});

describe('llamaradas y protección', () => {
  it('dentro de la nave la radiación se reduce a SHELTER_FACTOR', () => {
    const inside = makeSim({ drain: 0, events: [flare(1, 1)] });
    const outside = makeSim({ drain: 0, events: [flare(1, 1)] });
    outside.enter('exterior', 'surface');
    run(inside, DAY * 0.5, 0.1);
    run(outside, DAY * 0.5, 0.1);
    expect(inside.res.radiation).toBeLessThan(outside.res.radiation * (SHELTER_FACTOR + 0.05));
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
    run(sim, 60, 0.1);
    expect(sim.room).toBe('esclusa');
  });
});

describe('la salud baja por falta de oxígeno o comida y por radiación alta', () => {
  it('con oxígeno o comida en 0 la salud baja; con 1 todavía no', () => {
    const ok = makeSim({ drain: 1 });
    ok.res.oxygen = 1;
    ok.res.food = 1;
    run(ok, DAY * 0.05, 0.1);
    expect(ok.res.health).toBe(100);
    const bad = makeSim({ drain: 1 });
    bad.breach = 'soporte'; // sin fractura el oxígeno se regenera solo y no se queda en 0
    bad.res.oxygen = 0;
    run(bad, DAY * 0.2, 0.1);
    expect(bad.res.health).toBeLessThan(100);
  });

  it('con radiación sobre 50 % la salud baja de a poco, y más rápido mientras más alta', () => {
    const low = makeSim({ drain: 1 });
    low.res.radiation = 40;
    run(low, DAY * 0.5, 0.1);
    expect(low.res.health).toBe(100); // hasta 50 no pasa nada
    const mid = makeSim({ drain: 1 });
    mid.res.radiation = 60;
    run(mid, DAY * 0.5, 0.1);
    const high = makeSim({ drain: 1 });
    high.res.radiation = 90;
    run(high, DAY * 0.5, 0.1);
    expect(mid.res.health).toBeLessThan(100);
    expect(high.res.health).toBeLessThan(mid.res.health);
  });

  it('la radiación no baja nunca', () => {
    const sim = makeSim({ drain: 1 });
    sim.res.radiation = 30;
    run(sim, DAY * 2, 0.25);
    expect(sim.res.radiation).toBeGreaterThanOrEqual(30);
  });
});

describe('tareas en dos etapas: "Avisar a la Tierra" solo se desbloquea al terminar las demás', () => {
  const tasks = [
    { id: 'a', kind: 'action' as const, action: 'heal' as const, count: 1 },
    { id: 'b', kind: 'action' as const, action: 'repairAntenna' as const, count: 1, stage: 2 as const },
  ];

  it('la antena está bloqueada hasta cumplir la etapa 1; al cumplirla avisa y se puede usar', () => {
    const sim = makeSim({ drain: 0, tasks });
    goTo(sim, 'exterior');
    expect(sim.stage2Unlocked).toBe(false);
    expect(sim.canAct('repairAntenna').reason).toBe('locked');
    expect(sim.available('repairAntenna')).toBe(false);
    goTo(sim, 'enfermeria');
    sim.act('heal');
    expect(sim.stage2Unlocked).toBe(true);
    expect(types(sim.drainEvents())).toContain('stageUnlocked');
    goTo(sim, 'exterior');
    expect(sim.canAct('repairAntenna').ok).toBe(true);
    expect(sim.ended).toBeNull(); // todavía falta avisar a la Tierra
    sim.act('repairAntenna');
    expect(sim.ended).toBe('won');
  });
});

describe('fin de la misión', () => {
  it('con salud 0 la tripulación vuelve a la Tierra con la causa que estaba en peligro', () => {
    const sim = makeSim({ drain: 1 });
    sim.res.food = 0;
    sim.res.health = 0.01;
    run(sim, 1, 0.1);
    expect(sim.ended).toBe('lost');
    expect(sim.cause).toBe('food');
  });

  it('cumplir todas las tareas gana', () => {
    const sim = makeSim({ drain: 0, tasks: [{ id: 't1', kind: 'action', action: 'heal', count: 1 }] });
    goTo(sim, 'enfermeria');
    sim.act('heal');
    expect(sim.ended).toBe('won');
  });
});
