import { describe, expect, it } from 'vitest';
import { travelTime } from '../../src/sim/graph';
import { Pool } from '../../src/sim/pool';
import { between, createRng } from '../../src/sim/rng';
import { ROOM_IDS } from '../../src/data/rooms';

describe('tiempo de caminata entre salas', () => {
  it('cuesta según la distancia real del plano: Energía queda más lejos del Refugio que el Puente', () => {
    expect(travelTime('puente', 'exterior')).toBeGreaterThan(travelTime('puente', 'puente'));
    expect(travelTime('puente', 'puente')).toBeGreaterThan(1);
    expect(travelTime('puente', 'comunicaciones')).toBeLessThan(10);
  });

  it('es simétrico y toda sala se alcanza', () => {
    for (const a of ROOM_IDS) for (const b of ROOM_IDS) {
      expect(travelTime(a, b)).toBeCloseTo(travelTime(b, a), 0);
      if (a !== b) expect(travelTime(a, b)).toBeGreaterThan(0);
    }
  });

  it('misma sala = 0 s', () => {
    expect(travelTime('puente', 'puente')).toBe(0);
  });
});

describe('object pool', () => {
  it('reutiliza objetos liberados en vez de crear nuevos', () => {
    let created = 0;
    const pool = new Pool(() => ({ id: ++created, used: false }), (o) => (o.used = false), 2);
    const a = pool.acquire()!;
    pool.release(a);
    const b = pool.acquire()!;
    expect(b).toBe(a);
    expect(created).toBe(1);
  });

  it('respeta el máximo y cuenta activos/libres', () => {
    const pool = new Pool(() => ({}), () => undefined, 2);
    const a = pool.acquire()!;
    pool.acquire();
    expect(pool.acquire()).toBeNull();
    expect(pool.activeCount).toBe(2);
    pool.release(a);
    pool.release(a); // doble liberación se ignora
    expect(pool.freeCount).toBe(1);
    expect(pool.activeCount).toBe(1);
  });

  it('llama a reset al liberar', () => {
    const pool = new Pool(() => ({ v: 0 }), (o) => (o.v = 0));
    const o = pool.acquire()!;
    o.v = 5;
    pool.release(o);
    expect(o.v).toBe(0);
  });
});

describe('rng con semilla', () => {
  it('es determinista y está en [0, 1)', () => {
    const a = createRng(42), b = createRng(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('between respeta el rango', () => {
    const r = createRng(1);
    for (let i = 0; i < 50; i++) {
      const v = between(r, [0.1, 0.2]);
      expect(v).toBeGreaterThanOrEqual(0.1);
      expect(v).toBeLessThanOrEqual(0.2);
    }
  });
});
