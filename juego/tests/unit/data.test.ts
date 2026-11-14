import { describe, expect, it } from 'vitest';
import { DONKI_ARCHIVE } from '../../src/data/donki-archive';
import { MISSIONS, MISSION_DAYS, archiveFor, missionEvents, realDate, sourceCredit, taskRoom } from '../../src/data/missions';
import { ENTRIES, entryForRoom } from '../../src/data/encyclopedia';
import { DIFFICULTIES } from '../../src/data/difficulties';
import { ROOM_IDS } from '../../src/data/rooms';
import { parseFlareClass } from '../../src/sim/flares';

/** Auditoría científica automática: datos bien formados y fuentes solo oficiales. */
const OFFICIAL = /^https:\/\/([a-z0-9-]+\.)*(nasa\.gov|esa\.int|noaa\.gov|caltech\.edu|dlr\.de)\//;

describe('archivo DONKI', () => {
  it('cada semana tiene 7 días, fuente oficial y llamaradas válidas dentro de la semana', () => {
    for (const w of DONKI_ARCHIVE) {
      const days = (Date.parse(w.endDate) - Date.parse(w.startDate)) / 86_400_000 + 1;
      expect(days, w.id).toBe(MISSION_DAYS);
      expect(w.reference, w.id).toMatch(OFFICIAL);
      for (const f of w.flares) {
        expect(() => parseFlareClass(f.classType)).not.toThrow();
        expect(Number.isNaN(Date.parse(f.peakTime))).toBe(false);
        expect(f.peakTime >= w.startDate && f.peakTime < `${w.endDate}T24`).toBe(true);
      }
    }
  });

  it('cada jornada apunta a una semana existente y todas sus llamaradas caen en la jornada', () => {
    for (const m of MISSIONS) {
      expect(missionEvents(m)).toHaveLength(archiveFor(m).flares.length);
    }
    expect(() => archiveFor({ ...MISSIONS[0], archiveId: 'nope' })).toThrow();
  });

  it('nunca presenta datos guardados como "en vivo"', () => {
    for (const m of MISSIONS) expect(sourceCredit(m)).toMatch(/no en vivo/);
    expect(sourceCredit(MISSIONS[0])).toMatch(/NASA \/ NOAA/);
  });

  it('muestra la fecha real de cada jornada', () => {
    const sep = MISSIONS.find((m) => m.archiveId === 'sep-2017')!;
    expect(realDate(sep, 3)).toMatch(/6/);
    expect(realDate(sep, 3)).toMatch(/2017/);
  });
});

describe('jornadas científicas', () => {
  it('cada una tiene una pregunta y entre 3 y 5 tareas con ids únicos y textos breves', () => {
    const ids = MISSIONS.flatMap((m) => m.tasks.map((t) => t.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MISSIONS) {
      expect(m.question.endsWith('?'), m.id).toBe(true);
      expect(m.tasks.length, m.id).toBeGreaterThanOrEqual(3);
      expect(m.tasks.length, m.id).toBeLessThanOrEqual(5);
      for (const t of m.tasks) {
        expect(t.label.length, t.id).toBeLessThanOrEqual(48);
        expect(t.count, t.id).toBeGreaterThan(0);
      }
    }
  });

  it('se pueden completar: no piden más llamaradas que las de su semana ni más salidas que días', () => {
    for (const m of MISSIONS) {
      for (const t of m.tasks) {
        if (t.kind === 'shelter') expect(t.count, t.id).toBeLessThanOrEqual(archiveFor(m).flares.length);
        if (t.kind === 'action' && t.action === 'eva') expect(t.count, t.id).toBeLessThanOrEqual(MISSION_DAYS);
        if (t.kind === 'action' && t.action === 'orientPanels') expect(t.count, t.id).toBeLessThanOrEqual(4); // hay sol solo 4 días
      }
    }
  });

  it('cada tarea dice en qué sala se avanza', () => {
    for (const m of MISSIONS) for (const t of m.tasks) expect(ROOM_IDS).toContain(taskRoom(t));
  });
});

describe('Archivo Científico', () => {
  it('ids únicos y fuentes oficiales HTTPS', () => {
    expect(new Set(ENTRIES.map((e) => e.id)).size).toBe(ENTRIES.length);
    for (const e of ENTRIES) expect(e.url, e.id).toMatch(OFFICIAL);
  });

  it('textos breves (legibles para 7–12 años)', () => {
    for (const e of ENTRIES) {
      expect(e.text.length, e.id).toBeLessThanOrEqual(260);
      expect(e.fact.length, e.id).toBeLessThanOrEqual(90);
    }
  });

  it('cubre los datos reales que pide el desafío', () => {
    const ids = ENTRIES.map((e) => e.id);
    for (const required of ['moon-gravity', 'mars-gravity', 'moon-radiation', 'donki', 'comm-delay', 'osdr', 'webb', 'voyager', 'perseverance', 'artemis', 'kuiper', 'lagrange', 'exoplanets'])
      expect(ids).toContain(required);
  });

  it('las salas con dato real tienen su "¿Sabías qué?"', () => {
    for (const room of ['esclusa', 'enfermeria', 'comunicaciones', 'puente', 'exterior', 'invernadero'] as const) expect(entryForRoom(room)).toBeDefined();
    expect(ROOM_IDS).toHaveLength(7);
  });
});

describe('curva de dificultad', () => {
  it('cada nivel es más exigente que el anterior', () => {
    for (let i = 1; i < DIFFICULTIES.length; i++) {
      expect(DIFFICULTIES[i].drain).toBeGreaterThan(DIFFICULTIES[i - 1].drain);
      expect(DIFFICULTIES[i].dayLengthSec).toBeLessThan(DIFFICULTIES[i - 1].dayLengthSec);
    }
  });
});
