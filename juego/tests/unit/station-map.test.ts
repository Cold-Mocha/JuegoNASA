import { describe, expect, it } from 'vitest';
import {
  HALLS, MAP_H, MAP_W, ROOM_RECTS, WALL_H, findRoute, isWalkable, moveOnMap, roomAt, roomCenter, roomEntrances, routeLength,
  type Point,
} from '../../src/sim/stationMap';
import { ROOM_IDS, ROOMS, propPosition } from '../../src/data/rooms';

/** ¿La recta entre a y b queda entera dentro de zonas caminables? (muestreo cada 10 px) */
function segmentWalkable(a: Point, b: Point): boolean {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 10);
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, steps);
    if (!isWalkable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
  }
  return true;
}

describe('plano continuo de la estación', () => {
  it('todas las salas y su pared caben en el mapa', () => {
    for (const id of ROOM_IDS) {
      const r = ROOM_RECTS[id];
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y - WALL_H).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(MAP_W);
      expect(r.y + r.h).toBeLessThanOrEqual(MAP_H);
      expect(roomAt(roomCenter(id))).toBe(id);
    }
  });

  it('cada sala tiene una entrada caminable desde un pasillo', () => {
    for (const id of ROOM_IDS) {
      const doors = roomEntrances(id);
      expect(doors.length).toBeGreaterThan(0);
      for (const d of doors) expect(isWalkable(d)).toBe(true);
    }
  });

  it('los pasillos quedan dentro del mapa', () => {
    for (const h of HALLS) {
      expect(h.x).toBeGreaterThanOrEqual(0);
      expect(h.x + h.w).toBeLessThanOrEqual(MAP_W);
      expect(h.y + h.h).toBeLessThanOrEqual(MAP_H);
    }
  });

  it('hay ruta caminable entre el centro de cualquier par de salas', () => {
    for (const a of ROOM_IDS) for (const b of ROOM_IDS) {
      const from = roomCenter(a);
      const route = findRoute(from, roomCenter(b));
      expect(route.length).toBeGreaterThan(0);
      route.forEach((p, i) => expect(segmentWalkable(i === 0 ? from : route[i - 1], p)).toBe(true));
    }
  });

  it('lo más lejano del Refugio está al otro extremo (Energía o Comunicaciones): protegerse cuesta camino', () => {
    const from = roomCenter('puente');
    const far = ROOM_IDS.map((id) => [id, routeLength(from, findRoute(from, roomCenter(id)))] as const).sort((x, y) => y[1] - x[1]);
    expect(['exterior', 'comunicaciones']).toContain(far[0][0]);
  });

  it('las máquinas de cada sala quedan dentro de su sala y se llega caminando', () => {
    for (const id of ROOM_IDS) {
      const machines = ROOMS[id].props.filter((p) => p.kind === 'interactive');
      expect(machines.length).toBeGreaterThan(0);
      for (const p of machines) {
        const at = propPosition(id, p);
        expect(roomAt(at)).toBe(id);
        expect(findRoute(roomCenter('puente'), { x: at.x, y: at.y + 60 }).length).toBeGreaterThan(0);
      }
    }
  });

  it('fuera del mapa no hay ruta', () => {
    expect(findRoute({ x: 5, y: 5 }, roomCenter('puente'))).toEqual([]);
    expect(isWalkable({ x: 5, y: 5 })).toBe(false);
  });
});

describe('movimiento con choques', () => {
  const c = roomCenter('puente');

  it('avanza velocidad × dt y normaliza la diagonal', () => {
    expect(moveOnMap(c, { x: 1, y: 0 }, 400, 0.05).x).toBeCloseTo(c.x + 20);
    const d = moveOnMap(c, { x: 1, y: 1 }, 400, 0.05);
    expect(Math.hypot(d.x - c.x, d.y - c.y)).toBeCloseTo(20);
  });

  it('no atraviesa paredes, pero se desliza por ellas', () => {
    const r = ROOM_RECTS.puente;
    const nearTop = { x: r.x + 100, y: r.y + 40 }; // pared sólida (lejos de la entrada del pasillo)
    expect(moveOnMap(nearTop, { x: 0, y: -1 }, 400, 0.1)).toEqual(nearTop);
    const slid = moveOnMap(nearTop, { x: 1, y: -1 }, 400, 0.1);
    expect(slid.x).toBeGreaterThan(nearTop.x);
    expect(slid.y).toBe(nearTop.y);
  });

  it('esquiva obstáculos, y deja salir si ya estaba encima de uno', () => {
    const blocked = moveOnMap(c, { x: 1, y: 0 }, 400, 0.05, [{ x: c.x + 50, y: c.y, r: 40 }]);
    expect(blocked).toEqual(c);
    const out = moveOnMap(c, { x: 1, y: 0 }, 400, 0.05, [{ x: c.x, y: c.y, r: 40 }]);
    expect(out.x).toBeGreaterThan(c.x);
  });

  it('acota dt y no se mueve sin entrada', () => {
    expect(moveOnMap(c, { x: 1, y: 0 }, 400, 5).x).toBeCloseTo(c.x + 40);
    expect(moveOnMap(c, { x: 0, y: 0 }, 400, 0.016)).toEqual(c);
    expect(moveOnMap(c, { x: 1, y: 0 }, 400, -1)).toEqual(c);
  });
});

describe('rutas para caminar solo (mapa y clics)', () => {
  it('dentro de la misma sala va en línea recta', () => {
    const c = roomCenter('exterior');
    const to = { x: c.x + 100, y: c.y };
    expect(findRoute(c, to)).toEqual([to]);
  });

  it('desde el pasillo central llega a cualquier sala por caminos caminables', () => {
    const h = HALLS[0];
    const mid = { x: h.x + h.w / 2, y: h.y + h.h / 2 };
    expect(roomAt(mid)).toBeNull();
    for (const id of ROOM_IDS) {
      const route = findRoute(mid, roomCenter(id));
      expect(route.at(-1)).toEqual(roomCenter(id));
      route.forEach((p, i) => expect(segmentWalkable(i === 0 ? mid : route[i - 1], p)).toBe(true));
    }
  });
});
