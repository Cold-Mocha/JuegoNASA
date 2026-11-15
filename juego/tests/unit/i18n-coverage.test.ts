import { describe, expect, it } from 'vitest';
import { hasEnglish, localizeTo } from '../../src/core/i18n';
import { ACTION_TEXT, BLOCK_REASON, RESOURCE_TEXT, MACHINE_INFO } from '../../src/data/actions';
import { ACHIEVEMENTS } from '../../src/data/achievements';
import { CONTROLS, POINTER_HINT } from '../../src/data/controls';
import { DIFFICULTIES } from '../../src/data/difficulties';
import { CHARACTERS } from '../../src/data/characters';
import { LAYERS, CISLUNAR } from '../../src/data/atmosphere';
import { LAUNCH_SCRIPT } from '../../src/data/launch';
import { STORY } from '../../src/data/story';
import { MISSIONS } from '../../src/data/missions';
import { CATEGORIES, ENTRIES } from '../../src/data/encyclopedia';
import { ROOMS } from '../../src/data/rooms';
import { CHAPTERS } from '../../src/data/chapters';

/** Todo texto que ve el jugador tiene su inglés (la clave es el español). Si falta, el juego mostraría español en modo English. */
const missing: string[] = [];
/** Iguales en los dos idiomas (símbolos y nombres de teclas). */
const NEUTRAL = new Set(['O₂', 'Shift', 'Esc']);
const need = (where: string, text: string | undefined): void => {
  if (text && !NEUTRAL.has(text) && !hasEnglish(text)) missing.push(`${where}: ${text.slice(0, 70)}`);
};

describe('cobertura del inglés', () => {
  it('los datos del juego están traducidos', () => {
    for (const [k, v] of Object.entries(ACTION_TEXT)) { need(`acción ${k}`, v.label); need(`acción ${k}`, v.why); }
    for (const [k, v] of Object.entries(BLOCK_REASON)) need(`bloqueo ${k}`, v);
    for (const [k, v] of Object.entries(RESOURCE_TEXT)) { need(`recurso ${k}`, v.label); need(`recurso ${k}`, v.short); }
    for (const [k, v] of Object.entries(MACHINE_INFO)) { need(`máquina ${k}`, v.body); need(`máquina ${k}`, v.read); }
    for (const [k, v] of Object.entries(ACHIEVEMENTS)) { need(`logro ${k}`, v.title); need(`logro ${k}`, v.text); }
    for (const c of CONTROLS) { need('control', c.action); need('control', c.alt); c.keys.forEach((key) => key.length > 1 && need('tecla', key)); }
    need('puntero', POINTER_HINT);
    for (const d of DIFFICULTIES) { need(`nivel ${d.id}`, d.name); need(`nivel ${d.id}`, d.description); }
    for (const c of CHARACTERS) { need(`personaje ${c.id}`, c.role); need(`personaje ${c.id}`, c.trait); }
    for (const l of [...LAYERS, CISLUNAR]) { need(`capa ${l.id}`, l.name); need(`capa ${l.id}`, l.fact); }
    for (const l of LAUNCH_SCRIPT) need('despegue', l.text);
    for (const s of STORY) { need('historia', s.text); need('historia', s.speaker); need('historia', s.note); }
    for (const m of MISSIONS) {
      for (const f of [m.name, m.question, m.brief, m.tagline, m.newObject, m.tutorial.text]) need(`jornada ${m.id}`, f);
      for (const t of m.tasks) need(`tarea ${t.id}`, t.label);
    }
    for (const [k, v] of Object.entries(CATEGORIES)) need(`categoría ${k}`, v);
    for (const e of ENTRIES) for (const f of [e.title, e.fact, e.text, e.inGame]) need(`ficha ${e.id}`, f);
    for (const r of Object.values(ROOMS)) { need(`sala ${r.id}`, r.name); r.props.forEach((p) => need(`objeto ${p.asset}`, p.name)); }
    for (const c of CHAPTERS) { need(`capítulo ${c.id}`, c.title); need(`capítulo ${c.id}`, c.from); need(`capítulo ${c.id}`, c.message); }
    expect(missing).toEqual([]);
  });

  it('el inglés de las fichas también es breve', () => {
    for (const e of localizeTo(ENTRIES, 'en')) {
      expect(e.text.length, e.id).toBeLessThanOrEqual(330);
      expect(e.fact.length, e.id).toBeLessThanOrEqual(110);
    }
  });

  it('localizeTo no toca ids, URLs ni fuentes', () => {
    const en = localizeTo(ENTRIES, 'en');
    en.forEach((e, i) => {
      expect(e.id).toBe(ENTRIES[i].id);
      expect(e.url).toBe(ENTRIES[i].url);
      expect(e.source).toBe(ENTRIES[i].source);
    });
  });
});
