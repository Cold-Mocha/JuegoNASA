import { EN } from '../i18n/en';

/**
 * Idiomas del juego. El español es el idioma de origen: los textos del código y de los datos quedan en español
 * y se traducen al inglés con el diccionario `src/i18n/en.ts` (la clave es el texto en español).
 * Si falta una traducción, se muestra el español: el juego nunca se rompe, y `tests/unit/i18n.test.ts`
 * avisa qué textos de los datos aún no tienen inglés.
 *
 * - `t()` traduce un texto al momento de dibujarlo (escenas, HTML).
 * - `localize()` traduce de una vez todos los textos de un objeto de datos (módulos `src/data/*`).
 * - Cambiar de idioma guarda la preferencia y recarga la página: así todos los datos quedan en el mismo idioma.
 *
 * Este módulo es puro (sin Phaser ni estado del juego) para poder probarlo en Node.
 */
export type Lang = 'es' | 'en';
export const LANGS: readonly Lang[] = ['es', 'en'];

/** Clave de localStorage de los ajustes (la usa también `state.ts`). */
export const SETTINGS_KEY = 'michinautas:settings:v1';

export const isLang = (v: unknown): v is Lang => v === 'es' || v === 'en';

/** Idioma del navegador: inglés si empieza con "en", español en cualquier otro caso. */
export function detectLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'es';
  return nav.toLowerCase().startsWith('en') ? 'en' : 'es';
}

/** Idioma guardado en los ajustes (si el storage está bloqueado o corrupto, se usa el del navegador). */
function initialLang(): Lang {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;
    const saved = raw ? (JSON.parse(raw) as { lang?: unknown }).lang : undefined;
    if (isLang(saved)) return saved;
  } catch {
    /* sin storage: seguimos con el idioma del navegador */
  }
  return detectLang();
}

let current: Lang = initialLang();

export const getLang = (): Lang => current;

export function setLang(lang: Lang): void {
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

const fill = (text: string, params?: Record<string, string | number>): string =>
  params ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m)) : text;

/** Traduce un texto en español. `{nombre}` se reemplaza con `params.nombre`. */
export function t(source: string, params?: Record<string, string | number>): string {
  return fill(current === 'en' ? (EN[source] ?? source) : source, params);
}

/** ¿Existe traducción al inglés para este texto? (para las pruebas de cobertura) */
export const hasEnglish = (source: string): boolean => source in EN;

/** Traduce todos los textos (hojas string) de un dato; ids, colores y números pasan sin cambios porque no están en el diccionario. */
export function localizeTo<T>(value: T, lang: Lang): T {
  if (typeof value === 'string') return (lang === 'en' ? (EN[value] ?? value) : value) as T;
  if (Array.isArray(value)) return value.map((v) => localizeTo(v, lang)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localizeTo(v, lang)])) as T;
  }
  return value;
}

/** Traduce un dato al idioma actual (se evalúa una vez al cargar el módulo: por eso cambiar de idioma recarga la página). */
export const localize = <T>(value: T): T => localizeTo(value, current);
